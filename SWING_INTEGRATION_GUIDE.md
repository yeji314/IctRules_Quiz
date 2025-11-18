# ICT Rules Quiz - Swing 인증 통합 가이드

이 문서는 ICT Rules Quiz 프로젝트에 Swing 인증 모듈을 통합하는 방법을 설명합니다.

## 프로젝트 구조

```
IctRulesQuiz/
├── swing-auth/              # Swing 인증 독립 모듈
│   ├── index.js            # 메인 인증 함수
│   ├── helpers.js          # 유틸리티 함수
│   ├── env.js              # 환경 설정
│   ├── example.js          # 사용 예제
│   ├── package.json        # 패키지 설정
│   └── README.md           # 모듈 README
├── server/                  # 기존 서버 코드
│   ├── controllers/
│   ├── services/
│   └── middleware/
│       └── swingAuth.js    # 👈 새로 추가할 미들웨어
├── SWING_AUTH.md           # Swing 인증 모듈 상세 문서
└── SWING_INTEGRATION_GUIDE.md  # 이 파일
```

## 통합 단계

### 1단계: Swing 인증 모듈 설치

```bash
cd swing-auth
npm install
```

### 2단계: 환경 변수 설정

`.env` 파일에 Swing 인증 관련 환경 변수 추가:

```bash
# Swing 인증 설정
OPERATION_MODE=mock

# 운영 환경
SWING_ENDPOINT_PROD=https://apigw.shinhan.com:8443
SWING_CLIENT_ID_PROD=
SWING_CLIENT_SECRET_PROD=

# 개발 환경
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=
SWING_CLIENT_SECRET_DEV=

# 목업 환경
SWING_ENDPOINT_MOCK=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID_MOCK=5FACKST52XY6YDLM
SWING_CLIENT_SECRET_MOCK=YPZCWH4ZXLDGBVUX
```

### 3단계: Express.js 미들웨어 생성

`server/middleware/swingAuth.js` 파일을 생성합니다:

```javascript
const { doSwingAuthenticate } = require('../../swing-auth');

/**
 * Swing 인증 미들웨어
 *
 * SSO 토큰 또는 ID/Password로 인증을 처리합니다.
 */
async function swingAuthMiddleware(req, res, next) {
  try {
    // SSO 토큰 확인
    const ssoToken = req.query.gw_sso_auth_code;

    if (ssoToken) {
      // SSO 토큰 인증
      const user = await doSwingAuthenticate({
        type: 'sso',
        ssoToken
      });

      req.swingUser = user;
      return next();
    }

    // ID/Password 인증 확인
    const { employeeNo, password } = req.body;

    if (employeeNo && password) {
      // ID/Password 인증
      const user = await doSwingAuthenticate({
        type: 'idpw',
        employeeNo,
        password
      });

      req.swingUser = user;
      return next();
    }

    // 인증 정보가 없으면 다음으로 진행
    next();
  } catch (error) {
    console.error('Swing 인증 오류:', error.message);
    res.status(401).json({
      error: '인증에 실패했습니다',
      message: error.message
    });
  }
}

module.exports = swingAuthMiddleware;
```

### 4단계: 라우트에 통합

`server/routes/auth.js` (새로 생성):

```javascript
const express = require('express');
const router = express.Router();
const { doSwingAuthenticate } = require('../../swing-auth');

/**
 * SSO 로그인
 * GET /api/auth/sso?gw_sso_auth_code=xxx
 */
router.get('/sso', async (req, res) => {
  try {
    const ssoToken = req.query.gw_sso_auth_code;

    if (!ssoToken) {
      return res.status(400).json({
        error: 'SSO 토큰이 필요합니다'
      });
    }

    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken
    });

    // 세션 생성 (기존 인증 방식과 통합)
    req.session.user = {
      id: user.employeeNo,
      name: user.employeeName,
      email: user.companyEmail,
      department: user.departmentName,
      position: user.employeePositionName
    };

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (error) {
    console.error('SSO 인증 실패:', error);
    res.status(401).json({
      error: '인증에 실패했습니다',
      message: error.message
    });
  }
});

/**
 * ID/Password 로그인
 * POST /api/auth/login
 * Body: { employeeNo, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { employeeNo, password } = req.body;

    if (!employeeNo || !password) {
      return res.status(400).json({
        error: '사번과 비밀번호가 필요합니다'
      });
    }

    const user = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo,
      password
    });

    // 세션 생성 (기존 인증 방식과 통합)
    req.session.user = {
      id: user.employeeNo,
      name: user.employeeName,
      email: user.companyEmail,
      department: user.departmentName,
      position: user.employeePositionName
    };

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (error) {
    console.error('ID/Password 인증 실패:', error);
    res.status(401).json({
      error: '인증에 실패했습니다',
      message: error.message
    });
  }
});

/**
 * 로그아웃
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: '로그아웃에 실패했습니다'
      });
    }
    res.json({
      success: true,
      message: '로그아웃되었습니다'
    });
  });
});

module.exports = router;
```

