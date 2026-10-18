// Testy oprawy: szum, płótna, klocki, przepisy widoków i zarządca tła (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, perlin, fbm, ridged } from '../js/art/noise.js';
import { makeCanvas, setCanvasFactory } from '../js/art/canvas.js';
import { mockCanvas, hashPixels } from './helpers/mock-canvas.mjs';
import { stars, milkyBand, nebula, cosmicWeb, aurora, auroraAnimator, brightStar } from '../js/art/kit/sky.js';
import { GALAXY_RECIPES } from '../js/art/views/galaxy.js';
import { UNIVERSE_RECIPES } from '../js/art/views/universe.js';
import { SPACE_RECIPES } from '../js/art/views/space.js';
import { EARTH_RECIPES } from '../js/art/views/earth.js';
import { planet, rings, sun, galaxy, cluster, lens, blackHole, blackHoleAnimator } from '../js/art/kit/bodies.js';
import { horizon } from '../js/art/kit/surface.js';
import { earthSky, sunMoon, cloudBank, cityPlanes, mountains, water, fogBank } from '../js/art/kit/earth.js';
import { RECIPES, VIEW_IDS, recipeFor, validLight } from '../js/art/views/index.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { sizeBucket, envKey, cacheKey, Lru, Backdrop } from '../js/art/backdrop.js';

setCanvasFactory(mockCanvas);

test('noise: rng jest deterministyczny i w [0,1)', () => {
  const a = rng(42), b = rng(42);
  for (let i = 0; i < 1000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
  assert.notEqual(rng(1)(), rng(2)());
});

test('noise: perlin, fbm i ridged mieszczą się w zakresach i zależą od ziarna', () => {
  const n = perlin(7), m = perlin(7), o = perlin(8);
  let diff = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const u = x * 0.173, v = y * 0.191;
    assert.ok(Math.abs(n(u, v)) <= 1);
    assert.equal(n(u, v), m(u, v));
    diff += Math.abs(n(u, v) - o(u, v));
    assert.ok(Math.abs(fbm(n, u, v, 6)) <= 1);
    const r = ridged(n, u, v, 5); assert.ok(r >= 0 && r <= 1);
  }
  assert.ok(diff > 1, 'inne ziarno, inny szum');
});

test('canvas: fabryka testowa działa i hash zależy od pikseli', () => {
  const c = makeCanvas(4, 4);
  assert.equal(c.width, 4);
  const ctx = c.getContext('2d');
  const empty = hashPixels(c);
  const img = ctx.createImageData(1, 1);
  img.data.set([255, 255, 255, 255]);
  ctx.putImageData(img, 2, 1);
  assert.notEqual(hashPixels(c), empty);
  ctx.fillRect(0, 0, 4, 4);
  assert.ok(ctx.calls.includes('fillRect'));
});

test('canvas: drawImage z płótna testowego kopiuje piksele ze skalowaniem', () => {
  const src = mockCanvas(2, 2), sctx = src.getContext('2d');
  const img = sctx.createImageData(2, 2);
  img.data.set([255, 0, 0, 255], 0);
  sctx.putImageData(img, 0, 0);
  const dst = mockCanvas(4, 4), dctx = dst.getContext('2d');
  dctx.drawImage(src, 0, 0, 4, 4);
  const d = dctx.getImageData(0, 0, 4, 4).data;
  assert.equal(d[0], 255);
  assert.equal(d[(1 * 4 + 1) * 4], 255, 'piksel (1,1) pochodzi z (0,0) źródła');
  assert.equal(d[(2 * 4 + 2) * 4], 0, 'piksel (2,2) pochodzi z (1,1) źródła');
});

// Dwa rendery tego samego klocka na świeżych płótnach testowych.
const KW = 120, KH = 160;
const EMPTY = hashPixels(mockCanvas(KW, KH));
function twice(fn) {
  const a = mockCanvas(KW, KH), b = mockCanvas(KW, KH);
  fn(a.getContext('2d')); fn(b.getContext('2d'));
  return [a, b];
}
function pixelsDeterministic(name, fn) {
  const [a, b] = twice(fn);
  assert.equal(hashPixels(a), hashPixels(b), `${name}: deterministycznie`);
  assert.notEqual(hashPixels(a), EMPTY, `${name}: zmienia piksele`);
}
function callsDeterministic(name, fn) {
  const [a, b] = twice(fn);
  const ca = a.getContext('2d').calls, cb = b.getContext('2d').calls;
  assert.ok(ca.length > 0, `${name}: coś rysuje`);
  assert.deepEqual(ca, cb, `${name}: deterministycznie`);
}

