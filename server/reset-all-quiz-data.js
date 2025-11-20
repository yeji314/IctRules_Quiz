const db = require('./models');

async function resetAllQuizData() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    console.log('⚠️  전체 퀴즈 데이터를 초기화합니다...\n');

    // 1. 럭키드로우 당첨 모두 삭제
    const luckyDrawCount = await db.LuckyDraw.destroy({
      where: {},
      truncate: true
    });
    console.log(`✅ 럭키드로우 당첨 ${luckyDrawCount}개 삭제`);

    // 2. 퀴즈 답변 모두 삭제
    const answerCount = await db.QuizAnswer.destroy({
      where: {},
      truncate: true
    });
    console.log(`✅ 퀴즈 답변 ${answerCount}개 삭제`);

    // 3. 퀴즈 세션 모두 삭제
    const sessionCount = await db.QuizSession.destroy({
      where: {},
      truncate: true
    });
    console.log(`✅ 퀴즈 세션 ${sessionCount}개 삭제`);

    console.log('\n✅ 모든 퀴즈 데이터 초기화 완료!');
    console.log('📊 사용자 계정과 문제는 유지됩니다.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

resetAllQuizData();
