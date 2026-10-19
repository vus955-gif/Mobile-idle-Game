// Ziemia: siedziba (dział dev) rośnie z działami: garaż → biuro → wieżowiec → kampus. Części od rogu obrysu z coreFoot;
// działki przed rdzeniem z emblematami zasłaniają dół, więc tabliczki i ozdoby rund są wysoko.
import { PALETTES } from './parts.js';

const coreForm = (n) => (n > 8 ? 'campus' : n > 4 ? 'tower' : n > 1 ? 'office' : 'garage');
// Dach wieży: rośnie z działami, od 4. rundy o pół poziomu; sufit to czytelność Ziemi na iPhonie SE.
const roofH = (n, r) => Math.min(6.5, 4.6 + 0.15 * n + (r > 3) * 0.5);
const coreFoot = (n) => {
  const w = n > 4 ? 3 : 2;
  return { w, d: w, h: n > 4 ? 1.25 : n > 1 ? 4 + n / 4 : 1.3 };
};

const B = (...a) => ['box', ...a];
const when = (on, parts) => (on ? parts : []);
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

const FORMS = {
  // Garaż: otwarta brama ze światłem, biurko z laptopem, roślina.
  garage: (o) => [
    ...when(o.solar, [['panel', 2.35, -0.65, 0.1, 0.7, 0.9]]),
    B(0, 0, 0, 2, 2, 1.3, 'wall'), B(2, 0.15, 0.4, 0.03, 0.45, 0.45, 'glass', 'flush'), B(0.25, 2, 0, 1.3, 0.04, 1, 'dark', 'flush'),
    ['glow', 0.9, 2.06, 0.6, 0.17, 'wall'], B(0.2, 2, 0.92, 1.4, 0.07, 0.14, 'metal', 'flush'),
    ['gable', -0.1, -0.1, 1.3, 2.2, 2.2, 0.8, 'roof', 'y'], ...when(o.dish, [['dish', 1.75, 0.2, 1.5, 0.24]]),
    B(0.5, 2.12, 0, 0.8, 0.28, 0.3, 'wall2'), B(0.75, 2.2, 0.3, 0.3, 0.03, 0.18, 'crystal', 'flush'),
    ['cyl', 2.3, 2.3, 0, 0.12, 0.22, 'roof'], ['dome', 2.3, 2.3, 0.22, 0.2, 'green'],
    ...when(o.helipad, heli(3, 1.9, 0)), ['sign', 1, 1, 2.1], ['label', 1, 2.1, 1.62, 3.2, 22], ...neon(o, 1.75, 0.9, 1.85),
  ],
  // Biuro: przeszklony hol, piętra, klimatyzatory, tabliczka na attyce.
  office: (o, n, r, H = 4 + n / 4) => [
    B(0, 0, 0, 2, 2, 1, 'glass', 'win'), B(0.7, 2, 0, 0.6, 0.03, 0.75, 'dark', 'flush'), B(0, 0, 1, 2, 2, H - 1, 'wall', 'win ledge'),
    ...when(o.solar, [['panel', 0.12, 0.12, H, 0.7, 0.55]]), B(1.3, 0.2, H, 0.4, 0.35, 0.25, 'metal'), B(0.2, 0.95, H, 0.35, 0.35, 0.25, 'metal'),
    ...when(o.helipad, heli(1.05, 1.05, H)), ...when(o.dish, [['dish', 0.3, 1.7, H, 0.22]]),
    ['sign', 1, 1, H + 0.3], ['label', 2, 2, H + 0.3, 3.4, 26], ...neon(o, 1.75, 0.3, H + 0.55),
  ],
  tower: (o, n, r) => [...podium(0, 3), ...tower(o, 1.5, 1.5, roofH(n, r))],
  // Skrzydło i kładka ponad emblematami działek; plac z fontanną przed holem, poza obrysem.
  campus: (o, n, r, x = 3.7) => [
    B(x - 0.65, x - 0.65, 0, 1.3, 1.3, 0.02, 'wall2', 'flush'),
    B(0, 0.2, 0, 0.9, 2.4, 3.1, 'glass', 'win'), B(0, 0.2, 3.1, 0.9, 2.4, 0.15, 'wall', 'ledge'), B(0.1, 0.3, 3.25, 0.7, 2.2, 0.08, 'green'),
    ...podium(1.35, 1.65), B(0.9, 1.72, 2.75, 0.65, 0.33, 0.32, 'glass'), ...tower(o, 2.2, 1.35, roofH(n, r)),
    ['cyl', x, x, 0, 0.42, 0.12, 'wall2'], ['cyl', x, x, 0.1, 0.34, 0.02, 'glass'], ['glow', x, x, 0.4, 0.1, 'crystal'],
  ],
};

const ORN = [[1, 'solar'], [2, 'neon'], [3, 'helipad'], [5, 'dish'], [8, 'rocket']];

// Neon to „◆ pierwsze słowo nazwy”, rakieta stoi w prawym rogu wyspy (bez działek); w garażu 1–3 osoby.
function core(m, lay) {
  const n = m.depts.length, r = m.rounds, f = coreForm(n), ornaments = ORN.filter(([k]) => r >= k).map(([, id]) => id);
  // o[id] prawdziwe dla ozdób rundy; o.neon to tekst neonu.
  const o = Object.fromEntries(ornaments.map((id) => [id, `◆ ${String(m.company ?? '').trim().split(/\s+/)[0]}`]));
  const k = Math.min(3, lay.size / 2 - 0.6), x = k - lay.core.gx, y = -k - lay.core.gy;
  return {
    parts: [...when(o.rocket, [
      ['cyl', x, y, 0, 0.42, 0.1, 'metal'], B(x - 0.3, y - 0.04, 0.1, 0.6, 0.08, 0.5, 'roof'), B(x - 0.04, y - 0.3, 0.1, 0.08, 0.6, 0.5, 'roof'),
      ['cyl', x, y, 0.1, 0.16, 2, 'wall'], ['dome', x, y, 2.1, 0.16, 'roof'], ['glow', x + 0.12, y + 0.12, 1.5, 0.05, 'crystal'],
    ]), ...FORMS[f](o, n, r)],
    ornaments, people: f === 'garage' ? Math.min(3, 1 + Math.floor(m.firstHeads / 3)) : undefined,
  };
}

export const EARTH_ART = { id: 'earth', palette: PALETTES.earth, coreForm, coreFoot, core };
