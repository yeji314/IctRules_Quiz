/**
 * Swing 인증 모듈 DEV 환경 테스트
 *
 * ⚠️ 주의: 실제 Swing 개발 서버에 연결합니다!
 *
 * 실행 방법: node test-dev.js
 */

// .env 파일 로드
require('dotenv').config();

const { doSwingAuthenticate } = require('./index');
const { getCurrentEnvironment, getConfig } = require('./env');

console.log('='.repeat(70));
console.log('Swing 인증 모듈 DEV 환경 테스트');
console.log('='.repeat(70));

// 환경 정보 출력
console.log('\n📋 현재 환경 설정:');
console.log('-'.repeat(70));
const env = getCurrentEnvironment();
const config = getConfig();
console.log('  환경:', env);
console.log('  Endpoint:', config.swingEndpoint);
console.log('  Client ID:', config.clientId ? `${config.clientId.substring(0, 5)}...` : '(설정 안됨)');
console.log('  Client Secret:', config.clientSecret ? '(설정됨)' : '(설정 안됨)');

if (!config.clientId || !config.clientSecret) {
  console.log('\n❌ 에러: Client ID와 Client Secret이 설정되지 않았습니다!');
  console.log('\n📝 설정 방법:');
  console.log('  1. .env 파일을 열어주세요');
  console.log('  2. SWING_CLIENT_ID_DEV와 SWING_CLIENT_SECRET_DEV를 실제 값으로 변경하세요');
  console.log('  3. 신한은행 담당자에게 개발 서버 인증 정보를 요청하세요');
  process.exit(1);
}

async function testDev() {
  console.log('\n' + '='.repeat(70));
  console.log('[테스트 1] SSO 토큰 인증');
  console.log('='.repeat(70));

  console.log('\n📌 테스트 데이터:');
  console.log('  SSO Token: (실제 Swing 포털에서 발급받은 토큰 필요)');
  console.log('\n💡 실제 SSO 토큰을 사용하려면:');
  console.log('  1. Swing 포털에 로그인');
  console.log('  2. URL에서 gw_sso_auth_code 파라미터 값을 복사');
  console.log('  3. 아래 코드의 ssoToken 값을 실제 토큰으로 변경');

  // 실제 SSO 토큰이 있다면 주석을 해제하고 테스트
  /*
  try {
    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: '여기에_실제_SSO_토큰을_입력하세요'
    });

    console.log('\n✅ SSO 인증 성공!');
    console.log('  사용자명:', user.employeeName);
    console.log('  사번:', user.employeeNo);
    console.log('  부서:', user.departmentName);
    console.log('  이메일:', user.companyEmail);
  } catch (error) {
    console.error('\n❌ SSO 인증 실패:', error.message);
  }
  */

  console.log('\n' + '='.repeat(70));
  console.log('[테스트 2] ID/Password 인증');
  console.log('='.repeat(70));

  console.log('\n📌 테스트 데이터:');
  console.log('  사번: (8자리 숫자)');
  console.log('  비밀번호: (Swing 비밀번호)');
  console.log('\n💡 실제 계정으로 테스트하려면:');
  console.log('  1. 아래 코드의 주석을 해제');
  console.log('  2. employeeNo와 password를 실제 값으로 변경');
  console.log('  3. 테스트 후 반드시 코드에서 비밀번호 제거!');

  // 실제 계정이 있다면 주석을 해제하고 테스트
  /*
  try {
    const user = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: '12345678',  // 실제 사번으로 변경
      password: 'your_password'  // 실제 비밀번호로 변경 (테스트 후 삭제!)
    });

    console.log('\n✅ ID/PW 인증 성공!');
    console.log('  사용자명:', user.employeeName);
    console.log('  사번:', user.employeeNo);
    console.log('  부서:', user.departmentName);
    console.log('  직책:', user.employeePositionName);
    console.log('  이메일:', user.companyEmail);
  } catch (error) {
    console.error('\n❌ ID/PW 인증 실패:', error.message);
  }
  */

  console.log('\n' + '='.repeat(70));
  console.log('ℹ️  안내');
  console.log('='.repeat(70));
  console.log('\n이 테스트는 실제 Swing 개발 서버에 연결합니다.');
  console.log('실제 테스트 데이터(SSO 토큰 또는 계정)가 필요합니다.');
  console.log('\n위 코드의 주석을 해제하고 실제 값으로 변경하여 테스트하세요.');
  console.log('\n⚠️  보안 주의사항:');
  console.log('  - 테스트 후 반드시 비밀번호를 코드에서 제거하세요');
  console.log('  - 이 파일을 Git에 커밋하지 마세요 (비밀번호 노출 위험)');
  console.log('  - Client Secret은 절대 공개하지 마세요');

  console.log('\n' + '='.repeat(70));
  console.log('테스트 완료');
  console.log('='.repeat(70) + '\n');
}

testDev().catch(error => {
  console.error('\n테스트 실행 중 오류:', error);
  process.exit(1);
});
