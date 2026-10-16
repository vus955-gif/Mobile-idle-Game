// Warstwa Kosmos: osobna firma na orbicie i w Układzie Słonecznym. Zaczyna się od nowa po
// wymaksowaniu Ziemi, ma własne produkty, działy, drzewko (ery 8–10), ulepszenia i kolonie.
// Pieniądze wchodzą tu na nieludzką skalę: od rynku wielkości PKB Ziemi do cywilizacji typu II.
// Plik nie dotyka DOM — importuje go gra, testy i symulator. Teksty angielskie są w lang/en.js.
import { reachSteps } from './data.js';

export const SPACE_CATEGORIES = {
  orbit: { name: 'Orbita', grad: ['#36d1dc', '#5b86e5'] },
  colony: { name: 'Kolonie', grad: ['#f2994a', '#eb5757'] },
  solar: { name: 'Gwiazda', grad: ['#f7971e', '#ffd200'] },
};

// ---------------------------------------------------------------------------
// PRODUKTY — usługi kosmiczne. Pierwszy start kosztuje tyle, ile Ziemia zarabia w kilka sekund;
// kolejne produkty kosztują ok. 10 minut rynku, jaki firma ma przed ich odblokowaniem,
// a czas zwrotu rośnie ×2,2 (nowe produkty nie zjadają starych od razu).
// ---------------------------------------------------------------------------
export const SPACE_PRODUCTS = [
  { id: 'launch', name: 'Loty orbitalne', icon: '🚀', cat: 'orbit', cost: 1e14,
    desc: 'Rakieta startuje, ląduje i po kwadransie leci znowu. Jak taksówka, tylko szybciej.',
    ups: ['Lądowanie na barce', 'Odzysk owiewek', 'Start co tydzień', 'Silniki na metan', 'Start co godzinę', 'Kosmodrom na równiku', 'Rozkład jazdy jak w metrze'] },
  { id: 'orbital', name: 'Sieć orbitalna', icon: '🛰️', cat: 'orbit', tech: 'satellites', cost: 2e16,
    desc: 'Pełen zasięg. Nawet na Marsie.',
    ups: ['Pierwszy satelita', 'Konstelacja 1000 satelitów', 'Łącza laserowe', 'Internet na Marsie', 'Przekaźnik na Księżycu', 'Sieć w Pasie Kuipera', 'Międzygwiezdny ping'] },
  { id: 'hotel', name: 'Hotel orbitalny', icon: '🏨', cat: 'orbit', tech: 'stations', cost: 6e16,
    desc: 'Pokój z widokiem na Ziemię. Szesnaście wschodów słońca w cenie doby.',
    ups: ['Kapsuła na trzy osoby', 'Moduł widokowy', 'Obrotowa restauracja', 'Basen w kształcie kuli', 'Wesela w nieważkości', 'All inclusive z wycieczką na Księżyc', 'Pięć gwiazdek. Dosłownie.'] },
  { id: 'microfab', name: 'Fabryki w nieważkości', icon: '🏭', cat: 'orbit', tech: 'zeroG', cost: 6e17,
    desc: 'Idealne kryształy, światłowody bez skazy i narządy z drukarki. Grawitacja tylko przeszkadzała.',
    ups: ['Piec do kryształów', 'Światłowód ZBLAN', 'Drukarka tkanek', 'Półprzewodniki bez defektów', 'Fabryka autonomiczna', 'Stocznia orbitalna', 'Fabryka, która buduje fabryki'] },
  { id: 'helium', name: 'Hel-3 z Księżyca', icon: '🌙', cat: 'colony', tech: 'lunarBase', cost: 2e19,
    desc: 'Paliwo do reaktorów fuzyjnych, zbierane łopatą z księżycowego regolitu.',
    ups: ['Pierwsza koparka', 'Rafineria regolitu', 'Kolej magnetyczna', 'Wyrzutnia masy', 'Kopalnia po niewidocznej stronie', 'Hel w każdej elektrowni', 'Księżyc w abonamencie'] },
  { id: 'marscity', name: 'Miasta na Marsie', icon: '🔴', cat: 'colony', tech: 'marsColony', cost: 6e20,
    desc: 'Działki z widokiem na Olympus Mons. Ogrzewanie w cenie, oddychanie za dopłatą.',
    ups: ['Pierwsza kopuła', 'Szklarnie z ziemniakami', 'Metro pod regolitem', 'Uniwersytet Marsjański', 'Własna waluta', 'Miasto na milion osób', 'Błękitne niebo'] },
  { id: 'asteroids', name: 'Górnictwo planetoid', icon: '☄️', cat: 'colony', tech: 'asteroidMining', cost: 2e21,
    desc: 'Jedna metaliczna planetoida jest warta więcej niż cała ziemska gospodarka. Mamy ich miliony.',
    ups: ['Sonda zwiadowcza', 'Holowanie na orbitę', 'Huta w próżni', 'Flota górników', 'Platyna tańsza niż stal', 'Cały Pas Planetoid', 'Planetoida w każdym domu'] },
  { id: 'asi', name: 'Superinteligencja', icon: '🌌', cat: 'solar', tech: 'asiTech', cost: 6e22,
    desc: 'Ostatni wynalazek, jakiego ludzkość potrzebowała.',
    ups: ['Bezpieczne wyrównanie', 'Rekurencyjne samodoskonalenie', 'Rozwiązanie wszystkich równań', 'Lekarstwo na nudę', 'Projektowanie gwiazd', 'Symulacja wszechświata', 'Odpowiedź ostateczna: 42'] },
  { id: 'dysonPower', name: 'Energia ze Słońca', icon: '☀️', cat: 'solar', tech: 'dyson', cost: 6e24,
    desc: 'Rój Dysona zbiera światło całej gwiazdy. Rachunek za prąd wysyłasz do całego Układu.',
    ups: ['Pierwsze zwierciadło', 'Milion kolektorów', 'Przesył laserowy', 'Pierścień wokół Słońca', 'Rój na pełnej mocy', 'Gwiazda na smyczy', 'Słońce z logo firmy'] },
];
export const SPACE_PAYBACK0 = 100;
export const SPACE_PAYBACK_GROWTH = 2.2;
const nice = (x) => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
SPACE_PRODUCTS.forEach((p, i) => { p.rps = nice(p.cost / (SPACE_PAYBACK0 * Math.pow(SPACE_PAYBACK_GROWTH, i))); });

