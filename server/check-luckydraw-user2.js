const db = require('./models');

async function checkLuckyDraw() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully\n');

    const userId = 2;
    const eventId = 1;

    // 사용자 2, 이벤트 1의 모든 답변 확인
    const answers = await db.QuizAnswer.findAll({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: userId, event_id: eventId },
          attributes: ['id', 'user_id', 'event_id', 'status']
        },
        {
          model: db.Question,
          attributes: ['id', 'category', 'question_text']
        }
      ],
      attributes: ['id', 'question_id', 'is_correct', 'answer_attempt', 'answered_at'],
      order: [['answered_at', 'ASC']]
    });

    console.log(`=== 사용자 ${userId}, 이벤트 ${eventId} 답변 내역 ===`);
    console.log(`총 답변 수: ${answers.length}\n`);
    
    answers.forEach((answer, idx) => {
      console.log(`[${idx + 1}] 답변 ID: ${answer.id}`);
      console.log(`    문제 ID: ${answer.question_id}`);
      console.log(`    카테고리: ${answer.Question?.category || 'N/A'}`);
      console.log(`    정답 여부: ${answer.is_correct}`);
      console.log(`    시도 횟수: ${answer.answer_attempt}`);
      console.log(`    문제: ${answer.Question?.question_text?.substring(0, 50) || 'N/A'}...`);
      console.log('');
    });

    // 럭키드로우만 필터링
    const luckyDrawAnswers = answers.filter(a => a.Question?.category === 'luckydraw');
    console.log('\n=== 럭키드로우 답변만 ===');
    console.log(`럭키드로우 답변 수: ${luckyDrawAnswers.length}\n`);
    
    luckyDrawAnswers.forEach(answer => {
      console.log(`답변 ID: ${answer.id}`);
      console.log(`  문제 ID: ${answer.question_id}`);
      console.log(`  정답: ${answer.is_correct}`);
      console.log(`  시도: ${answer.answer_attempt}`);
      console.log(`  답변 시간: ${answer.answered_at}`);
      console.log('');
    });

    // 첫 시도에 맞춘 럭키드로우
    const firstAttemptCorrect = luckyDrawAnswers.filter(a => a.is_correct && a.answer_attempt === 1);
    console.log(`\n첫 시도에 맞춘 럭키드로우: ${firstAttemptCorrect.length}개`);

    if (firstAttemptCorrect.length > 0) {
      console.log('\n상세:');
      firstAttemptCorrect.forEach(answer => {
        console.log(`  - 답변 ID: ${answer.id}, 문제 ID: ${answer.question_id}`);
      });
    }

    // Sequelize count로 확인
    console.log('\n=== Sequelize count() 결과 ===');
    const luckyDrawCount = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: {
            user_id: userId,
            event_id: eventId
          }
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

    console.log(`Sequelize count() 결과: ${luckyDrawCount}개`);

  } catch (error) {
    console.error('에러:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkLuckyDraw();

