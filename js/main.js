// Start gry: wczytanie zapisu, pętla, autozapis, service worker.
import { Game, createState, sanitizeState } from './engine.js';
import { UI } from './ui.js';
import { setLang, detectLang } from './i18n.js';
import { startMusic, stopMusic } from './music.js';

export const VERSION = '1.2.0';
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
// Język: zapisany w grze, a przy pierwszym uruchomieniu — język telefonu.
setLang(saved?.settings?.lang || detectLang());
const game = new Game(saved, { now: Date.now() });
let lastSaveJson = '';

function save() {
  try {
    const json = game.serialize();
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

const ui = new UI(game, {
  version: VERSION,
  save,
  exportSave: () => encodeSave(game.serialize()),
  importSave: (text) => {
    try {
      const data = decodeSave(text);
      if (!data || typeof data !== 'object' || typeof data.cash !== 'number') return false;
      if (data.settings?.lang) setLang(data.settings.lang);
      game.s = sanitizeState(data, Date.now());
      game.s.lastTick = Date.now();
      game.recalc();
      game.afterLoad(Date.now());
      save();
      return true;
    } catch {
      return false;
    }
  },
  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(BACKUP_KEY); } catch { /* ignoruj */ }
    game.s = createState(Date.now());
    game.recalc();
    lastSaveJson = '';
    ui.fullRender();
    ui.showWelcome();
    save();
  },
});

ui.init();
if (!saved) ui.showWelcome();

// Pierwszy tick nalicza zarobki offline (UI pokaże podsumowanie).
game.tick(Date.now());
// Zapis sprzed nowej ekonomii: krótko wyjaśniamy, co się zmieniło.
if (game.migrated) ui.showMigration();

// Logika gry nie potrzebuje 60 klatek — 20 Hz wystarcza i oszczędza baterię.
let lastLoop = 0;
function loop(ts) {
  if (ts - lastLoop >= 50) {
    lastLoop = ts;
    game.tick(Date.now());
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
    game.tick(Date.now());
    if (game.s.settings.music) startMusic();
  }
});
window.addEventListener('pagehide', save);
window.addEventListener('beforeunload', save);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Dostęp do gry z konsoli (debug)
window.__game = game;
