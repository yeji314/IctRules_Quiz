/**
 * API 클라이언트 모듈
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * HTTP 요청 헬퍼
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // 토큰이 있으면 헤더에 추가
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API 요청에 실패했습니다');
    }

    return data;
  } catch (error) {
    console.error('API 에러:', error);
    throw error;
  }
}

/**
 * GET 요청
 */
export async function get(endpoint) {
  return request(endpoint, { method: 'GET' });
}

/**
 * POST 요청
 */
export async function post(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT 요청
 */
export async function put(endpoint, data) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE 요청
 */
export async function del(endpoint) {
  return request(endpoint, { method: 'DELETE' });
}

/**
 * ==========================================
 * 인증 API
 * ==========================================
 */

export const auth = {
  /**
   * 로그인
   */
  async login(employeeId, password) {
    return post('/auth/login', {
      employee_id: employeeId,
      password
    });
  },

  /**
   * 로그아웃
   */
  async logout() {
    return post('/auth/logout');
  },

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser() {
    return get('/auth/me');
  }
};

/**
 * ==========================================
 * 퀴즈 API
 * ==========================================
 */

export const quiz = {
  /**
   * 퀴즈 목록 조회
   */
  async getList() {
    return get('/quiz/list');
  },

  /**
   * 퀴즈 세션 시작
   */
  async startSession(eventId) {
    return post('/quiz/start', { event_id: eventId });
  },

  /**
   * 답변 제출
   */
  async submitAnswer(sessionId, questionId, userAnswer, timeTaken = 0) {
    return post('/quiz/answer', {
      session_id: sessionId,
      question_id: questionId,
      user_answer: userAnswer,
      time_taken: timeTaken
    });
  },

  /**
   * 세션 완료
   */
  async completeSession(sessionId) {
    return post('/quiz/complete', { session_id: sessionId });
  },

  /**
   * 내 세션 목록
   */
  async getMySessions(eventId = null) {
    const url = eventId ? `/quiz/my-sessions?event_id=${eventId}` : '/quiz/my-sessions';
    return get(url);
  },

  /**
   * 세션 취소
   */
  async cancelSession(sessionId) {
    return post('/quiz/cancel', { session_id: sessionId });
  }
};

/**
 * ==========================================
 * 관리자 API
 * ==========================================
 */

export const admin = {
  /**
   * 이벤트 목록 조회
   */
  async listEvents() {
    return get('/admin/events');
  },

  /**
   * 이벤트 생성
   */
  async createEvent(data) {
    return post('/admin/events', data);
  },

  /**
   * 이벤트 수정
   */
  async updateEvent(id, data) {
    return put(`/admin/events/${id}`, data);
  },

  /**
   * 이벤트 삭제
   */
  async deleteEvent(id) {
    return del(`/admin/events/${id}`);
  },

  /**
   * 문제 목록 조회
   */
  async listQuestions(eventId) {
    return get(`/admin/questions?event_id=${eventId}`);
  },

  /**
   * 문제 생성
   */
  async createQuestion(data) {
    return post('/admin/questions', data);
  },

  /**
   * 문제 수정
   */
  async updateQuestion(id, data) {
    return put(`/admin/questions/${id}`, data);
  },

  /**
   * 문제 삭제
   */
  async deleteQuestion(id) {
    return del(`/admin/questions/${id}`);
  },

  /**
   * 문제 대량 업로드
   */
  async bulkUploadQuestions(eventId, questions) {
    return post('/admin/questions/bulk-upload', {
      event_id: eventId,
      questions
    });
  },

  /**
   * 전체 통계 조회
   */
  async getOverview() {
    return get('/admin/stats/overview');
  },

  /**
   * 부서별 통계 조회
   */
  async getDepartmentStats(eventId = null) {
    const url = eventId
      ? `/admin/stats/departments?event_id=${eventId}`
      : '/admin/stats/departments';
    return get(url);
  },

  /**
   * 문제별 통계 조회
   */
  async getQuestionStats(eventId) {
    return get(`/admin/stats/questions?event_id=${eventId}`);
  },

  /**
   * 사용자 목록 조회
   */
  async getUserList(eventId = null) {
    const url = eventId
      ? `/admin/stats/users?event_id=${eventId}`
      : '/admin/stats/users';
    return get(url);
  },

  /**
   * Lucky Draw 추첨
   */
  async drawWinners(eventId, prize, winnerCount) {
    return post('/admin/luckydraw/draw', {
      event_id: eventId,
      prize,
      winner_count: winnerCount
    });
  },

  /**
   * 당첨자 목록 조회
   */
  async getWinners(eventId = null) {
    const url = eventId
      ? `/admin/luckydraw/winners?event_id=${eventId}`
      : '/admin/luckydraw/winners';
    return get(url);
  },

  /**
   * 상품 수령 처리
   */
  async claimPrize(id) {
    return put(`/admin/luckydraw/${id}/claim`);
  },

  /**
   * 부서 목록 조회
   */
  async getDepartments() {
    return get('/admin/departments');
  },

  /**
   * 부서 생성
   */
  async createDepartment(data) {
    return post('/admin/departments', data);
  },

  /**
   * 부서 수정
   */
  async updateDepartment(id, data) {
    return put(`/admin/departments/${id}`, data);
  },

  /**
   * 부서 삭제
   */
  async deleteDepartment(id) {
    return del(`/admin/departments/${id}`);
  }
};
