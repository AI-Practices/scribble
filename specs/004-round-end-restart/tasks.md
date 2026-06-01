# Tasks: Round End & Restart Flow

**Input**: Design documents from `specs/004-round-end-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/room-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- Backend and frontend tasks within the same story can generally run in parallel

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type and schema additions needed by all stories

- [ ] T001 [P] Add `resultExpiresAt` field to Game interface in `backend/src/models/game.ts`
- [ ] T002 [P] Add restart payload Zod schema (participantId) to `backend/src/api/schemas.ts`
- [ ] T003 [P] Add `resultExpiresAt` to RoundState interface in `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend game state management for round end timeout and auto-return

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Extend `endRound()` in `backend/src/services/gameStore.ts` to set `resultExpiresAt = now + 60s` on the game when transitioning to round_end
- [ ] T005 Implement 60s result state timeout check in `backend/src/services/gameStore.ts` — when any poll detects `resultExpiresAt` has passed, auto-transition to lobby (clear game round data, clear Room gameStartedAt/drawerId/drawerName)
- [ ] T006 Implement host disconnect auto-return (15-30s grace) in `backend/src/services/gameStore.ts` — track last poll time for host during round_end; if host hasn't polled for 15-30s, auto-transition to lobby (same logic as T005)

**Checkpoint**: Foundation ready — round_end state has a 60s expiry, host disconnect auto-returns to lobby after grace period.

---

## Phase 3: User Story 1 — View Round Results (Priority: P1) 🎯 MVP

**Goal**: When a round ends, all players see the correct word, final scores for every participant, and the full guess history.

**Independent Test**: Complete a round and verify every player in the room sees the correct word, updated scores, and the full guess history with who guessed what.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Extend GET /games/:code/round in `backend/src/api/games.ts` to include `resultExpiresAt` in the round response when status is round_end
- [ ] T008 [US1] Update `frontend/src/pages/GamePage.tsx` to display a result expiry countdown (e.g., "Results expire in 45s") when `round.status === "round_end"` using `round.resultExpiresAt`

**Checkpoint**: At this point, US1 should be fully functional — all players see the correct word, scores, guess history, and a result expiry countdown.

---

## Phase 4: User Story 2 — Host Restarts to Lobby (Priority: P1) 🎯 MVP

**Goal**: The host can click a restart button to return all players to the lobby with the player list intact and all round-specific data cleared.

**Independent Test**: After a round ends, click restart as the host; verify all players land in the lobby with their names still in the room and no round artifacts remaining (word, guesses, scores, timer, drawer assignment all cleared).

### Implementation for User Story 2

- [ ] T009 [US2] Implement `restartGame(code)` in `backend/src/services/gameStore.ts` — validates caller is host and game is in round_end, clears round/guesses/correctGuessers/scores, sets game status to null (no active game), clears Room gameStartedAt/drawerId/drawerName
- [ ] T010 [US2] Create POST /:code/restart route in `backend/src/api/games.ts` — validates payload with Zod schema, calls restartGame, returns updated room snapshot (lobby state with preserved players)
- [ ] T011 [US2] Mount restart route in `backend/src/api/router.ts` — ensure POST /api/games/:code/restart is routed correctly
- [ ] T012 [P] [US2] Add `restartGame(code, participantId)` function to `frontend/src/services/api.ts` — POST to /api/games/:code/restart, returns RoomSnapshot
- [ ] T013 [US2] Add restart handling to `frontend/src/state/roomStore.ts` — add `restartGame()` method that calls API, clears round state, updates room data to lobby state
- [ ] T014 [US2] Update `frontend/src/pages/GamePage.tsx` — add "Back to Lobby" / "Restart" button visible only to the host when `round.status === "round_end"`; on restart, navigate to lobby
- [ ] T015 [US2] Verify `frontend/src/pages/LobbyPage.tsx` renders correctly after restart — players are preserved, gameStartedAt/drawerId/drawerName are absent, the host can start a new game

