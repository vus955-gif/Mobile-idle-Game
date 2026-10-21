// Wszechświat: rdzeń (kartografowie) rośnie z działami: iskra kreacji → kryształowa iglica → cytadela z kręgami i portalem.
// Wokół na odłamku materii kręgi działów; obsadę pokazują świetliste drobiny. Rdzeń od rogu obrysu 2,5 × 2,5 (środek K).
import { PALETTES } from './parts.js';
import { TW, TH, LV, n as r1, pt } from './iso.js';
import { SLOTS } from './layout.js';

const K = 1.25, UP = 17 / 12; // środek obrysu; środek emblematu jest UP poziomu nad punktem sign
const coreForm = (n) => (n > 4 ? 'citadel' : n > 1 ? 'spire' : 'spark');
// Wierzchołek iglicy rośnie z działami (rundy dokładają pierścienie, nie wysokość: emblematy na SE).
const top = (n) => (n > 4 ? 4.4 + 0.15 * n : 3.4 + 0.3 * n);
const coreFoot = (n) => ({ w: 2.5, d: 2.5, h: n > 1 ? top(n) : 2.2 });

const B = (...a) => ['box', ...a], C = (...a) => ['cyl', ...a], S = (z) => ['sign', 0.5, 0.5, z], L = (...a) => ['strut', ...a];
const G = (x, y, z, r, m = 'crystal') => ['glow', x, y, z, r, m], F = 'flush', when = (on, parts) => (on ? parts : []);
const ring = (z, r, m, pose = 'flat', u) => ['ring', K, K, z, r, m, pose, ...(u ? [{ u }] : [])];
const gem = (x, y, z, s, h, m = 'crystal') => ['pyr', x - s / 2, y - s / 2, z, s, s, h, m, F]; // kryształ bez własnego cienia

// Iskra: kryształy z odłamka, świecąca kula z halo i dwiema orbitami na krzyż, emblemat nad kulą.
const spark = (o) => [
  ...[[-0.7, -0.7, 1.5], [-0.95, 0.2, 1.1], [0.2, -0.95, 0.9]].map(([u, v, h]) => ['pyr', K + u - 0.17, K + v - 0.17, 0, 0.34, 0.34, h, 'crystal']),
  G(K, K, 1.9, 0.45), ...when(o.halo3, [ring(0.8, 1.25, 'wall2')]), ...when(o.halo2, [ring(1.3, 0.98, 'glass')]), ring(1.9, 0.62, 'roof'),
  ring(1.9, 0.8, 'metal', 'upright'), ring(1.9, 0.72, 'glass', 'upright', -1), ['sign', K, K, 3.3],
];

// Iglica: okrągła podstawa, bęben z oknami, kryształ z druzą i świecącym wierzchołkiem, halo. Cytadela dokłada iglice
// boczne, kręgi 1 + ⌊(n − 1)/3⌋ wokół bębna i portal nad szczytem z emblematem w środku.
const spire = (o, n, T) => {
  const cit = n > 4, R0 = cit ? 1.15 : 0.95, zc = 0.37 + 0.32 * T, zt = T - 1.6, P = T + 1.45, k = cit ? 1 + Math.floor((n - 1) / 3) : 0;
  return [
    ['shadow', K, K, 0, 0.75, T], ...when(cit, [gem(K - 0.75, K - 0.75, 0.37, 0.34, 1.9)]),
    C(K, K, 0, R0, 0.3, 'wall2', F), C(K, K, 0.3, R0 + 0.015, 0.07, 'accent', F), C(K, K, 0.37, 0.62, zc - 0.37, 'wall', 'win flush'),
    C(K, K, zc, 0.66, 0.08, 'metal', F), B(K - 0.28, K - 0.28, zc + 0.08, 0.56, 0.56, zt - zc - 0.08, 'glass', F), gem(K, K, zt, 0.56, T - zt, 'glass'),
    gem(K - 0.36, K + 0.2, zc + 0.08, 0.24, 0.85), gem(K + 0.2, K - 0.36, zc + 0.08, 0.24, 0.7),
    ...when(cit, [gem(K - 0.2, K + 0.82, 0.37, 0.34, 1.6), gem(K + 0.82, K - 0.2, 0.37, 0.34, 1.6)]),
    ...Array.from({ length: k }, (_, i) => ring(0.75 + 0.72 * i, 0.9, 'metal')),
    ...when(o.halo3, [ring(zt - 0.85, 1.2, 'wall2')]), ...when(o.halo2, [ring(zt - 0.3, 0.9, 'glass')]), ring(zt + 0.25, 0.62, 'roof'),
    G(K, K, T, 0.16),
    ...(cit ? [G(K, K, P, 0.28, 'glass'), ring(P, 0.8, 'roof', 'upright'), ['sign', K, K, P - UP]] : [['sign', K, K, T + 0.5]]),
  ];
};

