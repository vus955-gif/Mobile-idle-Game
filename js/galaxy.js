// Warstwa Galaktyka: firma, która wychodzi poza Układ Słoneczny. Otwiera się po wymaksowaniu
// Kosmosu (cywilizacja typu II), ma własne produkty, działy, drzewko (ery 11–13), ulepszenia
// i placówki w układach gwiezdnych. Pieniądze rosną od roju Dysona do cywilizacji typu III.
// Skala jest przesunięta względem Kosmosu o ok. 12,5 rzędu wielkości (tyle, ile Kosmos zarabia
// ponad Ziemię), więc tempo gry jest podobne, a treść — zupełnie inna.
// Plik nie dotyka DOM — importuje go gra, testy i symulator. Teksty angielskie są w lang/en.js.
import { reachSteps } from './data.js';

export const GALAXY_CATEGORIES = {
  voyage: { name: 'Podróże', grad: ['#7f7fd5', '#86a8e7'] },
  stars: { name: 'Gwiazdy', grad: ['#f857a6', '#ff5858'] },
  galactic: { name: 'Galaktyka', grad: ['#8e2de2', '#4a00e0'] },
};

// ---------------------------------------------------------------------------
// PRODUKTY — usługi międzygwiezdne. Pierwsze sondy kosztują tyle, ile Kosmos zarabia w kilka
// sekund; czas zwrotu rośnie ×2,2 jak w Kosmosie.
// ---------------------------------------------------------------------------
export const GALAXY_PRODUCTS = [
  { id: 'probes', name: 'Sondy międzygwiezdne', icon: '🛸', cat: 'voyage', cost: 3e26,
    desc: 'Lecą do najbliższych gwiazd i przysyłają pocztówki. Pierwsza dotrze za dwadzieścia lat.',
    ups: ['Sonda wielkości znaczka', 'Tarcza z grafenu', 'Kamera na całą podróż', 'Flota tysiąca sond', 'Przelot obok Proximy b', 'Sonda, która hamuje sama', 'Zdjęcie z innego układu'] },
  { id: 'sails', name: 'Poczta świetlna', icon: '⛵', cat: 'voyage', tech: 'lightsails', cost: 6e28,
    desc: 'Żagle pchane laserem dowożą przesyłki do gwiazd z prędkością jednej piątej światła.',
    ups: ['Pierwszy żagiel', 'Laser wielkości pustyni', 'Przesyłka priorytetowa', 'Żagiel z nanorurek', 'Hamowanie wiatrem gwiazdowym', 'Kurier do Syriusza', 'Dostawa wczoraj'] },
  { id: 'arks', name: 'Arki pokoleniowe', icon: '🚢', cat: 'voyage', tech: 'cryosleep', cost: 2e29,
    desc: 'Miasto na tysiąc lat podróży. Wysiądą dopiero wnuki pasażerów, ale widoki są tego warte.',
    ups: ['Kabiny hibernacyjne', 'Las na pokładzie', 'Szkoła na sto pokoleń', 'Ogród pod sztucznym słońcem', 'Biblioteka całej ludzkości', 'Wybory na pokładzie', 'Dom w drodze'] },
  { id: 'exoworlds', name: 'Egzoplanety pod klucz', icon: '🌎', cat: 'voyage', tech: 'exoTerraform', cost: 2e30,
    desc: 'Atmosfera, oceany i las w standardzie. Klucze odbierasz na orbicie.',
    ups: ['Pierwsza tlenowa planeta', 'Oceany z komet', 'Las w pakiecie', 'Dwa słońca na niebie', 'Pierścienie w gratisie', 'Planeta na zamówienie', 'Nowa Ziemia co tydzień'] },
  { id: 'antimatter', name: 'Fabryki antymaterii', icon: '⚛️', cat: 'stars', tech: 'antimatterTech', cost: 6e31,
    desc: 'Gram paliwa wystarcza na rok podróży. Magazyn trzeba trzymać w polu magnetycznym, a zapalniczki daleko.',
    ups: ['Pułapka magnetyczna', 'Akcelerator wokół gwiazdy', 'Tankowanie w locie', 'Magazyn na kilogram', 'Silnik anihilacyjny', 'Stacje paliw w całym ramieniu', 'Paliwo z niczego'] },
  { id: 'matrioshka', name: 'Mózgi matrioszki', icon: '🪆', cat: 'stars', tech: 'matrioshkaTech', cost: 2e33,
    desc: 'Komputer zbudowany z kolejnych powłok wokół gwiazdy. Każda zjada ciepło poprzedniej.',
    ups: ['Pierwsza powłoka', 'Chłodzenie na podczerwień', 'Siedem warstw', 'Myśl na skalę gwiazdy', 'Symulacja całej Ziemi', 'Sto gwiazd w jednej sieci', 'Myśl, która trwa milion lat'] },
  { id: 'blackholes', name: 'Elektrownie przy czarnych dziurach', icon: '🕳️', cat: 'stars', tech: 'blackHoleTaming', cost: 6e33,
    desc: 'Dysk akrecyjny daje więcej energii niż jakakolwiek gwiazda. Wystarczy nie podchodzić za blisko.',
    ups: ['Pierwszy dysk akrecyjny', 'Proces Penrose’a', 'Wrzutnia śmieci', 'Pierścień kolektorów', 'Dżety na pełnej mocy', 'Czarna dziura na smyczy', 'Czas płynie tu wolniej. Premie też.'] },
  { id: 'warp', name: 'Korytarze warp', icon: '🌀', cat: 'galactic', tech: 'warpDrive', cost: 2e35,
    desc: 'Przestrzeń kurczy się przed statkiem i rozciąga za nim. Bilet na drugi koniec galaktyki w cenie weekendu.',
    ups: ['Pierwszy bąbel warp', 'Rozkład lotów', 'Korytarz do Plejad', 'Ekspres przez jądro', 'Warp dla każdego', 'Autostrada spiralna', 'Galaktyka na wyciągnięcie ręki'] },
  { id: 'galaxynet', name: 'Internet galaktyczny', icon: '🌌', cat: 'galactic', tech: 'galacticNet', cost: 2e37,
    desc: 'Sto miliardów gwiazd w jednej sieci. Abonament płacą całe cywilizacje.',
    ups: ['Pierwszy węzeł', 'Przekaźnik w każdym układzie', 'Ping przez jądro', 'Wyszukiwarka gwiazd', 'Sieć dla obcych', 'Pełne pokrycie Drogi Mlecznej', 'Zasięg w Andromedzie'] },
];
export const GALAXY_PAYBACK0 = 100;
export const GALAXY_PAYBACK_GROWTH = 2.2;
const nice = (x) => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
GALAXY_PRODUCTS.forEach((p, i) => { p.rps = nice(p.cost / (GALAXY_PAYBACK0 * Math.pow(GALAXY_PAYBACK_GROWTH, i))); });

