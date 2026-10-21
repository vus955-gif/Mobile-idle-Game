// Symulator balansu: bot gra w Krzemowe Imperium (wszystkie warstwy) i raportuje tempo postępu.
// Użycie: node tools/simulate.mjs [profil] [dni] [-v] [--no=budget,offices,cap,lobby,brake,...] [--chal] [--only=earth]
//   TRANSCEND=n — po przejściu gry zaczyna od zera (n razy); SAVE_STATE/LOAD_STATE — zapis i odczyt stanu,
//   SAVE_TIMES="5.8,6.4" — dodatkowe zapisy w tych dniach
//   profil: active (ciągła gra), casual (sesje 20 min co ~3 h), idle (bez klikania),
//   human (człowiek: SESS_PER_DAY sesji po SESS_MIN min między 7 a 23, HUMAN_CPS kliknięć/s,
//   łapie część bąbelków HUMAN_BUBBLE, zagląda do sklepu i kontraktów co HUMAN_LOOK s)
import { Company, Game, milestoneCount, kardashev, OFFLINE } from '../js/engine.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { PERKS, AUTOPILOT, COMPETITORS, MARKET, CHALLENGE_TIERS, LOBBY_RULES, BRAKE } from '../js/data.js';
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
const G = LAYERS.galaxy;
const U = LAYERS.universe;
if (process.env.RDK) E.RD_BUDGET.k = Number(process.env.RDK);
if (process.env.RDP) E.RD_BUDGET.p = Number(process.env.RDP);
if (process.env.SPACE_RDK) S.RD_BUDGET.k = Number(process.env.SPACE_RDK);
if (process.env.SPACE_RDP) S.RD_BUDGET.p = Number(process.env.SPACE_RDP);
// GALAXY_TECH="c0:r" — koszty technologii Galaktyki jako ciąg geometryczny.
if (process.env.GALAXY_TECH) {
  const [c0, r] = process.env.GALAXY_TECH.split(':').map(Number);
  G.TECHS.forEach((tch, i) => { tch.cost = c0 * Math.pow(r, i); });
}
// UNIVERSE_TECH="c0:r" — to samo dla Wszechświata.
if (process.env.UNIVERSE_TECH) {
  const [c0, r] = process.env.UNIVERSE_TECH.split(':').map(Number);
  U.TECHS.forEach((tch, i) => { tch.cost = c0 * Math.pow(r, i); });
}
// SPACE_TECH="c0:r" — koszty technologii Kosmosu jako ciąg geometryczny (w kolejności listy).
if (process.env.SPACE_TECH) {
  const [c0, r] = process.env.SPACE_TECH.split(':').map(Number);
  S.TECHS.forEach((tch, i) => { tch.cost = c0 * Math.pow(r, i); });
}
for (const pair of (process.env.TECHMUL || '').split(',').filter(Boolean)) {
  const [era, mul] = pair.split(':').map(Number);
  for (const D of [E, S]) for (const tch of D.TECHS) if (tch.era === era) tch.cost *= mul;
}

// LOBBY="krok:wzrost[:sekundy]" i BRAKE_CEIL — strojenie lobbingu i zdjęcia hamulca; --no=lobby wyłącza też lobbing autopilota.
if (process.env.LOBBY) {
  const [st, gr, sec] = process.env.LOBBY.split(':').map(Number);
  Object.assign(LOBBY_RULES, { step: st, growth: gr }, sec ? { costSeconds: sec } : {});
}
if (process.env.BRAKE_CEIL) BRAKE.ceiling = Number(process.env.BRAKE_CEIL);
// OFFLINE="10:0.75" — limit zarobku offline (h) i wydajność na start gry
if (process.env.OFFLINE) {
  const [h, eff] = process.env.OFFLINE.split(':').map(Number);
  Object.assign(OFFLINE, { cap: h * 3600 }, eff ? { eff } : {});
}
// CHAL_GOAL="1.2" (wszystkie wyzwania) albo "crisis:0.8,entropy:1.5" — współczynniki trudności wyzwań
for (const pair of (process.env.CHAL_GOAL || '').split(',').filter(Boolean)) {
  const [a, b] = pair.split(':');
  for (const id of LAYER_ORDER) for (const ch of LAYERS[id].CHALLENGES) if (b === undefined || ch.id === a) ch.goal = Number(b ?? a);
}
if (off.has('lobby')) Game.prototype.buyLobby = () => false;

