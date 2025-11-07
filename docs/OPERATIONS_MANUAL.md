# ICT Rules Quiz - 운영 매뉴얼

## 개요
시스템 관리자를 위한 운영 매뉴얼입니다. 시스템 설치, 설정, 관리, 모니터링, 문제 해결 방법을 안내합니다.

---

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 및 배포](#설치-및-배포)
3. [SSO 설정 관리](#sso-설정-관리)
4. [사용자 관리](#사용자-관리)
5. [퀴즈 관리](#퀴즈-관리)
6. [모니터링](#모니터링)
7. [백업 및 복구](#백업-및-복구)
8. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 서버 사양
- **CPU**: 2코어 이상
- **RAM**: 4GB 이상
- **디스크**: 20GB 이상
- **OS**: Windows Server 2016 이상 / Linux (Ubuntu 20.04 이상)

### 소프트웨어
- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **SQLite**: 3.x (내장)

### 네트워크
- **포트**: 3001 (API), 3000 (Client)
- **방화벽**: 해당 포트 개방 필요
- **SSL/TLS**: 프로덕션 환경 권장

---

## 설치 및 배포

### 초기 설치

#### 1. 소스 코드 다운로드
```bash
git clone https://github.com/your-org/IctRulesQuiz.git
cd IctRulesQuiz
```

#### 2. 의존성 설치
```bash
cd server
npm install
```

#### 3. 환경 변수 설정
```bash
cp .env.example .env
nano .env
```

**필수 환경 변수:**
```bash
# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret_here

# CORS
CORS_ORIGIN=http://your-domain.com
```

**Swing SSO (선택):**
```bash
# Swing SSO Configuration
SWING_SSO_ENABLED=true
SWING_SSO_ENV=prod
SWING_API_BASE_URL=https://swing.api.example.com
SWING_CLIENT_ID=your_client_id
SWING_CLIENT_SECRET=your_client_secret
SWING_AUTO_CREATE_USER=true
SWING_SYNC_USER_INFO=true
SWING_PASSWORD_SALT=your_salt_here

# Access Control
SWING_ACCESS_CONTROL_TYPE=none
```

#### 4. 데이터베이스 초기화
```bash
# 마이그레이션 실행
npm run db:migrate

# 시드 데이터 삽입
npm run db:seed
```

#### 5. 서버 시작
```bash
# 개발 환경
npm run dev

# 프로덕션 환경
npm start
```

### 프로덕션 배포

#### PM2 사용 (권장)
```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 시작
cd server
pm2 start server.js --name ict-quiz

# 자동 시작 설정
pm2 startup
pm2 save
```

#### Docker 사용
```bash
# Docker 이미지 빌드
docker build -t ict-quiz .

# 컨테이너 실행
docker run -d \
  --name ict-quiz \
  -p 3001:3001 \
  -v ./database:/app/database \
  -v ./.env:/app/.env \
  ict-quiz
```

#### Nginx 리버스 프록시 설정
```nginx
server {
    listen 80;
    server_name quiz.your-domain.com;

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Client
    location / {
        root /path/to/IctRulesQuiz/client;
        try_files $uri $uri/ /pages/index.html;
    }
}
```

---

## SSO 설정 관리

### Admin 로그인
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "admin",
    "password": "admin@"
  }'

# 토큰 저장
export ADMIN_TOKEN="받은_토큰"
```

### SSO 상태 확인
```bash
curl -X GET http://localhost:3001/api/admin/sso/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**응답 예시:**
```json
{
  "success": true,
  "status": {
    "enabled": false,
    "environment": "mock",
    "api_healthy": false,
    "auto_create_user": true,
    "sync_user_info": true,
    "access_control_type": "none"
  },
  "statistics": {
    "total_users": 5,
    "sso_users": 0,
    "local_users": 5
  }
}
```

### SSO 활성화/비활성화
```bash
# 활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'

# 비활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": false}'
```

### Access Control 설정

#### 행원번호 목록으로 제한
```bash
# Access Control 타입 변경
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "employee_list"}'

# 허용 목록 설정
curl -X PUT http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": ["user001", "user002", "user003"]}'
```

#### 부서 목록으로 제한
```bash
# Access Control 타입 변경
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "department_list"}'

# 허용 부서 설정
curl -X PUT http://localhost:3001/api/admin/sso/settings/department_list \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": ["IT개발팀", "기획팀", "인사팀"]}'
```

#### 제한 해제
```bash
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "none"}'
```

### 전체 설정 조회
```bash
# 모든 설정
curl -X GET http://localhost:3001/api/admin/sso/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 카테고리별 설정
curl -X GET "http://localhost:3001/api/admin/sso/settings?category=api" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 사용자 관리

### 사용자 생성

#### 로컬 사용자 생성 (SQL)
```bash
cd server
sqlite3 ../database/quiz.db

INSERT INTO users (employee_id, password, name, department, email, role, created_at, updated_at)
VALUES (
  'user005',
  '$2a$10$SMxcvzUO/8O6NYoq8HM7vu8M9Oj9i.mv76W3N3MfnHg0OGPkkZCn.',  -- bcrypt hash of '1234'
  '새사용자',
  'IT개발팀',
  'user005@company.com',
  'user',
  datetime('now'),
  datetime('now')
);
```

#### SSO 사용자 (자동 생성)
SSO 로그인 시 `SWING_AUTO_CREATE_USER=true`이면 자동으로 생성됩니다.

### 사용자 조회
```bash
sqlite3 ../database/quiz.db

# 전체 사용자
SELECT employee_id, name, department, role, login_method FROM users;

# SSO 사용자만
SELECT employee_id, name, swing_user_id, department FROM users
WHERE login_method = 'swing_sso';

# 로컬 사용자만
SELECT employee_id, name, department FROM users
WHERE login_method = 'local';
```

### 사용자 비활성화
```bash
sqlite3 ../database/quiz.db

UPDATE users
SET is_active = 0
WHERE employee_id = 'user005';
```

### 비밀번호 재설정
```bash
# bcrypt 해시 생성 (Node.js)
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('new_password', 10, (err, hash) => {
  console.log(hash);
});
"

# 비밀번호 업데이트
sqlite3 ../database/quiz.db

UPDATE users
SET password = '{생성된_해시}'
WHERE employee_id = 'user005';
```

### 관리자 권한 부여
```bash
sqlite3 ../database/quiz.db

UPDATE users
SET role = 'admin'
WHERE employee_id = 'user005';
```

---

## 퀴즈 관리

### 이벤트 생성
```bash
curl -X POST http://localhost:3001/api/admin/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2025년 2월 내규 퀴즈",
    "year_month": "2025-02",
    "start_date": "2025-02-01T00:00:00Z",
    "end_date": "2025-02-28T23:59:59Z",
    "is_active": true
  }'
```

### 문제 생성

#### O/X 문제
```bash
curl -X POST http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "question_type": "ox",
    "category": "normal",
    "question_text": "회사 노트북을 개인 용도로 사용해도 된다",
    "question_data": {
      "correct_answer": "X"
    },
    "explanation": "회사 자산은 업무 목적으로만 사용해야 합니다.",
    "order": 1
  }'
```

#### 럭키드로우 문제
```bash
curl -X POST http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "question_type": "ox",
    "category": "luckydraw",
    "question_text": "회사 창립일은 매년 공휴일로 지정된다",
    "question_data": {
      "correct_answer": "O"
    },
    "explanation": "회사 창립일은 유급 휴일로 지정됩니다.",
    "order": 16
  }'
```

### 문제 수정
```bash
curl -X PUT http://localhost:3001/api/admin/questions/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "수정된 질문 내용"
  }'
```

### 문제 삭제
```bash
curl -X DELETE http://localhost:3001/api/admin/questions/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 이벤트 활성화/비활성화
```bash
# 비활성화
curl -X PUT http://localhost:3001/api/admin/events/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'

# 활성화
curl -X PUT http://localhost:3001/api/admin/events/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

---

## 모니터링

### 시스템 상태 확인

#### 서버 프로세스
```bash
# PM2 사용 시
pm2 status

# Docker 사용 시
docker ps | grep ict-quiz

# 일반 프로세스
ps aux | grep node
```

#### 서버 로그
```bash
# PM2 로그
pm2 logs ict-quiz

# Docker 로그
docker logs -f ict-quiz

# 직접 실행 시
tail -f logs/server.log
```

#### 서버 리소스
```bash
# CPU, 메모리 사용량
top | grep node

# 디스크 사용량
df -h
du -sh database/
```

### 통계 조회

#### 전체 통계
```bash
curl -X GET http://localhost:3001/api/admin/stats/overview \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**응답 예시:**
```json
{
  "success": true,
  "total_users": 50,
  "total_sessions": 250,
  "average_score": 85.5,
  "participation_rate": 80.0
}
```

#### 부서별 통계
```bash
curl -X GET "http://localhost:3001/api/admin/stats/departments?event_id=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 문제별 통계
```bash
curl -X GET "http://localhost:3001/api/admin/stats/questions?event_id=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 사용자 목록 및 통계
```bash
curl -X GET "http://localhost:3001/api/admin/stats/users?event_id=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 데이터베이스 확인
```bash
cd server
sqlite3 ../database/quiz.db

# 테이블 목록
.tables

# 스키마 확인
.schema users

# 데이터 확인
SELECT COUNT(*) FROM quiz_sessions;
SELECT COUNT(*) FROM quiz_answers;
SELECT COUNT(*) FROM lucky_draws;

# 최근 활동
SELECT * FROM quiz_sessions
ORDER BY started_at DESC
LIMIT 10;
```

---

## 백업 및 복구

### 데이터베이스 백업

#### 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DB_FILE="../database/quiz.db"
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 실행
cp $DB_FILE "$BACKUP_DIR/quiz_backup_$DATE.db"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "quiz_backup_*.db" -mtime +7 -delete

echo "Backup completed: quiz_backup_$DATE.db"
```

#### Cron 설정 (매일 자동 백업)
```bash
crontab -e

# 매일 오전 3시에 백업
0 3 * * * /path/to/backup.sh
```

### 데이터베이스 복구
```bash
# 서버 중지
pm2 stop ict-quiz

# 백업 복원
cp /path/to/backups/quiz_backup_20250106_030000.db database/quiz.db

# 서버 시작
pm2 start ict-quiz
```

### 설정 파일 백업
```bash
# .env 백업
cp .env .env.backup

# 전체 설정 백업
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env \
  server/config/ \
  database/quiz.db
```

---

## 문제 해결

### 서버가 시작되지 않음

#### 원인 1: 포트 충돌
```bash
# 포트 사용 확인
netstat -ano | findstr :3001
lsof -i :3001

# 프로세스 종료
kill -9 {PID}
```

#### 원인 2: 환경 변수 누락
```bash
# .env 파일 확인
cat .env

# 필수 변수 확인
grep JWT_SECRET .env
grep PORT .env
```

#### 원인 3: 데이터베이스 오류
```bash
# 데이터베이스 파일 확인
ls -la database/quiz.db

# 권한 확인
chmod 644 database/quiz.db

# 마이그레이션 재실행
npm run db:migrate
```

### SSO 인증 실패

#### 1. SSO가 비활성화됨
```bash
# 상태 확인
curl -X GET http://localhost:3001/api/admin/sso/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

#### 2. Swing API 연결 실패
```bash
# Swing API URL 확인
curl -X GET "$SWING_API_BASE_URL/health"

# 환경 변수 확인
grep SWING_API_BASE_URL .env
grep SWING_CLIENT_ID .env
grep SWING_CLIENT_SECRET .env

# 로그 확인
pm2 logs ict-quiz | grep Swing
```

#### 3. Access Control 설정 문제
```bash
# Access Control 확인
curl -X GET http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 제한 해제
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "none"}'
```

### 퀴즈가 시작되지 않음

#### 1. 활성 이벤트 없음
```bash
sqlite3 database/quiz.db

