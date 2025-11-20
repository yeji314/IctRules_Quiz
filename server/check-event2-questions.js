const db = require('./models');

async function checkEvent2Questions() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 이벤트 2번 문제 확인
    const event2Questions = await db.Question.findAll({
      where: { event_id: 2 }
    });

    console.log(`=== 이벤트 2번 문제 현황 ===`);
    console.log(`총 문제 수: ${event2Questions.length}개\n`);

    if (event2Questions.length === 0) {
      console.log('❌ 이벤트 2번에 문제가 없습니다!');
      console.log('이것이 버그의 원인입니다.');
      console.log('\n해결 방법:');
      console.log('1. 관리자 페이지에서 이벤트 2번에 문제를 추가하거나');
      console.log('2. 이벤트 1번으로 퀴즈를 시작하세요.');
    } else {
      console.log('문제 목록:');
      const byType = {};
      const byCategory = { normal: 0, luckydraw: 0 };

      event2Questions.forEach(q => {
        if (!byType[q.question_type]) {
          byType[q.question_type] = 0;
        }
        byType[q.question_type]++;
        byCategory[q.category]++;

        console.log(`  Q${q.id}: ${q.question_type} (${q.category})`);
      });

      console.log('\n📊 유형별 개수:');
      Object.keys(byType).forEach(type => {
        console.log(`  - ${type}: ${byType[type]}개`);
      });

      console.log('\n📊 카테고리별:');
      console.log(`  - normal: ${byCategory.normal}개`);
      console.log(`  - luckydraw: ${byCategory.luckydraw}개`);

      const allTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'find_error'];
      console.log('\n🔍 필수 유형 체크:');
      allTypes.forEach(type => {
        const count = byType[type] || 0;
        const status = count >= 3 ? '✅' : '❌';
        console.log(`  ${status} ${type}: ${count}개 ${count >= 3 ? '(충분)' : '(부족 - 최소 3개 필요)'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

checkEvent2Questions();
