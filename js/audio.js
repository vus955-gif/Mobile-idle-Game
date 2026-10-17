// Delikatne dźwięki syntezowane w WebAudio — bez plików audio. Każdy etap ma własną barwę:
// Ziemia — klawiatura i monety, Kosmos — radio i silniki, Galaktyka — warp, Wszechświat — dzwony.
let ctx = null;
let sfx = 'earth';
let noiseBuf = null;
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

// Barwa efektów dla etapu na ekranie.
export function setSfxStyle(id) { sfx = id || 'earth'; }

function noise() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
// Szum przez filtr pasmowy, który przesuwa się od f0 do f1 (silnik rakiety, warp).
function whoosh(start, dur, f0, f1, vol = 0.12) {
  const src = ctx.createBufferSource();
  src.buffer = noise();
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(f0, start);
  f.frequency.exponentialRampToValueAtTime(f1, start + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(master);
  src.start(start);
  src.stop(start + dur + 0.02);
}
// Dzwon: sinus z nieharmonicznym alikwotem.
function bell(freq, start, dur = 0.9, vol = 0.1) {
  tone(freq, start, dur, { type: 'sine', vol });
  tone(freq * 2.76, start, dur * 0.45, { type: 'sine', vol: vol * 0.35 });
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
  if (sfx !== 'earth' && playLayer(kind, t)) return;
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

// Warianty efektów dla dalszych etapów. Zwraca true, jeśli etap ma własną wersję dźwięku.
function playLayer(kind, t) {
  const S = {
    space: {
      click: () => { if (t - lastClick < 0.035) return; lastClick = t; tone(380 + Math.random() * 120, t, 0.09, { type: 'sine', vol: 0.11, slide: 1.8 }); },
      buy: () => { tone(1320, t, 0.05, { type: 'sine', vol: 0.09 }); tone(1760, t + 0.07, 0.07, { type: 'sine', vol: 0.08 }); },
      unlock: () => { [440, 554, 659, 880].forEach((f, i) => tone(f, t + i * 0.09, 0.3, { type: 'sine', vol: 0.1 })); },
      achievement: () => { [659, 880, 1109, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.35, { type: 'sine', vol: 0.09 })); },
      coin: () => { tone(1500, t, 0.05, { type: 'sine', vol: 0.07 }); tone(2000, t + 0.06, 0.08, { type: 'sine', vol: 0.06 }); },
      prestige: () => { whoosh(t, 1.6, 200, 2400, 0.16); [349, 440, 523, 659, 880].forEach((f, i) => tone(f, t + 0.4 + i * 0.12, 0.6, { type: 'sine', vol: 0.1 })); },
    },
    galaxy: {
      click: () => { if (t - lastClick < 0.035) return; lastClick = t; tone(300 + Math.random() * 150, t, 0.08, { type: 'sawtooth', vol: 0.05, slide: 3 }); },
      buy: () => { tone(587, t, 0.07, { type: 'square', vol: 0.05, slide: 1.5 }); tone(880, t + 0.06, 0.09, { type: 'square', vol: 0.045, slide: 1.5 }); },
      unlock: () => { [294, 440, 587, 880, 1175].forEach((f, i) => tone(f, t + i * 0.05, 0.2, { type: 'sawtooth', vol: 0.045 })); },
      achievement: () => { [587, 740, 880, 1175].forEach((f, i) => tone(f, t + i * 0.06, 0.25, { type: 'square', vol: 0.045 })); },
      coin: () => { tone(1175, t, 0.05, { type: 'square', vol: 0.045, slide: 1.4 }); tone(1760, t + 0.05, 0.08, { type: 'square', vol: 0.04 }); },
      prestige: () => { whoosh(t, 1.2, 300, 6000, 0.14); [294, 440, 587, 740, 880, 1175].forEach((f, i) => tone(f, t + 0.3 + i * 0.07, 0.4, { type: 'sawtooth', vol: 0.045 })); },
    },
    universe: {
      click: () => { if (t - lastClick < 0.05) return; lastClick = t; bell(520 + Math.random() * 260, t, 0.5, 0.07); },
      buy: () => { bell(784, t, 0.6, 0.08); },
      unlock: () => { [392, 523, 587, 784].forEach((f, i) => bell(f, t + i * 0.12, 1.1, 0.08)); },
      achievement: () => { [523, 659, 784, 1047].forEach((f, i) => bell(f, t + i * 0.1, 1.2, 0.07)); },
      coin: () => { bell(1047, t, 0.5, 0.06); },
      prestige: () => { tone(65, t, 2.4, { type: 'sine', vol: 0.22 }); whoosh(t, 2.2, 120, 900, 0.1); [262, 392, 523, 784, 1047].forEach((f, i) => bell(f, t + 0.6 + i * 0.16, 1.6, 0.08)); },
    },
  };
  const fn = S[sfx] && S[sfx][kind];
  if (!fn) return false;
  fn();
  return true;
}
