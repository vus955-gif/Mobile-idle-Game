# Oprawa wizualna 2.0 — projekt

- **Data:** 2026-10-17
- **Status:** projekt do akceptacji (nic jeszcze nie wdrożone)
- **Gałąź:** `claude/oprawa-wizualna` (od `claude/balans-czlowiek-dev-mode`, bo tryb deweloperski przyda się do oglądania późnych etapów)
- **Makiety:** [`2026-10-17-oprawa-wizualna/styl-warianty.html`](2026-10-17-oprawa-wizualna/styl-warianty.html) (kierunki A/B/C) i [`2026-10-17-oprawa-wizualna/widoki-zza-okna.html`](2026-10-17-oprawa-wizualna/widoki-zza-okna.html) (szkic jakości teł, zaakceptowany poziom)

## 1. Po co

Obecna oprawa była dobra na wczesne testy: lekka, ale płaska i jednostajna. Gracz (Piotr) ocenia ją jako słabą. Główne problemy, potwierdzone w kodzie i na zrzutach:

1. **Tła są nijakie.** „Widok zza okna” (biuro, kolonia, układ, galaktyka) to gradient z kilkoma kształtami — np. czarna dziura to prosty okrąg.
2. **Etapy się nie różnią.** Kosmos, Galaktyka i Wszechświat rysuje ta sama funkcja `Scene.station()` — stos kolorowych „pigułek” z ludźmi; różnią się tylko dodatkami po bokach.
3. **Grafika jest płaska:** brak światła, głębi i materiałów; piętra biurowca to identyczne paski.
4. **Interfejs** to generyczny ciemnofioletowy szablon.

Gra ma relaksować i dawać satysfakcję ze wzrostu. Oprawa ma to wzmacniać: piękne, ciekawe tła, wyraźnie inne etapy, widoczny rozwój imperium — przy zachowaniu lekkości (iPhone, offline, później aplikacja w sklepach).

## 2. Cele, nie-cele, anty-cele

**Cele**
- Tła (widoki zza okna) na poziomie szkicu `widoki-zza-okna.html` lub wyższym: zjawiska wyglądające „jak trzeba” (czarna dziura z dyskiem i soczewkowaniem, mgławice, planety z atmosferą), każde z 45 miejsc rozpoznawalne i ciekawe.
- Każdy etap z własną bryłą, paletą i światłem — od pierwszego spojrzenia wiadomo, gdzie jesteśmy.
- Widoczny rozwój: nowe działy, rundy i biura zmieniają dioramę.
- Więcej efektów i lepsze animacje: kliknięcia, zakupy, kamienie milowe, rundy, przejścia między etapami — stylizowane, płynne, nie męczące.
- Gra zostaje lekka: bez plików graficznych, krótki start, płynny interfejs, oszczędność baterii.

**Nie-cele**
- Fizyczna symulacja (np. ray tracing czarnej dziury) i silnik 3D/WebGL.
- Zmiany w mechanice i balansie gry.
- Rastrowe grafiki (malowane albo z AI) — świadomie odrzucone: ważą więcej, nie reagują na porę dnia, a w płatnej aplikacji wymagają sprawdzenia praw.

**Anty-cele (porażka, nawet jeśli „działa”)**
- Gra zaczyna się zacinać, długo startuje albo wyraźnie szybciej rozładowuje telefon.
- Efekty przeszkadzają: migotanie, przesyt, liczby w interfejsie gorzej czytelne.
- Tła ładne, ale powtarzalne — po kilku widokach „wszystko wygląda tak samo”.

## 3. Ograniczenia

