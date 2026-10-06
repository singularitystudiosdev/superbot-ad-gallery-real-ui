// every-model-one-chat-real-app (db5ea565): the source spot's three asks, replayed on the REAL superbot
// desktop renderer. app/snaps.js holds the app's own DOM, captured per phase from superbot-desktop main
// (@bcb624c7f) driven through its provider_switch wire (capture/capture-story.14ca6a15.mjs); app/app.css
// is the app's own stylesheet. This file only moves between those frames:
//   - morph: each phase change patches the iframe's DOM toward the next snapshot, so unchanged nodes stay
//     put and only new ones mount (with the app's own CSS entrances);
//   - typing into the composer, the answer streaming in, the feed scroll easing, the live clocks, the clip;
//   - a camera: pushed into the chat pane for each ask and its switch, onto the clip, out for each answer;
//   - the source spot's end card.
// Every visual is a pure function of t: window.__AD.seek(t) is frame-exact (CSS animations included).
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack, op } from './lib.js';

const SN = window.SB_SNAPS;
const VPW = SN.vp.w, VPH = SN.vp.h;          // the app's CSS viewport at its 1.2 zoom (1200 x 675)
const SW = 1920, SH = 1080, K = SW / VPW;     // stage px per app px
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const P1 = 'make me a muse meme';
const P2 = 'now make it move';
const P3 = 'perfect. order me a burger to celebrate';

// The phases, in order. `type`: the composer fills over `dur` from `at`; `reveal`: the answer's prose
// streams over `reveal` s while its card (image, clip, order tracker) rises in.
const TL = [
  { at: 0.0, phase: 'p00-idle' },
  { at: 0.4, phase: 't1-a-typed', type: { text: P1, dur: 1.1 } },
  { at: 1.85, phase: 't1-b-thinking' },
  { at: 2.45, phase: 't1-c-switching' },
  { at: 3.35, phase: 't1-d-live' },
  { at: 4.95, phase: 't1-e-done', reveal: 0.45 },
  { at: 6.75, phase: 't2-a-typed', type: { text: P2, dur: 0.95 } },
  { at: 8.0, phase: 't2-b-thinking' },
  { at: 8.55, phase: 't2-c-switching' },
  { at: 9.45, phase: 't2-d-live' },
  { at: 10.95, phase: 't2-e-done', reveal: 0.4, clip: true },
  { at: 14.75, phase: 't3-a-typed', type: { text: P3, dur: 1.6 } },
  { at: 16.65, phase: 't3-b-thinking' },
  { at: 17.2, phase: 't3-c-switching' },
  { at: 18.0, phase: 't3-d-live1' },
  { at: 18.8, phase: 't3-d-live2' },
  { at: 19.6, phase: 't3-d-live3' },
  { at: 20.6, phase: 't3-e-done', reveal: 0.55 },
];
const APP_END = 23.3, END_DUR = 3.4, DIP = 0.35;
const CYCLE = +(APP_END + END_DUR).toFixed(3);
const CLIP_AT = TL.find((s) => s.clip).at + 0.2, CLIP_DUR = 6;
const SCROLL_EASE = 0.55, CARD_IN = 0.35;
const at = (phase) => TL.find((s) => s.phase === phase).at;

const stage = document.getElementById('stage');
const cam = document.getElementById('cam');
const frame = document.getElementById('app');
const sApp = document.getElementById('s-app');
const sEnd = document.getElementById('s-end');
const dip = document.getElementById('dip');

// ---------- snapshots ----------
const REF = /<x-ref k="(\d+)"><\/x-ref>/g;
const expanded = new Map();
const expand = (html) => html.replace(REF, (_, k) => expand(SN.T[+k]));
function htmlOf(phase) {
  if (!expanded.has(phase)) expanded.set(phase, expand(SN.S[phase].b));
  return expanded.get(phase);
}

let doc = null;
const templates = new Map();
function templateOf(phase) {
  if (!templates.has(phase)) {
    const tpl = doc.createElement('template');
    tpl.innerHTML = htmlOf(phase);
    templates.set(phase, tpl);
  }
  return templates.get(phase);
}

