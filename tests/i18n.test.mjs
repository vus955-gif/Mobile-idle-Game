// Testy tłumaczeń i wyceny: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DICT, setLang, t } from '../js/i18n.js';
import { EN } from '../js/lang/en.js';
import {
  PERKS, CATEGORIES, BUBBLES, ROUND_NAMES, COMPANY_STAGES, NEWS, TREND_TEMPLATES, CONTRACT_CLIENTS, CONTRACT_TASKS,
} from '../js/data.js';
import { Game } from '../js/engine.js';
import { LAYERS, LAYER_ORDER } from '../js/layers.js';
import { SPACE_CATEGORIES, SPACE_CLIENTS, SPACE_TASKS } from '../js/space.js';
import * as TX from '../js/text.js';
import { fmt, money, fmtTime } from '../js/format.js';

const T0 = 1_700_000_000_000;
const LANGS = ['pl', 'en'];
const clean = (str, where) => {
  assert.equal(typeof str, 'string', `${where}: brak tekstu`);
  assert.ok(str.trim().length > 0, `${where}: pusty tekst`);
  assert.ok(!/\{\w+\}/.test(str), `${where}: niepodstawiony parametr w „${str}”`);
  assert.ok(!str.includes('undefined'), `${where}: undefined w „${str}”`);
};

test('słowniki interfejsu PL i EN mają te same klucze i kształty', () => {
  const pl = DICT.pl;
  const en = DICT.en;
  assert.deepEqual(Object.keys(pl).sort(), Object.keys(en).sort());
  for (const k of Object.keys(pl)) {
    assert.equal(Array.isArray(pl[k]), Array.isArray(en[k]), k);
    if (Array.isArray(pl[k])) assert.equal(pl[k].length, en[k].length, `${k}: różna długość`);
    const params = (v) => (typeof v === 'string' ? (v.match(/\{\w+\}/g) || []).sort().join() : '');
    assert.equal(params(pl[k]), params(en[k]), `${k}: różne parametry`);
  }
});

test('angielska treść obejmuje każdy element gry', () => {
  for (const id of LAYER_ORDER) {
    const D = LAYERS[id];
    for (const p of D.PRODUCTS) {
      assert.ok(EN.products[p.id], p.id);
      assert.equal(EN.products[p.id].ups.length, p.ups.length, `${p.id}: ulepszenia`);
    }
    for (const d of D.DEPTS) assert.equal(EN.depts[d.id].ups.length, d.ups.length, d.id);
    for (const x of D.TECHS) assert.ok(EN.techs[x.id], x.id);
    for (const x of D.REPEAT_TECHS) assert.ok(EN.repeat[x.id], x.id);
    for (const x of D.CULTURE_UPGRADES) assert.ok(EN.culture[x.id], x.id);
    for (const x of D.CLICK_UPGRADES) assert.ok(EN.click[x.id], x.id);
    for (const x of D.ACQUISITIONS) assert.ok(EN.acquisitions[x.id], x.id);
    for (const x of D.OFFICES) assert.ok(EN.offices[x.id], x.id);
    for (const e of D.ERAS) assert.ok(EN.eras[e.id], `era ${e.id}`);
  }
  for (const x of PERKS) assert.ok(EN.perks[x.id], x.id);
  for (const c of Object.keys({ ...CATEGORIES, ...SPACE_CATEGORIES })) assert.ok(EN.categories[c], c);
  assert.equal(EN.spaceClients.length, SPACE_CLIENTS.length);
  assert.equal(EN.spaceTasks.length, SPACE_TASKS.length);
  for (const b of Object.keys(BUBBLES)) assert.ok(EN.bubbles[b], b);
  assert.equal(EN.rounds.length, ROUND_NAMES.length);
  assert.equal(EN.stages.length, COMPANY_STAGES.length);
  assert.equal(EN.clients.length, CONTRACT_CLIENTS.length);
  assert.equal(EN.tasks.length, CONTRACT_TASKS.length);
  assert.equal(EN.trends.length, TREND_TEMPLATES.length);
  assert.ok(EN.news.length >= NEWS.length - 2);
});

