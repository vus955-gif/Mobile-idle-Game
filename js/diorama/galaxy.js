// Galaktyka: rdzeń (nawigatorzy) to prom na lądowisku doku, od drugiego działu statek-matka. Kadłub leży wzdłuż osi x
// i z każdą działką wydłuża się dziobem o segment; rufa z mostkiem i napędem stoi w miejscu, więc pokłady (działki
// SLOTS.galaxy na wysokości kadłuba) nie przeskakują. Części liczymy od rogu miejsca w doku 5,5 × 2,85 (róg w siatce
// wyspy: −2,75; −1,65); statek z rufą, gondolami i dziobem celowo wystaje poza dok, cienie przycinamy do doku.
import { PALETTES, CREW, SIDE_ART, B, C, S, L, F, when, drive, spot as footSpot, person, seeded } from './parts.js';
import { iso, pt, shadowOffset } from './iso.js';
import { SLOTS } from './layout.js';

const H = 2, D = 2.85, Y = D / 2, XS = -0.55, K = 2.75; // wysokość i szerokość kadłuba, oś, rufa, środek obrysu
const XE = (k) => 0.85 + 0.6 * k; // koniec kadłuba (podstawa dziobu) przy k działkach
const coreForm = (n) => (n > 1 ? 'mothership' : 'shuttle');
const coreFoot = () => ({ w: 5.5, d: D, h: H }); // miejsce w doku (obrys do układu), nie zasięg statku
const SUIT = PALETTES.galaxy.glass; // turkusowe mundury

const G = (x, y, z, r, m = 'glass') => ['glow', x, y, z, r, m], X = 'x flush';

// Prom o środku (x, y) na wysokości z w skali s, dziobem w stronę +x: dysza, skrzydła, kadłub, dziób, kabina, statecznik.
const shuttle = (x, y, z, s) => {
  const wing = (v) => B(x - 0.45 * s, y + v * s, z + 0.05 * s, 0.6 * s, 0.5 * s, 0.08 * s, 'wall', F);
  return [G(x - 0.8 * s, y, z + 0.2 * s, 0.13 * s), wing(-0.75), B(x - 0.7 * s, y - 0.25 * s, z, 1.05 * s, 0.5 * s, 0.4 * s, 'metal', F),
    ['pyr', x + 0.35 * s, y - 0.25 * s, z, 0.5 * s, 0.5 * s, 0.4 * s, 'metal', X], B(x - 0.1 * s, y - 0.14 * s, z + 0.4 * s, 0.35 * s, 0.28 * s, 0.12 * s, 'glass', F),
    B(x - 0.66 * s, y - 0.04, z + 0.4 * s, 0.26 * s, 0.08, 0.3 * s, 'accent', F), wing(0.25)];
};
// Pary gondoli napędu po bokach rufy (s = −1 z tyłu, 1 z przodu): poświata, gondola z pasem, czubek, pylon do kadłuba;
// światła nawigacyjne tylko na przednich (tylne zasłania kadłub).
const pods = (s, p, len) => Array.from({ length: p }, (_, j) => {
  const y = s < 0 ? -0.6 : D + 0.6, z = 1.3 - 0.62 * j, x = -0.65, l = Math.min(2.1, len - 0.9) - 0.3 * j;
  const pod = [G(x - 0.12, y, z, 0.17, 'crystal'), B(x, y - 0.17, z - 0.2, l, 0.34, 0.4, 'wall', F), B(x + l - 0.55, y - 0.18, z - 0.21, 0.12, 0.36, 0.42, 'accent', F),
    ['pyr', x + l, y - 0.17, z - 0.2, 0.4, 0.34, 0.4, 'metal', X], ...when(s > 0, [['mast', x + l + 0.38, y, z, 0.32]])];
  const pylon = L(x + l / 2, y, z, x + l / 2, s < 0 ? 0 : D, z - 0.05, 'metal', 2.4);
  return s < 0 ? [...pod, pylon] : [pylon, ...pod];
})[s < 0 ? 'reverse' : 'slice']().flat();

