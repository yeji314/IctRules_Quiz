# 🚀 Docker 빠른 시작 가이드

ICT 내규 퀴즈 애플리케이션을 Docker로 배포하는 가장 빠른 방법입니다.

---

## 📦 3가지 배포 방법

### 1️⃣ 로컬에서 직접 빌드 (개발/테스트)

```bash
# 1. 환경 변수 설정
cp env.example .env
# .env 파일 편집 필수!

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 접속
# http://localhost:5000
```

**장점**: 소스 코드 수정 가능, 빠른 디버깅
**용도**: 개발, 테스트, 사내 배포

---

### 2️⃣ Docker Hub 이미지 사용 (프로덕션)

Docker Hub에 이미 빌드된 이미지가 있는 경우:

```bash
# 1. 이미지 다운로드
docker pull yourusername/ict-rules-quiz:latest

# 2. 환경 변수 준비
cp env.example .env
# .env 파일 편집 필수!

# 3. 컨테이너 실행
docker run -d \
  -p 5000:5000 \
  --name ict-quiz \
  --env-file .env \
  -v quiz-data:/app/database \
  --restart unless-stopped \
  yourusername/ict-rules-quiz:latest

# 4. 접속
# http://localhost:5000
```

**장점**: 빠른 배포, 이미지 재사용
**용도**: 프로덕션, 클라우드 배포

---

### 3️⃣ 이미지 빌드 후 레지스트리에 배포

자신의 Docker Hub나 프라이빗 레지스트리에 배포:

**Windows:**
```powershell
# 빌드 및 푸시 (한 번에)
.\build-and-push.bat -u your-dockerhub-username

# 또는 단계별로
.\build-and-push.bat --build-only          # 빌드만
.\build-and-push.bat --push-only -u user   # 푸시만
```

**Linux/Mac:**
```bash
# 빌드 및 푸시 (한 번에)
./build-and-push.sh -u your-dockerhub-username

# 또는 단계별로
./build-and-push.sh --build-only           # 빌드만
./build-and-push.sh --push-only -u user    # 푸시만
```

**장점**: 이미지 버전 관리, 팀 공유
**용도**: CI/CD, 멀티 서버 배포

---

## ⚙️ 환경 변수 필수 설정

`.env` 파일에서 **반드시** 변경해야 할 항목:

```env
# 🔐 보안 (랜덤한 긴 문자열로 변경 필수!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=your_session_secret_key_change_this_in_production

# 서버 설정
PORT=5000
NODE_ENV=production

# JWT 토큰 만료 시간
JWT_EXPIRES_IN=7d

# CORS (필요시 변경)
CORS_ORIGIN=*
```

### 🔒 강력한 Secret 생성 방법

**Linux/Mac:**
```bash
# JWT_SECRET 생성
openssl rand -base64 32

# SESSION_SECRET 생성
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
# 랜덤 문자열 생성
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Node.js:**
```javascript
// Node.js REPL에서 실행
require('crypto').randomBytes(32).toString('base64')
```

---

## 📊 주요 명령어

### 컨테이너 관리

```bash
# 시작
docker-compose start

# 중지
docker-compose stop

# 재시작
docker-compose restart

# 상태 확인
docker-compose ps

# 로그 보기 (실시간)
docker-compose logs -f quiz-app

# 완전 삭제 (데이터 보존)
docker-compose down

# 완전 삭제 (데이터 포함)
docker-compose down -v
```

### 헬스체크

```bash
# API 상태 확인
curl http://localhost:5000/api/health

# 또는
curl http://localhost:5000/api/status
```

### 데이터베이스 백업

```bash
# 백업
docker cp ict-quiz-app:/app/database/quiz.db ./backup/quiz_$(date +%Y%m%d).db

# 복원
docker cp ./backup/quiz_20250113.db ict-quiz-app:/app/database/quiz.db
docker-compose restart quiz-app
```

---

## 🌐 포트 및 접속 정보

### 기본 설정

| 서비스 | 포트 | URL |
|--------|------|-----|
| 퀴즈 앱 | 5000 | http://localhost:5000 |
| Nginx (선택) | 80 | http://localhost |
| Nginx SSL (선택) | 443 | https://localhost |

### 포트 변경

[docker-compose.yml](docker-compose.yml) 수정:

```yaml
services:
  quiz-app:
    ports:
      - "8080:5000"  # 호스트:컨테이너
