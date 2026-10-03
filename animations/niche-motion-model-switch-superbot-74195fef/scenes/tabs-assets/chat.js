// The one-ask chat. The ask ("Reformat my launch promo for 9:16, 1:1 and 4:5 and render all three") types as a plain
// line under the greeting and is sent, and superbot hands the job from model to model: Gemini, Claude Opus 5.5,
// GPT-6 Astra, then the designer's own After Effects. Every hand-off is ONE status line (the hub's "Switching to X"
// line made borderless: the app's flat mark, the words, a spinner that resolves to the green check; no pill, no
// border, no tile). In the zoom cut (default) every status line is the moment the camera pushes in on (scenes/tabs.js
// reads CAMERA below); in the nozoom cut (?cut=nozoom, cut.js) the camera never moves and each reply starts GAP after
// its check. The routed model then answers with its own beat: watching.js (Gemini watches launch_promo_v12.mp4 and
// maps its 8 shots), script.js (Opus writes reformat.jsx, the ExtendScript that does the reformat), layout.js (GPT-6
// Astra checks the three new layouts) and aftereffects.js (superbot runs the script in the open project, then the card
// opens to the full-frame After Effects workspace: three viewers playing the reformatted promo while the Render Queue
// completes). No composer, no buttons, no pointer: nothing on screen is a control.
// The thread is top-anchored until it fills, then scrolls so the newest line stays in view. renderChat(c, t) is a pure
// function of the scene's local time. ?v= on the beat imports busts the Pages host's 10-minute module cache.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, streamCount } from '../../lib.js';
import { ZOOM } from './cut.js?v=74195fef';
import watching from './beats/watching.js?v=74195fef';
import script from './beats/script.js?v=74195fef';
import layout from './beats/layout.js?v=74195fef';
import aftereffects from './beats/aftereffects.js?v=74195fef';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.35;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 50; /* deliberate */ // a typewriter: one character every 0.02 s (character k lands at CHAT_T0 + k/50)
const SEND = 0.17;                   // last character to the send instant (67 chars land at 1.69, send 1.86)
const FIRST_PILL = 0.2;              // send to the first status line landing (2.06)
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

// the one ask the whole spot is about
export const ASK = 'Reformat my launch promo for 9:16, 1:1 and 4:5 and render all three';
// the bubble breaks its two lines here (after "1:1"), so it hugs them instead of keeping its max width
const ASK_BREAK = ASK.indexOf('and 4:5');

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  aftereffects: { name: 'After Effects', logo: brand('aftereffects.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the status line superbot lands when it hands the job to an app (labels exact, per the spec)
const CHIP = {
  gemini: 'Switching to Gemini',
  opus: 'Switching to Claude Opus 5.5',
  astra: 'Switching to GPT-6 Astra',
  aftereffects: 'Connecting to After Effects',
};

// one hand-off: the app that answers, its pill, and the beat modules its reply plays in order
const step = (app, mods, opts = {}) => ({ app, mods, opts, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [watching]),
  step('opus', [script]),
  step('astra', [layout]),
  step('aftereffects', [aftereffects]),
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
    k.done = k.sw + PUSH + CHECK;     // spinner -> check
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
// back a focus node gets a push onto that node (script.js: the Opus code card, pushed in to fill the frame width while
// the script types). Same shape as CAMERA; `fill` is the share of the frame width the node fills when parked. Empty in
// nozoom (script.js only reports T.focus when opts.zoom is on).
export const FOCUS = BEATS.flatMap(({ k }) => k.parts.filter(({ T }) => T.focus).map(({ T }) => ({ ...T.focus, T, fill: 0.9, node: null })));

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // any full-frame layer lives in the scene's root (the section's px)
  const root = hub.closest('.sbsite').parentNode;

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, root, box, tile, OK, esc, el, brand, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }, i) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask.slice(0, ASK_BREAK).trimEnd())}\n${esc(k.ask.slice(ASK_BREAK))}</div></div></div>`) : null;
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

  const chat = { hub, root, feed, inner, beats, scroll, lastLine: null };
  return chat;
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + APPEAR));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

// the ask, typed into the plain line under the greeting (no box, no controls); the caret goes with the send
function renderAsk(c, t, line) {
  if (!line) return;
  const b = c.beats.find(({ k }) => k.ask);
  const n = streamCount(b.k.ask, b.k.s, TYPE_CPS, t); // k characters at CHAT_T0 + 0.02k
  const html = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span>${t < b.k.send ? '<i class="qc-caret"></i>' : ''}`;
  if (html !== c.lastLine) { line.innerHTML = html; c.lastLine = html; }
}

// the status line: lands with its mark, the spinner turns while the camera pushes in, and resolves to the green
// check while the camera holds. The label never moves or changes once it has landed.
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
  // top-anchored while the thread is shorter than the feed, then the newest landed line is kept just above the
  // bottom edge, so the thread scrolls up as it grows
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.3)));
  }
  c.inner.style.transform = `translateY(${Math.min(0, viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t, line) {
  if (!c) return;
  renderAsk(c, t, line);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderScroll(c, t);
}

// after the camera has been set for this frame: beats that measure the screen (aftereffects.js's full-frame layer) draw here
export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
