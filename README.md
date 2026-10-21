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
| **Zespół** (13 działów na Ziemi + 9 modułów stacji + 9 pokładów statku-matki + 9 kręgów cytadeli) | Na Ziemi każdy dział to osobny budynek z emblematem na wyspie (siedziba programistów rośnie od garażu po kampus): programiści, R&D, design, marketing, sprzedaż, obsługa klienta, HR, DevOps, finanse, data science, prawnicy, cyberbezpieczeństwo, zarząd. W kosmosie to moduły stacji: inżynierowie rakietowi, kontrola misji, astronauci, roboty serwisowe, logistyka orbitalna, medycyna kosmiczna, prawo kosmiczne, górnicy i terraformerzy. W galaktyce pokłady statku-matki: nawigatorzy, astrofizycy, dyplomaci pierwszego kontaktu, okrętowa SI, kupcy, genetycy, senat galaktyczny, grawitolodzy i ksenobiolodzy. We wszechświecie kręgi cytadeli: kartografowie kosmosu, kosmolodzy, ambasadorzy galaktyk, roje replikatorów, maklerzy czasoprzestrzeni, nieśmiertelni, trybunał kosmiczny, chrononauci i wędrowcy pustki. |
| **Badania** (41 technologii w erach 1–7 + 21 w erach 8–10 + 21 w erach 11–13 + 21 w erach 14–16 + badania bez końca) | Na Ziemi od HTML i CSS przez chmurę, AI i komputery kwantowe po AGI. W kosmosie: Orbita (rakiety, satelity, stacje, winda kosmiczna), Księżyc i Mars (baza, fuzja, kolonia, górnictwo planetoid, terraformowanie), Układ Słoneczny (superinteligencja, kopalnie na Merkurym, statyty, rój Dysona). W galaktyce: Najbliższe gwiazdy (żagle świetlne, hibernacja, sondy von Neumanna), Ramię Oriona (antymateria, kuźnie gwiazd, czarne dziury, rozsiew życia), Droga Mleczna (napęd warp, kopalnie w jądrze, sieć galaktyczna, Sagittarius A*). We wszechświecie: Grupa Lokalna (tunele czasoprzestrzenne, most do Andromedy, ciemna energia), Kosmiczna sieć (Laniakea, energia próżni, inżynieria czasu), Poza czasem (wszechświaty kieszonkowe, teoria wszystkiego, wszechświaty potomne i ostatnie pytanie). Odblokowują produkty i działy, a każda poszerza rynek. **Zostają po resetach.** Przy każdej technologii widać, za ile będzie Cię na nią stać. |
| **Zasięg rynku** | Ile świat jest w stanie zapłacić. Na Ziemi przychód rośnie w ludzkiej skali i kończy się na kilkuset PKB świata (ok. $10 bln/s). Kosmos zaczyna się tam, gdzie kończy się Ziemia, i dochodzi do cywilizacji typu II, Galaktyka prowadzi od roju Dysona do typu III, a Wszechświat — od całej galaktyki do multiwersum. Gdy przychód dobije do zasięgu, dalej rośnie już tylko powoli, a nowe technologie poszerzają rynek. W ustawieniach jest **piaskownica** bez limitu rynku — tryb testowy, w którym liczby rosną bez hamulca (wybór zostaje po „Zacznij od nowa”). |
| **Lobbing** (8 poziomów w każdym etapie) | Osobna zakładka firmy: kontrolowany sposób na szerszy rynek. Każdy poziom poszerza zasięg ×1,41 do końca rundy — na Ziemi od agencji PR przez biuro w Brukseli i fotel w ONZ po gospodarkę pod Twoje dyktando, a w kolejnych etapach własne odpowiedniki. Pierwszy poziom kosztuje minutę szczytowych zarobków etapu, każdy kolejny ×2,5, więc ostatnie opłacają się tylko w długiej rundzie. Lobbing przepada przy resecie etapu, a budżet badawczy liczy się od przychodu bez lobbingu, więc drzewko nie przyspiesza. |
| **Zdjęcie hamulca** | Czarny piątek na Ziemi, okno startowe w kosmosie, wielka koniunkcja w galaktyce i kosmiczna inflacja we wszechświecie. Raz na rundę etapu, za 20 minut szczytowych zarobków: przez 5 minut przychód ponad zasięgiem rośnie liniowo, najwyżej do ×1000 zasięgu (czyli do 10× więcej niż pełne nasycenie). Nie działa offline ani w wyzwaniach. |
| **Budżet badawczy** | Część przychodu idzie na badania. Domyślnie działa **Auto**: 10% na początku drzewka, 25% od 40% technologii i 50% od 70%; można też ustawić 0/10/25/50% ręcznie. Badaczy przybywa powoli, a budżet rośnie razem z przychodem (z malejącym zwrotem), więc w późnej grze to on napędza postęp — bez niego ostatnie technologie Kosmosu czekałyby kilka dni. |
| **Ulepszenia** (~910) | Ulepszenia produktów, działów, kodowania i kultury firmy: pizza w piątki i firmowy pies na Ziemi, kawa w nieważkości, pizza z drukarki 3D i koncert w próżni w kosmosie, holodek i orkiestra sfer w galaktyce, biblioteka wszystkich książek i niedziela poza czasem we wszechświecie. |
| **Kontrakty** | Zlecenia B2B od klientów (w kosmosie: od kolonii i agencji kosmicznych, w galaktyce: od obcych cywilizacji, we wszechświecie: od całych gromad) — przyjmujesz, czekasz, dostajesz sowitą zapłatę (także offline). Oferty przychodzą co 1–2,5 minuty, a premie do nagród rosną umiarkowanie (badanie bez końca +3% za poziom). |
| **Przejęcia** (13 + 7 + 7 + 7) | Kupujesz inne startupy za potężne bonusy, w kosmosie np. Księżycowy Ekspres albo Czerwoną Planetę Dewelopera, w galaktyce Horyzont Zdarzeń Energię albo Andromeda Holdings, a we wszechświecie Budkę Czasu albo Multiwersum Holdings. |
| **Rundy, fale, wyprawy i eony** | Prestiż każdego etapu: na Ziemi zaczynasz od nowa z kapitałem inwestorów, w kosmosie z kolonistami, w galaktyce z sondami von Neumanna, a we wszechświecie każdy eon kończy się nowym Wielkim Wybuchem i daje osobliwości. Każde z nich trwale mnoży przychód swojego etapu, a każdy reset daje udziały na ulepszenia **rady nadzorczej**. Drzewko każdego etapu wymaga kilku resetów. |
| **Wycena firmy** | Majątek (gotówka + wartość tego, w co zainwestowałeś) + roczny przychód × mnożnik rynkowy. Godzina gry to mniej więcej rok życia firmy, a mnożnik (×3–×15) rośnie z technologiami i rundami. Garaż zarabiający $6/s jest wart ok. $65 tys. |
| **Wydarzenia** | Łap pływające bąbelki: 🔥 Viral (×7 przychodu), 💰 Anioł biznesu (5 minut przychodu), ⚡ Hackathon (×15 kodowania), 💡 Eureka. Premie przyspieszają wydarzenia, ale bąbelek pojawia się najwyżej co 45 sekund. Do tego trendy rynkowe i pasek wiadomości. |
| **Autopilot** (12 modułów) | Moduły kupowane raz za udziały: same rozwijają produkty, kupują ulepszenia, zatrudniają, biorą kontrakty, odkrywają technologie, łapią bąbelki, otwierają biura i kolonie, kupują przejęcia, rozstrzygają decyzje, zatrudniają zarząd, grają na giełdzie, a autopilot rund zamyka rundę, gdy ta podwoi kapitał. Każdy można wyłączyć. Po powrocie od razu inwestują zarobki offline. |
| **Rada nadzorcza** (19 ulepszeń) | Udziały z resetów wydajesz na trwałe premie wspólne dla całego imperium: zaufanie inwestorów, kapitał na start, automatyzacja, zakupy hurtowe, zwiadowcy rynków, bankowcy inwestycyjni, most między światami (mocniejsze zasilanie kolejnego etapu) i inne. |
| **Transcendencja** | Po finale (pełne drzewko Wszechświata) wybierasz: grać dalej albo zacząć całe imperium od zera, od garażu. Resetują się wszystkie etapy, udziały, rada nadzorcza i zarząd; zostają osiągnięcia, autopilot, ustawienia, nazwa firmy i poziomy wyzwań. W zamian na zawsze przychód ×3 i punkty badań ×2 za każdą transcendencję, a do tego odblokowują się wyzwania. |
| **Wyzwania** (13 × 3 poziomy, po transcendencji) | Każdy etap ma własne. Ziemia: bez klawiatury, pełne skupienie (5 produktów), jednoosobowa armia (tylko pierwszy dział), kryzys na rynkach (rynek ~3× mniejszy). Kosmos: bez wsparcia z Ziemi, minimalizm (bez ulepszeń), wzrost organiczny (bez przejęć). Galaktyka: ręczne sterowanie (bez autopilota), bez budżetu badań, wolny rynek (bez lobbingu). Wszechświat: entropia (bez kamieni milowych), bez ekspansji, jedna gwiazda (3 produkty). Runda wyzwania to spółka-córka: technologie i premie imperium działają, ale kapitał etapu nie, a hamulca nie da się zdjąć. Cel to tyle, ile nasycony rynek etapu (100× zasięgu bez lobbingu, w „Kryzysie” węższy) zarabia przez 10 minut, 40 minut albo 2 godziny; zależy od technologii, a nie od kapitału z rund, więc trudność nie skacze z momentu, w którym zaczynasz. Offline też się liczy. Każdy poziom daje trwałą nagrodę — np. auto-kliknięcia ×2, mocniejsze kamienie milowe, pierwszy dział ×3, darmowy lobbing na start rundy, podwójne zasilanie, tańsze ulepszenia, dłuższe zdjęcie hamulca, produkty na start — i poszerza zasięg rynku etapu o 0,05 rzędu wielkości. |
| **Decyzje** | Co 15–30 minut gry na scenie pojawia się koperta z sytuacją i dwiema dobrymi opcjami: gotówka, badania, premie albo nagroda odroczona. |
| **Świat, kolonie, układy i galaktyki** (18 miast + 9 kolonii + 9 układów + 9 galaktyk i gromad) | Biura na kropkowej mapie świata od Warszawy po Tel Awiw, w kosmosie kolonie na mapie Układu Słonecznego (stacja orbitalna, L2, Księżyc, Mars, Ceres, Wenus, Europa, Tytan, Merkury), a w galaktyce placówki na mapie Drogi Mlecznej: Alfa Centauri, TRAPPIST-1, Plejady, Mgławica Oriona, Mgławica Kraba, Omega Centauri, Sagittarius A* i Wielki Obłok Magellana, a we wszechświecie węzły kosmicznej sieci: Andromeda, Galaktyka Trójkąta, Gromada w Pannie, Gromada Pocisk, Wielki Atraktor, Pustka Wolarza, Wielki Mur Herkulesa i kraniec obserwowalnego wszechświata. Zostają na zawsze, mają po 3 poziomy, a widok z okna zmienia panoramę za budynkiem, stacją, statkiem albo cytadelą. |
| **Zarząd** (5 foteli) | Kandydaci od headhuntera z cechami i dziwactwami (np. pracują lepiej nocą, w weekendy albo gdy pada). Zostają na zawsze i z czasem nabierają doświadczenia. |
| **Giełda** (po IPO) | Kurs Twoich akcji, dziesięciu konkurentów (Gruszka Computers, Makrotwardy, Gogle…) i udziały, które wzmacniają Twoje produkty; 51% to przejęcie kontroli. |
| **Skala cywilizacji** | Roczny przychód całego imperium porównany z największą firmą świata, PKB Polski, USA i Ziemi oraz majątkiem ludzkości, a dalej ze skalą Kardaszowa (ludzkość ≈ 0,73). Stopnie Kardaszowa wymagają też technologii: typ I satelitów, typ II roju Dysona (oba z Kosmosu), gromada gwiazd sond von Neumanna, typ III sieci galaktycznej (z Galaktyki), Grupa Lokalna tuneli czasoprzestrzennych, typ IV ciemnej energii, a multiwersum (Kardaszow 5) wszechświatów potomnych (z Wszechświata). Do tego wykres przychodu i wyceny. |
| **Osiągnięcia** (548) | Wspólne dla całego imperium; każde daje +1% przychodu we wszystkich etapach. Kilka jest ukrytych. |

