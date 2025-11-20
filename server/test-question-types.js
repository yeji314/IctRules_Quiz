const db = require('./models');

async function testQuestionTypes() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 이벤트 1번의 모든 문제 조회
    const questions = await db.Question.findAll({
      where: { event_id: 1 },
      attributes: ['id', 'question_type', 'category', 'question_text']
    });

    console.log('\n=== 이벤트 1번 문제 목록 ===');
    console.log(`총 문제 수: ${questions.length}개\n`);

    // 유형별 분류
    const byType = {};
    const byCategory = { normal: [], luckydraw: [] };

    questions.forEach(q => {
      if (!byType[q.question_type]) {
        byType[q.question_type] = [];
      }
      byType[q.question_type].push(q);
      byCategory[q.category].push(q);
    });

    console.log('📊 문제 유형별 개수:');
    Object.keys(byType).forEach(type => {
      console.log(`  - ${type}: ${byType[type].length}개`);
    });

    console.log('\n📊 카테고리별 개수:');
    console.log(`  - normal: ${byCategory.normal.length}개`);
    console.log(`  - luckydraw: ${byCategory.luckydraw.length}개`);

    console.log('\n✅ 일반 문제 유형 분포:');
    const normalByType = {};
    byCategory.normal.forEach(q => {
      if (!normalByType[q.question_type]) {
        normalByType[q.question_type] = 0;
      }
      normalByType[q.question_type]++;
    });
    Object.keys(normalByType).forEach(type => {
      console.log(`  - ${type}: ${normalByType[type]}개`);
    });

    console.log('\n✨ 럭키드로우 문제 유형 분포:');
    const luckyByType = {};
    byCategory.luckydraw.forEach(q => {
      if (!luckyByType[q.question_type]) {
        luckyByType[q.question_type] = 0;
      }
      luckyByType[q.question_type]++;
    });
    Object.keys(luckyByType).forEach(type => {
      console.log(`  - ${type}: ${luckyByType[type]}개`);
    });

    // 5가지 유형이 모두 있는지 확인
    const allTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'find_error'];
    console.log('\n🔍 필수 유형 체크 (일반 문제):');
    allTypes.forEach(type => {
      const count = normalByType[type] || 0;
      const status = count >= 3 ? '✅' : '⚠️';
      console.log(`  ${status} ${type}: ${count}개 ${count >= 3 ? '(충분)' : '(부족 - 최소 3개 필요)'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

testQuestionTypes();
