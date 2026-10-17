// Cała zawartość gry: produkty, działy, technologie, ulepszenia, osiągnięcia.
// Plik nie dotyka DOM — importuje go zarówno gra, jak i symulator balansu.

export const CATEGORIES = {
  web: { name: 'Web', grad: ['#4facfe', '#00c6fb'] },
  mobile: { name: 'Mobile', grad: ['#a18cd1', '#e29be0'] },
  social: { name: 'Społeczności', grad: ['#f78ca0', '#f9748f'] },
  biz: { name: 'Biznes', grad: ['#43e97b', '#2bc8a0'] },
  infra: { name: 'Infrastruktura', grad: ['#5ee7df', '#6a8fd8'] },
  ai: { name: 'AI', grad: ['#667eea', '#8e54e9'] },
  deep: { name: 'Deep tech', grad: ['#fa709a', '#fdb75e'] },
};

// ---------------------------------------------------------------------------
// PRODUKTY (oprogramowanie) — główne źródło dochodu
// ---------------------------------------------------------------------------
// cost: koszt bazowy, rps: dochód na sekundę za 1 poziom, tech: wymagana technologia
export const PRODUCT_GROWTH = 1.15;
export const MILESTONES = [25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];

export const PRODUCTS = [
  { id: 'landing', name: 'Strona wizytówka', icon: '🌐', cat: 'web',
    desc: 'Prosta strona dla lokalnej piekarni. Każdy kiedyś zaczynał.',
    ups: ['Darmowy szablon', 'Własna domena', 'Certyfikat SSL', 'Formularz kontaktowy', 'Animacje przy przewijaniu', 'Kreator drag & drop', 'Strony generowane przez AI'] },
  { id: 'notes', name: 'Aplikacja do notatek', icon: '📝', cat: 'web',
    desc: 'Kolejna aplikacja do notatek. Ale ta jest naprawdę dobra.',
    ups: ['Synchronizacja w chmurze', 'Tryb ciemny', 'Tagi i foldery', 'Współdzielone notatki', 'Rozpoznawanie pisma', 'Notatki głosowe', 'Drugi mózg'] },
  { id: 'shop', name: 'Sklep internetowy', icon: '🛒', cat: 'web', tech: 'sql',
    desc: 'Sprzedawaj wszystko, wszystkim, zawsze.',
    ups: ['Koszyk zakupowy', 'Płatności online', 'Darmowa dostawa od 100 zł', 'Rekomendacje produktów', 'Zakupy jednym kliknięciem', 'Paczkomat w każdej wsi', 'Dostawa dronem'] },
  { id: 'mobile', name: 'Aplikacja mobilna', icon: '📱', cat: 'mobile', tech: 'smartphones',
    desc: 'Bo nikt już nie siedzi przy komputerze.',
    ups: ['Ikona nie do zignorowania', 'Logowanie odciskiem palca', 'Widżety na ekran główny', 'Tryb offline', 'Płynne 120 kl./s', 'Aplikacja na zegarek', 'Superaplikacja'] },
  { id: 'game', name: 'Gra mobilna', icon: '🎮', cat: 'mobile', tech: 'game2d',
    desc: 'Wciągająca jak serial, tylko z mikropłatnościami.',
    ups: ['Pixel art', 'Codzienne nagrody', 'Tabele wyników', 'Przepustka sezonowa', 'Tryb wieloosobowy', 'Liga e-sportowa', 'Gra roku'] },
  { id: 'messenger', name: 'Komunikator', icon: '💬', cat: 'social', tech: 'websockets',
    desc: 'Wiadomości szybsze niż plotki w biurze.',
    ups: ['Emoji', 'Naklejki', 'Szyfrowanie end-to-end', 'Rozmowy wideo', 'Znikające wiadomości', 'Tłumaczenie na żywo', 'Telepatyczne powiadomienia'] },
  { id: 'saas', name: 'Platforma SaaS', icon: '🧩', cat: 'biz', tech: 'saasModel',
    desc: 'Oprogramowanie jako usługa. Abonament jako styl życia.',
    ups: ['Darmowy okres próbny', 'Plan Pro', 'Integracje API', 'Logowanie jednym kontem', 'Plan Enterprise', 'Marketplace wtyczek', 'Platforma platform'] },
  { id: 'erp', name: 'System ERP', icon: '🏢', cat: 'biz', tech: 'microservices',
    desc: 'Korporacje kochają tabelki. Ty kochasz ich budżety.',
    ups: ['Moduł faktur', 'Moduł magazynowy', 'Raporty dla zarządu', 'Wdrożenie w korporacji', 'Certyfikacja ISO', 'ERP w chmurze', 'Autonomiczne przedsiębiorstwo'] },
  { id: 'social', name: 'Portal społecznościowy', icon: '👥', cat: 'social', tech: 'socialGraph',
    desc: 'Łączy ludzi. I ich dane.',
    ups: ['Przycisk „Lubię to”', 'Hasztagi', 'Relacje 24h', 'Krótkie wideo', 'Algorytm rekomendacji', 'Influencerzy na kontraktach', 'Sieć, bez której nie da się żyć'] },
  { id: 'streaming', name: 'Serwis streamingowy', icon: '🎬', cat: 'social', tech: 'video',
    desc: 'Jeszcze jeden odcinek… i jeszcze jeden…',
    ups: ['Buforowanie bez przerw', 'Rozdzielczość 4K', 'Własne produkcje', 'Profile rodzinne', 'Autoodtwarzanie następnego', 'Premiery światowe', 'Filmy generowane na żądanie'] },
  { id: 'search', name: 'Wyszukiwarka', icon: '🔍', cat: 'web', tech: 'indexing',
    desc: 'Odpowiedź na każde pytanie w 0,3 sekundy.',
    ups: ['Ranking stron', 'Autouzupełnianie', 'Wyszukiwanie obrazem', 'Wyniki lokalne', 'Odpowiedzi natychmiastowe', 'Wyszukiwanie głosowe', 'Wie, zanim zapytasz'] },
  { id: 'fintech', name: 'Bank cyfrowy', icon: '💳', cat: 'biz', tech: 'payments',
    desc: 'Bank bez okienek, kolejek i godzin otwarcia.',
    ups: ['Konto w 5 minut', 'Płatności zbliżeniowe', 'Przelewy natychmiastowe', 'Inwestowanie w aplikacji', 'Karta z metalu', 'Licencja w 30 krajach', 'Waluta korporacyjna'] },
  { id: 'cloud', name: 'Chmura obliczeniowa', icon: '☁️', cat: 'infra', tech: 'virtualization',
    desc: 'Cudze serwery? Nie, teraz to Twoje serwery.',
    ups: ['Maszyny wirtualne', 'Równoważenie obciążenia', 'Strefy dostępności', 'Kontenery zarządzane', 'Region w każdym kraju', 'Chłodzenie wodą morską', 'Centra danych w Arktyce'] },
  { id: 'ai', name: 'Asystent AI', icon: '🤖', cat: 'ai', tech: 'transformers',
    desc: 'Pisze maile, kod i wiersze. Czasem nawet poprawnie.',
    ups: ['Lepszy prompt', 'Dłuższy kontekst', 'Multimodalność', 'Agenci', 'Rozumowanie krok po kroku', 'Pamięć długotrwała', 'Asystent, który ma asystenta'] },
  { id: 'cars', name: 'Autonomiczne auta', icon: '🚗', cat: 'ai', tech: 'vision',
    desc: 'Kierowca? Jaki kierowca?',
    ups: ['Lidar', 'Mapy HD', 'Tryb autostradowy', 'Flota robotaksówek', 'Jazda w śnieżycy', 'Bez kierownicy', 'Parkowanie na Księżycu'] },
  { id: 'os', name: 'System operacyjny', icon: '🖥️', cat: 'infra', tech: 'kernel',
    desc: 'Wszystko działa na Twoim systemie. Dosłownie wszystko.',
    ups: ['Menedżer okien', 'Sklep z aplikacjami', 'Aktualizacje w tle', 'Ciemny motyw systemowy', 'Jądro czasu rzeczywistego', 'Działa na wszystkim', 'System, który się nie zawiesza'] },
  { id: 'quantum', name: 'Komputer kwantowy', icon: '⚛️', cat: 'deep', tech: 'qec',
    desc: 'Jednocześnie działa i nie działa. Ale głównie działa.',
    ups: ['Kriostat', '100 kubitów', 'Stabilne splątanie', 'Kwantowa chmura', 'Milion kubitów', 'Kwantowy internet', 'Obliczenia w wieloświecie'] },
  { id: 'bci', name: 'Interfejs mózg-komputer', icon: '🧠', cat: 'deep', tech: 'bciTech',
    desc: 'Myślisz — dzieje się.',
    ups: ['Nieinwazyjny czepek', 'Pisanie myślami', 'Pamięć w chmurze', 'Wspólne sny', 'Nauka przez sen', 'Telepatia w abonamencie', 'Kolektywna świadomość'] },
];

// Koszty i przychody produktów liczone wzorem: każdy kolejny produkt jest ~13× droższy,
// a jego czas zwrotu rośnie ×2,4 — dzięki temu nowe produkty nie zjadają starych od razu.
export const PRODUCT_COST_RATIO = 13;
export const PRODUCT_PAYBACK0 = 100;
export const PRODUCT_PAYBACK_GROWTH = 2.4;
const nice = (x) => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
// Od serwisu streamingowego ceny liczą się od zasięgu rynku (patrz ZASIĘG RYNKU niżej).
PRODUCTS.forEach((p, i) => {
  p.cost = nice(15 * Math.pow(PRODUCT_COST_RATIO, i));
  p.rps = nice(p.cost / (PRODUCT_PAYBACK0 * Math.pow(PRODUCT_PAYBACK_GROWTH, i)));
});

// Progi i mnożniki kosztu ulepszeń produktów. Pierwsze 7 ma własne nazwy (p.ups),
// kolejne to „wersje” produktu na późną grę — nazwy z szablonu w i18n (up.tierN).
export const PRODUCT_UP_TIERS = [
  { at: 1, cost: 10, x: 2 },
  { at: 10, cost: 200, x: 2 },
  { at: 25, cost: 5000, x: 2 },
  { at: 50, cost: 5e5, x: 2 },
  { at: 100, cost: 1e9, x: 2 },
  { at: 150, cost: 1e12, x: 2 },
  { at: 200, cost: 1e15, x: 3 },
  { at: 300, cost: 1e21, x: 3 },
  { at: 400, cost: 1e27, x: 3 },
  { at: 500, cost: 1e33, x: 3 },
  { at: 600, cost: 1e39, x: 3 },
  { at: 800, cost: 1e51, x: 3 },
  { at: 1000, cost: 1e63, x: 4 },
];
export const PRODUCT_UP_NAMED = 7;

// ---------------------------------------------------------------------------
// DZIAŁY — piętra w budynku, każdy pracownik daje efekt
// ---------------------------------------------------------------------------
export const DEPT_MILESTONES = [25, 50, 100, 150, 200, 300, 400, 500];
export const DEPT_MILESTONE_X = 1.25;

