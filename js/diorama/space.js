// Kosmos: rdzeń (inżynierowie) rośnie z działami: kapsuła → węzeł → stacja; wokół moduły działów, rakiety rund i łazik.
// Na wyspach z powierzchnią stacja stoi na nogach lądownika, na platformie i aerostacie jest przycumowana do pokładu.
// Części od rogu obrysu 2,5 × 2,5 (środek K); działki przed rdzeniem z emblematami zasłaniają dół, więc tabliczka jest wysoko.
import { PALETTES, SIDE_ART, B, C, S, L, F, when, drive } from './parts.js';
import { iso, pt } from './iso.js';
import { PLACES } from './island.js';

const K = 1.25, R = (n) => (n > 4 ? 0.8 : 0.7); // środek obrysu, promień modułu centralnego
const coreForm = (n) => (n > 4 ? 'station' : n > 1 ? 'hub' : 'capsule');
// Szczyt modułu: rośnie z działami, od 4. rundy o 0,3 poziomu.
const top = (n, r) => (n > 4 ? 5.4 + 0.08 * n : 4.7 + 0.15 * n) + (r > 3) * 0.3;
const coreFoot = (n, r) => ({ w: 2.5, d: 2.5, h: n > 1 ? top(n, r) : 3 });

const dot = (x, y, z) => ['glow', x, y, z, 0.04, 'crystal']; // bursztynowe światło modułu
const surfaceOf = (m) => (PLACES[m.view] ?? PLACES.waw).base === 'island';
// Walec z pasów [wysokość, materiał, flagi] jeden na drugim, bez własnych cieni (pas w akcencie lekko wystaje);
// cień całości o wysokości h rzuca na grunt `shade`, także spod nóg lądownika.
const stack = (x, y, z, r, segs) => segs.map(([h, m, f = '']) => C(x, y, (z += h) - h, r + (m === 'accent') * 0.015, h, m, `${f} ${F}`));
const shade = (x, y, r, h) => ['shadow', x, y, 0, r, h];

// Rakieta na stopie o środku (x, y) w skali s: stateczniki, kadłub z pasem, iluminator, stożek.
const rocket = (x, y, s = 1, z = 0, r = 0.13 * s, k = 0.09 * s) => [
  shade(x, y, r, z + 0.08 + 2.76 * s), C(x, y, z, 0.34 * s, 0.08, 'metal'), B(x - 0.26 * s, y - 0.03, z + 0.08, 0.52 * s, 0.06, 0.45 * s, 'roof'), B(x - 0.03, y - 0.26 * s, z + 0.08, 0.06, 0.52 * s, 0.45 * s, 'roof'),
  ...stack(x, y, z + 0.08, r, [[1.4 * s, 'wall'], [0.16 * s, 'accent'], [0.6 * s, 'wall']]), ['pyr', x - k, y - k, z + 0.08 + 2.16 * s, 2 * k, 2 * k, 0.6 * s, 'roof'],
  dot(x + r * 0.75, y + r * 0.75, z + 1.95 * s),
];
// Para skrzydeł paneli na wysokości z (wzdłuż −x i −y, za modułem): panel, kratownica, światło na końcu.
const wings = (z, len, r) => [
  ['panel', K - len, K - 0.32, z, len - r - 0.2, 0.64], L(K, K, z + 0.1, K - len - 0.1, K, z + 0.1, 'metal', 1.4), dot(K - len - 0.1, K, z + 0.1),
  ['panel', K - 0.32, K - len, z, 0.64, len - r - 0.2], L(K, K, z + 0.1, K, K - len - 0.1, z + 0.1, 'metal', 1.4), dot(K, K - len - 0.1, z + 0.1),
];
// Podstawa modułu [za nim, przed nim]: nogi lądownika albo kołnierz cumowniczy z linami do pokładu.
const base = (surface, z0, r) => {
  const legs = (dirs, a, z, d, m, w) => dirs.map(([u, v]) => L(K + u * r * a, K + v * r * a, z, K + u * d, K + v * d, 0, m, w));
  return surface ? [legs([[-1, 0], [0, -1]], 0.7, z0 + 0.3, 1.15, 'metal', 2.4), legs([[1, 0], [0, 1]], 0.7, z0 + 0.3, 1.15, 'metal', 2.4)]
    : [[C(K, K, 0, r + 0.2, z0, 'dark'), ...legs([[-1, -1], [1, -1]], 0.5, z0 + 1.4, 1.1, 'wall2', 1)], legs([[-1, 1], [1, 1]], 0.5, z0 + 1.4, 1.1, 'wall2', 1)];
};

