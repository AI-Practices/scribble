# Quickstart: First Round Drawer Assignment

## Prerequisites

- Branch: `002-first-round-drawer`
- Backend dev server running: `cd backend && npm run dev`
- Frontend dev server running: `cd frontend && npm run dev`
- Room Setup & Lobby feature (001) fully implemented (room creation, joining, lobby polling)

## Verification Steps

### 1. Create a room with 2+ players

```text
1. Open the app in Browser A. Create a room.
2. Open the app in Browser B. Join the room using the displayed code.
3. Both browsers see the lobby with both players listed.
```

### 2. Start the game (host only)

```text
1. In Browser A (host), verify a "Start Game" button is visible.
2. In Browser B (non-host), verify no "Start Game" button is visible.
3. Click "Start Game" in Browser A.
4. Verify both browsers navigate to the game screen within 2 seconds.
```

### 3. Verify drawer identification

```text
1. After game starts, verify Browser A (host) is identified as the drawer.
2. Verify Browser B sees Browser A identified as the drawer.
```

### 4. Verify secret word visibility

```text
1. In Browser A (drawer), verify the secret word is displayed.
2. In Browser B (non-drawer), verify NO secret word is visible on screen or page source.
```

### 5. Verify deterministic word selection

```text
1. Note the secret word shown to the drawer.
2. Stop both servers, restart, and recreate the exact same room.
3. Start the game again.
4. Verify the same word is selected. (Note: this depends on room code + round number — if room code differs, word may differ.)
```

### 6. Verify round timer

```text
1. Start a game and note the round start time.
2. Verify the round ends after 60 seconds (status changes to "round_end").
3. Verify the secret word is revealed to all players after the round ends.
```

## API Endpoints to Test

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rooms/:code/start` | POST | Start the game (host only) |
| `/api/games/:code/round` | GET | Poll round state (all players) |
