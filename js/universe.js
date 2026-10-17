// Warstwa Wszechświat: ostatni etap imperium. Otwiera się po wymaksowaniu Galaktyki (cywilizacja
// typu III), ma własne produkty, działy, drzewko (ery 14–16), ulepszenia i placówki w galaktykach
// i gromadach. Pieniądze rosną od całej Drogi Mlecznej do multiwersum (Kardaszow 5). Rynek jest
// szerszy niż w poprzednich etapach (5 rzędów wielkości na erę zamiast 3,5), więc ceny rozciągają
// się proporcjonalnie, a technologie dają większe premie.
// Plik nie dotyka DOM — importuje go gra, testy i symulator. Teksty angielskie są w lang/en.js.
import { reachSteps } from './data.js';

export const UNIVERSE_CATEGORIES = {
  clusters: { name: 'Gromady', grad: ['#4facfe', '#00f2fe'] },
  fabric: { name: 'Czasoprzestrzeń', grad: ['#a18cd1', '#fbc2eb'] },
  creation: { name: 'Kreacja', grad: ['#f6d365', '#fda085'] },
};

// ---------------------------------------------------------------------------
// PRODUKTY — usługi na skalę wszechświata. Pierwsze latarnie kosztują kilka sekund przychodu
// Galaktyki; czas zwrotu rośnie ×2,2 jak w poprzednich etapach.
// ---------------------------------------------------------------------------
export const UNIVERSE_PRODUCTS = [
  { id: 'quasars', name: 'Latarnie kwazarowe', icon: '💡', cat: 'clusters', cost: 1e39,
    desc: 'Najjaśniejsze obiekty we wszechświecie jako billboardy. Twoje logo widać z drugiego końca kosmosu.',
    ups: ['Pierwszy kwazar', 'Reklama w dżecie', 'Billboard na miliard lat', 'Kwazar w każdej gromadzie', 'Slogan w promieniowaniu gamma', 'Rozkład jazdy na niebie', 'Światło, które dociera wszędzie'] },
  { id: 'gates', name: 'Bramy międzygalaktyczne', icon: '🌀', cat: 'clusters', tech: 'wormholes', cost: 5e42,
    desc: 'Tunel do sąsiedniej galaktyki. Kolejka jak na lotnisku, ale lot trwa sekundę.',
    ups: ['Pierwsza brama', 'Odprawa bez kolejki', 'Brama do Andromedy', 'Bilet miesięczny', 'Strefa wolnocłowa', 'Brama w każdej galaktyce', 'Wszędzie blisko'] },
  { id: 'mergers', name: 'Fuzje galaktyk', icon: '💞', cat: 'clusters', tech: 'galaxyMergers', cost: 3e43,
    desc: 'Andromeda i Droga Mleczna mają się zderzyć. Ty sprzedajesz bilety i robisz z tego wesele.',
    ups: ['Pierwsze zbliżenie', 'Fajerwerki z supernowych', 'Nowe gwiazdy w prezencie', 'Galaktyka eliptyczna', 'Ślub dwóch gromad', 'Fuzja na zamówienie', 'Mlekomeda'] },
  { id: 'darkmatter', name: 'Kopalnie ciemnej materii', icon: '🌑', cat: 'clusters', tech: 'darkMatterTech', cost: 7e44,
    desc: 'Pięć razy więcej niż zwykłej materii, a nikt jej nie wydobywał. Pierwszy na rynku wygrywa wszystko.',
    ups: ['Pierwsza próbka', 'Sito na WIMP-y', 'Halo w dzierżawie', 'Rafineria aksjonów', 'Ciemna materia w każdym domu', 'Kopalnia wielkości gromady', 'Wreszcie wiadomo, czym jest'] },
  { id: 'filaments', name: 'Koleje kosmicznej sieci', icon: '🕸️', cat: 'fabric', tech: 'filamentRails', cost: 1e47,
    desc: 'Galaktyki układają się we włókna długie na setki milionów lat świetlnych. Idealne tory.',
    ups: ['Pierwszy tor', 'Ekspres między gromadami', 'Węzeł przesiadkowy', 'Sieć bez przesiadek', 'Wagon restauracyjny', 'Cała sieć w jednym bilecie', 'Kosmos w rozkładzie jazdy'] },
  { id: 'vacuum', name: 'Energia próżni', icon: '⚡', cat: 'fabric', tech: 'vacuumEnergy', cost: 1.5e49,
    desc: 'Pusta przestrzeń wcale nie jest pusta. Abonament za nic jeszcze nigdy się tak nie opłacał.',
    ups: ['Pierwszy kondensator', 'Efekt Casimira w skali', 'Elektrownia w pustce', 'Prąd z niczego', 'Próżnia na eksport', 'Sieć wszechświata', 'Nic, które daje wszystko'] },
  { id: 'timeloops', name: 'Pętle czasu', icon: '⏳', cat: 'fabric', tech: 'chronoTech', cost: 7e49,
    desc: 'Ten sam poniedziałek sprzedany milion razy. Klienci zawsze wracają, bo nie mają wyboru.',
    ups: ['Pierwsza powtórka', 'Wczorajsza poczta jutro', 'Weekend bez końca', 'Pętla w abonamencie', 'Paradoks z gwarancją', 'Czas pod wynajem', 'Zawsze zdążysz'] },
  { id: 'pocket', name: 'Wszechświaty kieszonkowe', icon: '🫧', cat: 'creation', tech: 'pocketUniverses', cost: 1e52,
    desc: 'Mały wszechświat w szklanej kuli. Potrząśnij, a powstaną galaktyki.',
    ups: ['Pierwsza bańka', 'Własne prawa fizyki', 'Wszechświat na prezent', 'Kolekcja pod choinkę', 'Bańka z życiem', 'Seria limitowana', 'Każdemu jego kosmos'] },
  { id: 'genesis', name: 'Wszechświaty na zamówienie', icon: '✨', cat: 'creation', tech: 'babyUniverse', cost: 7e54,
    desc: 'Wybierasz stałe fizyczne, kolor nieba i liczbę wymiarów. Wielki Wybuch w cenie.',
    ups: ['Pierwszy Wielki Wybuch', 'Konfigurator stałych', 'Wszechświat bez grawitacji', 'Pakiet premium: 11 wymiarów', 'Dostawa przez inflację', 'Gwarancja na 10¹⁰⁰ lat', 'Niech stanie się światłość'] },
];
export const UNIVERSE_PAYBACK0 = 100;
export const UNIVERSE_PAYBACK_GROWTH = 2.2;
const nice = (x) => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
UNIVERSE_PRODUCTS.forEach((p, i) => { p.rps = nice(p.cost / (UNIVERSE_PAYBACK0 * Math.pow(UNIVERSE_PAYBACK_GROWTH, i))); });

