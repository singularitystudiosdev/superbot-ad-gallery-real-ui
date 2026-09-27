// prometheus-every-model-superbot: the engine (inherited from do-that-too-superbot by way of
// mariokart-every-model-superbot-7aec3197). The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock.
// It lays SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active). The
// engine can also draw black text cards and an end card; this spot uses neither.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence (CONTRACT.txt) ----------
// prometheus-every-model-superbot: the hub cropped to its thread, opening on the empty state, then the one-ask chat
// "make a video on western civilization" (scenes/tabs-assets/chat.js: every model on its own chapter, ?v=3 picks the
// routing, and the page plays the same build without the query), then the payoff: the prometheus-ii.mp4 player window
// the chat rendered grows to full frame and plays the post's real clip (scenes/clip.js). The ad ENDS on that clip:
// no end card, the last frame is the montage's own last frame (the source's final frame), unfaded.
const SEQUENCE = [
  ['scene', 'tabs'],
  ['scene', 'clip'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape); clip = the montage's 679
// frames at 30fps
const FALLBACK_DUR = { tabs: 36, clip: 22.6333 };
const SCENE_FADE = 0.3;
const END_DUR = 4.4, DIP = 0.35;

// ---------- text cards ----------
// A part is a word string, or { img, cls, alt, after } for a brand wordmark (after = trailing punctuation),
// or { html } for styled words. The last part and the logo are kept on one line (never orphan the logo).
// This spot plays no text cards (SEQUENCE is two scenes), so the engine's card table is empty: the template's copy
// cards and the brand wordmarks only they drew were retired with the retheme. K resolves to 1 on an empty table.
const CARDS = {};
// card motion (seconds, local): words rise 18px + unblur 8px, outQuint .55s, staggered .06s
// The design timings are scaled by one factor K shared by every card, chosen so the busiest card still has
// its text fully landed and its logo fully popped READ_HOLD seconds before its exit starts (same motion on all).
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.3, READ_HOLD = 1.2;
const BASE = { in: 0.12, stag: 0.06, dur: 0.55, gap: 0.15, logo: 0.45 };
const settleAt = (c, k) => k * (BASE.in + (c.parts.length - 1) * BASE.stag + BASE.dur + (c.logo ? BASE.gap + BASE.logo : 0));
const K = Math.min(1, ...Object.values(CARDS).map((c) => (c.dur - CARD_OUT - READ_HOLD) / settleAt(c, 1)));
const W_IN = BASE.in * K, W_STAG = BASE.stag * K, W_DUR = BASE.dur * K, LOGO_GAP = BASE.gap * K, LOGO_DUR = BASE.logo * K;

function buildCard(sec, spec) {
  sec.classList.add('card');
  const line = document.createElement('p');
  line.className = 'cl';
  const words = [], grads = [];
  const mk = (part) => {
    const w = document.createElement('span');
    w.className = 'w';
    if (typeof part === 'string') w.textContent = part;
    else if (part.g) {
      // gradient words: the gradient lives on an INNER span so the outer .w can carry the blur filter and
      // the rise without fighting background-clip:text (no filter + clip on one element)
      const gt = document.createElement('span');
      gt.className = 'gt'; gt.textContent = part.g;
      w.appendChild(gt); grads.push(gt);
    }
    else if (part.html) w.innerHTML = part.html;
    else {
      const img = document.createElement('img');
      img.className = part.cls; img.src = part.img; img.alt = part.alt || ''; img.decoding = 'sync';
      w.appendChild(img);
      if (part.after) w.appendChild(document.createTextNode(part.after));
    }
    words.push(w);
    return w;
  };
  const parts = spec.parts;
  parts.slice(0, -1).forEach((p) => { line.appendChild(mk(p)); line.appendChild(document.createTextNode(' ')); });
  const tail = document.createElement('span');
  tail.className = 'tail';
  tail.appendChild(mk(parts[parts.length - 1]));
  let logo = null;
  if (spec.logo) {
    logo = document.createElement('img');
    logo.className = spec.logo.cls; logo.src = spec.logo.src; logo.alt = spec.logo.alt; logo.decoding = 'sync';
    tail.appendChild(logo);
  }
  line.appendChild(tail);
  sec.appendChild(line);
  const land = W_IN + (words.length - 1) * W_STAG + W_DUR;
  return { line, words, logo, land, logoAt: land + LOGO_GAP, grads, gm: null };
}

function renderCard(c, lt, dur) {
  c.words.forEach((w, i) => {
    const p = outQuint(seg(lt, W_IN + i * W_STAG, W_IN + i * W_STAG + W_DUR));
    w.style.opacity = clamp(p * 1.15).toFixed(3);
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * W_RISE).toFixed(2)}px)`;
    w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * W_BLUR).toFixed(2)}px)`;
  });
  if (c.logo) {
    const f = seg(lt, c.logoAt, c.logoAt + LOGO_DUR);
    c.logo.style.opacity = outCubic(clamp(f * 2.2)).toFixed(3);
    c.logo.style.transform = `scale(${lerp(0.6, 1, outBack(f)).toFixed(4)})`;
  }
  if (c.grads.length) renderGrads(c, lt);
  const e = inOutCubic(seg(lt, dur - CARD_OUT, dur));
  c.line.style.opacity = (1 - e).toFixed(3);
  c.line.style.transform = e > 0 ? `scale(${lerp(1, 0.985, e).toFixed(4)})` : 'none';
}