const ORN = [[1, 'halo2'], [2, 'halo3'], [3, 'orbs'], [5, 'shards'], [8, 'portal2']];

function core(m, lay) {
  const n = m.depts.length, ornaments = ORN.filter(([q]) => m.rounds >= q).map(([, id]) => id), o = Object.fromEntries(ornaments.map((id) => [id, true]));
  const T = top(n), h = lay.size / 2, at = (u, v) => [u * h - lay.core.gx, v * h - lay.core.gy], parts = n > 1 ? spire(o, n, T) : spark(o), sign = parts.at(-1)[3];
  return {
    parts: [
      // Okruchy materii po bokach cytadeli nad emblematami tylnych kręgów; drugi portal wokół emblematu (w cytadeli płaski
      // pierścień na krzyż z portalem); kule światła nad wolnymi narożnikami; tabliczka „◆ NAZWA” na przednim narożniku odłamka.
      ...when(o.shards, [[2.95, -0.45, 5.5], [2.15, -0.25, 6.6], [-0.45, 2.95, 5], [-0.25, 2.15, 6.2]].map(([u, v, z]) => gem(u, v, z, 0.24, 0.5))),
      ...parts, ...when(o.portal2, [n > 4 ? ring(sign + UP, 0.95, 'glass') : ring(sign + UP, 0.8, 'glass', 'upright')]),
      ...when(o.orbs, [[0.8, -0.8, 2.2], [-0.8, 0.8, 2.6], [0.8, 0.8, 1.6]].map(([u, v, z]) => G(...at(u, v), z, 0.2, 'glass'))),
      ['label', ...at(1, 1), -0.45, 2.6, 24, `◆ ${String(m.company ?? '').trim()}`, PALETTES.universe.metal],
    ],
    ornaments,
    // Lampki świąteczne na przedniej połowie halo.
    lights: [Array.from({ length: 7 }, (_, i) => [K + 0.62 * Math.cos(i * 0.5236 - 0.785), K + 0.62 * Math.sin(i * 0.5236 - 0.785), n > 1 ? T - 1.35 : 1.9])],
  };
}

