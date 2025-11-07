/**
 * 관리자 대시보드 페이지
 */

import { admin } from '../modules/api.js';
import { requireAdmin, getUser, logout as authLogout } from '../modules/auth.js';
import { $, show, hide, animate, playSound, formatDate } from '../modules/utils.js';

// 인증 확인 (관리자 권한)
requireAdmin();

// DOM 요소
const adminName = $('#adminName');
const logoutBtn = $('#logoutBtn');
const menuItems = document.querySelectorAll('.menu-item');
const dashboardPage = $('#dashboardPage');
const quizPage = $('#quizPage');
const eventSelect = $('#eventSelect');
const currentYearMonth = $('#currentYearMonth');
const departmentStats = $('#departmentStats');
const winnersTableBody = $('#winnersTableBody');

// 퀴즈 관리 페이지 요소
const eventsList = $('#eventsList');
const questionsSection = $('#questionsSection');
const selectedEventName = $('#selectedEventName');
const questionsList = $('#questionsList');
const createEventBtn = $('#createEventBtn');
const createQuestionBtn = $('#createQuestionBtn');
const uploadExcelBtn = $('#uploadExcelBtn');

// 모달 요소
const eventModal = $('#eventModal');
const eventForm = $('#eventForm');
const cancelEventBtn = $('#cancelEventBtn');
const questionModal = $('#questionModal');
const questionForm = $('#questionForm');
const cancelQuestionBtn = $('#cancelQuestionBtn');
const excelModal = $('#excelModal');
const excelForm = $('#excelForm');
const cancelExcelBtn = $('#cancelExcelBtn');

// 상태
let currentPage = 'dashboard';
let selectedEventId = null;
let editingEventId = null;
let editingQuestionId = null;
let allEvents = [];

/**
 * 초기화
 */
async function init() {
  // 관리자 정보 표시
  const user = getUser();
  if (user) {
    adminName.textContent = `${user.name}님`;
  }

  // 이벤트 리스너
  logoutBtn.addEventListener('click', handleLogout);
  menuItems.forEach(item => {
    item.addEventListener('click', () => handleMenuClick(item));
  });

  eventSelect.addEventListener('change', loadDepartmentStats);
  createEventBtn.addEventListener('click', () => openEventModal());
  createQuestionBtn.addEventListener('click', () => openQuestionModal());
  uploadExcelBtn.addEventListener('click', () => openExcelModal());

  // 모달 이벤트
  cancelEventBtn.addEventListener('click', () => eventModal.close());
  cancelQuestionBtn.addEventListener('click', () => questionModal.close());
  cancelExcelBtn.addEventListener('click', () => excelModal.close());

  eventForm.addEventListener('submit', handleEventSubmit);
  questionForm.addEventListener('submit', handleQuestionSubmit);
  excelForm.addEventListener('submit', handleExcelUpload);

  // 문제 유형 변경 시 동적 필드 렌더링
  $('#questionType').addEventListener('change', renderQuestionDataFields);

  // 초기 데이터 로드
  await loadEvents();
  await loadDepartmentStats();
  await loadWinners();
}

/**
 * 메뉴 클릭 처리
 */
function handleMenuClick(item) {
  const page = item.dataset.page;
  
  // 메뉴 활성화
  menuItems.forEach(m => m.classList.remove('active'));
  item.classList.add('active');

  // 페이지 전환
  if (page === 'dashboard') {
    dashboardPage.classList.add('active');
    quizPage.classList.remove('active');
    currentPage = 'dashboard';
  } else if (page === 'quiz') {
    dashboardPage.classList.remove('active');
    quizPage.classList.add('active');
    currentPage = 'quiz';
    loadEventsList();
  }

  playSound('click');
}

/**
 * 이벤트 목록 로드 (셀렉트박스용)
 */
