
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

    // 완료한 세션 수 확인
    const completedCount = await db.QuizSession.count({
      where: {
        user_id: userId,
        event_id,
        status: 'completed'
      }
    });

    // 푼 문제 수 = 완료된 세션 수 × 5
    const totalAnswered = completedCount * 5;

    console.log(`[퀴즈 시작] 사용자 ${userId}, 이벤트 ${event_id}: 완료된 세션 ${completedCount}개 → 이미 푼 문제 ${totalAnswered}개`);

    if (totalAnswered >= 15) {
      return res.status(400).json({
        error: '이미 모든 문제를 완료했습니다 (15문제)'
      });
    }

    // 진행 중인 세션이 있는지 확인
    let session = await db.QuizSession.findOne({
      where: {
        user_id: userId,
        event_id,
        status: 'in_progress'
      }
    });

    // 진행 중인 세션이 있으면 해당 세션 사용, 없으면 새로 생성
    if (session) {
      console.log(`[퀴즈 시작] 진행 중인 세션 발견: ${session.id}, 이어서 진행합니다.`);
    } else {
      session = await db.QuizSession.create({
        user_id: userId,
        event_id,
        session_number: completedCount + 1,
        status: 'in_progress'
      });
      console.log(`[퀴즈 시작] 새 세션 생성: ${session.id}`);
    }

    // 남은 문제 수 = 15 - (완료된 세션 × 5)
    const remainingQuestions = 15 - totalAnswered;

    console.log(`[퀴즈 시작] 완료된 세션: ${completedCount}개, 이미 푼 문제: ${totalAnswered}개, 남은 문제: ${remainingQuestions}개`);

    // 남은 문제가 5개 미만이면 완료 처리
    if (remainingQuestions < 5) {
      // 세션 삭제
      await session.destroy();

      return res.status(400).json({
        error: '남은 문제가 부족합니다. 모든 퀴즈를 완료했습니다!'
      });
    }

    // 첫 번째 문제 가져오기 (동적 선택)
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

    console.log(`[퀴즈 시작] 세션 ${session.id}: 첫 시도 정답 수 = ${firstAttemptCorrectCount}/3 (LuckyDraw 기회: ${firstAttemptCorrectCount === 2})`);

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
        question_data: firstQuestion.question_data
      },
      current_question_number: 1,
      total_questions: 5,
      luckydraw_eligible: firstAttemptCorrectCount === 2
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

    // 현재까지 답변한 문제 수 확인 (고유 question_id 수)
    const answeredCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: { session_id }
    });

    console.log(`[답변 제출] 세션 ${session_id}: 총 답변 수 = ${answeredCount}/5`);

    // 정답을 맞춘 문제 수 확인 (현재 문제 번호 계산용)
    const correctAnswersCount = await db.QuizAnswer.count({
      distinct: true,
      col: 'question_id',
      where: {
        session_id,
        is_correct: true
      }
    });

    console.log(`[답변 제출] 세션 ${session_id}: 정답 맞춘 문제 수 = ${correctAnswersCount}/5`);

    // 다음 문제 가져오기
    let nextQuestion = null;
    let isSessionComplete = false;

    if (answeredCount < 5) {
      nextQuestion = await quizService.getNextQuestion(session_id, session.event_id);

      if (nextQuestion) {
        console.log(`[답변 제출] 다음 문제: Q${nextQuestion.id} (${nextQuestion.category})`);
      } else {
        console.log(`[답변 제출] 다음 문제 없음 - 세션 완료`);
        isSessionComplete = true;
      }
    } else {
      console.log(`[답변 제출] 5개 문제 모두 답변 완료`);
      isSessionComplete = true;
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

    // ✅ LuckyDraw 추첨 로직 (모든 문제에서 추첨 가능)
    // 조건: 정답 + 첫 시도 + 3개 이상 첫 시도 정답 + 세션당 1회만
    // 세션에서 정답을 정확히 3개 맞춘 순간에만 추첨 (세션당 1회)
    if (isCorrect && answer.answer_attempt === 1 && correctAnswersCount === 3) {
      console.log(`[LuckyDraw] 사용자 ${req.user.id} - 3번째 첫 시도 정답! 추첨 시작...`);

      try {
        // 트랜잭션으로 동시성 제어
        const luckyDrawResult = await db.sequelize.transaction(async (t) => {
          // 1. 이벤트 정보 가져오기 (락 설정)
          const event = await db.QuizEvent.findByPk(session.event_id, {
            lock: t.LOCK.UPDATE,
            transaction: t
          });

          if (!event) {
            throw new Error('이벤트를 찾을 수 없습니다');
          }

          // 2. 현재 당첨자 수 확인
          const currentWinnerCount = await db.LuckyDraw.count({
            where: { event_id: session.event_id },
            transaction: t
          });

          console.log(`[LuckyDraw] 현재 당첨자: ${currentWinnerCount}명 / 최대: ${event.max_winners}명`);

          // 3. 이미 당첨자 수가 최대치에 도달했는지 확인
          if (currentWinnerCount >= event.max_winners) {
            console.log(`[LuckyDraw] 당첨자 수 초과 → 꽝`);
            return { won: false, reason: 'max_winners_reached' };
          }

          // 4. 이미 당첨된 사용자인지 확인
          const existingWin = await db.LuckyDraw.findOne({
            where: {
              user_id: req.user.id,
              event_id: session.event_id
            },
            transaction: t
          });

          if (existingWin) {
            console.log(`[LuckyDraw] 이미 당첨된 사용자 → 꽝`);
            return { won: false, reason: 'already_won' };
          }

          // 5. 랜덤 추첨 (50% 확률)
          const won = Math.random() < 0.5;

          if (won) {
            // 당첨!
            await db.LuckyDraw.create({
              event_id: session.event_id,
              user_id: req.user.id,
              prize: '스타벅스 기프티콘',
              is_claimed: false
            }, { transaction: t });

            console.log(`[LuckyDraw] 🎉 당첨! 사용자 ${req.user.id}`);
            return { won: true, prize: '스타벅스 기프티콘' };
          } else {
            console.log(`[LuckyDraw] 꽝... 사용자 ${req.user.id}`);
            return { won: false, reason: 'random' };
          }
        });

        // 추첨 결과를 response에 추가
        response.luckydraw_result = luckyDrawResult;

      } catch (error) {
        console.error('[LuckyDraw] 추첨 중 에러:', error);
        // 에러가 나도 퀴즈는 계속 진행
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
        question_data: nextQuestion.question_data
      };

      response.luckydraw_eligible = updatedCorrectCount === 2;
      console.log(`[답변 제출] 다음 문제 LuckyDraw 기회: ${response.luckydraw_eligible} (첫 시도 정답: ${updatedCorrectCount}/3)`);
    }

    res.json(response);

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

    // 선물 당첨 여부 확인 (이 세션에서 당첨되었는지)
    const wonPrize = await db.LuckyDraw.findOne({
      where: {
        user_id: session.user_id,
        event_id: session.event_id,
        session_id: session_id
      }
    });

    console.log(`[세션 완료] 사용자 ${session.user_id}, 세션 ${session_id}: 선물 당첨 여부 = ${!!wonPrize}`);

    res.json({
      success: true,
      result: {
        session_number: session.session_number,
        total_questions: answers.length,
        correct_count: correctCount,
        incorrect_count: answers.length - correctCount,
        luckydraw_count: luckyDrawAnswers.filter(a => a.is_correct).length,
        won_prize: !!wonPrize,  // 선물 당첨 여부
        prize_name: wonPrize ? wonPrize.prize : null,  // 당첨된 선물 이름
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
