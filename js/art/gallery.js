// Galeria widoków zza okna (narzędzie deweloperskie, tools/gallery.html): wszystkie 45 teł w siatce,
// z czasem generowania każdego (na głównym wątku, żeby mierzyć przepisy osobno) i działającymi animacjami.
import { EARTH_RECIPES } from './views/earth.js';
import { SPACE_RECIPES } from './views/space.js';
import { GALAXY_RECIPES } from './views/galaxy.js';
import { UNIVERSE_RECIPES } from './views/universe.js';
import { officeName } from '../text.js';

const BUDGET_MS = 125;
const W = 600, H = 800;
const STAGES = [
  ['🌍 Ziemia', EARTH_RECIPES, true],
  ['🛰️ Kosmos', SPACE_RECIPES, false],
  ['🌌 Galaktyka', GALAXY_RECIPES, false],
  ['🕳️ Wszechświat', UNIVERSE_RECIPES, false],
];
const $ = (id) => document.getElementById(id);
const tiles = [];

function env() {
  return { phase: $('phase').value, weather: $('weather').value, season: 'summer', holiday: null };
}

function build() {
  const root = $('sections');
  for (const [title, recipes, earth] of STAGES) {
    const h = document.createElement('h2');
    h.textContent = `${title} (${Object.keys(recipes).length})`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    root.append(h, grid);
    for (const [id, recipe] of Object.entries(recipes)) {
      const fig = document.createElement('figure');
      const frame = document.createElement('div');
      frame.className = 'frame';
      const main = document.createElement('canvas');
      main.width = W; main.height = H;
      const anim = document.createElement('canvas');
      anim.width = W; anim.height = H;
      frame.append(main, anim);
      const cap = document.createElement('figcaption');
      let name = id;
      try { name = officeName(id); } catch { /* brak nazwy — zostaje id */ }
      cap.innerHTML = `<span><b>${name}</b> <span style="opacity:.6">${id}</span>${recipe.placeholder ? '<span class="tag">zastępczy</span>' : ''}${recipe.animate ? '<span class="tag">animacja</span>' : ''}</span><span class="ms">…</span>`;
      fig.append(frame, cap);
      grid.append(fig);
      tiles.push({ id, recipe, earth, main, anim, ms: cap.querySelector('.ms') });
    }
  }
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function renderAll(onlyEarth = false) {
  const times = [];
  for (const t of tiles) {
    if (onlyEarth && !t.earth) continue;
    await nextFrame();
    const ctx = t.main.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    const t0 = performance.now();
    try {
      t.recipe.draw(ctx, W, H, t.earth ? env() : {});
      const ms = performance.now() - t0;
      t.time = ms;
      t.ms.textContent = `${Math.round(ms)} ms`;
      t.ms.classList.toggle('slow', ms > BUDGET_MS);
    } catch (err) {
      t.ms.textContent = 'błąd';
      t.ms.classList.add('slow');
      console.error(t.id, err);
    }
  }
  for (const t of tiles) if (typeof t.time === 'number') times.push(t.time);
  const max = Math.max(...times), slow = tiles.filter((t) => t.time > BUDGET_MS).length;
  const zast = tiles.filter((t) => t.recipe.placeholder).length;
  $('summary').textContent = `${tiles.length} widoków · najdłużej ${Math.round(max)} ms · ponad ${BUDGET_MS} ms: ${slow} · zastępcze: ${zast}`;
}

// Animacje: jedna pętla ≤ 30 kl./s dla wszystkich animowanych kafli.
function animate() {
  let last = 0;
  const loop = (ts) => {
    requestAnimationFrame(loop);
    if (ts - last < 33) return;
    last = ts;
    for (const t of tiles) {
      if (!t.recipe.animate) continue;
      const ctx = t.anim.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      t.recipe.animate(ctx, W, H, ts / 1000);
    }
  };
  requestAnimationFrame(loop);
}

build();
renderAll().then(animate);
$('phase').addEventListener('change', () => renderAll(true));
$('weather').addEventListener('change', () => renderAll(true));
