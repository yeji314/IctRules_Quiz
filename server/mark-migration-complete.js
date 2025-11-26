const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/quiz.db'),
  logging: console.log
});

async function markMigrationComplete() {
  try {
    console.log('Marking migration as complete...');

    // SequelizeMeta 테이블에 migration 기록 추가
    await sequelize.query(`
      INSERT OR IGNORE INTO SequelizeMeta (name)
      VALUES ('20250126000001-add-summary-highlight-to-questions.js');
    `);

    console.log('Migration marked as complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to mark migration:', error);
    process.exit(1);
  }
}

markMigrationComplete();
