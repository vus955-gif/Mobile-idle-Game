// Galeria dioram (narzędzie deweloperskie, tools/dioramas.html): diorama każdego etapu na sześciu poziomach rozwoju,
// w rozmiarze sceny iPhone'a SE, nad tłem Canvas i budowlami miasta. Podpis kafla mierzy czytelność (emblemat, działka),
// budżety (elementy, animacje) i czas budowy. Sceny nie składa klasa Scene (jej wcięcia mierzą DOM gry), tylko ta strona.
import { buildDiorama } from './index.js';
import { SE, SE_INSETS, MIN_EMBLEM_PX, MIN_LOT_PX, frameFor, viewBoxAttr } from './frame.js';
import { skyline } from './skyline.js';
import { SEATS, MAX_ANIM, esc } from './parts.js';
import { renderLocal } from '../art/backdrop.js';
import { recipeFor } from '../art/views/index.js';
import { LAYERS, LAYER_ORDER } from '../layers.js';

const EL_BUDGET = 1200; // elementów SVG w warstwie statycznej (global-constraints)
const DENSITY = 2;      // gęstość tła Canvas, jak na telefonie z ekranem Retina
const params = new URLSearchParams(location.search);
// ?size=SZERxWYS — rozmiar sceny w px CSS (domyślnie 341x273, iPhone SE z paskiem stanu 20 px)
const [W, H] = (params.get('size') || `${SE.w}x${SE.h}`).split('x').map((v) => Math.max(64, Number(v) || 0));
// ?stage=earth|space|galaxy|universe — tylko jeden etap
const ONLY = LAYER_ORDER.includes(params.get('stage')) ? params.get('stage') : null;
const TITLES = { earth: '🌍 Ziemia', space: '🛰️ Kosmos', galaxy: '🌌 Galaktyka', universe: '🕳️ Wszechświat' };
// Poziomy rozwoju: n pierwszych działów (max = wszystkie), próg obsady (1–5), rundy; ostatni to max w święta, zimą i nocą.
const LEVELS = [
  { n: 1, tier: 1, rounds: 0 }, { n: 2, tier: 2, rounds: 0 }, { n: 4, tier: 3, rounds: 1 }, { n: 7, tier: 4, rounds: 3 },
  { n: 'max', tier: 5, rounds: 8 }, { n: 'max', tier: 5, rounds: 8, festive: true },
];
const FESTIVE = { phase: 'night', season: 'winter', weather: 'snow', holiday: 'xmas' };

const $ = (id) => document.getElementById(id);
const num = (v, d) => v.toFixed(d).replace('.', ',');
const deptWord = (n) => (n === 1 ? 'dział' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 > 20) ? 'działy' : 'działów');
const nextFrame = () => new Promise((r) => setTimeout(r, 0)); // setTimeout, bo requestAnimationFrame staje w tle
const controls = () => ({ phase: $('phase').value, weather: $('weather').value, season: $('season').value, holiday: $('holiday').value || null });

// Model jak maxModel z testów, ze zmienionym n, progiem i rundami. Poza Ziemią scena nie ma pór roku ani pogody (święta zostają),
// a tło dostaje pusty env, więc pora dnia i pogoda dotyczą tylko Ziemi.
function tileModel(st, level) {
  const S = LAYERS[st.key], e = level.festive ? FESTIVE : controls(), earth = st.key === 'earth';
  const bd = earth ? { phase: e.phase, weather: e.weather, season: e.season, holiday: e.holiday } : {};
  const env = earth ? { ...bd, newYear: false, snowCover: e.season === 'winter' }
    : { phase: e.phase, season: 'space', weather: 'clear', holiday: e.holiday, newYear: false, snowCover: false };
  const n = level.n === 'max' ? S.DEPTS.length : Math.min(level.n, S.DEPTS.length);
  return {
    bd,
    model: {
      stage: st.key, view: st.view, company: 'Krzemowe Imperium', rounds: level.rounds, firstHeads: SEATS[level.tier - 1],
      depts: S.DEPTS.slice(0, n).map(({ id, icon, color }) => ({ id, icon, color, tier: level.tier, isNew: false })),
      env, light: recipeFor(st.view).light(bd),
    },
  };
}

