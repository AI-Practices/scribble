import { Router } from "express";
import { roomCodeParamsSchema, gameQuerySchema, HttpError } from "./schemas.js";
import { getGame } from "../services/gameStore.js";
import { getRoom } from "../services/roomStore.js";
import { getCanvasState } from "../services/canvasStore.js";

export function createGamesRouter() {
  const router = Router();

  router.get("/:code/round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = gameQuerySchema.parse(request.query);

      const game = getGame(code.toUpperCase(), participantId);

      if (!game || !game.round) {
        throw new HttpError(404, "No active game for this room");
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
      }

      response.json({ round: roundResponse });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
