# iM루키 (iM Rookie) - 회사 AI 에이전트

**iM루키**는 직원들의 행정 업무를 자동화하는 내부 AI 에이전트 프로토타입입니다.

## 주요 기능

### 1️⃣ **퀴즈 생성기 (Quiz Generator)**
- 회사 정책 문서를 RAG(Retrieval-Augmented Generation) 기술로 처리
- Gemini LLM이 자동으로 다중선택 퀴즈 생성
- ChromaDB를 통한 빠른 유사도 검색
- 6가지 부서별 정책 기반 퀴즈 (IT, 영업, 준법감시, 인사, 마케팅, 전략기획)

### 2️⃣ **MRO 자동화 (MRO Automation)**
- Playwright를 이용한 RPA(Robotic Process Automation)
- 사내 구매 포탈의 자동 주문 처리
- 시각적 자동화 과정을 실시간으로 확인 가능
- 완료 후 Slack으로 알림 전송

### 3️⃣ **Electron 데스크톱 앱 (진행 중)**
- 글래스모르피즘 UI 디자인 (반투명 배경, 블러 효과)
- 트레이 위젯 및 스크린세이버 모드
- XP 시스템 및 레벨 업 기능
- F8로 진입, ESC로 퇴출

---

## 빠른 시작

### 필수 요건
- Python 3.9+
- Node.js 18+
- Gemini API 키 ([https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey))

### 백엔드 설정

1. **백엔드 디렉토리로 이동**
   ```bash
   cd backend
   ```

2. **Python 의존성 설치**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **환경 변수 설정** (`backend/.env` 생성)
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." # 선택사항
   ```

4. **서버 시작**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   ✅ 서버가 실행되면: `http://localhost:8000/docs` 에서 API 확인

### 프론트엔드 설정

1. **프론트엔드 디렉토리로 이동**
   ```bash
   cd frontend
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```

   ✅ 브라우저: `http://localhost:5174`

---

## 📊 데모 및 API 테스트

### Swagger UI (권장)
가장 간편한 방법입니다:

1. 백엔드 서버 실행 후 `http://localhost:8000/docs` 방문
2. **주요 엔드포인트:**

#### 📝 퀴즈 생성 테스트
```bash
GET /api/quiz?department=IT
```

**예시 응답:**
```json
{
  "quiz": {
    "question": "IT 부서의 보안 정책에서 비밀번호 최소 길이는?",
    "options": ["8자", "10자", "12자", "16자"],
    "correct": 2
  },
  "department": "IT"
}
```

#### 🤖 MRO 자동화 테스트
```bash
POST /api/action/mro
```

**실행 결과:**
- Playwright가 브라우저를 자동으로 띄우고 주문 프로세스 자동 실행
- 화면을 보며 RPA 프로세스 시각적으로 확인 가능
- 완료 후 `/static/mro_screenshots/` 폴더에 스크린샷 저장

**cURL 예시:**
```bash
curl -X POST http://localhost:8000/api/action/mro
```

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│  React Frontend (Vite)                  │
│  localhost:5174                          │
└──────────────────┬──────────────────────┘
                   │ Axios HTTP
                   ▼
┌─────────────────────────────────────────┐
│  FastAPI Backend                         │
│  localhost:8000                          │
│                                          │
│  ├── GET /api/quiz?department=IT        │
│  │   └─ ChromaDB → Gemini → JSON        │
│  │                                       │
│  ├── POST /api/action/mro               │
│  │   └─ Playwright RPA → Slack          │
│  │                                       │
│  ├── GET /mro-mall (Mock Portal)        │
│  └── /static/                            │
└─────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
  ChromaDB    Gemini LLM
  (벡터 DB)  (생성 AI)
