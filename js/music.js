// Generatywna muzyka w WebAudio — każdy etap imperium ma własny styl. Nic nie jest nagrane,
// każda pętla jest trochę inna. Ziemia: lo-fi z trzaskami winylu. Kosmos: ambient w skali
// lidyjskiej z piknięciami radia. Galaktyka: synthwave z arpeggiami. Wszechświat: dron z dzwonami.
import { getCtx, setMusicWanted } from './audio.js';

const LOOKAHEAD = 0.3;
const VOLUME = 0.55;
const FADE = 1.2;

// Style: tempo, progresje (root + dźwięki akordu w MIDI), skala melodii, barwy i efekty.
const STYLES = {
  earth: {
    bpm: 72, swing: 0.33, tape: 3200, padCut: 950, padVol: 0.035, padTypes: [['triangle', -6], ['sine', 7]], padAttack: 0.5,
    echo: 6, echoFb: 0.33, crackle: true, drums: 'lofi', lead: 'keys', melodyChance: 0.32, bassType: 'sine',
    // Fmaj9 – Em7 – Dm9 – Cmaj9 oraz Am9 – Dm9 – G13 – Cmaj9
    progressions: [
      [{ root: 41, notes: [57, 60, 64, 67] }, { root: 40, notes: [55, 59, 62, 64] }, { root: 38, notes: [53, 57, 60, 64] }, { root: 36, notes: [52, 55, 59, 62] }],
      [{ root: 45, notes: [55, 60, 64, 67] }, { root: 38, notes: [53, 57, 60, 64] }, { root: 43, notes: [53, 59, 64, 65] }, { root: 36, notes: [52, 55, 59, 62] }],
    ],
    scale: [60, 62, 64, 67, 69, 72, 74, 76, 79, 81],
  },
  space: {
    bpm: 60, swing: 0, tape: 2600, padCut: 720, padVol: 0.04, padTypes: [['sawtooth', -8], ['sine', 5]], padAttack: 1.6,
    echo: 8, echoFb: 0.45, crackle: false, radio: true, drums: 'soft', lead: 'bell', melodyChance: 0.22, bassType: 'sine',
    // F lidyjski: Fmaj7#11 – G/F – Em7 – Am9
    progressions: [
      [{ root: 41, notes: [57, 60, 64, 71] }, { root: 41, notes: [55, 59, 62, 67] }, { root: 40, notes: [55, 59, 62, 67] }, { root: 45, notes: [55, 60, 64, 71] }],
    ],
    scale: [65, 67, 69, 71, 72, 76, 77, 79, 81, 83],
  },
  galaxy: {
    bpm: 84, swing: 0, tape: 4200, padCut: 1300, padVol: 0.028, padTypes: [['sawtooth', -10], ['sawtooth', 10]], padAttack: 0.25,
    echo: 3, echoFb: 0.4, crackle: false, drums: 'electro', lead: 'arp', melodyChance: 0.6, bassType: 'triangle',
    // D doryjski: Dm9 – G13 – Fmaj7 – C6
    progressions: [
      [{ root: 38, notes: [57, 60, 64, 65] }, { root: 43, notes: [53, 59, 64, 65] }, { root: 41, notes: [57, 60, 64, 65] }, { root: 36, notes: [55, 57, 60, 64] }],
      [{ root: 38, notes: [57, 60, 62, 65] }, { root: 45, notes: [55, 60, 64, 67] }, { root: 43, notes: [55, 59, 62, 65] }, { root: 43, notes: [53, 59, 62, 67] }],
    ],
    scale: [62, 64, 65, 67, 69, 71, 72, 74, 76, 77],
  },
  universe: {
    bpm: 48, swing: 0, tape: 2200, padCut: 600, padVol: 0.045, padTypes: [['sine', -4], ['sine', 4], ['triangle', 0]], padAttack: 3,
    echo: 12, echoFb: 0.55, crackle: false, drums: 'none', lead: 'bell', melodyChance: 0.14, bassType: 'sine', drone: true,
    // zawieszone współbrzmienia: Csus2 – Absus2 – Fsus2 – Gsus4
    progressions: [
      [{ root: 36, notes: [55, 60, 62, 67] }, { root: 32, notes: [56, 58, 63, 68] }, { root: 29, notes: [53, 55, 60, 65] }, { root: 31, notes: [55, 60, 62, 67] }],
    ],
    scale: [60, 62, 67, 69, 72, 74, 79, 81, 84, 86],
  },
};

