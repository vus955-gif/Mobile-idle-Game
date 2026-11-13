# Oprawa wizualna — część 2: dioramy — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cel:** zastąpić płaski budynek i grunt SVG izometrycznymi dioramami na unoszących się wyspach. Każdy z 4 etapów dostaje własną bryłę, która widocznie rośnie z działami, obsadą i rundami. Diorama bierze światło z tła (klucz światła z części 1) i mieści wszystkie działy na ekranie iPhone'a SE.

**Architektura:** Nowy katalog `js/diorama/` zawiera czyste moduły bez DOM, które budują napisy SVG i dają się testować w Node. Moduły robią cztery rzeczy:
- liczą rzut 2:1 i trzy tony światła;
- składają bryły z danych (archetypy działów jako listy części);
- rysują wyspę z materiałem miejsca;
- układają działki i kadrują dioramę.

`Scene` (`js/scene.js`) zostaje koordynatorem. Liczy podpis stanu, buduje model dioramy z gry i wstawia warstwy SVG. Warstwy dzielą się na dwa układy współrzędnych:
- **niebo, budowle miast i pogoda** mają współrzędne sceny (piksele CSS), więc trzymają się tła Canvas;
- **diorama** ma własne współrzędne. Jej `viewBox` liczy `frameFor`, tak żeby mieściła się w pasie między górnymi nakładkami a dolną krawędzią.

**Technologie:** czysty JS (moduły ES), SVG, testy `node:test`. Bez zależności i plików graficznych.

**Projekt (spec):** `docs/superpowers/specs/2026-10-17-oprawa-wizualna-design.md`, zwłaszcza:
- punkt 5 (kadr, diorama, światło, palety);
- punkt 6.3 (budowle miast z kluczem światła);
- punkt 7 (cały);
- punkt 8 (nowy dział wyrasta);
- punkt 10 (budżety);
- punkty 11–12;
- krok 5 z punktu 13.

Decyzje z części 1 są w `docs/superpowers/plans/2026-10-17-oprawa-1-rejestr.md`. Zarys tej części jest na końcu `2026-10-17-oprawa-1-fundament-i-tla.md`.

**Część 3** (szkło, efekty, przejścia, `prefers-reduced-motion`, scalenie do `main`) dostanie osobny plan. Rzeczy, które ta część jej przekazuje, są na końcu dokumentu.

## Global Constraints

- Platforma: PWA na iPhonie (Safari), czysty JS (moduły ES), bez bundlera i zależności. Minimalny iOS: 16.4.
- Bez plików graficznych. Diorama zostaje w SVG z warstwą statyczną i animowaną (projekt, punkt 7). Tło Canvas z części 1 zmienia się tylko o pole `horizon` w przepisach Ziemi.
- Rzut izometryczny 2:1 (~26,57°) i trzy tony na bryłę: góra jasna, bok od strony światła średni, drugi bok ciemny. Miękki cień pada na własną wyspę, nigdy na tło.
- Kolory brył pochodzą z palety etapu (projekt, punkt 5) zmodyfikowanej kluczem światła `backdrop.light = { color, dir, ambient, rim }`:
  - `dir` to wektor jednostkowy w stronę światła na ekranie (x w prawo, y w dół);
  - przy `ambient < 0,45` okna świecą.
- Obsadę pokazują progi `SEATS = [1, 5, 15, 40, 100]` przez gęstość świateł, ludzi i pojazdów, a nie przez liczbę biurek. Dokładne liczby zostają w zakładce Zespół.
- Rundy liczymy jako `min(prestigeCount, 8)`. Dodają ozdoby i rozmiar.
- **Czytelność na iPhonie SE** (projekt, punkt 7). Punkt odniesienia to zainstalowana aplikacja z paskiem stanu 20 px. Scena ma wtedy **341×273** px CSS. Zmierzono to 19.10.2026 w podglądzie przy 375×667 i `--safe-top: 20px`.
  - Pas dioramy zaczyna się 48 px od góry (pasek etapów kończy się na 42 px, do tego 6 px marginesu) i kończy 6 px nad dolną krawędzią.
  - Przy maksymalnej dioramie każdego etapu emblemat działu ma średnicę ≥ **16 px**, a działka szerokość ≥ **28 px**. Emblematy nie nachodzą na siebie, a budynek działu nie jest zasłonięty przez budynek przed nim.
- Budżety:
  - `Scene.render` przy maksymalnej dioramie zajmuje ≤ 12 ms na komputerze deweloperskim, co daje ≈ 50 ms przy 4× wolniejszym CPU (projekt, punkt 10);
  - warstwa statyczna dioramy ma ≤ 1200 elementów SVG;
  - elementów animowanych jest ≤ `MAX_ANIM = 40`;
  - filtrów rozmycia (`filter=`) jest ≤ 8;
  - kod może urosnąć **netto o ≤ 25 000 B** (JS i CSS w `js/` i `css/` bez plików galerii) względem `da2d8c7`. Część 1 zużyła ok. 107 kB z budżetu 150 kB, więc tak zostanie ≥ 18 kB na część 3.
- Animacje używają tylko istniejących klas CSS: `person`, `car`, `blink`, `screen`, `floor-new`. Te klasy zatrzymuje już reguła `.scene-wrap.paused *` i wyłącza `prefers-reduced-motion`. Nic nie miga szybciej niż 3 razy na sekundę.
- Bez SMIL (`<animate>`, `<animateMotion>`), bo CSS go nie pauzuje. Bez `var()` w `@keyframes`.
- Identyfikatory w `<defs>` dioramy mają przedrostek `d-`. Wszystkie SVG sceny dzielą jedną przestrzeń `id` dokumentu.
- Istniejące systemy działają dalej:
  - pora dnia, pory roku (barwa trawy, drzewa, śnieg na dachach), pogoda (deszcz, śnieg i mgła nad dioramą);
  - święta (choinka, lampki, dynie, nietoperze, fajerwerki), tryb zen, wybór widoku;
  - `Scene.signature`, pauza poza Biurem, tryb deweloperski, ustawienie *Jakość grafiki*.
- W grze nie przybywa napisów. Galeria dioram to narzędzie deweloperskie po polsku z linkiem z galerii widoków. Gdyby jednak doszedł napis w grze, musi być w PL i EN (`js/i18n.js`, `js/lang/en.js`).
- Po każdej zmianie plików gry trzeba podbić `CACHE` w `sw.js`. Każdy moduł `js/diorama/` poza galerią musi być w `ASSETS`.
- Praca idzie na gałęzi `claude/oprawa-wizualna`, **nie** do `main` i bez pushu (decyzja Piotra: scalenie po części 3; repo jest publiczne).
- Komentarze w kodzie są po polsku, jak w całym projekcie.

## Review Focus

1. **Zmiana rozmiaru sceny** (tryb zen, obrót, zmiana okna, powrót na Biuro). Diorama przekadrowuje się do nowego pasa bez przebudowy, a budowle miast zostają na linii horyzontu tła. Render przy zerowym rozmiarze nie wstawia `NaN` i czeka, aż rozmiar będzie znany. Testy:
   - Zadanie 4: `frame: diorama mieści się w pasie…` i `frame: większa diorama oddala kamerę…, zerowy rozmiar → null`;
   - Zadanie 6: `skyline: budowle stoją na horyzoncie tła przy każdym rozmiarze sceny…`, do tego sprawdzenie w przeglądarce.
2. **Maksymalna diorama na iPhonie SE z dodatkami** (wszystkie działy, obsada 100, 8 rund, zima, śnieg, Boże Narodzenie). Wszystko mieści się w pasie, emblematy są czytelne i się nie nakładają, budżety są dotrzymane. Testy w Zadaniu 5: `diorama: wszystkie działy każdego etapu mieszczą się i są czytelne na iPhonie SE` oraz `diorama: budżety…`. Ten sam test pilnuje Zadań 8–12, bo iteruje po prawdziwej oprawie etapów.
3. **Skrajne klucze światła:** Pustka Wolarza (`ambient` ≤ 0,2), noc z deszczem, słońce prosto z góry na Wenus i Tytanie. Bryły mają poprawne kolory i nie znikają w ciemności, a jaśniejszy bok jest od strony światła. Test w Zadaniu 1: `iso: tony są poprawne i widoczne dla klucza światła każdego z 45 widoków`.
4. **Przełączenie etapu albo widoku i reset rundy.** Animację wyrastania dostaje tylko nowo odblokowany dział. Pierwsze wejście na etap i powrót na niego nie animują wszystkich budynków, a ponowne odblokowanie po resecie znów animuje. Dziś zbiór `knownFloors` jest wspólny dla etapów, więc po zmianie etapu wszystko wyrasta naraz. Test w Zadaniu 5: `diorama: nowy dział wyrasta tylko raz…`.
5. **Nazwa firmy** ze znakami `<>&"`, emoji albo bardzo długa. Tabliczki na garażu, biurze, wieżowcu i stacji są escapowane i skracane znakiem „…”, a SVG zostaje poprawny. Testy: Zadanie 2 `parts: tabliczka z nazwą firmy jest escapowana i skracana` i Zadanie 8 `earth: tabliczki rdzenia…`.

---

## Wspólne typy (używają ich wszystkie zadania)

