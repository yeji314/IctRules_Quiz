/**
 * 결과 페이지
 */

import { requireAuth } from '../modules/auth.js';
import { quiz as quizApi } from '../modules/api.js';
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
  // 브라우저 뒤로가기 방지
  history.pushState(null, null, location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);
  });

  // 결과 데이터 로드
  const resultData = sessionStorage.getItem('quizResult');
  if (!resultData) {
    alert('결과 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  const result = JSON.parse(resultData);

  console.log('[Result] 결과 데이터:', result);

  // 선물 당첨 여부 확인
  if (result.won_prize === true) {
    starEarned.textContent = '🎉 선물 당첨! 🎉';
    starEarned.style.fontSize = '32px';
    starEarned.style.fontWeight = 'bold';
    starEarned.style.animation = 'bounce 0.6s ease infinite';
    createFireworks();
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
 * 폭죽 생성
 */
function createFireworks() {
  // 여러 위치에서 폭죽 터뜨리기
  const positions = [
    { x: 20, y: 30 },
    { x: 50, y: 20 },
    { x: 80, y: 35 },
    { x: 35, y: 50 },
    { x: 65, y: 45 }
  ];

  positions.forEach((pos, index) => {
    setTimeout(() => {
      createFireworkBurst(pos.x, pos.y);
    }, index * 400);
  });
}

/**
 * 개별 폭죽 폭발 생성
 */
function createFireworkBurst(x, y) {
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 100 + Math.random() * 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');
    
    confettiContainer.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 2000);
  }

  // 별 폭죽도 추가
  for (let i = 0; i < 10; i++) {
  setTimeout(() => {
      const star = document.createElement('div');
      star.className = 'firework-star';
      star.textContent = '⭐';
      star.style.left = `${x + (Math.random() - 0.5) * 20}%`;
      star.style.top = `${y + (Math.random() - 0.5) * 20}%`;
      
      const starTx = (Math.random() - 0.5) * 150;
      const starTy = (Math.random() - 0.5) * 150;
      star.style.setProperty('--tx', starTx + 'px');
      star.style.setProperty('--ty', starTy + 'px');
      
      confettiContainer.appendChild(star);

  setTimeout(() => {
        star.remove();
      }, 2000);
    }, i * 50);
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
async function handleContinue() {
  // 결과 데이터 확인
  const resultData = sessionStorage.getItem('quizResult');
  if (!resultData) {
    alert('결과 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  const result = JSON.parse(resultData);

  if (!result.eventId) {
    alert('이벤트 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
    }

  try {
    console.log('[Result Continue] 세션 시작 요청, eventId:', result.eventId);

    // 새로운 세션 시작
    const response = await quizApi.startSession(result.eventId);

    console.log('[Result Continue] API 응답:', response);
    console.log('[Result Continue] 첫 문제:', response.question);

    if (response.success && response.session) {
      // 새 세션 정보 저장 (동적 문제 선택 방식)
      const sessionData = {
        sessionId: response.session.id,
        sessionNumber: response.session.session_number,
        eventId: response.session.event_id,
        question: response.question,  // 첫 번째 문제만 저장
        current_question_number: response.current_question_number || 1,
        total_questions: response.total_questions || 5
      };

      console.log('[Result Continue] 세션 데이터 저장:', sessionData);
      sessionStorage.setItem('currentSession', JSON.stringify(sessionData));

      // 결과 데이터 제거
      sessionStorage.removeItem('quizResult');

      // 퀴즈 페이지로 이동
      window.location.href = '/pages/quiz.html';
    } else {
      alert(response.message || '세션 시작에 실패했습니다');
      window.location.href = '/pages/quiz-list.html';
  }
  } catch (error) {
    console.error('세션 시작 실패:', error);
    alert('세션 시작에 실패했습니다: ' + error.message);
  window.location.href = '/pages/quiz-list.html';
  }
}

// 초기화
init();

