// Generuje kropkową mapę świata (js/worldmap.js) z danych Natural Earth.
// Jednorazowe narzędzie deweloperskie — gra korzysta z gotowego pliku.
// Użycie:  npm install --no-save world-atlas topojson-client && node tools/make-worldmap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const topo = await import(require.resolve('topojson-client'));
const land = JSON.parse(readFileSync(process.argv[2] || require.resolve('world-atlas/land-50m.json'), 'utf8'));
const geo = topo.feature(land, land.objects.land);

const STEP = 3;
const LON0 = -180;
const LAT0 = 81;
const LAT1 = -57;
const COLS = 360 / STEP;
const ROWS = (LAT0 - LAT1) / STEP;

// Wielokąty z prostokątem otaczającym — szybkie odrzucanie przed testem punktu.
// Lądy przecinające antypołudnik (np. Czukotka w Eurazji) rozwijamy na długości 0–360°.
const polys = [];
const crosses = (ring) => ring.some(([x], i) => i > 0 && Math.abs(x - ring[i - 1][0]) > 180);
for (const f of geo.features) {
  const g = f.geometry;
  const list = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (let rings of list) {
    const wrap = crosses(rings[0]);
    if (wrap) rings = rings.map((r) => r.map(([x, y]) => [x < -90 ? x + 360 : x, y]));
    let minX = 400; let maxX = -400; let minY = 90; let maxY = -90;
    for (const [x, y] of rings[0]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    polys.push({ rings, minX, maxX, minY, maxY, wrap });
  }
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function isLand(x, y) {
  for (const p of polys) {
    const px = p.wrap && x < -90 ? x + 360 : x;
    if (px < p.minX || px > p.maxX || y < p.minY || y > p.maxY) continue;
    if (inRing(px, y, p.rings[0]) && !p.rings.slice(1).some((h) => inRing(px, y, h))) return true;
  }
  return false;
}

// Każda komórka to 3×3 próbki — kropka, gdy co najmniej 3 z nich leżą na lądzie.
const rows = [];
let dots = 0;
for (let r = 0; r < ROWS; r++) {
  let bits = '';
  for (let c = 0; c < COLS; c++) {
    let n = 0;
    for (let sy = 0; sy < 3; sy++) {
      for (let sx = 0; sx < 3; sx++) {
        const lon = LON0 + (c + (sx + 0.5) / 3) * STEP;
        const lat = LAT0 - (r + (sy + 0.5) / 3) * STEP;
        if (isLand(lon, lat)) n++;
      }
    }
    bits += n >= 3 ? '1' : '0';
    if (n >= 3) dots++;
  }
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  rows.push(hex);
}

const out = `// Kropkowa mapa świata wygenerowana przez tools/make-worldmap.mjs z danych Natural Earth
// (pakiet world-atlas, domena publiczna). Każdy wiersz to ${COLS} bitów zapisanych szesnastkowo.
export const WORLD = {
  step: ${STEP}, lon0: ${LON0}, lat0: ${LAT0}, cols: ${COLS},
  rows: [
${rows.map((r) => `    '${r}',`).join('\n')}
  ],
};
`;
writeFileSync(new URL('../js/worldmap.js', import.meta.url), out);
console.log(`worldmap: ${COLS}×${ROWS}, ${dots} kropek`);
