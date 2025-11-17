# Docker로 ICT Rules Quiz 실행 가이드

## 🚀 빠른 시작

### 1️⃣ Docker 빌드 및 실행

```bash
# 1. Docker Compose로 빌드 및 실행 (권장)
docker-compose up -d --build

# 2. 로그 확인
docker-compose logs -f

# 3. 브라우저에서 접속
# http://localhost
```

---

## 🌐 접속 URL

### **메인 페이지 (로그인)**
```
http://localhost
또는
http://localhost/pages/index.html
```

### **퀴즈 목록**
```
http://localhost/pages/quiz-list.html
```

### **관리자 페이지**
```
http://localhost/pages/admin/dashboard.html
```

### **API 엔드포인트**
```
http://localhost/api/health
http://localhost/api/auth/login
```

---

## 📋 사전 요구사항

### **필수 설치**
- Docker Desktop 20.10+
- Docker Compose 2.0+

### **Windows 사용자**
```powershell
# Docker Desktop 설치 확인
docker --version
docker-compose --version

# WSL 2 활성화 (필요시)
wsl --install
```

### **Linux/Mac 사용자**
```bash
# Docker 설치 확인
docker --version
docker-compose --version
```

---

## 🔧 상세 실행 방법

### **방법 1: Docker Compose (권장)**

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\IctRulesQuiz

# 2. 환경 변수 파일 생성 (선택사항)
copy env.example .env

# 3. Docker Compose로 빌드 및 실행
docker-compose up -d --build

# 4. 컨테이너 상태 확인
docker-compose ps

# 5. 로그 확인
docker-compose logs -f quiz-app
docker-compose logs -f nginx

# 6. 브라우저에서 접속
start http://localhost
```

### **방법 2: Docker 명령어 직접 사용**

```bash
# 1. 이미지 빌드
docker build -t ict-quiz-app .

# 2. 네트워크 생성
docker network create quiz-network

# 3. 볼륨 생성
docker volume create quiz-data

# 4. 애플리케이션 컨테이너 실행
docker run -d \
  --name ict-quiz-app \
  --network quiz-network \
  -p 5000:5000 \
  -v quiz-data:/app/database \
  -e NODE_ENV=production \
  -e PORT=5000 \
  ict-quiz-app

# 5. Nginx 컨테이너 실행
docker run -d \
  --name ict-quiz-nginx \
  --network quiz-network \
  -p 80:80 \
  -v ${PWD}/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v ${PWD}/client:/usr/share/nginx/html:ro \
  nginx:alpine

# 6. 브라우저에서 접속
start http://localhost
```

---

## 🔍 컨테이너 관리

### **상태 확인**
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 또는
docker ps
```

### **로그 확인**
```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs quiz-app
docker-compose logs nginx

# 실시간 로그 (tail -f)
docker-compose logs -f
```

### **컨테이너 중지**
```bash
# 중지
docker-compose stop

# 중지 및 삭제
docker-compose down

# 중지, 삭제, 볼륨까지 삭제
docker-compose down -v
```

### **컨테이너 재시작**
```bash
# 전체 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart quiz-app
docker-compose restart nginx
```

---

## 🐛 문제 해결

### **1. 포트 충돌 (Port already in use)**

**문제**: 포트 80 또는 5000이 이미 사용 중

**해결**:
```bash
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :5000

# 프로세스 종료
taskkill /PID <PID> /F

# 또는 docker-compose.yml에서 포트 변경
ports:
  - "8080:80"  # 80 대신 8080 사용
```

### **2. 컨테이너가 시작되지 않음**

**문제**: 컨테이너가 계속 재시작됨

**해결**:
```bash
# 로그 확인
docker-compose logs quiz-app

# 헬스체크 확인
docker inspect ict-quiz-app | grep -A 10 Health

# 컨테이너 내부 접속
docker exec -it ict-quiz-app sh

# Node.js 프로세스 확인
ps aux | grep node
```

### **3. 데이터베이스 초기화**

**문제**: 데이터베이스가 비어있음

**해결**:
```bash
# 컨테이너 내부 접속
docker exec -it ict-quiz-app sh

# 마이그레이션 실행
cd /app/server
npx sequelize-cli db:migrate

# 시드 데이터 삽입
npx sequelize-cli db:seed:all
```

### **4. Nginx 설정 오류**

**문제**: 502 Bad Gateway

**해결**:
```bash
# Nginx 설정 테스트
docker exec ict-quiz-nginx nginx -t

# Nginx 재시작
docker-compose restart nginx

# quiz-app 연결 확인
docker exec ict-quiz-nginx ping quiz-app
```

### **5. 정적 파일이 로드되지 않음**

**문제**: CSS/JS/이미지가 404

**해결**:
```bash
# 볼륨 마운트 확인
docker exec ict-quiz-nginx ls -la /usr/share/nginx/html

# 파일 권한 확인
docker exec ict-quiz-nginx ls -la /usr/share/nginx/html/pages
docker exec ict-quiz-nginx ls -la /usr/share/nginx/html/css

# 브라우저 캐시 삭제
Ctrl + Shift + R (강력 새로고침)
```

---

## 📊 컨테이너 구조

```
┌─────────────────────────────────────────┐
│         브라우저 (localhost:80)          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      ict-quiz-nginx (Port 80)           │
│      - 정적 파일 서빙                    │
│      - API 프록시                        │
├─────────────────────────────────────────┤
│  / → /usr/share/nginx/html/             │
│      (client 폴더 마운트)                │
│                                         │
│  /api/* → quiz-app:5000                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   ict-quiz-app (Port 5000)              │
│   - Node.js Express 서버                │
│   - REST API                            │
│   - SQLite 데이터베이스                  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   quiz-data (Volume)                    │
│   - 데이터베이스 영속성                  │
└─────────────────────────────────────────┘
```

---

## 🔐 기본 계정

### **관리자**
- 행원번호: `admin`
- 비밀번호: `admin@`

### **테스트 사용자**
- 행원번호: `user001`, `user002`, `user003`
- 비밀번호: `1234`

---

## 📝 환경 변수

`.env` 파일 생성 (선택사항):

```env
# 서버 설정
NODE_ENV=production
PORT=5000
TZ=Asia/Seoul

# JWT 설정
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# 세션 설정
SESSION_SECRET=your-session-secret-here

# CORS 설정
CORS_ORIGIN=http://localhost
```

---

## 🎯 다음 단계

1. ✅ Docker Compose로 실행
2. ✅ `http://localhost`로 접속
3. ✅ 관리자 계정으로 로그인 (`admin` / `admin@`)
4. ✅ 퀴즈 이벤트 생성
5. ✅ 문제 등록
6. ✅ 테스트 사용자로 퀴즈 풀기

---

## 📞 지원

문제가 발생하면:
1. 로그 확인: `docker-compose logs -f`
2. 헬스체크: `http://localhost/health`
3. 컨테이너 상태: `docker-compose ps`

---

**작성일**: 2025-11-14
**버전**: 1.0.0

