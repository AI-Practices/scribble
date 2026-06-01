# Data Model: Room Setup & Lobby

## Entities

### Room

Represents a single game instance in the in-memory store.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Unique 4-char alphanumeric room identifier (auto-generated) |
| `status` | `"lobby"` | yes | Current room phase (expanded in later features) |
| `hostId` | `string` | yes | UUID of the participant who is the host |
| `participants` | `Participant[]` | yes | List of participants currently in the room |
| `createdAt` | `string` (ISO) | yes | Timestamp of room creation |
| `updatedAt` | `string` (ISO) | yes | Timestamp of last room mutation |

### Participant

Represents a single player in a room.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | yes | Unique participant identifier (server-generated) |
| `name` | `string` | yes | Display name, trimmed, non-empty |
| `joinedAt` | `string` (ISO) | yes | Timestamp when participant joined |

## RoomSnapshot

Public-facing representation returned by the API (no internal fields exposed).

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `"lobby"` | Current status |
| `hostId` | `string` | Participant ID of the host |
| `participants` | `Participant[]` | All participants in the room |
| `availableWords` | `string[]` | Starter word list (for reference) |
| `roles` | `string[]` | Available roles (drawer, guesser) |

## State Transitions

```
[Room does not exist]
    ↓ POST /rooms (create)
[lobby] ←──────────────┐
    ↓                   │
  POST /rooms/:code/join│
    ↓                   │
[lobby with 2+ players] │
    ↓                   │
  Host clicks Start     │
    ↓                   │
[active]  ← future feature, will add status transition
    ↓                   │
  Game restarts ────────┘
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `playerName` on create/join | Must be non-empty after trimming whitespace | "Player name is required" |
| `code` on join | Must be non-empty after trimming | "Room code is required" |
| `code` on join | Must match an existing room | "Room not found" |
| Duplicate join | Participant ID must not already be in room | "You are already in this room" |
| Host start | Only `hostId` can start; only when ≥2 participants | (future) |
