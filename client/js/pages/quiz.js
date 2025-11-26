/**
 * 퀴즈 게임 페이지
 */

import { quiz as quizApi } from '../modules/api.js';
import { requireAuth, getUser, logout } from '../modules/auth.js';
import { $, show, hide, animate, playSound } from '../modules/utils.js';
import { showPixelAlert, showPixelConfirm } from '../modules/pixel-dialog.js';

// 인증 확인
requireAuth();

// DOM 요소
const userNameDisplay = $('#userNameDisplay');
const logoutBtn = $('#logoutBtn');
const questionText = $('#questionText');
const answersArea = $('#answersArea');
const explanationBubble = $('#explanationBubble');
const explanationText = $('#explanationText');
const fireworksContainer = $('#fireworksContainer');
const characterImg = document.querySelector('.character-img');

// 상태
let currentSession = null;
let currentQuestionIndex = 0;
let currentAnswer = null;
let startTime = null;
let timerInterval = null;
let firstAttemptCorrectCount = 0;
let totalQuestions = 0;

/**
 * 질문 헤더 포맷터 - [] 토큰을 빈칸 박스로 치환
 */
function formatQuestionHeaderText(rawText) {
  if (!rawText) return '';
  // [] 토큰을 빈칸 네모 박스로 변환
  return rawText.replace(/\[\]/g, '<span class="blank-chip"></span>');
}

/**
 * 초기화
 */
