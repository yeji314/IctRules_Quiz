const db = require('./models');
const quizService = require('./services/quizService');

async function testTypingIssue() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    const testUserId = 2;
    const eventId = 1;

    // 1. 타이핑 문제가 충분히 있는지 확인
    const typingQuestions = await db.Question.findAll({
      where: {
        event_id: eventId,
        question_type: 'typing'
      }
    });

    console.log('=== 타이핑 문제 현황 ===');
    console.log(`총 타이핑 문제: ${typingQuestions.length}개`);
    typingQuestions.forEach(q => {
      console.log(`  - Q${q.id}: ${q.category} (${q.question_text.substring(0, 50)}...)`);
    });
    console.log('');

    // 2. 세션 생성 및 타이핑 문제로 시작
    const session = await db.QuizSession.create({
      user_id: testUserId,
      event_id: eventId,
      session_number: 1,
      status: 'in_progress'
    });

    console.log(`✅ 테스트 세션 생성: ${session.id}\n`);

    // 3. 첫 번째 문제 가져오기
    console.log('--- 1번째 문제 (타이핑) ---');
    const question1 = typingQuestions[0];

    // 4. 타이핑 문제 답변 제출
    await db.QuizAnswer.create({
      session_id: session.id,
      question_id: question1.id,
      user_answer: question1.question_data.correct_answer,
      is_correct: true,
      answer_attempt: 1
    });

    console.log(`✅ 타이핑 문제 답변 제출: Q${question1.id}`);
    console.log('');

    // 5. 다음 문제 요청
    console.log('--- 다음 문제 요청 ---');
    const nextQuestion = await quizService.getNextQuestion(session.id, eventId);

    if (nextQuestion) {
      console.log(`✅ 다음 문제: Q${nextQuestion.id} (${nextQuestion.question_type}, ${nextQuestion.category})`);
    } else {
      console.log(`❌ 다음 문제 없음 - 이것이 문제!`);
      console.log('');
      console.log('🔍 원인 분석:');
      console.log('  1번 문제만 풀었는데 다음 문제가 없다고 판단');
      console.log('  → session_complete: true');
      console.log('  → "결과 보기" 버튼 표시');
      console.log('  → 5개 문제를 풀지 않아서 에러 발생');
    }

    // 정리
    await db.QuizAnswer.destroy({ where: { session_id: session.id } });
    await session.destroy();

    console.log('\n✅ 테스트 완료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

testTypingIssue();