// ---------------------------------------------------------------------------
// DZIAŁY — kręgi cytadeli. Pierwsi są kartografowie, badania prowadzą kosmolodzy.
// ---------------------------------------------------------------------------
export const UNIVERSE_DEPTS = [
  { id: 'cartographers', name: 'Kartografowie kosmosu', icon: '🗺️', color: '#67e8f9', unlock: 0, base: 1e38, g: 1.2,
    desc: 'Rysują mapy rzeczy, które dopiero powstają. Każdy kartograf podnosi przychody i siłę kreacji.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickFlat', v: 2.5e37 }],
    ups: ['Mapa całego nieba', 'Atlas kosmicznej sieci', 'Mapa rzeczy niewidzialnych'], upIcons: ['🧭', '📘', '👁️'] },
  { id: 'cosmologists', name: 'Kosmolodzy', icon: '🧮', color: '#a78bfa', unlock: 2e40, base: 8e39, g: 1.2,
    desc: 'Generują punkty badań kosmicznych. Liczą wszystko, od początku czasu do jego końca.',
    per: [{ t: 'rp', v: 0.3 }],
    ups: ['Mapa promieniowania tła', 'Symulacja Wielkiego Wybuchu', 'Teleskop na krańcu czasu'], upIcons: ['🌡️', '💥', '🔭'] },
  { id: 'ambassadors', name: 'Ambasadorzy galaktyk', icon: '🤝', color: '#f9a8d4', unlock: 7e41, base: 3e41, g: 1.2,
    desc: 'Negocjują z całymi galaktykami naraz. Podnoszą przychody i siłę kreacji.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickMult', v: 0.05 }],
    ups: ['Protokół międzygalaktyczny', 'Szczyt Grupy Lokalnej', 'Pokój w gromadzie Panny'], upIcons: ['📜', '🏔️', '🕊️'] },
  { id: 'replicators', name: 'Roje replikatorów', icon: '🐜', color: '#94a3b8', unlock: 5e42, base: 2e42, g: 1.2, tech: 'galaxyMergers',
    desc: 'Budują gromady same, kopia za kopią. Każdy rój to automatyczna kreacja.',
    per: [{ t: 'income', v: 0.003 }, { t: 'auto', v: 0.2 }],
    ups: ['Replikator z ciemnej materii', 'Rój wielkości galaktyki', 'Rój, który projektuje rój'], upIcons: ['⚙️', '🌀', '🧬'] },
  { id: 'brokers', name: 'Maklerzy czasoprzestrzeni', icon: '💹', color: '#4ade80', unlock: 3e43, base: 1e43, g: 1.2,
    desc: 'Otwierają zlecenia od cywilizacji całego kosmosu. Co 25 osób — kolejne miejsce na zlecenie.',
    per: [{ t: 'income', v: 0.003 }, { t: 'contract', v: 0.01, cap: 2 }, { t: 'slotEvery', v: 25 }],
    ups: ['Giełda w każdej gromadzie', 'Kontrakty terminowe na przeszłość', 'Waluta oparta na entropii'], upIcons: ['📈', '⏪', '🌡️'] },
  { id: 'immortals', name: 'Nieśmiertelni', icon: '♾️', color: '#38bdf8', unlock: 1e45, base: 4e44, g: 1.2,
    desc: 'Załoga, która nie umiera, pracuje także wtedy, gdy Ciebie nie ma. Więcej zarobku offline.',
    per: [{ t: 'income', v: 0.005 }, { t: 'offlineEff', v: 0.004, cap: 0.45 }],
    ups: ['Kopia zapasowa umysłu', 'Ciało z gwiazdy neutronowej', 'Pamięć na miliard lat'], upIcons: ['💾', '⭐', '🧠'] },
  { id: 'tribunal', name: 'Trybunał kosmiczny', icon: '⚖️', color: '#e5c07b', unlock: 7e46, base: 2e46, g: 1.2,
    desc: 'Rozstrzyga spory o prawa fizyki. Werdykty obowiązują w całym wszechświecie. Otwiera przejęcia.',
    per: [{ t: 'income', v: 0.003 }, { t: 'acqCost', v: 0.008, cap: 0.5 }],
    ups: ['Konwencja o stałych fizycznych', 'Sąd ostatniej instancji', 'Konstytucja kosmosu'], upIcons: ['📕', '🏛️', '🌌'] },
  { id: 'chrononauts', name: 'Chrononauci', icon: '⏱️', color: '#fbbf24', unlock: 7e48, base: 2e48, g: 1.2, tech: 'chronoTech',
    desc: 'Tańsze produkty i premia dla czasoprzestrzeni. Kupują wszystko wczoraj, kiedy było taniej.',
    per: [{ t: 'prodCost', v: 0.005, cap: 0.5 }, { t: 'cat', cat: 'fabric', v: 0.01, cap: 3 }],
    ups: ['Zegarek, który chodzi w obie strony', 'Wycieczka do Wielkiego Wybuchu', 'Spotkanie z samym sobą'], upIcons: ['⌚', '💥', '🪞'] },
  { id: 'voidwalkers', name: 'Wędrowcy pustki', icon: '🌑', color: '#c4b5fd', unlock: 2.5e49, base: 8e48, g: 1.2, tech: 'bootesVoid',
    desc: 'Chodzą tam, gdzie nie ma niczego. Przynoszą więcej osobliwości z każdego nowego eonu.',
    per: [{ t: 'income', v: 0.003 }, { t: 'prestige', v: 0.01, cap: 2 }],
    ups: ['Latarka na pustkę', 'Mapa niczego', 'Dom w Pustce Wolarza'], upIcons: ['🔦', '🗺️', '🏠'] },
];

