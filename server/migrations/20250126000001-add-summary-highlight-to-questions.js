'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('questions', 'summary', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Admin이 등록한 문제 요약 (result 페이지에 표시)'
    });

    await queryInterface.addColumn('questions', 'highlight', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: '요약 텍스트에서 하이라이트할 키워드/문장'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('questions', 'summary');
    await queryInterface.removeColumn('questions', 'highlight');
  }
};
