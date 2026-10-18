// Testy oprawy: szum, płótna, klocki, przepisy widoków i zarządca tła (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, perlin, fbm, ridged } from '../js/art/noise.js';

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
