# Docker Desktop 설치 가이드 (Windows)

## ⚠️ 현재 상태

Docker가 설치되어 있지 않습니다. 다음 단계를 따라 설치해주세요.

---

## 📋 사전 요구사항

### **Windows 버전 확인**
- Windows 10 64-bit: Pro, Enterprise, Education (Build 19041 이상)
- Windows 11 64-bit

### **시스템 요구사항**
- 64-bit 프로세서
- 4GB RAM (최소), 8GB RAM (권장)
- BIOS에서 가상화 활성화 필요
- WSL 2 지원

---

## 🚀 설치 방법

### **방법 1: Docker Desktop 설치 (권장)**

#### **1단계: Docker Desktop 다운로드**

**공식 웹사이트에서 다운로드:**
```
https://www.docker.com/products/docker-desktop/
```

또는 **직접 다운로드 링크:**
```
https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
```

#### **2단계: 설치 실행**

1. 다운로드한 `Docker Desktop Installer.exe` 실행
2. "Use WSL 2 instead of Hyper-V" 옵션 체크 (권장)
3. "Install" 클릭
4. 설치 완료 후 시스템 재시작

#### **3단계: WSL 2 설치 (필요시)**

PowerShell을 **관리자 권한**으로 실행:

```powershell
# WSL 설치
wsl --install

# 시스템 재시작
Restart-Computer
```

재시작 후:

```powershell
# WSL 버전 확인
wsl --list --verbose

# WSL 2로 설정
wsl --set-default-version 2
```

#### **4단계: Docker Desktop 시작**

1. Docker Desktop 아이콘 클릭
2. 초기 설정 완료
3. Docker Engine 시작 대기 (하단 아이콘이 초록색으로 변경)

#### **5단계: 설치 확인**

PowerShell에서 확인:

```powershell
# Docker 버전 확인
docker --version
# 예상 출력: Docker version 24.0.x, build xxxxx

# Docker Compose 버전 확인
docker compose version
# 예상 출력: Docker Compose version v2.x.x

# Docker 실행 테스트
docker run hello-world
```

---

### **방법 2: Chocolatey로 설치 (선택사항)**

PowerShell을 **관리자 권한**으로 실행:

```powershell
# Chocolatey 설치 (없는 경우)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Docker Desktop 설치
choco install docker-desktop -y

# 시스템 재시작
Restart-Computer
```

---

## 🔧 설치 후 설정

### **1. Docker Desktop 설정**

Docker Desktop 실행 → Settings (⚙️):

#### **General**
- ✅ Use the WSL 2 based engine
- ✅ Start Docker Desktop when you log in

#### **Resources → WSL Integration**
- ✅ Enable integration with my default WSL distro
- ✅ Ubuntu (또는 사용 중인 WSL 배포판)

#### **Resources → Advanced**
- CPUs: 2-4 (시스템 사양에 따라)
- Memory: 4-8 GB (시스템 사양에 따라)
- Swap: 1 GB
- Disk image size: 60 GB

### **2. 방화벽 설정 (필요시)**

Docker Desktop이 방화벽에 의해 차단되는 경우:

```powershell
# 관리자 권한 PowerShell
New-NetFirewallRule -DisplayName "Docker Desktop" -Direction Inbound -Program "C:\Program Files\Docker\Docker\Docker Desktop.exe" -Action Allow
```

---

## 🐛 문제 해결

### **문제 1: "WSL 2 installation is incomplete"**

**해결 방법:**

```powershell
# 관리자 권한 PowerShell

# 1. WSL 업데이트
wsl --update

# 2. WSL 커널 업데이트 다운로드 및 설치
# https://aka.ms/wsl2kernel

# 3. Docker Desktop 재시작
```

### **문제 2: "Hardware assisted virtualization and data execution protection must be enabled in the BIOS"**

**해결 방법:**

1. BIOS/UEFI 진입 (재시작 시 F2, F10, Del 키)
2. Virtualization Technology (VT-x/AMD-V) 활성화
3. 저장 후 재시작

### **문제 3: "Docker Desktop starting..." 무한 로딩**

**해결 방법:**

```powershell
# 1. Docker Desktop 완전 종료
Stop-Process -Name "Docker Desktop" -Force

# 2. WSL 재시작
wsl --shutdown

# 3. Docker Desktop 재시작
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### **문제 4: "docker: command not found" (설치 후에도)**

**해결 방법:**

```powershell
# 1. 환경 변수 확인
$env:Path

# 2. Docker 경로 추가 (필요시)
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

# 3. PowerShell 재시작
```

---

## ✅ 설치 확인 체크리스트

설치가 완료되면 다음을 확인하세요:

```powershell
# 1. Docker 버전
docker --version

# 2. Docker Compose 버전
docker compose version

# 3. Docker 정보
docker info

# 4. 테스트 컨테이너 실행
docker run hello-world

# 5. 이미지 목록
docker images

# 6. 컨테이너 목록
docker ps -a
```

**모든 명령어가 정상 작동하면 설치 완료!** ✅

---

## 🚀 ICT Rules Quiz 실행

Docker Desktop 설치 완료 후:

```powershell
# 프로젝트 디렉토리로 이동
cd C:\IctRulesQuiz

# Docker Compose로 빌드 및 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f

# 브라우저에서 접속
start http://localhost
```

**주의**: 최신 Docker Desktop에서는 `docker compose` (하이픈 없음)를 사용합니다.

---

## 📚 참고 자료

### **공식 문서**
- Docker Desktop for Windows: https://docs.docker.com/desktop/install/windows-install/
- WSL 2 설치: https://docs.microsoft.com/en-us/windows/wsl/install

### **Docker 명령어 치트시트**
```powershell
# 컨테이너 관리
docker ps                    # 실행 중인 컨테이너
docker ps -a                 # 모든 컨테이너
docker stop <container>      # 컨테이너 중지
docker rm <container>        # 컨테이너 삭제

# 이미지 관리
docker images                # 이미지 목록
docker rmi <image>           # 이미지 삭제
docker pull <image>          # 이미지 다운로드

# Docker Compose
docker compose up -d         # 백그라운드 실행
docker compose down          # 중지 및 삭제
docker compose logs -f       # 로그 확인
docker compose ps            # 상태 확인
docker compose restart       # 재시작
```

---

## 💡 추가 팁

### **Docker Desktop 대시보드 사용**

Docker Desktop 트레이 아이콘 클릭:
- 📊 Containers: 실행 중인 컨테이너 확인
- 🖼️ Images: 다운로드한 이미지 목록
- 📦 Volumes: 데이터 볼륨 관리
- ⚙️ Settings: 설정 변경

### **성능 최적화**

1. **WSL 2 메모리 제한** (`.wslconfig` 파일 생성):

```ini
# C:\Users\<사용자이름>\.wslconfig
[wsl2]
memory=4GB
processors=2
swap=1GB
```

2. **Docker Desktop 리소스 조정**:
   - Settings → Resources → Advanced
   - CPU, Memory, Swap 조정

---

## 📞 지원

설치 중 문제가 발생하면:

1. **Docker Desktop 로그 확인**:
   - Docker Desktop → Troubleshoot → Get support
   - 로그 파일: `%LOCALAPPDATA%\Docker\log.txt`

2. **WSL 로그 확인**:
   ```powershell
   wsl --list --verbose
   ```

3. **Docker 공식 포럼**:
   - https://forums.docker.com/

---

**작성일**: 2025-11-14
**버전**: 1.0.0

