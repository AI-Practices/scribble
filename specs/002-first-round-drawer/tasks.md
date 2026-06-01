# Tasks: First Round Drawer Assignment

**Input**: Design documents from `specs/002-first-round-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*No setup tasks needed — project already initialized by Room Setup & Lobby feature (001).*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `Game`, `Round`, `GameStatus` types to `backend/src/models/game.ts` (Game: roomCode, status, round, roundNumber, createdAt; Round: number, drawerId, secretWord, startedAt, endsAt; GameStatus: "playing" | "round_end")
- [X] T002 [P] Create `backend/src/services/gameStore.ts` with in-memory `Map<string, Game>`, `createGame()`, `getGame()` — `createGame()` validates roomCode exists, assigns host as drawer, selects word deterministically from STARTER_WORDS; `getGame()` returns game or null

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Drawer Assigned When Round Begins (Priority: P1) 🎯 MVP

**Goal**: Host starts the game from lobby → room transitions to Playing → host is designated as drawer → all players see who the drawer is

**Independent Test**: A game with 3 players starts; the host sees themselves labeled as drawer; the other two players see the host identified as drawer

### Implementation for User Story 1

- [X] T003 [P] [US1] Add start-game Zod schema `StartGamePayload` (participantId: string) and error response types to `backend/src/api/schemas.ts`
- [X] T004 [P] [US1] Implement `POST /api/rooms/:code/start` endpoint in `backend/src/api/rooms.ts` — validates host, ≥2 players, creates game via gameStore, returns game snapshot without secret word
- [X] T005 [P] [US1] Mount games router in `backend/src/app.ts`
- [X] T006 [P] [US1] Add `startGame(code: string, participantId: string)` to `frontend/src/services/api.ts`
- [X] T007 [US1] Update `frontend/src/pages/LobbyPage.tsx` — wire "Start Game" button to POST `/api/rooms/:code/start` API call instead of client-side-only navigation; navigate to `/game` on success; show error on failure
- [X] T008 [US1] Update `frontend/src/pages/GamePage.tsx` — display drawer identity (show "You are the drawer!" for drawer, "[Name] is drawing..." for others); poll for round state from mount
- [X] T009 [US1] Add drawer label styles to `frontend/src/styles/app.css` (drawer badge, "You are drawing" highlight, non-drawer "waiting" state)

**Checkpoint**: At this point, User Story 1 should be fully functional — host can start game, all players see drawer identity

---

## Phase 4: User Story 2 - Secret Word Visible Only to Drawer (Priority: P1)

**Goal**: Secret word selected from starter list is visible only to the drawer; non-drawers never see it

**Independent Test**: Start a game, log in as a non-drawer player, and confirm no secret word is visible anywhere on their screen or in any API response

### Implementation for User Story 2

- [X] T010 [P] [US2] Create `GET /api/games/:code/round` endpoint in `backend/src/api/games.ts` — returns round state; includes `secretWord` only when requesting participantId matches drawerId; includes `endedAt` when status is "round_end"
- [X] T011 [P] [US2] Add `fetchRound(code: string, participantId: string)` to `frontend/src/services/api.ts`
- [X] T012 [US2] Add game/round state fields and polling methods to `frontend/src/state/roomStore.ts` (round state shape, startRoundPolling/stopRoundPolling, amDrawer flag)
- [X] T013 [US2] Implement 60-second countdown timer display in `frontend/src/pages/GamePage.tsx` using `endsAt` from round response
- [X] T014 [US2] Implement secret word display in `frontend/src/pages/GamePage.tsx` — show word prominently when `amDrawer` is true; show nothing when false
- [X] T015 [US2] Add secret word and timer styles to `frontend/src/styles/app.css` (word card, countdown progress, round-ended reveal)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work — drawer sees word, non-drawers do not, timer counts down

---

## Phase 5: User Story 3 - Deterministic Word Selection (Priority: P2)

**Goal**: The same game session always produces the same word for the same round number

**Independent Test**: Restart the exact same game (same room, same players) and verify the same word is selected for round 1

### Implementation for User Story 3

- [X] T016 [P] [US3] Implement deterministic word selection function in `backend/src/services/gameStore.ts` using `hash(roomCode + ":" + roundNumber) % STARTER_WORDS.length`
- [X] T017 [US3] Integrate word selection into round creation in `backend/src/services/gameStore.ts` — call word selection on round creation; store selected word in Round.secretWord
- [X] T018 [US3] Handle edge cases: empty starter list (minimum 1 word), single-word list always returns same word

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Handle round timer expiry in `backend/src/services/gameStore.ts` — transition game status to "round_end" after 60s; set `endedAt` timestamp
- [ ] T020 [P] Handle concurrent start requests in `POST /api/rooms/:code/start` — return 400 "Game has already started" if game exists for room
- [ ] T021 Run `npm run build` in both `backend/` and `frontend/` to verify zero TypeScript errors
- [ ] T022 Run quickstart.md validation steps end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete from Room Setup feature
- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 and US2 can proceed sequentially (US2 depends on US1's game state)
  - US3 depends on word selection data, integrated into Foundational gameStore
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — Depends on US1 for game state existence
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — Word selection logic is in gameStore, shared by US1/US2

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 in Foundational phase can run in parallel
- T003 and T004 in US1 can run in parallel
- T010 and T011 in US2 can run in parallel
- T016 and T017 in US3 can run in parallel
- All [P] tasks are independent (different files, no dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch models/services in parallel:
Task: T003 Add start-game Zod schema in src/api/schemas.ts
Task: T004 Implement POST /api/rooms/:code/start in src/api/rooms.ts
Task: T005 Mount games router in src/app.ts

# Then launch frontend tasks in parallel:
Task: T006 Add startGame() in services/api.ts
Task: T007 Wire Start Game button in LobbyPage.tsx
Task: T008 Update GamePage.tsx with drawer display
Task: T009 Add drawer label styles in app.css
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T009)
3. **STOP and VALIDATE**: Test US1 independently — host starts game, all players see drawer
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: drawer assignment works)
3. Add User Story 2 → Test independently → Deploy/Demo (secret word visible only to drawer)
4. Add User Story 3 → Test independently → Deploy/Demo (deterministic word selection)

### Parallel Team Strategy

With multiple developers:

1. Developer A: Foundational (T001-T002)
2. Once done:
   - Developer A: US1 (T003-T009)
   - Developer B: US2 (T010-T015) — after US1 complete
   - Developer C: US3 (T016-T018) — alongside US1/US2

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