// ---------------------------------------------------------------------------
// TECHNOLOGIE — trzy ostatnie ery. Koszty rosną ×3,1 na technologię (2000 × 3,1^i), szybciej niż
// wcześniej, bo szerszy rynek szybciej podnosi budżet badawczy. Tunele
// czasoprzestrzenne otwierają Grupę Lokalną (Kardaszow 3,5), ciemna energia — typ IV,
// a wszechświaty potomne — multiwersum (Kardaszow 5).
// ---------------------------------------------------------------------------
export const UNIVERSE_ERAS = [
  { id: 14, name: 'Grupa Lokalna', icon: '🌀' },
  { id: 15, name: 'Kosmiczna sieć', icon: '🕸️' },
  { id: 16, name: 'Poza czasem', icon: '♾️' },
];

export const UNIVERSE_TECHS = [
  // Era 14: Grupa Lokalna
  { id: 'intergalactic', era: 14, name: 'Napęd międzygalaktyczny', icon: '🚀', cost: 2000, req: [], fx: [{ t: 'prod', id: 'quasars', x: 3 }, { t: 'click', x: 3 }],
    desc: 'Dwa i pół miliona lat świetlnych do Andromedy. Z tym napędem — przed obiadem.' },
  { id: 'wormholes', era: 14, name: 'Stabilne tunele czasoprzestrzenne', icon: '🕳️', cost: 6200, req: ['intergalactic'], fx: [{ t: 'unlockProduct', id: 'gates' }],
    desc: 'Tunel podtrzymywany egzotyczną materią. Nie zamyka się, nawet gdy ktoś trzaśnie drzwiami.' },
  { id: 'galaxyMergers', era: 14, name: 'Inżynieria zderzeń', icon: '💞', cost: 19000, req: ['intergalactic'], fx: [{ t: 'unlockProduct', id: 'mergers' }, { t: 'unlockDept', id: 'replicators' }],
    desc: 'Galaktyki zderzają się tak, jak chcesz, a gwiazdy prawie nigdy się nie stykają.' },
  { id: 'andromedaLink', era: 14, name: 'Most do Andromedy', icon: '🌉', cost: 60000, req: ['wormholes'], fx: [{ t: 'prod', id: 'gates', x: 4 }, { t: 'rp', x: 1.5 }],
    desc: 'Stałe połączenie z sąsiednią galaktyką. Bilion gwiazd po drugiej stronie czeka na ofertę.' },
  { id: 'darkMatterTech', era: 14, name: 'Detektory ciemnej materii', icon: '🌑', cost: 1.8e5, req: ['galaxyMergers'], fx: [{ t: 'unlockProduct', id: 'darkmatter' }],
    desc: 'Po stu latach szukania: jest. I to dużo. Bardzo dużo.' },
  { id: 'darkEnergy', era: 14, name: 'Okiełznana ciemna energia', icon: '🌌', cost: 5.7e5, req: ['andromedaLink', 'darkMatterTech'], fx: [{ t: 'cat', cat: 'clusters', x: 3 }, { t: 'rp', x: 2 }],
    desc: 'Siła, która rozpycha cały wszechświat, pracuje teraz dla Ciebie. Cywilizacja typu IV.' },
  { id: 'hubbleBrake', era: 14, name: 'Hamulec Hubble’a', icon: '🛑', cost: 1.8e6, req: ['darkEnergy'], fx: [{ t: 'prodCost', x: 0.85 }, { t: 'all', x: 1.5 }],
    desc: 'Spowalniasz rozszerzanie się wszechświata, żeby klienci nie odpływali za horyzont.' },
  // Era 15: kosmiczna sieć
  { id: 'filamentRails', era: 15, name: 'Koleje po włóknach', icon: '🕸️', cost: 5.5e6, req: ['hubbleBrake'], fx: [{ t: 'unlockProduct', id: 'filaments' }],
    desc: 'Tory układane wzdłuż włókien gazu między gromadami. Najdłuższa linia kolejowa w historii.' },
  { id: 'laniakea', era: 15, name: 'Supergromada Laniakea', icon: '🌊', cost: 1.7e7, req: ['filamentRails'], fx: [{ t: 'hireCost', x: 0.8 }, { t: 'prod', id: 'filaments', x: 3 }],
    desc: 'Sto tysięcy galaktyk w jednym „niezmierzonym niebie”. Twój nowy rynek wewnętrzny.' },
  { id: 'greatAttractor', era: 15, name: 'Wielki Atraktor', icon: '🧲', cost: 5.3e7, req: ['laniakea'], fx: [{ t: 'all', x: 2 }, { t: 'cat', cat: 'fabric', x: 2 }],
    desc: 'Coś ciągnie wszystkie galaktyki w okolicy. Teraz ciągnie je do Twoich sklepów.' },
  { id: 'vacuumEnergy', era: 15, name: 'Energia próżni', icon: '⚡', cost: 1.6e8, req: ['laniakea'], fx: [{ t: 'unlockProduct', id: 'vacuum' }],
    desc: 'Kwantowe fluktuacje w pustej przestrzeni zamienione w prąd. Nic jeszcze nie było tak cenne.' },
  { id: 'chronoTech', era: 15, name: 'Inżynieria czasu', icon: '⏳', cost: 5.1e8, req: ['greatAttractor'], fx: [{ t: 'unlockProduct', id: 'timeloops' }, { t: 'unlockDept', id: 'chrononauts' }],
    desc: 'Czas to tylko jeszcze jeden wymiar. Da się go zwinąć, zapętlić i wynająć.' },
  { id: 'bootesVoid', era: 15, name: 'Zasiedlenie Pustki Wolarza', icon: '⬛', cost: 1.6e9, req: ['vacuumEnergy'], fx: [{ t: 'cat', cat: 'fabric', x: 2 }, { t: 'unlockDept', id: 'voidwalkers' }],
    desc: 'Trzysta milionów lat świetlnych niczego. Najlepsza działka pod nową inwestycję.' },
  { id: 'ftlThought', era: 15, name: 'Myśl szybsza niż światło', icon: '💭', cost: 4.9e9, req: ['greatAttractor', 'vacuumEnergy'], fx: [{ t: 'click', x: 4 }, { t: 'auto', v: 8 }],
    desc: 'Pomysł dociera na drugi koniec kosmosu, zanim skończysz go wymyślać.' },
  // Era 16: poza czasem
  { id: 'pocketUniverses', era: 16, name: 'Wszechświaty kieszonkowe', icon: '🫧', cost: 1.5e10, req: ['ftlThought'], fx: [{ t: 'unlockProduct', id: 'pocket' }],
    desc: 'Odrobina fałszywej próżni w butelce. Po otwarciu powstaje nowy kosmos.' },
  { id: 'falseVacuum', era: 16, name: 'Kontrola fałszywej próżni', icon: '🫙', cost: 4.7e10, req: ['chronoTech', 'pocketUniverses'], fx: [{ t: 'prodCost', x: 0.8 }, { t: 'cat', cat: 'creation', x: 3 }],
    desc: 'Rzecz, która mogłaby zniszczyć wszystko, zamknięta w bezpiecznym słoiku. Z etykietą.' },
  { id: 'theoryOfEverything', era: 16, name: 'Teoria wszystkiego', icon: '📜', cost: 1.5e11, req: ['bootesVoid', 'pocketUniverses'], fx: [{ t: 'all', x: 2 }, { t: 'rp', x: 1.5 }],
    desc: 'Jedno równanie na koszulce. Wreszcie wiadomo, o co w tym wszystkim chodziło.' },
  { id: 'inflationEngine', era: 16, name: 'Silnik inflacji', icon: '🎈', cost: 4.5e11, req: ['falseVacuum'], fx: [{ t: 'cat', cat: 'creation', x: 3 }, { t: 'all', x: 1.5 }],
    desc: 'Rozdmuchuje maleńki zarodek do rozmiarów kosmosu w 10⁻³² sekundy. Ekonomiści też się boją.' },
  { id: 'babyUniverse', era: 16, name: 'Wszechświaty potomne', icon: '✨', cost: 1.4e12, req: ['inflationEngine'], fx: [{ t: 'unlockProduct', id: 'genesis' }, { t: 'all', x: 3 }],
    desc: 'Nowe wszechświaty z własnymi prawami fizyki. Multiwersum otwarte dla klientów.' },
  { id: 'heatDeath', era: 16, name: 'Odwrócenie śmierci cieplnej', icon: '🔥', cost: 4.3e12, req: ['babyUniverse'], fx: [{ t: 'all', x: 3 }],
    desc: 'Entropia już nie musi rosnąć. Gwiazdy mogą świecić dalej, a sklepy być otwarte.' },
  { id: 'lastQuestion', era: 16, name: 'Ostatnie pytanie', icon: '❓', cost: 1.3e13, req: ['babyUniverse', 'theoryOfEverything'], fx: [{ t: 'rp', x: 2 }, { t: 'all', x: 2 }],
    desc: 'Czy da się odwrócić entropię? Wreszcie jest dość danych na sensowną odpowiedź.' },
];

