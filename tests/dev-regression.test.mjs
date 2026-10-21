import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Company, Game, EARN_TAU, clockOffsetOf, sanitizeClockOffset, createState } from '../js/engine.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { DECISIONS, CHALLENGE_TIERS } from '../js/data.js';
import { DEV_TOOLS } from '../js/config.js';
import { UI } from '../js/ui.js';

const T0 = 1_700_000_000_000;
const rng = () => 0.5;
const close = (a, b, message) => assert.ok(Math.abs(a - b) <= Math.max(1, Math.abs(b)) * 1e-10, `${message}: ${a} != ${b}`);
function developed(devTools = true) {
  const g = new Game(null, { now: T0, rng, devTools });
  g.s.products[g.D.PRODUCTS[0].id] = 400;
  g.s.deptUnlocked[g.D.RD_DEPT] = true;
  g.s.deptUnlocked[g.D.SALES_DEPT] = true;
  g.recalc();
  return g;
}

test('produkcja: zapis DEV nie włącza mnożnika, także po ponownej mutacji ustawień', () => {
  const dev = developed();
  dev.s.meta.settings.dev = true;
  dev.s.meta.settings.devMult = 1000;
  const raw = JSON.parse(dev.serialize());
  const prod = new Game(raw, { now: T0, rng, devTools: false });
  assert.equal(prod.devMult(), 1);
  assert.equal(prod.s.meta.settings.dev, false);
  assert.equal(prod.s.meta.settings.devMult, 1);
  prod.s.meta.settings.dev = true;
  prod.s.meta.settings.devMult = 1000;
  prod.recalc();
  assert.equal(prod.devMult(), 1);
});

test('zegar: null nie zamienia się w Number.MAX_VALUE', () => {
  const co = new Company({ meta: { clockOffset: null }, layers: {} }, { now: T0 });
  assert.equal(co.meta.clockOffset, 0);
});

test('szczyty: zmiana DEV między kliknięciem i tickiem nie zmienia wartości pomiaru', () => {
  const g = developed();
  g.s.meta.settings.dev = true;
  g.s.meta.settings.devMult = 1000;
  g.recalc();
  const click = g.click(T0);
  g.s.meta.settings.dev = false;
  g.recalc();
  g.trackEarn(0.05);
  const expected = click / 1000 / 0.05 * (1 - Math.exp(-0.05 / EARN_TAU));
  close(g.s.stats.peakEarn, expected, 'szczyt bez DEV');
  close(g.s.stats.clickRate, expected, 'kliknięcia bez DEV');
});

test('szczyty: kontrakt przyjęty w DEV i wypłacony bez DEV zachowuje bazę pomiaru', () => {
  const g = developed();
  const offer = { id: 1, dur: 1, f: 2, rp: false, expires: T0 + 60000 };
  const baseReward = g.contractReward(offer).cash;
  g.s.meta.settings.dev = true;
  g.s.meta.settings.devMult = 1000;
  g.recalc();
  g.s.contracts.offers.push(offer);
  assert.equal(g.acceptContract(1, T0), true);
  const raw = JSON.parse(g.serialize());
  raw.meta.settings.dev = false;
  const loaded = new Game(raw, { now: T0, rng, devTools: true });
  const cash = loaded.s.cash;
  loaded.updateContracts(T0 + 1000);
  loaded.trackEarn(1);
  close(loaded.s.cash - cash, baseReward * 1000, 'uzgodniona wypłata zostaje');
  close(loaded.s.stats.peakEarn, baseReward * (1 - Math.exp(-1 / EARN_TAU)), 'pomiar bez DEV');
});

test('DEV: mnożnik obejmuje również kliknięcia przed zakupem pierwszego produktu', () => {
  const g = new Game(null, { now: T0, rng, devTools: true });
  const plain = g.clickValue;
  g.s.meta.settings.dev = true;
  g.s.meta.settings.devMult = 100;
  g.recalc();
  close(g.clickValue, plain * 100, 'pierwsze kliknięcie');
});

