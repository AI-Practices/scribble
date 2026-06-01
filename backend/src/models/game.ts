export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby";
export type GameStatus = "playing" | "round_end";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  gameStartedAt?: string;
  drawerId?: string;
  drawerName?: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  gameStartedAt?: string;
  drawerId?: string;
  drawerName?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface Round {
  number: number;
  drawerId: string;
  secretWord: string;
  startedAt: string;
  endsAt: string;
  endedAt?: string;
}

export interface Guess {
  id: string;
  roundNumber: number;
  participantId: string;
  participantName: string;
  content: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface PlayerScore {
  participantId: string;
  participantName: string;
  score: number;
}

export interface CanvasStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  lineWidth: number;
}

export interface CanvasState {
  strokes: CanvasStroke[];
  cleared: boolean;
  updatedAt: string;
}

export interface Game {
  roomCode: string;
  status: GameStatus;
  round: Round | null;
  roundNumber: number;
  createdAt: string;
  guesses: Guess[];
  scores: PlayerScore[];
  correctGuessers: string[];
  canvasState: CanvasState | null;
}
