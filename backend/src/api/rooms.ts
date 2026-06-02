import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGamePayloadSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, markGameStarted, toRoomSnapshot } from "../services/roomStore.js";
import { createGame } from "../services/gameStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGamePayloadSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(400, "Only the host can start the game");
      }

      const game = createGame(code.toUpperCase());

      const drawerName = room.participants.find(
        (p) => p.id === game.round!.drawerId
      )!.name;

      markGameStarted(code.toUpperCase(), game.round!.drawerId, drawerName);

      response.json({
        game: {
          roomCode: game.roomCode,
          status: game.status,
          roundNumber: game.roundNumber,
          drawerId: game.round!.drawerId,
          drawerName,
          startedAt: game.round!.startedAt,
          endsAt: game.round!.endsAt
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
