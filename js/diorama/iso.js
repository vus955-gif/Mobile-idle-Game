// Rzut izometryczny 2:1, trzy tony bryły z klucza światła i prymitywy SVG dioramy: pudełko, dachy, walec,
// kopuła, pierścień, cień i okna. Czysty JS bez DOM: zwraca łańcuchy SVG, działa w przeglądarce i w testach Node.
// Współrzędne bryły: gx, gy w kafelkach, gz i h w poziomach (LV). Oś x biegnie w prawo i w dół, oś y w lewo i w dół.
import { rng } from '../art/noise.js';

export const TW = 40; // szerokość rombu kafelka
export const TH = 20; // wysokość rombu kafelka
export const LV = 12; // wysokość jednego poziomu

// Rzut punktu siatki (kafelki, poziomy) na płaszczyznę rysunku.
export const iso = (gx, gy, gz = 0) => [(gx - gy) * TW / 2, (gx + gy) * TH / 2 - gz * LV];

// Półosie okręgu o promieniu r kafelków na ziemi: rzut 2:1 daje elipsę o stosunku 2:1.
export const RX = TW * Math.SQRT1_2;
const RY = RX / 2;
// Pionowa półoś okręgu stojącego (rzut z elewacji 30°: cos 30° · RX).
const RZ = RX * Math.sqrt(3) / 2;

// --- Kolor ---

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// '#rrggbb', 'rgb(r,g,b)' albo [r,g,b] → [r,g,b].
export function rgb(c) {
  if (Array.isArray(c)) return c.slice(0, 3);
  let m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  if ((m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(c))) return [m[1], m[2], m[3]].map(Number);
  throw new TypeError(`iso.rgb: nieznany zapis barwy „${c}”`);
}

export const css = (c) => `rgb(${rgb(c).map((v) => Math.round(clamp255(v))).join(',')})`;

// Mieszanie liniowe: t = 0 daje a, t = 1 daje b.
export function mixRgb(a, b, t) {
  const x = rgb(a), y = rgb(b);
  return x.map((v, i) => v + (y[i] - v) * t);
}

// --- Tony z klucza światła ---

const K_TOP = 1, K_LIT = 0.78, K_DARK = 0.52; // jasność ścian względem góry
const TINT_MIX = 0.35;    // jak mocno barwa światła zabarwia bryłę
const GAIN_MIN = 0.9;     // ekspozycja przy ambient = 0 (przy ambient = 1 bryła ma pełną jasność)
const FLOOR = 0.62;       // podłoga jasności: mnożnik bryły nie spada poniżej, więc nic nie znika w czerni
const LIT_DIR = 0.2;      // dir[0] powyżej progu oświetla prawy bok, w przeciwnym razie lewy

// Trzy tony bryły: góra, bok oświetlony i bok ciemny, plus kreska krawędziowa.
// kolor = base × mnożnik × tint, mnożnik = max(FLOOR, ekspozycja · (ambient + (1 − ambient) · k)).
// Zwraca też `litSide` ('left' | 'right'): który bok jest od strony światła (potrzebuje go box do kreski krawędzi).
export function tones(base, light, { snow = false } = {}) {
  const a = light.ambient;
  const tint = mixRgb([255, 255, 255], light.color, TINT_MIX).map((v) => v / 255);
  const gain = GAIN_MIN + (1 - GAIN_MIN) * a;
  const paint = (c, k) => {
    const m = Math.max(FLOOR, gain * (a + (1 - a) * k));
    return css(rgb(c).map((v, i) => v * m * tint[i]));
  };
  const litSide = light.dir[0] > LIT_DIR ? 'right' : 'left';
  const top = snow ? mixRgb(base, [255, 255, 255], 0.75) : base;
  return {
    top: paint(top, K_TOP),
    left: paint(base, litSide === 'left' ? K_LIT : K_DARK),
    right: paint(base, litSide === 'right' ? K_LIT : K_DARK),
    rim: css(light.rim),
    rimAlpha: 0.2 + 0.6 * (1 - a),
    litSide,
  };
}

// --- Prymitywy ---

// Liczba zaokrąglona do 0,1, żeby SVG był krótki (i bez „-0”).
export const n = (v) => Math.round(v * 10) / 10 + 0;
// Krycie z dokładnością do 0,01.
const op = (v) => Math.round(v * 100) / 100;
export const pt = (p) => `${n(p[0])} ${n(p[1])}`;

// Wielokąt z uszczelniającą kreską w tym samym kolorze (bez szczelin między ścianami przy wygładzaniu).
export const poly = (pts, fill) =>
  `<path d="M${pts.map(pt).join('L')}Z" fill="${fill}" stroke="${fill}" stroke-width=".5" stroke-linejoin="round"/>`;

