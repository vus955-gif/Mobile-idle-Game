// Charakterystyczne budowle 18 miast (przeniesione ze sceny) na linii panoramy tła, w układzie sceny (px CSS).
// Warstwa leży w opakowaniu tła Canvas, więc najazd kamery przesuwa budowle razem z tłem.
import { SKY } from '../art/kit/earth.js';
import { shade } from './parts.js';
import { css, n as r1 } from './iso.js';

// Okna nocą: siatka co 5 × every, świeci co trzecie.
function rectWin(x, y, w, h, night, color, every = 8) {
  if (!night) return '';
  let out = '';
  for (let wy = y + 5; wy < y + h - 4; wy += every) {
    for (let wx = x + 3; wx < x + w - 3; wx += 5) if (((wx * 7 + wy * 13) | 0) % 3 === 0) out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2" height="3" fill="${color}" opacity=".85"/>`;
  }
  return out;
}

const LANDMARKS = {
  palace(x, g, c, n, win) { // Pałac Kultury i Nauki
    return `<rect x="${x - 26}" y="${g - 30}" width="52" height="30" fill="${c}"/><rect x="${x - 15}" y="${g - 82}" width="30" height="52" fill="${c}"/><rect x="${x - 11}" y="${g - 104}" width="22" height="22" fill="${c}"/><rect x="${x - 7}" y="${g - 120}" width="14" height="16" fill="${c}"/><rect x="${x - 4}" y="${g - 130}" width="8" height="10" fill="${c}"/><rect x="${x - 1}" y="${g - 158}" width="2" height="28" fill="${c}"/><circle cx="${x}" cy="${g - 112}" r="3" fill="${n ? win : '#e8edf7'}" opacity=".8"/>${rectWin(x - 15, g - 82, 30, 52, n, win)}${rectWin(x - 26, g - 30, 52, 30, n, win)}`;
  },
  varso(x, g, c, n, win) {
    return `<path d="M${x - 8} ${g} V${g - 150} L${x - 2} ${g - 160} L${x + 8} ${g - 150} V${g} Z" fill="${c}"/><rect x="${x - 0.8}" y="${g - 195}" width="1.6" height="36" fill="${c}"/><rect x="${x - 6}" y="${g - 148}" width="2" height="146" fill="#fff" opacity=".12"/>${rectWin(x - 8, g - 145, 16, 140, n, win, 7)}`;
  },
  fernsehturm(x, g, c, n, win) {
    return `<path d="M${x - 6} ${g} L${x - 2.5} ${g - 40} V${g - 98} H${x + 2.5} V${g - 40} L${x + 6} ${g} Z" fill="${c}"/><circle cx="${x}" cy="${g - 106}" r="10" fill="${n ? '#5a6390' : '#cdd3e1'}"/><rect x="${x - 10}" y="${g - 107}" width="20" height="2" fill="${n ? win : '#9aa3bd'}"/><rect x="${x - 1.4}" y="${g - 150}" width="2.8" height="36" fill="${c}"/><rect x="${x - 1.4}" y="${g - 150}" width="2.8" height="8" fill="#e05252"/>`;
  },
  bigben(x, g, c, n, win) {
    return `<rect x="${x - 7}" y="${g - 92}" width="14" height="92" fill="${c}"/><rect x="${x - 8}" y="${g - 92}" width="16" height="4" fill="${c}"/><circle cx="${x}" cy="${g - 80}" r="5" fill="${n ? win : '#f3ead2'}"/><path d="M${x - 8} ${g - 96} L${x} ${g - 122} L${x + 8} ${g - 96} Z" fill="${c}"/><rect x="${x - 0.6}" y="${g - 132}" width="1.2" height="12" fill="${c}"/>${rectWin(x - 7, g - 66, 14, 64, n, win)}`;
  },
  shard(x, g, c, n, win) {
    return `<path d="M${x - 20} ${g} L${x - 2} ${g - 146} L${x + 3} ${g - 132} L${x + 20} ${g} Z" fill="${c}"/><path d="M${x - 2} ${g - 146} L${x + 3} ${g - 132} L${x + 6} ${g}" stroke="#fff" stroke-width=".8" opacity=".25" fill="none"/>${rectWin(x - 12, g - 90, 24, 88, n, win, 9)}`;
  },
  goldenGate(x, g, c, n) {
    const red = n ? '#7a2b25' : '#c0362c';
    const t1 = x - 22; const t2 = x + 22;
    return `<path d="M${x - 70} ${g - 84} Q${t1 - 20} ${g - 40} ${t1} ${g - 84} Q${x} ${g - 20} ${t2} ${g - 84} Q${t2 + 20} ${g - 40} ${x + 70} ${g - 84}" stroke="${red}" stroke-width="1.6" fill="none"/><rect x="${x - 80}" y="${g - 28}" width="160" height="4" fill="${red}"/>${[t1, t2].map((tx) => `<rect x="${tx - 3}" y="${g - 92}" width="2.5" height="92" fill="${red}"/><rect x="${tx + 0.5}" y="${g - 92}" width="2.5" height="92" fill="${red}"/><rect x="${tx - 3}" y="${g - 80}" width="6" height="2" fill="${red}"/><rect x="${tx - 3}" y="${g - 56}" width="6" height="2" fill="${red}"/>`).join('')}`;
  },
  transamerica(x, g, c, n, win) {
    return `<path d="M${x - 13} ${g} L${x} ${g - 118} L${x + 13} ${g} Z" fill="${c}"/><rect x="${x - 0.7}" y="${g - 134}" width="1.4" height="18" fill="${c}"/><path d="M${x - 7} ${g - 70} h-5 v6 h5z M${x + 7} ${g - 70} h5 v6 h-5z" fill="${c}"/>${rectWin(x - 8, g - 60, 16, 58, n, win, 7)}`;
  },
  empire(x, g, c, n, win) {
    return `<rect x="${x - 17}" y="${g - 32}" width="34" height="32" fill="${c}"/><rect x="${x - 12}" y="${g - 96}" width="24" height="64" fill="${c}"/><rect x="${x - 8}" y="${g - 118}" width="16" height="22" fill="${c}"/><rect x="${x - 4}" y="${g - 130}" width="8" height="12" fill="${c}"/><rect x="${x - 1}" y="${g - 160}" width="2" height="30" fill="${c}"/>${rectWin(x - 12, g - 96, 24, 64, n, win)}${rectWin(x - 17, g - 32, 34, 32, n, win)}`;
  },
  chrysler(x, g, c, n, win) {
    const s = n ? '#8f97b8' : '#d6dbe8';
    return `<rect x="${x - 9}" y="${g - 108}" width="18" height="108" fill="${c}"/><path d="M${x - 9} ${g - 108} a9 9 0 0 1 18 0z M${x - 7} ${g - 116} a7 7 0 0 1 14 0z M${x - 5} ${g - 123} a5 5 0 0 1 10 0z M${x - 3} ${g - 129} a3 3 0 0 1 6 0z" fill="${s}"/><rect x="${x - 0.6}" y="${g - 152}" width="1.2" height="24" fill="${s}"/>${rectWin(x - 9, g - 100, 18, 98, n, win)}`;
  },
  tokyoTower(x, g, c, n) {
    const red = n ? '#a2402e' : '#e8452c';
    const wh = n ? '#c9cbe0' : '#ffffff';
    return `<path d="M${x - 24} ${g} L${x - 4} ${g - 118} H${x + 4} L${x + 24} ${g} H${x + 14} L${x + 1} ${g - 70} H${x - 1} L${x - 14} ${g} Z" fill="${red}"/><rect x="${x - 12}" y="${g - 52}" width="24" height="5" fill="${wh}"/><rect x="${x - 7}" y="${g - 92}" width="14" height="4" fill="${wh}"/><rect x="${x - 9}" y="${g - 72}" width="18" height="6" fill="${red}"/><rect x="${x - 1}" y="${g - 150}" width="2" height="34" fill="${red}"/>`;
  },
  seoulTower(x, g, c, n, win) {
    return `<ellipse cx="${x}" cy="${g}" rx="34" ry="22" fill="${shade(c, 0.85)}"/><rect x="${x - 2}" y="${g - 104}" width="4" height="84" fill="${c}"/><rect x="${x - 7}" y="${g - 96}" width="14" height="9" rx="3" fill="${c}"/><rect x="${x - 6}" y="${g - 94}" width="12" height="2" fill="${n ? win : '#e8edf7'}"/><rect x="${x - 0.7}" y="${g - 128}" width="1.4" height="26" fill="${c}"/>`;
  },
  lotte(x, g, c, n, win) {
    return `<path d="M${x - 11} ${g} L${x - 3} ${g - 176} L${x + 3} ${g - 176} L${x + 11} ${g} Z" fill="${c}"/><path d="M${x} ${g - 176} V${g}" stroke="#fff" stroke-width=".7" opacity=".25"/>${rectWin(x - 8, g - 150, 16, 148, n, win, 8)}`;
  },
  marinaBay(x, g, c, n, win) {
    return [-16, 0, 16].map((d) => `<path d="M${x + d - 5} ${g} L${x + d - 4} ${g - 76} H${x + d + 4} L${x + d + 5} ${g} Z" fill="${c}"/>${rectWin(x + d - 4, g - 72, 8, 70, n, win, 7)}`).join('')+ `<path d="M${x - 30} ${g - 80} H${x + 32} l-3 5 H${x - 28} Z" fill="${shade(c, 1.2)}"/>`;
  },
  supertrees(x, g, c, n) {
    const col = n ? '#6d4bd8' : '#7c5cff';
    return [[-16, 60], [2, 82], [18, 52]].map(([d, h]) => `<path d="M${x + d - 2} ${g} L${x + d - 1} ${g - h} H${x + d + 1} L${x + d + 2} ${g} Z" fill="${c}"/><path d="M${x + d - 12} ${g - h - 6} L${x + d + 12} ${g - h - 6} L${x + d + 2} ${g - h + 6} L${x + d - 2} ${g - h + 6} Z" fill="${col}" ${n ? 'filter="url(#d-lm-glow)"' : ''}/>`).join('');
  },
  opera(x, g, c, n) {
    const w = n ? '#c6cbe0' : '#f8f8f4';
    return `<rect x="${x - 30}" y="${g - 8}" width="62" height="8" fill="${shade(c, 0.9)}"/>${[[-24, 30], [-12, 40], [2, 36], [14, 26]].map(([d, h]) => `<path d="M${x + d} ${g - 8} Q${x + d + 4} ${g - 8 - h} ${x + d + 16} ${g - 8 - h} Q${x + d + 12} ${g - 20} ${x + d + 16} ${g - 8} Z" fill="${w}"/>`).join('')}`;
  },
  harbour(x, g, c, n) {
    const steel = n ? '#6b7499' : '#8a94b5';
    return `<path d="M${x - 34} ${g - 14} Q${x} ${g - 78} ${x + 34} ${g - 14}" stroke="${steel}" stroke-width="5" fill="none"/><rect x="${x - 44}" y="${g - 22}" width="88" height="3" fill="${steel}"/><rect x="${x - 40}" y="${g - 34}" width="7" height="34" fill="${c}"/><rect x="${x + 33}" y="${g - 34}" width="7" height="34" fill="${c}"/>`;
  },
  cnTower(x, g, c, n, win) {
    return `<path d="M${x - 5} ${g} L${x - 1.6} ${g - 150} H${x + 1.6} L${x + 5} ${g} Z" fill="${c}"/><ellipse cx="${x}" cy="${g - 116}" rx="9" ry="5.5" fill="${c}"/><rect x="${x - 8}" y="${g - 117}" width="16" height="1.6" fill="${n ? win : '#e8edf7'}"/><ellipse cx="${x}" cy="${g - 146}" rx="3.5" ry="2.4" fill="${c}"/><rect x="${x - 0.6}" y="${g - 205}" width="1.2" height="58" fill="${c}"/>`;
  },
  burjKhalifa(x, g, c, n, win) {
    return `<path d="M${x - 12} ${g} V${g - 60} H${x - 9} V${g - 115} H${x - 6} V${g - 160} H${x - 3.5} V${g - 195} H${x - 1.5} L${x} ${g - 240} L${x + 1.5} ${g - 195} H${x + 3.5} V${g - 160} H${x + 6} V${g - 115} H${x + 9} V${g - 60} H${x + 12} V${g} Z" fill="${c}"/>${rectWin(x - 9, g - 150, 18, 148, n, win, 8)}`;
  },
  burjAlArab(x, g, c, n) {
    return `<path d="M${x - 12} ${g} Q${x - 14} ${g - 60} ${x + 10} ${g - 104} L${x + 12} ${g} Z" fill="${n ? '#8c95b8' : '#f2f4fa'}"/><path d="M${x + 10} ${g - 104} V${g}" stroke="${c}" stroke-width="3"/>`;
  },
  hallgrim(x, g, c, n, win) {
    let out = `<path d="M${x - 5} ${g} V${g - 104} L${x} ${g - 124} L${x + 5} ${g - 104} V${g} Z" fill="${c}"/>`;
    [92, 76, 60, 44].forEach((h, i) => {
      out += `<rect x="${x - 11 - i * 6}" y="${g - h}" width="6" height="${h}" fill="${c}"/><rect x="${x + 5 + i * 6}" y="${g - h}" width="6" height="${h}" fill="${c}"/>`;
    });
    return out + `<circle cx="${x}" cy="${g - 96}" r="2.4" fill="${n ? win : '#e8edf7'}"/>`;
  },
  grossmunster(x, g, c, n, win) {
    return `<rect x="${x - 22}" y="${g - 30}" width="44" height="30" fill="${c}"/>${[-13, 13].map((d) => `<rect x="${x + d - 5}" y="${g - 74}" width="10" height="74" fill="${c}"/><path d="M${x + d - 5} ${g - 74} a5 6 0 0 1 10 0z" fill="${c}"/><rect x="${x + d - 0.5}" y="${g - 86}" width="1" height="8" fill="${c}"/>`).join('')}${rectWin(x - 22, g - 30, 44, 30, n, win)}`;
  },
  spires(x, g, c, n, win) {
    return [[-20, 64], [-4, 92], [14, 72]].map(([d, h]) => `<rect x="${x + d - 4}" y="${g - h + 18}" width="8" height="${h - 18}" fill="${c}"/><path d="M${x + d - 4} ${g - h + 18} L${x + d} ${g - h} L${x + d + 4} ${g - h + 18} Z" fill="${n ? '#55607f' : '#5b8c74'}"/>${rectWin(x + d - 4, g - h + 18, 8, h - 18, n, win)}`).join('');
  },
  palms(x, g, c, n) {
    const leaf = n ? '#1f4f3e' : '#2f8a55';
    return [[-14, 46], [8, 58]].map(([d, h]) => `<path d="M${x + d} ${g} q3 ${-h / 2} ${-2} ${-h}" stroke="${n ? '#4b3a2a' : '#8a6a44'}" stroke-width="3" fill="none"/><g transform="translate(${x + d - 2} ${g - h})">${[-60, -20, 20, 60, 160, 200].map((a) => `<path d="M0 0 q${(Math.cos((a * Math.PI) / 180) * 9).toFixed(1)} -6 ${(Math.cos((a * Math.PI) / 180) * 16).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * 8 + 4).toFixed(1)}" stroke="${leaf}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}</g>`).join('');
  },
  towers(x, g, c, n, win) {
    return [[-18, 12, 96], [-4, 14, 128], [12, 12, 84]].map(([d, w, h]) => `<rect x="${x + d - w / 2}" y="${g - h}" width="${w}" height="${h}" fill="${c}"/>${rectWin(x + d - w / 2, g - h, w, h, n, win)}`).join('');
  },
};

const CITY_VIEWS = {
  waw: { left: 'palace', right: 'varso' },
  ber: { left: 'fernsehturm', right: 'towers' },
  tyo: { left: 'tokyoTower', right: 'towers' },
  sfo: { left: 'goldenGate', right: 'transamerica' },
  sel: { left: 'seoulTower', right: 'lotte' },
  blr: { left: 'palms', right: 'towers' },
  sao: { left: 'towers', right: 'towers' },
  lon: { left: 'bigben', right: 'shard' },
  nyc: { left: 'empire', right: 'chrysler' },
  lag: { left: 'palms', right: 'towers' },
  syd: { left: 'opera', right: 'harbour' },
  sto: { left: 'spires', right: 'towers' },
  sin: { left: 'supertrees', right: 'marinaBay' },
  rkv: { left: 'hallgrim', right: 'towers' },
  dxb: { left: 'burjAlArab', right: 'burjKhalifa' },
  yyz: { left: 'cnTower', right: 'towers' },
  zrh: { left: 'grossmunster', right: 'towers' },
  tlv: { left: 'palms', right: 'towers' },
};

const GLOW = '<filter id="d-lm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

// Lewa budowla przy 0,09·w, prawa przy 0,91·w, obie na horyzoncie (ułamek wysokości z przepisu tła), w skali
// clamp(w / 360, 0,85, 1,25). Wypełnienie d-lm idzie w poprzek budowli: strona światła w rim, druga w cień dalekiego planu.
export function skyline(view, { w, h }, { light, phase, horizon = 0.86 } = {}) {
  const city = CITY_VIEWS[view];
  if (!city || !light) return { svg: '', anchors: [] };
  const sky = SKY[phase] || SKY.day, night = phase === 'night', y = horizon * h, k = Math.min(1.25, Math.max(0.85, w / 360));
  const sil = shade(sky.far, night ? 1.18 : 0.84), lit = light.dir[0] >= 0 ? 1 : 0;
  const anchors = [0.09, 0.91].map((f) => ({ x: f * w, y }));
  const body = [city.left, city.right].map((id, i) => `<g transform="translate(${r1(anchors[i].x)} ${r1(y)}) scale(${Math.round(k * 100) / 100})">${LANDMARKS[id](0, 0, sil, night, sky.win)}</g>`)
    .join('').replaceAll(`fill="${sil}"`, 'fill="url(#d-lm)"');
  const grad = `<linearGradient id="d-lm" x1="${lit}" y1="0" x2="${1 - lit}" y2="0"><stop offset="0" stop-color="${css(light.rim)}"/>`
    + `<stop offset=".45" stop-color="${sil}"/><stop offset="1" stop-color="${shade(sky.far, night ? 0.9 : 0.62)}"/></linearGradient>`;
  return { svg: `<defs>${grad}${body.includes('d-lm-glow') ? GLOW : ''}</defs>${body}`, anchors };
}
