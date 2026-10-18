// Klocek dalekiego horyzontu na powierzchni ciał niebieskich (Księżyc, Mars, Merkury, Ceres, Europa, Tytan).
// Trzy pasma terenu z perspektywą powietrzną (dalsze bledsze, gdy jest atmosfera), cieniowane od kierunku światła.
import { perlin, fbm, clamp, sstep, mix } from '../noise.js';
import { pixelLayer, addLayer } from '../canvas.js';

const KINDS = {
  regolith: { lo: [58, 58, 62], hi: [158, 158, 162], amp: 0.1, rough: 1, haze: null },
  rust: { lo: [105, 42, 24], hi: [205, 112, 70], amp: 0.12, rough: 1, haze: [214, 152, 112] },
  ice: { lo: [140, 168, 190], hi: [238, 246, 252], amp: 0.07, rough: 0.8, haze: null },
  dunes: { lo: [92, 56, 24], hi: [186, 124, 62], amp: 0.06, rough: 0.35, haze: [222, 142, 62] },
  rock: { lo: [48, 44, 42], hi: [126, 118, 108], amp: 0.12, rough: 1.2, haze: null },
};

// y — ułamek wysokości, na którym kończy się niebo (linia horyzontu najdalszego pasma);
// light — [x, y] kierunek do światła na ekranie (x w prawo, y w dół); haze — kolor mgiełki atmosfery albo null.
export function horizon(ctx, w, h, { seed, y, kind, haze = undefined, light = [-0.7, -0.5] }) {
  const K = KINDS[kind] || KINDS.regolith;
  const hz = haze === undefined ? K.haze : haze;
  const n = perlin(seed), nt = perlin(seed + 41), s = w / 300;
  const LAYERS = 3;
  // wysokość pasma i w punkcie x (w pikselach płótna; mniejsza wartość = wyżej na ekranie)
  const top = (i, x) => {
    const base = y * h + (i * 0.06) * h;
    const amp = K.amp * h * (1 - i * 0.25);
    const u = x / (110 * s * (1 + i * 0.6));
    const hill = kind === 'dunes' ? (Math.sin(u * 2.1 + i) * 0.5 + 0.5) * 0.6 + fbm(n, u * 0.6, i * 7, 3) * 0.6 : fbm(n, u, i * 7.3, 5) * K.rough + 0.45;
    return base - amp * clamp(hill, 0, 1.4);
  };
  const lx = light[0];
  const layer = pixelLayer(w, h, 0.5, (x, py, out) => {
    let li = -1;
    for (let i = LAYERS - 1; i >= 0; i--) if (py >= top(i, x)) { li = i; break; }
    if (li < 0) return;
    const slope = (top(li, x + 2 * s) - top(li, x - 2 * s)) / (4 * s);
    const lit = clamp(0.6 + slope * lx * -2.2 + (py - top(li, x)) / h * 0.4, 0.15, 1.15);
    const tex = clamp(fbm(nt, x / (14 * s), py / (9 * s), 4) + 0.5);
    let r = mix(K.lo[0], K.hi[0], tex) * lit, g = mix(K.lo[1], K.hi[1], tex) * lit, b = mix(K.lo[2], K.hi[2], tex) * lit;
    if (hz) {
      const far = (LAYERS - 1 - li) / (LAYERS - 1);
      const a = far * 0.55 + sstep(0.25, 0, (py - top(li, x)) / h) * 0.15;
      r = mix(r, hz[0], a); g = mix(g, hz[1], a); b = mix(b, hz[2], a);
    }
    out[0] = r; out[1] = g; out[2] = b; out[3] = 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}
