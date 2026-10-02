// chat3d.js — the 3D cut of chat.js (every-model-one-chat-3d). Same three-request chat and same copy, with the
// stage given to the routing chip: the model tile spins in on its own axis and the platform chip swaps in the
// longer window that opens. Message entrances carry a small 3D pop, and the thread reads its scroll position and
// its camera targets from LAYOUT OFFSETS (offsetTop chains) rather than getBoundingClientRect, so the scene can
// put a perspective + rotated camera above it without distorting the geometry or flushing layout every frame.
// The three-request chat, one model per request. Each ask is typed into the composer and sent, superbot routes it
// (its routing chips and the composer's platform chip follow the model), and the routed model answers with its own
// beat (./beats/*.js). The burger ask has three routings (ROUTES), one per published ad: ?route= picks it (the
// gallery lists each as its own spot). The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the scene's
// local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import gemini from './beats/gemini.js?v=1';
import scrape from './beats/scrape.js?v=2';
import doordash from './beats/doordash.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
  doordash: { name: 'DoorDash', logo: brand('doordash-logo.svg'), sub: 'in superbot' },
};

// the burger ask's routing variants: which chips land, in order, and who answers
export const ROUTES = {
  doordash: { chips: [['doordash', 'Connecting to DoorDash']], who: 'doordash' },
  superbot: { chips: [['superbot', 'Switched to Superbot']], who: 'superbot' },
  combo: { chips: [['superbot', 'Switched to Superbot'], ['doordash', 'Connected to DoorDash']], who: 'doordash' },
};
export const ROUTE = (() => { const r = new URLSearchParams(location.search).get('route'); return ROUTES[r] ? r : 'doordash'; })();

const BASE = [
  { app: 'gemini', mod: gemini, chips: [['gemini', 'Switching to Gemini']], ask: 'make me a muse meme' },
  { app: 'deepseek', mod: scrape, chips: [['deepseek', 'Switching to DeepSeek V4 Flash']], ask: 'Scrape reddit and look for more' },
];
const burger = (r) => ({ app: ROUTES[r].who, mod: doordash, chips: ROUTES[r].chips, ask: 'Winning, order me a burger.' });

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.35;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.2;         // superbot carries on without being asked
    }
    // each chip lands, its model tile spins in, the platform chip swaps (swap +-0.22 is its dip) and resolves (done);
    // the next chip opens only after the previous dip has closed, so a swap is never cut short
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.34, done: at + 1.05 }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats([...BASE, burger(ROUTE)]);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  const c = {
    hub, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
    site: hub.closest('.sbsite'), hero: null, composer: hub.querySelector('.composer'), scrollY: 0,
  };
  c.cues = cuesOf(c);
  return c;
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  // the message rises out of the composer and grows 3% into place: the same entrance, one more axis of depth
  n.style.transform = p >= 1 ? 'none'
    : `translate3d(${((1 - p) * -6).toFixed(2)}px, ${((1 - p) * dy).toFixed(2)}px, 0) scale(${lerp(0.965, 1, p).toFixed(4)})`;
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
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  // the model tile spins in on the y axis and lands with an overshoot; the chip glows when its route resolves
  const tp = seg(t, k.sw, k.sw + 0.62);
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none'
    : `perspective(420px) rotateY(${((1 - outQuint(tp)) * 320).toFixed(1)}deg) scale(${lerp(0.32, 1, outBack(tp)).toFixed(3)})`;
  s.sw.style.setProperty('--punch', bump(seg(t, k.done - 0.02, k.done + 0.34)).toFixed(3));
}

// the y of a node in the feed, in layout px, from offsets only (no rect, so a rotated camera above cannot lie to it)
function bottomIn(c, n) {
  let y = 0;
  for (let p = n; p && p !== c.inner; p = p.offsetParent) y += p.offsetTop;
  return y + n.offsetHeight;
}

// where the feed's fold will be at time t: the same bottom-anchored glide renderScroll plays, resolved for any t.
// tabs.js reads it to aim the camera at where a node WILL be when its cue fires (pointOf's scroll override).
export function feedScrollAt(c, t) {
  // the feed's inner height is read once (a per-frame getComputedStyle flushes style + layout after every write above)
  if (c.viewH === undefined) {
    const cs = getComputedStyle(c.feed);
    c.viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  }
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottomIn(c, n), inOutCubic(seg(t, a, a + 0.45)));
  }
  return c.viewH - 8 - y;
}

function renderScroll(c, t) {
  c.scrollY = feedScrollAt(c, t);
  c.inner.style.transform = `translateY(${c.scrollY.toFixed(2)}px)`;
}

// ---------- the camera's targets ----------
// A point in the hub's own px (the space .sbsite is laid out in), read from offsets: the camera keys follow these
// so a dolly lands on a chip, a meme or the order pill at every aspect ratio and while the thread is scrolling.
export function pointOf(c, node, scroll) {
  if (!node) return null;
  let x = 0, y = 0, inFeed = false;
  for (let p = node; p && p !== c.site; p = p.offsetParent) { x += p.offsetLeft; y += p.offsetTop; }
  for (let p = node; p && p !== c.site; p = p.offsetParent) if (p === c.inner) inFeed = true;
  // `scroll` overrides the live feed offset: the camera aims at where a node will be when its cue fires, not where
  // it is on the frame the key table is built. Omit it for the live position.
  const sc = inFeed ? (scroll === undefined ? (c.scrollY || 0) : scroll) : 0;
  return { x: x + node.offsetWidth / 2, y: y + sc + node.offsetHeight / 2, w: node.offsetWidth, h: node.offsetHeight, top: y + sc, inFeed };
}

// Every moment the camera has a reason to move, in scene-local seconds: the ask lands, the chip, the model reply,
// and whatever the beat itself marks (its card, its pill, its sweep). tabs.js turns these into camera keys.
export function cuesOf(c) {
  return c.beats.flatMap((b) => [
    ...(b.u ? [{ t: b.k.send, node: b.u, kind: 'ask' }] : []),
    ...b.sws.map((s) => ({ t: s.c.sw, node: s.w, kind: 'chip' })),
    { t: b.k.reply, node: b.r, kind: 'reply' },
    ...b.inst.marks.map(([t, node]) => ({ t, node, kind: 'beat' })),
  ]).sort((a, b) => a.t - b.t);
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