// ---------------------------------------------------------------------------
// DZIAŁY — pokłady statku-matki. Pierwsi są nawigatorzy, badania prowadzą astrofizycy.
// ---------------------------------------------------------------------------
export const GALAXY_DEPTS = [
  { id: 'navigators', name: 'Nawigatorzy gwiezdni', icon: '🧭', color: '#7dd3fc', unlock: 0, base: 3e25, g: 1.2,
    desc: 'Wyznaczają kurs między gwiazdami. Każdy nawigator podnosi przychody i siłę skoków.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickFlat', v: 8e24 }],
    ups: ['Mapa gwiazd w 3D', 'Planetarium na mostku', 'Atlas całej galaktyki'], upIcons: ['🗺️', '🌠', '📘'] },
  { id: 'astro', name: 'Astrofizycy', icon: '🔭', color: '#c084fc', unlock: 1.2e27, base: 5e26, g: 1.2,
    desc: 'Generują punkty badań galaktycznych. Bez nich nie polecisz dalej niż do sąsiedniej gwiazdy.',
    per: [{ t: 'rp', v: 0.3 }],
    ups: ['Interferometr na orbicie', 'Detektor fal grawitacyjnych', 'Teleskop wielkości układu'], upIcons: ['📡', '〰️', '🔭'] },
  { id: 'envoys', name: 'Dyplomaci pierwszego kontaktu', icon: '👽', color: '#f472b6', unlock: 1.5e28, base: 6e27, g: 1.2,
    desc: 'Mówią w czterystu językach, także w tych bez dźwięków. Podnoszą przychody i siłę skoków.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickMult', v: 0.05 }],
    ups: ['Uniwersalny tłumacz', 'Słownik gestów', 'Ambasada na statku'], upIcons: ['🗣️', '🤲', '🏛️'] },
  { id: 'shipai', name: 'Okrętowa SI', icon: '🤖', color: '#94a3b8', unlock: 6e28, base: 2.5e28, g: 1.2, tech: 'cryosleep',
    desc: 'Prowadzi statek, gdy załoga śpi. Każda kopia SI to automatyczne skoki.',
    per: [{ t: 'income', v: 0.003 }, { t: 'auto', v: 0.2 }],
    ups: ['Rdzeń kwantowy', 'Kopie zapasowe w każdej sondzie', 'SI z poczuciem humoru'], upIcons: ['🧠', '💾', '😏'] },
  { id: 'traders', name: 'Kupcy międzygwiezdni', icon: '💱', color: '#34d399', unlock: 2e29, base: 6e28, g: 1.2,
    desc: 'Otwierają zlecenia od cywilizacji i kolonii. Co 25 osób — kolejne miejsce na zlecenie.',
    per: [{ t: 'income', v: 0.003 }, { t: 'contract', v: 0.01, cap: 0.5 }, { t: 'slotEvery', v: 25 }],
    ups: ['Giełda w każdym porcie', 'Waluta oparta na energii', 'Kontrakty na tysiąc lat'], upIcons: ['🏦', '🔋', '📜'] },
  { id: 'geneticists', name: 'Genetycy', icon: '🧬', color: '#38bdf8', unlock: 2.5e30, base: 1e30, g: 1.2,
    desc: 'Długowieczna załoga pracuje także wtedy, gdy Ciebie nie ma. Więcej zarobku offline.',
    per: [{ t: 'income', v: 0.005 }, { t: 'offlineEff', v: 0.004, cap: 0.45 }],
    ups: ['Naprawa telomerów', 'Odporność na promieniowanie', 'Życie na trzysta lat'], upIcons: ['🧪', '🛡️', '⏳'] },
  { id: 'senate', name: 'Senat galaktyczny', icon: '🏛️', color: '#d6b98c', unlock: 5e31, base: 1.5e31, g: 1.2,
    desc: 'Kto ma prawo do gwiazdy? Twoi senatorowie mają w tej sprawie większość. Otwiera przejęcia.',
    per: [{ t: 'income', v: 0.003 }, { t: 'acqCost', v: 0.008, cap: 0.5 }],
    ups: ['Kodeks drogi mlecznej', 'Trybunał międzygwiezdny', 'Konstytucja ramienia Oriona'], upIcons: ['📕', '⚖️', '🌀'] },
  { id: 'gravitons', name: 'Grawitolodzy', icon: '🕳️', color: '#fbbf24', unlock: 1.2e33, base: 3e32, g: 1.2, tech: 'blackHoleTaming',
    desc: 'Tańsze produkty i premia dla gwiazd. Ciężkie rzeczy przesuwają lekką ręką.',
    per: [{ t: 'prodCost', v: 0.005, cap: 0.5 }, { t: 'cat', cat: 'stars', v: 0.01, cap: 3 }],
    ups: ['Soczewka grawitacyjna', 'Hamowanie przy horyzoncie', 'Tunel przez czasoprzestrzeń'], upIcons: ['🔍', '🛑', '🕳️'] },
  { id: 'xeno', name: 'Ksenobiolodzy', icon: '🌱', color: '#86efac', unlock: 3e33, base: 1e33, g: 1.2, tech: 'seeding',
    desc: 'Budzą życie na martwych planetach. Więcej sond przy każdej kolejnej wyprawie.',
    per: [{ t: 'income', v: 0.003 }, { t: 'prestige', v: 0.01, cap: 2 }],
    ups: ['Bank nasion życia', 'Ewolucja w przyspieszeniu', 'Pierwsza obca rozmowa'], upIcons: ['🫘', '🦠', '💬'] },
];

