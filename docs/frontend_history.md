\# iM 루키 에이전트 프론트엔드 구현 이력

\## 2026-04-03

\### v0.1.0 — 초기 프로젝트 구성

\- Vite + React + TypeScript 기반 프로젝트 생성

\- Electron, TailwindCSS v4, Zustand, Framer Motion, Axios, Lucide React 설치

\- `electron/main.cjs` — Electron 메인 프로세스 (창 관리, 트레이, 글로벌 단축키)

\- `electron/preload.cjs` — contextBridge를 통한 IPC 통신 (contextIsolation: true)

\- `src/store.ts` — Zustand 글로벌 상태 (부서, XP, 레벨, 키오스크 모드)

\### v0.1.1 — 3개 핵심 화면 구현

\- \*\*부서 선택 화면\*\* (`SelectionScreen.tsx`)

&#x20; - 6개 부서(IT, 영업, 준법감시, 인사, 마케팅, 전략기획) 카드 UI

&#x20; - 글래스모피즘 + 그라디언트 호버 효과

&#x20; - 선택 시 Zustand에 부서 저장 → 트레이로 숨기기

\- \*\*채팅 위젯\*\* (`ChatWidget.tsx`)

&#x20; - 캐릭터 아바타, 경험치(XP) 프로그레스 바

&#x20; - 업무 지시용 채팅 입력창

&#x20; - 비품 자동 신청(MRO) 버튼 (레벨 2 이상 활성화)

&#x20; - `/api/action/mro?department=` 호출

\- \*\*화면보호기 퀴즈\*\* (`ScreensaverQuiz.tsx`)

&#x20; - `/api/quiz?department=` 호출 (실패 시 목업 데이터 폴백)

&#x20; - 정답 시 +35 XP 애니메이션, 오답 시 다음 문제 자동 로드

&#x20; - 정답 후 2.5초 뒤 키오스크 해제 → 위젯 모드 복귀

\### v0.1.2 — ES Module / CommonJS 호환 수정

\- `package.json`에 `"type": "module"` 설정으로 인해 Electron `require()` 오류 발생

\- `electron/main.js` → `main.cjs`, `electron/preload.js` → `preload.cjs`로 변경

\- `package.json`의 `"main"` 엔트리 포인트 `electron/main.cjs`로 수정

\### v0.1.3 — 포트 충돌 및 URL 로딩 문제 해결

\- Vite 서버 포트가 5173에서 5174로 자동 변경되면서 Electron이 잘못된 포트에 접속하는 문제 발생

\- `vite.config.ts`에 `server.port: 5174`, `strictPort: true` 설정

\- `main.cjs`의 `startUrl`을 `http://localhost:5174`로 통일

\- `package.json`의 `wait-on tcp:5174`로 일치시킴

\- `isDev` 판별 로직을 `!app.isPackaged`로 변경하여 개발 환경 자동 감지

\### v0.1.4 — 키오스크 모드(F8) 흰색 화면 수정

\- \*\*원인\*\*: F8 → Electron `setFullScreen(true)` 실행 시 React가 아직 퀴즈 컴포넌트를 렌더링하기 전에 전체 화면 전환이 발생

\- \*\*해결\*\*: `enterKiosk()` 함수에서 IPC `kiosk-changed`를 \*\*먼저\*\* 전송하여 React 상태를 전환한 후, 200ms 딜레이를 두고 전체 화면 전환 실행

\- DevTools를 `detach` 모드로 열도록 변경 (별도 창)

\### v0.1.5 — 단축키 변경 (Ctrl+Shift+I → F8)

\- `Ctrl+Shift+I`는 Chrome DevTools 단축키와 충돌하여 동작하지 않음

\- 키오스크 진입: \*\*F8\*\*, 키오스크 종료: \*\*ESC\*\*로 변경

\- 10초 자동 타이머는 디버깅 편의를 위해 비활성화 (주석 처리)

\### v0.1.6 — 전체 UI 한국어화

\- 부서명: IT 부서, 영업 부서, 준법감시 부서, 인사 부서, 마케팅 부서, 전략기획 부서

\- 위젯 헤더: "iM 루키", "레벨 X · OO 부서 에이전트"

\- 경험치 바: "경험치 XX / 100"

\- 비품 버튼: "🔓 비품 자동 신청" / "🔒 레벨 2 달성 시 활성화"

\- 퀴즈 화면: "OO 부서 업무 지식 퀴즈", "+35 경험치!", "오답입니다. 다음 문제를 준비합니다..."

\- 입력창 플레이스홀더: "업무 지시를 입력하세요..."

