// Symulator balansu: bot gra w Krzemowe Imperium i raportuje tempo postępu.
// Użycie: node tools/simulate.mjs [profil] [dni]
//   profil: active (ciągła gra), casual (sesje 20 min co 3 h), idle (bez klikania)
import {
  Game, PRODUCT_MAP, DEPT_MAP, TECH_MAP, UPGRADES, milestoneCount, kardashev, sanitizeState,
} from '../js/engine.js';
import {
  PRODUCTS, DEPTS, TECHS, REPEAT_TECHS, ACQUISITIONS, PERKS, OFFICES, AUTOPILOT, COMPETITORS, MARKET, BOARD,
  CHALLENGES, CHALLENGE_GOALS, RD_BUDGET,
} from '../js/data.js';
import { fmt, fmtTime } from '../js/format.js';

const profile = process.argv[2] || 'casual';
const days = Number(process.argv[3] || 3);
const verbose = process.argv.includes('-v');
const off = new Set((process.argv.find((a) => a.startsWith('--no=')) || '').slice(5).split(',').filter(Boolean));
// Kalibracja bez edycji danych: RDK/RDP — parametry budżetu, TECHMUL="6:0.1,7:0.25" — mnożniki kosztów er.
if (process.env.RDK) RD_BUDGET.k = Number(process.env.RDK);
if (process.env.RDP) RD_BUDGET.p = Number(process.env.RDP);
for (const pair of (process.env.TECHMUL || '').split(',').filter(Boolean)) {
  const [era, mul] = pair.split(':').map(Number);
  for (const tch of TECHS) if (tch.era === era) tch.cost *= mul;
}

let seed = 12345;
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

const T0 = 1_700_000_000_000;
let now = T0;
const g = new Game(null, { now, rng });
const log = [];
const t = () => fmtTime((now - T0) / 1000);
const note = (msg) => { console.log(`[${t().padStart(12)}] ${msg}`); };

g.on('structure', () => {});
const seenProducts = new Set();
const seenDepts = new Set(['dev']);
const seenEras = new Set();

function deltaIncome(fn, undo) {
  const before = g.income;
  fn();
  g.recalc();
  const d = g.income - before;
  undo();
  g.recalc();
  return d;
}

function rpValueWeight() {
  // Ile „wart” jest 1 PB w gotówce: im dalej od kolejnej technologii, tym bardziej cenimy badania.
  return 1;
}

