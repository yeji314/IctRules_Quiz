# 🎮 ICT 내규 퀴즈 게임

회사 내규를 재미있게 학습할 수 있는 **슈퍼마리오 스타일** 픽셀 게임 퀴즈 시스템

## ✨ 특징

- 🕹️ **레트로 픽셀 게임 디자인** - 슈퍼마리오 스타일의 8비트 그래픽
- 🎵 **픽셀 사운드 효과** - 정답/오답 효과음
- 🎨 **인터랙티브 UI** - 5가지 다양한 문제 유형
- ⭐ **LuckyDraw 시스템** - 첫 시도 정답 조건부 출제
- 📊 **실시간 통계** - 부서별 참여율 및 문제 난이도 분석

## 프로젝트 구조

```
IctRulesQuiz/
├── client/                 # Frontend (HTML/CSS/JavaScript)
│   ├── pages/             # HTML 페이지
│   ├── css/               # CSS 스타일
│   ├── js/                # JavaScript (ES6 모듈)
│   │   ├── modules/      # 모듈
│   │   ├── pages/        # 페이지별 JS
│   │   └── components/   # 재사용 컴포넌트
│   └── images/            # 이미지 파일
│
├── server/                # Backend (Express MVC)
│   ├── config/           # 설정 파일
│   ├── controllers/      # 컨트롤러 (비즈니스 로직)
│   ├── models/           # Sequelize 모델
│   ├── routes/           # API 라우트
│   ├── middleware/       # 미들웨어
│   ├── services/         # 서비스 계층
│   ├── utils/            # 유틸리티
│   ├── seeders/          # DB Seeder
│   └── package.json
│
├── database/             # DB 파일
├── docs/                 # 문서
├── SPECIFICATION.md      # 프로젝트 명세서
└── README.md             # 이 파일
```

## 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Vanilla JavaScript (프레임워크 없음)
- CSS Animations & Transitions
- Chart.js (통계 차트)
- Fetch API (HTTP 클라이언트)

### Backend
- Node.js 18+
- Express.js (MVC 패턴)
- Sequelize ORM
- SQLite 3
- JWT (인증)
- bcrypt (비밀번호 해싱)

## 🚀 빠른 시작

### 배포 방법 선택

#### 🐳 Docker 배포 (권장)
Docker를 사용하면 환경 설정 없이 바로 실행할 수 있습니다.

**Windows:**
```powershell
# 1. 환경 변수 설정
Copy-Item env.example .env
# .env 파일 편집 (JWT_SECRET, SESSION_SECRET 변경)

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 브라우저에서 접속
# http://localhost:5000
```

**Linux/Mac:**
```bash
# 자동 배포 스크립트 실행
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

📚 **상세 가이드**:
- [Docker 배포 가이드](README_DOCKER.md)
- [Docker 이미지 빌드 및 배포](DOCKER_IMAGE_DEPLOYMENT.md)

---

#### 💻 로컬 개발 환경

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 1단계: 환경 변수 설정

서버 폴더에 `.env` 파일을 생성합니다 (`.env.example` 참고).

```bash
cd server
```

`.env` 파일 내용:

```env
# 서버
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Session Secret
SESSION_SECRET=your_session_secret_key_change_this_in_production

# CORS
CORS_ORIGIN=http://localhost:3000
```

> **참고**: SQLite는 파일 기반 데이터베이스로 별도 설치가 필요 없으며, `database/quiz.db` 파일로 자동 생성됩니다.

### 2단계: 의존성 설치

```bash
# 서버 의존성 설치
cd server
npm install

# 클라이언트 의존성 설치 (선택적)
cd ../client
npm install
```

### 3단계: 데이터베이스 마이그레이션 및 시딩

```bash
cd server

# 데이터베이스 초기화 (테이블 생성 + 기본 데이터 삽입)
npm run db:reset
```

또는 개별 실행:

```bash
# 테이블 생성
npm run db:migrate

# 기본 데이터 삽입 (관리자 계정, 샘플 퀴즈)
npm run db:seed
```

### 4단계: 서버 실행

**방법 1: 개발 모드 (추천)**

```bash
# 터미널 1 - 백엔드 서버
cd server
npm run dev

# 터미널 2 - 프론트엔드 서버
cd client
npx http-server -p 3000 -c-1
```

**방법 2: VSCode Live Server 사용**

1. VSCode에서 `client/pages/index.html` 파일 열기
2. 우클릭 → "Open with Live Server" 선택
3. 서버는 별도 터미널에서 실행: `cd server && npm run dev`

### 5단계: 접속

- 프론트엔드: http://localhost:3000/pages/index.html
- 백엔드 API: http://localhost:3001/api

## 기본 계정

### 관리자
- 행원번호: `admin`
- 비밀번호: `admin@`

## 주요 기능

### 사용자
- 🎮 인터랙티브 퀴즈 (5가지 유형)
- 📊 진행 상황 추적
- ⭐ LuckyDraw 참여
- 📈 결과 확인

### 관리자
- 📝 퀴즈 이벤트 관리
- ❓ 문제 관리 (CRUD)
- 📊 통계 및 참여율 확인
- 🎁 LuckyDraw 추첨

## 문제 유형

1. **드래그 앤 드롭**: 부서 배치하기
2. **타이핑**: 문장 정확히 따라 쓰기
3. **빈칸 맞추기**: 객관식
4. **OX 퀴즈**: 캐릭터 힌트 포함
5. **틀린 부분 찾기**: 5개 중 선택

## 라이선스

Copyright © 2025. All rights reserved.
