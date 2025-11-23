const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'quiz.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 데이터베이스 수정 시작...\n');

db.serialize(() => {
  // 1. category를 모두 normal로 변경
  db.run(
    "UPDATE questions SET category = 'normal' WHERE category = 'luckydraw'",
    function(err) {
      if (err) {
        console.error('❌ Category 업데이트 실패:', err);
      } else {
        console.log(`✅ Category 업데이트: ${this.changes}개 행 변경`);
      }
    }
  );

  // 2. find_error를 best_action으로 변경
  db.run(
    "UPDATE questions SET question_type = 'best_action' WHERE question_type = 'find_error'",
    function(err) {
      if (err) {
        console.error('❌ Question type 업데이트 실패:', err);
      } else {
        console.log(`✅ Question type 업데이트: ${this.changes}개 행 변경`);
      }
    }
  );

  // 3. 결과 확인
  db.all(
    `SELECT question_type, category, COUNT(*) as count
     FROM questions
     GROUP BY question_type, category`,
    (err, rows) => {
      if (err) {
        console.error('❌ 조회 실패:', err);
      } else {
        console.log('\n📊 현재 문제 분포:');
        rows.forEach(row => {
          console.log(`  ${row.question_type} (${row.category}): ${row.count}개`);
        });
      }

      db.close(() => {
        console.log('\n✅ 완료!');
      });
    }
  );
});