async function init() {
  // 브라우저 뒤로가기 방지
  history.pushState(null, null, location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);
  });

  // 접근성: 진행 게이지 그룹 레이블 설정
  const gaugeSection = document.querySelector('.progress-gauge-section');
  if (gaugeSection) {
    gaugeSection.setAttribute('role', 'group');
    gaugeSection.setAttribute('aria-label', '퀴즈 진행 상태');
  }

  // 사용자 정보 로드
  const user = getUser();
  if (user) {
    userNameDisplay.textContent = `${user.name}님`;
  }

  // 로그아웃 이벤트
  logoutBtn.addEventListener('click', async () => {
    const confirmed = await showPixelConfirm('로그아웃 하시겠습니까?', { title: '로그아웃' });
    if (confirmed) {
      logout();
      window.location.href = '/pages/index.html';
    }
  });

  // 세션 정보 로드
  const sessionData = sessionStorage.getItem('currentSession');
  if (!sessionData) {
    await showPixelAlert('세션 정보가 없습니다', { title: '오류' });
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  currentSession = JSON.parse(sessionData);
  console.log('[Quiz Init] 세션 데이터:', currentSession);

  // 새 세션 시작 시 항상 1부터 시작 (서버에서 받은 값 사용)
  currentQuestionIndex = currentSession.current_question_number || 1;
  totalQuestions = currentSession.total_questions || 5;

  console.log('[Quiz Init] 현재 문제 번호:', currentQuestionIndex);
  console.log('[Quiz Init] 전체 문제 수:', totalQuestions);

  if (!currentSession.question) {
    await showPixelAlert('문제 정보가 없습니다', { title: '오류' });
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  // ESC 키로 종료
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleQuit();
    }
  });

  // 첫 문제 로드
  loadQuestion();

  // 타이머 시작
  startTimer();

  // 말풍선 앵커 업데이트 (불변 조건 1)
  updateSpeechBubbleAnchor();

  // 리사이즈/스크롤 시 앵커 재계산
  window.addEventListener('resize', updateSpeechBubbleAnchor);
  window.addEventListener('scroll', updateSpeechBubbleAnchor);

  // 애니메이션/전환 후에도 앵커 재계산
  const observer = new MutationObserver(updateSpeechBubbleAnchor);
  const characterSection = document.querySelector('.character-section');
  if (characterSection) {
    observer.observe(characterSection, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
}

/**
 * 말풍선 앵커 업데이트 (불변 조건 A: 근접 고정)
 * 캐릭터 top-center 좌표를 계산하여 CSS 변수로 주입
 *
 * Gap 제약:
 * - ideal-gap: 8px (목표 간격)
 * - min-gap: 4px (겹침 방지)
 * - max-gap: 14px (멀어짐 방지)
 */
function updateSpeechBubbleAnchor() {
  const characterImg = document.querySelector('.character-img');
  const speechBubble = document.querySelector('.speech-bubble');

  if (!characterImg || !speechBubble) return;

  // Gap 제약 상수 (불변 조건 A)
  const IDEAL_GAP = 8;
  const MIN_GAP = 4;
  const MAX_GAP = 14;

  // 말풍선 SVG에서 꼬리 끝점의 상대 위치 (SVG 최하단으로부터의 거리)
  // adjustSpeechBubbleSize()에서 꼬리는 항상 하단 12px 영역에 위치 (3단 계단형: 12px, 8px, 4px)
  const TAIL_TIP_OFFSET = 12; // 꼬리 끝점이 SVG 하단에서 얼마나 올라와 있는지

  // Get character's bounding rect (includes transforms)
  const rect = characterImg.getBoundingClientRect();

  // 캐릭터 top-center 좌표
  const characterTopCenterX = rect.left + (rect.width / 2);
  const characterTopY = rect.top;

  // 꼬리 tip의 실제 Y 좌표 (캐릭터 top 위 IDEAL_GAP 떨어진 위치)
  const tailTipTargetY = characterTopY - IDEAL_GAP;

  // 말풍선 SVG bottom 위치 계산
  // SVG의 bottom이 tailTipTargetY - TAIL_TIP_OFFSET에 위치해야 함
  // (꼬리 tip은 SVG bottom으로부터 TAIL_TIP_OFFSET만큼 위에 있음)
  const anchorBottom = window.innerHeight - (tailTipTargetY - TAIL_TIP_OFFSET);

  // Gap 제약 검증 (실제 gap = 캐릭터 top과 꼬리 tip 사이 거리)
  const actualGap = characterTopY - tailTipTargetY;
  if (actualGap < MIN_GAP || actualGap > MAX_GAP) {
    console.warn(`[Anchor] Gap constraint violated: ${actualGap.toFixed(1)}px (allowed: ${MIN_GAP}~${MAX_GAP}px)`);
  }

  // Inject CSS variables
  speechBubble.style.setProperty('--anchor-left', `${characterTopCenterX}px`);
  speechBubble.style.setProperty('--anchor-bottom', `${anchorBottom}px`);
}

/**
 * 문제 로드
 */
function loadQuestion() {
  // 세션 완료 체크는 handleNext나 handleSubmit에서 처리됨

  const question = currentSession.question;

  // 타이핑 문제는 문제 텍스트를 숨김
  if (question.question_type === 'typing') {
    questionText.textContent = '다음 문장을 따라 입력하세요.';
  } else {
    questionText.innerHTML = formatQuestionHeaderText(question.question_text);
  }

  // 캐릭터 감정: 문제 로딩 시 생각하는 표정
  setCharacterEmotion('thinking');

  // 문제 등장 애니메이션 (Duolingo 스타일 bounce-in)
  questionText.classList.remove('bounce-in');
  void questionText.offsetWidth; // Trigger reflow
  questionText.classList.add('bounce-in');

  // 답변 초기화
  currentAnswer = null;

  // 제출 상태 초기화
  answersArea.dataset.submitting = 'false';
  answersArea.dataset.isCorrect = 'false';

  // 해설 말풍선 내용 초기화 (항상 표시)
  explanationBubble.classList.remove('ox-hint', 'long', 'luckydraw-hint', 'empty', 'correct', 'incorrect');

  // LuckyDraw 문제인지 확인하고 말풍선 표시
  console.log('[Quiz loadQuestion] luckydraw_eligible:', currentSession.luckydraw_eligible);
  console.log('[Quiz loadQuestion] is_lucky_draw:', question.is_lucky_draw);

  if (question.is_lucky_draw) {
    explanationText.textContent = '이번문제는 luckydraw문제입니다. 맞추면 선물 획득 기회가 있어요!';
    explanationBubble.classList.add('luckydraw-hint');
    console.log('[Quiz] ✅ LuckyDraw 말풍선 표시됨!');
  } else {
    // 기본 안내 문구
    if (question.question_type === 'typing') {
      explanationText.textContent = '정확히 입력하세요! 😊';
    } else {
      explanationText.textContent = '정답을 골라보세요! 💪';
    }
    explanationBubble.classList.add('empty');
    console.log('[Quiz] ✅ 일반 문제 - 안내 말풍선');
  }

  // 말풍선 크기 즉시 조정 (새 문제 로드 시)
  adjustSpeechBubbleSize();

  // 문제 타입에 따라 렌더링
  renderQuestion(question);
}

/**
 * 문제 렌더링
 */
function renderQuestion(question) {
  answersArea.innerHTML = '';

  switch (question.question_type) {
    case 'dragdrop':
    case 'drag_and_drop':
      setAnswersType('type-dragdrop');
      renderDragDrop(question);
      break;
    case 'typing':
      setAnswersType('type-typing');
      renderTyping(question);
      break;
    case 'fillblank':
    case 'fill_in_blank':
      setAnswersType('type-multiple-choice');
      renderMultipleChoice(question, 'fill_in_blank');
      break;
    case 'ox':
      setAnswersType('type-ox');
      renderOX(question);
      break;
    case 'best_action':
      setAnswersType('type-multiple-choice');
      renderMultipleChoice(question, 'best_action');
      break;
    default:
      answersArea.innerHTML = '<p>지원하지 않는 문제 타입입니다.</p>';
  }
}

/**
 * answers 영역 타입 클래스 관리 (레이아웃 전용)
 * @param {string|null} typeClass - 'type-dragdrop' | 'type-multiple-choice' | 'type-typing' | 'type-ox'
 */
function setAnswersType(typeClass) {
  const typeClasses = [
    'type-dragdrop',
    'type-multiple-choice',
    'type-typing',
    'type-ox',
  ];

  typeClasses.forEach((cls) => answersArea.classList.remove(cls));

  if (typeClass) {
    answersArea.classList.add(typeClass);
  }
}

/**
 * 1. Drag & Drop 렌더링 (자석 효과 포함)
 */
function renderDragDrop(question) {
  const { items, target_label, options, correct_answer } = question.question_data;
  const dragItems = items || options;

  const container = document.createElement('div');
  container.className = 'dragdrop-container';

  // 드롭 타겟 (상단)
  const targetEl = document.createElement('div');
  targetEl.className = 'dragdrop-target';
  targetEl.innerHTML = `<span class="target-text">${target_label || '여기에 드래그하세요'}</span>`;

  let currentDraggingItem = null;
  let currentDraggingElement = null;

  targetEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    targetEl.classList.add('drag-over');

    // 자석 효과: 정답 아이템이 타겟에 가까우면 강조 표시
    if (currentDraggingItem && currentDraggingItem === correct_answer) {
      const rect = targetEl.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
    }
  });

  targetEl.addEventListener('dragleave', () => {
    targetEl.classList.remove('drag-over');
  });

  targetEl.addEventListener('drop', (e) => {
    e.preventDefault();
    targetEl.classList.remove('drag-over');

    const value = e.dataTransfer.getData('text/plain');
    currentAnswer = value;

    targetEl.innerHTML = '';
    const droppedItem = document.createElement('div');
    droppedItem.className = 'dragdrop-item';
    droppedItem.textContent = value;
    targetEl.appendChild(droppedItem);

    playSound('coin');

    // 자동 제출
    setTimeout(() => handleSubmit(), 300);
  });

  // 드래그 아이템들 (하단)
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'dragdrop-items';

  dragItems.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'dragdrop-item';
    itemEl.textContent = item;
    itemEl.draggable = true;
    itemEl.dataset.value = item;

    // 드래그 이벤트
    itemEl.addEventListener('dragstart', (e) => {
      itemEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item);
      currentDraggingItem = item;
      currentDraggingElement = itemEl;
      
      console.log('[DragDrop] 드래그 시작:', item);
    });

    itemEl.addEventListener('dragend', () => {
      itemEl.classList.remove('dragging');
      currentDraggingItem = null;
      currentDraggingElement = null;
      
      console.log('[DragDrop] 드래그 종료');
    });

    itemsContainer.appendChild(itemEl);
  });

  container.appendChild(targetEl);
  container.appendChild(itemsContainer);
  answersArea.appendChild(container);
}

