// niche-ytv5-model-switch-superbot: the engine (forked from niche-youtube-model-switch-superbot-3828921d, itself from
// bikeride-model-switch-superbot-e13744a9; the one-scene ending from niche-ytv3-model-switch-superbot-7bd77eac). The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock; window.__AD.seek(t) draws t and holds.
// It lays the SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active). This
// spot has ONE scene and no separate end card: it ends on the Short still playing in its YouTube Shorts page with
// superbot's lock-up beside it (scenes/tabs-assets/beats/studio.js), then the loop's dip to black.
// The embedded clips (video.js) follow t: after every frame drawn, video.sync(t, paused) plays them natively while the
// clock runs and seeks them exactly while it is paused; window.__AD.settle() resolves once every active clip shows
// the frame that belongs to the last __AD.seek(t) (the renderer awaits it per frame).
import * as lib from './lib.js';
import * as shell from './shell.js';
import * as video from './video.js?v=b0c8e364';
import { CUT } from './scenes/tabs-assets/cut.js?v=b0c8e364';

const { clamp, seg } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
// the hub cropped to its thread, fading up from black on the empty state, then the one-ask chat
// "Answer the top comments on my latest video and cut a Short from the moment they talk about most"
// (scenes/tabs-assets/chat.js: Gemini maps the comments to the 6:12 blind test, GPT-6 Astra cuts and reframes it
// vertical, Claude Opus 5.5 writes the captions and the title, YouTube Studio; one switch pill each; in the default
// zoom cut the camera pushes in on every pill, in ?cut=nozoom it never moves). It ends inside the scene: the Short
// playing on its YouTube Shorts page in a superbot frame, then the superbot lock-up landing beside it.
const SEQUENCE = [
  ['scene', 'tabs'],
];
// the duration the scene gets if its module fails to load (so the spot keeps its shape). A loaded scene reports its
// own dur (its content-driven chat schedule + the 0.3 s fade), which is what CYCLE follows; this mirrors it by hand
// (measured b0c8e364, zoom cut).
const FALLBACK_DUR = { tabs: CUT === 'nozoom' ? 34 : 36 };
const SCENE_FADE = 0.3;
const DIP = 0.35; /* deliberate */ // the dip to black at the loop

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=b0c8e364`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=b0c8e364`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[ytv5] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
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
  console.error(`[ytv5] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
  cur.sec.style.opacity = (seg(lt, 0, SCENE_FADE) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
  if (!cur.broken) {
    try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
  }
  // the clips follow the frame just drawn (live: native playback with drift correction; paused: an exact seek)
  try { video.sync(t, paused); } catch (err) { console.error('[ytv5] video sync failed:', err && err.stack ? err.stack : err); }
  // the dip at the loop: the last frames go to black over DIP seconds (t=0 opens on black too)
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
// ...and resolve once every embedded clip shows the frame that belongs to it
window.__AD.settle = () => video.settle();
window.__AD.ready = true;
