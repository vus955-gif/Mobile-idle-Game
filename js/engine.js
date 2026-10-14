// Silnik gry — czysta logika bez DOM. Używany przez UI i przez symulator balansu.
import {
  PRODUCTS, PRODUCT_GROWTH, MILESTONES, PRODUCT_UP_TIERS,
  DEPTS, DEPT_MILESTONES, DEPT_MILESTONE_X, DEPT_UP_TIERS, DEPT_UP_EXTRA_ICONS,
  TECHS, REPEAT_TECHS, CULTURE_UPGRADES, CLICK_UPGRADES, ACQUISITIONS, PERKS,
  BUBBLES, CONTRACT_CLIENTS, CONTRACT_TASKS, CONTRACT_DURATIONS, TREND_TEMPLATES,
  AUTOPILOT, CHALLENGES, CHALLENGE_GOALS, SCALE_LEVELS, ENERGY_W_PER_USD, DECISIONS,
} from './data.js';
import { fmt, money, num } from './format.js';
import { t, noun, getLang } from './i18n.js';
import * as TX from './text.js';

export const SAVE_VERSION = 1;
export const PRESTIGE = { div: 1e10, exp: 1 / 3, k: 10 };
export const BASE_OFFLINE_CAP = 6 * 3600;
export const BASE_OFFLINE_EFF = 0.5;
export const ACH_BONUS = 0.01;
export const INVESTOR_BONUS = 0.02;
export const MAX_SLOTS = 5;
export const BUBBLE_LIFETIME = 13000;
// Wycena: godzina gry ≈ rok życia firmy; mnożnik rynkowy rośnie z technologiami i rundami.
export const SECONDS_PER_GAME_YEAR = 3600;
export const VALUATION = { baseMultiple: 3, perTech: 0.12, perRound: 0.2, maxMultiple: 15 };

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p, i) => [p.id, { ...p, index: i }]));
export const DEPT_MAP = Object.fromEntries(DEPTS.map((d, i) => [d.id, { ...d, index: i }]));
export const TECH_MAP = Object.fromEntries(TECHS.map((t) => [t.id, t]));
export const REPEAT_MAP = Object.fromEntries(REPEAT_TECHS.map((t) => [t.id, t]));
export const ACQ_MAP = Object.fromEntries(ACQUISITIONS.map((a) => [a.id, a]));
export const PERK_MAP = Object.fromEntries(PERKS.map((p) => [p.id, p]));
export const AP_MAP = Object.fromEntries(AUTOPILOT.map((a) => [a.id, a]));
export const CHALLENGE_MAP = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

// Decyzje i historia wykresu
export const DECISION_FIRST = 8 * 60000;
export const HISTORY = { shortEvery: 5 * 60000, shortMax: 288, longEvery: 2 * 3600000, longMax: 360, roundsMax: 100 };

// Skala cywilizacji: próg rocznego przychodu dla każdego poziomu.
export const SCALE_THRESHOLDS = SCALE_LEVELS.map((L) => (L.v !== undefined ? L.v : Math.pow(10, 10 * L.k + 6) / ENERGY_W_PER_USD));
// Stopień w skali Kardaszowa (wzór Sagana) dla rocznego przychodu przeliczonego na moc.
export function kardashev(annualRevenue) {
  if (!(annualRevenue > 0)) return null;
  return (Math.log10(annualRevenue * ENERGY_W_PER_USD) - 6) / 10;
}
export function scaleIndex(annualRevenue) {
  let idx = -1;
  SCALE_THRESHOLDS.forEach((v, i) => { if (annualRevenue >= v) idx = i; });
  return idx;
}

// ---------------------------------------------------------------------------
// Lista wszystkich ulepszeń za gotówkę
// ---------------------------------------------------------------------------
export const UPGRADES = [];
for (const p of PRODUCTS) {
  PRODUCT_UP_TIERS.forEach((t, i) => {
    UPGRADES.push({
      id: `u_${p.id}_${i}`, kind: 'product', pid: p.id, tier: i, icon: p.icon, cat: p.cat,
      cost: p.cost * t.cost, fx: [{ t: 'prod', id: p.id, x: t.x }],
      req: { product: p.id, level: t.at },
    });
  });
}
for (const d of DEPTS) {
  DEPT_UP_TIERS.forEach((t, i) => {
    UPGRADES.push({
      id: `u_${d.id}_${i}`, kind: 'dept', did: d.id, tier: i, icon: d.upIcons[i] || DEPT_UP_EXTRA_ICONS[i - d.upIcons.length],
      cost: d.base * Math.pow(d.g, t.at) * t.costHires, fx: [{ t: 'dept', id: d.id, x: t.x }],
      req: { dept: d.id, heads: t.at },
    });
  });
}
for (const c of CULTURE_UPGRADES) {
  UPGRADES.push({
    id: c.id, kind: 'culture', icon: c.icon, cost: c.cost,
    fx: [{ t: 'all', x: c.x }], req: { earned: c.cost * 0.25 },
  });
}
for (const c of CLICK_UPGRADES) {
  const fx = [];
  if (c.x > 1) fx.push({ t: 'click', x: c.x });
  if (c.pct) fx.push({ t: 'clickPct', v: c.pct });
  UPGRADES.push({ id: c.id, kind: 'click', icon: c.icon, cost: c.cost, fx, req: { earned: c.cost * 0.2 } });
}
export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

// ---------------------------------------------------------------------------
// Osiągnięcia
// ---------------------------------------------------------------------------
// Nazwy i opisy osiągnięć są w i18n.js / text.js — tu tylko warunki.
export const ACHIEVEMENTS = [];
const ach = (id, icon, type, v, i, check, extra = {}) => ACHIEVEMENTS.push({ id, icon, type, v, i, check, hidden: false, ...extra });

[[1e2, '💵'], [1e4, '☕'], [1e6, '💰'], [1e9, '💰'], [1e12, '🤑'], [1e15, '🤑'], [1e18, '🏦'], [1e21, '🏦'],
  [1e24, '💎'], [1e27, '💎'], [1e30, '👑'], [1e35, '👑'], [1e40, '🌌'], [1e50, '🌌'], [1e60, '♾️']]
  .forEach(([v, icon], i) => ach(`earn${i}`, icon, 'earn', v, i, (g) => g.s.totalEarned >= v));

[10, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e35, 1e40, 1e45, 1e50]
  .forEach((v, i) => ach(`inc${i}`, '📈', 'inc', v, i, (g) => g.s.stats.maxIncome >= v));

[100, 1000, 5000, 25000, 100000].forEach((v, i) => ach(`click${i}`, '👆', 'click', v, i, (g) => g.s.stats.clicks >= v));

for (const p of PRODUCTS) {
  [1, 50, 100, 200, 300, 500, 1000].forEach((v, i) =>
    ach(`p_${p.id}_${i}`, p.icon, 'prod', v, i, (g) => (g.s.products[p.id] || 0) >= v, { pid: p.id }));
}

