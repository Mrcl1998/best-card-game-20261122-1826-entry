// main.js — bootstrap and the turn driver: wires render + input + state + AI
// into a playable game. Screenshot mode (?shot=) renders one frozen state.
import {
  newGame, canPlay, playCreature, castSpell, resolveAttacks,
  checkEnd, startPlayerTurn, startEnemyTurn, firstEmptyLane,
} from './state.js';
import { render } from './render.js';
import { sfx } from './audio.js';
import { mulberry32 } from './random.js';
import { buildShotState } from './shots.js';
import { bindKeyboard } from './input.js';
import { chooseAction } from './ai.js';

const app = document.getElementById('app');
const rng = mulberry32((Date.now() % 2147483647) || 1);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');
const shotMode = shot !== null;

let state = shotMode ? buildShotState(shot, seed) : { phase: 'title' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function draw() {
  render(app, state, driver);
}

/** End the game if a hero hit 0 HP. Returns true when the game ended. */
function maybeEnd() {
  const end = checkEnd(state);
  if (!end) return false;
  state.phase = end;
  state.aiBusy = false;
  state.selected = null;
  sfx(end === 'win' ? 'win' : 'lose');
  draw();
  return true;
}

const driver = {
  onPlay() {
    state = newGame(rng);
    state.log = 'Your turn — play a card, then end your turn.';
    sfx('play');
    draw();
  },
  onAgain() {
    state = newGame(rng);
    sfx('play');
    draw();
  },
  onTitle() {
    state = { phase: 'title' };
    draw();
  },
  onDeselect() {
    if (state.phase !== 'play' || state.aiBusy) return;
    state.selected = null;
    draw();
  },
  isPlayable(i) {
    return state.phase === 'play' && !state.aiBusy && canPlay(state, 'player', i);
  },
  canTargetLane(lane) {
    if (state.phase !== 'play' || state.aiBusy || state.selected === null) return false;
    const card = state.player.hand[state.selected];
    return !!card && card.kind === 'creature' && !state.player.board[lane];
  },
  onSelectCard(i) {
    if (state.phase !== 'play' || state.aiBusy) return;
    const card = state.player.hand[i];
    if (!card) return;
    if (state.selected === i) {
      state.selected = null;
      sfx('click');
      draw();
      return;
    }
    if (!canPlay(state, 'player', i)) {
      state.log = card.kind === 'creature' && !state.player.board.includes(null)
        ? 'No empty lane — your board is full.'
        : `Not enough ember to play ${card.name} (${card.cost}).`;
      sfx('click');
      draw();
      return;
    }
    if (card.kind === 'spell') {
      const name = card.name;
      castSpell(state, 'player', i);
      state.log = `You cast ${name}.`;
      sfx(name === 'Mend' || name === 'Aegis' ? 'heal' : 'play');
      state.selected = null;
      draw();
      maybeEnd();
      return;
    }
    // Creature: select it; if only one empty lane, place it right away.
    const empty = state.player.board.map((c, lane) => (c ? -1 : lane)).filter((l) => l >= 0);
    if (empty.length === 1) {
      driver.onLaneClick(empty[0]);
      return;
    }
    state.selected = i;
    state.log = `Place ${card.name} — click a glowing lane.`;
    sfx('select');
    draw();
  },
  onLaneClick(lane) {
    if (state.phase !== 'play' || state.aiBusy || state.selected === null) return;
    const index = state.selected;
    const card = state.player.hand[index];
    if (!card || card.kind !== 'creature') return;
    if (state.player.board[lane]) return;
    state.selected = null;
    playCreature(state, 'player', index, lane);
    state.log = `You played ${card.name} in lane ${lane + 1}.`;
    sfx('play');
    draw();
    maybeEnd();
  },
  async onEndTurn() {
    if (state.phase !== 'play' || state.aiBusy) return;
    state.aiBusy = true;
    state.selected = null;
    state.log = 'Your creatures attack…';
    draw();
    await sleep(450);
    resolveAttacks(state, 'player');
    sfx('attack');
    draw();
    if (maybeEnd()) return;
    await sleep(450);

    // The Cinder Queen's turn, one visible action at a time.
    startEnemyTurn(state);
    state.log = 'The Cinder Queen plays…';
    draw();
    await sleep(500);
    for (;;) {
      const action = chooseAction(state);
      if (!action) break;
      const card = state.enemy.hand[action.handIndex];
      if (!card) break;
      if (action.type === 'creature') {
        playCreature(state, 'enemy', action.handIndex, action.lane);
        state.log = `The Queen plays ${card.name} in lane ${action.lane + 1}.`;
      } else {
        castSpell(state, 'enemy', action.handIndex);
        state.log = `The Queen casts ${card.name}.`;
      }
      sfx('play');
      draw();
      if (maybeEnd()) return;
      await sleep(500);
    }
    state.log = 'The Queen’s creatures attack…';
    draw();
    await sleep(450);
    resolveAttacks(state, 'enemy');
    sfx('attack');
    draw();
    if (maybeEnd()) return;

    startPlayerTurn(state);
    state.aiBusy = false;
    state.log = `Turn ${state.turn} — your move. Ember refilled to ${state.ember}.`;
    sfx('draw');
    draw();
  },
};

draw();
if (!shotMode) bindKeyboard(driver);
