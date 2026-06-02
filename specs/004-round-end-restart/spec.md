# Feature Specification: Round End & Restart Flow

**Feature Branch**: `004-round-end-restart`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-01

- Q: What happens if the host disconnects during the result state? → A: Room auto-returns to lobby after a 15-30 second timeout
- Q: How long should the result state persist before timeout? → A: 60 seconds
- Q: What is the reconnection window for players to see the result state? → A: 60 seconds (same as result state timeout)
- Q: What non-player data persists on restart? → A: Room settings (name, round count, timer config) persist; scores and chat reset
- Q: What is the maximum number of players per room? → A: 8 players

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

As a player in the room, after a round ends I want to see the correct word that was being drawn, the final scores for all players, and the full history of guesses made during that round.

**Why this priority**: This is the core functionality — displaying round results is the primary purpose of this feature and must work for all players.

**Independent Test**: Can be fully tested by completing a round and verifying that every player in the room sees the correct word, updated scores, and the full guess history.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the result state is displayed, **Then** all players see the correct word that was being drawn
2. **Given** a round has ended, **When** the result state is displayed, **Then** all players see the final scores for every participant, updated from the round's scoring
3. **Given** a round has ended, **When** the result state is displayed, **Then** all players see the full guess history including who guessed what and when

---

### User Story 2 - Host Restarts to Lobby (Priority: P1)

As the host of a room, after viewing the round results I want to restart the game so that all players return to the lobby with the player list intact and all round-specific data cleared.

**Why this priority**: This completes the game loop — without restart capability the game cannot proceed to the next round.

**Independent Test**: Can be fully tested by having the host click restart after a round completes and verifying all players land in the lobby with their names still in the room and no round artifacts remaining.

**Acceptance Scenarios**:

1. **Given** the result state is displayed, **When** the host triggers a restart, **Then** all players are returned to the lobby
2. **Given** the host triggers a restart, **When** players arrive in the lobby, **Then** all players who were in the room before the restart remain in the room
3. **Given** the host triggers a restart, **When** players arrive in the lobby, **Then** all round-specific state (current word, guesses, scores-in-progress, timer, drawer assignment) is cleared

---

### User Story 3 - Non-Host Players See Results on Reconnection (Priority: P2)

As a non-host player, if I navigate away and return during the result state I want to still see the round results.

**Why this priority**: Ensures resilience and good UX for players who may experience connectivity issues.

**Independent Test**: Can be tested by completing a round, having a player disconnect and reconnect, and verifying they see the same result state as other players.

**Acceptance Scenarios**:

1. **Given** the result state is being displayed, **When** a player reconnects to the room, **Then** they see the correct word, scores, and guess history matching other players

---

### Edge Cases

- If the host disconnects during the result state, the room auto-returns to lobby after a 15-30 second timeout
- What happens if a player joins after the restart to lobby? They should appear in the lobby alongside preserved players
- What happens if all players except the host leave during result state? The host should still be able to restart and return to lobby alone
- What happens if the host restarts while a player is still loading the result state? The player should transition to lobby upon receiving the restart signal

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the correct word to all players when a round ends
- **FR-002**: System MUST calculate and display updated scores for all players at round end
- **FR-003**: System MUST collect and display the full history of all guesses submitted during the round, including the guesser and the guessed word
- **FR-004**: Only the host MAY trigger a restart from the result state
- **FR-005**: When the host restarts, the system MUST transition all players to the lobby simultaneously
- **FR-006**: After restart, the system MUST preserve all players who were in the room
- **FR-007**: After restart, the system MUST clear all round-specific data including the current word, guess history, in-progress scores, cumulative scores, drawer assignment, round timer, and chat history; room settings (name, round count, timer config) MUST be preserved
- **FR-008**: The result state MUST persist on the server until the host triggers restart or a 60-second timeout elapses
- **FR-009**: Players who reconnect during the result state MUST see the same result data as all other players
- **FR-010**: The room MUST support up to 8 concurrent players in the result state

### Key Entities *(include if feature involves data)*

- **RoundResult**: The set of data presented at the end of a round — includes the correct word, final scores per player, and the full guess history
- **PlayerSession**: Represents a player in the room; identity and room membership are preserved across restart
- **RoomState**: The current phase of the room (e.g., "lobby", "drawing", "result"); transitions from "result" to "lobby" on restart

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players in the room see the correct word within 2 seconds of round end
- **SC-002**: Final scores are identical across all players within the same room
- **SC-003**: The complete guess history (every submitted guess) is visible to all players
- **SC-004**: On host restart, all players transition to the lobby within 3 seconds
- **SC-005**: Player count and identities in the lobby after restart match the pre-restart room exactly
- **SC-006**: No round-specific data (word, guesses, timer) is accessible from the lobby after restart

## Assumptions

- A single designated host exists per room (consistent with the existing room model)
- Players who disconnect during the result state and reconnect within 60 seconds will see the result state
- There is a mechanism for host transition if the current host disconnects
- Round scoring logic already exists and produces per-player scores
- Guess history is recorded during the round and is available at round end
- Maximum of 8 players per room