// ---------- the animated brand gradient on "in one" ----------
// Two background layers clipped to the text of each .gt span, laid out in ONE coordinate space across the
// whole phrase (each word's layers are offset by its own left edge, so the colours run on across the space):
//   1. a soft white shine band, sweeping left to right once, SHINE_DUR after the words land;
//   2. the superbot storm gradient (blue -> violet -> magenta -> pink and back), a seamless tile GRAD_P px
//      wide drifting left at GRAD_V px/s. Both positions are pure functions of lt.
const GRAD_P = 900, GRAD_V = 110, SHINE_DELAY = 0.08, SHINE_DUR = 0.9;
function measureGrads(c) {
  // walk the offsetParent chain up to the line: a word mid-rise carries a transform, which makes IT the
  // offsetParent of its .gt in Chromium, so a bare offsetLeft would read 0 during the entrance
  const offX = (el) => { let x = 0; while (el && el !== c.line) { x += el.offsetLeft; el = el.offsetParent; } return x; };
  const xs = c.grads.map((g) => ({ g, x: offX(g), w: g.offsetWidth }));
  const x0 = Math.min(...xs.map((a) => a.x)), x1 = Math.max(...xs.map((a) => a.x + a.w));
  c.gm = { items: xs.map((a) => ({ g: a.g, dx: a.x - x0 })), W: Math.max(1, x1 - x0) };
}
function renderGrads(c, lt) {
  if (!c.gm) measureGrads(c);
  const { items, W } = c.gm;
  const drift = ((lt * GRAD_V) % GRAD_P + GRAD_P) % GRAD_P;
  const band = W * 0.55;
  const f = inOutCubic(seg(lt, c.land + SHINE_DELAY, c.land + SHINE_DELAY + SHINE_DUR));
  const sx = lerp(-band, W, f); // band's left edge in phrase px
  for (const { g, dx } of items) {
    g.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
    g.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-drift - dx).toFixed(1)}px 0`;
  }
}

// the font's cap height in px at the card size, so wordmarks / logos seat on the baseline and cap line
function measureCaps() {
  const cv = document.createElement('canvas').getContext('2d');
  for (const s of SEGS) {
    if (s.kind !== 'card' || !s.card) continue;
    const cs = getComputedStyle(s.card.line);
    cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = cv.measureText('HIKMN');
    const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.71;
    s.card.line.style.setProperty('--cap', cap.toFixed(2) + 'px');
    s.card.gm = null; // re-measure the gradient phrase at the new metrics
  }
}

// ---------- the end card (waffles-website drawEnd) ----------
// The lock-up is a full-frame composition, so on a narrower frame it scales with the frame width: 4:3 (1440)
// takes 0.75 of the 16:9 measurements (h1 112px -> 84px, mascot 220px -> 165px, gap 56 -> 42) and keeps 8%
// margin each side instead of hanging off both edges. style.css holds the matching rules.
const END_SCALE = { '4x3': 0.75 };
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div>';
  const mark = shell.makeMark(Math.round(220 * (END_SCALE[(window.AR && window.AR.key)] || 1)));
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark };
}
function renderEnd(e, lt, t) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  // the line slides out from behind the mascot (it sits to the line's right)
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
// cache-bust per scene: bump only the scene whose files changed
const SCENE_V = { tabs: { css: 15, js: 23 }, clip: { css: 17, js: 25 } };
await Promise.all(sceneIds.map(async (id) => {
  const sv = SCENE_V[id] || { css: 14, js: 22 };
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=${sv.css}`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=${sv.js}`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[do-that-too] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'card' ? CARDS[id].dur : kind === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = kind === 'card' ? `c-${id}` : `s-${id}`;
  stage.insertBefore(sec, dip);
  const handoff = kind === 'scene' ? Math.max(0, +MODS[id].handoff || 0) : 0;
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec, handoff });
  acc += dur;
}
// the hand-off: a scene module may declare `handoff` (seconds). For that long the scene before it stays underneath,
// frozen on its own last frame (render(dur), so still a pure function of t), and that boundary has no crossfade:
// the new scene can open exactly on the old one's pixels (scenes/clip.js grows the chat's game window to full frame
// this way). While it is underneath, ctx.under is its section, and the new scene may dim it.
SEGS.forEach((s, i) => {
  const prev = SEGS[i - 1];
  if (s.handoff > 0 && prev && prev.kind === 'scene') s.under = prev; else s.handoff = 0;
  s.next = SEGS[i + 1] || null;
});
const handsOff = (s) => !!(s && s.under && !s.broken && !s.under.broken);
const CYCLE = +acc.toFixed(4);
const ENDS_ON_CARD = SEGS[SEGS.length - 1].kind === 'end';
const T = {};
SEGS.forEach((s) => { T[s.kind === 'card' ? 'card_' + s.id : s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, cardK: K, cardSettle: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, +settleAt(c, K).toFixed(3)])) };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[do-that-too] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
for (const s of SEGS) {
  if (s.kind === 'card') s.card = buildCard(s.sec, CARDS[s.id]);
  else if (s.kind === 'end') s.end = buildEnd(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }
}
measureCaps();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureCaps);

// ---------- the clip's own sound, for the MP4 render ----------
// The page plays every video muted (autoplay policy). A scene tags each <video> whose soundtrack belongs under the
// picture with data-cue-file (the file from the ad's root), data-cue-at (when it starts playing, in the scene's local
// seconds), data-cue-from (the file second it starts from) and data-cue-dur (how long it plays). Lifted here onto the
// ad clock from the same constants the scenes run on: the play beat's window clip (tabs scene, at its T.v0) and the
// montage (clip scene, at 0), which picks up on the very source frame the window clip ends on. A cue never runs into
// the next one: it is cut where the next one starts.
function audioCues() {
  const cues = [];
  for (const s of SEGS) {
    if (s.kind !== 'scene' || s.broken) continue;
    for (const v of s.sec.querySelectorAll('[data-cue-file]')) {
      const d = v.dataset;
      const at = s.t0 + (parseFloat(d.cueAt) || 0);
      cues.push({ file: d.cueFile, at, from: parseFloat(d.cueFrom) || 0, dur: parseFloat(d.cueDur) || Infinity });
    }
  }
  cues.sort((a, b) => a.at - b.at);
  cues.forEach((c, i) => {
    const next = cues[i + 1];
    c.dur = Math.min(c.dur, (next ? next.at : CYCLE) - c.at);
    c.at = +c.at.toFixed(4); c.from = +c.from.toFixed(4); c.dur = +c.dur.toFixed(4);
  });
  return cues;
}
window.__AUDIO_CUES__ = audioCues();

// ---------- draw one frame ----------
let active = null, underOn = null;
function render(t) {
  ctx.W = W(); ctx.t = t; ctx.under = null;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  // the scene frozen underneath this one during its hand-off, if any
  const under = handsOff(cur) && t - cur.t0 < cur.handoff ? cur.under : null;
  if (underOn && underOn !== under && underOn !== cur) { underOn.sec.classList.remove('on'); underOn.sec.style.opacity = '0'; }
  underOn = under;
  if (active !== cur) {
    if (active && active !== under) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    active = cur;
  }
  if (under) {
    under.sec.classList.add('on');
    under.sec.style.opacity = '1';
    try { under.mod.render(under.dur, ctx); } catch (err) { report(under, 'render', err); }
    ctx.under = under.sec;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  if (cur.kind === 'card') {
    cur.sec.style.opacity = '1';
    renderCard(cur.card, lt, cur.dur);
  } else if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt, t);
  } else {
    // no crossfade across a hand-off: the next scene opens on this one's last frame; and the scene that ends the
    // ad holds its own last frame to the end, unfaded (the clip's real ending is the ad's last frame)
    const fin = handsOff(cur) ? 1 : seg(lt, 0, SCENE_FADE);
    const fout = handsOff(cur.next) || !cur.next ? 1 : 1 - seg(lt, cur.dur - SCENE_FADE, cur.dur);
    cur.sec.style.opacity = (fin * fout).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
    ctx.under = null;
  }
  // the dip at the loop: an end card goes to black over its last DIP seconds. A spot that ends on a scene (this one
  // ends on the clip's own last frame, already near black) takes no dip, so that frame reaches the render untouched.
  dip.style.opacity = ENDS_ON_CARD ? seg(t, CYCLE - DIP, CYCLE).toFixed(3) : '0';
}

// ---------- fit the stage to the window (assets/ar.js sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => {
  fit(); measureCaps(); lastT = NaN;
  for (const s of SEGS) if (s.kind === 'end') s.end = buildEnd(s.sec); // the end mascot is sized to the frame
});

// ---------- the clock (waffles-website) ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
let lastT = NaN;
function frame() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  render(t); lastT = t;
  requestAnimationFrame(frame);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;
