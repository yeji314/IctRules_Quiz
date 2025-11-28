const db = require('../models');
const { Op } = require('sequelize');

const isDev = process.env.NODE_ENV === 'development';
const log = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => { if (isDev) console.log('[DEBUG]', ...args); }
};

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
    log.error('이벤트 목록 조회 에러:', error);
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
    const { title, year_month, start_date, end_date, max_winners, is_active } = req.body;

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
      max_winners: max_winners || 10,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      event
    });

  } catch (error) {
    log.error('이벤트 생성 에러:', error);
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
    const { title, year_month, start_date, end_date, max_winners, is_active } = req.body;

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
      max_winners: max_winners !== undefined ? max_winners : event.max_winners,
      is_active: is_active !== undefined ? is_active : event.is_active
    });

    res.json({
      success: true,
      event
    });

  } catch (error) {
    log.error('이벤트 수정 에러:', error);
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
    log.error('이벤트 삭제 에러:', error);
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

      const questionData = question.toJSON();

      // summary와 highlight 필드 확인 (디버깅)
      log.debug(`Question ID: ${question.id}, Summary: ${questionData.summary}, Highlight: ${questionData.highlight}`);

      return {
        ...questionData,
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
    log.error('문제 목록 조회 에러:', error);
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
      explanation,
      summary,
      highlight
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

    // 문제 타입 검증 (데이터베이스 모델과 일치)
    const validTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'];
    if (!validTypes.includes(question_type)) {
      return res.status(400).json({
        error: `유효하지 않은 문제 타입입니다: ${question_type}. 허용된 타입: ${validTypes.join(', ')}`
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
      explanation,
      summary,
      highlight
    });

    res.status(201).json({
      success: true,
      question
    });

  } catch (error) {
    log.error('문제 생성 에러:', error);
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
      explanation,
      summary,
      highlight
    } = req.body;

    const question = await db.Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        error: '문제를 찾을 수 없습니다'
      });
    }

    // 문제 타입 검증 (데이터베이스 모델과 일치)
    if (question_type) {
      const validTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'];
      if (!validTypes.includes(question_type)) {
        return res.status(400).json({
          error: `유효하지 않은 문제 타입입니다: ${question_type}. 허용된 타입: ${validTypes.join(', ')}`
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
      explanation: explanation !== undefined ? explanation : question.explanation,
      summary: summary !== undefined ? summary : question.summary,
      highlight: highlight !== undefined ? highlight : question.highlight
    });

    res.json({
      success: true,
      question
    });

  } catch (error) {
    log.error('문제 수정 에러:', error);
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
    log.error('문제 삭제 에러:', error);
    res.status(500).json({
      error: '문제 삭제에 실패했습니다'
    });
  }
};

/**
 * 이벤트의 문제 전체 삭제
 * DELETE /api/admin/events/:eventId/questions
 */
const deleteAllQuestions = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 이벤트 확인
    const event = await db.QuizEvent.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // 해당 이벤트의 문제 수 확인
    const questionCount = await db.Question.count({
      where: { event_id: eventId }
    });

    if (questionCount === 0) {
      return res.status(400).json({
        error: '삭제할 문제가 없습니다'
      });
    }

    // 전체 문제 삭제
    await db.Question.destroy({
      where: { event_id: eventId }
    });

    res.json({
      success: true,
      message: `${questionCount}개의 문제가 삭제되었습니다`,
      deleted_count: questionCount
    });

  } catch (error) {
    log.error('문제 전체 삭제 에러:', error);
    res.status(500).json({
      error: '문제 전체 삭제에 실패했습니다'
    });
  }
};

/**
 * 문제 대량 업로드 (Excel)
 * POST /api/admin/questions/bulk-upload
 */