```js
// Klucz światła z części 1 (js/art/views/index.js, validLight)
LightKey = { color: [r,g,b], dir: [x, y], ambient: number, rim: [r,g,b] }

// Część bryły: krotka w kafelkach (x, y) i poziomach (z) względem początku działki; rysowana w podanej kolejności (od tyłu)
Part =
  | ['box',   x, y, z, w, d, h, mat, flags?]   // flags: 'win' (okna na widocznych ścianach), 'ledge' (gzyms)
  | ['pyr',   x, y, z, w, d, h, mat]           // ostrosłup / dach czterospadowy / iglica
  | ['gable', x, y, z, w, d, h, mat, axis]     // dach dwuspadowy, axis 'x' | 'y'
  | ['cyl',   x, y, z, r, h, mat, flags?]      // pionowy walec (silos, rotunda, moduł)
  | ['dome',  x, y, z, r, mat]
  | ['ring',  x, y, z, r, mat, pose]           // pose 'flat' (krąg, halo) | 'upright' (portal)
  | ['dish',  x, y, z, r]                      // antena-talerz
  | ['panel', x, y, z, w, d]                   // panel słoneczny
  | ['mast',  x, y, z, h]                      // maszt z migającym światłem (warstwa animacji)
  | ['glow',  x, y, z, r, mat]                 // świecąca kula (gradient radialny, nie filtr)
  | ['label', x, y, z, w, max]                 // tabliczka z nazwą firmy (max znaków)
  | ['sign',  x, y, z]                         // punkt zaczepienia emblematu działu — dokładnie jeden na archetyp
// mat ∈ 'wall' | 'wall2' | 'glass' | 'roof' | 'metal' | 'dark' | 'crystal' | 'green' | 'accent' (accent = kolor działu)

DioramaModel = {
  stage: 'earth' | 'space' | 'galaxy' | 'universe',
  view: string,                                   // id miasta, kolonii, układu, galaktyki
  depts: Array<{ id, icon, color, tier: 0..5, isNew: boolean }>,  // odblokowane, w kolejności DEPTS
  firstHeads: number,                             // obsada pierwszego działu (ludzie w garażu)
  rounds: number,                                 // min(prestigeCount, 8)
  company: string,                                // surowa nazwa firmy (escapuje i skraca builder)
  env: { phase, season, weather, holiday, newYear, snowCover },
  light: LightKey,
}

StageArt = {
  id, placeholder?: true,
  palette: Palette,                               // { wall, wall2, glass, roof, metal, dark, crystal, green, ground } (hex)
  coreForm(n): string,                            // forma rdzenia przy n odblokowanych działach
  coreFoot(n, rounds): { w, d, h },               // obrys i wysokość rdzenia (do układu i testów)
  core(model): { parts: Part[], ornaments: string[] },        // rdzeń = pierwszy dział + ozdoby rund
  depts: Record<deptId, Part[]>,                  // archetyp każdego działu poza pierwszym
  extras?(model, lay): { svg: string, anim: string[], decor: string[], vehicles: number, people: number },
}

Diorama = {
  front: string, frontAnim: string,               // zawartość dwóch warstw SVG dioramy
  bbox: [x0, y0, x1, y1],                         // w jednostkach dioramy
  lots: Array<{ id, emblem: { x, y, r }, box: [x0, y0, x1, y1], foot: number }>,  // w kolejności rysowania; foot = szerokość obrysu
  stats: { people, vehicles, lit, ornaments: string[], decor: string[], base, material, elements, anim },
}
```

## Struktura plików

| Plik | Odpowiedzialność |
|---|---|
| `js/diorama/iso.js` | rzut 2:1, kolory, `tones` (trzy tony z klucza światła), prymitywy, cień, okna |
| `js/diorama/parts.js` | `PALETTES`, `assemble` (bryły z listy `Part`), emblemat, tabliczka, `SEATS`/`tierFor`/`CREW`, budżet animacji, `drive` (pojazdy), drobna grafika przeniesiona ze sceny (ludzie, drzewa, dynie, choinka, lampki, auto, łazik), `seeded`, `shade`, `esc` |
| `js/diorama/island.js` | `PLACES` dla 45 widoków (podstawa, materiał, efekty nieba), wyspy, platformy, aerostat, dok, odłamek |
| `js/diorama/frame.js` | `frameFor`, stałe SE i progi czytelności |
| `js/diorama/layout.js` | `SLOTS`, `CORE_AT`, `LOT_MAX_H`, `layout()` (rozmiar wyspy, działki, kolejność) |
| `js/diorama/index.js` | `modelFor`, `newIds`, `GENERIC` (dioramy zastępcze), `STAGE_ART`, `buildDiorama` |
| `js/diorama/{earth,space,galaxy,universe}.js` | oprawa etapów (`StageArt`) |
| `js/diorama/skyline.js` | `LANDMARKS` i `CITY_VIEWS` przeniesione z `scene.js`, oświetlone kluczem światła, na horyzoncie tła |
| `js/diorama/gallery.js`, `tools/dioramas.html` | galeria dioram (narzędzie deweloperskie) |
| `js/scene.js` (zmiana) | koordynator: podpis, warstwy w dwóch układach współrzędnych, kadr i wcięcia, niebo SVG, pogoda |
| `js/art/views/common.js`, `js/art/views/earth.js` (zmiana) | pole `horizon` (linia panoramy miasta, ułamek wysokości) |
| `js/main.js` (zmiana) | `window.__scene` w trybie deweloperskim (pomiar), `VERSION` |
| `css/style.css`, `sw.js`, `README.md`, `tools/gallery.html` (zmiany) | warstwy, pamięć offline, dokumentacja, link do galerii dioram |
| `tests/diorama.test.mjs`, `tests/helpers/svg.mjs` | testy dioram, `checkSvg`, `lum` |

---

### Task 1: Rzut izometryczny, tony światła i prymitywy

**Files:**
- Create: `js/diorama/iso.js`, `tests/helpers/svg.mjs`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: `RECIPES`, `VIEW_IDS` (`js/art/views/index.js`) tylko w teście.
- Produces:
  - `TW = 40`, `TH = 20`, `LV = 12`: szerokość i wysokość rombu kafelka oraz wysokość jednego poziomu w jednostkach dioramy;
  - `iso(gx, gy, gz = 0): [x, y]` = `[(gx − gy)·TW/2, (gx + gy)·TH/2 − gz·LV]`;
  - `rgb(hex | [r,g,b]): [r,g,b]`, `css(c): 'rgb(r,g,b)'`, `mixRgb(a, b, t)`;
  - `tones(base, light, { snow = false } = {}): { top, left, right, rim, rimAlpha }`:
    - bok oświetlony to prawy, gdy `light.dir[0] > 0,2`, w przeciwnym razie lewy (konwencja projektu);
    - wzór: `kolor = base × (ambient + (1 − ambient)·k) × tint`, gdzie `k_top = 1`, `k_lit = 0,78`, `k_dark = 0,52`, a `tint = mix(biały, light.color/255, 0,35)`;
    - podłoga jasności sprawia, że bryła nie znika w czerni;
    - `rimAlpha = 0,2 + 0,6·(1 − ambient)`;
    - `snow` miesza górę z bielą w 0,75;
  - `box(b, t, { rim = true } = {}): string`, gdzie `b = { gx, gy, gz = 0, w, d, h }`. Rysuje trzy ściany jako `<path>`, a krawędzie od strony światła kreską `t.rim` z kryciem `t.rimAlpha`;
  - `pyr(b, t)`, `gable(b, t, axis)`, `cyl({ gx, gy, gz, r, h }, t)`, `dome({ gx, gy, gz, r }, t)`, `ring({ gx, gy, gz, r }, t, pose)`;
  - `shadowOffset(light, h): [dx, dy]`: przeciwnie do `dir`, długość proporcjonalna do `h`;
  - `shadow(b, light): string`: miękki cień na płaszczyźnie `gz`, krycie rośnie z `1 − ambient`;
  - `NIGHT_AMBIENT = 0.45`, `WIN_GLOW = '#ffd88a'`;
  - `windows(b, face: 'left' | 'right', { rows, cols, lit, seed }, light): string`:
    - okna jednej ściany to **dwie** ścieżki (szyby i okna świecące), a nie osobne prostokąty;
    - świecą tylko przy `ambient < NIGHT_AMBIENT`, a ich udział to `lit`;
    - w dzień szyby odbijają `light.color`.
- Produces (testy, `tests/helpers/svg.mjs`):
  - `checkSvg(s): { elements }` rzuca przy `NaN`, `undefined`, `Infinity`, `null` i przy niezamkniętych `<g>`, `<defs>`, `<clipPath>`;
  - `lum(css): number` zwraca luminancję względną 0–1.

- [ ] **Step 1: Write the failing tests**