/**
 * 통합 4지선다 렌더링 (fill_in_blank, best_action)
 */
function renderMultipleChoice(question, type) {
  const { options } = question.question_data;

  const container = document.createElement('div');
  container.className = 'multiple-choice-container';

  // 선택지 레이블 (A, B, C, D)
  const labels = ['A', 'B', 'C', 'D'];

  options.forEach((option, index) => {
    const optionEl = document.createElement('button');
    optionEl.className = 'multiple-choice-option';
    optionEl.dataset.value = option;
    optionEl.type = 'button';
    optionEl.tabIndex = 0;

    // 레이블 추가
    const labelEl = document.createElement('span');
    labelEl.className = 'option-label';
    labelEl.textContent = labels[index];

    // 텍스트 추가
    const textEl = document.createElement('span');
    textEl.className = 'option-text';
    textEl.textContent = option;

    optionEl.appendChild(labelEl);
    optionEl.appendChild(textEl);

    optionEl.addEventListener('click', () => {
      if (optionEl.disabled) return;

      // 기존 선택 해제
      container.querySelectorAll('.multiple-choice-option').forEach(el => {
        el.classList.remove('selected');
      });

      // 새 선택
      optionEl.classList.add('selected');
      currentAnswer = option;
      playSound('click');

      // 자동 제출
      setTimeout(() => handleSubmit(), 300);
    });

    container.appendChild(optionEl);
  });

  answersArea.appendChild(container);
}

/**
 * 2. Typing 렌더링
 */
function renderTyping(question) {
  const { correct_answer } = question.question_data;
  let lastTypedSide = 'right';

  const container = document.createElement('div');
  container.className = 'typing-container';

  // 목표 문장 표시
  const targetEl = document.createElement('div');
  targetEl.className = 'typing-target';
  targetEl.textContent = `"${correct_answer}"`;

  // 모니터
  const monitor = document.createElement('div');
  monitor.className = 'monitor';

  const screen = document.createElement('div');
  screen.className = 'screen';

  // 입력창 (모니터 스크린 안에)
  const inputEl = document.createElement('textarea');
  inputEl.id = 'typing_textarea';
  inputEl.className = 'typing-textarea';
  inputEl.placeholder = '위 문장을 정확히 입력하세요...';
  inputEl.autocomplete = 'off';

  // 복사/붙여넣기 방지
  inputEl.addEventListener('copy', (e) => e.preventDefault());
  inputEl.addEventListener('paste', (e) => e.preventDefault());
  inputEl.addEventListener('cut', (e) => e.preventDefault());
  inputEl.addEventListener('contextmenu', (e) => e.preventDefault());

  screen.appendChild(inputEl);
  monitor.appendChild(screen);

  // 진행률 표시 컨테이너
  const progressContainer = document.createElement('div');
  progressContainer.className = 'typing-progress';

  const progressBar = document.createElement('div');
  progressBar.className = 'typing-progress-bar';
  progressBar.style.width = '0%';

  progressContainer.appendChild(progressBar);

  // 입력 이벤트 - 진행률 업데이트
  inputEl.addEventListener('input', (e) => {
    currentAnswer = e.target.value;

    const progress = Math.min(100, Math.floor((currentAnswer.length / correct_answer.length) * 100));
    progressBar.style.width = progress + '%';

    // 이미 정답을 맞춘 경우 버튼 상태 변경 금지
    if (answersArea.dataset.isCorrect === 'true') {
      return;
    }

    // 100% 완료시 효과음 및 자동 제출
    if (currentAnswer === correct_answer) {
      playSound('correct');
      setTimeout(() => handleSubmit(), 300);
    }
  });

  // 엔터키로 제출
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && currentAnswer && currentAnswer.trim().length > 0 && answersArea.dataset.isCorrect !== 'true') {
      e.preventDefault();
      handleSubmit();
    }
  });

  // 구조 조립
  container.appendChild(targetEl);
  container.appendChild(monitor);
  container.appendChild(progressContainer);
  answersArea.appendChild(container);

  // 포커스
  setTimeout(() => inputEl.focus(), 100);
}

/**
 * 3. Fill Blank (객관식 5지선다) 렌더링
 */
function renderFillBlank(question) {
  const { options } = question.question_data;

  const container = document.createElement('div');
  container.className = 'fillblank-container';

  options.forEach((option) => {
    const optionEl = document.createElement('button');
    optionEl.className = 'fillblank-option';
    optionEl.textContent = option;
    optionEl.dataset.value = option;
    optionEl.type = 'button';
    optionEl.tabIndex = 0;
    optionEl.setAttribute('role', 'button');
    optionEl.setAttribute('aria-pressed', 'false');

    optionEl.addEventListener('click', () => {
      if (optionEl.disabled) return;

      // 기존 선택 해제
      container.querySelectorAll('.fillblank-option').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-pressed', 'false');
      });

      // 새 선택
      optionEl.classList.add('selected');
      optionEl.setAttribute('aria-pressed', 'true');
      currentAnswer = option;
      playSound('click');

      // 자동 제출
      setTimeout(() => handleSubmit(), 300);
    });

    container.appendChild(optionEl);
  });

  // 키보드 내비게이션 지원
  container.addEventListener('keydown', (e) => {
    const items = Array.from(container.querySelectorAll('.fillblank-option'));
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[(Math.max(0, currentIndex) + 1) % items.length];
      next.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[(Math.max(0, currentIndex) - 1 + items.length) % items.length];
      prev.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement && document.activeElement.classList.contains('fillblank-option')) {
        document.activeElement.click();
      }
    }
  });

  answersArea.appendChild(container);
}

/**
 * 4. OX Quiz 렌더링
 */
