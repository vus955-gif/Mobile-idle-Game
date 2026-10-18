// Klocek dalekiego horyzontu na powierzchni ciał niebieskich (Księżyc, Mars, Merkury, Ceres, Europa, Tytan).
// Trzy pasma terenu z perspektywą powietrzną (dalsze bledsze, gdy jest atmosfera). Rzeźba liczona w 2D:
// pole wysokości z szumu oświetlone z boku (bez pionowych pasów), do tego zależnie od rodzaju kratery,
// pęknięcia lodu (lineae) albo zmarszczki wydm; jasna krawędź grzbietu i cień u podnóża.
import { perlin, fbm, ridged, clamp, sstep, mix } from '../noise.js';
import { pixelLayer, addLayer } from '../canvas.js';

const KINDS = {
  regolith: { lo: [44, 44, 48], hi: [182, 182, 186], amp: 0.1, rough: 1, haze: null, relief: 1.6, craters: 0.42 },
  rust: { lo: [92, 36, 20], hi: [216, 124, 78], amp: 0.12, rough: 1, haze: [214, 152, 112], relief: 1.1, craters: 0.1 },
  ice: { lo: [120, 148, 172], hi: [242, 249, 254], amp: 0.07, rough: 0.8, haze: null, relief: 0.8, craters: 0, cracks: [150, 88, 60] },
  dunes: { lo: [88, 52, 22], hi: [194, 132, 66], amp: 0.06, rough: 0.35, haze: [222, 142, 62], relief: 0.5, craters: 0 },
  rock: { lo: [38, 35, 33], hi: [146, 137, 126], amp: 0.12, rough: 1.2, haze: null, relief: 1.5, craters: 0.32 },
};
const LAYERS = 3;