let seed = Number(process.env.SEED || 12345);
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
// Zachowanie człowieka losuje osobny generator, żeby nie przestawiać losowości samej gry.
let hseed = seed ^ 0x5bd1e995;
const hrng = () => { hseed = (hseed * 1664525 + 1013904223) % 4294967296; return hseed / 4294967296; };

// Profil „human”: człowiek nie klika 4×/s przez całą sesję, nie łapie każdego bąbelka i nie przelicza
// zakupów co 5 sekund. Sesje są rozłożone w ciągu dnia (7:00–23:00), noc offline.
const HUMAN = {
  sessMin: Number(process.env.SESS_MIN || 20),
  perDay: Math.max(1, Number(process.env.SESS_PER_DAY || 5)),
  cps: Number(process.env.HUMAN_CPS ?? 1),
  bubble: Number(process.env.HUMAN_BUBBLE ?? 0.5),
  look: Math.max(1, Number(process.env.HUMAN_LOOK || 30)),
};
const human = profile === 'human';
// Początek kolejnej sesji człowieka po chwili t (ms od T0): dzień zaczyna się o 7:00 (= T0).
function humanNextStart(t) {
  const day = 86400e3;
  const step = HUMAN.perDay > 1 ? (16 * 3600e3 - HUMAN.sessMin * 60e3) / (HUMAN.perDay - 1) : day;
  const d = Math.floor(t / day);
  for (let k = 0; k < HUMAN.perDay; k++) {
    const s = d * day + k * step;
    if (s >= t) return s;
  }
  return (d + 1) * day;
}

const T0 = 1_700_000_000_000;
let now = T0;
const co = new Company(null, { now, rng });
// --no=cap: gra bez limitu rynku (przełącznik w ustawieniach)
if (off.has('cap')) { co.meta.settings.cap = false; co.recalc(); }
const t = () => fmtTime((now - T0) / 1000);
const note = (msg) => { console.log(`[${t().padStart(12)}] ${msg}`); };
const tag = (g) => g.D.icon;
const seen = {};
const seenOf = (g) => (seen[g.D.id] ||= { products: new Set(), depts: new Set([g.D.FIRST_DEPT]), eras: new Set() });
const lastPrestigeAt = {};

