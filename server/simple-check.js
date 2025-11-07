const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/quiz.db');

if (!fs.existsSync(dbPath)) {
  console.log('데이터베이스 파일이 없습니다:', dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 에러:', err);
    process.exit(1);
  }
  
  console.log('DB 연결 성공\n');
  
  // 사용자 목록
  db.all('SELECT id, employee_id, name FROM Users', (err, users) => {
    if (err) {
      console.error('Users 조회 에러:', err);
      db.close();
      return;
    }
    
    console.log('=== 사용자 목록 ===');
    users.forEach(u => {
      console.log(`ID: ${u.id}, 행원번호: ${u.employee_id}, 이름: ${u.name}`);
    });
    console.log('');
    
    // 사용자 2의 답변 중 럭키드로우만
    db.all(`
      SELECT 
        qa.id,
        qa.session_id,
        qa.question_id,
        qa.is_correct,
        qa.answer_attempt,
        qs.user_id,
        qs.event_id,
        q.category
      FROM QuizAnswers qa
      JOIN QuizSessions qs ON qa.session_id = qs.id
      JOIN Questions q ON qa.question_id = q.id
      WHERE qs.user_id = 2 AND qs.event_id = 1 AND q.category = 'luckydraw'
    `, (err, answers) => {
      if (err) {
        console.error('답변 조회 에러:', err);
        db.close();
        return;
      }
      
      console.log('=== 사용자 2(user001), 이벤트 1의 럭키드로우 답변 ===');
      console.log(`총 ${answers.length}개`);
      
      if (answers.length === 0) {
        console.log('럭키드로우 답변이 없습니다.\n');
        
        // 일반 답변은 있는지 확인
        db.all(`
          SELECT COUNT(*) as count
          FROM QuizAnswers qa
          JOIN QuizSessions qs ON qa.session_id = qs.id
          WHERE qs.user_id = 2 AND qs.event_id = 1
        `, (err, result) => {
          if (err) {
            console.error('카운트 조회 에러:', err);
          } else {
            console.log(`사용자 2의 전체 답변 수: ${result[0].count}개`);
          }
          db.close();
        });
      } else {
        answers.forEach(a => {
          console.log(`답변 ID: ${a.id}`);
          console.log(`  문제 ID: ${a.question_id}`);
          console.log(`  정답: ${a.is_correct === 1 ? 'O' : 'X'}`);
          console.log(`  시도: ${a.answer_attempt}회`);
          console.log(`  첫 시도 정답: ${a.is_correct === 1 && a.answer_attempt === 1 ? 'YES' : 'NO'}`);
          console.log('');
        });
        
        const firstAttemptCorrect = answers.filter(a => a.is_correct === 1 && a.answer_attempt === 1);
        console.log(`\n첫 시도에 맞춘 럭키드로우: ${firstAttemptCorrect.length}개\n`);
        
        db.close();
      }
    });
  });
});

