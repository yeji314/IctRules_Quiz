const db = require('./models');
const quizService = require('./services/quizService');

async function testLuckyDrawLogic() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 테스트 사용자 ID (기존 사용자)
    const testUserId = 2;
    const eventId = 1;

    console.log('=== 테스트 시나리오 ===');
    console.log('사용자 ID:', testUserId);
    console.log('이벤트 ID:', eventId);
    console.log('');

    // 1. 현재 상태 확인
    const completedSessions = await db.QuizSession.findAll({
      where: {
        user_id: testUserId,
        event_id: eventId,
        status: 'completed'
      }
    });

    console.log(`📊 완료된 세션 수: ${completedSessions.length}개`);

    // 전체 이벤트에서 첫 시도 정답 수
    const totalFirstCorrect = await db.QuizAnswer.count({
      include: [{
        model: db.QuizSession,
        where: {
          user_id: testUserId,
          event_id: eventId
        }
      }],
      where: {
        is_correct: true,
        answer_attempt: 1
      }
    });

    console.log(`✅ 전체 이벤트 첫 시도 정답 수: ${totalFirstCorrect}개`);
    console.log(`🎰 럭키드로우 출현 가능 여부: ${totalFirstCorrect >= 3 ? '가능 ✅' : '불가능 (3개 이상 필요)'}\n`);

    // 2. 각 회차에서 나온 문제 유형 분석
    for (let i = 0; i < completedSessions.length; i++) {
      const session = completedSessions[i];
      console.log(`--- ${i + 1}회차 (세션 ID: ${session.id}) ---`);

      const answers = await db.QuizAnswer.findAll({
        where: { session_id: session.id },
        include: [{
          model: db.Question,
          attributes: ['id', 'question_type', 'category']
        }],
        order: [['answered_at', 'ASC']]
      });

      const types = [];
      const categories = [];
      answers.forEach((a, idx) => {
        types.push(a.Question.question_type);
        categories.push(a.Question.category);
        const icon = a.Question.category === 'luckydraw' ? '✨' : '📝';
        const correctIcon = a.is_correct ? '✅' : '❌';
        console.log(`  ${idx + 1}. ${icon} ${a.Question.question_type} ${correctIcon} (문제 ID: ${a.Question.id})`);
      });

      const uniqueTypes = [...new Set(types)];
      const luckyCount = categories.filter(c => c === 'luckydraw').length;

      console.log(`  유형 수: ${uniqueTypes.length}/5 (${uniqueTypes.join(', ')})`);
      console.log(`  럭키드로우: ${luckyCount}개`);

      if (uniqueTypes.length === 5) {
        console.log('  ✅ 5가지 유형 모두 출현!');
      } else {
        const allTypes = ['drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'find_error'];
        const missing = allTypes.filter(t => !uniqueTypes.includes(t));
        console.log(`  ⚠️ 누락된 유형: ${missing.join(', ')}`);
      }
      console.log('');
    }

    // 3. 진행 중인 세션이 있는지 확인
    const inProgressSession = await db.QuizSession.findOne({
      where: {
        user_id: testUserId,
        event_id: eventId,
        status: 'in_progress'
      }
    });

    if (inProgressSession) {
      console.log(`⏳ 진행 중인 세션: ${inProgressSession.id}`);

      const currentAnswers = await db.QuizAnswer.findAll({
        where: { session_id: inProgressSession.id },
        include: [{
          model: db.Question,
          attributes: ['id', 'question_type', 'category']
        }]
      });

      console.log(`  답변한 문제: ${currentAnswers.length}/5`);
      currentAnswers.forEach((a, idx) => {
        const icon = a.Question.category === 'luckydraw' ? '✨' : '📝';
        const correctIcon = a.is_correct ? '✅' : '❌';
        console.log(`    ${idx + 1}. ${icon} ${a.Question.question_type} ${correctIcon}`);
      });
    } else {
      console.log('⏳ 진행 중인 세션 없음');
    }

    console.log('\n=== 테스트 완료 ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

testLuckyDrawLogic();
