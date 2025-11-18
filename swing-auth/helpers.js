/**
 * Swing 인증 헬퍼 함수
 *
 * 공통적으로 사용되는 유틸리티 함수들을 제공합니다.
 */

const crypto = require('crypto');
const axios = require('axios');
const { inspect } = require('util');

/**
 * 로그 출력 함수
 * @param {string} label - 로그 레이블
 * @param {any} obj - 로그 출력할 객체 (선택사항)
 * @param {number} depth - 로그 출력 깊이 (기본값: 5)
 */
function log(label, obj = null, depth = 5) {
  if (obj !== null && obj !== undefined) {
    console.log(
      `[swing-auth] ${label}: ${inspect(obj, {
        depth: depth,
        colors: true,
        maxArrayLength: null
      })}`
    );
  } else {
    console.log(`[swing-auth] ${label}`);
  }
}

/**
 * Swing API 호출 공통 함수
 * @param {string} url - API 엔드포인트 URL
 * @param {object} payload - 요청 페이로드
 * @returns {Promise<object>} - API 응답 데이터
 * @throws {Error} - API 호출 실패 시 에러
 */
async function apiCall(url, payload) {
  try {
    log('Swing API 요청 URL', url);
    log('Swing API 요청 페이로드', payload);

    const response = await axios.post(url, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 // 10초 타임아웃
    });

    log('Swing API 응답', response.data);

    return response.data;
  } catch (error) {
    const errorMsg = error.response
      ? error.response.data
      : error.message;

    log('Swing API 호출 오류', errorMsg);

    throw new Error(
      `Swing API 호출 실패: ${errorMsg ? JSON.stringify(errorMsg) : error.message}`
    );
  }
}

/**
 * SHA-256 해싱 함수
 * 비밀번호를 SHA-256으로 해싱합니다.
 * @param {string} message - 해싱할 문자열
 * @returns {string} - SHA-256 해시값 (hex)
 */
function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

/**
 * 문자열이 숫자인지 확인하는 함수
 * @param {string} value - 확인할 문자열
 * @returns {boolean} - 숫자인 경우 true
 */
function isNumeric(value) {
  return /^\d+$/.test(value);
}

/**
 * Swing 응답 검증 함수
 * @param {object} swingResponse - Swing API 응답
 * @returns {object} - 사용자 정보
 * @throws {Error} - 검증 실패 시 에러
 */
function validateSwingResponse(swingResponse) {
  if (!swingResponse || !swingResponse.data) {
    throw new Error('Swing 응답 데이터가 없습니다');
  }

  const userData = swingResponse.data;

  if (userData.authResult !== 'SUCCESS') {
    throw new Error(`Swing 인증 실패: authResult=${userData.authResult}`);
  }

  if (!userData.companyEmail) {
    throw new Error('Swing 응답에 이메일 주소가 없습니다');
  }

  if (!userData.employeeNo) {
    throw new Error('Swing 응답에 사번이 없습니다');
  }

  return userData;
}

module.exports = {
  log,
  apiCall,
  sha256,
  isNumeric,
  validateSwingResponse
};
