// Testy dioram: rzut, tony, części, wyspy, kadr, układ, model i oprawa etapów (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSvg, lum } from './helpers/svg.mjs';
import { TW, TH, LV, iso, n, RX, poly, tones, box, shadowOffset, windows, NIGHT_AMBIENT, WIN_GLOW, pyr, gable, cyl, dome, ring, shadow } from '../js/diorama/iso.js';
import { RECIPES, VIEW_IDS, recipeFor } from '../js/art/views/index.js';
import { PALETTES, assemble, emblem, emblemCenter, ER, SEATS, tierFor, CREW, MAX_ANIM, budget, drive, person, tree, pumpkin, xmasTree, stringLights, SIDE_ART, seeded, shade, esc } from '../js/diorama/parts.js';
import { PLACES, island, groundTone, SNOW } from '../js/diorama/island.js';
import { SE, SE_INSETS, frameFor, viewBoxAttr, MIN_EMBLEM_PX, MIN_LOT_PX } from '../js/diorama/frame.js';
import { SLOTS, layout, LOT_MAX_H } from '../js/diorama/layout.js';
import { modelFor, newIds, buildDiorama, STAGE_ART, GENERIC } from '../js/diorama/index.js';
import { EARTH_ART } from '../js/diorama/earth.js';
import { Company } from '../js/engine.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { EARTH_RECIPES } from '../js/art/views/earth.js';
import { SPACE_RECIPES } from '../js/art/views/space.js';
import { GALAXY_RECIPES } from '../js/art/views/galaxy.js';
import { UNIVERSE_RECIPES } from '../js/art/views/universe.js';
import { readFileSync, readdirSync } from 'node:fs';
import { skyline } from '../js/diorama/skyline.js';
import { Scene } from '../js/scene.js';

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

// --- Części brył, emblematy i obsada (Zadanie 2) ---

const CTX = (o = {}) => ({
  at: [0, 0, 0], palette: PALETTES.earth, accent: '#e0245e', light: L([0.6, -0.8], 0.6), lit: 1, snow: false, seed: 7,
  company: 'Acme', budget: budget(), ...o,
});
const NIGHT = L([0.6, -0.8], NIGHT_AMBIENT - 0.15);
const unesc = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const labelText = (svg) => svg.match(/<text[^>]*>([^<]*)<\/text>/)[1];

test('iso: tones podaje litSide (strona światła), a nazwa lit zostaje dla udziału świecących okien', () => {
  assert.equal(tones('#8899aa', L([0.94, -0.34])).litSide, 'right');
  assert.equal(tones('#8899aa', L([-0.94, -0.34])).litSide, 'left');
  assert.ok(!('lit' in tones('#8899aa', L([0, -1]))));
});

test('parts: assemble — kotwica emblematu, prostokąt brył, kolor akcentu, deterministycznie', () => {
  const parts = [['box', 0, 0, 0, 1, 1, 2, 'wall', 'win'], ['pyr', 0, 0, 2, 1, 1, 1, 'roof'], ['sign', 0.5, 0.5, 3]];
  const a = assemble(parts, CTX()), b = assemble(parts, CTX());
  assert.deepEqual(a, b);
  assert.ok(checkSvg(a.svg).elements >= 8);
  const [ax, ay] = a.anchor, [x0, y0, x1, y1] = a.box;
  assert.ok(ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1, 'kotwica w prostokącie brył');
  const [ex, ey] = iso(0.5, 0.5, 3);
  assert.ok(Math.abs(ax - ex) < 0.1 && Math.abs(ay - ey) < 0.1, 'kotwica to rzut punktu sign');
  const [sx, sy] = assemble(parts, CTX({ at: [2, 1, 1] })).anchor, [fx, fy] = iso(2.5, 1.5, 4);
  assert.ok(Math.abs(sx - fx) < 0.1 && Math.abs(sy - fy) < 0.1, 'przesunięcie at');
  assert.equal(assemble(parts.slice(0, 2), CTX()).anchor, null, 'bez sign nie ma kotwicy');
  const ctx = CTX(), acc = assemble([['box', 0, 0, 0, 1, 1, 2, 'accent']], ctx);
  assert.ok(acc.svg.includes(tones('#e0245e', ctx.light).top) && !a.svg.includes(tones('#e0245e', ctx.light).top), 'akcent tylko tam, gdzie mat: accent');
  assert.notEqual(acc.svg, assemble([['box', 0, 0, 0, 1, 1, 2, 'accent']], CTX({ accent: '#1fb36b' })).svg);
});

test('parts: każda bryła najpierw dostaje cień, okna świecą nocą według udziału lit, śnieg bieli dachy', () => {
  const t = tones(PALETTES.earth.wall, CTX().light), one = assemble([['box', 0, 0, 0, 1, 1, 2, 'wall']], CTX()).svg;
  assert.ok(one.indexOf('#0b1020') >= 0 && one.indexOf('#0b1020') < one.indexOf(t.left), 'cień przed ścianami');
  const tower = [['box', 0, 0, 0, 2, 1, 3, 'wall', 'win']];
  const glow = (lit, light) => assemble(tower, CTX({ lit, light })).svg.includes(WIN_GLOW);
  assert.ok(glow(1, NIGHT) && !glow(0, NIGHT) && !glow(1, L([0.6, -0.8], 0.8)));
  const plain = assemble([['box', 0, 0, 0, 2, 1, 3, 'wall']], CTX()).svg;
  assert.ok(checkSvg(assemble(tower, CTX()).svg).elements > checkSvg(plain).elements, 'flaga win dodaje okna');
  const roof = [['gable', 0, 0, 0, 2, 2, 1, 'roof', 'x']], lt = CTX().light;
  assert.ok(assemble(roof, CTX({ snow: true })).svg.includes(tones(PALETTES.earth.roof, lt, { snow: true }).top));
  assert.ok(!assemble(roof, CTX()).svg.includes(tones(PALETTES.earth.roof, lt, { snow: true }).top));
});

test('parts: wszystkie typy części dają poprawny SVG mieszczący się w prostokącie brył', () => {
  const parts = [
    ['box', 0, 0, 0, 2, 1, 2, 'wall2', 'win ledge'], ['gable', 0, 0, 2, 2, 1, 1, 'roof', 'y'], ['cyl', 3, 1, 0, 0.6, 2, 'metal', 'win'],
    ['dome', 3, 1, 2, 0.6, 'glass'], ['ring', 1, 3, 0, 1, 'crystal', 'flat'], ['ring', 4, 3, 0, 1, 'crystal', 'upright'],
    ['dish', 0.5, 2, 0, 0.3], ['panel', 2, 2, 0, 1.5, 1], ['mast', 5, 0, 0, 3], ['glow', 5, 2, 1, 0.4, 'crystal'],
    ['label', 1, 0, 1, 2, 12], ['strut', 0, 3, 0, 1.5, 4, 2, 'metal'], ['sign', 1, 0.5, 3],
  ];
  const r = assemble(parts, CTX());
  assert.ok(checkSvg(r.svg).elements > 40);
  const [x0, y0, x1, y1] = r.box;
  assert.ok(x1 > x0 && y1 > y0 && r.anchor);
  for (const p of parts.filter((q) => q[0] !== 'sign')) {
    const one = assemble([p], CTX());
    checkSvg(one.svg);
    assert.ok(one.box[2] > one.box[0] && one.box[3] > one.box[1], `${p[0]}: niepusty prostokąt`);
    assert.ok(one.box[0] >= x0 && one.box[1] >= y0 && one.box[2] <= x1 && one.box[3] <= y1, `${p[0]}: mieści się w sumie`);
  }
  assert.deepEqual(assemble([], CTX()), { svg: '', anim: [], anchor: null, box: [0, 0, 0, 0] });
  const at = assemble([['box', 3, 2, 1, 2, 1, 2, 'wall']], CTX({ at: [1, 1, 1] })).box;
  assert.deepEqual(at, [Math.floor(iso(4, 4, 2)[0]), Math.floor(iso(4, 3, 4)[1]), Math.ceil(iso(6, 3, 2)[0]), Math.ceil(iso(6, 4, 2)[1])], 'prostokąt uwzględnia x, y, z i at');
  const cyl1 = assemble([['cyl', 3, 2, 1, 0.5, 2, 'metal']], CTX()).box;
  assert.ok(Math.abs((cyl1[0] + cyl1[2]) / 2 - iso(3, 2)[0]) < 1.5 && cyl1[3] > iso(3, 2, 1)[1], 'walec wokół swojego środka');
  const strut = assemble([['strut', 0, 0, 0, 1, 0, 2, 'metal']], CTX());
  assert.equal(checkSvg(strut.svg).elements, 1, 'zastrzał to jedna kreska');
  const sh = assemble([['shadow', 1, 1, 0, 0.5, 4]], CTX());
  assert.ok(checkSvg(sh.svg).elements === 1 && sh.svg === shadow({ gx: 0.65, gy: 0.65, gz: 0, w: 0.7, d: 0.7, h: 4 }, CTX().light), 'cień walca r = 0,5 o wysokości 4');
  assert.deepEqual(sh.box, [0, 0, 0, 0], 'cień nie powiększa prostokąta (jak cienie brył)');
  assert.deepEqual(strut.box, [Math.floor(iso(0, 0)[0] - 1), Math.floor(iso(1, 0, 2)[1] - 1), Math.ceil(iso(1, 0, 2)[0] + 1), Math.ceil(iso(0, 0)[1] + 1)]);
});

