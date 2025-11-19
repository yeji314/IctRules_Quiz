# ICT Rules Quiz - 프로젝트 통합 가이드

> **최종 업데이트**: 2025-01-19
> **버전**: 1.0.0
> **프로젝트**: 신한은행 ICT 규정 퀴즈 시스템

---

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [Swing 인증 시스템](#5-swing-인증-시스템)
6. [인증 흐름도](#6-인증-흐름도)
7. [데이터베이스 구조](#7-데이터베이스-구조)
8. [API 엔드포인트](#8-api-엔드포인트)
9. [퀴즈 진행 흐름](#9-퀴즈-진행-흐름)
10. [환경 설정](#10-환경-설정)
11. [배포 가이드](#11-배포-가이드)
12. [트러블슈팅](#12-트러블슈팅)

---

## 1. 프로젝트 개요

### 1.1 목적
신한은행 임직원을 대상으로 ICT 규정 및 보안 지침을 학습할 수 있는 퀴즈 플랫폼입니다.

### 1.2 주요 기능
- ✅ **Swing SSO 인증**: 신한은행 통합 인증 시스템
- ✅ **월별 퀴즈**: 매월 새로운 ICT 규정 퀴즈 제공
- ✅ **다양한 문제 유형**: OX, 객관식, 빈칸 채우기, 드래그앤드롭, 타이핑 등
- ✅ **실시간 피드백**: 정답/오답 즉시 확인 및 캐릭터 반응
- ✅ **Lucky Draw**: 퀴즈 완료 시 경품 추첨 기회
- ✅ **관리자 대시보드**: 이벤트/문제 관리, 통계 조회, 당첨자 관리

### 1.3 사용자 역할
- **일반 사용자**: 퀴즈 참여, 진행 상황 확인
- **관리자**: 이벤트/문제 관리, 통계 조회, 당첨자 추첨

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   Login    │  │ Quiz List  │  │    Quiz    │  │   Admin    ││
│  │   Page     │  │    Page    │  │    Page    │  │ Dashboard  ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│         │                │                │              │       │
│         └────────────────┴────────────────┴──────────────┘       │
│                              │                                   │
│                    Static Files (HTML/CSS/JS)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server (Node.js)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        Routes                             │  │
│  │  /api/auth  │  /api/quiz  │  /api/admin  │  /api/health  │  │
│  └───────┬──────────────┬──────────────┬──────────────┬───────┘  │
│          │              │              │              │          │
│  ┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────┐   │
│  │    Auth      │ │    Quiz    │ │   Admin   │ │  Health   │   │
│  │ Controller   │ │ Controller │ │Controller │ │ Controller│   │
│  └───────┬──────┘ └─────┬──────┘ └────┬──────┘ └────┬──────┘   │
│          │              │              │              │          │
│  ┌───────▼──────────────▼──────────────▼──────────────▼───────┐ │
│  │                  Middleware Layer                           │ │
│  │  - JWT Auth Middleware                                      │ │
│  │  - Error Handler                                            │ │
│  │  - CORS Handler                                             │ │
│  └──────────────────────────────┬───────────────────────────────┘ │
│                                 │                                 │
│  ┌──────────────────────────────▼───────────────────────────────┐ │
│  │                    Swing Auth Module                         │ │
│  │  swing-auth/                                                 │ │
│  │   ├── index.js (doSwingAuthenticate)                        │ │
│  │   ├── helpers.js (apiCall, sha256)                          │ │
│  │   └── env.js (환경 설정)                                      │ │
│  └──────────────────────────────┬───────────────────────────────┘ │
│                                 │                                 │
└─────────────────────────────────┼─────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌────────────────┐      ┌──────────────────┐
│ SQLite DB     │        │  Swing Server  │      │  File System     │
│ (quiz.db)     │        │  (SSO Auth)    │      │  (Images/Logs)   │
│               │        │                │      │                  │
│ - Users       │        │ - prod env     │      │ - Quiz Images    │
│ - QuizEvents  │        │ - dev env      │      │ - Character GIFs │
│ - Questions   │        │ - mock env     │      │                  │
│ - QuizSessions│        │                │      │                  │
│ - QuizAnswers │        │                │      │                  │
│ - LuckyDraw   │        │                │      │                  │
└───────────────┘        └────────────────┘      └──────────────────┘
```

---

## 3. 기술 스택

### 3.1 Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: SQLite 3 (Sequelize ORM)
- **Authentication**: JWT + Swing SSO
- **HTTP Client**: Axios

### 3.2 Frontend
- **Language**: Vanilla JavaScript (ES6+ Modules)
- **Styling**: Custom CSS (Pixel Art Theme)
- **Font**: Press Start 2P, Galmuri

### 3.3 DevOps
- **Container**: Docker
- **Process Manager**: PM2 (optional)
- **Environment**: dotenv

---

## 4. 프로젝트 구조

```
IctRulesQuiz/
├── 📁 client/                      # 프론트엔드
│   ├── 📁 css/                     # 스타일시트
│   │   ├── global.css              # 전역 스타일
│   │   ├── login.css               # 로그인 페이지
│   │   ├── login-decorations.css   # 로그인 장식
│   │   ├── decorations.css         # 공통 장식 요소
│   │   ├── quiz-list.css           # 퀴즈 목록 페이지
│   │   └── quiz.css                # 퀴즈 진행 페이지
│   ├── 📁 js/                      # 자바스크립트
│   │   ├── 📁 modules/             # 공통 모듈
│   │   │   ├── api.js              # API 클라이언트
│   │   │   ├── auth.js             # 인증 관리
│   │   │   └── utils.js            # 유틸리티 함수
│   │   └── 📁 pages/               # 페이지별 스크립트
│   │       ├── login.js            # 로그인
│   │       ├── quiz-list.js        # 퀴즈 목록
│   │       ├── quiz.js             # 퀴즈 진행
│   │       ├── result.js           # 결과 페이지
│   │       └── admin-dashboard.js  # 관리자 대시보드
│   ├── 📁 pages/                   # HTML 페이지
│   │   ├── index.html              # 로그인 페이지
│   │   ├── quiz-list.html          # 퀴즈 목록
│   │   ├── quiz.html               # 퀴즈 진행
│   │   ├── result.html             # 결과 확인
│   │   └── 📁 admin/
│   │       └── dashboard.html      # 관리자 대시보드
│   └── 📁 images/                  # 이미지/GIF
│       ├── character.png           # 캐릭터 이미지
│       └── SOLwalking2.gif         # 걷는 캐릭터 GIF
│
├── 📁 server/                      # 백엔드
│   ├── 📁 config/                  # 설정 파일
│   │   └── database.js             # DB 설정
│   ├── 📁 controllers/             # 컨트롤러
│   │   ├── authController.js       # 인증 (로그인/로그아웃)
│   │   ├── quizController.js       # 퀴즈 (시작/답변/완료)
│   │   └── adminController.js      # 관리자 (이벤트/통계)
│   ├── 📁 middleware/              # 미들웨어
│   │   └── auth.js                 # JWT 인증 미들웨어
│   ├── 📁 models/                  # Sequelize 모델
│   │   ├── index.js                # 모델 통합
│   │   ├── User.js                 # 사용자
│   │   ├── QuizEvent.js            # 퀴즈 이벤트
│   │   ├── Question.js             # 문제
│   │   ├── QuizSession.js          # 퀴즈 세션
│   │   ├── QuizAnswer.js           # 답변 기록
│   │   ├── LuckyDraw.js            # 경품 추첨
│   │   └── SSOSettings.js          # SSO 설정
│   ├── 📁 routes/                  # 라우트
│   │   ├── auth.js                 # 인증 라우트
│   │   ├── quiz.js                 # 퀴즈 라우트
│   │   ├── admin.js                # 관리자 라우트
│   │   └── health.js               # 헬스체크
│   ├── 📁 utils/                   # 유틸리티
│   │   └── jwt.js                  # JWT 토큰 생성/검증
│   ├── 📁 migrations/              # DB 마이그레이션
│   │   └── 20250102000000-init-database.js
│   ├── 📁 seeders/                 # 시드 데이터
│   │   └── 20250102000001-admin-user.js
│   └── server.js                   # 서버 엔트리 포인트
│
├── 📁 swing-auth/                  # Swing 인증 모듈 (독립)
│   ├── index.js                    # 메인 인증 함수
│   ├── helpers.js                  # 유틸리티 (API 호출, SHA256)
│   ├── env.js                      # 환경별 설정
│   ├── example.js                  # 사용 예제
│   ├── package.json                # 패키지 설정
│   └── README.md                   # 모듈 가이드
│
├── 📁 database/                    # SQLite DB 파일
│   └── quiz.db
│
├── 📁 docs/                        # 문서
│   ├── ARCHITECTURE.md             # 아키텍처
│   ├── AUTH_FLOW.md                # 인증 흐름
│   └── ADMIN_GUIDE.md              # 관리자 가이드
│
├── .env                            # 환경 변수 (통합)
├── .gitignore
├── package.json
├── PROJECT_GUIDE.md                # 📌 이 문서
└── README.md                       # 프로젝트 README
```

---

## 5. Swing 인증 시스템

### 5.1 개요
신한은행 Swing 통합 인증 시스템을 사용하여 사용자 인증을 처리합니다.

### 5.2 인증 방식

#### 5.2.1 SSO 토큰 인증 (권장)
```javascript
// Swing 포털에서 발급받은 SSO 토큰으로 인증
POST /api/auth/swing/token
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 5.2.2 ID/Password 인증
```javascript
// 사번과 비밀번호로 직접 인증
POST /api/auth/login
{
  "employee_id": "12345678",
  "password": "mypassword123"
}
```

### 5.3 Swing Auth 모듈 구조

```javascript
// swing-auth/index.js - 메인 인증 함수
async function doSwingAuthenticate(options) {
  const { type, ssoToken, employeeNo, password } = options;

  if (type === 'sso') {
    return await swingSsoAuth(ssoToken);
  } else if (type === 'idpw') {
    return await swingIdPasswordAuth(employeeNo, password);
  }
}

// swing-auth/helpers.js - API 호출
async function apiCall(url, payload) {
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

// swing-auth/env.js - 환경별 설정
const config = {
  prod: {
    endpoint: 'https://apigw.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_PROD,
    clientSecret: process.env.SWING_CLIENT_SECRET_PROD
  },
  dev: {
    endpoint: 'https://apigwdev.shinhan.com:8443',
    clientId: process.env.SWING_CLIENT_ID_DEV,
    clientSecret: process.env.SWING_CLIENT_SECRET_DEV
  },
  mock: {
    endpoint: 'http://127.0.0.1:8055/swing-mock-server',
    clientId: '5FACKST52XY6YDLM',
    clientSecret: 'YPZCWH4ZXLDGBVUX'
  }
};
```

### 5.4 환경별 동작 모드

| 모드 | 설정 값 | 동작 | 사용 시점 |
|-----|--------|------|----------|
| **Mock** | `OPERATION_MODE=mock` | 가상 데이터 반환 | 로컬 개발/테스트 |
| **Dev** | `OPERATION_MODE=dev` | 개발 서버 연동 | 개발 환경 |
| **Prod** | `OPERATION_MODE=prod` | 운영 서버 연동 | 실제 운영 환경 |

### 5.5 Mock 모드 응답 데이터
```javascript
// Mock 환경에서 반환되는 가상 사용자 정보
{
  "employeeNo": "12345678",
  "userName": "테스트사용자",
  "deptName": "ICT본부",
  "emailAddress": "test@shinhan.com"
}
```

---

## 6. 인증 흐름도

### 6.1 전체 인증 흐름

```
┌─────────┐
│ Client  │
│(Browser)│
└────┬────┘
     │
     │ 1. POST /api/auth/login
     │    { employee_id, password }
     │
     ▼
┌─────────────────────────────────┐
│  authController.login()         │
│  (server/controllers/           │
│   authController.js)            │
└────┬────────────────────────────┘
     │
     │ 2. doSwingAuthenticate()
     │    { type: 'idpw', employeeNo, password }
     │
     ▼
┌─────────────────────────────────┐
│  Swing Auth Module              │
│  (swing-auth/index.js)          │
│                                 │
│  ┌───────────────────────────┐ │
│  │ getCurrentEnvironment()   │ │
│  │ → 'mock' | 'dev' | 'prod' │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ swingIdPasswordAuth()     │ │
│  │  - SHA256 해싱            │ │
│  │  - API 호출               │ │
│  └───────────────────────────┘ │
└────┬────────────────────────────┘
     │
     │ 3. API 호출
     │    POST {endpoint}/cau/v1/idpw-authorize
     │
     ▼
┌─────────────────────────────────┐
│  Swing Server                   │
│  (또는 Mock 데이터)              │
└────┬────────────────────────────┘
     │
     │ 4. 사용자 정보 반환
     │    { employeeNo, userName, deptName, ... }
     │
     ▼
┌─────────────────────────────────┐
│  authController.login()         │
│                                 │
│  5. DB 조회/생성                │
│     User.findOne()              │
│     또는 User.create()          │
│                                 │
│  6. JWT 토큰 생성               │
│     generateToken({ id, ... })  │
└────┬────────────────────────────┘
     │
     │ 7. 응답
     │    { success: true, token, user }
     │
     ▼
┌─────────┐
│ Client  │
│  - 토큰 저장 (localStorage)     │
│  - 퀴즈 목록 페이지로 이동       │
└─────────┘
```

### 6.2 SSO 토큰 인증 흐름

```
┌─────────┐
│ Swing   │
│ Portal  │
└────┬────┘
     │ SSO 토큰 발급
     │
     ▼
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /api/auth/swing/token
     │ { sso_token }
     │
     ▼
┌─────────────────────────────────┐
│  authController.swingSsoTokenLogin()  │
└────┬────────────────────────────┘
     │
     │ doSwingAuthenticate({ type: 'sso', ssoToken })
     │
     ▼
┌─────────────────────────────────┐
│  Swing Auth Module              │
│  swingSsoAuth(ssoToken)         │
│  → POST /cau/v1/oauth-code-simple │
└────┬────────────────────────────┘
     │
     │ 사용자 정보 반환
     │
     ▼
┌─────────────────────────────────┐
│  DB 조회/생성 → JWT 발급        │
└────┬────────────────────────────┘
     │
     ▼
┌─────────┐
│ Client  │
│ (로그인 완료)                   │
└─────────┘
```

### 6.3 JWT 인증 미들웨어 흐름

```
┌─────────┐
│ Client  │
│ Request │
└────┬────┘
     │ GET /api/quiz/list
     │ Header: Authorization: Bearer {token}
     │
     ▼
┌─────────────────────────────────┐
│  auth.js Middleware             │
│  (server/middleware/auth.js)    │
│                                 │
│  1. 토큰 추출                   │
│  2. jwt.verify(token, SECRET)   │
│  3. req.user = decoded          │
└────┬────────────────────────────┘
     │
     │ ✅ 토큰 유효
     │
     ▼
┌─────────────────────────────────┐
│  quizController.getList()       │
│  (실제 API 로직 실행)            │
└────┬────────────────────────────┘
     │
     ▼
┌─────────┐
│ Client  │
│ Response│
└─────────┘

❌ 토큰 무효 시:
└─> 401 Unauthorized
    { error: '인증에 실패했습니다' }
```

---

## 7. 데이터베이스 구조

### 7.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│     User        │ 1        N ┌─────────────────┐
│─────────────────│───────────│  QuizSession    │
│ id (PK)         │            │─────────────────│
│ employee_id     │            │ id (PK)         │
│ password        │            │ user_id (FK)    │
│ name            │            │ event_id (FK)   │
│ department      │            │ status          │
│ email           │            │ score           │
│ role            │            │ started_at      │
│ login_method    │            │ completed_at    │
└─────────────────┘            └────────┬────────┘
        │                               │
        │ 1                             │ 1
        │                               │
        │ N                             │ N
┌───────▼─────────┐            ┌────────▼────────┐
│   LuckyDraw     │            │  QuizAnswer     │
│─────────────────│            │─────────────────│
│ id (PK)         │            │ id (PK)         │
│ user_id (FK)    │            │ session_id (FK) │
│ event_id (FK)   │            │ question_id (FK)│
│ prize           │            │ user_answer     │
│ won             │            │ is_correct      │
│ claimed         │            │ time_taken      │
└─────────────────┘            └─────────────────┘
                                        │
                                        │ N
                                        │
                                        │ 1
┌─────────────────┐            ┌────────▼────────┐
│   QuizEvent     │ 1        N │    Question     │
│─────────────────│───────────│─────────────────│
│ id (PK)         │            │ id (PK)         │
│ title           │            │ event_id (FK)   │
│ month           │            │ question_text   │
│ year            │            │ type            │
│ start_date      │            │ correct_answer  │
│ end_date        │            │ options         │
│ is_active       │            │ order_num       │
└─────────────────┘            └─────────────────┘

┌─────────────────┐
│  SSOSettings    │ (독립 테이블)
│─────────────────│
│ id (PK)         │
│ setting_key     │
│ setting_value   │
│ data_type       │
│ description     │
│ category        │
└─────────────────┘
```

### 7.2 주요 테이블 설명

#### User (사용자)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id VARCHAR(20) UNIQUE NOT NULL,  -- 행원번호
  password VARCHAR(255) NOT NULL,           -- 해시된 비밀번호
  name VARCHAR(100) NOT NULL,               -- 이름
  department VARCHAR(100),                  -- 부서
  email VARCHAR(100),                       -- 이메일
  role VARCHAR(20) DEFAULT 'user',          -- 'user' | 'admin'
  login_method VARCHAR(20) DEFAULT 'local', -- 'local' | 'swing_sso'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### QuizEvent (퀴즈 이벤트)
```sql
CREATE TABLE quiz_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(200) NOT NULL,              -- 이벤트 제목
  month INTEGER NOT NULL,                   -- 월 (1-12)
  year INTEGER NOT NULL,                    -- 년도
  start_date DATETIME NOT NULL,             -- 시작일
  end_date DATETIME NOT NULL,               -- 종료일
  is_active BOOLEAN DEFAULT 1,              -- 활성화 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Question (문제)
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,                -- QuizEvent FK
  question_text TEXT NOT NULL,              -- 문제 텍스트
  type VARCHAR(20) NOT NULL,                -- 'ox' | 'fillblank' | 'dragdrop' | 'typing' | 'finderror'
  correct_answer TEXT NOT NULL,             -- 정답
  options TEXT,                             -- 선택지 (JSON)
  order_num INTEGER NOT NULL,               -- 문제 순서
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES quiz_events(id)
);
```

#### QuizSession (퀴즈 세션)
```sql
CREATE TABLE quiz_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- User FK
  event_id INTEGER NOT NULL,                -- QuizEvent FK
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'cancelled'
  score INTEGER DEFAULT 0,                  -- 점수
  total_questions INTEGER DEFAULT 0,        -- 전체 문제 수
  correct_answers INTEGER DEFAULT 0,        -- 정답 수
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  prize_drawn BOOLEAN DEFAULT 0,            -- 경품 추첨 여부
  prize_result TEXT,                        -- 추첨 결과 (JSON)
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES quiz_events(id)
);
```

#### QuizAnswer (답변 기록)
```sql
CREATE TABLE quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,              -- QuizSession FK
  question_id INTEGER NOT NULL,             -- Question FK
  user_answer TEXT NOT NULL,                -- 사용자 답변
  is_correct BOOLEAN NOT NULL,              -- 정답 여부
  time_taken INTEGER DEFAULT 0,             -- 소요 시간 (초)
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES quiz_sessions(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

#### LuckyDraw (경품 추첨)
```sql
CREATE TABLE lucky_draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                 -- User FK
  event_id INTEGER NOT NULL,                -- QuizEvent FK
  session_id INTEGER NOT NULL,              -- QuizSession FK
  prize VARCHAR(100) NOT NULL,              -- 경품명
  won BOOLEAN DEFAULT 0,                    -- 당첨 여부
  claimed BOOLEAN DEFAULT 0,                -- 수령 여부
  drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  claimed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES quiz_events(id),
  FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
);
```

---

## 8. API 엔드포인트

### 8.1 인증 API (`/api/auth`)

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "employee_id": "12345678",
  "password": "mypassword"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "employee_id": "12345678",
    "name": "홍길동",
    "department": "ICT본부",
    "email": "hong@shinhan.com",
    "role": "user"
  }
}
```

#### Swing SSO 토큰 로그인
```http
POST /api/auth/swing/token
Content-Type: application/json

{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: (동일)
```

#### Swing ID/Password 로그인
```http
POST /api/auth/swing/idpw
Content-Type: application/json

{
  "employee_id": "12345678",
  "password": "mypassword"
}

Response: (동일)
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "로그아웃 되었습니다"
}
```

#### 현재 사용자 조회
```http
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "employee_id": "12345678",
  "name": "홍길동",
  "department": "ICT본부",
  "email": "hong@shinhan.com",
  "role": "user"
}
```

### 8.2 퀴즈 API (`/api/quiz`)

#### 퀴즈 목록 조회
```http
GET /api/quiz/list
Authorization: Bearer {token}

Response:
{
  "events": [
    {
      "id": 1,
      "title": "2025년 1월 ICT 규정 퀴즈",
      "month": 1,
      "year": 2025,
      "status": "not_started" | "in_progress" | "completed",
      "total_questions": 5,
      "user_progress": {
        "session_id": 123,
        "correct_answers": 3,
        "completed": false
      }
    }
  ]
}
```

#### 퀴즈 세션 시작
```http
POST /api/quiz/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_id": 1
}

Response:
{
  "session": {
    "id": 123,
    "event_id": 1,
    "status": "in_progress"
  },
  "questions": [
    {
      "id": 1,
      "question_text": "문제 텍스트",
      "type": "ox",
      "options": null,
      "order_num": 1
    }
  ]
}
```

#### 답변 제출
```http
POST /api/quiz/answer
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": 123,
  "question_id": 1,
  "user_answer": "O",
  "time_taken": 15
}

Response:
{
  "success": true,
  "is_correct": true,
  "correct_answer": "O",
  "next_question": {
    "id": 2,
    "question_text": "...",
    "type": "fillblank",
    "options": ["옵션1", "옵션2"]
  }
}
```

#### 세션 완료
```http
POST /api/quiz/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": 123
}

Response:
{
  "success": true,
  "session": {
    "id": 123,
    "status": "completed",
    "score": 80,
    "correct_answers": 4,
    "total_questions": 5
  },
  "lucky_draw": {
    "won": true,
    "prize": "스타벅스 기프티콘"
  }
}
```

### 8.3 관리자 API (`/api/admin`)

#### 이벤트 목록 조회
```http
GET /api/admin/events
Authorization: Bearer {token}

Response:
{
  "events": [...]
}
```

#### 이벤트 생성
```http
POST /api/admin/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "2025년 2월 ICT 규정 퀴즈",
  "month": 2,
  "year": 2025,
  "start_date": "2025-02-01",
  "end_date": "2025-02-28"
}
```

#### 문제 대량 업로드
```http
POST /api/admin/questions/bulk-upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_id": 1,
  "questions": [
    {
      "question_text": "문제1",
      "type": "ox",
      "correct_answer": "O",
      "options": null,
      "order_num": 1
    }
  ]
}
```

#### 통계 조회
```http
GET /api/admin/stats/overview
Authorization: Bearer {token}

