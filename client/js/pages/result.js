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

