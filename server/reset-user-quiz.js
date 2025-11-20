const db = require('./models');

async function resetUserQuiz() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const userId = 2;
    const eventId = 1;

    // 1. 럭키드로우 당첨 삭제
    await db.LuckyDraw.destroy({
      where: { user_id: userId, event_id: eventId }
    });
    console.log('✅ 럭키드로우 당첨 삭제');

    // 2. 퀴즈 답변 삭제
    const sessions = await db.QuizSession.findAll({
      where: { user_id: userId, event_id: eventId }
    });

    for (const session of sessions) {
      await db.QuizAnswer.destroy({
        where: { session_id: session.id }
      });
    }
    console.log('✅ 퀴즈 답변 삭제');

    // 3. 퀴즈 세션 삭제
    await db.QuizSession.destroy({
      where: { user_id: userId, event_id: eventId }
    });
    console.log('✅ 퀴즈 세션 삭제');

    console.log('\n✅ 사용자 2의 퀴즈 데이터 초기화 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

resetUserQuiz();
