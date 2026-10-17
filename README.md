# 🏙️ Krzemowe Imperium · Silicon Empire

Relaksująca gra **idle/clicker** z warstwą ekonomiczną: zaczynasz w garażu z laptopem, a kończysz, tworząc nowe wszechświaty. Imperium rośnie **etapami**: Ziemia, Kosmos, Galaktyka i Wszechświat. Każdy etap to osobna firma z własnymi produktami, działami, drzewkiem technologii i resetami. Grafika 2D (SVG + CSS), bez 3D, zrobiona z myślą o iPhonie.

Gra jest **po polsku i po angielsku**: język dobiera się sam według ustawień telefonu, a zmienisz go na ekranie powitalnym albo w *Firma → Ustawienia*.

> **EN:** A relaxing idle/clicker about growing a tech company from a garage into a multiverse-spanning conglomerate, stage by stage: Earth, Space, the Galaxy and the Universe, each with its own products, departments, tech tree, resets, lobbying, challenges and music. After the finale you can transcend: start the whole empire over for a permanent bonus and unlock the challenges. 2D art, no 3D, built for iPhone as a PWA (no App Store needed). Fully playable in English and Polish; the language follows your phone and can be switched in *Company → Settings*.

Gra to **PWA** (Progressive Web App) — instalujesz ją z Safari na ekran początkowy, uruchamia się na pełnym ekranie jak zwykła aplikacja, działa offline i **nie wymaga App Store, Maca ani konta deweloperskiego**.

## 📲 Instalacja na iPhonie

1. **Włącz GitHub Pages** (jednorazowo): w repozytorium wejdź w *Settings → Pages*, w sekcji *Build and deployment* wybierz *Source: Deploy from a branch*, gałąź `main` i folder `/ (root)`, zapisz.
   Po minucie gra będzie pod adresem `https://vus955-gif.github.io/Mobile-idle-Game/`.
2. Otwórz ten adres w **Safari** na iPhonie.
3. Stuknij **Udostępnij** (kwadrat ze strzałką) → **Do ekranu początk.** → **Dodaj**.
4. Uruchamiaj grę z ikony. Postęp zapisuje się automatycznie na urządzeniu.

> Wskazówka: raz na jakiś czas zrób kopię zapasową w *Firma → Ustawienia → Eksport zapisu* i wklej ją do Notatek.

## 🎮 Jak się gra

