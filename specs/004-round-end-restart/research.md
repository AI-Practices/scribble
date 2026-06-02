# Research: Round End & Restart Flow

## Decisions

### D1: How to Model Result State

**Decision**: Add a `status: "round_end"` phase to the existing Game entity. When the 60s round timer expires, transition from `"playing"` to `"round_end"`. Extend the Game entity with a `resultExpiresAt` field to track the 60s timeout window. The round object already contains `guesses`, `scores`, and `secretWord` — these are the result data.

**Rationale**: The existing Game already transitions to `"round_end"` on timer expiry (per spec 002 data model). The `guesses` and `scores` arrays already accumulate on the Game (per spec 003). The GET /api/games/:code/round endpoint already exposes `round.status = "round_end"` with `secretWord` revealed to all players. No new entity is needed — the existing data model fully supports result display with minor field additions.

**Alternatives considered**:
- Separate `RoundResult` entity: Unnecessary duplication; the round object already carries all needed data.
- State machine in Room: Game status already serves as the state machine.

### D2: How to Expose Result Data

**Decision**: Extend the existing GET /api/games/:code/round endpoint to include `round.status: "round_end"`, `round.secretWord` (revealed to all), `round.guesses` (full history, already present), and `round.scores` (already present). Add a `round.resultExpiresAt` field so the frontend can show a countdown. No new endpoints needed for read-only result display.

**Rationale**: The existing polling architecture already delivers round data to all players every ~2s. Adding result data to the same response avoids additional HTTP calls and maintains the single-source-of-truth pattern.

**Alternatives considered**:
- New GET /api/games/:code/result endpoint: Adds unnecessary complexity; the existing round endpoint is the natural home for round-end data.

### D3: How to Implement Restart

**Decision**: Add a new POST /api/games/:code/restart endpoint that transitions the game from result state back to lobby. The handler clears round-specific data (guesses, correctGuessers, round object, canvas state) and resets Game status to `null` (no active game). Room settings (name) persist. The Room's `status` transitions back to `"lobby"`. Only the host may call this endpoint.

**Rationale**: A dedicated restart endpoint is clean and follows the existing API pattern (POST for state mutations). Clearing the Game's round data and nullifying `status` naturally returns the room to a lobby-like state where a new game can begin.

**Alternatives considered**:
- DELETE /api/games/:code: Confusing semantics; we want to restart, not delete.
- PATCH /api/games/:code/status: Less explicit; POST restart is more self-documenting.

### D4: How to Handle Auto-Return on Host Disconnect

**Decision**: On the backend, when the host disconnects during `"round_end"` state (detected via failed poll from the host's participantId), start a 15-30 second grace timer. If the host has not re-polled before the timer expires, auto-transition the room to lobby (same logic as restart). The frontend polls the round endpoint as normal and receives the status change.

**Rationale**: The existing polling mechanism naturally detects disconnection — if the host's participantId hasn't polled within the grace window, the server assumes disconnection. This avoids WebSocket-like heartbeat mechanisms and stays within HTTP polling constraints.

**Alternatives considered**:
- Immediate transition: Too abrupt; the host may have a brief network glitch.
- Player vote to restart: Over-engineered for a casual party game; host-centric model is simpler.

### D5: How to Handle 60s Result State Timeout

**Decision**: Use the existing `endsAt` field behavior. When a round enters `"round_end"`, set `resultExpiresAt = now + 60s`. Polling clients check this field. When the server detects `resultExpiresAt` has passed on any poll, it auto-transitions to lobby. This is a passive check — no background timer needed.

**Rationale**: Passive expiry checks on poll are simpler than background timers and consistent with the existing polling architecture. No additional server infrastructure required.

**Alternatives considered**:
- Background `setTimeout`: Unreliable in serverless/shutdown scenarios; passive check is more robust.
- Frontend-only timeout: Could diverge from server state; server must be the authority.

### D6: Room Settings Preservation

**Decision**: Room settings (name) already live on the Room entity, which persists across game lifecycle. The restart handler does not modify Room-level data — it only clears Game-level data. Room settings are naturally preserved by not touching the Room entity.

**Rationale**: Zero additional work — the existing data model separation (Room vs Game) naturally supports settings persistence across game restarts.

**Alternatives considered**:
- Explicit settings copy: Unnecessary; Room is never cleared.
