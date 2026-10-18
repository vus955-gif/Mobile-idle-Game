// Testy oprawy: szum, płótna, klocki, przepisy widoków i zarządca tła (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, perlin, fbm, ridged } from '../js/art/noise.js';
import { makeCanvas, setCanvasFactory } from '../js/art/canvas.js';
import { mockCanvas, hashPixels } from './helpers/mock-canvas.mjs';
import { stars, milkyBand, nebula, cosmicWeb, aurora, auroraAnimator } from '../js/art/kit/sky.js';
import { planet, rings, sun, galaxy, cluster, lens, blackHole, blackHoleAnimator } from '../js/art/kit/bodies.js';
import { horizon } from '../js/art/kit/surface.js';
import { earthSky, sunMoon, cloudBank, cityPlanes, mountains, water, fogBank } from '../js/art/kit/earth.js';
import { RECIPES, VIEW_IDS, recipeFor, validLight } from '../js/art/views/index.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';

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
