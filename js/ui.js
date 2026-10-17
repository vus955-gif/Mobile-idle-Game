// Interfejs: renderowanie zakładek, HUD, efekty kliknięć, modale i toasty.
import {
  PERKS, CATEGORIES, BUBBLES, DEPT_MILESTONE_X, DEPT_MILESTONES,
  AUTOPILOT, CHALLENGES, CHALLENGE_GOALS, SCALE_LEVELS, DECISIONS, OFFICE_MAX_LEVEL, COMPETITORS, MARKET,
  ROLES, BOARD,
} from './data.js';
import {
  ACH_BONUS, nextMilestone, prevMilestone, nextDeptMilestone, deptMilestoneMult, MAX_SLOTS,
  CHALLENGE_MAP, SCALE_THRESHOLDS, ROLE_MAP, QUIRK_MAP, scaleTrait, FEED_SHARES, LAYER_GRANT_SECONDS,
} from './engine.js';
import { avatar, emptyAvatar } from './avatar.js';
import { WORLD } from './worldmap.js';
import { fmt, money, fmtInt, fmtTime, fmtClock, fmtPct, num, decimal } from './format.js';
import { t, noun, getLang, setLang, LANGS, DICT } from './i18n.js';
import * as TX from './text.js';
import { Scene } from './scene.js';
import { LAYERS, LAYER_CHIPS, LAYER_ORDER } from './layers.js';
import { play, setSound, unlockAudio } from './audio.js';
import { startMusic, stopMusic, musicAudible } from './music.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grad = (c) => `background:linear-gradient(135deg, ${c[0]}, ${c[1]})`;
const SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const PARTICLES = ['{ }', '</>', '01', ';', '( )', '=>', '#', '[ ]', '&&', 'fn'];
const PARTICLE_COLORS = ['#a78bfa', '#22d3ee', '#4ade80', '#fbbf24', '#f472b6'];
const BUY_OPTIONS = [[1, '×1'], [10, '×10'], [100, '×100'], ['max', 'MAX']];
const COMPANY_TABS = ['investors', 'challenges', 'market', 'contracts', 'acq', 'ach', 'stats', 'settings'];
// Mały wykres liniowy (np. kurs akcji)
function spark(values, w = 120, h = 30, color = '#4ade80') {
  const v = values.filter((x) => x > 0);
  if (v.length < 2) return '';
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const span = hi - lo || hi * 0.01 || 1;
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 2 - ((x - lo) / span) * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
const TEAM_TABS = ['depts', 'world', 'board'];
// Tło kafelków warstw w arkuszu imperium.
const LAYER_GRADS = { earth: ['#0ea5e9', '#22c55e'], space: ['#1e1b4b', '#7c3aed'], galaxy: ['#312e81', '#db2777'], universe: ['#0f172a', '#6d28d9'] };
// Planety na mapie Układu Słonecznego (au: odległość od Słońca, ang: położenie na orbicie) i kolonie przy nich.
const PLANETS = {
  mercury: { au: 0.39, ang: 330, r: 3, c: '#a8a29e' }, venus: { au: 0.72, ang: 120, r: 4.5, c: '#f5d48b' },
  earth: { au: 1, ang: 205, r: 5, c: '#3b82f6' }, mars: { au: 1.52, ang: 300, r: 4, c: '#e4572e' },
  ceres: { au: 2.77, ang: 35, r: 2.5, c: '#9ca3af' }, jupiter: { au: 5.2, ang: 150, r: 10, c: '#d6a46b' },
  saturn: { au: 9.5, ang: 20, r: 8, c: '#e9c27b' },
};
const COLONY_AT = { leo: ['earth', 0, -9], l2: ['earth', 10, 4], moon: ['earth', -9, 5], mercury: ['mercury', 0, 0], venus: ['venus', 0, 0],
  mars: ['mars', 0, 0], ceres: ['ceres', 0, 0], europa: ['jupiter', 12, -6], titan: ['saturn', 11, 6] };
const TAP_ROCKET = '<path d="M32 6c9 7 13 18 11 30H21C19 24 23 13 32 6z" fill="rgba(255,255,255,.2)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="22" r="4.5" fill="none" stroke="#fff" stroke-width="3"/><path d="M21 34l-7 9h10M43 34l7 9H40" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M27 42c0 7 2 11 5 15 3-4 5-8 5-15" fill="#fff"/>';
const TAP_WARP = '<ellipse cx="32" cy="32" rx="25" ry="10" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/><path d="M14 38c6-10 30-10 36 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M20 30c0-9 5-17 12-17s12 8 12 17" fill="rgba(255,255,255,.2)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="24" r="4" fill="#fff"/><path d="M8 50l7-5M56 50l-7-5M32 56v-8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
const TAP_SPARK = '<circle cx="32" cy="32" r="9" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="3"/><path d="M32 6v12M32 46v12M6 32h12M46 32h12M14 14l8 8M42 42l8 8M50 14l-8 8M22 42l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="3.5" fill="#fff"/>';
// Symbole warstw na ekranie: waluta resetu, ikona rundy, mapa i przycisk akcji.
const LAYER_UI = {
  earth: { cur: '💎', round: '🦄', world: '🌍', hero: '🚀', tap: null },
  space: { cur: '👩‍🚀', round: '🌊', world: '🪐', hero: '🚀', tap: TAP_ROCKET },
  galaxy: { cur: '🛸', round: '🌠', world: '🌌', hero: '🌌', tap: TAP_WARP },
  universe: { cur: '💫', round: '💥', world: '🕸️', hero: '🕳️', tap: TAP_SPARK },
};
// Mapa galaktyki: spirala z ramionami, gwiazdy układów rozmieszczone w kpc od centrum.
const GALAXY_MAP = { cx: 180, cy: 92, scale: 2.9, tilt: 0.6 };
// Kropki lądu jako jedna ścieżka (lżej niż tysiące kółek). Mapa: 1 jednostka = 1° długości.
let LAND_PATH = null;
function landPath() {
  if (LAND_PATH) return LAND_PATH;
  const r = 1.05;
  let d = '';
  WORLD.rows.forEach((row, y) => {
    let bits = '';
    for (const h of row) bits += parseInt(h, 16).toString(2).padStart(4, '0');
    for (let x = 0; x < bits.length; x++) {
      if (bits[x] !== '1') continue;
      const cx = x * WORLD.step + WORLD.step / 2;
      const cy = y * WORLD.step + WORLD.step / 2;
      d += `M${(cx - r).toFixed(2)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    }
  });
  LAND_PATH = d;
  return d;
}
const mapX = (lon) => lon - WORLD.lon0;
const mapY = (lat) => WORLD.lat0 - lat;
const MAP_H = WORLD.rows.length * WORLD.step;
const DEPT_MS_PREV = [0, ...DEPT_MILESTONES];
// Efekt nagrody po n poziomach (mnożniki potęgujemy, dodatki mnożymy).
const scaledFx = (fx, n) => fx.map((e) => ({ ...e, ...(e.x !== undefined ? { x: Math.pow(e.x, n) } : {}), ...(e.v !== undefined ? { v: e.v * n } : {}) }));
const minus = (str) => str.replace(/^-/, '−');
// Ile razy technologia poszerza rynek (krok zasięgu w log10).
const reachX = (step) => { const x = Math.pow(10, step); return x >= 100 ? fmt(x) : decimal(x.toFixed(1)); };

// Zdarzenia z warstw w tle, które i tak pokazujemy (dotyczą całej firmy).
const GLOBAL_EVENTS = new Set(['achievement', 'scale', 'candidate', 'decision', 'decided', 'offline', 'layer']);

export class UI {
  constructor(co, hooks = {}) {
    this.co = co;
    this.hooks = hooks;
    this.offlineBuf = null;
    this.tab = 'office';
    this.companySub = 'investors';
    this.teamSub = 'depts';
    this.mkStep = 0.01;
    this.focusOffice = null;
    this.sigs = {};
    this.lastSlow = 0;
    this.lastHud = 0;
    this.toastQueue = [];
    this.scene = new Scene($('scene'));
    this.fx = document.createElement('div');
    this.fx.className = 'fx-layer';
    this.fx.style.zIndex = '20';
    $('app').appendChild(this.fx);
    this.bubbleEl = null;
    this.tickerBusy = false;
    this.newsIdx = Math.floor(Math.random() * 20);
    this.tickerAnim = null;
    this.pendingNews = [];
    this.zen = false;
    this.envelopeEl = null;
    this.chartSeries = 'income';
    this.chartRange = 'day';
    this.lastSec = 0;
  }

  // Aktywna warstwa (Ziemia, Kosmos…) — to, co widać na ekranie.
  get g() { return this.co.g; }
  // Symbole warstwy na ekranie (waluta resetu, ikony).
  get lu() { return LAYER_UI[this.co.g.D.id] || LAYER_UI.earth; }
  // Tekst z wariantem dla warstwy (np. sp.tab.office: Stacja, gx.tab.office: Statek), jeśli taki istnieje.
  tl(key, params) { return this.lt(key, this.g.D.id, params); }
  // To samo dla dowolnej warstwy — np. teksty przejścia do kolejnej (Kosmos, Galaktyka).
  lt(key, id, params) {
    const pre = LAYERS[id] ? LAYERS[id].TEXT : '';
    if (pre && DICT.pl[`${pre}${key}`] !== undefined) return t(`${pre}${key}`, params);
    return t(key, params);
  }

  init() {
    this.applyStatic();
    this.placeToasts();
    window.addEventListener('resize', () => this.placeToasts());
    this.renderBuySegs();
    this.renderCompanyTabs();
    this.renderTeamTabs();
    this.bindEvents();
    this.bindGame();
    setSound(!!this.g.s.meta.settings.sound);
    if (this.g.s.meta.settings.music) startMusic();
    this.updateSoundBtn();
    this.scene.render(this.g, true);
    this.syncBubble();
    this.syncDecision();
    this.nextTicker();
    this.updateAll(true);
  }

  // ---------------------------------------------------------------------
  // Zdarzenia
  // ---------------------------------------------------------------------
  bindEvents() {
    const app = $('app');
    app.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      this.action(el.dataset.act, el, e);
    });
    $('tabbar').addEventListener('click', (e) => {
      const t = e.target.closest('.tab');
      if (t) this.showTab(t.dataset.tab);
    });
    const tap = $('tap-btn');
    tap.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      unlockAudio();
      this.doClick(e.clientX, e.clientY);
      tap.classList.add('pressed');
    });
    const release = () => tap.classList.remove('pressed');
    tap.addEventListener('pointerup', release);
    tap.addEventListener('pointercancel', release);
    tap.addEventListener('pointerleave', release);
    tap.addEventListener('contextmenu', (e) => e.preventDefault());
    // W trybie zen dowolne dotknięcie (poza bąbelkiem i kopertą) wraca do gry.
    app.addEventListener('pointerdown', (e) => {
      if (!this.zen || e.target.closest('.bubble, .envelope, .modal')) return;
      e.preventDefault();
      e.stopPropagation();
      this.exitZen();
    }, true);
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  }

  bindGame() {
    // Zdarzenia przychodzą z każdej warstwy; z warstw w tle pokazujemy tylko te dotyczące całej firmy.
    const on = (ev, fn) => this.co.on(ev, (d, layer) => { if (layer === this.g || GLOBAL_EVENTS.has(ev)) fn(d, layer); });
    const g = { on };
    g.on('toast', (tt) => this.toast(tt.icon, tt.title, tt.text, tt.kind));
    g.on('achievement', (a) => {
      this.toast(a.icon, t('ach.toast', { name: TX.achName(a) }), t('ach.toastText', { desc: TX.achDesc(a), p: Math.round(ACH_BONUS * 100) }), 'achievement');
      play('achievement');
    });
    g.on('bubble', () => this.syncBubble());
    g.on('trend', (tr) => { if (tr) this.pendingNews.push(`📈 <b>${esc(TX.trendText(tr))}</b>`); });
    g.on('contractOffer', () => { if (this.tab !== 'company') this.pendingNews.push(t('news.offer')); });
    g.on('structure', () => { this.scene.render(this.g); });
    g.on('buy', (b) => {
      if (b.kind === 'tech' || b.kind === 'acq') play('unlock'); else play('buy');
      if (b.kind === 'dept' || b.kind === 'product') this.scene.render(this.g);
    });
    g.on('offline', (r, layer) => this.queueOffline(r, layer));
    g.on('prestige', () => play('prestige'));
    g.on('autopilot', (a) => {
      for (const id of a.researched || []) {
        const tech = this.g.D.TECH_MAP[id];
        if (tech) this.toast(tech.icon, t('toast.researched', { name: TX.techName(id) }), TX.describeFx(tech.fx), 'tech');
      }
      if (a.round) this.toast('🔁', this.tl('toast.roundClosed', { n: fmt(a.round) }), `${t('ap.roundAuto')} · ${this.tl('toast.roundClosedText', { x: fmt(this.g.m.invMult) })}`, 'achievement');
      this.scene.render(this.g);
    });
    g.on('challenge', (c) => {
      if (c.started) this.toast(CHALLENGE_MAP[c.id].icon, t('chal.started'), t('chal.startedText', { v: money(this.g.challengeGoal(c.id)) }), 'info');
      if (c.abandoned) this.toast('🏳️', t('chal.abandoned'), t('chal.abandonedText'), 'info');
      if (c.done) play('achievement');
      this.sigs = {};
    });
    g.on('scale', (i) => {
      const L = SCALE_LEVELS[i];
      this.toast(L.icon, t('sc.toast', { name: TX.scaleName(i) }), TX.scaleDesc(i), 'achievement');
      this.pendingNews.unshift(`${L.icon} <b>${esc(TX.scaleName(i))}</b> · ${esc(TX.scaleDesc(i))}`);
      play('achievement');
    });
    g.on('marketNews', (n) => { this.pendingNews.push(`${n.d > 0 ? '📈' : '📉'} ${esc(TX.marketNewsText(n, Math.floor(Math.random() * 3)))}`); });
    g.on('control', (id) => {
      const c = COMPETITORS.find((x) => x.id === id);
      this.toast(c.icon, t('mk.controlToast', { name: TX.compName(id) }), t('mk.controlText', { c: TX.catName(c.cat) }), 'achievement');
      play('achievement');
    });
    g.on('candidate', (c) => { this.pendingNews.push(t('bd.news', { role: ROLE_MAP[c.role].name })); });
    g.on('decision', () => { this.pendingNews.push(t('dec.news')); this.syncDecision(); });
    g.on('decided', (d) => { this.toast(d.d.icon, t('dec.made'), TX.decisionEffectText(d.e), 'event'); this.syncDecision(); });
  }

  action(act, el) {
    const g = this.g;
    const s = g.s;
    const id = el.dataset.id;
    unlockAudio();
    switch (act) {
      case 'goto': this.showTab(el.dataset.tab, el.dataset.sub); break;
      case 'set-buy': s.meta.settings.buyAmount = el.dataset.v === 'max' ? 'max' : Number(el.dataset.v); this.renderBuySegs(); this.updateAll(true); break;
      case 'buy-product': if (g.buyProduct(id, this.buyAmount())) this.pulse(el); this.updateAll(); break;
      case 'unlock-dept': if (g.unlockDept(id)) { play('unlock'); this.scene.render(g); } this.updateAll(true); break;
      case 'hire': if (g.hire(id, this.buyAmount())) this.pulse(el); this.updateAll(); break;
      case 'research': g.research(id); this.updateAll(true); break;
      case 'research-repeat': g.researchRepeat(id); this.updateAll(true); break;
      case 'rd-budget': g.setRdBudget(Number(el.dataset.v)); this.updateAll(true); break;
      case 'buy-upgrade': g.buyUpgrade(id); this.updateAll(true); break;
      case 'buy-all': { const n = g.buyAllUpgrades(); if (n) this.toast('⬆️', t('up.bought', { n, noun: noun('upgrades', n) }), '', 'info'); this.updateAll(true); break; }
      case 'buy-perk': g.buyPerk(id); this.updateAll(true); break;
      case 'buy-acq': g.buyAcq(id); this.updateAll(true); break;
      case 'accept-contract': if (g.acceptContract(Number(id), Date.now())) play('coin'); this.updateAll(true); break;
      case 'decline-contract': g.declineContract(Number(id)); this.updateAll(true); break;
      case 'company-sub': this.companySub = el.dataset.sub; this.renderCompanyTabs(); this.updateAll(true); break;
      case 'team-sub': this.teamSub = el.dataset.sub; this.renderTeamTabs(); this.updateAll(true); $('view-team').scrollTop = 0; break;
      case 'open-office': if (g.openOffice(id)) { play('unlock'); this.scene.render(g); } this.updateAll(true); break;
      case 'set-view': if (g.setView(id)) { this.scene.render(g, true); this.toast(this.g.D.OFFICE_MAP[id].icon, t('off.viewing'), TX.officeName(id), 'info'); } this.updateAll(true); break;
      case 'hire-exec': if (g.hireExec(Number(id), Date.now())) { play('unlock'); const e = Object.values(s.meta.board).find((x) => x.id === Number(id)); if (e) this.toast(ROLE_MAP[e.role].icon, t('bd.hired', { name: TX.execName(e.n) }), TX.describeFx(e.traits), 'achievement'); } this.updateAll(true); break;
      case 'dismiss-cand': g.dismissCandidate(Number(id)); this.updateAll(true); break;
      case 'fire-exec': this.confirmFire(id); break;
      case 'fire-confirm': this.closeModal(); g.fireExec(id); this.updateAll(true); break;
      case 'office-focus': {
        this.focusOffice = id;
        const card = $(`office-${id}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.animate([{ boxShadow: '0 0 0 2px rgba(34,211,238,.9)' }, { boxShadow: '0 0 0 0 rgba(34,211,238,0)' }], { duration: 1400 });
        }
        break;
      }
      case 'prestige': this.confirmPrestige(); break;
      case 'prestige-confirm': {
        const gain = g.doPrestige(Date.now());
        this.closeModal();
        if (gain) {
          this.scene.render(g, true);
          this.showTab('office');
          this.toast(this.lu.round, this.tl('toast.roundClosed', { n: fmt(gain) }), this.tl('toast.roundClosedText', { x: fmt(g.m.invMult) }), 'achievement');
          this.hooks.save?.();
        }
        break;
      }
      case 'layer': this.switchLayer(id); break;
      case 'layers-open': this.showLayers(); break;
      case 'layer-start': this.confirmLayerStart(); break;
      case 'layer-start-confirm': {
        this.closeModal();
        const next = this.co.nextLayer();
        if (this.co.unlockLayer(next, Date.now())) {
          play('prestige');
          this.switchLayer(next, true);
          this.toast(LAYERS[next].icon, this.lt('space.welcome', next), this.lt('space.welcomeText', next), 'achievement');
          this.hooks.save?.();
        }
        break;
      }
      case 'feed': {
        const from = this.co.layers[el.dataset.layer];
        if (from && from.setFeed(Number(el.dataset.v))) { this.co.feedLinks(); this.showLayers(); }
        break;
      }
      case 'toggle-sound': s.meta.settings.sound = !s.meta.settings.sound; setSound(s.meta.settings.sound); this.updateSoundBtn(); if (s.meta.settings.sound) play('buy'); this.sigs.company = ''; this.updateAll(true); break;
      case 'modal-close': this.closeModal(); break;
      case 'rename': this.rename(); break;
      case 'set-lang': this.changeLang(el.dataset.v); break;
      case 'welcome-lang': {
        const input = $('welcome-name');
        const typed = (input?.value || '').trim();
        const wasSuggestion = DICT[getLang()].companyNames.includes(typed);
        this.changeLang(el.dataset.v);
        this.showWelcome(wasSuggestion ? null : typed);
        break;
      }
      case 'welcome-start': {
        const v = ($('welcome-name')?.value || '').trim();
        if (v) s.meta.companyName = v.slice(0, 28);
        this.closeModal();
        this.scene.render(g, true);
        this.updateAll(true);
        break;
      }
      case 'export': this.showExport(); break;
      case 'copy-export': this.copyExport(); break;
      case 'import': this.showImport(); break;
      case 'import-confirm': this.doImport(); break;
      case 'reset': this.confirmReset(); break;
      case 'reset-confirm': this.closeModal(); this.hooks.reset?.(); break;
      case 'ach-info': {
        const a = this.co.achievements().find((x) => x.id === id);
        if (!a) break;
        const got = !!s.meta.achievements[a.id];
        if (got || !a.hidden) this.toast(got ? a.icon : '🔒', TX.achName(a), TX.achDesc(a), got ? 'achievement' : 'info');
        else this.toast('❓', t('ach.hidden'), t('ach.hiddenText'), 'info');
        break;
      }
      case 'install-help': this.showInstallHelp(); break;
      case 'buy-ap': if (g.buyAutopilot(id)) play('unlock'); this.updateAll(true); break;
      case 'toggle-ap': g.toggleAutopilot(id); this.updateAll(true); break;
      case 'chal-start': this.confirmChallenge(id); break;
      case 'chal-confirm': {
        this.closeModal();
        if (g.startChallenge(id, Date.now())) {
          this.scene.render(g, true);
          this.showTab('office');
          this.hooks.save?.();
        }
        break;
      }
      case 'chal-abandon': g.abandonChallenge(); this.updateAll(true); break;
      case 'decision-open': this.showDecision(); break;
      case 'decide': {
        this.closeModal();
        if (g.chooseDecision(el.dataset.v, Date.now())) play('coin');
        this.updateAll(true);
        this.hooks.save?.();
        break;
      }
      case 'zen': this.enterZen(); break;
      case 'toggle-cap': {
        g.setCap(!g.capOn());
        this.sigs.company = '';
        this.updateAll(true);
        break;
      }
      case 'toggle-music': {
        s.meta.settings.music = !s.meta.settings.music;
        if (s.meta.settings.music) startMusic(); else stopMusic();
        this.updateAll(true);
        break;
      }
      case 'chart-series': this.chartSeries = el.dataset.v; this.updateAll(true); break;
      case 'mk-step': this.mkStep = Number(el.dataset.v); this.updateAll(true); break;
      case 'buy-stake': if (g.buyStake(id, this.mkStep)) this.pulse(el); this.updateAll(); break;
      case 'sell-stake': if (g.sellStake(id, this.mkStep)) play('coin'); this.updateAll(); break;
      case 'chart-range': this.chartRange = el.dataset.v; this.updateAll(true); break;
      case 'scale-info': {
        const i = Number(id);
        const reached = s.meta.scaleMax >= i;
        const L = SCALE_LEVELS[i];
        const need = !reached && L.tech && !g.hasTech(L.tech) ? ` · ${t('sc.needTech', { tech: TX.techName(L.tech) })}` : '';
        this.toast(reached ? L.icon : '🔒', TX.scaleName(i), `${TX.scaleDesc(i)} · ${money(SCALE_THRESHOLDS[i])}/${t('time.y')}${need}`, reached ? 'achievement' : 'info');
        break;
      }
      default: break;
    }
  }

  buyAmount() { return this.g.s.meta.settings.buyAmount || 1; }

  // Teksty zapisane na sztywno w index.html (zakładki, nagłówki, przycisk kodowania).
  applyStatic() {
    document.documentElement.lang = getLang();
    document.title = t('appName');
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = this.tl(el.dataset.i18n);
    for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', this.tl(el.dataset.i18nAria));
    $('app').dataset.layer = this.g.D.id;
    const icon = document.querySelector('.tap-icon');
    if (icon) {
      if (!this.tapIconEarth) this.tapIconEarth = icon.innerHTML;
      icon.innerHTML = this.lu.tap || this.tapIconEarth;
    }
    const world = document.querySelector('.scene-tool[data-sub="world"]');
    if (world) world.textContent = this.lu.world;
    const inv = document.querySelector('#hud-inv-chip .chip-ico');
    if (inv) inv.textContent = this.lu.cur;
  }

  changeLang(lang) {
    const s = this.g.s;
    const old = getLang();
    if (lang === old) return;
    // Domyślna nazwa firmy podąża za językiem, własna zostaje.
    if (s.meta.companyName === DICT[old].defaultCompany) s.meta.companyName = DICT[lang].defaultCompany;
    s.meta.settings.lang = lang;
    setLang(lang);
    this.applyStatic();
    this.renderBuySegs();
    this.renderCompanyTabs();
    this.renderTeamTabs();
    this.sigs = {};
    this.scene.render(this.g, true);
    this.syncBubble(true);
    this.pendingNews = [];
    this.restartTicker();
    this.updateAll(true);
    this.placeToasts();
    this.hooks.save?.();
  }

  pulse(el) {
    const card = el.closest('.card');
    if (!card) return;
    card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], { duration: 180 });
  }

  doClick(x, y) {
    const g = this.g;
    const v = g.click(Date.now());
    play('click');
    const app = $('app').getBoundingClientRect();
    const px = x - app.left;
    const py = y - app.top;
    const hack = !!g.boostActive('click');
    if (this.fx.childElementCount < 40) {
      const n = document.createElement('div');
      n.className = 'float-num' + (hack ? ' crit' : '');
      n.textContent = '+' + money(v);
      n.style.left = `${px + (Math.random() * 30 - 15)}px`;
      n.style.top = `${py - 50}px`;
      n.addEventListener('animationend', () => n.remove());
      this.fx.appendChild(n);
      for (let i = 0; i < 2; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
        p.style.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        p.style.left = `${px - 10}px`;
        p.style.top = `${py - 20}px`;
        p.style.setProperty('--dx', `${Math.random() * 140 - 70}px`);
        p.style.setProperty('--dy', `${-50 - Math.random() * 80}px`);
        p.style.setProperty('--rot', `${Math.random() * 90 - 45}deg`);
        p.addEventListener('animationend', () => p.remove());
        this.fx.appendChild(p);
      }
    }
    const ring = document.querySelector('.tap-ring');
    ring.classList.remove('go');
    void ring.offsetWidth;
    ring.classList.add('go');
  }

  // ---------------------------------------------------------------------
  // Zakładki
  // ---------------------------------------------------------------------
  showTab(tab, sub) {
    if (!tab) return;
    this.tab = tab;
    if (sub && tab === 'team') { this.teamSub = sub; this.renderTeamTabs(); } else if (sub) { this.companySub = sub; this.renderCompanyTabs(); }
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === tab));
    // Scena nie jest widoczna poza Biurem — wstrzymujemy jej animacje (bateria).
    $('scene-wrap').classList.toggle('paused', tab !== 'office');
    const view = document.querySelector(`.view[data-view="${tab}"]`);
    if (view && tab !== 'office') view.scrollTop = 0;
    this.updateAll(true);
  }

  renderBuySegs() {
    const cur = this.buyAmount();
    document.querySelectorAll('[data-seg="buy"]').forEach((seg) => {
      seg.innerHTML = BUY_OPTIONS.map(([v, l]) => `<button data-act="set-buy" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('');
    });
  }

  renderTeamTabs() {
    $('team-tabs').innerHTML = TEAM_TABS.map((k) =>
      `<button class="pill ${k === this.teamSub ? 'on' : ''}" data-act="team-sub" data-sub="${k}">${this.tl(`team.${k}`)}<i class="dot" data-dot="t-${k}" hidden></i></button>`).join('');
  }

  // Giełda i wyzwania są tylko na Ziemi.
  companyTabs() {
    const F = this.g.D.FEATURES;
    return COMPANY_TABS.filter((k) => (k !== 'market' || F.market) && (k !== 'challenges' || F.challenges));
  }

  renderCompanyTabs() {
    if (!this.companyTabs().includes(this.companySub)) this.companySub = 'investors';
    $('company-tabs').innerHTML = this.companyTabs().map((k) =>
      `<button class="pill ${k === this.companySub ? 'on' : ''}" data-act="company-sub" data-sub="${k}">${t(`ct.${k}`)}<i class="dot" data-dot="${k}" hidden></i></button>`).join('');
  }

  // ---------------------------------------------------------------------
  // Pętla UI
  // ---------------------------------------------------------------------
  frame(now) {
    if (now - this.lastHud > 60) { this.lastHud = now; this.updateHud(); }
    if (now - this.lastSlow > 250) { this.lastSlow = now; this.updateAll(); }
    if (now - this.lastSec >= 1000) {
      const dt = this.lastSec ? Math.min(5, (now - this.lastSec) / 1000) : 0;
      this.lastSec = now;
      this.everySecond(dt);
    }
  }

  // Rzeczy, które wystarczy odświeżać raz na sekundę: zegar zen, liczniki, flagi pór roku.
  everySecond(dt) {
    const s = this.g.s;
    if (this.zen) {
      s.meta.stats.zenTime += dt;
      const d = new Date();
      this.setText($('zen-clock'), `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
      this.setText($('zen-sub'), `${s.meta.companyName} · ${money(this.g.income)}/s`);
    }
    if (musicAudible()) s.meta.stats.musicTime += dt;
    const env = this.scene.env;
    // pogoda ze sceny Ziemi wpływa na dziwactwo „deszczowe natchnienie” w zarządzie (w kosmosie nie pada)
    if (env && this.g.D.id === 'earth') {
      for (const L of Object.values(this.co.layers)) if (L.weather !== env.weather) { L.weather = env.weather; L.recalc(); }
    }
    if (env && this.tab === 'office') {
      const d = new Date();
      if (env.weather === 'snow') s.meta.flags.snow = true;
      if (d.getMonth() === 9 && d.getDate() === 31) s.meta.flags.halloween = true;
      if (d.getMonth() === 11 && d.getDate() >= 24 && d.getDate() <= 26) s.meta.flags.xmas = true;
    }
  }

  enterZen() {
    this.zen = true;
    this.showTab('office');
    $('app').classList.add('zen');
    this.lastSec = 0;
    this.everySecond(0);
  }

  exitZen() {
    this.zen = false;
    $('app').classList.remove('zen');
    this.placeToasts();
  }

  updateAll(force = false) {
    this.updateHud();
    if (force) this.sigs = {};
    switch (this.tab) {
      case 'office': this.updateOffice(); break;
      case 'products': this.updateProducts(); break;
      case 'team': this.updateTeam(); break;
      case 'research': this.updateResearch(); break;
      case 'upgrades': this.updateUpgrades(); break;
      case 'company': this.updateCompany(); break;
      default: break;
    }
    this.updateBadges();
    this.updateSceneBadges();
    this.updateLayerBar();
    this.checkFinale();
    if (this.scene) this.scene.render(this.g);
  }

  // ---------------------------------------------------------------------
  // Warstwy imperium: pasek nad sceną, arkusz z zasilaniem i start w kosmos
  // ---------------------------------------------------------------------
  updateLayerBar() {
    const co = this.co;
    const p = co.unlockProgress();
    const sig = `${this.g.D.id}|${Object.keys(co.layers).join(',')}|${p ? p.id + p.ready : ''}|${getLang()}`;
    const bar = $('layer-bar');
    if (bar && bar._sig !== sig) {
      bar._sig = sig;
      bar.innerHTML = LAYER_CHIPS.map((c) => {
        const open = !!co.layers[c.id];
        const active = c.id === this.g.D.id;
        const ready = !!(p && p.id === c.id && p.ready);
        const cls = active ? 'on' : open ? '' : ready ? 'ready' : 'locked';
        const act = open && !active ? `data-act="layer" data-id="${c.id}"` : ready ? 'data-act="layer-start"' : 'data-act="layers-open"';
        return `<button class="layer-chip ${cls}" ${act} aria-label="${esc(t(`layer.${c.id}`))}"><i>${c.icon}</i>${active ? `<span>${esc(t(`layer.${c.id}`))}</span>` : ''}</button>`;
      }).join('');
    }
    // jednorazowy sygnał, że kolejna warstwa czeka
    if (p && p.ready && !co.meta.flags[`ready_${p.id}`]) {
      co.meta.flags[`ready_${p.id}`] = true;
      this.toast(LAYERS[p.id].icon, this.lt('layer.readyToast', p.id), this.lt('layer.readyToastText', p.id), 'achievement');
      this.pendingNews.unshift(`${LAYERS[p.id].icon} <b>${esc(this.lt('layer.readyToast', p.id))}</b> ${esc(this.lt('layer.readyToastText', p.id))}`);
      play('achievement');
    }
  }

  layerCard(c) {
    const co = this.co;
    const g = co.layers[c.id];
    const name = esc(t(`layer.${c.id}`));
    const tile = `<div class="tile" style="${grad(LAYER_GRADS[c.id])}">${c.icon}</div>`;
    if (g) {
      const active = g === this.g;
      const rounds = c.id === 'earth' ? t('layer.rounds', { n: g.s.prestigeCount }) : this.lt('layer.waves', c.id, { n: g.s.prestigeCount });
      const fin = g.feedIn > 0 ? ` · ${this.lt('layer.feedIn', c.id)}: <b>+${money(g.feedIn)}/s</b>` : '';
      let feed = '';
      const to = g.feedTarget();
      if (to) {
        feed = `<div class="layer-feed"><div class="budget-head"><b>${this.lt('layer.feedTitle', to)}</b>
          <div class="seg">${FEED_SHARES.map((v) => `<button data-act="feed" data-layer="${c.id}" data-v="${v}" class="${v === g.s.feed ? 'on' : ''}">${Math.round(v * 100)}%</button>`).join('')}</div></div>
          <div class="card-sub" style="margin-top:6px">${this.lt('layer.feedText', to, { v: money(g.feedOut * (g.m.feedMult || 1)) })}</div></div>`;
      }
      return `<div class="card layer-card ${active ? 'on' : ''}">${tile}
        <div class="card-title"><h3>${name}</h3><span class="lvl">${active ? t('layer.active') : t('layer.bg')}</span></div>
        <div class="card-sub">${t('layer.income', { v: money(g.income) })}${fin}</div>
        <div class="card-desc">${t('layer.techs', { n: g.techCount(), m: g.D.TECHS.length })} · ${rounds}</div>${feed}
        ${active ? '' : `<div class="card-foot"><div class="prog"></div><button class="btn violet" data-act="layer" data-id="${c.id}">${t('layer.go')}</button></div>`}
      </div>`;
    }
    const p = co.unlockProgress(c.id);
    if (p) {
      const tp = p.techs / p.techsNeed;
      const rp = Math.min(1, p.revenue / p.need);
      return `<div class="card layer-card ${p.ready ? 'ready' : 'locked'}">${tile}
        <div class="card-title"><h3>${name}</h3><span class="lvl">${p.ready ? '✨' : '🔒'}</span></div>
        <div class="prog" style="margin-top:6px"><div class="prog-bar"><i style="width:${tp * 100}%"></i></div><div class="prog-label">${this.lt('layer.needTechs', c.id, { n: p.techs, m: p.techsNeed })}</div></div>
        <div class="prog" style="margin-top:6px"><div class="prog-bar"><i style="width:${rp * 100}%"></i></div><div class="prog-label">${this.lt('layer.needRevenue', c.id, { v: money(p.revenue), need: money(p.need) })}</div></div>
        ${p.ready ? `<div class="card-foot"><div class="prog"></div><button class="btn gold" data-act="layer-start">${this.lt('layer.start', c.id)}</button></div>` : ''}
      </div>`;
    }
    // etap istnieje, ale najpierw trzeba otworzyć poprzedni
    const prev = LAYER_ORDER.find((k) => LAYERS[k].NEXT && LAYERS[k].NEXT.layer === c.id);
    const why = LAYERS[c.id] && prev ? t('layer.needPrev', { name: t(`layer.${prev}`) }) : t('layer.soon');
    return `<div class="card layer-card locked">${tile}
      <div class="card-title"><h3>${name}</h3><span class="lvl">🔒</span></div>
      <div class="card-sub">${why}</div></div>`;
  }

  showLayers() {
    this.openModal(`
      <div class="hero">🌌</div>
      <h2>${t('layer.title')}</h2>
      <p style="text-align:center">${t('layer.lead')}</p>
      <div class="list">${LAYER_CHIPS.map((c) => this.layerCard(c)).join('')}</div>
      <div class="actions"><button class="btn ghost btn-wide" data-act="modal-close">${t('close')}</button></div>`);
  }

  confirmLayerStart() {
    const p = this.co.unlockProgress();
    if (!p || !p.ready) { this.showLayers(); return; }
    const from = this.co.layers[p.from];
    const feed = from.income * (from.s.feed || 0.25) * (from.m.feedMult || 1);
    const lt = (key, params) => this.lt(key, p.id, params);
    this.openModal(`
      <div class="hero">${LAYER_UI[p.id].hero}</div>
      <h2>${lt('space.title')}</h2>
      <p style="text-align:center">${lt('space.lead')}</p>
      <ul>
        <li>${lt('space.p1')}</li>
        <li>${lt('space.p2', { grant: money(from.income * LAYER_GRANT_SECONDS), feed: money(feed) })}</li>
        <li>${lt('space.p3')}</li><li>${lt('space.p4')}</li><li>${lt('space.p5')}</li>
      </ul>
      <div class="actions">
        <button class="btn gold btn-wide" data-act="layer-start-confirm">${lt('space.go')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${lt('space.later')}</button>
      </div>`);
  }

  // Przełączenie ekranu na inną warstwę: inne dane, scena, teksty i pasek wiadomości.
  switchLayer(id, quiet = false) {
    if (!this.co.setLayer(id)) return;
    this.closeModal();
    this.sigs = {};
    // powiadomienia z poprzedniego ekranu są już nieaktualne
    this.toastQueue = [];
    $('toasts').innerHTML = '';
    this.applyStatic();
    this.renderCompanyTabs();
    this.renderTeamTabs();
    this.renderBuySegs();
    this.scene.render(this.g, true);
    this.syncBubble(true);
    this.syncDecision();
    this.pendingNews = [];
    this.restartTicker();
    this.showTab(this.tab);
    $('scene-wrap').animate([{ opacity: 0.2, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
    if (!quiet) { play('unlock'); this.toast(LAYERS[id].icon, t('layer.switched', { name: t(`layer.${id}`) }), '', 'info'); }
    this.hooks.save?.();
  }

  showLayersIntro() {
    this.openModal(`
      <div class="hero">🌍🛰️</div>
      <h2>${t('lay.title')}</h2>
      <p>${t('lay.text')}</p>
      <p>${t('lay.kept')}</p>
      <div class="actions"><button class="btn violet btn-wide" data-act="modal-close">${t('lay.ok')}</button></div>`);
  }

  setText(el, text) { if (el && el.textContent !== text) el.textContent = text; }
  patchHtml(el, html) { if (el && el._html !== html) { el._html = html; el.innerHTML = html; } }

  updateHud() {
    const g = this.g;
    const s = g.s;
    this.setText($('hud-cash'), money(s.cash));
    this.setText($('hud-income'), money(g.netIncome));
    $('hud-income').parentElement.classList.toggle('rd', (g.m.rdShare || 0) > 0);
    $('hud-income').parentElement.classList.toggle('boosted', g.m.boostIncome > 1);
    this.setText($('hud-company'), s.meta.companyName);
    this.setText($('hud-stage'), this.stageName());
    const rpVis = s.deptUnlocked[g.D.RD_DEPT] || s.rp > 0 || g.techCount() > 0;
    $('hud-rp-chip').hidden = !rpVis;
    if (rpVis) this.setText($('hud-rp'), fmt(s.rp));
    $('hud-inv-chip').hidden = !(s.investors > 0);
    if (s.investors > 0) this.setText($('hud-inv'), fmt(s.investors));
    const noClick = !(g.clickValue > 0);
    this.setText($('click-value'), noClick ? this.tl('tap.off') : '+' + money(g.clickValue));
    $('tap-btn').classList.toggle('hack', !!g.boostActive('click') || !!g.boostActive('dClick'));
    $('tap-btn').classList.toggle('off', noClick);
  }

  stageName() {
    const s = this.g.s;
    const n = this.g.deptCount() - 1;
    const stage = this.g.D.TEXT ? this.tl('stages')[n >= 8 ? 5 : n >= 6 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : 0] : TX.stageName(n);
    return s.prestigeCount > 0 ? `${stage} · ${this.roundLabel(s.prestigeCount - 1)}` : stage;
  }
  // Nazwa rundy finansowania (Ziemia), fali kolonizacji (Kosmos) albo wyprawy (Galaktyka) o numerze i (od zera).
  roundLabel(i) { return this.g.D.TEXT ? this.tl('round', { n: i + 1 }) : TX.roundName(i); }

  updateSoundBtn() {
    $('sound-btn').innerHTML = this.g.s.meta.settings.sound ? SOUND_ON : SOUND_OFF;
  }

  // ---------------------------------------------------------------------
  // Biuro
  // ---------------------------------------------------------------------
  updateOffice() {
    const g = this.g;
    const s = g.s;
    const owned = this.g.D.PRODUCTS.reduce((a, p) => a + (s.products[p.id] || 0), 0);
    let left = '';
    if (owned === 0) {
      left = `<div class="mini-stat">${t('off.firstStep')}<b>${t('off.collect', { v: money(this.g.D.PRODUCTS[0].cost) })}</b></div><button class="mini-btn" data-act="goto" data-tab="products">${t('off.toProducts')}</button>`;
    } else {
      left = `<div class="mini-stat">${t('off.team')}<b>${t('off.people', { n: fmtInt(g.totalHeads()) })}</b></div>`;
      if (g.feedIn > 0) left += `<div class="mini-stat">${this.tl('layer.feedIn')}<b>+${money(g.feedIn)}/s</b></div>`;
      else if (g.rpRate > 0) left += `<div class="mini-stat">${t('off.research')}<b>${fmt(g.rpRate)} ${t('unit.rp')}/s</b></div>`;
      else left += `<div class="mini-stat">${t('off.products')}<b>${t('off.levels', { n: fmtInt(owned) })}</b></div>`;
    }
    let right = `<div class="mini-stat">${t('off.valuation')}<b>${money(g.valuation())}</b></div>`;
    const gain = g.prestigeGain();
    const offers = s.contracts.offers.length;
    if (gain >= 1 && gain >= Math.max(1, s.investors * 0.5)) {
      right += `<button class="mini-btn glow" data-act="goto" data-tab="company" data-sub="investors">${this.lu.cur} +${fmt(gain)}</button>`;
    } else if (g.contractsUnlocked() && offers > 0) {
      right += `<button class="mini-btn" data-act="goto" data-tab="company" data-sub="contracts">${t('off.offers', { n: offers })}</button>`;
    } else {
      right += `<div class="mini-stat">${this.tl('off.coding')}<b>${money(g.clickValue)}</b></div>`;
    }
    const L = $('office-left'); const R = $('office-right');
    if (L.innerHTML !== left) L.innerHTML = left;
    if (R.innerHTML !== right) R.innerHTML = right;
  }

  updateSceneBadges() {
    const g = this.g;
    const s = g.s;
    const now = Date.now();
    const parts = [];
    const bi = g.boostActive('income');
    if (bi) parts.push(`<span class="scene-badge hot">🔥 Viral ×${bi.x} · ${fmtClock((bi.until - now) / 1000)}</span>`);
    const bc = g.boostActive('click');
    if (bc) parts.push(`<span class="scene-badge click">⚡ Hackathon ×${bc.x} · ${fmtClock((bc.until - now) / 1000)}</span>`);
    if (s.trend && s.trend.until > now) {
      parts.push(`<span class="scene-badge trend">📈 ${esc(TX.prodName(s.trend.pid))} ×${num(s.trend.x)} · ${fmtClock((s.trend.until - now) / 1000)}</span>`);
    }
    if (s.contracts.active.length) {
      const next = Math.min(...s.contracts.active.map((a) => a.end));
      parts.push(`<span class="scene-badge" data-act="goto" data-tab="company" data-sub="contracts">${t('badge.contracts', { n: s.contracts.active.length, t: fmtClock((next - now) / 1000) })}</span>`);
    }
    for (const k of ['dIncome', 'dClick', 'dRp']) {
      const b = g.boostActive(k);
      if (b) parts.push(`<span class="scene-badge hot">${t(`badge.${k}`, { x: num(b.x), t: fmtClock((b.until - now) / 1000) })}</span>`);
    }
    if (s.pending.length) {
      const p = s.pending.reduce((a, b) => (b.at < a.at ? b : a));
      parts.push(`<span class="scene-badge trend">${t('badge.pending', { n: '+' + money(p.cash), t: fmtClock((p.at - now) / 1000) })}</span>`);
    }
    if (s.challenge) {
      const ch = CHALLENGE_MAP[s.challenge.id];
      const goal = s.challenge.goal || CHALLENGE_GOALS[s.challenge.tier];
      parts.push(`<span class="scene-badge click" data-act="goto" data-tab="company" data-sub="challenges">${t('badge.challenge', { icon: ch.icon, name: esc(TX.challengeName(ch.id)), p: `${money(s.runEarned)} / ${money(goal)}` })}</span>`);
    }
    const html = parts.join('');
    const el = $('scene-badges');
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  syncBubble(force = false) {
    const b = this.g.s.bubble;
    const layer = $('bubble-layer');
    if (!b) {
      if (this.bubbleEl) {
        const el = this.bubbleEl;
        this.bubbleEl = null;
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 320);
      }
      return;
    }
    if (!force && this.bubbleEl && this.bubbleEl.dataset.until === String(b.until)) return;
    if (this.bubbleEl) this.bubbleEl.remove();
    const info = BUBBLES[b.type];
    const el = document.createElement('button');
    el.className = 'bubble';
    el.dataset.until = String(b.until);
    el.dataset.label = TX.bubbleName(b.type);
    el.textContent = info.icon;
    el.style.left = `${b.x * 100}%`;
    el.style.top = `${b.y * 100}%`;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      unlockAudio();
      const res = this.g.popBubble(Date.now());
      if (res) {
        play('bubble');
        const app = $('app').getBoundingClientRect();
        const n = document.createElement('div');
        n.className = 'float-num crit';
        n.textContent = res.title;
        n.style.left = `${e.clientX - app.left}px`;
        n.style.top = `${e.clientY - app.top - 30}px`;
        n.addEventListener('animationend', () => n.remove());
        this.fx.appendChild(n);
      }
    }, { once: true });
    layer.appendChild(el);
    this.bubbleEl = el;
  }

  restartTicker() {
    if (this.tickerAnim) { this.tickerAnim.onfinish = null; this.tickerAnim.cancel(); }
    this.nextTicker();
  }

  nextTicker() {
    const el = $('ticker');
    let html;
    if (this.pendingNews.length) html = this.pendingNews.shift();
    else {
      const news = TX.newsList(this.g.D.id);
      this.newsIdx = (this.newsIdx + 1 + Math.floor(Math.random() * 3)) % news.length;
      html = '📰 ' + esc(news[this.newsIdx]).replace(/\{c\}/g, `<b>${esc(this.g.s.meta.companyName)}</b>`);
    }
    el.innerHTML = html;
    const w = el.scrollWidth;
    const box = el.parentElement.clientWidth || 300;
    const dist = w;
    const dur = Math.max(6000, (dist / 50) * 1000);
    el.style.transform = 'translateX(0)';
    const anim = el.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${dist}px)` }], { duration: dur, easing: 'linear' });
    this.tickerAnim = anim;
    anim.onfinish = () => setTimeout(() => this.nextTicker(), 400);
    void box;
  }

  // ---------------------------------------------------------------------
  // Produkty
  // ---------------------------------------------------------------------
  visibleProducts() {
    const g = this.g;
    const list = [];
    let teaser = null;
    for (const p of this.g.D.PRODUCTS) {
      if (g.productUnlocked(p.id)) list.push(p);
      else if (!teaser) teaser = p;
    }
    return { list, teaser };
  }

  updateProducts() {
    const g = this.g;
    const s = g.s;
    const { list, teaser } = this.visibleProducts();
    const sig = list.map((p) => p.id).join(',') + '|' + (teaser ? teaser.id : '');
    const root = $('products-list');
    if (this.sigs.products !== sig) {
      this.sigs.products = sig;
      let html = list.map((p) => `
        <div class="card" data-pid="${p.id}">
          <div class="tile" style="${grad(this.g.D.CATEGORIES[p.cat].grad)}">${p.icon}</div>
          <div class="card-title"><h3>${esc(TX.prodName(p.id))}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="inc"></div>
          <div class="card-desc">${esc(TX.prodDesc(p.id))}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="buy-product" data-id="${p.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      if (teaser) {
        const tech = this.g.D.TECH_MAP[teaser.tech];
        html += `
        <div class="card teaser locked">
          <div class="tile" style="${grad(this.g.D.CATEGORIES[teaser.cat].grad)}">${teaser.icon}</div>
          <div class="card-title"><h3>${esc(TX.prodName(teaser.id))}</h3><span class="lvl">🔒</span></div>
          <div class="card-sub">${t('prod.requires')} <span class="rp">${tech.icon} ${esc(TX.techName(tech.id))}</span></div>
          <div class="card-desc">${esc(TX.prodDesc(teaser.id))}</div>
          <div class="card-foot"><div class="prog"></div><button class="btn violet" data-act="goto" data-tab="research">${t('goResearch')}</button></div>
        </div>`;
      }
      root.innerHTML = html;
    }
    const hint = $('products-reach');
    const sat = g.capOn() && g.rawIncome > g.marketCap * 1.05;
    if (hint.hidden === sat) hint.hidden = !sat;
    if (sat) this.patchHtml(hint, t('reach.sat', { stage: t(`reach.${g.marketStage()}`), v: money(g.marketCap) }));
    const amt = this.buyAmount();
    for (const card of root.querySelectorAll('[data-pid]')) {
      const id = card.dataset.pid;
      const lvl = s.products[id] || 0;
      const inc = g.prodIncome[id] || 0;
      const share = g.income > 0 ? inc / g.income : 0;
      this.setText(card.querySelector('[data-f="lvl"]'), t('prod.level', { n: fmtInt(lvl) }));
      const incEl = card.querySelector('[data-f="inc"]');
      const pct = share >= 0.995 ? '100%' : share >= 0.01 ? `${Math.round(share * 100)}%` : '<1%';
      const blocked = !g.canOwnProduct(id);
      const incHtml = lvl > 0 ? t('prod.income', { v: money(inc), p: pct }) : blocked ? t('prod.focusLimit') : t('prod.notReleased');
      if (incEl.innerHTML !== incHtml) incEl.innerHTML = incHtml;
      const next = nextMilestone(lvl);
      const prev = prevMilestone(lvl);
      const bar = card.querySelector('[data-f="bar"]');
      if (next) {
        bar.style.width = `${Math.min(100, ((lvl - prev) / (next - prev)) * 100)}%`;
        this.setText(card.querySelector('[data-f="ms"]'), t('prod.milestone', { n: fmtInt(lvl), m: next }));
      } else {
        bar.style.width = '100%';
        this.setText(card.querySelector('[data-f="ms"]'), t('prod.allMilestones'));
      }
      let n = amt === 'max' ? g.productMax(id) : amt;
      const showN = Math.max(1, n);
      const cost = g.productCost(id, showN);
      const btn = card.querySelector('.btn');
      btn.classList.toggle('off', cost > s.cash || n < 1 || blocked);
      this.setText(card.querySelector('[data-f="bn"]'), lvl === 0 && showN === 1 ? t('prod.release') : t('prod.buy', { n: fmtInt(showN) }));
      this.setText(card.querySelector('[data-f="cost"]'), money(cost));
    }
  }

  // ---------------------------------------------------------------------
  // Zespół
  // ---------------------------------------------------------------------
  deptEffectText(d) {
    const g = this.g;
    const s = g.s;
    const m = g.m;
    const n = s.depts[d.id] || 0;
    const k = n * deptMilestoneMult(n) * (m.dept[d.id] || 1) * m.deptAll;
    const parts = [];
    for (const e of d.per) {
      const v = e.v * k;
      const c = e.cap ? Math.min(e.cap, v) : v;
      switch (e.t) {
        case 'income': parts.push(t('fx.income', { p: fmtPct(v) })); break;
        case 'clickFlat': parts.push(t('fx.clickFlat', { v: fmt(v) })); break;
        case 'clickMult': parts.push(t('fx.clickMult', { p: fmtPct(v) })); break;
        case 'rp': parts.push(`<span class="rp">${t('fx.rp', { v: fmt(v * m.rp) })}</span>`); break;
        case 'eventFreq': parts.push(t('fx.eventFreq', { p: fmtPct(c) })); break;
        case 'contract': parts.push(t('fx.contract', { p: fmtPct(c) })); break;
        case 'slotEvery': { const k2 = Math.min(MAX_SLOTS, 1 + Math.floor(n / e.v)); parts.push(t('fx.slots', { n: k2, noun: noun('slots', k2) })); break; }
        case 'offlineEff': parts.push(t('fx.offlineEff', { p: fmtPct(c) })); break;
        case 'hireCost': parts.push(t('fx.hireCost', { n: Math.round(c * 100) })); break;
        case 'prodCost': parts.push(t('fx.prodCost', { n: Math.round(c * 100) })); break;
        case 'offlineCap': parts.push(t('fx.offlineCap', { t: fmtTime(v) })); break;
        case 'auto': parts.push(t('fx.auto', { v: fmt(v) })); break;
        case 'cat': parts.push(t('fx.cat', { p: fmtPct(c), c: TX.catName(e.cat) })); break;
        case 'acqCost': parts.push(t('fx.acqCost', { n: Math.round(c * 100) })); break;
        case 'prestige': parts.push(t('fx.prestige', { p: fmtPct(c) })); break;
        default: break;
      }
    }
    return parts.join(' · ');
  }

  updateTeam() {
    const other = this.teamSub !== 'depts';
    $('team-list').hidden = other;
    $('world-body').hidden = !other;
    $('team-buy-seg').style.visibility = other ? 'hidden' : '';
    if (this.teamSub === 'world') { this.updateWorld(); return; }
    if (this.teamSub === 'board') { this.updateBoard(); return; }
    const g = this.g;
    const s = g.s;
    const unlocked = this.g.D.DEPTS.filter((d) => s.deptUnlocked[d.id]);
    const next = this.g.D.DEPTS.find((d) => !s.deptUnlocked[d.id]);
    const sig = unlocked.map((d) => d.id).join(',') + '|' + (next ? next.id + (g.deptAvailable(next.id) ? '1' : '0') : '') + '|' + (g.rule()?.id || '');
    const root = $('team-list');
    if (this.sigs.team !== sig) {
      this.sigs.team = sig;
      let html = unlocked.map((d) => `
        <div class="card" data-did="${d.id}">
          <div class="tile" style="${grad([d.color, '#2b2f5c'])}">${d.icon}</div>
          <div class="card-title"><h3>${esc(TX.deptName(d.id))}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="fx"></div>
          <div class="card-desc">${esc(TX.deptDesc(d.id))}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="hire" data-id="${d.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      const solo = g.rule()?.rule === 'onlyDev';
      if (next && solo) {
        html += `<div class="hint">${t('team.solo')}</div>`;
      } else if (next) {
        const avail = g.deptAvailable(next.id);
        const tech = next.tech ? this.g.D.TECH_MAP[next.tech] : null;
        html += `
        <div class="card ${avail ? '' : 'locked'}" data-next="${next.id}">
          <div class="tile" style="${grad([next.color, '#2b2f5c'])}">${next.icon}</div>
          <div class="card-title"><h3>${esc(TX.deptName(next.id))}</h3><span class="lvl">${this.tl('team.newFloor')}</span></div>
          <div class="card-sub">${avail || !tech ? this.tl('team.openHint') : `${t('prod.requires')} <span class="rp">${tech.icon} ${esc(TX.techName(tech.id))}</span>`}</div>
          <div class="card-desc">${esc(TX.deptDesc(next.id))}</div>
          <div class="card-foot"><div class="prog"></div>
            ${avail ? `<button class="btn violet" data-act="unlock-dept" data-id="${next.id}"><span>${t('team.open')}</span><small data-f="ucost">${money(next.unlock)}</small></button>`
    : `<button class="btn violet" data-act="goto" data-tab="research">${t('goResearch')}</button>`}
          </div>
        </div>`;
      }
      root.innerHTML = html;
    }
    const amt = this.buyAmount();
    for (const card of root.querySelectorAll('[data-did]')) {
      const id = card.dataset.did;
      const d = this.g.D.DEPT_MAP[id];
      const n = s.depts[id] || 0;
      this.setText(card.querySelector('[data-f="lvl"]'), `👥 ${fmtInt(n)}`);
      const fxEl = card.querySelector('[data-f="fx"]');
      const fxHtml = n > 0 ? this.deptEffectText(d) : t('team.hireFirst');
      if (fxEl.innerHTML !== fxHtml) fxEl.innerHTML = fxHtml;
      const nm = nextDeptMilestone(n);
      const bar = card.querySelector('[data-f="bar"]');
      if (nm) {
        const prev = DEPT_MS_PREV.filter((x) => x <= n).pop() || 0;
        bar.style.width = `${Math.min(100, ((n - prev) / (nm - prev)) * 100)}%`;
        this.setText(card.querySelector('[data-f="ms"]'), t('team.milestone', { n: fmtInt(n), m: nm, x: num(DEPT_MILESTONE_X) }));
      } else {
        bar.style.width = '100%';
        this.setText(card.querySelector('[data-f="ms"]'), t('team.full'));
      }
      const k = amt === 'max' ? g.hireMax(id) : amt;
      const showN = Math.max(1, k);
      const cost = g.hireCost(id, showN);
      card.querySelector('.btn').classList.toggle('off', cost > s.cash || k < 1);
      this.setText(card.querySelector('[data-f="bn"]'), t('team.hire', { n: fmtInt(showN) }));
      this.setText(card.querySelector('[data-f="cost"]'), money(cost));
    }
    const nx = root.querySelector('[data-next]');
    if (nx) {
      const btn = nx.querySelector('[data-act="unlock-dept"]');
      if (btn) btn.classList.toggle('off', s.cash < this.g.D.DEPT_MAP[nx.dataset.next].unlock);
    }
  }

  // ---------------------------------------------------------------------
  // Świat: biura na mapie i w kosmosie
  // ---------------------------------------------------------------------
  updateWorld() {
    const g = this.g;
    const s = g.s;
    const avail = this.g.D.OFFICES.map((o) => (g.officeAvailable(o.id) ? 1 : 0)).join('');
    const sig = `world|${JSON.stringify(s.offices)}|${avail}|${s.view}|${getLang()}`;
    const root = $('world-body');
    if (this.sigs.world !== sig) {
      this.sigs.world = sig;
      const list = this.g.D.OFFICES;
      const opened = list.filter((o) => !o.hq && g.officeLevel(o.id) > 0).length;
      root.innerHTML = `
        <div class="map-card ${{ space: 'space solar', galaxy: 'space galaxy', universe: 'space cosmos' }[g.D.id] || ''}">${{ space: () => this.solarSvg(), galaxy: () => this.galaxySvg(), universe: () => this.webSvg() }[g.D.id]?.() ?? this.mapSvg()}</div>
        <div class="kv"><span>${this.tl('off.title')}</span><b>${this.tl('off.count', { n: opened, m: list.length - 1 })}</b></div>
        <p class="card-sub" style="margin:8px 2px 0">${this.tl('off.lead')} ${this.tl('off.viewHint')}</p>
        <div class="list" style="margin-top:12px">${list.map((o) => this.officeCard(o)).join('')}</div>`;
    }
    const vals = {};
    for (const o of this.g.D.OFFICES) {
      const cost = g.officeCost(o.id);
      vals[`of-${o.id}`] = { off: !(cost <= s.cash) };
    }
    this.patch(vals, root);
  }

  // ---------------------------------------------------------------------
  // Zarząd
  // ---------------------------------------------------------------------
  updateBoard() {
    const g = this.g;
    const s = g.s;
    const root = $('world-body');
    if (!g.boardUnlocked()) {
      if (this.sigs.world !== `bd-locked|${getLang()}`) { this.sigs.world = `bd-locked|${getLang()}`; root.innerHTML = `<div class="hint">${t('bd.locked')}</div>`; }
      return;
    }
    const sig = `bd|${getLang()}|${Object.values(s.meta.board).map((e) => e.id).join(',')}|${s.meta.candidates.map((c) => c.id).join(',')}|${g.boardSignature()}`;
    if (this.sigs.world !== sig) {
      this.sigs.world = sig;
      const seats = ROLES.map((r) => {
        const e = s.meta.board[r.id];
        if (!e) {
          return `<div class="card exec empty"><div class="avatar-wrap">${emptyAvatar()}</div>
            <div class="card-title"><h3>${t('bd.empty')}</h3><span class="lvl role-badge" style="color:${r.color}">${r.name}</span></div>
            <div class="card-sub">${esc(TX.roleArea(r.id))} · ${t('bd.emptyHint')}</div></div>`;
        }
        return this.execCard(e, true);
      }).join('');
      const cands = s.meta.candidates.map((c) => this.execCard(c, false)).join('');
      root.innerHTML = `
        <p class="card-sub" style="margin:0 2px 10px">${t('bd.lead')}</p>
        <div class="list">${seats}</div>
        <div class="section-title">📇 ${t('bd.candidates')} <span style="color:var(--gold)" data-v="bdshares"></span></div>
        <div class="list">${cands}</div>
        <div class="hint" data-v="bdwait" style="margin-top:${cands ? 10 : 0}px"></div>`;
    }
    const vals = {
      bdshares: t('inv.shares', { n: fmt(s.meta.shares) }),
      bdwait: s.meta.candidates.length >= BOARD.poolMax ? t('bd.poolFull') : t('bd.waiting', { t: fmtTime(Math.max(0, (s.meta.nextCandidateAt - Date.now()) / 1000)) }),
    };
    for (const c of s.meta.candidates) vals[`hire-${c.id}`] = { off: s.meta.shares < g.candidateCost(c) };
    for (const e of Object.values(s.meta.board)) {
      const lvl = g.execLevel(e);
      if (lvl < BOARD.maxLevel) {
        const fast = e.q === 'fast' ? 2 : 1;
        const nextAt = e.hiredAt + ((Math.pow(2, lvl) - 1) / fast) * 3.6e6;
        vals[`lvl-${e.id}`] = t('bd.next', { t: fmtTime((nextAt - Date.now()) / 1000) });
      } else vals[`lvl-${e.id}`] = t('bd.maxLevel');
    }
    this.patch(vals, root);
  }

  execCard(e, hired) {
    const g = this.g;
    const role = ROLE_MAP[e.role];
    const q = e.q ? QUIRK_MAP[e.q] : null;
    const lvl = hired ? g.execLevel(e) : 1;
    const k = hired ? g.execPower(e) : 1;
    const fx = TX.describeFx(e.traits.map((tr) => scaleTrait(tr, k)));
    const qOn = hired && q && q.when !== 'xp' && g.quirkActive(e);
    const current = !hired ? g.s.meta.board[e.role] : null;
    const quirk = q ? `<div class="quirk ${qOn ? 'on' : ''}">${q.icon} <b>${esc(TX.quirkName(q.id))}</b>: ${esc(TX.quirkDesc(q.id))}${qOn ? ` <span class="q-on">· ${t('bd.quirkOn')}</span>` : ''}</div>` : '';
    const foot = hired
      ? `<div class="prog"><div class="prog-label" data-v="lvl-${e.id}"></div></div><button class="btn btn-small ghost" data-act="fire-exec" data-id="${e.role}">${t('bd.fire')}</button>`
      : `<div class="prog"><div class="prog-label">${current ? esc(t('bd.seat', { role: role.name, name: TX.execName(current.n) })) : ''}</div></div>
         <button class="btn btn-small ghost" data-act="dismiss-cand" data-id="${e.id}">${t('bd.dismiss')}</button>
         <button class="btn gold btn-small" data-act="hire-exec" data-id="${e.id}" data-v="hire-${e.id}"><span>${current ? t('bd.replace') : t('bd.hire')}</span><small>${fmt(g.candidateCost(e))} 💎</small></button>`;
    return `<div class="card exec r${e.r}">
      <div class="avatar-wrap">${avatar(e.seed, role.color, e.r)}</div>
      <div class="card-title"><h3>${esc(TX.execName(e.n))}</h3><span class="lvl role-badge" style="color:${role.color}">${role.name}${hired ? ` · ${t('bd.level', { n: lvl, m: BOARD.maxLevel })}` : ''}</span></div>
      <div class="card-sub"><span class="rarity r${e.r}">${t('bd.rarity')[e.r]}</span> · ${esc(TX.roleArea(e.role))}</div>
      <div class="card-desc"><b class="fx-line">${esc(fx)}</b>${quirk}</div>
      <div class="card-foot">${foot}</div>
    </div>`;
  }

  confirmFire(role) {
    const e = this.g.s.meta.board[role];
    if (!e) return;
    this.openModal(`
      <div class="hero" style="display:flex;justify-content:center">${avatar(e.seed, ROLE_MAP[role].color, e.r, 72)}</div>
      <h2>${esc(t('bd.fireTitle', { name: TX.execName(e.n) }))}</h2>
      <p style="text-align:center">${esc(t('bd.fireText', { role: ROLE_MAP[role].name }))}</p>
      <div class="actions">
        <button class="btn danger btn-wide" data-act="fire-confirm" data-id="${role}">${t('bd.fireOk')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('cancel')}</button>
      </div>`);
  }

  officeCard(o) {
    const g = this.g;
    const lvl = g.officeLevel(o.id);
    const maxed = lvl >= OFFICE_MAX_LEVEL;
    const avail = g.officeAvailable(o.id);
    const tech = o.req ? this.g.D.TECH_MAP[o.req] : null;
    const viewing = this.g.s.view === o.id;
    const lvlName = lvl > 0 ? `${o.hq ? this.tl('off.hq') : this.tl('off.levelNames')[lvl - 1]} · ` : '';
    const fxNow = lvl > 1 ? ` · ${t('off.now', { fx: esc(TX.describeFx(scaledFx(o.fx, lvl))) })}` : '';
    let action;
    if (maxed) action = `<span class="lvl" style="color:var(--money)">${t('off.max')}</span>`;
    else if (avail) action = `<button class="btn violet" data-act="open-office" data-id="${o.id}" data-v="of-${o.id}"><span>${lvl ? t('off.upgrade') : this.tl('off.open')}</span><small>${money(g.officeCost(o.id))}</small></button>`;
    else action = `<button class="btn violet" data-act="goto" data-tab="research">${t('goResearch')}</button>`;
    const viewBtn = lvl > 0 ? `<button class="btn btn-small ghost ${viewing ? 'on-view' : ''}" data-act="set-view" data-id="${o.id}">${viewing ? '👁' : '🪟'} ${viewing ? t('off.viewing') : t('off.view')}</button>` : '';
    return `<div class="card office ${lvl ? '' : avail ? '' : 'locked'}" id="office-${o.id}">
      <div class="tile" style="${grad(LAYER_GRADS[g.D.id] || LAYER_GRADS.earth)}">${o.icon}</div>
      <div class="card-title"><h3>${esc(TX.officeName(o.id))}</h3><span class="lvl">${lvlName}${t('off.level', { n: lvl, m: OFFICE_MAX_LEVEL })}</span></div>
      <div class="card-sub">${avail || lvl ? `${t('off.perLevel', { fx: esc(TX.describeFx(o.fx)) })}${fxNow}` : `${t('prod.requires')} <span class="rp">${tech.icon} ${esc(TX.techName(tech.id))}</span>`}</div>
      <div class="card-desc">${esc(TX.officeDesc(o.id))}</div>
      <div class="card-foot">${viewBtn}<div class="prog"></div>${action}</div>
    </div>`;
  }

  mapSvg() {
    const g = this.g;
    const hq = this.g.D.OFFICE_MAP[this.g.D.HQ];
    const hx = mapX(hq.lon);
    const hy = mapY(hq.lat);
    let arcs = '';
    let marks = '';
    for (const o of this.g.D.OFFICES) {
      if (o.kind !== 'earth') continue;
      const x = mapX(o.lon);
      const y = mapY(o.lat);
      const lvl = g.officeLevel(o.id);
      const avail = g.officeAvailable(o.id);
      if (lvl > 0 && !o.hq) {
        const mx = (hx + x) / 2;
        const my = (hy + y) / 2 - Math.hypot(x - hx, y - hy) * 0.28;
        arcs += `<path class="arc" d="M${hx} ${hy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
      }
      const cls = lvl > 0 ? 'm-on' : avail ? 'm-avail' : 'm-lock';
      const r = lvl > 0 ? 2.4 + lvl * 0.6 : 2.3;
      marks += `<g class="marker ${cls}" data-act="office-focus" data-id="${o.id}">
        ${lvl > 0 ? `<circle class="ping" cx="${x}" cy="${y}" r="${r + 2}"/>` : ''}
        <circle class="dot" cx="${x}" cy="${y}" r="${r}"/>
        <circle cx="${x}" cy="${y}" r="9" fill="transparent"/></g>`;
    }
    return `<svg viewBox="0 0 360 ${MAP_H}" role="img" aria-label="${t('off.title')}">
      <path d="${landPath()}" fill="rgba(167,139,250,.32)"/>
      <g fill="none">${arcs}</g>${marks}
    </svg><div class="map-hint">${t('off.mapHint')}</div>`;
  }

  // Układ Słoneczny z góry: orbity planet i kolonie (dotknięcie przewija do karty kolonii).
  solarSvg() {
    const g = this.g;
    const cx = 180; const cy = 84;
    const pos = (p) => {
      const rx = 168 * Math.sqrt(p.au / 9.5) + 6;
      const a = (p.ang * Math.PI) / 180;
      return { rx, ry: rx * 0.42, x: cx + rx * Math.cos(a), y: cy + rx * 0.42 * Math.sin(a) };
    };
    let orbits = '';
    let bodies = '';
    for (const [id, p] of Object.entries(PLANETS)) {
      const q = pos(p);
      orbits += `<ellipse cx="${cx}" cy="${cy}" rx="${q.rx.toFixed(1)}" ry="${q.ry.toFixed(1)}" fill="none" stroke="rgba(255,255,255,.12)" stroke-dasharray="${id === 'ceres' ? '1 3' : '0'}"/>`;
      if (id === 'saturn') bodies += `<ellipse cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" rx="${p.r * 1.9}" ry="${p.r * 0.5}" fill="none" stroke="#f1dcae" stroke-width="1.5" opacity=".8"/>`;
      bodies += `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${p.r}" fill="${p.c}"/>`;
    }
    let marks = '';
    for (const o of this.g.D.OFFICES) {
      const at = COLONY_AT[o.id];
      if (!at) continue;
      const q = pos(PLANETS[at[0]]);
      const x = q.x + at[1];
      const y = q.y + at[2];
      const lvl = g.officeLevel(o.id);
      const cls = lvl > 0 ? 'm-on' : g.officeAvailable(o.id) ? 'm-avail' : 'm-lock';
      marks += `<g class="marker ${cls}" data-act="office-focus" data-id="${o.id}">
        ${lvl > 0 ? `<circle class="ping" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${3 + lvl}"/>` : ''}
        <circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lvl > 0 ? 2.2 + lvl * 0.5 : 2}"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent"/></g>`;
    }
    return `<svg viewBox="0 0 360 168" role="img" aria-label="${this.tl('off.title')}">
      <defs><radialGradient id="sunR"><stop offset="0" stop-color="#fff7c2"/><stop offset=".5" stop-color="#ffd166"/><stop offset="1" stop-color="#ff9f43" stop-opacity="0"/></radialGradient></defs>
      ${orbits}<circle cx="${cx}" cy="${cy}" r="22" fill="url(#sunR)"/><circle cx="${cx}" cy="${cy}" r="9" fill="#ffe08a"/>${bodies}${marks}
    </svg><div class="map-hint">${this.tl('off.mapHint')}</div>`;
  }

  // Mapa Drogi Mlecznej: cztery ramiona spiralne (log-spirale), jądro i placówki w układach.
  galaxySvg() {
    const g = this.g;
    const { cx, cy, scale, tilt } = GALAXY_MAP;
    const pos = (r, ang) => {
      const a = (ang * Math.PI) / 180;
      return { x: cx + r * scale * Math.cos(a), y: cy + r * scale * tilt * Math.sin(a) };
    };
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const colors = ['#e0e7ff', '#c7d2fe', '#fbcfe8', '#fde68a'];
    let stars = '';
    for (let arm = 0; arm < 4; arm++) {
      for (let k = 0; k < 64; k++) {
        const r = 3 + (42 * k) / 64 + (rnd() - 0.5) * 3;
        const ang = 148 + arm * 90 + 140 * Math.log(Math.max(r, 3) / 3) + (rnd() - 0.5) * 16;
        const q = pos(r, ang);
        stars += `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${(0.5 + rnd() * 0.9).toFixed(2)}" fill="${colors[Math.floor(rnd() * colors.length)]}" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`;
      }
    }
    let marks = '';
    for (const o of g.D.OFFICES) {
      const q = pos(o.r, o.ang);
      const lvl = g.officeLevel(o.id);
      const cls = lvl > 0 ? 'm-on' : g.officeAvailable(o.id) ? 'm-avail' : 'm-lock';
      marks += `<g class="marker ${cls}" data-act="office-focus" data-id="${o.id}">
        ${lvl > 0 ? `<circle class="ping" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${3 + lvl}"/>` : ''}
        <circle class="dot" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${lvl > 0 ? 2.2 + lvl * 0.5 : 2}"/>
        <circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="10" fill="transparent"/></g>`;
    }
    const lmc = pos(50, 228);
    return `<svg viewBox="0 0 360 184" role="img" aria-label="${this.tl('off.title')}">
      <defs><radialGradient id="bulgeG"><stop offset="0" stop-color="#fff7d6"/><stop offset=".35" stop-color="#fcd34d" stop-opacity=".8"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
        <radialGradient id="discG"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".35"/><stop offset="1" stop-color="#1e1b4b" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${cx}" cy="${cy}" rx="${46 * scale}" ry="${46 * scale * tilt}" fill="url(#discG)"/>
      <ellipse cx="${lmc.x.toFixed(1)}" cy="${lmc.y.toFixed(1)}" rx="14" ry="7" fill="#c7d2fe" opacity=".18"/>
      ${stars}
      <ellipse cx="${cx}" cy="${cy}" rx="26" ry="13" fill="url(#bulgeG)"/>${marks}
    </svg><div class="map-hint">${this.tl('off.mapHint')}</div>`;
  }

  // Mapa kosmicznej sieci: węzły gromad połączone włóknami, placówki w węzłach.
  webSvg() {
    const g = this.g;
    let seed = 23;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const nodes = g.D.OFFICES.map((o) => ({ x: o.x, y: o.y }));
    for (let i = 0; i < 34; i++) nodes.push({ x: 8 + rnd() * 344, y: 8 + rnd() * 168 });
    let web = '';
    for (const [i, a] of nodes.entries()) {
      const near = nodes.map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 })).filter((q) => q.j !== i).sort((p, q) => p.d - q.d).slice(0, 3);
      for (const q of near) {
        if (q.j < i) continue;
        const b = nodes[q.j];
        web += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#a5b4fc" stroke-width="${(0.6 + rnd() * 1.2).toFixed(2)}" opacity="${(0.18 + rnd() * 0.2).toFixed(2)}"/>`;
      }
      web += `<circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${(1.2 + rnd() * 2.2).toFixed(2)}" fill="#e0e7ff" opacity=".55"/>`;
    }
    let marks = '';
    for (const o of g.D.OFFICES) {
      const lvl = g.officeLevel(o.id);
      const cls = lvl > 0 ? 'm-on' : g.officeAvailable(o.id) ? 'm-avail' : 'm-lock';
      marks += `<g class="marker ${cls}" data-act="office-focus" data-id="${o.id}">
        ${lvl > 0 ? `<circle class="ping" cx="${o.x}" cy="${o.y}" r="${3 + lvl}"/>` : ''}
        <circle class="dot" cx="${o.x}" cy="${o.y}" r="${lvl > 0 ? 2.2 + lvl * 0.5 : 2}"/>
        <circle cx="${o.x}" cy="${o.y}" r="10" fill="transparent"/></g>`;
    }
    return `<svg viewBox="0 0 360 184" role="img" aria-label="${this.tl('off.title')}">
      <defs><radialGradient id="webG"><stop offset="0" stop-color="#6366f1" stop-opacity=".28"/><stop offset="1" stop-color="#0b0820" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="180" cy="92" rx="190" ry="100" fill="url(#webG)"/>${web}${marks}
    </svg><div class="map-hint">${this.tl('off.mapHint')}</div>`;
  }

  // Finał: całe drzewko Wszechświata odkryte (pokazujemy raz).
  checkFinale() {
    const u = this.co.layers.universe;
    const m = this.co.meta;
    if (!u || m.flags.finale || !u.allTechs()) return;
    m.flags.finale = true;
    play('prestige');
    this.openModal(`
      <div class="hero">🌅</div>
      <h2>${t('fin.title')}</h2>
      <p style="text-align:center">${t('fin.text')}</p>
      <p style="text-align:center">${t('fin.more')}</p>
      <div class="actions"><button class="btn gold btn-wide" data-act="modal-close">${t('fin.ok')}</button></div>`);
    this.hooks.save?.();
  }

  // ---------------------------------------------------------------------
  // Badania
  // ---------------------------------------------------------------------
  updateResearch() {
    const g = this.g;
    const s = g.s;
    const head = $('research-head');
    // Nagłówek budujemy raz (przyciski budżetu muszą przetrwać odświeżanie), a liczby podmieniamy.
    const rnd = !!s.deptUnlocked[g.D.RD_DEPT];
    const share = g.m.rdShare || 0;
    const headSig = `rh|${getLang()}|${rnd}|${share}`;
    if (this.sigs.researchHead !== headSig) {
      this.sigs.researchHead = headSig;
      head.innerHTML = `
      <div class="rp-card">
        <div><div class="card-sub">${t('rs.points')}</div><div class="rp-big" data-v="rpv"></div></div>
        <div style="text-align:right"><div class="rp-rate" data-v="rprate"></div><div class="card-sub" data-v="rpcount"></div></div>
      </div>
      ${!rnd ? `<div class="hint" style="margin-top:10px">${t('rs.needRnd')}</div>` : `
      <div class="budget-card">
        <div class="budget-head"><b>🧪 ${t('rs.budget')}</b>
          <div class="seg">${this.g.D.RD_BUDGET.shares.map((v) => `<button data-act="rd-budget" data-v="${v}" class="${v === share ? 'on' : ''}">${Math.round(v * 100)}%</button>`).join('')}</div>
        </div>
        <div class="card-sub" data-v="rdinfo" style="margin-top:6px"></div>
        <div class="card-sub" style="margin-top:4px;color:var(--faint)">${t('rs.budgetHint')}</div>
      </div>
      <div class="card-sub" style="margin:8px 2px 0">${t('rs.persist')}</div>`}`;
    }
    // na starcie budżet daje ułamki punktu — pokazujemy to uczciwie zamiast „+0”
    const budgetRp = g.rpBudget > 0 && g.rpBudget < 0.01 ? `<${fmt(0.01)}` : fmt(g.rpBudget);
    const pctRaw = g.rpRate > 0 ? (100 * g.rpBudget) / g.rpRate : 0;
    const budgetPct = pctRaw > 0 && pctRaw < 1 ? '<1' : String(Math.round(pctRaw));
    this.patch({
      rpv: `${fmt(s.rp)} ${t('unit.rp')}`,
      rprate: `+${fmt(g.rpRate)} ${t('unit.rp')}/s`,
      rpcount: t('rs.techCount', { n: g.techCount(), m: this.g.D.TECHS.length }),
      rdinfo: { html: share > 0 ? t('rs.budgetInfo', { rp: budgetRp, pct: budgetPct, v: money(g.income * share) }) : t('rs.budgetOff') },
    }, head);

    const done = this.g.D.TECHS.filter((t) => s.techs[t.id]).map((t) => t.id);
    const avail = this.g.D.TECHS.filter((t) => !s.techs[t.id] && g.techAvailable(t.id)).map((t) => t.id);
    const maxEra = Math.max(this.g.D.ERAS[0].id, ...this.g.D.TECHS.filter((t) => s.techs[t.id] || g.techAvailable(t.id)).map((t) => t.era));
    const repeats = this.g.D.REPEAT_TECHS.filter((r) => g.techAvailable(r.id));
    const sig = done.join(',') + '|' + avail.join(',') + '|' + repeats.map((r) => r.id + (s.techLevels[r.id] || 0)).join(',');
    const root = $('research-list');
    if (this.sigs.research !== sig) {
      this.sigs.research = sig;
      let html = '';
      for (const era of this.g.D.ERAS) {
        const techs = this.g.D.TECHS.filter((t) => t.era === era.id);
        const cnt = techs.filter((t) => s.techs[t.id]).length;
        if (era.id > maxEra + 1) {
          html += `<div class="era-head" style="opacity:.45"><span class="era-ico">🔒</span><h3>${esc(t('rs.lockedEra', { n: era.id, name: TX.eraName(era.id) }))}</h3><span class="era-count">${cnt}/${techs.length}</span></div>`;
          continue;
        }
        html += `<div class="era-head"><span class="era-ico">${era.icon}</span><h3>${esc(TX.eraName(era.id))}</h3><span class="era-count">${cnt}/${techs.length}</span></div><div class="tech-grid">`;
        for (const tech of techs) {
          const isDone = !!s.techs[tech.id];
          const isAvail = !isDone && g.techAvailable(tech.id);
          const cls = isDone ? 'done' : isAvail ? '' : 'locked';
          const req = !isDone && !isAvail ? `<div class="req">${esc(t('rs.requires', { list: tech.req.filter((r) => !s.techs[r]).map((r) => TX.techName(r)).join(', ') }))}</div>` : '';
          html += `<div class="tech ${cls}" data-tid="${tech.id}">
            ${isDone ? '<span class="check">✓</span>' : ''}
            <div class="tech-top"><div class="tech-ico">${tech.icon}</div><h4>${esc(TX.techName(tech.id))}</h4></div>
            <div class="fx">${esc(TX.describeFx(tech.fx))}${this.g.D.TECH_CAP_STEP[tech.id] ? ` · ${t('rs.reach', { x: reachX(this.g.D.TECH_CAP_STEP[tech.id]) })}` : ''}</div>
            ${req}
            ${isAvail ? `<button class="btn violet" data-act="research" data-id="${tech.id}"><span>${fmt(tech.cost)} ${t('unit.rp')}</span><small></small></button>` : ''}
          </div>`;
        }
        html += '</div>';
      }
      if (repeats.length) {
        html += `<div class="era-head"><span class="era-ico">♾️</span><h3>${t('rs.infinite')}</h3></div><div class="tech-grid">`;
        for (const r of repeats) {
          html += `<div class="tech" data-rid="${r.id}">
            <div class="tech-top"><div class="tech-ico">${r.icon}</div><h4>${esc(TX.repeatName(r.id))} <span class="perk-lvl">${t('rs.level', { n: s.techLevels[r.id] || 0 })}</span></h4></div>
            <div class="fx">${esc(TX.repeatDesc(r.id))}</div>
            <button class="btn violet" data-act="research-repeat" data-id="${r.id}"><span>${fmt(g.repeatCost(r.id))} ${t('unit.rp')}</span><small></small></button>
          </div>`;
        }
        html += '</div>';
      }
      root.innerHTML = html;
    }
    // czas do zakupu przy obecnym tempie badań
    const eta = (cost) => (s.rp >= cost || !(g.rpRate > 0) ? '' : t('rs.eta', { t: fmtTime((cost - s.rp) / g.rpRate) }));
    for (const el of root.querySelectorAll('[data-tid] .btn')) {
      const cost = this.g.D.TECH_MAP[el.dataset.id].cost;
      el.classList.toggle('off', s.rp < cost);
      this.setText(el.querySelector('small'), eta(cost));
    }
    for (const el of root.querySelectorAll('[data-rid] .btn')) {
      const cost = g.repeatCost(el.dataset.id);
      el.classList.toggle('off', s.rp < cost);
      this.setText(el.querySelector('small'), eta(cost));
    }
  }

  // ---------------------------------------------------------------------
  // Ulepszenia
  // ---------------------------------------------------------------------
  upgradeTile(u) {
    if (u.kind === 'product') return grad(this.g.D.CATEGORIES[u.cat].grad);
    if (u.kind === 'dept') return grad([this.g.D.DEPT_MAP[u.did].color, '#2b2f5c']);
    if (u.kind === 'click') return grad(['#22d3ee', '#3b5bdb']);
    return grad(['#f59e0b', '#db2777']);
  }

  updateUpgrades() {
    const g = this.g;
    const s = g.s;
    const avail = g.availableUpgrades();
    const ownedIds = Object.keys(s.upgrades);
    const blocked = g.upgradesBlocked();
    const sig = avail.map((u) => u.id).join(',') + '|' + ownedIds.length + '|' + blocked;
    const root = $('upgrades-list');
    if (this.sigs.upgrades !== sig) {
      this.sigs.upgrades = sig;
      let html = '';
      if (blocked) {
        html += `<div class="hint">${t('up.blocked')}</div>`;
      } else if (!avail.length) {
        html += `<div class="hint">${t('up.none')}</div>`;
      } else {
        html += '<div class="up-grid">' + avail.map((u) => `
          <div class="up" data-uid="${u.id}">
            <div class="tile" style="${this.upgradeTile(u)}">${u.icon}</div>
            <div><h4>${esc(TX.upgradeName(u))}</h4><p>${esc(TX.upgradeDesc(u))}</p></div>
            <button class="btn" data-act="buy-upgrade" data-id="${u.id}">${money(u.cost)}</button>
          </div>`).join('') + '</div>';
      }
      if (ownedIds.length) {
        html += `<div class="section-title">${t('up.owned', { n: ownedIds.length })}</div><div class="owned-list">`
          + ownedIds.map((id) => this.g.D.UPGRADE_MAP[id]).filter(Boolean).map((u) => `<span title="${esc(TX.upgradeName(u))}">${u.icon}</span>`).join('') + '</div>';
      }
      root.innerHTML = html;
    }
    let can = 0;
    for (const el of root.querySelectorAll('[data-uid]')) {
      const u = this.g.D.UPGRADE_MAP[el.dataset.uid];
      const ok = s.cash >= u.cost;
      if (ok) can++;
      el.classList.toggle('can', ok);
      el.querySelector('.btn').classList.toggle('off', !ok);
    }
    const all = $('buy-all-btn');
    all.classList.toggle('off', can === 0);
    this.setText(all, can > 0 ? t('buyAllN', { n: can }) : t('buyAll'));
  }

  // ---------------------------------------------------------------------
  // Firma
  // ---------------------------------------------------------------------
  updateCompany() {
    switch (this.companySub) {
      case 'investors': return this.renderInvestors();
      case 'challenges': return this.renderChallenges();
      case 'market': return this.renderMarket();
      case 'contracts': return this.renderContracts();
      case 'acq': return this.renderAcq();
      case 'ach': return this.renderAch();
      case 'stats': return this.renderStats();
      case 'settings': return this.renderSettings();
      default: return null;
    }
  }

  setBody(sig, html) {
    if (this.sigs.company === sig) return false;
    this.sigs.company = sig;
    $('company-body').innerHTML = html;
    return true;
  }

  // Podmienia teksty/HTML elementów oznaczonych data-v (bez przebudowy DOM).
  patch(values, root = $('company-body')) {
    for (const el of root.querySelectorAll('[data-v]')) {
      const v = values[el.dataset.v];
      if (v === undefined) continue;
      if (typeof v === 'object') {
        if (v.off !== undefined) el.classList.toggle('off', v.off);
        if (v.width !== undefined) el.style.width = v.width;
        if (v.html !== undefined && el.innerHTML !== v.html) el.innerHTML = v.html;
        if (v.text !== undefined) this.setText(el, v.text);
        if (v.hidden !== undefined) el.hidden = v.hidden;
      } else this.setText(el, String(v));
    }
  }

  renderInvestors() {
    const g = this.g;
    const s = g.s;
    const gain = g.prestigeGain();
    const per = g.D.PRESTIGE.bonus + g.m.investorPct;
    const sig = `inv|${g.D.id}|${JSON.stringify(s.meta.perks)}|${JSON.stringify(s.meta.autopilot)}|${s.prestigeCount}|${getLang()}`;
    this.setBody(sig, `
      <div class="inv-card">
        <div class="round" data-v="round"></div>
        <div class="big" data-v="gain"></div>
        <div class="sub" data-v="invsub"></div>
      </div>
      <div class="kv">
        <span>${t('inv.valuation')}</span><b data-v="val"></b>
        <span class="kv-sub">${t('inv.assets')}</span><b class="kv-sub" data-v="assets"></b>
        <span class="kv-sub">${t('inv.annual')}</span><b class="kv-sub" data-v="annual"></b>
        <span class="kv-sub">${t('inv.multiple')}</span><b class="kv-sub" data-v="mult"></b>
      </div>
      <p class="card-sub" style="margin:8px 2px 0">${t('inv.valNote')}</p>
      <div class="kv">
        <span>${this.tl('inv.run')}</span><b data-v="run"></b>
        <span>${t('inv.total')}</span><b data-v="total"></b>
        <span>${this.tl('inv.next')}</span><b data-v="next"></b>
        <span data-v="boardl">${t('inv.board')}</span><b data-v="board"></b>
      </div>
      <div style="margin-top:12px">
        <button class="btn gold btn-wide" data-act="prestige" data-v="pbtn">${this.tl('inv.raise')}</button>
      </div>
      <p class="card-sub" style="margin:10px 2px">${this.tl('inv.explain')}</p>
      <div class="section-title">🤖 ${t('ap.title')} <span style="color:var(--gold)" data-v="shares2"></span></div>
      ${!g.apUnlocked() ? `<div class="hint">${t('ap.locked')}</div>` : `
      <p class="card-sub" style="margin:0 2px 8px">${t('ap.lead')}</p>
      <div class="list">${AUTOPILOT.map((a) => {
    const own = g.apOwned(a.id);
    const on = g.apOn(a.id);
    return `<div class="card">
          <div class="tile" style="${grad(['#22d3ee', '#3b5bdb'])}">${a.icon}</div>
          <div class="card-title"><h3>${esc(TX.apName(a.id))}</h3>${own ? `<span class="lvl" style="color:var(--money)">${t('ap.owned')}</span>` : ''}</div>
          <div class="card-sub">${esc(TX.apDesc(a.id))}</div>
          <div class="card-foot"><div class="prog"></div>
            ${own ? `<div class="switch-row">${on ? t('ap.on') : t('ap.off')}<button class="switch ${on ? 'on' : ''}" data-act="toggle-ap" data-id="${a.id}" aria-label="${esc(TX.apName(a.id))}"></button></div>`
    : `<button class="btn gold" data-act="buy-ap" data-id="${a.id}" data-v="ap-${a.id}">${fmt(a.cost)} 💎</button>`}
          </div></div>`;
  }).join('')}</div>`}
      <div class="section-title">${t('inv.boardTitle')} <span style="color:var(--gold)" data-v="shares"></span></div>
      <div class="list">
        ${PERKS.map((p) => {
    const lvl = s.meta.perks[p.id] || 0;
    const maxed = lvl >= p.max;
    return `<div class="card">
            <div class="tile" style="${grad(['#f59e0b', '#7c3aed'])}">${p.icon}</div>
            <div class="card-title"><h3>${esc(TX.perkName(p.id))}</h3><span class="perk-lvl">${lvl}/${p.max}</span></div>
            <div class="card-sub">${esc(TX.perkDesc(p.id))}</div>
            <div class="card-foot"><div class="prog"><div class="prog-bar"><i style="width:${(lvl / p.max) * 100}%"></i></div></div>
              ${maxed ? `<button class="btn off">${t('inv.max')}</button>` : `<button class="btn gold" data-act="buy-perk" data-id="${p.id}" data-v="perk-${p.id}">${fmt(g.perkCost(p.id))} 💎</button>`}
            </div></div>`;
  }).join('')}
      </div>`);
    const vp = g.valuationParts();
    const vals = {
      round: this.tl('inv.nextRound', { r: this.roundLabel(s.prestigeCount) }),
      gain: `+${fmt(gain)} ${this.lu.cur}`,
      invsub: { html: `${this.tl('inv.now', { n: fmt(s.investors), x: fmt(g.m.invMult) })}<br>${this.tl('inv.perPoint', { p: num(per * 100) })}` },
      val: money(vp.total),
      assets: money(vp.assets),
      annual: money(vp.annual),
      mult: `×${num(vp.multiple)}`,
      run: money(s.runEarned),
      total: money(s.totalEarned),
      next: money(g.nextPrestigeAt()),
      board: { text: `×${fmt(g.m.prestige)}`, hidden: !(g.m.prestige > 1) },
      boardl: { hidden: !(g.m.prestige > 1) },
      pbtn: { off: gain < 1 },
      shares: t('inv.shares', { n: fmt(s.meta.shares) }),
      shares2: g.apUnlocked() ? t('inv.shares', { n: fmt(s.meta.shares) }) : '',
    };
    for (const p of PERKS) vals[`perk-${p.id}`] = { off: s.meta.shares < g.perkCost(p.id) };
    for (const a of AUTOPILOT) vals[`ap-${a.id}`] = { off: s.meta.shares < a.cost };
    this.patch(vals);
  }

  renderChallenges() {
    const g = this.g;
    const s = g.s;
    if (!g.challengesUnlocked()) {
      this.setBody(`chal-locked|${getLang()}`, `<div class="hint">${t('chal.locked')}</div>`);
      return;
    }
    const active = s.challenge;
    const sig = `chal|${JSON.stringify(s.meta.challenges)}|${active ? active.id + active.tier : ''}|${getLang()}`;
    let html = `<p class="card-sub" style="margin:0 2px 10px">${t('chal.lead')}</p>`;
    if (active) {
      const ch = CHALLENGE_MAP[active.id];
      html += `<div class="chal-active">
        <div class="lbl" style="font-size:12px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px">${t('chal.activeTitle')}</div>
        <h3>${ch.icon} ${esc(TX.challengeName(ch.id))} · ${t('chal.tier', { n: active.tier + 1, m: CHALLENGE_GOALS.length })}</h3>
        <div class="chal-meta">${esc(TX.challengeDesc(ch.id))}</div>
        <div class="prog" style="margin-top:10px"><div class="prog-bar"><i data-v="cbar"></i></div><div class="prog-label" data-v="cprog"></div></div>
        <button class="btn ghost btn-small" style="margin-top:10px" data-act="chal-abandon">${t('chal.abandon')}</button>
      </div>`;
    }
    html += '<div class="list">' + CHALLENGES.map((ch) => {
      const tier = s.meta.challenges[ch.id] || 0;
      const done = tier >= CHALLENGE_GOALS.length;
      const dots = CHALLENGE_GOALS.map((_, i) => `<i class="${i < tier ? 'on' : ''}"></i>`).join('');
      const have = tier > 0 ? `<div class="chal-meta">${t('chal.have', { fx: `<b>${esc(TX.describeFx(scaledFx(ch.fx, tier)))}</b>` })}</div>` : '';
      return `<div class="card">
        <div class="tile" style="${grad(['#0ea5e9', '#7c3aed'])}">${ch.icon}</div>
        <div class="card-title"><h3>${esc(TX.challengeName(ch.id))}</h3><span class="tier-dots">${dots}</span></div>
        <div class="card-sub">${esc(TX.challengeDesc(ch.id))}</div>
        <div class="card-desc">${done ? t('chal.allDone') : `${t('chal.goal', { v: money(g.challengeGoal(ch.id)) })}<br>${t('chal.reward', { fx: esc(TX.describeFx(ch.fx)) })}`}${have}</div>
        <div class="card-foot"><div class="prog"></div>${done ? '' : `<button class="btn violet ${active ? 'off' : ''}" data-act="chal-start" data-id="${ch.id}">${t('chal.start')}</button>`}</div>
      </div>`;
    }).join('') + '</div>';
    this.setBody(sig, html);
    if (active) {
      const goal = active.goal || CHALLENGE_GOALS[active.tier];
      const p = Math.min(1, Math.log10(1 + s.runEarned) / Math.log10(goal));
      this.patch({ cbar: { width: `${p * 100}%` }, cprog: `${money(s.runEarned)} / ${money(goal)}` });
    }
  }

  renderMarket() {
    const g = this.g;
    const s = g.s;
    if (!g.marketUnlocked()) {
      this.setBody(`mk-locked|${getLang()}`, `<div class="hint">${t('mk.locked')}</div>`);
      return;
    }
    const stakes = s.market.stakes;
    const sig = `mk|${getLang()}|${this.mkStep}|${Object.keys(stakes).join(',')}|${s.meta.companyName}`;
    const steps = [[0.01, '1%'], [0.1, '10%']];
    this.setBody(sig, `
      <div class="stock-card">
        <div class="stock-head">
          <div><div class="lbl">${t('mk.yours')}</div><h3>${esc(s.meta.companyName)} <span class="ticker">${esc(TX.ownTicker(s.meta.companyName))}</span></h3></div>
          <div class="stock-price"><b data-v="mprice"></b><small>${t('mk.price')}</small></div>
        </div>
        <div class="spark big" data-v="mspark"></div>
        <div class="kv" style="background:none;border:0;padding:6px 0 0;margin:0">
          <span>${t('mk.cap')}</span><b data-v="mcap"></b>
          <span>${t('mk.rank')}</span><b data-v="mrank"></b>
          <span>${t('mk.portfolio')}</span><b data-v="mport"></b>
        </div>
      </div>
      <p class="card-sub" style="margin:10px 2px">${t('mk.lead')}</p>
      <div class="view-head" style="margin:14px 0 8px">
        <div class="section-title" style="margin:0">${t('mk.companies')}</div>
        <div class="seg">${steps.map(([v, l]) => `<button data-act="mk-step" data-v="${v}" class="${v === this.mkStep ? 'on' : ''}">${l}</button>`).join('')}</div>
      </div>
      <div class="list">${COMPETITORS.map((c) => `
        <div class="card comp">
          <div class="tile" style="${grad(CATEGORIES[c.cat].grad)}">${c.icon}</div>
          <div class="card-title"><h3>${esc(TX.compName(c.id))} <span class="ticker">${esc(TX.compTicker(c.id))}</span></h3><span class="lvl" data-v="chg-${c.id}"></span></div>
          <div class="card-sub"><b data-v="cap-${c.id}"></b> · ${esc(TX.catName(c.cat))}</div>
          <div class="spark" data-v="spark-${c.id}"></div>
          <div class="card-desc" data-v="st-${c.id}"></div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-v="sb-${c.id}"></i></div><div class="prog-label" data-v="sbl-${c.id}"></div></div>
            <button class="btn btn-small ghost" data-act="sell-stake" data-id="${c.id}" data-v="sell-${c.id}">−${Math.round(this.mkStep * 100)}%</button>
            <button class="btn btn-small" data-act="buy-stake" data-id="${c.id}" data-v="buy-${c.id}"><span>+${Math.round(this.mkStep * 100)}%</span><small data-v="bc-${c.id}"></small></button>
          </div>
        </div>`).join('')}</div>
      <p class="card-sub" style="margin:10px 2px">${t('mk.fee', { p: Math.round(MARKET.fee * 100) })}</p>`);
    const own = s.history.short.slice(-48).map((r) => r[2]);
    const val = g.valuation();
    const vals = {
      mprice: g.sharePrice() < 1000 ? `$${num(g.sharePrice())}` : money(g.sharePrice()),
      mspark: { html: spark([...own, val], 300, 46, '#a78bfa') },
      mcap: money(val),
      mrank: t('mk.rankV', { n: g.marketRank(), m: COMPETITORS.length + 1 }),
      mport: money(g.portfolioValue()),
    };
    for (const c of COMPETITORS) {
      const st = g.comp(c.id);
      const h = st.hist;
      const prev = h.length > 1 ? h[h.length - 2] : st.sent;
      const chg = (st.sent / prev - 1) * 100;
      const p = g.stake(c.id);
      const cap = g.compCap(c.id);
      const bonusX = p > 0 ? (1 + MARKET.stakeBonus * Math.min(p, MARKET.stakeCap)) * (p >= MARKET.control ? MARKET.controlCat : 1) : 0;
      vals[`chg-${c.id}`] = { html: `<span style="color:${chg >= 0 ? 'var(--money)' : 'var(--danger)'}">${chg >= 0 ? '▲' : '▼'} ${num(Math.abs(chg))}%</span>` };
      vals[`cap-${c.id}`] = money(cap);
      vals[`spark-${c.id}`] = { html: spark(h, 300, 30, chg >= 0 ? '#4ade80' : '#fb7185') };
      vals[`st-${c.id}`] = { html: p > 0
        ? `${t('mk.stake', { p: `${num(p * 100)}%`, v: money(p * cap) })}<br>${p >= MARKET.control ? `<b style="color:var(--gold)">${t('mk.control')}</b> · ` : ''}${t('mk.bonus', { fx: esc(TX.describeFx([{ t: 'cat', cat: c.cat, x: bonusX }])) })}`
        : t('mk.noStake') };
      vals[`sb-${c.id}`] = { width: `${Math.min(1, p / MARKET.control) * 100}%` };
      vals[`sbl-${c.id}`] = t('mk.toControl', { p: `${num(p * 100)}%` });
      const step = Math.min(this.mkStep, 1 - p);
      vals[`buy-${c.id}`] = { off: !(step > 1e-9) || g.stakeCost(c.id, step) > s.cash };
      vals[`bc-${c.id}`] = step > 1e-9 ? money(g.stakeCost(c.id, step)) : '—';
      vals[`sell-${c.id}`] = { off: !(p > 0) };
    }
    this.patch(vals);
  }

  confirmChallenge(id) {
    const g = this.g;
    const s = g.s;
    if (s.challenge) { this.toast('🏅', t('chal.otherActive'), '', 'info'); return; }
    const ch = CHALLENGE_MAP[id];
    const tier = s.meta.challenges[id] || 0;
    if (tier >= CHALLENGE_GOALS.length) return;
    const gain = g.prestigeGain();
    this.openModal(`
      <div class="hero">${ch.icon}</div>
      <h2>${esc(t('chal.confirmTitle', { name: TX.challengeName(id) }))}</h2>
      <p style="text-align:center">${t('chal.confirmRule', { rule: esc(TX.challengeDesc(id)) })}</p>
      <ul>
        <li>${t('chal.goal', { v: money(g.challengeGoal(id)) })} (${t('chal.tier', { n: tier + 1, m: CHALLENGE_GOALS.length })})</li>
        <li>${t('chal.reward', { fx: `<b>${esc(TX.describeFx(ch.fx))}</b>` })}</li>
        <li>${gain >= 1 ? t('chal.confirmGain', { n: fmt(gain) }) : t('chal.confirmNoGain')}</li>
      </ul>
      <div class="actions">
        <button class="btn violet btn-wide" data-act="chal-confirm" data-id="${id}">${t('chal.confirm')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('cancel')}</button>
      </div>`);
  }

  renderContracts() {
    const g = this.g;
    const s = g.s;
    const now = Date.now();
    if (!g.contractsUnlocked()) {
      this.setBody(`con-locked|${getLang()}`, `<div class="hint">${t('con.locked')}</div>`);
      return;
    }
    const c = s.contracts;
    const full = c.active.length >= g.m.slots;
    const rp = t('unit.rp');
    const sig = `con|${c.offers.map((o) => o.id).join(',')}|${c.active.map((a) => a.id).join(',')}|${full}|${getLang()}`;
    let html = `<div class="kv"><span>${t('con.slots')}</span><b data-v="slots"></b><span>${t('con.mult')}</span><b data-v="cmult"></b></div>`;
    html += `<div class="section-title">${t('con.active')}</div>`;
    if (!c.active.length) html += `<div class="hint">${t('con.noActive')}</div>`;
    else {
      html += '<div class="list">' + c.active.map((a) => `<div class="contract"><div class="ico">${a.icon}</div><h4>${esc(TX.clientName(a))}</h4><p>${esc(TX.taskName(a))} · <span class="reward">+${money(a.reward)}</span>${a.rpReward ? ` · <span style="color:var(--rp)">+${fmt(a.rpReward)} ${rp}</span>` : ''}</p>
          <div class="row"><div class="prog"><div class="prog-bar"><i data-v="abar-${a.id}"></i></div><div class="prog-label" data-v="aleft-${a.id}"></div></div></div></div>`).join('') + '</div>';
    }
    html += `<div class="section-title">${t('con.offers')}</div>`;
    if (!c.offers.length) html += '<div class="hint" data-v="nextoffer"></div>';
    else {
      html += '<div class="list">' + c.offers.map((o) => `<div class="contract"><div class="ico">${o.icon}</div><h4>${esc(TX.clientName(o))}</h4><p>${esc(t('con.order', { task: TX.taskName(o), t: fmtTime(o.dur) }))}</p>
          <div class="row"><div style="flex:1;font-size:13px">${t('con.reward')} <span data-v="orew-${o.id}"></span><div class="prog-label" data-v="oexp-${o.id}"></div></div>
          <button class="btn btn-small ghost" data-act="decline-contract" data-id="${o.id}" aria-label="${t('con.decline')}">✕</button>
          <button class="btn btn-small ${full ? 'off' : ''}" data-act="accept-contract" data-id="${o.id}">${t('con.accept')}</button></div></div>`).join('') + '</div>';
      if (full) html += `<p class="card-sub" style="margin:8px 2px">${t('con.full')}</p>`;
    }
    this.setBody(sig, html);
    const vals = {
      slots: `${c.active.length}/${g.m.slots}`,
      cmult: `×${fmt(g.m.contract)}`,
      nextoffer: t('con.waiting', { t: fmtClock(Math.max(0, (c.nextOfferAt - now) / 1000)) }),
    };
    for (const a of c.active) {
      vals[`abar-${a.id}`] = { width: `${Math.min(1, (now - a.start) / (a.end - a.start)) * 100}%` };
      vals[`aleft-${a.id}`] = t('con.left', { t: fmtClock((a.end - now) / 1000) });
    }
    for (const o of c.offers) {
      const r = g.contractReward(o);
      vals[`orew-${o.id}`] = { html: `<span class="reward">+${money(r.cash)}</span>${r.rp ? ` <span style="color:var(--rp);font-weight:800">+${fmt(r.rp)} ${rp}</span>` : ''}` };
      vals[`oexp-${o.id}`] = t('con.expires', { t: fmtClock((o.expires - now) / 1000) });
    }
    this.patch(vals);
  }

  renderAcq() {
    const g = this.g;
    const s = g.s;
    if (!g.acqUnlocked()) {
      this.setBody(`acq-locked|${getLang()}`, `<div class="hint">${t('acq.locked')}</div>`);
      return;
    }
    this.setBody(`acq|${Object.keys(s.acquisitions).join(',')}|${getLang()}`, '<div class="list">' + this.g.D.ACQUISITIONS.map((a) => {
      const own = !!s.acquisitions[a.id];
      return `<div class="card">
        <div class="tile" style="${grad(['#0ea5e9', '#6d28d9'])}">${a.icon}</div>
        <div class="card-title"><h3>${esc(TX.acqName(a.id))}</h3>${own ? `<span class="lvl" style="color:var(--money)">${t('acq.yours')}</span>` : ''}</div>
        <div class="card-sub">${esc(TX.describeFx(a.fx))}</div>
        <div class="card-desc">${esc(TX.acqDesc(a.id))}</div>
        <div class="card-foot"><div class="prog"></div>${own ? '' : `<button class="btn violet" data-act="buy-acq" data-id="${a.id}" data-v="acq-${a.id}"><span>${t('acq.buy')}</span><small>${money(g.acqCost(a.id))}</small></button>`}</div>
      </div>`;
    }).join('') + '</div>');
    const vals = {};
    for (const a of this.g.D.ACQUISITIONS) vals[`acq-${a.id}`] = { off: s.cash < g.acqCost(a.id) };
    this.patch(vals);
  }

  renderAch() {
    const g = this.g;
    const s = g.s;
    const count = g.achCount();
    const all = this.co.achievements();
    const html = `<div class="kv"><span>${t('ach.count')}</span><b>${count}/${all.length}</b><span>${t('ach.bonus')}</span><b>+${Math.round(count * ACH_BONUS * 100)}%</b></div>
      <p class="card-sub" style="margin:10px 2px">${t('ach.tap')}</p>
      <div class="ach-grid">${all.map((a) => {
    const got = !!s.meta.achievements[a.id];
    return `<button class="ach ${got ? 'got' : 'locked'}" data-act="ach-info" data-id="${a.id}">${got || !a.hidden ? a.icon : '❓'}</button>`;
  }).join('')}</div>`;
    this.setBody(`ach|${count}|${getLang()}`, html);
  }

  renderStats() {
    const g = this.g;
    const s = g.s;
    const st = s.stats;
    const h = s.history;
    const rows = this.chartRange === 'day' ? h.short : h.long;
    const rev = g.annualRevenue();
    const cur = g.scaleIdx();
    const last = rows.length ? rows[rows.length - 1][0] : 0;
    const sig = `stats|${getLang()}|${this.chartSeries}|${this.chartRange}|${rows.length}|${last}|${s.meta.scaleMax}|${cur}`;
    const keys = ['income', 'maxIncome', 'click', 'auto', 'total', 'run', 'bestRun', 'bestValuation', 'clicks', 'staff', 'hired',
      'upgrades', 'techs', 'bubbles', 'contracts', 'decisions', 'challenges', 'autoBuys', 'rounds', 'offlineCap', 'offlineEff', 'playTime', 'founded'];
    const seg = (act, cur2, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-act="${act}" data-v="${v}" class="${v === cur2 ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const html = `
      <div class="scale-card">
        <div class="scale-k"><span class="lbl">${t('sc.title')}</span><span class="big" data-v="sck"></span></div>
        <div class="scale-row">${t('sc.k')} · ${t('sc.human')}</div>
        <div class="prog" style="margin-top:8px"><div class="prog-bar"><i data-v="scbar"></i></div></div>
        <div class="scale-row">${t('sc.revenue')}: <b data-v="screv"></b></div>
        <div class="scale-row" data-v="scnext"></div>
        <div class="scale-row" data-v="sctop"></div>
        <div class="scale-row" data-v="screach"></div>
        <div class="scale-grid">${SCALE_LEVELS.map((L, i) => `<button class="scale-dot ${i <= s.meta.scaleMax ? '' : 'off'} ${i === cur ? 'cur' : ''}" data-act="scale-info" data-id="${i}" aria-label="${esc(TX.scaleName(i))}">${L.icon}</button>`).join('')}</div>
        <p class="chart-note">${t('sc.explain')}</p>
      </div>
      <div class="chart-card">
        <div class="chart-head"><b>${t('ch.title')}</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${seg('chart-series', this.chartSeries, [['income', t('ch.income')], ['valuation', t('ch.valuation')]])}
            ${seg('chart-range', this.chartRange, [['day', t('ch.day')], ['month', t('ch.month')]])}
          </div>
        </div>
        <div class="chart">${this.chartSvg(rows, h.rounds)}</div>
        ${h.rounds.length ? `<div class="chart-note"><span style="color:var(--gold)">┆</span> ${t('ch.rounds')}</div>` : ''}
      </div>
      <div class="kv">${keys.map((k) => `<span>${t(`st.${k}`)}</span><b data-v="st-${k}"></b>`).join('')}</div>`;
    this.setBody(sig, html);
    const k = g.kardashevShown();
    const prevT = cur >= 0 ? SCALE_THRESHOLDS[cur] : 1;
    const nextT = SCALE_THRESHOLDS[cur + 1];
    const p = nextT ? Math.max(0, Math.min(1, (Math.log10(Math.max(rev, 1)) - Math.log10(prevT)) / (Math.log10(nextT) - Math.log10(prevT)))) : 1;
    const top = s.meta.scaleMax;
    const vals = {
      sck: k === null ? '—' : minus(decimal(k.toFixed(2))),
      scbar: { width: `${p * 100}%` },
      screv: `${money(rev)}/${t('time.y')}`,
      scnext: { html: !nextT ? '' : SCALE_LEVELS[cur + 1].tech && !g.hasTech(SCALE_LEVELS[cur + 1].tech)
        ? t('sc.nextTech', { icon: SCALE_LEVELS[cur + 1].icon, name: `<b>${esc(TX.scaleName(cur + 1))}</b>`, v: money(nextT), tech: esc(TX.techName(SCALE_LEVELS[cur + 1].tech)) })
        : t('sc.next', { icon: SCALE_LEVELS[cur + 1].icon, name: `<b>${esc(TX.scaleName(cur + 1))}</b>`, v: money(nextT) }) },
      screach: { html: !g.capOn() ? t('reach.off') : `${t('reach.row', { stage: t(`reach.${g.marketStage()}`), v: money(g.marketCap) })}${g.rawIncome > g.marketCap ? ` · ${t('reach.satShort')}` : ''}` },
      sctop: { html: top >= 0 ? t('sc.top', { icon: SCALE_LEVELS[top].icon, name: `<b>${esc(TX.scaleName(top))}</b>` }) : t('sc.none') },
      'st-income': `${money(g.income)}/s`,
      'st-maxIncome': `${money(st.maxIncome)}/s`,
      'st-click': money(g.clickValue),
      'st-auto': `${fmt(g.m.auto)}/s`,
      'st-total': money(s.totalEarned),
      'st-run': money(s.runEarned),
      'st-bestRun': money(Math.max(st.bestRun, s.runEarned)),
      'st-bestValuation': money(st.bestValuation),
      'st-clicks': fmtInt(st.clicks),
      'st-staff': fmtInt(g.totalHeads()),
      'st-hired': fmtInt(st.hired),
      'st-upgrades': fmtInt(st.upgradesBought),
      'st-techs': `${g.techCount()}/${this.g.D.TECHS.length}`,
      'st-bubbles': fmtInt(st.bubbles),
      'st-contracts': fmtInt(st.contracts),
      'st-decisions': fmtInt(st.decisions),
      'st-challenges': `${g.challengeTiers()}/${CHALLENGES.length * CHALLENGE_GOALS.length}`,
      'st-autoBuys': fmtInt(st.autoBuys),
      'st-rounds': String(s.prestigeCount),
      'st-offlineCap': fmtTime(g.m.offlineCap),
      'st-offlineEff': `${Math.round(g.m.offlineEff * 100)}%`,
      'st-playTime': fmtTime(st.playTime),
      'st-founded': new Date(st.startedAt).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'pl-PL'),
    };
    this.patch(vals);
  }

  // Wykres w skali logarytmicznej: przychód albo wycena, z liniami rund finansowania.
  chartSvg(rows, rounds) {
    const idx = this.chartSeries === 'income' ? 1 : 2;
    const pts = rows.filter((r) => r[idx] > 0);
    if (pts.length < 2) return `<div class="hint" style="margin-top:8px">${t('ch.empty')}</div>`;
    const W = 320; const H = 150; const L = 2; const R = 2; const T = 16; const B = 16;
    const t0 = pts[0][0];
    const t1 = pts[pts.length - 1][0];
    const ys = pts.map((r) => Math.log10(r[idx]));
    let y0 = Math.min(...ys);
    let y1 = Math.max(...ys);
    if (y1 - y0 < 1) { y0 -= 0.5; y1 += 0.5; }
    const X = (tm) => L + ((tm - t0) / Math.max(1, t1 - t0)) * (W - L - R);
    const Y = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
    const line = pts.map((r, i) => `${i ? 'L' : 'M'}${X(r[0]).toFixed(1)} ${Y(Math.log10(r[idx])).toFixed(1)}`).join(' ');
    const area = `${line} L${X(t1).toFixed(1)} ${H - B} L${X(t0).toFixed(1)} ${H - B} Z`;
    const marks = rounds.filter((tm) => tm >= t0 && tm <= t1)
      .map((tm) => `<line x1="${X(tm).toFixed(1)}" y1="${T}" x2="${X(tm).toFixed(1)}" y2="${H - B}" stroke="#fbbf24" stroke-dasharray="2 3" opacity=".7"/>`).join('');
    const color = idx === 1 ? '#4ade80' : '#a78bfa';
    const loc = getLang() === 'en' ? 'en-US' : 'pl-PL';
    const fmtT = (tm) => (this.chartRange === 'day'
      ? new Date(tm).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
      : new Date(tm).toLocaleDateString(loc, { day: 'numeric', month: 'short' }));
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('ch.title')}">
      <defs><linearGradient id="chG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <line x1="${L}" y1="${T}" x2="${W - R}" y2="${T}" stroke="rgba(255,255,255,.07)"/><line x1="${L}" y1="${(T + H - B) / 2}" x2="${W - R}" y2="${(T + H - B) / 2}" stroke="rgba(255,255,255,.07)"/><line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="rgba(255,255,255,.12)"/>
      <path d="${area}" fill="url(#chG)"/>${marks}
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${X(t1).toFixed(1)}" cy="${Y(ys[ys.length - 1]).toFixed(1)}" r="3" fill="${color}"/>
      <text class="axis" x="${L + 2}" y="${T - 5}">${money(Math.pow(10, y1))}</text>
      <text class="axis" x="${L + 2}" y="${H - B - 4}">${money(Math.pow(10, y0))}</text>
      <text class="axis" x="${L}" y="${H - 3}">${fmtT(t0)}</text>
      <text class="axis" x="${W - R}" y="${H - 3}" text-anchor="end">${fmtT(t1)}</text>
    </svg>`;
  }

  langSeg(act) {
    const cur = getLang();
    return `<div class="seg">${LANGS.map(([code, label]) => `<button data-act="${act}" data-v="${code}" class="${code === cur ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  }

  renderSettings() {
    const s = this.g.s;
    const html = `
      <div class="section-title">${t('set.company')}</div>
      <div class="setting" style="flex-direction:column;align-items:stretch">
        <div>${t('set.name')}<p>${t('set.nameHint')}</p></div>
        <div style="display:flex;gap:8px"><input class="text-input" id="rename-input" maxlength="28" value="${esc(s.meta.companyName)}" enterkeyhint="done"><button class="btn btn-small violet" data-act="rename">${t('set.save')}</button></div>
      </div>
      <div class="section-title">${t('set.game')}</div>
      <div class="setting"><div>${t('set.lang')}<p>${t('set.langHint')}</p></div>${this.langSeg('set-lang')}</div>
      <div class="setting"><div>${t('set.sound')}<p>${t('set.soundHint')}</p></div><button class="switch ${s.meta.settings.sound ? 'on' : ''}" data-act="toggle-sound" aria-label="${t('set.sound')}"></button></div>
      <div class="setting"><div>${t('set.music')}<p>${t('set.musicHint')}</p></div><button class="switch ${s.meta.settings.music ? 'on' : ''}" data-act="toggle-music" aria-label="${t('set.music')}"></button></div>
      <div class="setting"><div>${t('set.cap')}<p>${t('set.capHint')}</p></div><button class="switch ${this.g.capOn() ? 'on' : ''}" data-act="toggle-cap" aria-label="${t('set.cap')}"></button></div>
      <div class="setting"><div>${t('set.install')}<p>${t('set.installHint')}</p></div><button class="btn btn-small ghost" data-act="install-help">${t('set.show')}</button></div>
      <div class="section-title">${t('set.saveTitle')}</div>
      <div class="setting"><div>${t('set.export')}<p>${t('set.exportHint')}</p></div><button class="btn btn-small ghost" data-act="export">${t('set.exportBtn')}</button></div>
      <div class="setting"><div>${t('set.import')}<p>${t('set.importHint')}</p></div><button class="btn btn-small ghost" data-act="import">${t('set.importBtn')}</button></div>
      <div class="setting"><div>${t('set.reset')}<p>${t('set.resetHint')}</p></div><button class="btn btn-small danger" data-act="reset">${t('set.resetBtn')}</button></div>
      <p class="card-sub" style="text-align:center;margin-top:18px">${esc(t('appName'))} · ${t('set.footer', { v: esc(this.hooks.version || '1.0') })}</p>`;
    this.setBody(`settings|${s.meta.settings.sound}|${s.meta.settings.music}|${this.g.capOn()}|${getLang()}`, html);
  }

  rename() {
    const v = ($('rename-input')?.value || '').trim();
    if (!v) return;
    const s = this.g.s;
    if (v !== s.meta.companyName) {
      s.meta.companyName = v.slice(0, 28);
      s.meta.flags.renamed = true;
      this.scene.render(this.g, true);
      this.toast('🪪', t('toast.renamed'), s.meta.companyName, 'info');
      this.hooks.save?.();
    }
    document.activeElement?.blur();
  }

  // ---------------------------------------------------------------------
  // Plakietki na zakładkach
  // ---------------------------------------------------------------------
  updateBadges() {
    const g = this.g;
    const s = g.s;
    const counts = {};
    counts.products = this.g.D.PRODUCTS.filter((p) => g.productUnlocked(p.id) && g.productCost(p.id, 1) <= s.cash).length;
    counts.team = this.g.D.DEPTS.filter((d) => (s.deptUnlocked[d.id] && g.hireCost(d.id, 1) <= s.cash)
      || (!s.deptUnlocked[d.id] && g.deptAvailable(d.id) && s.cash >= d.unlock)).length;
    const officesReady = this.g.D.OFFICES.filter((o) => g.officeAvailable(o.id) && g.officeCost(o.id) <= s.cash).length;
    counts.team += officesReady;
    counts.research = this.g.D.TECHS.filter((t) => !s.techs[t.id] && g.techAvailable(t.id) && s.rp >= t.cost).length;
    counts.upgrades = g.availableUpgrades().filter((u) => u.cost <= s.cash).length;
    const offers = g.contractsUnlocked() && s.contracts.active.length < g.m.slots ? s.contracts.offers.length : 0;
    const gain = g.prestigeGain();
    const prestigeReady = gain >= 1 && gain >= Math.max(1, s.investors * 0.5);
    const perkReady = PERKS.some((p) => (s.meta.perks[p.id] || 0) < p.max && s.meta.shares >= g.perkCost(p.id))
      || (g.apUnlocked() && AUTOPILOT.some((a) => !g.apOwned(a.id) && s.meta.shares >= a.cost));
    counts.company = offers + (prestigeReady ? 1 : 0) + (perkReady ? 1 : 0);
    for (const tab of document.querySelectorAll('.tab')) {
      const b = tab.querySelector('.badge');
      const n = counts[tab.dataset.tab] || 0;
      const show = n > 0 && tab.dataset.tab !== this.tab;
      b.hidden = !show;
      if (show) this.setText(b, n > 9 ? '9+' : String(n));
    }
    const candReady = g.boardUnlocked() && s.meta.candidates.some((c) => s.meta.shares >= g.candidateCost(c));
    if (candReady) counts.team += 1;
    const dots = { investors: prestigeReady || perkReady, contracts: offers > 0, 't-world': officesReady > 0, 't-board': candReady };
    for (const d of document.querySelectorAll('[data-dot]')) d.hidden = !dots[d.dataset.dot];
  }

  // ---------------------------------------------------------------------
  // Toasty i modale
  // ---------------------------------------------------------------------
  toast(icon, title, text = '', kind = 'info') {
    this.toastQueue.push({ icon, title, text, kind });
    if (this.toastQueue.length > 6) this.toastQueue.splice(0, this.toastQueue.length - 6);
    this.pumpToasts();
  }

  // Toasty pojawiają się pod licznikiem gotówki, żeby go nie zasłaniać.
  placeToasts() {
    const hud = document.querySelector('.hud');
    const app = $('app');
    if (!hud || !app) return;
    const top = hud.getBoundingClientRect().bottom - app.getBoundingClientRect().top + 4;
    $('toasts').style.top = `${Math.round(top)}px`;
  }

  pumpToasts() {
    const box = $('toasts');
    while (box.childElementCount < 2 && this.toastQueue.length) {
      const { icon, title, text, kind } = this.toastQueue.shift();
      const el = document.createElement('div');
      el.className = `toast t-${kind}`;
      el.innerHTML = `<div class="t-ico">${icon}</div><div class="t-body"><div class="t-title">${esc(title)}</div>${text ? `<div class="t-text">${esc(text)}</div>` : ''}</div>`;
      box.appendChild(el);
      const ttl = this.toastQueue.length > 2 ? 1800 : kind === 'achievement' ? 3200 : 2600;
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => { el.remove(); this.pumpToasts(); }, 280);
      }, ttl);
    }
  }

  openModal(html) {
    $('modal-body').innerHTML = html;
    $('modal').hidden = false;
  }

  closeModal() {
    $('modal').hidden = true;
    $('modal-body').innerHTML = '';
  }

  showWelcome(keepName = null) {
    const names = t('companyNames');
    const name = keepName || names[Math.floor(Math.random() * names.length)];
    this.openModal(`
      <div style="display:flex;justify-content:center;margin-bottom:6px">${this.langSeg('welcome-lang')}</div>
      <div class="hero">🚀</div>
      <h2>${esc(t('appName'))}</h2>
      <p style="text-align:center">${t('w.lead')}</p>
      <ul>${t('w.tips').map((tip) => `<li>${tip}</li>`).join('')}</ul>
      <p style="margin-bottom:6px">${t('w.name')}</p>
      <input class="text-input" id="welcome-name" maxlength="28" value="${esc(name)}" enterkeyhint="done">
      <div class="actions"><button class="btn violet btn-wide" data-act="welcome-start">${t('w.start')}</button></div>`);
  }

  showMigration() {
    const g = this.g;
    this.openModal(`
      <div class="hero">🌍</div>
      <h2>${t('mig.title')}</h2>
      <p>${t('mig.text')}</p>
      <p>${t('mig.now', { stage: t(`reach.${g.marketStage()}`), v: money(g.marketCap), n: fmt(g.s.investors) })}</p>
      <div class="actions"><button class="btn violet btn-wide" data-act="modal-close">${t('mig.ok')}</button></div>`);
  }

  // Koperta z decyzją w rogu sceny
  syncDecision() {
    const d = this.g.s.meta.decision;
    if (!d) {
      if (this.envelopeEl) { this.envelopeEl.remove(); this.envelopeEl = null; }
      return;
    }
    if (this.envelopeEl) return;
    const el = document.createElement('button');
    el.className = 'envelope';
    el.textContent = '📨';
    el.dataset.act = 'decision-open';
    el.setAttribute('aria-label', t('dec.badge'));
    $('bubble-layer').appendChild(el);
    this.envelopeEl = el;
  }

  showDecision() {
    const g = this.g;
    const d = g.s.meta.decision;
    if (!d) return;
    const D = DECISIONS[d.i];
    const opt = (w) => {
      const e = g.decisionEffect(D[w].fx);
      return `<button class="choice" data-act="decide" data-v="${w}"><b>${esc(TX.decisionLabel(d.i, w))}</b><span>${esc(TX.decisionEffectText(e))}</span></button>`;
    };
    this.openModal(`
      <div class="hero">${D.icon}</div>
      <h2>${esc(TX.decisionTitle(d.i))}</h2>
      <p style="text-align:center">${esc(TX.decisionText(d.i))}</p>
      <div class="actions">${opt('a')}${opt('b')}
        <button class="btn ghost btn-wide" data-act="modal-close">${t('dec.later')}</button>
      </div>`);
  }

  queueOffline(r, layer) {
    if (!this.offlineBuf) {
      this.offlineBuf = {};
      setTimeout(() => {
        const buf = this.offlineBuf || {};
        this.offlineBuf = null;
        const main = buf[this.g.D.id];
        const others = Object.entries(buf).filter(([id, x]) => id !== this.g.D.id && x.cash > 0);
        if (main) this.showOffline(main, others);
      }, 0);
    }
    this.offlineBuf[layer.D.id] = r;
  }

  showOffline(r, others = []) {
    const cash = r ? r.cash + (r.feed || 0) : 0;
    if (!r || r.elapsed < 60 || !(cash > 0 || r.rp > 0)) return;
    const extra = others.map(([id, x]) => `<p style="text-align:center;margin:4px 0">${t('o.other', { icon: LAYERS[id].icon, name: t(`layer.${id}`), v: money(x.cash) })}</p>`).join('');
    this.openModal(`
      <div class="hero">🌙</div>
      <h2>${t('o.title')}</h2>
      <p style="text-align:center">${this.tl('o.away', { t: fmtTime(r.elapsed) })}</p>
      <div class="big-money">+${money(cash)}</div>
      ${r.rp > 0 ? `<p style="text-align:center;color:var(--rp);font-weight:800;margin:6px 0">${t('o.rp', { v: fmt(r.rp) })}</p>` : ''}${extra}
      ${r.contracts ? `<p style="text-align:center">${t('o.contracts', { n: r.contracts })}</p>` : ''}
      <p style="text-align:center;font-size:12.5px">${t('o.note', { p: Math.round(r.eff * 100), t: fmtTime(r.cap), reached: r.elapsed > r.cap ? t('o.reached') : '' })}</p>
      <div class="actions"><button class="btn btn-wide" data-act="modal-close">${t('o.ok')}</button></div>`);
    play('coin');
  }

  confirmPrestige() {
    const g = this.g;
    const s = g.s;
    const gain = g.prestigeGain();
    if (gain < 1) {
      this.toast(this.lu.cur, this.tl('toast.tooEarly'), this.tl('toast.tooEarlyText', { v: money(g.nextPrestigeAt()) }), 'info');
      return;
    }
    const per = g.D.PRESTIGE.bonus + g.m.investorPct;
    const after = 1 + (s.investors + gain) * per;
    this.openModal(`
      <div class="hero">${this.lu.round}</div>
      <h2>${esc(this.tl('p.title', { r: this.roundLabel(s.prestigeCount) }))}</h2>
      <p style="text-align:center">${this.tl('p.lead')}</p>
      <div class="big-money" style="color:var(--gold)">+${fmt(gain)} ${this.lu.cur}</div>
      <p style="text-align:center">${this.tl('p.gain', { a: fmt(g.m.invMult), b: fmt(after), n: fmt(gain) })}</p>
      <ul><li>${this.tl('p.resets')}</li><li>${this.tl('p.keeps')}</li></ul>
      <div class="actions">
        <button class="btn gold btn-wide" data-act="prestige-confirm">${this.tl('p.confirm')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('p.cancel')}</button>
      </div>`);
  }

  confirmReset() {
    this.openModal(`
      <div class="hero">⚠️</div>
      <h2>${t('r.title')}</h2>
      <p style="text-align:center">${t('r.text')}</p>
      <div class="actions">
        <button class="btn danger btn-wide" data-act="reset-confirm">${t('r.confirm')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('cancel')}</button>
      </div>`);
  }

  showExport() {
    const code = this.hooks.exportSave?.() || '';
    this.openModal(`
      <div class="hero">💾</div>
      <h2>${t('e.title')}</h2>
      <p>${t('e.text')}</p>
      <textarea class="text-input" id="export-text" readonly>${esc(code)}</textarea>
      <div class="actions">
        <button class="btn violet btn-wide" data-act="copy-export">${t('e.copy')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('close')}</button>
      </div>`);
  }

  async copyExport() {
    const ta = $('export-text');
    if (!ta) return;
    try {
      await navigator.clipboard.writeText(ta.value);
      this.toast('📋', t('toast.copied'), '', 'info');
    } catch {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try { document.execCommand('copy'); this.toast('📋', t('toast.copied'), '', 'info'); } catch { this.toast('📋', t('toast.copyManual'), '', 'info'); }
    }
  }

  showImport() {
    this.openModal(`
      <div class="hero">📥</div>
      <h2>${t('i.title')}</h2>
      <p>${t('i.text')}</p>
      <textarea class="text-input" id="import-text" placeholder="${t('i.placeholder')}"></textarea>
      <div class="actions">
        <button class="btn violet btn-wide" data-act="import-confirm">${t('i.load')}</button>
        <button class="btn ghost btn-wide" data-act="modal-close">${t('cancel')}</button>
      </div>`);
  }

  doImport() {
    const text = ($('import-text')?.value || '').trim();
    if (!text) return;
    const ok = this.hooks.importSave?.(text);
    if (ok) {
      this.closeModal();
      this.applyStatic();
      this.renderCompanyTabs();
      this.renderTeamTabs();
      this.fullRender();
      this.restartTicker();
      this.toast('✅', t('toast.imported'), '', 'info');
      if (this.co.migrated) this.showMigration();
      else if (this.co.converted) this.showLayersIntro();
    } else {
      this.toast('❌', t('toast.importBad'), t('toast.importBadText'), 'info');
    }
  }

  showInstallHelp() {
    this.openModal(`
      <div class="hero">📲</div>
      <h2>${t('h.title')}</h2>
      <ul>${t('h.steps').map((x) => `<li>${x}</li>`).join('')}</ul>
      <p>${t('h.note')}</p>
      <div class="actions"><button class="btn violet btn-wide" data-act="modal-close">${t('h.ok')}</button></div>`);
  }

  fullRender() {
    this.sigs = {};
    this.applyStatic();
    this.renderCompanyTabs();
    this.renderTeamTabs();
    this.renderBuySegs();
    this.updateSoundBtn();
    this.scene.render(this.g, true);
    this.syncBubble();
    this.syncDecision();
    this.updateAll(true);
  }
}