// Tempo z perspektywy gracza: kiedy przybywa technologii, nowych produktów i działów, biur i rund.
// Z tego liczymy najdłuższe przerwy między technologiami i sesje, w których w najnowszym etapie nic nie przybyło.
const track = {};
let sessions = [];
let curSession = null;
let passStart = T0;
function trackOf(g) {
  return (track[g.D.id] ||= {
    openedAt: now, fullAt: null, techTimes: [], prods: new Set(), depts: new Set(), offices: 0, rounds: g.s.prestigeCount,
    techs: new Set(Object.keys(g.s.techs).filter((k) => g.s.techs[k])),
  });
}
// Najnowszy otwarty etap — tam gracz czeka na postęp.
function frontierId() {
  let f = 'earth';
  for (const id of LAYER_ORDER) if (co.layers[id]) f = id;
  // po finale (pełne drzewko ostatniego etapu) sesje nie liczą się do tempa
  return f === LAYER_ORDER[LAYER_ORDER.length - 1] && co.layers[f].allTechs() ? 'finał' : f;
}
function startSession() {
  curSession = { start: now, frontier: frontierId(), events: 0 };
  sessions.push(curSession);
}
function scanProgress() {
  for (const g of Object.values(co.layers)) {
    const tr = trackOf(g);
    const s = g.s;
    let ev = 0;
    for (const tch of g.D.TECHS) if (s.techs[tch.id] && !tr.techs.has(tch.id)) { tr.techs.add(tch.id); tr.techTimes.push([now, tch.id]); ev++; }
    if (!tr.fullAt && g.allTechs()) tr.fullAt = now;
    for (const p of g.D.PRODUCTS) if ((s.products[p.id] || 0) > 0 && !tr.prods.has(p.id)) { tr.prods.add(p.id); ev++; }
    for (const d of g.D.DEPTS) if (s.deptUnlocked[d.id] && !tr.depts.has(d.id)) { tr.depts.add(d.id); ev++; }
    const offices = Object.values(s.offices).reduce((a, b) => a + b, 0);
    if (offices > tr.offices) { ev += offices - tr.offices; tr.offices = offices; }
    if (s.prestigeCount > tr.rounds) { ev += s.prestigeCount - tr.rounds; tr.rounds = s.prestigeCount; }
    if (ev && curSession && curSession.frontier === g.D.id) curSession.events += ev;
  }
}
function paceReport(label = '') {
  const d = (ms) => fmtTime(ms / 1000);
  const who = human
    ? `człowiek: ${HUMAN.perDay} × ${HUMAN.sessMin} min dziennie, ${HUMAN.cps} klik./s, łapie ${Math.round(HUMAN.bubble * 100)}% bąbelków, zagląda co ${HUMAN.look} s`
    : `bot, profil ${profile}`;
  console.log(`\nTempo z perspektywy gracza${label ? ` — ${label}` : ''} (${who}):`);
  const gaps = [];
  const ids = LAYER_ORDER.filter((id) => track[id]);
  ids.forEach((id, i) => {
    const tr = track[id];
    const g = co.layers[id];
    let prev = tr.openedAt;
    let worst = { gap: 0 };
    for (const [at, tid] of tr.techTimes) {
      const gap = at - prev;
      const n = sessions.filter((x) => x.start > prev && x.start <= at).length;
      gaps.push({ id, icon: g.D.icon, gap, at, tid, n });
      if (gap > worst.gap) worst = { gap, at, tid, n };
      prev = at;
    }
    const mine = sessions.filter((x) => x.frontier === id);
    let streak = 0;
    let maxStreak = 0;
    for (const x of mine) { streak = x.events ? 0 : streak + 1; maxStreak = Math.max(maxStreak, streak); }
    const next = ids[i + 1] && track[ids[i + 1]];
    console.log(`${g.D.icon} ${id.padEnd(8)} otwarty po ${d(tr.openedAt - passStart)}, pełne drzewko po ${tr.fullAt ? d(tr.fullAt - passStart) : '—'}`
      + ` (etap trwał ${tr.fullAt ? d(tr.fullAt - tr.openedAt) : '—'}), technologie ${tr.techTimes.length}/${g.D.TECHS.length}`);
    console.log(`   najdłuższa przerwa między technologiami: ${d(worst.gap)}${worst.tid ? ` (${worst.n} sesji, przed „${TX.techName(worst.tid)}”)` : ''}`
      + ` · puste sesje: ${mine.filter((x) => !x.events).length}/${mine.length}, najwięcej z rzędu ${maxStreak}`
      + (tr.fullAt && next ? ` · od pełnego drzewka do kolejnego etapu ${d(next.openedAt - tr.fullAt)}` : ''));
  });
  console.log('   5 najdłuższych przerw między technologiami:');
  for (const x of gaps.sort((a, b) => b.gap - a.gap).slice(0, 5)) {
    console.log(`     ${x.icon} ${d(x.gap).padStart(10)} (${x.n} sesji) przed „${TX.techName(x.tid)}” (po ${d(x.at - passStart)})`);
  }
}

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
    // lobbing, gdy kosztuje najwyżej 40% gotówki (--no=lobby wyłącza)
    if (!off.has('lobby') && g.lobbyCost() < s.cash * 0.4 && g.buyLobby()) bought = true;
    // zdjęcie hamulca, gdy daje co najmniej ×10 i kosztuje najwyżej połowę gotówki (--no=brake wyłącza)
    if (!off.has('brake') && g.brakeAvailable() && g.brakeGain >= 10 && g.brakeCost() < s.cash * 0.5 && g.releaseBrake(now)) {
      note(`${tag(g)} HAMULEC ZDJĘTY ×${fmt(g.brakeGain)} (lobbing ${s.lobby})`);
    }
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
    // przy limicie produktów człowiek wybiera najmocniejsze odblokowane, a nie pierwsze z brzegu
    const rl = g.rule();
    const topN = rl && rl.rule === 'maxProducts' ? new Set(D.PRODUCTS.filter((p) => g.productUnlocked(p.id)).slice(-rl.v).map((p) => p.id)) : null;
    for (const p of D.PRODUCTS) {
      if (!g.productUnlocked(p.id) || !g.canOwnProduct(p.id)) continue;
      if (topN && !(s.products[p.id] > 0) && !topN.has(p.id)) continue;
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
  // budżet badawczy: bot zostawia „Auto” (rośnie z kolejnymi erami); --no=budget to gracz, który ustawił 0%
  if (off.has('budget') && (s.rdAuto || s.rdBudget !== 0)) g.setRdBudget(0);
}

