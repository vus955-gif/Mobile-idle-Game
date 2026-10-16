// Testy warstw: Ziemia → Kosmos, wspólny stan firmy, zasilanie, zapis v3, fale kolonizacji.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Company, Game, createState, SAVE_VERSION, FEED_SHARES, LAYER_GRANT_SECONDS, SECONDS_PER_GAME_YEAR, SCALE_THRESHOLDS,
} from '../js/engine.js';
import { EARTH, SPACE, LAYERS, LAYER_ORDER } from '../js/layers.js';
import { SCALE_LEVELS } from '../js/data.js';
import { setLang } from '../js/i18n.js';
import * as TX from '../js/text.js';

setLang('pl');
const T0 = 1_700_000_000_000;
const rng = () => 0.5;
const newCo = () => new Company(null, { now: T0, rng });
// Ziemia z pełnym drzewkiem i przychodem ponad PKB Ziemi
function readyEarth(co) {
  const e = co.layers.earth;
  for (const t of EARTH.TECHS) e.s.techs[t.id] = true;
  e.s.investors = 1e6;
  for (const p of EARTH.PRODUCTS) e.s.products[p.id] = 200;
  co.recalc();
  return e;
}
function spaceCo() {
  const co = newCo();
  readyEarth(co);
  assert.ok(co.unlockLayer('space', T0));
  return co;
}

test('dane każdej warstwy są spójne: wymagania, odblokowania, kategorie', () => {
  for (const id of LAYER_ORDER) {
    const D = LAYERS[id];
    const techIds = new Set(D.TECHS.map((t) => t.id));
    for (const t of D.TECHS) {
      for (const r of t.req) assert.ok(techIds.has(r), `${id}/${t.id}: wymaga ${r}`);
      for (const e of t.fx) {
        if (e.t === 'unlockProduct') assert.ok(D.PRODUCT_MAP[e.id], `${t.id} → ${e.id}`);
        if (e.t === 'unlockDept') assert.ok(D.DEPT_MAP[e.id], `${t.id} → ${e.id}`);
        if (e.t === 'prod') assert.ok(D.PRODUCT_MAP[e.id], `${t.id}: prod ${e.id}`);
        if (e.t === 'cat') assert.ok(D.CATEGORIES[e.cat], `${t.id}: kategoria ${e.cat}`);
      }
    }
    for (const p of D.PRODUCTS) assert.ok(D.CATEGORIES[p.cat], `${p.id}: kategoria`);
    for (const d of D.DEPTS) assert.ok(!d.tech || techIds.has(d.tech), `${d.id}: ${d.tech}`);
    for (const o of D.OFFICES) assert.ok(!o.req || techIds.has(o.req), `${o.id}: ${o.req}`);
    for (const r of D.REPEAT_TECHS) for (const q of r.req) assert.ok(techIds.has(q), `${r.id}: ${q}`);
    for (const k of ['FIRST_DEPT', 'RD_DEPT', 'SALES_DEPT', 'LEGAL_DEPT']) assert.ok(D.DEPT_MAP[D[k]], `${id}: ${k}`);
    assert.ok(D.OFFICE_MAP[D.HQ] && D.OFFICE_MAP[D.HQ].hq, `${id}: siedziba`);
    // identyfikatory osiągnięć są unikalne w całej grze
  }
  const all = LAYER_ORDER.flatMap((id) => LAYERS[id].ACHIEVEMENTS.map((a) => a.id));
  assert.equal(new Set(all).size, all.length, 'unikalne osiągnięcia');
  const ups = LAYER_ORDER.flatMap((id) => LAYERS[id].UPGRADES.map((u) => u.id));
  assert.equal(new Set(ups).size, ups.length, 'unikalne ulepszenia');
});

test('nowa firma: tylko Ziemia, Kosmos wymaga pełnego drzewka i przychodu ponad PKB Ziemi', () => {
  const co = newCo();
  assert.deepEqual(Object.keys(co.layers), ['earth']);
  assert.equal(co.g, co.layers.earth);
  assert.equal(co.nextLayer(), 'space');
  let p = co.unlockProgress();
  assert.equal(p.ready, false);
  assert.equal(p.techsNeed, EARTH.TECHS.length);
  assert.equal(co.unlockLayer('space'), false);
  // samo drzewko nie wystarczy
  const e = co.layers.earth;
  for (const t of EARTH.TECHS) e.s.techs[t.id] = true;
  co.recalc();
  p = co.unlockProgress();
  assert.equal(p.techs, p.techsNeed);
  assert.equal(p.ready, false, 'bez przychodu');
  readyEarth(co);
  p = co.unlockProgress();
  assert.ok(p.revenue >= p.need && p.ready, `przychód ${p.revenue} ≥ ${p.need}`);
});

