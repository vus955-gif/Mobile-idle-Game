// Zarządca tła (widoku zza okna): liczy obraz w workerze (albo na głównym wątku, gdy workera brak),
// trzyma gotowe obrazy w pamięci podręcznej, od razu maluje gradient zastępczy, płynnie przechodzi do
// gotowego obrazu i prowadzi warstwę animowaną (≤ 30 kl./s, tylko gdy widok jest na ekranie).
import { recipeFor as defaultRecipeFor } from './views/index.js';
import { EARTH_RECIPES } from './views/earth.js';
import { makeCanvas } from './canvas.js';

const FADE_MS = 400;
const FRAME_MS = 33;

// Rozmiar w pikselach zaokrąglony w górę do wielokrotności 64 — drobne zmiany rozmiaru nie wymagają nowego obrazu.
export const sizeBucket = (px) => Math.max(64, Math.ceil(px / 64) * 64);
// Tylko widoki Ziemi zależą od pory dnia i pogody.
export const envKey = (id, env = {}) => (EARTH_RECIPES[id] ? `${env.phase}|${env.weather}` : '');
export const cacheKey = (id, env, w, h) => `${id}|${envKey(id, env)}|${sizeBucket(w)}x${sizeBucket(h)}`;

// Pamięć podręczna LRU: przy przepełnieniu wyrzuca najdawniej używany obraz i go zamyka
// (chyba że keep(v) każe go zostawić, bo jest właśnie na ekranie).
export class Lru {
  constructor(max = 6, keep = () => false) { this.max = max; this.keep = keep; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k);
    this.map.delete(k); this.map.set(k, v);
    return v;
  }
  set(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    while (this.map.size > this.max) {
      const [oldK, oldV] = this.map.entries().next().value;
      this.map.delete(oldK);
      if (!this.keep(oldV)) oldV?.close?.();
    }
  }
  clear() { for (const v of this.map.values()) if (!this.keep(v)) v?.close?.(); this.map.clear(); }
}

// Render przepisu na głównym wątku (wariant zapasowy i galeria).
export function renderLocal(id, env, w, h, recipeFor = defaultRecipeFor) {
  const c = makeCanvas(w, h);
  recipeFor(id).draw(c.getContext('2d'), w, h, env);
  return c;
}

// Worker w grze: tylko tam, gdzie jest OffscreenCanvas (Safari ≥ 16.4).
export function createWorker() {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  try { return new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); } catch { return null; }
}

export class Backdrop {
  // host — element, od którego bierzemy rozmiar; deps — zależności (w testach podmieniane):
  // canvases { main, anim }, createWorker, raf, caf, isActive, dpr, renderLocal, defer, now, recipeFor.
  constructor(host, deps = {}) {
    this.host = host;
    this.deps = {
      raf: (fn) => requestAnimationFrame(fn), caf: (i) => cancelAnimationFrame(i),
      isActive: () => true, dpr: () => 1, defer: (fn) => setTimeout(fn, 0), now: () => performance.now(),
      recipeFor: defaultRecipeFor, createWorker, ...deps,
    };
    this.deps.renderLocal ||= (id, env, w, h) => renderLocal(id, env, w, h, this.deps.recipeFor);
    this.main = this.deps.canvases.main;
    this.anim = this.deps.canvases.anim;
    this.cache = new Lru(this.deps.cacheSize || 6, (v) => v === this.shown);
    this.req = 0;
    this.reqKeys = new Map();
    this.shown = null;
    this.shownKey = null;
    this.shownId = null;
    this.loop = null;
    this.lastAnim = -Infinity;
    this.fade = null;
    this.recipe = this.deps.recipeFor('');
    this.id = this.recipe.id;
    this.env = {};
    this.quality = 'full';
    this.light = this.recipe.light({});
    this.worker = this.deps.createWorker ? this.deps.createWorker() : null;
    if (this.worker) this.worker.onmessage = (e) => this.onResult(e.data);
  }

  pixelSize() {
    const d = Math.min(2, this.deps.dpr() || 1);
    return [Math.round(this.host.clientWidth * d), Math.round(this.host.clientHeight * d)];
  }

  // Pokaż widok id (env: pora dnia, pogoda…; quality: 'full' | 'eco').
  show(id, env = {}, { quality = 'full' } = {}) {
    this.recipe = this.deps.recipeFor(id);
    this.id = this.recipe.id;
    this.env = env;
    this.quality = quality;
    this.light = this.recipe.light(env);
    const [w, h] = this.pixelSize();
    if (!(w > 0 && h > 0)) return;
    const key = cacheKey(this.id, env, w, h);
    this.size(w, h);
    if (key === this.shownKey && this.shown) { this.draw(1); this.tick(); return; }
    const hit = this.cache.get(key);
    if (hit) this.present(hit, key, this.id, false);
    else { this.placeholder(w, h); this.request(this.id, env, w, h, key); }
    this.tick();
  }

