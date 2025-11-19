/**
 * 마이그레이션 실행 스크립트
 * Docker 컨테이너 내부에서 sequelize-cli 없이 마이그레이션을 실행할 수 있습니다.
 */

const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: console.log
});

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

async function runMigrations() {
  try {
    console.log('🔄 마이그레이션 시작...');

    // 실행된 마이그레이션 확인
    const executed = await umzug.executed();
    console.log(`✅ 이미 실행된 마이그레이션: ${executed.length}개`);

    // 대기 중인 마이그레이션 확인
    const pending = await umzug.pending();
    console.log(`⏳ 대기 중인 마이그레이션: ${pending.length}개`);

    if (pending.length === 0) {
      console.log('✅ 모든 마이그레이션이 이미 실행되었습니다.');
      process.exit(0);
    }

    // 마이그레이션 실행
    const migrations = await umzug.up();
    console.log(`✅ ${migrations.length}개의 마이그레이션이 성공적으로 실행되었습니다.`);

    migrations.forEach(migration => {
      console.log(`   - ${migration.file}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigrations();