**Checkpoint**: At this point, US2 should be functional — host clicks restart, all players see lobby with preserved player list and no round artifacts.

---

## Phase 5: User Story 3 — Non-Host Players See Results on Reconnection (Priority: P2)

**Goal**: A player who disconnects during the result state and reconnects within 60 seconds sees the correct word, scores, and guess history matching other players.

**Independent Test**: Complete a round in browser A and browser B. Close browser B, then reopen and navigate to the game. Browser B should show the same result state as browser A.

### Implementation for User Story 3

- [ ] T016 [US3] Verify `frontend/src/pages/LobbyPage.tsx` redirects to GamePage when a game is active (gameStartedAt is set and status is not lobby) — ensure reconnecting players navigate to the correct page
- [ ] T017 [US3] Verify `frontend/src/pages/GamePage.tsx` correctly renders round_end state on reconnect — on mount, the round poll returns round_end data with resultExpiresAt, secretWord, scores, guesses; no additional wiring needed beyond US1

**Checkpoint**: Reconnecting players see the correct result state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge case handling, and verification

- [ ] T018 [P] Run `npm run build` in both `backend/` and `frontend/` — verify no TypeScript errors
- [ ] T019 Run quickstart.md validation — manually verify all 7 verification steps pass
- [ ] T020 [P] Handle edge case: restart button is NOT visible to non-host players
- [ ] T021 Handle edge case: all players except host leave during result state — host can still restart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Round Results (Phase 3)**: Depends on Foundational — No dependencies on other stories
- **US2 Restart (Phase 4)**: Depends on US1 (needs round_end state to restart from)
- **US3 Reconnection (Phase 5)**: Depends on US1 (needs result state to reconnect to)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P1)**: Depends on US1 — needs round_end state to exist before restart is meaningful
- **US3 (P2)**: Depends on US1 — needs result state to display on reconnect

### Within Each User Story

- Backend before frontend (within a story)
- Types/models before services
- Services before endpoints
- Story complete before moving to next

### Parallel Opportunities

- T001-T003 (Setup) can all run in parallel
- T004-T006 (Foundational) are sequential (T005 and T006 share auto-transition logic)
- US1 backend (T007) and US1 frontend (T008) can run in parallel
- US2 backend (T009, T010, T011) — T009 must precede T010 and T011; those can run in parallel with US2 frontend (T012, T013, T014, T015) — T012 and T013 can run in parallel
- US3 frontend (T016, T017) can run in parallel after US1

---

## Parallel Example: User Story 1

```bash
# US1 backend task:
Task: "Extend GET /:code/round in backend/src/api/games.ts to include resultExpiresAt"

# US1 frontend task (run in parallel with backend):
Task: "Update GamePage to show result expiry countdown"
```

## Parallel Example: User Story 2

```bash
# US2 backend tasks:
Task: "Implement restartGame() in backend/src/services/gameStore.ts"
Task: "Create POST /:code/restart in backend/src/api/games.ts"

# US2 frontend tasks (run in parallel with backend):
Task: "Add restartGame() API call in frontend/src/services/api.ts"
Task: "Add restart handling in frontend/src/state/roomStore.ts"
Task: "Add restart button in frontend/src/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (result display)
4. Complete Phase 4: User Story 2 (restart to lobby)
5. **STOP and VALIDATE**: Test US1 and US2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Result display) → Test independently → Demo (players see results after round ends)
3. Add US2 (Restart) → Test independently → Demo (full round cycle: play → view results → restart → lobby)
4. Add US3 (Reconnection) → Test independently → Demo (resilience verified)
5. Polish → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Result display — backend + frontend)
   - Developer B: US2 (Restart — backend + frontend, blocks on US1 completion)
3. US3 handled by either developer after US1 is complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The existing `endRound()` in `backend/src/services/gameStore.ts` already transitions status to `round_end` and reveals the secret word to all — US1 extends this with `resultExpiresAt` and the frontend countdown
- The existing GamePage already renders scores, guesses, and secret word on round_end — US1 adds the result expiry countdown display
