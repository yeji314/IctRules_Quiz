'use strict';

/**
 * 2025년 11월 내규 퀴즈 이벤트 및 문제 시드 데이터
 * Docker 배포 시 자동으로 11월 문제 18개를 생성합니다.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 이벤트 생성
    const eventId = 1; // Docker에서는 첫 번째 이벤트가 됨

    await queryInterface.bulkInsert('quiz_events', [
      {
        id: eventId,
        title: '2025년 11월 내규 퀴즈',
        year_month: '2025-11',
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        is_active: 1,
        max_winners: 10,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // 2. 문제 18개 생성
    await queryInterface.bulkInsert('questions', [
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '장애를 인지한 경우 지체없이 어디에 통보해야 하나요?',
        question_data: JSON.stringify({
          target_label: '여기에 드래그하세요',
          options: ['상황반', 'Tech감사실', 'Tech기획부', '감사부'],
          correct_answer: '상황반'
        }),
        explanation: '장애를 인지한 자는 지체없이 상황반 담당자에게 통보해야 합니다.',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'normal',
        question_text: '긴급 적용은 프로그램의 롤백을 우선 검토해야 한다',
        question_data: JSON.stringify({
          correct_answer: '긴급 적용은 프로그램의 롤백을 우선 검토해야 한다'
        }),
        explanation: '원복으로 해결이 불가한 경우를 제외하고 긴급 적용은 롤백을 우선 검토해야 한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '[ ] 은 특정 영업기능을 복구하기 위한 목표 시간을 의미한다',
        question_data: JSON.stringify({
          options: ['RTO', 'RPO', '단일장애지점', '재해복구 시스템', 'MCA'],
          correct_answer: 'RTO'
        }),
        explanation: 'RTO(Recovery Time Objective)는 은행에 심각한 영향을 미치지 않는 범위내에서 허용 가능한 시간을 의미한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '개발부서도 현업 인수테스트 등록이 가능하다',
        question_data: JSON.stringify({
          correct_answer: 'X'
        }),
        explanation: '현업 인수테스트 등록은 현업부서에서 실시해야만 한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'find_error',
        category: 'normal',
        question_text: '개발부서는 대고객 서비스와 관련된 긴급 체크인의 경우에는 소관 부서장까지 형상관리시스템 결재를 득해야 한다',
        question_data: JSON.stringify({
          underlined_words: ['개발부서', '대고객 서비스', '부서장', '형상관리시스템', '결재'],
          correct_answer: '부서장'
        }),
        explanation: '대고객 서비스의 긴급적용은 소관 그룹장까지 결재를 받아야한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '오픈소스 소프트웨어 사용부서가 현황을 반기 1회 통지해야하는 부서는?',
        question_data: JSON.stringify({
          target_label: '여기에 드래그하세요',
          options: ['Tech운영부', 'Tech혁신Unit', 'Tech기획부', 'Tech감사실', 'Data플랫폼Unit'],
          correct_answer: 'Tech혁신Unit'
        }),
        explanation: '오픈소스 소프트웨어 사용부서는 반기별 1회 Tech운영부와 정보보호본부에 현황을 통지해야 한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'drag_and_drop',
        category: 'normal',
        question_text: '원장변경 요청 절차의 정당성을 검증하고 승인하는 부서는?',
        question_data: JSON.stringify({
          target_label: '여기에 드래그하세요',
          options: ['Tech기획부', 'Tech감사실', 'Tech운영부', '개발부서', '감사부'],
          correct_answer: 'Tech감사실'
        }),
        explanation: 'Tech감사실은 원장변경 요청 검증,승인,실행 후 관리 등의 역할을 담당한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'normal',
        question_text: '전산자료, 프로그램, 전산조작 오류 등의 사유로 발생한 경우 전산 사고로 판단한다',
        question_data: JSON.stringify({
          correct_answer: '전산자료, 프로그램, 전산조작 오류 등의 사유로 발생한 경우 전산 사고로 판단한다'
        }),
        explanation: '전산자료, 프로그램, 전산조작 오류 등의 사유로 발생한 경우 전산 사고로 판단한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '시스템의 확장, 성능개선, 예방보수 등 사전에 계획된 일정에 의한 업무 중단은 장애로 보지 않는다.',
        question_data: JSON.stringify({
          correct_answer: 'O'
        }),
        explanation: '시스템의 확장, 성능개선, 예방보수 등 사전에 계획된 일정에 의한 업무 중단은 장애로 보지 않는다.',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'find_error',
        category: 'normal',
        question_text: '장애 조치 완료 후, IT 업무 소관 부서장은 1~3등급인 경우 Tech그룹장에게 보고한다',
        question_data: JSON.stringify({
          underlined_words: ['부서장', '1~3등급', 'Tech그룹장', '보고한다'],
          correct_answer: '1~3등급'
        }),
        explanation: '장애 조치 완료 후, IT 업무 소관 부서장은 1~5등급인 경우 Tech그룹장에게 보고한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: '전산자료 및 프로그램의 고의적 조작과 관련된 금융사고는 [ ]등급으로 판정한다',
        question_data: JSON.stringify({
          options: ['1', '2', '3', '4', '5'],
          correct_answer: '1'
        }),
        explanation: '전산자료 및 프로그램의 고의적 조작과 관련된 금융사고는 1등급으로 판정한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'normal',
        question_text: '도급 관리부서와 도급 사업부서는 원칙적으로 서로 다른 부서로 이원화하여 운영해야 한다',
        question_data: JSON.stringify({
          correct_answer: '도급 관리부서와 도급 사업부서는 원칙적으로 서로 다른 부서로 이원화하여 운영해야 한다'
        }),
        explanation: '도급 관리부서와 도급 사업부서는 원칙적으로 서로 다른 부서로 이원화하여 운영해야 한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '도급 업무 운영 시 "현장 대리인"은 은행 소속 직원을 의미한다 ',
        question_data: JSON.stringify({
          correct_answer: 'X'
        }),
        explanation: '"현장 대리인"은 도급 업체 직원이다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'find_error',
        category: 'normal',
        question_text: '사업 소관부서는 Tech기획부와 사전 협의를 통해 실무위원회 소집 7영업일 전까지 제출해야 한다 ',
        question_data: JSON.stringify({
          underlined_words: ['사업 소관부서', 'Tech기획부', '실무위원회', '7영업일', '제출'],
          correct_answer: '7영업일'
        }),
        explanation: '사업 소관부서는 Tech기획부와 사전 협의를 통해 실무위원회 소집 5영업일 전까지 제출해야 한다 ',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'normal',
        question_text: '자본예산 5억 또는 연간 경비예산 1억을 초과하는 사업 추진안은 ict 실무위원회 심의 대상이다',
        question_data: JSON.stringify({
          correct_answer: 'O'
        }),
        explanation: '자본예산 5억 또는 연간 경비예산 1억을 초과하는 사업 추진안은 ict 실무위원회 심의 대상이다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'ox',
        category: 'luckydraw',
        question_text: 'ICT개발 직무와 ICT운영 직무는 동일인이 겸직할 수 있다 ',
        question_data: JSON.stringify({
          correct_answer: 'X'
        }),
        explanation: 'ICT개발 직무와 ICT운영 직무는 동일인이 겸직할 수 없다 ',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'typing',
        category: 'luckydraw',
        question_text: 'ICT부서는 정보시스템의 계속적 운영과 신속한 원상복구 등을 위한 비상계획을 수립 운영하여 그 피해를 최소화하여야 한다',
        question_data: JSON.stringify({
          correct_answer: 'ICT부서는 정보시스템의 계속적 운영과 신속한 원상복구 등을 위한 비상계획을 수립 운영하여 그 피해를 최소화하여야 한다'
        }),
        explanation: 'ICT부서는 정보시스템의 계속적 운영과 신속한 원상복구 등을 위한 비상계획을 수립 운영하여 그 피해를 최소화하여야 한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        event_id: eventId,
        question_type: 'fill_in_blank',
        category: 'normal',
        question_text: 'ICT직무는 ICT기획, ICT운영, ICT개발, ICT감사, ICT[ ],정보보호 직무 영역으로 구분한다',
        question_data: JSON.stringify({
          options: ['사업', '지원', 'AI', '도급', '내부통제'],
          correct_answer: '지원'
        }),
        explanation: 'ICT직무는 ICT기획, ICT운영, ICT개발, ICT감사, ICT지원,정보보호 직무 영역으로 구분한다',
        order: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    console.log('✅ 11월 퀴즈 이벤트 및 18개 문제 생성 완료');
  },

  down: async (queryInterface, Sequelize) => {
    // 역순으로 삭제
    await queryInterface.bulkDelete('questions', { event_id: 1 }, {});
    await queryInterface.bulkDelete('quiz_events', { id: 1 }, {});
  }
};