export const DEPTS = [
  { id: 'dev', name: 'Programiści', icon: '👩‍💻', color: '#6c8cff', unlock: 0, base: 40, g: 1.2,
    desc: 'Serce firmy. Każdy programista podnosi przychody i siłę kodowania.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickFlat', v: 0.25 }],
    ups: ['Code review', 'Programowanie w parach', 'Czysty kod'], upIcons: ['🔍', '👯', '✨'] },
  { id: 'rnd', name: 'Badania i rozwój', icon: '🔬', color: '#b07cff', unlock: 400, base: 150, g: 1.2,
    desc: 'Generują punkty badań, za które odkrywasz nowe technologie.',
    per: [{ t: 'rp', v: 0.3 }],
    ups: ['Tablica do burzy mózgów', 'Współpraca z uczelnią', 'Laboratorium badawcze'], upIcons: ['🧑‍🔬', '🎓', '🧪'] },
  { id: 'design', name: 'Design i UX', icon: '🎨', color: '#ff7ab6', unlock: 5000, base: 2000, g: 1.2,
    desc: 'Piękne aplikacje sprzedają się lepiej. Wzmacniają też kodowanie.',
    per: [{ t: 'income', v: 0.003 }, { t: 'clickMult', v: 0.05 }],
    ups: ['Biblioteka komponentów', 'Badania z użytkownikami', 'Nagroda za design'], upIcons: ['🧱', '🔎', '🏆'] },
  { id: 'marketing', name: 'Marketing', icon: '📣', color: '#ffb74d', unlock: 60000, base: 25000, g: 1.2,
    desc: 'Większy zasięg i częstsze wydarzenia viralowe.',
    per: [{ t: 'income', v: 0.005 }, { t: 'eventFreq', v: 0.01, cap: 1.5 }],
    ups: ['Kampania w social mediach', 'Ambasadorzy marki', 'Reklama w finale mundialu'], upIcons: ['📲', '🌟', '⚽'] },
  { id: 'sales', name: 'Sprzedaż', icon: '🤝', color: '#4dd0a1', unlock: 8e5, base: 3e5, g: 1.2,
    desc: 'Odblokowuje kontrakty B2B. Co 25 handlowców — dodatkowe miejsce na kontrakt.',
    per: [{ t: 'income', v: 0.003 }, { t: 'contract', v: 0.01, cap: 2 }, { t: 'slotEvery', v: 25 }],
    ups: ['System CRM', 'Konferencje branżowe', 'Klienci korporacyjni'], upIcons: ['📇', '🎤', '🏦'] },
  { id: 'support', name: 'Obsługa klienta', icon: '🎧', color: '#4fc3f7', unlock: 1e7, base: 4e6, g: 1.2,
    desc: 'Zadowoleni klienci zostają na dłużej. Więcej zarobku offline.',
    per: [{ t: 'income', v: 0.005 }, { t: 'offlineEff', v: 0.004, cap: 0.45 }],
    ups: ['Baza wiedzy', 'Chatbot wsparcia', 'Wsparcie 24/7'], upIcons: ['📚', '💬', '🌍'] },
  { id: 'hr', name: 'HR i rekrutacja', icon: '🧑‍💼', color: '#f48fb1', unlock: 1.5e8, base: 6e7, g: 1.2,
    desc: 'Tańsza rekrutacja we wszystkich działach.',
    per: [{ t: 'income', v: 0.002 }, { t: 'hireCost', v: 0.008, cap: 0.6 }],
    ups: ['Employer branding', 'Program poleceń', 'Benefity premium'], upIcons: ['🏷️', '📨', '🎁'] },
  { id: 'devops', name: 'DevOps', icon: '⚙️', color: '#90a4ae', unlock: 3e9, base: 1e9, g: 1.2, tech: 'ci',
    desc: 'Automatyzacja! Każdy inżynier dodaje automatyczne kliknięcia.',
    per: [{ t: 'income', v: 0.003 }, { t: 'auto', v: 0.2 }],
    ups: ['Infrastruktura jako kod', 'Monitoring 24/7', 'Chaos engineering'], upIcons: ['📜', '📟', '🐒'] },
  { id: 'finance', name: 'Finanse', icon: '💼', color: '#ffd54f', unlock: 5e10, base: 2e10, g: 1.2,
    desc: 'Tańsze produkty i dłuższe zarabianie offline.',
    per: [{ t: 'prodCost', v: 0.005, cap: 0.5 }, { t: 'offlineCap', v: 600 }],
    ups: ['Optymalizacja kosztów', 'Hedging walutowy', 'Skarbiec korporacyjny'], upIcons: ['📉', '💱', '🏦'] },
  { id: 'data', name: 'Data Science', icon: '📊', color: '#7986cb', unlock: 1e11, base: 3e10, g: 1.2, tech: 'bigdata',
    desc: 'Mnóstwo punktów badań i bonus do produktów AI.',
    per: [{ t: 'rp', v: 1.5 }, { t: 'cat', cat: 'ai', v: 0.01, cap: 3 }],
    ups: ['Hurtownia danych', 'Własny superkomputer', 'Model świata'], upIcons: ['🗄️', '🖲️', '🌍'] },
  { id: 'legal', name: 'Dział prawny', icon: '⚖️', color: '#bcaaa4', unlock: 3e11, base: 1e11, g: 1.2,
    desc: 'Otwiera przejęcia innych firm i obniża ich koszt.',
    per: [{ t: 'income', v: 0.003 }, { t: 'acqCost', v: 0.008, cap: 0.5 }],
    ups: ['Portfel patentów', 'Zespół fuzji i przejęć', 'Kancelaria na każdym kontynencie'], upIcons: ['📜', '🤝', '🌐'] },
  { id: 'security', name: 'Cyberbezpieczeństwo', icon: '🛡️', color: '#e57373', unlock: 2e12, base: 5e11, g: 1.2, tech: 'qcrypto',
    desc: 'Bezpieczne produkty to droższe produkty.',
    per: [{ t: 'income', v: 0.006 }],
    ups: ['Bug bounty', 'Zero trust', 'Red team'], upIcons: ['🐛', '🔐', '🟥'] },
  { id: 'board', name: 'Zarząd i strategia', icon: '🏛️', color: '#ffd700', unlock: 1e13, base: 3e12, g: 1.2,
    desc: 'Więcej kapitału od inwestorów przy kolejnej rundzie finansowania.',
    per: [{ t: 'income', v: 0.003 }, { t: 'prestige', v: 0.01, cap: 2 }],
    ups: ['Rada doradcza', 'Strateg z Doliny Krzemowej', 'Wizjoner na czele'], upIcons: ['🧭', '🌉', '🔭'] },
];

export const DEPT_UP_TIERS = [
  { at: 10, costHires: 40, x: 1.3 },
  { at: 40, costHires: 60, x: 1.3 },
  { at: 100, costHires: 80, x: 1.5 },
  { at: 200, costHires: 100, x: 1.5 },
  { at: 300, costHires: 120, x: 1.5 },
  { at: 500, costHires: 150, x: 2 },
];
// Ikony ulepszeń działów ponad trzy nazwane (wspólne dla wszystkich działów).
export const DEPT_UP_EXTRA_ICONS = ['🏅', '🌍', '👑'];

// ---------------------------------------------------------------------------
// TECHNOLOGIE — drzewko badań. Zostają po rundzie finansowania!
// ---------------------------------------------------------------------------
export const ERAS = [
  { id: 1, name: 'Era Internetu', icon: '🌐' },
  { id: 2, name: 'Rewolucja mobilna', icon: '📱' },
  { id: 3, name: 'Społeczności i SaaS', icon: '💬' },
  { id: 4, name: 'Chmura i Big Data', icon: '☁️' },
  { id: 5, name: 'Sztuczna inteligencja', icon: '🤖' },
  { id: 6, name: 'Era kwantowa', icon: '⚛️' },
  { id: 7, name: 'Neurotechnologia', icon: '🧠' },
];