Response:
{
  "total_users": 150,
  "total_sessions": 450,
  "total_questions": 30,
  "avg_score": 82.5
}
```

#### Lucky Draw 추첨
```http
POST /api/admin/luckydraw/draw
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_id": 1,
  "prize": "스타벅스 기프티콘",
  "winner_count": 10
}

Response:
{
  "success": true,
  "winners": [
    {
      "user_id": 5,
      "name": "홍길동",
      "employee_id": "12345678"
    }
  ]
}
```

---

## 9. 퀴즈 진행 흐름

### 9.1 사용자 퀴즈 진행 시퀀스

```
┌─────────┐
│ 1. 로그인│
└────┬────┘
     │
     ▼
┌──────────────────┐
│ 2. 퀴즈 목록 조회 │
│    GET /api/quiz/list │
└────┬─────────────┘
     │
     │ ┌───────────────────────────┐
     │ │ 월별 퀴즈 카드 표시:       │
     │ │ - 1월: START (시작 가능)   │
     │ │ - 2월: CONTINUE (진행 중)  │
     │ │ - 3월: COMPLETE (완료)     │
     │ └───────────────────────────┘
     │
     ▼
┌──────────────────┐
│ 3. 퀴즈 시작      │
│    POST /api/quiz/start │
│    { event_id: 1 }      │
└────┬─────────────┘
     │
     │ ✅ QuizSession 생성
     │ ✅ 문제 목록 반환
     │
     ▼