function renderOX(question) {
  const container = document.createElement('div');
  container.className = 'ox-container';

  const correctAnswer = question.question_data.correct_answer;

  // O 버튼
  const oButton = document.createElement('button');
  oButton.className = 'ox-button';
  oButton.textContent = 'O';
  oButton.dataset.value = 'O';

  // VS 텍스트
  const vsText = document.createElement('div');
  vsText.className = 'ox-vs';
  vsText.textContent = 'VS';

  // X 버튼
  const xButton = document.createElement('button');
  xButton.className = 'ox-button';
  xButton.textContent = 'X';
  xButton.dataset.value = 'X';

  // 타이핑 효과를 위한 변수
  let typingInterval = null;

  // 타이핑 효과 함수
  const typeText = (text, speed = 100) => {
    explanationText.textContent = '';
    let index = 0;

    // 기존 타이핑 중단
    if (typingInterval) {
      clearInterval(typingInterval);
    }

    typingInterval = setInterval(() => {
      if (index < text.length) {
        explanationText.textContent += text[index];
        index++;
      } else {
        clearInterval(typingInterval);
        typingInterval = null;
      }
    }, speed);
  };

  // 말풍선에 힌트 표시 함수
  const showHint = (option) => {
    explanationBubble.classList.add('ox-hint');
    explanationBubble.classList.remove('empty');

    // 타이핑 효과로 텍스트 표시
    // 정답 선택 시: "정답입니다!"
    // 오답 선택 시: "흠..."
    if (option === correctAnswer) {
      typeText('좋은 생각이에요', 80);
    } else {
      typeText('흠...', 120);
    }
  };

  const hideHint = () => {
    // 타이핑 중단
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }

    explanationBubble.classList.remove('ox-hint');
    explanationBubble.classList.add('empty');
    explanationText.textContent = '';
  };

  // O 버튼 이벤트
  oButton.addEventListener('mouseenter', () => showHint('O'));
  oButton.addEventListener('mouseleave', hideHint);
  oButton.addEventListener('click', () => {
    if (oButton.disabled) return;

    // 기존 선택 해제
    container.querySelectorAll('.ox-button').forEach(el => {
      el.classList.remove('selected');
    });

    // 새 선택
    oButton.classList.add('selected');
    currentAnswer = 'O';
    playSound('click');

    // 자동 제출
    setTimeout(() => handleSubmit(), 300);
  });

  // X 버튼 이벤트
  xButton.addEventListener('mouseenter', () => showHint('X'));
  xButton.addEventListener('mouseleave', hideHint);
  xButton.addEventListener('click', () => {
    if (xButton.disabled) return;

    // 기존 선택 해제
    container.querySelectorAll('.ox-button').forEach(el => {
      el.classList.remove('selected');
    });

    // 새 선택
    xButton.classList.add('selected');
    currentAnswer = 'X';
    playSound('click');

    // 자동 제출
    setTimeout(() => handleSubmit(), 300);
  });

  container.appendChild(oButton);
  container.appendChild(vsText);
  container.appendChild(xButton);
  answersArea.appendChild(container);
}

/**
 * 5. Best Action (상황형 4지선다)
 * 
 * 이 유형은 renderMultipleChoice()를 사용하여 처리됩니다.
 * 
 * 형식:
 * - 짧은 상황 제시
 * - 4개의 선택지 (A/B/C/D)
 * - 내규상 가장 적절한 행동 1개 선택
 * 
 * 예시: "외부 공유 요청을 받았다. 내규에 맞는 1차 조치는?"
 */

// renderFindError 함수는 더 이상 사용되지 않음 (best_action으로 대체)

/**
 * 답변 제출
 */
async function handleSubmit() {
  if (!currentAnswer) {
    return;
  }

  // 이미 정답을 맞춘 경우 재제출 방지
  if (answersArea.dataset.isCorrect === 'true') {
    return;
  }

  // 중복 제출 방지
  if (answersArea.dataset.submitting === 'true') {
    return;
  }
  answersArea.dataset.submitting = 'true';

  try {
    const question = currentSession.question;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    console.log('[handleSubmit] 제출 정보:', {
      questionId: question.id,
      isLuckyDraw: question.is_lucky_draw,
      currentAnswer: currentAnswer
    });

    const response = await quizApi.submitAnswer(
      currentSession.sessionId,
      question.id,
      currentAnswer,
      timeTaken,
      question.is_lucky_draw || false
    );

    if (response.success) {
      console.log('[handleSubmit] 서버 응답:', {
        isCorrect: response.result.is_correct,
        attempt: response.result.attempt,
        luckyDrawResult: response.luckydraw_result,
        has_luckydraw_result: !!response.luckydraw_result
      });
      
      if (response.luckydraw_result) {
        console.log('[handleSubmit] 🎰 럭키드로우 결과:', response.luckydraw_result);
      }

      // 다음 문제 저장
      currentSession.nextQuestion = response.next_question || null;
      currentSession.session_complete = response.session_complete || false;
      currentSession.current_question_number = response.current_question_number;
      currentSession.luckydraw_eligible = response.luckydraw_eligible || false;

      showFeedback(response.result, question, response);
    }
  } catch (error) {
    console.error('답변 제출 실패:', error);
    await showPixelAlert('답변 제출에 실패했습니다', { title: '오류' });
    answersArea.dataset.submitting = 'false';
  }
}

/**
 * 피드백 표시
 */
