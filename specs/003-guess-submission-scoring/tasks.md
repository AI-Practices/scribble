# Tasks: Guess Submission & Scoring

**Input**: Design documents from `specs/003-guess-submission-scoring/`

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

**Purpose**: Type definitions, schemas, and store wiring needed by all stories

- [ ] T001 [P] Add Guess, PlayerScore, CanvasStroke, CanvasState types to `backend/src/models/game.ts`
- [ ] T002 [P] Add guess submission Zod schema (participantId, content) to `backend/src/api/schemas.ts`
- [ ] T003 [P] Add canvas sync Zod schema (strokes, cleared) to `backend/src/api/schemas.ts`
- [ ] T004 [P] Extend `frontend/src/services/api.ts` with Guess, PlayerScore, CanvasState, CanvasStroke response types
- [ ] T005 [P] Extend `frontend/src/state/roomStore.ts` RoundState interface with guesses, scores, canvas, guessedCorrectly fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend services that all user story implementation depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `backend/src/services/canvasStore.ts` — in-memory Map for canvas state per round (strokes list, cleared flag, updatedAt)
- [ ] T007 Extend `backend/src/services/gameStore.ts` with guess storage (guesses array per game), score tracking (scores map per game), correct guesser tracking (correctGuessers set per round)
- [ ] T008 [P] Add submitGuess() function to `backend/src/services/gameStore.ts` — validates round active, trims content, rejects empty, case-insensitive compare, awards 100 points if correct, records guess, prevents duplicate correct guesses
- [ ] T009 [P] Add canvasSync() function to `backend/src/services/canvasStore.ts` — appends strokes or clears canvas, validates caller is drawer

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Drawing Canvas and Visibility (Priority: P1) 🎯 MVP

**Goal**: The drawer sees a drawing canvas they can draw on and clear. The drawing state replicates to all guessers via polling.

**Independent Test**: Assign a player as drawer in an active round; draw a line and clear the canvas; both actions take effect on the drawer's screen immediately, and the drawing state is visible to all guessers within the polling interval.

### Implementation for User Story 1

- [ ] T010 [US1] Implement POST /api/games/:code/canvas/sync endpoint in `backend/src/api/guesses.ts` — validates drawer, syncs strokes/clear to canvasStore, returns stroke count
- [ ] T011 [US1] Extend GET /api/games/:code/round in `backend/src/api/games.ts` — include canvas state (strokes, cleared, updatedAt) in round response
- [ ] T012 [US1] Create `frontend/src/components/DrawingCanvas.tsx` — HTML5 Canvas freehand drawing with mouse/touch events, draw stroke, clear button, syncs strokes to server via canvas/sync endpoint every ~2s
- [ ] T013 [P] [US1] Update `frontend/src/pages/GamePage.tsx` — render DrawingCanvas for drawer, pass canvas state to guessers for display
- [ ] T014 [US1] Add canvas display component in GamePage — guessers see canvas strokes rendered via HTML5 Canvas API on each poll

**Checkpoint**: At this point, US1 should be fully functional — drawer draws/clears, guessers see the drawing update within polling interval.

---

## Phase 4: User Story 2 — Guess Submission & Validation (Priority: P1)

**Goal**: A guesser types a guess and submits it. The system trims whitespace, compares case-insensitively, rejects empty submissions.

**Independent Test**: Start an active round, log in as a guesser, submit guesses with leading/trailing spaces, submit an empty guess, and verify each response.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Implement POST /api/games/:code/guess endpoint in `backend/src/api/guesses.ts` — calls gameStore.submitGuess(), returns correct/incorrect result, guess details, and scoreAwarded/totalScore
- [ ] T016 [US2] Mount guess routes in `backend/src/api/router.ts` — add router for guesses endpoints
- [ ] T017 [P] [US2] Extend `frontend/src/services/api.ts` with submitGuess(code, participantId, content) function — POST to /api/games/:code/guess, returns GuessResult
- [ ] T018 [US2] Update `frontend/src/components/GuessForm.tsx` — real guess input with submit button, calls submitGuess API, shows validation feedback (empty rejected / accepted + correct/incorrect), disables input after correct guess
- [ ] T019 [US2] Add guess response types (GuessResult, GuessResponse) to `frontend/src/services/api.ts`

**Checkpoint**: At this point, US2 should be functional — guessers can submit guesses, get immediate validation feedback.

---

## Phase 5: User Story 3 — Guess History Synced (Priority: P1)

**Goal**: All players see a synchronized list of guesses via polling, with submitter name, content, timestamp, and correctness status.

**Independent Test**: Two guessers submit guesses in sequence; the drawer and both guessers see all guesses appear in the history within 3 seconds.

### Implementation for User Story 3

- [ ] T020 [US3] Extend GET /api/games/:code/round in `backend/src/api/games.ts` — include guesses array and guessedCorrectly boolean in round response
- [ ] T021 [P] [US3] Update `frontend/src/state/roomStore.ts` — populate guesses, guessedCorrectly from round poll response; add setGuessHistory()
- [ ] T022 [US3] Create `frontend/src/components/GuessHistory.tsx` — renders ordered guess list with submitter name, content, correct/incorrect indicator
- [ ] T023 [P] [US3] Update `frontend/src/pages/GamePage.tsx` — render GuessHistory for both drawer and guessers

