const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/quiz.db'),
  logging: console.log
});

async function runMigration() {
  try {
    console.log('Starting migration...');

    // summary 컬럼 추가
    await sequelize.query(`
      ALTER TABLE questions ADD COLUMN summary TEXT;
    `).catch(err => {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "summary" already exists, skipping...');
      } else {
        throw err;
      }
    });

    // highlight 컬럼 추가
    await sequelize.query(`
      ALTER TABLE questions ADD COLUMN highlight VARCHAR(500);
    `).catch(err => {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "highlight" already exists, skipping...');
      } else {
        throw err;
      }
    });

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
