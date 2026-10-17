// Start gry: wczytanie zapisu, pętla, autozapis, service worker.
import { Company } from './engine.js';
import { UI } from './ui.js';
import { setLang, detectLang } from './i18n.js';
import { startMusic, stopMusic } from './music.js';

export const VERSION = '2.2.0';
const SAVE_KEY = 'krzemowe-imperium-save';
const BACKUP_KEY = 'krzemowe-imperium-backup';

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const saved = readSave();
// Język: zapisany w grze (v3: w meta, starsze zapisy: na wierzchu), a przy pierwszym uruchomieniu — język telefonu.
const savedLang = (s) => s?.meta?.settings?.lang || s?.settings?.lang;
setLang(savedLang(saved) || detectLang());
// Firma ze wszystkimi warstwami (Ziemia, Kosmos…); co.g to warstwa na ekranie.
const co = new Company(saved, { now: Date.now() });
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
      const ok = data && typeof data === 'object' && (typeof data.layers === 'object' || typeof data.cash === 'number');
      if (!ok) return false;
      if (savedLang(data)) setLang(savedLang(data));
      const now = Date.now();
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
    // ustawienia (język, dźwięk, limit rynku) przechodzą do nowej gry
    const { sound, music, lang, cap, buyAmount } = co.meta.settings;
    co.load(null, Date.now());
    Object.assign(co.meta.settings, { sound, music, lang, cap, buyAmount });
    co.recalc();
    lastSaveJson = '';
    ui.fullRender();
    ui.showWelcome();
    save();
  },
});

ui.init();
if (!saved) ui.showWelcome();

// Pierwszy tick nalicza zarobki offline (UI pokaże podsumowanie).
co.tick(Date.now());
// Zapis sprzed nowej ekonomii albo sprzed warstw: krótko wyjaśniamy, co się zmieniło.
if (co.migrated) ui.showMigration();
else if (co.converted) setTimeout(() => ui.showLayersIntro(), 600);

// Logika gry nie potrzebuje 60 klatek — 20 Hz wystarcza i oszczędza baterię.
let lastLoop = 0;
function loop(ts) {
  if (ts - lastLoop >= 50) {
    lastLoop = ts;
    co.tick(Date.now());
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
    co.tick(Date.now());
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
