# Oprawa wizualna — część 1: fundament i 45 teł — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cel:** zastąpić płaskie tła SVG proceduralnymi „widokami zza okna” w Canvas 2D (45 widoków, wszystkie etapy). Generowanie w workerze, z pamięcią podręczną i galerią do przeglądu. Diorama i interfejs zostają na razie stare (to części 2 i 3).

**Architektura:** Moduły `js/art/` są czyste i deterministyczne: szum, klocki, przepisy widoków. Nie dotykają DOM, więc działają w workerze i w testach Node. Zarządca `Backdrop` liczy tło w workerze (`OffscreenCanvas`, a bez niego na głównym wątku), trzyma wyniki w pamięci podręcznej LRU i rysuje je na `<canvas>` pod warstwami SVG sceny. Ma też opcjonalną warstwę animowaną ≤ 30 fps. `Scene` przestaje rysować niebo i ciała niebieskie w SVG, gdy tło Canvas jest aktywne.

**Technologie:** czysty JS (moduły ES), Canvas 2D, Web Worker z `OffscreenCanvas`, testy `node:test`.

**Projekt (spec):** `docs/superpowers/specs/2026-10-17-oprawa-wizualna-design.md` (punkty 3, 6, 10, 11, 12 i kroki 1–4 z punktu 13). Wzorzec techniki i jakości: `docs/superpowers/specs/2026-10-17-oprawa-wizualna/widoki-zza-okna.html`. Jego funkcje `perlin`, `fbm`, `ridged`, `starfield` oraz czarna dziura, mgławica, Ziemia i kosmiczna sieć są punktem wyjścia, który przenosimy do modułów.

**Części 2 i 3** (dioramy; interfejs, efekty i szlif) dostaną osobne plany po zakończeniu tej części. Zarys jest na końcu dokumentu.

## Global Constraints

- Platforma: PWA na iPhonie (Safari), czysty JS (moduły ES), bez bundlera i zależności w grze. Minimalny iOS: 16.4.
- Sceny to SVG (jak dziś) plus nowe tła z Canvas 2D; żadnych plików graficznych.
- Wszystkie nowe napisy w PL i EN (`js/i18n.js`, `js/lang/en.js`); test `features` i test i18n to pilnują.
- Po każdej zmianie plików gry podbić `CACHE` w `sw.js`. Plik `sw.js` musi też cache'ować nowe pliki z `js/art/`.
- Deterministyczność: każdy przepis ma stały `seed`, więc ten sam widok zawsze wygląda tak samo.
- Budżety:
  - gotowe tło ≤ 0,5 s na telefonie, a w praktyce **≤ 125 ms na komputerze deweloperskim** (≈ 0,5 s przy 4× wolniejszym CPU);
  - główny wątek bez zadań > ~50 ms (generowanie w workerze);
  - animowana warstwa ≤ 30 fps;
  - animacje stoją poza Biurem (`.scene-wrap.paused`), gdy dokument jest ukryty, i w trybie *Oszczędna*;
  - pamięć podręczna ≤ 6 obrazów, gęstość pikseli tła ≤ 2;
  - kod oprawy + ≤ 150 kB.
- Kompozycja widoków spoza Ziemi: główny obiekt (`focus`) w górnych 45% kadru i w poziomie 15–85%. Na dole stanie diorama (część 2) i nie może go zasłonić. *Doprecyzowanie planu na podstawie punktu 7 projektu.*
- Istniejące systemy działają dalej: `phaseFor` (`night/dawn/day/dusk`), `weatherFor` (`clear/cloudy/rain/snow/fog`), pory roku, święta i fajerwerki (SVG), tryb zen, wybór widoku `s.view`, `Scene.signature`, pauza poza Biurem, tryb deweloperski.
- Praca na gałęzi `claude/oprawa-wizualna`; **nie** do `main` (decyzja Piotra: do `main` dopiero po części 3).
- Komentarze w kodzie po polsku, jak w całym projekcie.

## Review Focus

1. **Szybkie przełączanie widoków** (kilka stuknięć w mapę świata albo paski etapów): pokazuje się tylko ostatnio zamówiony widok, a spóźnione wyniki z workera nie nadpisują nowszych. Test: Zadanie 7, `ignores stale worker results`.
2. **Zmiana rozmiaru sceny** (tryb zen, obrót, zmiana okna): tło liczy się od nowa dla nowego rozmiaru zamiast się rozciągać. Test: Zadanie 7, `re-renders when size bucket changes`.
3. **Awaria workera albo przepisu:** zostaje gradient zastępczy, potem wariant z głównego wątku. Nigdy pusta scena ani wyjątek w pętli gry. Test: Zadanie 7, `falls back to main thread when worker fails`.
4. **Aplikacja w tle lub inna zakładka:** pętla animacji staje i wraca po powrocie, bez dublowania pętli. Test: Zadanie 7, `animation loop stops when inactive and never doubles`.
5. **Wyrzucanie z pamięci podręcznej:** wyrzucone obrazy są zwalniane (`close()`), a powrót do takiego widoku liczy go od nowa. Test: Zadanie 7, `lru closes evicted bitmaps`.

---

## Struktura plików

