// Ziemia: siedziba (dział dev) rośnie z działami: garaż → biuro → wieżowiec → kampus; wokół budynki działów, drzewa, droga, auta i drony.
// Części od rogu obrysu; działki przed rdzeniem z emblematami zasłaniają dół, więc tabliczki i ozdoby rund są wysoko.
import { PALETTES, CREW, SIDE_ART, B, C, S, F, when, drive, tree, seeded } from './parts.js';
import { iso, pt, tones } from './iso.js';
import { LAYERS } from '../layers.js';

const coreForm = (n) => (n > 8 ? 'campus' : n > 4 ? 'tower' : n > 1 ? 'office' : 'garage');
// Dach wieży: rośnie z działami, od 4. rundy o pół poziomu; sufit to czytelność Ziemi na iPhonie SE.
const roofH = (n, r) => Math.min(6.5, 4.6 + 0.15 * n + (r > 3) * 0.5);
const coreFoot = (n) => {
  const w = n > 4 ? 3 : 2;
  return { w, d: w, h: n > 4 ? 1.25 : n > 1 ? 4 + n / 4 : 1.3 };
};

const heli = (x, y, z) => [['cyl', x, y, z, 0.4, 0.05, 'dark'], ['ring', x, y, z + 0.05, 0.27, 'wall', 'flat']];
const neon = (o, x, y, z, w = 1.7) => when(o.neon, [['label', x, y, z, w, 10, o.neon, '#c4b5fd']]);

// Wieża o środku (cx, cy): trzon, uskok z tabliczką i neonem, korona z iglicą albo lądowiskiem, maszt.
const tower = (o, cx, cy, R) => {
  const L = 0.725 + 0.42 * R, T = R + 0.2, q = (s, z, h, m, f) => B(cx - s / 2, cy - s / 2, z, s, s, h, m, f);
  return [
    q(1.4, 1.25, L - 1.25, 'wall', 'win'), q(1, L, R - L, 'glass', 'win'),
    ...when(o.solar, [['panel', cx - 0.68, cy + 0.52, L, 1.36, 0.15], ['panel', cx + 0.52, cy - 0.68, L, 0.15, 1.2]]),
    q(1.1, R, 0.2, 'accent'), ...(o.helipad ? heli(cx, cy, T) : [['pyr', cx - 0.45, cy - 0.45, T, 0.9, 0.9, 0.7, 'metal']]),
    ...when(o.dish, [['dish', cx - 0.36, cy + 0.36, T, 0.2]]), ['mast', cx + 0.38, cy - 0.38, T, 1.4], ['sign', cx, cy, R + 0.7],
    ['label', cx + 0.5, cy + 0.5, R - 0.45, 3.8, 26], ...neon(o, cx + 0.5, cy + 0.5, R - 1.2, 2.3),
  ];
};
const podium = (x, w) => [B(x, 0, 0, w, 3, 1, 'glass', 'win'), B(x, 0, 1, w, 3, 0.25, 'wall2', 'ledge')];
const TC = { tower: [1.5, 1.5], campus: [2.2, 1.35] }; // środek wieży

