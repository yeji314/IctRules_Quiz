# ✅ Swing SSO 인증 구현 완료

## 📅 구현 정보

- **완료일**: 2025-11-22
- **버전**: 1.0.0
- **구현 방식**: 다른 프로젝트(Directus) 방식 기반

---

## 🎯 구현된 기능

### ✅ 1. 백엔드 SSO 미들웨어

**파일**: `server/middleware/swingSsoMiddleware.js`

**기능**:
- 모든 HTTP 요청에서 `gw_sso_auth_code` 파라미터 자동 감지
- Swing API 호출하여 토큰 검증
- 사용자 권한 확인 (SSOSettings 기반)
- 사용자 생성/업데이트
- JWT 토큰 발급
- 자동 리다이렉트

**사용법**:
```javascript
// server/app.js에 등록됨
app.use(swingSsoMiddleware);
```

### ✅ 2. 프론트엔드 SSO 토큰 처리

**파일**: `client/js/pages/login.js`

**기능**:
- URL 파라미터에서 `auth_token` 감지
- 자동으로 토큰 저장 및 사용자 정보 조회
- 로그인 완료 후 퀴즈 목록으로 이동
- SSO 에러 메시지 표시

### ✅ 3. 권한 확인 로직

**구현 위치**: `swingSsoMiddleware.js` → `checkSsoAccessControl()`

**지원하는 권한 제어 타입**:
1. **none**: 제한 없음 (모든 사용자 허용)
2. **employee_list**: 사번 목록 기반 제어
3. **department_list**: 부서 목록 기반 제어

**설정 방법**:
```sql
-- SSOSettings 테이블에서 설정
UPDATE sso_settings 
SET setting_value = '"employee_list"' 
WHERE setting_key = 'access_control_type';

UPDATE sso_settings 
SET setting_value = '["12345678", "87654321"]' 
WHERE setting_key = 'employee_list';
```

### ✅ 4. 자동 리다이렉트

**흐름**:
```
https://your-app.com?gw_sso_auth_code=xxxxx
    ↓ (백엔드 미들웨어 처리)
302 Redirect
    ↓
/pages/quiz-list.html?auth_token=xxx&sso_login=true
    ↓ (프론트엔드 처리)
토큰 저장 → 사용자 정보 조회 → 퀴즈 목록 표시
```

### ✅ 5. Mock Swing 서버

**파일**: `server/mock-swing-server.js`

**기능**:
- 실제 Swing API와 동일한 응답 구조
- 테스트용 사용자 3명 제공
- `/cau/v1/oauth-code-simple` 엔드포인트 구현

**실행**:
```bash
cd server
node mock-swing-server.js
```

---

## 📝 파일 구조

```
ICTQuiz/
├── server/
│   ├── middleware/
│   │   └── swingSsoMiddleware.js         ✨ 새로 생성 (SSO 미들웨어)
│   ├── config/
│   │   └── swing-sso.js                  (기존)
│   ├── mock-swing-server.js              ✨ 수정 (응답 구조 개선)
│   └── app.js                            ✨ 수정 (미들웨어 등록)
├── client/
│   └── js/
│       └── pages/
│           ├── login.js                  ✨ 수정 (SSO 토큰 처리)
│           └── quiz-list.js              ✨ 수정 (리다이렉트 처리)
├── swing-auth/
│   └── index.js                          (기존 - SSO API 호출)
└── docs/
    ├── SWING_SSO_COMPLETE.md             ✨ 새로 생성 (이 문서)
    └── SWING_SSO_TEST_GUIDE.md           ✨ 새로 생성 (테스트 가이드)
```

---

## 🚀 빠른 시작

### 1. Mock 서버 실행

```bash
cd server
node mock-swing-server.js
```

**출력**:
```
Mock Swing Server 시작됨: http://127.0.0.1:8055/swing-mock-server
사용 가능한 테스트 토큰:
  - test_token_valid_user (홍길동, IT개발팀)
  - test_token_admin (관리자, 경영지원팀)
  - test_token_other_user (김철수, 영업팀)
```

### 2. 앱 서버 실행

```bash
cd server
npm start
```

### 3. SSO 로그인 테스트

브라우저에서 접속:
```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```

