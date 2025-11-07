# E2E Test Scenarios - Swing SSO Integration

## 개요
Swing SSO 통합의 End-to-End 테스트 시나리오입니다.

---

## 테스트 환경 설정

### 1. Mock Swing Server 시작
```bash
cd server
node mock-swing-server.js
```

**확인사항:**
- 서버가 포트 8055에서 실행됨
- Health check 성공: http://localhost:8055/swing-mock-server/health

### 2. SSO 활성화
`.env` 파일 수정:
```bash
SWING_SSO_ENABLED=true
SWING_SSO_ENV=mock
SWING_API_BASE_URL=http://127.0.0.1:8055/swing-mock-server
```

### 3. 애플리케이션 서버 시작
```bash
cd server
npm start
```

---

## Scenario 1: SSO 토큰 인증

### 목적
Swing SSO 토큰을 사용한 인증 플로우를 검증합니다.

### 사전 조건
- Mock Swing Server 실행 중
- SSO 활성화됨
- 유효한 SSO 토큰: `mock_token_12345`

### 테스트 단계

#### Step 1: SSO 토큰으로 인증
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "mock_token_12345"}'
```

**예상 결과:**
- HTTP 200 OK
- JWT 토큰 반환
- 사용자 정보 포함 (employee_id: swing001, name: 홍길동)
- login_method: "swing_sso"

#### Step 2: 반환된 JWT 토큰으로 인증된 API 호출
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer {받은_토큰}"
```

**예상 결과:**
- HTTP 200 OK
- 사용자 정보 반환
- swing_user_id 필드 존재
- login_method: "swing_sso"

#### Step 3: 데이터베이스 확인
```sql
SELECT * FROM users WHERE employee_id = 'swing001';
```

**예상 결과:**
- 사용자 레코드 존재
- swing_user_id: 'swing_user_001'
- login_method: 'swing_sso'
- position, department 필드 채워짐

### 성공 기준
- [ ] SSO 토큰 인증 성공
- [ ] JWT 토큰 발급
- [ ] 인증된 API 접근 가능
- [ ] 사용자 정보 DB에 저장
- [ ] Swing 사용자 정보 동기화

---

## Scenario 2: ID/Password 인증

### 목적
Swing API를 통한 ID/Password 인증을 검증합니다.

### 사전 조건
- Mock Swing Server 실행 중
- SSO 활성화됨
- 유효한 계정: swing002 / test1234

### 테스트 단계

#### Step 1: ID/Password로 인증
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing002",
    "password": "test1234"
  }'
```

**예상 결과:**
- HTTP 200 OK
- JWT 토큰 반환
- 사용자 정보 포함 (employee_id: swing002, name: 김영수)

#### Step 2: 잘못된 비밀번호
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing002",
    "password": "wrong_password"
  }'
```

**예상 결과:**
- HTTP 401 Unauthorized
- 에러 메시지 반환

### 성공 기준
- [ ] 올바른 비밀번호로 인증 성공
- [ ] 잘못된 비밀번호 거부
- [ ] 사용자 정보 DB에 저장

---

## Scenario 3: 사용자 자동 생성

### 목적
처음 SSO 로그인하는 사용자가 자동으로 생성되는지 확인합니다.

### 사전 조건
- Mock Swing Server 실행 중
- SSO 활성화됨
- SWING_AUTO_CREATE_USER=true
- DB에 swing003 사용자 없음

### 테스트 단계

#### Step 1: 데이터베이스 확인 (사용자 없음)
```sql
SELECT * FROM users WHERE employee_id = 'swing003';
-- Result: 0 rows
```

#### Step 2: 신규 사용자로 SSO 인증
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing003",
    "password": "qwerty"
  }'
```

**예상 결과:**
- HTTP 200 OK
- 새 사용자 생성됨
- JWT 토큰 반환

#### Step 3: 데이터베이스 확인 (사용자 생성됨)
```sql
SELECT * FROM users WHERE employee_id = 'swing003';
-- Result: 1 row
-- swing_user_id: 'swing_user_003'
-- name: '이민정'
-- department: 'IT개발팀'
-- login_method: 'swing_sso'
```

#### Step 4: 재인증 (기존 사용자 사용)
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing003",
    "password": "qwerty"
  }'
```

**예상 결과:**
- HTTP 200 OK
- 기존 사용자 사용 (중복 생성 안 됨)

### 성공 기준
- [ ] 신규 사용자 자동 생성
- [ ] Swing 사용자 정보 연동
- [ ] 재인증 시 중복 생성 안 됨
- [ ] 모든 필드 올바르게 채워짐

---

## Scenario 4: 사용자 정보 동기화

### 목적
재로그인 시 Swing에서 변경된 사용자 정보가 동기화되는지 확인합니다.

