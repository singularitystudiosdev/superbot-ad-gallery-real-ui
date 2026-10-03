// The one-ask chat. The ask ("Answer the top comments on my latest video and pin the best one") is typed into the
// composer and sent, and superbot hands the job from model to model: Gemini, GPT-6 Astra, YouTube Studio itself, then
// ElevenLabs. Every hand-off is ONE switch pill (the real hub's "Switching to X" pill: logo tile, label, spinner that
// resolves to a green check). In the zoom cut (default) every pill is the moment the camera pushes in on
// (scenes/tabs.js reads CAMERA below); in the nozoom cut (?cut=nozoom, cut.js) the camera never moves and each reply
// starts GAP after its pill's check. The routed model then answers with its own beat: watch.js (Gemini watches the
// video and ranks the top 5 of 1,284 comments), replies.js (GPT-6 Astra drafts the five replies in the creator's voice
// and decides the pin), studio.js (Google's consent card, the checklist, then the card opened to YouTube Studio's
// comments inside a superbot frame where Priya's comment is pinned, then the frame closes back to the thread) and
// voice.js (ElevenLabs reads the pinned reply aloud as a voice note: the real audio, audio/voice-note.mp3).
// Under the ask a quiet ROUTE line names the chain (Gemini > GPT-6 Astra > YouTube Studio > ElevenLabs): a label, not
// a control. Upcoming steps are dim, the active one is white, done ones carry a small check; each step lights when its
// pill lands. Once the thread has scrolled the ask away the line stays at the top of the thread.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, placeCursor, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { ZOOM } from './cut.js?v=0670df81';
import watch from './beats/watch.js?v=0670df81';
import replies from './beats/replies.js?v=0670df81';
import studio from './beats/studio.js?v=0670df81';
import voice from './beats/voice.js?v=0670df81';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.35;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 50; /* deliberate */ // a typewriter: one character every 0.02 s (character k lands at CHAT_T0 + k/50)
const SEND = 0.17;                   // last character to the send press (63 chars land at 1.61, send 1.78)
const FIRST_PILL = 0.2;              // send to the first pill landing (2.16)
// the schedule is content-driven: each beat's times(r).end is its last visible change, and the next thing (the next
// pill, or the next beat under the same pill) starts GAP after it
export const GAP = 0.2; /* deliberate */ // the user: "it should be like 0.2"
// the camera move on every pill (scenes/tabs.js owns the move itself; these are its marks)
export const PUSH = 0.5; /* deliberate */ // push-in onto the pill, outQuint
export const HOLD = 1.0; /* deliberate */ // parked on the pill: label still and fully legible (the brief asks >= 0.8s)
export const PULL = 0.5; /* deliberate */ // pull back to the thread, inOutCubic, while the reply starts
const CHECK = 0.45; /* deliberate */ // after the push lands, the spinner resolves to the check
const REPLY = 0.05;                  // pull-back start to the model's reply line
// nozoom: no push to wait for, so the reply starts GAP after the check lands (pill + 0.95 + 0.20 = pill + 1.15)
const APPEAR = 0.3;                  // a message rising out of the composer
const COMP_FADE = 0.3;               // send to the composer gone (policy guard: no composer control on a held frame)
const COMP_FOLD = 0.7;               // send to the composer's space folded away (the first pill lands at send + 0.2)

// the one ask the whole spot is about
export const ASK = 'Answer the top comments on my latest video and pin the best one';

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected' },
  elevenlabs: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the switch pill superbot lands when it hands the job to an app (labels exact, per the spec)
const CHIP = {
  gemini: 'Switching to Gemini',
  astra: 'Switching to GPT-6 Astra',
  studio: 'Connecting to YouTube Studio',
  elevenlabs: 'Switching to ElevenLabs',
};

// one hand-off: the app that answers, its pill, and the beat modules its reply plays in order
const step = (app, mods, opts = {}) => ({ app, mods, opts, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [watch]),
  step('astra', [replies]),
  step('studio', [studio]),
  step('elevenlabs', [voice]),
];

// every step's clock. The ask types from CHAT_T0 and is sent; the first pill lands FIRST_PILL after the send, and
// every later pill lands GAP after the previous step's last visible change. Zoom cut: the camera pushes in, the
// check lands while it holds, the camera pulls back and the reply builds. Nozoom cut: the check lands at the same
// mark (pill + PUSH + CHECK) and the reply starts GAP after it. Each beat module's times(r, opts) owns everything
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
    k.done = k.sw + PUSH + CHECK;     // spinner -> check; the composer's model chip switches here
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
    prevEnd = end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;
