// Testy rozbudowy: autopilot, wyzwania, skala cywilizacji, decyzje, historia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Game, AP_MAP, CHALLENGE_MAP, SCALE_THRESHOLDS, kardashev, scaleIndex, DECISION_FIRST, HISTORY,
} from '../js/engine.js';
import { AUTOPILOT, CHALLENGES, CHALLENGE_TIERS, CHALLENGE_REACH, SCALE_LEVELS, DECISIONS } from '../js/data.js';
import { EN } from '../js/lang/en.js';
import { ALL_CHALLENGES } from '../js/layers.js';
import { setLang } from '../js/i18n.js';
import * as TX from '../js/text.js';

setLang('pl');
const T0 = 1_700_000_000_000;
const newGame = () => new Game(null, { now: T0, rng: () => 0.5 });
// Gra po pierwszej rundzie, z kapitałem i udziałami
function veteran() {
  const g = newGame();
  g.s.prestigeCount = 1;
  g.s.meta.rounds = 1;
  g.s.investors = 50;
  g.s.meta.shares = 100;
  g.recalc();
  return g;
}

test('angielska treść obejmuje nowe systemy', () => {
  for (const a of AUTOPILOT) assert.ok(EN.autopilot[a.id], a.id);
  for (const c of ALL_CHALLENGES) assert.ok(EN.challenges[c.id], c.id);
  assert.equal(EN.scale.length, SCALE_LEVELS.length);
  assert.equal(EN.decisions.length, DECISIONS.length);
  for (const lang of ['pl', 'en']) {
    setLang(lang);
    DECISIONS.forEach((d, i) => {
      for (const k of [TX.decisionTitle(i), TX.decisionText(i), TX.decisionLabel(i, 'a'), TX.decisionLabel(i, 'b')]) {
        assert.ok(typeof k === 'string' && k.length > 1, `${lang} decyzja ${d.id}`);
      }
    });
    for (const c of ALL_CHALLENGES) assert.ok(TX.describeFx(c.fx).length > 3, `${lang} nagroda ${c.id}`);
  }
  setLang('pl');
});

test('autopilot: moduły po pierwszej rundzie, za udziały', () => {
  const fresh = newGame();
  fresh.s.meta.shares = 100;
  assert.equal(fresh.buyAutopilot('products'), false, 'przed pierwszą rundą niedostępny');
  const g = veteran();
  const cost = AP_MAP.products.cost;
  assert.ok(g.buyAutopilot('products'));
  assert.equal(g.s.meta.shares, 100 - cost);
  assert.equal(g.buyAutopilot('products'), false, 'drugi raz nie da się kupić');
  assert.ok(g.apOn('products'));
  assert.equal(g.toggleAutopilot('products'), false);
  assert.ok(!g.apOn('products'));
  g.toggleAutopilot('products');
  assert.ok(g.apOn('products'));
});

test('autopilot kupuje produkty i ulepszenia bez toastów', () => {
  const g = veteran();
  g.buyAutopilot('products');
  g.buyAutopilot('upgrades');
  const toasts = [];
  let structure = 0;
  g.on('toast', (x) => toasts.push(x));
  g.on('structure', () => structure++);
  g.s.cash = 1e6;
  const n = g.autopilotStep(T0);
  assert.ok(n > 0);
  assert.ok((g.s.products.landing || 0) > 0);
  assert.ok(g.income > 0);
  assert.ok(g.s.cash < 1e6);
  assert.equal(toasts.length, 0, 'autopilot nie zasypuje toastami');
  assert.ok(structure <= 1);
  assert.ok(g.s.stats.autoBuys >= n);
});

test('autopilot po powrocie inwestuje zarobki offline', () => {
  const g = veteran();
  g.buyAutopilot('products');
  g.s.products.landing = 10;
  g.recalc();
  const before = g.s.products.landing;
  g.applyOffline(T0 + 3600e3);
  assert.ok(g.s.products.landing > before || (g.s.products.notes || 0) > 0);
});

// Weteran po transcendencji: wyzwania są odblokowane.
function transcended() {
  const g = veteran();
  g.s.meta.transcend = 1;
  g.recalc();
  return g;
}

