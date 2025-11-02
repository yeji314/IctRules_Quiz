/**
 * 퀴즈 목록 페이지
 */

import { quiz } from '../modules/api.js';
import { requireAuth, getUser, logout as authLogout } from '../modules/auth.js';
import { $, show, hide, animate, playSound, formatDate } from '../modules/utils.js';

// 인증 확인
requireAuth();

// DOM 요소
const userName = $('#userName');
const logoutButton = $('#logoutButton');
const loadingState = $('#loadingState');
const quizList = $('#quizList');
const errorState = $('#errorState');
const retryButton = $('#retryButton');

/**
 * 초기화
 */
async function init() {
  // 사용자 정보 표시
  const user = getUser();
  if (user) {
    userName.textContent = `${user.name} (${user.department})`;
  }

  // 이벤트 리스너
  logoutButton.addEventListener('click', handleLogout);
  logoutButton.addEventListener('mousedown', () => playSound('click'));
  retryButton.addEventListener('click', loadQuizList);

  // 퀴즈 목록 로드
  await loadQuizList();
}

/**
 * 퀴즈 목록 로드
 */
async function loadQuizList() {
  // UI 상태 초기화
  show(loadingState);
  hide(quizList);
  hide(errorState);

  try {
    // API 호출
    const response = await quiz.getList();

    if (response.success) {
      // 퀴즈 목록 렌더링
      renderQuizList(response.quizList);
      hide(loadingState);
      show(quizList);
      animate(quizList, 'fade-in');
    }
  } catch (error) {
    console.error('퀴즈 목록 로드 실패:', error);
    hide(loadingState);
    show(errorState);
    animate(errorState, 'fade-in');
  }
}

/**
 * 퀴즈 목록 렌더링
 */
function renderQuizList(quizzes) {
  quizList.innerHTML = '';

  if (quizzes.length === 0) {
    quizList.innerHTML = `
      <div class="pixel-card text-center">
        <p>등록된 퀴즈가 없습니다.</p>
      </div>
    `;
    return;
  }

  quizzes.forEach((quizItem, index) => {
    const card = createQuizCard(quizItem, index);
    quizList.appendChild(card);
  });
}

/**
 * 퀴즈 카드 생성
 */
function createQuizCard(quizItem, index) {
  const card = document.createElement('div');
  card.className = 'quiz-card';
  if (quizItem.isExpired) {
    card.classList.add('quiz-card--expired');
  }

  // 애니메이션 딜레이
  card.style.animation = `fadeIn 0.3s ease-out ${index * 0.1}s both`;

  // 진행률 계산
  const progressPercent = Math.round((quizItem.totalAnswered / quizItem.totalQuestions) * 100);

  // LuckyDraw 스타 생성
  const luckyDrawStars = [];
  for (let i = 0; i < quizItem.luckyDrawTotal; i++) {
    if (i < quizItem.luckyDrawCount) {
      luckyDrawStars.push('<span class="star-filled">⭐</span>');
    } else {
      luckyDrawStars.push('<span class="star-empty">☆</span>');
    }
  }

  // 날짜 포맷
  const startDate = formatDate(quizItem.startDate);
  const endDate = formatDate(quizItem.endDate);

  // 버튼 스타일 결정
  let buttonClass = 'pixel-button--green';
  if (quizItem.isExpired) {
    buttonClass = 'pixel-button';
  } else if (quizItem.currentRound > 0) {
    buttonClass = 'pixel-button--yellow';
  }

  card.innerHTML = `
    <div class="quiz-card__header">
      <h3 class="quiz-card__title">${quizItem.title}</h3>
      <div class="quiz-card__date">
        <span>${startDate} ~ ${endDate}</span>
        ${quizItem.isExpired ? '<span class="date-badge date-badge--expired">만료됨</span>' : ''}
      </div>
    </div>

    <div class="quiz-card__progress">
      <div class="progress-info">
        <span class="progress-text">${quizItem.totalAnswered} / ${quizItem.totalQuestions} 문제 완료</span>
        <span class="progress-percent">${progressPercent}%</span>
      </div>
      <div class="progress-bar-wrapper">
        <div class="pixel-progress">
          <div class="pixel-progress__bar" style="width: ${progressPercent}%"></div>
        </div>
      </div>
    </div>

    <div class="quiz-card__luckydraw">
      <span class="luckydraw-label">LuckyDraw:</span>
      <div class="luckydraw-stars">
        ${luckyDrawStars.join('')}
      </div>
    </div>

    <div class="quiz-card__footer">
      <button
        class="pixel-button start-button ${buttonClass}"
        data-event-id="${quizItem.eventId}"
        ${!quizItem.buttonEnabled ? 'disabled' : ''}
      >
        ${quizItem.buttonText}
      </button>
    </div>
  `;

  // 시작 버튼 이벤트
  const startButton = card.querySelector('.start-button');
  if (startButton && !startButton.disabled) {
    startButton.addEventListener('mousedown', () => playSound('click'));
    startButton.addEventListener('click', () => handleStartQuiz(quizItem.eventId));
  }

  return card;
}

/**
 * 퀴즈 시작
 */
async function handleStartQuiz(eventId) {
  playSound('coin');

  try {
    // 세션 시작 API 호출
    const response = await quiz.startSession(eventId);

    if (response.success) {
      // 세션 정보 저장
      sessionStorage.setItem('currentSession', JSON.stringify({
        sessionId: response.session.id,
        sessionNumber: response.session.session_number,
        eventId: response.session.event_id,
        questions: response.questions,
        currentQuestionIndex: 0
      }));

      // 퀴즈 페이지로 이동
      window.location.href = '/pages/quiz.html';
    }
  } catch (error) {
    console.error('퀴즈 시작 실패:', error);
    alert('⚠️ ' + (error.message || '퀴즈 시작에 실패했습니다'));
    playSound('wrong');
  }
}

/**
 * 로그아웃
 */
function handleLogout() {
  if (confirm('로그아웃하시겠습니까?')) {
    playSound('click');
    authLogout();
  }
}

// 초기화 실행
init();
