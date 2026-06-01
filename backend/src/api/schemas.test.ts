import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty playerName after trim", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("createRoomSchema rejects missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