export const TECHS = [
  // Era 1
  { id: 'html', era: 1, name: 'HTML i CSS', icon: '🏷️', cost: 10, req: [], fx: [{ t: 'prod', id: 'landing', x: 2 }],
    desc: 'Fundament sieci. Znaczniki, style i dużo frustracji z centrowaniem.' },
  { id: 'js', era: 1, name: 'JavaScript', icon: '📜', cost: 25, req: ['html'], fx: [{ t: 'click', x: 2 }, { t: 'prod', id: 'notes', x: 2 }],
    desc: 'Język, który miał powstać w 10 dni. I tak wygląda.' },
  { id: 'sql', era: 1, name: 'Relacyjne bazy danych', icon: '🗃️', cost: 50, req: ['html'], fx: [{ t: 'unlockProduct', id: 'shop' }],
    desc: 'SELECT * FROM pieniadze WHERE wlasciciel = ty;' },
  { id: 'git', era: 1, name: 'Kontrola wersji', icon: '🌿', cost: 90, req: ['js'], fx: [{ t: 'dept', id: 'dev', x: 1.5 }],
    desc: 'Koniec z plikami „final_final_v3_naprawde.zip”.' },
  { id: 'backend', era: 1, name: 'Programowanie backendu', icon: '🧰', cost: 140, req: ['sql'], fx: [{ t: 'prod', id: 'shop', x: 2 }, { t: 'prod', id: 'landing', x: 2 }],
    desc: 'Serwery, które odpowiadają. Zazwyczaj.' },
  { id: 'seo', era: 1, name: 'Pozycjonowanie SEO', icon: '📈', cost: 200, req: ['js'], fx: [{ t: 'all', x: 1.1 }, { t: 'eventFreq', x: 1.15 }],
    desc: 'Pierwsze miejsce w wynikach. Drugie nikogo nie obchodzi.' },
  // Era 2
  { id: 'ajax', era: 2, name: 'Dynamiczne strony', icon: '⚡', cost: 450, req: ['js', 'backend'], fx: [{ t: 'prod', id: 'notes', x: 2 }, { t: 'prod', id: 'shop', x: 2 }],
    desc: 'Strony, które nie przeładowują się przy każdym kliknięciu.' },
  { id: 'smartphones', era: 2, name: 'Smartfony', icon: '📱', cost: 700, req: ['js'], fx: [{ t: 'unlockProduct', id: 'mobile' }],
    desc: 'Komputer w kieszeni. Świat już nie będzie taki sam.' },
  { id: 'responsive', era: 2, name: 'Responsywny design', icon: '📐', cost: 1100, req: ['smartphones'], fx: [{ t: 'dept', id: 'design', x: 1.5 }, { t: 'cat', cat: 'mobile', x: 2 }],
    desc: 'Wygląda dobrze na każdym ekranie. Nawet na lodówce.' },
  { id: 'game2d', era: 2, name: 'Silniki gier 2D', icon: '🕹️', cost: 1800, req: ['smartphones'], fx: [{ t: 'unlockProduct', id: 'game' }],
    desc: 'Sprite’y, fizyka i nieskończona liczba poziomów z cukierkami.' },
  { id: 'push', era: 2, name: 'Powiadomienia push', icon: '🔔', cost: 2800, req: ['smartphones'], fx: [{ t: 'prod', id: 'mobile', x: 2 }, { t: 'prod', id: 'game', x: 2 }],
    desc: '„Tęsknimy za Tobą!” — wysłane 3 minuty po zamknięciu aplikacji.' },
  { id: 'agile', era: 2, name: 'Metodyki zwinne', icon: '🔄', cost: 4000, req: ['git'], fx: [{ t: 'all', x: 1.15 }, { t: 'hireCost', x: 0.9 }],
    desc: 'Sprinty, stand-upy i karteczki samoprzylepne na każdej ścianie.' },
  // Era 3
  { id: 'websockets', era: 3, name: 'Komunikacja w czasie rzeczywistym', icon: '🔌', cost: 7000, req: ['ajax'], fx: [{ t: 'unlockProduct', id: 'messenger' }],
    desc: 'Dane płyną w obie strony. Natychmiast.' },
  { id: 'saasModel', era: 3, name: 'Model subskrypcyjny', icon: '🔁', cost: 11000, req: ['backend', 'agile'], fx: [{ t: 'unlockProduct', id: 'saas' }],
    desc: 'Po co sprzedawać raz, skoro można co miesiąc?' },
  { id: 'microservices', era: 3, name: 'Mikroserwisy', icon: '🧱', cost: 18000, req: ['saasModel'], fx: [{ t: 'unlockProduct', id: 'erp' }, { t: 'prod', id: 'saas', x: 2 }],
    desc: 'Jeden monolit to za mało problemów. Zróbmy ich 200.' },
  { id: 'socialGraph', era: 3, name: 'Graf społecznościowy', icon: '🕸️', cost: 30000, req: ['websockets'], fx: [{ t: 'unlockProduct', id: 'social' }],
    desc: 'Kto zna kogo, kto lubi co. Bezcenne.' },
  { id: 'abtest', era: 3, name: 'Testy A/B', icon: '🆎', cost: 45000, req: ['socialGraph'], fx: [{ t: 'dept', id: 'marketing', x: 1.5 }, { t: 'all', x: 1.1 }],
    desc: 'Niebieski przycisk czy zielony? Dane zdecydują.' },
  { id: 'ci', era: 3, name: 'Ciągła integracja (CI/CD)', icon: '🚦', cost: 65000, req: ['microservices'], fx: [{ t: 'auto', v: 1 }, { t: 'unlockDept', id: 'devops' }],
    desc: 'Wdrożenia w piątek po południu przestają być straszne. Prawie.' },
  // Era 4
  { id: 'video', era: 4, name: 'Kodeki wideo', icon: '🎞️', cost: 260000, req: ['websockets'], fx: [{ t: 'unlockProduct', id: 'streaming' }],
    desc: 'Film w 4K przez łącze, które pamięta modemy.' },
  { id: 'bigdata', era: 4, name: 'Big Data', icon: '🗄️', cost: 400000, req: ['microservices'], fx: [{ t: 'rp', x: 2 }, { t: 'unlockDept', id: 'data' }],
    desc: 'Tyle danych, że nikt nie wie, co z nimi zrobić. Na razie.' },
  { id: 'indexing', era: 4, name: 'Indeksowanie sieci', icon: '🕷️', cost: 640000, req: ['bigdata'], fx: [{ t: 'unlockProduct', id: 'search' }],
    desc: 'Pająki przeczesują internet, żebyś Ty nie musiał.' },
  { id: 'payments', era: 4, name: 'Płatności cyfrowe', icon: '💸', cost: 1e6, req: ['saasModel'], fx: [{ t: 'unlockProduct', id: 'fintech' }],
    desc: 'Pieniądze, które istnieją tylko jako liczby. Tak jak w tej grze.' },
  { id: 'virtualization', era: 4, name: 'Wirtualizacja i kontenery', icon: '📦', cost: 1.6e6, req: ['ci'], fx: [{ t: 'unlockProduct', id: 'cloud' }],
    desc: 'Komputer w komputerze w komputerze.' },
  { id: 'serverless', era: 4, name: 'Serverless', icon: '🪶', cost: 2.6e6, req: ['virtualization'], fx: [{ t: 'prod', id: 'cloud', x: 2 }, { t: 'prod', id: 'saas', x: 2 }, { t: 'prodCost', x: 0.9 }],
    desc: 'Serwery nadal są. Po prostu udajemy, że ich nie ma.' },
  // Era 5
  { id: 'ml', era: 5, name: 'Uczenie maszynowe', icon: '📉', cost: 7e6, req: ['bigdata'], fx: [{ t: 'rp', x: 1.5 }, { t: 'prod', id: 'search', x: 2 }],
    desc: 'Statystyka, tylko z lepszym PR-em.' },
  { id: 'dl', era: 5, name: 'Głębokie sieci neuronowe', icon: '🕸️', cost: 1.5e7, req: ['ml'], fx: [{ t: 'cat', cat: 'social', x: 2 }, { t: 'all', x: 1.15 }],
    desc: 'Warstwy, warstwy i jeszcze więcej warstw.' },
  { id: 'transformers', era: 5, name: 'Transformery', icon: '🔀', cost: 2.7e7, req: ['dl'], fx: [{ t: 'unlockProduct', id: 'ai' }],
    desc: 'Attention is all you need. I dużo kart graficznych.' },
  { id: 'llm', era: 5, name: 'Duże modele językowe', icon: '💭', cost: 4.8e7, req: ['transformers'], fx: [{ t: 'cat', cat: 'ai', x: 3 }, { t: 'clickPct', v: 0.01 }],
    desc: 'Model, który pisze lepiej niż połowa zespołu marketingu.' },
  { id: 'vision', era: 5, name: 'Widzenie komputerowe', icon: '👁️', cost: 7e7, req: ['dl'], fx: [{ t: 'unlockProduct', id: 'cars' }],
    desc: 'Komputer widzi kota. Wreszcie.' },
  { id: 'kernel', era: 5, name: 'Własne jądro systemu', icon: '🌰', cost: 1.2e8, req: ['virtualization'], fx: [{ t: 'unlockProduct', id: 'os' }],
    desc: 'Napisane od zera. Przez tydzień nikt nie spał.' },
  // Era 6
  { id: 'qubits', era: 6, name: 'Kubity nadprzewodzące', icon: '🧊', cost: 3e7, req: ['kernel'], fx: [{ t: 'rp', x: 1.5 }, { t: 'all', x: 1.1 }],
    desc: 'Zimniej niż w kosmosie. Dosłownie.' },
  { id: 'qec', era: 6, name: 'Kwantowa korekcja błędów', icon: '🩹', cost: 5.5e7, req: ['qubits'], fx: [{ t: 'unlockProduct', id: 'quantum' }],
    desc: 'Kubity są kapryśne. Teraz mniej.' },
  { id: 'qcrypto', era: 6, name: 'Kryptografia postkwantowa', icon: '🔐', cost: 1e8, req: ['qubits', 'payments'], fx: [{ t: 'prod', id: 'fintech', x: 3 }, { t: 'unlockDept', id: 'security' }],
    desc: 'Szyfry, których nie złamie nawet Twój komputer kwantowy.' },
  { id: 'qml', era: 6, name: 'Kwantowe uczenie maszynowe', icon: '🌀', cost: 1.6e8, req: ['qec', 'llm'], fx: [{ t: 'cat', cat: 'ai', x: 2 }, { t: 'rp', x: 2 }],
    desc: 'Dwa modne słowa w jednym. Inwestorzy szaleją.' },
  { id: 'supremacy', era: 6, name: 'Supremacja kwantowa', icon: '👑', cost: 2.8e8, req: ['qec'], fx: [{ t: 'prod', id: 'quantum', x: 3 }, { t: 'all', x: 1.2 }],
    desc: 'Obliczenie, które klasycznie trwałoby 10 000 lat.' },
  { id: 'photonic', era: 6, name: 'Procesory fotoniczne', icon: '💡', cost: 5e8, req: ['supremacy'], fx: [{ t: 'cat', cat: 'infra', x: 3 }],
    desc: 'Obliczenia z prędkością światła.' },
  // Era 7
  { id: 'connectome', era: 7, name: 'Mapowanie konektomu', icon: '🗺️', cost: 6e8, req: ['qml'], fx: [{ t: 'rp', x: 2 }],
    desc: 'Pełna mapa połączeń w mózgu. 86 miliardów neuronów, jeden arkusz.' },
  { id: 'bciTech', era: 7, name: 'Interfejsy neuronowe', icon: '🔗', cost: 1e9, req: ['connectome'], fx: [{ t: 'unlockProduct', id: 'bci' }],
    desc: 'Mózg rozmawia z komputerem. Bez klawiatury.' },
  { id: 'neuromorphic', era: 7, name: 'Chipy neuromorficzne', icon: '🔮', cost: 1.6e9, req: ['connectome', 'photonic'], fx: [{ t: 'cat', cat: 'ai', x: 3 }, { t: 'cat', cat: 'deep', x: 2 }],
    desc: 'Krzem, który myśli jak neurony.' },
  { id: 'thought', era: 7, name: 'Programowanie myślą', icon: '✨', cost: 2.5e9, req: ['bciTech'], fx: [{ t: 'click', x: 5 }, { t: 'auto', v: 5 }],
    desc: 'Pomyśl o funkcji — i już jest napisana. Z testami!' },
  { id: 'agi', era: 7, name: 'Ogólna sztuczna inteligencja', icon: '🧬', cost: 4e9, req: ['neuromorphic'], fx: [{ t: 'all', x: 2 }, { t: 'rp', x: 2 }],
    desc: 'Potrafi wszystko, co człowiek. Tylko szybciej i bez przerw na kawę.' },
];

// Badania powtarzalne — nieskończony zlew na punkty badań.
export const REPEAT_TECHS = [
  { id: 'r_opt', name: 'Optymalizacja kodu', icon: '🛠️', base: 500, g: 3.2, req: ['seo'], fx: [{ t: 'all', x: 1.1 }],
    desc: '+10% przychodu za każdy poziom.' },
  { id: 'r_click', name: 'Ergonomia pracy', icon: '🖐️', base: 300, g: 3, req: ['js'], fx: [{ t: 'click', x: 1.25 }],
    desc: '+25% siły kodowania za każdy poziom.' },
  { id: 'r_science', name: 'Metoda naukowa', icon: '🔭', base: 2000, g: 3.5, req: ['agile'], fx: [{ t: 'rp', x: 1.15 }],
    desc: '+15% punktów badań za każdy poziom.' },
  { id: 'r_ops', name: 'Sprawne procesy', icon: '🗂️', base: 5e4, g: 4, req: ['microservices'], fx: [{ t: 'hireCost', x: 0.95 }],
    desc: 'Rekrutacja tańsza o 5% za każdy poziom.' },
  { id: 'r_deals', name: 'Sztuka negocjacji', icon: '🤝', base: 2e5, g: 4, req: ['payments'], fx: [{ t: 'contract', x: 1.15 }],
    desc: '+15% nagród z kontraktów za każdy poziom.' },
];

