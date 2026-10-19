// Wyspy i platformy pod dioramami. Wierzch to romb size × size kafelków wokół początku siatki (gx, gy ∈ [−size/2, size/2]),
// w tych współrzędnych layout układa rdzeń i działki. Czysty JS bez DOM.
import { TW, TH, LV, iso, tones, box, mixRgb, css } from './iso.js';
import { PALETTES, seeded } from './parts.js';

export const SNOW = '#eef3fb';

// Podstawa, materiał i efekty nieba każdego z 45 widoków.
export const PLACES = {};
const put = (ids, base, material, stars, traffic) => {
  for (const id of ids.split(' ')) PLACES[id] = { base, material, sky: { stars, traffic } };
};
put('waw ber tyo sfo sel blr sao lon nyc lag syd sto sin rkv dxb yyz zrh tlv', 'island', 'grass', false, 'clouds');
put('moon', 'island', 'regolith', true, 'none');
put('mercury ceres', 'island', 'rock', true, 'none');
put('europa', 'island', 'ice', true, 'none');
put('mars', 'island', 'rust', false, 'none');
put('titan', 'island', 'dunes', false, 'none');
put('leo l2', 'platform', 'metal', true, 'satellites');
put('venus', 'aerostat', 'deck', false, 'none');
put('sol alpha trappist pleiades crab orion omega lmc sgr', 'dock', 'metal', true, 'comets');
put('milkyway andromeda triangulum virgo bullet attractor bootes hercules edge', 'shard', 'crystal', true, 'comets');

const { space, galaxy, earth } = PALETTES;
// Barwa wierzchu przed oświetleniem: wg widoku, w razie braku wg materiału (dok i odłamek to mieszaniny palet).
const TOP = {
  regolith: '#8c8e98', rock: '#7a726b', ceres: '#625b54', rust: '#b25a3a', ice: '#c9dfec', dunes: '#a8763a', deck: '#c9a85c',
  metal: space.ground, dock: '#594c92', crystal: '#d2c7dd',
};
const SEASON = { spring: '#9cd87e', autumn: '#9eb26a' }; // trawa: wiosną świeższa, jesienią przygaszona

// Trawa zależy od pory roku, pod śniegiem to SNOW; inne światy mają stałą barwę.
export function groundTone(view, env = {}) {
  const { base, material } = PLACES[view] ?? PLACES.waw;
  if (material === 'grass') return env.snowCover ? SNOW : SEASON[env.season] ?? earth.ground;
  return TOP[view] ?? TOP[base === 'dock' ? 'dock' : material];
}

// --- Rysowanie: (u, v, z) to punkt siatki, [x, y] punkt rysunku ---

const n = (v) => Math.round(v * 10) / 10 + 0;
const xy = ([x, y]) => `${n(x)} ${n(y)}`;
const at = (u, v, z = 0) => xy(iso(u, v, z));
const pl = (pts) => `M${pts.map(([u, v]) => at(u, v)).join('L')}Z`;
const RX = TW * Math.SQRT1_2; // półoś pozioma okręgu o promieniu 1 kafelka
const ell = (x, y, rx, ry = rx / 2) => `M${n(x - rx)} ${n(y)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0z`;
const sp = (r, m) => [(r() * 2 - 1) * m, (r() * 2 - 1) * m]; // losowy punkt siatki w [−m, m]²
const mid = (a, b, k = 0.5) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const mix = (c, k) => css(mixRgb(c, k > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(k))); // k > 0 rozjaśnia, k < 0 ciemni
const each = (k, f) => Array.from({ length: Math.round(k) }, (_, i) => f(i)).join('');
const star = (x, y) => `M${n(x)} ${n(y - 2.6)}l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z`;
const down = (svg, dy) => svg.replace('<path', `<path transform="translate(0 ${dy})"`);

