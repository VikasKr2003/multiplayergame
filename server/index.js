import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TILE_COUNT } from "./game/constants.js";
import { resetGameForPlay } from "./game/state.js";
import { applyTileSelection } from "./game/rules.js";
import {
  attachPlayerToRoom,
  createRoom,
  getRoom,
  getSeatBySocket,
  removePlayerBySocket,
  roomPublicState,
  setRoomStatusFromGame
} from "./game/rooms.js";
import { normalizeName, normalizeRoomCode, isValidTileIndex } from "./game/utils.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

function emitRoomAndGame(ioServer, room) {
  const publicState = roomPublicState(room);
  ioServer.to(room.code).emit("room:update", {
    players: publicState.players,
    status: publicState.status
  });
  ioServer.to(room.code).emit("game:state", publicState.gameState);
}

io.on("connection", (socket) => {
  socket.on("room:create", (payload = {}) => {
    const name = normalizeName(payload.name);
    if (!name) {
      socket.emit("error", { message: "Please enter a username." });
      return;
    }

    const room = createRoom();
    const playerJoin = attachPlayerToRoom({ room, socketId: socket.id, name });

    socket.join(room.code);
    socket.emit("room:created", { roomCode: room.code });
    socket.emit("room:joined", {
      roomCode: room.code,
      playerId: playerJoin.playerId,
      seat: playerJoin.seat
    });
    emitRoomAndGame(io, room);
  });

  socket.on("room:join", (payload = {}) => {
    const roomCode = normalizeRoomCode(payload.roomCode);
    const name = normalizeName(payload.name);

    if (!name) {
      socket.emit("error", { message: "Please enter a username." });
      return;
    }

    const room = getRoom(roomCode);
    if (!room) {
      socket.emit("error", { message: "Invalid room code." });
      return;
    }

    const playerJoin = attachPlayerToRoom({ room, socketId: socket.id, name });
    if (!playerJoin) {
      socket.emit("error", { message: "Room is full." });
      return;
    }

    socket.join(roomCode);
    socket.emit("room:joined", {
      roomCode,
      playerId: playerJoin.playerId,
      seat: playerJoin.seat
    });

    emitRoomAndGame(io, room);
  });

  socket.on("game:tileClick", (payload = {}) => {
    const roomCode = normalizeRoomCode(payload.roomCode);
    const tileIndex = payload.tileIndex;
    const room = getRoom(roomCode);

    if (!room) {
      socket.emit("error", { message: "Room not found." });
      return;
    }

    if (!isValidTileIndex(tileIndex, TILE_COUNT)) {
      socket.emit("error", { message: "Invalid tile selection." });
      return;
    }

    const seat = getSeatBySocket(room, socket.id);
    if (!seat) {
      socket.emit("error", { message: "You are not a player in this room." });
      return;
    }

    const outcome = applyTileSelection(room.gameState, seat, tileIndex);
    if (!outcome.ok) {
      socket.emit("error", { message: outcome.reason });
      return;
    }

    setRoomStatusFromGame(room);
    emitRoomAndGame(io, room);
  });

  socket.on("game:rematchReady", (payload = {}) => {
    const roomCode = normalizeRoomCode(payload.roomCode);
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit("error", { message: "Room not found." });
      return;
    }

    const seat = getSeatBySocket(room, socket.id);
    if (!seat) {
      socket.emit("error", { message: "You are not a player in this room." });
      return;
    }

    if (room.players[1] && room.players[2]) {
      room.gameState.rematchReady.add(seat);
      if (room.gameState.rematchReady.size === 2) {
        resetGameForPlay(room.gameState);
        room.status = room.gameState.status;
      }

      emitRoomAndGame(io, room);
    }
  });

  socket.on("room:leave", (payload = {}) => {
    const roomCode = normalizeRoomCode(payload.roomCode);
    const room = getRoom(roomCode);
    if (!room) {
      return;
    }

    const removed = removePlayerBySocket(socket.id);
    socket.leave(roomCode);
    if (removed?.room) {
      emitRoomAndGame(io, removed.room);
    }
  });

  socket.on("disconnect", () => {
    const removed = removePlayerBySocket(socket.id);
    if (removed?.room) {
      emitRoomAndGame(io, removed.room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`MineGrid Duel running on http://localhost:${PORT}`);
});
