// Klocki nieba i panoram ziemskich: niebo wg pory dnia i pogody, słońce i księżyc, chmury, plany miasta
// z perspektywą powietrzną, góry, woda i mgła. Animowane chmury, opady i fajerwerki zostają w SVG sceny.
import { rng, perlin, fbm, mix } from '../noise.js';
import { glow } from '../canvas.js';

const unit = (w) => w / 300;
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const rgbStr = (c) => `${c[0] | 0},${c[1] | 0},${c[2] | 0}`;
const mixC = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// Kolory nieba jak w SKIES (js/scene.js) — skopiowane, bo klocki muszą działać w workerze bez DOM.
export const SKY = {
  night: { stops: ['#070a24', '#141a46', '#2a2f66'], far: '#1d2250', win: '#ffd88a', light: [150, 170, 255] },
  dawn: { stops: ['#3b3a85', '#c97aa8', '#ffc6a0'], far: '#7c6fa3', win: '#ffe7b0', light: [255, 190, 150] },
  day: { stops: ['#4fa8ff', '#8fd0ff', '#d7f0ff'], far: '#a9c8ea', win: '#e6f3ff', light: [255, 250, 240] },
  dusk: { stops: ['#2b2763', '#c05f8a', '#ffad7a'], far: '#5d5487', win: '#ffd88a', light: [255, 170, 120] },
};
const BAD = (weather) => weather === 'rain' || weather === 'snow' || weather === 'fog';
const sky = (phase) => SKY[phase] || SKY.day;

