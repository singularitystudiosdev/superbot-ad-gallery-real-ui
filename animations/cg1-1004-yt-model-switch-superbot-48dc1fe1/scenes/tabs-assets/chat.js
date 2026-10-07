// The one-ask chat. The ask ("Answer the top comments on my latest video and pin the best one") is typed into the
// composer and sent, and superbot hands each part of the job to the model built for it:
//   Gemini 3.1 Pro   watches the whole video and reads every comment (native video input, a 1M-token window)
//   GPT-6 Astra      zooms into the 4:38 frame Lena asked about and names the gear (crop-and-zoom image reasoning)
//   Claude Opus 5.5  writes the five replies in the creator's voice and picks the pin (long-form writing)
//   YouTube          the creator's own account, connected through Google's consent screen, posts, hearts and pins
// The thread is the desktop app's own (thread-ui.js, chat.css): one assistant turn headed "Replying · Ns", and per
// hand-off a pill ("Switching to X" -> "Switched to X", a service "Connecting to" -> "Connected to") with its nest:
// the who header, the step rows and the beat's details (beats/watch, frame, replies, studio). An older switch dims
// when the next one lands, as the app's depth styling does. In the zoom cut (default) every pill is the moment the
// camera pushes in on (scenes/tabs.js reads CAMERA below). The thread is bottom-anchored so every line rises out of
// the composer. renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, placeCursor, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { ZOOM } from './cut.js?v=48dc1fe1';
import { pillHtml, whoHtml, mountPill, renderPill, rise, RISE } from './thread-ui.js?v=48dc1fe1';
import watch from './beats/watch.js?v=48dc1fe1';
import frame from './beats/frame.js?v=48dc1fe1';
import replies from './beats/replies.js?v=48dc1fe1';
import studio from './beats/studio.js?v=48dc1fe1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const CAT = new URL('./mark-clean.svg', import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds); identical to the original spot's ----------
export const CHAT_T0 = 0.35;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 50; /* deliberate */ // one character every 0.02 s (63 characters land at 1.61)
const SEND = 0.17;                   // last character to the send press (1.78)
const FIRST_PILL = 0.2;              // send to the first pill landing (1.98)
// content-driven: each beat's times(r).end is its last visible change, and the next pill lands GAP after it
export const GAP = 0.2; /* deliberate */
// the camera move on every pill (scenes/tabs.js owns the move itself; these are its marks)
export const PUSH = 0.5; /* deliberate */ // push-in onto the pill
export const HOLD = 1.0; /* deliberate */ // parked on the pill, label still and legible
export const PULL = 0.5; /* deliberate */ // pull back to the thread while the reply starts
const CHECK = 0.45; /* deliberate */ // after the push lands, the spinner resolves to the check
const REPLY = 0.05;                  // pull-back start to the who header

// the one ask the whole spot is about
export const ASK = 'Answer the top comments on my latest video and pin the best one';

// the routed apps: display names exactly as superbot's model registry spells them, tiles the app's own tile art
// (superbot-desktop packages/ui/src/marks/tiles/{google,openai,anthropic}.png, youtube.png)
const APPS = {
  gemini: { name: 'Gemini 3.1 Pro', tile: brand('tile-google.png') },
  astra: { name: 'GPT-6 Astra', tile: brand('tile-openai.png') },
  opus: { name: 'Claude Opus 5.5', tile: brand('tile-anthropic.png') },
  studio: { name: 'YouTube', tile: brand('tile-youtube.png'), service: true },
  superbot: { name: 'superbot', tile: CAT },
};
const words = (a) => (a.service ? [`Connecting to ${a.name}`, `Connected to ${a.name}`] : [`Switching to ${a.name}`, `Switched to ${a.name}`]);

const step = (app, mods, opts = {}) => ({ app, mods, opts });
export const ROUTE = [
  step('gemini', [watch]),
  step('astra', [frame]),
  step('opus', [replies]),
  step('studio', [studio]),
];

