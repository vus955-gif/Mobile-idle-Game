// Widoki zza okna w Kosmosie: 9 kolonii (orbita, L2, Księżyc, Mars, Wenus, Merkury, Ceres, Europa, Tytan).
// ★ (dopracowane): leo — Ziemia z orbity, mars — zachód słońca na Marsie, europa — Jowisz nad lodem Europy.
// Horyzont powierzchni leży w dolnych ~35% kadru (w części 1 i tak zasłania go grunt SVG sceny).
import { rng, perlin, fbm, clamp, mix } from '../noise.js';
import { pixelLayer, addLayer, glow } from '../canvas.js';
import { stars } from '../kit/sky.js';
import { planet, rings, sun } from '../kit/bodies.js';
import { horizon } from '../kit/surface.js';
import { gradient } from './placeholder.js';
import { recipe, spaceBase, distantGalaxies } from './common.js';

const L = (color, dir, ambient, rim) => ({ color, dir, ambient, rim });
const STOPS = {
  leo: ['#000006', '#040616', '#0a1030'], l2: ['#000003', '#020310', '#060a22'], moon: ['#000003', '#04050e', '#0c0e20'],
  mars: ['#3a2218', '#8a5236', '#d49a64'], venus: ['#6b4b12', '#c99a3a', '#f3d27a'], mercury: ['#000004', '#0a0608', '#1c120c'],
  ceres: ['#000004', '#05050e', '#0f0f22'], europa: ['#000006', '#050818', '#0e1330'], titan: ['#55340f', '#a8692a', '#dda057'],
};
const LIGHT = {
  leo: L([255, 248, 235], [-0.8, -0.6], 0.35, [110, 170, 255]), l2: L([255, 245, 230], [-0.6, -0.8], 0.25, [150, 170, 230]),
  moon: L([255, 250, 240], [-0.8, -0.6], 0.3, [140, 180, 255]), mars: L([255, 215, 170], [0.8, -0.6], 0.55, [255, 170, 120]),
  venus: L([255, 225, 150], [0, -1], 0.75, [255, 210, 120]), mercury: L([255, 240, 210], [-0.6, -0.8], 0.4, [255, 200, 150]),
  ceres: L([240, 240, 245], [-0.8, -0.6], 0.25, [170, 180, 210]), europa: L([255, 230, 200], [0.6, -0.8], 0.35, [230, 180, 140]),
  titan: L([255, 190, 110], [0, -1], 0.7, [255, 170, 80]),
};
const unit = (w) => w / 300;
const BLACK = ['#000002', '#010106', '#03040e'];

// ---------- Niska orbita: satelita przelatujący nad Ziemią ----------
function satellite(ctx, w, h, t) {
  const k = unit(w), f = (t % 40) / 40, x = (-0.07 + f * 1.14) * w, y = (0.37 - Math.sin(f * Math.PI) * 0.1) * h;
  ctx.fillStyle = '#e8eefc'; ctx.fillRect(x - 2 * k, y - 1 * k, 4 * k, 2 * k);
  ctx.fillStyle = '#5b8cff'; ctx.fillRect(x - 8 * k, y - 0.7 * k, 5 * k, 1.4 * k); ctx.fillRect(x + 3 * k, y - 0.7 * k, 5 * k, 1.4 * k);
  if (Math.floor(t / 0.6) % 2) { ctx.fillStyle = 'rgba(255,90,90,.9)'; ctx.fillRect(x - 0.6 * k, y - 2.4 * k, 1.2 * k, 1.2 * k); }
}

// ---------- Wenus: wnętrze żółtych chmur ----------
function venusClouds(ctx, w, h) {
  const n = perlin(4141), n2 = perlin(4142), k = unit(w);
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const u = x / (180 * k), v = y / (34 * k);
    const c = clamp(fbm(n, u + fbm(n2, u * 0.5, v * 0.3, 2), v, 5) + 0.5);
    const depth = y / h;
    out[0] = mix(250, 140, depth * 0.7) * (0.75 + 0.35 * c);
    out[1] = mix(220, 90, depth * 0.8) * (0.7 + 0.35 * c);
    out[2] = mix(140, 30, depth) * (0.6 + 0.3 * c);
    out[3] = (0.35 + 0.55 * c) * 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}
