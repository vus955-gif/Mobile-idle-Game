// Symulator balansu: bot gra w Krzemowe Imperium (wszystkie warstwy) i raportuje tempo postępu.
// Użycie: node tools/simulate.mjs [profil] [dni] [-v] [--no=budget,offices,...] [--chal] [--only=earth]
//   profil: active (ciągła gra), casual (sesje 20 min co ~3 h), idle (bez klikania)
import { Company, milestoneCount, kardashev } from '../js/engine.js';
import { LAYERS } from '../js/layers.js';
import { PERKS, AUTOPILOT, COMPETITORS, MARKET, CHALLENGES, CHALLENGE_GOALS } from '../js/data.js';
import { fmt, fmtTime } from '../js/format.js';
import * as TX from '../js/text.js';

const profile = process.argv[2] || 'casual';
const days = Number(process.argv[3] || 3);
const verbose = process.argv.includes('-v');
const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const off = new Set(arg('no').split(',').filter(Boolean));
const only = arg('only');
// Kalibracja bez edycji danych: RDK/RDP — budżet badań Ziemi, TECHMUL="6:0.1,9:2" — mnożniki kosztów er
// (ery 8–10 to Kosmos), SPACE_RDK/SPACE_RDP — budżet badań Kosmosu.
const E = LAYERS.earth;
const S = LAYERS.space;
if (process.env.RDK) E.RD_BUDGET.k = Number(process.env.RDK);
if (process.env.RDP) E.RD_BUDGET.p = Number(process.env.RDP);
if (process.env.SPACE_RDK) S.RD_BUDGET.k = Number(process.env.SPACE_RDK);
if (process.env.SPACE_RDP) S.RD_BUDGET.p = Number(process.env.SPACE_RDP);
// SPACE_TECH="c0:r" — koszty technologii Kosmosu jako ciąg geometryczny (w kolejności listy).
if (process.env.SPACE_TECH) {
  const [c0, r] = process.env.SPACE_TECH.split(':').map(Number);
  S.TECHS.forEach((tch, i) => { tch.cost = c0 * Math.pow(r, i); });
}
for (const pair of (process.env.TECHMUL || '').split(',').filter(Boolean)) {
  const [era, mul] = pair.split(':').map(Number);
  for (const D of [E, S]) for (const tch of D.TECHS) if (tch.era === era) tch.cost *= mul;
}

let seed = 12345;
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

const T0 = 1_700_000_000_000;
let now = T0;
const co = new Company(null, { now, rng });
const t = () => fmtTime((now - T0) / 1000);
const note = (msg) => { console.log(`[${t().padStart(12)}] ${msg}`); };
const tag = (g) => (g.D.id === 'earth' ? '🌍' : '🛰️');
const seen = {};
const seenOf = (g) => (seen[g.D.id] ||= { products: new Set(), depts: new Set([g.D.FIRST_DEPT]), eras: new Set() });
const lastPrestigeAt = {};

function deltaIncome(g, fn, undo) {
  const before = g.income;
  fn();
  g.recalc();
  const d = g.income - before;
  undo();
  g.recalc();
  return d;
}

