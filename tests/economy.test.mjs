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

test('auto-kliknięcia sprzedają się na tym samym rynku: przy nasyceniu nie dokładają ponad zasięg', () => {
  const g = newGame();
  research(g, 7);
  g.s.investors = 1e12;
  for (const p of PRODUCTS) g.s.products[p.id] = 300;
  g.s.deptUnlocked.devops = true;
  g.s.depts.devops = 400;
  g.recalc();
  assert.ok(g.m.auto > 50 && g.autoIncome > 0);
  assert.ok(g.income <= g.marketCap * MARKET_REACH.maxOver * 1.000001, 'razem nie więcej niż pełny rynek');
  // bez nasycenia auto-kliknięcia dodają się w pełni
  const h = newGame();
  h.s.products.landing = 5;
  h.s.meta.perks.p_auto = 2;
  h.recalc();
  const flat = (h.D.CLICK_BASE + h.m.clickFlat) * h.m.click * (1 + h.m.clickMultAdd) * h.m.achMult * h.m.invMult;
  assert.ok(h.rawIncome < h.marketCap);
  assert.ok(Math.abs(h.autoIncome - h.m.auto * (flat + h.m.clickPct * (h.income - h.autoIncome))) < 1e-9 * h.autoIncome);
  // tick nie liczy auto-kliknięć drugi raz: zarobek = przychód netto × czas
  const c0 = h.s.cash;
  const n0 = h.netIncome;
  h.tick(T0 + 2000);
  assert.ok(Math.abs(h.s.cash - c0 - n0 * 2) < 1e-6 * n0 * 2);
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
  assert.ok(Math.abs(sum + g.autoIncome - g.income) < 1e-6 * g.income, 'produkty i auto-kliknięcia sumują się do przychodu');
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

test('limit rynku można wyłączyć w ustawieniach: przychód i kodowanie bez nasycenia', () => {
  const g = newGame();
  research(g, 2);
  for (const p of PRODUCTS.slice(0, 8)) g.s.products[p.id] = 400;
  g.recalc();
  assert.ok(g.rawIncome > g.marketCap * 10, 'rynek nasycony');
  const capped = g.income;
  assert.ok(capped < g.rawIncome);
  g.setCap(false);
  assert.equal(g.s.meta.settings.cap, false);
  assert.equal(g.income, g.rawIncome);
  assert.equal(g.incFactor, 1);
  assert.equal(g.marginal(5), 5);
  assert.ok(g.income > capped * 5);
  // zapis pamięta wybór, a włączenie przywraca nasycenie
  const g2 = new Game(JSON.parse(JSON.stringify(g.s)), { now: T0 });
  assert.equal(g2.capOn(), false);
  assert.equal(g2.income, g2.rawIncome);
  g.setCap(true);
  assert.equal(g.income, capped);
  // stary zapis bez ustawienia: limit włączony
  const raw = JSON.parse(JSON.stringify(g.s));
  delete raw.meta.settings.cap;
  assert.equal(new Game(raw, { now: T0 }).capOn(), true);
});

test('lobbing: poziomy poszerzają zasięg rynku w rundzie, drożeją i przepadają przy resecie', async () => {
  const { LOBBY_RULES, LOBBY } = await import('../js/data.js');
  const g = newGame();
  research(g, 3);
  const base = g.marketCapLog();
  const c0 = g.lobbyCost();
  assert.ok(Math.abs(c0 / (g.peakEarn() * LOBBY_RULES.costSeconds) - 1) < 1e-9, 'pierwszy poziom: minuta szczytowych zarobków');
  g.s.cash = c0 * 0.99;
  assert.equal(g.buyLobby(), false, 'za mało gotówki');
  g.s.cash = 1e300;
  for (let i = 0; i < LOBBY.length; i++) assert.ok(g.buyLobby(), `poziom ${i + 1}`);
  assert.equal(g.buyLobby(), false, 'najwyżej 8 poziomów');
  assert.ok(Math.abs(g.marketCapLog() - base - LOBBY.length * LOBBY_RULES.step) < 1e-9);
  assert.equal(g.lobbyCost(), Infinity);
  assert.ok(g.s.meta.flags.lobbyMax);
  // lobbing podnosi przychód, ale budżet badawczy liczy się od rynku bez lobbingu
  const h = newGame();
  research(h, 3);
  h.s.deptUnlocked.rnd = true;
  h.setRdBudget(0.25);
  for (const p of PRODUCTS.slice(0, 10)) h.s.products[p.id] = 500;
  h.recalc();
  h.checkAchievements();
  h.recalc();
  const inc = h.income;
  const rp = h.rpBudget;
  h.s.cash = 1e300;
  h.buyLobby();
  h.buyLobby();
  assert.ok(h.income > inc * 1.2, 'więcej przychodu');
  assert.ok(Math.abs(h.rpBudget / rp - 1) < 0.02, 'tyle samo punktów badań z budżetu (poza +1% za osiągnięcie)');
  // cena kolejnych poziomów liczy się od szczytowych zarobków bez lobbingu
  assert.ok(Math.abs(g.lobbyCost(3) / c0 - Math.pow(LOBBY_RULES.growth, 3)) < 1e-9);
  // ceny liczą się od szczytu realnych wpływów (średnia krocząca: produkty, kliknięcia, kontrakty) i nie spadają po resecie
  for (let i = 1; i <= 720; i++) h.tick(T0 + i * 5000);
  assert.ok(h.s.stats.earnRate > 0 && h.s.stats.peakEarn >= h.s.stats.earnRate, 'średnia i szczyt wpływów');
  h.s.stats.peakEarn = h.peakEarn() * 10;
  assert.ok(Math.abs(h.lobbyCost(0) / (h.s.stats.peakEarn * LOBBY_RULES.costSeconds) - 1) < 1e-9, 'cena od szczytu');
  const p1 = h.peakEarn();
  h.s.totalEarned = 1e20;
  h.doPrestige(T0 + 3600e3);
  assert.ok(h.peakEarn() >= p1, 'szczyt nie spada po resecie');
  g.s.totalEarned = 1e20;
  g.doPrestige(T0);
  assert.equal(g.s.lobby, 0, 'reset rundy kasuje lobbing');
  assert.ok(Math.abs(g.marketCapLog() - base) < 1e-9);
  // w piaskownicy lobbing nie jest potrzebny
  g.setCap(false);
  g.s.cash = 1e300;
  assert.equal(g.buyLobby(), false);
});

test('zdjęcie hamulca: raz na rundę, 5 minut bez nasycenia do ×1000 zasięgu, nie działa offline', async () => {
  const { BRAKE } = await import('../js/data.js');
  const g = newGame();
  research(g, 2);
  for (const p of PRODUCTS.slice(0, 8)) g.s.products[p.id] = 600;
  g.recalc();
  assert.ok(g.rawIncome > g.marketCap * 100, 'mocno nasycony rynek');
  const capped = g.income;
  const expected = Math.min(g.rawIncome, g.marketCap * BRAKE.ceiling) / capped;
  assert.ok(Math.abs(g.brakeGain - expected) / expected < 1e-9, 'podgląd zysku');
  g.s.cash = g.brakeCost() * 1.01;
  assert.ok(g.releaseBrake(T0));
  assert.ok(g.brakeActive());
  assert.ok(Math.abs(g.income - capped * expected) / g.income < 1e-9, 'przychód bez nasycenia');
  assert.ok(g.income <= g.marketCap * BRAKE.ceiling * (1 + 1e-9), 'sufit ×1000');
  g.s.cash = 1e300;
  assert.equal(g.releaseBrake(T0 + 1000), false, 'drugi raz w tej samej rundzie nie');
  // po 5 minutach hamulec wraca
  let off = 0;
  g.on('brake', (b) => { if (!b.on) off++; });
  g.tick(T0 + 1000);
  g.tick(T0 + 5000);
  g.s.lastTick = T0 + BRAKE.seconds * 1000 - 500;
  g.tick(T0 + BRAKE.seconds * 1000 + 1);
  assert.ok(!g.brakeActive());
  assert.equal(off, 1);
  const sat = capIncome(g.rawIncome, g.marketCap, MARKET_REACH);
  assert.ok(Math.abs(g.income - sat) / sat < 1e-9, 'znów z nasyceniem');
  // offline: zdjęty hamulec nie liczy się do zarobków
  const h = newGame();
  research(h, 2);
  for (const p of PRODUCTS.slice(0, 8)) h.s.products[p.id] = 600;
  h.recalc();
  h.s.cash = h.brakeCost();
  h.releaseBrake(T0);
  const before = h.s.cash;
  const normal = capped;
  const r = h.applyOffline(T0 + 3600e3);
  assert.ok(r.cash <= normal * 3600 * 1.0001 + 1, 'offline bez premii');
  assert.ok(h.s.cash >= before);
  assert.ok(!h.brakeActive());
  // po resecie rundy znów dostępny
  g.s.totalEarned = 1e20;
  g.doPrestige(T0 + 400e3);
  assert.ok(g.brakeAvailable());
});

test('drabinka produktów: w każdym etapie wyższy produkt zarabia na poziom więcej, a najnowszy najwięcej', async () => {
  const { developed, ladder, invest } = await import('../tools/ladder.mjs');
  const { LADDER_MIN, LAYER_ORDER, LAYERS } = await import('../js/layers.js');
  for (const id of LAYER_ORDER) {
    const rows = ladder(developed(id, 300));
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i].unit >= rows[i - 1].unit * LADDER_MIN * 0.98, `${id}: ${rows[i].id} vs ${rows[i - 1].id}`);
    }
    // racjonalny gracz: najnowszy produkt daje największą część przychodu
    const top = LAYERS[id].PRODUCTS[LAYERS[id].PRODUCTS.length - 1];
    const res = invest(id, top.cost * Math.pow(1.15, 300) * 20);
    const best = res.reduce((a, r) => (r.share > a.share ? r : a));
    assert.equal(best.id, top.id, `${id}: najwięcej zarabia ${best.id}`);
  }
});
