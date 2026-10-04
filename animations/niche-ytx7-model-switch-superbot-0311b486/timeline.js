// niche-ytx7-model-switch-superbot-0311b486: the engine, forked from niche-youtube-model-switch-superbot-3828921d
// (one cut, 16:9 only). The whole spot is a pure function of t: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from
// there, space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock; window.__AD.seek(t) draws t and holds.
// It lays the SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered while active or while
// they take part in a crossfade) and the superbot end card (the mark, the wordmark and the plain-text URL, drawn here).
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outQuint, outCubic, inOutCubic } = lib;
const W = 1920, H = 1080;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence (the scene ids are the seam between units; the durations are the spec's, binding) ----------
// thread-a: the superbot thread, Sam's ask, then the Gemini, GPT-6 Astra and Claude Opus 5.5 bubbles
// yt-replies: YouTube Studio Comments (replies land under the top comments, Priya's pinned), then the watch page
// thread-b: the same thread continues, the Nano Banana Pro bubble with the community image resolving in
// yt-community: the channel's Posts tab, the composer, then the published post card at the top of the feed
// end: the superbot lock-up and the plain text "Try it at superbot.gg", dip to black over the last 0.35 s
const SEQUENCE = [
  ['scene', 'thread-a', 4.6],
  ['scene', 'yt-replies', 3.2],
  ['scene', 'thread-b', 1.1],
  ['scene', 'yt-community', 3.0],
  ['end', 'end', 2.6],
];
// the duration each id gets when its module is missing or broken (so the spot keeps its shape): the same table
const FALLBACK_DUR = Object.fromEntries(SEQUENCE.map(([, id, d]) => [id, d]));
// every boundary is a crossfade: the incoming scene (drawn in full from its lt = 0) fades in over XF seconds on top of
// the outgoing one, which holds its final frame underneath at full opacity, so no frame is ever blank
const XF = 0.22; /* deliberate */
const DIP = 0.35; /* deliberate */ // the end card goes to black over its last DIP seconds (the loop point)

// ---------- the end card (the base's lock-up: the mascot scales in, the wordmark slides out from behind it) ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="end-wrap"><div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div>'
    + '<p class="end-url">Try it at superbot.gg</p></div>';
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), url: sec.querySelector('.end-url'), mark };
}
const END_IN = [0, 0.5];      /* deliberate */ // the mascot scales up into place
const END_SLIDE = [0.2, 0.75]; /* deliberate */ // the wordmark slides out from behind it
const END_URL = [0.5, 0.92];  /* deliberate */ // the URL line, 0.3 s after the wordmark starts; all settled by 1.0
const END_MARKS = [];         // the end card is silent (the bed carries it out)
const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function renderEnd(e, lt) {
  const rm = reducedMotion();
  const f = rm ? 1 : seg(lt, ...END_IN);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outQuint(f)).toFixed(4)})`;
  const w = rm ? 1 : seg(lt, ...END_SLIDE);
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  const u = rm ? 1 : seg(lt, ...END_URL);
  lib.op(e.url, outCubic(u));
  e.url.style.transform = `translateY(${((1 - outCubic(u)) * 18).toFixed(2)}px)`;
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken or missing module must not take the spot down) ----------
const V = '0311b486';
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=${V}`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=${V}`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.warn(`[ytx7] scene "${id}" not loaded, drawing its fallback:`, err && err.message ? err.message : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id], broken: true, mount() {}, render() {}, marks: [] };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id, dur] of SEQUENCE) {
  const m = MODS[id];
  if (m && !m.broken && Math.abs((+m.dur || 0) - dur) > 1e-6) console.warn(`[ytx7] scenes/${id}.js reports dur ${m.dur}, the SEQUENCE holds it at ${dur}`);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.id] = s.t0; });

// the SFX cues of the whole spot, in global seconds: every scene module's `marks` ({ t, kind } scene-local) shifted by
// its t0, plus the end card's. A module may export marks as an array or a function returning one.
function sceneMarks(s) {
  if (s.kind === 'end') return END_MARKS;
  const m = MODS[s.id];
  if (!m || m.broken) return [];
  try { const mk = typeof m.marks === 'function' ? m.marks() : m.marks; return Array.isArray(mk) ? mk : []; } catch (e) { return []; }
}
const MARKS = SEGS.flatMap((s) => sceneMarks(s).filter((k) => k && Number.isFinite(+k.t) && +k.t >= 0 && +k.t <= s.dur)
  .map((k) => ({ t: +(s.t0 + +k.t).toFixed(4), kind: k.kind === 'chime' ? 'chime' : 'pop', scene: s.id, lt: +k.t })))
  .sort((a, b) => a.t - b.t);

window.__AD = {
  id: 'niche-ytx7-model-switch-superbot-0311b486',
  segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1, broken: kind === 'scene' ? !!MODS[id].broken : false })),
  CYCLE, XF, DIP, W, H, marks: MARKS,
};

// ---------- mount ----------
const ctx = { W, H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[ytx7] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
// a scene that is not there yet draws a quiet dark placeholder (never black, never blank text)
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err"><span>${lib.esc(s.id)}</span></div>`;
}
for (const s of SEGS) {
  if (s.kind === 'end') s.end = buildEnd(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }
}

// ---------- draw one frame ----------
function draw(s, lt) {
  if (s.kind === 'end') { renderEnd(s.end, lt); return; }
  if (s.broken) return;
  try { s.mod.render(lt, ctx); } catch (err) { report(s, 'render', err); }
}
let shown = new Set();
function render(t) {
  ctx.t = t;
  let i = SEGS.length - 1;
  for (let k = 0; k < SEGS.length; k++) if (t >= SEGS[k].t0 && t < SEGS[k].t1) { i = k; break; }
  const cur = SEGS[i];
  const lt = clamp(t - cur.t0, 0, cur.dur);
  // the crossfade into cur: its first XF seconds, over the previous scene held at its last frame
  const prev = i > 0 && lt < XF ? SEGS[i - 1] : null;
  const on = new Set(prev ? [prev, cur] : [cur]);
  for (const s of shown) if (!on.has(s)) { s.sec.classList.remove('on'); s.sec.style.opacity = '0'; s.sec.style.zIndex = ''; }
  for (const s of on) s.sec.classList.add('on');
  shown = on;
  if (prev) {
    prev.sec.style.zIndex = '1'; prev.sec.style.opacity = '1';
    draw(prev, prev.dur);
  }
  cur.sec.style.zIndex = '2';
  cur.sec.style.opacity = (prev ? inOutCubic(seg(lt, 0, XF)) : 1).toFixed(3);
  draw(cur, lt);
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the 1920x1080 stage to the window ----------
function fit() {
  stage.style.width = W + 'px';
  const k = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();

// ---------- the clock ----------
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
const wrap = (t) => { const c = ((t % CYCLE) + CYCLE) % CYCLE; return c >= CYCLE ? 0 : c; };
// paused (a ?t= freeze or a seek): the exact t, unquantised; seek(CYCLE) holds the last, fully dipped frame
const pausedT = () => (offset >= CYCLE ? CYCLE - 1e-6 : wrap(offset));
let lastT = NaN;
function frame() {
  let t;
  if (paused) t = pausedT();
  else { t = Math.round(wrap(clockNow()) * FPS) / FPS; if (t >= CYCLE) t = 0; }
  if (t !== lastT) { render(t); lastT = t; }
  requestAnimationFrame(frame);
}
lastT = paused ? pausedT() : wrap(offset);
render(lastT);
requestAnimationFrame(frame);
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; lastT = pausedT(); render(lastT); };
window.__AD.T = T;
window.__AD.ready = true;
