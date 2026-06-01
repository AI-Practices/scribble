# Implementation Plan: Round End & Restart Flow

**Branch**: `004-round-end-restart` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-round-end-restart/spec.md`

## Summary

Display the correct word, final scores, and full guess history to all players when a round ends. On host restart, transition all players back to the lobby with players preserved and all round-specific state cleared. If the host disconnects during result state, auto-return to lobby after a short timeout. Result state persists for 60s before auto-timeout. Max 8 players per room.

## Technical Context

**Language/Version**: TypeScript 5.6 (backend + frontend)

**Primary Dependencies**: Express 4 (backend), React 18 (frontend), Zod (validation), Vitest (testing)

**Storage**: In-memory only (no databases)

**Testing**: Vitest (backend + frontend)

**Target Platform**: Web (Node.js + browser via Vite)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Result display within 2s of round end, lobby transition within 3s of restart

**Constraints**: HTTP polling only (no WebSockets), in-memory state, max 8 players, 60s result state timeout, host-only restart trigger

**Scale/Scope**: Up to 8 players per room, single round at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **TypeScript Strictness Gate** — New result state, restart logic, and lobby transition handlers fully typed with no `any`.
2. **Architecture Gate** — Result display and restart follow existing api/services/models layering. Zod validates restart request payloads. RoomStore pattern preserved.
3. **HTTP-Only Sync Gate** — Results displayed via extended GET /api/games/:code/round polling. Restart via new POST endpoint. No WebSockets.
4. **In-Memory Gate** — Round results stored in-memory on Game entity. No databases, auth, or sessions.
5. **Deterministic Logic Gate** — Score display and guess history are deterministic outputs. Room settings preserved on restart are clearly bounded.
6. **Brownfield Gate** — Extends existing Game/Room data models and API contracts. No rewrites.

All gates pass. No constitution violations expected.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-end-restart/
├── plan.md              # This file
├── research.md          # Phase 0 — gap analysis
├── data-model.md        # Phase 1 — extended entities
├── quickstart.md        # Phase 1 — verification steps
├── contracts/           # Phase 1 — API endpoint specs
│   └── room-api.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Extended: result state, scores persisted
│   ├── services/
│   │   └── gameService.ts       # Extended: end round, restart game
│   └── api/
│       ├── routes/
│       │   └── gameRoutes.ts    # Extended: restart endpoint
│       └── handlers/
│           └── roundHandler.ts  # Extended: result state response
frontend/
├── src/
│   ├── components/
│   │   ├── RoundResult.tsx      # NEW: round result display
│   │   └── Lobby.tsx           # Modified: show results before lobby on restart
│   ├── pages/
│   │   └── GameRoom.tsx        # Modified: result state view
│   └── state/
│       └── roomStore.ts        # Extended: result state handling
```

**Structure Decision**: Web application (frontend + backend) — extending existing structure from prior specs.

## Complexity Tracking

No constitution violations expected. Leave blank.