// ---------------------------------------------------------------------------
// TECHNOLOGIE — trzy ery galaktyczne. Koszty rosną ×2,4 na technologię (2000 × 2,4^i), jak
// w Kosmosie. Sondy von Neumanna otwierają gromady gwiazd (Kardaszow 2,5), sieć galaktyczna —
// cywilizację typu III.
// ---------------------------------------------------------------------------
export const GALAXY_ERAS = [
  { id: 11, name: 'Najbliższe gwiazdy', icon: '✨' },
  { id: 12, name: 'Ramię Oriona', icon: '🌀' },
  { id: 13, name: 'Droga Mleczna', icon: '🌌' },
];

export const GALAXY_TECHS = [
  // Era 11: najbliższe gwiazdy
  { id: 'laserArrays', era: 11, name: 'Macierze laserowe', icon: '🔦', cost: 2000, req: [], fx: [{ t: 'prod', id: 'probes', x: 2 }, { t: 'click', x: 2 }],
    desc: 'Laser wielkości kontynentu rozpędza sondę do jednej piątej prędkości światła.' },
  { id: 'lightsails', era: 11, name: 'Żagle świetlne', icon: '⛵', cost: 4800, req: ['laserArrays'], fx: [{ t: 'unlockProduct', id: 'sails' }],
    desc: 'Żagiel cieńszy od bańki mydlanej. Pchnięty światłem nie potrzebuje paliwa.' },
  { id: 'cryosleep', era: 11, name: 'Hibernacja', icon: '🧊', cost: 12000, req: ['laserArrays'], fx: [{ t: 'unlockProduct', id: 'arks' }, { t: 'unlockDept', id: 'shipai' }],
    desc: 'Zasypiasz przy Słońcu, budzisz się przy Tau Ceti. Śniadanie chłodne.' },
  { id: 'quantumComm', era: 11, name: 'Splątana łączność', icon: '🔗', cost: 28000, req: ['lightsails'], fx: [{ t: 'prod', id: 'sails', x: 3 }, { t: 'rp', x: 1.5 }],
    desc: 'Pary splątanych cząstek trzymają flotę w kontakcie. Sygnał wciąż leci wolno, ale klucze już się zgadzają.' },
  { id: 'exoTerraform', era: 11, name: 'Terraformowanie egzoplanet', icon: '🌎', cost: 66000, req: ['cryosleep'], fx: [{ t: 'unlockProduct', id: 'exoworlds' }],
    desc: 'Po Marsie i Wenus to już rutyna. Każda planeta dostaje atmosferę na wymiar.' },
  { id: 'vonNeumann', era: 11, name: 'Sondy von Neumanna', icon: '🛸', cost: 1.6e5, req: ['quantumComm', 'exoTerraform'], fx: [{ t: 'cat', cat: 'voyage', x: 2 }, { t: 'rp', x: 2 }],
    desc: 'Sonda dolatuje do gwiazdy, buduje dwie kopie i leci dalej. Po kilku pokoleniach jest ich miliony.' },
  { id: 'stellarHighway', era: 11, name: 'Autostrada gwiezdna', icon: '🛤️', cost: 3.8e5, req: ['vonNeumann'], fx: [{ t: 'prodCost', x: 0.9 }, { t: 'all', x: 1.25 }],
    desc: 'Sieć laserów i stacji tankowania między najbliższymi gwiazdami. Z korkami w okolicach Syriusza.' },
  // Era 12: ramię Oriona
  { id: 'antimatterTech', era: 12, name: 'Produkcja antymaterii', icon: '⚛️', cost: 9.2e5, req: ['stellarHighway'], fx: [{ t: 'unlockProduct', id: 'antimatter' }],
    desc: 'Akceleratory wielkości orbit planet produkują paliwo, przy którym hel-3 to węgiel drzewny.' },
  { id: 'starLifting', era: 12, name: 'Podnoszenie gwiazd', icon: '🌟', cost: 2.2e6, req: ['antimatterTech'], fx: [{ t: 'hireCost', x: 0.85 }, { t: 'prod', id: 'antimatter', x: 2 }],
    desc: 'Zbieranie materii prosto z gwiazdy. Przy okazji przedłuża jej życie o kilka miliardów lat.' },
  { id: 'starForge', era: 12, name: 'Kuźnie gwiazd', icon: '🔥', cost: 5.3e6, req: ['starLifting'], fx: [{ t: 'all', x: 1.5 }, { t: 'cat', cat: 'stars', x: 2 }],
    desc: 'Nowe gwiazdy zapalane na zamówienie z obłoków gazu. Wybierasz kolor i rozmiar.' },
  { id: 'matrioshkaTech', era: 12, name: 'Powłoki matrioszki', icon: '🪆', cost: 1.3e7, req: ['starLifting'], fx: [{ t: 'unlockProduct', id: 'matrioshka' }],
    desc: 'Rój Dysona w kilku warstwach. Każda liczy na cieple, którego nie wykorzystała poprzednia.' },
  { id: 'blackHoleTaming', era: 12, name: 'Okiełznane czarne dziury', icon: '🕳️', cost: 3e7, req: ['starForge'], fx: [{ t: 'unlockProduct', id: 'blackholes' }, { t: 'unlockDept', id: 'gravitons' }],
    desc: 'Wrzucasz śmieci, odbierasz energię. Najlepszy recykling we wszechświecie.' },
  { id: 'seeding', era: 12, name: 'Rozsiew życia', icon: '🌱', cost: 7.3e7, req: ['matrioshkaTech'], fx: [{ t: 'cat', cat: 'stars', x: 2 }, { t: 'unlockDept', id: 'xeno' }],
    desc: 'Mikroby, nasiona i trochę cierpliwości. Za milion lat ktoś tu podziękuje.' },
  { id: 'tachyonComms', era: 12, name: 'Telefon tachionowy', icon: '📡', cost: 1.8e8, req: ['starForge', 'matrioshkaTech'], fx: [{ t: 'click', x: 3 }, { t: 'auto', v: 5 }],
    desc: 'Odpowiedź przychodzi, zanim zadasz pytanie. Fizycy wciąż o tym dyskutują.' },
  // Era 13: Droga Mleczna
  { id: 'warpDrive', era: 13, name: 'Napęd warp', icon: '🌀', cost: 4.2e8, req: ['tachyonComms'], fx: [{ t: 'unlockProduct', id: 'warp' }],
    desc: 'Statek stoi w miejscu, to przestrzeń się przesuwa. Prędkość światła nie ma nic do powiedzenia.' },
  { id: 'coreMining', era: 13, name: 'Kopalnie w jądrze galaktyki', icon: '⛏️', cost: 1e9, req: ['blackHoleTaming', 'warpDrive'], fx: [{ t: 'prodCost', x: 0.85 }, { t: 'cat', cat: 'galactic', x: 2 }],
    desc: 'W centrum galaktyki gwiazdy stoją tak gęsto, że w nocy można czytać.' },
  { id: 'uplift', era: 13, name: 'Wspomaganie cywilizacji', icon: '👽', cost: 2.4e9, req: ['seeding', 'warpDrive'], fx: [{ t: 'all', x: 1.5 }, { t: 'rp', x: 1.5 }],
    desc: 'Młode cywilizacje dostają podręczniki i bezpłatny staż. Za kilka tysięcy lat będą klientami.' },
  { id: 'hypervelocity', era: 13, name: 'Gwiazdy na kursie', icon: '🌠', cost: 5.8e9, req: ['coreMining'], fx: [{ t: 'cat', cat: 'galactic', x: 2 }, { t: 'all', x: 1.25 }],
    desc: 'Gwiazdy wystrzelone z jądra z prędkością tysięcy kilometrów na sekundę. Tam, gdzie są potrzebne.' },
  { id: 'galacticNet', era: 13, name: 'Sieć galaktyczna', icon: '🕸️', cost: 1.4e10, req: ['hypervelocity'], fx: [{ t: 'unlockProduct', id: 'galaxynet' }, { t: 'all', x: 2 }],
    desc: 'Energia i informacja całej Drogi Mlecznej w jednej sieci. Cywilizacja typu III.' },
  { id: 'sgrPower', era: 13, name: 'Elektrownia Sagittarius A*', icon: '🌑', cost: 3.3e10, req: ['galacticNet'], fx: [{ t: 'all', x: 2 }],
    desc: 'Cztery miliony mas Słońca w samym środku galaktyki. Najlepiej położona elektrownia w okolicy.' },
  { id: 'galacticMind', era: 13, name: 'Umysł galaktyki', icon: '🧠', cost: 8e10, req: ['galacticNet', 'uplift'], fx: [{ t: 'rp', x: 2 }, { t: 'all', x: 1.5 }],
    desc: 'Sto miliardów gwiazd myśli razem. Pierwsze pytanie: co jest za Andromedą?' },
];

