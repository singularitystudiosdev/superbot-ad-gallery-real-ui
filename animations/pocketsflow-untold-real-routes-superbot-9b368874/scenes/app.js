// scenes/app.js (pocketsflow-untold-real-routes-superbot, 9b368874): act 3, the REAL superbot desktop app.
// app/snaps.js is the app's own DOM, captured per phase from superbot-desktop main driven through its
// provider_switch wire (capture/capture.9b368874.mjs), and app/app.css its own stylesheet. One prompt, "make a
// launch video for Pocketsflow", routed the way the superbot edge routes it (adapters/media-capabilities.ts), each
// switch there because the one before handed it something only it can use:
//   pocketsflow.com (the brand: logo, mascot, colours, pitch) -> Gemini 3.1 Flash Image (Nano Banana 2: the
//   site's mascot kept on-model, one clean still) -> Veo 3.1 (that still as its reference, animated into the
//   opening shot) -> Eleven Music v2.5 (the score) -> Claude Opus 5.5 (the Remotion cut, timed to the score, with
//   the titles, and the render).
// This file only moves between those frames (a DOM morph, typing, eased scroll, live clocks, the clips) and films
// them with a camera that is a second-order critically damped follow of per-phase framings; then the rendered film
// lifts out of its card into the frame, picking up where the X post's clip left off. The machinery is
// pocketsflow-one-prompt-real-app (62ab1544) player.js, as a scene module of this spot's engine.
// Every visual is a pure function of lt: the engine's seek is frame-exact (CSS animations included).
import { clamp, lerp, seg } from '../lib.js';

const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    return sy(clamp(u));
  };
}
const outSoft = cubicBezier(0.16, 1, 0.3, 1);
const hash01 = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const SN = window.SB_SNAPS;
const VPW = SN.vp.w, VPH = SN.vp.h;          // the app's CSS viewport at its 1.2 zoom (1200 x 675)
const SH = 1080, K = 1920 / VPW;             // stage px per app px

const PROMPT = 'make a launch video for Pocketsflow';

// ---------- the clock (scene-local seconds) ----------
const TL = [
  { at: 0, phase: 'p00-idle' },
  { at: 0.55, phase: 'a0-focus' },
  { at: 0.8, phase: 'a1-typed', type: 1.6 },
  { at: 2.5, phase: 'b0-sent' },
  { at: 2.9, phase: 'b1-thinking' },
  // the website pill only shows while it connects, so it holds; its reads then run as activity rows
  { at: 3.3, phase: 's1-a-switching', sw: 1 },
  { at: 4.15, phase: 's1-b-live1', sw: 1 },
  { at: 4.6, phase: 's1-b-live2', sw: 1 },
  { at: 5.05, phase: 's1-b-live3', sw: 1 },
  { at: 5.5, phase: 's1-c-done', sw: 1 },
  // each model switch: the pill (Switching to), then its who line and its "Creating ..." frame
  { at: 5.95, phase: 's2-a-switching', sw: 2 },
  { at: 6.65, phase: 's2-b-live', sw: 2 },
  { at: 7.95, phase: 's3-a-switching', sw: 3 },
  { at: 8.65, phase: 's3-b-live', sw: 3 },
  { at: 9.95, phase: 's4-a-switching', sw: 4 },
  { at: 10.65, phase: 's4-b-live', sw: 4 },
  { at: 11.95, phase: 's5-a-switching', sw: 5 },
  { at: 12.55, phase: 's5-b-live1', sw: 5 },
  { at: 13.15, phase: 's5-b-live2', sw: 5 },
  { at: 13.75, phase: 's5-b-live3', sw: 5 },
  { at: 14.5, phase: 'z1-done', done: true },
].filter((s) => SN.S[s.phase]);
const at = (phase) => TL.find((s) => s.phase === phase).at;
const SENT = at('b0-sent');
const DONE = at('z1-done');
// the answer, toured top to bottom: each stop centres one output in the feed
const TOUR = [
  { t: DONE, focus: 'still' },
  { t: DONE + 1.7, focus: 'clip' },
  { t: DONE + 4.5, focus: 'audio' },
  { t: DONE + 6.0, focus: 'film' },
];
const CLIP_PLAY = DONE + 1.95;                // Veo's shot plays in its card from its first frame: the mascot leans
const CLIP_MOTION = 2.2;                      // in, "psst", smiles (media/pf-veo.mp4 then holds that last frame)
const CLIP_LEN = 4;
const FILM_AT = DONE + 6.4;                   // the rendered film starts in its card...
const FILM_FROM = 5.8;                        // ...where the X post's clip stopped (tweet.js CLIP_T0 0.8 + 5 s)
const LIFT = [FILM_AT + 1.4, FILM_AT + 2.5];
// "You create. We handle the flow." lands, "flow." becomes the Pocketsflow lockup and its end card holds (13.25 to
// 15 s into the film)
const FILM_END = FILM_AT + 9.15;
const FILM_LEN = 15;
const DUR = +(FILM_END + 0.05).toFixed(3);

