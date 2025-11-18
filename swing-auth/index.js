/**
 * Swing 인증 모듈
 *
 * Swing SSO 토큰 인증 및 ID/Password 인증 기능을 제공합니다.
 * Directus 관련 기능은 완전히 제거되었으며, 순수 Swing 인증만 처리합니다.
 */

const { getConfig, getCurrentEnvironment } = require('./env');
const { log, apiCall, sha256, validateSwingResponse } = require('./helpers');

/**
 * Swing 인증 메인 함수
 *
 * @param {object} options - 인증 옵션
 * @param {string} options.type - 인증 타입 ('sso' | 'idpw')
 * @param {string} [options.ssoToken] - SSO 토큰 (type='sso'일 때 필수)
 * @param {string} [options.employeeNo] - 사번 (type='idpw'일 때 필수)
 * @param {string} [options.password] - 비밀번호 (type='idpw'일 때 필수)
 * @returns {Promise<object>} - 사용자 정보
 * @throws {Error} - 인증 실패 시 에러
 *
 * @example
 * // SSO 토큰 인증
 * const user = await doSwingAuthenticate({
 *   type: 'sso',
 *   ssoToken: 'abc123...'
 * });
 *
 * @example
 * // ID/Password 인증
 * const user = await doSwingAuthenticate({
 *   type: 'idpw',
 *   employeeNo: '12345678',
 *   password: 'mypassword'
 * });
 */
async function doSwingAuthenticate(options) {
  const { type, ssoToken, employeeNo, password } = options;

  // 환경 정보 로깅
  const env = getCurrentEnvironment();
  const config = getConfig();
  log(`현재 환경: ${env}`);
  log('Swing 엔드포인트', config.swingEndpoint);

  // 인증 타입 검증
  if (!type || (type !== 'sso' && type !== 'idpw')) {
    throw new Error('인증 타입이 올바르지 않습니다. type은 "sso" 또는 "idpw"여야 합니다.');
  }

  let swingUser = null;

  // SSO 토큰 인증
  if (type === 'sso') {
    if (!ssoToken) {
      throw new Error('SSO 토큰이 필요합니다.');
    }
    swingUser = await swingSsoAuth(ssoToken);
  }
  // ID/Password 인증
  else if (type === 'idpw') {
    if (!employeeNo || !password) {
      throw new Error('사번과 비밀번호가 필요합니다.');
    }
    swingUser = await swingIdPasswordAuth(employeeNo, password);
  }

  log('Swing 인증 성공', swingUser);
  return swingUser;
}

/**
 * Swing SSO 토큰 인증
 *
 * @param {string} ssoToken - Swing SSO 토큰 (gw_sso_auth_code)
 * @returns {Promise<object>} - 사용자 정보
 * @throws {Error} - 인증 실패 시 에러
 */
async function swingSsoAuth(ssoToken) {
  const env = getCurrentEnvironment();
  const config = getConfig();

  // Mock 환경에서는 가상 응답 반환
  if (env === 'mock') {
    log('Mock 환경: 가상 응답 데이터 반환');
    return config.mockResponse;
  }

  const { swingEndpoint, clientId, clientSecret } = config;

  // Swing API 요청 페이로드
  const payload = {
    common: {
      clientId,
      clientSecret
    },
    data: {
      code: ssoToken
    }
  };

  try {
    const apiUrl = `${swingEndpoint}/cau/v1/oauth-code-simple`;
    const response = await apiCall(apiUrl, payload);

    // 응답 검증
    const swingUser = validateSwingResponse(response);

    return swingUser;
  } catch (error) {
    log('Swing SSO 인증 오류', error.message);
    throw new Error(`Swing SSO 인증 실패: ${error.message}`);
  }
}

/**
 * Swing ID/Password 인증
 *
 * @param {string} employeeNo - 사번
 * @param {string} password - 비밀번호 (평문)
 * @returns {Promise<object>} - 사용자 정보
 * @throws {Error} - 인증 실패 시 에러
 */
async function swingIdPasswordAuth(employeeNo, password) {
  const env = getCurrentEnvironment();
  const config = getConfig();

  // Mock 환경에서는 가상 응답 반환
  if (env === 'mock') {
    log('Mock 환경: 가상 응답 데이터 반환');
    return config.mockResponse;
  }

  const { swingEndpoint, clientId, clientSecret, companyCode } = config;

  // 비밀번호 SHA-256 해싱
  const hashedPassword = sha256(password);
  log('비밀번호 해싱 완료');

  // Swing API 요청 페이로드
  const payload = {
    common: {
      clientId,
      clientSecret,
      companyCode,
      employeeNo
    },
    data: {
      loginPassword: hashedPassword
    }
  };

  try {
    const apiUrl = `${swingEndpoint}/cau/v1/idpw-authorize`;
    const response = await apiCall(apiUrl, payload);

    // 응답 검증
    const swingUser = validateSwingResponse(response);

    return swingUser;
  } catch (error) {
    log('Swing ID/Password 인증 오류', error.message);
    throw new Error(`Swing ID/Password 인증 실패: ${error.message}`);
  }
}

module.exports = {
  doSwingAuthenticate,
  swingSsoAuth,
  swingIdPasswordAuth
};
