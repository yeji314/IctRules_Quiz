# Swing 인증 모듈 테스트 가이드

## 📋 목차

1. [Mock 환경 테스트](#mock-환경-테스트) - **추천, 즉시 실행 가능**
2. [Dev 환경 테스트](#dev-환경-테스트) - 실제 Swing 개발 서버
3. [Prod 환경 테스트](#prod-환경-테스트) - 실제 Swing 운영 서버

---

## 🎮 Mock 환경 테스트 (추천)

**특징:**
- ✅ 즉시 실행 가능
- ✅ 실제 Swing 서버 불필요
- ✅ 인증 정보 불필요
- ✅ 가상 응답 데이터 사용

### 실행 방법

```bash
cd c:\IctRulesQuiz\swing-auth
node test-simple.js
```

### 환경 설정

`.env` 파일:
```bash
OPERATION_MODE=mock
```

### 테스트 데이터

**아무 값이나 입력 가능** (Mock 모드에서는 무시됨)

```javascript
// SSO 토큰 - 아무 값이나 입력
await doSwingAuthenticate({
  type: 'sso',
  ssoToken: 'any_token_value'
});

// ID/Password - 아무 값이나 입력
await doSwingAuthenticate({
  type: 'idpw',
  employeeNo: '12345678',
  password: 'any_password'
});
```

### 예상 결과

항상 다음 가상 데이터를 반환:

```javascript
{
  authResult: 'SUCCESS',
  companyCode: 'SH',
  companyEmail: 'test12345678@swing.shinhan.com',
  departmentNo: '1234567',
  departmentName: 'ICT본부',
  employeeName: '테스트사용자',
  employeeNo: '12345678',
  employeePositionName: '부장'
}
```

---

## 🔧 Dev 환경 테스트

**특징:**
- 🔴 실제 Swing 개발 서버 연결
- 🔴 Client ID/Secret 필요
- 🔴 실제 테스트 계정 필요
- ✅ 운영 배포 전 검증용

### 1단계: 환경 설정

`.env` 파일을 수정:

```bash
# 모드 변경
OPERATION_MODE=dev

# Client ID/Secret 입력 (신한은행 담당자에게 요청)
SWING_CLIENT_ID_DEV=실제_클라이언트_ID
SWING_CLIENT_SECRET_DEV=실제_클라이언트_시크릿
```

### 2단계: 테스트 실행

```bash
node test-dev.js
```

이 명령을 실행하면:
- 환경 설정 확인
- Client ID/Secret 설정 여부 확인
- 테스트 가이드 출력

### 3단계: 실제 데이터로 테스트

#### 방법 A: SSO 토큰 인증

1. **SSO 토큰 발급**
   - Swing 개발 포털에 로그인
   - URL에서 `gw_sso_auth_code` 값 복사
   - 예: `?gw_sso_auth_code=ABC123...`

2. **코드 수정**

   `test-dev.js` 파일의 Line 39-53 주석 해제:

   ```javascript
   try {
     const user = await doSwingAuthenticate({
       type: 'sso',
       ssoToken: '여기에_복사한_토큰_입력'  // ← 실제 토큰
     });
     console.log('✅ 성공:', user);
   } catch (error) {
     console.error('❌ 실패:', error.message);
   }
   ```

3. **실행**
   ```bash
   node test-dev.js
   ```

#### 방법 B: ID/Password 인증

1. **테스트 계정 준비**
   - 사번: 8자리 숫자
   - 비밀번호: Swing 비밀번호

2. **코드 수정**

   `test-dev.js` 파일의 Line 72-87 주석 해제:

   ```javascript
   try {
     const user = await doSwingAuthenticate({
       type: 'idpw',
       employeeNo: '12345678',      // ← 실제 사번
       password: 'your_password'    // ← 실제 비밀번호
     });
     console.log('✅ 성공:', user);
   } catch (error) {
     console.error('❌ 실패:', error.message);
   }
   ```

3. **실행 후 비밀번호 삭제!**
   ```bash
   node test-dev.js
   # 테스트 완료 후 코드에서 비밀번호 제거 필수!
   ```

### 필요한 정보

| 항목 | 제공처 | 비고 |
|------|--------|------|
| Client ID | 신한은행 Swing 담당자 | 개발 서버용 |
| Client Secret | 신한은행 Swing 담당자 | 개발 서버용 |
| SSO 토큰 | Swing 개발 포털 | 5~10분 유효 |
| 테스트 계정 | 신한은행 인사팀 | 사번 + 비밀번호 |

### 문제 해결

**"timeout of 10000ms exceeded"**
- 신한은행 VPN 연결 확인
- 방화벽 설정 확인
- 담당자에게 서버 상태 문의

**"authResult=FAIL"**
- SSO 토큰 만료 → 재발급
- 비밀번호 오류 → 재확인
- Client ID/Secret 오류 → 담당자 확인

---

## 🚀 Prod 환경 테스트

**특징:**
- 🔴🔴 실제 Swing 운영 서버 연결
- 🔴🔴 Client ID/Secret 필요
- 🔴🔴 실제 운영 계정 필요
- ⚠️ 실제 사용자 데이터 영향

### ⚠️ 주의사항

**운영 환경 테스트는 다음 경우에만 수행하세요:**
- 개발 환경 테스트 완료 후
- 신한은행 담당자 승인 후
- 실제 배포 직전
- 충분한 검증 완료 후

### 환경 설정

`.env` 파일:

```bash
# 모드 변경
OPERATION_MODE=prod

# 운영 환경 설정 (신한은행 담당자에게 요청)
SWING_ENDPOINT_PROD=https://apigw.shinhan.com:8443
SWING_CLIENT_ID_PROD=운영_클라이언트_ID
SWING_CLIENT_SECRET_PROD=운영_클라이언트_시크릿
```

### 테스트 방법

Dev 환경과 동일하지만, **운영 서버**에 연결됩니다.

```bash
# 실행 전 반드시 확인
echo $OPERATION_MODE  # 또는 .env 확인

# 실행
node test-dev.js  # prod 모드에서도 이 파일 사용
```

---

## 📊 비교표

| 항목 | Mock | Dev | Prod |
|------|------|-----|------|
| Swing 서버 | ❌ 불필요 | ✅ 개발 서버 | ✅ 운영 서버 |
| Client ID/Secret | ❌ 불필요 | ✅ 필요 | ✅ 필요 |
| 테스트 계정 | ❌ 불필요 | ✅ 필요 | ✅ 필요 |
| VPN 연결 | ❌ 불필요 | ✅ 필요 | ✅ 필요 |
| 실행 난이도 | 😊 매우 쉬움 | 😐 보통 | 😰 어려움 |
| 권장 용도 | 로컬 개발 | 통합 테스트 | 배포 전 검증 |

---

## 🔄 환경 전환

### Mock → Dev

```bash
# .env 파일 수정
OPERATION_MODE=mock  →  OPERATION_MODE=dev
```

### Dev → Mock

```bash
# .env 파일 수정
OPERATION_MODE=dev  →  OPERATION_MODE=mock
```

### 터미널에서 일시적 변경

```bash
# Mock 모드로 실행
OPERATION_MODE=mock node test-simple.js

# Dev 모드로 실행
OPERATION_MODE=dev node test-dev.js

# Prod 모드로 실행
OPERATION_MODE=prod node test-dev.js
```

---

## 🔒 보안 체크리스트

테스트 전 확인:

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] Client Secret을 코드에 하드코딩하지 않았는가?
- [ ] 비밀번호를 코드에 작성하지 않았는가?
- [ ] 테스트 후 민감 정보를 삭제했는가?
- [ ] Git 커밋 전 `git status`로 확인했는가?

---

## 📞 지원

### Mock 환경 문제
- `test-simple.js` 확인
- `env.js`의 mockResponse 데이터 확인

### Dev/Prod 환경 문제
- 신한은행 Swing 담당자 문의
- `DEV_TEST_GUIDE.md` 참고

### 코드 통합 문제
- `SWING_INTEGRATION_GUIDE.md` 참고
- ICT Rules Quiz 팀 문의

---

## 📚 관련 문서

- [README.md](README.md) - 빠른 시작
- [DEV_TEST_GUIDE.md](DEV_TEST_GUIDE.md) - Dev 환경 상세 가이드
- [../SWING_AUTH.md](../SWING_AUTH.md) - 전체 API 문서
- [../SWING_INTEGRATION_GUIDE.md](../SWING_INTEGRATION_GUIDE.md) - 프로젝트 통합