| Plik | Odpowiedzialność |
|---|---|
| `js/art/noise.js` | generator losowy z ziarnem, szum Perlina, fBm, ridged, `clamp/sstep/mix` |
| `js/art/canvas.js` | fabryka płócien (`OffscreenCanvas` / DOM / testowa), pomocnicze `glow()` |
| `js/art/kit/sky.js` | gwiazdy, pas Drogi Mlecznej, mgławica, kosmiczna sieć, zorza |
| `js/art/kit/bodies.js` | planeta, pierścienie, gwiazda/słońce, galaktyka, gromada, czarna dziura |
| `js/art/kit/surface.js` | horyzont powierzchni (regolit, rdza, lód, wydmy, skała, mgła atmosfery) |
| `js/art/kit/earth.js` | niebo ziemskie wg pory dnia i pogody, słońce/księżyc, chmury, plany miasta, góry, woda, mgła |
| `js/art/views/placeholder.js` | przepis zastępczy (gradient + klucz światła), używany do czasu właściwych przepisów |
| `js/art/views/index.js` | rejestr `RECIPES`, `recipeFor(id)`, `VIEW_IDS`, walidacja klucza światła |
| `js/art/views/{earth,space,galaxy,universe}.js` | przepisy widoków etapów |
| `js/art/backdrop.js` | zarządca tła: klucz cache, LRU, worker/wariant główny, zastępczy gradient, przejście, animacja |
| `js/art/worker.js` | worker: render przepisu w `OffscreenCanvas` → `ImageBitmap` |
| `js/scene.js` (zmiana) | `<canvas>` tła w `#scene`, wyłączenie nieba/ciał SVG przy aktywnym tle, `isActive` |
| `js/engine.js`, `js/ui.js`, `js/i18n.js`, `js/lang/en.js` (zmiany) | ustawienie *Jakość grafiki* (`settings.gfx`) |
| `tools/gallery.html`, `js/art/gallery.js` | galeria 45 widoków z czasami (narzędzie deweloperskie) |
| `tests/helpers/mock-canvas.mjs` | płótno testowe dla Node (bufor pikseli, nagrywanie wywołań) |
| `tests/art.test.mjs` | testy modułów `js/art/` |

---

### Task 1: Szum i generator losowy

**Files:**
- Create: `js/art/noise.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Produces: `rng(seed: number): () => number` (wynik w [0, 1)); `perlin(seed: number): (x: number, y: number) => number` (wynik w [−1, 1]); `fbm(n, x, y, octaves: number, lacunarity = 2.03, gain = 0.5): number`; `ridged(n, x, y, octaves: number): number` (wynik w [0, 1]); `clamp(v, a = 0, b = 1)`, `sstep(a, b, x)`, `mix(a, b, t)`.

- [ ] **Step 1: Write the failing tests**

```js
test('noise: rng jest deterministyczny i w [0,1)', () => {
  const a = rng(42), b = rng(42);
  for (let i = 0; i < 1000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
  assert.notEqual(rng(1)(), rng(2)());
});
test('noise: perlin, fbm i ridged mieszczą się w zakresach i zależą od ziarna', () => {
  const n = perlin(7), m = perlin(7), o = perlin(8);
  let diff = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const u = x * 0.173, v = y * 0.191;
    assert.ok(Math.abs(n(u, v)) <= 1);
    assert.equal(n(u, v), m(u, v));
    diff += Math.abs(n(u, v) - o(u, v));
    assert.ok(Math.abs(fbm(n, u, v, 6)) <= 1);
    const r = ridged(n, u, v, 5); assert.ok(r >= 0 && r <= 1);
  }
  assert.ok(diff > 1, 'inne ziarno, inny szum');
});
```

- [ ] **Step 2:** Run `node --test tests/art.test.mjs`. Expected: FAIL, bo nie ma modułu `js/art/noise.js`.
- [ ] **Step 3:** Zaimplementuj `js/art/noise.js`. Weź ciała z funkcji `rng`, `perlin`, `fbm`, `ridged`, `clamp`, `sstep` i `mix` w `widoki-zza-okna.html`. `rng` używa `>>> 0` (32 bity).
- [ ] **Step 4:** Run `node --test tests/art.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit**: `git add js/art/noise.js tests/art.test.mjs && git commit -m "Oprawa: szum proceduralny i generator z ziarnem"`

### Task 2: Fabryka płócien i płótno testowe

**Files:**
- Create: `js/art/canvas.js`, `tests/helpers/mock-canvas.mjs`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Produces:
  - `makeCanvas(w, h)`: zwraca `OffscreenCanvas`, gdy istnieje, w przeciwnym razie `document.createElement('canvas')`;
  - `setCanvasFactory(fn: (w, h) => canvasLike | null)`: `null` przywraca domyślną fabrykę;
  - `glow(ctx, x, y, r, rgb: string, alpha: number)`: radialna poświata, dodaje kolor przy aktywnym `lighter`.
- Produces (testy):
  - `mockCanvas(w, h)` → `{ width, height, getContext() }`. Kontekst ma prawdziwy bufor `Uint8ClampedArray` dla `createImageData/getImageData/putImageData`, a pozostałe metody 2D to zapisywane no-op (`calls: string[]`). Gradienty mają `addColorStop`.
  - `hashPixels(canvas): string` (FNV-1a z bufora).

