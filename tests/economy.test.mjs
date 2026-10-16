// Testy nowej ekonomii: zasięg rynku, ludzka skala na Ziemi, stopnie Kardaszowa z technologią, migracja zapisu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Game, TECH_CAP_STEP, capIncome, scaleIndex, SCALE_THRESHOLDS, SECONDS_PER_GAME_YEAR, SAVE_VERSION, createState,
} from '../js/engine.js';
import { TECHS, ERAS, PRODUCTS, MARKET_REACH, SCALE_LEVELS } from '../js/data.js';
import { SPACE } from '../js/layers.js';
import { EN } from '../js/lang/en.js';
import { setLang } from '../js/i18n.js';

setLang('pl');
const T0 = 1_700_000_000_000;
const newGame = () => new Game(null, { now: T0, rng: () => 0.5 });
const research = (g, maxEra) => { for (const t of TECHS) if (t.era <= maxEra) g.s.techs[t.id] = true; g.recalc(); };

test('Ziemia ma ery 1–7, Kosmos ery 8–10; produkty drożeją i mają tłumaczenia', () => {
  assert.deepEqual(ERAS.map((e) => e.id), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(SPACE.ERAS.map((e) => e.id), [8, 9, 10]);
  for (const D of [{ ERAS, TECHS, PRODUCTS }, SPACE]) {
    for (const e of D.ERAS) assert.ok(D.TECHS.some((t) => t.era === e.id), `era ${e.id}`);
    for (let i = 1; i < D.PRODUCTS.length; i++) assert.ok(D.PRODUCTS[i].cost > D.PRODUCTS[i - 1].cost, D.PRODUCTS[i].id);
    for (const p of D.PRODUCTS) {
      assert.ok(EN.products[p.id] && EN.products[p.id].ups.length === 7, p.id);
      assert.ok(!p.tech || D.TECHS.some((t) => t.id === p.tech), p.id);
    }
  }
});

test('zasięg rynku rośnie z każdą technologią i kończy się na erach', () => {
  const g = newGame();
  assert.equal(g.marketCapLog(), MARKET_REACH.base);
  for (let era = 1; era <= ERAS.length; era++) {
    research(g, era);
    assert.ok(Math.abs(g.marketCapLog() - MARKET_REACH.ends[era - 1]) < 1e-9, `era ${era}`);
  }
  for (const t of TECHS) assert.ok(TECH_CAP_STEP[t.id] > 0, t.id);
  assert.ok(TECH_CAP_STEP.agi < 0.5, 'na Ziemi technologia poszerza rynek o ułamek rzędu');
  // Kosmos: od rynku wielkości ziemskiej gospodarki do cywilizacji typu II
  const s = new Game(null, { now: T0, layer: 'space' });
  assert.equal(s.marketCapLog(), SPACE.MARKET_REACH.base);
  for (const t of SPACE.TECHS) s.s.techs[t.id] = true;
  s.recalc();
  assert.ok(Math.abs(s.marketCapLog() - SPACE.MARKET_REACH.ends.at(-1)) < 1e-9);
  assert.ok(SPACE.MARKET_REACH.base >= MARKET_REACH.ends.at(-1) - 1, 'Kosmos zaczyna się tam, gdzie kończy Ziemia');
});

test('nasycony rynek: przychód ponad zasięgiem rośnie z potęgą soft', () => {
  assert.equal(capIncome(50, 100), 50);
  const soft = 100 * Math.pow(1e3, MARKET_REACH.soft);
  assert.ok(soft < 100 * MARKET_REACH.maxOver);
  assert.ok(Math.abs(capIncome(100 * 1e3, 100) - soft) < 1e-9 * soft);
  assert.equal(capIncome(100 * 1e30, 100), 100 * MARKET_REACH.maxOver);
  const g = newGame();
  research(g, 7);
  g.s.investors = 1e12;
  for (const p of PRODUCTS) g.s.products[p.id] = 300;
  g.recalc();
  assert.ok(g.rawIncome > g.marketCap * 1e6, 'surowy przychód daleko ponad zasięgiem');
  assert.ok(Math.abs(g.income - capIncome(g.rawIncome, g.marketCap)) < 1e-9 * g.income);
  assert.ok(g.income <= g.marketCap * MARKET_REACH.maxOver * 1.000001, 'nigdy ponad maxOver × zasięg');
  const sum = Object.values(g.prodIncome).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - g.income) < 1e-6 * g.income, 'udziały produktów sumują się do przychodu');
  // przy nasyconym rynku kolejny poziom daje dużo mniej niż liniowo
  const lin = g.productUnit('bci') * g.incFactor;
  assert.ok(g.productDelta('bci') < lin);
  // umiarkowane nasycenie: wzrost z potęgą soft
  const h = newGame();
  research(h, 7);
  for (const p of PRODUCTS) if (h.productUnlocked(p.id)) h.s.products[p.id] = 150;
  h.recalc();
  assert.ok(h.rawIncome > h.marketCap && h.income < h.marketCap * MARKET_REACH.maxOver);
  assert.equal(h.incElastic, MARKET_REACH.soft);
});