function allLayers() {
  const co = new Company(null, { now: T0, rng, devTools: true });
  for (const id of LAYER_ORDER) {
    co.meta.unlocked[id] = true;
    const g = co.layers[id] || co.addLayer(id);
    g.s.products[g.D.PRODUCTS[0].id] = 400;
    g.s.deptUnlocked[g.D.RD_DEPT] = true;
    g.s.deptUnlocked[g.D.SALES_DEPT] = true;
    g.s.feed = id === 'universe' ? 0 : 0.25;
  }
  co.recalc();
  return co;
}

test('przełącznik DEV: ×10/×100/×1000 działa po włączeniu i znika we wszystkich warstwach po wyłączeniu', () => {
  for (const mult of [10, 100, 1000]) {
    const co = allLayers();
    const plain = new Company(JSON.parse(co.serialize()), { now: T0, rng, devTools: true });
    let saved;
    const ui = Object.assign(Object.create(UI.prototype), {
      co, sigs: {}, updateAll() {}, hooks: { save: () => { saved = co.serialize(); } },
    });
    ui.action('toggle-dev', { dataset: {} });
    ui.action('dev-mult', { dataset: { v: String(mult) } });
    for (const id of LAYER_ORDER) {
      assert.equal(co.layers[id].devMult(), mult);
      close(co.layers[id].income, plain.layers[id].income * mult, `${id} DEV ×${mult}`);
    }
    ui.action('toggle-dev', { dataset: {} });
    assert.equal(JSON.parse(saved).meta.settings.dev, false);
    for (const id of LAYER_ORDER) {
      const g = co.layers[id], base = plain.layers[id];
      assert.equal(g.devMult(), 1);
      for (const key of ['income', 'netIncome', 'clickValue', 'autoIncome', 'rpRate', 'researchBase', 'feedIn', 'feedOut']) {
        close(g[key], base[key], `${id}.${key} po wyłączeniu`);
      }
    }
    const loaded = new Company(JSON.parse(saved), { now: T0, rng, devTools: true });
    assert.equal(loaded.meta.settings.devMult, mult, 'wybrana wartość może pozostać zapamiętana');
    for (const g of Object.values(loaded.layers)) assert.equal(g.devMult(), 1, 'ale po przeładowaniu mnożnik nie działa');
    assert.equal(loaded.skipTime(3600, T0), false);
    loaded.tick(T0 + 60000);
    plain.tick(T0 + 60000);
    assert.deepEqual(JSON.parse(loaded.serialize()).layers, JSON.parse(plain.serialize()).layers, 'zwykłe dochody offline po przeładowaniu');
    loaded.reset(T0 + 60000);
    assert.equal(loaded.g.devMult(), 1, 'reset nie włącza wyłączonego DEV');
  }
});

test('silnik respektuje konfigurację wydania, a nowa gra zaczyna z wyłączonym DEV', () => {
  const co = new Company();
  const g = new Game();
  assert.equal(co.devTools, DEV_TOOLS);
  assert.equal(g.devTools, DEV_TOOLS);
  assert.equal(co.meta.settings.dev, false);
  assert.equal(g.s.meta.settings.dev, false);
  assert.equal(g.devMult(), 1);
});

