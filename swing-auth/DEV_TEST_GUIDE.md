# Swing 인증 모듈 - Dev 환경 테스트 가이드

실제 Swing 개발 서버와 연동하여 테스트하는 방법을 설명합니다.

## ⚠️ 사전 준비사항

### 1. 필요한 정보

Dev 환경 테스트를 위해서는 다음 정보가 필요합니다:

| 항목 | 설명 | 제공처 |
|------|------|--------|
| `SWING_CLIENT_ID_DEV` | Swing 개발 서버 클라이언트 ID | 신한은행 Swing 담당자 |
| `SWING_CLIENT_SECRET_DEV` | Swing 개발 서버 클라이언트 Secret | 신한은행 Swing 담당자 |
| SSO 토큰 | Swing 포털 로그인 시 발급되는 토큰 | Swing 개발 포털 |
| 테스트 계정 | 사번 (8자리) + 비밀번호 | 신한은행 인사팀 |

### 2. 신한은행 담당자에게 요청할 내용

```
안녕하세요,

ICT Rules Quiz 프로젝트에서 Swing 인증 연동을 진행 중입니다.
개발 서버 테스트를 위해 다음 정보가 필요합니다:

1. Swing 개발 서버 엔드포인트: https://apigwdev.shinhan.com:8443
2. 개발 서버용 Client ID
3. 개발 서버용 Client Secret
4. 테스트용 계정 (사번 + 비밀번호)

감사합니다.
```

## 📝 설정 방법

### 1단계: .env 파일 수정

`.env` 파일을 열어서 다음 값들을 실제 값으로 변경하세요:

```bash
# 운영 모드를 dev로 변경
OPERATION_MODE=dev

# 개발 환경 설정 (실제 값으로 변경)
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=실제_클라이언트_ID_입력
SWING_CLIENT_SECRET_DEV=실제_클라이언트_시크릿_입력
```

**예시:**
```bash
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=ABC123XYZ456
SWING_CLIENT_SECRET_DEV=secret_key_abc123xyz456
```

### 2단계: 테스트 데이터 준비

#### 방법 A: SSO 토큰 인증 테스트

1. **Swing 개발 포털 로그인**
   - URL: https://apigwdev.shinhan.com (또는 담당자 제공 URL)
   - 테스트 계정으로 로그인

2. **SSO 토큰 추출**
   - 로그인 후 브라우저 주소창 확인
   - URL에서 `gw_sso_auth_code=` 뒤의 값 복사
   - 예: `https://...?gw_sso_auth_code=ABC123XYZ456...`

3. **토큰 유효 시간**
   - SSO 토큰은 보통 5~10분 정도만 유효
   - 만료되면 다시 로그인하여 새 토큰 발급

#### 방법 B: ID/Password 인증 테스트

1. **테스트 계정 확인**
   - 사번: 8자리 숫자 (예: 12345678)
   - 비밀번호: Swing 비밀번호

## 🧪 테스트 실행

### 기본 테스트

```bash
cd c:\IctRulesQuiz\swing-auth
node test-dev.js
```

이 명령을 실행하면:
- 현재 환경 설정 확인
- Client ID/Secret 설정 여부 확인
- 테스트 가이드 출력

### SSO 토큰 인증 테스트

`test-dev.js` 파일을 열어서 **Line 39-53**의 주석을 해제하고 실제 SSO 토큰을 입력:

```javascript
// 주석 해제 ↓
try {
  const user = await doSwingAuthenticate({
    type: 'sso',
    ssoToken: '여기에_실제_SSO_토큰을_입력'  // ← 실제 토큰으로 변경
  });

  console.log('\n✅ SSO 인증 성공!');
  console.log('  사용자명:', user.employeeName);
  console.log('  사번:', user.employeeNo);
  console.log('  부서:', user.departmentName);
  console.log('  이메일:', user.companyEmail);
} catch (error) {
  console.error('\n❌ SSO 인증 실패:', error.message);
}
```

**실행:**
```bash
node test-dev.js
```

**예상 결과 (성공 시):**
```
✅ SSO 인증 성공!
  사용자명: 홍길동
  사번: 12345678
  부서: ICT본부
  이메일: sh12345678@swing.shinhan.com
```

### ID/Password 인증 테스트

`test-dev.js` 파일을 열어서 **Line 72-87**의 주석을 해제하고 실제 계정 정보 입력:

```javascript
// 주석 해제 ↓
try {
  const user = await doSwingAuthenticate({
    type: 'idpw',
    employeeNo: '12345678',      // ← 실제 사번으로 변경
    password: 'your_password'    // ← 실제 비밀번호로 변경
  });

  console.log('\n✅ ID/PW 인증 성공!');
  console.log('  사용자명:', user.employeeName);
  console.log('  사번:', user.employeeNo);
  console.log('  부서:', user.departmentName);
  console.log('  직책:', user.employeePositionName);
  console.log('  이메일:', user.companyEmail);
} catch (error) {
  console.error('\n❌ ID/PW 인증 실패:', error.message);
}
```

