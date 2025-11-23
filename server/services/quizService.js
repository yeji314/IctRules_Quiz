const { Op } = require('sequelize');
const db = require('../models');

class QuizService {
  /**
   * 랜덤으로 5개 문제 선택 (5가지 유형 각 1개 + LuckyDraw 조건 포함)
   */
  async getRandomQuestions(sessionId, eventId, excludeQuestionIds = []) {
    // 현재 세션 정보 가져오기 (user_id 필요)
    const currentSession = await db.QuizSession.findByPk(sessionId);
    if (!currentSession) {
      throw new Error('세션을 찾을 수 없습니다');
    }

    // 현재 세션에서 첫 시도에 맞춘 문제 수 확인 (현재 세션만)
    const firstCorrectCount = await db.QuizAnswer.count({
      where: {
        session_id: sessionId,
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
        }
      ],
      where: {
        is_lucky_draw: true
      }
    }) > 0;

    // 현재 세션에서 이미 당첨되었는지 확인
    const hasWonPrizeInSession = await db.LuckyDraw.count({
      where: {
        session_id: sessionId
      }
    }) > 0;

    // 전체 이벤트에서 이미 당첨된 사용자인지도 확인
    const hasWonPrizeInEvent = await db.LuckyDraw.count({
      where: {
        user_id: currentSession.user_id,
        event_id: eventId
      }
    }) > 0;

    // 이벤트의 최대 당첨자 수 도달 여부 확인
    const event = await db.QuizEvent.findByPk(eventId);
    if (!event) {
      throw new Error('이벤트를 찾을 수 없습니다');
    }

    const currentWinnerCount = await db.LuckyDraw.count({
      where: { event_id: eventId }
    });

    const maxWinnersReached = currentWinnerCount >= event.max_winners;

    // 남은 문제 가져오기
    const allQuestions = await db.Question.findAll({
      where: {
        event_id: eventId,
        id: { [Op.notIn]: excludeQuestionIds }
      }
    });

    // 5가지 유형 정의
    const questionTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'];
    
    // 유형별로 문제 분류 (모든 문제가 럭키드로우 대상이 될 수 있음)
    const questionsByType = {};
    questionTypes.forEach(type => {
      questionsByType[type] = allQuestions.filter(q => q.question_type === type);
    });

    console.log(`[QuizService] 문제 선택 정보:
      - 제외할 문제 ID: [${excludeQuestionIds.join(', ')}]
      - 전체 남은 문제: ${allQuestions.length}개
      - 첫 시도 정답 수: ${firstCorrectCount}
      - 럭키드로우 본 적 있음: ${hasSeenLuckyDraw}
      - 현재 세션에서 당첨됨: ${hasWonPrizeInSession}
      - 이벤트 전체에서 당첨됨: ${hasWonPrizeInEvent}
      - 이벤트 당첨자 수: ${currentWinnerCount}/${event.max_winners}
      - 최대 당첨자 도달: ${maxWinnersReached}`);

    // LuckyDraw 출제 조건 체크
    // 1. 현재 세션에서 3문제 이상 맞춤
    // 2. 현재 세션에서 당첨된 적 없음 (중요!)
    // 3. 전체 이벤트에서 당첨된 적 없음
    // 4. 최대 당첨자 수 미달
    const canShowLuckyDraw = firstCorrectCount >= 3 && !hasWonPrizeInSession && !hasWonPrizeInEvent && !maxWinnersReached;

    // 1단계: 5가지 유형별로 1개씩 선택
    const selectedQuestions = [];
    const selectedTypes = [];

    for (const type of questionTypes) {
      const pool = questionsByType[type];

      if (pool.length > 0) {
        const randomIdx = Math.floor(Math.random() * pool.length);
        selectedQuestions.push(pool[randomIdx]);
        selectedTypes.push(type);
      }
    }