test('produkcja: dochody, kliknięcia, R&D, transfery i offline czterech warstw są identyczne z czystym zapisem', () => {
  const source = allLayers();
  source.meta.clockOffset = 8 * 3600e3;
  for (const g of Object.values(source.layers)) g.s.lastTick = T0 + source.meta.clockOffset;
  const plain = JSON.parse(source.serialize());
  const dirty = structuredClone(plain);
  dirty.meta.settings.dev = true;
  dirty.meta.settings.devMult = 1000;
  // Pole z pliku nie jest opcją konstruktora.
  dirty.devTools = true;
  dirty.meta.devTools = true;
  const now = T0 + source.meta.clockOffset;
  const a = new Company(plain, { now, rng, devTools: false });
  const b = new Company(dirty, { now, rng, devTools: false });
  for (const id of LAYER_ORDER) {
    for (const key of ['income', 'netIncome', 'clickValue', 'autoIncome', 'rpRate', 'researchBase', 'feedIn', 'feedOut']) {
      close(b.layers[id][key], a.layers[id][key], `${id}.${key}`);
    }
    close(b.layers[id].click(now), a.layers[id].click(now), `${id} click`);
  }
  a.tick(now + 1000); b.tick(now + 1000);
  assert.deepEqual(JSON.parse(b.serialize()), JSON.parse(a.serialize()));
  a.tick(now + 8 * 3600e3); b.tick(now + 8 * 3600e3);
  assert.deepEqual(JSON.parse(b.serialize()), JSON.parse(a.serialize()));
  const again = new Company(JSON.parse(b.serialize()), { now: now + 8 * 3600e3, rng, devTools: true });
  assert.equal(again.g.devMult(), 1, 'wyczyszczone ustawienia nie wracają po eksporcie');
});

test('load/import: polityka produkcyjna zostaje po wielokrotnym wczytaniu', () => {
  const source = allLayers();
  source.meta.settings.dev = true;
  source.meta.settings.devMult = 100;
  const raw = JSON.parse(source.serialize());
  const original = structuredClone(raw);
  const co = new Company(null, { now: T0, rng, devTools: false });
  for (let i = 0; i < 2; i++) {
    co.load(raw, T0);
    for (const g of Object.values(co.layers)) assert.equal(g.devMult(), 1);
    assert.equal(co.meta.settings.dev, false);
  }
  assert.deepEqual(raw, original, 'wczytanie nie modyfikuje oryginału');
});

test('starsze v1/v2: import zachowuje technologie i regułę migracji budżetu', () => {
  for (const v of [1, 2]) for (const budget of [0, 0.1, 0.25, 0.5]) {
    const { meta, ...rest } = createState(T0);
    const flat = { ...meta, ...rest, v, techs: { html: true }, cash: 1234 };
    delete flat.rdAuto;
    flat.settings = { ...meta.settings, rdBudget: budget, dev: true, devMult: 1000 };
    const co = new Company(flat, { now: T0, rng, devTools: false });
    assert.equal(co.g.devMult(), 1);
    assert.equal(co.g.s.techs.html, true);
    assert.equal(co.g.s.rdBudget, budget);
    assert.equal(co.g.s.rdAuto, budget === 0);
    if (v === 2) assert.equal(co.g.s.cash, 1234);
    assert.equal(co.migrated, v === 1);
  }
});

test('budżet: granice 40% i 70%, ręczne 0% i zapis v3 we wszystkich etapach', () => {
  for (const id of LAYER_ORDER) {
    const g = new Game(null, { now: T0, rng, layer: id });
    g.s.deptUnlocked[g.D.RD_DEPT] = true;
    for (let n = 0; n <= g.D.TECHS.length; n++) {
      g.s.techs = Object.fromEntries(g.D.TECHS.slice(0, n).map(t => [t.id, true]));
      g.recalc();
      const f = n / g.D.TECHS.length;
      assert.equal(g.m.rdShare, f < 0.4 ? 0.1 : f < 0.7 ? 0.25 : 0.5);
    }
    g.setRdBudget(0);
    const loaded = new Game(JSON.parse(g.serialize()), { now: T0, rng, layer: id });
    assert.equal(loaded.s.rdAuto, false);
    assert.equal(loaded.m.rdShare, 0);
  }
});

