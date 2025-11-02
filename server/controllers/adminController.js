const db = require('../models');
const { Op } = require('sequelize');

/**
 * ==========================================
 * 이벤트 관리
 * ==========================================
 */

/**
 * 이벤트 목록 조회
 * GET /api/admin/events
 */
const listEvents = async (req, res) => {
  try {
    const events = await db.QuizEvent.findAll({
      order: [['year_month', 'DESC']],
      include: [{
        model: db.Question,
        attributes: ['id', 'category'],
        separate: true
      }]
    });

    // 각 이벤트별 통계 추가
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      const totalQuestions = await db.Question.count({
        where: { event_id: event.id }
      });

      const normalQuestions = await db.Question.count({
        where: { event_id: event.id, category: 'normal' }
      });

      const luckyQuestions = await db.Question.count({
        where: { event_id: event.id, category: 'luckydraw' }
      });

      const participants = await db.QuizSession.count({
        where: { event_id: event.id },
        distinct: true,
        col: 'user_id'
      });

      const completedSessions = await db.QuizSession.count({
        where: { event_id: event.id, status: 'completed' }
      });

      return {
        ...event.toJSON(),
        stats: {
          totalQuestions,
          normalQuestions,
          luckyQuestions,
          participants,
          completedSessions
        }
      };
    }));

    res.json({
      success: true,
      events: eventsWithStats
    });

  } catch (error) {
    console.error('이벤트 목록 조회 에러:', error);
    res.status(500).json({
      error: '이벤트 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 이벤트 생성
 * POST /api/admin/events
 */
const createEvent = async (req, res) => {
  try {
    const { title, year_month, start_date, end_date, is_active } = req.body;

    // 입력 검증
    if (!title || !year_month || !start_date || !end_date) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다'
      });
    }

    // year_month 형식 검증 (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(year_month)) {
      return res.status(400).json({
        error: 'year_month는 YYYY-MM 형식이어야 합니다'
      });
    }

    // 중복 확인
    const existing = await db.QuizEvent.findOne({
      where: { year_month }
    });

    if (existing) {
      return res.status(400).json({
        error: '해당 연월의 이벤트가 이미 존재합니다'
      });
    }

    const event = await db.QuizEvent.create({
      title,
      year_month,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('이벤트 생성 에러:', error);
    res.status(500).json({
      error: '이벤트 생성에 실패했습니다'
    });
  }
};

/**
 * 이벤트 수정
 * PUT /api/admin/events/:id
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, year_month, start_date, end_date, is_active } = req.body;

    const event = await db.QuizEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // year_month가 변경되는 경우 중복 확인
    if (year_month && year_month !== event.year_month) {
      if (!/^\d{4}-\d{2}$/.test(year_month)) {
        return res.status(400).json({
          error: 'year_month는 YYYY-MM 형식이어야 합니다'
        });
      }

      const existing = await db.QuizEvent.findOne({
        where: { year_month, id: { [Op.ne]: id } }
      });

      if (existing) {
        return res.status(400).json({
          error: '해당 연월의 이벤트가 이미 존재합니다'
        });
      }
    }

    await event.update({
      title: title || event.title,
      year_month: year_month || event.year_month,
      start_date: start_date || event.start_date,
      end_date: end_date || event.end_date,
      is_active: is_active !== undefined ? is_active : event.is_active
    });

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('이벤트 수정 에러:', error);
    res.status(500).json({
      error: '이벤트 수정에 실패했습니다'
    });
  }
};

/**
 * 이벤트 삭제
 * DELETE /api/admin/events/:id
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await db.QuizEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // 연관된 세션이 있는지 확인
    const sessionCount = await db.QuizSession.count({
      where: { event_id: id }
    });

    if (sessionCount > 0) {
      return res.status(400).json({
        error: '진행 중이거나 완료된 세션이 있는 이벤트는 삭제할 수 없습니다'
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: '이벤트가 삭제되었습니다'
    });

  } catch (error) {
    console.error('이벤트 삭제 에러:', error);
    res.status(500).json({
      error: '이벤트 삭제에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * 문제 관리
 * ==========================================
 */

/**
 * 문제 목록 조회
 * GET /api/admin/questions?event_id=1
 */
const listQuestions = async (req, res) => {
  try {
    const { event_id } = req.query;

    if (!event_id) {
      return res.status(400).json({
        error: 'event_id가 필요합니다'
      });
    }

    const questions = await db.Question.findAll({
      where: { event_id },
      order: [['category', 'ASC'], ['created_at', 'DESC']]
    });

    // 각 문제별 통계 추가
    const questionsWithStats = await Promise.all(questions.map(async (question) => {
      const totalAnswers = await db.QuizAnswer.count({
        where: { question_id: question.id }
      });

      const correctAnswers = await db.QuizAnswer.count({
        where: { question_id: question.id, is_correct: true }
      });

      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

      return {
        ...question.toJSON(),
        stats: {
          totalAnswers,
          correctAnswers,
          accuracy
        }
      };
    }));

    res.json({
      success: true,
      questions: questionsWithStats
    });

  } catch (error) {
    console.error('문제 목록 조회 에러:', error);
    res.status(500).json({
      error: '문제 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 문제 생성
 * POST /api/admin/questions
 */
const createQuestion = async (req, res) => {
  try {
    const {
      event_id,
      question_type,
      category,
      question_text,
      question_data,
      explanation
    } = req.body;

    // 입력 검증
    if (!event_id || !question_type || !category || !question_text || !question_data) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다'
      });
    }

    // 이벤트 확인
    const event = await db.QuizEvent.findByPk(event_id);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // 문제 타입 검증
    const validTypes = ['dragdrop', 'typing', 'fillblank', 'ox', 'finderror'];
    if (!validTypes.includes(question_type)) {
      return res.status(400).json({
        error: '유효하지 않은 문제 타입입니다'
      });
    }

    // 카테고리 검증
    const validCategories = ['normal', 'luckydraw'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: '유효하지 않은 카테고리입니다'
      });
    }

    // question_data 검증 (correct_answer 필수)
    if (!question_data.correct_answer) {
      return res.status(400).json({
        error: 'question_data에 correct_answer가 필요합니다'
      });
    }

    const question = await db.Question.create({
      event_id,
      question_type,
      category,
      question_text,
      question_data,
      explanation
    });

    res.status(201).json({
      success: true,
      question
    });

  } catch (error) {
    console.error('문제 생성 에러:', error);
    res.status(500).json({
      error: '문제 생성에 실패했습니다'
    });
  }
};

