// Testy silnika gry: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Game, createState, sanitizeState, UPGRADES, ACHIEVEMENTS, PRODUCT_MAP, milestoneCount, nextMilestone,
} from '../js/engine.js';
import { PRODUCTS, DEPTS, TECHS, PRODUCT_GROWTH } from '../js/data.js';
import { fmt, money, plural, fmtClock } from '../js/format.js';

const T0 = 1_700_000_000_000;
const newGame = () => new Game(null, { now: T0, rng: () => 0.5 });

test('formatowanie liczb po polsku', () => {
  assert.equal(fmt(0), '0');
  assert.equal(fmt(12.34), '12,3');
  assert.equal(fmt(999), '999');
  assert.equal(fmt(1234), '1,23 tys.');
  assert.equal(fmt(220000), '220 tys.');
  assert.equal(fmt(999999), '1 mln');
  assert.equal(fmt(2.5e9), '2,5 mld');
  assert.equal(money(1e12), '$1 bln');
  assert.match(fmt(1e80), /e80$/);
  assert.equal(fmtClock(65), '1:05');
});

test('polska odmiana liczebników', () => {
  assert.equal(plural(1, 'firma', 'firmy', 'firm'), 'firma');
  assert.equal(plural(3, 'firma', 'firmy', 'firm'), 'firmy');
  assert.equal(plural(5, 'firma', 'firmy', 'firm'), 'firm');
  assert.equal(plural(12, 'firma', 'firmy', 'firm'), 'firm');
  assert.equal(plural(22, 'firma', 'firmy', 'firm'), 'firmy');
});

test('zawartość: unikalne id i poprawne powiązania', () => {
  const ids = [...PRODUCTS, ...DEPTS, ...TECHS, ...UPGRADES, ...ACHIEVEMENTS].map((x) => x.id);
  const products = new Set(PRODUCTS.map((p) => p.id));
  const techs = new Set(TECHS.map((t) => t.id));
  for (const p of PRODUCTS) {
    if (p.tech) assert.ok(techs.has(p.tech), `brak technologii ${p.tech}`);
    assert.equal(p.ups.length, 7, `${p.id} powinien mieć 7 ulepszeń`);
  }
  for (const t of TECHS) {
    for (const r of t.req) assert.ok(techs.has(r), `${t.id} wymaga nieistniejącej ${r}`);
    for (const e of t.fx) if (e.t === 'prod' || e.t === 'unlockProduct') assert.ok(products.has(e.id), `${t.id}: ${e.id}`);
  }
  const uniqTechs = new Set(TECHS.map((t) => t.id));
  assert.equal(uniqTechs.size, TECHS.length);
  assert.equal(new Set(UPGRADES.map((u) => u.id)).size, UPGRADES.length);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  assert.ok(ids.length > 400);
});

test('każda technologia jest osiągalna (brak cykli w wymaganiach)', () => {
  const done = new Set();
  let progress = true;
  while (progress) {
    progress = false;
    for (const t of TECHS) if (!done.has(t.id) && t.req.every((r) => done.has(r))) { done.add(t.id); progress = true; }
  }
  assert.equal(done.size, TECHS.length);
});

test('klikanie zarabia, zakup produktu daje przychód', () => {
  const g = newGame();
  for (let i = 0; i < 20; i++) g.click(T0);
  assert.equal(g.s.cash, 20);
  assert.equal(g.buyProduct('landing', 1), 1);
  assert.equal(g.s.cash, 5);
  assert.ok(g.income > 0);
  g.tick(T0 + 1000);
  assert.ok(g.s.cash > 5);
});

test('koszt zakupu wielu sztuk = suma geometryczna', () => {
  const g = newGame();
  const p = PRODUCT_MAP.notes;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += p.cost * Math.pow(PRODUCT_GROWTH, i);
  assert.ok(Math.abs(g.productCost('notes', 10) - sum) / sum < 1e-9);
  g.s.cash = sum;
  assert.equal(g.productMax('notes'), 10);
  assert.equal(g.buyProduct('notes', 'max'), 10);
  assert.ok(g.s.cash >= 0 && g.s.cash < 1e-6 * sum);
});

test('produkty zablokowane technologią nie dają się kupić', () => {
  const g = newGame();
  g.s.cash = 1e9;
  assert.equal(g.buyProduct('shop', 1), 0);
  g.s.rp = 1000;
  assert.ok(g.research('html'));
  assert.ok(g.research('sql'));
  assert.equal(g.buyProduct('shop', 1), 1);
});

