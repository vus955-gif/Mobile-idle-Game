// Kadr dioramy w pasie sceny: skala i viewBox tak, by bryła mieściła się między nakładkami, a podstawa stała przy dolnej krawędzi.
// Czysty JS bez DOM. Współrzędne świata, wymiary widoku w px CSS.

// iPhone SE: scena 341×273 px przy pasku stanu 20 px (pomiar 19.10.2026).
export const SE = { w: 341, h: 273 };
// Pasek etapów kończy się na 42 px, plus 6 px marginesu; dolny margines 6 px.
export const SE_INSETS = { top: 48, bottom: 6 };
// Progi czytelności przy największej dioramie.
export const MIN_EMBLEM_PX = 16;
export const MIN_LOT_PX = 28;

// Zwraca { viewBox, scale, visible } albo null, gdy widok lub pas ma zerowy rozmiar.
export function frameFor([x0, y0, x1, y1], view, insets, { margin = 0.06, minSpan = 300 } = {}) {
  const bw = (x1 - x0) * (1 + 2 * margin), bh = (y1 - y0) * (1 + 2 * margin);
  const bandH = view.h - insets.top - insets.bottom;
  if (view.w <= 0 || view.h <= 0 || bandH <= 0) return null;
  // Skala mieści bryłę w szerokości (minimum minSpan) i w wysokości pasa.
  const scale = Math.min(view.w / Math.max(bw, minSpan), bandH / bh);
  const vbW = view.w / scale, vbH = view.h / scale;
  // Środek bbox na środku szerokości; dół z marginesem ląduje na view.h − bottom.
  const vbX = (x0 + x1) / 2 - vbW / 2;
  const vbY = y1 + margin * (y1 - y0) - (view.h - insets.bottom) / scale;
  return { viewBox: [vbX, vbY, vbW, vbH], scale, visible: [vbX, vbY, vbX + vbW, vbY + vbH] };
}

// Atrybut viewBox: liczby zaokrąglone do 0,01 z kropką dziesiętną.
export const viewBoxAttr = (f) => f.viewBox.map((v) => Math.round(v * 100) / 100).join(' ');
