// The merch-drop chain. One ask ("Everyone keeps asking for merch. Make it and sell it under my videos.") is typed into
// the composer and sent; the thread glides into the left third of the frame and superbot's workspace panel opens on
// the right (ws.ec83e5dd.js). superbot then hands the job down a six-link chain, each link the tool that really does that
// part of the job, in this order:
//   DeepSeek V4 Pro  searches and scrapes what other models decline: 3,912 comments without the API, 6 rival stores
//   Blender 5.2      models the 11 oz mug (lathe + subdivision), renders it in Cycles, exports mug.glb
//   Nano Banana Pro  (Gemini 3 Pro Image) generates 4 print designs, prints #1 onto the Blender render, makes a desk shot
//   Claude Opus 5.5  writes the store (Next.js, three.js mug viewer, Stripe checkout) and deploys sam.shop
//   ElevenLabs v3    voices the shoutout for the Short
//   YouTube Studio   posts the Short with the mug tagged; the spot ends full frame on the Short playing on YouTube
// Every hand-off is ONE switch pill in the thread (the real hub's "Switching to X" pill: tile, label, spinner that
// resolves to a green check). The camera never pushes in on a pill in this cut: the pill lands in the thread while
// the workspace swaps to that tool, and the tool's own output builds there, large. The thread gets one short line and
// the output file's chip per hand-off.
// Each beat module: times(done) -> { end } (end = its last visible change), build(k, ctx) -> { ws (the workspace body),
// head (the header's status line), say, chips, out (the strip's output label), render(t), pointer?(t), full? }.
// renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, placeCursor, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { mountWorkspace, renderWorkspace } from './ws.ec83e5dd.js?v=4c9f9a65';
import deepseek from './beats/deepseek.ec83e5dd.js?v=4c9f9a65';
import blender from './beats/blender.ec83e5dd.js?v=4c9f9a65';
import gemini from './beats/gemini.ec83e5dd.js?v=4c9f9a65';
import opus from './beats/opus.ec83e5dd.js?v=4c9f9a65';
import eleven from './beats/eleven.ec83e5dd.js?v=4c9f9a65';
import youtube from './beats/youtube.ec83e5dd.js?v=4c9f9a65';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.35;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 50; /* deliberate */ // one character every 0.02 s
const SEND = 0.17;                   // last character to the send press
export const SPLIT = 0.55;           // on send the hub glides left and the workspace opens (tabs.js owns the move)
const FIRST_PILL = 0.42;             // send to the first pill: the split has settled and the plan strip has drawn
export const GAP = 0.2; /* deliberate */ // a link's last visible change to the next pill
const CHECK = 0.45; /* deliberate */ // a pill's spinner resolving to the check; the tool starts working here
const REPLY = 0.1;                   // the check to the tool's line in the thread
const SAY_CPS = 80;                  // the thread line streams in
const APPEAR = 0.3;                  // a message rising out of the composer

export const ASK = 'Everyone keeps asking for merch. Make it and sell it under my videos.';