test('parts: niewidoczne na ekranie fragmenty nie dają elementów (cienki detal flush, dioda, cienki walec, kwiaty)', () => {
  const one = (p) => assemble([p], CTX()).svg, t = tones('#4b4a63', CTX().light);
  // Pas 0,03 na lewej ścianie: tylko lewa ściana; pas na prawej: tylko prawa; słupek: obie, bez wierzchu i kreski.
  assert.equal(checkSvg(one(['box', 0, 0.9, 0, 0.5, 0.03, 2, 'dark', 'flush'])).elements, 1);
  assert.ok(one(['box', 0, 0.9, 0, 0.5, 0.03, 2, 'dark', 'flush']).includes(t.left));
  assert.ok(one(['box', 0.9, 0, 0, 0.03, 0.5, 2, 'dark', 'flush']).includes(t.right));
  assert.equal(checkSvg(one(['box', 0, 0, 0, 0.03, 0.03, 2, 'dark', 'flush'])).elements, 2);
  assert.equal(checkSvg(one(['box', 0, 0, 0, 1.3, 1.3, 0.02, 'dark', 'flush'])).elements, 4, 'płyta flush zostaje cała');
  const led = one(['glow', 0, 0, 1, 0.035, 'crystal']);
  assert.ok(checkSvg(led).elements === 1 && !led.includes('Gradient'), 'dioda bez gradientu');
  assert.ok(!one(['cyl', 0, 0, 0, 0.05, 1, 'wall']).includes('#0b1020') && one(['cyl', 0, 0, 0, 0.3, 1, 'wall']).includes('#0b1020'), 'cienki walec bez cienia');
  const spring = tree(30, 40, 0.5, seeded(5), 'spring');
  assert.ok(checkSvg(spring).elements <= 8 && spring.includes('#f7b6cf') && spring.includes('#ffd6e5'), 'kwiaty w dwóch ścieżkach');
});