/**
 * 문제 수정
 * PUT /api/admin/questions/:id
 */
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question_type,
      category,
      question_text,
      question_data,
      explanation
    } = req.body;

    const question = await db.Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        error: '문제를 찾을 수 없습니다'
      });
    }

    // 문제 타입 검증
    if (question_type) {
      const validTypes = ['dragdrop', 'typing', 'fillblank', 'ox', 'finderror'];
      if (!validTypes.includes(question_type)) {
        return res.status(400).json({
          error: '유효하지 않은 문제 타입입니다'
        });
      }
    }

    // 카테고리 검증
    if (category) {
      const validCategories = ['normal', 'luckydraw'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: '유효하지 않은 카테고리입니다'
        });
      }
    }

    // question_data 검증
    if (question_data && !question_data.correct_answer) {
      return res.status(400).json({
        error: 'question_data에 correct_answer가 필요합니다'
      });
    }

    await question.update({
      question_type: question_type || question.question_type,
      category: category || question.category,
      question_text: question_text || question.question_text,
      question_data: question_data || question.question_data,
      explanation: explanation !== undefined ? explanation : question.explanation
    });

    res.json({
      success: true,
      question
    });

  } catch (error) {
    console.error('문제 수정 에러:', error);
    res.status(500).json({
      error: '문제 수정에 실패했습니다'
    });
  }
};

/**
 * 문제 삭제
 * DELETE /api/admin/questions/:id
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await db.Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        error: '문제를 찾을 수 없습니다'
      });
    }

    // 답변이 있는지 확인
    const answerCount = await db.QuizAnswer.count({
      where: { question_id: id }
    });

    if (answerCount > 0) {
      return res.status(400).json({
        error: '답변이 있는 문제는 삭제할 수 없습니다'
      });
    }

    await question.destroy();

    res.json({
      success: true,
      message: '문제가 삭제되었습니다'
    });

  } catch (error) {
    console.error('문제 삭제 에러:', error);
    res.status(500).json({
      error: '문제 삭제에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * 통계
 * ==========================================
 */