SELECT * FROM quiz_events WHERE is_active = 1;

# 이벤트 활성화
UPDATE quiz_events SET is_active = 1 WHERE id = 1;
```

#### 2. 문제 부족
```bash
sqlite3 database/quiz.db

SELECT COUNT(*) FROM questions WHERE event_id = 1 AND category = 'normal';
SELECT COUNT(*) FROM questions WHERE event_id = 1 AND category = 'luckydraw';

# 최소 5개의 일반 문제와 3개의 럭키드로우 문제 필요
```

### 데이터베이스 손상

#### 무결성 검사
```bash
sqlite3 database/quiz.db

PRAGMA integrity_check;
```

#### 복구 시도
```bash
# 백업에서 복원
cp /path/to/backups/quiz_backup_latest.db database/quiz.db

# 또는 재초기화
rm database/quiz.db
npm run db:migrate
npm run db:seed
```

### 성능 저하

#### 1. 데이터베이스 최적화
```bash
sqlite3 database/quiz.db

VACUUM;
ANALYZE;
```

#### 2. 인덱스 확인
```bash
sqlite3 database/quiz.db

.indexes users
.indexes quiz_sessions
.indexes quiz_answers
```

#### 3. 로그 정리
```bash
# PM2 로그 정리
pm2 flush

