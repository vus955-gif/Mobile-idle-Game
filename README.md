# 🏙️ Krzemowe Imperium

Relaksująca gra **idle/clicker** z warstwą ekonomiczną: zaczynasz w garażu z laptopem, a kończysz jako kosmiczny konglomerat technologiczny. Grafika 2D (SVG + CSS), bez 3D, zrobiona z myślą o iPhonie.

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
| **Ulepszenia** (~200) | Ulepszenia produktów, działów, kodowania i kultury firmy (pizza w piątki, firmowy pies, teleport do biura…). |
| **Kontrakty** | Zlecenia B2B od klientów — przyjmujesz, czekasz, dostajesz sowitą zapłatę (także offline). |
| **Przejęcia** (14) | Kupujesz inne startupy za potężne bonusy. |
| **Rundy finansowania** | Prestiż: zaczynasz od nowa, ale z kapitałem inwestorów, który trwale mnoży przychód. Za udziały kupujesz ulepszenia **rady nadzorczej**. |
| **Wydarzenia** | Łap pływające bąbelki: 🔥 Viral (×7 przychodu), 💰 Anioł biznesu, ⚡ Hackathon (×15 kodowania), 💡 Eureka. Do tego trendy rynkowe i pasek wiadomości. |
| **Osiągnięcia** (182) | Każde daje +1% przychodu. Kilka jest ukrytych. |

Scena biura pokazuje porę dnia zgodną z zegarem telefonu — w nocy w oknach palą się światła, a nad miastem świecą gwiazdy.

## ⚖️ Balans

Tempo gry jest dostrojone symulacją (`tools/simulate.mjs`), w której bot gra według zachłannej strategii:

- **gra aktywna**: sklep internetowy ~7 min, aplikacja mobilna ~14 min, pierwsza runda finansowania ~1 h,
- **gra „z doskoku”** (20 min co ~3 h, noc offline): ery 1–4 w pierwszy dzień, neurotechnologia ~3. dnia, pełne drzewko technologii po 2–3 tygodniach.

## 🛠️ Rozwój

Czysty JavaScript (moduły ES), bez bundlera i zależności.

```
index.html            szkielet aplikacji
css/style.css         wygląd
js/data.js            cała zawartość: produkty, działy, technologie, ulepszenia…
js/engine.js          logika gry (bez DOM) — używana też przez testy i symulator
js/ui.js              interfejs, zakładki, modale
js/scene.js           ilustracja budynku w SVG
js/audio.js           dźwięki syntezowane w WebAudio
js/main.js            start, zapis, pętla gry
sw.js                 service worker (tryb offline)
tools/simulate.mjs    symulator balansu
tools/make-icons.mjs  generator ikon PNG z icons/icon.svg
tests/                testy silnika (node:test)
```

```bash
npm start            # serwer lokalny: http://localhost:8080
npm test             # testy silnika
npm run sim          # symulacja 21 dni gry „z doskoku”
npm run sim:active   # symulacja ~5 h gry aktywnej
```

Po zmianie plików gry podbij `CACHE` w `sw.js`, żeby zainstalowana aplikacja pobrała nową wersję.
