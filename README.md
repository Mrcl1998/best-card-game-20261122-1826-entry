# Ember Court

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Mrcl1998/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Mrcl1998/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original lane-duel card game for the [best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826) bounty on make.fun. You are the Ember Warden, dueling the Cinder Queen across three lanes: spend ember to play creatures and spells, trade blows lane by lane, and bring her 30 HP to zero before she does the same to you.

## How to play

- Each turn you gain ember (1 on turn one, growing to 10) — spend it to play cards.
- Creatures take a lane and attack at the end of your turn: the enemy creature in their lane, or the Queen herself when the lane is empty.
- Spells strike the Queen, heal you, raise armor, or draw cards.
- Click a card, then a glowing lane — or press 1–7 to pick a card, Enter to end your turn.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network requests. Screenshot states: `?shot=start`, `?shot=play&seed=7`, `?shot=win`, `?shot=loss`.

## Layout

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to `/output`, writes `dossier.json`
- `game/` — the playable game (`index.html`, `styles.css`, `src/*.js`)
- `screenshots/` — real renders of the game's own code
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