```js
// Testy dioram: rzut, tony, części, wyspy, kadr, układ, model i oprawa etapów (bez przeglądarki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSvg, lum } from './helpers/svg.mjs';
import { TW, TH, LV, iso, tones, box, shadowOffset, windows, NIGHT_AMBIENT, WIN_GLOW } from '../js/diorama/iso.js';
import { RECIPES, VIEW_IDS } from '../js/art/views/index.js';

const PHASES = ['night', 'dawn', 'day', 'dusk'];
const WEATHERS = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
const L = (dir, ambient = 0.6, color = [255, 255, 255]) => ({ color, dir, ambient, rim: [255, 255, 255] });

test('iso: rzut 2:1 i trzy tony — góra najjaśniejsza, jaśniejszy bok od strony światła', () => {
  assert.equal(TW, 2 * TH);
  const [x0, y0] = iso(0, 0), [x1, y1] = iso(1, 0), [x2, y2] = iso(0, 0, 1);
  assert.deepEqual([x1 - x0, y1 - y0], [TW / 2, TH / 2]);
  assert.deepEqual([x2 - x0, y2 - y0], [0, -LV]);
  const a = tones('#8899aa', L([-0.94, -0.34])), b = tones('#8899aa', L([0.94, -0.34]));
  assert.ok(lum(a.left) > lum(a.right) && lum(b.right) > lum(b.left));
  for (const t of [a, b, tones('#8899aa', L([0, -1]))]) assert.ok(lum(t.top) >= lum(t.left) && lum(t.top) >= lum(t.right));
  assert.ok(lum(tones('#8899aa', L([0.4, -0.9], 0.15)).top) < lum(tones('#8899aa', L([0.4, -0.9], 0.8)).top));
  const warm = tones('#808080', L([0.4, -0.9], 0.6, [255, 150, 100])).top.match(/\d+/g).map(Number);
  assert.ok(warm[0] > warm[2], 'ciepłe światło ociepla bryłę');
  assert.ok(tones('#8899aa', L([0, -1], 0.15)).rimAlpha > tones('#8899aa', L([0, -1], 0.8)).rimAlpha);
});

test('iso: tony są poprawne i widoczne dla klucza światła każdego z 45 widoków (wszystkie pory i pogody)', () => {
  for (const id of VIEW_IDS) for (const phase of PHASES) for (const weather of WEATHERS) {
    const t = tones('#556070', RECIPES[id].light({ phase, weather }));
    for (const k of ['top', 'left', 'right', 'rim']) assert.match(t[k], /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/, `${id} ${k}`);
    assert.ok(Math.min(lum(t.left), lum(t.right)) >= 0.03, `${id} ${phase} ${weather}: bryła nie znika w ciemności`);
    assert.ok(t.rimAlpha > 0 && t.rimAlpha <= 1);
  }
});

test('iso: pudełko, cień przeciwnie do światła i okna świecące tylko nocą', () => {
  const b = { gx: 0, gy: 0, w: 2, d: 1, h: 3 };
  assert.ok(checkSvg(box(b, tones('#8899aa', L([0.6, -0.8])))).elements >= 3, 'trzy ściany');
  assert.ok(shadowOffset(L([0.9, -0.4]), 3)[0] < 0 && shadowOffset(L([-0.9, -0.4]), 3)[0] > 0);
  const night = windows(b, 'left', { rows: 3, cols: 2, lit: 1, seed: 1 }, L([0.6, -0.8], NIGHT_AMBIENT - 0.15));
  const day = windows(b, 'left', { rows: 3, cols: 2, lit: 1, seed: 1 }, L([0.6, -0.8], 0.8));
  assert.ok(night.includes(WIN_GLOW) && !day.includes(WIN_GLOW));
  assert.ok(checkSvg(night).elements <= 2, 'okna ściany to najwyżej dwie ścieżki');
});
```

