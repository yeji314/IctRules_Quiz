/**
 * Admin 계정 비밀번호 재설정 스크립트
 *
 * 사용법:
 *   node scripts/reset-admin-password.js
 *
 * Docker 환경에서:
 *   docker exec -it ict-quiz-app node scripts/reset-admin-password.js
 */

const bcrypt = require('bcryptjs');
const db = require('../models');

const ADMIN_CONFIG = {
  employee_id: 'admin',
  password: 'shinhan@1',
  name: '관리자',
  department: 'IT',
  email: 'admin@shinhan.com',
  role: 'admin'
};

async function resetAdminPassword() {
  try {
    console.log('🔄 Admin 계정 초기화 중...\n');

    // 데이터베이스 연결
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 기존 admin 계정 확인
    let admin = await db.User.findOne({
      where: { employee_id: 'admin' }
    });

    // 비밀번호 해시 생성
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    if (admin) {
      // 기존 계정 업데이트
      console.log('📝 기존 admin 계정 발견 - 비밀번호 업데이트 중...');

      await admin.update({
        password: hashedPassword,
        name: ADMIN_CONFIG.name,
        department: ADMIN_CONFIG.department,
        email: ADMIN_CONFIG.email,
        role: ADMIN_CONFIG.role
      });

      // 업데이트 후 다시 조회하여 최신 데이터 가져오기
      await admin.reload();

      console.log('✅ Admin 계정 업데이트 완료!\n');
    } else {
      // 새 계정 생성
      console.log('➕ Admin 계정 없음 - 새로 생성 중...');

      admin = await db.User.create({
        employee_id: ADMIN_CONFIG.employee_id,
        password: hashedPassword,
        name: ADMIN_CONFIG.name,
        department: ADMIN_CONFIG.department,
        email: ADMIN_CONFIG.email,
        role: ADMIN_CONFIG.role,
        login_method: 'local'
      });

      console.log('✅ Admin 계정 생성 완료!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin 계정 정보:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID: ${ADMIN_CONFIG.employee_id}`);
    console.log(`   PW: ${ADMIN_CONFIG.password}`);
    console.log(`   이름: ${ADMIN_CONFIG.name}`);
    console.log(`   부서: ${ADMIN_CONFIG.department}`);
    console.log(`   이메일: ${ADMIN_CONFIG.email}`);
    console.log(`   권한: ${ADMIN_CONFIG.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 비밀번호 검증 테스트
    const isValid = await bcrypt.compare(ADMIN_CONFIG.password, admin.password);
    console.log(`🔐 비밀번호 검증: ${isValid ? '✅ 성공' : '❌ 실패'}\n`);

    await db.sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

resetAdminPassword();
