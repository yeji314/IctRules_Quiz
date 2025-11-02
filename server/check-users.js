const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB 연결 성공\n');

    const users = await db.User.findAll({
      attributes: ['id', 'employee_id', 'name', 'department', 'role']
    });

    console.log('=== 등록된 사용자 목록 ===');
    users.forEach(u => {
      console.log(`ID: ${u.id} | 행원번호: ${u.employee_id} | 이름: ${u.name} | 부서: ${u.department} | 역할: ${u.role}`);
    });
    console.log(`\n총 ${users.length}명 등록됨`);

    process.exit(0);
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
})();
