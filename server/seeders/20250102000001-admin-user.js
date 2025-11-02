'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin@', 10);

    await queryInterface.bulkInsert('users', [{
      employee_id: 'admin',
      password: hashedPassword,
      name: '관리자',
      department: '시스템',
      email: 'admin@company.com',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      employee_id: 'admin'
    }, {});
  }
};