test('kit/sky: każdy klocek rysuje bez wyjątku, deterministycznie i zmienia piksele', () => {
  pixelsDeterministic('milkyBand', (c) => milkyBand(c, KW, KH, { seed: 2, angle: 0.4, width: 0.25, color: [180, 160, 220] }));
  pixelsDeterministic('nebula', (c) => nebula(c, KW, KH, { seed: 3, palette: [[70, 200, 215], [255, 70, 160], [255, 226, 200]], core: { x: 0.55, y: 0.4, r: 0.45 } }));
  pixelsDeterministic('cosmicWeb', (c) => cosmicWeb(c, KW, KH, { seed: 4, color: [110, 90, 230], node: [255, 210, 150] }));
  callsDeterministic('stars', (c) => stars(c, KW, KH, { seed: 1, count: 300 }));
  callsDeterministic('aurora', (c) => aurora(c, KW, KH, { seed: 5, colors: [[60, 255, 170], [140, 120, 255]], y: 0.3, height: 0.25 }));
  const anim = auroraAnimator({ seed: 5, colors: [[60, 255, 170], [140, 120, 255]], y: 0.3, height: 0.25 });
  const c = mockCanvas(KW, KH).getContext('2d');
  anim(c, KW, KH, 1.5);
  assert.ok(c.calls.length > 0, 'animator zorzy rysuje');
});

test('kit/bodies: klocki rysują bez wyjątku i deterministycznie', () => {
  const L = [-0.8, 0.2, 0.4];
  for (const kind of ['earth', 'rocky', 'gas', 'ice', 'lava']) {
    pixelsDeterministic(`planet ${kind}`, (c) => planet(c, {
      cx: 0.5, cy: 0.9, r: 0.8, seed: 9, kind, light: L, atmosphere: kind === 'earth' ? [70, 150, 255] : null,
      cityLights: kind === 'earth', bands: kind === 'gas' ? [[200, 160, 120], [240, 220, 190], [170, 110, 80]] : null,
      spot: kind === 'gas' ? { lat: -0.35, lon: 0.4, r: 0.18, color: [200, 90, 60] } : null,
    }));
  }
  pixelsDeterministic('galaxy spiral', (c) => galaxy(c, { cx: 0.5, cy: 0.3, r: 0.4, tilt: 0.4, rot: 0.3, seed: 2, type: 'spiral', core: [255, 230, 190], arm: [180, 200, 255] }));
  pixelsDeterministic('galaxy elliptical', (c) => galaxy(c, { cx: 0.5, cy: 0.3, r: 0.3, tilt: 0.7, rot: 0.1, seed: 3, type: 'elliptical', core: [255, 220, 170], arm: [255, 210, 160] }));
  callsDeterministic('rings', (c) => rings(c, { cx: 0.5, cy: 0.4, r1: 0.3, r2: 0.5, tilt: 0.2, color: [220, 200, 170], light: L }));
  callsDeterministic('sun', (c) => sun(c, { x: 0.2, y: 0.2, r: 0.05, color: [255, 220, 170], corona: 1, flare: 1 }));
  callsDeterministic('cluster', (c) => cluster(c, { cx: 0.5, cy: 0.35, r: 0.3, count: 400, seed: 4, color: [255, 220, 170] }));
  pixelsDeterministic('lens', (c) => {
    const img = c.createImageData(KW, KH);
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = (i / 4) % 251; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
    lens(c, KW, KH, { cx: 0.5, cy: 0.45, shadow: 0.11, thetaE: 0.2 });
  });
  pixelsDeterministic('blackHole', (c) => blackHole(c, KW, KH, { cx: 0.5, cy: 0.42, shadow: 0.11, seed: 5 }));
  const anim = blackHole(mockCanvas(KW, KH).getContext('2d'), KW, KH, { cx: 0.5, cy: 0.42, shadow: 0.11, seed: 5 });
  assert.equal(typeof anim, 'function');
  const c = mockCanvas(KW, KH).getContext('2d');
  anim(c, KW, KH, 1.5);
  assert.ok(c.calls.includes('ellipse'), 'smugi dysku');
  assert.equal(typeof blackHoleAnimator({ cx: 0.5, cy: 0.42, shadow: 0.11, seed: 5 }), 'function');
});

