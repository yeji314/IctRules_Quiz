# 📊 관리자 퀴즈 엑셀 업로드 가이드

> 엑셀 파일로 여러 퀴즈 문제를 한 번에 등록하는 방법

---

## 📋 엑셀 파일 형식

### 필수 컬럼 (7개)

| 컬럼명 | 한글 컬럼명 | 필수 | 설명 |
|--------|------------|------|------|
| `question_type` | 문제유형 | ✅ | 문제 타입 |
| `category` | 카테고리 | ✅ | 일반문제: `normal` |
| `question_text` | 문제내용 | ✅ | 문제 텍스트 |
| `question_data` | 문제데이터 | ✅ | JSON 형식 |
| `explanation` | 해설 | ⭕ | 오답 시 표시 |
| `summary` | 요약 | ⭕ | 결과 페이지에 표시될 요약 |
| `highlight` | 하이라이트 | ⭕ | 요약에서 강조할 키워드 |

**참고:** 영문 컬럼명 또는 한글 컬럼명 둘 다 사용 가능합니다!

---

## 🎯 문제 유형별 작성법

### 1️⃣ **드래그 앤 드롭** (`drag_and_drop`)

4개의 선택지 중 정답을 드래그하여 드롭 영역에 놓는 문제입니다.

**question_data 형식:**
```json
{"target_label":"드롭 영역 메시지","options":["선택지1","선택지2","선택지3","선택지4"],"correct_answer":"정답"}
```

| 필드 | 설명 | 필수 |
|------|------|------|
| `target_label` | 드롭 영역에 표시될 안내 메시지 | ⭕ (기본값: "여기에 드래그하세요") |
| `options` | 4개의 선택지 배열 | ✅ |
| `correct_answer` | 정답 (options 중 하나) | ✅ |

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation | summary | highlight |
|--------------|----------|---------------|---------------|-------------|---------|-----------|
| drag_and_drop | normal | VPN의 정식 명칭은? | {"target_label":"정답을 드래그하세요","options":["Virtual Private Network","Very Public Network","Visual Private Node","Virtual Public Network"],"correct_answer":"Virtual Private Network"} | VPN은 가상사설망입니다 | VPN은 가상사설망입니다 | 가상사설망 |

---

### 2️⃣ **타이핑** (`typing`)

사용자가 직접 정답을 타이핑하는 문제입니다.