/**
 * 전체 통계 조회
 * GET /api/admin/stats/overview
 */
const getOverview = async (req, res) => {
  try {
    // 전체 사용자 수
    const totalUsers = await db.User.count({
      where: { role: 'user' }
    });

    // 전체 이벤트 수
    const totalEvents = await db.QuizEvent.count();

    // 활성 이벤트 수
    const activeEvents = await db.QuizEvent.count({
      where: { is_active: true }
    });

    // 전체 문제 수
    const totalQuestions = await db.Question.count();

    // 전체 세션 수
    const totalSessions = await db.QuizSession.count();

    // 완료된 세션 수
    const completedSessions = await db.QuizSession.count({
      where: { status: 'completed' }
    });

    // 참여한 사용자 수
    const participatedUsers = await db.QuizSession.count({
      distinct: true,
      col: 'user_id'
    });

    // 참여율
    const participationRate = totalUsers > 0
      ? Math.round((participatedUsers / totalUsers) * 100)
      : 0;

    // LuckyDraw 당첨자 수
    const luckyDrawWinners = await db.LuckyDraw.count();

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalEvents,
        activeEvents,
        totalQuestions,
        totalSessions,
        completedSessions,
        participatedUsers,
        participationRate,
        luckyDrawWinners
      }
    });

  } catch (error) {
    console.error('전체 통계 조회 에러:', error);
    res.status(500).json({
      error: '통계 조회에 실패했습니다'
    });
  }
};

/**
 * 부서별 통계 조회
 * GET /api/admin/stats/departments?event_id=1
 */
const getDepartmentStats = async (req, res) => {
  try {
    const { event_id } = req.query;

    let whereClause = {};
    if (event_id) {
      whereClause.event_id = event_id;
    }

    // 부서별 참여 통계
    const departments = await db.User.findAll({
      attributes: [
        'department',
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('User.id'))), 'total_users']
      ],
      where: { role: 'user' },
      group: ['department'],
      raw: true
    });

    const departmentStats = await Promise.all(departments.map(async (dept) => {
      // 해당 부서에서 참여한 사용자 수
      const participatedUsers = await db.QuizSession.count({
        distinct: true,
        col: 'user_id',
        where: whereClause,
        include: [{
          model: db.User,
          where: { department: dept.department },
          attributes: []
        }]
      });

      // 완료된 세션 수
      const completedSessions = await db.QuizSession.count({
        where: { ...whereClause, status: 'completed' },
        include: [{
          model: db.User,
          where: { department: dept.department },
          attributes: []
        }]
      });

      // 참여율
      const participationRate = dept.total_users > 0
        ? Math.round((participatedUsers / dept.total_users) * 100)
        : 0;

      return {
        department: dept.department,
        totalUsers: parseInt(dept.total_users),
        participatedUsers,
        completedSessions,
        participationRate
      };
    }));

    // 참여율 순으로 정렬
    departmentStats.sort((a, b) => b.participationRate - a.participationRate);

    res.json({
      success: true,
      departments: departmentStats
    });

  } catch (error) {
    console.error('부서별 통계 조회 에러:', error);
    res.status(500).json({
      error: '부서별 통계 조회에 실패했습니다'
    });
  }
};

/**
 * 문제별 통계 조회
 * GET /api/admin/stats/questions?event_id=1
 */