// ---------------------------------------------------------------------------
// DZIAŁY — moduły stacji. Pierwsi są inżynierowie, badania prowadzi kontrola misji.
// ---------------------------------------------------------------------------
export const SPACE_DEPTS = [
  { id: 'engineers', name: 'Inżynierowie rakietowi', icon: '👩‍🔧', color: '#5ec8ff', unlock: 0, base: 1e13, g: 1.2,
    desc: 'Projektują, spawają i liczą. Każdy inżynier podnosi przychody i siłę startów.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickFlat', v: 2.5e12 }],
    ups: ['Symulator lotu', 'Tunel aerodynamiczny', 'Własna hamownia silników'], upIcons: ['🖥️', '🌬️', '🔥'] },
  { id: 'mission', name: 'Kontrola misji', icon: '🎛️', color: '#b07cff', unlock: 4e14, base: 1.5e14, g: 1.2,
    desc: 'Generuje punkty badań kosmicznych. Bez nich nie polecisz dalej niż na orbitę.',
    per: [{ t: 'rp', v: 0.3 }],
    ups: ['Ściana monitorów', 'Sieć anten dalekiego zasięgu', 'Centrum symulacji misji'], upIcons: ['📺', '📡', '🧮'] },
  { id: 'astronauts', name: 'Astronauci', icon: '🧑‍🚀', color: '#ff7ab6', unlock: 5e15, base: 2e15, g: 1.2,
    desc: 'Ludzie na pokładzie zrobią to, czego nie zrobi żaden robot. I świetnie wychodzą na zdjęciach.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickMult', v: 0.05 }],
    ups: ['Wirówka treningowa', 'Basen do ćwiczeń w skafandrach', 'Skafander nowej generacji'], upIcons: ['🌀', '🏊', '🥽'] },
  { id: 'robots', name: 'Roboty serwisowe', icon: '🦾', color: '#90a4ae', unlock: 2e16, base: 8e15, g: 1.2, tech: 'stations',
    desc: 'Naprawiają, montują i odpalają rakiety same. Każdy robot to automatyczne starty.',
    per: [{ t: 'income', v: 0.003 }, { t: 'auto', v: 0.2 }],
    ups: ['Ramię robotyczne', 'Roboty-pająki na kratownicy', 'Rój serwisowy'], upIcons: ['🦿', '🕷️', '🐝'] },
  { id: 'logistics', name: 'Logistyka orbitalna', icon: '📦', color: '#4dd0a1', unlock: 6e16, base: 2e16, g: 1.2,
    desc: 'Otwiera zlecenia od kolonii i agencji kosmicznych. Co 25 osób — kolejne miejsce na zlecenie.',
    per: [{ t: 'income', v: 0.003 }, { t: 'contract', v: 0.01, cap: 2 }, { t: 'slotEvery', v: 25 }],
    ups: ['Holowniki orbitalne', 'Magazyn w punkcie Lagrange’a', 'Lot co minutę'], upIcons: ['🚚', '🏗️', '🗓️'] },
  { id: 'medics', name: 'Medycyna kosmiczna', icon: '🩺', color: '#4fc3f7', unlock: 8e17, base: 3e17, g: 1.2,
    desc: 'Zdrowa załoga pracuje, także gdy Ciebie nie ma. Więcej zarobku offline.',
    per: [{ t: 'income', v: 0.005 }, { t: 'offlineEff', v: 0.004, cap: 0.45 }],
    ups: ['Gabinet w module', 'Telemedycyna z Ziemi', 'Osłona przed promieniowaniem'], upIcons: ['🩹', '📞', '🛡️'] },
  { id: 'spacelaw', name: 'Prawo kosmiczne', icon: '⚖️', color: '#bcaaa4', unlock: 1.5e19, base: 5e18, g: 1.2,
    desc: 'Kto jest właścicielem Księżyca? Twoi prawnicy mają na to dobrą odpowiedź. Otwiera przejęcia.',
    per: [{ t: 'income', v: 0.003 }, { t: 'acqCost', v: 0.008, cap: 0.5 }],
    ups: ['Traktat o przestrzeni kosmicznej', 'Sąd arbitrażowy na orbicie', 'Konstytucja Marsa'], upIcons: ['📜', '🏛️', '🔴'] },
  { id: 'miners', name: 'Górnicy kosmiczni', icon: '⛏️', color: '#ffd54f', unlock: 4e20, base: 1e20, g: 1.2, tech: 'asteroidMining',
    desc: 'Tańsze produkty i premia dla kolonii. Surowce z kosmosu nie płacą cła.',
    per: [{ t: 'prodCost', v: 0.005, cap: 0.5 }, { t: 'cat', cat: 'colony', v: 0.01, cap: 3 }],
    ups: ['Wiertła diamentowe', 'Autonomiczne kombajny', 'Rafineria na orbicie'], upIcons: ['💎', '🤖', '🏭'] },
  { id: 'terraformers', name: 'Terraformerzy', icon: '🌱', color: '#8bc34a', unlock: 1e21, base: 3e20, g: 1.2, tech: 'terraforming',
    desc: 'Zamieniają pustynie w ogrody. Więcej kolonistów przy każdej nowej fali kolonizacji.',
    per: [{ t: 'income', v: 0.003 }, { t: 'prestige', v: 0.01, cap: 2 }],
    ups: ['Mchy z Antarktydy', 'Lustra orbitalne', 'Pierwszy deszcz na Marsie'], upIcons: ['🌿', '🪞', '🌧️'] },
];