| Element | Co robi |
|---|---|
| **Etapy imperium** | 🌍 Ziemia → 🛰️ Kosmos → 🌌 Galaktyka → 🕳️ Wszechświat. Kosmos otwierasz po pełnym drzewku Ziemi i rocznym przychodzie ponad PKB Ziemi, Galaktykę po pełnym drzewku Kosmosu i przychodzie cywilizacji typu II, a Wszechświat — ostatni etap — po pełnym drzewku Galaktyki i typie III. Po odkryciu całego drzewka Wszechświata czeka finał. Każdy etap zaczyna się od zera i ma własne produkty, działy, technologie, ulepszenia, ekspansję i resety, a pieniądze wchodzą w nim na nowy poziom absurdu. Wszystkie etapy pracują naraz; przełączasz je paskiem nad sceną. |
| **Zasilanie** | Poprzedni etap pracuje dalej w tle i finansuje kolejny (Ziemia program kosmiczny, Kosmos wyprawy galaktyczne, Galaktyka kreację wszechświata): grant na start (10 minut jego przychodu) i 0/10/25/50% przychodu co sekundę. Ustawisz to w arkuszu imperium. |
| **Koduj / Start / Skok / Twórz** | Stukaj w przycisk — na Ziemi każde kliknięcie to kod i pieniądze, w kosmosie start rakiety, w galaktyce skok statku, a we wszechświecie akt kreacji. |
| **Produkty** (18 na Ziemi + 9 w kosmosie + 9 w galaktyce + 9 we wszechświecie) | Od strony wizytówki przez AI i komputer kwantowy po interfejs mózg-komputer, w kosmosie od lotów orbitalnych przez hotel na orbicie, hel-3 z Księżyca i miasta na Marsie po energię z roju Dysona, a w galaktyce od sond międzygwiezdnych przez arki pokoleniowe, mózgi matrioszki i elektrownie przy czarnych dziurach po internet galaktyczny, a we wszechświecie od latarni kwazarowych przez bramy międzygalaktyczne, ciemną materię i pętle czasu po wszechświaty na zamówienie. Zarabiają same, także gdy gra jest zamknięta. Co 25/50/100… poziomów kamień milowy podwaja przychód. Każdy wyższy produkt zarabia na poziom więcej od poprzedniego (w pełni rozwiniętym etapie co najmniej ×1,6), więc najnowszy jest najlepszą inwestycją — pilnuje tego test i `tools/ladder.mjs`. |
| **Zespół** (13 działów na Ziemi + 9 modułów stacji + 9 pokładów statku-matki + 9 kręgów cytadeli) | Na Ziemi każdy dział to nowe piętro budynku: programiści, R&D, design, marketing, sprzedaż, obsługa klienta, HR, DevOps, finanse, data science, prawnicy, cyberbezpieczeństwo, zarząd. W kosmosie to moduły stacji: inżynierowie rakietowi, kontrola misji, astronauci, roboty serwisowe, logistyka orbitalna, medycyna kosmiczna, prawo kosmiczne, górnicy i terraformerzy. W galaktyce pokłady statku-matki: nawigatorzy, astrofizycy, dyplomaci pierwszego kontaktu, okrętowa SI, kupcy, genetycy, senat galaktyczny, grawitolodzy i ksenobiolodzy. We wszechświecie kręgi cytadeli: kartografowie kosmosu, kosmolodzy, ambasadorzy galaktyk, roje replikatorów, maklerzy czasoprzestrzeni, nieśmiertelni, trybunał kosmiczny, chrononauci i wędrowcy pustki. |
| **Badania** (41 technologii w erach 1–7 + 21 w erach 8–10 + 21 w erach 11–13 + 21 w erach 14–16 + badania bez końca) | Na Ziemi od HTML i CSS przez chmurę, AI i komputery kwantowe po AGI. W kosmosie: Orbita (rakiety, satelity, stacje, winda kosmiczna), Księżyc i Mars (baza, fuzja, kolonia, górnictwo planetoid, terraformowanie), Układ Słoneczny (superinteligencja, kopalnie na Merkurym, statyty, rój Dysona). W galaktyce: Najbliższe gwiazdy (żagle świetlne, hibernacja, sondy von Neumanna), Ramię Oriona (antymateria, kuźnie gwiazd, czarne dziury, rozsiew życia), Droga Mleczna (napęd warp, kopalnie w jądrze, sieć galaktyczna, Sagittarius A*). We wszechświecie: Grupa Lokalna (tunele czasoprzestrzenne, most do Andromedy, ciemna energia), Kosmiczna sieć (Laniakea, energia próżni, inżynieria czasu), Poza czasem (wszechświaty kieszonkowe, teoria wszystkiego, wszechświaty potomne i ostatnie pytanie). Odblokowują produkty i działy, a każda poszerza rynek. **Zostają po resetach.** Przy każdej technologii widać, za ile będzie Cię na nią stać. |
| **Zasięg rynku** | Ile świat jest w stanie zapłacić. Na Ziemi przychód rośnie w ludzkiej skali i kończy się na kilkuset PKB świata (ok. $10 bln/s). Kosmos zaczyna się tam, gdzie kończy się Ziemia, i dochodzi do cywilizacji typu II, Galaktyka prowadzi od roju Dysona do typu III, a Wszechświat — od całej galaktyki do multiwersum. Gdy przychód dobije do zasięgu, dalej rośnie już tylko powoli, a nowe technologie poszerzają rynek. W ustawieniach jest **piaskownica** bez limitu rynku — tryb testowy, w którym liczby rosną bez hamulca (wybór zostaje po „Zacznij od nowa”). |
| **Lobbing** (8 poziomów w każdym etapie) | Osobna zakładka firmy: kontrolowany sposób na szerszy rynek. Każdy poziom poszerza zasięg ×1,41 do końca rundy — na Ziemi od agencji PR przez biuro w Brukseli i fotel w ONZ po gospodarkę pod Twoje dyktando, a w kolejnych etapach własne odpowiedniki. Pierwszy poziom kosztuje minutę szczytowych zarobków etapu, każdy kolejny ×2,5, więc ostatnie opłacają się tylko w długiej rundzie. Lobbing przepada przy resecie etapu, a budżet badawczy liczy się od przychodu bez lobbingu, więc drzewko nie przyspiesza. |
| **Zdjęcie hamulca** | Czarny piątek na Ziemi, okno startowe w kosmosie, wielka koniunkcja w galaktyce i kosmiczna inflacja we wszechświecie. Raz na rundę etapu, za 20 minut szczytowych zarobków: przez 5 minut przychód ponad zasięgiem rośnie liniowo, najwyżej do ×1000 zasięgu (czyli do 10× więcej niż pełne nasycenie). Nie działa offline ani w wyzwaniach. |
| **Budżet badawczy** | Gdy gotówka się przelewa, 10, 25 albo 50% przychodu idzie na badania. Badaczy przybywa powoli, a budżet rośnie razem z przychodem (z malejącym zwrotem), więc w późnej grze to on napędza postęp. |
| **Ulepszenia** (~910) | Ulepszenia produktów, działów, kodowania i kultury firmy: pizza w piątki i firmowy pies na Ziemi, kawa w nieważkości, pizza z drukarki 3D i koncert w próżni w kosmosie, holodek i orkiestra sfer w galaktyce, biblioteka wszystkich książek i niedziela poza czasem we wszechświecie. |
| **Kontrakty** | Zlecenia B2B od klientów (w kosmosie: od kolonii i agencji kosmicznych, w galaktyce: od obcych cywilizacji, we wszechświecie: od całych gromad) — przyjmujesz, czekasz, dostajesz sowitą zapłatę (także offline). Oferty przychodzą co 1–2,5 minuty, a premie do nagród rosną umiarkowanie (badanie bez końca +3% za poziom). |
| **Przejęcia** (13 + 7 + 7 + 7) | Kupujesz inne startupy za potężne bonusy, w kosmosie np. Księżycowy Ekspres albo Czerwoną Planetę Dewelopera, w galaktyce Horyzont Zdarzeń Energię albo Andromeda Holdings, a we wszechświecie Budkę Czasu albo Multiwersum Holdings. |
| **Rundy, fale, wyprawy i eony** | Prestiż każdego etapu: na Ziemi zaczynasz od nowa z kapitałem inwestorów, w kosmosie z kolonistami, w galaktyce z sondami von Neumanna, a we wszechświecie każdy eon kończy się nowym Wielkim Wybuchem i daje osobliwości. Każde z nich trwale mnoży przychód swojego etapu, a każdy reset daje udziały na ulepszenia **rady nadzorczej**. Drzewko każdego etapu wymaga kilku resetów. |
| **Wycena firmy** | Majątek (gotówka + wartość tego, w co zainwestowałeś) + roczny przychód × mnożnik rynkowy. Godzina gry to mniej więcej rok życia firmy, a mnożnik (×3–×15) rośnie z technologiami i rundami. Garaż zarabiający $6/s jest wart ok. $65 tys. |
| **Wydarzenia** | Łap pływające bąbelki: 🔥 Viral (×7 przychodu), 💰 Anioł biznesu (5 minut przychodu), ⚡ Hackathon (×15 kodowania), 💡 Eureka. Premie przyspieszają wydarzenia, ale bąbelek pojawia się najwyżej co 45 sekund. Do tego trendy rynkowe i pasek wiadomości. |
| **Autopilot** (12 modułów) | Moduły kupowane raz za udziały: same rozwijają produkty, kupują ulepszenia, zatrudniają, biorą kontrakty, odkrywają technologie, łapią bąbelki, otwierają biura i kolonie, kupują przejęcia, rozstrzygają decyzje, zatrudniają zarząd, grają na giełdzie, a autopilot rund zamyka rundę, gdy ta podwoi kapitał. Każdy można wyłączyć. Po powrocie od razu inwestują zarobki offline. |
| **Rada nadzorcza** (19 ulepszeń) | Udziały z resetów wydajesz na trwałe premie wspólne dla całego imperium: zaufanie inwestorów, kapitał na start, automatyzacja, zakupy hurtowe, zwiadowcy rynków, bankowcy inwestycyjni, most między światami (mocniejsze zasilanie kolejnego etapu) i inne. |
| **Transcendencja** | Po finale (pełne drzewko Wszechświata) wybierasz: grać dalej albo zacząć całe imperium od zera, od garażu. Resetują się wszystkie etapy, udziały, rada nadzorcza i zarząd; zostają osiągnięcia, autopilot, ustawienia, nazwa firmy i poziomy wyzwań. W zamian na zawsze przychód ×3 i punkty badań ×2 za każdą transcendencję, a do tego odblokowują się wyzwania. |
| **Wyzwania** (13 × 3 poziomy, po transcendencji) | Każdy etap ma własne. Ziemia: bez klawiatury, pełne skupienie (5 produktów), jednoosobowa armia (tylko pierwszy dział), kryzys na rynkach (rynek ~3× mniejszy). Kosmos: bez wsparcia z Ziemi, minimalizm (bez ulepszeń), wzrost organiczny (bez przejęć). Galaktyka: ręczne sterowanie (bez autopilota), bez budżetu badań, wolny rynek (bez lobbingu). Wszechświat: entropia (bez kamieni milowych), bez ekspansji, jedna gwiazda (3 produkty). Runda wyzwania to spółka-córka: technologie i premie imperium działają, ale kapitał etapu nie, a hamulca nie da się zdjąć. Cel to tyle, ile etap zarabiał w szczycie przez 10 minut, 40 minut albo 2 godziny, razy współczynnik trudności ograniczenia; offline też się liczy. Każdy poziom daje trwałą nagrodę — np. auto-kliknięcia ×2, mocniejsze kamienie milowe, pierwszy dział ×3, darmowy lobbing na start rundy, podwójne zasilanie, tańsze ulepszenia, dłuższe zdjęcie hamulca, produkty na start — i poszerza zasięg rynku etapu o 0,05 rzędu wielkości. |
| **Decyzje** | Co 15–30 minut gry na scenie pojawia się koperta z sytuacją i dwiema dobrymi opcjami: gotówka, badania, premie albo nagroda odroczona. |
| **Świat, kolonie, układy i galaktyki** (18 miast + 9 kolonii + 9 układów + 9 galaktyk i gromad) | Biura na kropkowej mapie świata od Warszawy po Tel Awiw, w kosmosie kolonie na mapie Układu Słonecznego (stacja orbitalna, L2, Księżyc, Mars, Ceres, Wenus, Europa, Tytan, Merkury), a w galaktyce placówki na mapie Drogi Mlecznej: Alfa Centauri, TRAPPIST-1, Plejady, Mgławica Oriona, Mgławica Kraba, Omega Centauri, Sagittarius A* i Wielki Obłok Magellana, a we wszechświecie węzły kosmicznej sieci: Andromeda, Galaktyka Trójkąta, Gromada w Pannie, Gromada Pocisk, Wielki Atraktor, Pustka Wolarza, Wielki Mur Herkulesa i kraniec obserwowalnego wszechświata. Zostają na zawsze, mają po 3 poziomy, a widok z okna zmienia panoramę za budynkiem, stacją, statkiem albo cytadelą. |
| **Zarząd** (5 foteli) | Kandydaci od headhuntera z cechami i dziwactwami (np. pracują lepiej nocą, w weekendy albo gdy pada). Zostają na zawsze i z czasem nabierają doświadczenia. |
| **Giełda** (po IPO) | Kurs Twoich akcji, dziesięciu konkurentów (Gruszka Computers, Makrotwardy, Gogle…) i udziały, które wzmacniają Twoje produkty; 51% to przejęcie kontroli. |
| **Skala cywilizacji** | Roczny przychód całego imperium porównany z największą firmą świata, PKB Polski, USA i Ziemi oraz majątkiem ludzkości, a dalej ze skalą Kardaszowa (ludzkość ≈ 0,73). Stopnie Kardaszowa wymagają też technologii: typ I satelitów, typ II roju Dysona (oba z Kosmosu), gromada gwiazd sond von Neumanna, typ III sieci galaktycznej (z Galaktyki), Grupa Lokalna tuneli czasoprzestrzennych, typ IV ciemnej energii, a multiwersum (Kardaszow 5) wszechświatów potomnych (z Wszechświata). Do tego wykres przychodu i wyceny. |
| **Osiągnięcia** (548) | Wspólne dla całego imperium; każde daje +1% przychodu we wszystkich etapach. Kilka jest ukrytych. |