test('wyzwania: dopiero po transcendencji, start resetuje rundę i nakłada regułę', () => {
  const v = veteran();
  assert.equal(v.challengesUnlocked(), false, 'przed transcendencją zablokowane');
  assert.equal(v.startChallenge('noclick', T0), false);
  const g = transcended();
  g.s.products.landing = 30;
  g.s.cash = 5e5;
  g.recalc();
  assert.equal(g.startChallenge('nofeed', T0), false, 'wyzwanie Kosmosu nie startuje na Ziemi');
  assert.ok(g.startChallenge('noclick', T0));
  assert.deepEqual(g.s.products, {});
  assert.equal(g.s.challenge.id, 'noclick');
  assert.equal(g.click(T0), 0, 'kodowanie nic nie daje');
  g.abandonChallenge();
  assert.ok(g.click(T0) > 0);
});

test('wyzwania: limit produktów, tylko pierwszy dział, kryzys rynku', () => {
  const g = transcended();
  g.s.techs = { html: true, js: true, sql: true, smartphones: true, game2d: true, websockets: true, ajax: true, backend: true };
  g.startChallenge('focus', T0);
  g.s.cash = 1e15;
  let launched = 0;
  for (const id of ['landing', 'notes', 'shop', 'mobile', 'game', 'messenger']) if (g.buyProduct(id, 1)) launched++;
  assert.equal(launched, 5);
  assert.ok(!g.canOwnProduct('messenger'));
  assert.ok(g.buyProduct('landing', 1), 'posiadane produkty można rozwijać');

  g.startChallenge('solo', T0);
  g.s.cash = 1e15;
  assert.equal(g.unlockDept('rnd'), false);
  assert.ok(g.hire('dev', 1));

  g.abandonChallenge();
  const cap = g.marketCapLog();
  g.startChallenge('crisis', T0);
  assert.ok(Math.abs(g.marketCapLog() - (cap - 0.5)) < 1e-9, 'kryzys: rynek ok. 3× mniejszy');
  // cel liczony od pełnego rynku – kryzys nie obniża poprzeczki
  const goal = g.s.challenge.goal;
  g.abandonChallenge();
  assert.ok(Math.abs(goal / g.challengeGoal('crisis') - 1) < 1e-9);
});

test('wyzwania dalszych etapów: bez zasilania, bez autopilota, bez budżetu, bez lobbingu, bez ekspansji', async () => {
  const { Company } = await import('../js/engine.js');
  const co = new Company(null, { now: T0, rng: () => 0.5 });
  co.meta.transcend = 1;
  const e = co.layers.earth;
  for (const tch of e.D.TECHS) e.s.techs[tch.id] = true;
  for (const p of e.D.PRODUCTS) e.s.products[p.id] = 200;
  e.s.investors = 1e6;
  co.recalc();
  assert.ok(co.unlockLayer('space', T0));
  const sp = co.layers.space;
  co.feedLinks();
  assert.ok(sp.feedIn > 0);
  assert.ok(sp.startChallenge('nofeed', T0));
  co.feedLinks();
  assert.equal(sp.feedIn, 0, 'bez zasilania z Ziemi');
  sp.abandonChallenge();
  co.feedLinks();
  assert.ok(sp.feedIn > 0);
  // galaktyka i wszechświat w osobnych grach (reguły nie zależą od firmy)
  const gx = new Game(null, { now: T0, rng: () => 0.5, layer: 'galaxy' });
  gx.s.meta.transcend = 1;
  gx.s.meta.rounds = 1;
  gx.s.meta.shares = 100;
  gx.buyAutopilot('products');
  gx.startChallenge('manual', T0);
  gx.s.cash = 1e40;
  assert.equal(gx.autopilotStep(T0), 0, 'bez autopilota');
  gx.startChallenge('nobudget', T0);
  gx.s.deptUnlocked.astro = true;
  gx.setRdBudget(0.5);
  assert.equal(gx.m.rdShare, 0, 'bez budżetu badawczego');
  gx.startChallenge('freemarket', T0);
  gx.s.cash = 1e60;
  assert.equal(gx.buyLobby(), false);
  assert.equal(gx.brakeAvailable(), false);
  const u = new Game(null, { now: T0, rng: () => 0.5, layer: 'universe' });
  u.s.meta.transcend = 1;
  u.recalc();
  const withHq = u.m.dept.cartographers;
  u.startChallenge('noexpansion', T0);
  assert.ok(u.m.dept.cartographers < withHq, 'placówki bez premii');
});