async function loadEvents() {
  try {
    const response = await admin.listEvents();
    allEvents = response.events;

    // 현재 년월 (YYYY-MM 형식)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentYearMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // 현재 년월 표시 (한글)
    currentYearMonth.textContent = `(현재: ${currentYear}년 ${currentMonth}월)`;

    // 셀렉트박스 채우기
    eventSelect.innerHTML = '<option value="">전체</option>';
    let selectedEventId = null;

    allEvents.forEach(event => {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = `${event.title} (${event.year_month})`;

      // 현재 년월과 일치하는 이벤트를 기본 선택
      if (event.year_month === currentYearMonthStr) {
        option.selected = true;
        selectedEventId = event.id;
      }

      eventSelect.appendChild(option);
    });

    // 현재 년월 이벤트가 있으면 해당 이벤트의 통계를 자동으로 로드
    if (selectedEventId) {
      console.log(`[이벤트 자동 선택] ${currentYear}년 ${currentMonth}월 이벤트 (ID: ${selectedEventId})`);
      // loadDepartmentStats는 init()에서 별도로 호출되므로 여기서는 로그만 출력
    }

  } catch (error) {
    console.error('이벤트 로드 실패:', error);
  }
}

/**
 * 부서별 참여율 로드
 */
async function loadDepartmentStats() {
  try {
    departmentStats.innerHTML = '<div class="loading-message"><p>⏳ 로딩 중...</p></div>';

    const eventId = eventSelect.value;
    const response = await admin.getDepartmentStats(eventId || null);

    if (!response.departments || response.departments.length === 0) {
      departmentStats.innerHTML = '<div class="loading-message"><p>📊 데이터가 없습니다</p></div>';
      return;
    }

    // 부서별 게이지 렌더링
    departmentStats.innerHTML = '';
    response.departments.forEach(dept => {
      const percentage = dept.participation_rate || 0;
      const participated = dept.participated || 0;
      const total = dept.total || 0;
      
      let fillClass = 'high';
      if (percentage < 30) fillClass = 'low';
      else if (percentage < 70) fillClass = 'medium';

      const deptItem = document.createElement('div');
      deptItem.className = 'department-item';
      deptItem.innerHTML = `
        <div class="department-header">
          <div class="department-name">${dept.department || '미지정'}</div>
          <div class="department-percentage">${percentage.toFixed(1)}% (${participated}/${total}명)</div>
        </div>
        <div class="department-gauge">
          <div class="gauge-fill ${fillClass}" style="width: ${percentage}%;"></div>
        </div>
      `;
      departmentStats.appendChild(deptItem);
    });

  } catch (error) {
    console.error('부서별 통계 로드 실패:', error);
    departmentStats.innerHTML = '<div class="loading-message"><p>❌ 로드 실패</p></div>';
  }
}

/**
 * Lucky Draw 당첨자 로드
 */
