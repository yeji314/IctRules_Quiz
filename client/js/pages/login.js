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
  // 이미 로그인된 경우 퀴즈 목록으로 리다이렉트
  if (isLoggedIn()) {
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  // 이벤트 리스너 등록
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

      // 페이지 이동
      setTimeout(() => {
        if (response.user.role === 'admin') {
          window.location.href = '/pages/admin/dashboard.html';
        } else {
          window.location.href = '/pages/quiz-list.html';
        }
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