// ---------- morph: patch the live DOM toward a snapshot ----------
let fresh = new Set(); // subtrees the last morph inserted (their CSS entrances are this phase's)
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-message-id') || n.id || null : null);
function sameNode(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== 1) return true;
  if (a.tagName !== b.tagName) return false;
  const ka = keyOf(a), kb = keyOf(b);
  if (ka || kb) return ka === kb;
  const ta = a.getAttribute('data-testid'), tb = b.getAttribute('data-testid');
  return ta === tb || !(ta || tb);
}
function syncAttrs(a, b) {
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
}
function morphNode(a, b) {
  if (a.nodeType !== 1) {
    if (a.data !== b.data) a.data = b.data;
    return;
  }
  syncAttrs(a, b);
  morphChildren(a, b.content || b);
}
function insert(parent, t, before) {
  const n = doc.importNode(t, true);
  parent.insertBefore(n, before);
  if (n.nodeType === 1) fresh.add(n);
}
function morphChildren(from, to) {
  let f = from.firstChild;
  for (let t = to.firstChild; t; t = t.nextSibling) {
    if (!f) { insert(from, t, null); continue; }
    if (sameNode(f, t)) { morphNode(f, t); f = f.nextSibling; continue; }
    // a keyed node further on: drop what sits before it (removed rows), then patch it in place
    let probe = keyOf(t) ? f.nextSibling : null;
    for (let i = 0; probe && i < 12 && !sameNode(probe, t); i++) probe = probe.nextSibling;
    if (probe && sameNode(probe, t)) {
      while (f !== probe) { const n = f.nextSibling; from.removeChild(f); f = n; }
      morphNode(f, t); f = f.nextSibling;
    } else {
      insert(from, t, f);
    }
  }
  while (f) { const n = f.nextSibling; from.removeChild(f); f = n; }
}
function syncRootAttrs(phase) {
  const s = SN.S[phase];
  const de = doc.documentElement, freeze = de.classList.contains('ad-freeze');
  for (const at of [...de.attributes]) if (!(at.name in s.html)) de.removeAttribute(at.name);
  for (const [k, v] of Object.entries(s.html)) if (de.getAttribute(k) !== v) de.setAttribute(k, v);
  if (freeze) de.classList.add('ad-freeze');
  for (const at of [...doc.body.attributes]) if (!(at.name in s.body)) doc.body.removeAttribute(at.name);
  for (const [k, v] of Object.entries(s.body)) if (doc.body.getAttribute(k) !== v) doc.body.setAttribute(k, v);
}

let shown = null;
function show(phase) {
  if (shown === phase) return false;
  fresh = new Set();
  syncRootAttrs(phase);
  morphChildren(doc.body, templateOf(phase).content);
  shown = phase;
  touched.clear();
  return true;
}

// ---------- scroll ----------
// Captured scrolls are the app's own (the feed pins its newest turn). Two framings are the ad's: the meme
// answer scrolls so its turn clears the sticky prompt bar, and the next ask is typed over that framing.
const feedOverride = {};
const feedTop = (phase) => {
  if (phase in feedOverride) return feedOverride[phase];
  const s = SN.S[phase].scrolls.find((x) => x.testid === 'feed');
  return s ? s.top : 0;
};
function applyScrolls(phase, t, from, prev) {
  for (const s of SN.S[phase].scrolls) {
    const el = doc.querySelector(`[data-ad-scroll="${s.k}"]`);
    if (!el) continue;
    if (s.testid === 'feed') {
      const to = feedTop(phase);
      el.scrollTop = prev ? lerp(feedTop(prev), to, inOutCubic(seg(t, from, from + SCROLL_EASE))) : to;
    } else {
      el.scrollTop = s.top;
    }
    el.scrollLeft = s.left;
  }
}
function measureTurnTop(phase) {
  show(phase);
  applyScrolls(phase, 1e9, 0, null);
  const feed = doc.querySelector('[data-testid="feed"]');
  const rows = doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]');
  const row = rows[rows.length - 1];
  if (!feed || !row) return feedTop(phase);
  const sticky = doc.querySelector('[data-testid="sticky-prompt"]');
  const stickyH = sticky ? sticky.getBoundingClientRect().height : 0;
  const y = row.getBoundingClientRect().top - feed.getBoundingClientRect().top + feed.scrollTop;
  return clamp(y - stickyH - 6, 0, feed.scrollHeight - feed.clientHeight);
}

// text nodes are cut back from their captured value and restored by the next morph
const touched = new Map();
function setText(node, text) {
  if (!touched.has(node)) touched.set(node, node.data);
  if (node.data !== text) node.data = text;
}
function textNodes(root) {
  const out = [];
  const w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}

