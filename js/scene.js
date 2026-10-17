// Ilustracja biura w SVG: garaż → biurowiec → wieżowiec, a w kosmosie: kapsuła → stacja z modułami.
// Pora dnia zgodna z zegarem urządzenia. Działy (piętra/moduły) bierze z danych aktywnej warstwy.

const W = 360;
const GROUND = 52;
const LOBBY_H = 46;
const FLOOR_H = 34;
const BW = 224;
const BX = (W - BW) / 2;
const SEATS = [1, 5, 15, 40, 100];
// Stacja kosmiczna: moduły jeden nad drugim, z pierścieniami dokującymi pomiędzy.
const MOD_W = 168;
const MOD_X = (W - MOD_W) / 2;
const MOD_GAP = 6;
const STATION_BASE = 30;

const SKIES = {
  night: { stops: ['#070a24', '#141a46', '#2a2f66'], far: '#1d2250', farWin: '#ffd88a', ground: '#1a1f3d', grass: '#1f3a35', glass: '#ffe39a', glassOp: 0.9, wall: 0.55, cloud: 0.18 },
  dawn: { stops: ['#3b3a85', '#c97aa8', '#ffc6a0'], far: '#7c6fa3', farWin: '#ffe7b0', ground: '#4b4f6e', grass: '#4e8a5f', glass: '#ffe6b8', glassOp: 0.8, wall: 0.85, cloud: 0.7 },
  day: { stops: ['#4fa8ff', '#8fd0ff', '#d7f0ff'], far: '#a9c8ea', farWin: '#e6f3ff', ground: '#6b7392', grass: '#62b26f', glass: '#d6efff', glassOp: 0.85, wall: 1, cloud: 0.95 },
  dusk: { stops: ['#2b2763', '#c05f8a', '#ffad7a'], far: '#5d5487', farWin: '#ffd88a', ground: '#3f4263', grass: '#3f7056', glass: '#ffdca0', glassOp: 0.88, wall: 0.75, cloud: 0.6 },
};

export function phaseFor(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 21 || h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17.5) return 'day';
  return 'dusk';
}

// ---------- pory roku, pogoda i święta (wg kalendarza telefonu) ----------
export function seasonFor(d = new Date()) {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}
export function holidayFor(d = new Date()) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 10 && day >= 25) || (m === 11 && day === 1)) return 'halloween';
  if ((m === 12 && day >= 6) || (m === 1 && day <= 6)) return 'xmas';
  return null;
}
export function isNewYear(d = new Date()) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return (m === 12 && day === 31 && d.getHours() >= 20) || (m === 1 && day === 1 && d.getHours() < 3);
}
// Pogoda zmienia się co 3 godziny, ale jest powtarzalna — wszyscy widzą to samo o tej samej porze.
const WEATHER = {
  winter: [['snow', 0.35], ['cloudy', 0.25], ['clear', 0.4]],
  spring: [['rain', 0.22], ['cloudy', 0.23], ['clear', 0.55]],
  summer: [['rain', 0.12], ['cloudy', 0.15], ['clear', 0.73]],
  autumn: [['rain', 0.28], ['fog', 0.1], ['cloudy', 0.24], ['clear', 0.38]],
};
export function weatherFor(d = new Date(), season = seasonFor(d)) {
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let h = Math.imul(key ^ 0x9e3779b9, 2654435761) ^ Math.imul(Math.floor(d.getHours() / 3) + 7, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  let r = (h % 10000) / 10000;
  for (const [w, p] of WEATHER[season]) { r -= p; if (r < 0) return w; }
  return 'clear';
}
// Do testów i zrzutów ekranu: ?env=winter,snow,xmas
function envOverride() {
  const q = globalThis.location?.search || '';
  const m = q.match(/[?&]env=([^&]+)/);
  if (!m) return null;
  const [season, weather, holiday] = decodeURIComponent(m[1]).split(',');
  return { season, weather, holiday: holiday || null };
}
export function envFor(d = new Date()) {
  const o = envOverride();
  const season = o?.season || seasonFor(d);
  const weather = o?.weather || weatherFor(d, season);
  const holiday = o ? o.holiday : holidayFor(d);
  return { season, weather, holiday, newYear: o ? o.holiday === 'newyear' : isNewYear(d), snowCover: season === 'winter' };
}

// Deszcz i śnieg: kafelek powtarzany w pionie, przesuwany jedną animacją CSS.
function precipitation(kind, H) {
  const tile = kind === 'rain' ? 120 : 160;
  const r = seeded(kind === 'rain' ? 21 : 33);
  let cell = '';
  const n = kind === 'rain' ? 26 : 18;
  for (let i = 0; i < n; i++) {
    const x = -20 + r() * (W + 40);
    const y = r() * tile;
    if (kind === 'rain') cell += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 3).toFixed(1)}" y2="${(y + 9).toFixed(1)}"/>`;
    else cell += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + r() * 1.6).toFixed(2)}"/>`;
  }
  let tiles = '';
  for (let y = -tile; y < H; y += tile) tiles += `<g transform="translate(0 ${y})">${cell}</g>`;
  if (kind === 'rain') return `<g class="rain" stroke="#cfe3ff" stroke-width="1.1" stroke-linecap="round" opacity=".55">${tiles}</g>`;
  return `<g class="snow-sway"><g class="snow" fill="#fff" opacity=".9">${tiles}</g></g>`;
}

function pumpkin(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-5" rx="7" ry="5.5" fill="#f08a24"/><ellipse cx="0" cy="-5" rx="3" ry="5.5" fill="#f59a3a"/>
    <rect x="-1" y="-12.5" width="2" height="3" rx="1" fill="#4a7a2c"/><path d="M-4 -6 l1.5 -1.6 l1.5 1.6z M1 -6 l1.5 -1.6 l1.5 1.6z M-3.5 -3.2 q3.5 2 7 0" fill="#3b1d06" stroke="#3b1d06" stroke-width=".6"/></g>`;
}

function xmasTree(x, groundY, s = 1) {
  return `<g transform="translate(${x} ${groundY}) scale(${s})"><rect x="-2" y="-6" width="4" height="6" fill="#7a5233"/>
    <path d="M0 -40 L11 -20 L6 -20 L14 -6 L-14 -6 L-6 -20 L-11 -20 Z" fill="#2f8a55"/>
    <circle cx="-5" cy="-12" r="1.6" fill="#ff5d73"/><circle cx="5" cy="-16" r="1.6" fill="#ffd166"/><circle cx="2" cy="-26" r="1.5" fill="#60a5fa"/><circle cx="-3" cy="-22" r="1.4" fill="#fff"/>
    <path d="M0 -45 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4z" fill="#ffe066"/></g>`;
}

// Girlanda świątecznych lampek wzdłuż krawędzi; część żarówek mruga (warstwa animacji).
function lights(x1, x2, y, sag = 4) {
  const colors = ['#ff5d73', '#ffd166', '#4ade80', '#60a5fa', '#c084fc'];
  let wire = `<path d="M${x1} ${y}`;
  const n = Math.max(4, Math.round((x2 - x1) / 14));
  let bulbs = '';
  for (let i = 0; i <= n; i++) {
    const x = x1 + ((x2 - x1) * i) / n;
    const yy = y + Math.sin((i / n) * Math.PI * Math.round(n / 3)) * sag * 0.5 + sag * 0.5;
    wire += ` L${x.toFixed(1)} ${yy.toFixed(1)}`;
    const c = colors[i % colors.length];
    const b = `<circle cx="${x.toFixed(1)}" cy="${(yy + 1.6).toFixed(1)}" r="1.7" fill="${c}"/>`;
    if (i % 3 === 0) ANIM.push(`<circle class="blink" style="animation-delay:${(i * 0.23).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${(yy + 1.6).toFixed(1)}" r="2.6" fill="${c}" opacity=".7" filter="url(#glowA)"/>`);
    bulbs += b;
  }
  return `${wire}" fill="none" stroke="#2b2f45" stroke-width=".8"/>${bulbs}`;
}

function fireworks(groundY) {
  let out = '';
  const r = seeded(77);
  const colors = ['#ffd166', '#ff5d73', '#60a5fa', '#4ade80', '#c084fc'];
  for (let k = 0; k < 4; k++) {
    const cx = 40 + r() * (W - 80);
    const cy = 30 + r() * (groundY * 0.35);
    const c = colors[k % colors.length];
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays += `<line x1="${(Math.cos(a) * 4).toFixed(1)}" y1="${(Math.sin(a) * 4).toFixed(1)}" x2="${(Math.cos(a) * 18).toFixed(1)}" y2="${(Math.sin(a) * 18).toFixed(1)}"/>`;
    }
    out += `<g transform="translate(${cx.toFixed(0)} ${cy.toFixed(0)})"><g class="firework" style="animation-delay:${(k * 0.9).toFixed(1)}s" stroke="${c}" stroke-width="1.6" stroke-linecap="round">${rays}</g></g>`;
  }
  return out;
}

