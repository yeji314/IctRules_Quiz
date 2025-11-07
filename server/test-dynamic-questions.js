/**
 * 동적 문제 선택 테스트 스크립트
 *
 * 이 스크립트는 다음을 검증합니다:
 * 1. 첫 3개 문제를 일반 문제로 시작
 * 2. 3개를 한번에 맞추면 4번째 문제가 럭키드로우
 * 3. 연속 럭키드로우 방지
 */

const db = require('./models');
const quizService = require('./services/quizService');

async function testDynamicQuestionSelection() {
  console.log('='.repeat(80));
  console.log('동적 문제 선택 테스트 시작');
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
      return;
    }

    console.log(`테스트 사용자: ${testUser.name} (${testUser.employee_id})`);
    console.log(`테스트 이벤트: ${testEvent.title} (ID: ${testEvent.id})\n`);

    // 기존 테스트 데이터 정리
    await db.QuizAnswer.destroy({
      where: {},
      include: [{
        model: db.QuizSession,
        where: { user_id: testUser.id, event_id: testEvent.id }
      }]
    });
    await db.QuizSession.destroy({
      where: { user_id: testUser.id, event_id: testEvent.id }
    });

    console.log('✓ 기존 테스트 데이터 정리 완료\n');

    // 시나리오: 3개를 한번에 맞추면 4번째가 럭키드로우
    console.log('='.repeat(80));
    console.log('시나리오: 한번에 3개 맞춘 후 럭키드로우 출현 테스트');
    console.log('='.repeat(80));

    // 새 세션 생성
    const session = await db.QuizSession.create({
      user_id: testUser.id,
      event_id: testEvent.id,
      session_number: 1,
      status: 'in_progress'
    });

    console.log(`\n✓ 세션 생성: ${session.id}\n`);

    const questionsInOrder = [];

    // 문제 1 - 일반 문제
    console.log('-'.repeat(80));
    console.log('문제 1');
    console.log('-'.repeat(80));

    let question1 = await quizService.getNextQuestion(session.id, testEvent.id);
    questionsInOrder.push(question1);

    console.log(`선택된 문제: Q${question1.id} (${question1.category})`);
    console.log(`문제 유형: ${question1.question_type}`);

    // 정답 처리 (한번에 맞춤)
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: question1.id,
      user_answer: 'test',
      is_correct: true,
      answer_attempt: 1
    });
    console.log('✓ 정답 처리 (첫 시도)\n');

    // 문제 2 - 일반 문제
    console.log('-'.repeat(80));
    console.log('문제 2');
    console.log('-'.repeat(80));

    let question2 = await quizService.getNextQuestion(session.id, testEvent.id);
    questionsInOrder.push(question2);

    console.log(`선택된 문제: Q${question2.id} (${question2.category})`);
    console.log(`문제 유형: ${question2.question_type}`);

    // 오답 후 정답 처리 (2번째 시도에 맞춤)
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: question2.id,
      user_answer: 'wrong',
      is_correct: false,
      answer_attempt: 1
    });
    console.log('✗ 오답 처리 (첫 시도)');

    await db.QuizAnswer.update(
      {
        user_answer: 'test',
        is_correct: true,
        answer_attempt: 2
      },
      {
        where: {
          session_id: session.id,
          question_id: question2.id
        }
      }
    );
    console.log('✓ 정답 처리 (두 번째 시도)\n');

    // 문제 3 - 일반 문제
    console.log('-'.repeat(80));
    console.log('문제 3');
    console.log('-'.repeat(80));

    let question3 = await quizService.getNextQuestion(session.id, testEvent.id);
    questionsInOrder.push(question3);

    console.log(`선택된 문제: Q${question3.id} (${question3.category})`);
    console.log(`문제 유형: ${question3.question_type}`);

    // 정답 처리 (한번에 맞춤)
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: question3.id,
      user_answer: 'test',
      is_correct: true,
      answer_attempt: 1
    });
    console.log('✓ 정답 처리 (첫 시도)\n');

    // 문제 4 - 일반 문제
    console.log('-'.repeat(80));
    console.log('문제 4');
    console.log('-'.repeat(80));

    let question4 = await quizService.getNextQuestion(session.id, testEvent.id);
    questionsInOrder.push(question4);

    console.log(`선택된 문제: Q${question4.id} (${question4.category})`);
    console.log(`문제 유형: ${question4.question_type}`);

    // 정답 처리 (한번에 맞춤) - 이제 3개를 한번에 맞춤!
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: question4.id,
      user_answer: 'test',
      is_correct: true,
      answer_attempt: 1
    });
    console.log('✓ 정답 처리 (첫 시도)');
    console.log('>>> 한번에 맞춘 문제 수: 3개 달성! <<<\n');

    // 문제 5 - **럭키드로우가 나와야 함!**
    console.log('-'.repeat(80));
    console.log('문제 5 (럭키드로우 출현 예상)');
    console.log('-'.repeat(80));

    let question5 = await quizService.getNextQuestion(session.id, testEvent.id);
    questionsInOrder.push(question5);

    console.log(`선택된 문제: Q${question5.id} (${question5.category})`);
    console.log(`문제 유형: ${question5.question_type}`);

    if (question5.category === 'luckydraw') {
      console.log('✓✓✓ 성공! 럭키드로우 문제가 선택되었습니다! ✓✓✓\n');
    } else {
      console.log('✗✗✗ 실패! 일반 문제가 선택되었습니다 ✗✗✗\n');
    }

    // 결과 요약
    console.log('='.repeat(80));
    console.log('테스트 결과 요약');
    console.log('='.repeat(80));
    console.log('\n문제 순서:');
    questionsInOrder.forEach((q, idx) => {
      const categoryLabel = q.category === 'luckydraw' ? 'LUCKY DRAW' : 'Normal';
      const categoryColor = q.category === 'luckydraw' ? '🎰' : '📝';
      console.log(`  ${idx + 1}. ${categoryColor} Q${q.id} (${categoryLabel}) - ${q.question_type}`);
    });

    // 연속 럭키드로우 체크
    let hasConsecutive = false;
    for (let i = 0; i < questionsInOrder.length - 1; i++) {
      if (questionsInOrder[i].category === 'luckydraw' && questionsInOrder[i + 1].category === 'luckydraw') {
        hasConsecutive = true;
        console.log(`\n✗ 연속 럭키드로우 발견: 위치 ${i + 1}, ${i + 2}`);
      }
    }

    if (!hasConsecutive) {
      console.log(`\n✓ 연속 럭키드로우 없음`);
    }

    // 5번째 문제 럭키드로우 체크
    if (question5.category === 'luckydraw') {
      console.log('✓ 5번째 문제가 럭키드로우 (조건 충족 후 바로 출현)');
      console.log('\n🎉 테스트 성공! 🎉');
    } else {
      console.log('✗ 5번째 문제가 일반 문제 (예상과 다름)');
      console.log('\n❌ 테스트 실패 ❌');
    }

    // 세션 삭제
    await db.QuizAnswer.destroy({ where: { session_id: session.id } });
    await session.destroy();

    console.log('\n='.repeat(80));
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
testDynamicQuestionSelection().then(() => {
  console.log('\n프로그램 종료');
  process.exit(0);
}).catch(error => {
  console.error('치명적 오류:', error);
  process.exit(1);
});