let ctx = null;
let bus = null;
let padFilter = null;
let tapeFilter = null;
let echo = null;
let echoFb = null;
let noise = null;
let crackle = null;
let crackleSrc = null;
let timer = null;
let playing = false;
let nextTime = 0;
let step = 0;
let bar = 0;
let lastNote = 0;
let style = STYLES.earth;
let styleId = 'earth';
let switchTimer = null;

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = Math.random;
const stepLen = () => 60 / style.bpm / 4; // szesnastka

function build() {
  ctx = getCtx();
  if (!ctx) return false;
  if (bus) return true;
  // tor główny: głośność → lekkie „falowanie taśmy” → filtr dolnoprzepustowy → wyjście
  bus = ctx.createGain();
  bus.gain.value = 0;
  const wow = ctx.createDelay(0.05);
  wow.delayTime.value = 0.006;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.45;
  lfoGain.gain.value = 0.0012;
  lfo.connect(lfoGain).connect(wow.delayTime);
  lfo.start();
  tapeFilter = ctx.createBiquadFilter();
  tapeFilter.type = 'lowpass';
  tapeFilter.Q.value = 0.4;
  bus.connect(wow).connect(tapeFilter).connect(ctx.destination);

  padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.connect(bus);

  // echo dla melodii
  echo = ctx.createDelay(2);
  echoFb = ctx.createGain();
  const fbFilter = ctx.createBiquadFilter();
  fbFilter.type = 'lowpass';
  fbFilter.frequency.value = 1600;
  echo.connect(fbFilter).connect(echoFb).connect(echo);
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.5;
  echo.connect(echoOut).connect(bus);

  // szum do perkusji i trzasków
  const len = ctx.sampleRate;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
  crackle = ctx.createBuffer(1, len * 2, ctx.sampleRate);
  const c = crackle.getChannelData(0);
  for (let i = 0; i < c.length; i++) c[i] = rnd() < 0.0009 ? (rnd() * 2 - 1) * 0.9 : (rnd() * 2 - 1) * 0.012;
  applyStyle();
  return true;
}

// Ustawia filtry i echo pod bieżący styl.
function applyStyle() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tapeFilter.frequency.setValueAtTime(style.tape, t);
  padFilter.frequency.setValueAtTime(style.padCut, t);
  echo.delayTime.setValueAtTime(Math.min(1.9, stepLen() * style.echo), t);
  echoFb.gain.setValueAtTime(style.echoFb, t);
}

