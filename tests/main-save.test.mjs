// Prawdziwe main.js i silnik, podstawione wyłącznie API przeglądarki oraz renderowanie UI.
// To test połączenia modułów, nie test Safari ani service workera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const T0 = 1_700_000_000_000;
const SAVE_KEY = 'krzemowe-imperium-save';
const BACKUP_KEY = 'krzemowe-imperium-backup';
const encode = data => 'KI1:' + Buffer.from(JSON.stringify(data), 'utf8').toString('base64');

for (const devTools of [true, false]) test(`main.js z DEV_TOOLS=${devTools}: start, przełącznik, import KI1, eksport, reset`, async t => {
  // Rzeczywiste moduły z oboma ustawieniami flagi wydania, bez zmiany plików repozytorium.
  const dir = await mkdtemp(join(tmpdir(), 'ki-save-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(new URL('../js/', import.meta.url), join(dir, 'js'), { recursive: true });
  await writeFile(join(dir, 'package.json'), '{"type":"module"}');
  await writeFile(join(dir, 'js/config.js'), `export const DEV_TOOLS = ${devTools};\n`);
  const moduleUrl = name => pathToFileURL(join(dir, 'js', name)).href;
  const { Company, createState } = await import(moduleUrl('engine.js'));
  const { UI } = await import(moduleUrl('ui.js'));
  const expectedMult = devTools ? 1000 : 1;
  const source = new Company(null, { now: T0 + 3600e3, rng: () => 0.5, devTools: true });
  source.meta.clockOffset = 3600e3;
  source.meta.settings.dev = true;
  source.meta.settings.devMult = 1000;
  source.g.s.cash = 1234;
  const storage = new Map([[SAVE_KEY, source.serialize()]]);
  const element = () => ({ style: {}, appendChild() {}, setAttribute() {} });
  const globals = {
    document: { getElementById: element, createElement: element, createElementNS: element, addEventListener() {} },
    window: { addEventListener() {} },
    navigator: { language: 'pl-PL', languages: ['pl-PL'] },
    location: { protocol: 'file:' },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    requestAnimationFrame() {},
  };
  for (const [key, value] of Object.entries(globals)) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key]);
  }
  t.mock.method(Date, 'now', () => T0);
  t.mock.method(globalThis, 'setInterval', () => 0);
  t.mock.method(globalThis, 'setTimeout', () => 0);
  let ui;
  t.mock.method(UI.prototype, 'init', function () { ui = this; });
  for (const method of ['showWelcome', 'showMigration', 'showLayersIntro', 'fullRender', 'updateAll']) {
    t.mock.method(UI.prototype, method, () => {});
  }
  const main = await import(moduleUrl('main.js'));
  assert.equal(main.DEV_TOOLS, devTools);
  const co = ui.co;
  assert.equal(ui.hooks.devTools, devTools);
  assert.equal(ui.devSettings().includes('toggle-dev'), devTools);
  assert.equal(co.g.devMult(), expectedMult);
  assert.equal(co.meta.settings.dev, devTools);
  assert.equal(co.meta.clockOffset, 3600e3);
  assert.equal(co.g.s.lastTick, T0 + 3600e3);
  assert.equal(co.g.s.cash, 1234);

  ui.action('toggle-dev', { dataset: {} });
  ui.action('dev-mult', { dataset: { v: '1000' } });
  ui.action('dev-skip', { dataset: { v: '3600' } });
  assert.equal(co.meta.settings.dev, false);
  assert.equal(co.meta.settings.devMult, expectedMult);
  assert.equal(co.g.devMult(), 1, 'wyłączenie przełącznika usuwa mnożnik');
  assert.equal(co.meta.clockOffset, 3600e3);
  if (devTools) {
    assert.equal(JSON.parse(storage.get(SAVE_KEY)).meta.settings.dev, false, 'wyłączenie zapisane od razu');
    ui.action('toggle-dev', { dataset: {} });
    ui.action('dev-mult', { dataset: { v: '100' } });
    assert.equal(co.g.devMult(), 100, 'narzędzia nadal działają po włączeniu');
    assert.equal(co.g.clickValue, 100);
    ui.action('dev-skip', { dataset: { v: '600' } });
    assert.equal(co.meta.clockOffset, 4200e3);
    ui.action('toggle-dev', { dataset: {} });
    assert.equal(co.g.devMult(), 1);
    assert.equal(co.g.clickValue, 1);
    ui.action('dev-skip', { dataset: { v: '600' } });
    assert.equal(co.meta.clockOffset, 4200e3, 'po wyłączeniu brak kolejnego skoku');
  }

  const imported = JSON.parse(source.serialize());
  imported.meta.clockOffset = 8 * 3600e3;
  imported.layers.earth.cash = 5678;
  assert.equal(ui.hooks.importSave(encode(imported)), true);
  assert.equal(co.g.devMult(), expectedMult);
  assert.equal(co.g.s.cash, 5678);
  assert.equal(co.g.s.lastTick, T0 + 8 * 3600e3, 'import nie nalicza ponownie offline');
  const exported = JSON.parse(Buffer.from(ui.hooks.exportSave().slice(4), 'base64').toString('utf8'));
  assert.equal(exported.meta.settings.dev, devTools);
  assert.equal(exported.meta.settings.devMult, expectedMult);
  assert.equal(exported.meta.clockOffset, 8 * 3600e3);
  assert.equal(JSON.parse(storage.get(SAVE_KEY)).layers.earth.cash, 5678);
  assert.equal(ui.hooks.importSave('to nie jest zapis'), false);
  assert.equal(co.g.s.cash, 5678);
  for (const bad of [{ layers: null }, { layers: [] }, { layers: {}, meta: {} }, [], null]) {
    const before = co.serialize();
    assert.equal(ui.hooks.importSave(encode(bad)), false);
    assert.equal(co.serialize(), before, 'błędny import nie kasuje bieżącej gry');
  }

  imported.meta.clockOffset = null;
  assert.equal(ui.hooks.importSave(encode(imported)), true);
  assert.equal(co.meta.clockOffset, 0);
  assert.equal(co.now, T0);
  assert.equal(co.g.s.lastTick, T0);

  const { meta, ...rest } = createState(T0);
  const flat = { ...meta, ...rest, v: 2, cash: 77 };
  delete flat.rdAuto;
  flat.settings = { ...meta.settings, rdBudget: 0.25, lang: 'en', cap: false, dev: true, devMult: 1000 };
  assert.equal(ui.hooks.importSave(encode(flat)), true);
  assert.equal(co.g.s.cash, 77);
  assert.equal(co.g.s.rdBudget, 0.25);
  assert.equal(co.g.s.rdAuto, false);
  assert.equal(co.g.devMult(), expectedMult);
  assert.equal(co.meta.settings.lang, 'en');

  co.meta.clockOffset = 3600e3;
  ui.hooks.reset();
  assert.equal(co.meta.clockOffset, 0);
  assert.equal(co.g.s.lastTick, T0);
  assert.equal(co.g.s.cash, 0);
  assert.equal(co.meta.settings.lang, 'en');
  assert.equal(co.meta.settings.cap, false);
  assert.equal(co.g.devMult(), expectedMult);
  assert.equal(storage.has(BACKUP_KEY), false, 'reset nie odtwarza poprzedniego zapisu jako backupu');
  assert.equal(JSON.parse(storage.get(SAVE_KEY)).layers.earth.cash, 0);

  // Odtworzenie uruchomienia po uszkodzeniu głównego JSON: rzeczywisty readSave ma sięgnąć po backup.
  storage.set(SAVE_KEY, '{uszkodzony JSON');
  storage.set(BACKUP_KEY, source.serialize());
  globalThis.window = { addEventListener() {} };
  await import(moduleUrl('main.js') + '?backup-recovery');
  assert.equal(ui.co.g.s.cash, 1234);
  assert.equal(ui.co.meta.clockOffset, 3600e3);
  assert.equal(ui.co.g.devMult(), expectedMult, 'kopia zapasowa respektuje politykę wydania');
});