// Statek-matka przy k działkach: cień kadłuba i dziobu (tylko na doku między x0 i x1), poświata napędu, obręcz wokół rufy
// (płaszczyzna y–z, za kadłubem), gondole, stępka, kadłub z oknami, pasem i szwami segmentów, dziób, kołyski, mostek
// (maszt w przednim rogu dachu: na środku lampka migała na emblemacie nawigatorów).
const ship = (o, k, x0, x1) => {
  const e = XE(k), len = e - XS, p = (k > 2) + !!o.nacelles, a = Math.max(XS, x0), b = Math.min(e + 1, x1);
  return [
    ['shadow', a, 0, 0, Math.min(e, x1) - a, H, D], ...when(b > e + 0.2, [['shadow', e, D / 4, 0, b - e, H, D / 2]]),
    G(XS - 0.25, 0.85, 1.4, 0.26), G(XS - 0.25, 2, 1.4, 0.26),
    ...when(o.ring, [['ring', XS - 0.07, Y, 1.25, 2.35, 'accent', 'upright', { u: -1, v: 15 }]]), ...pods(-1, p, len),
    B(XS + 0.2, 0.35, 0.5, len - 0.3, D - 0.7, 0.5, 'roof', F), ['pyr', e - 0.1, 0.35, 0.5, 0.7, D - 0.7, 0.5, 'roof', X],
    B(XS, 0, 1, len, D, 1, 'metal', 'win flush'), ['pyr', e, 0, 1, 1.5, D, 1, 'metal', X],
    B(XS + 0.1, 0.1, H, len - 0.15, D - 0.2, 0.03, 'dark', F), B(XS, D, 1.12, len, 0.02, 0.1, 'accent', F),
    ...Array.from({ length: k }, (_, i) => B(XE(i) - 0.03, D, 1, 0.06, 0.02, 1, 'roof', F)),
    ...[0.6, 2.4, 4.2].filter((x) => x < e - 0.4).map((x) => L(x, D + 0.3, 0, x, D - 0.35, 0.55, 'metal', 2)),
    ...pods(1, p, len),
    B(-0.45, 1, H, 0.42, 0.85, 1.1, 'wall', 'win'), B(-0.52, 0.85, H + 1.1, 0.58, 1.15, 0.28, 'glass', F), B(-0.49, 0.9, H + 1.38, 0.52, 1.05, 0.06, 'metal', F),
    ['dome', -0.23, 1.06, H + 1.44, 0.11, 'metal'], ['dome', -0.23, 1.79, H + 1.44, 0.11, 'metal'], ['mast', -0.1, 1.85, H + 1.44, 0.8],
    ['mast', e + 1.47, Y, 1.5, 0.45], ['sign', -0.2, Y, H + 1.95],
  ];
};
// Prom na lądowisku: płyta z kręgiem, cień promu, nogi (tylne przed nim, przednie po nim), prom, światło; z ozdobą gondoli
// dwie kapsuły napędu przy kadłubie.
const legs = (v) => [-0.6, 0.3].map((u) => L(K + u, Y + v, 0.4, K + u, Y + 1.5 * v, 0.08, 'metal', 1.6));
const pad = (o) => [
  C(K, Y, 0, 1.15, 0.08, 'dark'), ['ring', K, Y, 0.08, 0.95, 'glass', 'flat'], ...when(o.ring, [['ring', K, Y, 0.1, 1.4, 'accent', 'flat']]),
  ['shadow', K - 1.4, Y - 0.5, 0.08, 2.6, 0.9, 1], ['shadow', K - 0.9, Y - 1.5, 0.08, 1.2, 0.6, 3], ...legs(-0.4),
  ...when(o.nacelles, [B(K - 1.05, Y - 0.62, 0.45, 1, 0.22, 0.26, 'wall2', F), G(K - 1.12, Y + 0.73, 0.58, 0.1, 'crystal')]),
  ...shuttle(K, Y, 0.4, 2), ...when(o.nacelles, [B(K - 1.05, Y + 0.62, 0.45, 1, 0.22, 0.26, 'wall2', F)]), ...legs(0.4),
  ['mast', K + 0.85, Y + 0.85, 0.08, 0.5], ['sign', K, Y, 1.75],
];