[10, 50, 100, 250, 500, 1000, 2500, 5000, 10000].forEach((v, i) => ach(`emp${i}`, '👥', 'emp', v, i, (g) => g.totalHeads() >= v));
[3, 6, 10, 13].forEach((v, i) => ach(`dept${i}`, '🏢', 'dept', v, i, (g) => g.deptCount() >= v));
[1, 10, 20, 35, TECHS.length].forEach((v, i) => ach(`tech${i}`, '🔬', 'tech', v, i, (g) => g.techCount() >= v));
[10, 50, 100, 150, 200, 250, 300].forEach((v, i) => ach(`upg${i}`, '⬆️', 'upg', v, i, (g) => g.upgradeCount() >= v));
[1, 3, 5, 10, 25, 50, 100].forEach((v, i) => ach(`pres${i}`, '🦄', 'pres', v, i, (g) => g.s.prestigeCount >= v));
[10, 100, 1000, 10000, 100000, 1e6, 1e8, 1e10, 1e12].forEach((v, i) => ach(`inv${i}`, '💼', 'inv', v, i, (g) => g.s.investors >= v));
[1, 10, 50, 200, 1000].forEach((v, i) => ach(`bub${i}`, '🔥', 'bub', v, i, (g) => g.s.stats.bubbles >= v));
[1, 10, 50, 200, 1000].forEach((v, i) => ach(`con${i}`, '🤝', 'con', v, i, (g) => g.s.stats.contracts >= v));
[1, 5, ACQUISITIONS.length].forEach((v, i) => ach(`acq${i}`, '🦈', 'acq', v, i, (g) => g.acqCount() >= v));
[1, 5, 10, 20, CHALLENGES.length * CHALLENGE_GOALS.length]
  .forEach((v, i) => ach(`chal${i}`, '🏅', 'chal', v, i, (g) => g.challengeTiers() >= v));
[1, 10, 50, 150].forEach((v, i) => ach(`dec${i}`, '📨', 'dec', v, i, (g) => g.s.stats.decisions >= v));
[1, AUTOPILOT.length].forEach((v, i) => ach(`ap${i}`, '🤖', 'ap', v, i, (g) => g.apCount() >= v));
SCALE_LEVELS.forEach((L, i) => ach(`scale${i}`, L.icon, 'scale', i, i, (g) => g.s.scaleMax >= i));

const fun = (id, icon, check) => ach(id, icon, 'fun', 0, 0, check, { hidden: true });
fun('f_night', '🦉', (g) => { const h = new Date(g.now).getHours(); return h >= 0 && h < 4 && g.s.stats.playTime > 60; });
fun('f_rename', '🪪', (g) => !!g.s.flags.renamed);
fun('f_frenzy', '🌪️', (g) => !!g.s.flags.frenzy);
fun('f_patience', '🧘', (g) => !!g.s.flags.patience);
fun('f_combo', '🎯', (g) => !!(g.boostActive('income') && g.boostActive('click')));
fun('f_trend', '🏄', (g) => !!g.s.flags.trendBest);
fun('f_zen', '🪷', (g) => g.s.stats.zenTime >= 120);
fun('f_music', '🎧', (g) => g.s.stats.musicTime >= 600);
fun('f_snow', '☃️', (g) => !!g.s.flags.snow);
fun('f_halloween', '🎃', (g) => !!g.s.flags.halloween);
fun('f_xmas', '🎄', (g) => !!g.s.flags.xmas);
fun('f_master', '🥋', (g) => Object.values(g.s.challenges).some((v) => v >= CHALLENGE_GOALS.length));

export const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------
export function milestoneCount(level) {
  let c = 0;
  for (const m of MILESTONES) { if (level >= m) c++; else break; }
  return c;
}
export function nextMilestone(level) {
  for (const m of MILESTONES) if (level < m) return m;
  return null;
}
export function prevMilestone(level) {
  let prev = 0;
  for (const m of MILESTONES) { if (level >= m) prev = m; else break; }
  return prev;
}
export function deptMilestoneMult(n) {
  let c = 0;
  for (const m of DEPT_MILESTONES) { if (n >= m) c++; else break; }
  return Math.pow(DEPT_MILESTONE_X, c);
}
export function nextDeptMilestone(n) {
  for (const m of DEPT_MILESTONES) if (n < m) return m;
  return null;
}

function geomSum(base, g, from, n) {
  return Math.min(Number.MAX_VALUE, base * Math.pow(g, from) * (Math.pow(g, n) - 1) / (g - 1));
}
function geomMax(base, g, from, cash) {
  const c0 = base * Math.pow(g, from);
  if (!(cash >= c0)) return 0;
  let n = Math.floor(Math.log(cash * (g - 1) / c0 + 1) / Math.log(g));
  while (n > 0 && geomSum(base, g, from, n) > cash) n--;
  return n;
}

export function createState(now = Date.now()) {
  return {
    v: SAVE_VERSION,
    companyName: t('defaultCompany'),
    cash: 0,
    rp: 0,
    runEarned: 0,
    totalEarned: 0,
    products: {},
    depts: { dev: 0 },
    deptUnlocked: { dev: true },
    upgrades: {},
    techs: {},
    techLevels: {},
    achievements: {},
    acquisitions: {},
    perks: {},
    investors: 0,
    shares: 0,
    claimedRaw: 0,
    prestigeCount: 0,
    bubble: null,
    nextBubbleAt: now + 40000,
    boosts: {},
    trend: null,
    nextTrendAt: now + 150000,
    contracts: { offers: [], active: [], nextOfferAt: 0, seq: 0 },
    autopilot: { owned: {}, off: {} },
    challenge: null,
    challenges: {},
    decision: null,
    nextDecisionAt: now + DECISION_FIRST,
    recentDecisions: [],
    pending: [],
    scaleMax: -1,
    history: { short: [], long: [], rounds: [], lastShort: 0, lastLong: 0 },
    flags: {},
    stats: {
      clicks: 0, runClicks: 0, autoClicks: 0, bubbles: 0, contracts: 0, playTime: 0, maxIncome: 0,
      hired: 0, upgradesBought: 0, rpTotal: 0, bestRun: 0, startedAt: now, runStartedAt: now,
      decisions: 0, autoBuys: 0, zenTime: 0, musicTime: 0, bestValuation: 0,
    },
    settings: { sound: false, music: false, buyAmount: 1, lang: getLang() },
    lastTick: now,
  };
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Uzupełnia brakujące pola i odrzuca niepoprawne liczby (np. ze starego zapisu).
export function sanitizeState(raw, now = Date.now()) {
  const base = createState(now);
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  for (const k of ['products', 'depts', 'deptUnlocked', 'upgrades', 'techs', 'techLevels', 'achievements', 'acquisitions', 'perks', 'boosts', 'flags']) {
    s[k] = raw[k] && typeof raw[k] === 'object' ? { ...raw[k] } : base[k];
  }
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  s.settings = { ...base.settings, ...(raw.settings || {}) };
  s.contracts = { ...base.contracts, ...(raw.contracts || {}) };
  if (!Array.isArray(s.contracts.offers)) s.contracts.offers = [];
  if (!Array.isArray(s.contracts.active)) s.contracts.active = [];
  const ap = isObj(raw.autopilot) ? raw.autopilot : {};
  s.autopilot = { owned: isObj(ap.owned) ? { ...ap.owned } : {}, off: isObj(ap.off) ? { ...ap.off } : {} };
  s.challenges = isObj(raw.challenges) ? { ...raw.challenges } : {};
  s.challenge = isObj(raw.challenge) && CHALLENGE_MAP[raw.challenge.id] ? { ...raw.challenge } : null;
  s.decision = isObj(raw.decision) && DECISIONS[raw.decision.i] ? { ...raw.decision } : null;
  s.recentDecisions = Array.isArray(raw.recentDecisions) ? raw.recentDecisions.filter((i) => Number.isInteger(i)) : [];
  s.pending = Array.isArray(raw.pending) ? raw.pending.filter((p) => isObj(p) && p.at > 0 && p.cash >= 0) : [];
  const h = isObj(raw.history) ? raw.history : {};
  const series = (a) => (Array.isArray(a) ? a.filter((r) => Array.isArray(r) && r.length >= 3) : []);
  s.history = {
    short: series(h.short), long: series(h.long), rounds: Array.isArray(h.rounds) ? h.rounds.filter((x) => x > 0) : [],
    lastShort: h.lastShort > 0 ? h.lastShort : 0, lastLong: h.lastLong > 0 ? h.lastLong : 0,
  };
  s.deptUnlocked.dev = true;
  if (!(s.depts.dev >= 0)) s.depts.dev = 0;
  const fix = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : (v === null ? Number.MAX_VALUE : d));
  for (const k of ['cash', 'rp', 'runEarned', 'totalEarned', 'investors', 'shares', 'claimedRaw', 'prestigeCount', 'lastTick', 'nextBubbleAt', 'nextTrendAt', 'nextDecisionAt', 'scaleMax']) {
    s[k] = fix(s[k], base[k]);
  }
  for (const k of Object.keys(s.stats)) s.stats[k] = fix(s.stats[k], base.stats[k] || 0);
  if (typeof s.companyName !== 'string' || !s.companyName.trim()) s.companyName = base.companyName;
  s.v = SAVE_VERSION;
  return s;
}