Wspólne dla wszystkich etapów są osiągnięcia, udziały i rada nadzorcza, zarząd, autopilot, decyzje i skala cywilizacji. Osobne: produkty, działy, technologie, ulepszenia, biura i kolonie, kontrakty, przejęcia oraz resety. Giełda jest na Ziemi; lobbing, hamulec i wyzwania ma każdy etap.

W kosmosie zamiast biurowca rośnie stacja: kapsuła, potem węzeł i stacja ze skrzydłami paneli słonecznych, a wokół niej moduły działów z astronautami w białych kombinezonach, rakiety na stanowiskach i, na powierzchni planety, łazik. W tle widać planetę z wybranej kolonii: Ziemię pod stacją na orbicie, czerwone niebo Marsa albo chmury Wenus. W galaktyce zaczynasz od promu, a z każdym działem rośnie statek-matka z gondolami napędu warp i pierścieniem; z mostka widać rój Dysona wokół Słońca, czerwony karzeł TRAPPIST-1, Plejady, mgławice, gromadę Omega Centauri, Drogę Mleczną z Obłoku Magellana albo czarną dziurę w jądrze. We wszechświecie zaczynasz od iskry kreacji, a z każdym działem rośnie cytadela otoczona halo pierścieni, z portalem nad szczytem; za nią widać Drogę Mleczną, Andromedę, gromady galaktyk, Wielki Mur Herkulesa albo poświatę Wielkiego Wybuchu.

