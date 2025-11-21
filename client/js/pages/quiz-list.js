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
const adminGearBtn = $('#adminGearBtn');

/**
 * 초기화
 */
async function init() {
  // 사용자 정보 표시 (ㅇㅇㅇ님 형태)
  const user = getUser();
  if (user) {
    userNameDisplay.textContent = `${user.name}님` || 'User';

    // 관리자 버튼 표시 여부 확인 (행번 19200617)
    if (user.employee_id === '19200617') {
      adminGearBtn.style.display = 'block';
      adminGearBtn.addEventListener('mousedown', () => playSound('click'));
      adminGearBtn.addEventListener('click', handleAdminClick);
    }
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

  // 진행률(문제를 푼 횟수) - 서버에서 내려주는 currentRound 기준 (0~3)
  const rawProgress = typeof quizItem.currentRound === 'number' ? quizItem.currentRound : 0;
  const progress = Math.max(0, Math.min(rawProgress, 3)); // 0 ~ 3 로 클램프

  // 버튼 텍스트 / 활성화 여부 / NES 색상 클래스 - 진행률 규칙에 따라 결정
  let buttonText;
  let buttonDisabled;
  let buttonVariantClass;

  if (progress === 0) {
    // 0회 풀었을 때
    buttonText = 'START';
    buttonDisabled = false;
    buttonVariantClass = 'is-primary'; // index START와 동일 파란색
  } else if (progress === 1 || progress === 2) {
    // 1회 또는 2회 풀었을 때
    buttonText = 'CONTINUE';
    buttonDisabled = false;
    buttonVariantClass = 'is-success'; // 진행 중 - 초록색
  } else {
    // 3회 풀었을 때 (또는 그 이상) - 완료
    buttonText = 'COMPLETE';
    buttonDisabled = true;
    buttonVariantClass = 'is-warning'; // 완료 - 노랑색
  }

  // 만료된 이벤트는 무조건 COMPLETE + 비활성화
  if (quizItem.isExpired) {
    buttonText = 'COMPLETE';
    buttonDisabled = true;
    buttonVariantClass = 'is-warning';
  }

  const maxSessions = 3;

  // 진행률 박스 생성 (■/□)
  let progressBoxes = '';
  for (let i = 0; i < maxSessions; i++) {
    const filled = i < progress ? 'filled' : '';
    progressBoxes += `<div class="progress-box ${filled}"></div>`;
  }

  // 월 표시 (서버에서 내려준 title 우선 사용, 없으면 index 기반)
  const monthText = quizItem.title || `${index + 1}월`;

  board.innerHTML = `
    <div class="wood-nail wood-nail--left"></div>
    <div class="quiz-info">
      <div class="quiz-month">${monthText}</div>
      <button class="quiz-action-btn nes-btn ${buttonVariantClass}" ${buttonDisabled ? 'disabled' : ''}>
        ${buttonText}
      </button>
      <div class="quiz-progress">
        ${progressBoxes}
      </div>
    </div>
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

/**
 * 관리자 대시보드로 이동
 */
function handleAdminClick() {
  playSound('coin');
  window.location.href = '/pages/admin/dashboard.html';
}

// 초기화 실행
init();
