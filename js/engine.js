// Silnik gry — czysta logika bez DOM. Używany przez UI i przez symulator balansu.
import {
  PRODUCT_GROWTH, MILESTONES, DEPT_MILESTONES, DEPT_MILESTONE_X, PERKS,
  BUBBLES, CONTRACT_DURATIONS, TREND_TEMPLATES,
  AUTOPILOT, CHALLENGES, CHALLENGE_GOALS, CHALLENGE_FACTORS, SCALE_LEVELS, ENERGY_W_PER_USD, DECISIONS,
  OFFICE_MAX_LEVEL, MARKET, COMPETITORS, BOARD, ROLES, QUIRKS, EXEC_NAMES, TECH_CAP_STEP,
} from './data.js';
import { fmt, money, num } from './format.js';
import { EARTH, LAYERS, LAYER_ORDER } from './layers.js';
import { t, noun, getLang } from './i18n.js';
import * as TX from './text.js';

export const SAVE_VERSION = 3;
export const BASE_OFFLINE_CAP = 6 * 3600;
export const BASE_OFFLINE_EFF = 0.5;
export const ACH_BONUS = 0.01;
export const MAX_SLOTS = 5;
export const BUBBLE_LIFETIME = 13000;
// Wycena: godzina gry ≈ rok życia firmy; mnożnik rynkowy rośnie z technologiami i rundami.
export const SECONDS_PER_GAME_YEAR = 3600;
// Część przychodu warstwy przekazywana kolejnej (Ziemia → Kosmos) i grant na start nowej warstwy.
export const FEED_SHARES = [0, 0.1, 0.25, 0.5];
export const LAYER_GRANT_SECONDS = 600;
export const VALUATION = { baseMultiple: 3, perTech: 0.12, perRound: 0.2, maxMultiple: 15 };

// Dane Ziemi (domyślnej warstwy) — dla zgodności z UI, testami i symulatorem.
export const PRODUCT_MAP = EARTH.PRODUCT_MAP;
export const DEPT_MAP = EARTH.DEPT_MAP;
export const TECH_MAP = EARTH.TECH_MAP;
export const REPEAT_MAP = EARTH.REPEAT_MAP;
export const ACQ_MAP = EARTH.ACQ_MAP;
export const OFFICE_MAP = EARTH.OFFICE_MAP;
export const UPGRADES = EARTH.UPGRADES;
export const UPGRADE_MAP = EARTH.UPGRADE_MAP;
export const ACHIEVEMENTS = EARTH.ACHIEVEMENTS;
export const ACH_MAP = EARTH.ACH_MAP;
export const PRESTIGE = EARTH.PRESTIGE;
export const INVESTOR_BONUS = EARTH.PRESTIGE.bonus;
export const PERK_MAP = Object.fromEntries(PERKS.map((p) => [p.id, p]));
export const AP_MAP = Object.fromEntries(AUTOPILOT.map((a) => [a.id, a]));
export const CHALLENGE_MAP = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
export const COMP_MAP = Object.fromEntries(COMPETITORS.map((c) => [c.id, c]));
export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]));
export const QUIRK_MAP = Object.fromEntries(QUIRKS.map((q) => [q.id, q]));
// Siła cechy po uwzględnieniu poziomu i dziwactwa (mnożniki rosną, obniżki kosztów też się pogłębiają).
export function scaleTrait(tr, k) {
  if (tr.x !== undefined) return { ...tr, x: tr.x >= 1 ? 1 + (tr.x - 1) * k : Math.max(0.05, 1 - (1 - tr.x) * k) };
  if (tr.v !== undefined) return { ...tr, v: tr.v * k };
  return tr;
}

// Decyzje i historia wykresu
export const DECISION_FIRST = 15 * 60000;
export const HISTORY = { shortEvery: 5 * 60000, shortMax: 288, longEvery: 2 * 3600000, longMax: 360, roundsMax: 100 };

// Zasięg rynku: każda technologia dokłada krok swojej ery (log10 $/s) — liczony w data.js.
export { TECH_CAP_STEP };
// Przychód po nasyceniu rynku: do zasięgu bez zmian, ponad nim rośnie z potęgą `soft`.
export function capIncome(raw, cap, reach = EARTH.MARKET_REACH) {
  if (!(raw > cap) || !(cap > 0)) return raw;
  return cap * Math.min(reach.maxOver, Math.pow(raw / cap, reach.soft));
}

// Skala cywilizacji: próg rocznego przychodu dla każdego poziomu.
export const SCALE_THRESHOLDS = SCALE_LEVELS.map((L) => (L.v !== undefined ? L.v : Math.pow(10, 10 * L.k + 6) / ENERGY_W_PER_USD));
// Stopień w skali Kardaszowa (wzór Sagana) dla rocznego przychodu przeliczonego na moc.
export function kardashev(annualRevenue) {
  if (!(annualRevenue > 0)) return null;
  return (Math.log10(annualRevenue * ENERGY_W_PER_USD) - 6) / 10;
}
// has(techId) — czy firma ma technologię; stopnie Kardaszowa bez niej są nieosiągalne.
export function scaleIndex(annualRevenue, has = () => true) {
  let idx = -1;
  for (let i = 0; i < SCALE_LEVELS.length; i++) {
    if (SCALE_LEVELS[i].tech && !has(SCALE_LEVELS[i].tech)) break;
    if (annualRevenue >= SCALE_THRESHOLDS[i]) idx = i;
  }
  return idx;
}

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

// Wspólne dla całej firmy (wszystkich warstw): nazwa, ustawienia, osiągnięcia, udziały i rada
// nadzorcza, autopilot, zarząd, nagrody z wyzwań, decyzje, skala cywilizacji.
export function createMeta(now = Date.now()) {
  return {
    companyName: t('defaultCompany'),
    achievements: {},
    perks: {},
    shares: 0,
    rounds: 0,
    autopilot: { owned: {}, off: {} },
    board: {},
    candidates: [],
    nextCandidateAt: 0,
    execSeq: 0,
    challenges: {},
    decision: null,
    nextDecisionAt: now + DECISION_FIRST,
    recentDecisions: [],
    scaleMax: -1,
    flags: {},
    unlocked: { earth: true },
    stats: { zenTime: 0, musicTime: 0 },
    settings: { sound: false, music: false, buyAmount: 1, lang: getLang(), layer: 'earth' },
  };
}

// Stan jednej warstwy (Ziemia, Kosmos…): bieżąca runda, technologie, biura, statystyki.
export function createState(now = Date.now(), meta = createMeta(now), D = EARTH) {
  return {
    v: SAVE_VERSION,
    layer: D.id,
    meta,
    cash: 0,
    rp: 0,
    runEarned: 0,
    totalEarned: 0,
    products: {},
    depts: { [D.FIRST_DEPT]: 0 },
    deptUnlocked: { [D.FIRST_DEPT]: true },
    upgrades: {},
    techs: {},
    techLevels: {},
    acquisitions: {},
    investors: 0,
    claimedRaw: 0,
    prestigeCount: 0,
    bubble: null,
    nextBubbleAt: now + 40000,
    boosts: {},
    trend: null,
    nextTrendAt: now + 150000,
    contracts: { offers: [], active: [], nextOfferAt: 0, seq: 0 },
    offices: { [D.HQ]: 1 },
    market: { comps: {}, stakes: {}, lastTick: 0 },
    challenge: null,
    pending: [],
    history: { short: [], long: [], rounds: [], lastShort: 0, lastLong: 0 },
    stats: {
      clicks: 0, runClicks: 0, autoClicks: 0, bubbles: 0, contracts: 0, playTime: 0, maxIncome: 0,
      hired: 0, upgradesBought: 0, rpTotal: 0, bestRun: 0, startedAt: now, runStartedAt: now,
      decisions: 0, autoBuys: 0, bestValuation: 0, bestCore: 0,
    },
    view: D.HQ,
    rdBudget: 0,
    feed: 0,
    lastTick: now,
  };
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const fix = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : (v === null ? Number.MAX_VALUE : d));

