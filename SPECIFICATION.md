# 내규 퀴즈 게임 사이트 명세서 (SDD)

## 1. 프로젝트 개요

### 1.1 목적
- **직원 교육**: 회사 내규에 대한 직원들의 이해도 향상
- **재미 요소**: 다양한 인터랙티브 문제 유형으로 자발적 참여 유도
- **보상**: LuckyDraw를 통한 기프티콘 증정

### 1.2 대상 사용자
- 전사 직원 (약 500명)
- 관리자 (퀴즈 관리 권한)

### 1.3 운영 방식
- **월간 이벤트**: 매월 1개의 퀴즈 이벤트
- **참여 횟수**: 5개씩 총 15개 문제까지 풀 수 있음 (최대 3회차)
- **회차 구성**: 1회차 = 랜덤 5개 문제
- **문제 풀**: 일반 문제 15개 + LuckyDraw 문제 3개 (총 18개)
- **UI/UX**: 게임 애니메이션을 최대한 적용하여 흥미로운 경험 제공

---

## 2. 요구사항 명세

### 2.1 기능 요구사항

#### 2.1.1 사용자 기능

**인증**
- 행원번호 + 비밀번호 로그인
- **사내 메신저 API 연동** (추후 개발):
  - 사용자 정보 검증 및 조회
  - 사용자 계정 자동 동기화
  - 현재는 Mock/Stub 구현
- 로그인 성공 시:
  - 일반 사용자 → 퀴즈 목록 페이지
  - 관리자(admin) → 관리자 페이지
- 기본 관리자 계정:
  - 행원번호: admin
  - 비밀번호: admin@

**퀴즈 목록 및 참여**
- 퀴즈 목록 페이지에서 진행 가능한 퀴즈 확인
- 퀴즈명 형식: "2025년 10월 O회차" (월별로 생성)
  - 회차는 1회차부터 시작 (5개 풀면 1회차, 10개 풀면 2회차, 15개 풀면 3회차)
- 퀴즈별 상태 표시:
  - "시작하기": 처음 시작하는 경우 (0문제 완료)
  - "계속하기": 1~2회차 완료 (5~10문제 완료)
  - "완료": 3회차 완료 (15문제 완료, 비활성화)
- 유효기간 관리: 관리자 설정 기간 종료 시 비활성화
- LuckyDraw 뱃지 표시:
  - ⭐ (별표): LuckyDraw 문제를 맞춘 경우
  - ☆ (빈 별표): LuckyDraw 미참여 또는 틀린 경우
- 최대 3회차 참여 (회차별 5개 문제)
- 5가지 유형의 인터랙티브 문제 풀이
- 진행 상황 자동 저장
- 답안 제출 및 즉시 피드백

**결과 확인**
- 회차별 결과 및 정답/오답 확인
- 총 참여 현황 (1차/2차/3차)
- LuckyDraw 당첨 여부 확인

#### 2.1.2 관리자 기능

**월간 퀴즈 관리**
- 새로운 월간 이벤트 생성 (YYYY년 MM월 형식)
- 이벤트 유효기간 설정 (시작일 ~ 종료일)
- 이벤트별 문제 등록 (18개: 일반 15개 + LuckyDraw 3개)
- 문제 유형별 추가/수정/삭제
- 이벤트 활성화/종료 관리

**사용자 관리** (추후 개발)
- 사내 메신저 API 연동하여 사용자 자동 동기화
- 사용자 목록 조회
- 부서별 관리

**통계 대시보드**
- 전체 참여율
- 부서별 참여율 시각화
- 문제별 정답률
- LuckyDraw 당첨자 관리

### 2.2 비기능 요구사항
- **성능**: 500명 동시 접속 지원
- **보안**: 사내 메신저 SSO 연동, 세션 관리
- **호환성**: Chrome, Edge, Safari, Firefox 최신 버전
- **반응형**: 데스크톱 우선, 태블릿 지원
- **가용성**: 사내 네트워크에서 99% 이상

---

## 3. 퀴즈 진행 규칙

### 3.1 문제 출제 규칙
- **랜덤 출제**: 18개 문제 풀에서 랜덤으로 5개씩 출제
- **중복 방지**: 이전에 풀었던 문제는 다시 나오지 않음
- **회차 진행**: 5개 문제를 풀면 1회차 완료

### 3.2 회차 종료 시 선택
- **계속하기**: 남은 문제 중 랜덤으로 5개 추가 출제
- **그만하기**: 퀴즈 목록 페이지로 이동
- **제약사항**: 이전 페이지로 돌아갈 수 없음 (진행 중 뒤로가기 불가)

### 3.3 정답/오답 처리
- **틀렸을 때**:
  - 즉시 오답노트(해설) 표시
  - 정답을 선택해야만 "다음 문제" 버튼 활성화
  - 정답 선택 전까지 다음 문제로 넘어갈 수 없음
- **맞았을 때**:
  - 정답 표시 및 해설 제공
  - 즉시 "다음 문제" 버튼 활성화

### 3.4 LuckyDraw 문제 출제 규칙
- **LuckyDraw 등장 조건**:
  - 현재 세션에서 **1번에 맞춘 문제가 3개 이상**일 때 LuckyDraw 문제 출현
  - 조건 충족 전까지는 일반 문제만 출제

- **LuckyDraw 이후**:
  - 첫 LuckyDraw 문제를 푼 후에는 남은 문제 중 LuckyDraw가 더 높은 확률로 출현
  - 예: 일반 문제 60% / LuckyDraw 문제 40% 비율

- **출제 알고리즘**:
  ```
  1. 현재 세션의 첫 맞힌 문제 수를 카운트
  2. 첫 맞힌 문제 수 >= 3 → LuckyDraw 풀 포함
  3. 첫 LuckyDraw 문제 풀이 완료 → LuckyDraw 확률 증가
  4. 남은 문제에서 가중치 랜덤 선택
  ```

### 3.5 참여 제한
- **최대 15개 문제**: 5개 × 3회차 = 총 15개까지 풀 수 있음
- **3회차 완료 후**: 해당 월간 이벤트 종료
- **미완료 시**: 언제든 돌아와서 이어서 풀 수 있음

---

## 4. 문제 유형 상세 명세