const FORMS = {
  // Garaż: otwarta brama ze światłem, biurko z laptopem, roślina.
  garage: (o) => [
    ...when(o.solar, [['panel', 2.35, -0.65, 0.1, 0.7, 0.9]]),
    B(0, 0, 0, 2, 2, 1.3, 'wall'), B(2, 0.15, 0.4, 0.03, 0.45, 0.45, 'glass', F), B(0.25, 2, 0, 1.3, 0.04, 1, 'dark', F),
    ['glow', 0.9, 2.06, 0.6, 0.17, 'wall'], B(0.2, 2, 0.92, 1.4, 0.07, 0.14, 'metal', F),
    ['gable', -0.1, -0.1, 1.3, 2.2, 2.2, 0.8, 'roof', 'y'], ...when(o.dish, [['dish', 1.75, 0.2, 1.5, 0.24]]),
    B(0.5, 2.12, 0, 0.8, 0.28, 0.3, 'wall2'), B(0.75, 2.2, 0.3, 0.3, 0.03, 0.18, 'crystal', F),
    ['cyl', 2.3, 2.3, 0, 0.12, 0.22, 'roof'], ['dome', 2.3, 2.3, 0.22, 0.2, 'green'],
    ...when(o.helipad, heli(3, 1.9, 0)), ['sign', 1, 1, 2.1], ['label', 1, 2.1, 1.62, 3.2, 22], ...neon(o, 1.75, 0.9, 1.85),
  ],
  // Biuro: przeszklony hol, piętra, klimatyzatory, tabliczka na attyce.
  office: (o, n, r, H = 4 + n / 4) => [
    B(0, 0, 0, 2, 2, 1, 'glass', 'win'), B(0.7, 2, 0, 0.6, 0.03, 0.75, 'dark', F), B(0, 0, 1, 2, 2, H - 1, 'wall', 'win ledge'),
    ...when(o.solar, [['panel', 0.12, 0.12, H, 0.7, 0.55]]), B(1.3, 0.2, H, 0.4, 0.35, 0.25, 'metal'), B(0.2, 0.95, H, 0.35, 0.35, 0.25, 'metal'),
    ...when(o.helipad, heli(1.05, 1.05, H)), ...when(o.dish, [['dish', 0.3, 1.7, H, 0.22]]),
    ['sign', 1, 1, H + 0.3], ['label', 2, 2, H + 0.3, 3.4, 26], ...neon(o, 1.75, 0.3, H + 0.55),
  ],
  tower: (o, n, r) => [...podium(0, 3), ...tower(o, ...TC.tower, roofH(n, r))],
  // Skrzydło i kładka ponad emblematami działek; plac z fontanną przed holem, poza obrysem.
  campus: (o, n, r, x = 3.7) => [
    B(x - 0.65, x - 0.65, 0, 1.3, 1.3, 0.02, 'wall2', F),
    B(0, 0.2, 0, 0.9, 2.4, 3.1, 'glass', 'win'), B(0, 0.2, 3.1, 0.9, 2.4, 0.15, 'wall', 'ledge'), B(0.1, 0.3, 3.25, 0.7, 2.2, 0.08, 'green'),
    ...podium(1.35, 1.65), B(0.9, 1.72, 2.75, 0.65, 0.33, 0.32, 'glass'), ...tower(o, ...TC.campus, roofH(n, r)),
    ['cyl', x, x, 0, 0.42, 0.12, 'wall2'], ['cyl', x, x, 0.1, 0.34, 0.02, 'glass'], ['glow', x, x, 0.4, 0.1, 'crystal'],
  ],
};

const ORN = [[1, 'solar'], [2, 'neon'], [3, 'helipad'], [5, 'dish'], [8, 'rocket']];
// Rakieta stoi w prawym rogu wyspy, w komórce siatki bez działek.
const rocketAt = (lay) => { const k = Math.min(3, lay.size / 2 - 0.6); return [k, -k]; };

// Neon to „◆ pierwsze słowo nazwy”; w garażu 1–3 osoby. Lampki świąteczne wieży wiszą wysoko (dół zasłaniają działki).
function core(m, lay) {
  const n = m.depts.length, r = m.rounds, f = coreForm(n), ornaments = ORN.filter(([k]) => r >= k).map(([, id]) => id);
  // o[id] prawdziwe dla ozdób rundy; o.neon to tekst neonu.
  const o = Object.fromEntries(ornaments.map((id) => [id, `◆ ${String(m.company ?? '').trim().split(/\s+/)[0]}`]));
  const [rx, ry] = rocketAt(lay), x = rx - lay.core.gx, y = ry - lay.core.gy, t = TC[f], R = roofH(n, r);
  return {
    parts: [...when(o.rocket, [
      ['cyl', x, y, 0, 0.42, 0.1, 'metal'], B(x - 0.3, y - 0.04, 0.1, 0.6, 0.08, 0.5, 'roof'), B(x - 0.04, y - 0.3, 0.1, 0.08, 0.6, 0.5, 'roof'),
      ['cyl', x, y, 0.1, 0.16, 2, 'wall'], ['dome', x, y, 2.1, 0.16, 'roof'], ['glow', x + 0.12, y + 0.12, 1.5, 0.05, 'crystal'],
    ]), ...FORMS[f](o, n, r)],
    ornaments, people: f === 'garage' ? Math.min(3, 1 + Math.floor(m.firstHeads / 3)) : undefined,
    // Przednie krawędzie korony i szczytu trzonu (L jak w tower); w kampusie prawą krawędź trzonu zasłania emblemat rnd.
    lights: t && [[0.6, R + 0.2, 1], [0.7, 0.725 + 0.42 * R, f === 'tower']]
      .map(([e, z, right]) => [[t[0] - e, t[1] + e, z], [t[0] + e, t[1] + e, z], ...when(right, [[t[0] + e, t[1] - e, z]])]),
  };
}

