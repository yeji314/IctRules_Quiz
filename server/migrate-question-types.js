require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.sync();

    console.log('🔄 find_error → best_action 마이그레이션 시작...\n');

    // 1. find_error를 best_action으로 변경
    const [results] = await db.sequelize.query(
      "UPDATE questions SET question_type = 'best_action' WHERE question_type = 'find_error'"
    );

    console.log(`✅ ${results.affectedRows || 0}개 문제 업데이트 완료\n`);

    // 2. 변경된 문제 확인
    const questions = await db.Question.findAll({
      attributes: ['id', 'question_type', 'question_text'],
      order: [['id', 'ASC']]
    });

    console.log('📊 현재 문제 유형 분포:');
    const typeCounts = {};
    questions.forEach(q => {
      typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

    console.log('\n✅ 마이그레이션 완료!');

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
