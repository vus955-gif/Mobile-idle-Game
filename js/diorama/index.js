// Diorama etapu: model ze stanu gry i budowa warstw SVG (statycznej i animowanej) z oprawy etapu.
import { TW, iso } from './iso.js';
import { CREW, MAX_ANIM, ER, tierFor, budget, assemble, emblem, emblemCenter, spot, person, pumpkin, xmasTree, stringLights, seeded } from './parts.js';
import { PLACES, island } from './island.js';
import { layout } from './layout.js';
import { LAYERS } from '../layers.js';
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

// Oprawa etapów.
export const STAGE_ART = { earth: EARTH_ART, space: SPACE_ART, galaxy: GALAXY_ART, universe: UNIVERSE_ART };

const PS = 0.45; // skala postaci
// Kolejność rysowania: najpierw to, co stoi niżej (działka na kadłubie po kadłubie), potem od tyłu ku przodowi.
const depth = (r) => r.gx + r.gy + (r.w + r.d) / 2;

// Wyspa, extras.back, budynki od tyłu (ludzie i ozdoby świąt zaraz po swoim), extras.svg, na końcu emblematy o promieniu ER.
// j-ta z k postaci stoi w miejscu spot(r, j, k) z parts.js (ścieżka przed przednimi ścianami, na wysokości r.gz); oprawa
// etapu może to zmienić hookiem art.spot(r, j, k) (np. gdy budynki stoją ciasno i ścieżkę zasłania sąsiad): [gx, gy]
// stawia postać na wysokości r.gz, a [gx, gy, gz] na bezwzględnej wysokości gz (r.gz pominięte). Samą postać zmienia hook
// art.figure(x, y, rnd, s, delay, suit) zamiast person (świetliste drobiny Wszechświata).
export function buildDiorama(model) {
  const { stage, env, light, depts } = model, art = STAGE_ART[stage], n = depts.length, earth = stage === 'earth';
  // Działka = pozycja działu w DEPTS (0 = rdzeń): odblokowanie poza kolejnością nic nie przesuwa.
  const ids = LAYERS[stage].DEPTS.map((x) => x.id), pos = depts.map((d) => ids.indexOf(d.id));
  const lay = layout(stage, Math.max(...pos) + 1, model.rounds, art.coreFoot(n, model.rounds));
  const place = PLACES[model.view] ?? PLACES.waw, isl = island({ view: model.view, size: lay.size, light, env, seed: 1 });
  const bud = budget(Math.min(art.maxAnim ?? MAX_ANIM, MAX_ANIM)), anim = [], decor = [], bb = [...isl.bbox]; // oprawa może mieć niższy limit
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
  const marks = items.map(({ d, a }) => { const [x, y] = emblemCenter(a.anchor, ER); return { id: d.id, x, y, r: ER }; });
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
    grow([x - ER - 2, y - ER - 2, x + ER + 2, y]);
    front += emblem(d, a.anchor, ER);
    return { id: d.id, emblem: { x, y, r: ER }, box: a.box, foot: (r.w + r.d) * TW / 2 };
  });
  const elements = (front.match(/<(?!\/)[a-zA-Z]/g) || []).length;
  return {
    front, frontAnim: anim.join(''), bbox: bb, lots,
    stats: { people, vehicles: ex.vehicles, lit, ornaments: core.ornaments, decor: [...decor, ...ex.decor], base: place.base, material: place.material, elements, anim: bud.used },
  };
}
