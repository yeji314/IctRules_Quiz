# Swing SSO 인증 테스트 가이드

## 📋 개요

ICT Quiz 프로젝트에 구현된 Swing SSO 토큰 인증을 테스트하는 가이드입니다.

**구현 완료일**: 2025-11-22
**버전**: 1.0.0

---

## 🎯 구현된 기능

### ✅ 완료된 항목

1. **백엔드 SSO 미들웨어**: 모든 요청에서 `gw_sso_auth_code` 자동 감지
2. **프론트엔드 SSO 토큰 처리**: URL 파라미터로 전달된 토큰 자동 처리
3. **권한 확인 로직**: `SSOSettings` 테이블 기반 사번/부서 체크
4. **자동 리다이렉트**: 인증 후 자동으로 퀴즈 목록 페이지로 이동
5. **사용자 생성/업데이트**: Swing 정보로 자동 동기화

---

## 🔄 SSO 인증 전체 흐름

```
Swing 포털
    ↓ (사용자가 앱 링크 클릭)
https://your-app.com?gw_sso_auth_code=xxxxx
    ↓
백엔드 SSO 미들웨어 (자동 감지)
    ↓
Swing API 호출 (/cau/v1/oauth-code-simple)
    ↓
권한 확인 (SSOSettings 기반)
    ↓
사용자 조회/생성 (DB)
    ↓
JWT 토큰 생성
    ↓
리다이렉트 (/pages/quiz-list.html?auth_token=xxx)
    ↓
프론트엔드 토큰 처리
    ↓
퀴즈 목록 페이지 표시
```

---

## 🧪 테스트 방법

### 1️⃣ 개발 환경 설정

#### `.env` 파일 설정

```bash
# Swing SSO 설정 (Mock 환경)
SWING_SSO_ENABLED=true
SWING_SSO_ENV=mock
SWING_API_BASE_URL=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID=mock_client_id
SWING_CLIENT_SECRET=mock_client_secret
SWING_AUTO_CREATE_USER=true
SWING_SYNC_USER_INFO=true

# 권한 제어 (옵션)
SWING_ACCESS_CONTROL_TYPE=none  # none | employee_list | department_list
```

#### 데이터베이스 마이그레이션 실행

```bash
cd server
npm run migrate
```

### 2️⃣ Mock Swing 서버 실행

실제 Swing 서버 없이 테스트하기 위한 Mock 서버를 실행합니다.

```bash
cd server
node mock-swing-server.js
```

**예상 출력:**
```
Mock Swing Server 시작됨: http://127.0.0.1:8055/swing-mock-server
테스트 토큰: test_token_valid_user
```

### 3️⃣ 애플리케이션 서버 실행

```bash
cd server
npm start
```

**예상 출력:**
```
서버 실행 중: http://localhost:3001
Swing SSO 미들웨어 활성화됨
```

### 4️⃣ SSO 로그인 테스트

#### 방법 1: 브라우저에서 직접 테스트

SSO 토큰이 포함된 URL로 접속:

```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```

**예상 동작:**
1. 백엔드 미들웨어가 토큰 감지
2. Swing Mock 서버에 인증 요청
3. 사용자 정보 조회/생성
4. JWT 토큰 생성
5. `/pages/quiz-list.html?auth_token=xxx&sso_login=true` 로 리다이렉트
6. 프론트엔드가 토큰 저장
7. 퀴즈 목록 페이지 표시

**콘솔 로그 확인:**
```
[Swing SSO] 토큰 감지: test_token_valid_user...
[Swing SSO] 인증 성공: { employeeNo: '12345678', name: '홍길동', ... }
[Swing SSO] 권한 확인 통과
[Swing SSO] 신규 사용자 생성: 12345678
[Swing SSO] JWT 토큰 생성 완료
[Swing SSO] 리다이렉트: /pages/quiz-list.html?auth_token=...
```

#### 방법 2: cURL로 API 테스트

```bash
# SSO 토큰으로 인증
curl -v "http://localhost:3001?gw_sso_auth_code=test_token_valid_user"
```

**예상 응답:**
```
HTTP/1.1 302 Found
Location: /pages/quiz-list.html?auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly
```

#### 방법 3: 기존 POST API 테스트

```bash
# 직접 API 호출
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "test_token_valid_user"}'
```

**예상 응답:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "employee_id": "12345678",
    "name": "홍길동",
    "department": "IT개발팀",
    "email": "hong@shinhan.com",
    "role": "user"
  },
  "login_method": "swing_sso"
}
```

---

## 🔐 권한 제어 테스트

### 사번 목록으로 제한

#### 1. 데이터베이스에서 설정 변경

```sql
-- SQLite
sqlite3 ../database/quiz.db

-- access_control_type을 'employee_list'로 변경
UPDATE sso_settings 
SET setting_value = '"employee_list"' 
WHERE setting_key = 'access_control_type';

-- 허용 사번 목록 설정
UPDATE sso_settings 
SET setting_value = '["12345678", "87654321"]' 
WHERE setting_key = 'employee_list';
```

#### 2. 테스트

**허용된 사번으로 접속:**
```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```
→ ✅ 로그인 성공

**허용되지 않은 사번으로 접속:**
```
http://localhost:3001?gw_sso_auth_code=test_token_other_user
```
→ ❌ 403 Forbidden 에러

**예상 응답:**
```json
{
  "error": "홍길동(99999999)는 로그인이 허용되지 않은 사용자입니다."
}
```

### 부서 목록으로 제한

```sql
-- access_control_type을 'department_list'로 변경
UPDATE sso_settings 
SET setting_value = '"department_list"' 
WHERE setting_key = 'access_control_type';

