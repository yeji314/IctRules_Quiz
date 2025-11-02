'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 퀴즈 이벤트 생성
    const [event] = await queryInterface.bulkInsert('quiz_events', [{
      title: '2025년 1월 내규 퀴즈',
      year_month: '2025-01',
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-12-31'),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // 이벤트 ID 가져오기
    const events = await queryInterface.sequelize.query(
      'SELECT id FROM quiz_events WHERE year_month = ?',
      {
        replacements: ['2025-01'],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    const eventId = events[0].id;

    // 일반 문제 15개
    const normalQuestions = [
      // 드래그 앤 드롭
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '개인정보 보호 관련 업무는 어느 부서의 책임인가?',
        question_data: JSON.stringify({
          options: ['인사팀', 'IT팀', '법무팀', '재무팀', '영업팀'],
          correct_answer: '법무팀'
        }),
        explanation: '개인정보 보호법에 따라 법무팀이 담당합니다.',
        order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 타이핑
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'normal',
        question_text: '다음 문장을 정확히 입력하세요',
        question_data: JSON.stringify({
          correct_answer: '회사 기밀 정보는 외부에 유출할 수 없으며 위반 시 징계 대상이다'
        }),
        explanation: '내규 제7조를 정확히 숙지해야 합니다.',
        order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 빈칸 맞추기
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '직원은 출근 후 [BLANK] 분 이내에 근태 시스템에 등록해야 한다',
        question_data: JSON.stringify({
          options: ['10분', '20분', '30분', '60분'],
          correct_answer: '30분'
        }),
        explanation: '내규 제3조에 따라 30분 이내 등록이 필요합니다.',
        order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      // OX 퀴즈
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '회사 노트북을 개인 용도로 사용해도 된다',
        question_data: JSON.stringify({
          correct_answer: 'X'
        }),
        explanation: '회사 자산은 업무 목적으로만 사용해야 합니다.',
        order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 틀린 부분 찾기
      {
        event_id: eventId,
        question_type: 'find_error',
        category: 'normal',
        question_text: '직원은 [출근] 시 [회사] [보안카드]를 [착용]하고 [퇴근] 시에도 반드시 패용해야 한다',
        question_data: JSON.stringify({
          underlined_words: ['출근', '회사', '보안카드', '착용', '퇴근'],
          correct_answer: '착용',
          full_text: '직원은 출근 시 회사 보안카드를 패용하고 퇴근 시에도 반드시 패용해야 한다'
        }),
        explanation: '착용은 옷이나 장신구를 몸에 지니는 것이고, 카드는 패용이 맞습니다.',
        order: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 추가 일반 문제들
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '연차 휴가는 입사 후 [BLANK] 개월 이후부터 사용 가능하다',
        question_data: JSON.stringify({
          options: ['1개월', '3개월', '6개월', '12개월'],
          correct_answer: '3개월'
        }),
        explanation: '입사 후 3개월 이후부터 연차를 사용할 수 있습니다.',
        order: 6,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '업무 중 개인 SNS 사용은 자유롭게 허용된다',
        question_data: JSON.stringify({
          correct_answer: 'X'
        }),
        explanation: '업무 시간에는 업무에 집중해야 하며, 개인 SNS 사용은 제한됩니다.',
        order: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '급여 관련 문의는 어느 부서에 해야 하는가?',
        question_data: JSON.stringify({
          options: ['인사팀', 'IT팀', '법무팀', '재무팀', '영업팀'],
          correct_answer: '인사팀'
        }),
        explanation: '급여 관련 업무는 인사팀에서 담당합니다.',
        order: 8,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '회의실 예약은 최소 [BLANK] 시간 전에 해야 한다',
        question_data: JSON.stringify({
          options: ['1시간', '2시간', '4시간', '24시간'],
          correct_answer: '2시간'
        }),
        explanation: '회의실은 최소 2시간 전에 예약해야 합니다.',
        order: 9,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '재택근무 시에도 복장 규정을 준수해야 한다',
        question_data: JSON.stringify({
          correct_answer: 'O'
        }),
        explanation: '재택근무 중 화상회의 시 복장 규정을 준수해야 합니다.',
        order: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'normal',
        question_text: '다음 문장을 정확히 입력하세요',
        question_data: JSON.stringify({
          correct_answer: '모든 직원은 회사의 평판과 이미지를 보호할 책임이 있다'
        }),
        explanation: '직원 윤리 강령의 기본 원칙입니다.',
        order: 11,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'find_error',
        category: 'normal',
        question_text: '[직원]은 [업무]상 알게 된 [기밀정보]를 [누설]하면 안 되며 [퇴사] 후에도 동일하다',
        question_data: JSON.stringify({
          underlined_words: ['직원', '업무', '기밀정보', '누설', '퇴사'],
          correct_answer: '누설',
          full_text: '직원은 업무상 알게 된 기밀정보를 누설하면 안 되며 퇴사 후에도 동일하다'
        }),
        explanation: '누설은 유설의 잘못된 표현입니다.',
        order: 12,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '회사 주차장은 선착순으로 사용 가능하다',
        question_data: JSON.stringify({
          correct_answer: 'O'
        }),
        explanation: '회사 주차장은 선착순 이용이 원칙입니다.',
        order: 13,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '경조사 휴가는 최대 [BLANK]일까지 사용 가능하다',
        question_data: JSON.stringify({
          options: ['1일', '3일', '5일', '7일'],
          correct_answer: '5일'
        }),
        explanation: '경조사 종류에 따라 최대 5일까지 사용 가능합니다.',
        order: 14,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '시스템 장애 신고는 어느 부서로 해야 하는가?',
        question_data: JSON.stringify({
          options: ['인사팀', 'IT팀', '법무팀', '재무팀', '영업팀'],
          correct_answer: 'IT팀'
        }),
        explanation: '시스템 관련 문제는 IT팀에 신고합니다.',
        order: 15,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // LuckyDraw 문제 3개
    const luckyDrawQuestions = [
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'luckydraw',
        question_text: '회사 창립일은 매년 공휴일로 지정된다',
        question_data: JSON.stringify({
          correct_answer: 'O'
        }),
        explanation: '회사 창립일은 유급 휴일로 지정됩니다.',
        order: 16,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'luckydraw',
        question_text: '우수사원 시상은 [BLANK]마다 진행된다',
        question_data: JSON.stringify({
          options: ['매월', '분기별', '반기별', '연간'],
          correct_answer: '분기별'
        }),
        explanation: '우수사원은 분기별로 선정하여 시상합니다.',
        order: 17,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'luckydraw',
        question_text: '다음 문장을 정확히 입력하세요',
        question_data: JSON.stringify({
          correct_answer: '함께 성장하는 즐거운 일터를 만들어갑니다'
        }),
        explanation: '우리 회사의 비전입니다.',
        order: 18,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // 문제 삽입
    await queryInterface.bulkInsert('questions', [...normalQuestions, ...luckyDrawQuestions], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('questions', null, {});
    await queryInterface.bulkDelete('quiz_events', { year_month: '2025-01' }, {});
  }
};
