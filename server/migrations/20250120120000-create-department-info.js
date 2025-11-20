'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('department_info', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      department_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '부서명'
      },
      target_headcount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '목표 인원 수'
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '부서 설명'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 추가
    await queryInterface.addIndex('department_info', ['department_name'], {
      unique: true,
      name: 'idx_department_info_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('department_info');
  }
};
