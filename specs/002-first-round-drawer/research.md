# Research: First Round Drawer Assignment

## Technical Context

### Language & Runtime
- **Decision**: TypeScript 5.6.3 (Node.js 18+, React 18.3)
- **Rationale**: Existing project standard; all code is already TypeScript.
- **Alternatives considered**: None — locked by existing project setup.

### Primary Dependencies
- **Decision**: Express 4.21 (backend), Zod 3.23 (validation), React 18.3 + Vite 5.4 (frontend), Vitest 3.1 (testing)
- **Rationale**: All already present in the project and established via the Room Setup & Lobby feature.
- **Alternatives considered**: None — reuse existing stack.

### Storage
- **Decision**: In-memory `Map<string, Game>` alongside existing `Map<string, Room>` in `roomStore.ts`
- **Rationale**: Constitution mandates in-memory-only state. Game state derived from Room state on transition.
- **Alternatives considered**: Extending the Room model itself with game fields — rejected because it conflates lobby concerns with game concerns.

### Testing
- **Decision**: Vitest for backend (unit + integration) and frontend (unit). Existing test patterns from Room Setup.
- **Rationale**: Consistent with existing project testing infrastructure.
- **Alternatives considered**: None.

### Target Platform
- **Decision**: Node.js server (backend), modern browser (frontend)
- **Rationale**: Existing project targets.

### Project Type
- **Decision**: Web application (frontend + backend monorepo)
- **Rationale**: Existing project structure.

### Performance Goals
- **Decision**: Round state delivered within 2s via polling; drawer identity visible to all within 2s of round start.
- **Rationale**: Derived from spec SC-001 and SC-003. Matches existing 2s lobby polling cadence.
- **Alternatives considered**: Lower polling intervals (1s) — unnecessary for turn-based game; higher (3s+) — risks perceived lag.

### Constraints
- **Decision**: HTTP polling only; no WebSockets, databases, or auth. Round polling endpoint must NOT leak the secret word to non-drawers.
- **Rationale**: Non-negotiable constitution constraints (III. HTTP-Only Sync, IV. In-Memory State).
- **Alternatives considered**: None — constitution mandates.

### Scale/Scope
- **Decision**: Dozens of simultaneous rooms; 2–8 players per room.
- **Rationale**: Matches Room Setup & Lobby assumptions. Starter list of 5 words (existing `STARTER_WORDS` in `starterData.ts`).

## Architecture Decisions

### State Model
- **Decision**: 3-state model: Lobby → Playing (Round Active) → Round End. Game state stored in a new `Game` interface alongside `Room`.
- **Rationale**: Clarified in spec clarification session. The existing room remains in the room store; a game wrapper is created on lobby-to-playing transition.
- **Alternatives considered**: Extending `Room.status` with `"playing"` and `"finished"` — rejected to keep room lifespan concerns separate from game lifecycle.

### Round State Delivery
- **Decision**: Dedicated `GET /api/games/:code/round` endpoint polled at ~2s.
- **Rationale**: Clarified in spec. Keeps round concerns separate from room/lobby concerns. Drawer identity returned to all players; secret word returned only to drawer. Drawer is identified by matching `participantId` query param.
- **Alternatives considered**: Extending existing `GET /api/rooms/:code` response — rejected because the room endpoint should remain lightweight and focused on lobby state.

### Round Timer
- **Decision**: 60-second countdown. Timer starts on Playing state entry. Round ends automatically when timer expires.
- **Rationale**: Clarified in spec. Matches standard drawing game conventions (Skribbl.io, Pictionary).
- **Alternatives considered**: Event-driven end (all guessed) — can be added later as hybrid; timer-only for v1.

### Word Selection Determinism
- **Decision**: Word selected by hashing room code + round number against starter list index. E.g., `STARTER_WORDS[hash(roomCode + ":" + roundNumber) % STARTER_WORDS.length]`.
- **Rationale**: Deterministic, reproducible, no random seed state needed. Same room + round always produces same word.
- **Alternatives considered**: Random selection with stored seed — unnecessary complexity for in-memory store; sequential round-robin — would make word predictable across rooms.

### Start Game Trigger
- **Decision**: New `POST /api/rooms/:code/start` endpoint. Only the host can call it. Validates ≥2 players. Transitions room to Playing state and creates round atomically.
- **Rationale**: Currently the "Start Game" button is client-side-only navigation. A server endpoint is needed to authorize the transition, validate prerequisites, and create the game/round state.
- **Alternatives considered**: Repurpose existing `POST` or `GET` endpoints — semantically incorrect for a state transition.

### Drawer Identification
- **Decision**: The `drawerId` field in the round response identifies the drawer. The frontend compares this against its stored `participantId` to determine if the current player is the drawer. Non-drawer players see the drawer's `name` in the response.
- **Rationale**: The frontend already has `participantId` in RoomStore state. No additional auth tokens needed. Drawer identity is included for all players; the secret word is a separate field returned only when `participantId === drawerId`.

### Starter List
- **Decision**: Reuse existing `STARTER_WORDS = ["rocket","pizza","castle","guitar","sunflower"]` from `starterData.ts`. Not user-configurable for v1.
- **Rationale**: Already exists in the codebase. 5 words sufficient for v1 with deterministic selection ensuring variety across rooms.
- **Alternatives considered**: Configurable list — rejected for v1; dynamic word set from external source — violates constitution (no external dependencies).

## Edge Cases Resolved

| Edge Case | Resolution |
|-----------|------------|
| Host disconnects before round starts | Inherit host transfer rules from Room Setup Lobby feature. Transferred host becomes drawer. |
| Empty starter list | FR-007 requires at least 1 word. System still selects deterministically. |
| Two-player game | Host is drawer; single non-drawer guesses. |
| Non-drawer attempts to access word | Secret word excluded from all non-drawer responses, regardless of endpoint. |
| Timer expiry | Round End transition fires; drawer assignment and word are finalized. |
| Concurrent start requests | Host-only authorization; first valid request transitions state; subsequent requests return 400 (game already started). |
