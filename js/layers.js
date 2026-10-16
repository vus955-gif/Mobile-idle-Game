// Warstwy gry: Ziemia, Kosmos, Galaktyka, Wszechświat. Każda ma własne produkty, działy,
// drzewko technologii, ulepszenia, ekspansję, zasięg rynku i rundy. Wspólne dla wszystkich są
// osiągnięcia, zarząd, autopilot, udziały i rada nadzorcza (patrz Company w engine.js).
// Plik nie dotyka DOM — korzystają z niego gra, testy i symulator.
import * as E from './data.js';

const byId = (arr) => Object.fromEntries(arr.map((x, i) => [x.id, { ...x, index: i }]));
const plainById = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));

// Ulepszenia za gotówkę: tiery produktów i działów + kultura firmy + kodowanie.
function buildUpgrades(def) {
  const out = [];
  for (const p of def.products) {
    E.PRODUCT_UP_TIERS.forEach((t, i) => {
      out.push({
        id: `u_${p.id}_${i}`, kind: 'product', pid: p.id, tier: i, icon: p.icon, cat: p.cat,
        cost: p.cost * t.cost, fx: [{ t: 'prod', id: p.id, x: t.x }],
        req: { product: p.id, level: t.at },
      });
    });
  }
  for (const d of def.depts) {
    E.DEPT_UP_TIERS.forEach((t, i) => {
      out.push({
        id: `u_${d.id}_${i}`, kind: 'dept', did: d.id, tier: i, icon: d.upIcons[i] || E.DEPT_UP_EXTRA_ICONS[i - d.upIcons.length],
        cost: d.base * Math.pow(d.g, t.at) * t.costHires, fx: [{ t: 'dept', id: d.id, x: t.x }],
        req: { dept: d.id, heads: t.at },
      });
    });
  }
  for (const c of def.culture) {
    out.push({ id: c.id, kind: 'culture', icon: c.icon, cost: c.cost, fx: [{ t: 'all', x: c.x }], req: { earned: c.cost * 0.25 } });
  }
  for (const c of def.click) {
    const fx = [];
    if (c.x > 1) fx.push({ t: 'click', x: c.x });
    if (c.pct) fx.push({ t: 'clickPct', v: c.pct });
    out.push({ id: c.id, kind: 'click', icon: c.icon, cost: c.cost, fx, req: { earned: c.cost * 0.2 } });
  }
  return out;
}

