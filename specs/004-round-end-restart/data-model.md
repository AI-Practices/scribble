# Data Model: Round End & Restart Flow

## Entities

### Game Extension (added fields)

The existing Game entity (from spec 002) is extended with:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"lobby" \| "playing" \| "round_end"` | Game lifecycle status |
| `resultExpiresAt` | `string` (ISO 8601) \| `null` | When the result state auto-timeouts (null if not in round_end) |

**Validation Rules:**
- `status` transitions: `"playing"` → `"round_end"` → `"lobby"` (via restart)
- `resultExpiresAt` is set when entering `"round_end"` = now + 60s
- `resultExpiresAt` is null when not in `"round_end"` state
- Game status is `null` (no game) when Room is in lobby before any game starts
- Game entity is cleared on restart (round, guesses, correctGuessers nullified) but not deleted

### Room Extension (no new fields)

The existing Room entity requires no new fields. Room settings (name, code, participants) are naturally preserved because the restart handler operates on the Game entity, not the Room entity.

**Note**: The Room's `status` field transitions to `"lobby"` on restart. Room fields `gameStartedAt`, `drawerId`, `drawerName` (added during game start per spec 002) are cleared on restart.

### Round

No changes to the Round entity. The existing round carries all result data:
- `number`, `drawerId`, `secretWord`, `startedAt`, `endsAt`
- `guesses` (all guesses submitted in this round)
- `scores` (cumulative player scores)
- `canvas` (frozen drawing state)

## State Transitions

```
Playing (Round Active)
    │
    │ (60s timer expires)
    ▼
Round End (Result State)
    │
    ├── host triggers restart ──→ Lobby (players preserved, round state cleared, settings kept)
    ├── host disconnects (15-30s) ──→ Lobby (auto-return)
    └── 60s timeout ──→ Lobby (auto-return)
```

### Transition Details

| From | To | Trigger | Side Effects |
|------|----|---------|--------------|
| `"playing"` | `"round_end"` | Round timer expires | `resultExpiresAt` set; `secretWord` revealed to all |
| `"round_end"` | `"lobby"` | Host POST /restart | Game round data cleared; Room status → lobby; Room game fields removed |
| `"round_end"` | `"lobby"` | Host disconnect (15-30s no poll) | Same as restart |
| `"round_end"` | `"lobby"` | 60s result timeout | Same as restart |

## Validation Rules (restart endpoint)

- Only the host may trigger restart
- Restart is only valid when Game status is `"round_end"`
- On restart, the Game's round object is nullified, guesses and correctGuessers arrays are cleared
- Room participants array is not modified on restart
- Room settings (code, name) are not modified on restart

## Relationships

- A **Game** has zero or one **Round** (null after restart)
- A **Game** has many **PlayerScores** (cleared on restart)
- A **Game** has many **Guesses** (cleared on restart)
- A **Room** has zero or one **Game** (null when in lobby state)