const ORN = [[1, 'ring'], [2, 'beacons'], [3, 'escort'], [5, 'nacelles'], [8, 'drones']];

function core(m, lay) {
  const n = m.depts.length, k = lay.lots.length, ornaments = ORN.filter(([q]) => m.rounds >= q).map(([, id]) => id);
  const o = Object.fromEntries(ornaments.map((id) => [id, true])), e = XE(k);
  // Brzegi doku wzdłuż x (od rogu obrysu) pomniejszone o przesunięcie cienia kadłuba, żeby cień statku nie spadał z doku.
  const [dx, dy] = shadowOffset(m.light, H), u = dx / 40 + dy / 20, x0 = -lay.size / 2 - lay.core.gx - Math.min(0, u);
  // Radiolatarnie w prawym i lewym narożniku wyspy, tabliczka „◆ NAZWA” na doku przed rufą (na lewo od załogi),
  // eskorta przy rufie i przed czubkiem dziobu (nad wolną częścią doku).
  const beacon = (x, y) => [C(x, y, 0, 0.07, 1.2, 'metal'), G(x, y, 1.25, 0.1), ['mast', x, y, 1.3, 0.4]];
  const parts = [...when(o.beacons, beacon(5.25, -0.85)), ...(n > 1 ? ship(o, k, x0, x0 + lay.size - Math.abs(u)) : pad(o)),
    ['label', 1.6, D + 1.2, 0.05, 3.4, 24, `◆ ${String(m.company ?? '').trim()}`], ...when(o.beacons, beacon(0.25, 4.15)),
    ...when(o.escort, [...shuttle(-0.9, D + 1.5, 1, 0.6), ...shuttle((n > 1 ? e + 1.5 : K + 1.7) + 1.3, Y + 0.4, 1.6, 0.6)])];
  return {
    parts, ornaments, people: 0,
    // Lampki świąteczne: górna przednia krawędź kadłuba albo prawy przedni brzeg lądowiska (lewy przykrywa skrzydło promu).
    lights: [n > 1 ? [[XS + 0.1, D, H], [e - 0.1, D, H]] : [[K + 1.15, Y - 0.2, 0.08], [K + 0.95, Y + 0.65, 0.08], [K + 0.45, Y + 1.05, 0.08]]],
  };
}

