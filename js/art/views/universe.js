// Widoki z cytadeli we Wszechświecie: galaktyki, gromady i kraniec obserwowalnego kosmosu.
// ★ (dopracowane): andromeda — wielka spirala z satelitami, bullet — zderzenie gromad (Gromada Pocisk),
// edge — poświata Wielkiego Wybuchu z pierwszymi gwiazdami.
import { rng, perlin, fbm, clamp, sstep, mix } from '../noise.js';
import { pixelLayer, addLayer, glow } from '../canvas.js';
import { milkyBand, cosmicWeb, brightStar } from '../kit/sky.js';
import { galaxy, cluster } from '../kit/bodies.js';
import { recipe, spaceBase, distantGalaxies } from './common.js';

const L = (color, dir, ambient, rim) => ({ color, dir, ambient, rim });
const STOPS = {
  milkyway: ['#000003', '#04030f', '#0b0820'], andromeda: ['#010208', '#050a1e', '#0d1636'], triangulum: ['#020206', '#08081a', '#121230'],
  virgo: ['#040302', '#100c08', '#221a10'], bullet: ['#060208', '#14061c', '#260c30'], attractor: ['#020408', '#061020', '#0c1e38'],
  bootes: ['#000000', '#010101', '#030306'], hercules: ['#030104', '#0e0612', '#1c0c22'], edge: ['#1a0a04', '#3a1608', '#5a2a10'],
};
const LIGHT = {
  milkyway: L([240, 235, 250], [0, -1], 0.35, [210, 210, 255]), andromeda: L([225, 232, 255], [-0.6, -0.8], 0.35, [180, 200, 255]),
  triangulum: L([255, 190, 220], [0.6, -0.8], 0.35, [255, 150, 200]), virgo: L([255, 220, 160], [0, -1], 0.4, [255, 200, 130]),
  bullet: L([235, 140, 230], [0.6, -0.8], 0.4, [120, 170, 255]), attractor: L([255, 245, 230], [0, -1], 0.4, [200, 220, 255]),
  bootes: L([200, 200, 215], [0, -1], 0.15, [120, 120, 150]), hercules: L([200, 170, 255], [0, -1], 0.4, [170, 140, 255]),
  edge: L([255, 170, 100], [0, -1], 0.5, [255, 140, 80]),
};
const unit = (w) => w / 300;
const DEEP = ['#010104', '#020208', '#05050f'];

