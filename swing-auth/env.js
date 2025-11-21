/**
 * Swing 인증 환경 설정
 *
 * 환경별로 다른 Swing 서버 엔드포인트와 인증 정보를 관리합니다.
 * NODE_ENV 환경 변수를 통해 운영/개발/목업 환경을 구분합니다.
 */

/**
 * 환경 설정
 * 운영 환경 (production)
 */
const config = {
  prod: {
    swingEndpoint: process.env.SWING_ENDPOINT_PROD || 'https://apigw.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_PROD || '',
    clientSecret: process.env.SWING_CLIENT_SECRET_PROD || '',
    companyCode: 'SH'
  },

  /**
   * 개발 환경 (development)
   */
  dev: {
    swingEndpoint: process.env.SWING_ENDPOINT_DEV || 'https://apigwdev.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_DEV || '',
    clientSecret: process.env.SWING_CLIENT_SECRET_DEV || '',
    companyCode: 'SH'
  },

  /**
   * 목업 환경 (mock)
   * 가상 응답 데이터를 사용합니다.
   */
  mock: {
    swingEndpoint: process.env.SWING_ENDPOINT_MOCK || 'http://127.0.0.1:8055/swing-mock-server',
    clientId: process.env.SWING_CLIENT_ID_MOCK || '5FACKST52XY6YDLM',
    clientSecret: process.env.SWING_CLIENT_SECRET_MOCK || 'YPZCWH4ZXLDGBVUX',
    companyCode: 'SH',
    // 목업 모드에서 사용할 가상 응답 데이터
    mockResponse: {
      authResult: 'SUCCESS',
      companyCode: 'SH',
      companyEmail: 'test12345678@swing.shinhan.com',
      departmentNo: '1234567',
      departmentName: 'ICT본부',
      employeeName: '테스트사용자',
      employeeNo: '19200617',
      employeePositionName: '부장'
    }
  }
};

/**
 * 현재 환경 결정
 * NODE_ENV 환경 변수 또는 OPERATION_MODE 환경 변수 사용
 * 기본값: mock
 */
function getCurrentEnvironment() {
  const env = process.env.OPERATION_MODE || 'mock';

  if (env === 'production' || env === 'prod') {
    return 'prod';
  } else if (env === 'development' || env === 'dev') {
    return 'dev';
  } else {
    return 'mock';
  }
}

/**
 * 현재 환경의 설정을 반환합니다.
 * @returns {object} 현재 환경 설정
 */
function getConfig() {
  const env = getCurrentEnvironment();
  return config[env];
}

module.exports = {
  getConfig,
  getCurrentEnvironment,
  config
};
