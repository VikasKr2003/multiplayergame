import { ROOM_STATUS } from "./constants.js";
import { finishByForfeit } from "./rules.js";
import { createInitialGameState, resetGameForPlay, serializeGameState } from "./state.js";
import { createRoomCode } from "./utils.js";

const rooms = new Map();
const socketToRoom = new Map();

function buildPlayerList(room) {
  return [1, 2]
    .map((seat) => {
      const player = room.players[seat];
      if (!player) {
        return null;
      }

      return {
        id: player.id,
        name: player.name,
        seat,
        lives: room.gameState.lives[seat]
      };
    })
    .filter(Boolean);
}

export function createRoom() {
  const roomCode = createRoomCode(new Set(rooms.keys()));
  const room = {
    code: roomCode,
    status: ROOM_STATUS.WAITING,
    players: {
      1: null,
      2: null
    },
    gameState: createInitialGameState()
  };

  rooms.set(roomCode, room);
  return room;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function attachPlayerToRoom({ room, socketId, name }) {
  const seat = room.players[1] ? (room.players[2] ? null : 2) : 1;
  if (!seat) {
    return null;
  }

  const playerId = `${room.code}-${seat}`;
  room.players[seat] = { id: playerId, name, seat, socketId };
  socketToRoom.set(socketId, room.code);

  const bothPlayersPresent = Boolean(room.players[1] && room.players[2]);
  if (bothPlayersPresent) {
    room.status = ROOM_STATUS.PLAYING;
    resetGameForPlay(room.gameState);
  } else {
    room.status = ROOM_STATUS.WAITING;
    room.gameState.status = ROOM_STATUS.WAITING;
  }

  return { seat, playerId };
}

export function detachSocket(socketId) {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) {
    return null;
  }

  socketToRoom.delete(socketId);
  const room = rooms.get(roomCode);
  if (!room) {
    return null;
  }

  for (const seat of [1, 2]) {
    const player = room.players[seat];
    if (player?.socketId === socketId) {
      room.players[seat] = null;
      const opponentSeat = seat === 1 ? 2 : 1;
      if (room.players[opponentSeat] && room.gameState.status === ROOM_STATUS.PLAYING) {
        finishByForfeit(room.gameState, opponentSeat);
        room.status = ROOM_STATUS.FINISHED;
      } else {
        room.status = ROOM_STATUS.WAITING;
        room.gameState.status = ROOM_STATUS.WAITING;
      }

      if (!room.players[1] && !room.players[2]) {
        rooms.delete(roomCode);
      }

      return { roomCode, room, removedSeat: seat };
    }
  }

  return null;
}

export function removePlayerBySocket(socketId) {
  return detachSocket(socketId);
}

export function getSocketRoomCode(socketId) {
  return socketToRoom.get(socketId);
}

export function getSeatBySocket(room, socketId) {
  for (const seat of [1, 2]) {
    if (room.players[seat]?.socketId === socketId) {
      return seat;
    }
  }
  return null;
}

export function roomPublicState(room) {
  return {
    roomCode: room.code,
    players: buildPlayerList(room),
    status: room.status,
    gameState: serializeGameState(room.gameState)
  };
}

export function setRoomStatusFromGame(room) {
  room.status = room.gameState.status;
}
