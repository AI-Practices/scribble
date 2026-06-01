import { type Game, type Round } from "../models/game.js";
import { getRoom } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

const games = new Map<string, Game>();

function now() {
  return new Date().toISOString();
}

function hash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function selectWord(roomCode: string, roundNumber: number): string {
  const list = STARTER_WORDS as readonly string[];

  if (list.length === 0) {
    throw new HttpError(500, "Cannot start game: no words in starter list");
  }

  const index = hash(`${roomCode}:${roundNumber}`) % list.length;
  return list[index];
}

export function createGame(roomCode: string): Game {
  const room = getRoom(roomCode);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players required to start");
  }

  if (games.has(roomCode)) {
    throw new HttpError(400, "Game has already started");
  }

  const roundNumber = 1;
  const startedAt = now();
  const endsAt = new Date(Date.parse(startedAt) + 60_000).toISOString();
  const secretWord = selectWord(roomCode, roundNumber);

  const round: Round = {
    number: roundNumber,
    drawerId: room.hostId,
    secretWord,
    startedAt,
    endsAt
  };

  const game: Game = {
    roomCode,
    status: "playing",
    round,
    roundNumber,
    createdAt: now()
  };

  games.set(roomCode, game);

  return game;
}

export function getGame(roomCode: string): Game | null {
  const game = games.get(roomCode);
  return game ? structuredClone(game) : null;
}
