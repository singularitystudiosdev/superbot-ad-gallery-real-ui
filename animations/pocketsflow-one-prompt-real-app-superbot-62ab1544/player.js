// pocketsflow-one-prompt-real-app (62ab1544). Four acts on one clock:
//   1. X (x.js): Kai's post, "I made this in 1 prompt", the Pocketsflow launch film autoplaying in it;
//   2. the line: "They won't tell you how.";
//   3. the REAL superbot desktop renderer replaying the one prompt that made it. app/snaps.js is the app's
//      own DOM, captured per phase from superbot-desktop main driven through its provider_switch wire
//      (capture/capture.62ab1544.mjs): Gemini 3 Pro Image draws the mascot, Kling 3.0 animates it, Lyria 3 Pro
//      scores it, Claude Opus 5.5 reads pocketsflow.com, writes the Remotion cut and renders it. This file only
//      moves between those frames (a DOM morph, typing, eased scroll, live clocks, the two clips, which play
//      once on reveal as MediaReveal does) and films them
//      with a camera that is a second-order critically damped follow of per-phase framings, so every move
//      eases in and out and no two moves ever meet with a jolt;
//   4. the rendered film lifts out of its card into the frame, then the end card.
// Every visual is a pure function of t: window.__AD.seek(t) is frame-exact (CSS animations included).
import { clamp, lerp, seg, smoother, outCubic, outQuint, outBack, outSoft, op, hash01 } from './lib.js';
import { mountX, renderX, xVideo, X_DUR } from './x.js';

const SN = window.SB_SNAPS;
const VPW = SN.vp.w, VPH = SN.vp.h;          // the app's CSS viewport at its 1.2 zoom (1200 x 675)
const SW = 1920, SH = 1080, K = SW / VPW;     // stage px per app px

const PROMPT = 'make a 15s launch film for pocketsflow.com. 3D mascot, halftone look, upbeat score';

// ---------- the clock ----------
const UNTOLD = { in: 5.6, out: 7.6, end: 8.3 };
const APP_IN = 7.5;
const TL = [
  { at: APP_IN, phase: 'p00-idle' },
  { at: 8.4, phase: 'a0-focus' },
  { at: 8.7, phase: 'a1-typed', type: 2.3 },
  { at: 11.25, phase: 'b0-sent' },
  { at: 11.8, phase: 's1-a-switching', sw: 1 },
  { at: 12.45, phase: 's1-b-live', sw: 1 },
  { at: 13.8, phase: 's2-a-switching', sw: 2 },
  { at: 14.45, phase: 's2-b-live', sw: 2 },
  { at: 15.8, phase: 's3-a-switching', sw: 3 },
  { at: 16.45, phase: 's3-b-live', sw: 3 },
  { at: 17.8, phase: 's4-a-switching', sw: 4 },
  { at: 18.4, phase: 's4-b-live1', sw: 4 },
  { at: 19.1, phase: 's4-b-live2', sw: 4 },
  { at: 19.8, phase: 's4-b-live3', sw: 4 },
  { at: 20.5, phase: 's4-b-live4', sw: 4 },
  { at: 21.4, phase: 'z1-done', done: true },
];
const at = (phase) => TL.find((s) => s.phase === phase).at;
const SENT = at('b0-sent');
const DONE = at('z1-done');
// the answer, toured top to bottom: each stop centres one output in the feed
const TOUR = [
  { t: DONE, focus: 'image' },
  { t: DONE + 1.45, focus: 'clip' },
  { t: DONE + 4.55, focus: 'audio' },
  { t: DONE + 6.35, focus: 'film' },
];
const CLIP_PLAY = DONE + 1.8;                // Kling's clip plays in its card from its first frame, through the "psst"
const CLIP_STOP = DONE + 5.1;
const FILM_AT = DONE + 6.85;                 // the rendered film starts in its card
const LIFT = [FILM_AT + 1.45, FILM_AT + 2.55];
const FILM_END = FILM_AT + 6.85;             // "a store in minutes." lands at 6.5 s; the film's whip into checkout starts at 7.0 s
const END_AT = FILM_END - 0.15, END_DUR = 3.9;
const CYCLE = +(END_AT + END_DUR).toFixed(3);
const FILM_LEN = 15;