- [ ] **Step 1: Write the failing test** `canvas: fabryka testowa działa i hash zależy od pikseli`. Sprawdza, że po `setCanvasFactory(mockCanvas)` wywołanie `makeCanvas(4, 4)` zwraca płótno testowe, a `putImageData` z jednym białym pikselem zmienia `hashPixels`.
- [ ] **Step 2:** Run `node --test tests/art.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj oba pliki. Płótno testowe musi wspierać wszystkie metody używane przez klocki: `save/restore/translate/rotate/scale/beginPath/arc/ellipse/moveTo/lineTo/quadraticCurveTo/bezierCurveTo/closePath/fill/stroke/fillRect/clearRect/drawImage/createLinearGradient/createRadialGradient`. Właściwości (`fillStyle`, `globalCompositeOperation`…) mają być przypisywalne. `drawImage` niczego nie kopiuje.
- [ ] **Step 4:** Run `node --test tests/art.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: fabryka płócien i płótno testowe`

### Task 3: Klocki nieba kosmicznego

**Files:**
- Create: `js/art/kit/sky.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Consumes: `noise.js`, `canvas.js`.
- Produces (wszystkie rysują na `ctx` o wymiarach `w×h` w pikselach urządzenia):
  - `stars(ctx, w, h, { seed, count, glowShare = 0.06, tint = null })`;
  - `milkyBand(ctx, w, h, { seed, angle, width, color: [r,g,b], strength = 1 })`;
  - `nebula(ctx, w, h, { seed, palette: [[r,g,b],[r,g,b],[r,g,b]], core: { x, y, r }, dust = 0.85, scale = 95 })`: liczy per piksel w ½ rozdzielczości i skaluje (jak w szkicu);
  - `cosmicWeb(ctx, w, h, { seed, scale = 135, color: [r,g,b], node: [r,g,b], galaxies = 260 })`;
  - `aurora(ctx, w, h, { seed, colors: [[r,g,b],[r,g,b]], y, height })` oraz `auroraAnimator(opts) → (ctx, w, h, t) => void`.

- [ ] **Step 1: Write the failing test** `kit/sky: każdy klocek rysuje bez wyjątku, deterministycznie i zmienia piksele`. Dla każdego klocka: dwa rendery na `mockCanvas(120, 160)` z tym samym ziarnem dają ten sam `hashPixels`, a hash różni się od pustego płótna. Klocki `stars`, `milkyBand` i `aurora` nie piszą do bufora, więc dla nich sprawdzamy niepustą listę `calls`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj, przenosząc gwiazdy, mgławicę i sieć ze szkicu. Uwzględnij poprawki ze szkicu: poświata tylko dla ~6% gwiazd (`glowShare`); w sieci progi `sstep(0.62, 0.98)` dla włókien i `sstep(0.62, 1, f*f2*1.25)^4` dla węzłów.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: klocki nieba kosmicznego`

### Task 4: Klocki ciał niebieskich

**Files:**
- Create: `js/art/kit/bodies.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Consumes: `noise.js`, `canvas.js`.
- Produces:
  - `planet(ctx, { cx, cy, r, seed, kind, light, atmosphere = null, cityLights = false, bands = null, spot = null, clouds = 0.5 })`:
    - `kind ∈ 'earth' | 'rocky' | 'gas' | 'ice' | 'lava'`;
    - `light: [x, y, z]` znormalizowany kierunek ku słońcu w układzie kuli;
    - liczy tylko piksele w obrębie kuli i jej przyciętego prostokąta;
  - `rings(ctx, { cx, cy, r1, r2, tilt, color: [r,g,b], light })`;
  - `sun(ctx, { x, y, r, color: [r,g,b], corona = 1, flare = 0 })`;
  - `galaxy(ctx, { cx, cy, r, tilt, rot, seed, type: 'spiral' | 'elliptical', arms = 2, core: [r,g,b], arm: [r,g,b], dust = 0.6 })`;
  - `cluster(ctx, { cx, cy, r, count, seed, color: [r,g,b] })`;
  - `lens(ctx, w, h, { cx, cy, shadow, thetaE })`: przemapowuje to, co już narysowano, wzorem β = θ − θE²/θ;
  - `blackHole(ctx, w, h, { cx, cy, shadow, seed }) → (ctx, w, h, t) => void`: rysuje statyczne warstwy (tylny dysk, zagięty obraz, cień, pierścień fotonowy, przedni dysk) i zwraca animator smug dysku.

