# Swing 인증 모듈

Swing SSO 토큰 인증 및 ID/Password 인증 기능을 제공하는 독립 모듈입니다.

## 개요

이 모듈은 신한은행 Swing 시스템과의 인증을 처리하는 순수 Node.js 모듈입니다. Directus 관련 기능은 완전히 제거되었으며, Swing 인증 기능만을 제공합니다.

## 기능

### 1. Swing SSO 토큰 인증
- Swing 포털에서 발급된 SSO 토큰으로 인증
- `/cau/v1/oauth-code-simple` API를 통한 인증 처리
- 토큰 유효성 검증 후 사용자 정보 반환

### 2. Swing ID/Password 인증
- 사번과 비밀번호로 직접 로그인
- SHA-256으로 해싱된 비밀번호로 보안 강화
- `/cau/v1/idpw-authorize` API를 통한 인증

### 3. 환경별 구분 처리
- **prod**: 운영 환경 (실제 Swing 서버 연동)
- **dev**: 개발 환경 (개발용 Swing 서버 연동)
- **mock**: 목업 환경 (가상 응답 데이터 사용)

## 파일 구조

```
swing-auth/
├── index.js       # 메인 인증 함수 (doSwingAuthenticate)
├── helpers.js     # 유틸리티 함수 (apiCall, sha256, log 등)
└── env.js         # 환경 설정 (endpoint, clientId, clientSecret)
```

## 설치

```bash
npm install axios
```

## 환경 변수 설정

`.env` 파일 또는 시스템 환경 변수에 다음 값들을 설정하세요:

```bash
# 운영 모드 설정 (prod | dev | mock)
OPERATION_MODE=mock

# 운영 환경 설정
SWING_ENDPOINT_PROD=https://apigw.shinhan.com:8443
SWING_CLIENT_ID_PROD=your_prod_client_id
SWING_CLIENT_SECRET_PROD=your_prod_client_secret

# 개발 환경 설정
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=your_dev_client_id
SWING_CLIENT_SECRET_DEV=your_dev_client_secret

# 목업 환경 설정
SWING_ENDPOINT_MOCK=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID_MOCK=5FACKST52XY6YDLM
SWING_CLIENT_SECRET_MOCK=YPZCWH4ZXLDGBVUX
```

## 사용 방법

### 1. SSO 토큰 인증

```javascript
const { doSwingAuthenticate } = require('./swing-auth');

async function loginWithSSO() {
  try {
    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: 'gw_sso_auth_code_value'
    });

    console.log('로그인 성공:', user);
    console.log('사용자 이름:', user.employeeName);
    console.log('사번:', user.employeeNo);
    console.log('부서:', user.departmentName);
    console.log('이메일:', user.companyEmail);
  } catch (error) {
    console.error('로그인 실패:', error.message);
  }
}

loginWithSSO();
```

### 2. ID/Password 인증

```javascript
const { doSwingAuthenticate } = require('./swing-auth');

async function loginWithPassword() {
  try {
    const user = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: '12345678',
      password: 'mypassword'
    });

    console.log('로그인 성공:', user);
    console.log('사용자 이름:', user.employeeName);
    console.log('사번:', user.employeeNo);
    console.log('부서:', user.departmentName);
    console.log('이메일:', user.companyEmail);
  } catch (error) {
    console.error('로그인 실패:', error.message);
  }
}

loginWithPassword();
```

### 3. Express.js와 통합