\### v0.1.7 — 트레이 숨기기 기능 추가

\- 채팅 위젯 헤더 우측에 `—` (최소화) 버튼 추가

\- 클릭 시 `hide-to-tray` IPC 전송 → Electron에서 `mainWindow.hide()` 실행

\- `preload.cjs`에 `hideToTray` API 추가

\- `main.cjs`에 `hide-to-tray` IPC 핸들러 추가

\- 트레이 아이콘 클릭으로 위젯 재표시 (우측 하단 400x700)

\### v0.2.0 — Phase 4: 데모용 MRO 비품몰 페이지 (백엔드)

\- `backend/static/mro\_mock.html` 생성

&#x20; - 'iM그룹 사내 비품몰' 타이틀, 금융권 스타일 UI

&#x20; - 'A4용지 박스 (2,500매)' 상품 카드 (가격 ₩24,500)

&#x20; - `\[🛒 장바구니 담기]` 버튼 → 클릭 시 "✅ 장바구니에 담김"으로 변경 + 뱃지 표시

&#x20; - 우측 하단 `\[📋 결재 상신하기]` 버튼 (장바구니 담기 후 활성화)

&#x20; - 결재 상신 시 성공 모달 ("결재 라인으로 상신되었습니다") 표시

\- `backend/main.py` 수정

&#x20; - `FastAPI.StaticFiles` 마운트: `/static` → `backend/static/`

&#x20; - `GET /mro-mall` 엔드포인트 추가 → `mro\_mock.html` 서빙

\- 접속 URL: `http://localhost:8000/mro-mall`

\### v0.2.1 — Playwright 시각적 RPA 자동화 (`/api/action/mro`)

\- `requirements.txt`에 `playwright` 추가, `playwright install chromium` 실행

\- `/api/action/mro` 엔드포인트를 Playwright 기반으로 전면 교체

&#x20; - `headless=False` + `slow\_mo=300`: 사용자 화면에 브라우저 창이 직접 열림

&#x20; - 자동화 시퀀스:

&#x20;   1. `/mro-mall` 접속

&#x20;   2. `\[장바구니 담기]` 클릭 → 1초 대기

&#x20;   3. `\[결재 상신하기]` 클릭 → 1초 대기 (모달 표시)

&#x20;   4. 최종 완료 스크린샷 캡처 (`static/mro\_result.png`)

&#x20;   5. 브라우저 닫기

&#x20; - `MRORequest` 모델에 기본값 추가 (item\_name="A4용지 박스", quantity=1)

&#x20; - 완료 후 스크린샷 URL을 응답에 포함 (`/static/mro\_result.png`)

\### v0.3.0 — Electron 연동 + 3개 화면 라우팅 구조 구현

\- `electron/main.cjs` 신규 생성

&#x20; - `BrowserWindow` (420×650, frameless, transparent) 생성

&#x20; - 시스템 트레이 아이콘 + 컨텍스트 메뉴 (열기/종료)

&#x20; - `globalShortcut` F8 → 전체화면 전환 + React `/screensaver` 라우트 이동

&#x20; - `setBounds()` 기반 전체화면 전환 (`setFullScreen` 대신 — frame:false 환경 버그 우회)

&#x20; - 위젯 마지막 위치를 `userData/window-pos.json`에 저장, 재실행 시 복원

&#x20; - IPC 핸들러: `enter-screensaver`, `exit-screensaver`, `hide-to-tray`

\- `electron/preload.cjs` 신규 생성

&#x20; - `contextBridge`로 `electronAPI` 노출: `hideToTray`, `enterScreensaver`, `exitScreensaver`, `onGoScreensaver`, `offGoScreensaver`

\- `package.json` 수정

&#x20; - `"main": "electron/main.cjs"` 엔트리 등록

&#x20; - `"start"` 스크립트: `concurrently` + `wait-on tcp:5174` + `electron .`

\- `vite.config.js` — `server.port: 5174`, `strictPort: true` 고정

\- `src/store.js` — Zustand 전역 상태 (department, departmentLocked, xp, level)

\- `src/App.jsx` — HashRouter 기반 라우팅 + IdleWatcher (10분 무입력 시 `/screensaver`)

&#x20; - `GuardedSelection`: 부서 선택 완료 후 `/` 재진입 시 `/tray`로 리다이렉트

&#x20; - F8 IPC(`go-screensaver`) 수신 → `navigate('/screensaver')`

\- `src/components/SelectionScreen.jsx` — 6개 부서 카드 + 캐릭터 이미지

