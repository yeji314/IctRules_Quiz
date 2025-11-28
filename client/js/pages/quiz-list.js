/**
 * 퀴즈 목록 페이지
 */

import { quiz } from '../modules/api.js';
import { requireAuth, getUser, logout as authLogout } from '../modules/auth.js';
import { $, show, hide, animate, playSound, formatDate } from '../modules/utils.js';
import { showPixelAlert, showPixelConfirm } from '../modules/pixel-dialog.js';
import { initSpeechBubbleAnchor, adjustSpeechBubbleSize } from '../utils/speech-bubble-anchor.js';

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

    // 관리자 버튼 표시 여부 확인 (role 기반)
    if (user.role === 'admin') {
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

  // 캐릭터-말풍선 고정 정렬 로직: 앵커 초기화 (resize, scroll, load, DOM 변경 시 자동 재계산)
  initSpeechBubbleAnchor();

  // 말풍선 초기 크기 조정
  adjustSpeechBubbleSize();
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
 * 미래 퀴즈 판별 함수
 * @param {Object} quizItem - 퀴즈 아이템 (startDate 필드 포함)
 * @param {Date} now - 현재 날짜 (기본값: new Date())
 * @returns {boolean} - 미래 퀴즈면 true, 아니면 false
 */
function isFutureQuiz(quizItem, now = new Date()) {
  if (!quizItem.startDate) return false;
  const start = new Date(quizItem.startDate);
  return start > now;
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

  // 남은 문제 수 확인 (서버에서 내려주는 remainingQuestions 기준)
  const remainingQuestions = typeof quizItem.remainingQuestions === 'number'
    ? quizItem.remainingQuestions
    : quizItem.totalQuestions || 0;

  // 완료된 문제 수 (이미 푼 문제)
  const completedQuestions = (quizItem.totalQuestions || 0) - remainingQuestions;

  // 버튼 텍스트 / 활성화 여부 / NES 색상 클래스 - 우선순위별 결정
  let buttonText;
  let buttonDisabled;
  let buttonVariantClass;
  let isLocked = false; // 잠금 상태 플래그

  // 최우선 조건: 미래 퀴즈 (아직 시작되지 않은 퀴즈)
  if (isFutureQuiz(quizItem)) {
    buttonText = ''; // 텍스트는 CSS로 숨김
    buttonDisabled = true;
    buttonVariantClass = 'btn-locked';
    isLocked = true;
  }
  // 두 번째 우선순위: 만료된 이벤트
  else if (quizItem.isExpired) {
    buttonText = 'COMPLETE';
    buttonDisabled = true;
    buttonVariantClass = 'is-warning';
  }
  // 세 번째 우선순위: 남은 문제 수 기반 상태
  else if (remainingQuestions < 5) {
    // 남은 문제가 5개 미만이면 세션 시작 불가 -> COMPLETE
    buttonText = 'COMPLETE';
    buttonDisabled = true;
    buttonVariantClass = 'is-warning';
  }
  else if (completedQuestions === 0) {
    // 아직 한 문제도 안 풀었을 때
    buttonText = 'START';
    buttonDisabled = false;
    buttonVariantClass = 'is-primary'; // 파란색
  }
  else {
    // 일부 풀었지만 5개 이상 남았을 때
    buttonText = 'CONTINUE';
    buttonDisabled = false;
    buttonVariantClass = 'is-success'; // 초록색
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
    </div>
    <div class="wood-nail wood-nail--right"></div>
  `;

  // 잠금 상태일 때 wood-board에 클래스 추가 (오버레이 효과용)
  if (isLocked) {
    board.classList.add('is-locked');
  }

  // 버튼 클릭 이벤트 - 미래 퀴즈는 클릭 방지
  const actionBtn = board.querySelector('.quiz-action-btn');
  if (actionBtn) {
    if (isLocked) {
      // 미래 퀴즈: 클릭 시 알림 표시
      actionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await showPixelAlert('아직 시작되지 않은 퀴즈입니다.', { title: '알림' });
      });
    } else if (!buttonDisabled) {
      // 정상 퀴즈: 세션 시작
      actionBtn.addEventListener('mousedown', () => playSound('click'));
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStartQuiz(quizItem.eventId);
      });
    }
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
    await showPixelAlert(error.message || '퀴즈 시작에 실패했습니다', { title: '오류' });
    playSound('wrong');
  }
}

/**
 * 로그아웃
 */
async function handleLogout() {
  const confirmed = await showPixelConfirm('로그아웃하시겠습니까?', { title: '로그아웃' });
  if (confirmed) {
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