**Checkpoint**: At this point, US3 should be functional — all players see the guess history updating via polling.

---

## Phase 6: User Story 4 — Scoring (Priority: P2)

**Goal**: Correct guesses award 100 points. Scores visible to all players via polling. Correct guesser's input disabled.

**Independent Test**: A guesser with 0 score submits a correct guess; their score updates to 100 and their guess input is disabled. Another guesser submits an incorrect guess; their score remains at 0.

### Implementation for User Story 4

- [ ] T024 [US4] Extend GET /api/games/:code/round in `backend/src/api/games.ts` — include scores array and guessedCorrectly boolean per participant
- [ ] T025 [P] [US4] Update `frontend/src/state/roomStore.ts` — populate scores from round poll response
- [ ] T026 [US4] Update `frontend/src/components/Scoreboard.tsx` — render real scores for all players from roomStore scores
- [ ] T027 [US4] Update `frontend/src/pages/GamePage.tsx` — pass guessedCorrectly to GuessForm to disable input after correct guess; render Scoreboard for all players

**Checkpoint**: At this point, US4 should be functional — correct guesses award 100 points, scoreboard visible to all, correct guessers blocked from further guesses.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge case handling, and verification

- [ ] T028 Mount canvas sync route in `backend/src/api/router.ts` — add canvas sync endpoint to router
- [ ] T029 Add edge case handling — reject drawer guesses (FR-014), reject guesses after round timer expired, handle duplicate correct submissions gracefully
- [ ] T030 [P] Run `npm run build` in both backend/ and frontend/ — verify no TypeScript errors
- [ ] T031 Run quickstart.md validation — manually verify all 6 verification steps pass
- [ ] T032 Cleanup: remove placeholder GuessForm and Scoreboard logic in GamePage (replace with real components)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Canvas (Phase 3)**: Depends on Foundational — independent of other stories
- **US2 Guess Submission (Phase 4)**: Depends on Foundational — independent of other stories
- **US3 Guess History (Phase 5)**: Depends on US2 (needs guess data) — but can start in parallel with US2 for frontend work
- **US4 Scoring (Phase 6)**: Depends on US2 (needs correct guess detection) — can start in parallel for frontend
- **Polish (Phase 7)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational — No dependencies on other stories
- **US3 (P1)**: Depends on backend work from US2 (guess data available in round poll) — frontend can start in parallel
- **US4 (P2)**: Depends on backend work from US2 (correct guess detection, scoring) — frontend can start in parallel

### Within Each User Story

- Backend before frontend (within a story)
- Types/models before services
- Services before endpoints
- Story complete before moving to next

### Parallel Opportunities

- T001-T005 (Setup) can all run in parallel
- T006-T009 (Foundational) — T008 and T009 can run in parallel
- US1, US2, US3, US4 backend work can run in parallel after Foundational
- US1 frontend (T012, T013, T014) can run in parallel with US1 backend (T010, T011)
- US2 frontend (T017, T018) can run in parallel with US2 backend (T015, T016)
- US3 frontend (T021, T022, T023) can run in parallel with US3 backend (T020)
- US4 frontend (T025, T026, T027) can run in parallel with US4 backend (T024)

---

## Parallel Example: User Story 1

```bash
# US1 backend tasks:
Task: "Implement POST /api/games/:code/canvas/sync in backend/src/api/guesses.ts"
Task: "Extend GET /api/games/:code/round in backend/src/api/games.ts to include canvas"

# US1 frontend tasks (run in parallel with backend):
Task: "Create DrawingCanvas component in frontend/src/components/DrawingCanvas.tsx"
Task: "Update GamePage to render DrawingCanvas in frontend/src/pages/GamePage.tsx"
```

## Parallel Example: User Story 2

```bash
# US2 backend tasks:
Task: "Implement POST /api/games/:code/guess endpoint in backend/src/api/guesses.ts"
Task: "Mount guess routes in backend/src/api/router.ts"

# US2 frontend tasks (run in parallel with backend):
Task: "Extend frontend/src/services/api.ts with submitGuess()"
Task: "Update GuessForm in frontend/src/components/GuessForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Canvas drawing + visibility)
4. Complete Phase 4: User Story 2 (Guess submission + validation)
5. **STOP and VALIDATE**: Test US1 and US2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Canvas) → Test independently → Demo (drawer can draw, guessers see it)
3. Add US2 (Guess submission) → Test independently → Demo (guessing works)
4. Add US3 (Guess history) → Test independently → Demo (history visible)
5. Add US4 (Scoring) → Test independently → Demo (full feature set)

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Canvas — independent)
   - Developer B: US2 (Guess submission — independent backend)
   - Developer C: US3 frontend + US4 frontend (depends on US2 backend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