function decide() {
  const s = g.s;
  let bought = true;
  let guard = 0;
  while (bought && guard++ < 400) {
    bought = false;
    // technologie: najtańsza dostępna
    const avail = TECHS.filter((x) => !s.techs[x.id] && g.techAvailable(x.id)).sort((a, b) => a.cost - b.cost);
    if (avail.length && s.rp >= avail[0].cost) { g.research(avail[0].id); bought = true; continue; }
    if (!avail.length) {
      const reps = REPEAT_TECHS.filter((r) => g.techAvailable(r.id)).sort((a, b) => g.repeatCost(a.id) - g.repeatCost(b.id));
      if (reps.length && s.rp >= g.repeatCost(reps[0].id)) { g.researchRepeat(reps[0].id); bought = true; continue; }
    }
    // działy do odblokowania
    for (const d of DEPTS) {
      if (!s.deptUnlocked[d.id] && g.deptAvailable(d.id) && s.cash >= d.unlock * 1.5) { g.unlockDept(d.id); bought = true; }
    }
    // biura (trwałe) — gdy kosztują niewiele w porównaniu z gotówką
    if (!off.has('offices')) for (const o of OFFICES) {
      if (g.officeAvailable(o.id) && g.officeCost(o.id) <= s.cash * 0.3 && g.openOffice(o.id)) bought = true;
    }
    // giełda: udziały do progu kontroli, najtańsze najpierw
    if (g.marketUnlocked() && !off.has('market')) {
      const cands = COMPETITORS.filter((c) => g.stake(c.id) < MARKET.control).sort((a, b) => g.compCap(a.id) - g.compCap(b.id));
      for (const c of cands) if (g.stakeCost(c.id, 0.1) <= s.cash * 0.2 && g.buyStake(c.id, 0.1)) bought = true;
    }
    // przejęcia
    for (const a of ACQUISITIONS) {
      if (g.acqUnlocked() && !s.acquisitions[a.id] && g.acqCost(a.id) < s.cash * 0.5) { g.buyAcq(a.id); bought = true; }
    }
    // działy nie-dochodowe: tanie zatrudnienia
    for (const d of DEPTS) {
      if (!s.deptUnlocked[d.id]) continue;
      const ratio = d.id === 'rnd' || d.id === 'data' ? 0.08 : 0.02;
      const n = g.hireMax(d.id, s.cash * ratio);
      if (n > 0) { g.hire(d.id, n); bought = true; }
    }
    // kandydaci dochodowi
    let best = null;
    const consider = (cost, delta, act) => {
      if (!(delta > 0)) return;
      const wait = Math.max(0, cost - s.cash) / Math.max(g.income, 1e-9);
      const score = cost / delta + wait;
      if (!best || score < best.score) best = { score, cost, act };
    };
    for (const p of PRODUCTS) {
      if (!g.productUnlocked(p.id) || !g.canOwnProduct(p.id)) continue;
      const lvl = s.products[p.id] || 0;
      let d;
      if (lvl > 0) {
        const unit = g.prodIncome[p.id] / (lvl * Math.pow(2, milestoneCount(lvl)));
        d = g.marginal((unit * (lvl + 1) * Math.pow(2, milestoneCount(lvl + 1)) - g.prodIncome[p.id]) / (g.incFactor || 1));
      } else {
        d = deltaIncome(() => { s.products[p.id] = 1; }, () => { delete s.products[p.id]; });
      }
      consider(g.productCost(p.id), d, () => {
        const bulk = g.productMax(p.id, s.cash * 0.25);
        g.buyProduct(p.id, Math.max(1, Math.min(bulk, 25)));
      });
    }
    for (const d of DEPTS) {
      if (!s.deptUnlocked[d.id] || !d.per.some((e) => e.t === 'income' || e.t === 'cat')) continue;
      const n = s.depts[d.id] || 0;
      const dd = deltaIncome(() => { s.depts[d.id] = n + 1; }, () => { s.depts[d.id] = n; });
      consider(g.hireCost(d.id), dd, () => {
        const bulk = g.hireMax(d.id, s.cash * 0.25);
        g.hire(d.id, Math.max(1, Math.min(bulk, 10)));
      });
    }
    for (const u of g.availableUpgrades()) {
      if (u.kind === 'click') { if (s.cash >= u.cost) { g.buyUpgrade(u.id); bought = true; } continue; }
      let dd;
      if (u.kind === 'product') dd = g.marginal(g.prodIncome[u.req.product] / (g.incFactor || 1) * (u.fx[0].x - 1));
      else if (u.kind === 'culture') dd = g.marginal(g.rawIncome * (u.fx[0].x - 1));
      else dd = deltaIncome(() => { s.upgrades[u.id] = true; }, () => { delete s.upgrades[u.id]; });
      if (dd <= 0 && s.cash >= u.cost * 3) { g.buyUpgrade(u.id); bought = true; continue; }
      consider(u.cost, dd, () => g.buyUpgrade(u.id));
    }
    if (best && best.cost <= s.cash) { const c0 = s.cash; best.act(); bought = s.cash !== c0; }
  }
  // budżet badawczy: rośnie z kolejnymi erami (gracz podkręca go, gdy gotówka się przelewa)
  if (!off.has('budget')) {
    const want = g.techCount() < 18 ? 0.1 : g.techCount() < 30 ? 0.25 : 0.5;
    if (g.s.rdBudget !== want) g.setRdBudget(want);
  }
  // decyzje: bierzemy pierwszą opcję
  if (g.s.meta.decision) { if (off.has('decisions')) g.s.meta.decision = null; else g.chooseDecision('a', now); }
  // moduły autopilota (gracz kupi je jako pierwsze) i zarząd
  if (g.apUnlocked()) for (const a of AUTOPILOT) if (!g.apOwned(a.id) && g.s.meta.shares >= a.cost) g.buyAutopilot(a.id);
  if (off.has('board')) g.s.meta.candidates = [];
  for (const c of [...g.s.meta.candidates]) {
    const cur = g.s.meta.board[c.role];
    if ((!cur || c.r > cur.r) && g.s.meta.shares >= g.candidateCost(c)) g.hireExec(c.id, now);
    else if (cur && c.r <= cur.r) g.dismissCandidate(c.id);
  }
  // perki
  if (g.s.meta.shares > 0) {
    const order = ['p_click', 'p_trust', 'p_mentors', 'p_academy', 'p_seed', 'p_head', 'p_night', 'p_dream', 'p_auto', 'p_hr', 'p_brand', 'p_network'];
    let ok = true;
    while (ok) {
      ok = false;
      const cands = order.filter((id) => (g.s.meta.perks[id] || 0) < PERKS.find((p) => p.id === id).max).sort((a, b) => g.perkCost(a) - g.perkCost(b));
      if (cands.length && g.s.meta.shares >= g.perkCost(cands[0])) { g.buyPerk(cands[0]); ok = true; }
    }
  }
}

