# 🏙️ Krzemowe Imperium · Silicon Empire

Relaksująca gra **idle/clicker** z warstwą ekonomiczną: zaczynasz w garażu z laptopem, a kończysz jako kosmiczny konglomerat technologiczny. Grafika 2D (SVG + CSS), bez 3D, zrobiona z myślą o iPhonie.

Gra jest **po polsku i po angielsku**: język dobiera się sam według ustawień telefonu, a zmienisz go na ekranie powitalnym albo w *Firma → Ustawienia*.

> **EN:** A relaxing idle/clicker about growing a tech company from a garage into a space-age conglomerate. 2D art, no 3D, built for iPhone as a PWA (no App Store needed). Fully playable in English and Polish; the language follows your phone and can be switched in *Company → Settings*.

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
| **Koduj** | Stukaj w fioletowy przycisk — każde kliknięcie to pieniądze. |
| **Produkty** (20) | Od strony wizytówki po superinteligencję. Zarabiają same, także gdy gra jest zamknięta. Co 25/50/100… poziomów kamień milowy podwaja przychód. |
| **Zespół** (13 działów) | Każdy dział to nowe piętro budynku i własny efekt: programiści, R&D, design, marketing, sprzedaż, obsługa klienta, HR, DevOps, finanse, data science, prawnicy, cyberbezpieczeństwo, zarząd. |
| **Badania** (46 technologii w 8 erach + badania bez końca) | Od HTML i CSS przez chmurę, AI i komputery kwantowe po rój Dysona. Odblokowują produkty i działy. **Zostają po rundzie finansowania.** |
| **Ulepszenia** (~375) | Ulepszenia produktów, działów, kodowania i kultury firmy (pizza w piątki, firmowy pies, teleport do biura…). |
| **Kontrakty** | Zlecenia B2B od klientów — przyjmujesz, czekasz, dostajesz sowitą zapłatę (także offline). |
| **Przejęcia** (14) | Kupujesz inne startupy za potężne bonusy. |
| **Rundy finansowania** | Prestiż: zaczynasz od nowa, ale z kapitałem inwestorów, który trwale mnoży przychód. Za udziały kupujesz ulepszenia **rady nadzorczej**. |
| **Wycena firmy** | Majątek (gotówka + wartość tego, w co zainwestowałeś) + roczny przychód × mnożnik rynkowy. Godzina gry to mniej więcej rok życia firmy, a mnożnik (×3–×15) rośnie z technologiami i rundami. Garaż zarabiający $6/s jest wart ok. $65 tys. |
| **Wydarzenia** | Łap pływające bąbelki: 🔥 Viral (×7 przychodu), 💰 Anioł biznesu, ⚡ Hackathon (×15 kodowania), 💡 Eureka. Do tego trendy rynkowe i pasek wiadomości. |
| **Autopilot** | Moduły kupowane raz za udziały: same rozwijają produkty, kupują ulepszenia, zatrudniają, biorą kontrakty, odkrywają technologie i łapią bąbelki. Po powrocie od razu inwestują zarobki offline. |
| **Wyzwania inwestorów** (6 × 5 poziomów) | Rundy z jednym ograniczeniem (bez kodowania, maks. 5 produktów, tylko programiści, bez kapitału, bez ulepszeń, kryzys). Za każdy poziom trwała nagroda. |
| **Decyzje** | Co 15–30 minut gry na scenie pojawia się koperta z sytuacją i dwiema dobrymi opcjami: gotówka, badania, premie albo nagroda odroczona. |
| **Świat** (18 miast + 7 miejsc w kosmosie) | Biura na kropkowej mapie świata, od Warszawy po Proximę b. Zostają na zawsze, mają po 3 poziomy, a widok z okna zmienia panoramę za budynkiem (Pałac Kultury, Tokyo Tower, Golden Gate, Burj Khalifa, Księżyc, Mars…). |
| **Zarząd** (5 foteli) | Kandydaci od headhuntera z cechami i dziwactwami (np. pracują lepiej nocą, w weekendy albo gdy pada). Zostają na zawsze i z czasem nabierają doświadczenia. |
| **Giełda** (po IPO) | Kurs Twoich akcji, dziesięciu konkurentów (Gruszka Computers, Makrotwardy, Gogle…) i udziały, które wzmacniają Twoje produkty; 51% to przejęcie kontroli. |
| **Skala cywilizacji** | Roczny przychód porównany z największą firmą świata, PKB Polski, USA i Ziemi, a dalej ze skalą Kardaszowa (ludzkość ≈ 0,73). Do tego wykres przychodu i wyceny. |
| **Osiągnięcia** (287) | Każde daje +1% przychodu. Kilka jest ukrytych. |

