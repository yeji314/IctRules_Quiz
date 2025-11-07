const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Sequelize 인스턴스 생성 (SQLite)
const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: dbConfig.logging
});

// 모델 import
const User = require('./User')(sequelize);
const QuizEvent = require('./QuizEvent')(sequelize);
const Question = require('./Question')(sequelize);
const QuizSession = require('./QuizSession')(sequelize);
const QuizAnswer = require('./QuizAnswer')(sequelize);
const LuckyDraw = require('./LuckyDraw')(sequelize);
const SSOSettings = require('./SSOSettings')(sequelize);

// 모델 관계 설정
const db = {
  sequelize,
  Sequelize,
  User,
  QuizEvent,
  Question,
  QuizSession,
  QuizAnswer,
  LuckyDraw,
  SSOSettings
};

// User 관계
db.User.hasMany(db.QuizSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.LuckyDraw, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// QuizEvent 관계
db.QuizEvent.hasMany(db.Question, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.QuizEvent.hasMany(db.QuizSession, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.QuizEvent.hasMany(db.LuckyDraw, { foreignKey: 'event_id', onDelete: 'CASCADE' });

// QuizSession 관계
db.QuizSession.belongsTo(db.User, { foreignKey: 'user_id' });
db.QuizSession.belongsTo(db.QuizEvent, { foreignKey: 'event_id' });
db.QuizSession.hasMany(db.QuizAnswer, { foreignKey: 'session_id', onDelete: 'CASCADE' });

// Question 관계
db.Question.belongsTo(db.QuizEvent, { foreignKey: 'event_id' });
db.Question.hasMany(db.QuizAnswer, { foreignKey: 'question_id', onDelete: 'CASCADE' });

// QuizAnswer 관계
db.QuizAnswer.belongsTo(db.QuizSession, { foreignKey: 'session_id' });
db.QuizAnswer.belongsTo(db.Question, { foreignKey: 'question_id' });

// LuckyDraw 관계
db.LuckyDraw.belongsTo(db.User, { foreignKey: 'user_id' });
db.LuckyDraw.belongsTo(db.QuizEvent, { foreignKey: 'event_id' });

module.exports = db;
