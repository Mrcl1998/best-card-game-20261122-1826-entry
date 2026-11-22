// audio.js — tiny WebAudio bleeps, no audio files. Everything is guarded:
// a headless screenshot run has no sound hardware and must never throw.
let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur);
  } catch {
    // Silence is fine; never break the game for sound.
  }
}

/** Play a named sound effect. */
export function sfx(name) {
  switch (name) {
    case 'click':
      tone(620, 0.06, 'triangle', 0.12);
      break;
    case 'select':
      tone(520, 0.07, 'triangle', 0.12);
      tone(780, 0.07, 'triangle', 0.1, 0.05);
      break;
    case 'play':
      tone(440, 0.09, 'square', 0.08);
      tone(660, 0.12, 'square', 0.08, 0.07);
      break;
    case 'draw':
      tone(880, 0.05, 'sine', 0.08);
      break;
    case 'attack':
      tone(190, 0.13, 'sawtooth', 0.14);
      break;
    case 'hurt':
      tone(130, 0.18, 'sawtooth', 0.16);
      break;
    case 'heal':
      tone(520, 0.1, 'sine', 0.1);
      tone(780, 0.14, 'sine', 0.1, 0.08);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12));
      break;
    case 'lose':
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.14));
      break;
    default:
      break;
  }
}