// ---------------------------------------------------------------------------
// ULEPSZENIA ZA GOTÓWKĘ (poza ulepszeniami produktów i działów)
// ---------------------------------------------------------------------------
export const CULTURE_UPGRADES = [
  { id: 'c_pizza', name: 'Pizza w piątki', icon: '🍕', cost: 1000, x: 1.1, desc: 'Morale rośnie z każdym kawałkiem.' },
  { id: 'c_coffee', name: 'Ekspres do kawy', icon: '☕', cost: 2e4, x: 1.1, desc: 'Paliwo programistów.' },
  { id: 'c_foosball', name: 'Piłkarzyki', icon: '⚽', cost: 5e5, x: 1.15, desc: 'Obowiązkowe wyposażenie każdego startupu.' },
  { id: 'c_chill', name: 'Pokój relaksu', icon: '🛋️', cost: 1e7, x: 1.15, desc: 'Pufy, hamaki i zakaz rozmów o sprintach.' },
  { id: 'c_flex', name: 'Elastyczne godziny', icon: '⏰', cost: 5e8, x: 1.2, desc: 'Sowy i skowronki pracują w swoim rytmie.' },
  { id: 'c_dog', name: 'Firmowy pies', icon: '🐕', cost: 2e10, x: 1.2, desc: 'Oficjalnie: Chief Happiness Officer.' },
  { id: 'c_kombucha', name: 'Kombucha na kranie', icon: '🍹', cost: 2e11, x: 1.25, desc: 'Nikt nie wie, co to jest, ale wszyscy piją.' },
  { id: 'c_nomeet', name: 'Dzień bez spotkań', icon: '📵', cost: 1e12, x: 1.25, desc: 'W środy tylko kod. I cisza.' },
  { id: 'c_gym', name: 'Siłownia w biurze', icon: '🏋️', cost: 5e12, x: 1.3, desc: 'Silne ciało, silny kod.' },
  { id: 'c_garden', name: 'Ogród na dachu', icon: '🌿', cost: 2e13, x: 1.3, desc: 'Pomidory, zioła i spotkania na trawie.' },
  { id: 'c_chef', name: 'Kantyna z szefem kuchni', icon: '👨‍🍳', cost: 3e13, x: 1.4, desc: 'Lunch lepszy niż w restauracji.' },
  { id: 'c_4day', name: 'Czterodniowy tydzień pracy', icon: '📅', cost: 6e13, x: 1.5, desc: 'Wypoczęci ludzie robią lepsze rzeczy.' },
  { id: 'c_bali', name: 'Wyjazd integracyjny na Bali', icon: '🏝️', cost: 1.2e14, x: 1.5, desc: 'Cała firma. Dwa tygodnie. Laptopy zostają w domu.' },
  { id: 'c_happy', name: 'Zespół szczęśliwych ludzi', icon: '💖', cost: 2.5e14, x: 2, desc: 'Najlepsza technologia ze wszystkich.' },
];

export const CLICK_UPGRADES = [
  { id: 'k_keyboard', name: 'Mechaniczna klawiatura', icon: '⌨️', cost: 100, x: 2, desc: 'Klik-klak. Brzmi jak produktywność.' },
  { id: 'k_mouse', name: 'Ergonomiczna mysz', icon: '🖱️', cost: 1500, x: 2, desc: 'Nadgarstek mówi „dziękuję”.' },
  { id: 'k_monitor', name: 'Drugi monitor', icon: '🖥️', cost: 4e4, x: 2, desc: 'Na jednym kod, na drugim dokumentacja. Albo memy.' },
  { id: 'k_espresso', name: 'Podwójne espresso', icon: '☕', cost: 1e6, x: 1, pct: 0.005, desc: 'Każde kliknięcie daje dodatkowo 0,5% przychodu na sekundę.' },
  { id: 'k_anc', name: 'Słuchawki z redukcją szumów', icon: '🎧', cost: 3e7, x: 2, desc: 'Open space przestaje istnieć.' },
  { id: 'k_standing', name: 'Biurko do pracy na stojąco', icon: '🧍', cost: 2e9, x: 1, pct: 0.005, desc: 'Stoisz, więc kodujesz.' },
  { id: 'k_shortcuts', name: 'Skróty klawiszowe', icon: '⚡', cost: 1e11, x: 3, desc: 'Ctrl+C, Ctrl+V, Ctrl+$$$.' },
  { id: 'k_pair_ai', name: 'Programowanie w parze z AI', icon: '🤝', cost: 5e11, x: 1, pct: 0.01, desc: 'Ty piszesz pierwszą linijkę, AI resztę.' },
  { id: 'k_qkeyboard', name: 'Klawiatura kwantowa', icon: '🔮', cost: 2e12, x: 5, desc: 'Wciskasz wszystkie klawisze naraz.' },
  { id: 'k_neuro', name: 'Neurołącze do IDE', icon: '🧠', cost: 1e13, x: 1, pct: 0.01, desc: 'Myśl szybciej niż piszesz.' },
  { id: 'k_flow', name: 'Stan flow', icon: '🌊', cost: 4e13, x: 10, desc: 'Czas przestaje istnieć. Kod płynie.' },
  { id: 'k_midas', name: 'Palec Midasa', icon: '👆', cost: 1.5e14, x: 1, pct: 0.02, desc: 'Czego dotkniesz, zamienia się w przychód.' },
];

// ---------------------------------------------------------------------------
// PRZEJĘCIA — wielkie zakupy dostępne z działem prawnym
// ---------------------------------------------------------------------------
export const ACQUISITIONS = [
  { id: 'a_notatnik', name: 'Notesik.io', icon: '📒', cost: 1e11, fx: [{ t: 'prod', id: 'notes', x: 10 }, { t: 'prod', id: 'landing', x: 10 }], desc: 'Konkurencyjna appka do notatek. Teraz Twoja.' },
  { id: 'a_kurierek', name: 'Kurierek', icon: '📦', cost: 2e11, fx: [{ t: 'prod', id: 'shop', x: 5 }], desc: 'Startup logistyczny z flotą rowerów.' },
  { id: 'a_pixel', name: 'PixelPony Studio', icon: '🦄', cost: 4e11, fx: [{ t: 'prod', id: 'game', x: 4 }, { t: 'prod', id: 'mobile', x: 2 }], desc: 'Twórcy hitu „Kucyki kontra Kosmici”.' },
  { id: 'a_cwierkacz', name: 'Ćwierkacz', icon: '🐦', cost: 7e11, fx: [{ t: 'prod', id: 'messenger', x: 3 }, { t: 'prod', id: 'social', x: 2 }], desc: 'Krótkie wiadomości, długie dyskusje.' },
  { id: 'a_tabelka', name: 'Tabelka Systems', icon: '📋', cost: 1.2e12, fx: [{ t: 'cat', cat: 'biz', x: 2 }], desc: 'Arkusze kalkulacyjne dla korporacji.' },
  { id: 'a_kinoteka', name: 'Kinoteka', icon: '🍿', cost: 2e12, fx: [{ t: 'prod', id: 'streaming', x: 3 }], desc: 'Katalog 40 000 filmów i jeden dobry.' },
  { id: 'a_szukajka', name: 'Szukajka', icon: '🧭', cost: 3e12, fx: [{ t: 'prod', id: 'search', x: 3 }], desc: 'Druga najpopularniejsza wyszukiwarka w okolicy.' },
  { id: 'a_bankomacik', name: 'Bankomacik', icon: '🏧', cost: 5e12, fx: [{ t: 'prod', id: 'fintech', x: 3 }], desc: 'Neobank, który kochają studenci.' },
  { id: 'a_chmurka', name: 'ChmurkaSoft', icon: '⛅', cost: 8e12, fx: [{ t: 'prod', id: 'cloud', x: 3 }, { t: 'rp', x: 1.25 }], desc: 'Mała chmura z wielkimi ambicjami.' },
  { id: 'a_neuronik', name: 'Neuronik', icon: '🧬', cost: 1.2e13, fx: [{ t: 'cat', cat: 'ai', x: 3 }, { t: 'rp', x: 1.5 }], desc: 'Laboratorium AI z najlepszymi badaczami.' },
  { id: 'a_robotaxi', name: 'RoboTaxi', icon: '🚕', cost: 2e13, fx: [{ t: 'prod', id: 'cars', x: 3 }], desc: 'Taksówki bez taksówkarzy, za to z muzyką.' },
  { id: 'a_kubit', name: 'Kubit i Syn', icon: '🔮', cost: 4e13, fx: [{ t: 'prod', id: 'quantum', x: 3 }, { t: 'all', x: 1.25 }], desc: 'Rodzinna firma kwantowa od trzech pokoleń.' },
  { id: 'a_mindmeld', name: 'MindMeld Labs', icon: '🫧', cost: 1e14, fx: [{ t: 'prod', id: 'bci', x: 3 }, { t: 'click', x: 3 }], desc: 'Interfejsy neuronowe nowej generacji.' },
];

