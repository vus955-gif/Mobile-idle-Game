// Widoki z mostka statku-matki w Galaktyce: 9 układów gwiezdnych.
// ★ (dopracowane): sol — rój Dysona, crab — Mgławica Kraba z pulsarem, orion — Mgławica Oriona,
// lmc — Droga Mleczna widziana z Wielkiego Obłoku Magellana, sgr — czarna dziura Sagittarius A*.
import { rng, perlin, fbm, ridged, clamp, sstep, mix } from '../noise.js';
import { pixelLayer, addLayer, glow } from '../canvas.js';
import { nebula, brightStar } from '../kit/sky.js';
import { sun, planet, galaxy, cluster, lens, blackHole, blackHoleAnimator } from '../kit/bodies.js';
import { recipe, spaceBase } from './common.js';

const L = (color, dir, ambient, rim) => ({ color, dir, ambient, rim });
const STOPS = {
  sol: ['#000005', '#05061a', '#0d0f2e'], alpha: ['#050208', '#140a1c', '#2a1630'], trappist: ['#050102', '#0e0305', '#1a0508'],
  pleiades: ['#01030c', '#06122e', '#0f2552'], crab: ['#020208', '#0b0a1f', '#1c1236'], orion: ['#0b0210', '#2a0a2e', '#4d1440'],
  omega: ['#060402', '#16100a', '#2b2012'], lmc: ['#000000', '#020208', '#070a18'], sgr: ['#050100', '#140602', '#2e0f05'],
};
const LIGHT = {
  sol: L([255, 246, 225], [-0.6, -0.8], 0.4, [255, 220, 170]), alpha: L([255, 220, 160], [-0.7, -0.7], 0.4, [255, 200, 140]),
  trappist: L([255, 120, 90], [0.6, -0.8], 0.3, [255, 90, 70]), pleiades: L([170, 200, 255], [0, -1], 0.45, [140, 180, 255]),
  crab: L([140, 230, 230], [0.5, -0.87], 0.35, [120, 220, 255]), orion: L([255, 150, 200], [0.6, -0.8], 0.45, [90, 220, 220]),
  omega: L([255, 215, 150], [0, -1], 0.45, [255, 200, 130]), lmc: L([235, 230, 245], [-0.5, -0.87], 0.35, [200, 210, 255]),
  sgr: L([255, 160, 80], [0, -1], 0.35, [255, 140, 60]),
};
const unit = (w) => w / 300;

