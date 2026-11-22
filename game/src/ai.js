// ai.js — the Cinder Queen: a readable, counterable heuristic.
// Returns one action at a time ({type:'creature',handIndex,lane} or
// {type:'spell',handIndex}) or null when she is done for the turn.
import { canPlay, firstEmptyLane } from './state.js';

function spellDamage(card) {
  if (card.key === 'spark') return 2;
  if (card.key === 'fireball') return 4;
  if (card.key === 'meteor') return 6;
  return 0;
}

export function chooseAction(state) {
  const hand = state.enemy.hand;
  const ember = state.enemyEmber;
  const playerHp = state.player.hp;
  const myHp = state.enemy.hp;

  // 1. Lethal: a damage spell that ends the game wins on the spot.
  let bestLethal = -1;
  let lethalDmg = 0;
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (card.kind !== 'spell' || card.cost > ember) continue;
    const dmg = spellDamage(card);
    if (dmg > 0 && dmg >= playerHp && dmg > lethalDmg) {
      bestLethal = i;
      lethalDmg = dmg;
    }
  }
  if (bestLethal >= 0) return { type: 'spell', handIndex: bestLethal };

  // 2. Finish a nearly-dead hero with any damage spell.
  if (playerHp <= 6) {
    let best = -1;
    let bestDmg = 0;
    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      if (card.kind !== 'spell' || card.cost > ember) continue;
      const dmg = spellDamage(card);
      if (dmg > bestDmg) {
        best = i;
        bestDmg = dmg;
      }
    }
    if (best >= 0) return { type: 'spell', handIndex: best };
  }

  // 3. Play the most expensive affordable creature, into the lane facing the
  // weakest enemy creature (to trade up), else the first empty lane.
  let bestCreature = -1;
  let bestCost = -1;
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (card.kind !== 'creature' || card.cost > ember) continue;
    if (card.cost > bestCost) {
      bestCreature = i;
      bestCost = card.cost;
    }
  }
  if (bestCreature >= 0) {
    const lane = pickLane(state);
    if (lane >= 0) return { type: 'creature', handIndex: bestCreature, lane };
  }

  // 4. Hurt? Heal or armor up.
  if (myHp <= 12) {
    for (let i = 0; i < hand.length; i++) {
      if (hand[i].key === 'mend' && hand[i].cost <= ember) {
        return { type: 'spell', handIndex: i };
      }
    }
  }
  if (myHp <= 15) {
    for (let i = 0; i < hand.length; i++) {
      if (hand[i].key === 'aegis' && hand[i].cost <= ember) {
        return { type: 'spell', handIndex: i };
      }
    }
  }

  // 5. Small hand? Draw.
  if (hand.length < 4) {
    for (let i = 0; i < hand.length; i++) {
      if (hand[i].key === 'insight' && hand[i].cost <= ember) {
        return { type: 'spell', handIndex: i };
      }
    }
  }

  // 6. Otherwise throw any affordable damage spell at the hero.
  let best = -1;
  let bestDmg = 0;
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (card.kind !== 'spell' || card.cost > ember) continue;
    const dmg = spellDamage(card);
    if (dmg > bestDmg) {
      best = i;
      bestDmg = dmg;
    }
  }
  if (best >= 0) return { type: 'spell', handIndex: best };

  // 7. Nothing good to do: end the turn.
  return null;
}

/** Lane facing the weakest player creature, else first empty lane. */
function pickLane(state) {
  let lane = -1;
  let weakest = Infinity;
  for (let i = 0; i < 3; i++) {
    if (state.enemy.board[i]) continue;
    const foe = state.player.board[i];
    if (foe && foe.hp < weakest) {
      weakest = foe.hp;
      lane = i;
    }
  }
  if (lane >= 0) return lane;
  return firstEmptyLane(state, 'enemy');
}