function decide(g) {
  const s = g.s;
  const D = g.D;
  let bought = true;
  let guard = 0;
  while (bought && guard++ < 400) {
    bought = false;
    // technologie: najtańsza dostępna
    const avail = D.TECHS.filter((x) => !s.techs[x.id] && g.techAvailable(x.id)).sort((a, b) => a.cost - b.cost);
    if (avail.length && s.rp >= avail[0].cost) { g.research(avail[0].id); bought = true; continue; }
    if (!avail.length) {
      const reps = D.REPEAT_TECHS.filter((r) => g.techAvailable(r.id)).sort((a, b) => g.repeatCost(a.id) - g.repeatCost(b.id));
      if (reps.length && s.rp >= g.repeatCost(reps[0].id)) { g.researchRepeat(reps[0].id); bought = true; continue; }
    }
    // działy do odblokowania
    for (const d of D.DEPTS) {
      if (!s.deptUnlocked[d.id] && g.deptAvailable(d.id) && s.cash >= d.unlock * 1.5) { g.unlockDept(d.id); bought = true; }
    }
    // biura i kolonie (trwałe) — gdy kosztują niewiele w porównaniu z gotówką
    if (!off.has('offices')) for (const o of D.OFFICES) {
      if (g.officeAvailable(o.id) && g.officeCost(o.id) <= s.cash * 0.3 && g.openOffice(o.id)) bought = true;
    }
    // giełda: udziały do progu kontroli, najtańsze najpierw
    if (g.marketUnlocked() && !off.has('market')) {
      const cands = COMPETITORS.filter((c) => g.stake(c.id) < MARKET.control).sort((a, b) => g.compCap(a.id) - g.compCap(b.id));
      for (const c of cands) if (g.stakeCost(c.id, 0.1) <= s.cash * 0.2 && g.buyStake(c.id, 0.1)) bought = true;
    }
    // przejęcia
    for (const a of D.ACQUISITIONS) {
      if (g.acqUnlocked() && !s.acquisitions[a.id] && g.acqCost(a.id) < s.cash * 0.5) { g.buyAcq(a.id); bought = true; }
    }
    // działy nie-dochodowe: tanie zatrudnienia
    for (const d of D.DEPTS) {
      if (!s.deptUnlocked[d.id]) continue;
      const ratio = D.RESEARCH_DEPTS.includes(d.id) ? 0.08 : 0.02;
      const n = g.hireMax(d.id, s.cash * ratio);
      if (n > 0) { g.hire(d.id, n); bought = true; }
    }
    // kandydaci dochodowi
    let best = null;
    const consider = (cost, delta, act) => {
      if (!(delta > 0)) return;
      const wait = Math.max(0, cost - s.cash) / Math.max(g.income + g.feedIn, 1e-9);
      const score = cost / delta + wait;
      if (!best || score < best.score) best = { score, cost, act };
    };
    for (const p of D.PRODUCTS) {
      if (!g.productUnlocked(p.id) || !g.canOwnProduct(p.id)) continue;
      const lvl = s.products[p.id] || 0;
      let d;
      if (lvl > 0) {
        const unit = g.prodIncome[p.id] / (lvl * Math.pow(2, milestoneCount(lvl)));
        d = g.marginal((unit * (lvl + 1) * Math.pow(2, milestoneCount(lvl + 1)) - g.prodIncome[p.id]) / (g.incFactor || 1));
      } else {
        d = deltaIncome(g, () => { s.products[p.id] = 1; }, () => { delete s.products[p.id]; });
      }
      consider(g.productCost(p.id), d, () => {
        const bulk = g.productMax(p.id, s.cash * 0.25);
        g.buyProduct(p.id, Math.max(1, Math.min(bulk, 25)));
      });
    }
    for (const d of D.DEPTS) {
      if (!s.deptUnlocked[d.id] || !d.per.some((e) => e.t === 'income' || e.t === 'cat')) continue;
      const n = s.depts[d.id] || 0;
      const dd = deltaIncome(g, () => { s.depts[d.id] = n + 1; }, () => { s.depts[d.id] = n; });
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
      else dd = deltaIncome(g, () => { s.upgrades[u.id] = true; }, () => { delete s.upgrades[u.id]; });
      if (dd <= 0 && s.cash >= u.cost * 3) { g.buyUpgrade(u.id); bought = true; continue; }
      consider(u.cost, dd, () => g.buyUpgrade(u.id));
    }
    if (best && best.cost <= s.cash) { const c0 = s.cash; best.act(); bought = s.cash !== c0; }
  }
  // budżet badawczy rośnie z kolejnymi erami (gracz podkręca go, gdy gotówka się przelewa)
  if (!off.has('budget')) {
    const f = g.techCount() / D.TECHS.length;
    const want = f < 0.4 ? 0.1 : f < 0.7 ? 0.25 : 0.5;
    if (s.rdBudget !== want) g.setRdBudget(want);
  }
}

