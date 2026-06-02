# Quickstart: Round End & Restart Flow

## Prerequisites

- Branch: `004-round-end-restart`
- Backend dev server running: `cd backend && npm run dev`
- Frontend dev server running: `cd frontend && npm run dev`
- Guess Submission & Scoring feature (003) fully implemented (guesses, scores, canvas)
- Two browser tabs open with players in an active round

## Verification Steps

### 1. Round end displays the correct word

```text
1. In Browser A (drawer) and Browser B (guesser), wait for the round timer to expire (60s).
2. Verify both browsers show round status as "round_end".
3. Verify Browser B now sees the secret word (previously hidden).
4. Verify the word matches what was selected for the round.
```

### 2. Final scores are visible to all players

```text
1. After the round ends, verify Browser A shows the scoreboard with final scores.
2. Verify Browser B shows the exact same scores.
3. If Browser B guessed correctly during the round, verify its score reflects the +100 points.
```

### 3. Full guess history is displayed

```text
1. After the round ends, verify Browser A shows all guesses submitted during the round.
2. Verify Browser B shows the same guess history.
3. Verify each guess entry shows: guesser name, guessed word, whether it was correct, and timestamp.
```

### 4. Host can restart to lobby

```text
1. After the round ends, verify a "Restart" button is visible on Browser A (host).
2. Verify the restart button is NOT visible on Browser B (non-host).
3. Click the "Restart" button on Browser A.
4. Verify both browsers navigate to the lobby view within 3 seconds.
5. Verify both players are still in the room's participant list.
```

### 5. Round state is cleared on restart

```text
1. After restarting to the lobby, start a new game.
2. Verify the new round has no leftover guesses from the previous round.
3. Verify scores are reset to 0 for all players.
4. Verify the drawer assignment is fresh (not the previous round's drawer).
```

### 6. Auto-timeout returns to lobby

```text
1. Complete a round and wait for the result state to appear.
2. Do NOT click restart — wait 60 seconds.
3. Verify all browsers automatically transition to the lobby.
4. Verify all players are preserved in the lobby.
```

### 7. Host disconnect auto-returns to lobby

```text
1. Complete a round and wait for the result state.
2. Close or navigate away in Browser A (host).
3. Wait 15-30 seconds.
4. Verify Browser B (non-host) auto-transitions to the lobby.
5. Verify all remaining players are preserved in the lobby.
```

## API Endpoints to Test

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/games/:code/round` | GET | Poll round state (includes result data) |
| `/api/games/:code/restart` | POST | Host restarts game back to lobby |
| `/api/rooms/:code` | GET | Poll room state (detect restart via absent game fields) |

## Frontend Components to Verify

| Component | Purpose |
|-----------|---------|
| `RoundResult` (new) | Displays correct word, final scores, full guess history |
| `GameRoom` (modified) | Result state view with restart button for host |
| `Lobby` (modified) | Post-restart lobby with preserved players |