  // Zmiana rozmiaru hosta: nowy obraz tylko wtedy, gdy zmienił się kubełek rozmiaru.
  resize() {
    const [w, h] = this.pixelSize();
    if (!(w > 0 && h > 0)) return;
    const key = cacheKey(this.id, this.env, w, h);
    if (key === this.shownKey || key === this.wantKey) { this.size(w, h); this.draw(1); return; }
    this.show(this.id, this.env, { quality: this.quality });
  }

  size(w, h) {
    for (const c of [this.main, this.anim]) if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }

  // Gradient zastępczy: kolory przepisu (stops) albo przyciemniony kolor jego światła.
  placeholder(w, h) {
    const ctx = this.main.getContext('2d');
    const st = typeof this.recipe.stops === 'function' ? this.recipe.stops(this.env) : this.recipe.stops;
    const c = this.light.color, dark = (f) => `rgb(${(c[0] * f) | 0},${(c[1] * f) | 0},${(c[2] * f) | 0})`;
    const stops = st || [dark(0.04), dark(0.1), dark(0.22)];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, stops[0]); g.addColorStop(0.6, stops[1]); g.addColorStop(1, stops[2]);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    this.placeholderStops = stops;
  }

  request(id, env, w, h, key) {
    const req = ++this.req;
    this.wantKey = key;
    this.reqKeys.set(req, { key, id, env, w, h });
    const W = sizeBucket(w), H = sizeBucket(h);
    if (this.worker) {
      try { this.worker.postMessage({ req, id, env, w: W, h: H }); return; } catch { /* awaria workera → wariant lokalny */ }
    }
    this.local(req);
  }

  local(req) {
    const r = this.reqKeys.get(req);
    if (!r) return;
    this.deps.defer(() => {
      if (req !== this.req) { this.reqKeys.delete(req); return; }
      try {
        const c = this.deps.renderLocal(r.id, r.env, Math.round(sizeBucket(r.w) / 2), Math.round(sizeBucket(r.h) / 2));
        this.onResult({ req, bitmap: c, local: true });
      } catch { this.reqKeys.delete(req); }
    });
  }

  onResult({ req, bitmap, error }) {
    const r = this.reqKeys.get(req);
    if (!r) { bitmap?.close?.(); return; }
    if (error || !bitmap) { if (req === this.req) this.local(req); else this.reqKeys.delete(req); return; }
    this.reqKeys.delete(req);
    this.cache.set(r.key, bitmap);
    if (req !== this.req) return;
    this.present(bitmap, r.key, r.id, true);
  }

  present(bitmap, key, id, fade) {
    this.shown = bitmap;
    this.shownKey = key;
    this.shownId = id;
    this.wantKey = key;
    if (fade) { this.fade = { start: this.deps.now() }; this.draw(0); } else { this.fade = null; this.draw(1); }
    this.tick();
  }

  // Rysuje bieżący obraz z kryciem a nad gradientem zastępczym (a = 1 → sam obraz).
  draw(a) {
    if (!this.shown) return;
    const ctx = this.main.getContext('2d'), w = this.main.width, h = this.main.height;
    ctx.globalCompositeOperation = 'source-over';
    if (a < 1 && this.placeholderStops) {
      const g = ctx.createLinearGradient(0, 0, 0, h), s = this.placeholderStops;
      g.addColorStop(0, s[0]); g.addColorStop(0.6, s[1]); g.addColorStop(1, s[2]);
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.shown, 0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  animates() { return !!this.recipe.animate && this.quality === 'full' && this.deps.isActive(); }
  needsLoop() { return !!this.fade || (this.animates() && !!this.shown); }

  // Uruchamia pętlę, jeśli jest potrzebna i jeszcze nie działa (UI woła to w swojej pętli, np. po powrocie na Biuro).
  tick() {
    if (this.loop !== null || !this.needsLoop()) return;
    const frame = (ts) => {
      this.loop = null;
      this.frame(ts);
      if (this.needsLoop() && this.loop === null) this.loop = this.deps.raf(frame);
    };
    this.loop = this.deps.raf(frame);
  }

  frame(ts) {
    if (this.fade) {
      const p = (this.deps.now() - this.fade.start) / FADE_MS;
      if (p >= 1) { this.fade = null; this.draw(1); } else this.draw(p);
    }
    const actx = this.anim.getContext('2d');
    if (!this.animates()) { if (this.animDrawn) { actx.clearRect(0, 0, this.anim.width, this.anim.height); this.animDrawn = false; } return; }
    if (ts - this.lastAnim < FRAME_MS) return;
    this.lastAnim = ts;
    actx.clearRect(0, 0, this.anim.width, this.anim.height);
    this.recipe.animate(actx, this.anim.width, this.anim.height, ts / 1000);
    this.animDrawn = true;
  }

  destroy() {
    if (this.loop !== null) this.deps.caf(this.loop);
    this.loop = null;
    this.worker?.terminate?.();
    this.shown = null;
    this.cache.clear();
  }
}