const PHASES = ['night', 'dawn', 'day', 'dusk'];
const WEATHERS = ['clear', 'cloudy', 'rain', 'snow', 'fog'];

test('kit/surface i kit/earth: rysują bez wyjątku dla wszystkich pór dnia i pogód', () => {
  for (const phase of PHASES) for (const weather of WEATHERS) {
    const env = { phase, weather };
    callsDeterministic(`earthSky ${phase} ${weather}`, (c) => earthSky(c, KW, KH, env));
    const sm = mockCanvas(KW, KH).getContext('2d');
    sunMoon(sm, KW, KH, env);
    if (weather === 'rain' || weather === 'snow' || weather === 'fog') assert.ok(!sm.calls.includes('arc'), `bez słońca i księżyca: ${phase} ${weather}`);
    else assert.ok(sm.calls.includes('arc'), `słońce albo księżyc: ${phase} ${weather}`);
    callsDeterministic(`cloudBank ${phase} ${weather}`, (c) => cloudBank(c, KW, KH, { seed: 3, ...env }));
    callsDeterministic(`cityPlanes ${phase} ${weather}`, (c) => cityPlanes(c, KW, KH, { seed: 4, ...env, density: 1 }));
  }
  for (const kind of ['regolith', 'rust', 'ice', 'dunes', 'rock']) {
    pixelsDeterministic(`horizon ${kind}`, (c) => horizon(c, KW, KH, { seed: 6, y: 0.7, kind, haze: kind === 'rust' ? [210, 150, 110] : null, light: [-0.7, -0.5] }));
  }
  for (const phase of PHASES) {
    callsDeterministic(`mountains fuji ${phase}`, (c) => mountains(c, KW, KH, { seed: 7, kind: 'fuji', phase }));
    callsDeterministic(`mountains alps ${phase}`, (c) => mountains(c, KW, KH, { seed: 7, kind: 'alps', phase }));
    callsDeterministic(`water ${phase}`, (c) => water(c, KW, KH, { y: 0.8, phase }));
    callsDeterministic(`fogBank ${phase}`, (c) => fogBank(c, KW, KH, { y: 0.75, phase }));
  }
});

const ENV_DAY = { phase: 'day', weather: 'clear', season: 'summer', holiday: null };

test('views: każde biuro, kolonia, układ i galaktyka ma przepis', () => {
  const ids = LAYER_ORDER.flatMap((l) => LAYERS[l].OFFICES.map((o) => o.id));
  assert.equal(ids.length, 45);
  for (const id of ids) assert.ok(RECIPES[id], id);
  assert.deepEqual([...VIEW_IDS].sort(), [...ids].sort());
  assert.equal(RECIPES.proxima, undefined);
  assert.equal(recipeFor('nie-ma-takiego').id, 'waw', 'nieznane id → przepis siedziby na Ziemi');
});

test('views: klucz światła jest poprawny dla każdej pory dnia i pogody', () => {
  for (const id of VIEW_IDS) for (const phase of ['night', 'dawn', 'day', 'dusk']) for (const weather of ['clear', 'rain', 'fog']) {
    assert.ok(validLight(RECIPES[id].light({ phase, weather, season: 'summer', holiday: null })), `${id} ${phase} ${weather}`);
  }
  assert.ok(!validLight({ color: [255, 255, 255], dir: [2, 0], ambient: 0.5, rim: [0, 0, 0] }), 'dir musi być jednostkowy');
  assert.ok(!validLight({ color: [256, 0, 0], dir: [1, 0], ambient: 0.5, rim: [0, 0, 0] }), 'kolor 0–255');
});

test('views: główny obiekt widoków spoza Ziemi jest w górnej części kadru', () => {
  for (const L of ['space', 'galaxy', 'universe']) for (const o of LAYERS[L].OFFICES) {
    const f = RECIPES[o.id].focus; assert.ok(f.y <= 0.45 && f.x >= 0.15 && f.x <= 0.85, o.id);
  }
});

