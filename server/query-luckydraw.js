const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/quiz.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 사용자 2, 이벤트 1 럭키드로우 확인 ===\n');

// 1. 사용자 2의 세션 확인
db.all(`
  SELECT id, user_id, event_id, status, session_number
  FROM QuizSessions
  WHERE user_id = 2 AND event_id = 1
`, (err, sessions) => {
  if (err) {
    console.error('세션 조회 에러:', err);
    return;
  }
  
  console.log('사용자 2의 세션:');
  console.log(sessions);
  console.log('');

  if (sessions.length === 0) {
    console.log('세션이 없습니다.');
    db.close();
    return;
  }

  const sessionIds = sessions.map(s => s.id).join(',');

  // 2. 해당 세션의 모든 답변 확인
  db.all(`
    SELECT 
      qa.id as answer_id,
      qa.session_id,
      qa.question_id,
      qa.is_correct,
      qa.answer_attempt,
      q.category,
      q.question_text
    FROM QuizAnswers qa
    JOIN Questions q ON qa.question_id = q.id
    WHERE qa.session_id IN (${sessionIds})
    ORDER BY qa.answered_at ASC
  `, (err, answers) => {
    if (err) {
      console.error('답변 조회 에러:', err);
      db.close();
      return;
    }

    console.log(`총 답변 수: ${answers.length}\n`);
    
    answers.forEach((answer, idx) => {
      console.log(`[${idx + 1}] 답변 ID: ${answer.answer_id}`);
      console.log(`    세션 ID: ${answer.session_id}`);
      console.log(`    문제 ID: ${answer.question_id}`);
      console.log(`    카테고리: ${answer.category}`);
      console.log(`    정답 여부: ${answer.is_correct}`);
      console.log(`    시도 횟수: ${answer.answer_attempt}`);
      console.log(`    문제: ${answer.question_text.substring(0, 50)}...`);
      console.log('');
    });

    // 3. 럭키드로우만 필터링
    const luckyDrawAnswers = answers.filter(a => a.category === 'luckydraw');
    console.log(`\n=== 럭키드로우 답변 ===`);
    console.log(`럭키드로우 답변 수: ${luckyDrawAnswers.length}\n`);
    
    luckyDrawAnswers.forEach(answer => {
      console.log(`답변 ID: ${answer.answer_id}`);
      console.log(`  문제 ID: ${answer.question_id}`);
      console.log(`  정답: ${answer.is_correct}`);
      console.log(`  시도: ${answer.answer_attempt}`);
      console.log('');
    });

    // 4. 첫 시도에 맞춘 럭키드로우
    const firstAttemptCorrect = luckyDrawAnswers.filter(a => a.is_correct === 1 && a.answer_attempt === 1);
    console.log(`\n첫 시도에 맞춘 럭키드로우: ${firstAttemptCorrect.length}개`);

    if (firstAttemptCorrect.length > 0) {
      console.log('\n상세:');
      firstAttemptCorrect.forEach(answer => {
        console.log(`  - 답변 ID: ${answer.answer_id}, 문제 ID: ${answer.question_id}`);
      });
    } else {
      console.log('첫 시도에 맞춘 럭키드로우가 없습니다.');
      
      if (luckyDrawAnswers.length > 0) {
        console.log('\n럭키드로우 답변 상태:');
        luckyDrawAnswers.forEach(a => {
          console.log(`  문제 ${a.question_id}: 정답=${a.is_correct}, 시도=${a.answer_attempt}`);
        });
      }
    }

    db.close();
  });
});

