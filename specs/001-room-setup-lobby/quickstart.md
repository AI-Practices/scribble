# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+ and npm 9+
- Backend and frontend dependencies installed (`cd backend && npm install` and
  `cd frontend && npm install`)

## Run the Backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:3001`.

## Run the Frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`.

## Verify the Feature

### 1. Create a Room

1. Open `http://localhost:5173` in Browser A
2. Enter a player name (e.g., "Alice")
3. Click "Create Room"
4. Verify: You land on the Lobby page showing your room code and "Alice" in the
   participant list

### 2. Join the Room

1. Open `http://localhost:5173` in Browser B (or incognito window)
2. Enter a player name (e.g., "Bob")
3. Enter the room code from step 1.4
4. Click "Join Room"
5. Verify: You land on the same Lobby page with both "Alice" and "Bob" listed

### 3. Verify Auto-Polling

1. Wait up to 3 seconds in either browser
2. Verify: The participant list updates automatically to show both players

### 4. Verify Host-Only Start

1. In Browser A (Alice, the host): Verify a "Start Game" button is visible and
   enabled (2 players present)
2. In Browser B (Bob, not host): Verify no "Start Game" button is visible

### 5. Verify Validation

1. Try creating a room with an empty player name → error message shown
2. Try joining with an invalid room code → "Room not found" error shown
3. Try joining with an empty room code → error shown before network request
4. Try joining the same room twice → "already in this room" error shown

## Run Tests

```bash
cd backend && npm test
cd frontend && npm test
```