// Ścieżka: wypełnienie albo, gdy podano grubość w, sama kreska (o to krycie); kropka to kreska `h.1` z okrągłym końcem.
const P = (d, c, o = 1, w) => (d ? `<path d="${d}" ${w ? `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"` : `fill="${c}"`}${o < 1 ? ` opacity="${o}"` : ''}/>` : '');
const solid = (d, c) => `<path d="${d}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`; // z kreską uszczelniającą
const wall = (pts, c) => solid(`M${pts.map(xy).join('L')}Z`, c);

// Nieregularna płyta wokół (u, v) i pęknięcie z kilku odcinków, zawsze wewnątrz rombu.
const blob = (r, u, v, rad) => {
  const k = 6 + Math.floor(r() * 3);
  return pl(Array.from({ length: k }, (_, i) => { const a = (i / k) * 6.3, q = rad * (0.65 + r() * 0.5); return [u + Math.cos(a) * q, v + Math.sin(a) * q]; }));
};
const crack = (r, hs, len) => {
  const cl = (x) => Math.max(0.2 - hs, Math.min(hs - 0.2, x));
  let [u, v] = sp(r, hs - 0.3), a = r() * 6.3, d = `M${at(u, v)}`;
  for (let j = 2 + Math.floor(r() * 3); j > 0; j--) { a += (r() - 0.5) * 1.6; u = cl(u + Math.cos(a) * len); v = cl(v + Math.sin(a) * len); d += `L${at(u, v)}`; }
  return d;
};

// --- Faktura wierzchu: g = { hs, s, r, tg, sh, light, base }, sh(k) = barwa wierzchu jaśniejsza (k > 0) lub ciemniejsza ---

const TEX = {
  // Plac z chodnikiem, cztery ścieżki do brzegu, ciemne kępki trawy.
  grass({ hs, r, sh, light }) {
    const pave = tones('#d9d2c2', light).top, p = Math.min(hs / 2, 2.6), e = hs - 0.7, w = 0.28;
    let d = pl([[-p, -p], [p, -p], [p, p], [-p, p]]), slab = '';
    for (const a of [-1, 1]) d += pl([[a * p, -w], [a * e, -w], [a * e, w], [a * p, w]]) + pl([[-w, a * p], [-w, a * e], [w, a * e], [w, a * p]]);
    for (let i = -Math.floor(p); i <= p; i++) slab += `M${at(i, -p)}L${at(i, p)}M${at(-p, i)}L${at(p, i)}`;
    const tuft = each(hs * 6, () => {
      const [u, v] = sp(r, hs - 0.4);
      return Math.min(Math.abs(u), Math.abs(v)) < 0.5 || Math.max(Math.abs(u), Math.abs(v)) < p + 0.4 ? '' : `M${at(u, v)}h.1`;
    });
    return P(d, pave) + P(slab, mix(pave, -0.35), 0.6, 0.5) + P(tuft, sh(-0.25), 0.8, 2.2);
  },
  // Kraterki: ciemna czasza i jasny brzeg.
  regolith({ hs, s, r, sh }) {
    let bowl = '', rim = '';
    for (let i = 0; i < s * 1.4; i++) {
      const rad = (0.22 + r() * 0.4) * RX, [x, y] = iso(...sp(r, hs - 0.5));
      bowl += ell(x, y + 0.8, rad); rim += ell(x, y, rad);
    }
    return P(bowl, sh(-0.3), 0.55) + P(rim, sh(0.28), 0.8, 1.1);
  },
  // Skała: płyty i spękania.
  rock({ hs, s, r, sh }) {
    return P(each(s, () => { const rad = 0.5 + r() * 0.7; return blob(r, ...sp(r, hs - 1.3 * rad), rad); }), sh(-0.12))
      + P(each(s * 0.8, () => crack(r, hs, 0.6)), sh(-0.35), 0.8, 1);
  },
  // Rdza: kamienie z jasnym wierzchem od strony światła.
  rust({ hs, s, r, tg, sh }) {
    const side = tg.litSide === 'right' ? 1 : -1;
    let body = '', hi = '';
    for (let i = 0; i < s * 2; i++) {
      const [x, y] = iso(...sp(r, hs - 0.5)), w = 2.4 + r() * 4;
      body += ell(x, y - w * 0.15, w, w * 0.6); hi += ell(x + side * w * 0.3, y - w * 0.5, w * 0.5, w * 0.28);
    }
    return P(body, sh(-0.3)) + P(hi, sh(0.25));
  },
  // Lód: spękania z jasnym odbiciem.
  ice({ hs, s, r, sh }) {
    const cr = each(s * 0.9, () => crack(r, hs, 0.8));
    return P(cr, sh(-0.32), 0.9, 1) + down(P(cr, '#fff', 0.7, 0.8), 1.3);
  },
  // Wydmy: rzędy łuków grzbietów, każdy z cieniem po zawietrznej.
  dunes({ hs, r, sh }) {
    let crest = '';
    for (let v = 0.7 - hs; v < hs - 0.4; v += 0.65) {
      for (let u = 0.5 - hs + r() * 1.2; u < hs - 1.2;) {
        const u1 = Math.min(u + 1.2 + r() * 2.4, hs - 0.5), vv = v + (r() - 0.5) * 0.2;
        crest += `M${at(u, vv)}Q${at((u + u1) / 2, vv + (r() - 0.3) * 0.3)} ${at(u1, vv)}`;
        u = u1 + 0.3 + r() * 1.3;
      }
    }
    return down(P(crest, sh(-0.24), 0.55, 1.7), 2) + P(crest, sh(0.3), 0.85, 1.2);
  },
  // Metal: szwy co 2 kafelki, losowe jasne płyty (każde miejsce inne) i światła krawędzi (świecą też nocą).
  metal({ hs, r, sh, base }) {
    let seam = '', lamp = '';
    for (let e = 2 - hs; e < hs - 0.01; e += 2) seam += `M${at(e, -hs)}L${at(e, hs)}M${at(-hs, e)}L${at(hs, e)}`;
    for (let t = 0.5 - hs; t < hs; t++) lamp += [[t, 0.22 - hs], [t, hs - 0.22], [0.22 - hs, t], [hs - 0.22, t]].map(([u, v]) => `M${at(u, v)}h.1`).join('');
    const q = Math.min(0.9, hs / 2), plates = each(hs, () => { const [u, v] = sp(r, hs - q); return pl([[u - q, v - q], [u + q, v - q], [u + q, v + q], [u - q, v + q]]); });
    return P(plates, sh(0.1)) + P(seam, sh(-0.3), 0.8, 0.8) + P(lamp, (base === 'dock' ? galaxy : space).glass, 0.95, 2.4);
  },
  // Pokład: deski ze złączami i balustrada wzdłuż tylnych krawędzi.
  deck({ hs, r, sh, light }) {
    let seam = '', rail = `M${at(-hs, hs, 1)}L${at(-hs, -hs, 1)}L${at(hs, -hs, 1)}`;
    for (let v = 0.5 - hs; v < hs - 0.01; v += 0.5) { const j = sp(r, hs - 0.5)[0]; seam += `M${at(-hs, v)}L${at(hs, v)}M${at(j, v - 0.5)}L${at(j, v)}`; }
    for (let t = -hs; t < hs + 1e-6; t++) rail += `M${at(-hs, t)}L${at(-hs, t, 1)}M${at(t, -hs)}L${at(t, -hs, 1)}`;
    return P(seam, sh(-0.3), 0.7, 0.6) + P(rail, tones(space.metal, light).top, 1, 1);
  },
  // Kryształ: cztery fasety od punktu w środku (na przemian jaśniejsze i ciemniejsze) i błyski.
  crystal({ hs, r }) {
    const C = sp(r, hs / 4), q = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]], f = (i) => pl([q[i], q[(i + 1) % 4], C]);
    return P(f(0) + f(2), '#fff', 0.14) + P(f(1) + f(3), '#000', 0.14) + P(each(5, () => star(...iso(...sp(r, hs - 0.6)))), '#fff', 0.85);
  },
};