// the turn's time-lapse: what the clocks read (seconds of real work) at each beat of the replay
const ELAPSED = [
  [SENT, 0], [at('s1-a-switching'), 3], [at('s1-b-live'), 5], [at('s2-a-switching'), 31], [at('s2-b-live'), 34],
  [at('s3-a-switching'), 226], [at('s3-b-live'), 229], [at('s4-a-switching'), 262], [at('s4-b-live1'), 266],
  [at('s4-b-live2'), 281], [at('s4-b-live3'), 334], [at('s4-b-live4'), 351], [DONE, 398],
];
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

// the score row's 48 bars: audio-row.tsx downsamplePeaks over pf-score.mp3 (channel 0, peak per bucket, / loudest)
const PEAKS = [0.6573, 0.7555, 0.6493, 0.7144, 0.5838, 0.6897, 0.659, 0.6587, 0.3496, 0.9132, 0.9141, 0.8495, 0.9299, 0.9084, 0.7945, 0.8605, 0.741, 0.8927, 0.9232, 0.9147, 0.9115, 0.9011, 0.8024, 0.7227, 0.9162, 0.9036, 0.9147, 0.8088, 0.8103, 0.7739, 0.9002, 0.9167, 0.8782, 0.7582, 0.9774, 0.9209, 0.7655, 1, 0.9222, 0.9599, 0.817, 0.8621, 0.7228, 0.8961, 0.9341, 0.8543, 0.5707, 0.3263];

const stage = document.getElementById('stage');
const sX = document.getElementById('s-x');
const sUntold = document.getElementById('s-untold');
const sApp = document.getElementById('s-app');
const sFilm = document.getElementById('s-film');
const sEnd = document.getElementById('s-end');
const cam = document.getElementById('cam');
const frame = document.getElementById('app');
const appShade = document.getElementById('app-shade');
const filmBox = document.getElementById('film-box');
const film = document.getElementById('film');
const dip = document.getElementById('dip');
const show1 = (sec, on) => { sec.style.visibility = on ? 'visible' : 'hidden'; if (!on) sec.style.opacity = '0'; };

