# Swing 인증 모듈 - 생성된 파일 목록

ICT Rules Quiz 프로젝트에 Swing 인증 기능을 추가하기 위해 생성된 파일들입니다.

## 📁 생성된 파일 구조

```
IctRulesQuiz/
├── swing-auth/                          # Swing 인증 독립 모듈
│   ├── index.js                        # ✅ 메인 인증 함수 (doSwingAuthenticate)
│   ├── helpers.js                      # ✅ 유틸리티 함수 (apiCall, sha256, log)
│   ├── env.js                          # ✅ 환경 설정 (prod/dev/mock)
│   ├── example.js                      # ✅ 사용 예제 및 테스트
│   ├── package.json                    # ✅ 패키지 설정
│   ├── .gitignore                      # ✅ Git 제외 파일 목록
│   └── README.md                       # ✅ 모듈 빠른 시작 가이드
│
├── SWING_AUTH.md                       # ✅ Swing 인증 모듈 상세 문서
├── SWING_INTEGRATION_GUIDE.md          # ✅ 프로젝트 통합 가이드
└── SWING_AUTH_FILES.md                 # ✅ 이 파일 (생성된 파일 목록)
```

## 📋 파일별 설명

### 1. 핵심 모듈 파일

#### `swing-auth/index.js`
- **역할**: Swing 인증 메인 로직
- **주요 함수**:
  - `doSwingAuthenticate(options)` - 메인 인증 함수
  - `swingSsoAuth(ssoToken)` - SSO 토큰 인증
  - `swingIdPasswordAuth(employeeNo, password)` - ID/PW 인증
- **특징**: Directus 관련 코드 완전 제거, 순수 Swing 인증만 처리

#### `swing-auth/helpers.js`
- **역할**: 공통 유틸리티 함수
- **주요 함수**:
  - `apiCall(url, payload)` - Swing API 호출
  - `sha256(message)` - SHA-256 해싱
  - `log(label, obj)` - 로깅
  - `validateSwingResponse(response)` - 응답 검증
- **특징**: crypto, axios 등 Node.js 내장 모듈 사용

#### `swing-auth/env.js`
- **역할**: 환경별 설정 관리
- **주요 함수**:
  - `getConfig()` - 현재 환경 설정 반환
  - `getCurrentEnvironment()` - 현재 환경 확인 (prod/dev/mock)
- **특징**:
  - 환경 변수 기반 설정
  - Mock 환경에서 가상 응답 데이터 제공

### 2. 문서 파일

#### `swing-auth/README.md`
- **내용**: 빠른 시작 가이드
- **대상**: Swing 인증 모듈을 처음 사용하는 개발자
- **포함 내용**:
  - 설치 방법
  - 기본 사용 예제
  - 파일 구조
  - 주요 기능

#### `SWING_AUTH.md`
- **내용**: 상세 문서
- **대상**: 심화 사용자 및 통합 개발자
- **포함 내용**:
  - 전체 기능 설명
  - API 명세 (Swing API)
  - 사용 방법 (예제 코드)
  - Express.js 통합 예제
  - 보안 고려사항
  - 에러 처리
  - 환경 모드 설명

#### `SWING_INTEGRATION_GUIDE.md`
- **내용**: ICT Rules Quiz 프로젝트 통합 가이드
- **대상**: ICT Rules Quiz 프로젝트 개발자
- **포함 내용**:
  - 단계별 통합 방법
  - 미들웨어 생성 예제
  - 라우트 설정 예제
  - 클라이언트 통합 예제
  - 환경별 배포 방법
  - 트러블슈팅

#### `SWING_AUTH_FILES.md`
- **내용**: 생성된 파일 목록 (이 파일)
- **대상**: 프로젝트 관리자 및 개발자
- **포함 내용**:
  - 파일 구조
  - 파일별 설명
  - 사용 순서

### 3. 설정 파일