test('otwarcie Kosmosu: grant od Ziemi, zasilanie 25% i wspólny stan firmy', () => {
  const co = spaceCo();
  const e = co.layers.earth;
  const s = co.layers.space;
  assert.equal(co.g, s, 'Kosmos staje się aktywny');
  assert.ok(e.background && !s.background);
  assert.ok(co.meta.unlocked.space);
  assert.equal(e.s.feed, 0.25);
  assert.ok(Math.abs(s.s.cash - e.income * LAYER_GRANT_SECONDS) < 1e-6 * s.s.cash, 'grant: 10 minut przychodu Ziemi');
  assert.ok(e.s.meta === s.s.meta && s.s.meta === co.meta, 'meta to jeden obiekt');
  // zasilanie: Ziemia oddaje część przychodu, Kosmos ją dostaje
  assert.ok(Math.abs(e.netIncome - e.income * 0.75) < 1e-9 * e.income);
  assert.ok(Math.abs(s.feedIn - e.feedOut) < 1e-9 * e.feedOut && e.feedOut > 0);
  const cash = s.s.cash;
  co.tick(T0 + 1000);
  assert.ok(s.s.cash > cash, 'Kosmos zarabia z zasilania, zanim ma produkty');
  assert.equal(s.s.runEarned, 0, 'zasilanie nie liczy się do fali kolonizacji');
  // przełączanie zasilania
  assert.ok(e.setFeed(0));
  co.feedLinks();
  assert.equal(s.feedIn, 0);
  assert.equal(e.setFeed(0.33), false);
  for (const f of FEED_SHARES) assert.ok(e.setFeed(f));
});

test('Kosmos startuje od zera: własne produkty, działy, drzewko i siedziba', () => {
  const co = spaceCo();
  const s = co.layers.space;
  assert.deepEqual(s.s.depts, { engineers: 0 });
  assert.deepEqual(s.s.offices, { leo: 1 });
  assert.equal(s.techCount(), 0);
  assert.ok(s.productUnlocked('launch') && !s.productUnlocked('orbital'));
  assert.ok(s.clickValue >= SPACE.CLICK_BASE * 0.5, 'start rakiety wart jest miliony');
  assert.ok(s.buyProduct('launch', 10) === 10);
  assert.ok(s.unlockDept('mission'));
  s.hire('mission', 5);
  assert.ok(s.rpRate > 0);
  s.s.rp = 1e5;
  assert.ok(s.research('rockets'));
  assert.ok(s.research('satellites'));
  assert.ok(s.productUnlocked('orbital'));
  // technologie Kosmosu liczą się do skali całej firmy (typ I wymaga satelitów)
  assert.ok(co.layers.earth.hasTech('satellites'));
});

test('fala kolonizacji: koloniści i udziały, Ziemia zostaje nietknięta', () => {
  const co = spaceCo();
  const e = co.layers.earth;
  const s = co.layers.space;
  const earthRound = e.s.prestigeCount;
  const rounds = co.meta.rounds;
  const shares = co.meta.shares;
  s.s.products.launch = 50;
  s.s.techs.rockets = true;
  s.s.totalEarned = SPACE.PRESTIGE.div * 1000;
  s.recalc();
  const gain = s.prestigeGain();
  assert.ok(gain >= 10, `koloniści: ${gain}`);
  assert.equal(s.doPrestige(T0), gain);
  assert.equal(s.s.investors, gain);
  assert.equal(co.meta.shares, shares + gain);
  assert.equal(co.meta.rounds, rounds + 1);
  assert.deepEqual(s.s.products, {});
  assert.ok(s.s.techs.rockets, 'technologie zostają');
  assert.equal(e.s.prestigeCount, earthRound, 'runda Ziemi bez zmian');
  assert.ok(s.m.invMult > 1, 'koloniści zwiększają przychód Kosmosu');
});

test('wspólne premie: osiągnięcia z Kosmosu przyspieszają też Ziemię', () => {
  const co = spaceCo();
  const e = co.layers.earth;
  const s = co.layers.space;
  const before = e.m.achMult;
  s.checkAchievements();
  assert.ok(co.meta.achievements.f_space, 'mały krok');
  assert.ok(e.m.achMult > before, 'mnożnik osiągnięć Ziemi rośnie');
  // zarząd i rada nadzorcza działają w każdej warstwie
  co.meta.perks.p_click = 3;
  co.recalc();
  assert.ok(s.m.click >= 8 && e.m.click >= 8);
  // osiągnięcia za zarobki liczą całą firmę
  s.s.totalEarned = 2e18;
  e.checkAchievements();
  assert.ok(co.meta.achievements.earn6, 'earn 1e18 z przychodu Kosmosu');
});

test('warstwa w tle liczy przychód i autopilota, ale nie losuje bąbelków ani decyzji', () => {
  const co = spaceCo();
  const e = co.layers.earth;
  co.layers.space.buyProduct('launch', 5);
  e.s.nextBubbleAt = T0;
  co.meta.nextDecisionAt = T0;
  co.meta.decision = null;
  const cash = e.s.cash;
  co.tick(T0 + 2000);
  co.tick(T0 + 4000);
  assert.equal(e.s.bubble, null, 'brak bąbelka w tle');
  assert.ok(e.s.cash > cash, 'Ziemia zarabia w tle');
  assert.ok(co.meta.decision, 'decyzję losuje aktywna warstwa');
  // zlecenia w kosmosie mają własnych klientów
  const s = co.layers.space;
  const o = s.makeOffer(T0);
  assert.equal(o.L, 'space');
  assert.ok(TX.clientName(o).length > 3 && TX.taskName(o).length > 3);
});