test('wyzwania: cel daje trwałą, odczuwalną nagrodę, poszerza rynek etapu i kończy ograniczenie', () => {
  const g = transcended();
  g.s.products.landing = 50;
  g.s.products.notes = 25;
  g.recalc();
  let now = T0;
  for (let i = 0; i < 360; i++) { now += 5000; g.tick(now); g.click(now); }
  const cap = g.marketCapLog();
  const st = g.s.stats;
  assert.ok(st.peakEarn > st.peakNoClick && st.peakNoClick > 0, 'szczyt wpływów z kliknięciami i bez');
  // cel: nasycony rynek etapu (maxOver × zasięg bez lobbingu) × czas poziomu × współczynnik wyzwania
  const k = (id) => ALL_CHALLENGES.find((c) => c.id === id).goal || 1;
  const full = (log) => Math.pow(10, log) * g.D.MARKET_REACH.maxOver;
  const before = g.challengeGoal('noclick');
  g.s.investors = 1e9;
  g.recalc();
  assert.equal(g.challengeGoal('noclick'), before, 'kapitał z rund nie podnosi poprzeczki');
  assert.ok(Math.abs(g.challengeGoal('crisis') / (full(cap - 0.5) * CHALLENGE_TIERS[0].s * k('crisis')) - 1) < 1e-9, 'Kryzys: węższy rynek');
  g.startChallenge('noclick', now);
  const goal = g.s.challenge.goal;
  assert.ok(Math.abs(goal / (full(cap) * CHALLENGE_TIERS[0].s * k('noclick')) - 1) < 1e-9, 'cel = nasycony rynek etapu × czas');
  g.s.runEarned = goal;
  assert.ok(g.updateChallenge(T0));
  assert.equal(g.s.meta.challenges.noclick, 1);
  assert.equal(g.s.challenge, null);
  g.recalc();
  assert.equal(g.m.autoMult, 2, 'nagroda: auto-kliknięcia ×2');
  assert.ok(Math.abs(g.marketCapLog() - cap - CHALLENGE_REACH) < 1e-9, 'rynek etapu szerszy');
  // kolejne poziomy: dłuższy czas, kliknięcia liczą się w innych wyzwaniach, lobbing nie podnosi poprzeczki, są tylko 3
  assert.ok(Math.abs(g.challengeGoal('noclick') / (full(g.marketCapLog(false)) * CHALLENGE_TIERS[1].s * k('noclick')) - 1) < 1e-9);
  const focus = g.challengeGoal('focus');
  assert.ok(Math.abs(focus / (full(g.marketCapLog(false)) * CHALLENGE_TIERS[0].s * k('focus')) - 1) < 1e-9);
  g.s.cash = 1e300;
  g.buyLobby();
  g.recalc();
  g.updatePeak();
  assert.equal(g.challengeGoal('focus'), focus, 'lobbing nie podnosi poprzeczki');
  g.s.meta.challenges.noclick = CHALLENGE_TIERS.length;
  assert.equal(g.challengeGoal('noclick'), null, 'wszystkie poziomy');
  // reset etapu przerywa wyzwanie
  g.startChallenge('solo', T0);
  g.s.totalEarned = 1e14;
  g.doPrestige(T0);
  assert.equal(g.s.challenge, null);
  // nagrody: kamienie milowe, pierwszy dział, darmowy lobbing na start rundy
  g.s.meta.challenges.focus = 3;
  g.s.meta.challenges.crisis = 2;
  g.s.meta.challenges.solo = 1;
  g.recalc();
  assert.ok(Math.abs(g.msMult(50) - Math.pow(2.6, 2)) < 1e-9);
  assert.ok(g.m.dept.dev >= 3);
  g.s.totalEarned = 1e16;
  g.doPrestige(T0);
  assert.equal(g.s.lobby, 2, 'darmowy lobbing na start');
});