let caret = null;
function typeInto(text, n) {
  const input = doc.querySelector('[data-testid="composer-input"]');
  if (!input) return;
  const nodes = textNodes(input).filter((x) => !caret || x.parentNode !== caret);
  let left = n;
  for (const node of nodes) {
    const full = touched.has(node) ? touched.get(node) : node.data;
    const take = clamp(left, 0, full.length);
    setText(node, full.slice(0, take));
    left -= take;
  }
  const last = nodes[nodes.length - 1];
  const host = last ? last.parentNode : input;
  if (!caret || caret.ownerDocument !== doc) { caret = doc.createElement('span'); caret.className = 'ad-caret'; }
  if (caret.parentNode !== host || caret.previousSibling !== last) host.appendChild(caret);
}

function lastRow() {
  const rows = doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]');
  return rows[rows.length - 1] || null;
}
// (never [data-slot="message-row-actions"]: that is the row's hover toolbar, opacity-0 until hovered)
const CARD_SEL = '[data-slot="image-card"], [data-testid="embed-media"], [data-testid="embed-monitor"], [data-slot="turn-foot"], [data-slot="reply-footer"]';
function revealAnswer(lt, dur) {
  const row = lastRow();
  if (!row) return;
  const paras = [...row.querySelectorAll('[data-slot="answer-lead"], [data-slot="markdown-para"]')].filter((p) => !p.closest('[data-slot="provider-switch-block"]'));
  const nodes = paras.flatMap(textNodes);
  const full = nodes.map((n) => (touched.has(n) ? touched.get(n) : n.data));
  const total = full.reduce((a, s) => a + s.length, 0);
  let left = Math.round(total * seg(lt, 0, dur));
  nodes.forEach((n, i) => { const take = clamp(left, 0, full[i].length); setText(n, full[i].slice(0, take)); left -= take; });
  const f = outCubic(seg(lt, dur * 0.15, dur * 0.15 + CARD_IN));
  for (const el of row.querySelectorAll(CARD_SEL)) {
    el.style.opacity = f.toFixed(3);
    el.style.transform = f >= 1 || REDUCED ? '' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
  }
}

