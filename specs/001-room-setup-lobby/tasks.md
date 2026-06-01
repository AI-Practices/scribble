---

description: "Task list for Room Setup & Lobby feature"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec — test tasks omitted. Add test tasks if TDD approach is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Configure TypeScript strict mode in `backend/tsconfig.json` and `frontend/tsconfig.json` (verify `strict: true`, `noImplicitAny: true`)
- [X] T002 [P] Verify Vitest configuration for both `backend/` and `frontend/` — confirm `npm test` runs without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `hostId` field to `Room` interface in `backend/src/models/game.ts`
- [X] T004 [P] Update `createRoom` in `backend/src/services/roomStore.ts` to accept and store the host participant ID
- [X] T005 [P] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostId` in the snapshot
- [X] T006 [P] Add `hostId` to `RoomSnapshot` TypeScript type in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Room (Priority: P1) 🎯 MVP

**Goal**: Player can create a room and is automatically assigned as host with a unique code

**Independent Test**: Open the app, enter a name, click "Create Room", land on lobby showing the room code and host badge

- [X] T007 [P] [US1] Update `POST /rooms` handler in `backend/src/api/rooms.ts` to validate `playerName` is non-empty after trim
- [X] T008 [P] [US1] Add `hostId` to Room snapshot returned by `createRoom` in `backend/src/services/roomStore.ts`
- [X] T009 [US1] Add client-side player name validation (trim, reject empty) on CreateRoomPage in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T010 [US1] Add host badge indicator ("Host") next to the host's name in the lobby participant list in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Story 1 complete — player can create a room, see their code, and the host is tracked

---

## Phase 4: User Story 2 - Join Room (Priority: P1)

**Goal**: Player can join an existing room by code with clear validation for empty, invalid, or duplicate codes

**Independent Test**: Open a second browser, enter the room code from US1, see both players in the lobby. Try empty code → error shown. Try wrong code → error shown. Try same player again → error shown.

- [X] T011 [P] [US2] Update `joinRoom` in `backend/src/services/roomStore.ts` to reject empty codes, unknown codes (404), and duplicate participants (409) with distinct messages
- [X] T012 [P] [US2] Update `POST /rooms/:code/join` in `backend/src/api/rooms.ts` to return specific error status codes and messages
- [X] T013 [P] [US2] Add `playerName` validation (trim, reject empty) to join schema in `backend/src/api/schemas.ts`
- [X] T014 [US2] Add client-side room code and player name validation on JoinRoomPage in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T015 [US2] Display join error messages from API in the join form UI

**Checkpoint**: User Story 2 complete — validation covers all error cases, multi-room isolation verified

---

## Phase 5: User Story 3 - Lobby with Auto-Polling (Priority: P1)

**Goal**: Lobby participant list refreshes automatically every ~2 seconds with a connection indicator

**Independent Test**: Open two browsers in the same room. Add a player in one browser; the other browser's list updates within 3 seconds without manual refresh. Disconnect network → subtle connection indicator appears.

- [X] T016 [P] [US3] Add `startPolling(intervalMs: number)` and `stopPolling()` methods to RoomStore in `frontend/src/state/roomStore.ts`
- [X] T017 [US3] Add auto-polling `useEffect` in LobbyPage (`frontend/src/pages/LobbyPage.tsx`) that starts on mount and stops on unmount
- [X] T018 [P] [US3] Add connection status indicator (subtle banner) when consecutive polls fail in `frontend/src/pages/LobbyPage.tsx`
- [X] T019 [US3] Replace manual "Refresh Room" button with a less prominent manual refresh fallback in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Story 3 complete — lobby is live with auto-polling and graceful degradation

---

## Phase 6: User Story 4 - Host-Only Start (Priority: P2)

**Goal**: Only the host can start the game, and only when at least 2 players are present

**Independent Test**: Host sees enabled "Start Game" button when 2+ players present. Non-host sees no start button. Host sees disabled start button with "waiting for players" message when alone.

- [X] T020 [P] [US4] Derive `isHost` from `participantId === room.hostId` and expose via RoomStore state in `frontend/src/state/roomStore.ts`
- [X] T021 [US4] Conditionally render start button only for host in `frontend/src/pages/LobbyPage.tsx` — enabled when ≥2 players, disabled otherwise with explanation
- [X] T022 [US4] Add styles for host-only start button and waiting message in `frontend/src/styles/app.css`

**Checkpoint**: User Story 4 complete — lobby has full start-game gating

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 Add room cleanup for inactive rooms (e.g., no participants, stale >30min) in `backend/src/services/roomStore.ts`
- [ ] T024 [P] Verify `npm run build` passes in both `backend/` and `frontend/`
- [ ] T025 [P] Run quickstart.md verification steps end-to-end
- [ ] T026 Verify WCAG 2.1 AA color contrast for connection indicator and error states

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start after Foundational
- **US2 (P1)**: No dependencies on US1 (uses same Room model independently)
- **US3 (P1)**: Depends on US1 (needs a room to exist) and US2 (needs players to join)
- **US4 (P2)**: Depends on US1 (needs hostID) and US2 (needs ≥2 players)

### Within Each User Story

- Models before services
- Services before endpoints/UI
- Core implementation before integration

### Parallel Opportunities

- All Phase 2 [P] tasks can run in parallel
- US1, US2, US3 Setup tasks marked [P] can run in parallel (different files)
- UI tasks within a story can run in parallel with backend tasks for the same story

---

## Parallel Example: User Stories 1 and 2

```bash
# Launch backend model + schema changes together (Phase 2):
Task: "Add hostId to Room model in backend/src/models/game.ts"
Task: "Update toRoomSnapshot to include hostId in backend/src/services/roomStore.ts"

# Launch US1 + US2 backend changes together (different endpoints, no conflicts):
Task: "Update POST /rooms handler in backend/src/api/rooms.ts"
Task: "Update POST /rooms/:code/join in backend/src/api/rooms.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Create Room)
4. **STOP and VALIDATE**: Create a room, verify host badge and code display
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP
3. Add User Story 2 → Test independently (join flow)
4. Add User Story 3 → Test independently (auto-polling)
5. Add User Story 4 → Test independently (host-only start)
6. Polish → Final validation
