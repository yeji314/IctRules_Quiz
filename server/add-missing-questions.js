const db = require('./models');

async function addMissingQuestions() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // typing 유형 일반 문제 1개 추가
    await db.Question.create({
      event_id: 1,
      question_type: 'typing',
      category: 'normal',
      question_text: 'ICT 규정에서 "정보자산"이란 무엇을 의미하는가? (한글로 정확히 입력)',
      question_data: {
        correct_answer: '조직의 업무 수행에 필요한 정보 및 이를 처리하는 시스템',
        placeholder: '정답을 입력하세요'
      },
      explanation: 'ICT 규정에서 정보자산은 "조직의 업무 수행에 필요한 정보 및 이를 처리하는 시스템"으로 정의됩니다.'
    });
    console.log('✅ typing 유형 일반 문제 1개 추가');

    // find_error 유형 일반 문제 1개 추가
    await db.Question.create({
      event_id: 1,
      question_type: 'find_error',
      category: 'normal',
      question_text: '다음 보안 절차 중 잘못된 부분을 찾으세요.',
      question_data: {
        sentence: '비밀번호는 매년 1회 변경하고, 특수문자 없이 8자리 이상으로 설정해야 한다.',
        error_word: '특수문자 없이',
        correct_answer: '특수문자 포함',
        options: ['매년 1회', '특수문자 없이', '8자리 이상']
      },
      explanation: '비밀번호는 특수문자를 포함해야 하며, 매년이 아니라 정기적으로(3~6개월마다) 변경해야 합니다.'
    });
    console.log('✅ find_error 유형 일반 문제 1개 추가');

    console.log('\n✅ 모든 문제 추가 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

addMissingQuestions();