const FORMS = {
  // Kapsuła: na powierzchni rakieta na stanowisku z wieżą startową, na pokładzie kapsuła na węźle dokującym.
  capsule: (o, s) => [
    ...(s
      ? [C(K, K, 0, 0.75, 0.1, 'dark'), B(K + 0.45, K - 1.05, 0, 0.32, 0.32, 3.4, 'roof'),
        ...[0.3, 1, 1.7, 2.4].map((z) => L(K + 0.45, K - 0.73, z, K + 0.77, K - 0.73, z + 0.65, 'metal', 1)),
        L(K + 0.5, K - 0.75, 2.5, K + 0.08, K - 0.12, 2.5, 'metal', 2), ['mast', K + 0.61, K - 0.89, 3.4, 0.8], ...rocket(K, K, 1.45, 0.1), ['sign', K, K, 4.1]]
      : [shade(K, K, 0.5, 2.9), ...[1.05, ...when(o.wing, [0.6])].flatMap((z) => [['panel', K - 1.75, K - 0.25, z, 1.15, 0.5], ['panel', K - 0.25, K - 1.75, z, 0.5, 1.15]]),
        ...base(false, 0.3, 0.5)[0], ...stack(K, K, 0.3, 0.5, [[0.35, 'wall2'], [0.12, 'accent'], [0.8, 'wall2', 'win']]), ...base(false, 0.3, 0.5)[1],
        ['ring', K, K, 1.57, 0.47, 'metal', 'flat'],
        C(K, K, 1.57, 0.44, 0.35, 'wall', F), ['dome', K, K, 1.92, 0.44, 'roof'], ['mast', K + 0.15, K - 0.15, 2.6, 0.7], dot(K + 0.31, K + 0.31, 1.75), ['sign', K, K, 3.4]]),
    ['label', K + 1.7, K + 1.7, 0.05, 3.4, 24], ...when(o.wing && s, [['panel', K - 1.3, K + 0.35, 0.05, 0.8, 0.55], ['panel', K + 0.35, K - 1.3, 0.05, 0.55, 0.8]]),
    ...when(o.torus, [['ring', K, K, 0.1, 1.1, 'wall2', 'flat']]),
  ],
  // Węzeł i stacja: moduł centralny na podstawie, port z boku, węzeł z anteną na szczycie (z prawej, niska: lampka obok
  // emblematu, nie na nim); stacja ma skrzydła paneli.
  hub: (o, s, n, r) => {
    const T = top(n, r), q = R(n), z0 = s ? 0.55 : 0.3, k = (n > 4 ? Math.min(3, Math.ceil(n / 3)) : 0) + !!o.wing, [back, front] = base(s, z0, q);
    return [
      shade(K, K, q, T + 0.45), ...back, ...Array.from({ length: k }, (_, i) => wings(T - 0.7 - i * 1.15, 2.7 - 0.2 * i, q)).reverse().flat(),
      ...stack(K, K, z0, q, [[0.35, 'wall'], [0.14, 'accent'], [T - z0 - 0.79, 'wall', 'win'], [0.3, 'wall2']]), ...front,
      B(K + q - 0.1, K - 0.22, T - 1.6, 0.45, 0.44, 0.44, 'metal', F), ['ring', K + q + 0.35, K, T - 1.38, 0.18, 'accent', 'upright'],
      dot(K + q * 0.7, K + q * 0.7, z0 + 0.8), dot(K + q * 0.7, K + q * 0.7, T - 0.6),
      ...when(o.torus, [['ring', K, K, T, q + 0.75, 'wall2', 'flat'], ['ring', K, K, T + 0.12, q + 0.75, 'wall', 'flat']]),
      C(K, K, T, 0.38, 0.45, 'metal'), ['ring', K, K, T + 0.45, 0.24, 'accent', 'flat'], ['mast', K + 0.25, K - 0.25, T + 0.45, 0.7],
      ['label', K + 0.6, K + 0.6, 4.45, 3.4, 24], ['sign', K, K, T + 1],
    ];
  },
};
FORMS.station = FORMS.hub;

const ORN = [[1, 'rocket1'], [2, 'wing'], [3, 'rocket2'], [5, 'rocket3'], [8, 'torus']];
// Rakiety rund stoją w wolnych narożnikach wyspy: prawym, lewym i przednim (w siatce wyspy).
const PADS = { rocket1: [1, -1], rocket2: [-1, 1], rocket3: [1, 1] };