// ---------------------------------------------------------------------------
// RADA NADZORCZA — trwałe bonusy kupowane za udziały (waluta prestiżu)
// ---------------------------------------------------------------------------
export const PERKS = [
  { id: 'p_trust', name: 'Zaufanie inwestorów', icon: '📈', base: 5, g: 2.2, max: 20,
    desc: 'Każdy punkt kapitału daje +0,5 pp. więcej przychodu.', fx: [{ t: 'investorPct', v: 0.005 }] },
  { id: 'p_seed', name: 'Kapitał na start', icon: '💵', base: 2, g: 3, max: 10,
    desc: 'Każda nowa runda zaczyna się z gotówką (×1000 za poziom).', fx: [{ t: 'startCash', v: 1 }] },
  { id: 'p_click', name: 'Weteran kodu', icon: '⌨️', base: 1, g: 2, max: 25,
    desc: 'Siła kodowania ×2 za poziom.', fx: [{ t: 'click', x: 2 }] },
  { id: 'p_mentors', name: 'Mentorzy', icon: '🧑‍🏫', base: 3, g: 2.4, max: 10,
    desc: 'Efekty wszystkich działów +10% za poziom.', fx: [{ t: 'deptAll', x: 1.1 }] },
  { id: 'p_night', name: 'Nocna zmiana', icon: '🌙', base: 2, g: 2.5, max: 6,
    desc: 'Limit zarobku offline +4 godziny za poziom.', fx: [{ t: 'offlineCap', v: 4 * 3600 }] },
  { id: 'p_dream', name: 'Firma, która nie śpi', icon: '😴', base: 3, g: 2.5, max: 5,
    desc: 'Wydajność offline +10 pp. za poziom.', fx: [{ t: 'offlineEff', v: 0.1 }] },
  { id: 'p_brand', name: 'Silna marka', icon: '✨', base: 4, g: 2.4, max: 8,
    desc: 'Wydarzenia viralowe pojawiają się o 15% częściej i są o 15% silniejsze.', fx: [{ t: 'eventFreq', x: 1.15 }, { t: 'eventPower', x: 1.15 }] },
  { id: 'p_network', name: 'Sieć kontaktów', icon: '📇', base: 4, g: 2.3, max: 10,
    desc: 'Nagrody z kontraktów +25% za poziom.', fx: [{ t: 'contract', x: 1.25 }] },
  { id: 'p_academy', name: 'Akademia firmowa', icon: '🎓', base: 3, g: 2.4, max: 10,
    desc: 'Punkty badań +20% za poziom.', fx: [{ t: 'rp', x: 1.2 }] },
  { id: 'p_auto', name: 'Automatyzacja', icon: '🤖', base: 5, g: 2.5, max: 10,
    desc: '+3 automatyczne kliknięcia na sekundę za poziom.', fx: [{ t: 'auto', v: 3 }] },
  { id: 'p_head', name: 'Szybki start', icon: '🏁', base: 6, g: 3, max: 5,
    desc: 'Zaczynasz rundę z 10 poziomami pierwszych produktów (więcej z każdym poziomem).', fx: [{ t: 'startLevels', v: 10 }] },
  { id: 'p_hr', name: 'Opcje pracownicze', icon: '🧾', base: 4, g: 2.6, max: 8,
    desc: 'Zatrudnianie tańsze o 6% za poziom.', fx: [{ t: 'hireCost', x: 0.94 }] },
  { id: 'p_keys', name: 'Mechaniczne klawiatury', icon: '⌨️', base: 3, g: 2.3, max: 10,
    desc: 'Każde kodowanie daje dodatkowo 0,2% przychodu na sekundę za poziom.', fx: [{ t: 'clickPct', v: 0.002 }] },
  { id: 'p_bulk', name: 'Zakupy hurtowe', icon: '📦', base: 5, g: 2.5, max: 10,
    desc: 'Rozwój produktów tańszy o 3% za poziom.', fx: [{ t: 'prodCost', x: 0.97 }] },
  { id: 'p_sales', name: 'Biuro handlowe', icon: '🤝', base: 6, g: 4, max: 3,
    desc: '+1 miejsce na kontrakty za poziom.', fx: [{ t: 'slots', v: 1 }] },
  { id: 'p_scout', name: 'Zwiadowcy rynków', icon: '🧭', base: 4, g: 2.4, max: 8,
    desc: 'Biura i kolonie tańsze o 10% za poziom.', fx: [{ t: 'officeCost', x: 0.9 }] },
  { id: 'p_ma', name: 'Kancelaria M&A', icon: '⚖️', base: 5, g: 2.5, max: 6,
    desc: 'Przejęcia tańsze o 12% za poziom.', fx: [{ t: 'acqCost', x: 0.88 }] },
  { id: 'p_banker', name: 'Bankowcy inwestycyjni', icon: '🏦', base: 8, g: 2.6, max: 10,
    desc: 'Każda runda daje o 8% więcej kapitału za poziom.', fx: [{ t: 'prestige', x: 1.08 }] },
  { id: 'p_bridge', name: 'Most między światami', icon: '🌉', base: 10, g: 2.5, max: 10,
    desc: 'Zasilanie kolejnej warstwy dociera wzmocnione o 15% za poziom.', fx: [{ t: 'feedMult', v: 0.15 }] },
];

// Nazwy kolejnych rund finansowania (prestiż)
export const ROUND_NAMES = ['Pre-seed', 'Seed', 'Seria A', 'Seria B', 'Seria C', 'Seria D', 'Seria E', 'IPO',
  'Emisja wtórna', 'Megafuzja', 'Konglomerat', 'Imperium', 'Imperium planetarne', 'Imperium galaktyczne'];

export const COMPANY_STAGES = [
  { floors: 0, name: 'Garaż' },
  { floors: 2, name: 'Małe biuro' },
  { floors: 4, name: 'Piętro w biurowcu' },
  { floors: 7, name: 'Biurowiec' },
  { floors: 10, name: 'Wieżowiec' },
  { floors: 13, name: 'Kampus technologiczny' },
];

// ---------------------------------------------------------------------------
// ZDARZENIA: bąbelki, trendy rynkowe, kontrakty, wiadomości
// ---------------------------------------------------------------------------
export const BUBBLES = {
  viral: { icon: '🔥', name: 'Viral!', w: 40 },
  angel: { icon: '💰', name: 'Anioł biznesu', w: 30 },
  hackathon: { icon: '⚡', name: 'Hackathon', w: 20 },
  eureka: { icon: '💡', name: 'Eureka!', w: 12 },
};

export const CONTRACT_CLIENTS = [
  ['Piekarnia „Złoty Rogal”', '🥐'], ['Sieć sklepów Kropka', '🏪'], ['Szpital Miejski', '🏥'],
  ['Uczelnia Techniczna', '🎓'], ['Linie lotnicze Bocian Air', '✈️'], ['Klub piłkarski Orły', '⚽'],
  ['Urząd Spraw Cyfrowych', '🏛️'], ['Bank Pod Lipą', '🏦'], ['Startup FoodRocket', '🍔'],
  ['Agencja Kosmiczna Orion', '🚀'], ['Sieć kin Kinomania', '🎟️'], ['Fabryka robotów Mechanix', '🦾'],
  ['Zoo Miejskie', '🦒'], ['Teatr Wielki Bajt', '🎭'], ['Kolej Nadwiślańska', '🚆'],
  ['Apteki Zdrowie+', '💊'], ['Hotel Pod Chmurką', '🏨'], ['Studio filmowe Kadr', '🎬'],
  ['Kurier Błyskawica', '📮'], ['Elektrownia Słoneczna Sol', '🔆'], ['Winnica Pod Dębem', '🍇'],
  ['Schronisko Łapa w Łapę', '🐾'], ['Muzeum Techniki', '🏺'], ['Festiwal Dźwięki Lata', '🎶'],
];

export const CONTRACT_TASKS = [
  'system rezerwacji', 'aplikację lojalnościową', 'migrację do chmury', 'chatbota AI', 'panel analityczny',
  'audyt bezpieczeństwa', 'sklep internetowy', 'aplikację mobilną', 'system kolejkowy', 'platformę e-learningową',
  'rozkład jazdy na żywo', 'system płatności', 'sieć czujników IoT', 'nową stronę internetową', 'system biletowy',
  'grę promocyjną', 'portal dla klientów', 'automatyzację faktur', 'aplikację na zegarek', 'symulację kwantową',
];

// f: nagroda jako wielokrotność przychodu z czasu trwania kontraktu
export const CONTRACT_DURATIONS = [
  { s: 30, f: 1.2 }, { s: 60, f: 1 }, { s: 120, f: 0.9 }, { s: 300, f: 0.8 }, { s: 900, f: 0.65 }, { s: 1800, f: 0.55 },
];

export const NEWS = [
  'Analitycy: „{c} to najciekawszy startup tego roku”',
  'Programiści potwierdzają: „u mnie działa”',
  'Nowy raport: 9 na 10 spotkań mogło być mailem',
  'Rynek kawy rośnie razem z branżą IT',
  'Startup z garażu przejmuje startup z piwnicy',
  'Badanie: tryb ciemny nie zwiększa produktywności, ale wygląda lepiej',
  'Przełom! Ktoś w końcu zrozumiał wyrażenia regularne',
  'Rekruterzy szukają juniora z dziesięcioletnim doświadczeniem',
  'Wielka awaria! Ktoś zapomniał średnika',
  'Eksperci: chmura to po prostu komputer kogoś innego',
  'Wydano nowy framework JavaScript. Poprzedni miał już trzy tygodnie',
  'Prezes {c}: „Naszą misją jest zmieniać świat. I zarabiać”',
  'Agile coach zalecił więcej karteczek samoprzylepnych',
  'Konferencja technologiczna: 3 dni, 400 prelekcji, jedno działające Wi-Fi',
  'Robot sprzątający w {c} poprosił o podwyżkę',
  'Naukowcy: kubit jest jednocześnie w pracy i na urlopie',
  'Kot programisty przeszedł po klawiaturze i naprawił błąd',
  'Giełda reaguje entuzjastycznie na nowe logo {c}',
  'Statystyka: 73% statystyk w branży IT wymyślono na poczekaniu',
  'Księgowa {c} odkryła, że „chmura” to nie zjawisko pogodowe',
  'Stażysta wdrożył zmiany w piątek o 17:00. Wszystko działa. Nikt nie wie dlaczego',
  'Nowy trend: serwery bezserwerowe serwują serwisy',
  'Programiści odkryli trzecią trudną rzecz w informatyce. Zapomnieli jaką',
  '{c} ogłasza: od dziś pizza w każdy piątek, a nie tylko w piątki',
  'Superkomputer obliczył sens życia. Wynik: 42. Księgowość prosi o fakturę',
  'Zespół {c} twierdzi, że ten refaktoring jest ostatni',
  'Dział HR {c} wprowadza obowiązkowe drzemki',
  'Pogoda dla programistów: 100% szans na błędy w produkcji',
  'Inwestorzy szukają jednorożców. Konie odpadają w przedbiegach',
  'Sztuczna inteligencja napisała przebój lata. Ludzie nadal wolą disco polo',
  'Badanie: najlepsze pomysły powstają pod prysznicem i na spotkaniach, które się przeciągają',
  'Twoja mama pyta, czym właściwie zajmuje się {c}',
  'Ekspert: „Kluczem do sukcesu jest kawa. I trochę kodu”',
  'Rekord! W {c} nikt nie powiedział „synergia” przez cały tydzień',
];

export const TREND_TEMPLATES = [
  'Moda na „{p}”! Popyt rośnie ×{x}',
  'Influencerzy zachwyceni: {p} ×{x}',
  'Hossa w branży: {p} ×{x}',
  'Wszyscy o tym mówią: {p} ×{x}',
];

// ---------------------------------------------------------------------------
// ZASIĘG RYNKU — ile świat jest w stanie zapłacić. Każda technologia poszerza rynek o krok
// swojej ery; ponad zasięgiem przychód rośnie już tylko z potęgą `soft`. Na Ziemi (ery 1–7)
// sufit kończy się na kilku PKB świata; nieludzkie skale otwiera dopiero Kosmos (space.js).
// ends[k] = log10 zasięgu ($/s) po odkryciu wszystkich technologii ery firstEra+k.
// ---------------------------------------------------------------------------
export const MARKET_REACH = {
  base: 2.5,
  ends: [4.5, 6.8, 8, 9, 10, 10.5, 11],
  firstEra: 1,
  soft: 0.3,
  maxOver: 100, // nawet przy nasyceniu przychód nie przekroczy 100× zasięgu
  // nazwa rynku według najwyższej ery z odkrytą technologią
  stages: [{ era: 0, id: 'earth' }],
};