-- 허용 부서 목록 설정
UPDATE sso_settings 
SET setting_value = '["IT개발팀", "기획팀"]' 
WHERE setting_key = 'department_list';
```

---

## 🐛 문제 해결

### 1. SSO 토큰이 감지되지 않음

**증상:**
```
URL: http://localhost:3001?gw_sso_auth_code=xxxxx
→ 일반 로그인 페이지로 이동
```

**해결:**
1. `server/app.js`에 미들웨어가 등록되었는지 확인
2. 서버 재시작 (`npm start`)
3. 콘솔 로그 확인

### 2. Swing API 호출 실패

**증상:**
```
[Swing SSO] Swing SSO 인증 오류: API Call Failed
```

**해결:**
1. Mock Swing 서버가 실행 중인지 확인
   ```bash
   curl http://127.0.0.1:8055/swing-mock-server/health
   ```
2. `.env` 파일의 `SWING_API_BASE_URL` 확인
3. Mock 서버 재시작

### 3. 권한 거부 에러

**증상:**
```
403 Forbidden: 홍길동(12345678)는 로그인이 허용되지 않은 사용자입니다.
```

**해결:**
```sql
-- 접근 제어 비활성화
UPDATE sso_settings 
SET setting_value = '"none"' 
WHERE setting_key = 'access_control_type';
```

또는

```sql
-- 사번을 허용 목록에 추가
UPDATE sso_settings 
SET setting_value = '["12345678", "87654321", "새로운사번"]' 
WHERE setting_key = 'employee_list';
```

### 4. 프론트엔드 토큰 처리 실패

**증상:**
```
리다이렉트는 되지만 로그인이 안 됨
```

**해결:**
1. 브라우저 개발자 도구 → Console 탭 확인
2. localStorage 확인: `localStorage.getItem('auth_token')`
3. 네트워크 탭에서 `/api/auth/me` 요청 확인

---

## 📊 테스트 체크리스트

### 기본 기능

- [ ] SSO 토큰으로 로그인 성공
- [ ] 신규 사용자 자동 생성
- [ ] 기존 사용자 정보 업데이트
- [ ] JWT 토큰 발급
- [ ] 퀴즈 목록 페이지로 리다이렉트

### 권한 제어

- [ ] 접근 제어 없음 (`none`) - 모든 사용자 허용
- [ ] 사번 목록 제어 (`employee_list`) - 허용된 사번만
- [ ] 부서 목록 제어 (`department_list`) - 허용된 부서만
- [ ] 와일드카드 (`*`) - 모든 사용자/부서 허용

### 에러 처리

- [ ] 유효하지 않은 토큰 → 인증 실패
- [ ] 권한 없는 사용자 → 403 Forbidden
- [ ] Swing API 오류 → 에러 페이지 표시
- [ ] 네트워크 오류 → 에러 메시지 표시

### UI/UX

- [ ] 로딩 중 메시지 표시
- [ ] 성공 메시지 표시
- [ ] 에러 메시지 표시
- [ ] 효과음 재생 (성공/실패)

---

## 🚀 운영 환경 배포

### 환경 변수 설정

```bash
# 운영 환경 설정
SWING_SSO_ENABLED=true
SWING_SSO_ENV=prod
SWING_API_BASE_URL=https://swing.shinhan.com
SWING_CLIENT_ID=your_production_client_id
SWING_CLIENT_SECRET=your_production_client_secret
SWING_AUTO_CREATE_USER=true
SWING_SYNC_USER_INFO=true

# 보안 설정
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
```

### Swing 포털 설정

Swing 포털 관리자에게 요청:

1. **애플리케이션 등록**
   - 앱 이름: ICT Quiz
   - 리다이렉트 URL: `https://your-domain.com?gw_sso_auth_code={TOKEN}`

2. **Client 정보 발급**
   - clientId, clientSecret 수령

3. **테스트 계정으로 검증**

---

## 📝 Mock 사용자 데이터

Mock Swing 서버에서 사용 가능한 테스트 토큰:

| 토큰 | 사번 | 이름 | 부서 | 이메일 |
|------|------|------|------|--------|
| `test_token_valid_user` | 12345678 | 홍길동 | IT개발팀 | hong@shinhan.com |
| `test_token_admin` | 19200617 | 관리자 | 경영지원팀 | admin@shinhan.com |
| `test_token_other_user` | 87654321 | 김철수 | 영업팀 | kim@shinhan.com |

---

## 🔍 디버깅 팁

### 상세 로그 활성화

```bash
# .env 파일에 추가
DEBUG=swing:*
SWING_VERBOSE_LOG=true
```

### 서버 로그 확인

```bash
# 실시간 로그 모니터링
tail -f server.log | grep "Swing SSO"
```

### 네트워크 요청 추적

브라우저 개발자 도구 → Network 탭:
1. `/api/auth/swing/token` 요청 확인
2. `/api/auth/me` 요청 확인
3. 응답 상태 코드 확인

---

## ✅ 완료 확인

모든 테스트가 통과하면 SSO 인증 구현이 완료된 것입니다!

```bash
✓ 백엔드 SSO 미들웨어 동작
✓ Swing API 호출 성공
✓ 사용자 생성/업데이트 동작
✓ JWT 토큰 발급
✓ 프론트엔드 토큰 처리
✓ 자동 리다이렉트
✓ 권한 제어 동작
```

---

## 📞 문의

문제가 발생하면 다음을 확인하세요:

1. 서버 콘솔 로그
2. 브라우저 개발자 도구 Console
3. 네트워크 탭
4. 데이터베이스 상태 (`sso_settings`, `users` 테이블)

Happy Testing! 🎉