async function showFeedback(result, question, response) {
  if (result.is_correct) {
    // 정답: 초록색 표시 + 다음 문제 버튼으로 변경
    playSound('correct');
    highlightCorrectAnswer();

    // 캐릭터 감정: 정답 시 행복한 표정
    if (result.attempt === 1) {
      setCharacterEmotion('excellent');
    } else {
      setCharacterEmotion('good');
    }

    // NES.css 스타일 글로우 효과 추가
    answersArea.classList.add('nes-glow');
    setTimeout(() => {
      answersArea.classList.remove('nes-glow');
    }, 2000);

    // 정답 상태 저장
    answersArea.dataset.isCorrect = 'true';
    answersArea.dataset.submitting = 'false';

    // 말풍선에 격려 메시지 (OX 문제는 특별한 메시지)
    explanationBubble.classList.remove('ox-hint', 'long', 'incorrect');
    explanationBubble.classList.remove('empty');
    explanationBubble.classList.add('correct');

    const positiveMsg = question.question_type === 'ox'
      ? '느낌 GOOD! 👍'
      : '정답입니다! 👏';
    await typeWriterEffect(explanationText, positiveMsg, 30);

    // 첫 시도에 맞춘 경우
    if (result.attempt === 1) {
      firstAttemptCorrectCount++;

      // 별표 폭죽 효과
      triggerFireworks();

      // LuckyDraw 추첨 결과 확인
      if (response.luckydraw_result) {
        // 우편 봉투 애니메이션 표시 (1초 후) - Promise 기반 완료 대기
        setTimeout(async () => {
          console.log('[LuckyDraw] 애니메이션 시작 대기 중...');

          // 애니메이션이 완전히 끝날 때까지 대기
          await showLuckyDrawAnimation(response.luckydraw_result, currentQuestionIndex - 1);

          console.log('[LuckyDraw] 애니메이션 완료 - 이동 로직 시작');

          // 현재 문제 번호(N)에 따라 이동
          if (currentQuestionIndex === 5) {
            // N=5: 마지막 문제 → 결과 페이지로 이동
            console.log('[LuckyDraw] N=5: 결과 페이지로 이동');
            handleNextQuestion();
          } else {
            // N=1~4: 다음 문제로 이동
            console.log(`[LuckyDraw] N=${currentQuestionIndex}: 다음 문제로 이동`);
            handleNextQuestion();
          }
        }, 1000);
      } else {
        // 일반 문제 - 한 번에 맞춤 (노란색 칠하기)
        setTimeout(() => updateStarGauge(currentQuestionIndex - 1, 'correct-first'), 500);

        // 일반 문제는 기존처럼 2초 후 자동 이동
        setTimeout(() => {
          console.log('[showFeedback] 일반 문제 - 다음 문제로 이동 시도:', {
            session_complete: response.session_complete,
            nextQuestion: currentSession.nextQuestion
          });
          handleNextQuestion();
        }, 2000);
      }
    } else {
      // 첫 시도에 못 맞춘 경우 (회색 칠하기)
      setTimeout(() => updateStarGauge(currentQuestionIndex - 1, 'correct-retry'), 500);

      // 2초 후 자동 이동
      setTimeout(() => {
        console.log('[showFeedback] 재시도 정답 - 다음 문제로 이동 시도:', {
          session_complete: response.session_complete,
          nextQuestion: currentSession.nextQuestion
        });
        handleNextQuestion();
      }, 2000);
    }

  } else {
    // 오답: 빨간색 표시 + 해설 말풍선 표시
    playSound('wrong');
    highlightIncorrectAnswer();

    // 캐릭터 감정: 오답 시 실망한 표정
    setCharacterEmotion('oops');

    // 제출 상태 해제 (즉시 다시 시도 가능)
    answersArea.dataset.submitting = 'false';
    answersArea.dataset.isCorrect = 'false';

    // 퀴즈 콘텐츠 영역 Duolingo 스타일 흔들림
    const quizContent = document.querySelector('.quiz-content');
    if (quizContent) {
      quizContent.classList.remove('duolingo-shake');
      void quizContent.offsetWidth; // Trigger reflow
      quizContent.classList.add('duolingo-shake');
      setTimeout(() => {
        quizContent.classList.remove('duolingo-shake');
      }, 500);
    }

    // 말풍선도 흔들림
    explanationBubble.classList.remove('duolingo-shake');
    void explanationBubble.offsetWidth;
    explanationBubble.classList.add('duolingo-shake');
    setTimeout(() => {
      explanationBubble.classList.remove('duolingo-shake');
    }, 500);

    // 해설 말풍선 타이핑 효과로 표시
    explanationBubble.classList.remove('ox-hint', 'empty', 'correct');
    explanationBubble.classList.add('incorrect');

    // OX 문제는 "흠..." 표시
    if (question.question_type === 'ox') {
      await typeWriterEffect(explanationText, '흠... 🤔', 40);
      await new Promise(resolve => setTimeout(resolve, 800));
      if (result.explanation || question.explanation) {
        const text = result.explanation || question.explanation;
        explanationBubble.classList.add('long');
        await typeWriterEffect(explanationText, text, 20);
      }
    } else {
      // 다른 문제 타입은 바로 해설 표시
      if (result.explanation || question.explanation) {
        const text = result.explanation || question.explanation;
        explanationBubble.classList.add('long');
        await typeWriterEffect(explanationText, text, 20);
      }
    }

    // 오답이므로 답변 초기화하고 다시 선택 가능하게 함
    currentAnswer = null;

    // 선택 상태 초기화 (시각적으로만)
    answersArea.querySelectorAll('.selected, .incorrect').forEach(el => {
      el.classList.remove('selected', 'incorrect');
    });

    // 사용자에게 다시 시도하라는 메시지 추가
    setTimeout(() => {
      if (explanationText.textContent.indexOf('다시') === -1) {
        explanationText.textContent += '\n\n 다음 문제로 넘어갈 수 있습니다.';
      }
    }, 500);
  }
}

/**
 * 정답 하이라이트
 */
function highlightCorrectAnswer() {
  const question = currentSession.question;

  switch (question.question_type) {
    case 'fill_in_blank':
    case 'best_action':
      answersArea.querySelectorAll('.multiple-choice-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;

    case 'drag_and_drop':
    case 'dragdrop':
      const target = answersArea.querySelector('.dragdrop-target');
      if (target) {
        target.style.borderColor = '#4aa52e';
        target.style.background = 'rgba(146, 204, 65, 0.3)';
      }
      break;

    case 'ox':
      answersArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;

    case 'typing':
      // 타이핑은 별도 처리 불필요
      break;

    default:
      // 기타 유형은 선택된 요소에 correct 클래스 추가
      answersArea.querySelectorAll('.selected').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.classList.add('disabled');
      });
      break;
  }
}

/**
 * 오답 하이라이트
 */
