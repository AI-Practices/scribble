# Implementation Plan: First Round Drawer Assignment

**Branch**: `002-first-round-drawer` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-first-round-drawer/spec.md`

## Summary

Implement the first round of the Scribble drawing game: when the host starts the game from the lobby, the room transitions to a Playing state, the host is designated as the drawer (visible to all players), a secret word is deterministically selected from the starter list and shown only to the drawer, and a 60-second timer manages the round lifecycle. Round state is polled via a dedicated endpoint.

## Technical Context

**Language/Version**: TypeScript 5.6.3, Node.js 18+, React 18.3

**Primary Dependencies**: Express 4.21 (backend), Zod 3.23 (validation), React 18.3 + Vite 5.4 (frontend), Vitest 3.1 (testing)

**Storage**: In-memory `Map<string, Game>` alongside existing `Map<string, Room>` in `roomStore.ts` — no databases

**Testing**: Vitest (backend + frontend), unit tests for game/round store, integration tests for new API endpoints

**Target Platform**: Node.js server (backend), modern browser (frontend)

**Project Type**: Web application (frontend + backend monorepo)

**Performance Goals**: Round state delivered within 2s via polling; drawer identity visible to all within 2s of round start

**Constraints**: HTTP polling only; no WebSockets, databases, or auth. Round polling must NOT leak the secret word to non-drawers. Game can only start with ≥2 players. Only host can start.

**Scale/Scope**: Dozens of simultaneous games; 2–8 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **TypeScript Strictness Gate** — No `any` types; all new code fully typed.
2. **Architecture Gate** — Backend layering (api/services/models), functional React, Zod validation, RoomStore state only.
3. **HTTP-Only Sync Gate** — No WebSockets or real-time push protocols.
4. **In-Memory Gate** — No databases, auth, or sessions.
5. **Deterministic Logic Gate** — Game rules must be predictable and edge-case-handled.
6. **Brownfield Gate** — No rewrites; inspect before changing.

All gates pass for this feature. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-first-round-drawer/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── room-api.md      # API endpoint contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts        # Add POST /api/rooms/:code/start endpoint
│   │   ├── games.ts        # New: GET /api/games/:code/round endpoint
│   │   └── schemas.ts      # Add start-game Zod schemas
│   ├── models/
│   │   └── game.ts         # Add Game, Round interfaces, GameStatus type
│   ├── services/
│   │   ├── roomStore.ts    # Add markGameStarted(), getGame(), toRoundSnapshot()
│   │   └── gameStore.ts    # New: Game store (Map<string, Game>)
│   └── app.ts              # Mount games router

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx   # Wire "Start Game" button to POST /api/rooms/:code/start
│   │   └── GamePage.tsx    # Add round polling via GET /api/games/:code/round
│   ├── state/
│   │   └── roomStore.ts    # Add round state, game polling methods
│   ├── services/
│   │   └── api.ts          # Add startGame(), fetchRound() API calls
│   └── styles/
│       └── app.css         # Drawer label, secret word display, timer styles
```

**Structure Decision**: Web application (Option 2) — backend with api/services/models and frontend with pages/state/services. This matches the existing monorepo layout.

## Implementation Phases

### Phase 1 — Backend: Game Store & API Endpoints

1. Add `Game`, `Round` interfaces and `GameStatus` type to `backend/src/models/game.ts`
2. Create `backend/src/services/gameStore.ts` with in-memory `Map<string, Game>`, `createGame()`, `getGame()` methods
3. Update `backend/src/api/rooms.ts` — add `POST /api/rooms/:code/start` (host-only, ≥2 players, state transition); calls `markGameStarted()` on `roomStore` to stamp `drawerId`/`drawerName`/`gameStartedAt` on the Room
4. Create `backend/src/api/games.ts` — add `GET /api/games/:code/round` (polling, word filtered by drawer identity)
5. Update Zod schemas in `backend/src/api/schemas.ts`
6. Mount games router in `backend/src/app.ts`

### Phase 2 — Frontend: Game Page & Round Polling

1. Update `frontend/src/services/api.ts` — add `startGame()`, `fetchRound()`
2. Update `frontend/src/state/roomStore.ts` — add round state, game polling
3. Update `frontend/src/pages/LobbyPage.tsx` — wire "Start Game" to API call (not just client-side nav)
4. Update `frontend/src/pages/GamePage.tsx` — implement round polling, drawer identification, secret word display, timer display
5. Add styles for drawer label, word display, timer

## Complexity Tracking

> No Constitution violations. All gates pass.
