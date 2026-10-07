// The one-ask chat. The ask ("Answer the top comments on my latest video and pin the best one") is typed into the
// composer and sent, and superbot routes each part of the job to what is built for it:
//   1. YouTube        connect.js  Google's consent for the one scope replies need (youtube.force-ssl)
//   2. Gemini 3.8 Flash gemini.js  watches the video natively (YouTube URL in, timestamps out), reads all 1,284
//                                  comments in one context, ranks them, and boxes the boom arm in the 4:38 frame
//   3. Claude Opus 5.5 claude.js   writes the four replies in Sam's voice and picks the pin
//   4. YouTube Studio  studio.js   replies post through the Data API; hearts and the pin have no API, so superbot does
//                                  them on the video's own Comments page (the only page that offers Pin)
// Every hand-off is ONE switch pill (the real hub's pill: logo tile, label, spinner resolving to a green check). In the
// zoom cut (default) the camera eases in on each pill and back out (scenes/tabs.js reads CAMERA); in ?cut=nozoom it
// never moves. renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outQuart, inOutCubic, inOutSine, esc, boxIn, placeCursor, streamCount, rise } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { ZOOM } from './cut.js?v=88a89e94';
import connect from './beats/connect.js?v=88a89e94';
import gemini from './beats/gemini.js?v=88a89e94';
import claude from './beats/claude.js?v=88a89e94';
import studio from './beats/studio.js?v=88a89e94';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.45;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 46;          // a steady typist: 63 characters in 1.37 s
const SEND = 0.2;                    // last character to the send press
const FIRST_PILL = 0.3;              // send to the first pill (the composer is still gliding down under it)
export const GAP = 0.2; /* deliberate */ // the user: "it should be like 0.2"
// the camera on every pill (scenes/tabs.js owns the move; these are its marks): symmetric ease in, hold, ease out
export const PUSH = 0.6;             // ease in onto the pill
export const HOLD = 0.85; /* deliberate */ // parked on the pill, label legible (the brief asks >= 0.8 s)
export const PULL = 0.6;             // ease back out while the reply starts
const CHECK = 0.4;                   // the push has landed to the spinner resolving
const REPLY = 0.1;                   // pull-back start to the routed app's answer
const APPEAR = 0.45;                 // a message rising out of the composer (outQuart)
const SCROLL = 0.65;                 // the thread's glide to a new bottom (inOutSine)

export const ASK = 'Answer the top comments on my latest video and pin the best one';

// who answers each hand-off, and in two or three words why it is the one answering
const APPS = {
  youtube: { name: 'YouTube', logo: brand('youtube-icon.svg'), sub: 'connect your channel' },
  gemini: { name: 'Gemini 3.8 Flash', logo: brand('gemini-logo.svg'), sub: 'native video understanding' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'writes in your voice' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'hearts and pins live here' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm)
};
const CHIP = {
  youtube: 'Connecting YouTube',
  gemini: 'Switching to Gemini 3.8 Flash',
  opus: 'Switching to Claude Opus 5.5',
  studio: 'Opening YouTube Studio',
};

const step = (app, mods, opts = {}) => ({ app, mods, opts, label: CHIP[app] });
export const ROUTE = [
  step('youtube', [connect], { noPill: true }), // a connection, not a model: no switch pill, the chip stays superbot
  step('gemini', [gemini]),
  step('opus', [claude]),
  step('studio', [studio]),
];

// every step's clock: the first pill lands FIRST_PILL after the send, every later one GAP after the previous step's
// last visible change. Each beat module's times(r, opts) owns everything after its start and reports end.
function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS;
  const send = typeEnd + SEND;
  const first = send + FIRST_PILL;
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { app: a.app, opts: a.opts, label: a.label };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    const at = prevEnd === null ? first : prevEnd + GAP;
    k.noPill = !!a.opts.noPill;
    let end;
    if (k.noPill) {
      k.reply = at;
      end = k.reply;
    } else {
      k.sw = at;
      k.done = k.sw + PUSH + CHECK;
      if (ZOOM) {
        k.landed = k.sw + PUSH;
        k.pull = k.landed + HOLD;
        k.back = k.pull + PULL;
        k.reply = k.pull + REPLY;
        end = k.back;
      } else {
        k.reply = k.done + GAP;
        end = k.reply;
      }
    }
    let r = k.reply;
    const opts = { ...a.opts, zoom: ZOOM };
    k.parts = a.mods.map((mod) => {
      const T = mod.times(r, opts);
      end = Math.max(end, T.end);
      r = (Number.isFinite(T.next) ? T.next : T.end) + GAP;
      return { mod, T };
    });
    k.end = end;
    prevEnd = end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;
export const CAMERA = ZOOM ? BEATS.filter(({ k }) => !k.noPill).map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null })) : [];
export const FOCUS = [];

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

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

  const box = (n) => boxIn(n, root);
  const ctx = { hub, root, box, tile, OK, esc, el, brand, img, sbSrc, pointer };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  let cam = 0;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar qc-me"><img src="${img('av-sam.jpg')}" alt=""/></span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    let sw = null;
    if (!k.noPill) {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
      if (CAMERA[cam]) CAMERA[cam++].node = sw.sw;
    }
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      return inst;
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the thread's bottom glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    ...(b.sw ? [[b.k.sw, b.sw.w]] : []),
    [b.k.reply, b.who],
    ...b.insts.flatMap((inst) => inst.marks),
  ]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" data-app="superbot"/>');
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, beats, scroll,
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
}

const appear = (n, t, a) => rise(n, outQuart(seg(t, a, a + APPEAR)), 12);

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = streamCount(b.k.ask, b.k.s, TYPE_CPS, t);
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.24);
  const dip = at === undefined ? 0 : Math.sin(Math.PI * seg(t, at - 0.12, at + 0.24));
  c.send.style.transform = dip ? `scale(${(1 - 0.14 * dip).toFixed(4)})` : 'none';
}

// the composer chip follows the active model: a soft cross-dip, the swap at its lowest point
function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (!k.noPill && t >= k.done) { app = k.app; swap = k.done; } });
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.9 * Math.sin(Math.PI * seg(t, swap - 0.18, swap + 0.18))).toFixed(3);
}

// the pill: its tile settles in, the spinner turns while the camera eases in, and resolves to the check while it holds
function renderSwitch(s, k, t) {
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.1, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 380).toFixed(1)}deg)`;
  const o = outQuart(seg(t, k.done, k.done + 0.28));
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.5, 1, o).toFixed(4)})`;
  const tp = outQuart(seg(t, k.sw + 0.04, k.sw + 0.4));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.7, 1, tp).toFixed(4)})`;
}

// bottom-anchored like a live chat. Each mark adds its rise as an eased increment, so overlapping glides sum into one
// continuous move instead of restarting
function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0, prev = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    const b = bottom(n);
    y += (b - prev) * inOutSine(seg(t, a, a + SCROLL));
    prev = b;
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    if (b.sw) { appear(b.sw.w, t, b.k.sw); renderSwitch(b.sw, b.k, t); }
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderScroll(c, t);
  const pt = c.beats.flatMap((b) => b.insts).map((inst) => inst.pointer && inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}

// after the camera has been set for this frame: beats that measure the screen (studio.js's full-frame layer) draw here
export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
