# ✅ Swing SSO 인증 - 간소화 버전

## 📌 요약

기존 API를 활용한 **간단한 SSO 구현**입니다. 새로운 미들웨어 파일 없이 기존 코드만 수정했습니다.

---

## 🎯 구현 방식

### ❌ 미들웨어 방식 (복잡) → ✅ 기존 API 활용 (간단)

**기존 코드 활용**:
- ✅ `POST /api/auth/swing/token` API 사용 (이미 있음)
- ✅ `authController.swingSsoTokenLogin` 함수 활용 (이미 있음)
- ✅ 프론트엔드에서 URL 파라미터 감지 후 API 호출

**장점**:
- 새 파일 불필요
- 코드가 더 간단하고 명확
- 디버깅 쉬움

---

## 📝 수정된 파일

### 1. `server/controllers/authController.js`

**추가된 기능**:
- `checkSsoAccessControl()` 함수 - SSOSettings 기반 권한 확인
- 로그 추가 (인증 성공, 권한 확인 등)

```javascript
// Swing 인증 후
const swingUser = await doSwingAuthenticate({ type: 'sso', ssoToken: sso_token });

// 권한 확인 (SSOSettings 기반)
const accessCheck = await checkSsoAccessControl(swingUser);
if (!accessCheck.allowed) {
  return res.status(403).json({ error: accessCheck.reason });
}

// 사용자 생성/업데이트 및 JWT 토큰 발급
```

### 2. `client/js/pages/login.js`

**추가된 기능**:
- `handleSsoLogin()` 함수 - URL 파라미터에서 SSO 토큰 감지
- 자동으로 `/api/auth/swing/token` API 호출

```javascript
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('gw_sso_auth_code');
  
  if (ssoToken) {
    handleSsoLogin(ssoToken);  // 자동 SSO 로그인
    return;
  }
  
  // ... 일반 로그인 폼 처리
}
```

### 3. `client/js/pages/quiz-list.js`

**변경 사항**: 불필요한 코드 제거 (간소화)

---

## 🔄 SSO 인증 흐름

```
1. Swing 포털에서 링크 클릭
   ↓
   https://your-app.com?gw_sso_auth_code=xxxxx

2. 프론트엔드 (login.js)
   ↓
   URL 파라미터에서 gw_sso_auth_code 감지
   
3. API 호출
   ↓
   POST /api/auth/swing/token
   { "sso_token": "xxxxx" }

4. 백엔드 (authController.js)
   ↓
   - Swing API 호출 (/cau/v1/oauth-code-simple)
   - 권한 확인 (SSOSettings 기반)
   - 사용자 생성/업데이트
   - JWT 토큰 발급

5. 프론트엔드
   ↓
   - 토큰 저장 (localStorage)
   - 사용자 정보 저장
   - 퀴즈 목록 페이지로 이동

6. 완료!
   ↓
   "환영합니다, 홍길동님! (SSO 로그인)"
```

---

## 🚀 테스트 방법

### 1단계: Mock Swing 서버 실행

```bash
cd server
node mock-swing-server.js
```

### 2단계: 앱 서버 실행

```bash
cd server
npm start
```

### 3단계: 브라우저에서 테스트

SSO 토큰과 함께 접속:

```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```

**예상 동작**:
1. 로그인 페이지에서 SSO 토큰 감지
2. 자동으로 API 호출
3. "SSO 로그인 처리 중..." 메시지 표시
4. 사용자 생성/업데이트 (홍길동, 12345678)
5. "환영합니다, 홍길동님! (SSO 로그인)" 메시지
6. 퀴즈 목록 페이지로 이동

### 4단계: 권한 제어 테스트

#### 사번 목록으로 제한

```sql
-- SQLite
sqlite3 ../database/quiz.db

UPDATE sso_settings 
SET setting_value = '"employee_list"' 
WHERE setting_key = 'access_control_type';

UPDATE sso_settings 
SET setting_value = '["12345678"]' 
WHERE setting_key = 'employee_list';
```

**허용된 사번 (12345678)**:
```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```
→ ✅ 로그인 성공

**허용되지 않은 사번 (87654321)**:
```
http://localhost:3001?gw_sso_auth_code=test_token_other_user
```
→ ❌ 403 Forbidden: "김철수(87654321)는 로그인이 허용되지 않은 사용자입니다."

---

## 🔐 권한 제어 타입

### 1. 제한 없음 (기본값)

```sql
UPDATE sso_settings 
SET setting_value = '"none"' 
WHERE setting_key = 'access_control_type';
```

→ 모든 사용자 허용

### 2. 사번 목록 제어

```sql
UPDATE sso_settings 
SET setting_value = '"employee_list"' 
WHERE setting_key = 'access_control_type';

UPDATE sso_settings 
SET setting_value = '["12345678", "19200617"]' 
WHERE setting_key = 'employee_list';
```

→ 12345678, 19200617만 허용

### 3. 부서 목록 제어

```sql
UPDATE sso_settings 
SET setting_value = '"department_list"' 
WHERE setting_key = 'access_control_type';

UPDATE sso_settings 
SET setting_value = '["IT개발팀", "경영지원팀"]' 
WHERE setting_key = 'department_list';
```

→ IT개발팀, 경영지원팀만 허용

---

## 🧪 Mock 테스트 토큰

| 토큰 | 사번 | 이름 | 부서 |
|------|------|------|------|
| `test_token_valid_user` | 12345678 | 홍길동 | IT개발팀 |
| `test_token_admin` | 19200617 | 관리자 | 경영지원팀 |
| `test_token_other_user` | 87654321 | 김철수 | 영업팀 |

---

## 📊 파일 변경 요약

| 파일 | 상태 | 변경 내용 |
|------|------|-----------|
| `server/controllers/authController.js` | ✏️ 수정 | 권한 확인 로직 추가 |
| `client/js/pages/login.js` | ✏️ 수정 | SSO 토큰 감지 및 API 호출 |
| `client/js/pages/quiz-list.js` | ✏️ 수정 | 불필요한 코드 제거 |
| `server/app.js` | ✏️ 수정 | 미들웨어 import 제거 |
| `server/mock-swing-server.js` | ✏️ 수정 | 페이로드 구조 개선 |
| ~~`server/middleware/swingSsoMiddleware.js`~~ | ❌ 삭제 | 불필요 (기존 API 활용) |

**총 라인**: ~150 라인 (미들웨어 방식 대비 70% 감소)

---

## ✅ 체크리스트

- [x] 기존 API 활용 (`POST /api/auth/swing/token`)
- [x] 프론트엔드 SSO 토큰 감지
- [x] Swing API 호출 (정확한 페이로드)
- [x] 권한 확인 (사번/부서 목록)
- [x] 사용자 생성/업데이트
- [x] JWT 토큰 발급
- [x] 자동 로그인 처리
- [x] Mock Swing 서버
- [x] 린터 에러 없음

---

## 🎉 결론

**미들웨어 없이 기존 코드만으로 SSO 인증 완성!**

- ✅ 간단하고 명확한 코드
- ✅ 디버깅 쉬움
- ✅ 유지보수 편리
- ✅ 다른 프로젝트 방식과 동일한 기능

---

**문서 작성일**: 2025-11-22  
**방식**: 기존 API 활용 (간소화)

