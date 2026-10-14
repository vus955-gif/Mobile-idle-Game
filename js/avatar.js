// Awatary członków zarządu generowane z ziarna: kolor skóry, fryzura, okulary, kolczyki.
// Ta sama osoba zawsze wygląda tak samo.
const SKIN = ['#f5d0b5', '#ecbf9c', '#d9a07a', '#b97b55', '#8d5a3b', '#6b4029'];
const HAIR = ['#2b1d16', '#5a3825', '#a0522d', '#d9a441', '#1b1b1b', '#c0c0c0', '#8b4a2b', '#e8d5b0'];
const RARITY_BG = [['#2b2f5c', '#3d4380'], ['#1e3a8a', '#7c3aed'], ['#f59e0b', '#db2777']];

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function avatar(seed, shirt = '#6c8cff', rarity = 0, size = 56) {
  const r = rng(seed);
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hair = HAIR[Math.floor(r() * HAIR.length)];
  const style = Math.floor(r() * 7);
  const glasses = r() < 0.3;
  const earrings = r() < 0.25;
  const beard = style <= 1 && r() < 0.3;
  const smile = r() < 0.7;
  const [bg1, bg2] = RARITY_BG[rarity] || RARITY_BG[0];
  const id = `av${seed % 100000}`;
  let back = '';
  let front = '';
  switch (style) {
    case 0: front = `<path d="M17 25 q1 -12 15 -12 q14 0 15 12 q-3 -6 -15 -6 q-12 0 -15 6z" fill="${hair}"/>`; break; // krótkie
    case 1: front = `<path d="M16 27 q0 -15 16 -15 q16 0 16 15 l-3 -2 q-2 -7 -13 -7 q-9 0 -13 9z" fill="${hair}"/>`; break; // grzywka
    case 2: back = `<path d="M15 26 q-1 -14 17 -14 q18 0 17 14 v16 q-4 3 -6 0 v-14 h-22 v14 q-2 3 -6 0z" fill="${hair}"/>`;
      front = `<path d="M17 24 q2 -10 15 -10 q13 0 15 10 q-6 -4 -15 -4 q-9 0 -15 4z" fill="${hair}"/>`; break; // długie
    case 3: back = `<circle cx="32" cy="10" r="6" fill="${hair}"/>`;
      front = `<path d="M17 24 q2 -11 15 -11 q13 0 15 11 q-6 -5 -15 -5 q-9 0 -15 5z" fill="${hair}"/>`; break; // kok
    case 4: front = [[20, 18], [26, 14], [32, 13], [38, 14], [44, 18], [17, 24], [47, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${hair}"/>`).join(''); break; // loki
    case 5: back = `<path d="M15 28 q-1 -16 17 -16 q18 0 17 16 v6 h-4 v-8 h-26 v8 h-4z" fill="${hair}"/>`;
      front = `<path d="M18 22 q3 -9 14 -9 q11 0 14 9 q-7 -3 -14 -3 q-7 0 -14 3z" fill="${hair}"/>`; break; // bob
    default: front = `<path d="M19 21 q2 -6 13 -6 q11 0 13 6 q-6 -2 -13 -2 q-7 0 -13 2z" fill="${hair}" opacity=".55"/>`; // krótko ostrzyżone
  }
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <clipPath id="${id}c"><circle cx="32" cy="32" r="30"/></clipPath></defs>
    <circle cx="32" cy="32" r="31" fill="url(#${id})"/>
    <g clip-path="url(#${id}c)">
      ${back}
      <path d="M10 64 q2 -16 22 -16 q20 0 22 16z" fill="${shirt}"/>
      <path d="M26 48 l6 7 l6 -7z" fill="#fff" opacity=".85"/>
      <rect x="28" y="38" width="8" height="10" rx="3" fill="${skin}"/>
      <ellipse cx="32" cy="29" rx="13" ry="14.5" fill="${skin}"/>
      ${earrings ? `<circle cx="19" cy="34" r="1.6" fill="#ffd166"/><circle cx="45" cy="34" r="1.6" fill="#ffd166"/>` : ''}
      ${beard ? `<path d="M20 31 q0 13 12 13 q12 0 12 -13 q-3 6 -12 6 q-9 0 -12 -6z" fill="${hair}"/>` : ''}
      <circle cx="27" cy="29" r="1.7" fill="#1f2937"/><circle cx="37" cy="29" r="1.7" fill="#1f2937"/>
      ${glasses ? `<g fill="none" stroke="#1f2937" stroke-width="1.3"><circle cx="27" cy="29" r="4.2"/><circle cx="37" cy="29" r="4.2"/><path d="M31.2 29 h1.6"/></g>` : ''}
      <path d="${smile ? 'M27.5 35 q4.5 4 9 0' : 'M28 36 h8'}" stroke="#7a3b2e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      ${front}
    </g>
    ${rarity === 2 ? '<circle cx="32" cy="32" r="30.5" fill="none" stroke="#ffe08a" stroke-width="1.5"/>' : ''}
  </svg>`;
}

// Pusty fotel: szara sylwetka zamiast twarzy.
export function emptyAvatar(size = 56) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="#23264a" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 3"/>
    <circle cx="32" cy="26" r="10" fill="#3b3f63"/><path d="M14 54 q2 -15 18 -15 q16 0 18 15z" fill="#3b3f63"/>
  </svg>`;
}