**⚠️ 주의: 테스트 후 반드시 비밀번호를 코드에서 제거하세요!**

## 🐛 문제 해결

### 1. "Client ID와 Client Secret이 설정되지 않았습니다"

**원인:**
- `.env` 파일에 실제 값이 입력되지 않음

**해결:**
```bash
# .env 파일 확인
SWING_CLIENT_ID_DEV=YOUR_DEV_CLIENT_ID_HERE  # ← 이 상태면 안됨
SWING_CLIENT_SECRET_DEV=YOUR_DEV_CLIENT_SECRET_HERE
```

실제 값으로 변경:
```bash
SWING_CLIENT_ID_DEV=ABC123XYZ456
SWING_CLIENT_SECRET_DEV=secret_key_abc123xyz456
```

### 2. "timeout of 10000ms exceeded"

**원인:**
- Swing 개발 서버에 연결할 수 없음
- 네트워크 문제 또는 VPN 미연결

**해결:**
1. 신한은행 VPN 연결 확인
2. 방화벽 설정 확인
3. Endpoint URL 확인
4. 담당자에게 개발 서버 상태 문의

### 3. "Swing 인증 실패: authResult=FAIL"

**원인:**
- SSO 토큰 만료
- 잘못된 사번/비밀번호
- Client ID/Secret 불일치

**해결:**
1. **SSO 토큰 재발급**
   - 다시 로그인하여 새 토큰 받기
   - 토큰은 5~10분만 유효

2. **계정 정보 확인**
   - 사번: 8자리 숫자인지 확인
   - 비밀번호: 대소문자 구분 확인

3. **Client ID/Secret 확인**
   - 담당자에게 정확한 값 재확인

### 4. "Swing 응답에 이메일 주소가 없습니다"

**원인:**
- 테스트 계정에 이메일이 등록되지 않음

**해결:**
- 담당자에게 계정에 이메일 등록 요청
- 또는 다른 테스트 계정 사용

## 📊 예상 응답 데이터

### 성공 응답 (authResult: SUCCESS)

```javascript
{
  authResult: 'SUCCESS',
  companyCode: 'SH',
  companyEmail: 'sh12345678@swing.shinhan.com',
  departmentNo: '1234567',
  departmentName: 'ICT본부',
  employeeName: '홍길동',
  employeeNo: '12345678',
  employeePositionName: '부장'
}
```

### 실패 응답 예시

**1. 토큰 만료**
```javascript
{
  authResult: 'FAIL',
  errorCode: 'TOKEN_EXPIRED',
  errorMessage: 'SSO token has expired'
}
```

**2. 잘못된 비밀번호**
```javascript
{
  authResult: 'FAIL',
  errorCode: 'INVALID_PASSWORD',
  errorMessage: 'Invalid employee number or password'
}
```

**3. 존재하지 않는 사번**
```javascript
{
  authResult: 'FAIL',
  errorCode: 'USER_NOT_FOUND',
  errorMessage: 'Employee not found'
}
```

## 🔒 보안 주의사항

### 절대 금지 사항

1. ❌ **비밀번호를 코드에 하드코딩하지 마세요**
   - 테스트 후 반드시 제거
   - Git 커밋 전 확인

2. ❌ **Client Secret을 공개하지 마세요**
   - `.env` 파일을 Git에 커밋하지 마세요
   - `.gitignore`에 `.env` 추가 확인

3. ❌ **SSO 토큰을 공유하지 마세요**
   - 개인 인증 정보이므로 타인과 공유 금지
   - 로그에 출력되지 않도록 주의

### 권장 사항

1. ✅ **환경 변수 사용**
   ```bash
   # 터미널에서 직접 실행
   SWING_CLIENT_ID_DEV=abc123 SWING_CLIENT_SECRET_DEV=xyz456 node test-dev.js
   ```

2. ✅ **별도 테스트 파일 사용**
   - `test-dev-local.js` (Git 제외)
   - 실제 계정 정보는 여기에만 작성

3. ✅ **테스트 완료 후 정리**
   ```bash
   # 비밀번호 제거 확인
   grep -r "password" test-dev.js

   # Git 상태 확인
   git status
   ```

## 📞 지원

문제가 해결되지 않으면:

1. **Swing 담당자 연락**
   - Client ID/Secret 재확인
   - 테스트 계정 상태 확인
   - 개발 서버 접근 권한 확인

2. **ICT Rules Quiz 팀 문의**
   - 통합 관련 기술 지원
   - 코드 수정 지원

## 🔄 Mock 모드로 되돌리기

Dev 테스트 완료 후 Mock 모드로 되돌리려면:

```bash
# .env 파일에서
OPERATION_MODE=mock  # dev → mock으로 변경
```

또는:

```bash
# 터미널에서 환경 변수로 실행
OPERATION_MODE=mock node test-simple.js
```
