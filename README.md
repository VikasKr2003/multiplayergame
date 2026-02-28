# MineGrid Duel

Real-time 2-player browser game on a shared 4x4 grid. Players reveal tiles, avoid mines, and try to outlast their opponent.

## Folder structure

```text
/
  package.json
  server/
    index.js
    game/
      constants.js
      rooms.js
      state.js
      rules.js
      utils.js
  public/
    index.html
    styles.css
    client.js
    ui.js
```

## Run locally

1. Install dependencies:
   - `npm install`
2. Start the app:
   - `npm run dev`
   - or `npm start`
3. Open `http://localhost:3000` in two tabs and join the same room code.

## Socket events

### Client -> Server

- `room:create` `{ name }`
- `room:join` `{ roomCode, name }`
- `game:tileClick` `{ roomCode, tileIndex }`
- `game:rematchReady` `{ roomCode }`
- `room:leave` `{ roomCode }`

### Server -> Client

- `room:created` `{ roomCode }`
- `room:joined` `{ roomCode, playerId, seat }`
- `room:update` `{ players, status }`
- `game:state` `{ status, currentTurnSeat, lives, revealed, lastMove, winnerSeat, draw }`
- `error` `{ message }`

## Server state model

Each room is in-memory and stores:

- room code
- room status (`waiting`, `playing`, `finished`)
- players in seat 1 and seat 2 (name + socket)
- game state:
  - lives for both players
  - fixed mine positions for the active round
  - revealed tile array (`hidden`, `safe`, `mine`)
  - current turn seat
  - last move metadata
  - winner/draw flags
  - rematch-ready seats

## Game flow

1. Player creates a room and becomes seat 1.
2. Second player joins and game starts immediately.
3. Seat 1 always starts.
4. On each valid click, server reveals tile and applies mine/safe result.
5. If current player hits a mine, they lose 1 life.
6. Turn always alternates after valid move.
7. Game ends when:
   - a player reaches 0 lives (opponent wins), or
   - all safe tiles are revealed (or all tiles revealed), then lives are compared.
8. Rematch starts only when both players send `game:rematchReady`.
9. If a player disconnects during play, remaining player wins by forfeit.

## Notes

- Server is authoritative. Clients never receive hidden mine locations.
- No database is used; all state is reset when server restarts.
