// Nazwy i opisy elementów gry w bieżącym języku (PL z data.js, EN z lang/en.js).
import {
  PRODUCTS, DEPTS, TECHS, REPEAT_TECHS, CULTURE_UPGRADES, CLICK_UPGRADES, ACQUISITIONS, PERKS, ERAS,
  CATEGORIES, BUBBLES, ROUND_NAMES, COMPANY_STAGES, NEWS, TREND_TEMPLATES, CONTRACT_CLIENTS, CONTRACT_TASKS,
  PRODUCT_UP_NAMED, AUTOPILOT, CHALLENGES, SCALE_LEVELS, DECISIONS, OFFICES, COMPETITORS, MARKET_NEWS,
} from './data.js';
import { EN } from './lang/en.js';
import { getLang, t, noun } from './i18n.js';
import { fmt, fmtInt, money, num, fmtTime } from './format.js';

const en = () => getLang() === 'en';
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const P = byId(PRODUCTS);
const D = byId(DEPTS);
const T = byId(TECHS);
const R = byId(REPEAT_TECHS);
const CU = byId(CULTURE_UPGRADES);
const CL = byId(CLICK_UPGRADES);
const A = byId(ACQUISITIONS);
const PK = byId(PERKS);
const AP = byId(AUTOPILOT);
const CH = byId(CHALLENGES);
const OF = byId(OFFICES);
const CO = byId(COMPETITORS);

export const prodName = (id) => (en() ? EN.products[id].name : P[id].name);
export const prodDesc = (id) => (en() ? EN.products[id].desc : P[id].desc);
export const deptName = (id) => (en() ? EN.depts[id].name : D[id].name);
export const deptDesc = (id) => (en() ? EN.depts[id].desc : D[id].desc);
export const techName = (id) => (en() ? EN.techs[id].name : T[id].name);
export const techDesc = (id) => (en() ? EN.techs[id].desc : T[id].desc);
export const repeatName = (id) => (en() ? EN.repeat[id].name : R[id].name);
export const repeatDesc = (id) => (en() ? EN.repeat[id].desc : R[id].desc);
export const acqName = (id) => (en() ? EN.acquisitions[id].name : A[id].name);
export const acqDesc = (id) => (en() ? EN.acquisitions[id].desc : A[id].desc);
export const perkName = (id) => (en() ? EN.perks[id].name : PK[id].name);
export const perkDesc = (id) => (en() ? EN.perks[id].desc : PK[id].desc);
export const catName = (cat) => (en() ? EN.categories[cat] : CATEGORIES[cat].name);
export const bubbleName = (type) => (en() ? EN.bubbles[type] : BUBBLES[type].name);
export const eraName = (id) => (en() ? EN.eras[id] : ERAS.find((e) => e.id === id).name);
export const newsList = () => (en() ? EN.news : NEWS);
export const compName = (id) => (en() ? EN.competitors[id].name : CO[id].name);
export const compTicker = (id) => (en() ? EN.competitors[id].ticker : CO[id].ticker);
export function marketNewsText(n, seed = 0) {
  const pool = (en() ? EN.marketNews : MARKET_NEWS)[n.d > 0 ? 'up' : 'down'];
  return pool[seed % pool.length].replace('{n}', compName(n.id)).replace('{p}', Math.round(Math.abs(n.d) * 100));
}
// Symbol giełdowy własnej firmy: pierwsze litery nazwy, bez polskich znaków.
export function ownTicker(name) {
  const plain = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
  const words = plain.toUpperCase().replace(/[^A-Z ]/g, '').split(' ').filter(Boolean);
  if (!words.length) return 'CO';
  if (words.length >= 3) return words.map((w) => w[0]).join('').slice(0, 4);
  return (words[0].slice(0, 3) + (words[1] ? words[1][0] : words[0].slice(3, 4))).slice(0, 4);
}
export const officeName = (id) => (en() ? EN.offices[id].name : OF[id].name);
export const officeDesc = (id) => (en() ? EN.offices[id].desc : OF[id].desc);
export const apName = (id) => (en() ? EN.autopilot[id].name : AP[id].name);
export const apDesc = (id) => (en() ? EN.autopilot[id].desc : AP[id].desc);
export const challengeName = (id) => (en() ? EN.challenges[id].name : CH[id].name);
export const challengeDesc = (id) => (en() ? EN.challenges[id].desc : CH[id].desc);
export const scaleName = (i) => (en() ? EN.scale[i].name : SCALE_LEVELS[i].name);
export const scaleDesc = (i) => (en() ? EN.scale[i].desc : SCALE_LEVELS[i].desc);
export const decisionTitle = (i) => (en() ? EN.decisions[i].title : DECISIONS[i].title);
export const decisionText = (i) => (en() ? EN.decisions[i].text : DECISIONS[i].text);
export const decisionLabel = (i, which) => (en() ? EN.decisions[i][which] : DECISIONS[i][which].label);