```

### 데이터 흐름

**퀴즈 생성:**
1. 프론트엔드에서 부서(department) 선택
2. 백엔드가 ChromaDB에서 해당 부서 정책 검색
3. Gemini LLM이 검색된 정책 기반으로 퀴즈 생성
4. JSON 형태로 프론트엔드에 반환

**MRO 자동화:**
1. 프론트엔드에서 "자동 주문" 버튼 클릭
2. Playwright가 `/mro-mall` 페이지 로드
3. 자동 스크린샷 및 사용자 인터랙션 시뮬레이션
4. Slack 웹훅으로 완료 알림 전송

---

## 📁 프로젝트 구조

```
im-rookie-project-claude/
├── backend/
│   ├── main.py                 # FastAPI 메인 애플리케이션
│   ├── requirements.txt         # Python 의존성
│   ├── .env                     # 환경 변수 (생성 필요)
│   ├── data/                    # 정책 문서 (.txt)
│   │   ├── IT_rules.txt
│   │   ├── HR_rules.txt
│   │   ├── Sales_rules.txt
│   │   ├── Compliance_rules.txt
│   │   ├── Marketing_rules.txt
│   │   └── Strategy_rules.txt
│   └── static/
│       ├── mro_mock.html        # Mock 구매 포탈
│       └── mro_screenshots/     # RPA 스크린샷
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # 메인 App (현재 Vite 템플릿)
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js           # Vite 설정
│   └── index.html
│
├── docs/
│   ├── frontend_history.md      # 프론트엔드 개발 로드맵
│   ├── backend_history.md       # 백엔드 개발 로드맵
│   └── implementation_plan.md   # 구현 계획
│
└── README.md                    # 이 파일
```

---

## 🔌 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| **GET** | `/api/quiz?department={dept}` | 부서별 퀴즈 생성 |
| **POST** | `/api/action/mro` | MRO 자동화 실행 |
| **GET** | `/mro-mall` | Mock 구매 포탈 (HTML) |
| **GET** | `/static/mro_screenshots/` | RPA 스크린샷 조회 |
| **GET** | `/docs` | Swagger UI (API 문서) |

### 부서 코드
- `IT` — IT 부서
- `Sales` — 영업 부서
- `HR` — 인사 부서
- `Compliance` — 준법감시 부서
- `Marketing` — 마케팅 부서
- `Strategy` — 전략기획 부서

---

## 🎬 사용 예시

### 1. 퀴즈 생성
```bash
# IT 부서 정책 기반 퀴즈 생성
curl -X GET "http://localhost:8000/api/quiz?department=IT"
```

### 2. MRO 자동화 실행
```bash
# 구매 포탈 자동화 (Playwright 실행)
curl -X POST "http://localhost:8000/api/action/mro"
```

### 3. Swagger UI에서 직접 테스트
1. `http://localhost:8000/docs` 방문
2. 해당 엔드포인트 카드 클릭
3. "Try it out" 버튼 클릭
4. 필요시 매개변수 입력
5. "Execute" 버튼 클릭

---

## 🛠️ 기술 스택

| 계층 | 기술 |
|------|------|
| **프론트엔드** | React, Vite, Electron (계획) |
| **백엔드** | FastAPI, Python 3.9+ |
| **AI/ML** | Google Gemini 1.5 Flash, ChromaDB |
| **RPA** | Playwright |
| **벡터 DB** | ChromaDB (In-Memory) |
| **알림** | Slack Webhooks |

---

## 📝 환경 변수

**`backend/.env` 필수 항목:**

```env
# Gemini API 키 (필수)
GEMINI_API_KEY=your_gemini_api_key_here

# Slack 웹훅 (선택사항)
# 기본값 사용 시 Slack 알림 스킵
SLACK_WEBHOOK_URL="your_slack_webhook_here"
```

---

## 🐛 트러블슈팅

### 1. "Chromium not installed" 에러
```bash
playwright install chromium
```

### 2. "GEMINI_API_KEY not found" 에러
- `.env` 파일이 `backend/` 디렉토리에 있는지 확인
- API 키가 올바르게 입력되었는지 확인

### 3. 포트 충돌 (port 8000/5174 이미 사용 중)
```bash
# 다른 포트로 실행
uvicorn main:app --port 8001
# 또는
npm run dev -- --port 5175
```

### 4. CORS 에러
- 백엔드가 `http://localhost:5174` 요청을 허용하도록 설정됨
- 다른 포트에서 접속 시 `main.py`의 CORS 설정 수정 필요

---

## 📈 향후 계획

- [ ] Electron 데스크톱 앱 완성
- [ ] 프론트엔드 React 컴포넌트 구현 (SelectionScreen, ChatWidget, ScreensaverQuiz)
- [ ] 데이터베이스 영속성 (현재 in-memory ChromaDB)
- [ ] 사용자 인증 및 권한 관리
- [ ] 모바일 앱 지원

---

## 📄 라이선스

이 프로젝트는 내부 회사 프로젝트입니다.

---

## 📧 문의

질문이나 제안 사항이 있으시면 이슈를 등록해주세요.

---

**마지막 업데이트:** 2026년 4월 3일
