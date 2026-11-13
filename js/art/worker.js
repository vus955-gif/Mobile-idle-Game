// Worker tła: liczy widok zza okna w OffscreenCanvas poza głównym wątkiem i odsyła gotowy obraz.
// Protokół: { req, id, env, w, h } → { req, bitmap, ms } albo { req, error }.
import { recipeFor } from './views/index.js';

self.onmessage = (e) => {
  const { req, id, env, w, h } = e.data;
  try {
    const t0 = performance.now();
    const c = new OffscreenCanvas(w, h);
    recipeFor(id).draw(c.getContext('2d'), w, h, env || {});
    const bitmap = c.transferToImageBitmap();
    self.postMessage({ req, bitmap, ms: performance.now() - t0 }, [bitmap]);
  } catch (err) {
    self.postMessage({ req, error: String((err && err.message) || err) });
  }
};