**question_data 형식:**
```json
{"correct_answer":"정답텍스트"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation | summary | highlight |
|--------------|----------|---------------|---------------|-------------|---------|-----------|
| typing | normal | 정보보호 담당자의 약어는? | {"correct_answer":"CISO"} | CISO는 Chief Information Security Officer의 약자 | CISO는 정보보안 책임자입니다 | CISO |

---

### 3️⃣ **빈칸 맞추기** (`fill_in_blank`)

4개의 선택지 중 빈칸에 들어갈 정답을 고르는 문제입니다.

**question_data 형식:**
```json
{"options":["선택지1","선택지2","선택지3","선택지4"],"correct_answer":"정답"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation | summary | highlight |
|--------------|----------|---------------|---------------|-------------|---------|-----------|
| fill_in_blank | normal | 개인정보는 목적 달성 후 ___에 파기해야 합니다 | {"options":["30일","60일","90일","즉시"],"correct_answer":"즉시"} | 개인정보는 즉시 파기가 원칙 | 개인정보는 즉시 파기해야 합니다 | 즉시 파기 |

---

### 4️⃣ **OX 퀴즈** (`ox`)

O 또는 X를 선택하는 문제입니다.

**question_data 형식:**
```json
{"correct_answer":"O"}
```
또는
```json
{"correct_answer":"X"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation | summary | highlight |
|--------------|----------|---------------|---------------|-------------|---------|-----------|
| ox | normal | 사내 Wi-Fi 비밀번호는 타인에게 공유할 수 있다 | {"correct_answer":"X"} | Wi-Fi 비밀번호 공유는 금지 | Wi-Fi 비밀번호 공유 금지 | 공유 금지 |

---

### 5️⃣ **상황형 4지선다** (`best_action`)

상황에서 가장 적절한 행동을 고르는 문제입니다.

**question_data 형식:**
```json
{"options":["행동1","행동2","행동3","행동4"],"correct_answer":"정답행동"}
```

**엑셀 예시:**
| question_type | category | question_text | question_data | explanation | summary | highlight |
|--------------|----------|---------------|---------------|-------------|---------|-----------|
| best_action | normal | 노트북 분실 시 가장 먼저 해야 할 일은? | {"options":["경찰 신고","보안팀 신고","비밀번호 변경","재구매 요청"],"correct_answer":"보안팀 신고"} | 분실 시 보안팀에 먼저 신고 | 분실 시 보안팀 신고가 우선 | 보안팀 신고 |

---

## 📝 실전 예시 (복사 가능)

### 샘플 데이터 (엑셀에 그대로 복사하세요)

```
question_type	category	question_text	question_data	explanation	summary	highlight
drag_and_drop	normal	VPN의 정식 명칭은?	{"target_label":"정답을 드래그하세요","options":["Virtual Private Network","Very Public Network","Visual Private Node","Virtual Public Network"],"correct_answer":"Virtual Private Network"}	VPN은 가상사설망(Virtual Private Network)의 약자입니다	VPN은 가상사설망으로 안전한 네트워크 연결을 제공합니다	가상사설망
typing	normal	정보보호 최고책임자의 영문 약어를 입력하세요	{"correct_answer":"CISO"}	CISO는 Chief Information Security Officer의 약자입니다	CISO는 기업의 정보보안 총괄 책임자입니다	CISO
fill_in_blank	normal	개인정보는 수집 목적 달성 후 언제 파기해야 합니까?	{"options":["30일","60일","90일","즉시"],"correct_answer":"즉시"}	개인정보는 목적 달성 즉시 파기가 원칙입니다	개인정보는 목적 달성 후 즉시 파기해야 합니다	즉시 파기
ox	normal	사내 메일을 개인 메일로 전달해도 된다	{"correct_answer":"X"}	사내 정보는 개인 메일로 전달할 수 없습니다	사내 메일의 외부 전달은 금지되어 있습니다	외부 전달 금지
best_action	normal	노트북을 분실했을 때 가장 먼저 해야 할 일은?	{"options":["경찰 신고","보안팀 신고","비밀번호 변경","재구매 요청"],"correct_answer":"보안팀 신고"}	노트북 분실 시 즉시 보안팀에 신고해야 합니다	분실 시 보안팀에 즉시 신고하는 것이 최우선입니다	보안팀 신고
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
F열: summary
G열: highlight
```

### 3️⃣ **주의사항**

**question_data 컬럼:**
- ✅ JSON 형식으로 작성
- ✅ 쌍따옴표(`"`) 사용
- ✅ 한글 사용 가능
- ❌ 줄바꿈 금지 (한 셀에 한 줄로)

**drag_and_drop 유형:**
- ✅ `options` 배열에 4개 선택지 입력
- ✅ `correct_answer`는 options 중 하나여야 함
- ⭕ `target_label`은 선택사항 (기본값: "여기에 드래그하세요")

**예시:**
```json
{"target_label":"정답을 드래그하세요","options":["A","B","C","D"],"correct_answer":"A"}
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

5. drag_and_drop에서 pairs 형식 사용 (구버전)
   {"options":["A","B","C","D"],"correct_answer":"A"}  ✅
   {"pairs":[{"left":"A","right":"B"}]}                ❌
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

// 드래그앤드롭 (옵션이 B2,C2,D2,E2, 정답이 F2, 드래그 메시지가 G2)
="{""target_label"":"""&G2&""",""options"":["""&B2&""","""&C2&""","""&D2&""","""&E2&"""],""correct_answer"":"""&F2&"""}"
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
{"options":["A","B","C","D"],"correct_answer":"A"}
```

---

## 📎 다운로드

**샘플 파일:** `sample-quiz-upload.csv`

---

**작성일:** 2025-01-23  
**버전:** 2.0 (drag_and_drop 형식 수정, summary/highlight 추가)