Wspólne dla wszystkich etapów są osiągnięcia, udziały i rada nadzorcza, zarząd, autopilot, decyzje i skala cywilizacji. Osobne: produkty, działy, technologie, ulepszenia, biura i kolonie, kontrakty, przejęcia oraz resety. Giełda jest na Ziemi; lobbing, hamulec i wyzwania ma każdy etap.

W kosmosie zamiast biurowca rośnie stacja: kapsuła, potem moduły z załogą przy konsolach, skrzydła paneli słonecznych i zadokowane rakiety. W tle widać planetę z wybranej kolonii: Ziemię pod stacją na orbicie, czerwone niebo Marsa albo chmury Wenus. W galaktyce zaczynasz od promu, a z każdym działem rośnie statek-matka z gondolami napędu warp i pierścieniem; z mostka widać rój Dysona wokół Słońca, czerwony karzeł TRAPPIST-1, Plejady, mgławice, gromadę Omega Centauri, Drogę Mleczną z Obłoku Magellana albo czarną dziurę w jądrze. We wszechświecie zaczynasz od iskry kreacji, a z każdym działem rośnie cytadela otoczona halo pierścieni, z portalem nad szczytem; za nią widać Drogę Mleczną, Andromedę, gromady galaktyk, Wielki Mur Herkulesa albo poświatę Wielkiego Wybuchu.