// ---------------------------------------------------------------------------
// TECHNOLOGIE — trzy ery kosmiczne, numerowane dalej po ziemskich. Koszty rosną ×2,4 na
// technologię (2000 × 2,4^i): firma przychodzi tu z premiami z całej Ziemi, więc drzewko
// wymaga kilku fal kolonizacji (ok. półtorej doby gry co kilka godzin).
// ---------------------------------------------------------------------------
export const SPACE_ERAS = [
  { id: 8, name: 'Orbita', icon: '🛰️' },
  { id: 9, name: 'Księżyc i Mars', icon: '🔴' },
  { id: 10, name: 'Układ Słoneczny', icon: '☀️' },
];

export const SPACE_TECHS = [
  // Era 8: orbita
  { id: 'rockets', era: 8, name: 'Rakiety wielokrotnego użytku', icon: '🚀', cost: 2000, req: [], fx: [{ t: 'prod', id: 'launch', x: 2 }, { t: 'click', x: 2 }],
    desc: 'Lądują same. Na barce. Na środku oceanu.' },
  { id: 'satellites', era: 8, name: 'Konstelacje satelitów', icon: '🛰️', cost: 4800, req: ['rockets'], fx: [{ t: 'unlockProduct', id: 'orbital' }],
    desc: 'Tysiące satelitów i jeden astronom, który płacze.' },
  { id: 'stations', era: 8, name: 'Stacje modułowe', icon: '🏗️', cost: 12000, req: ['rockets'], fx: [{ t: 'unlockProduct', id: 'hotel' }, { t: 'unlockDept', id: 'robots' }],
    desc: 'Klocki dla dorosłych: każdy moduł dokowany do poprzedniego. Instrukcja ma 4000 stron.' },
  { id: 'lasercom', era: 8, name: 'Łącza laserowe', icon: '🔦', cost: 28000, req: ['satellites'], fx: [{ t: 'prod', id: 'orbital', x: 3 }, { t: 'rp', x: 1.5 }],
    desc: 'Satelity rozmawiają ze sobą światłem. Z Tokio do Lizbony szybciej niż światłowodem.' },
  { id: 'zeroG', era: 8, name: 'Produkcja w nieważkości', icon: '🧪', cost: 66000, req: ['stations'], fx: [{ t: 'unlockProduct', id: 'microfab' }],
    desc: 'Bez grawitacji stopy mieszają się idealnie, a kryształy rosną bez skaz.' },
  { id: 'orbitalDC', era: 8, name: 'Orbitalne centra danych', icon: '🌍', cost: 1.6e5, req: ['lasercom', 'zeroG'], fx: [{ t: 'cat', cat: 'orbit', x: 2 }, { t: 'rp', x: 2 }],
    desc: 'Darmowe chłodzenie. Kosmos jest zimny.' },
  { id: 'elevator', era: 8, name: 'Winda kosmiczna', icon: '🧵', cost: 3.8e5, req: ['orbitalDC'], fx: [{ t: 'prodCost', x: 0.9 }, { t: 'all', x: 1.25 }],
    desc: 'Lina z nanorurek węglowych sięga orbity. Na górę jedzie się windą, jak do biura.' },
  // Era 9: Księżyc i Mars
  { id: 'lunarBase', era: 9, name: 'Baza księżycowa', icon: '🌙', cost: 9.2e5, req: ['elevator'], fx: [{ t: 'unlockProduct', id: 'helium' }],
    desc: 'Habitat zakopany w regolicie chroni przed promieniowaniem. Wschód Ziemi gratis.' },
  { id: 'isru', era: 9, name: 'Surowce na miejscu', icon: '🪨', cost: 2.2e6, req: ['lunarBase'], fx: [{ t: 'hireCost', x: 0.85 }, { t: 'prod', id: 'helium', x: 2 }],
    desc: 'Tlen, woda i paliwo robione na miejscu. Nie trzeba ich wozić z Ziemi.' },
  { id: 'fusion', era: 9, name: 'Reaktory fuzyjne', icon: '⚛️', cost: 5.3e6, req: ['isru'], fx: [{ t: 'all', x: 1.5 }, { t: 'cat', cat: 'colony', x: 2 }],
    desc: 'Słońce w butelce. Hel-3 z Księżyca wreszcie ma klienta.' },
  { id: 'marsColony', era: 9, name: 'Kolonia na Marsie', icon: '🔴', cost: 1.3e7, req: ['isru'], fx: [{ t: 'unlockProduct', id: 'marscity' }],
    desc: 'Pierwsze miasto na innej planecie. Ping do Ziemi: od 3 do 22 minut.' },
  { id: 'asteroidMining', era: 9, name: 'Górnictwo planetoid', icon: '☄️', cost: 3e7, req: ['fusion'], fx: [{ t: 'unlockProduct', id: 'asteroids' }, { t: 'unlockDept', id: 'miners' }],
    desc: 'Złapać kamień wielkości stadionu i przyholować go na orbitę. Łatwiejsze, niż brzmi. Trochę.' },
  { id: 'terraforming', era: 9, name: 'Terraformowanie', icon: '🌱', cost: 7.3e7, req: ['marsColony'], fx: [{ t: 'cat', cat: 'colony', x: 2 }, { t: 'unlockDept', id: 'terraformers' }],
    desc: 'Zmiana klimatu, tylko tym razem celowo i na lepsze.' },
  { id: 'pulseDrive', era: 9, name: 'Napęd impulsowy', icon: '💥', cost: 1.8e8, req: ['fusion', 'marsColony'], fx: [{ t: 'click', x: 3 }, { t: 'auto', v: 5 }],
    desc: 'Z Ziemi na Marsa w miesiąc. Pasażerów prosimy, żeby nie zaglądali za rufę.' },
  // Era 10: Układ Słoneczny
  { id: 'asiTech', era: 10, name: 'Superinteligencja', icon: '🌌', cost: 4.2e8, req: ['pulseDrive'], fx: [{ t: 'unlockProduct', id: 'asi' }],
    desc: 'Ostatnia technologia, jaką wymyślili ludzie.' },
  { id: 'mercuryMines', era: 10, name: 'Kopalnie na Merkurym', icon: '⛰️', cost: 1e9, req: ['asteroidMining', 'asiTech'], fx: [{ t: 'prodCost', x: 0.85 }, { t: 'cat', cat: 'solar', x: 2 }],
    desc: 'Najbliżej Słońca, najwięcej metalu i najkrótszy rok w Układzie. Urodziny co 88 dni.' },
  { id: 'gasGiants', era: 10, name: 'Stacje na gazowych olbrzymach', icon: '🪐', cost: 2.4e9, req: ['terraforming', 'asiTech'], fx: [{ t: 'all', x: 1.5 }, { t: 'rp', x: 1.5 }],
    desc: 'Pływające miasta w chmurach Saturna. Wodór pompuje się prosto do baku.' },
  { id: 'statites', era: 10, name: 'Statyty', icon: '🪞', cost: 5.8e9, req: ['mercuryMines'], fx: [{ t: 'cat', cat: 'solar', x: 2 }, { t: 'all', x: 1.25 }],
    desc: 'Lustra unoszone ciśnieniem światła. Nie krążą wokół Słońca, po prostu wiszą.' },
  { id: 'dyson', era: 10, name: 'Rój Dysona', icon: '☀️', cost: 1.4e10, req: ['statites'], fx: [{ t: 'unlockProduct', id: 'dysonPower' }, { t: 'all', x: 2 }],
    desc: 'Cała energia Słońca na potrzeby Twoich serwerów.' },
  { id: 'stellarEngine', era: 10, name: 'Silnik gwiazdowy', icon: '🚂', cost: 3.3e10, req: ['dyson'], fx: [{ t: 'all', x: 2 }],
    desc: 'Gdyby trzeba było przestawić Słońce w lepsze miejsce. Na wszelki wypadek.' },
  { id: 'solarNet', era: 10, name: 'Sieć Układu Słonecznego', icon: '🕸️', cost: 8e10, req: ['dyson', 'gasGiants'], fx: [{ t: 'rp', x: 2 }, { t: 'all', x: 1.5 }],
    desc: 'Każda planeta, księżyc i kamień w jednej sieci. Opóźnienie: kilka godzin świetlnych.' },
];