- **Platforma:** PWA na iPhonie (Safari), w przyszłości opakowana w aplikację natywną; czysty JS (moduły ES), bez bundlera i zależności w grze.
- **Lekkość:** sceny to SVG (jak dziś) + nowe tła z Canvas 2D; żadnych plików graficznych.
- **Istniejące systemy, które muszą działać dalej:** pora dnia (`phaseFor`), pory roku, pogoda, święta, Sylwester (`envFor`), tryb zen, wybór widoku (`s.view` — biuro/kolonia/układ/galaktyka), mechanizm przerysowania po podpisie stanu (`Scene.signature`), pauza animacji poza zakładką Biuro, tryb deweloperski.
- **Dwa języki:** wszystkie nowe napisy (ustawienia, nazwy widoków, jeśli się pojawią) w PL i EN (`js/i18n.js`, `js/lang/en.js`; test `features` to pilnuje).
- **Po każdej zmianie plików gry** podbić `CACHE` w `sw.js`.
- **Urządzenie testowe Piotra:** iPhone 16 Pro Max, iOS 27.0. To bardzo szybki telefon, więc nie jest miarą „najgorszego przypadku”. Budżety z punktu 10 sprawdzamy dodatkowo na komputerze z symulowanym spowolnieniem procesora (narzędzia przeglądarki, np. 4× wolniej), żeby przybliżyć starsze iPhone'y.
- **Minimalna wersja systemu dla przyszłej aplikacji:** iOS 16.4 (pierwsza z `OffscreenCanvas` w workerze). Propozycja Claude, Piotr jej nie zakwestionował. Wariant na głównym wątku zostaje jako zabezpieczenie.
- **Gdzie i kiedy trafia praca (decyzja Piotra):** nowa oprawa zostaje poza `main` (gałąź `claude/oprawa-wizualna`), aż będą gotowe dioramy i nowy interfejs (kroki 1–6 z punktu 13). Dopiero wtedy idzie do `main` i na GitHub Pages, żeby prawdziwa gra nie wyglądała przez tygodnie jak hybryda. Piotr testuje głównie na komputerze (podgląd lokalny), a na iPhonie przez domowe Wi-Fi z serwera na swoim komputerze.

## 4. Decyzje Piotra

- **Kierunek A + B** (z makiety `styl-warianty.html`):
  - **A, diorama:** każdy etap to miniaturowy świat w rzucie izometrycznym, który widocznie rośnie.
  - **B, warstwy i światło:** scena z głębią i dużym niebem, światło zależne od pory dnia lub od widoku; interfejs na matowym szkle nad sceną.
- **Poziom teł** ze szkicu `widoki-zza-okna.html` jest akceptowalny („taki poziom mi odpowiada”). Wcześniejsza uwaga: tła „mają być lepszej jakości niż na prezentacjach A/B” — więc w A/B makiety tła **nie** są wzorem; wzorem jest szkic teł.
- Kierunek C (neon) odrzucony.

## 5. Język wizualny (A + B)

**Kadr.** Tło (widok zza okna) wypełnia cały ekran Biura (jak w B), także pod HUD-em (pieniądze, przychód, punkty badań) i dolnym panelem z przyciskiem, które są półprzezroczystymi panelami ze szkła. Dioramę kadrujemy w widocznym pasie między nimi: jej podstawa nie może chować się pod dolnym panelem (dzisiejsze `xMidYMax meet` trzeba zastąpić kadrowaniem do tego pasa). Pasek wiadomości, pasek etapów, plakietki i narzędzia sceny (świat, zen) zostają, w nowej szacie. Kolejność warstw: tło → diorama → efekty → panele. *(decyzja Claude po recenzji)*

**Pozostałe zakładki.** Tłem jest rozmyta i przyciemniona kopia bieżącego widoku, policzona raz (z gotowego obrazu w pamięci podręcznej), a nie `backdrop-filter` nad przewijanymi listami. Karty i listy to półprzezroczyste panele w barwach etapu. HUD jest wspólny dla wszystkich zakładek, jak dziś. *(decyzja Claude po recenzji)*

