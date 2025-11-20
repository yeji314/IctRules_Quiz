# 환경 설정 가이드

## 📋 개요

하나의 `.env` 파일로 모든 환경을 관리합니다.

---

## 🚀 빠른 시작

### 1. 환경 파일 생성
```bash
cp .env.example .env
```

### 2. 환경에 맞게 수정
`.env` 파일을 열어서 필요한 값만 수정

### 3. 서버 시작
```bash
# 로컬 개발
npm start

# Docker 배포
docker-compose up -d
```

---

## 🌐 환경별 설정

### 🏠 로컬 개발 환경

`.env` 파일에서 다음 값만 확인/수정:

```bash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
SWING_SSO_ENABLED=false
```

**접속 URL:** http://localhost:5000

---

### 🔧 개발 서버 배포

`.env` 파일에서 다음 값 수정:

```bash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=https://ictrulesdev.com
SWING_SSO_ENABLED=false
```

**접속 URL:** https://ictrulesdev.com

**배포 방법:**
```bash
docker-compose up -d
```

---

### 🚀 운영 서버 배포

`.env` 파일에서 다음 값 **반드시** 수정:

```bash
NODE_ENV=production
PORT=5000

# ⚠️ 필수 변경!
JWT_SECRET=<openssl rand -base64 32로 생성한 값>
SESSION_SECRET=<openssl rand -base64 32로 생성한 값>

# CORS 설정
CORS_ORIGIN=https://ictrulesquiz.shinhan.com

# SSO 설정
SWING_SSO_ENABLED=true
SWING_SSO_ENV=production
SWING_API_BASE_URL=https://swing-api.shinhan.com
SWING_CLIENT_ID=<실제 클라이언트 ID>
SWING_CLIENT_SECRET=<실제 클라이언트 시크릿>
SWING_PASSWORD_SALT=<openssl rand -base64 16로 생성한 값>
```

**접속 URL:** https://ictrulesquiz.shinhan.com

**배포 방법:**
```bash
docker-compose up -d
```

---

## 🔐 보안 주의사항

### 운영 환경 체크리스트

배포 전 반드시 확인:

- [ ] `JWT_SECRET` 변경됨 (기본값 사용 금지!)
- [ ] `SESSION_SECRET` 변경됨 (기본값 사용 금지!)
- [ ] `SWING_CLIENT_SECRET` 실제 값으로 설정됨
- [ ] `SWING_PASSWORD_SALT` 변경됨
- [ ] `CORS_ORIGIN` 실제 도메인으로 설정됨
- [ ] `NODE_ENV=production` 설정됨
- [ ] `.env` 파일이 Git에 커밋되지 않음

### 안전한 시크릿 생성 방법

```bash
# JWT_SECRET 생성
openssl rand -base64 32

# SESSION_SECRET 생성
openssl rand -base64 32

# SWING_PASSWORD_SALT 생성
openssl rand -base64 16
```

---

## 🌐 CORS 설정 가이드

### 현재 구조 (통합 서빙)
```
http://localhost:5000/
├── /api/*        → Express API
└── /*            → 정적 파일

→ 같은 Origin이므로 CORS 불필요
→ 하지만 설정해도 무해함
```

### 프론트엔드 분리 시

프론트엔드를 별도 서버/포트에서 서빙할 경우:

```bash
# 로컬: 프론트엔드가 3000 포트에서 실행
CORS_ORIGIN=http://localhost:3000

# 개발: 프론트엔드가 별도 도메인
CORS_ORIGIN=https://ictrulesdev.com

# 운영: 프론트엔드가 별도 도메인
CORS_ORIGIN=https://ictrulesquiz.shinhan.com
```

---

## 📝 환경 전환하기

### 로컬 → 개발 서버
```bash
# .env 파일 열기
vim .env

# 다음 값만 변경
NODE_ENV=development
CORS_ORIGIN=https://ictrulesdev.com
```

### 개발 서버 → 운영 서버
```bash
# .env 파일 열기
vim .env

# 다음 값 변경
NODE_ENV=production
CORS_ORIGIN=https://ictrulesquiz.shinhan.com
SWING_SSO_ENABLED=true

# ⚠️ 시크릿 값들도 운영용으로 변경!
JWT_SECRET=...
SESSION_SECRET=...
SWING_CLIENT_ID=...
SWING_CLIENT_SECRET=...
```

---

## 🐛 트러블슈팅

### CORS 에러 발생
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**해결:**
1. `.env` 파일에서 `CORS_ORIGIN` 값 확인
2. 프론트엔드 URL과 정확히 일치하는지 확인 (프로토콜, 도메인, 포트)
3. 서버 재시작

### 환경 변수가 적용되지 않음

**해결:**
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. Docker 사용 시 컨테이너 재시작
   ```bash
   docker-compose down
   docker-compose up -d
   ```
3. 서버 로그에서 CORS Origin 확인
   ```bash
   docker logs ict-quiz-app | grep CORS
   ```

### JWT/Session 에러

**원인:** 기본 시크릿 값 사용 중

**해결:**
```bash
# .env 파일에서 변경
JWT_SECRET=새로운_안전한_값
SESSION_SECRET=새로운_안전한_값

# 서버 재시작
docker-compose restart
```

---

## 📁 파일 구조

```
프로젝트/
├── .env.example    # 템플릿 (Git 포함, 주석으로 환경별 가이드 제공)
├── .env            # 실제 설정 (Git 제외, 환경별로 값 수정)
└── .gitignore      # .env를 Git에서 제외
```

**장점:**
- 파일 하나만 관리하면 됨
- 환경 전환이 쉬움 (값만 수정)
- 헷갈리지 않음

---

## ✅ 요약

| 단계 | 명령어 |
|------|--------|
| 1. 설정 파일 생성 | `cp .env.example .env` |
| 2. 환경에 맞게 수정 | `vim .env` |
| 3. 서버 시작 (로컬) | `npm start` |
| 3. 서버 시작 (Docker) | `docker-compose up -d` |

**중요:** 운영 배포 시 `.env` 파일의 시크릿 값들을 반드시 변경하세요!

---

## 🔗 관련 문서

- [.env.example](./.env.example) - 템플릿 파일 (주석 참고)
- [ENVIRONMENT_URLS.md](./ENVIRONMENT_URLS.md) - 환경별 URL 정리
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker 배포 가이드