// Wspólne dla firmy: decyzje, autopilot, zarząd, rada nadzorcza.
function decideCompany() {
  const g = co.g;
  const m = co.meta;
  if (m.decision) { if (off.has('decisions')) m.decision = null; else g.chooseDecision('a', now); }
  if (g.apUnlocked()) for (const a of AUTOPILOT) if (!g.apOwned(a.id) && m.shares >= a.cost) g.buyAutopilot(a.id);
  // rundy zamyka bot według własnej reguły (chyba że --aprounds)
  if (!process.argv.includes('--aprounds')) m.autopilot.off.rounds = true;
  // --no=ap-market,ap-offices… wyłącza wybrane moduły autopilota
  for (const a of AUTOPILOT) if (off.has(`ap-${a.id}`)) m.autopilot.off[a.id] = true;
  if (off.has('board')) m.candidates = [];
  for (const c of [...m.candidates]) {
    const cur = m.board[c.role];
    if ((!cur || c.r > cur.r) && m.shares >= g.candidateCost(c)) g.hireExec(c.id, now);
    else if (cur && c.r <= cur.r) g.dismissCandidate(c.id);
  }
  if (m.shares > 0) {
    const order = ['p_click', 'p_trust', 'p_mentors', 'p_academy', 'p_seed', 'p_head', 'p_night', 'p_dream', 'p_auto', 'p_hr', 'p_brand', 'p_network',
      'p_keys', 'p_bulk', 'p_sales', 'p_scout', 'p_ma', 'p_banker', 'p_bridge'];
    let ok = true;
    while (ok) {
      ok = false;
      const cands = order.filter((id) => (m.perks[id] || 0) < PERKS.find((p) => p.id === id).max).sort((a, b) => g.perkCost(a) - g.perkCost(b));
      if (cands.length && m.shares >= g.perkCost(cands[0])) { g.buyPerk(cands[0]); ok = true; }
    }
  }
  // TRANSCEND=n: po przejściu gry bot zaczyna od zera (najwyżej n razy) i gra dalej
  if (co.canTranscend() && (m.transcend || 0) < Number(process.env.TRANSCEND || 0)) {
    scanProgress();
    paceReport(`przejście #${(m.transcend || 0) + 1}`);
    co.transcend(now);
    note(`### TRANSCENDENCJA #${co.meta.transcend}`);
    for (const k of Object.keys(track)) delete track[k];
    sessions = [];
    passStart = now;
    startSession();
    for (const k of Object.keys(seen)) delete seen[k];
    for (const k of Object.keys(lastPrestigeAt)) delete lastPrestigeAt[k];
    return;
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

// SAVE_STATE=plik zapisuje stan po symulacji, LOAD_STATE=plik zaczyna od niego (bez głównej pętli).
const fs = await import('node:fs');
if (process.env.LOAD_STATE) {
  const raw = JSON.parse(fs.readFileSync(process.env.LOAD_STATE, 'utf8'));
  // zegar symulacji rusza od chwili zapisu, inaczej etapy czekałyby na „przyszły” lastTick
  now = Math.max(now, ...Object.values(raw.layers || {}).map((l) => l.lastTick || 0));
  co.load(raw, now);
}
const end = process.env.LOAD_STATE ? now : T0 + days * 86400 * 1000;
let nextReport = T0;
let sessionEnd = profile === 'casual' ? T0 + 20 * 60000 : human ? T0 + HUMAN.sessMin * 60000 : end;
let decideTimer = 0;
let clickAcc = 0;
let lastBubble = null;
if (!process.env.LOAD_STATE) startSession();

// SAVE_TIMES="5.8,6.4" (dni) — dodatkowe zapisy stanu w tych chwilach: <SAVE_STATE bez .json>-<dzień>.json
const saveTimes = (process.env.SAVE_TIMES || '').split(',').filter(Boolean).map(Number).sort((a, b) => a - b);
function maybeSave() {
  while (saveTimes.length && now >= T0 + saveTimes[0] * 86400e3) {
    const d = saveTimes.shift();
    fs.writeFileSync(`${(process.env.SAVE_STATE || 'state.json').replace(/\.json$/, '')}-${d}.json`, co.serialize());
  }
}

while (now < end) {
  maybeSave();
  const active = now < sessionEnd;
  if (!active) {
    if (human) {
      // człowiek: następna sesja według planu dnia (noc offline)
      now = T0 + humanNextStart(now - T0);
      sessionEnd = now + HUMAN.sessMin * 60000;
    } else {
      // przerwa offline 3 h (noc: 8 h co 5 sesji)
      const sessionIdx = Math.round((now - T0) / (3.33 * 3600 * 1000));
      const gap = sessionIdx % 5 === 4 ? 8 * 3600 : 3 * 3600;
      now += gap * 1000;
      sessionEnd = now + 20 * 60000;
    }
    co.tick(now);
    startSession();
    decideAll();
    scanProgress();
    continue;
  }
  now += 1000;
  co.tick(now);
  const g = co.g;
  if (human) {
    // kliknięcia w średnim tempie człowieka; bąbelek łapie tylko czasem (raz o nim decyduje)
    clickAcc += HUMAN.cps;
    for (; clickAcc >= 1; clickAcc--) g.click(now);
    if (g.s.bubble && g.s.bubble !== lastBubble) {
      lastBubble = g.s.bubble;
      if (hrng() < HUMAN.bubble) g.popBubble(now);
    }
  } else if (profile !== 'idle') {
    for (let i = 0; i < 4; i++) g.click(now);
    if (g.s.bubble) g.popBubble(now);
  }
  // bot przyjmuje kontrakty co sekundę i co 5 s przelicza zakupy; człowiek robi jedno i drugie, gdy zagląda
  const look = human ? HUMAN.look : 5;
  decideTimer++;
  if (!human || decideTimer >= look) {
    for (const L of Object.values(co.layers)) for (const o of [...L.s.contracts.offers]) L.acceptContract(o.id, now);
  }
  if (decideTimer >= look) {
    decideTimer = 0;
    decideAll();
    report();
    scanProgress();
    if (human) for (const L of Object.values(co.layers)) maybePrestige(L);
  }
  if (!human) for (const L of Object.values(co.layers)) maybePrestige(L);
  if (now >= nextReport) {
    nextReport += (verbose ? 10 : (now - T0 < 3 * 3600e3 ? 15 : 120)) * 60000;
    for (const L of Object.values(co.layers)) status(L);
    note(`firma: skala ${co.meta.scaleMax} · K ${(kardashev(co.annualRevenue()) ?? 0).toFixed(2)} · osiągnięcia ${co.g.achCount()} · udziały ${fmt(co.meta.shares)} · zarząd ${Object.keys(co.meta.board).length}`);
  }
}

if (process.env.SAVE_STATE) fs.writeFileSync(process.env.SAVE_STATE, co.serialize());
console.log(`\nProfil: ${profile}, ${days} dni`);
for (const g of Object.values(co.layers)) {
  console.log(`${tag(g)} techs ${g.techCount()}/${g.D.TECHS.length}, rundy ${g.s.prestigeCount}, kapitał ${fmt(g.s.investors)}, biura ${Object.keys(g.s.offices).length}/${g.D.OFFICES.length}, przychód $${fmt(g.income)}/s`);
}
console.log(`firma: osiągnięcia ${co.g.achCount()}, zarząd ${Object.keys(co.meta.board).length}, skala ${co.meta.scaleMax}`);
if (!process.env.LOAD_STATE) { scanProgress(); paceReport(co.meta.transcend ? `przejście #${co.meta.transcend + 1}` : ''); }

// --chal[=etap]: po przejściu gry bot dostaje transcendencję (etapy zostają w obecnym stanie) i w każdym
// etapie próbuje po kolei poziomów każdego wyzwania, grając aktywnie (najwyżej CHAL_HOURS h na poziom).
const chalArg = process.argv.find((a) => a === '--chal' || a.startsWith('--chal='));
if (chalArg) {
  const onlyLayer = chalArg.includes('=') ? chalArg.split('=')[1] : null;
  co.meta.transcend = Math.max(1, co.meta.transcend || 0);
  co.recalc();
  const saved = co.serialize();
  const tStart = now;
  // człowiek gra wyzwanie w swoich sesjach, a offline też się liczy — limit to czas zegarowy (domyślnie 3 doby)
  const LIMIT = Number(process.env.CHAL_HOURS || (human ? 72 : 8)) * 3600e3;
  console.log(human
    ? `\nWyzwania (człowiek: ${HUMAN.perDay} × ${HUMAN.sessMin} min dziennie, czas zegarowy z przerwami; od stanu po przejściu gry):`
    : '\nWyzwania (gra aktywna, od stanu po przejściu gry):');
  for (const id of LAYER_ORDER) {
    if (onlyLayer && onlyLayer !== id) continue;
    for (const ch of LAYERS[id].CHALLENGES) {
      let tnow = tStart;
      co.load(JSON.parse(saved), tnow);
      const g = co.layers[id];
      if (!g) { console.log(`${id} ${ch.id}: etap nieotwarty`); continue; }
      co.setLayer(id);
      const times = [];
      for (let tier = 0; tier < CHALLENGE_TIERS.length; tier++) {
        if (!g.startChallenge(ch.id, tnow)) { times.push('start?'); break; }
        const goal = g.s.challenge.goal;
        const t0 = tnow;
        let ok = false;
        let k = 0;
        let nSess = 1;
        let sessEnd = human ? tnow + HUMAN.sessMin * 60000 : Infinity;
        while (tnow - t0 < LIMIT) {
          if (tnow >= sessEnd) {
            // człowiek odkłada telefon; wraca na następną sesję i od razu robi zakupy
            tnow = T0 + humanNextStart(tnow - T0);
            sessEnd = tnow + HUMAN.sessMin * 60000;
            nSess++;
            now = tnow;
            co.tick(tnow);
            decide(g);
          } else if (human) {
            tnow += 1000;
            now = tnow;
            co.tick(tnow);
            clickAcc += HUMAN.cps;
            for (; clickAcc >= 1; clickAcc--) g.click(tnow);
            if (g.s.bubble && g.s.bubble !== lastBubble) {
              lastBubble = g.s.bubble;
              if (hrng() < HUMAN.bubble) g.popBubble(tnow);
            }
            if (++k % HUMAN.look === 0) {
              for (const o of [...g.s.contracts.offers]) g.acceptContract(o.id, tnow);
              decide(g);
            }
          } else {
            tnow += 5000;
            now = tnow;
            co.tick(tnow);
            for (let c = 0; c < 20; c++) g.click(tnow);
            if (g.s.bubble) g.popBubble(tnow);
            for (const o of [...g.s.contracts.offers]) g.acceptContract(o.id, tnow);
            if (k++ % 3 === 0) decide(g);
          }
          if (!g.s.challenge) { ok = (co.meta.challenges[ch.id] || 0) > tier; break; }
        }
        const took = fmtTime((tnow - t0) / 1000) + (human ? ` (${nSess} ${nSess === 1 ? 'sesja' : 'sesji'})` : '');
        times.push(ok ? took : `NIE w ${LIMIT / 3600e3} h (${fmt(g.s.runEarned)} z ${fmt(goal)})`);
        if (!ok) break;
      }
      console.log(`${tag(g)} ${ch.id.padEnd(12)} ${times.map((x, i) => `P${i + 1}: ${x}`).join(' · ')}`);
    }
  }
}