// Osiągnięcia Ziemi (i całej firmy: zarząd, autopilot, skala, zabawne). Warunki dostają instancję
// warstwy `g`; wartości dla całej firmy (zarobki, przychód) czyta g.co, jeśli jest.
function earthAchievements(D) {
  const list = [];
  const ach = (id, icon, type, v, i, check, extra = {}) => list.push({ id, icon, type, v, i, check, hidden: false, ...extra });
  const earned = (g) => (g.co ? g.co.totalEarned() : g.s.totalEarned);
  const maxInc = (g) => (g.co ? g.co.maxIncome() : g.s.stats.maxIncome);
  [[1e2, '💵'], [1e4, '☕'], [1e6, '💰'], [1e9, '💰'], [1e12, '🤑'], [1e15, '🤑'], [1e18, '🏦'], [1e21, '🏦'],
    [1e24, '💎'], [1e27, '💎'], [1e30, '👑'], [1e35, '👑'], [1e40, '🌌'], [1e50, '🌌'], [1e60, '♾️']]
    .forEach(([v, icon], i) => ach(`earn${i}`, icon, 'earn', v, i, (g) => earned(g) >= v));
  [10, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e35, 1e40, 1e45, 1e50]
    .forEach((v, i) => ach(`inc${i}`, '📈', 'inc', v, i, (g) => maxInc(g) >= v));
  [100, 1000, 5000, 25000, 100000].forEach((v, i) => ach(`click${i}`, '👆', 'click', v, i, (g) => g.s.stats.clicks >= v));
  for (const p of D.PRODUCTS) {
    [1, 50, 100, 200, 300, 500, 1000].forEach((v, i) =>
      ach(`p_${p.id}_${i}`, p.icon, 'prod', v, i, (g) => (g.s.products[p.id] || 0) >= v, { pid: p.id }));
  }
  [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000].forEach((v, i) => ach(`emp${i}`, '👥', 'emp', v, i, (g) => g.totalHeads() >= v));
  [3, 6, 10, 13].forEach((v, i) => ach(`dept${i}`, '🏢', 'dept', v, i, (g) => g.deptCount() >= v));
  [1, 10, 20, 35, D.TECHS.length].forEach((v, i) => ach(`tech${i}`, '🔬', 'tech', v, i, (g) => g.techCount() >= v));
  [10, 50, 100, 150, 200, 250, 300].forEach((v, i) => ach(`upg${i}`, '⬆️', 'upg', v, i, (g) => g.upgradeCount() >= v));
  [1, 3, 5, 10, 25, 50, 100].forEach((v, i) => ach(`pres${i}`, '🦄', 'pres', v, i, (g) => g.s.prestigeCount >= v));
  [10, 100, 1000, 10000, 100000, 1e6, 1e8, 1e10, 1e12].forEach((v, i) => ach(`inv${i}`, '💼', 'inv', v, i, (g) => g.s.investors >= v));
  [1, 10, 50, 200, 1000].forEach((v, i) => ach(`bub${i}`, '🔥', 'bub', v, i, (g) => g.s.stats.bubbles >= v));
  [1, 10, 50, 200, 1000].forEach((v, i) => ach(`con${i}`, '🤝', 'con', v, i, (g) => g.s.stats.contracts >= v));
  [1, 5, D.ACQUISITIONS.length].forEach((v, i) => ach(`acq${i}`, '🦈', 'acq', v, i, (g) => g.acqCount() >= v));
  [1, 5, 10, 20, E.CHALLENGES.length * E.CHALLENGE_GOALS.length]
    .forEach((v, i) => ach(`chal${i}`, '🏅', 'chal', v, i, (g) => g.challengeTiers() >= v));
  [1, 10, 50, 150].forEach((v, i) => ach(`dec${i}`, '📨', 'dec', v, i, (g) => g.s.stats.decisions >= v));
  [1, E.AUTOPILOT.length].forEach((v, i) => ach(`ap${i}`, '🤖', 'ap', v, i, (g) => g.apCount() >= v));
  E.SCALE_LEVELS.forEach((L, i) => ach(`scale${i}`, L.icon, 'scale', i, i, (g) => g.s.meta.scaleMax >= i));
  const earthOffices = D.OFFICES.filter((o) => o.kind === 'earth' && !o.hq).length;
  const spaceOffices = D.OFFICES.filter((o) => o.kind === 'space').length;
  [1, 5, 10, earthOffices].forEach((v, i) => ach(`off${i}`, '🌍', 'off', v, i, (g) => g.officeCount('earth') >= v));
  if (spaceOffices) [1, 3, spaceOffices].forEach((v, i) => ach(`spc${i}`, '🚀', 'spc', v, i, (g) => g.officeCount('space') >= v));
  [1, 3, E.COMPETITORS.length].forEach((v, i) => ach(`ctl${i}`, '🦁', 'ctl', v, i, (g) => g.controlCount() >= v));
  [1, E.ROLES.length].forEach((v, i) => ach(`exec${i}`, '👔', 'exec', v, i, (g) => Object.keys(g.s.meta.board).length >= v));
  ach('exec2', '🌟', 'exec', 0, 2, (g) => !!g.s.meta.flags.legendHired);
  ach('exec3', '🎖️', 'exec', 0, 3, (g) => Object.values(g.s.meta.board).some((e) => g.execLevel(e) >= E.BOARD.maxLevel));
  ach('mkt0', '📈', 'mkt', 0, 0, (g) => g.marketUnlocked() && Object.keys(g.s.market.stakes).length > 0);
  ach('mkt1', '🥇', 'mkt', 1, 1, (g) => g.marketUnlocked() && g.marketRank() === 1);

  const fun = (id, icon, check) => ach(id, icon, 'fun', 0, 0, check, { hidden: true });
  const flags = (g) => g.s.meta.flags;
  fun('f_night', '🦉', (g) => { const h = new Date(g.now).getHours(); return h >= 0 && h < 4 && g.s.stats.playTime > 60; });
  fun('f_rename', '🪪', (g) => !!flags(g).renamed);
  fun('f_frenzy', '🌪️', (g) => !!flags(g).frenzy);
  fun('f_patience', '🧘', (g) => !!flags(g).patience);
  fun('f_combo', '🎯', (g) => !!(g.boostActive('income') && g.boostActive('click')));
  fun('f_trend', '🏄', (g) => !!flags(g).trendBest);
  fun('f_zen', '🪷', (g) => g.s.meta.stats.zenTime >= 120);
  fun('f_music', '🎧', (g) => g.s.meta.stats.musicTime >= 600);
  fun('f_snow', '☃️', (g) => !!flags(g).snow);
  fun('f_halloween', '🎃', (g) => !!flags(g).halloween);
  fun('f_xmas', '🎄', (g) => !!flags(g).xmas);
  fun('f_master', '🥋', (g) => Object.values(g.s.meta.challenges).some((v) => v >= E.CHALLENGE_GOALS.length));
  fun('f_hq', '🏰', (g) => (g.s.offices[D.HQ] || 0) >= E.OFFICE_MAX_LEVEL);
  fun('f_view', '🪟', (g) => !!flags(g).viewChanged);
  return list;
}

