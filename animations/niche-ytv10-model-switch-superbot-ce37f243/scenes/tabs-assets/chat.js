// niche-ytv10 (forked from niche-youtube-model-switch-superbot-3828921d): the same one-ask chat, retimed CALM and
// starting after the BEFORE (beats/before.js: the pile of unanswered comments in the superbot-framed Studio page),
// so the chat's clock opens at BEFORE_END. Every hand-off holds longer (the pill and its check hold >= 1.3 s before
// the beat starts, each beat holds >= 2.0 s after its last element lands) and the camera eases slower (scenes/tabs.js).
// Policy guard (X Ads deceptive content): after the send the composer's send arrow fades out and its other controls
// dim, so nothing button-shaped is held on screen.
//
// The one-ask chat. The ask ("Answer the top comments on my latest video and pin the best one") is typed into the
// composer and sent, and superbot hands the job from model to model: Gemini, GPT-6 Astra, Claude Opus 5.5, then
// YouTube Studio itself. Every hand-off is ONE switch pill (the real hub's "Switching to X" pill: logo tile, label,
// spinner that resolves to a green check). In the zoom cut (default) every pill is the moment the camera pushes in on
// (scenes/tabs.js reads CAMERA below); in the nozoom cut (?cut=nozoom, cut.js) the camera never moves and each reply
// starts GAP after its pill's check. The routed model then answers with its own beat: watch.js (Gemini watches the
// video and ranks the top 5 of 1,284 comments), frame.js (GPT-6 Astra reads the 4:38 frame Lena asked about, a real
// photo), replies.js (Opus writes the five replies in the creator's voice and decides the pin; the camera holds on
// Priya's reply) and studio.js (the checklist, then the card opened to the AFTER: the same superbot-framed Studio page,
// every top comment answered, Priya's pinned, the calm read and the superbot lock-up beside it).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, placeCursor, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { ZOOM } from './cut.js?v=ce37f243';
import { BEFORE_END } from './beats/before.js?v=ce37f243';
import watch from './beats/watch.js?v=ce37f243';
import frame from './beats/frame.js?v=ce37f243';
import replies from './beats/replies.js?v=ce37f243';
import studio from './beats/studio.js?v=ce37f243';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const HUB_IN = BEFORE_END - 0.15; // the hub's greeting fades up as the backdrop lifts (the page has gone)
export const CHAT_T0 = BEFORE_END + 0.3; // the greeting is up; the ask starts typing
export const TYPE_CPS = 48; /* deliberate */ // a touch slower than the base's 50 cps typewriter
const SEND = 0.2;                    // last character to the send press
const FIRST_PILL = 0.3;              // send to the first pill landing
// the schedule is content-driven: each beat's times(r).end is its last visible change, and the next thing (the next
// pill, or the next beat under the same pill) starts GAP after it
export const GAP = 0.2; /* deliberate */ // the user: "it should be like 0.2"
// the camera move on every pill (scenes/tabs.js owns the move itself; these are its marks), 1.6x the base's eases
export const PUSH = 0.8; /* deliberate */ // push-in onto the pill, outCubic (base 0.5 outQuint)
export const HOLD = 1.25; /* deliberate */ // parked on the pill: with the check, the pill holds >= 1.3 s before the beat starts
export const PULL = 0.8; /* deliberate */ // pull back to the thread, inOutSine (base 0.5 inOutCubic), while the reply starts
const DONE_AT = 0.6; /* deliberate */ // pill landed to the spinner resolving to the check (its pop ends at +0.8, 1.3 s before the reply)
// calm: each beat holds this long after its last element lands before the next pill starts (>= 2.0 s); the Opus beat
// holds inside itself (its camera holds on Priya's reply, then pulls back), so only GAP follows it
const SETTLE = { gemini: 2.05, astra: 2.2, opus: 0 };
const REPLY = 0.05;                  // pull-back start to the model's reply line
// nozoom: no push to wait for, so the reply starts GAP after the check lands (pill + DONE_AT + GAP)
const APPEAR = 0.3;                  // a message rising out of the composer
const PILL_IN = 0.5;                 // a switch pill rising in (calm: ~0.5 s)

// the one ask the whole spot is about
export const ASK = 'Answer the top comments on my latest video and pin the best one';

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the switch pill superbot lands when it hands the job to an app (labels exact, per the spec)
const CHIP = {
  gemini: 'Switching to Gemini',
  astra: 'Switching to GPT-6 Astra',
  opus: 'Switching to Claude Opus 5.5',
  studio: 'Connecting to YouTube Studio',
};