// Budynki działów na działce 1×1, emblemat ≤ 3 poziomy. W kolumnie ekranu (tylny/przedni: rnd/security, design/board, marketing/support,
// sales/hr, devops/data, finance/legal) emblemat przedniego zasłania środek tylnego, więc tylne są wyższe i wyróżnik mają u góry.
const DEPTS = {
  // Laboratorium: kopuła obserwacyjna, rury na ścianie.
  rnd: [B(0.08, 0.1, 0, 0.84, 0.8, 1.7, 'wall', 'win'), B(0.05, 0.07, 1.7, 0.9, 0.86, 0.1, 'wall2'), C(0.5, 0.5, 1.8, 0.33, 0.12, 'metal'),
    ['dome', 0.5, 0.5, 1.92, 0.33, 'accent'], C(0.96, 0.3, 0, 0.045, 1.85, 'metal'), C(0.96, 0.62, 0, 0.045, 1.85, 'metal'), S(2.75)],
  // Szklany sześcian w kolorowe pasy na węższym cokole.
  design: [B(0.24, 0.24, 0, 0.52, 0.52, 1.15, 'wall2', 'win'), B(0.1, 0.1, 1.15, 0.8, 0.8, 1.45, 'glass', 'win flush'),
    ...[['accent', 0.18], ['crystal', 0.42], ['roof', 0.66]].flatMap(([m, u]) => [B(u, 0.9, 1.15, 0.1, 0.03, 1.45, m, F), B(0.9, 0.82 - u, 1.15, 0.03, 0.1, 1.45, m, F)]),
    B(0.08, 0.08, 2.6, 0.84, 0.84, 0.08, 'wall'), S(2.75)],
  // Niski budynek z wielkim ekranem na dachu (poświata świeci też nocą).
  marketing: [B(0.06, 0.1, 0, 0.88, 0.8, 1.2, 'wall2', 'win'), B(0.2, 0.3, 1.2, 0.05, 0.05, 0.45, 'metal'), B(0.75, 0.3, 1.2, 0.05, 0.05, 0.45, 'metal'),
    B(0.06, 0.22, 1.6, 0.88, 0.1, 0.9, 'dark'), B(0.1, 0.32, 1.65, 0.8, 0.02, 0.8, 'accent', F), ['glow', 0.5, 0.34, 2.05, 0.22, 'accent'], S(2.6, 0.27)],
  // Dwupoziomowy biurowiec z przeszklonym wejściem, flagi na masztach w narożnikach (widać je zza emblematu hr).
  sales: [B(0.12, 0.08, 0, 0.76, 0.72, 2.2, 'wall', 'win ledge'), B(0.36, 0.8, 0, 0.28, 0.03, 0.8, 'glass', F), B(0.3, 0.8, 0.8, 0.4, 0.15, 0.05, 'accent', F),
    B(0.02, 0.94, 0, 0.03, 0.03, 2.5, 'metal', F), B(0.05, 0.945, 2.12, 0.3, 0.02, 0.34, 'accent', F),
    B(0.94, 0.02, 0, 0.03, 0.03, 2.5, 'metal', F), B(0.945, 0.05, 2.12, 0.02, 0.3, 0.34, 'crystal', F), S(2.55, 0.44)],
  // Budynek z anteną: talerz i maszt (niski, w prawym rogu dachu, żeby lampka nie migała na emblemacie).
  support: [B(0.1, 0.1, 0, 0.8, 0.8, 1.4, 'wall', 'win'), B(0.08, 0.08, 1.4, 0.84, 0.84, 0.12, 'accent'), ['dish', 0.32, 0.66, 1.52, 0.24],
    ['mast', 0.82, 0.18, 1.52, 0.7], S(1.9)],
  // Pawilon z zielonym dachem i drzewkami.
  hr: [B(0.05, 0.12, 0, 0.9, 0.76, 1, 'glass', 'win'), B(0.36, 0.86, 0, 0.28, 0.03, 0.7, 'accent', F), B(0.02, 0.09, 1, 0.96, 0.82, 0.1, 'wall'),
    B(0.06, 0.13, 1.1, 0.88, 0.74, 0.04, 'green'), ...[[0.28, 0.35], [0.7, 0.38], [0.48, 0.7]].map(([u, v]) => ['dome', u, v, 1.14, 0.14, 'green']), S(1.8)],
  // Hala serwerowni z pasami diod i rzędem chłodnic.
  devops: [B(0.04, 0.1, 0, 0.92, 0.8, 2.1, 'dark', 'win'), ...[0.55, 1.45].flatMap((z) => [B(0.04, 0.9, z, 0.92, 0.02, 0.07, 'accent', F), B(0.96, 0.1, z, 0.02, 0.8, 0.07, 'accent', F)]),
    ...[0.1, 0.38, 0.66].flatMap((u) => [B(u, 0.28, 2.1, 0.24, 0.44, 0.2, 'metal'), C(u + 0.12, 0.5, 2.3, 0.08, 0.02, 'dark')]), S(2.55)],
  // Smukła wieża ze złotego szkła.
  finance: [B(0.15, 0.15, 0, 0.7, 0.7, 0.45, 'wall', 'ledge'), B(0.25, 0.25, 0.45, 0.5, 0.5, 2.15, 'accent', 'win'), B(0.22, 0.22, 2.6, 0.56, 0.56, 0.08, 'metal'),
    ['pyr', 0.3, 0.3, 2.68, 0.4, 0.4, 0.3, 'metal'], S(3)],
  // Centrum danych: dwa silosy z diodami.
  data: [B(0.06, 0.06, 0, 0.88, 0.88, 0.45, 'wall2', 'ledge'), ...[[0.3, 0.7], [0.7, 0.3]].flatMap(([u, v]) => [C(u, v, 0.45, 0.2, 1.15, 'metal'),
    C(u, v, 1, 0.205, 0.12, 'accent'), ['dome', u, v, 1.6, 0.2, 'metal'], ['glow', u + 0.13, v + 0.13, 0.8, 0.035, 'crystal']]), S(2.05)],
  // Gmach z kolumnadą i trójkątnym frontonem.
  legal: [B(0.02, 0.02, 0, 0.96, 0.96, 0.15, 'wall2'), B(0.12, 0.08, 0.15, 0.76, 0.62, 1.25, 'wall2'),
    ...[0.16, 0.39, 0.62, 0.85].map((u) => C(u, 0.86, 0.15, 0.055, 1.25, 'wall')), ...[0.16, 0.39, 0.62].map((v) => C(0.86, v, 0.15, 0.055, 1.25, 'wall')),
    B(0.04, 0.04, 1.4, 0.92, 0.92, 0.14, 'wall'), ['gable', 0.04, 0.04, 1.54, 0.92, 0.92, 0.5, 'accent', 'y'], S(2.2)],
  // Bunkier z radarem za niskim murem.
  security: [B(0.14, 0.14, 0, 0.7, 0.7, 0.75, 'dark'), ['pyr', 0.14, 0.14, 0.75, 0.7, 0.7, 0.2, 'dark'], B(0.3, 0.84, 0.45, 0.4, 0.02, 0.08, 'crystal', F),
    B(0.42, 0.84, 0, 0.16, 0.02, 0.35, 'accent', F), ['dish', 0.5, 0.5, 0.95, 0.26], B(0, 0.95, 0, 1, 0.05, 0.28, 'wall2'), B(0.95, 0, 0, 0.05, 0.95, 0.28, 'wall2'), S(1.6)],
  // Szklana rotunda z tarasem na dachu.
  board: [C(0.5, 0.5, 0, 0.44, 1.4, 'glass', 'win'), C(0.5, 0.5, 1.4, 0.46, 0.12, 'accent'), C(0.5, 0.5, 1.52, 0.42, 0.03, 'wall'),
    ['dome', 0.34, 0.44, 1.55, 0.12, 'green'], ['dome', 0.64, 0.38, 1.55, 0.12, 'green'], ['ring', 0.5, 0.5, 1.68, 0.42, 'metal', 'flat'], S(1.95)],
};

