// Klocki nieba kosmicznego: gwiazdy, pas Drogi Mlecznej, mgławica, kosmiczna sieć, zorza.
// Położenia podajemy jako ułamki kadru (x — szerokości, y — wysokości), a skale w „pikselach projektu”
// kadru szerokiego na 300 (jak w szkicu), więc tło wygląda tak samo w każdej rozdzielczości.
import { rng, perlin, fbm, ridged, clamp, sstep, mix } from '../noise.js';
import { pixelLayer, addLayer, glow } from '../canvas.js';

const unit = (w) => w / 300;
const rgbStr = (c) => `${c[0] | 0},${c[1] | 0},${c[2] | 0}`;

// Gwiazdy o różnych barwach i jasnościach; najjaśniejsze (ok. glowShare) dostają poświatę.
export function stars(ctx, w, h, { seed, count, glowShare = 0.04, tint = null }) {
  const r = rng(seed), k = unit(w), glowFrom = Math.pow(1 - glowShare, 6);
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h, m = Math.pow(r(), 6), t = r();
    let col = t < 0.15 ? [255, 200, 170] : t < 0.35 ? [190, 215, 255] : [255, 250, 240];
    if (tint) col = col.map((c, j) => mix(c, tint[j], 0.3));
    const rad = (0.4 + m * 2.2) * 0.6 * k;
    ctx.fillStyle = `rgba(${rgbStr(col)},${(0.18 + m * 0.8).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    if (m > glowFrom) glow(ctx, x, y, rad * 4.5, rgbStr(col), 0.22);
  }
}

// Pas Drogi Mlecznej: świecąca smuga z szumu wzdłuż prostej przez środek kadru, z ciemniejszym pyłem.
export function milkyBand(ctx, w, h, { seed, angle, width, color, strength = 1 }) {
  const n = perlin(seed), nd = perlin(seed + 101), k = unit(w);
  const ca = Math.cos(angle), sa = Math.sin(angle), half = width * w;
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const dx = x - w / 2, dy = y - h / 2, d = -dx * sa + dy * ca;
    const band = Math.exp(-Math.pow(d / half, 2));
    if (band < 0.01) return;
    const u = x / (170 * k), v = y / (170 * k);
    const dust = sstep(0.08, 0.32, fbm(nd, u * 1.6 + 3, v * 1.6, 4));
    const val = clamp(fbm(n, u, v, 5) * 0.9 + 0.35) * band * strength * (1 - dust * 0.6);
    out[0] = color[0]; out[1] = color[1]; out[2] = color[2]; out[3] = clamp(val) * 255;
  });
  addLayer(ctx, layer, w, h);
}

// Mgławica: gaz z zawirowaniami (domain warping) w barwach palety, jasny rdzeń, ciemne pasma pyłu.
// palette: [kolor A, kolor B, kolor najgorętszych miejsc]; core: { x, y, r } w ułamkach kadru.
export function nebula(ctx, w, h, { seed, palette, core, dust = 0.85, scale = 95 }) {
  const n1 = perlin(seed), n2 = perlin(seed + 16), n3 = perlin(seed + 32), s = scale * unit(w);
  const cx = core.x * w, cy = core.y * h, cr = core.r * w;
  const [A, B, HOT] = palette;
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const u = x / s, v = y / s;
    const wx = fbm(n2, u + 1.7, v + 9.2, 4), wy = fbm(n2, u + 8.3, v + 2.8, 4);
    const gas = fbm(n1, u + 1.6 * wx, v + 1.6 * wy, 6);
    const tint = sstep(-0.25, 0.3, fbm(n3, u * 0.6 + 4, v * 0.6, 3));
    const c = Math.exp(-(Math.pow((x - cx) / cr, 2) + Math.pow((y - cy) / (cr * 1.15), 2)));
    let I = Math.pow(sstep(-0.15, 0.55, gas + c * 0.35), 1.6) * (0.35 + c * 0.9);
    I *= 1 - sstep(0.05, 0.32, fbm(n3, u * 1.4 + 7, v * 1.4 + 3 + wx * 0.8, 5)) * dust;
    const hot = Math.pow(clamp(I), 3);
    out[0] = mix(mix(A[0], B[0], tint), HOT[0], hot);
    out[1] = mix(mix(A[1], B[1], tint), HOT[1], hot);
    out[2] = mix(mix(A[2], B[2], tint), HOT[2], hot);
    out[3] = clamp(I) * 255;
  });
  addLayer(ctx, layer, w, h);
}

// Kosmiczna sieć: cienkie świecące nici (ridged noise), jasne węzły na przecięciach i drobne galaktyki
// ułożone wzdłuż nici.
export function cosmicWeb(ctx, w, h, { seed, scale = 135, color, node, galaxies = 260 }) {
  const n1 = perlin(seed), n2 = perlin(seed + 30), n3 = perlin(seed + 50), s = scale * unit(w);
  const FW = Math.max(1, Math.round(w / 4)), FH = Math.max(1, Math.round(h / 4)), field = new Float32Array(FW * FH);
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const u = x / s, v = y / s;
    const wx = fbm(n3, u + 3, v, 3) * 0.6, wy = fbm(n3, u, v + 5, 3) * 0.6;
    const f = ridged(n1, u + wx, v + wy, 5), f2 = ridged(n2, u * 2.2 + 1, v * 2.2 + 4, 4);
    const fil = Math.pow(sstep(0.62, 0.98, f), 3);
    const nod = Math.pow(sstep(0.62, 1, f * f2 * 1.25), 4);
    const halo = Math.pow(sstep(0.4, 0.95, f), 4) * 0.4;
    const fx = Math.min(FW - 1, (x / 4) | 0), fy = Math.min(FH - 1, (y / 4) | 0);
    field[fy * FW + fx] = fil;
    const a = clamp(fil + halo + nod);
    if (a <= 0) return;
    out[0] = clamp((color[0] * (fil + halo) + node[0] * nod) / a, 0, 255);
    out[1] = clamp((color[1] * (fil + halo) + node[1] * nod) / a, 0, 255);
    out[2] = clamp((color[2] * (fil + halo) + node[2] * nod) / a, 0, 255);
    out[3] = a * 255;
  });
  addLayer(ctx, layer, w, h);
  // galaktyki: losujemy miejsca i zostawiamy tylko te na niciach
  const r = rng(seed + 7), k = unit(w);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let placed = 0, tries = 0; placed < galaxies && tries < galaxies * 60; tries++) {
    const x = r() * w, y = r() * h;
    const f = field[Math.min(FH - 1, (y / 4) | 0) * FW + Math.min(FW - 1, (x / 4) | 0)];
    if (f < 0.25 + r() * 0.5) continue;
    placed++;
    const size = (0.6 + Math.pow(r(), 4) * 3) * k, warm = r() > 0.5;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(r() * Math.PI); ctx.scale(1, 0.4 + r() * 0.6);
    glow(ctx, 0, 0, size * 2.2, warm ? '255,236,200' : '210,225,255', 0.95);
    ctx.restore();
  }
  ctx.restore();
}

// Zorza: pionowe kurtyny światła wzdłuż falującej linii; phase przesuwa fale (do animacji).
export function aurora(ctx, w, h, { seed, colors, y, height, phase = 0 }) {
  const n = perlin(seed), k = unit(w), step = Math.max(2, Math.round(3 * k));
  const [low, high] = colors;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let x = 0; x < w; x += step) {
    const u = x / (90 * k);
    const base = y * h + Math.sin(u * 1.3 + phase) * 18 * k + n(u, phase * 0.3) * 22 * k;
    const len = height * h * (0.45 + 0.55 * clamp(n(u * 2.3 + 5, 1 + phase * 0.2) + 0.5));
    const a = clamp(0.25 + 0.75 * (n(u * 3 + 9, phase * 0.5) + 0.5)) * 0.55;
    if (a < 0.03) continue;
    const g = ctx.createLinearGradient(0, base, 0, base - len);
    g.addColorStop(0, `rgba(${rgbStr(low)},0)`);
    g.addColorStop(0.08, `rgba(${rgbStr(low)},${a.toFixed(3)})`);
    g.addColorStop(0.55, `rgba(${rgbStr(mix3(low, high, 0.6))},${(a * 0.5).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgbStr(high)},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, base - len, step + 0.5, len + 2 * k);
  }
  ctx.restore();
}
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// Animowana zorza: ta sama kurtyna, fale płyną powoli w czasie (t w sekundach).
export function auroraAnimator(opts) {
  return (ctx, w, h, t) => aurora(ctx, w, h, { ...opts, phase: t * 0.25 });
}