    // 5개가 안 되면 부족한 만큼 추가 (유형 중복 허용)
    while (selectedQuestions.length < 5 && allQuestions.length > selectedQuestions.length) {
      const remaining = allQuestions.filter(q => !selectedQuestions.includes(q));
      if (remaining.length > 0) {
        const randomIdx = Math.floor(Math.random() * remaining.length);
        selectedQuestions.push(remaining[randomIdx]);
      } else {
        break;
      }
    }

    // 2단계: LuckyDraw 조건이 충족되면 럭키드로우 문제 위치 표시
    // 모든 문제가 럭키드로우 대상이 될 수 있음 - 조건 충족 시 특정 위치의 문제에 럭키드로우 플래그 부여
    let luckyDrawPositions = [];
    if (canShowLuckyDraw && selectedQuestions.length === 5) {
      if (!hasSeenLuckyDraw) {
        // 첫 럭키드로우: 1개만 (중간 위치)
        const luckyPosition = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
        luckyDrawPositions.push(luckyPosition);
        console.log(`[QuizService] 첫 럭키드로우를 ${luckyPosition + 1}번째 위치에 배치`);
      } else {
        // 이후: 40% 확률로 각 문제에 럭키드로우 플래그 (연속 방지)
        for (let i = 0; i < selectedQuestions.length; i++) {
          const prevIsLucky = luckyDrawPositions.includes(i - 1);
          if (!prevIsLucky && Math.random() < 0.4) {
            luckyDrawPositions.push(i);
          }
        }
      }

      // 선택된 문제들에 럭키드로우 플래그 추가 (임시 속성)
      luckyDrawPositions.forEach(pos => {
        if (selectedQuestions[pos]) {
          selectedQuestions[pos].dataValues.isLuckyDraw = true;
          console.log(`[QuizService] 문제 ${pos + 1}번 위치에 럭키드로우 플래그 추가`);
        }
      });
    }

    console.log(`[QuizService] 최종 선택된 문제 수: ${selectedQuestions.length}개`);
    console.log(`[QuizService] 최종 문제 순서:`, selectedQuestions.map(q => `${q.question_type}${q.dataValues.isLuckyDraw ? '(럭키드로우)' : ''}`).join(' -> '));

