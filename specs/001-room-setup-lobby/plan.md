# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the complete Room Setup & Lobby flow: host-guest room creation/joining,
auto-polling lobby participant list, host-only start with minimum 2 players, input
validation for empty/invalid codes and names, and room isolation.

## Technical Context

**Language/Version**: TypeScript 5.6.3, Node.js 18+, React 18.3

**Primary Dependencies**: Express 4.21 (backend), Zod 3.23 (validation), React 18.3 +
Vite 5.4 (frontend), Vitest 3.1 (testing)

**Storage**: In-memory Map<code, Room> via roomStore.ts — no databases

**Testing**: Vitest (backend + frontend), unit tests for schemas and store,
integration tests for API endpoints

**Target Platform**: Node.js server (backend), modern browser (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Poll at ~2s intervals; lobby participant list updates
within 3s of another player joining; page transitions within 1s

**Constraints**: HTTP polling only; no WebSockets, databases, auth, or state
libraries beyond existing RoomStore pattern

**Scale/Scope**: Dozens of simultaneous rooms; 2–8 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **TypeScript Strictness Gate** — All new code must be fully typed; `any` forbidden.
2. **Architecture Gate** — Backend uses api/services/models layering; frontend uses
   functional React + RoomStore; Zod validates all payloads.
3. **HTTP-Only Sync Gate** — Lobby polling via HTTP GET `/rooms/:code`; no WebSockets.
4. **In-Memory Gate** — Room state in Map; no databases; no auth or sessions.
5. **Deterministic Logic Gate** — Host assignment rule: creator is host; start
   requires ≥2 players.
6. **Brownfield Gate** — Inspector existing patterns before coding; extend rather
   than rewrite.

All gates pass for this feature. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Option 2: Web application (frontend + backend)
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts        # Update create/join/get endpoints with validation + host logic
│   │   └── schemas.ts      # Update Zod schemas for host, playerName, etc.
│   ├── models/
│   │   └── game.ts         # Add host field to Room, rename ParticipantRole if needed
│   ├── services/
│   │   └── roomStore.ts    # Add host tracking, join validation, cleanup, poll endpoint
│   └── app.ts              # No changes needed

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx      # Add auto-polling (setInterval), host-only start button
│   │   ├── CreateRoomPage.tsx # Add playerName validation (trim, reject empty)
│   │   └── JoinRoomPage.tsx   # Add roomCode + playerName validation
│   ├── state/
│   │   └── roomStore.ts       # Add polling interval management, host state
│   ├── services/
│   │   └── api.ts             # No changes needed (endpoints already exist)
│   └── styles/
│       └── app.css            # Add start button, error, connection indicator styles
```

**Structure Decision**: Web application (Option 2) — backend with api/services/models
and frontend with pages/state/services. This matches the existing monorepo layout.

## Complexity Tracking

> No Constitution violations. All gates pass.
