// Testy zmian pod gracza-człowieka: budżet badań „Auto”, tryb deweloperski i zegar gry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Company, Game, DEV_MULTS } from '../js/engine.js';
import { setLang } from '../js/i18n.js';

setLang('pl');
const T0 = 1_700_000_000_000;
const rng = () => 0.5;

test('budżet badań: domyślnie „Auto”, rośnie z kolejnymi erami, a ręczny wybór go wyłącza', () => {
  const g = new Game(null, { now: T0, rng });
  assert.equal(g.s.rdAuto, true);
  g.s.deptUnlocked[g.D.RD_DEPT] = true;
  g.recalc();
  assert.equal(g.m.rdShare, 0.1, 'na starcie 10%');
  for (const tch of g.D.TECHS.slice(0, Math.ceil(g.D.TECHS.length * 0.7))) g.s.techs[tch.id] = true;
  g.recalc();
  assert.equal(g.m.rdShare, 0.5, 'pod koniec drzewka 50%');
  g.setRdBudget(0.25);
  assert.equal(g.s.rdAuto, false);
  assert.equal(g.m.rdShare, 0.25);
  g.setRdAuto(true);
  assert.equal(g.m.rdShare, 0.5);
  // starsze zapisy: ręcznie ustawiony budżet zostaje ręczny, a 0% przechodzi na „Auto”
  const raw = JSON.parse(JSON.stringify(g.s));
  delete raw.rdAuto;
  raw.rdBudget = 0.25;
  assert.equal(new Game(raw, { now: T0, rng }).s.rdAuto, false);
  raw.rdBudget = 0;
  assert.equal(new Game(raw, { now: T0, rng }).s.rdAuto, true);
});

test('tryb deweloperski: mnożnik działa ponad limitem rynku, a szczyty zarobków liczą grę bez niego', () => {
  const g = new Game(null, { now: T0, rng });
  g.s.products[g.D.PRODUCTS[0].id] = 400;
  g.recalc();
  assert.ok(g.rawIncome > g.marketCap, 'rynek nasycony');
  const base = g.income;
  const baseRp = g.researchBase;
  assert.equal(g.devMult(), 1);
  g.s.meta.settings.devMult = 100;
  g.recalc();
  assert.equal(g.income, base, 'bez włączonego trybu mnożnik nie działa');
  g.s.meta.settings.dev = true;
  g.recalc();
  assert.ok(Math.abs(g.income / base - 100) < 1e-9, '×100 to naprawdę ×100');
  assert.ok(Math.abs(g.researchBase / baseRp - 100) < 1e-9, 'budżet badań liczy się od większego przychodu');
  let now = T0;
  for (let i = 0; i < 120; i++) { now += 1000; g.tick(now); }
  // w trakcie przybywa osiągnięć (+1% każde), więc porównujemy z bieżącym przychodem podzielonym przez mnożnik
  const plain = g.researchBase / 100;
  assert.ok(g.s.stats.peakIncome <= plain * (1 + 1e-9) && g.s.stats.peakIncome > plain * 0.5, 'szczyt bez mnożnika');
  assert.ok(g.s.stats.peakEarn < (g.income / 100) * 2, 'tempo zarabiania bez mnożnika');
  assert.deepEqual(DEV_MULTS, [1, 10, 100, 1000]);
  g.s.meta.settings.devMult = 7;
  assert.equal(g.devMult(), 1, 'nieznany mnożnik nie działa');
});

test('zegar gry: przesunięcie po przewinięciu czasu zostaje w zapisie i po transcendencji', () => {
  const co = new Company(null, { now: T0, rng });
  co.meta.clockOffset = 3600e3;
  co.meta.settings.dev = true;
  const again = new Company(JSON.parse(co.serialize()), { now: T0 + 3600e3, rng });
  assert.equal(again.meta.clockOffset, 3600e3);
  assert.equal(again.meta.settings.dev, true);
  again.canTranscend = () => true;
  assert.ok(again.transcend(T0 + 3600e3));
  assert.equal(again.meta.clockOffset, 3600e3, 'transcendencja nie cofa zegara');
  const bad = new Company({ meta: { clockOffset: -5, settings: { dev: 'tak', devMult: 3 } }, layers: {} }, { now: T0, rng });
  assert.equal(bad.meta.clockOffset, 0);
  assert.equal(bad.meta.settings.dev, false);
  assert.equal(bad.meta.settings.devMult, 1);
});