Scena biura żyje według kalendarza telefonu: pora dnia, pory roku, pogoda zmieniająca się co 3 godziny (deszcz, śnieg, mgła), dynie na Halloween, choinka i lampki w grudniu, fajerwerki w Sylwestra. Tryb zen (🪷) chowa interfejs i zostawia samo biuro z zegarem. W ustawieniach można włączyć muzykę komponowaną na bieżąco w przeglądarce — każdy etap ma własną: lo-fi z trzaskami winylu i miękkim bitem na Ziemi, powolny ambient z dzwonkami i szumem radia w kosmosie, elektroniczne arpeggia w galaktyce i bezrytmiczny dron z długim echem we wszechświecie. Przejście między etapami płynnie przenika jedną muzykę w drugą, a dźwięki kliknięć, zakupów i resetów też mają barwę etapu.

## ⚖️ Balans

Tempo gry jest dostrojone symulacją (`tools/simulate.mjs`), w której bot gra według zachłannej strategii:

Bot gra wszystkimi etapami naraz: aktywnym klika, do pozostałych zagląda, a kolejny etap otwiera, gdy tylko może.

- **gra aktywna**: sklep internetowy ~7 min, aplikacja mobilna ~11 min, pierwsza runda finansowania ~1 h, pełne drzewko Ziemi i start w kosmos po ~6,5 h, cały Kosmos i skok do Galaktyki po ~14 h, cała Galaktyka i wejście do Wszechświata po ~20–22 h, finał (pełne drzewko Wszechświata, multiwersum) po ~25 h,
- **gra „z doskoku”** (20 min co ~3 h, noc offline): ery 1–4 pierwszego dnia, ery 5–7 na początku 2. dnia, pełne drzewko Ziemi i start w kosmos po ~1,6 dnia (ok. 9 rund finansowania). W kosmosie era Księżyca i Marsa przychodzi po ~3 h, Układ Słoneczny po ~15 h, a całe drzewko i skok do Galaktyki po ~1,3 doby (~2,9–3 dnia od startu). Galaktyka idzie szybciej: Droga Mleczna po ~3 h, pełne drzewko i cywilizacja typu III po ~18 h (~3,7 dnia od startu). Wszechświat trwa podobnie jak pozostałe etapy: finał i multiwersum po ~18–21 h (~4,4–4,7 dnia od startu). Drugie przejście po transcendencji (przychód ×3, badania ×2) trwa ~3 dni. Zarząd dochodzi do pełnego doświadczenia po ok. 3 tygodniach, a badania bez końca i wyzwania zostają na dłużej.