// every step's clock (unchanged from the original): the ask types from CHAT_T0 and is sent; the first pill lands
// FIRST_PILL after the send and every later pill GAP after the previous step's last visible change. The camera
// pushes in, the check lands while it holds (a service's check waits for its consent: T.connected), the camera pulls
// back and the reply builds.
function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS;
  const send = typeEnd + SEND;
  const first = send + FIRST_PILL;
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { app: a.app, opts: a.opts };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    k.sw = prevEnd === null ? first : prevEnd + GAP;
    k.done = k.sw + PUSH + CHECK;     // the composer's model chip switches here
    let end;
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
    let r = k.reply;
    const opts = { ...a.opts, zoom: ZOOM };
    k.parts = a.mods.map((mod) => {
      const T = mod.times(r, opts);
      end = Math.max(end, T.end);
      r = (Number.isFinite(T.next) ? T.next : T.end) + GAP;
      return { mod, T };
    });
    const gate = k.parts.map(({ T }) => T.connected).find(Number.isFinite);
    k.check = gate ?? k.done;         // the pill's own spinner -> check
    k.end = end;
    prevEnd = end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;

// the marks scenes/tabs.js drives the camera from, one per pill (the node is filled in by mountChat)
export const CAMERA = ZOOM ? BEATS.map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null })) : [];
// beat-level camera moves: a beat whose times() carries T.focus and whose build() hands back a focus node
export const FOCUS = BEATS.flatMap(({ k }) => k.parts.filter(({ T }) => T.focus).map(({ T }) => ({ ...T.focus, T, fill: T.focus.fill || 0.9, node: null })));

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const CHEV_DOWN = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
// lucide audio-lines (voice mode), laptop (the machine chip) and square (the stop control), as the app draws them
const VOICE = '<svg viewBox="0 0 24 24"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>';
const LAPTOP = '<svg viewBox="0 0 24 24"><path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"/><path d="M20.054 15.987H3.946"/></svg>';
const STOP = '<svg class="qc-stop" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';

export function mountChat(hub) {
  // the pointer and any full-frame layer live in the scene's root (the section's px, the space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html, into = inner) => { const n = el(html); into.appendChild(n); return n; };
  const box = (n) => boxIn(n, root);
  const ctx = { hub, root, box, esc, el, brand, img };

  const date = add('<div class="sb-date">Oct 6</div>');
  const ub = add(`<div class="sb-ub">${esc(ASK)}</div>`);
  const turn = add('<div class="sb-turn"></div>');
  const head = add(`<div class="sb-head"><img src="${CAT}" alt=""/><span>Replying</span><b>· 1s</b></div>`, turn);

  const beats = BEATS.map(({ k }, i) => {
    const a = APPS[k.app];
    const sw = add(`<div class="sb-sw">${pillHtml(a.tile, words(a)[0])}<div class="sb-nest">${whoHtml(a.tile, a.name)}</div></div>`, turn);
    const pill = mountPill(sw.querySelector('.sb-pill'), words(a));
    const nest = sw.querySelector('.sb-nest');
    const who = nest.querySelector('.sb-who');
    if (CAMERA[i]) CAMERA[i].node = pill.node;
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, { ...ctx, app: a });
      inst.nodes.forEach((n) => nest.appendChild(n));
      if (inst.focus) { const f = FOCUS.find((m) => m.T === T); if (f) f.node = inst.focus; }
      return inst;
    });
    return { k, sw, pill, nest, who, insts };
  });
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = [
    [BEATS[0].k.send, ub],
    [BEATS[0].k.send + 0.1, head],
    ...beats.flatMap((b) => [[b.k.sw, b.pill.node], [b.k.reply, b.who], ...b.insts.flatMap((inst) => inst.marks)]),
  ].sort((x, y) => x[0] - y[0]);

  // the composer as the app draws it: the project / machine row above it, voice mode beside the screen button, the
  // send that turns into the stop square while the turn runs, the context meter and the disclaimer under it, and the
  // model chip that names whichever model a switch is routing to
  const composer = hub.querySelector('.composer');
  composer.insertBefore(el(`<div class="sb-ctx"><span>No project ${CHEV_DOWN}</span><span>${LAPTOP}This Mac ${CHEV_DOWN}</span></div>`), composer.firstChild);
  composer.appendChild(el('<div class="sb-meter"><span>Context <b>9k of 200k</b><i><u></u></i></span><span>superbot is AI and can make mistakes.</span></div>'));
  const computer = hub.querySelector('.rc-computer');
  if (computer) computer.after(el(`<span class="rc-voice">${VOICE}</span>`));
  hub.querySelector('.rc-send').insertAdjacentHTML('beforeend', STOP);
  const plat = hub.querySelector('.rc-plat');
  const pIcon = el(`<span class="qc-pi qc-cat"><img alt="" src="${CAT}"/></span>`);
  plat.querySelector('.rc-cat').replaceWith(pIcon);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el('<span>superbot</span>');
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, date, ub, head, headN: head.querySelector('b'), lastN: null, beats, scroll,
    plat, pIcon, pImg: pIcon.firstElementChild, pLabel,
    ph, send: hub.querySelector('.rc-send'), sup: hub.querySelector('.rc-super'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
}