// the app's live clocks (the turn's elapsed "6s", sized by --sb-clock-chars, and the media placeholder's
// "0:03") keep counting from their captured value while a turn is in flight
function tickClocks(dt) {
  const add = Math.floor(dt);
  if (add < 1) return;
  for (const el of doc.querySelectorAll('[style*="--sb-clock-chars"], [data-slot="media-pending-clock"]')) {
    const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    if (!node) continue;
    const full = touched.has(node) ? touched.get(node) : node.data;
    let m;
    if ((m = /^(\d+)s$/.exec(full))) {
      const v = `${+m[1] + add}s`;
      setText(node, v);
      if (el.hasAttribute('style')) el.style.setProperty('--sb-clock-chars', String(v.length));
    } else if ((m = /^(\d+):(\d\d)$/.exec(full))) {
      const s = +m[1] * 60 + +m[2] + add;
      setText(node, `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    }
  }
}

let frozen = false;
function syncClip(t) {
  const v = doc.querySelector('video[data-slot="embed-media-video"]');
  if (!v) return;
  v.muted = true;
  const want = clamp(t - CLIP_AT, 0, CLIP_DUR - 0.04);
  const running = !frozen && t >= CLIP_AT && t < CLIP_AT + CLIP_DUR - 0.04;
  if (running) {
    if (v.paused) v.play().catch((e) => console.warn('clip play', e));
    if (Math.abs(v.currentTime - want) > 0.25) v.currentTime = want;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - want) > 0.02) v.currentTime = want;
  }
}

// Frame-exact CSS: while seeking, every animation in the app frame is pinned to t. An entrance on a node
// this phase inserted plays from the phase start; one on an older node has finished; a loop (spinner,
// sheen, ring breath) runs on the absolute clock.
function inFresh(el) {
  for (let n = el; n && n !== doc.body; n = n.parentNode) if (fresh.has(n)) return true;
  return false;
}
function pinAnimations(t, from) {
  for (const a of doc.getAnimations()) {
    const timing = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
    if (!timing) continue;
    a.pause();
    if (timing.iterations === Infinity) a.currentTime = t * 1000;
    else if (a.effect.target && inFresh(a.effect.target)) a.currentTime = Math.min(timing.endTime, Math.max(0, (t - from) * 1000));
    else a.currentTime = timing.endTime;
  }
}
function resumeAnimations() {
  for (const a of doc.getAnimations()) if (a.playState === 'paused') a.play();
}

// ---------- camera ----------
// Ask and switch beats frame the chat pane alone: the zoom that puts the frame's left edge on the
// sidebar's border (the crop never cuts through a row). The clip gets its own closer shot.
const FULL = { cx: VPW / 2, cy: VPH / 2, z: 1 };
const Z_MAX = 1.45;
const paneZoom = () => {
  const main = doc.querySelector('main.hub-main');
  const left = main ? main.getBoundingClientRect().left : 0;
  return { left, z: clamp(VPW / (VPW - left), 1, Z_MAX) };
};
function framePane(topEl, bottomEl, bottomPad) {
  const { left, z } = paneZoom();
  const top = Math.min(...topEl.filter(Boolean).map((el) => el.getBoundingClientRect().top)) - 18;
  const bottom = bottomEl ? bottomEl.getBoundingClientRect().bottom + bottomPad : VPH;
  const hh = VPH / 2 / z;
  const cy = bottom - top > 2 * hh ? bottom - hh : (top + bottom) / 2;
  return { cx: left + (VPW - left) / 2, cy, z };
}
function viewForAsk(phase) {
  show(phase);
  applyScrolls(phase, 1e9, 0, null);
  const composer = doc.querySelector('[data-testid="composer"]');
  const greeting = doc.querySelector('[data-testid="thread-idle"]');
  return framePane([greeting, composer], composer, 44);
}
function viewForSwitch(phase) {
  show(phase);
  applyScrolls(phase, 1e9, 0, null);
  const bubbles = doc.querySelectorAll('[data-testid="feed"] [data-slot="message-row-bubble"]');
  return framePane([bubbles[bubbles.length - 1], doc.querySelector('[data-testid="live-provider-switch"]')], doc.querySelector('[data-testid="composer"]'), 44);
}
function viewForClip(phase) {
  show(phase);
  applyScrolls(phase, 1e9, 0, null);
  const media = doc.querySelector('[data-testid="embed-media"]');
  if (!media) return FULL;
  const r = media.getBoundingClientRect();
  const z = clamp((VPW * 0.62) / r.width, 1, 1.8);
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 - 14, z };
}
let CAM_KEYS = [];
function buildCamera() {
  feedOverride['t1-e-done'] = measureTurnTop('t1-e-done');
  feedOverride['t2-a-typed'] = feedOverride['t1-e-done'];
  const ask1 = viewForAsk('t1-a-typed');
  const sw = { 1: viewForSwitch('t1-d-live'), 2: viewForSwitch('t2-d-live'), 3: viewForSwitch('t3-d-live3') };
  const clipView = viewForClip('t2-e-done');
  const k = [{ t: 0, v: FULL }, { t: 0.35, v: FULL }, { t: 1.1, v: ask1 }];
  k.push({ t: at('t1-b-thinking'), v: ask1 }, { t: at('t1-b-thinking') + 0.6, v: sw[1] });
  k.push({ t: at('t1-e-done') + 0.25, v: sw[1] }, { t: at('t1-e-done') + 1.1, v: FULL });
  k.push({ t: at('t2-a-typed') - 0.1, v: FULL }, { t: at('t2-a-typed') + 0.6, v: sw[2] });
  k.push({ t: at('t2-e-done') + 0.1, v: sw[2] }, { t: at('t2-e-done') + 0.9, v: clipView });
  k.push({ t: at('t3-a-typed') - 0.1, v: clipView }, { t: at('t3-a-typed') + 0.7, v: sw[3] });
  k.push({ t: at('t3-e-done') + 0.25, v: sw[3] }, { t: at('t3-e-done') + 1.1, v: FULL });
  CAM_KEYS = k;
}
function camAt(t) {
  if (REDUCED) { cam.style.transform = `scale(${K})`; return; }
  let a = CAM_KEYS[0], b = CAM_KEYS[0];
  for (let i = 0; i < CAM_KEYS.length; i++) {
    if (CAM_KEYS[i].t <= t) { a = CAM_KEYS[i]; b = CAM_KEYS[i + 1] || CAM_KEYS[i]; }
  }
  const f = b === a ? 0 : inOutCubic(seg(t, a.t, b.t));
  const z = lerp(a.v.z, b.v.z, f);
  const hw = VPW / 2 / z, hh = VPH / 2 / z;
  const cx = clamp(lerp(a.v.cx, b.v.cx, f), hw, VPW - hw), cy = clamp(lerp(a.v.cy, b.v.cy, f), hh, VPH - hh);
  const s = K * z;
  cam.style.transform = `translate(${(SW / 2 - cx * s).toFixed(2)}px, ${(SH / 2 - cy * s).toFixed(2)}px) scale(${s.toFixed(5)})`;
}

// ---------- the end card (the source spot's lock-up and live mascot, plus where to get it) ----------
function makeMark(size) {
  const host = document.createElement('span');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, lastT = NaN;
  return {
    el: host,
    render(t) {
      if (t === lastT) return; lastT = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { try { a.pause(); a.currentTime = Math.max(0, t) * 1000; } catch (e) { console.error(e); } }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}
const end = { face: sEnd.querySelector('.face'), slide: sEnd.querySelector('.end-slide'), url: sEnd.querySelector('.url'), mark: makeMark(220) };
end.face.appendChild(end.mark.el);
function renderEnd(lt) {
  const f = seg(lt, 0, 0.5);
  op(end.face, f);
  end.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  end.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  op(end.slide, w);
  op(end.url, seg(lt, 0.85, 1.3));
  end.mark.render(lt);
}

// ---------- one frame ----------
function phaseAt(t) {
  let i = 0;
  while (i + 1 < TL.length && TL[i + 1].at <= t) i++;
  return i;
}
function render(t) {
  const inApp = t < APP_END;
  sApp.classList.toggle('on', inApp);
  sEnd.classList.toggle('on', !inApp);
  if (!inApp) {
    sEnd.style.opacity = '1';
    renderEnd(t - APP_END);
  } else {
    sApp.style.opacity = '1';
    let i = phaseAt(t);
    let step = TL[i];
    // a typing phase shows the previous frame until its first character lands
    if (step.type && Math.floor(step.type.text.length * seg(t, step.at, step.at + step.type.dur)) === 0 && i > 0) {
      i -= 1; step = TL[i];
    }
    const prev = i > 0 ? TL[i - 1].phase : null;
    // a seek lands through the previous phase, so what this phase mounts is the same however it was reached
    if (frozen && shown !== step.phase && prev && shown !== prev) show(prev);
    show(step.phase);
    // the live block (pill, who line, Creating placeholder) collapses into the answer on done, so the
    // done frame starts at its own framing; easing from the live offset would glide over a gap
    applyScrolls(step.phase, t, step.at, step.reveal ? null : prev);
    // re-framed so the ask is on screen: the app hides its "back to your prompt" bar in that case
    if (step.phase in feedOverride) {
      const bar = doc.querySelector('[data-slot="sticky-prompt"]');
      if (bar && bar.getAttribute('data-state') !== 'hidden') bar.setAttribute('data-state', 'hidden');
    }
    if (step.type) typeInto(step.type.text, Math.floor(step.type.text.length * seg(t, step.at, step.at + step.type.dur)));
    else if (caret && caret.parentNode) caret.remove();
    if (step.reveal) revealAnswer(t - step.at, step.reveal);
    if (/-[bcd]-/.test(step.phase)) tickClocks(t - step.at);
    syncClip(t);
    if (frozen) pinAnimations(t, step.at);
    camAt(t);
  }
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the stage to the window ----------
function fit() {
  const k = Math.min(innerWidth / SW, innerHeight / SH);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();

// the Record button and key hint sit over the app's header: shown only while the pointer moves
let idleTimer = 0;
function wake() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add('idle'), 2200);
}
document.body.classList.add('idle');
addEventListener('pointermove', wake);

// ---------- boot: the frame document, the measured framings, then the clock ----------
await new Promise((res) => {
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.querySelector('link[href="app.css"]')) res();
  else frame.addEventListener('load', res, { once: true });
});
doc = frame.contentDocument;
const q = new URLSearchParams(location.search);
const hasT = q.has('t');
frozen = hasT && !q.has('play');
if (frozen) { document.body.classList.add('freeze'); doc.documentElement.classList.add('ad-freeze'); }
if (doc.fonts && doc.fonts.ready) await doc.fonts.ready;
buildCamera();
shown = null;

// ---------- the clock ----------
const FPS = 60;
let paused = frozen, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
const T = Object.fromEntries(TL.map((s) => [s.phase, s.at]));
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frameLoop() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  if (frozen && !paused) resumeAnimations();
  frozen = paused;
  render(t);
  requestAnimationFrame(frameLoop);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frameLoop);
window.__AD = {
  CYCLE,
  T,
  segments: [{ kind: 'scene', id: 'app', t0: 0, t1: APP_END }, { kind: 'end', id: 'end', t0: APP_END, t1: CYCLE }],
  seek(t) { paused = true; frozen = true; offset = t; render(((t % CYCLE) + CYCLE) % CYCLE); },
  // frame export: resolves once the clip (when on screen) has decoded the sought frame
  settle() {
    const v = doc.querySelector('video[data-slot="embed-media-video"]');
    const decoded = !v || (!v.seeking && v.readyState >= 2) ? Promise.resolve() : new Promise((r) => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 1500); });
    return decoded.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  },
  ready: true,
};