Bot gra jednak nieludzko: klika 4×/s przez całą sesję, łapie każdy bąbelek i co 5 sekund przelicza najlepszy zakup. Dlatego symulator ma profil **człowieka** (`human`): sesje rozłożone między 7 a 23 (`SESS_PER_DAY`, `SESS_MIN`), 1 kliknięcie/s (`HUMAN_CPS`), połowa bąbelków (`HUMAN_BUBBLE`), zakupy i kontrakty co 30 s (`HUMAN_LOOK`). Na koniec raportuje tempo z perspektywy gracza: kiedy kończy się każdy etap, najdłuższą przerwę między technologiami i „puste” sesje, w których w najnowszym etapie nic nie przybyło. Wyniki (6 seedów): przy 5 sesjach po 20 min dziennie finał po ~4,3–5,5 dnia (Wszechświat 12–24 h), przy 3 sesjach po 15 min po ~7,3–8,6 dnia; najdłuższa przerwa między technologiami to jedna noc, pustych sesji brak. Gracz, który nie ruszy budżetu badań, przy dawnym domyślnym 0% utknąłby na ostatniej technologii Kosmosu na ~3 doby — stąd budżet „Auto”. Wyzwania w tempie człowieka: P1 zwykle w pierwszej sesji, P3 w 1–3 sesjach, niezależnie od momentu gry.

Pieniądze idą w parze z technologią. Na Ziemi przychód rośnie od garażu (ok. $1/s) do kilkuset PKB świata przy pełnym drzewku (do ok. $10 bln/s). Kosmos zaczyna się tam, gdzie kończy się Ziemia: pierwszy start rakiety kosztuje tyle, ile Ziemia zarabia w kilka sekund, a rynek rośnie od 10¹³ $/s do cywilizacji typu II (ok. 10²³ $/s). Galaktyka jest przesunięta o kolejne 12,5 rzędu wielkości: rynek od 10²⁵ $/s do ponad typu III (10³⁶ $/s). Wszechświat ma rynek szerszy (5 rzędów na erę): od 10³⁸ do 10⁵³ $/s, czyli do multiwersum, więc ceny rozciągają się proporcjonalnie, a technologie drożeją szybciej (2000 × 2,9ⁱ). Zasięg rynku pilnuje tego niezależnie od resetów: ponad nim przychód rośnie z potęgą 0,3 i nigdy nie przekroczy 100× zasięgu. Nowe produkty kosztują ok. 10 minut przychodu z rynku, jaki firma ma w chwili ich odblokowania. Automatyczne kodowanie sprzedaje się na tym samym rynku: we wczesnej grze dokłada się w pełni, a przy nasyconym rynku nie przebija zasięgu (wcześniej setki auto-kliknięć na sekundę dawały w późnej grze 35–290× tyle co produkty). Realne wpływy w późnej grze to ok. 7–12× przychodu z produktów (głównie kontrakty i bąbelki), a nie setki razy więcej.

Firma przychodzi do Kosmosu i Galaktyki z premiami całego imperium (osiągnięcia, rada nadzorcza, zarząd), więc technologie drożeją geometrycznie (2000 × 2,4ⁱ punktów badań), a budżet badawczy liczy się względem skali pieniędzy etapu. Dzięki temu drzewko każdego etapu wymaga kilku resetów, a nie mija w jedną sesję.

Lobbing i hamulec nie przyspieszają drzewka (budżet badawczy liczy się bez nich), ale kosztują realne pieniądze: lobbing minutę szczytowych zarobków etapu × 2,5^poziom, hamulec 20 minut. Bot lobbuje więc tylko na kilka poziomów, a Ziemia słabiej zasila początek Kosmosu niż przy dawnym, taniuteńkim lobbingu.

Bez limitu rynku (`--no=cap`, w grze przełącznik w ustawieniach) wraca stary problem wybuchu: bot kończy Ziemię i cały Kosmos jednej nocy (~22 h zamiast ~2,5 dnia), a przychody dochodzą do 10⁵⁸ $/s.

W późnej grze punkty badań dają głównie budżet badawczy. Bez niego (`--no=budget`) postęp mocno zwalnia, bo badaczy przybywa tylko logarytmicznie względem gotówki.