function renderComposer(c, t) {
  const k0 = c.beats[0].k;
  let ph;
  const typing = t >= k0.s && t < k0.send;
  if (typing) {
    const n = streamCount(k0.ask, k0.s, TYPE_CPS, t);
    ph = `<span class="qc-typed">${esc(k0.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else if (t >= k0.send) ph = '<span class="qc-hint">Queues until this turn ends</span>';
  else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  const running = t >= k0.send;
  c.send.classList.toggle('qc-on', typing || running);
  c.send.classList.toggle('qc-run', running);
  c.sup.style.opacity = running ? '0.5' : '1';
  // the send press: a short eased dip, no overshoot
  const dip = Math.sin(Math.PI * seg(t, k0.send - 0.12, k0.send + 0.2));
  c.send.style.transform = dip > 0 && dip < 1 ? `scale(${(1 - 0.14 * dip).toFixed(4)})` : 'none';
}

// the model chip (composer.tsx switchTo): it names the model a switch routes to from the moment its pill lands until
// the next pill, and a service switch never sets it, so it reads superbot again once YouTube is connecting. Each
// change dips to 15% over 0.14 s, swaps, and pops back from 1.06.
function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.sw) { app = APPS[k.app].service ? 'superbot' : k.app; swap = k.sw; } });
  if (app !== c.lastApp) {
    const a = APPS[app];
    c.pImg.src = a.tile;
    c.pIcon.classList.toggle('qc-cat', app === 'superbot');
    c.pLabel.textContent = a.name;
    c.lastApp = app;
  }
  if (swap < 0) { c.plat.style.opacity = '1'; c.plat.style.transform = 'none'; return; }
  const out = seg(t, swap - 0.14, swap), back = seg(t, swap, swap + 0.14);
  c.plat.style.opacity = (t < swap ? lerp(1, 0.15, outCubic(out)) : lerp(0.15, 1, outCubic(back))).toFixed(3);
  const pop = outCubic(seg(t, swap, swap + 0.4));
  c.plat.style.transform = t >= swap && pop < 1 ? `scale(${lerp(1.06, 1, pop).toFixed(4)})` : 'none';
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.42)));
  }
  c.inner.style.transform = `translateY(${(viewH - 10 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  const k0 = c.beats[0].k;
  rise(c.date, t, k0.send, 6);
  rise(c.ub, t, k0.send);
  rise(c.head, t, k0.send + 0.1, 6);
  const n = `· ${Math.max(1, Math.ceil(t - k0.send))}s`;
  if (n !== c.lastN) { c.headN.textContent = n; c.lastN = n; }
  c.beats.forEach((b, i) => {
    const { k } = b;
    // an older switch steps back when the next pill lands (the app's depth styling)
    const next = c.beats[i + 1];
    const dim = next ? outCubic(seg(t, next.k.sw, next.k.sw + 0.3)) : 0;
    const p = rise(b.sw, t, k.sw);
    b.sw.style.opacity = (p * lerp(1, 0.5, dim)).toFixed(3);
    renderPill(b.pill, t, k.sw, k.check);
    rise(b.who, t, k.reply, 8);
    b.nest.style.setProperty('--rail', outCubic(seg(t, k.reply, k.reply + RISE)).toFixed(3));
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