async function loadWinners() {
  try {
    winnersTableBody.innerHTML = '<tr><td colspan="5" class="loading-message">⏳ 로딩 중...</td></tr>';

    const response = await admin.getWinners();

    if (!response.winners || response.winners.length === 0) {
      winnersTableBody.innerHTML = '<tr><td colspan="5" class="loading-message">🎁 당첨자가 없습니다</td></tr>';
      return;
    }

    // 당첨자 테이블 렌더링
    winnersTableBody.innerHTML = '';
    response.winners.forEach(winner => {
      const row = document.createElement('tr');
      const claimStatus = winner.claimed_at ? 
        '<span class="claim-status claimed">수령 완료</span>' : 
        '<span class="claim-status pending">대기 중</span>';
      
      row.innerHTML = `
        <td>${winner.User?.name || '-'}</td>
        <td>${winner.User?.department || '-'}</td>
        <td>${formatDate(winner.won_at)}</td>
        <td>${winner.prize_name || '기프티콘'}</td>
        <td>${claimStatus}</td>
      `;
      winnersTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('당첨자 로드 실패:', error);
    winnersTableBody.innerHTML = '<tr><td colspan="5" class="loading-message">❌ 로드 실패</td></tr>';
  }
}

/**
 * 이벤트 목록 로드 (퀴즈 관리용)
 */
async function loadEventsList() {
  try {
    if (!eventsList) {
      console.error('[loadEventsList] eventsList 요소를 찾을 수 없습니다');
      return;
    }

    eventsList.innerHTML = '<div class="loading-message"><p>⏳ 로딩 중...</p></div>';

    const response = await admin.listEvents();
    allEvents = response.events;

    if (allEvents.length === 0) {
      eventsList.innerHTML = '<div class="loading-message"><p>📝 등록된 이벤트가 없습니다</p></div>';
      return;
    }

    // 이벤트 카드 렌더링
    eventsList.innerHTML = '';
    allEvents.forEach(event => {
      const card = createEventCard(event);
      eventsList.appendChild(card);
    });

  } catch (error) {
    console.error('이벤트 목록 로드 실패:', error);
    eventsList.innerHTML = '<div class="loading-message"><p>❌ 로드 실패</p></div>';
  }
}

/**
 * 이벤트 카드 생성
 */
function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  if (selectedEventId === event.id) {
    card.classList.add('selected');
  }

  const statusClass = event.is_active ? 'active' : 'inactive';
  const statusText = event.is_active ? '활성' : '비활성';

  card.innerHTML = `
    <div class="event-info">
      <div class="event-title">${event.title}</div>
      <div class="event-meta">
        <span>${event.year_month}</span>
        <span>${formatDate(event.start_date)} ~ ${formatDate(event.end_date)}</span>
        <span>문제 ${event.stats?.totalQuestions || 0}개 (일반 ${event.stats?.normalQuestions || 0}, Lucky ${event.stats?.luckyQuestions || 0})</span>
        <span>참여자 ${event.stats?.participants || 0}명</span>
      </div>
    </div>
    <div class="event-status ${statusClass}">${statusText}</div>
    <div class="event-actions">
      <button class="nes-btn is-primary" data-action="select">문제 관리</button>
      <button class="nes-btn" data-action="edit">수정</button>
      <button class="nes-btn is-error" data-action="delete">삭제</button>
    </div>
  `;

  // 이벤트 리스너
  const selectBtn = card.querySelector('[data-action="select"]');
  const editBtn = card.querySelector('[data-action="edit"]');
  const deleteBtn = card.querySelector('[data-action="delete"]');

  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectEvent(event.id);
  });

  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEventModal(event);
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteEvent(event.id);
  });

  return card;
}

/**
 * 이벤트 선택 (문제 관리)
 */
async function selectEvent(eventId) {
  selectedEventId = eventId;
  const event = allEvents.find(e => e.id === eventId);

  // 모든 이벤트 카드에서 selected 클래스 제거
  const allCards = eventsList.querySelectorAll('.event-card');
  allCards.forEach(card => card.classList.remove('selected'));

  // 선택된 카드에 selected 클래스 추가
  const selectedCard = Array.from(allCards).find(card => {
    const selectBtn = card.querySelector('[data-action="select"]');
    return selectBtn && selectBtn.closest('.event-card');
  });

  if (event) {
    selectedEventName.textContent = `- ${event.title}`;
    questionsSection.style.display = 'block';
    await loadQuestions(eventId);
  }

  playSound('click');
}

/**
 * 문제 목록 로드
 */
async function loadQuestions(eventId) {
  try {
    questionsList.innerHTML = '<div class="loading-message"><p>⏳ 로딩 중...</p></div>';

    const response = await admin.listQuestions(eventId);

    if (!response.questions || response.questions.length === 0) {
      questionsList.innerHTML = '<div class="loading-message"><p>📝 등록된 문제가 없습니다</p></div>';
      return;
    }

    // 문제 카드 렌더링
    questionsList.innerHTML = '';
    response.questions.forEach((question, index) => {
      const card = createQuestionCard(question, index + 1);
      questionsList.appendChild(card);
    });

  } catch (error) {
    console.error('문제 목록 로드 실패:', error);
    questionsList.innerHTML = '<div class="loading-message"><p>❌ 로드 실패</p></div>';
  }
}

/**
 * 문제 카드 생성
 */
