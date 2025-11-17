@echo off
REM ICT Rules Quiz - Docker 이미지 빌드 및 푸시 스크립트
REM Windows용

setlocal EnableDelayedExpansion

REM 설정
set IMAGE_NAME=ict-rules-quiz
set REGISTRY=docker.io
set VERSION=1.0.0
set BUILD_ONLY=0
set PUSH_ONLY=0
set NO_CACHE=0
set USERNAME=

REM 인자 파싱
:parse_args
if "%~1"=="" goto end_parse_args
if /i "%~1"=="-u" (
    set USERNAME=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--username" (
    set USERNAME=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-r" (
    set REGISTRY=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--registry" (
    set REGISTRY=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-v" (
    set VERSION=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--version" (
    set VERSION=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-n" (
    set IMAGE_NAME=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--name" (
    set IMAGE_NAME=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--no-cache" (
    set NO_CACHE=1
    shift
    goto parse_args
)
if /i "%~1"=="--build-only" (
    set BUILD_ONLY=1
    shift
    goto parse_args
)
if /i "%~1"=="--push-only" (
    set PUSH_ONLY=1
    shift
    goto parse_args
)
if /i "%~1"=="-h" goto show_help
if /i "%~1"=="--help" goto show_help
echo [ERROR] 알 수 없는 옵션: %~1
goto show_help

:end_parse_args

REM 이미지 태그 생성
if not "%USERNAME%"=="" (
    set FULL_IMAGE_NAME=%REGISTRY%/%USERNAME%/%IMAGE_NAME%
) else (
    set FULL_IMAGE_NAME=%IMAGE_NAME%
)

set IMAGE_TAG=%FULL_IMAGE_NAME%:%VERSION%
set IMAGE_TAG_LATEST=%FULL_IMAGE_NAME%:latest

echo ==========================================
echo ICT Rules Quiz - Docker 이미지 빌드
echo ==========================================
echo 이미지 이름: %IMAGE_TAG%
echo 레지스트리: %REGISTRY%
echo.

REM Docker 설치 확인
where docker >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker가 설치되어 있지 않습니다.
    exit /b 1
)

REM Docker 실행 확인
docker info >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker 데몬이 실행되고 있지 않습니다.
    exit /b 1
)

REM 푸시만 수행하는 경우
if %PUSH_ONLY%==1 (
    echo [INFO] 푸시만 수행합니다...

    if "%USERNAME%"=="" (
        echo [ERROR] 푸시를 위해서는 사용자명(-u)이 필요합니다.
        exit /b 1
    )

    echo [INFO] Docker 레지스트리에 로그인...
    docker login %REGISTRY%

    echo [INFO] 이미지 푸시 중: %IMAGE_TAG%
    docker push "%IMAGE_TAG%"

    echo [INFO] latest 태그 푸시 중: %IMAGE_TAG_LATEST%
    docker push "%IMAGE_TAG_LATEST%"

    echo [SUCCESS] 이미지 푸시 완료!
    echo [INFO] 이미지: %IMAGE_TAG%
    echo [INFO] 이미지: %IMAGE_TAG_LATEST%
    exit /b 0
)

REM 빌드 수행
echo [INFO] Docker 이미지 빌드 중...

set BUILD_ARGS=
if %NO_CACHE%==1 (
    set BUILD_ARGS=--no-cache
)

docker build %BUILD_ARGS% -t "%IMAGE_TAG%" -t "%IMAGE_TAG_LATEST%" --platform linux/amd64 .

if errorlevel 1 (
    echo [ERROR] Docker 이미지 빌드 실패!
    exit /b 1
)

echo [SUCCESS] Docker 이미지 빌드 완료!
echo.

REM 이미지 정보 출력
echo ==========================================
echo 빌드된 이미지 정보:
docker images "%FULL_IMAGE_NAME%"
echo ==========================================
echo.

REM 빌드만 수행하는 경우
if %BUILD_ONLY%==1 (
    echo [SUCCESS] 빌드 완료!
    echo.
    echo 로컬에서 실행하려면:
    echo   docker run -p 5000:5000 --env-file .env %IMAGE_TAG%
    exit /b 0
)

REM 푸시 수행
if not "%USERNAME%"=="" (
    echo.
    set /p response="Docker 레지스트리에 푸시하시겠습니까? (y/N): "

    if /i "!response!"=="y" (
        echo [INFO] Docker 레지스트리에 로그인...
        docker login %REGISTRY%

        echo [INFO] 이미지 푸시 중: %IMAGE_TAG%
        docker push "%IMAGE_TAG%"

        echo [INFO] latest 태그 푸시 중: %IMAGE_TAG_LATEST%
        docker push "%IMAGE_TAG_LATEST%"

        echo ==========================================
        echo [SUCCESS] 이미지 푸시 완료!
        echo ==========================================
        echo 이미지 풀 명령어:
        echo   docker pull %IMAGE_TAG%
        echo.
        echo 컨테이너 실행:
        echo   docker run -p 5000:5000 --env-file .env %IMAGE_TAG%
    ) else (
        echo [WARNING] 푸시가 취소되었습니다.
        echo.
        echo 나중에 푸시하려면:
        echo   %~nx0 --push-only -u %USERNAME%
    )
) else (
    echo [SUCCESS] 빌드 완료!
    echo.
    echo 레지스트리에 푸시하려면 사용자명을 지정하세요:
    echo   %~nx0 -u your-username
    echo.
    echo 로컬에서 실행하려면:
    echo   docker run -p 5000:5000 --env-file .env %IMAGE_TAG%
)

echo.
echo [SUCCESS] 완료!
exit /b 0

:show_help
echo 사용법: %~nx0 [OPTIONS]
echo.
echo Docker 이미지를 빌드하고 레지스트리에 푸시합니다.
echo.
echo OPTIONS:
echo     -u, --username USERNAME    Docker 레지스트리 사용자명
echo     -r, --registry REGISTRY    레지스트리 URL (기본: docker.io)
echo     -v, --version VERSION      이미지 버전 (기본: 1.0.0)
echo     -n, --name IMAGE_NAME      이미지 이름 (기본: ict-rules-quiz)
echo     --no-cache                 캐시 없이 빌드
echo     --build-only               빌드만 수행 (푸시 안함)
echo     --push-only                푸시만 수행 (빌드 안함)
echo     -h, --help                 도움말 표시
echo.
echo 예제:
echo     # Docker Hub에 푸시
echo     %~nx0 -u myusername
echo.
echo     # 특정 레지스트리에 푸시
echo     %~nx0 -u myusername -r ghcr.io
echo.
echo     # 버전 지정
echo     %~nx0 -u myusername -v 2.0.0
echo.
echo     # 빌드만 수행
echo     %~nx0 --build-only
echo.
exit /b 0
