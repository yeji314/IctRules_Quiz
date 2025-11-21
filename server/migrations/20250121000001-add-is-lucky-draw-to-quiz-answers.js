'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quiz_answers', 'is_lucky_draw', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '럭키드로우 문제 여부'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('quiz_answers', 'is_lucky_draw');
  }
};