// ---------- Rój Dysona: tysiące paneli na pochylonych orbitach wokół Słońca ----------
const SOL = { x: 0.5, y: 0.3, r: 0.05 };
function swarmPanels(w, h) {
  const r = rng(4242), cx = SOL.x * w, cy = SOL.y * h, sunR = SOL.r * w, out = [];
  for (let i = 0; i < 5; i++) {
    const R0 = (0.1 + i * 0.045) * w, tilt = 0.18 + ((i * 37) % 5) * 0.07, rot = ((i * 0.83) % 1.6) - 0.8;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let j = 0; j < 520; j++) {
      const a = r() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), R = R0 + (r() - 0.5) * 0.026 * w;
      const x = cx + ca * R * cr - sa * R * tilt * sr, y = cy + ca * R * sr + sa * R * tilt * cr;
      const front = sa > 0, d = Math.hypot(x - cx, y - cy);
      if (!front && d < sunR * 1.15) continue;
      out.push({ x, y, front, onSun: front && d < sunR, g: 0.15 + 0.85 * Math.pow(r(), 2), s: 0.5 + r() * 0.7, ph: r() * 100 });
    }
  }
  return out;
}
function drawSwarm(ctx, w, h) {
  const k = unit(w);
  ctx.save();
  for (const p of swarmPanels(w, h)) {
    const s = p.s * k;
    if (p.onSun) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(60,34,14,0.3)'; }
    else { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${(205 + p.g * 40) | 0},${(140 + p.g * 70) | 0},${(p.g * 0.6).toFixed(3)})`; }
    ctx.fillRect(p.x - s / 2, p.y - s * 0.3, s, s * 0.6);
  }
  ctx.restore();
}
function swarmGlints(ctx, w, h, t) {
  const k = unit(w);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of swarmPanels(w, h)) {
    if (p.onSun) continue;
    const s = Math.sin(t * 1.6 + p.ph);
    if (s < 0.993) continue;
    const a = (s - 0.993) / 0.007, L = (1 + p.s * 1.5) * k;
    ctx.fillStyle = `rgba(255,245,215,${(a * 0.9).toFixed(3)})`;
    ctx.fillRect(p.x - L, p.y - 0.35 * k, L * 2, 0.7 * k);
    ctx.fillRect(p.x - 0.35 * k, p.y - L, 0.7 * k, L * 2);
  }
  ctx.restore();
}

// ---------- Mgławica Kraba: włókna pozostałości po supernowej i pulsujący pulsar ----------
const CRAB = { x: 0.5, y: 0.3 };
function crabRemnant(ctx, w, h) {
  const n = perlin(5151), n2 = perlin(5152), k = unit(w), cx = CRAB.x * w, cy = CRAB.y * h, rx = 0.36 * w, ry = 0.25 * w;
  const rot = -0.35, cr = Math.cos(rot), sr = Math.sin(rot);
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const dx = x - cx, dy = y - cy, px = (dx * cr + dy * sr) / rx, py = (-dx * sr + dy * cr) / ry;
    const e = Math.hypot(px, py);
    if (e > 1.35) return;
    const u = x / (60 * k), v = y / (60 * k);
    const edge = sstep(1.18, 0.78, e + fbm(n, u * 0.7, v * 0.7, 3) * 0.25);
    const sync = Math.exp(-e * e * 2.2) * 0.6;
    const fil = Math.pow(sstep(0.47, 0.95, ridged(n, u + fbm(n2, u, v, 2), v, 5)), 2) * edge;
    const hue = sstep(-0.2, 0.3, fbm(n2, u * 0.5 + 3, v * 0.5, 3));
    const fr = mix(255, 200, hue), fg = mix(110, 255, hue), fb = mix(60, 140, hue);
    const a = clamp(sync + fil);
    if (a <= 0.003) return;
    out[0] = (120 * sync + fr * fil) / a; out[1] = (170 * sync + fg * fil) / a; out[2] = (255 * sync + fb * fil) / a; out[3] = a * 255;
  });
  addLayer(ctx, layer, w, h);
}
function crabPulsar(ctx, w, h, t) {
  const k = unit(w), x = CRAB.x * w, y = CRAB.y * h, p = Math.pow(0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 1.1), 8);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, (10 + 14 * p) * k, '170,220,255', 0.25 + 0.55 * p);
  const ang = t * 0.6, len = 46 * k;
  for (const sgn of [1, -1]) {
    const ex = x + Math.cos(ang) * len * sgn, ey = y + Math.sin(ang) * len * sgn * 0.6;
    const g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, `rgba(200,235,255,${(0.35 * p).toFixed(3)})`);
    g.addColorStop(1, 'rgba(200,235,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.4 * k;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  }
  ctx.restore();
}

// ---------- Orion: powolny dryf gwiazd na pierwszym planie ----------
function orionDrift(ctx, w, h, t) {
  const r = rng(3131), k = unit(w);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const x0 = r(), y = r() * h * 0.62, v = 0.004 + r() * 0.008, m = r();
    const x = (((x0 - t * v) % 1) + 1) % 1 * w;
    ctx.fillStyle = `rgba(235,240,255,${(0.35 + m * 0.5).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, (0.5 + m * 0.9) * k, 0, Math.PI * 2); ctx.fill();
    if (m > 0.85) glow(ctx, x, y, 5 * k, '220,230,255', 0.3);
  }
  ctx.restore();
}

// ---------- TRAPPIST-1: planety jako sierpy oświetlone przez czerwonego karła ----------
const TRAPPIST_STAR = { x: 0.52, y: 0.17 };
const TRAPPIST_PLANETS = [[0.24, 0.33, 0.05, 'rocky'], [0.75, 0.3, 0.036, 'ice'], [0.4, 0.44, 0.065, 'rocky'], [0.84, 0.43, 0.026, 'rocky'], [0.13, 0.19, 0.02, 'ice'], [0.68, 0.11, 0.016, 'rocky']];

const RECIPES = {
  sol: recipe('sol', {
    focus: { x: SOL.x, y: SOL.y }, stops: STOPS.sol, light: LIGHT.sol,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.sol, seed: 101, count: 800, band: { angle: -0.5, width: 0.22, color: [150, 140, 190], strength: 0.6 } });
      sun(ctx, { x: SOL.x, y: SOL.y, r: SOL.r, color: [255, 214, 140], corona: 1.3, flare: 0.6 });
      drawSwarm(ctx, w, h);
    },
    animate: swarmGlints,
  }),
  alpha: recipe('alpha', {
    focus: { x: 0.48, y: 0.24 }, stops: STOPS.alpha, light: LIGHT.alpha,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.alpha, seed: 201, count: 950, band: { angle: 0.35, width: 0.24, color: [175, 150, 200], strength: 0.85 } });
      brightStar(ctx, w, h, { x: 0.16, y: 0.11, size: 6, color: [255, 90, 70], spikes: 0.3 });
      sun(ctx, { x: 0.6, y: 0.29, r: 0.022, color: [255, 170, 90], corona: 1, core: [255, 236, 200] });
      sun(ctx, { x: 0.42, y: 0.22, r: 0.034, color: [255, 226, 150], corona: 1.3, flare: 0.8 });
    },
  }),
  trappist: recipe('trappist', {
    focus: { x: TRAPPIST_STAR.x, y: 0.25 }, stops: STOPS.trappist, light: LIGHT.trappist,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.trappist, seed: 301, count: 700 });
      sun(ctx, { x: TRAPPIST_STAR.x, y: TRAPPIST_STAR.y, r: 0.06, color: [255, 80, 45], corona: 1.7, flare: 0.25, core: [255, 190, 140] });
      TRAPPIST_PLANETS.forEach(([x, y, r, kind], i) => {
        const dx = (TRAPPIST_STAR.x - x) * w, dy = (TRAPPIST_STAR.y - y) * h, len = Math.hypot(dx, dy);
        planet(ctx, { cx: x, cy: y, r, seed: 310 + i, kind, light: [dx / len, -dy / len, 0.05], atmosphere: i % 2 ? null : [255, 120, 90], palette: kind === 'ice' ? [[190, 150, 140], [255, 230, 215]] : [[120, 70, 55], [230, 150, 115]] });
      });
    },
  }),
  pleiades: recipe('pleiades', {
    focus: { x: 0.52, y: 0.28 }, stops: STOPS.pleiades, light: LIGHT.pleiades,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.pleiades, seed: 401, count: 900 });
      nebula(ctx, w, h, { seed: 402, palette: [[16, 32, 84], [38, 76, 158], [112, 152, 228]], core: { x: 0.52, y: 0.28, r: 0.36 }, dust: 0.3, scale: 120 });
      for (const [x, y, s] of [[0.38, 0.17, 15], [0.55, 0.21, 18], [0.47, 0.3, 13], [0.63, 0.33, 14], [0.32, 0.36, 11], [0.57, 0.42, 12], [0.7, 0.23, 10]]) {
        brightStar(ctx, w, h, { x, y, size: s, color: [165, 198, 255], spikes: 1 });
      }
    },
  }),
  crab: recipe('crab', {
    focus: { x: CRAB.x, y: CRAB.y }, stops: STOPS.crab, light: LIGHT.crab,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.crab, seed: 501, count: 750, band: { angle: 0.6, width: 0.2, color: [120, 120, 170], strength: 0.5 } });
      crabRemnant(ctx, w, h);
      brightStar(ctx, w, h, { x: CRAB.x, y: CRAB.y, size: 6, color: [190, 225, 255], spikes: 0.6 });
    },
    animate: crabPulsar,
  }),
  orion: recipe('orion', {
    focus: { x: 0.55, y: 0.32 }, stops: STOPS.orion, light: LIGHT.orion,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#05020a', '#0b0410', '#120616'], seed: 601, count: 650 });
      nebula(ctx, w, h, { seed: 21, palette: [[70, 200, 215], [255, 70, 160], [255, 226, 200]], core: { x: 0.55, y: 0.32, r: 0.42 }, dust: 0.85, scale: 95 });
      for (const [x, y, s] of [[0.53, 0.31, 14], [0.565, 0.29, 11], [0.55, 0.345, 12], [0.585, 0.325, 9], [0.3, 0.19, 9], [0.76, 0.43, 8]]) {
        brightStar(ctx, w, h, { x, y, size: s, color: [210, 225, 255], spikes: 1 });
      }
    },
    animate: orionDrift,
  }),
  omega: recipe('omega', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.omega, light: LIGHT.omega,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.omega, seed: 701, count: 600 });
      cluster(ctx, { cx: 0.5, cy: 0.3, r: 0.27, count: 2600, seed: 702, color: [255, 214, 150] });
    },
  }),
  lmc: recipe('lmc', {
    focus: { x: 0.5, y: 0.28 }, stops: STOPS.lmc, light: LIGHT.lmc,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: STOPS.lmc, seed: 801, count: 700 });
      galaxy(ctx, { cx: 0.5, cy: 0.27, r: 0.54, tilt: 0.5, rot: -0.35, seed: 802, type: 'spiral', arms: 2, core: [255, 228, 180], arm: [175, 195, 255], dust: 0.7 });
      galaxy(ctx, { cx: 0.85, cy: 0.1, r: 0.05, tilt: 0.7, rot: 0.4, seed: 803, type: 'elliptical', core: [255, 225, 190], arm: [240, 220, 200] });
      cluster(ctx, { cx: 0.18, cy: 0.52, r: 0.22, count: 700, seed: 804, color: [200, 215, 255] });
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0.24 * w, 0.47 * h, 0.07 * w, '255,110,170', 0.35);
      ctx.restore();
      brightStar(ctx, w, h, { x: 0.24, y: 0.47, size: 8, color: [255, 180, 210], spikes: 0.5 });
    },
  }),
  sgr: recipe('sgr', {
    focus: { x: 0.5, y: 0.36 }, stops: STOPS.sgr, light: LIGHT.sgr,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#020104', '#050307', '#0a060a'], seed: 901, count: 900, band: { angle: 0.35, width: 0.3, color: [170, 150, 200], strength: 1 } });
      lens(ctx, w, h, { cx: 0.5, cy: 0.36, shadow: 0.11, thetaE: 0.21 });
      blackHole(ctx, w, h, { cx: 0.5, cy: 0.36, shadow: 0.11, seed: 902 });
    },
    animate: blackHoleAnimator({ cx: 0.5, cy: 0.36, shadow: 0.11, seed: 902 }),
  }),
};

export const GALAXY_RECIPES = RECIPES;