// ---------- Gromada w Pannie: M87 z dżetem ----------
const M87 = { x: 0.44, y: 0.3 }, JET_END = { x: 0.64, y: 0.2 };
function virgoJet(ctx, w, h, t) {
  const k = unit(w), x0 = M87.x * w, y0 = M87.y * h, x1 = JET_END.x * w, y1 = JET_END.y * h;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.6 + 0.4 * Math.sin(t * 1.3);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(190,220,255,${(0.75 * pulse).toFixed(3)})`);
  g.addColorStop(1, 'rgba(160,200,255,0)');
  ctx.strokeStyle = g; ctx.lineWidth = 1.6 * k;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const f = ((t * 0.08 + i / 5) % 1), x = mix(x0, x1, f), y = mix(y0, y1, f);
    glow(ctx, x, y, (3 + 2 * (1 - f)) * k, '200,225,255', 0.7 * (1 - f));
  }
  ctx.restore();
}

// ---------- Wielki Atraktor: strumienie galaktyk spływające ku jasnemu obszarowi ----------
const ATT = { x: 0.6, y: 0.26 };
function streams(w, h) {
  const r = rng(6161), out = [];
  for (let s = 0; s < 14; s++) {
    const ang = (s / 14) * Math.PI * 2 + r() * 0.3, dist = 0.75 + r() * 0.35, curl = (r() < 0.5 ? -1 : 1) * (1.3 + r() * 1.4);
    out.push({ ang, dist, curl, n: 20 + ((r() * 14) | 0), seed: r() });
  }
  return out.map((st) => ({ ...st, point: (f) => {
    const a = st.ang + st.curl * f, d = st.dist * (1 - f);
    return [ATT.x * w + Math.cos(a) * d * w * 0.8, ATT.y * h + Math.sin(a) * d * w * 0.62];
  } }));
}
function attractorStatic(ctx, w, h) {
  const k = unit(w);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, ATT.x * w, ATT.y * h, 0.35 * w, '255,236,210', 0.28);
  glow(ctx, ATT.x * w, ATT.y * h, 0.1 * w, '255,248,235', 0.6);
  const r = rng(6262);
  for (const st of streams(w, h)) {
    for (let i = 0; i < st.n; i++) {
      const f = Math.pow(r(), 0.8) * 0.96, [px, py] = st.point(f), s = (0.6 + r() * 1.4) * k;
      const x = px + (r() - 0.5) * 0.05 * w * (1 - f), y = py + (r() - 0.5) * 0.05 * w * (1 - f);
      glow(ctx, x, y, s * 2.4, r() > 0.5 ? '255,230,200' : '205,220,255', 0.8);
    }
  }
  ctx.restore();
}
function attractorDrift(ctx, w, h, t) {
  const k = unit(w);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const st of streams(w, h)) {
    for (let i = 0; i < 4; i++) {
      const f = ((t * 0.015 + i / 4 + st.seed) % 1) * 0.96, [x, y] = st.point(f);
      ctx.fillStyle = `rgba(240,240,255,${(0.6 * (1 - f)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, 0.9 * k, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Gromada Pocisk: różowy gaz (rentgen) między gromadami, niebieska mapa masy na galaktykach ----------
const BULLET = { a: { x: 0.3, y: 0.3 }, b: { x: 0.71, y: 0.33 } };
function bulletGas(ctx, w, h) {
  const n = perlin(7171), k = unit(w);
  const A = [BULLET.a.x * w, BULLET.a.y * h], B = [BULLET.b.x * w, BULLET.b.y * h];
  const gasA = [0.44 * w, 0.31 * h], gasB = [0.6 * w, 0.32 * h];
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const tex = 0.75 + 0.25 * fbm(n, x / (40 * k), y / (40 * k), 4) * 2;
    const g = (p, rx, ry) => Math.exp(-(Math.pow((x - p[0]) / rx, 2) + Math.pow((y - p[1]) / ry, 2)));
    const blue = 0.55 * (g(A, 0.17 * w, 0.14 * w) + g(B, 0.13 * w, 0.11 * w));
    // „pocisk”: zwarty obłok gazu z ostrym frontem fali uderzeniowej po prawej
    const dx = x - gasB[0], front = dx > 0 ? Math.exp(-Math.pow(dx / (0.035 * w), 2)) : 1;
    const pink = (0.5 * g(gasA, 0.15 * w, 0.12 * w) + 0.7 * g(gasB, 0.09 * w, 0.07 * w) * front) * tex;
    const a = clamp(blue + pink);
    if (a < 0.004) return;
    out[0] = (90 * blue + 255 * pink) / a; out[1] = (140 * blue + 90 * pink) / a; out[2] = (255 * blue + 200 * pink) / a; out[3] = a * 255;
  });
  addLayer(ctx, layer, w, h);
}

// ---------- Kraniec Wszechświata: mikrofalowe promieniowanie tła ----------
const CMB = [[20, 40, 120], [60, 120, 200], [235, 225, 200], [240, 120, 40], [150, 30, 20]];
function cmbColor(t) {
  const f = clamp(t) * (CMB.length - 1), i = Math.min(CMB.length - 2, Math.floor(f)), u = f - i;
  return [mix(CMB[i][0], CMB[i + 1][0], u), mix(CMB[i][1], CMB[i + 1][1], u), mix(CMB[i][2], CMB[i + 1][2], u)];
}
function cmb(ctx, w, h) {
  const n = perlin(8181), n2 = perlin(8182), k = unit(w);
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const u = x / (55 * k), v = y / (55 * k);
    const t = sstep(-0.42, 0.42, fbm(n, u, v, 6) + 0.35 * fbm(n2, u * 0.3, v * 0.3, 3));
    const vig = 0.25 + 0.75 * clamp(1 - Math.pow(Math.hypot(x / w - 0.5, (y / h - 0.4) * 0.8) * 1.6, 2));
    const [r, g, b] = cmbColor(t);
    out[0] = r * vig * 0.5; out[1] = g * vig * 0.5; out[2] = b * vig * 0.5; out[3] = 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}

const RECIPES = {
  milkyway: recipe('milkyway', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.milkyway, light: LIGHT.milkyway,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: DEEP, seed: 1101, count: 320 });
      distantGalaxies(ctx, w, h, { seed: 1102, count: 70, size: 0.8, alpha: 0.6 });
      galaxy(ctx, { cx: 0.5, cy: 0.3, r: 0.5, tilt: 0.88, rot: 0.6, seed: 1103, type: 'spiral', arms: 4, core: [255, 226, 175], arm: [185, 200, 255], dust: 0.55, bright: 1.4 });
      cluster(ctx, { cx: 0.78, cy: 0.5, r: 0.05, count: 160, seed: 1104, color: [210, 220, 255] });
      cluster(ctx, { cx: 0.86, cy: 0.46, r: 0.03, count: 80, seed: 1105, color: [210, 220, 255] });
    },
  }),
  andromeda: recipe('andromeda', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.andromeda, light: LIGHT.andromeda,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: DEEP, seed: 1201, count: 520 });
      distantGalaxies(ctx, w, h, { seed: 1202, count: 50, size: 0.7, alpha: 0.5 });
      galaxy(ctx, { cx: 0.5, cy: 0.3, r: 0.62, tilt: 0.3, rot: -0.62, seed: 1203, type: 'spiral', arms: 2, core: [255, 230, 190], arm: [190, 205, 255], dust: 0.95, bright: 1.9 });
      galaxy(ctx, { cx: 0.6, cy: 0.33, r: 0.035, tilt: 0.85, rot: 0, seed: 1204, type: 'elliptical', core: [255, 235, 205], arm: [255, 225, 200] });
      galaxy(ctx, { cx: 0.3, cy: 0.16, r: 0.07, tilt: 0.45, rot: 0.9, seed: 1205, type: 'elliptical', core: [255, 228, 200], arm: [240, 220, 200] });
    },
  }),
  triangulum: recipe('triangulum', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.triangulum, light: LIGHT.triangulum,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: DEEP, seed: 1301, count: 420 });
      distantGalaxies(ctx, w, h, { seed: 1302, count: 60, size: 0.8, alpha: 0.55 });
      galaxy(ctx, { cx: 0.5, cy: 0.3, r: 0.44, tilt: 0.72, rot: 0.35, seed: 1303, type: 'spiral', arms: 3, core: [255, 236, 210], arm: [190, 205, 255], dust: 0.3, bright: 1.3 });
      const r = rng(1304);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const a = r() * Math.PI * 2, d = 0.08 + r() * 0.3;
        const x = (0.5 + Math.cos(a) * d) * w, y = 0.3 * h + Math.sin(a) * d * w * 0.72;
        glow(ctx, x, y, (3 + r() * 6) * unit(w), '255,105,170', 0.55);
      }
      ctx.restore();
    },
  }),
  virgo: recipe('virgo', {
    focus: { x: M87.x, y: M87.y }, stops: STOPS.virgo, light: LIGHT.virgo,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#030201', '#070503', '#0e0a06'], seed: 1401, count: 300 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0.5 * w, 0.32 * h, 0.5 * w, '255,215,160', 0.12); ctx.restore();
      const r = rng(1402);
      for (let i = 0; i < 26; i++) {
        const x = 0.06 + r() * 0.88, y = 0.06 + r() * 0.5, size = 0.03 + Math.pow(r(), 2) * 0.08;
        if (Math.hypot(x - M87.x, y - M87.y) < 0.14) continue;
        const spiral = r() < 0.25;
        galaxy(ctx, { cx: x, cy: y, r: size, tilt: 0.4 + r() * 0.6, rot: r() * 3, seed: 1410 + i, type: spiral ? 'spiral' : 'elliptical', core: [255, 225, 180], arm: spiral ? [190, 205, 255] : [255, 215, 170], bright: 1.6 });
      }
      galaxy(ctx, { cx: M87.x, cy: M87.y, r: 0.22, tilt: 0.9, rot: 0, seed: 1403, type: 'elliptical', core: [255, 232, 195], arm: [255, 210, 160], bright: 1.7 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(190,220,255,0.45)'; ctx.lineWidth = 1.2 * unit(w); ctx.beginPath(); ctx.moveTo(M87.x * w, M87.y * h); ctx.lineTo(JET_END.x * w, JET_END.y * h); ctx.stroke(); ctx.restore();
      distantGalaxies(ctx, w, h, { seed: 1404, count: 120, size: 0.9, warm: 0.8 });
    },
    animate: virgoJet,
  }),
  bullet: recipe('bullet', {
    focus: { x: 0.5, y: 0.31 }, stops: STOPS.bullet, light: LIGHT.bullet,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: DEEP, seed: 1501, count: 300 });
      distantGalaxies(ctx, w, h, { seed: 1502, count: 90, size: 0.7, alpha: 0.5 });
      bulletGas(ctx, w, h);
      distantGalaxies(ctx, w, h, { seed: 1503, count: 60, area: [0.18, 0.18, 0.44, 0.43], size: 1.5, warm: 0.9 });
      distantGalaxies(ctx, w, h, { seed: 1504, count: 40, area: [0.62, 0.23, 0.82, 0.43], size: 1.4, warm: 0.9 });
      galaxy(ctx, { cx: BULLET.a.x, cy: BULLET.a.y, r: 0.05, tilt: 0.8, rot: 0, seed: 1505, type: 'elliptical', core: [255, 235, 200], arm: [255, 220, 180] });
      galaxy(ctx, { cx: BULLET.b.x, cy: BULLET.b.y, r: 0.04, tilt: 0.8, rot: 0, seed: 1506, type: 'elliptical', core: [255, 235, 200], arm: [255, 220, 180] });
    },
  }),
  attractor: recipe('attractor', {
    focus: { x: ATT.x, y: ATT.y }, stops: STOPS.attractor, light: LIGHT.attractor,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#010206', '#030712', '#07101e'], seed: 1601, count: 380 });
      distantGalaxies(ctx, w, h, { seed: 1602, count: 60, size: 0.7, alpha: 0.5 });
      attractorStatic(ctx, w, h);
    },
    animate: attractorDrift,
  }),
  bootes: recipe('bootes', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.bootes, light: LIGHT.bootes,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#000000', '#000001', '#020204'], seed: 1701, count: 120 });
      // ściany pustki na skraju kadru, w środku cisza
      for (const [x0, y0, x1, y1] of [[0, 0, 1, 0.07], [0, 0, 0.08, 1], [0.92, 0, 1, 1]]) {
        distantGalaxies(ctx, w, h, { seed: 1702 + x0 * 10 + y1, count: 70, area: [x0, y0, x1, y1], size: 1, alpha: 0.7 });
      }
      const r = rng(1705);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [gx, gy] of [[0.5, -0.05], [-0.05, 0.4], [1.05, 0.45]]) glow(ctx, gx * w, gy * h, 0.45 * w, '150,150,200', 0.08);
      ctx.restore();
      for (let i = 0; i < 7; i++) galaxy(ctx, { cx: 0.2 + r() * 0.6, cy: 0.12 + r() * 0.4, r: 0.02 + r() * 0.03, bright: 1.6, tilt: 0.4 + r() * 0.5, rot: r() * 3, seed: 1710 + i, type: r() < 0.5 ? 'spiral' : 'elliptical', core: [255, 230, 200], arm: [200, 210, 240] });
    },
  }),
  hercules: recipe('hercules', {
    focus: { x: 0.5, y: 0.3 }, stops: STOPS.hercules, light: LIGHT.hercules,
    draw(ctx, w, h) {
      spaceBase(ctx, w, h, { stops: ['#020103', '#06030a', '#0e0614'], seed: 1801, count: 260 });
      cosmicWeb(ctx, w, h, { seed: 1802, scale: 120, color: [120, 95, 235], node: [255, 210, 160], galaxies: 120 });
      milkyBand(ctx, w, h, { seed: 1803, angle: -0.5, width: 0.16, color: [175, 140, 255], strength: 0.6 });
      const r = rng(1804), k = unit(w);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 380; i++) {
        const t = r(), off = (r() + r() + r() - 1.5) * 0.12;
        const x = (t - 0.1) * 1.2 * w, y = (0.52 - t * 0.5 + off) * h;
        glow(ctx, x, y, (1 + Math.pow(r(), 3) * 3) * k * 2.2, r() > 0.5 ? '255,232,205' : '205,215,255', 0.85);
      }
      ctx.restore();
    },
  }),
  edge: recipe('edge', {
    focus: { x: 0.5, y: 0.35 }, stops: STOPS.edge, light: LIGHT.edge,
    draw(ctx, w, h) {
      cmb(ctx, w, h);
      const r = rng(1902);
      for (let i = 0; i < 16; i++) {
        brightStar(ctx, w, h, { x: 0.08 + r() * 0.84, y: 0.06 + r() * 0.52, size: 3 + r() * 7, color: [190, 215, 255], spikes: r() < 0.4 ? 0.6 : 0 });
      }
      distantGalaxies(ctx, w, h, { seed: 1903, count: 40, area: [0.1, 0.1, 0.9, 0.6], size: 1.2, warm: 0.2 });
    },
  }),
};

export const UNIVERSE_RECIPES = RECIPES;
