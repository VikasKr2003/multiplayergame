import { GAME_TILE_STATE, ROOM_STATUS, TILE_COUNT } from "./constants.js";

function getOpponentSeat(seat) {
  return seat === 1 ? 2 : 1;
}

function allSafeTilesRevealed(gameState) {
  const revealedSafeCount = gameState.revealed.filter((value) => value === GAME_TILE_STATE.SAFE).length;
  const safeTileCount = TILE_COUNT - gameState.mines.size;
  return revealedSafeCount >= safeTileCount;
}

function allTilesRevealed(gameState) {
  return gameState.revealed.every((value) => value !== GAME_TILE_STATE.HIDDEN);
}

function finishGameByLives(gameState) {
  if (gameState.lives[1] > gameState.lives[2]) {
    gameState.winnerSeat = 1;
    gameState.draw = false;
  } else if (gameState.lives[2] > gameState.lives[1]) {
    gameState.winnerSeat = 2;
    gameState.draw = false;
  } else {
    gameState.winnerSeat = null;
    gameState.draw = true;
  }

  gameState.status = ROOM_STATUS.FINISHED;
}

export function applyTileSelection(gameState, seat, tileIndex) {
  if (gameState.status !== ROOM_STATUS.PLAYING) {
    return { ok: false, reason: "Game is not active." };
  }

  if (gameState.currentTurnSeat !== seat) {
    return { ok: false, reason: "It is not your turn." };
  }

  if (gameState.revealed[tileIndex] !== GAME_TILE_STATE.HIDDEN) {
    return { ok: false, reason: "Tile is already revealed." };
  }

  const isMine = gameState.mines.has(tileIndex);
  const result = isMine ? GAME_TILE_STATE.MINE : GAME_TILE_STATE.SAFE;

  gameState.revealed[tileIndex] = result;
  if (isMine) {
    gameState.lives[seat] -= 1;
  }

  gameState.lastMove = {
    seat,
    tileIndex,
    result
  };

  if (gameState.lives[seat] <= 0) {
    gameState.winnerSeat = getOpponentSeat(seat);
    gameState.draw = false;
    gameState.status = ROOM_STATUS.FINISHED;
    return { ok: true };
  }

  if (allTilesRevealed(gameState) || allSafeTilesRevealed(gameState)) {
    finishGameByLives(gameState);
    return { ok: true };
  }

  gameState.currentTurnSeat = getOpponentSeat(seat);
  return { ok: true };
}

export function finishByForfeit(gameState, winnerSeat) {
  gameState.status = ROOM_STATUS.FINISHED;
  gameState.winnerSeat = winnerSeat;
  gameState.draw = false;
  gameState.rematchReady.clear();
}
