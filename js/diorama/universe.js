// Wszechświat: rdzeń (kartografowie) rośnie z działami: iskra kreacji → kryształowa iglica → cytadela z kręgami i portalem.
// Wokół na odłamku materii kręgi działów; obsadę pokazują świetliste drobiny. Rdzeń od rogu obrysu 2,5 × 2,5 (środek K).
import { PALETTES, ER, STEM, B, C, S, L, F, when } from './parts.js';
import { TW, TH, LV, n as r1, pt } from './iso.js';
import { SLOTS } from './layout.js';

const K = 1.25, UP = (STEM + ER) / LV; // środek obrysu; środek emblematu jest UP poziomu nad punktem sign
const coreForm = (n) => (n > 4 ? 'citadel' : n > 1 ? 'spire' : 'spark');
// Wierzchołek iglicy rośnie z działami (rundy dokładają pierścienie, nie wysokość: emblematy na SE).
const top = (n) => (n > 4 ? 4.4 + 0.15 * n : 3.4 + 0.3 * n);
const coreFoot = (n) => ({ w: 2.5, d: 2.5, h: n > 1 ? top(n) : 2.2 });

const G = (x, y, z, r, m = 'crystal') => ['glow', x, y, z, r, m];
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
  const T = top(n), h = lay.size / 2, at = (u, v) => [u * h - lay.core.gx, v * h - lay.core.gy], parts = n > 1 ? spire(o, n, T) : spark(o), sign = parts.find((p) => p[0] === 'sign')[3];
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

