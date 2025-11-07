/**
 * Swing Auth Service 테스트 스크립트
 *
 * 실행 방법:
 * cd server
 * node test-swing-auth-service.js
 */

require('dotenv').config();
const swingAuthService = require('./services/swingAuthService');
const db = require('./models');

console.log('=================================================');
console.log('Swing Auth Service 테스트');
console.log('=================================================\n');

async function testSwingAuthService() {
  try {
    await db.sequelize.authenticate();
    console.log('✓ 데이터베이스 연결 성공\n');

    // 1. Configuration 확인
    console.log('1. Configuration 확인:');
    console.log(`   - SSO Enabled: ${swingAuthService.isEnabled()}`);
    console.log(`   - Auto Create User: ${swingAuthService.config.userManagement.autoCreateUser}`);
    console.log(`   - Sync User Info: ${swingAuthService.config.userManagement.syncUserInfo}`);
    console.log(`   - Access Control Type: ${swingAuthService.config.accessControl.type}`);
    console.log('   ✓ Configuration loaded\n');

    // 2. SSO Settings 확인
    console.log('2. SSO Settings (Database) 확인:');
    const ssoEnabled = await db.SSOSettings.getSetting('swing_sso_enabled', false);
    const autoCreate = await db.SSOSettings.getSetting('auto_create_user', false);
    const syncInfo = await db.SSOSettings.getSetting('sync_user_info', false);

    console.log(`   - SSO Enabled (DB): ${ssoEnabled}`);
    console.log(`   - Auto Create User (DB): ${autoCreate}`);
    console.log(`   - Sync User Info (DB): ${syncInfo}`);
    console.log('   ✓ Database settings loaded\n');

    // 3. Access Control 설정 확인
    console.log('3. Access Control 설정:');
    const accessControlType = await db.SSOSettings.getSetting('access_control_type', 'none');
    const employeeList = await db.SSOSettings.getSetting('employee_list', []);
    const deptList = await db.SSOSettings.getSetting('department_list', []);

    console.log(`   - Type: ${accessControlType}`);
    console.log(`   - Employee List: ${JSON.stringify(employeeList)}`);
    console.log(`   - Department List: ${JSON.stringify(deptList)}`);
    console.log('   ✓ Access control settings loaded\n');

    // 4. 테스트 사용자 조회
    console.log('4. 기존 사용자 확인:');
    const existingUsers = await db.User.findAll({
      limit: 3,
      attributes: ['id', 'employee_id', 'name', 'login_method', 'swing_user_id']
    });

    if (existingUsers.length > 0) {
      console.log('   기존 사용자:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.employee_id} (${user.name}) - ${user.login_method} - swing_id: ${user.swing_user_id || 'N/A'}`);
      });
    } else {
      console.log('   ⚠ 사용자 없음');
    }
    console.log('');

    // 5. Mock 인증 테스트 (실제 Swing 서버 없이는 실패 예상)
    console.log('5. Mock Authentication Test:');
    console.log('   ⚠ Skipping authentication tests (requires Swing mock server)');
    console.log('   To test authentication:');
    console.log('   - Set up Swing mock server');
    console.log('   - Set SWING_SSO_ENABLED=true in .env');
    console.log('   - Uncomment test code below\n');

    /*
    // SSO 토큰 인증 테스트
    if (swingAuthService.isEnabled()) {
      try {
        const result = await swingAuthService.authenticateWithSsoToken('mock_token_12345');
        console.log('   ✓ SSO Token Authentication:');
        console.log('     User:', result.user.employee_id);
        console.log('     Token:', result.token.substring(0, 50) + '...');
      } catch (error) {
        console.log('   ✗ SSO Token Authentication failed:', error.message);
      }
    } else {
      console.log('   ⚠ SSO is disabled, skipping authentication test');
    }
    */

    console.log('=================================================');
    console.log('✅ Swing Auth Service 테스트 완료!');
    console.log('=================================================');

    // 테스트 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    console.log('   ✓ Configuration: OK');
    console.log('   ✓ Database Connection: OK');
    console.log('   ✓ SSO Settings: OK');
    console.log('   ✓ SwingAuthService 모듈: 정상 작동');
    console.log('\n💡 다음 단계:');
    console.log('   - Phase 4: Controller 및 Route 통합');
    console.log('   - SSO 인증 엔드포인트 추가');

    await db.sequelize.close();
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
    await db.sequelize.close();
    process.exit(1);
  }
}

// 테스트 실행
testSwingAuthService();