    return selectedQuestions;
  }

  /**
   * 다음 문제 선택 (동적 선택)
   * 현재 세션의 진행 상황을 보고 다음 문제를 결정
   *
   * 문제 유형 분배 규칙:
   * - 모든 회차에서 5가지 유형(dragdrop, typing, fillblank, ox, finderror)이 각각 1개씩 반드시 포함
   *
   * 럭키드로우 출현 규칙:
   * 1. 현재 세션에서 3문제 이상 맞춰야 출현 가능
   * 2. 직전 문제가 럭키드로우인 경우 출현 불가
   * 3. 이미 선물에 당첨된 경우 출현 불가
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

    // 5가지 유형 정의
    const questionTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'];

    // 현재 세션에서 이미 나온 문제 유형 확인
    const answeredQuestions = await db.QuizAnswer.findAll({
      where: { session_id: sessionId },
      include: [{
        model: db.Question,
        attributes: ['question_type']
      }]
    });

    const usedQuestionTypes = answeredQuestions.map(a => a.Question.question_type);
    console.log(`[getNextQuestion] 이미 나온 유형: [${usedQuestionTypes.join(', ')}]`);

    // 아직 나오지 않은 유형 계산
    const remainingTypes = questionTypes.filter(type => !usedQuestionTypes.includes(type));
    console.log(`[getNextQuestion] 남은 유형: [${remainingTypes.join(', ')}]`);

    // 현재 세션에서 한 번에 맞춘 문제 수 (첫 시도 정답만 카운트)
    const correctCount = await db.QuizAnswer.count({
      where: {
        session_id: sessionId,
        is_correct: true,
        answer_attempt: 1  // 한 번에 맞춘 것만!
      }
    });

    console.log(`[getNextQuestion] 현재 세션에서 한 번에 맞춘 문제 수: ${correctCount}`);

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

    // 해당 월(이벤트)에서 이미 선물에 당첨되었는지 확인
    const hasWonPrizeThisMonth = await db.LuckyDraw.count({
      where: {
        user_id: currentSession.user_id,
        event_id: eventId
      }
    }) > 0;

    console.log(`[getNextQuestion] 이번 월 선물 당첨 여부: ${hasWonPrizeThisMonth}`);

    // 이벤트의 최대 당첨자 수 도달 여부 확인
    const event = await db.QuizEvent.findByPk(eventId);
    if (!event) {
      throw new Error('이벤트를 찾을 수 없습니다');
    }

    const currentWinnerCount = await db.LuckyDraw.count({
      where: { event_id: eventId }
    });

    const maxWinnersReached = currentWinnerCount >= event.max_winners;
    console.log(`[getNextQuestion] 이벤트 당첨자 수: ${currentWinnerCount}/${event.max_winners}, 최대치 도달: ${maxWinnersReached}`);

    // 현재 세션에서 직전 문제가 럭키드로우였는지 확인
    const lastAnswer = await db.QuizAnswer.findOne({
      where: { session_id: sessionId },
      order: [['answered_at', 'DESC']],
      limit: 1
    });

    const lastWasLuckyDraw = lastAnswer && lastAnswer.is_lucky_draw === true;
    console.log(`[getNextQuestion] 직전 문제가 럭키드로우: ${lastWasLuckyDraw}`);

    // 남은 문제 가져오기
    let allQuestions = await db.Question.findAll({
      where: {
        event_id: eventId,
        id: { [Op.notIn]: excludeQuestionIds }
      }
    });

    // 아직 나오지 않은 유형만 필터링 (남은 유형이 있을 때만)
    // 단, 필터링 결과가 0개면 필터링 없이 진행
    if (remainingTypes.length > 0 && remainingTypes.length < questionTypes.length) {
      const filteredQuestions = allQuestions.filter(q => remainingTypes.includes(q.question_type));
      if (filteredQuestions.length > 0) {
        allQuestions = filteredQuestions;
        console.log(`[getNextQuestion] 남은 유형으로 필터링: [${remainingTypes.join(', ')}]`);
      } else {
        console.log(`[getNextQuestion] 남은 유형(${remainingTypes.join(', ')})에 해당하는 문제가 없음 - 필터링 스킵`);
      }
    }

    console.log(`[getNextQuestion] 남은 문제: ${allQuestions.length}개`);

    // 세션 내에서 이미 출제된 럭키드로우 문제 수 확인
    const luckyDrawCount = await db.QuizAnswer.count({
      where: {
        session_id: sessionId,
        is_lucky_draw: true
      }
    });
    
    const isFirstLuckyDraw = luckyDrawCount === 0;
    console.log(`[getNextQuestion] 세션 내 럭키드로우 출제 횟수: ${luckyDrawCount}회 (첫 럭키드로우: ${isFirstLuckyDraw})`);

    // 럭키드로우 출현 가능 여부 판단
    // 조건: 정답 3개 이상 + 직전이 럭키드로우 아님 + 이번 월에 당첨 안됨 + 최대 당첨자 수 미도달
    const canShowLuckyDraw = correctCount >= 3 && !lastWasLuckyDraw && !hasWonPrizeThisMonth && !maxWinnersReached && allQuestions.length > 0;

    console.log(`[getNextQuestion] 럭키드로우 출현 가능: ${canShowLuckyDraw} (정답 ${correctCount}개 >= 3, 직전 럭키드로우: ${lastWasLuckyDraw}, 이번 월 당첨: ${hasWonPrizeThisMonth}, 최대 당첨자 도달: ${maxWinnersReached})`);

    let selectedQuestion = null;

    if (allQuestions.length > 0) {
      // 랜덤으로 문제 선택
      const idx = Math.floor(Math.random() * allQuestions.length);
      selectedQuestion = allQuestions[idx];

      // 럭키드로우 확률 계산
      if (canShowLuckyDraw) {
        let luckyDrawProbability;
        
        if (isFirstLuckyDraw) {
          // 첫 번째 럭키드로우: 무조건 100%
          luckyDrawProbability = 1.0;
          console.log(`[getNextQuestion] 첫 럭키드로우 → 100% 확률`);
        } else {
          // 두 번째 이후 럭키드로우: 40% + (답변한 문제 수 * 10%)
          const answeredCount = await db.QuizAnswer.count({
            where: { session_id: sessionId }
          });
          
          // 기본 40% + 문제당 10% 증가 (최대 90%)
          luckyDrawProbability = Math.min(0.9, 0.4 + (answeredCount * 0.1));
          console.log(`[getNextQuestion] 두 번째+ 럭키드로우 → ${(luckyDrawProbability * 100).toFixed(0)}% 확률 (답변 ${answeredCount}개)`);
        }
        
        // 확률에 따라 럭키드로우 문제로 지정
        const random = Math.random();
        if (random < luckyDrawProbability) {
          selectedQuestion.dataValues.isLuckyDraw = true;
          console.log(`[getNextQuestion] ✨ 럭키드로우 문제로 지정: Q${selectedQuestion.id} (${selectedQuestion.question_type}) [확률: ${(luckyDrawProbability * 100).toFixed(0)}%, 랜덤: ${(random * 100).toFixed(0)}%]`);
        } else {
          console.log(`[getNextQuestion] 일반 문제 선택: Q${selectedQuestion.id} (${selectedQuestion.question_type}) [확률: ${(luckyDrawProbability * 100).toFixed(0)}%, 랜덤: ${(random * 100).toFixed(0)}%]`);
        }
      } else {
        console.log(`[getNextQuestion] 일반 문제 선택: Q${selectedQuestion.id} (${selectedQuestion.question_type})`);
      }
    }

    if (!selectedQuestion) {
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

      // LuckyDraw 맞춘 개수 (is_lucky_draw 플래그가 true이고 첫 시도에 맞춘 것만)
      const luckyDrawCount = await db.QuizAnswer.count({
        include: [
          {
            model: db.QuizSession,
            where: {
              user_id: userId,
              event_id: event.id
            }
          }
        ],
        where: {
          is_correct: true,
          answer_attempt: 1,
          is_lucky_draw: true
        }
      });

      console.log(`[QuizList] 사용자 ${userId}, 이벤트 ${event.id}: LuckyDraw 맞춘 개수 = ${luckyDrawCount}개`);

      // 남은 문제 수 = 15 - (완료된 세션 × 5)
      const remainingQuestions = 15 - totalAnswered;

      // 완료한 문제 수 (패널용)
      const completed_questions = totalAnswered;

      // 버튼/상태 결정
      let buttonText, buttonEnabled;
      let status;
      const now = new Date();
      const isExpired = now > new Date(event.end_date);

      if (isExpired) {
        status = 'completed';
        buttonText = '만료됨 🔒';
        buttonEnabled = false;
      } else if (completed_questions === 0) {
        status = 'start';
        buttonText = '시작하기 →';
        buttonEnabled = true;
      } else if (completed_questions < 15) {
        status = 'continue';
        buttonText = '계속하기 →';
        buttonEnabled = true;
      } else {
        status = 'completed';
        buttonText = '완료 ✓';
        buttonEnabled = false;
      }

      // 퀴즈명 생성 (월 텍스트: "1월" 형태)
      const year = event.year_month.substring(0, 4);
      const month = event.year_month.substring(5);
      const monthNumber = parseInt(month, 10);
      const quizTitle = `${monthNumber}월`;

      return {
        eventId: event.id,
        year_month: event.year_month,
        title: quizTitle,
        currentRound,
        totalAnswered,
        completed_questions,
        status,
        correctCount,  // 첫 시도에 맞춘 문제 수
        totalQuestions: 15,
        progressPercent: Math.round((correctCount / 15) * 100),  // 맞춘 문제 기준으로 진행률 계산
        luckyDrawCount,
        luckyDrawTotal: 3,
        startDate: event.start_date,
        endDate: event.end_date,
        isExpired,
        is_active: event.is_active,
        buttonText,
        buttonEnabled
      };
    }));

    return quizList;
  }
}

module.exports = new QuizService();