// Kręgi działów (działka 1×1, szczyt razem z poświatami i emblemat ≤ 3 poziomy). W kolumnie ekranu (tył/przód:
// cosmologists/chrononauts, replicators/immortals, ambassadors/voidwalkers, brokers/tribunal) emblemat przedniego stoi
// najwyżej 0,5 poziomu wyżej. Okien jest 3–4, żeby udział świecących (próg obsady) był widoczny także przy progu 0.
const DEPTS = {
  // Iglica z orrery: sala z oknami, iglica, orbita z planetami, słońce.
  cosmologists: [B(0.12, 0.12, 0, 0.76, 0.76, 1, 'wall', 'win'), C(0.5, 0.5, 1, 0.42, 0.08, 'accent', F), ['pyr', 0.32, 0.32, 1.08, 0.36, 0.36, 1.2, 'wall2'],
    ['ring', 0.5, 0.5, 1.6, 0.44, 'metal', 'flat'], ...[[0.81, 0.81], [0.06, 0.5], [0.69, 0.11]].map(([u, v]) => G(u, v, 1.6, 0.05, 'accent')),
    G(0.5, 0.5, 2.3, 0.1), S(2.85)],
  // Kryształowy łuk-brama: sala z oknami, filary, łuk z poświatą w prześwicie, nadproże i kryształ.
  ambassadors: [B(0.1, 0.08, 0, 0.8, 0.4, 1, 'wall', 'win'), B(0.1, 0.6, 0, 0.2, 0.22, 1.3, 'wall2'), G(0.5, 0.71, 0.7, 0.16, 'glass'),
    ['ring', 0.5, 0.71, 0.82, 0.32, 'crystal', 'upright'], B(0.7, 0.6, 0, 0.2, 0.22, 1.3, 'wall2'), B(0.06, 0.58, 1.3, 0.88, 0.26, 0.14, 'accent'),
    gem(0.5, 0.71, 1.44, 0.26, 0.5), S(2.3)],
  // Ul z sześciokątnych kryształów: graniastosłupy z oknami i pasem, zakończone ostrzami.
  replicators: [...[[0.3, 0.32, 1.5, 0.2], [0.72, 0.3, 1.1, 0.18], [0.3, 0.74, 1, 0.18], [0.7, 0.7, 1.25, 0.2]].flatMap(([u, v, h, r]) => [
    C(u, v, 0, r, h, 'wall', 'win'), C(u, v, h - 0.1, r + 0.015, 0.08, 'accent', F), ['pyr', u - 0.7 * r, v - 0.7 * r, h, 1.4 * r, 1.4 * r, 0.45, 'crystal']]), S(2.45)],
  // Wieża-klepsydra: dwie bańki z oknami, kryształowe przewężenie z sypiącym się światłem, kopułka.
  brokers: [['shadow', 0.5, 0.5, 0, 0.4, 2.4], C(0.5, 0.5, 0, 0.38, 1, 'wall', 'win flush'), C(0.5, 0.5, 1, 0.4, 0.06, 'accent', F),
    C(0.5, 0.5, 1.06, 0.1, 0.3, 'crystal', F), G(0.5, 0.5, 1.21, 0.1, 'roof'), C(0.5, 0.5, 1.36, 0.4, 0.06, 'accent', F),
    C(0.5, 0.5, 1.42, 0.38, 1, 'wall2', 'win flush'), ['dome', 0.5, 0.5, 2.42, 0.2, 'metal'], S(2.8)],
  // Obelisk z wiecznym płomieniem: cokół z oknami, ciemny trzon, złoty szczyt.
  immortals: [B(0.12, 0.12, 0, 0.76, 0.76, 1, 'wall2', 'win'), B(0.1, 0.1, 1, 0.8, 0.8, 0.06, 'accent'), B(0.36, 0.36, 1.06, 0.28, 0.28, 0.9, 'wall'),
    ['pyr', 0.36, 0.36, 1.96, 0.28, 0.28, 0.24, 'roof'], G(0.5, 0.5, 2.32, 0.1, 'roof'), S(2.9)],
  // Pawilon z dwiema szalami: cień całości, płyta, sala z oknami, kolumny, dach, słup i belka wagi z szalami na linkach.
  tribunal: [['shadow', 0.04, 0.04, 0, 0.92, 2, 0.92], B(0.04, 0.04, 0, 0.92, 0.92, 0.12, 'wall2', F), B(0.125, 0.125, 0.12, 0.75, 0.75, 1, 'wall', 'win'),
    ...[[0.09, 0.91], [0.91, 0.91], [0.91, 0.09]].map(([u, v]) => C(u, v, 0.12, 0.05, 1, 'wall2')),
    B(0.08, 0.08, 1.12, 0.84, 0.84, 0.1, 'accent'), ['pyr', 0.1, 0.1, 1.22, 0.8, 0.8, 0.3, 'roof'], L(0.5, 0.5, 1.52, 0.5, 0.5, 2.05, 'metal', 1.6),
    L(0.12, 0.88, 2, 0.88, 0.12, 2, 'metal', 1.4), ...[[0.12, 0.88], [0.88, 0.12]].flatMap(([u, v]) => [L(u, v, 2, u, v, 1.72, 'metal', 0.7), C(u, v, 1.68, 0.13, 0.04, 'metal', F)]),
    S(2.45)],
  // Pierścień zegara: postument z oknami, tarcza ze światła, obręcz i wskazówki.
  chrononauts: [B(0.12, 0.3, 0, 0.76, 0.4, 1, 'wall', 'win'), G(0.5, 0.5, 1.8, 0.2), ['ring', 0.5, 0.5, 1.8, 0.36, 'accent', 'upright'],
    L(0.5, 0.5, 1.8, 0.72, 0.5, 1.8, 'dark', 1.4), L(0.5, 0.5, 1.8, 0.5, 0.5, 2.15, 'dark', 1.4), S(2.75)],
  // Czarny monolit z portalem pustki: sala z oknami z tyłu, monolit, przed nim czarna kula w pierścieniu z poświatą.
  voidwalkers: [B(0.1, 0.06, 0, 0.8, 0.3, 1, 'wall2', 'win'), B(0.14, 0.4, 0, 0.42, 0.14, 2.2, 'dark'), B(0.14, 0.4, 2.2, 0.42, 0.14, 0.06, 'accent', F),
    G(0.5, 0.74, 0.85, 0.2, 'accent'), ['dome', 0.5, 0.74, 0.7, 0.16, 'dark', F], ['ring', 0.5, 0.74, 0.85, 0.3, 'accent', 'upright'], S(2.65)],
};

