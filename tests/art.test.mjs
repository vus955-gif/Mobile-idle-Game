// Testy oprawy: szum, płótna, klocki, przepisy widoków i zarządca tła (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, perlin, fbm, ridged } from '../js/art/noise.js';
import { makeCanvas, setCanvasFactory } from '../js/art/canvas.js';
import { mockCanvas, hashPixels } from './helpers/mock-canvas.mjs';

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
