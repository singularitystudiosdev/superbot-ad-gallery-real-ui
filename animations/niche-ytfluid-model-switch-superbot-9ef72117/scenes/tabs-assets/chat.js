// The one-ask chat. The ask ("Answer the top comments on my latest video and pin the best one") is typed into the
// composer and sent, and superbot hands each part of the job to the tool built for it:
//   1. YouTube Studio (platform): Google's consent popup, then the channel and its latest video (connect.js)
//   2. Gemini 3.1 Pro: native video understanding; watches the 14:32 video and ties each top comment to its moment
//      (watch.js)
//   3. Claude Opus 5.5: writing; drafts the four replies in the creator's voice and picks the pin (replies.js)
//   4. YouTube Studio again: the card opens to the full-frame Video comments page, the replies land, and superbot's
//      pointer pins Priya's comment from the More menu (studio.js; pinning has no Data API endpoint, so it is done
//      in the Studio UI)
// Every hand-off is ONE switch pill (logo tile, label, spinner that draws into a green check). The camera does not
// push in: the thread glides on one critically damped spring (motion.js follow), every arrival rises on the same
// spring, and the composer's model chip cross-fades and resizes on it too. Layout is static from the first frame
// (hidden rows keep their space, streamed text reserves its full length), so the glide never chases a moving target.
// renderChat(c, t) is a pure function of the scene's local time. ?v= busts GitHub Pages' module cache on republish.
import { esc, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { spring, smooth, follow, rise, lerp } from './motion.js?v=9ef72117';
import connect from './beats/connect.js?v=9ef72117';
import watch from './beats/watch.js?v=9ef72117';
import replies from './beats/replies.js?v=9ef72117';
import studio from './beats/studio.js?v=9ef72117';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.35;         // the hub has faded up; the ask starts typing
export const TYPE_CPS = 50;          // one character every 0.02 s
const SEND = 0.17;                   // last character to the send press
const FIRST_PILL = 0.3;              // send to the first pill (the composer has mostly settled by then)
export const GAP = 0.2;              // a step's last visible change to the next pill
const CHECK = 0.62;                  // a model pill: lands, spins, draws its check
const REPLY = 0.16;                  // the check to the routed app's first line

export const ASK = 'Answer the top comments on my latest video and pin the best one';

const APPS = {
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected' },
  gemini: { name: 'Gemini 3.1 Pro', logo: brand('gemini-logo.svg'), sub: 'watches the video' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'writes the replies' },
  superbot: { name: 'Superbot', logo: null, sub: '' },
};

const step = (app, mod, label) => ({ app, mod, label });
export const ROUTE = [
  step('studio', connect, 'Connecting to YouTube Studio'),
  step('gemini', watch, 'Switching to Gemini 3.1 Pro'),
  step('opus', replies, 'Switching to Claude Opus 5.5'),
  step('studio', studio, 'Switching to YouTube Studio'),
];

// each step's clock. A beat's times(sw, base) gets its pill's landing and the default check/reply marks, and
// returns { done, reply, end, ... } (connect.js holds its check until the consent is approved)
function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS;
  const send = typeEnd + SEND;
  let at = send + FIRST_PILL;
  return route.map((a, i) => {
    const sw = at;
    const base = { done: sw + CHECK, reply: sw + CHECK + REPLY };
    const T = { ...base, ...a.mod.times(sw, base) };
    const k = { app: a.app, label: a.label, mod: a.mod, sw, done: T.done, reply: T.reply, end: T.end, T };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    at = T.end + GAP;
    return k;
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].end;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// a node's top in `root`'s layout px, ignoring every transform (the glide must not chase a rising row)
export const layoutTop = (n, root) => { let y = 0, e = n; while (e && e !== root) { y += e.offsetTop; e = e.offsetParent; } return y; };

export function mountChat(hub) {
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
  const ctx = { hub, root, tile, OK, esc, el, brand, img, sbSrc, APPS };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map((k) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), tile: w.querySelector('.qc-sw .qc-tile'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b><small>${a.sub}</small></div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sw, r, who: main.firstElementChild, inst };
  });
  // glide marks: after each time, the fold settles on that node's bottom
  const marks = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    [b.k.sw, b.sw.w],
    [b.k.reply, b.who],
    ...b.inst.marks,
  ]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip: names the model and follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" data-app="superbot"/>');
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span class="qc-pl">${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, beats, marks, ys: null,
    plat, pIcon, pImg, pMark, pLabel, widths: null,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = streamCount(b.k.ask, b.k.s, TYPE_CPS, t);
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.3);
  const dip = at === undefined ? 0 : smooth(t, at - 0.1, at) * (1 - smooth(t, at, at + 0.26));
  c.send.style.transform = dip ? `scale(${(1 - 0.14 * dip).toFixed(4)})` : 'none';
}