### 5단계: 서버에 라우트 등록

`server/app.js` 또는 `server/index.js`에 라우트 등록:

```javascript
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/auth');

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// 인증 라우트 등록
app.use('/api/auth', authRoutes);

// 기존 라우트들...
app.use('/api/quiz', require('./routes/quiz'));

// ... 나머지 설정
```

### 6단계: 클라이언트 통합

#### SSO 로그인 페이지 (`client/pages/login-sso.html`):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Swing SSO 로그인</title>
</head>
<body>
  <h1>Swing SSO 로그인</h1>
  <p>Swing 포털에서 자동으로 로그인됩니다...</p>

  <script>
    // URL에서 SSO 토큰 추출
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('gw_sso_auth_code');

    if (ssoToken) {
      // SSO 인증 요청
      fetch(`/api/auth/sso?gw_sso_auth_code=${ssoToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert(`환영합니다, ${data.user.name}님!`);
            window.location.href = '/pages/quiz-list.html';
          } else {
            alert('로그인에 실패했습니다: ' + data.error);
          }
        })
        .catch(error => {
          console.error('SSO 인증 오류:', error);
          alert('인증 중 오류가 발생했습니다.');
        });
    } else {
      alert('SSO 토큰이 없습니다.');
      window.location.href = '/pages/login.html';
    }
  </script>
</body>
</html>
```

#### ID/Password 로그인 (`client/js/pages/login.js` 수정):

```javascript
// 기존 로그인 폼에 Swing 인증 추가
async function handleLogin(event) {
  event.preventDefault();

  const employeeNo = document.getElementById('employeeNo').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ employeeNo, password })
    });

    const data = await response.json();

    if (data.success) {
      alert(`환영합니다, ${data.user.name}님!`);
      window.location.href = '/pages/quiz-list.html';
    } else {
      alert('로그인 실패: ' + data.error);
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
}
```

## 테스트

### 1. 모듈 단독 테스트

```bash
cd swing-auth
npm run example
```

### 2. SSO 로그인 테스트

```
http://localhost:5000/pages/login-sso.html?gw_sso_auth_code=test_token
```

### 3. ID/Password 로그인 테스트

로그인 페이지에서:
- 사번: 12345678
- 비밀번호: (임의의 비밀번호)

Mock 모드에서는 모든 인증이 성공합니다.

## 환경별 배포

### Mock 환경 (로컬 개발)
```bash
OPERATION_MODE=mock npm start
```
가상 응답 데이터 사용, 실제 Swing 서버 연동 없음

### Dev 환경 (개발 서버)
```bash
OPERATION_MODE=dev npm start
```
Swing 개발 서버에 연동

### Prod 환경 (운영 서버)
```bash
OPERATION_MODE=prod npm start
```
Swing 운영 서버에 연동

## 주의사항

1. **환경 변수 보안**
   - `SWING_CLIENT_ID`와 `SWING_CLIENT_SECRET`은 절대 Git에 커밋하지 마세요
   - `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다

2. **HTTPS 필수**
   - 운영 환경에서는 반드시 HTTPS를 사용하세요
   - SSO 토큰은 HTTPS로만 전송되어야 합니다

3. **세션 관리**
   - 세션 시크릿은 안전하게 관리하세요
   - 운영 환경에서는 Redis 등의 세션 스토어 사용을 권장합니다

4. **에러 로깅**
   - 인증 실패 시 상세 로그를 남기세요
   - 사용자에게는 일반적인 오류 메시지만 표시하세요

## 트러블슈팅

### "Swing API 호출 실패" 에러
- Swing 엔드포인트가 올바른지 확인
- clientId와 clientSecret이 올바른지 확인
- 네트워크 연결 확인

### "인증 타입이 올바르지 않습니다" 에러
- `type` 파라미터가 'sso' 또는 'idpw'인지 확인

### Mock 환경에서도 인증 실패
- `OPERATION_MODE=mock` 환경 변수 확인
- `env.js` 파일의 mockResponse 데이터 확인

## 추가 지원

문의사항은 ICT Rules Quiz 프로젝트 팀에 문의하세요.