```

---

## 🔧 트러블슈팅

### 1. 포트 충돌

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### 2. 컨테이너가 계속 재시작

```bash
# 로그 확인
docker-compose logs quiz-app

# 일반적인 원인:
# - .env 파일 누락 또는 잘못된 형식
# - 데이터베이스 권한 문제
# - 포트 충돌
```

### 3. 데이터베이스 초기화

```bash
# 모든 데이터 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

### 4. 이미지 재빌드

```bash
# 캐시 없이 완전 재빌드
docker-compose build --no-cache
docker-compose up -d
```

### 5. Docker 디스크 공간 부족

```bash
# 사용하지 않는 리소스 정리
docker system prune -a

# 볼륨까지 정리 (데이터 삭제됨!)
docker system prune -a --volumes
```

---

## 📈 프로덕션 체크리스트

배포 전 확인사항:

### 보안
- [ ] `.env`에서 JWT_SECRET 변경
- [ ] `.env`에서 SESSION_SECRET 변경
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] CORS 설정 확인 (`CORS_ORIGIN`)

### 인프라
- [ ] Docker가 설치되어 있음
- [ ] Docker Compose가 설치되어 있음
- [ ] 필요한 포트가 열려있음 (방화벽)
- [ ] 충분한 디스크 공간 (최소 1GB)

### 데이터
- [ ] 데이터베이스 백업 계획 수립
- [ ] 볼륨 마운트 확인 (`quiz-data`)
- [ ] 로그 저장 경로 확인

### 테스트
- [ ] 로컬에서 빌드 성공
- [ ] 컨테이너 정상 실행
- [ ] 웹 UI 접속 가능
- [ ] API 엔드포인트 동작 확인

---

## 🎯 실전 시나리오

### 시나리오 1: 회사 내부 서버 배포

```bash
# 1. 서버에 프로젝트 클론
git clone https://github.com/yourusername/ict-rules-quiz.git
cd ict-rules-quiz

# 2. 환경 변수 설정
cp env.example .env
nano .env  # JWT_SECRET, SESSION_SECRET 변경

# 3. 실행
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f

# 5. 방화벽 설정 (필요시)
sudo ufw allow 5000/tcp
```

### 시나리오 2: AWS EC2 배포

```bash
# 1. EC2 인스턴스 접속
ssh -i keypair.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com

# 2. Docker 설치 (Ubuntu)
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인

# 3. 프로젝트 클론 및 실행
git clone https://github.com/yourusername/ict-rules-quiz.git
cd ict-rules-quiz
cp env.example .env
nano .env  # 환경 변수 수정
docker-compose up -d

# 4. EC2 보안 그룹에서 포트 5000 오픈
```

### 시나리오 3: 여러 서버에 동일 이미지 배포

```bash
# === 개발 머신 ===
# 이미지 빌드 및 푸시
./build-and-push.sh -u mycompany

# === 서버 1, 2, 3... ===
# 이미지 다운로드 및 실행
docker pull mycompany/ict-rules-quiz:latest
docker run -d -p 5000:5000 --env-file .env mycompany/ict-rules-quiz:latest
```

---

## 📚 추가 문서

- **상세 Docker 가이드**: [README_DOCKER.md](README_DOCKER.md)
- **이미지 빌드 및 배포**: [DOCKER_IMAGE_DEPLOYMENT.md](DOCKER_IMAGE_DEPLOYMENT.md)
- **프로젝트 문서**: [README.md](README.md)
- **전체 명세서**: [SPECIFICATION.md](SPECIFICATION.md)

---

## 💡 팁

### 성능 최적화

```yaml
# docker-compose.yml에 리소스 제한 추가
services:
  quiz-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 로깅 설정

```yaml
# docker-compose.yml에 로깅 설정
services:
  quiz-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 자동 업데이트 (Watchtower)

```yaml
# docker-compose.yml에 Watchtower 추가
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300
```

---

## 🆘 도움이 필요하신가요?

1. **로그 확인**: `docker-compose logs -f quiz-app`
2. **헬스체크**: `curl http://localhost:5000/api/health`
3. **컨테이너 상태**: `docker-compose ps`
4. **이슈 리포트**: [GitHub Issues](https://github.com/yourusername/ict-rules-quiz/issues)

---

**배포 성공! 🎉**

이제 http://localhost:5000 에서 퀴즈를 즐기세요!
