# Swing SSO Integration Implementation

## 개요
ICT Rules Quiz 시스템에 Swing SSO 인증 시스템을 통합한 구현 문서입니다.

**구현 일자**: 2025-11-06
**버전**: 1.0.0
**상태**: Phase 1-5 완료 (백엔드 완성)

---

## 목차
1. [구현 개요](#구현-개요)
2. [Phase별 구현 내용](#phase별-구현-내용)
3. [API 문서](#api-문서)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [설정 가이드](#설정-가이드)
6. [테스트 방법](#테스트-방법)
7. [문제 해결](#문제-해결)

---

## 구현 개요

### 아키텍처

```
Client (Browser)
    ↓
API Endpoints
    ↓
Auth Controllers
    ↓
Swing Auth Service
    ↓
Swing API Client → Swing SSO Server
    ↓
Database (SQLite)
```

### 주요 기능

1. **SSO 토큰 인증**: Swing SSO 토큰을 통한 로그인
2. **ID/Password 인증**: Swing API를 통한 ID/Password 인증
3. **사용자 자동 생성**: SSO 로그인 시 사용자 자동 생성
4. **사용자 정보 동기화**: 로그인 시마다 Swing에서 사용자 정보 동기화
5. **Access Control**: 부서/행원번호 기반 접근 제어
6. **Admin 설정 관리**: 관리자용 SSO 설정 관리 API

---

## Phase별 구현 내용

### ✅ Phase 1: 환경 설정 및 데이터베이스 (완료)

**생성/수정 파일:**
- `.env.example` - SSO 환경 변수 템플릿
- `.env` - 실제 환경 변수
- `server/config/swing-sso.js` - SSO 설정 관리 모듈
- `server/migrations/20250106000001-add-swing-sso-fields.js` - User 모델 확장
- `server/migrations/20250106000002-create-sso-settings.js` - SSOSettings 테이블 생성
- `server/models/User.js` - SSO 필드 추가
- `server/models/SSOSettings.js` - SSO 설정 모델
- `server/models/index.js` - 모델 등록
- `server/seeders/20250106000003-default-sso-settings.js` - 기본 설정 시드

**주요 변경사항:**
- User 모델에 `swing_user_id`, `position`, `is_active`, `login_method` 필드 추가
- 14개 환경 변수 추가 (SSO 활성화, API URL, 자격증명 등)
- SSOSettings 테이블로 동적 설정 관리

### ✅ Phase 2: Swing API Client 구현 (완료)

**생성 파일:**
- `server/services/swingApiClient.js` - Swing API 통신 클라이언트
- `server/test-swing-api-client.js` - 테스트 스크립트
- `package.json` - axios 의존성 추가

**주요 기능:**
- `authenticateWithSsoToken()` - SSO 토큰 인증
- `authenticateWithIdPassword()` - ID/PW 인증
- `sha256()` - SHA-256 해싱
- `passwordHashing()` - MD5 + SALT 해싱
- `healthCheck()` - API 상태 확인
- 에러 핸들링 및 로깅

### ✅ Phase 3: Swing Auth Service 구현 (완료)

**생성 파일:**
- `server/services/swingAuthService.js` - SSO 인증 서비스
- `server/test-swing-auth-service.js` - 테스트 스크립트

**주요 기능:**
- `authenticateWithSsoToken()` - SSO 토큰 인증 플로우
- `authenticateWithIdPassword()` - ID/PW 인증 플로우
- `findOrCreateUser()` - 사용자 조회/생성
- `syncUserInfo()` - 사용자 정보 동기화
- `checkAccessControl()` - 접근 권한 검증
- `generateToken()` - JWT 토큰 생성

**인증 플로우:**
1. Swing API로 사용자 인증
2. Access Control 검증
3. 로컬 DB에서 사용자 조회/생성
4. 사용자 정보 동기화 (선택)
5. JWT 토큰 발급

### ✅ Phase 4: Controller 및 Route 통합 (완료)

**수정 파일:**
- `server/controllers/authController.js` - SSO 인증 메서드 추가
- `server/routes/auth.js` - SSO 엔드포인트 추가

**추가된 엔드포인트:**
- `POST /api/auth/swing/token` - SSO 토큰 인증
- `POST /api/auth/swing/idpw` - ID/Password 인증

### ✅ Phase 5: Admin SSO 설정 관리 (완료)

**수정 파일:**
- `server/controllers/adminController.js` - SSO 관리 메서드 추가
- `server/routes/admin.js` - Admin SSO 엔드포인트 추가

**추가된 엔드포인트:**
- `GET /api/admin/sso/settings` - 전체 설정 조회
- `GET /api/admin/sso/settings/:key` - 특정 설정 조회
- `PUT /api/admin/sso/settings/:key` - 설정 업데이트
- `GET /api/admin/sso/status` - SSO 시스템 상태

---

## API 문서

### 사용자 인증 API

#### 1. SSO 토큰 인증
```http
POST /api/auth/swing/token
Content-Type: application/json

{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (성공):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "employee_id": "user001",
    "name": "김철수",
    "department": "IT개발팀",
    "email": "user001@company.com",
    "role": "user",
    "swing_user_id": "swing_12345",
    "position": "대리",
    "is_active": true,
    "login_method": "swing_sso"
  },
  "login_method": "swing_sso"
}
```

**Response (실패):**
```json
{
  "error": "SSO 인증에 실패했습니다"
}
```

#### 2. ID/Password 인증
```http
POST /api/auth/swing/idpw
Content-Type: application/json

{
  "employee_id": "user001",
  "password": "password123"
}
```

**Response**: SSO 토큰 인증과 동일

### Admin SSO 설정 API (관리자 전용)

#### 1. 전체 설정 조회
```http
GET /api/admin/sso/settings
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `category` (optional): 설정 카테고리 (general, api, access_control, security)

**Response:**
```json
{
  "success": true,
  "settings": [
    {
      "id": 1,
      "setting_key": "swing_sso_enabled",
      "setting_value": "false",
      "data_type": "boolean",
      "description": "Enable/Disable Swing SSO authentication",
      "category": "general",
      "is_editable": true,
      "is_sensitive": false
    },
    ...
  ]
}
```

#### 2. 특정 설정 조회
```http
GET /api/admin/sso/settings/swing_sso_enabled
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "setting": {
    "id": 1,
    "setting_key": "swing_sso_enabled",
    "setting_value": "false",
    "data_type": "boolean",
    "description": "Enable/Disable Swing SSO authentication",
    "category": "general"
  }
}
```

#### 3. 설정 업데이트
```http
PUT /api/admin/sso/settings/swing_sso_enabled
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "value": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "설정이 업데이트되었습니다",
  "setting": { ... }
}
```

#### 4. SSO 시스템 상태
```http
GET /api/admin/sso/status
Authorization: Bearer {admin_token}
```

**Response:**
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

---

## 데이터베이스 스키마

### Users 테이블 (확장)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| employee_id | VARCHAR(50) | 행원번호 (기존) |
| password | VARCHAR(255) | 비밀번호 (기존) |
| name | VARCHAR(100) | 이름 (기존) |
| department | VARCHAR(100) | 부서 (기존) |
| email | VARCHAR(255) | 이메일 (기존) |
| role | STRING | 역할 (기존) |
| **swing_user_id** | **VARCHAR(100)** | **Swing User ID (신규)** |
| **position** | **VARCHAR(100)** | **직급 (신규)** |
| **is_active** | **BOOLEAN** | **활성 상태 (신규)** |
| **login_method** | **STRING** | **로그인 방법: local/swing_sso (신규)** |
| created_at | DATETIME | 생성일 (기존) |
| updated_at | DATETIME | 수정일 (기존) |

**Indexes:**
- `idx_users_swing_user_id` (UNIQUE) - Swing User ID 조회 최적화
- `idx_users_login_method` - 로그인 방법별 필터링

### SSOSettings 테이블 (신규)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| setting_key | VARCHAR(100) | 설정 키 (UNIQUE) |
| setting_value | TEXT | 설정 값 |
| data_type | STRING | 데이터 타입 (string/boolean/number/json) |
| description | TEXT | 설명 |
| category | VARCHAR(50) | 카테고리 |
| is_editable | BOOLEAN | 수정 가능 여부 |
| is_sensitive | BOOLEAN | 민감 정보 여부 |
| created_at | DATETIME | 생성일 |
| updated_at | DATETIME | 수정일 |

**Indexes:**
- `idx_sso_settings_key` (UNIQUE) - 설정 키 조회 최적화
- `idx_sso_settings_category` - 카테고리별 필터링

---

## 설정 가이드

### 환경 변수 설정

`.env` 파일에 다음 변수들을 설정합니다:

```bash
# Swing SSO Configuration
SWING_SSO_ENABLED=true                    # SSO 활성화 여부
SWING_SSO_ENV=prod                        # 환경: prod/dev/mock
SWING_API_BASE_URL=https://swing.api.example.com
SWING_OAUTH_ENDPOINT=/cau/v1/oauth-code-simple
SWING_IDPW_ENDPOINT=/cau/v1/idpw-authorize
SWING_CLIENT_ID=your_client_id            # Swing API Client ID
SWING_CLIENT_SECRET=your_client_secret    # Swing API Client Secret
SWING_AUTO_CREATE_USER=true               # 사용자 자동 생성
SWING_SYNC_USER_INFO=true                 # 사용자 정보 동기화
SWING_PASSWORD_SALT=your_password_salt    # 비밀번호 솔트

# Swing SSO Access Control
SWING_ACCESS_CONTROL_TYPE=none            # none/employee_list/department_list/collection
# SWING_EMPLOYEE_LIST_FILE=./config/employees.json
# SWING_DEPARTMENT_LIST_FILE=./config/departments.json
```

### 환경별 설정

#### Mock 환경 (개발/테스트)
```bash
SWING_SSO_ENABLED=false
SWING_SSO_ENV=mock
SWING_API_BASE_URL=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID=mock_client_id
SWING_CLIENT_SECRET=mock_client_secret
```

#### Dev 환경 (개발 서버)
```bash
SWING_SSO_ENABLED=true
SWING_SSO_ENV=dev
SWING_API_BASE_URL=https://swing-dev.api.example.com
SWING_CLIENT_ID=dev_client_id
SWING_CLIENT_SECRET=dev_client_secret
```

#### Production 환경
```bash
SWING_SSO_ENABLED=true
SWING_SSO_ENV=prod
SWING_API_BASE_URL=https://swing.api.example.com
SWING_CLIENT_ID=prod_client_id
SWING_CLIENT_SECRET=prod_client_secret
SWING_PASSWORD_SALT=CHANGE_THIS_IN_PRODUCTION
```

### Access Control 설정

#### 1. 제한 없음 (기본)
```bash
SWING_ACCESS_CONTROL_TYPE=none
```

#### 2. 행원번호 목록으로 제한
```bash
SWING_ACCESS_CONTROL_TYPE=employee_list
```

Admin API로 허용 목록 설정:
```bash
curl -X PUT http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": ["user001", "user002", "user003"]}'
```

#### 3. 부서 목록으로 제한
```bash
SWING_ACCESS_CONTROL_TYPE=department_list
```

Admin API로 허용 부서 설정:
```bash
curl -X PUT http://localhost:3001/api/admin/sso/settings/department_list \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": ["IT개발팀", "기획팀", "인사팀"]}'
```

---

## 테스트 방법

### 1. 모듈 단위 테스트

#### Swing API Client 테스트
```bash
cd server
node test-swing-api-client.js
```

**예상 출력:**
```
=================================================
Swing API Client 테스트
=================================================

1. Configuration 확인:
   - SSO Enabled: false
   - Environment: mock
   - Base URL: http://127.0.0.1:8055/swing-mock-server
   ✓ Configuration loaded

2. Crypto Functions 테스트:
   - SHA-256: 2bbe7e30ee79...
   - MD5 (with salt): 6a982c5934e8...
   ✓ Crypto functions working

✅ Swing API Client 테스트 완료!
```

#### Swing Auth Service 테스트
```bash
cd server
node test-swing-auth-service.js
```

**예상 출력:**
```
=================================================
Swing Auth Service 테스트
=================================================

✓ 데이터베이스 연결 성공

1. Configuration 확인:
   - SSO Enabled: false
   - Auto Create User: true
   - Sync User Info: true
   ✓ Configuration loaded

2. SSO Settings (Database) 확인:
   - SSO Enabled (DB): false
   - Auto Create User (DB): true
   ✓ Database settings loaded

✅ Swing Auth Service 테스트 완료!
```

### 2. API 엔드포인트 테스트

서버 시작:
```bash
cd server
npm start
```

#### SSO 토큰 인증 테스트 (Swing 서버 필요)
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "your_sso_token_here"}'
```

#### Admin SSO 상태 확인
```bash
# 먼저 admin 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "admin", "password": "admin123"}'

# SSO 상태 확인
curl -X GET http://localhost:3001/api/admin/sso/status \
  -H "Authorization: Bearer {admin_token}"
```

### 3. 데이터베이스 확인

SQLite 데이터베이스 확인:
```bash
cd server
sqlite3 ../database/quiz.db

# SSO Settings 확인
SELECT * FROM sso_settings;

# SSO 사용자 확인
SELECT employee_id, name, login_method, swing_user_id
FROM users
WHERE login_method = 'swing_sso';
```

---

## 문제 해결

### 일반적인 문제

#### 1. SSO가 활성화되지 않음
**증상**: `Swing SSO가 비활성화되어 있습니다` 에러

**해결책**:
```bash
# .env 파일 확인
SWING_SSO_ENABLED=true

# 또는 Admin API로 활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'

# 서버 재시작
npm start
```

#### 2. Swing API 연결 실패
**증상**: `API Call Failed` 에러

**해결책**:
1. Swing API URL 확인
2. Client ID/Secret 확인
3. 네트워크 연결 확인
4. Swing API 상태 확인

```bash
# Health check
curl http://your-swing-api-url/health
```

#### 3. Access Control 에러
**증상**: `Access denied: Employee not in allowed list` 에러

**해결책**:
```bash
# Access Control 타입 확인
curl -X GET http://localhost:3001/api/admin/sso/status \
  -H "Authorization: Bearer {admin_token}"

# 허용 목록에 사용자 추가
curl -X PUT http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": ["user001", "user002", "new_user"]}'
```

#### 4. 사용자 자동 생성 안 됨
**증상**: `User not found and auto-create is disabled` 에러

**해결책**:
```bash
# Auto create 활성화
curl -X PUT http://localhost:3001/api/admin/sso/settings/auto_create_user \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'

# 또는 .env 파일 수정
SWING_AUTO_CREATE_USER=true

# 서버 재시작
npm start
```

### 로그 확인

서버 로그에서 SSO 관련 메시지 확인:
```bash
# 로그 파일이 있는 경우
tail -f logs/server.log | grep SwingAuth

# 또는 서버 출력 확인
[SwingAuthService] SSO Token Authentication started
[SwingAuthService] Swing user retrieved: user001
[SwingAuthService] Access control passed: user001
[SwingAuthService] Existing user found: user001
[SwingAuthService] SSO Authentication successful: user001
```

### Verbose 로깅 활성화

디버깅을 위해 상세 로그 활성화:
```bash
# .env 파일에 추가
SWING_VERBOSE_LOG=true

# 서버 재시작
npm start
```

---

## 다음 단계 (미완성 Phase)

### Phase 6: 클라이언트 측 수정
- 로그인 페이지에 "Swing SSO로 로그인" 버튼 추가
- SSO 토큰 처리 로직 구현
- 로그인 방법 표시 (로컬/SSO)

### Phase 7: 테스트 및 검증
- Mock Swing 서버 구축
- 통합 테스트 작성
- E2E 테스트 시나리오 작성

### Phase 8: 추가 문서화
- 사용자 가이드
- 운영 매뉴얼
- 보안 가이드

---

## 부록

### A. Swing API 참조

#### OAuth Token Endpoint
```
POST /cau/v1/oauth-code-simple
Body: {
  "client_id": "...",
  "client_secret": "...",
  "oauth_code": "..."
}
Response: {
  "user_id": "...",
  "employee_id": "...",
  "name": "...",
  "department": "...",
  "position": "...",
  "email": "..."
}
```

#### ID/Password Endpoint
```
POST /cau/v1/idpw-authorize
Body: {
  "client_id": "...",
  "client_secret": "...",
  "employee_id": "...",
  "password": "..." (SHA-256 hashed)
}
Response: 동일
```

### B. 파일 구조

```
server/
├── config/
│   └── swing-sso.js              # SSO 설정 관리
├── controllers/
│   ├── authController.js         # SSO 인증 컨트롤러 (수정)
│   └── adminController.js        # SSO 관리 컨트롤러 (수정)
├── migrations/
│   ├── 20250106000001-add-swing-sso-fields.js
│   └── 20250106000002-create-sso-settings.js
├── models/
│   ├── User.js                   # SSO 필드 추가
│   ├── SSOSettings.js            # 신규
│   └── index.js                  # 모델 등록
├── routes/
│   ├── auth.js                   # SSO 엔드포인트 추가
│   └── admin.js                  # SSO 관리 엔드포인트 추가
├── seeders/
│   └── 20250106000003-default-sso-settings.js
├── services/
│   ├── swingApiClient.js         # 신규
│   └── swingAuthService.js       # 신규
├── test-swing-api-client.js      # 테스트
└── test-swing-auth-service.js    # 테스트
```

### C. 주요 설정 목록

| 설정 키 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| swing_sso_enabled | boolean | false | SSO 활성화 여부 |
| swing_sso_environment | string | mock | 환경 (prod/dev/mock) |
| auto_create_user | boolean | true | 사용자 자동 생성 |
| sync_user_info | boolean | true | 사용자 정보 동기화 |
| api_base_url | string | - | Swing API Base URL |
| oauth_endpoint | string | /cau/v1/oauth-code-simple | OAuth 엔드포인트 |
| idpw_endpoint | string | /cau/v1/idpw-authorize | ID/PW 엔드포인트 |
| client_id | string | - | Client ID (민감) |
| client_secret | string | - | Client Secret (민감) |
| access_control_type | string | none | 접근 제어 타입 |
| employee_list | json | [] | 허용 행원번호 목록 |
| department_list | json | [] | 허용 부서 목록 |
| password_salt | string | - | 비밀번호 솔트 (민감) |
| api_timeout | number | 10000 | API 타임아웃 (ms) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-11-06 | Phase 1-5 완료 (백엔드) |

---

## 라이선스 및 크레딧

**참조 구현**: `C:\chakchak-main\directus\extensions_data\packages\shb-authenticate-handler`
**개발자**: Claude Code
**프로젝트**: ICT Rules Quiz System
