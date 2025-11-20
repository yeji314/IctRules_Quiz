const db = require('./models');

async function resetUser19200617() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. 사용자 ID 찾기
    const user = await db.User.findOne({
      where: { employee_id: '19200617' }
    });

    if (!user) {
      console.log('❌ 사용자 19200617을 찾을 수 없습니다');
      process.exit(1);
    }

    const userId = user.id;
    console.log(`✅ 사용자 19200617 찾음 (ID: ${userId}, 이름: ${user.name})`);

    // 2. 럭키드로우 당첨 삭제
    const luckyDrawCount = await db.LuckyDraw.destroy({
      where: { user_id: userId }
    });
    console.log(`✅ 럭키드로우 당첨 ${luckyDrawCount}개 삭제`);

    // 3. 퀴즈 세션 가져오기
    const sessions = await db.QuizSession.findAll({
      where: { user_id: userId }
    });

    console.log(`📊 총 세션 수: ${sessions.length}개`);

    // 4. 각 세션의 답변 삭제
    let totalAnswers = 0;
    for (const session of sessions) {
      const answerCount = await db.QuizAnswer.destroy({
        where: { session_id: session.id }
      });
      totalAnswers += answerCount;
    }
    console.log(`✅ 퀴즈 답변 ${totalAnswers}개 삭제`);

    // 5. 퀴즈 세션 삭제
    const sessionCount = await db.QuizSession.destroy({
      where: { user_id: userId }
    });
    console.log(`✅ 퀴즈 세션 ${sessionCount}개 삭제`);

    console.log('\n✅ 사용자 19200617의 모든 퀴즈 데이터 삭제 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

resetUser19200617();