// Pokłady działów (działka 1×1 na kadłubie, emblemat ≤ 3 poziomy). Tylne (astro, shipai, geneticists, gravitons) są wyższe
// od przednich, więc w zygzaku emblemat przedniego nie wchodzi na tylny.
const DEPTS = {
  // Obserwatorium: bęben z oknami, kopuła i teleskop skierowany w niebo.
  astro: [C(0.5, 0.5, 0, 0.4, 1.2, 'wall2', 'win'), C(0.5, 0.5, 1.2, 0.42, 0.12, 'accent', F), ['dome', 0.5, 0.5, 1.32, 0.38, 'metal'],
    L(0.42, 0.58, 1.62, 0.86, 0.14, 2.45, 'roof', 4.5), G(0.86, 0.14, 2.45, 0.05), S(2.85)],
  // Ambasada: gmach z gzymsem w akcencie, na dachu ogród pod szklanym sklepieniem.
  envoys: [B(0.1, 0.12, 0, 0.8, 0.76, 1.05, 'wall', 'win'), B(0.07, 0.09, 1.05, 0.86, 0.82, 0.1, 'accent'),
    ...[[0.3, 0.38, 0.14], [0.62, 0.32, 0.12], [0.48, 0.62, 0.15]].map(([u, v, r]) => ['dome', u, v, 1.15, r, 'green']),
    ['ring', 0.5, 0.5, 1.15, 0.42, 'glass', 'flat'], ...[[0.14, 0.84], [0.86, 0.84], [0.86, 0.16]].map(([u, v]) => L(u, v, 1.15, 0.5, 0.5, 1.8, 'glass', 1.2)), S(2.2)],
  // Rdzeń SI: ciemny blok z oknami, trzpień i świecący rdzeń w dwóch pierścieniach.
  shipai: [B(0.15, 0.15, 0, 0.7, 0.7, 1.2, 'dark', 'win'), B(0.1, 0.1, 1.2, 0.8, 0.8, 0.1, 'accent'), C(0.5, 0.5, 1.3, 0.13, 0.45, 'metal'),
    ['ring', 0.5, 0.5, 2.05, 0.38, 'glass', 'flat'], G(0.5, 0.5, 2.05, 0.17), ['ring', 0.5, 0.5, 2.05, 0.32, 'crystal', 'upright'], S(2.85)],
  // Hangar z otwartymi wrotami (skrzydła w akcencie) i światłem w środku.
  traders: [B(0.05, 0.12, 0, 0.9, 0.76, 1, 'wall2', 'win'), ['gable', 0.03, 0.1, 1, 0.94, 0.8, 0.45, 'roof', 'y'], B(0.22, 0.87, 0, 0.56, 0.02, 0.8, 'dark', F),
    G(0.5, 0.9, 0.35, 0.1, 'crystal'), B(0.06, 0.88, 0, 0.15, 0.02, 0.85, 'accent', F), B(0.79, 0.88, 0, 0.15, 0.02, 0.85, 'accent', F), S(2.1)],
  // Laboratorium: blok z oknami i dwa zbiorniki z zielonym płynem na rurach.
  geneticists: [B(0.08, 0.08, 0, 0.84, 0.34, 1.4, 'wall', 'win'), B(0.06, 0.06, 1.4, 0.88, 0.38, 0.08, 'accent'),
    ...[0.3, 0.72].flatMap((u) => [C(u, 0.68, 0, 0.21, 0.12, 'metal'), C(u, 0.68, 0.12, 0.19, 1.25, 'green', F), C(u, 0.68, 1.37, 0.21, 0.08, 'accent', F),
      ['dome', u, 0.68, 1.45, 0.19, 'metal'], L(u, 0.5, 1.1, u, 0.42, 1.1, 'metal', 1.6)]), S(2.6)],
  // Senat: rotunda z kolumnadą i kopułą w akcencie.
  senate: [C(0.5, 0.5, 0, 0.47, 0.12, 'wall2'), C(0.5, 0.5, 0.12, 0.36, 1, 'wall', 'win'),
    ...[-0.3, 0.25, 0.79, 1.33, 1.87].map((a) => L(0.5 + 0.43 * Math.cos(a), 0.5 + 0.43 * Math.sin(a), 0.12, 0.5 + 0.43 * Math.cos(a), 0.5 + 0.43 * Math.sin(a), 1.1, 'metal', 2)),
    C(0.5, 0.5, 1.1, 0.47, 0.1, 'metal'), ['dome', 0.5, 0.5, 1.2, 0.4, 'accent'], G(0.5, 0.5, 1.68, 0.04, 'crystal'), S(2.2)],
  // Grawitony: cokół, trzy wsporniki i czarna kula w złotym pierścieniu z poświatą.
  gravitons: [B(0.18, 0.18, 0, 0.64, 0.64, 1, 'roof', 'win'), B(0.14, 0.14, 1, 0.72, 0.72, 0.08, 'accent'),
    ...[[0.2, 0.8], [0.8, 0.8], [0.8, 0.2]].map(([u, v]) => L(u, v, 1.08, (u + 0.5) / 2, (v + 0.5) / 2, 1.75, 'metal', 1.4)),
    G(0.5, 0.5, 1.9, 0.22, 'accent'), ['dome', 0.5, 0.5, 1.75, 0.3, 'dark', F], ['ring', 0.5, 0.5, 1.75, 0.44, 'accent', 'flat'], S(2.85)],
  // Biokopuła: bęben z oknami, fioletowa roślinność (kopuła) pod szklanymi żebrami.
  xeno: [C(0.5, 0.5, 0, 0.44, 1, 'wall2', 'win'), C(0.5, 0.5, 1, 0.46, 0.08, 'accent', F), ['dome', 0.5, 0.5, 1.08, 0.42, 'wall'],
    ...[[0.94, 0.5], [0.81, 0.81], [0.5, 0.94]].map(([u, v]) => L(u, v, 1.08, 0.5, 0.5, 1.95, 'glass', 1)), S(2.15)],
};

