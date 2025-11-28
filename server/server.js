require('dotenv').config();
const app = require('./app');
const db = require('./models');
const initAdminUser = require('./utils/initAdmin');

const PORT = process.env.PORT || 5000;

const isDev = process.env.NODE_ENV === 'development';

// 로그 레벨 함수
const log = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => { if (isDev) console.log('[DEBUG]', ...args); }
};

// 데이터베이스 연결 및 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    await db.sequelize.authenticate();
    log.info('✅ 데이터베이스 연결 성공');

    // admin 계정 자동 생성
    await initAdminUser(db);

    // 서버 시작
    app.listen(PORT, () => {
      log.info(`🚀 서버 시작: 포트 ${PORT}, 환경 ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    log.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
  log.info('서버 종료 중...');
  await db.sequelize.close();
  process.exit(0);
});

// 서버 시작
startServer();