// Miejsca na wyspie w kafelkach: rakieta w prawym rogu, plac przed rdzeniem, droga wzdłuż lewej przedniej krawędzi i drzewa
// na wolnych polach (brzeg najpierw) — nie na działkach odblokowanych działów, nie na ścieżkach i nie na ekranie budynków.
function site(m, lay) {
  const n = m.depts.length, f = coreForm(n), h = lay.size / 2, c = lay.core, t = TC[f], rocket = rocketAt(lay);
  const plaza = [c.gx + c.w, c.gy + c.d, c.gx + c.w + 2, c.gy + c.d + 2], road = [-h, h - 0.34, h, h - 0.04];
  const on = new Set(m.depts.map((d) => d.id)), D = LAYERS.earth.DEPTS, R = (x, y, w, d, z) => [c.gx + x, c.gy + y, c.gx + x + w, c.gy + y + d, z];
  // Budynki: [x0, y0, x1, y1, wysokość]; garaż ma ozdoby na ziemi z prawej (panele, lądowisko), wieża stoi na podium, kampus ma skrzydło.
  const blds = [R(0, 0, c.w, c.d, f === 'garage' ? 2.2 : c.h), ...when(f === 'garage', [R(2, -0.8, 1.5, 3.3, 0.4)]),
    ...(t ? [R(t[0] - 0.7, t[1] - 0.7, 1.4, 1.4, roofH(n, m.rounds) + 1)] : []), ...when(f === 'campus', [R(0, 0.2, 0.9, 2.4, 3.3)]),
    ...lay.lots.filter((_, i) => on.has(D[i + 1].id)).map((r) => [r.gx, r.gy, r.gx + r.w, r.gy + r.d, 3])];
  const far = (p, [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - p[0], 0, p[0] - x1), Math.max(y0 - p[1], 0, p[1] - y1));
  // Drzewo (kolumny ekranu c ± 0,37 kafelka, wys. 19) rysujemy pod budynkami, więc przed budynkiem nie może na niego wchodzić,
  // a za budynkiem nie może być całkiem schowane; lo i hi to przednia krawędź podstawy i tylna krawędź dachu na ekranie.
  const bad = ([px, py]) => blds.some(([x0, y0, x1, y1, z]) => [-0.37, 0, 0.37].some((u, i) => {
    const c = px - py + u, y = (px + py) * 10;
    if (c <= x0 - y1 || c >= x1 - y0) return false;
    const lo = Math.min(c + 2 * y1, 2 * x1 - c) * 10;
    return y > lo ? y - 19 < lo + 3 : i === 1 && y - 19 > Math.max(2 * x0 - c, c + 2 * y0) * 10 - z * 12 - 4;
  }));
  // Kandydaci co 0,5 kafelka od brzegu wyspy (trzecia liczba to odległość od brzegu), odstęp między drzewami ≥ 0,7.
  const trees = [], cand = [];
  for (let i = 0.35 - h; i < h - 0.3; i += 0.5) for (let j = 0.35 - h; j < h - 0.3; j += 0.5) cand.push([i, j, h - Math.max(Math.abs(i), Math.abs(j))]);
  cand.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  for (const p of cand) {
    if (trees.length >= 10) break;
    if (Math.min(Math.abs(p[0]), Math.abs(p[1])) < 0.45 || Math.hypot(p[0] - rocket[0], p[1] - rocket[1]) < 1) continue;
    if (far(p, road) < 0.3 || far(p, plaza) < 0.25 || trees.some((t) => Math.hypot(t[0] - p[0], t[1] - p[1]) < 0.7) || blds.some((b) => far(p, b) < 0.3) || bad(p)) continue;
    trees.push([p[0], p[1]]);
  }
  return { rocket, plaza, road, trees };
}

