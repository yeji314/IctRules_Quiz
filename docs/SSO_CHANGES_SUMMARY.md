# SSO 인증 수정 요약

## 📅 수정일
2025-11-22

---

## ✅ 수정 내용

### 1. 관리자 로직 통일

**변경 전**:
- id/pw 방식: 관리자 확인 로직 있음 ✅
- SSO 토큰 방식: 관리자 확인 로직 있음 ✅

**변경 후**:
- **양쪽 모두 동일하게 유지** (이미 동일했음)
- `getAdminEmployeeIds()` 함수로 DB에서 관리자 사번 조회
- 관리자 사번이면 `role: 'admin'` 설정
- 로그 추가로 확인 가능

```javascript
// 관리자 여부 확인 (DB에서 조회 - id/pw 방식과 동일)
const adminEmployeeIds = await getAdminEmployeeIds();
const isAdminUser = adminEmployeeIds.includes(swingUser.employeeNo);
const userRole = isAdminUser ? 'admin' : 'user';

console.log('[Swing SSO] 관리자 여부 확인:', { 
  employeeNo: swingUser.employeeNo, 
  isAdmin: isAdminUser, 
  role: userRole 
});
```

---

### 2. 부서 권한 체크 제거

**변경 전**:
- `department_list` 타입으로 부서 제한 가능
- 특정 부서만 SSO 로그인 허용

**변경 후**:
- **모든 부서에서 SSO 인증 가능** ✅
- `employee_list` (사번 목록) 체크만 유지
- 부서 체크 로직 비활성화

```javascript
// 부서 제어 타입은 모두 허용으로 처리 (요청에 따라)
// 모든 부서의 SSO 인증 사용자는 로그인 가능
return { allowed: true };
```

**권한 제어 타입**:
- ✅ `none`: 모든 사용자 허용
- ✅ `employee_list`: 특정 사번만 허용
- ❌ ~~`department_list`~~: 모두 허용 (체크 안 함)

---

### 3. `login_method` 용도 확인

**사용처**:
```
✅ server/controllers/authController.js
   - 응답 데이터에 포함 (정보성)
   
✅ server/controllers/adminController.js
   - 통계 목적으로 사용
   - SSO 로그인 사용자 수 집계
   - 로컬 로그인 사용자 수 집계
   
✅ server/models/User.js
   - DB 필드 정의
   - 'local' | 'swing_sso'
   
❌ client (프론트엔드)
   - 사용 안 함
```

**결론**: 백엔드 통계용으로만 사용, 로직에는 영향 없음

---

### 4. `window.location.href` 동작 확인

**질문**: https가 붙나요? http가 붙나요?

**답변**: **현재 프로토콜을 따릅니다!**

```javascript
// 상대 경로 사용 시
window.location.href = '/pages/quiz-list.html';

// 현재 URL이 http://localhost:3001이면
→ http://localhost:3001/pages/quiz-list.html

// 현재 URL이 https://yourdomain.com이면
→ https://yourdomain.com/pages/quiz-list.html
```

**동작 방식**:
- 상대 경로(`/`로 시작): 현재 프로토콜 + 도메인 + 경로
- 절대 경로(`http://` 또는 `https://`): 명시된 프로토콜 사용
- 프로토콜 상대 경로(`//`): 현재 프로토콜만 사용

---

## 🧪 테스트 시나리오

### 시나리오 1: 일반 사용자 SSO 로그인

```
http://localhost:3001?gw_sso_auth_code=test_token_valid_user
```

**예상 결과**:
- ✅ 홍길동(12345678) 로그인 성공
- ✅ role: 'user'
- ✅ 모든 부서 허용

### 시나리오 2: 관리자 SSO 로그인

```
http://localhost:3001?gw_sso_auth_code=test_token_admin
```

**예상 결과**:
- ✅ 관리자(19200617) 로그인 성공
- ✅ role: 'admin' (자동 감지)
- ✅ 관리자 페이지 접근 가능

**콘솔 로그**:
```
[Swing SSO] 인증 성공: { employeeNo: '19200617', name: '관리자', ... }
[Swing SSO] 권한 확인 통과
[Swing SSO] 관리자 여부 확인: { employeeNo: '19200617', isAdmin: true, role: 'admin' }
[Swing SSO] 사용자 정보 업데이트: 19200617
```

### 시나리오 3: 사번 제한 (특정 사용자만 허용)

**설정**:
```sql
UPDATE sso_settings 
SET setting_value = '"employee_list"' 
WHERE setting_key = 'access_control_type';

UPDATE sso_settings 
SET setting_value = '["12345678", "19200617"]' 
WHERE setting_key = 'employee_list';
```

**결과**:
- ✅ 12345678, 19200617 → 로그인 성공
- ❌ 87654321 → 403 Forbidden
- ✅ **모든 부서 허용** (부서 제한 없음)

---

## 📊 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `server/controllers/authController.js` | - 부서 체크 로직 제거<br>- 관리자 확인 로그 추가<br>- 주석 개선 |

---

## 🔐 권한 제어 최종 정책

### ✅ 적용됨
1. **사번 기반 제어** (`employee_list`)
   - 특정 사번만 허용 가능
   - `["12345678", "19200617"]`
   
2. **관리자 자동 인식**
   - `admin_employees` 테이블 기반
   - 관리자 사번은 자동으로 `role: 'admin'`

### ❌ 적용 안 됨
1. **부서 기반 제어** (`department_list`)
   - 모든 부서 허용
   - SSO 인증만 성공하면 로그인 가능

---

## 📝 참고사항

### 관리자 추가 방법

```sql
-- admin_employees 테이블에 추가
INSERT INTO admin_employees (employee_id, created_at, updated_at) 
VALUES ('새로운행번', datetime('now'), datetime('now'));
```

### 사번 허용 목록 설정

```sql
-- 특정 사번만 허용
UPDATE sso_settings 
SET setting_value = '["12345678", "19200617", "새로운사번"]' 
WHERE setting_key = 'employee_list';

-- 모든 사번 허용
UPDATE sso_settings 
SET setting_value = '"none"' 
WHERE setting_key = 'access_control_type';
```

---

## ✅ 체크리스트

- [x] 관리자 로직 통일 (SSO도 동일하게)
- [x] 부서 권한 체크 제거 (모든 부서 허용)
- [x] login_method 용도 확인
- [x] window.location.href 동작 확인
- [x] 린터 에러 없음
- [x] 테스트 시나리오 작성

---

**수정 완료일**: 2025-11-22  
**수정자**: Claude AI