function createQuestionCard(question, index) {
  const card = document.createElement('div');
  card.className = 'question-card';

  const typeNames = {
    'dragdrop': '드래그앤드롭',
    'typing': '타이핑',
    'fillblank': '빈칸맞추기',
    'ox': 'OX퀴즈',
    'finderror': '틀린부분찾기',
    'fill_in_blank': '빈칸맞추기',
    'find_error': '틀린부분찾기'
  };

  card.innerHTML = `
    <div class="question-header">
      <div>
        <span class="question-type-badge">${typeNames[question.question_type] || question.question_type}</span>
        <span class="question-category-badge ${question.category}">${question.category === 'luckydraw' ? 'Lucky Draw' : '일반'}</span>
      </div>
      <div class="question-actions">
        <button class="nes-btn" data-action="edit">수정</button>
        <button class="nes-btn is-error" data-action="delete">삭제</button>
      </div>
    </div>
    <div class="question-text">
      ${index}. ${question.question_text}
    </div>
  `;

  // 이벤트 리스너
  const editBtn = card.querySelector('[data-action="edit"]');
  const deleteBtn = card.querySelector('[data-action="delete"]');

  editBtn.addEventListener('click', () => openQuestionModal(question));
  deleteBtn.addEventListener('click', () => deleteQuestion(question.id));

  return card;
}

/**
 * 이벤트 모달 열기
 */
function openEventModal(event = null) {
  editingEventId = event ? event.id : null;

  $('#eventModalTitle').textContent = event ? '이벤트 수정' : '이벤트 생성';
  $('#eventTitle').value = event ? event.title : '';
  $('#eventYearMonth').value = event ? event.year_month : '';
  $('#eventStartDate').value = event ? event.start_date : '';
  $('#eventEndDate').value = event ? event.end_date : '';
  $('#eventMaxWinners').value = event ? (event.max_winners || 10) : 10;
  $('#eventIsActive').checked = event ? event.is_active : true;

  eventModal.showModal();
  playSound('click');
}

/**
 * 이벤트 폼 제출
 */