// --- Spód: g = { W, fy, hs, s, r, light, top, ud, tg, tu }, W = pół szerokości, fy = dół przedniej krawędzi; zwraca { svg, bottom } ---

const UNDER = {
  // Skała: dwie ściany stożka z ząbkowanym obrysem (sople).
  island({ W, fy, s, r, tu }) {
    const tip = [(r() - 0.5) * W * 0.3, fy + s * 5.5];
    const out = (sx) => Array.from({ length: 7 }, (_, i) => {
      const k = (i + 1) / 8, z = i % 2;
      return [sx * W * (1 - k) ** 1.1 * (z ? 0.78 : 1) * (0.92 + r() * 0.1) + tip[0] * k, LV + (tip[1] - LV) * k + (z ? 0 : 7 + r() * 6)];
    });
    return { svg: wall([[-W, LV], [0, fy], tip, ...out(-1).reverse()], tu.left) + wall([[0, fy], [W, LV], ...out(1), tip], tu.right), bottom: tip[1] + 14 };
  },
  // Platforma: kratownica (zygzak na obu ścianach) pod krawędzią i pięć dysz z żarem.
  platform({ hs, tg, ud, light }) {
    const h = hs - 0.8, z0 = -1, z1 = -4.2, m = 2 * Math.max(2, Math.round(h));
    let a = '', b = '', body = '', glow = '', bottom = 0;
    for (let i = 0; i <= m; i++) {
      const u = -h + (i * 2 * h) / m, z = i % 2 ? z0 : z1, c = i ? 'L' : 'M';
      a += c + at(u, h, z); b += c + at(h, u, z);
    }
    for (const [u, v] of [[h, -h], [-h, h], [0, h], [h, 0], [h, h]]) {
      const [x, y] = iso(u, v, z1);
      body += `M${n(x - 4.5)} ${n(y)}h9l2.5 9h-14z`; glow += ell(x, y + 10, 7, 3); bottom = Math.max(bottom, y + 13);
    }
    return {
      svg: box({ gx: -h, gy: -h, gz: z1, w: 2 * h, d: 2 * h, h: z0 - z1 }, tones(mix(ud, -0.5), light), { rim: false })
        + P(a + b, tg.left, 1, 1.1) + P(body, tg.right) + P(glow, '#8fd3ff', 0.9),
      bottom,
    };
  },
  // Aerostat: powłoka balonu (dwie ćwiartki elipsy i południki) schowana pod pokładem.
  aerostat({ W, fy, s, top, light }) {
    const rx = W * 0.9, ry = fy + s * 5.5, e = tones(mixRgb(top, [255, 244, 220], 0.55), light);
    const arc = (a, f) => `M${n(a * rx * f)} 0A${n(rx * f)} ${n(ry)} 0 0 ${a < 0 ? 0 : 1} 0 ${n(ry)}`; // ćwiartka elipsy: a = −1 lewa, 1 prawa
    return {
      svg: solid(`${arc(-1, 1)}L0 0Z`, e.left) + solid(`${arc(1, 1)}L0 0Z`, e.right) + P([0.4, 0.75].map((f) => arc(-1, f) + arc(1, f)).join(''), mix(e.left, -0.35), 0.7, 0.9),
      bottom: ry,
    };
  },
  // Dok: odwrócony stożek z belek (trzy dźwigary do piasty) ze światłami.
  dock({ W, fy, s, ud, light }) {
    const ps = [[-W, LV], [0, fy], [W, LV]], hub = [0, fy + s * 5], td = tones(mix(ud, -0.3), light);
    return {
      svg: wall([ps[0], ps[1], hub], td.left) + wall([ps[1], ps[2], hub], td.right)
        + P(ps.map((p) => `M${xy(p)}L${xy(hub)}`).join(''), tones(galaxy.metal, light).left, 1, 2)
        + P(ps.flatMap((p) => [p, mid(p, hub, 0.45), mid(p, hub, 0.75)]).map((p) => `M${xy(p)}h.1`).join(''), galaxy.glass, 0.95, 3),
      bottom: hub[1] + 2,
    };
  },
  // Odłamek: cztery fasety zbiegające się w czubku i jasne krawędzie między nimi.
  shard({ W, fy, s, r, tu }) {
    const Lb = [-W, LV], Fb = [0, fy], Rb = [W, LV], tip = [(r() - 0.5) * W * 0.25, fy + s * 6], Lm = mid(Lb, Fb), Rm = mid(Fb, Rb);
    return {
      svg: [[Lb, Lm, tu.left, -0.1], [Lm, Fb, tu.left, 0.15], [Fb, Rm, tu.right, 0.15], [Rm, Rb, tu.right, -0.12]].map(([a, b, c, k]) => wall([a, b, tip], mix(c, k))).join('')
        + P([Lm, Fb, Rm].map((p) => `M${xy(p)}L${xy(tip)}`).join(''), '#fff', 0.35, 0.8),
      bottom: tip[1] + 2,
    };
  },
};