// one hand-off: the app that answers, its pill, and the beat modules its reply plays in order
const step = (app, mods, opts = {}) => ({ app, mods, opts, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [watch]),
  step('astra', [frame]),
  step('opus', [replies]),
  step('studio', [studio]),
];

// every step's clock. The ask types from CHAT_T0 and is sent; the first pill lands FIRST_PILL after the send, and
// every later pill lands GAP after the previous step's last visible change. Zoom cut: the camera pushes in, the
// check lands while it holds, the camera pulls back and the reply builds. Nozoom cut: the check lands at the same
// mark (pill + DONE_AT) and the reply starts GAP after it. Each beat module's times(r, opts) owns everything
// after its own start and reports end = its last visible change (opts.zoom tells it which cut is playing); a beat may
// also report next when a beat after it under the same pill is cued from earlier than end. A step ends when the last
// of its beats has settled.
function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS; // the last character lands
  const send = typeEnd + SEND;
  const first = send + FIRST_PILL;
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { app: a.app, opts: a.opts, label: a.label };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    k.sw = prevEnd === null ? first : prevEnd + GAP; // the pill lands
    k.done = k.sw + DONE_AT;          // spinner -> check; the composer's model chip switches here
    let end;
    if (ZOOM) {
      k.landed = k.sw + PUSH;         // the camera is parked on it
      k.pull = k.landed + HOLD;       // the camera starts back
      k.back = k.pull + PULL;         // ...and is at rest
      k.reply = k.pull + REPLY;       // the app answers
      end = k.back;
    } else {
      k.reply = k.done + GAP;         // the app answers as soon as the check has landed
      end = k.reply;                  // the check's own pop (0.2 s) has finished by then
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
    prevEnd = end + (SETTLE[a.app] || 0);
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;
// the marks scenes/tabs.js drives the camera from, one per pill (the node is filled in by mountChat); none in nozoom
export const CAMERA = ZOOM ? BEATS.map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null })) : [];
// beat-level camera moves: a beat whose times() carries T.focus ({ sw, landed, pull, back }) and whose build() hands
// back a focus node gets a push onto that node (replies.js: the Opus panel, pushed in to fill the frame width while the
// run plays). Same shape as CAMERA; `fill` is the share of the frame width the node fills when parked. Empty in
// nozoom (replies.js only reports T.focus when opts.zoom is on).
export const FOCUS = BEATS.flatMap(({ k }) => k.parts.filter(({ T }) => T.focus).map(({ T }) => ({ ...T.focus, T, fill: 0.9, node: null })));

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer and any full-frame layer live in the scene's root (the section's px, the space placeCursor writes)
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
  const ctx = { hub, root, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }, i) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    if (CAMERA[i]) CAMERA[i].node = sw.sw;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      if (inst.focus) { const f = FOCUS.find((m) => m.T === T); if (f) f.node = inst.focus; }
      return inst;
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    [b.k.sw, b.sw.w],
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
  const chat = {
    hub, root, pointer, feed, inner, beats, scroll,
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
  return chat;
}

function appear(n, t, a, dy = 10, dur = APPEAR) {
  const p = outCubic(seg(t, a, a + dur));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = streamCount(b.k.ask, b.k.s, TYPE_CPS, t); // k characters at CHAT_T0 + 0.02k
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  // the send press: a short dip, no overshoot
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  const dip = at === undefined ? 0 : Math.sin(Math.PI * seg(t, at - 0.12, at + 0.2));
  c.send.style.transform = dip ? `scale(${(1 - 0.16 * dip).toFixed(4)})` : 'none';
  // policy guard: once the ask is sent the composer is a quiet frame, not a live control: the send arrow fades out
  // and the other controls dim (chat.css .qc-sent)
  const sent = c.beats.find(({ k }) => k.ask);
  const gone = sent ? seg(t, sent.k.send + 0.2, sent.k.send + 0.45) : 0;
  c.send.style.opacity = gone > 0 ? (1 - gone).toFixed(3) : '';
  c.hub.querySelector('.composer').classList.toggle('qc-sent', !!sent && t >= sent.k.send + 0.2);
}

function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.done) { app = k.app; swap = k.done; } });
  // the platform chip follows the active model: it dips out, swaps, comes back
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

// the pill: lands with its tile, the spinner turns while the camera pushes in, and resolves to the green check
// while the camera holds. The label never moves or changes once the pill has landed.
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

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.3)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw, 10, PILL_IN);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const pt = c.beats.flatMap((b) => b.insts).map((inst) => inst.pointer && inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}

// after the camera has been set for this frame: beats that measure the screen (studio.js's full-frame layer) draw here
export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