- [ ] **Step 1: Write the failing test** `kit/bodies: klocki rysują bez wyjątku i deterministycznie`. Taki sam schemat jak w Zadaniu 3, plus `blackHole` zwraca funkcję, która przy `t = 1.5` wykonuje wywołania `ellipse`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj. Czarną dziurę przenieś z wersji końcowej szkicu: warstwy liczone per piksel, Doppler `0.38 + 0.62·(0.5 − 0.5·cos φ)^1.4`, łuk nad cieniem szerokości `0.8·shadow`. Planetę przenieś z kafla „Ziemia z orbity”, z parametrem `kind`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: klocki ciał niebieskich i czarnej dziury`

### Task 5: Klocki powierzchni i nieba ziemskiego

**Files:**
- Create: `js/art/kit/surface.js`, `js/art/kit/earth.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Produces:
  - `horizon(ctx, w, h, { seed, y, kind: 'regolith' | 'rust' | 'ice' | 'dunes' | 'rock', haze: [r,g,b] | null, light: [x, y] })`: daleki teren z perspektywą powietrzną, w dolnych ~35% kadru;
  - `earthSky(ctx, w, h, { phase, weather })`: gradient według pory dnia (kolory startowe z `SKIES` w `scene.js`) i przyciemnienie przy złej pogodzie;
  - `sunMoon(ctx, w, h, { phase, weather })`: słońce w dzień, o świcie i o zmierzchu, księżyc nocą; brak przy `rain/snow/fog`;
  - `cloudBank(ctx, w, h, { seed, phase, weather })`: statyczne warstwy chmur; animowane chmury zostają w SVG;
  - `cityPlanes(ctx, w, h, { seed, phase, weather, planes = 3, density })`: trzy plany zabudowy z perspektywą powietrzną, z oknami nocą i o zmierzchu;
  - `mountains(ctx, w, h, { seed, kind: 'fuji' | 'alps', phase })`;
  - `water(ctx, w, h, { y, phase })` (odbicia światła);
  - `fogBank(ctx, w, h, { y, phase })`.

- [ ] **Step 1: Write the failing test** `kit/surface i kit/earth: rysują bez wyjątku dla wszystkich pór dnia i pogód`. Pętla po `['night','dawn','day','dusk'] × ['clear','cloudy','rain','snow','fog']` dla `earthSky`, `sunMoon`, `cloudBank` i `cityPlanes`; `horizon` dla każdego `kind`. Dodatkowo: `sunMoon` przy `rain` nie wykonuje `arc`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: klocki powierzchni i nieba ziemskiego`

### Task 6: Rejestr przepisów i walidacja

**Files:**
- Create: `js/art/views/index.js`, `js/art/views/placeholder.js`, `js/art/views/earth.js`, `js/art/views/space.js`, `js/art/views/galaxy.js`, `js/art/views/universe.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Produces:
  - przepis `Recipe = { id: string, seed: number, placeholder?: true, focus: { x, y }, draw(ctx, w, h, env), light(env) → LightKey, animate?: (ctx, w, h, t) => void }`, gdzie `env = { phase, weather, season, holiday }`. Dla widoków spoza Ziemi `env` jest ignorowany;
  - `LightKey = { color: [r,g,b], dir: [x, y], ambient: number, rim: [r,g,b] }`. `color` i `rim` to liczby całkowite 0–255, `dir` to wektor jednostkowy w stronę źródła światła na ekranie (x w prawo, y w dół), `ambient` mieści się w [0, 1];
  - `RECIPES: Record<id, Recipe>`, `VIEW_IDS: string[]`, `recipeFor(id): Recipe` (nieznane id → przepis HQ etapu `earth`), `validLight(k: LightKey): boolean`;
  - pliki etapów eksportują `EARTH_RECIPES`, `SPACE_RECIPES`, `GALAXY_RECIPES` i `UNIVERSE_RECIPES`. Na tym etapie każdy wpis to `placeholder(id, stops, light)` z osobnego pliku `js/art/views/placeholder.js` (osobny plik, żeby pliki etapów nie importowały `index.js`, który importuje je): gradient w kolorach `stops` z dzisiejszych `SPACE_VIEWS`, `GALAXY_VIEWS`, `UNIVERSE_VIEWS` i `SKIES`, z `placeholder: true`.

- [ ] **Step 1: Write the failing tests**

```js
test('views: każde biuro, kolonia, układ i galaktyka ma przepis', () => {
  const ids = LAYER_ORDER.flatMap((l) => LAYERS[l].OFFICES.map((o) => o.id));
  assert.equal(ids.length, 45);
  for (const id of ids) assert.ok(RECIPES[id], id);
  assert.deepEqual([...VIEW_IDS].sort(), [...ids].sort());
  assert.equal(RECIPES.proxima, undefined);
});
test('views: klucz światła jest poprawny dla każdej pory dnia i pogody', () => {
  for (const id of VIEW_IDS) for (const phase of ['night', 'dawn', 'day', 'dusk']) for (const weather of ['clear', 'rain', 'fog']) {
    assert.ok(validLight(RECIPES[id].light({ phase, weather, season: 'summer', holiday: null })), `${id} ${phase} ${weather}`);
  }
});
test('views: główny obiekt widoków spoza Ziemi jest w górnej części kadru', () => {
  for (const L of ['space', 'galaxy', 'universe']) for (const o of LAYERS[L].OFFICES) {
    const f = RECIPES[o.id].focus; assert.ok(f.y <= 0.45 && f.x >= 0.15 && f.x <= 0.85, o.id);
  }
});
test('views: każdy przepis rysuje bez wyjątku i deterministycznie', () => {
  for (const id of VIEW_IDS) {
    const env = { phase: 'day', weather: 'clear', season: 'summer', holiday: null };
    const a = mockCanvas(90, 120), b = mockCanvas(90, 120);
    RECIPES[id].draw(a.getContext('2d'), 90, 120, env); RECIPES[id].draw(b.getContext('2d'), 90, 120, env);
    assert.equal(hashPixels(a), hashPixels(b), id);
  }
});
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj rejestr i przepisy zastępcze. `focus` dla zastępczych: `{ x: 0.5, y: 0.3 }`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: rejestr 45 widoków z przepisami zastępczymi`