- [ ] **Step 2:** Run `node --test tests/diorama.test.mjs`. Expected: FAIL, bo nie ma modułów `js/diorama/iso.js` i `tests/helpers/svg.mjs`.
- [ ] **Step 3:** Zaimplementuj `tests/helpers/svg.mjs` i `js/diorama/iso.js` według interfejsu. Współrzędne zaokrąglaj do 0,1, żeby SVG był krótki.
- [ ] **Step 4:** Run `node --test tests/diorama.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit**: `git add js/diorama/iso.js tests/diorama.test.mjs tests/helpers/svg.mjs && git commit -m "Oprawa 2: rzut izometryczny, tony światła i prymitywy"`

### Task 2: Części brył, emblematy i obsada

**Files:**
- Create: `js/diorama/parts.js`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: `iso.js`.
- Produces:
  - `PALETTES: Record<stage, Palette>` według punktu 5 projektu:
    - Ziemia: ciepłe pastele, zieleń, błękit;
    - Kosmos: chłodna biel i błękit, bursztynowe światła;
    - Galaktyka: fiolety, magenty, turkus;
    - Wszechświat: głęboka czerń, złoto, perłowa biel.
  - `assemble(parts, ctx): { svg, anim: string[], anchor: [x, y] | null, box: [x0, y0, x1, y1] }`. Kontekst to `ctx = { at: [gx, gy, gz], palette, accent, light, lit, snow, seed, company, budget }`.
    - Każda bryła najpierw dostaje cień, potem ściany.
    - Flaga `'win'` daje okna na obu widocznych ścianach: `rows = floor(h)`, udział świecących `ctx.lit`.
    - `mast` trafia do `anim` (klasa `blink`), o ile `budget.take()`; inaczej zostaje statyczny.
    - `anchor` to rzut punktu `sign`, a `box` to prostokąt ekranowy wszystkich brył.
  - `label`: tabliczka z `esc(nazwa)` skróconą do `max` znaków; po skróceniu ostatni znak to „…”.
  - `ER = 11` i `emblem({ icon, color }, [x, y], r = ER): string`: ciemny obrys, koło w kolorze działu, biały pierścień, emoji (`font-size ≈ 1,15·r`) i krótki trzonek do punktu zaczepienia.
  - `SEATS = [1, 5, 15, 40, 100]` (przeniesione ze `scene.js`) i `tierFor(heads): 0..5`.
  - `CREW`: gęstość obsady według progu (`lit` to udział świecących okien nocą):

    | próg | 0 | 1 | 2 | 3 | 4 | 5 |
    |---|---|---|---|---|---|---|
    | `people` | 0 | 1 | 2 | 3 | 4 | 5 |
    | `lit` | 0,15 | 0,35 | 0,55 | 0,75 | 0,9 | 1 |
    | `vehicles` | 0 | 0 | 0 | 1 | 1 | 2 |

  - `MAX_ANIM = 40` i `budget(max = MAX_ANIM): { take(): boolean, used }`.
  - Grafika przeniesiona ze `scene.js` (bez zmian wyglądu, z parametrem skali):
    - `person(x, y, rnd)`, `tree(x, y, s, rnd, season)`, `pumpkin`, `xmasTree`;
    - `stringLights(points)` (dawne `lights` po łamanej);
    - `SIDE_ART.car` i `SIDE_ART.rover` (dawne `car` i `rover` bez klasy);
    - `seeded`, `shade`, `esc`.
  - `drive({ gx, gy, gz = 0, axis: 'x' | 'y', len }, art, { dur, delay, id }): string`. Pojazd w widoku z boku siedzi w grupie `class="car"` (istniejąca animacja `translateX`). Ta grupa jest wewnątrz grupy ze ścięciem: `matrix(1 0.5 0 1 x y)` dla osi `x` i `matrix(1 -0.5 0 1 x y)` dla osi `y`. Wszystko jest przycięte `clipPath id="d-clip-${id}"` do pasa drogi.
    - *Dlaczego tak:* ruch w poziomie staje się ruchem wzdłuż osi izometrycznej, a pauza i `prefers-reduced-motion` działają bez zmian. Unikamy SMIL i `var()` w `@keyframes`.

- [ ] **Step 1: Write the failing tests:**
  - `parts: assemble — kotwica emblematu, prostokąt brył, kolor akcentu, deterministycznie`: dla `[['box', 0, 0, 0, 1, 1, 2, 'wall', 'win'], ['pyr', 0, 0, 2, 1, 1, 1, 'roof'], ['sign', 0.5, 0.5, 3]]` wynik jest powtarzalny, `checkSvg` przechodzi, `anchor` leży w `box`, a przy `mat: 'accent'` w SVG jest kolor `accent`;
  - `parts: tabliczka z nazwą firmy jest escapowana i skracana`: nazwa `'<b>Ala & "Kot"</b> 🚀 sp. z o.o. — bardzo długa nazwa'` z `max: 22` nie daje `<b>`, daje `&lt;b&gt;` i `&amp;`, kończy się „…”, a tekst tabliczki ma ≤ 22 znaki;
  - `parts: progi obsady SEATS i gęstość obsady rosną razem`:

```js
assert.deepEqual([0, 1, 4, 5, 14, 15, 39, 40, 99, 100, 1e9].map(tierFor), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
for (let t = 1; t < CREW.length; t++) for (const k of ['people', 'lit', 'vehicles']) assert.ok(CREW[t][k] >= CREW[t - 1][k]);
assert.ok(CREW[5].people > CREW[1].people && CREW[5].lit > CREW[1].lit);
```

  - `parts: emblemat ma ikonę i kolor działu`: zawiera `icon` i `color`, `checkSvg` przechodzi;
  - `parts: pojazd jedzie wzdłuż osi izometrycznej (ścięcie 2:1) i ma własne przycięcie`: oś `x` daje `matrix(1 0.5 0 1`, oś `y` daje `matrix(1 -0.5 0 1`; jest `class="car"`; dwa wywołania z różnym `id` dają różne `d-clip-…`;
  - `parts: budżet animacji`: `take()` zwraca `true` 40 razy, potem `false`.
- [ ] **Step 2:** Run `node --test tests/diorama.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj `js/diorama/parts.js`. Ze `scene.js` jeszcze nic nie usuwaj; to zrobi Zadanie 6.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa 2: części brył, emblematy i obsada`

### Task 3: Wyspy i platformy z materiałem miejsca

**Files:**
- Create: `js/diorama/island.js`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: `iso.js`, `parts.js` (`PALETTES`, `seeded`).
- Produces:
  - `PLACES: Record<viewId, { base, material, sky: { stars: boolean, traffic: 'clouds' | 'satellites' | 'comets' | 'none' } }>` dla 45 widoków:

    | Widoki | `base` | `material` | `sky` |
    |---|---|---|---|
    | 18 miast | `island` | `grass` | `stars: false` (gwiazdy nocą wynikają z pory dnia), `traffic: 'clouds'` |
    | `moon`, `mercury`, `ceres`, `europa` | `island` | `regolith`, `rock`, `rock`, `ice` | `stars: true`, `traffic: 'none'` |
    | `mars`, `titan` | `island` | `rust`, `dunes` | `stars: false` (dzienne niebo), `traffic: 'none'` |
    | `leo`, `l2` | `platform` | `metal` | `stars: true`, `traffic: 'satellites'` |
    | `venus` | `aerostat` | `deck` | `stars: false`, `traffic: 'none'` |
    | 9 widoków Galaktyki | `dock` | `metal` | `stars: true`, `traffic: 'comets'` |
    | 9 widoków Wszechświata | `shard` | `crystal` | `stars: true`, `traffic: 'comets'` |

  - `groundTone(view, env): string`: barwa wierzchu przed oświetleniem. Na Ziemi zależy od pory roku: przy `snowCover` to `SNOW = '#eef3fb'`, jesienią trawa jest przygaszona.
  - `island({ view, size, light, env, seed }): { svg, bbox, rim: [x, y][] }`:
    - **wierzch** to romb `size×size` kafelków z fakturą materiału:
      - trawa ze ścieżkami i placem z chodnikiem;
      - regolit z kraterkami, rdza z kamieniami, lód ze spękaniami, wydmy z falami;
      - metal z płytami i światłami krawędzi, pokład aerostatu, kryształ z fasetami;
    - **krawędź** ma grubość 1 poziomu i trzy tony;
    - **spód** zależy od `base`:
      - `island`: skalne sople;
      - `platform`: kratownica i dysze;
      - `aerostat`: powłoka balonu;
      - `dock`: belki ze światłami;
      - `shard`: fasety odłamka;
    - `rim` to narożniki wierzchu (do drogi i dekoracji).

- [ ] **Step 1: Write the failing tests:**
  - `island: każdy z 45 widoków ma podstawę i materiał zgodny z projektem`: `Object.keys(PLACES)` posortowane równa się `VIEW_IDS` posortowanym, a do tego jawne oczekiwania: `moon → regolith`, `mars → rust`, `europa → ice`, `titan → dunes`, `mercury` i `ceres → rock`, `leo → platform`, `venus → aerostat`, `sgr → dock`, `edge → shard`, `waw → island/grass`;
  - `island: rysuje bez wyjątku każdą podstawę, deterministycznie; większa wyspa → większy prostokąt`: dla jednego widoku z każdego `base` dwa wywołania dają ten sam `svg`, `checkSvg` przechodzi, a `bbox` dla `size: 8` jest szerszy niż dla `size: 4`;
  - `island: zima pokrywa trawę śniegiem, jesień zmienia barwę trawy`: `groundTone('waw', { snowCover: true, season: 'winter' }) === SNOW`; jesień ≠ lato.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj. Faktury rysuj kilkoma ścieżkami na materiał, a nie setkami elementów. Budżet elementów z Global Constraints obejmuje wyspę.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa 2: wyspy i platformy z materiałem miejsca`

### Task 4: Kadrowanie dioramy w pasie sceny

**Files:**
- Create: `js/diorama/frame.js`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Produces:
  - `SE = { w: 341, h: 273 }` i `SE_INSETS = { top: 48, bottom: 6 }` (pomiar z Global Constraints);
  - `MIN_EMBLEM_PX = 16`, `MIN_LOT_PX = 28`;
  - `frameFor(bbox, view, insets, { margin = 0.06, minSpan = 300 } = {}): { viewBox: [x, y, w, h], scale, visible: [x0, y0, x1, y1] } | null`:
    - dla `bw, bh` = wymiary `bbox` powiększone o `margin` z każdej strony liczy `scale = min(view.w / max(bw, minSpan), (view.h − top − bottom) / bh)`;
    - `viewBox` ma dokładnie proporcje widoku;
    - środek `bbox` wypada na środku szerokości, a dół `bbox` z marginesem na `view.h − bottom`;
    - zwraca `null`, gdy `view.w`, `view.h` albo wysokość pasa ≤ 0;
  - `viewBoxAttr(f): string` z liczbami zaokrąglonymi do 0,01.

- [ ] **Step 1: Write the failing tests**

```js
test('frame: diorama mieści się w pasie między górnymi i dolnymi nakładkami, podstawa przy dolnej krawędzi', () => {
  const views = [[SE, SE_INSETS], [{ w: 406, h: 465 }, SE_INSETS], [{ w: 440, h: 956 }, { top: 176, bottom: 6 }]];
  for (const [view, ins] of views) for (const bbox of [[-60, -80, 60, 20], [-200, -260, 200, 60], [-300, -60, 300, 40]]) {
    const f = frameFor(bbox, view, ins);
    assert.ok(Math.abs(f.viewBox[2] / f.viewBox[3] - view.w / view.h) < 1e-6, 'proporcje widoku');
    const sx = (x) => (x - f.viewBox[0]) * f.scale, sy = (y) => (y - f.viewBox[1]) * f.scale;
    assert.ok(sx(bbox[0]) >= -0.5 && sx(bbox[2]) <= view.w + 0.5, 'w poziomie w kadrze');
    assert.ok(sy(bbox[1]) >= ins.top - 0.5 && sy(bbox[3]) <= view.h - ins.bottom + 0.5, 'w pionie w pasie');
    assert.ok(view.h - ins.bottom - sy(bbox[3]) < 0.1 * (view.h - ins.top - ins.bottom), 'podstawa przy dolnej krawędzi pasa');
  }
});

test('frame: większa diorama oddala kamerę, mała nie jest powiększana ponad minSpan, zerowy rozmiar → null', () => {
  const small = frameFor([-40, -60, 40, 10], SE, SE_INSETS), big = frameFor([-200, -260, 200, 60], SE, SE_INSETS);
  assert.ok(big.scale < small.scale);
  assert.ok(small.scale <= SE.w / 300 + 1e-9);
  assert.equal(frameFor([-40, -60, 40, 10], { w: 0, h: 0 }, SE_INSETS), null);
  assert.equal(frameFor([-40, -60, 40, 10], { w: 300, h: 40 }, SE_INSETS), null);
});
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj `js/diorama/frame.js`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `Oprawa 2: kadrowanie dioramy w pasie sceny`

### Task 5: Model, układ działek i dioramy zastępcze

**Files:**
- Create: `js/diorama/layout.js`, `js/diorama/index.js`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: Zadania 1–4; `LAYERS`, `LAYER_ORDER` (`js/layers.js`).
- Produces (`layout.js`):
  - `SLOTS: Record<stage, Array<{ gx, gy, gz?, w, d }>>` to stałe działki w siatce wyśrodkowanej na wyspie: 12 dla Ziemi i 8 dla pozostałych etapów. Działka `i` należy do działu `i + 1` w kolejności `DEPTS`, a pierwszy dział to rdzeń.
    - Rdzeń stoi z tyłu pośrodku (najmniejsze `gx + gy`), bo jest najwyższy.
    - Działki idą rzędami przed nim, na zmianę z lewej i z prawej. Wcześniejsze działy stoją bliżej środka, późniejsze bliżej krawędzi.
    - Między działkami są przerwy na ścieżki: emblematy sąsiadów nie mogą na siebie nachodzić.
  - `CORE_AT: Record<stage, { gx, gy }>` i `LOT_MAX_H: Record<stage, number>` (najwyższy budynek działu w poziomach);
  - `layout(stage, n, rounds, coreFoot): { size, core: Rect, lots: Rect[] }`, gdzie `Rect = { gx, gy, gz, w, d, h }` (dla działek `h = LOT_MAX_H`):
    - `size` to najmniejsza parzysta wielkość wyspy, która mieści rdzeń i użyte działki z marginesem;
    - przy `rounds ≥ 4` wyspa dostaje dodatkowy pierścień (+2): to „rozmiar” z rund;
    - działki mają stałe współrzędne niezależne od `n`.
- Produces (`index.js`):
  - `modelFor(game, { view, env, light, isNew = () => false }): DioramaModel`. Działy to `game.D.DEPTS` odblokowane w `s.deptUnlocked`, z `tier = tierFor(s.depts[id] || 0)`. Do tego `firstHeads = s.depts[D.FIRST_DEPT] || 0` i `rounds = min(s.prestigeCount, 8)`.
  - `newIds(known: Map<stage, Set<id>>, stage, ids): Set<id>` zwraca działy nowe od poprzedniego wywołania dla tego etapu. Pierwsze wywołanie dla etapu zwraca zbiór pusty. Potem `known` dostaje dokładnie `ids`, więc działy zamknięte resetem znikają ze zbioru.
  - `GENERIC: Record<stage, StageArt>` z `placeholder: true`:
    - paleta etapu z `PALETTES`;
    - rdzeń to pudełko 2×2 rosnące z `n`;
    - dział to pudełko z oknami w kolorze akcentu i `sign` na dachu;
  - `STAGE_ART = { earth: GENERIC.earth, space: GENERIC.space, galaxy: GENERIC.galaxy, universe: GENERIC.universe }`. Zadania 8–12 podmieniają wpisy.
  - `buildDiorama(model): Diorama`. Kroki budowy:
    1. `layout`;
    2. `island` z `PLACES[view]`;
    3. rdzeń i działki od tyłu do przodu (`assemble`). Nowy dział (`isNew`) siedzi w grupie `<g class="floor-new">`, czyli w istniejącej animacji wyrastania od podstawy;
    4. `extras` etapu;
    5. ozdoby świąt: na Ziemi choinka i dynie, na każdym etapie lampki na rdzeniu w grudniu;
    6. **emblematy na końcu**, żeby zawsze były na wierzchu.

    Ruchome postacie i pojazdy stoją tylko tam, gdzie nic ich nie zasłoni: w pierwszym rzędzie, na placu przed rdzeniem i na drodze przy krawędzi. Warstwa animacji leży nad wszystkimi budynkami, więc postacie w głębi są statyczne.

- [ ] **Step 1: Write the failing tests.** Dodaj importy (`Company` z `js/engine.js`, `LAYERS` i `LAYER_ORDER` z `js/layers.js`, `recipeFor` z `js/art/views/index.js`, moduły z Zadań 4–5) i pomocnicze `ENV`, `maxModel`, `inIsland`, `overlap3d`:

```js
const ENV = { phase: 'day', season: 'summer', weather: 'clear', holiday: null, newYear: false, snowCover: false };
function maxModel(stage, extra = {}) {
  const S = LAYERS[stage];
  return {
    stage, view: S.HQ, company: 'Krzemowe Imperium', rounds: 8, firstHeads: 100,
    depts: S.DEPTS.map((d) => ({ id: d.id, icon: d.icon, color: d.color, tier: 5, isNew: false })),
    env: { phase: 'night', season: 'winter', weather: 'snow', holiday: 'xmas', newYear: false, snowCover: stage === 'earth' },
    light: recipeFor(S.HQ).light({ phase: 'night', weather: 'snow' }),
    ...extra,
  };
}
// inIsland(r, size): obrys r mieści się w rombie wyspy; overlap3d(a, b): obrysy nachodzą i zakresy [gz, gz + h] też

test('layout: działki nie nachodzą na siebie ani na rdzeń, mieszczą się na wyspie i nie przeskakują, gdy dochodzi dział', () => {
  for (const stage of LAYER_ORDER) {
    const max = LAYERS[stage].DEPTS.length;
    assert.ok(SLOTS[stage].length >= max - 1, `${stage}: dość działek`);
    let prev = null;
    for (let n = 1; n <= max; n++) {
      const lay = layout(stage, n, 0, STAGE_ART[stage].coreFoot(n, 0));
      const all = [lay.core, ...lay.lots];
      assert.equal(lay.lots.length, n - 1);
      for (const r of all) assert.ok(inIsland(r, lay.size), `${stage} n=${n}: na wyspie`);
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(!overlap3d(all[i], all[j]), `${stage} n=${n}: ${i}/${j}`);
      if (prev) { assert.deepEqual(lay.lots.slice(0, n - 2), prev.lots); assert.ok(lay.size >= prev.size); }
      assert.ok(layout(stage, n, 8, STAGE_ART[stage].coreFoot(n, 8)).size >= lay.size, 'rundy nie zmniejszają wyspy');
      prev = lay;
    }
  }
});

test('diorama: model z gry — odblokowane działy w kolejności, progi obsady, rundy ≤ 8', () => {
  const co = new Company(null, { now: 1_700_000_000_000, rng: () => 0.5 });
  const g = co.layers.earth;
  g.s.deptUnlocked.rnd = true; g.s.depts.dev = 40; g.s.depts.rnd = 4; g.s.prestigeCount = 11;
  const m = modelFor(g, { view: 'waw', env: ENV, light: recipeFor('waw').light(ENV) });
  assert.deepEqual(m.depts.map((d) => [d.id, d.tier]), [['dev', 4], ['rnd', 1]]);
  assert.equal(m.stage, 'earth'); assert.equal(m.rounds, 8); assert.equal(m.firstHeads, 40);
});

test('diorama: nowy dział wyrasta tylko raz, a wejście na etap i powrót na niego niczego nie animuje', () => {
  const known = new Map();
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd'])], []);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], ['design']);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], []);
  assert.deepEqual([...newIds(known, 'space', ['engineers'])], [], 'przełączenie etapu');
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd', 'design'])], [], 'powrót na Ziemię');
  newIds(known, 'earth', ['dev']);
  assert.deepEqual([...newIds(known, 'earth', ['dev', 'rnd'])], ['rnd'], 'po resecie dział znów wyrasta');
});

test('diorama: wszystkie działy każdego etapu mieszczą się i są czytelne na iPhonie SE', () => {
  for (const stage of LAYER_ORDER) for (const extra of [{}, { env: ENV, rounds: 0 }]) {
    const d = buildDiorama(maxModel(stage, extra));
    const f = frameFor(d.bbox, SE, SE_INSETS);
    assert.deepEqual(d.lots.map((l) => l.id).sort(), LAYERS[stage].DEPTS.map((x) => x.id).sort(), `${stage}: każdy dział ma element`);
    const px = ([x, y]) => [(x - f.viewBox[0]) * f.scale, (y - f.viewBox[1]) * f.scale];
    const inBox = ([x, y], b) => x > b[0] && x < b[2] && y > b[1] && y < b[3];
    d.lots.forEach((a, i) => {
      const r = a.emblem.r * f.scale, [x, y] = px([a.emblem.x, a.emblem.y]);
      assert.ok(2 * r >= MIN_EMBLEM_PX, `${stage}/${a.id}: emblemat ${(2 * r).toFixed(1)} px`);
      assert.ok(a.foot * f.scale >= MIN_LOT_PX, `${stage}/${a.id}: działka ${(a.foot * f.scale).toFixed(1)} px`);
      assert.ok(x - r >= 0 && x + r <= SE.w && y - r >= SE_INSETS.top && y + r <= SE.h - SE_INSETS.bottom, `${stage}/${a.id}: w pasie`);
      for (const b of d.lots.slice(i + 1)) {
        assert.ok(Math.hypot(a.emblem.x - b.emblem.x, a.emblem.y - b.emblem.y) >= a.emblem.r + b.emblem.r, `${stage}: ${a.id}/${b.id} emblemy nachodzą`);
        assert.ok(!inBox([a.emblem.x, a.emblem.y], b.box), `${stage}: ${b.id} zasłania ${a.id}`);
      }
    });
  }
});
```

  - `diorama: budżety elementów i animacji, poprawny i powtarzalny SVG, wyrasta tylko nowy dział`: dla `maxModel` każdego etapu:
    - dwa buildy są identyczne;
    - `checkSvg(front).elements ≤ 1200`, a `checkSvg(frontAnim)` przechodzi;
    - `stats.anim ≤ MAX_ANIM` i `filter=` występuje ≤ 8 razy;
    - model z `isNew` tylko dla trzeciego działu daje dokładnie jedno `floor-new`.
  - `diorama: każdy dział ma emblemat z własną ikoną i kolorem`: w `front` są wszystkie `icon` i `color` działów etapu.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj `layout.js` i `index.js`. Współrzędne `SLOTS` i wysokości `LOT_MAX_H` dobierz tak, żeby test SE przeszedł z zapasem: najmniejszy emblemat ≥ 17 px na Ziemi, bo prawdziwe budynki z Zadań 8–12 będą wyższe od zastępczych.
- [ ] **Step 4:** Run `npm test`. Expected: PASS, czyli wszystkie dotychczasowe testy (109) i nowe.
- [ ] **Step 5: Commit**: `Oprawa 2: model, układ działek i dioramy zastępcze`

### Task 6: Wpięcie w scenę — warstwy, kadr, światło i budowle miast

**Files:**
- Create: `js/diorama/skyline.js`
- Modify:
  - `js/scene.js`;
  - `js/art/views/common.js`: `recipe()` przyjmuje opcjonalne `horizon`;
  - `js/art/views/earth.js`: `horizon` = linia panoramy, czyli `P.water − 0,004` albo `0,86`;
  - `js/art/kit/earth.js`: komentarz o kopii `SKY` jest nieaktualny, bo `SKIES` znika ze sceny;
  - `css/style.css`, `sw.js` (moduły `js/diorama/` poza galerią, `CACHE` → `v10`), `js/main.js` (`window.__scene = ui.scene`, tylko przy `DEV_TOOLS`).
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: `buildDiorama`, `modelFor`, `newIds` (Zadanie 5), `frameFor`, `viewBoxAttr` (Zadanie 4), `PLACES` (Zadanie 3), `seeded`, `shade`, `esc` (Zadanie 2), `recipeFor` (część 1), `SKY` (`js/art/kit/earth.js`).
- Produces:
  - `skyline(view, { w, h }, { light, phase, horizon }): { svg, anchors: Array<{ x, y }> }`:
    - `LANDMARKS` i `CITY_VIEWS` przenieś ze `scene.js` bez zmian kształtu. Lewa budowla stoi przy `x = 0,09·w`, prawa przy `0,91·w`, obie na `y = horizon·h`, w skali `clamp(w / 360, 0,85, 1,25)`;
    - wypełnienie to jeden `<linearGradient id="d-lm">` w poprzek budowli. Strona od światła (`dir[0]`) przechodzi w `light.rim`, druga w cień barwy `SKY[phase].far`. Nocą okna mają barwę `SKY[phase].win`;
    - poza Ziemią zwraca `{ svg: '', anchors: [] }`.
  - `Scene` ma nowe warstwy w tej kolejności:
    1. tło Canvas;
    2. `svg.skyline` w `.backdrop-wrap`, więc najazd kamery przesuwa je razem z tłem;
    3. `back`, `backAnim`;
    4. `front`, `frontAnim`;
    5. `weather`.
  - Warstwy `skyline`, `back`, `backAnim` i `weather` mają `viewBox="0 0 sw sh"` (rozmiar sceny w px CSS, zaokrąglony) i `preserveAspectRatio="none"`. Warstwy `front` i `frontAnim` mają wspólny `viewBox` z `frameFor`.
  - `new Scene(root, { insets } = {})`. Domyślne `insets()` mierzy widoczne `.layer-bar`, `.scene-tools` i `.zen-info` względem `#scene`: `top = max(dół) + 6` (bez nakładek 6), `bottom = 6`. Część 3 poda tu panele szkła.
  - `Scene.resize()` woła `ResizeObserver` raz na klatkę (`requestAnimationFrame`). Robi `backdrop.resize()`, a gdy rozmiar zmienił się o ≥ 2 px, przelicza warstwy w układzie sceny i `viewBox` dioramy. Dioramy przy tym nie przebudowuje.
  - `Scene.lastMs` to czas ostatniego `render()`, do pomiarów.

- [ ] **Step 1: Write the failing tests:**
  - `skyline: budowle stoją na horyzoncie tła przy każdym rozmiarze sceny i biorą światło z klucza`:

```js
const env = { phase: 'night', weather: 'clear' }, horizon = EARTH_RECIPES.waw.horizon;
for (const size of [{ w: 341, h: 273 }, { w: 406, h: 465 }, { w: 440, h: 956 }]) {
  const s = skyline('waw', size, { light: EARTH_RECIPES.waw.light(env), phase: 'night', horizon });
  checkSvg(s.svg);
  assert.equal(s.anchors.length, 2);
  for (const a of s.anchors) assert.ok(Math.abs(a.y - horizon * size.h) < 0.5);
  assert.ok(s.anchors[0].x < size.w / 2 && s.anchors[1].x > size.w / 2);
}
const lit = (dir) => skyline('waw', SE, { light: { ...EARTH_RECIPES.waw.light(env), dir }, phase: 'day', horizon }).svg;
assert.notEqual(lit([0.94, -0.34]), lit([-0.94, -0.34]), 'jaśniejsza strona zależy od kierunku światła');
assert.equal(skyline('sgr', SE, {}).svg, '', 'poza Ziemią nie ma panoramy SVG');
for (const [id, r] of Object.entries(EARTH_RECIPES)) assert.ok(r.horizon > 0.7 && r.horizon < 0.92, id);
```

  - `sw.js: pamięć offline zawiera każdy moduł dioram (poza galerią)`: wzór jak w `tests/art.test.mjs`, katalog `../js/diorama/`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj `skyline.js` i pole `horizon`.
- [ ] **Step 4:** Przebuduj `js/scene.js`:
  - **Usuń** dawną dioramę i grunt:
    - `SKIES`, `GROUND`, `LOBBY_H`, `FLOOR_H`, `BW`, `BX`, `MOD_*`, `STATION_BASE`;
    - `SPACE_VIEWS`, `GALAXY_VIEWS`, `UNIVERSE_VIEWS`, `spaceSkyline`, dalekie bloki miasta, pas gruntu, rozstawianie drzew;
    - `garage()`, `building()`, `station()`, `deskUnit`, `plant`;
    - `knownFloors`.

    Grafikę przeniesioną w Zadaniu 2 importuj z `parts.js`, a `LANDMARKS`, `CITY_VIEWS` i `rectWin` ze `skyline.js`.
  - **Zostaw:** `phaseFor`, `seasonFor`, `holidayFor`, `isNewYear`, `weatherFor`, `envFor`, opady, fajerwerki, nietoperze, liście, chmury, migające gwiazdy, satelitę i kometę. Teraz rysują w układzie sceny:
    - gwiazdy: poza Ziemią według `PLACES[view].sky.stars`, na Ziemi nocą i o zmierzchu bez zachmurzenia (jak dziś);
    - satelity i komety według `sky.traffic`;
    - opady, mgła i liście trafiają do warstwy `weather`.
  - **`render(game, force)`:**
    1. `bd.show(…)` jak dziś;
    2. `light = bd?.light ?? recipeFor(view).light(envArg)`;
    3. `model = modelFor(game, { view, env: { ...env, phase }, light, isNew })`, gdzie `isNew` pochodzi z `newIds(this.known, stage, ids)`;
    4. `buildDiorama(model)` trafia do `front`/`frontAnim`, a `this.bbox` jest zapamiętany;
    5. warstwy sceny: `back` dostaje gradient z `recipeFor(view).stops` tylko wtedy, gdy tła Canvas brak; `skyline` dostaje `recipeFor(view).horizon`;
    6. kadr.
    - `render` nie rzuca: wyjątek w budowie dioramy zostawia poprzednią zawartość (`try/catch`, jak `Backdrop.show`).
    - Przy zerowym rozmiarze sceny `render` nie ustawia `viewBox`, a resztę robi `resize()`.
    - `signature()` zostaje bez zmian i importuje `SEATS` z `parts.js`.
  - **CSS:**
    - `.scene .backdrop-wrap svg.skyline { position: absolute; inset: 0; width: 100%; height: 100%; }`;
    - `.scene svg.weather { pointer-events: none; }`;
    - reszta reguł zostaje.
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6: Sprawdź w przeglądarce** (podgląd `krzemowe-imperium`, port 8090, `node tools/serve.mjs` bez pamięci podręcznej; wcześniej wyrejestruj service workera):
  - nowa gra, Warszawa: zastępcza diorama stoi na trawiastej wyspie, Pałac Kultury i Varso stoją na linii panoramy tła, nie ma pasa gruntu SVG, a w konsoli nie ma błędów;
  - `resize_window` 375×667 i `document.documentElement.style.setProperty('--safe-top', '20px')`: scena ma 341×273, a wyspa mieści się pod paskiem etapów;
  - tryb zen: diorama stoi pod zegarem, a po wyjściu przekadrowuje się z powrotem;
  - `viewBox` warstw nie zawiera `NaN`;
  - cztery etapy (przez `window.__co` albo pasek etapów): każdy ma swoją podstawę (wyspa, platforma, dok, odłamek);
  - noc (podmiana `Date` w konsoli albo przewinięcie czasu w trybie deweloperskim): okna świecą;
  - deszcz i śnieg padają nad dioramą.

  Na koniec przywróć widok `desktop`.
- [ ] **Step 7: Commit**: `Oprawa 2: diorama w scenie — warstwy, kadr, światło, budowle miast`

### Task 7: Galeria dioram

**Files:**
- Create: `tools/dioramas.html`, `js/diorama/gallery.js`
- Modify: `tools/gallery.html` (link „Dioramy →” w nagłówku)

**Interfaces:**
- Consumes: `buildDiorama`, `frameFor`, `SE`, `SE_INSETS`, `MIN_EMBLEM_PX`, `skyline`, `renderLocal` (`js/art/backdrop.js`), `recipeFor`, `LAYERS`.
- Produces: strona z siatką kafli w rozmiarze `?size=SZERxWYS`, domyślnie `341x273` (SE).
  - Kafel to tło policzone `renderLocal` przy gęstości 2, `skyline` i dwie warstwy dioramy w kadrze `frameFor`, z przerywanymi liniami granic pasa.
  - Każdy etap ma poziomy:

    | n | 1 | 2 | 4 | 7 | max | max, święta i zima |
    |---|---|---|---|---|---|---|
    | próg obsady | 1 | 2 | 3 | 4 | 5 | 5 |
    | rundy | 0 | 0 | 1 | 3 | 8 | 8 |

  - Podpis kafla: skala, najmniejszy emblemat w px (na czerwono < 16), liczba elementów i animacji, czas `buildDiorama` w ms (mediana z 3).
  - Wybór widoku dla każdego etapu, pory dnia, pogody, pory roku i święta. `?stage=` zawęża do jednego etapu.

- [ ] **Step 1:** Zaimplementuj galerię. Dla każdego kafla zbuduj model jak `maxModel` z testów, ze zmienionym `n`, progiem i rundami.
- [ ] **Step 2: Sprawdź w przeglądarce:** `http://localhost:8090/tools/dioramas.html` pokazuje 4 etapy po 6 kafli, nie ma czerwonych podpisów ani błędów w konsoli, a link z `tools/gallery.html` działa.
- [ ] **Step 3: Commit**: `Oprawa 2: galeria dioram`

### Task 8: Ziemia — garaż → biuro → wieżowiec → kampus

**Files:**
- Create: `js/diorama/earth.js`
- Modify: `js/diorama/index.js` (`STAGE_ART.earth`)
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Consumes: `StageArt`, `assemble`, `PALETTES.earth`, `CREW`.
- Produces: `EARTH_ART: StageArt` bez `placeholder` (archetypy działów dochodzą w Zadaniu 9; do tego czasu działy biorą archetyp z `GENERIC.earth`). Rdzeń należy do działu `dev`:

  | `coreForm(n)` | n | Bryła |
  |---|---|---|
  | `garage` | 1 | garaż z dachem dwuspadowym, otwartą bramą i światłem w środku, biurko z laptopem, 1–3 osoby (`min(3, 1 + floor(firstHeads / 3))`, jak dziś), tabliczka (`max` 22), roślina |
  | `office` | 2–4 | biurowiec 2×2 na 3 poziomy z pasami okien, przeszklony hol, tabliczka (`max` 26), klimatyzatory na dachu |
  | `tower` | 5–8 | podium 3×3 i wieża 2×2 rosnąca z `n`, uskok w górnej części, korona i maszt z migającym światłem |
  | `campus` | 9+ | wieża dalej rośnie do limitu z testu SE, niskie przeszklone skrzydło połączone kładką, plac z fontanną przed holem |

  Ozdoby rund (`ornaments`) zachowują dzisiejsze znaczenie:

  | r ≥ 1 | r ≥ 2 | r ≥ 3 | r ≥ 5 | r ≥ 8 |
  |---|---|---|---|---|
  | `solar` panele na dachu | `neon` logo „◆ pierwsze słowo nazwy” | `helipad` | `dish` antena | `rocket` rakieta na stanowisku na wyspie |

- [ ] **Step 1: Write the failing tests:**
  - `earth: forma rdzenia według liczby działów`: `[1, 2, 4, 5, 8, 9, 13].map(EARTH_ART.coreForm)` daje `['garage', 'office', 'office', 'tower', 'tower', 'campus', 'campus']`;
  - `earth: rdzeń rośnie z działami`: wysokość `box` rdzenia (`lots` z `id: 'dev'`) nie maleje dla n = 1…13;
  - `earth: ludzie w garażu według obsady pierwszego działu`: przy n = 1 `stats.people` dla `firstHeads` 0, 3, 6 i 100 to 1, 2, 3 i 3 (w garażu ludzi liczy dzisiejszy wzór, a nie `CREW`);
  - `earth: ozdoby rund`: przy r = 0 `stats.ornaments` jest puste, przy r = 8 to dokładnie pięć id z tabeli, a przy r = 2 tylko `solar` i `neon`;
  - `earth: tabliczki rdzenia są escapowane i skracane na każdym etapie rozwoju`: dla n = 1, 3, 6 i 10 z nazwą z Review Focus nr 5 w SVG nie ma `<b>`, `checkSvg` przechodzi, a tekst kończy się „…”;
  - `earth: brak zastępczego rdzenia`: `!STAGE_ART.earth.placeholder`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj rdzeń i ozdoby. Test SE z Zadania 5 musi dalej przechodzić. Wysokość wieży ogranicza czytelność całej Ziemi na SE, więc dobierz ją pod ten test.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii dioram i w grze:** forma rdzenia zmienia się przy 1, 2, 5 i 9 działach (w grze przez `window.__co`: `deptUnlocked`, `depts`, `prestigeCount`), a tabliczka jest czytelna.
- [ ] **Step 6: Commit**: `Oprawa 2: Ziemia — garaż, biuro, wieżowiec, kampus`

### Task 9: Ziemia — budynki działów, pory roku, święta i ruch

**Files:**
- Modify: `js/diorama/earth.js`
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Produces: `EARTH_ART.depts` (12 archetypów; to propozycja, którą Piotr ocenia w galerii) i `EARTH_ART.extras`. Każdy archetyp ma dokładnie jeden `sign`, a akcent to kolor działu:

  | dział | bryła | wyróżnik |
  |---|---|---|
  | `rnd` 🔬 | laboratorium | kopuła obserwacyjna, rury na ścianie |
  | `design` 🎨 | szklany sześcian | kolorowe pasy elewacji (akcent) |
  | `marketing` 📣 | niski budynek | wielki ekran na dachu, świeci nocą |
  | `sales` 🤝 | dwupoziomowy biurowiec | flagi przy przeszklonym wejściu |
  | `support` 🎧 | budynek z anteną | talerz i maszt |
  | `hr` 🧑‍💼 | pawilon | zielony dach z drzewkami |
  | `devops` ⚙️ | hala serwerowni | rząd chłodnic na dachu |
  | `finance` 💼 | smukła wieża | złote szkło |
  | `data` 📊 | centrum danych | dwa silosy z diodami |
  | `legal` ⚖️ | gmach z kolumnadą | trójkątny fronton |
  | `security` 🛡️ | bunkier | radar i niski mur |
  | `board` 🏛️ | szklana rotunda | taras na dachu |

  `extras` dokłada:
  - drzewa na wolnych polach brzegu wyspy (`tree` z porą roku: wiosną kwiaty, jesienią liście pod drzewem, zimą gołe gałęzie ze śniegiem);
  - śnieg na dachach przy `snowCover` (`tones(…, { snow: true })`);
  - drogę wzdłuż przedniej krawędzi z autami (`drive`, `SIDE_ART.car`): 1 auto od n ≥ 2, 2 od n ≥ 6, 3 od n ≥ 10;
  - drony nad działami: na Ziemi `CREW.vehicles` działu to drony (próg 3–4 daje jeden, próg 5 dwa), łącznie najwyżej 4, z klasami `person` i `blink`;
  - `stats.vehicles` liczy auta i drony razem;
  - ludzi przed działkami według `CREW`;
  - ozdoby świąt: choinkę i lampki na rdzeniu w grudniu, dynie przy wejściach w Halloween.

  `decor` zbiera id: `snow`, `blossom`, `leaves`, `xmasTree`, `lights`, `pumpkins`.

- [ ] **Step 1: Write the failing tests:**
  - `earth: każdy dział ma własny archetyp z jednym emblematem, archetypy się różnią`: klucze `EARTH_ART.depts` to wszystkie działy Ziemi poza `dev`; w każdym jest dokładnie jeden `sign`; `new Set(Object.values(EARTH_ART.depts).map(JSON.stringify)).size === 12`;
  - `earth: ruch rośnie z firmą`: przy progach < 3 (bez dronów) `stats.vehicles` dla n = 1, 2, 6 i 10 to 0, 1, 2 i 3; przy n = 13 i wszystkich progach 5 to 7 (3 auta i 4 drony);
  - `earth: gęstość obsady rośnie z progiem SEATS`: dla jednego działu przy progach 0–5 `stats.people` i `stats.lit` nie maleją, a przy 5 są większe niż przy 1;
  - `earth: pory roku i święta na wyspie`: zima z `snowCover` daje `decor ⊇ ['snow']`, wiosna `blossom`, Boże Narodzenie `xmasTree` i `lights`, Halloween `pumpkins`, a lato bez święta daje pusty `decor`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj archetypy i `extras`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS. Test SE z Zadania 5 sprawdza teraz prawdziwą Ziemię.
- [ ] **Step 5: Sprawdź w galerii** (Warszawa, Reykjavík nocą, Dubaj w dzień; lato i zima) **oraz w grze przy 375×667 z `--safe-top: 20px`:**
  - wszystkie 13 emblematów są czytelne, a bryły działów rozróżnialne;
  - okna świecą nocą;
  - porównaj dzień i noc w jednym mieście: zmienia się tonacja ścian i kierunek cienia.

  Zrób zrzuty galerii Ziemi i gry.
- [ ] **Step 6: Punkt kontrolny dla Piotra:** pokaż zrzuty i link do galerii dioram. To pierwsza diorama w docelowej jakości, więc poczekaj na uwagi (styl, bryły działów, wielkość emblematów), zanim zaczniesz Zadania 10–12.
- [ ] **Step 7: Commit**: `Oprawa 2: Ziemia — budynki działów, pory roku, święta i ruch`

### Task 10: Kosmos — kapsuła → stacja

**Files:**
- Create: `js/diorama/space.js`
- Modify: `js/diorama/index.js` (`STAGE_ART.space`)
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Produces: `SPACE_ART: StageArt`. Rdzeń należy do działu `engineers`.
  - **Podstawa** pochodzi z `PLACES`:
    - na wyspach z powierzchnią (Księżyc, Mars, Merkury, Ceres, Europa, Tytan) stacja stoi na nogach lądownika;
    - na platformie (`leo`, `l2`) i aerostacie (`venus`) jest przycumowana do pokładu.
  - **`coreForm(n)`:**
    - `capsule` (n = 1): rakieta na stanowisku z wieżą startową na powierzchni albo kapsuła przy węźle na platformie;
    - `hub` (2–4): pionowy moduł centralny z węzłem dokującym;
    - `station` (5+): moduł centralny, kratownica i skrzydła paneli. Par skrzydeł jest `min(3, ceil(n / 3))`, jak dziś.
  - Tabliczka „◆ NAZWA” (`max` 24).
  - **Moduły działów:**

    | dział | moduł |
    |---|---|
    | `mission` 🎛️ | moduł z czaszami anten |
    | `astronauts` 🧑‍🚀 | habitat z kopułą obserwacyjną |
    | `robots` 🦾 | kratownica z ramieniem robota |
    | `logistics` 📦 | ładownia z kontenerami i portem |
    | `medics` 🩺 | biały moduł z zielonym pasem, **bez czerwonego krzyża** (to znak prawnie chroniony; ma znaczenie w płatnej aplikacji) |
    | `spacelaw` ⚖️ | moduł z kolumienkami i kopułką |
    | `miners` ⛏️ | rafineria z wiertłem i taśmociągiem |
    | `terraformers` 🌱 | szklarnia: kopuła z zielenią |

  - **Ozdoby rund:** r ≥ 1 `rocket1`, r ≥ 2 `wing` (dodatkowe skrzydło), r ≥ 3 `rocket2`, r ≥ 5 `rocket3`, r ≥ 8 `torus` (pierścień mieszkalny).
  - **`extras`:** łazik na wyspach z powierzchnią (`drive`, `SIDE_ART.rover`), astronauci w białych kombinezonach jako ludzie z `CREW`, światła modułów w bursztynie.
- [ ] **Step 1: Write the failing tests:**
  - `space: forma rdzenia i podstawa według widoku`: `coreForm` dla 1, 2, 4, 5 i 9 daje `capsule`, `hub`, `hub`, `station`, `station`; `stats.base` to `island` dla `moon` i `platform` dla `leo`; `stats.material` to `regolith` dla `moon` i `ice` dla `europa`;
  - `space: każdy dział ma własny moduł z jednym emblematem, moduły się różnią` (jak na Ziemi, 8 archetypów);
  - `space: ozdoby rund` (r = 0 → `[]`, r = 8 → pięć id z tabeli);
  - `space: brak zastępczej dioramy`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj.
- [ ] **Step 4:** Run `npm test`. Expected: PASS, z testem SE włącznie.
- [ ] **Step 5: Sprawdź w galerii** `moon`, `mars`, `leo` i `venus` na poziomach 1, 4 i max.
- [ ] **Step 6: Commit**: `Oprawa 2: Kosmos — kapsuła i stacja`

### Task 11: Galaktyka — prom → statek-matka w doku

**Files:**
- Create: `js/diorama/galaxy.js`
- Modify: `js/diorama/index.js` (`STAGE_ART.galaxy`), `js/diorama/layout.js` (`SLOTS.galaxy` z `gz`, jeśli pokłady stoją na kadłubie)
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Produces: `GALAXY_ART: StageArt`. Rdzeń należy do działu `navigators`.
  - **Podstawa:** dok, czyli belki ze światłami nawigacyjnymi.
  - **`coreForm(n)`:**
    - `shuttle` (n = 1): prom na lądowisku doku;
    - `mothership` (2+): smukły kadłub wzdłuż osi `x`, który wydłuża się o segment z każdym działem (od rufy, więc działki nie przeskakują). Ma dziób-ostrosłup i poświatę napędu na rufie (gradient, bez filtra), a od n ≥ 4 gondole napędu na pylonach.
  - Światła nawigacyjne to maszty `blink`.
  - **Pokłady działów** to nadbudówki na segmentach kadłuba (`gz` = wysokość kadłuba) albo moduły na doku przed nim:

    | dział | nadbudówka |
    |---|---|
    | `astro` 🔭 | obserwatorium z teleskopem |
    | `envoys` 👽 | ambasada z ogrodem pod szkłem |
    | `shipai` 🤖 | rdzeń SI ze świecącym pierścieniem |
    | `traders` 💱 | hangary z otwartymi wrotami |
    | `geneticists` 🧬 | zbiorniki z zielonym płynem |
    | `senate` 🏛️ | rotunda z kopułą |
    | `gravitons` 🕳️ | czarna kula w pierścieniu |
    | `xeno` 🌱 | biokopuła z fioletową roślinnością |

  - **Ozdoby rund:** r ≥ 1 `ring` (pierścień wokół kadłuba, jak dziś), r ≥ 2 `beacons`, r ≥ 3 `escort` (dwa promy eskorty), r ≥ 5 `nacelles` (druga para gondoli), r ≥ 8 `drones` (rój dronów).
  - **`extras`:** promy kursujące wzdłuż krawędzi doku (`drive` z boczną sylwetką promu), załoga w mundurach w barwach palety.
- [ ] **Step 1: Write the failing tests:** `galaxy: forma rdzenia; kadłub rośnie z działami` (szerokość `box` rdzenia nie maleje dla n = 2…9), `galaxy: każdy dział ma własną nadbudówkę…`, `galaxy: ozdoby rund`, `galaxy: brak zastępczej dioramy`. Test układu z Zadania 5 sprawdza nakładanie w 3D, więc nadbudówki na kadłubie są dozwolone tylko nad jego wysokością.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii** `sol`, `orion` i `sgr`: diorama ma być czytelna na jasnym (`orion`) i ciemnym tle oraz w pomarańczowym świetle dysku (`sgr`).
- [ ] **Step 6: Commit**: `Oprawa 2: Galaktyka — prom i statek-matka w doku`

### Task 12: Wszechświat — iskra → cytadela na odłamku

**Files:**
- Create: `js/diorama/universe.js`
- Modify: `js/diorama/index.js` (`STAGE_ART.universe`)
- Test: `tests/diorama.test.mjs`

**Interfaces:**
- Produces: `UNIVERSE_ART: StageArt`. Rdzeń należy do działu `cartographers`.
  - **Podstawa:** odłamek materii z kryształowymi żyłami.
  - **`coreForm(n)`:**
    - `spark` (n = 1): świecąca kula z dwiema orbitami nad środkiem odłamka (dzisiejsza `spark` w rzucie);
    - `spire` (2–4): kryształowa iglica na okrągłej podstawie;
    - `citadel` (5+): iglica, kręgi (`ring flat`) w liczbie `1 + floor((n − 1) / 3)` i portal (`ring upright`) nad szczytem.
  - Halo jest zawsze; dalsze pierścienie dochodzą z rundami (ozdoby).
  - **Kręgi działów** stoją wokół iglicy:

    | dział | budowla |
    |---|---|
    | `cosmologists` 🧮 | iglica z orrery |
    | `ambassadors` 🤝 | kryształowy łuk-brama |
    | `replicators` 🐜 | ul z sześciokątnych kryształów |
    | `brokers` 💹 | wieża-klepsydra |
    | `immortals` ♾️ | obelisk z wiecznym płomieniem |
    | `tribunal` ⚖️ | pawilon z dwiema szalami |
    | `chrononauts` ⏱️ | pierścień zegara |
    | `voidwalkers` 🌑 | czarny monolit z portalem pustki |

  - **Ozdoby rund:** r ≥ 1 `halo2`, r ≥ 2 `halo3`, r ≥ 3 `orbs`, r ≥ 5 `shards` (krążące okruchy), r ≥ 8 `portal2`.
  - **`extras`:** ludzi z `CREW` zastępują świetliste drobiny (`glow` i klasa `person`). Paleta: czerń, złoto, perłowa biel.
- [ ] **Step 1: Write the failing tests:** `universe: forma rdzenia; kręgi przybywają z działami`, `universe: każdy dział ma własną budowlę…`, `universe: ozdoby rund`, `universe: brak zastępczej dioramy`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Zaimplementuj.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Sprawdź w galerii** `bootes` (najciemniejszy: bryły widoczne dzięki obrysowi), `edge` (pomarańczowy) i `andromeda`.
- [ ] **Step 6: Commit**: `Oprawa 2: Wszechświat — iskra i cytadela na odłamku`

### Task 13: Sprzątanie, pomiary i dokumentacja

**Files:**
- Modify:
  - `js/scene.js`: resztki nieużywanego kodu;
  - `README.md`: sekcja *Dioramy* i wyniki w *Wydajność*;
  - `sw.js`: `CACHE` → kolejna wersja;
  - `js/main.js`: `VERSION` → `2.6.0`.
- Create: `docs/superpowers/plans/2026-10-19-oprawa-2-rejestr.md` (rejestr decyzji i przeglądu, jak w części 1)
- Test: `tests/diorama.test.mjs`

- [ ] **Step 1: Write the test** `diorama: żaden etap nie używa zastępczej dioramy`: `LAYER_ORDER.every((s) => !STAGE_ART[s].placeholder)`. Powinien przejść, jeśli Zadania 8–12 są kompletne; jeśli nie przechodzi, uzupełnij braki przed dalszą pracą.
- [ ] **Step 2:** Usuń martwy kod (np. eksporty `scene.js`, których nikt nie importuje). Run `npm test`. Expected: PASS.
- [ ] **Step 3: Pomiary:**
  - **galeria dioram:** zapisz skalę, najmniejszy emblemat, elementy, animacje i czas `buildDiorama` dla maksymalnej dioramy każdego etapu;
  - **gra** (komputer, okno widoczne): przy maksymalnej dioramie, ustawionej przez `window.__co`, `window.__scene.lastMs` ≤ 12 ms (mediana z 5 przerysowań przez `render(…, true)`);
  - **rozmiar kodu netto:**

    ```bash
    for ref in da2d8c7 HEAD; do git ls-tree -r --name-only $ref -- js css | grep -v gallery | while read f; do git cat-file -s "$ref:$f"; done | awk -v r=$ref '{s+=$1} END {print r, s}'; done
    ```

    Expected: różnica HEAD − da2d8c7 ≤ 25 000;
  - **zrzuty przy 375×667 i `--safe-top: 20px`:** maksymalna diorama każdego z 4 etapów.

  Wyniki wpisz do README. Pozycję „do sprawdzenia na iPhonie” rozszerz o czytelność emblematów na SE i płynność przewijania listy przy dioramie z ruchem.
- [ ] **Step 4:** Zapisz rejestr wykonania (decyzje `Ruling:`, wyniki zadań, uwagi odłożone).
- [ ] **Step 5: Commit**: `Oprawa 2: sprzątanie, pomiary, README i rejestr`

---

## Co ta część przekazuje części 3

- `Scene` przyjmuje `insets()`. Pełnoekranowa scena ze szklanym HUD-em i dolnym panelem poda wysokości paneli. Test SE z Zadania 5 trzeba wtedy powtórzyć z nowym pasem: dziś pas na SE ma 341×219 px, a w części 3 będzie wyższy.
- Animacje dioram w trybie *Oszczędna* i przy `prefers-reduced-motion` (dziś: istniejące klasy i reguły).
- Efekty: wyrastanie nowego działu w stylu etapu, płynne przekadrowanie przy wzroście, przejścia między etapami.
- Pozostały budżet kodu: ok. 18 kB lub więcej (zależnie od wyniku pomiaru z Zadania 13).

## Założenia planu

1. **Punkt odniesienia SE to zainstalowana aplikacja** (pasek stanu 20 px): scena 341×273, pas 341×219. W karcie Safari z paskami narzędzi jest ciaśniej, ale gra jest przeznaczona do instalacji.
2. **Budowle miast zostają w SVG** (projekt: „zostają, ale z oświetleniem z klucza światła”). Trafiają do warstwy przyklejonej do tła, a nie do Canvas. Dzięki temu nie trzeba portować 26 kształtów, a klucz pamięci tła się nie zmienia.
3. **Kopuły kolonii na horyzoncie Kosmosu (`spaceSkyline`) znikają:** kolonią jest teraz diorama, a opis widoków w punkcie 6.3 ich nie zawiera.
4. **Pierwszy dział to rdzeń** (garaż/siedziba, kapsuła/stacja, prom/statek, iskra/cytadela). Ziemia ma rdzeń i 12 budynków, pozostałe etapy rdzeń i 8.
5. **Progi formy rdzenia** zależą od liczby odblokowanych działów (np. Ziemia: 1 / 2–4 / 5–8 / 9+). Rundy dają ozdoby o dzisiejszym znaczeniu, a od 4. rundy dodatkowy pierścień wyspy.
6. **Archetypy działów są propozycją.** Ocenia je Piotr w galerii (punkt kontrolny po Ziemi). Moduł medyczny jest bez czerwonego krzyża.
7. **Budżet kodu 150 kB z projektu:** część 1 zużyła ok. 107 kB. Limit części 2 (≤ 25 kB netto) zostawia część 3 ok. 18 kB, więc przy niej trzeba będzie ocenić, czy budżet wystarcza.
8. **Pojazdy jeżdżą istniejącą animacją `.car` w grupie ze ścięciem 2:1,** a nie przez SMIL ani zmienne CSS w `@keyframes`. Dzięki temu pauza poza Biurem i ograniczenie ruchu działają bez zmian.
9. **W grze nie przybywa napisów.** Galeria dioram jest narzędziem deweloperskim po polsku, z linkiem z galerii widoków.