function report() {
  const s = g.s;
  for (const p of PRODUCTS) if ((s.products[p.id] || 0) > 0 && !seenProducts.has(p.id)) { seenProducts.add(p.id); note(`PRODUKT ${p.icon} ${p.name} (income $${fmt(g.income)}/s)`); }
  for (const d of DEPTS) if (s.deptUnlocked[d.id] && !seenDepts.has(d.id)) { seenDepts.add(d.id); note(`DZIAŁ ${d.icon} ${d.name}`); }
  for (const tch of TECHS) if (s.techs[tch.id] && !seenEras.has(tch.era)) { seenEras.add(tch.era); note(`ERA ${tch.era} (pierwsza tech: ${tch.name}) rp/s=${fmt(g.rpRate)}`); }
  if (!seenEras.has('all') && g.techCount() === TECHS.length) { seenEras.add('all'); note('PEŁNE DRZEWKO TECHNOLOGII'); }
}

const rpSrc = { tick: 0, bubble: 0, contract: 0, offline: 0 };
const wrap = (name, key) => { const orig = g[name].bind(g); g[name] = (...a) => { const r0 = g.s.rp; const r = orig(...a); rpSrc[key] += Math.max(0, g.s.rp - r0); return r; }; };
wrap('tick', 'tick'); wrap('popBubble', 'bubble'); wrap('applyOffline', 'offline');
const end = T0 + days * 86400 * 1000;
let nextReport = T0;
let sessionEnd = profile === 'casual' ? T0 + 20 * 60000 : end;
let lastPrestigeAt = T0;
let decideTimer = 0;

