// Wspólne elementy przepisów widoków: szkielet przepisu i kosmiczne tło ze stałą gęstością gwiazd.
import { seedOf, gradient } from './placeholder.js';
import { stars, milkyBand } from '../kit/sky.js';
import { rng } from '../noise.js';
import { glow } from '../canvas.js';

// Właściwy przepis (bez flagi placeholder): focus — główny obiekt w ułamkach kadru, stops — kolory
// gradientu zastępczego na czas liczenia, light — klucz światła (albo funkcja env → klucz).
export function recipe(id, { focus, stops, light, draw, animate = null }) {
  const r = { id, seed: seedOf(id), focus, stops, draw, light: typeof light === 'function' ? light : () => light };
  if (animate) r.animate = animate;
  return r;
}

// Tło kosmiczne: gradient, opcjonalny pas Drogi Mlecznej i gwiazdy. count to liczba gwiazd na kadr 600×800,
// więc gęstość nie zależy od rozdzielczości.
export function spaceBase(ctx, w, h, { stops, seed, count = 900, band = null }) {
  gradient(ctx, w, h, stops);
  if (band) milkyBand(ctx, w, h, { seed: seed + 3, ...band });
  stars(ctx, w, h, { seed, count: Math.round((count * w * h) / (600 * 800)) });
}

// Odległe galaktyki: małe, pochylone owale z poświatą (tło widoków we Wszechświecie).
// area — prostokąt [x0, y0, x1, y1] w ułamkach kadru; size — rozmiar w pikselach projektu (kadr szeroki na 300).
export function distantGalaxies(ctx, w, h, { seed, count, area = [0, 0, 1, 1], size = 1, warm = 0.5, alpha = 0.9 }) {
  const r = rng(seed), k = w / 300, n = Math.round((count * w * h) / (600 * 800));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = (area[0] + r() * (area[2] - area[0])) * w, y = (area[1] + r() * (area[3] - area[1])) * h;
    const s = (0.6 + Math.pow(r(), 4) * 3.2) * size * k, hot = r() < warm;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(r() * Math.PI); ctx.scale(1, 0.3 + r() * 0.7);
    glow(ctx, 0, 0, s * 2.2, hot ? '255,232,200' : '205,220,255', alpha * (0.5 + r() * 0.5));
    ctx.restore();
  }
  ctx.restore();
}
