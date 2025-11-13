#!/bin/bash

# ICT 내규 퀴즈 Docker 배포 스크립트

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Docker 설치 확인
check_docker() {
    log_info "Docker 설치 확인 중..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        exit 1
    fi
    
    log_info "Docker 버전: $(docker --version)"
    log_info "Docker Compose 버전: $(docker-compose --version)"
}

# 환경 변수 파일 확인
check_env() {
    log_info "환경 변수 파일 확인 중..."
    if [ ! -f .env ]; then
        log_warn ".env 파일이 없습니다. env.example을 복사합니다."
        cp env.example .env
        log_warn ".env 파일을 편집하여 필수 값들을 설정해주세요!"
        exit 1
    fi
    log_info ".env 파일 확인 완료"
}

# 기존 컨테이너 중지
stop_containers() {
    log_info "기존 컨테이너 중지 중..."
    docker-compose down || true
}

# 데이터베이스 백업
backup_database() {
    log_info "데이터베이스 백업 중..."
    BACKUP_DIR="./backup"
    mkdir -p $BACKUP_DIR
    
    if docker ps -a | grep -q ict-quiz-app; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        docker cp ict-quiz-app:/app/database/quiz.db $BACKUP_DIR/quiz_$TIMESTAMP.db 2>/dev/null || true
        log_info "백업 완료: $BACKUP_DIR/quiz_$TIMESTAMP.db"
    else
        log_warn "실행 중인 컨테이너가 없어 백업을 건너뜁니다."
    fi
}

# Docker 이미지 빌드
build_image() {
    log_info "Docker 이미지 빌드 중..."
    docker-compose build --no-cache
    log_info "이미지 빌드 완료"
}

# 컨테이너 시작
start_containers() {
    log_info "컨테이너 시작 중..."
    docker-compose up -d
    log_info "컨테이너 시작 완료"
}

# 헬스체크
health_check() {
    log_info "헬스체크 대기 중..."
    sleep 10
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f http://localhost:5000/api/health &> /dev/null; then
            log_info "✅ 애플리케이션이 정상적으로 실행되었습니다!"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_info "헬스체크 재시도 중... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    
    log_error "❌ 헬스체크 실패. 로그를 확인하세요."
    docker-compose logs --tail=50 quiz-app
    return 1
}

# 배포 정보 출력
print_info() {
    echo ""
    log_info "=========================================="
    log_info "🎉 배포가 완료되었습니다!"
    log_info "=========================================="
    echo ""
    log_info "접속 정보:"
    log_info "  - 애플리케이션: http://localhost:5000"
    log_info "  - API: http://localhost:5000/api"
    log_info "  - 헬스체크: http://localhost:5000/api/health"
    echo ""
    log_info "유용한 명령어:"
    log_info "  - 로그 확인: docker-compose logs -f quiz-app"
    log_info "  - 컨테이너 상태: docker-compose ps"
    log_info "  - 컨테이너 중지: docker-compose stop"
    log_info "  - 컨테이너 재시작: docker-compose restart"
    echo ""
}

# 메인 실행
main() {
    log_info "=========================================="
    log_info "ICT 내규 퀴즈 Docker 배포 시작"
    log_info "=========================================="
    echo ""
    
    check_docker
    check_env
    backup_database
    stop_containers
    build_image
    start_containers
    
    if health_check; then
        print_info
        exit 0
    else
        log_error "배포 실패"
        exit 1
    fi
}

# 스크립트 실행
main

