export const ui = {
  landing: document.getElementById("landing"),
  room: document.getElementById("room"),
  nameInput: document.getElementById("nameInput"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  leaveRoomBtn: document.getElementById("leaveRoomBtn"),
  roomCodeLabel: document.getElementById("roomCodeLabel"),
  seatLabel: document.getElementById("seatLabel"),
  statusLabel: document.getElementById("statusLabel"),
  turnLabel: document.getElementById("turnLabel"),
  message: document.getElementById("message"),
  playersList: document.getElementById("playersList"),
  board: document.getElementById("board"),
  rematchBtn: document.getElementById("rematchBtn")
};

export function showLanding() {
  ui.room.classList.add("hidden");
  ui.landing.classList.remove("hidden");
}

export function showRoom() {
  ui.landing.classList.add("hidden");
  ui.room.classList.remove("hidden");
}

export function renderPlayers(players) {
  ui.playersList.innerHTML = "";
  for (const seat of [1, 2]) {
    const player = players.find((entry) => entry.seat === seat);
    const li = document.createElement("li");
    if (player) {
      li.textContent = `P${seat}: ${player.name} — ❤️ ${player.lives}`;
    } else {
      li.textContent = `P${seat}: Waiting...`;
    }
    ui.playersList.append(li);
  }
}

export function renderBoard(revealed, canClick, onTileClick) {
  ui.board.innerHTML = "";
  revealed.forEach((value, tileIndex) => {
    const btn = document.createElement("button");
    btn.className = "tile";

    if (value === "safe") {
      btn.classList.add("safe");
      btn.textContent = "SAFE ✓";
      btn.disabled = true;
    } else if (value === "mine") {
      btn.classList.add("mine");
      btn.textContent = "MINE 💣";
      btn.disabled = true;
    } else {
      btn.textContent = "?";
      btn.disabled = !canClick;
      if (canClick) {
        btn.classList.add("clickable");
        btn.addEventListener("click", () => onTileClick(tileIndex));
      }
    }

    ui.board.append(btn);
  });
}

export function setMessage(message) {
  ui.message.textContent = message;
}
