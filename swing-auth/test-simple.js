/**
 * Swing 인증 모듈 간단 테스트
 *
 * 실행 방법: node test-simple.js
 */

// .env 파일 로드
require('dotenv').config();

const { doSwingAuthenticate } = require('./index');

console.log('='.repeat(60));
console.log('Swing 인증 모듈 테스트 시작');
console.log('='.repeat(60));

async function test() {
  console.log('\n[테스트 1] SSO 토큰 인증');
  console.log('-'.repeat(60));

  try {
    const user1 = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: 'mock_sso_token_123'
    });

    console.log('✅ SSO 인증 성공!');
    console.log('   사용자명:', user1.employeeName);
    console.log('   사번:', user1.employeeNo);
    console.log('   부서:', user1.departmentName);
    console.log('   이메일:', user1.companyEmail);
  } catch (error) {
    console.error('❌ SSO 인증 실패:', error.message);
  }

  console.log('\n[테스트 2] ID/Password 인증');
  console.log('-'.repeat(60));

  try {
    const user2 = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: '12345678',
      password: 'testpassword'
    });

    console.log('✅ ID/PW 인증 성공!');
    console.log('   사용자명:', user2.employeeName);
    console.log('   사번:', user2.employeeNo);
    console.log('   부서:', user2.departmentName);
    console.log('   직책:', user2.employeePositionName);
  } catch (error) {
    console.error('❌ ID/PW 인증 실패:', error.message);
  }

  console.log('\n[테스트 3] 에러 처리 - 잘못된 타입');
  console.log('-'.repeat(60));

  try {
    await doSwingAuthenticate({
      type: 'wrong_type',
      ssoToken: 'test'
    });
  } catch (error) {
    console.log('✅ 예상된 에러 발생:', error.message);
  }

  console.log('\n[테스트 4] 에러 처리 - 토큰 누락');
  console.log('-'.repeat(60));

  try {
    await doSwingAuthenticate({
      type: 'sso'
      // ssoToken 누락
    });
  } catch (error) {
    console.log('✅ 예상된 에러 발생:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('테스트 완료!');
  console.log('='.repeat(60) + '\n');
}

test().catch(console.error);
