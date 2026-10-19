// Diorama etapu: model ze stanu gry, dioramy zastępcze i budowa warstw SVG (statycznej i animowanej).
import { TW, iso } from './iso.js';
import { PALETTES, CREW, tierFor, budget, assemble, emblem, emblemCenter, person, pumpkin, xmasTree, stringLights, seeded } from './parts.js';
import { PLACES, island } from './island.js';
import { layout, LOT_MAX_H } from './layout.js';
import { LAYERS, LAYER_ORDER } from '../layers.js';

// Odblokowane działy w kolejności DEPTS z progiem obsady; rundy do 8.
export function modelFor(game, { view, env, light, isNew = () => false }) {
  const { D, s } = game;
  return {
    stage: D.id, view, company: s.meta.companyName, rounds: Math.min(s.prestigeCount, 8), firstHeads: s.depts[D.FIRST_DEPT] || 0,
    depts: D.DEPTS.filter((d) => s.deptUnlocked[d.id]).map(({ id, icon, color }) => ({ id, icon, color, tier: tierFor(s.depts[id] || 0), isNew: isNew(id) })),
    env, light,
  };
}

// Działy nowe od poprzedniego wywołania dla etapu (za pierwszym razem żadne); known pamięta dokładnie ids.
export function newIds(known, stage, ids) {
  const list = [...ids], prev = known.get(stage);
  known.set(stage, new Set(list));
  return new Set(prev ? list.filter((id) => !prev.has(id)) : []);
}

// Dioramy zastępcze: rdzeń 2×2 rośnie z liczbą działów, dział to pudełko z oknami i dachem w kolorze akcentu.
const coreH = (n) => 2 + Math.floor(n / 5);
export const GENERIC = Object.fromEntries(LAYER_ORDER.map((id) => {
  const H = LOT_MAX_H[id], dept = [['box', 0, 0, 0, 1, 1, H - 0.3, 'wall', 'win'], ['box', 0, 0, H - 0.3, 1, 1, 0.3, 'accent'], ['sign', 0.5, 0.5, H]];
  return [id, {
    id, placeholder: true, palette: PALETTES[id],
    coreForm: () => 'box',
    coreFoot: (n) => ({ w: 2, d: 2, h: coreH(n) }),
    core: (m) => {
      const h = coreH(m.depts.length);
      return { parts: [['box', 0, 0, 0, 2, 2, h, 'wall', 'win'], ['label', 2, 2, h - 0.7, 2, 12], ['sign', 1, 1, h]], ornaments: [] };
    },
    depts: Object.fromEntries(LAYERS[id].DEPTS.slice(1).map((d) => [d.id, dept])),
  }];
}));

export const STAGE_ART = { earth: GENERIC.earth, space: GENERIC.space, galaxy: GENERIC.galaxy, universe: GENERIC.universe };

const R = 12;    // promień emblematu (czytelny na iPhonie SE)
const PS = 0.45; // skala postaci
const depth = (r) => r.gx + r.gy + (r.w + r.d) / 2;
// j-ta z k postaci stoi na ścieżce tuż przed przednimi ścianami obrysu r.
const spot = (r, j, k) => {
  const u = 1 - (Math.floor(j / 2) + 0.5) / Math.ceil(k / 2);
  return j % 2 ? [r.gx + r.w * u, r.gy + r.d + 0.22] : [r.gx + r.w + 0.22, r.gy + r.d * u];
};

