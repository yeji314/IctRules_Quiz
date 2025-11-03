/**
 * 결과 페이지
 */

import { requireAuth } from '../modules/auth.js';
import { $, playSound } from '../modules/utils.js';

// 인증 확인
requireAuth();

// DOM 요소
const confettiContainer = $('#confetti');
const starEarned = $('#starEarned');
const quitButton = $('#quitButton');
const continueButton = $('#continueButton');

/**
 * 초기화
 */
function init() {
  // 결과 데이터 로드
  const resultData = sessionStorage.getItem('quizResult');
  if (!resultData) {
    alert('결과 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  const result = JSON.parse(resultData);

  // 별 획득 여부 표시
  if (result.luckydraw_count > 0) {
    starEarned.textContent = `⭐ 획득 (Lucky Draw ${result.luckydraw_count}개 정답!)`;
    createConfetti();
    playSound('correct');
  } else {
    starEarned.classList.add('hidden');
  }

  // 이벤트 리스너
  quitButton.addEventListener('click', handleQuit);
  quitButton.addEventListener('mousedown', () => playSound('click'));
  
  continueButton.addEventListener('click', handleContinue);
  continueButton.addEventListener('mousedown', () => playSound('click'));
}


/**
 * 컨페티 생성
 */
function createConfetti() {
  const colors = [
    'var(--color-gold)',
    'var(--color-red)',
    'var(--color-blue)',
    'var(--color-green)',
    'var(--color-yellow)'
  ];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confetti.style.animationDuration = `${3 + Math.random() * 2}s`;
    confettiContainer.appendChild(confetti);
  }
}

/**
 * 그만하기
 */
function handleQuit() {
  sessionStorage.removeItem('quizResult');
  sessionStorage.removeItem('currentSession');
  window.location.href = '/pages/quiz-list.html';
}

/**
 * 계속하기
 */
function handleContinue() {
  // 현재 세션 정보 확인
  const sessionData = sessionStorage.getItem('currentSession');
  if (!sessionData) {
    alert('세션 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  // 결과 데이터 제거하고 퀴즈 페이지로
  sessionStorage.removeItem('quizResult');
  window.location.href = '/pages/quiz.html';
}

// 초기화
init();

