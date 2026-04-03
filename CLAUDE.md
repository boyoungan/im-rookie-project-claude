# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**iM루키 (iM Rookie)** is a hackathon prototype for an internal company AI agent that handles administrative tasks. It has two features:
1. **Quiz Generator** — LLM-powered multiple-choice quizzes from company policy documents (RAG with Gemini + ChromaDB)
2. **MRO Automation** — RPA-based office supply ordering via Playwright that visually automates a mock internal procurement portal

The target architecture is an **Electron desktop app** with a tray widget and screensaver views. The backend is complete; the frontend Electron/React implementation is **in progress** (see `docs/frontend_history.md` for detailed version history).


## Approach
Think before acting. Read existing files before writing code.
Be concise in output but thorough in reasoning.
Prefer editing over rewriting whole files.
Do not re-read files you have already read unless the file may have changed.
Test your code before declaring done.
No sycophantic openers or closing fluff.
Keep solutions simple and direct.
User instructions always override this file.

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev       # Start Vite dev server (http://localhost:5174, strictPort)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

> Vite is configured with `server.port: 5174` and `strictPort: true` to prevent port conflicts with Electron's `wait-on` check.

### Backend (from `backend/`)
```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at `http://localhost:8000/docs` (FastAPI Swagger UI).

## Architecture

### Request Flow
```
React (frontend:5173) → Axios → FastAPI (backend:8000)
                                    ├── GET /api/quiz?department=IT
                                    │     └── ChromaDB similarity search → Gemini LLM → JSON quiz
                                    ├── POST /api/action/mro
                                    │     └── Playwright (headless=False) → /mro-mall → screenshot → Slack webhook
                                    ├── GET /mro-mall  (serves backend/static/mro_mock.html)
                                    └── /static/       (serves backend/static/)
```

### Backend (`backend/main.py`)
Single-file FastAPI app. On startup, `init_rag()` reads all `.txt` files from `backend/data/` and indexes them into an in-memory ChromaDB vectorstore using Gemini embeddings. The vectorstore is filtered by `department` metadata at query time.

- LLM: `gemini-1.5-flash` via LangChain, temperature 0.7
- Embeddings: `models/embedding-001` (Google Generative AI)
- MRO automation opens a **visible** browser (`headless=False`, `slow_mo=300ms`) to demo the RPA visually

### Frontend (`frontend/src/`)

The planned file structure (per `docs/frontend_history.md`) — **not yet present in the repo**:

```
frontend/
├── electron/
│   ├── main.cjs        # Electron main process (window, tray, global shortcuts)
│   └── preload.cjs     # contextBridge IPC (contextIsolation: true)
├── src/
│   ├── components/
│   │   ├── SelectionScreen.tsx  # Department selection (5 cards)
│   │   ├── ChatWidget.tsx       # Tray widget: avatar, XP bar, MRO button
│   │   └── ScreensaverQuiz.tsx  # Fullscreen quiz; +35 XP on correct answer
│   ├── App.tsx         # React Router routes + IPC listeners
│   ├── store.ts        # Zustand: department, XP, level, kiosk mode
│   └── main.tsx        # React entry point
```

Currently only the default Vite template (`App.jsx`) exists. Electron, TypeScript, and all three components have not been scaffolded yet.

**Routing structure:**
- `/` — Department selection screen (IT, 영업, 준법감시, 인사, 마케팅)
- `/tray` — Chat widget with XP bar; MRO button unlocks at level 2
- `/screensaver` — Fullscreen quiz mode (enter: **F8**, exit: **ESC**)

**Electron IPC events (planned):**
- `kiosk-changed` — Sent first before `setFullScreen(true)` to avoid white screen (200ms delay after React state update)
- `hide-to-tray` — Hides main window; tray icon click restores it
- `isDev` — Detected via `!app.isPackaged` (not env var)

### Knowledge Base (`backend/data/`)
Five `.txt` files with Korean company policies mapped to departments: `IT`, `HR`, `Sales`, `Compliance`, `Marketing`. Adding a new department requires creating a new `<dept>_rules.txt` and adding an entry to `file_dept_map` in `main.py`.

## Environment Setup

Create `backend/.env`:
```env
GEMINI_API_KEY="your_key_here"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."  # Optional
```

`SLACK_WEBHOOK_URL` is optional — the backend skips the Slack POST if the value is the placeholder string `"your_slack_webhook_here"`.

## Key Design Decisions

- **In-memory ChromaDB**: The vectorstore is rebuilt on every server restart from the `.txt` files. There is no persistent vector DB.
- **Glassmorphism UI**: Design theme uses `backdrop-filter: blur()`, semi-transparent backgrounds, Deep Blue + purple accent palette. Korean UI throughout (department names, labels, quiz text).
- **Electron ESM/CJS split**: `package.json` uses `"type": "module"`, so Electron files must use `.cjs` extension (`main.cjs`, `preload.cjs`) to avoid `require()` errors.
- **F8 / ESC shortcuts**: F8 enters kiosk (screensaver) mode, ESC exits. `Ctrl+Shift+I` was avoided as it conflicts with Chrome DevTools. DevTools open in `detach` mode.
- **No tests**: Manual verification via Swagger UI at `/docs`. Screenshots captured by Playwright serve as demo artifacts.