export const SPACE_REPEAT = [
  { id: 'rs_opt', name: 'Optymalizacja trajektorii', icon: '🛠️', base: 500, g: 3.2, req: ['lasercom'], fx: [{ t: 'all', x: 1.1 }],
    desc: '+10% przychodu za każdy poziom.' },
  { id: 'rs_click', name: 'Szybsze odliczanie', icon: '🔟', base: 300, g: 3, req: ['rockets'], fx: [{ t: 'click', x: 1.25 }],
    desc: '+25% siły startów za każdy poziom.' },
  { id: 'rs_science', name: 'Teleskopy kosmiczne', icon: '🔭', base: 2000, g: 3.5, req: ['orbitalDC'], fx: [{ t: 'rp', x: 1.15 }],
    desc: '+15% punktów badań za każdy poziom.' },
  { id: 'rs_ops', name: 'Automatyczne dokowanie', icon: '🧲', base: 5e4, g: 4, req: ['isru'], fx: [{ t: 'hireCost', x: 0.95 }],
    desc: 'Rekrutacja tańsza o 5% za każdy poziom.' },
];

// ---------------------------------------------------------------------------
// ULEPSZENIA ZA GOTÓWKĘ: życie na stacji i siła startów
// ---------------------------------------------------------------------------
export const SPACE_CULTURE = [
  { id: 's_coffee', name: 'Kawa w nieważkości', icon: '☕', cost: 3e15, x: 1.1, desc: 'Pije się ją przez słomkę z woreczka. Smakuje jak sukces.' },
  { id: 's_window', name: 'Okno na Ziemię', icon: '🪟', cost: 5e16, x: 1.15, desc: 'Najlepszy wygaszacz ekranu w historii.' },
  { id: 's_garden', name: 'Ogród hydroponiczny', icon: '🥬', cost: 8e17, x: 1.15, desc: 'Sałata, która nigdy nie widziała ziemi.' },
  { id: 's_gym', name: 'Siłownia z wirówką', icon: '🏋️', cost: 1.2e19, x: 1.2, desc: 'Kości mówią „dziękuję”.' },
  { id: 's_pizza', name: 'Pizza z drukarki 3D', icon: '🍕', cost: 2e20, x: 1.2, desc: 'Piątkowa tradycja przetrwała start rakiety.' },
  { id: 's_moonwalk', name: 'Spacery po Księżycu w piątki', icon: '🌙', cost: 3e21, x: 1.3, desc: 'Integracja w ⅙ grawitacji. Wszyscy skaczą jak kangury.' },
  { id: 'c_zerog', name: 'Joga w stanie nieważkości', icon: '🧘', cost: 5e22, x: 1.4, desc: 'Pozycja lotosu jeszcze nigdy nie była tak łatwa.' },
  { id: 'c_olympus', name: 'Biuro z widokiem na Olympus Mons', icon: '🏔️', cost: 8e23, x: 1.5, desc: 'Najwyższa góra Układu Słonecznego za oknem sali konferencyjnej.' },
  { id: 's_concert', name: 'Koncert w próżni', icon: '🎸', cost: 1.2e25, x: 1.5, desc: 'Nic nie słychać, ale światła są niesamowite.' },
  { id: 'c_rings', name: 'Ogród na pierścieniach Saturna', icon: '🪐', cost: 2e26, x: 2, desc: 'Pomidory rosną tu w kształcie elips.' },
  { id: 's_aurora', name: 'Zorze nad Jowiszem', icon: '🌌', cost: 3e27, x: 2, desc: 'Zorze większe niż cała Ziemia. Wyjazd firmowy obowiązkowy.' },
];

