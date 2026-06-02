# Research: Room Setup & Lobby

## Overview

Analysis of the existing codebase to identify gaps between current implementation
and the feature specification for Room Setup & Lobby.

## Existing Patterns vs Required Changes

### Backend: Room Model (`backend/src/models/game.ts`)

- **Decision**: Add `hostId` field to `Room` interface
- **Rationale**: The current model has no concept of a host. The spec requires the
  room creator to be assigned as host with exclusive start-game privileges.
- **Alternatives considered**: Deriving host from first participant (order-dependent,
  fragile), separate host store (over-engineering for a single field)

### Backend: Room Store (`backend/src/services/roomStore.ts`)

- **Decision**: Track `hostId` on `Room`, validate on create/join
- **Changes**:
  - `createRoom`: Set `hostId` to the first participant's ID
  - `joinRoom`: Accept `code` only; reject empty codes, unknown codes, duplicate join
  - `getRoom`: Return snapshot with `hostId` exposed
  - Outgoing `joinRoom` returning `null` → throw proper errors for each failure mode
- **Alternatives considered**: Using `participants[0].id` dynamically each time
  (breaks on host transfer)

### Backend: API Routes (`backend/src/api/rooms.ts`)

- **Decision**: Improve error messages, add host to room snapshot
- **Rationale**: Current 404 "Unable to join room" is too generic. Need distinct
  messages for: empty code, room not found, already in room.
- **Changes**:
  - POST `/rooms`: Validate `playerName` (trim, reject empty/whitespace-only)
  - POST `/rooms/:code/join`: Validate `playerName`, return specific error messages
  - GET `/rooms/:code`: Expose `hostId` in snapshot

### Frontend: API Client (`frontend/src/services/api.ts`)

- **Decision**: No changes needed to existing methods
- **Rationale**: Current methods (createRoom, joinRoom, fetchRoom) have the right shape.
  Frontend will use new response fields.

### Frontend: Room Store (`frontend/src/state/roomStore.ts`)

- **Decision**: Add auto-polling lifecycle management
- **Changes**:
  - `startPolling(intervalMs)`: Begins `setInterval` calling `fetchRoom`
  - `stopPolling()`: Clears the interval
  - Track `isHost` derived from `participantId === room.hostId`
- **Alternatives considered**: Polling inside LobbyPage (couples UI to lifecycle),
  polling inside api.ts (wrong layer)

### Frontend: LobbyPage (`frontend/src/pages/LobbyPage.tsx`)

- **Decision**: Replace manual refresh with auto-polling + connection indicator
- **Changes**:
  - `useEffect` starts polling on mount, stops on unmount
  - Start button visible only when `isHost && participants.length >= 2`
  - Show "connection issue" indicator when consecutive polls fail
  - Keep manual refresh as fallback

### Frontend: CreateRoomPage & JoinRoomPage

- **Decision**: Add client-side validation before submit
- **Changes**:
  - Trim `playerName` on input
  - Reject empty/whitespace-only names with inline error
  - JoinRoomPage: Validate room code non-empty before submit

## State Model

```
Room {
  code: string          // 4-char alphanumeric (generated)
  status: "lobby"      // (expanded in later features)
  hostId: string       // NEW: participant ID of the host
  participants: Participant[]
  createdAt: string
  updatedAt: string
}

Participant {
  id: string           // UUID
  name: string         // trimmed, non-empty
  joinedAt: string
}

RoomSnapshot {
  code: string
  status: "lobby"
  hostId: string       // NEW
  participants: Participant[]
}
```

## Data Flow

```
Create Room:
  CreateRoomPage → roomStore.createRoom(name)
    → api POST /rooms { playerName }
    → backend validates name, creates Room with hostId
    → returns { participantId, room { hostId, ... } }
    → store saves participantId + room
    → navigate /lobby

Join Room:
  JoinRoomPage → roomStore.joinRoom(code, name)
    → api POST /rooms/:code/join { playerName }
    → backend validates code + name, adds participant
    → returns { participantId, room { hostId, ... } }
    → store saves participantId + room
    → navigate /lobby

Poll Lobby:
  LobbyPage mount → roomStore.startPolling(2000)
    → setInterval → roomStore.fetchRoom()
      → api GET /rooms/:code?participantId=...
      → backend returns RoomSnapshot
      → store updates room state → UI re-renders
  LobbyPage unmount → roomStore.stopPolling()

Start Game:
  Host clicks Start → (POST /rooms/:code/start — future feature)
```

## Risks

1. **Polling race conditions**: If a poll response arrives after the component
   unmounts, `setState` on unmounted component. Mitigated by React 18 strict mode
   and cleanup in `stopPolling`.
2. **Host tab close**: Host closes browser during lobby → other players stuck.
   Mitigated by host transfer (spec clarification).
3. **Collision on room codes**: 4-char alphanumeric (30^4 = 810k combos) sufficient
   for dozens of simultaneous rooms.