function bat(y, dur, delay) {
  return `<g class="bat" style="animation-duration:${dur}s;animation-delay:${delay}s"><path transform="translate(0 ${y})" d="M0 0 q4 -5 8 -1 q2 -3 3 0 q1 -3 3 0 q4 -4 8 1 q-5 -1 -7 3 q-1.5 -2 -3 0 q-1.5 -2 -3 0 q-2 -4 -9 -3z" fill="#1a1426"/></g>`;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function shade(hex, f) {
  // f < 1 przyciemnia, f > 1 rozjaśnia (w stronę bieli)
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255; let g = (n >> 8) & 255; let b = n & 255;
  if (f <= 1) { r *= f; g *= f; b *= f; } else { const t = f - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const SHIRTS = ['#ff6b8a', '#ffb347', '#6ee7b7', '#60a5fa', '#c084fc', '#f472b6', '#facc15', '#34d399', '#fb923c', '#a5b4fc'];
const SKIN = ['#f5d0b5', '#e8b796', '#c98e6b', '#8d5a3b', '#f1c9a5'];
const HAIR = ['#2b1d16', '#5a3825', '#d9a441', '#1b1b1b', '#8b4a2b', '#c0c0c0'];

// Animacje SVG są kosztowne na telefonie: wszystko, co się rusza, trafia do osobnej,
// lekkiej warstwy (ANIM), a ciężki budynek rysuje się raz. Ruszamy też tylko część postaci.
let animSeq = 0;
let ANIM = [];
const animate = (every) => (animSeq++ % every) === 0;
const NS = 'http://www.w3.org/2000/svg';
const LAYERS = ['back', 'backAnim', 'front', 'frontAnim'];

function person(x, baseY, rnd, delay) {
  const shirt = SHIRTS[Math.floor(rnd() * SHIRTS.length)];
  const skin = SKIN[Math.floor(rnd() * SKIN.length)];
  const hair = HAIR[Math.floor(rnd() * HAIR.length)];
  const moving = animate(3);
  const svg = `<g${moving ? ' class="person"' : ''} style="animation-delay:${delay.toFixed(2)}s">
    <rect x="${x - 5}" y="${baseY - 15}" width="10" height="11" rx="4" fill="${shirt}"/>
    <circle cx="${x}" cy="${baseY - 19}" r="3.6" fill="${skin}"/>
    <path d="M${x - 3.8} ${baseY - 19.5} a3.8 3.8 0 0 1 7.6 0 q-3.8 -1.6 -7.6 0z" fill="${hair}"/>
  </g>`;
  if (!moving) return svg;
  ANIM.push(svg);
  return '';
}

function deskUnit(x, floorBottom, color, rnd, occupied, delay) {
  // biurko + monitor + (opcjonalnie) osoba
  let out = '';
  const desk = `<rect x="${x - 12}" y="${floorBottom - 11}" width="26" height="2.4" rx="1" fill="#3b3f63"/>`;
  if (occupied) {
    const p = person(x - 3, floorBottom - 2, rnd, delay);
    out += p;
    // ruchoma postać jest w warstwie animacji — blat biurka musi być nad nią
    if (!p) ANIM.push(desk);
  }
  out += desk;
  out += `<rect x="${x + 2}" y="${floorBottom - 19}" width="11" height="8" rx="1.2" fill="#23263f"/>`;
  out += `<rect x="${x + 3}" y="${floorBottom - 18}" width="9" height="6" rx=".8" fill="${color}"/>`;
  if (occupied && animate(4)) ANIM.push(`<rect class="screen" style="animation-delay:${(delay * 1.7).toFixed(2)}s" x="${x + 3}" y="${floorBottom - 18}" width="9" height="6" rx=".8" fill="#fff"/>`);
  out += `<rect x="${x - 10}" y="${floorBottom - 9}" width="2" height="7" fill="#3b3f63"/><rect x="${x + 10}" y="${floorBottom - 9}" width="2" height="7" fill="#3b3f63"/>`;
  return out;
}

function plant(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="-6" width="8" height="6" rx="1.5" fill="#b4693d"/>
    <ellipse cx="-3" cy="-10" rx="3" ry="5" fill="#3fa36a" transform="rotate(-20 -3 -10)"/><ellipse cx="3" cy="-10" rx="3" ry="5" fill="#4fc27e" transform="rotate(20 3 -10)"/><ellipse cx="0" cy="-12" rx="2.6" ry="5.4" fill="#5fd38e"/></g>`;
}

const FOLIAGE = {
  spring: ['#4caf6a', '#5cbf78', '#3e9a5c'],
  summer: ['#3e9a5c', '#4caf6a', '#2f8a55'],
  autumn: ['#e8833a', '#d9534f', '#e9b73c'],
};

function tree(x, groundY, s, rnd, season = 'summer') {
  const pick = rnd();
  const trunk = '<rect x="-2.5" y="-16" width="5" height="16" rx="2" fill="#7a5233"/>';
  if (season === 'winter') {
    return `<g transform="translate(${x} ${groundY}) scale(${s})">${trunk}
      <path d="M0 -16 L0 -34 M0 -24 L-9 -32 M0 -28 L8 -37 M-5 -28 L-9 -36 M4 -33 L2 -40" stroke="#6b4a30" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="-9" cy="-33" rx="3.5" ry="1.6" fill="#f4f8ff"/><ellipse cx="8" cy="-38" rx="3.2" ry="1.5" fill="#f4f8ff"/><ellipse cx="2" cy="-41" rx="2.6" ry="1.3" fill="#f4f8ff"/></g>`;
  }
  const pal = FOLIAGE[season] || FOLIAGE.summer;
  const c1 = pal[Math.floor(pick * 3)];
  let extra = '';
  if (season === 'spring') {
    const r2 = seeded(Math.floor(x * 7 + 3));
    for (let i = 0; i < 9; i++) extra += `<circle cx="${(r2() * 26 - 13).toFixed(1)}" cy="${(-14 - r2() * 24).toFixed(1)}" r="1.8" fill="${i % 2 ? '#f7b6cf' : '#ffd6e5'}"/>`;
  }
  if (season === 'autumn') {
    const r2 = seeded(Math.floor(x * 5 + 1));
    for (let i = 0; i < 4; i++) extra += `<ellipse cx="${(r2() * 34 - 17).toFixed(1)}" cy="-0.6" rx="2.4" ry="1" fill="${pal[i % 3]}"/>`;
  }
  return `<g transform="translate(${x} ${groundY}) scale(${s})">${trunk}
    <circle cx="0" cy="-26" r="13" fill="${c1}"/><circle cx="-7" cy="-20" r="8" fill="${c1}"/><circle cx="8" cy="-21" r="8.5" fill="${c1}"/>
    <circle cx="-3" cy="-31" r="6" fill="rgba(255,255,255,.12)"/>${extra}</g>`;
}

function leaf(x, delay, dur, color) {
  return `<g class="leaf" style="animation-delay:${delay}s;animation-duration:${dur}s"><path transform="translate(${x} -10)" d="M0 0 q3 -3 6 0 q-3 3 -6 0z" fill="${color}"/></g>`;
}

function car(y, color, dur, delay, rev) {
  return `<g class="car${rev ? ' rev' : ''}" style="animation-duration:${dur}s;animation-delay:${delay}s">
    <rect x="0" y="${y - 9}" width="34" height="9" rx="3" fill="${color}"/>
    <path d="M7 ${y - 9} l4 -6 h11 l5 6z" fill="${color}"/>
    <path d="M12 ${y - 14} h4.5 v4.5 h-7.5z M18 ${y - 14} h3.6 l3.2 4.5 h-6.8z" fill="#cfe9ff" opacity=".85"/>
    <circle cx="8" cy="${y}" r="3.2" fill="#1d1f2e"/><circle cx="26" cy="${y}" r="3.2" fill="#1d1f2e"/>
    <rect x="31" y="${y - 7}" width="3" height="2" rx="1" fill="#fff5b0"/>
  </g>`;
}

// ---------- widok z okna: panoramy miast i krajobrazy kosmiczne ----------
// Sylwetki budowli stoją po bokach głównego budynku (lewa strefa x≈0–60, prawa x≈300–360).
function rectWin(x, y, w, h, night, color, every = 8) {
  if (!night) return '';
  let out = '';
  for (let wy = y + 5; wy < y + h - 4; wy += every) {
    for (let wx = x + 3; wx < x + w - 3; wx += 5) if (((wx * 7 + wy * 13) | 0) % 3 === 0) out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2" height="3" fill="${color}" opacity=".85"/>`;
  }
  return out;
}

const LANDMARKS = {
  palace(x, g, c, n, win) { // Pałac Kultury i Nauki
    return `<rect x="${x - 26}" y="${g - 30}" width="52" height="30" fill="${c}"/><rect x="${x - 15}" y="${g - 82}" width="30" height="52" fill="${c}"/>
      <rect x="${x - 11}" y="${g - 104}" width="22" height="22" fill="${c}"/><rect x="${x - 7}" y="${g - 120}" width="14" height="16" fill="${c}"/>
      <rect x="${x - 4}" y="${g - 130}" width="8" height="10" fill="${c}"/><rect x="${x - 1}" y="${g - 158}" width="2" height="28" fill="${c}"/>
      <circle cx="${x}" cy="${g - 112}" r="3" fill="${n ? win : '#e8edf7'}" opacity=".8"/>${rectWin(x - 15, g - 82, 30, 52, n, win)}${rectWin(x - 26, g - 30, 52, 30, n, win)}`;
  },
  varso(x, g, c, n, win) {
    return `<path d="M${x - 8} ${g} V${g - 150} L${x - 2} ${g - 160} L${x + 8} ${g - 150} V${g} Z" fill="${c}"/><rect x="${x - 0.8}" y="${g - 195}" width="1.6" height="36" fill="${c}"/>
      <rect x="${x - 6}" y="${g - 148}" width="2" height="146" fill="#fff" opacity=".12"/>${rectWin(x - 8, g - 145, 16, 140, n, win, 7)}`;
  },
  fernsehturm(x, g, c, n, win) {
    return `<path d="M${x - 6} ${g} L${x - 2.5} ${g - 40} V${g - 98} H${x + 2.5} V${g - 40} L${x + 6} ${g} Z" fill="${c}"/>
      <circle cx="${x}" cy="${g - 106}" r="10" fill="${n ? '#5a6390' : '#cdd3e1'}"/><rect x="${x - 10}" y="${g - 107}" width="20" height="2" fill="${n ? win : '#9aa3bd'}"/>
      <rect x="${x - 1.4}" y="${g - 150}" width="2.8" height="36" fill="${c}"/><rect x="${x - 1.4}" y="${g - 150}" width="2.8" height="8" fill="#e05252"/>`;
  },
  bigben(x, g, c, n, win) {
    return `<rect x="${x - 7}" y="${g - 92}" width="14" height="92" fill="${c}"/><rect x="${x - 8}" y="${g - 92}" width="16" height="4" fill="${c}"/>
      <circle cx="${x}" cy="${g - 80}" r="5" fill="${n ? win : '#f3ead2'}"/><path d="M${x - 8} ${g - 96} L${x} ${g - 122} L${x + 8} ${g - 96} Z" fill="${c}"/>
      <rect x="${x - 0.6}" y="${g - 132}" width="1.2" height="12" fill="${c}"/>${rectWin(x - 7, g - 66, 14, 64, n, win)}`;
  },
  shard(x, g, c, n, win) {
    return `<path d="M${x - 20} ${g} L${x - 2} ${g - 146} L${x + 3} ${g - 132} L${x + 20} ${g} Z" fill="${c}"/><path d="M${x - 2} ${g - 146} L${x + 3} ${g - 132} L${x + 6} ${g}" stroke="#fff" stroke-width=".8" opacity=".25" fill="none"/>${rectWin(x - 12, g - 90, 24, 88, n, win, 9)}`;
  },
  goldenGate(x, g, c, n) {
    const red = n ? '#7a2b25' : '#c0362c';
    const t1 = x - 22; const t2 = x + 22;
    return `<path d="M${x - 70} ${g - 84} Q${t1 - 20} ${g - 40} ${t1} ${g - 84} Q${x} ${g - 20} ${t2} ${g - 84} Q${t2 + 20} ${g - 40} ${x + 70} ${g - 84}" stroke="${red}" stroke-width="1.6" fill="none"/>
      <rect x="${x - 80}" y="${g - 28}" width="160" height="4" fill="${red}"/>
      ${[t1, t2].map((tx) => `<rect x="${tx - 3}" y="${g - 92}" width="2.5" height="92" fill="${red}"/><rect x="${tx + 0.5}" y="${g - 92}" width="2.5" height="92" fill="${red}"/><rect x="${tx - 3}" y="${g - 80}" width="6" height="2" fill="${red}"/><rect x="${tx - 3}" y="${g - 56}" width="6" height="2" fill="${red}"/>`).join('')}`;
  },
  transamerica(x, g, c, n, win) {
    return `<path d="M${x - 13} ${g} L${x} ${g - 118} L${x + 13} ${g} Z" fill="${c}"/><rect x="${x - 0.7}" y="${g - 134}" width="1.4" height="18" fill="${c}"/>
      <path d="M${x - 7} ${g - 70} h-5 v6 h5z M${x + 7} ${g - 70} h5 v6 h-5z" fill="${c}"/>${rectWin(x - 8, g - 60, 16, 58, n, win, 7)}`;
  },
  empire(x, g, c, n, win) {
    return `<rect x="${x - 17}" y="${g - 32}" width="34" height="32" fill="${c}"/><rect x="${x - 12}" y="${g - 96}" width="24" height="64" fill="${c}"/>
      <rect x="${x - 8}" y="${g - 118}" width="16" height="22" fill="${c}"/><rect x="${x - 4}" y="${g - 130}" width="8" height="12" fill="${c}"/>
      <rect x="${x - 1}" y="${g - 160}" width="2" height="30" fill="${c}"/>${rectWin(x - 12, g - 96, 24, 64, n, win)}${rectWin(x - 17, g - 32, 34, 32, n, win)}`;
  },
  chrysler(x, g, c, n, win) {
    const s = n ? '#8f97b8' : '#d6dbe8';
    return `<rect x="${x - 9}" y="${g - 108}" width="18" height="108" fill="${c}"/>
      <path d="M${x - 9} ${g - 108} a9 9 0 0 1 18 0z M${x - 7} ${g - 116} a7 7 0 0 1 14 0z M${x - 5} ${g - 123} a5 5 0 0 1 10 0z M${x - 3} ${g - 129} a3 3 0 0 1 6 0z" fill="${s}"/>
      <rect x="${x - 0.6}" y="${g - 152}" width="1.2" height="24" fill="${s}"/>${rectWin(x - 9, g - 100, 18, 98, n, win)}`;
  },
  tokyoTower(x, g, c, n) {
    const red = n ? '#a2402e' : '#e8452c';
    const wh = n ? '#c9cbe0' : '#ffffff';
    return `<path d="M${x - 24} ${g} L${x - 4} ${g - 118} H${x + 4} L${x + 24} ${g} H${x + 14} L${x + 1} ${g - 70} H${x - 1} L${x - 14} ${g} Z" fill="${red}"/>
      <rect x="${x - 12}" y="${g - 52}" width="24" height="5" fill="${wh}"/><rect x="${x - 7}" y="${g - 92}" width="14" height="4" fill="${wh}"/>
      <rect x="${x - 9}" y="${g - 72}" width="18" height="6" fill="${red}"/><rect x="${x - 1}" y="${g - 150}" width="2" height="34" fill="${red}"/>`;
  },
  seoulTower(x, g, c, n, win) {
    return `<ellipse cx="${x}" cy="${g}" rx="34" ry="22" fill="${shade(c, 0.85)}"/><rect x="${x - 2}" y="${g - 104}" width="4" height="84" fill="${c}"/>
      <rect x="${x - 7}" y="${g - 96}" width="14" height="9" rx="3" fill="${c}"/><rect x="${x - 6}" y="${g - 94}" width="12" height="2" fill="${n ? win : '#e8edf7'}"/>
      <rect x="${x - 0.7}" y="${g - 128}" width="1.4" height="26" fill="${c}"/>`;
  },
  lotte(x, g, c, n, win) {
    return `<path d="M${x - 11} ${g} L${x - 3} ${g - 176} L${x + 3} ${g - 176} L${x + 11} ${g} Z" fill="${c}"/><path d="M${x} ${g - 176} V${g}" stroke="#fff" stroke-width=".7" opacity=".25"/>${rectWin(x - 8, g - 150, 16, 148, n, win, 8)}`;
  },
  marinaBay(x, g, c, n, win) {
    return [-16, 0, 16].map((d) => `<path d="M${x + d - 5} ${g} L${x + d - 4} ${g - 76} H${x + d + 4} L${x + d + 5} ${g} Z" fill="${c}"/>${rectWin(x + d - 4, g - 72, 8, 70, n, win, 7)}`).join('')
      + `<path d="M${x - 30} ${g - 80} H${x + 32} l-3 5 H${x - 28} Z" fill="${shade(c, 1.2)}"/>`;
  },
  supertrees(x, g, c, n) {
    const col = n ? '#6d4bd8' : '#7c5cff';
    return [[-16, 60], [2, 82], [18, 52]].map(([d, h]) => `<path d="M${x + d - 2} ${g} L${x + d - 1} ${g - h} H${x + d + 1} L${x + d + 2} ${g} Z" fill="${c}"/>
      <path d="M${x + d - 12} ${g - h - 6} L${x + d + 12} ${g - h - 6} L${x + d + 2} ${g - h + 6} L${x + d - 2} ${g - h + 6} Z" fill="${col}" ${n ? 'filter="url(#glow)"' : ''}/>`).join('');
  },
  opera(x, g, c, n) {
    const w = n ? '#c6cbe0' : '#f8f8f4';
    return `<rect x="${x - 30}" y="${g - 8}" width="62" height="8" fill="${shade(c, 0.9)}"/>
      ${[[-24, 30], [-12, 40], [2, 36], [14, 26]].map(([d, h]) => `<path d="M${x + d} ${g - 8} Q${x + d + 4} ${g - 8 - h} ${x + d + 16} ${g - 8 - h} Q${x + d + 12} ${g - 20} ${x + d + 16} ${g - 8} Z" fill="${w}"/>`).join('')}`;
  },
  harbour(x, g, c, n) {
    const steel = n ? '#6b7499' : '#8a94b5';
    return `<path d="M${x - 34} ${g - 14} Q${x} ${g - 78} ${x + 34} ${g - 14}" stroke="${steel}" stroke-width="5" fill="none"/>
      <rect x="${x - 44}" y="${g - 22}" width="88" height="3" fill="${steel}"/><rect x="${x - 40}" y="${g - 34}" width="7" height="34" fill="${c}"/><rect x="${x + 33}" y="${g - 34}" width="7" height="34" fill="${c}"/>`;
  },
  cnTower(x, g, c, n, win) {
    return `<path d="M${x - 5} ${g} L${x - 1.6} ${g - 150} H${x + 1.6} L${x + 5} ${g} Z" fill="${c}"/>
      <ellipse cx="${x}" cy="${g - 116}" rx="9" ry="5.5" fill="${c}"/><rect x="${x - 8}" y="${g - 117}" width="16" height="1.6" fill="${n ? win : '#e8edf7'}"/>
      <ellipse cx="${x}" cy="${g - 146}" rx="3.5" ry="2.4" fill="${c}"/><rect x="${x - 0.6}" y="${g - 205}" width="1.2" height="58" fill="${c}"/>`;
  },
  burjKhalifa(x, g, c, n, win) {
    return `<path d="M${x - 12} ${g} V${g - 60} H${x - 9} V${g - 115} H${x - 6} V${g - 160} H${x - 3.5} V${g - 195} H${x - 1.5} L${x} ${g - 240} L${x + 1.5} ${g - 195} H${x + 3.5} V${g - 160} H${x + 6} V${g - 115} H${x + 9} V${g - 60} H${x + 12} V${g} Z" fill="${c}"/>${rectWin(x - 9, g - 150, 18, 148, n, win, 8)}`;
  },
  burjAlArab(x, g, c, n) {
    return `<path d="M${x - 12} ${g} Q${x - 14} ${g - 60} ${x + 10} ${g - 104} L${x + 12} ${g} Z" fill="${n ? '#8c95b8' : '#f2f4fa'}"/><path d="M${x + 10} ${g - 104} V${g}" stroke="${c}" stroke-width="3"/>`;
  },
  hallgrim(x, g, c, n, win) {
    let out = `<path d="M${x - 5} ${g} V${g - 104} L${x} ${g - 124} L${x + 5} ${g - 104} V${g} Z" fill="${c}"/>`;
    [92, 76, 60, 44].forEach((h, i) => {
      out += `<rect x="${x - 11 - i * 6}" y="${g - h}" width="6" height="${h}" fill="${c}"/><rect x="${x + 5 + i * 6}" y="${g - h}" width="6" height="${h}" fill="${c}"/>`;
    });
    return out + `<circle cx="${x}" cy="${g - 96}" r="2.4" fill="${n ? win : '#e8edf7'}"/>`;
  },
  grossmunster(x, g, c, n, win) {
    return `<rect x="${x - 22}" y="${g - 30}" width="44" height="30" fill="${c}"/>${[-13, 13].map((d) => `<rect x="${x + d - 5}" y="${g - 74}" width="10" height="74" fill="${c}"/><path d="M${x + d - 5} ${g - 74} a5 6 0 0 1 10 0z" fill="${c}"/><rect x="${x + d - 0.5}" y="${g - 86}" width="1" height="8" fill="${c}"/>`).join('')}${rectWin(x - 22, g - 30, 44, 30, n, win)}`;
  },
  spires(x, g, c, n, win) {
    return [[-20, 64], [-4, 92], [14, 72]].map(([d, h]) => `<rect x="${x + d - 4}" y="${g - h + 18}" width="8" height="${h - 18}" fill="${c}"/><path d="M${x + d - 4} ${g - h + 18} L${x + d} ${g - h} L${x + d + 4} ${g - h + 18} Z" fill="${n ? '#55607f' : '#5b8c74'}"/>${rectWin(x + d - 4, g - h + 18, 8, h - 18, n, win)}`).join('');
  },
  palms(x, g, c, n) {
    const leaf = n ? '#1f4f3e' : '#2f8a55';
    return [[-14, 46], [8, 58]].map(([d, h]) => `<path d="M${x + d} ${g} q3 ${-h / 2} ${-2} ${-h}" stroke="${n ? '#4b3a2a' : '#8a6a44'}" stroke-width="3" fill="none"/>
      <g transform="translate(${x + d - 2} ${g - h})">${[-60, -20, 20, 60, 160, 200].map((a) => `<path d="M0 0 q${(Math.cos((a * Math.PI) / 180) * 9).toFixed(1)} -6 ${(Math.cos((a * Math.PI) / 180) * 16).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * 8 + 4).toFixed(1)}" stroke="${leaf}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}</g>`).join('');
  },
  towers(x, g, c, n, win) {
    return [[-18, 12, 96], [-4, 14, 128], [12, 12, 84]].map(([d, w, h]) => `<rect x="${x + d - w / 2}" y="${g - h}" width="${w}" height="${h}" fill="${c}"/>${rectWin(x + d - w / 2, g - h, w, h, n, win)}`).join('');
  },
};

// Tło za miastem (góry, zorza) — rysowane zaraz za niebem.
const BACKDROPS = {
  fuji(groundY, night) {
    const m = night ? '#2b3366' : '#8796c4';
    return `<path d="M20 ${groundY} L150 ${groundY - 104} Q180 ${groundY - 114} 210 ${groundY - 104} L340 ${groundY} Z" fill="${m}" opacity=".85"/>
      <path d="M150 ${groundY - 104} Q180 ${groundY - 114} 210 ${groundY - 104} L196 ${groundY - 84} L186 ${groundY - 92} L176 ${groundY - 82} L166 ${groundY - 92} Z" fill="#f4f7ff" opacity="${night ? 0.6 : 0.95}"/>`;
  },
  alps(groundY, night) {
    const m = night ? '#273058' : '#90a0c8';
    let d = `M-60 ${groundY}`;
    const peaks = [[-20, 70], [30, 110], [80, 76], [130, 120], [190, 88], [240, 126], [300, 82], [350, 112], [410, 70]];
    peaks.forEach(([x, h]) => { d += ` L${x} ${groundY - h}`; });
    d += ` L420 ${groundY} Z`;
    const caps = peaks.map(([x, h]) => `<path d="M${x - 12} ${groundY - h + 18} L${x} ${groundY - h} L${x + 12} ${groundY - h + 18} L${x + 4} ${groundY - h + 14} L${x} ${groundY - h + 20} L${x - 5} ${groundY - h + 14} Z" fill="#f4f7ff" opacity="${night ? 0.55 : 0.9}"/>`).join('');
    return `<path d="${d}" fill="${m}" opacity=".85"/>${caps}`;
  },
  aurora(groundY, night) {
    if (!night) return '';
    return `<defs><linearGradient id="aurG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80" stop-opacity="0"/><stop offset=".55" stop-color="#4ade80" stop-opacity=".45"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>
      <path class="aurora" d="M-40 ${groundY * 0.18} C 60 ${groundY * 0.05}, 140 ${groundY * 0.4}, 220 ${groundY * 0.2} S 360 ${groundY * 0.12}, 420 ${groundY * 0.3} L420 ${groundY * 0.55} C 300 ${groundY * 0.4}, 200 ${groundY * 0.62}, 100 ${groundY * 0.45} S -20 ${groundY * 0.5}, -40 ${groundY * 0.5} Z" fill="url(#aurG)"/>`;
  },
};

export const CITY_VIEWS = {
  waw: { left: 'palace', right: 'varso' },
  ber: { left: 'fernsehturm', right: 'towers' },
  tyo: { left: 'tokyoTower', right: 'towers', back: 'fuji' },
  sfo: { left: 'goldenGate', right: 'transamerica' },
  sel: { left: 'seoulTower', right: 'lotte' },
  blr: { left: 'palms', right: 'towers' },
  sao: { left: 'towers', right: 'towers' },
  lon: { left: 'bigben', right: 'shard' },
  nyc: { left: 'empire', right: 'chrysler' },
  lag: { left: 'palms', right: 'towers' },
  syd: { left: 'opera', right: 'harbour' },
  sto: { left: 'spires', right: 'towers' },
  sin: { left: 'supertrees', right: 'marinaBay' },
  rkv: { left: 'hallgrim', right: 'towers', back: 'aurora' },
  dxb: { left: 'burjAlArab', right: 'burjKhalifa' },
  yyz: { left: 'cnTower', right: 'towers' },
  zrh: { left: 'grossmunster', right: 'towers', back: 'alps' },
  tlv: { left: 'palms', right: 'towers' },
};

// Krajobrazy kosmiczne: własne niebo, grunt i ciała niebieskie.
export const SPACE_VIEWS = {
  leo: { dark: true, orbit: true, stops: ['#000006', '#040616', '#0a1030'], ground: '#3a4256', edge: '#6a7495', far: '#2b3350', farWin: '#8fd3ff', stars: true },
  l2: { dark: true, orbit: true, stops: ['#000003', '#020310', '#060a22'], ground: '#3a4256', edge: '#6a7495', far: '#2b3350', farWin: '#8fd3ff', stars: true },
  venus: { dark: false, orbit: true, stops: ['#6b4b12', '#c99a3a', '#f3d27a'], ground: '#e9cf8f', edge: '#f6e3b0', far: '#b8913f', farWin: '#fff3c4', stars: false },
  mercury: { dark: true, stops: ['#000004', '#0a0608', '#1c120c'], ground: '#6f6a66', edge: '#8c8781', far: '#4a4643', farWin: '#ffd88a', stars: true },
  moon: { dark: true, stops: ['#000003', '#04050e', '#0c0e20'], ground: '#80838d', edge: '#a3a6af', far: '#5d616e', farWin: '#ffe39a', stars: true },
  mars: { dark: false, stops: ['#5c2f22', '#b8694a', '#e3a878'], ground: '#a3452a', edge: '#bf5d39', far: '#7a3824', farWin: '#ffd88a', stars: false },
  ceres: { dark: true, stops: ['#000004', '#05050e', '#0f0f22'], ground: '#57514b', edge: '#70675f', far: '#3c3733', farWin: '#ffd88a', stars: true },
  europa: { dark: true, stops: ['#000006', '#050818', '#0e1330'], ground: '#c4dbe8', edge: '#e6f2f9', far: '#86a9bd', farWin: '#fff4c2', stars: true },
  titan: { dark: false, stops: ['#55340f', '#a8692a', '#dda057'], ground: '#73491f', edge: '#8e6234', far: '#55361a', farWin: '#ffe1a0', stars: false },
  proxima: { dark: true, stops: ['#10021c', '#360b3c', '#742848'], ground: '#381532', edge: '#5a2350', far: '#290e29', farWin: '#ff9ecb', stars: true },
};

// Widoki z mostka statku-matki w układach gwiezdnych (statek zawsze dryfuje w przestrzeni).
export const GALAXY_VIEWS = {
  sol: { dark: true, orbit: true, stops: ['#000005', '#05061a', '#0d0f2e'], stars: true },
  alpha: { dark: true, orbit: true, stops: ['#050208', '#140a1c', '#2a1630'], stars: true },
  trappist: { dark: true, orbit: true, stops: ['#0a0103', '#1e0508', '#3a0c10'], stars: true },
  pleiades: { dark: true, orbit: true, stops: ['#01030c', '#06122e', '#0f2552'], stars: true },
  crab: { dark: true, orbit: true, stops: ['#020208', '#0b0a1f', '#1c1236'], stars: true },
  orion: { dark: true, orbit: true, stops: ['#0b0210', '#2a0a2e', '#4d1440'], stars: true },
  omega: { dark: true, orbit: true, stops: ['#060402', '#16100a', '#2b2012'], stars: true },
  lmc: { dark: true, orbit: true, stops: ['#000000', '#020208', '#070a18'], stars: true },
  sgr: { dark: true, orbit: true, stops: ['#050100', '#140602', '#2e0f05'], stars: true },
};
for (const v of Object.values(GALAXY_VIEWS)) Object.assign(v, { ground: '#2a2440', edge: '#4a4070', far: '#1e1a33', farWin: '#c4b5fd' });

// Widoki z cytadeli we wszechświecie: galaktyki, gromady i kraniec obserwowalnego kosmosu.
export const UNIVERSE_VIEWS = {
  milkyway: { stops: ['#000003', '#04030f', '#0b0820'] },
  andromeda: { stops: ['#010208', '#050a1e', '#0d1636'] },
  triangulum: { stops: ['#020206', '#08081a', '#121230'] },
  virgo: { stops: ['#040302', '#100c08', '#221a10'] },
  bullet: { stops: ['#060208', '#14061c', '#260c30'] },
  attractor: { stops: ['#020408', '#061020', '#0c1e38'] },
  bootes: { stops: ['#000000', '#010101', '#030306'] },
  hercules: { stops: ['#030104', '#0e0612', '#1c0c22'] },
  edge: { stops: ['#1a0a04', '#3a1608', '#5a2a10'] },
};
for (const v of Object.values(UNIVERSE_VIEWS)) Object.assign(v, { dark: true, orbit: true, stars: true, ground: '#241a33', edge: '#3d2d55', far: '#1a1228', farWin: '#fde68a' });

// Galaktyka spiralna w kadrze (cx, cy, rozmiar, nachylenie, kolory).
function spiral(cx, cy, r, tilt, rot, arm = '#c7d2fe', core = '#fde68a') {
  let out = `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * tilt}" fill="${arm}" opacity=".1"/>`;
  for (let a = 0; a < 2; a++) {
    let d = '';
    for (let k = 0; k <= 24; k++) {
      const th = (k / 24) * 3.2 + a * Math.PI;
      const rr = r * (0.12 + (k / 24) * 0.88);
      d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(th)).toFixed(1)} ${(cy + rr * tilt * Math.sin(th)).toFixed(1)} `;
    }
    out += `<path d="${d}" stroke="${arm}" stroke-width="${(r / 9).toFixed(1)}" fill="none" opacity=".28" stroke-linecap="round"/>`;
  }
  return `${out}<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.2}" ry="${r * 0.2 * tilt}" fill="${core}" opacity=".8"/></g>`;
}
function elliptical(cx, cy, r, c = '#fde6c0') {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.3}" ry="${r}" fill="${c}" opacity=".12"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 0.6}" ry="${r * 0.46}" fill="${c}" opacity=".35"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 0.2}" ry="${r * 0.16}" fill="#fff8e7"/>`;
}