// Wyspa: drzewa według pory roku i droga z autami (pod budynkami), drony nad działami (omijają koła emblematów `marks`;
// box obejmuje drony w kadrze).
function extras(m, lay, marks = []) {
  const { env, light, depts } = m, n = depts.length, s = site(m, lay), h = lay.size / 2, anim = [], decor = [];
  if (env.snowCover) decor.push('snow');
  if (s.trees.length && env.season === 'spring') decor.push('blossom');
  if (s.trees.length && env.season === 'autumn') decor.push('leaves');
  const P = (x, y) => pt(iso(x, y)), [, y0, , y1] = s.road, ym = (y0 + y1) / 2;
  let back = `<path d="M${P(-h, y0)}L${P(h, y0)}L${P(h, y1)}L${P(-h, y1)}Z" fill="${tones('#5d6372', light).top}"/>`
    + `<path d="M${P(-h, ym)}L${P(h, ym)}" stroke="#f1ead2" stroke-opacity=".6" stroke-width=".7" stroke-dasharray="4 4"/>`;
  back += [...s.trees].sort((a, b) => a[0] + a[1] - b[0] - b[1]).map(([x, y], i) => tree(...iso(x, y), 0.46, seeded(i + 3), env.season)).join('');
  const cars = (n >= 2) + (n >= 6) + (n >= 10);
  for (let i = 0; i < cars; i++) {
    anim.push(drive({ gx: -h, gy: y1 - 0.06, axis: 'x', len: 2 * h }, `<g transform="scale(.5)">${SIDE_ART.car(['#ff6b6b', '#4dabf7', '#ffd166'][i])}</g>`,
      { dur: 10 + i * 1.7, delay: -i * 3.9, id: `car${i}` }));
  }
  // Drony (CREW.vehicles działu, łącznie ≤ 4): najpierw po jednym na dział, potem drugie; dron stoi przy emblemacie swojego działu,
  // w pierwszym wolnym miejscu z dala od wszystkich kół i dronów.
  const spots = [[23, 14], [-23, 14], [25, -4], [-25, -4], [0, -31]], used = [];
  for (const k of [1, 2]) for (const d of depts) {
    const e = marks.find((q) => q.id === d.id);
    if (!e || CREW[d.tier].vehicles < k || used.length >= 4) continue;
    const p = spots.map(([u, v]) => [Math.round(e.x + u), Math.round(e.y + v)])
      .find(([x, y]) => marks.every((q) => Math.hypot(x - q.x, y - q.y) >= q.r + 8) && used.every((u) => Math.hypot(x - u[0], y - u[1]) >= 16));
    if (!p) continue;
    used.push(p);
    anim.push(`<g transform="translate(${p[0]} ${p[1]})"><g class="person" style="animation-delay:${(used.length * 0.4).toFixed(1)}s">`
      + `<path d="M-7 0h14" stroke="#3a3f55" stroke-width="1.2"/><ellipse cx="-7" cy="-1.3" rx="3.6" ry="1" fill="#dfe7f1" opacity=".85"/>`
      + `<ellipse cx="7" cy="-1.3" rx="3.6" ry="1" fill="#dfe7f1" opacity=".85"/><rect x="-3" y="-1.6" width="6" height="3.4" rx="1.5" fill="${d.color}"/>`
      + `<circle class="blink" cx="0" cy="2.6" r="1.1" fill="${used.length % 2 ? '#ff4d4d' : '#4ade80'}"/></g></g>`);
  }
  const xs = used.map((q) => q[0]), ys = used.map((q) => q[1]);
  return { back, anim, decor, vehicles: cars + used.length, box: used.length && [Math.min(...xs) - 11, Math.min(...ys) - 4, Math.max(...xs) + 11, Math.max(...ys) + 4] };
}

export const EARTH_ART = { id: 'earth', palette: PALETTES.earth, coreForm, coreFoot, core, depts: DEPTS, extras, site };
