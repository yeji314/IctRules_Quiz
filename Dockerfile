# Multi-stage build for optimized production image
# Stage 1: Build stage
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY server/package*.json ./server/
COPY client/package*.json ./client/ 2>/dev/null || :

# 서버 의존성 설치
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# 클라이언트 의존성 설치 (필요한 경우)
WORKDIR /app/client
RUN npm ci --only=production 2>/dev/null || echo "No client dependencies" \
    && npm cache clean --force 2>/dev/null || true

# Stage 2: Production stage
FROM node:18-alpine AS production

# 보안 및 메타데이터 레이블
LABEL maintainer="ICT Rules Quiz Team"
LABEL description="ICT Rules Quiz Application"
LABEL version="1.0.0"

# 비루트 사용자로 실행하기 위한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# builder 스테이지에서 node_modules 복사
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/client/node_modules ./client/node_modules 2>/dev/null || :

# 애플리케이션 소스 코드 복사
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs client ./client
COPY --chown=nodejs:nodejs images ./images

# 데이터베이스 디렉토리 생성 및 권한 설정
RUN mkdir -p /app/database && \
    chown -R nodejs:nodejs /app/database && \
    chmod 755 /app/database

# 환경 변수 설정
ENV NODE_ENV=production \
    PORT=5000 \
    TZ=Asia/Seoul

# 비루트 사용자로 전환
USER nodejs

# 포트 노출
EXPOSE 5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
WORKDIR /app/server
CMD ["node", "server.js"]