Bot korzysta też z biur i kolonii, giełdy, zarządu, decyzji i budżetu badawczego. Symulator ma przełączniki (`--no=offices,market,board,decisions,budget,cap`, a dla modułów autopilota `--no=ap-market,ap-offices…`), żeby sprawdzić wpływ każdego systemu; rundy zamyka według własnej reguły, chyba że dostanie `--aprounds`, `--only=earth` (bez otwierania Kosmosu) oraz `--chal[=etap]`, który próbuje po kolei poziomów wszystkich wyzwań (najwyżej `CHAL_HOURS` h na poziom). `TRANSCEND=1` każe botowi po finale zacząć od nowa, `SAVE_STATE`, `SAVE_TIMES="5.5,6.2"` i `LOAD_STATE` zapisują i wczytują stan (np. wyzwania od chwili w drugim przejściu), `LOBBY="krok:wzrost"`, `BRAKE_CEIL` i `SEED` stroją resztę. `node tools/ladder.mjs [etap] [poziom] [--era=N]` pokazuje drabinkę produktów: zarobek z poziomu każdego produktu i podział przychodu u racjonalnego gracza. Parametry da się sprawdzić bez edycji danych: `RDK`/`RDP` (budżet badań Ziemi), `SPACE_RDK`/`SPACE_RDP` (budżet w kosmosie), `TECHMUL="6:2,9:3"` (mnożniki kosztów er) `SPACE_TECH="2000:2.4"`, `GALAXY_TECH="2000:2.4"` i `UNIVERSE_TECH="2000:2.9"` (krzywe kosztów technologii kolejnych etapów).

## 🌌 Tła (widoki zza okna)

Za budynkiem, stacją, statkiem i cytadelą jest malowane proceduralnie tło na Canvas: 45 widoków (18 miast, 9 kolonii, 9 układów gwiezdnych, 9 galaktyk i gromad). Każdy widok to przepis w `js/art/views/` złożony z klocków w `js/art/kit/` (szum Perlina i fBm, gwiazdy, mgławice, planety z atmosferą, czarna dziura z soczewkowaniem, horyzonty z kraterami, chmury, panoramy miast, góry, woda). Na Ziemi tło zależy od pory dnia i pogody.

- Obraz liczy się raz w Web Workerze (`OffscreenCanvas`) i trafia do pamięci podręcznej (6 ostatnich obrazów); bez workera liczy się w połowie rozdzielczości w głównym wątku. Do czasu policzenia widać gradient w kolorach widoku, potem obraz pojawia się płynnie.
- Kilka widoków ma lekką animację na osobnej warstwie (≤ 30 kl./s): rój Dysona, pulsar, czarna dziura, dżet M87, zorza w Reykjavíku (tylko nocą). Animacja staje, gdy Biuro jest niewidoczne, a w *Ustawienia → Jakość grafiki → Oszczędna* nie działa wcale.
- Każdy przepis eksportuje klucz światła (kolor, kierunek, jasność otoczenia), z którego korzystają dioramy (sekcja *Dioramy*): bryły, cienie i okna biorą barwę i kierunek światła z tła.

**Galeria** (tylko w trybie deweloperskim, link w *Firma → Ustawienia*): `tools/gallery.html` pokazuje wszystkie widoki z czasem liczenia (mediana z 3 prób, na czerwono powyżej 125 ms), z wyborem pory dnia i pogody dla Ziemi. `?stage=earth|space|galaxy|universe` zawęża do jednego etapu. `?size=SZERxWYS` liczy kadry w rozmiarze telefonu, np. `704x640` (iPhone SE), `658x911` (iPhone 16 Pro Max po limicie pikseli) albo `529x1133` (tryb zen) — tak widać kompozycję i czasy przy prawdziwych proporcjach. Do pracy nad tłami uruchamiaj `node tools/serve.mjs 8090` — ten serwer wyłącza pamięć podręczną przeglądarki, więc po każdej zmianie widać świeży kod.

## 🏝️ Dioramy

Na scenie Biura stoi **diorama firmy**: wyspa albo platforma w rzucie izometrycznym 2:1, narysowana w SVG nad tłem Canvas (`js/diorama/`). Bryły mają trzy tony (jasna góra, średni bok od strony światła, ciemny drugi bok) z klucza światła widoku, miękki cień pada na własną wyspę, a okna świecą nocą. Grafika jest jednym zestawem kształtów, bez plików graficznych.

**Jak diorama rośnie**
- **Dział to budynek (moduł, pokład, krąg) z emblematem** w kolorze działu. Pierwszy dział to rdzeń, który zmienia formę z liczbą działów: garaż, biuro, wieżowiec, kampus na Ziemi; kapsuła, węzeł, stacja w kosmosie; prom, potem statek-matka w galaktyce; iskra, iglica, cytadela we wszechświecie. Każdy następny dział ma stałą działkę, wyznaczoną jego miejscem na liście działów, więc odblokowanie dowolnego działu niczego nie przesuwa; nowy budynek wyrasta jednorazową animacją. Ziemia ma rdzeń i 12 budynków, pozostałe etapy rdzeń i 8 modułów, pokładów albo kręgów.
- **Obsada to progi `SEATS`** (1 / 5 / 15 / 40 / 100 osób). Pokazuje ją gęstość świateł w oknach (nocą), ludzi i pojazdów, a nie liczba biurek; dokładne liczby zostają w zakładce Zespół. Na Ziemi to ludzie przy budynkach, auta i drony, w kosmosie astronauci w kombinezonach i łaziki, w galaktyce załoga pokładów i promy, a we wszechświecie świetliste drobiny zamiast ludzi.
- **Rundy to ozdoby** (liczone jako `min(prestigeCount, 8)`, kolejne pojawiają się od rundy 1, 2, 3, 5 i 8): na Ziemi panele słoneczne, neon z nazwą firmy, lądowisko, antena i rakieta; w kosmosie rakiety, skrzydła paneli i pierścień; w galaktyce pierścień, radiolatarnie, eskorta, gondole i drony; we wszechświecie kolejne halo, kule, odłamki i drugi portal. Rundy nie powiększają wyspy.
- **Wyspy i platformy według widoku:** 18 miast i sześć światów z powierzchnią (Księżyc, Merkury, Ceres, Europa, Mars, Tytan) to latające wyspy o fakturze trawy, regolitu, skały, lodu, rdzy albo wydm; stacja na orbicie i punkt L2 to metalowa platforma; Wenus to aerostat z pokładem; układy i gromady galaktyki to dok kosmiczny; węzły kosmicznej sieci we wszechświecie to odłamek kryształu. Pory roku, pogoda i święta (choinka, lampki, dynie) działają jak dawniej.

