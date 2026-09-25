// The four-request chat the hub plays once the main frame has landed. Each ask is typed into the composer and sent,
// superbot routes it (its routing chip, the rail selection and the composer's platform chip all follow the app), and
// the routed app answers with its own beat (./beats/*.js). The whole window stays in frame (no camera moves); the
// thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the tabs scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import gemini from './beats/gemini.js?v=6';
import cursor from './beats/cursor.js?v=6';
import doordash from './beats/doordash.js?v=6';
import mp3 from './beats/mp3.js?v=6';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 7.75; // the hub has landed (tabs T.msg = 7.62); its welcome line is hidden (chat.css)

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  cursor: { name: 'Cursor', logo: brand('cursor-logo.svg'), sub: 'in superbot' },
  doordash: { name: 'DoorDash', logo: brand('doordash-logo.svg'), sub: 'connected' },
  superbot: { name: 'superbot', logo: null, sub: '' },
};
const MODS = { gemini, cursor, doordash, superbot: mp3 };

const ASKS = [
  { app: 'gemini', verb: 'Switching to', ask: 'make me a muse meme' },
  { app: 'cursor', verb: 'Switching to', ask: 'ok now write me a script that uploads that to all my twitters' },
  { app: 'doordash', verb: 'Connecting to', ask: 'ok now im hungry' },
  { app: 'superbot', verb: 'Switching to', ask: 'ok now download me 100 mp3 files of copyrighted songs from youtube' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
    k.send = k.typeEnd + 0.15;
    k.sw = k.send + 0.35;     // superbot's routing chip lands
    k.swap = k.sw + 0.22;     // rail + platform chip move to the app
    k.done = k.sw + 0.65;     // the chip resolves
    k.reply = k.done + 0.08;  // the app answers
    k.T = MODS[a.app].times(k.reply);
    s = k.T.end;
    return k;
  });
})();
const LAST = BEATS[BEATS.length - 1];
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
  const beats = BEATS.map((k) => {
    const a = APPS[k.app];
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${k.verb} ${a.name}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = MODS[k.app].build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, w, r, who: main.firstElementChild, inst, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [[b.k.send, b.u], [b.k.sw, b.w], [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // DoorDash is not on the rail yet: superbot connects it, so its tile grows into the rail at that beat
  const rail = hub.querySelector('.rail');
  const dd = el(`<span class="rail-item qc-rail-dd" data-app="doordash"><img src="${APPS.doordash.logo}" alt=""/><i class="dot"></i></span>`);
  const divs = rail.querySelectorAll('.rail-div');
  rail.insertBefore(dd, divs[divs.length - 1]);

  // the composer's platform chip follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  pIcon.appendChild(cat);
  const pImg = el('<img alt=""/>');
  pIcon.appendChild(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${label ? label.textContent.trim() : 'superbot'}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const railItems = { superbot: hub.querySelector('.rail-item.sb'), gemini: rail.querySelector('.rail-item[data-app="gemini"]'), cursor: rail.querySelector('.rail-item[data-app="cursor"]'), doordash: dd };
  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, marks, dd, railItems, plat, cat, pImg, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
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
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.swap) { app = k.app; swap = k.swap; } });
  Object.entries(c.railItems).forEach(([id, n]) => {
    if (!n) return;
    n.classList.toggle('sel', id === app);
    if (t < CHAT_T0 || id === 'doordash') return;
    const s = id === app ? 1 + 0.16 * bump(seg(t, swap, swap + 0.45)) : 1;
    n.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
  });
  // the DoorDash tile grows into the rail as superbot connects it
  const ddk = c.beats.find(({ k }) => k.app === 'doordash').k;
  const g = seg(t, ddk.sw, ddk.sw + 0.5);
  c.dd.style.height = `${(44 * outCubic(g)).toFixed(2)}px`;
  c.dd.style.marginTop = `${(-4 * (1 - outCubic(g))).toFixed(2)}px`;
  c.dd.style.opacity = outCubic(g).toFixed(3);
  const pop = app === 'doordash' ? 1 + 0.16 * bump(seg(t, swap, swap + 0.45)) : 1;
  c.dd.style.transform = `scale(${(lerp(0.4, 1, outBack(g)) * pop).toFixed(4)})`;
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    c.cat.style.display = app === 'superbot' ? '' : 'none';
    c.pImg.style.display = app === 'superbot' ? 'none' : '';
    if (app !== 'superbot') { c.pImg.src = APPS[app].logo; c.pImg.dataset.app = app; }
    c.pLabel.textContent = app === 'superbot' ? 'superbot' : APPS[app].name.toLowerCase();
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
}

function renderSwitch(b, t) {
  const { k } = b;
  b.sw.classList.toggle('qc-done', t >= k.done);
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
    appear(b.u, t, b.k.send);
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

