const { Op } = require('sequelize');
const db = require('../models');

class QuizService {
  /**
   * 랜덤으로 5개 문제 선택 (LuckyDraw 조건 포함)
   */
  async getRandomQuestions(sessionId, eventId, excludeQuestionIds = []) {
    // 현재 세션의 첫 시도에 맞춘 문제 수 확인
    const firstCorrectCount = await db.QuizAnswer.count({
      include: [{
        model: db.QuizSession,
        where: { id: sessionId }
      }],
      where: {
        is_correct: true,
        answer_attempt: 1 // 첫 시도에 맞춘 것만
      }
    });

    // LuckyDraw 문제를 한 번이라도 풀었는지 확인
    const hasSeenLuckyDraw = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: { id: sessionId }
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
      selectedQuestions = this.shuffleArray([...selectedNormal, ...selectedLucky]);
    } else {
      // LuckyDraw 이후: 가중치 랜덤 (LuckyDraw 40%)
      selectedQuestions = this.getWeightedRandomQuestions(
        normalQuestions,
        luckyQuestions,
        5,
        0.4 // LuckyDraw 비율
      );
    }

    return selectedQuestions;
  }

  /**
   * 가중치 기반 랜덤 선택
   */
  getWeightedRandomQuestions(normalQuestions, luckyQuestions, count, luckyWeight) {
    const selected = [];
    const normalPool = [...normalQuestions];
    const luckyPool = [...luckyQuestions];

    while (selected.length < count && (normalPool.length > 0 || luckyPool.length > 0)) {
      const isLucky = Math.random() < luckyWeight && luckyPool.length > 0;

      if (isLucky) {
        const idx = Math.floor(Math.random() * luckyPool.length);
        selected.push(luckyPool[idx]);
        luckyPool.splice(idx, 1);
      } else if (normalPool.length > 0) {
        const idx = Math.floor(Math.random() * normalPool.length);
        selected.push(normalPool[idx]);
        normalPool.splice(idx, 1);
      } else if (luckyPool.length > 0) {
        // 일반 문제가 없으면 LuckyDraw에서 선택
        const idx = Math.floor(Math.random() * luckyPool.length);
        selected.push(luckyPool[idx]);
        luckyPool.splice(idx, 1);
      }
    }

    return this.shuffleArray(selected);
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

      // 회차 계산: 완료된 세션 수
      const currentRound = completedSessions.length; // 0, 1, 2, 3

      // 총 풀은 문제 수
      const totalAnswered = currentRound * 5;

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

      // 버튼 상태 결정
      let buttonText, buttonEnabled;
      const now = new Date();
      const isExpired = now > new Date(event.end_date);

      if (isExpired) {
        buttonText = '만료됨 🔒';
        buttonEnabled = false;
      } else if (currentRound === 0) {
        buttonText = '시작하기 →';
        buttonEnabled = true;
      } else if (currentRound < 3) {
        buttonText = '계속하기 →';
        buttonEnabled = true;
      } else {
        buttonText = '완료 ✓';
        buttonEnabled = false;
      }

      // 퀴즈명 생성
      const year = event.year_month.substring(0, 4);
      const month = event.year_month.substring(5);
      let quizTitle;

      if (currentRound === 0) {
        quizTitle = `${year}년 ${month}월`;
      } else {
        quizTitle = `${year}년 ${month}월 ${currentRound}회차`;
      }

      return {
        eventId: event.id,
        title: quizTitle,
        currentRound,
        totalAnswered,
        totalQuestions: 15,
        progressPercent: Math.round((totalAnswered / 15) * 100),
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