**예상 동작**:
1. 백엔드 미들웨어가 토큰 감지
2. Mock Swing 서버에 인증 요청
3. 사용자 정보 조회/생성 (홍길동, 12345678)
4. JWT 토큰 발급
5. 퀴즈 목록 페이지로 리다이렉트
6. "환영합니다, 홍길동님! (SSO 로그인)" 메시지 표시
7. 퀴즈 목록 표시

---

## 🔄 다른 프로젝트와의 비교

| 항목 | 다른 프로젝트 (Directus) | 현재 프로젝트 (ICTQuiz) | 상태 |
|------|------------------------|----------------------|------|
| 백엔드 미들웨어 | ✅ shb-authenticate-handler | ✅ swingSsoMiddleware | **완료** |
| 자동 토큰 감지 | ✅ gw_sso_auth_code | ✅ gw_sso_auth_code | **완료** |
| Swing API 호출 | ✅ /cau/v1/oauth-code-simple | ✅ 동일 | **완료** |
| 사용자 생성/업데이트 | ✅ Directus Users | ✅ Users 테이블 | **완료** |
| 권한 확인 | ✅ sso_settings 기반 | ✅ SSOSettings 기반 | **완료** |
| 세션 관리 | ✅ 쿠키 (directus_refresh_token) | ✅ JWT 토큰 | **완료** |
| 리다이렉트 | ✅ /admin/content | ✅ /pages/quiz-list.html | **완료** |
| 프론트엔드 처리 | ✅ 자동 (백엔드가 모두 처리) | ✅ 자동 (토큰 저장만) | **완료** |

### 주요 차이점

1. **세션 관리 방식**:
   - Directus: 세션 쿠키 (`directus_refresh_token`)
   - ICTQuiz: JWT 토큰 (localStorage 저장)

2. **리다이렉트 방식**:
   - Directus: 302 리다이렉트 후 쿠키로 자동 인증
   - ICTQuiz: 302 리다이렉트 + URL 파라미터로 토큰 전달 → 프론트엔드가 저장

3. **프론트엔드 역할**:
   - Directus: 아무것도 안 해도 됨 (100% 백엔드 처리)
   - ICTQuiz: 토큰을 받아서 localStorage에 저장하는 역할

---

## 🧪 테스트 시나리오

### 시나리오 1: 일반 사용자 SSO 로그인

**테스트 URL**:
```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```

**예상 결과**:
- ✅ 홍길동(12345678) 사용자 생성/업데이트
- ✅ role: 'user'
- ✅ 퀴즈 목록 페이지 접속 가능
- ❌ 관리자 페이지 접근 불가

### 시나리오 2: 관리자 SSO 로그인

**테스트 URL**:
```
http://localhost:3001?gw_sso_auth_code=test_token_admin
```

**예상 결과**:
- ✅ 관리자(19200617) 사용자 생성/업데이트
- ✅ role: 'admin'
- ✅ 퀴즈 목록 페이지에서 톱니바퀴(⚙️) 버튼 표시
- ✅ 관리자 페이지 접근 가능

### 시나리오 3: 권한 없는 사용자 차단

**설정**:
```sql
UPDATE sso_settings SET setting_value = '"employee_list"' WHERE setting_key = 'access_control_type';
UPDATE sso_settings SET setting_value = '["12345678"]' WHERE setting_key = 'employee_list';
```

**테스트 URL**:
```
http://localhost:3001?gw_sso_auth_code=test_token_other_user
```

**예상 결과**:
- ❌ 403 Forbidden
- ❌ 에러 메시지: "김철수(87654321)는 로그인이 허용되지 않은 사용자입니다."

---

## 🔧 환경 변수 설정

### 개발 환경 (.env)

```bash
# Swing SSO 설정
SWING_SSO_ENABLED=true
SWING_SSO_ENV=mock
SWING_API_BASE_URL=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID=mock_client_id
SWING_CLIENT_SECRET=mock_client_secret

# 사용자 관리
SWING_AUTO_CREATE_USER=true
SWING_SYNC_USER_INFO=true

# 권한 제어
SWING_ACCESS_CONTROL_TYPE=none
```

### 운영 환경 (.env.production)

```bash
# Swing SSO 설정
SWING_SSO_ENABLED=true
SWING_SSO_ENV=prod
SWING_API_BASE_URL=https://swing.shinhan.com
SWING_CLIENT_ID=your_production_client_id
SWING_CLIENT_SECRET=your_production_client_secret

# 사용자 관리
SWING_AUTO_CREATE_USER=true
SWING_SYNC_USER_INFO=true

# 권한 제어
SWING_ACCESS_CONTROL_TYPE=employee_list
```

