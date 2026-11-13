// Szum proceduralny i generator losowy z ziarnem — podstawa wszystkich teł.
// Czysty JS bez DOM: działa w workerze, w przeglądarce i w testach Node.

// Generator liniowy kongruencyjny (32 bity): ten sam seed daje zawsze ten sam ciąg w [0, 1).
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

// Szum Perlina 2D (wersja „improved”). Zwraca funkcję (x, y) → wartość w [−1, 1].
export function perlin(seed) {
  const r = rng(seed);
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const grad = (h, x, y) => {
    switch (h & 7) {
      case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
      case 4: return x; case 5: return -x; case 6: return y; default: return -y;
    }
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xf = Math.floor(x), yf = Math.floor(y);
    const X = xf & 255, Y = yf & 255;
    x -= xf; y -= yf;
    const u = fade(x), v = fade(y), a = p[X] + Y, b = p[X + 1] + Y;
    const g00 = grad(p[a], x, y), g10 = grad(p[b], x - 1, y);
    const g01 = grad(p[a + 1], x, y - 1), g11 = grad(p[b + 1], x - 1, y - 1);
    const l1 = g00 + u * (g10 - g00), l2 = g01 + u * (g11 - g01);
    return (l1 + v * (l2 - l1)) * 0.75;
  };
}

// Szum fraktalny: suma oktaw o rosnącej częstotliwości i malejącej amplitudzie (|wynik| < 1).
export function fbm(n, x, y, octaves, lacunarity = 2.03, gain = 0.5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { s += a * n(x * f, y * f); f *= lacunarity; a *= gain; }
  return s;
}

// Szum „grzbietowy”: ostre nici i grzbiety (kosmiczna sieć, wyładowania). Wynik w [0, 1].
export function ridged(n, x, y, octaves) {
  let s = 0, a = 0.5, f = 1, w = 1;
  for (let i = 0; i < octaves; i++) {
    let v = 1 - Math.abs(n(x * f, y * f));
    v *= v; v *= w;
    w = Math.min(1, v * 2);
    s += v * a; f *= 2.1; a *= 0.5;
  }
  return s;
}

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
// Gładkie przejście 0 → 1 między a i b (Hermite).
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
