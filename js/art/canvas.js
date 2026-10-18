// Fabryka płócien dla oprawy: OffscreenCanvas (worker, nowe Safari), płótno DOM albo testowe (Node).

let factory = null;

// Testy podstawiają tu płótno bez przeglądarki; null przywraca zwykłą fabrykę.
export function setCanvasFactory(fn) { factory = fn || null; }

export function makeCanvas(w, h) {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  if (factory) return factory(W, H);
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(W, H);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

// Miękka, okrągła poświata (przy globalCompositeOperation = 'lighter' rozjaśnia to, co pod spodem).
export function glow(ctx, x, y, r, rgb, alpha) {
  if (!(r > 0) || !(alpha > 0)) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