const sections = [];
function build() {
  const root = $('sections');
  for (const key of LAYER_ORDER) {
    if (ONLY && key !== ONLY) continue;
    const S = LAYERS[key], st = { key, view: S.HQ, tiles: [] };
    const head = document.createElement('div');
    head.className = 'sec';
    const title = document.createElement('h2');
    title.textContent = `${TITLES[key]} (${S.DEPTS.length} ${deptWord(S.DEPTS.length)})`;
    const label = document.createElement('label');
    const select = document.createElement('select');
    for (const o of S.OFFICES) select.append(new Option(`${o.icon} ${o.name}${o.hq ? ' (siedziba)' : ''}`, o.id, o.id === S.HQ, o.id === S.HQ));
    select.addEventListener('change', () => { st.view = select.value; request([key]); });
    label.append('Widok', select);
    head.append(title, label);
    const grid = document.createElement('div');
    grid.className = 'grid';
    root.append(head, grid);
    LEVELS.forEach((level, i) => {
      const fig = document.createElement('figure');
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.width = `${W}px`; tile.style.height = `${H}px`;
      const cap = document.createElement('figcaption');
      cap.style.width = `${W}px`;
      fig.append(tile, cap);
      grid.append(fig);
      st.tiles.push({ st, level, index: sections.length * LEVELS.length + i, tile, cap, res: null });
    });
    sections.push(st);
  }
  $('legend').textContent = `Kafel ${W}×${H} px, tło Canvas w gęstości ${DENSITY}, bez nieba SVG (gwiazdy, chmury) i opadów. Linie przerywane: granice pasa dioramy `
    + `(${SE_INSETS.top} px od góry, ${SE_INSETS.bottom} px od dołu). Na czerwono: emblemat < ${MIN_EMBLEM_PX} px, działka < ${MIN_LOT_PX} px, `
    + `ponad ${EL_BUDGET} elementów albo ponad ${MAX_ANIM} animacji. Pora dnia, pogoda i pora roku dotyczą Ziemi; ostatni kafel to zawsze noc, zima, śnieg i choinka.`;
}