// Niebo: gradient pory dnia, przy złej pogodzie przykryty szarą zasłoną (jak w dotychczasowej scenie).
export function earthSky(ctx, w, h, { phase, weather }) {
  const S = sky(phase);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, S.stops[0]); g.addColorStop(0.6, S.stops[1]); g.addColorStop(1, S.stops[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (weather !== 'clear') {
    ctx.fillStyle = phase === 'night' ? '#1a1d33' : '#7d869f';
    ctx.globalAlpha = weather === 'cloudy' ? 0.22 : 0.38;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}

// Położenie słońca (świt — nisko po lewej, dzień — wysoko, zmierzch — nisko po prawej) i księżyca nocą.
const BODY = { dawn: [0.18, 0.56], day: [0.7, 0.16], dusk: [0.82, 0.54], night: [0.76, 0.17] };
export function sunMoon(ctx, w, h, { phase, weather }) {
  if (BAD(weather)) return;
  const [fx, fy] = BODY[phase] || BODY.day, x = fx * w, y = fy * h, k = unit(w);
  const dim = weather === 'cloudy' ? 0.55 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (phase === 'night') {
    glow(ctx, x, y, 46 * k, '200,210,255', 0.25 * dim);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(243,245,255,${dim})`;
    ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,205,225,0.35)';
    for (const [dx, dy, r] of [[-3, -2, 2.6], [3, 3, 2], [1, -5, 1.4]]) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); }
  } else {
    const warm = phase === 'day' ? '255,245,200' : '255,190,120';
    glow(ctx, x, y, 110 * k, warm, 0.35 * dim);
    glow(ctx, x, y, 34 * k, '255,250,225', 0.7 * dim);
    ctx.fillStyle = `rgba(255,250,230,${dim})`;
    ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Statyczne warstwy chmur: kilka smug przy ładnej pogodzie, gęsty pułap przy deszczu i śniegu.
export function cloudBank(ctx, w, h, { seed, phase, weather }) {
  const r = rng(seed), k = unit(w), S = sky(phase);
  const count = weather === 'clear' ? 4 : weather === 'cloudy' ? 9 : weather === 'fog' ? 5 : 13;
  const dark = BAD(weather) || weather === 'cloudy';
  const top = phase === 'night' ? [70, 78, 120] : dark ? [190, 196, 210] : [255, 255, 255];
  const under = phase === 'dawn' || phase === 'dusk' ? hex(S.stops[2]) : phase === 'night' ? [40, 44, 80] : dark ? [120, 128, 150] : [215, 228, 245];
  ctx.save();
  for (let i = 0; i < count; i++) {
    const cy = (0.06 + r() * (dark ? 0.35 : 0.45)) * h, cx = r() * w, len = (60 + r() * 120) * k, th = (8 + r() * 14) * k;
    const a = (dark ? 0.55 : 0.35) + r() * 0.3;
    for (let j = 0; j < 5; j++) {
      const ex = cx + (j - 2) * len * 0.22 + (r() - 0.5) * 10 * k, ey = cy + (r() - 0.5) * th * 0.6, rx = len * (0.22 + r() * 0.18), ry = th * (0.6 + r() * 0.5);
      const g = ctx.createLinearGradient(0, ey - ry, 0, ey + ry);
      g.addColorStop(0, `rgba(${rgbStr(top)},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgbStr(under)},${(a * 0.8).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// Trzy plany zabudowy: dalsze jaśniejsze i zamglone (perspektywa powietrzna), nocą i o zmierzchu z oknami.
// haze — opcjonalny kolor mgiełki (np. pył nad Dubajem); base — ułamek wysokości, na którym stoją budynki.
export function cityPlanes(ctx, w, h, { seed, phase, weather, planes = 3, density = 1, haze = null, base = 0.86 }) {
  const r = rng(seed), k = unit(w), S = sky(phase);
  const far = hex(S.far), air = haze || hex(S.stops[2]);
  const lit = phase === 'night' || phase === 'dusk';
  const fogMix = weather === 'fog' ? 0.35 : weather === 'rain' || weather === 'snow' ? 0.15 : 0;
  ctx.save();
  for (let p = 0; p < planes; p++) {
    const depth = 1 - p / Math.max(1, planes - 1);
    const col = mixC(far, air, depth * 0.55 + fogMix);
    const shade = mixC(col, [0, 0, 0], p * 0.12);
    const y0 = base * h - depth * 0.05 * h, maxH = (40 + p * 30) * k * (0.8 + density * 0.4);
    ctx.fillStyle = `rgb(${rgbStr(shade)})`;
    ctx.beginPath();
    ctx.moveTo(0, h);
    let x = -r() * 20 * k;
    const blocks = [];
    while (x < w) {
      const bw = (10 + r() * 22) * k * (1 - p * 0.15), bh = (0.25 + r() * 0.75) * maxH;
      ctx.lineTo(x, y0 - bh); ctx.lineTo(x + bw, y0 - bh);
      blocks.push([x, y0 - bh, bw, bh]);
      x += bw + r() * 3 * k;
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    if (lit && p > 0) {
      ctx.fillStyle = S.win;
      for (const [bx, by, bw, bh] of blocks) {
        for (let wy = by + 4 * k; wy < y0 - 3 * k; wy += 6 * k) for (let wx = bx + 2 * k; wx < bx + bw - 3 * k; wx += 4.5 * k) {
          if (r() < 0.28 * density) { ctx.globalAlpha = 0.55 + r() * 0.4; ctx.fillRect(wx, wy, 1.6 * k, 2.2 * k); }
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

// Góry: Fuji (jeden stożek ze śnieżną czapą) albo Alpy (poszarpany grzbiet ze śniegiem).
export function mountains(ctx, w, h, { seed, kind, phase }) {
  const S = sky(phase), n = perlin(seed);
  const rock = mixC(hex(S.far), hex(S.stops[2]), 0.25), snow = mixC([250, 252, 255], S.light, 0.35);
  const baseY = 0.8 * h;
  ctx.save();
  const pts = [];
  if (kind === 'fuji') {
    const cx = 0.62 * w, peak = 0.47 * h, half = 0.42 * w;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, x = cx - half + t * half * 2, d = Math.abs(t - 0.5) * 2;
      pts.push([x, peak + (baseY - peak) * Math.pow(d, 0.75) + fbm(n, t * 6, 1, 3) * 6]);
    }
  } else {
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, x = t * w;
      pts.push([x, 0.6 * h - (fbm(n, t * 3.2, 2, 5) + 0.5) * 0.17 * h]);
    }
  }
  const g = ctx.createLinearGradient(0, Math.min(...pts.map((p) => p[1])), 0, baseY);
  g.addColorStop(0, `rgb(${rgbStr(rock)})`);
  g.addColorStop(1, `rgb(${rgbStr(mixC(rock, hex(S.stops[2]), 0.4))})`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(pts[0][0], baseY);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], baseY); ctx.closePath(); ctx.fill();
  // śnieg: górna część profilu
  ctx.fillStyle = `rgba(${rgbStr(snow)},${phase === 'night' ? 0.6 : 0.92})`;
  ctx.beginPath();
  const snowLine = (y) => y + (kind === 'fuji' ? 0.09 * h : 0.05 * h);
  ctx.moveTo(pts[0][0], snowLine(pts[0][1]));
  for (const [x, y] of pts) ctx.lineTo(x, y);
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, y] = pts[i];
    const top = Math.min(...pts.map((p) => p[1]));
    ctx.lineTo(x, Math.min(snowLine(y), top + (kind === 'fuji' ? 0.1 : 0.07) * h + fbm(n, i * 0.5, 9, 2) * 6));
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Woda od linii y do dołu kadru: odbija kolory nieba, z błyskami światła.
export function water(ctx, w, h, { y, phase, seed = 21 }) {
  const S = sky(phase), r = rng(seed), k = unit(w), Y = y * h;
  const g = ctx.createLinearGradient(0, Y, 0, h);
  g.addColorStop(0, S.stops[2]); g.addColorStop(1, S.stops[0]);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = g;
  ctx.fillRect(0, Y, w, h - Y);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(${rgbStr(S.light)},0.45)`;
  ctx.lineWidth = 0.8 * k;
  for (let i = 0; i < 60; i++) {
    const gy = Y + Math.pow(r(), 1.6) * (h - Y), gx = r() * w, len = (4 + r() * 16) * k * (0.5 + (gy - Y) / (h - Y));
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + len, gy); ctx.stroke();
  }
  ctx.restore();
}

// Ławica mgły nad linią y (np. San Francisco o poranku).
export function fogBank(ctx, w, h, { y, phase }) {
  const c = phase === 'night' ? [120, 128, 160] : [236, 240, 248];
  const Y = y * h;
  const g = ctx.createLinearGradient(0, Y - 0.18 * h, 0, Y + 0.08 * h);
  g.addColorStop(0, `rgba(${rgbStr(c)},0)`);
  g.addColorStop(0.6, `rgba(${rgbStr(c)},${phase === 'night' ? 0.35 : 0.7})`);
  g.addColorStop(1, `rgba(${rgbStr(c)},${phase === 'night' ? 0.25 : 0.55})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, Y - 0.18 * h, w, 0.26 * h);
  ctx.restore();
}
