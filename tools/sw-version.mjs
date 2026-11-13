// Wersja cache service workera liczona z treści plików gry (lista ASSETS w sw.js) zamiast ręcznego
// podbijania numeru. Użycie: npm run sw:version — wpisuje aktualną nazwę CACHE do sw.js.
// tests/sw.test.mjs pada, gdy pliki gry zmieniły się, a nazwa w sw.js nie.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'krzemowe-imperium-';
// Pliki tekstowe liczymy z końcami linii LF: checkout na Windows (core.autocrlf) ma CRLF, CI ma LF.
const TEXT = /\.(js|mjs|css|html|webmanifest|json|svg)$/;

export function precacheList(swSource) {
  const list = swSource.match(/const ASSETS = \[([\s\S]*?)\];/);
  if (!list) throw new Error('sw.js: brak listy ASSETS');
  return [...list[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

export function cacheNameOf(swSource) {
  return swSource.match(/const CACHE = '([^']+)';/)?.[1] ?? null;
}

export function computeCacheName(root = ROOT) {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const hash = createHash('sha256');
  for (const url of precacheList(sw)) {
    if (url === './') continue; // ta sama treść co ./index.html
    let data = fs.readFileSync(path.join(root, url));
    if (TEXT.test(url)) data = Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    hash.update(url).update('\0').update(data).update('\0');
  }
  return PREFIX + hash.digest('hex').slice(0, 12);
}

// Wpisuje policzoną nazwę do sw.js (zachowuje resztę pliku i jego końce linii).
export function stamp(root = ROOT) {
  const file = path.join(root, 'sw.js');
  const sw = fs.readFileSync(file, 'utf8');
  if (cacheNameOf(sw) === null) throw new Error('sw.js: brak stałej CACHE');
  const name = computeCacheName(root);
  const next = sw.replace(/const CACHE = '[^']+';/, `const CACHE = '${name}';`);
  if (next !== sw) fs.writeFileSync(file, next);
  return { name, changed: next !== sw };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  const { name, changed } = stamp(process.argv[2] ? path.resolve(process.argv[2]) : ROOT);
  console.log(changed ? `sw.js: nowa wersja cache ${name}` : `sw.js: wersja cache aktualna (${name})`);
}
