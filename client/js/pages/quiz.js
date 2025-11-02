/**
 * 퀴즈 게임 페이지
 */

import { quiz as quizApi } from '../modules/api.js';
import { requireAuth } from '../modules/auth.js';
import { $, show, hide, animate, playSound } from '../modules/utils.js';

// 인증 확인
requireAuth();

// DOM 요소
const quitButton = $('#quitButton');
const questionNumber = $('#questionNumber');
const totalQuestions = $('#totalQuestions');
const timer = $('#timer');
const questionTypeBadge = $('#questionTypeBadge');
const questionCategoryBadge = $('#questionCategoryBadge');
const questionText = $('#questionText');
const questionArea = $('#questionArea');
const submitButton = $('#submitButton');
const feedbackModal = $('#feedbackModal');
const feedbackIcon = $('#feedbackIcon');
const feedbackTitle = $('#feedbackTitle');
const feedbackMessage = $('#feedbackMessage');
const feedbackExplanation = $('#feedbackExplanation');
const nextButton = $('#nextButton');

// 상태
let currentSession = null;
let currentQuestionIndex = 0;
let currentAnswer = null;
let startTime = null;
let timerInterval = null;

/**
 * 초기화
 */
function init() {
  // 세션 정보 로드
  const sessionData = sessionStorage.getItem('currentSession');
  if (!sessionData) {
    alert('세션 정보가 없습니다');
    window.location.href = '/pages/quiz-list.html';
    return;
  }

  currentSession = JSON.parse(sessionData);
  currentQuestionIndex = currentSession.currentQuestionIndex || 0;

  // UI 초기화
  totalQuestions.textContent = currentSession.questions.length;

  // 이벤트 리스너
  quitButton.addEventListener('click', handleQuit);
  quitButton.addEventListener('mousedown', () => playSound('click'));
  submitButton.addEventListener('click', handleSubmit);
  submitButton.addEventListener('mousedown', () => playSound('click'));
  nextButton.addEventListener('click', handleNext);
  nextButton.addEventListener('mousedown', () => playSound('click'));

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
  questionTypeBadge.textContent = getQuestionTypeLabel(question.question_type);
  questionCategoryBadge.textContent = question.category === 'luckydraw' ? 'LUCKYDRAW ⭐' : 'NORMAL';

  if (question.category === 'luckydraw') {
    questionCategoryBadge.classList.add('question-category-badge--luckydraw');
  } else {
    questionCategoryBadge.classList.remove('question-category-badge--luckydraw');
  }

  questionText.textContent = question.question_text;

  // 답변 초기화
  currentAnswer = null;
  submitButton.disabled = false;

  // 문제 타입에 따라 렌더링
  renderQuestion(question);

  // 애니메이션
  animate(document.querySelector('.quiz-question-card'), 'fade-in');
}

/**
 * 문제 타입 라벨
 */
function getQuestionTypeLabel(type) {
  const labels = {
    'dragdrop': 'DRAG & DROP',
    'drag_and_drop': 'DRAG & DROP',
    'typing': 'TYPING',
    'fillblank': 'MULTIPLE CHOICE',
    'fill_in_blank': 'MULTIPLE CHOICE',
    'ox': 'O/X QUIZ',
    'finderror': 'FIND ERROR',
    'find_error': 'FIND ERROR'
  };
  return labels[type] || type.toUpperCase();
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

  // 드래그 아이템들
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'dragdrop-items';

  dragItems.forEach((item, index) => {
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

  // 드롭 타겟
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
    animate(targetEl, 'bounce');
  });

  container.appendChild(itemsContainer);
  container.appendChild(targetEl);
  questionArea.appendChild(container);
}

/**
 * 2. Typing 렌더링
 */
function renderTyping(question) {
  const container = document.createElement('div');
  container.className = 'typing-container';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'pixel-input typing-input';
  input.placeholder = '정답을 입력하세요';
  input.autocomplete = 'off';

  // 복사/붙여넣기 방지
  input.addEventListener('copy', (e) => e.preventDefault());
  input.addEventListener('paste', (e) => e.preventDefault());
  input.addEventListener('cut', (e) => e.preventDefault());
  input.addEventListener('contextmenu', (e) => e.preventDefault());

  // 입력 시 답변 저장
  input.addEventListener('input', (e) => {
    currentAnswer = e.target.value;
  });

  const hint = document.createElement('p');
  hint.className = 'typing-hint';
  hint.textContent = '⚠️ 복사/붙여넣기가 차단되어 있습니다';

  container.appendChild(input);
  container.appendChild(hint);
  questionArea.appendChild(container);

  // 포커스
  input.focus();
}

/**
 * 3. Fill Blank (객관식) 렌더링
 */
