import { Router } from "express";
import { roomCodeParamsSchema, canvasSyncSchema, guessSubmissionSchema, HttpError } from "./schemas.js";
import { canvasSync } from "../services/canvasStore.js";
import { getGame } from "../services/gameStore.js";
import { getRoom } from "../services/roomStore.js";
import { submitGuess } from "../services/gameStore.js";

export function createGuessesRouter() {
  const router = Router();

  router.post("/:code/canvas/sync", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes, cleared } = canvasSyncSchema.parse(request.body);
      const result = canvasSync(code.toUpperCase(), participantId, strokes, cleared);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, content } = guessSubmissionSchema.parse(request.body);

      const room = getRoom(code.toUpperCase());
      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      const participant = room.participants.find((p) => p.id === participantId);
      if (!participant) {
        throw new HttpError(404, "Participant not found");
      }

      const game = getGame(code.toUpperCase());
      if (!game || !game.round) {
        throw new HttpError(404, "No active game for this room");
      }

      if (game.round.drawerId === participantId) {
        throw new HttpError(400, "Drawer cannot submit guesses");
      }

      const result = submitGuess(code.toUpperCase(), participantId, participant.name, content);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
