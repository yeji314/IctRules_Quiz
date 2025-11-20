# 환경별 URL 정리

## 📋 프로젝트 환경

이 프로젝트는 3가지 환경을 지원합니다.

---

## 🌐 환경별 URL 및 설정

### 1. 로컬 개발 환경 (Local Development)

**접속 URL:**
- 메인: http://localhost:5000
- API: http://localhost:5000/api

**CORS 설정:**
```bash
CORS_ORIGIN=http://localhost:3000
```

**사용 시나리오:**
- 개발자 로컬 머신에서 개발
- 프론트엔드를 별도 포트(3000)에서 개발 시
- 현재는 5000 포트에서 통합 서빙하므로 CORS 불필요

**환경 파일:** `.env.local`

---

### 2. 개발 서버 환경 (Development Server)

**접속 URL:**
- 메인: https://ictrulesdev.com
- API: https://ictrulesdev.com/api

**CORS 설정:**
```bash
CORS_ORIGIN=https://ictrulesdev.com
```

**사용 시나리오:**
- 개발팀 내부 테스트
- QA 테스트
- 프론트엔드 분리 시 개발 서버 URL 허용

**환경 파일:** `.env.development`

---

### 3. 운영 서버 환경 (Production Server)

**접속 URL:**
- 메인: https://ictrulesquiz.shinhan.com
- API: https://ictrulesquiz.shinhan.com/api

**CORS 설정:**
```bash
CORS_ORIGIN=https://ictrulesquiz.shinhan.com
```

**사용 시나리오:**
- 실제 사용자 접속
- 프로덕션 환경
- 프론트엔드 분리 시 운영 URL만 허용

**환경 파일:** `.env.production`

---

## 📁 환경 파일 설정

### 하나의 .env 파일로 관리

로컬, 개발, 운영 모두 `.env` 파일 하나를 사용하며, 환경에 맞게 값만 수정합니다.

### 로컬 개발
```bash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
SWING_SSO_ENABLED=false
```

### 개발 서버
```bash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=https://ictrulesdev.com
SWING_SSO_ENABLED=false
```

### 운영 서버
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://ictrulesquiz.shinhan.com
SWING_SSO_ENABLED=true
JWT_SECRET=<안전한_랜덤_문자열>
SESSION_SECRET=<안전한_랜덤_문자열>
```

---

## 🔄 환경 전환 방법

### 로컬 개발
```bash
cp .env.local .env
npm start
```

### 개발 서버 배포
```bash
docker-compose --env-file .env.development up -d
```

### 운영 서버 배포
```bash
docker-compose --env-file .env.production up -d
```

---

## 🌐 프론트엔드 분리 시나리오

### 현재 구조 (통합 서빙)
```
http://localhost:5000/
├── /api/*           → Express API
├── /pages/*         → HTML 페이지
└── /js, /css, /images → 정적 파일

→ 같은 Origin이므로 CORS 불필요
```

### 분리 구조 (추후)
```
Frontend: https://ictrulesquiz.shinhan.com (Nginx)
Backend:  https://api.ictrulesquiz.shinhan.com (Node.js)

→ 다른 Origin이므로 CORS 설정 필수!
→ Backend의 CORS_ORIGIN에 Frontend URL 설정
```

---

## ✅ 체크리스트

### 로컬 개발 시작 시
- [ ] `.env.local` 파일 생성
- [ ] `CORS_ORIGIN=http://localhost:3000` 설정
- [ ] 프론트엔드를 3000 포트에서 개발하는지 확인

### 개발 서버 배포 시
- [ ] `.env.development` 파일 준비
- [ ] `CORS_ORIGIN=https://ictrulesdev.com` 설정
- [ ] DNS 설정 확인
- [ ] SSL 인증서 설정 확인

### 운영 서버 배포 시
- [ ] `.env.production` 파일 준비
- [ ] `CORS_ORIGIN=https://ictrulesquiz.shinhan.com` 설정
- [ ] JWT_SECRET 변경 (필수!)
- [ ] SESSION_SECRET 변경 (필수!)
- [ ] SWING_SSO_ENABLED=true 설정
- [ ] DNS 설정 확인
- [ ] SSL 인증서 설정 확인

---

## 🐛 트러블슈팅

### CORS 에러 발생
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**체크 포인트:**
1. 환경 변수 확인: `echo $CORS_ORIGIN`
2. URL 정확히 일치하는지 확인 (프로토콜, 도메인, 포트)
3. 서버 재시작 후 다시 시도
4. 브라우저 콘솔에서 실제 요청 URL 확인

### 환경이 잘못 설정된 경우
```bash
# 서버 로그 확인
docker logs ict-quiz-app

# 환경 변수 확인
docker exec -it ict-quiz-app env | grep CORS
```

---

## 📚 관련 문서

- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - 상세 환경 설정 가이드
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker 배포 가이드
- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) - 프로젝트 전체 가이드