// the turn's time-lapse: what the clocks read (seconds of real work) at each beat of the replay
const ELAPSED = [
  ['b0-sent', 0], ['s1-a-switching', 2], ['s1-b-live1', 4], ['s1-b-live2', 9], ['s1-b-live3', 13], ['s1-c-done', 17],
  ['s2-a-switching', 19], ['s2-b-live', 21], ['s3-a-switching', 74], ['s3-b-live', 76], ['s4-a-switching', 168],
  ['s4-b-live', 170], ['s5-a-switching', 204], ['s5-b-live1', 206], ['s5-b-live2', 251], ['s5-b-live3', 289],
  ['z1-done', 336],
].filter(([p]) => SN.S[p]).map(([p, v]) => [at(p), v]);
function elapsedAt(t) {
  if (t <= ELAPSED[0][0]) return 0;
  for (let i = 1; i < ELAPSED.length; i++) {
    const [t1, v1] = ELAPSED[i], [t0, v0] = ELAPSED[i - 1];
    if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
  }
  return ELAPSED[ELAPSED.length - 1][1];
}
/** step-words.ts formatClock: "12s", then "1m 04s". */
const turnClock = (s) => { const n = Math.floor(s); return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`; };
const mediaClock = (s) => { const n = Math.max(0, Math.floor(s)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

// the score row's 48 bars: audio-row.tsx downsamplePeaks (channel 0, peak per bucket, / loudest) over a real 15 s
// launch score (CREDITS.txt); the spot is silent, so only its peaks ship
const PEAKS = [0.6573, 0.7555, 0.6493, 0.7144, 0.5838, 0.6897, 0.659, 0.6587, 0.3496, 0.9132, 0.9141, 0.8495, 0.9299, 0.9084, 0.7945, 0.8605, 0.741, 0.8927, 0.9232, 0.9147, 0.9115, 0.9011, 0.8024, 0.7227, 0.9162, 0.9036, 0.9147, 0.8088, 0.8103, 0.7739, 0.9002, 0.9167, 0.8782, 0.7582, 0.9774, 0.9209, 0.7655, 1, 0.9222, 0.9599, 0.817, 0.8621, 0.7228, 0.8961, 0.9341, 0.8543, 0.5707, 0.3263];

let sec = null, cam = null, frame = null, appShade = null, filmBox = null, film = null;
let doc = null;

// ---------- snapshots ----------
const REF = /<x-ref k="(\d+)"><\/x-ref>/g;
const expanded = new Map();
const expand = (html) => html.replace(REF, (_, k) => expand(SN.T[+k]));
const htmlOf = (phase) => { if (!expanded.has(phase)) expanded.set(phase, expand(SN.S[phase].b)); return expanded.get(phase); };
const templates = new Map();
function templateOf(phase) {
  if (!templates.has(phase)) {
    const tpl = doc.createElement('template');
    tpl.innerHTML = htmlOf(phase);
    templates.set(phase, tpl);
  }
  return templates.get(phase);
}

// ---------- morph: patch the live DOM toward a snapshot, so unchanged nodes stay put ----------
let fresh = new Set();
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
  for (const x of [...a.attributes]) if (!b.hasAttribute(x.name) && !x.name.startsWith('data-ad-')) a.removeAttribute(x.name);
  for (const x of b.attributes) if (a.getAttribute(x.name) !== x.value) a.setAttribute(x.name, x.value);
}
function morphNode(a, b) {
  if (a.nodeType !== 1) { if (a.data !== b.data) a.data = b.data; return; }
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
  for (const x of [...de.attributes]) if (!(x.name in s.html)) de.removeAttribute(x.name);
  for (const [k, v] of Object.entries(s.html)) if (de.getAttribute(k) !== v) de.setAttribute(k, v);
  if (freeze) de.classList.add('ad-freeze');
  for (const x of [...doc.body.attributes]) if (!(x.name in s.body)) doc.body.removeAttribute(x.name);
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
  patchStatic();
  return true;
}

// one-time fixes on every freshly mounted frame: the signed-in account is Kai's (its initial too), the score row
// draws the peaks the real app decodes (the capture could not decode the served MP3), and every clip is muted like
// the app's own
function patchStatic() {
  for (const el of doc.querySelectorAll('[data-slot="avatar-initials"], .awc-avatar')) if (el.textContent === 'H') el.textContent = 'K';
  for (const wave of doc.querySelectorAll('[data-slot="audio-row-wave"]')) {
    if (wave.getAttribute('data-state') !== 'ready') wave.setAttribute('data-state', 'ready');
    const groups = wave.querySelectorAll(':scope > span, [data-slot="audio-row-played"] > span > span');
    for (const g of groups) [...g.querySelectorAll('[data-slot="audio-row-bar"]')].forEach((b, i) => { b.style.height = `${(PEAKS[i] * 100).toFixed(2)}%`; });
  }
  for (const v of doc.querySelectorAll('video')) { v.muted = true; v.defaultMuted = true; v.removeAttribute('controls'); }
}

// ---------- text ----------
const touched = new Map();
function setText(node, text) {
  if (!touched.has(node)) touched.set(node, node.data);
  if (node.data !== text) node.data = text;
}
function textNodes(root) {
  const out = [];
  const w = (root.ownerDocument || root).createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}

// the prompt types at a person's cadence: quicker inside words, a breath after spaces
const TYPE_AT = (() => {
  const gaps = [...PROMPT].map((ch, i) => (0.55 + 0.9 * hash01(i)) * (ch === ' ' ? 1.35 : /[.,]/.test(ch) ? 2.6 : 1));
  const total = gaps.reduce((a, b) => a + b, 0);
  let acc = 0;
  return gaps.map((g) => (acc += g) / total);
})();
const typedCount = (lt, dur) => { const f = lt / dur; let n = 0; while (n < TYPE_AT.length && TYPE_AT[n] <= f) n++; return n; };

let caret = null;
function typeInto(n) {
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

// ---------- clocks: the turn's own time-lapse ----------
function tickClocks(t, step) {
  const e = elapsedAt(t);
  for (const el of doc.querySelectorAll('.sb-sonar-clock-digits, [data-slot="chat-row-live"] [style*="--sb-clock-chars"]')) {
    const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    if (!node) continue;
    const v = turnClock(e);
    setText(node, v);
    el.style.setProperty('--sb-clock-chars', String(v.length));
  }
  if (step.sw) {
    const live = TL.find((s) => s.sw === step.sw && /-b-live/.test(s.phase));
    const from = live ? elapsedAt(live.at) : e;
    for (const el of doc.querySelectorAll('[data-slot="media-pending-clock"]')) {
      const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
      if (node) setText(node, mediaClock(e - from));
    }
  }
  if (step.done) {
    for (const meta of doc.querySelectorAll('[data-slot="turn-head-meta"]')) {
      const node = [...meta.childNodes].reverse().find((n) => n.nodeType === 3);
      if (node) setText(node, turnClock(elapsedAt(DONE)));
    }
  }
}

// ---------- the answer: its prose streams, its cards settle in the way MediaReveal does (blur to sharp) ----------
const CARD_SEL = '[data-slot="image-card"], [data-testid="embed-media"], [data-slot="provider-switch-block"], [data-slot="reply-footer"]';
function lastRow() {
  const rows = doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]');
  return rows[rows.length - 1] || null;
}
function revealAnswer(lt) {
  const row = lastRow();
  if (!row) return;
  const paras = [...row.querySelectorAll('[data-slot="answer-lead"], [data-slot="markdown-para"]')].filter((p) => !p.closest('[data-slot="provider-switch-block"]'));
  const nodes = paras.flatMap(textNodes);
  const full = nodes.map((n) => (touched.has(n) ? touched.get(n) : n.data));
  const total = full.reduce((a, s) => a + s.length, 0);
  // the closing line sits over the film: it streams as the tour reaches it
  let left = Math.round(total * seg(lt, TOUR[3].t - DONE - 0.6, TOUR[3].t - DONE + 0.2));
  nodes.forEach((n, i) => { const take = clamp(left, 0, full[i].length); setText(n, full[i].slice(0, take)); left -= take; });
  // a short settle, so the swap from the live rows to the answer reads as one motion and is legible in ~0.4 s
  [...row.querySelectorAll(CARD_SEL)].forEach((el, i) => {
    const f = outSoft(seg(lt, i * 0.04, 0.42 + i * 0.04));
    el.style.opacity = lerp(0.55, 1, f).toFixed(3);
    el.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
    el.style.filter = f >= 1 ? '' : `blur(${((1 - f) * 4).toFixed(2)}px)`;
  });
}

// ---------- clips inside the app ----------
const appVideo = (name) => [...doc.querySelectorAll('video')].find((v) => (v.getAttribute('src') || '').includes(name)) || null;
function driveVideo(v, want, running, len) {
  if (!v) return;
  const w = clamp(want, 0, len - 0.05);
  if (running) {
    if (v.paused) v.play().catch((e) => console.warn('app.js: clip play', e));
    if (Math.abs(v.currentTime - w) > 0.25) v.currentTime = w;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - w) > 0.02) v.currentTime = w;
  }
}
// Frame-exact CSS: while seeking, every animation in the app frame is pinned to t. An entrance on a node this
// phase inserted plays from the phase start; one on an older node has finished; a loop runs on the absolute clock.
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
function resumeAnimations() { for (const a of doc.getAnimations()) if (a.playState === 'paused') a.play(); }

// ---------- scroll and camera: measured regions, framed for the stage width, then a damped follow ----------
const feedEl = () => doc.querySelector('[data-testid="feed"]');
const capturedFeedTop = (phase) => { const s = SN.S[phase].scrolls.find((x) => x.testid === 'feed'); return s ? s.top : 0; };
function setFeedTop(v) { const f = feedEl(); if (f) f.scrollTop = v; }
function applyOtherScrolls(phase) {
  for (const s of SN.S[phase].scrolls) {
    if (s.testid === 'feed') continue;
    const el = doc.querySelector(`[data-ad-scroll="${s.k}"]`);
    if (el) { el.scrollTop = s.top; el.scrollLeft = s.left; }
  }
}
const rectOf = (el) => (el ? el.getBoundingClientRect() : null);
// the thread's column: the chat measure (--hub-chat-measure, 600px), centred over the composer; the one stable
// horizontal frame across phases (the date rule and the sticky bar span the whole pane)
function column() {
  const comp = rectOf(doc.querySelector('[data-testid="composer"]'));
  const root = doc.querySelector('.hub-root');
  const w = (root && parseFloat(getComputedStyle(root).getPropertyValue('--hub-chat-measure'))) || 600;
  const cx = (comp.left + comp.right) / 2;
  return { cx, w, cw: comp.width };
}
// a region is what must be in shot; its framing depends on how wide the stage is (window.AR)
const region = (top, bottom, col, zMax = 1.95, pad = 26, keepBottom = false) => ({ top, bottom, col, zMax, pad, keepBottom });
const FULL = { full: true };
// the thread pane's centre and the composer's width (measured): a stage narrower than 16:9 frames the pane, not the
// window, and never cuts the composer (736 px, wider than the 600 px chat measure)
let COL_CX = VPW / 2, COL_CW = 736;
function frameOf(r, VW) {
  const narrow = VW < VPW - 1;
  if (r.full) return narrow ? { cx: COL_CX, cy: VPH / 2, z: Math.min(1, (VW * 0.98) / (COL_CW + 24)) } : { cx: VPW / 2, cy: VPH / 2, z: 1 };
  const h = r.bottom - r.top + r.pad * 2;
  // a stage narrower than the column may pull back past the window's own size (the app then sits letterboxed)
  // rather than cut the thread's sides off
  const fitNarrow = (VW * 0.98) / (Math.max(r.col.w, r.col.cw || 0) + 24);
  const zMin = Math.min(1, fitNarrow);
  const fitW = narrow ? fitNarrow : (VW * 0.94) / (r.col.w + 40);
  const z = clamp(Math.min(fitW, (VPH * 0.94) / h), zMin, r.zMax);
  const v = { cx: r.col.cx, cy: (r.top + r.bottom) / 2, z };
  // a tall stack keeps its newest rows in frame, just above the composer
  const hh = VPH / 2 / z;
  if (r.keepBottom && r.bottom - r.top + 40 > 2 * hh) v.cy = r.bottom + 2 - hh;
  return v;
}
async function regionComposer(phase) {
  show(phase); applyOtherScrolls(phase); await settleLayout(); setFeedTop(capturedFeedTop(phase));
  const comp = rectOf(doc.querySelector('[data-testid="composer"]'));
  const greet = rectOf(doc.querySelector('[data-testid="thread-idle"]')) || comp;
  return region(Math.min(greet.top, comp.top), comp.bottom + 30, { cx: (comp.left + comp.right) / 2, w: comp.width }, 1.7);
}
const LIVE_SPAN = 330;
async function regionLive(phase) {
  show(phase); applyOtherScrolls(phase); await settleLayout(); setFeedTop(capturedFeedTop(phase));
  const col = column();
  const bubbles = doc.querySelectorAll('[data-testid="feed"] [data-slot="message-row-bubble"]');
  const live = doc.querySelectorAll('[data-testid="live-provider-switch"]');
  const bubble = rectOf(bubbles[bubbles.length - 1]);
  const lr = rectOf(live[live.length - 1]) || bubble;
  // a media switch frames its pill, its who line and the head of its "Creating ..." frame (the rest of the empty
  // frame runs off the bottom); the website switch frames its pill and the activity rows above it
  const pills = [...doc.querySelectorAll('[data-testid="live-provider-switch"] [data-testid="provider-switch-pill"]')];
  const pill = rectOf(pills[pills.length - 1]);
  const gen = rectOf([...doc.querySelectorAll('[data-testid="provider-switch-generating"]')].pop());
  const comp = rectOf(doc.querySelector('[data-testid="composer"]'));
  let bottom = Math.max(lr.bottom, bubble ? bubble.bottom : 0);
  // a "Creating ..." frame is framed by its head (label and clock), not its empty body
  if (gen) bottom = Math.min(bottom, gen.top + 64);
  // the composer's border never cuts the newest row
  if (comp) bottom = Math.min(bottom, comp.top - 14);
  let top = Math.max(Math.min(bubble ? bubble.top : lr.top, lr.top), bottom - LIVE_SPAN);
  if (pill && gen) top = Math.min(top, pill.top - 72);
  return region(top, bottom, col, 1.9, 22, true);
}
// the answer's outputs, in the order the tour visits them
function outputs() {
  const media = [...doc.querySelectorAll('[data-testid="embed-media"]')];
  const vids = media.filter((m) => m.getAttribute('data-media') === 'video');
  return {
    still: doc.querySelector('[data-slot="image-card"]'),
    clip: vids[0] || null,
    audio: media.find((m) => m.getAttribute('data-media') === 'audio') || null,
    opus: [...doc.querySelectorAll('[data-slot="provider-switch-block"]')].pop() || null,
    film: vids[vids.length - 1] || null,
  };
}
/** One rendering frame plus decoded media, so content-visibility rows and media cards have their real size. */
async function settleLayout() {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const imgs = [...doc.images].map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => undefined)));
  const vids = [...doc.querySelectorAll('video')].map((v) => (v.readyState >= 1 ? Promise.resolve() : new Promise((r) => { v.addEventListener('loadedmetadata', r, { once: true }); setTimeout(r, 4000); })));
  await Promise.all([...imgs, ...vids]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
let TOUR_TOPS = [];
let TOUR_REGIONS = [];
async function measureTour() {
  show('z1-done'); applyOtherScrolls('z1-done');
  await settleLayout();
  const feed = feedEl();
  const fr = rectOf(feed);
  const o = outputs();
  const col = column();
  const maxTop = feed.scrollHeight - feed.clientHeight;
  TOUR_TOPS = []; TOUR_REGIONS = [];
  for (const stop of TOUR) {
    // centre the stop's output in the feed; the still's stop takes its switch block above it (Gemini 3.1 Flash
    // Image), the audio stop takes the Opus block under it, the film stop the closing line over it
    feed.scrollTop = 0;
    const el = o[stop.focus];
    const a = rectOf(el);
    let top = a.top, bottom = a.bottom;
    if (stop.focus === 'still') { const first = rectOf(doc.querySelector('[data-slot="provider-switch-block"]')); if (first) top = Math.min(top, first.top); }
    if (stop.focus === 'audio' && o.opus) bottom = rectOf(o.opus).bottom;
    if (stop.focus === 'film') { const lead = [...doc.querySelectorAll('[data-slot="markdown-para"], [data-slot="answer-lead"]')].pop(); if (lead) top = Math.min(top, rectOf(lead).top); }
    const mid = (top + bottom) / 2 - fr.top;
    const st = clamp(mid - feed.clientHeight / 2, 0, maxTop);
    TOUR_TOPS.push(st);
    feed.scrollTop = st;
    const dy = a.top - rectOf(el).top;
    TOUR_REGIONS.push(region(top - dy, bottom - dy, col, stop.focus === 'film' ? 1.75 : 1.85, 30));
  }
}

// targets as functions of t (piecewise constant), then the follow
const REGION = {};
function targetRegion(t) {
  if (t < 0.75) return FULL;
  if (t < SENT - 0.15) return REGION.composer;
  if (t < DONE - 0.1) {
    let r = REGION.sent;
    for (const s of TL) if (s.sw && t >= s.at - 0.12) r = REGION[s.phase] || r;
    return r;
  }
  let r = TOUR_REGIONS[0];
  TOUR.forEach((s, i) => { if (t >= s.t - 0.1) r = TOUR_REGIONS[i]; });
  return r;
}
function targetFeed(t) {
  if (t < DONE) {
    let p = TL[0].phase;
    for (const s of TL) if (t >= s.at) p = s.phase;
    return capturedFeedTop(p);
  }
  let v = TOUR_TOPS[0];
  TOUR.forEach((s, i) => { if (t >= s.t) v = TOUR_TOPS[i]; });
  return v;
}
const DT = 1 / 240, OMEGA = 7.2, FEED_OMEGA = 9;
let TRACK = null;
function buildTrack(SW) {
  // state: [cx, cy, ln z, feedTop]; two critically damped stages in series per channel
  const VW = SW / K;
  const t0 = 0, t1 = LIFT[1] + 0.1;
  const tgt = (t) => { const v = frameOf(targetRegion(t), VW); return [v.cx, v.cy, Math.log(v.z), targetFeed(t)]; };
  const om = [OMEGA, OMEGA, OMEGA, FEED_OMEGA];
  let x = tgt(t0), vx = [0, 0, 0, 0], y = x.slice(), vy = [0, 0, 0, 0];
  const out = [];
  const every = 4; // keep one sample per 1/60 s
  for (let i = 0, t = t0; t <= t1 + 1e-9; i++, t = t0 + i * DT) {
    if (i % every === 0) out.push(y.slice());
    const g = tgt(t);
    for (let k = 0; k < 4; k++) {
      const w = om[k];
      vx[k] += (w * w * (g[k] - x[k]) - 2 * w * vx[k]) * DT; x[k] += vx[k] * DT;
      vy[k] += (w * w * (x[k] - y[k]) - 2 * w * vy[k]) * DT; y[k] += vy[k] * DT;
    }
  }
  TRACK = { t0, step: DT * every, s: out, SW };
}
function trackAt(t) {
  const { t0, step, s } = TRACK;
  const f = clamp((t - t0) / step, 0, s.length - 1);
  const i = Math.floor(f), j = Math.min(s.length - 1, i + 1), u = f - i;
  return s[i].map((v, k) => lerp(v, s[j][k], u));
}
let camNow = { tx: 0, ty: 0, s: K };
// keep the window covering the stage on an axis it can cover; centre it on one it cannot (a pulled-back narrow stage)
const clampAxis = (c, half, size) => (half * 2 >= size ? size / 2 : clamp(c, half, size - half));
function camApply(cx, cy, z, push, SW) {
  const zz = z * push;
  const hw = SW / K / 2 / zz, hh = VPH / 2 / zz;
  const x = clampAxis(cx, hw, VPW), y = clampAxis(cy, hh, VPH);
  const s = K * zz;
  camNow = { tx: SW / 2 - x * s, ty: SH / 2 - y * s, s };
  cam.style.transform = `translate(${camNow.tx.toFixed(2)}px, ${camNow.ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
}

// ---------- the lift: the film leaves its card for the frame ----------
let liftFrom = null;
function filmCardRect(SW) {
  const v = appVideo('clip.mp4');
  const surf = v && (v.closest('[data-slot="embed-media-surface"]') || v);
  if (!surf) return { x: 0, y: 0, w: SW, h: SH, r: 0 };
  const r = surf.getBoundingClientRect();
  return { x: camNow.tx + r.left * camNow.s, y: camNow.ty + r.top * camNow.s, w: r.width * camNow.s, h: r.height * camNow.s, r: 16 * camNow.s };
}
function renderFilm(t, frozen, SW) {
  const on = t >= LIFT[0];
  filmBox.style.visibility = on ? 'visible' : 'hidden';
  if (!on) { filmBox.style.opacity = '0'; if (!film.paused) film.pause(); appShade.style.opacity = '0'; liftFrom = null; return; }
  filmBox.style.opacity = '1';
  if (!liftFrom || t <= LIFT[0] + 1e-3) liftFrom = filmCardRect(SW);
  const f = smoother(seg(t, LIFT[0], LIFT[1]));
  const r = liftFrom;
  filmBox.style.transform = `translate(${lerp(r.x, 0, f).toFixed(2)}px, ${lerp(r.y, 0, f).toFixed(2)}px)`;
  filmBox.style.width = `${lerp(r.w, SW, f).toFixed(2)}px`;
  filmBox.style.height = `${lerp(r.h, SH, f).toFixed(2)}px`;
  filmBox.style.borderRadius = `${lerp(r.r, 0, f).toFixed(2)}px`;
  driveVideo(film, FILM_FROM + t - FILM_AT, !frozen && t < FILM_END, FILM_LEN);
  appShade.style.opacity = (0.75 * f).toFixed(4);
}

// ---------- one frame ----------
function phaseAt(t) { let i = 0; while (i + 1 < TL.length && TL[i + 1].at <= t) i++; return i; }
let wasFrozen = false;
function renderApp(t, frozen, SW) {
  if (frozen !== wasFrozen) {
    doc.documentElement.classList.toggle('ad-freeze', frozen);
    if (!frozen) resumeAnimations();
    wasFrozen = frozen;
  }
  let i = phaseAt(t);
  let step = TL[i];
  if (step.type && typedCount(t - step.at, step.type) === 0 && i > 0) { i -= 1; step = TL[i]; }
  const prev = i > 0 ? TL[i - 1].phase : null;
  // a seek that lands mid-phase mounts the phase before first, so this phase's own entrances are the fresh nodes
  if (frozen && shown !== step.phase && prev && shown !== prev) show(prev);
  show(step.phase);
  applyOtherScrolls(step.phase);
  const [cx, cy, lz, feedTop] = trackAt(t);
  setFeedTop(feedTop);
  if (step.type) typeInto(typedCount(t - step.at, step.type));
  else if (caret && caret.parentNode) caret.remove();
  if (step.done) revealAnswer(t - step.at);
  if (t >= SENT) tickClocks(t, step);
  // "Jump to latest" is the app's answer to a reader parked above the newest row; the tour is that reader
  // scrolling down, so the pill steps aside as the scroll starts
  const jump = doc.querySelector('[data-slot="jump-seat"]');
  if (jump) jump.style.opacity = step.done ? (1 - smoother(seg(t, DONE + 0.2, DONE + 0.6))).toFixed(3) : '';
  if (step.done) {
    // Veo's shot plays once from its first frame, then rests on its last (the clip itself holds it)
    driveVideo(appVideo('pf-veo'), t - CLIP_PLAY, !frozen && t >= CLIP_PLAY && t < CLIP_PLAY + CLIP_MOTION, CLIP_LEN);
    driveVideo(appVideo('clip.mp4'), FILM_FROM + Math.max(0, t - FILM_AT), !frozen && t >= FILM_AT && t < LIFT[1], FILM_LEN);
  }
  if (frozen) pinAnimations(t, step.at);
  // sending re-lays the window out in one frame (the app's own send motion is off): a short dip carries the cut
  const dip = 1 - clamp(Math.abs(t - SENT) / 0.16);
  frame.style.opacity = dip > 0 ? (1 - 0.4 * smoother(dip)).toFixed(3) : '';
  // the film's card gets a slow push while it plays, before it lifts out
  const push = 1 + 0.06 * smoother(seg(t, FILM_AT - 0.2, LIFT[0] + 0.2));
  camApply(cx, cy, Math.exp(lz), push, SW);
}

// ---------- mount and measure ----------
let resolveReady;
const ready = new Promise((r) => { resolveReady = r; });
async function boot() {
  await new Promise((res) => {
    if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.querySelector('link[href="app.css"]')) res();
    else frame.addEventListener('load', res, { once: true });
  });
  doc = frame.contentDocument;
  await Promise.all([document.fonts && document.fonts.ready, doc.fonts && doc.fonts.ready]);
  show('p00-idle'); await settleLayout();
  ({ cx: COL_CX, cw: COL_CW } = column());
  REGION.composer = await regionComposer('a1-typed');
  REGION.sent = await regionLive('b0-sent');
  for (const s of TL) if (s.sw) REGION[s.phase] = await regionLive(s.phase);
  await measureTour();
  buildTrack((window.AR && window.AR.w) || 1920);
  shown = null;
  touched.clear();
}

export default {
  id: 'app',
  dur: DUR,
  ready,
  mount(section) {
    sec = section;
    section.innerHTML = `
<div class="app-cam">
  <iframe class="app-frame" src="app/frame.html" scrolling="no" title="superbot" tabindex="-1"></iframe>
  <div class="lights"><i></i><i></i><i></i></div>
</div>
<div class="app-shade"></div>
<div class="film-box"><video muted playsinline preload="auto" src="img/pf/clip.mp4"></video></div>`;
    cam = section.querySelector('.app-cam');
    frame = section.querySelector('.app-frame');
    appShade = section.querySelector('.app-shade');
    filmBox = section.querySelector('.film-box');
    film = filmBox.querySelector('video');
    film.muted = true; film.defaultMuted = true;
    // the engine renders only the active scene: once it moves on, park every clip instead of decoding off screen
    new MutationObserver(() => {
      if (section.classList.contains('on')) return;
      if (!film.paused) film.pause();
      if (doc) for (const v of doc.querySelectorAll('video')) if (!v.paused) v.pause();
    }).observe(section, { attributes: true, attributeFilter: ['class'] });
    boot().then(resolveReady, (err) => { console.error('app.js: boot failed', err); resolveReady(); });
  },
  render(lt, ctx) {
    if (!TRACK) return;
    const SW = (ctx && ctx.W) || 1920;
    if (TRACK.SW !== SW) buildTrack(SW);
    const t = clamp(lt, 0, DUR);
    const frozen = document.body.classList.contains('freeze');
    renderApp(t, frozen, SW);
    renderFilm(t, frozen, SW);
  },
  // frame export: resolves once every on-screen clip has decoded the sought frame
  settle() {
    if (!doc) return ready;
    const vids = [...doc.querySelectorAll('video'), film];
    const imgs = [...doc.images].map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => undefined)));
    const waits = vids.map((v) => (!v.seeking && v.readyState >= 2 ? Promise.resolve() : new Promise((r) => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 2000); })));
    return Promise.all([...waits, ...imgs]);
  },
  T: Object.assign(Object.fromEntries(TL.map((s) => [s.phase, s.at])), { done: DONE, film: FILM_AT, lift: LIFT[0] }),
};
