// state.js — the rules of Ember Court: state creation, playing cards,
// combat, turns, and the win/loss check. No DOM here, so it is easy to test.
import { buildDeck, makeCard } from './cards.js';

export const MAX_HP = 30;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;
export const LANES = 3;

function newHero(rng) {
  return { hp: MAX_HP, maxHp: MAX_HP, armor: 0, deck: buildDeck(rng), hand: [], board: [null, null, null], discard: [] };
}

/** A fresh game: both heroes draw 3, player starts with 1 ember. */
export function newGame(rng) {
  const state = {
    phase: 'play',
    turn: 1,
    ember: 1,
    emberMax: 1,
    enemyEmber: 0,
    enemyEmberMax: 0,
    player: newHero(rng),
    enemy: newHero(rng),
    log: 'Your turn — play a card, then end your turn.',
    stats: { damageDealt: 0, cardsPlayed: 0, turnsTaken: 0 },
    selected: null,
    aiBusy: false,
  };
  for (let i = 0; i < 3; i++) {
    drawCard(state, 'player');
    drawCard(state, 'enemy');
  }
  return state;
}

/** Draw one card for a side; reshuffles the discard pile when the deck is empty. */
export function drawCard(state, side) {
  const hero = state[side];
  if (hero.deck.length === 0) {
    if (hero.discard.length === 0) return null;
    hero.deck = hero.discard;
    hero.discard = [];
    // Fisher-Yates with Math.random is fine here: order no longer matters for the game.
    for (let i = hero.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hero.deck[i], hero.deck[j]] = [hero.deck[j], hero.deck[i]];
    }
  }
  const card = hero.deck.pop();
  if (hero.hand.length < MAX_HAND) hero.hand.push(card);
  return card;
}

/** Damage a hero: armor absorbs first. Returns the HP actually lost. */
export function damageHero(state, side, amount) {
  const hero = state[side];
  let left = amount;
  if (hero.armor > 0) {
    const absorbed = Math.min(hero.armor, left);
    hero.armor -= absorbed;
    left -= absorbed;
  }
  const lost = Math.min(hero.hp, left);
  hero.hp -= lost;
  return lost;
}

export function healHero(state, side, amount) {
  const hero = state[side];
  hero.hp = Math.min(hero.maxHp, hero.hp + amount);
}

/** Can this side afford and legally play the card at handIndex? */
export function canPlay(state, side, handIndex) {
  const hero = state[side];
  const card = hero.hand[handIndex];
  if (!card) return false;
  if (side === 'player' && card.cost > state.ember) return false;
  if (side === 'enemy' && card.cost > state.enemyEmber) return false;
  if (card.kind === 'creature' && !hero.board.includes(null)) return false;
  return true;
}

/** Place a creature from hand into a lane. Returns true on success. */
export function playCreature(state, side, handIndex, lane) {
  const hero = state[side];
  const card = hero.hand[handIndex];
  if (!card || card.kind !== 'creature') return false;
  if (lane < 0 || lane >= LANES || hero.board[lane]) return false;
  const cost = card.cost;
  if (side === 'player') {
    if (cost > state.ember) return false;
    state.ember -= cost;
  } else {
    if (cost > state.enemyEmber) return false;
    state.enemyEmber -= cost;
  }
  hero.hand.splice(handIndex, 1);
  const creature = { ...card };
  hero.board[lane] = creature;
  state.stats.cardsPlayed++;
  if (card.key === 'phoenix') {
    // Storm Phoenix battlecry: 2 damage to the enemy hero.
    const foe = side === 'player' ? 'enemy' : 'player';
    const lost = damageHero(state, foe, 2);
    if (side === 'player') state.stats.damageDealt += lost;
  }
  return true;
}

/** Cast a spell from hand. Returns true on success. */
export function castSpell(state, side, handIndex) {
  const hero = state[side];
  const card = hero.hand[handIndex];
  if (!card || card.kind !== 'spell') return false;
  const cost = card.cost;
  if (side === 'player') {
    if (cost > state.ember) return false;
    state.ember -= cost;
  } else {
    if (cost > state.enemyEmber) return false;
    state.enemyEmber -= cost;
  }
  const foe = side === 'player' ? 'enemy' : 'player';
  switch (card.key) {
    case 'spark': {
      const lost = damageHero(state, foe, 2);
      if (side === 'player') state.stats.damageDealt += lost;
      break;
    }
    case 'fireball': {
      const lost = damageHero(state, foe, 4);
      if (side === 'player') state.stats.damageDealt += lost;
      break;
    }
    case 'meteor': {
      const lost = damageHero(state, foe, 6);
      if (side === 'player') state.stats.damageDealt += lost;
      break;
    }
    case 'mend':
      healHero(state, side, 6);
      break;
    case 'aegis':
      hero.armor += 6;
      break;
    case 'insight':
      drawCard(state, side);
      drawCard(state, side);
      break;
    default:
      return false;
  }
  hero.hand.splice(handIndex, 1);
  hero.discard.push(card);
  state.stats.cardsPlayed++;
  return true;
}

/**
 * Combat: every creature of `side` attacks — the enemy creature in the same
 * lane, or the enemy hero when the lane is empty. Returns the attack events
 * (for animation/sound) and applies the damage.
 */
export function resolveAttacks(state, side) {
  const foe = side === 'player' ? 'enemy' : 'player';
  const events = [];
  for (let lane = 0; lane < LANES; lane++) {
    const attacker = state[side].board[lane];
    if (!attacker) continue;
    const defender = state[foe].board[lane];
    if (defender) {
      defender.hp -= attacker.atk;
      events.push({ lane, kind: 'creature', dmg: attacker.atk, attacker: attacker.name });
      if (defender.hp <= 0) {
        state[foe].discard.push(defender);
        state[foe].board[lane] = null;
      }
    } else {
      const lost = damageHero(state, foe, attacker.atk);
      events.push({ lane, kind: 'hero', dmg: attacker.atk, attacker: attacker.name });
      if (side === 'player') state.stats.damageDealt += lost;
    }
  }
  return events;
}

/** 'win' | 'loss' | null — checked after every damaging action. */
export function checkEnd(state) {
  if (state.enemy.hp <= 0) return 'win';
  if (state.player.hp <= 0) return 'loss';
  return null;
}

/** Begin a new player turn: ember grows by 1 (cap 10), refills, draw 1. */
export function startPlayerTurn(state) {
  state.turn++;
  state.stats.turnsTaken = state.turn;
  state.emberMax = Math.min(MAX_EMBER, state.emberMax + 1);
  state.ember = state.emberMax;
  drawCard(state, 'player');
}

/** The enemy's ember for its turn: max grows by 1 (cap 10), then refills. */
export function startEnemyTurn(state) {
  state.enemyEmberMax = Math.min(MAX_EMBER, (state.enemyEmberMax ?? 0) + 1);
  state.enemyEmber = state.enemyEmberMax;
  drawCard(state, 'enemy');
}

/** First empty lane for a side, or -1. */
export function firstEmptyLane(state, side) {
  return state[side].board.indexOf(null);
}