function universeBodies(view) {
  switch (view) {
    case 'milkyway':
      return spiral(270, 66, 64, 0.38, -14) + spiral(70, 40, 12, 0.5, 30, '#bfdbfe');
    case 'andromeda':
      return spiral(240, 70, 110, 0.32, -28, '#bfdbfe', '#fef3c7') + spiral(60, 36, 16, 0.6, 20);
    case 'triangulum':
      return spiral(270, 64, 52, 0.7, 10, '#a5f3fc', '#e0f2fe') + spiral(80, 44, 22, 0.35, -20);
    case 'virgo':
      return [[260, 60, 22], [300, 92, 12], [220, 96, 9], [190, 46, 7], [320, 40, 8], [90, 70, 6]].map(([x, y, r]) => elliptical(x, y, r)).join('') + spiral(140, 30, 10, 0.4, 15);
    case 'bullet':
      return `<ellipse cx="230" cy="70" rx="56" ry="34" fill="#f472b6" opacity=".22"/><ellipse cx="300" cy="74" rx="40" ry="26" fill="#f472b6" opacity=".22"/>
        <ellipse cx="200" cy="66" rx="44" ry="30" fill="#60a5fa" opacity=".2"/><ellipse cx="320" cy="76" rx="34" ry="24" fill="#60a5fa" opacity=".2"/>
        ${[[200, 66, 8], [214, 76, 5], [320, 76, 7], [308, 66, 4]].map(([x, y, r]) => elliptical(x, y, r)).join('')}`;
    case 'attractor': {
      let out = '<circle cx="270" cy="70" r="40" fill="#93c5fd" opacity=".12"/>';
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        out += `<path d="M${(270 + Math.cos(a) * 160).toFixed(0)} ${(70 + Math.sin(a) * 90).toFixed(0)} Q${(270 + Math.cos(a + 0.4) * 70).toFixed(0)} ${(70 + Math.sin(a + 0.4) * 40).toFixed(0)} 270 70" stroke="#bfdbfe" stroke-width="2" fill="none" opacity=".3"/>`;
      }
      return out + elliptical(270, 70, 10, '#dbeafe');
    }
    case 'bootes':
      return elliptical(310, 40, 4) + spiral(60, 110, 6, 0.5, 10) + `<circle cx="200" cy="80" r="1.4" fill="#fff" opacity=".6"/>`;
    case 'hercules': {
      let out = '<path d="M-40 120 Q 120 40 420 30" stroke="#c4b5fd" stroke-width="40" fill="none" opacity=".08"/>';
      for (let i = 0; i < 26; i++) {
        const x = -20 + i * 17;
        const y = 116 - i * 3.4 + Math.sin(i * 1.7) * 8;
        out += `<ellipse cx="${x}" cy="${y.toFixed(0)}" rx="${(2 + (i % 4)).toFixed(0)}" ry="${(1.2 + (i % 3) * 0.6).toFixed(1)}" fill="#e9d5ff" opacity=".7"/>`;
      }
      return out;
    }
    case 'edge': {
      // poświata Wielkiego Wybuchu: plamy promieniowania tła
      let out = '';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % 420 - 30;
        const y = (i * 53) % 160 + 10;
        out += `<ellipse cx="${x}" cy="${y}" rx="${18 + (i % 5) * 6}" ry="${10 + (i % 4) * 5}" fill="${i % 3 ? '#f59e0b' : '#38bdf8'}" opacity=".12"/>`;
      }
      return out;
    }
    default: return '';
  }
}

