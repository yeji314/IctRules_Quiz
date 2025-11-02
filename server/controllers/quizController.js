const db = require('../models');
const quizService = require('../services/quizService');
const { Op } = require('sequelize');

/**
 * 퀴즈 목록 조회
 * GET /api/quiz/list
 */
const getQuizList = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizList = await quizService.getQuizListForUser(userId);

    res.json({
      success: true,
      quizList
    });

  } catch (error) {
    console.error('퀴즈 목록 조회 에러:', error);
    res.status(500).json({
      error: '퀴즈 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 퀴즈 세션 시작
 * POST /api/quiz/start
 */
const startQuizSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({
        error: '이벤트 ID가 필요합니다'
      });
    }

    // 이벤트 확인
    const event = await db.QuizEvent.findByPk(event_id);
    if (!event || !event.is_active) {
      return res.status(404).json({
        error: '유효하지 않은 이벤트입니다'
      });
    }

    // 이미 완료한 세션 수 확인
    const completedCount = await db.QuizSession.count({
      where: {
        user_id: userId,
        event_id,
        status: 'completed'
      }
    });

    if (completedCount >= 3) {
      return res.status(400).json({
        error: '이미 모든 회차를 완료했습니다'
      });
    }

    // 새 세션 생성
    const session = await db.QuizSession.create({
      user_id: userId,
      event_id,
      session_number: completedCount + 1,
      status: 'in_progress'
    });

    // 이미 푼 문제 ID 조회
    const previousAnswers = await db.QuizAnswer.findAll({
      include: [{
        model: db.QuizSession,
        where: {
          user_id: userId,
          event_id
        }
      }],
      attributes: ['question_id']
    });

    const excludeQuestionIds = previousAnswers.map(a => a.question_id);

    // 랜덤으로 5개 문제 선택
    const questions = await quizService.getRandomQuestions(
      session.id,
      event_id,
      excludeQuestionIds
    );

    if (questions.length < 5) {
      return res.status(400).json({
        error: '선택 가능한 문제가 부족합니다'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        session_number: session.session_number,
        event_id: session.event_id
      },
      questions: questions.map(q => ({
        id: q.id,
        question_type: q.question_type,
        category: q.category,
        question_text: q.question_text,
        question_data: q.question_data
      }))
    });

  } catch (error) {
    console.error('퀴즈 시작 에러:', error);
    res.status(500).json({
      error: '퀴즈 시작에 실패했습니다'
    });
  }
};

/**
 * 답변 제출
 * POST /api/quiz/answer
 */
const submitAnswer = async (req, res) => {
  try {
    const { session_id, question_id, user_answer, time_taken } = req.body;

    if (!session_id || !question_id || user_answer === undefined) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다'
      });
    }

    // 세션 확인
    const session = await db.QuizSession.findByPk(session_id);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        error: '유효하지 않은 세션입니다'
      });
    }

    // 문제 확인
    const question = await db.Question.findByPk(question_id);
    if (!question) {
      return res.status(404).json({
        error: '문제를 찾을 수 없습니다'
      });
    }

    // 이미 답변했는지 확인
    const existingAnswer = await db.QuizAnswer.findOne({
      where: { session_id, question_id }
    });

    // 정답 확인
    let isCorrect = false;
    const correctAnswer = question.question_data.correct_answer;

    if (question.question_type === 'typing') {
      // 타이핑: 완전 일치
      isCorrect = user_answer.trim() === correctAnswer.trim();
    } else {
      // 나머지: 일반 비교
      isCorrect = user_answer === correctAnswer;
    }

    let answer;
    if (existingAnswer) {
      // 재시도
      answer = await existingAnswer.update({
        user_answer,
        is_correct: isCorrect,
        answer_attempt: existingAnswer.answer_attempt + 1,
        time_taken
      });
    } else {
      // 첫 시도
      answer = await db.QuizAnswer.create({
        session_id,
        question_id,
        user_answer,
        is_correct: isCorrect,
        answer_attempt: 1,
        time_taken
      });
    }

    res.json({
      success: true,
      result: {
        is_correct: isCorrect,
        correct_answer: isCorrect ? null : correctAnswer,
        explanation: question.explanation,
        attempt: answer.answer_attempt
      }
    });

  } catch (error) {
    console.error('답변 제출 에러:', error);
    res.status(500).json({
      error: '답변 제출에 실패했습니다'
    });
  }
};

/**
 * 세션 완료
 * POST /api/quiz/complete
 */
const completeSession = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        error: '세션 ID가 필요합니다'
      });
    }

    // 세션 확인
    const session = await db.QuizSession.findByPk(session_id);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        error: '유효하지 않은 세션입니다'
      });
    }

    // 세션 완료 처리
    await session.update({
      status: 'completed',
      completed_at: new Date()
    });

    // 결과 조회
    const answers = await db.QuizAnswer.findAll({
      where: { session_id },
      include: [{
        model: db.Question,
        attributes: ['id', 'question_type', 'category', 'question_text']
      }]
    });

    const correctCount = answers.filter(a => a.is_correct).length;
    const luckyDrawAnswers = answers.filter(a => a.Question.category === 'luckydraw');

    res.json({
      success: true,
      result: {
        session_number: session.session_number,
        total_questions: answers.length,
        correct_count: correctCount,
        incorrect_count: answers.length - correctCount,
        luckydraw_count: luckyDrawAnswers.filter(a => a.is_correct).length,
        answers: answers.map(a => ({
          question_id: a.question_id,
          question_type: a.Question.question_type,
          is_correct: a.is_correct,
          attempt: a.answer_attempt
        }))
      }
    });

  } catch (error) {
    console.error('세션 완료 에러:', error);
    res.status(500).json({
      error: '세션 완료 처리에 실패했습니다'
    });
  }
};

/**
 * 내 세션 목록 조회
 * GET /api/quiz/my-sessions
 */
const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_id } = req.query;

    const where = { user_id: userId };
    if (event_id) {
      where.event_id = event_id;
    }

    const sessions = await db.QuizSession.findAll({
      where,
      include: [{
        model: db.QuizEvent,
        attributes: ['id', 'title', 'year_month']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('세션 목록 조회 에러:', error);
    res.status(500).json({
      error: '세션 목록 조회에 실패했습니다'
    });
  }
};

module.exports = {
  getQuizList,
  startQuizSession,
  submitAnswer,
  completeSession,
  getMySessions
};
