// Generatywne lo-fi w WebAudio: akordy, bas, miękka perkusja, melodia z pogłosem i trzaski winylu.
// Nic nie jest nagrane — każda pętla jest trochę inna.
import { getCtx, setMusicWanted } from './audio.js';

const BPM = 72;
const STEP = 60 / BPM / 4; // szesnastka
const LOOKAHEAD = 0.3;
const VOLUME = 0.55;

// Dwie progresje (C-dur, „opadające” lo-fi): Fmaj9 – Em7 – Dm9 – Cmaj9 oraz Am9 – Dm9 – G13 – Cmaj9.
const PROGRESSIONS = [
  [{ root: 41, notes: [57, 60, 64, 67] }, { root: 40, notes: [55, 59, 62, 64] }, { root: 38, notes: [53, 57, 60, 64] }, { root: 36, notes: [52, 55, 59, 62] }],
  [{ root: 45, notes: [55, 60, 64, 67] }, { root: 38, notes: [53, 57, 60, 64] }, { root: 43, notes: [53, 59, 64, 65] }, { root: 36, notes: [52, 55, 59, 62] }],
];
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

let ctx = null;
let bus = null;
let padFilter = null;
let echo = null;
let noise = null;
let crackle = null;
let timer = null;
let playing = false;
let nextTime = 0;
let step = 0;
let bar = 0;
let lastNote = 0;

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = Math.random;

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
  const tape = ctx.createBiquadFilter();
  tape.type = 'lowpass';
  tape.frequency.value = 3200;
  tape.Q.value = 0.4;
  bus.connect(wow).connect(tape).connect(ctx.destination);

  padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 950;
  padFilter.connect(bus);

  // echo dla melodii
  echo = ctx.createDelay(1);
  echo.delayTime.value = STEP * 6;
  const fb = ctx.createGain();
  fb.gain.value = 0.33;
  const fbFilter = ctx.createBiquadFilter();
  fbFilter.type = 'lowpass';
  fbFilter.frequency.value = 1600;
  echo.connect(fbFilter).connect(fb).connect(echo);
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
  return true;
}

function env(g, t, a, peak, dur, rel) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function pad(note, t, dur) {
  for (const [type, det] of [['triangle', -6], ['sine', 7]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = hz(note);
    o.detune.value = det;
    env(g, t, 0.5, 0.035, dur, 1.2);
    o.connect(g).connect(padFilter);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function bass(note, t, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = hz(note);
  env(g, t, 0.015, 0.16, dur, 0.25);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
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

function drum(kind, t, vel = 1) {
  if (kind === 'kick') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
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
    f.frequency.value = 1700;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(0.1 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  } else {
    f.type = 'highpass';
    f.frequency.value = 7000;
    g.gain.setValueAtTime(0.035 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  }
  src.connect(f).connect(g).connect(bus);
  src.start(t, rnd() * 0.5);
  src.stop(t + 0.2);
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

let crackleSrc = null;

function scheduleStep(s, t) {
  const prog = PROGRESSIONS[Math.floor(bar / 4) % 2];
  const chord = prog[bar % 4];
  const swing = s % 4 === 2 ? STEP * 0.33 : 0;
  // akord na początku taktu
  if (s === 0) for (const n of chord.notes) pad(n, t, STEP * 16 + 0.6);
  // bas: pierwsza ćwierćnuta i synkopa
  if (s === 0) bass(chord.root, t, STEP * 6);
  if (s === 10) bass(rnd() < 0.5 ? chord.root : chord.root + 7, t + swing, STEP * 3);
  // perkusja
  if (s === 0 || (s === 10 && rnd() < 0.8) || (s === 7 && rnd() < 0.15)) drum('kick', t + swing, s === 0 ? 1 : 0.75);
  if (s === 4 || s === 12) drum('snare', t, 0.8 + rnd() * 0.3);
  if (s % 2 === 0) drum('hat', t + swing, s % 4 === 0 ? 1 : 0.6 + rnd() * 0.3);
  // melodia: odpowiada w co drugim takcie, z przerwami
  if (s % 2 === 0 && bar % 2 === 1 && rnd() < 0.32) {
    const tones = PENTA.filter((n) => n !== lastNote);
    const pick = rnd() < 0.6 ? tones.filter((n) => chord.notes.some((c) => (c - n) % 12 === 0)) : tones;
    const note = (pick.length ? pick : tones)[Math.floor(rnd() * (pick.length ? pick.length : tones.length))];
    lastNote = note;
    keys(note, t + swing);
  }
}

function schedule() {
  if (!playing || !ctx) return;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(step, nextTime);
    nextTime += STEP;
    step++;
    if (step === 16) { step = 0; bar++; }
  }
}

export function startMusic() {
  setMusicWanted(true);
  if (playing) return;
  if (!build()) return;
  if (ctx.state === 'suspended') ctx.resume();
  playing = true;
  const now = ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
  bus.gain.linearRampToValueAtTime(VOLUME, now + 2.5);
  nextTime = now + 0.12;
  step = 0;
  if (!crackleSrc) crackleSrc = startCrackle(now);
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
  if (crackleSrc) { try { crackleSrc.stop(now + 0.7); } catch { /* już zatrzymany */ } crackleSrc = null; }
}

// Czy muzyka faktycznie gra (kontekst wznowiony przez gest użytkownika).
export function musicAudible() {
  return playing && !!ctx && ctx.state === 'running';
}
