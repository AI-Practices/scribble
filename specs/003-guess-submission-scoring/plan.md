# Implementation Plan: Guess Submission & Scoring

**Branch**: `003-guess-submission-scoring` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-guess-submission-scoring/spec.md`

## Summary

Extend the active round with drawing canvas functionality for the drawer, guess submission with validation (trim, case-insensitive compare, reject empty), guess history synced to all players via polling, and scoring (correct = 100, incorrect = 0). The drawing canvas state is replicated to guessers via polling.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js backend, React frontend)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory (no database). Guesses and scores stored in module-level `Map`s alongside existing Room/Game stores.

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browser (Chrome/Firefox/Safari), Node.js 18+ server

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Drawing appears on guesser screens within 3s (polling interval), guess feedback within 2s, 60s round timer maintained from existing feature

**Constraints**: In-memory only, no WebSockets, no databases, no auth, Zod validation on all API inputs, RoomStore pattern for frontend state

**Scale/Scope**: Small multiplayer game rooms (<10 players per room), single-server deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **TypeScript Strictness Gate** — All new code fully typed; no `any`. ✓
2. **Architecture Gate** — Backend layering (api/services/models), functional React + hooks, Zod validation, RoomStore state. ✓
3. **HTTP-Only Sync Gate** — No WebSockets; canvas state and guess history synced via HTTP polling. ✓
4. **In-Memory Gate** — Guesses and scores stored in-memory alongside Room/Game stores. ✓
5. **Deterministic Logic Gate** — Scoring (100 per correct guess, 0 otherwise) is deterministic; guess comparison is case-insensitive exact match. ✓
6. **Brownfield Gate** — Inspect existing codebase before writing; extend existing services and components. ✓

## Project Structure

### Documentation (this feature)

```text
specs/003-guess-submission-scoring/
├── plan.md              # This file
├── research.md          # Phase 0 output — canvas sync strategy
├── data-model.md        # Phase 1 output — Guess, Score entities
├── quickstart.md        # Phase 1 output — verification steps
├── contracts/           # Phase 1 output — API endpoint contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Add Guess, GuessHistory, PlayerScore types
│   ├── services/
│   │   ├── roomStore.ts         # Unchanged
│   │   ├── gameStore.ts         # Extend with guess submission, scoring
│   │   └── canvasStore.ts       # NEW — in-memory canvas state per round
│   └── api/
│       ├── router.ts            # Mount guess routes
│       ├── schemas.ts           # Add guess submission schemas
│       ├── games.ts             # Extend round poll response with guesses/scores
│       └── guesses.ts           # NEW — guess submission endpoint

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               # Add submitGuess, extend fetchRound response types
│   ├── state/
│   │   └── roomStore.ts         # Add guess history, scores, canvas to RoundState
│   ├── components/
│   │   ├── DrawingCanvas.tsx    # NEW — freehand drawing component
│   │   ├── GuessForm.tsx        # Update with real submission + validation
│   │   ├── GuessHistory.tsx     # NEW — guess list display
│   │   └── Scoreboard.tsx       # Update with real scores
│   └── pages/
│       └── GamePage.tsx         # Wire drawing canvas, guess form, history, scores
```

**Structure Decision**: Web application with backend + frontend as established in the existing project. New files added alongside existing ones; no structural changes.

## Complexity Tracking

> No Constitution violations — all gates pass without complexity concessions.