function galaxyBodies(view) {
  const star = (x, y, r, c, glow = 2.6) => `<circle cx="${x}" cy="${y}" r="${r * glow}" fill="${c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="${c}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fffbe8"/>`;
  switch (view) {
    case 'sol':
      return `${star(286, 64, 12, '#ffd166')}<ellipse cx="286" cy="64" rx="34" ry="12" fill="none" stroke="#ffe08a" stroke-width="1.5" stroke-dasharray="1.5 3" opacity=".8" transform="rotate(-18 286 64)"/>
        <circle cx="236" cy="88" r="2.2" fill="#60a5fa"/>`;
    case 'alpha':
      return `${star(270, 60, 10, '#ffd166')}${star(300, 76, 7, '#ffb347')}${star(64, 36, 2, '#ff6a3d', 3)}`;
    case 'trappist':
      return `<circle cx="290" cy="70" r="70" fill="#ff3b1f" opacity=".1"/><circle cx="290" cy="70" r="34" fill="#ff5a36" opacity=".35"/><circle cx="290" cy="70" r="22" fill="#ff7a4f"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${40 + i * 30}" cy="${118 - i * 7}" r="${2.2 + (i % 3) * 0.9}" fill="${['#a16207', '#b45309', '#2563eb', '#16a34a', '#0ea5e9', '#7c3aed', '#94a3b8'][i]}"/>`).join('')}`;
    case 'pleiades':
      return `<ellipse cx="250" cy="70" rx="110" ry="60" fill="#60a5fa" opacity=".08"/>${[[230, 50, 4], [262, 44, 5], [284, 66, 4.5], [248, 80, 3.5], [212, 72, 3], [300, 40, 3], [270, 92, 3.5]].map(([x, y, r]) => star(x, y, r, '#93c5fd', 3)).join('')}`;
    case 'crab':
      return `<g opacity=".75">${[[0, '#f97316'], [40, '#38bdf8'], [80, '#f97316'], [120, '#a78bfa'], [160, '#38bdf8']].map(([a, c]) => `<path d="M270 70 q${30 * Math.cos((a * Math.PI) / 180)} ${-34 * Math.sin((a * Math.PI) / 180)} ${60 * Math.cos(((a + 30) * Math.PI) / 180)} ${30 * Math.sin(((a + 30) * Math.PI) / 180)}" stroke="${c}" stroke-width="3" fill="none"/>`).join('')}</g>
        <ellipse cx="270" cy="70" rx="64" ry="40" fill="#f97316" opacity=".1"/>${star(270, 70, 3, '#e0f2fe', 4)}`;
    case 'orion':
      return `<ellipse cx="230" cy="70" rx="140" ry="70" fill="#f472b6" opacity=".14"/><ellipse cx="260" cy="60" rx="80" ry="40" fill="#fb7185" opacity=".18"/><ellipse cx="200" cy="90" rx="60" ry="26" fill="#a78bfa" opacity=".2"/>
        ${[[250, 58, 3], [262, 64, 2.6], [244, 68, 2.4], [256, 72, 2.2]].map(([x, y, r]) => star(x, y, r, '#e0e7ff', 3)).join('')}`;
    case 'omega': {
      let out = '<circle cx="270" cy="66" r="62" fill="#fde68a" opacity=".1"/><circle cx="270" cy="66" r="34" fill="#fde68a" opacity=".16"/>';
      for (let i = 0; i < 90; i++) {
        const a = i * 2.39996;
        const d = Math.sqrt(i / 90) * 56;
        out += `<circle cx="${(270 + d * Math.cos(a)).toFixed(1)}" cy="${(66 + d * Math.sin(a)).toFixed(1)}" r="${(1.6 - d / 60).toFixed(2)}" fill="#fff4d6"/>`;
      }
      return out;
    }
    case 'lmc': {
      // Droga Mleczna widziana z zewnątrz
      let out = '<ellipse cx="240" cy="78" rx="130" ry="44" fill="#8b5cf6" opacity=".12" transform="rotate(-12 240 78)"/><ellipse cx="240" cy="78" rx="26" ry="12" fill="#fde68a" opacity=".65" transform="rotate(-12 240 78)"/>';
      for (let arm = 0; arm < 2; arm++) {
        let d = '';
        for (let k = 0; k <= 30; k++) {
          const th = (k / 30) * 3.4 + arm * Math.PI;
          const r = 10 + k * 3.6;
          d += `${k ? 'L' : 'M'}${(240 + r * Math.cos(th)).toFixed(1)} ${(78 + r * 0.34 * Math.sin(th)).toFixed(1)} `;
        }
        out += `<path d="${d}" stroke="#c7d2fe" stroke-width="7" fill="none" opacity=".22" stroke-linecap="round" transform="rotate(-12 240 78)"/>`;
      }
      return out;
    }
    case 'sgr':
      return `<ellipse cx="270" cy="70" rx="72" ry="20" fill="none" stroke="#fb923c" stroke-width="9" opacity=".45" transform="rotate(-10 270 70)"/>
        <ellipse cx="270" cy="70" rx="58" ry="14" fill="none" stroke="#fde68a" stroke-width="4" opacity=".7" transform="rotate(-10 270 70)"/>
        <circle cx="270" cy="70" r="30" fill="#fb923c" opacity=".25"/><circle cx="270" cy="70" r="22" fill="#000"/>
        <path d="M244 64 a28 18 0 0 1 52 0" stroke="#fde68a" stroke-width="3" fill="none" opacity=".8"/>`;
    default: return '';
  }
}

function spaceBodies(view, groundY) {
  switch (view) {
    case 'leo':
      return `<defs><radialGradient id="earthG" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#5fb4ff"/><stop offset=".7" stop-color="#1d4ed8"/><stop offset="1" stop-color="#0b2a6b"/></radialGradient></defs>
        <circle cx="180" cy="${groundY + 360}" r="440" fill="none" stroke="#7dd3fc" stroke-width="10" opacity=".25"/>
        <circle cx="180" cy="${groundY + 360}" r="434" fill="url(#earthG)"/>
        <path d="M-40 ${groundY - 50} q60 -20 120 -8 t110 -6 t140 2" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
        <path d="M40 ${groundY - 30} q50 -14 100 -2 t90 -8" stroke="#4ade80" stroke-width="9" fill="none" opacity=".35" stroke-linecap="round"/>`;
    case 'moon':
      return `<circle cx="292" cy="66" r="30" fill="#93c5fd" opacity=".15"/><circle cx="292" cy="66" r="20" fill="#2563eb"/>
        <path d="M280 58 q6 -6 12 0 q4 6 -2 10 q-8 2 -10 -10z M296 70 q6 -2 8 4 q-4 6 -10 2z" fill="#4ade80"/><path d="M278 72 q10 -4 22 2" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>`;
    case 'mars':
      return `<circle cx="84" cy="58" r="6" fill="#8b7d73"/><circle cx="82" cy="56" r="1.4" fill="#6b5f57"/><circle cx="268" cy="40" r="3.4" fill="#9c8f84"/>
        <rect x="-700" y="${groundY - 60}" width="1760" height="60" fill="#e9b48a" opacity=".18"/>`;
    case 'ceres':
      return [[60, 50, 9], [250, 80, 6], [310, 36, 4], [150, 30, 3], [200, 110, 5]].map(([x, y, r]) => `<path d="M${x - r} ${y} q${r * 0.4} ${-r * 1.1} ${r} ${-r * 0.9} q${r * 1.1} ${r * 0.1} ${r} ${r} q${-r * 0.3} ${r} ${-r} ${r * 0.8} q${-r * 1.1} 0 ${-r} ${-r * 0.9}z" fill="#7b746c"/>`).join('');
    case 'europa':
      return `<defs><clipPath id="jupC"><circle cx="276" cy="96" r="70"/></clipPath></defs>
        <g clip-path="url(#jupC)"><rect x="200" y="20" width="160" height="160" fill="#d9b48a"/>
        ${[[40, 8, '#b5794a'], [56, 6, '#ead2b0'], [70, 10, '#a86b3e'], [92, 7, '#e8cfa9'], [108, 12, '#b98250'], [128, 8, '#d9b48a'], [144, 9, '#a86b3e']].map(([y, h, col]) => `<rect x="200" y="${y}" width="160" height="${h}" fill="${col}"/>`).join('')}
        <ellipse cx="300" cy="112" rx="11" ry="6" fill="#c0562f"/></g><circle cx="276" cy="96" r="70" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="6"/>`;
    case 'titan':
      return `<ellipse cx="96" cy="74" rx="66" ry="13" fill="none" stroke="#f1dcae" stroke-width="5" opacity=".7" transform="rotate(-12 96 74)"/>
        <circle cx="96" cy="74" r="30" fill="#ecd29a" opacity=".9"/><path d="M68 70 h56 M70 80 h52" stroke="#d2b177" stroke-width="3" opacity=".7"/>
        <path d="M30 74 A66 13 0 0 0 162 74" fill="none" stroke="#f1dcae" stroke-width="5" opacity=".8" transform="rotate(-12 96 74)"/>
        <rect x="-700" y="-400" width="1760" height="${groundY + 400}" fill="#e7a24d" opacity=".18"/>`;
    case 'l2':
      return `<circle cx="70" cy="70" r="11" fill="#2563eb"/><path d="M64 66 q4 -4 8 0 q3 4 -1 7z" fill="#4ade80"/><circle cx="70" cy="70" r="16" fill="#60a5fa" opacity=".12"/>
        <circle cx="98" cy="60" r="3.4" fill="#d1d5db"/><path d="M-700 ${groundY + 60} h1760" stroke="#fff" stroke-opacity=".05"/>`;
    case 'venus':
      return `<circle cx="70" cy="58" r="40" fill="#fff6d0" opacity=".35"/><circle cx="70" cy="58" r="20" fill="#fff8dc"/>
        ${[[groundY - 70, 0.35], [groundY - 40, 0.5], [groundY - 14, 0.7]].map(([y, o]) => `<path d="M-700 ${y} q 120 -16 240 0 t240 0 t240 0 t240 0 t240 0 t240 0 t240 0 t240 0 V ${groundY + 400} H -700 Z" fill="#f3dca0" opacity="${o}"/>`).join('')}`;
    case 'mercury':
      return `<circle cx="300" cy="44" r="80" fill="#ffd166" opacity=".16"/><circle cx="300" cy="44" r="52" fill="#ffe08a" opacity=".35"/><circle cx="300" cy="44" r="36" fill="#fff3b0"/>
        ${[40, 120, 200].map((x, i) => `<rect x="${x}" y="${30 + i * 14}" width="18" height="8" fill="#9fb3d9" opacity=".7" transform="rotate(-20 ${x + 9} ${34 + i * 14})"/>`).join('')}`;
    case 'proxima':
      return `<circle cx="278" cy="70" r="60" fill="#ff6a3d" opacity=".12"/><circle cx="278" cy="70" r="36" fill="#ff7a4f" opacity=".35"/><circle cx="278" cy="70" r="26" fill="#ff8a5b"/>
        <circle cx="60" cy="40" r="3" fill="#fff6d6"/><circle cx="60" cy="40" r="8" fill="#fff6d6" opacity=".25"/>`;
    default: return '';
  }
}

function spaceSkyline(view, groundY, th) {
  // kopuły, anteny i panele słoneczne zamiast wieżowców
  let out = '';
  const r = seeded(9);
  let x = -700;
  while (x < W + 700) {
    const w = 26 + r() * 40;
    const h = 14 + r() * 22;
    if (x + w < BX - 6 || x > BX + BW + 6) {
      out += `<path d="M${x.toFixed(1)} ${groundY} a${(w / 2).toFixed(1)} ${h.toFixed(1)} 0 0 1 ${w.toFixed(1)} 0z" fill="${th.far}"/>`;
      out += `<path d="M${(x + w * 0.2).toFixed(1)} ${groundY - h * 0.5} a${(w * 0.3).toFixed(1)} ${(h * 0.35).toFixed(1)} 0 0 1 ${(w * 0.6).toFixed(1)} 0" stroke="${th.farWin}" stroke-width="1.2" fill="none" opacity=".5"/>`;
      if (r() < 0.4) out += `<rect x="${(x + w / 2).toFixed(1)}" y="${(groundY - h - 16).toFixed(1)}" width="1.4" height="16" fill="${th.far}"/><circle cx="${(x + w / 2 + 0.7).toFixed(1)}" cy="${(groundY - h - 17).toFixed(1)}" r="1.8" fill="#ff5d5d"/>`;
      if (r() < 0.35) out += `<rect x="${(x + w + 2).toFixed(1)}" y="${groundY - 12}" width="14" height="8" fill="#2b4a8a" stroke="#7fa3e0" stroke-width=".6" transform="rotate(-18 ${(x + w + 9).toFixed(1)} ${groundY - 8})"/>`;
    }
    x += w + 8 + r() * 26;
  }
  if (view === 'proxima') {
    for (let i = 0; i < 8; i++) {
      const px = -40 + i * 60 + r() * 20;
      if (px > BX - 8 && px < BX + BW + 8) continue;
      const h = 14 + r() * 20;
      out += `<path d="M${px.toFixed(1)} ${groundY} q4 ${-h / 2} 0 ${-h}" stroke="#7c3aed" stroke-width="2" fill="none"/><circle cx="${px.toFixed(1)}" cy="${(groundY - h).toFixed(1)}" r="3" fill="#f0abfc" filter="url(#glow)"/>`;
    }
  }
  return out;
}

function satellite(y, dur, delay, rev = false) {
  return `<g class="car${rev ? ' rev' : ''}" style="animation-duration:${dur}s;animation-delay:${delay}s">
    <rect x="10" y="${y - 3}" width="8" height="6" rx="1" fill="#e5e7eb"/><rect x="0" y="${y - 2}" width="9" height="4" fill="#3b82f6" stroke="#93c5fd" stroke-width=".5"/>
    <rect x="19" y="${y - 2}" width="9" height="4" fill="#3b82f6" stroke="#93c5fd" stroke-width=".5"/><circle cx="14" cy="${y - 5}" r="1.2" fill="#f87171"/></g>`;
}

// Sonda lecąca przez kadr (w galaktyce zamiast satelitów).
function comet(y, dur, delay, rev = false) {
  return `<g class="car${rev ? ' rev' : ''}" style="animation-duration:${dur}s;animation-delay:${delay}s">
    <path d="M-26 ${y} L2 ${y - 2} L2 ${y + 2} Z" fill="#c4b5fd" opacity=".45"/><circle cx="4" cy="${y}" r="2.6" fill="#f5f3ff"/><circle cx="4" cy="${y}" r="5" fill="#c4b5fd" opacity=".35"/></g>`;
}

// Iskra kreacji: zarodek nowego wszechświata (pierwszy etap cytadeli).
function spark(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle r="22" fill="#fde68a" opacity=".12"/><circle r="12" fill="#fdba74" opacity=".35"/><circle r="6" fill="#fff7ed"/>
    <ellipse rx="20" ry="6" fill="none" stroke="#fde68a" stroke-width="1.2" opacity=".7" transform="rotate(-20)"/>
    <ellipse rx="16" ry="5" fill="none" stroke="#c4b5fd" stroke-width="1.2" opacity=".7" transform="rotate(35)"/></g>`;
}