test('views: każdy przepis rysuje bez wyjątku i deterministycznie', () => {
  for (const id of VIEW_IDS) {
    const a = mockCanvas(90, 120), b = mockCanvas(90, 120);
    RECIPES[id].draw(a.getContext('2d'), 90, 120, ENV_DAY); RECIPES[id].draw(b.getContext('2d'), 90, 120, ENV_DAY);
    assert.equal(hashPixels(a), hashPixels(b), id);
    assert.ok(a.getContext('2d').calls.length > 0, `${id} coś rysuje`);
  }
});

// ---------- zarządca tła: fałszywy worker, raf i host ----------
function fakeWorker() {
  const w = { sent: [], onmessage: null, postMessage(m) { w.sent.push(m); }, reply(req, data) { w.onmessage({ data: { req, ...data } }); }, terminate() {} };
  return w;
}
function fakeRaf() {
  const q = new Map(); let id = 0;
  const r = { q, t: 0, raf: (fn) => { q.set(++id, fn); return id; }, caf: (i) => q.delete(i), run(ts) { r.t = ts; const fns = [...q.values()]; q.clear(); for (const f of fns) f(ts); } };
  return r;
}
function makeBackdrop({ worker = fakeWorker(), active = { on: true }, local = [], size = { w: 150, h: 200 }, animated = false, deps = null } = {}) {
  const r = fakeRaf();
  const host = { get clientWidth() { return size.w; }, get clientHeight() { return size.h; } };
  const deferred = [];
  const bd = new Backdrop(host, {
    canvases: { main: mockCanvas(1, 1), anim: mockCanvas(1, 1) },
    createWorker: () => worker,
    raf: r.raf, caf: r.caf,
    isActive: () => active.on,
    dpr: () => 2,
    defer: (fn) => deferred.push(fn),
    now: () => r.t,
    renderLocal: (id, env, w, h) => { local.push({ id, w, h }); return mockCanvas(w, h); },
    recipeFor: animated ? (id) => ({ ...recipeFor(id), animate: () => {} }) : recipeFor,
    ...(deps || {}),
  });
  return { bd, worker, r, active, local, size, deferred };
}
const bitmap = () => ({ width: 320, height: 448, closed: false, close() { this.closed = true; } });

test('backdrop: cacheKey i sizeBucket', () => {
  assert.equal(sizeBucket(1), 64);
  assert.equal(sizeBucket(640), 640);
  assert.equal(sizeBucket(641), 704);
  const env = { phase: 'dusk', weather: 'rain' };
  assert.equal(envKey('waw', env), 'dusk|rain');
  assert.equal(envKey('sgr', env), '');
  assert.ok(cacheKey('waw', env, 300, 400).includes('dusk|rain'));
  assert.equal(cacheKey('sgr', env, 300, 400), 'sgr||320x448');
});

test('backdrop: lru closes evicted bitmaps', () => {
  const lru = new Lru(2), a = bitmap(), b = bitmap(), c = bitmap();
  lru.set('a', a); lru.set('b', b);
  lru.get('a');
  lru.set('c', c);
  assert.equal(b.closed, true, 'najdawniej używany wyrzucony i zamknięty');
  assert.equal(a.closed, false);
  assert.equal(lru.get('b'), undefined);
});

test('backdrop: ignores stale worker results', () => {
  const { bd, worker } = makeBackdrop();
  bd.show('sgr', {}, { quality: 'full' });
  bd.show('orion', {}, { quality: 'full' });
  const [first, second] = worker.sent;
  assert.equal(first.id, 'sgr'); assert.equal(second.id, 'orion');
  worker.reply(second.req, { bitmap: bitmap(), ms: 5 });
  assert.equal(bd.shownId, 'orion');
  worker.reply(first.req, { bitmap: bitmap(), ms: 5 });
  assert.equal(bd.shownId, 'orion', 'spóźniony wynik nie nadpisuje nowszego');
  bd.show('sgr', {}, { quality: 'full' });
  assert.equal(worker.sent.length, 2, 'spóźniony wynik trafił do pamięci podręcznej');
  assert.equal(bd.shownId, 'sgr');
});