export const GALAXY_REPEAT = [
  { id: 'rg_nav', name: 'Mapy prądów gwiezdnych', icon: '🗺️', base: 500, g: 3.2, req: ['quantumComm'], fx: [{ t: 'all', x: 1.1 }],
    desc: '+10% przychodu za każdy poziom.' },
  { id: 'rg_click', name: 'Krótsze skoki', icon: '⏩', base: 300, g: 3, req: ['laserArrays'], fx: [{ t: 'click', x: 1.25 }],
    desc: '+25% siły skoków za każdy poziom.' },
  { id: 'rg_science', name: 'Obserwatoria w pustce', icon: '🔭', base: 2000, g: 3.5, req: ['vonNeumann'], fx: [{ t: 'rp', x: 1.15 }],
    desc: '+15% punktów badań za każdy poziom.' },
  { id: 'rg_ops', name: 'Rekrutacja przez hibernację', icon: '🛌', base: 5e4, g: 4, req: ['starLifting'], fx: [{ t: 'hireCost', x: 0.95 }],
    desc: 'Rekrutacja tańsza o 5% za każdy poziom.' },
];

// ---------------------------------------------------------------------------
// ULEPSZENIA ZA GOTÓWKĘ: życie na statku-matce i siła skoków
// ---------------------------------------------------------------------------
export const GALAXY_CULTURE = [
  { id: 'g_tea', name: 'Herbata z mgławicy', icon: '🍵', cost: 1e28, x: 1.1, desc: 'Parzona na wodzie z komety. Lekko pachnie cyjanem.' },
  { id: 'g_window', name: 'Okno na Drogę Mleczną', icon: '🪟', cost: 1.5e29, x: 1.15, desc: 'Spirala galaktyki od spodu. Tapeta, której nikt nie zmienia.' },
  { id: 'g_forest', name: 'Las na pokładzie', icon: '🌲', cost: 2.5e30, x: 1.15, desc: 'Kilometr kwadratowy sosen. Grzyby rosną niezależnie od gwiazdy.' },
  { id: 'g_holo', name: 'Holodek', icon: '🎭', cost: 4e31, x: 1.2, desc: 'Piątkowe wyjścia na plażę w Sopocie, sto lat świetlnych od Sopotu.' },
  { id: 'g_dinner', name: 'Kolacja przy dwóch słońcach', icon: '🍽️', cost: 6e32, x: 1.2, desc: 'Zachód słońca trwa dwa razy dłużej. Desery też.' },
  { id: 'g_orchestra', name: 'Orkiestra sfer', icon: '🎻', cost: 1e34, x: 1.3, desc: 'Muzyka grana na drganiach gwiazd. Najlepiej brzmi przy pulsarze.' },
  { id: 'g_sabbatical', name: 'Urlop w hibernacji', icon: '🛌', cost: 1.5e35, x: 1.4, desc: 'Sto lat wolnego. Skrzynka mailowa czeka.' },
  { id: 'g_aurora', name: 'Zorza z wiatru pulsara', icon: '🌈', cost: 2.5e36, x: 1.5, desc: 'Mgławica Kraba świeci tylko dla Ciebie. Prawie.' },
  { id: 'g_core', name: 'Biuro z widokiem na jądro', icon: '🌕', cost: 4e37, x: 1.5, desc: 'Tysiące gwiazd na metr kwadratowy nieba. Zasłony obowiązkowe.' },
  { id: 'g_pizza', name: 'Pizza z innej galaktyki', icon: '🍕', cost: 6e38, x: 2, desc: 'Dowieziona z Obłoku Magellana. Wciąż ciepła, bo warp.' },
  { id: 'g_eclipse', name: 'Zaćmienie na zamówienie', icon: '🌘', cost: 1e40, x: 2, desc: 'Planety ustawiają się w szeregu na firmowe zdjęcie.' },
];

