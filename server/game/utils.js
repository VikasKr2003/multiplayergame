import { ROOM_CODE_LENGTH } from "./constants.js";

const ROOM_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function createRoomCode(existingCodes) {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new Error("Could not generate unique room code");
}

export function normalizeName(name) {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim().slice(0, 20);
}

export function normalizeRoomCode(roomCode) {
  if (typeof roomCode !== "string") {
    return "";
  }

  return roomCode.trim().toUpperCase();
}

export function isValidTileIndex(tileIndex, tileCount) {
  return Number.isInteger(tileIndex) && tileIndex >= 0 && tileIndex < tileCount;
}