### Task 7: Zarządca tła i worker

**Files:**
- Create: `js/art/backdrop.js`, `js/art/worker.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Consumes: `recipeFor`, `makeCanvas`.
- Produces:
  - `sizeBucket(px: number): number`: zaokrąglenie w górę do wielokrotności 64;
  - `envKey(id, env): string`: dla widoków Ziemi `${phase}|${weather}`, dla innych `''`;
  - `cacheKey(id, env, w, h): string` = `${id}|${envKey}|${sizeBucket(w)}x${sizeBucket(h)}`;
  - `class Lru { constructor(max = 6); get(k); set(k, v) }`: przy wyrzuceniu woła `v.close?.()`;
  - `class Backdrop { constructor(host, deps); show(id, env, { quality }): void; resize(): void; tick(): void; light: LightKey; destroy(): void }`;
  - `deps = { createWorker?: () => WorkerLike | null, raf, caf, isActive: () => boolean, dpr: () => number, renderLocal: (id, env, w, h) => canvasLike }`. W grze `createWorker` tworzy `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`, gdy istnieje `OffscreenCanvas`, a w przeciwnym razie zwraca `null`.
  - Protokół workera:

```js
// główny → worker
{ req: number, id: string, env: object, w: number, h: number }
// worker → główny
{ req: number, bitmap: ImageBitmap, ms: number } | { req: number, error: string }
```

  - `show()`:
    1. od razu maluje gradient zastępczy (`placeholder` przepisu albo `stops` z `light.color`);
    2. bierze tło z cache albo zamawia render z nowym `req`;
    3. po odbiorze robi przejście ~400 ms;
    4. wynik ze starszym `req` niż ostatni jest ignorowany, a bitmapa trafia do cache.
  - Warstwa animowana:
    - osobny `<canvas>` rysowany przez `recipe.animate` co ≥ 33 ms;
    - tylko gdy `isActive()` i `quality === 'full'`;
    - jedna pętla `raf` naraz.
  - `light` to klucz światła bieżącego widoku (używany w części 2).

- [ ] **Step 1: Write the failing tests** (fałszywy worker, `raf` i `mockCanvas`):
  - `backdrop: cacheKey i sizeBucket`: `sizeBucket(1)===64`, `sizeBucket(640)===640`, `sizeBucket(641)===704`; klucz Ziemi zawiera porę i pogodę, a klucz `sgr` nie.
  - `lru closes evicted bitmaps`: przy `max = 2` trzecie `set` woła `close` na najstarszym.
  - `ignores stale worker results`: `show('sgr')`, potem `show('orion')`; odpowiedź dla `sgr` po odpowiedzi dla `orion` nie zmienia wyświetlanego id.
  - `re-renders when size bucket changes`: po zmianie rozmiaru hosta i `resize()` idzie nowe zamówienie z nowymi `w×h`; bez zmiany kubełka nie ma zamówienia.
  - `falls back to main thread when worker fails`: `createWorker` zwraca `null` albo worker odpowiada `{ error }` → wołane jest `renderLocal`.
  - `animation loop stops when inactive and never doubles`: przy `isActive=false` brak nowych `raf`; po dwóch `show()` dla widoku z `animate` aktywna jest dokładnie jedna pętla.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj `backdrop.js` i `worker.js`. Worker importuje `./views/index.js`, renderuje do `new OffscreenCanvas(w, h)` i odsyła `transferToImageBitmap()` z listą transferu. Wariant lokalny renderuje w połowie rozdzielczości (`w/2×h/2`, skalowanie przy rysowaniu) po `setTimeout(0)`. *Uproszczenie względem projektu („na głównym wątku w kawałkach”): przy minimalnym iOS 16.4 worker jest zawsze dostępny, więc wariant lokalny to tylko zabezpieczenie.*
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa: zarządca tła z workerem, pamięcią podręczną i animacją`

### Task 8: Wpięcie w scenę i ustawienie „Jakość grafiki”

**Files:**
- Modify:
  - `js/scene.js`: konstruktor `Scene` i `render()`; usuwamy rysowanie nieba w liniach ~785–839 przy aktywnym tle;
  - `js/engine.js`: `createMeta`/`sanitizeMeta` dostają `settings.gfx`;
  - `js/ui.js`: `renderSettings`, obsługa akcji;
  - `js/i18n.js`, `js/lang/en.js`: nowe teksty;
  - `js/main.js`: reset zachowuje `gfx`;
  - `css/style.css`: `.scene canvas`;
  - `sw.js`: nowe pliki w `ASSETS`, `CACHE` → `v8`.
