'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('quiz_sessions', 'won_prize_this_session', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '이번 세션에서 선물을 획득했는지 여부'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quiz_sessions', 'won_prize_this_session');
  }
};
