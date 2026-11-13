// Service worker (sw.js) uruchomiony w piaskownicy vm z podstawionymi caches, fetch i Request.
// To test logiki zdarzeń install/activate/fetch, nie test prawdziwej przeglądarki.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, computeCacheName, stamp } from '../tools/sw-version.mjs';

const ORIGIN = 'https://gra.example';
const SOURCE = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const ASSETS = [...SOURCE.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const CACHE = SOURCE.match(/const CACHE = '([^']+)';/)[1];
const abs = (url) => new URL(url, ORIGIN + '/').href;
const noSearch = (url) => { const u = new URL(url); u.search = ''; return u.href; };

class FakeRequest {
  constructor(input, init = {}) {
    this.url = abs(typeof input === 'string' ? input : input.url);
    this.cache = init.cache ?? 'default';
    this.method = init.method ?? 'GET';
  }
}

// caches: nazwa → Map(url → odpowiedź). Odpowiedzi to zwykłe obiekty z polem `body`.
function loadSW({ caches: initial = {} } = {}) {
  const store = new Map(Object.entries(initial).map(([name, files]) => [name, new Map(Object.entries(files).map(([u, b]) => [abs(u), { ok: true, body: b }]))]));
  const log = { addAll: [], put: [], fetch: [], deleted: [], skipWaiting: 0, claim: 0 };
  const network = (req) => ({ ok: true, body: `sieć:${new URL(req.url).pathname}`, clone() { return this; } });
  const cacheApi = (name) => ({
    async addAll(reqs) {
      log.addAll.push(reqs);
      const entries = reqs.map((r) => [abs(typeof r === 'string' ? r : r.url), network(typeof r === 'string' ? { url: abs(r) } : r)]);
      for (const [u, res] of entries) store.get(name).set(u, res);
    },
    async put(req, res) { log.put.push(req.url); store.get(name).set(req.url, res); },
    async match(req, opts = {}) {
      const want = opts.ignoreSearch ? noSearch(req.url) : req.url;
      for (const [u, res] of store.get(name)) if ((opts.ignoreSearch ? noSearch(u) : u) === want) return res;
      return undefined;
    },
  });
  const listeners = {};
  const sandbox = {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type, fn) => { listeners[type] = fn; },
      skipWaiting: async () => { log.skipWaiting++; },
      clients: { claim: async () => { log.claim++; } },
    },
    caches: {
      async open(name) { if (!store.has(name)) store.set(name, new Map()); return cacheApi(name); },
      async keys() { return [...store.keys()]; },
      async delete(name) { log.deleted.push(name); return store.delete(name); },
    },
    fetch: async (req) => { log.fetch.push(req.url); return network(req); },
    Request: FakeRequest,
    URL,
  };
  vm.runInNewContext(SOURCE, sandbox, { filename: 'sw.js' });
  // Zdarzenie: zwraca obietnicę z waitUntil albo respondWith.
  const fire = async (type, extra = {}) => {
    let p;
    listeners[type]({ ...extra, waitUntil: (x) => { p = x; }, respondWith: (x) => { p = x; } });
    return p;
  };
  return { store, log, fire };
}

test('sw install: każdy plik z ASSETS pobierany z pominięciem pamięci HTTP (cache: reload)', async () => {
  const sw = loadSW();
  await sw.fire('install');
  assert.equal(sw.log.addAll.length, 1);
  const reqs = sw.log.addAll[0];
  assert.equal(reqs.length, ASSETS.length);
  for (const r of reqs) {
    assert.equal(typeof r, 'object', `precache jako Request, nie sam adres: ${r}`);
    assert.equal(r.cache, 'reload', `bez cache: 'reload' przeglądarka może podać starą kopię: ${r.url}`);
  }
  // Array.from: tablica z piaskownicy vm ma inny prototyp niż tablica testu
  assert.deepEqual(Array.from(reqs, (r) => r.url), ASSETS.map(abs));
  assert.equal(sw.store.get(CACHE).size, ASSETS.length);
});

test('sw fetch: plik gry tylko z cache bieżącej wersji, bez sieci i bez dopisywania w tle', async () => {
  const sw = loadSW({ caches: { [CACHE]: { './js/main.js': 'main v2', './index.html': 'index v2' } } });
  const res = await sw.fire('fetch', { request: new FakeRequest('./js/main.js?v=1') });
  assert.equal(res.body, 'main v2', 'ignoreSearch: zapytanie w adresie nie omija cache');
  assert.equal((await sw.fire('fetch', { request: new FakeRequest('./index.html') })).body, 'index v2');
  // dawniej każde trafienie w cache pobierało też plik z sieci i podmieniało go pojedynczo
  assert.deepEqual(sw.log.fetch, []);
  assert.deepEqual(sw.log.put, []);
});

test('sw fetch: plik spoza cache idzie z sieci i nie trafia do cache wersji', async () => {
  const sw = loadSW({ caches: { [CACHE]: {} } });
  const res = await sw.fire('fetch', { request: new FakeRequest('./tools/gallery.html') });
  assert.equal(res.body, 'sieć:/tools/gallery.html');
  assert.deepEqual(sw.log.put, []);
  assert.equal(sw.store.get(CACHE).size, 0);
});

test('sw fetch: inne domeny i metody inne niż GET zostają poza service workerem', async () => {
  const sw = loadSW({ caches: { [CACHE]: {} } });
  assert.equal(await sw.fire('fetch', { request: new FakeRequest('https://inna.example/x.js') }), undefined);
  assert.equal(await sw.fire('fetch', { request: new FakeRequest('./index.html', { method: 'POST' }) }), undefined);
  assert.deepEqual(sw.log.fetch, []);
});