export const SPACE_CLICK = [
  { id: 'sk_joystick', name: 'Joystick z misji Apollo', icon: '🕹️', cost: 2e15, x: 2, desc: 'Oryginał. Trochę się klei.' },
  { id: 'sk_countdown', name: 'Odliczanie od trzech', icon: '⏱️', cost: 3e16, x: 2, desc: 'Kto ma czas liczyć od dziesięciu?' },
  { id: 'sk_bigred', name: 'Wielki czerwony przycisk', icon: '🔴', cost: 5e17, x: 1, pct: 0.005, desc: 'Każde naciśnięcie daje dodatkowo 0,5% przychodu na sekundę.' },
  { id: 'sk_docking', name: 'Autopilot dokowania', icon: '🧭', cost: 8e18, x: 3, desc: 'Stacja sama podjeżdża pod rakietę.' },
  { id: 'k_swarm', name: 'Rój mikrobotów piszących kod', icon: '🐝', cost: 1.2e20, x: 5, desc: 'Bzyczą w rytmie stand-upów.' },
  { id: 'sk_pad', name: 'Wyrzutnia na każdym biurku', icon: '🛫', cost: 2e21, x: 1, pct: 0.01, desc: 'Każde kliknięcie daje dodatkowo 1% przychodu na sekundę.' },
  { id: 'sk_slingshot', name: 'Proca grawitacyjna', icon: '🌀', cost: 3e22, x: 10, desc: 'Każde kliknięcie nabiera prędkości przy Jowiszu.' },
  { id: 'sk_solarwind', name: 'Klawiatura na wiatr słoneczny', icon: '🌬️', cost: 5e23, x: 1, pct: 0.01, desc: 'Pisze się sama, kiedy Słońce jest aktywne.' },
  { id: 'sk_light', name: 'Kliknięcie z prędkością światła', icon: '⚡', cost: 8e24, x: 10, desc: 'Zanim pomyślisz, już kliknięte.' },
];

