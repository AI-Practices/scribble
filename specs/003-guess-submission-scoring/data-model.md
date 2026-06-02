# Data Model: Guess Submission & Scoring

## Entities

### Guess
A single guess submitted by a non-drawer player during an active round.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique guess identifier |
| `roundNumber` | `number` | The round this guess belongs to |
| `participantId` | `string` | The guesser's participant ID |
| `content` | `string` | Trimmed guess text |
| `isCorrect` | `boolean` | Whether the guess matches the secret word |
| `submittedAt` | `string` (ISO 8601) | When the guess was submitted |

**Validation Rules:**
- `content` is trimmed (no leading/trailing whitespace) before storage
- `content` must be non-empty after trimming (rejected with error)
- Comparison against secret word is case-insensitive exact match
- A guesser who already submitted a correct guess cannot submit more guesses
- Duplicate correct guesses from the same guesser in the same round are not awarded additional points

### PlayerScore
Per-player cumulative score within a game.

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | The player's participant ID |
| `participantName` | `string` | Display name |
| `score` | `number` | Cumulative points (starts at 0) |

**Validation Rules:**
- `score` starts at 0 for all players
- `score` increases by exactly 100 on each first-time correct guess
- `score` never decreases
- Duplicate correct guesses from the same player do not change the score

### CanvasStroke
A single drawing stroke on the canvas.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique stroke identifier |
| `points` | `Array<{x: number, y: number}>` | Ordered points along the stroke path |
| `lineWidth` | `number` | Stroke thickness in pixels |

**Validation Rules:**
- `points` must contain at least 2 coordinates to form a visible stroke
- Coordinates are relative to the canvas dimensions (0-1 normalized or pixel-based)

### CanvasState
The complete drawing state for a round, stored on the server and polled by guessers.

| Field | Type | Description |
|-------|------|-------------|
| `roundNumber` | `number` | The round this canvas belongs to |
| `strokes` | `CanvasStroke[]` | All strokes drawn so far |
| `cleared` | `boolean` | Whether the canvas has been cleared (strokes empty after clear) |
| `updatedAt` | `string` (ISO 8601) | When the canvas was last modified |

**Validation Rules:**
- CanvasState is initialized empty when a round starts
- `cleared` resets `strokes` to an empty array
- CanvasState is replicated to guessers via polling

### Game Extension (added fields)
The existing Game entity is extended with:

| Field | Type | Description |
|-------|------|-------------|
| `scores` | `PlayerScore[]` | All player scores for this game |
| `guesses` | `Guess[]` | All guesses submitted in the current round |
| `correctGuessers` | `string[]` | Participant IDs who guessed correctly this round (for input disable enforcement) |

## State Transitions

```
Playing (Round Active)
    │
    ├── guesser submits guess ──→ guess recorded (correct/incorrect)
    │       │
    │       └── if correct ──→ score += 100, guesser added to correctGuessers
    │
    ├── drawer draws ──→ stroke appended to CanvasState
    │
    ├── drawer clears ──→ CanvasState.strokes emptied
    │
    └── (60s timer expires) ──→ Round End
```

## Relationships

- A **Game** has many **Guesses** (per round, cleared between rounds)
- A **Game** has many **PlayerScores** (one per participant, persisted across rounds)
- A **Round** has one **CanvasState**
- A **Guess** belongs to one **Game** and one **Round**
- A **PlayerScore** belongs to one **Game** and one **Participant**