// Szybki skrót dwóch liczb całkowitych do [0, 1) — losowe kratery w komórkach siatki.
function hash(ix, iy, salt) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(salt, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// y — ułamek wysokości, na którym kończy się niebo (grzbiet najdalszego pasma);
// light — [x, y] kierunek do światła na ekranie (x w prawo, y w dół); haze — kolor mgiełki atmosfery albo null.
export function horizon(ctx, w, h, { seed, y, kind, haze = undefined, light = [-0.7, -0.5] }) {
  const K = KINDS[kind] || KINDS.regolith;
  const hz = haze === undefined ? K.haze : haze;
  const n = perlin(seed), nt = perlin(seed + 41), nc = perlin(seed + 83), s = w / 300;
  // grzbiet pasma i w punkcie x (mniejsza wartość = wyżej na ekranie); gładki profil
  const top = (i, x) => {
    const base = y * h + i * 0.065 * h;
    const amp = K.amp * h * (1 - i * 0.22);
    const u = x / (120 * s * (1 + i * 0.7));
    const hill = kind === 'dunes'
      ? (Math.sin(u * 2.1 + i * 1.7) * 0.5 + 0.5) * 0.7 + fbm(n, u * 0.6, i * 7, 2) * 0.5
      : fbm(n, u, i * 7.3, 3) * K.rough + 0.45 + fbm(n, u * 4, i * 3.1, 2) * 0.12 * K.rough;
    return base - amp * clamp(hill, 0, 1.4);
  };
  // grzbiety i nachylenia liczone raz na kolumnę warstwy (pixelLayer liczy w połowie rozdzielczości)
  const RES = 0.5, W = Math.max(1, Math.round(w * RES)), cw = w / W;
  const tops = [], slopes = [];
  for (let i = 0; i < LAYERS; i++) {
    const t = new Float32Array(W), sl = new Float32Array(W);
    for (let c = 0; c < W; c++) {
      const x = (c + 0.5) * cw;
      t[c] = top(i, x);
      sl[c] = (top(i, x + 7 * s) - top(i, x - 7 * s)) / (14 * s);
    }
    tops.push(t); slopes.push(sl);
  }
  const [lx, ly] = light, ll = Math.hypot(lx, ly) || 1, Lx = lx / ll, Ly = ly / ll;
  const layer = pixelLayer(w, h, RES, (x, py, out) => {
    const c = Math.min(W - 1, Math.floor(x / cw));
    let li = -1;
    for (let i = LAYERS - 1; i >= 0; i--) if (py >= tops[i][c]) { li = i; break; }
    if (li < 0) return;
    const below = py - tops[li][c];
    // bliższe pasma mają większe formy; pionowe spłaszczenie udaje perspektywę gruntu
    const k = s * (1 + li * 0.55);
    const u = x / (34 * k), v = py / (13 * k);
    // pole wysokości i jego nachylenie (różnice skończone) → światło z boku na grudach i zagłębieniach
    const H = fbm(nt, u, v, 3), e = 0.18;
    const hx = (fbm(nt, u + e, v, 3) - H) / e, hv = (fbm(nt, u, v + e, 3) - H) / e;
    let lit = 0.72 + clamp((-hx * Lx - hv * Ly * 0.7) * 0.38 * K.relief, -0.5, 0.55);
    // duże stoki tuż pod grzbietem: strona zwrócona do światła jaśniejsza
    const face = Math.exp(-below / (9 * s));
    lit *= mix(1, clamp(1 - slopes[li][c] * lx * 3, 0.45, 1.5), face);
    // jasna krawędź grzbietu i cień u podnóża (dalej od grzbietu ciemniej)
    lit *= 1 + 0.35 * Math.exp(-below / (1.6 * s));
    lit *= 1 - 0.28 * sstep(0, 0.12 * h, below);
    // kratery: elipsy w komórkach siatki, wnętrze zacienione od strony światła, jasny wał od niej
    if (K.craters) {
      const cu = x / (26 * k), cv = py / (11 * k), ix = Math.floor(cu), iy = Math.floor(cv);
      if (hash(ix, iy, seed) < K.craters) {
        const r = 0.14 + hash(ix, iy, seed + 1) * 0.22;
        const dx = cu - ix - 0.5 - (hash(ix, iy, seed + 2) - 0.5) * (0.6 - r * 2);
        const dy = cv - iy - 0.5 - (hash(ix, iy, seed + 3) - 0.5) * (0.6 - r * 2);
        const d = Math.sqrt(dx * dx + dy * dy) / r;
        if (d < 1.3) {
          const nx = dx / (d * r + 1e-6), ny = dy / (d * r + 1e-6), toL = nx * Lx + ny * Ly;
          if (d < 1) lit *= 0.82 + d * d * toL * -0.55 + (1 - d) * 0.05;
          else lit *= 1 + toL * 0.55 * (1 - (d - 1) / 0.3);
        }
      }
    }
    // faktura gruntu: jasność z pola wysokości i drobne ziarno
    let tex = clamp(0.5 + H * 0.5 + n(x / (3 * s), py / (2 * s)) * 0.1);
    let r = mix(K.lo[0], K.hi[0], tex) * lit, g = mix(K.lo[1], K.hi[1], tex) * lit, b = mix(K.lo[2], K.hi[2], tex) * lit;
    // Europa: rdzawe pęknięcia lodu (lineae) — cienkie nici szumu grzbietowego
    if (K.cracks) {
      const a = sstep(0.62, 0.8, ridged(nc, u * 0.55 + H, v * 0.55, 2)) * 0.6;
      r = mix(r, K.cracks[0] * lit, a); g = mix(g, K.cracks[1] * lit, a); b = mix(b, K.cracks[2] * lit, a);
    }
    // Tytan: zmarszczki wydm — poprzeczne grzbiety z falującym przebiegiem
    if (kind === 'dunes') {
      const ph = py / (4.5 * k) + fbm(nc, x / (70 * s), py / (30 * s), 2) * 5;
      const f = 1 + Math.cos(ph * 6.283) * 0.16 * -Ly;
      r *= f; g *= f; b *= f;
    }
    if (hz) {
      const far = (LAYERS - 1 - li) / (LAYERS - 1);
      const a = far * 0.55 + (1 - sstep(0, 0.06 * h, below)) * 0.12;
      r = mix(r, hz[0], a); g = mix(g, hz[1], a); b = mix(b, hz[2], a);
    }
    out[0] = r; out[1] = g; out[2] = b; out[3] = 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}
