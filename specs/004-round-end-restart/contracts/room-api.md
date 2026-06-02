# Room API: Round End & Restart

This document extends the contracts from `specs/003-guess-submission-scoring/contracts/room-api.md` with round result state and game restart functionality.

---

## GET /api/games/:code/round (Extended)

The round poll response is extended with a `resultExpiresAt` field when the round has ended.

**Response `200` (round ended — all players):**

```json
{
  "round": {
    "number": 1,
    "status": "round_end",
    "drawerId": "uuid-of-host",
    "drawerName": "HostName",
    "amDrawer": false,
    "secretWord": "rocket",
    "startedAt": "2026-06-01T12:00:00.000Z",
    "endsAt": "2026-06-01T12:01:00.000Z",
    "endedAt": "2026-06-01T12:01:00.000Z",
    "resultExpiresAt": "2026-06-01T12:02:00.000Z",
    "guesses": [
      {
        "id": "uuid",
        "participantId": "uuid-of-guesser",
        "participantName": "PlayerName",
        "content": "guess text",
        "isCorrect": false,
        "submittedAt": "2026-06-01T12:00:30.000Z"
      }
    ],
    "scores": [
      { "participantId": "uuid-of-host", "participantName": "HostName", "score": 0 },
      { "participantId": "uuid-of-guesser", "participantName": "PlayerName", "score": 100 }
    ],
    "canvas": {
      "strokes": [],
      "cleared": false,
      "updatedAt": "2026-06-01T12:01:00.000Z"
    },
    "guessedCorrectly": true
  }
}
```

**New field:**

| Field | Type | Description |
|-------|------|-------------|
| `round.resultExpiresAt` | `string` (ISO 8601) \| `null` | When the result state auto-timeouts; null when status is not `round_end` |

**Response `200` (game not active — after restart or before start):**

```json
{
  "round": null
}
```

**Note:** The `round` field is `null` when there is no active game. The frontend should redirect to the lobby when it receives `round: null`.

---

## POST /api/games/:code/restart

Restart the game, transitioning from result state back to lobby. Only the host may call this.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | yes | The caller's participant ID (must be the host) |

**Response `200`:**

```json
{
  "success": true,
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-of-host",
    "participants": [
      {
        "id": "uuid-of-host",
        "name": "HostName",
        "joinedAt": "2026-06-01T12:00:00.000Z"
      },
      {
        "id": "uuid-of-guesser",
        "name": "PlayerName",
        "joinedAt": "2026-06-01T12:00:05.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Notes:**
- After restart, `room.status` is `"lobby"`
- `room.gameStartedAt`, `room.drawerId`, and `room.drawerName` are removed (absent)
- All participants from the game are preserved
- Room settings (code, name) are unchanged
- The frontend should navigate to the lobby view upon receiving this response

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Not the host | `{ "message": "Only the host can restart" }` |
| `400` | Game not in result state | `{ "message": "Game is not in result state" }` |
| `404` | Game not found | `{ "message": "No active game for this room" }` |

---

## GET /api/rooms/:code (Extended - Restart Detection)

Non-host players can detect that a game has been restarted by polling the lobby endpoint. After restart, `gameStartedAt`, `drawerId`, and `drawerName` are removed from the response (same as the "before game" state in spec 002).

**Response `200` (after restart):**

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-of-host",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": ["drawer", "guesser"]
  }
}
```

| Field | Before game start | During game | After restart |
|-------|-------------------|-------------|---------------|
| `room.status` | `"lobby"` | `"lobby"` | `"lobby"` |
| `room.gameStartedAt` | ❌ Absent | ✅ Present | ❌ Absent |
| `room.drawerId` | ❌ Absent | ✅ Present | ❌ Absent |
| `room.drawerName` | ❌ Absent | ✅ Present | ❌ Absent |