// Kręgi działów (działka 1×1, szczyt i emblemat ≤ 3 poziomy). W kolumnie ekranu (tył/przód: cosmologists/chrononauts,
// replicators/immortals, ambassadors/voidwalkers, brokers/tribunal) emblemat przedniego stoi najwyżej 0,5 poziomu wyżej.
const DEPTS = {
  // Iglica z orrery: bęben z oknami, iglica, orbita z planetami, słońce.
  cosmologists: [C(0.5, 0.5, 0, 0.4, 1, 'wall', 'win'), C(0.5, 0.5, 1, 0.42, 0.08, 'accent', F), ['pyr', 0.32, 0.32, 1.08, 0.36, 0.36, 1.4, 'wall2'],
    ['ring', 0.5, 0.5, 1.6, 0.44, 'metal', 'flat'], ...[[0.81, 0.81], [0.06, 0.5], [0.69, 0.11]].map(([u, v]) => G(u, v, 1.6, 0.05, 'accent')),
    G(0.5, 0.5, 2.5, 0.12), S(2.85)],
  // Kryształowy łuk-brama: sala z oknami, filary, łuk z poświatą w prześwicie, nadproże i kryształ.
  ambassadors: [B(0.1, 0.08, 0, 0.8, 0.4, 1, 'wall', 'win'), B(0.1, 0.6, 0, 0.2, 0.22, 1.3, 'wall2'), G(0.5, 0.71, 0.7, 0.16, 'glass'),
    ['ring', 0.5, 0.71, 0.82, 0.32, 'crystal', 'upright'], B(0.7, 0.6, 0, 0.2, 0.22, 1.3, 'wall2'), B(0.06, 0.58, 1.3, 0.88, 0.26, 0.14, 'accent'),
    gem(0.5, 0.71, 1.44, 0.26, 0.5), S(2.3)],
  // Ul z sześciokątnych kryształów: graniastosłupy z oknami i pasem, zakończone ostrzami.
  replicators: [...[[0.3, 0.32, 1.5, 0.2], [0.72, 0.3, 1.1, 0.18], [0.3, 0.74, 1, 0.18], [0.7, 0.7, 1.25, 0.2]].flatMap(([u, v, h, r]) => [
    C(u, v, 0, r, h, 'wall', 'win'), C(u, v, h - 0.1, r + 0.015, 0.08, 'accent', F), ['pyr', u - 0.7 * r, v - 0.7 * r, h, 1.4 * r, 1.4 * r, 0.45, 'crystal']]), S(2.45)],
  // Wieża-klepsydra: dwie bańki z oknami, kryształowe przewężenie z sypiącym się światłem, kopułka.
  brokers: [['shadow', 0.5, 0.5, 0, 0.4, 2.3], C(0.5, 0.5, 0, 0.38, 1, 'wall', 'win flush'), C(0.5, 0.5, 1, 0.4, 0.08, 'accent', F),
    C(0.5, 0.5, 1.08, 0.1, 0.4, 'crystal', F), G(0.5, 0.5, 1.28, 0.12, 'roof'), C(0.5, 0.5, 1.48, 0.4, 0.08, 'accent', F),
    C(0.5, 0.5, 1.56, 0.36, 0.75, 'wall2', F), ['dome', 0.5, 0.5, 2.31, 0.26, 'metal'], S(2.8)],
  // Obelisk z wiecznym płomieniem: cokół, trzon z oknami, złoty szczyt.
  immortals: [B(0.14, 0.14, 0, 0.72, 0.72, 0.28, 'wall2'), B(0.12, 0.12, 0.28, 0.76, 0.76, 0.06, 'accent'), B(0.33, 0.33, 0.34, 0.34, 0.34, 1.5, 'wall', 'win'),
    ['pyr', 0.33, 0.33, 1.84, 0.34, 0.34, 0.3, 'roof'], G(0.5, 0.5, 2.3, 0.14, 'roof'), S(2.9)],
  // Pawilon z dwiema szalami: sala z oknami, kolumny, dach, słup i belka wagi z szalami na linkach.
  tribunal: [B(0.06, 0.06, 0, 0.88, 0.88, 0.12, 'wall2'), B(0.2, 0.2, 0.12, 0.6, 0.6, 1, 'wall', 'win'),
    ...[[0.12, 0.88], [0.88, 0.88], [0.88, 0.12]].map(([u, v]) => C(u, v, 0.12, 0.05, 1, 'wall2')),
    B(0.08, 0.08, 1.12, 0.84, 0.84, 0.1, 'accent'), ['pyr', 0.1, 0.1, 1.22, 0.8, 0.8, 0.3, 'roof'], L(0.5, 0.5, 1.52, 0.5, 0.5, 2.05, 'metal', 1.6),
    L(0.12, 0.88, 2, 0.88, 0.12, 2, 'metal', 1.4), ...[[0.12, 0.88], [0.88, 0.12]].flatMap(([u, v]) => [L(u, v, 2, u, v, 1.72, 'metal', 0.7), C(u, v, 1.68, 0.13, 0.04, 'metal', F)]),
    S(2.45)],
  // Pierścień zegara: postument z oknami, tarcza ze światła, obręcz i wskazówki.
  chrononauts: [B(0.14, 0.3, 0, 0.72, 0.4, 1, 'wall', 'win'), G(0.5, 0.5, 1.8, 0.24), ['ring', 0.5, 0.5, 1.8, 0.36, 'accent', 'upright'],
    L(0.5, 0.5, 1.8, 0.72, 0.5, 1.8, 'dark', 1.4), L(0.5, 0.5, 1.8, 0.5, 0.5, 2.15, 'dark', 1.4), S(2.75)],
  // Czarny monolit z portalem pustki: sala z oknami, monolit, przed nim czarna kula w pierścieniu z poświatą.
  voidwalkers: [B(0.5, 0.12, 0, 0.38, 0.5, 1, 'wall2', 'win'), B(0.12, 0.22, 0, 0.42, 0.14, 2.2, 'dark'), B(0.12, 0.22, 2.2, 0.42, 0.14, 0.06, 'accent', F),
    G(0.5, 0.74, 0.85, 0.24, 'accent'), ['dome', 0.5, 0.74, 0.7, 0.16, 'dark', F], ['ring', 0.5, 0.74, 0.85, 0.3, 'accent', 'upright'], S(2.65)],
};

