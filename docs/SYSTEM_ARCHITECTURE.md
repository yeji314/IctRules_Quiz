# ICT 내규 퀴즈 시스템 구성도

## 📊 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "External Services"
        SWING[Swing SSO<br/>사내 인증 시스템]
        DOMAIN[Domain<br/>quiz.company.com]
    end

    subgraph "Docker Container Environment"
        subgraph "Nginx Container"
            NGINX[Nginx<br/>Port 80/443<br/>리버스 프록시]
        end

        subgraph "Application Container"
            subgraph "Frontend"
                HTML[HTML/CSS/JS<br/>정적 파일]
                PAGES[Pages<br/>- index.html<br/>- quiz-list.html<br/>- quiz.html<br/>- admin.html<br/>- result.html]
                CSS[Stylesheets<br/>- login.css<br/>- quiz.css<br/>- admin.css<br/>- quiz-list.css]
                JS[JavaScript Modules<br/>- api.js<br/>- auth.js<br/>- quiz.js<br/>- admin.js]
            end

            subgraph "Backend (Node.js + Express)"
                API[Express API Server<br/>Port 5000<br/>MVC Architecture]
                
                subgraph "Routes"
                    AUTH_ROUTE[Auth Routes<br/>/api/auth/*]
                    QUIZ_ROUTE[Quiz Routes<br/>/api/quiz/*]
                    ADMIN_ROUTE[Admin Routes<br/>/api/admin/*]
                    HEALTH_ROUTE[Health Check<br/>/api/health]
                end

                subgraph "Controllers"
                    AUTH_CTRL[AuthController<br/>- login<br/>- logout<br/>- verify]
                    QUIZ_CTRL[QuizController<br/>- start<br/>- submit<br/>- complete]
                    ADMIN_CTRL[AdminController<br/>- events<br/>- questions<br/>- stats]
                end

                subgraph "Services"
                    AUTH_SVC[AuthService<br/>JWT 인증]
                    QUIZ_SVC[QuizService<br/>문제 선택 로직]
                    SWING_SVC[SwingApiClient<br/>SSO 연동]
                    MESSENGER_SVC[MessengerService<br/>사용자 정보]
                end

                subgraph "Middleware"
                    JWT_MW[JWT Middleware<br/>토큰 검증]
                    RATE_MW[Rate Limiter<br/>요청 제한]
                    HELMET_MW[Helmet<br/>보안 헤더]
                    CORS_MW[CORS<br/>교차 출처]
                end
            end

            subgraph "Database Layer"
                ORM[Sequelize ORM<br/>데이터베이스 추상화]
                
                subgraph "Models"
                    USER_MODEL[User Model<br/>사용자 정보]
                    EVENT_MODEL[QuizEvent Model<br/>퀴즈 이벤트]
                    QUESTION_MODEL[Question Model<br/>문제 데이터]
                    SESSION_MODEL[QuizSession Model<br/>세션 관리]
                    ANSWER_MODEL[QuizAnswer Model<br/>답변 기록]
                    LUCKY_MODEL[LuckyDraw Model<br/>당첨 정보]
                end
            end
        end

        subgraph "Data Volume"
            DB[(SQLite Database<br/>quiz.db<br/>파일 기반 DB)]
        end
    end

    subgraph "Client Devices"
        BROWSER[Web Browser<br/>사용자 접속]
    end

    %% External Connections
    DOMAIN -->|DNS| NGINX
    BROWSER -->|HTTPS| DOMAIN
    BROWSER -->|HTTP| NGINX

    %% Nginx to Frontend/Backend
    NGINX -->|정적 파일 서빙| HTML
    NGINX -->|API 프록시| API

    %% Frontend to Backend
    HTML --> JS
    JS -->|REST API| API

    %% Backend Flow
    API --> AUTH_ROUTE
    API --> QUIZ_ROUTE
    API --> ADMIN_ROUTE
    API --> HEALTH_ROUTE

    AUTH_ROUTE --> AUTH_CTRL
    QUIZ_ROUTE --> QUIZ_CTRL
    ADMIN_ROUTE --> ADMIN_CTRL

    AUTH_CTRL --> AUTH_SVC
    QUIZ_CTRL --> QUIZ_SVC
    ADMIN_CTRL --> QUIZ_SVC

    %% Middleware Flow
    API --> JWT_MW
    API --> RATE_MW
    API --> HELMET_MW
    API --> CORS_MW

    %% Service to External
    AUTH_SVC -->|SSO 인증| SWING_SVC
    SWING_SVC -->|HTTPS| SWING

    %% Service to Database
    AUTH_SVC --> ORM
    QUIZ_SVC --> ORM
    MESSENGER_SVC --> ORM

    %% ORM to Models
    ORM --> USER_MODEL
    ORM --> EVENT_MODEL
    ORM --> QUESTION_MODEL
    ORM --> SESSION_MODEL
    ORM --> ANSWER_MODEL
    ORM --> LUCKY_MODEL

    %% Models to Database
    USER_MODEL --> DB
    EVENT_MODEL --> DB
    QUESTION_MODEL --> DB
    SESSION_MODEL --> DB
    ANSWER_MODEL --> DB
    LUCKY_MODEL --> DB

    style SWING fill:#e1f5ff
    style DOMAIN fill:#fff3e0
    style NGINX fill:#4caf50
    style API fill:#2196f3
    style DB fill:#ff9800
    style BROWSER fill:#9c27b0
```

---

## 🔄 데이터 흐름도 (Data Flow)

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Browser as 브라우저
    participant Nginx as Nginx
    participant Frontend as Frontend
    participant API as Backend API
    participant Auth as AuthService
    participant Swing as Swing SSO
    participant Quiz as QuizService
    participant DB as Database

    %% 로그인 플로우
    User->>Browser: 로그인 페이지 접속
    Browser->>Nginx: GET /pages/index.html
    Nginx->>Frontend: 정적 파일 반환
    Frontend->>Browser: 로그인 화면 표시

    User->>Browser: 사번/비밀번호 입력
    Browser->>API: POST /api/auth/login
    API->>Auth: 인증 요청
    
    alt Swing SSO 사용
        Auth->>Swing: SSO 인증 요청
        Swing-->>Auth: 인증 결과
    else 로컬 인증
        Auth->>DB: 사용자 조회
        DB-->>Auth: 사용자 정보
    end

    Auth->>Auth: JWT 토큰 생성
    Auth-->>API: 토큰 + 사용자 정보
    API-->>Browser: 200 OK + JWT
    Browser->>Browser: localStorage에 토큰 저장

    %% 퀴즈 플로우
    Browser->>API: GET /api/quiz/list (+ JWT)
    API->>API: JWT 검증
    API->>Quiz: 퀴즈 목록 조회
    Quiz->>DB: 이벤트 + 진행상황 조회
    DB-->>Quiz: 데이터 반환
    Quiz-->>API: 퀴즈 목록
    API-->>Browser: 200 OK + 목록

    User->>Browser: 퀴즈 시작
    Browser->>API: POST /api/quiz/start
    API->>Quiz: 세션 생성 + 문제 선택
    Quiz->>DB: 세션 저장 + 문제 조회
    DB-->>Quiz: 문제 데이터
    Quiz-->>API: 첫 문제
    API-->>Browser: 200 OK + 문제

    User->>Browser: 답변 제출
    Browser->>API: POST /api/quiz/submit
    API->>Quiz: 답변 검증 + 저장
    Quiz->>DB: 답변 기록 저장
    Quiz->>Quiz: Lucky Draw 조건 확인
    Quiz->>DB: 다음 문제 선택
    DB-->>Quiz: 문제 데이터
    Quiz-->>API: 결과 + 다음 문제
    API-->>Browser: 200 OK + 응답

    User->>Browser: 퀴즈 완료
    Browser->>API: POST /api/quiz/complete
    API->>Quiz: 세션 완료 처리
    Quiz->>DB: 세션 상태 업데이트
    Quiz->>DB: Lucky Draw 당첨 확인
    DB-->>Quiz: 결과 데이터
    Quiz-->>API: 최종 결과
    API-->>Browser: 200 OK + 결과
    Browser->>Frontend: 결과 페이지 표시
```

---

## 🏗️ Docker 컨테이너 구성도

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "quiz-network (Bridge Network)"
            subgraph "nginx Container"
                NGINX_C[Nginx<br/>alpine<br/>Port: 80, 443]
            end

            subgraph "quiz-app Container"
                NODE_C[Node.js 18<br/>Express Server<br/>Port: 5000]
            end
        end

        subgraph "Docker Volumes"
            VOL_DATA[quiz-data<br/>데이터베이스 영속성<br/>/app/database]
            VOL_LOGS[logs<br/>로그 파일<br/>/app/logs]
        end

        subgraph "Host Filesystem"
            HOST_SSL[./nginx/ssl<br/>SSL 인증서]
            HOST_NGINX[./nginx/nginx.conf<br/>Nginx 설정]
            HOST_CLIENT[./client<br/>정적 파일]
        end
    end

    subgraph "External"
        INTERNET[Internet<br/>외부 접속]
    end

    INTERNET -->|80/443| NGINX_C
    NGINX_C -->|Proxy| NODE_C
    NGINX_C -.->|Read Only| HOST_SSL
    NGINX_C -.->|Read Only| HOST_NGINX
    NGINX_C -.->|Read Only| HOST_CLIENT
    NODE_C -.->|Mount| VOL_DATA
    NODE_C -.->|Mount| VOL_LOGS

    style NGINX_C fill:#4caf50
    style NODE_C fill:#2196f3
    style VOL_DATA fill:#ff9800
    style VOL_LOGS fill:#ff9800
```

---

## 🗄️ 데이터베이스 스키마

```mermaid
erDiagram
    User ||--o{ QuizSession : "참여"
    User ||--o{ LuckyDraw : "당첨"
    QuizEvent ||--o{ Question : "포함"
    QuizEvent ||--o{ QuizSession : "진행"
    QuizSession ||--o{ QuizAnswer : "답변"
    Question ||--o{ QuizAnswer : "대상"

    User {
        int id PK
        string employee_id UK
        string password
        string name
        string department
        string email
        datetime created_at
        datetime updated_at
    }

    QuizEvent {
        int id PK
        string year_month UK
        string title
        date start_date
        date end_date
        int max_winners
        datetime created_at
    }

    Question {
        int id PK
        int event_id FK
        string category
        string question_type
        string question_text
        json question_data
        string explanation
        datetime created_at
    }

    QuizSession {
        int id PK
        int user_id FK
        int event_id FK
        string status
        int current_question_number
        datetime started_at
        datetime completed_at
    }

    QuizAnswer {
        int id PK
        int session_id FK
        int question_id FK
        string user_answer
        boolean is_correct
        int answer_attempt
        int time_spent
        datetime answered_at
    }

    LuckyDraw {
        int id PK
        int user_id FK
        int event_id FK
        int question_id FK
        boolean won_prize
        string prize_name
        boolean claimed
        datetime won_at
        datetime claimed_at
    }
```

---

## 🔐 인증 및 보안 흐름

```mermaid
graph LR
    subgraph "클라이언트"
        A[사용자 로그인]
        B[JWT 토큰 저장<br/>localStorage]
        C[API 요청<br/>+ Authorization Header]
    end

    subgraph "백엔드 미들웨어"
        D[Rate Limiter<br/>요청 제한]
        E[Helmet<br/>보안 헤더]
        F[CORS<br/>출처 검증]
        G[JWT Middleware<br/>토큰 검증]
    end

    subgraph "인증 서비스"
        H{Swing SSO<br/>활성화?}
        I[Swing API<br/>SSO 인증]
        J[로컬 인증<br/>bcrypt 검증]
        K[JWT 생성<br/>+ 사용자 정보]
    end

    subgraph "데이터베이스"
        L[(User Table<br/>사용자 정보)]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H -->|Yes| I
    H -->|No| J
    I --> K
    J --> L
    L --> J
    J --> K
    K --> B

    style H fill:#fff3e0
    style I fill:#e1f5ff
    style G fill:#f3e5f5
```

---

## 🎮 퀴즈 게임 로직 흐름

```mermaid
stateDiagram-v2
    [*] --> 로그인
    로그인 --> 퀴즈목록: 인증 성공
    
    퀴즈목록 --> 세션시작: 퀴즈 선택
    세션시작 --> 문제출제: 세션 생성
    
    문제출제 --> 답변대기: 문제 표시
    답변대기 --> 답변검증: 답변 제출
    
    답변검증 --> 정답처리: 정답
    답변검증 --> 오답처리: 오답
    
    정답처리 --> LuckyDraw확인: 첫 시도 정답
    정답처리 --> 다음문제: 재시도 정답
    오답처리 --> 다음문제: 오답 기록
    
    LuckyDraw확인 --> LuckyDraw문제: 조건 충족<br/>(3개 이상 정답)
    LuckyDraw확인 --> 다음문제: 조건 미충족
    
    LuckyDraw문제 --> 당첨처리: Lucky Draw 정답
    LuckyDraw문제 --> 다음문제: Lucky Draw 오답
    
    당첨처리 --> 다음문제: 당첨 기록
    
    다음문제 --> 문제출제: 5문제 미만
    다음문제 --> 결과표시: 5문제 완료
    
    결과표시 --> 세션완료: 결과 저장
    세션완료 --> 퀴즈목록: 목록으로
    
    퀴즈목록 --> [*]: 로그아웃
```

---

## 🌐 네트워크 포트 구성

```mermaid
graph LR
    subgraph "External"
        EXT[외부 접속]
    end

    subgraph "Host Machine"
        P80[Port 80<br/>HTTP]
        P443[Port 443<br/>HTTPS]
        P5000[Port 5000<br/>API]
    end

    subgraph "Docker Network"
        NGINX_P[Nginx Container<br/>:80, :443]
        APP_P[App Container<br/>:5000]
    end

    subgraph "Internal"
        DB_P[SQLite<br/>파일 기반<br/>포트 없음]
    end

    EXT -->|HTTP| P80
    EXT -->|HTTPS| P443
    P80 --> NGINX_P
    P443 --> NGINX_P
    NGINX_P -->|Proxy| APP_P
    APP_P -->|File I/O| DB_P
    
    EXT -.->|Direct<br/>개발용| P5000
    P5000 -.-> APP_P

    style P80 fill:#4caf50
    style P443 fill:#4caf50
    style P5000 fill:#ff9800
```

---

## 📁 프로젝트 디렉토리 구조

```
IctRulesQuiz/
├── 📦 Docker 관련
│   ├── Dockerfile                 # 이미지 정의
│   ├── docker-compose.yml         # 컨테이너 오케스트레이션
│   ├── .dockerignore             # 빌드 제외 파일
│   └── nginx/
│       ├── nginx.conf            # Nginx 설정
│       └── ssl/                  # SSL 인증서
│
├── 🎨 Frontend (client/)
│   ├── pages/                    # HTML 페이지
│   │   ├── index.html           # 로그인
│   │   ├── quiz-list.html       # 퀴즈 목록
│   │   ├── quiz.html            # 퀴즈 게임
│   │   ├── result.html          # 결과
│   │   └── admin.html           # 관리자
│   ├── css/                      # 스타일시트
│   │   ├── login.css
│   │   ├── quiz.css
│   │   ├── quiz-list.css
│   │   ├── admin.css
│   │   └── variables.css
│   ├── js/
│   │   ├── modules/             # 공통 모듈
│   │   │   ├── api.js          # API 클라이언트
│   │   │   ├── auth.js         # 인증 관리
│   │   │   └── utils.js        # 유틸리티
│   │   └── pages/               # 페이지별 로직
│   │       ├── quiz.js
│   │       ├── quiz-list.js
│   │       └── admin-dashboard.js
│   └── assets/                   # 이미지, 폰트 등
│
├── ⚙️ Backend (server/)
│   ├── server.js                # 서버 진입점
│   ├── app.js                   # Express 앱 설정
│   ├── config/
│   │   └── database.js         # DB 설정
│   ├── models/                  # Sequelize 모델
│   │   ├── User.js
│   │   ├── QuizEvent.js
│   │   ├── Question.js
│   │   ├── QuizSession.js
│   │   ├── QuizAnswer.js
│   │   └── LuckyDraw.js
│   ├── controllers/             # 컨트롤러
│   │   ├── authController.js
│   │   ├── quizController.js
│   │   └── adminController.js
│   ├── services/                # 비즈니스 로직
│   │   ├── authService.js
│   │   ├── quizService.js
│   │   ├── swingApiClient.js
│   │   └── messengerService.js
│   ├── middleware/              # 미들웨어
│   │   └── auth.js
│   └── routes/                  # 라우트 정의
│       ├── auth.js
│       ├── quiz.js
│       ├── admin.js
│       └── health.js
│
├── 🗄️ Database (database/)
│   └── quiz.db                  # SQLite 데이터베이스
│
├── 📜 Scripts (scripts/)
│   ├── deploy.sh               # Linux/Mac 배포
│   └── deploy.bat              # Windows 배포
│
└── 📚 Documentation (docs/)
    ├── SYSTEM_ARCHITECTURE.md  # 시스템 구성도
    ├── DOCKER_DEPLOYMENT.md    # Docker 배포 가이드
    └── README_DOCKER.md        # Docker 빠른 시작
```

---

## 🔄 배포 프로세스

```mermaid
graph TD
    A[소스 코드<br/>Git Repository] -->|git clone| B[로컬 환경]
    B -->|환경 변수 설정| C[.env 파일 생성]
    C -->|docker build| D[Docker 이미지 빌드]
    D -->|docker-compose up| E[컨테이너 실행]
    
    E --> F{헬스체크}
    F -->|성공| G[서비스 운영]
    F -->|실패| H[로그 확인]
    H --> I[문제 해결]
    I --> E
    
    G --> J[모니터링]
    J --> K{업데이트 필요?}
    K -->|Yes| L[git pull]
    L --> D
    K -->|No| J
    
    G --> M[데이터베이스 백업]
    M -->|정기적| N[백업 저장소]

    style G fill:#4caf50
    style F fill:#ff9800
    style H fill:#f44336
```

---

## 🔗 외부 시스템 연동

```mermaid
graph LR
    subgraph "ICT 퀴즈 시스템"
        APP[Quiz Application]
    end

    subgraph "Swing SSO"
        SSO_AUTH[인증 API]
        SSO_USER[사용자 정보 API]
    end

    subgraph "사내 메신저"
        MSG_API[메신저 API<br/>사용자 조회]
    end

    subgraph "도메인 관리"
        DNS[DNS Server<br/>quiz.company.com]
        SSL[SSL 인증서<br/>HTTPS]
    end

    APP -->|POST /auth| SSO_AUTH
    APP -->|GET /user| SSO_USER
    APP -->|GET /employee| MSG_API
    DNS -->|도메인 연결| APP
    SSL -->|보안 통신| APP

    style SSO_AUTH fill:#e1f5ff
    style SSO_USER fill:#e1f5ff
    style MSG_API fill:#fff3e0
    style DNS fill:#e8f5e9
    style SSL fill:#e8f5e9
```

---

## 📊 시스템 사양 및 요구사항

### 최소 사양
- **CPU**: 2 Core
- **RAM**: 2GB
- **Disk**: 10GB (SSD 권장)
- **Network**: 100Mbps

### 권장 사양
- **CPU**: 4 Core
- **RAM**: 4GB
- **Disk**: 20GB SSD
- **Network**: 1Gbps

### 소프트웨어 요구사항
- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상
- **OS**: Linux, Windows, macOS

---

## 🎯 주요 기능별 시스템 구성

| 기능 | Frontend | Backend | Database | 외부 연동 |
|------|----------|---------|----------|-----------|
| 로그인/인증 | login.css<br/>auth.js | authController<br/>authService | User | Swing SSO |
| 퀴즈 목록 | quiz-list.html<br/>quiz-list.js | quizController | QuizEvent<br/>QuizSession | - |
| 퀴즈 게임 | quiz.html<br/>quiz.js | quizController<br/>quizService | Question<br/>QuizAnswer | - |
| Lucky Draw | quiz.js | quizService | LuckyDraw | - |
| 관리자 | admin.html<br/>admin-dashboard.js | adminController | 전체 테이블 | - |
| 결과 표시 | result.html<br/>result.js | quizController | QuizSession<br/>LuckyDraw | - |

---

이 시스템 구성도는 프로젝트의 전체 아키텍처를 시각화한 것입니다. 각 다이어그램은 Mermaid 문법으로 작성되어 GitHub, GitLab 등에서 자동으로 렌더링됩니다.

