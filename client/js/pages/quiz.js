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
const userAvatar = $('#userAvatar');
const starGaugeFill = $('#starGaugeFill');
const questionNumber = $('#questionNumber');
const questionTextHeader = $('#questionTextHeader');
const questionArea = $('#questionArea');
const explanationBubble = $('#explanationBubble');
const explanationText = $('#explanationText');
const fireworksContainer = $('#fireworksContainer');
const nextQuestionBtn = $('#nextQuestionBtn');

// 상태
let currentSession = null;
let currentQuestionIndex = 0;
let currentAnswer = null;
let startTime = null;
let timerInterval = null;
let firstAttemptCorrectCount = 0;
let totalQuestions = 0;

/**
 * 초기화
 */
function init() {
  // 사용자 정보 로드
  const user = getUser();
  if (user) {
    userNameDisplay.textContent = `${user.name}님`;
  }

  // 로그아웃 이벤트
  userAvatar.addEventListener('click', () => {
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
  currentQuestionIndex = currentSession.currentQuestionIndex || 0;
  totalQuestions = currentSession.questions.length;

  // 별표 게이지 초기화
  updateStarGauge();

  // 다음 문제 버튼 이벤트
  nextQuestionBtn.addEventListener('click', () => {
    playSound('click');
    handleNext();
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
  if (currentQuestionIndex >= currentSession.questions.length) {
    // 모든 문제 완료
    completeQuiz();
    return;
  }

  const question = currentSession.questions[currentQuestionIndex];

  // UI 업데이트
  questionNumber.textContent = currentQuestionIndex + 1;
  
  // 타이핑 문제는 문제 텍스트를 숨김
  if (question.question_type === 'typing') {
    questionTextHeader.textContent = '다음 문장을 따라 입력하세요.';
  } else {
    questionTextHeader.textContent = question.question_text;
  }

  // 답변 초기화
  currentAnswer = null;
  
  // 제출 상태 초기화
  questionArea.dataset.submitting = 'false';
  
  // 해설 말풍선 내용 초기화 (숨기지 않음, 공란)
  explanationText.textContent = '';
  explanationBubble.classList.remove('ox-hint', 'long');
  explanationBubble.classList.add('empty');

  // 다음 문제 버튼 숨김
  hide(nextQuestionBtn);

  // 문제 타입에 따라 렌더링
  renderQuestion(question);
}

/**
 * 문제 렌더링
 */
function renderQuestion(question) {
  questionArea.innerHTML = '';

  switch (question.question_type) {
    case 'dragdrop':
    case 'drag_and_drop':
      renderDragDrop(question);
      break;
    case 'typing':
      renderTyping(question);
      break;
    case 'fillblank':
    case 'fill_in_blank':
      renderFillBlank(question);
      break;
    case 'ox':
      renderOX(question);
      break;
    case 'finderror':
    case 'find_error':
      renderFindError(question);
      break;
    default:
      questionArea.innerHTML = '<p>지원하지 않는 문제 타입입니다.</p>';
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
    setTimeout(() => handleSubmit(), 500);
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
  questionArea.appendChild(container);
}

/**
 * 2. Typing 렌더링
 */
function renderTyping(question) {
  const { correct_answer } = question.question_data;

  const container = document.createElement('div');
  container.className = 'typing-container';

  // 목표 문장 표시 (박스 없이 텍스트만)
  const targetEl = document.createElement('div');
  targetEl.className = 'typing-target';
  targetEl.textContent = `"${correct_answer}"`;

  // 입력창
  const inputEl = document.createElement('textarea');
  inputEl.id = 'typing_textarea';
  inputEl.className = 'nes-textarea';
  inputEl.placeholder = '위 문장을 정확히 입력하세요...';
  inputEl.autocomplete = 'off';
  inputEl.rows = 4;

  // 복사/붙여넣기 방지
  inputEl.addEventListener('copy', (e) => e.preventDefault());
  inputEl.addEventListener('paste', (e) => e.preventDefault());
  inputEl.addEventListener('cut', (e) => e.preventDefault());
  inputEl.addEventListener('contextmenu', (e) => e.preventDefault());

  // nes-progress 사용
  const progressEl = document.createElement('progress');
  progressEl.className = 'nes-progress is-success';
  progressEl.value = 0;
  progressEl.max = 100;

  // 입력 시 답변 저장 및 진행률 업데이트
  inputEl.addEventListener('input', (e) => {
    currentAnswer = e.target.value;
    
    const progress = Math.min(100, Math.floor((currentAnswer.length / correct_answer.length) * 100));
    progressEl.value = progress;

    // 100% 완료시 자동 제출
    if (currentAnswer === correct_answer) {
      inputEl.disabled = true;
      playSound('correct');
      setTimeout(() => handleSubmit(), 500);
    }
  });

  container.appendChild(targetEl);
  container.appendChild(inputEl);
  container.appendChild(progressEl);
  questionArea.appendChild(container);

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

    optionEl.addEventListener('click', () => {
      if (optionEl.disabled) return;

      // 기존 선택 해제
      container.querySelectorAll('.fillblank-option').forEach(el => {
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

  questionArea.appendChild(container);
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

  // 말풍선에 힌트 표시 함수
  const showHint = (option) => {
    explanationBubble.classList.add('ox-hint');
    explanationBubble.classList.remove('empty');
    
    if (option === correctAnswer) {
      // 정답에 가까우면 엄지 척 (👍)
      explanationText.textContent = '👍';
    } else {
      // 오답에 가까우면 엄지 아래 (👎)
      explanationText.textContent = '👎';
    }
  };

  const hideHint = () => {
    explanationBubble.classList.remove('ox-hint');
    explanationBubble.classList.add('empty');
    explanationText.textContent = '';
  };

  // O 버튼 이벤트
  oButton.addEventListener('mouseenter', () => showHint('O'));
  oButton.addEventListener('mouseleave', hideHint);
  oButton.addEventListener('click', () => {
    if (oButton.disabled) return;
    // 클릭 시 힌트를 유지하고 답안 제출
    currentAnswer = 'O';
    playSound('click');
    setTimeout(() => handleSubmit(), 300);
  });

  // X 버튼 이벤트
  xButton.addEventListener('mouseenter', () => showHint('X'));
  xButton.addEventListener('mouseleave', hideHint);
  xButton.addEventListener('click', () => {
    if (xButton.disabled) return;
    // 클릭 시 힌트를 유지하고 답안 제출
    currentAnswer = 'X';
    playSound('click');
    setTimeout(() => handleSubmit(), 300);
  });

  container.appendChild(oButton);
  container.appendChild(vsText);
  container.appendChild(xButton);
  questionArea.appendChild(container);
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
      setTimeout(() => handleSubmit(), 500);
    });
  });

  const hintEl = document.createElement('div');
  hintEl.className = 'finderror-hint';
  hintEl.textContent = '(밑줄 친 단어를 클릭하세요)';

  container.appendChild(textEl);
  container.appendChild(hintEl);
  questionArea.appendChild(container);
}

/**
 * 답변 제출
 */
async function handleSubmit() {
  if (!currentAnswer) {
    return;
  }

  // 중복 제출 방지
  if (questionArea.dataset.submitting === 'true') {
    return;
  }
  questionArea.dataset.submitting = 'true';

  try {
    const question = currentSession.questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const response = await quizApi.submitAnswer(
      currentSession.sessionId,
      question.id,
      currentAnswer,
      timeTaken
    );

    if (response.success) {
      showFeedback(response.result, question);
    }
  } catch (error) {
    console.error('답변 제출 실패:', error);
    alert('답변 제출에 실패했습니다');
    questionArea.dataset.submitting = 'false';
  }
}

/**
 * 피드백 표시
 */
function showFeedback(result, question) {
  if (result.is_correct) {
    // 정답: 초록색 표시 + 다음 문제 버튼 표시
    playSound('correct');
    highlightCorrectAnswer();
    
    // 말풍선에 격려 메시지
    explanationBubble.classList.remove('ox-hint', 'long');
    explanationBubble.classList.add('empty');
    explanationText.textContent = '정답입니다! 👏';
    
    // 첫 시도에 맞춘 경우
    if (result.attempt === 1) {
      firstAttemptCorrectCount++;
      
      // 별표 폭죽 효과
      triggerFireworks();
      
      // 별표 게이지 채우기
      setTimeout(() => updateStarGauge(true), 500);
    }
    
    // 다음 문제 버튼 표시
    setTimeout(() => {
      questionArea.dataset.submitting = 'false';
      show(nextQuestionBtn);
      animate(nextQuestionBtn, 'bounce');
    }, 1500);
    
  } else {
    // 오답: 빨간색 표시 + 해설 말풍선 타이핑 효과
    playSound('wrong');
    highlightIncorrectAnswer();
    
    // 부드러운 흔들림
    document.querySelector('.quiz-main').classList.add('gentle-shake');
    setTimeout(() => {
      document.querySelector('.quiz-main').classList.remove('gentle-shake');
    }, 300);
    
    // 해설 말풍선 타이핑 효과로 표시
    if (result.explanation || question.explanation) {
      const text = result.explanation || question.explanation;
      explanationBubble.classList.remove('ox-hint', 'empty'); // OX 힌트 클래스 제거
      explanationBubble.classList.add('long'); // 긴 텍스트 클래스 추가
      typeWriterEffect(explanationText, text, 30);
    }

    // 5초 후 다시 시도
    setTimeout(() => {
      explanationText.textContent = '';
      explanationBubble.classList.remove('ox-hint', 'long');
      explanationBubble.classList.add('empty');
      questionArea.dataset.submitting = 'false';
      currentAnswer = null;
      
      // 선택 상태 초기화
      questionArea.querySelectorAll('.selected, .incorrect').forEach(el => {
        el.classList.remove('selected', 'incorrect');
      });
    }, 5000);
  }
}

/**
 * 정답 하이라이트
 */
function highlightCorrectAnswer() {
  const question = currentSession.questions[currentQuestionIndex];

  switch (question.question_type) {
    case 'fill_in_blank':
    case 'fillblank':
      questionArea.querySelectorAll('.fillblank-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;
      
    case 'ox':
      questionArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.disabled = true;
      });
      break;
      
    case 'find_error':
    case 'finderror':
      questionArea.querySelectorAll('.finderror-word').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('correct');
        }
        el.classList.add('disabled');
      });
      break;
      
    case 'drag_and_drop':
    case 'dragdrop':
      const target = questionArea.querySelector('.dragdrop-target');
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
  const question = currentSession.questions[currentQuestionIndex];

  switch (question.question_type) {
    case 'fill_in_blank':
    case 'fillblank':
      questionArea.querySelectorAll('.fillblank-option').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;
      
    case 'ox':
      questionArea.querySelectorAll('.ox-button').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;
      
    case 'find_error':
    case 'finderror':
      questionArea.querySelectorAll('.finderror-word').forEach(el => {
        if (el.dataset.value === currentAnswer) {
          el.classList.add('incorrect');
        }
      });
      break;
      
    case 'drag_and_drop':
    case 'dragdrop':
      const target = questionArea.querySelector('.dragdrop-target');
      if (target) {
        target.style.borderColor = '#d41010';
        target.style.background = 'rgba(252, 40, 71, 0.3)';
      }
      break;
  }

  // 화면 흔들림 효과
  animate(document.body, 'shake', 500);
}

/**
 * 다음 문제
 */
function handleNext() {
  currentQuestionIndex++;

  // 세션 업데이트
  currentSession.currentQuestionIndex = currentQuestionIndex;
  sessionStorage.setItem('currentSession', JSON.stringify(currentSession));

  loadQuestion();
}

/**
 * 퀴즈 완료
 */
async function completeQuiz() {
  try {
    const response = await quizApi.completeSession(currentSession.sessionId);

    if (response.success) {
      // 결과 페이지로 이동
      sessionStorage.setItem('quizResult', JSON.stringify(response.result));
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
function handleQuit() {
  if (confirm('퀴즈를 종료하시겠습니까?\n진행 상황은 저장되지 않습니다.')) {
    sessionStorage.removeItem('currentSession');
    window.location.href = '/pages/quiz-list.html';
  }
}

/**
 * 타이핑 효과
 */
function typeWriterEffect(element, text, speed = 50) {
  element.textContent = '';
  let i = 0;
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

/**
 * 별표 폭죽 효과 (오른쪽 상단 진행바 위치에서)
 */
function triggerFireworks() {
  // 오른쪽 상단 별표 게이지 위치
  const starGaugeSection = document.querySelector('.star-gauge-section');
  const rect = starGaugeSection.getBoundingClientRect();
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
 * 별표 게이지 업데이트
 */
function updateStarGauge(animate = false) {
  const percentage = Math.min(100, (firstAttemptCorrectCount / totalQuestions) * 100);
  
  // width 스타일로 직접 설정 (quiz-list와 동일)
  starGaugeFill.style.width = percentage + '%';
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
