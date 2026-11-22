// render.js — draws every screen of Ember Court into #app as plain DOM:
// the title screen, the table (both hero bars, lanes, hands, ember, log),
// and the win / loss overlays. Re-renders fully on every state change.
import { MAX_EMBER } from './state.js';

let prevHp = { player: 30, enemy: 30 };

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/** One card face: cost gem, name, shape, text, attack/health or spell tag. */
export function cardEl(card, opts = {}) {
  const node = el('div', 'card' + (opts.board ? ' board' : ''));
  node.style.borderTop = `6px solid ${card.color}`;
  if (opts.playable) node.classList.add('playable');
  if (opts.selected) node.classList.add('selected');
  if (opts.dim) node.classList.add('dim');
  node.appendChild(el('div', 'cost', String(card.cost)));
  node.appendChild(el('div', 'type-ribbon', card.kind));
  node.appendChild(el('div', 'cname', card.name));
  const shape = el('div', 'shape', card.shape);
  shape.style.color = card.color;
  node.appendChild(shape);
  node.appendChild(el('div', 'ctext', card.text));
  const stats = el('div', 'stats');
  if (card.kind === 'creature') {
    stats.appendChild(el('span', 'atk', `⚔ ${card.atk}`));
    stats.appendChild(el('span', 'hp', `♥ ${card.hp}`));
  } else {
    stats.appendChild(el('span', 'spell-tag', 'SPELL'));
  }
  node.appendChild(stats);
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  return node;
}

function heroBar(state, side, driver) {
  const hero = state[side];
  const isEnemy = side === 'enemy';
  const row = el('div', 'hero-row' + (isEnemy ? ' enemy' : ''));
  const wasHp = prevHp[side];
  if (hero.hp < wasHp) row.classList.add('shake');
  prevHp[side] = hero.hp;

  const avatar = el('div', 'avatar', isEnemy ? '👑' : '🔥');
  row.appendChild(avatar);
  const info = el('div', 'hero-info');
  const name = el('div', 'hero-name', isEnemy ? 'Cinder Queen' : 'Ember Warden');
  const small = el('small', null, isEnemy ? 'ruler of the Ash Court' : 'you · the last warden');
  name.appendChild(small);
  info.appendChild(name);
  const bar = el('div', 'hpbar' + (isEnemy ? ' enemy' : ''));
  const fill = el('div', 'hpfill');
  fill.style.width = `${Math.max(0, (hero.hp / hero.maxHp) * 100)}%`;
  bar.appendChild(fill);
  bar.appendChild(el('div', 'hptext', `${hero.hp} / ${hero.maxHp} HP`));
  info.appendChild(bar);
  row.appendChild(info);
  if (hero.armor > 0) row.appendChild(el('div', 'armor-badge', `🛡 ${hero.armor} armor`));
  return row;
}

function renderTitle(app, driver) {
  const screen = el('div', 'title-screen');
  screen.appendChild(el('div', 'flames', '🔥 👑 🔥'));
  const h1 = el('h1');
  h1.innerHTML = 'EMBER<br><span class="court">COURT</span>';
  screen.appendChild(h1);
  screen.appendChild(el('div', 'tagline', 'A duel of cards in the Ash Court. Outwit the Cinder Queen.'));
  const howto = el('div', 'howto');
  howto.innerHTML =
    '<b>How to play:</b> each turn you gain ember — spend it to play cards. ' +
    'Creatures take a lane and attack at the end of your turn: the enemy creature ' +
    'in their lane, or the Cinder Queen herself when the lane is empty. ' +
    'Spells strike the Queen, heal you, raise armor, or draw cards. ' +
    'First hero to 0 HP loses.<br>' +
    '<b>Controls:</b> click a card, then a lane — or press 1–7 to pick a card, ' +
    'Enter to end your turn.';
  screen.appendChild(howto);
  const play = el('button', 'play-btn', '▶  PLAY');
  play.addEventListener('click', driver.onPlay);
  screen.appendChild(play);
  screen.appendChild(el('div', 'foot', 'A complete original card game · no account · no network · best of the court wins'));
  app.replaceChildren(screen);
}

