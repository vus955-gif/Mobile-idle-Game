// Widoki zza okna na Ziemi: 18 miast. Niebo zależy od pory dnia i pogody.
import { placeholder } from './placeholder.js';
import { SKY } from '../kit/earth.js';

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
const CITIES = ['waw', 'ber', 'tyo', 'sfo', 'sel', 'blr', 'sao', 'lon', 'nyc', 'lag', 'syd', 'sto', 'sin', 'rkv', 'dxb', 'yyz', 'zrh', 'tlv'];

export const EARTH_RECIPES = Object.fromEntries(CITIES.map((id) => [id, placeholder(id, skyStops, earthLight)]));