// Część wspólna zapisu. `raw` to meta z zapisu v3 albo płaski zapis v1/v2 (wtedy pola leżą na wierzchu).
export function sanitizeMeta(raw, now = Date.now()) {
  const base = createMeta(now);
  if (!isObj(raw)) return base;
  const m = { ...base };
  for (const k of ['achievements', 'perks', 'flags', 'challenges']) m[k] = isObj(raw[k]) ? { ...raw[k] } : base[k];
  m.unlocked = { ...(isObj(raw.unlocked) ? raw.unlocked : {}), earth: true };
  const st = isObj(raw.stats) ? raw.stats : {};
  m.stats = {};
  for (const k of Object.keys(base.stats)) m.stats[k] = fix(st[k], 0);
  m.settings = { ...base.settings, ...(isObj(raw.settings) ? raw.settings : {}) };
  delete m.settings.view;
  delete m.settings.rdBudget;
  if (!LAYERS[m.settings.layer] || !m.unlocked[m.settings.layer]) m.settings.layer = 'earth';
  const ap = isObj(raw.autopilot) ? raw.autopilot : {};
  m.autopilot = { owned: isObj(ap.owned) ? { ...ap.owned } : {}, off: isObj(ap.off) ? { ...ap.off } : {} };
  const validExec = (e) => isObj(e) && ROLE_MAP[e.role] && Array.isArray(e.traits) && BOARD.rarity[e.r] && e.n >= 0;
  m.board = {};
  if (isObj(raw.board)) for (const [role, e] of Object.entries(raw.board)) if (ROLE_MAP[role] && validExec(e)) m.board[role] = { ...e, role };
  m.candidates = Array.isArray(raw.candidates) ? raw.candidates.filter(validExec).slice(0, BOARD.poolMax) : [];
  m.execSeq = raw.execSeq > 0 ? raw.execSeq : 0;
  m.nextCandidateAt = raw.nextCandidateAt > 0 ? raw.nextCandidateAt : 0;
  m.decision = isObj(raw.decision) && DECISIONS[raw.decision.i] ? { ...raw.decision } : null;
  m.recentDecisions = Array.isArray(raw.recentDecisions) ? raw.recentDecisions.filter((i) => Number.isInteger(i)) : [];
  for (const k of ['shares', 'nextDecisionAt', 'scaleMax']) m[k] = fix(raw[k], base[k]);
  // łączna liczba rund we wszystkich warstwach (zapis płaski: rundy Ziemi)
  m.rounds = fix(raw.rounds ?? raw.prestigeCount, 0);
  if (typeof raw.companyName === 'string' && raw.companyName.trim()) m.companyName = raw.companyName;
  return m;
}

// Uzupełnia brakujące pola i odrzuca niepoprawne liczby (np. ze starego zapisu). Przyjmuje stan
// warstwy z polem `meta` (v3) albo płaski zapis v1/v2; `meta` z opcji to wspólny obiekt firmy.
export function sanitizeState(raw, now = Date.now(), D = EARTH, meta = null) {
  if (!raw || typeof raw !== 'object') return createState(now, meta || createMeta(now), D);
  const flat = !isObj(raw.meta);
  const base = createState(now, meta || sanitizeMeta(flat ? raw : raw.meta, now), D);
  const s = { ...base, ...raw, meta: base.meta, layer: D.id };
  for (const k of ['companyName', 'settings', 'flags', 'achievements', 'autopilot', 'board', 'candidates', 'execSeq',
    'nextCandidateAt', 'perks', 'shares', 'decision', 'nextDecisionAt', 'recentDecisions', 'scaleMax', 'challenges', 'rounds', 'unlocked']) delete s[k];
  for (const k of ['products', 'depts', 'deptUnlocked', 'upgrades', 'techs', 'techLevels', 'acquisitions', 'boosts']) {
    s[k] = isObj(raw[k]) ? { ...raw[k] } : base[k];
  }
  s.stats = { ...base.stats, ...(isObj(raw.stats) ? raw.stats : {}) };
  delete s.stats.zenTime;
  delete s.stats.musicTime;
  s.contracts = { ...base.contracts, ...(isObj(raw.contracts) ? raw.contracts : {}) };
  if (!Array.isArray(s.contracts.offers)) s.contracts.offers = [];
  if (!Array.isArray(s.contracts.active)) s.contracts.active = [];
  s.offices = { [D.HQ]: 1 };
  if (isObj(raw.offices)) {
    for (const [id, l] of Object.entries(raw.offices)) if (D.OFFICE_MAP[id] && l > 0) s.offices[id] = Math.min(OFFICE_MAX_LEVEL, Math.floor(l));
  }
  const view = flat && isObj(raw.settings) ? raw.settings.view : raw.view;
  s.view = D.OFFICE_MAP[view] && s.offices[view] ? view : D.HQ;
  const rd = flat && isObj(raw.settings) ? raw.settings.rdBudget : raw.rdBudget;
  s.rdBudget = D.RD_BUDGET.shares.includes(rd) ? rd : 0;
  s.feed = FEED_SHARES.includes(raw.feed) ? raw.feed : 0;
  const mk = isObj(raw.market) ? raw.market : {};
  s.market = { comps: {}, stakes: {}, lastTick: mk.lastTick > 0 ? mk.lastTick : 0 };
  for (const c of COMPETITORS) {
    const rc = isObj(mk.comps) && isObj(mk.comps[c.id]) ? mk.comps[c.id] : null;
    if (rc && rc.sent > 0) s.market.comps[c.id] = { sent: rc.sent, hist: Array.isArray(rc.hist) ? rc.hist.filter((x) => x > 0).slice(-MARKET.histMax) : [] };
    const st = isObj(mk.stakes) ? mk.stakes[c.id] : 0;
    if (st > 0) s.market.stakes[c.id] = Math.min(1, st);
  }
  s.challenge = isObj(raw.challenge) && CHALLENGE_MAP[raw.challenge.id] ? { ...raw.challenge } : null;
  s.pending = Array.isArray(raw.pending) ? raw.pending.filter((p) => isObj(p) && p.at > 0 && p.cash >= 0) : [];
  const h = isObj(raw.history) ? raw.history : {};
  const series = (a) => (Array.isArray(a) ? a.filter((r) => Array.isArray(r) && r.length >= 3) : []);
  s.history = {
    short: series(h.short), long: series(h.long), rounds: Array.isArray(h.rounds) ? h.rounds.filter((x) => x > 0) : [],
    lastShort: h.lastShort > 0 ? h.lastShort : 0, lastLong: h.lastLong > 0 ? h.lastLong : 0,
  };
  const keep = (obj, map) => { for (const id of Object.keys(obj)) if (!map[id]) delete obj[id]; };
  keep(s.products, D.PRODUCT_MAP);
  keep(s.depts, D.DEPT_MAP);
  keep(s.deptUnlocked, D.DEPT_MAP);
  keep(s.upgrades, D.UPGRADE_MAP);
  keep(s.techs, D.TECH_MAP);
  keep(s.techLevels, D.REPEAT_MAP);
  keep(s.acquisitions, D.ACQ_MAP);
  if (s.trend && !D.PRODUCT_MAP[s.trend.pid]) s.trend = null;
  s.deptUnlocked[D.FIRST_DEPT] = true;
  if (!(s.depts[D.FIRST_DEPT] >= 0)) s.depts[D.FIRST_DEPT] = 0;
  for (const k of ['cash', 'rp', 'runEarned', 'totalEarned', 'investors', 'claimedRaw', 'prestigeCount', 'lastTick', 'nextBubbleAt', 'nextTrendAt']) {
    s[k] = fix(s[k], base[k]);
  }
  for (const k of Object.keys(s.stats)) s.stats[k] = fix(s.stats[k], base.stats[k] || 0);
  // Zapis sprzed nowej ekonomii (v1): Game.afterLoad przeliczy go przy wczytaniu.
  if (!(raw.v >= 2)) s.migrateFrom = raw.v || 1;
  s.v = SAVE_VERSION;
  return s;
}

