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
const departmentsPage = $('#departmentsPage');
const luckydrawPage = $('#luckydrawPage');
const adminsPage = $('#adminsPage');
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
const deleteAllQuestionsBtn = $('#deleteAllQuestionsBtn');

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
const departmentModal = $('#departmentModal');
const departmentForm = $('#departmentForm');
const cancelDepartmentBtn = $('#cancelDepartmentBtn');
const adminModal = $('#adminModal');
const adminForm = $('#adminForm');
const cancelAdminBtn = $('#cancelAdminBtn');
const participantsModal = $('#participantsModal');
const participantsTableBody = $('#participantsTableBody');
const closeParticipantsBtn = $('#closeParticipantsBtn');
const downloadParticipantsBtn = $('#downloadParticipantsBtn');

// 상태
let currentPage = 'dashboard';
let selectedEventId = null;
let editingEventId = null;
let editingQuestionId = null;
let editingDepartmentId = null;
let allEvents = [];
let allQuestions = [];
let currentParticipantsData = null; // 현재 표시된 참가자 데이터 저장

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
  deleteAllQuestionsBtn.addEventListener('click', () => deleteAllQuestions());

  // 부서 관리 버튼
  const createDepartmentBtn = $('#createDepartmentBtn');
  if (createDepartmentBtn) {
    createDepartmentBtn.addEventListener('click', () => openDepartmentModal());
  }

  // 관리자 추가 버튼
  const addAdminBtn = $('#addAdminBtn');
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', () => openAdminModal());
  }

  // 모달 이벤트
  cancelEventBtn.addEventListener('click', () => eventModal.close());
  cancelQuestionBtn.addEventListener('click', () => questionModal.close());
  cancelExcelBtn.addEventListener('click', () => excelModal.close());
  if (cancelDepartmentBtn) {
    cancelDepartmentBtn.addEventListener('click', () => departmentModal.close());
  }
  if (cancelAdminBtn) {
    cancelAdminBtn.addEventListener('click', () => adminModal.close());
  }
  if (closeParticipantsBtn) {
    closeParticipantsBtn.addEventListener('click', () => participantsModal.close());
  }
  if (downloadParticipantsBtn) {
    downloadParticipantsBtn.addEventListener('click', downloadParticipantsExcel);
  }

  // 문제 유형 필터
  const questionTypeFilter = $('#questionTypeFilter');
  if (questionTypeFilter) {
    questionTypeFilter.addEventListener('change', filterQuestions);
  }

  eventForm.addEventListener('submit', handleEventSubmit);
  questionForm.addEventListener('submit', handleQuestionSubmit);
  excelForm.addEventListener('submit', handleExcelUpload);
  if (departmentForm) {
    departmentForm.addEventListener('submit', handleDepartmentSubmit);
  }
  if (adminForm) {
    adminForm.addEventListener('submit', handleAdminSubmit);
  }

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

  // 모든 페이지 숨기기
  dashboardPage.classList.remove('active');
  quizPage.classList.remove('active');
  if (departmentsPage) departmentsPage.classList.remove('active');
  if (luckydrawPage) luckydrawPage.classList.remove('active');
  if (adminsPage) adminsPage.classList.remove('active');

  // 페이지 전환
  if (page === 'dashboard') {
    dashboardPage.classList.add('active');
    currentPage = 'dashboard';
  } else if (page === 'quiz') {
    quizPage.classList.add('active');
    currentPage = 'quiz';
    loadEventsList();
  } else if (page === 'departments') {
    if (departmentsPage) {
      departmentsPage.classList.add('active');
      currentPage = 'departments';
      loadDepartments();
    }
  } else if (page === 'luckydraw') {
    if (luckydrawPage) {
      luckydrawPage.classList.add('active');
      currentPage = 'luckydraw';
      loadLuckyDrawStats();
    }
  } else if (page === 'admins') {
    if (adminsPage) {
      adminsPage.classList.add('active');
      currentPage = 'admins';
      loadAdmins();
    }
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
      deptItem.style.cursor = 'pointer';
      deptItem.innerHTML = `
        <div class="department-header">
          <div class="department-name">${dept.department || '미지정'}</div>
          <div class="department-percentage">${percentage.toFixed(1)}% (${participated}/${total}명)</div>
        </div>
        <div class="department-gauge">
          <div class="gauge-fill ${fillClass}" style="width: ${percentage}%;"></div>
        </div>
      `;
      
      // 클릭 이벤트 추가 - 부서원 목록 표시
      deptItem.addEventListener('click', () => {
        showParticipants(dept.department, eventId);
      });
      
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
        <td>${formatDate(winner.won_date || winner.createdAt)}</td>
        <td>${winner.prize || '기프티콘'}</td>
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

  // Sequelize underscored: true 옵션으로 인해 camelCase 또는 snake_case 모두 처리
  const startDate = event.start_date || event.startDate;
  const endDate = event.end_date || event.endDate;

  card.innerHTML = `
    <div class="event-info">
      <div class="event-title">${event.title}</div>
      <div class="event-meta">
        <span>${event.year_month}</span>
        <span>${formatDate(startDate)} ~ ${formatDate(endDate)}</span>
        <span>문제 ${event.stats?.totalQuestions || 0}개</span>
        <span>참여자 ${event.stats?.participants || 0}명</span>
      </div>
    </div>
    <div class="event-status ${statusClass}">${statusText}</div>
    <div class="event-actions">
      <button class="btn btn-primary" data-action="select">문제 관리</button>
      <button class="btn" data-action="edit">수정</button>
      <button class="btn btn-danger" data-action="delete">삭제</button>
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
      allQuestions = [];
      return;
    }

    // 전역 변수에 저장 (필터링용)
    allQuestions = response.questions;

    // 필터 초기화
    const filterSelect = $('#questionTypeFilter');
    if (filterSelect) {
      filterSelect.value = '';
    }

    // 문제 카드 렌더링
    questionsList.innerHTML = '';
    allQuestions.forEach((question, index) => {
      const card = createQuestionCard(question, index + 1);
      questionsList.appendChild(card);
    });

  } catch (error) {
    console.error('문제 목록 로드 실패:', error);
    questionsList.innerHTML = '<div class="loading-message"><p>❌ 로드 실패</p></div>';
    allQuestions = [];
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
    'drag_and_drop': '드래그앤드롭',
    'typing': '타이핑',
    'fillblank': '빈칸맞추기',
    'fill_in_blank': '빈칸맞추기',
    'ox': 'OX퀴즈',
    'bestaction': '상황형4지선다',
    'best_action': '상황형4지선다'
  };

  card.innerHTML = `
    <div class="question-header">
      <div>
        <span class="question-type-badge">${typeNames[question.question_type] || question.question_type}</span>
      </div>
      <div class="question-actions">
        <button class="btn" data-action="edit">수정</button>
        <button class="btn btn-danger" data-action="delete">삭제</button>
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
  
  // Sequelize underscored: true 옵션으로 인해 camelCase 또는 snake_case 모두 처리
  const startDate = event ? (event.start_date || event.startDate) : '';
  const endDate = event ? (event.end_date || event.endDate) : '';
  const maxWinners = event ? (event.max_winners || event.maxWinners || 10) : 10;
  const isActive = event ? (event.is_active !== undefined ? event.is_active : event.isActive) : true;
  
  // Date 객체를 YYYY-MM-DD 형식으로 변환
  $('#eventStartDate').value = startDate ? formatDateForInput(startDate) : '';
  $('#eventEndDate').value = endDate ? formatDateForInput(endDate) : '';
  $('#eventMaxWinners').value = maxWinners;
  $('#eventIsActive').checked = isActive !== undefined ? isActive : true;

  console.log('[openEventModal] 이벤트 데이터:', {
    event,
    startDate,
    endDate,
    formattedStartDate: $('#eventStartDate').value,
    formattedEndDate: $('#eventEndDate').value
  });

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

  // 서버에서 내려오는 question_type(예: drag_and_drop, fill_in_blank, best_action)을
  // 셀렉트 박스의 값(dragdrop, fillblank, bestaction)으로 변환
  const reverseTypeMapping = {
    'drag_and_drop': 'dragdrop',
    'typing': 'typing',
    'fill_in_blank': 'fillblank',
    'ox': 'ox',
    'best_action': 'bestaction'
  };

  const uiQuestionType = question
    ? (reverseTypeMapping[question.question_type] || question.question_type || '')
    : '';

  $('#questionModalTitle').textContent = question ? '문제 수정' : '문제 추가';
  $('#questionType').value = uiQuestionType;
  $('#questionText').value = question ? question.question_text : '';
  $('#questionExplanation').value = question ? (question.explanation || '') : '';

  // summary와 highlight 로드 (디버깅)
  console.log('[Admin] Question data:', question);
  console.log('[Admin] Summary:', question ? question.summary : 'N/A');
  console.log('[Admin] Highlight:', question ? question.highlight : 'N/A');

  $('#questionSummary').value = question ? (question.summary || '') : '';
  $('#questionHighlight').value = question ? (question.highlight || '') : '';

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
        <div class="form-field">
          <label>드롭 영역 라벨</label>
          <input type="text" id="targetLabel" class="text-input" placeholder="여기에 드래그하세요" value="${questionData?.target_label || ''}">
        </div>
        <div class="form-field">
          <label>선택지 (콤마로 구분)</label>
          <input type="text" id="dragOptions" class="text-input" placeholder="예: 옵션1, 옵션2, 옵션3" required value="${questionData?.options?.join(', ') || ''}">
          <p class="note">예시: 정답항목, 오답1, 오답2, 오답3</p>
        </div>
        <div class="form-field">
          <label>정답</label>
          <input type="text" id="correctAnswer" class="text-input" placeholder="정답 입력" required value="${questionData?.correct_answer || ''}">
        </div>
      `;
      break;

    case 'typing':
      container.innerHTML = `
        <div class="form-field">
          <label>정답 문장 (사용자가 타이핑해야 할 문장)</label>
          <textarea id="correctAnswer" class="text-area" rows="3" placeholder="사용자가 정확히 입력해야 할 문장" required>${questionData?.correct_answer || ''}</textarea>
          <p class="note">⚠️ 사용자는 이 문장을 정확히 입력해야 합니다 (대소문자, 띄어쓰기 포함)</p>
        </div>
      `;
      break;

    case 'fillblank':
      container.innerHTML = `
        <div class="form-field">
          <p class="note" style="background: #fff3cd; padding: 12px; border-radius: 8px; border: 2px solid #ffc107; margin-bottom: 16px;">
            💡 <strong>빈칸 표기 방법:</strong> 문제 내용에서 빈칸을 <strong>[]</strong>로 표기하세요.<br>
            예시: "휴가는 반드시 []에 등록해야 합니다." → 퀴즈에서 <span style="display: inline-block; min-width: 40px; height: 20px; background: #ffe66d; border: 2px solid #2c2c2c; border-radius: 4px; vertical-align: middle;"></span> 로 표시됩니다.
          </p>
        </div>
        <div class="form-field">
          <label>선택지 (콤마로 구분, 4개)</label>
          <input type="text" id="fillOptions" class="text-input" placeholder="예: 옵션1, 옵션2, 옵션3, 옵션4" required value="${questionData?.options?.join(', ') || ''}">
          <p class="note">4개의 선택지를 콤마로 구분하여 입력하세요</p>
        </div>
        <div class="form-field">
          <label>정답</label>
          <input type="text" id="correctAnswer" class="text-input" placeholder="정답 입력 (위 선택지 중 하나)" required value="${questionData?.correct_answer || ''}">
        </div>
      `;
      break;

    case 'ox':
      container.innerHTML = `
        <div class="form-field">
          <label>정답</label>
          <div class="select-wrapper">
            <select id="correctAnswer" required>
              <option value="O" ${questionData?.correct_answer === 'O' ? 'selected' : ''}>O (맞다)</option>
              <option value="X" ${questionData?.correct_answer === 'X' ? 'selected' : ''}>X (틀리다)</option>
            </select>
          </div>
        </div>
      `;
      break;

    case 'bestaction':
      const existingOptions = questionData?.options || ['', '', '', ''];
      container.innerHTML = `
        <div class="form-field">
          <label>선택지 (4개)</label>
          <p class="note">💡 상황에 대한 가장 적절한 행동 4가지를 입력하세요</p>
          <input type="text" id="option1" class="text-input" placeholder="A. 첫 번째 선택지" required value="${existingOptions[0] || ''}">
          <input type="text" id="option2" class="text-input" placeholder="B. 두 번째 선택지" required value="${existingOptions[1] || ''}" style="margin-top: 8px;">
          <input type="text" id="option3" class="text-input" placeholder="C. 세 번째 선택지" required value="${existingOptions[2] || ''}" style="margin-top: 8px;">
          <input type="text" id="option4" class="text-input" placeholder="D. 네 번째 선택지" required value="${existingOptions[3] || ''}" style="margin-top: 8px;">
          <p class="note" style="margin-top: 12px;">예시: "외부 공유 요청을 받았다. 내규에 맞는 1차 조치는?"</p>
        </div>
        <div class="form-field">
          <label>정답</label>
          <div class="select-wrapper">
            <select id="correctAnswer" required>
              <option value="">정답 선택</option>
              <option value="option1" ${questionData?.correct_answer === existingOptions[0] ? 'selected' : ''}>A (첫 번째)</option>
              <option value="option2" ${questionData?.correct_answer === existingOptions[1] ? 'selected' : ''}>B (두 번째)</option>
              <option value="option3" ${questionData?.correct_answer === existingOptions[2] ? 'selected' : ''}>C (세 번째)</option>
              <option value="option4" ${questionData?.correct_answer === existingOptions[3] ? 'selected' : ''}>D (네 번째)</option>
            </select>
          </div>
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
        if (fillOptions.length !== 4 && fillOptions.length !== 5) {
          alert('선택지는 4개 또는 5개여야 합니다');
          return;
        }
        questionData = {
          options: fillOptions,
          correct_answer: $('#correctAnswer').value.trim()
        };
        break;

      case 'bestaction':
        const opt1 = $('#option1').value.trim();
        const opt2 = $('#option2').value.trim();
        const opt3 = $('#option3').value.trim();
        const opt4 = $('#option4').value.trim();

        if (!opt1 || !opt2 || !opt3 || !opt4) {
          alert('4개의 선택지를 모두 입력해주세요');
          return;
        }

        const bestActionOptions = [opt1, opt2, opt3, opt4];
        const selectedAnswer = $('#correctAnswer').value;

        let correctAnswerText;
        switch (selectedAnswer) {
          case 'option1': correctAnswerText = opt1; break;
          case 'option2': correctAnswerText = opt2; break;
          case 'option3': correctAnswerText = opt3; break;
          case 'option4': correctAnswerText = opt4; break;
          default:
            alert('정답을 선택해주세요');
            return;
        }

        questionData = {
          options: bestActionOptions,
          correct_answer: correctAnswerText
        };
        break;

      case 'ox':
        questionData = {
          correct_answer: $('#correctAnswer').value
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

  // 클라이언트 → 서버 유형 변환
  const typeMapping = {
    'dragdrop': 'drag_and_drop',
    'typing': 'typing',
    'fillblank': 'fill_in_blank',
    'ox': 'ox',
    'bestaction': 'best_action'
  };

  const data = {
    event_id: selectedEventId,
    question_type: typeMapping[questionType] || questionType,
    category: 'normal', // 기본값으로 설정 (럭키드로우는 동적으로 결정)
    question_text: $('#questionText').value,
    question_data: questionData,
    explanation: $('#questionExplanation').value,
    summary: $('#questionSummary').value || null,
    highlight: $('#questionHighlight').value || null
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
 * 문제 전체 삭제
 */
async function deleteAllQuestions() {
  if (!selectedEventId) {
    alert('먼저 이벤트를 선택해주세요');
    return;
  }

  // 현재 문제 수 확인
  const questionCount = allQuestions.length;
  if (questionCount === 0) {
    alert('삭제할 문제가 없습니다');
    return;
  }

  // 2단계 확인
  if (!confirm(`⚠️ 정말로 "${$('#selectedEventName').textContent}" 이벤트의 모든 문제(${questionCount}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)) {
    return;
  }

  // 최종 확인
  const confirmText = prompt(`삭제를 확인하려면 "삭제"를 입력하세요:`);
  if (confirmText !== '삭제') {
    alert('삭제가 취소되었습니다');
    return;
  }

  try {
    const response = await admin.deleteAllQuestions(selectedEventId);
    alert(`✅ ${response.deleted_count}개의 문제가 삭제되었습니다`);
    await loadQuestions(selectedEventId);
    playSound('correct');

  } catch (error) {
    console.error('문제 전체 삭제 실패:', error);
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
      explanation: row.explanation || row['해설'] || '',
      summary: row.summary || row['요약'] || '',
      highlight: row.highlight || row['하이라이트'] || ''
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
 * 부서 목록 로드
 */
async function loadDepartments() {
  try {
    const tableBody = $('#departmentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">⏳ 로딩 중...</td></tr>';

    const response = await admin.listDepartments();
    const departments = response.departments;

    if (departments.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">📋 등록된 부서가 없습니다</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    departments.forEach(dept => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${dept.name}</td>
        <td>${dept.total_members}명</td>
        <td>${dept.actual_users}명</td>
        <td>${dept.description || '-'}</td>
        <td>
          <button class="btn btn-sm" data-action="edit" data-id="${dept.id}">수정</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${dept.id}">삭제</button>
        </td>
      `;
      
      // 이벤트 리스너 추가
      const editBtn = row.querySelector('[data-action="edit"]');
      const deleteBtn = row.querySelector('[data-action="delete"]');
      
      editBtn.addEventListener('click', () => editDepartment(dept.id, dept));
      deleteBtn.addEventListener('click', () => deleteDepartmentConfirm(dept.id));
      
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('부서 목록 로드 실패:', error);
    const tableBody = $('#departmentsTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">❌ 로드 실패</td></tr>';
    }
  }
}

/**
 * 부서 모달 열기
 */
function openDepartmentModal(department = null) {
  editingDepartmentId = department ? department.id : null;

  $('#departmentModalTitle').textContent = department ? '부서 수정' : '부서 추가';
  $('#departmentName').value = department ? department.name : '';
  $('#departmentTotalMembers').value = department ? department.total_members : '';
  $('#departmentDescription').value = department ? (department.description || '') : '';

  departmentModal.showModal();
  playSound('click');
}

/**
 * 부서 폼 제출
 */
async function handleDepartmentSubmit(e) {
  e.preventDefault();

  const data = {
    name: $('#departmentName').value,
    total_members: parseInt($('#departmentTotalMembers').value),
    description: $('#departmentDescription').value
  };

  try {
    if (editingDepartmentId) {
      await admin.updateDepartment(editingDepartmentId, data);
      alert('부서가 수정되었습니다');
    } else {
      await admin.createDepartment(data);
      alert('부서가 추가되었습니다');
    }

    departmentModal.close();
    await loadDepartments();
    playSound('correct');

  } catch (error) {
    console.error('부서 저장 실패:', error);
    alert('저장 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 부서 수정
 */
async function editDepartment(id, department) {
  try {
    // department 객체가 이미 있으면 바로 사용
    if (department) {
      openDepartmentModal(department);
    } else {
      // 없으면 다시 조회
      const response = await admin.listDepartments();
      const dept = response.departments.find(d => d.id === id);
      if (dept) {
        openDepartmentModal(dept);
      }
    }
  } catch (error) {
    console.error('부서 조회 실패:', error);
    alert('부서 정보를 불러오는데 실패했습니다');
  }
}

/**
 * 부서 삭제
 */
async function deleteDepartmentConfirm(id) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    await admin.deleteDepartment(id);
    alert('부서가 삭제되었습니다');
    await loadDepartments();
    playSound('correct');

  } catch (error) {
    console.error('부서 삭제 실패:', error);
    alert('삭제 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 럭키드로우 통계 로드
 */
async function loadLuckyDrawStats() {
  try {
    const container = $('#luckyDrawEventsList');
    if (!container) return;

    container.innerHTML = '<div class="loading-message"><p>⏳ 로딩 중...</p></div>';

    const response = await admin.getLuckyDrawStatsByEvent();
    const stats = response.stats;

    if (stats.length === 0) {
      container.innerHTML = '<div class="loading-message"><p>📊 데이터가 없습니다</p></div>';
      return;
    }

    container.innerHTML = '';
    stats.forEach(eventStat => {
      const eventCard = document.createElement('div');
      eventCard.className = 'luckydraw-event-card';
      
      const progressPercent = eventStat.max_winners > 0 
        ? Math.round((eventStat.total_winners / eventStat.max_winners) * 100)
        : 0;

      let winnersHtml = '';
      if (eventStat.winners.length > 0) {
        winnersHtml = `
          <table class="pixel-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>부서</th>
                <th>사번</th>
                <th>상품</th>
                <th>수령</th>
                <th>당첨일</th>
              </tr>
            </thead>
            <tbody>
              ${eventStat.winners.map(w => `
                <tr>
                  <td>${w.user_name}</td>
                  <td>${w.user_department || '-'}</td>
                  <td>${w.user_employee_id}</td>
                  <td>${w.prize || '-'}</td>
                  <td>${w.is_claimed ? '✅' : '⏳'}</td>
                  <td>${formatDate(w.won_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        winnersHtml = '<p class="no-data">아직 당첨자가 없습니다</p>';
      }

      eventCard.innerHTML = `
        <div class="event-header">
          <h3>${eventStat.event_title} (${eventStat.year_month})</h3>
          <div class="event-stats">
            <span class="stat-badge">최대: ${eventStat.max_winners}명</span>
            <span class="stat-badge">당첨: ${eventStat.total_winners}명</span>
            <span class="stat-badge success">수령: ${eventStat.claimed_count}명</span>
            <span class="stat-badge warning">대기: ${eventStat.pending_count}명</span>
            <span class="stat-badge info">남은 기회: ${eventStat.remaining_slots}명</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
          <span class="progress-text">${progressPercent}% (${eventStat.total_winners}/${eventStat.max_winners})</span>
        </div>
        <div class="winners-list">
          ${winnersHtml}
        </div>
      `;

      container.appendChild(eventCard);
    });

  } catch (error) {
    console.error('럭키드로우 통계 로드 실패:', error);
    const container = $('#luckyDrawEventsList');
    if (container) {
      container.innerHTML = '<div class="loading-message"><p>❌ 로드 실패</p></div>';
    }
  }
}

/**
 * 관리자 목록 로드
 */
async function loadAdmins() {
  try {
    const tableBody = $('#adminsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">⏳ 로딩 중...</td></tr>';

    const response = await admin.listAdminEmployees();
    const admins = response.admins;

    if (admins.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">📋 등록된 관리자가 없습니다</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    admins.forEach(adm => {
      const row = document.createElement('tr');
      const isPrimary = adm.is_primary;
      row.innerHTML = `
        <td>${adm.employee_id}${isPrimary ? ' <span style="color: #FFD700;">★</span>' : ''}</td>
        <td>${adm.name || '-'}</td>
        <td>${adm.added_by || '-'}</td>
        <td>${formatDate(adm.created_at)}</td>
        <td>
          ${isPrimary
            ? '<span style="color: #999;">기본 관리자</span>'
            : `<button class="btn btn-sm btn-danger" data-action="delete" data-id="${adm.id}">삭제</button>`}
        </td>
      `;

      // 삭제 버튼 이벤트 리스너
      if (!isPrimary) {
        const deleteBtn = row.querySelector('[data-action="delete"]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => deleteAdminConfirm(adm.id, adm.employee_id));
        }
      }

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('관리자 목록 로드 실패:', error);
    const tableBody = $('#adminsTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">❌ 로드 실패</td></tr>';
    }
  }
}

/**
 * 관리자 모달 열기
 */
function openAdminModal() {
  $('#adminEmployeeId').value = '';
  // adminName is used for logged-in admin name display, use different selector
  const adminNameInput = adminModal.querySelector('#adminName');
  if (adminNameInput) {
    adminNameInput.value = '';
  }

  adminModal.showModal();
  playSound('click');
}

/**
 * 관리자 추가 폼 제출
 */
async function handleAdminSubmit(e) {
  e.preventDefault();

  const data = {
    employee_id: $('#adminEmployeeId').value.trim(),
    name: adminModal.querySelector('#adminName')?.value.trim() || ''
  };

  if (!data.employee_id) {
    alert('행번을 입력해주세요');
    return;
  }

  try {
    await admin.addAdminEmployee(data);
    alert('관리자가 추가되었습니다.\n해당 행번으로 다시 로그인하면 관리자 권한이 부여됩니다.');

    adminModal.close();
    await loadAdmins();
    playSound('correct');

  } catch (error) {
    console.error('관리자 추가 실패:', error);
    alert('추가 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 관리자 삭제
 */
async function deleteAdminConfirm(id, employeeId) {
  if (!confirm(`관리자 "${employeeId}"를 삭제하시겠습니까?\n삭제 후 해당 행번은 다시 로그인해야 일반 사용자로 변경됩니다.`)) {
    return;
  }

  try {
    await admin.deleteAdminEmployee(id);
    alert('관리자가 삭제되었습니다.');
    await loadAdmins();
    playSound('correct');

  } catch (error) {
    console.error('관리자 삭제 실패:', error);
    alert('삭제 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 부서원 목록 표시
 */
async function showParticipants(departmentName, eventId) {
  try {
    $('#participantsModalTitle').textContent = `${departmentName} - 부서원 목록`;
    participantsModal.showModal();
    participantsTableBody.innerHTML = '<tr><td colspan="3" class="loading-message">⏳ 로딩 중...</td></tr>';
    currentParticipantsData = null; // 초기화

    // API 호출
    const response = await admin.getDepartmentParticipants(departmentName, eventId || null);

    if (!response.participants || response.participants.length === 0) {
      participantsTableBody.innerHTML = '<tr><td colspan="3" class="loading-message">👤 부서원 정보가 없습니다</td></tr>';
      return;
    }

    // 현재 데이터 저장 (엑셀 다운로드용)
    currentParticipantsData = {
      department: departmentName,
      participants: response.participants
    };

    // 부서원 테이블 렌더링
    participantsTableBody.innerHTML = '';
    response.participants.forEach(participant => {
      const row = document.createElement('tr');
      const participated = participant.participated ? '참여 ✓' : '미참여';
      const completedCount = participant.completed_questions || 0;
      
      row.innerHTML = `
        <td>${participant.name || '-'}</td>
        <td style="color: ${participant.participated ? '#4aa52e' : '#999'};">${participated}</td>
        <td>${completedCount}문제</td>
      `;
      participantsTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('부서원 목록 로드 실패:', error);
    participantsTableBody.innerHTML = '<tr><td colspan="3" class="loading-message">❌ 로드 실패</td></tr>';
  }
}

/**
 * 부서원 목록 엑셀 다운로드
 */
function downloadParticipantsExcel() {
  if (!currentParticipantsData || !currentParticipantsData.participants) {
    alert('다운로드할 데이터가 없습니다');
    return;
  }

  try {
    // SheetJS 라이브러리 확인
    if (typeof XLSX === 'undefined') {
      alert('Excel 처리 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
      return;
    }

    const { department, participants } = currentParticipantsData;

    // 엑셀 데이터 생성
    const excelData = participants.map(p => ({
      '이름': p.name || '-',
      '사번': p.employee_id || '-',
      '참여 여부': p.participated ? '참여' : '미참여',
      '완료 문제 수': p.completed_questions || 0
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 15 }, // 이름
      { wch: 15 }, // 사번
      { wch: 12 }, // 참여 여부
      { wch: 15 }  // 완료 문제 수
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '부서원 목록');

    // 파일명 생성 (날짜 포함)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${department}_참가자목록_${today}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, filename);
    playSound('correct');

  } catch (error) {
    console.error('엑셀 다운로드 실패:', error);
    alert('다운로드 실패: ' + error.message);
    playSound('wrong');
  }
}

/**
 * 문제 유형별 필터링
 */
function filterQuestions() {
  const filterValue = $('#questionTypeFilter').value;
  const questionsList = $('#questionsList');
  
  if (!allQuestions || allQuestions.length === 0) {
    return;
  }

  questionsList.innerHTML = '';
  
  const filteredQuestions = filterValue 
    ? allQuestions.filter(q => q.question_type === filterValue)
    : allQuestions;

  if (filteredQuestions.length === 0) {
    questionsList.innerHTML = '<div class="loading-message"><p>📝 해당 유형의 문제가 없습니다</p></div>';
    return;
  }

  filteredQuestions.forEach((question, index) => {
    const card = createQuestionCard(question, index + 1);
    questionsList.appendChild(card);
  });
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
 * 날짜를 input[type="date"] 형식으로 변환 (YYYY-MM-DD)
 */
function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  
  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return '';
  }
  
  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // YYYY-MM-DD 형식으로 변환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 초기화 실행
init();