test('każde ulepszenie, osiągnięcie i technologia ma tekst w obu językach', () => {
  for (const lang of LANGS) {
    setLang(lang);
    for (const id of LAYER_ORDER) {
      const D = LAYERS[id];
      for (const u of D.UPGRADES) { clean(TX.upgradeName(u), `${lang} ${u.id} nazwa`); clean(TX.upgradeDesc(u), `${lang} ${u.id} opis`); }
      for (const a of D.ACHIEVEMENTS) { clean(TX.achName(a), `${lang} ${a.id} nazwa`); clean(TX.achDesc(a), `${lang} ${a.id} opis`); }
      for (const x of D.TECHS) { clean(TX.techName(x.id), x.id); clean(TX.describeFx(x.fx), `${lang} ${x.id} efekt`); }
      for (const x of D.ACQUISITIONS) clean(TX.describeFx(x.fx), `${lang} ${x.id} efekt`);
      for (const x of D.OFFICES) { clean(TX.officeName(x.id), x.id); clean(TX.describeFx(x.fx), `${lang} ${x.id} efekt`); }
      for (const e of D.ERAS) clean(TX.eraName(e.id), `${lang} era ${e.id}`);
    }
    clean(TX.clientName({ ci: 5, L: 'space' }), `${lang} klient w kosmosie`);
    clean(TX.taskName({ ti: 5, L: 'space' }), `${lang} zlecenie w kosmosie`);
    for (let i = 0; i < 20; i++) clean(TX.roundName(i), `${lang} runda ${i}`);
    clean(TX.trendText({ pid: 'game', x: 1.5, tpl: 2 }), `${lang} trend`);
    clean(TX.clientName({ ci: 3 }), `${lang} klient`);
    clean(TX.taskName({ ti: 3 }), `${lang} zadanie`);
  }
  setLang('pl');
});

test('stare zapisy kontraktów (z gotowym tekstem) nadal się wyświetlają', () => {
  assert.equal(TX.clientName({ client: 'Zoo Miejskie' }), 'Zoo Miejskie');
  assert.equal(TX.taskName({ task: 'system rezerwacji' }), 'system rezerwacji');
});

test('formatowanie liczb po angielsku', () => {
  setLang('en');
  assert.equal(fmt(1234), '1.23K');
  assert.equal(fmt(2.5e9), '2.5B');
  assert.equal(money(1e12), '$1T');
  assert.equal(fmt(12.34), '12.3');
  assert.equal(fmtTime(3725), '1h 2m');
  assert.equal(t('noun.people').other, 'people');
  setLang('pl');
  assert.equal(fmtTime(3725), '1 h 2 min');
});

test('nowa gra dostaje domyślną nazwę w swoim języku', () => {
  setLang('en');
  assert.equal(new Game(null, { now: T0 }).s.meta.companyName, 'Garage Startup');
  setLang('pl');
  assert.equal(new Game(null, { now: T0 }).s.meta.companyName, 'Garażowy Startup');
});

test('wycena firmy jest realistyczna i ignoruje chwilowe premie', () => {
  setLang('pl');
  const g = new Game(null, { now: T0, rng: () => 0.5 });
  g.s.products.landing = 20;
  g.recalc();
  const inc = g.income;
  assert.ok(inc > 2 && inc < 20, `przychód testowy ${inc}`);
  const v = g.valuation();
  // ~$6/s w garażu to wycena rzędu dziesiątek tysięcy dolarów, nie setek milionów
  assert.ok(v > 1e4 && v < 5e5, `wycena ${v}`);
  const parts = g.valuationParts();
  assert.equal(parts.multiple, 3);
  assert.ok(Math.abs(parts.annual - inc * 3600) < 1e-6);
  // viral ×7 nie zmienia wyceny
  g.s.boosts.income = { x: 7, until: T0 + 30000 };
  g.recalc();
  assert.ok(Math.abs(g.valuation() - v) / v < 1e-9);
  // technologie podnoszą mnożnik
  g.s.techs.html = true;
  g.s.techs.js = true;
  assert.ok(g.valuationMultiple() > 3);
});
