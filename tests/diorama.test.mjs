// Testy dioram: rzut, tony, części, wyspy, kadr, układ, model i oprawa etapów (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSvg, lum } from './helpers/svg.mjs';
import { TW, TH, LV, iso, tones, box, shadowOffset, windows, NIGHT_AMBIENT, WIN_GLOW, pyr, gable, cyl, dome, ring, shadow } from '../js/diorama/iso.js';
import { RECIPES, VIEW_IDS } from '../js/art/views/index.js';

const PHASES = ['night', 'dawn', 'day', 'dusk'];
const WEATHERS = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
const L = (dir, ambient = 0.6, color = [255, 255, 255]) => ({ color, dir, ambient, rim: [255, 255, 255] });

test('iso: rzut 2:1 i trzy tony — góra najjaśniejsza, jaśniejszy bok od strony światła', () => {
  assert.equal(TW, 2 * TH);
  const [x0, y0] = iso(0, 0), [x1, y1] = iso(1, 0), [x2, y2] = iso(0, 0, 1);
  assert.deepEqual([x1 - x0, y1 - y0], [TW / 2, TH / 2]);
  assert.deepEqual([x2 - x0, y2 - y0], [0, -LV]);
  const a = tones('#8899aa', L([-0.94, -0.34])), b = tones('#8899aa', L([0.94, -0.34]));
  assert.ok(lum(a.left) > lum(a.right) && lum(b.right) > lum(b.left));
  for (const t of [a, b, tones('#8899aa', L([0, -1]))]) assert.ok(lum(t.top) >= lum(t.left) && lum(t.top) >= lum(t.right));
  assert.ok(lum(tones('#8899aa', L([0.4, -0.9], 0.15)).top) < lum(tones('#8899aa', L([0.4, -0.9], 0.8)).top));
  const warm = tones('#808080', L([0.4, -0.9], 0.6, [255, 150, 100])).top.match(/\d+/g).map(Number);
  assert.ok(warm[0] > warm[2], 'ciepłe światło ociepla bryłę');
  assert.ok(tones('#8899aa', L([0, -1], 0.15)).rimAlpha > tones('#8899aa', L([0, -1], 0.8)).rimAlpha);
});

test('iso: tony są poprawne i widoczne dla klucza światła każdego z 45 widoków (wszystkie pory i pogody)', () => {
  for (const id of VIEW_IDS) for (const phase of PHASES) for (const weather of WEATHERS) {
    const t = tones('#556070', RECIPES[id].light({ phase, weather }));
    for (const k of ['top', 'left', 'right', 'rim']) assert.match(t[k], /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/, `${id} ${k}`);
    assert.ok(Math.min(lum(t.left), lum(t.right)) >= 0.03, `${id} ${phase} ${weather}: bryła nie znika w ciemności`);
    assert.ok(t.rimAlpha > 0 && t.rimAlpha <= 1);
  }
});

test('iso: pudełko, cień przeciwnie do światła i okna świecące tylko nocą', () => {
  const b = { gx: 0, gy: 0, w: 2, d: 1, h: 3 };
  assert.ok(checkSvg(box(b, tones('#8899aa', L([0.6, -0.8])))).elements >= 3, 'trzy ściany');
  assert.ok(shadowOffset(L([0.9, -0.4]), 3)[0] < 0 && shadowOffset(L([-0.9, -0.4]), 3)[0] > 0);
  const night = windows(b, 'left', { rows: 3, cols: 2, lit: 1, seed: 1 }, L([0.6, -0.8], NIGHT_AMBIENT - 0.15));
  const day = windows(b, 'left', { rows: 3, cols: 2, lit: 1, seed: 1 }, L([0.6, -0.8], 0.8));
  assert.ok(night.includes(WIN_GLOW) && !day.includes(WIN_GLOW));
  assert.ok(checkSvg(night).elements <= 2, 'okna ściany to najwyżej dwie ścieżki');
});

// Poniższe testy dodano ponad polecenie zadania: pokrywają części, których test z planu nie dotyka.

test('helpers: checkSvg łapie złe wartości i niezamknięte grupy, lum liczy luminancję względną', () => {
  assert.equal(checkSvg('<g><path d="M0 0"/><circle r="2"/></g>').elements, 3);
  for (const bad of ['NaN', 'undefined', 'Infinity', 'null']) assert.throws(() => checkSvg(`<path d="M0 ${bad}"/>`), new RegExp(bad));
  for (const tag of ['g', 'defs', 'clipPath']) {
    assert.throws(() => checkSvg(`<${tag}><path d="M0 0"/>`), /niezamkni/, `${tag} otwarty`);
    assert.throws(() => checkSvg(`<path d="M0 0"/></${tag}>`), /niezamkni|nadmiar/, `${tag} zamknięty bez otwarcia`);
  }
  assert.doesNotThrow(() => checkSvg('<g/><defs><clipPath id="d-a"><rect/></clipPath></defs>'));
  assert.equal(lum('rgb(255,255,255)'), 1);
  assert.equal(lum('#000000'), 0);
  assert.ok(Math.abs(lum('rgb(255,0,0)') - 0.2126) < 1e-4);
  assert.ok(lum('rgb(128,128,128)') > 0.2 && lum('rgb(128,128,128)') < 0.23, 'nieliniowa krzywa sRGB');
});

test('iso: ostrosłup, dachy, walec, kopuła, pierścień i cień dają poprawny SVG z liczbami co 0,1', () => {
  const lt = L([0.6, -0.8], 0.3), t = tones('#8899aa', lt);
  const b = { gx: 1, gy: 2, gz: 1, w: 2, d: 1.5, h: 2 };
  const c = { gx: 1.37, gy: 1.21, gz: 0, r: 0.73, h: 3 };
  const parts = {
    pyr: pyr(b, t), gableX: gable(b, t, 'x'), gableY: gable(b, t, 'y'), cyl: cyl(c, t), dome: dome(c, t),
    flat: ring(c, t, 'flat'), upright: ring(c, t, 'upright'), shadow: shadow(b, lt),
  };
  for (const [k, s] of Object.entries(parts)) {
    assert.ok(checkSvg(s).elements >= 1, k);
    for (const m of s.matchAll(/\b(?:d|cx|cy|rx|ry)="([^"]*)"/g)) assert.ok(!/\d\.\d{2}/.test(m[1]), `${k}: współrzędne co 0,1 (${m[1]})`);
  }
  assert.equal(checkSvg(parts.pyr).elements, 3);
  assert.equal(checkSvg(parts.gableX).elements, 3);
  assert.notEqual(parts.gableX, parts.gableY, 'oś kalenicy zmienia kształt dachu');
  assert.ok(checkSvg(parts.cyl).elements >= 3 && checkSvg(parts.dome).elements >= 3);
  const op = (s) => Number(s.match(/fill-opacity="([\d.]+)"/)[1]);
  assert.ok(op(shadow(b, L([0.6, -0.8], 0.2))) > op(shadow(b, L([0.6, -0.8], 0.9))), 'cień ciemniejszy przy małym ambient');
  const plain = tones('#556070', lt), snowy = tones('#556070', lt, { snow: true });
  assert.ok(lum(snowy.top) > lum(plain.top), 'śnieg rozjaśnia górę');
  assert.equal(snowy.left, plain.left, 'śnieg nie rusza ścian');
});