┌──────────────────────────┐
│ 4. 문제 풀이 루프         │
│                          │
│ For each question:       │
│                          │
│ ┌──────────────────────┐ │
│ │ 4-1. 문제 표시        │ │
│ │  - OX: O/X 버튼      │ │
│ │  - 객관식: 선택지    │ │
│ │  - 타이핑: 입력창    │ │
│ └──────────────────────┘ │
│          │               │
│          ▼               │
│ ┌──────────────────────┐ │
│ │ 4-2. 답변 제출        │ │
│ │ POST /api/quiz/answer│ │
│ └──────────────────────┘ │
│          │               │
│          ▼               │
│ ┌──────────────────────┐ │
│ │ 4-3. 피드백 표시      │ │
│ │  - 정답: 초록 말풍선 │ │
│ │  - 오답: 빨간 말풍선 │ │
│ │  - 캐릭터 반응       │ │
│ └──────────────────────┘ │
│          │               │
│          ▼               │
│ ┌──────────────────────┐ │
│ │ 4-4. 다음 문제       │ │
│ │  또는 완료           │ │
│ └──────────────────────┘ │
│                          │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────┐
│ 5. 퀴즈 완료      │
│    POST /api/quiz/complete │
└────┬─────────────┘
     │
     │ ✅ 점수 계산
     │ ✅ Lucky Draw 추첨
     │
     ▼
