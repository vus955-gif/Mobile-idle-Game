// Scena Biura: tło Canvas (widok zza okna) z budowlami miasta, niebo SVG, diorama firmy i pogoda.
// Warstwy skyline, back, backAnim i weather są w układzie sceny (px CSS); front i frontAnim (diorama) mają kadr z frameFor.
import { Backdrop } from './art/backdrop.js';
import { recipeFor } from './art/views/index.js';
import { modelFor, newIds, buildDiorama } from './diorama/index.js';
import { frameFor, viewBoxAttr } from './diorama/frame.js';
import { PLACES } from './diorama/island.js';
import { SEATS, FOLIAGE, seeded } from './diorama/parts.js';
import { skyline } from './diorama/skyline.js';

const NS = 'http://www.w3.org/2000/svg';
const CLOUD = { night: 0.18, dawn: 0.7, day: 0.95, dusk: 0.6 }; // krycie chmur wg pory dnia
// Wyrastanie nowego działu (floor-new, 0,8 s w css/style.css) w scenie wstrzymanej poza Biurem stoi, a dział otwiera się
// w zakładce Zespół i pierwsze zatrudnienie przerysowuje dioramę. Dlatego nowe działy etapu czekają w growing i dostają
// floor-new przy każdym renderze, aż scena będzie aktywna przez GROW_MS: tyle musi trwać ciąg aktywnych wywołań render
// bez przerwy dłuższej niż GAP_MS (przy dłuższej, np. w ukrytej karcie bez klatek, nie wiadomo, co widział gracz).
const GROW_MS = 800, GAP_MS = 1000;

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
function precipitation(kind, w, h) {
  const rain = kind === 'rain', tile = rain ? 120 : 160, r = seeded(rain ? 21 : 33);
  let cell = '', tiles = '';
  for (let i = 0, k = Math.round((rain ? 26 : 18) * w / 360); i < k; i++) {
    const x = -20 + r() * (w + 40), y = r() * tile;
    if (rain) cell += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 3).toFixed(1)}" y2="${(y + 9).toFixed(1)}"/>`;
    else cell += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + r() * 1.6).toFixed(2)}"/>`;
  }
  for (let y = -tile; y < h; y += tile) tiles += `<g transform="translate(0 ${y})">${cell}</g>`;
  if (rain) return `<g class="rain" stroke="#cfe3ff" stroke-width="1.1" stroke-linecap="round" opacity=".55">${tiles}</g>`;
  return `<g class="snow-sway"><g class="snow" fill="#fff" opacity=".9">${tiles}</g></g>`;
}

function fireworks(w, h) {
  let out = '';
  const r = seeded(77), colors = ['#ffd166', '#ff5d73', '#60a5fa', '#4ade80', '#c084fc'];
  for (let k = 0; k < 4; k++) {
    const cx = 40 + r() * (w - 80), cy = 30 + r() * h * 0.3;
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays += `<line x1="${(Math.cos(a) * 4).toFixed(1)}" y1="${(Math.sin(a) * 4).toFixed(1)}" x2="${(Math.cos(a) * 18).toFixed(1)}" y2="${(Math.sin(a) * 18).toFixed(1)}"/>`;
    }
    out += `<g transform="translate(${cx.toFixed(0)} ${cy.toFixed(0)})"><g class="firework" style="animation-delay:${(k * 0.9).toFixed(1)}s" stroke="${colors[k]}" stroke-width="1.6" stroke-linecap="round">${rays}</g></g>`;
  }
  return out;
}

function bat(y, dur, delay) {
  return `<g class="bat" style="animation-duration:${dur}s;animation-delay:${delay}s"><path transform="translate(0 ${y})" d="M0 0 q4 -5 8 -1 q2 -3 3 0 q1 -3 3 0 q4 -4 8 1 q-5 -1 -7 3 q-1.5 -2 -3 0 q-1.5 -2 -3 0 q-2 -4 -9 -3z" fill="#1a1426"/></g>`;
}

