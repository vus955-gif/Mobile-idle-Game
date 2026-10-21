// Start gry: wczytanie zapisu, pętla, autozapis, service worker.
import { Company, clockOffsetOf } from './engine.js';
import { DEV_TOOLS } from './config.js';
import { UI } from './ui.js';
import { setLang, detectLang } from './i18n.js';
import { startMusic, stopMusic } from './music.js';

export const VERSION = '2.4.0';
export { DEV_TOOLS } from './config.js';
const SAVE_KEY = 'krzemowe-imperium-save';
const BACKUP_KEY = 'krzemowe-imperium-backup';

const isRecord = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
function isGameSave(data) {
  if (!isRecord(data)) return false;
  if ('layers' in data) return isRecord(data.meta) && isRecord(data.layers) && isRecord(data.layers.earth);
  // v1/v2 i samodzielna Game; null to historyczne kodowanie przepełnienia waluty.
  return typeof data.cash === 'number' || data.cash === null;
}

function readSave() {
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      if (isGameSave(data)) return data;
    } catch { /* uszkodzony zapis główny nie blokuje odczytu kopii */ }
  }
  return null;
}

const saved = readSave();
// Język: zapisany w grze (v3: w meta, starsze zapisy: na wierzchu), a przy pierwszym uruchomieniu — język telefonu.
const savedLang = (s) => s?.meta?.settings?.lang || s?.settings?.lang;
setLang(savedLang(saved) || detectLang());
// Zegar gry: czas rzeczywisty plus przesunięcie po „przewinięciu czasu” w trybie deweloperskim
// (przesunięcie jest w zapisie, bo znaczniki czasu w stanie gry już je uwzględniają).
// Firma ze wszystkimi warstwami (Ziemia, Kosmos…); co.g to warstwa na ekranie.
const co = new Company(saved, { now: Date.now() + clockOffsetOf(saved), devTools: DEV_TOOLS });
const clock = () => Date.now() + (co.meta.clockOffset || 0);
let lastSaveJson = '';

function save() {
  try {
    const json = co.serialize();
    if (json === lastSaveJson) return;
    if (lastSaveJson) localStorage.setItem(BACKUP_KEY, lastSaveJson);
    localStorage.setItem(SAVE_KEY, json);
    lastSaveJson = json;
  } catch {
    // brak miejsca lub tryb prywatny — gra działa dalej bez zapisu
  }
}

function encodeSave(json) {
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return 'KI1:' + btoa(bin);
}

function decodeSave(text) {
  const t = text.trim().replace(/^KI1:/, '');
  const bin = atob(t);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const ui = new UI(co, {
  version: VERSION,
  save,
  exportSave: () => encodeSave(co.serialize()),
  importSave: (text) => {
    try {
      const data = decodeSave(text);
      if (!isGameSave(data)) return false;
      if (savedLang(data)) setLang(savedLang(data));
      const now = Date.now() + clockOffsetOf(data);
      co.load(data, now);
      for (const g of Object.values(co.layers)) g.s.lastTick = now;
      co.recalc();
      save();
      return true;
    } catch {
      return false;
    }
  },
  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(BACKUP_KEY); } catch { /* ignoruj */ }
    // ustawienia (język, dźwięk, limit rynku, tryb deweloperski) przechodzą do nowej gry; zegar wraca do zwykłego
    co.reset(Date.now());
    lastSaveJson = '';
    ui.fullRender();
    ui.showWelcome();
    save();
  },
  devTools: co.devTools,
  // Przewinięcie czasu: zegar gry skacze do przodu, a najbliższy tick nalicza przerwę jak po powrocie do gry.
  skipTime: (sec) => {
    if (co.skipTime(sec)) save();
  },
});

ui.init();
if (!saved) ui.showWelcome();

// Pierwszy tick nalicza zarobki offline (UI pokaże podsumowanie).
co.tick(clock());
// Zapis sprzed nowej ekonomii albo sprzed warstw: krótko wyjaśniamy, co się zmieniło.
if (co.migrated) ui.showMigration();
else if (co.converted) setTimeout(() => ui.showLayersIntro(), 600);

// Logika gry nie potrzebuje 60 klatek — 20 Hz wystarcza i oszczędza baterię.
let lastLoop = 0;
function loop(ts) {
  if (ts - lastLoop >= 50) {
    lastLoop = ts;
    co.tick(clock());
    ui.frame(performance.now());
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(save, 10000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    save();
    stopMusic(false);
  } else {
    co.tick(clock());
    if (co.meta.settings.music) startMusic();
  }
});
window.addEventListener('pagehide', save);
window.addEventListener('beforeunload', save);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Dostęp do gry z konsoli (debug): __game to warstwa na ekranie, __co cała firma.
window.__co = co;
Object.defineProperty(window, '__game', { get: () => co.g });
