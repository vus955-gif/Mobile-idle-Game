// Service worker (sw.js) uruchomiony w piaskownicy vm z podstawionymi caches, fetch i Request.
// To test logiki zdarzeń install/activate/fetch, nie test prawdziwej przeglądarki.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