// Wspólne dla firmy: decyzje, autopilot, zarząd, rada nadzorcza.
function decideCompany() {
  const g = co.g;
  const m = co.meta;
  if (m.decision) { if (off.has('decisions')) m.decision = null; else g.chooseDecision('a', now); }
  if (g.apUnlocked()) for (const a of AUTOPILOT) if (!g.apOwned(a.id) && m.shares >= a.cost) g.buyAutopilot(a.id);
  if (off.has('board')) m.candidates = [];
  for (const c of [...m.candidates]) {
    const cur = m.board[c.role];
    if ((!cur || c.r > cur.r) && m.shares >= g.candidateCost(c)) g.hireExec(c.id, now);
    else if (cur && c.r <= cur.r) g.dismissCandidate(c.id);
  }
  if (m.shares > 0) {
    const order = ['p_click', 'p_trust', 'p_mentors', 'p_academy', 'p_seed', 'p_head', 'p_night', 'p_dream', 'p_auto', 'p_hr', 'p_brand', 'p_network'];
    let ok = true;
    while (ok) {
      ok = false;
      const cands = order.filter((id) => (m.perks[id] || 0) < PERKS.find((p) => p.id === id).max).sort((a, b) => g.perkCost(a) - g.perkCost(b));
      if (cands.length && m.shares >= g.perkCost(cands[0])) { g.buyPerk(cands[0]); ok = true; }
    }
  }
  // kolejna warstwa: otwieramy od razu i przenosimy się tam
  if (only !== 'earth') {
    const p = co.unlockProgress();
    if (p && p.ready && co.unlockLayer(p.id, now)) {
      note(`### OTWARTO WARSTWĘ ${p.id.toUpperCase()} (przychód ${fmt(p.revenue)}/rok, zasilanie ${fmt(co.layers[p.from].feedOut)}/s)`);
    }
  }
}

function decideAll() {
  for (const g of Object.values(co.layers)) decide(g);
  decideCompany();
}

function report() {
  for (const g of Object.values(co.layers)) {
    const s = g.s;
    const sn = seenOf(g);
    for (const p of g.D.PRODUCTS) if ((s.products[p.id] || 0) > 0 && !sn.products.has(p.id)) { sn.products.add(p.id); note(`${tag(g)} PRODUKT ${p.icon} ${TX.prodName(p.id)} (income $${fmt(g.income)}/s)`); }
    for (const d of g.D.DEPTS) if (s.deptUnlocked[d.id] && !sn.depts.has(d.id)) { sn.depts.add(d.id); note(`${tag(g)} DZIAŁ ${d.icon} ${TX.deptName(d.id)}`); }
    for (const tch of g.D.TECHS) if (s.techs[tch.id] && !sn.eras.has(tch.era)) { sn.eras.add(tch.era); note(`${tag(g)} ERA ${tch.era} (pierwsza tech: ${TX.techName(tch.id)}) rp/s=${fmt(g.rpRate)} inc $${fmt(g.income)}/s`); }
    if (!sn.eras.has('all') && g.allTechs()) { sn.eras.add('all'); note(`${tag(g)} PEŁNE DRZEWKO TECHNOLOGII`); }
  }
}

function maybePrestige(g) {
  const gain = g.prestigeGain();
  const last = lastPrestigeAt[g.D.id] || T0;
  if (gain >= 10 && gain >= g.s.investors * 1.0 && now - last > 3600 * 1000) {
    note(`${tag(g)} >>> RUNDA #${g.s.prestigeCount + 1}: +${fmt(gain)} (było ${fmt(g.s.investors)}), income $${fmt(g.income)}/s, runEarned $${fmt(g.s.runEarned)}, techs ${g.techCount()}, rp/s ${fmt(g.rpRate)}`);
    g.doPrestige(now);
    lastPrestigeAt[g.D.id] = now;
    seenOf(g).products.clear();
    decide(g);
  }
}

