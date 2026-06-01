# Data Model: First Round Drawer Assignment

## Entities

### Game
Wraps a Room when it transitions from Lobby to Playing. Managed alongside the Room in memory.

| Field | Type | Description |
|-------|------|-------------|
| `roomCode` | `string` | Links to the parent Room's code |
| `status` | `"playing" \| "round_end"` | Current game status |
| `round` | `Round \| null` | The active/finished round |
| `roundNumber` | `number` | Current round number (1-indexed) |
| `createdAt` | `string` (ISO 8601) | When the game started |

**Validation Rules:**
- `roomCode` must reference an existing Room
- `status` transitions: `"playing"` → `"round_end"`
- Game created atomically on Lobby-to-Playing transition

### Round
A single drawing round within a Game.

| Field | Type | Description |
|-------|------|-------------|
| `number` | `number` | Round number (1 for first round) |
| `drawerId` | `string` | Participant.id of the drawer |
| `secretWord` | `string` | The word selected for this round |
| `startedAt` | `string` (ISO 8601) | When the Playing state was entered |
| `endsAt` | `string` (ISO 8601) | When the timer expires (startedAt + 60s) |

**Validation Rules:**
- `number` ≥ 1, increments by 1 each round
- `drawerId` must match a Participant.id in the parent Room
- `secretWord` must be from the starter list
- `endsAt` = `startedAt` + 60 seconds

### Word Selection Determinism

The secret word is derived deterministically:
```
index = hash(roomCode + ":" + roundNumber) % STARTER_WORDS.length
secretWord = STARTER_WORDS[index]
```

**Validation Rules:**
- Same `(roomCode, roundNumber)` always produces the same word
- `index` is always within `[0, STARTER_WORDS.length)`

## State Transitions

```
 Lobby ──(host starts game, ≥2 players)──▶ Playing (Round Active)
                                                │
                                                │ (60s timer expires)
                                                ▼
                                            Round End
```

- **Lobby → Playing**: Atomic transition. Creates Game and Round 1 simultaneously. Assigns host as drawer. Selects word deterministically.
- **Playing → Round End**: Triggered by timer expiry. Round is finalized; drawer and word remain as-set.

## Relationships

- A **Room** has zero or one **Game** (null when in Lobby state)
- A **Game** has exactly one active **Round** at a time
- A **Round** belongs to exactly one **Game**
- A **Round** has one **Drawer** (a **Participant** from the parent Room)
- A **Round** has one **Secret Word** (from the **Starter List**)
