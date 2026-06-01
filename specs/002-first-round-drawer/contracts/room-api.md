# Room API: Game Start & Round Polling

## POST /api/rooms/:code/start

Start the game, transitioning the room from Lobby to Playing.

**Request:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | yes | The caller's participant ID (must be the host) |

**Response `200`:**

```json
{
  "game": {
    "roomCode": "ABCD",
    "status": "playing",
    "roundNumber": 1,
    "drawerId": "uuid-of-host",
    "drawerName": "HostName",
    "startedAt": "2026-06-01T12:00:00.000Z",
    "endsAt": "2026-06-01T12:01:00.000Z"
  }
}
```

| Field | Description |
|-------|-------------|
| `game.roomCode` | The room code the game belongs to |
| `game.status` | Always `"playing"` on success |
| `game.roundNumber` | Always 1 for the first round |
| `game.drawerId` | Participant ID of the drawer (the host) |
| `game.drawerName` | Display name of the drawer |
| `game.startedAt` | ISO 8601 timestamp of round start |
| `game.endsAt` | ISO 8601 timestamp of round end (startedAt + 60s) |

**Note:** The secret word is NOT included in the start response. It is delivered only via the round polling endpoint and only when the requesting participant is the drawer.

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Not the host | `{ "message": "Only the host can start the game" }` |
| `400` | Fewer than 2 players | `{ "message": "At least 2 players required to start" }` |
| `400` | Game already started | `{ "message": "Game has already started" }` |
| `404` | Room not found | `{ "message": "Room not found" }` |

---

## GET /api/games/:code/round

Poll for the current round state. Called every ~2s by all players.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | yes | The caller's participant ID |

**Response `200` (drawer is the caller):**

```json
{
  "round": {
    "number": 1,
    "status": "playing",
    "drawerId": "uuid-of-host",
    "drawerName": "HostName",
    "amDrawer": true,
    "secretWord": "rocket",
    "startedAt": "2026-06-01T12:00:00.000Z",
    "endsAt": "2026-06-01T12:01:00.000Z"
  }
}
```

**Response `200` (non-drawer caller):**

```json
{
  "round": {
    "number": 1,
    "status": "playing",
    "drawerId": "uuid-of-host",
    "drawerName": "HostName",
    "amDrawer": false,
    "startedAt": "2026-06-01T12:00:00.000Z",
    "endsAt": "2026-06-01T12:01:00.000Z"
  }
}
```

| Field | Drawer | Non-drawer |
|-------|--------|------------|
| `round.secretWord` | ✅ Included | ❌ Excluded |

**Response `200` (round ended):**

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
    "endedAt": "2026-06-01T12:01:00.000Z"
  }
}
```

**Note:** When `status` is `"round_end"`, the secret word is visible to all players (revealed).

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| `404` | Game not found / room not playing | `{ "message": "No active game for this room" }` |
| `400` | Missing `participantId` | `{ "message": "participantId is required" }` |
