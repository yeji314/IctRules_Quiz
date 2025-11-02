/**
 * 결과 페이지
 */

import { requireAuth } from '../modules/auth.js';
import { $, playSound, animate } from '../modules/utils.js';

// 인증 확인
requireAuth();

// DOM 요소
const confettiContainer = $('#confetti');
const scoreValue = $('#scoreValue');
const progressBar = $('#progressBar');
const correctCount = $('#correctCount');
const incorrectCount = $('#incorrectCount');
const luckyDrawCount = $('#luckyDrawCount');
const resultMessage = $('#resultMessage');
const characterSprite = $('#characterSprite');
const homeButton = $('#homeButton');

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

  // 결과 표시
  displayResult(result);

  // 이벤트 리스너
  homeButton.addEventListener('click', handleHome);
  homeButton.addEventListener('mousedown', () => playSound('click'));

  // 컨페티 생성
  if (result.correct_count >= 4) {
    createConfetti();
  }
}

/**
 * 결과 표시
 */
function displayResult(result) {
  const total = result.total_questions;
  const correct = result.correct_count;
  const incorrect = result.incorrect_count;
  const luckydraw = result.luckydraw_count;

  // 점수
  scoreValue.textContent = `${correct}/${total}`;

  // 점수 등급에 따른 스타일
  const percentage = (correct / total) * 100;
  if (percentage === 100) {
    scoreValue.classList.add('score-value--perfect');
  } else if (percentage >= 80) {
    scoreValue.classList.add('score-value--good');
  } else if (percentage >= 60) {
    scoreValue.classList.add('score-value--normal');
  } else {
    scoreValue.classList.add('score-value--bad');
  }

  // 진행 바
  setTimeout(() => {
    progressBar.style.width = `${percentage}%`;

    // 색상 변경
    if (percentage === 100) {
      progressBar.style.background = 'var(--color-gold)';
    } else if (percentage >= 80) {
      progressBar.style.background = 'var(--color-green)';
    } else if (percentage >= 60) {
      progressBar.style.background = 'var(--color-blue)';
    } else {
      progressBar.style.background = 'var(--color-red)';
    }
  }, 500);

  // 통계
  setTimeout(() => {
    animateCount(correctCount, 0, correct, 1000);
  }, 800);

  setTimeout(() => {
    animateCount(incorrectCount, 0, incorrect, 1000);
  }, 1000);

  setTimeout(() => {
    animateCount(luckyDrawCount, 0, luckydraw, 1000);
  }, 1200);

  // 메시지 및 캐릭터
  const { message, character } = getResultMessage(percentage, luckydraw);
  resultMessage.textContent = message;
  characterSprite.textContent = character;

  // 효과음
  setTimeout(() => {
    if (percentage >= 80) {
      playSound('correct');
    } else {
      playSound('coin');
    }
  }, 500);
}

/**
 * 숫자 카운트 애니메이션
 */
function animateCount(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      current = end;
      clearInterval(timer);
      playSound('coin');
      animate(element.parentElement, 'bounce');
    }
    element.textContent = Math.floor(current);
  }, 16);
}

/**
 * 결과 메시지 및 캐릭터
 */
function getResultMessage(percentage, luckyDrawCount) {
  let message, character;

  if (percentage === 100) {
    message = '완벽합니다! 🎉\n모든 문제를 맞혔어요!';
    character = '🏆';
  } else if (percentage >= 80) {
    message = '훌륭해요! 👏\n거의 다 맞혔어요!';
    character = '⭐';
  } else if (percentage >= 60) {
    message = '잘했어요! 👍\n다음에 더 잘할 수 있을 거예요!';
    character = '😊';
  } else {
    message = '아쉬워요! 💪\n다시 도전해보세요!';
    character = '😅';
  }

  // LuckyDraw 추가 메시지
  if (luckyDrawCount > 0) {
    message += `\n\nLuckyDraw 문제 ${luckyDrawCount}개 정답!`;
  }

  return { message, character };
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
 * 홈으로
 */
function handleHome() {
  sessionStorage.removeItem('quizResult');
  window.location.href = '/pages/quiz-list.html';
}

// 초기화
init();