// Id w <defs> mają przedrostek d- i w grze jest jedna diorama na dokument; w galerii jest ich wiele, więc każdy kafel dostaje własny.
const unique = (svg, k) => svg.replace(/(id="|url\(#)d-/g, `$1d-t${k}-`);
const layer = (cls, viewBox, body) => `<svg class="${cls}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;

function paint(t, bdCache) {
  const { st, level } = t, { model, bd } = tileModel(st, level), rec = recipeFor(st.view);
  // trzy przebiegi, mediana — pojedynczy pomiar za bardzo zależy od obciążenia komputera
  const runs = [];
  let d;
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    d = buildDiorama(model);
    runs.push(performance.now() - t0);
  }
  const ms = runs.sort((a, b) => a - b)[1];
  const f = frameFor(d.bbox, { w: W, h: H }, SE_INSETS);
  if (!f) throw new Error('zerowy kadr');
  // Tło liczymy raz na etap i parę (widok, pora dnia, pogoda); kafle kopiują gotowy obraz.
  const key = `${st.view}|${bd.phase}|${bd.weather}`;
  if (!bdCache.has(key)) bdCache.set(key, renderLocal(st.view, bd, W * DENSITY, H * DENSITY));
  const src = bdCache.get(key), canvas = document.createElement('canvas');
  canvas.width = src.width; canvas.height = src.height;
  canvas.getContext('2d').drawImage(src, 0, 0);
  const sky = skyline(st.view, { w: W, h: H }, { light: model.light, phase: model.env.phase, horizon: rec.horizon || 0.86 }).svg;
  const vb = viewBoxAttr(f), box = `0 0 ${W} ${H}`, k = t.index;
  const edge = (y) => `<line class="shade" x1="0" x2="${W}" y1="${y}" y2="${y}"/><line class="edge" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`;
  t.tile.replaceChildren(canvas);
  t.tile.insertAdjacentHTML('beforeend', layer('sky', box, unique(sky, k)) + layer('front', vb, unique(d.front, k)) + layer('frontAnim', vb, unique(d.frontAnim, k))
    + layer('band', box, edge(SE_INSETS.top) + edge(H - SE_INSETS.bottom)));
  // Odczyty: najmniejszy emblemat (średnica) i najmniejsza działka (szerokość obrysu) w px sceny.
  const emblem = Math.min(...d.lots.map((l) => 2 * l.emblem.r * f.scale)), lot = Math.min(...d.lots.map((l) => l.foot * f.scale)), s = d.stats;
  const red = { emblem: emblem < MIN_EMBLEM_PX, lot: lot < MIN_LOT_PX, elements: s.elements > EL_BUDGET, anim: s.anim > MAX_ANIM };
  t.res = { emblem, lot, ms, bad: Object.values(red).some(Boolean) };
  const chip = (text, bad) => `<span${bad ? ' class="bad"' : ''}>${text}</span>`;
  const n = model.depts.length, nText = level.n === 'max' ? `wszystkie ${n} ${deptWord(n)}` : `${n} ${deptWord(n)}`;
  t.cap.innerHTML = `<div class="t1"><b>${nText}</b><span class="tag">próg ${level.tier} · rundy ${level.rounds}${level.festive ? ' · święta, zima, noc' : ''}</span></div>`
    + `<div class="t2">${chip(`skala ${num(f.scale, 2)}`)}${chip(`emblemat ${num(emblem, 1)} px`, red.emblem)}${chip(`działka ${num(lot, 1)} px`, red.lot)}`
    + `${chip(`elementy ${s.elements}`, red.elements)}${chip(`animacje ${s.anim}`, red.anim)}${chip(`${num(ms, ms < 10 ? 1 : 0)} ms`)}</div>`
    + `<div class="t3">ludzie ${s.people} · pojazdy ${s.vehicles} · ${esc(s.base)}, ${esc(s.material)} · ozdoby: ${esc(s.ornaments.join(', ') || 'brak')} · dekoracje: ${esc(s.decor.join(', ') || 'brak')}</div>`;
}

function fail(t, err) {
  t.res = { error: true, bad: true };
  t.tile.replaceChildren();
  t.cap.innerHTML = '<div class="t2"><span class="bad">błąd budowy (szczegóły w konsoli)</span></div>';
  console.error(`${t.st.key}/${t.st.view}`, err);
}

function summarize(busy) {
  const done = sections.flatMap((st) => st.tiles).filter((t) => t.res), ok = done.filter((t) => !t.res.error);
  const bad = done.filter((t) => t.res.bad).length, ms = ok.map((t) => t.res.ms);
  const el = $('summary');
  el.textContent = `${busy ? 'liczę… ' : ''}${done.length}/${sections.length * LEVELS.length} kafli`
    + (ok.length ? ` · emblemat min ${num(Math.min(...ok.map((t) => t.res.emblem)), 1)} px · działka min ${num(Math.min(...ok.map((t) => t.res.lot)), 1)} px · budowa najdłużej ${num(Math.max(...ms), 1)} ms` : '')
    + ` · na czerwono: ${bad}`;
  el.classList.toggle('bad', bad > 0);
}

// Kolejka etapów do przeliczenia: zmiana ustawień w trakcie liczenia dopisuje etap ponownie i przerywa bieżący przebieg.
const dirty = new Set();
let running = false;
function request(keys) {
  keys.forEach((k) => dirty.add(k));
  if (!running) pump();
}
async function pump() {
  running = true;
  while (dirty.size) {
    const key = dirty.values().next().value;
    dirty.delete(key);
    const st = sections.find((s) => s.key === key);
    if (!st) continue;
    const bdCache = new Map();
    for (const t of st.tiles) {
      await nextFrame();
      if (dirty.has(key)) break;
      try { paint(t, bdCache); } catch (err) { fail(t, err); }
      summarize(true);
    }
  }
  running = false;
  summarize(false);
}

build();
$('anim').addEventListener('change', () => document.body.classList.toggle('paused', !$('anim').checked));
// Pora dnia, pogoda i pora roku zmieniają tylko Ziemię; święto także pozostałe etapy.
for (const id of ['phase', 'weather', 'season']) $(id).addEventListener('change', () => request(['earth']));
$('holiday').addEventListener('change', () => request(LAYER_ORDER));
request(LAYER_ORDER);