// Załoga pokładu (j-ta z k) stoi na kadłubie tam, gdzie nie zasłoni jej pokład rysowany później. Przedni rząd (działki
// nieparzyste) stoi na pasie kadłuba przed sobą. Tylny rząd zasłaniają przednie pokłady, więc jego załoga stoi przy mostku
// (działka 0, wzdłuż y), na początku pasa (2) albo w pierwszym szeregu przed wcześniej rysowanym pokładem przednim (4 → 1, 6 → 3).
// Obrys spoza pokładów (rdzeń, gdyby dostał obsadę) dostaje domyślne miejsce przed ścianami.
const spot = (r, j, k) => {
  const i = SLOTS.galaxy.findIndex((s) => s.gx === r.gx), u = (j + 0.5) / k, o = j % 2;
  if (i < 0) return footSpot(r, j, k);
  if (!i) return [-3.12 + 0.18 * o, 0.35 + 0.7 * u];
  const x = i === 2 ? -2.58 : SLOTS.galaxy[i % 2 ? i : i - 3].gx + 0.12, w = i === 2 ? 0.42 : 0.76;
  return [x + w * u, (i % 2 ? 0.98 : 1.1) + 0.05 * o];
};

// Promy kursują nad przednią lewą krawędzią doku, załoga nawigatorów stoi na płycie przed kadłubem, rój dronów krąży przy dziobie.
function extras(m, lay) {
  const h = lay.size / 2, n = m.depts.length, ships = 1 + (n >= 5), crew = CREW[m.depts[0]?.tier ?? 0].people, rnd = seeded(31);
  const anim = Array.from({ length: ships }, (_, i) => drive({ gx: -h, gy: h - 0.12, axis: 'x', len: 2 * h }, `<g transform="scale(.5)">${SIDE_ART.shuttle()}</g>`,
    { dur: 13 + i * 5, delay: -i * 6, id: `shuttle${i}` }));
  for (let j = 0; j < crew; j++) anim.push(person(...iso(0.5 + 0.6 * j, 2.05), rnd, 0.45, (j * 0.37) % 1.6, SUIT));
  const dots = (pts) => pts.map(([x, y, z]) => `M${pt(iso(x, y, z))}h.1`).join('');
  const svg = m.rounds < 8 ? '' : `<path d="${dots([[3.4, -1.4, 2.9], [3.8, -1, 2.5], [3.1, -0.8, 3.3], [4, -0.4, 2.9], [3.5, -0.2, 2.3]])}" stroke="#7ff3ea" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="${dots([[3.3, -1.9, 2.4], [3, -1.3, 3.6], [3.9, -1.7, 3.1], [3.7, 0.2, 3]])}" stroke="#f9a8f0" stroke-width="3" stroke-linecap="round"/>`;
  return { anim, svg, vehicles: ships, people: crew };
}

export const GALAXY_ART = { id: 'galaxy', palette: PALETTES.galaxy, suit: SUIT, coreForm, coreFoot, core, depts: DEPTS, spot, extras };
