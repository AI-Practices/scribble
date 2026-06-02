# Quickstart: Guess Submission & Scoring

## Prerequisites

- Branch: `003-guess-submission-scoring`
- Backend dev server running: `cd backend && npm run dev`
- Frontend dev server running: `cd frontend && npm run dev`
- First Round Drawer Assignment feature (002) fully implemented (game start, round polling, timer)
- Two browser tabs open with players in an active round

## Verification Steps

### 1. Drawer can draw on the canvas

```text
1. In Browser A (drawer), verify a drawing canvas is visible.
2. Click and drag on the canvas to draw a line.
3. Verify the line appears immediately on Browser A's screen.
4. Click the "Clear" button.
5. Verify the canvas is cleared on Browser A's screen.
```

### 2. Guessers can see the drawing

```text
1. In Browser A (drawer), draw a visible shape on the canvas.
2. In Browser B (guesser), wait up to 3 seconds for the poll response.
3. Verify the drawing appears on Browser B's screen.
4. Verify it matches what the drawer drew.
```

### 3. Submit a guess with validation

```text
1. In Browser B (guesser), type a guess in the guess input field.
2. Submit the guess.
3. Verify feedback is received within 2 seconds (incorrect = no score change, correct = 100 points).
4. Submit an empty guess (just spaces).
5. Verify a rejection message is shown.
6. Submit a guess that matches the secret word but with different casing.
7. Verify it is accepted as correct.
```

### 4. Guess history visible to all players

```text
1. Submit several guesses from Browser B.
2. In Browser A (drawer), verify all guesses appear in the guess history within 3 seconds.
3. In Browser B, verify its own guesses appear in the history.
4. Verify each guess shows the submitter name, content, and whether it was correct.
```

### 5. Correct guesser input is disabled

```text
1. In Browser B, submit the correct secret word.
2. Verify Browser B's score updates to 100.
3. Verify Browser B's guess input is disabled.
4. Attempt to submit another guess from Browser B.
5. Verify the submission is rejected.
```

### 6. Scoring visible to all

```text
1. After a correct guess, verify all browsers show the updated scoreboard.
2. Verify incorrect guesses leave the score unchanged.
```

## API Endpoints to Test

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/games/:code/guess` | POST | Submit a guess |
| `/api/games/:code/round` | GET | Poll round state (includes guesses, scores, canvas) |
| `/api/games/:code/canvas/sync` | POST | Sync canvas state (drawer only) |

## Frontend Components to Verify

| Component | Purpose |
|-----------|---------|
| `DrawingCanvas` | Freehand drawing tool for the drawer |
| `GuessForm` | Guess input with validation feedback |
| `GuessHistory` | List of all guesses in the round |
| `Scoreboard` | Live score display for all players |
