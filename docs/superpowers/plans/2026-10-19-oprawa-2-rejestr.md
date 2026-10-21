# Rejestr wykonania: oprawa, część 2 (dioramy: decyzje, wyniki zadań, przegląd)

Kopia rejestru wykonawcy (`.superpowers/sdd/2026-10-19-oprawa-2-dioramy/progress.md`) zachowana po zakończeniu planu. Linie `Ruling:` to decyzje podjęte w trakcie, z kosztem, jeśli były złe; `minor (deferred)` to drobne uwagi z przeglądu odłożone na później.

- Spec: docs/superpowers/specs/2026-10-17-oprawa-wizualna-design.md (read). Branch: claude/oprawa-wizualna. Plan commit: 4289390. Repo root: D:/ClaudeCode/Krzemowe-Imperium (no worktree; same checkout as part 1, not main).

## Pre-flight

| Tasks | Produces vs consumes | Finding |
|---|---|---|
| T1 → T2,T3,T5,T8–12 | iso/tones/box/pyr/gable/cyl/dome/ring/shadow/windows, TW/TH/LV, NIGHT_AMBIENT/WIN_GLOW | consistent |
| T1 → all tests | tests/helpers/svg.mjs checkSvg/lum | consistent |
| T2 → T3,T5,T6,T8–12 | PALETTES, assemble, label, emblem/ER, SEATS/tierFor/CREW, budget/MAX_ANIM, drive, SIDE_ART, seeded/shade/esc | label truncation unit unspecified (UTF-16 vs code points) — ruled below |
| T3 → T5,T6,T10 | PLACES, island, groundTone, SNOW | consistent |
| T4 → T5,T6,T7 | frameFor, viewBoxAttr, SE, SE_INSETS, MIN_EMBLEM_PX, MIN_LOT_PX | consistent (test values checked by hand: wide bbox, zen, null cases) |
| T5 → T6,T7,T8–13 | layout/SLOTS/CORE_AT/LOT_MAX_H, modelFor, newIds, GENERIC, STAGE_ART, buildDiorama, Diorama.stats | stats.lit meaning unspecified — ruled below |
| T6 → T7,T13 | skyline, horizon, Scene insets/resize/lastMs, window.__scene, sw.js coverage test for js/diorama | CONFLICT: T6's test requires every js/diorama module in sw.js, but T8, T10, T11, T12 create earth/space/galaxy/universe.js and their Files lists omit sw.js — ruled below |
| T6 ↔ T8–12 | Global Constraint "bump CACHE after every game-file change" vs tasks 8–12 not listing a bump | ruled below |
| T8 → T9 | EARTH_ART (core) then depts/extras in same file | consistent |
| T5 ↔ T11 | layout.js SLOTS.galaxy gets gz; T5 layout test checks 3D overlap | consistent |
| T9 checkpoint vs SDD continuous execution | plan step "poczekaj na uwagi Piotra" | ruled below |

| Task | Self-consistency |
|---|---|
| T1 | tests match interface (box ≥3 elements incl. rim; windows ≤2 paths; tones over 45 lights incl. 'cloudy') — ok |
| T2 | label test with emoji: depends on truncation unit — ruling |
| T3 | ok |
| T4 | ok |
| T5 | SE test uses lots in draw order + emblem/box/foot; budgets test uses stats.anim; ok |
| T6 | creates skyline.js and edits sw.js itself — ok |
| T7 | no unit tests (dev tool), browser check — ok (same as part 1 gallery) |
| T8 | Files omit sw.js although earth.js is new — conflict above |
| T9 | stats.vehicles = cars + drones (7 at max) — ok after plan edit |
| T10–T12 | Files omit sw.js — conflict above |
| T13 | ok |

