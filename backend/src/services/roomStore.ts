import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  if (!code.trim()) {
    throw new HttpError(400, "Room code is required");
  }

  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.participants.some((p) => p.name === playerName)) {
    throw new HttpError(409, "You are already in this room");
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

const STALE_MS = 30 * 60 * 1000;

export function cleanupStaleRooms() {
  const cutoff = Date.now() - STALE_MS;
  const cutoffISO = new Date(cutoff).toISOString();

  for (const [code, room] of rooms) {
    if (room.participants.length === 0 || room.updatedAt < cutoffISO) {
      rooms.delete(code);
    }
  }
}

export function markGameStarted(code: string, drawerId?: string, drawerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return;
  }

  room.gameStartedAt = now();
  room.drawerId = drawerId;
  room.drawerName = drawerName;
  room.updatedAt = now();
  rooms.set(room.code, room);
}

export function clearGameStarted(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return;
  }

  delete room.gameStartedAt;
  delete room.drawerId;
  delete room.drawerName;
  room.updatedAt = now();
  rooms.set(room.code, room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    gameStartedAt: room.gameStartedAt,
    drawerId: room.drawerId,
    drawerName: room.drawerName
  };
}
