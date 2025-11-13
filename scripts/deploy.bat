@echo off
REM ICT 내규 퀴즈 Docker 배포 스크립트 (Windows)

setlocal enabledelayedexpansion

echo ==========================================
echo ICT 내규 퀴즈 Docker 배포 시작
echo ==========================================
echo.

REM Docker 설치 확인
echo [INFO] Docker 설치 확인 중...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker가 설치되어 있지 않습니다.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose가 설치되어 있지 않습니다.
    exit /b 1
)

echo [INFO] Docker 버전 확인 완료
docker --version
docker-compose --version
echo.

REM 환경 변수 파일 확인
echo [INFO] 환경 변수 파일 확인 중...
if not exist .env (
    echo [WARN] .env 파일이 없습니다. env.example을 복사합니다.
    copy env.example .env
    echo [WARN] .env 파일을 편집하여 필수 값들을 설정해주세요!
    pause
    exit /b 1
)
echo [INFO] .env 파일 확인 완료
echo.

REM 데이터베이스 백업
echo [INFO] 데이터베이스 백업 중...
if not exist backup mkdir backup
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
docker cp ict-quiz-app:/app/database/quiz.db ./backup/quiz_%TIMESTAMP%.db 2>nul
if errorlevel 1 (
    echo [WARN] 실행 중인 컨테이너가 없어 백업을 건너뜁니다.
) else (
    echo [INFO] 백업 완료: ./backup/quiz_%TIMESTAMP%.db
)
echo.

REM 기존 컨테이너 중지
echo [INFO] 기존 컨테이너 중지 중...
docker-compose down
echo.

REM Docker 이미지 빌드
echo [INFO] Docker 이미지 빌드 중...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] 이미지 빌드 실패
    exit /b 1
)
echo [INFO] 이미지 빌드 완료
echo.

REM 컨테이너 시작
echo [INFO] 컨테이너 시작 중...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] 컨테이너 시작 실패
    exit /b 1
)
echo [INFO] 컨테이너 시작 완료
echo.

REM 헬스체크
echo [INFO] 헬스체크 대기 중...
timeout /t 10 /nobreak >nul

set MAX_RETRIES=30
set RETRY_COUNT=0

:healthcheck_loop
if %RETRY_COUNT% geq %MAX_RETRIES% goto healthcheck_failed

curl -f http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    set /a RETRY_COUNT+=1
    echo [INFO] 헬스체크 재시도 중... (!RETRY_COUNT!/%MAX_RETRIES%)
    timeout /t 2 /nobreak >nul
    goto healthcheck_loop
)

echo.
echo [INFO] ✅ 애플리케이션이 정상적으로 실행되었습니다!
goto deployment_success

:healthcheck_failed
echo.
echo [ERROR] ❌ 헬스체크 실패. 로그를 확인하세요.
docker-compose logs --tail=50 quiz-app
exit /b 1

:deployment_success
echo.
echo ==========================================
echo 🎉 배포가 완료되었습니다!
echo ==========================================
echo.
echo 접속 정보:
echo   - 애플리케이션: http://localhost:5000
echo   - API: http://localhost:5000/api
echo   - 헬스체크: http://localhost:5000/api/health
echo.
echo 유용한 명령어:
echo   - 로그 확인: docker-compose logs -f quiz-app
echo   - 컨테이너 상태: docker-compose ps
echo   - 컨테이너 중지: docker-compose stop
echo   - 컨테이너 재시작: docker-compose restart
echo.
pause

