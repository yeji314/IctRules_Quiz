const db = require('./models');

async function resetUserHistory(employeeId) {
  const t = await db.sequelize.transaction();
  try {
    const user = await db.User.findOne({ where: { employee_id: employeeId }, transaction: t });
    if (!user) {
      console.log(`[reset] 사용자(${employeeId})를 찾을 수 없습니다.`);
      await t.rollback();
      process.exit(1);
    }

    // 사용자의 세션 목록 조회
    const sessions = await db.QuizSession.findAll({ where: { user_id: user.id }, transaction: t });
    const sessionIds = sessions.map(s => s.id);

    // 답변 삭제
    let deletedAnswers = 0;
    if (sessionIds.length > 0) {
      deletedAnswers = await db.QuizAnswer.destroy({ where: { session_id: sessionIds }, transaction: t });
    }

    // 세션 삭제
    const deletedSessions = await db.QuizSession.destroy({ where: { id: sessionIds }, transaction: t });

    // 럭키드로우 기록 삭제 (해당 사용자 전체 이벤트)
    const deletedLucky = await db.LuckyDraw.destroy({ where: { user_id: user.id }, transaction: t });

    await t.commit();

    console.log(`[reset] 사용자 ${employeeId} (id=${user.id}) 기록 초기화 완료`);
    console.log(` - 삭제된 답변: ${deletedAnswers}`);
    console.log(` - 삭제된 세션: ${deletedSessions}`);
    console.log(` - 삭제된 LuckyDraw: ${deletedLucky}`);
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('[reset] 오류:', err);
    process.exit(1);
  }
}

const employeeId = process.argv[2] || 'user001';
resetUserHistory(employeeId);
