'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('lucky_draws', 'won_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '당첨일'
    });

    await queryInterface.addColumn('lucky_draws', 'claimed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '수령일'
    });

    // 기존 데이터의 won_date를 created_at으로 설정
    await queryInterface.sequelize.query(
      'UPDATE lucky_draws SET won_date = created_at WHERE won_date IS NULL'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lucky_draws', 'won_date');
    await queryInterface.removeColumn('lucky_draws', 'claimed_at');
  }
};
