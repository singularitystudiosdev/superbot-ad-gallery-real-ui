// The seven-request chat, all superbot: each ask is typed into the composer and sent, and superbot answers it
// itself with its own inline work card (./beats/*.js). Nothing routes anywhere: there is no switching row, and the
// composer's model chip reads "superbot" the whole time. The thread is bottom-anchored so every message rises out
// of the composer. renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts
// GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, inOutCubic, esc, boxIn } from '../../lib.js';
import wsb from './beats/wsb.js?v=1';
import backtest from './beats/backtest.js?v=1';
import alert from './beats/alert.js?v=1';
import paper from './beats/paper.js?v=1';
import status from './beats/status.js?v=1';
import dd from './beats/dd.js?v=1';
import dinner from './beats/dinner.js?v=1';

const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.9; // the empty state has settled; the first ask starts typing

const ASKS = [
  { mod: wsb, ask: 'What’s WSB buzzing about today?' },
  { mod: backtest, ask: 'Backtest buying the top WSB ticker at open and selling at close, last 90 days' },
  { mod: alert, ask: 'Turn that into an alert that texts me at 9:25 every morning' },
  { mod: paper, ask: 'Paper trade it for two weeks' },
  { mod: status, ask: 'How’s it doing?' },
  { mod: dd, ask: 'Write the DD post so WSB can roast it' },
  { mod: dinner, ask: 'Order a steak dinner, the bot earned it' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after the send
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(1.25, 0.25 + a.ask.length * 0.014);
    k.send = k.typeEnd + 0.22;
    k.reply = k.send + 0.42; // superbot answers in place
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
})();
const LAST = BEATS[BEATS.length - 1].k;
export const CHAT_END = LAST.T.end + 0.2;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

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
  const ctx = { hub, box, OK, esc, el, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, r, inst };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [[b.k.send, b.u], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip: superbot, start to finish
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
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
}

export { img };