┌──────────────────┐
│ 6. 결과 표시      │
│  - 점수          │
│  - 정답률        │
│  - Lucky Draw 결과│
└──────────────────┘
```

### 9.2 문제 유형별 처리

#### OX 문제
```javascript
// 화면 표시
<div class="ox-container">
  <button class="ox-button" data-value="O">O</button>
  <div class="ox-vs">VS</div>
  <button class="ox-button" data-value="X">X</button>
</div>

// 답변 제출
POST /api/quiz/answer
{
  "session_id": 123,
  "question_id": 1,
  "user_answer": "O"
}
```

#### Fill in Blank (빈칸 채우기)
```javascript
// 화면 표시
<div class="fillblank-container">
  <div class="fillblank-option">옵션1</div>
  <div class="fillblank-option">옵션2</div>
  <div class="fillblank-option">옵션3</div>
</div>

// 답변 제출
POST /api/quiz/answer
{
  "session_id": 123,
  "question_id": 2,
  "user_answer": "옵션2"
}
```

#### Typing (타이핑)
```javascript
// 화면 표시
<div class="typing-container">
  <div class="typing-target">정답 텍스트</div>
  <div class="monitor">
    <div class="screen">
      <textarea class="typing-textarea"></textarea>
    </div>
  </div>
</div>