// ---------------------------------------------------------------------------
// Gra
// ---------------------------------------------------------------------------
export class Game {
  constructor(state, opts = {}) {
    this.now = opts.now ?? Date.now();
    this.s = state ? sanitizeState(state, this.now) : createState(this.now);
    this.rng = opts.rng || Math.random;
    this.listeners = {};
    this.prodIncome = {};
    this.income = 0;
    this.rpRate = 0;
    this.clickValue = 1;
    this.autoAcc = 0;
    this.achTimer = 0;
    this.clickTimes = [];
    this.m = null;
    this.recalc();
  }

  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); return this; }
  emit(ev, data) {
    // Autopilot kupuje po cichu: bez dźwięków, toastów i przerysowań przy każdym zakupie.
    if (this.quiet && (ev === 'buy' || ev === 'structure' || ev === 'toast')) {
      if (ev === 'structure') this.quietStructure = true;
      return;
    }
    for (const fn of this.listeners[ev] || []) fn(data);
  }
  toast(icon, title, text = '', kind = 'info') { this.emit('toast', { icon, title, text, kind }); }

  // ---------- liczniki ----------
  totalHeads() { let n = 0; for (const k in this.s.depts) n += this.s.depts[k] || 0; return n; }
  deptCount() { return Object.keys(this.s.deptUnlocked).filter((k) => this.s.deptUnlocked[k]).length; }
  techCount() { return Object.keys(this.s.techs).length; }
  upgradeCount() { return Object.keys(this.s.upgrades).length; }
  acqCount() { return Object.keys(this.s.acquisitions).length; }
  achCount() { return Object.keys(this.s.achievements).length; }
  apCount() { return AUTOPILOT.filter((a) => this.s.autopilot.owned[a.id]).length; }
  challengeTiers() { let n = 0; for (const k in this.s.challenges) n += this.s.challenges[k] || 0; return n; }
  ownedProductCount() { return PRODUCTS.filter((p) => (this.s.products[p.id] || 0) > 0).length; }
  boostActive(k) { const b = this.s.boosts[k]; return b && b.until > this.now ? b : null; }
  // Aktywna reguła wyzwania (albo null)
  rule() { const c = this.s.challenge; return c ? CHALLENGE_MAP[c.id] : null; }

  // ---------- przeliczanie modyfikatorów ----------
  recalc() {
    const s = this.s;
    const m = {
      prod: {}, cat: {}, catAdd: {}, dept: {}, all: 1, deptAll: 1,
      click: 1, clickPct: 0, clickFlat: 0, clickMultAdd: 0,
      rp: 1, rpBase: 0, incomePct: 0,
      hireCost: 1, prodCost: 1, acqCost: 1,
      offlineCap: BASE_OFFLINE_CAP, offlineEff: BASE_OFFLINE_EFF,
      eventFreq: 1, eventPower: 1, contract: 1, slots: 1, auto: 0,
      prestige: 1, investorPct: 0, startCash: 0, startLevels: 0,
      unlockProduct: {}, unlockDept: {},
    };
    const apply = (fx, times = 1) => {
      for (const e of fx) {
        const pow = e.x !== undefined ? Math.pow(e.x, times) : 1;
        const add = e.v !== undefined ? e.v * times : 0;
        switch (e.t) {
          case 'prod': m.prod[e.id] = (m.prod[e.id] || 1) * pow; break;
          case 'cat': m.cat[e.cat] = (m.cat[e.cat] || 1) * pow; break;
          case 'dept': m.dept[e.id] = (m.dept[e.id] || 1) * pow; break;
          case 'deptAll': m.deptAll *= pow; break;
          case 'all': m.all *= pow; break;
          case 'click': m.click *= pow; break;
          case 'clickPct': m.clickPct += add; break;
          case 'clickFlat': m.clickFlat += add; break;
          case 'rp': m.rp *= pow; break;
          case 'hireCost': m.hireCost *= pow; break;
          case 'prodCost': m.prodCost *= pow; break;
          case 'acqCost': m.acqCost *= pow; break;
          case 'offlineCap': m.offlineCap += add; break;
          case 'offlineEff': m.offlineEff += add; break;
          case 'eventFreq': m.eventFreq *= pow; break;
          case 'eventPower': m.eventPower *= pow; break;
          case 'contract': m.contract *= pow; break;
          case 'slots': m.slots += add; break;
          case 'auto': m.auto += add; break;
          case 'prestige': m.prestige *= pow; break;
          case 'investorPct': m.investorPct += add; break;
          case 'startCash': m.startCash += add; break;
          case 'startLevels': m.startLevels += add; break;
          case 'unlockProduct': m.unlockProduct[e.id] = true; break;
          case 'unlockDept': m.unlockDept[e.id] = true; break;
          default: break;
        }
      }
    };
    for (const id in s.techs) if (s.techs[id] && TECH_MAP[id]) apply(TECH_MAP[id].fx);
    for (const id in s.techLevels) { const l = s.techLevels[id] || 0; if (l > 0 && REPEAT_MAP[id]) apply(REPEAT_MAP[id].fx, l); }
    for (const id in s.upgrades) if (s.upgrades[id] && UPGRADE_MAP[id]) apply(UPGRADE_MAP[id].fx);
    for (const id in s.acquisitions) if (s.acquisitions[id] && ACQ_MAP[id]) apply(ACQ_MAP[id].fx);
    for (const id in s.perks) { const l = s.perks[id] || 0; if (l > 0 && PERK_MAP[id]) apply(PERK_MAP[id].fx, l); }
    for (const id in s.challenges) { const l = s.challenges[id] || 0; if (l > 0 && CHALLENGE_MAP[id]) apply(CHALLENGE_MAP[id].fx, l); }
    const ch = this.rule();

    let eventAdd = 0; let contractAdd = 0; let hireRed = 0; let prodRed = 0; let offAdd = 0; let acqRed = 0; let presAdd = 0;
    for (const d of DEPTS) {
      const n = s.depts[d.id] || 0;
      if (!n || !s.deptUnlocked[d.id]) continue;
      const k = n * deptMilestoneMult(n) * (m.dept[d.id] || 1) * m.deptAll;
      for (const e of d.per) {
        const v = e.v * k;
        switch (e.t) {
          case 'income': m.incomePct += v; break;
          case 'clickFlat': m.clickFlat += v; break;
          case 'clickMult': m.clickMultAdd += v; break;
          case 'rp': m.rpBase += v; break;
          case 'eventFreq': eventAdd += Math.min(e.cap, v); break;
          case 'contract': contractAdd += Math.min(e.cap, v); break;
          case 'slotEvery': m.slots += Math.floor(n / e.v); break;
          case 'offlineEff': offAdd += Math.min(e.cap, v); break;
          case 'hireCost': hireRed = Math.max(hireRed, Math.min(e.cap, v)); break;
          case 'prodCost': prodRed = Math.max(prodRed, Math.min(e.cap, v)); break;
          case 'offlineCap': m.offlineCap += v; break;
          case 'auto': m.auto += v; break;
          case 'cat': m.catAdd[e.cat] = (m.catAdd[e.cat] || 0) + (e.cap ? Math.min(e.cap, v) : v); break;
          case 'acqCost': acqRed = Math.max(acqRed, Math.min(e.cap, v)); break;
          case 'prestige': presAdd += Math.min(e.cap, v); break;
          default: break;
        }
      }
    }
    m.eventFreq *= 1 + eventAdd;
    m.contract *= 1 + contractAdd;
    m.hireCost *= 1 - hireRed;
    m.prodCost *= 1 - prodRed;
    m.acqCost *= 1 - acqRed;
    m.prestige *= 1 + presAdd;
    m.offlineEff = Math.min(1, m.offlineEff + offAdd);
    m.slots = Math.min(MAX_SLOTS, m.slots);

    m.achMult = 1 + ACH_BONUS * this.achCount();
    m.invMult = ch && ch.rule === 'noInvestors' ? 1 : 1 + s.investors * (INVESTOR_BONUS + m.investorPct);
    const bx = (k) => { const b = this.boostActive(k); return b ? b.x : 1; };
    // income/click — bąbelki (viral, hackathon); dIncome/dClick/dRp — wybrane decyzje
    m.boostIncome = bx('income') * bx('dIncome');
    m.boostClick = bx('click') * bx('dClick');
    m.rp *= bx('dRp');
    m.global = m.all * (1 + m.incomePct) * m.achMult * m.invMult * m.boostIncome * (ch && ch.rule === 'incomeMult' ? ch.v : 1);
    this.m = m;

    let total = 0;
    for (const p of PRODUCTS) {
      const lvl = s.products[p.id] || 0;
      const v = lvl > 0 ? this.productUnit(p.id) * lvl * Math.pow(2, milestoneCount(lvl)) : 0;
      this.prodIncome[p.id] = v;
      total += v;
    }
    this.income = Number.isFinite(total) ? total : Number.MAX_VALUE;
    if (ch && ch.rule === 'noclick') {
      m.auto = 0;
      this.clickValue = 0;
    } else {
      this.clickValue = ((1 + m.clickFlat) * m.click * (1 + m.clickMultAdd) * m.achMult * m.invMult + m.clickPct * this.income) * m.boostClick;
    }
    this.rpRate = m.rpBase * m.rp;
  }

  // Przychód z jednego poziomu produktu (bez kamieni milowych), z premiami i trendem.
  productUnit(id) {
    const p = PRODUCT_MAP[id];
    const m = this.m;
    let v = p.rps * (m.prod[id] || 1) * (m.cat[p.cat] || 1) * (1 + (m.catAdd[p.cat] || 0)) * m.global;
    const tr = this.s.trend;
    if (tr && tr.until > this.now && tr.pid === id) v *= tr.x;
    return v;
  }
  // O ile wzrośnie przychód po dokupieniu n poziomów (z kamieniami milowymi).
  productDelta(id, n = 1) {
    const l = this.s.products[id] || 0;
    const f = (x) => x * Math.pow(2, milestoneCount(x));
    return this.productUnit(id) * (f(l + n) - f(l));
  }

  earn(x) {
    if (!(x > 0)) return;
    const s = this.s;
    s.cash = Math.min(Number.MAX_VALUE, s.cash + x);
    s.runEarned = Math.min(Number.MAX_VALUE, s.runEarned + x);
    s.totalEarned = Math.min(Number.MAX_VALUE, s.totalEarned + x);
  }

  // ---------- pętla ----------
  tick(now) {
    const s = this.s;
    let dt = (now - s.lastTick) / 1000;
    if (!(dt > 0)) { s.lastTick = Math.max(s.lastTick, now); this.now = now; return; }
    if (dt > 10) return this.applyOffline(now);
    this.now = now;
    s.lastTick = now;

    let dirty = false;
    for (const k of Object.keys(s.boosts)) if (s.boosts[k].until <= now) { delete s.boosts[k]; dirty = true; }
    if (s.trend && s.trend.until <= now) { s.trend = null; dirty = true; this.emit('trend', null); }
    if (dirty) this.recalc();

    this.earn(this.income * dt);
    const rp = this.rpRate * dt;
    s.rp += rp;
    s.stats.rpTotal += rp;

    if (this.m.auto > 0) {
      this.autoAcc += this.m.auto * dt;
      const n = Math.floor(this.autoAcc);
      if (n > 0) {
        this.autoAcc -= n;
        this.earn(this.clickValue * n);
        s.stats.autoClicks += n;
        this.emit('autoclick', { n, value: this.clickValue * n });
      }
    }
    s.stats.playTime += dt;
    if (this.income > s.stats.maxIncome) s.stats.maxIncome = this.income;

    this.updateBubble(now);
    this.updateTrend(now);
    this.updateContracts(now);
    this.updateDecision(now);
    this.updatePending(now);

    this.apTimer = (this.apTimer || 0) + dt;
    if (this.apTimer >= 1) { this.apTimer = 0; this.autopilotStep(now); }

    this.achTimer += dt;
    if (this.achTimer >= 1) {
      this.achTimer = 0;
      this.updateChallenge(now);
      this.updateScale();
      this.sampleHistory(now);
      this.checkAchievements();
    }
  }

  click(now = this.now) {
    const s = this.s;
    const v = this.clickValue;
    if (!(v > 0)) return 0;
    this.earn(v);
    s.stats.clicks++;
    s.stats.runClicks++;
    this.clickTimes.push(now);
    while (this.clickTimes.length && now - this.clickTimes[0] > 1000) this.clickTimes.shift();
    if (this.clickTimes.length >= 12 && !s.flags.frenzy) s.flags.frenzy = true;
    return v;
  }

  // ---------- produkty ----------
  productUnlocked(id) {
    const p = PRODUCT_MAP[id];
    return !p.tech || !!this.s.techs[p.tech];
  }
  // Wyzwanie „Pełne skupienie” ogranicza liczbę różnych produktów.
  canOwnProduct(id) {
    const ch = this.rule();
    if (!ch || ch.rule !== 'maxProducts' || (this.s.products[id] || 0) > 0) return true;
    return this.ownedProductCount() < ch.v;
  }
  productCost(id, n = 1) {
    const p = PRODUCT_MAP[id];
    return geomSum(p.cost, PRODUCT_GROWTH, this.s.products[id] || 0, n) * this.m.prodCost;
  }
  productMax(id, budget = this.s.cash) {
    const p = PRODUCT_MAP[id];
    return geomMax(p.cost * this.m.prodCost, PRODUCT_GROWTH, this.s.products[id] || 0, budget);
  }
  resolveAmount(amount, maxFn) {
    if (amount === 'max') return Math.max(1, maxFn());
    return amount;
  }
  buyProduct(id, amount = 1) {
    if (!this.productUnlocked(id) || !this.canOwnProduct(id)) return 0;
    const n = amount === 'max' ? this.productMax(id) : amount;
    if (n <= 0) return 0;
    const cost = this.productCost(id, n);
    if (cost > this.s.cash) return 0;
    const before = this.s.products[id] || 0;
    this.s.cash -= cost;
    this.s.products[id] = before + n;
    this.recalc();
    const mc = milestoneCount(before + n) - milestoneCount(before);
    if (mc > 0) {
      const p = PRODUCT_MAP[id];
      this.toast(p.icon, t('toast.milestone', { name: TX.prodName(id) }), t('toast.milestoneText', { n: prevMilestone(before + n), x: Math.pow(2, mc) }), 'milestone');
    }
    this.emit('buy', { kind: 'product', id, n });
    if (before === 0) this.emit('structure');
    return n;
  }

  // ---------- działy ----------
  deptAvailable(id) {
    const d = DEPT_MAP[id];
    const ch = this.rule();
    if (ch && ch.rule === 'onlyDev' && id !== 'dev') return false;
    return !d.tech || !!this.s.techs[d.tech];
  }
  unlockDept(id) {
    const d = DEPT_MAP[id];
    const s = this.s;
    if (s.deptUnlocked[id] || !this.deptAvailable(id) || s.cash < d.unlock) return false;
    s.cash -= d.unlock;
    s.deptUnlocked[id] = true;
    s.depts[id] = 0;
    this.recalc();
    this.toast(d.icon, t('toast.newDept', { name: TX.deptName(id) }), t('toast.newDeptText'), 'unlock');
    this.emit('structure');
    return true;
  }
  hireCost(id, n = 1) {
    const d = DEPT_MAP[id];
    return geomSum(d.base, d.g, this.s.depts[id] || 0, n) * this.m.hireCost;
  }
  hireMax(id, budget = this.s.cash) {
    const d = DEPT_MAP[id];
    return geomMax(d.base * this.m.hireCost, d.g, this.s.depts[id] || 0, budget);
  }
  hire(id, amount = 1) {
    const s = this.s;
    if (!s.deptUnlocked[id]) return 0;
    const n = amount === 'max' ? this.hireMax(id) : amount;
    if (n <= 0) return 0;
    const cost = this.hireCost(id, n);
    if (cost > s.cash) return 0;
    const before = s.depts[id] || 0;
    s.cash -= cost;
    s.depts[id] = before + n;
    s.stats.hired += n;
    this.recalc();
    const nm = nextDeptMilestone(before);
    if (nm && before + n >= nm) {
      const d = DEPT_MAP[id];
      this.toast(d.icon, t('toast.deptMilestone', { name: TX.deptName(id), n: nm, noun: noun('peopleNom', nm) }), t('toast.deptMilestoneText', { x: num(DEPT_MILESTONE_X) }), 'milestone');
    }
    this.emit('buy', { kind: 'dept', id, n });
    return n;
  }

  // ---------- ulepszenia ----------
  upgradeVisible(u) {
    const s = this.s;
    const r = u.req;
    if (r.product) return (s.products[r.product] || 0) >= r.level;
    if (r.dept) return !!s.deptUnlocked[r.dept] && (s.depts[r.dept] || 0) >= r.heads;
    if (r.earned !== undefined) return s.runEarned >= r.earned;
    return true;
  }
  upgradesBlocked() { const ch = this.rule(); return !!ch && ch.rule === 'noUpgrades'; }
  availableUpgrades() {
    if (this.upgradesBlocked()) return [];
    return UPGRADES.filter((u) => !this.s.upgrades[u.id] && this.upgradeVisible(u)).sort((a, b) => a.cost - b.cost);
  }
  buyUpgrade(id) {
    const u = UPGRADE_MAP[id];
    const s = this.s;
    if (!u || s.upgrades[id] || this.upgradesBlocked() || !this.upgradeVisible(u) || s.cash < u.cost) return false;
    s.cash -= u.cost;
    s.upgrades[id] = true;
    s.stats.upgradesBought++;
    this.recalc();
    this.emit('buy', { kind: 'upgrade', id });
    this.emit('structure');
    return true;
  }
  buyAllUpgrades() {
    let n = 0;
    for (const u of this.availableUpgrades()) {
      if (u.cost > this.s.cash) break;
      if (this.buyUpgradeSilent(u)) n++;
    }
    if (n) { this.recalc(); this.emit('buy', { kind: 'upgrade', n }); this.emit('structure'); }
    return n;
  }
  buyUpgradeSilent(u) {
    const s = this.s;
    if (s.upgrades[u.id] || s.cash < u.cost) return false;
    s.cash -= u.cost;
    s.upgrades[u.id] = true;
    s.stats.upgradesBought++;
    return true;
  }

  // ---------- technologie ----------
  techAvailable(id) {
    const tech = TECH_MAP[id] || REPEAT_MAP[id];
    return tech.req.every((r) => this.s.techs[r]);
  }
  research(id) {
    const tech = TECH_MAP[id];
    const s = this.s;
    if (!tech || s.techs[id] || !this.techAvailable(id) || s.rp < tech.cost) return false;
    s.rp -= tech.cost;
    s.techs[id] = true;
    this.recalc();
    this.toast(tech.icon, t('toast.researched', { name: TX.techName(id) }), TX.describeFx(tech.fx), 'tech');
    this.emit('buy', { kind: 'tech', id });
    this.emit('structure');
    return true;
  }
  repeatCost(id) {
    const r = REPEAT_MAP[id];
    return r.base * Math.pow(r.g, this.s.techLevels[id] || 0);
  }
  researchRepeat(id) {
    const r = REPEAT_MAP[id];
    const s = this.s;
    if (!r || !this.techAvailable(id)) return false;
    const cost = this.repeatCost(id);
    if (s.rp < cost) return false;
    s.rp -= cost;
    s.techLevels[id] = (s.techLevels[id] || 0) + 1;
    this.recalc();
    this.emit('buy', { kind: 'tech', id });
    this.emit('structure');
    return true;
  }

  // ---------- przejęcia ----------
  acqUnlocked() { return !!this.s.deptUnlocked.legal; }
  acqCost(id) { return ACQ_MAP[id].cost * this.m.acqCost; }
  buyAcq(id) {
    const a = ACQ_MAP[id];
    const s = this.s;
    if (!a || !this.acqUnlocked() || s.acquisitions[id]) return false;
    const cost = this.acqCost(id);
    if (s.cash < cost) return false;
    s.cash -= cost;
    s.acquisitions[id] = true;
    this.recalc();
    this.toast(a.icon, t('acq.toast', { name: TX.acqName(id) }), TX.describeFx(a.fx), 'unlock');
    this.emit('buy', { kind: 'acq', id });
    this.emit('structure');
    return true;
  }

  // ---------- rada nadzorcza (perki) ----------
  perkCost(id) {
    const p = PERK_MAP[id];
    return Math.ceil(p.base * Math.pow(p.g, this.s.perks[id] || 0));
  }
  buyPerk(id) {
    const p = PERK_MAP[id];
    const s = this.s;
    const lvl = s.perks[id] || 0;
    if (!p || lvl >= p.max) return false;
    const cost = this.perkCost(id);
    if (s.shares < cost) return false;
    s.shares -= cost;
    s.perks[id] = lvl + 1;
    this.recalc();
    this.emit('buy', { kind: 'perk', id });
    this.emit('structure');
    return true;
  }

  // ---------- prestiż: runda finansowania ----------
  prestigeRaw(total = this.s.totalEarned) {
    return PRESTIGE.k * Math.pow(Math.max(0, total) / PRESTIGE.div, PRESTIGE.exp);
  }
  prestigeWhole() { return Math.max(0, Math.floor(this.prestigeRaw() - this.s.claimedRaw)); }
  prestigeGain() { return Math.floor(this.prestigeWhole() * this.m.prestige); }
  // Ile łącznie trzeba zarobić, żeby dostać kolejny punkt kapitału
  nextPrestigeAt() {
    const target = this.s.claimedRaw + this.prestigeWhole() + 1;
    return PRESTIGE.div * Math.pow(target / PRESTIGE.k, 1 / PRESTIGE.exp);
  }
  // Przychód bez chwilowych premii (viral, trend) — tylko on liczy się do wyceny.
  steadyIncome() {
    const boost = Math.max(1, this.m.boostIncome);
    let inc = this.income / boost;
    const tr = this.s.trend;
    if (tr && tr.until > this.now && this.prodIncome[tr.pid]) inc -= (this.prodIncome[tr.pid] / boost) * (1 - 1 / tr.x);
    return Math.max(0, inc);
  }
  // Majątek: gotówka + wartość odsprzedaży tego, w co firma zainwestowała w tej rundzie.
  assetValue() {
    const s = this.s;
    let v = s.cash;
    for (const p of PRODUCTS) {
      const l = s.products[p.id] || 0;
      if (l) v += geomSum(p.cost, PRODUCT_GROWTH, 0, l) * 0.5;
    }
    for (const d of DEPTS) {
      if (!s.deptUnlocked[d.id]) continue;
      v += d.unlock * 0.5;
      const n = s.depts[d.id] || 0;
      if (n) v += geomSum(d.base, d.g, 0, n) * 0.2;
    }
    for (const id in s.upgrades) if (UPGRADE_MAP[id]) v += UPGRADE_MAP[id].cost * 0.25;
    for (const id in s.acquisitions) if (ACQ_MAP[id]) v += ACQ_MAP[id].cost * 0.75;
    return Math.min(Number.MAX_VALUE, v);
  }
  valuationMultiple() {
    const V = VALUATION;
    return Math.min(V.maxMultiple, V.baseMultiple + V.perTech * this.techCount() + V.perRound * this.s.prestigeCount);
  }
  valuationParts() {
    const assets = this.assetValue();
    const annual = this.steadyIncome() * SECONDS_PER_GAME_YEAR;
    const multiple = this.valuationMultiple();
    return { assets, annual, multiple, total: Math.min(Number.MAX_VALUE, assets + annual * multiple) };
  }
  valuation() {
    return this.valuationParts().total;
  }
  doPrestige(now = this.now) {
    const whole = this.prestigeWhole();
    const gain = this.prestigeGain();
    if (gain < 1) return 0;
    const s = this.s;
    this.sampleHistory(now, true);
    s.claimedRaw += whole;
    s.investors += gain;
    s.shares += gain;
    s.prestigeCount++;
    s.stats.bestRun = Math.max(s.stats.bestRun, s.runEarned);
    s.history.rounds.push(now);
    if (s.history.rounds.length > HISTORY.roundsMax) s.history.rounds.splice(0, s.history.rounds.length - HISTORY.roundsMax);
    this.resetRun(now);
    this.emit('prestige', { gain });
    this.emit('structure');
    return gain;
  }
  resetRun(now = this.now) {
    const s = this.s;
    s.products = {};
    s.depts = { dev: 0 };
    s.deptUnlocked = { dev: true };
    s.upgrades = {};
    s.acquisitions = {};
    s.boosts = {};
    s.bubble = null;
    s.trend = null;
    s.contracts = { offers: [], active: [], nextOfferAt: 0, seq: s.contracts.seq || 0 };
    s.challenge = null;
    s.runEarned = 0;
    s.stats.runClicks = 0;
    s.stats.runStartedAt = now;
    s.nextBubbleAt = now + 30000;
    s.nextTrendAt = now + 120000;
    this.recalc();
    s.cash = this.m.startCash > 0 ? Math.pow(1000, this.m.startCash) : 0;
    if (this.m.startLevels > 0) {
      const lvls = this.m.startLevels;
      const count = 2 + Math.round(lvls / 10);
      PRODUCTS.filter((p) => this.productUnlocked(p.id)).slice(0, count).forEach((p) => { s.products[p.id] = lvls; });
    }
    this.recalc();
  }

  // ---------- bąbelki (wydarzenia do kliknięcia) ----------
  bubbleDelay() { return (110 + this.rng() * 170) * 1000 / this.m.eventFreq; }
  updateBubble(now) {
    const s = this.s;
    if (s.bubble) {
      if (s.bubble.until <= now) { s.bubble = null; this.emit('bubble', null); }
      return;
    }
    if (!s.nextBubbleAt) s.nextBubbleAt = now + this.bubbleDelay();
    if (now >= s.nextBubbleAt && this.income > 0) {
      const types = Object.entries(BUBBLES).filter(([k]) => k !== 'eureka' || this.rpRate > 0);
      const total = types.reduce((a, [, b]) => a + b.w, 0);
      let r = this.rng() * total;
      let type = types[0][0];
      for (const [k, b] of types) { r -= b.w; if (r <= 0) { type = k; break; } }
      s.bubble = { type, until: now + BUBBLE_LIFETIME, x: 0.15 + this.rng() * 0.7, y: 0.15 + this.rng() * 0.5 };
      s.nextBubbleAt = now + BUBBLE_LIFETIME + this.bubbleDelay();
      this.emit('bubble', s.bubble);
    }
  }
  popBubble(now = this.now) {
    const s = this.s;
    const b = s.bubble;
    if (!b) return null;
    s.bubble = null;
    s.stats.bubbles++;
    const pw = this.m.eventPower;
    let res;
    switch (b.type) {
      case 'viral': {
        const dur = 30 * pw;
        s.boosts.income = { x: 7, until: now + dur * 1000, dur };
        res = { icon: '🔥', title: TX.bubbleName('viral'), text: t('bubble.viralText', { n: Math.round(dur) }) };
        break;
      }
      case 'angel': {
        const v = (this.income * 300 + this.clickValue * 30) * pw;
        this.earn(v);
        res = { icon: '💰', title: TX.bubbleName('angel'), text: t('bubble.angelText', { v: money(v) }) };
        break;
      }
      case 'hackathon': {
        const dur = 20 * pw;
        s.boosts.click = { x: 15, until: now + dur * 1000, dur };
        res = { icon: '⚡', title: TX.bubbleName('hackathon'), text: t('bubble.hackText', { n: Math.round(dur) }) };
        break;
      }
      default: {
        const v = Math.max(25, this.rpRate * 300 * pw);
        s.rp += v;
        s.stats.rpTotal += v;
        res = { icon: '💡', title: TX.bubbleName('eureka'), text: t('bubble.eurekaText', { v: fmt(v) }) };
      }
    }
    this.recalc();
    this.emit('bubble', null);
    this.toast(res.icon, res.title, res.text, 'event');
    this.checkAchievements();
    return res;
  }

  // ---------- trendy rynkowe ----------
  updateTrend(now) {
    const s = this.s;
    if (s.trend) return;
    if (!s.nextTrendAt) s.nextTrendAt = now + 150000;
    if (now < s.nextTrendAt) return;
    const owned = PRODUCTS.filter((p) => (s.products[p.id] || 0) > 0);
    const dur = (120 + this.rng() * 120) * 1000;
    if (owned.length) {
      const p = owned[Math.floor(this.rng() * owned.length)];
      const x = [1.5, 2, 2, 3][Math.floor(this.rng() * 4)];
      const tpl = Math.floor(this.rng() * TREND_TEMPLATES.length);
      s.trend = { pid: p.id, x, until: now + dur, tpl };
      // czy to najlepszy produkt?
      let best = null; let bestV = -1;
      for (const q of owned) if (this.prodIncome[q.id] > bestV) { bestV = this.prodIncome[q.id]; best = q.id; }
      if (best === p.id) s.flags.trendBest = true;
      this.recalc();
      this.emit('trend', s.trend);
    }
    s.nextTrendAt = now + dur + (200 + this.rng() * 200) * 1000;
  }

  // ---------- kontrakty ----------
  contractsUnlocked() { return !!this.s.deptUnlocked.sales; }
  makeOffer(now) {
    const c = this.s.contracts;
    const ci = Math.floor(this.rng() * CONTRACT_CLIENTS.length);
    const icon = CONTRACT_CLIENTS[ci][1];
    const ti = Math.floor(this.rng() * CONTRACT_TASKS.length);
    // krótsze kontrakty są częstsze
    const r = this.rng();
    const idx = Math.min(CONTRACT_DURATIONS.length - 1, Math.floor(r * r * CONTRACT_DURATIONS.length));
    const d = CONTRACT_DURATIONS[idx];
    return { id: ++c.seq, ci, ti, icon, dur: d.s, f: d.f * (0.9 + this.rng() * 0.3), expires: now + 6 * 60000, rp: this.rng() < 0.4 };
  }
  contractReward(o) {
    return {
      cash: Math.max(this.income, 1) * o.dur * o.f * this.m.contract,
      rp: o.rp && this.rpRate > 0 ? this.rpRate * o.dur * 0.5 : 0,
    };
  }
  acceptContract(id, now = this.now) {
    const c = this.s.contracts;
    if (c.active.length >= this.m.slots) return false;
    const i = c.offers.findIndex((o) => o.id === id);
    if (i < 0) return false;
    const o = c.offers[i];
    c.offers.splice(i, 1);
    const rew = this.contractReward(o);
    c.active.push({ ...o, start: now, end: now + o.dur * 1000, reward: rew.cash, rpReward: rew.rp });
    this.emit('contracts');
    return true;
  }
  declineContract(id) {
    const c = this.s.contracts;
    c.offers = c.offers.filter((o) => o.id !== id);
    this.emit('contracts');
  }
  updateContracts(now) {
    if (!this.contractsUnlocked()) return 0;
    const c = this.s.contracts;
    let changed = false;
    const before = c.offers.length;
    c.offers = c.offers.filter((o) => o.expires > now);
    if (c.offers.length !== before) changed = true;
    let done = 0;
    c.active = c.active.filter((a) => {
      if (a.end > now) return true;
      this.earn(a.reward);
      this.s.rp += a.rpReward || 0;
      this.s.stats.contracts++;
      done++;
      this.toast(a.icon, t('con.done'), `${TX.clientName(a)}: +${money(a.reward)}${a.rpReward ? t('con.doneRp', { v: fmt(a.rpReward) }) : ''}`, 'contract');
      return false;
    });
    if (done) changed = true;
    if (!c.nextOfferAt) c.nextOfferAt = now + 15000;
    if (now >= c.nextOfferAt) {
      if (c.offers.length < 3) {
        c.offers.push(this.makeOffer(now));
        changed = true;
        this.emit('contractOffer');
      }
      c.nextOfferAt = now + (45 + this.rng() * 75) * 1000;
    }
    if (changed) this.emit('contracts');
    return done;
  }

  // ---------- osiągnięcia ----------
  checkAchievements() {
    const s = this.s;
    let got = 0;
    for (const a of ACHIEVEMENTS) {
      if (s.achievements[a.id]) continue;
      if (a.check(this)) {
        s.achievements[a.id] = true;
        got++;
        this.emit('achievement', a);
      }
    }
    if (got) this.recalc();
    return got;
  }

  // ---------- offline ----------
  applyOffline(now) {
    const s = this.s;
    const elapsed = (now - s.lastTick) / 1000;
    this.now = now;
    if (!(elapsed > 0)) { s.lastTick = Math.max(s.lastTick, now); return null; }
    // Premie nie liczą się offline. Bąbelki przepadają, a decyzje, których czas jeszcze trwa, wracają po przerwie.
    const kept = {};
    for (const k of ['dIncome', 'dClick', 'dRp']) if (s.boosts[k] && s.boosts[k].until > now) kept[k] = s.boosts[k];
    s.boosts = {};
    s.bubble = null;
    if (s.trend && s.trend.until <= now) s.trend = null;
    this.recalc();
    const counted = Math.min(elapsed, this.m.offlineCap);
    const eff = this.m.offlineEff;
    const cash = (this.income + this.m.auto * this.clickValue) * counted * eff;
    const rp = this.rpRate * counted * eff;
    this.earn(cash);
    s.rp += rp;
    s.stats.rpTotal += rp;
    const contracts = this.updateContracts(now);
    const pending = this.updatePending(now);
    if (elapsed >= 8 * 3600) s.flags.patience = true;
    s.lastTick = now;
    s.boosts = kept;
    s.nextBubbleAt = now + 20000 + this.rng() * 30000;
    if (s.nextTrendAt < now) s.nextTrendAt = now + 60000;
    // Po dłuższej przerwie decyzja czeka chwilę po powrocie, a nie od razu.
    if (!s.decision && s.nextDecisionAt < now + 3 * 60000) s.nextDecisionAt = now + 3 * 60000;
    this.recalc();
    this.checkAchievements();
    this.sampleHistory(now, true);
    const res = { elapsed, counted, cash, rp, eff, cap: this.m.offlineCap, contracts, pending };
    this.emit('offline', res);
    this.autopilotStep(now);
    return res;
  }

  // ---------- autopilot ----------
  apOwned(id) { return !!this.s.autopilot.owned[id]; }
  apOn(id) { return this.apOwned(id) && !this.s.autopilot.off[id]; }
  apUnlocked() { return this.s.prestigeCount > 0; }
  buyAutopilot(id) {
    const a = AP_MAP[id];
    const s = this.s;
    if (!a || this.apOwned(id) || !this.apUnlocked() || s.shares < a.cost) return false;
    s.shares -= a.cost;
    s.autopilot.owned[id] = true;
    delete s.autopilot.off[id];
    this.emit('buy', { kind: 'perk', id });
    this.emit('structure');
    return true;
  }
  toggleAutopilot(id) {
    if (!this.apOwned(id)) return false;
    const off = this.s.autopilot.off;
    if (off[id]) delete off[id]; else off[id] = true;
    return !off[id];
  }
  // Jeden krok autopilota (co sekundę). Zwraca liczbę wykonanych zakupów.
  autopilotStep(now = this.now) {
    const s = this.s;
    if (!this.apCount()) return 0;
    let n = 0;
    const researched = [];
    this.quiet = true;
    this.quietStructure = false;
    try {
      if (this.apOn('research')) {
        for (let guard = 0; guard < 5; guard++) {
          const avail = TECHS.filter((x) => !s.techs[x.id] && this.techAvailable(x.id)).sort((a, b) => a.cost - b.cost);
          if (avail.length) {
            if (s.rp >= avail[0].cost && this.research(avail[0].id)) { n++; researched.push(avail[0].id); continue; }
            break;
          }
          const reps = REPEAT_TECHS.filter((r) => this.techAvailable(r.id)).sort((a, b) => this.repeatCost(a.id) - this.repeatCost(b.id));
          if (reps.length && s.rp >= this.repeatCost(reps[0].id) && this.researchRepeat(reps[0].id)) { n++; continue; }
          break;
        }
      }
      if (this.apOn('upgrades')) {
        let k = 0;
        for (const u of this.availableUpgrades()) {
          if (u.cost > s.cash) break;
          if (this.buyUpgradeSilent(u)) k++;
        }
        if (k) { n += k; this.recalc(); this.quietStructure = true; }
      }
      if (this.apOn('hire')) {
        for (const d of DEPTS) {
          if (!s.deptUnlocked[d.id] && this.deptAvailable(d.id) && s.cash >= d.unlock * 2 && this.unlockDept(d.id)) n++;
        }
        const budget = s.cash * 0.12;
        for (const d of DEPTS) {
          if (!s.deptUnlocked[d.id]) continue;
          const share = d.id === 'rnd' || d.id === 'data' ? 0.3 : 0.07;
          const k = this.hireMax(d.id, budget * share);
          if (k > 0 && this.hire(d.id, k)) n++;
        }
      }
      if (this.apOn('products')) {
        for (let guard = 0; guard < 25; guard++) {
          let best = null;
          for (const p of PRODUCTS) {
            if (!this.productUnlocked(p.id) || !this.canOwnProduct(p.id)) continue;
            const d = this.productDelta(p.id);
            if (!(d > 0)) continue;
            const cost = this.productCost(p.id, 1);
            const score = cost / d;
            if (!best || score < best.score) best = { id: p.id, score, cost };
          }
          if (!best || best.cost > s.cash) break;
          const lvl = s.products[best.id] || 0;
          const next = nextMilestone(lvl);
          const want = next ? next - lvl : 25;
          const k = Math.max(1, Math.min(want, this.productMax(best.id, s.cash * 0.6)));
          if (this.buyProduct(best.id, k)) n++; else break;
        }
      }
      if (this.apOn('contracts') && this.contractsUnlocked()) {
        const c = s.contracts;
        while (c.active.length < this.m.slots && c.offers.length) {
          const best = c.offers.reduce((a, o) => (this.contractReward(o).cash > this.contractReward(a).cash ? o : a));
          if (!this.acceptContract(best.id, now)) break;
          n++;
        }
      }
    } finally {
      this.quiet = false;
    }
    // Bąbelek łapiemy „po ludzku”: z toastem, ale dopiero po chwili, żeby było go widać.
    if (this.apOn('bubbles') && s.bubble && now - (s.bubble.until - BUBBLE_LIFETIME) >= 1500) {
      if (this.popBubble(now)) n++;
    }
    if (n) {
      this.recalc();
      s.stats.autoBuys += n;
      this.emit('autopilot', { n, researched });
      if (this.quietStructure) this.emit('structure');
    }
    return n;
  }

  // ---------- wyzwania inwestorów ----------
  challengesUnlocked() { return this.s.prestigeCount > 0; }
  challengeGoal(id) {
    const tier = this.s.challenges[id] || 0;
    return tier < CHALLENGE_GOALS.length ? CHALLENGE_GOALS[tier] : null;
  }
  // Rozpoczęcie wyzwania zaczyna firmę od nowa (z kapitałem z rundy, jeśli jest).
  startChallenge(id, now = this.now) {
    const s = this.s;
    if (!CHALLENGE_MAP[id] || !this.challengesUnlocked() || this.challengeGoal(id) === null) return false;
    if (this.prestigeGain() >= 1) this.doPrestige(now);
    else this.resetRun(now);
    s.challenge = { id, tier: s.challenges[id] || 0, start: now };
    this.recalc();
    this.emit('challenge', { id, started: true });
    this.emit('structure');
    return true;
  }
  abandonChallenge() {
    if (!this.s.challenge) return false;
    this.s.challenge = null;
    this.recalc();
    this.emit('challenge', { abandoned: true });
    this.emit('structure');
    return true;
  }
  updateChallenge(now = this.now) {
    const s = this.s;
    const c = s.challenge;
    if (!c) return false;
    const goal = CHALLENGE_GOALS[c.tier];
    if (goal === undefined) { s.challenge = null; this.recalc(); return false; }
    if (s.runEarned < goal) return false;
    s.challenges[c.id] = Math.max(s.challenges[c.id] || 0, c.tier + 1);
    s.challenge = null;
    this.recalc();
    const ch = CHALLENGE_MAP[c.id];
    this.toast(ch.icon, t('chal.done', { name: TX.challengeName(c.id), n: c.tier + 1 }), TX.describeFx(ch.fx), 'achievement');
    this.emit('challenge', { id: c.id, done: true, tier: c.tier + 1, at: now });
    this.emit('structure');
    return true;
  }

  // ---------- skala cywilizacji ----------
  annualRevenue() { return this.steadyIncome() * SECONDS_PER_GAME_YEAR; }
  updateScale() {
    const s = this.s;
    const idx = scaleIndex(this.annualRevenue());
    if (idx <= s.scaleMax) return false;
    s.scaleMax = idx;
    this.emit('scale', idx);
    return true;
  }

  // ---------- decyzje ----------
  updateDecision(now) {
    const s = this.s;
    if (s.decision) return;
    if (!s.nextDecisionAt) s.nextDecisionAt = now + DECISION_FIRST;
    if (now < s.nextDecisionAt || !(this.income > 0)) return;
    const recent = s.recentDecisions || [];
    const pool = DECISIONS.map((d, i) => i).filter((i) => !recent.includes(i));
    const i = pool[Math.floor(this.rng() * pool.length)];
    s.decision = { i, at: now };
    s.recentDecisions = [...recent, i].slice(-8);
    s.nextDecisionAt = now + (15 + this.rng() * 15) * 60000;
    this.emit('decision', s.decision);
  }
  // Efekt decyzji po uwzględnieniu stanu gry (np. bez działu badań punkty zamieniają się w gotówkę).
  decisionEffect(fx) {
    const noRp = !(this.rpRate > 0);
    let f = fx;
    if (fx.t === 'rp' && noRp) f = { t: 'cash', min: fx.min };
    if (fx.t === 'rpBoost' && noRp) f = { t: 'boost', x: 1.5, s: fx.s };
    const inc = Math.max(this.steadyIncome(), this.clickValue, 1);
    switch (f.t) {
      case 'cash': case 'delayed': return { ...f, cash: inc * f.min * 60 };
      case 'rp': return { ...f, rp: this.rpRate * f.min * 60 };
      default: return { ...f };
    }
  }
  chooseDecision(which, now = this.now) {
    const s = this.s;
    if (!s.decision || (which !== 'a' && which !== 'b')) return null;
    const d = DECISIONS[s.decision.i];
    const e = this.decisionEffect(d[which].fx);
    switch (e.t) {
      case 'cash': this.earn(e.cash); break;
      case 'rp': s.rp += e.rp; s.stats.rpTotal += e.rp; break;
      case 'delayed': s.pending.push({ at: now + e.s * 1000, cash: e.cash, icon: d.icon, di: s.decision.i }); break;
      case 'boost': s.boosts.dIncome = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      case 'click': s.boosts.dClick = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      case 'rpBoost': s.boosts.dRp = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      default: break;
    }
    s.decision = null;
    s.stats.decisions++;
    this.recalc();
    this.emit('decided', { d, which, e });
    this.checkAchievements();
    return e;
  }
  // Odroczone nagrody (np. grant, artykuł o kocie) wypłacane, gdy nadejdzie ich czas.
  updatePending(now) {
    const s = this.s;
    if (!s.pending.length) return 0;
    let paid = 0;
    s.pending = s.pending.filter((p) => {
      if (p.at > now) return true;
      this.earn(p.cash);
      paid++;
      const d = DECISIONS[p.di];
      this.toast(p.icon || '📨', t('dec.paid'), `${d ? TX.decisionTitle(p.di) : ''}: +${money(p.cash)}`, 'contract');
      return false;
    });
    return paid;
  }

  // ---------- historia (wykres) ----------
  sampleHistory(now = this.now, force = false) {
    const s = this.s;
    const h = s.history;
    const val = this.valuation();
    if (val > s.stats.bestValuation) s.stats.bestValuation = val;
    const row = () => [now, +this.steadyIncome().toPrecision(4), +val.toPrecision(4)];
    if (force || now - h.lastShort >= HISTORY.shortEvery) {
      h.short.push(row());
      h.lastShort = now;
      if (h.short.length > HISTORY.shortMax) h.short.splice(0, h.short.length - HISTORY.shortMax);
    }
    if (now - h.lastLong >= HISTORY.longEvery) {
      h.long.push(row());
      h.lastLong = now;
      if (h.long.length > HISTORY.longMax) h.long.splice(0, h.long.length - HISTORY.longMax);
    }
  }

  // ---------- opisy efektów (dla UI) ----------
  describeFx(fx) {
    return TX.describeFx(fx);
  }

  serialize() {
    return JSON.stringify(this.s);
  }
}
