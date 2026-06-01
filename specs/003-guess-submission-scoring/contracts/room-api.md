# Room API: Guess Submission & Canvas Sync

This document extends the contracts from `specs/002-first-round-drawer/contracts/room-api.md` with guess submission, guess history, scoring, and canvas state endpoints.

---

## POST /api/games/:code/guess

Submit a guess during an active round.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | yes | The guesser's participant ID |
| `content` | `string` | yes | The guess text (will be trimmed server-side) |

**Response `200` (accepted — incorrect):**

```json
{
  "result": "incorrect",
  "guess": {
    "id": "uuid",
    "participantId": "uuid-of-guesser",
    "participantName": "PlayerName",
    "content": "guess text",
    "isCorrect": false,
    "submittedAt": "2026-06-01T12:00:30.000Z"
  }
}
```

**Response `200` (accepted — correct):**

```json
{
  "result": "correct",
  "guess": {
    "id": "uuid",
    "participantId": "uuid-of-guesser",
    "participantName": "PlayerName",
    "content": "secret word",
    "isCorrect": true,
    "submittedAt": "2026-06-01T12:00:30.000Z"
  },
  "scoreAwarded": 100,
  "totalScore": 100
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Empty guess after trimming | `{ "message": "Guess cannot be empty" }` |
| `400` | Guesser already guessed correctly this round | `{ "message": "You have already guessed correctly" }` |
| `400` | Round not active (ended or not started) | `{ "message": "Round is not active" }` |
| `400` | Drawer cannot submit guesses | `{ "message": "Drawer cannot submit guesses" }` |
| `404` | Game not found | `{ "message": "No active game for this room" }` |

---

## GET /api/games/:code/round (Extended)

The existing round poll endpoint is extended with guess history, scores, and canvas state.

**Query Parameters:** Same as before with `participantId` (required).

**Additional Response Fields:**

The `round` object now includes these additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `round.guesses` | `Guess[]` | All guesses in the current round (ordered by submission time) |
| `round.scores` | `PlayerScore[]` | All player scores for this game |
| `round.canvas` | `CanvasState \| null` | Current drawing state |
| `round.guessedCorrectly` | `boolean` | Whether the calling participant has already guessed correctly |

**Response `200` (playing — drawer view):**

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
    "endsAt": "2026-06-01T12:01:00.000Z",
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
      "strokes": [
        {
          "id": "stroke-uuid",
          "points": [{ "x": 10, "y": 20 }, { "x": 50, "y": 80 }],
          "lineWidth": 3
        }
      ],
      "cleared": false,
      "updatedAt": "2026-06-01T12:00:25.000Z"
    },
    "guessedCorrectly": false
  }
}
```

**Response `200` (playing — non-drawer view):**

Same structure as drawer view except:
- `round.secretWord` is **excluded**
- `round.canvas` contains the drawing state (same for all players)

**Response `200` (round ended):**

Same structure as above with:
- `round.status` = `"round_end"`
- `round.secretWord` included for all players (revealed)
- `round.guessedCorrectly` still indicates whether the caller guessed correctly
- No new guesses accepted; canvas is frozen

**Note:** The `round.guesses` array contains ALL guesses, including correct ones. The frontend should use `guessedCorrectly` to determine whether to disable the guess input for the current player.

---

## POST /api/games/:code/canvas/sync

Sync the current drawing state to the server. Called periodically by the drawer.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | yes | The drawer's participant ID |
| `strokes` | `Array<{points: {x: number, y: number}[], lineWidth: number}>` | yes | New strokes since last sync |
| `cleared` | `boolean` | yes | Whether the canvas was cleared |

**Response `200`:**

```json
{
  "success": true,
  "strokeCount": 5
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Caller is not the drawer | `{ "message": "Only the drawer can sync the canvas" }` |
| `400` | Round not active | `{ "message": "Round is not active" }` |
| `404` | Game not found | `{ "message": "No active game for this room" }` |