export const UNIVERSE_REPEAT = [
  { id: 'ru_web', name: 'Mapy kosmicznej sieci', icon: '🗺️', base: 500, g: 3.2, req: ['andromedaLink'], fx: [{ t: 'all', x: 1.12 }],
    desc: '+12% przychodu za każdy poziom.' },
  { id: 'ru_click', name: 'Szybsza kreacja', icon: '✴️', base: 300, g: 3, req: ['intergalactic'], fx: [{ t: 'click', x: 1.3 }],
    desc: '+30% siły kreacji za każdy poziom.' },
  { id: 'ru_science', name: 'Teleskopy na krańcu czasu', icon: '🔭', base: 2000, g: 3.5, req: ['darkEnergy'], fx: [{ t: 'rp', x: 1.15 }],
    desc: '+15% punktów badań za każdy poziom.' },
  { id: 'ru_ops', name: 'Rekrutacja z innych eonów', icon: '🛸', base: 5e4, g: 4, req: ['laniakea'], fx: [{ t: 'hireCost', x: 0.95 }],
    desc: 'Rekrutacja tańsza o 5% za każdy poziom.' },
];

// ---------------------------------------------------------------------------
// ULEPSZENIA ZA GOTÓWKĘ: życie w cytadeli i siła kreacji
// ---------------------------------------------------------------------------
export const UNIVERSE_CULTURE = [
  { id: 'u_coffee', name: 'Kawa z początku czasu', icon: '☕', cost: 4e41, x: 1.15, desc: 'Ziarna zebrane tuż po Wielkim Wybuchu. Bardzo mocna.' },
  { id: 'u_window', name: 'Okno na kosmiczną sieć', icon: '🪟', cost: 2e43, x: 1.2, desc: 'Widok na włókna galaktyk. Uspokaja lepiej niż akwarium.' },
  { id: 'u_garden', name: 'Ogród z mgławic', icon: '🌷', cost: 1e45, x: 1.2, desc: 'Kwiaty rosną z pyłu po supernowych. Pachną żelazem.' },
  { id: 'u_retreat', name: 'Wyjazd integracyjny do innego wszechświata', icon: '🧳', cost: 5e46, x: 1.3, desc: 'Inne prawa fizyki, ta sama karaoke.' },
  { id: 'u_library', name: 'Biblioteka wszystkich książek', icon: '📚', cost: 2.5e48, x: 1.3, desc: 'Każda możliwa książka. Katalog zajmuje trzy galaktyki.' },
  { id: 'u_party', name: 'Impreza na końcu wszechświata', icon: '🎉', cost: 1.5e50, x: 1.5, desc: 'Restauracja z widokiem na koniec wszystkiego. Rezerwacja wczoraj.' },
  { id: 'u_nap', name: 'Drzemka na eon', icon: '😴', cost: 7e51, x: 1.6, desc: 'Budzisz się, a wszechświat ma nowy kształt. Kawa wciąż ciepła.' },
  { id: 'u_choir', name: 'Chór promieniowania tła', icon: '🎶', cost: 4e53, x: 1.8, desc: 'Echo Wielkiego Wybuchu zaśpiewane na cztery głosy.' },
  { id: 'u_desk', name: 'Biurko z horyzontu zdarzeń', icon: '🖤', cost: 2e55, x: 2, desc: 'Co na nie położysz, już tam zostanie. Porządek gwarantowany.' },
  { id: 'u_sunday', name: 'Niedziela poza czasem', icon: '🕰️', cost: 1e57, x: 2.5, desc: 'Trwa tyle, ile chcesz. Poniedziałek nie nadchodzi.' },
  { id: 'u_light', name: 'Pierwsze światło nowego kosmosu', icon: '🌅', cost: 5e58, x: 3, desc: 'Cała firma ogląda wschód pierwszej gwiazdy w nowym wszechświecie.' },
];