function core(m, lay) {
  const n = m.depts.length, r = m.rounds, f = coreForm(n), s = surfaceOf(m), ornaments = ORN.filter(([k]) => r >= k).map(([, id]) => id);
  const o = Object.fromEntries(ornaments.map((id) => [id, true])), h = lay.size / 2 - 0.75, T = top(n, r), q = n > 1 ? R(n) : 0.5;
  const parts = FORMS[f](o, s, n, r).map((p) => (p[0] === 'label' ? [...p, `◆ ${String(m.company ?? '').trim()}`] : p));
  return {
    parts: [...Object.entries(PADS).flatMap(([id, [u, v]]) => when(o[id], rocket(u * h - lay.core.gx, v * h - lay.core.gy, 0.9))), ...parts],
    ornaments,
    // Lampki świąteczne: przednia połowa obręczy szczytu modułu (w stacji też niżej) albo przednia krawędź wieży startowej.
    lights: n === 1 && s ? [[[K + 0.77, K - 0.73, 0.3], [K + 0.77, K - 0.73, 3.4]]]
      : [n > 1 ? T : 1.57, ...when(n > 4, [T - 0.75])].map((z) => Array.from({ length: 7 }, (_, i) => [K + q * Math.cos(i * 0.5236 - 0.785), K + q * Math.sin(i * 0.5236 - 0.785), z])),
  };
}