test('backdrop: re-renders when size bucket changes', () => {
  const { bd, worker, size } = makeBackdrop();
  bd.show('orion', {}, { quality: 'full' });
  assert.deepEqual([worker.sent[0].w, worker.sent[0].h], [320, 448]);
  size.w = 152; bd.resize();
  assert.equal(worker.sent.length, 1, 'ten sam kubełek — bez nowego renderu');
  size.w = 200; size.h = 300; bd.resize();
  assert.equal(worker.sent.length, 2);
  assert.deepEqual([worker.sent[1].w, worker.sent[1].h], [448, 640]);
});

test('backdrop: falls back to main thread when worker fails', () => {
  const none = makeBackdrop({ worker: null });
  none.bd.show('orion', {}, { quality: 'full' });
  none.deferred.forEach((f) => f());
  assert.equal(none.local.length, 1, 'brak workera → render na głównym wątku');
  assert.deepEqual([none.local[0].w, none.local[0].h], [160, 224], 'w połowie rozdzielczości');
  assert.equal(none.bd.shownId, 'orion');
  const bad = makeBackdrop();
  bad.bd.show('sgr', {}, { quality: 'full' });
  bad.worker.reply(bad.worker.sent[0].req, { error: 'boom' });
  bad.deferred.forEach((f) => f());
  assert.equal(bad.local.length, 1, 'błąd workera → render na głównym wątku');
  assert.equal(bad.bd.shownId, 'sgr');
});

test('backdrop: animation loop stops when inactive and never doubles', () => {
  const { bd, worker, r, active } = makeBackdrop({ animated: true });
  bd.show('sgr', {}, { quality: 'full' });
  worker.reply(worker.sent[0].req, { bitmap: bitmap(), ms: 5 });
  bd.show('sgr', {}, { quality: 'full' });
  bd.tick();
  assert.equal(r.q.size, 1, 'jedna pętla naraz');
  r.run(1000);
  assert.equal(r.q.size, 1, 'pętla trwa, gdy widok jest aktywny i ma animację');
  active.on = false;
  r.run(1100);
  assert.equal(r.q.size, 0, 'nieaktywny — pętla staje');
  bd.tick();
  assert.equal(r.q.size, 0, 'tick przy nieaktywnym widoku nie wznawia');
  active.on = true;
  bd.tick();
  assert.equal(r.q.size, 1, 'po powrocie pętla wraca');
  bd.show('sgr', {}, { quality: 'eco' });
  r.run(1200);
  assert.equal(r.q.size, 0, 'tryb oszczędny — bez animacji');
});

test('kit/sky: jasna gwiazda z promieniami rysuje deterministycznie', () => {
  callsDeterministic('brightStar', (c) => brightStar(c, KW, KH, { x: 0.4, y: 0.3, size: 14, color: [200, 220, 255], spikes: 1 }));
  const c = mockCanvas(KW, KH).getContext('2d');
  brightStar(c, KW, KH, { x: 0.4, y: 0.3, size: 14, color: [200, 220, 255], spikes: 0 });
  assert.ok(!c.calls.includes('lineTo'), 'bez promieni');
});

test('views/galaxy: brak przepisów zastępczych, animowane są sol, crab, orion i sgr', () => {
  const ids = Object.keys(GALAXY_RECIPES);
  assert.equal(ids.length, 9);
  for (const id of ids) assert.ok(!GALAXY_RECIPES[id].placeholder, `${id} ma właściwy przepis`);
  for (const id of ['sol', 'crab', 'orion', 'sgr']) assert.equal(typeof GALAXY_RECIPES[id].animate, 'function', `${id} animowany`);
  for (const id of ids) {
    const c = mockCanvas(KW, KH).getContext('2d');
    GALAXY_RECIPES[id].animate?.(c, KW, KH, 2.5);
  }
});

test('views/universe: brak przepisów zastępczych, animowane są virgo i attractor, Pustka Wolarza przygaszona', () => {
  const ids = Object.keys(UNIVERSE_RECIPES);
  assert.equal(ids.length, 9);
  for (const id of ids) assert.ok(!UNIVERSE_RECIPES[id].placeholder, `${id} ma właściwy przepis`);
  for (const id of ['virgo', 'attractor']) assert.equal(typeof UNIVERSE_RECIPES[id].animate, 'function', `${id} animowany`);
  assert.ok(UNIVERSE_RECIPES.bootes.light({}).ambient <= 0.2);
  for (const id of ids) UNIVERSE_RECIPES[id].animate?.(mockCanvas(KW, KH).getContext('2d'), KW, KH, 3.2);
});