export const APPS = {
  deepseek: { name: 'DeepSeek V4 Pro', logo: brand('deepseek-logo.svg'), sub: 'in superbot', pill: 'Switching to DeepSeek V4 Pro' },
  blender: { name: 'Blender 5.2', logo: brand('blender-logo.svg'), sub: 'connected', pill: 'Connecting to Blender' },
  gemini: { name: 'Nano Banana Pro', logo: brand('gemini-logo.svg'), sub: 'Gemini 3 Pro Image', pill: 'Switching to Nano Banana Pro' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot', pill: 'Switching to Claude Opus 5.5' },
  eleven: { name: 'ElevenLabs v3', logo: brand('elevenlabs-logo.svg'), sub: 'connected', pill: 'Switching to ElevenLabs v3' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected', pill: 'Connecting to YouTube Studio' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm)
};

// the chain, in order: the app that answers and the beat module that plays its work
export const ROUTE = [
  { app: 'deepseek', mod: deepseek },
  { app: 'blender', mod: blender },
  { app: 'gemini', mod: gemini },
  { app: 'opus', mod: opus },
  { app: 'eleven', mod: eleven },
  { app: 'studio', mod: youtube },
];

function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS;
  const send = typeEnd + SEND;
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { i, app: a.app, mod: a.mod, label: APPS[a.app].pill };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    k.sw = prevEnd === null ? send + FIRST_PILL : prevEnd + GAP; // the pill lands, the workspace swaps to the tool
    k.done = k.sw + CHECK;                                         // spinner -> check; the tool starts
    k.reply = k.done + REPLY;                                      // its line in the thread
    k.T = a.mod.times(k.done);
    k.end = k.T.end;
    prevEnd = k.end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const SEND_AT = BEATS[0].k.send;
export const CHAT_END = BEATS[BEATS.length - 1].k.end;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub, wsHost) {
  // the pointer and the full-frame layer live in the scene's root (the section's px, the space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, root, box, tile, OK, esc, el, brand, img, sbSrc, APPS };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    const inst = k.mod.build(k, ctx);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div><div class="qc-say"></div><div class="qc-files">${inst.chips.map((c) => `<span class="qc-file">${c}</span>`).join('')}</div></div></div>`);
    return { k, u, sw, r, who: r.querySelector('.qc-who'), say: r.querySelector('.qc-say'), files: r.querySelector('.qc-files'), lastSay: -1, inst };
  });
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    [b.k.sw, b.sw.w],
    [b.k.reply, b.r],
  ]).sort((x, y) => x[0] - y[0]);

  const ws = mountWorkspace(wsHost, beats, ctx);
  beats.forEach((b) => { if (b.inst.full) root.appendChild(b.inst.full); });
  root.appendChild(pointer);

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
    hub, root, pointer, feed, inner, beats, scroll, ws,
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + APPEAR));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
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
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  const dip = at === undefined ? 0 : Math.sin(Math.PI * seg(t, at - 0.12, at + 0.2));
  c.send.style.transform = dip ? `scale(${(1 - 0.16 * dip).toFixed(4)})` : 'none';
}

function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.done) { app = k.app; swap = k.done; } });
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * Math.sin(Math.PI * seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
}

// the pill lands with its tile, the spinner turns, and resolves to the green check. The label never changes.
function renderSwitch(s, k, t) {
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = outCubic(seg(t, k.done, k.done + 0.2));
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
  const tp = outCubic(seg(t, k.sw + 0.05, k.sw + 0.3));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
}

// the tool's thread line streams in, then its output chips pop in one after another
function renderSay(b, t) {
  const text = b.inst.say;
  const n = t < b.k.reply ? 0 : streamCount(text, b.k.reply + 0.05, SAY_CPS, t);
  if (n !== b.lastSay) {
    b.say.innerHTML = `${esc(text.slice(0, n))}<span class="qc-hid">${esc(text.slice(n))}</span>`;
    b.lastSay = n;
  }
  const at = b.k.reply + 0.05 + text.length / SAY_CPS;
  [...b.files.children].forEach((f, i) => {
    const p = outCubic(seg(t, at + i * 0.1, at + i * 0.1 + 0.25));
    f.style.opacity = p.toFixed(3);
    f.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.85, 1, p).toFixed(4)})`;
  });
}

// a new conversation fills from the top, as it does in the hub; once the thread is taller than the view, each new
// message glides the fold up to its own bottom edge
function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, Math.max(0, bottom(n) - viewH + 8), inOutCubic(seg(t, a, a + 0.3)));
  }
  c.inner.style.transform = y ? `translateY(${(-y).toFixed(2)}px)` : 'none';
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    renderSay(b, t);
  });
  renderScroll(c, t);
}

// after the camera has been set: the workspace and every beat draw (some measure the screen), then the pointer
export function renderChatAfter(c, t) {
  if (!c) return;
  renderWorkspace(c.ws, t);
  c.beats.forEach((b) => b.inst.render(t));
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
