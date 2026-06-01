# Discovery Notes — Scribble Assignment

## 1. Summary

The project is a multiplayer drawing-game monorepo with an **Express + TypeScript backend** (in-memory, no DB) and a **React 18 + Vite + TypeScript frontend**, both configured as ES modules. Five starter words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`) are seeded. The backend exposes three REST endpoints:

- `POST /rooms` — create a room (returns participant ID + room snapshot)
- `POST /rooms/:code/join` — join an existing room
- `GET /rooms/:code` — fetch room snapshot

On the frontend, six pages are wired (`/`, `/create-room`, `/join-room`, `/lobby`, `/game`, `*` → `/`) with a custom `RoomStore` class (Context + `useSyncExternalStore`) for state. CI pipelines and PR-lint workflows are set up. A deliberate bug exists in `frontend/src/services/api.ts` (`API_BASE_URL` ends with `/bug`).

---

## 2. Incomplete or Inconsistent Behaviors

### 2.1 Gameplay State Is Entirely Missing

- `Room.status` is **only ever `"lobby"`** — no `"playing"` or `"finished"` states exist (`backend/src/models/game.ts:13`).
- **No round/word assignment**, **no drawer/guesser role assignment at the service layer**, **no scoring**, **no turn tracking** — nothing beyond participant membership.
- The `"Start Game"` button on `LobbyPage` simply calls `navigate('/game')` without backend interaction (`frontend/src/pages/LobbyPage.tsx:89`).

### 2.2 Placeholder Components with Dead Code

- **`GuessForm`** (`frontend/src/components/GuessForm.tsx`): has `handleSubmit` that only calls `preventDefault()` — no API call, no guess storage, no validation.
- **`Scoreboard`** (`frontend/src/components/Scoreboard.tsx`): hardcoded "Waiting for players…" with no logic.
- **`ResultPanel`** (`frontend/src/components/ResultPanel.tsx`): hardcoded "Game activity and guesses will appear here."
- **`GamePage`** (`frontend/src/pages/GamePage.tsx`): canvas area shows "Waiting for drawer…" — no actual drawing surface.

### 2.3 No HTTP Polling (All Refresh Is Manual)

- `LobbyPage` refreshes only via a "Refresh Room" button. The `RoomStore.fetchRoom()` method exists but is never called automatically.
- `GamePage` has no polling loop for game-state updates.
- This **violates the "All sync must use HTTP polling" constraint** in `AGENTS.md` — the intention is polling, but it is unimplemented.

### 2.4 Deliberate API URL Bug

- `API_BASE_URL = 'http://localhost:3001/bug'` in `frontend/src/services/api.ts:5` — the `/bug` suffix makes every request hit a 404.
- This is an intentional lab flaw (learners must fix to `http://localhost:3001`).

### 2.5 `useEffect` in RoomStoreProvider Is a No-op

- `RoomStoreProvider` has `useEffect(() => {}, [undefined])` — the dependency array literal `[undefined]` never changes, so the effect runs only once and does nothing. Likely a placeholder for polling (`frontend/src/state/roomStore.ts`).

### 2.6 Room Code Collision Not Handled

- `createRoom` generates 4-char codes randomly but **does not check for collisions** with existing rooms (though probability is low given the alphabet size) (`backend/src/services/roomStore.ts`).

### 2.7 Room Cleanup Not Implemented

- Rooms live in memory indefinitely; no mechanism removes inactive/abandoned rooms despite `AGENTS.md` stating "explicitly remove inactive rooms" (`backend/src/services/roomStore.ts`).

### 2.8 `toRoomSnapshot` Has an Unused Parameter

- `viewerParticipantId` is accepted but never used (`backend/src/services/roomStore.ts:93`). Intended for drawer-word visibility (hide word from guessers), but not wired.

### 2.9 Backend Tests Are Sparse

- Only `roomStore.test.ts` (2 tests) and `schemas.test.ts` (2 tests) exist. No route/integration tests. No tests for error cases (duplicate join, missing participant).

### 2.10 Frontend React Import Inconsistency

- `GamePage.tsx` imports `useEffect` but not `useState` — and uses neither.
- `RoomCodeBadge.tsx` uses `React` namespace (`React.FC`) but the project uses `jsx: react-jsx` (no `import React` needed).

---

## 3. Architectural Assumptions & Relevant Files

| Assumption | Detail | Key Files |
|---|---|---|
| **In-memory only** | All state lives in a `Map<string, Room>`; no database. Rooms lost on restart. | `backend/src/services/roomStore.ts` |
| **No WebSockets** | All real-time sync must use HTTP polling (per AGENTS.md). | `frontend/src/state/roomStore.ts`, `frontend/src/services/api.ts` |
| **No Authentication** | Participants are identified by a client-generated UUID; no sessions, JWT, or OAuth. | `backend/src/services/roomStore.ts:48-49` |
| **Zod validation at boundary** | All request payloads and params validated via Zod before reaching services. | `backend/src/api/schemas.ts`, `backend/src/api/router.ts` |
| **Room code alphabet** | 31 chars (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) — excludes I,O,0,1 for readability. | `backend/src/services/roomStore.ts:10` |
| **Participant identity** | `participantId` (UUID) is the sole auth token — passed as query param `?participantId=` on fetch. | `backend/src/api/schemas.ts:18-20` |
| **State management pattern** | Custom `RoomStore` class + React Context + `useSyncExternalStore` (not Zustand, not Redux). | `frontend/src/state/roomStore.ts` |
| **Component-per-page routing** | Each route maps to a dedicated page component under `src/pages/`. | `frontend/src/routes/index.tsx` |
| **CSS custom properties** | Global styling via `app.css` with CSS variables; no CSS-in-JS, no Tailwind. | `frontend/src/styles/app.css` |
| **ES modules throughout** | Both packages use `"type": "module"` in package.json. | `backend/package.json`, `frontend/package.json` |
| **Node 24.13.0** | Required via `.nvmrc`. | `.nvmrc` |