// ---------------------------------------------------------------------------
// Gra
// ---------------------------------------------------------------------------
export class Game {
  // opts.layer — id warstwy (domyślnie z zapisu albo Ziemia), opts.meta — wspólny stan firmy,
  // opts.co — koordynator warstw (Company), jeśli gra ma ich kilka.
  constructor(state, opts = {}) {
    this.now = opts.now ?? Date.now();
    this.D = LAYERS[opts.layer] || (state && LAYERS[state.layer]) || EARTH;
    this.co = opts.co || null;
    // warstwa w tle liczy przychód, badania i autopilota, ale nie losuje bąbelków, trendów ani decyzji
    this.background = false;
    this.s = state ? sanitizeState(state, this.now, this.D, opts.meta || null) : createState(this.now, opts.meta || createMeta(this.now), this.D);
    this.rng = opts.rng || Math.random;
    this.listeners = {};
    this.feedIn = 0;
    this.feedOut = 0;
    this.prodIncome = {};
    this.income = 0;
    this.netIncome = 0;
    this.rpBudget = 0;
    this.rpRate = 0;
    this.clickValue = 1;
    this.autoAcc = 0;
    this.achTimer = 0;
    this.clickTimes = [];
    this.m = null;
    this.recalc();
    this.afterLoad(this.now);
  }

  // Po wczytaniu zapisu: przejście na nową ekonomię (zasięg rynku, ludzka skala na Ziemi).
  afterLoad(now = this.now) {
    this.migrated = false;
    if (!this.s.migrateFrom) return;
    delete this.s.migrateFrom;
    this.migrateEconomy(now);
    this.migrated = true;
  }
  // Badania, biura, zarząd, autopilot, wyzwania, udziały i osiągnięcia zostają. Bieżąca runda
  // zaczyna się od nowa, a kapitał inwestorów nie może przekraczać tego, na co pozwala rynek
  // przy obecnych technologiach (dwa dni zarabiania przy pełnym zasięgu).
  migrateEconomy(now = this.now) {
    const s = this.s;
    const cap = Math.pow(10, this.marketCapLog());
    // na początku gry stara i nowa ekonomia się pokrywają, więc mały kapitał zostaje
    const fairTotal = Math.max(cap * 2 * 86400, 1e13);
    const fairInvestors = Math.floor(this.prestigeRaw(fairTotal));
    if (s.investors > fairInvestors) {
      s.investors = fairInvestors;
      s.totalEarned = fairTotal;
      s.claimedRaw = this.prestigeRaw(fairTotal);
    }
    s.stats.bestRun = Math.min(s.stats.bestRun, fairTotal);
    s.stats.maxIncome = Math.min(s.stats.maxIncome, cap);
    s.stats.bestValuation = Math.min(s.stats.bestValuation, cap * SECONDS_PER_GAME_YEAR * VALUATION.maxMultiple);
    s.pending = [];
    s.history = { short: [], long: [], rounds: [], lastShort: 0, lastLong: 0 };
    this.resetRun(now);
    // skala: tyle, ile pozwala obecny rynek; wyższe osiągnięcia skali wrócą razem z technologią
    const top = scaleIndex(cap * SECONDS_PER_GAME_YEAR, (id) => !!s.techs[id]);
    s.meta.scaleMax = Math.min(s.meta.scaleMax, top);
    SCALE_LEVELS.forEach((L, i) => { if (i > s.meta.scaleMax) delete s.meta.achievements[`scale${i}`]; });
    this.recalc();
  }

