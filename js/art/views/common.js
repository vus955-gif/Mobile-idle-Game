// Wspólne elementy przepisów widoków: szkielet przepisu i kosmiczne tło ze stałą gęstością gwiazd.
import { seedOf, gradient } from './placeholder.js';
import { stars, milkyBand } from '../kit/sky.js';

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