&#x20; - 단디(IT·Sales) / 똑디(HR·Compliance) / 우디(Marketing) 매핑

&#x20; - 캐릭터 이미지: `resource/character_images/` → `frontend/public/` 복사

\- `src/components/ChatWidget.jsx` — 트레이 위젯 채팅 UI

&#x20; - 헤더: "iM 루키 / <부서명> 부서" + 캐릭터 이미지 + 트레이 숨기기(—) 버튼

&#x20; - 헤더 `-webkit-app-region: drag` — frameless 창 드래그 이동

&#x20; - XP 바 (Lv. / 경험치 X/100)

&#x20; - MRO 버튼: 레벨 2 미만 잠금, 레벨 2 이상 활성화

&#x20; - Levenshtein 퍼지 매칭으로 MRO 의도 감지

\- `src/components/ScreensaverQuiz.jsx` — 전체화면 퀴즈 UI

&#x20; - 화면 진입 시 1회 퀴즈 로드 (자동 반복 없음)

&#x20; - 정답 시 +35 XP + 2.5초 후 자동으로 위젯 복귀

&#x20; - 오답 시 결과 표시 후 ESC로 수동 복귀

&#x20; - fetch 3초 타임아웃 + 폴백 목업 퀴즈

&#x20; - ESC 키 이벤트로 `exitScreensaver()` 호출

\### v0.2.2 — 트레이 위젯 채팅 UI 구현 (`App.jsx`)

\- 기존 Vite 기본 템플릿을 트레이 위젯 채팅 UI로 전면 교체

\- 글래스모피즘 스타일 위젯 카드 (380×600px, `backdrop-filter: blur(20px)`, Deep Blue + Purple)

\- 채팅 말풍선 UI: 봇(좌)/유저(우) 구분, 봇 아바타, 자동 스크롤

\- MRO 주문 의도 감지 → `/api/action/mro` 호출 → 완료 후 결과 표시:

&#x20; - 로딩 중: "잠깐만요, 지금 바로 주문 처리할게요! 🤖" + 점 깜빡임 애니메이션

&#x20; - 완료 시: "부장님, A4용지 기안 올려두었습니다!" + 스크린샷 이미지 인라인 표시

\- Enter 키 전송, RPA 진행 중 입력/버튼 비활성화

\### v0.2.3 — MRO 트리거 퍼지 매칭 적용

\- 정규식 단순 매칭(`/a4용지\s*주문/i`)을 Levenshtein 편집 거리 기반 퍼지 매칭으로 교체

\- `levenshtein(a, b)`: 두 문자열 간 편집 거리 계산 (DP)

\- `containsFuzzy(text, keyword, maxDist)`: 슬라이딩 윈도우로 부분 문자열과 키워드 비교

\- `isMROIntent(text)`: 아이템 감지(편집 거리 ≤ 2) AND 행동 감지(주문/신청/구매/사줘/사와/올려/기안/발주/구해) 조합

\- 통과 예시: "A4용기 주문해줘", "a4졍지 신청해줘", "A4 기안 올려줘" 등 오타·유사 표현 허용

\---

\## 파일 구조

```

backend/                         # FastAPI 백엔드 (C:\\apps\\im-rookie-project\\backend)

├── data/                        # 부서별 RAG 규정 데이터

│   ├── it\_rules.txt

│   ├── sales\_rules.txt

│   ├── compliance\_rules.txt

│   ├── hr\_rules.txt

│   └── marketing\_rules.txt

├── static/

│   └── mro\_mock.html            # 데모용 사내 비품몰 페이지

├── main.py                      # FastAPI 서버 (퀴즈, MRO, 비품몰)

├── requirements.txt

└── .env

frontend/                        # Electron + React 프론트엔드

├── electron/

│   ├── main.cjs                 # Electron 메인 프로세스

│   └── preload.cjs              # IPC 브릿지 (contextIsolation)

├── public/

│   └── avatar.png               # 캐릭터 아바타 이미지

├── src/

│   ├── components/

│   │   ├── SelectionScreen.tsx   # 부서 선택 화면

│   │   ├── ChatWidget.tsx        # 채팅 위젯

│   │   └── ScreensaverQuiz.tsx   # 화면보호기 퀴즈

│   ├── App.tsx                  # 라우팅 및 IPC 리스너

│   ├── store.ts                 # Zustand 상태 관리

│   ├── main.tsx                 # React 엔트리포인트

│   └── index.css                # TailwindCSS 임포트

├── index.html

├── package.json

├── vite.config.ts

└── tsconfig.json

```



