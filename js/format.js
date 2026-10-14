// Formatowanie liczb po polsku: przecinek dziesiętny i skróty tys./mln/mld/…
const SUFFIXES = ['', 'tys.', 'mln', 'mld', 'bln', 'bld', 'tln', 'tld', 'kwl', 'kwd', 'knl', 'knd',
  'sxl', 'sxd', 'spl', 'spd', 'okl', 'okd', 'nnl', 'nnd', 'dcl', 'dcd'];

function trimZeros(str) {
  return str.includes('.') ? str.replace(/\.?0+$/, '') : str;
}

function decimal(str) {
  return str.replace('.', ',');
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
    if (tier >= SUFFIXES.length) out = sci(n);
    else {
      const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
      out = decimal(trimZeros(v.toFixed(digits))) + ' ' + SUFFIXES[tier];
    }
  }
  return (neg ? '-' : '') + out;
}

export function money(n) {
  return '$' + fmt(n);
}

export function fmtInt(n) {
  if (n < 1e6) return Math.floor(n).toLocaleString('pl-PL');
  return fmt(n);
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s < 10 ? '0' : ''}${s} s`;
  return `${s} s`;
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

// Polska odmiana: 1 technologia, 2 technologie, 5 technologii
export function plural(n, one, few, many) {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}
