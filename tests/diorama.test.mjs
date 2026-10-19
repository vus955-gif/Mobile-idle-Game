// Testy dioram: rzut, tony, części, wyspy, kadr, układ, model i oprawa etapów (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSvg, lum } from './helpers/svg.mjs';
import { TW, TH, LV, iso, tones, box, shadowOffset, windows, NIGHT_AMBIENT, WIN_GLOW, pyr, gable, cyl, dome, ring, shadow } from '../js/diorama/iso.js';
import { RECIPES, VIEW_IDS } from '../js/art/views/index.js';
import { PALETTES, assemble, emblem, emblemCenter, ER, SEATS, tierFor, CREW, MAX_ANIM, budget, drive, person, tree, pumpkin, xmasTree, stringLights, SIDE_ART, seeded, shade, esc } from '../js/diorama/parts.js';
import { PLACES, island, groundTone, SNOW } from '../js/diorama/island.js';

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
    ['label', 1, 0, 1, 2, 12], ['sign', 1, 0.5, 3],
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

test('island: każdy z 45 widoków ma podstawę i materiał zgodny z projektem', () => {
  assert.deepEqual(Object.keys(PLACES).sort(), [...VIEW_IDS].sort());
  const want = {
    moon: ['island', 'regolith'], mars: ['island', 'rust'], europa: ['island', 'ice'], titan: ['island', 'dunes'],
    mercury: ['island', 'rock'], ceres: ['island', 'rock'], leo: ['platform', 'metal'], l2: ['platform', 'metal'],
    venus: ['aerostat', 'deck'], sgr: ['dock', 'metal'], edge: ['shard', 'crystal'], waw: ['island', 'grass'],
  };
  for (const [id, [base, material]] of Object.entries(want)) assert.deepEqual([PLACES[id].base, PLACES[id].material], [base, material], id);
  const count = (base) => Object.values(PLACES).filter((p) => p.base === base).length;
  assert.deepEqual(['island', 'platform', 'aerostat', 'dock', 'shard'].map(count), [24, 2, 1, 9, 9]);
  // niebo: miasta mają chmury (gwiazdy nocą wynikają z pory dnia), światy skaliste gwiazdy bez ruchu, Galaktyka i Wszechświat komety
  for (const id of ['waw', 'nyc', 'tlv']) assert.deepEqual(PLACES[id].sky, { stars: false, traffic: 'clouds' }, id);
  for (const id of ['moon', 'mercury', 'ceres', 'europa']) assert.deepEqual(PLACES[id].sky, { stars: true, traffic: 'none' }, id);
  for (const id of ['mars', 'titan', 'venus']) assert.deepEqual(PLACES[id].sky, { stars: false, traffic: 'none' }, id);
  for (const id of ['leo', 'l2']) assert.deepEqual(PLACES[id].sky, { stars: true, traffic: 'satellites' }, id);
  for (const id of ['sol', 'sgr', 'milkyway', 'edge']) assert.deepEqual(PLACES[id].sky, { stars: true, traffic: 'comets' }, id);
  const mats = new Set(['grass', 'regolith', 'rock', 'rust', 'ice', 'dunes', 'metal', 'deck', 'crystal']);
  for (const [id, p] of Object.entries(PLACES)) assert.ok(mats.has(p.material) && ['island', 'platform', 'aerostat', 'dock', 'shard'].includes(p.base), id);
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

// Poniższe testy dodano ponad polecenie zadania.

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
