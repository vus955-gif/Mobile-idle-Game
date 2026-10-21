// Diorama etapu: model ze stanu gry, dioramy zastępcze i budowa warstw SVG (statycznej i animowanej).
import { TW, iso } from './iso.js';
import { PALETTES, CREW, tierFor, budget, assemble, emblem, emblemCenter, person, pumpkin, xmasTree, stringLights, seeded } from './parts.js';
import { PLACES, island } from './island.js';
import { layout, LOT_MAX_H } from './layout.js';
import { LAYERS, LAYER_ORDER } from '../layers.js';
import { EARTH_ART } from './earth.js';
import { SPACE_ART } from './space.js';
import { GALAXY_ART } from './galaxy.js';
import { UNIVERSE_ART } from './universe.js';

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

// Oprawa etapów.
export const STAGE_ART = { earth: EARTH_ART, space: SPACE_ART, galaxy: GALAXY_ART, universe: UNIVERSE_ART };

const R = 12;    // promień emblematu (czytelny na iPhonie SE)
const PS = 0.45; // skala postaci
// Kolejność rysowania: najpierw to, co stoi niżej (działka na kadłubie po kadłubie), potem od tyłu ku przodowi.
const depth = (r) => r.gx + r.gy + (r.w + r.d) / 2;
// j-ta z k postaci stoi na ścieżce tuż przed przednimi ścianami obrysu r (na jego wysokości gz); oprawa etapu może to
// zmienić hookiem art.spot(r, j, k) → [gx, gy] albo [gx, gy, gz] (np. gdy budynki stoją ciasno i ścieżkę zasłania sąsiad),
// a samą postać hookiem art.figure(x, y, rnd, s, delay, suit) zamiast person (świetliste drobiny Wszechświata).
const spot = (r, j, k) => {
  const u = 1 - (Math.floor(j / 2) + 0.5) / Math.ceil(k / 2);
  return j % 2 ? [r.gx + r.w * u, r.gy + r.d + 0.22] : [r.gx + r.w + 0.22, r.gy + r.d * u];
};

// Wyspa, extras.back, budynki od tyłu (ludzie i ozdoby świąt zaraz po swoim), extras.svg, na końcu emblematy.
export function buildDiorama(model) {
  const { stage, env, light, depts } = model, art = STAGE_ART[stage], n = depts.length, earth = stage === 'earth';
  // Działka = pozycja działu w DEPTS (0 = rdzeń): odblokowanie poza kolejnością nic nie przesuwa.
  const ids = LAYERS[stage].DEPTS.map((x) => x.id), pos = depts.map((d) => ids.indexOf(d.id));
  const lay = layout(stage, Math.max(...pos) + 1, model.rounds, art.coreFoot(n, model.rounds));
  const place = PLACES[model.view] ?? PLACES.waw, isl = island({ view: model.view, size: lay.size, light, env, seed: 1 });
  const bud = budget(art.maxAnim), anim = [], decor = [], bb = [...isl.bbox]; // oprawa może mieć niższy limit animacji
  const grow = (b) => { for (let i = 0; i < 4; i++) bb[i] = (i < 2 ? Math.min : Math.max)(bb[i], b[i]); };
  const take = (list) => { for (const a of list) if (bud.take()) anim.push(a); };
  const core = art.core(model, lay);
  // Święta przy rdzeniu c: w grudniu lampki na łamanych core.lights (punkty względem obrysu; domyślnie przednia krawędź
  // dachu), na Ziemi i choinka; w Halloween dynie u wejścia.
  const holiday = (c) => {
    const at = (u, v, z = 0) => iso(c.gx + u, c.gy + v, c.gz + z);
    if (env.holiday === 'xmas') {
      const ls = (core.lights ?? [[[0, c.d, c.h], [c.w, c.d, c.h], [c.w, 0, c.h]]]).map((line) => stringLights(line.map((p) => at(...p))));
      ls.forEach((l) => take(l.blink));
      decor.push('lights', ...(earth ? ['xmasTree'] : []));
      return ls.map((l) => l.svg).join('') + (earth ? xmasTree(...at(c.w + 1.1, c.d + 1.1), 0.7) : '');
    }
    if (env.holiday !== 'halloween' || !earth) return '';
    decor.push('pumpkins');
    return pumpkin(...at(c.w + 0.45, c.d + 0.2), 0.6) + pumpkin(...at(c.w + 0.2, c.d + 0.45), 0.6);
  };
  const items = depts.map((d, i) => { const p = pos[i]; return { d, r: p ? lay.lots[p - 1] : lay.core, parts: p ? art.depts[d.id] : core.parts, seed: p + 1 }; })
    .sort((a, b) => a.r.gz - b.r.gz || depth(a.r) - depth(b.r))
    .map((o) => ({ ...o, a: assemble(o.parts, { at: [o.r.gx, o.r.gy, o.r.gz], palette: art.palette, accent: o.d.color, light, lit: CREW[o.d.tier].lit, snow: env.snowCover, seed: o.seed, company: model.company, budget: bud }) }));
  // Koła emblematów są znane przed extras, bo warstwa animacji (pojazdy) leży nad nimi.
  const marks = items.map(({ d, a }) => { const [x, y] = emblemCenter(a.anchor, R); return { id: d.id, x, y, r: R }; });
  // extras: back pod budynkami, svg nad nimi, anim z budżetu przed postaciami, box powiększa kadr.
  const ex = { back: '', svg: '', anim: [], decor: [], vehicles: 0, people: 0, ...art.extras?.(model, lay, marks) };
  take(ex.anim);
  if (ex.box) grow(ex.box);
  let front = isl.svg + ex.back, people = ex.people, lit = 0;
  // W Halloween na Ziemi dynia przy drzwiach (przed lewą ścianą) najwyżej 6 działów najbliżej widza (budżet elementów).
  const doors = earth && env.holiday === 'halloween' ? new Set(items.filter((o) => o.r !== lay.core).slice(-6)) : null;
  items.forEach((o, k) => {
    const { d, r, a, seed } = o;
    front += (d.isNew ? `<g class="floor-new">${a.svg}</g>` : a.svg)
      + (r === lay.core ? holiday(r) : doors?.has(o) ? pumpkin(...iso(r.gx + 0.22, r.gy + r.d + 0.14), 0.5) : '');
    anim.push(...a.anim); grow(a.box); lit += CREW[d.tier].lit;
    // Ruch tylko bez zasłony dalszym budynkiem, inaczej postać stoi w kolejności rysowania; ziarno postaci na budynek
    // (mieszane, bo sąsiednie ziarna dają w seeded te same pierwsze losowania); core.people zastępuje CREW w rdzeniu (garaż).
    const later = items.slice(k + 1).map((o) => o.a.box), crew = (r === lay.core ? core.people : null) ?? CREW[d.tier].people;
    const h = Math.imul(seed, 2654435761), rnd = seeded(h ^ (h >>> 15)), fig = art.figure ?? person;
    for (let j = 0; j < crew; j++, people++) {
      const [x, y] = iso(...(art.spot ?? spot)(r, j, crew), r.gz), hid = later.some((b) => b[0] < x + 3 && b[2] > x - 3 && b[1] < y && b[3] > y - 11);
      if (!hid && bud.take()) anim.push(fig(x, y, rnd, PS, (seed * 0.29 + j * 0.37) % 1.6, art.suit)); else front += fig(x, y, rnd, PS, undefined, art.suit);
    }
  });
  front += ex.svg;
  // Emblematy na wierzchu.
  const lots = items.map(({ d, r, a }, i) => {
    const { x, y } = marks[i];
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
