import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom throws 404 for an unknown room code", () => {
    expect(() => joinRoom("ZZZZ", "Bob")).toThrow("Room not found");
  });

  it("joinRoom throws 409 for a duplicate participant name", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "Alice")).toThrow("You are already in this room");
  });

  it("joinRoom succeeds for a new participant", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Bob");

    expect(result.participantId).toBeDefined();
    expect(result.room.participants).toHaveLength(2);
  });
});