// Świetlista drobina zamiast postaci (hook figure): złota poświata w dwóch kołach i jasne jądro nad punktem (x, y);
// z delay ma klasę person (kołysanie).
const figure = (x, y, rnd, s, delay) => {
  const c = `cx="${r1(x)}" cy="${r1(y - (14 + rnd() * 4) * s)}"`;
  const g = `<circle ${c} r="${r1(8.5 * s)}" fill="#ffc451" fill-opacity=".25"/><circle ${c} r="${r1(4.8 * s)}" fill="#ffd77a" fill-opacity=".6"/><circle ${c} r="${r1(2.2 * s)}" fill="#fff7de"/>`;
  return delay === undefined ? g : `<g class="person" style="animation-delay:${delay.toFixed(2)}s">${g}</g>`;
};

// Strefy drobin [ax, ay, bx, by, z0, z1] dla rdzenia i SLOTS.universe: tam, gdzie przy każdym n nic ich nie zasłania i nie
// wchodzą na emblematy (rdzeń i dwa pierwsze kręgi w kolumnie placu, tylne narożne z zewnątrz, przedni rząd na ścieżkach).
const ZONES = [[-1.15, -0.85, -0.85, -1.15, 0.8, 2], [0.12, -0.25, 0.22, 0.12, 0, 2.1], [-0.25, 0.12, 0.12, 0.22, 0, 2.1],
  [1.32, -2.88, 1.8, -2.62, 0.2, 1.2], [-2.88, 1.32, -2.62, 1.8, 0.2, 1.2], [2.87, -1.15, 2.87, -0.35, 0, 0.8],
  [-1.15, 2.87, -0.35, 2.87, 0, 0.8], [1.85, 1.45, 2.65, 1.45, 0, 0.8], [1.45, 1.85, 1.45, 2.65, 0, 0.8]];
// Drobina j z k (hook spot): wzdłuż strefy, zygzakiem w górę → [gx, gy, gz].
const spot = (r, j, k) => {
  const [ax, ay, bx, by, z0, z1] = ZONES[SLOTS.universe.findIndex((s) => s.gx === r.gx && s.gy === r.gy) + 1], u = (j + 0.5) / k;
  return [ax + (bx - ax) * u, ay + (by - ay) * u, z0 + (z1 - z0) * (u + (j % 2)) / 2];
};

// Kryształowe żyły na spodzie odłamka: złote kreski od krawędzi wierzchu ku czubkowi, z odgałęzieniem.
function extras(m, lay) {
  const W = lay.size * TW / 2, fy = lay.size * TH / 2 + LV, ty = fy + 6 * lay.size;
  const d = [[-1, 0.3, -1], [-1, 0.72, 1], [1, 0.28, 1], [1, 0.66, -1]].map(([side, t, s]) => {
    const e = [side * W * (1 - t), LV + (fy - LV) * t], p = (k, dx = 0) => pt([e[0] * (1 - k) + dx, e[1] + (ty - e[1]) * k]);
    return `M${pt(e)}L${p(0.22, 3 * s)}L${p(0.45)}L${p(0.62, -2 * s)}M${p(0.22, 3 * s)}L${p(0.34, 9 * s)}`;
  }).join('');
  return { back: `<path d="${d}" fill="none" stroke="${PALETTES.universe.metal}" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>` };
}

// maxAnim: 45 drobin przy pełnej obsadzie nie zajmuje całego budżetu animacji (reszta świeci bez kołysania).
export const UNIVERSE_ART = { id: 'universe', palette: PALETTES.universe, coreForm, coreFoot, core, depts: DEPTS, spot, figure, extras, maxAnim: 30 };