// Składa definicję warstwy w gotowy zestaw danych dla silnika (mapy, ulepszenia, osiągnięcia).
export function buildLayer(def) {
  const D = {
    id: def.id,
    icon: def.icon,
    PRODUCTS: def.products,
    PRODUCT_MAP: byId(def.products),
    DEPTS: def.depts,
    DEPT_MAP: byId(def.depts),
    TECHS: def.techs,
    TECH_MAP: plainById(def.techs),
    ERAS: def.eras,
    REPEAT_TECHS: def.repeat,
    REPEAT_MAP: plainById(def.repeat),
    CULTURE_UPGRADES: def.culture,
    CLICK_UPGRADES: def.click,
    ACQUISITIONS: def.acquisitions,
    ACQ_MAP: plainById(def.acquisitions),
    OFFICES: def.offices,
    OFFICE_MAP: plainById(def.offices),
    OFFICE_LEVEL_COST: def.officeLevelCost,
    HQ: def.hq,
    MARKET_REACH: def.reach,
    TECH_CAP_STEP: def.techCapStep,
    RD_BUDGET: def.rd,
    PRESTIGE: def.prestige,
    FIRST_DEPT: def.firstDept,
    RD_DEPT: def.rdDept,
    RESEARCH_DEPTS: def.researchDepts,
    SALES_DEPT: def.salesDept,
    LEGAL_DEPT: def.legalDept,
    FEATURES: def.features || {},
  };
  D.UPGRADES = buildUpgrades(def);
  D.UPGRADE_MAP = plainById(D.UPGRADES);
  D.ACHIEVEMENTS = def.achievements(D);
  D.ACH_MAP = plainById(D.ACHIEVEMENTS);
  return D;
}

export const EARTH = buildLayer({
  id: 'earth',
  icon: '🌍',
  products: E.PRODUCTS,
  depts: E.DEPTS,
  techs: E.TECHS,
  eras: E.ERAS,
  repeat: E.REPEAT_TECHS,
  culture: E.CULTURE_UPGRADES,
  click: E.CLICK_UPGRADES,
  acquisitions: E.ACQUISITIONS,
  offices: E.OFFICES,
  officeLevelCost: E.OFFICE_LEVEL_COST,
  hq: 'waw',
  reach: E.MARKET_REACH,
  techCapStep: E.TECH_CAP_STEP,
  rd: E.RD_BUDGET,
  prestige: { div: 1e10, exp: 1 / 3, k: 10, bonus: 0.02 },
  firstDept: 'dev',
  rdDept: 'rnd',
  researchDepts: ['rnd', 'data'],
  salesDept: 'sales',
  legalDept: 'legal',
  features: { market: true, challenges: true },
  achievements: earthAchievements,
});

export const LAYERS = { earth: EARTH };
export const LAYER_ORDER = ['earth'];