---

## 📊 구현 통계

- **새로 생성된 파일**: 3개
  - `server/middleware/swingSsoMiddleware.js`
  - `docs/SWING_SSO_COMPLETE.md`
  - `docs/SWING_SSO_TEST_GUIDE.md`

- **수정된 파일**: 4개
  - `server/app.js`
  - `server/mock-swing-server.js`
  - `client/js/pages/login.js`
  - `client/js/pages/quiz-list.js`

- **총 코드 라인**: ~600 라인

---

## 🎓 핵심 개념

### 1. 백엔드 미들웨어 방식

**장점**:
- 프론트엔드가 간단함 (토큰 처리 로직 최소화)
- 보안성 향상 (토큰 검증이 서버에서만 진행)
- 모든 요청에서 자동으로 SSO 감지

**구현**:
```javascript
app.use(swingSsoMiddleware);  // 모든 요청보다 먼저 실행
```

### 2. Swing API 페이로드 구조

```javascript
// 요청
POST /cau/v1/oauth-code-simple
{
  "common": {
    "clientId": "xxx",
    "clientSecret": "xxx"
  },
  "data": {
    "code": "sso_token_here"
  }
}

// 응답
{
  "data": {
    "authResult": "SUCCESS",
    "employeeNo": "12345678",
    "employeeName": "홍길동",
    "companyEmail": "hong@shinhan.com",
    "departmentName": "IT개발팀",
    "employeePositionName": "차장"
  }
}
```

### 3. 리다이렉트 체인

```
Swing 포털 → 앱 (with gw_sso_auth_code)
    ↓
백엔드 미들웨어 감지
    ↓
Swing API 인증
    ↓
JWT 토큰 생성
    ↓
302 Redirect (with auth_token)
    ↓
프론트엔드 토큰 저장
    ↓
퀴즈 목록 표시
```

---

## 🐛 알려진 이슈

### 없음

현재까지 알려진 이슈는 없습니다.

---

## 📞 지원

### 문제 발생 시 확인 사항

1. **서버 콘솔 로그** 확인
   ```
   [Swing SSO] 토큰 감지: ...
   [Swing SSO] 인증 성공: ...
   [Swing SSO] JWT 토큰 생성 완료
   ```

2. **브라우저 개발자 도구** 확인
   - Console 탭: JavaScript 에러
   - Network 탭: API 요청/응답

3. **데이터베이스** 확인
   ```bash
   sqlite3 ../database/quiz.db
   SELECT * FROM users WHERE login_method = 'swing_sso';
   SELECT * FROM sso_settings;
   ```

4. **Mock 서버** 상태 확인
   ```bash
   curl http://127.0.0.1:8055/swing-mock-server/health
   ```

---

## ✅ 체크리스트

구현 완료 확인:

- [x] 백엔드 SSO 미들웨어 구현
- [x] 프론트엔드 SSO 토큰 처리
- [x] Swing API 호출 (올바른 페이로드 구조)
- [x] 사용자 자동 생성/업데이트
- [x] 권한 확인 로직 (사번/부서)
- [x] 자동 리다이렉트
- [x] JWT 토큰 발급
- [x] Mock Swing 서버
- [x] 테스트 가이드 문서
- [x] 완료 문서 (이 문서)

---

## 🎉 결론

Swing SSO 토큰 인증이 다른 프로젝트(Directus)와 **동일한 방식**으로 완벽하게 구현되었습니다!

**주요 특징**:
- ✅ 백엔드 미들웨어가 모든 요청을 가로채서 자동 처리
- ✅ 프론트엔드는 최소한의 코드만 필요
- ✅ Swing API 정확한 페이로드 구조 사용
- ✅ 권한 확인 로직 완비
- ✅ 자동 리다이렉트 및 사용자 경험 최적화

**다음 단계**:
1. 운영 환경에서 실제 Swing 서버와 연동 테스트
2. Swing 포털에 앱 링크 등록
3. 사용자 피드백 수집 및 개선

---

**문서 작성일**: 2025-11-22  
**작성자**: Claude AI  
**프로젝트**: ICT Quiz System