function highlightIncorrectAnswer() {
  const question = currentSession.question;

  switch (question.question_type) {
    case 'fill_in_blank':
    case 'best_action':
      answersArea.querySelectorAll('.multiple-choice-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;

    case 'drag_and_drop':
    case 'dragdrop':
      const target = answersArea.querySelector('.dragdrop-target');
      if (target) {
        target.style.borderColor = '#d41010';
        target.style.background = 'rgba(252, 40, 71, 0.3)';
        // 드롭된 항목 제거 (다시 선택 가능하도록)
        target.innerHTML = '<span class="target-text">여기에 드래그하세요</span>';
      }
      break;

    case 'ox':
      answersArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;

    case 'typing':
      // 타이핑 문제는 입력창 내용 유지 (다시 수정 가능)
      const textarea = answersArea.querySelector('textarea');
      if (textarea) {
        textarea.classList.add('incorrect');
        // 0.3초 후 incorrect 클래스 제거
        setTimeout(() => {
          textarea.classList.remove('incorrect');
        }, 300);
      }
      break;
  }

  // 화면 흔들림 효과 - 중앙 문제 영역 위주로
  const quizContent = document.querySelector('.quiz-content');
  if (quizContent) {
    animate(quizContent, 'shake', 500);
  }
  // 말풍선도 함께 흔들리도록
  if (explanationBubble) {
    animate(explanationBubble, 'shake', 500);
  }
}

/**
 * 다음 문제
 */
async function handleNextQuestion() {
  // 세션 완료 확인
  if (currentSession.session_complete) {
    completeQuiz();
    return;
  }

  // 다음 문제가 있는지 확인
  if (!currentSession.nextQuestion) {
    await showPixelAlert('다음 문제를 불러올 수 없습니다', { title: '안내' });
    return;
  }

  // 다음 문제로 이동
  currentSession.question = currentSession.nextQuestion;
  currentSession.nextQuestion = null;
  currentQuestionIndex++; // 다음 문제 번호로 증가

  // 세션 업데이트
  sessionStorage.setItem('currentSession', JSON.stringify(currentSession));

  // 타이머 리셋
  startTimer();

  loadQuestion();
}

/**
 * 퀴즈 완료
 */
async function completeQuiz() {
  try {
    const response = await quizApi.completeSession(currentSession.sessionId);

    if (response.success) {
      // 결과 페이지로 이동 (eventId 포함)
      const resultData = {
        ...response.result,
        eventId: currentSession.eventId
      };
      sessionStorage.setItem('quizResult', JSON.stringify(resultData));
      sessionStorage.removeItem('currentSession');
      window.location.href = '/pages/result.html';
    }
  } catch (error) {
    console.error('퀴즈 완료 처리 실패:', error);
    await showPixelAlert('퀴즈 완료 처리에 실패했습니다', { title: '오류' });
  }
}

/**
 * 타이머 시작
 */
function startTimer() {
  startTime = Date.now();
}

/**
 * 종료
 */
async function handleQuit() {
  const confirmed = await showPixelConfirm('퀴즈를 종료하시겠습니까?\n진행 상황은 저장되지 않습니다.', { title: '퀴즈 종료' });
  if (confirmed) {
    try {
      // 서버에 세션 취소 요청 (세션 및 답변 삭제)
      if (currentSession && currentSession.sessionId) {
        await quizApi.cancelSession(currentSession.sessionId);
        console.log('[Quit] 세션 취소 완료');
      }
    } catch (error) {
      console.error('[Quit] 세션 취소 실패:', error);
      // 실패해도 계속 진행
    }

    sessionStorage.removeItem('currentSession');
    window.location.href = '/pages/quiz-list.html';
  }
}

/**
 * 캐릭터 감정 표현 변경 (Duolingo 스타일)
 * @param {string} emotion - 'neutral', 'happy', 'oops', 'good', 'thinking'
 */
function setCharacterEmotion(emotion) {
  if (!characterImg) return;

  const emotionMap = {
    'neutral': '../images/hi.png',
    'happy': '../images/ohyes2.png',
    'good': '../images/Molisuccess.png',
    'oops': '../images/Molifail.png',
    'thinking': '../images/fighting2.png',
    'excellent': '../images/Molisuccess.png'

  };

  const newSrc = emotionMap[emotion] || emotionMap['neutral'];

  if (characterImg.src !== newSrc) {
    characterImg.classList.remove('character-fade');
    void characterImg.offsetWidth; // Trigger reflow
    characterImg.src = newSrc;
    characterImg.classList.add('character-fade');

    // 불변 조건 A: 캐릭터 이미지 변경 후 앵커 재계산
    // 이미지 로드 완료 후 크기가 확정되면 앵커 업데이트
    characterImg.addEventListener('load', () => {
      updateSpeechBubbleAnchor();
    }, { once: true });
  }
}

// 타이핑 세션 토큰 (레이스 컨디션 방지)
let currentTypingToken = null;

/**
 * 타이핑 효과 (Promise 기반, 커서 제거, 순차 실행 보장)
 */
function typeWriterEffect(element, text, speed = 50) {
  return new Promise((resolve) => {
    // 새 타이핑 세션 토큰 생성
    const sessionToken = Symbol('typing-session');
    currentTypingToken = sessionToken;

    // 이전 내용 초기화
    element.textContent = '';
    let i = 0;

    function type() {
      // 토큰 불일치 시 즉시 중단 (다른 타이핑이 시작됨)
      if (currentTypingToken !== sessionToken) {
        resolve();
        return;
      }

      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        // 타이핑 완료
        adjustSpeechBubbleSize();
        resolve();
      }
    }

    type();
  });
}

/**
 * 말풍선 크기를 텍스트 내용에 맞게 동적으로 조정
 * 픽셀 아트 테두리를 정확하게 유지
 */