function env(g, t, a, peak, dur, rel) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function pad(note, t, dur) {
  for (const [type, det] of style.padTypes) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = hz(note);
    o.detune.value = det;
    env(g, t, style.padAttack, style.padVol, dur, Math.min(dur * 0.5, 1.2 + style.padAttack * 0.5));
    o.connect(g).connect(padFilter);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function bass(note, t, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = style.bassType;
  o.frequency.value = hz(note);
  env(g, t, 0.015, style.bassType === 'sine' ? 0.16 : 0.1, dur, 0.25);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Ciągły dron (Wszechświat): pryma i kwinta z bardzo wolnym narastaniem.
function drone(root, t, dur) {
  for (const [n, v] of [[root, 0.09], [root + 7, 0.05], [root + 12, 0.03]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = hz(n);
    env(g, t, Math.min(3, dur * 0.4), v, dur, Math.min(3, dur * 0.4));
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

function keys(note, t) {
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  const vib = ctx.createOscillator();
  const vg = ctx.createGain();
  o.type = 'sine';
  o2.type = 'triangle';
  o.frequency.value = hz(note);
  o2.frequency.value = hz(note) * 2;
  vib.frequency.value = 5;
  vg.gain.value = 3;
  vib.connect(vg);
  vg.connect(o.detune);
  vg.connect(o2.detune);
  const g2 = ctx.createGain();
  g2.gain.value = 0.18;
  o2.connect(g2).connect(g);
  o.connect(g);
  env(g, t, 0.02, 0.07, 1.4, 1.2);
  g.connect(bus);
  g.connect(echo);
  for (const x of [o, o2, vib]) { x.start(t); x.stop(t + 1.5); }
}

// Dzwon: sinus z nieharmonicznym alikwotem i długim wybrzmieniem.
function bell(note, t, vol = 0.06) {
  for (const [ratio, v, dur] of [[1, vol, 2.6], [2.76, vol * 0.35, 1.2], [5.4, vol * 0.12, 0.6]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = hz(note) * ratio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus);
    g.connect(echo);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

// Krótka nuta arpeggia (Galaktyka): piła przez filtr, który się domyka.
function arp(note, t, vol = 0.045) {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = hz(note);
  f.type = 'lowpass';
  f.Q.value = 6;
  f.frequency.setValueAtTime(2600, t);
  f.frequency.exponentialRampToValueAtTime(500, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(f).connect(g);
  g.connect(bus);
  g.connect(echo);
  o.start(t);
  o.stop(t + 0.25);
}

// Piknięcie radia (Kosmos): dwa krótkie tony jak z kontroli misji.
function blip(t) {
  const f = 1200 + rnd() * 900;
  for (const [dt, mul] of [[0, 1], [0.09, 1.5]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * mul;
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.exponentialRampToValueAtTime(0.02, t + dt + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.07);
    o.connect(g);
    g.connect(bus);
    g.connect(echo);
    o.start(t + dt);
    o.stop(t + dt + 0.1);
  }
}

function drum(kind, t, vel = 1) {
  if (kind === 'kick') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(style.drums === 'electro' ? 140 : 110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.32 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.4);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + rnd() * 0.4;
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  if (kind === 'snare') {
    f.type = 'bandpass';
    f.frequency.value = style.drums === 'electro' ? 1200 : 1700;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(0.1 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (style.drums === 'electro' ? 0.22 : 0.16));
  } else {
    f.type = 'highpass';
    f.frequency.value = 7000;
    g.gain.setValueAtTime(0.035 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  }
  src.connect(f).connect(g).connect(bus);
  src.start(t, rnd() * 0.5);
  src.stop(t + 0.25);
}

function startCrackle(t) {
  const src = ctx.createBufferSource();
  src.buffer = crackle;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.value = 0.22;
  src.connect(f).connect(g).connect(bus);
  src.start(t);
  return src;
}
function stopCrackle(t) {
  if (crackleSrc) { try { crackleSrc.stop(t); } catch { /* już zatrzymany */ } crackleSrc = null; }
}

function pickMelody(chord) {
  const tones = style.scale.filter((n) => n !== lastNote);
  const pick = rnd() < 0.6 ? tones.filter((n) => chord.notes.some((c) => (c - n) % 12 === 0)) : tones;
  const list = pick.length ? pick : tones;
  const note = list[Math.floor(rnd() * list.length)];
  lastNote = note;
  return note;
}

function scheduleStep(s, t) {
  const STEP = stepLen();
  const progs = style.progressions;
  const prog = progs[Math.floor(bar / 4) % progs.length];
  const chord = prog[bar % 4];
  const swing = s % 4 === 2 ? STEP * style.swing : 0;
  // akord (i dron) na początku taktu
  if (s === 0) for (const n of chord.notes) pad(n, t, STEP * 16 + 0.6);
  if (s === 0 && style.drone) drone(chord.root, t, STEP * 16 + 1.5);
  // bas
  if (!style.drone) {
    if (s === 0) bass(chord.root, t, STEP * 6);
    if (s === 10 && style.drums !== 'soft') bass(rnd() < 0.5 ? chord.root : chord.root + 7, t + swing, STEP * 3);
    if (s === 8 && style.drums === 'soft') bass(chord.root + 7, t, STEP * 6);
  }
  // perkusja
  switch (style.drums) {
    case 'lofi':
      if (s === 0 || (s === 10 && rnd() < 0.8) || (s === 7 && rnd() < 0.15)) drum('kick', t + swing, s === 0 ? 1 : 0.75);
      if (s === 4 || s === 12) drum('snare', t, 0.8 + rnd() * 0.3);
      if (s % 2 === 0) drum('hat', t + swing, s % 4 === 0 ? 1 : 0.6 + rnd() * 0.3);
      break;
    case 'soft':
      if (s === 0) drum('kick', t, 0.6);
      if (s % 4 === 2) drum('hat', t, 0.35 + rnd() * 0.2);
      break;
    case 'electro':
      if (s % 4 === 0) drum('kick', t, s === 0 ? 1 : 0.8);
      if (s === 4 || s === 12) drum('snare', t, 0.9);
      drum('hat', t, s % 2 === 0 ? 0.7 : 0.35);
      break;
    default: break;
  }
  if (style.radio && s === 14 && rnd() < 0.18) blip(t);
  // melodia
  if (style.lead === 'arp') {
    // arpeggio szesnastkami w co drugiej parze taktów
    if (Math.floor(bar / 2) % 2 === 1 || rnd() < 0.15) {
      const notes = [...chord.notes, chord.notes[0] + 12];
      const i = s % 8 < 4 ? s % 4 : 3 - (s % 4);
      if (rnd() < style.melodyChance + 0.3) arp(notes[i] + (s >= 8 ? 12 : 0), t, s % 4 === 0 ? 0.05 : 0.035);
    }
    return;
  }
  const every = style.lead === 'bell' ? 4 : 2;
  if (s % every === 0 && bar % 2 === 1 && rnd() < style.melodyChance) {
    const note = pickMelody(chord);
    if (style.lead === 'bell') bell(note + (styleId === 'universe' ? 12 : 0), t + swing);
    else keys(note, t + swing);
  }
}

function schedule() {
  if (!playing || !ctx) return;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(step, nextTime);
    nextTime += stepLen();
    step++;
    if (step === 16) { step = 0; bar++; }
  }
}

function fadeIn(now) {
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
  bus.gain.linearRampToValueAtTime(VOLUME, now + 2.5);
}

export function startMusic() {
  setMusicWanted(true);
  if (playing) return;
  if (!build()) return;
  if (ctx.state === 'suspended') ctx.resume();
  playing = true;
  const now = ctx.currentTime;
  applyStyle();
  fadeIn(now);
  nextTime = now + 0.12;
  step = 0;
  if (style.crackle && !crackleSrc) crackleSrc = startCrackle(now);
  timer = setInterval(schedule, 60);
  schedule();
}

export function stopMusic(forget = true) {
  if (forget) setMusicWanted(false);
  if (!playing) return;
  playing = false;
  clearInterval(timer);
  timer = null;
  const now = ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(bus.gain.value, now);
  bus.gain.linearRampToValueAtTime(0.0001, now + 0.6);
  stopCrackle(now + 0.7);
}

// Styl muzyki etapu (earth, space, galaxy, universe). Gdy muzyka gra, przejście jest płynne.
export function setMusicStyle(id) {
  const next = STYLES[id] ? id : 'earth';
  if (next === styleId) return;
  styleId = next;
  if (!playing || !ctx) { style = STYLES[next]; return; }
  clearTimeout(switchTimer);
  const now = ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(bus.gain.value, now);
  bus.gain.linearRampToValueAtTime(0.0001, now + FADE);
  switchTimer = setTimeout(() => {
    if (!playing) { style = STYLES[styleId]; return; }
    style = STYLES[styleId];
    const t = ctx.currentTime;
    applyStyle();
    if (style.crackle && !crackleSrc) crackleSrc = startCrackle(t);
    if (!style.crackle) stopCrackle(t);
    nextTime = t + 0.1;
    step = 0;
    bar = 0;
    fadeIn(t);
  }, FADE * 1000);
}
export function musicStyle() { return styleId; }

// Czy muzyka faktycznie gra (kontekst wznowiony przez gest użytkownika).
export function musicAudible() {
  return playing && !!ctx && ctx.state === 'running';
}
