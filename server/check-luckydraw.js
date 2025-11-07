const db = require('./models');

async function checkLuckyDraw() {
  try {
    console.log('=== LUCKYDRAW 문제 확인 ===\n');

    // 모든 LUCKYDRAW 문제 조회
    const luckyQuestions = await db.Question.findAll({
      where: { category: 'luckydraw' }
    });

    console.log(`총 LUCKYDRAW 문제 수: ${luckyQuestions.length}개\n`);

    // 모든 사용자의 LUCKYDRAW 답변 조회
    const allAnswers = await db.QuizAnswer.findAll({
      include: [
        {
          model: db.QuizSession,
          include: [{ model: db.User }]
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ]
    });

    console.log(`=== 모든 사용자의 LUCKYDRAW 답변 (총 ${allAnswers.length}개) ===\n`);

    if (allAnswers.length === 0) {
      console.log('⚠️  아무도 LUCKYDRAW 문제를 풀지 않았습니다!\n');
    } else {
      allAnswers.forEach((answer, idx) => {
        console.log(`답변 ${idx + 1}:`);
        console.log(`  사용자: ${answer.QuizSession.User.employee_id} (${answer.QuizSession.User.name})`);
        console.log(`  문제 ID: ${answer.question_id}`);
        console.log(`  정답 여부: ${answer.is_correct ? '✅ 맞음' : '❌ 틀림'}`);
        console.log(`  시도 횟수: ${answer.answer_attempt}`);
        console.log(`  세션 ID: ${answer.session_id}`);
        console.log('');
      });
    }

    // USER004만 확인
    console.log('=== USER004의 LUCKYDRAW 답변 ===\n');
    const user004Answers = allAnswers.filter(
      a => a.QuizSession.User.employee_id === 'USER004'
    );

    if (user004Answers.length === 0) {
      console.log('⚠️  USER004는 LUCKYDRAW 문제를 풀지 않았습니다.');

      // USER004의 모든 세션 확인
      const user004 = await db.User.findOne({ where: { employee_id: 'USER004' } });
      if (user004) {
        const sessions = await db.QuizSession.findAll({
          where: { user_id: user004.id },
          include: [{ model: db.QuizAnswer }]
        });
        console.log(`\nUSER004의 총 세션 수: ${sessions.length}개`);
        sessions.forEach((session, idx) => {
          console.log(`  세션 ${idx + 1}: ${session.QuizAnswers.length}개 답변`);
        });
      }
    } else {
      console.log(`총 ${user004Answers.length}개의 LUCKYDRAW 답변`);
      user004Answers.forEach((answer, idx) => {
        console.log(`\n답변 ${idx + 1}:`);
        console.log(`  문제 ID: ${answer.question_id}`);
        console.log(`  정답 여부: ${answer.is_correct ? '✅ 맞음' : '❌ 틀림'}`);
        console.log(`  시도 횟수: ${answer.answer_attempt}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
}

checkLuckyDraw();
