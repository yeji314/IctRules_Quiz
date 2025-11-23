# 🔐 Swing 인증 시스템 가이드

> ICT 퀴즈 프로젝트의 Swing SSO 통합 인증 가이드

---

## 📋 목차

1. [개요](#개요)
2. [인증 방식](#인증-방식)
3. [환경 설정](#환경-설정)
4. [SSO 인증 흐름](#sso-인증-흐름)
5. [ID/PW 인증 흐름](#idpw-인증-흐름)
6. [Mock 서버 사용](#mock-서버-사용)
7. [관리자 권한](#관리자-권한)
8. [API 엔드포인트](#api-엔드포인트)
9. [트러블슈팅](#트러블슈팅)

---

## 개요

이 프로젝트는 **Swing** 통합 인증 시스템을 사용합니다.

### 지원하는 인증 방식

| 인증 방식 | 설명 | 사용 시나리오 |
|---------|------|-------------|
| **SSO 토큰** | Swing에서 발급한 토큰으로 자동 로그인 | 그룹웨어에서 접근 시 |
| **ID/Password** | 사번과 비밀번호로 로그인 | 직접 접근 시 |
| **로컬 Admin** | 로컬 DB의 admin 계정 | 관리자 전용 (Swing 우회) |

---

## 인증 방식

### 1️⃣ SSO 토큰 인증

**흐름:**
```
그룹웨어 → 퀴즈 시스템 (URL에 gw_sso_auth_code 포함)
→ 자동으로 토큰 추출 및 Swing 서버 검증
→ 로그인 완료
```

**URL 예시:**
```
http://quiz.shinhan.com/?gw_sso_auth_code=ABC123XYZ...
```

**처리 파일:**
- `client/js/pages/login.js` - 토큰 감지 및 자동 로그인
- `server/controllers/authController.js` - `swingSsoTokenLogin` 함수

---

### 2️⃣ ID/Password 인증

**흐름:**
```
사용자 입력 (사번 + 비밀번호)
→ Swing 서버에 SHA256 해시된 비밀번호로 검증
→ 사용자 정보 반환
→ 로컬 DB에 사용자 생성/업데이트
→ JWT 토큰 발급
```

**API:**
```http
POST /api/auth/swing/idpw
Content-Type: application/json

{
  "employee_id": "12345678",
  "password": "mypassword"
}
```

**처리 파일:**
- `server/controllers/authController.js` - `swingIdPasswordLogin` 함수
- `swing-auth/index.js` - `swingIdPasswordAuth` 함수

---

### 3️⃣ 로컬 Admin 계정

**특징:**
- Swing 인증을 거치지 않음
- 로컬 DB의 bcrypt 해시된 비밀번호로 검증
- 관리자 전용 계정 (`employee_id: 'admin'`)

**API:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "employee_id": "admin",
  "password": "admin1234"
}
```

---

## 환경 설정

### 환경 변수 (`OPERATION_MODE`)

프로젝트는 3가지 환경을 지원합니다:

| 환경 | `OPERATION_MODE` 값 | 설명 |
|------|-------------------|------|
| **운영** | `production` 또는 `prod` | 실제 Swing 서버 사용 |
| **개발** | `development` 또는 `dev` | 개발 Swing 서버 사용 |
| **Mock** | `mock` (기본값) | 로컬 Mock 서버 사용 |

### 환경별 Swing 엔드포인트

**파일: `swing-auth/env.js`**

```javascript
const config = {
  prod: {
    swingEndpoint: 'https://apigw.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_PROD || '',
    clientSecret: process.env.SWING_CLIENT_SECRET_PROD || '',
    companyCode: 'SH'
  },
  dev: {
    swingEndpoint: 'https://apigwdev.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_DEV || '',
    clientSecret: process.env.SWING_CLIENT_SECRET_DEV || '',
    companyCode: 'SH'
  },
  mock: {
    swingEndpoint: 'http://127.0.0.1:8055/swing-mock-server',
    clientId: '5FACKST52XY6YDLM',
    clientSecret: 'YPZCWH4ZXLDGBVUX',
    companyCode: 'SH'
  }
};
```

### 환경 변수 설정 예시

**운영 환경:**
```bash
OPERATION_MODE=production
SWING_CLIENT_ID_PROD=your_client_id
SWING_CLIENT_SECRET_PROD=your_client_secret
```

**개발 환경:**
```bash
OPERATION_MODE=development
SWING_CLIENT_ID_DEV=your_dev_client_id
SWING_CLIENT_SECRET_DEV=your_dev_client_secret
```

**Mock 환경:**
```bash
OPERATION_MODE=mock
# Mock 환경은 별도 설정 불필요
```

---

## SSO 인증 흐름

### 📊 시퀀스 다이어그램

```
그룹웨어           퀴즈 Frontend        퀴즈 Backend         Swing Server
   |                     |                    |                     |
   |---(1) URL + Token-->|                    |                     |
   |                     |                    |                     |
   |                (2) 토큰 감지              |                     |
   |                     |                    |                     |
   |                     |---(3) POST Token-->|                     |
   |                     |                    |                     |
   |                     |                    |---(4) 토큰 검증---->|
   |                     |                    |                     |
   |                     |                    |<---(5) 사용자 정보--|
   |                     |                    |                     |
   |                     |             (6) DB에 사용자 생성/업데이트  |
   |                     |                    |                     |
   |                     |<---(7) JWT 토큰 + 사용자 정보-------------|
   |                     |                    |
   |                (8) localStorage 저장      |
   |                     |                    |
   |                (9) quiz-list.html로 이동 |
```

### 코드 흐름

**1. Frontend: 토큰 감지 (`client/js/pages/login.js`)**

```javascript
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('gw_sso_auth_code');
  
  if (ssoToken) {
    handleSsoLogin(ssoToken);
    return;
  }
  // ... 일반 로그인 로직
}

async function handleSsoLogin(ssoToken) {
  try {
    const response = await fetch('/api/auth/swing/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sso_token: ssoToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      window.location.href = '/pages/quiz-list.html';
    }
  } catch (error) {
    console.error('SSO 로그인 실패:', error);
  }
}
```

**2. Backend: 토큰 검증 (`server/controllers/authController.js`)**

```javascript
const swingSsoTokenLogin = async (req, res) => {
  try {
    const { sso_token } = req.body;
    
    // (1) Swing 서버에 토큰 검증 요청
    const swingUser = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: sso_token
    });
    
    // (2) 관리자 여부 확인
    const adminEmployeeIds = await getAdminEmployeeIds();
    const isAdminUser = adminEmployeeIds.includes(swingUser.employeeNo);
    const userRole = isAdminUser ? 'admin' : 'user';
    
    // (3) 로컬 DB에서 사용자 조회 또는 생성
    let user = await db.User.findOne({
      where: { employee_id: swingUser.employeeNo }
    });
    
    if (!user) {
      user = await db.User.create({
        employee_id: swingUser.employeeNo,
        name: swingUser.employeeName,
        department: swingUser.departmentName,
        email: swingUser.companyEmail,
        role: userRole,
        password: 'swing_sso_user'  // Swing 사용자는 비밀번호 불필요
      });
    }
    
    // (4) JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      employee_id: user.employee_id,
      role: user.role
    });
    
    // (5) 응답
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role
      },
      login_method: 'swing_sso'
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
```

**3. Swing 모듈: API 호출 (`swing-auth/index.js`)**

```javascript
async function swingSsoAuth(ssoToken) {
  const env = getCurrentEnvironment();
  const config = getConfig();
  
  const { swingEndpoint, clientId, clientSecret } = config;
  const payload = {
    common: { clientId, clientSecret },
    data: { code: ssoToken }
  };
  
  try {
    const apiUrl = `${swingEndpoint}/cau/v1/oauth-code-simple`;
    const response = await apiCall(apiUrl, payload);
    const swingUser = validateSwingResponse(response);
    return swingUser;
  } catch (error) {
    throw new Error(`Swing SSO 인증 실패: ${error.message}`);
  }
}
```

---

## ID/PW 인증 흐름

### 📊 시퀀스 다이어그램

```
사용자         퀴즈 Frontend        퀴즈 Backend         Swing Server
  |                 |                    |                     |
  |---(1) 사번+비번-->|                    |                     |
  |                 |                    |                     |
  |                 |---(2) POST-------->|                     |
  |                 |                    |                     |
  |                 |             (3) SHA256 해싱              |
  |                 |                    |                     |
  |                 |                    |---(4) 인증 요청---->|
  |                 |                    |                     |
  |                 |                    |<---(5) 사용자 정보--|
  |                 |                    |                     |
  |                 |             (6) DB에 사용자 생성/업데이트  |
  |                 |                    |                     |
  |                 |<---(7) JWT 토큰 + 사용자 정보-------------|
  |                 |                    |
  |            (8) localStorage 저장      |
  |                 |                    |
  |            (9) quiz-list.html로 이동 |
```

### Mock 환경의 특별 동작

**Mock 환경에서 ID/PW 로그인 시:**
- Swing 서버 대신 `env.js`의 `mockResponse` 사용
- 비밀번호 검증 없이 항상 성공

```javascript
// swing-auth/index.js
async function swingIdPasswordAuth(employeeNo, password) {
  const env = getCurrentEnvironment();
  const config = getConfig();
  
  // Mock 환경에서는 env 파일에 정의된 mockResponse 사용
  if (env === 'mock' && config.mockResponse) {
    log('Mock 환경: env 파일의 mockResponse 사용');
    return config.mockResponse;
  }
  
  // 실제 Swing 서버 호출
  const hashedPassword = sha256(password);
  const payload = {
    common: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      companyCode: config.companyCode,
      employeeNo
    },
    data: {
      loginPassword: hashedPassword
    }
  };
  
  const apiUrl = `${config.swingEndpoint}/cau/v1/idpw-authorize`;
  const response = await apiCall(apiUrl, payload);
  return validateSwingResponse(response);
}
```

---

## Mock 서버 사용

### Mock 서버 실행

**파일: `server/mock-swing-server.js`**

```bash
# Mock 서버 시작 (포트 8055)
node server/mock-swing-server.js
```

### 테스트용 사용자

Mock 서버에는 3명의 테스트 사용자가 등록되어 있습니다:

| 사번 | 이름 | 부서 | SSO 토큰 | 비밀번호 | 권한 |
|-----|------|-----|---------|---------|-----|
| `12345678` | 홍길동 | IT개발팀 | `test_token_valid_user` | `password123` | 일반 사용자 |
| `87654321` | 김철수 | 영업팀 | `test_token_user2` | `test1234` | 일반 사용자 |
| `19200617` | 관리자 | 경영지원팀 | `test_token_admin` | `admin123` | **관리자** |

### SSO 토큰 테스트

```bash
# 일반 사용자로 SSO 로그인
http://localhost:5000/?gw_sso_auth_code=test_token_valid_user

# 관리자로 SSO 로그인
http://localhost:5000/?gw_sso_auth_code=test_token_admin
```

### ID/PW 테스트

Mock 환경에서는 `swing-auth/env.js`의 `mockResponse` 값이 항상 반환됩니다:

```javascript
// env.js의 mockResponse
mockResponse: {
  employeeNo: '19200617',      // 관리자 사번
  employeeName: '테스트사용자',
  departmentName: 'ICT본부',
  companyEmail: 'test12345678@swing.shinhan.com',
  authResult: 'SUCCESS'
}
```

**ID/PW 로그인 시 주의사항:**
- Mock 환경에서는 어떤 사번/비밀번호로 로그인해도 위 `mockResponse` 사용자로 로그인됩니다.
- SSO 토큰 로그인만 Mock 서버의 다양한 테스트 사용자를 사용할 수 있습니다.

---

## 관리자 권한

### 관리자 판별 로직

**1. DB 테이블: `AdminEmployee`**

```sql
CREATE TABLE AdminEmployee (
  id INTEGER PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 관리자
INSERT INTO AdminEmployee (employee_id) VALUES ('19200617');
```

**2. 코드: `server/controllers/authController.js`**

```javascript
// DB에서 관리자 행번 목록 조회
async function getAdminEmployeeIds() {
  try {
    const admins = await db.AdminEmployee.findAll({
      attributes: ['employee_id']
    });
    if (admins.length > 0) {
      return admins.map(a => a.employee_id);
    }
    return ['19200617'];  // fallback
  } catch (error) {
    return ['19200617'];  // fallback
  }
}

// 사용자 생성 시 관리자 여부 확인
const adminEmployeeIds = await getAdminEmployeeIds();
const isAdminUser = adminEmployeeIds.includes(swingUser.employeeNo);
const userRole = isAdminUser ? 'admin' : 'user';
```

### 관리자 추가 방법

**SQL로 직접 추가:**
```sql
INSERT INTO AdminEmployee (employee_id) VALUES ('새로운_사번');
```

**Admin API 사용 (구현 시):**
```http
POST /api/admin/admins
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "employee_id": "새로운_사번"
}
```

---

## API 엔드포인트

### 인증 API

| 메서드 | 경로 | 설명 | Body |
|--------|------|------|------|
| `POST` | `/api/auth/login` | 로컬 Admin 로그인 | `{ employee_id, password }` |
| `POST` | `/api/auth/swing/idpw` | Swing ID/PW 로그인 | `{ employee_id, password }` |
| `POST` | `/api/auth/swing/token` | Swing SSO 토큰 로그인 | `{ sso_token }` |

### 응답 형식

**성공 응답:**
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

**실패 응답:**
```json
{
  "error": "Swing SSO 인증 실패: Invalid token"
}
```

---

## 트러블슈팅

### 1️⃣ SSO 토큰으로 로그인했는데 관리자 버튼이 안 보여요

**원인:**
- `quiz-list.js`에서 `user.role`을 확인하지 않고 있을 수 있습니다.

**해결:**
```javascript
// client/js/pages/quiz-list.js
if (user.role === 'admin') {
  adminGearBtn.style.display = 'block';
}
```

---

### 2️⃣ Mock 환경에서 모든 사용자가 관리자로 로그인돼요

**원인:**
- `env.js`의 `mockResponse`가 관리자 사번(`19200617`)으로 설정되어 있습니다.

**해결:**
- SSO 토큰 인증을 사용하세요 (`?gw_sso_auth_code=test_token_valid_user`)
- 또는 `env.js`의 `mockResponse.employeeNo`를 일반 사용자 사번으로 변경하세요.

---

### 3️⃣ "인증 토큰이 필요합니다" 에러가 나요

**원인:**
- `localStorage`에 토큰이 저장되지 않았거나 만료되었습니다.

**해결:**
1. 브라우저 개발자 도구 → Application → Local Storage 확인
2. `token` 키가 있는지 확인
3. 없으면 로그아웃 후 재로그인

---

### 4️⃣ Swing 서버 연결 오류

**오류 메시지:**
```
Error: connect ETIMEDOUT
```

**원인:**
- 운영/개발 환경에서 Swing 서버에 접근할 수 없습니다.
- 방화벽, VPN, 네트워크 문제일 수 있습니다.

**해결:**
1. `OPERATION_MODE=mock`으로 변경하여 로컬 테스트
2. Swing 서버 엔드포인트 확인
3. 네트워크 환경 확인 (VPN 연결 등)

---

### 5️⃣ Mock 서버가 시작되지 않아요

**오류 메시지:**
```
Error: listen EADDRINUSE: address already in use :::8055
```

**원인:**
- 포트 8055가 이미 사용 중입니다.

**해결:**
```bash
# Windows
netstat -ano | findstr :8055
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8055
kill -9 <PID>
```

---

## 📚 관련 파일

| 파일 | 설명 |
|-----|------|
| `swing-auth/index.js` | Swing 인증 메인 모듈 |
| `swing-auth/env.js` | 환경별 설정 |
| `swing-auth/helpers.js` | API 호출, SHA256 등 헬퍼 함수 |
| `server/controllers/authController.js` | 인증 컨트롤러 |
| `server/mock-swing-server.js` | Mock Swing 서버 |
| `client/js/pages/login.js` | 로그인 페이지 (SSO 토큰 자동 감지) |
| `server/models/adminEmployee.js` | 관리자 사번 테이블 모델 |

---

## 🔒 보안 권장사항

1. **운영 환경 인증 정보 보호**
   - `SWING_CLIENT_ID_PROD`, `SWING_CLIENT_SECRET_PROD`는 환경 변수로만 관리
   - 코드에 하드코딩 금지
   - `.env` 파일은 반드시 `.gitignore`에 추가

2. **JWT 토큰 보안**
   - `JWT_SECRET`은 강력한 랜덤 문자열 사용
   - 토큰 만료 시간 설정 (예: 8시간)
   - HTTPS 사용 필수

3. **관리자 권한 관리**
   - 관리자 추가는 신중하게
   - 정기적으로 `AdminEmployee` 테이블 확인
   - 퇴사자 사번은 즉시 삭제

---

**작성일:** 2025-01-19  
**최종 업데이트:** 2025-01-19