export const UNIVERSE_CLICK = [
  { id: 'uk_spark', name: 'Iskra kreacji', icon: '✴️', cost: 2e41, x: 3, desc: 'Jedno dotknięcie i coś powstaje z niczego.' },
  { id: 'uk_wand', name: 'Różdżka grawitacyjna', icon: '🪄', cost: 1e43, x: 3, desc: 'Machniesz — gwiazdy same się układają.' },
  { id: 'uk_pulse', name: 'Puls kwazara', icon: '💓', cost: 5e44, x: 1, pct: 0.006, desc: 'Każda kreacja daje dodatkowo 0,6% przychodu na sekundę.' },
  { id: 'uk_lens', name: 'Soczewka grawitacyjna', icon: '🔍', cost: 3e46, x: 4, desc: 'Powiększa każde kliknięcie o całą gromadę.' },
  { id: 'uk_swarm', name: 'Rój galaktyk na kliknięcie', icon: '🐝', cost: 1.5e48, x: 6, desc: 'Jedno dotknięcie, tysiąc nowych galaktyk.' },
  { id: 'uk_echo', name: 'Echo Wielkiego Wybuchu', icon: '📣', cost: 7e49, x: 1, pct: 0.012, desc: 'Każda kreacja daje dodatkowo 1,2% przychodu na sekundę.' },
  { id: 'uk_loop', name: 'Kliknięcie w pętli czasu', icon: '🔁', cost: 4e51, x: 12, desc: 'Klikasz raz, liczy się milion razy. Poniedziałek się powtarza.' },
  { id: 'uk_thought', name: 'Kreacja myślą', icon: '🧠', cost: 2e53, x: 1, pct: 0.012, desc: 'Wystarczy pomyśleć o nowej galaktyce.' },
  { id: 'uk_word', name: 'Słowo, które tworzy', icon: '💬', cost: 1e55, x: 12, desc: '„Niech się stanie”. I się staje.' },
];