function renderTable(app, state, driver) {
  const table = el('div', 'table');

  // Opponent: hero bar + face-down hand.
  table.appendChild(heroBar(state, 'enemy', driver));
  const oppHand = el('div', 'opp-hand');
  oppHand.appendChild(el('span', 'label', `Queen's hand · ${state.enemy.hand.length} cards · deck ${state.enemy.deck.length}`));
  for (let i = 0; i < state.enemy.hand.length; i++) oppHand.appendChild(el('div', 'card-back'));
  table.appendChild(oppHand);

  // Lanes.
  const lanes = el('div', 'lanes');
  for (let lane = 0; lane < 3; lane++) {
    const laneEl = el('div', 'lane' + (driver.canTargetLane(lane) ? ' targetable' : ''));
    laneEl.appendChild(el('div', 'lane-num', `LANE ${lane + 1}`));
    const foeSlot = el('div', 'lane-slot');
    const foe = state.enemy.board[lane];
    if (foe) foeSlot.appendChild(cardEl(foe, { board: true }));
    else foeSlot.appendChild(el('div', 'empty-hand', '·'));
    laneEl.appendChild(foeSlot);
    const mySlot = el('div', 'lane-slot');
    const mine = state.player.board[lane];
    if (mine) mySlot.appendChild(cardEl(mine, { board: true }));
    else mySlot.appendChild(el('div', 'empty-hand', '·'));
    laneEl.appendChild(mySlot);
    if (driver.canTargetLane(lane)) {
      laneEl.addEventListener('click', () => driver.onLaneClick(lane));
    }
    lanes.appendChild(laneEl);
  }
  table.appendChild(lanes);

  // Player area: hand + side panel.
  const area = el('div', 'player-area');
  const hand = el('div', 'hand');
  if (state.player.hand.length === 0) {
    hand.appendChild(el('div', 'empty-hand', 'Hand empty — end your turn to draw.'));
  }
  state.player.hand.forEach((card, i) => {
    const playable = driver.isPlayable(i);
    hand.appendChild(cardEl(card, {
      playable,
      selected: state.selected === i,
      dim: !playable && state.selected !== i,
      onClick: () => driver.onSelectCard(i),
    }));
  });
  area.appendChild(hand);

  const panel = el('div', 'side-panel');
  const emberRow = el('div', 'ember-row');
  emberRow.appendChild(el('span', 'elabel', 'EMBER'));
  for (let i = 0; i < MAX_EMBER; i++) {
    emberRow.appendChild(el('div', 'ember' + (i < state.ember ? ' full' : '')));
  }
  panel.appendChild(emberRow);
  const meta = el('div', 'meta');
  meta.innerHTML =
    `Turn <b>${state.turn}</b> · Ember <b>${state.ember}/${state.emberMax}</b><br>` +
    `Deck <b>${state.player.deck.length}</b> · Damage dealt <b>${state.stats.damageDealt}</b>`;
  panel.appendChild(meta);
  const endBtn = el('button', 'end-btn', 'END TURN ⏎');
  endBtn.disabled = state.aiBusy || state.phase !== 'play';
  endBtn.addEventListener('click', driver.onEndTurn);
  panel.appendChild(endBtn);
  area.appendChild(panel);
  table.appendChild(area);

  // Player hero bar at the very bottom.
  table.appendChild(heroBar(state, 'player', driver));
  table.appendChild(el('div', 'log-line', state.log));
  table.appendChild(el('div', 'hint', state.selected !== null
    ? 'Creature selected — click a glowing lane to place it. Click the card again to cancel.'
    : 'Click a glowing card to play it · keys 1–7 select · Enter ends turn'));
  app.replaceChildren(table);
}

function renderEnd(app, state, driver) {
  const won = state.phase === 'win';
  const overlay = el('div', 'end-screen ' + (won ? 'win' : 'loss'));
  overlay.appendChild(el('h1', null, won ? 'VICTORY' : 'DEFEAT'));
  overlay.appendChild(el('div', 'sub', won
    ? 'The Cinder Queen kneels. The Ember Court is yours.'
    : 'The Queen keeps her throne… this time.'));
  const box = el('div', 'stats-box');
  box.innerHTML =
    `Turns played: <b>${state.stats.turnsTaken}</b><br>` +
    `Damage dealt: <b>${state.stats.damageDealt}</b><br>` +
    `Cards played: <b>${state.stats.cardsPlayed}</b>`;
  overlay.appendChild(box);
  const again = el('button', null, '↻  PLAY AGAIN');
  again.addEventListener('click', driver.onAgain);
  overlay.appendChild(again);
  const title = el('button', 'ghost', 'Title screen');
  title.addEventListener('click', driver.onTitle);
  overlay.appendChild(title);
  app.appendChild(overlay);
}

/** Draw the whole app for the current state. */
export function render(app, state, driver) {
  if (state.phase === 'title') {
    renderTitle(app, driver);
    return;
  }
  renderTable(app, state, driver);
  if (state.phase === 'win' || state.phase === 'loss') renderEnd(app, state, driver);
}