**Diorama (A).** Struktura gracza stoi na „wyspie” lub platformie w rzucie izometrycznym (kąt ~26,57°, czyli piksele 2:1), z trzema tonami na bryłę (góra jasna, lewa średnia, prawa ciemna) i miękkim cieniem pod spodem. Detale małe, ale czytelne: okna, ludzie, pojazdy, drony.

**Światło (B).** Każde tło eksportuje **klucz światła**: kolor, kierunek i jasność otoczenia. Diorama się do niego dopasowuje: tonacja ścian, kolor obrysu (rim light), poświata okien w nocy, kierunek cienia. Na Ziemi klucz wynika z pory dnia i pogody, w kosmosie z widoku (np. przy Sagittarius A* ciepłe pomarańczowe światło z dysku, w Mgławicy Oriona różowo-turkusowe).

**Palety etapów** (propozycja do dopracowania przez wykonawcę):
- 🌍 Ziemia: ciepłe pastele, zieleń, błękit nieba, zachody słońca;
- 🛰️ Kosmos: chłodny błękit i biel, akcenty bursztynowe (światła modułów);
- 🌌 Galaktyka: fiolety, magenty, turkus mgławic;
- 🕳️ Wszechświat: głęboka czerń, złoto i perłowa biel.

**Typografia.** Zostaje systemowa zaokrąglona (`ui-rounded`). Liczby z cyframi tabelarycznymi. Kontrast liczb na szkle sprawdzić na najjaśniejszych tłach (np. dzień na Ziemi, Wenus).

## 6. Widoki zza okna (rdzeń projektu)

### 6.1 Technika

- **Canvas 2D, proceduralnie**, jak w szkicu:
  - szum (Perlin, fBm, ridged, domain warping);
  - oświetlenie kuli (planety);
  - soczewkowanie (β = θ − θE²/θ);
  - mieszanie addytywne (`lighter`) dla poświaty.
- **Tło liczy się raz** dla danego klucza `(widok, pora dnia, pogoda, rozmiar)` i trafia do pamięci podręcznej. Generowanie odbywa się w Web Workerze przez `OffscreenCanvas` (Safari obsługuje go od 16.4; **do sprawdzenia na urządzeniu**). Bez obsługi: liczenie na głównym wątku w kawałkach.
- **Natychmiastowy start.** Najpierw tani gradient zastępczy w kolorach widoku, potem płynne przejście (~400 ms) do gotowego tła.
- **Ruch** w trzech poziomach:
  1. CSS (powolny najazd kamery, dryf warstw, migotanie gwiazd);
  2. mała warstwa Canvas animowana ≤ 30 fps, tylko dla widoków, które tego potrzebują (wirujący dysk czarnej dziury, pulsar w Mgławicy Kraba, zorza);
  3. nic: tryb oszczędny.
- **Deterministyczność:** każdy przepis używa stałego ziarna (seed), więc ten sam widok zawsze wygląda tak samo, a testy mogą to sprawdzać.

### 6.2 Biblioteka klocków

Wspólne funkcje, z których składa się przepisy widoków:
- **Gwiazdy:** pole gwiazd w 2–3 planach głębi (barwy, jasności, rzadkie jasne gwiazdy z poświatą i promieniami).
- **Mgłowe obiekty:** pas Drogi Mlecznej; mgławica (gaz w 2–3 barwach, pasma pyłu, jasny rdzeń).
- **Ciała niebieskie:**
  - planeta: kula oświetlona z boku, z oceanami/lądami/pasmami/kraterami, chmurami, atmosferą na krawędzi i światłami miast po nocy;
  - pierścienie;
  - gwiazda: tarcza, korona, flara.
- **Obiekty ekstremalne:** czarna dziura (cień, pierścień fotonowy, dysk z efektem Dopplera, zagięty obraz tylnej części dysku, soczewkowanie tła).
- **Galaktyki i struktury wielkoskalowe:** galaktyka spiralna lub eliptyczna (pod kątem, z ramionami i pyłem); gromada; kosmiczna sieć (ridged noise).
- **Powierzchnie:** horyzont powierzchni (regolit, lód, wydmy, mgła atmosfery); zorza.
- **Niebo ziemskie:** gradient zależny od pory dnia, słońce i księżyc, chmury warstwowe, opady, mgła, perspektywa powietrzna (dalsze plany jaśniejsze i bardziej zamglone).

