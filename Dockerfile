# Node.js 기반 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# 서버 의존성 설치
WORKDIR /app/server
RUN npm ci --only=production

# 클라이언트 의존성 설치 (필요한 경우)
WORKDIR /app/client
RUN npm ci --only=production || echo "No client dependencies"

# 전체 소스 코드 복사
WORKDIR /app
COPY . .

# 데이터베이스 디렉토리 생성
RUN mkdir -p /app/database

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 포트 노출
EXPOSE 5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
WORKDIR /app/server
CMD ["node", "server.js"]

