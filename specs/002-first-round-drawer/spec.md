# Feature Specification: First Round Drawer Assignment

**Feature Branch**: `002-first-round-drawer`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Assigned When Round Begins (Priority: P1)

The host starts the game from the lobby. The first round begins and the host / first player is automatically designated as the drawer. All players can see who the drawer is.

**Why this priority**: The drawer assignment is the essential entry point for round-based gameplay — without it, no player knows whose turn it is to draw.

**Independent Test**: A game with 3 players starts; the host sees themselves labeled as drawer; the other two players see the host identified as drawer.

**Acceptance Scenarios**:

1. **Given** a game is about to start with the host and at least 2 additional players, **When** the host starts the game and the first round begins, **Then** the host is clearly designated as the drawer
2. **Given** a game with exactly 2 players (host + 1), **When** the first round begins, **Then** the host is designated as the drawer

---

### User Story 2 - Secret Word Visible Only to Drawer (Priority: P1)

When the first round starts, a secret word from the starter list is selected and displayed to the drawer. Non-drawer players see the round has started but do not see the word.

**Why this priority**: The core game mechanic depends on the drawer knowing the word while other players guess — if the word leaks, the round is broken.

**Independent Test**: Start a game, log in as a non-drawer player, and confirm no secret word is visible anywhere on their screen.

**Acceptance Scenarios**:

1. **Given** the first round has begun, **When** the drawer views their screen, **Then** the secret word is displayed
2. **Given** the first round has begun, **When** a non-drawer player views their screen, **Then** the secret word is not visible
3. **Given** the first round has begun, **When** a non-drawer player polls for game state, **Then** the response contains no secret word

---

### User Story 3 - Deterministic Word Selection (Priority: P2)

When the first round begins, the same game state always yields the same secret word. The word is chosen from a predefined starter list using a deterministic method tied to the game session.

**Why this priority**: Determinism ensures consistency across reconnections and allows debugging. It is P2 because the game works with any selection method as long as the word remains secret to the drawer.

**Independent Test**: Restart the exact same game (same room, same players, same seed) and verify the same word is selected for round 1.

**Acceptance Scenarios**:

1. **Given** a game has been created, **When** the first round starts, **Then** the secret word is one from the starter list
2. **Given** the same game session is recreated, **When** the first round begins a second time, **Then** the same secret word is selected

---

### Edge Cases

- What happens when the host disconnects before the first round begins — another player should become the host/drawer (following host transfer rules established in Room Setup & Lobby)
- What happens when the starter list is empty or contains only one word — the system still selects deterministically; a single word is always chosen
- What happens when the game has exactly 2 players (host and one other) — the host is still the drawer; the single non-drawer player guesses
- What happens when a non-drawer player tries to poll or inspect the secret word through any endpoint — the word is never exposed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST designate the host / first player as the drawer when the first round begins
- **FR-002**: The drawer MUST be clearly identifiable to all players in the game
- **FR-003**: System MUST select a secret word from a predefined starter list when a round begins
- **FR-004**: Word selection MUST be deterministic — the same game session always produces the same word for the same round number
- **FR-005**: The secret word MUST be visible exclusively to the drawer
- **FR-006**: Non-drawer players MUST NOT receive the secret word in any game state response
- **FR-007**: The starter list MUST contain at least one valid word; the system handles single-word lists gracefully

### Key Entities *(include if feature involves data)*

- **Round**: A single drawing round within a game. Has a round number, a designated drawer, and a secret word. Belongs to one game.
- **Drawer**: The player assigned to draw in a given round. Determined by game rules (host for first round).
- **Secret Word**: The word selected from the starter list for a round. Visible only to the drawer.
- **Starter List**: A predefined collection of words available for selection. Populated by the system.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer receives the secret word within 2 seconds of the round starting
- **SC-002**: Non-drawer players never see the secret word at any point during the round
- **SC-003**: All players can identify who the drawer is within 2 seconds of the round starting
- **SC-004**: The same game session always selects the same word for round 1 when replayed
- **SC-005**: The selected word is always from the starter list

## Assumptions

- Player name validation (trimming, rejecting empty/whitespace-only) is handled by the Room Setup & Lobby feature (see FR-011, FR-012 in the room setup spec)
- The drawer's role rotates in subsequent rounds, but round rotation rules are out of scope for this feature
- The starter list is provided as part of the application (not user-configurable for v1)
- Deterministic selection is based on a combination of room/round identifiers, not random
- The game state transitions from lobby to round play when the host starts the game
- Host transfer rules (if host disconnects) are inherited from the Room Setup & Lobby feature