function adjustSpeechBubbleSize() {
  const bubble = document.querySelector('.speech-bubble');
  const textElement = document.getElementById('explanationText');
  const svgElement = bubble?.querySelector('.speech-bubble-svg');
  
  if (!bubble || !textElement || !svgElement) return;

  // 🔥 완전히 초기화: SVG 크기를 최소로 리셋
  svgElement.setAttribute('height', '60');
  svgElement.setAttribute('viewBox', '0 0 320 60');
  
  // 🔥 텍스트 엘리먼트 초기화
  textElement.style.height = 'auto';
  textElement.style.maxHeight = 'none';
  textElement.style.overflow = 'visible';
  
  // 🔥 강제 리플로우로 브라우저에게 레이아웃 재계산 요청
  void textElement.offsetHeight;
  
  // 실제 텍스트 높이 측정 (약간의 딜레이로 정확한 측정)
  setTimeout(() => {
    // 현재 텍스트의 실제 높이 측정
    const textHeight = textElement.scrollHeight;
    
    console.log('[adjustSpeechBubbleSize] 측정된 textHeight:', textHeight);
    
    // 최소 높이 설정 (기존의 절반)
    const minTextHeight = 20; // 40px → 20px로 축소
    const topPadding = 12; // 패딩 더 축소
    const bottomPadding = 12; // 패딩 더 축소
    
    // 실제 필요한 텍스트 영역 높이 (최소값 보장)
    const actualTextHeight = Math.max(minTextHeight, textHeight);
    
    // 메인 사각형 높이 = 텍스트 높이 + 최소 여백
    const contentHeight = actualTextHeight + topPadding + bottomPadding;
    
    // 전체 SVG 높이 = 상단(10) + 컨텐츠 + 하단(10) + 꼬리(12)
    // 꼬리 규격: 얄쌍한 3단 계단형 (12px, 8px, 4px) × 4px 높이 = 총 12px
    const svgHeight = 10 + contentHeight + 10 + 12;
    const svgWidth = 320;
    
    console.log('[adjustSpeechBubbleSize] 계산된 svgHeight:', svgHeight, '(contentHeight:', contentHeight, ')');
    
    // SVG viewBox와 height 설정
    svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svgElement.setAttribute('height', svgHeight);
    svgElement.setAttribute('width', svgWidth);
    
    // 기존 모든 rect 제거하고 새로 그리기
    svgElement.innerHTML = '';
    
    // 메인 사각형 본체
    const mainRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    mainRect.setAttribute('x', '20');
    mainRect.setAttribute('y', '10');
    mainRect.setAttribute('width', '280');
    mainRect.setAttribute('height', contentHeight);
    mainRect.setAttribute('fill', '#FFF');
    mainRect.setAttribute('stroke', 'none');
    svgElement.appendChild(mainRect);
    
    // 픽셀 테두리 - 상단
    addRect(svgElement, 24, 6, 272, 4, '#000');
    
    // 픽셀 테두리 - 좌측 상단 모서리
    addRect(svgElement, 20, 10, 4, 4, '#000');
    addRect(svgElement, 16, 14, 4, 4, '#000');
    addRect(svgElement, 12, 18, 4, contentHeight - 14, '#000');
    
    // 좌측 하단 모서리
    const leftBottomY = 10 + contentHeight;
    addRect(svgElement, 16, leftBottomY - 4, 4, 4, '#000');
    addRect(svgElement, 20, leftBottomY, 4, 4, '#000');
    
    // 불변 조건 A: 꼬리 중앙 고정을 위한 centerX 기준 계산
    const centerX = svgWidth / 2; // 320 / 2 = 160

    // 얄쌍한 3단 계단형 꼬리 규격 (quiz-list.html과 동일)
    const tailTopWidth = 12;    // 꼬리 상단 폭
    const tailMidWidth = 8;     // 꼬리 중단 폭
    const tailTipWidth = 4;     // 꼬리 끝 폭
    const stepHeight = 4;       // 각 단의 높이

    // 하단 테두리 (꼬리 왼쪽 부분 - 중앙까지)
    const bottomY = leftBottomY + 4;
    const leftBorderWidth = centerX - 24 - (tailTopWidth / 2); // centerX까지의 거리 - 꼬리 절반 폭
    addRect(svgElement, 24, bottomY, leftBorderWidth, 4, '#000');

    // 픽셀 테두리 - 우측 상단 모서리
    addRect(svgElement, 296, 10, 4, 4, '#000');
    addRect(svgElement, 300, 14, 4, 4, '#000');
    addRect(svgElement, 304, 18, 4, contentHeight - 14, '#000');

    // 우측 하단 모서리
    addRect(svgElement, 300, leftBottomY, 4, 4, '#000');
    addRect(svgElement, 304, leftBottomY - 4, 4, 4, '#000');

    // 하단 테두리 (꼬리 오른쪽 부분 - 중앙부터)
    const rightBorderStartX = centerX + (tailTopWidth / 2); // 꼬리 절반 폭 이후부터
    const rightBorderWidth = svgWidth - 24 - rightBorderStartX;
    addRect(svgElement, rightBorderStartX, bottomY, rightBorderWidth, 4, '#000');

    // 꼬리 부분 그리기 (불변 조건 A: 얄쌍한 3단 계단형, centerX 기반 좌우 대칭)
    const tailY = bottomY;

    // 꼬리 레벨 1 (최상단, 폭 12px)
    // 중앙 기준: centerX ± 6 (12px / 2 = 6)
    addRect(svgElement, centerX - (tailTopWidth / 2), tailY, tailTopWidth, stepHeight, '#FFF'); // 흰색 배경
    addRect(svgElement, centerX - (tailTopWidth / 2) - 4, tailY, 4, stepHeight, '#000'); // 좌측 테두리
    addRect(svgElement, centerX + (tailTopWidth / 2), tailY, 4, stepHeight, '#000'); // 우측 테두리

    // 꼬리 레벨 2 (중단, 폭 8px)
    // 중앙 기준: centerX ± 4 (8px / 2 = 4)
    addRect(svgElement, centerX - (tailMidWidth / 2), tailY + stepHeight, tailMidWidth, stepHeight, '#FFF'); // 흰색 배경
    addRect(svgElement, centerX - (tailMidWidth / 2) - 4, tailY + stepHeight, 4, stepHeight, '#000'); // 좌측 테두리
    addRect(svgElement, centerX + (tailMidWidth / 2), tailY + stepHeight, 4, stepHeight, '#000'); // 우측 테두리

    // 꼬리 레벨 3 (최하단 tip, 폭 4px - 검은색)
    // 중앙 기준: centerX ± 2 (4px / 2 = 2)
    addRect(svgElement, centerX - (tailTipWidth / 2), tailY + stepHeight * 2, tailTipWidth, stepHeight, '#000');

    // 불변 조건 B: 높이 변화 후에도 꼬리 끝점 위치 유지
    // SVG 높이가 변경되었으므로 앵커 재계산 (bottom 위치는 고정, top만 위로 이동)
    updateSpeechBubbleAnchor();
  }, 100); // 100ms 딜레이로 충분한 시간 확보
}