// Wyspa, budynki od tyłu (ludzie i ozdoby świąt zaraz po swoim), extras, na końcu emblematy.
export function buildDiorama(model) {
  const { stage, env, light, depts } = model, art = STAGE_ART[stage], n = depts.length, earth = stage === 'earth';
  // Działka = pozycja działu w DEPTS (0 = rdzeń): odblokowanie poza kolejnością nic nie przesuwa.
  const ids = LAYERS[stage].DEPTS.map((x) => x.id), pos = depts.map((d) => ids.indexOf(d.id));
  const lay = layout(stage, Math.max(...pos) + 1, model.rounds, art.coreFoot(n, model.rounds));
  const place = PLACES[model.view] ?? PLACES.waw, isl = island({ view: model.view, size: lay.size, light, env, seed: 1 });
  const bud = budget(), anim = [], decor = [], bb = [...isl.bbox];
  const grow = (b) => { for (let i = 0; i < 4; i++) bb[i] = (i < 2 ? Math.min : Math.max)(bb[i], b[i]); };
  const take = (list) => { for (const a of list) if (bud.take()) anim.push(a); };
  // Święta przy rdzeniu c: w grudniu lampki na krawędzi dachu (na Ziemi i choinka), w Halloween dynie u wejścia.
  const holiday = (c) => {
    const at = (u, v, z = 0) => iso(c.gx + u, c.gy + v, c.gz + z);
    if (env.holiday === 'xmas') {
      const l = stringLights([at(0, c.d, c.h), at(c.w, c.d, c.h), at(c.w, 0, c.h)]);
      take(l.blink);
      decor.push('lights', ...(earth ? ['xmasTree'] : []));
      return l.svg + (earth ? xmasTree(...at(c.w + 1.1, c.d + 1.1), 0.7) : '');
    }
    if (env.holiday !== 'halloween' || !earth) return '';
    decor.push('pumpkins');
    return pumpkin(...at(c.w + 0.45, c.d + 0.2), 0.6) + pumpkin(...at(c.w + 0.2, c.d + 0.45), 0.6);
  };
  // extras biorą budżet animacji przed postaciami.
  const ex = art.extras?.(model, lay) ?? { svg: '', anim: [], decor: [], vehicles: 0, people: 0 };
  take(ex.anim);
  const core = art.core(model);
  const items = depts.map((d, i) => { const p = pos[i]; return { d, r: p ? lay.lots[p - 1] : lay.core, parts: p ? art.depts[d.id] : core.parts, seed: p + 1 }; })
    .sort((a, b) => depth(a.r) - depth(b.r))
    .map((o) => ({ ...o, a: assemble(o.parts, { at: [o.r.gx, o.r.gy, o.r.gz], palette: art.palette, accent: o.d.color, light, lit: CREW[o.d.tier].lit, snow: env.snowCover, seed: o.seed, company: model.company, budget: bud }) }));
  let front = isl.svg, people = ex.people, lit = 0;
  items.forEach(({ d, r, a, seed }, k) => {
    front += (d.isNew ? `<g class="floor-new">${a.svg}</g>` : a.svg) + (r === lay.core ? holiday(r) : '');
    anim.push(...a.anim); grow(a.box); lit += CREW[d.tier].lit;
    // Ruch tylko bez zasłony dalszym budynkiem, inaczej postać stoi w kolejności rysowania; ziarno postaci na budynek.
    const later = items.slice(k + 1).map((o) => o.a.box), crew = CREW[d.tier].people, rnd = seeded(7 + seed);
    for (let j = 0; j < crew; j++, people++) {
      const [x, y] = iso(...spot(r, j, crew)), hid = later.some((b) => b[0] < x + 3 && b[2] > x - 3 && b[1] < y && b[3] > y - 11);
      if (!hid && bud.take()) anim.push(person(x, y, rnd, PS, (seed * 0.29 + j * 0.37) % 1.6)); else front += person(x, y, rnd, PS);
    }
  });
  front += ex.svg;
  // Emblematy na wierzchu.
  const lots = items.map(({ d, r, a }) => {
    const [x, y] = emblemCenter(a.anchor, R);
    grow([x - R - 2, y - R - 2, x + R + 2, y]);
    front += emblem(d, a.anchor, R);
    return { id: d.id, emblem: { x, y, r: R }, box: a.box, foot: (r.w + r.d) * TW / 2 };
  });
  const elements = (front.match(/<(?!\/)[a-zA-Z]/g) || []).length;
  return {
    front, frontAnim: anim.join(''), bbox: bb, lots,
    stats: { people, vehicles: ex.vehicles, lit, ornaments: core.ornaments, decor: [...decor, ...ex.decor], base: place.base, material: place.material, elements, anim: bud.used },
  };
}
