// Części brył dioram: palety etapów, składanie listy Part w SVG, emblemat, obsada, budżet animacji, pojazdy i drobna
// grafika przeniesiona ze sceny. Czysty JS bez DOM. W Part środek (x, y) mają cyl, dome, ring, dish, glow, mast i okrągły shadow,
// punktem są label, sign i początek strut, a rogiem — box, pyr, gable, panel i prostokątny shadow.
import { TW, LV, RX, iso, tones, box, pyr, gable, cyl, dome, ring, shadow, windows, mixRgb, css, rgb, n as r1 } from './iso.js'; // r1: zaokrąglenie do 0,1 bez „-0”

export function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// c to #rrggbb, rgb() albo [r, g, b]; f < 1 przyciemnia, f > 1 rozjaśnia.
export function shade(c, f) {
  let [r, g, b] = rgb(c);
  if (f <= 1) { r *= f; g *= f; b *= f; } else { const t = f - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Palety etapów: materiały brył i podłoże wyspy.

export const PALETTES = {
  earth: { wall: '#f3e3c7', wall2: '#e9c1a6', glass: '#8fc8e8', roof: '#d4725a', metal: '#b8c4cf', dark: '#4b4a63', crystal: '#9be0ef', green: '#6dbb78', ground: '#93cf80' },
  space: { wall: '#e6edf5', wall2: '#aebfd6', glass: '#5aa7e0', roof: '#7d93b5', metal: '#c9d3df', dark: '#2a3350', crystal: '#ffb84d', green: '#5cc2a0', ground: '#8fa0b5' },
  galaxy: { wall: '#8a6fd0', wall2: '#c05fb8', glass: '#4fd6d0', roof: '#4c3a8f', metal: '#a9a3d6', dark: '#22164a', crystal: '#e86bd0', green: '#38d6b8', ground: '#594c92' },
  universe: { wall: '#2c2a36', wall2: '#f0ead9', glass: '#bfb4e8', roof: '#d4a437', metal: '#e3c872', dark: '#0e0d14', crystal: '#fff2c4', green: '#a8b86a', ground: '#d2c7dd' },
};

// Obsada: progi, gęstość i budżet animacji.
export const SEATS = [1, 5, 15, 40, 100];
export const tierFor = (heads) => SEATS.filter((t) => heads >= t).length; // 0..5

// Gęstość obsady według progu (lit = udział świecących okien nocą).
export const CREW = [[0, 0.15, 0], [1, 0.35, 0], [2, 0.55, 0], [3, 0.75, 1], [4, 0.9, 1], [5, 1, 2]]
  .map(([people, lit, vehicles]) => ({ people, lit, vehicles }));

export const MAX_ANIM = 40; // elementów animowanych w całej dioramie
export function budget(max = MAX_ANIM) {
  const b = { used: 0, take() { if (b.used >= max) return false; b.used++; return true; } };
  return b;
}

const SNOWY = new Set(['roof', 'wall', 'wall2', 'metal', 'green']); // śnieg bieli górę tych materiałów (nie szkła, kryształu, akcentu)

// Rysuje części (od tyłu) przesunięte o ctx.at; ctx = { at, palette, accent, light, lit, snow, seed, company, budget }.
// Bryła dostaje cień przed ścianami (bez flagi 'flush': detal na ścianie); 'win' (box, cyl) daje okna, 'ledge' (box) gzyms. Zwraca svg,
// anim (światła masztów z budżetu), anchor (rzut punktu sign) i box (ekranowy prostokąt części, zaokrąglony na zewnątrz).
// Id gradientu glow to `d-glow-${seed}-${i}`, więc seed musi być różny w jednym dokumencie.
export function assemble(parts, ctx) {
  const { at, palette, light, seed } = ctx, anim = [];
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  let svg = '', anchor = null;
  const P = (x, y, z) => iso(at[0] + x, at[1] + y, at[2] + z).map(r1);
  const grow = (x0, y0, x1 = x0, y1 = y0) => {
    bb[0] = Math.min(bb[0], x0); bb[1] = Math.min(bb[1], y0); bb[2] = Math.max(bb[2], x1); bb[3] = Math.max(bb[3], y1);
  };
  const cub = (w, d, h, p = 0) => [-p, w + p].flatMap((u) => [-p, d + p].flatMap((v) => [0, h].map((e) => [u, v, e])));
  const col = (m) => (m === 'accent' ? ctx.accent : palette[m]);
  const paint = (c, m) => tones(c, light, { snow: !!ctx.snow && SNOWY.has(m) });
  const tone = (m) => paint(col(m), m);
  // Okna widocznych ścian (faces: 'l', 'r'): rows = floor(h), świecą w udziale ctx.lit, osobne ziarno na ścianę.
  const wins = (b, i, faces = 'lr') => ['left', 'right'].map((face, f) => {
    const rows = Math.floor(b.h), len = face === 'left' ? b.w : b.d;
    return rows < 1 || !faces.includes(face[0]) ? '' : windows(b, face, { rows, cols: Math.max(1, Math.round(len * 2)), lit: ctx.lit, seed: seed * 64 + i * 2 + f + 1 }, light);
  }).join('');

  for (const [i, part] of parts.entries()) {
    const [kind, x, y, z] = part, gx = at[0] + x, gy = at[1] + y, gz = at[2] + z, r = part[4];
    const tops = (list) => { for (const [u, v, e] of list) grow(...P(x + u, y + v, z + e)); };
    const sq = (h) => ({ gx: gx - 0.7 * r, gy: gy - 0.7 * r, gz, w: 1.4 * r, d: 1.4 * r, h }); // kwadrat wpisany w okrąg
    if (kind === 'box' || kind === 'pyr' || kind === 'gable') {
      // ax: pierwsze słowo flag to oś dachu (gable) albo ostrosłupa na boku (pyr 'x', np. 'x flush' — dziób bez własnego cienia).
      const [, , , , w, d, h, m, extra = ''] = part, b = { gx, gy, gz, w, d, h }, t = tone(m), ax = extra.split(' ')[0];
      const ledge = kind === 'box' && extra.includes('ledge'), pd = ledge ? 0.08 : 0;
      // Cienki detal na ścianie ('flush', grubość ≤ 0,05): tylko ściana widoczna od frontu, bez wierzchu i kreski krawędzi.
      const thin = extra.includes('flush') && Math.min(w, d) <= 0.05 && { rim: false, faces: Math.max(w, d) <= 0.05 ? 'lr' : d < w ? 'l' : 'r' };
      if (!extra.includes('flush')) svg += shadow(b, light);
      if (kind === 'box') svg += box(b, t, thin || {}) + (extra.includes('win') ? wins(b, i, (thin || {}).faces) : ''); // cienki: okna tylko na jego ścianie
      else svg += (kind === 'pyr' ? pyr : gable)(b, t, ax);
      if (ledge) svg += box({ gx: gx - pd, gy: gy - pd, gz: gz + h - 0.25, w: w + 2 * pd, d: d + 2 * pd, h: 0.25 }, paint(mixRgb(col(m), [255, 255, 255], 0.25), m), { rim: false });
      if (kind === 'box') tops(cub(w, d, h, pd));
      else if (kind === 'pyr' && ax === 'x') tops([[0, 0, h], [0, d, h], [0, d, 0], [w, d / 2, h / 2]]); // dziób na boku
      else tops([...cub(w, d, 0), ...(kind === 'pyr' ? [[w / 2, d / 2, h]] : ax === 'x' ? [[0, d / 2, h], [w, d / 2, h]] : [[w / 2, 0, h], [w / 2, d, h]])]);
    } else if (kind === 'cyl') {
      const [, , , , , h, m, extra = ''] = part, [cx, yb] = P(x, y, z), yt = P(x, y, z + h)[1];
      // Cienki walec (kolumna, rura, r < 0,06) i walec 'flush' (pas na innym walcu) bez cienia.
      svg += (r < 0.06 || extra.includes('flush') ? '' : shadow(sq(h), light)) + cyl({ gx, gy, gz, r, h }, tone(m)) + (extra.includes('win') ? wins(sq(h), i) : '');
      grow(cx - r * RX, yt - r * RX / 2, cx + r * RX, yb + r * RX / 2);
    } else if (kind === 'dome') {
      // part[6] 'flush': kopuła bez własnego cienia (np. kula zawieszona nad podstawą).
      const [cx, cy] = P(x, y, z), rx = r * RX;
      svg += (String(part[6] ?? '').includes('flush') ? '' : shadow(sq(rx / LV), light)) + dome({ gx, gy, gz, r }, tone(part[5]));
      grow(cx - rx, cy - rx, cx + rx, cy + rx / 2);
    } else if (kind === 'ring') {
      // part[7]: opcje stojącego pierścienia (u, v jak w iso.ring); v rozciąga prostokąt w pionie (bez v jak dla zwykłego, z zapasem).
      const [cx, cy] = P(x, y, z), flat = part[6] === 'flat', o = part[7], rx = flat ? r * RX : r * TW / 2, ry = flat ? r * RX / 2 : o ? (o.v ?? r * RX) + r * TW / 4 : r * RX;
      svg += ring({ gx, gy, gz, r }, tone(part[5]), part[6], o);
      grow(cx - rx, cy - ry, cx + rx, cy + ry);
    } else if (kind === 'dish') {
      const t = tone('metal'), [cx, cy] = P(x, y, z), R = r * RX, dy = r1(cy - 1.3 * R), c = `${cx} ${dy}`;
      svg += `<path d="M${cx} ${cy}V${dy}" stroke="${t.right}" stroke-width="1.4"/>`
        + `<g transform="rotate(-28 ${c})"><ellipse cx="${cx}" cy="${dy}" rx="${r1(R)}" ry="${r1(R * 0.55)}" fill="${t.left}"/>`
        + `<ellipse cx="${cx}" cy="${dy}" rx="${r1(R * 0.8)}" ry="${r1(R * 0.4)}" fill="${t.top}"/></g>`
        + `<path d="M${c}l${r1(R * 0.55)} ${r1(-R * 0.75)}" stroke="${t.top}" stroke-width="1" stroke-linecap="round"/>`;
      grow(cx - R, dy - 1.1 * R, cx + R, cy);
    } else if (kind === 'panel') {
      const [, , , , w, d] = part, t = paint(mixRgb(col('glass'), col('dark'), 0.5), 'glass'), q = (u, v) => P(x + u * w, y + v * d, z + 0.1).join(' ');
      svg += box({ gx, gy, gz, w, d, h: 0.1 }, t) + `<path d="${[1 / 3, 2 / 3].map((u) => `M${q(u, 0)}L${q(u, 1)}M${q(0, u)}L${q(1, u)}`).join('')}" fill="none" stroke="${t.rim}" stroke-opacity=".45" stroke-width=".5"/>`;
      tops(cub(w, d, 0.1));
    } else if (kind === 'mast') {
      // Słup jest statyczny; światło miga w warstwie animacji, o ile starczy budżetu.
      const [bx, by] = P(x, y, z), [tx, ty] = P(x, y, z + r), blink = ctx.budget.take();
      const lamp = `<circle${blink ? ` class="blink" style="animation-delay:${(((seed + i) % 7) * 0.2).toFixed(1)}s"` : ''} cx="${tx}" cy="${ty}" r="1.8" fill="#ff4d4d" stroke="#ff4d4d" stroke-opacity=".35" stroke-width="3"/>`;
      svg += `<path d="M${bx} ${by}L${tx} ${ty}" stroke="${tone('metal').top}" stroke-width="1.2" stroke-linecap="round"/>`;
      if (blink) anim.push(lamp); else svg += lamp;
      grow(bx - 3.5, ty - 3.5, bx + 3.5, by);
    } else if (kind === 'glow') {
      // Rdzeń o promieniu r i poświata z gradientu radialnego (bez filtra); prostokąt obejmuje całą poświatę.
      // Dioda (r < 0,06, poświata ok. 2 jednostek) to jasne kółko bez gradientu.
      const [cx, cy] = P(x, y, z), c = col(part[5]), id = `d-glow-${seed}-${i}`, R = r1(r * RX / 0.45);
      svg += r < 0.06 ? `<circle cx="${cx}" cy="${cy}" r="${r1(r * RX * 1.5)}" fill="${css(mixRgb(c, [255, 255, 255], 0.45))}"/>`
        : `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${css(mixRgb(c, [255, 255, 255], 0.7))}"/><stop offset=".45" stop-color="${css(c)}"/>`
        + `<stop offset="1" stop-color="${css(c)}" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id})"/>`;
      grow(cx - R, cy - R, cx + R, cy + R);
    } else if (kind === 'label') {
      // Tabliczka w · TW/2: tekst (part[6] albo nazwa firmy) w punktach kodowych, skrócony do max, escapowany po skróceniu;
      // part[7] to barwa neonu. Czcionka ≥ 5, więc dłuższy napis poszerza tabliczkę.
      const [, , , , w, max, txt = ctx.company, ink] = part, chars = Array.from(String(txt ?? ''));
      if (!chars.length) continue;
      const text = chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join(''), k = 0.6 * Array.from(text).length;
      const [cx, cy] = P(x, y, z), fs = Math.max(5, Math.min(7, (w * TW / 2 - 4) / k)), W = Math.max(w * TW / 2, k * fs + 4), H = fs + 3;
      svg += `<rect x="${r1(cx - W / 2)}" y="${r1(cy - H / 2)}" width="${r1(W)}" height="${r1(H)}" rx="${r1(H / 4)}" fill="#11172b" fill-opacity=".85"${ink ? ` stroke="${ink}"` : ''}/>`
        + `<text x="${cx}" y="${cy}" dy=".35em" font-size="${r1(fs)}" font-weight="700" text-anchor="middle" fill="${ink ?? '#f5f1e6'}">${esc(text)}</text>`;
      grow(cx - W / 2, cy - H / 2, cx + W / 2, cy + H / 2);
    } else if (kind === 'strut') {
      // Zastrzał: kreska do (part[4], part[5], part[6]) — noga, kratownica, ramię, lina; part[8] to grubość.
      const [, , , , x2, y2, z2, m, sw = 1.6] = part, a = P(x, y, z), b = P(x2, y2, z2);
      svg += `<path d="M${a.join(' ')}L${b.join(' ')}" stroke="${tone(m).left}" stroke-width="${sw}" stroke-linecap="round"/>`;
      grow(Math.min(a[0], b[0]) - 1, Math.min(a[1], b[1]) - 1, Math.max(a[0], b[0]) + 1, Math.max(a[1], b[1]) + 1);
    } else if (kind === 'shadow') {
      // Sam cień bryły o wysokości part[5] na płaszczyźnie z: walca r (np. pod nogami) albo prostokąta r × part[6] od rogu (x, y).
      svg += shadow(part[6] ? { gx, gy, gz, w: r, d: part[6], h: part[5] } : sq(part[5]), light);
    } else if (kind === 'sign') anchor = P(x, y, z);
    else throw new TypeError(`assemble: nieznana część „${kind}”`);
  }
  const fin = bb[0] === Infinity ? [0, 0, 0, 0] : [Math.floor(bb[0]), Math.floor(bb[1]), Math.ceil(bb[2]), Math.ceil(bb[3])];
  return { svg, anim, anchor, box: fin };
}

export const ER = 11; // promień emblematu
const STEM = 5; // trzonek między kołem a punktem zaczepienia

// Środek koła emblematu zaczepionego w `at` (kotwica z assemble): nad nim o trzonek i promień.
export const emblemCenter = ([x, y], r = ER) => [r1(x), r1(y - STEM - r)];

// Ciemny obrys, koło w kolorze działu z białym pierścieniem, emoji i trzonek do punktu zaczepienia.
export function emblem({ icon, color }, at, r = ER) {
  const [cx, cy] = emblemCenter(at, r);
  return `<path d="M${r1(at[0])} ${r1(at[1])}V${cy}" stroke="#10152a" stroke-width="2.6" stroke-linecap="round"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r1(r + 1.7)}" fill="#10152a"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r1(r)}" fill="${esc(color)}" stroke="#fff" stroke-width="1.6"/>`
    + `<text x="${cx}" y="${cy}" dy=".35em" font-size="${r1(1.15 * r)}" text-anchor="middle">${esc(icon)}</text>`;
}

// Pojazd z boku jedzie po drodze od (gx, gy, gz) wzdłuż osi o długości len kafelków. Grupa `car` ma animację translateX z CSS
// (560 jednostek w `dur` s, więc na krótkiej drodze auto widać tylko część cyklu); grupa nad nią ścina poziom do osi 2:1
// i przycina do pasa drogi. Po osi y auto jedzie w górę i w prawo, więc początek jest na jej drugim końcu.
export function drive({ gx, gy, gz = 0, axis, len }, art, { dur, delay, id }) {
  const [x, y] = axis === 'x' ? iso(gx, gy, gz) : iso(gx, gy + len, gz);
  return `<defs><clipPath id="d-clip-${id}"><rect x="0" y="-24" width="${r1(len * TW / 2)}" height="29"/></clipPath></defs>`
    + `<g transform="matrix(1 ${axis === 'x' ? 0.5 : -0.5} 0 1 ${r1(x)} ${r1(y)})" clip-path="url(#d-clip-${id})">`
    + `<g class="car" style="animation-duration:${dur}s;animation-delay:${delay}s">${art}</g></g>`;
}

// Pojazdy z boku bez opakowania: grunt w y = 0, początek w x = 0 (auto 34 × 17, łazik 28 × 23, prom 33 × 9 w zawisie).
export const SIDE_ART = {
  car: (color = '#ff6b6b') => `<rect x="0" y="-9" width="34" height="9" rx="3" fill="${color}"/><path d="M7 -9 l4 -6 h11 l5 6z" fill="${color}"/><path d="M12 -14 h4.5 v4.5 h-7.5z M18 -14 h3.6 l3.2 4.5 h-6.8z" fill="#cfe9ff" opacity=".85"/><circle cx="8" cy="0" r="3.2" fill="#1d1f2e"/><circle cx="26" cy="0" r="3.2" fill="#1d1f2e"/><rect x="31" y="-7" width="3" height="2" rx="1" fill="#fff5b0"/>`,
  rover: () => `<rect x="2" y="-10" width="26" height="7" rx="2" fill="#e5e7eb"/><rect x="8" y="-15" width="10" height="5" rx="1" fill="#93c5fd"/><line x1="22" y1="-10" x2="25" y2="-20" stroke="#cbd5e1" stroke-width="1"/><circle cx="25" cy="-21" r="1.6" fill="#f87171"/><circle cx="7" cy="-1" r="3" fill="#374151"/><circle cx="16" cy="-1" r="3" fill="#374151"/><circle cx="25" cy="-1" r="3" fill="#374151"/>`,
  shuttle: () => `<ellipse cx="2" cy="-8" rx="3.4" ry="2.2" fill="#f0abfc" opacity=".85"/><path d="M3 -10Q7 -16 17 -16L30 -11Q33 -9.5 30 -8L4 -7Z" fill="#ece8ff"/><path d="M18 -15.2L26 -11.8H18Z" fill="#4fd6d0"/><path d="M5 -9H29" stroke="#c05fb8" stroke-width="1.3"/>`,
};

// Ludzie, drzewa i ozdoby ze sceny: stopa lub pień w (x, y), s = skala.
const place = (x, y, s) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">`;
const SHIRTS = ['#ff6b8a', '#ffb347', '#6ee7b7', '#60a5fa', '#c084fc', '#f472b6', '#facc15', '#34d399', '#fb923c', '#a5b4fc'];
const SKIN = ['#f5d0b5', '#e8b796', '#c98e6b', '#8d5a3b', '#f1c9a5'];
const HAIR = ['#2b1d16', '#5a3825', '#d9a441', '#1b1b1b', '#8b4a2b', '#c0c0c0'];

// Bez `delay` postać jest statyczna; z `delay` (s) ma klasę `person` (kołysanie) i idzie do warstwy animacji.
// suit (barwa) to kombinezon z pasem w barwie koszulki (kontrast na jasnym gruncie), hełmem i szybką zamiast twarzy i włosów.
export function person(x, y, rnd, s = 1, delay, suit) {
  const shirt = SHIRTS[Math.floor(rnd() * SHIRTS.length)], skin = SKIN[Math.floor(rnd() * SKIN.length)], hair = HAIR[Math.floor(rnd() * HAIR.length)];
  const body = `<rect x="-5" y="-15" width="10" height="11" rx="4" fill="${suit ?? shirt}"/>` + (suit
    ? `<rect x="-5" y="-10" width="10" height="2.8" fill="${shirt}"/><circle cx="0" cy="-19.5" r="4.4" fill="${suit}"/><rect x="-3" y="-21.6" width="6" height="3.4" rx="1.6" fill="#2b4a7a"/>`
    : `<circle cx="0" cy="-19" r="3.6" fill="${skin}"/><path d="M-3.8 -19.5 a3.8 3.8 0 0 1 7.6 0 q-3.8 -1.6 -7.6 0z" fill="${hair}"/>`);
  return `${place(x, y, s)}${delay === undefined ? body : `<g class="person" style="animation-delay:${delay.toFixed(2)}s">${body}</g>`}</g>`;
}

export const FOLIAGE = {
  spring: ['#4caf6a', '#5cbf78', '#3e9a5c'],
  summer: ['#3e9a5c', '#4caf6a', '#2f8a55'],
  autumn: ['#e8833a', '#d9534f', '#e9b73c'],
};

export function tree(x, y, s, rnd, season = 'summer') {
  const pick = rnd(), g = place(x, y, s);
  const trunk = '<rect x="-2.5" y="-16" width="5" height="16" rx="2" fill="#7a5233"/>';
  if (season === 'winter') {
    return `${g}${trunk}<path d="M0 -16 L0 -34 M0 -24 L-9 -32 M0 -28 L8 -37 M-5 -28 L-9 -36 M4 -33 L2 -40" stroke="#6b4a30" stroke-width="2.2" stroke-linecap="round" fill="none"/><ellipse cx="-9" cy="-33" rx="3.5" ry="1.6" fill="#f4f8ff"/><ellipse cx="8" cy="-38" rx="3.2" ry="1.5" fill="#f4f8ff"/><ellipse cx="2" cy="-41" rx="2.6" ry="1.3" fill="#f4f8ff"/></g>`;
  }
  const pal = FOLIAGE[season] || FOLIAGE.summer, c1 = pal[Math.floor(pick * 3)];
  let extra = '';
  if (season === 'spring') {
    // Dziewięć kwiatów jako kropki (kreska h.1 z okrągłym końcem, średnica 3,6), jedna ścieżka na kolor.
    const r2 = seeded(Math.floor(x * 7 + 3)), dots = ['', ''];
    for (let i = 0; i < 9; i++) dots[i % 2] += `M${(r2() * 26 - 13).toFixed(1)} ${(-14 - r2() * 24).toFixed(1)}h.1`;
    extra += dots.map((d, i) => `<path d="${d}" fill="none" stroke="${i ? '#f7b6cf' : '#ffd6e5'}" stroke-width="3.6" stroke-linecap="round"/>`).join('');
  }
  if (season === 'autumn') {
    const r2 = seeded(Math.floor(x * 5 + 1));
    for (let i = 0; i < 4; i++) extra += `<ellipse cx="${(r2() * 34 - 17).toFixed(1)}" cy="-0.6" rx="2.4" ry="1" fill="${pal[i % 3]}"/>`;
  }
  return `${g}${trunk}<circle cx="0" cy="-26" r="13" fill="${c1}"/><circle cx="-7" cy="-20" r="8" fill="${c1}"/><circle cx="8" cy="-21" r="8.5" fill="${c1}"/><circle cx="-3" cy="-31" r="6" fill="rgba(255,255,255,.12)"/>${extra}</g>`;
}

export function pumpkin(x, y, s = 1) {
  return `${place(x, y, s)}<ellipse cx="0" cy="-5" rx="7" ry="5.5" fill="#f08a24"/><ellipse cx="0" cy="-5" rx="3" ry="5.5" fill="#f59a3a"/><rect x="-1" y="-12.5" width="2" height="3" rx="1" fill="#4a7a2c"/><path d="M-4 -6 l1.5 -1.6 l1.5 1.6z M1 -6 l1.5 -1.6 l1.5 1.6z M-3.5 -3.2 q3.5 2 7 0" fill="#3b1d06" stroke="#3b1d06" stroke-width=".6"/></g>`;
}

export function xmasTree(x, y, s = 1) {
  return `${place(x, y, s)}<rect x="-2" y="-6" width="4" height="6" fill="#7a5233"/><path d="M0 -40 L11 -20 L6 -20 L14 -6 L-14 -6 L-6 -20 L-11 -20 Z" fill="#2f8a55"/><circle cx="-5" cy="-12" r="1.6" fill="#ff5d73"/><circle cx="5" cy="-16" r="1.6" fill="#ffd166"/><circle cx="2" cy="-26" r="1.5" fill="#60a5fa"/><circle cx="-3" cy="-22" r="1.4" fill="#fff"/><path d="M0 -45 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4z" fill="#ffe066"/></g>`;
}

const BULBS = ['#ff5d73', '#ffd166', '#4ade80', '#60a5fa', '#c084fc'];

// Girlanda wzdłuż łamanej `points` ([x, y]), żarówka co 14. Zwraca { svg, blink }: drut z żarówkami (warstwa statyczna)
// i co trzecia żarówka jako halo z klasą `blink` (do warstwy animacji, gdy starczy budżetu).
export function stringLights(points) {
  const blink = [];
  let bulbs = '', k = 0, off = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i], len = Math.hypot(bx - ax, by - ay);
    let s = off;
    for (; s <= len; s += 14, k++) {
      const t = len ? s / len : 0, x = r1(ax + (bx - ax) * t), y = r1(ay + (by - ay) * t + 1.6), c = BULBS[k % BULBS.length];
      bulbs += `<circle cx="${x}" cy="${y}" r="1.7" fill="${c}"/>`;
      if (k % 3 === 0) blink.push(`<circle class="blink" style="animation-delay:${(k * 0.23).toFixed(2)}s" cx="${x}" cy="${y}" r="2.6" fill="${c}" opacity=".7"/>`);
    }
    off = s - len;
  }
  return { svg: `<path d="M${points.map((p) => p.map(r1).join(' ')).join('L')}" fill="none" stroke="#2b2f45" stroke-width=".8"/>${bulbs}`, blink };
}