test('zegar: jednakowa walidacja przy starcie, imporcie i sanityzacji meta', () => {
  for (const value of [undefined, null, -1, NaN, Infinity, '3600000', 0.5, {}, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER]) {
    const raw = { meta: { clockOffset: value }, layers: {} };
    assert.equal(sanitizeClockOffset(value), 0);
    assert.equal(clockOffsetOf(raw), 0);
    assert.equal(new Company(raw, { now: T0 }).meta.clockOffset, 0);
  }
  assert.equal(clockOffsetOf({ clockOffset: 3600e3 }), 3600e3, 'płaski zapis');
  assert.equal(clockOffsetOf({ meta: { clockOffset: 3600e3 } }), 3600e3);
});

test('zegar: wyłączenie DEV zachowuje terminy i płaci za rzeczywistą przerwę dokładnie raz', () => {
  const co = allLayers();
  co.meta.settings.dev = true;
  co.meta.settings.devMult = 100;
  assert.equal(co.skipTime(3600, T0), true);
  const raw = JSON.parse(co.serialize());
  const due = T0 + 3600e3 + 30000;
  raw.layers.earth.pending = [{ at: due, cash: 17, baseCash: 17 }];
  const now = T0 + 3600e3 + 60000;
  const prod = new Company(raw, { now, rng, devTools: false });
  const reports = [];
  prod.on('offline', r => reports.push(r));
  assert.equal(prod.meta.clockOffset, 3600e3);
  assert.equal(prod.g.s.pending[0].at, due);
  prod.tick(now);
  assert.equal(reports.length, 4);
  for (const report of reports) assert.equal(report.elapsed, 60);
  assert.equal(prod.g.s.pending.length, 0);
  const once = prod.serialize();
  prod.tick(now);
  assert.equal(prod.serialize(), once, 'brak podwójnej wypłaty');
  assert.equal(prod.skipTime(3600, T0 + 60000), false);
});

test('reset: nowa oś czasu, ustawienia zwykłe zachowane, DEV zależy od polityki wydania', () => {
  for (const devTools of [false, true]) {
    const co = new Company(null, { now: T0, rng, devTools });
    Object.assign(co.meta.settings, { dev: true, devMult: 100, cap: false, lang: 'en', sound: true, buyAmount: 10 });
    co.meta.clockOffset = 3600e3;
    co.g.s.cash = 100000;
    co.reset(T0 + 1000);
    assert.equal(co.meta.clockOffset, 0);
    assert.equal(co.g.s.lastTick, T0 + 1000);
    assert.equal(co.g.s.stats.runStartedAt, T0 + 1000);
    assert.equal(co.g.s.cash, 0);
    assert.deepEqual(Object.keys(co.layers), ['earth']);
    assert.equal(co.meta.settings.cap, false);
    assert.equal(co.meta.settings.lang, 'en');
    assert.equal(co.meta.settings.buyAmount, 10);
    assert.equal(co.g.devMult(), devTools ? 100 : 1);
    assert.equal(co.meta.settings.dev, devTools);
  }
});

test('runda i transcendencja: zachowany zegar, bez ponownego włączenia DEV w produkcji', () => {
  const source = allLayers();
  source.meta.clockOffset = 3600e3;
  source.meta.settings.dev = true;
  source.meta.settings.devMult = 1000;
  const now = T0 + 3600e3;
  const co = new Company(JSON.parse(source.serialize()), { now, rng, devTools: false });
  co.g.s.totalEarned = 1e16;
  assert.ok(co.g.doPrestige(now) > 0);
  assert.equal(co.g.devMult(), 1);
  for (const t of LAYERS.universe.TECHS) co.layers.universe.s.techs[t.id] = true;
  assert.equal(co.transcend(now), true);
  assert.equal(co.meta.clockOffset, 3600e3);
  assert.equal(co.g.s.lastTick, now);
  assert.equal(co.g.devMult(), 1);
});