test('tempo zarabiania: średnia krocząca bez offline, wyzwań i zdjętego hamulca; runda wyzwania bez kapitału', () => {
  const g = transcended();
  g.s.products.landing = 80;
  g.s.investors = 1000;
  g.recalc();
  let now = T0;
  for (let i = 0; i < 360; i++) { now += 5000; g.tick(now); }
  const st = g.s.stats;
  const r = st.earnRate;
  assert.ok(r > 0);
  g.applyOffline(now + 8 * 3600e3);
  now += 8 * 3600e3 + 5000;
  g.tick(now);
  assert.ok(st.earnRate < r * 1.5, 'zarobki offline nie podbijają średniej');
  const inv = g.m.invMult;
  assert.ok(inv > 1);
  g.startChallenge('focus', now);
  assert.equal(g.m.invMult, 1, 'spółka-córka: kapitał etapu nie działa');
  assert.equal(g.brakeAvailable(), false, 'w wyzwaniu bez hamulca');
  const frozen = st.earnRate;
  for (let i = 0; i < 60; i++) { now += 5000; g.tick(now); }
  assert.equal(st.earnRate, frozen, 'średnia zamrożona w wyzwaniu');
  g.abandonChallenge();
  assert.ok(g.m.invMult > 1);
});

test('wyzwania: start nie łamie reguł (produkty na start, pusta kasa bez kodowania)', () => {
  const g = transcended();
  g.s.meta.perks.p_head = 5;
  for (const tch of g.D.TECHS) g.s.techs[tch.id] = true;
  g.recalc();
  assert.ok(g.m.startLevels > 0);
  g.startChallenge('focus', T0);
  assert.ok(g.ownedProductCount() <= 5, 'najwyżej 5 produktów także z rady nadzorczej');
  g.abandonChallenge();
  g.s.meta.perks = {};
  g.recalc();
  g.startChallenge('noclick', T0);
  assert.ok(g.s.cash >= g.productCost(g.D.PRODUCTS[0].id), 'jest za co kupić pierwszy produkt');
});

test('stare zapisy: poziomy wyzwań przycięte do 3, nieistniejące usunięte', async () => {
  const { sanitizeMeta } = await import('../js/engine.js');
  const m = sanitizeMeta({ challenges: { noclick: 5, minimal: 2, gone: 4 } }, T0);
  assert.deepEqual(m.challenges, { noclick: 3, minimal: 2 });
  assert.equal(m.transcend, 0);
});

test('skala cywilizacji: PKB Ziemi to ok. 0,73 w skali Kardaszowa', () => {
  assert.ok(Math.abs(kardashev(1.1e14) - 0.73) < 0.01);
  assert.ok(Math.abs(kardashev(SCALE_THRESHOLDS[SCALE_LEVELS.findIndex((l) => l.k === 2)]) - 2) < 1e-9);
  for (let i = 1; i < SCALE_THRESHOLDS.length; i++) assert.ok(SCALE_THRESHOLDS[i] > SCALE_THRESHOLDS[i - 1], `próg ${i}`);
  assert.equal(scaleIndex(10), -1);
  assert.equal(scaleIndex(1e5), 1);
  const g = newGame();
  const seen = [];
  g.on('scale', (i) => seen.push(i));
  g.s.products.landing = 50;
  g.recalc();
  g.updateScale();
  assert.ok(g.s.meta.scaleMax >= 0);
  assert.equal(seen.length, 1);
  g.updateScale();
  assert.equal(seen.length, 1, 'ten sam poziom nie ogłasza się drugi raz');
});

test('decyzje: pojawiają się z czasem, obie opcje działają', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  g.tick(T0 + 1000);
  assert.equal(g.s.meta.decision, null);
  let t = T0;
  while (!g.s.meta.decision && t < T0 + DECISION_FIRST + 60e3) { t += 1000; g.tick(t); }
  assert.ok(g.s.meta.decision, 'decyzja po kilku minutach gry');
  const cash = g.s.cash;
  // wymuszamy decyzję z gotówką od ręki
  g.s.meta.decision = { i: DECISIONS.findIndex((d) => d.id === 'bigtech'), at: t };
  const e = g.chooseDecision('a', t);
  assert.equal(e.t, 'cash');
  assert.ok(g.s.cash > cash);
  assert.equal(g.s.meta.decision, null);
  assert.equal(g.s.stats.decisions, 1);
  // premia z decyzji nie wpływa na wycenę
  const v = g.valuation();
  g.s.meta.decision = { i: DECISIONS.findIndex((d) => d.id === 'bigtech'), at: t };
  g.chooseDecision('b', t);
  assert.ok(g.m.boostIncome > 1);
  assert.ok(Math.abs(g.valuation() - v) / v < 0.01);
});