while (now < end) {
  const active = now < sessionEnd;
  if (!active) {
    // przerwa offline 3 h (noc: 8 h co 4 sesje)
    const sessionIdx = Math.round((now - T0) / (3.33 * 3600 * 1000));
    const gap = sessionIdx % 5 === 4 ? 8 * 3600 : 3 * 3600;
    now += gap * 1000;
    g.applyOffline(now);
    sessionEnd = now + 20 * 60000;
    decide();
    continue;
  }
  now += 1000;
  g.tick(now);
  if (profile !== 'idle') {
    for (let i = 0; i < 4; i++) g.click(now);
    if (g.s.bubble) g.popBubble(now);
    for (const o of [...g.s.contracts.offers]) g.acceptContract(o.id, now);
  }
  decideTimer++;
  if (decideTimer >= 5) { decideTimer = 0; decide(); report(); }
  // prestiż
  const gain = g.prestigeGain();
  if (gain >= 10 && gain >= g.s.investors * 1.0 && now - lastPrestigeAt > 3600 * 1000) {
    note(`    rp sources: ${Object.entries(rpSrc).map(([k, v]) => k + '=' + fmt(v)).join(' ')} | rp/s ${fmt(g.rpRate)} rpMult ${fmt(g.m.rp)} rpBase ${fmt(g.m.rpBase)} contractMult ${fmt(g.m.contract)}`);
    note(`>>> RUNDA #${g.s.prestigeCount + 1}: +${gain} kapitału (było ${g.s.investors}), income $${fmt(g.income)}/s, runEarned $${fmt(g.s.runEarned)}, techs ${g.techCount()}`);
    g.doPrestige(now);
    lastPrestigeAt = now;
    seenProducts.clear();
    decide();
  }
  if (now >= nextReport) {
    nextReport += (verbose ? 10 : (now - T0 < 3 * 3600e3 ? 15 : 120)) * 60000;
    const prods = PRODUCTS.filter((p) => g.s.products[p.id]).map((p) => `${p.icon}${g.s.products[p.id]}`).join(' ');
    note(`stan: cash $${fmt(g.s.cash)} | $${fmt(g.income)}/s | klik $${fmt(g.clickValue)} | rp ${fmt(g.s.rp)} (+${fmt(g.rpRate)}/s) | techs ${g.techCount()} | ups ${g.upgradeCount()} | ludzie ${g.totalHeads()} | ach ${g.achCount()} | inv ${fmt(g.s.investors)} | biura ${Object.keys(g.s.offices).length} | zarząd ${Object.keys(g.s.meta.board).length} | K ${(kardashev(g.annualRevenue()) ?? 0).toFixed(2)}`);
    if (verbose) {
      note(`      ${prods}`);
      const m = g.m;
      note(`      all ${fmt(m.all)} dept(1+${fmt(m.incomePct)}) ach ${fmt(m.achMult)} inv ${fmt(m.invMult)} boost ${m.boostIncome} | clicks ${g.s.stats.clicks} bubbles ${g.s.stats.bubbles} contracts ${g.s.stats.contracts}`);
      note(`      depts ${DEPTS.filter((d) => g.s.deptUnlocked[d.id]).map((d) => d.icon + (g.s.depts[d.id] || 0)).join(' ')}`);
      note(`      prodMult ${PRODUCTS.filter((p) => g.s.products[p.id]).map((p) => p.icon + fmt((m.prod[p.id] || 1) * (m.cat[p.cat] || 1) * Math.pow(2, milestoneCount(g.s.products[p.id])))).join(' ')}`);
      note(`      share ${PRODUCTS.filter((p) => g.s.products[p.id]).map((p) => p.icon + Math.round(100 * g.prodIncome[p.id] / g.income) + '%').join(' ')} click/s ${fmt(g.clickValue * 4)}`);
    }
  }
}

console.log(`Profil: ${profile}, ${days} dni\n`);
console.log(`\nKoniec: techs ${g.techCount()}/${TECHS.length}, osiągnięcia ${g.achCount()}, rundy ${g.s.prestigeCount}, kapitał ${fmt(g.s.investors)}, biura ${Object.keys(g.s.offices).length}/${OFFICES.length}, zarząd ${Object.keys(g.s.meta.board).length}, skala ${g.s.meta.scaleMax}`);

// --chal: na koniec bot próbuje każdego wyzwania przez 2 h aktywnej gry
if (process.argv.includes('--chal')) {
  const saved = g.serialize();
  for (const ch of CHALLENGES) {
    g.s = sanitizeState(JSON.parse(saved), now);
    g.recalc();
    const startTier = g.s.meta.challenges[ch.id] || 0;
    const t0 = now;
    g.startChallenge(ch.id, now);
    let tnow = now;
    for (let i = 0; i < 2 * 3600; i++) {
      tnow += 1000;
      g.tick(tnow);
      for (let k = 0; k < 4; k++) g.click(tnow);
      if (i % 5 === 0) decide();
      if (!g.s.challenge && (g.s.meta.challenges[ch.id] || 0) < CHALLENGE_GOALS.length && i % 60 === 0) g.startChallenge(ch.id, tnow);
    }
    console.log(`wyzwanie ${ch.id}: poziomy ${startTier} → ${g.s.meta.challenges[ch.id] || 0} w 2 h (run $${fmt(g.s.runEarned)})`);
    void t0;
  }
}