### 6.3 Katalog 45 widoków

Około 12 widoków ★ dostaje osobne przepisy z dopracowanym detalem, a pozostałe składają się z klocków z parametrami miejsca. Opisy to propozycja: punkt wyjścia, który wykonawca może rozwijać, byle każdy widok był rozpoznawalny.

**🌍 Ziemia — 18 miast.** Każde miasto to niebo zależne od pory dnia i pogody oraz panorama w trzech planach z perspektywą powietrzną. Charakterystyczne budowle (dzisiejsze `LANDMARKS`) zostają, ale z oświetleniem z klucza światła. Do tego jeden element miejsca:

| Miasto | Element miejsca |
|---|---|
| Warszawa | Pałac Kultury i Varso, Wisła |
| Berlin | Fernsehturm |
| Tokio | Fuji w tle |
| San Francisco | Golden Gate, mgła znad zatoki |
| Seul | N Seoul Tower, góry |
| Bengaluru | palmy, ciepła mgiełka |
| São Paulo | gęsta zabudowa |
| Londyn | Big Ben, The Shard |
| Nowy Jork | Empire State, Chrysler |
| Lagos | laguna |
| Sydney | Opera, Harbour Bridge, woda |
| Sztokholm | iglice, woda |
| Singapur | Supertrees, Marina Bay |
| Reykjavík | Hallgrímskirkja, **zorza nocą ★** |
| Dubaj | Burj Khalifa, Burj Al Arab, pustynny pył |
| Toronto | CN Tower, jezioro |
| Zurych | Grossmünster, **Alpy ★** |
| Tel Awiw | morze, palmy |

**🛰️ Kosmos — 9 widoków** (Proxima jest w `SPACE_VIEWS` w `js/scene.js`, ale żadna kolonia jej nie używa — do usunięcia przy przebudowie):

| Widok | Opis |
|---|---|
| Niska orbita ★ | Ziemia z orbity: dzień i noc, światła miast, atmosfera, satelity (jak w szkicu) |
| L2 | głęboka czerń, odległe Słońce, Ziemia i Księżyc razem za plecami, głębokie pole galaktyk |
| Księżyc | szary regolit, czarne niebo, **wiszący błękitny glob Ziemi** |
| Mars ★ | rdzawy krajobraz, maślane niebo w dzień, **niebieski zachód słońca**, Fobos |
| Wenus | wnętrze żółtej warstwy chmur (miasto w aerostatach), przytłumione słońce |
| Merkury | ogromne Słońce, czarne niebo, rozgrzany grunt |
| Ceres | ciemne skały, jasne plamy w kraterze, mała tarcza Słońca |
| Europa ★ | spękany lód, **ogromny Jowisz z pasami i Wielką Czerwoną Plamą** |
| Tytan | gęsta pomarańczowa mgła, metanowe jeziora, ledwo widoczny Saturn |

**🌌 Galaktyka — 9 widoków:**

| Widok | Opis |
|---|---|
| Układ Słoneczny ★ | rój Dysona wokół Słońca: tysiące lśniących paneli, ślad Słońca |
| Alfa Centauri | dwa słońca (A i B), daleka czerwona Proxima |
| TRAPPIST-1 | ciemnoczerwona gwiazda, kilka planet jako sierpy |
| Plejady | niebieskie gwiazdy w mgławicy refleksyjnej |
| Mgławica Kraba ★ | włókna pozostałości po supernowej, **pulsujący pulsar** |
| Mgławica Oriona ★ | gaz i pył, młode gwiazdy (jak w szkicu) |
| Omega Centauri | gęsta gromada kulista, ciepłe złoto |
| Wielki Obłok Magellana ★ | **nasza Droga Mleczna widziana z zewnątrz**, spirala |
| Sagittarius A* ★ | czarna dziura (jak w szkicu, z wirującym dyskiem) |