test('decyzje: nagroda odroczona wpływa także offline; badania bez działu R&D zamieniają się w gotówkę', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  const di = DECISIONS.findIndex((d) => d.a.fx.t === 'delayed');
  g.s.meta.decision = { i: di, at: T0 };
  const e = g.chooseDecision('a', T0);
  assert.equal(g.s.pending.length, 1);
  const cash = g.s.cash;
  g.applyOffline(T0 + (e.s + 60) * 1000);
  assert.equal(g.s.pending.length, 0);
  assert.ok(g.s.cash >= cash + e.cash);
  const rpOpt = DECISIONS.find((d) => d.a.fx.t === 'rp');
  assert.equal(g.decisionEffect(rpOpt.a.fx).t, 'cash');
});

test('historia: punkt co 5 minut i znacznik rundy finansowania', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  let t = T0;
  for (let i = 0; i < 16 * 60; i++) { t += 1000; g.tick(t); }
  assert.ok(g.s.history.short.length >= 3 && g.s.history.short.length <= 4, `${g.s.history.short.length}`);
  assert.equal(g.s.history.short[0].length, 3);
  g.s.totalEarned = 1e13;
  g.doPrestige(t);
  assert.equal(g.s.history.rounds.length, 1);
  assert.ok(HISTORY.shortMax >= 288);
  const copy = new Game(JSON.parse(g.serialize()), { now: t });
  assert.equal(copy.s.history.rounds.length, 1);
});

test('stary zapis bez nowych pól wczytuje się poprawnie', () => {
  const old = JSON.parse(newGame().serialize());
  for (const k of ['autopilot', 'challenge', 'challenges', 'decision', 'pending', 'history', 'scaleMax', 'nextDecisionAt', 'recentDecisions']) delete old[k];
  const g = new Game(old, { now: T0 });
  assert.deepEqual(g.s.meta.autopilot, { owned: {}, off: {} });
  assert.equal(g.s.meta.scaleMax, -1);
  assert.ok(Array.isArray(g.s.history.short));
  assert.ok(g.s.meta.nextDecisionAt > 0);
  g.tick(T0 + 1000);
});

test('ekspansja: biura wymagają technologii, kosztują coraz więcej i zostają po rundzie', async () => {
  const { OFFICE_MAP } = await import('../js/engine.js');
  const { OFFICES, OFFICE_MAX_LEVEL, OFFICE_LEVEL_COST } = await import('../js/data.js');
  const g = newGame();
  assert.equal(g.officeLevel('waw'), 1, 'siedziba od startu');
  g.s.cash = 1e30;
  assert.equal(g.openOffice('ber'), false, 'Berlin wymaga metodyk zwinnych');
  g.s.techs.agile = true;
  const c1 = g.officeCost('ber');
  assert.equal(c1, OFFICE_MAP.ber.cost);
  g.s.products.landing = 10;
  g.recalc();
  const before = g.income;
  assert.ok(g.openOffice('ber'));
  assert.ok(g.income > before, 'bonus z biura');
  assert.equal(g.officeCost('ber'), c1 * OFFICE_LEVEL_COST);
  g.openOffice('ber');
  g.openOffice('ber');
  assert.equal(g.officeLevel('ber'), OFFICE_MAX_LEVEL);
  assert.equal(g.openOffice('ber'), false, 'maksymalny poziom');
  g.s.totalEarned = 1e14;
  g.doPrestige(T0);
  assert.equal(g.officeLevel('ber'), OFFICE_MAX_LEVEL, 'biura zostają po rundzie');
  assert.ok(g.setView('ber'));
  assert.equal(g.setView('tyo'), false, 'widok tylko z otwartego biura');
  // każde biuro ma współrzędne albo jest w kosmosie, a jego technologia istnieje
  for (const o of OFFICES) {
    if (o.kind === 'earth') assert.ok(Math.abs(o.lat) <= 81 && Math.abs(o.lon) <= 180, o.id);
    if (o.req) assert.ok(g.techAvailable(o.req) !== undefined, o.id);
  }
  // Nowy Jork podnosi mnożnik wyceny
  g.s.techs.payments = true;
  const m0 = g.valuationMultiple();
  g.s.offices.nyc = 1;
  g.recalc();
  assert.ok(Math.abs(g.valuationMultiple() - m0 - 0.5) < 1e-9);
});