- Test: `tests/art.test.mjs`, `tests/balance.test.mjs`

**Interfaces:**
- Consumes: `Backdrop`, `recipeFor`.
- Produces:
  - `Scene.backdrop: Backdrop`;
  - `settings.gfx ∈ 'full' | 'eco'` (domyślnie `'full'`);
  - teksty `set.gfx`, `set.gfxHint`, `set.gfxFull`, `set.gfxEco` (PL i EN).

- [ ] **Step 1: Write the failing test** `gfx: domyślnie pełna, nieznana wartość wraca do pełnej, wybór przechodzi przez zapis`. Sprawdza `createMeta().settings.gfx === 'full'`, że `sanitizeMeta({ settings: { gfx: 'ultra' } })` daje `'full'`, a `'eco'` zostaje po `serialize`/`load`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj:
  - **Silnik i interfejs:** pole `gfx` w silniku; przełącznik dwóch opcji w ustawieniach (sekcja *Gra*, pod piaskownicą).
  - **Scena:**
    - w `Scene` utwórz `<canvas class="backdrop">` i `<canvas class="backdrop-anim">` jako pierwsze dzieci `#scene` oraz `new Backdrop(...)` z `isActive = () => !wrap.classList.contains('paused') && !document.hidden`;
    - w `render()` wołaj `this.backdrop.show(view, env, { quality })` i pomijaj w SVG prostokąt nieba, gwiazdy, słońce, księżyc, ciała (`spaceBodies/galaxyBodies/universeBodies`), `BACKDROPS` oraz dalekie prostokąty miasta;
    - zostają: chmury, kometa, satelity, fajerwerki, nietoperze, budowle (`LANDMARKS`), grunt i budynek;
    - `ResizeObserver` na `#scene` woła `backdrop.resize()`; `dpr = () => Math.min(devicePixelRatio || 1, 2)`;
    - z gwiazd SVG zostają tylko migające (co trzecia, klasa `star`), dla ruchu nad statycznym tłem;
    - ruch CSS z projektu (punkt 6.1, poziom 1): `canvas.backdrop` ma bardzo powolny najazd kamery (`scale` 1 → 1,06 w ~60 s, w obie strony), tylko przy `quality === 'full'`; zatrzymuje go istniejąca reguła `.scene-wrap.paused *`.
  - **CSS:** tło sceny `transparent` dla wszystkich etapów (dziś `#app[data-layer=…] .scene-wrap` ma kolor), żeby było widać canvas.
- [ ] **Step 4:** Run `npm test`. Expected: PASS (wszystkie dotychczasowe testy i nowy).
- [ ] **Step 5: Sprawdź w przeglądarce** (podgląd `krzemowe-imperium`, port 8090; przed sprawdzeniem wyrejestruj service workera):
  - na każdym z 4 etapów widać gradient zastępczy pod budynkiem;
  - przełączenie na *Oszczędna* zatrzymuje warstwę animowaną;
  - przejście na zakładkę Produkty zatrzymuje pętlę `raf` (sprawdź licznikiem w `window.__co` albo przez `performance`);
  - konsola bez błędów.
- [ ] **Step 6: Commit**: `Oprawa: tło Canvas w scenie i ustawienie jakości grafiki`

### Task 9: Galeria widoków

**Files:**
- Create: `tools/gallery.html`, `js/art/gallery.js`
- Modify:
  - `js/ui.js`: w `devSettings()` link „Galeria widoków” otwierający `tools/gallery.html` w nowej karcie;
  - `js/i18n.js` i `js/lang/en.js`: tekst `set.devGallery`.

**Interfaces:**
- Consumes: `RECIPES`, `VIEW_IDS`, `recipeFor`, `makeCanvas`.
- Produces: strona z siatką 45 kafli 300×400 CSS px (gęstość 2) pogrupowanych według etapów:
  - podpis: id i nazwa miejsca (`TX.officeName`);
  - czas renderu w ms, na czerwono > 125 ms;
  - przy widokach Ziemi przełącznik pory dnia i pogody;
  - animowane widoki chodzą.

- [ ] **Step 1:** Zaimplementuj galerię. Renderuj kolejno na głównym wątku, żeby mierzyć czas każdego przepisu osobno.
- [ ] **Step 2: Sprawdź w przeglądarce:** `http://localhost:8090/tools/gallery.html` pokazuje 45 kafli, w konsoli brak błędów, czasy są widoczne.
- [ ] **Step 3: Commit**: `Oprawa: galeria widoków w trybie deweloperskim`

### Task 10: Widoki Galaktyki (9)

**Files:**
- Modify: `js/art/views/galaxy.js`
- Test: `tests/art.test.mjs`

**Interfaces:**
- Consumes: klocki z Zadań 3–4.
- Produces: 9 przepisów bez `placeholder`. ★ = przepis dopracowany. Treść według projektu (punkt 6.3):