// ---------------------------------------------------------------------------
// PRZEJĘCIA (z działem prawa kosmicznego)
// ---------------------------------------------------------------------------
export const SPACE_ACQUISITIONS = [
  { id: 'a_hotelchain', name: 'Sieć hoteli Orbita', icon: '🛎️', cost: 3e19, fx: [{ t: 'prod', id: 'hotel', x: 3 }, { t: 'prod', id: 'launch', x: 5 }], desc: 'Ich hasło: „Śniadanie podajemy o każdym wschodzie słońca”.' },
  { id: 'a_orbitix', name: 'Orbitix', icon: '🌠', cost: 6e19, fx: [{ t: 'cat', cat: 'orbit', x: 3 }], desc: 'Właściciele połowy niskiej orbity.' },
  { id: 'a_moonex', name: 'Księżycowy Ekspres', icon: '📮', cost: 2e20, fx: [{ t: 'prod', id: 'helium', x: 3 }], desc: 'Jedyna firma kurierska z oddziałem na Morzu Spokoju.' },
  { id: 'a_redplanet', name: 'Czerwona Planeta Deweloper', icon: '🏘️', cost: 1e21, fx: [{ t: 'prod', id: 'marscity', x: 3 }], desc: 'Sprzedali już działki na Fobosie. Fobos jeszcze o tym nie wie.' },
  { id: 'a_belt', name: 'Pasowa Spółka Górnicza', icon: '⛏️', cost: 5e21, fx: [{ t: 'prod', id: 'asteroids', x: 3 }, { t: 'prodCost', x: 0.95 }], desc: 'Trzy pokolenia górników i ani jednego dnia na Ziemi.' },
  { id: 'a_nebula', name: 'Mgławica AI', icon: '🧠', cost: 3e22, fx: [{ t: 'prod', id: 'asi', x: 3 }, { t: 'click', x: 3 }], desc: 'Laboratorium superinteligencji zbudowane w Pasie Kuipera. Na wszelki wypadek.' },
  { id: 'a_helios', name: 'Helios Energy', icon: '🌞', cost: 3e23, fx: [{ t: 'cat', cat: 'solar', x: 3 }, { t: 'rp', x: 1.25 }], desc: 'Startup, który chciał zbudować rój Dysona. Prawie mu się udało.' },
];

