# Research: Guess Submission & Scoring

## Decisions

### D1: Drawing Canvas Implementation

**Decision**: Use HTML5 Canvas API with mouse and touch event handlers.

**Rationale**: HTML5 Canvas is the standard browser API for freehand drawing. It's well-supported across all modern browsers, requires no external dependencies, and directly fits the "basic freehand drawing tool" scope. The canvas element provides `getContext("2d")` for rendering, and events (`mousedown`, `mousemove`, `mouseup`, `touchstart`, `touchmove`, `touchend`) provide input handling.

**Alternatives considered**:
- **SVG**: Better for crisp lines at any zoom level but more complex for freehand drawing (requires converting mouse movements to bezier curves).
- **Third-party libraries** (Fabric.js, Konva): Overkill for a basic drawing tool; add bundle size and dependency management.

### D2: Canvas State Serialization for Polling

**Decision**: Serialize the drawing as a list of strokes (JSON array). Each stroke is an object with a `points` array and styling attributes.

**Rationale**:
- Stroke lists are compact — a typical round produces <50 strokes, each with <100 points (~2KB total).
- The drawer's browser accumulates strokes locally; on each poll, the server returns strokes the guesser hasn't seen yet.
- The guesser's browser renders strokes incrementally using the Canvas API (replaying `lineTo` calls).
- No external libraries needed; the Canvas API `beginPath`/`lineTo`/`stroke` calls can be serialized to/from JSON trivially.

**Alternatives considered**:
- **Base64 PNG data URL**: Requires full canvas serialization on every poll (bandwidth-heavy, 50-200KB per frame). Loses stroke-level granularity (can't append incrementally).
- **SVG serialization**: Clean vector format but more complex to construct from raw mouse events. Requires XML serialization.
- **Incremental stroke IDs**: Each stroke gets a monotonic ID; polling returns only strokes with ID > last seen. More efficient but adds complexity. Deferred to v2 if needed.

### D3: Guess Submission Endpoint Design

**Decision**: REST-style `POST /api/games/:code/guess` with Zod-validated body `{ participantId, content }`. Returns immediate feedback (correct/incorrect/rejected).

**Rationale**:
- Separate endpoint from the round poll endpoint keeps concerns clean.
- Zod validation handles trimming, empty rejection, and type checking server-side.
- Immediate HTTP response provides synchronous feedback (no need to wait for polling).
- Implements SC-003 ("feedback within 2 seconds") — HTTP response is sub-second.

**Alternatives considered**:
- **Submit via round poll**: Include guesses in the round poll. Not RESTful; adds latency to feedback.
- **WebSocket submission**: Prohibited by constitution (HTTP-only sync).
- **PUT to existing resource**: Overloading the round/game resource. Less clean semantically.

### D4: Score Tracking

**Decision**: Store scores as a `Map<string, number>` (participantId → score) in the Game object in `gameStore`. Also maintain a `Set<string>` of participant IDs who have already guessed correctly in the current round (to enforce FR-012b — input disabled after correct guess).

**Rationale**:
- Scores are game-scoped and naturally live alongside the Game entity.
- A simple map is sufficient for <10 players per room.
- The "already correct" set prevents re-scoring and allows the frontend to disable the guess input.
- Scores are included in the round poll response so all players see them update within the polling interval.

**Alternatives considered**:
- **Separate ScoreStore service**: Over-engineered for the scope. Score logic is minimal (increment by 100, no deductions).
- **Computed on-the-fly from guess history**: Requires filtering all guesses every time. Less efficient than a cached running total.