// ---------------------------------------------------------------------------
// PRZEJĘCIA (z Trybunałem kosmicznym)
// ---------------------------------------------------------------------------
export const UNIVERSE_ACQUISITIONS = [
  { id: 'ua_quasarad', name: 'Kwazar Media', icon: '📺', cost: 2e47, fx: [{ t: 'prod', id: 'quasars', x: 5 }, { t: 'prod', id: 'gates', x: 3 }], desc: 'Agencja reklamowa, której billboardy widać od 12 miliardów lat.' },
  { id: 'ua_merger', name: 'Zderzenia i Wspólnicy', icon: '💍', cost: 5e47, fx: [{ t: 'cat', cat: 'clusters', x: 3 }], desc: 'Kancelaria od fuzji. Dosłownie galaktycznych.' },
  { id: 'ua_wimp', name: 'WIMP Mining Corp.', icon: '⛏️', cost: 2.5e48, fx: [{ t: 'prod', id: 'darkmatter', x: 4 }], desc: 'Pierwsi znaleźli ciemną materię. Nikt im nie wierzył.' },
  { id: 'ua_rails', name: 'Koleje Włókniste', icon: '🚄', cost: 2.5e49, fx: [{ t: 'prod', id: 'filaments', x: 4 }], desc: 'Punktualni co do miliona lat.' },
  { id: 'ua_casimir', name: 'Casimir & Synowie', icon: '🔋', cost: 2.5e50, fx: [{ t: 'prod', id: 'vacuum', x: 4 }, { t: 'prodCost', x: 0.9 }], desc: 'Rodzinna firma, która od pokoleń sprzedaje nic.' },
  { id: 'ua_tardis', name: 'Budka Czasu Sp. j.', icon: '📦', cost: 4e51, fx: [{ t: 'prod', id: 'timeloops', x: 4 }, { t: 'click', x: 4 }], desc: 'W środku większa niż na zewnątrz.' },
  { id: 'ua_multiverse', name: 'Multiwersum Holdings', icon: '🌐', cost: 1e53, fx: [{ t: 'cat', cat: 'creation', x: 4 }, { t: 'rp', x: 1.3 }], desc: 'Konkurencja z wszechświata obok. Od dziś — oddział.' },
];

