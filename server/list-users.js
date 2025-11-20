const db = require('./models');

async function listUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    const users = await db.User.findAll({
      attributes: ['id', 'employee_id', 'name', 'department', 'role'],
      order: [['id', 'ASC']]
    });

    console.log('=== 전체 사용자 목록 ===\n');
    users.forEach(u => {
      console.log(`ID: ${u.id}, 사번: ${u.employee_id}, 이름: ${u.name}, 부서: ${u.department}, 역할: ${u.role}`);
    });

    console.log(`\n총 ${users.length}명`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

listUsers();
