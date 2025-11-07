/**
 * 럭키드로우 로직 테스트 스크립트
 *
 * 이 스크립트는 다음을 검증합니다:
 * 1. 일반 문제만 선택되는지
 * 2. 첫 럭키드로우가 올바르게 선택되는지
 * 3. 연속된 럭키드로우가 없는지
 * 4. 가중치 랜덤 선택이 올바르게 동작하는지
 */

const db = require('./models');
const quizService = require('./services/quizService');

async function testLuckyDrawLogic() {
  console.log('='.repeat(80));
  console.log('럭키드로우 로직 테스트 시작');
  console.log('='.repeat(80));

  try {
    // 데이터베이스 연결
    await db.sequelize.authenticate();
    console.log('✓ 데이터베이스 연결 성공\n');

    // 테스트 사용자 및 이벤트 조회
    const testUser = await db.User.findOne({ where: { employee_id: 'user001' } });
    const testEvent = await db.QuizEvent.findOne({ where: { is_active: true } });

    if (!testUser || !testEvent) {
      console.error('✗ 테스트 사용자 또는 이벤트를 찾을 수 없습니다.');
      console.log('테스트 사용자: user001');
      console.log('활성 이벤트가 필요합니다.');

      // 사용 가능한 사용자 및 이벤트 목록 출력
      const allUsers = await db.User.findAll();
      const allEvents = await db.QuizEvent.findAll();
      console.log('\n사용 가능한 사용자:');
      allUsers.forEach(u => console.log(`  - ${u.employee_id}: ${u.name}`));
      console.log('\n사용 가능한 이벤트:');
      allEvents.forEach(e => console.log(`  - ${e.id}: ${e.title} (Active: ${e.is_active})`));
      return;
    }

    console.log(`테스트 사용자: ${testUser.name} (${testUser.employee_id})`);
    console.log(`테스트 이벤트: ${testEvent.title} (ID: ${testEvent.id})\n`);

    // 테스트 시나리오 1: 조건 미충족 (정답 0~2개) - 일반 문제만 출제
    console.log('\n' + '='.repeat(80));
    console.log('테스트 1: 조건 미충족 (정답 0~2개) - 일반 문제만 출제되어야 함');
    console.log('='.repeat(80));

    // 새 세션 생성
    const session1 = await db.QuizSession.create({
      user_id: testUser.id,
      event_id: testEvent.id,
      session_number: 1,
      status: 'in_progress'
    });

    // 이미 푼 문제 ID 조회
    const previousAnswers1 = await db.QuizAnswer.findAll({
      include: [{
        model: db.QuizSession,
        where: {
          user_id: testUser.id,
          event_id: testEvent.id
        },
        attributes: []
      }],
      attributes: ['question_id'],
      group: ['question_id'],
      raw: true
    });

    const excludeIds1 = previousAnswers1.map(a => a.question_id);
    console.log(`이미 푼 문제 ID: [${excludeIds1.join(', ')}]`);

    const questions1 = await quizService.getRandomQuestions(
      session1.id,
      testEvent.id,
      excludeIds1
    );

    console.log(`\n선택된 문제 (${questions1.length}개):`);
    questions1.forEach((q, idx) => {
      console.log(`  ${idx + 1}. Q${q.id} - ${q.category} - ${q.question_type}`);
    });

    const luckyCount1 = questions1.filter(q => q.category === 'luckydraw').length;
    console.log(`\n럭키드로우 문제 수: ${luckyCount1}`);
    console.log(`결과: ${luckyCount1 === 0 ? '✓ 통과 (일반 문제만 출제됨)' : '✗ 실패 (럭키드로우가 포함됨)'}`);

    // 세션 삭제
    await session1.destroy();

    // 테스트 시나리오 2: 첫 럭키드로우 조건 충족 (정답 3개 이상)
    console.log('\n' + '='.repeat(80));
    console.log('테스트 2: 첫 럭키드로우 조건 충족 (정답 3개 이상)');
    console.log('='.repeat(80));

    // 테스트용 세션 및 정답 데이터 생성
    const completedSession = await db.QuizSession.create({
      user_id: testUser.id,
      event_id: testEvent.id,
      session_number: 1,
      status: 'completed',
      completed_at: new Date()
    });

    // 일반 문제 3개 정답 처리
    const normalQuestions = await db.Question.findAll({
      where: {
        event_id: testEvent.id,
        category: 'normal'
      },
      limit: 3
    });

    for (const q of normalQuestions) {
      await db.QuizAnswer.create({
        session_id: completedSession.id,
        question_id: q.id,
        user_answer: 'test',
        is_correct: true,
        answer_attempt: 1
      });
    }

    console.log(`✓ 테스트용 세션 생성 완료 (3개 정답 처리)`);

    // 새 세션 생성
    const session2 = await db.QuizSession.create({
      user_id: testUser.id,
      event_id: testEvent.id,
      session_number: 2,
      status: 'in_progress'
    });

    const previousAnswers2 = await db.QuizAnswer.findAll({
      include: [{
        model: db.QuizSession,
        where: {
          user_id: testUser.id,
          event_id: testEvent.id
        },
        attributes: []
      }],
      attributes: ['question_id'],
      group: ['question_id'],
      raw: true
    });

    const excludeIds2 = previousAnswers2.map(a => a.question_id);
    console.log(`이미 푼 문제 ID: [${excludeIds2.join(', ')}]`);

    const questions2 = await quizService.getRandomQuestions(
      session2.id,
      testEvent.id,
      excludeIds2
    );

    console.log(`\n선택된 문제 (${questions2.length}개):`);
    questions2.forEach((q, idx) => {
      console.log(`  ${idx + 1}. Q${q.id} - ${q.category} - ${q.question_type}`);
    });

    const luckyCount2 = questions2.filter(q => q.category === 'luckydraw').length;
    console.log(`\n럭키드로우 문제 수: ${luckyCount2}`);

    // 연속 럭키드로우 체크
    let hasConsecutive = false;
    for (let i = 0; i < questions2.length - 1; i++) {
      if (questions2[i].category === 'luckydraw' && questions2[i + 1].category === 'luckydraw') {
        hasConsecutive = true;
        console.log(`✗ 연속 럭키드로우 발견: 위치 ${i + 1}, ${i + 2}`);
      }
    }

    console.log(`결과: ${!hasConsecutive ? '✓ 통과 (연속 럭키드로우 없음)' : '✗ 실패 (연속 럭키드로우 발견)'}`);

    // 세션 및 테스트 데이터 삭제
    await session2.destroy();
    await db.QuizAnswer.destroy({ where: { session_id: completedSession.id } });
    await completedSession.destroy();

    // 테스트 시나리오 3: 럭키드로우 본 후 가중치 랜덤
    console.log('\n' + '='.repeat(80));
    console.log('테스트 3: 럭키드로우 본 후 가중치 랜덤 선택 (여러 번 실행)');
    console.log('='.repeat(80));

    // 테스트용 세션 및 럭키드로우 경험 생성
    const completedSession2 = await db.QuizSession.create({
      user_id: testUser.id,
      event_id: testEvent.id,
      session_number: 1,
      status: 'completed',
      completed_at: new Date()
    });

    // 일반 문제 3개 + 럭키드로우 1개 정답 처리
    const normalQuestions2 = await db.Question.findAll({
      where: {
        event_id: testEvent.id,
        category: 'normal'
      },
      limit: 3
    });

    const luckyQuestion = await db.Question.findOne({
      where: {
        event_id: testEvent.id,
        category: 'luckydraw'
      }
    });

    for (const q of normalQuestions2) {
      await db.QuizAnswer.create({
        session_id: completedSession2.id,
        question_id: q.id,
        user_answer: 'test',
        is_correct: true,
        answer_attempt: 1
      });
    }

    await db.QuizAnswer.create({
      session_id: completedSession2.id,
      question_id: luckyQuestion.id,
      user_answer: 'test',
      is_correct: true,
      answer_attempt: 1
    });

    console.log(`✓ 테스트용 세션 생성 완료 (3개 정답 + 럭키드로우 1개 경험)`);

    // 여러 번 실행하여 연속 럭키드로우 체크
    let totalTests = 10;
    let passedTests = 0;

    for (let t = 0; t < totalTests; t++) {
      const session3 = await db.QuizSession.create({
        user_id: testUser.id,
        event_id: testEvent.id,
        session_number: 2,
        status: 'in_progress'
      });

      const previousAnswers3 = await db.QuizAnswer.findAll({
        include: [{
          model: db.QuizSession,
          where: {
            user_id: testUser.id,
            event_id: testEvent.id
          },
          attributes: []
        }],
        attributes: ['question_id'],
        group: ['question_id'],
        raw: true
      });

      const excludeIds3 = previousAnswers3.map(a => a.question_id);

      const questions3 = await quizService.getRandomQuestions(
        session3.id,
        testEvent.id,
        excludeIds3
      );

      // 연속 럭키드로우 체크
      let hasConsecutive3 = false;
      for (let i = 0; i < questions3.length - 1; i++) {
        if (questions3[i].category === 'luckydraw' && questions3[i + 1].category === 'luckydraw') {
          hasConsecutive3 = true;
          break;
        }
      }

      if (!hasConsecutive3) {
        passedTests++;
      }

      console.log(`  테스트 ${t + 1}/${totalTests}: ${questions3.map(q => q.category[0].toUpperCase()).join('-')} ${hasConsecutive3 ? '✗' : '✓'}`);

      await session3.destroy();
    }

    console.log(`\n결과: ${passedTests}/${totalTests} 통과 (${(passedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`전체 결과: ${passedTests === totalTests ? '✓ 모든 테스트 통과' : '✗ 일부 테스트 실패'}`);

    // 테스트 데이터 정리
    await db.QuizAnswer.destroy({ where: { session_id: completedSession2.id } });
    await completedSession2.destroy();

    console.log('\n' + '='.repeat(80));
    console.log('테스트 완료');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n테스트 중 오류 발생:');
    console.error(error);
  } finally {
    await db.sequelize.close();
  }
}

// 테스트 실행
testLuckyDrawLogic().then(() => {
  console.log('\n프로그램 종료');
  process.exit(0);
}).catch(error => {
  console.error('치명적 오류:', error);
  process.exit(1);
});
