'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add max_winners column to quiz_events
    await queryInterface.addColumn('quiz_events', 'max_winners', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 10,
      comment: '회차별 LuckyDraw 최대 당첨자 수'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('quiz_events', 'max_winners');
  }
};
