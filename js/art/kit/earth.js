// Klocki nieba i panoram ziemskich: niebo wg pory dnia i pogody (z rozpraszaniem światła, gwiazdami i łuną
// miasta), słońce i księżyc, chmury z szumu oświetlone od słońca, plany miasta z perspektywą powietrzną,
// góry z rzeźbą i śniegiem, woda z odbiciem nieba i ścieżką światła, mgła. Animowane chmury, opady
// i fajerwerki zostają w SVG sceny.
import { rng, perlin, fbm, ridged, clamp, sstep, mix } from '../noise.js';
import { glow, pixelLayer, addLayer } from '../canvas.js';
import { stars } from './sky.js';

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
// Kolor nieba na wysokości t (0 — góra kadru, 1 — dół), jak w gradiencie earthSky.
function skyAt(phase, t) {
  const st = sky(phase).stops.map(hex);
  return t < 0.6 ? mixC(st[0], st[1], clamp(t / 0.6)) : mixC(st[1], st[2], clamp((t - 0.6) / 0.4));
}

// Położenie słońca (świt — nisko po lewej, dzień — wysoko, zmierzch — nisko po prawej) i księżyca nocą.
export const BODY = { dawn: [0.18, 0.56], day: [0.7, 0.16], dusk: [0.82, 0.54], night: [0.76, 0.17] };
const WARM = { dawn: [255, 196, 150], day: [255, 250, 235], dusk: [255, 170, 110], night: [200, 212, 255] };

