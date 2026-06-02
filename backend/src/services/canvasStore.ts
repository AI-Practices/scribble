import { type CanvasState, type CanvasStroke } from "../models/game.js";
import { HttpError } from "../api/schemas.js";
import { getGame } from "./gameStore.js";
import { getRoom } from "./roomStore.js";

const canvasMap = new Map<string, CanvasState>();

function generateId(): string {
  return crypto.randomUUID();
}

export function getCanvasState(roomCode: string): CanvasState | null {
  const state = canvasMap.get(roomCode);
  return state ? structuredClone(state) : null;
}

export function initCanvasState(roomCode: string): CanvasState {
  const state: CanvasState = {
    strokes: [],
    cleared: false,
    updatedAt: new Date().toISOString()
  };

  canvasMap.set(roomCode, state);
  return state;
}

export function clearCanvasState(roomCode: string) {
  canvasMap.delete(roomCode);
}

export function canvasSync(
  roomCode: string,
  participantId: string,
  strokes: Array<{ points: Array<{ x: number; y: number }> }>,
  cleared: boolean
): { success: boolean; strokeCount: number } {
  const game = getGame(roomCode);

  if (!game) {
    throw new HttpError(404, "No active game for this room");
  }

  if (!game.round) {
    throw new HttpError(400, "Round is not active");
  }

  if (game.round.drawerId !== participantId) {
    throw new HttpError(400, "Only the drawer can sync the canvas");
  }

  let state = canvasMap.get(roomCode);

  if (cleared) {
    state = {
      strokes: [],
      cleared: true,
      updatedAt: new Date().toISOString()
    };

    canvasMap.set(roomCode, state);
    return { success: true, strokeCount: 0 };
  }

  if (!state) {
    state = {
      strokes: [],
      cleared: false,
      updatedAt: new Date().toISOString()
    };
  }

  const newStrokes: CanvasStroke[] = strokes.map((s) => ({
    id: generateId(),
    points: s.points,
    lineWidth: 3
  }));

  state.strokes.push(...newStrokes);
  state.updatedAt = new Date().toISOString();
  canvasMap.set(roomCode, state);

  return { success: true, strokeCount: state.strokes.length };
}