const getQuestionStats = async (req, res) => {
  try {
    const { event_id } = req.query;

    if (!event_id) {
      return res.status(400).json({
        error: 'event_id가 필요합니다'
      });
    }

    const questions = await db.Question.findAll({
      where: { event_id },
      attributes: ['id', 'question_type', 'category', 'question_text']
    });

    const questionStats = await Promise.all(questions.map(async (question) => {
      // 총 답변 수
      const totalAnswers = await db.QuizAnswer.count({
        where: { question_id: question.id }
      });

      // 정답 수
      const correctAnswers = await db.QuizAnswer.count({
        where: { question_id: question.id, is_correct: true }
      });

      // 첫 시도 정답 수
      const firstTryCorrect = await db.QuizAnswer.count({
        where: {
          question_id: question.id,
          is_correct: true,
          answer_attempt: 1
        }
      });

      // 정답률
      const accuracy = totalAnswers > 0
        ? Math.round((correctAnswers / totalAnswers) * 100)
        : 0;

      // 첫 시도 정답률
      const firstTryAccuracy = totalAnswers > 0
        ? Math.round((firstTryCorrect / totalAnswers) * 100)
        : 0;

      // 평균 시도 횟수
      const avgAttempts = await db.QuizAnswer.findOne({
        where: { question_id: question.id },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('answer_attempt')), 'avg_attempts']
        ],
        raw: true
      });

      return {
        questionId: question.id,
        questionType: question.question_type,
        category: question.category,
        questionText: question.question_text.substring(0, 50) + '...',
        totalAnswers,
        correctAnswers,
        firstTryCorrect,
        accuracy,
        firstTryAccuracy,
        avgAttempts: avgAttempts?.avg_attempts
          ? parseFloat(avgAttempts.avg_attempts).toFixed(2)
          : 0
      };
    }));

    // 정답률 낮은 순으로 정렬 (어려운 문제 우선)
    questionStats.sort((a, b) => a.accuracy - b.accuracy);

    res.json({
      success: true,
      questions: questionStats
    });

  } catch (error) {
    console.error('문제별 통계 조회 에러:', error);
    res.status(500).json({
      error: '문제별 통계 조회에 실패했습니다'
    });
  }
};

/**
 * 사용자 목록 조회
 * GET /api/admin/stats/users?event_id=1
 */
const getUserList = async (req, res) => {
  try {
    const { event_id } = req.query;

    const users = await db.User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'employee_id', 'name', 'department', 'email'],
      order: [['department', 'ASC'], ['name', 'ASC']]
    });

    const userStats = await Promise.all(users.map(async (user) => {
      let whereClause = { user_id: user.id };
      if (event_id) {
        whereClause.event_id = event_id;
      }

      // 완료된 세션 수
      const completedSessions = await db.QuizSession.count({
        where: { ...whereClause, status: 'completed' }
      });

      // 총 답변 수
      const totalAnswers = await db.QuizAnswer.count({
        include: [{
          model: db.QuizSession,
          where: whereClause,
          attributes: []
        }]
      });

      // 정답 수
      const correctAnswers = await db.QuizAnswer.count({
        where: { is_correct: true },
        include: [{
          model: db.QuizSession,
          where: whereClause,
          attributes: []
        }]
      });

      // LuckyDraw 당첨 수
      let luckyDrawCount = 0;
      if (event_id) {
        luckyDrawCount = await db.LuckyDraw.count({
          where: { user_id: user.id, event_id }
        });
      } else {
        luckyDrawCount = await db.LuckyDraw.count({
          where: { user_id: user.id }
        });
      }

      // 정답률
      const accuracy = totalAnswers > 0
        ? Math.round((correctAnswers / totalAnswers) * 100)
        : 0;

      return {
        userId: user.id,
        employeeId: user.employee_id,
        name: user.name,
        department: user.department,
        email: user.email,
        completedSessions,
        totalAnswers,
        correctAnswers,
        accuracy,
        luckyDrawCount
      };
    }));

    res.json({
      success: true,
      users: userStats
    });

  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    res.status(500).json({
      error: '사용자 목록 조회에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * LuckyDraw 관리
 * ==========================================
 */

/**
 * LuckyDraw 추첨
 * POST /api/admin/luckydraw/draw
 */
const drawWinners = async (req, res) => {
  try {
    const { event_id, prize, winner_count } = req.body;

    // 입력 검증
    if (!event_id || !prize || !winner_count) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다'
      });
    }

    // 이벤트 확인
    const event = await db.QuizEvent.findByPk(event_id);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // LuckyDraw 문제를 첫 시도에 맞춘 사용자 조회
    const eligibleUsers = await db.QuizAnswer.findAll({
      attributes: [
        [db.sequelize.fn('DISTINCT', db.sequelize.col('QuizSession.user_id')), 'user_id']
      ],
      include: [
        {
          model: db.QuizSession,
          where: { event_id },
          attributes: [],
          include: [{
            model: db.User,
            attributes: ['id', 'employee_id', 'name', 'department']
          }]
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' },
          attributes: []
        }
      ],
      where: {
        is_correct: true,
        answer_attempt: 1
      },
      raw: false
    });

    if (eligibleUsers.length === 0) {
      return res.status(400).json({
        error: 'LuckyDraw 자격을 가진 사용자가 없습니다'
      });
    }

    // 이미 당첨된 사용자 제외
    const existingWinners = await db.LuckyDraw.findAll({
      where: { event_id, prize },
      attributes: ['user_id']
    });

    const existingWinnerIds = existingWinners.map(w => w.user_id);

    // 중복 제거 및 이미 당첨된 사용자 제외
    const uniqueEligibleUsers = [...new Set(eligibleUsers.map(a => a.QuizSession.user_id))]
      .filter(userId => !existingWinnerIds.includes(userId));

    if (uniqueEligibleUsers.length === 0) {
      return res.status(400).json({
        error: '추첨 가능한 사용자가 없습니다 (모두 이미 당첨됨)'
      });
    }

    // 추첨할 인원 수 조정
    const actualWinnerCount = Math.min(winner_count, uniqueEligibleUsers.length);

    // 랜덤 추첨
    const shuffled = uniqueEligibleUsers.sort(() => Math.random() - 0.5);
    const selectedUserIds = shuffled.slice(0, actualWinnerCount);

    // LuckyDraw 레코드 생성
    const winners = await Promise.all(selectedUserIds.map(async (userId) => {
      const luckyDraw = await db.LuckyDraw.create({
        event_id,
        user_id: userId,
        prize,
        is_claimed: false
      });

      const user = await db.User.findByPk(userId, {
        attributes: ['id', 'employee_id', 'name', 'department', 'email']
      });

      return {
        ...luckyDraw.toJSON(),
        user: user.toJSON()
      };
    }));

    res.json({
      success: true,
      message: `${actualWinnerCount}명의 당첨자가 선정되었습니다`,
      winners
    });

  } catch (error) {
    console.error('LuckyDraw 추첨 에러:', error);
    res.status(500).json({
      error: 'LuckyDraw 추첨에 실패했습니다'
    });
  }
};