test('views/space: brak przepisów zastępczych, animowane są leo i venus, Mars i Europa w górnej części kadru', () => {
  const ids = Object.keys(SPACE_RECIPES);
  assert.equal(ids.length, 9);
  for (const id of ids) assert.ok(!SPACE_RECIPES[id].placeholder, `${id} ma właściwy przepis`);
  for (const id of ['leo', 'venus']) assert.equal(typeof SPACE_RECIPES[id].animate, 'function', `${id} animowany`);
  for (const id of ['mars', 'europa']) { const f = SPACE_RECIPES[id].focus; assert.ok(f.y <= 0.45 && f.x >= 0.15 && f.x <= 0.85, id); }
  for (const id of ids) SPACE_RECIPES[id].animate?.(mockCanvas(KW, KH).getContext('2d'), KW, KH, 4.1);
});

test('backdrop: animacja zależna od warunków (animateWhen) nie kręci pętli, gdy warunek nie zachodzi', () => {
  let frames = 0;
  const rec = { ...recipeFor('rkv'), animate: () => { frames++; }, animateWhen: (env) => env.phase === 'night' };
  const { bd, worker, r } = makeBackdrop({ deps: { recipeFor: () => rec } });
  bd.show('rkv', { phase: 'day', weather: 'clear' }, { quality: 'full' });
  worker.reply(worker.sent[0].req, { bitmap: bitmap(), ms: 5 });
  r.run(1000); r.run(2000);
  assert.equal(r.q.size, 0, 'za dnia pętla staje po zanikaniu');
  assert.equal(frames, 0, 'za dnia zorza się nie rysuje');
  bd.show('rkv', { phase: 'night', weather: 'clear' }, { quality: 'full' });
  worker.reply(worker.sent[1].req, { bitmap: bitmap(), ms: 5 });
  r.run(3000); r.run(4000);
  assert.ok(frames > 0, 'nocą zorza się rusza');
  assert.equal(r.q.size, 1, 'nocą pętla trwa');
});

test('views/earth: brak przepisów zastępczych, zorza w Reykjavíku tylko nocą, noc ciemniejsza niż dzień', () => {
  const ids = Object.keys(EARTH_RECIPES);
  assert.equal(ids.length, 18);
  for (const id of ids) assert.ok(!EARTH_RECIPES[id].placeholder, `${id} ma właściwy przepis`);
  const rkv = EARTH_RECIPES.rkv;
  assert.equal(typeof rkv.animate, 'function', 'rkv ma animację');
  assert.equal(rkv.animateWhen({ phase: 'night', weather: 'clear' }), true, 'zorza nocą');
  for (const phase of ['dawn', 'day', 'dusk']) assert.equal(rkv.animateWhen({ phase, weather: 'clear' }), false, `bez zorzy: ${phase}`);
  const c = rkv.light({ phase: 'night', weather: 'clear' }).color;
  assert.ok(c[1] > c[0], 'nocne światło w Reykjavíku niebiesko-zielone (G > R)');
  for (const id of ids) {
    const night = EARTH_RECIPES[id].light({ phase: 'night', weather: 'clear' }), day = EARTH_RECIPES[id].light({ phase: 'day', weather: 'clear' });
    assert.ok(night.ambient < day.ambient && night.ambient <= 0.35, id);
  }
  for (const id of ids) for (const phase of ['night', 'dawn', 'day', 'dusk']) for (const weather of ['clear', 'cloudy', 'rain', 'snow', 'fog']) {
    EARTH_RECIPES[id].draw(mockCanvas(KW, KH).getContext('2d'), KW, KH, { phase, weather });
  }
  rkv.animate(mockCanvas(KW, KH).getContext('2d'), KW, KH, 4.1);
});

test('views: nie ma już przepisów zastępczych', () => {
  const left = VIEW_IDS.filter((id) => RECIPES[id].placeholder);
  assert.deepEqual(left, []);
});

test('sw.js: pamięć offline zawiera każdy moduł oprawy (poza galerią deweloperską)', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`]));
  const files = walk('../js/art/').filter((f) => f.endsWith('.js') && !f.endsWith('/gallery.js')).map((f) => f.replace('../', './'));
  const missing = files.filter((f) => !sw.includes(`'${f}'`));
  assert.deepEqual(missing, []);
});
