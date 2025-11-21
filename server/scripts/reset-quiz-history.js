/**
 * 모든 사용자의 퀴즈 이력 초기화 스크립트
 * - QuizAnswer (답변 기록) 삭제
 * - QuizSession (세션 기록) 삭제
 * - LuckyDraw (당첨 기록) 삭제
 */

const db = require('../models');

async function resetQuizHistory() {
  try {
    console.log('='.repeat(60));
    console.log('퀴즈 이력 초기화 시작...');
    console.log('='.repeat(60));

    // 1. 현재 데이터 수 확인
    const answerCount = await db.QuizAnswer.count();
    const sessionCount = await db.QuizSession.count();
    const luckyDrawCount = await db.LuckyDraw.count();

    console.log('\n[현재 상태]');
    console.log(`  - 답변 기록: ${answerCount}개`);
    console.log(`  - 세션 기록: ${sessionCount}개`);
    console.log(`  - 당첨 기록: ${luckyDrawCount}개`);

    if (answerCount === 0 && sessionCount === 0 && luckyDrawCount === 0) {
      console.log('\n✅ 이미 모든 이력이 삭제되어 있습니다.');
      process.exit(0);
    }

    // 2. 삭제 진행
    console.log('\n[삭제 진행]');
    
    // QuizAnswer 삭제
    console.log('  1. 답변 기록 삭제 중...');
    await db.QuizAnswer.destroy({ where: {}, truncate: true });
    console.log('     ✅ 답변 기록 삭제 완료');

    // QuizSession 삭제
    console.log('  2. 세션 기록 삭제 중...');
    await db.QuizSession.destroy({ where: {}, truncate: true });
    console.log('     ✅ 세션 기록 삭제 완료');

    // LuckyDraw 삭제
    console.log('  3. 당첨 기록 삭제 중...');
    await db.LuckyDraw.destroy({ where: {}, truncate: true });
    console.log('     ✅ 당첨 기록 삭제 완료');

    // 3. 최종 확인
    const finalAnswerCount = await db.QuizAnswer.count();
    const finalSessionCount = await db.QuizSession.count();
    const finalLuckyDrawCount = await db.LuckyDraw.count();

    console.log('\n[최종 결과]');
    console.log(`  - 답변 기록: ${finalAnswerCount}개`);
    console.log(`  - 세션 기록: ${finalSessionCount}개`);
    console.log(`  - 당첨 기록: ${finalLuckyDrawCount}개`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 퀴즈 이력이 성공적으로 초기화되었습니다!');
    console.log('='.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 이력 초기화 중 오류 발생:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
resetQuizHistory();