test('zapis v3: warstwy i meta przechodzą przez serializację', () => {
  const co = spaceCo();
  co.meta.shares = 77;
  co.layers.space.s.cash = 12345;
  co.layers.earth.s.cash = 999;
  co.setLayer('earth');
  const data = JSON.parse(co.serialize());
  assert.equal(data.v, SAVE_VERSION);
  assert.deepEqual(Object.keys(data.layers).sort(), ['earth', 'space']);
  assert.equal(data.layers.space.meta, undefined, 'meta zapisane raz');
  const again = new Company(data, { now: T0, rng });
  assert.equal(again.meta.shares, 77);
  assert.equal(again.layers.space.s.cash, 12345);
  assert.equal(again.layers.earth.s.cash, 999);
  assert.equal(again.g, again.layers.earth, 'aktywna warstwa zapamiętana');
  assert.equal(again.layers.earth.s.feed, 0.25);
  assert.ok(again.layers.space.feedIn > 0);
  assert.equal(again.migrated, false);
});

test('płaski zapis v2 wczytuje się jako Ziemia, a pola firmy trafiają do meta', () => {
  // zapis v2 miał wszystko na wierzchu (bez meta, rund całej firmy i listy warstw)
  const { meta, layer: _layer, ...rest } = createState(T0);
  const flat = { ...meta, ...rest, v: 2 };
  delete flat.rounds;
  delete flat.unlocked;
  flat.stats = { ...rest.stats, zenTime: 130 };
  flat.shares = 55;
  flat.perks = { p_click: 2 };
  flat.achievements = { earn0: true };
  flat.settings = { ...flat.settings, view: 'waw', rdBudget: 0.25 };
  flat.prestigeCount = 4;
  flat.techs = { html: true, js: true, rockets: true };
  flat.cash = 4321;
  const co = new Company(JSON.parse(JSON.stringify(flat)), { now: T0, rng });
  assert.equal(co.migrated, false);
  assert.deepEqual(Object.keys(co.layers), ['earth']);
  const e = co.layers.earth;
  assert.equal(co.meta.shares, 55);
  assert.equal(co.meta.perks.p_click, 2);
  assert.ok(co.meta.achievements.earn0);
  assert.equal(co.meta.rounds, 4, 'rundy z zapisu');
  assert.equal(co.meta.stats.zenTime, 130);
  assert.equal(e.s.rdBudget, 0.25);
  assert.equal(e.s.cash, 4321);
  assert.ok(e.s.techs.html && !e.s.techs.rockets, 'technologie kosmiczne nie zostają na Ziemi');
  assert.equal(e.s.settings, undefined);
  assert.equal(e.s.shares, undefined);
  const v3 = JSON.parse(co.serialize());
  assert.equal(v3.v, SAVE_VERSION);
  assert.equal(v3.meta.shares, 55);
});

test('skala cywilizacji liczy przychód całej firmy, a typ II wymaga roju Dysona', () => {
  const co = spaceCo();
  const s = co.layers.space;
  const k2 = SCALE_LEVELS.findIndex((L) => L.k === 2);
  const huge = SCALE_THRESHOLDS[k2] * 10;
  s.annualRevenue = () => huge;
  assert.ok(co.layers.earth.scaleIdx() < k2, 'bez roju Dysona nie ma typu II');
  for (const t of SPACE.TECHS) s.s.techs[t.id] = true;
  assert.equal(co.layers.earth.scaleIdx(), k2, 'skala liczona dla całej firmy');
  assert.equal(co.unlockProgress('galaxy'), null, 'galaktyka: wkrótce');
  assert.equal(co.nextLayer(), null);
});

test('Game bez firmy działa jak dawniej (testy i symulator)', () => {
  const g = new Game(null, { now: T0, rng });
  assert.equal(g.D, EARTH);
  assert.equal(g.feedTarget(), null);
  assert.equal(g.setFeed(0.25), false);
  const s = new Game(null, { now: T0, rng, layer: 'space' });
  assert.equal(s.D, SPACE);
  assert.ok(s.s.offices.leo);
  assert.ok(s.annualRevenue() === 0 && SECONDS_PER_GAME_YEAR > 0);
});

test('teksty skali i warstw nie wywracają się na technologiach przyszłych etapów', () => {
  for (const L of SCALE_LEVELS) if (L.tech) assert.ok(TX.techName(L.tech).length > 3, L.tech);
  for (const id of LAYER_ORDER) assert.ok(TX.newsList(id).length >= 10, id);
});
