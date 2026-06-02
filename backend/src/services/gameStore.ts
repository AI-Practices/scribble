import { type Game, type Round, type Guess, type PlayerScore, type CanvasState } from "../models/game.js";
import { getRoom, clearGameStarted } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";
import { initCanvasState } from "./canvasStore.js";

const games = new Map<string, Game>();
const roundTimers = new Map<string, ReturnType<typeof setTimeout>>();
const hostLastPollAt = new Map<string, number>();

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

  const scores: PlayerScore[] = room.participants.map((p) => ({
    participantId: p.id,
    participantName: p.name,
    score: 0
  }));

  const game: Game = {
    roomCode,
    status: "playing",
    round,
    roundNumber,
    createdAt: now(),
    guesses: [],
    scores,
    correctGuessers: [],
    canvasState: null
  };

  games.set(roomCode, game);
  initCanvasState(roomCode);

  roundTimers.set(
    roomCode,
    setTimeout(() => {
      endRound(roomCode);
    }, 60_000)
  );

  return game;
}

export function endRound(roomCode: string) {
  const game = games.get(roomCode);

  if (!game || game.status !== "playing") {
    return;
  }

  game.status = "round_end";

  if (game.round) {
    game.round.endedAt = now();
  }

  game.resultExpiresAt = new Date(Date.now() + 60_000).toISOString();

  games.set(roomCode, game);
  roundTimers.delete(roomCode);
}

export function restartGame(roomCode: string, callerParticipantId: string): void {
  const game = games.get(roomCode);

  if (!game) {
    throw new HttpError(404, "No active game for this room");
  }

  if (game.status !== "round_end") {
    throw new HttpError(400, "Game is not in result state");
  }

  const room = getRoom(roomCode);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== callerParticipantId) {
    throw new HttpError(403, "Only the host can restart");
  }

  resetGameData(roomCode);
}

function resetGameData(roomCode: string) {
  if (!games.has(roomCode)) {
    return;
  }

  games.delete(roomCode);
  clearGameStarted(roomCode);
  hostLastPollAt.delete(roomCode);
}

export function getGame(roomCode: string, callerParticipantId?: string): Game | null {
  const game = games.get(roomCode);

  if (!game) {
    return null;
  }

  if (game.status === "round_end") {
    if (game.resultExpiresAt && Date.now() > Date.parse(game.resultExpiresAt)) {
      resetGameData(roomCode);
      return null;
    }

    if (callerParticipantId) {
      const room = getRoom(roomCode);
      const hostId = room?.hostId;

      if (hostId && callerParticipantId === hostId) {
        hostLastPollAt.set(roomCode, Date.now());
      }

      if (hostId && callerParticipantId !== hostId) {
        const hostLastPoll = hostLastPollAt.get(roomCode);
        if (hostLastPoll && Date.now() - hostLastPoll > 25_000) {
          resetGameData(roomCode);
          hostLastPollAt.delete(roomCode);
          return null;
        }
      }
    }
  }

  return structuredClone(game);
}

function generateGuessId(): string {
  return crypto.randomUUID();
}

export function submitGuess(
  roomCode: string,
  participantId: string,
  participantName: string,
  content: string
): {
  result: "correct" | "incorrect";
  guess: Guess;
  scoreAwarded?: number;
  totalScore?: number;
} {
  const game = games.get(roomCode);

  if (!game) {
    throw new HttpError(404, "No active game for this room");
  }

  if (!game.round || game.status !== "playing") {
    throw new HttpError(400, "Round is not active");
  }

  const room = getRoom(roomCode);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(404, "Participant not found");
  }

  if (game.round.drawerId === participantId) {
    throw new HttpError(400, "Drawer cannot submit guesses");
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  if (game.correctGuessers.includes(participantId)) {
    throw new HttpError(400, "You have already guessed correctly");
  }

  const isCorrect = trimmed.toLowerCase() === game.round.secretWord.toLowerCase();
  const now_ = now();

  const guess: Guess = {
    id: generateGuessId(),
    roundNumber: game.roundNumber,
    participantId,
    participantName,
    content: trimmed,
    isCorrect,
    submittedAt: now_
  };

  game.guesses.push(guess);

  let scoreAwarded: number | undefined;
  let totalScore: number | undefined;

  if (isCorrect) {
    game.correctGuessers.push(participantId);

    const playerScore = game.scores.find((s) => s.participantId === participantId);
    if (playerScore) {
      scoreAwarded = 100;
      playerScore.score += 100;
      totalScore = playerScore.score;
    }
  }

  games.set(roomCode, game);

  return {
    result: isCorrect ? "correct" : "incorrect",
    guess,
    scoreAwarded,
    totalScore
  };
}