// Pudełko: trzy ściany (lewa, prawa, góra) i, gdy rim, kreska krawędzi od strony światła.
// b = { gx, gy, gz = 0, w, d, h }; lewa ściana patrzy w stronę +y, prawa w stronę +x; faces wybiera ściany ('l', 'r', 't').
export function box(b, t, { rim = true, faces = 'lrt' } = {}) {
  const { gx, gy, gz = 0, w, d, h } = b, z = gz + h, has = (k) => faces.includes(k);
  const top = iso(gx, gy, z), r = iso(gx + w, gy, z), f = iso(gx + w, gy + d, z), l = iso(gx, gy + d, z);
  const fr = iso(gx + w, gy + d, gz), lo = iso(gx, gy + d, gz), ro = iso(gx + w, gy, gz);
  let s = (has('l') ? poly([l, f, fr, lo], t.left) : '') + (has('r') ? poly([f, r, ro, fr], t.right) : '') + (has('t') ? poly([top, r, f, l], t.top) : '');
  if (rim) {
    // Kreska biegnie wzdłuż górnego brzegu i pionowego rogu po stronie światła.
    const e = t.litSide === 'right' ? [top, r, ro] : [top, l, lo];
    s += `<path d="M${e.map(pt).join('L')}" fill="none" stroke="${t.rim}" stroke-opacity="${op(t.rimAlpha)}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return s;
}

// Ostrosłup / dach czterospadowy: romb podstawy w tonie góry (widoczny tylko przy niskim szczycie) i dwie ściany z przodu.
export function pyr(b, t) {
  const { gx, gy, gz = 0, w, d, h } = b;
  const top = iso(gx, gy, gz), r = iso(gx + w, gy, gz), f = iso(gx + w, gy + d, gz), l = iso(gx, gy + d, gz);
  const apex = iso(gx + w / 2, gy + d / 2, gz + h);
  return poly([top, r, f, l], t.top) + poly([l, f, apex], t.left) + poly([f, r, apex], t.right);
}

// Dach dwuspadowy; axis to kierunek kalenicy: 'x' albo 'y'. Tył w tonie góry, przód i szczyt jak ściany.
export function gable(b, t, axis) {
  const { gx, gy, gz = 0, w, d, h } = b, z = gz + h;
  const P = (x, y, zz) => iso(gx + x, gy + y, zz);
  if (axis === 'x') {
    const m = d / 2;
    return poly([P(0, 0, gz), P(w, 0, gz), P(w, m, z), P(0, m, z)], t.top)
      + poly([P(0, d, gz), P(w, d, gz), P(w, m, z), P(0, m, z)], t.left)
      + poly([P(w, 0, gz), P(w, d, gz), P(w, m, z)], t.right);
  }
  const m = w / 2;
  return poly([P(0, 0, gz), P(0, d, gz), P(m, d, z), P(m, 0, z)], t.top)
    + poly([P(w, 0, gz), P(w, d, gz), P(m, d, z), P(m, 0, z)], t.right)
    + poly([P(0, d, gz), P(w, d, gz), P(m, d, z)], t.left);
}

// Walec pionowy o środku (gx, gy): korpus w tonie lewym, prawa połowa w tonie prawym, pokrywa w tonie góry.
export function cyl({ gx, gy, gz = 0, r, h }, t) {
  const [cx, yb] = iso(gx, gy, gz), yt = iso(gx, gy, gz + h)[1], rx = r * RX, ry = r * RY;
  return `<path d="M${n(cx - rx)} ${n(yt)}V${n(yb)}A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(yb)}V${n(yt)}Z" fill="${t.left}"/>`
    + `<path d="M${n(cx)} ${n(yt)}V${n(yb + ry)}A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(yb)}V${n(yt)}Z" fill="${t.right}"/>`
    + `<ellipse cx="${n(cx)}" cy="${n(yt)}" rx="${n(rx)}" ry="${n(ry)}" fill="${t.top}"/>`;
}

// Kopuła (półkula) o środku podstawy (gx, gy): sylwetka w tonie lewym, prawa połowa w prawym, blask w tonie góry.
export function dome({ gx, gy, gz = 0, r }, t) {
  const [cx, cy] = iso(gx, gy, gz), rx = r * RX, ry = r * RY;
  const side = t.litSide === 'right' ? 1 : -1;
  return `<path d="M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(rx)} 0 0 1 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 0 1 ${n(cx - rx)} ${n(cy)}Z" fill="${t.left}"/>`
    + `<path d="M${n(cx)} ${n(cy - rx)}A${n(rx)} ${n(rx)} 0 0 1 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 0 1 ${n(cx)} ${n(cy + ry)}Z" fill="${t.right}"/>`
    + `<ellipse cx="${n(cx + side * rx * 0.3)}" cy="${n(cy - rx * 0.55)}" rx="${n(rx * 0.45)}" ry="${n(rx * 0.3)}" fill="${t.top}" fill-opacity=".7"/>`;
}

// Pierścień o środku (gx, gy): pose 'flat' leży na ziemi (krąg, halo), 'upright' stoi w płaszczyźnie x–z (portal).
// Dwie kreski: szeroka w tonie lewym i węższa w tonie góry, co daje wrażenie grubości.
export function ring({ gx, gy, gz = 0, r }, t, pose) {
  const [cx, cy] = iso(gx, gy, gz);
  const stroke = (el) => `${el} fill="none" stroke="${t.left}" stroke-width="3.2"/>${el} fill="none" stroke="${t.top}" stroke-width="1.4"/>`;
  if (pose === 'flat') return stroke(`<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r * RX)}" ry="${n(r * RY)}"`);
  // Okrąg stojący to obraz afiniczny okręgu: cztery krzywe Béziera po sprzężonych średnicach (u w prawo-dół, v w górę).
  const k = 0.5523, ux = r * TW / 2, uy = r * TH / 2, vy = -r * RZ;
  const P = (a, b) => `${n(cx + a * ux)} ${n(cy + a * uy + b * vy)}`;
  const d = `M${P(1, 0)}C${P(1, k)} ${P(k, 1)} ${P(0, 1)}C${P(-k, 1)} ${P(-1, k)} ${P(-1, 0)}`
    + `C${P(-1, -k)} ${P(-k, -1)} ${P(0, -1)}C${P(k, -1)} ${P(1, -k)} ${P(1, 0)}Z`;
  return stroke(`<path d="${d}"`);
}