// 실시간 비교
const userInput = textarea.value;
const targetText = "정답 텍스트";
const progress = calculateProgress(userInput, targetText);

// 답변 제출 (100% 일치 시)
POST /api/quiz/answer
{
  "session_id": 123,
  "question_id": 3,
  "user_answer": "정답 텍스트"
}
```

#### Drag & Drop
```javascript
// 화면 표시
<div class="dragdrop-container">
  <div class="dragdrop-target">여기에 드롭</div>
  <div class="dragdrop-items">
    <div class="dragdrop-item" draggable="true">항목1</div>
    <div class="dragdrop-item" draggable="true">항목2</div>
  </div>
</div>

// 답변 제출
POST /api/quiz/answer
{
  "session_id": 123,
  "question_id": 4,
  "user_answer": "항목1"
}
```

---

## 10. 환경 설정

### 10.1 환경 변수 (.env)

```bash
# ==============================================
# Server Configuration
# ==============================================
PORT=5000
NODE_ENV=development

# ==============================================
# Swing 인증 모드 설정 (기본값: mock)
# ==============================================
# Mock 모드: 가상 데이터 사용 (기본값, 로컬 테스트용)
# Dev 모드: 실제 Swing 개발 서버 연결
# Prod 모드: 실제 Swing 운영 서버 연결
OPERATION_MODE=mock