# 오래된 로그 삭제
find logs/ -name "*.log" -mtime +30 -delete
```

---

## 일상 점검 체크리스트

### 매일
- [ ] 서버 상태 확인
- [ ] 로그 확인 (에러 없는지)
- [ ] 참여자 수 확인
- [ ] 백업 성공 여부 확인

### 매주
- [ ] 데이터베이스 무결성 검사
- [ ] 디스크 공간 확인
- [ ] SSO 로그인 통계 확인
- [ ] 사용자 피드백 확인

### 매월
- [ ] 럭키드로우 추첨
- [ ] 성적 통계 생성
- [ ] 새 이벤트 생성
- [ ] 시스템 업데이트 확인

---

## 연락처

**시스템 관리:**
- IT개발팀 팀장: it-manager@company.com
- 담당자: dev-team@company.com

**SSO 관련:**
- Swing SSO 담당: swing-admin@company.com
- 기술 지원: tech-support@company.com

**긴급 연락:**
- 24시간 대기: emergency@company.com
- 전화: 02-1234-5678

---

## 부록

### 유용한 SQL 쿼리

```sql
-- 오늘 참여자 수
SELECT COUNT(DISTINCT user_id) FROM quiz_sessions
WHERE DATE(started_at) = DATE('now');

-- 평균 점수
SELECT AVG(
  (SELECT COUNT(*) FROM quiz_answers
   WHERE session_id = quiz_sessions.id AND is_correct = 1) * 20
) FROM quiz_sessions;

-- 부서별 참여율
SELECT u.department, COUNT(DISTINCT qs.user_id) as participants
FROM users u
LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
GROUP BY u.department;

-- SSO 사용률
SELECT
  COUNT(CASE WHEN login_method = 'swing_sso' THEN 1 END) * 100.0 / COUNT(*) as sso_percentage
FROM users;
```

### PM2 Ecosystem 파일 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'ict-quiz',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

사용:
```bash
pm2 start ecosystem.config.js
```

---

**버전**: 1.0
**최종 업데이트**: 2025-01-06
