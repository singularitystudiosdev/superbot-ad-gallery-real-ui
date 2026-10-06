// The three-request chat, one model per request, with a canvas beside the thread. Each ask is typed into the
// composer and sent, superbot routes it to the model built for what the ask makes (the switch pill names the model
// and why), and the routed model answers in the thread with a short line plus an artifact chip, while its full
// output builds in the canvas pane on the right (one tab per answer). Beats live in ./beats/*.66f654f1.js; each
// returns its thread nodes and its canvas pane. The thread is bottom-anchored so every message rises out of the
// composer. renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import meme from './beats/meme.66f654f1.js?v=1';
import finds from './beats/finds.66f654f1.js?v=1';
import order from './beats/order.66f654f1.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

const APPS = {
  auto: { name: 'superbot', logo: null, sub: '' },
  nano: { name: 'Nano Banana Pro', logo: brand('gemini-logo.svg'), sub: 'Gemini 3 Pro Image · in superbot' },
  haiku: { name: 'Claude Haiku 4.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: 'agent · uses your apps' },
};
const isMark = (app) => !APPS[app].logo;

// each ask goes to the model built for what it makes; the pill's tag says why
const ASKS = [
  { app: 'nano', mod: meme, why: 'best at text inside images', ask: 'make me a muse meme' },
  { app: 'haiku', mod: finds, why: 'reads every image, fast', ask: 'Scrape reddit and look for more' },
  { app: 'superbot', mod: order, why: 'can use DoorDash for you', ask: 'Winning, order me a burger.' },
];

// every beat's clock, laid end to end from CHAT_T0 (same spacing as the source spot, so the runtime matches)
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
    k.send = k.typeEnd + 0.15;
    k.sw = k.send + 0.35;     // the routing pill lands
    k.swap = k.sw + 0.22;     // the composer's model chip follows
    k.done = k.sw + 0.65;     // the pill resolves
    k.reply = k.done + 0.08;  // the model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(ASKS);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;
// the canvas column opens as the first switch resolves (tabs.js animates the split)
export const CV_OPEN = BEATS[0].k.done - 0.3;
export const CV_OPEN_DUR = 0.75;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const ICON = {
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  panel: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
};

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${isMark(app) ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  // the canvas: a tab bar (one tab per answer), the active model's by-line, and the stacked panes
  const cv = el(`<aside class="cv"><div class="cv-panel">
    <div class="cv-bar"><div class="cv-tabs"></div><div class="cv-bys"></div>
      <div class="cv-acts"><i>${ICON.copy}</i><i>${ICON.down}</i><i>${ICON.share}</i><i class="cv-sep"></i><i>${ICON.panel}</i></div></div>
    <div class="cv-body"></div>
  </div></aside>`);
  hub.appendChild(cv);
  const cvTabs = cv.querySelector('.cv-tabs'), cvBys = cv.querySelector('.cv-bys'), cvBody = cv.querySelector('.cv-body');

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc, ICON };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl"><span class="qc-swv">Switching to</span> ${esc(a.name)}</span><span class="qc-for">${esc(k.why)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), verb: w.querySelector('.qc-swv'), why: w.querySelector('.qc-for'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${esc(a.name)}</b>${a.sub ? `<small>${esc(a.sub)}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    // its canvas tab, by-line and pane
    const tab = el(`<span class="cv-tab">${tile(k.app, 'cv-tt')}<span>${esc(inst.cv.tab)}</span></span>`);
    const by = el(`<span class="cv-by">${tile(k.app, 'cv-bt')}<span>Made by <b>${esc(a.name)}</b></span></span>`);
    cvTabs.appendChild(tab); cvBys.appendChild(by); cvBody.appendChild(inst.cv.pane);
    return { k, u, sw, r, who: main.firstElementChild, inst, tab, by, pane: inst.cv.pane, at: inst.cv.at };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [[b.k.send, b.u], [b.k.sw, b.sw.w], [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip starts on superbot (the app's default) and follows each switch
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" src="" data-app="auto"/>');
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  pImg.style.display = 'none'; pMark.style.display = 'block';
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.auto.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, cv,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'auto',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'auto', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.swap) { app = k.app; swap = k.swap; } });
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const mark = isMark(app);
    c.pImg.style.display = mark ? 'none' : '';
    c.pMark.style.display = mark ? 'block' : 'none';
    if (!mark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(b, t) {
  const k = b.k, s = b.sw;
  const done = t >= k.done;
  s.sw.classList.toggle('qc-done', done);
  const verb = done ? 'Switched to' : 'Switching to';
  if (s.verb.textContent !== verb) s.verb.textContent = verb;
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
  // the reason tag slides out of the pill once the model is named
  const wp = outCubic(seg(t, k.sw + 0.2, k.sw + 0.55));
  s.why.style.opacity = wp.toFixed(3);
  s.why.style.transform = wp >= 1 ? 'none' : `translateX(${((1 - wp) * -8).toFixed(2)}px)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

// the canvas: the newest answer's pane slides in over the last one, its tab lights, the by-line follows
function renderCanvas(c, t) {
  let cur = -1;
  c.beats.forEach((b, i) => { if (t >= b.at) cur = i; });
  c.beats.forEach((b, i) => {
    const inP = outCubic(seg(t, b.at, b.at + 0.5));
    const next = c.beats[i + 1];
    const outP = next ? outCubic(seg(t, next.at, next.at + 0.4)) : 0;
    const vis = i <= cur ? inP * (1 - outP) : 0;
    b.pane.style.opacity = vis.toFixed(3);
    b.pane.style.visibility = vis > 0.001 ? 'visible' : 'hidden';
    const x = (1 - inP) * 28 - outP * 28;
    b.pane.style.transform = Math.abs(x) < 0.01 ? 'none' : `translateX(${x.toFixed(2)}px)`;
    const tabIn = outBack(seg(t, b.at - 0.05, b.at + 0.35));
    b.tab.style.opacity = Math.min(1, tabIn).toFixed(3);
    b.tab.style.transform = tabIn >= 1 ? 'none' : `scale(${lerp(0.7, 1, tabIn).toFixed(4)})`;
    b.tab.style.display = t >= b.at - 0.05 ? '' : 'none';
    b.tab.classList.toggle('on', i === cur);
    b.by.style.opacity = vis.toFixed(3);
    b.inst.ref && b.inst.ref.classList.toggle('on', i === cur);
  });
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b, t);
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  renderCanvas(c, t);
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
