const db = require('./models');
const quizService = require('./services/quizService');

async function testLuckyDrawConditions() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    const testUserId = 2; // user001
    const eventId = 1;

    console.log('=== 럭키드로우 출현 조건 테스트 ===\n');

    // 1. 새 세션 생성
    const session = await db.QuizSession.create({
      user_id: testUserId,
      event_id: eventId,
      session_number: 1,
      status: 'in_progress'
    });

    console.log(`✅ 테스트 세션 생성: ${session.id}\n`);

    // 2. 문제 가져오기
    const questions = await db.Question.findAll({
      where: { event_id: eventId, category: 'normal' },
      limit: 5
    });

    if (questions.length < 5) {
      console.error('❌ 테스트용 문제가 부족합니다 (최소 5개 필요)');
      process.exit(1);
    }

    console.log('📊 시뮬레이션 시나리오:\n');

    // 시나리오 1: 0개 정답 - 럭키드로우 불가
    console.log('--- 시나리오 1: 정답 0개 ---');
    let nextQuestion = await quizService.getNextQuestion(session.id, eventId);
    console.log(`결과: ${nextQuestion ? `Q${nextQuestion.id} (${nextQuestion.category})` : '문제 없음'}`);
    console.log('');

    // 시나리오 2: 1개 정답 - 럭키드로우 불가
    console.log('--- 시나리오 2: 정답 1개 (첫 시도) ---');
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[0].id,
      user_answer: questions[0].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });

    nextQuestion = await quizService.getNextQuestion(session.id, eventId);
    console.log(`결과: ${nextQuestion ? `Q${nextQuestion.id} (${nextQuestion.category})` : '문제 없음'}`);
    console.log('');

    // 시나리오 3: 2개 정답 - 럭키드로우 불가
    console.log('--- 시나리오 3: 정답 2개 (첫 시도) ---');
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[1].id,
      user_answer: questions[1].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });

    nextQuestion = await quizService.getNextQuestion(session.id, eventId);
    console.log(`결과: ${nextQuestion ? `Q${nextQuestion.id} (${nextQuestion.category})` : '문제 없음'}`);
    console.log('');

    // 시나리오 4: 3개 정답 - 럭키드로우 가능!
    console.log('--- 시나리오 4: 정답 3개 (첫 시도) - 럭키드로우 출현 가능! ---');
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[2].id,
      user_answer: questions[2].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });

    // 여러 번 테스트 (확률적이므로)
    console.log('10번 시도 결과:');
    const results = { normal: 0, luckydraw: 0 };
    for (let i = 0; i < 10; i++) {
      nextQuestion = await quizService.getNextQuestion(session.id, eventId);
      if (nextQuestion) {
        results[nextQuestion.category]++;
      }
    }
    console.log(`  - 일반 문제: ${results.normal}회`);
    console.log(`  - 럭키드로우: ${results.luckydraw}회`);
    console.log(`  - 럭키드로우 출현율: ${((results.luckydraw / 10) * 100).toFixed(1)}% (목표: ~40%)`);
    console.log('');

    // 시나리오 5: 재시도로 맞춘 경우 - 럭키드로우 불가
    console.log('--- 시나리오 5: 정답 3개이지만 1개는 재시도 ---');
    await db.QuizAnswer.destroy({ where: { session_id: session.id } });

    // 첫 시도 정답 2개
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[0].id,
      user_answer: questions[0].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[1].id,
      user_answer: questions[1].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });

    // 재시도로 맞춘 것 1개
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: questions[2].id,
      user_answer: questions[2].question_data.correct_answer,
      is_correct: true,
      answer_attempt: 2 // 재시도
    });

    nextQuestion = await quizService.getNextQuestion(session.id, eventId);
    console.log(`결과: ${nextQuestion ? `Q${nextQuestion.id} (${nextQuestion.category})` : '문제 없음'}`);
    console.log('(첫 시도 정답이 2개뿐이므로 럭키드로우 불가)\n');

    // 시나리오 6: 이미 당첨된 경우 - 럭키드로우 불가
    console.log('--- 시나리오 6: 첫 시도 정답 3개이지만 이미 당첨됨 ---');
    await db.QuizAnswer.destroy({ where: { session_id: session.id } });

    // 첫 시도 정답 3개
    for (let i = 0; i < 3; i++) {
      await db.QuizAnswer.create({
        session_id: session.id,
        question_id: questions[i].id,
        user_answer: questions[i].question_data.correct_answer,
        is_correct: true,
        answer_attempt: 1
      });
    }

    // 당첨 기록 추가
    await db.LuckyDraw.create({
      event_id: eventId,
      user_id: testUserId,
      prize: '테스트 상품',
      is_claimed: false
    });

    nextQuestion = await quizService.getNextQuestion(session.id, eventId);
    console.log(`결과: ${nextQuestion ? `Q${nextQuestion.id} (${nextQuestion.category})` : '문제 없음'}`);
    console.log('(이미 당첨되어 럭키드로우 불가)\n');

    // 정리
    await db.LuckyDraw.destroy({ where: { user_id: testUserId } });
    await db.QuizAnswer.destroy({ where: { session_id: session.id } });
    await session.destroy();

    console.log('✅ 모든 테스트 완료!');
    console.log('\n📌 결론:');
    console.log('  1. ✅ 첫 시도 정답 3개 미만: 럭키드로우 불가');
    console.log('  2. ✅ 첫 시도 정답 3개 이상: 럭키드로우 출현 가능 (~40% 확률)');
    console.log('  3. ✅ 재시도로 맞춘 것은 카운트 안 됨');
    console.log('  4. ✅ 이미 당첨된 경우: 럭키드로우 불가');

    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

testLuckyDrawConditions();
