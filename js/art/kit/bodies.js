// Klocki ciał niebieskich: planety, pierścienie, gwiazdy (słońca), galaktyki, gromady i czarna dziura.
// Położenia to ułamki kadru (x — szerokości, y — wysokości), promienie — ułamki szerokości.
import { rng, perlin, fbm, ridged, clamp, sstep, mix } from '../noise.js';
import { makeCanvas, glow } from '../canvas.js';

const unit = (w) => w / 300;
const rgbStr = (c) => `${c[0] | 0},${c[1] | 0},${c[2] | 0}`;
const dims = (ctx) => [ctx.canvas.width, ctx.canvas.height];
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// Warstwa liczona piksel po pikselu tylko w prostokącie [x0,x1)×[y0,y1) (w pikselach płótna).
// Zwraca null, gdy prostokąt wypada poza płótno.
function region(w, h, x0, y0, x1, y1, res, fn) {
  const X0 = Math.max(0, Math.floor(x0)), Y0 = Math.max(0, Math.floor(y0));
  const X1 = Math.min(w, Math.ceil(x1)), Y1 = Math.min(h, Math.ceil(y1));
  if (X1 <= X0 || Y1 <= Y0) return null;
  const W = Math.max(1, Math.round((X1 - X0) * res)), H = Math.max(1, Math.round((Y1 - Y0) * res));
  const c = makeCanvas(W, H), cx = c.getContext('2d'), img = cx.createImageData(W, H), d = img.data, out = [0, 0, 0, 0];
  const sx = (X1 - X0) / W, sy = (Y1 - Y0) / H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 0;
    fn(X0 + (x + 0.5) * sx, Y0 + (y + 0.5) * sy, out);
    const k = (y * W + x) * 4;
    d[k] = out[0]; d[k + 1] = out[1]; d[k + 2] = out[2]; d[k + 3] = out[3];
  }
  cx.putImageData(img, 0, 0);
  return { c, x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
}
function paint(ctx, reg, mode) {
  if (!reg) return;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(reg.c, reg.x, reg.y, reg.w, reg.h);
  ctx.restore();
}

// ---------------- planety ----------------
const PALETTES = {
  rocky: [[70, 66, 62], [175, 168, 158]],
  ice: [[205, 222, 236], [250, 252, 255]],
  lava: [[38, 26, 24], [70, 44, 36]],
};