Scena biura żyje według kalendarza telefonu: pora dnia, pory roku, pogoda zmieniająca się co 3 godziny (deszcz, śnieg, mgła), dynie na Halloween, choinka i lampki w grudniu, fajerwerki w Sylwestra. Tryb zen (🪷) chowa interfejs i zostawia samo biuro z zegarem. W ustawieniach można włączyć muzykę komponowaną na bieżąco w przeglądarce — każdy etap ma własną: lo-fi z trzaskami winylu i miękkim bitem na Ziemi, powolny ambient z dzwonkami i szumem radia w kosmosie, elektroniczne arpeggia w galaktyce i bezrytmiczny dron z długim echem we wszechświecie. Przejście między etapami płynnie przenika jedną muzykę w drugą, a dźwięki kliknięć, zakupów i resetów też mają barwę etapu.

## ⚖️ Balans

Tempo gry jest dostrojone symulacją (`tools/simulate.mjs`), w której bot gra według zachłannej strategii:

Bot gra wszystkimi etapami naraz: aktywnym klika, do pozostałych zagląda, a kolejny etap otwiera, gdy tylko może.

- **gra aktywna**: sklep internetowy ~7 min, aplikacja mobilna ~11 min, pierwsza runda finansowania ~1 h, pełne drzewko Ziemi i start w kosmos po ~6,5 h, cały Kosmos i skok do Galaktyki po ~14 h, cała Galaktyka i wejście do Wszechświata po ~19 h, finał (pełne drzewko Wszechświata, multiwersum) po ~30 h,
- **gra „z doskoku”** (20 min co ~3 h, noc offline): ery 1–4 pierwszego dnia, ery 5–7 na początku 2. dnia, pełne drzewko Ziemi i start w kosmos po ~1,6 dnia (ok. 9 rund finansowania). W kosmosie era Księżyca i Marsa przychodzi po ~3 h, Układ Słoneczny po ~15 h, a całe drzewko i skok do Galaktyki po ~1,3 doby (~2,9–3 dnia od startu). Galaktyka idzie szybciej: Droga Mleczna po ~3 h, pełne drzewko i cywilizacja typu III po ~18 h (~3,7 dnia od startu). Wszechświat to najdłuższy etap: Poza czasem po ~7–17 h, a finał i multiwersum po ~1,7–1,9 doby (~5,3–5,7 dnia od startu). Drugie przejście po transcendencji (przychód ×3, badania ×2) trwa ~3,3 dnia. Zarząd dochodzi do pełnego doświadczenia po ok. 3 tygodniach, a badania bez końca i wyzwania zostają na dłużej.

