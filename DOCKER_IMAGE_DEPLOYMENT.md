# ICT 내규 퀴즈 - Docker 이미지 배포 가이드

## 🐳 Docker 이미지 빌드 및 배포

이 가이드는 ICT 내규 퀴즈 애플리케이션을 Docker 이미지로 빌드하고 Docker Hub 또는 다른 레지스트리에 배포하는 방법을 설명합니다.

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [로컬 빌드](#로컬-빌드)
3. [레지스트리에 배포](#레지스트리에-배포)
4. [이미지 사용](#이미지-사용)
5. [고급 옵션](#고급-옵션)

---

## 🔧 사전 준비

### 필수 소프트웨어

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 또는 Docker Engine
- Docker Hub 계정 (또는 다른 레지스트리 계정)

### 설치 확인

```bash
docker --version
docker-compose --version
```

### 레지스트리 계정 준비

#### Docker Hub
1. [Docker Hub](https://hub.docker.com/)에서 계정 생성
2. 사용자명 기억하기 (예: `myusername`)

#### GitHub Container Registry (GHCR)
1. GitHub Personal Access Token 생성
2. 레지스트리 URL: `ghcr.io`

#### Google Container Registry (GCR)
1. GCP 프로젝트 생성
2. 레지스트리 URL: `gcr.io`

---

## 🏗️ 로컬 빌드

### 방법 1: 자동 스크립트 사용 (권장)

**Windows:**
```powershell
.\build-and-push.bat --build-only
```

**Linux/Mac:**
```bash
chmod +x build-and-push.sh
./build-and-push.sh --build-only
```

### 방법 2: 수동 빌드

```bash
# 기본 빌드
docker build -t ict-rules-quiz:1.0.0 .

# 캐시 없이 빌드
docker build --no-cache -t ict-rules-quiz:1.0.0 .

# 멀티 플랫폼 빌드
docker build --platform linux/amd64 -t ict-rules-quiz:1.0.0 .
```

### 빌드 확인

```bash
# 이미지 목록 확인
docker images ict-rules-quiz

# 이미지 상세 정보
docker inspect ict-rules-quiz:1.0.0

# 이미지 히스토리
docker history ict-rules-quiz:1.0.0
```

### 로컬 테스트

```bash
# 환경 변수 파일 준비
cp env.example .env
# .env 파일 편집 (JWT_SECRET, SESSION_SECRET 설정)

# 컨테이너 실행
docker run -p 5000:5000 --env-file .env --name quiz-test ict-rules-quiz:1.0.0

# 브라우저에서 테스트
# http://localhost:5000

# 컨테이너 중지 및 삭제
docker stop quiz-test
docker rm quiz-test
```

---

## 🚀 레지스트리에 배포

### Docker Hub에 배포

#### 방법 1: 자동 스크립트 (권장)

**Windows:**
```powershell
.\build-and-push.bat -u your-dockerhub-username
```

**Linux/Mac:**
```bash
./build-and-push.sh -u your-dockerhub-username
```

스크립트가 자동으로:
1. 이미지 빌드
2. Docker Hub 로그인 (비밀번호 입력 필요)
3. 이미지 푸시
4. `version` 태그와 `latest` 태그 모두 업로드

#### 방법 2: 수동 배포

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 태그 지정
docker tag ict-rules-quiz:1.0.0 your-username/ict-rules-quiz:1.0.0
docker tag ict-rules-quiz:1.0.0 your-username/ict-rules-quiz:latest

# 3. 이미지 푸시
docker push your-username/ict-rules-quiz:1.0.0
docker push your-username/ict-rules-quiz:latest
```

### GitHub Container Registry (GHCR)에 배포

```bash
# 1. GitHub 로그인
echo $GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin

# 2. 이미지 태그 지정
docker tag ict-rules-quiz:1.0.0 ghcr.io/your-github-username/ict-rules-quiz:1.0.0
docker tag ict-rules-quiz:1.0.0 ghcr.io/your-github-username/ict-rules-quiz:latest

# 3. 이미지 푸시
docker push ghcr.io/your-github-username/ict-rules-quiz:1.0.0
docker push ghcr.io/your-github-username/ict-rules-quiz:latest
```

또는 스크립트 사용:

```bash
# Linux/Mac
./build-and-push.sh -u your-github-username -r ghcr.io

# Windows
.\build-and-push.bat -u your-github-username -r ghcr.io
```

### Google Container Registry (GCR)에 배포

```bash
# 1. GCP 인증
gcloud auth configure-docker

# 2. 이미지 태그 지정
docker tag ict-rules-quiz:1.0.0 gcr.io/your-project-id/ict-rules-quiz:1.0.0
docker tag ict-rules-quiz:1.0.0 gcr.io/your-project-id/ict-rules-quiz:latest

# 3. 이미지 푸시
docker push gcr.io/your-project-id/ict-rules-quiz:1.0.0
docker push gcr.io/your-project-id/ict-rules-quiz:latest
```

---

## 📦 이미지 사용

### 배포된 이미지 다운로드

```bash
# Docker Hub에서 다운로드
docker pull your-username/ict-rules-quiz:1.0.0

# GHCR에서 다운로드
docker pull ghcr.io/your-username/ict-rules-quiz:1.0.0

# GCR에서 다운로드
docker pull gcr.io/your-project-id/ict-rules-quiz:1.0.0
```

### 이미지로 컨테이너 실행

#### 간단한 실행

```bash
docker run -d \
  -p 5000:5000 \
  --name ict-quiz \
  --env-file .env \
  your-username/ict-rules-quiz:1.0.0
```

#### 볼륨 마운트와 함께 실행

```bash
docker run -d \
  -p 5000:5000 \
  --name ict-quiz \
  --env-file .env \
  -v quiz-data:/app/database \
  -v $(pwd)/logs:/app/logs \
  your-username/ict-rules-quiz:1.0.0
```

#### Docker Compose로 실행

[docker-compose.yml](docker-compose.yml)을 수정하여 빌드된 이미지 사용:

```yaml
services:
  quiz-app:
    image: your-username/ict-rules-quiz:1.0.0  # build 대신 image 사용
    container_name: ict-quiz-app
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - quiz-data:/app/database
```

실행:
```bash
docker-compose up -d
```

---

## ⚙️ 고급 옵션

### 멀티 아키텍처 빌드 (ARM64 + AMD64)

```bash
# Buildx 설정
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 멀티 아키텍처 빌드 및 푸시
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-username/ict-rules-quiz:1.0.0 \
  -t your-username/ict-rules-quiz:latest \
  --push \
  .
```

### 버전별 빌드 자동화

스크립트에 버전 옵션 사용:

```bash
# Linux/Mac
./build-and-push.sh -u your-username -v 2.0.0

# Windows
.\build-and-push.bat -u your-username -v 2.0.0
```

### CI/CD 파이프라인 통합

#### GitHub Actions 예제

`.github/workflows/docker-publish.yml`:

```yaml
name: Docker Image CI/CD

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ict-rules-quiz:${{ steps.version.outputs.VERSION }}
            ${{ secrets.DOCKERHUB_USERNAME }}/ict-rules-quiz:latest
```

#### GitLab CI 예제

`.gitlab-ci.yml`:

```yaml
docker-build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG .
    - docker build -t $CI_REGISTRY_IMAGE:latest .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - tags
```

### 이미지 크기 최적화 팁

현재 Dockerfile은 이미 다음 최적화가 적용되어 있습니다:

1. ✅ **Multi-stage build**: 빌드 도구를 최종 이미지에서 제외
2. ✅ **Alpine Linux**: 경량 베이스 이미지 사용
3. ✅ **npm ci --only=production**: 개발 의존성 제외
4. ✅ **npm cache clean**: 캐시 정리
5. ✅ **.dockerignore**: 불필요한 파일 제외

추가 최적화:

```dockerfile
# 더 작은 Node.js 버전 사용
FROM node:18-alpine AS builder
# 현재 사용 중

# 정적 파일 압축
RUN apk add --no-cache gzip
RUN find /app/client -type f -name "*.js" -o -name "*.css" | xargs gzip -k
```

### 보안 스캔

```bash
# Trivy로 취약점 스캔
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image your-username/ict-rules-quiz:1.0.0

# Docker Scout 사용
docker scout cves your-username/ict-rules-quiz:1.0.0
```

---

## 🛠️ 주요 명령어 정리

### 빌드 관련

```bash
# 로컬 빌드만
./build-and-push.sh --build-only

# 캐시 없이 빌드
./build-and-push.sh --build-only --no-cache

# 특정 버전으로 빌드
./build-and-push.sh --build-only -v 2.0.0
```

### 푸시 관련

```bash
# 빌드하고 푸시
./build-and-push.sh -u your-username

# 이미 빌드된 이미지만 푸시
./build-and-push.sh --push-only -u your-username

# 특정 레지스트리에 푸시
./build-and-push.sh -u your-username -r ghcr.io
```

### 이미지 관리

```bash
# 로컬 이미지 목록
docker images ict-rules-quiz

# 이미지 삭제
docker rmi ict-rules-quiz:1.0.0

# 사용하지 않는 이미지 정리
docker image prune -a

# 이미지 내보내기
docker save -o ict-quiz-image.tar ict-rules-quiz:1.0.0

# 이미지 가져오기
docker load -i ict-quiz-image.tar
```

---

## 🔍 트러블슈팅

### 빌드 실패

```bash
# 캐시 제거 후 재빌드
docker builder prune -a
./build-and-push.sh --build-only --no-cache

# Docker 디스크 공간 확보
docker system prune -a --volumes
```

### 푸시 실패

```bash
# 로그아웃 후 재로그인
docker logout
docker login

# 네트워크 확인
ping hub.docker.com

# 레이트 리밋 확인
docker pull ratelimitpreview/test
```

### 이미지가 너무 큼

```bash
# 레이어 분석
docker history ict-rules-quiz:1.0.0

# 이미지 내부 확인
docker run --rm -it ict-rules-quiz:1.0.0 sh
du -sh /app/*

# dive 도구로 분석
dive ict-rules-quiz:1.0.0
```

---

## 📚 참고 자료

- [Docker Hub](https://hub.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build 공식 문서](https://docs.docker.com/engine/reference/commandline/build/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Docker가 설치되어 있고 실행 중
- [ ] `.env` 파일이 설정되어 있음
- [ ] 레지스트리 계정이 준비됨
- [ ] 로컬에서 이미지 빌드 성공
- [ ] 로컬에서 컨테이너 실행 테스트 완료
- [ ] 보안 취약점 스캔 완료
- [ ] 버전 태그 확인
- [ ] 프로덕션 환경 변수 검토

---

## 🎯 빠른 시작 요약

### Docker Hub 배포 (3단계)

```bash
# 1. 빌드
./build-and-push.sh --build-only

# 2. 테스트
docker run -p 5000:5000 --env-file .env ict-rules-quiz:1.0.0

# 3. 배포
./build-and-push.sh -u your-dockerhub-username
```

### 배포된 이미지 사용

```bash
# 1. 다운로드
docker pull your-username/ict-rules-quiz:latest

# 2. 실행
docker run -d -p 5000:5000 --env-file .env your-username/ict-rules-quiz:latest

# 3. 접속
# http://localhost:5000
```

---

완료! 🎉