#### `swing-auth/package.json`
- **내용**: NPM 패키지 설정
- **의존성**: axios ^1.7.3
- **스크립트**:
  - `npm run example` - 예제 실행
  - `npm run test` - 예제 실행 (테스트 대신)

#### `swing-auth/.gitignore`
- **내용**: Git 제외 파일 목록
- **제외 항목**:
  - node_modules/
  - .env 파일들
  - 로그 파일
  - OS 및 IDE 설정 파일

### 4. 예제 파일

#### `swing-auth/example.js`
- **내용**: 5가지 사용 예제
- **예제 목록**:
  1. SSO 토큰 인증
  2. ID/Password 인증
  3. Express.js 미들웨어
  4. 환경별 설정 테스트
  5. 에러 처리
- **실행**: `npm run example` 또는 `node example.js`

## 🚀 사용 순서

### 1단계: 문서 읽기
1. `swing-auth/README.md` - 빠른 시작
2. `SWING_AUTH.md` - 상세 기능 이해

### 2단계: 설치 및 설정
1. `cd swing-auth && npm install`
2. 환경 변수 설정 (`.env` 파일 생성)

### 3단계: 테스트
1. `npm run example` - 예제 실행
2. Mock 모드에서 기능 확인

### 4단계: 프로젝트 통합
1. `SWING_INTEGRATION_GUIDE.md` 참고
2. 미들웨어 및 라우트 설정
3. 클라이언트 통합

## ✅ 구현된 기능

### Swing 인증 기능
- ✅ Swing SSO 토큰 인증 (`/cau/v1/oauth-code-simple`)
- ✅ Swing ID/Password 인증 (`/cau/v1/idpw-authorize`)
- ✅ SHA-256 비밀번호 해싱
- ✅ 환경별 설정 (prod/dev/mock)
- ✅ Mock 모드 가상 응답
- ✅ 에러 처리 및 로깅
- ✅ 응답 검증

### 제거된 기능 (요구사항대로)
- ❌ Directus 로그인 (`/auth/login`)
- ❌ Directus 사용자 조회/생성/수정
- ❌ directusUserLookup, directUserCreate, directUserUpdate
- ❌ directusUserLogin
- ❌ Directus API token/refresh token
- ❌ Directus 관련 모든 기능

## 📝 주요 변경사항

### 원본 (SHB-AUTHENTICATE-HANDLER)과 비교
| 항목 | 원본 | 현재 |
|------|------|------|
| Directus 연동 | ✅ 있음 | ❌ 완전 제거 |
| Swing 인증 | ✅ 있음 | ✅ 유지 |
| 파일 수 | 3개 | 3개 (동일) |
| 의존성 | Directus SDK | axios만 |
| 사용 방식 | Hook/Middleware | 독립 모듈 |
| 반환값 | Directus 세션 | Swing 사용자 정보 |

## 🔧 환경 변수

필수 환경 변수:
```bash
# 운영 모드
OPERATION_MODE=mock

# 운영 환경 (운영 모드일 때 필요)
SWING_ENDPOINT_PROD=
SWING_CLIENT_ID_PROD=
SWING_CLIENT_SECRET_PROD=

# 개발 환경 (개발 모드일 때 필요)
SWING_ENDPOINT_DEV=
SWING_CLIENT_ID_DEV=
SWING_CLIENT_SECRET_DEV=

# 목업 환경 (기본값)
SWING_ENDPOINT_MOCK=http://127.0.0.1:8055/swing-mock-server
SWING_CLIENT_ID_MOCK=5FACKST52XY6YDLM
SWING_CLIENT_SECRET_MOCK=YPZCWH4ZXLDGBVUX
```

## 📞 지원

- **문서**: `SWING_AUTH.md`, `SWING_INTEGRATION_GUIDE.md`
- **예제**: `swing-auth/example.js`
- **문의**: ICT Rules Quiz 프로젝트 팀

## 📜 라이센스

MIT