- Pre-flight: Ruling: every task that creates a new js/diorama module (T8 earth.js, T10 space.js, T11 galaxy.js, T12 universe.js) also adds it to sw.js ASSETS in the same commit — the T6 coverage test demands it and a SW precache list naming a not-yet-existing file would break SW install — cost if wrong: none.
- Pre-flight: Ruling: CACHE in sw.js is bumped in T6 and T13 only (plus whenever a task adds an ASSETS entry, bump in the same commit) — the branch is not shipped between tasks and dev preview uses the no-store server — cost if wrong: one stale reload on a phone testing mid-branch.
- Pre-flight: Ruling: label truncation counts code points (Array.from), not UTF-16 units — avoids cutting an emoji surrogate pair in a company name — cost if wrong: none.
- Pre-flight: Ruling: Diorama.stats.lit = sum over drawn lots of CREW[tier].lit (share-weighted lit windows); stats.people = people actually drawn (static + animated) — plan left the unit open — cost if wrong: renaming one stat.
- Pre-flight: Ruling: honour the plan's checkpoint after Task 9 (stop, show screenshots, wait for Piotr) — the plan the user approved mandates it and art direction is Piotr's call; it is the only planned stop — cost if wrong: one pause.
- Pre-flight: Ruling: models — implementers T1–T4, T7, T13 sonnet; T5 sonnet; T6 opus (scene refactor, browser); T8–T12 opus (visual design judgment); task reviewers sonnet (T6 and art tasks opus); final review opus — cost if wrong: more fix rounds or higher cost.
- Task 1: Ruling: plan formula k_top = 1 contradicts the plan's own test (top must darken with ambient) — accepted implementer's exposure gain 0.9 + 0.1·ambient and multiplier FLOOR 0.62 — keeps the literal three-tone ratios, test passes (worst key trappist night lum 0.0314) — cost if wrong: night dioramas only slightly darker than day; exposure constants to be tuned at the Earth checkpoint with Piotr.
- Task 1: Ruling: code-size budget is NET (js+css vs da2d8c7) and T6 removes ~50 kB from scene.js (of which ~19 kB moves to skyline.js/parts.js) — gross guide for all js/diorama modules except gallery ≈ 70 kB, scene.js target ≤ 20 kB; implementers keep header comments short — cost if wrong: final measurement in T13 shows overrun and forces cuts.
- Task 1: Ruling: rename tones().lit → litSide in Task 2 (Task 2 is the first consumer) — avoids clash with windows({lit}) share and stats.lit — cost if wrong: none.
- Task 1: minor (deferred): FLOOR tuned to 5% margin for one test colour; darker palette materials may need their own check (iso.js:44-56).
- Task 1: minor (deferred): windows lit is per-window probability, not exact share — light count can be non-monotonic across walls (iso.js:210).
- Task 1: minor (deferred): shadow edge stroke gives a darker band, only approximately "soft" (iso.js:186).
- Task 1: minor (deferred): ring() treats any pose ≠ 'flat' as upright silently (iso.js:144).
- Task 1: minor (deferred): tests miss shadowOffset ∝ h, windows boundary at ambient 0.45 and lit = 0.
- Task 1: minor (deferred): checkSvg substring 'null'/'Infinity' check would trip on a company name like "Infinity Labs" in <text> (tests/helpers/svg.mjs:10); paired-tag list duplicated in regex.
- Task 1: minor (deferred): stale process comment "Poniższe testy dodano ponad polecenie zadania" (tests/diorama.test.mjs:45) — remove in T13.
- Task 1: complete (commits 4289390..875a1d0, review clean)
- Task 2: Ruling: emblem(dept, anchor, r) draws the badge ABOVE the anchor; emblemCenter(anchor, r) gives the circle centre — Task 5 must put emblemCenter(...) into lots[].emblem {x, y, r} so the SE readability test measures the badge, not the stem foot — cost if wrong: SE test off by ~16 units.
- Task 2: minor (deferred): RX duplicated in parts.js and iso.js; upright-ring box uses r*RX (slightly conservative) (parts.js:6,94).
- Task 2: minor (deferred → carry to T5): ids d-glow-${seed}-${i} / d-clip-${id} unique only if callers pass distinct seeds/ids; add a whole-diorama "all ids unique" check in T5 budgets test.
- Task 2: minor (deferred): unknown mat crashes inside rgb() instead of a clear error (parts.js:63).
- Task 2: minor (deferred): label font size can fall to ~1 px for narrow w + long name — needs a floor before T8 signs (parts.js:126); header comment says "reszta róg" but label/sign are points.
- Task 2: minor (deferred → carry to T5): glow part's box covers only the core, halo ≈ 2.2× r can exceed bbox (parts.js:119-120).
- Task 2: minor (deferred): string-light blink halo lost filter glow (filter budget); trees/pumpkins rounded to 0.1 — not literally "no visual change".
- Task 2: minor (deferred): no direct tests for 'ledge' flag and unknown-kind TypeError; ledge may overlap top window row.
- Task 2: minor (deferred): parts.js 17.3 kB vs ~14 kB target (earned per reviewer); running gross total iso+parts 28.8 kB of ~70 kB guide.
- Task 2: complete (commits 875a1d0..b918201, review clean)
- Task 3: Ruling: island.js size target (≲ 7 kB) was unattainable for 9 textures + 5 undersides; no feature cuts — fix round takes only no-visible-change cuts (shared helpers from iso.js, shorter comments) — cost if wrong: part 2 net code budget (25 kB) and the spec's 150 kB oprawa budget will likely be exceeded; to be shown to Piotr with numbers at the Task 9 checkpoint (his spec budget, his call).
- Task 3: Ruling: commit trailer of subagent commits names the subagent's real model (Sonnet 5.5) — not amended; history rewrite not worth it — cost if wrong: inconsistent trailers.
- Task 3: minor (deferred → carry to T5): island underside depth ≈ size×5–6 units (bbox ~402×283 at size 10) eats vertical room on SE — T5 may reduce UNDER; island textures re-roll when size changes (acceptable at growth moments).
- Task 3: minor (deferred): degenerate sizes < 1.6 invert platform geometry (island.js:163) — T5 layout sizes ≥ 4.
- Task 3: minor (deferred): cryptic comment "(o to krycie)" island.js:54.
- Task 3: fix round 1/5 (5 addressed, 0 open — shared helpers from iso.js, crater margin, palette ground single source, bbox margin, PLACES group test; commits a1a7365..fae7d1a)
- Task 3: minor (deferred): test helper extent() skips down() paths (transform before d) — would not catch a regression in ice highlight/dune shadow (tests/diorama.test.mjs:420-424).
- Task 3: minor (deferred): aerostat half() lost stroke-linejoin="round"; parts.shade now throws on non-#rrggbb/rgb()/array input (scene.js keeps its own hex-only shade until T6).
- Task 3: minor (deferred): PALETTES.space.ground covers only LEO/L2 platform; rocky worlds use per-view TOP colours.
- Task 3: complete (commits 4289390..fae7d1a, review clean after 1 fix round) — note: Task 3 range starts at b918201
- Task 4: Ruling: subagent appended 3 glossary entries (viewBox, Bounding box, Aspect ratio) to D:/Codex/Dokszłatcanie AI/Nauka/SLOWNIK.md under the user's global CLAUDE.md rule — checked: format correct, no duplicates; kept; later dispatches forbid edits outside the repo (glossary is the controller's job at the summary) — cost if wrong: user removes 3 lines.
- Task 4: minor (deferred): frame test doesn't assert horizontal centring or viewBoxAttr output; base-gap assertion partly holds by construction (tests/diorama.test.mjs:87-89).
- Task 4: minor (deferred): no guards for inverted bbox / negative margin (no caller can produce them).
- Task 4: complete (commits fae7d1a..c060d43, review clean)
- Task 5: Ruling: implementer model opus instead of sonnet (pre-flight said sonnet) — T5 holds the hardest constraint (SE readability) and every later task builds on its builder — cost if wrong: higher cost for one task.
- Task 5: Ruling: ratify the shallower island underside (rock cone 5.5·s → 2.5·s in island.js) — the floating read survives and vertical room on SE is the binding constraint — cost if wrong: Piotr may want deeper rocks; easy constant at the Earth checkpoint.
- Task 5: Ruling: drop the +2 island ring at rounds ≥ 4 (plan T5 interface); rounds' "rozmiar" (spec 7) moves to the core/ornaments per stage task within the SE test — the ring cost ~40 units of height and width and capped the Earth tower at ~6 levels; the tower is the stage's iconic growth — cost if wrong: rounds show less island growth.
- Task 5: Ruling: slot of a dept = its index in DEPTS (minus first), not its index among unlocked depts; island sized from the highest unlocked index — autopilot can unlock tech-gated depts out of order and lots must never jump (spec 7 "widoczny dodatek", plan "nie przeskakują") — cost if wrong: gaps on the island when a middle dept is still locked.
- Task 5: fix round 1/5 (5 addressed, 0 open — DEPTS-index slots, no rounds ring, per-building crew rng, id positive control, n=0/iterable guards; commits 1c817d4..9c56c5b)
- Task 5: minor (deferred → carry to T9): first shirt of every building identical (LCG first draw correlated for adjacent seeds; seeded(7 + seed)) — scramble seed with Math.imul(seed, 2654435761) ^ 7.
- Task 5: minor (deferred → carry to T9): test asserting lot box x-range == projection of SLOTS[3] depends on placeholder box width; real art with dishes/glow will break it — compare to lay.lots[3] / emblem anchor instead.
- Task 5: minor (deferred → carry to T8–T12): extras receive lay.lots incl. locked depts' slots — extras must filter by model.depts; real archetype heights must respect LOT_MAX_H (front building > ~0.5 level taller than the one behind in the same column → emblem overlap); Earth core max ≈ 7 levels with margin (8 just passes).
- Task 5: minor (deferred): index.js 6.3 kB (~5% over target); layout() keeps unused rounds param; holiday decor drawn after core (better occlusion than plan's order); new dept's emblem/crew appear finished while body grows (floor-new wraps body only); GENERIC depts use plain windows + accent roof instead of accent windows; take() drops over-budget extras without static fallback.
- Task 5: complete (commits c060d43..9c56c5b, review clean after 1 fix round)
- Task 6: Ruling: call Scene.resize() directly in the ResizeObserver callback instead of deferring via requestAnimationFrame (plan T6 interface said "raz na klatkę (rAF)") — RO already fires at most once per frame before paint; the rAF hop painted one frame with the old viewBox under preserveAspectRatio none (≈2.4× stretch on zen toggle), which the spec's anti-goal (no flicker) forbids — cost if wrong: none expected.
- Task 6: Ruling: in no-Canvas fallback the flat sky gradient goes behind the landmarks (into the skyline SVG / wrap) — plan put it in `back`, which hid the landmarks — cost if wrong: none.
- Task 6: fix round 1/5 (6 addressed, 0 open — zero-size repaint, sync RO resize, flat sky under landmarks, newIds after success, weather will-change, rounded sky tracks; commits 663f606..50fa567)
- Task 6: minor (deferred → T13/part 3): CSS keyframe distances in px (clouds/leaves/satellites/bats) cut short in zen and on scenes wider than ~520 px (style.css:175,185,198).
- Task 6: minor (deferred): default Scene insets() queries the whole document — a second Scene must pass its own insets; no bats at dusk on starless space views; flat (no-Canvas) mode lost SVG sun/moon/static stars/overcast veil.
- Task 6: minor (deferred): render time on PC median 5–9 ms with 14.8–17 ms outliers (budget ≤ 12 ms) with GENERIC art — re-measure with real art in T13.
- Task 6: minor (deferred): ambient for night+rain computes 0.44999… (just under NIGHT_AMBIENT 0.45) — windows glow by a float hair; part 1 earthLight edge.
- Task 6: complete (commits 9c56c5b..50fa567, review clean after 1 fix round; part 2 net code +14,341 B so far)
- Task 7: minor (deferred → T13): build-ms readout times buildDiorama only (not Scene.render) and sits below the 1 ms clock clamp in Safari/Firefox — loop several builds per sample when measuring real art (gallery.js).
- Task 7: minor (deferred): malformed ?size= (e.g. "341") gives NaN readouts without red; festive-tile legend overstates non-Earth (no snow/tree off Earth); dead copied CSS (.screen, .car.rev) in tools/dioramas.html; summary shows previous pass counts while recomputing; README lists only tools/gallery.html (T13).
- Task 7: minor (deferred): implementer unregistered the game's service worker and cleared cache v10 in the preview pane (browser state only).
- Task 7: complete (commits 50fa567..cf4d835, review clean)
- Task 8: Ruling: approved deviations — office 4.5–5 levels (brief 3), signs/ornaments mounted high, campus wing 3.1 levels — front lots + emblem row hide the core's lower ~4 levels, a 3-level office would be invisible (spec 7 "widoczny dodatek") — cost if wrong: Piotr may prefer a lower office.
- Task 8: Ruling: the plan's 25 kB net code cap for part 2 is suspended for T9–T12 (soft targets: Earth depts+extras ≲ 4 kB, each other stage file ≲ 6 kB, data-driven); measured in T13 and put to Piotr at the T9 checkpoint (his spec budget, 150 kB for the whole oprawa; +10 kB of JS is ≪1 ms parse on iPhone) — cost if wrong: part 3 starts over budget unless Piotr raises it.
- Task 8: minor (deferred → carry to T9): xmas lights hang at coreFoot.h = 1.25 and are hidden behind front lots for n ≥ 5 while stats.decor still says 'lights' — core() should return a visible light anchor.
- Task 8: minor (deferred → carry to T9): rocket–slot safety is implicit (size-6 rocket 0.41 from slots #6/#8, safe only because those slots force size 8) — add a test: rocket ≥ 0.42 from every lot and extras for every n.
- Task 8: minor (deferred → carry to T9): SE test checks only the max case; tightest is n = 8, r ≥ 4 (17.8 px / 29.7 px) — extend SE test to sweep n with rounds 0 and 8.
- Task 8: minor (deferred): test "rdzeń rośnie z działami" measures the whole core box (labels, fountain) — tower top drops ~4 units n = 8 → 9 (campus shifts tower); cosmetic ~3 px on SE.
- Task 8: minor (deferred): default params used as locals in earth.js (office H, campus x), office height duplicated in coreFoot, every ornament key maps to the neon string; 'flush' can't combine with gable; company name text ~3.8–5.3 px on SE (illegible on SE, decorative); garage person j=1 stands inside the desk volume.
- Task 8: minor (deferred): shared types doc lacks core(model, lay), core.people, label part[6]/[7], 'flush' — update in T13 README/plan notes.
- Task 8: minor (deferred): implementer reset the game save in the Browser pane (localhost:8090) to dev-only/0 heads/0 rounds and cleared SW cache v11 there — tell Piotr in the summary.
- Task 8: complete (commits cf4d835..e37e093, review clean)
- Task 9: Ruling: shirt seed uses h ^ (h >>> 15) scramble instead of the suggested Math.imul formula — suggested one still gave 4 colours for 13 people, test shows 8 — cost if wrong: none.
- Task 9: minor (deferred → checkpoint): recognisability rests on roofs/colour/material (box-shaped archetypes overlap IoU 0.85–0.90: devops/legal, rnd/devops, rnd/support); at max, front-row emblems cover 50–66% of back-row buildings (SLOTS columns 30 units apart vs 27-wide emblem); sales flags ~7×4 px; day/night shadow turns only ~12° in Warsaw (part-1 light keys).
- Task 9: minor (deferred): cars on screen only ~29% of each cycle (drive sweeps 560 units across a ~160-unit road); trees drawn under all buildings/people (person may overlap a tree that is in front); road colours hard-coded (asphalt not in palette, dashes ignore light key — bright at night); vehicles stat counts drones the budget may drop; 0.725 + 0.42·R duplicated; site() imports LAYERS and is exported only for tests; shared types doc out of date (extras box/marks, core().lights).
- Task 9: budget: part 2 net +31,442 B after T9 (suspended 25 kB cap; 107 + 31.4 = 138.4 kB of spec's 150 kB) — decision for Piotr at the checkpoint.
- Task 9: fix round 1/5 (3 addressed + 1 optional skipped with accepted reason — invisible sub-pixel faces/glows/shadows/blossoms cut 914→772 elements, render median 12.1→10.7 ms (p75 12.6); pumpkins per building; drones spread; commits b599ebd..56a2957)
- Task 9: minor (deferred): Halloween pumpkin overlaps a person at tier 4 (close at 2,3,5) — move to gx + 0.08 or right corner; comment "ułamek piksela" on shadowless thin cylinders inaccurate (parts.js:85); thresholds 0.05/0.06 are magic numbers in three places; pumpkin uses iso(x, y) without r.gz (fine on Earth).
- Task 9: minor (deferred → T13): Scene.render median 10.7 ms but p75 ≈ 12.6 ms at max — re-measure; people (~325 of ~770–810 elements) are the next lever.
- Task 9: complete (commits e37e093..56a2957, review clean after 1 fix round; part 2 net +32,832 B)
- Checkpoint (plan T9 step 6): stopping for Piotr's review of Earth before Tasks 10–12; open questions: style/archetypes/emblem size, code budget.
- Checkpoint result (2026-10-20): Piotr: "Styl Ziemi mi pasuje. Kontynuuj Kosmos, Galaktykę i Wszechświat; budżet kodu podnieś do 200 kB." — code budget for the whole oprawa raised from +150 kB to +200 kB (spec §10); T13 records it in the spec and README. Part 1 ≈ 107 kB + part 2 so far 32.8 kB = ~140 kB; ~60 kB left for T10–T13 and part 3.
- Task 10: Ruling: occupancy on Space modules must show through lights too (global constraint "gęstość świateł, ludzi i pojazdów") — reviewer Minor 4 promoted into the fix round: modules get portholes/windows lit by CREW share — cost if wrong: a few more elements per module.
- Task 10: minor (deferred): rovers counted by n, platforms have no vehicles (brief didn't require tier-driven vehicles in space); strut bbox pads ±1 vs stroke half-width 1.3; shared types doc lacks strut, cylinder flush, StageArt.suit (T13); space.js 11.6 kB (dense data; ~0.5 kB realistic cuts: move B/C/S/F/when helpers to parts.js for all stage files).
- Task 10: fix round 1/5 (6 addressed — whole-stack ground shadow via new ['shadow'] part, windows on all 8 modules, unknown-view fallback, mooring order, shared assertSE for all 9 space views, suit band; commits a62ffd5..c74373b)
- Task 10: parked — Europa suit/ice contrast stays 1.55 numerically — Ruling: acceptance criterion was "astronauts read"; renders show white figures with dark visor and coloured band reading at SE scale; a dark outline is available later if Piotr finds them faint — cost if wrong: faint astronauts on Europa only.
- Task 10: minor (deferred): 1×1 modules get one window row (2–4 windows), lit share coarse per module (aggregate tracks tier); parts.js header doesn't list 'shadow' as centre-based; capsule-on-deck calls base() twice; `shade` name in space.js (cast shadow) vs parts.shade (colour mix).
- Task 10: complete (commits 56a2957..c74373b, review clean after 1 fix round; part 2 net ≈ +46.0 kB)
- Task 11: first implementer dispatch interrupted by a session end (2026-10-20 ~23:30); uncommitted WIP left in the tree (new js/diorama/galaxy.js 11.3 kB; edits to index.js, iso.js, layout.js, parts.js, sw.js CACHE v13, tests +76 lines); no report file. Last write 23:29, nobody editing (checked 2026-10-21 17:32).
- Task 11: Ruling: dispatch a fresh implementer (opus) to review and finish the WIP instead of discarding it — the WIP matches the brief's files; discarding costs a full redo — cost if wrong: reviewer catches WIP defects in the normal loop.
- Parent session message (2026-10-21, relaying Piotr): finish T10–T13 + final branch review, do not start part 3, no push/merge; short final report (tasks, tests, last commit, deferred). Piotr's words relayed: „jest ok kontynuujmy aby zamknąć na chwilę etap wizualny i przejść póki co do testów na komputerze a potem na iOS”.
- Parent session info (2026-10-21): after part 2 ends it will merge the dev-mode fix (main f6ce88f/84e02f6, PR #6) into claude/oprawa-wizualna — already prepared on claude/scalenie-poprawki-dev (fd3b7f2) in its own worktree. DEV_TOOLS moves from js/main.js to js/config.js; conflicts expected in sw.js CACHE, engine.js sanitizeMeta, main.js VERSION/reset. → T13: new README/review text must not claim "DEV_TOOLS w js/main.js" (say "tryb deweloperski (DEV_TOOLS)" or js/config.js); keep main.js edits minimal (VERSION only); report to parent when part 2 is finished.
- Task 11: Ruling: windows glow at ambient ≤ NIGHT_AMBIENT (was <) — orion/pleiades/omega light keys sit exactly at 0.45 so lit share never showed; no Earth/Space key equals 0.45 exactly, so their output stays identical — cost if wrong: those three galaxy views look slightly more "night" lit.
- Task 11: Ruling: overhang of the mothership past the dock accepted as composition (reads as a ship berthed in a dock; shadows clipped to the dock) — cost if wrong: Piotr may prefer the ship within the dock (needs 8×8 base, emblems ~18 px).
- Task 11: minor (deferred → T13 docs): shared API notes — rectangle shadow ['shadow', x, y, z, w, h, d] orders w,h,d unlike box and uses a corner vs centre for the 5-arg form; sideways 'x' pyr only valid with 'flush'; draw order sorts gz first (fine while only the core is at gz 0); ring part[7] {u} is really a y–z plane flag.
- Task 11: minor (deferred): hull stubby at n = 2–4 (slender from ~n = 5); xmas light string on hull edge overlaps deck crew; drive shuttles pass over the label; galaxy.js 11.5 kB.
- Task 11: fix round 1/5 (5 addressed — StageArt.spot hook with visible galaxy crew, windows at ambient ≤ 0.45, ring v default, dome flush flag, berth comment; Earth/Space/Universe identical in 18144 configs; commits 05cc05b..13efa1b)
- Task 11: minor (deferred): galaxy crew packed tightly at tier 5 (shipai strip ~1.7 px apart, shared strips) — head-count reads lower than drawn; crew test checks footprint/cover only at k = 5 and not emblem/extras overlap; galaxy spot() would throw if core.people > 0 (latent); animated slots at max exactly 40/40 (last ~13 deck people static); galaxy.js 12.4 kB.
- Task 11: complete (commits c74373b..13efa1b, review clean after 1 fix round; part 2 net ≈ +60.6 kB)
- Task 12: Ruling: spark sits at CORE_AT (−1.5, −1.5), not over the shard centre as the brief said — the core lot is fixed for all n and lots must not move — cost if wrong: emptier shard at n = 1.
- Task 12: Ruling: citadel 'portal2' ornament drawn as a flat ring (not a second upright portal) — SE headroom — cost if wrong: weaker r ≥ 8 ornament.
- Task 12: minor (deferred): at max front-row emblems almost fully hide back-row buildings (cosmologists, ambassadors, replicators, brokers) — same as Space; plan-level (SLOTS spacing vs emblem size) → part 3 fullscreen band gives more room; edge (ambient 0.5) has no window glow (motes only); lavender glass hue is a 4th colour beyond black/gold/pearl; 4,455/54,675 motes float beyond shard back edges (intentional); universe.js 10.9 kB; whole oprawa ≈ 179/200 kB.
- Measure (after T12 fix, HEAD 496901e): js+css without galleries — b4a3171 (pre-oprawa) 751,316 B; da2d8c7 (end of part 1) 858,109 B; HEAD 930,724 B → whole oprawa +179,408 B of Piotr's +200 kB; part 2 +72,615 B net.
- Task 12: concern from implementer: shared windows() seed correlates for neighbouring building seeds (a 2-window building can light both at tier 0); Universe worked around it with 3–4 windows. → T13 ruling below.
- Task 13: Ruling: scramble the windows() rng seed in iso.js (same idea as the T9 crew-seed fix) so lit share follows CREW for small window counts across all stages — the spec's occupancy-by-lights signal outweighs byte-identity of which windows glow; SE/budgets unaffected — cost if wrong: which windows glow at night changes slightly on Earth/Space/Galaxy (not their count trend).
- Task 13: Ruling: do not touch README's existing "DEV_TOOLS w js/main.js" line (README:148) or main.js beyond VERSION — the parent session's merge of the dev-mode fix moves DEV_TOOLS to js/config.js and resolves those lines; new text says "tryb deweloperski" without naming the file.
- Task 12: fix round 1/5 (5 addressed — spark motes on a shard arc outside the orb glow, single d-mote gradient, height test counts glows, budget clamp + spot gz comment, sign by kind; Earth/Space/Galaxy identical in 6642 configs; commits 776acb7..496901e)
- Task 12: minor (deferred → iPhone check): first cross-SVG url(#d-mote) reference (def in front, motes also in frontAnim) — standard SVG, verified in Chrome only; check on iOS Safari.
- Task 12: minor (deferred): spark detected by r.h === coreFoot(1).h (magic coupling); cosmologists' window signal weak (3/4 lit tier 0 vs 5); motes small (~3–4 px on SE, faint on edge); universe.js 11.65 kB; budget clamp untested.
- Task 12: complete (commits 13efa1b..496901e, review clean after 1 fix round)
