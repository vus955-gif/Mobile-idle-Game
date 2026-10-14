// Testy rozbudowy: autopilot, wyzwania, skala cywilizacji, decyzje, historia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Game, AP_MAP, CHALLENGE_MAP, SCALE_THRESHOLDS, kardashev, scaleIndex, DECISION_FIRST, HISTORY,
} from '../js/engine.js';
import { AUTOPILOT, CHALLENGES, CHALLENGE_GOALS, SCALE_LEVELS, DECISIONS } from '../js/data.js';
import { EN } from '../js/lang/en.js';
import { setLang } from '../js/i18n.js';
import * as TX from '../js/text.js';

setLang('pl');
const T0 = 1_700_000_000_000;
const newGame = () => new Game(null, { now: T0, rng: () => 0.5 });
// Gra po pierwszej rundzie, z kapitałem i udziałami
function veteran() {
  const g = newGame();
  g.s.prestigeCount = 1;
  g.s.investors = 50;
  g.s.shares = 100;
  g.recalc();
  return g;
}

test('angielska treść obejmuje nowe systemy', () => {
  for (const a of AUTOPILOT) assert.ok(EN.autopilot[a.id], a.id);
  for (const c of CHALLENGES) assert.ok(EN.challenges[c.id], c.id);
  assert.equal(EN.scale.length, SCALE_LEVELS.length);
  assert.equal(EN.decisions.length, DECISIONS.length);
  for (const lang of ['pl', 'en']) {
    setLang(lang);
    DECISIONS.forEach((d, i) => {
      for (const k of [TX.decisionTitle(i), TX.decisionText(i), TX.decisionLabel(i, 'a'), TX.decisionLabel(i, 'b')]) {
        assert.ok(typeof k === 'string' && k.length > 1, `${lang} decyzja ${d.id}`);
      }
    });
    for (const c of CHALLENGES) assert.ok(TX.describeFx(c.fx).length > 3, `${lang} nagroda ${c.id}`);
  }
  setLang('pl');
});

test('autopilot: moduły po pierwszej rundzie, za udziały', () => {
  const fresh = newGame();
  fresh.s.shares = 100;
  assert.equal(fresh.buyAutopilot('products'), false, 'przed pierwszą rundą niedostępny');
  const g = veteran();
  const cost = AP_MAP.products.cost;
  assert.ok(g.buyAutopilot('products'));
  assert.equal(g.s.shares, 100 - cost);
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

test('wyzwania: start resetuje rundę i nakłada regułę', () => {
  const g = veteran();
  g.s.products.landing = 30;
  g.s.cash = 5e5;
  g.recalc();
  assert.ok(g.startChallenge('noclick', T0));
  assert.deepEqual(g.s.products, {});
  assert.equal(g.s.challenge.id, 'noclick');
  assert.equal(g.click(T0), 0, 'kodowanie nic nie daje');
  g.abandonChallenge();
  assert.ok(g.click(T0) > 0);
});

test('wyzwania: limit produktów, tylko programiści, bez ulepszeń, kryzys', () => {
  const g = veteran();
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

  g.startChallenge('minimal', T0);
  g.s.cash = 1e15;
  g.buyProduct('landing', 10);
  assert.deepEqual(g.availableUpgrades(), []);
  assert.equal(g.buyUpgrade('u_landing_0'), false);

  g.abandonChallenge();
  g.s.products = { landing: 10 };
  g.recalc();
  const normal = g.income;
  g.s.challenge = { id: 'crisis', tier: 0, start: T0 };
  g.recalc();
  assert.ok(Math.abs(g.income / normal - CHALLENGE_MAP.crisis.v) < 1e-9);
});

test('wyzwania: cel daje trwałą nagrodę i kończy ograniczenie', () => {
  const g = veteran();
  g.s.products = { landing: 10 };
  g.recalc();
  const base = g.income;
  g.startChallenge('noclick', T0);
  g.s.products = { landing: 10 };
  g.s.runEarned = CHALLENGE_GOALS[0];
  assert.ok(g.updateChallenge(T0));
  assert.equal(g.s.challenges.noclick, 1);
  assert.equal(g.s.challenge, null);
  g.recalc();
  assert.ok(Math.abs(g.income / base - 1.15) < 1e-6, 'nagroda: przychód ×1,15');
  assert.equal(g.challengeGoal('noclick'), CHALLENGE_GOALS[1]);
  // runda finansowania przerywa wyzwanie
  g.startChallenge('solo', T0);
  g.s.totalEarned = 1e14;
  g.doPrestige(T0);
  assert.equal(g.s.challenge, null);
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
  assert.ok(g.s.scaleMax >= 0);
  assert.equal(seen.length, 1);
  g.updateScale();
  assert.equal(seen.length, 1, 'ten sam poziom nie ogłasza się drugi raz');
});

test('decyzje: pojawiają się z czasem, obie opcje działają', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  g.tick(T0 + 1000);
  assert.equal(g.s.decision, null);
  let t = T0;
  while (!g.s.decision && t < T0 + DECISION_FIRST + 60e3) { t += 1000; g.tick(t); }
  assert.ok(g.s.decision, 'decyzja po kilku minutach gry');
  const cash = g.s.cash;
  // wymuszamy decyzję z gotówką od ręki
  g.s.decision = { i: DECISIONS.findIndex((d) => d.id === 'bigtech'), at: t };
  const e = g.chooseDecision('a', t);
  assert.equal(e.t, 'cash');
  assert.ok(g.s.cash > cash);
  assert.equal(g.s.decision, null);
  assert.equal(g.s.stats.decisions, 1);
  // premia z decyzji nie wpływa na wycenę
  const v = g.valuation();
  g.s.decision = { i: DECISIONS.findIndex((d) => d.id === 'bigtech'), at: t };
  g.chooseDecision('b', t);
  assert.ok(g.m.boostIncome > 1);
  assert.ok(Math.abs(g.valuation() - v) / v < 0.01);
});

test('decyzje: nagroda odroczona wpływa także offline; badania bez działu R&D zamieniają się w gotówkę', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  const di = DECISIONS.findIndex((d) => d.a.fx.t === 'delayed');
  g.s.decision = { i: di, at: T0 };
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
  assert.deepEqual(g.s.autopilot, { owned: {}, off: {} });
  assert.equal(g.s.scaleMax, -1);
  assert.ok(Array.isArray(g.s.history.short));
  assert.ok(g.s.nextDecisionAt > 0);
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