export const GALAXY_CLICK = [
  { id: 'gk_compass', name: 'Kompas gwiezdny', icon: '🧭', cost: 6e27, x: 2, desc: 'Zawsze wskazuje najbliższą nieodkrytą gwiazdę.' },
  { id: 'gk_hyper', name: 'Przycisk nadprzestrzeni', icon: '🔵', cost: 1e29, x: 2, desc: 'Niebieski, nie czerwony. Ten czerwony jest od autodestrukcji.' },
  { id: 'gk_pulsar', name: 'Zegar pulsara', icon: '⏱️', cost: 1.5e30, x: 1, pct: 0.005, desc: 'Każdy skok daje dodatkowo 0,5% przychodu na sekundę.' },
  { id: 'gk_slingshot', name: 'Proca wokół czarnej dziury', icon: '🌀', cost: 2.5e31, x: 3, desc: 'Najszybsza droga na drugą stronę gwiazdy.' },
  { id: 'gk_swarm', name: 'Rój sond na kliknięcie', icon: '🐝', cost: 4e32, x: 5, desc: 'Jedno dotknięcie, tysiąc startów.' },
  { id: 'gk_wormhole', name: 'Skrót przez tunel', icon: '🕳️', cost: 6e33, x: 1, pct: 0.01, desc: 'Każdy skok daje dodatkowo 1% przychodu na sekundę.' },
  { id: 'gk_tachyon', name: 'Kliknięcie tachionowe', icon: '⚡', cost: 1e35, x: 10, desc: 'Zostało kliknięte, zanim o nim pomyślałeś.' },
  { id: 'gk_mind', name: 'Kliknięcie myślą', icon: '🧠', cost: 1.5e36, x: 1, pct: 0.01, desc: 'Wystarczy pomyśleć o skoku. Statek zrozumie.' },
  { id: 'gk_bigbang', name: 'Mały Wielki Wybuch', icon: '💥', cost: 2.5e37, x: 10, desc: 'Każde kliknięcie zaczyna nowy mały wszechświat. Dla porządku.' },
];