// → { svg, bbox: [x0, y0, x1, y1] w jednostkach dioramy ze spodem, rim: narożniki wierzchu [x, y] (tył, prawy, przód, lewy) }.
export function island({ view, size, light, env = {}, seed = 1 }) {
  const { base, material } = PLACES[view] ?? PLACES.waw, s = size, hs = s / 2, W = (s * TW) / 2;
  const top = groundTone(view, env), ud = material === 'grass' ? '#6e5136' : mixRgb(top, [18, 20, 36], 0.5);
  const tg = tones(top, light), tu = tones(ud, light);
  const g = { W, fy: (s * TH) / 2 + LV, hs, s, r: seeded(seed), light, top, ud, tg, tu, base, sh: (k) => mix(tg.top, k) };
  const rim = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]].map(([u, v]) => iso(u, v).map(n));
  const under = UNDER[base](g);
  const slab = box({ gx: -hs, gy: -hs, gz: -1, w: s, d: s, h: 1 }, { ...tg, left: tu.left, right: tu.right }); // boki w barwie spodu
  return {
    svg: under.svg + slab + TEX[material](g),
    bbox: [Math.floor(-W - 1), Math.floor(rim[0][1] - 1 - (material === 'deck' ? LV : 0)), Math.ceil(W + 1), Math.ceil(under.bottom + 1)],
    rim,
  };
}