**🕳️ Wszechświat — 9 widoków:**

| Widok | Opis |
|---|---|
| Droga Mleczna | nasza galaktyka od czoła, z daleka |
| Andromeda ★ | wielka spirala pod kątem, coraz bliżej, z satelitami |
| Galaktyka Trójkąta | luźna spirala z różowymi obszarami gwiazdotwórczymi |
| Gromada w Pannie | rój galaktyk eliptycznych, **M87 z dżetem** |
| Gromada Pocisk ★ | dwie zderzające się gromady: różowy gaz i niebieska mapa masy (konwencja zdjęć NASA) |
| Wielki Atraktor | strumienie galaktyk spływające ku jasnemu obszarowi |
| Pustka Wolarza | spokojna, prawie pusta czerń z kilkoma galaktykami — „cisza” jako efekt |
| Wielki Mur Herkulesa | gęsty pas galaktyk przez cały kadr |
| Kraniec wszechświata ★ | poświata Wielkiego Wybuchu (cętkowane mikrofalowe tło), pierwsze gwiazdy |

### 6.4 Interfejs przepisu (dla wykonawcy)

Każdy widok to przepis: `{ id, seed, draw(ctx, w, h, env), light, animate? }`.

- `draw` maluje tło statyczne.
- `light` zwraca klucz światła: `{ color, dir, ambient, rim }`.
- `animate(ctx, t)` (opcjonalne) dla warstwy ruchomej.
- `env` niesie porę dnia, pogodę i święto (dotyczy Ziemi).

## 7. Dioramy (struktury gracza)

Jedna logika wzrostu dla wszystkich etapów (jak dziś):
- **odblokowany dział** dodaje element dioramy (budynek, moduł, pokład, krąg);
- **progi obsady** (`SEATS`: 1/5/15/40/100) dodają detale: okna, ludzi, pojazdy;
- **rundy** (do 8) dodają ozdoby i rozmiar;
- **biura i kolonie** zmieniają widok zza okna.

Gdy diorama rośnie, kamera się oddala (jak dziś rośnie `H`).

**Diorama zawsze stoi na własnej wyspie lub platformie unoszącej się przed tłem**, a tło to osobny obraz nieba i krajobrazu. Na widokach z powierzchnią (Księżyc, Mars, Merkury, Ceres, Europa, Tytan, a na Ziemi każde miasto) wierzch wyspy jest z materiału tego miejsca (regolit, rdzawy grunt, lód, trawa i chodnik), a horyzont i panorama są w tle. Dzięki temu tło nie zależy od rozmiaru dioramy i można je trzymać w pamięci podręcznej według klucza `(widok, pora dnia, pogoda, rozmiar)`. Cień dioramy pada na jej własną wyspę, nie na tło. *(decyzja Claude po recenzji)*

**Czytelność działów.** Każdy dział ma rozpoznawalną bryłę i mały emblemat (dzisiejsza ikona działu). Obsadę pokazujemy gęstością świateł, ludzi i pojazdów według progów `SEATS`, a nie liczbą biurek. Dokładne liczby zostają w zakładce Zespół. Wszystkie działy etapu (do 13 na Ziemi) muszą się zmieścić i być rozróżnialne na ekranie iPhone'a SE; to wyznacza rozmiar wyspy i najdalsze oddalenie kamery. *(decyzja Claude po recenzji)*

| Etap | Start | Rozwój |
|---|---|---|
| 🌍 Ziemia | garaż z laptopem | biuro, potem wieżowiec, a wokół na wyspie budynki działów (R&D, marketing…); auta, drony, drzewa, pory roku na wyspie |
| 🛰️ Kosmos | kapsuła | stacja na platformie orbitalnej: moduły, ramiona, panele, dokujące rakiety |
| 🌌 Galaktyka | prom | statek-matka w doku: smukły kadłub, gondole napędu, hangary, światła nawigacyjne |
| 🕳️ Wszechświat | iskra kreacji | cytadela z kryształu i światła na odłamku materii: kręgi, iglice, portal |

