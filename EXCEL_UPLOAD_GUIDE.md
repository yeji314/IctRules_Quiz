# 📊 관리자 퀴즈 엑셀 업로드 가이드

> 엑셀 파일로 여러 퀴즈 문제를 한 번에 등록하는 방법

---

## 📋 엑셀 파일 형식

### 필수 컬럼 (5개)

| 컬럼명 | 한글 컬럼명 | 필수 | 설명 |
|--------|------------|------|------|
| `question_type` | 문제유형 | ✅ | 문제 타입 |
| `category` | 카테고리 | ✅ | 일반문제: `normal` |
| `question_text` | 문제내용 | ✅ | 문제 텍스트 |
| `question_data` | 문제데이터 | ✅ | JSON 형식 |
| `explanation` | 해설 | ⭕ | 오답 시 표시 |

**참고:** 영문 컬럼명 또는 한글 컬럼명 둘 다 사용 가능합니다!

---

## 🎯 문제 유형별 작성법

### 1️⃣ **드래그 앤 드롭** (`drag_and_drop`)

**question_data 형식:**
```json
{"pairs":[{"left":"항목1","right":"답변1"},{"left":"항목2","right":"답변2"}]}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation |
|--------------|----------|---------------|---------------|-------------|
| drag_and_drop | normal | 다음 용어를 올바르게 연결하세요 | {"pairs":[{"left":"VPN","right":"가상사설망"},{"left":"DLP","right":"데이터유출방지"}]} | VPN은 가상사설망... |

---

### 2️⃣ **타이핑** (`typing`)

**question_data 형식:**
```json
{"correct_answer":"정답텍스트"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation |
|--------------|----------|---------------|---------------|-------------|
| typing | normal | 정보보호 담당자의 약어는? | {"correct_answer":"CISO"} | CISO는 Chief... |

---

### 3️⃣ **빈칸 맞추기** (`fill_in_blank`)

**question_data 형식:**
```json
{"options":["선택지1","선택지2","선택지3","선택지4"],"correct_answer":"정답"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation |
|--------------|----------|---------------|---------------|-------------|
| fill_in_blank | normal | 개인정보 보호법상 민감정보는 ___일 이상 보관 금지 | {"options":["30일","60일","90일","120일"],"correct_answer":"30일"} | 민감정보는 30일... |

---

### 4️⃣ **OX 퀴즈** (`ox`)

**question_data 형식:**
```json
{"correct_answer":"O"}
```
또는
```json
{"correct_answer":"X"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation |
|--------------|----------|---------------|---------------|-------------|
| ox | normal | 사내 Wi-Fi 비밀번호는 타인에게 공유할 수 있다 | {"correct_answer":"X"} | Wi-Fi 비밀번호는... |

---

### 5️⃣ **상황형 4지선다** (`best_action`)

**question_data 형식:**
```json
{"options":["행동1","행동2","행동3","행동4"],"correct_answer":"정답행동"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation |
|--------------|----------|---------------|---------------|-------------|
| best_action | normal | 외부에서 공유 요청을 받았다. 가장 적절한 조치는? | {"options":["즉시 거절","담당자에게 문의","메일로 전송","클라우드 공유"],"correct_answer":"담당자에게 문의"} | 외부 공유는... |

---

## 📝 실전 예시 (복사 가능)

### 샘플 데이터 (엑셀에 그대로 복사하세요)

```
question_type	category	question_text	question_data	explanation
drag_and_drop	normal	다음 보안 용어를 올바르게 연결하세요	{"pairs":[{"left":"VPN","right":"가상사설망"},{"left":"DLP","right":"데이터유출방지"},{"left":"MFA","right":"다중인증"}]}	VPN은 가상사설망(Virtual Private Network)의 약자입니다
typing	normal	정보보호 최고책임자의 영문 약어를 입력하세요	{"correct_answer":"CISO"}	CISO는 Chief Information Security Officer의 약자입니다
fill_in_blank	normal	개인정보는 수집 목적 달성 후 ___일 이내에 파기해야 합니다	{"options":["30일","60일","90일","즉시"],"correct_answer":"즉시"}	개인정보는 목적 달성 즉시 파기가 원칙입니다
ox	normal	사내 메일을 개인 메일로 전달해도 된다	{"correct_answer":"X"}	사내 정보는 개인 메일로 전달할 수 없습니다
best_action	normal	노트북을 분실했을 때 가장 먼저 해야 할 일은?	{"options":["경찰 신고","보안팀 신고","비밀번호 변경","재구매 요청"],"correct_answer":"보안팀 신고"}	노트북 분실 시 즉시 보안팀에 신고해야 합니다
```

---

## 🔧 엑셀 작성 방법

### 1️⃣ **Excel 파일 생성**

1. Excel 또는 Google Sheets 열기
2. 첫 번째 행에 컬럼명 입력
3. 두 번째 행부터 데이터 입력

### 2️⃣ **컬럼 구성**

```
A열: question_type
B열: category
C열: question_text
D열: question_data
E열: explanation
```

### 3️⃣ **주의사항**

**question_data 컬럼:**
- ✅ JSON 형식으로 작성
- ✅ 쌍따옴표(`"`) 사용
- ✅ 한글 사용 가능
- ❌ 줄바꿈 금지 (한 셀에 한 줄로)

**예시:**
```json
{"options":["A","B","C","D"],"correct_answer":"A"}
```

---

## 🚀 업로드 방법

### 1단계: 관리자 페이지 접속
```
http://localhost:5000/pages/admin/dashboard.html
```

### 2단계: 퀴즈 관리 메뉴

1. 좌측 사이드바에서 **"퀴즈 관리"** 클릭
2. 이벤트 선택 (예: "2025년 1월 내규 퀴즈")

### 3단계: 엑셀 업로드

1. **"📄 엑셀 업로드"** 버튼 클릭
2. 작성한 `.xlsx` 파일 선택
3. **"업로드"** 버튼 클릭

### 4단계: 확인

- 성공 메시지 확인
- 문제 목록에서 등록된 문제 확인

---

## ⚠️ 자주 하는 실수

### ❌ 잘못된 예시

```
1. question_data에 JSON 아닌 텍스트
   {"correct_answer":"CISO"}  ✅
   CISO                       ❌

2. 쌍따옴표 대신 홑따옴표
   {"correct_answer":"A"}     ✅
   {'correct_answer':'A'}     ❌

3. 쉼표 누락
   {"options":["A","B"]}      ✅
   {"options":["A" "B"]}      ❌

4. 한글 컬럼명 오타
   문제유형                    ✅
   문제 유형                   ❌ (띄어쓰기)
```

---

## 💡 팁

### JSON 작성 도우미

**Excel 수식으로 JSON 자동 생성:**

```excel
// OX 문제
="{""correct_answer"":"""&A2&"""}"

// 빈칸 맞추기 (옵션이 B2,C2,D2,E2, 정답이 F2)
="{""options"":["""&B2&""","""&C2&""","""&D2&""","""&E2&"""],""correct_answer"":"""&F2&"""}"
```

### 대량 업로드 권장

- 한 번에 10~50문제 업로드 권장
- 100문제 이상은 파일 분할 권장
- 업로드 실패 시 로그 확인

---

## 🐛 문제 해결

### Q1: "Excel 처리 라이브러리가 로드되지 않았습니다"

**A:** 페이지 새로고침 (F5)

### Q2: "엑셀 파일에 데이터가 없습니다"

**A:** 
- 첫 번째 시트에 데이터가 있는지 확인
- 컬럼명이 첫 번째 행에 있는지 확인
- 빈 행 없는지 확인

### Q3: JSON 형식 오류

**A:**
```bash
# 온라인 JSON 검증기 사용
https://jsonlint.com/

# 예시 입력:
{"options":["A","B"],"correct_answer":"A"}
```

---

## 📎 다운로드

**샘플 파일:** `sample-quiz-upload.xlsx` (아래 생성 예정)

---

**작성일:** 2025-01-23  
**버전:** 1.0