function venusDrift(ctx, w, h, t) {
  const r = rng(4343), k = unit(w);
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const y = (0.12 + r() * 0.6) * h, len = (90 + r() * 120) * k, sp = 0.004 + r() * 0.006;
    const x = ((((r() - t * sp) % 1.6) + 1.6) % 1.6 - 0.3) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, len);
    g.addColorStop(0, `rgba(255,236,170,${(0.12 + r() * 0.1).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); ctx.translate(-x, -y);
    ctx.fillRect(x - len, y - len, len * 2, len * 2);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- Tytan: mgła i metanowe jeziora ----------
function titanLakes(ctx, w, h) {
  const r = rng(9191), k = unit(w);
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = (0.1 + r() * 0.8) * w, y = (0.8 + r() * 0.15) * h, rx = (18 + r() * 40) * k, ry = rx * 0.16;
    const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    g.addColorStop(0, 'rgba(40,20,8,0.85)'); g.addColorStop(1, 'rgba(110,60,22,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,110,0.25)';
    ctx.fillRect(x - rx * 0.6, y - ry * 0.2, rx * 1.2, Math.max(1, 0.6 * k));
  }
  ctx.restore();
}

const RECIPES = {
  leo: recipe('leo', {
    focus: { x: 0.5, y: 0.45 }, stops: STOPS.leo, light: LIGHT.leo,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2101, count: 700 });
      // krawędź Ziemi zawsze na 0,45 wysokości: promień liczy się w szerokościach, więc środek zależy od proporcji
      planet(ctx, { cx: 0.5, cy: 0.45 + (1.733 * w) / h, r: 1.733, seed: 71, kind: 'earth', light: [-0.92, 0.12, 0.05], atmosphere: [70, 150, 255], cityLights: true, clouds: 0.5, res: 0.6 });
      sun(ctx, { x: 0.1, y: 0.32, r: 0.03, color: [255, 220, 170], corona: 1.2, flare: 1 });
    },
    animate: satellite,
  }),
  l2: recipe('l2', {
    focus: { x: 0.35, y: 0.29 }, stops: STOPS.l2, light: LIGHT.l2,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2201, count: 600 });
      distantGalaxies(ctx, w, h, { seed: 2202, count: 180, size: 0.8, alpha: 0.85 });
      sun(ctx, { x: 0.78, y: 0.14, r: 0.012, color: [255, 235, 200], corona: 0.8, flare: 0.6 });
      planet(ctx, { cx: 0.32, cy: 0.3, r: 0.065, seed: 72, kind: 'earth', light: [0.8, 0.3, -0.1], atmosphere: [70, 150, 255], cityLights: true });
      planet(ctx, { cx: 0.44, cy: 0.25, r: 0.018, seed: 73, kind: 'rocky', light: [0.8, 0.3, -0.1] });
    },
  }),
  moon: recipe('moon', {
    focus: { x: 0.68, y: 0.2 }, stops: STOPS.moon, light: LIGHT.moon,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2301, count: 800 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, -0.05 * w, 0.45 * h, 0.45 * w, '255,245,220', 0.12); ctx.restore();
      planet(ctx, { cx: 0.68, cy: 0.2, r: 0.09, seed: 74, kind: 'earth', light: [-0.8, 0.2, 0.55], atmosphere: [70, 150, 255], cityLights: true });
      horizon(ctx, w, h, { seed: 2302, y: 0.66, kind: 'regolith', light: [-0.8, -0.4] });
    },
  }),
  mars: recipe('mars', {
    focus: { x: 0.64, y: 0.42 }, stops: STOPS.mars, light: LIGHT.mars,
    draw(ctx, w, h) {
      gradient(ctx, w, h, ['#24150f', '#6e4129', '#c99060']);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0.64 * w, 0.42 * h, 0.42 * w, '90,140,220', 0.45);
      glow(ctx, 0.64 * w, 0.42 * h, 0.12 * w, '170,205,255', 0.55);
      ctx.restore();
      sun(ctx, { x: 0.64, y: 0.42, r: 0.016, color: [200, 225, 255], corona: 0.6, core: [255, 255, 250] });
      stars(ctx, w, h, { seed: 2401, count: Math.round((40 * w * h) / 480000) });
      planet(ctx, { cx: 0.28, cy: 0.16, r: 0.012, seed: 75, kind: 'rocky', light: [0.9, -0.3, 0.2], palette: [[50, 40, 35], [120, 100, 85]] });
      horizon(ctx, w, h, { seed: 2402, y: 0.68, kind: 'rust', light: [0.8, -0.5] });
    },
  }),
  venus: recipe('venus', {
    focus: { x: 0.4, y: 0.25 }, stops: STOPS.venus, light: LIGHT.venus,
    draw(ctx, w, h) {
      gradient(ctx, w, h, ['#8a5f1c', '#c58f3a', '#e7c070']);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0.4 * w, 0.25 * h, 0.4 * w, '255,235,170', 0.35);
      glow(ctx, 0.4 * w, 0.25 * h, 0.05 * w, '255,250,225', 0.6);
      ctx.restore();
      venusClouds(ctx, w, h);
    },
    animate: venusDrift,
  }),
  mercury: recipe('mercury', {
    focus: { x: 0.55, y: 0.2 }, stops: STOPS.mercury, light: LIGHT.mercury,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2601, count: 650 });
      sun(ctx, { x: 0.55, y: 0.2, r: 0.14, color: [255, 200, 120], corona: 1.6, flare: 0.5 });
      horizon(ctx, w, h, { seed: 2602, y: 0.7, kind: 'rock', light: [0.1, -1] });
    },
  }),
  ceres: recipe('ceres', {
    focus: { x: 0.25, y: 0.15 }, stops: STOPS.ceres, light: LIGHT.ceres,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2701, count: 950, band: { angle: -0.4, width: 0.2, color: [150, 140, 175], strength: 0.7 } });
      sun(ctx, { x: 0.25, y: 0.15, r: 0.012, color: [255, 240, 215], corona: 0.9, flare: 0.4 });
      horizon(ctx, w, h, { seed: 2702, y: 0.7, kind: 'rock', light: [-0.8, -0.5] });
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, s] of [[0.32, 0.84, 9], [0.36, 0.83, 5], [0.7, 0.88, 6]]) glow(ctx, x * w, y * h, s * unit(w), '235,245,255', 0.75);
      ctx.restore();
    },
  }),
  europa: recipe('europa', {
    focus: { x: 0.55, y: 0.22 }, stops: STOPS.europa, light: LIGHT.europa,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: BLACK, seed: 2801, count: 700 });
      planet(ctx, {
        cx: 0.55, cy: 0.22, r: 0.3, seed: 76, kind: 'gas', light: [-0.75, 0.2, 0.62],
        bands: [[150, 105, 80], [225, 200, 170], [170, 120, 85], [235, 220, 195], [200, 170, 135], [160, 115, 85]],
        spot: { lat: -0.35, lon: 0.45, r: 0.17, color: [190, 85, 55] }, res: 0.7,
      });
      planet(ctx, { cx: 0.16, cy: 0.36, r: 0.016, seed: 77, kind: 'rocky', light: [0.7, 0.3, 0.6], palette: [[150, 130, 50], [240, 220, 120]] });
      horizon(ctx, w, h, { seed: 2802, y: 0.7, kind: 'ice', light: [-0.7, -0.4] });
    },
  }),
  titan: recipe('titan', {
    focus: { x: 0.6, y: 0.22 }, stops: STOPS.titan, light: LIGHT.titan,
    draw(ctx, w, h) {
      gradient(ctx, w, h, ['#3a220a', '#8a5420', '#d0954c']);
      rings(ctx, { cx: 0.6, cy: 0.22, r1: 0.16, r2: 0.28, tilt: 0.22, color: [230, 200, 150], light: [0, 0.5], half: 'back' });
      planet(ctx, { cx: 0.6, cy: 0.22, r: 0.11, seed: 78, kind: 'gas', light: [0.2, 0.4, 0.9], bands: [[200, 170, 120], [230, 210, 160], [190, 155, 105]], res: 0.7 });
      rings(ctx, { cx: 0.6, cy: 0.22, r1: 0.16, r2: 0.28, tilt: 0.22, color: [230, 200, 150], light: [0, 0.5], half: 'front' });
      ctx.save(); ctx.fillStyle = 'rgba(205,130,55,0.66)'; ctx.fillRect(0, 0, w, h); ctx.restore();
      horizon(ctx, w, h, { seed: 2902, y: 0.72, kind: 'dunes', light: [0, -1] });
      titanLakes(ctx, w, h);
      const g = ctx.createLinearGradient(0, 0.55 * h, 0, h);
      g.addColorStop(0, 'rgba(220,140,60,0)'); g.addColorStop(1, 'rgba(220,140,60,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 0.55 * h, w, 0.45 * h);
    },
  }),
};

export const SPACE_RECIPES = RECIPES;