// Krok zasięgu każdej technologii (log10 $/s) i zasięg tuż przed jej odkryciem
// (przy badaniach w kolejności listy) — od niego liczą się ceny nowych produktów.
export function reachSteps(techs, reach) {
  const step = {};
  const before = {};
  let acc = reach.base;
  for (const t of techs) {
    const k = t.era - reach.firstEra;
    const n = techs.filter((x) => x.era === t.era).length;
    const prev = k === 0 ? reach.base : reach.ends[k - 1];
    step[t.id] = (reach.ends[k] - prev) / n;
    before[t.id] = acc;
    acc += step[t.id];
  }
  return { step, before };
}
export const { step: TECH_CAP_STEP, before: REACH_BEFORE } = reachSteps(TECHS, MARKET_REACH);
// Od serwisu streamingowego nowy produkt kosztuje ok. 10 minut przychodu z rynku, jaki firma ma,
// gdy go odblokowuje, a każdy kolejny zarabia ×2,2 więcej od poprzedniego.
export const PRODUCT_REACH_SECONDS = 600;
PRODUCTS.forEach((p, i) => {
  if (i < 9) return;
  p.cost = nice(Math.pow(10, REACH_BEFORE[p.tech]) * PRODUCT_REACH_SECONDS);
  p.rps = nice(PRODUCTS[i - 1].rps * 2.2);
});

// ---------------------------------------------------------------------------
// BUDŻET BADAWCZY — część przychodu idzie na badania. Badacze w działach rosną tylko
// logarytmicznie z gotówką, a budżet potęgowo: PB/s = k × (kwota/s)^p × mnożnik badań.
// Dzięki temu bogata firma bada szybciej, ale z malejącym zwrotem.
// ---------------------------------------------------------------------------
export const RD_BUDGET = { shares: [0, 0.1, 0.25, 0.5], k: 0.2, p: 0.4 };

// ---------------------------------------------------------------------------
// AUTOPILOT — moduły kupowane raz za udziały (💎), zostają na zawsze
// ---------------------------------------------------------------------------
export const AUTOPILOT = [
  { id: 'products', icon: '📦', cost: 2, name: 'Product manager na autopilocie',
    desc: 'Rozwija produkty, wybierając te, które najszybciej się zwracają.' },
  { id: 'upgrades', icon: '⬆️', cost: 2, name: 'Asystent zakupów',
    desc: 'Kupuje ulepszenia, gdy tylko Cię na nie stać.' },
  { id: 'hire', icon: '🧑‍💼', cost: 4, name: 'Rekruter AI',
    desc: 'Otwiera nowe działy i zatrudnia ludzi, zostawiając większość pieniędzy na produkty.' },
  { id: 'contracts', icon: '🤝', cost: 3, name: 'Opiekun klientów',
    desc: 'Przyjmuje najlepsze zapytania ofertowe, gdy zwolni się miejsce.' },
  { id: 'research', icon: '🔬', cost: 6, name: 'Dyrektor ds. badań',
    desc: 'Odkrywa najtańszą dostępną technologię, gdy starczy punktów badań.' },
  { id: 'bubbles', icon: '🫧', cost: 5, name: 'Łowca okazji',
    desc: 'Łapie bąbelki wydarzeń, gdy gra jest otwarta. Przydaje się w trybie zen.' },
  { id: 'offices', icon: '🌍', cost: 5, name: 'Dyrektor ekspansji',
    desc: 'Otwiera i rozbudowuje biura (w kosmosie kolonie), gdy kosztują najwyżej czwartą część gotówki.' },
  { id: 'acq', icon: '🧾', cost: 6, name: 'Bankier M&A',
    desc: 'Kupuje dostępne przejęcia, gdy kosztują najwyżej połowę gotówki.' },
  { id: 'decisions', icon: '🗳️', cost: 4, name: 'Rzecznik zarządu',
    desc: 'Po kilkunastu sekundach sam rozstrzyga decyzje, wybierając wariant wart więcej.' },
  { id: 'board', icon: '🕴️', cost: 8, name: 'Łowca głów',
    desc: 'Zatrudnia kandydatów na puste miejsca w zarządzie i lepszych od obecnych, wydając najwyżej trzecią część udziałów.' },
  { id: 'market', icon: '📈', cost: 7, name: 'Makler giełdowy',
    desc: 'Na Ziemi dokupuje udziały w konkurentach, gdy ich kurs jest niski, aż do przejęcia kontroli.' },
  { id: 'rounds', icon: '🔁', cost: 15, name: 'Autopilot rund',
    desc: 'Zamyka rundę, gdy podwoi ona kapitał (najwcześniej po 10 minutach rundy, nie w trakcie wyzwania).' },
];

// ---------------------------------------------------------------------------
// WYZWANIA INWESTORÓW — rundy z ograniczeniem i trwałą nagrodą za każdy poziom
// ---------------------------------------------------------------------------
// Cel poziomu: rząd wielkości Twojej najlepszej rundy × współczynnik (ale nie mniej niż próg minimalny).
export const CHALLENGE_GOALS = [1e7, 1e9, 1e11, 1e13, 1e15];
export const CHALLENGE_FACTORS = [0.5, 0.65, 0.8, 0.9, 1];
export const CHALLENGES = [
  { id: 'noclick', icon: '🙅', rule: 'noclick', name: 'Bez klawiatury',
    desc: 'Kodowanie i automatyczne kliknięcia nic nie dają.', fx: [{ t: 'all', x: 1.15 }] },
  { id: 'focus', icon: '🎯', rule: 'maxProducts', v: 5, name: 'Pełne skupienie',
    desc: 'Możesz wydać najwyżej 5 różnych produktów.', fx: [{ t: 'prodCost', x: 0.95 }] },
  { id: 'solo', icon: '🧑‍💻', rule: 'onlyDev', name: 'Jednoosobowa armia',
    desc: 'Nie możesz otwierać działów poza programistami.', fx: [{ t: 'deptAll', x: 1.1 }] },
  { id: 'bootstrap', icon: '🥾', rule: 'noInvestors', name: 'Bootstrapping',
    desc: 'Kapitał inwestorów nie zwiększa przychodu.', fx: [{ t: 'investorPct', v: 0.002 }] },
  { id: 'minimal', icon: '🪶', rule: 'noUpgrades', name: 'Minimalizm',
    desc: 'Nie możesz kupować ulepszeń.', fx: [{ t: 'rp', x: 1.2 }] },
  { id: 'crisis', icon: '📉', rule: 'noMilestones', name: 'Kryzys na rynkach',
    desc: 'Kamienie milowe produktów nie podwajają przychodu.', fx: [{ t: 'prestige', x: 1.1 }] },
];

// ---------------------------------------------------------------------------
// EKSPANSJA — biura na świecie i w kosmosie. Zostają na zawsze (także po rundach).
// Każdy kolejny poziom kosztuje ×OFFICE_LEVEL_COST więcej, a efekt działa tyle razy, ile jest poziomów.
// ---------------------------------------------------------------------------
export const OFFICE_MAX_LEVEL = 3;
export const OFFICE_LEVEL_COST = 20;
export const OFFICES = [
  { id: 'waw', icon: '🇵🇱', kind: 'earth', lat: 52.23, lon: 21.01, cost: 5e5, hq: true, fx: [{ t: 'dept', id: 'dev', x: 1.15 }],
    name: 'Warszawa', desc: 'Tu wszystko się zaczęło. Świetni programiści i najlepsze pierogi w promieniu tysiąca kilometrów.' },
  { id: 'ber', icon: '🇩🇪', kind: 'earth', lat: 52.52, lon: 13.4, cost: 2e6, req: 'agile', fx: [{ t: 'dept', id: 'design', x: 1.2 }, { t: 'all', x: 1.03 }],
    name: 'Berlin', desc: 'Startupy, galerie i kawa z owsianym mlekiem.' },
  { id: 'tyo', icon: '🇯🇵', kind: 'earth', lat: 35.68, lon: 139.69, cost: 5e8, req: 'game2d', fx: [{ t: 'cat', cat: 'mobile', x: 1.15 }],
    name: 'Tokio', desc: 'Stolica gier mobilnych i pociągów, które nigdy się nie spóźniają.' },
  { id: 'sfo', icon: '🌉', kind: 'earth', lat: 37.77, lon: -122.42, cost: 3e9, req: 'saasModel', fx: [{ t: 'cat', cat: 'biz', x: 1.15 }, { t: 'investorPct', v: 0.0005 }],
    name: 'San Francisco', desc: 'Dolina Krzemowa za rogiem. Inwestorzy na każdej kawie.' },
  { id: 'sel', icon: '🇰🇷', kind: 'earth', lat: 37.57, lon: 126.98, cost: 2e10, req: 'socialGraph', fx: [{ t: 'cat', cat: 'social', x: 1.15 }],
    name: 'Seul', desc: 'Najszybszy internet świata i fani, którzy zrobią z Twojej aplikacji hit.' },
  { id: 'blr', icon: '🇮🇳', kind: 'earth', lat: 12.97, lon: 77.59, cost: 3e10, req: 'microservices', fx: [{ t: 'hireCost', x: 0.95 }],
    name: 'Bengaluru', desc: 'Indyjska Dolina Krzemowa. Ogromna pula talentów.' },
  { id: 'sao', icon: '🇧🇷', kind: 'earth', lat: -23.55, lon: -46.63, cost: 1e11, req: 'socialGraph', fx: [{ t: 'eventFreq', x: 1.05 }, { t: 'dept', id: 'marketing', x: 1.15 }],
    name: 'São Paulo', desc: 'Największy rynek Ameryki Południowej. Kampanie roznoszą się tu jak samba.' },
  { id: 'lon', icon: '🇬🇧', kind: 'earth', lat: 51.51, lon: -0.13, cost: 5e11, req: 'payments', fx: [{ t: 'prod', id: 'fintech', x: 1.4 }, { t: 'contract', x: 1.1 }],
    name: 'Londyn', desc: 'Finansowe serce Europy. Herbata o piątej, przelewy natychmiast.' },
  { id: 'nyc', icon: '🗽', kind: 'earth', lat: 40.71, lon: -74.0, cost: 2e12, req: 'payments', fx: [{ t: 'valMult', v: 0.5 }, { t: 'acqCost', x: 0.9 }],
    name: 'Nowy Jork', desc: 'Wall Street wycenia Cię wyżej, kiedy masz biuro na Manhattanie.' },
  { id: 'lag', icon: '🇳🇬', kind: 'earth', lat: 6.52, lon: 3.38, cost: 3e12, req: 'payments', fx: [{ t: 'cat', cat: 'mobile', x: 1.1 }, { t: 'prod', id: 'fintech', x: 1.25 }],
    name: 'Lagos', desc: 'Najszybciej rosnący rynek mobilnych płatności na świecie.' },
  { id: 'syd', icon: '🇦🇺', kind: 'earth', lat: -33.87, lon: 151.21, cost: 4e12, req: 'video', fx: [{ t: 'offlineCap', v: 3600 }, { t: 'offlineEff', v: 0.04 }],
    name: 'Sydney', desc: 'Gdy Europa śpi, Sydney pracuje. Firma działa całą dobę.' },
  { id: 'sto', icon: '🇸🇪', kind: 'earth', lat: 59.33, lon: 18.07, cost: 6e12, req: 'video', fx: [{ t: 'prod', id: 'streaming', x: 1.4 }, { t: 'prod', id: 'game', x: 1.25 }],
    name: 'Sztokholm', desc: 'Muzyka w streamingu, gry i bardzo długie zimowe wieczory na kodowanie.' },
  { id: 'sin', icon: '🇸🇬', kind: 'earth', lat: 1.35, lon: 103.82, cost: 8e12, req: 'virtualization', fx: [{ t: 'prod', id: 'cloud', x: 1.4 }, { t: 'offlineEff', v: 0.03 }],
    name: 'Singapur', desc: 'Węzeł chmury dla całej Azji.' },
  { id: 'rkv', icon: '🇮🇸', kind: 'earth', lat: 64.15, lon: -21.94, cost: 1.2e13, req: 'bigdata', fx: [{ t: 'cat', cat: 'infra', x: 1.15 }, { t: 'prodCost', x: 0.98 }],
    name: 'Reykjavik', desc: 'Darmowe chłodzenie serwerów i zorza polarna nad parkingiem.' },
  { id: 'dxb', icon: '🇦🇪', kind: 'earth', lat: 25.2, lon: 55.27, cost: 2e13, req: 'serverless', fx: [{ t: 'contract', x: 1.15 }, { t: 'acqCost', x: 0.95 }],
    name: 'Dubaj', desc: 'Kontrakty podpisywane na 120. piętrze.' },
  { id: 'yyz', icon: '🇨🇦', kind: 'earth', lat: 43.65, lon: -79.38, cost: 4e13, req: 'dl', fx: [{ t: 'cat', cat: 'ai', x: 1.15 }, { t: 'rp', x: 1.05 }],
    name: 'Toronto', desc: 'Kolebka głębokiego uczenia. Badacze AI na każdym uniwersytecie.' },
  { id: 'zrh', icon: '🇨🇭', kind: 'earth', lat: 47.37, lon: 8.54, cost: 8e13, req: 'qubits', fx: [{ t: 'cat', cat: 'deep', x: 1.15 }, { t: 'prestige', x: 1.03 }],
    name: 'Zurych', desc: 'Laboratoria kwantowe, banki i widok na Alpy.' },
  { id: 'tlv', icon: '🇮🇱', kind: 'earth', lat: 32.08, lon: 34.78, cost: 1.5e14, req: 'qcrypto', fx: [{ t: 'dept', id: 'security', x: 1.2 }, { t: 'rp', x: 1.05 }],
    name: 'Tel Awiw', desc: 'Startupy cyberbezpieczeństwa na każdym rogu.' },
];