// Jasna gwiazda z poświatą i (opcjonalnie) czterema promieniami dyfrakcyjnymi, jak na zdjęciach z teleskopu.
// x, y — ułamki kadru; size — promień poświaty w pikselach projektu (kadr szeroki na 300); spikes — siła promieni.
export function brightStar(ctx, w, h, { x, y, size, color, spikes = 1 }) {
  const X = x * w, Y = y * h, k = unit(w), L = size * k, c = rgbStr(color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, X, Y, L, c, 0.5);
  glow(ctx, X, Y, L * 0.25, '255,255,255', 0.9);
  if (spikes > 0) {
    for (const [ax, ay] of [[1, 0], [0, 1]]) {
      const len = L * 1.7 * spikes;
      const g = ctx.createLinearGradient(X - ax * len, Y - ay * len, X + ax * len, Y + ay * len);
      g.addColorStop(0, `rgba(${c},0)`);
      g.addColorStop(0.5, `rgba(255,255,255,${(0.85 * Math.min(1, spikes)).toFixed(3)})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(0.6, 0.55 * k);
      ctx.beginPath(); ctx.moveTo(X - ax * len, Y - ay * len); ctx.lineTo(X + ax * len, Y + ay * len); ctx.stroke();
    }
  }
  ctx.restore();
}
