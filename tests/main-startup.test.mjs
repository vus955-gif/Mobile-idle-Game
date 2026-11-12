// Start gry w js/main.js: aktualizacja przez service worker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Company } from '../js/engine.js';
import { runMain, T0, SAVE_KEY } from './helpers/main-harness.mjs';

const saveWithCash = (cash) => {
  const co = new Company(null, { now: T0, rng: () => 0.5 });
  co.g.s.cash = cash;
  return co.serialize();
};

test('aktualizacja: gdy nowa wersja przejmuje stronę, gra zapisuje stan i przeładowuje się raz', async (t) => {
  const run = await runMain(t, { storage: new Map([[SAVE_KEY, saveWithCash(500)]]), sw: { controller: {} } });
  run.fireWindow('load');
  assert.deepEqual(run.registered, ['sw.js']);
  run.co.g.s.cash = 777;
  run.fireSW('controllerchange');
  assert.equal(run.location.reloads, 1);
  assert.equal(JSON.parse(run.storage.get(SAVE_KEY)).layers.earth.cash, 777, 'stan zapisany przed przeładowaniem');
  run.fireSW('controllerchange');
  assert.equal(run.location.reloads, 1, 'bez pętli przeładowań');
});

test('aktualizacja: pierwsza instalacja (strona bez kontrolera) nie przeładowuje gry', async (t) => {
  const run = await runMain(t, { sw: { controller: null } });
  run.fireWindow('load');
  run.fireSW('controllerchange');
  assert.equal(run.location.reloads, 0);
});