**Reguła czytelności na iPhonie SE.** Punkt odniesienia to zainstalowana aplikacja z paskiem stanu 20 px: scena ma wtedy **341×273** px CSS, a pas dioramy zaczyna się 48 px od góry i kończy 6 px nad dolną krawędzią. Przy maksymalnej dioramie każdego etapu emblemat działu ma średnicę **≥ 16 px**, a działka szerokość **≥ 28 px**; emblematy nie nachodzą na siebie. Pilnuje tego test (każdy etap, każda liczba działów, rundy 0 i 8) i galeria dioram.

**Galeria dioram** (`tools/dioramas.html`, tryb deweloperski; link „Dioramy →” w nagłówku `tools/gallery.html`): każdy etap na sześciu poziomach rozwoju (1, 2, 4 i 7 działów, wszystkie działy, wszystkie w święta, zimą i nocą) w rozmiarze sceny iPhone'a SE, nad tłem Canvas, z granicami pasa. Podpis kafla pokazuje skalę, najmniejszy emblemat i działkę w px, liczbę elementów SVG i animacji oraz czas budowy; na czerwono wchodzi emblemat < 16 px, działka < 28 px, ponad 1200 elementów albo ponad 40 animacji. `?size=SZERxWYS` zmienia rozmiar sceny (domyślnie `341x273`), `?stage=earth|space|galaxy|universe` zawęża do jednego etapu; listy rozwijane wybierają widok, porę dnia, pogodę, porę roku i święto.

## 🔋 Wydajność

Ruchome elementy sceny (chmury, auta, część pracowników) są w osobnych warstwach SVG, więc budynek rysuje się tylko raz. Animacje sceny zatrzymują się, gdy nie patrzysz na Biuro, a logika gry chodzi z częstotliwością 20 Hz. Gra zostawiona otwarta mniej obciąża baterię.

Obraz tła liczy się w rozmiarze sceny (×2 dla ekranów Retina), ale najwyżej 0,6 Mpx — większe sceny (iPhone 16 Pro Max ok. 658×911, tryb zen ok. 529×1133) liczą się w mniejszej rozdzielczości o tych samych proporcjach i są skalowane w górę. Tło jest z natury miękkie, a czas liczenia nie rośnie z wielkością ekranu.

Pomiar teł (PC deweloperski, 18–19.10.2026, mediana z 5 prób po rozgrzewce): w Chromium przy kadrze 600×800 wszystkie 45 widoków mieści się w budżecie 125 ms (najdłużej Sagittarius A* 104 ms, Gromada w Herkulesie 87 ms, Mgławica Oriona 85 ms, Plejady 83 ms; miasta najwyżej 59 ms w dzień i 93 ms nocą). Przy rozmiarach z telefonów (Node, płótno testowe — wynik zawyżony o ok. 20–25%, bo kopiowanie pikseli idzie w JS): iPhone SE 704×640 — najdłużej Sagittarius A* ok. 139 ms, reszta ≤ 104 ms; iPhone 16 Pro Max (limit 0,6 Mpx) — Sagittarius A* ok. 155 ms, Herkules i Zurych nocą ok. 125 ms, reszta ≤ 102 ms. Po przeliczeniu na przeglądarkę Sagittarius A* jest na granicy budżetu (ok. 115–125 ms), pozostałe widoki poniżej. Tło liczy się w workerze, więc dłuższy czas oznacza tylko dłużej widoczny gradient, nie przycięcie gry. Pomiary w karcie w tle (ukryte okno) potrafią wyjść o 30–80% wyżej i nie nadają się do oceny. Kod teł (`js/art/`) ma ok. 120 kB, w tym 5 kB galerii. **Do sprawdzenia na iPhonie** (przez Wi-Fi: `node tools/serve.mjs 8090` na PC i adres PC w Safari): czas od otwarcia Biura do gotowego tła, płynność przewijania listy Produktów przy animowanym widoku Sagittarius A* oraz start zainstalowanej aplikacji w trybie samolotowym (czy worker tła ładuje się offline). Dla dioram dodatkowo: czytelność emblematów działów na SE (zainstalowana aplikacja, maksymalna diorama każdego etapu), płynność przewijania listy przy dioramie z animacjami (ludzie, auta, drony, migające światła) oraz odwołanie między warstwami SVG `url(#d-mote)` w WebKit (drobiny obsady Wszechświata rysuje gradient zdefiniowany w warstwie statycznej, a użyty także w animowanej; sprawdzone tylko w Chromium).

