/**
 * 로그인 페이지
 */

import { auth } from '../modules/api.js';
import { setToken, setUser, isLoggedIn } from '../modules/auth.js';
import { $, show, hide, animate, playSound } from '../modules/utils.js';

// DOM 요소
const loginForm = $('#loginForm');
const employeeIdInput = $('#employeeId');
const passwordInput = $('#password');
const loginButton = $('#loginButton');
const errorMessage = $('#errorMessage');

/**
 * 초기화
 */
function init() {
  // 1. URL 파라미터 확인 (SSO 인증 처리)
  const urlParams = new URLSearchParams(window.location.search);
  
  // Swing SSO 토큰이 있는 경우 자동 로그인
  const ssoToken = urlParams.get('gw_sso_auth_code');
  if (ssoToken) {
    handleSsoLogin(ssoToken);
    return;
  }

  // SSO 에러 메시지 표시
  const errorParam = urlParams.get('error');
  if (errorParam) {
    showError(decodeURIComponent(errorParam));
  }

  // 2. 이미 로그인된 경우 퀴즈 목록으로 리다이렉트
  if (isLoggedIn()) {
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  // 3. 이벤트 리스너 등록
  loginForm.addEventListener('submit', handleLogin);

  // 엔터키로 로그인
  employeeIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });

  // 입력 시 에러 메시지 숨김
  employeeIdInput.addEventListener('input', () => hide(errorMessage));
  passwordInput.addEventListener('input', () => hide(errorMessage));

  // 클릭 효과음
  loginButton.addEventListener('mousedown', () => playSound('click'));
}

/**
 * Swing SSO 토큰으로 자동 로그인
 */
async function handleSsoLogin(ssoToken) {
  try {
    console.log('[SSO] Swing SSO 토큰 인증 시작');
    
    // 로딩 상태 표시
    setLoading(true);
    showSuccess('SSO 로그인 처리 중...');
    
    // 기존 API 호출
    const response = await fetch('/api/auth/swing/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sso_token: ssoToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('[SSO] 서버 응답:', data);
      console.log('[SSO] 받은 토큰:', data.token);
      
      // 토큰과 사용자 정보 저장
      setToken(data.token);
      setUser(data.user);
      
      // 저장 확인
      console.log('[SSO] 저장된 토큰:', localStorage.getItem('token'));
      console.log('[SSO] 저장된 사용자:', localStorage.getItem('user'));
      
      // 성공 메시지 표시
      showSuccess(`환영합니다, ${data.user.name}님! (SSO 로그인)`);
      playSound('correct');
      
      // URL에서 SSO 토큰 제거 (보안)
      window.history.replaceState({}, document.title, '/pages/index.html');
      
      // 퀴즈 목록으로 이동
      setTimeout(() => {
        window.location.href = '/pages/quiz-list.html';
      }, 800);
    } else {
      throw new Error(data.error || 'SSO 인증에 실패했습니다');
    }
    
  } catch (error) {
    console.error('[SSO] 인증 실패:', error);
    showError(error.message || 'SSO 로그인에 실패했습니다');
    playSound('wrong');
    setLoading(false);
    
    // URL 정리
    window.history.replaceState({}, document.title, '/pages/index.html');
  }
}

/**
 * 로그인 처리
 */
async function handleLogin(e) {
  e.preventDefault();

  const employeeId = employeeIdInput.value.trim();
  const password = passwordInput.value;

  // 입력 검증
  if (!employeeId || !password) {
    showError('행원번호와 비밀번호를 입력해주세요');
    animate(loginForm, 'shake');
    playSound('wrong');
    return;
  }

  // 로딩 상태
  setLoading(true);

  try {
    // 로그인 API 호출
    const response = await auth.login(employeeId, password);

    if (response.success) {
      // 토큰과 사용자 정보 저장
      setToken(response.token);
      setUser(response.user);

      // 성공 효과음
      playSound('correct');

      // 성공 메시지 표시
      showSuccess('로그인 성공!');

      // 페이지 이동 (관리자도 quiz-list.html로 이동, 톱니바퀴로 대시보드 접근)
      setTimeout(() => {
        window.location.href = '/pages/quiz-list.html';
      }, 500);
    }
  } catch (error) {
    // 에러 처리
    console.error('로그인 실패:', error);
    showError(error.message || '로그인에 실패했습니다');
    animate(loginForm, 'shake');
    playSound('wrong');
    setLoading(false);
  }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
  errorMessage.textContent = '⚠️ ' + message;
  errorMessage.classList.remove('hidden');
  animate(errorMessage, 'fade-in');
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
  errorMessage.textContent = '✓ ' + message;
  errorMessage.style.background = 'var(--color-green)';
  errorMessage.style.borderColor = 'var(--color-green-dark)';
  show(errorMessage);
  animate(errorMessage, 'fade-in');
}

/**
 * 로딩 상태 설정
 */
function setLoading(loading) {
  if (loading) {
    loginButton.disabled = true;
    loginButton.textContent = 'LOADING...';
    loginButton.classList.add('loading');
  } else {
    loginButton.disabled = false;
    loginButton.textContent = 'START ▶';
    loginButton.classList.remove('loading');
  }
}

// 페이지 로드 시 초기화
init();
