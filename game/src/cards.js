// cards.js — every card in Ember Court: definitions + the 30-card deck.
export const CARDS = {
  imp:     { key: 'imp',     name: 'Spark Imp',     kind: 'creature', cost: 1, atk: 1, hp: 2, color: '#e74c3c', shape: '●', text: 'A tiny ember with a big temper.' },
  wolf:    { key: 'wolf',    name: 'Cinder Wolf',   kind: 'creature', cost: 2, atk: 2, hp: 2, color: '#e67e22', shape: '▲', text: 'Hunts in packs of smoke.' },
  knight:  { key: 'knight',  name: 'Flame Knight',  kind: 'creature', cost: 3, atk: 3, hp: 3, color: '#f1c40f', shape: '◆', text: 'Sworn to the Ember Court.' },
  golem:   { key: 'golem',   name: 'Ash Golem',     kind: 'creature', cost: 4, atk: 4, hp: 5, color: '#95a5a6', shape: '■', text: 'Slow. Unstoppable. Warm.' },
  phoenix: { key: 'phoenix', name: 'Storm Phoenix', kind: 'creature', cost: 5, atk: 5, hp: 4, color: '#9b59b6', shape: '★', text: 'On play: deal 2 to the enemy hero.' },
  dragon:  { key: 'dragon',  name: 'Ember Dragon',  kind: 'creature', cost: 6, atk: 7, hp: 7, color: '#c0392b', shape: '♛', text: 'The court bows to no one.' },
  spark:   { key: 'spark',   name: 'Spark',         kind: 'spell', cost: 1, color: '#e74c3c', shape: '●', text: 'Deal 2 damage to the enemy hero.' },
  fireball:{ key: 'fireball',name: 'Fireball',      kind: 'spell', cost: 2, color: '#d35400', shape: '▲', text: 'Deal 4 damage to the enemy hero.' },
  meteor:  { key: 'meteor',  name: 'Meteor',        kind: 'spell', cost: 5, color: '#8e44ad', shape: '★', text: 'Deal 6 damage to the enemy hero.' },
  mend:    { key: 'mend',    name: 'Mend',          kind: 'spell', cost: 2, color: '#27ae60', shape: '✚', text: 'Restore 6 HP to your hero.' },
  aegis:   { key: 'aegis',   name: 'Aegis',         kind: 'spell', cost: 2, color: '#2980b9', shape: '⛨', text: 'Gain 6 armor.' },
  insight: { key: 'insight', name: 'Insight',       kind: 'spell', cost: 2, color: '#16a085', shape: '◆', text: 'Draw 2 cards.' },
};

// Deck recipe: [card key, copies]. Totals 30 cards.
export const DECKLIST = [
  ['imp', 3], ['wolf', 3], ['knight', 3], ['golem', 2], ['phoenix', 2], ['dragon', 1],
  ['spark', 3], ['fireball', 3], ['meteor', 1], ['mend', 2], ['aegis', 2], ['insight', 2],
];

let nextUid = 1;

/** A fresh playable copy of a card definition. */
export function makeCard(key) {
  const def = CARDS[key];
  const card = { uid: nextUid++, ...def };
  if (card.kind === 'creature') card.maxHp = card.hp;
  return card;
}

/** A shuffled 30-card deck built from DECKLIST. */
export function buildDeck(rng) {
  const deck = [];
  for (const [key, count] of DECKLIST) {
    for (let i = 0; i < count; i++) deck.push(makeCard(key));
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