```javascript
const express = require('express');
const { doSwingAuthenticate } = require('./swing-auth');

const app = express();
app.use(express.json());

// SSO 로그인 엔드포인트
app.get('/auth/sso', async (req, res) => {
  try {
    const ssoToken = req.query.gw_sso_auth_code;

    if (!ssoToken) {
      return res.status(400).json({ error: 'SSO 토큰이 필요합니다' });
    }

    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken
    });

    // 세션 생성 또는 JWT 발급
    req.session.user = user;

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ID/Password 로그인 엔드포인트
app.post('/auth/login', async (req, res) => {
  try {
    const { employeeNo, password } = req.body;

    if (!employeeNo || !password) {
      return res.status(400).json({ error: '사번과 비밀번호가 필요합니다' });
    }

    const user = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo,
      password
    });

    // 세션 생성 또는 JWT 발급
    req.session.user = user;

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API 명세

### doSwingAuthenticate(options)

Swing 인증을 수행하는 메인 함수입니다.

#### Parameters

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| options | object | ✓ | 인증 옵션 |
| options.type | string | ✓ | 인증 타입 ('sso' 또는 'idpw') |
| options.ssoToken | string | △ | SSO 토큰 (type='sso'일 때 필수) |
| options.employeeNo | string | △ | 사번 (type='idpw'일 때 필수) |
| options.password | string | △ | 비밀번호 (type='idpw'일 때 필수) |

#### Returns

`Promise<object>` - 사용자 정보 객체

```javascript
{
  authResult: 'SUCCESS',           // 인증 결과
  companyCode: 'SH',              // 회사 코드
  companyEmail: 'string',         // 회사 이메일
  departmentNo: 'string',         // 부서 코드
  departmentName: 'string',       // 부서명
  employeeName: 'string',         // 사용자명
  employeeNo: 'string',           // 사번
  employeePositionName: 'string'  // 직책
}
```

#### Throws

`Error` - 인증 실패 시 에러를 발생시킵니다.

## Swing API 명세

### 1. SSO 토큰 인증 API

**Endpoint**: `POST /cau/v1/oauth-code-simple`

**Request**:
```json
{
  "common": {
    "clientId": "string",
    "clientSecret": "string"
  },
  "data": {
    "code": "string"
  }
}
```

**Response**:
```json
{
  "data": {
    "authResult": "SUCCESS",
    "companyCode": "SH",
    "companyEmail": "user@swing.shinhan.com",
    "departmentNo": "1234567",
    "departmentName": "ICT본부",
    "employeeName": "홍길동",
    "employeeNo": "12345678",
    "employeePositionName": "부장"
  }
}
```

### 2. ID/Password 인증 API

**Endpoint**: `POST /cau/v1/idpw-authorize`

**Request**:
```json
{
  "common": {
    "clientId": "string",
    "clientSecret": "string",
    "companyCode": "SH",
    "employeeNo": "12345678"
  },
  "data": {
    "loginPassword": "SHA256_hashed_password"
  }
}
```

**Response**: SSO 토큰 인증과 동일

## 환경 모드

### Production (운영)
```javascript
// 환경 변수 설정
process.env.OPERATION_MODE = 'prod';
// 또는
process.env.NODE_ENV = 'production';
```
- 실제 Swing 운영 서버에 연동
- HTTPS 필수
- 실제 clientId/clientSecret 필요

### Development (개발)
```javascript
process.env.OPERATION_MODE = 'dev';
// 또는
process.env.NODE_ENV = 'development';
```
- Swing 개발 서버에 연동
- 테스트 계정으로 인증 가능

### Mock (목업)
```javascript
process.env.OPERATION_MODE = 'mock';
```
- 가상 응답 데이터 사용
- 실제 Swing 서버 호출 없음
- 로컬 개발 및 테스트에 적합
- 기본값

## 보안 고려사항

1. **환경 변수 관리**
   - `clientId`와 `clientSecret`은 반드시 환경 변수로 관리
   - `.env` 파일은 `.gitignore`에 추가
   - 운영 환경에서는 시스템 환경 변수 사용 권장

2. **HTTPS 사용**
   - 운영 환경에서는 반드시 HTTPS 엔드포인트 사용
   - 개발 환경에서도 가능한 HTTPS 사용

3. **비밀번호 해싱**
   - 비밀번호는 SHA-256으로 해싱 후 전송
   - 평문 비밀번호는 절대 저장하지 않음

4. **에러 메시지**
   - 클라이언트에게 상세한 오류 정보 노출 주의
   - 로그에만 상세 정보 기록

## 에러 처리

모든 인증 함수는 실패 시 `Error` 객체를 throw합니다.

```javascript
try {
  const user = await doSwingAuthenticate({
    type: 'idpw',
    employeeNo: '12345678',
    password: 'wrongpassword'
  });
} catch (error) {
  // 에러 메시지 예시:
  // - "인증 타입이 올바르지 않습니다."
  // - "SSO 토큰이 필요합니다."
  // - "사번과 비밀번호가 필요합니다."
  // - "Swing SSO 인증 실패: ..."
  // - "Swing ID/Password 인증 실패: ..."
  console.error('인증 오류:', error.message);
}
```

## 로깅

모든 주요 동작은 콘솔에 로깅됩니다.

```
[swing-auth] 현재 환경: mock
[swing-auth] Swing 엔드포인트: http://127.0.0.1:8055/swing-mock-server
[swing-auth] Mock 환경: 가상 응답 데이터 반환
[swing-auth] Swing 인증 성공: { employeeName: '테스트사용자', ... }
```

로그 출력을 비활성화하려면 `helpers.js`의 `log` 함수를 수정하세요.

## 라이센스

MIT

## 지원

문의사항은 ICT Rules Quiz 프로젝트 관리자에게 연락하세요.