| id | Treść | Animacja | Klucz światła (kolor) |
|---|---|---|---|
| `sol` ★ | rój Dysona wokół Słońca: tysiące lśniących paneli | migotanie paneli | ciepła biel |
| `alpha` | dwa słońca A i B, daleka czerwona Proxima | — | złocista |
| `trappist` | ciemnoczerwona gwiazda, planety jako sierpy | — | czerwień |
| `pleiades` | niebieskie gwiazdy w mgławicy refleksyjnej | — | błękit |
| `crab` ★ | włókna pozostałości supernowej | pulsujący pulsar | turkus |
| `orion` ★ | mgławica ze szkicu | powolny dryf gwiazd | róż i turkus |
| `omega` | gęsta gromada kulista | — | złoto |
| `lmc` ★ | Droga Mleczna widziana z zewnątrz (spirala) | — | perłowa biel |
| `sgr` ★ | czarna dziura ze szkicu | wirujący dysk | pomarańcz |

- [ ] **Step 1: Write the failing test** `views/galaxy: brak przepisów zastępczych` (`!GALAXY_RECIPES[id].placeholder` dla wszystkich 9) oraz `animowane są sol, crab, orion i sgr` (`typeof animate === 'function'`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj przepisy. Zachowaj ograniczenia `focus` i budżet czasu.
- [ ] **Step 4:** Run `node --test tests/art.test.mjs`. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii:** każdy z 9 kafli jest rozpoznawalny i różny od pozostałych, czasy ≤ 125 ms, animacje płynne. Zrób zrzut galerii Galaktyki.
- [ ] **Step 6: Punkt kontrolny dla Piotra:** pokaż zrzut i link do galerii. To pierwszy zestaw w docelowej jakości, więc poczekaj na uwagi, zanim zaczniesz Zadania 11–13.
- [ ] **Step 7: Commit**: `Oprawa: widoki Galaktyki`

### Task 11: Widoki Wszechświata (9)

**Files:** Modify `js/art/views/universe.js`. Test: `tests/art.test.mjs`.

**Interfaces:**

| id | Treść | Animacja | Klucz światła |
|---|---|---|---|
| `milkyway` | nasza galaktyka od czoła | — | perłowa biel |
| `andromeda` ★ | wielka spirala pod kątem z satelitami | — | chłodna biel |
| `triangulum` | luźna spirala z różowymi obszarami gwiazdotwórczymi | — | róż |
| `virgo` | rój galaktyk eliptycznych, M87 z dżetem | pulsowanie dżetu | złoto |
| `bullet` ★ | dwie zderzające się gromady: różowy gaz, niebieska mapa masy | — | magenta i błękit |
| `attractor` | strumienie galaktyk ku jasnemu obszarowi | powolny dryf | ciepła biel |
| `bootes` | prawie pusta czerń z kilkoma galaktykami | — | przygaszona biel, `ambient` ≤ 0.2 |
| `hercules` | gęsty pas galaktyk przez kadr (kosmiczna sieć) | — | fiolet |
| `edge` ★ | cętkowane mikrofalowe tło, pierwsze gwiazdy | — | pomarańcz |

- [ ] **Step 1: Write the failing test** `views/universe: brak przepisów zastępczych`; `bootes` ma `ambient` ≤ 0.2.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj przepisy.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii:** rozpoznawalność, różnorodność, czasy ≤ 125 ms.
- [ ] **Step 6: Commit**: `Oprawa: widoki Wszechświata`

### Task 12: Widoki Kosmosu (9)

**Files:** Modify `js/art/views/space.js`. Test: `tests/art.test.mjs`.

**Interfaces:**

| id | Treść | Horyzont (`horizon.kind`) | Animacja |
|---|---|---|---|
| `leo` ★ | Ziemia z orbity ze szkicu: dzień i noc, światła miast | — | satelita |
| `l2` | czerń, odległe Słońce, Ziemia i Księżyc razem, głębokie pole galaktyk | — | — |
| `moon` | czarne niebo, wiszący błękitny glob Ziemi | `regolith` | — |
| `mars` ★ | maślane niebo, niebieski zachód słońca, Fobos | `rust` | — |
| `venus` | wnętrze żółtych chmur, przytłumione słońce | — (warstwy chmur) | powolny dryf chmur |
| `mercury` | ogromne Słońce, czarne niebo | `rock` | — |
| `ceres` | ciemne skały, jasne plamy, mała tarcza Słońca | `rock` | — |
| `europa` ★ | spękany lód, ogromny Jowisz z pasami i Wielką Czerwoną Plamą | `ice` | — |
| `titan` | gęsta pomarańczowa mgła, metanowe jeziora, ledwo widoczny Saturn | `dunes`, `haze` | — |

- [ ] **Step 1: Write the failing test** `views/space: brak przepisów zastępczych`; `mars.focus` i `europa.focus` spełniają ograniczenia kompozycji.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj przepisy. Horyzont tylko w dolnych ~35%, bo w części 1 i tak zasłania go grunt SVG. Pełny widok pokaże się po przejściu na wyspę w części 2.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii i w grze** (tryb deweloperski: odblokuj etapy, przełącz kolonie): czasy ≤ 125 ms, brak kolizji z gruntem SVG.
- [ ] **Step 6: Commit**: `Oprawa: widoki Kosmosu`

### Task 13: Widoki Ziemi (18 miast)

**Files:** Modify `js/art/views/earth.js`. Test: `tests/art.test.mjs`.

**Interfaces:**
- Każdy przepis to `earthSky + sunMoon + cloudBank + cityPlanes` z ziarnem miasta plus element miejsca z tabeli w punkcie 6.3 projektu:
  - `mountains`: Tokio (`fuji`), Zurych (`alps` ★);
  - `water`: Warszawa (Wisła), San Francisco, Lagos, Sydney, Sztokholm, Singapur, Toronto, Tel Awiw;
  - `fogBank`: San Francisco, gdy `weather === 'clear'` i `phase` to `dawn` lub `day`;
  - `aurora`: Reykjavík nocą ★ (z `auroraAnimator`);
  - pustynny pył: Dubaj (ciepły `haze` w `cityPlanes`);
  - ciepła mgiełka: Bengaluru.
- `light(env)`: kolor i kierunek z pory dnia (świt i zmierzch ciepło i nisko, dzień biało i wysoko, noc chłodno z `ambient` ≤ 0.35). Przy `rain`, `snow` i `fog` `ambient` rośnie, a `color` szarzeje.
- Budowle (`LANDMARKS`) zostają w SVG. Przepis ich nie rysuje.

- [ ] **Step 1: Write the failing test**:
  - `views/earth: brak przepisów zastępczych`;
  - `rkv ma animację tylko nocą` (`animate` istnieje, a `rkv.light({phase:'night'})` ma niebiesko-zielony `color` z kanałem G > R);
  - `noc ma niższe ambient niż dzień` dla wszystkich 18.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj przepisy. Animacja zorzy działa tylko przy `phase === 'night'` (przepis zwraca no-op w inne pory).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii** wszystkie 4 pory dnia i 5 pogód dla 3 miast (Warszawa, Reykjavík, San Francisco) **oraz w grze**: tło zmienia się przy zmianie pory dnia. Wymuś ją przez podmianę `Date` w konsoli albo przez przewinięcie czasu w trybie deweloperskim.
- [ ] **Step 6: Commit**: `Oprawa: widoki 18 miast`

### Task 14: Sprzątanie, wydajność i dokumentacja

**Files:**
- Modify:
  - `js/scene.js`: usuń nieużywane już `spaceBodies`, `galaxyBodies`, `universeBodies`, `spiral`, `elliptical`, `BACKDROPS` i wpis `proxima`, zostawiając `stops/ground/edge` potrzebne gruntowi SVG;
  - `README.md`: sekcja o tłach i galerii;
  - `sw.js`: `CACHE` → kolejna wersja;
  - `js/main.js`: `VERSION` → `2.5.0`.
- Test: `tests/art.test.mjs`

- [ ] **Step 1: Write the failing test** `views: nie ma już przepisów zastępczych` (`VIEW_IDS.every((id) => !RECIPES[id].placeholder)`).
- [ ] **Step 2:** Run. Powinien przejść, jeśli Zadania 10–13 są kompletne. Jeśli nie przechodzi, uzupełnij brakujące przepisy przed dalszą pracą.
- [ ] **Step 3:** Usuń martwy kod. Run `npm test`. Expected: PASS (wszystkie testy).
- [ ] **Step 4: Pomiar:**
  - w galerii zapisz czasy wszystkich 45 widoków; żaden nie przekracza 125 ms;
  - rozmiar `js/art/` + zmian ≤ 150 kB (`du -b js/art`);
  - na iPhonie przez Wi-Fi: czas od otwarcia Biura do gotowego tła i płynność przewijania listy Produktów przy animowanym widoku `sgr`.

  Wyniki wpisz do README (sekcja *Wydajność*).
- [ ] **Step 5: Commit**: `Oprawa: sprzątanie po starych tłach, pomiary, README`

---

## Zarys części 2 i 3 (osobne plany po zakończeniu części 1)

**Część 2: dioramy.**
- **Wyspy:** wyspa lub platforma pod strukturą z materiałem miejsca (regolit, rdza, lód, trawa i chodnik); grunt SVG znika.
- **Bryły:** prymitywy izometryczne z trzema tonami i klucz światła z `backdrop.light` (tonacja, obrys, kierunek cienia, okna nocą).
- **Etapy:** dioramy Ziemi (garaż → biuro → wieżowiec → kampus), Kosmosu (stacja na platformie), Galaktyki (statek-matka w doku) i Wszechświata (cytadela na odłamku).
- **Działy:** mapowanie dział → element z emblematem; obsada według progów `SEATS`; ozdoby za rundy.
- **Kadr:** kadrowanie między HUD-em a dolnym panelem; czytelność 13 działów na iPhonie SE.

**Część 3: interfejs, efekty i szlif.**
- **Układ Biura:** pełnoekranowa scena z HUD-em i dolnym panelem ze szkła, wariant bez rozmycia w trybie *Oszczędna*; na innych zakładkach rozmyta kopia tła.
- **Reskin:** pasek zakładek, karty, przyciski i bąbelki.
- **Efekty:** kliknięcia, zakupy, kamienie milowe, rundy, przejścia etapów; `prefers-reduced-motion`.
- **Zakończenie:** pomiary na iPhonie; scalenie do `main` po akceptacji Piotra.
