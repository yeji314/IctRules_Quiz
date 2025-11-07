require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database/quiz.db'),
    logging: console.log
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.DB_PATH || path.join(__dirname, '../../database/quiz.db'),
    logging: false
  }
};