  // Przeliczenie po zmianie czegoś wspólnego (osiągnięcia, rada, zarząd) — we wszystkich warstwach.
  refresh() { if (this.co) this.co.recalc(); else this.recalc(); }
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
  achCount() { return Object.keys(this.s.meta.achievements).length; }
  apCount() { return AUTOPILOT.filter((a) => this.s.meta.autopilot.owned[a.id]).length; }
  challengeTiers() { let n = 0; for (const k in this.s.meta.challenges) n += this.s.meta.challenges[k] || 0; return n; }
  ownedProductCount() { return this.D.PRODUCTS.filter((p) => (this.s.products[p.id] || 0) > 0).length; }
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
      prestige: 1, investorPct: 0, startCash: 0, startLevels: 0, valMult: 0,
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
          case 'valMult': m.valMult += add; break;
          case 'unlockProduct': m.unlockProduct[e.id] = true; break;
          case 'unlockDept': m.unlockDept[e.id] = true; break;
          default: break;
        }
      }
    };
    for (const id in s.techs) if (s.techs[id] && this.D.TECH_MAP[id]) apply(this.D.TECH_MAP[id].fx);
    for (const id in s.techLevels) { const l = s.techLevels[id] || 0; if (l > 0 && this.D.REPEAT_MAP[id]) apply(this.D.REPEAT_MAP[id].fx, l); }
    for (const id in s.upgrades) if (s.upgrades[id] && this.D.UPGRADE_MAP[id]) apply(this.D.UPGRADE_MAP[id].fx);
    for (const id in s.acquisitions) if (s.acquisitions[id] && this.D.ACQ_MAP[id]) apply(this.D.ACQ_MAP[id].fx);
    for (const id in s.meta.perks) { const l = s.meta.perks[id] || 0; if (l > 0 && PERK_MAP[id]) apply(PERK_MAP[id].fx, l); }
    for (const id in s.meta.challenges) { const l = s.meta.challenges[id] || 0; if (l > 0 && CHALLENGE_MAP[id]) apply(CHALLENGE_MAP[id].fx, l); }
    for (const id in s.offices) { const l = s.offices[id] || 0; if (l > 0 && this.D.OFFICE_MAP[id]) apply(this.D.OFFICE_MAP[id].fx, l); }
    // zarząd: cechy wzmocnione doświadczeniem i dziwactwem
    for (const role in s.meta.board) {
      const e = s.meta.board[role];
      const k = this.execPower(e);
      apply(e.traits.map((tr) => scaleTrait(tr, k)));
    }
    // udziały w konkurentach: premia dla ich kategorii, a przy 51% przejęcie kontroli
    for (const id in s.market.stakes) {
      const c = COMP_MAP[id];
      const p = s.market.stakes[id] || 0;
      if (!c || !(p > 0)) continue;
      let x = 1 + MARKET.stakeBonus * Math.min(p, MARKET.stakeCap);
      if (p >= MARKET.control) { x *= MARKET.controlCat; m.all *= MARKET.controlAll; }
      m.cat[c.cat] = (m.cat[c.cat] || 1) * x;
    }
    const ch = this.rule();

    let eventAdd = 0; let contractAdd = 0; let hireRed = 0; let prodRed = 0; let offAdd = 0; let acqRed = 0; let presAdd = 0;
    for (const d of this.D.DEPTS) {
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
    m.invMult = ch && ch.rule === 'noInvestors' ? 1 : 1 + s.investors * (this.D.PRESTIGE.bonus + m.investorPct);
    const bx = (k) => { const b = this.boostActive(k); return b ? b.x : 1; };
    // income/click — bąbelki (viral, hackathon); dIncome/dClick/dRp — wybrane decyzje
    m.boostIncome = bx('income') * bx('dIncome');
    m.boostClick = bx('click') * bx('dClick');
    m.rp *= bx('dRp');
    m.global = m.all * (1 + m.incomePct) * m.achMult * m.invMult * m.boostIncome;
    m.noMilestones = !!ch && ch.rule === 'noMilestones';
    this.m = m;

    let total = 0;
    for (const p of this.D.PRODUCTS) {
      const lvl = s.products[p.id] || 0;
      const v = lvl > 0 ? this.productUnit(p.id) * lvl * this.msMult(lvl) : 0;
      this.prodIncome[p.id] = v;
      total += v;
    }
    // zasięg rynku: ponad nim przychód rośnie wolniej (nasycenie)
    const raw = Number.isFinite(total) ? total : Number.MAX_VALUE;
    const cap = Math.pow(10, this.marketCapLog());
    const eff = capIncome(raw, cap, this.D.MARKET_REACH);
    const factor = raw > 0 ? eff / raw : 1;
    if (factor !== 1) for (const id in this.prodIncome) this.prodIncome[id] *= factor;
    this.rawIncome = raw;
    this.marketCap = cap;
    this.incFactor = factor;
    this.incElastic = raw <= cap ? 1 : eff >= cap * this.D.MARKET_REACH.maxOver ? 0 : this.D.MARKET_REACH.soft;
    this.income = eff;
    if (ch && ch.rule === 'noclick') {
      m.auto = 0;
      this.clickValue = 0;
    } else {
      // kodowanie też sprzedaje się na tym samym rynku: przy nasyceniu tanieje jak produkty,
      // a jedno kliknięcie nie przyniesie więcej niż sekunda całego rynku
      const base = Math.min(cap, (this.D.CLICK_BASE + m.clickFlat) * m.click * (1 + m.clickMultAdd) * m.achMult * m.invMult * factor);
      this.clickValue = (base + m.clickPct * this.income) * m.boostClick;
    }
    // budżet badawczy: część przychodu zamienia się w punkty badań
    const rd = this.D.RD_BUDGET;
    const share = s.deptUnlocked[this.D.RD_DEPT] && rd.shares.includes(s.rdBudget) ? s.rdBudget : 0;
    m.rdShare = share;
    // zasilanie: część przychodu idzie do kolejnej warstwy (np. Ziemia finansuje program kosmiczny)
    const feed = this.feedTarget() && FEED_SHARES.includes(s.feed) ? s.feed : 0;
    m.feedShare = feed;
    this.feedOut = this.income * feed;
    this.netIncome = this.income * (1 - share - feed);
    this.rpBudget = share > 0 && this.income > 0 ? rd.k * Math.pow((this.income * share) / (rd.ref || 1), rd.p) * m.rp : 0;
    this.rpRate = m.rpBase * m.rp + this.rpBudget;
  }
  // Warstwa, którą ta zasila (jeśli firma już ją otworzyła).
  feedTarget() {
    const n = this.D.NEXT;
    return n && this.co && this.co.layers[n.layer] ? n.layer : null;
  }
  setFeed(share) {
    if (!FEED_SHARES.includes(share) || !this.feedTarget()) return false;
    this.s.feed = share;
    this.recalc();
    return true;
  }
  setRdBudget(share) {
    if (!this.D.RD_BUDGET.shares.includes(share)) return false;
    this.s.rdBudget = share;
    this.recalc();
    return true;
  }

  // Przychód z jednego poziomu produktu (bez kamieni milowych), z premiami i trendem.
  productUnit(id) {
    const p = this.D.PRODUCT_MAP[id];
    const m = this.m;
    let v = p.rps * (m.prod[id] || 1) * (m.cat[p.cat] || 1) * (1 + (m.catAdd[p.cat] || 0)) * m.global;
    const tr = this.s.trend;
    if (tr && tr.until > this.now && tr.pid === id) v *= tr.x;
    return v;
  }
  // Poziom skali cywilizacji (z wymaganymi technologiami) i stopień Kardaszowa, który się z nim zgadza.
  // Skala liczy się dla całej firmy: przychód wszystkich warstw i technologie z każdej z nich.
  hasTech(id) { return this.co ? this.co.hasTech(id) : !!this.s.techs[id]; }
  allTechs() { return this.D.TECHS.every((x) => this.s.techs[x.id]); }
  scaleRevenue() { return this.co ? this.co.annualRevenue() : this.annualRevenue(); }
  scaleIdx() { return scaleIndex(this.scaleRevenue(), (id) => this.hasTech(id)); }
  scaleGate() { return SCALE_LEVELS.find((L) => L.tech && !this.hasTech(L.tech)) || null; }
  kardashevShown() {
    const k = kardashev(this.scaleRevenue());
    const gate = this.scaleGate();
    return k !== null && gate ? Math.min(k, gate.k - 0.01) : k;
  }
  // log10 zasięgu rynku ($/s) przy obecnych technologiach
  marketCapLog() {
    let v = this.D.MARKET_REACH.base;
    for (const id in this.s.techs) if (this.s.techs[id] && this.D.TECH_CAP_STEP[id]) v += this.D.TECH_CAP_STEP[id];
    return v;
  }
  // Nazwa rynku: Ziemia, Układ Słoneczny, galaktyka, wszechświat, multiwersum
  marketStage() {
    let id = this.D.MARKET_REACH.stages[0].id;
    for (const st of this.D.MARKET_REACH.stages) {
      if (st.tech ? this.s.techs[st.tech] : this.D.TECHS.some((t) => t.era >= st.era && this.s.techs[t.id])) id = st.id;
    }
    return id;
  }
  // Rzeczywisty przyrost przychodu z przyrostu liczonego liniowo (przy nasyconym rynku mniejszy).
  marginal(d) { return d * (this.incFactor ?? 1) * (this.incElastic ?? 1); }
  // Mnożnik z kamieni milowych (w wyzwaniu „Kryzys” nie działa).
  msMult(lvl) { return this.m.noMilestones ? 1 : Math.pow(2, milestoneCount(lvl)); }
  // O ile wzrośnie przychód po dokupieniu n poziomów (z kamieniami milowymi).
  productDelta(id, n = 1) {
    const l = this.s.products[id] || 0;
    const f = (x) => x * this.msMult(x);
    return this.marginal(this.productUnit(id) * (f(l + n) - f(l)));
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

    this.earn(this.netIncome * dt);
    if (this.feedIn > 0) this.earnRaw(this.feedIn * dt);
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

    const fg = !this.background;
    if (fg) this.updateBubble(now);
    if (fg) this.updateTrend(now);
    this.updateContracts(now);
    if (fg) this.updateDecision(now);
    this.updatePending(now);
    this.updateMarket(now);
    if (fg) this.updateCandidates(now);

    this.apTimer = (this.apTimer || 0) + dt;
    if (this.apTimer >= 1) { this.apTimer = 0; this.autopilotStep(now); }

    this.achTimer += dt;
    if (this.achTimer >= 1) {
      this.achTimer = 0;
      // poziomy zarządu i dziwactwa zależne od godziny zmieniają się powoli — sprawdzamy raz na sekundę
      const bs = this.boardSignature();
      if (bs !== this.lastBoardSig) { this.lastBoardSig = bs; this.recalc(); }
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
    if (this.clickTimes.length >= 12 && !s.meta.flags.frenzy) s.meta.flags.frenzy = true;
    return v;
  }

  // ---------- produkty ----------
  productUnlocked(id) {
    const p = this.D.PRODUCT_MAP[id];
    return !p.tech || !!this.s.techs[p.tech];
  }
  // Wyzwanie „Pełne skupienie” ogranicza liczbę różnych produktów.
  canOwnProduct(id) {
    const ch = this.rule();
    if (!ch || ch.rule !== 'maxProducts' || (this.s.products[id] || 0) > 0) return true;
    return this.ownedProductCount() < ch.v;
  }
  productCost(id, n = 1) {
    const p = this.D.PRODUCT_MAP[id];
    return geomSum(p.cost, PRODUCT_GROWTH, this.s.products[id] || 0, n) * this.m.prodCost;
  }
  productMax(id, budget = this.s.cash) {
    const p = this.D.PRODUCT_MAP[id];
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
      const p = this.D.PRODUCT_MAP[id];
      this.toast(p.icon, t('toast.milestone', { name: TX.prodName(id) }), t('toast.milestoneText', { n: prevMilestone(before + n), x: Math.pow(2, mc) }), 'milestone');
    }
    this.emit('buy', { kind: 'product', id, n });
    if (before === 0) this.emit('structure');
    return n;
  }

  // ---------- działy ----------
  deptAvailable(id) {
    const d = this.D.DEPT_MAP[id];
    const ch = this.rule();
    if (ch && ch.rule === 'onlyDev' && id !== this.D.FIRST_DEPT) return false;
    return !d.tech || !!this.s.techs[d.tech];
  }
  unlockDept(id) {
    const d = this.D.DEPT_MAP[id];
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
    const d = this.D.DEPT_MAP[id];
    return geomSum(d.base, d.g, this.s.depts[id] || 0, n) * this.m.hireCost;
  }
  hireMax(id, budget = this.s.cash) {
    const d = this.D.DEPT_MAP[id];
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
      const d = this.D.DEPT_MAP[id];
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
    return this.D.UPGRADES.filter((u) => !this.s.upgrades[u.id] && this.upgradeVisible(u)).sort((a, b) => a.cost - b.cost);
  }
  buyUpgrade(id) {
    const u = this.D.UPGRADE_MAP[id];
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
    const tech = this.D.TECH_MAP[id] || this.D.REPEAT_MAP[id];
    return tech.req.every((r) => this.s.techs[r]);
  }
  research(id) {
    const tech = this.D.TECH_MAP[id];
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
    const r = this.D.REPEAT_MAP[id];
    return r.base * Math.pow(r.g, this.s.techLevels[id] || 0);
  }
  researchRepeat(id) {
    const r = this.D.REPEAT_MAP[id];
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
  acqUnlocked() { return !!this.s.deptUnlocked[this.D.LEGAL_DEPT]; }
  acqCost(id) { return this.D.ACQ_MAP[id].cost * this.m.acqCost; }
  buyAcq(id) {
    const a = this.D.ACQ_MAP[id];
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
    return Math.ceil(p.base * Math.pow(p.g, this.s.meta.perks[id] || 0));
  }
  buyPerk(id) {
    const p = PERK_MAP[id];
    const s = this.s;
    const lvl = s.meta.perks[id] || 0;
    if (!p || lvl >= p.max) return false;
    const cost = this.perkCost(id);
    if (s.meta.shares < cost) return false;
    s.meta.shares -= cost;
    s.meta.perks[id] = lvl + 1;
    this.refresh();
    this.emit('buy', { kind: 'perk', id });
    this.emit('structure');
    return true;
  }

  // ---------- prestiż: runda finansowania ----------
  prestigeRaw(total = this.s.totalEarned) {
    return this.D.PRESTIGE.k * Math.pow(Math.max(0, total) / this.D.PRESTIGE.div, this.D.PRESTIGE.exp);
  }
  prestigeWhole() { return Math.max(0, Math.floor(this.prestigeRaw() - this.s.claimedRaw)); }
  prestigeGain() { return Math.floor(this.prestigeWhole() * this.m.prestige); }
  // Ile łącznie trzeba zarobić, żeby dostać kolejny punkt kapitału
  nextPrestigeAt() {
    const target = this.s.claimedRaw + this.prestigeWhole() + 1;
    return this.D.PRESTIGE.div * Math.pow(target / this.D.PRESTIGE.k, 1 / this.D.PRESTIGE.exp);
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
    for (const p of this.D.PRODUCTS) {
      const l = s.products[p.id] || 0;
      if (l) v += geomSum(p.cost, PRODUCT_GROWTH, 0, l) * 0.5;
    }
    for (const d of this.D.DEPTS) {
      if (!s.deptUnlocked[d.id]) continue;
      v += d.unlock * 0.5;
      const n = s.depts[d.id] || 0;
      if (n) v += geomSum(d.base, d.g, 0, n) * 0.2;
    }
    for (const id in s.upgrades) if (this.D.UPGRADE_MAP[id]) v += this.D.UPGRADE_MAP[id].cost * 0.25;
    for (const id in s.acquisitions) if (this.D.ACQ_MAP[id]) v += this.D.ACQ_MAP[id].cost * 0.75;
    if (this.marketUnlocked()) v += this.portfolioValue();
    return Math.min(Number.MAX_VALUE, v);
  }
  valuationMultiple() {
    const V = VALUATION;
    const extra = this.m.valMult || 0;
    return Math.min(V.maxMultiple + extra, V.baseMultiple + extra + V.perTech * this.techCount() + V.perRound * this.s.prestigeCount);
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
    s.meta.shares += gain;
    s.prestigeCount++;
    s.meta.rounds++;
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
    s.depts = { [this.D.FIRST_DEPT]: 0 };
    s.deptUnlocked = { [this.D.FIRST_DEPT]: true };
    s.upgrades = {};
    s.acquisitions = {};
    s.boosts = {};
    s.bubble = null;
    s.trend = null;
    s.contracts = { offers: [], active: [], nextOfferAt: 0, seq: s.contracts.seq || 0 };
    s.challenge = null;
    s.market.stakes = {};
    s.runEarned = 0;
    s.stats.runClicks = 0;
    s.stats.runStartedAt = now;
    s.nextBubbleAt = now + 30000;
    s.nextTrendAt = now + 120000;
    this.recalc();
    // kapitał na start: ×1000 za poziom, ale najwyżej 10 minut pełnego rynku
    s.cash = this.m.startCash > 0 ? Math.min(Math.pow(1000, this.m.startCash), this.marketCap * 600) : 0;
    if (this.m.startLevels > 0) {
      const lvls = this.m.startLevels;
      const count = 2 + Math.round(lvls / 10);
      this.D.PRODUCTS.filter((p) => this.productUnlocked(p.id)).slice(0, count).forEach((p) => { s.products[p.id] = lvls; });
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
    const owned = this.D.PRODUCTS.filter((p) => (s.products[p.id] || 0) > 0);
    const dur = (120 + this.rng() * 120) * 1000;
    if (owned.length) {
      const p = owned[Math.floor(this.rng() * owned.length)];
      const x = [1.5, 2, 2, 3][Math.floor(this.rng() * 4)];
      const tpl = Math.floor(this.rng() * TREND_TEMPLATES.length);
      s.trend = { pid: p.id, x, until: now + dur, tpl };
      // czy to najlepszy produkt?
      let best = null; let bestV = -1;
      for (const q of owned) if (this.prodIncome[q.id] > bestV) { bestV = this.prodIncome[q.id]; best = q.id; }
      if (best === p.id) s.meta.flags.trendBest = true;
      this.recalc();
      this.emit('trend', s.trend);
    }
    s.nextTrendAt = now + dur + (200 + this.rng() * 200) * 1000;
  }

  // ---------- kontrakty ----------
  contractsUnlocked() { return !!this.s.deptUnlocked[this.D.SALES_DEPT]; }
  makeOffer(now) {
    const c = this.s.contracts;
    const clients = this.D.CONTRACT_CLIENTS;
    const ci = Math.floor(this.rng() * clients.length);
    const icon = clients[ci][1];
    const ti = Math.floor(this.rng() * this.D.CONTRACT_TASKS.length);
    // krótsze kontrakty są częstsze
    const r = this.rng();
    const idx = Math.min(CONTRACT_DURATIONS.length - 1, Math.floor(r * r * CONTRACT_DURATIONS.length));
    const d = CONTRACT_DURATIONS[idx];
    const o = { id: ++c.seq, ci, ti, icon, dur: d.s, f: d.f * (0.9 + this.rng() * 0.3), expires: now + 6 * 60000, rp: this.rng() < 0.4 };
    if (this.D.id !== 'earth') o.L = this.D.id;
    return o;
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
    for (const a of this.D.ACHIEVEMENTS) {
      if (s.meta.achievements[a.id]) continue;
      if (a.check(this)) {
        s.meta.achievements[a.id] = true;
        got++;
        this.emit('achievement', a);
      }
    }
    if (got) this.refresh();
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
    const cash = (this.netIncome + this.m.auto * this.clickValue) * counted * eff;
    const feed = this.feedIn * counted * eff;
    const rp = this.rpRate * counted * eff;
    this.earn(cash);
    this.earnRaw(feed);
    s.rp += rp;
    s.stats.rpTotal += rp;
    const contracts = this.updateContracts(now);
    const pending = this.updatePending(now);
    if (this.marketUnlocked()) this.updateMarket(now, Math.min(20, Math.floor(elapsed / (MARKET.every / 1000))));
    if (elapsed >= 8 * 3600) s.meta.flags.patience = true;
    s.lastTick = now;
    s.boosts = kept;
    s.nextBubbleAt = now + 20000 + this.rng() * 30000;
    if (s.nextTrendAt < now) s.nextTrendAt = now + 60000;
    if (this.boardUnlocked() && s.meta.nextCandidateAt < now + 2 * 60000) s.meta.nextCandidateAt = now + 2 * 60000;
    // Po dłuższej przerwie decyzja czeka chwilę po powrocie, a nie od razu.
    if (!s.meta.decision && s.meta.nextDecisionAt < now + 3 * 60000) s.meta.nextDecisionAt = now + 3 * 60000;
    this.recalc();
    this.checkAchievements();
    this.sampleHistory(now, true);
    const res = { elapsed, counted, cash, feed, rp, eff, cap: this.m.offlineCap, contracts, pending, layer: this.D.id };
    this.emit('offline', res);
    this.autopilotStep(now);
    return res;
  }

  // ---------- ekspansja: biura na świecie ----------
  officeLevel(id) { return this.s.offices[id] || 0; }
  officeCount(kind) { return this.D.OFFICES.filter((o) => o.kind === kind && !o.hq && this.officeLevel(o.id) > 0).length; }
  officeAvailable(id) { const o = this.D.OFFICE_MAP[id]; return !o.req || !!this.s.techs[o.req]; }
  officeCost(id) {
    const o = this.D.OFFICE_MAP[id];
    const l = this.officeLevel(id);
    if (l >= OFFICE_MAX_LEVEL) return Infinity;
    return o.cost * Math.pow(this.D.OFFICE_LEVEL_COST, l - (o.hq ? 1 : 0));
  }
  openOffice(id) {
    const o = this.D.OFFICE_MAP[id];
    const s = this.s;
    if (!o || !this.officeAvailable(id)) return false;
    const cost = this.officeCost(id);
    if (!(cost <= s.cash)) return false;
    s.cash -= cost;
    const l = this.officeLevel(id) + 1;
    s.offices[id] = l;
    this.recalc();
    this.toast(o.icon, t(l === 1 ? 'off.opened' : 'off.upgraded', { name: TX.officeName(id), n: l }), TX.describeFx(o.fx), 'unlock');
    this.emit('buy', { kind: 'office', id });
    this.emit('structure');
    return true;
  }
  setView(id) {
    if (!this.officeLevel(id)) return false;
    this.s.view = id;
    if (id !== this.D.HQ) this.s.meta.flags.viewChanged = true;
    this.emit('structure');
    return true;
  }

  // ---------- zarząd ----------
  boardUnlocked() { return this.s.meta.rounds > 0; }
  execLevel(e, now = this.now) {
    const fast = e.q === 'fast' ? 2 : 1;
    const hours = Math.max(0, (now - (e.hiredAt || now)) / 3.6e6) * fast;
    return Math.min(BOARD.maxLevel, 1 + Math.floor(Math.log2(1 + hours)));
  }
  quirkActive(e, now = this.now) {
    const q = QUIRK_MAP[e.q];
    if (!q) return false;
    const d = new Date(now);
    const h = d.getHours();
    switch (q.when) {
      case 'night': return h >= 22 || h < 6;
      case 'morning': return h >= 5 && h < 10;
      case 'weekend': return d.getDay() === 0 || d.getDay() === 6;
      case 'rain': return this.weather === 'rain' || this.weather === 'snow';
      case 'winter': return d.getMonth() === 11 || d.getMonth() <= 1;
      case 'always': return true;
      default: return false;
    }
  }
  execPower(e, now = this.now) {
    const q = QUIRK_MAP[e.q];
    const lvl = 1 + BOARD.levelStep * (this.execLevel(e, now) - 1);
    return lvl * (q && q.when !== 'xp' && this.quirkActive(e, now) ? q.x : 1);
  }
  boardSignature() {
    let sig = '';
    for (const role in this.s.meta.board) { const e = this.s.meta.board[role]; sig += `${role}${this.execLevel(e)}${this.quirkActive(e) ? 1 : 0}`; }
    return sig;
  }
  candidateCost(c) {
    const inv = this.co ? this.co.layers.earth.s.investors : this.s.investors;
    return Math.ceil(BOARD.rarity[c.r].cost * (1 + inv * BOARD.costPerInvestor));
  }
  makeCandidate(now = this.now) {
    const s = this.s;
    const empty = ROLES.filter((r) => !s.meta.board[r.id] && !s.meta.candidates.some((c) => c.role === r.id));
    const pool = empty.length && this.rng() < 0.7 ? empty : ROLES;
    const role = pool[Math.floor(this.rng() * pool.length)];
    let roll = this.rng() * BOARD.rarity.reduce((a, b) => a + b.w, 0);
    let r = 0;
    for (let i = 0; i < BOARD.rarity.length; i++) { roll -= BOARD.rarity[i].w; if (roll < 0) { r = i; break; } }
    const R = BOARD.rarity[r];
    const left = [...role.traits];
    const traits = [];
    for (let i = 0; i < R.traits && left.length; i++) {
      const tr = left.splice(Math.floor(this.rng() * left.length), 1)[0];
      traits.push(scaleTrait(tr, R.mult));
    }
    const used = new Set([...Object.values(s.meta.board), ...s.meta.candidates].map((e) => e.n));
    const free = EXEC_NAMES.map((_, i) => i).filter((i) => !used.has(i));
    const n = free[Math.floor(this.rng() * free.length)] ?? 0;
    const q = this.rng() < 0.75 ? QUIRKS[Math.floor(this.rng() * QUIRKS.length)].id : null;
    s.meta.execSeq = (s.meta.execSeq || 0) + 1;
    return { id: s.meta.execSeq, role: role.id, r, traits, q, n, seed: Math.floor(this.rng() * 1e9), at: now };
  }
  updateCandidates(now) {
    const s = this.s;
    if (!this.boardUnlocked()) return false;
    if (!s.meta.nextCandidateAt) s.meta.nextCandidateAt = now + BOARD.firstAfter;
    if (now < s.meta.nextCandidateAt) return false;
    s.meta.nextCandidateAt = now + (BOARD.everyMin + this.rng() * (BOARD.everyMax - BOARD.everyMin)) * 60000;
    if (s.meta.candidates.length >= BOARD.poolMax) return false;
    const c = this.makeCandidate(now);
    s.meta.candidates.push(c);
    this.emit('candidate', c);
    return true;
  }
  hireExec(cid, now = this.now) {
    const s = this.s;
    const i = s.meta.candidates.findIndex((c) => c.id === cid);
    if (i < 0 || !this.boardUnlocked()) return false;
    const c = s.meta.candidates[i];
    const cost = this.candidateCost(c);
    if (s.meta.shares < cost) return false;
    s.meta.shares -= cost;
    s.meta.candidates.splice(i, 1);
    s.meta.board[c.role] = { ...c, hiredAt: now };
    if (c.r === BOARD.rarity.length - 1) s.meta.flags.legendHired = true;
    this.refresh();
    this.emit('buy', { kind: 'exec', id: c.role });
    this.emit('structure');
    return true;
  }
  fireExec(role) {
    if (!this.s.meta.board[role]) return false;
    delete this.s.meta.board[role];
    this.refresh();
    this.emit('structure');
    return true;
  }
  dismissCandidate(cid) {
    const s = this.s;
    const n = s.meta.candidates.length;
    s.meta.candidates = s.meta.candidates.filter((c) => c.id !== cid);
    return s.meta.candidates.length < n;
  }

  // ---------- giełda ----------
  marketUnlocked() { return !!this.D.FEATURES.market && this.s.prestigeCount >= MARKET.unlockRounds; }
  // Wielkość rynku liczymy od najwyższej wyceny bez portfela akcji — inaczej udziały pompowałyby same siebie.
  marketBase() { return Math.max(1e6, this.s.stats.bestCore || 0) * MARKET.baseShare; }
  comp(id) {
    const m = this.s.market;
    if (!m.comps[id]) m.comps[id] = { sent: 1, hist: [1] };
    return m.comps[id];
  }
  compCap(id) { return this.marketBase() * COMP_MAP[id].k * this.comp(id).sent; }
  stake(id) { return this.s.market.stakes[id] || 0; }
  stakeValue(id) { return this.stake(id) * this.compCap(id); }
  portfolioValue() { let v = 0; for (const id in this.s.market.stakes) if (COMP_MAP[id]) v += this.stakeValue(id); return v; }
  controlCount() { return Object.values(this.s.market.stakes).filter((p) => p >= MARKET.control).length; }
  sharePrice() { return this.valuation() / MARKET.sharesOut; }
  // Miejsce Twojej firmy wśród spółek na giełdzie (1 = najcenniejsza).
  marketRank() {
    const v = this.valuation();
    return 1 + COMPETITORS.filter((c) => this.compCap(c.id) > v).length;
  }
  stakeCost(id, pct) { return pct * this.compCap(id) * (1 + MARKET.fee); }
  buyStake(id, pct) {
    if (!this.marketUnlocked() || !COMP_MAP[id]) return false;
    const have = this.stake(id);
    const p = Math.min(pct, 1 - have);
    if (!(p > 1e-9)) return false;
    const cost = this.stakeCost(id, p);
    if (cost > this.s.cash) return false;
    this.s.cash -= cost;
    this.s.market.stakes[id] = Math.round((have + p) * 1e6) / 1e6;
    this.recalc();
    this.emit('buy', { kind: 'stake', id });
    if (have < MARKET.control && have + p >= MARKET.control) this.emit('control', id);
    return true;
  }
  sellStake(id, pct) {
    const have = this.stake(id);
    const p = Math.min(pct, have);
    if (!(p > 1e-9)) return false;
    this.earnRaw(p * this.compCap(id) * (1 - MARKET.fee));
    const left = Math.round((have - p) * 1e6) / 1e6;
    if (left > 0) this.s.market.stakes[id] = left; else delete this.s.market.stakes[id];
    this.recalc();
    this.emit('buy', { kind: 'stake', id });
    return true;
  }
  // Sprzedaż udziałów to nie zarobek — nie liczy się do rund finansowania.
  earnRaw(x) { if (x > 0) this.s.cash = Math.min(Number.MAX_VALUE, this.s.cash + x); }
  updateMarket(now, steps = 1) {
    if (!this.marketUnlocked() || steps <= 0) return 0;
    const mk = this.s.market;
    if (!mk.lastTick) mk.lastTick = now;
    if (now - mk.lastTick < MARKET.every && steps === 1) return 0;
    mk.lastTick = now;
    let changed = 0;
    for (let k = 0; k < steps; k++) {
      for (const c of COMPETITORS) {
        const st = this.comp(c.id);
        const z = (this.rng() + this.rng() + this.rng() - 1.5) * 2;
        let sent = st.sent + (1 - st.sent) * MARKET.revert + z * c.vol;
        if (this.rng() < MARKET.shockChance) {
          const d = (0.08 + this.rng() * 0.1) * (this.rng() < 0.5 ? -1 : 1);
          sent *= 1 + d;
          if (steps === 1) this.emit('marketNews', { id: c.id, d });
        }
        st.sent = Math.min(MARKET.sentMax, Math.max(MARKET.sentMin, sent));
        st.hist.push(+st.sent.toFixed(4));
        if (st.hist.length > MARKET.histMax) st.hist.splice(0, st.hist.length - MARKET.histMax);
      }
      changed++;
    }
    if (Object.keys(mk.stakes).length) this.recalc();
    this.emit('market');
    return changed;
  }

  // ---------- autopilot ----------
  apOwned(id) { return !!this.s.meta.autopilot.owned[id]; }
  apOn(id) { return this.apOwned(id) && !this.s.meta.autopilot.off[id]; }
  apUnlocked() { return this.s.meta.rounds > 0; }
  buyAutopilot(id) {
    const a = AP_MAP[id];
    const s = this.s;
    if (!a || this.apOwned(id) || !this.apUnlocked() || s.meta.shares < a.cost) return false;
    s.meta.shares -= a.cost;
    s.meta.autopilot.owned[id] = true;
    delete s.meta.autopilot.off[id];
    this.emit('buy', { kind: 'perk', id });
    this.emit('structure');
    return true;
  }
  toggleAutopilot(id) {
    if (!this.apOwned(id)) return false;
    const off = this.s.meta.autopilot.off;
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
          const avail = this.D.TECHS.filter((x) => !s.techs[x.id] && this.techAvailable(x.id)).sort((a, b) => a.cost - b.cost);
          if (avail.length) {
            if (s.rp >= avail[0].cost && this.research(avail[0].id)) { n++; researched.push(avail[0].id); continue; }
            break;
          }
          const reps = this.D.REPEAT_TECHS.filter((r) => this.techAvailable(r.id)).sort((a, b) => this.repeatCost(a.id) - this.repeatCost(b.id));
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
        for (const d of this.D.DEPTS) {
          if (!s.deptUnlocked[d.id] && this.deptAvailable(d.id) && s.cash >= d.unlock * 2 && this.unlockDept(d.id)) n++;
        }
        const budget = s.cash * 0.12;
        for (const d of this.D.DEPTS) {
          if (!s.deptUnlocked[d.id]) continue;
          const share = this.D.RESEARCH_DEPTS.includes(d.id) ? 0.3 : 0.07;
          const k = this.hireMax(d.id, budget * share);
          if (k > 0 && this.hire(d.id, k)) n++;
        }
      }
      if (this.apOn('products')) {
        for (let guard = 0; guard < 25; guard++) {
          let best = null;
          for (const p of this.D.PRODUCTS) {
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
  challengesUnlocked() { return !!this.D.FEATURES.challenges && this.s.prestigeCount > 0; }
  // Cel rośnie razem z Tobą: liczy się od rzędu wielkości Twojej najlepszej rundy.
  challengeGoal(id) {
    const tier = this.s.meta.challenges[id] || 0;
    if (tier >= CHALLENGE_GOALS.length) return null;
    const L = Math.log10(Math.max(1e10, this.s.stats.bestRun, this.s.runEarned));
    return Math.max(CHALLENGE_GOALS[tier], Math.pow(10, L * CHALLENGE_FACTORS[tier]));
  }
  // Rozpoczęcie wyzwania zaczyna firmę od nowa (z kapitałem z rundy, jeśli jest).
  startChallenge(id, now = this.now) {
    const s = this.s;
    if (!CHALLENGE_MAP[id] || !this.challengesUnlocked() || this.challengeGoal(id) === null) return false;
    const goal = this.challengeGoal(id);
    if (this.prestigeGain() >= 1) this.doPrestige(now);
    else this.resetRun(now);
    s.challenge = { id, tier: s.meta.challenges[id] || 0, start: now, goal };
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
    const goal = c.goal || CHALLENGE_GOALS[c.tier];
    if (goal === undefined) { s.challenge = null; this.recalc(); return false; }
    if (s.runEarned < goal) return false;
    s.meta.challenges[c.id] = Math.max(s.meta.challenges[c.id] || 0, c.tier + 1);
    s.challenge = null;
    this.refresh();
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
    const idx = this.scaleIdx();
    if (idx <= s.meta.scaleMax) return false;
    s.meta.scaleMax = idx;
    this.emit('scale', idx);
    return true;
  }

  // ---------- decyzje ----------
  updateDecision(now) {
    const s = this.s;
    if (s.meta.decision) return;
    if (!s.meta.nextDecisionAt) s.meta.nextDecisionAt = now + DECISION_FIRST;
    if (now < s.meta.nextDecisionAt || !(this.income > 0)) return;
    const recent = s.meta.recentDecisions || [];
    const pool = DECISIONS.map((d, i) => i).filter((i) => !recent.includes(i));
    const i = pool[Math.floor(this.rng() * pool.length)];
    s.meta.decision = { i, at: now };
    s.meta.recentDecisions = [...recent, i].slice(-8);
    s.meta.nextDecisionAt = now + (15 + this.rng() * 15) * 60000;
    this.emit('decision', s.meta.decision);
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
    if (!s.meta.decision || (which !== 'a' && which !== 'b')) return null;
    const d = DECISIONS[s.meta.decision.i];
    const e = this.decisionEffect(d[which].fx);
    switch (e.t) {
      case 'cash': this.earn(e.cash); break;
      case 'rp': s.rp += e.rp; s.stats.rpTotal += e.rp; break;
      case 'delayed': s.pending.push({ at: now + e.s * 1000, cash: e.cash, icon: d.icon, di: s.meta.decision.i }); break;
      case 'boost': s.boosts.dIncome = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      case 'click': s.boosts.dClick = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      case 'rpBoost': s.boosts.dRp = { x: e.x, until: now + e.s * 1000, dur: e.s }; break;
      default: break;
    }
    s.meta.decision = null;
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
    const core = val - (this.marketUnlocked() ? this.portfolioValue() : 0);
    if (core > (s.stats.bestCore || 0)) s.stats.bestCore = core;
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

// ---------------------------------------------------------------------------
// Firma: warstwy gry (Ziemia, Kosmos…) ze wspólnym stanem meta. Każda warstwa to osobna Game
// z własną rundą, drzewkiem i ekspansją; warstwy w tle dalej zarabiają i zasilają kolejne.
// ---------------------------------------------------------------------------
export class Company {
  constructor(raw = null, opts = {}) {
    this.rng = opts.rng || Math.random;
    this.listeners = {};
    this.load(raw, opts.now ?? Date.now());
  }

  // Wczytuje zapis v3 ({ meta, layers }) albo starszy, płaski zapis jednej firmy na Ziemi.
  load(raw, now = Date.now()) {
    this.now = now;
    let metaRaw = null;
    let layersRaw = {};
    if (isObj(raw) && isObj(raw.layers)) { metaRaw = isObj(raw.meta) ? raw.meta : {}; layersRaw = raw.layers; }
    else if (isObj(raw)) { metaRaw = isObj(raw.meta) ? raw.meta : raw; layersRaw = { earth: raw }; }
    this.meta = metaRaw ? sanitizeMeta(metaRaw, now) : createMeta(now);
    this.layers = {};
    for (const id of LAYER_ORDER) if (this.meta.unlocked[id] && LAYERS[id]) this.addLayer(id, layersRaw[id] || null);
    this.migrated = !!this.layers.earth.migrated;
    this.setLayer(this.meta.settings.layer);
    this.feedLinks();
    this.recalc();
    return this;
  }
  addLayer(id, raw = null) {
    const g = new Game(raw, { now: this.now, rng: this.rng, layer: id, meta: this.meta, co: this });
    this.layers[id] = g;
    for (const ev in this.listeners) for (const fn of this.listeners[ev]) g.on(ev, (d) => fn(d, g));
    return g;
  }

  // Aktywna warstwa (ta na ekranie); pozostałe działają w tle.
  get g() { return this.layers[this.meta.settings.layer] || this.layers.earth; }
  setLayer(id) {
    if (!this.layers[id]) return false;
    this.meta.settings.layer = id;
    for (const k in this.layers) this.layers[k].background = k !== id;
    return true;
  }
  // Zdarzenie z dowolnej warstwy: fn(dane, warstwa).
  on(ev, fn) {
    (this.listeners[ev] ||= []).push(fn);
    for (const g of Object.values(this.layers)) g.on(ev, (d) => fn(d, g));
    return this;
  }
  emit(ev, data) { for (const fn of this.listeners[ev] || []) fn(data, this.g); }

  recalc() { for (const k in this.layers) this.layers[k].recalc(); this.feedLinks(); }
  feedLinks() {
    for (const k in this.layers) this.layers[k].feedIn = 0;
    for (const k in this.layers) {
      const g = this.layers[k];
      const to = g.feedTarget();
      if (to) this.layers[to].feedIn += g.feedOut;
    }
  }
  tick(now) {
    this.now = now;
    this.feedLinks();
    for (const id of LAYER_ORDER) if (this.layers[id]) this.layers[id].tick(now);
  }

  // ---------- wartości dla całej firmy ----------
  hasTech(id) { for (const k in this.layers) if (this.layers[k].s.techs[id]) return true; return false; }
  annualRevenue() { let v = 0; for (const k in this.layers) v += this.layers[k].annualRevenue(); return v; }
  totalEarned() { let v = 0; for (const k in this.layers) v += this.layers[k].s.totalEarned; return Math.min(Number.MAX_VALUE, v); }
  maxIncome() { let v = 0; for (const k in this.layers) v += this.layers[k].s.stats.maxIncome; return Math.min(Number.MAX_VALUE, v); }
  // Osiągnięcia wszystkich warstw (wspólna lista na ekranie osiągnięć).
  achievements() { return LAYER_ORDER.flatMap((id) => LAYERS[id].ACHIEVEMENTS); }

  // ---------- kolejna warstwa ----------
  nextLayer() { return LAYER_ORDER.find((id) => !this.layers[id]) || null; }
  // Warunki otwarcia warstwy: pełne drzewko poprzedniej i jej roczny przychód ponad progiem.
  unlockProgress(id = this.nextLayer()) {
    if (!id || this.layers[id] || !LAYERS[id]) return null;
    const from = LAYER_ORDER.find((k) => LAYERS[k].NEXT && LAYERS[k].NEXT.layer === id);
    const g = from && this.layers[from];
    if (!g) return null;
    const techs = g.D.TECHS.filter((x) => g.s.techs[x.id]).length;
    const revenue = g.annualRevenue();
    const need = g.D.NEXT.revenue;
    return { id, from, techs, techsNeed: g.D.TECHS.length, revenue, need, ready: techs >= g.D.TECHS.length && revenue >= need };
  }
  unlockLayer(id = this.nextLayer(), now = this.now) {
    const p = this.unlockProgress(id);
    if (!p || !p.ready) return false;
    const from = this.layers[p.from];
    this.meta.unlocked[id] = true;
    const g = this.addLayer(id, null);
    g.s.lastTick = now;
    // poprzednia warstwa finansuje start: grant od ręki i stałe zasilanie (domyślnie 25%)
    g.earnRaw(from.income * LAYER_GRANT_SECONDS);
    if (!from.s.feed) from.s.feed = 0.25;
    this.setLayer(id);
    this.recalc();
    this.emit('layer', { id, unlocked: true });
    return true;
  }

  serialize() {
    const layers = {};
    for (const k in this.layers) {
      const { meta, ...rest } = this.layers[k].s;
      layers[k] = rest;
    }
    return JSON.stringify({ v: SAVE_VERSION, meta: this.meta, layers });
  }
}
