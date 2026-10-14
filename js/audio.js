// Delikatne dźwięki syntezowane w WebAudio — bez plików audio.
let ctx = null;
let master = null;
let enabled = false;
let lastClick = 0;
let keepAlive = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  return ctx;
}

// Wspólny kontekst audio dla efektów i muzyki (iOS pozwala go wznowić tylko w geście użytkownika).
export function getCtx() { return ensure(); }
export function setMusicWanted(on) { keepAlive = on; }

export function setSound(on) {
  enabled = on;
  if (on) {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }
}

export function unlockAudio() {
  if (!enabled && !keepAlive) return;
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq, start, dur, { type = 'sine', vol = 0.2, slide = 0 } = {}) {
  const c = ctx;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export function play(kind) {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime;
  switch (kind) {
    case 'click': {
      if (t - lastClick < 0.035) return;
      lastClick = t;
      tone(520 + Math.random() * 260, t, 0.07, { type: 'triangle', vol: 0.12, slide: 1.4 });
      break;
    }
    case 'buy':
      tone(660, t, 0.08, { type: 'triangle', vol: 0.12 });
      tone(990, t + 0.06, 0.1, { type: 'triangle', vol: 0.1 });
      break;
    case 'unlock':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.18, { type: 'sine', vol: 0.12 }));
      break;
    case 'achievement':
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.06, 0.22, { type: 'triangle', vol: 0.1 }));
      break;
    case 'bubble':
      tone(880, t, 0.12, { type: 'sine', vol: 0.15, slide: 2 });
      tone(1320, t + 0.08, 0.16, { type: 'sine', vol: 0.1, slide: 1.5 });
      break;
    case 'coin':
      tone(1200, t, 0.06, { type: 'square', vol: 0.05 });
      tone(1800, t + 0.05, 0.12, { type: 'square', vol: 0.05 });
      break;
    case 'prestige':
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.35, { type: 'sine', vol: 0.12 }));
      break;
    default:
      break;
  }
}
