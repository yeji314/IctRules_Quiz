/**
 * 모든 사용자의 퀴즈 관련 데이터 완전 삭제 스크립트
 * - 모든 퀴즈 세션 삭제
 * - 모든 퀴즈 답변 삭제
 * - 모든 럭키드로우 당첨 기록 삭제
 */

require('dotenv').config();
const db = require('./models');

async function resetAllQuizData() {
  try {
    console.log('\n=== 모든 퀴즈 데이터 삭제 시작 ===\n');

    // 1. 모든 퀴즈 답변 삭제
    console.log('[1/3] 모든 퀴즈 답변 삭제 중...');
    const answersDeleted = await db.QuizAnswer.destroy({
      where: {},
      truncate: true,
      cascade: true
    });
    console.log(`✅ ${answersDeleted}개의 답변이 삭제되었습니다.`);

    // 2. 모든 럭키드로우 당첨 기록 삭제
    console.log('\n[2/3] 모든 럭키드로우 당첨 기록 삭제 중...');
    const luckyDrawsDeleted = await db.LuckyDraw.destroy({
      where: {},
      truncate: true,
      cascade: true
    });
    console.log(`✅ ${luckyDrawsDeleted}개의 당첨 기록이 삭제되었습니다.`);

    // 3. 모든 퀴즈 세션 삭제
    console.log('\n[3/3] 모든 퀴즈 세션 삭제 중...');
    const sessionsDeleted = await db.QuizSession.destroy({
      where: {},
      truncate: true,
      cascade: true
    });
    console.log(`✅ ${sessionsDeleted}개의 세션이 삭제되었습니다.`);

    // 4. 삭제 확인
    console.log('\n=== 삭제 결과 확인 ===');
    const remainingAnswers = await db.QuizAnswer.count();
    const remainingSessions = await db.QuizSession.count();
    const remainingLuckyDraws = await db.LuckyDraw.count();

    console.log(`- 남은 답변: ${remainingAnswers}개`);
    console.log(`- 남은 세션: ${remainingSessions}개`);
    console.log(`- 남은 당첨 기록: ${remainingLuckyDraws}개`);

    if (remainingAnswers === 0 && remainingSessions === 0 && remainingLuckyDraws === 0) {
      console.log('\n✅ 모든 퀴즈 데이터가 성공적으로 삭제되었습니다!');
    } else {
      console.log('\n⚠️ 일부 데이터가 남아있습니다. 다시 확인해주세요.');
    }

    console.log('\n=== 완료 ===\n');

  } catch (error) {
    console.error('\n❌ 데이터 삭제 중 오류 발생:', error);
    throw error;
  } finally {
    // 데이터베이스 연결 종료
    await db.sequelize.close();
  }
}

// 스크립트 실행
resetAllQuizData()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