### 사전 조건
- Mock Swing Server 실행 중
- SSO 활성화됨
- SWING_SYNC_USER_INFO=true
- swing001 사용자 존재

### 테스트 단계

#### Step 1: 초기 사용자 정보 확인
```sql
SELECT name, department, position FROM users WHERE employee_id = 'swing001';
-- name: '홍길동'
-- department: '디지털혁신팀'
-- position: '차장'
```

#### Step 2: Mock Swing Server에서 정보 변경
(Mock 서버 코드에서 사용자 정보 수정 - 실제로는 Swing 측에서 변경)

#### Step 3: 재인증
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "mock_token_12345"}'
```

#### Step 4: 동기화된 정보 확인
```sql
SELECT name, department, position FROM users WHERE employee_id = 'swing001';
-- 변경된 정보가 반영되어야 함
```

### 성공 기준
- [ ] 재인증 성공
- [ ] 변경된 정보 동기화
- [ ] 필수 필드만 업데이트 (role 등은 유지)

---

## Scenario 5: Access Control

### 목적
부서 또는 행원번호 기반 접근 제어를 검증합니다.

### 테스트 5A: 행원번호 목록 제한

#### Step 1: Access Control 설정
```bash
# Admin으로 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "admin",
    "password": "admin@"
  }'

# Access Control 타입 변경
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": "employee_list"}'

# 허용 목록 설정
curl -X PUT http://localhost:3001/api/admin/sso/settings/employee_list \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": ["swing001", "swing002"]}'
```

#### Step 2: 허용된 사용자 인증 (성공)
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing001",
    "password": "password123"
  }'
```

**예상 결과:** HTTP 200 OK

#### Step 3: 허용되지 않은 사용자 인증 (실패)
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing003",
    "password": "qwerty"
  }'
```

**예상 결과:** HTTP 403 Forbidden, "Access denied"

### 테스트 5B: 부서 목록 제한

#### Step 1: Access Control 변경
```bash
curl -X PUT http://localhost:3001/api/admin/sso/settings/access_control_type \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": "department_list"}'

curl -X PUT http://localhost:3001/api/admin/sso/settings/department_list \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": ["디지털혁신팀", "보안팀"]}'
```

#### Step 2: 허용된 부서 사용자 인증 (성공)
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "mock_token_12345"}'
```

**예상 결과:** HTTP 200 OK (디지털혁신팀)

#### Step 3: 허용되지 않은 부서 사용자 인증 (실패)
```bash
curl -X POST http://localhost:3001/api/auth/swing/idpw \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "swing003",
    "password": "qwerty"
  }'
```

**예상 결과:** HTTP 403 Forbidden (IT개발팀은 허용 안 됨)

### 성공 기준
- [ ] Access Control 설정 변경 가능
- [ ] 행원번호 목록 제한 작동
- [ ] 부서 목록 제한 작동
- [ ] 허용되지 않은 사용자 거부

---

## Scenario 6: 로컬 인증과 SSO 공존

### 목적
로컬 인증과 SSO 인증이 동시에 사용 가능한지 확인합니다.

### 테스트 단계

#### Step 1: 로컬 사용자 로그인
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "user001",
    "password": "1234"
  }'
```

**예상 결과:**
- HTTP 200 OK
- JWT 토큰 발급

#### Step 2: SSO 사용자 로그인
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "mock_token_12345"}'
```

**예상 결과:**
- HTTP 200 OK
- JWT 토큰 발급

#### Step 3: 데이터베이스 확인
```sql
SELECT employee_id, login_method FROM users;
-- user001: 'local'
-- swing001: 'swing_sso'
```

### 성공 기준
- [ ] 로컬 인증 정상 작동
- [ ] SSO 인증 정상 작동
- [ ] 두 방식 독립적으로 작동
- [ ] login_method 올바르게 설정

---

## Scenario 7: Admin SSO 관리

### 목적
관리자가 SSO 설정을 관리할 수 있는지 확인합니다.

### 테스트 단계

#### Step 1: Admin 로그인
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "admin",
    "password": "admin@"
  }'
```

#### Step 2: SSO 상태 조회
```bash
curl -X GET http://localhost:3001/api/admin/sso/status \
  -H "Authorization: Bearer {admin_token}"
```

**예상 결과:**
- HTTP 200 OK
- SSO 활성화 상태
- 사용자 통계 포함

#### Step 3: SSO 설정 조회
```bash
curl -X GET http://localhost:3001/api/admin/sso/settings \
  -H "Authorization: Bearer {admin_token}"
```

**예상 결과:**
- HTTP 200 OK
- 모든 SSO 설정 목록
- 민감한 정보는 숨김 처리

#### Step 4: 특정 설정 조회
```bash
curl -X GET http://localhost:3001/api/admin/sso/settings/auto_create_user \
  -H "Authorization: Bearer {admin_token}"