// ---------------------------------------------------------------------------
// PRZEJĘCIA (z Senatem galaktycznym)
// ---------------------------------------------------------------------------
export const GALAXY_ACQUISITIONS = [
  { id: 'ga_arkline', name: 'Linie Pokoleniowe Arka', icon: '🛳️', cost: 1e32, fx: [{ t: 'prod', id: 'arks', x: 3 }, { t: 'prod', id: 'probes', x: 5 }], desc: 'Ich slogan: „Twoi wnukowie podziękują”.' },
  { id: 'ga_sailco', name: 'Żaglowiec Sp. z o.o.', icon: '⛵', cost: 2e32, fx: [{ t: 'cat', cat: 'voyage', x: 3 }], desc: 'Mają patent na żagiel w kształcie logo.' },
  { id: 'ga_antistar', name: 'Antygwiazda', icon: '⚛️', cost: 6e32, fx: [{ t: 'prod', id: 'antimatter', x: 3 }], desc: 'Jedyna rafineria antymaterii z certyfikatem BHP.' },
  { id: 'ga_shells', name: 'Powłoki Inc.', icon: '🪆', cost: 3e33, fx: [{ t: 'prod', id: 'matrioshka', x: 3 }], desc: 'Budują mózgi matrioszki od trzech pokoleń gwiazd.' },
  { id: 'ga_horizon', name: 'Horyzont Zdarzeń Energia', icon: '🕳️', cost: 1.5e34, fx: [{ t: 'prod', id: 'blackholes', x: 3 }, { t: 'prodCost', x: 0.95 }], desc: 'Nikt nie wie, co mają w środku. Nikt, kto by o tym opowiedział.' },
  { id: 'ga_bubble', name: 'Bąbel Warp Transport', icon: '🫧', cost: 1e35, fx: [{ t: 'prod', id: 'warp', x: 3 }, { t: 'click', x: 3 }], desc: 'Przewożą wszystko, nawet pocztę z przeszłości.' },
  { id: 'ga_andromeda', name: 'Andromeda Holdings', icon: '🌌', cost: 1e36, fx: [{ t: 'cat', cat: 'galactic', x: 3 }, { t: 'rp', x: 1.25 }], desc: 'Konkurencja z sąsiedniej galaktyki. Za cztery miliardy lat i tak byśmy się zderzyli.' },
];

