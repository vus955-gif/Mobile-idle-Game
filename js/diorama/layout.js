// Układ dioramy w siatce wyśrodkowanej na wyspie (gx, gy ∈ [−size/2, size/2]): rdzeń i stałe działki działów.
// Działka i należy do działu i + 1 (pierwszy dział to rdzeń). Kolejność: rzędami przed rdzeniem, na zmianę z prawej
// i z lewej, od środka ku krawędzi. Siatka co 1,5 kafelka: działka 1×1 i ścieżka 0,5. Aleja przed rdzeniem zostaje
// wolna (plac); na Ziemi rdzeń ma miejsce na obrys 3×3, gdzie indziej na 2,5×2,5.

const grid = (at, cells) => cells.map(([i, j]) => ({ gx: at[i], gy: at[j], w: 1, d: 1 }));
const EARTH = grid([-3.5, -2, -0.5, 1, 2.5], [[3, 2], [2, 3], [3, 1], [1, 3], [4, 2], [2, 4], [3, 0], [0, 3], [4, 1], [1, 4], [4, 3], [3, 4]]);
const SMALL = grid([-2.75, -1.25, 0.25, 1.75], [[2, 1], [1, 2], [2, 0], [0, 2], [3, 1], [1, 3], [3, 2], [2, 3]]);

export const SLOTS = { earth: EARTH, space: SMALL, galaxy: SMALL, universe: SMALL };
// Środek obrysu rdzenia.
export const CORE_AT = { earth: { gx: -1, gy: -1 }, space: { gx: -1.5, gy: -1.5 }, galaxy: { gx: -1.5, gy: -1.5 }, universe: { gx: -1.5, gy: -1.5 } };
export const LOT_MAX_H = { earth: 3, space: 3, galaxy: 3, universe: 3 };

const MARGIN = 0.25; // trawa między obrysem a brzegiem wyspy

// Rdzeń (obrys z coreFoot wokół CORE_AT) i n − 1 działek; size: najmniejsza parzysta wyspa z marginesem, od 4. rundy +2.
export function layout(stage, n, rounds, { w, d, h }) {
  const c = CORE_AT[stage], core = { gx: c.gx - w / 2, gy: c.gy - d / 2, gz: 0, w, d, h };
  const lots = SLOTS[stage].slice(0, n - 1).map(({ gx, gy, gz = 0, w, d }) => ({ gx, gy, gz, w, d, h: LOT_MAX_H[stage] }));
  const ext = Math.max(...[core, ...lots].flatMap((r) => [-r.gx, -r.gy, r.gx + r.w, r.gy + r.d]));
  return { size: 2 * Math.ceil(ext + MARGIN) + (rounds >= 4 ? 2 : 0), core, lots };
}
