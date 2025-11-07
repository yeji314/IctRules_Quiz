/**
 * 퀴즈 목록 페이지
 */

import { quiz } from '../modules/api.js';
import { requireAuth, getUser, logout as authLogout } from '../modules/auth.js';
import { $, show, hide, animate, playSound, formatDate } from '../modules/utils.js';

// 인증 확인
requireAuth();

// DOM 요소
const userNameDisplay = $('#userNameDisplay');
const logoutBtn = $('#logoutBtn');
const loadingState = $('#loadingState');
const quizList = $('#quizList');
const errorState = $('#errorState');
const retryButton = $('#retryButton');

/**
 * 초기화
 */
async function init() {
  // 사용자 정보 표시 (ㅇㅇㅇ님 형태)
  const user = getUser();
  if (user) {
    userNameDisplay.textContent = `${user.name}님` || 'User';
  }

  // 이벤트 리스너
  logoutBtn.addEventListener('click', handleLogout);
  logoutBtn.addEventListener('mousedown', () => playSound('click'));
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
      <div class="wood-board" style="justify-content: center; pointer-events: none;">
        <p style="font-family: var(--font-pixel); font-size: 12px; color: #3e2723;">등록된 퀴즈가 없습니다.</p>
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
 * 퀴즈 카드 생성 (나무판자 스타일)
 */
function createQuizCard(quizItem, index) {
  const board = document.createElement('div');
  board.className = 'wood-board';

  // 애니메이션 딜레이
  board.style.animation = `fadeIn 0.3s ease-out ${index * 0.15}s both`;

  // 진행률 계산
  const progressPercent = Math.round((quizItem.totalAnswered / quizItem.totalQuestions) * 100);

  // 날짜 포맷
  const startDate = formatDate(quizItem.startDate);
  const endDate = formatDate(quizItem.endDate);

  // 상태 뱃지 및 버튼 텍스트
  let statusBadge = '';
  let buttonText = '';
  let buttonDisabled = false;
  

  // LuckyDraw 별표 계산 (nes.css 아이콘으로 표시)
  const luckyDrawCount = quizItem.luckyDrawCount || 0;
  let luckyDrawStars = '';

   if (quizItem.isExpired) {
    statusBadge = '<span class="status-badge status-badge--expired">만료</span>';
    buttonText = '만료됨 🔒';
    buttonDisabled = true;
  } else if (progressPercent === 100) {
    statusBadge = '<span class="status-badge status-badge--completed">완료</span>';
    buttonText = '완료 ✓';
    buttonDisabled = true;
  } else if (progressPercent > 0) {
    buttonText = '계속하기';
  } else {
    buttonText = '시작하기';
  }  

  // 채워진 별과 빈 별 생성
  if (luckyDrawCount > 0) {
    luckyDrawStars += '<i class="nes-icon is-medium star"></i>';
  } else {
    luckyDrawStars += '<i class="nes-icon is-medium star is-empty"></i>';
  }


  board.innerHTML = `
    <div class="wood-nail wood-nail--left"></div>
    <div class="quiz-info">
      <div class="quiz-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="quiz-details">
        <div class="quiz-title">${quizItem.title}</div>
      </div>
      <div class="quiz-star-badge">${luckyDrawStars}</div>
    </div>
    <button class="nes-btn ${buttonDisabled ? 'is-disabled' : 'is-primary'} quiz-action-btn" ${buttonDisabled ? 'disabled' : ''}>
      ${buttonText}
    </button>
    <div class="wood-nail wood-nail--right"></div>
  `;

  // 버튼 클릭 이벤트
  const actionBtn = board.querySelector('.quiz-action-btn');
  if (actionBtn && !buttonDisabled) {
    actionBtn.addEventListener('mousedown', () => playSound('click'));
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleStartQuiz(quizItem.eventId);
    });
  }
  
  // 비활성화 상태 스타일
  if (buttonDisabled) {
    board.style.opacity = '0.7';
  }

  return board;
}

/**
 * 퀴즈 시작
 */
async function handleStartQuiz(eventId) {
  playSound('coin');

  try {
    console.log('[Quiz Start] 세션 시작 요청, eventId:', eventId);

    // 세션 시작 API 호출
    const response = await quiz.startSession(eventId);

    console.log('[Quiz Start] API 응답:', response);
    console.log('[Quiz Start] 첫 문제:', response.question);

    if (response.success) {
      // 세션 정보 저장 (동적 문제 선택 방식)
      const sessionData = {
        sessionId: response.session.id,
        sessionNumber: response.session.session_number,
        eventId: response.session.event_id,
        question: response.question,  // 첫 번째 문제만 저장
        current_question_number: response.current_question_number || 1,
        total_questions: response.total_questions || 5
      };

      console.log('[Quiz Start] 세션 데이터 저장:', sessionData);
      sessionStorage.setItem('currentSession', JSON.stringify(sessionData));

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
