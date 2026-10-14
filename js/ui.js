// Interfejs: renderowanie zakładek, HUD, efekty kliknięć, modale i toasty.
import {
  PRODUCTS, DEPTS, TECHS, REPEAT_TECHS, ERAS, ACQUISITIONS, PERKS, CATEGORIES, BUBBLES, DEPT_MILESTONE_X, DEPT_MILESTONES,
} from './data.js';
import {
  ACHIEVEMENTS, UPGRADES, UPGRADE_MAP, PRODUCT_MAP, DEPT_MAP, TECH_MAP, ACH_BONUS, INVESTOR_BONUS,
  nextMilestone, prevMilestone, nextDeptMilestone, deptMilestoneMult, MAX_SLOTS,
} from './engine.js';
import { fmt, money, fmtInt, fmtTime, fmtClock, fmtPct, num } from './format.js';
import { t, noun, getLang, setLang, LANGS, DICT } from './i18n.js';
import * as TX from './text.js';
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
const COMPANY_TABS = ['investors', 'contracts', 'acq', 'ach', 'stats', 'settings'];
const DEPT_MS_PREV = [0, ...DEPT_MILESTONES];

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
    this.newsIdx = Math.floor(Math.random() * TX.newsList().length);
    this.tickerAnim = null;
    this.pendingNews = [];
  }

  init() {
    this.applyStatic();
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
    g.on('achievement', (a) => {
      this.toast(a.icon, t('ach.toast', { name: TX.achName(a) }), t('ach.toastText', { desc: TX.achDesc(a), p: Math.round(ACH_BONUS * 100) }), 'achievement');
      play('achievement');
    });
    g.on('bubble', () => this.syncBubble());
    g.on('trend', (tr) => { if (tr) this.pendingNews.push(`📈 <b>${esc(TX.trendText(tr))}</b>`); });
    g.on('contractOffer', () => { if (this.tab !== 'company') this.pendingNews.push(t('news.offer')); });
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
      case 'buy-all': { const n = g.buyAllUpgrades(); if (n) this.toast('⬆️', t('up.bought', { n, noun: noun('upgrades', n) }), '', 'info'); this.updateAll(true); break; }
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
          this.toast('🦄', t('toast.roundClosed', { n: fmt(gain) }), t('toast.roundClosedText', { x: fmt(g.m.invMult) }), 'achievement');
          this.hooks.save?.();
        }
        break;
      }
      case 'toggle-sound': s.settings.sound = !s.settings.sound; setSound(s.settings.sound); this.updateSoundBtn(); if (s.settings.sound) play('buy'); this.sigs.company = ''; this.updateAll(true); break;
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
        if (got || !a.hidden) this.toast(got ? a.icon : '🔒', TX.achName(a), TX.achDesc(a), got ? 'achievement' : 'info');
        else this.toast('❓', t('ach.hidden'), t('ach.hiddenText'), 'info');
        break;
      }
      case 'install-help': this.showInstallHelp(); break;
      default: break;
    }
  }

  buyAmount() { return this.g.s.settings.buyAmount || 1; }

  // Teksty zapisane na sztywno w index.html (zakładki, nagłówki, przycisk kodowania).
  applyStatic() {
    document.documentElement.lang = getLang();
    document.title = t('appName');
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  }

  changeLang(lang) {
    const s = this.g.s;
    const old = getLang();
    if (lang === old) return;
    // Domyślna nazwa firmy podąża za językiem, własna zostaje.
    if (s.companyName === DICT[old].defaultCompany) s.companyName = DICT[lang].defaultCompany;
    s.settings.lang = lang;
    setLang(lang);
    this.applyStatic();
    this.renderBuySegs();
    this.renderCompanyTabs();
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
    if (sub) { this.companySub = sub; this.renderCompanyTabs(); }
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

  renderCompanyTabs() {
    $('company-tabs').innerHTML = COMPANY_TABS.map((k) =>
      `<button class="pill ${k === this.companySub ? 'on' : ''}" data-act="company-sub" data-sub="${k}">${t(`ct.${k}`)}<i class="dot" data-dot="${k}" hidden></i></button>`).join('');
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
    const stage = TX.stageName(this.g.deptCount() - 1);
    return s.prestigeCount > 0 ? `${stage} · ${TX.roundName(s.prestigeCount - 1)}` : stage;
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
      left = `<div class="mini-stat">${t('off.firstStep')}<b>${t('off.collect', { v: money(PRODUCT_MAP.landing.cost) })}</b></div><button class="mini-btn" data-act="goto" data-tab="products">${t('off.toProducts')}</button>`;
    } else {
      left = `<div class="mini-stat">${t('off.team')}<b>${t('off.people', { n: fmtInt(g.totalHeads()) })}</b></div>`;
      if (g.rpRate > 0) left += `<div class="mini-stat">${t('off.research')}<b>${fmt(g.rpRate)} ${t('unit.rp')}/s</b></div>`;
      else left += `<div class="mini-stat">${t('off.products')}<b>${t('off.levels', { n: fmtInt(owned) })}</b></div>`;
    }
    let right = `<div class="mini-stat">${t('off.valuation')}<b>${money(g.valuation())}</b></div>`;
    const gain = g.prestigeGain();
    const offers = s.contracts.offers.length;
    if (gain >= 1 && gain >= Math.max(1, s.investors * 0.5)) {
      right += `<button class="mini-btn glow" data-act="goto" data-tab="company" data-sub="investors">💎 +${fmt(gain)}</button>`;
    } else if (g.contractsUnlocked() && offers > 0) {
      right += `<button class="mini-btn" data-act="goto" data-tab="company" data-sub="contracts">${t('off.offers', { n: offers })}</button>`;
    } else {
      right += `<div class="mini-stat">${t('off.coding')}<b>${money(g.clickValue)}</b></div>`;
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
      const news = TX.newsList();
      this.newsIdx = (this.newsIdx + 1 + Math.floor(Math.random() * 3)) % news.length;
      html = '📰 ' + esc(news[this.newsIdx]).replace(/\{c\}/g, `<b>${esc(this.g.s.companyName)}</b>`);
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
          <div class="card-title"><h3>${esc(TX.prodName(p.id))}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="inc"></div>
          <div class="card-desc">${esc(TX.prodDesc(p.id))}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="buy-product" data-id="${p.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      if (teaser) {
        const tech = TECH_MAP[teaser.tech];
        html += `
        <div class="card teaser locked">
          <div class="tile" style="${grad(CATEGORIES[teaser.cat].grad)}">${teaser.icon}</div>
          <div class="card-title"><h3>${esc(TX.prodName(teaser.id))}</h3><span class="lvl">🔒</span></div>
          <div class="card-sub">${t('prod.requires')} <span class="rp">${tech.icon} ${esc(TX.techName(tech.id))}</span></div>
          <div class="card-desc">${esc(TX.prodDesc(teaser.id))}</div>
          <div class="card-foot"><div class="prog"></div><button class="btn violet" data-act="goto" data-tab="research">${t('goResearch')}</button></div>
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
      this.setText(card.querySelector('[data-f="lvl"]'), t('prod.level', { n: fmtInt(lvl) }));
      const incEl = card.querySelector('[data-f="inc"]');
      const pct = share >= 0.995 ? '100%' : share >= 0.01 ? `${Math.round(share * 100)}%` : '<1%';
      const incHtml = lvl > 0 ? t('prod.income', { v: money(inc), p: pct }) : t('prod.notReleased');
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
      btn.classList.toggle('off', cost > s.cash || n < 1);
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
          <div class="card-title"><h3>${esc(TX.deptName(d.id))}</h3><span class="lvl" data-f="lvl"></span></div>
          <div class="card-sub" data-f="fx"></div>
          <div class="card-desc">${esc(TX.deptDesc(d.id))}</div>
          <div class="card-foot">
            <div class="prog"><div class="prog-bar"><i data-f="bar"></i></div><div class="prog-label" data-f="ms"></div></div>
            <button class="btn" data-act="hire" data-id="${d.id}"><span data-f="bn"></span><small data-f="cost"></small></button>
          </div>
        </div>`).join('');
      if (next) {
        const avail = g.deptAvailable(next.id);
        const tech = next.tech ? TECH_MAP[next.tech] : null;
        html += `
        <div class="card ${avail ? '' : 'locked'}" data-next="${next.id}">
          <div class="tile" style="${grad([next.color, '#2b2f5c'])}">${next.icon}</div>
          <div class="card-title"><h3>${esc(TX.deptName(next.id))}</h3><span class="lvl">${t('team.newFloor')}</span></div>
          <div class="card-sub">${avail ? t('team.openHint') : `${t('prod.requires')} <span class="rp">${tech.icon} ${esc(TX.techName(tech.id))}</span>`}</div>
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
      const d = DEPT_MAP[id];
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
        <div><div class="card-sub">${t('rs.points')}</div><div class="rp-big">${fmt(s.rp)} ${t('unit.rp')}</div></div>
        <div style="text-align:right"><div class="rp-rate">+${fmt(g.rpRate)} ${t('unit.rp')}/s</div><div class="card-sub">${t('rs.techCount', { n: g.techCount(), m: TECHS.length })}</div></div>
      </div>
      ${!s.deptUnlocked.rnd ? `<div class="hint" style="margin-top:10px">${t('rs.needRnd')}</div>`
    : `<div class="card-sub" style="margin:8px 2px 0">${t('rs.persist')}</div>`}`;
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
            <div class="fx">${esc(TX.describeFx(tech.fx))}</div>
            ${req}
            ${isAvail ? `<button class="btn violet" data-act="research" data-id="${tech.id}">${fmt(tech.cost)} ${t('unit.rp')}</button>` : ''}
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
            <button class="btn violet" data-act="research-repeat" data-id="${r.id}">${fmt(g.repeatCost(r.id))} ${t('unit.rp')}</button>
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
    if (u.kind === 'dept') return grad([DEPT_MAP[u.did].color, '#2b2f5c']);
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
          + ownedIds.map((id) => UPGRADE_MAP[id]).filter(Boolean).map((u) => `<span title="${esc(TX.upgradeName(u))}">${u.icon}</span>`).join('') + '</div>';
      }
      root.innerHTML = html;
    }
    let can = 0;
    for (const el of root.querySelectorAll('[data-uid]')) {
      const u = UPGRADE_MAP[el.dataset.uid];
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
    const sig = `inv|${JSON.stringify(s.perks)}|${s.prestigeCount}|${getLang()}`;
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
        <span>${t('inv.run')}</span><b data-v="run"></b>
        <span>${t('inv.total')}</span><b data-v="total"></b>
        <span>${t('inv.next')}</span><b data-v="next"></b>
        <span data-v="boardl">${t('inv.board')}</span><b data-v="board"></b>
      </div>
      <div style="margin-top:12px">
        <button class="btn gold btn-wide" data-act="prestige" data-v="pbtn">${t('inv.raise')}</button>
      </div>
      <p class="card-sub" style="margin:10px 2px">${t('inv.explain')}</p>
      <div class="section-title">${t('inv.boardTitle')} <span style="color:var(--gold)" data-v="shares"></span></div>
      <div class="list">
        ${PERKS.map((p) => {
    const lvl = s.perks[p.id] || 0;
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
      round: t('inv.nextRound', { r: TX.roundName(s.prestigeCount) }),
      gain: `+${fmt(gain)} 💎`,
      invsub: { html: `${t('inv.now', { n: fmt(s.investors), x: fmt(g.m.invMult) })}<br>${t('inv.perPoint', { p: num(per * 100) })}` },
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
      shares: t('inv.shares', { n: fmt(s.shares) }),
    };
    for (const p of PERKS) vals[`perk-${p.id}`] = { off: s.shares < g.perkCost(p.id) };
    this.patch(vals);
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
    this.setBody(`acq|${Object.keys(s.acquisitions).join(',')}|${getLang()}`, '<div class="list">' + ACQUISITIONS.map((a) => {
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
    for (const a of ACQUISITIONS) vals[`acq-${a.id}`] = { off: s.cash < g.acqCost(a.id) };
    this.patch(vals);
  }

  renderAch() {
    const g = this.g;
    const s = g.s;
    const count = g.achCount();
    const html = `<div class="kv"><span>${t('ach.count')}</span><b>${count}/${ACHIEVEMENTS.length}</b><span>${t('ach.bonus')}</span><b>+${Math.round(count * ACH_BONUS * 100)}%</b></div>
      <p class="card-sub" style="margin:10px 2px">${t('ach.tap')}</p>
      <div class="ach-grid">${ACHIEVEMENTS.map((a) => {
    const got = !!s.achievements[a.id];
    return `<button class="ach ${got ? 'got' : 'locked'}" data-act="ach-info" data-id="${a.id}">${got || !a.hidden ? a.icon : '❓'}</button>`;
  }).join('')}</div>`;
    this.setBody(`ach|${count}|${getLang()}`, html);
  }

  renderStats() {
    const g = this.g;
    const s = g.s;
    const st = s.stats;
    const row = (k, v) => `<span>${t(`st.${k}`)}</span><b>${v}</b>`;
    const html = `<div class="kv">
      ${row('income', `${money(g.income)}/s`)}
      ${row('maxIncome', `${money(st.maxIncome)}/s`)}
      ${row('click', money(g.clickValue))}
      ${row('auto', `${fmt(g.m.auto)}/s`)}
      ${row('total', money(s.totalEarned))}
      ${row('run', money(s.runEarned))}
      ${row('bestRun', money(Math.max(st.bestRun, s.runEarned)))}
      ${row('clicks', fmtInt(st.clicks))}
      ${row('staff', fmtInt(g.totalHeads()))}
      ${row('hired', fmtInt(st.hired))}
      ${row('upgrades', fmtInt(st.upgradesBought))}
      ${row('techs', `${g.techCount()}/${TECHS.length}`)}
      ${row('bubbles', fmtInt(st.bubbles))}
      ${row('contracts', fmtInt(st.contracts))}
      ${row('rounds', s.prestigeCount)}
      ${row('offlineCap', fmtTime(g.m.offlineCap))}
      ${row('offlineEff', `${Math.round(g.m.offlineEff * 100)}%`)}
      ${row('playTime', fmtTime(st.playTime))}
      ${row('founded', new Date(st.startedAt).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'pl-PL'))}
    </div>`;
    this.setBody(`stats|${Math.floor(Date.now() / 1000)}`, html);
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
        <div style="display:flex;gap:8px"><input class="text-input" id="rename-input" maxlength="28" value="${esc(s.companyName)}" enterkeyhint="done"><button class="btn btn-small violet" data-act="rename">${t('set.save')}</button></div>
      </div>
      <div class="section-title">${t('set.game')}</div>
      <div class="setting"><div>${t('set.lang')}<p>${t('set.langHint')}</p></div>${this.langSeg('set-lang')}</div>
      <div class="setting"><div>${t('set.sound')}<p>${t('set.soundHint')}</p></div><button class="switch ${s.settings.sound ? 'on' : ''}" data-act="toggle-sound" aria-label="${t('set.sound')}"></button></div>
      <div class="setting"><div>${t('set.install')}<p>${t('set.installHint')}</p></div><button class="btn btn-small ghost" data-act="install-help">${t('set.show')}</button></div>
      <div class="section-title">${t('set.saveTitle')}</div>
      <div class="setting"><div>${t('set.export')}<p>${t('set.exportHint')}</p></div><button class="btn btn-small ghost" data-act="export">${t('set.exportBtn')}</button></div>
      <div class="setting"><div>${t('set.import')}<p>${t('set.importHint')}</p></div><button class="btn btn-small ghost" data-act="import">${t('set.importBtn')}</button></div>
      <div class="setting"><div>${t('set.reset')}<p>${t('set.resetHint')}</p></div><button class="btn btn-small danger" data-act="reset">${t('set.resetBtn')}</button></div>
      <p class="card-sub" style="text-align:center;margin-top:18px">${esc(t('appName'))} · ${t('set.footer', { v: esc(this.hooks.version || '1.0') })}</p>`;
    this.setBody(`settings|${s.settings.sound}|${getLang()}`, html);
  }

  rename() {
    const v = ($('rename-input')?.value || '').trim();
    if (!v) return;
    const s = this.g.s;
    if (v !== s.companyName) {
      s.companyName = v.slice(0, 28);
      s.flags.renamed = true;
      this.scene.render(this.g, true);
      this.toast('🪪', t('toast.renamed'), s.companyName, 'info');
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

  showOffline(r) {
    if (!r || r.elapsed < 60 || !(r.cash > 0 || r.rp > 0)) return;
    this.openModal(`
      <div class="hero">🌙</div>
      <h2>${t('o.title')}</h2>
      <p style="text-align:center">${t('o.away', { t: fmtTime(r.elapsed) })}</p>
      <div class="big-money">+${money(r.cash)}</div>
      ${r.rp > 0 ? `<p style="text-align:center;color:var(--rp);font-weight:800;margin:6px 0">${t('o.rp', { v: fmt(r.rp) })}</p>` : ''}
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
      this.toast('💎', t('toast.tooEarly'), t('toast.tooEarlyText', { v: money(g.nextPrestigeAt()) }), 'info');
      return;
    }
    const per = INVESTOR_BONUS + g.m.investorPct;
    const after = 1 + (s.investors + gain) * per;
    this.openModal(`
      <div class="hero">🦄</div>
      <h2>${esc(t('p.title', { r: TX.roundName(s.prestigeCount) }))}</h2>
      <p style="text-align:center">${t('p.lead')}</p>
      <div class="big-money" style="color:var(--gold)">+${fmt(gain)} 💎</div>
      <p style="text-align:center">${t('p.gain', { a: fmt(g.m.invMult), b: fmt(after), n: fmt(gain) })}</p>
      <ul><li>${t('p.resets')}</li><li>${t('p.keeps')}</li></ul>
      <div class="actions">
        <button class="btn gold btn-wide" data-act="prestige-confirm">${t('p.confirm')}</button>
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
      this.fullRender();
      this.restartTicker();
      this.toast('✅', t('toast.imported'), '', 'info');
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
    this.renderBuySegs();
    this.updateSoundBtn();
    this.scene.render(this.g, true);
    this.syncBubble();
    this.updateAll(true);
  }
}