async function handleEventSubmit(e) {
  e.preventDefault();

  const data = {
    title: $('#eventTitle').value,
    year_month: $('#eventYearMonth').value,
    start_date: $('#eventStartDate').value,
    end_date: $('#eventEndDate').value,
    max_winners: parseInt($('#eventMaxWinners').value),
    is_active: $('#eventIsActive').checked
  };

  try {
    if (editingEventId) {
      await admin.updateEvent(editingEventId, data);
      alert('이벤트가 수정되었습니다');
    } else {
      await admin.createEvent(data);
      alert('이벤트가 생성되었습니다');
    }

    eventModal.close();
    await loadEventsList();
    await loadEvents();
    playSound('correct');

  } catch (error) {
    console.error('이벤트 저장 실패:', error);
    alert('저장 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 이벤트 삭제
 */
async function deleteEvent(eventId) {
  if (!confirm('이벤트를 삭제하시겠습니까?\n연결된 모든 문제도 함께 삭제됩니다.')) {
    return;
  }

  try {
    await admin.deleteEvent(eventId);
    alert('이벤트가 삭제되었습니다');
    await loadEventsList();
    await loadEvents();
    
    if (selectedEventId === eventId) {
      selectedEventId = null;
      questionsSection.style.display = 'none';
    }
    
    playSound('correct');

  } catch (error) {
    console.error('이벤트 삭제 실패:', error);
    alert('삭제 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 문제 모달 열기
 */
function openQuestionModal(question = null) {
  if (!selectedEventId && !question) {
    alert('먼저 이벤트를 선택해주세요');
    return;
  }

  editingQuestionId = question ? question.id : null;

  $('#questionModalTitle').textContent = question ? '문제 수정' : '문제 추가';
  $('#questionType').value = question ? question.question_type : '';
  $('#questionCategory').value = question ? question.category : 'normal';
  $('#questionText').value = question ? question.question_text : '';
  $('#questionExplanation').value = question ? (question.explanation || '') : '';

  // 문제 유형에 따른 동적 필드 렌더링
  renderQuestionDataFields(question);

  questionModal.showModal();
  playSound('click');
}

/**
 * 문제 유형에 따른 동적 필드 렌더링
 */
function renderQuestionDataFields(question = null) {
  const questionType = $('#questionType').value;
  const container = $('#questionDataFields');
  container.innerHTML = '';

  if (!questionType) return;

  // 기존 question 데이터가 없으면 이벤트 객체일 수 있음
  const questionData = (question && question.question_data) ? question.question_data : null;

  switch (questionType) {
    case 'dragdrop':
      container.innerHTML = `
        <div class="nes-field">
          <label>드롭 영역 라벨</label>
          <input type="text" id="targetLabel" class="nes-input" placeholder="여기에 드래그하세요" value="${questionData?.target_label || ''}">
        </div>
        <div class="nes-field">
          <label>선택지 (콤마로 구분)</label>
          <input type="text" id="dragOptions" class="nes-input" placeholder="예: 옵션1, 옵션2, 옵션3" required value="${questionData?.options?.join(', ') || ''}">
          <p class="note">예시: 정답항목, 오답1, 오답2, 오답3</p>
        </div>
        <div class="nes-field">
          <label>정답</label>
          <input type="text" id="correctAnswer" class="nes-input" placeholder="정답 입력" required value="${questionData?.correct_answer || ''}">
        </div>
      `;
      break;

    case 'typing':
      container.innerHTML = `
        <div class="nes-field">
          <label>정답 문장 (사용자가 타이핑해야 할 문장)</label>
          <textarea id="correctAnswer" class="nes-textarea" rows="3" placeholder="사용자가 정확히 입력해야 할 문장" required>${questionData?.correct_answer || ''}</textarea>
          <p class="note">⚠️ 사용자는 이 문장을 정확히 입력해야 합니다 (대소문자, 띄어쓰기 포함)</p>
        </div>
      `;
      break;

    case 'fillblank':
      container.innerHTML = `
        <div class="nes-field">
          <label>선택지 (콤마로 구분, 5개)</label>
          <input type="text" id="fillOptions" class="nes-input" placeholder="예: 옵션1, 옵션2, 옵션3, 옵션4, 옵션5" required value="${questionData?.options?.join(', ') || ''}">
          <p class="note">5개의 선택지를 콤마로 구분하여 입력하세요</p>
        </div>
        <div class="nes-field">
          <label>정답</label>
          <input type="text" id="correctAnswer" class="nes-input" placeholder="정답 입력 (위 선택지 중 하나)" required value="${questionData?.correct_answer || ''}">
        </div>
      `;
      break;

    case 'ox':
      container.innerHTML = `
        <div class="nes-field">
          <label>정답</label>
          <div class="nes-select">
            <select id="correctAnswer" required>
              <option value="O" ${questionData?.correct_answer === 'O' ? 'selected' : ''}>O (맞다)</option>
              <option value="X" ${questionData?.correct_answer === 'X' ? 'selected' : ''}>X (틀리다)</option>
            </select>
          </div>
        </div>
      `;
      break;

    case 'finderror':
      container.innerHTML = `
        <div class="nes-field">
          <label>밑줄 칠 단어들 (콤마로 구분)</label>
          <input type="text" id="underlinedWords" class="nes-input" placeholder="예: 단어1, 단어2, 단어3" required value="${questionData?.underlined_words?.join(', ') || ''}">
          <p class="note">문제 내용에서 틀린 부분으로 의심될 수 있는 단어들을 나열하세요</p>
        </div>
        <div class="nes-field">
          <label>정답 (틀린 단어)</label>
          <input type="text" id="correctAnswer" class="nes-input" placeholder="실제로 틀린 단어" required value="${questionData?.correct_answer || ''}">
          <p class="note">위 밑줄 친 단어 중 실제로 틀린 단어를 입력하세요</p>
        </div>
      `;
      break;
  }
}

/**
 * 문제 폼 제출
 */
async function handleQuestionSubmit(e) {
  e.preventDefault();

  const questionType = $('#questionType').value;
  let questionData = {};

  // 문제 유형에 따라 데이터 수집
  try {
    switch (questionType) {
      case 'dragdrop':
        const dragOptions = $('#dragOptions').value.split(',').map(s => s.trim()).filter(s => s);
        questionData = {
          target_label: $('#targetLabel').value || '여기에 드래그하세요',
          options: dragOptions,
          correct_answer: $('#correctAnswer').value.trim()
        };
        break;

      case 'typing':
        questionData = {
          correct_answer: $('#correctAnswer').value.trim()
        };
        break;

      case 'fillblank':
        const fillOptions = $('#fillOptions').value.split(',').map(s => s.trim()).filter(s => s);
        if (fillOptions.length !== 5) {
          alert('선택지는 정확히 5개여야 합니다');
          return;
        }
        questionData = {
          options: fillOptions,
          correct_answer: $('#correctAnswer').value.trim()
        };
        break;

      case 'ox':
        questionData = {
          correct_answer: $('#correctAnswer').value
        };
        break;

      case 'finderror':
        const underlinedWords = $('#underlinedWords').value.split(',').map(s => s.trim()).filter(s => s);
        questionData = {
          underlined_words: underlinedWords,
          correct_answer: $('#correctAnswer').value.trim()
        };
        break;

      default:
        alert('문제 유형을 선택해주세요');
        return;
    }
  } catch (error) {
    alert('입력 데이터 처리 중 오류가 발생했습니다: ' + error.message);
    return;
  }

  const data = {
    event_id: selectedEventId,
    question_type: questionType,
    category: $('#questionCategory').value,
    question_text: $('#questionText').value,
    question_data: questionData,
    explanation: $('#questionExplanation').value
  };

  try {
    if (editingQuestionId) {
      await admin.updateQuestion(editingQuestionId, data);
      alert('문제가 수정되었습니다');
    } else {
      await admin.createQuestion(data);
      alert('문제가 추가되었습니다');
    }

    questionModal.close();
    await loadQuestions(selectedEventId);
    playSound('correct');

  } catch (error) {
    console.error('문제 저장 실패:', error);
    alert('저장 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 문제 삭제
 */
async function deleteQuestion(questionId) {
  if (!confirm('문제를 삭제하시겠습니까?')) {
    return;
  }

  try {
    await admin.deleteQuestion(questionId);
    alert('문제가 삭제되었습니다');
    await loadQuestions(selectedEventId);
    playSound('correct');

  } catch (error) {
    console.error('문제 삭제 실패:', error);
    alert('삭제 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 엑셀 업로드 모달 열기
 */
function openExcelModal() {
  if (!selectedEventId) {
    alert('먼저 이벤트를 선택해주세요');
    return;
  }

  $('#excelFile').value = '';
  excelModal.showModal();
  playSound('click');
}

/**
 * 엑셀 업로드 처리
 */
async function handleExcelUpload(e) {
  e.preventDefault();

  const fileInput = $('#excelFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('파일을 선택해주세요');
    return;
  }

  if (!selectedEventId) {
    alert('먼저 이벤트를 선택해주세요');
    return;
  }

  try {
    // 파일 읽기
    const data = await file.arrayBuffer();

    // SheetJS 라이브러리가 로드되어 있는지 확인
    if (typeof XLSX === 'undefined') {
      alert('Excel 처리 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
      return;
    }

    // Excel 파일 파싱
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet);

    if (rows.length === 0) {
      alert('엑셀 파일에 데이터가 없습니다');
      return;
    }

    // 데이터 변환 (컬럼명 매핑)
    const questions = rows.map(row => ({
      question_type: row.question_type || row['문제유형'],
      category: row.category || row['카테고리'],
      question_text: row.question_text || row['문제내용'],
      question_data: row.question_data || row['문제데이터'],
      explanation: row.explanation || row['해설'] || ''
    }));

    console.log(`Parsed ${questions.length} questions from Excel`);

    // 백엔드로 전송
    const response = await admin.bulkUploadQuestions(selectedEventId, questions);

    // 결과 표시
    const successCount = response.results?.success?.length || 0;
    const errorCount = response.results?.errors?.length || 0;

    let message = `업로드 완료!\n성공: ${successCount}개, 실패: ${errorCount}개`;

    if (errorCount > 0) {
      message += '\n\n실패한 항목:\n';
      response.results.errors.slice(0, 5).forEach(err => {
        message += `- Row ${err.row}: ${err.error}\n`;
      });
      if (errorCount > 5) {
        message += `... 외 ${errorCount - 5}개`;
      }
    }

    alert(message);
    excelModal.close();
    fileInput.value = ''; // 파일 입력 초기화

    // 문제 목록 새로고침
    await loadQuestions(selectedEventId);
    playSound('correct');

  } catch (error) {
    console.error('엑셀 업로드 실패:', error);
    alert('업로드 실패: ' + error.message);
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