// the chip's natural width per app, measured once fonts are in (layout px, unscaled)
function chipWidths(c) {
  if (c.widths && c.widths.ok) return c.widths;
  const keep = { src: c.pImg.src, app: c.pImg.dataset.app, txt: c.pLabel.textContent, d1: c.pImg.style.display, d2: c.pMark.style.display };
  c.plat.style.width = '';
  const w = { ok: !document.fonts || document.fonts.status === 'loaded' };
  for (const app of Object.keys(APPS)) {
    c.pLabel.textContent = APPS[app].name;
    c.pImg.dataset.app = app;
    c.pImg.style.display = app === 'superbot' ? 'none' : '';
    c.pMark.style.display = app === 'superbot' ? 'block' : 'none';
    w[app] = Math.ceil(parseFloat(getComputedStyle(c.plat).width) + 0.5);
  }
  Object.assign(c.pLabel, { textContent: keep.txt });
  c.pImg.dataset.app = keep.app; c.pImg.style.display = keep.d1; c.pMark.style.display = keep.d2;
  c.lastApp = null;
  c.widths = w;
  return w;
}

// the composer chip follows the routed model: its contents fade out, swap while invisible and fade back in, while the
// chip's width springs from the old name's width to the new one (the row never jumps)
function renderRouting(c, t) {
  const W = chipWidths(c);
  const swaps = c.beats.map(({ k }) => [k.done, k.app]);
  let app = 'superbot', at = -1;
  for (const [d, a] of swaps) if (t >= d) { app = a; at = d; }
  // the content dips 0.14 s either side of the swap
  const next = swaps.find(([d]) => d > t && d - t < 0.14);
  const out = next ? smooth(t, next[0] - 0.14, next[0]) : 0;
  const back = at < 0 ? 1 : smooth(t, at, at + 0.2);
  const shown = app;
  if (shown !== c.lastApp) {
    const isMark = shown === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[shown].logo;
    c.pImg.dataset.app = shown;
    c.pLabel.textContent = APPS[shown].name;
    c.lastApp = shown;
  }
  const o = Math.min(1 - out, back);
  c.pIcon.style.opacity = o.toFixed(3);
  c.pLabel.style.opacity = o.toFixed(3);
  // width: springs from the previous app's width to this one's, starting a beat before the swap
  const marks = [[-1, W.superbot]];
  for (const [d, a] of swaps) marks.push([d - 0.14, W[a]]);
  c.plat.style.width = follow(t, marks, 0.5).toFixed(2) + 'px';
}

// the pill: rises in, its tile springs up from 0.7, the spinner turns, then fades as the check draws itself
function renderSwitch(s, k, t) {
  rise(s.w, t, k.sw, 12, 0.6);
  const tp = spring(t, k.sw + 0.04, 0.5);
  s.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.7, 1, tp).toFixed(4)})`;
  const sp = 1 - smooth(t, k.done - 0.1, k.done + 0.08);
  s.spin.style.opacity = sp.toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 400).toFixed(1)}deg)`;
  const d = smooth(t, k.done - 0.02, k.done + 0.3);
  s.ok.style.opacity = d > 0 ? '1' : '0';
  s.ok.style.strokeDashoffset = (1 - d).toFixed(4);
}

// the thread glide: bottom-anchored like a live chat; the newest landed node's bottom sits just above the composer
function renderScroll(c, t) {
  const fontsIn = !document.fonts || document.fonts.status === 'loaded';
  if (!c.ys || !c.ys.ok) {
    c.ys = c.marks.map(([a, n]) => [a, layoutTop(n, c.inner) + n.offsetHeight]);
    c.ys.ok = fontsIn;
  }
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const y = follow(t, [[-1, 0], ...c.ys], 0.9);
  c.inner.style.transform = `translate3d(0,${(viewH - 10 - y).toFixed(2)}px,0)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) rise(b.u, t, b.k.send + 0.02, 16, 0.65);
    renderSwitch(b.sw, b.k, t);
    rise(b.r, t, b.k.reply, 12, 0.6);
    b.inst.render(t);
  });
  renderScroll(c, t);
}

// after the camera has been set for this frame: layers that measure the screen (the consent popup, the full-frame
// Studio) draw here, and the pointer goes wherever the active layer puts it
export function renderChatAfter(c, t) {
  if (!c) return;
  let pt = null;
  c.beats.forEach((b) => {
    if (b.inst.after) b.inst.after(t);
    const p = b.inst.pointer && b.inst.pointer(t);
    if (p && !pt) pt = p;
  });
  if (pt) {
    c.pointer.style.opacity = Math.max(0, Math.min(1, pt.v)).toFixed(3);
    // the 64 px arrow's tip sits at (10.7, 6.7) of its box (style.css .cursor, viewBox 24)
    c.pointer.style.transform = `translate3d(${(pt.x - 10.7).toFixed(1)}px,${(pt.y - 6.7).toFixed(1)}px,0) scale(${(1 - 0.12 * (pt.p || 0)).toFixed(3)})`;
  } else c.pointer.style.opacity = '0';
}
