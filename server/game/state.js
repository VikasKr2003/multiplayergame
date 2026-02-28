import {
  GAME_TILE_STATE,
  MINE_COUNT,
  ROOM_STATUS,
  STARTING_LIVES,
  TILE_COUNT
} from "./constants.js";

export function createInitialGameState() {
  return {
    status: ROOM_STATUS.WAITING,
    currentTurnSeat: 1,
    lives: { 1: STARTING_LIVES, 2: STARTING_LIVES },
    revealed: Array(TILE_COUNT).fill(GAME_TILE_STATE.HIDDEN),
    mines: new Set(),
    lastMove: null,
    winnerSeat: null,
    draw: false,
    rematchReady: new Set()
  };
}

export function assignRandomMines(tileCount = TILE_COUNT, mineCount = MINE_COUNT) {
  const mines = new Set();
  while (mines.size < mineCount) {
    mines.add(Math.floor(Math.random() * tileCount));
  }
  return mines;
}

export function resetGameForPlay(gameState) {
  gameState.status = ROOM_STATUS.PLAYING;
  gameState.currentTurnSeat = 1;
  gameState.lives = { 1: STARTING_LIVES, 2: STARTING_LIVES };
  gameState.revealed = Array(TILE_COUNT).fill(GAME_TILE_STATE.HIDDEN);
  gameState.mines = assignRandomMines();
  gameState.lastMove = null;
  gameState.winnerSeat = null;
  gameState.draw = false;
  gameState.rematchReady.clear();
}

export function serializeGameState(gameState) {
  return {
    status: gameState.status,
    currentTurnSeat: gameState.currentTurnSeat,
    lives: gameState.lives,
    revealed: gameState.revealed,
    lastMove: gameState.lastMove,
    winnerSeat: gameState.winnerSeat,
    draw: gameState.draw
  };
}
