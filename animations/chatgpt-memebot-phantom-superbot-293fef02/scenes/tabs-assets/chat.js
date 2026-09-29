// The two-ask chat. Ask 1 ("make me a memecoin trading bot"): superbot connects the user's Phantom wallet with the
// same shimmering routing chip the DoorDash ad uses ("Connecting to Phantom", spinner -> check), then answers with
// ./beats/memebot.js (backtest card, buy-scan card, summary). Ask 2 ("Look's good, let's do it"): ./beats/trade.js
// trades live in the Phantom wallet and zooms that wallet out of the thread to fill the frame as the balance climbs.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function
// of the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import memebot from './beats/memebot.js?v=1';
import trade from './beats/trade.js?v=1';

const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.1; // the empty state has settled; the ask starts typing

const ASKS = [
  { mod: memebot, ask: 'make me a memecoin trading bot', chips: [['phantom', 'Connecting to Phantom']] },
  { mod: trade, ask: "Look's good, let's do it", chips: [], hold: 0.75 }, // hold: the go-ahead stays readable before the wallet opens
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after the reply
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.9, 0.2 + a.ask.length * 0.025);
    k.send = k.typeEnd + 0.1;
    let at = k.send + 0.35;
    k.chipT = a.chips.map(([app, label]) => { const c = { app, label, sw: at, done: at + 1.0 }; at = c.done + 0.12; return c; });
    k.reply = k.chipT.length ? at + 0.1 : k.send + (a.hold || 0.22);
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
})();
const LAST = BEATS[BEATS.length - 1].k;
export const CHAT_END = LAST.T.end + 0.2;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const APPS = { phantom: { logo: brand('phantom-logo.svg'), name: 'Phantom' } };
const tile = (app) => `<span class="qc-tile qc-t-${app}"><img src="${APPS[app].logo}" alt=""/></span>`;

export function mountChat(hub) {
  const root = hub.closest('.sbsite').parentNode;
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  // root = the scene's own box (.ask-root): trade.js appends its full-frame wallet here, outside the scaled hub
  const ctx = { hub, box, OK, esc, el, img, brand, sbSrc, root, tile };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const sws = k.chipT.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), lbl: w.querySelector('.qc-swl'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, inst };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [[b.k.send, b.u], ...b.sws.map((s) => [s.c.sw, s.w]), ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip: superbot, start to finish (Phantom is the account it trades in, not the model)
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el(`<span class="qc-pi"><img alt="" src="${sbSrc}" data-app="superbot"/></span>`);
  if (cat) cat.replaceWith(pIcon); else plat.prepend(pIcon);
  [...plat.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => n.remove());
  plat.insertBefore(el('<span class="qc-pl">superbot</span>'), pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return { hub, feed, inner, beats, marks, ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null };
}

function appear(n, t, a, dy = 12) {
  const p = outCubic(seg(t, a, a + 0.45));
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

// the DoorDash ad's routing chip: the tile pops in, the label shimmers while it connects, then a green check
function renderSwitch(s, t) {
  const k = s.c;
  const done = t >= k.done;
  s.sw.classList.toggle('qc-done', done);
  const label = done ? `Connected to ${APPS[k.app].name}` : k.label;
  if (s.lbl.textContent !== label) s.lbl.textContent = label;
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.marks) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.55)));
  }
  c.inner.style.transform = `translateY(${(viewH - 10 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  c.beats.forEach((b) => {
    appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
}

export { img };
