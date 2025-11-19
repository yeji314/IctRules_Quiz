/**
 * 데이터베이스 동기화 스크립트
 * Docker 컨테이너 내부에서 바로 실행 가능
 *
 * 사용법:
 *   docker exec -it ict-quiz-app node scripts/sync-database.js
 */

const db = require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 데이터베이스 연결 중...');

    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    console.log('🔄 테이블 동기화 중...');
    console.log('   모드: alter (기존 테이블 구조 변경)');

    await db.sequelize.sync({ alter: true });

    console.log('✅ 데이터베이스 동기화 완료!');
    console.log('\n생성된 테이블:');
    console.log('  - users');
    console.log('  - quiz_events');
    console.log('  - questions');
    console.log('  - quiz_sessions');
    console.log('  - quiz_answers');
    console.log('  - lucky_draws');
    console.log('  - sso_settings');

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 동기화 실패:', error);
    process.exit(1);
  }
}

syncDatabase();
