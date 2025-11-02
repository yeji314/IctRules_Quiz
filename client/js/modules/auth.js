/**
 * 인증 관리 모듈
 */

/**
 * 토큰 저장
 */
export function setToken(token) {
  localStorage.setItem('token', token);
}

/**
 * 토큰 가져오기
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * 토큰 삭제
 */
export function removeToken() {
  localStorage.removeItem('token');
}

/**
 * 로그인 여부 확인
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * 사용자 정보 저장
 */
export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * 사용자 정보 가져오기
 */
export function getUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * 사용자 정보 삭제
 */
export function removeUser() {
  localStorage.removeItem('user');
}

/**
 * 로그아웃
 */
export function logout() {
  removeToken();
  removeUser();
  window.location.href = '/pages/index.html';
}

/**
 * 관리자 여부 확인
 */
export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

/**
 * 인증 필요 페이지 가드
 */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/index.html';
    return false;
  }
  return true;
}

/**
 * 관리자 전용 페이지 가드
 */
export function requireAdmin() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/index.html';
    return false;
  }
  if (!isAdmin()) {
    alert('관리자 권한이 필요합니다');
    window.location.href = '/pages/quiz-list.html';
    return false;
  }
  return true;
}