// Niebo: gradient pory dnia, rozproszone światło wokół słońca i jasna mgiełka nad horyzontem; nocą gwiazdy
// i łuna miasta. Przy złej pogodzie przykryte szarą zasłoną, ciemniejszą u góry.
export function earthSky(ctx, w, h, { phase, weather }) {
  const S = sky(phase), bad = BAD(weather);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, S.stops[0]); g.addColorStop(0.6, S.stops[1]); g.addColorStop(1, S.stops[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (phase === 'night') {
    if (!bad) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, 0.66 * h); ctx.clip();
      const count = Math.round(((weather === 'cloudy' ? 110 : 330) * w * h) / (600 * 800));
      stars(ctx, w, h, { seed: 909, count, glowShare: 0.02 });
      ctx.restore();
    }
    // łuna miasta nad horyzontem
    const lg = ctx.createLinearGradient(0, 0.5 * h, 0, 0.9 * h);
    lg.addColorStop(0, 'rgba(255,140,90,0)');
    lg.addColorStop(1, `rgba(255,140,90,${bad ? 0.2 : 0.15})`);
    ctx.fillStyle = lg; ctx.fillRect(0, 0.5 * h, w, 0.5 * h);
  } else if (!bad) {
    const [fx, fy] = BODY[phase] || BODY.day, warm = rgbStr(WARM[phase] || WARM.day);
    glow(ctx, fx * w, fy * h, 0.95 * w, warm, (phase === 'day' ? 0.14 : 0.3) * (weather === 'cloudy' ? 0.5 : 1));
    // rozpraszanie: niebo jaśnieje ku horyzontowi
    const hc = phase === 'day' ? '235,245,255' : warm;
    const hg = ctx.createLinearGradient(0, 0.45 * h, 0, 0.88 * h);
    hg.addColorStop(0, `rgba(${hc},0)`);
    hg.addColorStop(1, `rgba(${hc},${phase === 'day' ? 0.3 : 0.24})`);
    ctx.fillStyle = hg; ctx.fillRect(0, 0.45 * h, w, 0.55 * h);
  }
  ctx.restore();
  if (weather !== 'clear') {
    const c = phase === 'night' ? '24,27,48' : '122,131,156', a = weather === 'cloudy' ? 0.2 : 0.4;
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, `rgba(${c},${(a * 1.25).toFixed(3)})`);
    v.addColorStop(1, `rgba(${c},${(a * 0.7).toFixed(3)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }
}

export function sunMoon(ctx, w, h, { phase, weather }) {
  if (BAD(weather)) return;
  const [fx, fy] = BODY[phase] || BODY.day, x = fx * w, y = fy * h, k = unit(w);
  const dim = weather === 'cloudy' ? 0.55 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (phase === 'night') {
    glow(ctx, x, y, 60 * k, '200,210,255', 0.22 * dim);
    ctx.globalCompositeOperation = 'source-over';
    // tarcza z przyciemnionym brzegiem i morzami
    const R = 12 * k, g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
    g.addColorStop(0, `rgba(250,251,255,${dim})`);
    g.addColorStop(1, `rgba(200,206,228,${dim})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(150,158,190,0.35)';
    for (const [dx, dy, r] of [[-3, -2, 3], [3, 3, 2.2], [1, -5, 1.5], [-5, 4, 1.4]]) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); }
  } else {
    const warm = phase === 'day' ? '255,245,200' : '255,190,120';
    glow(ctx, x, y, 110 * k, warm, 0.35 * dim);
    glow(ctx, x, y, 34 * k, '255,250,225', 0.7 * dim);
    ctx.fillStyle = `rgba(255,250,230,${dim})`;
    ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Pokrycie i miękkość chmur dla pogody: cov — próg gęstości (niżej = więcej chmur), band — pas nieba [od, do].
const CLOUDS = {
  clear: { cov: 0.62, soft: 0.16, band: [0.05, 0.6], alpha: 0.9 },
  cloudy: { cov: 0.44, soft: 0.2, band: [0.02, 0.66], alpha: 0.95 },
  rain: { cov: 0.26, soft: 0.3, band: [0, 0.7], alpha: 1 },
  snow: { cov: 0.3, soft: 0.32, band: [0, 0.7], alpha: 0.95 },
  fog: { cov: 0.36, soft: 0.45, band: [0, 0.72], alpha: 0.7 },
};
// Kolory chmur: lit — strona oświetlona, shadow — cień, rim — prześwietlony brzeg pod słońce.
function cloudColors(phase, weather) {
  const dark = BAD(weather);
  if (phase === 'night') return dark ? { lit: [52, 56, 78], shadow: [22, 24, 40], rim: [0, 0, 0] } : { lit: [96, 104, 150], shadow: [30, 33, 62], rim: [60, 66, 100] };
  if (dark) return { lit: [196, 202, 214], shadow: [102, 110, 130], rim: [0, 0, 0] };
  if (phase === 'dawn') return { lit: [255, 222, 200], shadow: [146, 110, 158], rim: [255, 200, 150] };
  if (phase === 'dusk') return { lit: [255, 196, 156], shadow: [118, 78, 128], rim: [255, 170, 110] };
  return { lit: [255, 255, 255], shadow: [168, 184, 210], rim: [255, 250, 230] };
}

// Chmury z szumu fraktalnego (z zawirowaniem): bliżej horyzontu mniejsze i bardziej płaskie. Światło liczone
// próbką gęstości w stronę słońca (więcej chmury po drodze = cień), brzegi pod słońce prześwietlone.
export function cloudBank(ctx, w, h, { seed, phase, weather }) {
  const P = CLOUDS[weather] || CLOUDS.clear, C = cloudColors(phase, weather), k = unit(w);
  const n = perlin(seed), m = perlin(seed + 5);
  const [bx, by] = BODY[phase] || BODY.day, sunX = bx * w, sunY = by * h;
  const sunny = !BAD(weather), y0 = P.band[0] * h, y1 = P.band[1] * h;
  const edge = (t) => (1 - sstep(0, 0.18, t) * (1 - sstep(0.7, 1, t))) * 0.35;
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    if (y < y0 || y > y1) return;
    const t = (y - y0) / (y1 - y0), persp = 1 + t * 1.5;
    const u = (x / (150 * k)) * persp, v = (y / (44 * k)) * persp;
    const wx = fbm(m, u * 0.5, v * 0.5, 2) * 1.3, fade = edge(t);
    const d = fbm(n, u + wx, v, 5) + 0.5 - fade;
    const a = sstep(P.cov, P.cov + P.soft, d);
    if (a < 0.01) return;
    // kierunek do słońca (przy złej pogodzie światło z góry)
    let dx = sunny ? sunX - x : 0, dy = sunny ? sunY - y : -1;
    const dl = Math.sqrt(dx * dx + dy * dy) || 1; dx /= dl; dy /= dl;
    const d2 = fbm(n, u + wx + dx * 0.14, v + dy * 0.3, 3) + 0.5 - fade;
    const lit = clamp(0.85 - (d2 - d) * 3.4 - (d - P.cov) * 0.4, 0, 1);
    let r = mix(C.shadow[0], C.lit[0], lit), g = mix(C.shadow[1], C.lit[1], lit), b = mix(C.shadow[2], C.lit[2], lit);
    if (sunny) {
      const near = Math.exp(-(((x - sunX) ** 2 + (y - sunY) ** 2) / (0.12 * w * w)));
      const rim = (1 - a) * near * 1.4;
      r += C.rim[0] * rim; g += C.rim[1] * rim; b += C.rim[2] * rim;
    }
    out[0] = r; out[1] = g; out[2] = b; out[3] = a * P.alpha * 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}

// Plany zabudowy: dalsze jaśniejsze i zamglone (perspektywa powietrzna), z mgiełką u podstawy każdego planu.
// Wysokości układają się w „śródmieście” (skupisko wieżowców) i niższe obrzeża; każdy budynek ma lekko inny
// odcień, ścianę oświetloną od strony słońca, czasem nadbudówkę, iglicę albo antenę. Nocą i o zmierzchu okna,
// nocą światła ostrzegawcze na najwyższych. haze — kolor mgiełki (np. pył nad Dubajem); base — ułamek
// wysokości, na którym stoją budynki; tall — mnożnik wysokości (Nowy Jork wyżej, Reykjavík niżej).
const NEAR = { day: [96, 116, 146], dawn: [92, 76, 116], dusk: [72, 58, 98], night: [20, 22, 50] };
export function cityPlanes(ctx, w, h, { seed, phase, weather, planes = 3, density = 1, haze = null, base = 0.86, tall = 1 }) {
  const r = rng(seed), k = unit(w), S = sky(phase);
  const far = hex(S.far), air = haze || skyAt(phase, base - 0.04), near = NEAR[phase] || NEAR.day;
  const night = phase === 'night', lit = night || phase === 'dusk', bad = BAD(weather);
  const fogMix = weather === 'fog' ? 0.38 : weather === 'rain' || weather === 'snow' ? 0.16 : 0;
  const side = phase === 'dawn' ? -1 : phase === 'dusk' || phase === 'day' ? 1 : 0;
  const sun = WARM[phase] || WARM.day, downtown = (0.25 + r() * 0.5) * w;
  ctx.save();
  for (let p = 0; p < planes; p++) {
    const depth = 1 - p / Math.max(1, planes - 1);
    const col = mixC(near, mixC(far, air, 0.45), clamp(depth * 0.8 + fogMix));
    const y0 = base * h - depth * 0.05 * h, maxH = (40 + p * 30) * k * (0.8 + density * 0.4) * tall;
    const spread = (0.2 + depth * 0.25) * w, blocks = [];
    let x = -r() * 20 * k;
    while (x < w) {
      const core = 0.32 + 0.68 * Math.exp(-(((x - downtown) / spread) ** 2));
      const bw = (10 + r() * 22) * k * (1 - p * 0.15), bh = (0.3 + Math.pow(r(), 1.3) * 0.7) * maxH * core;
      blocks.push([x, y0 - bh, bw, bh, r(), 1 + (r() - 0.5) * 0.14]);
      x += bw + (r() * 3 * k) / density;
    }
    for (const [bx, by, bw, bh, kind, tint] of blocks) {
      ctx.fillStyle = `rgb(${rgbStr(col.map((v) => clamp(v * tint, 0, 255)))})`;
      ctx.fillRect(bx, by, bw, h - by);
      if (kind < 0.16) ctx.fillRect(bx + bw * 0.22, by - bh * 0.14, bw * 0.56, bh * 0.14 + 1); // nadbudówka
      else if (kind < 0.24) { ctx.beginPath(); ctx.moveTo(bx + bw * 0.2, by); ctx.lineTo(bx + bw / 2, by - bh * 0.3); ctx.lineTo(bx + bw * 0.8, by); ctx.fill(); }
      else if (kind < 0.34) ctx.fillRect(bx + bw / 2 - 0.5 * k, by - bh * 0.22, 1 * k, bh * 0.22); // antena
    }
    // ściana od strony słońca
    if (side && !bad) {
      ctx.fillStyle = `rgba(${rgbStr(sun)},${(0.12 + 0.16 * (1 - depth)).toFixed(3)})`;
      for (const [bx, by, bw] of blocks) ctx.fillRect(side < 0 ? bx : bx + bw * 0.68, by, bw * 0.32, h - by);
    }
    // mgiełka u podstawy planu (dalsze plany toną w powietrzu)
    const ha = (0.22 + depth * 0.25 + fogMix).toFixed(3);
    const hz = ctx.createLinearGradient(0, y0 - maxH * 0.6, 0, y0);
    hz.addColorStop(0, `rgba(${rgbStr(air)},0)`);
    hz.addColorStop(1, `rgba(${rgbStr(air)},${ha})`);
    ctx.fillStyle = hz;
    ctx.fillRect(0, y0 - maxH * 0.6, w, maxH * 0.6);
    ctx.fillStyle = `rgba(${rgbStr(mixC(air, col, 0.4))},${ha})`;
    ctx.fillRect(0, y0, w, h - y0);
    if (lit) {
      for (const [bx, by, bw] of blocks) {
        for (let wy = by + 4 * k; wy < y0 - 3 * k; wy += 6 * k) for (let wx = bx + 2 * k; wx < bx + bw - 3 * k; wx += 4.5 * k) {
          if (r() < 0.28 * density * (p === 0 ? 0.6 : 1)) {
            ctx.fillStyle = r() < 0.75 ? S.win : '#bfe3ff';
            ctx.globalAlpha = (0.45 + r() * 0.45) * (1 - depth * 0.35);
            ctx.fillRect(wx, wy, 1.6 * k, 2.2 * k);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    // nocą czerwone światła na najwyższych budynkach dwóch bliższych planów
    if (night && p > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [bx, by, bw, bh] of blocks) if (bh > maxH * 0.8) glow(ctx, bx + bw / 2, by - 1 * k, 3.2 * k, '255,70,60', 0.8);
      ctx.restore();
    }
  }
  ctx.restore();
}

// Światło dla gór: kierunek (x w prawo, y w dół) zależnie od pory dnia.
const LIGHT_DIR = { dawn: [-0.95, -0.3], day: [0.45, -0.9], dusk: [0.95, -0.3], night: [0.6, -0.8] };

// Góry: Fuji (stożek ze śnieżną czapą i żlebami), Alpy (szczyty w śniegu z graniami i żlebami) albo wzgórza (Seul,
// przedgórze Alp; zalesione). Profil z szumu, stoki oświetlone z boku (szerokie ściany szczytów i drobna
// rzeźba 2D), śnieg zależny od wysokości, perspektywa powietrzna i mgiełka u podnóża.
export function mountains(ctx, w, h, { seed, kind, phase, weather = 'clear' }) {
  const n = perlin(seed), nr = perlin(seed + 17), k = unit(w);
  const far = hex(sky(phase).far), night = phase === 'night';
  const [lx, ly] = LIGHT_DIR[phase] || LIGHT_DIR.day, sunC = WARM[phase] || WARM.day;
  const cx = 0.6 * w;
  let top, rock, snowLine, baseY, airT, haze;
  if (kind === 'fuji') {
    const peak = 0.34 * h, half = 0.56 * w;
    baseY = 0.84 * h; airT = 0.7; haze = 0.38;
    top = (x) => {
      const d = Math.abs((x - cx) / half);
      return d >= 1 ? baseY + 1 : Math.max(peak + 0.01 * h, peak + (baseY - peak) * Math.pow(d, 0.7)) + fbm(n, x / (40 * k), 1, 3) * 3 * k;
    };
    rock = mixC([78, 88, 140], far, 0.3); snowLine = (x) => peak + 0.13 * h + fbm(n, x / (10 * k), 5, 2) * 8 * k;
  } else if (kind === 'alps') {
    baseY = 0.8 * h; airT = 0.62; haze = 0.2;
    top = (x) => 0.7 * h - Math.pow(ridged(n, x / (130 * k), 2.3, 5), 1.4) * 0.42 * h;
    rock = mixC([70, 78, 108], far, 0.25); snowLine = (x) => 0.56 * h + fbm(n, x / (18 * k), 9, 3) * 0.06 * h;
  } else {
    baseY = 0.84 * h; airT = 0.75; haze = 0.3;
    top = (x) => 0.71 * h - (fbm(n, x / (90 * k), 3, 4) + 0.6) * 0.12 * h;
    rock = mixC([52, 96, 72], far, 0.3); snowLine = () => -1;
  }
  if (BAD(weather)) haze += 0.2;
  const air = skyAt(phase, airT);
  const W = Math.max(1, Math.round(w * 0.5)), cw = w / W, tops = new Float32Array(W);
  for (let c = 0; c < W; c++) tops[c] = top((c + 0.5) * cw);
  // Alpy: od każdego szczytu w dół biegnie grań, od każdej przełęczy — żleb. Między granią a żlebem na prawo
  // leży ściana zwrócona w prawo, między żlebem a następną granią — w lewo. Linie lekko się wiją.
  const lines = [];
  if (kind === 'alps') {
    const R = Math.max(2, Math.round((14 * k) / cw)), lr = rng(seed + 3), peaks = [];
    for (let c = 0; c < W; c++) {
      let m = true;
      for (let j = Math.max(0, c - R); j <= Math.min(W - 1, c + R) && m; j++) if (tops[j] < tops[c]) m = false;
      if (m && (!peaks.length || c - peaks[peaks.length - 1] > R)) peaks.push(c);
    }
    peaks.forEach((c, i) => {
      lines.push({ x0: (c + 0.5) * cw, y0: tops[c], slant: (lr() - 0.5) * 1.1, ridge: true });
      const next = peaks[i + 1];
      if (next === undefined) return;
      let s = c;
      for (let j = c; j <= next; j++) if (tops[j] > tops[s]) s = j;
      lines.push({ x0: (s + 0.5) * cw, y0: tops[s], slant: (lr() - 0.5) * 0.7, ridge: false });
    });
  }
  const wig = (i, y) => n(i * 3.7 + 11, y / (16 * k)) * 7 * k;
  const snow = night ? [150, 160, 205] : mixC([250, 252, 255], sunC, 0.25), snowShadow = night ? [70, 78, 128] : [150, 170, 214];
  const dark = mixC(rock, [0, 0, 0], 0.4), bright = mixC(rock, sunC, 0.3), dim = night ? 0.55 : 1;
  const layer = pixelLayer(w, h, 0.5, (x, y, out) => {
    const c = Math.min(W - 1, Math.floor(x / cw)), T = tops[c];
    if (y < T || y > baseY + 2 * k) return;
    // drobna faktura skały i śniegu (łagodny szum 2D, światło z różnic skończonych)
    const u = x / (22 * k), v = y / (18 * k), H = fbm(nr, u, v, 3), e = 0.2;
    const relief = -(((fbm(nr, u + e, v, 3) - H) / e) * lx + ((fbm(nr, u, v + e, 3) - H) / e) * ly);
    let nx, ao = 1, gully = H * 0.03 * h;
    if (kind === 'fuji') {
      nx = clamp((x - cx) / (0.1 * w), -1, 1);
      gully = ridged(nr, x / (9 * k), y / (70 * k), 2) * 0.07 * h;
    } else if (kind === 'alps') {
      // ostatnia linia na lewo od piksela wyznacza ścianę; blisko żlebu ciemniej, blisko grani śnieg schodzi niżej
      let last = null, dl = 1e9, dr = 1e9;
      for (let i = 0; i < lines.length; i++) {
        const L = lines[i], X = L.x0 + Math.max(0, y - L.y0) * L.slant + wig(i, y);
        if (X <= x) { last = L; dl = x - X; } else { dr = Math.min(dr, X - x); break; }
      }
      nx = last ? (last.ridge ? 1 : -1) : -1;
      const toValley = last && !last.ridge ? dl : dr;
      ao = 1 - 0.28 * Math.exp(-toValley / (5 * k));
      gully += last && last.ridge ? Math.exp(-dl / (10 * k)) * 0.05 * h : -Math.exp(-dl / (8 * k)) * 0.03 * h;
    } else {
      nx = 0;
    }
    const isSnow = y < snowLine(x) + gully;
    const l = clamp((0.58 + nx * Math.sign(lx) * (0.15 + 0.35 * Math.abs(lx)) + relief * (isSnow ? 0.18 : 0.32)) * ao, 0.1, 1.2);
    const base = isSnow ? mixC(snowShadow, snow, clamp(l)) : mixC(dark, bright, clamp(l));
    const col = mixC(base, air, clamp(haze + sstep(baseY - 0.14 * h, baseY, y) * 0.55));
    out[0] = col[0] * dim; out[1] = col[1] * dim; out[2] = col[2] * dim; out[3] = 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}

// Woda od linii y do dołu kadru: lustrzane odbicie nieba, zmarszczki rosnące ku widzowi, ścieżka światła
// słońca albo księżyca (przy złej pogodzie bez niej) i jasna linia brzegu.
export function water(ctx, w, h, { y, phase, seed = 21, weather = 'clear' }) {
  const k = unit(w), n = perlin(seed), Y = y * h;
  const [bx] = BODY[phase] || BODY.day, sunX = bx * w, glint = !BAD(weather) && weather !== 'cloudy';
  const sunC = WARM[phase] || WARM.day, dark = BAD(weather) ? 0.7 : 1;
  const layer = pixelLayer(w, h, 0.5, (x, py, out) => {
    if (py < Y) return;
    const dz = (py - Y) / Math.max(1, h - Y);
    const c = skyAt(phase, clamp((Y - (py - Y) * 2.4) / h));
    const rip = fbm(n, x / ((26 + dz * 70) * k), (py - Y) / ((1.2 + dz * 6) * k), 3);
    const b = (0.72 + rip * 0.45) * (1 - dz * 0.4) * dark;
    let r = c[0] * b, g = c[1] * b, bl = c[2] * b;
    if (glint) {
      const wd = (6 + dz * 46) * k, path = Math.exp(-(((x - sunX) / wd) ** 2)) * sstep(-0.05, 0.3, rip);
      const s = path * (phase === 'night' ? 0.55 : 0.95);
      r += sunC[0] * s; g += sunC[1] * s; bl += sunC[2] * s;
    }
    const shore = Math.exp(-(py - Y) / (1.2 * k)) * 0.35;
    out[0] = mix(r, 255, shore); out[1] = mix(g, 255, shore); out[2] = mix(bl, 255, shore); out[3] = 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}

// Ławica mgły nad linią y (np. San Francisco o poranku): gradient z poszarpanymi pasmami z szumu.
export function fogBank(ctx, w, h, { y, phase }) {
  const c = phase === 'night' ? [120, 128, 160] : [236, 240, 248], k = unit(w), n = perlin(77), Y = y * h;
  const peak = phase === 'night' ? 0.4 : 0.78;
  const layer = pixelLayer(w, h, 0.5, (x, py, out) => {
    if (py < Y - 0.2 * h || py > Y + 0.12 * h) return;
    const t = (py - (Y - 0.2 * h)) / (0.32 * h);
    const body = sstep(0, 0.55, t) * (1 - sstep(0.85, 1, t) * 0.4);
    const wisp = fbm(n, x / (70 * k), py / (9 * k), 4) + 0.5;
    out[0] = c[0]; out[1] = c[1]; out[2] = c[2];
    out[3] = clamp(body * (0.55 + wisp * 0.7)) * peak * 255;
  });
  addLayer(ctx, layer, w, h, 'source-over');
}