// Opis efektu decyzji (po przeliczeniu przez silnik: cash/rp/x/s).
export function decisionEffectText(e) {
  switch (e.t) {
    case 'cash': return t('de.cash', { v: money(e.cash) });
    case 'rp': return t('de.rp', { v: fmt(e.rp) });
    case 'delayed': return t('de.delayed', { v: money(e.cash), t: fmtTime(e.s) });
    case 'boost': return t('de.boost', { x: num(e.x), t: fmtTime(e.s) });
    case 'click': return t('de.click', { x: num(e.x), t: fmtTime(e.s) });
    case 'rpBoost': return t('de.rpBoost', { x: num(e.x), t: fmtTime(e.s) });
    default: return '';
  }
}

export function roundName(count) {
  const arr = en() ? EN.rounds : ROUND_NAMES;
  if (count < arr.length) return arr[count];
  return (en() ? EN.roundN : 'Runda #{n}').replace('{n}', count + 1);
}

export function stageName(floors) {
  let idx = 0;
  COMPANY_STAGES.forEach((st, i) => { if (floors >= st.floors) idx = i; });
  return en() ? EN.stages[idx] : COMPANY_STAGES[idx].name;
}

export function trendText(trend) {
  if (!trend) return '';
  const tpls = en() ? EN.trends : TREND_TEMPLATES;
  const tpl = tpls[(trend.tpl || 0) % tpls.length];
  return tpl.replace('{p}', prodName(trend.pid)).replace('{x}', num(trend.x));
}

// Kontrakty zapisują indeksy klienta i zadania; starsze zapisy miały gotowy tekst.
export function clientName(o) {
  if (o.ci !== undefined) return en() ? EN.clients[o.ci] : CONTRACT_CLIENTS[o.ci][0];
  return o.client || '';
}
export function taskName(o) {
  if (o.ti !== undefined) return en() ? EN.tasks[o.ti] : CONTRACT_TASKS[o.ti];
  return o.task || '';
}

// ---------- ulepszenia ----------
export function upgradeName(u) {
  switch (u.kind) {
    case 'product':
      if (u.tier >= PRODUCT_UP_NAMED) return t('up.tiers')[u.tier - PRODUCT_UP_NAMED].replace('{p}', prodName(u.pid));
      return en() ? EN.products[u.pid].ups[u.tier] : P[u.pid].ups[u.tier];
    case 'dept': {
      const named = D[u.did].ups.length;
      if (u.tier >= named) return t('up.deptTiers')[u.tier - named].replace('{d}', deptName(u.did));
      return en() ? EN.depts[u.did].ups[u.tier] : D[u.did].ups[u.tier];
    }
    case 'culture': return en() ? EN.culture[u.id].name : CU[u.id].name;
    case 'click': return en() ? EN.click[u.id].name : CL[u.id].name;
    default: return u.id;
  }
}

export function upgradeDesc(u) {
  switch (u.kind) {
    case 'product': return t('up.prodDesc', { name: prodName(u.pid), x: num(u.fx[0].x) });
    case 'dept': return t('up.deptDesc', { name: deptName(u.did), x: num(u.fx[0].x) });
    case 'culture': return t('up.cultureDesc', { desc: en() ? EN.culture[u.id].desc : CU[u.id].desc, x: num(u.fx[0].x) });
    case 'click': {
      const c = CL[u.id];
      const parts = [];
      if (c.x > 1) parts.push(t('up.clickX', { x: num(c.x) }));
      if (c.pct) parts.push(t('up.clickPct', { p: num(c.pct * 100) }));
      return `${en() ? EN.click[u.id].desc : c.desc} (${parts.join(', ')})`;
    }
    default: return '';
  }
}

// ---------- osiągnięcia ----------
export function achName(a) {
  if (a.type === 'fun') return t(`achFun.${a.id}`)[0];
  if (a.type === 'prod') return `${prodName(a.pid)}: ${t('achNames.prod')[a.i]}`;
  if (a.type === 'scale') return scaleName(a.i);
  return t(`achNames.${a.type}`)[a.i];
}

