// Kontrola wydania (tools/release-check.mjs): pada przy DEV_TOOLS = true, przechodzi przy false.
// Sprawdza zarówno funkcję, jak i prawdziwe wywołanie z wiersza poleceń (kod wyjścia dla CI).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseProblems } from '../tools/release-check.mjs';

const SCRIPT = fileURLToPath(new URL('../tools/release-check.mjs', import.meta.url));

test('release-check: DEV_TOOLS = true albo brak flagi blokuje wydanie, false je przepuszcza', () => {
  assert.equal(releaseProblems({ DEV_TOOLS: true }).length, 1);
  assert.match(releaseProblems({ DEV_TOOLS: true })[0], /DEV_TOOLS/);
  assert.equal(releaseProblems({}).length, 1, 'brak flagi to nie zgoda na wydanie');
  assert.equal(releaseProblems({ DEV_TOOLS: 'false' }).length, 1, 'tylko prawdziwe false');
  assert.deepEqual(releaseProblems({ DEV_TOOLS: false }), []);
});

test('release-check z wiersza poleceń: kod 1 przy DEV_TOOLS = true, 0 przy false', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'ki-release-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'js'));
  await writeFile(join(dir, 'package.json'), '{"type":"module"}');
  const run = async (value) => {
    await writeFile(join(dir, 'js/config.js'), `export const DEV_TOOLS = ${value};\n`);
    return spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  };
  const on = await run(true);
  assert.equal(on.status, 1);
  assert.match(on.stderr, /DEV_TOOLS/);
  // nowy plik o tej samej nazwie: osobny proces, więc bez pamięci podręcznej modułów
  const off = await run(false);
  assert.equal(off.status, 0, off.stderr);
});