Diorama zostaje w SVG (dzisiejsze warstwy: statyczne i animowane). Elementy budowane są z funkcji „pudełko izometryczne + detale”, a kolory biorą się z palety etapu zmodyfikowanej kluczem światła. Kolejność, w jakiej działy dokładają elementy, ustala wykonawca. Ważne, żeby każdy nowy dział był **widocznym** dodatkiem.

## 8. Efekty i animacje

- **Kliknięcie:** cząstki w stylu etapu (monety i znaki kodu na Ziemi, iskry startu w Kosmosie, smugi skoku w Galaktyce, okruchy światła we Wszechświecie). Krótka, sprężysta reakcja przycisku.
- **Zakup:**
  - produktu: błysk na liczniku i delikatny „puls” dioramy;
  - działu: nowy element wyrasta z animacją (np. budynek rośnie od ziemi);
  - kamienia milowego (25/50/100): mocniejszy efekt i dźwięk.
- **Bąbelki wydarzeń:** nowy wygląd w stylu etapu (szklane kule ze światłem), czytelne na każdym tle.
- **Runda, fala, wyprawa, eon:** efekt resetu (np. fala światła przez scenę).
- **Przejście między etapami:** kamera odjeżdża od dioramy i przechodzi do następnej (≤ 1,5 s).
- **Zdjęcie hamulca, wiral:** wyraźny, ale krótki efekt ekranu.
- **Tryb zen:** sama scena z tłem i dioramą, delikatne animacje, zegar.

Zasada: efekt trwa krótko, nie zasłania liczb i nie miga szybciej niż 3 razy na sekundę. Gdy system ma włączone *ograniczenie ruchu* (`prefers-reduced-motion`), efekty się upraszczają.

## 9. Interfejs

Reskin bez zmiany układu i logiki:
- **HUD i dolny panel:** szkło (`backdrop-filter`), z wariantem bez rozmycia (półprzezroczysty kolor) dla trybu oszczędnego i starszych urządzeń.
- **Przycisk główny:** w stylu etapu, z poświatą w kolorze klucza światła.
- **Pasek zakładek, karty, listy i modale:** ciemne szkło zabarwione paletą etapu. Przyciski z delikatną „głębią” w duchu wariantu A (dolna krawędź, sprężysty nacisk).
- **Czytelność liczb ma pierwszeństwo przed efektami.**

## 10. Wydajność i ustawienia

**Budżety (do sprawdzenia na prawdziwym iPhonie):**
- Ekran Biura pokazuje się od razu. Gotowe tło pojawia się w ≤ 0,5 s (generowanie w workerze, poza głównym wątkiem).
- Interfejs bez zacięć: główny wątek nie dostaje zadań dłuższych niż ~50 ms.
- Animowana warstwa tła ≤ 30 fps. Wszystkie animacje stoją poza Biurem, gdy aplikacja jest w tle i w trybie oszczędnym.
- Pamięć podręczna teł: najwyżej ~6 obrazów. Tła liczone przy gęstości pikseli ≤ 2 (są miękkie, więcej nie widać).
- Rozmiar kodu oprawy: + ≤ 150 kB nieskompresowanego JS/CSS.

**Ustawienia** (PL/EN): *Jakość grafiki*: **Pełna** (domyślnie) albo **Oszczędna** (bez animowanych teł i rozmycia szkła, mniej cząstek).

## 11. Architektura kodu (propozycja)