### 4.1 유형 1: 드래그 앤 드롭 (부서 배치)

**설명**: 문제를 읽고 관련 부서를 드래그하여 정답 위치에 배치

**UI 구성**:
```
좌상: 김철수님 [LOGOUT(아바타)]
우상: [⭐━━━━━] (별표 게이지)

중앙 상단: Q1) 개인정보 보호 관련 업무는 어느 부서의 책임인가?
          (큰 픽셀 폰트, login title 스타일)

중앙: 
  [인사팀] [IT팀] [법무팀] [재무팀] [영업팀]
  (드래그 가능한 5개 부서 카드)

  [정답 위치 박스]
  (드롭 가능 영역, 점선 테두리)

좌하: [캐릭터(nes-octocat)]
      [말풍선] (오답 시 해설 타이핑 효과)

하단: 픽셀 잔디 지형
```

**기술 구현**:
- HTML5 Drag & Drop API
- 드래그 시작: 카드 투명도 0.5, cursor: grabbing
- 드롭 가능 영역: 호버 시 초록색 배경, 테두리 변경
- 드롭 시: 즉시 자동 제출
- 정답 시: 별표 폭죽 애니메이션 + 별표 게이지 증가
- 오답 시: 말풍선에 해설 타이핑 효과 (30ms/글자), 화면 약간 흔들림 (±3px)

**데이터 구조**:
```javascript
{
  type: "drag_and_drop",
  question_text: "개인정보 보호 관련 업무는 어느 부서의 책임인가?",
  options: ["인사팀", "IT팀", "법무팀", "재무팀", "영업팀"],
  correct_answer: "법무팀",
  explanation: "개인정보 보호법에 따라 법무팀이 담당합니다."
}
```

---

### 4.2 유형 2: 타이핑 문제

**설명**: 주어진 문장을 정확히 따라 쓰기 (복사 붙여넣기 불가)

**UI 구성**:
```
좌상: 김철수님 [LOGOUT(아바타)]
우상: [⭐━━━━━] (별표 게이지)

중앙 상단: Q2) 다음 문장을 정확히 입력하세요
          (큰 픽셀 폰트, login title 스타일)

중앙:
  "회사 기밀 정보는 외부에 유출할 수 없으며, 위반 시 징계 대상이다"
  (회색 박스에 목표 문장 표시)

  [입력창 textarea]
  (최소 높이 120px)

  (진행률):
  ████████░░░░░░░░░░ 
  (nes-progress is-success 사용)

좌하: [캐릭터(nes-octocat)]
      [말풍선] (오답 시 해설 타이핑 효과)

하단: 픽셀 잔디 지형
```

**기술 구현**:
- 실시간 입력 감지 (oninput)
- 복사/붙여넣기/우클릭 방지: `onPaste`, `onCopy`, `onCut`, `onContextMenu` 이벤트 차단
- nes-progress 사용:
  - 입력 길이에 비례하여 진행률 계산 (value = (입력길이/목표길이) * 100)
  - is-success 클래스로 초록색 표시
- 정확도 검사: 띄어쓰기, 문장부호 포함 완전 일치
- 100% 입력 완료 시: 자동 제출 (0.5초 후)

**데이터 구조**:
```javascript
{
  type: "typing",
  question_text: "다음 문장을 정확히 입력하세요:",
  correct_answer: "회사 기밀 정보는 외부에 유출할 수 없으며, 위반 시 징계 대상이다",
  explanation: "내규 제7조를 정확히 숙지해야 합니다."
}
```

---

### 4.3 유형 3: 빈칸 맞추기 (객관식)

**설명**: 문장의 빈칸에 들어갈 알맞은 답 선택 (5지선다)

**UI 구성**:
```
좌상: 김철수님 [LOGOUT(아바타)]
우상: [⭐━━━━━] (별표 게이지)

중앙 상단: Q3) 직원은 출근 후 [    ] 분 이내에 근태 시스템에 등록해야 한다.
          (큰 픽셀 폰트, login title 스타일)

중앙: 
  [10분] [20분] [30분] [60분] [15분]
  (5개 선택지가 가로로 나열, 자동 줄바꿈)

좌하: [캐릭터(nes-octocat)]
      [말풍선] (오답 시 해설 타이핑 효과)

하단: 픽셀 잔디 지형
```

**기술 구현**:
- 버튼 형태의 선택지 (번호 없음, 텍스트만 표시)
- flex-wrap으로 가로 배치 + 자동 줄바꿈
- 선택 시: 파란색 배경 + 0.3초 후 자동 제출
- 호버 시: 배경 변경 + 그림자 확대
- 정답 시: 초록색 배경
- 오답 시: 빨간색 배경 + 말풍선 해설

**데이터 구조**:
```javascript
{
  type: "fill_in_blank",
  question_text: "직원은 출근 후 [BLANK] 분 이내에 근태 시스템에 등록해야 한다.",
  options: ["10분", "20분", "30분", "60분", "15분"],  // 5개 옵션
  correct_answer: "30분",
  explanation: "내규 제3조에 따라 30분 이내 등록이 필요합니다."
}
```

---

### 4.4 유형 4: OX 문제 (말풍선 힌트)

**설명**: 문장의 참/거짓 판단, 마우스 위치에 따라 말풍선에 손가락 힌트 제공

**UI 구성**:
```
좌상: 김철수님 [LOGOUT(아바타)]
우상: [⭐━━━━━] (별표 게이지)

중앙 상단: Q4) 회사 노트북을 개인 용도로 사용해도 된다.
          (큰 픽셀 폰트, login title 스타일)

중앙:
  O   VS   X
  (120px 큰 글자, 배경/테두리 없음)

좌하: [캐릭터(nes-octocat)]
      [말풍선] (마우스 hover 시 👍 또는 👎 표시)
               (오답 시 해설 타이핑 효과)

하단: 픽셀 잔디 지형
```

**인터랙션**:
- **O에 마우스 hover**:
  - 정답이면: 말풍선에 👍 (엄지 척, 60px)
  - 오답이면: 말풍선에 👎 (엄지 아래, 60px)

- **X에 마우스 hover**:
  - 정답이면: 말풍선에 👍
  - 오답이면: 말풍선에 👎