// ---------------------------------------------------------------------------
// UKŁADY GWIEZDNE — ekspansja w Drodze Mlecznej (jak biura na Ziemi: zostają na zawsze).
// r: odległość od centrum galaktyki na mapie (tys. lat świetlnych), ang: kąt na mapie.
// ---------------------------------------------------------------------------
export const GALAXY_OFFICES = [
  { id: 'sol', icon: '☀️', kind: 'galaxy', r: 26, ang: 90, cost: 3e26, hq: true, fx: [{ t: 'dept', id: 'navigators', x: 1.15 }],
    name: 'Układ Słoneczny', desc: 'Dom. Stąd wszystko się zaczęło, a rój Dysona wciąż świeci jak latarnia.' },
  { id: 'alpha', icon: '✨', kind: 'galaxy', r: 22.5, ang: 80, cost: 3e30, req: 'quantumComm', fx: [{ t: 'rp', x: 1.1 }, { t: 'eventFreq', x: 1.05 }],
    name: 'Alfa Centauri', desc: 'Najbliższy sąsiad: dwa słońca i czerwony karzeł. Cztery lata świetlne od domu.' },
  { id: 'trappist', icon: '🔴', kind: 'galaxy', r: 29.5, ang: 98, cost: 3e32, req: 'antimatterTech', fx: [{ t: 'all', x: 1.1 }, { t: 'rp', x: 1.05 }],
    name: 'TRAPPIST-1', desc: 'Siedem planet wokół małej, czerwonej gwiazdy. Trzy nadają się do zamieszkania.' },
  { id: 'pleiades', icon: '💠', kind: 'galaxy', r: 24, ang: 106, cost: 1e34, req: 'matrioshkaTech', fx: [{ t: 'all', x: 1.15 }],
    name: 'Plejady', desc: 'Siedem sióstr i kilkaset kuzynek. Najmłodsze gwiazdy w okolicy.' },
  { id: 'crab', icon: '🦀', kind: 'galaxy', r: 36, ang: 110, cost: 3e34, req: 'blackHoleTaming', fx: [{ t: 'prodCost', x: 0.95 }],
    name: 'Mgławica Kraba', desc: 'Pozostałość po supernowej z 1054 roku. Pulsar w środku tyka 30 razy na sekundę.' },
  { id: 'orion', icon: '🌸', kind: 'galaxy', r: 31, ang: 78, cost: 1e35, req: 'seeding', fx: [{ t: 'cat', cat: 'stars', x: 1.15 }],
    name: 'Mgławica Oriona', desc: 'Żłobek gwiazd. Tu rodzą się nowe słońca, a Ty zbierasz czynsz.' },
  { id: 'omega', icon: '🎇', kind: 'galaxy', r: 16, ang: 140, cost: 1e37, req: 'uplift', fx: [{ t: 'rp', x: 1.1 }],
    name: 'Omega Centauri', desc: 'Dziesięć milionów gwiazd w jednej gromadzie. Może to jądro dawnej galaktyki.' },
  { id: 'lmc', icon: '☁️', kind: 'galaxy', r: 50, ang: 228, cost: 3e37, req: 'uplift', fx: [{ t: 'all', x: 1.25 }],
    name: 'Wielki Obłok Magellana', desc: 'Galaktyka satelitarna. Najlepszy widok na Drogę Mleczną z zewnątrz.' },
  { id: 'sgr', icon: '🌑', kind: 'galaxy', r: 0, ang: 0, cost: 3e36, req: 'coreMining', fx: [{ t: 'cat', cat: 'galactic', x: 1.15 }],
    name: 'Sagittarius A*', desc: 'Czarna dziura w samym centrum galaktyki. Biuro z najdłuższym dniem pracy.' },
];
export const GALAXY_OFFICE_LEVEL_COST = 20;

// ---------------------------------------------------------------------------
// ZLECENIA (kontrakty) od cywilizacji i kolonii
// ---------------------------------------------------------------------------
export const GALAXY_CLIENTS = [
  ['Kolonia Nowa Ziemia', '🌎'], ['Rada Plejad', '💠'], ['Akademia Proximy', '🎓'],
  ['Cywilizacja Tau Ceti', '👽'], ['Kopalnia Gwiazd Syriusz', '⛏️'], ['Obserwatorium Krańca Galaktyki', '🔭'],
  ['Arka „Nadzieja”', '🚢'], ['Bank Energii Galaktycznej', '🏦'], ['Liga Pulsarów', '⏱️'],
  ['Ogrody Mgławicy Oriona', '🌸'], ['Muzeum Pierwszego Kontaktu', '🏛️'], ['Studio holofilmowe Andromeda', '🎬'],
  ['Poczta Międzygwiezdna', '📮'], ['Elektrownia Horyzont', '🕳️'],
];
export const GALAXY_TASKS = [
  'mapę ramienia spiralnego', 'trasę warp', 'nową egzoplanetę', 'sondę zwiadowczą', 'przekaźnik sieci', 'osłonę przed supernową',
  'przeprowadzkę gwiazdy', 'arkę pokoleniową', 'tłumacza dla obcych', 'wyścig wokół pulsara', 'dostawę antymaterii',
  'nową gwiazdę', 'port przeładunkowy', 'słownik pierwszego kontaktu',
];

