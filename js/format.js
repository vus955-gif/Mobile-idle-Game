// Formatowanie liczb i czasu zależne od języka.
// PL: przecinek dziesiętny i skróty tys./mln/mld/… (skala długa), EN: kropka i K/M/B/T (skala krótka).
import { getLang, t } from './i18n.js';

const SUFFIXES = {
  pl: ['', 'tys.', 'mln', 'mld', 'bln', 'bld', 'tln', 'tld', 'kwl', 'kwd', 'knl', 'knd',
    'sxl', 'sxd', 'spl', 'spd', 'okl', 'okd', 'nnl', 'nnd', 'dcl', 'dcd'],
  en: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
    'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'],
};

function trimZeros(str) {
  return str.includes('.') ? str.replace(/\.?0+$/, '') : str;
}

// Kropka albo przecinek dziesiętny, zależnie od języka.
export function decimal(str) {
  return getLang() === 'en' ? str : str.replace('.', ',');
}

// Liczba z maks. 2 miejscami po przecinku, np. mnożnik ×1,5 / ×1.5
export function num(x) {
  return decimal(trimZeros(Number(x).toFixed(2)));
}

function sci(n) {
  const e = Math.floor(Math.log10(n));
  return decimal(trimZeros((n / Math.pow(10, e)).toFixed(2))) + 'e' + e;
}

export function fmt(n) {
  if (n === Infinity) return '∞';
  if (!Number.isFinite(n)) return '0';
  const neg = n < 0;
  n = Math.abs(n);
  const lang = getLang();
  const suffixes = SUFFIXES[lang];
  let out;
  if (n < 1000) {
    if (n === 0) out = '0';
    else if (n < 10) out = decimal(trimZeros(n.toFixed(n < 1 ? 2 : 1)));
    else if (n < 100 && n % 1 !== 0) out = decimal(trimZeros(n.toFixed(1)));
    else out = String(Math.floor(n));
  } else {
    let tier = Math.floor(Math.log10(n) / 3);
    let v = n / Math.pow(1000, tier);
    if (v >= 999.5) { v /= 1000; tier++; }
    if (tier >= suffixes.length) out = sci(n);
    else {
      const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
      out = decimal(trimZeros(v.toFixed(digits))) + (lang === 'en' ? '' : ' ') + suffixes[tier];
    }
  }
  return (neg ? '-' : '') + out;
}

export function money(n) {
  return '$' + fmt(n);
}

export function fmtInt(n) {
  if (n < 1e6) return Math.floor(n).toLocaleString(getLang() === 'en' ? 'en-US' : 'pl-PL');
  return fmt(n);
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const sp = getLang() === 'en' ? '' : ' ';
  const u = (v, k) => `${v}${sp}${t(`time.${k}`)}`;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${u(d, 'd')} ${u(h, 'h')}`;
  if (h > 0) return `${u(h, 'h')} ${u(m, 'm')}`;
  if (m > 0) return `${u(m, 'm')} ${s < 10 ? '0' : ''}${u(s, 's')}`;
  return u(s, 's');
}

export function fmtClock(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x) => (x < 10 ? '0' : '') + x;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function fmtPct(x) {
  // x = 0.25 -> "+25%"
  const v = x * 100;
  const body = v >= 1000 ? fmt(v) : Math.abs(v) < 10 && Math.round(v * 10) % 10 !== 0 ? decimal(v.toFixed(1)) : String(Math.round(v));
  return (v >= 0 ? '+' : '') + body + '%';
}