# ==============================================
# Database Configuration (SQLite)
# ==============================================
# SQLite는 파일 기반이므로 호스트/포트 설정 불필요
# 데이터베이스 파일 위치: database/quiz.db

# ==============================================
# JWT & Session Secret
# ==============================================
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_key_here_change_in_production

# ==============================================
# CORS
# ==============================================
CORS_ORIGIN=http://localhost:3000

# ==============================================
# Swing 운영 환경 설정
# ==============================================
SWING_ENDPOINT_PROD=https://apigw.shinhan.com:8443
SWING_CLIENT_ID_PROD=
SWING_CLIENT_SECRET_PROD=

# ==============================================
# Swing 개발 환경 설정
# ==============================================
SWING_ENDPOINT_DEV=https://apigwdev.shinhan.com:8443
SWING_CLIENT_ID_DEV=YOUR_DEV_CLIENT_ID_HERE
SWING_CLIENT_SECRET_DEV=YOUR_DEV_CLIENT_SECRET_HERE

# ==============================================
# Swing Mock 환경 설정 (기본값)
# ==============================================
SWING_ENDPOINT_MOCK=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID_MOCK=5FACKST52XY6YDLM
SWING_CLIENT_SECRET_MOCK=YPZCWH4ZXLDGBVUX
```

### 10.2 개발 환경 설정

#### 로컬 개발
```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에서 OPERATION_MODE=mock 확인