/**
 * LuckyDraw 당첨자 목록 조회
 * GET /api/admin/luckydraw/winners?event_id=1
 */
const getWinners = async (req, res) => {
  try {
    const { event_id } = req.query;

    let whereClause = {};
    if (event_id) {
      whereClause.event_id = event_id;
    }

    const winners = await db.LuckyDraw.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          attributes: ['id', 'employee_id', 'name', 'department', 'email']
        },
        {
          model: db.QuizEvent,
          attributes: ['id', 'title', 'year_month']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      winners
    });

  } catch (error) {
    console.error('당첨자 목록 조회 에러:', error);
    res.status(500).json({
      error: '당첨자 목록 조회에 실패했습니다'
    });
  }
};

/**
 * LuckyDraw 수령 처리
 * PUT /api/admin/luckydraw/:id/claim
 */
const claimPrize = async (req, res) => {
  try {
    const { id } = req.params;

    const luckyDraw = await db.LuckyDraw.findByPk(id);
    if (!luckyDraw) {
      return res.status(404).json({
        error: '당첨 내역을 찾을 수 없습니다'
      });
    }

    if (luckyDraw.is_claimed) {
      return res.status(400).json({
        error: '이미 수령 처리된 상품입니다'
      });
    }

    await luckyDraw.update({ is_claimed: true });

    res.json({
      success: true,
      message: '상품 수령 처리되었습니다',
      luckyDraw
    });

  } catch (error) {
    console.error('상품 수령 처리 에러:', error);
    res.status(500).json({
      error: '상품 수령 처리에 실패했습니다'
    });
  }
};

module.exports = {
  // 이벤트 관리
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,

  // 문제 관리
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,

  // 통계
  getOverview,
  getDepartmentStats,
  getQuestionStats,
  getUserList,

  // LuckyDraw
  drawWinners,
  getWinners,
  claimPrize
};