export function achDesc(a) {
  const v = a.v;
  switch (a.type) {
    case 'fun': return t(`achFun.${a.id}`)[1];
    case 'earn': return t('ach.earn', { v: money(v) });
    case 'inc': return t('ach.inc', { v: money(v) });
    case 'click': return t('ach.click', { n: fmt(v) });
    case 'prod': return t('ach.prod', { n: v, p: prodName(a.pid) });
    case 'emp': return t('ach.emp', { n: fmtInt(v), noun: noun('people', v) });
    case 'dept': return t('ach.dept', { n: v, noun: noun('depts', v) });
    case 'tech': return t('ach.tech', { n: v, noun: noun('techs', v) });
    case 'upg': return t('ach.upg', { n: v, noun: noun('upgrades', v) });
    case 'pres': return t('ach.pres', { n: v, noun: noun('rounds', v) });
    case 'inv': return t('ach.inv', { n: fmt(v) });
    case 'bub': return t('ach.bub', { n: fmtInt(v), noun: noun('events', v) });
    case 'con': return t('ach.con', { n: fmtInt(v), noun: noun('contracts', v) });
    case 'acq': return t('ach.acq', { n: v, noun: noun('companies', v) });
    case 'chal': return t('ach.chal', { n: v, noun: noun('tiers', v) });
    case 'dec': return t('ach.dec', { n: v, noun: noun('decisions', v) });
    case 'ap': return t('ach.ap', { n: v, noun: noun('modules', v) });
    case 'off': return t('ach.off', { n: v, noun: noun('offices', v) });
    case 'spc': return t('ach.spc', { n: v, noun: noun('offices', v) });
    case 'ctl': return t('ach.ctl', { n: v, noun: noun('companies', v) });
    case 'mkt': return t('ach.mktDesc')[a.i];
    case 'scale': return t('ach.scale', { name: scaleName(a.i) });
    default: return '';
  }
}

// ---------- efekty technologii, przejęć itp. ----------
export function describeFx(fx) {
  const parts = [];
  for (const e of fx) {
    const x = e.x !== undefined ? num(e.x) : '';
    switch (e.t) {
      case 'prod': parts.push(t('dfx.prod', { name: prodName(e.id), x })); break;
      case 'cat': parts.push(t('dfx.cat', { c: catName(e.cat), x })); break;
      case 'dept': parts.push(t('dfx.dept', { d: deptName(e.id), x })); break;
      case 'deptAll': parts.push(t('dfx.deptAll', { x })); break;
      case 'all': parts.push(t('dfx.all', { x })); break;
      case 'click': parts.push(t('dfx.click', { x })); break;
      case 'clickPct': parts.push(t('dfx.clickPct', { p: num(e.v * 100) })); break;
      case 'rp': parts.push(t('dfx.rp', { x })); break;
      case 'hireCost': parts.push(t('dfx.hireCost', { n: Math.round((1 - e.x) * 100) })); break;
      case 'prodCost': parts.push(t('dfx.prodCost', { n: Math.round((1 - e.x) * 100) })); break;
      case 'eventFreq': parts.push(t('dfx.eventFreq', { x })); break;
      case 'auto': parts.push(t('dfx.auto', { n: e.v })); break;
      case 'unlockProduct': parts.push(t('dfx.unlockProduct', { name: prodName(e.id) })); break;
      case 'unlockDept': parts.push(t('dfx.unlockDept', { name: deptName(e.id) })); break;
      case 'investorPct': parts.push(t('dfx.investorPct', { p: num(e.v * 100) })); break;
      case 'prestige': parts.push(t('dfx.prestige', { x })); break;
      case 'contract': parts.push(t('dfx.contract', { x })); break;
      case 'offlineCap': parts.push(t('dfx.offlineCap', { t: fmtTime(e.v) })); break;
      case 'offlineEff': parts.push(t('dfx.offlineEff', { p: num(e.v * 100) })); break;
      case 'acqCost': parts.push(t('dfx.acqCost', { n: Math.round((1 - e.x) * 100) })); break;
      case 'eventPower': parts.push(t('dfx.eventPower', { x })); break;
      case 'valMult': parts.push(t('dfx.valMult', { v: num(e.v) })); break;
      default: break;
    }
  }
  return parts.join(' · ');
}
