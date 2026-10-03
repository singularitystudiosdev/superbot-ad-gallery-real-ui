// niche-gumroad-model-switch-superbot: the engine (forked unchanged from bikeride-model-switch-superbot-e13744a9). The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock; window.__AD.seek(t) draws t and holds.
// It lays the SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active)
// and the superbot end card (the mark and the wordmark, drawn here).
import * as lib from './lib.js';
import * as shell from './shell.js';
import { CUT } from './scenes/tabs-assets/cut.js?v=55f5d380';

const { clamp, lerp, seg, outQuint } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
// the hub cropped to its thread, fading up from black on the empty state, then the one-ask chat
// "Turn my pricing ebook into a Gumroad product at $29" (scenes/tabs-assets/chat.js: Gemini, Claude Opus 5.5, GPT-6
// Astra, Gumroad, one status line each; in the default zoom cut the camera pushes in on every status line, in
// ?cut=nozoom it never moves; it ends on the public Gumroad product page full frame, the banner "Published on Gumroad"
// landed with the chime), then the end card
const SEQUENCE = [
  ['scene', 'tabs'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape). A loaded scene reports its
// own dur (tabs: its content-driven chat schedule + the 0.3 s fade), which is what CYCLE follows; this mirrors it by
// hand, per cut (measured 55f5d380: zoom CHAT_END 22.0491 + 0.3, nozoom 20.0491 + 0.3).
const FALLBACK_DUR = { tabs: CUT === 'nozoom' ? 20.3491 : 22.3491 };
const SCENE_FADE = 0.3;
const END_DUR = 4.4, DIP = 0.35; /* deliberate */ // the end card holds; the dip to black at the loop

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
const END_IN = 0.5; /* deliberate */   // the mascot scales up into place
const END_SLIDE = 0.7; /* deliberate */ // the wordmark slides out from behind it
// under prefers-reduced-motion the lock-up is simply there
const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function renderEnd(e, lt) {
  const rm = reducedMotion();
  const f = rm ? 1 : seg(lt, 0, END_IN);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outQuint(f)).toFixed(4)})`;
  const w = rm ? 1 : seg(lt, 0.3, 0.3 + END_SLIDE);
  // the line slides out from behind the mascot (it sits to the line's right)
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=55f5d380`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=55f5d380`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[gumroad] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
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
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, cut: CUT };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[gumroad] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
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
let active = null;
function render(t) {
  ctx.W = W(); ctx.t = t;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt);
  } else {
    cur.sec.style.opacity = (seg(lt, 0, SCENE_FADE) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  // the dip at the loop: the end card goes to black over its last DIP seconds (t=0 opens on black too)
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
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
  fit(); lastT = NaN;
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