// ---------------------------------------------------------------------------
// ZASIĘG RYNKU Galaktyki (log10 $/s): zaczyna się tam, gdzie kończy się Kosmos (ponad roju
// Dysona), era 11 kończy się ponad gromadą gwiazd (Kardaszow 2,5), era 13 — na cywilizacji typu III.
// ---------------------------------------------------------------------------
export const GALAXY_REACH = {
  base: 25.5,
  ends: [29, 32.5, 36],
  firstEra: 11,
  soft: 0.3,
  maxOver: 100,
  stages: [{ era: 0, id: 'nearStars' }, { era: 12, id: 'arm' }, { era: 13, id: 'galaxy' }],
};
export const GALAXY_TECH_CAP_STEP = reachSteps(GALAXY_TECHS, GALAXY_REACH).step;

// Badania z budżetu liczą się względem skali pieniędzy w galaktyce (ref).
export const GALAXY_RD_BUDGET = { shares: [0, 0.1, 0.25, 0.5], k: 0.2, p: 0.4, ref: 3e23 };
// Wyprawa (reset Galaktyki): sondy von Neumanna zamiast kapitału inwestorów.
export const GALAXY_PRESTIGE = { div: 3e29, exp: 1 / 3, k: 10, bonus: 0.02 };
// Podstawowa siła jednego skoku (kliknięcia).
export const GALAXY_CLICK_BASE = 3e25;

// Wiadomości na pasku, gdy firma działa w galaktyce ({c} — nazwa firmy).
export const GALAXY_NEWS = [
  'Sonda {c} dotarła do Alfa Centauri i od razu zbudowała dwie kolejne',
  'Pasażerowie arki pytają, czy „już dolatujemy”. Zostało 340 lat',
  'Okrętowa SI {c} poprosiła o imię. Wybrała „Zenek”',
  'Astrofizycy: w Mgławicy Oriona urodziło się dziś 14 gwiazd',
  'Pierwsza obca cywilizacja odpowiedziała na wiadomość. Prosi o mniej spamu',
  'Turyści warp skarżą się na rozciągnięte zdjęcia',
  'Senat galaktyczny debatuje, czy Pluton jest planetą. Znowu',
  'Kupcy {c} sprzedali pierwszą gwiazdę na raty',
  'Pulsar w Mgławicy Kraba wybija rytm na firmowej imprezie',
  'Matrioszka {c} policzyła do nieskończoności. Dwa razy',
  'Ksenobiolodzy znaleźli porosty, które lubią jazz',
  'Analitycy: „Andromeda to tylko kwestia czasu i napędu”',
  'Sagittarius A* zjadł dziś pół gwiazdy. Grawitolodzy bez komentarza',
  'Obłok Magellana zgłasza najlepszy widok na Drogę Mleczną',
];

// Lobbing w galaktyce: trasy, senat i patenty na gwiazdy (patrz LOBBY_RULES w data.js).
export const GALAXY_LOBBY = [
  { id: 'lg_routes', icon: '⛵', name: 'Prawa do tras', desc: 'Najkrótsze trasy między gwiazdami wpisane do Twojego rejestru.' },
  { id: 'lg_senate', icon: '🏛️', name: 'Głosy w Senacie', desc: 'Kilka planet głosuje tak, jak sugerujesz. Z wdzięczności.' },
  { id: 'lg_tariffs', icon: '💱', name: 'Zniesienie ceł międzygwiezdnych', desc: 'Towar leci tysiąc lat, ale przynajmniej bez kontroli celnej.' },
  { id: 'lg_charter', icon: '📜', name: 'Karta Ramienia Oriona', desc: 'Prawa i obowiązki wszystkich cywilizacji ramienia. Przypisy pisałeś Ty.' },
  { id: 'lg_patents', icon: '⭐', name: 'Patenty na gwiazdy', desc: 'Każda nowa gwiazda typu G jest objęta Twoim patentem.' },
  { id: 'lg_veto', icon: '🛑', name: 'Prawo weta', desc: 'Senat może uchwalić wszystko. Ty możesz to zablokować.' },
  { id: 'lg_core', icon: '🌑', name: 'Strefa wolnocłowa w jądrze', desc: 'Najgęstszy rynek galaktyki bez podatków. Prawie bez.' },
  { id: 'lg_throne', icon: '👑', name: 'Tron galaktyczny', desc: 'Formalnie to tylko krzesło. Ale bardzo duże.' },
];

// Wyzwania Galaktyki (po transcendencji).
export const GALAXY_CHALLENGES = [
  { id: 'manual', icon: '🕹️', rule: 'noAutopilot', name: 'Ręczne sterowanie',
    desc: 'Autopilot nie działa w galaktyce.', goal: 1, fx: [{ t: 'offlineEff', v: 0.15 }, { t: 'offlineCap', v: 4 * 3600 }] },
  { id: 'nobudget', icon: '🔬', rule: 'noBudget', name: 'Bez budżetu',
    desc: 'Budżet badawczy jest wyłączony.', goal: 1, fx: [{ t: 'rp', x: 1.5 }] },
  { id: 'freemarket', icon: '🛑', rule: 'noLobby', name: 'Wolny rynek',
    desc: 'Nie możesz lobbować.', goal: 1, fx: [{ t: 'brakeSec', v: 120 }] },
];