- 마우스 leave: 말풍선 숨김
- 클릭: 0.3초 후 자동 제출

**기술 구현**:
- `onMouseEnter`/`onMouseLeave` 이벤트로 힌트 표시/숨김
- 손가락 이모지는 흰색 배경에 검은 테두리 효과 (drop-shadow)
- O와 X는 글자만 크게 (background: transparent, border: none)
- text-shadow로 8방향 검은 테두리
- 호버 시: scale(1.1)
- 정답 시: 초록색
- 오답 시: 빨간색 + 말풍선 해설

**데이터 구조**:
```javascript
{
  type: "ox",
  question_text: "회사 노트북을 개인 용도로 사용해도 된다.",
  correct_answer: "X",
  explanation: "회사 자산은 업무 목적으로만 사용해야 합니다."
}
```

---

### 4.5 유형 5: 틀린 부분 찾기

**설명**: 문장에서 밑줄 친 단어 5개 중 틀린 부분 1개를 선택

**UI 구성**:
```
좌상: 김철수님 [LOGOUT(아바타)]
우상: [⭐━━━━━] (별표 게이지)

중앙 상단: Q5) 다음 문장에서 틀린 부분을 찾으세요
          (큰 픽셀 폰트, login title 스타일)

중앙:
  직원은 출근(밑줄) 시 회사(밑줄) 보안카드(밑줄)를 착용(밑줄)하고, 
  퇴근(밑줄) 시에도 반드시 패용해야 한다.
  
  (밑줄 친 단어를 클릭하세요)
  (흰색 박스에 큰 폰트로 표시)

좌하: [캐릭터(nes-octocat)]
      [말풍선] (오답 시 해설 타이핑 효과)

하단: 픽셀 잔디 지형
```

**기술 구현**:
- 밑줄 단어를 `<span class="finderror-word">` 태그로 구현
- 밑줄 스타일: `text-decoration: underline` + `border-bottom: 3px solid`
- 호버 시: 노란색 반투명 배경 + 밑줄 두껍게
- 클릭 시: 파란색 배경 + 0.5초 후 자동 제출
- 정답 시: 초록색 배경 + 진한 초록 밑줄
- 오답 시: 빨간색 배경 + 진한 빨강 밑줄 + 말풍선 해설

**데이터 구조**:
```javascript
{
  type: "find_error",
  question_text: "직원은 [출근] 시 [회사] [보안카드]를 [착용]하고, [퇴근] 시에도 반드시 패용해야 한다.",
  underlined_words: ["출근", "회사", "보안카드", "착용", "퇴근"],
  correct_answer: "착용",  // '패용'이 맞는 표현
  explanation: "'착용'은 옷이나 장신구를 몸에 지니는 것이고, 카드는 '패용'이 맞습니다.",
  full_text: "직원은 출근 시 회사 보안카드를 패용하고, 퇴근 시에도 반드시 패용해야 한다."
}
```

---

## 5. 데이터 명세

### 5.1 데이터 모델

#### Users (사용자)
```javascript
{
  id: Integer (Primary Key),
  employee_id: String (행원번호, Unique),
  password: String (해시 처리된 비밀번호),
  name: String,
  department: String (부서),
  email: String,
  role: String (user/admin),
  created_at: DateTime,
  updated_at: DateTime
}
```

**기본 관리자 계정**:
```javascript
{
  employee_id: "admin",
  password: bcrypt.hash("admin@"),
  name: "관리자",
  department: "시스템",
  role: "admin"
}
```

