# Docker 배포 가이드

## 📋 목차
1. [사전 요구사항](#사전-요구사항)
2. [빠른 시작](#빠른-시작)
3. [환경 설정](#환경-설정)
4. [배포 방법](#배포-방법)
5. [운영 명령어](#운영-명령어)
6. [트러블슈팅](#트러블슈팅)

---

## 🔧 사전 요구사항

### 필수 소프트웨어
- Docker Engine 20.10 이상
- Docker Compose 2.0 이상

### 설치 확인
```bash
docker --version
docker-compose --version
```

---

## 🚀 빠른 시작

### 1. 환경 변수 설정
```bash
# env.example을 .env로 복사
cp env.example .env

# .env 파일 편집 (JWT_SECRET, SESSION_SECRET 등 변경)
nano .env
```

### 2. Docker 이미지 빌드 및 실행
```bash
# 이미지 빌드 및 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f quiz-app
```

### 3. 접속 확인
- 애플리케이션: http://localhost:5000
- API: http://localhost:5000/api
- 헬스체크: http://localhost:5000/api/health

---

## ⚙️ 환경 설정

### .env 파일 필수 설정 항목

```bash
# 프로덕션 환경
NODE_ENV=production

# 서버 포트
PORT=5000

# JWT 시크릿 (반드시 변경!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# 세션 시크릿 (반드시 변경!)
SESSION_SECRET=your-super-secret-session-key-change-this

# CORS 설정
CORS_ORIGIN=http://your-domain.com

# 타임존
TZ=Asia/Seoul
```

---

## 📦 배포 방법

### 방법 1: Docker Compose 사용 (권장)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd IctRulesQuiz

# 2. 환경 변수 설정
cp env.example .env
nano .env

# 3. 빌드 및 실행
docker-compose up -d

# 4. 상태 확인
docker-compose ps
```

### 방법 2: Docker만 사용

```bash
# 1. 이미지 빌드
docker build -t ict-quiz-app .

# 2. 컨테이너 실행
docker run -d \
  --name ict-quiz-app \
  -p 5000:5000 \
  -v quiz-data:/app/database \
  -e NODE_ENV=production \
  -e PORT=5000 \
  ict-quiz-app

# 3. 상태 확인
docker ps
docker logs ict-quiz-app
```

### 방법 3: Nginx와 함께 배포

```bash
# docker-compose.yml에서 nginx 서비스 활성화
docker-compose up -d

# Nginx를 통한 접속
# - HTTP: http://localhost:80
# - HTTPS: https://localhost:443 (SSL 인증서 설정 필요)
```

---

## 🛠️ 운영 명령어

### 컨테이너 관리

```bash
# 컨테이너 시작
docker-compose start

# 컨테이너 중지
docker-compose stop

# 컨테이너 재시작
docker-compose restart

# 컨테이너 삭제 (데이터 유지)
docker-compose down

# 컨테이너 및 볼륨 삭제 (데이터 삭제 주의!)
docker-compose down -v
```

### 로그 확인

```bash
# 실시간 로그 확인
docker-compose logs -f quiz-app

# 최근 100줄 로그
docker-compose logs --tail=100 quiz-app

# 특정 시간 이후 로그
docker-compose logs --since 30m quiz-app
```

### 데이터베이스 백업

```bash
# 데이터베이스 백업
docker cp ict-quiz-app:/app/database/quiz.db ./backup/quiz_$(date +%Y%m%d_%H%M%S).db

# 데이터베이스 복원
docker cp ./backup/quiz_20240101_120000.db ict-quiz-app:/app/database/quiz.db
docker-compose restart quiz-app
```

### 이미지 업데이트

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 이미지 재빌드
docker-compose build --no-cache

# 3. 컨테이너 재시작
docker-compose up -d
```

### 헬스체크

```bash
# 컨테이너 상태 확인
docker-compose ps

# 헬스체크 엔드포인트 호출
curl http://localhost:5000/api/health

# 컨테이너 내부 접속
docker exec -it ict-quiz-app sh
```

---

## 🔍 트러블슈팅

### 문제 1: 포트 충돌
```bash
# 에러: "port is already allocated"
# 해결: 다른 포트 사용 또는 기존 프로세스 종료

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### 문제 2: 데이터베이스 연결 실패
```bash
# 로그 확인
docker-compose logs quiz-app

# 데이터베이스 디렉토리 권한 확인
docker exec -it ict-quiz-app ls -la /app/database

# 볼륨 재생성
docker-compose down -v
docker-compose up -d
```

### 문제 3: 빌드 실패
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# Docker 시스템 정리
docker system prune -a
```

### 문제 4: 메모리 부족
```bash
# docker-compose.yml에 리소스 제한 추가
services:
  quiz-app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 📊 모니터링

### 리소스 사용량 확인
```bash
# 실시간 리소스 모니터링
docker stats ict-quiz-app

# 디스크 사용량
docker system df
```

### 로그 로테이션 설정
```json
// docker-compose.yml에 추가
services:
  quiz-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🔒 보안 권장사항

1. **환경 변수 보안**
   - `.env` 파일을 Git에 커밋하지 마세요
   - JWT_SECRET과 SESSION_SECRET을 강력한 랜덤 값으로 설정하세요

2. **네트워크 보안**
   - 프로덕션 환경에서는 HTTPS 사용
   - 방화벽 설정으로 필요한 포트만 개방

3. **정기 업데이트**
   - Docker 이미지 정기적으로 업데이트
   - 의존성 패키지 보안 패치 적용

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Docker 로그: `docker-compose logs -f`
2. 헬스체크: `curl http://localhost:5000/api/health`
3. 컨테이너 상태: `docker-compose ps`

---

## 📝 라이센스

이 프로젝트는 ISC 라이센스를 따릅니다.