test('kamienie milowe podwajają przychód produktu', () => {
  assert.equal(milestoneCount(24), 0);
  assert.equal(milestoneCount(25), 1);
  assert.equal(nextMilestone(25), 50);
  const g = newGame();
  g.s.products.landing = 24;
  g.recalc();
  const a = g.prodIncome.landing / 24;
  g.s.products.landing = 25;
  g.recalc();
  const b = g.prodIncome.landing / 25;
  assert.ok(Math.abs(b / a - 2) < 1e-9);
});

test('dział: odblokowanie i zatrudnianie zwiększa przychód', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  const before = g.income;
  g.s.cash = 1e6;
  assert.equal(g.hire('dev', 10), 10);
  assert.ok(g.income > before);
  assert.ok(!g.s.deptUnlocked.rnd);
  assert.ok(g.unlockDept('rnd'));
  assert.equal(g.hire('rnd', 1), 1);
  assert.ok(g.rpRate > 0);
});

test('ulepszenia pojawiają się po spełnieniu warunku i działają', () => {
  const g = newGame();
  assert.ok(!g.availableUpgrades().some((u) => u.id === 'u_landing_0'));
  g.s.products.landing = 1;
  g.recalc();
  assert.ok(g.availableUpgrades().some((u) => u.id === 'u_landing_0'));
  const before = g.prodIncome.landing;
  g.s.cash = 1e6;
  assert.ok(g.buyUpgrade('u_landing_0'));
  assert.ok(Math.abs(g.prodIncome.landing / before - 2) < 1e-9);
});

test('runda finansowania: reset postępu, zachowanie technologii i kapitału', () => {
  const g = newGame();
  g.s.rp = 1000;
  g.research('html');
  g.s.totalEarned = 1e13;
  g.s.runEarned = 1e13;
  g.s.cash = 1e12;
  g.s.products.landing = 50;
  g.recalc();
  const gain = g.prestigeGain();
  assert.ok(gain >= 1);
  assert.equal(g.doPrestige(T0), gain);
  assert.equal(g.s.investors, gain);
  assert.equal(g.s.shares, gain);
  assert.equal(g.s.cash, 0);
  assert.deepEqual(g.s.products, {});
  assert.ok(g.s.techs.html);
  assert.equal(g.prestigeGain(), 0, 'nie można dostać kapitału dwa razy za te same zarobki');
  assert.ok(g.m.invMult > 1);
});

test('zarobki offline są ograniczone limitem i wydajnością', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.recalc();
  const inc = g.income;
  const res = g.applyOffline(T0 + 24 * 3600 * 1000);
  assert.ok(res.counted <= g.m.offlineCap);
  assert.ok(Math.abs(res.cash - inc * res.counted * res.eff) / res.cash < 1e-9);
  assert.ok(g.s.flags.patience);
});

test('bąbelki, trendy i kontrakty pojawiają się w czasie', () => {
  const g = newGame();
  g.s.products.landing = 10;
  g.s.cash = 1e7;
  g.unlockDept('rnd');
  g.unlockDept('design');
  g.s.cash = 1e8;
  g.unlockDept('marketing');
  g.s.cash = 1e9;
  assert.ok(g.unlockDept('sales'));
  let t = T0;
  let sawBubble = false;
  for (let i = 0; i < 1200; i++) {
    t += 1000;
    g.tick(t);
    if (g.s.bubble) { sawBubble = true; g.popBubble(t); }
    if (g.s.contracts.offers.length) g.acceptContract(g.s.contracts.offers[0].id, t);
  }
  assert.ok(sawBubble);
  assert.ok(g.s.stats.bubbles > 0);
  assert.ok(g.s.stats.contracts > 0);
});

test('zapis: serializacja i sanityzacja uszkodzonych danych', () => {
  const g = newGame();
  g.s.cash = 123;
  const copy = new Game(JSON.parse(g.serialize()), { now: T0 });
  assert.equal(copy.s.cash, 123);
  const broken = sanitizeState({ cash: 'abc', products: null, stats: { clicks: NaN } }, T0);
  assert.equal(broken.cash, 0);
  assert.deepEqual(broken.products, {});
  assert.equal(broken.stats.clicks, 0);
  assert.ok(broken.deptUnlocked.dev);
  assert.ok(createState(T0).settings);
});

test('osiągnięcia dają bonus do przychodu', () => {
  const g = newGame();
  g.s.products.landing = 1;
  g.recalc();
  const before = g.income;
  g.s.totalEarned = 1e6;
  const got = g.checkAchievements();
  assert.ok(got >= 3);
  assert.ok(g.income > before);
});
