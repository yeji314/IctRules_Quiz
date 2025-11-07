const axios = require('axios');
const crypto = require('crypto');
const { swingSsoConfig, getSwingEndpoint } = require('../config/swing-sso');

const VERBOSE_LOG = process.env.SWING_VERBOSE_LOG === 'true' || false;

/**
 * Swing API Client
 * Handles all communication with Swing SSO API
 */
class SwingApiClient {
  constructor() {
    this.config = swingSsoConfig;
    this.endpoint = getSwingEndpoint(this.config.environment);
  }

  /**
   * 로그 출력 함수
   * @param {string} label - 로그 레이블
   * @param {any} data - 로그 출력할 데이터
   */
  log(label, data = null) {
    if (!VERBOSE_LOG) return;

    if (data) {
      console.log(`[SwingApiClient] ${label}:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[SwingApiClient] ${label}`);
    }
  }

  /**
   * 에러 로그 출력 (항상 출력)
   * @param {string} label - 로그 레이블
   * @param {any} error - 에러 객체
   */
  logError(label, error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;

    console.error(`[SwingApiClient] ERROR [${statusCode}] ${label}:`, errorMessage);
    if (error.response?.data) {
      console.error('[SwingApiClient] Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  /**
   * Swing API 호출
   * @param {string} endpoint - API 엔드포인트 경로
   * @param {object} payload - 요청 페이로드
   * @param {string} method - HTTP 메소드
   * @param {object} options - 추가 옵션
   * @returns {Promise<object>} - API 응답
   */
  async apiCall(endpoint, payload = null, method = 'POST', options = {}) {
    const apiUrl = new URL(endpoint, this.endpoint.baseUrl);

    this.log('API Call', { url: apiUrl.href, method, payload });

    try {
      const response = await axios({
        method,
        url: apiUrl.toString(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        data: payload,
        timeout: this.config.api.timeout,
        ...options
      });

      this.log('API Response', { status: response.status, data: response.data });

      return response.data;
    } catch (error) {
      this.logError(`API Call Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * SSO 토큰 인증
   * @param {string} ssoToken - SSO 토큰
   * @returns {Promise<object>} - 사용자 정보
   */
  async authenticateWithSsoToken(ssoToken) {
    try {
      const payload = {
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
        oauth_code: ssoToken
      };

      const response = await this.apiCall(
        this.endpoint.oauthEndpoint,
        payload,
        'POST'
      );

      // 응답 구조 검증
      if (!response.user_id) {
        throw new Error('Invalid response: user_id not found');
      }

      return {
        userId: response.user_id,
        employeeId: response.employee_id || response.user_id,
        name: response.name || response.user_name,
        department: response.department || response.dept_name,
        position: response.position || response.title,
        email: response.email,
        isActive: response.is_active !== false
      };
    } catch (error) {
      this.logError('SSO Token Authentication Failed', error);
      throw error;
    }
  }

  /**
   * ID/Password 인증
   * @param {string} employeeId - 행원번호
   * @param {string} password - 비밀번호 (평문)
   * @returns {Promise<object>} - 사용자 정보
   */
  async authenticateWithIdPassword(employeeId, password) {
    try {
      // SHA-256 해싱
      const hashedPassword = this.sha256(password);

      const payload = {
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
        employee_id: employeeId,
        password: hashedPassword
      };

      const response = await this.apiCall(
        this.endpoint.idpwEndpoint,
        payload,
        'POST'
      );

      // 응답 구조 검증
      if (!response.user_id) {
        throw new Error('Invalid response: user_id not found');
      }

      return {
        userId: response.user_id,
        employeeId: response.employee_id || employeeId,
        name: response.name || response.user_name,
        department: response.department || response.dept_name,
        position: response.position || response.title,
        email: response.email,
        isActive: response.is_active !== false
      };
    } catch (error) {
      this.logError('ID/Password Authentication Failed', error);
      throw error;
    }
  }

  /**
   * SHA-256 해싱
   * @param {string} message - 해싱할 메시지
   * @returns {string} - 해시값 (hex)
   */
  sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * MD5 해싱 (with salt)
   * @param {string} plainPassword - 평문 비밀번호
   * @returns {string} - 해시값 (hex)
   */
  passwordHashing(plainPassword) {
    const salt = this.config.passwordSalt;
    return crypto.createHash('md5').update(plainPassword + salt).digest('hex');
  }

  /**
   * 사용자 정보 조회 (선택적 - Swing API에 정보 조회 엔드포인트가 있는 경우)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<object>} - 사용자 정보
   */
  async getUserInfo(userId) {
    try {
      // 실제 API 엔드포인트가 있다면 구현
      // 현재는 플레이스홀더
      console.warn('[SwingApiClient] getUserInfo not implemented');
      return null;
    } catch (error) {
      this.logError('Get User Info Failed', error);
      throw error;
    }
  }

  /**
   * API 상태 확인
   * @returns {Promise<boolean>} - API 정상 여부
   */
  async healthCheck() {
    try {
      // 간단한 health check (실제 엔드포인트가 있다면 사용)
      const response = await axios.get(`${this.endpoint.baseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      this.log('Health Check Failed', error.message);
      return false;
    }
  }
}

// Singleton instance
const swingApiClient = new SwingApiClient();

module.exports = swingApiClient;