// ---------------------------------------------------------------------------
// KOLONIE — ekspansja w Układzie Słonecznym (jak biura na Ziemi: zostają na zawsze).
// au: odległość od Słońca na mapie, ang: położenie na orbicie.
// ---------------------------------------------------------------------------
export const SPACE_OFFICES = [
  { id: 'leo', icon: '🛰️', kind: 'space', au: 1, ang: 200, cost: 1e14, hq: true, fx: [{ t: 'dept', id: 'engineers', x: 1.15 }],
    name: 'Stacja orbitalna', desc: 'Biuro z widokiem na Ziemię. Szesnaście wschodów słońca dziennie.' },
  { id: 'l2', icon: '🔭', kind: 'space', au: 1, ang: 225, cost: 1e18, req: 'lasercom', fx: [{ t: 'rp', x: 1.1 }, { t: 'eventFreq', x: 1.05 }],
    name: 'Obserwatorium L2', desc: 'Półtora miliona kilometrów od Ziemi, w cieniu, skąd widać najdalej.' },
  { id: 'moon', icon: '🌙', kind: 'space', au: 1, ang: 175, cost: 1e20, req: 'lunarBase', fx: [{ t: 'all', x: 1.1 }, { t: 'rp', x: 1.05 }],
    name: 'Baza na Księżycu', desc: 'Kampus pod kopułą, ⅙ grawitacji i zero korków.' },
  { id: 'mars', icon: '🔴', kind: 'space', au: 1.52, ang: 300, cost: 3e21, req: 'marsColony', fx: [{ t: 'all', x: 1.15 }],
    name: 'Kolonia na Marsie', desc: 'Pierwsze miasto na innej planecie. Ping do Ziemi: 20 minut.' },
  { id: 'ceres', icon: '☄️', kind: 'space', au: 2.77, ang: 40, cost: 1e22, req: 'asteroidMining', fx: [{ t: 'prodCost', x: 0.95 }],
    name: 'Ceres', desc: 'Kopalnia surowców w Pasie Planetoid. Serwery tanieją.' },
  { id: 'venus', icon: '🟡', kind: 'space', au: 0.72, ang: 110, cost: 3e22, req: 'terraforming', fx: [{ t: 'cat', cat: 'colony', x: 1.15 }],
    name: 'Miasta w chmurach Wenus', desc: 'Pięćdziesiąt kilometrów nad powierzchnią jest jak nad Morzem Śródziemnym. Tylko kwas siarkowy psuje urlop.' },
  { id: 'europa', icon: '🧊', kind: 'space', au: 5.2, ang: 140, cost: 3e24, req: 'gasGiants', fx: [{ t: 'rp', x: 1.1 }],
    name: 'Europa', desc: 'Laboratorium pod lodem księżyca Jowisza.' },
  { id: 'titan', icon: '🪐', kind: 'space', au: 9.5, ang: 250, cost: 1e25, req: 'gasGiants', fx: [{ t: 'all', x: 1.25 }],
    name: 'Tytan', desc: 'Pomarańczowe niebo, metanowe jeziora i Saturn nad horyzontem.' },
  { id: 'mercury', icon: '🌑', kind: 'space', au: 0.39, ang: 330, cost: 1e24, req: 'mercuryMines', fx: [{ t: 'cat', cat: 'solar', x: 1.15 }],
    name: 'Merkury', desc: 'Fabryka luster dla roju Dysona. Jedna doba trwa tu dwa tutejsze lata.' },
];
export const SPACE_OFFICE_LEVEL_COST = 20;