// Kula oświetlona z kierunku light (x w prawo, y w górę, z do widza). kind: earth | rocky | gas | ice | lava.
// bands — kolory pasów (gaz), spot — plama na gazowym olbrzymie { lat, lon, r, color },
// palette — [ciemny, jasny] dla rocky/ice/lava, clouds — ile chmur na planecie typu earth (0–1).
export function planet(ctx, { cx, cy, r, seed, kind, light, atmosphere = null, cityLights = false, bands = null, spot = null, clouds = 0.5, palette = null }) {
  const [w, h] = dims(ctx);
  const CX = cx * w, CY = cy * h, R = r * w, halo = atmosphere ? R * 0.06 : 0;
  const L = norm3(light), pal = palette || PALETTES[kind] || PALETTES.rocky;
  const nL = perlin(seed), nC = perlin(seed + 11), nT = perlin(seed + 23);
  const cloudAmt = clamp(clouds * 2);
  const reg = region(w, h, CX - R - halo, CY - R - halo, CX + R + halo, CY + R + halo, 1, (x, y, out) => {
    const nx = (x - CX) / R, ny = (y - CY) / R, rr = nx * nx + ny * ny;
    if (rr > 1) {
      if (!atmosphere) return;
      const dist = (Math.sqrt(rr) - 1) * R;
      if (dist >= halo) return;
      const sunSide = clamp(0.3 + (nx * L[0] - ny * L[1]) * 0.9);
      const a = Math.pow(1 - dist / halo, 2.2) * sunSide;
      out[0] = atmosphere[0]; out[1] = atmosphere[1]; out[2] = atmosphere[2]; out[3] = a * 255;
      return;
    }
    const nz = Math.sqrt(1 - rr), N0 = nx, N1 = -ny, N2 = nz;
    const diff = N0 * L[0] + N1 * L[1] + N2 * L[2];
    const lit = clamp(diff * 1.1 + 0.04), day = sstep(-0.08, 0.25, diff);
    const lon = Math.atan2(nx, nz), lat = Math.asin(clamp(-ny, -1, 1));
    const u = lon * 2.9, v = lat * 2.9;
    let rC, gC, bC, emit = 0, eR = 0, eG = 0, eB = 0, isLand = false, cl = 0;
    if (kind === 'earth') {
      const land = fbm(nL, u + 3, v, 6);
      isLand = land > 0.06;
      if (isLand) {
        const t = fbm(nT, u * 2.3, v * 2.3, 3);
        rC = mix(70, 170, sstep(-0.1, 0.3, t)); gC = mix(110, 140, clamp(t + 0.4)); bC = mix(50, 90, clamp(t + 0.5));
      } else {
        const depth = sstep(0.06, -0.25, land);
        rC = mix(30, 8, depth); gC = mix(110, 40, depth); bC = mix(150, 95, depth);
      }
      cl = sstep(0.02, 0.5, fbm(nC, u * 1.7 + 1, v * 2.6, 6) + 0.12) * cloudAmt;
      rC = mix(rC, 245, cl * 0.9); gC = mix(gC, 248, cl * 0.9); bC = mix(bC, 255, cl * 0.9);
      if (cityLights && isLand && day < 0.5) {
        const c = Math.pow(clamp(fbm(nT, u * 20, v * 20, 2) * 2.2 + 0.1), 3) * (1 - day * 2) * (1 - cl);
        emit = 1; eR = 255 * c; eG = 190 * c; eB = 90 * c;
      }
    } else if (kind === 'gas') {
      const B = bands || [[200, 160, 120], [240, 220, 190]];
      const turb = fbm(nC, u * 0.7, v * 4, 4) * 1.6;
      const bt = (Math.sin(lat * 9 + turb) + 1) / 2 * (B.length - 1);
      const i0 = Math.floor(bt), i1 = Math.min(B.length - 1, i0 + 1), f = bt - i0;
      rC = mix(B[i0][0], B[i1][0], f); gC = mix(B[i0][1], B[i1][1], f); bC = mix(B[i0][2], B[i1][2], f);
      if (spot) {
        let dl = lon - spot.lon; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
        const dd = Math.hypot(dl / (spot.r * 1.6), (lat - spot.lat) / spot.r);
        if (dd < 1.2) {
          const s = sstep(1.2, 0.6, dd) * (0.75 + 0.25 * fbm(nT, dl * 8, (lat - spot.lat) * 8, 2));
          rC = mix(rC, spot.color[0], s); gC = mix(gC, spot.color[1], s); bC = mix(bC, spot.color[2], s);
        }
      }
    } else {
      const base = clamp(fbm(nL, u * 1.2, v * 1.2, 5) + 0.5);
      rC = mix(pal[0][0], pal[1][0], base); gC = mix(pal[0][1], pal[1][1], base); bC = mix(pal[0][2], pal[1][2], base);
      const crack = ridged(nT, u * 2.6 + 4, v * 2.6, 4);
      if (kind === 'rocky') {
        const maria = sstep(0.1, 0.3, fbm(nC, u * 0.7, v * 0.7, 4));
        const crater = Math.pow(crack, 3);
        const sh = (1 - maria * 0.35) * (1 - crater * 0.3);
        rC *= sh; gC *= sh; bC *= sh;
      } else if (kind === 'ice') {
        const line = Math.pow(crack, 6);
        rC = mix(rC, 150, line); gC = mix(gC, 92, line); bC = mix(bC, 70, line);
      } else if (kind === 'lava') {
        const hot = Math.pow(crack, 8);
        emit = 1; eR = 255 * hot; eG = 120 * hot; eB = 40 * hot;
      }
    }
    rC *= lit; gC *= lit; bC *= lit;
    if (atmosphere) {
      const rim = Math.pow(1 - nz, 2.6) * clamp(diff + 0.35);
      rC += atmosphere[0] * rim; gC += atmosphere[1] * rim; bC += atmosphere[2] * rim;
    }
    if (kind === 'earth' && !isLand) {
      const spec = Math.pow(clamp(N2 * 0.2 + diff), 40) * 0.6 * (1 - cl);
      rC += 255 * spec; gC += 240 * spec; bC += 220 * spec;
    }
    if (emit) { rC += eR; gC += eG; bC += eB; }
    out[0] = rC; out[1] = gC; out[2] = bC; out[3] = 255;
  });
  paint(ctx, reg, 'source-over');
}