Pieniądze idą w parze z technologią. Na Ziemi przychód rośnie od garażu (ok. $1/s) do kilkuset PKB świata przy pełnym drzewku (do ok. $10 bln/s). Kosmos zaczyna się tam, gdzie kończy się Ziemia: pierwszy start rakiety kosztuje tyle, ile Ziemia zarabia w kilka sekund, a rynek rośnie od 10¹³ $/s do cywilizacji typu II (ok. 10²³ $/s). Galaktyka jest przesunięta o kolejne 12,5 rzędu wielkości: rynek od 10²⁵ $/s do ponad typu III (10³⁶ $/s). Wszechświat ma rynek szerszy (5 rzędów na erę): od 10³⁸ do 10⁵³ $/s, czyli do multiwersum, więc ceny rozciągają się proporcjonalnie, a technologie drożeją szybciej (2000 × 3,1ⁱ). Zasięg rynku pilnuje tego niezależnie od resetów: ponad nim przychód rośnie z potęgą 0,3 i nigdy nie przekroczy 100× zasięgu. Nowe produkty kosztują ok. 10 minut przychodu z rynku, jaki firma ma w chwili ich odblokowania. Automatyczne kodowanie sprzedaje się na tym samym rynku: we wczesnej grze dokłada się w pełni, a przy nasyconym rynku nie przebija zasięgu (wcześniej setki auto-kliknięć na sekundę dawały w późnej grze 35–290× tyle co produkty). Realne wpływy w późnej grze to ok. 7–12× przychodu z produktów (głównie kontrakty i bąbelki), a nie setki razy więcej.