test('parts: maszt miga w warstwie animacji tylko z budżetu, glow ma gradient o unikalnym id i nie używa filtru', () => {
  const masts = [['mast', 0, 0, 0, 2], ['mast', 1, 0, 0, 3]], bud = budget(1);
  const r = assemble(masts, CTX({ budget: bud }));
  assert.equal(r.anim.length, 1);
  assert.match(r.anim[0], /class="blink"/);
  assert.ok(!r.svg.includes('class="blink"') && checkSvg(r.svg).elements >= 3, 'słup i drugie światło zostają w warstwie statycznej');
  assert.equal(bud.used, 1);
  for (const s of r.anim) checkSvg(s);
  const g = [['glow', 0, 0, 1, 0.5, 'crystal']], a = assemble(g, CTX({ seed: 1 })).svg, b = assemble(g, CTX({ seed: 2 })).svg;
  assert.ok(a.includes('radialGradient') && !a.includes('filter='));
  const ids = (s) => [...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids(a).length >= 1 && [...ids(a), ...ids(b)].every((x) => x.startsWith('d-')));
  assert.equal(new Set([...ids(a), ...ids(b)]).size, ids(a).length + ids(b).length, 'id różne między wywołaniami');
  assert.ok(a.includes(`url(#${ids(a)[0]})`));
  const halo = +a.match(/<circle[^>]* r="([\d.]+)" fill="url/)[1], gb = assemble(g, CTX({ seed: 1 })).box;
  assert.ok(gb[2] - gb[0] >= 2 * halo && gb[3] - gb[1] >= 2 * halo, 'prostokąt obejmuje całą poświatę');
});

test('parts: tabliczka z nazwą firmy jest escapowana i skracana', () => {
  const name = '<b>Ala & "Kot"</b> 🚀 sp. z o.o. — bardzo długa nazwa';
  const label = (company) => assemble([['label', 0, 0, 2, 3, 22]], CTX({ company })).svg;
  const r = label(name);
  checkSvg(r);
  assert.ok(!r.includes('<b>') && r.includes('&lt;b&gt;') && r.includes('&amp;'));
  const text = unesc(labelText(r));
  assert.ok(text.endsWith('…') && Array.from(text).length <= 22);
  assert.equal(text, Array.from(name).slice(0, 21).join('') + '…', 'pierwsze max − 1 znaków i wielokropek');
  const cut = labelText(label(`${'x'.repeat(20)}🚀yyyy`));
  assert.equal(cut, `${'x'.repeat(20)}🚀…`, 'emoji nie jest przecięte');
  assert.ok(!/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(cut));
  assert.ok(label('Acme').includes('>Acme</text>'), 'krótka nazwa bez zmian');
  assert.equal(label(''), '', 'bez nazwy nie ma tabliczki');
});

test('parts: progi obsady SEATS i gęstość obsady rosną razem', () => {
  assert.deepEqual(SEATS, [1, 5, 15, 40, 100]);
  assert.deepEqual([0, 1, 4, 5, 14, 15, 39, 40, 99, 100, 1e9].map(tierFor), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(CREW.length, 6);
  for (let t = 1; t < CREW.length; t++) for (const k of ['people', 'lit', 'vehicles']) assert.ok(CREW[t][k] >= CREW[t - 1][k]);
  assert.ok(CREW[5].people > CREW[1].people && CREW[5].lit > CREW[1].lit);
  assert.deepEqual(CREW.map((c) => c.people), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(CREW.map((c) => c.lit), [0.15, 0.35, 0.55, 0.75, 0.9, 1]);
  assert.deepEqual(CREW.map((c) => c.vehicles), [0, 0, 0, 1, 1, 2]);
});

test('parts: emblemat ma ikonę i kolor działu', () => {
  const e = emblem({ icon: '🚀', color: '#ff6b8a' }, [100, 50]);
  checkSvg(e);
  assert.ok(e.includes('🚀') && e.includes('#ff6b8a') && e.includes('#fff'));
  assert.equal(ER, 11);
  const fs = (s) => +s.match(/font-size="([\d.]+)"/)[1];
  assert.ok(Math.abs(fs(e) - 1.15 * ER) < 0.1);
  assert.ok(Math.abs(fs(emblem({ icon: '🚀', color: '#fff' }, [0, 0], 20)) - 23) < 0.1, 'rozmiar ikony rośnie z promieniem');
  const [cx, cy] = emblemCenter([100, 50]);
  assert.equal(cx, 100);
  assert.ok(cy < 50 - ER, 'koło leży nad punktem zaczepienia, a trzonek łączy je z nim');
  assert.ok(e.includes(`cx="${cx}"`) && e.includes(`cy="${cy}"`));
  assert.ok(!emblem({ icon: '<i>', color: '#000' }, [0, 0]).includes('<i>'), 'ikona jest escapowana');
});

test('parts: pojazd jedzie wzdłuż osi izometrycznej (ścięcie 2:1) i ma własne przycięcie', () => {
  const car = SIDE_ART.car('#ff6b6b'), opt = { dur: 12, delay: -3, id: 'a' };
  const x = drive({ gx: 2, gy: 1, axis: 'x', len: 3 }, car, opt), y = drive({ gx: 2, gy: 1, axis: 'y', len: 3 }, car, { ...opt, id: 'b' });
  for (const s of [x, y]) { checkSvg(s); assert.ok(s.includes('class="car"') && s.includes('animation-duration:12s;animation-delay:-3s')); }
  assert.ok(x.includes('matrix(1 0.5 0 1 ') && !x.includes('matrix(1 -0.5'));
  assert.ok(y.includes('matrix(1 -0.5 0 1 ') && !y.includes('matrix(1 0.5'));
  const [ox, oy] = iso(2, 1), [ex, ey] = iso(2, 4);
  assert.ok(x.includes(`matrix(1 0.5 0 1 ${ox} ${oy})`) && y.includes(`matrix(1 -0.5 0 1 ${ex} ${ey})`), 'początek drogi');
  assert.ok(x.includes('id="d-clip-a"') && y.includes('id="d-clip-b"') && x.includes('url(#d-clip-a)') && y.includes('url(#d-clip-b)'));
  assert.ok(x.includes(`width="${3 * TW / 2}"`), 'pas drogi ma długość len kafelków');
  assert.ok(x.includes(car), 'obraz pojazdu bez zmian wewnątrz grupy car');
});

test('parts: budżet animacji', () => {
  const b = budget();
  assert.equal(MAX_ANIM, 40);
  for (let i = 0; i < MAX_ANIM; i++) assert.equal(b.take(), true);
  assert.equal(b.used, 40);
  assert.equal(b.take(), false);
  assert.equal(b.used, 40);
  const c = budget(2);
  assert.deepEqual([c.take(), c.take(), c.take()], [true, true, false]);
});

test('parts: palety czterech etapów mają komplet kluczy i różny charakter', () => {
  const keys = ['wall', 'wall2', 'glass', 'roof', 'metal', 'dark', 'crystal', 'green', 'ground'];
  assert.deepEqual(Object.keys(PALETTES), ['earth', 'space', 'galaxy', 'universe']);
  for (const [st, p] of Object.entries(PALETTES)) for (const k of keys) assert.match(p[k], /^#[0-9a-f]{6}$/i, `${st}.${k}`);
  assert.equal(new Set(Object.values(PALETTES).map((p) => p.wall)).size, 4);
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  assert.ok(rgbOf(PALETTES.earth.glass)[2] > rgbOf(PALETTES.earth.glass)[0], 'Ziemia: błękit');
  assert.ok(rgbOf(PALETTES.earth.green)[1] > rgbOf(PALETTES.earth.green)[0], 'Ziemia: zieleń');
  assert.ok(lum(PALETTES.universe.wall) < lum(PALETTES.space.wall) / 2, 'Wszechświat: głęboka czerń');
  assert.ok(rgbOf(PALETTES.galaxy.wall2)[0] > rgbOf(PALETTES.galaxy.wall2)[1], 'Galaktyka: magenta');
});

test('parts: grafika przeniesiona ze sceny zwraca poprawny SVG bez efektów ubocznych', () => {
  const r = () => seeded(5);
  const p = person(10, 20, r());
  assert.equal(p, person(10, 20, r()));
  assert.ok(checkSvg(p).elements >= 4 && !p.includes('class='), 'bez opóźnienia postać jest statyczna');
  assert.ok(person(10, 20, r(), 1, 0.5).includes('class="person"') && person(10, 20, r(), 0.5).includes('scale(0.5)'));
  for (const season of ['spring', 'summer', 'autumn', 'winter']) assert.ok(checkSvg(tree(30, 40, 1.2, r(), season)).elements >= 4, season);
  assert.notEqual(tree(30, 40, 1, r(), 'winter'), tree(30, 40, 1, r(), 'summer'));
  assert.ok(checkSvg(pumpkin(5, 6)).elements >= 4 && checkSvg(xmasTree(5, 6, 0.5)).elements >= 6);
  const l = stringLights([[0, 0], [60, 10], [100, 0]]);
  assert.ok(checkSvg(l.svg).elements > 6 && l.blink.length >= 2 && l.blink.every((b) => b.includes('class="blink"') && !b.includes('filter=')));
  l.blink.forEach(checkSvg);
  assert.ok(!l.svg.includes('blink'));
  for (const k of ['car', 'rover']) assert.ok(checkSvg(`<g>${SIDE_ART[k]('#ff0000')}</g>`).elements >= 5 && !SIDE_ART[k]('#ff0000').includes('class='), k);
  assert.ok(SIDE_ART.car('#12ab34').includes('#12ab34'));
  const a = seeded(9), b = seeded(9);
  assert.deepEqual([a(), a()], [b(), b()]);
  assert.equal(shade('#808080', 0.5), 'rgb(64,64,64)');
  assert.equal(shade('#808080', 1.5), 'rgb(192,192,192)');
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

// --- Wyspy i platformy z materiałem miejsca (Zadanie 3) ---

const DAY = L([0.42, -0.91], 0.8), NITE = L([0.6, -0.8], 0.3, [150, 170, 255]);
const ENV = { phase: 'day', season: 'summer', weather: 'clear', holiday: null, newYear: false, snowCover: false };
const bw = (b) => b[2] - b[0];

test('island: każdy z 45 widoków ma podstawę, materiał i niebo zgodne z projektem (grupami etapów)', () => {
  assert.deepEqual(Object.keys(PLACES).sort(), [...VIEW_IDS].sort());
  const group = (recipes, want) => { for (const id of Object.keys(recipes)) assert.deepEqual(PLACES[id], want, id); };
  group(EARTH_RECIPES, { base: 'island', material: 'grass', sky: { stars: false, traffic: 'clouds' } });
  group(GALAXY_RECIPES, { base: 'dock', material: 'metal', sky: { stars: true, traffic: 'comets' } });
  group(UNIVERSE_RECIPES, { base: 'shard', material: 'crystal', sky: { stars: true, traffic: 'comets' } });
  assert.deepEqual([EARTH_RECIPES, GALAXY_RECIPES, UNIVERSE_RECIPES].map((g) => Object.keys(g).length), [18, 9, 9]);
  // Kosmos: dziewięć widoków, każdy osobno
  const rocky = (material, stars) => ({ base: 'island', material, sky: { stars, traffic: 'none' } });
  const platform = { base: 'platform', material: 'metal', sky: { stars: true, traffic: 'satellites' } };
  const space = {
    leo: platform, l2: platform, venus: { base: 'aerostat', material: 'deck', sky: { stars: false, traffic: 'none' } },
    moon: rocky('regolith', true), mercury: rocky('rock', true), ceres: rocky('rock', true), europa: rocky('ice', true),
    mars: rocky('rust', false), titan: rocky('dunes', false),
  };
  assert.deepEqual(Object.keys(space).sort(), Object.keys(SPACE_RECIPES).sort());
  for (const [id, want] of Object.entries(space)) assert.deepEqual(PLACES[id], want, id);
});

test('island: rysuje bez wyjątku każdą podstawę, deterministycznie; większa wyspa → większy prostokąt', () => {
  for (const view of ['waw', 'leo', 'venus', 'sgr', 'edge']) {
    const a = island({ view, size: 8, light: DAY, env: ENV, seed: 3 }), b = island({ view, size: 8, light: DAY, env: ENV, seed: 3 });
    assert.equal(a.svg, b.svg, `${view}: ten sam wynik`);
    checkSvg(a.svg);
    const small = island({ view, size: 4, light: DAY, env: ENV, seed: 3 });
    assert.ok(bw(a.bbox) > bw(small.bbox) && a.bbox[3] - a.bbox[1] > small.bbox[3] - small.bbox[1], `${view}: większa wyspa → większy prostokąt`);
    assert.notEqual(a.svg, island({ view, size: 8, light: DAY, env: ENV, seed: 4 }).svg, `${view}: ziarno zmienia fakturę`);
  }
});

test('island: zima pokrywa trawę śniegiem, jesień zmienia barwę trawy', () => {
  assert.equal(groundTone('waw', { snowCover: true, season: 'winter' }), SNOW);
  assert.equal(SNOW, '#eef3fb');
  const chroma = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return Math.max(...c) - Math.min(...c); };
  const summer = groundTone('waw', { season: 'summer' });
  assert.equal(summer, PALETTES.earth.ground, 'lato to barwa z palety');
  assert.notEqual(groundTone('waw', { season: 'autumn' }), summer);
  assert.ok(chroma(groundTone('waw', { season: 'autumn' })) < chroma(summer), 'jesienią trawa jest przygaszona');
  assert.ok(lum(groundTone('waw', { season: 'spring' })) > lum(summer), 'wiosną trawa jest świeższa (jaśniejsza)');
  for (const season of ['spring', 'summer', 'autumn', 'winter']) assert.match(groundTone('sto', { season }), /^#[0-9a-f]{6}$/, 'zawsze zapis #rrggbb (shade() go wymaga)');
  assert.equal(groundTone('moon', { snowCover: true, season: 'winter' }), groundTone('moon', {}), 'poza Ziemią pora roku nie zmienia podłoża');
  assert.equal(groundTone('waw'), summer, 'bez env jak lato');
  const snowy = island({ view: 'waw', size: 6, light: DAY, env: { ...ENV, season: 'winter', snowCover: true }, seed: 1 }).svg;
  assert.ok(snowy.includes(tones(SNOW, DAY).top) && !island({ view: 'waw', size: 6, light: DAY, env: ENV, seed: 1 }).svg.includes(tones(SNOW, DAY).top));
});

test('island: wszystkie 45 widoków w dzień i w nocy — poprawny SVG, rim w prostokącie, budżet elementów i brak filtrów', () => {
  for (const view of VIEW_IDS) for (const light of [DAY, NITE]) {
    const r = island({ view, size: 10, light, env: ENV, seed: 11 });
    const { elements } = checkSvg(r.svg);
    assert.ok(elements >= 6 && elements <= 80, `${view}: ${elements} elementów`);
    assert.ok(!r.svg.includes('filter=') && !r.svg.includes('<animate'), view);
    const [x0, y0, x1, y1] = r.bbox;
    assert.ok(x1 > x0 && y1 > y0 && r.bbox.every(Number.isInteger), `${view}: prostokąt całkowity`);
    assert.equal(r.rim.length, 4);
    for (const [x, y] of r.rim) assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1, `${view}: narożnik w prostokącie`);
    for (const m of r.svg.matchAll(/\bid="([^"]+)"/g)) assert.ok(m[1].startsWith('d-isl-'), `${view}: id ${m[1]}`);
  }
});

test('island: rim to narożniki wierzchu (tył, prawy, przód, lewy) w siatce wyśrodkowanej na początku', () => {
  const { rim, bbox } = island({ view: 'waw', size: 6, light: DAY, env: ENV, seed: 1 });
  assert.deepEqual(rim, [iso(-3, -3), iso(3, -3), iso(3, 3), iso(-3, 3)]);
  assert.ok(bbox[0] <= rim[3][0] && bbox[2] >= rim[1][0]);
  // każda podstawa ma spód poniżej krawędzi przedniego narożnika
  for (const v of ['waw', 'leo', 'venus', 'sgr', 'edge']) {
    assert.ok(island({ view: v, size: 6, light: DAY, env: ENV, seed: 1 }).bbox[3] > rim[2][1] + LV, `${v}: spód sięga poniżej krawędzi`);
  }
});

test('island: materiały różnią się wyglądem, a faktura mieści się w kilku ścieżkach', () => {
  const views = ['waw', 'moon', 'mercury', 'mars', 'europa', 'titan', 'leo', 'venus', 'sgr', 'edge'];
  const svgs = views.map((v) => island({ view: v, size: 8, light: DAY, env: ENV, seed: 5 }).svg);
  assert.equal(new Set(svgs).size, views.length);
  const tops = new Set(['waw', 'moon', 'mercury', 'ceres', 'mars', 'europa', 'titan', 'leo', 'venus', 'sgr', 'edge'].map((v) => groundTone(v, ENV)));
  assert.equal(tops.size, 11, 'każdy świat ma własną barwę podłoża');
  const el = (v, size) => checkSvg(island({ view: v, size, light: DAY, env: ENV, seed: 5 }).svg).elements;
  for (const v of views) assert.ok(el(v, 12) - el(v, 4) <= 12, `${v}: liczba elementów nie rośnie z polem wyspy`);
});

test('island: światło zmienia barwę wierzchu, a małe i duże rozmiary też się rysują', () => {
  const a = island({ view: 'moon', size: 8, light: DAY, env: ENV, seed: 2 }).svg, b = island({ view: 'moon', size: 8, light: NITE, env: ENV, seed: 2 }).svg;
  assert.notEqual(a, b);
  assert.ok(a.includes(tones(groundTone('moon', ENV), DAY).top) && b.includes(tones(groundTone('moon', ENV), NITE).top));
  for (const size of [1, 2, 3, 5, 7, 9, 12]) for (const view of ['waw', 'mars', 'europa', 'leo', 'venus', 'sgr', 'edge']) {
    const r = island({ view, size, light: DAY, env: ENV, seed: size });
    checkSvg(r.svg);
    assert.equal(r.rim[1][0] - r.rim[3][0], size * TW, `${view} ${size}`);
  }
});

test('island: wspólne pomocnicze (n, RX, poly) są w iso.js i nie ma ich kopii w island.js ani parts.js', () => {
  assert.equal(n(1.26), 1.3);
  assert.ok(Object.is(n(-0.04), 0), 'bez „-0”');
  assert.equal(RX, TW * Math.SQRT1_2);
  assert.match(poly([[0, 0], [10, 0.04], [10, 10]], '#abc'), /^<path d="M0 0L10 0L10 10Z" fill="#abc" stroke="#abc" stroke-width="\.5"/);
  const src = (f) => readFileSync(new URL(`../js/diorama/${f}`, import.meta.url), 'utf8');
  for (const f of ['island.js', 'parts.js']) assert.ok(!/^const RX\b/m.test(src(f)), `${f}: bez własnej kopii RX`);
  assert.ok(!/^const n = /m.test(src('island.js')), 'island.js: bez własnej kopii n');
});

test('parts: shade przyjmuje dowolny zapis barwy, a dla #rrggbb daje wynik jak dotąd', () => {
  // wzorzec: dotychczasowa implementacja tylko dla hex
  const old = (hex, f) => {
    const q = parseInt(hex.slice(1), 16);
    let r = (q >> 16) & 255, g = (q >> 8) & 255, b = q & 255;
    if (f <= 1) { r *= f; g *= f; b *= f; } else { const t = f - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  };
  for (const hex of ['#808080', '#93cf80', '#ff6b6b', '#0b1020', '#ffffff', '#000000', '#9eb26a']) {
    for (const f of [0, 0.25, 0.55, 0.8, 0.85, 0.9, 1, 1.15, 1.2, 1.35, 1.45, 2]) assert.equal(shade(hex, f), old(hex, f), `${hex} × ${f}`);
  }
  assert.equal(shade('rgb(128,128,128)', 0.5), 'rgb(64,64,64)');
  assert.equal(shade([128, 128, 128], 1.5), 'rgb(192,192,192)');
  const top = tones('#808080', L([0, -1])).top;
  assert.equal(shade(top, 0.5), shade(top.match(/\d+/g).map(Number), 0.5), 'zapis rgb() i tablica dają to samo');
});

test('island: kraterki regolitu mieszczą się w rombie wierzchu', () => {
  for (const size of [4, 8, 12]) for (let seed = 1; seed <= 40; seed++) {
    const svg = island({ view: 'moon', size, light: DAY, env: ENV, seed }).svg;
    for (const m of svg.matchAll(/M(-?[\d.]+) (-?[\d.]+)a([\d.]+) ([\d.]+) 0 1 0/g)) {
      const rx = +m[3], x = +m[1] + rx, y = +m[2], u = (x / 20 + y / 10) / 2, v = (y / 10 - x / 20) / 2, rad = rx / RX;
      assert.ok(Math.abs(u) + rad <= size / 2 + 0.05 && Math.abs(v) + rad <= size / 2 + 0.05, `size ${size} seed ${seed}: krater (${u.toFixed(2)}, ${v.toFixed(2)}) r=${rad.toFixed(2)} wystaje`);
    }
  }
});

test('island: barwa podłoża w paletach etapów to ta, którą rysuje wyspa', () => {
  for (const id of Object.keys(EARTH_RECIPES)) assert.equal(groundTone(id, ENV), PALETTES.earth.ground, id);
  for (const id of ['leo', 'l2']) assert.equal(groundTone(id, ENV), PALETTES.space.ground, id);
  for (const id of Object.keys(GALAXY_RECIPES)) assert.equal(groundTone(id, ENV), PALETTES.galaxy.ground, id);
  for (const id of Object.keys(UNIVERSE_RECIPES)) assert.equal(groundTone(id, ENV), PALETTES.universe.ground, id);
  for (const [id, stage] of [['waw', 'earth'], ['leo', 'space'], ['sgr', 'galaxy'], ['edge', 'universe']]) {
    assert.ok(island({ view: id, size: 6, light: DAY, env: ENV, seed: 1 }).svg.includes(tones(PALETTES[stage].ground, DAY).top), `${id}: wierzch w barwie palety ${stage}`);
  }
});

// Zasięg geometrii SVG: końce odcinków, krzywych i łuków (łuk dużego kąta to pół elipsy) plus połowa grubości kreski.
function extent(svg) {
  const e = [Infinity, Infinity, -Infinity, -Infinity];
  const add = (x, y, h) => { e[0] = Math.min(e[0], x - h); e[1] = Math.min(e[1], y - h); e[2] = Math.max(e[2], x + h); e[3] = Math.max(e[3], y + h); };
  for (const m of svg.matchAll(/<path d="([^"]*)"([^>]*)>/g)) {
    const w = /stroke-width="([\d.]+)"/.exec(m[2]), h = w ? w[1] / 2 : 0, dy = +(/translate\(0 ([\d.]+)\)/.exec(m[2])?.[1] ?? 0);
    let x = 0, y = 0, x0 = 0, y0 = 0;
    const put = (px, py) => { x = px; y = py; add(x, y + dy, h); };
    for (const [, c, args] of m[1].matchAll(/([MLHVAQZmlhvaqz])([^MLHVAQZmlhvaqz]*)/g)) {
      const a = (args.match(/-?\d*\.?\d+/g) || []).map(Number), rel = c === c.toLowerCase(), C = c.toUpperCase();
      if (C === 'Z') { x = x0; y = y0; } else if (C === 'H') put(rel ? x + a[0] : a[0], y); else if (C === 'V') put(x, rel ? y + a[0] : a[0]);
      else if (C === 'A') {
        const [rx, ry, , large, , ex, ey] = a, px = rel ? x + ex : ex, py = rel ? y + ey : ey;
        if (large) { const cx = (x + px) / 2, cy = (y + py) / 2; add(cx - rx, cy - ry + dy, h); add(cx + rx, cy + ry + dy, h); }
        put(px, py);
      } else {
        for (let i = 0; i < a.length; i += 2) {
          put(rel ? x + a[i] : a[i], rel ? y + a[i + 1] : a[i + 1]);
          if (C === 'M' && i === 0) { x0 = x; y0 = y; }
        }
      }
    }
  }
  return e;
}

test('island: cała geometria (kreski, światła, dysze, balustrada) mieści się w bbox dla każdego widoku i rozmiaru', () => {
  for (const view of VIEW_IDS) for (const size of [1, 4, 7, 10, 12]) {
    const r = island({ view, size, light: DAY, env: ENV, seed: size + 5 }), [x0, y0, x1, y1] = extent(r.svg), [bx0, by0, bx1, by1] = r.bbox;
    assert.ok(x0 >= bx0 && y0 >= by0 && x1 <= bx1 && y1 <= by1, `${view} ${size}: geometria [${x0}, ${y0}, ${x1}, ${y1}] poza bbox [${r.bbox}]`);
  }
});

test('frame: diorama mieści się w pasie między górnymi i dolnymi nakładkami, podstawa przy dolnej krawędzi', () => {
  const views = [[SE, SE_INSETS], [{ w: 406, h: 465 }, SE_INSETS], [{ w: 440, h: 956 }, { top: 176, bottom: 6 }]];
  for (const [view, ins] of views) for (const bbox of [[-60, -80, 60, 20], [-200, -260, 200, 60], [-300, -60, 300, 40]]) {
    const f = frameFor(bbox, view, ins);
    assert.ok(Math.abs(f.viewBox[2] / f.viewBox[3] - view.w / view.h) < 1e-6, 'proporcje widoku');
    const sx = (x) => (x - f.viewBox[0]) * f.scale, sy = (y) => (y - f.viewBox[1]) * f.scale;
    assert.ok(sx(bbox[0]) >= -0.5 && sx(bbox[2]) <= view.w + 0.5, 'w poziomie w kadrze');
    assert.ok(sy(bbox[1]) >= ins.top - 0.5 && sy(bbox[3]) <= view.h - ins.bottom + 0.5, 'w pionie w pasie');
    assert.ok(view.h - ins.bottom - sy(bbox[3]) < 0.1 * (view.h - ins.top - ins.bottom), 'podstawa przy dolnej krawędzi pasa');
  }
});

test('frame: większa diorama oddala kamerę, mała nie jest powiększana ponad minSpan, zerowy rozmiar → null', () => {
  const small = frameFor([-40, -60, 40, 10], SE, SE_INSETS), big = frameFor([-200, -260, 200, 60], SE, SE_INSETS);
  assert.ok(big.scale < small.scale);
  assert.ok(small.scale <= SE.w / 300 + 1e-9);
  assert.equal(frameFor([-40, -60, 40, 10], { w: 0, h: 0 }, SE_INSETS), null);
  assert.equal(frameFor([-40, -60, 40, 10], { w: 300, h: 40 }, SE_INSETS), null);
});

// --- Model, układ działek i dioramy zastępcze (Zadanie 5) ---

function maxModel(stage, extra = {}) {
  const S = LAYERS[stage];
  return {
    stage, view: S.HQ, company: 'Krzemowe Imperium', rounds: 8, firstHeads: 100,
    depts: S.DEPTS.map((d) => ({ id: d.id, icon: d.icon, color: d.color, tier: 5, isNew: false })),
    env: { phase: 'night', season: 'winter', weather: 'snow', holiday: 'xmas', newYear: false, snowCover: stage === 'earth' },
    light: recipeFor(S.HQ).light({ phase: 'night', weather: 'snow' }),
    ...extra,
  };
}
// inIsland(r, size): obrys r mieści się w rombie wyspy; overlap3d(a, b): obrysy nachodzą i zakresy [gz, gz + h] też
const inIsland = (r, size) => r.gx >= -size / 2 && r.gy >= -size / 2 && r.gx + r.w <= size / 2 && r.gy + r.d <= size / 2;
const overlap3d = (a, b) => a.gx < b.gx + b.w && b.gx < a.gx + a.w && a.gy < b.gy + b.d && b.gy < a.gy + a.d && a.gz < b.gz + b.h && b.gz < a.gz + a.h;

test('layout: działki nie nachodzą na siebie ani na rdzeń, mieszczą się na wyspie i nie przeskakują, gdy dochodzi dział', () => {
  for (const stage of LAYER_ORDER) {
    const max = LAYERS[stage].DEPTS.length;
    assert.ok(SLOTS[stage].length >= max - 1, `${stage}: dość działek`);
    let prev = null;
    for (let n = 1; n <= max; n++) {
      const lay = layout(stage, n, 0, STAGE_ART[stage].coreFoot(n, 0));
      const all = [lay.core, ...lay.lots];
      assert.equal(lay.lots.length, n - 1);
      for (const r of all) assert.ok(inIsland(r, lay.size), `${stage} n=${n}: na wyspie`);
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(!overlap3d(all[i], all[j]), `${stage} n=${n}: ${i}/${j}`);
      if (prev) { assert.deepEqual(lay.lots.slice(0, n - 2), prev.lots); assert.ok(lay.size >= prev.size); }
      assert.ok(layout(stage, n, 8, STAGE_ART[stage].coreFoot(n, 8)).size >= lay.size, 'rundy nie zmniejszają wyspy');
      prev = lay;
    }
  }
});

test('diorama: model z gry — odblokowane działy w kolejności, progi obsady, rundy ≤ 8', () => {
  const co = new Company(null, { now: 1_700_000_000_000, rng: () => 0.5 });
  const g = co.layers.earth;
  g.s.deptUnlocked.rnd = true; g.s.depts.dev = 40; g.s.depts.rnd = 4; g.s.prestigeCount = 11;
  const m = modelFor(g, { view: 'waw', env: ENV, light: recipeFor('waw').light(ENV) });
  assert.deepEqual(m.depts.map((d) => [d.id, d.tier]), [['dev', 4], ['rnd', 1]]);
  assert.equal(m.stage, 'earth'); assert.equal(m.rounds, 8); assert.equal(m.firstHeads, 40);
});

test('diorama: nowy dział wyrasta tylko raz, a wejście na etap i powrót na niego niczego nie animuje', () => {
  const known = new Map();
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd'])], []);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], ['design']);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], []);
  assert.deepEqual([...newIds(known, 'space', ['engineers'])], [], 'przełączenie etapu');
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], [], 'powrót na Ziemię');
  newIds(known, 'earth', ['dev']);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd'])], ['rnd'], 'po resecie dział znów wyrasta');
  newIds(known, 'galaxy', new Set(['a']));
  assert.deepEqual([...newIds(known, 'galaxy', (function* () { yield 'a'; yield 'b'; })())], ['b'], 'dowolny iterowalny zbiór');
});

// Czytelność dioramy d na iPhonie SE: emblemat i działka dość duże, emblemat w pasie, emblematy nie nachodzą na siebie,
// a budynek narysowany później nie zasłania emblematu wcześniejszego.
function assertSE(d, at) {
  const f = frameFor(d.bbox, SE, SE_INSETS);
  const px = ([x, y]) => [(x - f.viewBox[0]) * f.scale, (y - f.viewBox[1]) * f.scale];
  const inBox = ([x, y], b) => x > b[0] && x < b[2] && y > b[1] && y < b[3];
  d.lots.forEach((a, i) => {
    const r = a.emblem.r * f.scale, [x, y] = px([a.emblem.x, a.emblem.y]);
    assert.ok(2 * r >= MIN_EMBLEM_PX, `${at}/${a.id}: emblemat ${(2 * r).toFixed(1)} px`);
    assert.ok(a.foot * f.scale >= MIN_LOT_PX, `${at}/${a.id}: działka ${(a.foot * f.scale).toFixed(1)} px`);
    assert.ok(x - r >= 0 && x + r <= SE.w && y - r >= SE_INSETS.top && y + r <= SE.h - SE_INSETS.bottom, `${at}/${a.id}: w pasie`);
    for (const b of d.lots.slice(i + 1)) {
      assert.ok(Math.hypot(a.emblem.x - b.emblem.x, a.emblem.y - b.emblem.y) >= a.emblem.r + b.emblem.r, `${at}: ${a.id}/${b.id} emblemy nachodzą`);
      assert.ok(!inBox([a.emblem.x, a.emblem.y], b.box), `${at}: ${b.id} zasłania ${a.id}`);
    }
  });
}

// Każde n od 1 do wszystkich działów, rundy 0 i 8, święta zimą nocą i lato w dzień (najciaśniej bywa przed max).
test('diorama: wszystkie działy każdego etapu mieszczą się i są czytelne na iPhonie SE (każde n, rundy 0 i 8)', () => {
  for (const stage of LAYER_ORDER) {
    const full = maxModel(stage);
    for (let n = 1; n <= full.depts.length; n++) for (const rounds of [0, 8]) for (const env of [full.env, ENV]) {
      const d = buildDiorama({ ...full, depts: full.depts.slice(0, n), rounds, env }), at = `${stage} n=${n} r=${rounds} ${env.season}`;
      assert.deepEqual(d.lots.map((l) => l.id).sort(), full.depts.slice(0, n).map((x) => x.id).sort(), `${at}: każdy dział ma element`);
      assertSE(d, at);
    }
  }
});

test('diorama: budżety elementów i animacji, poprawny i powtarzalny SVG, wyrasta tylko nowy dział', () => {
  for (const stage of LAYER_ORDER) {
    const m = maxModel(stage), d = buildDiorama(m);
    assert.deepEqual(buildDiorama(maxModel(stage)), d, `${stage}: dwa buildy są identyczne`);
    const { elements } = checkSvg(d.front);
    assert.ok(elements <= 1200, `${stage}: ${elements} elementów`);
    assert.equal(d.stats.elements, elements);
    checkSvg(d.frontAnim);
    assert.ok(d.stats.anim <= MAX_ANIM, `${stage}: ${d.stats.anim} animacji`);
    assert.ok((d.front + d.frontAnim).split('filter=').length - 1 <= 8);
    const ids = [...(d.front + d.frontAnim).matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
    assert.equal(new Set(ids).size, ids.length, `${stage}: identyfikatory w dioramie są unikalne`);
    assert.ok(!d.front.includes('floor-new'));
    const one = buildDiorama({ ...m, depts: m.depts.map((x, i) => ({ ...x, isNew: i === 2 })) });
    assert.equal(one.front.split('class="floor-new"').length - 1, 1, `${stage}: wyrasta tylko trzeci dział`);
  }
});

test('diorama: każdy dział ma emblemat z własną ikoną i kolorem', () => {
  for (const stage of LAYER_ORDER) {
    const { front } = buildDiorama(maxModel(stage));
    for (const d of LAYERS[stage].DEPTS) assert.ok(front.includes(`>${d.icon}</text>`) && front.includes(`fill="${d.color}"`), `${stage}/${d.id}`);
  }
});

test('diorama: obsada i ozdoby świąt — ludzie według progu, lampki na rdzeniu, choinka i dynie na Ziemi', () => {
  const people = (tier) => buildDiorama(maxModel('earth', { depts: maxModel('earth').depts.slice(0, 3).map((d) => ({ ...d, tier })) })).stats.people;
  assert.ok(people(0) === 0 && people(1) < people(3) && people(3) < people(5));
  assert.deepEqual(buildDiorama(maxModel('earth')).stats.decor.sort(), ['lights', 'snow', 'xmasTree']);
  assert.deepEqual(buildDiorama(maxModel('space')).stats.decor, ['lights']);
  assert.deepEqual(buildDiorama(maxModel('earth', { env: { ...ENV, holiday: 'halloween' } })).stats.decor, ['pumpkins']);
  assert.deepEqual(buildDiorama(maxModel('galaxy', { env: { ...ENV, holiday: 'halloween' } })).stats.decor, []);
  const s = buildDiorama(maxModel('universe')).stats;
  assert.deepEqual([s.base, s.material, s.vehicles, s.ornaments], ['shard', 'crystal', 0, []]);
  // Każdy budynek ma własne ziarno postaci: jedna osoba mniej w jednym dziale nie przetasowuje koszulek w innych.
  const shirts = (d) => new Map([...(d.front + d.frontAnim).matchAll(/translate\(([^)]+)\) scale\(0\.45\)">(?:<g [^>]*>)?<rect x="-5" y="-15"[^>]* fill="([^"]+)"/g)].map((x) => [x[1], x[2]]));
  const m = maxModel('earth'), a = shirts(buildDiorama(m));
  const same = [...shirts(buildDiorama({ ...m, depts: m.depts.map((d, i) => (i === 1 ? { ...d, tier: 4 } : d)) }))].filter(([p]) => a.has(p));
  assert.ok(same.length >= 60 && same.every(([p, c]) => a.get(p) === c), 'koszulki w pozostałych budynkach bez zmian');
  // Przy progu 1 każda postać jest pierwszą w swoim budynku: ziarna sąsiednich budynków nie dają tej samej koszulki.
  const firsts = shirts(buildDiorama({ ...m, depts: m.depts.map((d) => ({ ...d, tier: 1 })) }));
  assert.ok(firsts.size === 13 && new Set(firsts.values()).size >= 5, `koszulki pierwszych osób: ${[...firsts.values()]}`);
});

test('layout: działka działu wynika z jego miejsca w DEPTS — odblokowanie poza kolejnością niczego nie przesuwa', () => {
  for (const stage of LAYER_ORDER) {
    const full = maxModel(stage), id = LAYERS[stage].DEPTS[4].id, s = SLOTS[stage][3];
    const part = buildDiorama({ ...full, depts: [0, 1, 4].map((i) => full.depts[i]) }), lot = (d) => d.lots.find((l) => l.id === id);
    assert.equal(part.lots.length, 3);
    assert.deepEqual(lot(part), lot(buildDiorama(full)), `${stage}: ${id} stoi tam, gdzie w pełnym układzie`);
    // Działka z układu to SLOTS[3], a emblemat stoi nad jej rzutem (niezależnie od szerokości detali archetypu).
    const foot = STAGE_ART[stage].coreFoot(LAYERS[stage].DEPTS.length, 8), r = layout(stage, 5, 8, STAGE_ART[stage].coreFoot(3, 8)).lots[3];
    assert.deepEqual([r.gx, r.gy, r.w, r.d], [s.gx, s.gy, s.w, s.d], `${stage}: ${id} na SLOTS[3]`);
    const ex = lot(part).emblem.x;
    assert.ok(ex > iso(s.gx, s.gy + s.d)[0] && ex < iso(s.gx + s.w, s.gy)[0], `${stage}: emblemat ${id} nad SLOTS[3]`);
    assert.equal(layout(stage, 9, 8, foot).size, layout(stage, 9, 0, foot).size, `${stage}: rundy nie dokładają pierścienia wyspy`);
  }
  assert.deepEqual(layout('earth', 0, 0, { w: 2, d: 2, h: 2 }).lots, [], 'n = 0 bez działek');
});

test('diorama: identyfikatory z różnych budynków są unikalne (kontrola z poświatą na dwóch działkach)', () => {
  const g = STAGE_ART.earth, glow = (p) => [...p, ['glow', 0.5, 0.5, 3.5, 0.2, 'crystal']];
  STAGE_ART.earth = { ...g, depts: { ...g.depts, rnd: glow(g.depts.rnd), design: glow(g.depts.design) } };
  try {
    const d = buildDiorama(maxModel('earth')), ids = [...(d.front + d.frontAnim).matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
    assert.ok(ids.length >= 2, 'są identyfikatory');
    assert.equal(new Set(ids).size, ids.length, ids.join());
  } finally {
    STAGE_ART.earth = g;
  }
});

test('skyline: budowle stoją na horyzoncie tła przy każdym rozmiarze sceny i biorą światło z klucza', () => {
  const env = { phase: 'night', weather: 'clear' }, horizon = EARTH_RECIPES.waw.horizon;
  for (const size of [{ w: 341, h: 273 }, { w: 406, h: 465 }, { w: 440, h: 956 }]) {
    const s = skyline('waw', size, { light: EARTH_RECIPES.waw.light(env), phase: 'night', horizon });
    checkSvg(s.svg);
    assert.equal(s.anchors.length, 2);
    for (const a of s.anchors) assert.ok(Math.abs(a.y - horizon * size.h) < 0.5);
    assert.ok(s.anchors[0].x < size.w / 2 && s.anchors[1].x > size.w / 2);
  }
  const lit = (dir) => skyline('waw', SE, { light: { ...EARTH_RECIPES.waw.light(env), dir }, phase: 'day', horizon }).svg;
  assert.notEqual(lit([0.94, -0.34]), lit([-0.94, -0.34]), 'jaśniejsza strona zależy od kierunku światła');
  assert.equal(skyline('sgr', SE, {}).svg, '', 'poza Ziemią nie ma panoramy SVG');
  for (const [id, r] of Object.entries(EARTH_RECIPES)) assert.ok(r.horizon > 0.7 && r.horizon < 0.92, id);
});

// --- Ziemia: rdzeń i ozdoby rund (Zadanie 8) ---

// Ziemia z n pierwszymi działami (próg obsady jak przy firstHeads), w lecie za dnia.
const earthModel = (n, o = {}) => {
  const m = maxModel('earth', { env: ENV, light: DAY, rounds: 0, ...o });
  return { ...m, depts: m.depts.slice(0, n).map((d) => ({ ...d, tier: tierFor(m.firstHeads) })) };
};

test('earth: forma rdzenia według liczby działów', () => {
  assert.deepEqual([1, 2, 4, 5, 8, 9, 13].map(EARTH_ART.coreForm), ['garage', 'office', 'office', 'tower', 'tower', 'campus', 'campus']);
});

test('earth: rdzeń rośnie z działami', () => {
  let prev = 0;
  for (let n = 1; n <= 13; n++) {
    const b = buildDiorama(earthModel(n)).lots.find((l) => l.id === 'dev').box, h = b[3] - b[1];
    assert.ok(h >= prev, `n=${n}: wysokość ${h} < ${prev}`);
    prev = h;
  }
});

test('earth: ludzie w garażu według obsady pierwszego działu', () => {
  assert.deepEqual([0, 3, 6, 100].map((firstHeads) => buildDiorama(earthModel(1, { firstHeads })).stats.people), [1, 2, 3, 3]);
});

test('earth: ozdoby rund', () => {
  const orn = (rounds, n = 13) => buildDiorama(earthModel(n, { rounds })).stats.ornaments;
  assert.deepEqual(orn(0), []);
  assert.deepEqual([...orn(8)].sort(), ['dish', 'helipad', 'neon', 'rocket', 'solar']);
  assert.deepEqual([...orn(2)].sort(), ['neon', 'solar']);
  for (const n of [1, 3, 6, 10]) assert.equal(orn(8, n).length, 5, `n=${n}`);
});

test('earth: tabliczki rdzenia są escapowane i skracane na każdym etapie rozwoju', () => {
  const name = '<b>Ala & "Kot"</b> 🚀 sp. z o.o. — bardzo długa nazwa';
  for (const n of [1, 3, 6, 10]) {
    const { front } = buildDiorama(earthModel(n, { company: name, rounds: 8 }));
    checkSvg(front);
    assert.ok(!front.includes('<b>') && front.includes('&lt;b&gt;'), `n=${n}`);
    const texts = [...front.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((x) => unesc(x[1])).filter((t) => t.startsWith('<b>'));
    assert.ok(texts.length === 1 && texts[0].endsWith('…'), `n=${n}: ${texts}`);
    assert.ok(front.includes('◆ &lt;b&gt;Ala'), `n=${n}: neon z pierwszym słowem nazwy`);
  }
});

test('earth: brak zastępczego rdzenia', () => {
  assert.ok(!STAGE_ART.earth.placeholder);
  assert.ok(!EARTH_ART.placeholder);
});

// --- Ziemia: budynki działów, pory roku, święta i ruch (Zadanie 9) ---

test('earth: każdy dział ma własny archetyp z jednym emblematem, archetypy się różnią', () => {
  assert.deepEqual(Object.keys(EARTH_ART.depts).sort(), LAYERS.earth.DEPTS.slice(1).map((d) => d.id).sort());
  for (const [id, parts] of Object.entries(EARTH_ART.depts)) {
    const signs = parts.filter((p) => p[0] === 'sign');
    assert.equal(signs.length, 1, `${id}: jeden sign`);
    assert.ok(signs[0][3] <= LOT_MAX_H.earth, `${id}: emblemat na wysokości ≤ ${LOT_MAX_H.earth}`);
    assert.ok(parts.some((p) => p.includes('accent')), `${id}: akcent w kolorze działu`);
  }
  assert.equal(new Set(Object.values(EARTH_ART.depts).map((p) => JSON.stringify(p))).size, 12);
  assert.equal(STAGE_ART.earth.depts, EARTH_ART.depts);
});

test('earth: ruch rośnie z firmą', () => {
  const veh = (n, o) => buildDiorama(earthModel(n, o)).stats.vehicles;
  assert.deepEqual([1, 2, 6, 10].map((n) => veh(n, { firstHeads: 5 })), [0, 1, 2, 3], 'auta bez dronów (próg < 3)');
  assert.equal(veh(13), 7, '3 auta i 4 drony');
  const d = buildDiorama(earthModel(13));
  assert.equal(d.frontAnim.split('class="car"').length - 1, 3);
  // Najpierw po jednym dronie na dział: przy max cztery drony w kolorach czterech działów.
  const bodies = [...d.frontAnim.matchAll(/<rect x="-3" y="-1.6"[^>]* fill="(#[0-9a-f]+)"/g)].map((x) => x[1]);
  assert.equal(new Set(bodies).size, 4, `drony: ${bodies}`);
  // Drony: w warstwie animacji z klasami person i blink, nie zasłaniają emblematów (warstwa animacji leży nad nimi).
  const drones = [...d.frontAnim.matchAll(/translate\(([-\d.]+) ([-\d.]+)\)"><g class="person"[^>]*>(.*?)<\/g><\/g>/g)];
  assert.equal(drones.length, 4);
  for (const [, x, y, body] of drones) {
    assert.ok(body.includes('class="blink"'));
    for (const l of d.lots) assert.ok(Math.hypot(x - l.emblem.x, y - l.emblem.y) >= l.emblem.r + 8, `dron (${x}, ${y}) na emblemacie ${l.id}`);
  }
});

test('earth: gęstość obsady rośnie z progiem SEATS', () => {
  const m = earthModel(2), at = (tier) => buildDiorama({ ...m, depts: m.depts.map((d, i) => (i ? { ...d, tier } : d)) }).stats;
  const s = [0, 1, 2, 3, 4, 5].map(at);
  for (let t = 1; t < 6; t++) for (const k of ['people', 'lit', 'vehicles']) assert.ok(s[t][k] >= s[t - 1][k], `${k}: próg ${t}`);
  assert.ok(s[5].people > s[1].people && s[5].lit > s[1].lit && s[5].vehicles > s[1].vehicles);
});

test('earth: pory roku i święta na wyspie', () => {
  for (const n of [1, 6, 13]) {
    const decor = (env) => buildDiorama(earthModel(n, { env: { ...ENV, ...env } })).stats.decor;
    assert.ok(decor({ season: 'winter', snowCover: true }).includes('snow'), `n=${n}: śnieg`);
    assert.ok(decor({ season: 'spring' }).includes('blossom'), `n=${n}: kwiaty`);
    assert.ok(decor({ season: 'autumn' }).includes('leaves'), `n=${n}: liście`);
    assert.ok(['xmasTree', 'lights'].every((k) => decor({ season: 'winter', holiday: 'xmas' }).includes(k)), `n=${n}: Boże Narodzenie`);
    assert.ok(decor({ season: 'autumn', holiday: 'halloween' }).includes('pumpkins'), `n=${n}: Halloween`);
    assert.deepEqual(decor({}), [], `n=${n}: lato bez święta`);
  }
  // Dynie: dwie przy rdzeniu i po jednej przy drzwiach najwyżej 6 działów najbliżej widza.
  const pumpkins = (n) => buildDiorama(earthModel(n, { env: { ...ENV, holiday: 'halloween' } })).front.split('fill="#f08a24"').length - 1;
  assert.deepEqual([1, 3, 7, 13].map(pumpkins), [2, 4, 8, 8]);
  const svg = (season) => buildDiorama(earthModel(13, { env: { ...ENV, season } })).front;
  assert.equal(new Set(['spring', 'summer', 'autumn', 'winter'].map(svg)).size, 4, 'drzewa zmieniają się z porą roku');
});

// Odległość punktu p od prostokąta [x0, y0, x1, y1] w kafelkach.
const far = (p, [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - p[0], 0, p[0] - x1), Math.max(y0 - p[1], 0, p[1] - y1));

test('earth: rakieta, drzewa i droga nie kolidują z działkami ani ze sobą, plac przed rdzeniem jest wolny', () => {
  const D = LAYERS.earth.DEPTS;
  // Pierwsze n działów i pojedynczy dział poza kolejnością (wolne działki zamkniętych działów).
  const cases = [...Array.from({ length: 13 }, (_, i) => i + 1).map((n) => earthModel(n, { rounds: 8 })),
    ...[4, 7, 12].map((i) => { const m = maxModel('earth', { env: ENV, light: DAY }); return { ...m, depts: [m.depts[0], m.depts[i]] }; })];
  for (const m of cases) {
    const pos = m.depts.map((d) => D.findIndex((x) => x.id === d.id)), at = m.depts.map((d) => d.id).join();
    const lay = layout('earth', Math.max(...pos) + 1, m.rounds, EARTH_ART.coreFoot(m.depts.length, m.rounds)), s = EARTH_ART.site(m, lay);
    const rect = (r) => [r.gx, r.gy, r.gx + r.w, r.gy + r.d], lots = lay.lots.map(rect), mine = pos.filter((p) => p).map((p) => lots[p - 1]);
    for (const b of [...lots, s.road, s.plaza]) assert.ok(far(s.rocket, b) >= 0.42, `${at}: rakieta przy ${b}`);
    for (const t of s.trees) {
      assert.ok(Math.hypot(t[0] - s.rocket[0], t[1] - s.rocket[1]) >= 0.42 + 0.3, `${at}: drzewo ${t} przy rakiecie`);
      for (const b of [...mine, s.road, s.plaza, rect(lay.core)]) assert.ok(far(t, b) >= 0.15, `${at}: drzewo ${t} na ${b}`);
    }
    assert.ok(far([(s.plaza[0] + s.plaza[2]) / 2, (s.plaza[1] + s.plaza[3]) / 2], s.road) > 0.5, `${at}: droga z dala od placu`);
    assert.ok(s.trees.length >= 3, `${at}: drzewa na brzegu wyspy`);
  }
});

test('earth: lampki świąteczne widać na wieżowcu i kampusie', () => {
  for (let n = 5; n <= 13; n++) for (const rounds of [0, 8]) {
    const d = buildDiorama(earthModel(n, { rounds, env: { ...ENV, season: 'winter', holiday: 'xmas' } }));
    const bulbs = [...d.front.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="1\.7"/g)].map((x) => [+x[1], +x[2]]);
    const lots = d.lots.filter((l) => l.id !== 'dev'), hit = ([x, y], l) => Math.hypot(x - l.emblem.x, y - l.emblem.y) < l.emblem.r + 2;
    const seen = bulbs.filter((p) => !d.lots.some((l) => hit(p, l)) && !lots.some(({ box: b }) => p[0] > b[0] && p[0] < b[2] && p[1] > b[1] && p[1] < b[3]));
    assert.ok(bulbs.length >= 5 && seen.length === bulbs.length, `n=${n} r=${rounds}: widać ${seen.length}/${bulbs.length}`);
  }
});

// --- Kosmos: kapsuła → stacja (Zadanie 10) ---

const SP = () => STAGE_ART.space;
// Kosmos z n pierwszymi działami w widoku view (domyślnie siedziba), bez rund i świąt.
const spaceModel = (n, o = {}) => {
  const view = o.view ?? LAYERS.space.HQ, m = maxModel('space', { env: { ...ENV, season: 'space' }, light: recipeFor(view).light({}), rounds: 0, ...o });
  return { ...m, depts: m.depts.slice(0, n) };
};

test('space: forma rdzenia i podstawa według widoku', () => {
  assert.deepEqual([1, 2, 4, 5, 9].map((n) => SP().coreForm(n)), ['capsule', 'hub', 'hub', 'station', 'station']);
  const st = (view) => buildDiorama(spaceModel(9, { view })).stats;
  assert.deepEqual([st('moon').base, st('leo').base, st('venus').base], ['island', 'platform', 'aerostat']);
  assert.deepEqual([st('moon').material, st('europa').material], ['regolith', 'ice']);
});

test('space: każdy dział ma własny moduł z jednym emblematem, moduły się różnią', () => {
  const depts = SP().depts, top = (p) => (p[0] === 'strut' ? Math.max(p[3], p[6]) : p[3] + ({ box: p[6], pyr: p[6], gable: p[6], cyl: p[5], dome: p[4], mast: p[4] }[p[0]] ?? 0));
  assert.deepEqual(Object.keys(depts).sort(), LAYERS.space.DEPTS.slice(1).map((d) => d.id).sort());
  for (const [id, parts] of Object.entries(depts)) {
    const signs = parts.filter((p) => p[0] === 'sign');
    assert.equal(signs.length, 1, `${id}: jeden sign`);
    assert.ok(Math.max(...parts.map(top)) <= LOT_MAX_H.space, `${id}: moduł i emblemat na wysokości ≤ ${LOT_MAX_H.space}`);
    assert.ok(parts.some((p) => p.includes('accent')), `${id}: akcent w kolorze działu`);
    assert.ok(parts.some((p) => p[0] === 'glow' && p[5] === 'crystal'), `${id}: bursztynowe światło modułu`);
  }
  assert.equal(new Set(Object.values(depts).map((p) => JSON.stringify(p))).size, 8);
  assert.ok(depts.medics.some((p) => p.includes('green')), 'medycy: zielony pas zamiast krzyża');
});

test('space: ozdoby rund', () => {
  const orn = (rounds, n = 9) => buildDiorama(spaceModel(n, { rounds })).stats.ornaments;
  assert.deepEqual(orn(0), []);
  assert.deepEqual([...orn(8)].sort(), ['rocket1', 'rocket2', 'rocket3', 'torus', 'wing']);
  assert.deepEqual([...orn(3)].sort(), ['rocket1', 'rocket2', 'wing']);
  for (const n of [1, 3, 6]) assert.equal(orn(8, n).length, 5, `n=${n}`);
  // Każdy próg rund coś dokłada do obrazu.
  for (const n of [1, 3, 9]) assert.equal(new Set([0, 1, 2, 3, 5, 8].map((rounds) => buildDiorama(spaceModel(n, { rounds })).front)).size, 6, `n=${n}`);
});

test('space: brak zastępczej dioramy', () => {
  assert.ok(!SP().placeholder);
  for (const d of LAYERS.space.DEPTS.slice(1)) assert.notEqual(SP().depts[d.id], GENERIC.space.depts[d.id], d.id);
  assert.notEqual(SP().core, GENERIC.space.core);
});

test('space: tabliczka „◆ NAZWA” na każdym etapie, escapowana i skracana do 24 znaków', () => {
  const name = '<b>Ala & "Kot"</b> 🚀 sp. z o.o. — bardzo długa nazwa';
  for (const n of [1, 3, 6, 9]) {
    const { front } = buildDiorama(spaceModel(n, { company: name, rounds: 8 }));
    checkSvg(front);
    const texts = [...front.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((x) => unesc(x[1])).filter((t) => t.startsWith('◆'));
    assert.equal(texts.length, 1, `n=${n}: ${texts}`);
    assert.ok(Array.from(texts[0]).length === 24 && texts[0].endsWith('…') && !front.includes('<b>'), `n=${n}: ${texts[0]}`);
  }
});

test('space: łazik tylko na wyspach z powierzchnią, astronauci w białych kombinezonach, każdy widok czytelny na SE', () => {
  const build = (view, o) => buildDiorama(spaceModel(9, { view, ...o }));
  for (const { id } of LAYERS.space.OFFICES) {
    const d = build(id, { rounds: 8 }), surface = PLACES[id].base === 'island';
    assert.equal(d.frontAnim.includes('class="car"'), surface, `${id}: łazik`);
    assert.ok(surface ? d.stats.vehicles >= 1 : d.stats.vehicles === 0, `${id}: pojazdy ${d.stats.vehicles}`);
    for (const rounds of [0, 8]) assertSE(build(id, { rounds }), `space/${id} r=${rounds}`);
  }
  const d = build('moon'), suits = [...(d.front + d.frontAnim).matchAll(/scale\(0\.45\)">(?:<g [^>]*>)?<rect x="-5" y="-15"[^>]* fill="([^"]+)"/g)].map((x) => x[1]);
  assert.ok(suits.length === d.stats.people && suits.length > 20 && new Set(suits).size === 1, `kombinezony: ${new Set(suits).size} barw`);
  assert.ok(lum(suits[0]) > 0.8, `biały kombinezon ${suits[0]}`);
});

test('space: moduł centralny, kapsuła i habitat rzucają cień całej wysokości na grunt (także spod nóg lądownika)', () => {
  for (const view of ['moon', 'leo']) for (const n of [1, 2, 5, 9]) {
    const foot = SP().coreFoot(n, 0), parts = SP().core(spaceModel(n, { view }), layout('space', n, 0, foot)).parts, at = `${view} n=${n}`;
    // Segmenty walców modułu, kapsuły i rakiety (bez kołnierza, stopy i węzła, które stoją na czymś) nie rzucają własnych cieni.
    const segs = parts.filter((p) => p[0] === 'cyl' && ['wall', 'wall2', 'accent'].includes(p[6]));
    assert.ok(segs.length >= 3 && segs.every((p) => String(p[7]).includes('flush')), `${at}: segmenty bez cienia`);
    const sh = parts.filter((p) => p[0] === 'shadow');
    assert.equal(sh.length, 1, `${at}: jeden cień modułu`);
    assert.equal(sh[0][3], 0, `${at}: cień na gruncie`);
    assert.ok(sh[0][5] >= (n > 1 ? foot.h : 2.2), `${at}: cień wysokości ${sh[0][5]}`);
  }
  const hab = SP().depts.astronauts.filter((p) => p[0] === 'shadow');
  assert.ok(hab.length === 1 && hab[0][3] === 0 && hab[0][5] >= 2.1, 'habitat: cień całego walca');
});

test('space: każdy moduł działu ma okna, które nocą świecą według progu obsady', () => {
  const glow = (parts, lit) => (assemble(parts, CTX({ palette: PALETTES.space, light: NIGHT, lit })).svg.match(/<path d="([^"]*)" fill="#ffd88a"/g) ?? []).join('').split('M').length - 1;
  for (const [id, parts] of Object.entries(SP().depts)) {
    assert.ok(parts.some((p) => p.some((v) => typeof v === 'string' && /\bwin\b/.test(v))), `${id}: okna`);
    assert.equal(glow(parts, 0), 0, `${id}: przy udziale 0 nic nie świeci`);
    assert.ok(glow(parts, 1) >= 2, `${id}: przy pełnej obsadzie świeci ${glow(parts, 1)} okien`);
  }
});

test('sw.js: pamięć offline zawiera każdy moduł dioram (poza galerią)', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`]));
  const files = walk('../js/diorama/').filter((f) => f.endsWith('.js') && !f.endsWith('/gallery.js')).map((f) => f.replace('../', './'));
  const missing = files.filter((f) => !sw.includes(`'${f}'`));
  assert.deepEqual(missing, []);
});

// Scena bez przeglądarki: najmniejszy DOM (elementy z atrybutami i innerHTML), bez Canvas (createElement('canvas') rzuca).
function fakeScene(w, h) {
  const el = () => ({ attrs: {}, innerHTML: '', clientWidth: 0, clientHeight: 0, setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k] ?? null; }, appendChild: (c) => c, closest: () => null });
  const prev = globalThis.document;
  globalThis.document = { createElement: (t) => { if (t === 'canvas') throw new Error('bez Canvas'); return el(); }, createElementNS: () => el() };
  try {
    const root = Object.assign(el(), { clientWidth: w, clientHeight: h });
    return { root, sc: new Scene(root, { insets: () => SE_INSETS }) };
  } finally {
    globalThis.document = prev;
  }
}

test('scena: po powrocie z zerowego rozmiaru (także do tego samego) warstwy i kadr liczą się na nowo dla nowej dioramy', () => {
  const { root, sc } = fakeScene(SE.w, SE.h), g = new Company(null, { now: 1_700_000_000_000, rng: () => 0.5 }).layers.earth;
  const vb = () => sc.layers.front.getAttribute('viewBox');
  sc.render(g, true);
  const vb0 = vb();
  assert.equal(vb0, viewBoxAttr(frameFor(sc.bbox, SE, SE_INSETS)));
  for (const k of ['skyline', 'back', 'backAnim', 'weather']) assert.equal(sc.layers[k].getAttribute('viewBox'), `0 0 ${SE.w} ${SE.h}`, k);
  // Ukrycie: zerowy rozmiar, a w tym czasie render z nowym podpisem (wszystkie działy) — viewBox zostaje.
  Object.assign(root, { clientWidth: 0, clientHeight: 0 }); sc.resize();
  for (const d of g.D.DEPTS) g.s.deptUnlocked[d.id] = true;
  sc.render(g);
  assert.equal(vb(), vb0, 'przy zerowym rozmiarze bez nowego viewBox');
  // Powrót do tego samego rozmiaru: kadr nowej (większej) dioramy.
  Object.assign(root, { clientWidth: SE.w, clientHeight: SE.h }); sc.resize();
  assert.notEqual(vb(), vb0);
  assert.equal(vb(), viewBoxAttr(frameFor(sc.bbox, SE, SE_INSETS)));
  assert.ok(!/NaN/.test(Object.values(sc.layers).map((l) => l.getAttribute('viewBox')).join()));
});

test('scena: bez tła Canvas niebo leży pod budowlami miasta, a nieudana budowa dioramy nie zjada animacji nowego działu', () => {
  const { sc } = fakeScene(SE.w, SE.h), g = new Company(null, { now: 1_700_000_000_000, rng: () => 0.5 }).layers.earth;
  sc.render(g, true);
  const sk = sc.layers.skyline.innerHTML;
  assert.ok(sk.startsWith('<defs><linearGradient id="skyG"') && sk.includes('url(#d-lm)'), 'gradient przed budowlami w jednej warstwie');
  assert.equal(sc.layers.back.innerHTML, '', 'back nie zasłania budowli');
  const art = STAGE_ART.earth, before = sc.layers.front.innerHTML;
  g.s.deptUnlocked.rnd = true;
  STAGE_ART.earth = { ...art, core: () => { throw new Error('zepsuta oprawa'); } };
  try {
    sc.render(g, true);
    assert.equal(sc.layers.front.innerHTML, before, 'błąd zostawia poprzednią dioramę');
  } finally {
    STAGE_ART.earth = art;
  }
  sc.render(g, true);
  assert.ok(sc.layers.front.innerHTML.includes('class="floor-new"'), 'nowy dział wyrasta po udanej budowie');
  sc.render(g, true);
  assert.ok(!sc.layers.front.innerHTML.includes('class="floor-new"'), 'i tylko raz');
});