test('mapa świata ma sensowny kształt', async () => {
  const { WORLD } = await import('../js/worldmap.js');
  assert.equal(WORLD.rows.length * WORLD.step, 138);
  const bit = (lon, lat) => {
    const x = Math.floor((lon - WORLD.lon0) / WORLD.step);
    const y = Math.floor((WORLD.lat0 - lat) / WORLD.step);
    const v = parseInt(WORLD.rows[y][Math.floor(x / 4)], 16);
    return (v >> (3 - (x % 4))) & 1;
  };
  assert.equal(bit(21, 52), 1, 'Warszawa na lądzie');
  assert.equal(bit(-40, 30), 0, 'środek Atlantyku to woda');
  assert.equal(bit(135, -25), 1, 'Australia');
  assert.equal(bit(-160, 0), 0, 'Pacyfik');
});

test('giełda: po IPO, udziały dają premię, 51% to kontrola, rynek nie pompuje sam siebie', async () => {
  const { MARKET, COMPETITORS } = await import('../js/data.js');
  const g = newGame();
  g.s.cash = 1e40;
  assert.equal(g.buyStake('pear', 0.1), false, 'przed IPO giełda zamknięta');
  g.s.prestigeCount = MARKET.unlockRounds;
  g.s.products = { landing: 50, notes: 50 };
  g.recalc();
  g.sampleHistory(T0, true);
  assert.ok(g.s.stats.bestCore > 0);
  const base = g.marketBase();
  const mobileBefore = g.m.cat.mobile || 1;
  assert.ok(g.buyStake('pear', 0.1));
  assert.ok(Math.abs(g.stake('pear') - 0.1) < 1e-9);
  assert.ok((g.m.cat.mobile || 1) > mobileBefore, 'premia dla kategorii');
  let ctl = 0;
  g.on('control', () => ctl++);
  g.buyStake('pear', 0.41);
  assert.equal(ctl, 1, 'przejęcie kontroli');
  assert.equal(g.controlCount(), 1);
  // pełne udziały we wszystkim nie powodują lawinowego wzrostu wyceny
  for (const c of COMPETITORS) g.buyStake(c.id, 1);
  for (let i = 0; i < 20; i++) g.sampleHistory(T0 + i * 1000);
  assert.ok(Math.abs(g.marketBase() - base) / base < 1e-6, 'baza rynku stała');
  // sprzedaż zwraca gotówkę minus prowizja, ale nie liczy się do zarobków
  const earned = g.s.totalEarned;
  const cash = g.s.cash;
  const value = g.stakeValue('qleap');
  assert.ok(g.sellStake('qleap', 1));
  assert.ok(Math.abs(g.s.cash - cash - value * (1 - MARKET.fee)) / value < 1e-9);
  assert.equal(g.s.totalEarned, earned);
  // kurs się zmienia, ale w granicach
  let t = T0;
  for (let i = 0; i < 200; i++) { t += MARKET.every; g.updateMarket(t); }
  for (const c of COMPETITORS) {
    const sent = g.comp(c.id).sent;
    assert.ok(sent >= MARKET.sentMin && sent <= MARKET.sentMax, c.id);
  }
  // runda finansowania kasuje udziały
  g.s.totalEarned = 1e30;
  g.doPrestige(t);
  assert.deepEqual(g.s.market.stakes, {});
});

