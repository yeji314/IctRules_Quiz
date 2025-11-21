/**
 * 퀴즈 게임 페이지
 */

import { quiz as quizApi } from '../modules/api.js';
import { requireAuth, getUser, logout } from '../modules/auth.js';
import { $, show, hide, animate, playSound } from '../modules/utils.js';

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
const nextQuestionBtn = $('#nextQuestionBtn');
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
 * 질문 헤더 포맷터 - [BLANK] 토큰을 칩 스타일로 치환
 */
function formatQuestionHeaderText(rawText) {
  if (!rawText) return '';
  // [BLANK] 토큰을 시각적 칩으로 변환
  return rawText.replace(/\[BLANK\]/g, '<span class="blank-chip">BLANK</span>');
}

/**
 * 초기화
 */
function init() {
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
  logoutBtn.addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      window.location.href = '/pages/index.html';
    }
  });

  // 세션 정보 로드
  const sessionData = sessionStorage.getItem('currentSession');
  if (!sessionData) {
    alert('세션 정보가 없습니다');
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
    alert('문제 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  // NEXT 버튼 이벤트 (제출 또는 다음 문제)
  nextQuestionBtn.addEventListener('click', () => {
    playSound('click');

    // 버튼 텍스트가 "제출"이면 handleSubmit, "다음 문제"면 handleNext
    if (nextQuestionBtn.textContent === '제출') {
      handleSubmit();
    } else {
      handleNext();
    }
  });

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
  console.log('[Quiz loadQuestion] question category:', question.category);

  if (question.category === 'luckydraw') {
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

  // NEXT 버튼 초기화 (숨김 상태로 시작)
  nextQuestionBtn.classList.add('hidden');

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
      setAnswersType('type-fillblank');
      renderFillBlank(question);
      break;
    case 'ox':
      setAnswersType('type-ox');
      renderOX(question);
      break;
    case 'finderror':
    case 'find_error':
      setAnswersType('type-finderror');
      renderFindError(question);
      break;
    default:
      answersArea.innerHTML = '<p>지원하지 않는 문제 타입입니다.</p>';
  }
}

/**
 * answers 영역 타입 클래스 관리 (레이아웃 전용)
 * @param {string|null} typeClass - 'type-dragdrop' | 'type-typing' | 'type-fillblank' | 'type-ox' | 'type-finderror'
 */
function setAnswersType(typeClass) {
  const typeClasses = [
    'type-dragdrop',
    'type-typing',
    'type-fillblank',
    'type-ox',
    'type-finderror',
  ];

  typeClasses.forEach((cls) => answersArea.classList.remove(cls));

  if (typeClass) {
    answersArea.classList.add(typeClass);
  }
}

/**
 * 1. Drag & Drop 렌더링
 */
function renderDragDrop(question) {
  const { items, target_label, options } = question.question_data;
  const dragItems = items || options;

  const container = document.createElement('div');
  container.className = 'dragdrop-container';

  // 드롭 타겟 (상단)
  const targetEl = document.createElement('div');
  targetEl.className = 'dragdrop-target';
  targetEl.textContent = target_label || '여기에 드래그하세요';

  targetEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    targetEl.classList.add('drag-over');
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
    });

    itemEl.addEventListener('dragend', () => {
      itemEl.classList.remove('dragging');
    });

    itemsContainer.appendChild(itemEl);
  });

  container.appendChild(targetEl);
  container.appendChild(itemsContainer);
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

    // 입력 중이면 제출 버튼 표시
    if (currentAnswer.trim().length > 0) {
      nextQuestionBtn.textContent = '제출';
      nextQuestionBtn.classList.remove('hidden');
    } else {
      nextQuestionBtn.classList.add('hidden');
    }

    // 100% 완료시 효과음
    if (currentAnswer === correct_answer) {
      playSound('correct');
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
      typeText('정답입니다!', 80);
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
 * 5. Find Error 렌더링
 */
function renderFindError(question) {
  const { underlined_words } = question.question_data;

  const container = document.createElement('div');
  container.className = 'finderror-container';

  const textEl = document.createElement('div');
  textEl.className = 'finderror-text';

  // 문제 텍스트를 파싱하여 밑줄 단어를 찾아 span으로 감싸기
  let displayText = question.question_text;
  
  // 각 밑줄 단어를 순서대로 찾아서 span으로 감싸기
  underlined_words.forEach((word, index) => {
    // 첫 번째 일치하는 단어만 교체 (이미 교체된 것은 건너뜀)
    const placeholder = `__FINDERROR_${index}__`;
    displayText = displayText.replace(word, placeholder);
  });

  // placeholder를 실제 HTML로 교체
  underlined_words.forEach((word, index) => {
    const placeholder = `__FINDERROR_${index}__`;
    displayText = displayText.replace(
      placeholder, 
      `<span class="finderror-word" data-value="${word}">${word}</span>`
    );
  });

  textEl.innerHTML = displayText;

  // 클릭 이벤트 추가
  textEl.querySelectorAll('.finderror-word').forEach((wordEl) => {
    wordEl.addEventListener('click', () => {
      if (wordEl.classList.contains('disabled')) return;

      // 기존 선택 해제
      textEl.querySelectorAll('.finderror-word').forEach(el => {
        el.classList.remove('selected');
      });

      // 새 선택
      wordEl.classList.add('selected');
      currentAnswer = wordEl.dataset.value;
      playSound('click');

      // 자동 제출
      setTimeout(() => handleSubmit(), 300);
    });
  });

  const hintEl = document.createElement('div');
  hintEl.className = 'finderror-hint';
  hintEl.textContent = '(밑줄 친 단어를 클릭하세요)';

  container.appendChild(textEl);
  container.appendChild(hintEl);
  answersArea.appendChild(container);
}

/**
 * 답변 제출
 */
async function handleSubmit() {
  if (!currentAnswer) {
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

    const response = await quizApi.submitAnswer(
      currentSession.sessionId,
      question.id,
      currentAnswer,
      timeTaken,
      question.is_lucky_draw || false
    );

    if (response.success) {
      // 다음 문제 저장
      currentSession.nextQuestion = response.next_question || null;
      currentSession.session_complete = response.session_complete || false;
      currentSession.current_question_number = response.current_question_number;
      currentSession.luckydraw_eligible = response.luckydraw_eligible || false;

      showFeedback(response.result, question, response);
    }
  } catch (error) {
    console.error('답변 제출 실패:', error);
    alert('답변 제출에 실패했습니다');
    answersArea.dataset.submitting = 'false';
  }
}

/**
 * 피드백 표시
 */
function showFeedback(result, question, response) {
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
    typeWriterEffect(explanationText, positiveMsg, 30);

    // 첫 시도에 맞춘 경우
    if (result.attempt === 1) {
      firstAttemptCorrectCount++;

      // 별표 폭죽 효과
      triggerFireworks();

      // LuckyDraw 추첨 결과 확인
      if (response.luckydraw_result) {
        // 우편 봉투 애니메이션 표시 (1초 후)
        setTimeout(() => {
          showLuckyDrawAnimation(response.luckydraw_result, currentQuestionIndex - 1);
        }, 1000);
      } else {
        // 일반 문제 - 한 번에 맞춤 (노란색 칠하기)
        setTimeout(() => updateStarGauge(currentQuestionIndex - 1, 'correct-first'), 500);
      }
    } else {
      // 첫 시도에 못 맞춘 경우 (회색 칠하기)
      setTimeout(() => updateStarGauge(currentQuestionIndex - 1, 'correct-retry'), 500);
    }

    // NEXT 버튼 표시
    if (response.session_complete) {
      nextQuestionBtn.textContent = '결과 보기';
    } else {
      nextQuestionBtn.textContent = '다음 문제';
    }
    nextQuestionBtn.classList.remove('hidden');
    animate(nextQuestionBtn, 'bounce');

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
      typeWriterEffect(explanationText, '흠... 🤔', 40);
      setTimeout(() => {
        if (result.explanation || question.explanation) {
          const text = result.explanation || question.explanation;
          explanationBubble.classList.add('long');
          typeWriterEffect(explanationText, text, 20);
        }
      }, 800);
    } else {
      // 다른 문제 타입은 바로 해설 표시
      if (result.explanation || question.explanation) {
        const text = result.explanation || question.explanation;
        explanationBubble.classList.add('long');
        typeWriterEffect(explanationText, text, 20);
      }
    }

    // 오답이므로 답변 초기화하고 다시 선택 가능하게 함
    currentAnswer = null;

    // 선택 상태 초기화 (시각적으로만)
    answersArea.querySelectorAll('.selected, .incorrect').forEach(el => {
      el.classList.remove('selected', 'incorrect');
    });

    // 오답 시 NEXT 버튼은 항상 숨김 (정답을 선택해야만 다음으로 넘어갈 수 있음)
    nextQuestionBtn.classList.add('hidden');

    // 사용자에게 다시 시도하라는 메시지 추가
    setTimeout(() => {
      if (explanationText.textContent.indexOf('다시') === -1) {
        explanationText.textContent += '\n\n정답을 선택해야 다음 문제로 넘어갈 수 있습니다.';
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
    case 'fillblank':
      answersArea.querySelectorAll('.fillblank-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;

    case 'ox':
      answersArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;

    case 'find_error':
    case 'finderror':
      answersArea.querySelectorAll('.finderror-word').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.classList.add('disabled');
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
  }
}

/**
 * 오답 하이라이트
 */
function highlightIncorrectAnswer() {
  const question = currentSession.question;

  switch (question.question_type) {
    case 'fill_in_blank':
    case 'fillblank':
      answersArea.querySelectorAll('.fillblank-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;

    case 'ox':
      answersArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;

    case 'find_error':
    case 'finderror':
      answersArea.querySelectorAll('.finderror-word').forEach(el => {
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
        target.innerHTML = '';
      }
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
function handleNext() {
  // 세션 완료 확인
  if (currentSession.session_complete) {
    completeQuiz();
    return;
  }

  // 다음 문제가 있는지 확인
  if (!currentSession.nextQuestion) {
    alert('다음 문제를 불러올 수 없습니다');
    return;
  }

  // 다음 문제로 이동
  currentSession.question = currentSession.nextQuestion;
  currentSession.nextQuestion = null;
  currentQuestionIndex = currentSession.current_question_number;

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
    alert('퀴즈 완료 처리에 실패했습니다');
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
  if (confirm('퀴즈를 종료하시겠습니까?\n진행 상황은 저장되지 않습니다.')) {
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
    'good': '../images/luckydraw.png',
    'oops': '../images/oops2.png',
    'thinking': '../images/fighting2.png',
    'excellent': '../images/ohyes2.png'

  };

  const newSrc = emotionMap[emotion] || emotionMap['neutral'];

  if (characterImg.src !== newSrc) {
    characterImg.classList.remove('character-fade');
    void characterImg.offsetWidth; // Trigger reflow
    characterImg.src = newSrc;
    characterImg.classList.add('character-fade');
  }
}

/**
 * 타이핑 효과 (Duolingo 스타일 - 커서 깜빡임 포함)
 */
function typeWriterEffect(element, text, speed = 50) {
  element.textContent = '';
  let i = 0;

  // 커서 추가
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  cursor.textContent = '▮';
  cursor.style.display = 'inline-block';
  cursor.style.marginLeft = '2px';

  function type() {
    if (i < text.length) {
      // 커서 제거 후 텍스트 추가 후 다시 커서 추가
      if (element.contains(cursor)) {
        element.removeChild(cursor);
      }
      element.textContent += text.charAt(i);
      element.appendChild(cursor);
      i++;
      setTimeout(type, speed);
    } else {
      // 타이핑 완료 후 0.5초 뒤 커서 제거
      setTimeout(() => {
        if (element.contains(cursor)) {
          element.removeChild(cursor);
        }
      }, 500);
    }
  }

  type();
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
 */
function showLuckyDrawAnimation(result, questionIndex) {
  console.log('[LuckyDraw] 애니메이션 시작:', result);

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.className = 'luckydraw-envelope-overlay';

  // 우편 봉투 이모지 생성
  const envelope = document.createElement('div');
  envelope.className = 'luckydraw-envelope';
  envelope.textContent = '📬';

  overlay.appendChild(envelope);
  document.body.appendChild(overlay);

  // 1.5초 후 봉투를 결과 카드로 교체
  setTimeout(() => {
    envelope.remove();

    // 결과 카드 생성
    const resultCard = document.createElement('div');
    resultCard.className = 'luckydraw-result-card';

    // 당첨 여부에 따른 아이콘과 메시지
    let icon, title, message, titleClass;

    if (result.won) {
      // 당첨!
      icon = '🎉';
      title = '선물에 당첨되었습니다';
      message = `<strong>${result.prize}</strong>에 당첨되셨습니다!<br>관리자에게 문의하여 상품을 받아가세요.`;
      titleClass = 'won';

      // 당첨 시 폭죽 효과
      playSound('correct');
      createConfetti(overlay);
    } else {
      // 미당첨
      icon = '😢';
      title = '아쉽게도 이번에는 선물 당첨을 획득하지 못했습니다';

      // 이유별 메시지
      if (result.reason === 'max_winners_reached') {
        message = '이번 회차의 당첨자가 모두 마감되었습니다.<br>문제를 많이 풀면 선물 획득 확률이 높아집니다!';
      } else if (result.reason === 'already_won') {
        message = '이미 당첨되셨습니다!<br>한 번만 당첨 가능합니다.';
      } else {
        message = '문제를 많이 풀면 선물 획득 확률이 높아집니다!';
      }

      titleClass = 'lost';
      playSound('coin');
    }

    resultCard.innerHTML = `
      <div class="luckydraw-result-icon">${icon}</div>
      <div class="luckydraw-result-title ${titleClass}">${title}</div>
      <div class="luckydraw-result-message">${message}</div>
      <button class="luckydraw-close-btn">확인</button>
    `;

    overlay.appendChild(resultCard);

    // 확인 버튼 클릭 시 게이지 업데이트 후 닫기
    const closeBtn = resultCard.querySelector('.luckydraw-close-btn');
    closeBtn.addEventListener('click', () => {
      // LuckyDraw 결과에 따라 게이지 업데이트
      if (result.won) {
        updateStarGauge(questionIndex, 'lucky-win');
      } else {
        updateStarGauge(questionIndex, 'lucky-lose');
      }
      overlay.remove();
    });

  }, 1500);
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