Pomiar dioram (PC deweloperski, 21.10.2026, Chromium, okno 375×667 z `--safe-top: 20px`, scena 342×275 px, maksymalna diorama każdego etapu: wszystkie działy, 100 osób w każdym, 8 rund; budżet `Scene.render` ≤ 12 ms, ≈ 50 ms przy 4× wolniejszym procesorze). Mediana z 5 przerysowań (`render(game, true)`) tuż po przełączeniu etapu: Ziemia 9,9 ms, Kosmos 6,6 ms, Galaktyka 6,7 ms, Wszechświat 5,0 ms; po rozgrzewce (mediana z 8 serii) 9,0 / 6,2 / 6,5 / 4,6 ms. W ukrytym oknie podglądu ten sam pomiar dał dla Ziemi 12,6 ms w pierwszej serii i 8,1 ms po rozgrzewce — pomiary w ukrytym oknie są niewiarygodne, więc liczy się pomiar w widocznym oknie. Poniżej galeria dioram przy rozmiarze SE 341×273 (maksymalna diorama, dzień, lato; budowa to `buildDiorama` w Node, mediana z 9 serii po 50 budów; w święta, zimą i nocą elementów jest o 5–31 więcej, animacji o 0–4 więcej):

| Etap | skala | emblemat min | działka min | elementy SVG | animacje | budowa |
|---|---|---|---|---|---|---|
| Ziemia | 0,75 | 18,1 px | 30,1 px | 737 | 34 | 2,1 ms |
| Kosmos | 0,75 | 18,0 px | 30,1 px | 592 | 22 | 1,4 ms |
| Galaktyka | 0,86 | 20,7 px | 34,6 px | 532 | 40 | 1,3 ms |
| Wszechświat | 0,78 | 18,6 px | 31,0 px | 417 | 30 | 1,0 ms |

Elementy i animacje mieszczą się w budżetach (≤ 1200 i ≤ 40) we wszystkich 24 kaflach galerii, żaden nie jest na czerwono; rozmycia (≤ 8) pilnuje test. **Rozmiar kodu** (JS i CSS w `js/` i `css/` bez galerii, bajty z gita): przed oprawą 751 316 B, po części 1 858 109 B, po części 2 929 953 B. Część 2 to +71 844 B, cała oprawa +178 637 B przy limicie +200 kB (limit podniesiony ze 150 kB 20.10.2026, decyzja Piotra), więc na część 3 zostaje ok. 21 kB.

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
js/scene.js           koordynator sceny: podpis stanu, warstwy SVG, kadr dioramy, niebo, pogoda i święta
js/diorama/           dioramy firmy (SVG): iso.js (rzut 2:1, tony, okna), parts.js (bryły z listy Part, emblemat, obsada, pojazdy),
                      island.js (wyspy i platformy), frame.js (kadr i progi czytelności SE), layout.js (działki), index.js (model, budowa),
                      earth.js, space.js, galaxy.js, universe.js (oprawa etapów), skyline.js (budowle miast na horyzoncie), gallery.js (galeria)
