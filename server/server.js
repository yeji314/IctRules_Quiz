require('dotenv').config();
const app = require('./app');
const db = require('./models');
const initAdminUser = require('./utils/initAdmin');

const PORT = process.env.PORT || 5000;

// 데이터베이스 연결 및 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // 개발 환경에서만 sync (프로덕션에서는 마이그레이션 사용)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('📊 데이터베이스 동기화 완료');
    }

    // admin 계정 자동 생성
    await initAdminUser(db);

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`   환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
  console.log('\n서버를 종료합니다...');
  await db.sequelize.close();
  process.exit(0);
});

// 서버 시작
startServer();