test('zarząd: kandydaci, zatrudnianie za udziały, poziomy i dziwactwa', async () => {
  const { BOARD, ROLES, QUIRKS } = await import('../js/data.js');
  const g = veteran();
  g.s.meta.shares = 1000;
  g.s.products.landing = 20;
  g.recalc();
  let t = T0;
  while (!g.s.meta.candidates.length && t < T0 + 3600e3) { t += 1000; g.tick(t); }
  assert.ok(g.s.meta.candidates.length > 0, 'headhunter przysyła kandydatów');
  // pula ma limit, nowi nie wypierają starych
  for (let i = 0; i < 10; i++) g.s.meta.candidates.length < BOARD.poolMax && g.s.meta.candidates.push(g.makeCandidate(t));
  assert.equal(g.s.meta.candidates.length, BOARD.poolMax);
  g.s.meta.nextCandidateAt = t;
  g.updateCandidates(t + 1);
  assert.equal(g.s.meta.candidates.length, BOARD.poolMax);
  // zatrudnienie kosztuje udziały i działa
  const c = { id: 999, role: 'cpo', r: 0, traits: [{ t: 'all', x: 1.2 }], q: null, n: 1, seed: 5, at: t };
  g.s.meta.candidates.push(c);
  const before = g.income;
  const shares = g.s.meta.shares;
  assert.ok(g.hireExec(999, t));
  assert.equal(g.s.meta.shares, shares - g.candidateCost(c));
  assert.ok(Math.abs(g.income / before - 1.2) < 1e-6, 'cecha działa');
  // doświadczenie rośnie z czasem (także offline)
  assert.equal(g.execLevel(g.s.meta.board.cpo, t), 1);
  assert.equal(g.execLevel(g.s.meta.board.cpo, t + 3 * 3.6e6), 3);
  assert.equal(g.execLevel(g.s.meta.board.cpo, t + 1e4 * 3.6e6), BOARD.maxLevel);
  // dziwactwo nocne działa tylko w nocy
  const e = { ...g.s.meta.board.cpo, q: 'night' };
  const night = new Date(2026, 9, 14, 23, 0).getTime();
  const noon = new Date(2026, 9, 14, 12, 0).getTime();
  assert.ok(g.quirkActive(e, night));
  assert.ok(!g.quirkActive(e, noon));
  g.weather = 'rain';
  assert.ok(g.quirkActive({ ...e, q: 'rain' }));
  // zarząd zostaje po rundzie finansowania
  g.s.totalEarned = 1e20;
  g.doPrestige(t);
  assert.ok(g.s.meta.board.cpo);
  assert.ok(g.fireExec('cpo'));
  assert.equal(g.s.meta.board.cpo, undefined);
  // każda rola i dziwactwo mają tłumaczenie
  for (const lang of ['pl', 'en']) {
    setLang(lang);
    for (const r of ROLES) assert.ok(TX.roleArea(r.id).length > 2);
    for (const q of QUIRKS) assert.ok(TX.quirkName(q.id).length > 2 && TX.quirkDesc(q.id).length > 5);
    for (const r of ROLES) for (const tr of r.traits) assert.ok(TX.describeFx([tr]).length > 3, `${lang} ${r.id} ${tr.t}`);
  }
  setLang('pl');
});

test('budżet badawczy: część przychodu zamienia się w punkty badań, wycena bez zmian', async () => {
  const { RD_BUDGET } = await import('../js/data.js');
  const g = newGame();
  g.s.products = { landing: 100, notes: 80 };
  g.recalc();
  assert.equal(g.setRdBudget(0.5), true);
  assert.equal(g.m.rdShare, 0, 'bez działu R&D budżet nie działa');
  g.s.deptUnlocked.rnd = true;
  g.setRdBudget(0);
  const v0 = g.valuation();
  const rp0 = g.rpRate;
  g.setRdBudget(0.25);
  assert.ok(Math.abs(g.netIncome - g.income * 0.75) < 1e-6);
  assert.ok(g.rpRate > rp0, 'więcej punktów badań');
  assert.ok(Math.abs(g.rpBudget - RD_BUDGET.k * Math.pow(g.income * 0.25, RD_BUDGET.p) * g.m.rp) < 1e-9);
  assert.ok(Math.abs(g.valuation() - v0) / v0 < 1e-9, 'wycena liczy przychód brutto');
  // gotówka rośnie o przychód netto
  const cash = g.s.cash;
  const net = g.netIncome;
  g.tick(T0 + 1000);
  assert.ok(Math.abs(g.s.cash - cash - net) / net < 1e-6);
  // potęgowy zwrot: 10× większy przychód to mniej niż 10× więcej badań
  const b1 = g.rpBudget;
  g.s.products.notes = 200;
  g.recalc();
  const incRatio = g.income / (b1 / RD_BUDGET.k / g.m.rp) ** (1 / RD_BUDGET.p) * 0.25;
  const ratio = g.rpBudget / b1;
  assert.ok(ratio > 1 && ratio < incRatio, `badania ×${ratio} przy przychodzie ×${incRatio}`);
  assert.equal(g.setRdBudget(0.33), false, 'tylko dozwolone progi');
});