Firma przychodzi do Kosmosu i Galaktyki z premiami całego imperium (osiągnięcia, rada nadzorcza, zarząd), więc technologie drożeją geometrycznie (2000 × 2,4ⁱ punktów badań), a budżet badawczy liczy się względem skali pieniędzy etapu. Dzięki temu drzewko każdego etapu wymaga kilku resetów, a nie mija w jedną sesję.

Lobbing i hamulec nie przyspieszają drzewka (budżet badawczy liczy się bez nich), ale kosztują realne pieniądze: lobbing minutę szczytowych zarobków etapu × 2,5^poziom, hamulec 20 minut. Bot lobbuje więc tylko na kilka poziomów, a Ziemia słabiej zasila początek Kosmosu niż przy dawnym, taniuteńkim lobbingu.

Bez limitu rynku (`--no=cap`, w grze przełącznik w ustawieniach) wraca stary problem wybuchu: bot kończy Ziemię i cały Kosmos jednej nocy (~22 h zamiast ~2,5 dnia), a przychody dochodzą do 10⁵⁸ $/s.

W późnej grze punkty badań dają głównie budżet badawczy. Bez niego (`--no=budget`) postęp mocno zwalnia, bo badaczy przybywa tylko logarytmicznie względem gotówki.

Bot korzysta też z biur i kolonii, giełdy, zarządu, decyzji i budżetu badawczego. Symulator ma przełączniki (`--no=offices,market,board,decisions,budget,cap`, a dla modułów autopilota `--no=ap-market,ap-offices…`), żeby sprawdzić wpływ każdego systemu; rundy zamyka według własnej reguły, chyba że dostanie `--aprounds`, `--only=earth` (bez otwierania Kosmosu) oraz `--chal[=etap]`, który próbuje po kolei poziomów wszystkich wyzwań (najwyżej `CHAL_HOURS` h na poziom). `TRANSCEND=1` każe botowi po finale zacząć od nowa, `SAVE_STATE`, `SAVE_TIMES="5.5,6.2"` i `LOAD_STATE` zapisują i wczytują stan (np. wyzwania od chwili w drugim przejściu), `LOBBY="krok:wzrost"`, `BRAKE_CEIL` i `SEED` stroją resztę. `node tools/ladder.mjs [etap] [poziom] [--era=N]` pokazuje drabinkę produktów: zarobek z poziomu każdego produktu i podział przychodu u racjonalnego gracza. Parametry da się sprawdzić bez edycji danych: `RDK`/`RDP` (budżet badań Ziemi), `SPACE_RDK`/`SPACE_RDP` (budżet w kosmosie), `TECHMUL="6:2,9:3"` (mnożniki kosztów er) `SPACE_TECH="2000:2.4"`, `GALAXY_TECH="2000:2.4"` i `UNIVERSE_TECH="2000:3.1"` (krzywe kosztów technologii kolejnych etapów).

