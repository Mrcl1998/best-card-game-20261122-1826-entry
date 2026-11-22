// shots.js — deterministic setups for the four screenshots (?shot=...).
// Each returns a complete state that render.js can draw as-is.
import { newGame } from './state.js';
import { makeCard } from './cards.js';
import { mulberry32 } from './random.js';

function midGame(seed) {
  const rng = mulberry32(seed);
  const state = newGame(rng);
  state.turn = 6;
  state.stats.turnsTaken = 6;
  state.stats.damageDealt = 12;
  state.stats.cardsPlayed = 9;
  state.emberMax = 6;
  state.ember = 5;
  state.enemyEmber = 5;
  state.player.hp = 24;
  state.player.armor = 2;
  state.enemy.hp = 18;
  state.player.deck.length = 18;
  state.enemy.deck.length = 21;
  state.player.board = [makeCard('knight'), null, makeCard('golem')];
  state.player.board[0].hp = 3;
  state.player.board[2].hp = 4;
  state.enemy.board = [makeCard('wolf'), makeCard('phoenix'), null];
  state.enemy.board[0].hp = 1;
  state.enemy.board[1].hp = 4;
  state.player.hand = [
    makeCard('fireball'),
    makeCard('knight'),
    makeCard('mend'),
    makeCard('imp'),
    makeCard('dragon'),
    makeCard('aegis'),
  ];
  state.enemy.hand = [makeCard('imp'), makeCard('wolf'), makeCard('spark'), makeCard('fireball')];
  state.log = 'Turn 6 — the Queen is hurting. Press the attack!';
  return state;
}

/** Build the state for ?shot=start|play|win|loss. */
export function buildShotState(shot, seed) {
  if (shot === 'start') return { phase: 'title' };
  if (shot === 'play') return midGame(seed);
  if (shot === 'win') {
    const state = midGame(seed);
    state.phase = 'win';
    state.turn = 9;
    state.enemy.hp = 0;
    state.player.hp = 11;
    state.stats.turnsTaken = 9;
    state.stats.damageDealt = 34;
    state.stats.cardsPlayed = 14;
    state.log = 'Victory! The Cinder Queen kneels.';
    return state;
  }
  if (shot === 'loss') {
    const state = midGame(seed);
    state.phase = 'loss';
    state.turn = 11;
    state.player.hp = 0;
    state.enemy.hp = 9;
    state.stats.turnsTaken = 11;
    state.stats.damageDealt = 22;
    state.stats.cardsPlayed = 12;
    state.log = 'Defeat. The Queen keeps her throne… this time.';
    return state;
  }
  return { phase: 'title' };
}
