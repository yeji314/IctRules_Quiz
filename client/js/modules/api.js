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
  }
};

/**
 * ==========================================
 * 관리자 API
 * ==========================================
 */

export const admin = {
  // 이벤트 관리
  events: {
    async list() {
      return get('/admin/events');
    },
    async create(data) {
      return post('/admin/events', data);
    },
    async update(id, data) {
      return put(`/admin/events/${id}`, data);
    },
    async delete(id) {
      return del(`/admin/events/${id}`);
    }
  },

  // 문제 관리
  questions: {
    async list(eventId) {
      return get(`/admin/questions?event_id=${eventId}`);
    },
    async create(data) {
      return post('/admin/questions', data);
    },
    async update(id, data) {
      return put(`/admin/questions/${id}`, data);
    },
    async delete(id) {
      return del(`/admin/questions/${id}`);
    }
  },

  // 통계
  stats: {
    async getOverview() {
      return get('/admin/stats/overview');
    },
    async getDepartments(eventId = null) {
      const url = eventId
        ? `/admin/stats/departments?event_id=${eventId}`
        : '/admin/stats/departments';
      return get(url);
    },
    async getQuestions(eventId) {
      return get(`/admin/stats/questions?event_id=${eventId}`);
    },
    async getUsers(eventId = null) {
      const url = eventId
        ? `/admin/stats/users?event_id=${eventId}`
        : '/admin/stats/users';
      return get(url);
    }
  },

  // LuckyDraw
  luckyDraw: {
    async draw(eventId, prize, winnerCount) {
      return post('/admin/luckydraw/draw', {
        event_id: eventId,
        prize,
        winner_count: winnerCount
      });
    },
    async getWinners(eventId = null) {
      const url = eventId
        ? `/admin/luckydraw/winners?event_id=${eventId}`
        : '/admin/luckydraw/winners';
      return get(url);
    },
    async claimPrize(id) {
      return put(`/admin/luckydraw/${id}/claim`);
    }
  }
};
