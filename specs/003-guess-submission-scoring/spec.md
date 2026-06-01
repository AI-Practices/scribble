# Feature Specification: Guess Submission & Scoring

**Feature Branch**: `003-guess-submission-scoring`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Can Use the Drawing Canvas (Priority: P1)

The drawer sees a drawing canvas they can draw on and clear. The drawing is visible on their screen in real time.

**Why this priority**: The drawing canvas is the primary output of the round — without it, guessers have nothing to react to.

**Independent Test**: Assign a player as drawer in an active round; they use the drawing tool to draw a line and clear the canvas; both actions take effect immediately on their screen.

**Acceptance Scenarios**:

1. **Given** a round is active and the user is the drawer, **When** the drawer draws on the canvas, **Then** the drawing marks appear on the drawer's screen
2. **Given** the drawer has drawn on the canvas, **When** the drawer clears the canvas, **Then** all drawing marks are removed from the drawer's screen

---

### User Story 2 - Guessers Submit and Validate Guesses (Priority: P1)

A guesser types a guess and submits it. The system trims whitespace, compares case-insensitively against the secret word, and rejects empty or whitespace-only submissions with a clear message.

**Why this priority**: Guess submission is the core interaction for non-drawer players — without it, the game cannot progress.

**Independent Test**: Start an active round, log in as a guesser, submit guesses with leading/trailing spaces, submit an empty guess, and verify each response.

**Acceptance Scenarios**:

1. **Given** a round is active and the user is a guesser, **When** the guesser submits a guess with leading/trailing whitespace, **Then** the guess is trimmed before processing
2. **Given** a round is active, **When** a guesser submits an empty or whitespace-only guess, **Then** the guess is rejected with a notification
3. **Given** a round is active, **When** a guesser submits a guess that matches the secret word (case-insensitively), **Then** the guess is recorded as correct
4. **Given** a round is active, **When** a guesser submits a guess that does not match the secret word, **Then** the guess is recorded as incorrect

---

### User Story 3 - Guess History Synced to All Players (Priority: P1)

All players (drawer and guessers) see a synchronized list of all guesses submitted during the round, updated via periodic polling.

**Why this priority**: The drawer needs to see guesses to know if someone is close; guessers need to see others' guesses to avoid repeating them. Without sync, the round is blind for everyone.

**Independent Test**: Two guessers submit guesses in sequence; the drawer and both guessers see all guesses appear in the history within 3 seconds.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** any guesser submits a guess, **Then** that guess appears in the guess history for all players (drawer and guessers)
2. **Given** a guess history contains multiple entries, **When** a player polls for updates, **Then** the response includes the full ordered list of guesses with submitter names, timestamps, and correctness status
3. **Given** a guesser submits a guess, **When** any player views the guess history, **Then** the guess history updates within 3 seconds of submission

---

### User Story 4 - Scoring on Correct Guesses (Priority: P2)

When a guesser submits a correct guess, their score increases by 100 points. Incorrect guesses add 0 points. All players can see the updated scores via polling.

**Why this priority**: Scoring adds the competitive incentive that drives engagement. It is P2 because the round functions without scoring, but scoring is essential for a complete game experience.

**Independent Test**: A guesser with 0 score submits a correct guess; their score updates to 100. Another guesser submits an incorrect guess; their score remains at 0.

**Acceptance Scenarios**:

1. **Given** a guesser has a score of 0, **When** they submit a correct guess, **Then** their score becomes 100
2. **Given** a guesser has a score of 0, **When** they submit an incorrect guess, **Then** their score remains 0
3. **Given** a guesser's score has increased, **When** any player polls for game state, **Then** the updated score is visible to all players

---

### Edge Cases

- What happens when a guesser submits the same correct guess multiple times — only the first submission should score points; subsequent identical correct guesses are noted as duplicates but do not award additional points
- What happens when multiple guessers guess correctly in the same round — each correct guesser receives 100 points independently
- What happens when the guess contains only punctuation or special characters after trimming — these are valid non-empty guesses and are compared case-insensitively against the secret word
- What happens when the drawer submits a guess — the drawer should not have a guess input; the canvas and guess history viewing are the drawer's primary interactions
- What happens when a player disconnects and reconnects mid-round — the full guess history and current scores are available on the next poll
- What happens when the round timer expires — no further guesses are accepted; the final guess history and scores are frozen for the round end state

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Drawer MUST be presented with a drawing canvas that supports freehand drawing and clearing
- **FR-002**: Drawing actions (stroke, clear) MUST take effect immediately on the drawer's screen
- **FR-003**: System MUST accept guess submissions from non-drawer players during an active round
- **FR-004**: System MUST trim leading and trailing whitespace from all submitted guesses before processing
- **FR-005**: System MUST reject guesses that are empty or contain only whitespace after trimming, with a notification to the submitter
- **FR-006**: System MUST compare guesses against the secret word using case-insensitive exact matching
- **FR-007**: System MUST record each guess with the submitter identity, trimmed content, timestamp, and correct/incorrect status
- **FR-008**: System MUST expose a polling endpoint that returns the ordered list of all guesses for the active round
- **FR-009**: The guess history endpoint MUST include each guess's submitter name, content, timestamp, and correctness status
- **FR-010**: System MUST award exactly 100 points to a guesser when they submit a correct guess
- **FR-011**: System MUST NOT award points for incorrect guesses
- **FR-012**: System MUST NOT award additional points for duplicate correct guesses from the same guesser
- **FR-013**: System MUST include current scores for all players in the polling response
- **FR-014**: The drawer MUST NOT have an input for submitting guesses
- **FR-015**: The drawer MUST be able to view the guess history alongside all guessers

### Key Entities *(include if feature involves data)*

- **Guess**: A single guess submitted during a round. Has submitter (player ID), trimmed content, timestamp, and correctness flag (correct/incorrect). Belongs to one round.
- **Guess History**: An ordered list of all guesses for a round, visible to all players via polling. Each entry contains the submitter name, content, timestamp, and whether the guess was correct.
- **Score**: A cumulative integer representing a player's points in the game. Starts at 0 for all players. Incremented by 100 on a correct guess. Scoped to the game session.
- **Canvas State**: The current visual state of the drawing canvas. Managed locally on the drawer's device during the round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw a stroke on the canvas and see it appear in under 500ms
- **SC-002**: The drawer can clear the canvas and see it cleared in under 500ms
- **SC-003**: A guesser receives feedback on guess submission (accepted or rejected) within 2 seconds
- **SC-004**: All players see a new guess appear in the guess history within 3 seconds of submission
- **SC-005**: A correct guesser's score updates from 0 to 100 and is visible to all players within 3 seconds
- **SC-006**: Empty and whitespace-only guesses are rejected 100% of the time
- **SC-007**: A guess matching the secret word with different casing is always marked correct
- **SC-008**: Duplicate correct guesses from the same player do not award additional points

## Assumptions

- The round timer and the Playing → Round End transition are handled by the First Round Drawer feature (FR-006 / SC-006 from that spec)
- The round polling endpoint (`/games/:code/round`) established in the First Round Drawer feature is extended to include guess history and scores
- A correct guess does NOT end the round — the round continues until the timer expires
- The drawing canvas is a basic freehand drawing tool without color selection, brush size controls, or undo/redo for v1; these may be added in future iterations
- Players can submit an unlimited number of guesses during a round (rate limiting to prevent spam is a future concern)
- The secret word comparison is exact match (case-insensitive) — partial matches, close spellings, or "close enough" logic is not supported
- The drawer identity and secret word assignment from the existing First Round Drawer feature are prerequisites for this feature
