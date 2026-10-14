// Ilustracja biura w SVG: garaż → biurowiec → wieżowiec. Pora dnia zgodna z zegarem urządzenia.
import { DEPTS } from './data.js';

const W = 360;
const GROUND = 52;
const LOBBY_H = 46;
const FLOOR_H = 34;
const BW = 224;
const BX = (W - BW) / 2;
const SEATS = [1, 5, 15, 40, 100];

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
    const floors = DEPTS.filter((d) => s.deptUnlocked[d.id]).map((d) => {
      const n = s.depts[d.id] || 0;
      return d.id + SEATS.filter((t) => n >= t).length;
    }).join(',');
    const e = this.env || {};
    return `${phase}|${floors}|${Math.min(s.prestigeCount, 8)}|${s.companyName}|${(s.products.landing || 0) > 0 ? 1 : 0}|${e.season}|${e.weather}|${e.holiday}|${e.newYear}`;
  }

  render(game, force = false) {
    const phase = phaseFor();
    this.env = envFor();
    const env = this.env;
    const sig = this.signature(game, phase);
    if (!force && sig === this.sig) return;
    this.sig = sig;
    const s = game.s;
    const sky = SKIES[phase];
    const night = phase === 'night';
    const overcast = env.weather === 'rain' || env.weather === 'snow' || env.weather === 'cloudy' || env.weather === 'fog';
    const unlocked = DEPTS.filter((d) => s.deptUnlocked[d.id]);
    const garage = unlocked.length <= 1;
    const nFloors = unlocked.length;
    const buildingH = garage ? 150 : LOBBY_H + nFloors * FLOOR_H + 34;
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
    if ((night || phase === 'dusk') && !overcast) {
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
    if (overcast && env.weather !== 'cloudy') {
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
    const cloudN = overcast ? 9 : 5;
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
    const fr = seeded(5);
    let fx = -700;
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

    // --- ziemia ---
    const grass = env.snowCover ? (night ? '#aab3cc' : '#eef3fb') : env.season === 'autumn' ? shade(sky.grass, 0.85) : sky.grass;
    parts.push(`<rect x="-700" y="${groundY}" width="${W + 1400}" height="10" fill="${grass}"/>`);
    parts.push(`<rect x="-700" y="${groundY + 10}" width="${W + 1400}" height="8" fill="${shade('#9aa3c7', sky.wall)}"/>`);
    parts.push(`<rect x="-700" y="${groundY + 18}" width="${W + 1400}" height="${GROUND + 400}" fill="${sky.ground}"/>`);
    for (let x = -700; x < W + 700; x += 30) parts.push(`<rect x="${x}" y="${groundY + 33}" width="16" height="2.4" rx="1" fill="#e9ecff" opacity=".55"/>`);
    ANIM.push(car(groundY + 30, '#ff6b6b', 14, -3, false));
    ANIM.push(car(groundY + 45, '#4fc3f7', 18, -9, true));
    if (nFloors >= 6) ANIM.push(car(groundY + 30, '#ffd166', 22, -15, false));

    // drzewa
    const tr = seeded(11);
    const treeXs = garage ? [52, 300, -30, 390] : [BX - 26, BX + BW + 26, BX - 70, BX + BW + 70, -60, W + 60];
    for (const tx of treeXs) parts.push(tree(tx, groundY + 4, 0.8 + tr() * 0.4, tr, env.season));
    if (env.holiday === 'xmas') parts.push(xmasTree(garage ? 96 : BX - 46, groundY + 2, garage ? 0.9 : 1));

    // --- budynek ---
    if (garage) {
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

  garage(game, groundY, sky, night) {
    const s = game.s;
    const gx = W / 2 - 85;
    const gw = 170;
    const gy = groundY - 82;
    const wall = night ? '#7d7266' : '#efe1c8';
    const rnd = seeded(3);
    const devs = s.depts.dev || 0;
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
    const name = s.companyName.length > 22 ? s.companyName.slice(0, 21) + '…' : s.companyName;
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
    const name = s.companyName.length > 26 ? s.companyName.slice(0, 25) + '…' : s.companyName;
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
        <text x="${W / 2}" y="${rt - 13.5}" text-anchor="middle" font-size="10" font-weight="900" fill="#c4b5fd" font-family="system-ui, sans-serif">◆ ${esc((s.companyName.split(' ')[0] || '').slice(0, 8).toUpperCase())}</text></g>`;
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
