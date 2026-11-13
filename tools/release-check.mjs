// Kontrola przed wydaniem w sklepach. Na co dzień DEV_TOOLS = true celowo (narzędzia są dostępne w tej
// wersji, README), więc ta kontrola nie należy do `npm test`. Uruchamia ją CI na tagach v* i ręcznie
// (workflow „Kontrola wydania”). Kończy się kodem 1, gdy wydanie ma włączone narzędzia deweloperskie.
// Użycie: node tools/release-check.mjs [katalog gry, domyślnie katalog repozytorium]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Lista problemów blokujących wydanie; pusta lista = można wydawać.
export function releaseProblems(config) {
  const problems = [];
  if (config?.DEV_TOOLS !== false) {
    problems.push('js/config.js: DEV_TOOLS musi mieć wartość false (inaczej gracz włączy mnożnik dochodu do ×1000 i przewijanie czasu).');
  }
  return problems;
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  const root = path.resolve(process.argv[2] || path.join(path.dirname(self), '..'));
  const config = await import(pathToFileURL(path.join(root, 'js', 'config.js')).href);
  const problems = releaseProblems(config);
  if (problems.length) {
    for (const p of problems) console.error(`✗ ${p}`);
    process.exit(1);
  }
  console.log('✓ Kontrola wydania: DEV_TOOLS = false.');
}
