const bcrypt = require('bcryptjs');

/**
 * 서버 시작 시 admin 계정이 없으면 자동으로 생성
 */
const initAdminUser = async (db) => {
  try {
    const { User } = db;

    // admin 계정 존재 여부 확인
    const adminExists = await User.findOne({
      where: { employee_id: 'admin' }
    });

    if (!adminExists) {
      console.log('⚙️  admin 계정이 존재하지 않습니다. 생성 중...');

      // admin 계정 생성 (비밀번호는 User 모델의 beforeCreate hook에서 자동으로 해시됨)
      await User.create({
        employee_id: 'admin',
        password: 'shinhan@1',
        name: '관리자',
        department: '시스템',
        email: 'admin@company.com',
        role: 'admin',
        login_method: 'local',
        is_active: true
      });

      console.log('✅ admin 계정이 생성되었습니다.');
      console.log('   ID: admin');
      console.log('   비밀번호: shinhan@1');
      console.log('   ⚠️  보안을 위해 초기 비밀번호를 변경하세요!');
    } else {
      console.log('✅ admin 계정이 이미 존재합니다.');
    }
  } catch (error) {
    console.error('❌ admin 계정 초기화 실패:', error);
    throw error;
  }
};

module.exports = initAdminUser;