// ---------- snapshots ----------
const REF = /<x-ref k="(\d+)"><\/x-ref>/g;
const expanded = new Map();
const expand = (html) => html.replace(REF, (_, k) => expand(SN.T[+k]));
const htmlOf = (phase) => { if (!expanded.has(phase)) expanded.set(phase, expand(SN.S[phase].b)); return expanded.get(phase); };

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
  for (const x of [...a.attributes]) if (!b.hasAttribute(x.name)) a.removeAttribute(x.name);
  for (const x of b.attributes) if (a.getAttribute(x.name) !== x.value) a.setAttribute(x.name, x.value);
}
function morphNode(a, b) {
  if (a.nodeType !== 1) { if (a.data !== b.data) a.data = b.data; return; }
  // a playing <video> keeps its element (and its decoded frame) when the snapshot carries the same source
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

// one-time fixes on every freshly mounted frame: the signed-in account is Kai's (its initial too), the score
// row draws the peaks the real app decodes (the capture harness could not decode the served MP3), and every
// clip is muted like the app's own
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

// the prompt types at a person's cadence: quicker inside words, a breath after punctuation and spaces
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
  // the closing line is near the film: it streams as the tour reaches it
  let left = Math.round(total * seg(lt, 5.0, 5.9));
  nodes.forEach((n, i) => { const take = clamp(left, 0, full[i].length); setText(n, full[i].slice(0, take)); left -= take; });
  [...row.querySelectorAll(CARD_SEL)].forEach((el, i) => {
    const f = outSoft(seg(lt, 0.05 + i * 0.07, 0.65 + i * 0.07));
    el.style.opacity = lerp(0.3, 1, f).toFixed(3);
    el.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 14).toFixed(2)}px)`;
    el.style.filter = f >= 1 ? '' : `blur(${((1 - f) * 8).toFixed(2)}px)`;
  });
}

// ---------- clips inside the app ----------
const appVideo = (name) => [...doc.querySelectorAll('video')].find((v) => (v.getAttribute('src') || '').includes(name)) || null;
function driveVideo(v, want, running, len) {
  if (!v) return;
  const w = clamp(want, 0, len - 0.05);
  if (running) {
    if (v.paused) v.play().catch((e) => console.warn('clip play', e));
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

// ---------- scroll and camera: measured framings, then a second-order critically damped follow ----------
const FULL = { cx: VPW / 2, cy: VPH / 2, z: 1 };
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
  return { left: cx - w / 2, right: cx + w / 2, cx, w };
}
function frameRegion(top, bottom, col, zMax = 1.95, pad = 26) {
  const h = bottom - top + pad * 2;
  const z = clamp(Math.min((VPW * 0.94) / (col.w + 40), (VPH * 0.94) / h), 1, zMax);
  return { cx: col.cx, cy: (top + bottom) / 2, z };
}
async function viewComposer(phase) {
  show(phase); applyOtherScrolls(phase); await settleLayout(); setFeedTop(capturedFeedTop(phase));
  const comp = rectOf(doc.querySelector('[data-testid="composer"]'));
  const greet = rectOf(doc.querySelector('[data-testid="thread-idle"]')) || comp;
  const col = { cx: (comp.left + comp.right) / 2, w: comp.width };
  return frameRegion(Math.min(greet.top, comp.top), comp.bottom + 30, col, 1.7);
}
const LIVE_SPAN = 330;
async function viewLive(phase) {
  show(phase); applyOtherScrolls(phase); await settleLayout(); setFeedTop(capturedFeedTop(phase));
  const col = column();
  const bubbles = doc.querySelectorAll('[data-testid="feed"] [data-slot="message-row-bubble"]');
  const live = doc.querySelectorAll('[data-testid="live-provider-switch"]');
  const lastLive = live[live.length - 1];
  const bubble = rectOf(bubbles[bubbles.length - 1]);
  const lr = rectOf(lastLive) || bubble;
  // a media switch frames its pill, its who line and the head of its "Creating ..." frame (the rest of the
  // empty frame runs off the bottom); a chat switch frames its pill and its steps
  const pills = [...doc.querySelectorAll('[data-testid="live-provider-switch"] [data-testid="provider-switch-pill"]')];
  const pill = rectOf(pills[pills.length - 1]);
  const gen = rectOf([...doc.querySelectorAll('[data-testid="provider-switch-generating"]')].pop());
  let bottom = Math.max(lr.bottom, bubble ? bubble.bottom : 0);
  if (gen) bottom = Math.min(bottom, gen.top + 128);
  let top = Math.max(Math.min(bubble ? bubble.top : lr.top, lr.top), bottom - LIVE_SPAN);
  if (pill && gen) top = Math.min(top, pill.top - 72);
  const v = frameRegion(top, bottom, col, 1.9);
  // a tall stack keeps its newest rows in frame
  const hh = VPH / 2 / v.z;
  if (bottom - top + 60 > 2 * hh) v.cy = bottom + 30 - hh;
  return v;
}
// the answer's outputs, in the order the tour visits them
function outputs() {
  const media = [...doc.querySelectorAll('[data-testid="embed-media"]')];
  const vids = media.filter((m) => m.getAttribute('data-media') === 'video');
  return {
    image: doc.querySelector('[data-slot="image-card"]') || [...doc.querySelectorAll('img')].find((i) => (i.getAttribute('src') || '').includes('pf-mascot')),
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
let TOUR_VIEWS = [];
async function measureTour() {
  show('z1-done'); applyOtherScrolls('z1-done');
  await settleLayout();
  const feed = feedEl();
  const fr = rectOf(feed);
  const o = outputs();
  const col = column();
  const maxTop = feed.scrollHeight - feed.clientHeight;
  TOUR_TOPS = []; TOUR_VIEWS = [];
  for (const stop of TOUR) {
    // centre the stop's output (the audio stop takes the Opus block under it too) in the feed
    feed.scrollTop = 0;
    const a = rectOf(o[stop.focus]);
    let top = a.top, bottom = a.bottom;
    if (stop.focus === 'image') { const pill = rectOf(doc.querySelector('[data-slot="provider-switch-block"]')); if (pill) top = Math.min(top, pill.top); }
    if (stop.focus === 'audio' && o.opus) bottom = rectOf(o.opus).bottom;
    if (stop.focus === 'film') { const lead = [...doc.querySelectorAll('[data-slot="markdown-para"], [data-slot="answer-lead"]')].pop(); if (lead) top = Math.min(top, rectOf(lead).top); }
    const mid = (top + bottom) / 2 - fr.top;
    const st = clamp(mid - feed.clientHeight / 2, 0, maxTop);
    TOUR_TOPS.push(st);
    feed.scrollTop = st;
    const r1 = { top: top - (a.top - rectOf(o[stop.focus]).top), bottom: bottom - (a.top - rectOf(o[stop.focus]).top) };
    TOUR_VIEWS.push(frameRegion(r1.top, r1.bottom, col, stop.focus === 'film' ? 1.75 : 1.85, 30));
  }
}

// targets as functions of t (piecewise constant), then the follow
const VIEW = {};
function targetView(t) {
  if (t < APP_IN + 0.75) return FULL;
  if (t < SENT - 0.15) return VIEW.composer;
  if (t < DONE - 0.1) {
    let v = VIEW.sent;
    for (const s of TL) if (s.sw && t >= s.at - 0.12) v = VIEW[s.phase] || v;
    return v;
  }
  let v = TOUR_VIEWS[0];
  TOUR.forEach((s, i) => { if (t >= s.t - 0.1) v = TOUR_VIEWS[i]; });
  return v;
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
function buildTrack() {
  // state: [cx, cy, ln z, feedTop]; two critically damped stages in series per channel
  const t0 = APP_IN, t1 = LIFT[1] + 0.1;
  const tgt = (t) => { const v = targetView(t); return [v.cx, v.cy, Math.log(v.z), targetFeed(t)]; };
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
  TRACK = { t0, step: DT * every, s: out };
}
function trackAt(t) {
  const { t0, step, s } = TRACK;
  const f = clamp((t - t0) / step, 0, s.length - 1);
  const i = Math.floor(f), j = Math.min(s.length - 1, i + 1), u = f - i;
  return s[i].map((v, k) => lerp(v, s[j][k], u));
}
let camNow = { tx: 0, ty: 0, s: K };
function camApply(cx, cy, z, push) {
  const zz = z * push;
  const hw = VPW / 2 / zz, hh = VPH / 2 / zz;
  const x = clamp(cx, hw, VPW - hw), y = clamp(cy, hh, VPH - hh);
  const s = K * zz;
  camNow = { tx: SW / 2 - x * s, ty: SH / 2 - y * s, s };
  cam.style.transform = `translate(${camNow.tx.toFixed(2)}px, ${camNow.ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
}

// ---------- the line ----------
const untoldWords = [...sUntold.querySelectorAll('.w')];
function renderUntold(t) {
  const on = t >= UNTOLD.in - 0.05 && t < UNTOLD.end;
  show1(sUntold, on);
  if (!on) return;
  sUntold.style.opacity = '1';
  const out = smoother(seg(t, UNTOLD.out, UNTOLD.end));
  untoldWords.forEach((w, i) => {
    const f = outSoft(seg(t, UNTOLD.in + i * 0.1, UNTOLD.in + i * 0.1 + 0.75));
    const y = (1 - f) * 46 - out * 34;
    w.style.opacity = (f * (1 - out)).toFixed(4);
    w.style.transform = `translateY(${y.toFixed(2)}px)`;
    w.style.filter = `blur(${((1 - f) * 10 + out * 8).toFixed(2)}px)`;
  });
  // the backdrop clears as the line leaves, uncovering the app rising beneath it
  sUntold.style.background = `rgb(0 0 0 / ${(1 - smoother(seg(t, UNTOLD.out + 0.1, UNTOLD.end))).toFixed(4)})`;
}

// ---------- the lift: the film leaves its card for the frame ----------
let liftFrom = null;
function filmCardRect() {
  const v = appVideo('pocketsflow-launch');
  const surf = v && (v.closest('[data-slot="embed-media-surface"]') || v);
  if (!surf) return { x: 0, y: 0, w: SW, h: SH, r: 0 };
  const r = surf.getBoundingClientRect();
  return { x: camNow.tx + r.left * camNow.s, y: camNow.ty + r.top * camNow.s, w: r.width * camNow.s, h: r.height * camNow.s, r: 16 * camNow.s };
}
function renderFilm(t, frozen) {
  const on = t >= LIFT[0] && t < END_AT + 0.6;
  show1(sFilm, on);
  const want = t - FILM_AT;
  if (!on) { if (!film.paused) film.pause(); return; }
  sFilm.style.opacity = '1';
  if (!liftFrom || t <= LIFT[0] + 1e-3) liftFrom = filmCardRect();
  const f = smoother(seg(t, LIFT[0], LIFT[1]));
  const r = liftFrom;
  // out: the film settles back a touch and goes to black under the end card
  const outF = smoother(seg(t, FILM_END - 0.3, FILM_END + 0.1));
  const sc = lerp(1, 0.94, outF);
  const w = lerp(r.w, SW, f) * sc, h = lerp(r.h, SH, f) * sc;
  const x = lerp(r.x, 0, f) + (SW - SW * sc) / 2 * f, y = lerp(r.y, 0, f) + (SH - SH * sc) / 2 * f;
  filmBox.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  filmBox.style.width = `${w.toFixed(2)}px`;
  filmBox.style.height = `${h.toFixed(2)}px`;
  filmBox.style.borderRadius = `${lerp(r.r, 0, f) + outF * 18}px`;
  filmBox.style.opacity = (1 - outF).toFixed(4);
  driveVideo(film, want, !frozen && t < FILM_END, FILM_LEN);
  appShade.style.opacity = (0.75 * f).toFixed(4);
}

// ---------- the end card ----------
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
const end = { face: sEnd.querySelector('.face'), lines: [...sEnd.querySelectorAll('h1 span')], url: sEnd.querySelector('.url'), mark: makeMark(220) };
end.face.appendChild(end.mark.el);
function renderEnd(t) {
  const on = t >= END_AT;
  show1(sEnd, on);
  if (!on) return;
  const lt = t - END_AT;
  op(sEnd, smoother(seg(lt, 0, 0.45)));
  const f = seg(lt, 0.15, 0.75);
  op(end.face, f);
  end.face.style.transform = `scale(${lerp(0.55, 1, outBack(f)).toFixed(4)})`;
  end.lines.forEach((l, i) => {
    const g = outQuint(seg(lt, 0.4 + i * 0.16, 1.15 + i * 0.16));
    l.style.opacity = g.toFixed(4);
    l.style.transform = `translateX(${((1 - g) * 70).toFixed(2)}px)`;
  });
  op(end.url, outCubic(seg(lt, 1.05, 1.6)));
  end.mark.render(lt);
}

// ---------- one frame ----------
function phaseAt(t) { let i = 0; while (i + 1 < TL.length && TL[i + 1].at <= t) i++; return i; }
let frozen = false;
function renderApp(t) {
  const on = t >= APP_IN - 0.05 && t < LIFT[1] + 0.05;
  show1(sApp, on);
  if (!on) return;
  // the window rises into place under the line's exit
  const rise = smoother(seg(t, APP_IN, UNTOLD.end + 0.25));
  sApp.style.opacity = rise.toFixed(4);
  sApp.style.transform = `scale(${lerp(1.045, 1, rise).toFixed(5)})`;
  let i = phaseAt(t);
  let step = TL[i];
  if (step.type && typedCount(t - step.at, step.type) === 0 && i > 0) { i -= 1; step = TL[i]; }
  const prev = i > 0 ? TL[i - 1].phase : null;
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
    driveVideo(appVideo('pf-kling'), Math.min(t, CLIP_STOP) - CLIP_PLAY, !frozen && t >= CLIP_PLAY && t < CLIP_STOP, 5);
    driveVideo(appVideo('pocketsflow-launch'), t - FILM_AT, !frozen && t >= FILM_AT && t < LIFT[1], FILM_LEN);
  }
  if (frozen) pinAnimations(t, step.at);
  // the film's card gets a slow push while it plays, before it lifts out
  const push = 1 + 0.06 * smoother(seg(t, FILM_AT - 0.2, LIFT[0] + 0.2));
  camApply(cx, cy, Math.exp(lz), push);
}