// --- Cień ---

const SHADOW_LEN = LV / 2; // długość cienia na poziom wysokości, w jednostkach rysunku

// Przesunięcie cienia bryły o wysokości h (poziomy): przeciwnie do kierunku światła, proporcjonalnie do h.
export function shadowOffset(light, h) {
  return [-light.dir[0] * h * SHADOW_LEN, -light.dir[1] * h * SHADOW_LEN];
}

// Otoczka wypukła punktów (łamana Andrew). Cień płaskiej bryły to dokładnie otoczka podstawy i podstawy zsuniętej.
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return half(p).concat(half([...p].reverse()));
}

// Miękki cień bryły na płaszczyźnie gz: obrys podstawy zsunięty o shadowOffset, wypełnienie i półprzezroczysta kreska
// zamiast rozmycia (bez filtrów). Krycie rośnie z (1 − ambient).
export function shadow(b, light) {
  const { gx, gy, gz = 0, w, d, h } = b;
  const base = [iso(gx, gy, gz), iso(gx + w, gy, gz), iso(gx + w, gy + d, gz), iso(gx, gy + d, gz)];
  const [dx, dy] = shadowOffset(light, h);
  const a = 0.14 + 0.36 * (1 - light.ambient);
  const pts = hull([...base, ...base.map(([x, y]) => [x + dx, y + dy])]);
  return `<path d="M${pts.map(pt).join('L')}Z" fill="#0b1020" fill-opacity="${op(a)}" stroke="#0b1020" stroke-opacity="${op(a / 2)}" stroke-width="3" stroke-linejoin="round"/>`;
}

// --- Okna ---

export const NIGHT_AMBIENT = 0.45; // poniżej tej jasności okna świecą
export const WIN_GLOW = '#ffd88a';

const GLASS = [70, 100, 130]; // szyba w dzień przed zabarwieniem światłem

// Okna jednej ściany ('left' albo 'right') jako najwyżej dwie ścieżki: szyby i okna świecące.
// Świecą tylko przy ambient < NIGHT_AMBIENT, a ich udział to lit (0–1); wybór jest losowy z ziarnem.
// W dzień (i dla okien nieświecących) szyba odbija barwę światła.
export function windows(b, face, { rows, cols, lit, seed }, light) {
  const { gx, gy, gz = 0, w, d, h } = b;
  const at = face === 'left'
    ? (u, v) => iso(gx + u * w, gy + d, gz + v * h)
    : (u, v) => iso(gx + w, gy + u * d, gz + v * h);
  const night = light.ambient < NIGHT_AMBIENT, r = rng(seed);
  const cu = 0.8 / cols, cv = 0.76 / rows; // komórka siatki w ułamkach ściany (margines 10% z boków, 12% u góry i u dołu)
  let glass = '', glow = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const u0 = 0.1 + i * cu + cu * 0.22, u1 = u0 + cu * 0.56, v0 = 0.12 + j * cv + cv * 0.22, v1 = v0 + cv * 0.56;
    const q = `M${[at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)].map(pt).join('L')}Z`;
    if (night && r() < lit) glow += q; else glass += q;
  }
  const dim = 0.45 + 0.55 * light.ambient;
  const tint = css(mixRgb(GLASS, light.color, 0.5).map((v) => v * dim));
  return (glass ? `<path d="${glass}" fill="${tint}"/>` : '') + (glow ? `<path d="${glow}" fill="${WIN_GLOW}"/>` : '');
}
