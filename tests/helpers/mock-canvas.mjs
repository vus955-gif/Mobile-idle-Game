// Płótno testowe dla Node: prawdziwy bufor pikseli dla ImageData i drawImage z innego płótna testowego,
// pozostałe metody 2D tylko się zapisują (ctx.calls). Wystarcza, żeby sprawdzić, że klocki i przepisy
// rysują bez wyjątków i deterministycznie.

const PROPS = {
  fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1,
  globalCompositeOperation: 'source-over', font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic',
  imageSmoothingEnabled: true, imageSmoothingQuality: 'low', shadowBlur: 0, shadowColor: 'transparent', filter: 'none',
};

export function mockCanvas(w, h) {
  const canvas = { width: w, height: h, _buf: new Uint8ClampedArray(w * h * 4) };
  const calls = [];
  const gradient = () => ({ addColorStop() {} });
  const base = {
    ...PROPS,
    canvas,
    calls,
    createImageData(a, b) {
      const W = typeof a === 'object' ? a.width : a, H = typeof a === 'object' ? a.height : b;
      return { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
    },
    getImageData(x, y, W, H) {
      const out = new Uint8ClampedArray(W * H * 4);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const sx = x + i, sy = y + j;
        if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) continue;
        out.set(canvas._buf.subarray((sy * canvas.width + sx) * 4, (sy * canvas.width + sx) * 4 + 4), (j * W + i) * 4);
      }
      return { width: W, height: H, data: out };
    },
    putImageData(img, dx = 0, dy = 0) {
      calls.push('putImageData');
      for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
        const x = dx + i, y = dy + j;
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
        canvas._buf.set(img.data.subarray((j * img.width + i) * 4, (j * img.width + i) * 4 + 4), (y * canvas.width + x) * 4);
      }
    },
    drawImage(src, ...a) {
      calls.push('drawImage');
      if (!src || !src._buf) return;
      let sx = 0, sy = 0, sw = src.width, sh = src.height, dx, dy, dw = src.width, dh = src.height;
      if (a.length === 2) [dx, dy] = a;
      else if (a.length === 4) [dx, dy, dw, dh] = a;
      else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
      const add = this.globalCompositeOperation === 'lighter';
      for (let j = 0; j < Math.round(dh); j++) for (let i = 0; i < Math.round(dw); i++) {
        const x = Math.round(dx) + i, y = Math.round(dy) + j;
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
        const ux = Math.floor(sx + (i * sw) / dw), uy = Math.floor(sy + (j * sh) / dh);
        if (ux < 0 || uy < 0 || ux >= src.width || uy >= src.height) continue;
        const s = (uy * src.width + ux) * 4, d = (y * canvas.width + x) * 4;
        if (src._buf[s + 3] === 0) continue;
        for (let k = 0; k < 4; k++) canvas._buf[d + k] = add ? canvas._buf[d + k] + src._buf[s + k] : src._buf[s + k];
      }
    },
    createLinearGradient() { calls.push('createLinearGradient'); return gradient(); },
    createRadialGradient() { calls.push('createRadialGradient'); return gradient(); },
    measureText(t) { return { width: String(t).length * 6 }; },
  };
  // Każda inna metoda 2D (arc, ellipse, fill, stroke…) to zapisywany no-op.
  const ctx = new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k !== 'string') return undefined;
      return () => { calls.push(k); };
    },
  });
  canvas.getContext = () => ctx;
  return canvas;
}

// Skrót FNV-1a z bufora pikseli płótna testowego.
export function hashPixels(canvas) {
  let h = 0x811c9dc5;
  const b = canvas._buf;
  for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}