// ---------------------------------------------------------------------------
// GALAKTYKI I GROMADY — ekspansja w kosmicznej sieci (jak biura na Ziemi: zostają na zawsze).
// x, y: położenie na mapie kosmicznej sieci (viewBox 360 × 184).
// ---------------------------------------------------------------------------
export const UNIVERSE_OFFICES = [
  { id: 'milkyway', icon: '🌌', kind: 'universe', x: 150, y: 104, cost: 1e39, hq: true, fx: [{ t: 'dept', id: 'cartographers', x: 1.15 }],
    name: 'Droga Mleczna', desc: 'Dom. Sto miliardów gwiazd i jedna firma, która je wszystkie zna po imieniu.' },
  { id: 'andromeda', icon: '💫', kind: 'universe', x: 176, y: 88, cost: 1e45, req: 'andromedaLink', fx: [{ t: 'rp', x: 1.15 }, { t: 'eventFreq', x: 1.05 }],
    name: 'Andromeda', desc: 'Bilion gwiazd i najbliższy duży sąsiad. Za cztery miliardy lat i tak byście się zderzyli.' },
  { id: 'triangulum', icon: '🔺', kind: 'universe', x: 196, y: 112, cost: 1e48, req: 'filamentRails', fx: [{ t: 'all', x: 1.15 }, { t: 'rp', x: 1.05 }],
    name: 'Galaktyka Trójkąta', desc: 'Trzecia co do wielkości w Grupie Lokalnej. Mała, ale ambitna.' },
  { id: 'virgo', icon: '🌀', kind: 'universe', x: 238, y: 66, cost: 1.5e50, req: 'vacuumEnergy', fx: [{ t: 'all', x: 1.2 }],
    name: 'Gromada w Pannie', desc: 'Dwa tysiące galaktyk w jednym miejscu. Największe centrum handlowe w okolicy.' },
  { id: 'bullet', icon: '💥', kind: 'universe', x: 92, y: 52, cost: 7e50, req: 'chronoTech', fx: [{ t: 'prodCost', x: 0.93 }],
    name: 'Gromada Pocisk', desc: 'Dwie gromady przeleciały przez siebie, a ciemna materia poszła dalej bez nich.' },
  { id: 'attractor', icon: '🧲', kind: 'universe', x: 278, y: 120, cost: 4e51, req: 'bootesVoid', fx: [{ t: 'cat', cat: 'fabric', x: 1.2 }],
    name: 'Wielki Atraktor', desc: 'Serce Laniakei. Wszystko tu spływa, łącznie z pieniędzmi.' },
  { id: 'bootes', icon: '⬛', kind: 'universe', x: 60, y: 130, cost: 5e53, req: 'theoryOfEverything', fx: [{ t: 'rp', x: 1.15 }],
    name: 'Pustka Wolarza', desc: 'Prawie nic na trzystu milionach lat świetlnych. Najcichsze laboratorium we wszechświecie.' },
  { id: 'hercules', icon: '🧱', kind: 'universe', x: 316, y: 40, cost: 7e54, req: 'theoryOfEverything', fx: [{ t: 'all', x: 1.3 }],
    name: 'Wielki Mur Herkulesa', desc: 'Największa struktura we wszechświecie: dziesięć miliardów lat świetlnych galaktyk.' },
  { id: 'edge', icon: '🌅', kind: 'universe', x: 330, y: 158, cost: 5e53, req: 'falseVacuum', fx: [{ t: 'cat', cat: 'creation', x: 1.2 }],
    name: 'Kraniec obserwowalnego wszechświata', desc: 'Dalej widać już tylko poświatę Wielkiego Wybuchu. Idealne miejsce na nowy oddział.' },
];
export const UNIVERSE_OFFICE_LEVEL_COST = 30;

