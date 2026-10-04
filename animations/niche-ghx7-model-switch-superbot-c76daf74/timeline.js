// niche-ghx7-model-switch-superbot: the engine (timeline + scene host, forked from the ytv5 engine
// niche-ytv5-model-switch-superbot-b0c8e364). The whole spot is a pure function of t: ?t=<s> freezes a frame,
// ?t=<s>&play=1 plays on from there, space pauses, arrows step 0.25 s, R restarts; a 60 fps quantised clock;
// window.__AD.seek(t) draws t and holds, window.__AD.settle() resolves once every embedded clip shows that frame.
// It lays the SEQUENCE end to end: one scene module per beat (scenes/<id>.js, mounted once, rendered only while
// active), laid out to the fixed budget in scenes/budget.js (14.80 s, 444 frames @30 fps). Adjacent beats CROSS-FADE
// over SCENE_FADE seconds (the outgoing section stays visible while the incoming fades up), so a cut never dips the
// stage to black. The embedded clips (video.js) follow t after every frame drawn.
import * as lib from './lib.js';
import * as shell from './shell.js';
// NOTE: every scene must use ctx.video (this exact module instance), never a re-import with a different ?v= specifier:
// a second specifier would be a second module with its own CLIPS list, and video.sync would seek nothing.
import * as video from './video.js';
import { BEATS, TOTAL } from './scenes/budget.js';

const { clamp, seg } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
const SEQUENCE = BEATS.map((b) => ({ kind: 'scene', id: b.id }));
const SCENE_FADE = 0.25; /* deliberate */ // the cross-fade between adjacent beats
const DIP = 0.35; /* deliberate */         // the dip to black at the loop

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const MODS = {};
await Promise.all(SEQUENCE.map(async ({ id }) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=c76daf74`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=c76daf74`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[ghx7] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    const b = BEATS.find((x) => x.id === id);
    MODS[id] = { id, dur: b ? b.t1 - b.t0 : 1, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
for (let i = 0; i < SEQUENCE.length; i++) {
  const { id } = SEQUENCE[i];
  const b = BEATS[i];
  const dur = +(b.t1 - b.t0).toFixed(4);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ kind: 'scene', id, t0: b.t0, t1: b.t1, dur, sec });
}
const CYCLE = TOTAL;
const T = {};
SEGS.forEach((s) => { T[s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, W: 0, H };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell, video };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[ghx7] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
for (const s of SEGS) {
  s.mod = MODS[s.id];
  if (s.mod.broken) { markBroken(s); continue; }
  try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
}

// ---------- draw one frame ----------
let active = null, prev = null;
function render(t) {
  ctx.W = W(); ctx.t = t; window.__AD.W = ctx.W;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    prev = active;
    cur.sec.classList.add('on');
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  // cross-fade: the incoming scene fades in over SCENE_FADE while the outgoing one is still shown under it. The very
  // first beat has nothing beneath it, so it starts fully opaque (no black frame at t=0).
  const inP = cur === SEGS[0] ? 1 : seg(lt, 0, SCENE_FADE);
  cur.sec.style.opacity = inP.toFixed(3);
  cur.sec.style.zIndex = '2';
  if (prev && prev !== cur && inP < 1) {
    if (!prev.sec.classList.contains('on')) prev.sec.classList.add('on');
    prev.sec.style.opacity = (1 - inP).toFixed(3);
    prev.sec.style.zIndex = '1';
  } else if (prev && prev !== cur) {
    prev.sec.classList.remove('on');
    prev.sec.style.opacity = '0';
    prev.sec.style.zIndex = '';
  }
  if (!cur.broken) {
    try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
  }
  try { video.sync(t, paused); } catch (err) { console.error('[ghx7] video sync failed:', err && err.stack ? err.stack : err); }
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
addEventListener('archange', () => { fit(); lastT = NaN; });

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0clock = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0clock) / 1000);
function setTime(t) { offset = t; t0clock = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0clock = performance.now(); } else { offset = clockNow(); paused = true; } }
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
window.__AD.settle = () => video.settle();
window.__AD.ready = true;