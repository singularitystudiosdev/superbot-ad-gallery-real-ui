// The eight-request chat, WSB to wings. Each ask is typed into the composer and sent, superbot routes it (its
// "Switching to <app>" chip resolves to "Switched to <app>", and the composer's platform chip follows the app), and
// the routed app answers with its own beat (./beats/*.js). The thread is bottom-anchored so every message rises out
// of the composer. renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts
// GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import wsbHot from './beats/wsb-hot.js?v=1';
import tradingview from './beats/tradingview.js?v=1';
import polymarket from './beats/polymarket.js?v=1';
import rhOrder from './beats/rh-order.js?v=1';
import sheets from './beats/sheets.js?v=1';
import rhPerf from './beats/rh-perf.js?v=1';
import redditGain from './beats/reddit-gain.js?v=1';
import doordash from './beats/doordash.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  reddit: { name: 'Reddit', logo: brand('reddit-logo.svg'), sub: 'u/sam' },
  tradingview: { name: 'TradingView', logo: brand('tradingview-icon.svg'), sub: 'NYSE:GME' },
  polymarket: { name: 'Polymarket', logo: brand('polymarket-icon.svg'), sub: 'live odds' },
  robinhood: { name: 'Robinhood', logo: brand('robinhood-logo.svg'), sub: 'individual account' },
  sheets: { name: 'Google Sheets', logo: brand('google-sheets-logo.svg'), sub: 'Trade Journal' },
  doordash: { name: 'DoorDash', logo: brand('doordash-logo.svg'), sub: 'connected' },
};

// verb: the routing chip while it spins; it reads `${past} ${name}` once it resolves
const ASKS = [
  { app: 'reddit', mod: wsbHot, verb: 'Switching to', past: 'Switched to', ask: 'What’s WSB losing its mind over today?' },
  { app: 'tradingview', mod: tradingview, verb: 'Switching to', past: 'Switched to', ask: 'Chart GME on TradingView and mark the insider buys' },
  { app: 'polymarket', mod: polymarket, verb: 'Switching to', past: 'Switched to', ask: 'What are the odds the Fed hikes again in October?' },
  { app: 'robinhood', mod: rhOrder, verb: 'Switching to', past: 'Switched to', ask: 'Ok. Put $250 into GME, limit at yesterday’s close' },
  { app: 'sheets', mod: sheets, verb: 'Switching to', past: 'Switched to', ask: 'Log it in my trade sheet' },
  { app: 'robinhood', mod: rhPerf, verb: 'Switching back to', past: 'Switched back to', ask: 'How’s it doing?' },
  { app: 'reddit', mod: redditGain, verb: 'Switching to', past: 'Switched to', ask: 'Post the gain on WSB, flair it Gain' },
  { app: 'doordash', mod: doordash, verb: 'Switching to', past: 'Switched to', ask: 'Tendies are on me. Order wings on DoorDash' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(1.3, 0.2 + a.ask.length * 0.022);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.4;    // superbot's routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.2;         // superbot carries on without being asked
    }
    k.swap = k.sw + 0.22;     // the platform chip moves to the app
    k.done = k.sw + 0.65;     // the chip resolves
    k.reply = k.done + 0.08;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
})();
const LAST = BEATS[BEATS.length - 1].k;
export const CHAT_END = LAST.T.end + 0.3;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${app === 'superbot' ? sbSrc : APPS[app].logo}" alt=""/></span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${k.verb} ${a.name}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, w, r, who: main.firstElementChild, inst, sw: w.querySelector('.qc-sw'), swl: w.querySelector('.qc-swl'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), [b.k.sw, b.w], [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  pIcon.appendChild(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, marks, plat, pImg, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.swap) { app = k.app; swap = k.swap; } });
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(b, t) {
  const { k } = b;
  b.sw.classList.toggle('qc-done', t >= k.done);
  const lab = `${t >= k.done ? k.past : k.verb} ${APPS[k.app].name}`;
  if (b.swl.textContent !== lab) b.swl.textContent = lab;
  b.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  b.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  b.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  b.ok.style.opacity = o.toFixed(3);
  b.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  b.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.marks) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    appear(b.w, t, b.k.sw);
    appear(b.r, t, b.k.reply);
    renderSwitch(b, t);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