// ---------------------------------------------------------------------------
// GIEŁDA — po rundzie IPO. Konkurenci rosną razem z rynkiem (ich kapitalizacja to ułamek
// Twojej najwyższej wyceny), a kurs waha się z nastrojami inwestorów.
// Udziały dają premię dla kategorii konkurenta; 51% to przejęcie kontroli.
// ---------------------------------------------------------------------------
export const MARKET = {
  unlockRounds: 8, baseShare: 0.6, fee: 0.02, every: 30000, histMax: 60,
  sentMin: 0.7, sentMax: 1.35, revert: 0.04, shockChance: 0.015, sharesOut: 1e9,
  stakeBonus: 2, stakeCap: 0.5, control: 0.51, controlCat: 1.25, controlAll: 1.03,
};
export const COMPETITORS = [
  { id: 'pear', icon: '🍐', cat: 'mobile', k: 1.4, vol: 0.025, name: 'Gruszka Computers', ticker: 'GRSZ' },
  { id: 'macrohard', icon: '🪟', cat: 'infra', k: 1.2, vol: 0.02, name: 'Makrotwardy', ticker: 'MKTW' },
  { id: 'goggle', icon: '🔎', cat: 'web', k: 1.1, vol: 0.025, name: 'Gogle', ticker: 'GOGL' },
  { id: 'amazin', icon: '📦', cat: 'biz', k: 1, vol: 0.03, name: 'Amazonka', ticker: 'AMZK' },
  { id: 'envydia', icon: '🟩', cat: 'deep', k: 0.9, vol: 0.05, name: 'Envydia', ticker: 'ENVD' },
  { id: 'facepage', icon: '👍', cat: 'social', k: 0.7, vol: 0.035, name: 'Twarzoksiążka', ticker: 'TWKS' },
  { id: 'closedai', icon: '🤖', cat: 'ai', k: 0.5, vol: 0.06, name: 'ZamknięteAI', ticker: 'ZAI' },
  { id: 'spacey', icon: '🚀', cat: 'infra', k: 0.4, vol: 0.06, name: 'SpaceY', ticker: 'SPCY' },
  { id: 'notflix', icon: '🍿', cat: 'social', k: 0.3, vol: 0.04, name: 'Nietflix', ticker: 'NTFX' },
  { id: 'qleap', icon: '⚛️', cat: 'deep', k: 0.1, vol: 0.07, name: 'Skok Kwantowy', ticker: 'SKOK' },
];
export const MARKET_NEWS = {
  up: ['{n}: akcje +{p}% po premierze nowego produktu', '{n} bije rekordy na giełdzie: +{p}%', 'Analitycy zachwyceni wynikami {n}: +{p}%'],
  down: ['{n}: akcje −{p}% po awarii serwerów', 'Rozczarowujące wyniki {n}: −{p}%', '{n} traci {p}% po aferze z danymi'],
};

// ---------------------------------------------------------------------------
// ZARZĄD — pięć foteli (C-suite). Kandydaci przychodzą od headhuntera, płacisz udziałami (💎).
// Członkowie zarządu zostają na zawsze i nabierają doświadczenia z czasem (także offline).
// Cechy: efekty jak w reszcie gry; „x” to mnożnik, „v” dodatek. Dziwactwa wzmacniają cechy w określonych warunkach.
// ---------------------------------------------------------------------------
export const BOARD = {
  poolMax: 3, everyMin: 20, everyMax: 40, firstAfter: 60000, maxLevel: 10, levelStep: 0.1, costPerInvestor: 0.002,
  rarity: [
    { id: 'common', w: 70, mult: 1, traits: 1, cost: 3 },
    { id: 'rare', w: 25, mult: 1.6, traits: 2, cost: 10 },
    { id: 'legend', w: 5, mult: 2.5, traits: 2, cost: 30 },
  ],
};
export const ROLES = [
  { id: 'cto', icon: '🧑‍💻', color: '#6c8cff', name: 'CTO', area: 'technologia',
    traits: [{ t: 'click', x: 1.5 }, { t: 'rp', x: 1.15 }, { t: 'dept', id: 'dev', x: 1.3 }, { t: 'auto', v: 2 }] },
  { id: 'cfo', icon: '💼', color: '#ffd54f', name: 'CFO', area: 'finanse',
    traits: [{ t: 'prodCost', x: 0.93 }, { t: 'offlineEff', v: 0.05 }, { t: 'offlineCap', v: 3600 }, { t: 'valMult', v: 0.3 }] },
  { id: 'cmo', icon: '📣', color: '#ffb74d', name: 'CMO', area: 'marketing',
    traits: [{ t: 'eventFreq', x: 1.1 }, { t: 'eventPower', x: 1.15 }, { t: 'dept', id: 'marketing', x: 1.3 }, { t: 'cat', cat: 'social', x: 1.3 }] },
  { id: 'coo', icon: '⚙️', color: '#4dd0a1', name: 'COO', area: 'operacje',
    traits: [{ t: 'hireCost', x: 0.93 }, { t: 'contract', x: 1.2 }, { t: 'deptAll', x: 1.08 }, { t: 'offlineEff', v: 0.04 }] },
  { id: 'cpo', icon: '🧩', color: '#f472b6', name: 'CPO', area: 'produkt',
    traits: [{ t: 'all', x: 1.12 }, { t: 'cat', cat: 'web', x: 1.3 }, { t: 'cat', cat: 'mobile', x: 1.3 }, { t: 'cat', cat: 'ai', x: 1.3 }, { t: 'cat', cat: 'biz', x: 1.3 }] },
];
// Dziwactwa: when = warunek, x = siła cech, gdy warunek jest spełniony (xp = szybsza nauka).
export const QUIRKS = [
  { id: 'night', icon: '🦉', when: 'night', x: 2, name: 'Nocna zmiana', desc: 'Cechy działają podwójnie między 22:00 a 6:00.' },
  { id: 'morning', icon: '🐦', when: 'morning', x: 2, name: 'Poranny rytm', desc: 'Cechy działają podwójnie między 5:00 a 10:00.' },
  { id: 'weekend', icon: '🏖️', when: 'weekend', x: 1.75, name: 'Weekendowa energia', desc: 'Cechy ×1,75 w soboty i niedziele.' },
  { id: 'rain', icon: '🌧️', when: 'rain', x: 2, name: 'Deszczowe natchnienie', desc: 'Cechy działają podwójnie, gdy nad biurem pada deszcz albo śnieg.' },
  { id: 'winter', icon: '❄️', when: 'winter', x: 2, name: 'Zimowa forma', desc: 'Cechy działają podwójnie od grudnia do lutego.' },
  { id: 'coffee', icon: '☕', when: 'always', x: 1.15, name: 'Kawa przede wszystkim', desc: 'Cechy zawsze ×1,15.' },
  { id: 'fast', icon: '📚', when: 'xp', x: 2, name: 'Szybka nauka', desc: 'Zdobywa doświadczenie dwa razy szybciej.' },
];
// Imiona i nazwiska międzynarodowego zespołu (takie same w obu językach).
export const EXEC_NAMES = [
  'Anna Nowak', 'Kenji Watanabe', 'Priya Sharma', 'Lucas Martin', 'Zofia Wiśniewska', 'Diego Álvarez', 'Amara Okafor',
  'Ingrid Larsen', 'Tomasz Kowalczyk', 'Mei Chen', 'Oliver Brown', 'Fatima Haddad', 'Jakub Lewandowski', 'Sofia Rossi',
  'Noah Fischer', 'Aiko Tanaka', 'Mateusz Wójcik', 'Leila Moradi', 'Ethan Walker', 'Olga Petrova', 'Kwame Mensah',
  'Julia Mazur', 'Rafael Costa', 'Hanna Berg', 'Arjun Patel', 'Maja Kaczmarek', 'Lars Johansson', 'Chloé Dubois',
  'Piotr Zając', 'Nadia Rahman', 'Mateo García', 'Ewa Lis', 'Samuel Adeyemi', 'Yuna Park', 'Elena Popescu', 'Wiktor Krawczyk',
];