// Moduły działów na działce 1×1, emblemat ≤ 3 poziomy. W kolumnie ekranu (tylny/przedni: robots/medics, logistics/spacelaw,
// mission/miners, astronauts/terraformers) emblemat przedniego zasłania środek tylnego, więc tylne mają wyróżnik u góry.
const DEPTS = {
  // Centrum łączności: moduł z oknami, duża czasza na trzpieniu, mała czasza i maszt w lewym rogu dachu (z tylnego
  // rogu lampka migała na emblemacie).
  mission: [B(0.1, 0.12, 0, 0.8, 0.76, 1.8, 'wall', 'win'), B(0.08, 0.1, 1.8, 0.84, 0.8, 0.12, 'accent'), C(0.7, 0.3, 1.92, 0.07, 0.35, 'metal'),
    ['dish', 0.7, 0.3, 2.27, 0.3], ['dish', 0.3, 0.72, 1.92, 0.2], ['mast', 0.14, 0.86, 1.92, 1], dot(0.5, 0.88, 1.2), S(2.75)],
  // Habitat: walec z pasem i śluzą, kopuła obserwacyjna na szczycie.
  astronauts: [shade(0.5, 0.5, 0.42, 2.15), ...stack(0.5, 0.5, 0, 0.42, [[0.3, 'wall'], [0.14, 'accent'], [1.46, 'wall', 'win'], [0.25, 'wall2']]), B(0.38, 0.9, 0, 0.24, 0.04, 0.44, 'dark', F),
    ['dome', 0.5, 0.5, 2.15, 0.32, 'glass'], dot(0.8, 0.8, 1.6), S(2.8)],
  // Kratownica na sterowni z oknami, ramię robota na szczycie.
  robots: [B(0.12, 0.12, 0, 0.76, 0.76, 1, 'wall2', 'win'), ...[[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].map(([u, v]) => L(u, v, 1, u, v, 2.2, 'metal', 1.4)),
    ...[1, 1.6].flatMap((z) => [L(0.3, 0.7, z, 0.7, 0.7, z + 0.6, 'metal', 1), L(0.7, 0.7, z, 0.7, 0.3, z + 0.6, 'metal', 1)]),
    B(0.24, 0.24, 2.2, 0.52, 0.52, 0.1, 'accent', F), L(0.5, 0.5, 2.3, 0.85, 0.3, 2.8, 'wall', 2.6), L(0.85, 0.3, 2.8, 0.92, 0.72, 2.45, 'wall', 2.2),
    ['glow', 0.85, 0.3, 2.8, 0.05, 'accent'], B(0.86, 0.68, 2.3, 0.12, 0.12, 0.15, 'dark', F), dot(0.88, 0.88, 1), S(2.9)],
  // Ładownia z portem (śluza i właz), oknami na prawej ścianie i stosem kontenerów na dachu.
  logistics: [B(0.05, 0.1, 0, 0.9, 0.8, 1.6, 'wall2', 'ledge'), B(0.95, 0.12, 0.6, 0.03, 0.76, 1, 'wall2', 'win flush'),
    B(0.3, 0.88, 0, 0.4, 0.03, 0.9, 'dark', F), ['ring', 0.5, 0.92, 0.95, 0.24, 'metal', 'upright'],
    B(0.08, 0.14, 1.6, 0.42, 0.72, 0.42, 'accent'), B(0.52, 0.14, 1.6, 0.4, 0.72, 0.42, 'crystal'), B(0.2, 0.3, 2.02, 0.5, 0.5, 0.4, 'roof'), dot(0.9, 0.5, 1.3), S(2.7)],
  // Biały moduł z oknami i zielonym pasem pod dachem (bez czerwonego krzyża), biała kopułka na bębnie w akcencie.
  medics: [B(0.1, 0.12, 0, 0.8, 0.76, 1, 'wall', 'win'), B(0.1, 0.12, 1, 0.8, 0.76, 0.25, 'green', F), B(0.08, 0.1, 1.25, 0.84, 0.8, 0.08, 'wall2'),
    C(0.5, 0.5, 1.33, 0.26, 0.2, 'accent'), ['dome', 0.5, 0.5, 1.53, 0.26, 'wall'], dot(0.9, 0.88, 1.12), S(2.2)],
  // Trybunał: kolumny, belkowanie i kopułka w kolorze działu.
  spacelaw: [B(0.04, 0.04, 0, 0.92, 0.92, 0.12, 'wall2'), B(0.16, 0.12, 0.12, 0.68, 0.62, 1, 'wall2', 'win'), ...[0.18, 0.42, 0.66].map((u) => C(u, 0.86, 0.12, 0.05, 0.95, 'wall')),
    ...[0.2, 0.44].map((v) => C(0.86, v, 0.12, 0.05, 0.95, 'wall')), C(0.86, 0.86, 0.12, 0.05, 0.95, 'wall'), B(0.06, 0.06, 1.07, 0.88, 0.88, 0.12, 'wall'),
    C(0.5, 0.5, 1.19, 0.3, 0.14, 'accent'), ['dome', 0.5, 0.5, 1.33, 0.3, 'metal'], dot(0.5, 0.5, 1.95), S(2.1)],
  // Rafineria: zbiornik, hala, wieża wiertnicza i taśmociąg z rudą.
  miners: [C(0.28, 0.28, 0, 0.22, 1, 'metal'), ['dome', 0.28, 0.28, 1, 0.22, 'metal'], B(0.5, 0.12, 0, 0.42, 0.42, 1, 'wall2', 'win'),
    ...[[0.55, 0.75], [0.95, 0.75], [0.75, 0.55]].map(([u, v]) => L(u, v, 0, 0.75, 0.75, 1.6, 'metal', 1.4)), B(0.67, 0.67, 1.05, 0.16, 0.16, 0.25, 'accent', F),
    L(0.75, 0.75, 0, 0.75, 0.75, 1.05, 'dark', 1), L(0.1, 0.92, 0.08, 0.55, 0.55, 1, 'dark', 2.6), ['dome', 0.14, 0.86, 0, 0.12, 'crystal'], dot(0.92, 0.33, 0.5), S(2.2)],
  // Szklarnia: zielona kopuła z żebrami na bębnie z oknami i mała śluza.
  terraformers: [shade(0.5, 0.5, 0.46, 1.18), ...stack(0.5, 0.5, 0, 0.46, [[0.1, 'wall2'], [0.08, 'accent'], [1, 'wall2', 'win']]), ['dome', 0.5, 0.5, 1.18, 0.44, 'green'],
    ...[[0.94, 0.5], [0.81, 0.81], [0.5, 0.94]].map(([u, v]) => L(u, v, 1.18, 0.5, 0.5, 2.22, 'glass', 1)), C(0.5, 0.5, 2.16, 0.1, 0.1, 'wall'), dot(0.5, 0.5, 2.31),
    B(0.86, 0.36, 0, 0.12, 0.28, 0.3, 'wall', F), S(2.55)],
};

// Łazik (na wyspach z powierzchnią) jeździ po koleinach wzdłuż lewej przedniej krawędzi; na pokładzie nie ma pojazdów.
function extras(m, lay) {
  const h = lay.size / 2, y = h - 0.12, n = m.depts.length;
  if (!surfaceOf(m)) return {};
  const P = (x, v) => pt(iso(x, v)), rovers = 1 + (n >= 6);
  return {
    back: `<path d="M${P(-h, y - 0.05)}L${P(h, y - 0.05)}M${P(-h, y - 0.2)}L${P(h, y - 0.2)}" stroke="#0b1020" stroke-opacity=".22" stroke-width="1.3" stroke-dasharray="3 2"/>`,
    anim: Array.from({ length: rovers }, (_, i) => drive({ gx: -h, gy: y, axis: 'x', len: 2 * h }, `<g transform="scale(.5)">${SIDE_ART.rover()}</g>`,
      { dur: 18 + i * 4, delay: -i * 9, id: `rover${i}` })),
    vehicles: rovers,
  };
}

export const SPACE_ART = { id: 'space', palette: PALETTES.space, suit: '#f1f5fb', coreForm, coreFoot, core, depts: DEPTS, extras };