// Prom galaktyczny: spłaszczony kadłub, kopuła i świecący napęd.
function shuttle(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="14" rx="20" ry="5" fill="#a78bfa" opacity=".35"/>
    <path d="M-22 6 Q0 -6 22 6 L14 12 H-14 Z" fill="#e2e8f0"/><path d="M-10 0 Q0 -14 10 0 Z" fill="#93c5fd" stroke="#e2e8f0" stroke-width="1.5"/>
    <rect x="-14" y="11" width="28" height="3" rx="1.5" fill="#64748b"/><circle cx="-8" cy="7" r="1.4" fill="#f0abfc"/><circle cx="0" cy="7" r="1.4" fill="#f0abfc"/><circle cx="8" cy="7" r="1.4" fill="#f0abfc"/></g>`;
}

function rocket(x, y, s = 1, flame = false) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${flame ? '<path d="M-5 30 q5 22 10 0 z" fill="#ffb347" opacity=".9"/><path d="M-3 30 q3 12 6 0 z" fill="#fff3b0"/>' : ''}
    <path d="M-6 30 L-12 34 L-6 18 Z M6 30 L12 34 L6 18 Z" fill="#ef4444"/>
    <rect x="-6" y="-2" width="12" height="32" rx="2" fill="#f1f3ff"/>
    <path d="M-6 -2 Q0 -22 6 -2 Z" fill="#e5e7eb"/><circle cx="0" cy="8" r="3" fill="#60a5fa" stroke="#94a3b8" stroke-width="1"/>
    <rect x="-6" y="20" width="12" height="3" fill="#94a3b8"/></g>`;
}

function rover(y, dur, delay) {
  return `<g class="car" style="animation-duration:${dur}s;animation-delay:${delay}s">
    <rect x="2" y="${y - 10}" width="26" height="7" rx="2" fill="#e5e7eb"/><rect x="8" y="${y - 15}" width="10" height="5" rx="1" fill="#93c5fd"/>
    <line x1="22" y1="${y - 10}" x2="25" y2="${y - 20}" stroke="#cbd5e1" stroke-width="1"/><circle cx="25" cy="${y - 21}" r="1.6" fill="#f87171"/>
    <circle cx="7" cy="${y - 1}" r="3" fill="#374151"/><circle cx="16" cy="${y - 1}" r="3" fill="#374151"/><circle cx="25" cy="${y - 1}" r="3" fill="#374151"/></g>`;
}

export class Scene {
  constructor(root) {
    this.root = root;
    this.layers = {};
    for (const name of LAYERS) {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('class', name.endsWith('Anim') ? 'anim' : 'static');
      el.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      el.setAttribute('aria-hidden', 'true');
      root.appendChild(el);
      this.layers[name] = el;
    }
    this.sig = '';
    this.knownFloors = null;
  }

