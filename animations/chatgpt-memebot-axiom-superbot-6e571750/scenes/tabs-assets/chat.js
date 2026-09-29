// The one-ask chat: "make me a memecoin trading bot" is typed into the composer and sent; superbot connects the
// user's Axiom account the way every-model-one-chat connects DoorDash (a "Connecting to Axiom" chip shimmers to a
// check, the composer's model chip swaps to Axiom), then answers as "Axiom in superbot" (./beats/memebot.js):
// the strategy backtest, a DeepSeek connect chip (raised by the beat through ctx.chip, routed via inst.routes),
// the ticker scan to a HIT, the trade on an Axiom token page, and the exit.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function
// of the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import memebot from './beats/memebot.js?v=5';
import V from '../../variant.js';

const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.1; // the empty state has settled; the ask starts typing

const APPS = {
  axiom: { name: 'Axiom', logo: img('axiom.png'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek', logo: img('deepseek.png'), sub: 'in superbot' },
};

const ASKS = [
  { mod: memebot, ask: V.ask, app: 'axiom', label: 'Connecting to Axiom' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after the reply
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.55, 0.15 + a.ask.length * 0.006);
    k.send = k.typeEnd + 0.1;
    k.sw = k.send + 0.35; // the connect chip lands
    k.swap = k.sw + 0.22; // the composer's model chip follows it to the app
    k.done = k.sw + 0.65; // spinner resolves to a check
    k.reply = k.done + 0.08;
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
})();
const LAST = BEATS[BEATS.length - 1].k;
export const CHAT_END = LAST.T.end + 0.2;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${APPS[app].logo}" alt=""/></span>`;

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
  // a connect chip a beat raises mid-answer (k: { sw, done }), drawn exactly like the ask's own
  const chip = (app, label, k) => {
    const node = el(`<div class="qc-chipline"><span class="qc-sw">${tile(app)}<span class="qc-swl">${esc(label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div>`);
    const s = { k, sw: node.firstElementChild, spin: node.querySelector('.qc-spin'), ok: node.querySelector('.qc-st .qc-ok') };
    return { node, render(t) { appear(node, t, k.sw, 8); renderSwitch(s, t); } };
  };
  const ctx = { hub, box, OK, esc, el, img, sbSrc, root, tile, chip };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const a = APPS[k.app];
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { k, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b><small>${a.sub}</small></div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sw, r, inst };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [[b.k.send, b.u], [b.k.sw, b.sw.w], [b.k.reply, b.r.querySelector('.qc-who')], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip: superbot, then the connected app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el(`<span class="qc-pi"><img alt="" src="${sbSrc}" data-app="superbot"/></span>`);
  if (cat) cat.replaceWith(pIcon); else plat.prepend(pIcon);
  [...plat.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => n.remove());
  const pLabel = el('<span class="qc-pl">superbot</span>');
  plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, feed, inner, beats, marks, ph, sbSrc, plat, pImg: pIcon.firstElementChild, pLabel,
    send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
  };
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

function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  const routes = c.beats.flatMap(({ k, inst }) => [k, ...(inst.routes || [])]).sort((x, y) => x.swap - y.swap);
  routes.forEach((r) => { if (t >= r.swap) { app = r.app; swap = r.swap; } });
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    c.pImg.src = app === 'superbot' ? c.sbSrc : APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = app === 'superbot' ? 'superbot' : APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.k;
  s.sw.classList.toggle('qc-done', t >= k.done);
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
  renderRouting(c, t);
  c.beats.forEach((b) => {
    appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b.sw, t);
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
}

export { img };