const bulkUploadQuestions = async (req, res) => {
  try {
    const { event_id, questions } = req.body;

    // 입력 검증
    if (!event_id || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: '필수 정보가 누락되었거나 문제 데이터가 없습니다'
      });
    }

    // 이벤트 확인
    const event = await db.QuizEvent.findByPk(event_id);
    if (!event) {
      return res.status(404).json({
        error: '이벤트를 찾을 수 없습니다'
      });
    }

    // 문제 타입 검증 (데이터베이스 모델과 일치)
    const validTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'];
    const validCategories = ['normal', 'luckydraw'];

    const results = {
      success: [],
      errors: []
    };

    // 각 문제 처리
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNum = i + 2; // Excel row number (assuming header at row 1)

      try {
        // 필수 필드 검증
        if (!q.question_type || !q.category || !q.question_text || !q.question_data) {
          results.errors.push({
            row: rowNum,
            error: '필수 정보가 누락되었습니다',
            data: q
          });
          continue;
        }

        // 문제 타입 검증
        if (!validTypes.includes(q.question_type)) {
          results.errors.push({
            row: rowNum,
            error: `유효하지 않은 문제 타입: ${q.question_type}`,
            data: q
          });
          continue;
        }

        // 카테고리 검증
        if (!validCategories.includes(q.category)) {
          results.errors.push({
            row: rowNum,
            error: `유효하지 않은 카테고리: ${q.category}`,
            data: q
          });
          continue;
        }

        // question_data 파싱 (문자열인 경우)
        let questionData = q.question_data;
        if (typeof questionData === 'string') {
          try {
            questionData = JSON.parse(questionData);
          } catch (e) {
            results.errors.push({
              row: rowNum,
              error: 'question_data JSON 형식이 올바르지 않습니다',
              data: q
            });
            continue;
          }
        }

        // correct_answer 검증
        if (!questionData.correct_answer) {
          results.errors.push({
            row: rowNum,
            error: 'question_data에 correct_answer가 필요합니다',
            data: q
          });
          continue;
        }

        // 문제 생성
        const question = await db.Question.create({
          event_id,
          question_type: q.question_type,
          category: q.category,
          question_text: q.question_text,
          question_data: questionData,
          explanation: q.explanation || null,
          summary: q.summary || null,
          highlight: q.highlight || null
        });

        results.success.push({
          row: rowNum,
          question_id: question.id,
          question_text: q.question_text
        });

      } catch (error) {
        results.errors.push({
          row: rowNum,
          error: error.message,
          data: q
        });
      }
    }

    res.json({
      success: true,
      message: `${results.success.length}개 문제 생성 완료, ${results.errors.length}개 실패`,
      results
    });

  } catch (error) {
    log.error('문제 대량 업로드 에러:', error);
    res.status(500).json({
      error: '문제 대량 업로드에 실패했습니다'
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
    log.error('전체 통계 조회 에러:', error);
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

    // Department 테이블에서 부서 목록 가져오기
    const departments = await db.Department.findAll({
      order: [['name', 'ASC']]
    });

    const departmentStats = await Promise.all(departments.map(async (dept) => {
      // 해당 부서에서 참여한 사용자 수
      const participatedUsers = await db.QuizSession.count({
        distinct: true,
        col: 'user_id',
        where: whereClause,
        include: [{
          model: db.User,
          where: { department: dept.name, role: 'user' },
          attributes: []
        }]
      });

      // 완료된 세션 수
      const completedSessions = await db.QuizSession.count({
        where: { ...whereClause, status: 'completed' },
        include: [{
          model: db.User,
          where: { department: dept.name, role: 'user' },
          attributes: []
        }]
      });

      // 참여율 (Department 테이블의 total_members 사용)
      const participationRate = dept.total_members > 0
        ? Math.round((participatedUsers / dept.total_members) * 100)
        : 0;

      return {
        department: dept.name,
        total: dept.total_members,
        participated: participatedUsers,
        completedSessions,
        participation_rate: participationRate
      };
    }));

    // 참여율 순으로 정렬
    departmentStats.sort((a, b) => b.participation_rate - a.participation_rate);

    res.json({
      success: true,
      departments: departmentStats
    });

  } catch (error) {
    log.error('부서별 통계 조회 에러:', error);
    res.status(500).json({
      error: '부서별 통계 조회에 실패했습니다'
    });
  }
};

/**
 * 부서원 목록 조회 (참여 여부 포함)
 * GET /api/admin/stats/departments/:departmentName/participants?event_id=1
 */
const getDepartmentParticipants = async (req, res) => {
  try {
    const { departmentName } = req.params;
    const { event_id } = req.query;

    // 해당 부서의 모든 사용자 조회
    const users = await db.User.findAll({
      where: { 
        department: departmentName,
        role: 'user'
      },
      attributes: ['id', 'name', 'employee_id', 'department'],
      order: [['name', 'ASC']]
    });

    // 각 사용자의 참여 정보 조회
    const participants = await Promise.all(users.map(async (user) => {
      let whereClause = { user_id: user.id };
      if (event_id) {
        whereClause.event_id = event_id;
      }

      // 참여 여부 확인 (세션이 있으면 참여)
      const sessionCount = await db.QuizSession.count({
        where: whereClause
      });

      // 완료한 문제 수 (정답 맞춘 문제 수)
      let completedQuestions = 0;
      if (sessionCount > 0) {
        completedQuestions = await db.QuizAnswer.count({
          distinct: true,
          col: 'question_id',
          where: { is_correct: true },
          include: [{
            model: db.QuizSession,
            where: whereClause,
            attributes: []
          }]
        });
      }

      return {
        id: user.id,
        name: user.name,
        employee_id: user.employee_id,
        participated: sessionCount > 0,
        completed_questions: completedQuestions
      };
    }));

    // 참여한 사용자를 먼저 표시
    participants.sort((a, b) => {
      if (a.participated && !b.participated) return -1;
      if (!a.participated && b.participated) return 1;
      return b.completed_questions - a.completed_questions;
    });

    res.json({
      success: true,
      department: departmentName,
      participants
    });

  } catch (error) {
    log.error('부서원 목록 조회 에러:', error);
    res.status(500).json({
      error: '부서원 목록 조회에 실패했습니다'
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
    log.error('문제별 통계 조회 에러:', error);
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
    log.error('사용자 목록 조회 에러:', error);
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
    log.error('LuckyDraw 추첨 에러:', error);
    res.status(500).json({
      error: 'LuckyDraw 추첨에 실패했습니다'
    });
  }
};

/**
 * LuckyDraw 당첨자 목록 조회
 * GET /api/admin/luckydraw/winners?event_id=1&year_month=2025-01
 */
const getWinners = async (req, res) => {
  try {
    const { event_id, year_month } = req.query;

    let whereClause = {};
    let includeClause = [
      {
        model: db.User,
        attributes: ['id', 'employee_id', 'name', 'department', 'email']
      },
      {
        model: db.QuizEvent,
        attributes: ['id', 'title', 'year_month'],
        where: {}
      }
    ];

    // event_id 필터
    if (event_id) {
      whereClause.event_id = event_id;
    }

    // year_month 필터 (예: 2025-01)
    if (year_month) {
      includeClause[1].where.year_month = year_month;
    }

    const winners = await db.LuckyDraw.findAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']]
    });

    // 날짜 정보를 명시적으로 포맷팅하여 응답
    const winnersWithFormattedDates = winners.map(winner => {
      const winnerData = winner.toJSON();
      return {
        ...winnerData,
        won_date: winnerData.createdAt, // 당첨 날짜 (Sequelize camelCase)
        claimed_date: winnerData.claimedAt // 수령 날짜 (Sequelize camelCase)
      };
    });

    res.json({
      success: true,
      winners: winnersWithFormattedDates
    });

  } catch (error) {
    log.error('당첨자 목록 조회 에러:', error);
    res.status(500).json({
      error: '당첨자 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 퀴즈별 LuckyDraw 현황 조회
 * GET /api/admin/luckydraw/stats-by-event
 */
const getLuckyDrawStatsByEvent = async (req, res) => {
  try {
    const events = await db.QuizEvent.findAll({
      order: [['year_month', 'DESC']]
    });

    const stats = await Promise.all(events.map(async (event) => {
      // 해당 이벤트의 총 당첨자 수
      const totalWinners = await db.LuckyDraw.count({
        where: { event_id: event.id }
      });

      // 수령 완료 수
      const claimedCount = await db.LuckyDraw.count({
        where: { event_id: event.id, is_claimed: true }
      });

      // 수령 대기 수
      const pendingCount = totalWinners - claimedCount;

      // 최대 당첨자 수
      const maxWinners = event.max_winners || 10;

      // 남은 당첨 기회
      const remainingSlots = Math.max(0, maxWinners - totalWinners);

      // 당첨자 목록
      const winners = await db.LuckyDraw.findAll({
        where: { event_id: event.id },
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'department', 'employee_id']
        }],
        order: [['created_at', 'DESC']]
      });

      return {
        event_id: event.id,
        event_title: event.title,
        year_month: event.year_month,
        max_winners: maxWinners,
        total_winners: totalWinners,
        claimed_count: claimedCount,
        pending_count: pendingCount,
        remaining_slots: remainingSlots,
        winners: winners.map(w => ({
          id: w.id,
          user_name: w.User.name,
          user_department: w.User.department,
          user_employee_id: w.User.employee_id,
          prize: w.prize,
          is_claimed: w.is_claimed,
          won_date: w.created_at
        }))
      };
    }));

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    log.error('퀴즈별 LuckyDraw 현황 조회 에러:', error);
    res.status(500).json({
      error: '퀴즈별 LuckyDraw 현황 조회에 실패했습니다'
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
    log.error('상품 수령 처리 에러:', error);
    res.status(500).json({
      error: '상품 수령 처리에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * 부서 관리
 * ==========================================
 */

/**
 * 부서 목록 조회
 * GET /api/admin/departments
 */
const listDepartments = async (req, res) => {
  try {
    const departments = await db.Department.findAll({
      order: [['name', 'ASC']]
    });

    // 각 부서별 실제 참여자 수 추가
    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
      const actualUsers = await db.User.count({
        where: { department: dept.name, role: 'user' }
      });

      return {
        ...dept.toJSON(),
        actual_users: actualUsers
      };
    }));

    res.json({
      success: true,
      departments: departmentsWithStats
    });

  } catch (error) {
    log.error('부서 목록 조회 에러:', error);
    res.status(500).json({
      error: '부서 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 부서 생성
 * POST /api/admin/departments
 */
const createDepartment = async (req, res) => {
  try {
    const { name, total_members, description } = req.body;

    if (!name || !total_members) {
      return res.status(400).json({
        error: '부서명과 총 인원이 필요합니다'
      });
    }

    // 중복 확인
    const existing = await db.Department.findOne({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        error: '이미 존재하는 부서명입니다'
      });
    }

    const department = await db.Department.create({
      name,
      total_members,
      description
    });

    res.status(201).json({
      success: true,
      department
    });

  } catch (error) {
    log.error('부서 생성 에러:', error);
    res.status(500).json({
      error: '부서 생성에 실패했습니다'
    });
  }
};

/**
 * 부서 수정
 * PUT /api/admin/departments/:id
 */
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, total_members, description } = req.body;

    const department = await db.Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        error: '부서를 찾을 수 없습니다'
      });
    }

    // 이름이 변경되는 경우 중복 확인
    if (name && name !== department.name) {
      const existing = await db.Department.findOne({
        where: { name, id: { [Op.ne]: id } }
      });

      if (existing) {
        return res.status(400).json({
          error: '이미 존재하는 부서명입니다'
        });
      }
    }

    await department.update({
      name: name || department.name,
      total_members: total_members !== undefined ? total_members : department.total_members,
      description: description !== undefined ? description : department.description
    });

    res.json({
      success: true,
      department
    });

  } catch (error) {
    log.error('부서 수정 에러:', error);
    res.status(500).json({
      error: '부서 수정에 실패했습니다'
    });
  }
};

/**
 * 부서 삭제
 * DELETE /api/admin/departments/:id
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        error: '부서를 찾을 수 없습니다'
      });
    }

    // 해당 부서에 속한 사용자가 있는지 확인
    const userCount = await db.User.count({
      where: { department: department.name }
    });

    if (userCount > 0) {
      return res.status(400).json({
        error: '해당 부서에 속한 사용자가 있어 삭제할 수 없습니다'
      });
    }

    await department.destroy();

    res.json({
      success: true,
      message: '부서가 삭제되었습니다'
    });

  } catch (error) {
    log.error('부서 삭제 에러:', error);
    res.status(500).json({
      error: '부서 삭제에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * SSO 설정 관리
 * ==========================================
 */

/**
 * GET /api/admin/sso/settings
 * SSO 설정 전체 조회
 */
const getSsoSettings = async (req, res) => {
  try {
    const { category } = req.query;

    let settings;
    if (category) {
      settings = await db.SSOSettings.findAll({
        where: { category },
        order: [['setting_key', 'ASC']]
      });
    } else {
      settings = await db.SSOSettings.findAll({
        order: [['category', 'ASC'], ['setting_key', 'ASC']]
      });
    }

    // 민감한 정보는 숨김 처리
    const sanitizedSettings = settings.map(setting => setting.toJSON());

    res.json({
      success: true,
      settings: sanitizedSettings
    });

  } catch (error) {
    log.error('SSO 설정 조회 에러:', error);
    res.status(500).json({
      error: 'SSO 설정 조회에 실패했습니다'
    });
  }
};

/**
 * GET /api/admin/sso/settings/:key
 * 특정 SSO 설정 조회
 */
const getSsoSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await db.SSOSettings.findOne({
      where: { setting_key: key }
    });

    if (!setting) {
      return res.status(404).json({
        error: '설정을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      setting: setting.toJSON()
    });

  } catch (error) {
    log.error('SSO 설정 조회 에러:', error);
    res.status(500).json({
      error: 'SSO 설정 조회에 실패했습니다'
    });
  }
};

/**
 * PUT /api/admin/sso/settings/:key
 * SSO 설정 업데이트
 */
const updateSsoSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'value 필드가 필요합니다'
      });
    }

    const setting = await db.SSOSettings.findOne({
      where: { setting_key: key }
    });

    if (!setting) {
      return res.status(404).json({
        error: '설정을 찾을 수 없습니다'
      });
    }

    if (!setting.is_editable) {
      return res.status(403).json({
        error: '이 설정은 수정할 수 없습니다'
      });
    }

    setting.setValue(value);
    await setting.save();

    res.json({
      success: true,
      message: '설정이 업데이트되었습니다',
      setting: setting.toJSON()
    });

  } catch (error) {
    log.error('SSO 설정 업데이트 에러:', error);
    res.status(500).json({
      error: 'SSO 설정 업데이트에 실패했습니다'
    });
  }
};