test('sw: instalacja nie rusza starej wersji, aktywacja usuwa ją w całości i przejmuje strony', async () => {
  const sw = loadSW({ caches: { 'krzemowe-imperium-stara': { './js/main.js': 'main v1', './js/engine.js': 'engine v1' } } });
  await sw.fire('install');
  // do aktywacji stara strona nadal dostaje komplet starych plików
  assert.equal(sw.store.get('krzemowe-imperium-stara').get(abs('./js/engine.js')).body, 'engine v1');
  assert.equal(sw.log.skipWaiting, 1);
  await sw.fire('activate');
  assert.deepEqual(sw.log.deleted, ['krzemowe-imperium-stara']);
  assert.deepEqual([...sw.store.keys()], [CACHE]);
  assert.equal(sw.log.claim, 1);
  const res = await sw.fire('fetch', { request: new FakeRequest('./js/engine.js') });
  assert.equal(res.body, 'sieć:/js/engine.js', 'po aktywacji cały komplet z nowej instalacji');
});

// ---------- wersja cache i lista plików ----------

test('wersja cache w sw.js odpowiada treści plików gry (npm run sw:version)', () => {
  assert.equal(CACHE, computeCacheName(),
    'Pliki gry zmieniły się, a nazwa CACHE w sw.js nie. Uruchom: npm run sw:version');
});

test('sw:version: zmiana pliku zmienia wersję, końce linii CRLF/LF nie; stamp wpisuje ją do sw.js', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'ki-sw-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'js'));
  await writeFile(path.join(dir, 'sw.js'), "const CACHE = 'krzemowe-imperium-v1';\r\nconst ASSETS = [\r\n  './',\r\n  './index.html',\r\n  './js/a.js',\r\n];\r\n");
  await writeFile(path.join(dir, 'index.html'), '<p>gra</p>\n');
  await writeFile(path.join(dir, 'js/a.js'), 'export const A = 1;\nexport const B = 2;\n');
  const v1 = computeCacheName(dir);
  assert.match(v1, /^krzemowe-imperium-[0-9a-f]{12}$/);
  await writeFile(path.join(dir, 'js/a.js'), 'export const A = 1;\r\nexport const B = 2;\r\n');
  assert.equal(computeCacheName(dir), v1, 'checkout na Windows i CI dają tę samą wersję');
  await writeFile(path.join(dir, 'js/a.js'), 'export const A = 1;\nexport const B = 3;\n');
  const v2 = computeCacheName(dir);
  assert.notEqual(v2, v1, 'każda zmiana pliku gry to nowa wersja');
  assert.deepEqual(stamp(dir), { name: v2, changed: true });
  const sw = await readFile(path.join(dir, 'sw.js'), 'utf8');
  assert.ok(sw.startsWith(`const CACHE = '${v2}';\r\n`), 'reszta pliku i końce linii bez zmian');
  assert.deepEqual(stamp(dir), { name: v2, changed: false });
});

// Moduły osiągalne z js/main.js: import/export … from, import(), new URL('./x.js', import.meta.url) (worker).
function moduleGraph(entry) {
  const seen = new Set();
  const visit = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(path.join(ROOT, rel), 'utf8');
    const refs = [
      ...src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/g),
      ...src.matchAll(/import\s*['"](\.{1,2}\/[^'"]+)['"]/g),
      ...src.matchAll(/import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g),
      ...src.matchAll(/new URL\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*,\s*import\.meta\.url/g),
    ];
    for (const m of refs) visit(path.posix.join(path.posix.dirname(rel), m[1]));
  };
  visit(entry);
  return [...seen];
}
const walk = (dir) => readdirSync(path.join(ROOT, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
// Pliki tylko dla narzędzi deweloperskich (tools/*.html), których gra nie ładuje.
const DEV_ONLY = ['js/art/gallery.js', 'js/diorama/gallery.js'];

test('precache obejmuje każdy plik JS gry (cały graf importów z js/main.js, z workerem)', () => {
  const graph = moduleGraph('js/main.js');
  assert.ok(graph.includes('js/art/worker.js'), 'worker tła wykryty w grafie');
  assert.ok(graph.length > 40);
  for (const file of graph) assert.ok(ASSETS.includes(`./${file}`), `brak w ASSETS (sw.js): ./${file}`);
  for (const file of walk('js').filter((f) => f.endsWith('.js'))) {
    assert.ok(ASSETS.includes(`./${file}`) || DEV_ONLY.includes(file),
      `nowy plik JS spoza listy precache: ./${file} — dopisz go do ASSETS w sw.js (albo do DEV_ONLY, jeśli gra go nie ładuje)`);
  }
  for (const file of DEV_ONLY) assert.ok(!graph.includes(file), `${file} jest ładowany przez grę, więc musi być w ASSETS`);
});

test('precache: każdy plik z ASSETS istnieje, a zasoby z index.html są na liście', () => {
  // brak jednego pliku wywraca całą instalację (addAll jest atomowe), więc gra nie działałaby offline
  for (const url of ASSETS) assert.ok(url === './' || existsSync(path.join(ROOT, url)), `brak pliku: ${url}`);
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const local = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => `./${m[1]}`);
  assert.ok(local.includes('./js/main.js'));
  for (const url of local) assert.ok(ASSETS.includes(url), `index.html używa ${url}, którego nie ma w ASSETS`);
});
