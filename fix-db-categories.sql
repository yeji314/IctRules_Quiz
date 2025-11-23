-- 1. 모든 문제의 category를 normal로 변경 (럭키드로우는 동적으로 결정됨)
UPDATE questions SET category = 'normal' WHERE category = 'luckydraw';

-- 2. find_error를 best_action으로 변경 (새로운 유형)
-- 주의: ENUM 타입이므로 ALTER TABLE이 필요할 수 있음
-- 먼저 데이터만 업데이트 시도
UPDATE questions
SET question_type = 'best_action'
WHERE question_type = 'find_error';

-- 3. 확인 쿼리
SELECT
  question_type,
  category,
  COUNT(*) as count
FROM questions
GROUP BY question_type, category;