/**
 * ==========================================
 * 관리자 행번 관리
 * ==========================================
 */

/**
 * 관리자 행번 목록 조회
 * GET /api/admin/admin-employees
 */
const listAdminEmployees = async (req, res) => {
  try {
    const admins = await db.AdminEmployee.findAll({
      order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
    });

    res.json({
      success: true,
      admins
    });

  } catch (error) {
    log.error('관리자 목록 조회 에러:', error);
    res.status(500).json({
      error: '관리자 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 관리자 행번 추가
 * POST /api/admin/admin-employees
 */
const addAdminEmployee = async (req, res) => {
  try {
    const { employee_id, name } = req.body;
    const added_by = req.user?.employee_id || 'unknown';

    if (!employee_id) {
      return res.status(400).json({
        error: '행번이 필요합니다'
      });
    }

    // 중복 확인
    const existing = await db.AdminEmployee.findOne({
      where: { employee_id }
    });

    if (existing) {
      return res.status(400).json({
        error: '이미 등록된 관리자 행번입니다'
      });
    }

    const admin = await db.AdminEmployee.create({
      employee_id,
      name: name || null,
      added_by,
      is_primary: false
    });

    res.status(201).json({
      success: true,
      admin
    });

  } catch (error) {
    log.error('관리자 추가 에러:', error);
    res.status(500).json({
      error: '관리자 추가에 실패했습니다'
    });
  }
};

/**
 * 관리자 행번 삭제
 * DELETE /api/admin/admin-employees/:id
 */
const deleteAdminEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await db.AdminEmployee.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        error: '관리자를 찾을 수 없습니다'
      });
    }

    // 기본 관리자는 삭제 불가
    if (admin.is_primary) {
      return res.status(400).json({
        error: '기본 관리자는 삭제할 수 없습니다'
      });
    }

    await admin.destroy();

    res.json({
      success: true,
      message: '관리자가 삭제되었습니다'
    });

  } catch (error) {
    log.error('관리자 삭제 에러:', error);
    res.status(500).json({
      error: '관리자 삭제에 실패했습니다'
    });
  }
};