// Pierścienie planety jako elipsy; half: 'back' (górna połowa, za planetą), 'front' albo 'both'.
export function rings(ctx, { cx, cy, r1, r2, tilt, color, light, half = 'both', seed = 77 }) {
  const [w, h] = dims(ctx);
  const CX = cx * w, CY = cy * h, R1 = r1 * w, R2 = r2 * w, r = rng(seed);
  const from = half === 'front' ? 0 : half === 'back' ? Math.PI : 0;
  const to = half === 'front' ? Math.PI : Math.PI * 2;
  const bright = 0.65 + 0.35 * clamp((light ? light[1] : 0) + 0.5);
  const n = 64, lw = ((R2 - R1) / n) * 1.6;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), rad = mix(R1, R2, t);
    const gap = Math.abs(t - 0.62) < 0.035 ? 0.12 : 1;
    const a = (0.12 + 0.5 * r()) * gap * bright * (1 - Math.pow(t, 4) * 0.5);
    ctx.strokeStyle = `rgba(${rgbStr(color)},${a.toFixed(3)})`;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(CX, CY, rad, rad * tilt, 0, from, to); ctx.stroke();
  }
  ctx.restore();
}

// Gwiazda (słońce): tarcza, korona i opcjonalna flara obiektywu. x, y — ułamki kadru, r — ułamek szerokości.
export function sun(ctx, { x, y, r, color, corona = 1, flare = 0, core = [255, 255, 250] }) {
  const [w, h] = dims(ctx);
  const X = x * w, Y = y * h, R = r * w, c = rgbStr(color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, X, Y, R * 7 * corona, c, 0.35);
  glow(ctx, X, Y, R * 2.6, rgbStr(core.map((v, i) => mix(v, color[i], 0.5))), 0.8);
  const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
  g.addColorStop(0, `rgba(${rgbStr(core)},1)`);
  g.addColorStop(0.7, `rgba(${rgbStr(core.map((v, i) => mix(v, color[i], 0.35)))},1)`);
  g.addColorStop(1, `rgba(${c},0.9)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.fill();
  if (flare > 0) {
    const lg = ctx.createLinearGradient(0, Y, w, Y);
    const at = clamp(X / w, 0.02, 0.98);
    lg.addColorStop(0, `rgba(${c},0)`);
    lg.addColorStop(at, `rgba(255,240,220,${(0.45 * flare).toFixed(3)})`);
    lg.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = lg;
    ctx.fillRect(0, Y - R * 0.12, w, R * 0.24);
    for (const [f, s] of [[0.35, 0.5], [0.6, 0.9], [0.85, 0.35]]) {
      glow(ctx, mix(X, w - X, f), mix(Y, h - Y, f), R * s, c, 0.08 * flare);
    }
  }
  ctx.restore();
}

// Galaktyka spiralna albo eliptyczna. r — ułamek szerokości, tilt — spłaszczenie (oś krótka / długa),
// rot — obrót w radianach, arms — liczba ramion, dust — siła pasm pyłu.
export function galaxy(ctx, { cx, cy, r, tilt, rot, seed, type, arms = 2, core, arm, dust = 0.6, bright = 1 }) {
  const [w, h] = dims(ctx);
  const CX = cx * w, CY = cy * h, R = r * w, cr = Math.cos(rot), sr = Math.sin(rot);
  const n = perlin(seed), nd = perlin(seed + 9);
  const reg = region(w, h, CX - R * 1.1, CY - R * 1.1, CX + R * 1.1, CY + R * 1.1, 0.5, (x, y, out) => {
    const dx = x - CX, dy = y - CY;
    const px = (dx * cr + dy * sr) / R, py = (-dx * sr + dy * cr) / (R * tilt);
    const rho = Math.sqrt(px * px + py * py);
    if (rho > 1.15) return;
    let I, coreW, pink = 0;
    if (type === 'elliptical') {
      I = Math.exp(-Math.pow(rho / 0.3, 0.75) * 2.2) * 1.5;
      coreW = clamp(1 - rho * 1.4);
    } else {
      const theta = Math.atan2(py, px), wind = 3.2, ph = arms * (theta - Math.log(rho + 0.05) * wind);
      const armI = Math.pow((Math.cos(ph + fbm(n, px * 3, py * 3, 3) * 1.2) + 1) / 2, 2.4);
      const disk = Math.exp(-rho / 0.28), bulge = Math.exp(-Math.pow(rho / 0.1, 2));
      const clump = clamp(fbm(n, px * 9 + 3, py * 9, 3) + 0.6);
      const lane = Math.pow((Math.cos(ph - 0.9) + 1) / 2, 6) * dust * (rho < 0.85 ? 1 : 0);
      I = (disk * (0.25 + 0.95 * armI * clump) + bulge * 1.6) * (1 - lane * 0.75) * sstep(1.12, 0.6, rho);
      coreW = clamp(bulge * 1.5 + Math.exp(-rho / 0.18) * 0.4);
      if (armI > 0.6) pink = sstep(0.3, 0.55, fbm(nd, px * 14, py * 14, 2)) * 0.6;
    }
    let rC = mix(arm[0], core[0], coreW), gC = mix(arm[1], core[1], coreW), bC = mix(arm[2], core[2], coreW);
    rC = mix(rC, 255, pink); gC = mix(gC, 120, pink); bC = mix(bC, 170, pink);
    out[0] = rC; out[1] = gC; out[2] = bC; out[3] = clamp(I * bright) * 255;
  });
  paint(ctx, reg, 'lighter');
}

// Gromada gwiazd (profil Plummera: gęsto w środku, rzadko na skraju).
export function cluster(ctx, { cx, cy, r, count, seed, color }) {
  const [w, h] = dims(ctx);
  const CX = cx * w, CY = cy * h, R = r * w, a = R * 0.35, k = unit(w), rnd = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, CX, CY, R * 0.9, rgbStr(color), 0.25);
  for (let i = 0; i < count; i++) {
    const u = Math.max(1e-4, rnd());
    const rad = Math.min(R * 1.6, a / Math.sqrt(Math.pow(u, -2 / 3) - 1 + 1e-6));
    const ang = rnd() * Math.PI * 2, x = CX + Math.cos(ang) * rad, y = CY + Math.sin(ang) * rad;
    const m = Math.pow(rnd(), 5), t = rnd();
    const col = t < 0.5 ? color : t < 0.8 ? [255, 250, 240] : [190, 215, 255];
    ctx.fillStyle = `rgba(${rgbStr(col)},${(0.35 + m * 0.65).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, (0.35 + m * 1.6) * 0.6 * k, 0, Math.PI * 2); ctx.fill();
    if (m > 0.6) glow(ctx, x, y, (2 + m * 5) * k, rgbStr(col), 0.25);
  }
  ctx.restore();
}

// Soczewkowanie grawitacyjne tego, co już narysowano: obraz pierwotny i wtórny (β = θ − θE²/θ),
// w środku czarny cień. cx, cy — ułamki kadru; shadow i thetaE — ułamki szerokości.
export function lens(ctx, w, h, { cx, cy, shadow, thetaE }) {
  const CX = cx * w, CY = cy * h, SH = shadow * w, TE = thetaE * w, TE2 = TE * TE;
  const src = ctx.getImageData(0, 0, w, h).data, out = ctx.createImageData(w, h), o = out.data, k = unit(w);
  // piksel kopiujemy jedną liczbą 32-bitową (RGBA); rozjaśnienie liczymy tylko przy pierścieniu Einsteina
  const src32 = new Uint32Array(src.buffer, src.byteOffset, w * h), out32 = new Uint32Array(o.buffer, o.byteOffset, w * h);
  const OPAQUE = 0xff000000, ring = 12 * k, ringW = 4 * k;
  for (let y = 0; y < h; y++) {
    const dy = y - CY;
    for (let x = 0; x < w; x++) {
      const dx = x - CX, r = Math.sqrt(dx * dx + dy * dy), i = y * w + x;
      if (r < SH) { out32[i] = OPAQUE; continue; }
      const f = (r - TE2 / r) / r;
      let sx = Math.round(CX + dx * f), sy = Math.round(CY + dy * f);
      if (sx < 0 || sx >= w) sx = ((sx % w) + w) % w;
      if (sy < 0) sy = 0; else if (sy >= h) sy = h - 1;
      const j = sy * w + sx;
      if (Math.abs(r - TE) > ring) { out32[i] = src32[j] | OPAQUE; continue; }
      const boost = 1 + 0.7 * Math.exp(-Math.pow((r - TE) / ringW, 2)), q = i * 4, jq = j * 4;
      o[q] = src[jq] * boost; o[q + 1] = src[jq + 1] * boost; o[q + 2] = src[jq + 2] * boost; o[q + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

// ---------------- czarna dziura ----------------
// Dysk akrecyjny: jasność od promienia (gorący środek) i efekt Dopplera (lewa strona leci do nas).
const prof = (t) => (t < 0 ? 0 : Math.pow(clamp(1 - t), 1.6) * (0.25 + 0.75 * Math.exp(-t * 2.2)));
const dopp = (phi) => 0.38 + 0.62 * Math.pow(0.5 - 0.5 * Math.cos(phi), 1.4);
const heat = (t, I) => [255 * I, mix(240, 150, t) * I, mix(225, 70, t) * I];
const DISK_K = 0.21;

function geom(w, h, { cx, cy, shadow }) {
  const SH = shadow * w;
  return { CX: cx * w, CY: cy * h, SH, r1: SH * 1.55, r2: SH * 4.3, k: unit(w) };
}

// Statyczne warstwy czarnej dziury na tle (tło najlepiej wcześniej przepuścić przez lens()):
// tylny dysk i zagięty nad cieniem obraz tylnej części dysku, cień, pierścień fotonowy, przedni dysk.
// Zwraca animator smug dysku (ten sam co blackHoleAnimator).
export function blackHole(ctx, w, h, opts) {
  const { CX, CY, SH, r1, r2, k } = geom(w, h, opts);
  const nD = perlin(opts.seed + 19);
  const behind = region(w, h, CX - r2 - 2, CY - SH * 1.95, CX + r2 + 2, CY + Math.max(r2 * DISK_K, SH * 1.3) + 2, 1, (x, y, out) => {
    const dx = x - CX, dy = y - CY;
    let R = 0, G = 0, B = 0;
    const dyk = dy / DISK_K, rho = Math.sqrt(dx * dx + dyk * dyk), t = (rho - r1) / (r2 - r1);
    if (dy < 0 && t >= 0 && t <= 1) {
      const phi = Math.atan2(dy / DISK_K, dx), grain = 0.75 + 0.25 * fbm(nD, rho / (4.5 * k), phi * 6, 3) * 2;
      [R, G, B] = heat(t, Math.min(1, prof(t) * dopp(phi) * grain * 1.9));
    }
    const dyl = dy * 1.04, r = Math.sqrt(dx * dx + dyl * dyl), top = dy < 0, band = top ? SH * 0.8 : SH * 0.18, tl = (r - SH * 1.05) / band;
    if (tl >= 0 && tl <= 1) {
      const phi = Math.atan2(dy, dx);
      const along = top ? Math.pow(Math.max(0, Math.sin(-phi)), 0.35) : 0.4 * Math.pow(Math.max(0, Math.sin(phi)), 0.8);
      const I = Math.pow(1 - tl, 1.15) * (0.45 + 0.55 * Math.exp(-tl * 1.6)) * dopp(phi) * along * 1.5;
      const [r2c, g2c, b2c] = heat(tl, Math.min(1, I));
      R += r2c; G += g2c; B += b2c;
    }
    if (R + G + B <= 0) return;
    out[0] = R; out[1] = G; out[2] = B; out[3] = 255;
  });
  const front = region(w, h, CX - r2 - 2, CY, CX + r2 + 2, CY + r2 * DISK_K + 2, 1, (x, y, out) => {
    const dx = x - CX, dy = y - CY, dyk = dy / DISK_K, rho = Math.sqrt(dx * dx + dyk * dyk), t = (rho - r1) / (r2 - r1);
    if (dy < 0 || t < 0 || t > 1) return;
    const phi = Math.atan2(dy / DISK_K, dx), grain = 0.75 + 0.25 * fbm(nD, rho / (4.5 * k), phi * 6, 3) * 2;
    const [R, G, B] = heat(t, Math.min(1, prof(t) * dopp(phi) * grain * 1.9));
    out[0] = R; out[1] = G; out[2] = B; out[3] = 255;
  });
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, CX, CY, SH * 4.5, '255,150,70', 0.09);
  ctx.restore();
  paint(ctx, behind, 'lighter');
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(CX, CY, SH, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,240,215,.95)'; ctx.lineWidth = 1.1 * k;
  ctx.beginPath(); ctx.arc(CX, CY, SH * 1.02, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,190,120,.22)'; ctx.lineWidth = 4 * k;
  ctx.beginPath(); ctx.arc(CX, CY, SH * 1.05, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  paint(ctx, front, 'lighter');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, CX - r2 * 0.55, CY + 3 * k, 46 * k, '255,235,200', 0.1);
  ctx.restore();
  return blackHoleAnimator(opts);
}

// Animowane smugi materii krążącej w dysku (szybciej bliżej środka, jak w ruchu keplerowskim).
// Rysuje na przezroczystej nakładce: smugi za cieniem są przycięte do obszaru poza nim, przednie na wierzchu.
export function blackHoleAnimator(opts) {
  const R = rng(opts.seed + 5), parts = [];
  for (let i = 0; i < 300; i++) {
    const t = Math.pow(R(), 1.5);
    parts.push({ t, a0: R() * Math.PI * 2, len: 0.12 + R() * 0.5, lw: 0.4 + R() * 1.2, b: 0.15 + R() * 0.4 });
  }
  return (ctx, w, h, time) => {
    const { CX, CY, SH, r1, r2, k } = geom(w, h, opts);
    const draw = (from, to, lensed) => {
      for (const p of parts) {
        const rad = r1 + (r2 - r1) * p.t;
        const a = (p.a0 + time * 0.7 * Math.pow(r1 / rad, 1.5)) % (Math.PI * 2), a2 = a + p.len;
        const segs = [[Math.max(a, from), Math.min(a2, to)]];
        if (a2 > Math.PI * 2) segs.push([from, Math.min(a2 - Math.PI * 2, to)]);
        for (const [s0, s1] of segs) {
          if (!(s1 > s0)) continue;
          const al = p.b * dopp((s0 + s1) / 2) * prof(p.t) * (lensed ? 0.9 : 1.2);
          if (al < 0.02) continue;
          const [Rr, Gg, Bb] = heat(p.t, 1);
          ctx.strokeStyle = `rgba(${Rr | 0},${Gg | 0},${Bb | 0},${clamp(al).toFixed(3)})`;
          ctx.lineWidth = p.lw * k * (lensed ? 0.8 : 1);
          ctx.beginPath();
          if (lensed) { const rl = SH * 1.07 + p.t * SH * 0.5; ctx.ellipse(CX, CY, rl, rl / 1.04, 0, s0, s1); }
          else ctx.ellipse(CX, CY, rad, rad * DISK_K, 0, s0, s1);
          ctx.stroke();
        }
      }
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.arc(CX, CY, SH * 1.01, 0, Math.PI * 2, true);
    ctx.clip('evenodd');
    draw(Math.PI, Math.PI * 2, false);
    draw(Math.PI * 1.04, Math.PI * 1.96, true);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    draw(0, Math.PI, false);
    ctx.restore();
  };
}
