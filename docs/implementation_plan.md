# iM루키 (iM Rookie) Hackathon Demo Implementation Plan

## Goal Description
아이디어 해커톤 경진대회 출품용 사내 맞춤형 AI 서무 에이전트 'iM루키(iM Rookie)' 프로토타입의 아키텍처 및 구현 계획입니다. 본 데모는 망분리 환경을 고려하지 않고 빠른 시연과 시각적으로 멋진 결과물을 도출하기 위해 외부 클라우드 API(Gemini, Slack Webhook)를 적극 활용합니다.

## Architecture Diagram
```mermaid
graph TD
    subgraph Frontend [Frontend: Electron + React]
        A[Tray Widget UI\n(MRO 신청 팝업)]
        B[Screensaver UI\n(사내 퀴즈 화면)]
        C[Electron Main Process\n(Window Management & IPC)]
        A <-->|IPC| C
        B <-->|IPC| C
    end

    subgraph Backend [Backend: Python FastAPI]
        D[FastAPI REST Server]
        E[Quiz Generator Route\n(LangChain + Gemini)]
        F[MRO Mock Service Route\n(Slack Alert)]
        D --> E
        D --> F
    end

    subgraph External APIs [Cloud APIs]
        G[Gemini API]
        H[Slack Webhook API]
    end

    C <-->|HTTP JSON Requests| D
    E <-->|Prompting / Completion| G
    F -->|POST Message| H
```

## Proposed Changes

### 1. Repository Structure (Mono-repo)
프론트엔드와 백엔드를 하나의 메인 프로젝트 폴더 내에서 관리합니다.
```text
im-rookie-demo/
├── frontend/ (Electron + Vite + React)
└── backend/  (Python + FastAPI)
```

### 2. Frontend (Electron + React)
- **Framework**: 최신 Vite + React 보일러플레이트 기반에서 Electron IPC 통신 결합.
- **스타일링 (Glassmorphism 적용)**: 
  - 반투명 배경(`backdrop-filter: blur()`), 은은한 그림자 및 부드러운 그라데이션을 활용하여 트렌디하고 몰입감 있는 Glassmorphism 메인 테마 적용.
- **앱 뷰(Views) 형태**:
  - 트레이(Tray) 위젯: 글래스모피즘 스타일의 팝업 UI (서무봇 대화 채널 및 빠른 액션).
  - 화면보호기(Screensaver): 유휴 시 전체 화면으로 동작하며 아름다운 테마와 함께 퀴즈 렌더링.

### 3. Backend (Python FastAPI)
- **Framework**: FastAPI (가볍고 비동기 처리 성능이 우수함).
- **LLM 연동**: `LangChain`을 사용하여 **Gemini API**와 연동. 사내 규정이나 일반 상식 기반 퀴즈를 JSON 형태로 출력하도록 프롬프트 체이닝.
- **Slack 연동 목업**: 외부 연동 Mock API 엔드포인트 구현. Slack Webhook 메커니즘을 이용해 "MRO 비품 신청 완료" 메시지를 전송.

### Environment variables (.env) Structure
백엔드(`backend/`) 디렉터리에 생성될 환경 변수 구조입니다.

```env
# Server
PORT=8000
HOST=0.0.0.0

# LLM API
GEMINI_API_KEY="AIzaSyBdgd6l3dWG99Be9IH1Se_qjlQDgfuEhAM"

# Slack Webhook (MRO 신청 데모용)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XXXXXXXXXXXXXXXX"
```

## Setup Guides for Later
> [!TIP]
> **Slack Webhook 설정 안내 (코드 작성 전 준비사항):**
> 실제 슬랙 알림을 받기 위해서 Webhook URL이 필요합니다. 시간이 되실 때 준비해 주시면 좋습니다.
> 1. 웹 브라우저에서 [Slack Incoming Webhooks 가이드](https://api.slack.com/messaging/webhooks) 또는 알림을 받을 슬랙의 **앱 추가 > 수신 웹훅(Incoming WebHooks)**을 검색하여 설정합니다.
> 2. 메시지를 수신할 채널을 지정하고 발급된 **Webhook URL** (`https://hooks.slack.com/services/...`)을 복사해 둡니다.
> *(당장 만들기 번거로우신 경우 서버 콘솔에 로그로 찍히게 임시 처리가 가능합니다.)*

## Verification Plan
### Automated Tests
- FastAPI Swagger UI(`/docs`)에서 Gemini를 이용한 퀴즈 생성, 분리된 Slack Webhook 엔드포인트 수동 테스트.

### Manual Verification
- Electron 앱 실행 시 트레이 아이콘 동작 및 글래스모피즘 기반 위젯 화면 확인.
- 퀴즈 화면 전환 시 Gemini API 기반 결과가 시각적인 애니메이션과 함께 잘 나타나는지 확인.
- 위젯에서 "MRO 비품 신청" 실행 시 백엔드 단에서 성공 응답 및 슬랙 채널 발송 여부 관찰.
