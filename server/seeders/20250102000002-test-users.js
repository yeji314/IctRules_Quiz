'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('1234', 10);

    await queryInterface.bulkInsert('users', [
      {
        employee_id: 'user001',
        password: hashedPassword,
        name: '김철수',
        department: 'IT개발팀',
        email: 'user001@company.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        employee_id: 'user002',
        password: hashedPassword,
        name: '이영희',
        department: '인사팀',
        email: 'user002@company.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        employee_id: 'user003',
        password: hashedPassword,
        name: '박민수',
        department: '영업팀',
        email: 'user003@company.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        employee_id: 'user004',
        password: hashedPassword,
        name: '최지은',
        department: '기획팀',
        email: 'user004@company.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      employee_id: ['user001', 'user002', 'user003', 'user004']
    }, {});
  }
};
