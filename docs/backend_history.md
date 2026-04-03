# iM 루키 에이전트 백엔드 구현 이력

## 2026-04-03

### v0.1.0 — 초기 FastAPI 서버 구성

- FastAPI 단일 파일(`main.py`) 구조
- CORS 미들웨어 전체 허용 (`allow_origins=["*"]`)
- `/static` 디렉토리 StaticFiles 마운트
- `GET /mro-mall` → `backend/static/mro_mock.html` 서빙
- `backend/static/mro_mock.html` 생성
  - 'iM그룹 사내 비품몰' 금융권 스타일 UI
  - A4용지 박스 상품 카드 (₩24,500)
  - `[🛒 장바구니 담기]` → `[📋 결재 상신하기]` 순서로 활성화
  - 결재 상신 시 CSS 성공 모달 표시

### v0.1.1 — RAG 퀴즈 파이프라인 구현

- `startup` 이벤트에서 `init_rag()` 호출로 서버 시작 시 자동 초기화
- `GoogleGenerativeAIEmbeddings` (`models/embedding-001`) + `Chroma` 인메모리 벡터스토어
- LLM: `gemini-1.5-flash` (temperature 0.7)
- `GET /api/quiz?department=` 엔드포인트
  - `department` 메타데이터 필터로 부서별 문서 검색 (k=3)
  - 4지선다형 퀴즈 JSON 생성 (question, options, answer, explanation)
  - Markdown 코드블록 자동 파싱 처리
- `backend/data/` 부서별 규정 파일 6개 인덱싱 (IT, Sales, Compliance, HR, Marketing, Strategy)

### v0.1.2 — Playwright RPA 자동화 (`/api/action/mro`)

- `POST /api/action/mro` 엔드포인트 Playwright 기반으로 구현
- `MRORequest` Pydantic 모델 (item_name, quantity, user_name)
- `headless=False` + `slow_mo=300ms`: 사용자 화면에 브라우저 창 직접 표시
- 자동화 시퀀스:
  1. `/mro-mall` 접속 → `networkidle` 대기 → 1초 대기
  2. `#btnCart` (A4용지 장바구니 담기) 클릭 → 1초 대기
  3. `#btnSubmit` (결재 상신하기) 클릭
  4. 완료 스크린샷 캡처 (`static/mro_result.png`) → 브라우저 닫기
- 완료 응답에 `screenshot_url: "/static/mro_result.png"` 포함
- Slack 웹훅 알림 (SLACK_WEBHOOK_URL 설정 시)

### v0.1.4 — 모델 버전 업그레이드 및 API 키 명시적 전달

- `langchain-google-genai==1.0.1` → `>=2.0.0` 업그레이드 (`v1beta` 엔드포인트 문제 해결)
- `chromadb==0.4.24` → `>=0.5.0`, `langchain==0.1.13` → `>=0.3.0` 업그레이드
- `GoogleGenerativeAIEmbeddings`, `ChatGoogleGenerativeAI` 생성 시 `google_api_key=api_key` 명시적 전달 (ADC 오류 방지)
- 임베딩 모델: `models/embedding-001` → `models/gemini-embedding-001`
- LLM 모델: `gemini-1.5-flash` → `gemini-2.5-flash` (v1beta 미지원 모델 제거)

### v0.1.5 — DEV_MODE 추가 (과금 방지)

- `.env`에 `DEV_MODE=true/false` 환경 변수 추가
- `DEV_MODE=true` 시 `init_rag()` 초기화 생략, Gemini API 미호출
- `/api/quiz` 엔드포인트에서 `DEV_MODE=true` 시 부서별 목업 퀴즈 즉시 반환
- 목업 퀴즈 6종 (IT, HR, Sales, Compliance, Marketing, Strategy) 내장
- 실제 데모 시 `.env`에서 `DEV_MODE=false`로 변경

### v0.1.3 — JavaScript Alert 연동

- `mro_mock.html`의 `submitApproval()` 함수에 `alert()` 추가
  - 결재 상신 클릭 시 JavaScript Alert 창 표시 후 CSS 모달 순서로 진행
- `main.py` RPA 로직에 Dialog 이벤트 핸들러 등록
  - `page.on("dialog", lambda dialog: asyncio.ensure_future(dialog.accept()))`
  - `#btnSubmit` 클릭 **전에** 핸들러를 등록하여 Alert 자동 승인

---

## 파일 구조

```
backend/
├── data/
│   ├── it_rules.txt
│   ├── sales_rules.txt
│   ├── compliance_rules.txt
│   ├── hr_rules.txt
│   ├── marketing_rules.txt
│   └── strategy_rules.txt
├── static/
│   ├── mro_mock.html       # 데모용 사내 비품몰 페이지
│   └── mro_result.png      # RPA 완료 후 캡처 스크린샷 (런타임 생성)
├── main.py                 # FastAPI 서버 (퀴즈, MRO RPA, 비품몰)
├── requirements.txt
└── .env                    # GEMINI_API_KEY, SLACK_WEBHOOK_URL
```

## 주요 환경 변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `DEV_MODE` | ❌ | `true` 시 Gemini API 미호출, 목업 데이터 반환 (기본값: false) |
| `GEMINI_API_KEY` | ✅ | Gemini LLM + 임베딩 인증 키 |
| `SLACK_WEBHOOK_URL` | ❌ | MRO 완료 시 Slack 알림 (미설정 시 스킵) |
