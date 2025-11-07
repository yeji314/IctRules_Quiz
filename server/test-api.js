const db = require('./models');
const quizService = require('./services/quizService');

async function testAPI() {
  try {
    // user004 찾기
    const user = await db.User.findOne({
      where: { employee_id: 'user004' }
    });

    if (!user) {
      console.log('❌ user004를 찾을 수 없습니다');
      process.exit(1);
    }

    console.log('✅ user004 발견:', user.employee_id, user.name);
    console.log('   User ID:', user.id);

    // getQuizListForUser 호출 (실제 API가 사용하는 함수)
    console.log('\n=== API 응답 (getQuizListForUser) ===\n');
    const quizList = await quizService.getQuizListForUser(user.id);

    quizList.forEach((quiz, idx) => {
      console.log(`퀴즈 ${idx + 1}:`);
      console.log(`  제목: ${quiz.title}`);
      console.log(`  eventId: ${quiz.eventId}`);
      console.log(`  luckyDrawCount: ${quiz.luckyDrawCount} ⭐`);
      console.log(`  totalAnswered: ${quiz.totalAnswered}`);
      console.log(`  correctCount: ${quiz.correctCount}`);
      console.log('');
    });

    // 직접 DB 쿼리로 luckyDrawCount 계산
    console.log('=== 직접 DB 쿼리로 luckyDrawCount 확인 ===\n');

    const luckyDrawCountDirect = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: user.id }
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ],
      where: {
        is_correct: true,
        answer_attempt: 1
      }
    });

    console.log('luckyDrawCount (직접 쿼리):', luckyDrawCountDirect);

    // 상세 확인
    const luckyAnswers = await db.QuizAnswer.findAll({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: user.id }
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ]
    });

    console.log('\nLUCKYDRAW 답변 상세:');
    luckyAnswers.forEach((answer, idx) => {
      console.log(`  답변 ${idx + 1}:`);
      console.log(`    is_correct: ${answer.is_correct}`);
      console.log(`    answer_attempt: ${answer.answer_attempt}`);
      console.log(`    question_id: ${answer.question_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
}

testAPI();
