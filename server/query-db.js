const db = require('./models');

async function queryDB() {
  try {
    // USER004 찾기
    const user = await db.User.findOne({
      where: { username: 'USER004' }
    });

    if (!user) {
      console.log('❌ USER004를 찾을 수 없습니다');
      process.exit(1);
    }

    console.log('✅ USER004 발견:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Name:', user.name);

    // USER004가 푼 LUCKYDRAW 문제 확인
    const luckyDrawAnswers = await db.QuizAnswer.findAll({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: user.id }
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ]
    });

    console.log('\n=== USER004의 LUCKYDRAW 답변 ===');
    console.log('총 답변 수:', luckyDrawAnswers.length);

    if (luckyDrawAnswers.length > 0) {
      luckyDrawAnswers.forEach((answer, idx) => {
        console.log(`\n답변 ${idx + 1}:`);
        console.log('  - 문제 ID:', answer.question_id);
        console.log('  - 정답 여부:', answer.is_correct ? '✅ 맞음' : '❌ 틀림');
        console.log('  - 시도 횟수:', answer.answer_attempt);
        console.log('  - 세션 ID:', answer.session_id);
      });
    } else {
      console.log('LUCKYDRAW 문제를 풀지 않았습니다.');
    }

    // luckyDrawCount 계산 (현재 로직 - 첫 시도에 맞춘 것만)
    const luckyDrawCountCurrent = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: user.id }
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

    console.log('\n=== luckyDrawCount 계산 ===');
    console.log('현재 로직 (첫 시도에 맞춘 것만):', luckyDrawCountCurrent);

    // luckyDrawCount 계산 (수정된 로직 - 시도만 했으면 카운트)
    const luckyDrawCountFixed = await db.QuizAnswer.count({
      include: [
        {
          model: db.QuizSession,
          where: { user_id: user.id }
        },
        {
          model: db.Question,
          where: { category: 'luckydraw' }
        }
      ]
    });

    console.log('수정된 로직 (시도만 해도 카운트):', luckyDrawCountFixed);

    console.log('\n📌 결론:');
    if (luckyDrawCountCurrent === 0 && luckyDrawCountFixed > 0) {
      console.log('⚠️  USER004가 LUCKYDRAW를 풀었지만 첫 시도에 틀려서 별표가 안 보입니다!');
      console.log('   → 수정 필요: "시도만 해도" 별표가 보이도록 변경');
    } else if (luckyDrawCountCurrent > 0) {
      console.log('✅ USER004가 LUCKYDRAW를 첫 시도에 맞춰서 별표가 보여야 합니다.');
    } else {
      console.log('ℹ️  USER004가 LUCKYDRAW 문제를 풀지 않았습니다.');
    }

    process.exit(0);
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
}

queryDB();