Scena biura żyje według kalendarza telefonu: pora dnia, pory roku, pogoda zmieniająca się co 3 godziny (deszcz, śnieg, mgła), dynie na Halloween, choinka i lampki w grudniu, fajerwerki w Sylwestra. Tryb zen (🪷) chowa interfejs i zostawia samo biuro z zegarem. W ustawieniach można włączyć spokojną muzykę lo-fi, komponowaną na bieżąco w przeglądarce.

## ⚖️ Balans

Tempo gry jest dostrojone symulacją (`tools/simulate.mjs`), w której bot gra według zachłannej strategii:

- **gra aktywna**: sklep internetowy ~7 min, aplikacja mobilna ~14 min, pierwsza runda finansowania ~1 h,
- **gra „z doskoku”** (20 min co ~3 h, noc offline): ery 1–5 pierwszego dnia, era kwantowa ~1,5 dnia, neurotechnologia ~3. dnia, podbój kosmosu ~1 tydzień, pełne drzewko technologii i wszystkie biura ~12 dni. Zarząd dochodzi do pełnego doświadczenia po ok. 3 tygodniach, a badania bez końca i wyzwania zostają na dłużej.

Bot korzysta też z biur, giełdy, zarządu i decyzji. Symulator ma przełączniki (`--no=offices,market,board,decisions`), żeby sprawdzić wpływ każdego systemu, oraz `--chal`, który na koniec próbuje wszystkich wyzwań.

## 🔋 Wydajność

Ruchome elementy sceny (chmury, auta, część pracowników) są w osobnych warstwach SVG, więc budynek rysuje się tylko raz. Animacje sceny zatrzymują się, gdy nie patrzysz na Biuro, a logika gry chodzi z częstotliwością 20 Hz. Gra zostawiona otwarta mniej obciąża baterię.

## 🛠️ Rozwój

Czysty JavaScript (moduły ES), bez bundlera i zależności.

```
index.html            szkielet aplikacji
css/style.css         wygląd
js/data.js            cała zawartość (po polsku): produkty, działy, technologie, ulepszenia…
js/lang/en.js         ta sama zawartość po angielsku
js/i18n.js            teksty interfejsu PL/EN, wybór języka, odmiana liczebników
js/text.js            nazwy i opisy w bieżącym języku
js/engine.js          logika gry (bez DOM) — używana też przez testy i symulator
js/ui.js              interfejs, zakładki, modale
js/scene.js           ilustracja budynku w SVG (pory roku, pogoda, panoramy miast)
js/worldmap.js        kropkowa mapa świata (generowana z Natural Earth)
js/avatar.js          awatary członków zarządu
js/audio.js           dźwięki syntezowane w WebAudio
js/music.js           generatywna muzyka lo-fi
js/main.js            start, zapis, pętla gry
sw.js                 service worker (tryb offline)
tools/simulate.mjs    symulator balansu
tools/make-icons.mjs  generator ikon PNG z icons/icon.svg
tools/make-worldmap.mjs generator mapy świata (jednorazowo, wymaga world-atlas)
tests/                testy silnika (node:test)
```

```bash
npm start            # serwer lokalny: http://localhost:8080
npm test             # testy silnika, tłumaczeń i wyceny
npm run sim          # symulacja 21 dni gry „z doskoku”
npm run sim:active   # symulacja ~5 h gry aktywnej
node tools/simulate.mjs casual 14 --chal   # dwa tygodnie gry + próba wyzwań
```

Po zmianie plików gry podbij `CACHE` w `sw.js`, żeby zainstalowana aplikacja pobrała nową wersję.
