// Teksty interfejsu w dwóch językach + wybór języka. Treść gry (produkty, technologie…)
// po angielsku jest w js/lang/en.js, po polsku w js/data.js.
let lang = 'pl';

export const LANGS = [['pl', 'Polski'], ['en', 'English']];

export function detectLang() {
  const nav = globalThis.navigator;
  const list = (nav && (nav.languages && nav.languages.length ? nav.languages : [nav.language])) || [];
  for (const l of list) {
    if (!l) continue;
    const code = String(l).toLowerCase();
    if (code.startsWith('pl')) return 'pl';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

export function setLang(l) { lang = l === 'en' ? 'en' : 'pl'; }
export function getLang() { return lang; }

const PL = {
  appName: 'Krzemowe Imperium',
  defaultCompany: 'Garażowy Startup',
  companyNames: ['Bajt i Synowie', 'Pixel & Spółka', 'Chmurka Software', 'Kod z Garażu', 'Nowa Dolina', 'Startup Marzeń'],

  'tab.office': 'Biuro', 'tab.products': 'Produkty', 'tab.team': 'Zespół', 'tab.research': 'Badania',
  'tab.upgrades': 'Ulepszenia', 'tab.company': 'Firma',
  'tap.label': 'Koduj', 'sound': 'Dźwięk',
  buyAll: 'Kup wszystkie', buyAllN: 'Kup wszystkie ({n})',
  'ct.investors': 'Inwestorzy', 'ct.contracts': 'Kontrakty', 'ct.acq': 'Przejęcia', 'ct.ach': 'Osiągnięcia',
  'ct.stats': 'Statystyki', 'ct.settings': 'Ustawienia',
  'unit.rp': 'PB',

  'off.firstStep': 'Pierwszy krok', 'off.collect': 'Zbierz {v}', 'off.toProducts': 'Produkty →',
  'off.team': 'Zespół', 'off.people': '{n} os.', 'off.research': 'Badania', 'off.products': 'Produkty',
  'off.levels': '{n} poz.', 'off.valuation': 'Wycena', 'off.offers': '🤝 Oferty: {n}', 'off.coding': 'Kodowanie',
  'badge.contracts': '🤝 Kontrakty: {n} · {t}',
  'news.offer': '🤝 <b>Nowe zapytanie ofertowe</b> — sprawdź Kontrakty w zakładce Firma',

  'prod.level': 'Poz. {n}', 'prod.income': '<b>+{v}/s</b> · {p} przychodu', 'prod.notReleased': 'Jeszcze nie wydany',
  'prod.milestone': '{n}/{m} · kamień milowy ×2', 'prod.allMilestones': 'Wszystkie kamienie milowe!',
  'prod.release': 'Wydaj', 'prod.buy': 'Kup ×{n}', 'prod.requires': 'Wymaga technologii:', goResearch: 'Badania →',

  'team.newFloor': 'Nowe piętro', 'team.openHint': 'Otwórz nowy dział — w budynku pojawi się kolejne piętro.',
  'team.open': 'Otwórz dział', 'team.hireFirst': 'Zatrudnij pierwszą osobę!', 'team.milestone': '{n}/{m} · efekty ×{x}',
  'team.full': 'Pełna obsada!', 'team.hire': 'Zatrudnij ×{n}',

  'fx.income': '{p} przychodu', 'fx.clickFlat': '+{v} do kodowania', 'fx.clickMult': '{p} siły kodowania',
  'fx.rp': '+{v} PB/s', 'fx.eventFreq': '{p} częstsze wydarzenia', 'fx.contract': '{p} nagród z kontraktów',
  'fx.slots': '{n} {noun} na kontrakty', 'fx.offlineEff': '{p} wydajności offline', 'fx.hireCost': '−{n}% kosztu rekrutacji',
  'fx.prodCost': '−{n}% kosztu produktów', 'fx.offlineCap': '+{t} limitu offline', 'fx.auto': '+{v} auto-kliknięć/s',
  'fx.cat': '{p} dla kategorii {c}', 'fx.acqCost': '−{n}% kosztu przejęć', 'fx.prestige': '{p} kapitału z rundy',

  'dfx.prod': '{name} ×{x}', 'dfx.cat': 'Kategoria {c} ×{x}', 'dfx.dept': 'Dział {d} ×{x}', 'dfx.deptAll': 'Wszystkie działy ×{x}',
  'dfx.all': 'Cały przychód ×{x}', 'dfx.click': 'Kodowanie ×{x}', 'dfx.clickPct': 'Klik +{p}% przychodu/s',
  'dfx.rp': 'Punkty badań ×{x}', 'dfx.hireCost': 'Rekrutacja −{n}%', 'dfx.prodCost': 'Produkty tańsze o {n}%',
  'dfx.eventFreq': 'Wydarzenia częściej ×{x}', 'dfx.auto': '+{n} auto-klik/s', 'dfx.unlockProduct': 'Odblokowuje: {name}',
  'dfx.unlockDept': 'Nowy dział: {name}',

  'up.prodDesc': '{name}: przychód ×{x}', 'up.deptDesc': 'Efekty działu „{name}” ×{x}', 'up.cultureDesc': '{desc} Cały przychód ×{x}.',
  'up.clickX': 'kodowanie ×{x}', 'up.clickPct': '+{p}% przychodu/s na klik',
  'up.none': 'Brak dostępnych ulepszeń. Rozwijaj produkty i działy — nowe ulepszenia pojawią się same. ✨',
  'up.owned': 'Kupione · {n}', 'up.bought': 'Kupiono {n} {noun}',

  'rs.points': 'Punkty badań', 'rs.techCount': '{n}/{m} technologii',
  'rs.needRnd': 'Otwórz dział <b>Badania i rozwój</b> w zakładce Zespół, żeby zdobywać punkty badań. 🔬',
  'rs.persist': 'Odkryte technologie zostają z Tobą także po rundzie finansowania.',
  'rs.lockedEra': 'Era {n}: {name}', 'rs.requires': 'Wymaga: {list}', 'rs.infinite': 'Badania bez końca', 'rs.level': 'poz. {n}',

  'inv.nextRound': 'Następna runda: {r}', 'inv.now': 'Obecnie {n} kapitału = przychód ×{x}',
  'inv.perPoint': 'Każdy punkt: +{p}% przychodu', 'inv.valuation': 'Wycena firmy', 'inv.assets': 'Majątek firmy',
  'inv.annual': 'Roczny przychód', 'inv.multiple': 'Mnożnik rynkowy', 'inv.run': 'Zarobione w tej rundzie',
  'inv.total': 'Zarobione łącznie', 'inv.next': 'Kolejny punkt kapitału przy', 'inv.board': 'Bonus zarządu',
  'inv.raise': 'Zbierz rundę finansowania',
  'inv.valNote': 'Wycena = majątek + roczny przychód × mnożnik rynkowy. W grze godzina to mniej więcej rok życia firmy; mnożnik rośnie z technologiami i kolejnymi rundami.',
  'inv.explain': 'Runda zaczyna firmę od nowa (gotówka, produkty, działy, ulepszenia, przejęcia), ale <b style="color:var(--text)">technologie, punkty badań i osiągnięcia zostają</b>, a kapitał inwestorów trwale zwiększa przychód.',
  'inv.boardTitle': 'Rada nadzorcza', 'inv.shares': '{n} udziałów', 'inv.max': 'Maks.',

  'con.locked': '🤝 Otwórz dział <b>Sprzedaż</b> w zakładce Zespół, żeby otrzymywać zapytania ofertowe od klientów.<br><br>Kontrakty to zlecenia na określony czas — po ukończeniu dostajesz sowitą zapłatę, także gdy gra jest zamknięta.',
  'con.slots': 'Miejsca na kontrakty', 'con.mult': 'Mnożnik nagród', 'con.active': 'W realizacji', 'con.noActive': 'Brak aktywnych kontraktów.',
  'con.offers': 'Zapytania ofertowe', 'con.waiting': 'Czekasz na zapytania… Kolejne za ok. {t}.',
  'con.order': 'Zamawia {task} · czas: {t}', 'con.reward': 'Nagroda:', 'con.expires': 'Oferta wygasa za {t}',
  'con.decline': 'Odrzuć', 'con.accept': 'Przyjmij',
  'con.full': 'Wszystkie miejsca zajęte — zatrudnij więcej handlowców (co 25 osób = +1 miejsce).',
  'con.left': 'Zostało {t}', 'con.done': 'Kontrakt ukończony', 'con.doneRp': ' i {v} PB',

  'acq.locked': '⚖️ Otwórz <b>Dział prawny</b>, żeby przejmować inne firmy. Każde przejęcie to potężny bonus do końca rundy.',
  'acq.yours': '✓ Twoja', 'acq.buy': 'Przejmij', 'acq.toast': 'Przejęto: {name}',

  'ach.count': 'Zdobyte osiągnięcia', 'ach.bonus': 'Bonus do przychodu', 'ach.tap': 'Dotknij ikony, żeby zobaczyć szczegóły.',
  'ach.hidden': 'Ukryte osiągnięcie', 'ach.hiddenText': 'Odkryj je, grając dalej…', 'ach.toast': 'Osiągnięcie: {name}',
  'ach.toastText': '{desc} · +{p}% przychodu',
  'ach.earn': 'Zarób łącznie {v}', 'ach.inc': 'Osiągnij przychód {v}/s', 'ach.click': 'Kliknij {n} razy',
  'ach.prod': 'Osiągnij poziom {n} produktu „{p}”', 'ach.emp': 'Zatrudniaj jednocześnie {n} {noun}',
  'ach.dept': 'Otwórz {n} {noun}', 'ach.tech': 'Odkryj {n} {noun}', 'ach.upg': 'Kup {n} {noun} w jednej rundzie',
  'ach.pres': 'Zbierz {n} {noun} finansowania', 'ach.inv': 'Zgromadź {n} punktów kapitału', 'ach.bub': 'Złap {n} {noun}',
  'ach.con': 'Ukończ {n} {noun}', 'ach.acq': 'Przejmij {n} {noun}',
  'achNames.earn': ['Pierwsza stówka', 'Drobne na kawę', 'Milioner', 'Miliarder', 'Bilioner', 'Biliarder', 'Trylioner', 'Tryliarder',
    'Kwadrylioner', 'Kwadryliarder', 'Kwintylioner', 'Poza skalą', 'Kosmiczne pieniądze', 'Gospodarka galaktyki', 'Bank wszechświata'],
  'achNames.inc': ['Pierwszy przychód', 'Rentowność', 'Maszynka do pieniędzy', 'Złota żyła', 'Fontanna gotówki', 'Gejzer', 'Wodospad',
    'Ocean', 'Supernowa', 'Kwazar', 'Wielki Wybuch', 'Osobliwość', 'Horyzont zdarzeń', 'Nowy wszechświat', 'Poza czasem'],
  'achNames.click': ['Rozgrzewka', 'Klawiszowiec', 'Maratończyk', 'Stalowe palce', 'Legenda klawiatury'],
  'achNames.prod': ['Premiera', 'Wersja 50', 'Setka', 'Legenda', 'Monopol', 'Pół tysiąca', 'Tysiąc'],
  'achNames.emp': ['Zespół', 'Startup', 'Scale-up', 'Korporacja', 'Gigant', 'Armia', 'Państwo w państwie', 'Metropolia', 'Cały naród'],
  'achNames.dept': ['Pierwsze piętra', 'Biurowiec', 'Wieżowiec', 'Kompletna firma'],
  'achNames.tech': ['Ciekawość', 'Innowator', 'Wizjoner', 'Pionier', 'Koniec historii'],
  'achNames.upg': ['Zakupoholik', 'Modernizacja', 'Wszystko na bogato', 'Kolekcjoner', 'Perfekcjonista', 'Koneser', 'Komplecista'],
  'achNames.pres': ['Pierwsza runda', 'Seryjny przedsiębiorca', 'Ulubieniec funduszy', 'Jednorożec', 'Dekakorn', 'Weteran giełdy', 'Legenda Doliny'],
  'achNames.inv': ['Kapitał', 'Fundusz', 'Wielki fundusz', 'Skarbiec', 'Bank centralny', 'Fundusz suwerenny', 'Rezerwy planety',
    'Skarbiec Układu Słonecznego', 'Bank galaktyki'],
  'achNames.bub': ['Złap okazję', 'Łowca trendów', 'Wirusowy', 'Król internetu', 'Fenomen'],
  'achNames.con': ['Pierwszy klient', 'Portfolio', 'Zaufany partner', 'Integrator', 'Dostawca wszystkiego'],
  'achNames.acq': ['Pierwsze przejęcie', 'Drapieżnik', 'Monopolista'],
  'achNames.chal': ['Pierwsze wyzwanie', 'Twardziel', 'Mistrz ograniczeń', 'Niezłomny', 'Wszystko zaliczone'],
  'achNames.dec': ['Pierwsza decyzja', 'Decydent', 'Strateg', 'Nosa nie oszukasz'],
  'achNames.ap': ['Pierwszy robot', 'Pełna automatyzacja'],
  'ach.chal': 'Ukończ {n} {noun} wyzwań', 'ach.dec': 'Podejmij {n} {noun}', 'ach.ap': 'Kup {n} {noun} autopilota',
  'ach.scale': 'Osiągnij skalę: {name}',
  'achFun.f_night': ['Nocny marek', 'Graj między północą a czwartą rano'],
  'achFun.f_rename': ['Nowa tożsamość', 'Zmień nazwę firmy'],
  'achFun.f_frenzy': ['Szał kodowania', 'Kliknij 12 razy w ciągu sekundy'],
  'achFun.f_patience': ['Cierpliwość', 'Wróć po co najmniej 8 godzinach przerwy'],
  'achFun.f_combo': ['Idealny moment', 'Miej jednocześnie aktywny Viral i Hackathon'],
  'achFun.f_trend': ['Na fali', 'Złap trend rynkowy na swoim najlepszym produkcie'],
  'achFun.f_zen': ['Wewnętrzny spokój', 'Spędź 2 minuty w trybie zen'],
  'achFun.f_music': ['Lo-fi do kodowania', 'Słuchaj muzyki w grze przez 10 minut'],
  'achFun.f_snow': ['Biały kod', 'Zagraj, gdy nad biurem pada śnieg'],
  'achFun.f_halloween': ['Straszne bugi', 'Zagraj w Halloween'],
  'achFun.f_xmas': ['Wesołych świąt!', 'Zagraj w Boże Narodzenie'],
  'achFun.f_master': ['Mistrz wyzwań', 'Ukończ wszystkie poziomy jednego wyzwania'],

  'noun.people': { one: 'osobę', few: 'osoby', many: 'osób' },
  'noun.peopleNom': { one: 'osoba', few: 'osoby', many: 'osób' },
  'noun.depts': { one: 'dział', few: 'działy', many: 'działów' },
  'noun.techs': { one: 'technologię', few: 'technologie', many: 'technologii' },
  'noun.upgrades': { one: 'ulepszenie', few: 'ulepszenia', many: 'ulepszeń' },
  'noun.rounds': { one: 'rundę', few: 'rundy', many: 'rund' },
  'noun.events': { one: 'wydarzenie', few: 'wydarzenia', many: 'wydarzeń' },
  'noun.contracts': { one: 'kontrakt', few: 'kontrakty', many: 'kontraktów' },
  'noun.companies': { one: 'firmę', few: 'firmy', many: 'firm' },
  'noun.slots': { one: 'miejsce', few: 'miejsca', many: 'miejsc' },
  'noun.tiers': { one: 'poziom', few: 'poziomy', many: 'poziomów' },
  'noun.decisions': { one: 'decyzję', few: 'decyzje', many: 'decyzji' },
  'noun.modules': { one: 'moduł', few: 'moduły', many: 'modułów' },

  'toast.milestone': 'Kamień milowy: {name}', 'toast.milestoneText': 'Poziom {n} — przychód ×{x}',
  'toast.newDept': 'Nowy dział: {name}', 'toast.newDeptText': 'W budynku pojawiło się nowe piętro!',
  'toast.deptMilestone': '{name}: {n} {noun}', 'toast.deptMilestoneText': 'Efekty działu ×{x}',
  'toast.researched': 'Odkryto: {name}',
  'bubble.viralText': 'Przychód ×7 przez {n} s', 'bubble.angelText': 'Inwestor wpłaca {v}',
  'bubble.hackText': 'Kodowanie ×15 przez {n} s', 'bubble.eurekaText': '+{v} punktów badań',
  'toast.roundClosed': 'Runda zamknięta: +{n} kapitału', 'toast.roundClosedText': 'Przychód ×{x} dzięki inwestorom',
  'toast.tooEarly': 'Za wcześnie na rundę', 'toast.tooEarlyText': 'Pierwszy punkt kapitału przy łącznych zarobkach {v}',
  'toast.renamed': 'Nowa nazwa firmy', 'toast.copied': 'Skopiowano zapis', 'toast.copyManual': 'Zaznacz i skopiuj ręcznie',
  'toast.imported': 'Zapis wczytany', 'toast.importBad': 'Nieprawidłowy zapis', 'toast.importBadText': 'Sprawdź, czy skopiowano cały tekst.',
  'toast.lang': 'Język: polski',

  'st.income': 'Przychód', 'st.maxIncome': 'Rekordowy przychód', 'st.click': 'Wartość kliknięcia', 'st.auto': 'Auto-kliknięcia',
  'st.total': 'Zarobione łącznie', 'st.run': 'Zarobione w tej rundzie', 'st.bestRun': 'Najlepsza runda', 'st.clicks': 'Kliknięcia',
  'st.staff': 'Pracownicy', 'st.hired': 'Zatrudnieni łącznie', 'st.upgrades': 'Kupione ulepszenia', 'st.techs': 'Technologie',
  'st.bubbles': 'Złapane wydarzenia', 'st.contracts': 'Ukończone kontrakty', 'st.rounds': 'Rundy finansowania',
  'st.offlineCap': 'Limit zarobku offline', 'st.offlineEff': 'Wydajność offline', 'st.playTime': 'Czas gry', 'st.founded': 'Firma założona',

  'set.company': 'Firma', 'set.name': 'Nazwa firmy', 'set.nameHint': 'Widoczna na szyldzie budynku i w wiadomościach.', 'set.save': 'Zapisz',
  'set.game': 'Gra', 'set.lang': 'Język', 'set.langHint': 'Wszystkie teksty w grze.', 'set.sound': 'Dźwięki', 'set.soundHint': 'Delikatne efekty przy klikaniu i zakupach.',
  'set.install': 'Instalacja na iPhonie', 'set.installHint': 'Jak dodać grę do ekranu początkowego.', 'set.show': 'Pokaż',
  'set.saveTitle': 'Zapis gry', 'set.export': 'Eksport zapisu', 'set.exportHint': 'Kopia zapasowa jako tekst — zachowaj ją w Notatkach.', 'set.exportBtn': 'Eksportuj',
  'set.import': 'Import zapisu', 'set.importHint': 'Wczytaj wcześniej wyeksportowany tekst.', 'set.importBtn': 'Importuj',
  'set.reset': 'Zacznij od nowa', 'set.resetHint': 'Usuwa cały postęp. Nie da się cofnąć.', 'set.resetBtn': 'Resetuj',
  'set.footer': 'wersja {v}<br>Gra zapisuje się automatycznie na tym urządzeniu.',

  'w.lead': 'Wszystko zaczyna się w garażu: laptop, kawa i wielki pomysł.',
  'w.tips': [
    '<b>Koduj</b> — stukaj w fioletowy przycisk, żeby zarobić pierwsze pieniądze.',
    '<b>Produkty</b> zarabiają same, nawet gdy gra jest zamknięta.',
    '<b>Działy</b> to nowe piętra budynku i potężne bonusy.',
    '<b>Badania</b> odblokowują kolejne technologie — od HTML po superinteligencję.',
    'Łap płonące <b>bąbelki</b> — to virale, inwestorzy i hackathony!',
  ],
  'w.name': 'Jak nazywa się Twoja firma?', 'w.start': 'Zaczynamy!',
  'o.title': 'Witaj z powrotem!', 'o.away': 'Nie było Cię {t}. W tym czasie firma zarobiła:', 'o.rp': '+{v} punktów badań',
  'o.contracts': 'Ukończone kontrakty: {n}', 'o.note': 'Zarobek offline: {p}% wydajności, limit {t}{reached}.', 'o.reached': ' (osiągnięty)', 'o.ok': 'Super!',
  'p.title': 'Runda: {r}', 'p.lead': 'Inwestorzy są gotowi wyłożyć pieniądze. Zyskasz:',
  'p.gain': 'Przychód ×{a} → <b style="color:var(--text)">×{b}</b> oraz {n} udziałów dla rady nadzorczej.',
  'p.resets': '<b>Resetuje się:</b> gotówka, produkty, działy, ulepszenia, przejęcia.',
  'p.keeps': '<b>Zostaje:</b> technologie, punkty badań, osiągnięcia, kapitał i rada nadzorcza.',
  'p.confirm': 'Zbierz rundę', 'p.cancel': 'Jeszcze nie',
  'r.title': 'Zacząć od nowa?', 'r.text': 'Cały postęp — łącznie z technologiami, kapitałem i osiągnięciami — zostanie usunięty. Tego nie da się cofnąć.',
  'r.confirm': 'Tak, usuń wszystko', cancel: 'Anuluj', close: 'Zamknij',
  'e.title': 'Eksport zapisu', 'e.text': 'Skopiuj ten tekst i zachowaj w bezpiecznym miejscu (np. w Notatkach).', 'e.copy': 'Kopiuj',
  'i.title': 'Import zapisu', 'i.text': 'Wklej tekst z eksportu. Obecny postęp zostanie zastąpiony.', 'i.placeholder': 'Wklej zapis tutaj…', 'i.load': 'Wczytaj',
  'h.title': 'Gra na ekranie początkowym',
  'h.steps': [
    'Otwórz tę stronę w <b>Safari</b>.',
    'Stuknij <b>Udostępnij</b> (kwadrat ze strzałką).',
    'Wybierz <b>Do ekranu początk.</b> i potwierdź <b>Dodaj</b>.',
    'Uruchamiaj grę z ikony — działa na pełnym ekranie i bez internetu.',
  ],
  'h.note': 'Zapis jest przechowywany na urządzeniu. Raz na jakiś czas zrób eksport zapisu — na wszelki wypadek.', 'h.ok': 'Rozumiem',

  'ct.challenges': 'Wyzwania',
  'up.tiers': ['{p} 2.0', '{p} Pro', '{p} Max', '{p} Ultra', '{p}: edycja galaktyczna', '{p}: wersja ostateczna'],
  'up.deptTiers': ['{d}: centrum doskonałości', '{d}: światowa czołówka', '{d}: legenda branży'],
  'up.blocked': '🪶 Trwa wyzwanie <b>Minimalizm</b> — w tej rundzie ulepszenia są niedostępne.',
  'prod.focusLimit': '🎯 Wyzwanie: limit 5 produktów', 'team.solo': '🧑‍💻 Wyzwanie <b>Jednoosobowa armia</b>: w tej rundzie tylko programiści.',
  'tap.off': 'Kodowanie wyłączone',

  'dfx.investorPct': 'Każdy punkt kapitału +{p} pp. przychodu', 'dfx.prestige': 'Kapitał z rund ×{x}',
  'dfx.contract': 'Nagrody z kontraktów ×{x}', 'dfx.offlineCap': 'Limit offline +{t}', 'dfx.offlineEff': 'Wydajność offline +{p} pp.',
  'dfx.acqCost': 'Przejęcia tańsze o {n}%', 'dfx.eventPower': 'Wydarzenia silniejsze ×{x}',

  'ap.title': 'Autopilot',
  'ap.lead': 'Moduły kupujesz raz, za udziały — zostają na zawsze. Działają, gdy gra jest otwarta, a po powrocie od razu inwestują zarobki offline. Każdy możesz wyłączyć.',
  'ap.locked': '🤖 Autopilot odblokujesz po pierwszej rundzie finansowania. Przyda się, gdy firmę trzeba będzie odbudowywać po każdej rundzie.',
  'ap.on': 'Włączony', 'ap.off': 'Wyłączony', 'ap.owned': 'Masz',

  'chal.lead': 'Wyzwanie to runda z jednym ograniczeniem. Start zaczyna firmę od nowa — jak runda finansowania, więc zebrany kapitał trafia do inwestorów. Zarób cel w tej rundzie, a nagroda zostanie z Tobą na zawsze. Potem runda toczy się dalej bez ograniczeń. Cele rosną razem z Twoją najlepszą rundą, a ostatni poziom to pobicie jej rekordu.',
  'chal.locked': '🏅 Wyzwania odblokujesz po pierwszej rundzie finansowania.',
  'chal.tier': 'Poziom {n}/{m}', 'chal.goal': 'Cel: zarób {v} w jednej rundzie', 'chal.reward': 'Nagroda za poziom: {fx}',
  'chal.have': 'Masz już: {fx}', 'chal.start': 'Rozpocznij', 'chal.abandon': 'Przerwij wyzwanie', 'chal.allDone': '✓ Wszystkie poziomy ukończone',
  'chal.activeTitle': 'Trwa wyzwanie', 'chal.otherActive': 'Najpierw ukończ albo przerwij trwające wyzwanie.',
  'chal.done': 'Wyzwanie ukończone: {name} ({n})', 'chal.abandoned': 'Wyzwanie przerwane', 'chal.abandonedText': 'Runda toczy się dalej bez ograniczeń.',
  'chal.confirmTitle': 'Wyzwanie: {name}', 'chal.confirmRule': 'Zasada: <b>{rule}</b>',
  'chal.confirmGain': 'Kapitał z obecnej rundy (+{n} 💎) trafi do inwestorów, a firma zacznie od nowa.',
  'chal.confirmNoGain': 'Firma zacznie od nowa. W tej rundzie nie ma jeszcze kapitału do zebrania, więc jej postęp przepadnie.',
  'chal.confirm': 'Zaczynamy', 'chal.started': 'Wyzwanie rozpoczęte', 'chal.startedText': 'Cel: {v}',

  'sc.title': 'Skala cywilizacji', 'sc.revenue': 'Roczny przychód', 'sc.k': 'Skala Kardaszowa', 'sc.human': 'ludzkość: ok. 0,73',
  'sc.next': 'Następny próg: {icon} {name} przy {v} rocznie', 'sc.top': 'Najwyższy poziom: {icon} {name}', 'sc.none': 'Zacznij zarabiać, a tu pojawi się skala Twojej firmy.',
  'sc.explain': 'Roczny przychód = przychód na sekundę × 3600, bo godzina gry to mniej więcej rok. Skalę Kardaszowa liczymy, zamieniając przychód na energię: ludzkość zużywa ok. 0,18 W na każdego dolara rocznego PKB.',
  'sc.toast': 'Nowa skala: {name}', 'sc.levels': 'Progi',

  'ch.title': 'Historia', 'ch.income': 'Przychód', 'ch.valuation': 'Wycena', 'ch.day': '24 h', 'ch.month': '30 dni',
  'ch.empty': 'Wykres zapełni się w trakcie gry — nowy punkt co kilka minut.', 'ch.rounds': 'linia = runda finansowania',

  'dec.news': '📨 <b>Decyzja czeka</b> — dotknij koperty na scenie', 'dec.badge': '📨 Decyzja czeka', 'dec.later': 'Później',
  'dec.paid': 'Wpłynęła nagroda', 'dec.made': 'Decyzja podjęta',
  'de.cash': '+{v} od ręki', 'de.rp': '+{v} PB od ręki', 'de.delayed': '+{v} za {t}', 'de.boost': 'Przychód ×{x} przez {t}',
  'de.click': 'Kodowanie ×{x} przez {t}', 'de.rpBoost': 'Badania ×{x} przez {t}',
  'badge.dIncome': '📨 Przychód ×{x} · {t}', 'badge.dClick': '📨 Kodowanie ×{x} · {t}', 'badge.dRp': '📨 Badania ×{x} · {t}',
  'badge.challenge': '{icon} {name} · {p}', 'badge.pending': '⏳ {n} · {t}',

  'zen.enter': 'Tryb zen', 'zen.exit': 'Dotknij, żeby wrócić',
  'set.music': 'Muzyka', 'set.musicHint': 'Spokojne lo-fi, komponowane na bieżąco.',
  'st.decisions': 'Podjęte decyzje', 'st.autoBuys': 'Zakupy autopilota', 'st.challenges': 'Ukończone poziomy wyzwań', 'st.bestValuation': 'Najwyższa wycena',

  'team.depts': 'Działy', 'team.world': 'Świat',
  'off.title': 'Biura na świecie', 'off.lead': 'Biura zostają z Tobą na zawsze, także po rundach finansowania. Każdy poziom rozbudowy działa jak kolejne biuro.',
  'off.space': 'Kosmos', 'off.hq': 'Siedziba', 'off.level': 'Poz. {n}/{m}', 'off.open': 'Otwórz biuro', 'off.upgrade': 'Rozbuduj',
  'off.max': 'W pełni rozbudowane', 'off.opened': 'Nowe biuro: {name}', 'off.upgraded': '{name}: poziom {n}', 'off.view': 'Widok z okna',
  'off.viewing': 'W widoku z okna', 'off.count': '{n}/{m} biur', 'off.perLevel': 'Za poziom: {fx}', 'off.now': 'Teraz: {fx}',
  'off.mapHint': 'Dotknij punktu na mapie, żeby przejść do biura.', 'off.viewHint': 'Widok z okna zmienia panoramę za budynkiem w zakładce Biuro.',
  'off.levelNames': ['Biuro', 'Kampus', 'Centrala regionu'],
  'dfx.valMult': 'Mnożnik wyceny +{v}',
  'achNames.off': ['Pierwsza filia', 'Firma międzynarodowa', 'Globalny gracz', 'Cały świat'],
  'achNames.spc': ['Pierwszy krok w kosmos', 'Firma międzyplanetarna', 'Do gwiazd'],
  'ach.off': 'Otwórz {n} {noun} na Ziemi', 'ach.spc': 'Otwórz {n} {noun} w kosmosie',
  'achFun.f_hq': ['Centrala z rozmachem', 'Rozbuduj siedzibę w Warszawie do końca'],
  'achFun.f_view': ['Nowy widok', 'Zmień widok z okna na inne biuro'],
  'noun.offices': { one: 'biuro', few: 'biura', many: 'biur' },

  'ct.market': 'Giełda',
  'mk.locked': '📈 Giełda otworzy się po rundzie <b>IPO</b>, czyli po 8. rundzie finansowania. Wtedy Twoja firma wejdzie na parkiet.',
  'mk.lead': 'Kurs Twoich akcji to wycena podzielona na miliard akcji. Konkurenci rosną razem z rynkiem, a ich kursy falują z nastrojami inwestorów. Udziały w konkurencie wzmacniają Twoje produkty z jego kategorii, a 51% daje kontrolę i dodatkową premię. Udziały przepadają przy rundzie finansowania.',
  'mk.yours': 'Twoja spółka', 'mk.price': 'Kurs akcji', 'mk.cap': 'Kapitalizacja', 'mk.rank': 'Miejsce na giełdzie', 'mk.rankV': '#{n} z {m}',
  'mk.portfolio': 'Wartość portfela', 'mk.companies': 'Spółki', 'mk.stake': 'Udziały: {p} · wartość {v}', 'mk.noStake': 'Nie masz jeszcze udziałów.',
  'mk.bonus': 'Premia: {fx}', 'mk.toControl': '{p} · kontrola od 51%', 'mk.control': '👑 Kontrola', 'mk.fee': 'Prowizja maklerska: {p}% od każdej transakcji.',
  'mk.controlToast': 'Przejęto kontrolę: {name}', 'mk.controlText': '51% udziałów: pełna premia dla kategorii {c}',
  'achNames.ctl': ['Wrogie przejęcie', 'Konglomerat', 'Monopol na giełdzie'], 'ach.ctl': 'Przejmij kontrolę nad {n} {noun}',
  'achNames.mkt': ['Pierwsza inwestycja', 'Najcenniejsza spółka świata'], 'ach.mktDesc': ['Kup udziały w konkurencie', 'Bądź najcenniejszą spółką na giełdzie'],

  'team.board': 'Zarząd',
  'bd.locked': '👔 Zarząd odblokujesz po pierwszej rundzie finansowania. Członków zarządu opłacasz udziałami 💎.',
  'bd.lead': 'Pięć foteli w zarządzie. Headhunter przysyła nowe osoby co 20–40 minut gry. Każda ma swoje mocne strony, a czasem jakieś dziwactwo. Członkowie zarządu zostają na zawsze i z czasem nabierają doświadczenia, także gdy gra jest zamknięta.',
  'bd.empty': 'Wolny fotel', 'bd.emptyHint': 'Czekaj na kandydatów na to stanowisko.', 'bd.level': 'Poz. {n}/{m}',
  'bd.next': 'Kolejny poziom za {t}', 'bd.maxLevel': 'Pełne doświadczenie', 'bd.candidates': 'Kandydaci od headhuntera',
  'bd.waiting': 'Headhunter szuka kolejnych osób… Następna za ok. {t}.', 'bd.poolFull': 'Lista jest pełna. Zatrudnij albo odrzuć kogoś, a pojawią się nowe osoby.',
  'bd.hire': 'Zatrudnij', 'bd.replace': 'Zastąp', 'bd.dismiss': 'Odrzuć', 'bd.fire': 'Pożegnaj', 'bd.quirkOn': 'działa teraz',
  'bd.rarity': ['Talent', 'Rzadki talent', 'Legenda branży'], 'bd.seat': 'Fotel {role}: {name}',
  'bd.hired': 'Nowa osoba w zarządzie: {name}', 'bd.news': '📇 <b>Headhunter</b> ma nową osobę na stanowisko {role}',
  'bd.fireTitle': 'Pożegnać {name}?', 'bd.fireText': 'Fotel {role} zostanie wolny, a udziały nie wrócą.', 'bd.fireOk': 'Tak, pożegnaj',
  'achNames.exec': ['Pierwszy fotel', 'Pełny zarząd', 'Legenda w zespole', 'Weteran zarządu'],
  'ach.exec': 'Obsadź {n} {noun} w zarządzie', 'ach.execDesc': ['Zatrudnij legendę branży', 'Rozwiń członka zarządu do 10. poziomu'],
  'noun.seats': { one: 'fotel', few: 'fotele', many: 'foteli' },

  'rs.budget': 'Budżet badawczy', 'rs.budgetInfo': 'Z budżetu: <b>+{rp} PB/s</b> ({pct}% badań) · na badania idzie {v}/s',
  'rs.budgetOff': 'Budżet wyłączony: cały przychód trafia na konto.',
  'rs.budgetHint': 'Badaczy przybywa powoli, a budżet rośnie razem z przychodem. Na starcie to grosze, ale gdy gotówka zaczyna się przelewać, przesuń ją na badania.',
  'rs.eta': 'za {t}',

  'time.d': 'd', 'time.h': 'h', 'time.m': 'min', 'time.s': 's', 'time.y': 'rok',
};

const EN = {
  appName: 'Silicon Empire',
  defaultCompany: 'Garage Startup',
  companyNames: ['Byte & Sons', 'Pixel & Co.', 'Tiny Cloud Inc.', 'Garage Code Labs', 'New Valley Works', 'Moonshot Software'],

  'tab.office': 'Office', 'tab.products': 'Products', 'tab.team': 'Team', 'tab.research': 'Research',
  'tab.upgrades': 'Upgrades', 'tab.company': 'Company',
  'tap.label': 'Code', 'sound': 'Sound',
  buyAll: 'Buy all', buyAllN: 'Buy all ({n})',
  'ct.investors': 'Investors', 'ct.contracts': 'Contracts', 'ct.acq': 'Acquisitions', 'ct.ach': 'Achievements',
  'ct.stats': 'Stats', 'ct.settings': 'Settings',
  'unit.rp': 'RP',

  'off.firstStep': 'First step', 'off.collect': 'Collect {v}', 'off.toProducts': 'Products →',
  'off.team': 'Team', 'off.people': '{n} staff', 'off.research': 'Research', 'off.products': 'Products',
  'off.levels': '{n} levels', 'off.valuation': 'Valuation', 'off.offers': '🤝 Offers: {n}', 'off.coding': 'Coding',
  'badge.contracts': '🤝 Contracts: {n} · {t}',
  'news.offer': '🤝 <b>New request for proposal</b> — check Contracts on the Company tab',

  'prod.level': 'Lvl {n}', 'prod.income': '<b>+{v}/s</b> · {p} of revenue', 'prod.notReleased': 'Not launched yet',
  'prod.milestone': '{n}/{m} · milestone ×2', 'prod.allMilestones': 'Every milestone reached!',
  'prod.release': 'Launch', 'prod.buy': 'Buy ×{n}', 'prod.requires': 'Requires:', goResearch: 'Research →',

  'team.newFloor': 'New floor', 'team.openHint': 'Open a new department and your building gets another floor.',
  'team.open': 'Open department', 'team.hireFirst': 'Make your first hire!', 'team.milestone': '{n}/{m} · effects ×{x}',
  'team.full': 'Fully staffed!', 'team.hire': 'Hire ×{n}',

  'fx.income': '{p} revenue', 'fx.clickFlat': '+{v} coding power', 'fx.clickMult': '{p} coding power',
  'fx.rp': '+{v} RP/s', 'fx.eventFreq': '{p} event frequency', 'fx.contract': '{p} contract rewards',
  'fx.slots': '{n} contract {noun}', 'fx.offlineEff': '{p} offline efficiency', 'fx.hireCost': '−{n}% hiring cost',
  'fx.prodCost': '−{n}% product cost', 'fx.offlineCap': '+{t} offline limit', 'fx.auto': '+{v} auto-taps/s',
  'fx.cat': '{p} for {c}', 'fx.acqCost': '−{n}% acquisition cost', 'fx.prestige': '{p} round capital',

  'dfx.prod': '{name} ×{x}', 'dfx.cat': '{c} category ×{x}', 'dfx.dept': '{d} ×{x}', 'dfx.deptAll': 'All departments ×{x}',
  'dfx.all': 'All revenue ×{x}', 'dfx.click': 'Coding ×{x}', 'dfx.clickPct': 'Taps earn +{p}% of revenue/s',
  'dfx.rp': 'Research points ×{x}', 'dfx.hireCost': 'Hiring −{n}%', 'dfx.prodCost': 'Products {n}% cheaper',
  'dfx.eventFreq': 'Events more often ×{x}', 'dfx.auto': '+{n} auto-tap/s', 'dfx.unlockProduct': 'Unlocks: {name}',
  'dfx.unlockDept': 'New department: {name}',

  'up.prodDesc': '{name}: revenue ×{x}', 'up.deptDesc': '{name} effects ×{x}', 'up.cultureDesc': '{desc} All revenue ×{x}.',
  'up.clickX': 'coding ×{x}', 'up.clickPct': '+{p}% of revenue/s per tap',
  'up.none': 'No upgrades available right now. Keep growing your products and departments and new ones will show up. ✨',
  'up.owned': 'Owned · {n}', 'up.bought': 'Bought {n} {noun}',

  'rs.points': 'Research points', 'rs.techCount': '{n}/{m} technologies',
  'rs.needRnd': 'Open the <b>R&amp;D</b> department on the Team tab to start earning research points. 🔬',
  'rs.persist': 'Researched technologies stay with you through every funding round.',
  'rs.lockedEra': 'Era {n}: {name}', 'rs.requires': 'Requires: {list}', 'rs.infinite': 'Endless Research', 'rs.level': 'lvl {n}',

  'inv.nextRound': 'Next round: {r}', 'inv.now': 'You hold {n} capital = revenue ×{x}',
  'inv.perPoint': 'Each point: +{p}% revenue', 'inv.valuation': 'Company valuation', 'inv.assets': 'Company assets',
  'inv.annual': 'Annual revenue', 'inv.multiple': 'Market multiple', 'inv.run': 'Earned this round',
  'inv.total': 'Earned all time', 'inv.next': 'Next capital point at', 'inv.board': 'Board bonus',
  'inv.raise': 'Raise a funding round',
  'inv.valNote': 'Valuation = assets + annual revenue × market multiple. One hour of play is roughly one year in the life of your company; the multiple grows with technology and every new round.',
  'inv.explain': 'A new round restarts the company (cash, products, departments, upgrades, acquisitions), but <b style="color:var(--text)">technologies, research points and achievements stay</b>, and investor capital permanently boosts your revenue.',
  'inv.boardTitle': 'Board of Directors', 'inv.shares': '{n} shares', 'inv.max': 'Max',

  'con.locked': '🤝 Open the <b>Sales</b> department on the Team tab to start receiving requests from clients.<br><br>Contracts are time-boxed jobs. When one finishes you get a generous payout, even while the game is closed.',
  'con.slots': 'Contract slots', 'con.mult': 'Reward multiplier', 'con.active': 'In progress', 'con.noActive': 'No active contracts.',
  'con.offers': 'Requests for proposal', 'con.waiting': 'Waiting for requests… next one in about {t}.',
  'con.order': 'Project: {task} · time: {t}', 'con.reward': 'Reward:', 'con.expires': 'Offer expires in {t}',
  'con.decline': 'Decline', 'con.accept': 'Accept',
  'con.full': 'Every slot is taken. Hire more salespeople (every 25 = +1 slot).',
  'con.left': '{t} left', 'con.done': 'Contract completed', 'con.doneRp': ' and {v} RP',

  'acq.locked': '⚖️ Open the <b>Legal</b> department to acquire other companies. Every acquisition is a big bonus for the rest of the round.',
  'acq.yours': '✓ Yours', 'acq.buy': 'Acquire', 'acq.toast': 'Acquired: {name}',

  'ach.count': 'Achievements earned', 'ach.bonus': 'Revenue bonus', 'ach.tap': 'Tap an icon to see the details.',
  'ach.hidden': 'Hidden achievement', 'ach.hiddenText': 'Keep playing to find out…', 'ach.toast': 'Achievement: {name}',
  'ach.toastText': '{desc} · +{p}% revenue',
  'ach.earn': 'Earn {v} in total', 'ach.inc': 'Reach {v}/s in revenue', 'ach.click': 'Tap {n} times',
  'ach.prod': 'Get “{p}” to level {n}', 'ach.emp': 'Have {n} {noun} on staff',
  'ach.dept': 'Open {n} {noun}', 'ach.tech': 'Research {n} {noun}', 'ach.upg': 'Buy {n} {noun} in a single round',
  'ach.pres': 'Close {n} funding {noun}', 'ach.inv': 'Hold {n} capital points', 'ach.bub': 'Catch {n} {noun}',
  'ach.con': 'Complete {n} {noun}', 'ach.acq': 'Acquire {n} {noun}',
  'achNames.earn': ['First Hundred', 'Coffee Money', 'Millionaire', 'Billionaire', 'Trillionaire', 'Quadrillionaire', 'Quintillionaire',
    'Sextillionaire', 'Septillionaire', 'Octillionaire', 'Nonillionaire', 'Off the Charts', 'Cosmic Money', 'Galactic Economy', 'Bank of the Universe'],
  'achNames.inc': ['First Revenue', 'In the Black', 'Money Machine', 'Gold Mine', 'Cash Fountain', 'Geyser', 'Waterfall',
    'Ocean', 'Supernova', 'Quasar', 'Big Bang', 'Singularity', 'Event Horizon', 'A New Universe', 'Beyond Time'],
  'achNames.click': ['Warm-Up', 'Keyboard Warrior', 'Marathoner', 'Fingers of Steel', 'Keyboard Legend'],
  'achNames.prod': ['Launch Day', 'Version 50', 'The Big 100', 'Legend', 'Monopoly', 'Five Hundred', 'The Thousand'],
  'achNames.emp': ['A Real Team', 'Startup', 'Scale-Up', 'Corporation', 'Giant', 'An Army', 'A State Within a State', 'A Metropolis', 'A Whole Nation'],
  'achNames.dept': ['First Floors', 'Office Block', 'Skyscraper', 'The Whole Company'],
  'achNames.tech': ['Curiosity', 'Innovator', 'Visionary', 'Pioneer', 'The End of History'],
  'achNames.upg': ['Shopaholic', 'Modernization', 'Living Large', 'Collector', 'Perfectionist', 'Connoisseur', 'Completionist'],
  'achNames.pres': ['First Round', 'Serial Founder', 'VC Darling', 'Unicorn', 'Decacorn', 'Market Veteran', 'Valley Legend'],
  'achNames.inv': ['Capital', 'Fund', 'Mega Fund', 'Treasury', 'Central Bank', 'Sovereign Fund', 'Planetary Reserves',
    'Solar System Treasury', 'Galactic Bank'],
  'achNames.bub': ['Seize the Moment', 'Trend Hunter', 'Gone Viral', 'King of the Internet', 'Phenomenon'],
  'achNames.con': ['First Client', 'Portfolio', 'Trusted Partner', 'Integrator', 'Supplier of Everything'],
  'achNames.acq': ['First Acquisition', 'Predator', 'Monopolist'],
  'achNames.chal': ['First Challenge', 'Tough Cookie', 'Master of Limits', 'Unbreakable', 'All Cleared'],
  'achNames.dec': ['First Call', 'Decision Maker', 'Strategist', 'Gut Instinct'],
  'achNames.ap': ['First Robot', 'Fully Automated'],
  'ach.chal': 'Clear {n} challenge {noun}', 'ach.dec': 'Make {n} {noun}', 'ach.ap': 'Buy {n} autopilot {noun}',
  'ach.scale': 'Reach the scale of: {name}',
  'achFun.f_night': ['Night Owl', 'Play between midnight and 4 a.m.'],
  'achFun.f_rename': ['New Identity', 'Rename your company'],
  'achFun.f_frenzy': ['Coding Frenzy', 'Tap 12 times in one second'],
  'achFun.f_patience': ['Patience', 'Come back after at least 8 hours away'],
  'achFun.f_combo': ['Perfect Timing', 'Have Viral and Hackathon running at the same time'],
  'achFun.f_trend': ['Riding the Wave', 'Catch a market trend on your best product'],
  'achFun.f_zen': ['Inner Peace', 'Spend 2 minutes in zen mode'],
  'achFun.f_music': ['Lo-Fi Beats to Code To', 'Listen to the in-game music for 10 minutes'],
  'achFun.f_snow': ['White Christmas Code', 'Play while it snows over the office'],
  'achFun.f_halloween': ['Spooky Bugs', 'Play on Halloween'],
  'achFun.f_xmas': ['Happy Holidays!', 'Play on Christmas Day'],
  'achFun.f_master': ['Challenge Master', 'Clear every tier of a single challenge'],

  'noun.people': { one: 'person', other: 'people' },
  'noun.peopleNom': { one: 'person', other: 'people' },
  'noun.depts': { one: 'department', other: 'departments' },
  'noun.techs': { one: 'technology', other: 'technologies' },
  'noun.upgrades': { one: 'upgrade', other: 'upgrades' },
  'noun.rounds': { one: 'round', other: 'rounds' },
  'noun.events': { one: 'event', other: 'events' },
  'noun.contracts': { one: 'contract', other: 'contracts' },
  'noun.companies': { one: 'company', other: 'companies' },
  'noun.slots': { one: 'slot', other: 'slots' },
  'noun.tiers': { one: 'tier', other: 'tiers' },
  'noun.decisions': { one: 'decision', other: 'decisions' },
  'noun.modules': { one: 'module', other: 'modules' },

  'toast.milestone': 'Milestone: {name}', 'toast.milestoneText': 'Level {n}: revenue ×{x}',
  'toast.newDept': 'New department: {name}', 'toast.newDeptText': 'A new floor just went up on your building!',
  'toast.deptMilestone': '{name}: {n} {noun}', 'toast.deptMilestoneText': 'Department effects ×{x}',
  'toast.researched': 'Researched: {name}',
  'bubble.viralText': 'Revenue ×7 for {n}s', 'bubble.angelText': 'An investor wires you {v}',
  'bubble.hackText': 'Coding ×15 for {n}s', 'bubble.eurekaText': '+{v} research points',
  'toast.roundClosed': 'Round closed: +{n} capital', 'toast.roundClosedText': 'Revenue ×{x} thanks to your investors',
  'toast.tooEarly': 'Too early for a round', 'toast.tooEarlyText': 'Your first capital point comes at {v} in total earnings',
  'toast.renamed': 'Company renamed', 'toast.copied': 'Save copied', 'toast.copyManual': 'Select the text and copy it manually',
  'toast.imported': 'Save loaded', 'toast.importBad': 'That save doesn’t look right', 'toast.importBadText': 'Make sure you copied the whole text.',
  'toast.lang': 'Language: English',

  'st.income': 'Revenue', 'st.maxIncome': 'Record revenue', 'st.click': 'Tap value', 'st.auto': 'Auto-taps',
  'st.total': 'Earned all time', 'st.run': 'Earned this round', 'st.bestRun': 'Best round', 'st.clicks': 'Taps',
  'st.staff': 'Employees', 'st.hired': 'Total hires', 'st.upgrades': 'Upgrades bought', 'st.techs': 'Technologies',
  'st.bubbles': 'Events caught', 'st.contracts': 'Contracts completed', 'st.rounds': 'Funding rounds',
  'st.offlineCap': 'Offline earnings limit', 'st.offlineEff': 'Offline efficiency', 'st.playTime': 'Time played', 'st.founded': 'Founded',

  'set.company': 'Company', 'set.name': 'Company name', 'set.nameHint': 'Shown on your building’s sign and in the news.', 'set.save': 'Save',
  'set.game': 'Game', 'set.lang': 'Language', 'set.langHint': 'All text in the game.', 'set.sound': 'Sound effects', 'set.soundHint': 'Soft sounds for taps and purchases.',
  'set.install': 'Install on iPhone', 'set.installHint': 'How to add the game to your Home Screen.', 'set.show': 'Show',
  'set.saveTitle': 'Saved game', 'set.export': 'Export save', 'set.exportHint': 'A text backup. Keep it somewhere safe, like Notes.', 'set.exportBtn': 'Export',
  'set.import': 'Import save', 'set.importHint': 'Load a save you exported earlier.', 'set.importBtn': 'Import',
  'set.reset': 'Start over', 'set.resetHint': 'Deletes all progress. This can’t be undone.', 'set.resetBtn': 'Reset',
  'set.footer': 'version {v}<br>The game saves automatically on this device.',

  'w.lead': 'Every empire starts in a garage: a laptop, a coffee and one big idea.',
  'w.tips': [
    '<b>Code</b>: tap the purple button to earn your first dollars.',
    '<b>Products</b> make money on their own, even when the game is closed.',
    '<b>Departments</b> add floors to your building and powerful bonuses.',
    '<b>Research</b> unlocks new technology, from HTML all the way to superintelligence.',
    'Catch the glowing <b>bubbles</b>: viral hits, angel investors and hackathons!',
  ],
  'w.name': 'What’s your company called?', 'w.start': 'Let’s go!',
  'o.title': 'Welcome back!', 'o.away': 'You were away for {t}. Meanwhile, your company earned:', 'o.rp': '+{v} research points',
  'o.contracts': 'Contracts completed: {n}', 'o.note': 'Offline earnings: {p}% efficiency, {t} limit{reached}.', 'o.reached': ' (reached)', 'o.ok': 'Nice!',
  'p.title': 'Round: {r}', 'p.lead': 'Investors are ready to write a check. You’ll get:',
  'p.gain': 'Revenue ×{a} → <b style="color:var(--text)">×{b}</b>, plus {n} shares for your board.',
  'p.resets': '<b>Resets:</b> cash, products, departments, upgrades, acquisitions.',
  'p.keeps': '<b>Stays:</b> technologies, research points, achievements, capital and your board.',
  'p.confirm': 'Raise the round', 'p.cancel': 'Not yet',
  'r.title': 'Start over?', 'r.text': 'All progress, including technologies, capital and achievements, will be deleted. This can’t be undone.',
  'r.confirm': 'Yes, delete everything', cancel: 'Cancel', close: 'Close',
  'e.title': 'Export save', 'e.text': 'Copy this text and keep it somewhere safe (Notes works great).', 'e.copy': 'Copy',
  'i.title': 'Import save', 'i.text': 'Paste the exported text. Your current progress will be replaced.', 'i.placeholder': 'Paste your save here…', 'i.load': 'Load',
  'h.title': 'Play from your Home Screen',
  'h.steps': [
    'Open this page in <b>Safari</b>.',
    'Tap <b>Share</b> (the square with an arrow).',
    'Choose <b>Add to Home Screen</b> and tap <b>Add</b>.',
    'Launch the game from its icon. It runs full screen and works offline.',
  ],
  'h.note': 'Your save lives on this device. Export it every now and then, just in case.', 'h.ok': 'Got it',

  'ct.challenges': 'Challenges',
  'up.tiers': ['{p} 2.0', '{p} Pro', '{p} Max', '{p} Ultra', '{p}: Galactic Edition', '{p}: The Final Version'],
  'up.deptTiers': ['{d}: Center of Excellence', '{d}: World Class', '{d}: Industry Legend'],
  'up.blocked': '🪶 The <b>Minimalism</b> challenge is on, so upgrades are off-limits this round.',
  'prod.focusLimit': '🎯 Challenge: 5-product limit', 'team.solo': '🧑‍💻 <b>One-Person Army</b> challenge: engineers only this round.',
  'tap.off': 'Coding disabled',

  'dfx.investorPct': 'Each capital point +{p} pp revenue', 'dfx.prestige': 'Round capital ×{x}',
  'dfx.contract': 'Contract rewards ×{x}', 'dfx.offlineCap': 'Offline limit +{t}', 'dfx.offlineEff': 'Offline efficiency +{p} pp',
  'dfx.acqCost': 'Acquisitions {n}% cheaper', 'dfx.eventPower': 'Stronger events ×{x}',

  'ap.title': 'Autopilot',
  'ap.lead': 'Buy each module once with shares and keep it forever. Modules work while the game is open, and when you come back they invest your offline earnings right away. You can switch any of them off.',
  'ap.locked': '🤖 Autopilot unlocks after your first funding round, right when rebuilding the company after every round starts to feel like a chore.',
  'ap.on': 'On', 'ap.off': 'Off', 'ap.owned': 'Owned',

  'chal.lead': 'A challenge is a round with one restriction. Starting one restarts the company just like a funding round, so any capital you have earned goes to your investors. Hit the earnings goal within that round and the reward is yours forever. After that, the round carries on with no restriction. Goals grow with your best round, and the final tier means beating that record.',
  'chal.locked': '🏅 Challenges unlock after your first funding round.',
  'chal.tier': 'Tier {n}/{m}', 'chal.goal': 'Goal: earn {v} in a single round', 'chal.reward': 'Reward per tier: {fx}',
  'chal.have': 'You have: {fx}', 'chal.start': 'Start', 'chal.abandon': 'Abandon challenge', 'chal.allDone': '✓ Every tier cleared',
  'chal.activeTitle': 'Challenge in progress', 'chal.otherActive': 'Finish or abandon the current challenge first.',
  'chal.done': 'Challenge cleared: {name} ({n})', 'chal.abandoned': 'Challenge abandoned', 'chal.abandonedText': 'The round carries on with no restriction.',
  'chal.confirmTitle': 'Challenge: {name}', 'chal.confirmRule': 'Rule: <b>{rule}</b>',
  'chal.confirmGain': 'Capital from this round (+{n} 💎) goes to your investors, and the company starts over.',
  'chal.confirmNoGain': 'The company starts over. There is no capital to collect from this round yet, so its progress will be lost.',
  'chal.confirm': 'Let’s do it', 'chal.started': 'Challenge started', 'chal.startedText': 'Goal: {v}',

  'sc.title': 'Scale of Civilization', 'sc.revenue': 'Annual revenue', 'sc.k': 'Kardashev scale', 'sc.human': 'humanity: about 0.73',
  'sc.next': 'Next milestone: {icon} {name} at {v} a year', 'sc.top': 'Highest reached: {icon} {name}', 'sc.none': 'Start earning and the scale of your company will show up here.',
  'sc.explain': 'Annual revenue = revenue per second × 3,600, since one hour of play is roughly one year. The Kardashev rating converts revenue into energy: humanity uses about 0.18 W for every dollar of annual GDP.',
  'sc.toast': 'New scale: {name}', 'sc.levels': 'Milestones',

  'ch.title': 'History', 'ch.income': 'Revenue', 'ch.valuation': 'Valuation', 'ch.day': '24h', 'ch.month': '30 days',
  'ch.empty': 'The chart fills in as you play, with a new point every few minutes.', 'ch.rounds': 'line = funding round',

  'dec.news': '📨 <b>A decision is waiting</b>: tap the envelope in the office', 'dec.badge': '📨 Decision waiting', 'dec.later': 'Later',
  'dec.paid': 'Payout received', 'dec.made': 'Decision made',
  'de.cash': '+{v} right now', 'de.rp': '+{v} RP right now', 'de.delayed': '+{v} in {t}', 'de.boost': 'Revenue ×{x} for {t}',
  'de.click': 'Coding ×{x} for {t}', 'de.rpBoost': 'Research ×{x} for {t}',
  'badge.dIncome': '📨 Revenue ×{x} · {t}', 'badge.dClick': '📨 Coding ×{x} · {t}', 'badge.dRp': '📨 Research ×{x} · {t}',
  'badge.challenge': '{icon} {name} · {p}', 'badge.pending': '⏳ {n} · {t}',

  'zen.enter': 'Zen mode', 'zen.exit': 'Tap to return',
  'set.music': 'Music', 'set.musicHint': 'Calm lo-fi, composed on the fly.',
  'st.decisions': 'Decisions made', 'st.autoBuys': 'Autopilot purchases', 'st.challenges': 'Challenge tiers cleared', 'st.bestValuation': 'Highest valuation',

  'team.depts': 'Departments', 'team.world': 'World',
  'off.title': 'Offices Around the World', 'off.lead': 'Offices stay with you forever, even through funding rounds. Every expansion level works like another office.',
  'off.space': 'Space', 'off.hq': 'HQ', 'off.level': 'Lvl {n}/{m}', 'off.open': 'Open office', 'off.upgrade': 'Expand',
  'off.max': 'Fully expanded', 'off.opened': 'New office: {name}', 'off.upgraded': '{name}: level {n}', 'off.view': 'Window view',
  'off.viewing': 'In the window view', 'off.count': '{n}/{m} offices', 'off.perLevel': 'Per level: {fx}', 'off.now': 'Now: {fx}',
  'off.mapHint': 'Tap a dot on the map to jump to that office.', 'off.viewHint': 'The window view changes the skyline behind your building on the Office tab.',
  'off.levelNames': ['Office', 'Campus', 'Regional HQ'],
  'dfx.valMult': 'Valuation multiple +{v}',
  'achNames.off': ['First Branch', 'Going International', 'Global Player', 'The Whole World'],
  'achNames.spc': ['One Small Step', 'Interplanetary Company', 'To the Stars'],
  'ach.off': 'Open {n} {noun} on Earth', 'ach.spc': 'Open {n} {noun} in space',
  'achFun.f_hq': ['Grand Headquarters', 'Fully expand your Warsaw HQ'],
  'achFun.f_view': ['A New View', 'Switch the window view to another office'],
  'noun.offices': { one: 'office', other: 'offices' },

  'ct.market': 'Market',
  'mk.locked': '📈 The stock market opens after your <b>IPO</b> round, the 8th funding round. That’s when your company goes public.',
  'mk.lead': 'Your share price is your valuation divided by a billion shares. Competitors grow with the market and their prices swing with investor sentiment. Owning a stake in a competitor boosts your products in its category, and 51% gives you control plus an extra bonus. Stakes are lost when you raise a funding round.',
  'mk.yours': 'Your company', 'mk.price': 'Share price', 'mk.cap': 'Market cap', 'mk.rank': 'Market rank', 'mk.rankV': '#{n} of {m}',
  'mk.portfolio': 'Portfolio value', 'mk.companies': 'Companies', 'mk.stake': 'Stake: {p} · worth {v}', 'mk.noStake': 'You don’t own a stake yet.',
  'mk.bonus': 'Bonus: {fx}', 'mk.toControl': '{p} · control at 51%', 'mk.control': '👑 Control', 'mk.fee': 'Brokerage fee: {p}% on every trade.',
  'mk.controlToast': 'Control acquired: {name}', 'mk.controlText': '51% stake: full bonus for the {c} category',
  'achNames.ctl': ['Hostile Takeover', 'Conglomerate', 'Market Monopoly'], 'ach.ctl': 'Take control of {n} {noun}',
  'achNames.mkt': ['First Investment', 'The World’s Most Valuable Company'], 'ach.mktDesc': ['Buy a stake in a competitor', 'Be the most valuable company on the market'],

  'team.board': 'Board',
  'bd.locked': '👔 The executive board unlocks after your first funding round. Executives are paid in shares 💎.',
  'bd.lead': 'Five seats at the top table. The headhunter sends new candidates every 20–40 minutes of play. Each one has strengths, and sometimes a quirk. Executives stay forever and gain experience over time, even while the game is closed.',
  'bd.empty': 'Empty seat', 'bd.emptyHint': 'Wait for candidates for this role.', 'bd.level': 'Lvl {n}/{m}',
  'bd.next': 'Next level in {t}', 'bd.maxLevel': 'Fully experienced', 'bd.candidates': 'Candidates from the headhunter',
  'bd.waiting': 'The headhunter is searching… next candidate in about {t}.', 'bd.poolFull': 'The list is full. Hire or decline someone and new candidates will arrive.',
  'bd.hire': 'Hire', 'bd.replace': 'Replace', 'bd.dismiss': 'Decline', 'bd.fire': 'Let go', 'bd.quirkOn': 'active now',
  'bd.rarity': ['Talent', 'Rare Talent', 'Industry Legend'], 'bd.seat': '{role} seat: {name}',
  'bd.hired': 'New board member: {name}', 'bd.news': '📇 <b>Headhunter</b>: a new candidate for {role}',
  'bd.fireTitle': 'Let {name} go?', 'bd.fireText': 'The {role} seat will be empty and the shares won’t come back.', 'bd.fireOk': 'Yes, let them go',
  'achNames.exec': ['First Seat', 'A Full Board', 'A Legend on the Team', 'Board Veteran'],
  'ach.exec': 'Fill {n} board {noun}', 'ach.execDesc': ['Hire an industry legend', 'Grow a board member to level 10'],
  'noun.seats': { one: 'seat', other: 'seats' },

  'rs.budget': 'Research budget', 'rs.budgetInfo': 'From the budget: <b>+{rp} RP/s</b> ({pct}% of research) · research gets {v}/s',
  'rs.budgetOff': 'Budget off: all revenue goes to your cash.',
  'rs.budgetHint': 'Researchers come slowly, but the budget grows with your revenue. Early on it\'s pocket change; once cash starts piling up, move it into research.',
  'rs.eta': 'in {t}',

  'time.d': 'd', 'time.h': 'h', 'time.m': 'm', 'time.s': 's', 'time.y': 'yr',
};

export const DICT = { pl: PL, en: EN };

function lookup(key) {
  const d = DICT[lang];
  if (d[key] !== undefined) return d[key];
  return PL[key] !== undefined ? PL[key] : key;
}

export function t(key, params) {
  const v = lookup(key);
  if (typeof v !== 'string' || !params) return v;
  return v.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
}

// Forma liczebnika: PL 1 / 2–4 / 5+, EN 1 / reszta
export function pluralForm(n, forms) {
  if (lang === 'en') return n === 1 ? forms.one : forms.other;
  if (n === 1) return forms.one;
  const d = n % 10;
  const dd = n % 100;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return forms.few;
  return forms.many;
}

export function noun(key, n) {
  return pluralForm(n, lookup(`noun.${key}`));
}