function leaf(x, delay, dur, color) {
  return `<g class="leaf" style="animation-delay:${delay}s;animation-duration:${dur}s"><path transform="translate(${x} -10)" d="M0 0 q3 -3 6 0 q-3 3 -6 0z" fill="${color}"/></g>`;
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

// Pas dioramy: od dołu widocznych nakładek (pasek etapów, narzędzia sceny, zegar zen) + 6 px do 6 px nad dołem sceny.
function overlayInsets(root) {
  const top = root.getBoundingClientRect().top;
  let b = 0;
  for (const el of document.querySelectorAll('.layer-bar, .scene-tools, .zen-info')) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height) b = Math.max(b, r.bottom - top);
  }
  return { top: b + 6, bottom: 6 };
}

export class Scene {
  // insets() → { top, bottom }: wcięcia pasa dioramy w px (domyślnie z nakładek nad sceną); isActive() → czy scenę widać
  // (nie jest wstrzymana i karta jest widoczna); now() → czas w ms dla wyrastania. Testy podmieniają wszystkie trzy.
  constructor(root, { insets, isActive, now } = {}) {
    Object.assign(this, { root, layers: {}, known: new Map(), growing: new Map(), sig: '', sw: 0, sh: 0, bbox: null, sky: null, lastMs: 0 });
    this.insets = insets || (() => overlayInsets(root));
    const sceneWrap = root.closest?.('.scene-wrap');
    this.isActive = isActive || (() => !sceneWrap?.classList.contains('paused') && !globalThis.document?.hidden);
    this.now = now || (() => performance.now());
    // Tło Canvas (obraz i animacja) z budowlami miasta w opakowaniu z powolnym najazdem kamery.
    const wrap = this.backdropWrap = document.createElement('div');
    wrap.className = 'backdrop-wrap';
    root.appendChild(wrap);
    this.backdrop = null;
    try {
      const [main, anim] = ['backdrop', 'backdrop-anim'].map((c) => wrap.appendChild(Object.assign(document.createElement('canvas'), { className: c })));
      this.backdrop = new Backdrop(root, {
        canvases: { main, anim },
        isActive: () => this.isActive(),
        dpr: () => Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      this.backdrop = null;
    }
    for (const name of ['skyline', 'back', 'backAnim', 'front', 'frontAnim', 'weather']) {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('class', name.endsWith('Anim') ? 'anim' : name === 'back' || name === 'front' ? 'static' : name);
      el.setAttribute('preserveAspectRatio', 'none');
      el.setAttribute('aria-hidden', 'true');
      (name === 'skyline' ? wrap : root).appendChild(el);
      this.layers[name] = el;
    }
    // ResizeObserver woła najwyżej raz na klatkę, przed malowaniem: kadr zmienia się w tej samej klatce co rozmiar.
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(root);
  }

  // Zwraca podpis stanu — scena przerysowuje się tylko, gdy coś istotnego się zmieni.
  signature(game, phase) {
    const s = game.s;
    const floors = game.D.DEPTS.filter((d) => s.deptUnlocked[d.id]).map((d) => {
      const n = s.depts[d.id] || 0;
      return d.id + SEATS.filter((t) => n >= t).length;
    }).join(',');
    const e = this.env || {};
    return `${game.D.id}|${phase}|${floors}|${Math.min(s.prestigeCount, 8)}|${s.meta.companyName}|${(s.products[game.D.PRODUCTS[0].id] || 0) > 0 ? 1 : 0}|${e.season}|${e.weather}|${e.holiday}|${e.newYear}|${s.view}|${s.meta.settings.gfx}`;
  }

  // Nigdy nie rzuca: błąd budowy dioramy zostawia jej poprzednią zawartość.
  render(game, force = false) {
    const t0 = performance.now(), phase = phaseFor(), stage = game.D.id, earth = stage === 'earth', view = game.s.view || game.D.HQ;
    let env = envFor();
    // Poza Ziemią nie ma pór roku ani pogody, ale święta zostają.
    if (!earth) env = { season: 'space', weather: 'clear', holiday: env.holiday, newYear: false, snowCover: false };
    this.env = env;
    const t = this.now(), on = this.isActive(), wait = this.watchGrowth(stage, t, on);
    const sig = this.signature(game, phase);
    if (!force && sig === this.sig) return;
    this.sig = sig;
    const s = game.s, bd = this.backdrop, bdEnv = earth ? { phase, weather: env.weather, season: env.season, holiday: env.holiday } : {};
    if (bd) {
      const quality = s.meta.settings.gfx === 'eco' ? 'eco' : 'full';
      bd.show(view, bdEnv, { quality });
      this.backdropWrap.classList.toggle('kb', quality === 'full');
    }
    const light = bd?.light ?? recipeFor(view).light(bdEnv);
    this.sky = { earth, view, env, phase, light, flat: !bd };
    try {
      // Znane i czekające działy zapisujemy dopiero po udanej budowie, żeby błąd nie zjadł animacji nowego działu.
      // Wyrastają nowe od poprzedniej budowy etapu i te, które jeszcze czekają (o ile wciąż są otwarte).
      const ids = game.D.DEPTS.filter((d) => s.deptUnlocked[d.id]).map((d) => d.id), known = new Map(this.known);
      const fresh = newIds(known, stage, ids), grow = new Set([...fresh, ...ids.filter((id) => wait?.ids.has(id))]);
      const d = buildDiorama(modelFor(game, { view, env: { ...env, phase }, light, isNew: (id) => grow.has(id) }));
      this.layers.front.innerHTML = d.front;
      this.layers.frontAnim.innerHTML = d.frontAnim;
      this.bbox = d.bbox;
      this.known = known;
      // Nowy dział dostaje pełne GROW_MS: jego odliczanie startuje od tej budowy.
      if (!grow.size) this.growing.delete(stage);
      else this.growing.set(stage, { ids: grow, since: fresh.size ? (on ? t : null) : wait.since, last: t });
    } catch { /* zostaje poprzednia diorama */ }
    this.paint();
    this.lastMs = performance.now() - t0;
  }

  // Odliczanie wyrastania etapu w chwili t (on: scenę widać). Zwraca czekające działy albo nic, gdy już wyrosły.
  watchGrowth(stage, t, on) {
    const w = this.growing.get(stage);
    if (!w) return null;
    if (!on) w.since = null;
    else if (w.since === null || t - w.last > GAP_MS) w.since = t;
    w.last = t;
    if (on && t - w.since >= GROW_MS) { this.growing.delete(stage); return null; }
    return w;
  }

  // Po zmianie rozmiaru: tło, a przy zmianie o ≥ 2 px warstwy sceny i kadr (bez przebudowy dioramy).
  resize() {
    // Błąd tła (np. iOS odmówi płótna przy braku pamięci) nie może zablokować nowego kadru dioramy.
    try { this.backdrop?.resize(); } catch { /* tło zostaje, jakie było */ }
    const { clientWidth: w, clientHeight: h } = this.root;
    if (Math.abs(w - this.sw) >= 2 || Math.abs(h - this.sh) >= 2) this.paint();
  }

  // Warstwy w układzie sceny i viewBox dioramy. Przy zerowym rozmiarze nic, a sw = sh = 0, więc powrót do dowolnego
  // rozmiaru (także tego samego) przemaluje warstwy w resize(); błąd zostawia poprzednie i też wymusza ponowienie.
  paint() {
    const { clientWidth: w, clientHeight: h } = this.root;
    this.sw = this.sh = 0;
    if (!(w > 0 && h > 0) || !this.sky) return;
    try {
      const L = this.layers, c = this.skyLayers(w, h), f = this.bbox && frameFor(this.bbox, { w, h }, this.insets());
      for (const k of ['skyline', 'back', 'backAnim', 'weather']) { L[k].setAttribute('viewBox', `0 0 ${w} ${h}`); L[k].innerHTML = c[k]; }
      if (f) for (const k of ['front', 'frontAnim']) L[k].setAttribute('viewBox', viewBoxAttr(f));
      this.sw = w; this.sh = h;
    } catch { /* zostają poprzednie warstwy */ }
  }

  // Niebo i pogoda w px sceny: gradient (tylko bez tła Canvas), budowle, gwiazdy, chmury, ruch na niebie, święta, opady.
  skyLayers(w, h) {
    const { earth, view, env, phase, light, flat } = this.sky, rec = recipeFor(view), hz = rec.horizon || 0.86;
    const sky = (PLACES[view] ?? PLACES.waw).sky, overcast = env.weather !== 'clear', dark = earth ? phase === 'night' : sky.stars;
    let flatSky = '', anim = '', weather = '';
    // Bez tła Canvas gradient nieba idzie pod budowle miasta (na początek warstwy skyline).
    const st = flat && (typeof rec.stops === 'function' ? rec.stops({ ...env, phase }) : rec.stops);
    if (st) flatSky = `<defs><linearGradient id="skyG" x2="0" y2="1">${st.map((c, i) => `<stop offset="${[0, 0.6, 1][i]}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#skyG)"/>`;
    if (earth ? (dark || phase === 'dusk') && !overcast : sky.stars) {
      const r = seeded(7);
      for (let i = 0, k = Math.round((dark ? 14 : 5) * w / 341); i < k; i++) {
        anim += `<circle class="star" style="animation-delay:${(r() * 3).toFixed(2)}s" cx="${(r() * w).toFixed(1)}" cy="${(r() * hz * h * 0.75).toFixed(1)}" r="${(0.5 + r() * 1.1).toFixed(2)}" fill="#fff"/>`;
      }
    }
    if (sky.traffic === 'clouds') {
      const r = seeded(99), fill = overcast ? (dark ? '#5a6080' : '#d5dae8') : '#fff', op = Math.min(1, CLOUD[phase] + (overcast ? 0.25 : 0));
      for (let i = 0; i < (overcast ? 9 : 5); i++) {
        const y = 20 + r() * hz * h * (overcast ? 0.3 : 0.45), sc = (0.6 + r() * 0.8) * (overcast ? 1.3 : 1), dur = 80 + r() * 90;
        anim += `<g class="cloud" style="animation-duration:${dur.toFixed(0)}s;animation-delay:-${(r() * dur).toFixed(0)}s" opacity="${op.toFixed(2)}"><g transform="translate(0 ${y.toFixed(0)}) scale(${sc.toFixed(2)})" fill="${fill}">`
          + '<ellipse rx="26" ry="11"/><ellipse cx="18" cy="-6" rx="17" ry="12"/><ellipse cx="-14" cy="-4" rx="13" ry="9"/><ellipse cx="34" cy="2" rx="14" ry="8"/></g></g>';
      }
    }
    const py = (k) => Math.round(h * k); // całe px: satelita, kometa i nietoperz odejmują od y przesunięcia
    if (sky.traffic === 'satellites') anim += satellite(py(0.42), 34, -6) + satellite(py(0.24), 52, -31, true);
    if (sky.traffic === 'comets') anim += comet(py(0.4), 46, -9) + comet(py(0.22), 70, -40, true);
    if (env.newYear && dark) anim += fireworks(w, h);
    if (env.holiday === 'halloween' && (dark || (earth && phase === 'dusk'))) anim += bat(py(0.25), 16, -2) + bat(py(0.4), 22, -11);
    if (env.weather === 'rain' || env.weather === 'snow') weather += precipitation(env.weather, w, h);
    if (env.weather === 'fog') {
      weather += `<defs><linearGradient id="fogG" x2="0" y2="1"><stop offset="0" stop-color="#e8ecf6" stop-opacity="0"/><stop offset="1" stop-color="#e8ecf6" stop-opacity="${dark ? 0.25 : 0.55}"/></linearGradient></defs>`
        + `<rect y="${(h * 0.35).toFixed(0)}" width="${w}" height="${(h * 0.65).toFixed(0)}" fill="url(#fogG)"/>`;
    }
    if (env.season === 'autumn' && env.weather !== 'rain') {
      const r = seeded(55);
      for (let i = 0; i < 5; i++) weather += leaf(20 + r() * (w - 40), -(r() * 9).toFixed(1), 8 + r() * 5, FOLIAGE.autumn[i % 3]);
    }
    return { skyline: flatSky + skyline(view, { w, h }, { light, phase, horizon: hz }).svg, back: '', backAnim: anim, weather };
  }
}