test('na Ziemi przychód zostaje poniżej cywilizacji typu I, nawet przy ogromnym kapitale', () => {
  const g = newGame();
  research(g, 7);
  g.s.investors = 1e15;
  for (const p of PRODUCTS) g.s.products[p.id] = 500;
  g.recalc();
  const k1 = SCALE_THRESHOLDS[SCALE_LEVELS.findIndex((L) => L.k === 1)];
  assert.ok(g.annualRevenue() < k1, `roczny przychód ${g.annualRevenue()} < ${k1}`);
  assert.ok(g.clickValue <= g.marketCap * 1.01 + g.m.clickPct * g.income, 'kliknięcie nie przebija rynku');
  assert.equal(g.marketStage(), 'earth');
  const s = new Game(null, { now: T0, layer: 'space' });
  assert.equal(s.marketStage(), 'orbit');
  for (const t of SPACE.TECHS) s.s.techs[t.id] = true;
  assert.equal(s.marketStage(), 'solar');
});

test('stopnie Kardaszowa wymagają technologii, nie tylko pieniędzy', () => {
  const k3 = SCALE_LEVELS.findIndex((L) => L.k === 3);
  const huge = SCALE_THRESHOLDS[k3] * 10;
  const wealth = SCALE_LEVELS.findIndex((L) => L.v === 4.5e14);
  assert.equal(scaleIndex(huge), k3, 'bez ograniczeń: sam przychód');
  assert.equal(scaleIndex(huge, () => false), wealth, 'bez technologii kończy się na majątku ludzkości');
  assert.equal(scaleIndex(huge, (id) => id === 'satellites'), wealth + 1, 'satelity dają typ I');
  // typy I–II wymagają technologii z Kosmosu; dalsze czekają na galaktykę i wszechświat
  for (const L of SCALE_LEVELS) if (L.k !== undefined && L.k <= 2) assert.ok(SPACE.TECHS.some((t) => t.id === L.tech), `${L.name}: ${L.tech}`);
  for (const L of SCALE_LEVELS) if (L.k !== undefined) assert.ok(!TECHS.some((t) => t.id === L.tech), `${L.name} nie na Ziemi`);
  const g = newGame();
  research(g, 7);
  g.annualRevenue = () => huge;
  assert.equal(g.scaleIdx(), wealth);
  assert.ok(g.kardashevShown() < 1, 'pokazany stopień nie przekracza technologii');
});

test('migracja zapisu v1: badania zostają, gospodarka wraca do ludzkiej skali', () => {
  const old = createState(T0);
  old.v = 1;
  for (const t of TECHS) if (t.era <= 6) old.techs[t.id] = true;
  old.techs.connectome = true;
  old.cash = 1e40;
  old.investors = 6e9;
  old.meta.shares = 1234;
  old.totalEarned = 1e45;
  old.claimedRaw = 6e9;
  old.rp = 5e9;
  old.products = { landing: 500, cars: 476 };
  old.offices = { waw: 2, ber: 1 };
  old.meta.scaleMax = 14;
  for (let i = 0; i <= 14; i++) old.meta.achievements[`scale${i}`] = true;
  old.stats.maxIncome = 1e40;
  old.stats.bestRun = 1e44;
  const g = new Game(JSON.parse(JSON.stringify(old)), { now: T0, rng: () => 0.5 });
  assert.ok(g.migrated);
  assert.equal(g.s.v, SAVE_VERSION);
  assert.equal(g.s.migrateFrom, undefined);
  assert.ok(g.s.techs.connectome && g.s.techs.qubits, 'technologie zostają');
  assert.equal(g.s.offices.ber, 1);
  assert.equal(g.s.meta.shares, 1234);
  assert.equal(g.s.rp, 5e9);
  assert.ok(g.s.investors < 1e5 && g.s.investors > 10, `kapitał ${g.s.investors}`);
  assert.ok(g.s.cash < 1e15, 'gotówka po migracji w ludzkiej skali');
  assert.deepEqual(g.s.products, {});
  assert.ok(g.s.stats.bestRun < 1e20 && g.s.stats.maxIncome <= g.marketCap);
  const top = scaleIndex(g.marketCap * SECONDS_PER_GAME_YEAR, (id) => !!g.s.techs[id]);
  assert.ok(g.s.meta.scaleMax <= top);
  assert.ok(!g.s.meta.achievements[`scale${top + 1}`], 'osiągnięcia skali ponad technologię cofnięte');
  assert.ok(g.s.meta.achievements.scale0, 'niższe zostają');
  // kolejne wczytanie nie migruje ponownie
  const again = new Game(JSON.parse(g.serialize()), { now: T0, rng: () => 0.5 });
  assert.equal(again.migrated, false);
  assert.equal(again.s.investors, g.s.investors);
});

test('nowa gra nie przechodzi migracji, a mały kapitał zostaje nietknięty', () => {
  assert.equal(newGame().migrated, false);
  const old = createState(T0);
  old.v = 1;
  old.investors = 40;
  old.totalEarned = 1e12;
  const g = new Game(JSON.parse(JSON.stringify(old)), { now: T0, rng: () => 0.5 });
  assert.ok(g.migrated);
  assert.equal(g.s.investors, 40);
});
