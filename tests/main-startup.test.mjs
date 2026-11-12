// Start gry w js/main.js: kopia zapasowa zapisu i aktualizacja przez service worker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Company } from '../js/engine.js';
import { runMain, T0, SAVE_KEY, BACKUP_KEY } from './helpers/main-harness.mjs';

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

test('kopia zapasowa: pierwszy zapis sesji zostawia w kopii stan wczytany przy starcie', async (t) => {
  const loadedRaw = saveWithCash(500);
  const storage = new Map([[SAVE_KEY, loadedRaw], [BACKUP_KEY, saveWithCash(100)]]);
  const run = await runMain(t, { storage });
  assert.equal(run.co.g.s.cash, 500);
  assert.equal(storage.get(BACKUP_KEY), loadedRaw, 'kopia wczytanego zapisu już przy starcie');
  run.co.g.s.cash = 600;
  run.ui.hooks.save();
  assert.equal(JSON.parse(storage.get(SAVE_KEY)).layers.earth.cash, 600);
  // dawniej pierwszy zapis pomijał kopię i zostawiał w niej starszy stan (100), a 500 przepadało
  assert.equal(JSON.parse(storage.get(BACKUP_KEY)).layers.earth.cash, 500);
  run.co.g.s.cash = 700;
  run.ui.hooks.save();
  assert.equal(JSON.parse(storage.get(BACKUP_KEY)).layers.earth.cash, 600, 'dalej kopia to poprzedni zapis');
});

test('kopia zapasowa: start z kopii (uszkodzony zapis główny) i nowa gra bez zapisu', async (t) => {
  const backupRaw = saveWithCash(300);
  const storage = new Map([[SAVE_KEY, '{uszkodzony'], [BACKUP_KEY, backupRaw]]);
  const run = await runMain(t, { storage });
  assert.equal(run.co.g.s.cash, 300);
  assert.equal(storage.get(BACKUP_KEY), backupRaw);
  const fresh = await runMain(t, { storage: new Map() });
  assert.equal(fresh.co.g.s.cash, 0);
  assert.equal(fresh.storage.has(BACKUP_KEY), false, 'nowa gra nie tworzy pustej kopii');
});
