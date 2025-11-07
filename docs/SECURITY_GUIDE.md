# ICT Rules Quiz - 보안 가이드

## 개요
시스템 보안을 위한 가이드입니다. 인증, 데이터 보호, 취약점 방지, 보안 설정 방법을 안내합니다.

---

## 목차
1. [보안 원칙](#보안-원칙)
2. [인증 및 권한](#인증-및-권한)
3. [데이터 보호](#데이터-보호)
4. [취약점 방지](#취약점-방지)
5. [SSO 보안](#sso-보안)
6. [보안 설정 체크리스트](#보안-설정-체크리스트)
7. [사고 대응](#사고-대응)

---

## 보안 원칙

### 최소 권한 원칙
- 사용자에게 필요한 최소한의 권한만 부여
- Admin 권한은 꼭 필요한 사용자에게만
- 정기적인 권한 검토

### 다층 방어
- 네트워크 레벨: 방화벽
- 애플리케이션 레벨: 인증/인가
- 데이터 레벨: 암호화

### 보안 업데이트
- 정기적인 의존성 업데이트
- 보안 패치 즉시 적용
- 취약점 스캐닝

---

## 인증 및 권한

### JWT 토큰 보안

#### 강력한 Secret 사용
```bash
# .env 파일
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

**나쁜 예:**
```bash
JWT_SECRET=secret123
JWT_SECRET=my_jwt_secret
```

**좋은 예:**
```bash
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
JWT_SECRET=xHj9mP2kL5nQ8wR7tY6uI3oP0aS1dF4gH
```

#### 토큰 만료 시간 설정
```bash
# .env 파일
JWT_EXPIRES_IN=7d    # 7일 (권장)
JWT_EXPIRES_IN=1d    # 더 보수적
JWT_EXPIRES_IN=24h   # 24시간
```

#### 토큰 저장
```javascript
// ❌ 나쁜 예: localStorage (XSS 취약)
localStorage.setItem('token', token);

// ✅ 좋은 예: HTTP-only Cookie
res.cookie('token', token, {
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: 'strict'
});
```

### 비밀번호 보안

#### bcrypt 사용 (이미 적용됨)
```javascript
// 10 라운드 이상 권장
const hash = await bcrypt.hash(password, 10);
```

#### 비밀번호 정책
```
- 최소 8자 이상
- 대소문자, 숫자, 특수문자 조합
- 이전 비밀번호 재사용 금지
- 90일마다 변경 권장
```

#### 비밀번호 재설정
```
- 이메일 인증 필수
- 재설정 링크 1회용, 1시간 유효
- 재설정 시 모든 세션 무효화
```

### 권한 관리

#### Role-Based Access Control (RBAC)
```javascript
// middleware/auth.js
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

#### API 엔드포인트 보호
```javascript
// ✅ 모든 민감한 API는 인증 필요
router.get('/admin/*', authenticate, requireAdmin, ...);
router.post('/quiz/submit', authenticate, ...);

// ❌ 인증 없는 민감한 API
router.get('/admin/users', ...);  // 위험!
```

---

## 데이터 보호

### 민감 정보 처리

#### 환경 변수
```bash
# ❌ 코드에 하드코딩
const API_KEY = 'abc123xyz';

# ✅ 환경 변수 사용
const API_KEY = process.env.SWING_CLIENT_SECRET;
```

#### .env 파일 보호
```bash
# .gitignore에 추가 (이미 적용됨)
.env
.env.local
.env.production

# 파일 권한 제한
chmod 600 .env
```

#### 민감 정보 로깅 금지
```javascript
// ❌ 나쁜 예
console.log('Password:', password);
console.log('Token:', req.headers.authorization);

// ✅ 좋은 예
console.log('User authenticated:', user.id);
console.log('Token length:', token.length);
```

### 데이터베이스 보안

#### SQLite 파일 권한
```bash
chmod 644 database/quiz.db
chown app:app database/quiz.db
```

#### SQL Injection 방지 (이미 적용됨)
```javascript
// ✅ Sequelize ORM 사용 (Parameterized Query)
User.findOne({ where: { employee_id: employeeId } });

// ❌ Raw Query (위험)
sequelize.query(`SELECT * FROM users WHERE employee_id = '${employeeId}'`);
```

#### 백업 암호화
```bash
# 백업 파일 암호화
openssl enc -aes-256-cbc -salt \
  -in quiz.db \
  -out quiz.db.enc \
  -k your_encryption_password

# 복호화
openssl enc -aes-256-cbc -d \
  -in quiz.db.enc \
  -out quiz.db \
  -k your_encryption_password
```

### HTTPS 사용 (프로덕션 필수)

#### Let's Encrypt 인증서
```bash
# Certbot 설치
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --standalone \
  -d quiz.your-domain.com

# Nginx 설정
server {
    listen 443 ssl;
    server_name quiz.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/quiz.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quiz.your-domain.com/privkey.pem;

    # Strong SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

---

## 취약점 방지

### XSS (Cross-Site Scripting) 방지

#### 입력 검증 (이미 적용됨)
```javascript
const { body, validationResult } = require('express-validator');

router.post('/quiz/submit',
  body('answer').trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  }
);
```

#### Content Security Policy
```javascript
// Helmet 사용 (이미 적용됨)
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### CSRF (Cross-Site Request Forgery) 방지

#### CSRF 토큰 사용
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/quiz/submit', csrfProtection, (req, res) => {
  // CSRF 토큰 자동 검증됨
});
```

### Rate Limiting (이미 적용됨)

```javascript
const rateLimit = require('express-rate-limit');

// 로그인 시도 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 5,  // 최대 5번
  message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도하세요.'
});

app.post('/api/auth/login', loginLimiter, ...);
```

### SQL Injection 방지 (이미 적용됨)

#### Sequelize ORM 사용
```javascript
// ✅ 안전
const user = await User.findOne({
  where: { employee_id: req.body.employee_id }
});

// ❌ 위험
const query = `SELECT * FROM users WHERE employee_id = '${req.body.employee_id}'`;
```

### Command Injection 방지

```javascript
// ❌ 위험
const { exec } = require('child_process');
exec(`ls ${userInput}`);  // 위험!

// ✅ 안전
const { spawn } = require('child_process');
const ls = spawn('ls', [userInput]);  // 안전
```

---

## SSO 보안

### Swing API 인증

#### Client Secret 보호
```bash
# .env 파일 (암호화 권장)
SWING_CLIENT_SECRET=$(openssl rand -base64 32)

# 파일 권한
chmod 600 .env

# 로그에 출력 금지
SWING_VERBOSE_LOG=false
```

#### API 통신 암호화
```javascript
// ✅ HTTPS 필수
SWING_API_BASE_URL=https://swing.api.example.com

// ❌ HTTP (위험)
SWING_API_BASE_URL=http://swing.api.example.com
```

### Access Control 보안

#### 화이트리스트 기반
```javascript
// ✅ 허용 목록 사용
const allowedEmployees = ['user001', 'user002', 'user003'];
if (!allowedEmployees.includes(employeeId)) {
  throw new Error('Access denied');
}

// ❌ 블랙리스트 (취약)
const blockedEmployees = ['hacker'];
if (blockedEmployees.includes(employeeId)) {
  throw new Error('Access denied');
}
```

#### 정기적인 목록 검토
```bash
# 월 1회 Access Control 목록 검토
curl -X GET http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 퇴사자, 이동자 제거
curl -X PUT http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": ["updated_list"]}'
```

### 사용자 정보 동기화 보안

#### 정보 최소화
```javascript
// ✅ 필요한 정보만 저장
const userInfo = {
  user_id: swingUser.userId,
  employee_id: swingUser.employeeId,
  name: swingUser.name,
  department: swingUser.department
  // 민감한 정보는 저장하지 않음
};

// ❌ 과도한 정보 저장
const userInfo = {
  ...swingUser,  // 모든 정보 저장 (위험)
};
```

#### 동기화 로그
```javascript
// 사용자 정보 변경 이력 기록
console.log(`[Sync] User ${user.id} updated:`, {
  old: { name: user.name, dept: user.department },
  new: { name: swingUser.name, dept: swingUser.department }
});
```

---

## 보안 설정 체크리스트

### 서버 설정

#### 환경 변수
- [ ] JWT_SECRET: 32자 이상 무작위 문자열
- [ ] SESSION_SECRET: 32자 이상 무작위 문자열
- [ ] SWING_CLIENT_SECRET: 안전하게 보관
- [ ] SWING_PASSWORD_SALT: 프로덕션 값으로 변경
- [ ] NODE_ENV=production 설정

#### 파일 권한
- [ ] .env: 600 (owner read/write only)
- [ ] database/quiz.db: 644
- [ ] server/*.js: 644
- [ ] 실행 파일: 755

#### HTTPS
- [ ] SSL/TLS 인증서 설치
- [ ] HTTPS 리다이렉트 설정
- [ ] HSTS 헤더 설정
- [ ] 인증서 자동 갱신 설정

### 애플리케이션 설정

#### 인증
- [ ] JWT 토큰 만료 시간 설정 (7일 이하)
- [ ] bcrypt 라운드: 10 이상
- [ ] Rate limiting 활성화
- [ ] Session timeout 설정

#### 헤더
- [ ] Helmet 사용 (✅ 이미 적용)
- [ ] CORS 올바르게 설정 (✅ 이미 적용)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] X-XSS-Protection

#### 로깅
- [ ] 에러 로그 기록
- [ ] 접근 로그 기록
- [ ] 민감 정보 로그 금지
- [ ] 로그 정기 백업

### SSO 설정

#### Swing API
- [ ] HTTPS 사용
- [ ] Client credentials 보호
- [ ] API timeout 설정 (10초)
- [ ] 에러 처리

#### Access Control
- [ ] 제어 타입 설정 (none/employee_list/department_list)
- [ ] 허용 목록 정기 검토
- [ ] 접근 거부 로그 기록
- [ ] 비정상 접근 모니터링

---

## 사고 대응

### 보안 사고 유형

#### 1. 무단 접근
**증상:**
- 알 수 없는 계정으로 로그인
- 비정상적인 시간대 접속
- 여러 IP에서 동시 접근

**대응:**
```bash
# 1. 즉시 해당 계정 비활성화
sqlite3 database/quiz.db
UPDATE users SET is_active = 0 WHERE employee_id = 'compromised_user';

# 2. 모든 세션 무효화 (JWT_SECRET 변경)
nano .env
# JWT_SECRET 값 변경
pm2 restart ict-quiz

# 3. 접근 로그 확인
grep "compromised_user" logs/*.log
```

#### 2. 데이터 유출
**증상:**
- 대량의 데이터 조회
- 비정상적인 API 호출
- 데이터베이스 파일 접근

**대응:**
```bash
# 1. 즉시 서버 중지
pm2 stop ict-quiz

# 2. 로그 확인
tail -1000 logs/server.log > incident_log.txt

# 3. 데이터베이스 백업
cp database/quiz.db database/quiz_incident_$(date +%Y%m%d_%H%M%S).db

# 4. 피해 범위 확인
sqlite3 database/quiz.db
SELECT * FROM users WHERE updated_at > datetime('now', '-1 hour');

# 5. 관계자 통보
```

#### 3. SSO 인증 우회 시도
**증상:**
- 잘못된 토큰 대량 시도
- Access Control 우회 시도
- 비정상적인 API 패턴

**대응:**
```bash
# 1. SSO 일시 비활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": false}'

# 2. IP 차단
# 방화벽에서 해당 IP 차단

# 3. 로그 분석
grep "SwingAuth" logs/server.log | grep "failed"

# 4. Swing API 담당자에게 연락
```

### 사고 보고

#### 보고 내용
1. 사고 발생 시간
2. 발견 경로
3. 영향 범위
4. 즉시 대응 조치
5. 피해 예상
6. 향후 조치 계획

#### 보고 대상
- 정보보호 담당자
- IT 팀장
- 경영진 (중대한 경우)

### 복구 절차

#### 1. 서버 재시작
```bash
# 서버 중지
pm2 stop ict-quiz

# 변경 사항 적용
git pull
npm install

# 서버 시작
pm2 start ict-quiz

# 상태 확인
pm2 status
```

#### 2. 데이터베이스 복구
```bash
# 백업에서 복원
pm2 stop ict-quiz
cp /path/to/backup/quiz.db database/quiz.db
pm2 start ict-quiz
```

#### 3. 비밀번호 재설정
```bash
# 모든 사용자 비밀번호 재설정 요구
# 관리자 비밀번호 직접 변경
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('new_admin_password', 10, (err, hash) => {
  console.log(hash);
});
"

sqlite3 database/quiz.db
UPDATE users
SET password = '{생성된_해시}'
WHERE role = 'admin';
```

---

## 정기 보안 점검

### 주간 점검
```bash
#!/bin/bash
# weekly_security_check.sh

echo "=== 주간 보안 점검 ==="

# 1. 로그 확인
echo "1. 로그 확인"
grep -i "error\|failed\|unauthorized" logs/server.log | tail -20

# 2. 비정상 로그인 시도
echo "2. 비정상 로그인 시도"
grep "login" logs/server.log | grep "failed" | wc -l

# 3. 디스크 사용량
echo "3. 디스크 사용량"
df -h | grep database

# 4. 최근 변경된 파일
echo "4. 최근 7일간 변경된 파일"
find . -type f -mtime -7 -ls

echo "=== 점검 완료 ==="
```

### 월간 점검
- [ ] 의존성 업데이트 확인 (`npm audit`)
- [ ] 사용자 권한 검토
- [ ] Access Control 목록 검토
- [ ] 백업 무결성 확인
- [ ] SSL 인증서 만료일 확인
- [ ] 보안 패치 적용

### 분기 점검
- [ ] 보안 감사
- [ ] 침투 테스트
- [ ] 재해 복구 계획 테스트
- [ ] 보안 교육

---

## 보안 모범 사례

### 개발 단계
1. **코드 리뷰**: 모든 코드 변경 리뷰
2. **정적 분석**: ESLint, SonarQube 사용
3. **의존성 검사**: `npm audit` 정기 실행
4. **비밀 정보 스캔**: git-secrets 사용

### 배포 단계
1. **환경 분리**: 개발/스테이징/프로덕션
2. **변경 관리**: 배포 전 승인 프로세스
3. **롤백 계획**: 문제 발생 시 즉시 롤백
4. **모니터링**: 배포 후 24시간 모니터링

### 운영 단계
1. **로그 모니터링**: 실시간 로그 분석
2. **알림 설정**: 이상 징후 즉시 알림
3. **정기 백업**: 매일 자동 백업
4. **보안 업데이트**: 월 1회 이상

---

## 규정 준수

### 개인정보보호법
- 사용자 동의 없는 정보 수집 금지
- 목적 외 사용 금지
- 안전한 저장 및 파기
- 개인정보 처리방침 명시

### 정보보호 관리체계 (ISMS)
- 정보보호 정책 수립
- 위험 관리
- 사고 대응 체계
- 정기 점검 및 개선

---

## 연락처

**보안 사고 신고:**
- 정보보호팀: security@company.com
- 긴급: 02-1234-5678

**보안 자문:**
- CISO: ciso@company.com
- 보안 담당자: security-admin@company.com

---

## 부록

### 보안 도구

#### npm audit
```bash
cd server
npm audit
npm audit fix
```

#### OWASP ZAP (취약점 스캔)
```bash
zap-cli quick-scan --self-contained \
  http://localhost:3001
```

#### SSL Labs (HTTPS 테스트)
```
https://www.ssllabs.com/ssltest/
```

### 보안 체크리스트 (요약)

**필수:**
- [ ] 강력한 비밀 키 사용
- [ ] HTTPS 활성화
- [ ] 최신 보안 패치 적용
- [ ] 정기 백업
- [ ] 로그 모니터링

**권장:**
- [ ] Rate limiting
- [ ] CSRF 보호
- [ ] WAF (Web Application Firewall)
- [ ] IDS/IPS
- [ ] 정기 보안 감사

---

**버전**: 1.0
**최종 업데이트**: 2025-01-06
