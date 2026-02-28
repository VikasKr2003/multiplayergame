import { renderBoard, renderPlayers, setMessage, showLanding, showRoom, ui } from "./ui.js";

const socket = io();

const localState = {
  roomCode: "",
  seat: null,
  playerId: "",
  players: [],
  status: "waiting",
  game: null,
  rematchSent: false,
  hadOpponent: false
};

function getName() {
  return ui.nameInput.value.trim();
}

function canPlayTile(tileIndex) {
  if (!localState.game) return false;
  if (localState.game.status !== "playing") return false;
  if (localState.game.currentTurnSeat !== localState.seat) return false;
  return localState.game.revealed[tileIndex] === "hidden";
}

function refreshView() {
  ui.roomCodeLabel.textContent = localState.roomCode || "------";
  ui.seatLabel.textContent = localState.seat ? `Player ${localState.seat}` : "Player ?";
  ui.statusLabel.textContent = localState.status;

  renderPlayers(localState.players);

  if (localState.game) {
    const turnText = localState.game.status === "playing" ? `Player ${localState.game.currentTurnSeat}` : "-";
    ui.turnLabel.textContent = turnText;

    const canClickNow = localState.game.status === "playing" && localState.game.currentTurnSeat === localState.seat;
    renderBoard(localState.game.revealed, canClickNow, (tileIndex) => {
      if (!canPlayTile(tileIndex)) return;
      socket.emit("game:tileClick", { roomCode: localState.roomCode, tileIndex });
    });

    if (localState.game.status === "finished") {
      if (localState.game.draw) {
        setMessage("Game ended in a draw.");
      } else if (localState.game.winnerSeat === localState.seat) {
        setMessage("You win!");
      } else if (localState.game.winnerSeat) {
        setMessage("You lose.");
      }
      ui.rematchBtn.classList.remove("hidden");
      ui.rematchBtn.disabled = localState.rematchSent;
      ui.rematchBtn.textContent = localState.rematchSent ? "Waiting for opponent..." : "Play Again";
    } else {
      ui.rematchBtn.classList.add("hidden");
      ui.rematchBtn.disabled = false;
      ui.rematchBtn.textContent = "Play Again";

      if (localState.status === "waiting") {
        setMessage("Waiting for second player...");
      } else if (localState.game.currentTurnSeat === localState.seat) {
        setMessage("Your turn: choose a tile.");
      } else {
        setMessage("Opponent's turn...");
      }
    }
  }

  const opponentMissing = localState.hadOpponent && localState.players.length < 2;
  if (opponentMissing) {
    setMessage("Opponent disconnected.");
  }
}

ui.createRoomBtn.addEventListener("click", () => {
  const name = getName();
  socket.emit("room:create", { name });
});

ui.joinRoomBtn.addEventListener("click", () => {
  const name = getName();
  const roomCode = ui.roomCodeInput.value.trim().toUpperCase();
  socket.emit("room:join", { roomCode, name });
});

ui.leaveRoomBtn.addEventListener("click", () => {
  if (localState.roomCode) {
    socket.emit("room:leave", { roomCode: localState.roomCode });
  }
  localState.roomCode = "";
  localState.seat = null;
  localState.playerId = "";
  localState.players = [];
  localState.status = "waiting";
  localState.game = null;
  localState.rematchSent = false;
  localState.hadOpponent = false;
  showLanding();
  setMessage("");
});

ui.rematchBtn.addEventListener("click", () => {
  if (!localState.roomCode || localState.game?.status !== "finished") return;
  localState.rematchSent = true;
  refreshView();
  socket.emit("game:rematchReady", { roomCode: localState.roomCode });
});

socket.on("room:created", ({ roomCode }) => {
  localState.roomCode = roomCode;
  ui.roomCodeInput.value = roomCode;
});

socket.on("room:joined", ({ roomCode, playerId, seat }) => {
  localState.roomCode = roomCode;
  localState.playerId = playerId;
  localState.seat = seat;
  localState.rematchSent = false;
  showRoom();
  refreshView();
});

socket.on("room:update", ({ players, status }) => {
  localState.players = players;
  localState.status = status;
  if (players.length === 2) {
    localState.hadOpponent = true;
  }
  refreshView();
});

socket.on("game:state", (gameState) => {
  localState.game = gameState;
  if (gameState.status === "playing") {
    localState.rematchSent = false;
  }
  refreshView();
});

socket.on("error", ({ message }) => {
  setMessage(message || "Something went wrong");
});

showLanding();