function renderFillBlank(question) {
  const { options } = question.question_data;

  const container = document.createElement('div');
  container.className = 'fillblank-options';

  options.forEach((option) => {
    const optionEl = document.createElement('div');
    optionEl.className = 'fillblank-option';
    optionEl.textContent = option;
    optionEl.dataset.value = option;

    optionEl.addEventListener('click', () => {
      // 기존 선택 해제
      container.querySelectorAll('.fillblank-option').forEach(el => {
        el.classList.remove('selected');
      });

      // 새 선택
      optionEl.classList.add('selected');
      currentAnswer = option;
      playSound('click');
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

  // 캐릭터
  const character = document.createElement('div');
  character.className = 'ox-character thinking';
  character.textContent = '🤔';

  // 힌트 말풍선
  const hint = document.createElement('div');
  hint.className = 'ox-hint';
  hint.textContent = '마우스를 정답에 가까이 가져가보세요...';

  // O/X 옵션
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'ox-options';

  ['O', 'X'].forEach((option) => {
    const optionEl = document.createElement('div');
    optionEl.className = 'ox-option';
    optionEl.textContent = option;
    optionEl.dataset.value = option;

    // 마우스 거리 계산
    optionEl.addEventListener('mousemove', (e) => {
      const rect = optionEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const distance = Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2));

      const correctAnswer = question.question_data.correct_answer;
      const isCorrect = option === correctAnswer;

      // 거리에 따라 힌트 변경
      if (distance < 50) {
        if (isCorrect) {
          hint.textContent = '😊 좋은 선택이에요!';
          character.textContent = '😃';
        } else {
          hint.textContent = '😰 음... 다시 생각해보세요';
          character.textContent = '😨';
        }
      } else if (distance < 100) {
        if (isCorrect) {
          hint.textContent = '🙂 괜찮은 것 같아요';
          character.textContent = '🙂';
        } else {
          hint.textContent = '😐 글쎄요...';
          character.textContent = '😐';
        }
      } else {
        hint.textContent = '🤔 음... 어떤 게 맞을까요?';
        character.textContent = '🤔';
      }
    });

    optionEl.addEventListener('click', () => {
      // 기존 선택 해제
      optionsContainer.querySelectorAll('.ox-option').forEach(el => {
        el.classList.remove('selected');
      });

      // 새 선택
      optionEl.classList.add('selected');
      currentAnswer = option;
      playSound('click');
    });

    optionsContainer.appendChild(optionEl);
  });

  container.appendChild(character);
  container.appendChild(hint);
  container.appendChild(optionsContainer);
  questionArea.appendChild(container);
}

/**
 * 5. Find Error 렌더링
 */
function renderFindError(question) {
  const { words, underlined_words } = question.question_data;
  const errorWords = words || underlined_words;

  const container = document.createElement('div');
  container.className = 'finderror-container';

  const textEl = document.createElement('div');
  textEl.className = 'finderror-text';

  errorWords.forEach((word) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'finderror-word';
    wordEl.textContent = word;
    wordEl.dataset.value = word;

    wordEl.addEventListener('click', () => {
      // 기존 선택 해제
      textEl.querySelectorAll('.finderror-word').forEach(el => {
        el.classList.remove('selected');
      });

      // 새 선택
      wordEl.classList.add('selected');
      currentAnswer = word;
      playSound('click');
      animate(wordEl, 'bounce');
    });

    textEl.appendChild(wordEl);
  });

  container.appendChild(textEl);
  questionArea.appendChild(container);
}

/**
 * 답변 제출
 */
async function handleSubmit() {
  if (!currentAnswer) {
    alert('답변을 선택해주세요');
    animate(document.querySelector('.quiz-question-card'), 'shake');
    playSound('wrong');
    return;
  }

  submitButton.disabled = true;

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
      showFeedback(response.result);
    }
  } catch (error) {
    console.error('답변 제출 실패:', error);
    alert('답변 제출에 실패했습니다');
    submitButton.disabled = false;
  }
}

/**
 * 피드백 표시
 */
function showFeedback(result) {
  if (result.is_correct) {
    feedbackIcon.textContent = '✅';
    feedbackIcon.className = 'feedback-icon feedback-icon--correct';
    feedbackTitle.textContent = '정답입니다!';
    feedbackMessage.textContent = `시도 횟수: ${result.attempt}회`;
    hide(feedbackExplanation);
    playSound('correct');
  } else {
    feedbackIcon.textContent = '❌';
    feedbackIcon.className = 'feedback-icon feedback-icon--wrong';
    feedbackTitle.textContent = '틀렸습니다';
    feedbackMessage.textContent = `정답: ${result.correct_answer}`;

    if (result.explanation) {
      feedbackExplanation.innerHTML = `<strong>해설:</strong> ${result.explanation}`;
      show(feedbackExplanation);
    }

    playSound('wrong');

    // 화면 흔들림 효과
    animate(document.body, 'shake', 500);

    submitButton.disabled = false;
    currentAnswer = null;
  }

  show(feedbackModal);
  animate(feedbackModal.querySelector('.modal-content'), 'zoom-in');
}

/**
 * 다음 문제
 */
function handleNext() {
  hide(feedbackModal);
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

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
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

// 초기화
init();

// 페이지 이탈 방지
window.addEventListener('beforeunload', (e) => {
  if (currentSession) {
    e.preventDefault();
    e.returnValue = '';
  }
});