// ---------------------------------------------------------------------------
// SKALA CYWILIZACJI — roczny przychód porównany ze światem, potem skala Kardaszowa.
// Progi z „v” są w dolarach rocznie; progi z „k” to stopień w skali Kardaszowa.
// ---------------------------------------------------------------------------
// Ludzkość zużywa ok. 20 TW przy PKB ok. $110 bln rocznie → ok. 0,18 W na dolara rocznego PKB.
export const ENERGY_W_PER_USD = 0.18;
export const SCALE_LEVELS = [
  { v: 1e3, icon: '🪙', name: 'Kieszonkowe', desc: 'Tyle zarabia stoisko z lemoniadą przez wakacje.' },
  { v: 1e5, icon: '🥐', name: 'Osiedlowa piekarnia', desc: 'Przychody małej, lokalnej firmy.' },
  { v: 1e7, icon: '🏪', name: 'Sieć sklepów', desc: 'Średnia firma z kilkudziesięcioma pracownikami.' },
  { v: 1e9, icon: '🏢', name: 'Duża firma', desc: 'Miliard dolarów przychodu rocznie.' },
  { v: 1e11, icon: '🦄', name: 'Gigant technologiczny', desc: 'Pierwsza liga światowego biznesu.' },
  { v: 6e11, icon: '🏬', name: 'Największa firma świata', desc: 'Przychody największej korporacji na Ziemi (ponad $600 mld).' },
  { v: 9e11, icon: '🇵🇱', name: 'PKB Polski', desc: 'Cała polska gospodarka w ciągu roku (ok. $900 mld).' },
  { v: 2.9e13, icon: '🇺🇸', name: 'PKB USA', desc: 'Największa gospodarka świata (ok. $29 bln).' },
  { v: 1.1e14, icon: '🌍', name: 'PKB Ziemi', desc: 'Cała ludzkość razem wzięta (ok. $110 bln). ONZ prosi o spotkanie.' },
  { v: 4.5e14, icon: '💎', name: 'Majątek ludzkości', desc: 'Co roku zarabiasz tyle, ile jest wart cały dobytek ludzi: domy, firmy, akcje i oszczędności (ok. $450 bln).' },
  // Stopnie Kardaszowa to energia, nie pieniądze: wymagają technologii, która ją pozyska.
  { k: 1, icon: '⚡', name: 'Cywilizacja typu I', tech: 'satellites', desc: 'Skala Kardaszowa 1: cała energia docierająca do planety, zbierana przez elektrownie na orbicie.' },
  { k: 1.5, icon: '🪐', name: 'Imperium międzyplanetarne', tech: 'orbitalDC', desc: 'Gospodarka obejmuje planety i księżyce Układu Słonecznego.' },
  { k: 2, icon: '☀️', name: 'Cywilizacja typu II', tech: 'dyson', desc: 'Skala Kardaszowa 2: cała energia gwiazdy. Rój Dysona gotowy.' },
  { k: 2.5, icon: '✨', name: 'Gromada gwiazd', tech: 'vonNeumann', desc: 'Tysiące słońc pracuje dla jednej firmy.' },
  { k: 3, icon: '🌌', name: 'Cywilizacja typu III', tech: 'galacticNet', desc: 'Skala Kardaszowa 3: energia całej galaktyki.' },
  { k: 3.5, icon: '🔭', name: 'Grupa Lokalna', tech: 'wormholes', desc: 'Droga Mleczna, Andromeda i kilkadziesiąt mniejszych galaktyk.' },
  { k: 4, icon: '🕳️', name: 'Typ IV: wszechświat', tech: 'darkEnergy', desc: 'Firma zarządza całym obserwowalnym wszechświatem.' },
  { k: 5, icon: '♾️', name: 'Multiwersum', tech: 'babyUniverse', desc: 'Konkurencja? W tym wszechświecie już jej nie ma.' },
];

// ---------------------------------------------------------------------------
// DECYZJE — co jakiś czas firma staje przed wyborem. Obie opcje są dobre, tylko inne.
// fx: cash/rp = tyle minut przychodu/badań od ręki, delayed = gotówka po s sekundach,
//     boost/click/rpBoost = mnożnik x przez s sekund.
// ---------------------------------------------------------------------------
export const DECISIONS = [
  { id: 'bigtech', icon: '🐋', title: 'Gigant chce kupić Twój projekt poboczny',
    text: 'Mała aplikacja do planowania lunchu, napisana po godzinach, wpadła w oko korporacji z Doliny Krzemowej.',
    a: { label: 'Sprzedaj', fx: { t: 'cash', min: 20 } }, b: { label: 'Rozwijaj dalej', fx: { t: 'boost', x: 2, s: 1200 } } },
  { id: 'intern', icon: '🎓', title: 'Uczelnia proponuje program staży',
    text: 'Dziesięcioro studentów informatyki chce spędzić lato w Twojej firmie.',
    a: { label: 'Przyjmij stażystów', fx: { t: 'rp', min: 15 } }, b: { label: 'Zorganizuj hackathon', fx: { t: 'click', x: 10, s: 180 } } },
  { id: 'coffee', icon: '☕', title: 'Ekspres do kawy się zepsuł',
    text: 'Produktywność spada, a w kuchni zbiera się tłum. Ktoś już założył o tym wątek na firmowym czacie.',
    a: { label: 'Kup ekspres premium', fx: { t: 'boost', x: 1.5, s: 1800 } }, b: { label: 'Zrób z tego mema', fx: { t: 'delayed', min: 40, s: 900 } } },
  { id: 'influencer', icon: '📸', title: 'Influencerka chce zrecenzować Twoją aplikację',
    text: 'Ma trzy miliony obserwujących i bardzo szczere opinie.',
    a: { label: 'Daj jej dostęp przed premierą', fx: { t: 'boost', x: 3, s: 300 } }, b: { label: 'Zaproś ją do biura', fx: { t: 'cash', min: 12 } } },
  { id: 'conference', icon: '🎤', title: 'Zaproszenie na konferencję',
    text: 'Organizatorzy największej konferencji technologicznej w Europie mają jeszcze jedno wolne miejsce na scenie.',
    a: { label: 'Wystąp z prezentacją', fx: { t: 'delayed', min: 50, s: 1200 } }, b: { label: 'Wyślij zespół na warsztaty', fx: { t: 'rp', min: 15 } } },
  { id: 'opensource', icon: '🐙', title: 'Otworzyć kod biblioteki?',
    text: 'Zespół napisał świetną bibliotekę do animacji. Mogłaby być open source.',
    a: { label: 'Open source!', fx: { t: 'rpBoost', x: 2, s: 900 } }, b: { label: 'Sprzedawaj licencje', fx: { t: 'cash', min: 15 } } },
  { id: 'grant', icon: '🏛️', title: 'Grant na badania i rozwój',
    text: 'Fundusz innowacji ogłosił nabór. Wniosek ma tylko 84 strony.',
    a: { label: 'Złóż wniosek', fx: { t: 'delayed', min: 60, s: 1800 } }, b: { label: 'Szkoda czasu na papiery', fx: { t: 'boost', x: 2, s: 600 } } },
  { id: 'outage', icon: '🔥', title: 'Awaria u konkurencji',
    text: 'Serwery największego rywala leżą od rana. Ich klienci szukają alternatywy.',
    a: { label: 'Przyjmij nowych klientów', fx: { t: 'cash', min: 25 } }, b: { label: 'Pomóż im wstać', fx: { t: 'rp', min: 15 } } },
  { id: 'dog', icon: '🐕', title: 'Pies w biurze!',
    text: 'Ktoś przyprowadził do pracy golden retrievera. Nikt nie pracuje, wszyscy są szczęśliwi.',
    a: { label: 'Zostaje na stałe', fx: { t: 'boost', x: 1.25, s: 3600 } }, b: { label: 'Sesja zdjęciowa do social mediów', fx: { t: 'delayed', min: 30, s: 600 } } },
  { id: 'frontpage', icon: '🗞️', title: 'Jesteście na pierwszej stronie',
    text: 'Wpis Twojego CTO trafił na szczyt najpopularniejszego serwisu dla programistów.',
    a: { label: 'Odpowiadaj na komentarze', fx: { t: 'rp', min: 10 } }, b: { label: 'Ogłoś rekrutację', fx: { t: 'boost', x: 2, s: 900 } } },
  { id: 'pivot', icon: '🔄', title: 'Doradca sugeruje pivot',
    text: '„A może zróbmy to samo, tylko dla psów?”',
    a: { label: 'Zostańmy przy swoim', fx: { t: 'boost', x: 1.5, s: 1800 } }, b: { label: 'Przetestujmy nowy rynek', fx: { t: 'delayed', min: 60, s: 1800 } } },
  { id: 'loan', icon: '🤵', title: 'Fundusz proponuje finansowanie pomostowe',
    text: 'Pieniądze od ręki, warunki jak z podręcznika. Podejrzanie dobre.',
    a: { label: 'Bierzemy', fx: { t: 'cash', min: 30 } }, b: { label: 'Rośniemy organicznie', fx: { t: 'boost', x: 1.5, s: 2400 } } },
  { id: 'retreat', icon: '🏕️', title: 'Zespół marzy o wyjeździe integracyjnym',
    text: 'Głosowanie na czacie jest wyrównane: góry kontra plaża.',
    a: { label: 'Jedziemy w góry', fx: { t: 'rp', min: 15 } }, b: { label: 'Hackathon na plaży', fx: { t: 'click', x: 8, s: 240 } } },
  { id: 'award', icon: '🏆', title: 'Nominacja do nagrody Startup Roku',
    text: 'Jury zachwyciło się Waszym produktem. Teraz decydują głosy internautów.',
    a: { label: 'Ruszamy z kampanią', fx: { t: 'boost', x: 2, s: 900 } }, b: { label: 'Skupmy się na produkcie', fx: { t: 'cash', min: 15 } } },
  { id: 'aitests', icon: '🤖', title: 'Nowy model AI pisze testy',
    text: 'Programiści są podzieleni: połowa się cieszy, połowa się boi.',
    a: { label: 'Wdrażamy w całym zespole', fx: { t: 'click', x: 10, s: 180 } }, b: { label: 'Najpierw to zbadajmy', fx: { t: 'rp', min: 15 } } },
  { id: 'rain', icon: '🌧️', title: 'Ulewa nad miastem',
    text: 'Leje jak z cebra. Nikt nie wychodzi na lunch.',
    a: { label: 'Pizza dla wszystkich', fx: { t: 'boost', x: 1.5, s: 1200 } }, b: { label: 'Burza mózgów przy herbacie', fx: { t: 'rp', min: 10 } } },
  { id: 'mentor', icon: '🧓', title: 'Legendarny programista chce zostać mentorem',
    text: 'Napisał kompilator, zanim to było modne. Ma dwa warunki: kawa z ekspresu przelewowego i święty spokój.',
    a: { label: 'Mentoring dla juniorów', fx: { t: 'rpBoost', x: 2, s: 1200 } }, b: { label: 'Code review wszystkiego', fx: { t: 'boost', x: 1.5, s: 1800 } } },
  { id: 'cat', icon: '🐈', title: 'Kot przeszedł po klawiaturze',
    text: '…i przypadkiem zoptymalizował zapytanie do bazy danych. Czas odpowiedzi spadł o połowę.',
    a: { label: 'Zatrudnij kota', fx: { t: 'boost', x: 1.5, s: 1800 } }, b: { label: 'Napisz o tym artykuł', fx: { t: 'delayed', min: 35, s: 900 } } },
];
