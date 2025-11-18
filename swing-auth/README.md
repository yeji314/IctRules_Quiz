# Swing 인증 모듈

신한은행 Swing 시스템과의 SSO 토큰 인증 및 ID/Password 인증을 처리하는 독립 Node.js 모듈입니다.

## 빠른 시작

### 1. 설치

```bash
cd swing-auth
npm install
```

### 2. 환경 설정

프로젝트 루트에 `.env` 파일을 생성하거나 환경 변수를 설정합니다:

```bash
# 운영 모드 (prod | dev | mock)
OPERATION_MODE=mock

# 운영 환경
SWING_ENDPOINT_PROD=https://apigw.shinhan.com:8443
SWING_CLIENT_ID_PROD=your_client_id
SWING_CLIENT_SECRET_PROD=your_client_secret

# 개발 환경
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=your_dev_client_id
SWING_CLIENT_SECRET_DEV=your_dev_client_secret

# 목업 환경 (기본값)
SWING_ENDPOINT_MOCK=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID_MOCK=5FACKST52XY6YDLM
SWING_CLIENT_SECRET_MOCK=YPZCWH4ZXLDGBVUX
```

### 3. 사용 예제

#### SSO 토큰 인증

```javascript
const { doSwingAuthenticate } = require('./swing-auth');

const user = await doSwingAuthenticate({
  type: 'sso',
  ssoToken: 'your_sso_token'
});

console.log('로그인 성공:', user.employeeName);
```

#### ID/Password 인증

```javascript
const { doSwingAuthenticate } = require('./swing-auth');

const user = await doSwingAuthenticate({
  type: 'idpw',
  employeeNo: '12345678',
  password: 'mypassword'
});

console.log('로그인 성공:', user.employeeName);
```

### 4. 예제 실행

```bash
npm run example
```

## 반환 데이터 구조

```javascript
{
  authResult: 'SUCCESS',
  companyCode: 'SH',
  companyEmail: 'user@swing.shinhan.com',
  departmentNo: '1234567',
  departmentName: 'ICT본부',
  employeeName: '홍길동',
  employeeNo: '12345678',
  employeePositionName: '부장'
}
```

## 파일 구조

```
swing-auth/
├── index.js       # 메인 인증 함수
├── helpers.js     # 유틸리티 함수
├── env.js         # 환경 설정
├── example.js     # 사용 예제
├── package.json   # 패키지 설정
└── README.md      # 이 파일
```

## 주요 기능

- ✅ Swing SSO 토큰 인증
- ✅ Swing ID/Password 인증 (SHA-256 해싱)
- ✅ 환경별 구분 (prod/dev/mock)
- ✅ Mock 모드에서 가상 응답 데이터 사용
- ✅ 에러 처리 및 로깅
- ❌ Directus 관련 기능 전부 제거됨

## 상세 문서

자세한 사용 방법은 프로젝트 루트의 [SWING_AUTH.md](../SWING_AUTH.md) 문서를 참고하세요.

## 라이센스

MIT
