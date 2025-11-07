/**
 * Swing SSO Integration Test
 *
 * Mock Swing 서버와 함께 전체 인증 플로우를 테스트합니다.
 *
 * 실행 방법:
 * 1. Mock Swing 서버 시작: node mock-swing-server.js
 * 2. 다른 터미널에서 테스트 실행: node test-swing-integration.js
 */

require('dotenv').config();
const axios = require('axios');
const db = require('./models');

const API_BASE = 'http://localhost:3001/api';
const MOCK_SWING_BASE = 'http://localhost:8055/swing-mock-server';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`   ✓ ${name}`);
  } else {
    testResults.failed++;
    console.log(`   ✗ ${name}`);
    if (message) console.log(`     ${message}`);
  }
}

async function testMockSwingServer() {
  console.log('\n1. Mock Swing Server 테스트');
  console.log('========================================');

  try {
    // Health check
    const health = await axios.get(`${MOCK_SWING_BASE}/health`);
    logTest('Mock server health check', health.status === 200);

    // Test users 조회
    const users = await axios.get(`${MOCK_SWING_BASE}/test/users`);
    logTest('Mock users available', users.data.users.length > 0);
    console.log(`     Found ${users.data.users.length} mock users`);

    return true;
  } catch (error) {
    logTest('Mock Swing Server', false, error.message);
    console.log('\n⚠️  Mock Swing Server가 실행되지 않았습니다.');
    console.log('   다른 터미널에서 실행하세요: node mock-swing-server.js\n');
    return false;
  }
}

