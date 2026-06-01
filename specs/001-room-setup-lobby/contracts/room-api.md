# Room API Contracts

Base URL: `http://localhost:3001`

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms

Create a new room. The creator becomes the host.

### Request

```json
{
  "playerName": "Alice"
}
```

`playerName`: string, optional. If empty or whitespace-only after trimming,
defaults to "Player" on server or returns a validation error per spec (TBD).

### Response (201)

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-06-01T12:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid request payload" }` |

---

## POST /rooms/:code/join

Join an existing room by its code.

### Request

```json
{
  "playerName": "Bob"
}
```

`playerName`: string, optional. Server trims whitespace; rejects empty with 400.

### Response (200)

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-string", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors

| Status | Body |
|--------|------|
| 400 | `{ "message": "Room code is required" }` — empty/missing code param |
| 400 | `{ "message": "Player name is required" }` — empty name after trim |
| 404 | `{ "message": "Room not found" }` — code does not match any room |
| 409 | `{ "message": "You are already in this room" }` — duplicate join |

---

## GET /rooms/:code

Fetch the current room snapshot (used for polling).

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string | no | Viewer's participant ID (reserved for future use) |

### Response (200)

```json
{
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-string", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors

| Status | Body |
|--------|------|
| 404 | `{ "message": "Room not found" }` — room does not exist |
