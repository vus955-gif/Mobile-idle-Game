// Pomocnik testów SVG: wykrywa wartości-widma i niezamknięte grupy oraz liczy luminancję barwy.

// Znaczniki, które muszą się domykać (self-closing `<g/>` jest w porządku).
const PARNE = ['g', 'defs', 'clipPath'];
const WIDMA = ['NaN', 'undefined', 'Infinity', 'null'];

// Sprawdza łańcuch SVG i zwraca liczbę elementów (znaczników otwierających).
// Rzuca przy NaN/undefined/Infinity/null w dowolnym miejscu i przy niezamkniętych <g>, <defs>, <clipPath>.
export function checkSvg(s) {
  for (const w of WIDMA) if (s.includes(w)) throw new Error(`SVG zawiera „${w}”`);
  const glebokosc = Object.fromEntries(PARNE.map((t) => [t, 0]));
  for (const m of s.matchAll(/<(\/?)(g|defs|clipPath)(?=[\s>/])[^>]*>/g)) {
    const [znacznik, zamyka, nazwa] = m;
    if (zamyka) {
      if (--glebokosc[nazwa] < 0) throw new Error(`SVG: nadmiarowe </${nazwa}>`);
    } else if (!znacznik.endsWith('/>')) glebokosc[nazwa]++;
  }
  for (const t of PARNE) if (glebokosc[t] !== 0) throw new Error(`SVG: niezamknięte <${t}>`);
  return { elements: (s.match(/<(?!\/)[a-zA-Z]/g) || []).length };
}

// Luminancja względna sRGB (0–1) z 'rgb(r,g,b)', '#rrggbb' albo '#rgb'.
export function lum(css) {
  let c;
  const m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(css);
  if (m) c = [m[1], m[2], m[3]].map(Number);
  else if (/^#[0-9a-f]{6}$/i.test(css)) c = [1, 3, 5].map((i) => parseInt(css.slice(i, i + 2), 16));
  else if (/^#[0-9a-f]{3}$/i.test(css)) c = [1, 2, 3].map((i) => parseInt(css[i] + css[i], 16));
  else throw new Error(`lum: nieznany zapis barwy „${css}”`);
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
