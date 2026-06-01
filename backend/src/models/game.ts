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

export interface Game {
  roomCode: string;
  status: GameStatus;
  round: Round | null;
  roundNumber: number;
  createdAt: string;
}
