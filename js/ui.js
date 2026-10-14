// Interfejs: renderowanie zakładek, HUD, efekty kliknięć, modale i toasty.
import {
  PRODUCTS, DEPTS, TECHS, REPEAT_TECHS, ERAS, ACQUISITIONS, PERKS, CATEGORIES, NEWS, BUBBLES,
  COMPANY_STAGES, DEPT_MILESTONE_X,
} from './data.js';
import {
  ACHIEVEMENTS, UPGRADES, PRODUCT_MAP, DEPT_MAP, TECH_MAP, ACH_BONUS, INVESTOR_BONUS,
  nextMilestone, prevMilestone, nextDeptMilestone, deptMilestoneMult, roundName, MAX_SLOTS,
} from './engine.js';
import { fmt, money, fmtInt, fmtTime, fmtClock, fmtPct, plural } from './format.js';
import { Scene } from './scene.js';
import { play, setSound, unlockAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grad = (c) => `background:linear-gradient(135deg, ${c[0]}, ${c[1]})`;
const SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const PARTICLES = ['{ }', '</>', '01', ';', '( )', '=>', '#', '[ ]', '&&', 'fn'];
const PARTICLE_COLORS = ['#a78bfa', '#22d3ee', '#4ade80', '#fbbf24', '#f472b6'];
const BUY_OPTIONS = [[1, '×1'], [10, '×10'], [100, '×100'], ['max', 'MAX']];
const COMPANY_TABS = [
  ['investors', 'Inwestorzy'], ['contracts', 'Kontrakty'], ['acq', 'Przejęcia'],
  ['ach', 'Osiągnięcia'], ['stats', 'Statystyki'], ['settings', 'Ustawienia'],
];

export class UI {
  constructor(game, hooks = {}) {
    this.g = game;
    this.hooks = hooks;
    this.tab = 'office';
    this.companySub = 'investors';
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
    this.newsIdx = Math.floor(Math.random() * NEWS.length);
    this.pendingNews = [];
  }

  init() {
    this.placeToasts();
    window.addEventListener('resize', () => this.placeToasts());
    this.renderBuySegs();
    this.renderCompanyTabs();
    this.bindEvents();
    this.bindGame();
    setSound(!!this.g.s.settings.sound);
    this.updateSoundBtn();
    this.scene.render(this.g, true);
    this.syncBubble();
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
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  }

  bindGame() {
    const g = this.g;
    g.on('toast', (t) => this.toast(t.icon, t.title, t.text, t.kind));
    g.on('achievement', (a) => { this.toast(a.icon, `Osiągnięcie: ${a.name}`, `${a.desc} · +${Math.round(ACH_BONUS * 100)}% przychodu`, 'achievement'); play('achievement'); });
    g.on('bubble', () => this.syncBubble());
    g.on('trend', (t) => { if (t) { this.pendingNews.push(`📈 <b>${esc(t.text)}</b>`); } });
    g.on('contractOffer', () => { if (this.tab !== 'company') this.pendingNews.push('🤝 <b>Nowe zapytanie ofertowe</b> — sprawdź Kontrakty w zakładce Firma'); });
    g.on('structure', () => { this.scene.render(g); });
    g.on('buy', (b) => {
      if (b.kind === 'tech' || b.kind === 'acq') play('unlock'); else play('buy');
      if (b.kind === 'dept' || b.kind === 'product') this.scene.render(g);
    });
    g.on('offline', (r) => this.showOffline(r));
    g.on('prestige', () => play('prestige'));
  }

  action(act, el) {
    const g = this.g;
    const s = g.s;
    const id = el.dataset.id;
    unlockAudio();
    switch (act) {
      case 'goto': this.showTab(el.dataset.tab, el.dataset.sub); break;
      case 'set-buy': s.settings.buyAmount = el.dataset.v === 'max' ? 'max' : Number(el.dataset.v); this.renderBuySegs(); this.updateAll(true); break;
      case 'buy-product': if (g.buyProduct(id, this.buyAmount())) this.pulse(el); this.updateAll(); break;
      case 'unlock-dept': if (g.unlockDept(id)) { play('unlock'); this.scene.render(g); } this.updateAll(true); break;
      case 'hire': if (g.hire(id, this.buyAmount())) this.pulse(el); this.updateAll(); break;
      case 'research': g.research(id); this.updateAll(true); break;
      case 'research-repeat': g.researchRepeat(id); this.updateAll(true); break;
      case 'buy-upgrade': g.buyUpgrade(id); this.updateAll(true); break;
      case 'buy-all': { const n = g.buyAllUpgrades(); if (n) this.toast('⬆️', `Kupiono ${n} ${plural(n, 'ulepszenie', 'ulepszenia', 'ulepszeń')}`, '', 'info'); this.updateAll(true); break; }
      case 'buy-perk': g.buyPerk(id); this.updateAll(true); break;
      case 'buy-acq': g.buyAcq(id); this.updateAll(true); break;
      case 'accept-contract': if (g.acceptContract(Number(id), Date.now())) play('coin'); this.updateAll(true); break;
      case 'decline-contract': g.declineContract(Number(id)); this.updateAll(true); break;
      case 'company-sub': this.companySub = el.dataset.sub; this.renderCompanyTabs(); this.updateAll(true); break;
      case 'prestige': this.confirmPrestige(); break;
      case 'prestige-confirm': {
        const gain = g.doPrestige(Date.now());
        this.closeModal();
        if (gain) {
          this.scene.render(g, true);
          this.showTab('office');
          this.toast('🦄', `Runda zamknięta: +${fmt(gain)} kapitału`, `Przychód ×${fmt(g.m.invMult)} dzięki inwestorom`, 'achievement');
          this.hooks.save?.();
        }
        break;
      }
      case 'toggle-sound': s.settings.sound = !s.settings.sound; setSound(s.settings.sound); this.updateSoundBtn(); if (s.settings.sound) play('buy'); this.sigs.company = ''; this.updateAll(true); break;
      case 'modal-close': this.closeModal(); break;
      case 'rename': this.rename(); break;
      case 'welcome-start': {
        const v = ($('welcome-name')?.value || '').trim();
        if (v) s.companyName = v.slice(0, 28);
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
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) break;
        const got = !!s.achievements[a.id];
        if (got || !a.hidden) this.toast(got ? a.icon : '🔒', a.name, a.desc, got ? 'achievement' : 'info');
        else this.toast('❓', 'Ukryte osiągnięcie', 'Odkryj je, grając dalej…', 'info');
        break;
      }
      case 'install-help': this.showInstallHelp(); break;
      default: break;
    }
  }

  buyAmount() { return this.g.s.settings.buyAmount || 1; }

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
    if (sub) { this.companySub = sub; this.renderCompanyTabs(); }
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === tab));
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

  renderCompanyTabs() {
    $('company-tabs').innerHTML = COMPANY_TABS.map(([k, l]) =>
      `<button class="pill ${k === this.companySub ? 'on' : ''}" data-act="company-sub" data-sub="${k}">${l}<i class="dot" data-dot="${k}" hidden></i></button>`).join('');
  }

  // ---------------------------------------------------------------------
  // Pętla UI
  // ---------------------------------------------------------------------
  frame(now) {
    if (now - this.lastHud > 60) { this.lastHud = now; this.updateHud(); }
    if (now - this.lastSlow > 250) { this.lastSlow = now; this.updateAll(); }
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
    if (this.scene) this.scene.render(this.g);
  }

  setText(el, text) { if (el && el.textContent !== text) el.textContent = text; }

  updateHud() {
    const g = this.g;
    const s = g.s;
    this.setText($('hud-cash'), money(s.cash));
    this.setText($('hud-income'), money(g.income));
    $('hud-income').parentElement.classList.toggle('boosted', g.m.boostIncome > 1);
    this.setText($('hud-company'), s.companyName);
    this.setText($('hud-stage'), this.stageName());
    const rpVis = s.deptUnlocked.rnd || s.rp > 0 || g.techCount() > 0;
    $('hud-rp-chip').hidden = !rpVis;
    if (rpVis) this.setText($('hud-rp'), fmt(s.rp));
    $('hud-inv-chip').hidden = !(s.investors > 0);
    if (s.investors > 0) this.setText($('hud-inv'), fmt(s.investors));
    this.setText($('click-value'), '+' + money(g.clickValue));
    $('tap-btn').classList.toggle('hack', !!g.boostActive('click'));
  }

  stageName() {
    const s = this.g.s;
    const floors = this.g.deptCount() - 1;
    let stage = COMPANY_STAGES[0].name;
    for (const st of COMPANY_STAGES) if (floors >= st.floors) stage = st.name;
    return s.prestigeCount > 0 ? `${stage} · ${roundName(s.prestigeCount - 1)}` : stage;
  }

  updateSoundBtn() {
    $('sound-btn').innerHTML = this.g.s.settings.sound ? SOUND_ON : SOUND_OFF;
  }

  // ---------------------------------------------------------------------
  // Biuro
  // ---------------------------------------------------------------------
  updateOffice() {
    const g = this.g;
    const s = g.s;
    const owned = PRODUCTS.reduce((a, p) => a + (s.products[p.id] || 0), 0);
    let left = '';
    if (owned === 0) {
      left = `<div class="mini-stat">Pierwszy krok<b>Zbierz ${money(PRODUCT_MAP.landing.cost)}</b></div><button class="mini-btn" data-act="goto" data-tab="products">Produkty →</button>`;
    } else {
      left = `<div class="mini-stat">Zespół<b>${fmtInt(g.totalHeads())} os.</b></div>`;
      if (g.rpRate > 0) left += `<div class="mini-stat">Badania<b>${fmt(g.rpRate)} PB/s</b></div>`;
      else left += `<div class="mini-stat">Produkty<b>${fmtInt(owned)} poz.</b></div>`;
    }
    let right = `<div class="mini-stat">Wycena<b>${money(g.valuation())}</b></div>`;
    const gain = g.prestigeGain();
    const offers = s.contracts.offers.length;
    if (gain >= 1 && gain >= Math.max(1, s.investors * 0.5)) {
      right += `<button class="mini-btn glow" data-act="goto" data-tab="company" data-sub="investors">💎 +${fmt(gain)}</button>`;
    } else if (g.contractsUnlocked() && offers > 0) {
      right += `<button class="mini-btn" data-act="goto" data-tab="company" data-sub="contracts">🤝 Oferty: ${offers}</button>`;
    } else {
      right += `<div class="mini-stat">Kodowanie<b>${money(g.clickValue)}</b></div>`;
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
      const p = PRODUCT_MAP[s.trend.pid];
      parts.push(`<span class="scene-badge trend">📈 ${esc(p.name)} ×${String(s.trend.x).replace('.', ',')} · ${fmtClock((s.trend.until - now) / 1000)}</span>`);
    }
    if (s.contracts.active.length) {
      const next = Math.min(...s.contracts.active.map((a) => a.end));
      parts.push(`<span class="scene-badge" data-act="goto" data-tab="company" data-sub="contracts">🤝 Kontrakty: ${s.contracts.active.length} · ${fmtClock((next - now) / 1000)}</span>`);
    }
    const html = parts.join('');
    const el = $('scene-badges');
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  syncBubble() {
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
    if (this.bubbleEl && this.bubbleEl.dataset.until === String(b.until)) return;
    if (this.bubbleEl) this.bubbleEl.remove();
    const info = BUBBLES[b.type];
    const el = document.createElement('button');
    el.className = 'bubble';
    el.dataset.until = String(b.until);
    el.dataset.label = info.name;
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

  nextTicker() {
    const el = $('ticker');
    let html;
    if (this.pendingNews.length) html = this.pendingNews.shift();
    else {
      this.newsIdx = (this.newsIdx + 1 + Math.floor(Math.random() * 3)) % NEWS.length;
      html = '📰 ' + esc(NEWS[this.newsIdx]).replace(/\{c\}/g, `<b>${esc(this.g.s.companyName)}</b>`);
    }
    el.innerHTML = html;
    const w = el.scrollWidth;
    const box = el.parentElement.clientWidth || 300;
    const dist = w;
    const dur = Math.max(6000, (dist / 50) * 1000);
    el.style.transform = 'translateX(0)';
    const anim = el.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${dist}px)` }], { duration: dur, easing: 'linear' });
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
    for (const p of PRODUCTS) {
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
          <div class="tile" style="${grad(CATEGORIES[p.cat].grad)}">${p.icon}</div>
          <div class="card-title"><h3>${esc(p.name)}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="inc"></div>
          <div class="card-desc">${esc(p.desc)}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="buy-product" data-id="${p.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      if (teaser) {
        const t = TECH_MAP[teaser.tech];
        html += `
        <div class="card teaser locked">
          <div class="tile" style="${grad(CATEGORIES[teaser.cat].grad)}">${teaser.icon}</div>
          <div class="card-title"><h3>${esc(teaser.name)}</h3><span class="lvl">🔒</span></div>
          <div class="card-sub">Wymaga technologii: <span class="rp">${t.icon} ${esc(t.name)}</span></div>
          <div class="card-desc">${esc(teaser.desc)}</div>
          <div class="card-foot"><div class="prog"></div><button class="btn violet" data-act="goto" data-tab="research">Badania →</button></div>
        </div>`;
      }
      root.innerHTML = html;
    }
    const amt = this.buyAmount();
    for (const card of root.querySelectorAll('[data-pid]')) {
      const id = card.dataset.pid;
      const lvl = s.products[id] || 0;
      const inc = g.prodIncome[id] || 0;
      const share = g.income > 0 ? inc / g.income : 0;
      this.setText(card.querySelector('[data-f="lvl"]'), `Poz. ${fmtInt(lvl)}`);
      const incEl = card.querySelector('[data-f="inc"]');
      const pct = share >= 0.995 ? '100%' : share >= 0.01 ? `${Math.round(share * 100)}%` : '<1%';
      const incHtml = lvl > 0 ? `<b>+${money(inc)}/s</b> · ${pct} przychodu` : 'Jeszcze nie wydany';
      if (incEl.innerHTML !== incHtml) incEl.innerHTML = incHtml;
      const next = nextMilestone(lvl);
      const prev = prevMilestone(lvl);
      const bar = card.querySelector('[data-f="bar"]');
      if (next) {
        bar.style.width = `${Math.min(100, ((lvl - prev) / (next - prev)) * 100)}%`;
        this.setText(card.querySelector('[data-f="ms"]'), `${fmtInt(lvl)}/${next} · kamień milowy ×2`);
      } else {
        bar.style.width = '100%';
        this.setText(card.querySelector('[data-f="ms"]'), 'Wszystkie kamienie milowe!');
      }
      let n = amt === 'max' ? g.productMax(id) : amt;
      const showN = Math.max(1, n);
      const cost = g.productCost(id, showN);
      const btn = card.querySelector('.btn');
      btn.classList.toggle('off', cost > s.cash || n < 1);
      this.setText(card.querySelector('[data-f="bn"]'), lvl === 0 && showN === 1 ? 'Wydaj' : `Kup ×${fmtInt(showN)}`);
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
        case 'income': parts.push(`${fmtPct(v)} przychodu`); break;
        case 'clickFlat': parts.push(`+${fmt(v)} do kodowania`); break;
        case 'clickMult': parts.push(`${fmtPct(v)} siły kodowania`); break;
        case 'rp': parts.push(`<span class="rp">+${fmt(v * m.rp)} PB/s</span>`); break;
        case 'eventFreq': parts.push(`${fmtPct(c)} częstsze wydarzenia`); break;
        case 'contract': parts.push(`${fmtPct(c)} nagród z kontraktów`); break;
        case 'slotEvery': parts.push(`${Math.min(MAX_SLOTS, 1 + Math.floor(n / e.v))} miejsc na kontrakty`); break;
        case 'offlineEff': parts.push(`${fmtPct(c)} wydajności offline`); break;
        case 'hireCost': parts.push(`−${Math.round(c * 100)}% kosztu rekrutacji`); break;
        case 'prodCost': parts.push(`−${Math.round(c * 100)}% kosztu produktów`); break;
        case 'offlineCap': parts.push(`+${fmtTime(v)} limitu offline`); break;
        case 'auto': parts.push(`+${fmt(v)} auto-kliknięć/s`); break;
        case 'cat': parts.push(`${fmtPct(c)} dla kategorii ${CATEGORIES[e.cat].name}`); break;
        case 'acqCost': parts.push(`−${Math.round(c * 100)}% kosztu przejęć`); break;
        case 'prestige': parts.push(`${fmtPct(c)} kapitału z rundy`); break;
        default: break;
      }
    }
    return parts.join(' · ');
  }

  updateTeam() {
    const g = this.g;
    const s = g.s;
    const unlocked = DEPTS.filter((d) => s.deptUnlocked[d.id]);
    const next = DEPTS.find((d) => !s.deptUnlocked[d.id]);
    const sig = unlocked.map((d) => d.id).join(',') + '|' + (next ? next.id + (g.deptAvailable(next.id) ? '1' : '0') : '');
    const root = $('team-list');
    if (this.sigs.team !== sig) {
      this.sigs.team = sig;
      let html = unlocked.map((d) => `
        <div class="card" data-did="${d.id}">
          <div class="tile" style="${grad([d.color, '#2b2f5c'])}">${d.icon}</div>
          <div class="card-title"><h3>${esc(d.name)}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="fx"></div>
          <div class="card-desc">${esc(d.desc)}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="hire" data-id="${d.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      if (next) {
        const avail = g.deptAvailable(next.id);
        const t = next.tech ? TECH_MAP[next.tech] : null;
        html += `
        <div class="card ${avail ? '' : 'locked'}" data-next="${next.id}">
          <div class="tile" style="${grad([next.color, '#2b2f5c'])}">${next.icon}</div>
          <div class="card-title"><h3>${esc(next.name)}</h3><span class="lvl">Nowe piętro</span></div>
          <div class="card-sub">${avail ? 'Otwórz nowy dział — w budynku pojawi się kolejne piętro.' : `Wymaga technologii: <span class="rp">${t.icon} ${esc(t.name)}</span>`}</div>
          <div class="card-desc">${esc(next.desc)}</div>
          <div class="card-foot"><div class="prog"></div>
            ${avail ? `<button class="btn violet" data-act="unlock-dept" data-id="${next.id}"><span>Otwórz dział</span><small data-f="ucost">${money(next.unlock)}</small></button>`
    : '<button class="btn violet" data-act="goto" data-tab="research">Badania →</button>'}
          </div>
        </div>`;
      }
      root.innerHTML = html;
    }
    const amt = this.buyAmount();
    for (const card of root.querySelectorAll('[data-did]')) {
      const id = card.dataset.did;
      const d = DEPT_MAP[id];
      const n = s.depts[id] || 0;
      this.setText(card.querySelector('[data-f="lvl"]'), `👥 ${fmtInt(n)}`);
      const fxEl = card.querySelector('[data-f="fx"]');
      const fxHtml = n > 0 ? this.deptEffectText(d) : 'Zatrudnij pierwszą osobę!';
      if (fxEl.innerHTML !== fxHtml) fxEl.innerHTML = fxHtml;
      const nm = nextDeptMilestone(n);
      const bar = card.querySelector('[data-f="bar"]');
      if (nm) {
        const prev = [0, 25, 50, 100, 150, 200, 300, 400, 500].filter((x) => x <= n).pop() || 0;
        bar.style.width = `${Math.min(100, ((n - prev) / (nm - prev)) * 100)}%`;
        this.setText(card.querySelector('[data-f="ms"]'), `${fmtInt(n)}/${nm} · efekty ×${String(DEPT_MILESTONE_X).replace('.', ',')}`);
      } else {
        bar.style.width = '100%';
        this.setText(card.querySelector('[data-f="ms"]'), 'Pełna obsada!');
      }
      const k = amt === 'max' ? g.hireMax(id) : amt;
      const showN = Math.max(1, k);
      const cost = g.hireCost(id, showN);
      card.querySelector('.btn').classList.toggle('off', cost > s.cash || k < 1);
      this.setText(card.querySelector('[data-f="bn"]'), `Zatrudnij ×${fmtInt(showN)}`);
      this.setText(card.querySelector('[data-f="cost"]'), money(cost));
    }
    const nx = root.querySelector('[data-next]');
    if (nx) {
      const btn = nx.querySelector('[data-act="unlock-dept"]');
      if (btn) btn.classList.toggle('off', s.cash < DEPT_MAP[nx.dataset.next].unlock);
    }
  }

  // ---------------------------------------------------------------------
  // Badania
  // ---------------------------------------------------------------------
  updateResearch() {
    const g = this.g;
    const s = g.s;
    const head = $('research-head');
    const headHtml = `
      <div class="rp-card">
        <div><div class="card-sub">Punkty badań</div><div class="rp-big">${fmt(s.rp)} PB</div></div>
        <div style="text-align:right"><div class="rp-rate">+${fmt(g.rpRate)} PB/s</div><div class="card-sub">${g.techCount()}/${TECHS.length} technologii</div></div>
      </div>
      ${!s.deptUnlocked.rnd ? '<div class="hint" style="margin-top:10px">Otwórz dział <b>Badania i rozwój</b> w zakładce Zespół, żeby zdobywać punkty badań. 🔬</div>'
    : '<div class="card-sub" style="margin:8px 2px 0">Odkryte technologie zostają z Tobą także po rundzie finansowania.</div>'}`;
    if (head.innerHTML !== headHtml) head.innerHTML = headHtml;

    const done = TECHS.filter((t) => s.techs[t.id]).map((t) => t.id);
    const avail = TECHS.filter((t) => !s.techs[t.id] && g.techAvailable(t.id)).map((t) => t.id);
    const maxEra = Math.max(1, ...TECHS.filter((t) => s.techs[t.id] || g.techAvailable(t.id)).map((t) => t.era));
    const repeats = REPEAT_TECHS.filter((r) => g.techAvailable(r.id));
    const sig = done.join(',') + '|' + avail.join(',') + '|' + repeats.map((r) => r.id + (s.techLevels[r.id] || 0)).join(',');
    const root = $('research-list');
    if (this.sigs.research !== sig) {
      this.sigs.research = sig;
      let html = '';
      for (const era of ERAS) {
        const techs = TECHS.filter((t) => t.era === era.id);
        const cnt = techs.filter((t) => s.techs[t.id]).length;
        if (era.id > maxEra + 1) {
          html += `<div class="era-head" style="opacity:.45"><span class="era-ico">🔒</span><h3>Era ${era.id}: ${esc(era.name)}</h3><span class="era-count">${cnt}/${techs.length}</span></div>`;
          continue;
        }
        html += `<div class="era-head"><span class="era-ico">${era.icon}</span><h3>${esc(era.name)}</h3><span class="era-count">${cnt}/${techs.length}</span></div><div class="tech-grid">`;
        for (const t of techs) {
          const isDone = !!s.techs[t.id];
          const isAvail = !isDone && g.techAvailable(t.id);
          const cls = isDone ? 'done' : isAvail ? '' : 'locked';
          const req = !isDone && !isAvail ? `<div class="req">Wymaga: ${t.req.filter((r) => !s.techs[r]).map((r) => esc(TECH_MAP[r].name)).join(', ')}</div>` : '';
          html += `<div class="tech ${cls}" data-tid="${t.id}">
            ${isDone ? '<span class="check">✓</span>' : ''}
            <div class="tech-top"><div class="tech-ico">${t.icon}</div><h4>${esc(t.name)}</h4></div>
            <div class="fx">${esc(g.describeFx(t.fx))}</div>
            ${req}
            ${isAvail ? `<button class="btn violet" data-act="research" data-id="${t.id}">${fmt(t.cost)} PB</button>` : ''}
          </div>`;
        }
        html += '</div>';
      }
      if (repeats.length) {
        html += '<div class="era-head"><span class="era-ico">♾️</span><h3>Badania bez końca</h3></div><div class="tech-grid">';
        for (const r of repeats) {
          html += `<div class="tech" data-rid="${r.id}">
            <div class="tech-top"><div class="tech-ico">${r.icon}</div><h4>${esc(r.name)} <span class="perk-lvl">poz. ${s.techLevels[r.id] || 0}</span></h4></div>
            <div class="fx">${esc(r.desc)}</div>
            <button class="btn violet" data-act="research-repeat" data-id="${r.id}">${fmt(g.repeatCost(r.id))} PB</button>
          </div>`;
        }
        html += '</div>';
      }
      root.innerHTML = html;
    }
    for (const el of root.querySelectorAll('[data-tid] .btn')) {
      el.classList.toggle('off', s.rp < TECH_MAP[el.dataset.id].cost);
    }
    for (const el of root.querySelectorAll('[data-rid] .btn')) {
      el.classList.toggle('off', s.rp < g.repeatCost(el.dataset.id));
    }
  }

  // ---------------------------------------------------------------------
  // Ulepszenia
  // ---------------------------------------------------------------------
  upgradeTile(u) {
    if (u.kind === 'product') return grad(CATEGORIES[u.cat].grad);
    if (u.kind === 'dept') return grad([DEPT_MAP[u.req.dept].color, '#2b2f5c']);
    if (u.kind === 'click') return grad(['#22d3ee', '#3b5bdb']);
    return grad(['#f59e0b', '#db2777']);
  }

  updateUpgrades() {
    const g = this.g;
    const s = g.s;
    const avail = g.availableUpgrades();
    const ownedIds = Object.keys(s.upgrades);
    const sig = avail.map((u) => u.id).join(',') + '|' + ownedIds.length;
    const root = $('upgrades-list');
    if (this.sigs.upgrades !== sig) {
      this.sigs.upgrades = sig;
      let html = '';
      if (!avail.length) {
        html += '<div class="hint">Brak dostępnych ulepszeń. Rozwijaj produkty i działy — nowe ulepszenia pojawią się same. ✨</div>';
      } else {
        html += '<div class="up-grid">' + avail.map((u) => `
          <div class="up" data-uid="${u.id}">
            <div class="tile" style="${this.upgradeTile(u)}">${u.icon}</div>
            <div><h4>${esc(u.name)}</h4><p>${esc(u.desc)}</p></div>
            <button class="btn" data-act="buy-upgrade" data-id="${u.id}">${money(u.cost)}</button>
          </div>`).join('') + '</div>';
      }
      if (ownedIds.length) {
        html += `<div class="section-title">Kupione · ${ownedIds.length}</div><div class="owned-list">`
          + ownedIds.map((id) => UPGRADES.find((u) => u.id === id)).filter(Boolean).map((u) => `<span title="${esc(u.name)}">${u.icon}</span>`).join('') + '</div>';
      }
      root.innerHTML = html;
    }
    let can = 0;
    for (const el of root.querySelectorAll('[data-uid]')) {
      const u = UPGRADES.find((x) => x.id === el.dataset.uid);
      const ok = s.cash >= u.cost;
      if (ok) can++;
      el.classList.toggle('can', ok);
      el.querySelector('.btn').classList.toggle('off', !ok);
    }
    const all = $('buy-all-btn');
    all.classList.toggle('off', can === 0);
    this.setText(all, can > 0 ? `Kup wszystkie (${can})` : 'Kup wszystkie');
  }

  // ---------------------------------------------------------------------
  // Firma
  // ---------------------------------------------------------------------
  updateCompany() {
    switch (this.companySub) {
      case 'investors': return this.renderInvestors();
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
  patch(values) {
    const root = $('company-body');
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
    const per = INVESTOR_BONUS + g.m.investorPct;
    const sig = `inv|${JSON.stringify(s.perks)}|${s.prestigeCount}`;
    this.setBody(sig, `
      <div class="inv-card">
        <div class="round" data-v="round"></div>
        <div class="big" data-v="gain"></div>
        <div class="sub" data-v="invsub"></div>
      </div>
      <div class="kv">
        <span>Wycena firmy</span><b data-v="val"></b>
        <span>Zarobione w tej rundzie</span><b data-v="run"></b>
        <span>Zarobione łącznie</span><b data-v="total"></b>
        <span>Kolejny punkt kapitału przy</span><b data-v="next"></b>
        <span data-v="boardl">Bonus zarządu</span><b data-v="board"></b>
      </div>
      <div style="margin-top:12px">
        <button class="btn gold btn-wide" data-act="prestige" data-v="pbtn">Zbierz rundę finansowania</button>
      </div>
      <p class="card-sub" style="margin:10px 2px">Runda zaczyna firmę od nowa (gotówka, produkty, działy, ulepszenia, przejęcia), ale <b style="color:var(--text)">technologie, punkty badań i osiągnięcia zostają</b>, a kapitał inwestorów trwale zwiększa przychód.</p>
      <div class="section-title">Rada nadzorcza <span style="color:var(--gold)" data-v="shares"></span></div>
      <div class="list">
        ${PERKS.map((p) => {
    const lvl = s.perks[p.id] || 0;
    const maxed = lvl >= p.max;
    return `<div class="card">
            <div class="tile" style="${grad(['#f59e0b', '#7c3aed'])}">${p.icon}</div>
            <div class="card-title"><h3>${esc(p.name)}</h3><span class="perk-lvl">${lvl}/${p.max}</span></div>
            <div class="card-sub">${esc(p.desc)}</div>
            <div class="card-foot"><div class="prog"><div class="prog-bar"><i style="width:${(lvl / p.max) * 100}%"></i></div></div>
              ${maxed ? '<button class="btn off">Maks.</button>' : `<button class="btn gold" data-act="buy-perk" data-id="${p.id}" data-v="perk-${p.id}">${fmt(g.perkCost(p.id))} 💎</button>`}
            </div></div>`;
  }).join('')}
      </div>`);
    const vals = {
      round: `Następna runda: ${roundName(s.prestigeCount)}`,
      gain: `+${fmt(gain)} 💎`,
      invsub: { html: `Obecnie ${fmt(s.investors)} kapitału = przychód ×${fmt(g.m.invMult)}<br>Każdy punkt: +${String(Math.round(per * 1000) / 10).replace('.', ',')}% przychodu` },
      val: money(g.valuation()),
      run: money(s.runEarned),
      total: money(s.totalEarned),
      next: money(g.nextPrestigeAt()),
      board: { text: `×${fmt(g.m.prestige)}`, hidden: !(g.m.prestige > 1) },
      boardl: { hidden: !(g.m.prestige > 1) },
      pbtn: { off: gain < 1 },
      shares: `${fmt(s.shares)} udziałów`,
    };
    for (const p of PERKS) vals[`perk-${p.id}`] = { off: s.shares < g.perkCost(p.id) };
    this.patch(vals);
  }

  renderContracts() {
    const g = this.g;
    const s = g.s;
    const now = Date.now();
    if (!g.contractsUnlocked()) {
      this.setBody('con-locked', '<div class="hint">🤝 Otwórz dział <b>Sprzedaż</b> w zakładce Zespół, żeby otrzymywać zapytania ofertowe od klientów.<br><br>Kontrakty to zlecenia na określony czas — po ukończeniu dostajesz sowitą zapłatę, także gdy gra jest zamknięta.</div>');
      return;
    }
    const c = s.contracts;
    const full = c.active.length >= g.m.slots;
    const sig = `con|${c.offers.map((o) => o.id).join(',')}|${c.active.map((a) => a.id).join(',')}|${full}`;
    let html = '<div class="kv"><span>Miejsca na kontrakty</span><b data-v="slots"></b><span>Mnożnik nagród</span><b data-v="cmult"></b></div>';
    html += '<div class="section-title">W realizacji</div>';
    if (!c.active.length) html += '<div class="hint">Brak aktywnych kontraktów.</div>';
    else {
      html += '<div class="list">' + c.active.map((a) => `<div class="contract"><div class="ico">${a.icon}</div><h4>${esc(a.client)}</h4><p>${esc(a.task)} · <span class="reward">+${money(a.reward)}</span>${a.rpReward ? ` · <span style="color:var(--rp)">+${fmt(a.rpReward)} PB</span>` : ''}</p>
          <div class="row"><div class="prog"><div class="prog-bar"><i data-v="abar-${a.id}"></i></div><div class="prog-label" data-v="aleft-${a.id}"></div></div></div></div>`).join('') + '</div>';
    }
    html += '<div class="section-title">Zapytania ofertowe</div>';
    if (!c.offers.length) html += '<div class="hint" data-v="nextoffer"></div>';
    else {
      html += '<div class="list">' + c.offers.map((o) => `<div class="contract"><div class="ico">${o.icon}</div><h4>${esc(o.client)}</h4><p>Zamawia ${esc(o.task)} · czas: ${fmtTime(o.dur)}</p>
          <div class="row"><div style="flex:1;font-size:13px">Nagroda: <span data-v="orew-${o.id}"></span><div class="prog-label" data-v="oexp-${o.id}"></div></div>
          <button class="btn btn-small ghost" data-act="decline-contract" data-id="${o.id}" aria-label="Odrzuć">✕</button>
          <button class="btn btn-small ${full ? 'off' : ''}" data-act="accept-contract" data-id="${o.id}">Przyjmij</button></div></div>`).join('') + '</div>';
      if (full) html += '<p class="card-sub" style="margin:8px 2px">Wszystkie miejsca zajęte — zatrudnij więcej handlowców (co 25 osób = +1 miejsce).</p>';
    }
    this.setBody(sig, html);
    const vals = {
      slots: `${c.active.length}/${g.m.slots}`,
      cmult: `×${fmt(g.m.contract)}`,
      nextoffer: `Czekasz na zapytania… Kolejne za ok. ${fmtClock(Math.max(0, (c.nextOfferAt - now) / 1000))}.`,
    };
    for (const a of c.active) {
      vals[`abar-${a.id}`] = { width: `${Math.min(1, (now - a.start) / (a.end - a.start)) * 100}%` };
      vals[`aleft-${a.id}`] = `Zostało ${fmtClock((a.end - now) / 1000)}`;
    }
    for (const o of c.offers) {
      const r = g.contractReward(o);
      vals[`orew-${o.id}`] = { html: `<span class="reward">+${money(r.cash)}</span>${r.rp ? ` <span style="color:var(--rp);font-weight:800">+${fmt(r.rp)} PB</span>` : ''}` };
      vals[`oexp-${o.id}`] = `Oferta wygasa za ${fmtClock((o.expires - now) / 1000)}`;
    }
    this.patch(vals);
  }

  renderAcq() {
    const g = this.g;
    const s = g.s;
    if (!g.acqUnlocked()) {
      this.setBody('acq-locked', '<div class="hint">⚖️ Otwórz <b>Dział prawny</b>, żeby przejmować inne firmy. Każde przejęcie to potężny bonus do końca rundy.</div>');
      return;
    }
    this.setBody(`acq|${Object.keys(s.acquisitions).join(',')}`, '<div class="list">' + ACQUISITIONS.map((a) => {
      const own = !!s.acquisitions[a.id];
      return `<div class="card">
        <div class="tile" style="${grad(['#0ea5e9', '#6d28d9'])}">${a.icon}</div>
        <div class="card-title"><h3>${esc(a.name)}</h3>${own ? '<span class="lvl" style="color:var(--money)">✓ Twoja</span>' : ''}</div>
        <div class="card-sub">${esc(g.describeFx(a.fx))}</div>
        <div class="card-desc">${esc(a.desc)}</div>
        <div class="card-foot"><div class="prog"></div>${own ? '' : `<button class="btn violet" data-act="buy-acq" data-id="${a.id}" data-v="acq-${a.id}"><span>Przejmij</span><small>${money(g.acqCost(a.id))}</small></button>`}</div>
      </div>`;
    }).join('') + '</div>');
    const vals = {};
    for (const a of ACQUISITIONS) vals[`acq-${a.id}`] = { off: s.cash < g.acqCost(a.id) };
    this.patch(vals);
  }

  renderAch() {
    const g = this.g;
    const s = g.s;
    const count = g.achCount();
    const html = `<div class="kv"><span>Zdobyte osiągnięcia</span><b>${count}/${ACHIEVEMENTS.length}</b><span>Bonus do przychodu</span><b>+${Math.round(count * ACH_BONUS * 100)}%</b></div>
      <p class="card-sub" style="margin:10px 2px">Dotknij ikony, żeby zobaczyć szczegóły.</p>
      <div class="ach-grid">${ACHIEVEMENTS.map((a) => {
    const got = !!s.achievements[a.id];
    return `<button class="ach ${got ? 'got' : 'locked'}" data-act="ach-info" data-id="${a.id}">${got || !a.hidden ? a.icon : '❓'}</button>`;
  }).join('')}</div>`;
    this.setBody(`ach|${count}`, html);
  }

  renderStats() {
    const g = this.g;
    const s = g.s;
    const st = s.stats;
    const html = `<div class="kv">
      <span>Przychód</span><b>${money(g.income)}/s</b>
      <span>Rekordowy przychód</span><b>${money(st.maxIncome)}/s</b>
      <span>Wartość kliknięcia</span><b>${money(g.clickValue)}</b>
      <span>Auto-kliknięcia</span><b>${fmt(g.m.auto)}/s</b>
      <span>Zarobione łącznie</span><b>${money(s.totalEarned)}</b>
      <span>Zarobione w tej rundzie</span><b>${money(s.runEarned)}</b>
      <span>Najlepsza runda</span><b>${money(Math.max(st.bestRun, s.runEarned))}</b>
      <span>Kliknięcia</span><b>${fmtInt(st.clicks)}</b>
      <span>Pracownicy</span><b>${fmtInt(g.totalHeads())}</b>
      <span>Zatrudnieni łącznie</span><b>${fmtInt(st.hired)}</b>
      <span>Kupione ulepszenia</span><b>${fmtInt(st.upgradesBought)}</b>
      <span>Technologie</span><b>${g.techCount()}/${TECHS.length}</b>
      <span>Złapane wydarzenia</span><b>${fmtInt(st.bubbles)}</b>
      <span>Ukończone kontrakty</span><b>${fmtInt(st.contracts)}</b>
      <span>Rundy finansowania</span><b>${s.prestigeCount}</b>
      <span>Limit zarobku offline</span><b>${fmtTime(g.m.offlineCap)}</b>
      <span>Wydajność offline</span><b>${Math.round(g.m.offlineEff * 100)}%</b>
      <span>Czas gry</span><b>${fmtTime(st.playTime)}</b>
      <span>Firma założona</span><b>${new Date(st.startedAt).toLocaleDateString('pl-PL')}</b>
    </div>`;
    this.setBody(`stats|${Math.floor(Date.now() / 1000)}`, html);
  }

  renderSettings() {
    const s = this.g.s;
    const html = `
      <div class="section-title">Firma</div>
      <div class="setting" style="flex-direction:column;align-items:stretch">
        <div>Nazwa firmy<p>Widoczna na szyldzie budynku i w wiadomościach.</p></div>
        <div style="display:flex;gap:8px"><input class="text-input" id="rename-input" maxlength="28" value="${esc(s.companyName)}" enterkeyhint="done"><button class="btn btn-small violet" data-act="rename">Zapisz</button></div>
      </div>
      <div class="section-title">Gra</div>
      <div class="setting"><div>Dźwięki<p>Delikatne efekty przy klikaniu i zakupach.</p></div><button class="switch ${s.settings.sound ? 'on' : ''}" data-act="toggle-sound" aria-label="Dźwięki"></button></div>
      <div class="setting"><div>Instalacja na iPhonie<p>Jak dodać grę do ekranu początkowego.</p></div><button class="btn btn-small ghost" data-act="install-help">Pokaż</button></div>
      <div class="section-title">Zapis gry</div>
      <div class="setting"><div>Eksport zapisu<p>Kopia zapasowa jako tekst — zachowaj ją w Notatkach.</p></div><button class="btn btn-small ghost" data-act="export">Eksportuj</button></div>
      <div class="setting"><div>Import zapisu<p>Wczytaj wcześniej wyeksportowany tekst.</p></div><button class="btn btn-small ghost" data-act="import">Importuj</button></div>
      <div class="setting"><div>Zacznij od nowa<p>Usuwa cały postęp. Nie da się cofnąć.</p></div><button class="btn btn-small danger" data-act="reset">Resetuj</button></div>
      <p class="card-sub" style="text-align:center;margin-top:18px">Krzemowe Imperium · wersja ${esc(this.hooks.version || '1.0')}<br>Gra zapisuje się automatycznie na tym urządzeniu.</p>`;
    this.setBody(`settings|${s.settings.sound}`, html);
  }

  rename() {
    const v = ($('rename-input')?.value || '').trim();
    if (!v) return;
    const s = this.g.s;
    if (v !== s.companyName) {
      s.companyName = v.slice(0, 28);
      s.flags.renamed = true;
      this.scene.render(this.g, true);
      this.toast('🪪', 'Nowa nazwa firmy', s.companyName, 'info');
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
    counts.products = PRODUCTS.filter((p) => g.productUnlocked(p.id) && g.productCost(p.id, 1) <= s.cash).length;
    counts.team = DEPTS.filter((d) => (s.deptUnlocked[d.id] && g.hireCost(d.id, 1) <= s.cash)
      || (!s.deptUnlocked[d.id] && g.deptAvailable(d.id) && s.cash >= d.unlock)).length;
    counts.research = TECHS.filter((t) => !s.techs[t.id] && g.techAvailable(t.id) && s.rp >= t.cost).length;
    counts.upgrades = g.availableUpgrades().filter((u) => u.cost <= s.cash).length;
    const offers = g.contractsUnlocked() && s.contracts.active.length < g.m.slots ? s.contracts.offers.length : 0;
    const gain = g.prestigeGain();
    const prestigeReady = gain >= 1 && gain >= Math.max(1, s.investors * 0.5);
    const perkReady = PERKS.some((p) => (s.perks[p.id] || 0) < p.max && s.shares >= g.perkCost(p.id));
    counts.company = offers + (prestigeReady ? 1 : 0) + (perkReady ? 1 : 0);
    for (const tab of document.querySelectorAll('.tab')) {
      const b = tab.querySelector('.badge');
      const n = counts[tab.dataset.tab] || 0;
      const show = n > 0 && tab.dataset.tab !== this.tab;
      b.hidden = !show;
      if (show) this.setText(b, n > 9 ? '9+' : String(n));
    }
    const dots = { investors: prestigeReady || perkReady, contracts: offers > 0 };
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

  showWelcome() {
    const names = ['Bajt i Synowie', 'Pixel & Spółka', 'Chmurka Software', 'Kod z Garażu', 'Nowa Dolina', 'Startup Marzeń'];
    const name = names[Math.floor(Math.random() * names.length)];
    this.openModal(`
      <div class="hero">🚀</div>
      <h2>Krzemowe Imperium</h2>
      <p style="text-align:center">Wszystko zaczyna się w garażu: laptop, kawa i wielki pomysł.</p>
      <ul>
        <li><b>Koduj</b> — stukaj w fioletowy przycisk, żeby zarobić pierwsze pieniądze.</li>
        <li><b>Produkty</b> zarabiają same, nawet gdy gra jest zamknięta.</li>
        <li><b>Działy</b> to nowe piętra budynku i potężne bonusy.</li>
        <li><b>Badania</b> odblokowują kolejne technologie — od HTML po superinteligencję.</li>
        <li>Łap płonące <b>bąbelki</b> — to virale, inwestorzy i hackathony!</li>
      </ul>
      <p style="margin-bottom:6px">Jak nazywa się Twoja firma?</p>
      <input class="text-input" id="welcome-name" maxlength="28" value="${esc(name)}" enterkeyhint="done">
      <div class="actions"><button class="btn violet btn-wide" data-act="welcome-start">Zaczynamy!</button></div>`);
  }

  showOffline(r) {
    if (!r || r.elapsed < 60 || !(r.cash > 0 || r.rp > 0)) return;
    this.openModal(`
      <div class="hero">🌙</div>
      <h2>Witaj z powrotem!</h2>
      <p style="text-align:center">Nie było Cię ${fmtTime(r.elapsed)}. W tym czasie firma zarobiła:</p>
      <div class="big-money">+${money(r.cash)}</div>
      ${r.rp > 0 ? `<p style="text-align:center;color:var(--rp);font-weight:800;margin:6px 0">+${fmt(r.rp)} punktów badań</p>` : ''}
      ${r.contracts ? `<p style="text-align:center">Ukończone kontrakty: <b style="color:var(--text)">${r.contracts}</b></p>` : ''}
      <p style="text-align:center;font-size:12.5px">Zarobek offline: ${Math.round(r.eff * 100)}% wydajności, limit ${fmtTime(r.cap)}${r.elapsed > r.cap ? ' (osiągnięty)' : ''}.</p>
      <div class="actions"><button class="btn btn-wide" data-act="modal-close">Super!</button></div>`);
    play('coin');
  }

  confirmPrestige() {
    const g = this.g;
    const s = g.s;
    const gain = g.prestigeGain();
    if (gain < 1) {
      this.toast('💎', 'Za wcześnie na rundę', `Pierwszy punkt kapitału przy łącznych zarobkach ${money(g.nextPrestigeAt())}`, 'info');
      return;
    }
    const per = INVESTOR_BONUS + g.m.investorPct;
    const after = 1 + (s.investors + gain) * per;
    this.openModal(`
      <div class="hero">🦄</div>
      <h2>Runda: ${esc(roundName(s.prestigeCount))}</h2>
      <p style="text-align:center">Inwestorzy są gotowi wyłożyć pieniądze. Zyskasz:</p>
      <div class="big-money" style="color:var(--gold)">+${fmt(gain)} 💎</div>
      <p style="text-align:center">Przychód ×${fmt(g.m.invMult)} → <b style="color:var(--text)">×${fmt(after)}</b> oraz ${fmt(gain)} udziałów dla rady nadzorczej.</p>
      <ul>
        <li><b>Resetuje się:</b> gotówka, produkty, działy, ulepszenia, przejęcia.</li>
        <li><b>Zostaje:</b> technologie, punkty badań, osiągnięcia, kapitał i rada nadzorcza.</li>
      </ul>
      <div class="actions">
        <button class="btn gold btn-wide" data-act="prestige-confirm">Zbierz rundę</button>
        <button class="btn ghost btn-wide" data-act="modal-close">Jeszcze nie</button>
      </div>`);
  }

  confirmReset() {
    this.openModal(`
      <div class="hero">⚠️</div>
      <h2>Zacząć od nowa?</h2>
      <p style="text-align:center">Cały postęp — łącznie z technologiami, kapitałem i osiągnięciami — zostanie usunięty. Tego nie da się cofnąć.</p>
      <div class="actions">
        <button class="btn danger btn-wide" data-act="reset-confirm">Tak, usuń wszystko</button>
        <button class="btn ghost btn-wide" data-act="modal-close">Anuluj</button>
      </div>`);
  }

  showExport() {
    const code = this.hooks.exportSave?.() || '';
    this.openModal(`
      <div class="hero">💾</div>
      <h2>Eksport zapisu</h2>
      <p>Skopiuj ten tekst i zachowaj w bezpiecznym miejscu (np. w Notatkach).</p>
      <textarea class="text-input" id="export-text" readonly>${esc(code)}</textarea>
      <div class="actions">
        <button class="btn violet btn-wide" data-act="copy-export">Kopiuj</button>
        <button class="btn ghost btn-wide" data-act="modal-close">Zamknij</button>
      </div>`);
  }

  async copyExport() {
    const ta = $('export-text');
    if (!ta) return;
    try {
      await navigator.clipboard.writeText(ta.value);
      this.toast('📋', 'Skopiowano zapis', '', 'info');
    } catch {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try { document.execCommand('copy'); this.toast('📋', 'Skopiowano zapis', '', 'info'); } catch { this.toast('📋', 'Zaznacz i skopiuj ręcznie', '', 'info'); }
    }
  }

  showImport() {
    this.openModal(`
      <div class="hero">📥</div>
      <h2>Import zapisu</h2>
      <p>Wklej tekst z eksportu. Obecny postęp zostanie zastąpiony.</p>
      <textarea class="text-input" id="import-text" placeholder="Wklej zapis tutaj…"></textarea>
      <div class="actions">
        <button class="btn violet btn-wide" data-act="import-confirm">Wczytaj</button>
        <button class="btn ghost btn-wide" data-act="modal-close">Anuluj</button>
      </div>`);
  }

  doImport() {
    const text = ($('import-text')?.value || '').trim();
    if (!text) return;
    const ok = this.hooks.importSave?.(text);
    if (ok) {
      this.closeModal();
      this.scene.render(this.g, true);
      this.syncBubble();
      this.updateSoundBtn();
      this.updateAll(true);
      this.toast('✅', 'Zapis wczytany', '', 'info');
    } else {
      this.toast('❌', 'Nieprawidłowy zapis', 'Sprawdź, czy skopiowano cały tekst.', 'info');
    }
  }

  showInstallHelp() {
    this.openModal(`
      <div class="hero">📲</div>
      <h2>Gra na ekranie początkowym</h2>
      <ul>
        <li>Otwórz tę stronę w <b>Safari</b>.</li>
        <li>Stuknij <b>Udostępnij</b> (kwadrat ze strzałką).</li>
        <li>Wybierz <b>Do ekranu początk.</b> i potwierdź <b>Dodaj</b>.</li>
        <li>Uruchamiaj grę z ikony — działa na pełnym ekranie i bez internetu.</li>
      </ul>
      <p>Zapis jest przechowywany na urządzeniu. Raz na jakiś czas zrób eksport zapisu — na wszelki wypadek.</p>
      <div class="actions"><button class="btn violet btn-wide" data-act="modal-close">Rozumiem</button></div>`);
  }

  fullRender() {
    this.sigs = {};
    this.renderBuySegs();
    this.updateSoundBtn();
    this.scene.render(this.g, true);
    this.syncBubble();
    this.updateAll(true);
  }
}
