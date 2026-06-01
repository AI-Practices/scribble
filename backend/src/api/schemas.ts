import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGamePayloadSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const gameQuerySchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const guessSubmissionSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  content: z.string().min(1, "Guess cannot be empty").trim()
});

export const canvasSyncSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  strokes: z.array(
    z.object({
      points: z.array(z.object({ x: z.number(), y: z.number() })).min(2)
    })
  ),
  cleared: z.boolean()
});

export const restartGamePayloadSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