// Świetlista drobina zamiast postaci (hook figure): jedno koło z gradientem MOTE (jasne jądro, złota poświata) nad punktem
// (x, y); z delay ma klasę person (kołysanie). Gradient jest raz na dioramę w extras.back.
const MOTE = 'd-mote';
const figure = (x, y, rnd, s, delay) => {
  const g = `<circle cx="${r1(x)}" cy="${r1(y - (14 + rnd() * 4) * s)}" r="${r1(8.5 * s)}" fill="url(#${MOTE})"/>`;
  return delay === undefined ? g : `<g class="person" style="animation-delay:${delay.toFixed(2)}s">${g}</g>`;
};

// Strefy drobin [ax, ay, bx, by, z0, z1] dla rdzenia i SLOTS.universe: tam, gdzie przy każdym n nic ich nie zasłania i nie
// wchodzą na emblematy (rdzeń i dwa pierwsze kręgi w kolumnie placu, tylne narożne z zewnątrz, przedni rząd na ścieżkach).
const ZONES = [[-1.15, -0.85, -0.85, -1.15, 0.8, 2], [0.12, -0.25, 0.22, 0.12, 0, 2.1], [-0.25, 0.12, 0.12, 0.22, 0, 2.1],
  [1.32, -2.88, 1.8, -2.62, 0.2, 1.2], [-2.88, 1.32, -2.62, 1.8, 0.2, 1.2], [2.87, -1.15, 2.87, -0.35, 0, 0.8],
  [-1.15, 2.87, -0.35, 2.87, 0, 0.8], [1.85, 1.45, 2.65, 1.45, 0, 0.8], [1.45, 1.85, 1.45, 2.65, 0, 0.8]];
// Drobina j z k (hook spot): wzdłuż strefy, zygzakiem w górę → [gx, gy, gz]. Przy iskrze (rdzeń o wysokości coreFoot(1).h)
// drobiny leżą łukiem na odłamku przed kryształami, poza poświatą kuli, żeby obsada była widoczna.
const spot = (r, j, k) => {
  const i = SLOTS.universe.findIndex((s) => s.gx === r.gx && s.gy === r.gy) + 1, u = (j + 0.5) / k, a = 1.5708 * u;
  if (!i && r.h === coreFoot(1).h) return [r.gx + K + 1.75 * Math.cos(a), r.gy + K + 1.75 * Math.sin(a), 0.2 + 0.25 * (j % 2)];
  const [ax, ay, bx, by, z0, z1] = ZONES[i];
  return [ax + (bx - ax) * u, ay + (by - ay) * u, z0 + (z1 - z0) * (u + (j % 2)) / 2];
};

// Kryształowe żyły na spodzie odłamka (złote kreski od krawędzi wierzchu ku czubkowi, z odgałęzieniem) i gradient drobin.
function extras(m, lay) {
  const W = lay.size * TW / 2, fy = lay.size * TH / 2 + LV, ty = fy + 6 * lay.size;
  const d = [[-1, 0.3, -1], [-1, 0.72, 1], [1, 0.28, 1], [1, 0.66, -1]].map(([side, t, s]) => {
    const e = [side * W * (1 - t), LV + (fy - LV) * t], p = (k, dx = 0) => pt([e[0] * (1 - k) + dx, e[1] + (ty - e[1]) * k]);
    return `M${pt(e)}L${p(0.22, 3 * s)}L${p(0.45)}L${p(0.62, -2 * s)}M${p(0.22, 3 * s)}L${p(0.34, 9 * s)}`;
  }).join('');
  return {
    back: `<defs><radialGradient id="${MOTE}"><stop offset="0" stop-color="#fff7de"/><stop offset=".35" stop-color="#ffcf5c" stop-opacity=".9"/>`
      + `<stop offset="1" stop-color="#ffb52e" stop-opacity="0"/></radialGradient></defs>`
      + `<path d="${d}" fill="none" stroke="${PALETTES.universe.metal}" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
}

// maxAnim: 45 drobin przy pełnej obsadzie nie zajmuje całego budżetu animacji (reszta świeci bez kołysania).
export const UNIVERSE_ART = { id: 'universe', palette: PALETTES.universe, coreForm, coreFoot, core, depts: DEPTS, spot, figure, extras, maxAnim: 30 };