## 🔋 Wydajność

Ruchome elementy sceny (chmury, auta, część pracowników) są w osobnych warstwach SVG, więc budynek rysuje się tylko raz. Animacje sceny zatrzymują się, gdy nie patrzysz na Biuro, a logika gry chodzi z częstotliwością 20 Hz. Gra zostawiona otwarta mniej obciąża baterię.

## 🛠️ Rozwój

Czysty JavaScript (moduły ES), bez bundlera i zależności.

```
index.html            szkielet aplikacji
css/style.css         wygląd
js/data.js            zawartość Ziemi i części wspólnej (po polsku): produkty, działy, technologie, ulepszenia…
js/space.js           zawartość Kosmosu (po polsku): produkty, moduły, ery 8–10, kolonie, zlecenia
js/galaxy.js          zawartość Galaktyki (po polsku): produkty, pokłady, ery 11–13, układy gwiezdne, zlecenia
js/universe.js        zawartość Wszechświata (po polsku): produkty, kręgi cytadeli, ery 14–16, galaktyki i gromady, zlecenia
js/layers.js          etapy imperium: składa dane każdego etapu (mapy, ulepszenia, osiągnięcia)
js/lang/en.js         ta sama zawartość po angielsku
js/i18n.js            teksty interfejsu PL/EN, wybór języka, odmiana liczebników
js/text.js            nazwy i opisy w bieżącym języku
js/engine.js          logika gry (bez DOM): Game (jeden etap) i Company (całe imperium, zasilanie, zapis v3)
js/ui.js              interfejs, zakładki, modale
js/scene.js           ilustracja w SVG: budynek na Ziemi (pory roku, pogoda, panoramy miast), stacja w kosmosie, statek-matka w galaktyce i cytadela we wszechświecie
js/worldmap.js        kropkowa mapa świata (generowana z Natural Earth)
js/avatar.js          awatary członków zarządu
js/audio.js           dźwięki syntezowane w WebAudio
js/music.js           generatywna muzyka lo-fi
js/main.js            start, zapis, pętla gry
sw.js                 service worker (tryb offline)
tools/simulate.mjs    symulator balansu
tools/ladder.mjs      audyt drabinki produktów (zarobek z poziomu, podział przychodu)
tools/make-icons.mjs  generator ikon PNG z icons/icon.svg
tools/make-worldmap.mjs generator mapy świata (jednorazowo, wymaga world-atlas)
tests/                testy silnika (node:test)
```

```bash
npm start            # serwer lokalny: http://localhost:8080
npm test             # testy silnika, etapów, tłumaczeń i wyceny
npm run sim          # symulacja 21 dni gry „z doskoku”
npm run sim:active   # symulacja ~5 h gry aktywnej
TRANSCEND=1 SAVE_STATE=st.json SAVE_TIMES=7 node tools/simulate.mjs casual 7   # dwa przejścia gry
LOAD_STATE=st-7.json node tools/simulate.mjs casual 0 --chal=galaxy           # wyzwania od tego stanu
node tools/ladder.mjs earth                  # drabinka produktów Ziemi
```

Po zmianie plików gry podbij `CACHE` w `sw.js`, żeby zainstalowana aplikacja pobrała nową wersję.
