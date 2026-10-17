// Audyt drabinki produktów: ile zarabia jeden poziom każdego produktu, gdy etap jest w pełni rozwinięty
// (wszystkie technologie, biura i kolonie na 3. poziomie, przejęcia, pełne działy, kontrola nad konkurentami).
// Każdy kolejny produkt powinien zarabiać na poziom więcej od poprzedniego.
// Użycie: node tools/ladder.mjs [etap] [poziom] [--era=N]  (--era: stan po erze N zamiast pełnego drzewka)
import { Game, milestoneCount } from '../js/engine.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { COMPETITORS, MARKET, PRODUCT_GROWTH, PRODUCT_UP_TIERS } from '../js/data.js';
import { fmt } from '../js/format.js';

const T0 = 1_700_000_000_000;

// Etap w pełni rozwinięty (albo po erze maxEra) i wszystkie dostępne produkty na tym samym poziomie.
export function developed(layer, level = 300, maxEra = Infinity) {
  const g = new Game(null, { now: T0, layer });
  const D = g.D;
  for (const t of D.TECHS) if (t.era <= maxEra) g.s.techs[t.id] = true;
  for (const o of D.OFFICES) if (!o.req || g.s.techs[o.req]) g.s.offices[o.id] = 3;
  for (const d of D.DEPTS) { g.s.deptUnlocked[d.id] = true; g.s.depts[d.id] = 500; }
  for (const a of D.ACQUISITIONS) g.s.acquisitions[a.id] = true;
  if (layer === 'earth') for (const c of COMPETITORS) g.s.market.stakes[c.id] = MARKET.control;
  g.s.meta.settings.cap = false;
  for (const p of D.PRODUCTS) if (g.productUnlocked(p.id)) g.s.products[p.id] = level;
  for (const u of D.UPGRADES) if (u.kind === 'product' && (g.s.products[u.req.product] || 0) >= u.req.level) g.s.upgrades[u.id] = true;
  g.recalc();
  return g;
}

// Przychód z jednego poziomu (bez premii wspólnych dla wszystkich produktów) i mnożnik ponad bazę.
export function ladder(g) {
  return g.D.PRODUCTS.filter((p) => g.productUnlocked(p.id)).map((p) => {
    const unit = g.productUnit(p.id) / g.m.global;
    return { id: p.id, cat: p.cat, rps: p.rps, mult: unit / p.rps, unit };
  });
}

// Racjonalny gracz: z budżetu kupuje po jednym poziomie tam, gdzie przyrost przychodu na wydany $ jest
// największy (z kamieniami milowymi i ulepszeniami produktów). Zwraca poziomy i udziały w przychodzie.
export function invest(layer, budget, maxEra = Infinity) {
  const g = developed(layer, 0, maxEra);
  const prods = g.D.PRODUCTS.filter((p) => g.productUnlocked(p.id)).map((p) => ({ id: p.id, base: g.productUnit(p.id) / g.m.global, cost: p.cost, L: 0 }));
  const tier = (L) => PRODUCT_UP_TIERS.reduce((x, t) => (L >= t.at ? x * t.x : x), 1);
  const inc = (p, L) => p.base * L * Math.pow(2, milestoneCount(L)) * tier(L);
  const step = (p) => p.cost * Math.pow(PRODUCT_GROWTH, p.L) + PRODUCT_UP_TIERS.filter((t) => t.at === p.L + 1).reduce((c, t) => c + p.cost * t.cost, 0);
  let left = budget;
  for (let guard = 0; guard < 100000; guard++) {
    let best = null;
    for (const p of prods) {
      // patrzymy kilka poziomów naprzód, żeby kamień milowy za rogiem też się liczył
      let c = 0;
      let L = p.L;
      for (let k = 0; k < 25; k++) {
        c += p.cost * Math.pow(PRODUCT_GROWTH, L) + PRODUCT_UP_TIERS.filter((t) => t.at === L + 1).reduce((x, t) => x + p.cost * t.cost, 0);
        L++;
        const score = (inc(p, L) - inc(p, p.L)) / c;
        if (!best || score > best.score) best = { p, score };
      }
    }
    const c = step(best.p);
    if (c > left) break;
    left -= c;
    best.p.L++;
  }
  const total = prods.reduce((a, p) => a + inc(p, p.L), 0);
  return prods.map((p) => ({ id: p.id, L: p.L, share: inc(p, p.L) / total }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : null;
  const level = Number(process.argv[3]) || 300;
  const eraArg = process.argv.find((a) => a.startsWith('--era='));
  const maxEra = eraArg ? Number(eraArg.slice(6)) : Infinity;
  for (const id of LAYER_ORDER) {
    if (only && only !== id) continue;
    const rows = ladder(developed(id, level, maxEra));
    console.log(`\n== ${LAYERS[id].icon} ${id}${Number.isFinite(maxEra) ? ` (do ery ${maxEra})` : ''}, poziom ${level}`);
    console.log('produkt'.padEnd(12), 'kat.'.padEnd(9), 'baza/s'.padStart(9), 'mnożnik'.padStart(9), 'poziom/s'.padStart(10), ' vs poprzedni');
    rows.forEach((r, i) => {
      const prev = rows[i - 1];
      const ratio = prev ? r.unit / prev.unit : null;
      const flag = ratio !== null && ratio < 1.3 ? (ratio < 1 ? '  ✗' : '  ~') : '';
      console.log(r.id.padEnd(12), r.cat.padEnd(9), fmt(r.rps).padStart(9), fmt(r.mult).padStart(9), fmt(r.unit).padStart(10), ratio === null ? '' : `  ×${ratio.toFixed(2)}${flag}`);
    });
    // racjonalne inwestowanie przy rosnącym budżecie: poziomy i udział w przychodzie
    const top = LAYERS[id].PRODUCTS.filter((p) => developed(id, 0, maxEra).productUnlocked(p.id)).slice(-1)[0];
    for (const lv of [50, 150, 300, 500]) {
      const budget = top.cost * Math.pow(PRODUCT_GROWTH, lv) * 20;
      const res = invest(id, budget, maxEra);
      console.log(`budżet ≈ ${lv} poz. ostatniego:`, res.map((r) => `${r.id} ${r.L}${r.share >= 0.01 ? ` (${Math.round(r.share * 100)}%)` : ''}`).join(' · '));
    }
  }
}
