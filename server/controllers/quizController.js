
const db = require('../models');
const quizService = require('../services/quizService');
const { Op } = require('sequelize');

const isDev = process.env.NODE_ENV === 'development';
const log = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => { if (isDev) console.log('[DEBUG]', ...args); }
};

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
    log.error('퀴즈 목록 조회 에러:', error);
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

    // 이벤트 만료 확인 (end_date의 마지막 시간까지 유효)
    const now = new Date();
    const endDate = new Date(event.end_date);
    endDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝으로 설정
    
    if (now > endDate) {
      return res.status(400).json({
        error: '만료된 이벤트입니다'
      });
    }

    // 완료한 세션 수 확인 (회차 계산용)
    const completedCount = await db.QuizSession.count({
      where: {
        user_id: userId,
        event_id,
        status: 'completed'
      }
    });

    // ✅ "푼 문제" 정의: completed 상태 세션에서 정답을 맞춘 문제만 카운트
    //    이전 세션에서 풀었던 문제 ID 목록을 가져와서 중복 방지
    const completedSessions = await db.QuizSession.findAll({
      where: {
        user_id: userId,
        event_id,
        status: 'completed'
      },
      attributes: ['id']
    });

    const completedSessionIds = completedSessions.map(s => s.id);

    // 완료된 세션들에서 답변한 문제 ID 목록 (중복 제거)
    const answeredQuestionIds = completedSessionIds.length > 0
      ? await db.QuizAnswer.findAll({
          where: {
            session_id: { [Op.in]: completedSessionIds }
          },
          attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('question_id')), 'question_id']],
          raw: true
        }).then(results => results.map(r => r.question_id))
      : [];

    const totalAnswered = answeredQuestionIds.length;

    log.debug(`사용자 ${userId} 이벤트 ${event_id}: 완료 세션 ${completedCount}개, 푼 문제 ${totalAnswered}개`);

    // 전체 문제 수 확인
    const totalQuestionsCount = await db.Question.count({
      where: { event_id }
    });

    // 남은 문제 수 계산
    const remainingQuestions = totalQuestionsCount - totalAnswered;

    // 남은 문제가 5개 미만이면 세션 시작 불가
    if (remainingQuestions < 5) {
      return res.status(400).json({
        error: `해당 월의 퀴즈 문제를 모두 풀었습니다!`
      });
    }

    // 진행 중인 세션이 있는지 확인
    const existingSession = await db.QuizSession.findOne({
      where: {
        user_id: userId,
        event_id,
        status: 'in_progress'
      }
    });

    // 진행 중인 세션이 있으면 삭제 (5문제 미완료 세션은 기록하지 않음)
    if (existingSession) {
      log.debug(`이전 진행 중 세션 발견 (ID: ${existingSession.id}) → 삭제 후 새 세션 초기화`);

      // 해당 세션의 모든 답변 삭제
      await db.QuizAnswer.destroy({
        where: { session_id: existingSession.id }
      });

      // 세션 삭제
      await existingSession.destroy();
    }

    // 항상 새로운 세션 생성 (1번 문제부터 시작)
    const session = await db.QuizSession.create({
      user_id: userId,
      event_id,
      session_number: completedCount + 1,
      status: 'in_progress'
    });
    log.info(`새 세션 생성: ${session.id} (회차: ${session.session_number})`);

    // 첫 번째 문제 가져오기 (동적 선택, 이미 푼 문제 제외)
    const firstQuestion = await quizService.getNextQuestion(session.id, event_id);

    if (!firstQuestion) {
      await session.destroy();
      return res.status(400).json({
        error: '선택 가능한 문제가 없습니다'
      });
    }

    // LuckyDraw 기회 체크 (첫 시도 정답 2개면 다음이 3번째 정답 → LuckyDraw 기회)
    const firstAttemptCorrectCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: {
        session_id: session.id,
        is_correct: true,
        answer_attempt: 1
      }
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        session_number: session.session_number,
        event_id: session.event_id
      },
      question: {
        id: firstQuestion.id,
        question_type: firstQuestion.question_type,
        category: firstQuestion.category,
        question_text: firstQuestion.question_text,
        question_data: firstQuestion.question_data,
        is_lucky_draw: firstQuestion.dataValues?.isLuckyDraw || false
      },
      current_question_number: 1,
      total_questions: 5,
      luckydraw_eligible: firstAttemptCorrectCount === 2
    });

  } catch (error) {
    log.error('퀴즈 시작 에러:', error);
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
    const { session_id, question_id, user_answer, time_taken, is_lucky_draw } = req.body;

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
        time_taken,
        is_lucky_draw: is_lucky_draw || false
      });
    }

    // 현재까지 답변한 문제 수 확인 (고유 question_id 수)
    const answeredCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: { session_id }
    });

    // 정답을 맞춘 문제 수 확인 (현재 문제 번호 계산용)
    const correctAnswersCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: {
        session_id,
        is_correct: true
      }
    });

    // 다음 문제 가져오기
    let nextQuestion = null;
    let isSessionComplete = false;

    if (answeredCount < 5) {
      nextQuestion = await quizService.getNextQuestion(session_id, session.event_id);
      if (!nextQuestion) {
        isSessionComplete = true;
      }
    } else {
      isSessionComplete = true;
    }

    // 세션 완료 시 상태 업데이트
    if (isSessionComplete) {
      await session.update({
        status: 'completed',
        completed_at: new Date()
      });
      log.info(`세션 ${session_id} 완료`);
    }

    const response = {
      success: true,
      result: {
        is_correct: isCorrect,
        correct_answer: isCorrect ? null : correctAnswer,
        explanation: question.explanation,
        attempt: answer.answer_attempt
      },
      current_question_number: correctAnswersCount + 1,
      total_questions: 5,
      session_complete: isSessionComplete
    };

    // ✅ LuckyDraw 추첨 로직
    // 조건: LuckyDraw 문제 + 정답 + 첫 시도
    // 클라이언트에서 보낸 is_lucky_draw 플래그를 사용 (동적으로 결정되는 럭키드로우 문제)
    const isLuckyDrawQuestion = is_lucky_draw === true;

    if (isLuckyDrawQuestion && isCorrect && answer.answer_attempt === 1) {
      log.info(`LuckyDraw 추첨 시작: 사용자 ${req.user.id}`);

      try {
        // 트랜잭션으로 동시성 제어 (SERIALIZABLE 격리 수준)
        const luckyDrawResult = await db.sequelize.transaction({
          isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (t) => {
          // 1. 이벤트 정보 가져오기 (락 설정) - 먼저 락을 획득하여 동시성 보장
          const event = await db.QuizEvent.findByPk(session.event_id, {
            lock: t.LOCK.UPDATE,
            transaction: t
          });

          if (!event) {
            throw new Error('이벤트를 찾을 수 없습니다');
          }

          // 2. 현재 당첨자 수 확인 (락이 걸린 상태에서 카운트)
          const currentWinnerCount = await db.LuckyDraw.count({
            where: { event_id: session.event_id },
            transaction: t
          });

          // 3. 이미 당첨자 수가 최대치에 도달했는지 확인
          const maxWinnersReached = currentWinnerCount >= event.max_winners;

          // 4. 이미 당첨된 사용자인지 확인 (이벤트 전체 기준)
          const existingWin = await db.LuckyDraw.findOne({
            where: {
              user_id: req.user.id,
              event_id: session.event_id
            },
            transaction: t
          });

          if (existingWin) {
            return { won: false, reason: 'already_won' };
          }

          // 5. 랜덤 추첨 (50% 확률) - 단, 당첨자 수가 초과된 경우 무조건 꽝
          const won = !maxWinnersReached && Math.random() < 0.5;

          if (won) {
            // 당첨!
            await db.LuckyDraw.create({
              event_id: session.event_id,
              user_id: req.user.id,
              prize: '스타벅스 기프티콘',
              is_claimed: false
            }, { transaction: t });

            // 세션에 당첨 여부 기록
            await session.update({
              won_prize_this_session: true
            }, { transaction: t });

            log.info(`🎉 LuckyDraw 당첨: 사용자 ${req.user.id}`);
            return { won: true, prize: '스타벅스 기프티콘' };
          } else {
            const reason = maxWinnersReached ? 'max_winners_reached' : 'random';
            return { won: false, reason };
          }
        });

        // 추첨 결과를 response에 추가
        response.luckydraw_result = luckyDrawResult;

      } catch (error) {
        log.error('LuckyDraw 추첨 에러:', error);

        // SQLite BUSY 에러인 경우 재시도 안내
        if (error.name === 'SequelizeDatabaseError' && error.message.includes('SQLITE_BUSY')) {
          log.warn('데이터베이스 경합 발생 - 동시 당첨 처리 중');
        }

        // 에러가 나도 퀴즈는 계속 진행
        response.luckydraw_result = { won: false, reason: 'error' };
      }
    }

    // 다음 문제가 있으면 추가
    if (nextQuestion) {
      // LuckyDraw 기회 체크 (현재 답변 후 첫 시도 정답이 2개면 다음 정답에서 LuckyDraw)
      const updatedCorrectCount = await db.QuizAnswer.count({
        distinct: true,
        col: 'question_id',
        where: {
          session_id,
          is_correct: true,
          answer_attempt: 1
        }
      });

      response.next_question = {
        id: nextQuestion.id,
        question_type: nextQuestion.question_type,
        category: nextQuestion.category,
        question_text: nextQuestion.question_text,
        question_data: nextQuestion.question_data,
        is_lucky_draw: nextQuestion.dataValues?.isLuckyDraw || false
      };

      response.luckydraw_eligible = updatedCorrectCount === 2;
    }

    res.json(response);

  } catch (error) {
    log.error('답변 제출 에러:', error);
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

    // 결과 조회
    const answers = await db.QuizAnswer.findAll({
      where: { session_id },
      include: [{
        model: db.Question,
        attributes: ['id', 'question_type', 'category', 'question_text', 'summary', 'highlight']
      }]
    });

    // ✅ 중요: 5개 문제를 모두 풀었을 때만 DB에 저장 (완료 처리)
    const answeredCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: { session_id }
    });

    if (answeredCount < 5) {
      log.warn(`세션 ${session_id} 미완료: ${answeredCount}/5 문제 - 세션 삭제`);

      // 세션과 답변 모두 삭제
      await db.QuizAnswer.destroy({ where: { session_id } });
      await session.destroy();

      return res.status(400).json({
        error: '모든 문제를 풀어야 결과를 저장할 수 있습니다',
        answered: answeredCount,
        required: 5
      });
    }

    // 세션 완료 처리
    await session.update({
      status: 'completed',
      completed_at: new Date()
    });

    const correctCount = answers.filter(a => a.is_correct).length;
    const luckyDrawAnswers = answers.filter(a => a.Question.category === 'luckydraw');

    // 이번 세션에서 선물 당첨 여부 확인 (세션 레벨, NOT 이벤트 레벨)
    const wonPrizeThisSession = session.won_prize_this_session;

    // 당첨된 경우 선물 정보 조회
    let prizeName = null;
    if (wonPrizeThisSession) {
      const luckyDrawRecord = await db.LuckyDraw.findOne({
        where: {
          user_id: session.user_id,
          event_id: session.event_id
        }
      });
      prizeName = luckyDrawRecord ? luckyDrawRecord.prize : null;
    }

    const result = {
      success: true,
      result: {
        session_number: session.session_number,
        total_questions: answers.length,
        correct_count: correctCount,
        incorrect_count: answers.length - correctCount,
        luckydraw_count: luckyDrawAnswers.filter(a => a.is_correct).length,
        won_prize: wonPrizeThisSession,  // 이번 세션에서 선물 당첨 여부
        prize_name: prizeName,  // 당첨된 선물 이름
        answers: answers.map(a => ({
          question_id: a.question_id,
          question_type: a.Question.question_type,
          question_text: a.Question.question_text,
          is_correct: a.is_correct,
          attempt: a.answer_attempt,
          summary: a.Question.summary || null,
          highlight: a.Question.highlight || null
        }))
      }
    };

    log.info(`세션 완료: ${session_id}, 정답 ${correctCount}/${answers.length}, 당첨 ${wonPrizeThisSession}`);
    res.json(result);

  } catch (error) {
    log.error('세션 완료 에러:', error);
    res.status(500).json({
      error: '세션 완료 처리에 실패했습니다',
      details: error.message
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
    log.error('세션 목록 조회 에러:', error);
    res.status(500).json({
      error: '세션 목록 조회에 실패했습니다'
    });
  }
};

/**
 * 세션 취소/중단
 * POST /api/quiz/cancel
 */
const cancelSession = async (req, res) => {
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

    // 진행 중인 세션만 취소 가능
    if (session.status !== 'in_progress') {
      return res.status(400).json({
        error: '이미 완료된 세션은 취소할 수 없습니다'
      });
    }

    // 관련 답변 모두 삭제
    await db.QuizAnswer.destroy({ where: { session_id } });

    // 세션 삭제
    await session.destroy();

    log.info(`세션 취소: ${session_id}`);

    res.json({
      success: true,
      message: '세션이 취소되었습니다'
    });

  } catch (error) {
    log.error('세션 취소 에러:', error);
    res.status(500).json({
      error: '세션 취소에 실패했습니다'
    });
  }
};

module.exports = {
  getQuizList,
  startQuizSession,
  submitAnswer,
  completeSession,
  getMySessions,
  cancelSession
};