function render(t) {
  const inX = t < X_DUR;
  show1(sX, inX);
  if (inX) { sX.style.opacity = '1'; renderX(t, frozen); }
  else { const xv = xVideo(); if (xv && !xv.paused) xv.pause(); }
  renderUntold(t);
  renderApp(t);
  renderFilm(t, frozen);
  renderEnd(t);
  dip.style.opacity = smoother(seg(t, CYCLE - 0.35, CYCLE)).toFixed(3);
}

// ---------- fit the stage to the window ----------
function fit() {
  const k = Math.min(innerWidth / SW, innerHeight / SH);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
let idleTimer = 0;
function wake() { document.body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => document.body.classList.add('idle'), 2200); }
document.body.classList.add('idle');
addEventListener('pointermove', wake);

// ---------- boot ----------
mountX(sX);
film.muted = true; film.defaultMuted = true;
await new Promise((res) => {
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.querySelector('link[href="app.css"]')) res();
  else frame.addEventListener('load', res, { once: true });
});
doc = frame.contentDocument;
const q = new URLSearchParams(location.search);
const hasT = q.has('t');
frozen = hasT && !q.has('play');
if (frozen) { document.body.classList.add('freeze'); doc.documentElement.classList.add('ad-freeze'); }
await Promise.all([document.fonts && document.fonts.ready, doc.fonts && doc.fonts.ready]);
VIEW.composer = await viewComposer('a1-typed');
VIEW.sent = await viewLive('b0-sent');
for (const s of TL) if (s.sw) VIEW[s.phase] = await viewLive(s.phase);
await measureTour();
buildTrack();
shown = null;

