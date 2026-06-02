# Reflection — Scribble Assignment

## What the starter already provided

The scaffold shipped as a working brownfield project with:

- **Full monorepo structure**: `backend/` (Express + TypeScript + ES modules) and `frontend/` (React 18 + Vite + TypeScript). Both with `tsx` dev servers and Vitest configured.
- **In-memory room API**: Three endpoints — `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`. Room creation, joining, and fetching worked end-to-end with participant tracking.
- **Frontend routing and pages**: Six routes mapped to page components (`/`, `/create-room`, `/join-room`, `/lobby`, `/game`, `*` → `/`). A custom `RoomStore` class (Context + `useSyncExternalStore`) managed state.
- **Seed data**: Five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`).
- **Placeholder components**: `GuessForm`, `Scoreboard`, `ResultPanel`, `GamePage` canvas area — all hardcoded text, no logic.
- **Deliberate bug**: `API_BASE_URL` ended with `/bug` (intentional lab flaw).
- **CI and PR templates**: GitHub workflows for build, test, lint, and a PR template with role checkboxes.

What was **notably absent**: any gameplay state machine, drawer assignment, secret word management, drawing canvas logic, guess submission, scoring, round lifecycle, polling (lobby refresh was manual), or room cleanup. The `Room.status` was always `"lobby"`.

## What I added and why

**1. Room Setup & Lobby** — Added `hostId` to Room model, player name validation (Zod, trim, reject empty), auto-polling in lobby (2s interval), host-only start gating (2-player minimum), host badge in UI, stale room cleanup (30-min timeout). *Why: prerequisites for all multiplayer gameplay.*

**2. First Round Drawer Flow** — Created `Game` entity with `status` (`playing`/`round_end`), `Round` type, and `gameStore.ts` with `createGame()`/`endRound()`/`getGame()`. Drawer = host (first player). Deterministic word selection via `hash(roomCode + roundNumber)`. 60s round timer. Frontend `GamePage` with drawer banner, word card (drawer-only visibility), countdown timer. Lobby auto-redirects to game on start. *Why: establishes the three-state machine and core round mechanics.*

**3. Guess Submission & Scoring** — `POST /games/:code/guess` with validation (non-drawer check, trim, case-insensitive comparison, empty rejection, duplicate correct blocker). 100 points per correct guess. `DrawingCanvas` component with mouse/touch drawing, 2s sync interval, clear canvas. `GuessHistory` and `Scoreboard` components rendering live from poll data. *Why: delivers the actual gameplay interaction — without guesses and drawing there is no game.*

**4. Round End & Restart Flow** — Extended `Game` with `resultExpiresAt` (60s auto-timeout). Host disconnect detection (25s grace). `POST /games/:code/restart` (host-only, game must be in `round_end`). Result expiry countdown in UI. Restart button visible only to host. On restart: all round data cleared, players preserved, Room fields cleaned. Auto-redirect to lobby when `round: null`. *Why: completes the game loop — players see results, host restarts, rooms don't get stuck.*

**5. Spec Kit artifacts** — Four feature rounds, each preceded by: discovery → specification → clarification → plan → tasks → implement → validate. Every commit traces to a spec phase.

## Architecture Summary

The application follows a **two-tier monorepo architecture** with HTTP polling as the sole sync mechanism:

```
┌─────────────────────┐         HTTP (REST)         ┌─────────────────────┐
│    Frontend (Vite)  │ ◄─────── polling ────────── │   Backend (Express) │
│   React 18 + TS     │       (no WebSockets)       │   Node.js + TS      │
│                     │                              │                     │
│  ┌───────────────┐  │   GET  /rooms/:code          │  ┌───────────────┐  │
│  │ RoomStore      │──┼───────────────────────────► │  │ roomStore.ts  │  │
│  │ (Context+      │  │                              │  │ (Map<string,  │  │
│  │  useSync-      │  │   POST /rooms/:code/start    │  │  Room>)       │  │
│  │  ExternalStore)│──┼───────────────────────────► │  └───────────────┘  │
│  └───────┬───────┘  │                              │                     │
│          │           │   GET  /games/:code/round    │  ┌───────────────┐  │
│          │           │◄─────────────────────────────│──│ gameStore.ts  │  │
│          │           │                              │  │ (Map<string,  │  │
│  ┌───────┴───────┐  │   POST /games/:code/guess    │  │  Game>)       │  │
│  │ Pages         │──┼───────────────────────────► │  └───────────────┘  │
│  │ (Start,       │  │                              │                     │
│  │  Create,Join, │  │   POST /games/:code/          │  ┌───────────────┐  │
│  │  Lobby,Game)  │──┼ canvas/sync                  │──│ canvasStore.ts│  │
│  └───────┬───────┘  │◄─────────────────────────────│  │ (Map<string,  │  │
│          │           │                              │  │  CanvasState) │  │
│  ┌───────┴───────┐  │   POST /games/:code/restart   │  └───────────────┘  │
│  │ Components    │──┼───────────────────────────► │                     │
│  │ (DrawingCanvas│  │                              │  All state is      │
│  │  GuessForm,   │  │                              │  in-memory only    │
│  │  Scoreboard,  │  │                              │  (no database)     │
│  │  GuessHistory)│  │                              │                     │
│  └───────────────┘  │                              └─────────────────────┘
```

**State flow**: The frontend never holds authoritative state — it polls the backend every 2s. The `RoomStore` (Context + `useSyncExternalStore`) receives snapshots and notifies React via the subscribe pattern. Each backend service owns an in-memory `Map` (rooms, games, canvas states). `Zod` validates all request payloads at the API boundary before reaching services.

**Route structure**: Three Express routers mounted under `/api`:
- `/rooms` — create, join, fetch, start game
- `/games` — round poll, restart
- `/games` (same prefix) — guess submit, canvas sync

**Frontend state machine**: Derived from `room.gameStartedAt` (null → lobby, set → game) and `round.status` (`"playing"` → gameplay, `"round_end"` → results, `null` → lobby). The `LobbyPage` polls the room endpoint; the `GamePage` polls the round endpoint. Navigation is triggered by state changes in poll responses (e.g., `round: null` → redirect to `/lobby`).

## How Spec Kit helped

1. **Structured ambiguity resolution**: The clarification phase forced explicit Q&A (e.g., "60s result timeout", "25s host disconnect grace", "8-player max") — these answers directly shaped the data model and API contracts.

2. **Prevented scope creep**: The constitution explicitly forbade WebSockets, databases, auth, multiple rounds. Every decision was checked against these gates.

3. **Enforced spec-first workflow**: Never wrote code without knowing exactly what it should do and how to test it. Quickstart steps made validation concrete ("open two browsers, wait for timer, verify both see same scores").

4. **Traceability**: Every commit message references the spec phase. Tasks map requirements to exact file paths. The PR is reviewable because each artifact traces to code.

5. **Parallelization awareness**: Tasks files flagged what could run in parallel (US1 backend + frontend) vs. sequential (US2 blocks on US1). Exposed the critical path.

6. **Catch gaps early**: Discovery documented 10 specific starter gaps. Without structured gap analysis, I would have started coding on incomplete assumptions.

7. **Data model as source of truth**: `data-model.md` defined entities before code. Adding `resultExpiresAt` meant updating the model first, then propagating — preventing drift.