// ---------------------------------------------------------------------------
// ZLECENIA (kontrakty) od cywilizacji całego kosmosu
// ---------------------------------------------------------------------------
export const UNIVERSE_CLIENTS = [
  ['Rada Grupy Lokalnej', '🌀'], ['Cywilizacja z Andromedy', '💫'], ['Uniwersytet Laniakei', '🎓'],
  ['Konsorcjum Gromady Panny', '🏦'], ['Wspólnota Pustki Wolarza', '⬛'], ['Obserwatorium Promieniowania Tła', '📡'],
  ['Kolekcjonerzy Wszechświatów', '🫧'], ['Bank Entropii', '🌡️'], ['Liga Kwazarów', '💡'],
  ['Ogrody Nowego Kosmosu', '🌷'], ['Muzeum Wielkiego Wybuchu', '🏛️'], ['Studio Snów Wielowymiarowych', '🎬'],
  ['Poczta Międzywszechświatowa', '📮'], ['Elektrownia Próżni', '⚡'],
];
export const UNIVERSE_TASKS = [
  'nową galaktykę', 'tunel do Andromedy', 'mapę kosmicznej sieci', 'zderzenie galaktyk', 'magazyn ciemnej materii', 'osłonę przed fałszywą próżnią',
  'pętlę czasu na weekend', 'wszechświat kieszonkowy', 'nowe prawa fizyki', 'wyścig przez Pustkę Wolarza', 'dostawę energii próżni',
  'Wielki Wybuch na rocznicę', 'przekaźnik na krańcu kosmosu', 'tłumacza dla innego wszechświata',
];

// ---------------------------------------------------------------------------
// ZASIĘG RYNKU Wszechświata (log10 $/s): zaczyna się ponad całą galaktyką (typ III z nadwyżką),
// era 14 kończy się na cywilizacji typu IV, era 16 — na multiwersum (Kardaszow 5).
// ---------------------------------------------------------------------------
export const UNIVERSE_REACH = {
  base: 38,
  ends: [43, 48, 53],
  firstEra: 14,
  soft: 0.3,
  maxOver: 100,
  stages: [{ era: 0, id: 'localGroup' }, { era: 15, id: 'cosmicWeb' }, { era: 16, id: 'universe' }],
};
export const UNIVERSE_TECH_CAP_STEP = reachSteps(UNIVERSE_TECHS, UNIVERSE_REACH).step;

// Badania z budżetu liczą się względem skali pieniędzy we wszechświecie (ref).
export const UNIVERSE_RD_BUDGET = { shares: [0, 0.1, 0.25, 0.5], k: 0.2, p: 0.4, ref: 1e36 };
// Nowy eon (reset Wszechświata): osobliwości zamiast kapitału inwestorów.
export const UNIVERSE_PRESTIGE = { div: 1e42, exp: 1 / 3, k: 10, bonus: 0.02 };
// Podstawowa siła jednej kreacji (kliknięcia).
export const UNIVERSE_CLICK_BASE = 1e38;

// Wiadomości na pasku, gdy firma działa we wszechświecie ({c} — nazwa firmy).
export const UNIVERSE_NEWS = [
  '{c} otwiera oddział w Andromedzie. Lokalni pytają o godziny otwarcia',
  'Kosmolodzy {c}: „Wielki Wybuch był głośniejszy, niż myśleliśmy”',
  'Kolejka do bramy międzygalaktycznej sięga Obłoku Magellana',
  'Pętla czasu {c} powtórzyła wczorajszy poniedziałek. Nikt nie zauważył',
  'Chrononauci przywieźli z przeszłości pamiątkę: pierwszą gwiazdę',
  'Ciemna materia wreszcie wykryta. Okazała się bardzo nieśmiała',
  'Wędrowcy pustki zgłaszają: w Pustce Wolarza jest jednak jedna kawiarnia',
  'Trybunał kosmiczny podtrzymał stałą Plancka. Bez zmian',
  'Klienci {c} zamawiają wszechświaty bez grawitacji. Dostawa unosi się sama',
  'Analitycy: „Multiwersum to tylko kwestia czasu. A czas już mamy”',
  'Kwazar z logo {c} widoczny z każdego miejsca we wszechświecie',
  'Ankieta: 93% galaktyk chce nowej konstytucji kosmosu',
  'Teoria wszystkiego zmieściła się na kubku do kawy',
  'Ktoś zadał komputerowi {c} ostatnie pytanie. Odpowiedź: „ZA MAŁO DANYCH”',
];
