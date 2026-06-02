# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room (Priority: P1)

A player opens the app and creates a new drawing game room. The system generates a unique room code and assigns them as the host. They are taken to the lobby where they can wait for others to join.

**Why this priority**: Room creation is the entry point for all multiplayer gameplay — without it, no game can start.

**Independent Test**: A player can open the app, tap "Create Room", and immediately see a unique room code on the lobby screen confirming they are the host.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen, **When** they select "Create Room", **Then** a new room is created, a unique code is displayed, and the player is assigned as host
2. **Given** a room has been created, **When** another player creates a room, **Then** both rooms exist simultaneously and each has a different code
3. **Given** a player has created a room, **When** they view the lobby, **Then** the room code is visible so they can share it

---

### User Story 2 - Join Room (Priority: P1)

A player with a room code enters it to join an existing game. Invalid, malformed, or empty codes are rejected with clear messages. On success, they enter the lobby and see the current participants.

**Why this priority**: Joining is the second entry point — without it, no second player can enter the game.

**Independent Test**: A player can enter a valid room code and immediately see themselves listed in the lobby alongside the host.

**Acceptance Scenarios**:

1. **Given** a room exists with a valid code, **When** a player enters the exact code, **Then** they join the room and see the lobby with other participants
2. **Given** a player enters an empty code, **When** they submit the join form, **Then** they see a clear error message and are not added to any room
3. **Given** a player enters a code that does not match any existing room, **When** they submit, **Then** they see a clear error message and are not added to any room

---

### User Story 3 - Lobby with Auto-Polling (Priority: P1)

All players in a room see the lobby screen with a live participant list that refreshes automatically. When a new player joins, everyone's list updates within a few seconds without manual refresh.

**Why this priority**: Real-time lobby visibility enables players to know when the room is ready to start.

**Independent Test**: Two browsers join the same room; each sees the other appear in the participant list within 3 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins, **Then** the participant list updates within 3 seconds
2. **Given** multiple players are in the lobby, **When** any player views the screen, **Then** they see all current participants listed

---

### User Story 4 - Host-Only Start (Priority: P2)

Only the host can start the game, and only when at least 2 players are present. The start button is visible only to the host and becomes enabled when enough players have joined.

**Why this priority**: The host-start rule ensures clear ownership of the game flow. It is P2 because the core lobby experience is usable without it, but the game cannot proceed to round play without this capability.

**Independent Test**: The host sees a start button; non-hosts do not. The start button is disabled when only one player is present and becomes enabled when a second joins.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby with fewer than 2 players, **When** they look for the start control, **Then** it is disabled or hidden with a message explaining more players are needed
2. **Given** a host is in the lobby with at least 2 players, **When** they select start, **Then** the game begins
3. **Given** a non-host player is in the lobby, **When** they view the screen, **Then** they do not see a start button

---

### Edge Cases

- Player attempts to join a room they are already in — error message shown, no duplicate entry
- Player enters a room code with surrounding whitespace — trimmed and matched correctly
- Room creator loses connection or leaves — host transfers to the next player who joined; the new host retains start-game privileges
- Player enters a code with special characters or wrong casing — matched correctly or rejected with clear guidance
- Multiple simultaneous join attempts — all processed, all participants reflected in lobby
- Poll request fails (network error) — lobby shows stale participant list with a subtle connection issue indicator; retries silently

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code when a player creates a room
- **FR-002**: The player who creates a room MUST be assigned as the host
- **FR-003**: Players MUST be able to join a room by providing a valid room code
- **FR-004**: System MUST reject empty or invalid room codes with a clear error message
- **FR-005**: Room codes MUST be case-insensitive and trimmed of whitespace on entry
- **FR-006**: Rooms MUST be fully isolated — players in one room cannot see or affect another room's state
- **FR-007**: The lobby MUST display all connected players in the room
- **FR-008**: The lobby MUST refresh the participant list via polling at approximately 2-second intervals
- **FR-009**: Only the host can start the game
- **FR-010**: The game can only start when at least 2 players are present in the room
- **FR-011**: Player names MUST be trimmed of leading and trailing whitespace on entry
- **FR-012**: Empty or whitespace-only player names MUST be rejected with a clear message
- **FR-013**: When a poll request fails, the lobby MUST continue showing the last known participant list with a subtle connection indicator; it MUST NOT show a full error state

### Key Entities *(include if feature involves data)*

- **Room**: Represents a single game instance. Has a unique code, a host player, a list of participants, and a status (lobby/active/ended). Isolated from all other rooms.
- **Player**: A participant in a room. Has a display name and may be the host. Identified within a room context.
- **Lobby State**: The current snapshot of a room's participant list and host identity, refreshed periodically via polling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see their unique code within 5 seconds of selecting "Create Room"
- **SC-002**: A second player can join a room within 5 seconds of entering a valid room code
- **SC-003**: Invalid room codes display a clear error message within 2 seconds of submission
- **SC-004**: Empty room codes display a clear validation message before any network request
- **SC-005**: The lobby participant list updates within 3 seconds of another player joining
- **SC-006**: Two separate rooms do not show each other's players at any point
- **SC-007**: The host can start the game within 5 seconds of the second player appearing in the lobby
- **SC-008**: Non-host players never see a start-game control

## Assumptions

- Room codes are auto-generated by the system (players do not choose them)
- Room codes use a short alphanumeric format sufficient to avoid collisions at small scale (e.g., 4 characters)
- Players identify themselves with a display name on create or join (no persistent accounts)
- A single browser tab equals one player session
- Network connectivity is stable enough for polling every 2 seconds
- The system handles at most a few dozen simultaneous rooms
- Polling is acceptable for the lobby use case; no real-time push is required
- Hosts are expected to remain connected during the lobby phase

## Clarifications

### Session 2026-06-01

- Q: What happens when host disconnects? → A: Host transfers to the next player who joined; the new host retains start-game privileges
- Q: What should the UI show when a poll fails? → A: Show stale data with a "connection issue" indicator, retry silently