- `js/art/noise.js`: szum, fBm, ridged, generator losowy z ziarnem (z testami).
- `js/art/kit.js`: klocki z punktu 6.2.
- `js/art/views/*.js`: przepisy widoków, po jednym pliku na etap.
- `js/art/backdrop.js`:
  - zarządca tła: klucz pamięci podręcznej, worker, zastępczy gradient, przejście, warstwa animowana, pauza;
  - eksport klucza światła.
- `js/art/worker.js`: generowanie w `OffscreenCanvas`.
- `js/diorama/*.js`: dioramy etapów. `js/scene.js` zostaje koordynatorem: podpis stanu, warstwy SVG, pogoda.
- W `#scene`: element `<canvas>` tła pod dotychczasowymi warstwami SVG.
- Narzędzie deweloperskie: **galeria widoków** w trybie deweloperskim. Pokazuje wszystkie 45 teł (i dioramy na różnych poziomach rozwoju) w siatce, z czasem generowania każdego. Służy do przeglądu i porównań.

## 12. Weryfikacja

- **Testy jednostkowe** (`node:test`, bez przeglądarki):
  - funkcje szumu i generator losowy: zakresy, deterministyczność;
  - każdy z 45 widoków ma przepis i klucz światła;
  - każdy dział każdego etapu ma element dioramy;
  - nowe teksty mają wersję EN.
- **Galeria widoków:** przegląd wizualny przez Piotra po każdym etapie wdrożenia.
- **Pomiar wydajności:**
  - czasy generowania w galerii;
  - na iPhonie: czas pokazania tła, płynność przewijania list w trakcie animacji;
  - zachowanie po powrocie z tła.
- Dotychczasowe testy (76) przechodzą bez zmian.

## 13. Kolejność wdrożenia

Każdy krok kończy się czymś do obejrzenia:

1. **Fundament:**
   - szum, klocki, zarządca tła z workerem i pamięcią podręczną;
   - galeria widoków;
   - ustawienie *Jakość grafiki*.
2. **Tła Galaktyki i Wszechświata.** 18 widoków, w tym najbardziej spektakularne ★. To największa bolączka, więc idzie pierwsza.
3. **Tła Kosmosu** (9 widoków).
4. **Tła Ziemi:** niebo z porą dnia i pogodą, panoramy 18 miast, klucz światła.
5. **Dioramy:**
   - najpierw Ziemia (garaż → wieżowiec → kampus);
   - potem Kosmos, Galaktyka, Wszechświat, każdy z własną bryłą.
6. **Interfejs:** szkło, przyciski, karty, bąbelki.
7. **Efekty:** kliknięcia, zakupy, kamienie milowe, rundy, przejścia etapów, zen.
8. **Szlif i wydajność** na iPhonie, tryb oszczędny, `prefers-reduced-motion`.

## 14. Co zostaje wykonawcy

- Dokładne palety, kształty i kompozycja każdego widoku i dioramy, w granicach punktów 5–7.
- Kolejność, w jakiej działy dokładają elementy dioram.
- Czy galeria to osobna strona, czy modal w trybie deweloperskim.
- Szczegóły techniczne workera i pamięci podręcznej (np. czy zapisywać gotowe tła między uruchomieniami).

## 15. Ryzyka

| Ryzyko | Co robimy |
|---|---|
| Generowanie teł za wolne na telefonie | worker, mniejsza rozdzielczość dla miękkich warstw, zastępczy gradient; pomiar na urządzeniu już w kroku 1 |
| `OffscreenCanvas` w workerze niedostępny lub niestabilny w docelowym Safari | wariant na głównym wątku w kawałkach |
| Rozmycie szkła (`backdrop-filter`) obciąża starsze iPhone'y | wariant bez rozmycia w trybie oszczędnym |
| 45 widoków to dużo pracy i ryzyko powtarzalności | klocki z parametrami plus ~12 dopracowanych widoków ★; przegląd w galerii po każdym etapie |
| Czytelność liczb na jasnych tłach | szkło z przyciemnieniem dobieranym do klucza światła; sprawdzić najjaśniejsze widoki |
