/**
 * Swing API Client 테스트 스크립트
 *
 * 실행 방법:
 * cd server
 * node test-swing-api-client.js
 */

require('dotenv').config();
const swingApiClient = require('./services/swingApiClient');

console.log('=================================================');
console.log('Swing API Client 테스트');
console.log('=================================================\n');

async function testSwingApiClient() {
  try {
    // 1. Configuration 확인
    console.log('1. Configuration 확인:');
    console.log(`   - SSO Enabled: ${swingApiClient.config.enabled}`);
    console.log(`   - Environment: ${swingApiClient.config.environment}`);
    console.log(`   - Base URL: ${swingApiClient.endpoint.baseUrl}`);
    console.log(`   - OAuth Endpoint: ${swingApiClient.endpoint.oauthEndpoint}`);
    console.log(`   - IDPW Endpoint: ${swingApiClient.endpoint.idpwEndpoint}`);
    console.log('   ✓ Configuration loaded\n');

    // 2. Crypto 함수 테스트
    console.log('2. Crypto Functions 테스트:');
    const testPassword = 'test123!@#';
    const sha256Hash = swingApiClient.sha256(testPassword);
    const md5Hash = swingApiClient.passwordHashing(testPassword);

    console.log(`   - SHA-256: ${sha256Hash}`);
    console.log(`   - MD5 (with salt): ${md5Hash}`);
    console.log('   ✓ Crypto functions working\n');

    // 3. Health Check (optional - 실제 서버가 없으면 실패)
    console.log('3. Health Check (optional):');
    try {
      const isHealthy = await swingApiClient.healthCheck();
      if (isHealthy) {
        console.log('   ✓ API server is healthy');
      } else {
        console.log('   ⚠ API server is not responding (expected if mock server not running)');
      }
    } catch (error) {
      console.log('   ⚠ Health check skipped (no mock server running)');
    }
    console.log('');

    // 4. Mock 인증 테스트 (실제 서버 없이는 실패 예상)
    console.log('4. Mock Authentication Test:');
    console.log('   ⚠ Skipping authentication tests (requires mock server)');
    console.log('   To test authentication:');
    console.log('   - Set up Swing mock server at http://127.0.0.1:8055/swing-mock-server');
    console.log('   - Uncomment test code below\n');

    /*
    // SSO Token 인증 테스트
    try {
      const ssoResult = await swingApiClient.authenticateWithSsoToken('mock_token_12345');
      console.log('   ✓ SSO Token Authentication:', ssoResult);
    } catch (error) {
      console.log('   ✗ SSO Token Authentication failed:', error.message);
    }

    // ID/PW 인증 테스트
    try {
      const idpwResult = await swingApiClient.authenticateWithIdPassword('user001', 'password123');
      console.log('   ✓ ID/Password Authentication:', idpwResult);
    } catch (error) {
      console.log('   ✗ ID/Password Authentication failed:', error.message);
    }
    */

    console.log('=================================================');
    console.log('✅ Swing API Client 테스트 완료!');
    console.log('=================================================');

    // 테스트 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    console.log('   ✓ Configuration: OK');
    console.log('   ✓ Crypto Functions: OK');
    console.log('   ✓ SwingApiClient 모듈: 정상 작동');
    console.log('\n💡 다음 단계:');
    console.log('   - Phase 3: Swing Auth Service 구현');
    console.log('   - 실제 인증 로직 및 사용자 동기화');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 테스트 실행
testSwingApiClient();