#### QuizEvents (월간 퀴즈 이벤트)
```javascript
{
  id: Integer (Primary Key),
  title: String (예: "2025년 1월 내규 퀴즈"),
  year_month: String (YYYY-MM),
  start_date: DateTime,
  end_date: DateTime,
  is_active: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Questions (문제)
```javascript
{
  id: Integer (Primary Key),
  event_id: Integer (Foreign Key -> QuizEvents),
  question_type: String (drag_and_drop/typing/fill_in_blank/ox/find_error),
  category: String (normal/luckydraw),
  question_text: String,
  question_data: JSON ({
    // 유형별로 다른 구조
    // drag_and_drop: {options: [], correct_answer: ""}
    // typing: {correct_answer: ""}
    // fill_in_blank: {options: [], correct_answer: ""}
    // ox: {correct_answer: "O" or "X"}
    // find_error: {underlined_words: [], correct_answer: "", full_text: ""}
  }),
  explanation: String,
  order: Integer,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### QuizSessions (퀴즈 세션)
```javascript
{
  id: Integer (Primary Key),
  user_id: Integer (Foreign Key -> Users),
  event_id: Integer (Foreign Key -> QuizEvents),
  session_number: Integer (1, 2, 3),
  status: String (in_progress/completed),
  started_at: DateTime,
  completed_at: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### QuizAnswers (답변)
```javascript
{
  id: Integer (Primary Key),
  session_id: Integer (Foreign Key -> QuizSessions),
  question_id: Integer (Foreign Key -> Questions),
  user_answer: String or JSON,
  is_correct: Boolean,
  answer_attempt: Integer (시도 횟수: 1 = 첫 시도에 정답, 2+ = 재시도 후 정답),
  time_taken: Integer (초),
  answered_at: DateTime
}
```

#### LuckyDraws (행운의 추첨)
```javascript
{
  id: Integer (Primary Key),
  event_id: Integer (Foreign Key -> QuizEvents),
  user_id: Integer (Foreign Key -> Users),
  prize: String (기프티콘 종류),
  is_claimed: Boolean,
  created_at: DateTime
}
```

### 5.2 데이터 관계
```
QuizEvents (1) ─── (N) Questions
QuizEvents (1) ─── (N) QuizSessions
QuizEvents (1) ─── (N) LuckyDraws

Users (1) ─── (N) QuizSessions
Users (1) ─── (N) LuckyDraws

QuizSessions (1) ─── (N) QuizAnswers
Questions (1) ─── (N) QuizAnswers
```

---

## 6. UI/UX 명세

### 6.1 화면 구성

#### 6.1.1 로그인 화면
```
┌─────────────────────────────────────┐
│         내규 퀴즈 시스템            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  행원번호                     │ │
│  │  [__________________]         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  비밀번호                     │ │
│  │  [__________________]         │ │
│  └───────────────────────────────┘ │
│                                     │
│          [로그인]                   │
│                                     │
│  관리자: admin / admin@             │
└─────────────────────────────────────┘
```

**로그인 프로세스**:
1. 행원번호 + 비밀번호 입력
2. 서버에서 인증 처리
3. 성공 시:
   - role === 'admin' → 관리자 페이지로 리다이렉트
   - role === 'user' → 퀴즈 목록 페이지로 리다이렉트
4. 실패 시: 에러 메시지 표시

#### 6.1.2 퀴즈 목록 페이지
```
┌─────────────────────────────────────────────┐
│  📚 내규 퀴즈 목록                          │
│                                             │
│  안녕하세요, 홍길동님 (IT개발팀)            │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  2025년 10월 1회차                  │   │
│  │  ⭐⭐☆ LuckyDraw 2/3              │   │
│  │  ━━━━━━━━━━ 66% (10/15 완료)     │   │
│  │                                     │   │
│  │  유효기간: 2025-10-01 ~ 2025-10-31 │   │
│  │                       [계속하기 →] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  2025년 9월 3회차                   │   │
│  │  ⭐⭐⭐ LuckyDraw 3/3              │   │
│  │  ━━━━━━━━━━ 100% (15/15 완료)    │   │
│  │                                     │   │
│  │  유효기간: 2025-09-01 ~ 2025-09-30 │   │
│  │                        [완료 ✓]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  2025년 8월                         │   │
│  │  ☆☆☆ LuckyDraw 0/3                │   │
│  │  ━━━━━━━━━━ 0% (0/15)            │   │
│  │                                     │   │
│  │  유효기간: 2025-08-01 ~ 2025-08-31 │   │
│  │                      [시작하기 →]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  2025년 7월 2회차 (기간 만료)      │   │
│  │  ⭐☆☆ LuckyDraw 1/3                │   │
│  │  ━━━━━━━━━━ 40% (6/15)           │   │
│  │                                     │   │
│  │  유효기간: 2025-07-01 ~ 2025-07-31 │   │
│  │                    [만료됨 🔒]     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**퀴즈 카드 구성 요소**:
- **퀴즈명**: "YYYY년 MM월 [N회차]" 형식
  - 아직 시작 안 함: "2025년 8월" (회차 표시 없음)
  - 진행 중/완료: "2025년 10월 1회차", "2025년 10월 2회차", "2025년 10월 3회차"
  - 회차 계산: 5개 풀면 1회차, 10개 풀면 2회차, 15개 풀면 3회차
- **LuckyDraw 뱃지**:
  - ⭐: 맞춘 LuckyDraw 문제 수
  - ☆: 맞추지 못한 LuckyDraw 문제 수
  - 총 3개 표시
- **진행률 바**:
  - 15개 중 현재까지 푼 문제 수
  - 퍼센트로 표시
- **유효기간**: 관리자가 설정한 시작일 ~ 종료일
- **액션 버튼**:
  - "시작하기": 처음 참여 (0문제 완료)
  - "계속하기": 1~2회차 완료 (5~10문제 완료)
  - "완료": 3회차 완료 (15문제 완료, 비활성화)
  - "만료됨": 유효기간 종료 (비활성화, 회색 처리)

#### 6.1.3 퀴즈 진행 화면
- 상단: 진행 바 (1/5, 2/5, ...)
- 중앙: 문제 유형별 UI
- 하단: [답변 제출] 버튼
- 자동 저장 표시

#### 6.1.4 회차 완료 화면
```
┌─────────────────────────────────────┐
│  🎉 1회차 완료!                     │
├─────────────────────────────────────┤
│  ✅ 정답: 4문제                     │
│  ❌ 오답: 1문제                     │
│  ⭐ LuckyDraw: 1개 획득             │
├─────────────────────────────────────┤
│  문제별 결과:                       │
│  1. ✅ 드래그앤드롭 - 정답          │
│  2. ❌ 타이핑 - 오답 (해설 보기)    │
│  3. ✅ 빈칸 맞추기 - 정답           │
│  4. ✅ OX - 정답                    │
│  5. ⭐ LuckyDraw - 정답             │
├─────────────────────────────────────┤
│  남은 기회: 2회차 더 도전 가능     │
│                                     │
│  [🎯 계속하기 (2회차 도전)]         │
│  [📋 그만하기 (목록으로)]           │
└─────────────────────────────────────┘
```

**회차 완료 후 액션**:
- **계속하기**: 남은 문제 중 랜덤 5개로 다음 회차 시작
- **그만하기**: 퀴즈 목록 페이지로 이동 (뒤로가기 불가)
- **3회차 완료 시**:
  ```
  ┌─────────────────────────────────────┐
  │  🏆 축하합니다! 모든 회차 완료!    │
  ├─────────────────────────────────────┤
  │  총 15문제 완료                     │
  │  ⭐⭐⭐ LuckyDraw 3개 획득        │
  │                                     │
  │  전체 정답률: 86% (13/15)          │
  ├─────────────────────────────────────┤
  │  [🎁 LuckyDraw 추첨 확인]          │
  │  [📋 퀴즈 목록으로]                 │
  └─────────────────────────────────────┘
  ```

#### 6.1.5 관리자 대시보드
```
┌─────────────────────────────────────┐
│  📊 월간 퀴즈 관리                  │
├─────────────────────────────────────┤
│  현재 이벤트: 2025년 1월            │
│  참여율: 324/500 (64.8%)            │
│                                     │
│  부서별 참여율:                     │
│  ████████░░ IT개발팀 80%            │
│  ██████░░░░ 인사팀 60%              │
│  ████░░░░░░ 영업팀 40%              │
├─────────────────────────────────────┤
│  [새 이벤트 만들기]                 │
│  [문제 관리]                        │
│  [LuckyDraw 추첨]                  │
│  [통계 상세보기]                    │
└─────────────────────────────────────┘
```

#### 6.1.6 문제 관리 화면
- 이벤트 선택
- 문제 유형별 탭
- 문제 추가/수정/삭제 폼
- 일반/LuckyDraw 구분
- 미리보기 기능

### 6.2 디자인 원칙
- **재미**: 애니메이션, 캐릭터, 색상
- **직관성**: 명확한 지시사항
- **피드백**: 즉각적인 반응
- **접근성**: 큰 버튼, 명확한 색상 대비

---

## 7. 기술 명세

### 7.1 기술 스택

#### Frontend
- **언어**: HTML5, CSS3, JavaScript (ES6+) - 순수 바닐라 자바스크립트
- **스타일링**:
  - CSS3 (Flexbox, Grid)
  - CSS Variables
  - CSS Animations & Transitions
- **드래그앤드롭**: HTML5 Drag & Drop API
- **애니메이션**:
  - CSS Transitions
  - CSS Animations
  - JavaScript 애니메이션
- **차트**: Chart.js (부서별 통계)
- **HTTP 클라이언트**: Fetch API (네이티브)
- **모듈화**: ES6 Modules

#### Backend
- **언어**: JavaScript (ES6+)
- **런타임**: Node.js 18+
- **프레임워크**: Express.js 4+
- **아키텍처 패턴**: MVC (Model-View-Controller)
  - **Model**: Sequelize ORM 모델
  - **View**: React (Frontend)
  - **Controller**: Express 컨트롤러
- **인증**:
  - JWT (JSON Web Token)
  - bcrypt (비밀번호 해싱)
- **세션**: express-session
- **검증**: express-validator
- **보안**:
  - helmet (보안 헤더)
  - cors
  - rate-limiter (DDoS 방지)

#### Database
- **개발/프로덕션**: PostgreSQL 14+
- **ORM**: Sequelize 6+

#### 배포
- **환경**: 사내 서버 (Linux/Windows)
- **웹 서버**: Nginx (리버스 프록시)
- **프로세스 관리**: PM2

### 7.2 시스템 아키텍처 (MVC 패턴)

```
┌─────────────────────────────────────────────┐
│             Frontend (View)                 │
│       HTML/CSS/JavaScript                   │
│  - HTML Pages (로그인, 퀴즈 목록, 관리자)  │
│  - CSS Styling (애니메이션 포함)           │
│  - JavaScript (Vanilla JS, ES6 Modules)    │
│  - API Client (Fetch API)                  │
└─────────────────────────────────────────────┘
                    ↕
              REST API (JWT)
                    ↕
┌─────────────────────────────────────────────┐
│          Backend (Controller)               │
│          Express.js Server                  │
│  - Routes (라우팅)                          │
│  - Controllers (비즈니스 로직)              │
│  - Middleware (인증, 검증)                  │
└─────────────────────────────────────────────┘
                    ↕
              Sequelize ORM
                    ↕
┌─────────────────────────────────────────────┐
│            Model (Database)                 │
│          PostgreSQL                         │
│  - Users, QuizEvents, Questions             │
│  - QuizSessions, QuizAnswers, LuckyDraws    │
└─────────────────────────────────────────────┘
```

**MVC 패턴 구조**:
- **Model (M)**: Sequelize 모델 (데이터베이스 스키마 및 관계)
- **View (V)**: HTML/CSS/JavaScript (사용자 인터페이스)
- **Controller (C)**: Express 컨트롤러 (비즈니스 로직 및 요청 처리)

### 7.3 API 명세

#### 인증 API
```
POST   /api/auth/login          # 로그인 (행원번호 + 비밀번호)
                                 # Body: { employee_id, password }
                                 # Response: { token, user: { id, name, department, role } }
POST   /api/auth/logout         # 로그아웃
GET    /api/auth/me             # 현재 사용자 정보 (JWT 토큰 필요)
```

#### 퀴즈 이벤트 API
```
GET    /api/events/current      # 현재 활성 이벤트
GET    /api/events/:id          # 특정 이벤트 정보
```

#### 퀴즈 세션 API
```
POST   /api/quiz/start          # 새 세션 시작 (5개 문제 받기)
GET    /api/quiz/session/:id    # 세션 정보
POST   /api/quiz/answer         # 답변 제출
GET    /api/quiz/result/:id     # 세션 결과
GET    /api/quiz/my-sessions    # 내 세션 목록
```

#### 사용자 API
```
GET    /api/user/stats          # 내 통계
GET    /api/user/luckydraw      # 내 LuckyDraw 현황
```

#### 관리자 API - 이벤트
```
GET    /api/admin/events        # 이벤트 목록
POST   /api/admin/events        # 이벤트 생성
PUT    /api/admin/events/:id    # 이벤트 수정
DELETE /api/admin/events/:id    # 이벤트 삭제
```

#### 관리자 API - 문제
```
GET    /api/admin/questions?event_id=1    # 문제 목록
POST   /api/admin/questions                # 문제 추가
PUT    /api/admin/questions/:id            # 문제 수정
DELETE /api/admin/questions/:id            # 문제 삭제
```

#### 관리자 API - 통계
```
GET    /api/admin/stats/overview           # 전체 통계
GET    /api/admin/stats/department         # 부서별 통계
GET    /api/admin/stats/questions          # 문제별 정답률
GET    /api/admin/users                    # 참여자 목록
```

#### 관리자 API - LuckyDraw
```
POST   /api/admin/luckydraw/draw           # 추첨 실행
GET    /api/admin/luckydraw/winners        # 당첨자 목록
```

### 7.4 폴더 구조

```
IctRulesQuiz/
├── client/                          # Frontend (순수 HTML/CSS/JS)
│   ├── pages/                       # HTML 페이지
│   │   ├── index.html              # 로그인 페이지
│   │   ├── quiz-list.html          # 퀴즈 목록 페이지
│   │   ├── quiz.html               # 퀴즈 진행 페이지
│   │   ├── result.html             # 결과 페이지
│   │   ├── admin/
│   │   │   ├── dashboard.html     # 관리자 대시보드
│   │   │   ├── events.html        # 이벤트 관리
│   │   │   ├── questions.html     # 문제 관리
│   │   │   └── stats.html         # 통계
│   │
│   ├── css/                         # CSS 스타일
│   │   ├── reset.css               # CSS 리셋
│   │   ├── variables.css           # CSS 변수
│   │   ├── global.css              # 전역 스타일
│   │   ├── login.css               # 로그인 페이지
│   │   ├── quiz-list.css           # 퀴즈 목록
│   │   ├── quiz.css                # 퀴즈 진행
│   │   ├── result.css              # 결과 화면
│   │   ├── admin.css               # 관리자 페이지
│   │   └── animations.css          # 애니메이션
│   │
│   ├── js/                          # JavaScript
│   │   ├── modules/                # ES6 모듈
│   │   │   ├── api.js              # API 통신 (Fetch)
│   │   │   ├── auth.js             # 인증 관리
│   │   │   ├── storage.js          # Local/Session Storage
│   │   │   └── utils.js            # 유틸리티 함수
│   │   │
│   │   ├── pages/                  # 페이지별 JS
│   │   │   ├── login.js
│   │   │   ├── quiz-list.js
│   │   │   ├── quiz.js
│   │   │   ├── result.js
│   │   │   └── admin.js
│   │   │
│   │   └── components/             # 재사용 컴포넌트
│   │       ├── question-dragdrop.js
│   │       ├── question-typing.js
│   │       ├── question-fillblank.js
│   │       ├── question-ox.js
│   │       ├── question-finerror.js
│   │       └── chart.js            # Chart.js 래퍼
│   │
│   ├── images/                      # 이미지 파일
│   │   ├── characters/             # 캐릭터 이미지
│   │   └── icons/                  # 아이콘
│   │
│   └── package.json                # Chart.js 등 라이브러리 관리
│
├── server/                          # Backend
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js                  # OAuth 설정
│   │   └── constants.js
│   │
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── QuizEvent.js
│   │   ├── Question.js
│   │   ├── QuizSession.js
│   │   ├── QuizAnswer.js
│   │   └── LuckyDraw.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── quizController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── quiz.js
│   │   ├── user.js
│   │   └── admin.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT 검증
│   │   ├── adminMiddleware.js       # 관리자 권한
│   │   ├── errorHandler.js
│   │   └── validator.js
│   │
│   ├── services/
│   │   ├── questionService.js       # 문제 랜덤 선택 로직
│   │   ├── luckyDrawService.js      # 추첨 로직
│   │   └── statsService.js          # 통계 계산
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   │
│   ├── app.js                       # Express 앱 설정
│   ├── server.js                    # 서버 시작
│   └── package.json
│
├── database/
│   └── quiz.db                      # SQLite (개발용)
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── .env.example
├── SPECIFICATION.md                 # 이 파일
└── README.md
```

---

## 8. 핵심 기능 구현 가이드

### 8.1 복사 붙여넣기 방지 (타이핑 문제)

```javascript
// QuestionTyping.js
const QuestionTyping = ({ question }) => {
  const [input, setInput] = useState('');

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const preventCopyPaste = (e) => {
    e.preventDefault();
    alert('복사/붙여넣기는 사용할 수 없습니다!');
  };

  return (
    <input
      type="text"
      value={input}
      onChange={handleChange}
      onPaste={preventCopyPaste}
      onCopy={preventCopyPaste}
      onCut={preventCopyPaste}
      onDragStart={preventCopyPaste}
      autoComplete="off"
    />
  );
};
```

### 8.2 게이지 바 애니메이션

```css
/* ProgressBar.module.css */
.progressBar {
  width: 100%;
  height: 30px;
  background-color: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
```

```javascript
const progress = (input.length / correctAnswer.length) * 100;

<div className={styles.progressBar}>
  <div
    className={styles.progressFill}
    style={{ width: `${Math.min(progress, 100)}%` }}
  >
    {Math.round(progress)}%
  </div>
</div>
```

### 8.3 캐릭터 힌트 (OX 문제)

```javascript
// QuestionOX.js
const QuestionOX = ({ question }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const oButtonRef = useRef(null);
  const xButtonRef = useRef(null);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const getDistance = (element) => {
    if (!element) return Infinity;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(
      Math.pow(centerX - mousePos.x, 2) +
      Math.pow(centerY - mousePos.y, 2)
    );
  };

  const distanceToO = getDistance(oButtonRef.current);
  const distanceToX = getDistance(xButtonRef.current);
  const correctAnswer = question.question_data.correct_answer;

  // 정답에 가까우면 웃음, 오답에 가까우면 찡그림
  const getExpression = () => {
    if (distanceToO < distanceToX) {
      return correctAnswer === 'O' ? '😊' : '😣';
    } else {
      return correctAnswer === 'X' ? '😊' : '😣';
    }
  };

  return (
    <div onMouseMove={handleMouseMove}>
      <button ref={oButtonRef}>O</button>
      <button ref={xButtonRef}>X</button>
      <div className="character">{getExpression()}</div>
    </div>
  );
};
```

### 8.4 문제 랜덤 선택 로직 (LuckyDraw 조건 포함)

```javascript
// server/services/questionService.js
const getRandomQuestions = async (sessionId, eventId, excludeQuestionIds = []) => {
  // 현재 세션의 첫 맞힌 문제 수 확인
  const firstCorrectCount = await QuizAnswer.count({
    include: [{
      model: QuizSession,
      where: { id: sessionId }
    }],
    where: {
      is_correct: true,
      // 첫 시도에 맞춘 것만 카운트 (answer_attempt = 1)
      '$QuizSession.QuizAnswers.answer_attempt$': 1
    }
  });

  // LuckyDraw 문제를 한 번이라도 풀었는지 확인
  const hasSeenLuckyDraw = await QuizAnswer.count({
    include: [{
      model: QuizSession,
      where: { id: sessionId }
    }, {
      model: Question,
      where: { category: 'luckydraw' }
    }]
  }) > 0;

  // 남은 문제 가져오기
  const allQuestions = await Question.findAll({
    where: {
      event_id: eventId,
      id: { [Op.notIn]: excludeQuestionIds }
    }
  });

  // 일반 문제와 LuckyDraw 분리
  let normalQuestions = allQuestions.filter(q => q.category === 'normal');
  let luckyQuestions = allQuestions.filter(q => q.category === 'luckydraw');

  let selectedQuestions = [];

  // LuckyDraw 출제 조건 체크
  const canShowLuckyDraw = firstCorrectCount >= 3;

  if (!canShowLuckyDraw) {
    // 조건 미충족: 일반 문제만 출제
    selectedQuestions = shuffleArray(normalQuestions).slice(0, 5);
  } else if (!hasSeenLuckyDraw) {
    // 첫 LuckyDraw: 일반 4개 + LuckyDraw 1개
    const selectedNormal = shuffleArray(normalQuestions).slice(0, 4);
    const selectedLucky = shuffleArray(luckyQuestions).slice(0, 1);
    selectedQuestions = shuffleArray([...selectedNormal, ...selectedLucky]);
  } else {
    // LuckyDraw 이후: 가중치 랜덤 (LuckyDraw 40%)
    selectedQuestions = getWeightedRandomQuestions(
      normalQuestions,
      luckyQuestions,
      5,
      0.4 // LuckyDraw 비율
    );
  }

  return selectedQuestions;
};

// 가중치 기반 랜덤 선택
const getWeightedRandomQuestions = (normalQuestions, luckyQuestions, count, luckyWeight) => {
  const selected = [];
  const allQuestions = [...normalQuestions, ...luckyQuestions];

  while (selected.length < count && allQuestions.length > 0) {
    const isLucky = Math.random() < luckyWeight && luckyQuestions.length > 0;

    if (isLucky) {
      const idx = Math.floor(Math.random() * luckyQuestions.length);
      selected.push(luckyQuestions[idx]);
      luckyQuestions.splice(idx, 1);
      allQuestions.splice(allQuestions.indexOf(selected[selected.length - 1]), 1);
    } else if (normalQuestions.length > 0) {
      const idx = Math.floor(Math.random() * normalQuestions.length);
      selected.push(normalQuestions[idx]);
      normalQuestions.splice(idx, 1);
      allQuestions.splice(allQuestions.indexOf(selected[selected.length - 1]), 1);
    } else {
      // 일반 문제가 없으면 LuckyDraw에서 선택
      const idx = Math.floor(Math.random() * luckyQuestions.length);
      selected.push(luckyQuestions[idx]);
      luckyQuestions.splice(idx, 1);
    }
  }

  return shuffleArray(selected);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
```

### 8.5 오답 처리 및 재시도 로직

```javascript
// QuizPage.js (React Component)
const [currentQuestion, setCurrentQuestion] = useState(0);
const [userAnswer, setUserAnswer] = useState(null);
const [isCorrect, setIsCorrect] = useState(null);
const [showExplanation, setShowExplanation] = useState(false);
const [canProceed, setCanProceed] = useState(false);
const [attemptCount, setAttemptCount] = useState(0);

const handleSubmitAnswer = async () => {
  const correct = checkAnswer(userAnswer, questions[currentQuestion].correct_answer);
  setIsCorrect(correct);
  setShowExplanation(true);
  setAttemptCount(attemptCount + 1);

  if (correct) {
    // 정답: 다음 문제로 이동 가능
    setCanProceed(true);

    // 서버에 답안 저장
    await saveAnswer({
      question_id: questions[currentQuestion].id,
      user_answer: userAnswer,
      is_correct: true,
      attempt_number: attemptCount + 1
    });
  } else {
    // 오답: 다음 문제 버튼 비활성화, 오답노트 표시
    setCanProceed(false);

    // 서버에 오답 저장
    await saveAnswer({
      question_id: questions[currentQuestion].id,
      user_answer: userAnswer,
      is_correct: false,
      attempt_number: attemptCount + 1
    });
  }
};

const handleNextQuestion = () => {
  if (!canProceed) {
    alert('정답을 선택해야 다음 문제로 넘어갈 수 있습니다!');
    return;
  }

  // 다음 문제로 이동
  setCurrentQuestion(currentQuestion + 1);
  setUserAnswer(null);
  setIsCorrect(null);
  setShowExplanation(false);
  setCanProceed(false);
  setAttemptCount(0);
};

return (
  <div className="quiz-container">
    <ProgressBar current={currentQuestion + 1} total={5} />

    <QuestionComponent
      question={questions[currentQuestion]}
      userAnswer={userAnswer}
      setUserAnswer={setUserAnswer}
      disabled={isCorrect === true} // 정답 맞춘 후 입력 비활성화
    />

    {showExplanation && (
      <ExplanationBox
        isCorrect={isCorrect}
        explanation={questions[currentQuestion].explanation}
        correctAnswer={questions[currentQuestion].correct_answer}
      />
    )}

    <div className="button-group">
      {!showExplanation ? (
        <button onClick={handleSubmitAnswer}>답안 제출</button>
      ) : (
        <button
          onClick={handleNextQuestion}
          disabled={!canProceed}
          className={canProceed ? 'enabled' : 'disabled'}
        >
          다음 문제
        </button>
      )}
    </div>

    {/* 뒤로가기 방지 */}
    <PreventBackButton />
  </div>
);
```

### 8.6 뒤로가기 방지

```javascript
// PreventBackButton.js
import { useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

const PreventBackButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 브라우저 뒤로가기 방지
    const handlePopState = (e) => {
      e.preventDefault();
      const confirmLeave = window.confirm(
        '퀴즈를 나가시겠습니까? 진행 상황은 자동 저장됩니다.'
      );

      if (confirmLeave) {
        // 퀴즈 목록 페이지로 이동
        navigate('/quiz-list');
      } else {
        // 현재 페이지 유지
        window.history.pushState(null, '', window.location.href);
      }
    };

    // 초기 히스토리 상태 추가
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  return null;
};

export default PreventBackButton;
```

### 8.7 회차 계산 및 퀴즈 목록 상태 로직

```javascript
// server/controllers/quizController.js
const getQuizListForUser = async (req, res) => {
  const userId = req.user.id;

  // 모든 퀴즈 이벤트 가져오기
  const events = await QuizEvent.findAll({
    order: [['year_month', 'DESC']]
  });

  const quizList = await Promise.all(events.map(async (event) => {
    // 해당 이벤트에서 사용자가 완료한 세션들
    const completedSessions = await QuizSession.findAll({
      where: {
        user_id: userId,
        event_id: event.id,
        status: 'completed'
      },
      order: [['completed_at', 'ASC']]
    });

    // 회차 계산: 완료된 세션 수 = 회차
    const currentRound = completedSessions.length; // 0, 1, 2, 3

    // 총 풀은 문제 수
    const totalAnswered = currentRound * 5;

    // LuckyDraw 맞춘 개수
    const luckyDrawCount = await QuizAnswer.count({
      include: [
        {
          model: QuizSession,
          where: {
            user_id: userId,
            event_id: event.id
          }
        },
        {
          model: Question,
          where: { category: 'luckydraw' }
        }
      ],
      where: {
        is_correct: true,
        answer_attempt: 1 // 첫 시도에 맞춘 것만
      }
    });

    // 버튼 상태 결정
    let buttonText, buttonEnabled;
    const now = new Date();
    const isExpired = now > new Date(event.end_date);

    if (isExpired) {
      buttonText = '만료됨 🔒';
      buttonEnabled = false;
    } else if (currentRound === 0) {
      buttonText = '시작하기 →';
      buttonEnabled = true;
    } else if (currentRound < 3) {
      buttonText = '계속하기 →';
      buttonEnabled = true;
    } else {
      buttonText = '완료 ✓';
      buttonEnabled = false;
    }

    // 퀴즈명 생성 (회차 표시)
    const year = event.year_month.substring(0, 4);
    const month = event.year_month.substring(5);
    let quizTitle;

    if (currentRound === 0) {
      // 아직 시작 안 함
      quizTitle = `${year}년 ${month}월`;
    } else {
      // 진행 중 또는 완료
      quizTitle = `${year}년 ${month}월 ${currentRound}회차`;
    }

    return {
      eventId: event.id,
      title: quizTitle,
      currentRound,
      totalAnswered,
      totalQuestions: 15,
      progressPercent: Math.round((totalAnswered / 15) * 100),
      luckyDrawCount,
      luckyDrawTotal: 3,
      startDate: event.start_date,
      endDate: event.end_date,
      isExpired,
      buttonText,
      buttonEnabled
    };
  }));

  res.json({ quizList });
};
```

**회차 표시 규칙**:
- **아직 시작 안 함**: 0문제 완료 → "2025년 10월" (회차 표시 없음)
- **1회차**: 5개 문제 완료 → "2025년 10월 1회차"
- **2회차**: 10개 문제 완료 → "2025년 10월 2회차"
- **3회차**: 15개 문제 완료 → "2025년 10월 3회차" (완료)

**진행률 계산**:
- 진행률(%) = (완료한 문제 수 / 15) × 100
- 예: 10문제 완료 → 66%

**LuckyDraw 뱃지**:
- 첫 시도에 맞춘 LuckyDraw 문제만 카운트
- ⭐ × 맞춘 개수 + ☆ × (3 - 맞춘 개수)

---

## 9. 구현 계획

### Phase 1: 프로젝트 셋업 및 기본 구조 (3일)
- [ ] 프로젝트 초기화 (React + Express)
- [ ] 데이터베이스 스키마 생성 (Sequelize)
- [ ] 기본 라우팅 및 API 구조
- [ ] 인증 미들웨어 (JWT)

### Phase 2: 인증 및 사용자 관리 (2일)
- [ ] 사내 메신저 OAuth 연동 (또는 Mock)
- [ ] 로그인/로그아웃
- [ ] 사용자 대시보드

### Phase 3: 문제 유형 구현 (5일)
- [ ] 유형 1: 드래그 앤 드롭
- [ ] 유형 2: 타이핑 (복사 방지 + 게이지)
- [ ] 유형 3: 빈칸 맞추기
- [ ] 유형 4: OX (캐릭터 힌트)
- [ ] 유형 5: 틀린 부분 찾기

### Phase 4: 퀴즈 진행 로직 (3일)
- [ ] 문제 랜덤 선택
- [ ] 세션 관리
- [ ] 답안 제출 및 채점
- [ ] 진행 상황 저장
- [ ] 결과 화면

### Phase 5: 관리자 기능 (4일)
- [ ] 관리자 대시보드
- [ ] 이벤트 관리
- [ ] 문제 CRUD
- [ ] 통계 및 차트
- [ ] 부서별 참여율

### Phase 6: LuckyDraw 및 추가 기능 (2일)
- [ ] LuckyDraw 추첨 로직
- [ ] 당첨자 관리
- [ ] 알림 기능

### Phase 7: UI/UX 개선 (3일)
- [ ] 반응형 디자인
- [ ] 애니메이션 효과
- [ ] 캐릭터 디자인
- [ ] 로딩 및 에러 처리

### Phase 8: 테스트 및 배포 (3일)
- [ ] 기능 테스트
- [ ] 부하 테스트
- [ ] 사내 서버 배포
- [ ] 문서 작성

**총 예상 기간: 25일 (약 5주)**

---

## 10. 확인 및 검토 사항

### 10.1 사내 메신저 API 연동 (추후 개발)
- API 엔드포인트 제공 예정
- 사용자 인증 방식
- 사용자 동기화 주기
- 부서 정보 구조

### 10.2 서버 환경
- OS: Linux / Windows Server
- 데이터베이스: PostgreSQL / MySQL / MSSQL
- 도메인 주소
- SSL 인증서 필요 여부

### 10.3 디자인 가이드
- 회사 CI/CD 색상
- 로고 및 브랜딩
- 캐릭터 디자인 (자체 제작 or 이모지)

### 10.4 기프티콘 관리
- 기프티콘 종류 및 개수
- 추첨 방식 (랜덤 / 정답률 기준 등)
- 발송 방법 (이메일 / 메신저 등)

---

## 11. 성공 지표 (KPI)

- **참여율**: 전체 직원 70% 이상 참여
- **완주율**: 참여자의 80% 이상이 3회 모두 완료
- **부서별 균형**: 모든 부서 50% 이상 참여
- **정답률**: 평균 70% 이상 (교육 효과 검증)
- **만족도**: 사후 설문 4/5점 이상

---

## 12. 추가 개선 아이디어

- 월간 우수 부서 표창
- 개인별 배지/업적 시스템
- 문제 난이도 조절
- 모바일 앱 버전
- 타 부서 대결 모드
- 실시간 리더보드

---

**문서 버전**: 1.0
**작성일**: 2025-11-02
**작성자**: AI Assistant
**검토 상태**: 검토 필요