# 3. 데이터베이스 초기화
npm run db:migrate
npm run db:seed

# 4. 개발 서버 시작
npm run dev
```

#### Mock 서버 실행 (선택 사항)
```bash
# Swing Mock Server (포트 8055)
node swing-auth/mock-server.js
```

### 10.3 운영 환경 설정

```bash
# 1. 환경 변수 설정
OPERATION_MODE=prod
SWING_CLIENT_ID_PROD=실제_클라이언트_ID
SWING_CLIENT_SECRET_PROD=실제_클라이언트_SECRET
JWT_SECRET=강력한_시크릿_키

# 2. 프로덕션 빌드
npm run build

# 3. 서버 시작
npm start
```

---

## 11. 배포 가이드

### 11.1 Docker 배포

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 데이터베이스 초기화
RUN npm run db:migrate
RUN npm run db:seed

EXPOSE 5000

CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - OPERATION_MODE=prod
      - JWT_SECRET=${JWT_SECRET}
      - SWING_CLIENT_ID_PROD=${SWING_CLIENT_ID_PROD}
      - SWING_CLIENT_SECRET_PROD=${SWING_CLIENT_SECRET_PROD}
    volumes:
      - ./database:/app/database
    restart: unless-stopped
```

#### 실행
```bash
# 빌드
docker-compose build

# 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 11.2 수동 배포

```bash
# 1. 서버에 소스 업로드
scp -r ./IctRulesQuiz user@server:/path/to/app

