// Przepis zastępczy: gradient w kolorach widoku i klucz światła. Służy, dopóki widok nie ma właściwego
// przepisu, a zarządca tła maluje nim też tło na chwilę, zanim policzy się właściwe.

// Ziarno z nazwy widoku (FNV-1a), żeby każdy widok miał własne, stałe ziarno.
export function seedOf(id) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

// Gradient pionowy w trzech kolorach (jak dotychczasowe niebo SVG).
export function gradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, stops[0]); g.addColorStop(0.6, stops[1]); g.addColorStop(1, stops[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// stops — trzy kolory albo funkcja env → trzy kolory; light — klucz światła albo funkcja env → klucz.
export function placeholder(id, stops, light) {
  return {
    id,
    seed: seedOf(id),
    placeholder: true,
    focus: { x: 0.5, y: 0.3 },
    stops,
    draw(ctx, w, h, env) { gradient(ctx, w, h, typeof stops === 'function' ? stops(env) : stops); },
    light: typeof light === 'function' ? light : () => light,
  };
}