// ---------------------------------------------------------------------------
// ZLECENIA (kontrakty) od kolonii i agencji
// ---------------------------------------------------------------------------
export const SPACE_CLIENTS = [
  ['Kolonia Nowa Warszawa', '🔴'], ['Agencja Kosmiczna Orion', '🚀'], ['Uniwersytet Księżycowy', '🎓'],
  ['Hotel Pod Saturnem', '🪐'], ['Kopalnia Ceres-7', '⛏️'], ['Teleskop Głębokiego Pola', '🔭'],
  ['Szpital orbitalny Hipokrates', '🏥'], ['Wenusjańskie Linie Chmurowe', '☁️'], ['Klub piłkarski Grawitacja Zero', '⚽'],
  ['Farma Zielony Krater', '🥬'], ['Muzeum Apollo', '🏛️'], ['Studio filmowe Odyseja', '🎬'],
  ['Kurier Międzyplanetarny', '📮'], ['Elektrownia Helios', '🔆'],
];
export const SPACE_TASKS = [
  'dostawę tlenu', 'system nawigacji', 'nowy habitat', 'łazik badawczy', 'sieć łączności', 'osłonę przed promieniowaniem',
  'przeprowadzkę na orbitę', 'szklarnię', 'satelitę pogodowego', 'tor wyścigowy w nieważkości', 'transport lodu z komety',
  'system podtrzymywania życia', 'lądowisko', 'mapę Marsa',
];

// ---------------------------------------------------------------------------
// ZASIĘG RYNKU Kosmosu (log10 $/s): zaczyna się tam, gdzie kończy się Ziemia (10 bln $/s),
// era 8 kończy się ponad cywilizacją typu I, era 10 — na cywilizacji typu II (rój Dysona).
// ---------------------------------------------------------------------------
export const SPACE_REACH = {
  base: 13,
  ends: [16.5, 20, 23.5],
  firstEra: 8,
  soft: 0.3,
  maxOver: 100,
  stages: [{ era: 0, id: 'orbit' }, { era: 9, id: 'planets' }, { era: 10, id: 'solar' }],
};
export const SPACE_TECH_CAP_STEP = reachSteps(SPACE_TECHS, SPACE_REACH).step;

// Badania z budżetu liczą się względem skali pieniędzy w kosmosie (ref), więc tempo badań
// jest podobne jak na Ziemi, choć kwoty są o rzędy wielkości większe.
export const SPACE_RD_BUDGET = { shares: [0, 0.1, 0.25, 0.5], k: 0.2, p: 0.4, ref: 1e11 };
// Fala kolonizacji (reset Kosmosu): koloniści zamiast kapitału inwestorów.
export const SPACE_PRESTIGE = { div: 1e17, exp: 1 / 3, k: 10, bonus: 0.02 };
// Podstawowa siła jednego startu (kliknięcia) — w kosmosie nikt nie liczy w dolarach.
export const SPACE_CLICK_BASE = 1e13;