```

**예상 결과:**
- HTTP 200 OK
- auto_create_user 설정 상세 정보

#### Step 5: 설정 업데이트
```bash
curl -X PUT http://localhost:3001/api/admin/sso/settings/auto_create_user \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": false}'
```

**예상 결과:**
- HTTP 200 OK
- 설정 업데이트 성공

#### Step 6: 변경 사항 확인
```bash
curl -X GET http://localhost:3001/api/admin/sso/settings/auto_create_user \
  -H "Authorization: Bearer {admin_token}"
```

**예상 결과:**
- setting_value: "false"

### 성공 기준
- [ ] Admin 인증 성공
- [ ] SSO 상태 조회 가능
- [ ] SSO 설정 조회 가능
- [ ] SSO 설정 업데이트 가능
- [ ] 민감한 정보 보호

---

## Scenario 8: SSO 비활성화 상태

### 목적
SSO가 비활성화된 상태에서의 동작을 확인합니다.

### 테스트 단계

#### Step 1: SSO 비활성화
```bash
# Admin으로 설정 변경
curl -X PUT http://localhost:3001/api/admin/sso/settings/swing_sso_enabled \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"value": false}'

# 또는 .env 파일 수정
SWING_SSO_ENABLED=false

# 서버 재시작
```

#### Step 2: SSO 인증 시도
```bash
curl -X POST http://localhost:3001/api/auth/swing/token \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "mock_token_12345"}'
```

**예상 결과:**
- HTTP 403 Forbidden
- "Swing SSO가 비활성화되어 있습니다"

#### Step 3: 로컬 인증 확인 (정상 작동)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "user001",
    "password": "1234"
  }'
```

**예상 결과:**
- HTTP 200 OK
- 로컬 인증은 정상 작동

### 성공 기준
- [ ] SSO 비활성화 시 SSO 인증 거부
- [ ] 로컬 인증은 정상 작동
- [ ] 적절한 에러 메시지

---

## 자동화 테스트 실행

### 통합 테스트
```bash
# Mock Swing Server 시작
node mock-swing-server.js

# 다른 터미널에서 통합 테스트 실행
node test-swing-integration.js
```

**예상 출력:**
```
🧪 Swing SSO Integration Test
=================================================

1. Mock Swing Server 테스트
========================================
   ✓ Mock server health check
   ✓ Mock users available

2. SSO 토큰 인증 테스트
========================================
   ✓ SSO token authentication
   ✓ JWT token received
   ✓ User data received

...

📊 Test Results
=================================================
Total: 20 tests
✓ Passed: 20
✗ Failed: 0

🎉 All tests passed!
```

---

## 테스트 체크리스트

### 기본 기능
- [ ] SSO 토큰 인증
- [ ] ID/Password 인증
- [ ] JWT 토큰 발급
- [ ] 사용자 자동 생성
- [ ] 사용자 정보 동기화

### Access Control
- [ ] 제한 없음 (none)
- [ ] 행원번호 목록 제한
- [ ] 부서 목록 제한
- [ ] 접근 거부 처리

### 에러 처리
- [ ] 잘못된 SSO 토큰
- [ ] 잘못된 비밀번호
- [ ] 존재하지 않는 사용자
- [ ] SSO 비활성화 상태
- [ ] Mock 서버 다운

### Admin 기능
- [ ] SSO 상태 조회
- [ ] SSO 설정 조회
- [ ] SSO 설정 업데이트
- [ ] 민감 정보 보호

### 공존성
- [ ] 로컬 인증과 SSO 공존
- [ ] 기존 사용자 영향 없음
- [ ] 데이터베이스 무결성

---

## 문제 해결

### Mock Swing Server 연결 실패
```bash
# 서버 실행 확인
curl http://localhost:8055/swing-mock-server/health

# 포트 사용 중 확인
netstat -ano | findstr :8055
```

### SSO 인증 실패
```bash
# .env 파일 확인
cat .env | grep SWING

# 서버 로그 확인
tail -f logs/server.log | grep Swing
```

### 데이터베이스 문제
```bash
# 마이그레이션 확인
cd server && npm run db:migrate

# 데이터 확인
sqlite3 ../database/quiz.db "SELECT * FROM users WHERE login_method = 'swing_sso';"
```

---

## 부록: Mock 사용자 정보

| employee_id | password | name | department | token |
|-------------|----------|------|------------|-------|
| swing001 | password123 | 홍길동 | 디지털혁신팀 | mock_token_12345 |
| swing002 | test1234 | 김영수 | 보안팀 | mock_token_67890 |
| swing003 | qwerty | 이민정 | IT개발팀 | test_token_abc |