js/art/               tła na Canvas: szum i płótna, klocki (kit/), 45 przepisów widoków (views/), zarządca tła i worker
tools/gallery.html    galeria wszystkich teł z czasem liczenia (tryb deweloperski)
tools/dioramas.html   galeria dioram na sześciu poziomach rozwoju z pomiarem czytelności i budżetów (tryb deweloperski)
tools/serve.mjs       serwer deweloperski bez pamięci podręcznej
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
node tools/simulate.mjs human 14             # człowiek: 5 sesji po 20 min dziennie, raport tempa i czekania
SESS_PER_DAY=3 SESS_MIN=15 node tools/simulate.mjs human 16   # gracz okazjonalny
LOAD_STATE=st-10.json node tools/simulate.mjs human 0 --chal  # wyzwania w sesjach człowieka (offline się liczy)
TRANSCEND=1 SAVE_STATE=st.json SAVE_TIMES=7 node tools/simulate.mjs casual 7   # dwa przejścia gry
LOAD_STATE=st-7.json node tools/simulate.mjs casual 0 --chal=galaxy           # wyzwania od tego stanu
node tools/ladder.mjs earth                  # drabinka produktów Ziemi
```

Po zmianie plików gry podbij `CACHE` w `sw.js`, żeby zainstalowana aplikacja pobrała nową wersję.

**Tryb deweloperski** (*Firma → Ustawienia*, na dole): mnożnik przychodu ×10/×100/×1000 działający już po nasyceniu rynku (szczyty zarobków, od których liczą się ceny lobbingu i hamulca, mierzą grę bez mnożnika) oraz przewijanie czasu o 10 min / 1 h / 8 h, które gra liczy jak prawdziwą przerwę (limit i wydajność offline, kontrakty). Gdy tryb jest włączony, w nagłówku widać czerwone „DEV ×N”. Przewinięcie przesuwa zegar gry na stałe w tym zapisie. Przed wydaniem w sklepach ustaw `DEV_TOOLS = false` w `js/main.js`.

### Kontrakt oprawy etapu (`StageArt`)

Każdy etap eksportuje z `js/diorama/{earth,space,galaxy,universe}.js` oprawę, którą `buildDiorama` (`js/diorama/index.js`) składa w dwie warstwy SVG (statyczną i animowaną). Model to `{ stage, view, depts: [{ id, icon, color, tier, isNew }], firstHeads, rounds, company, env, light }`.

```
StageArt = {
  id, palette, suit?,                  // palette: wall, wall2, glass, roof, metal, dark, crystal, green, ground
  coreFoot(n, rounds),                 // obrys rdzenia { w, d, h } w kafelkach i poziomach
  coreForm?(n),                        // nazwa formy rdzenia; woła ją tylko oprawa i testy, nie buildDiorama
  core(model, lay) → { parts, ornaments, people?, lights? },
  depts: { [deptId]: Part[] },         // archetyp każdego działu poza pierwszym (rdzeń to pierwszy dział)
  extras?(model, lay, marks) → { svg?, back?, anim?, decor?, vehicles?, people?, box? },   // każde pole opcjonalne
  spot?(r, j, k) → [gx, gy] | [gx, gy, gz],
  figure?(x, y, rnd, s, delay, suit),
  maxAnim?,                            // niższy limit animacji, przycinany do MAX_ANIM = 40
}
```

- `core`: `lay` to układ `{ size, core, lots }`; `ornaments` to ozdoby rund (idą do statystyk), `people` zastępuje obsadę z `CREW` w rdzeniu (garaż), a `lights` to łamane `[[u, v, z], …]` względem obrysu rdzenia, wzdłuż których w grudniu wiszą lampki (domyślnie przednia krawędź dachu).
- `extras`: `back` leży pod budynkami, `svg` nad nimi, `anim` trafia do warstwy animowanej przed postaciami (w ramach budżetu), `decor`, `vehicles` i `people` liczą się w statystykach, `box` powiększa kadr; `marks` to koła emblematów `{ id, x, y, r }`; dziś korzysta z nich tylko Ziemia (jej drony je omijają). `lay.lots` zawiera też działki działów jeszcze zamkniętych, więc filtruj po `model.depts`.
- `spot`: miejsce j-tej z k postaci na działce r; dwie liczby oznaczają wysokość działki (`r.gz`), trzy — gz bezwzględne. Domyślnie postacie stoją na ścieżce przed przednimi ścianami. `figure` zastępuje postać (drobiny Wszechświata), `suit` to barwa kombinezonu (astronauci, załoga).
- Kolejność rysowania: działki rosnąco po `gz` (najpierw niżej), w obrębie jednego poziomu od tyłu ku przodowi.

**Słownik `Part`** (x, y w kafelkach, z w poziomach, od rogu obrysu działki; `mat` to `wall`, `wall2`, `glass`, `roof`, `metal`, `dark`, `crystal`, `green` albo `accent`, czyli barwa działu):

```
['box',  x, y, z, w, d, h, mat, flags?]   ['pyr', x, y, z, w, d, h, mat, flags?]   ['gable', x, y, z, w, d, h, mat, 'x'|'y']
['cyl',  x, y, z, r, h, mat, flags?]      ['dome', x, y, z, r, mat, flags?]
['ring', x, y, z, r, mat, 'flat'|'upright', { u, v }?]   ['strut', x, y, z, x2, y2, z2, mat, grubość?]
['dish', x, y, z, r]   ['panel', x, y, z, w, d]   ['mast', x, y, z, h]   ['glow', x, y, z, r, mat]
['label', x, y, z, w, max, tekst?, barwa?]   ['sign', x, y, z]   ['shadow', x, y, z, r, h] | ['shadow', x, y, z, w, h, d]
```

- Środek (x, y) mają `cyl`, `dome`, `ring`, `dish`, `glow`, `mast` i okrągły `shadow`; róg `box`, `pyr`, `gable`, `panel` i prostokątny `shadow`; punkt `label`, `sign` i początek `strut`. `sign` to kotwica emblematu, dokładnie jeden na archetyp.
- Flagi to słowa oddzielone spacją: `win` (okna na widocznych ścianach, `box` i `cyl`), `ledge` (gzyms, `box`), `flush` (detal na ścianie albo zawieszony kształt bez własnego cienia; dla `box` cieńszego niż 0,05 rysuje się tylko widoczna ściana, a przy `cyl` i `dome` oznacza pas albo kulę bez cienia). `pyr` z flagą `x` leży bokiem (np. `'x flush'` to dziób statku).
- `ring`: `flat` leży na gruncie (krąg, halo), `upright` stoi w płaszczyźnie x–z (portal). Opcje `{ u: -1, v }` kładą stojący pierścień w płaszczyźnie y–z (obręcz wokół kadłuba wzdłuż x), a `v` to jego pionowa półoś w jednostkach rysunku.
- `shadow` rysuje sam cień bryły o wysokości h na poziomie z: okrągły (promień r) albo prostokątny od rogu (kolejność w, h, d, inna niż w `box`). `glow` z r < 0,06 to dioda bez gradientu. `label`: tekst to domyślnie nazwa firmy (skracana w punktach kodowych do `max` i escapowana), barwa to ramka i napis neonu.
- Części rysują się w kolejności listy, więc podawaj je od tyłu. Działka z `gz > 0` (pokłady statku na kadłubie) ma wysokość bezwzględną, a części samej działki mają `z` względem jej poziomu.
- Skróty części (`B` = `box`, `C` = `cyl`, `S` = `sign` nad działką, `L` = `strut`, `F` = `'flush'`, `when(on, parts)`), domyślne `spot` i promień emblematu `ER` eksportuje `js/diorama/parts.js`; oprawy etapów ich nie kopiują.
