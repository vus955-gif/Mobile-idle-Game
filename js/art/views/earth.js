// Widoki zza okna na Ziemi: 18 miast. Niebo zależy od pory dnia i pogody, panorama ma trzy plany
// z perspektywą powietrzną, a każde miasto dostaje element miejsca (góry, wodę, mgłę, zorzę, pył).
// Charakterystyczne budowle (LANDMARKS) zostają w SVG sceny — przepis ich nie rysuje.
import { seedOf } from './placeholder.js';
import { recipe } from './common.js';
import { SKY, earthSky, sunMoon, cloudBank, cityPlanes, mountains, water, fogBank } from '../kit/earth.js';
import { aurora, auroraAnimator } from '../kit/sky.js';

const BAD = (w) => w === 'rain' || w === 'snow' || w === 'fog';

// Klucz światła z pory dnia: świt i zmierzch ciepło i nisko, dzień biało i wysoko, noc chłodno i ciemno.
// Przy złej pogodzie światło jest bardziej rozproszone (większe ambient) i szarzeje.
const PHASE_LIGHT = {
  night: { color: [150, 170, 255], dir: [0.6, -0.8], ambient: 0.3, rim: [120, 140, 230] },
  dawn: { color: [255, 190, 150], dir: [-0.94, -0.34], ambient: 0.55, rim: [255, 170, 140] },
  day: { color: [255, 250, 240], dir: [0.42, -0.91], ambient: 0.8, rim: [200, 225, 255] },
  dusk: { color: [255, 170, 120], dir: [0.94, -0.34], ambient: 0.5, rim: [255, 140, 120] },
};
export function earthLight(env = {}) {
  const L = PHASE_LIGHT[env.phase] || PHASE_LIGHT.day;
  if (!BAD(env.weather) && env.weather !== 'cloudy') return { ...L, color: [...L.color], dir: [...L.dir], rim: [...L.rim] };
  const grey = (c, t) => c.map((v, i) => Math.round(v + ([190, 195, 205][i] - v) * t));
  const t = env.weather === 'cloudy' ? 0.3 : 0.5;
  return { color: grey(L.color, t), dir: [...L.dir], ambient: Math.min(1, L.ambient + (env.weather === 'cloudy' ? 0.08 : 0.15)), rim: grey(L.rim, t) };
}

const skyStops = (env = {}) => (SKY[env.phase] || SKY.day).stops;

// Element miejsca: water — linia wody (ułamek wysokości; miasto stoi na drugim brzegu), mountains — fuji, alps
// albo hills (foothills — przedgórze przed Alpami), fog — mgła znad zatoki rano i w dzień, aurora — zorza nocą, dust — pustynny pył przy horyzoncie,
// haze — kolor mgiełki nad miastem, tall/density/planes — charakter zabudowy.
const PLACES = {
  waw: { water: 0.8 },
  ber: { tall: 0.85 },
  tyo: { mountains: 'fuji', density: 1.2, tall: 0.75 },
  sfo: { water: 0.79, fog: true, tall: 0.9 },
  sel: { mountains: 'hills', density: 1.1, tall: 0.8 },
  blr: { haze: [238, 200, 156], tall: 0.8 },
  sao: { density: 1.7, planes: 4 },
  lon: { tall: 0.95 },
  nyc: { tall: 1.45, density: 1.3 },
  lag: { water: 0.8, haze: [232, 212, 172], tall: 0.85 },
  syd: { water: 0.78 },
  sto: { water: 0.8, tall: 0.7 },
  sin: { water: 0.79, tall: 1.2, haze: [222, 232, 226] },
  rkv: { aurora: true, tall: 0.55, density: 0.6 },
  dxb: { dust: [232, 196, 140], haze: [228, 196, 150], tall: 1.3, density: 0.7 },
  yyz: { water: 0.8, tall: 1.1 },
  zrh: { mountains: 'alps', foothills: true, tall: 0.55, density: 0.7 },
  tlv: { water: 0.8, tall: 0.9 },
};

// Zorza nad Reykjavíkiem: zielona kurtyna z fioletowym szczytem.
const AURORA = { colors: [[70, 255, 170], [150, 90, 255]], y: 0.5, height: 0.36 };
const auroraOn = (env = {}) => env.phase === 'night' && !BAD(env.weather);

// Mgiełka nad miastem zależnie od pory: nocą przygaszona, o świcie i zmierzchu przechodzi w kolor nieba.
function hazeFor(c, phase) {
  if (!c) return null;
  if (phase === 'night') return c.map((v) => v * 0.3);
  if (phase === 'day') return c;
  const low = (SKY[phase] || SKY.day).stops[2];
  return c.map((v, i) => v * 0.6 + parseInt(low.slice(1 + i * 2, 3 + i * 2), 16) * 0.4);
}

// Pustynny pył: ciepły pas nad horyzontem (Dubaj).
function dustBand(ctx, w, h, c, phase) {
  const a = phase === 'night' ? 0.12 : 0.4;
  const g = ctx.createLinearGradient(0, 0.45 * h, 0, 0.9 * h);
  g.addColorStop(0, `rgba(${c.join(',')},0)`);
  g.addColorStop(1, `rgba(${c.join(',')},${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0.45 * h, w, 0.55 * h);
}

function cityRecipe(id) {
  const P = PLACES[id], seed = seedOf(id);
  const draw = (ctx, w, h, env = {}) => {
    const phase = env.phase || 'day', weather = env.weather || 'clear', e = { phase, weather };
    earthSky(ctx, w, h, e);
    if (P.aurora && auroraOn(e)) {
      ctx.save(); ctx.globalAlpha = 0.45;
      aurora(ctx, w, h, { seed: seed + 9, ...AURORA });
      ctx.restore();
    }
    sunMoon(ctx, w, h, e);
    cloudBank(ctx, w, h, { seed: seed + 1, ...e });
    if (P.dust) dustBand(ctx, w, h, hazeFor(P.dust, phase).map((v) => v | 0), phase);
    if (P.mountains) mountains(ctx, w, h, { seed: seed + 2, kind: P.mountains, ...e });
    if (P.foothills) mountains(ctx, w, h, { seed: seed + 5, kind: 'hills', ...e });
    const base = P.water ? P.water - 0.004 : 0.86;
    cityPlanes(ctx, w, h, { seed: seed + 3, ...e, base, haze: hazeFor(P.haze, phase), density: P.density || 1, tall: P.tall || 1, planes: P.planes || 3 });
    if (P.water) water(ctx, w, h, { y: P.water, seed: seed + 4, ...e });
    if (P.fog && weather === 'clear' && (phase === 'dawn' || phase === 'day')) fogBank(ctx, w, h, { y: base - 0.02, phase });
  };
  const light = P.aurora
    ? (env = {}) => (auroraOn(env) ? { ...earthLight(env), color: [120, 230, 190], rim: [110, 220, 200] } : earthLight(env))
    : earthLight;
  return recipe(id, {
    focus: { x: 0.5, y: 0.3 },
    stops: skyStops,
    light,
    draw,
    animate: P.aurora ? auroraAnimator({ seed: seed + 9, ...AURORA }) : null,
    animateWhen: P.aurora ? auroraOn : null,
  });
}

export const EARTH_RECIPES = Object.fromEntries(Object.keys(PLACES).map((id) => [id, cityRecipe(id)]));
