#!/bin/bash

# ICT Rules Quiz - Docker 이미지 빌드 및 푸시 스크립트
# Linux/Mac용

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
IMAGE_NAME="ict-rules-quiz"
REGISTRY="docker.io"  # Docker Hub (변경 가능: ghcr.io, gcr.io 등)
VERSION="1.0.0"

# 함수: 메시지 출력
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 함수: 사용법 표시
show_usage() {
    cat << EOF
사용법: $0 [OPTIONS]

Docker 이미지를 빌드하고 레지스트리에 푸시합니다.

OPTIONS:
    -u, --username USERNAME    Docker 레지스트리 사용자명
    -r, --registry REGISTRY    레지스트리 URL (기본: docker.io)
    -v, --version VERSION      이미지 버전 (기본: 1.0.0)
    -n, --name IMAGE_NAME      이미지 이름 (기본: ict-rules-quiz)
    --no-cache                 캐시 없이 빌드
    --build-only               빌드만 수행 (푸시 안함)
    --push-only                푸시만 수행 (빌드 안함)
    -h, --help                 도움말 표시

예제:
    # Docker Hub에 푸시
    $0 -u myusername

    # 특정 레지스트리에 푸시
    $0 -u myusername -r ghcr.io

    # 버전 지정
    $0 -u myusername -v 2.0.0

    # 빌드만 수행
    $0 --build-only

EOF
}

# 인자 파싱
BUILD_ONLY=false
PUSH_ONLY=false
NO_CACHE=false
USERNAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --push-only)
            PUSH_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "알 수 없는 옵션: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 이미지 태그 생성
if [ -n "$USERNAME" ]; then
    FULL_IMAGE_NAME="$REGISTRY/$USERNAME/$IMAGE_NAME"
else
    FULL_IMAGE_NAME="$IMAGE_NAME"
fi

IMAGE_TAG="$FULL_IMAGE_NAME:$VERSION"
IMAGE_TAG_LATEST="$FULL_IMAGE_NAME:latest"

print_info "=========================================="
print_info "ICT Rules Quiz - Docker 이미지 빌드"
print_info "=========================================="
print_info "이미지 이름: $IMAGE_TAG"
print_info "레지스트리: $REGISTRY"

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되어 있지 않습니다."
    exit 1
fi

# Docker 실행 확인
if ! docker info &> /dev/null; then
    print_error "Docker 데몬이 실행되고 있지 않습니다."
    exit 1
fi

# 푸시만 수행하는 경우
if [ "$PUSH_ONLY" = true ]; then
    print_info "푸시만 수행합니다..."

    if [ -z "$USERNAME" ]; then
        print_error "푸시를 위해서는 사용자명(-u)이 필요합니다."
        exit 1
    fi

    print_info "Docker 레지스트리에 로그인..."
    docker login $REGISTRY

    print_info "이미지 푸시 중: $IMAGE_TAG"
    docker push "$IMAGE_TAG"

    print_info "latest 태그 푸시 중: $IMAGE_TAG_LATEST"
    docker push "$IMAGE_TAG_LATEST"

    print_success "이미지 푸시 완료!"
    print_info "이미지: $IMAGE_TAG"
    print_info "이미지: $IMAGE_TAG_LATEST"
    exit 0
fi

# 빌드 수행
print_info "Docker 이미지 빌드 중..."

BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="--no-cache"
fi

docker build $BUILD_ARGS \
    -t "$IMAGE_TAG" \
    -t "$IMAGE_TAG_LATEST" \
    --platform linux/amd64 \
    .

print_success "Docker 이미지 빌드 완료!"

# 이미지 정보 출력
print_info "=========================================="
print_info "빌드된 이미지 정보:"
docker images "$FULL_IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
print_info "=========================================="

# 빌드만 수행하는 경우
if [ "$BUILD_ONLY" = true ]; then
    print_success "빌드 완료!"
    print_info ""
    print_info "로컬에서 실행하려면:"
    print_info "  docker run -p 5000:5000 --env-file .env $IMAGE_TAG"
    exit 0
fi

# 푸시 수행
if [ -n "$USERNAME" ]; then
    print_info ""
    print_info "Docker 레지스트리에 푸시하시겠습니까? (y/N)"
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Docker 레지스트리에 로그인..."
        docker login $REGISTRY

        print_info "이미지 푸시 중: $IMAGE_TAG"
        docker push "$IMAGE_TAG"

        print_info "latest 태그 푸시 중: $IMAGE_TAG_LATEST"
        docker push "$IMAGE_TAG_LATEST"

        print_success "=========================================="
        print_success "이미지 푸시 완료!"
        print_success "=========================================="
        print_info "이미지 풀 명령어:"
        print_info "  docker pull $IMAGE_TAG"
        print_info ""
        print_info "컨테이너 실행:"
        print_info "  docker run -p 5000:5000 --env-file .env $IMAGE_TAG"
    else
        print_warning "푸시가 취소되었습니다."
        print_info ""
        print_info "나중에 푸시하려면:"
        print_info "  $0 --push-only -u $USERNAME"
    fi
else
    print_success "빌드 완료!"
    print_info ""
    print_info "레지스트리에 푸시하려면 사용자명을 지정하세요:"
    print_info "  $0 -u your-username"
    print_info ""
    print_info "로컬에서 실행하려면:"
    print_info "  docker run -p 5000:5000 --env-file .env $IMAGE_TAG"
fi

print_info ""
print_success "완료!"
