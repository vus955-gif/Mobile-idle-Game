// Uruchamia prawdziwe js/main.js z podstawionymi API przeglądarki (localStorage, service worker, okno)
// i bez renderowania UI. Każde wywołanie to nowe „uruchomienie gry” (świeża instancja main.js).
// To test połączenia modułów, nie test Safari ani prawdziwego service workera.
export const T0 = 1_700_000_000_000;
export const SAVE_KEY = 'krzemowe-imperium-save';
export const BACKUP_KEY = 'krzemowe-imperium-backup';

let runs = 0;

// opts.storage — Map z zawartością localStorage; opts.sw — { controller } włącza navigator.serviceWorker
// (protokół https:), bez niego gra działa jak z file:// i nie rejestruje service workera.
export async function runMain(t, { storage = new Map(), sw = null } = {}) {
  const element = () => ({ style: {}, appendChild() {}, setAttribute() {} });
  const windowListeners = {};
  const swListeners = {};
  const location = { protocol: sw ? 'https:' : 'file:', reloads: 0, reload() { this.reloads++; } };
  const navigator = { language: 'pl-PL', languages: ['pl-PL'] };
  const registered = [];
  if (sw) {
    navigator.serviceWorker = {
      controller: sw.controller ?? null,
      addEventListener: (type, fn) => { (swListeners[type] ||= []).push(fn); },
      register: async (url) => { registered.push(url); return {}; },
    };
  }
  const globals = {
    document: { getElementById: element, createElement: element, createElementNS: element, addEventListener() {} },
    window: { addEventListener: (type, fn) => { (windowListeners[type] ||= []).push(fn); } },
    navigator,
    location,
    localStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
    requestAnimationFrame() {},
  };
  for (const [key, value] of Object.entries(globals)) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => (old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key]));
  }
  t.mock.method(Date, 'now', () => T0);
  t.mock.method(globalThis, 'setInterval', () => 0);
  t.mock.method(globalThis, 'setTimeout', () => 0);
  const { UI } = await import('../../js/ui.js');
  let ui;
  t.mock.method(UI.prototype, 'init', function () { ui = this; });
  for (const method of ['showWelcome', 'showMigration', 'showLayersIntro', 'fullRender', 'updateAll']) {
    t.mock.method(UI.prototype, method, () => {});
  }
  const main = await import(`../../js/main.js?run=${++runs}`);
  const fire = (listeners, type) => { for (const fn of listeners[type] || []) fn(); };
  return {
    main, ui, co: ui.co, storage, location, registered,
    fireWindow: (type) => fire(windowListeners, type),
    fireSW: (type) => fire(swListeners, type),
  };
}