  // Zwraca podpis stanu — scena przerysowuje się tylko, gdy coś istotnego się zmieni.
  signature(game, phase) {
    const s = game.s;
    const floors = game.D.DEPTS.filter((d) => s.deptUnlocked[d.id]).map((d) => {
      const n = s.depts[d.id] || 0;
      return d.id + SEATS.filter((t) => n >= t).length;
    }).join(',');
    const e = this.env || {};
    return `${game.D.id}|${phase}|${floors}|${Math.min(s.prestigeCount, 8)}|${s.meta.companyName}|${(s.products[game.D.PRODUCTS[0].id] || 0) > 0 ? 1 : 0}|${e.season}|${e.weather}|${e.holiday}|${e.newYear}|${s.view}`;
  }

  render(game, force = false) {
    const phase = phaseFor();
    const space = game.D.id !== 'earth';
    const galaxy = game.D.id === 'galaxy';
    const universe = game.D.id === 'universe';
    const view = game.s.view || game.D.HQ;
    const th = universe ? UNIVERSE_VIEWS[view] || UNIVERSE_VIEWS.milkyway
      : galaxy ? GALAXY_VIEWS[view] || GALAXY_VIEWS.sol : space ? SPACE_VIEWS[view] || SPACE_VIEWS.leo : null;
    const orbit = !!(th && th.orbit);
    this.env = envFor();
    // W kosmosie nie ma pór roku ani pogody, ale święta zostają.
    if (th) this.env = { season: 'space', weather: 'clear', holiday: this.env.holiday, newYear: false, snowCover: false };
    const env = this.env;
    const sig = this.signature(game, phase);
    if (!force && sig === this.sig) return;
    this.sig = sig;
    const s = game.s;
    const sky = th
      ? { ...SKIES[th.dark ? 'night' : 'dusk'], stops: th.stops, far: th.far, farWin: th.farWin, ground: th.ground, grass: th.edge, cloud: 0 }
      : SKIES[phase];
    const night = th ? th.dark : phase === 'night';
    const cityView = th ? null : CITY_VIEWS[view] || CITY_VIEWS.waw;
    const overcast = env.weather === 'rain' || env.weather === 'snow' || env.weather === 'cloudy' || env.weather === 'fog';
    const unlocked = game.D.DEPTS.filter((d) => s.deptUnlocked[d.id]);
    const garage = unlocked.length <= 1;
    const nFloors = unlocked.length;
    const buildingH = garage ? 150 : space ? STATION_BASE + nFloors * (FLOOR_H + MOD_GAP) + 70 : LOBBY_H + nFloors * FLOOR_H + 34;
    const H = Math.max(330, GROUND + buildingH + 90);
    const groundY = H - GROUND;
    const rnd = seeded(42);
    animSeq = 0;
    ANIM = [];
    // Cztery warstwy: tło (statyczne), chmury i gwiazdy (ruchome), miasto i budynek (statyczne), auta i ludzie (ruchome).
    const back = [];
    const backAnim = [];
    const parts = [];
    const glow = (id) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

    // --- definicje ---
    back.push(`<defs>
      <linearGradient id="skyG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${groundY}">
        <stop offset="0" stop-color="${sky.stops[0]}"/><stop offset=".6" stop-color="${sky.stops[1]}"/><stop offset="1" stop-color="${sky.stops[2]}"/>
      </linearGradient>
      <radialGradient id="sunG"><stop offset="0" stop-color="#fff7c2"/><stop offset=".55" stop-color="#ffd76a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonG"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e8ecff"/><stop offset="1" stop-color="#c9d1ff" stop-opacity="0"/></radialGradient>
    </defs>`);
    parts.push(`<defs>
      <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${sky.glass}" stop-opacity="${sky.glassOp}"/><stop offset="1" stop-color="${night ? '#ffc861' : '#a9d8ff'}" stop-opacity="${sky.glassOp}"/>
      </linearGradient>
      ${glow('glow')}
    </defs>`);
    ANIM.push(`<defs>${glow('glowA')}</defs>`);

    // --- niebo ---
    back.push(`<rect x="-700" y="-400" width="${W + 1400}" height="${groundY + 400}" fill="url(#skyG)"/>`);
    if (overcast) back.push(`<rect x="-700" y="-400" width="${W + 1400}" height="${groundY + 400}" fill="${night ? '#1a1d33' : '#7d869f'}" opacity="${env.weather === 'cloudy' ? 0.22 : 0.38}"/>`);
    if (th ? th.stars : (night || phase === 'dusk') && !overcast) {
      const sr = seeded(7);
      for (let i = 0; i < (night ? 70 : 25); i++) {
        const x = -300 + sr() * (W + 600);
        const y = -300 + sr() * (groundY * 0.75 + 300);
        const r = 0.5 + sr() * 1.1;
        const delay = (sr() * 3).toFixed(2);
        const dot = `cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff"`;
        if (i % 3 === 0) backAnim.push(`<circle class="star" style="animation-delay:${delay}s" ${dot}/>`);
        else back.push(`<circle opacity=".6" ${dot}/>`);
      }
    }
    // słońce / księżyc
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (th) {
      // w galaktyce i wszechświecie statek rośnie w górę, więc tło schodzi niżej, żeby nie chowało się pod paskiem etapów
      const drop = galaxy || universe ? Math.max(0, (groundY - 240) * 0.4) : 0;
      const bodies = universe ? universeBodies(view) : galaxy ? galaxyBodies(view) : spaceBodies(view, groundY);
      back.push(drop ? `<g transform="translate(0 ${drop.toFixed(0)})">${bodies}</g>` : bodies);
    } else if (overcast && env.weather !== 'cloudy') {
      // przy deszczu, śniegu i mgle nie widać ani słońca, ani księżyca
    } else if (night) {
      const t = ((hour + 24 - 21) % 24) / 8;
      const mx = 30 + t * (W - 60);
      const my = 40 + Math.pow(t - 0.5, 2) * 160;
      back.push(`<circle cx="${mx}" cy="${my}" r="30" fill="url(#moonG)" opacity=".5"/><circle cx="${mx}" cy="${my}" r="13" fill="#f3f5ff"/><circle cx="${mx + 5}" cy="${my - 4}" r="12" fill="${sky.stops[0]}" opacity=".9"/>`);
    } else {
      const t = Math.min(1, Math.max(0, (hour - 5) / 16));
      const sx = 30 + t * (W - 60);
      const sy = 46 + Math.pow(t - 0.5, 2) * 220;
      back.push(`<circle cx="${sx}" cy="${sy}" r="46" fill="url(#sunG)" opacity=".75"/><circle cx="${sx}" cy="${sy}" r="16" fill="#fff3b0"/>`);
    }
    // chmury
    const cr = seeded(99);
    const cloudN = th ? 0 : overcast ? 9 : 5;
    const cloudFill = overcast ? (night ? '#5a6080' : '#d5dae8') : '#fff';
    const cloudOp = overcast ? Math.min(1, sky.cloud + 0.25) : sky.cloud;
    for (let i = 0; i < cloudN; i++) {
      const y = 20 + cr() * (groundY * (overcast ? 0.3 : 0.45));
      const sc = (0.6 + cr() * 0.8) * (overcast ? 1.3 : 1);
      const dur = 80 + cr() * 90;
      backAnim.push(`<g class="cloud" style="animation-duration:${dur.toFixed(0)}s;animation-delay:-${(cr() * dur).toFixed(0)}s" opacity="${cloudOp.toFixed(2)}">
        <g transform="translate(0 ${y.toFixed(0)}) scale(${sc.toFixed(2)})" fill="${cloudFill}"><ellipse cx="0" cy="0" rx="26" ry="11"/><ellipse cx="18" cy="-6" rx="17" ry="12"/><ellipse cx="-14" cy="-4" rx="13" ry="9"/><ellipse cx="34" cy="2" rx="14" ry="8"/></g></g>`);
    }
    if (env.newYear && night) backAnim.push(fireworks(groundY));
    if (env.holiday === 'halloween' && (night || phase === 'dusk')) {
      backAnim.push(bat(groundY * 0.25, 16, -2), bat(groundY * 0.4, 22, -11));
    }
    // panorama miasta w tle
    if (cityView && cityView.back) parts.push(BACKDROPS[cityView.back](groundY, night));
    if (th && !orbit) parts.push(spaceSkyline(view, groundY, th));
    const fr = seeded(5);
    let fx = th ? W + 700 : -700;
    while (fx < W + 700) {
      const w = 22 + fr() * 34;
      const h = 30 + fr() * 120;
      if (fx + w < BX - 4 || fx > BX + BW + 4 || garage) {
        parts.push(`<rect x="${fx.toFixed(1)}" y="${(groundY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${sky.far}" opacity="${night ? 1 : 0.75}"/>`);
        if (night || phase === 'dusk') {
          for (let wy = groundY - h + 6; wy < groundY - 6; wy += 9) {
            for (let wx = fx + 4; wx < fx + w - 5; wx += 7) {
              if (fr() < 0.32) parts.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="4" fill="${sky.farWin}" opacity=".8"/>`);
            }
          }
        }
      }
      fx += w + 2 + fr() * 6;
    }

    // charakterystyczne budowle miasta po bokach
    if (cityView) {
      const sil = shade(sky.far, night ? 1.18 : 0.84);
      parts.push(LANDMARKS[cityView.left](30, groundY, sil, night, sky.farWin));
      parts.push(LANDMARKS[cityView.right](330, groundY, sil, night, sky.farWin));
    }

    // --- ziemia (na orbicie jej nie ma: stacja wisi nad planetą) ---
    const grass = env.snowCover ? (night ? '#aab3cc' : '#eef3fb') : env.season === 'autumn' ? shade(sky.grass, 0.85) : sky.grass;
    if (!orbit) {
      parts.push(`<rect x="-700" y="${groundY}" width="${W + 1400}" height="10" fill="${grass}"/>`);
      parts.push(`<rect x="-700" y="${groundY + 10}" width="${W + 1400}" height="8" fill="${shade('#9aa3c7', sky.wall)}"/>`);
      parts.push(`<rect x="-700" y="${groundY + 18}" width="${W + 1400}" height="${GROUND + 400}" fill="${sky.ground}"/>`);
    }
    if (galaxy || universe) {
      ANIM.push(comet(groundY - 40 - (nFloors * 7), 46, -9), comet(70, 70, -40, true));
    } else if (orbit) {
      ANIM.push(satellite(groundY - 30 - (nFloors * 7), 34, -6), satellite(60, 52, -31, true));
    } else if (th) {
      const kr = seeded(13);
      for (let i = 0; i < 14; i++) parts.push(`<ellipse cx="${(-300 + kr() * 960).toFixed(0)}" cy="${(groundY + 22 + kr() * 40).toFixed(0)}" rx="${(4 + kr() * 10).toFixed(1)}" ry="${(1.5 + kr() * 2.5).toFixed(1)}" fill="#000" opacity=".18"/>`);
      ANIM.push(rover(groundY + 34, 40, -12));
    } else {
      for (let x = -700; x < W + 700; x += 30) parts.push(`<rect x="${x}" y="${groundY + 33}" width="16" height="2.4" rx="1" fill="#e9ecff" opacity=".55"/>`);
      ANIM.push(car(groundY + 30, '#ff6b6b', 14, -3, false));
      ANIM.push(car(groundY + 45, '#4fc3f7', 18, -9, true));
      if (nFloors >= 6) ANIM.push(car(groundY + 30, '#ffd166', 22, -15, false));
    }

    // drzewa
    const tr = seeded(11);
    const treeXs = garage ? [52, 300, -30, 390] : [BX - 26, BX + BW + 26, BX - 70, BX + BW + 70, -60, W + 60];
    if (!th) for (const tx of treeXs) parts.push(tree(tx, groundY + 4, 0.8 + tr() * 0.4, tr, env.season));
    if (env.holiday === 'xmas') parts.push(xmasTree(garage ? 96 : BX - 46, groundY + 2, garage ? 0.9 : 1));

    // --- budynek (w kosmosie: stacja) ---
    if (space) {
      parts.push(this.station(game, unlocked, groundY, night, orbit));
    } else if (garage) {
      const tf = `translate(${W / 2} ${groundY}) scale(1.3) translate(${-W / 2} ${-groundY})`;
      const before = ANIM.length;
      parts.push(`<g transform="${tf}">${this.garage(game, groundY, sky, night)}</g>`);
      const moving = ANIM.splice(before);
      ANIM.push(`<g transform="${tf}">${moving.join('')}</g>`);
    } else parts.push(this.building(game, unlocked, groundY, sky, night, env));

    // --- pogoda na pierwszym planie ---
    if (env.weather === 'rain') ANIM.push(precipitation('rain', H));
    if (env.weather === 'snow') ANIM.push(precipitation('snow', H));
    if (env.weather === 'fog') {
      parts.push(`<defs><linearGradient id="fogG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ecf6" stop-opacity="0"/><stop offset="1" stop-color="#e8ecf6" stop-opacity="${night ? 0.25 : 0.55}"/></linearGradient></defs>`);
      parts.push(`<rect x="-700" y="${groundY - 120}" width="${W + 1400}" height="130" fill="url(#fogG)"/>`);
    }
    if (env.season === 'autumn' && env.weather !== 'rain') {
      const lr = seeded(55);
      for (let i = 0; i < 5; i++) ANIM.push(leaf(20 + lr() * (W - 40), -(lr() * 9).toFixed(1), 8 + lr() * 5, FOLIAGE.autumn[i % 3]));
    }

    const content = { back, backAnim, front: parts, frontAnim: ANIM };
    for (const name of LAYERS) {
      const el = this.layers[name];
      el.setAttribute('viewBox', `0 0 ${W} ${H}`);
      el.innerHTML = content[name].join('');
    }
    this.knownFloors = new Set(unlocked.map((d) => d.id));
  }

  // Stacja: kapsuła (jeden dział) → moduły z załogą przy konsolach, panele słoneczne i statki.
  station(game, unlocked, groundY, night, orbit) {
    const s = game.s;
    const n = unlocked.length;
    const ship = game.D.id === 'galaxy';
    const citadel = game.D.id === 'universe';
    const name = s.meta.companyName.length > 24 ? s.meta.companyName.slice(0, 23) + '…' : s.meta.companyName;
    const hull = citadel ? '#d6cfee' : ship ? '#b8bfd9' : night ? '#c9cfe6' : '#e9edf7';
    const base = orbit ? groundY - 18 : groundY;
    let out = '';
    if (n <= 1) {
      // kapsuła na stanowisku startowym (albo w dryfie na orbicie)
      // na orbicie kapsuła dryfuje wysoko nad planetą, na powierzchni stoi przy wieży startowej
      const cx = W / 2;
      if (orbit) {
        const cy = base - 150;
        out += citadel ? spark(cx, cy - 14, 2.4) : ship ? shuttle(cx, cy - 4, 3) : rocket(cx, cy - 34, 2.2, false);
        out += `<rect x="${cx - 52}" y="${cy + 46}" width="104" height="14" rx="4" fill="#1b1e3d"/>`;
        out += `<text x="${cx}" y="${cy + 56.4}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#ffe08a" font-family="system-ui, sans-serif">${esc(name.toUpperCase())}</text>`;
        ANIM.push(`<circle class="blink" cx="${cx}" cy="${cy - 82}" r="2.4" fill="#ff4d4d" filter="url(#glowA)"/>`);
        return out;
      }
      const by = base;
      out += `<rect x="${cx - 70}" y="${by - 6}" width="140" height="6" rx="2" fill="#4b5563"/><rect x="${cx + 34}" y="${by - 96}" width="8" height="90" fill="#6b7280"/>${[0, 1, 2, 3].map((k) => `<line x1="${cx + 34}" y1="${by - 88 + k * 22}" x2="${cx + 42}" y2="${by - 76 + k * 22}" stroke="#9ca3af" stroke-width="1.5"/>`).join('')}`;
      out += rocket(cx, by - 80, 2.2, false);
      out += `<rect x="${cx - 52}" y="${by - 24}" width="104" height="14" rx="4" fill="#1b1e3d"/>`;
      out += `<text x="${cx}" y="${by - 13.6}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#ffe08a" font-family="system-ui, sans-serif">${esc(name.toUpperCase())}</text>`;
      ANIM.push(`<circle class="blink" cx="${cx + 38}" cy="${by - 98}" r="2.6" fill="#ff4d4d" filter="url(#glowA)"/>`);
      return out;
    }
    const top = base - STATION_BASE - n * (FLOOR_H + MOD_GAP);
    // kratownica i panele słoneczne (statek-matka: gondole napędu warp i pierścień)
    out += `<rect x="${W / 2 - 5}" y="${top - 30}" width="10" height="${base - top + 22}" fill="#8b93ad"/>`;
    const wings = Math.min(3, Math.ceil(n / 3));
    if (citadel) {
      // cytadela: halo pierścieni i portal nad szczytem (więcej pierścieni po kolejnych eonach)
      const midY = base - STATION_BASE - (n * (FLOOR_H + MOD_GAP)) / 2;
      const rings = 1 + Math.min(2, s.prestigeCount);
      for (let k = 0; k < rings; k++) {
        out += `<ellipse cx="${W / 2}" cy="${midY}" rx="${MOD_W / 2 + 70 + k * 18}" ry="${26 + k * 9}" fill="none" stroke="${['#fde68a', '#c4b5fd', '#67e8f9'][k]}" stroke-width="2.5" opacity=".5" transform="rotate(${-8 + k * 9} ${W / 2} ${midY})"/>`;
      }
      out += `<ellipse cx="${W / 2}" cy="${top - 58}" rx="34" ry="14" fill="#1e1b4b" stroke="#fde68a" stroke-width="2" opacity=".9"/>`;
      ANIM.push(`<ellipse class="blink" cx="${W / 2}" cy="${top - 58}" rx="22" ry="8" fill="#fde68a" opacity=".55" filter="url(#glowA)"/>`);
    }
    if (ship) {
      const midY = base - STATION_BASE - (n * (FLOOR_H + MOD_GAP)) / 2;
      if (s.prestigeCount >= 1) out += `<ellipse cx="${W / 2}" cy="${midY}" rx="${MOD_W / 2 + 92}" ry="22" fill="none" stroke="#c4b5fd" stroke-width="3" opacity=".55"/>`;
      for (const side of [-1, 1]) {
        const nx = side < 0 ? MOD_X - 70 : MOD_X + MOD_W + 26;
        out += `<rect x="${side < 0 ? nx + 40 : MOD_X + MOD_W}" y="${midY - 2}" width="30" height="4" fill="#8b93ad"/>`;
        out += `<rect x="${nx}" y="${midY - 60}" width="44" height="120" rx="22" fill="${hull}"/>`;
        out += `<rect x="${nx + 8}" y="${midY - 48}" width="28" height="96" rx="14" fill="#7c3aed" opacity=".55"/>`;
        ANIM.push(`<rect class="blink" x="${nx + 14}" y="${midY - 40}" width="16" height="80" rx="8" fill="#e9d5ff" opacity=".7" filter="url(#glowA)"/>`);
      }
    }
    for (let k = 0; k < (ship || citadel ? 0 : wings); k++) {
      const wy = base - STATION_BASE - ((k + 0.5) / wings) * n * (FLOOR_H + MOD_GAP);
      const span = 74 + k * 6;
      out += `<rect x="${MOD_X - span}" y="${wy - 1.5}" width="${MOD_W + span * 2}" height="3" fill="#8b93ad"/>`;
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? MOD_X - span - 4 : MOD_X + MOD_W + 12;
        for (let p = 0; p < 2; p++) {
          const px = x0 + p * 34;
          out += `<rect x="${px}" y="${wy - 22}" width="30" height="44" fill="#1e3a8a" stroke="#93c5fd" stroke-width=".8"/>`;
          for (let gy = 1; gy < 4; gy++) out += `<line x1="${px}" y1="${wy - 22 + gy * 11}" x2="${px + 30}" y2="${wy - 22 + gy * 11}" stroke="#60a5fa" stroke-width=".5" opacity=".7"/>`;
          out += `<line x1="${px + 15}" y1="${wy - 22}" x2="${px + 15}" y2="${wy + 22}" stroke="#60a5fa" stroke-width=".5" opacity=".7"/>`;
        }
      }
    }
    // podstawa: nogi lądownika na powierzchni albo węzeł dokujący na orbicie (statek: dysze napędu)
    if (citadel) {
      out += `<path d="M${W / 2 - 40} ${base - STATION_BASE + 4} h80 l-40 34 z" fill="${hull}"/>`;
      ANIM.push(`<circle class="blink" cx="${W / 2}" cy="${base - STATION_BASE + 40}" r="5" fill="#fde68a" filter="url(#glowA)"/>`);
    } else if (ship) {
      out += `<path d="M${W / 2 - 34} ${base - STATION_BASE + 4} h68 l-10 18 h-48 z" fill="${hull}"/>`;
      ANIM.push(`<ellipse class="blink" cx="${W / 2}" cy="${base - STATION_BASE + 30}" rx="20" ry="7" fill="#c4b5fd" opacity=".8" filter="url(#glowA)"/>`);
    } else if (orbit) {
      out += `<rect x="${W / 2 - 26}" y="${base - STATION_BASE + 4}" width="52" height="16" rx="8" fill="${hull}"/><rect x="${W / 2 - 10}" y="${base - STATION_BASE + 20}" width="20" height="8" rx="2" fill="#8b93ad"/>`;
    } else {
      out += `<path d="M${MOD_X + 20} ${base - STATION_BASE + 4} L${MOD_X} ${base} M${MOD_X + MOD_W - 20} ${base - STATION_BASE + 4} L${MOD_X + MOD_W} ${base}" stroke="#8b93ad" stroke-width="5"/>`;
      out += `<rect x="${MOD_X - 8}" y="${base - 4}" width="16" height="4" rx="1" fill="#6b7280"/><rect x="${MOD_X + MOD_W - 8}" y="${base - 4}" width="16" height="4" rx="1" fill="#6b7280"/>`;
      out += `<rect x="${W / 2 - 30}" y="${base - STATION_BASE + 4}" width="60" height="${STATION_BASE - 4}" rx="6" fill="${hull}"/>`;
    }
    out += `<rect x="${W / 2 - 52}" y="${base - STATION_BASE - 14}" width="104" height="13" rx="4" fill="#1b1e3d"/>`;
    out += `<text x="${W / 2}" y="${base - STATION_BASE - 4.6}" text-anchor="middle" font-size="8" font-weight="800" fill="#ffe08a" font-family="system-ui, sans-serif" letter-spacing=".5">◆ ${esc(name.toUpperCase())}</text>`;
    // moduły
    unlocked.forEach((d, i) => {
      const fy = base - STATION_BASE - 16 - (i + 1) * (FLOOR_H + MOD_GAP);
      const fb = fy + FLOOR_H;
      const isNew = this.knownFloors && !this.knownFloors.has(d.id);
      const rnd = seeded(300 + i * 13);
      let g = '';
      g += `<rect x="${W / 2 - 18}" y="${fb}" width="36" height="${MOD_GAP}" fill="#4b5563"/>`;
      g += `<rect x="${MOD_X}" y="${fy}" width="${MOD_W}" height="${FLOOR_H}" rx="${FLOOR_H / 2}" fill="${shade(d.color, night ? 0.55 : 1.45)}"/>`;
      g += `<rect x="${MOD_X}" y="${fy + FLOOR_H / 2 - 1}" width="${MOD_W}" height="2" fill="${shade(d.color, 0.8)}" opacity=".35"/>`;
      const wx = MOD_X + 34; const ww = MOD_W - 50;
      g += `<rect x="${wx}" y="${fy + 6}" width="${ww}" height="${FLOOR_H - 9}" rx="8" fill="url(#glassG)"/>`;
      const heads = s.depts[d.id] || 0;
      const cells = 4;
      const cw = ww / cells;
      for (let c = 0; c < cells; c++) {
        const cx = wx + cw * c + cw / 2;
        g += deskUnit(cx, fb - 2, shade(d.color, 1.35), rnd, heads >= SEATS[c], rnd() * 1.6);
      }
      g += `<circle cx="${MOD_X + 17}" cy="${fy + FLOOR_H / 2}" r="12" fill="${d.color}"/>`;
      g += `<text x="${MOD_X + 17}" y="${fy + FLOOR_H / 2 + 4.6}" text-anchor="middle" font-size="13">${d.icon}</text>`;
      g += `<circle cx="${MOD_X + MOD_W - 9}" cy="${fy + FLOOR_H / 2}" r="3" fill="${night ? '#fde68a' : '#fff'}" opacity=".9"/>`;
      out += isNew ? `<g class="floor-new">${g}</g>` : g;
    });
    // węzeł na górze, antena i statki (więcej po kolejnych falach)
    const rt = base - STATION_BASE - 16 - n * (FLOOR_H + MOD_GAP);
    out += `<rect x="${W / 2 - 22}" y="${rt - 14}" width="44" height="16" rx="8" fill="${hull}"/>`;
    out += `<line x1="${W / 2 + 34}" y1="${rt - 2}" x2="${W / 2 + 34}" y2="${rt - 30}" stroke="#8b93ad" stroke-width="2"/><path d="M${W / 2 + 22} ${rt - 34} q12 10 24 0" fill="none" stroke="#cbd5e1" stroke-width="3"/>`;
    ANIM.push(`<circle class="blink" cx="${W / 2 + 34}" cy="${rt - 32}" r="2.6" fill="#ff4d4d" filter="url(#glowA)"/>`);
    const pc = s.prestigeCount;
    const craft = (x, y, k) => (citadel ? spark(x, y + 16, k * 0.7) : ship ? shuttle(x, y + 20, k) : rocket(x, y, k));
    if (pc >= 1) out += craft(W / 2, rt - 52, 1.1);
    if (pc >= 3) out += craft(MOD_X - 30, rt + 10, 0.8);
    if (pc >= 5) out += craft(MOD_X + MOD_W + 30, rt + 10, 0.8);
    return out;
  }

  garage(game, groundY, sky, night) {
    const s = game.s;
    const gx = W / 2 - 85;
    const gw = 170;
    const gy = groundY - 82;
    const wall = night ? '#7d7266' : '#efe1c8';
    const rnd = seeded(3);
    const devs = s.depts[game.D.FIRST_DEPT] || 0;
    let out = '';
    out += `<rect x="${gx}" y="${gy}" width="${gw}" height="82" fill="${wall}"/>`;
    out += `<path d="M${gx - 10} ${gy + 2} L${W / 2} ${gy - 46} L${gx + gw + 10} ${gy + 2} Z" fill="${night ? '#7a3a2c' : '#c4573d'}"/>`;
    out += `<rect x="${gx - 10}" y="${gy - 2}" width="${gw + 20}" height="6" fill="${night ? '#5e2c22' : '#9e4330'}"/>`;
    // wnętrze garażu
    const dx = gx + 20; const dw = 104; const dy = gy + 26; const dh = 56;
    out += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="${night ? '#ffd98a' : '#fff1cf'}"/>`;
    out += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="#000" opacity="${night ? 0.05 : 0.12}"/>`;
    // półka z kartonami
    out += `<rect x="${dx + 6}" y="${dy + 8}" width="30" height="3" fill="#8a6a4a"/><rect x="${dx + 8}" y="${dy}" width="10" height="8" fill="#c99a63"/><rect x="${dx + 20}" y="${dy + 2}" width="12" height="6" fill="#d9ad74"/>`;
    // żarówka
    out += `<line x1="${dx + dw / 2}" y1="${dy}" x2="${dx + dw / 2}" y2="${dy + 9}" stroke="#555" stroke-width="1"/><circle cx="${dx + dw / 2}" cy="${dy + 11}" r="3" fill="#fff6a8" filter="url(#glow)"/>`;
    const people = Math.min(3, 1 + Math.floor(devs / 3));
    for (let i = 0; i < people; i++) {
      out += deskUnit(dx + 22 + i * 32, groundY, '#7cc7ff', rnd, true, i * 0.4);
    }
    // podniesiona brama
    out += `<rect x="${dx - 3}" y="${dy - 6}" width="${dw + 6}" height="16" rx="2" fill="${night ? '#9aa0b8' : '#d4d8e6'}"/>`;
    for (let i = 0; i < 3; i++) out += `<line x1="${dx - 3}" y1="${dy - 2 + i * 4.5}" x2="${dx + dw + 3}" y2="${dy - 2 + i * 4.5}" stroke="#8b91aa" stroke-width="1"/>`;
    // okienko i drzwi
    out += `<rect x="${gx + 134}" y="${gy + 20}" width="24" height="20" rx="2" fill="url(#glassG)" stroke="#fff" stroke-width="2"/>`;
    out += `<rect x="${gx + 134}" y="${gy + 48}" width="22" height="34" rx="2" fill="${night ? '#5c4636' : '#8b5e3c'}"/><circle cx="${gx + 151}" cy="${gy + 66}" r="1.6" fill="#ffd166"/>`;
    // szyld
    const name = s.meta.companyName.length > 22 ? s.meta.companyName.slice(0, 21) + '…' : s.meta.companyName;
    out += `<rect x="${W / 2 - 62}" y="${gy + 6}" width="124" height="15" rx="4" fill="#23264a"/>`;
    out += `<text x="${W / 2}" y="${gy + 16.8}" text-anchor="middle" font-size="9" font-weight="700" fill="#ffe08a" font-family="system-ui, sans-serif">${esc(name)}</text>`;
    out += plant(gx + gw + 18, groundY + 1, 1.1);
    out += `<rect x="${gx + gw + 30}" y="${groundY - 14}" width="14" height="14" rx="2" fill="#5b6bb3"/><rect x="${gx + gw + 32}" y="${groundY - 20}" width="10" height="6" rx="2" fill="#5b6bb3"/>`;
    const env = this.env || {};
    if (env.snowCover) {
      out += `<path d="M${gx - 12} ${gy + 1} L${W / 2} ${gy - 48} L${gx + gw + 12} ${gy + 1} L${gx + gw + 4} ${gy + 1} L${W / 2} ${gy - 41} L${gx - 4} ${gy + 1} Z" fill="#f4f8ff" opacity=".95"/>`;
    }
    if (env.holiday === 'xmas') out += lights(gx - 6, gx + gw + 6, gy + 3, 3);
    if (env.holiday === 'halloween') out += pumpkin(gx + 8, groundY, 1.2) + pumpkin(gx + gw - 8, groundY, 1);
    return out;
  }

  building(game, unlocked, groundY, sky, night, env = {}) {
    const s = game.s;
    let out = '';
    const top = groundY - LOBBY_H - unlocked.length * FLOOR_H;
    const wallBase = night ? '#2c3160' : '#e9edf7';
    // cień
    out += `<rect x="${BX + 8}" y="${top + 6}" width="${BW}" height="${groundY - top - 6}" fill="#000" opacity=".12"/>`;
    // hol
    const ly = groundY - LOBBY_H;
    out += `<rect x="${BX}" y="${ly}" width="${BW}" height="${LOBBY_H}" fill="${night ? '#31376b' : '#dfe4f2'}"/>`;
    out += `<rect x="${BX + 8}" y="${ly + 16}" width="${BW - 16}" height="${LOBBY_H - 16}" fill="url(#glassG)" opacity=".85"/>`;
    for (let x = BX + 8 + 34; x < BX + BW - 8; x += 34) out += `<rect x="${x}" y="${ly + 16}" width="2" height="${LOBBY_H - 16}" fill="${wallBase}"/>`;
    out += `<rect x="${W / 2 - 18}" y="${ly + 20}" width="36" height="${LOBBY_H - 20}" fill="${night ? '#ffeab3' : '#bfe3ff'}" stroke="${wallBase}" stroke-width="2"/>`;
    out += `<line x1="${W / 2}" y1="${ly + 20}" x2="${W / 2}" y2="${groundY}" stroke="${wallBase}" stroke-width="2"/>`;
    const name = s.meta.companyName.length > 26 ? s.meta.companyName.slice(0, 25) + '…' : s.meta.companyName;
    out += `<rect x="${BX + 20}" y="${ly + 2}" width="${BW - 40}" height="12" rx="3" fill="#1b1e3d"/>`;
    out += `<text x="${W / 2}" y="${ly + 11}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#ffe08a" font-family="system-ui, sans-serif" letter-spacing=".6">${esc(name.toUpperCase())}</text>`;
    out += plant(BX + 18, groundY, 1);
    out += plant(BX + BW - 18, groundY, 1);

    // piętra
    unlocked.forEach((d, i) => {
      const fy = ly - (i + 1) * FLOOR_H;
      const fb = fy + FLOOR_H;
      const isNew = this.knownFloors && !this.knownFloors.has(d.id);
      const rnd = seeded(100 + i * 17);
      let g = '';
      g += `<rect x="${BX}" y="${fy}" width="${BW}" height="${FLOOR_H}" fill="${shade(d.color, night ? 0.38 : 1.62)}"/>`;
      g += `<rect x="${BX}" y="${fy}" width="${BW}" height="3" fill="${shade(d.color, night ? 0.3 : 0.92)}"/>`;
      // okno
      const wx = BX + 30; const ww = BW - 38;
      g += `<rect x="${wx}" y="${fy + 6}" width="${ww}" height="${FLOOR_H - 8}" rx="2" fill="url(#glassG)"/>`;
      const heads = s.depts[d.id] || 0;
      const cells = 5;
      const cw = ww / cells;
      for (let c = 0; c < cells; c++) {
        const cx = wx + cw * c + cw / 2;
        const occupied = heads >= SEATS[c];
        g += deskUnit(cx, fb - 1, shade(d.color, 1.35), rnd, occupied, rnd() * 1.6);
      }
      for (let c = 1; c < cells; c++) g += `<rect x="${wx + cw * c - 0.75}" y="${fy + 6}" width="1.5" height="${FLOOR_H - 8}" fill="${shade(d.color, night ? 0.32 : 1.4)}" opacity=".9"/>`;
      // odblask szyby
      g += `<path d="M${wx + 6} ${fy + 6} l10 0 l-14 ${FLOOR_H - 8} l-6 0 z" fill="#fff" opacity="${night ? 0.05 : 0.18}"/>`;
      // emblemat działu
      g += `<rect x="${BX + 4}" y="${fy + 6}" width="22" height="${FLOOR_H - 8}" rx="4" fill="${d.color}"/>`;
      g += `<text x="${BX + 15}" y="${fy + FLOOR_H / 2 + 5}" text-anchor="middle" font-size="13">${d.icon}</text>`;
      out += isNew ? `<g class="floor-new">${g}</g>` : g;
    });

    // dach
    const rt = top;
    out += `<rect x="${BX - 4}" y="${rt - 6}" width="${BW + 8}" height="7" rx="2" fill="${night ? '#454b85' : '#c5cbe0'}"/>`;
    if (env.snowCover) out += `<rect x="${BX - 6}" y="${rt - 9}" width="${BW + 12}" height="4.5" rx="2.2" fill="#f4f8ff"/>`;
    if (env.holiday === 'xmas') {
      out += lights(BX, BX + BW, rt + 1, 4);
      out += lights(BX, BX + BW, ly + 1, 3);
    }
    if (env.holiday === 'halloween') out += pumpkin(W / 2 - 30, groundY, 1.5) + pumpkin(W / 2 + 30, groundY, 1.2) + pumpkin(BX + BW + 14, groundY + 2, 1.3);
    const pc = s.prestigeCount;
    out += `<line x1="${BX + BW - 30}" y1="${rt - 6}" x2="${BX + BW - 30}" y2="${rt - 40}" stroke="${night ? '#8890c0' : '#7a819f'}" stroke-width="2"/>`;
    ANIM.push(`<circle class="blink" cx="${BX + BW - 30}" cy="${rt - 42}" r="2.6" fill="#ff4d4d" filter="url(#glowA)"/>`);
    if (pc >= 1) {
      for (let k = 0; k < 3; k++) out += `<path d="M${BX + 14 + k * 20} ${rt - 6} l4 -9 h14 l-4 9 z" fill="#2b5aa8" stroke="#9ec1ff" stroke-width=".8"/>`;
    }
    if (pc >= 2) {
      out += `<g filter="url(#glow)"><rect x="${W / 2 - 34}" y="${rt - 26}" width="68" height="18" rx="5" fill="#141738" stroke="#a78bfa" stroke-width="1.5"/>
        <text x="${W / 2}" y="${rt - 13.5}" text-anchor="middle" font-size="10" font-weight="900" fill="#c4b5fd" font-family="system-ui, sans-serif">◆ ${esc((s.meta.companyName.split(' ')[0] || '').slice(0, 8).toUpperCase())}</text></g>`;
      out += `<line x1="${W / 2 - 20}" y1="${rt - 8}" x2="${W / 2 - 20}" y2="${rt - 6}" stroke="#666" stroke-width="2"/><line x1="${W / 2 + 20}" y1="${rt - 8}" x2="${W / 2 + 20}" y2="${rt - 6}" stroke="#666" stroke-width="2"/>`;
    }
    if (pc >= 3) {
      out += `<ellipse cx="${BX + BW - 62}" cy="${rt - 8}" rx="16" ry="4" fill="#3d4373"/><text x="${BX + BW - 62}" y="${rt - 6.3}" text-anchor="middle" font-size="6" font-weight="900" fill="#ffd166" font-family="system-ui">H</text>`;
    }
    if (pc >= 5) {
      out += `<path d="M${BX + 6} ${rt - 6} l6 -14 a10 10 0 0 0 10 10 z" fill="#d7dbef"/><line x1="${BX + 14}" y1="${rt - 12}" x2="${BX + 20}" y2="${rt - 18}" stroke="#d7dbef" stroke-width="1.5"/>`;
    }
    if (pc >= 8) {
      out += `<g transform="translate(${BX + BW - 8} ${rt - 6})"><path d="M0 0 v-26 q4 -10 8 0 v26 z" fill="#f1f3ff"/><path d="M0 -6 l-4 6 h4z M8 -6 l4 6 h-4z" fill="#ff6b6b"/><circle cx="4" cy="-18" r="2" fill="#60a5fa"/></g>`;
    }
    return out;
  }
}