// the marks scenes/tabs.js drives the camera from, one per pill (the node is filled in by mountChat); none in nozoom
export const CAMERA = ZOOM ? BEATS.map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null })) : [];
// beat-level camera moves: a beat whose times() carries T.focus ({ sw, landed, pull, back }) and whose build() hands
// back a focus node gets a push onto that node (replies.js: the Astra panel, pushed in to fill the frame width while the
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

  // the route line: one quiet label under the ask (logo + name per step, a chevron glyph between steps)
  // ElevenLabs is never a tile: its two bars sit locked against the word, the way its own logo lockup sets them
  // (bars = cap height, same colour as the word, gap under 0.12em), so they read as one wordmark, not a pause glyph
  const el11 = `<span class="qc-el"><img src="${APPS.elevenlabs.logo}" alt=""/>ElevenLabs</span>`;
  const lock = (txt) => esc(txt).replace('ElevenLabs', el11);
  const route = add(`<div class="qc-route" aria-hidden="true">${BEATS.map(({ k }, i) => `${i ? '<i class="qc-rsep">\u203a</i>' : ''}<span class="qc-rs">${k.app === 'elevenlabs' ? '' : `<img class="qc-rl qc-rl-${k.app}" src="${APPS[k.app].logo}" alt=""/>`}<b>${lock(APPS[k.app].name)}</b><svg class="qc-rok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>`).join('')}</div>`);
  const routeSteps = [...route.querySelectorAll('.qc-rs')];
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }, i) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw${k.app === 'elevenlabs' ? ' qc-sw-lock' : ''}">${k.app === 'elevenlabs' ? '' : tile(k.app)}<span class="qc-swl">${lock(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), tile: w.querySelector('.qc-sw > .qc-tile'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    if (CAMERA[i]) CAMERA[i].node = sw.sw;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${k.app === 'elevenlabs' ? '' : tile(k.app)}<b>${lock(a.name)}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      if (inst.focus) { const f = FOCUS.find((m) => m.T === T); if (f) f.node = inst.focus; }
      return inst;
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map((b, i) => {
    const r = build(b, i);
    // the route line sits directly under the ask, before the first pill
    if (r.u) r.u.after(route);
    return r;
  });
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, route]] : []),
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
    hub, root, pointer, feed, inner, beats, scroll, route, routeSteps, routeState: [],
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
    comp: hub.querySelector('.composer'), compSpace: null, compMb: 0,
  };
  return chat;
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
    const n = streamCount(b.k.ask, b.k.s, TYPE_CPS, t); // k characters at CHAT_T0 + 0.02k
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  // the send press: a short dip, no overshoot
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  const dip = at === undefined ? 0 : Math.sin(Math.PI * seg(t, at - 0.12, at + 0.2));
  c.send.style.transform = dip ? `scale(${(1 - 0.16 * dip).toFixed(4)})` : 'none';
  // policy guard: once the ask is sent the composer leaves (fades with the send, then its space folds away while the
  // first pill lands), so no composer control sits under any beat. Before the send it shows only the text field and
  // a dim send glyph (chat.css hides +, SUPER, the model chip, the monitor and the mic).
  const k0 = c.beats[0].k;
  if (c.compSpace === null) {
    const cs = getComputedStyle(c.comp);
    c.compMb = parseFloat(cs.marginBottom) || 0;
    c.compSpace = c.comp.offsetHeight + (parseFloat(cs.marginTop) || 0) + c.compMb;
  }
  const fo = outCubic(seg(t, k0.send + 0.05, k0.send + COMP_FADE));
  const fold = inOutCubic(seg(t, k0.send + 0.1, k0.send + COMP_FOLD));
  c.comp.style.opacity = (1 - fo).toFixed(3);
  c.comp.style.visibility = fo >= 1 ? 'hidden' : '';
  c.comp.style.marginBottom = fold > 0 ? `${(c.compMb - c.compSpace * fold).toFixed(2)}px` : '';
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
  if (s.tile) s.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
}

// the route line: rises with the ask; step i is upcoming (dim) until its pill lands, active (white) until the next
// pill lands, then done (white, with a small check); the last step is done once the voice note has finished
function renderRoute(c, t) {
  c.route.style.translate = '0 0'; // unstuck while the scroll measures (renderRouteStick sets it again)
  appear(c.route, t, c.beats[0].k.send);
  c.routeSteps.forEach((n, i) => {
    const k = c.beats[i].k;
    // the last step is done once its beat has finished speaking (voice.js T.a1), else at its end
    const last = k.parts[k.parts.length - 1].T;
    const next = c.beats[i + 1] ? c.beats[i + 1].k.sw : (Number.isFinite(last.a1) ? last.a1 : k.end);
    const st = t < k.sw ? 'up' : t < next ? 'on' : 'done';
    if (c.routeState[i] !== st) { n.className = `qc-rs qc-rs-${st}`; c.routeState[i] = st; }
  });
}

// once the thread has scrolled the ask away, the route line stays at the top of the thread (its band masks the
// lines scrolling under it)
function renderRouteStick(c) {
  const cs = getComputedStyle(c.feed);
  // stick just under the scene's top-edge vignette (tabs.css .ask-edge, the top 8% of the frame), so the label is
  // never faded by it
  c.edge = c.edge || c.root.querySelector('.ask-edge');
  const eb = c.edge ? boxIn(c.edge, c.feed) : null;
  const top = Math.max(parseFloat(cs.paddingTop), eb ? eb.y + eb.h + 2 : 0);
  c.route.style.translate = '0 0';
  const y = boxIn(c.route, c.feed).y;
  const d = Math.max(0, top - y);
  c.route.style.translate = d > 0 ? `0 ${d.toFixed(2)}px` : '0 0';
  c.route.classList.toggle('qc-stuck', d > 0.5);
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
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderRoute(c, t);
  renderScroll(c, t);
  renderRouteStick(c);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const pt = c.beats.flatMap((b) => b.insts).map((inst) => inst.pointer && inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}

// after the camera has been set for this frame: beats that measure the screen (studio.js's framed Studio layer) draw here
export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
