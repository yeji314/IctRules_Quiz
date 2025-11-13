# ICT 내규 퀴즈 - Docker 배포 가이드

## 🐳 Docker를 사용한 빠른 배포

이 프로젝트는 Docker를 사용하여 쉽게 배포할 수 있습니다.

---

## 📋 사전 준비

### 필수 소프트웨어
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- 또는 Docker Engine + Docker Compose (Linux)

### 설치 확인
```bash
docker --version
docker-compose --version
```

---

## 🚀 빠른 시작 (3단계)

### 1️⃣ 환경 변수 설정
```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

`.env` 파일을 열어 다음 값들을 **반드시** 변경하세요:
- `JWT_SECRET`: 강력한 랜덤 문자열
- `SESSION_SECRET`: 강력한 랜덤 문자열

### 2️⃣ 배포 스크립트 실행

**Windows:**
```bash
scripts\deploy.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3️⃣ 접속
브라우저에서 http://localhost:5000 접속

---

## 📦 수동 배포 (Docker Compose)

자동 스크립트를 사용하지 않는 경우:

```bash
# 1. 환경 변수 설정
cp env.example .env
nano .env  # 또는 메모장으로 편집

# 2. 빌드 및 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f quiz-app

# 4. 상태 확인
docker-compose ps
```

---

## 🛠️ 주요 명령어

### 컨테이너 관리
```bash
# 시작
docker-compose start

# 중지
docker-compose stop

# 재시작
docker-compose restart

# 삭제 (데이터 유지)
docker-compose down

# 삭제 (데이터 포함)
docker-compose down -v
```

### 로그 확인
```bash
# 실시간 로그
docker-compose logs -f quiz-app

# 최근 100줄
docker-compose logs --tail=100 quiz-app
```

### 데이터베이스 백업
```bash
# 백업
docker cp ict-quiz-app:/app/database/quiz.db ./backup/quiz_backup.db

# 복원
docker cp ./backup/quiz_backup.db ict-quiz-app:/app/database/quiz.db
docker-compose restart quiz-app
```

---

## 🔧 고급 설정

### Nginx 리버스 프록시 사용

`docker-compose.yml`에서 nginx 서비스가 이미 설정되어 있습니다:

```bash
# Nginx 포함하여 실행
docker-compose up -d

# 접속
# - HTTP: http://localhost:80
# - HTTPS: https://localhost:443 (SSL 인증서 필요)
```

### SSL 인증서 설정

1. SSL 인증서 파일 준비:
   - `nginx/ssl/cert.pem`
   - `nginx/ssl/key.pem`

2. `nginx/nginx.conf`에서 HTTPS 서버 블록 활성화

3. 재시작:
   ```bash
   docker-compose restart nginx
   ```

---

## 📊 모니터링

### 리소스 사용량
```bash
docker stats ict-quiz-app
```

### 헬스체크
```bash
curl http://localhost:5000/api/health
```

### 컨테이너 내부 접속
```bash
docker exec -it ict-quiz-app sh
```

---

## 🔍 트러블슈팅

### 포트 충돌 오류
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### 빌드 실패
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# Docker 정리
docker system prune -a
```

### 데이터베이스 초기화
```bash
# 볼륨 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

---

## 📁 프로젝트 구조

```
IctRulesQuiz/
├── Dockerfile              # Docker 이미지 정의
├── docker-compose.yml      # Docker Compose 설정
├── .dockerignore          # Docker 빌드 제외 파일
├── env.example            # 환경 변수 템플릿
├── nginx/
│   └── nginx.conf         # Nginx 설정
├── scripts/
│   ├── deploy.sh          # Linux/Mac 배포 스크립트
│   └── deploy.bat         # Windows 배포 스크립트
├── server/                # 백엔드 코드
├── client/                # 프론트엔드 코드
└── database/              # SQLite 데이터베이스
```

---

## 🔒 보안 권장사항

1. **.env 파일 보안**
   - Git에 커밋하지 마세요
   - JWT_SECRET과 SESSION_SECRET을 강력한 값으로 설정

2. **프로덕션 배포**
   - HTTPS 사용 (SSL 인증서)
   - 방화벽 설정
   - 정기적인 보안 업데이트

3. **데이터 백업**
   - 정기적으로 데이터베이스 백업
   - 백업 파일 안전한 곳에 보관

---

## 📞 지원

문제가 발생하면:
1. 로그 확인: `docker-compose logs -f quiz-app`
2. 헬스체크: `curl http://localhost:5000/api/health`
3. 상태 확인: `docker-compose ps`

자세한 내용은 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)를 참조하세요.

---

## 📝 라이센스

ISC License