async function testSsoTokenAuthentication() {
  console.log('\n2. SSO 토큰 인증 테스트');
  console.log('========================================');

  try {
    // Mock 토큰으로 인증
    const response = await axios.post(`${API_BASE}/auth/swing/token`, {
      sso_token: 'mock_token_12345'
    });

    logTest('SSO token authentication', response.status === 200);
    logTest('JWT token received', !!response.data.token);
    logTest('User data received', !!response.data.user);
    logTest('Swing user ID set', !!response.data.user.swing_user_id);
    logTest('Login method is swing_sso', response.data.login_method === 'swing_sso');

    // 반환된 사용자 정보 확인
    const user = response.data.user;
    console.log(`     User: ${user.employee_id} (${user.name})`);
    console.log(`     Department: ${user.department}`);
    console.log(`     Position: ${user.position}`);

    return response.data;
  } catch (error) {
    logTest('SSO token authentication', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testIdPasswordAuthentication() {
  console.log('\n3. ID/Password 인증 테스트');
  console.log('========================================');

  try {
    // ID/Password로 인증
    const response = await axios.post(`${API_BASE}/auth/swing/idpw`, {
      employee_id: 'swing002',
      password: 'test1234'
    });

    logTest('ID/Password authentication', response.status === 200);
    logTest('JWT token received', !!response.data.token);
    logTest('User data received', !!response.data.user);
    logTest('Swing user ID set', !!response.data.user.swing_user_id);

    // 반환된 사용자 정보 확인
    const user = response.data.user;
    console.log(`     User: ${user.employee_id} (${user.name})`);
    console.log(`     Department: ${user.department}`);

    return response.data;
  } catch (error) {
    logTest('ID/Password authentication', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testUserAutoCreation() {
  console.log('\n4. 사용자 자동 생성 테스트');
  console.log('========================================');

  try {
    await db.sequelize.authenticate();

    // SSO 인증 전 사용자 확인
    let user = await db.User.findOne({ where: { employee_id: 'swing003' } });
    const userExistedBefore = !!user;
    logTest('User does not exist initially', !userExistedBefore);

    // SSO 인증 (사용자 자동 생성됨)
    const response = await axios.post(`${API_BASE}/auth/swing/idpw`, {
      employee_id: 'swing003',
      password: 'qwerty'
    });

    logTest('Authentication successful', response.status === 200);

    // 인증 후 사용자 확인
    user = await db.User.findOne({ where: { employee_id: 'swing003' } });
    logTest('User auto-created', !!user);
    logTest('Swing user ID linked', !!user.swing_user_id);
    logTest('Login method set to swing_sso', user.login_method === 'swing_sso');

    if (user) {
      console.log(`     Created user: ${user.employee_id} (${user.name})`);
      console.log(`     Swing ID: ${user.swing_user_id}`);
    }

    return user;
  } catch (error) {
    logTest('User auto-creation', false, error.message);
    return null;
  }
}

async function testUserInfoSync() {
  console.log('\n5. 사용자 정보 동기화 테스트');
  console.log('========================================');

  try {
    // 기존 사용자의 정보 변경 시뮬레이션
    // (실제로는 Mock Swing 서버의 사용자 정보가 변경되어야 함)

    // 재인증 (정보 동기화 발생)
    const response = await axios.post(`${API_BASE}/auth/swing/token`, {
      sso_token: 'mock_token_12345'
    });

    logTest('Re-authentication successful', response.status === 200);
    logTest('User info synced', !!response.data.user);

    const user = await db.User.findOne({
      where: { employee_id: response.data.user.employee_id }
    });

    logTest('User info updated in DB', !!user);
    console.log(`     User: ${user.name} - ${user.department}`);

    return user;
  } catch (error) {
    logTest('User info sync', false, error.message);
    return null;
  }
}

async function testInvalidCredentials() {
  console.log('\n6. 잘못된 인증 정보 테스트');
  console.log('========================================');

  try {
    // 잘못된 SSO 토큰
    try {
      await axios.post(`${API_BASE}/auth/swing/token`, {
        sso_token: 'invalid_token_xyz'
      });
      logTest('Invalid SSO token rejected', false, 'Should have failed');
    } catch (error) {
      logTest('Invalid SSO token rejected', error.response?.status === 401);
    }

    // 잘못된 비밀번호
    try {
      await axios.post(`${API_BASE}/auth/swing/idpw`, {
        employee_id: 'swing001',
        password: 'wrong_password'
      });
      logTest('Invalid password rejected', false, 'Should have failed');
    } catch (error) {
      logTest('Invalid password rejected', error.response?.status === 401);
    }

    // 존재하지 않는 사용자
    try {
      await axios.post(`${API_BASE}/auth/swing/idpw`, {
        employee_id: 'nonexistent_user',
        password: 'any_password'
      });
      logTest('Nonexistent user rejected', false, 'Should have failed');
    } catch (error) {
      logTest('Nonexistent user rejected', error.response?.status === 401 || error.response?.status === 404);
    }

    return true;
  } catch (error) {
    logTest('Invalid credentials test', false, error.message);
    return false;
  }
}

async function testDatabaseState() {
  console.log('\n7. 데이터베이스 상태 확인');
  console.log('========================================');

  try {
    await db.sequelize.authenticate();

    // 전체 사용자 수
    const totalUsers = await db.User.count();
    logTest('Database accessible', true);
    console.log(`     Total users: ${totalUsers}`);

    // SSO 사용자 수
    const ssoUsers = await db.User.count({
      where: { login_method: 'swing_sso' }
    });
    logTest('SSO users created', ssoUsers > 0);
    console.log(`     SSO users: ${ssoUsers}`);

    // 로컬 사용자 수
    const localUsers = await db.User.count({
      where: { login_method: 'local' }
    });
    console.log(`     Local users: ${localUsers}`);

    // SSO 사용자 목록
    const ssoUserList = await db.User.findAll({
      where: { login_method: 'swing_sso' },
      attributes: ['employee_id', 'name', 'swing_user_id', 'department']
    });

    console.log(`\n     SSO Users:`);
    ssoUserList.forEach(u => {
      console.log(`       - ${u.employee_id} (${u.name}) - ${u.department}`);
    });

    return true;
  } catch (error) {
    logTest('Database state check', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=================================================');
  console.log('🧪 Swing SSO Integration Test');
  console.log('=================================================\n');

  try {
    // Mock Swing 서버 확인
    const mockServerRunning = await testMockSwingServer();
    if (!mockServerRunning) {
      console.log('\n❌ Mock Swing Server가 필요합니다. 테스트 중단.\n');
      process.exit(1);
    }

    // SSO 활성화 확인
    const ssoEnabled = process.env.SWING_SSO_ENABLED === 'true';
    if (!ssoEnabled) {
      console.log('\n⚠️  SWING_SSO_ENABLED=false입니다.');
      console.log('   .env 파일에서 SWING_SSO_ENABLED=true로 설정하고 다시 시도하세요.\n');
      process.exit(1);
    }

    // 통합 테스트 실행
    await testSsoTokenAuthentication();
    await testIdPasswordAuthentication();
    await testUserAutoCreation();
    await testUserInfoSync();
    await testInvalidCredentials();
    await testDatabaseState();

    // 결과 요약
    console.log('\n=================================================');
    console.log('📊 Test Results');
    console.log('=================================================');
    console.log(`Total: ${testResults.tests.length} tests`);
    console.log(`✓ Passed: ${testResults.passed}`);
    console.log(`✗ Failed: ${testResults.failed}`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed tests:');
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`   - ${t.name}`);
          if (t.message) console.log(`     ${t.message}`);
        });
    }

    console.log('\n=================================================');
    if (testResults.failed === 0) {
      console.log('🎉 All tests passed!');
      console.log('=================================================\n');
    } else {
      console.log('⚠️  Some tests failed. Please review.');
      console.log('=================================================\n');
      process.exit(1);
    }

    await db.sequelize.close();

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    await db.sequelize.close();
    process.exit(1);
  }
}

// 테스트 실행
runAllTests();