/**
 * GET /api/admin/sso/status
 * SSO 시스템 상태 확인
 */
const getSsoStatus = async (req, res) => {
  try {
    // 통계
    const totalUsers = await db.User.count();
    const ssoUsers = await db.User.count({
      where: { login_method: 'swing_sso' }
    });
    const localUsers = await db.User.count({
      where: { login_method: 'local' }
    });

    res.json({
      success: true,
      status: {
        enabled: true,
        environment: process.env.SWING_ENV || 'mock',
        api_healthy: true
      },
      statistics: {
        total_users: totalUsers,
        sso_users: ssoUsers,
        local_users: localUsers
      }
    });

  } catch (error) {
    log.error('SSO 상태 조회 에러:', error);
    res.status(500).json({
      error: 'SSO 상태 조회에 실패했습니다'
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
  deleteAllQuestions,
  bulkUploadQuestions,

  // 통계
  getOverview,
  getDepartmentStats,
  getDepartmentParticipants,
  getQuestionStats,
  getUserList,

  // LuckyDraw
  drawWinners,
  getWinners,
  getLuckyDrawStatsByEvent,
  claimPrize,

  // 부서 관리
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  // SSO 설정 관리
  getSsoSettings,
  getSsoSetting,
  updateSsoSetting,
  getSsoStatus,

  // 관리자 행번 관리
  listAdminEmployees,
  addAdminEmployee,
  deleteAdminEmployee
};
