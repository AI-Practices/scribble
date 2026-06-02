export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby";
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

export interface GameStartResponse {
  game: {
    roomCode: string;
    status: "playing" | "round_end";
    roundNumber: number;
    drawerId: string;
    drawerName: string;
    startedAt: string;
    endsAt: string;
  };
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

export interface RoundResponse {
  round: {
    number: number;
    status: "playing" | "round_end";
    drawerId: string;
    drawerName: string;
    amDrawer: boolean;
    secretWord?: string;
    startedAt: string;
    endsAt: string;
    endedAt?: string;
    resultExpiresAt?: string;
    guesses: Guess[];
    scores: PlayerScore[];
    canvas: CanvasState | null;
    guessedCorrectly: boolean;
  } | null;
}

export interface GuessResult {
  result: "correct" | "incorrect";
  guess: Guess;
  scoreAwarded?: number;
  totalScore?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  startGame(code: string, participantId: string) {
    return request<GameStartResponse>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  fetchRound(code: string, participantId: string) {
    return request<RoundResponse>(
      `/games/${encodeURIComponent(code)}/round?participantId=${encodeURIComponent(participantId)}`
    );
  },
  canvasSync(code: string, participantId: string, strokes: Array<{ points: Array<{ x: number; y: number }> }>, cleared: boolean) {
    return request<{ success: boolean; strokeCount: number }>(
      `/games/${encodeURIComponent(code)}/canvas/sync`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, strokes, cleared })
      }
    );
  },
  submitGuess(code: string, participantId: string, content: string) {
    return request<GuessResult>(
      `/games/${encodeURIComponent(code)}/guess`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, content })
      }
    );
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/games/${encodeURIComponent(code)}/restart`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  }
};