test('przewijanie czasu: wymaga DEV i odrzuca niefinitywne/ujemne wartości', () => {
  const co = new Company(null, { now: T0, rng, devTools: true });
  assert.equal(co.skipTime(600, T0), false);
  co.meta.settings.dev = true;
  for (const n of [0, -1, NaN, Infinity, '600', Number.MAX_VALUE]) assert.equal(co.skipTime(n, T0), false);
  assert.equal(co.meta.clockOffset, 0);
  assert.equal(co.skipTime(600, T0), true);
  assert.equal(co.g.s.lastTick, T0 + 600e3);
});

test('szczyty: odroczona decyzja zachowuje bazę wypłaty po imporcie do produkcji', () => {
  const g = developed();
  const i = DECISIONS.findIndex(d => d.a.fx.t === 'delayed' || d.b.fx.t === 'delayed');
  assert.ok(i >= 0);
  const which = DECISIONS[i].a.fx.t === 'delayed' ? 'a' : 'b';
  const base = g.decisionEffect(DECISIONS[i][which].fx).cash;
  g.s.meta.settings.dev = true;
  g.s.meta.settings.devMult = 1000;
  g.recalc();
  g.s.meta.decision = { i, at: T0 };
  g.chooseDecision(which, T0);
  const raw = JSON.parse(g.serialize());
  const prod = new Game(raw, { now: T0, rng, devTools: false });
  const amount = prod.s.pending[0].cash;
  prod.updatePending(prod.s.pending[0].at);
  prod.trackEarn(1);
  close(prod.s.cash, amount, 'wypłata zachowana');
  close(prod.s.stats.peakEarn, base * (1 - Math.exp(-1 / EARN_TAU)), 'szczyt bazowy');
});

test('starsze kontrakty i nagrody: wypłata zachowana, nieznana baza pomijana w szczytach', () => {
  const g = developed(false);
  g.s.contracts.active.push({ id: 1, end: T0, reward: 10000, rpReward: 3 });
  g.s.pending.push({ at: T0, cash: 5000 });
  const loaded = new Game(JSON.parse(g.serialize()), { now: T0, rng, devTools: false });
  loaded.updateContracts(T0);
  loaded.updatePending(T0);
  loaded.trackEarn(1);
  assert.equal(loaded.s.cash, 15000);
  assert.equal(loaded.s.rp, 3);
  assert.equal(loaded.s.stats.peakEarn, 0);
});

test('wyzwania: cele wszystkich poziomów niezależne od DEV, kapitału i szczytów; zapis zachowuje aktywny cel', () => {
  for (const id of LAYER_ORDER) {
    const g = new Game(null, { now: T0, rng, layer: id, devTools: true });
    g.s.meta.transcend = 1;
    for (const ch of g.D.CHALLENGES) for (let tier = 0; tier < CHALLENGE_TIERS.length; tier++) {
      g.s.meta.challenges[ch.id] = tier;
      g.s.meta.settings.dev = false;
      g.recalc();
      const goal = g.challengeGoal(ch.id);
      g.s.meta.settings.dev = true;
      g.s.meta.settings.devMult = 1000;
      g.s.investors = 1e12;
      g.s.stats.peakEarn = 1e100;
      g.recalc();
      assert.equal(g.challengeGoal(ch.id), goal);
    }
    const ch = g.D.CHALLENGES[0];
    g.s.meta.challenges[ch.id] = 0;
    assert.equal(g.startChallenge(ch.id, T0), true);
    const raw = JSON.parse(g.serialize());
    raw.challenge.goal = 1234567; // już rozpoczęte wyzwanie ze starszej ekonomii
    const prod = new Game(raw, { now: T0, rng, layer: id, devTools: false });
    assert.equal(prod.s.challenge.goal, 1234567);
    assert.equal(prod.m.invMult, 1);
    if (id === 'galaxy') {
      prod.abandonChallenge();
      prod.s.deptUnlocked[prod.D.RD_DEPT] = true;
      prod.startChallenge('nobudget', T0);
      assert.equal(prod.m.rdShare, 0);
    }
  }
});