/**
 * SVG rect 요소를 추가하는 헬퍼 함수
 */
function addRect(svg, x, y, width, height, fill) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  rect.setAttribute('fill', fill);
  svg.appendChild(rect);
}

/**
 * 별표 폭죽 효과 (현재 문제의 게이지 칸 위치에서)
 */
function triggerFireworks() {
  // 진행바 영역 기준으로 폭죽 효과 표시
  const progressBar = document.querySelector('.quiz-progress .pixel-progress');

  if (!progressBar) {
    console.warn('[Fireworks] 진행바를 찾을 수 없습니다');
    return;
  }

  const rect = progressBar.getBoundingClientRect();
  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  
  // 20개의 별 생성
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.className = 'firework-star';
    star.textContent = '⭐';
    
    // 랜덤 방향으로 폭발
    const angle = (Math.PI * 2 * i) / 20;
    const distance = 80 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    star.style.left = centerX + 'px';
    star.style.top = centerY + 'px';
    star.style.setProperty('--tx', tx + 'px');
    star.style.setProperty('--ty', ty + 'px');
    
    fireworksContainer.appendChild(star);
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
      star.remove();
    }, 1500);
  }
}

/**
 * 별표 게이지 업데이트 → 진행바 채우기로 변경 (0~1 사이 비율)
 * @param {number} questionIndex - 현재 문제 인덱스 (0-4)
 * @param {string} status - 'correct', 'incorrect', 'lucky-win', 'lucky-lose'
 */
function updateStarGauge(questionIndex, status) {
  const progressFill = document.querySelector('.quiz-progress .pixel-progress__fill');
  if (!progressFill) {
    console.warn('[게이지] 진행바 요소를 찾을 수 없습니다');
    return;
  }

  const totalQuestions = 5;
  const clampedIndex = Math.max(0, Math.min(questionIndex, totalQuestions - 1));
  const progress = (clampedIndex + 1) / totalQuestions; // 1/5, 2/5, ... 5/5

  progressFill.style.setProperty('--progress', progress);

  console.log(`[게이지 업데이트] 문제 ${questionIndex + 1}, 상태: ${status}, 진행도: ${progress}`);
}

/**
 * LuckyDraw 우편 봉투 애니메이션
 * @param {Object} result - LuckyDraw 결과
 * @param {number} questionIndex - 현재 문제 인덱스 (0-4)
 * @returns {Promise<void>} - 애니메이션이 완전히 끝나고 사용자가 확인 버튼을 클릭하면 resolve
 */
function showLuckyDrawAnimation(result, questionIndex) {
  console.log('[LuckyDraw] 애니메이션 시작:', result);

  return new Promise((resolve) => {
    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'luckydraw-envelope-overlay';

    // 편지함 컨테이너 생성
    const envelopeContainer = document.createElement('div');
    envelopeContainer.className = 'luckydraw-envelope';

    // 우체통 이모지
    const mailbox = document.createElement('div');
    mailbox.className = 'luckydraw-mailbox';
    mailbox.textContent = '📬';

    // 편지 이모지
    const letter = document.createElement('div');
    letter.className = 'luckydraw-letter';
    letter.textContent = '✉️';

    envelopeContainer.appendChild(mailbox);
    envelopeContainer.appendChild(letter);
    overlay.appendChild(envelopeContainer);
    document.body.appendChild(overlay);

    // 1.5초 후 편지함을 결과 카드로 교체
    setTimeout(() => {
      envelopeContainer.remove();

      // 결과 카드 생성
      const resultCard = document.createElement('div');
      resultCard.className = 'luckydraw-result-card';

      // 당첨 여부에 따른 이미지와 메시지
      let gifSrc, message;

      if (result.won) {
        // 당첨!
        gifSrc = '../images/Luckydrawsuccess.gif';
        message = '축하합니다! 행운의 주인공! 선물을 획득했어요';

        // 당첨 시 폭죽 효과
        playSound('correct');
        createConfetti(overlay);
      } else {
        // 미당첨
        gifSrc = '../images/Luckydrawfail.gif';
        message = '아쉽게도 선물을 획득하지 못했네요..문제를 많이 풀면 당첨 확률이 높아집니다! 계속 도전해보세요!)';
        playSound('coin');
      }

      resultCard.innerHTML = `
        <div class="luckydraw-result-icon">
          <img src="${gifSrc}" alt="Lucky Draw Result" />
        </div>
        <div class="luckydraw-result-message">${message}</div>
        <button class="luckydraw-close-btn">확인</button>
      `;

      overlay.appendChild(resultCard);

      // 확인 버튼 클릭 시 게이지 업데이트 후 닫기 및 Promise resolve
      const closeBtn = resultCard.querySelector('.luckydraw-close-btn');
      closeBtn.addEventListener('click', () => {
        console.log('[LuckyDraw] 확인 버튼 클릭 - 애니메이션 완료');

        // LuckyDraw 결과에 따라 게이지 업데이트
        if (result.won) {
          updateStarGauge(questionIndex, 'lucky-win');
        } else {
          updateStarGauge(questionIndex, 'lucky-lose');
        }
        overlay.remove();

        // 애니메이션 완료를 알림
        resolve();
      });

    }, 1500);
  });
}

/**
 * 당첨 시 폭죽 효과
 */
function createConfetti(container) {
  const emojis = ['🎉', '🎊', '⭐', '✨', '🌟', '💫'];

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'luckydraw-confetti';
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      // 랜덤 위치
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = Math.random() * 30 + '%';

      // 랜덤 애니메이션 지연
      confetti.style.animationDelay = Math.random() * 0.5 + 's';

      container.appendChild(confetti);

      // 애니메이션 후 제거
      setTimeout(() => confetti.remove(), 3000);
    }, i * 50);
  }
}

// 초기화
init();

// 페이지 이탈 방지
window.addEventListener('beforeunload', (e) => {
  if (currentSession) {
    e.preventDefault();
    e.returnValue = '';
  }
});
