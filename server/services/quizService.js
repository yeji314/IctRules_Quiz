const { Op } = require('sequelize');
const db = require('../models');

class QuizService {
  /**
   * 랜덤으로 5개 문제 선택 (LuckyDraw 조건 포함)
   */
  async getRandomQuestions(sessionId, eventId, excludeQuestionIds = []) {
    // 현재 세션 정보 가져오기 (user_id 필요)
    const currentSession = await db.QuizSession.findByPk(sessionId);
    if (!currentSession) {
      throw new Error('세션을 찾을 수 없습니다');
    }

    // 해당 이벤트에서 첫 시도에 맞춘 문제 수 확인 (모든 완료된 세션 포함)
    const firstCorrectCount = await db.QuizAnswer.count({
      include: [{
        model: db.QuizSession,
        where: { 
          user_id: currentSession.user_id,
          event_id: eventId,
          status: 'completed'
        }
      }],
      where: {
        is_correct: true,
        answer_attempt: 1 // 첫 시도에 맞춘 것만
      }
    });

    // LuckyDraw 문제를 한 번이라도 풀었는지 확인 (전체 이벤트 기준)
    const hasSeenLuckyDraw = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: { 
            user_id: currentSession.user_id,
            event_id: eventId
          }
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ]
    }) > 0;

    // 남은 문제 가져오기
    const allQuestions = await db.Question.findAll({
      where: {
        event_id: eventId,
        id: { [Op.notIn]: excludeQuestionIds }
      }
    });

    // 일반 문제와 LuckyDraw 분리
    let normalQuestions = allQuestions.filter(q => q.category === 'normal');
    let luckyQuestions = allQuestions.filter(q => q.category === 'luckydraw');

    // 디버깅 로그
    console.log(`[QuizService] 문제 선택 정보:
      - 제외할 문제 ID: [${excludeQuestionIds.join(', ')}]
      - 전체 남은 문제: ${allQuestions.length}개
      - 일반 문제: ${normalQuestions.length}개
      - 럭키드로우 문제: ${luckyQuestions.length}개
      - 첫 시도 정답 수: ${firstCorrectCount}
      - 럭키드로우 본 적 있음: ${hasSeenLuckyDraw}`);

    let selectedQuestions = [];

    // LuckyDraw 출제 조건 체크
    const canShowLuckyDraw = firstCorrectCount >= 3;

    if (!canShowLuckyDraw) {
      // 조건 미충족: 일반 문제만 출제
      selectedQuestions = this.shuffleArray(normalQuestions).slice(0, 5);
    } else if (!hasSeenLuckyDraw) {
      // 첫 LuckyDraw: 일반 4개 + LuckyDraw 1개
      const selectedNormal = this.shuffleArray(normalQuestions).slice(0, 4);
      const selectedLucky = this.shuffleArray(luckyQuestions).slice(0, 1);

      // 럭키드로우를 랜덤한 위치에 삽입 (처음이나 끝이 아닌 중간 위치 선호)
      const luckyInsertPosition = Math.floor(Math.random() * 3) + 1; // 1, 2, 3 중 하나
      selectedQuestions = [
        ...selectedNormal.slice(0, luckyInsertPosition),
        ...selectedLucky,
        ...selectedNormal.slice(luckyInsertPosition)
      ];

      console.log(`[QuizService] 첫 럭키드로우를 ${luckyInsertPosition + 1}번째 위치에 배치`);
    } else {
      // LuckyDraw 이후: 가중치 랜덤 (LuckyDraw 40%)
      selectedQuestions = this.getWeightedRandomQuestions(
        normalQuestions,
        luckyQuestions,
        5,
        0.4 // LuckyDraw 비율
      );
    }

    // 연속된 럭키드로우가 있는지 최종 검증
    this.validateNoConsecutiveLuckyDraws(selectedQuestions);

    console.log(`[QuizService] 최종 선택된 문제 수: ${selectedQuestions.length}개`);
    console.log(`[QuizService] 최종 문제 순서:`, selectedQuestions.map(q => `Q${q.id}(${q.category})`).join(' -> '));

    return selectedQuestions;
  }

  /**
   * 가중치 기반 랜덤 선택 (연속된 럭키드로우 방지)
   */
  getWeightedRandomQuestions(normalQuestions, luckyQuestions, count, luckyWeight) {
    const selected = [];
    const normalPool = [...normalQuestions];
    const luckyPool = [...luckyQuestions];
    let lastWasLucky = false; // 이전 문제가 럭키드로우였는지 추적

    while (selected.length < count && (normalPool.length > 0 || luckyPool.length > 0)) {
      let isLucky = Math.random() < luckyWeight && luckyPool.length > 0;

      // 이전 문제가 럭키드로우였다면, 이번에는 반드시 일반 문제 선택
      if (lastWasLucky) {
        isLucky = false;
      }

      // 일반 문제 풀이 비어있고 럭키드로우만 남았지만, 이전이 럭키드로우인 경우
      // 이런 상황을 방지하기 위해 문제 선택 전에 미리 체크
      if (isLucky && normalPool.length === 0 && lastWasLucky) {
        // 불가능한 상황: 연속 럭키드로우를 피할 수 없음
        // 이 경우 럭키드로우를 선택하되, 경고 로그
        console.warn('[QuizService] 경고: 연속 럭키드로우를 피할 수 없는 상황 발생');
      }

      if (isLucky && !lastWasLucky) {
        // 럭키드로우 선택
        const idx = Math.floor(Math.random() * luckyPool.length);
        selected.push(luckyPool[idx]);
        luckyPool.splice(idx, 1);
        lastWasLucky = true;
      } else if (normalPool.length > 0) {
        // 일반 문제 선택
        const idx = Math.floor(Math.random() * normalPool.length);
        selected.push(normalPool[idx]);
        normalPool.splice(idx, 1);
        lastWasLucky = false;
      } else if (luckyPool.length > 0) {
        // 일반 문제가 없으면 LuckyDraw에서 선택 (단, 이전이 럭키드로우가 아닌 경우만)
        if (!lastWasLucky) {
          const idx = Math.floor(Math.random() * luckyPool.length);
          selected.push(luckyPool[idx]);
          luckyPool.splice(idx, 1);
          lastWasLucky = true;
        } else {
          // 더 이상 선택할 수 없음
          console.warn('[QuizService] 경고: 일반 문제 없이 연속 럭키드로우 방지 불가');
          break;
        }
      }
    }

    console.log(`[QuizService] 선택된 문제 순서:`, selected.map(q => `${q.id}(${q.category})`).join(' -> '));

    return selected; // 순서를 유지하기 위해 셔플하지 않음
  }

  /**
   * 배열 셔플 (Fisher-Yates)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 연속된 럭키드로우가 없는지 검증
   */
  validateNoConsecutiveLuckyDraws(questions) {
    for (let i = 0; i < questions.length - 1; i++) {
      if (questions[i].category === 'luckydraw' && questions[i + 1].category === 'luckydraw') {
        console.error(`[QuizService] 오류: 연속된 럭키드로우 발견! 위치: ${i + 1}, ${i + 2}`);
        console.error(`[QuizService] 문제 ID: ${questions[i].id}, ${questions[i + 1].id}`);
        throw new Error('연속된 럭키드로우 문제가 선택되었습니다. 이는 허용되지 않습니다.');
      }
    }
    console.log(`[QuizService] ✓ 연속 럭키드로우 검증 통과`);
    return true;
  }

  /**
   * 다음 문제 선택 (동적 선택)
   * 현재 세션의 진행 상황을 보고 다음 문제를 결정
   */
  async getNextQuestion(sessionId, eventId) {
    // 현재 세션 정보 가져오기
    const currentSession = await db.QuizSession.findByPk(sessionId);
    if (!currentSession) {
      throw new Error('세션을 찾을 수 없습니다');
    }

    // 현재 세션에서 이미 제출한 답변 수
    const answeredCount = await db.QuizAnswer.count({
      where: { session_id: sessionId }
    });

    console.log(`[getNextQuestion] 세션 ${sessionId}: 이미 답변한 문제 수 = ${answeredCount}`);

    // 5개 문제를 모두 풀었으면 null 반환
    if (answeredCount >= 5) {
      console.log(`[getNextQuestion] 세션 완료 (5개 문제 모두 답변)`);
      return null;
    }

    // 현재 세션에서 한번에 맞춘 문제 수 (is_correct = true AND answer_attempt = 1)
    const firstCorrectCount = await db.QuizAnswer.count({
      where: {
        session_id: sessionId,
        is_correct: true,
        answer_attempt: 1
      }
    });

    console.log(`[getNextQuestion] 현재 세션에서 한번에 맞춘 문제 수: ${firstCorrectCount}`);

    // 이 세션에서 이미 럭키드로우를 봤는지 확인
    const hasSeenLuckyDrawInSession = await db.QuizAnswer.count({
      where: { session_id: sessionId },
      include: [{
        model: db.Question,
        where: { category: 'luckydraw' }
      }]
    }) > 0;

    console.log(`[getNextQuestion] 이 세션에서 럭키드로우 본 적 있음: ${hasSeenLuckyDrawInSession}`);

    // 이미 푼 문제 ID 목록 (전체 이벤트 기준)
    const previousAnswers = await db.QuizAnswer.findAll({
      include: [{
        model: db.QuizSession,
        where: {
          user_id: currentSession.user_id,
          event_id: eventId
        },
        attributes: []
      }],
      attributes: ['question_id'],
      group: ['question_id'],
      raw: true
    });

    const excludeQuestionIds = previousAnswers.map(a => a.question_id);
    console.log(`[getNextQuestion] 이미 푼 문제 ID (전체): [${excludeQuestionIds.join(', ')}]`);

    // 남은 문제 가져오기
    const allQuestions = await db.Question.findAll({
      where: {
        event_id: eventId,
        id: { [Op.notIn]: excludeQuestionIds }
      }
    });

    // ✅ 이미 당첨된 사용자인지 확인
    const alreadyWon = await db.LuckyDraw.findOne({
      where: {
        user_id: currentSession.user_id,
        event_id: eventId
      }
    });

    // 일반 문제와 럭키드로우 분리
    let normalQuestions = allQuestions.filter(q => q.category === 'normal');
    let luckyQuestions = allQuestions.filter(q => q.category === 'luckydraw');

    // ✅ 이미 당첨된 사용자는 럭키드로우 문제 제외
    if (alreadyWon) {
      console.log(`[getNextQuestion] 사용자 ${currentSession.user_id}는 이미 당첨됨 → 럭키드로우 문제 제외`);
      luckyQuestions = [];
    }

    console.log(`[getNextQuestion] 남은 문제: 일반 ${normalQuestions.length}개, 럭키드로우 ${luckyQuestions.length}개`);

    let selectedQuestion = null;

    // 조건 1: 한번에 3개 이상 맞췄고, 이 세션에서 아직 럭키드로우를 보지 않았으면 무조건 럭키드로우
    if (firstCorrectCount >= 3 && !hasSeenLuckyDrawInSession && luckyQuestions.length > 0) {
      console.log(`[getNextQuestion] 조건 충족: 한번에 ${firstCorrectCount}개 맞춤 → 럭키드로우 문제 선택`);
      const idx = Math.floor(Math.random() * luckyQuestions.length);
      selectedQuestion = luckyQuestions[idx];
    }
    // 조건 2: 이전 문제가 럭키드로우였으면 무조건 일반 문제
    else {
      // 바로 이전 문제가 럭키드로우였는지 확인
      const lastAnswer = await db.QuizAnswer.findOne({
        where: { session_id: sessionId },
        include: [{
          model: db.Question,
          attributes: ['category']
        }],
        order: [['answered_at', 'DESC']],
        limit: 1
      });

      const lastWasLucky = lastAnswer && lastAnswer.Question && lastAnswer.Question.category === 'luckydraw';
      console.log(`[getNextQuestion] 이전 문제가 럭키드로우였음: ${lastWasLucky}`);

      if (lastWasLucky) {
        // 무조건 일반 문제
        if (normalQuestions.length > 0) {
          const idx = Math.floor(Math.random() * normalQuestions.length);
          selectedQuestion = normalQuestions[idx];
          console.log(`[getNextQuestion] 이전이 럭키드로우 → 일반 문제 선택`);
        }
      } else {
        // 일반적인 경우: 가중치 랜덤 (럭키드로우 40%)
        const luckyWeight = hasSeenLuckyDrawInSession ? 0.4 : 0; // 첫 럭키드로우 후에만 40%

        if (Math.random() < luckyWeight && luckyQuestions.length > 0) {
          const idx = Math.floor(Math.random() * luckyQuestions.length);
          selectedQuestion = luckyQuestions[idx];
          console.log(`[getNextQuestion] 가중치 랜덤으로 럭키드로우 선택`);
        } else if (normalQuestions.length > 0) {
          const idx = Math.floor(Math.random() * normalQuestions.length);
          selectedQuestion = normalQuestions[idx];
          console.log(`[getNextQuestion] 일반 문제 선택`);
        } else if (luckyQuestions.length > 0) {
          const idx = Math.floor(Math.random() * luckyQuestions.length);
          selectedQuestion = luckyQuestions[idx];
          console.log(`[getNextQuestion] 일반 문제 없음 → 럭키드로우 선택`);
        }
      }
    }

    if (selectedQuestion) {
      console.log(`[getNextQuestion] 선택된 문제: Q${selectedQuestion.id} (${selectedQuestion.category})`);
    } else {
      console.log(`[getNextQuestion] 선택 가능한 문제 없음`);
    }

    return selectedQuestion;
  }

  /**
   * 사용자의 퀴즈 목록 조회 (회차 계산 포함)
   */
  async getQuizListForUser(userId) {
    // 모든 퀴즈 이벤트 가져오기
    const events = await db.QuizEvent.findAll({
      order: [['year_month', 'DESC']]
    });

    const quizList = await Promise.all(events.map(async (event) => {
      // 해당 이벤트에서 사용자가 완료한 세션들
      const completedSessions = await db.QuizSession.findAll({
        where: {
          user_id: userId,
          event_id: event.id,
          status: 'completed'
        },
        order: [['completed_at', 'ASC']]
      });

      // 푼 문제 수 = 완료된 세션 수 × 5
      const totalAnswered = completedSessions.length * 5;

      console.log(`[QuizList] 사용자 ${userId}, 이벤트 ${event.id}: 완료된 세션 ${completedSessions.length}개 → 푼 문제 수 = ${totalAnswered}개`);

      // 첫 시도에 맞춘 문제 수 (일반 + 럭키드로우 포함)
      const correctCount = await db.QuizAnswer.count({
        distinct: true,
        col: 'question_id',
        include: [{
          model: db.QuizSession,
          where: {
            user_id: userId,
            event_id: event.id
          },
          attributes: []
        }],
        where: {
          is_correct: true,
          answer_attempt: 1
        }
      });

      // 회차 계산: 완료된 세션 수 (최대 3회차)
      const currentRound = Math.min(completedSessions.length, 3);

      // LuckyDraw 맞춘 개수 (첫 시도에 맞춘 것만)
      const luckyDrawCount = await db.QuizAnswer.count({
        include: [
          {
            model: db.QuizSession,
            where: {
              user_id: userId,
              event_id: event.id
            }
          },
          {
            model: db.Question,
            where: { category: 'luckydraw' }
          }
        ],
        where: {
          is_correct: true,
          answer_attempt: 1
        }
      });

      console.log(`[QuizList] 사용자 ${userId}, 이벤트 ${event.id}: LuckyDraw 맞춘 개수 = ${luckyDrawCount}개`);
      
      // 디버깅: 럭키드로우 답변 상세 조회
      if (userId === 2 && event.id === 1) {
        const luckyDrawAnswersDetail = await db.QuizAnswer.findAll({
          include: [
            {
              model: db.QuizSession,
              where: {
                user_id: userId,
                event_id: event.id
              },
              attributes: ['id']
            },
            {
              model: db.Question,
              where: { category: 'luckydraw' },
              attributes: ['id', 'question_text']
            }
          ],
          attributes: ['id', 'question_id', 'is_correct', 'answer_attempt']
        });
        
        console.log(`[디버깅] 사용자 2, 이벤트 1의 모든 럭키드로우 답변:`);
        luckyDrawAnswersDetail.forEach(a => {
          console.log(`  답변 ID: ${a.id}, 문제 ID: ${a.question_id}, 정답: ${a.is_correct}, 시도: ${a.answer_attempt}`);
        });
      }

      // 남은 문제 수 = 15 - (완료된 세션 × 5)
      const remainingQuestions = 15 - totalAnswered;

      // 버튼 상태 결정
      let buttonText, buttonEnabled;
      const now = new Date();
      const isExpired = now > new Date(event.end_date);

      if (isExpired) {
        buttonText = '만료됨 🔒';
        buttonEnabled = false;
      } else if (remainingQuestions < 5) {
        // 남은 문제가 5개 미만이면 완료
        buttonText = '완료 ✓';
        buttonEnabled = false;
      } else if (totalAnswered === 0) {
        buttonText = '시작하기 →';
        buttonEnabled = true;
      } else {
        buttonText = '계속하기 →';
        buttonEnabled = true;
      }

      // 퀴즈명 생성 (회차 표시)
      const year = event.year_month.substring(0, 4);
      const month = event.year_month.substring(5);
      let quizTitle;
      let displayRound;

      if (totalAnswered >= 10) {
        displayRound = 3;
      } else if (totalAnswered >= 5) {
        displayRound = 2;
      } else {
        displayRound = 1;
      }

      quizTitle = `${year}년 ${month}월 ${displayRound}회차`;

      return {
        eventId: event.id,
        title: quizTitle,
        currentRound,
        totalAnswered,
        correctCount,  // 첫 시도에 맞춘 문제 수
        totalQuestions: 15,
        progressPercent: Math.round((correctCount / 15) * 100),  // 맞춘 문제 기준으로 진행률 계산
        luckyDrawCount,
        luckyDrawTotal: 3,
        startDate: event.start_date,
        endDate: event.end_date,
        isExpired,
        buttonText,
        buttonEnabled
      };
    }));

    return quizList;
  }
}

module.exports = new QuizService();
