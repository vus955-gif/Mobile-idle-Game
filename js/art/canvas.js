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

// Warstwa liczona piksel po pikselu w rozdzielczości res (np. 0,5 = połowa): fn(x, y, out) wpisuje do out
// kolor i krycie (0–255), x i y są w pikselach pełnego płótna. Miękkie warstwy (gaz, mgła) wyglądają tak samo
// w połowie rozdzielczości, a liczą się 4× szybciej.
export function pixelLayer(w, h, res, fn) {
  const W = Math.max(1, Math.round(w * res)), H = Math.max(1, Math.round(h * res));
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H), d = img.data, out = [0, 0, 0, 0];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 0;
    fn((x + 0.5) * (w / W), (y + 0.5) * (h / H), out);
    const k = (y * W + x) * 4;
    d[k] = out[0]; d[k + 1] = out[1]; d[k + 2] = out[2]; d[k + 3] = out[3];
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Nakłada warstwę na całe płótno (domyślnie dodając światło: 'lighter').
export function addLayer(ctx, layer, w, h, mode = 'lighter') {
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(layer, 0, 0, w, h);
  ctx.restore();
}
