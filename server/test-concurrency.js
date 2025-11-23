/**
 * LuckyDraw 동시성 테스트
 * 여러 사용자가 동시에 당첨 시도할 때 max_winners 제한이 지켜지는지 확인
 */

const db = require('./models');

// 동시 요청 시뮬레이션
async function simulateConcurrentLuckyDraw(userId, eventId, sessionId) {
  try {
    // 실제 컨트롤러 로직 복제
    const luckyDrawResult = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, async (t) => {
      // 1. 이벤트 정보 가져오기 (락 설정)
      const event = await db.QuizEvent.findByPk(eventId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다');
      }

      // 2. 현재 당첨자 수 확인
      const currentWinnerCount = await db.LuckyDraw.count({
        where: { event_id: eventId },
        transaction: t
      });

      console.log(`[사용자 ${userId}] 현재 당첨자: ${currentWinnerCount}/${event.max_winners}`);

      // 3. 최대 당첨자 수 확인
      if (currentWinnerCount >= event.max_winners) {
        console.log(`[사용자 ${userId}] ❌ 당첨자 수 초과`);
        return { won: false, reason: 'max_winners_reached', userId };
      }

      // 4. 이미 당첨된 사용자인지 확인
      const existingWin = await db.LuckyDraw.findOne({
        where: {
          user_id: userId,
          event_id: eventId
        },
        transaction: t
      });

      if (existingWin) {
        console.log(`[사용자 ${userId}] ❌ 이미 당첨됨`);
        return { won: false, reason: 'already_won', userId };
      }

      // 5. 무조건 당첨 (테스트용 - 실제는 50% 확률)
      const won = true;

      if (won) {
        await db.LuckyDraw.create({
          event_id: eventId,
          user_id: userId,
          prize: '테스트 기프티콘',
          is_claimed: false
        }, { transaction: t });

        console.log(`[사용자 ${userId}] ✅ 당첨!`);
        return { won: true, prize: '테스트 기프티콘', userId };
      }

      return { won: false, reason: 'random', userId };
    });

    return luckyDrawResult;
  } catch (error) {
    console.error(`[사용자 ${userId}] 에러:`, error.message);
    return { won: false, reason: 'error', userId, error: error.message };
  }
}

async function runConcurrencyTest() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 LuckyDraw 동시성 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 테스트 환경 초기화
    console.log('📝 테스트 환경 초기화...\n');
    
    // 기존 당첨 기록 삭제
    await db.LuckyDraw.destroy({ where: {} });
    
    // 테스트 사용자 20명 생성
    const testUsers = [];
    for (let i = 1; i <= 20; i++) {
      const [user] = await db.User.findOrCreate({
        where: { employee_id: `CONCURRENT_TEST_${i}` },
        defaults: {
          employee_id: `CONCURRENT_TEST_${i}`,
          password: 'test123',
          name: `동시테스트${i}`,
          department: 'TEST',
          position: '테스터',
          email: `concurrent${i}@test.com`,
          role: 'user'
        }
      });
      testUsers.push(user);
    }

    console.log(`✅ 테스트 사용자 ${testUsers.length}명 생성 완료\n`);

    // 2. 동시 요청 시뮬레이션
    console.log('🚀 20명이 동시에 당첨 시도 (max_winners = 10)\n');
    
    const eventId = 1; // 첫 번째 이벤트 사용
    
    // Promise.all로 동시 실행
    const startTime = Date.now();
    const results = await Promise.all(
      testUsers.map((user, index) => 
        simulateConcurrentLuckyDraw(user.id, eventId, index + 1)
      )
    );
    const endTime = Date.now();

    console.log(`\n⏱️  실행 시간: ${endTime - startTime}ms\n`);

    // 3. 결과 분석
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 결과 분석');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const wonResults = results.filter(r => r.won);
    const maxReached = results.filter(r => r.reason === 'max_winners_reached');
    const errors = results.filter(r => r.reason === 'error');

    console.log(`당첨자 수: ${wonResults.length}명`);
    console.log(`제한 도달로 탈락: ${maxReached.length}명`);
    console.log(`에러 발생: ${errors.length}건`);

    // 4. DB에서 실제 당첨자 수 확인
    const actualWinnerCount = await db.LuckyDraw.count({
      where: { event_id: eventId }
    });

    console.log(`\n💾 DB에 저장된 실제 당첨자: ${actualWinnerCount}명`);

    // 5. 검증
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 검증 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (actualWinnerCount <= 10) {
      console.log(`✅ 성공! 당첨자 수가 제한(10명) 이내입니다.`);
      console.log(`   실제 당첨자: ${actualWinnerCount}명`);
    } else {
      console.log(`❌ 실패! 당첨자 수가 제한을 초과했습니다!`);
      console.log(`   실제 당첨자: ${actualWinnerCount}명 (제한: 10명)`);
      console.log(`   초과 인원: ${actualWinnerCount - 10}명`);
    }

    // 에러 발생 시 상세 정보
    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length}건의 에러 발생:`);
      errors.forEach(e => {
        console.log(`   사용자 ${e.userId}: ${e.error}`);
      });
    }

    // 6. 정리
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 테스트 데이터 정리...');
    
    await db.LuckyDraw.destroy({ where: { event_id: eventId } });
    for (const user of testUsers) {
      await user.destroy();
    }
    
    console.log('✅ 정리 완료\n');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류:', error);
  } finally {
    process.exit(0);
  }
}

// 테스트 실행
runConcurrencyTest();