const FPS = 60;
let paused = frozen, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function restart() { offset = 0; t0 = performance.now(); paused = false; }
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frameLoop() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (frozen && !paused) { resumeAnimations(); document.body.classList.remove('freeze'); doc.documentElement.classList.remove('ad-freeze'); }
  frozen = paused;
  render(t);
  requestAnimationFrame(frameLoop);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frameLoop);
const T = Object.fromEntries(TL.map((s) => [s.phase, s.at]));
Object.assign(T, { untold: UNTOLD.in, done: DONE, film: FILM_AT, lift: LIFT[0], end: END_AT });
window.__AD = {
  CYCLE,
  T,
  segments: [
    { kind: 'scene', id: 'x', t0: 0, t1: X_DUR },
    { kind: 'card', id: 'untold', t0: UNTOLD.in, t1: UNTOLD.end },
    { kind: 'scene', id: 'app', t0: APP_IN, t1: LIFT[1] },
    { kind: 'scene', id: 'film', t0: LIFT[0], t1: FILM_END },
    { kind: 'end', id: 'end', t0: END_AT, t1: CYCLE },
  ],
  seek(t) { paused = true; frozen = true; offset = t; document.body.classList.add('freeze'); doc.documentElement.classList.add('ad-freeze'); render(((t % CYCLE) + CYCLE) % CYCLE); },
  // frame export: resolves once every on-screen clip has decoded the sought frame
  settle() {
    const vids = [...doc.querySelectorAll('video'), film, ...document.querySelectorAll('#s-x video')];
    const waits = vids.map((v) => (!v || (!v.seeking && v.readyState >= 2) ? Promise.resolve() : new Promise((r) => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 2000); })));
    return Promise.all(waits).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  },
  ready: true,
};