function status(g) {
  const s = g.s;
  note(`${tag(g)} stan: cash $${fmt(s.cash)} | $${fmt(g.income)}/s${g.feedIn ? ` (+zasilanie $${fmt(g.feedIn)}/s)` : ''} | klik $${fmt(g.clickValue)} | rp ${fmt(s.rp)} (+${fmt(g.rpRate)}/s) | techs ${g.techCount()}/${g.D.TECHS.length} | ups ${g.upgradeCount()} | ludzie ${g.totalHeads()} | inv ${fmt(s.investors)} | biura ${Object.keys(s.offices).length} | rundy ${s.prestigeCount}`);
  if (verbose) {
    const m = g.m;
    note(`      ${g.D.PRODUCTS.filter((p) => s.products[p.id]).map((p) => `${p.icon}${s.products[p.id]}`).join(' ')}`);
    note(`      all ${fmt(m.all)} dept(1+${fmt(m.incomePct)}) ach ${fmt(m.achMult)} inv ${fmt(m.invMult)} boost ${m.boostIncome} | zasięg ${fmt(g.marketCap)} raw ${fmt(g.rawIncome)}`);
    note(`      depts ${g.D.DEPTS.filter((d) => s.deptUnlocked[d.id]).map((d) => d.icon + (s.depts[d.id] || 0)).join(' ')}`);
    note(`      share ${g.D.PRODUCTS.filter((p) => s.products[p.id]).map((p) => p.icon + Math.round(100 * g.prodIncome[p.id] / g.income) + '%').join(' ')}`);
  }
}

const end = T0 + days * 86400 * 1000;
let nextReport = T0;
let sessionEnd = profile === 'casual' ? T0 + 20 * 60000 : end;
let decideTimer = 0;

while (now < end) {
  const active = now < sessionEnd;
  if (!active) {
    // przerwa offline 3 h (noc: 8 h co 5 sesji)
    const sessionIdx = Math.round((now - T0) / (3.33 * 3600 * 1000));
    const gap = sessionIdx % 5 === 4 ? 8 * 3600 : 3 * 3600;
    now += gap * 1000;
    co.tick(now);
    sessionEnd = now + 20 * 60000;
    decideAll();
    continue;
  }
  now += 1000;
  co.tick(now);
  const g = co.g;
  if (profile !== 'idle') {
    for (let i = 0; i < 4; i++) g.click(now);
    if (g.s.bubble) g.popBubble(now);
  }
  for (const L of Object.values(co.layers)) for (const o of [...L.s.contracts.offers]) L.acceptContract(o.id, now);
  decideTimer++;
  if (decideTimer >= 5) { decideTimer = 0; decideAll(); report(); }
  for (const L of Object.values(co.layers)) maybePrestige(L);
  if (now >= nextReport) {
    nextReport += (verbose ? 10 : (now - T0 < 3 * 3600e3 ? 15 : 120)) * 60000;
    for (const L of Object.values(co.layers)) status(L);
    note(`firma: skala ${co.meta.scaleMax} · K ${(kardashev(co.annualRevenue()) ?? 0).toFixed(2)} · osiągnięcia ${co.g.achCount()} · udziały ${fmt(co.meta.shares)} · zarząd ${Object.keys(co.meta.board).length}`);
  }
}

console.log(`\nProfil: ${profile}, ${days} dni`);
for (const g of Object.values(co.layers)) {
  console.log(`${tag(g)} techs ${g.techCount()}/${g.D.TECHS.length}, rundy ${g.s.prestigeCount}, kapitał ${fmt(g.s.investors)}, biura ${Object.keys(g.s.offices).length}/${g.D.OFFICES.length}, przychód $${fmt(g.income)}/s`);
}
console.log(`firma: osiągnięcia ${co.g.achCount()}, zarząd ${Object.keys(co.meta.board).length}, skala ${co.meta.scaleMax}`);

// --chal: na koniec bot próbuje każdego wyzwania (na Ziemi) przez 2 h aktywnej gry
if (process.argv.includes('--chal')) {
  const saved = JSON.parse(co.serialize());
  for (const ch of CHALLENGES) {
    co.load(JSON.parse(JSON.stringify(saved)), now);
    co.setLayer('earth');
    const g = co.layers.earth;
    const startTier = co.meta.challenges[ch.id] || 0;
    g.startChallenge(ch.id, now);
    let tnow = now;
    for (let i = 0; i < 2 * 3600; i++) {
      tnow += 1000;
      co.tick(tnow);
      for (let k = 0; k < 4; k++) g.click(tnow);
      if (i % 5 === 0) decide(g);
      if (!g.s.challenge && (co.meta.challenges[ch.id] || 0) < CHALLENGE_GOALS.length && i % 60 === 0) g.startChallenge(ch.id, tnow);
    }
    console.log(`wyzwanie ${ch.id}: poziomy ${startTier} → ${co.meta.challenges[ch.id] || 0} w 2 h (run $${fmt(g.s.runEarned)})`);
  }
}