# 2. 서버 접속
ssh user@server

# 3. 의존성 설치
cd /path/to/app
npm ci --only=production

# 4. 환경 변수 설정
vi .env
# 운영 환경 설정 입력

# 5. 데이터베이스 초기화
npm run db:migrate
npm run db:seed

# 6. PM2로 실행
npm install -g pm2
pm2 start server/server.js --name ict-quiz
pm2 save
pm2 startup
```

---

## 12. 트러블슈팅

### 12.1 인증 관련

#### 문제: "인증에 실패했습니다"
```
원인:
- JWT 토큰이 만료됨
- 토큰이 손상됨
- 서버의 JWT_SECRET 변경됨

해결:
1. 로컬스토리지에서 토큰 삭제
   localStorage.removeItem('token');
   localStorage.removeItem('user');

2. 다시 로그인
```

#### 문제: Swing 인증 실패
```
원인:
- OPERATION_MODE 설정 오류
- Swing 서버 연결 불가
- 클라이언트 ID/Secret 오류

해결:
1. .env 파일 확인
   OPERATION_MODE=mock (또는 dev/prod)

2. 환경별 설정 확인
   console.log(getCurrentEnvironment());

3. Mock 모드로 테스트
   OPERATION_MODE=mock
```

### 12.2 데이터베이스 관련

#### 문제: "Cannot find module 'sequelize'"
```
해결:
npm install
```

#### 문제: 데이터베이스 테이블이 없음
```
해결:
npm run db:migrate
npm run db:seed
```

#### 문제: SQLite 파일 권한 오류
```
해결:
chmod 666 database/quiz.db
chmod 777 database/
```

### 12.3 프론트엔드 관련

#### 문제: CORS 에러
```
원인:
- 서버의 CORS 설정 불일치

해결:
.env 파일에서 CORS_ORIGIN 확인
CORS_ORIGIN=http://localhost:5000
```

#### 문제: 정적 파일 404 에러
```
원인:
- Express static 경로 설정 오류

해결:
server/server.js 확인:
app.use(express.static('client'));
```

### 12.4 퀴즈 진행 관련

#### 문제: 답변 제출 후 다음 문제로 넘어가지 않음
```
원인:
- 프론트엔드 API 호출 에러
- 세션 만료

해결:
1. 브라우저 콘솔 에러 확인
2. 네트워크 탭에서 API 응답 확인
3. 세션 ID 유효성 확인
```

#### 문제: Lucky Draw 결과가 표시되지 않음
```
원인:
- 퀴즈 완료 API 응답 처리 오류

해결:
quiz.js에서 completeSession() 함수 확인
console.log(response.lucky_draw);
```

---

## 13. 참고 문서

- **README.md**: 프로젝트 빠른 시작 가이드
- **SPECIFICATION.md**: 기능 명세서
- **docs/ADMIN_GUIDE.md**: 관리자 사용 가이드
- **swing-auth/README.md**: Swing 인증 모듈 상세 가이드

---

## 14. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-01-19 | 1.0.0 | 최초 작성 | Claude |

---

**문의사항이나 버그 리포트는 GitHub Issues를 활용해주세요.**