test('nowe moduły autopilota: biura, przejęcia, decyzje, zarząd, giełda, rundy', async () => {
  const { MARKET, COMPETITORS, OFFICES } = await import('../js/data.js');
  const g = veteran();
  g.s.meta.shares = 1000;
  for (const id of ['offices', 'acq', 'decisions', 'board', 'market', 'rounds']) assert.ok(g.buyAutopilot(id), id);
  // biura: najtańsze dostępne, gdy kosztują najwyżej 1/4 gotówki
  const office = OFFICES.filter((o) => !o.hq).sort((a, b) => a.cost - b.cost)[0];
  if (office.req) g.s.techs[office.req] = true;
  g.recalc();
  g.s.cash = g.officeCost(office.id) * 4.5;
  g.autopilotStep(T0);
  assert.ok(g.officeLevel(office.id) >= 1, 'otwarte biuro');
  // przejęcia: z działem prawnym, gdy kosztują najwyżej połowę gotówki
  g.s.deptUnlocked.legal = true;
  const acq = g.D.ACQUISITIONS[0];
  g.s.cash = g.acqCost(acq.id) * 2.1;
  g.autopilotStep(T0);
  assert.ok(g.s.acquisitions[acq.id], 'przejęcie');
  // decyzje: po 15 s wybiera wariant wart więcej
  g.s.meta.decision = { i: 0, at: T0 };
  g.autopilotStep(T0 + 5000);
  assert.ok(g.s.meta.decision, 'za wcześnie');
  g.autopilotStep(T0 + 16000);
  assert.equal(g.s.meta.decision, null, 'rozstrzygnięta');
  // zarząd: pusty fotel, kandydat za najwyżej 1/3 udziałów
  g.s.meta.candidates = [g.makeCandidate(T0)];
  const cand = g.s.meta.candidates[0];
  g.autopilotStep(T0 + 17000);
  assert.equal(g.s.meta.board[cand.role]?.id, cand.id, 'zatrudniony');
  // giełda: tanie spółki do kontroli, po 5%
  g.s.prestigeCount = MARKET.unlockRounds;
  g.sampleHistory(T0, true);
  for (const c of COMPETITORS) g.comp(c.id).sent = 0.8;
  g.s.cash = 1e40;
  for (let i = 0; i < 12; i++) g.autopilotStep(T0 + 18000 + i * 1000);
  assert.ok(COMPETITORS.every((c) => g.stake(c.id) >= MARKET.control - 1e-9), 'kontrola nad tanimi spółkami');
  // rundy: dopiero gdy runda podwaja kapitał i trwa co najmniej 10 minut
  g.s.stats.runStartedAt = T0;
  g.s.totalEarned = 1e40;
  const before = g.s.prestigeCount;
  g.autopilotStep(T0 + 60000);
  assert.equal(g.s.prestigeCount, before, 'za krótka runda');
  let auto = null;
  g.on('autopilot', (a) => { auto = a; });
  g.autopilotStep(T0 + 11 * 60000);
  assert.equal(g.s.prestigeCount, before + 1, 'runda zamknięta');
  assert.ok(auto && auto.round > 0, 'zdarzenie z kapitałem z rundy');
  // w tle decyzje i zarząd czekają na warstwę na ekranie
  g.background = true;
  g.s.meta.decision = { i: 1, at: T0 };
  g.autopilotStep(T0 + 12 * 60000);
  assert.ok(g.s.meta.decision);
});

test('nowe perki rady: koszt biur, przejęć, produktów, miejsca na kontrakty, kapitał z rundy', () => {
  const g = veteran();
  g.s.meta.shares = 1e6;
  const office = g.D.OFFICES.find((o) => !o.hq).id;
  const oc = g.officeCost(office);
  const ac = g.acqCost(g.D.ACQUISITIONS[0].id);
  const pc = g.productCost('landing', 1);
  const slots = g.m.slots;
  const pres = g.m.prestige;
  for (const id of ['p_scout', 'p_ma', 'p_bulk', 'p_sales', 'p_banker', 'p_keys', 'p_bridge']) assert.ok(g.buyPerk(id), id);
  assert.ok(Math.abs(g.officeCost(office) / oc - 0.9) < 1e-9);
  assert.ok(Math.abs(g.acqCost(g.D.ACQUISITIONS[0].id) / ac - 0.88) < 1e-9);
  assert.ok(g.productCost('landing', 1) < pc);
  assert.equal(g.m.slots, slots + 1);
  assert.ok(Math.abs(g.m.prestige / pres - 1.08) < 1e-9);
  assert.ok(Math.abs(g.m.feedMult - 1.15) < 1e-9);
  assert.ok(g.m.clickPct >= 0.002);
});
