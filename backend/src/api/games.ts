import { Router } from "express";
import { roomCodeParamsSchema, gameQuerySchema, restartGamePayloadSchema, HttpError } from "./schemas.js";
import { getGame, restartGame } from "../services/gameStore.js";
import { getRoom, toRoomSnapshot } from "../services/roomStore.js";
import { getCanvasState } from "../services/canvasStore.js";

export function createGamesRouter() {
  const router = Router();

  router.get("/:code/round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = gameQuerySchema.parse(request.query);

      const game = getGame(code.toUpperCase(), participantId);

      if (!game || !game.round) {
        response.json({ round: null });
        return;
      }

      const room = getRoom(code.toUpperCase());
      const drawer = room?.participants.find((p) => p.id === game.round!.drawerId);

      const isDrawer = game.round.drawerId === participantId;
      const isRoundEnd = game.status === "round_end";
      const showSecretWord = isDrawer || isRoundEnd;

      const guessedCorrectly = game.correctGuessers.includes(participantId);
      const canvas = game.canvasState ?? getCanvasState(code.toUpperCase());

      const roundResponse: Record<string, unknown> = {
        number: game.round.number,
        status: game.status,
        drawerId: game.round.drawerId,
        drawerName: drawer?.name ?? "Unknown",
        amDrawer: isDrawer,
        startedAt: game.round.startedAt,
        endsAt: game.round.endsAt,
        guesses: game.guesses,
        scores: game.scores,
        canvas,
        guessedCorrectly
      };

      if (showSecretWord) {
        roundResponse.secretWord = game.round.secretWord;
      }

      if (isRoundEnd) {
        roundResponse.endedAt = game.round.endedAt ?? game.round.endsAt;
        roundResponse.resultExpiresAt = game.resultExpiresAt;
      }

      response.json({ round: roundResponse });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGamePayloadSchema.parse(request.body);

      restartGame(code.toUpperCase(), participantId);

      const room = getRoom(code.toUpperCase());
      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      const snapshot = toRoomSnapshot(room, participantId);
      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
