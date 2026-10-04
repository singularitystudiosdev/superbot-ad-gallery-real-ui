// niche-ghx2-model-switch-superbot: the engine (forked from ../niche-ytv5-model-switch-superbot-b0c8e364/timeline.js).
// The whole spot is a pure function of t: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there, space pauses,
// arrows step one frame (1/30 s), R restarts; a 30 fps quantised clock; window.__AD.seek(t) draws t and holds, and
// window.__AD.settle() resolves once every image on the stage is decoded and the frame has been composited (the
// renderer awaits it per frame).
// It lays the storyboard (bible STORYBOARD, 6.80 s) end to end from the scene modules scenes/<id>.js
// ({ id, dur, mount(section, ctx), render(lt, ctx) }). Unlike ytv5 there is no blanket scene fade: the beats hand off
// with their own pushes and crossfades, so EVERY scene is rendered EVERY frame with its local time lt = t - t0 (which
// may be negative or past dur) and owns its own visibility. That keeps a seek to any t exact, whatever came before.
//   A ask  0.00-0.75   superbot chat: the ask bubble and the live mark
//   B-E gh 0.75-5.85   the framed browser: issue #482 (B), PR #483 Commits tab (C), checks dialog (D), Merged (E),
//                      with the model rail on the stage beside it
//   F end  5.85-6.80   the superbot lock-up and superbot.gg
import * as lib from './lib.js';

const W = 1920, H = 1080;
const FPS = 30;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
const SEQUENCE = ['ask', 'gh', 'end'];
// the duration a scene gets if its module fails to load (so the spot keeps its 6.80 s shape)
const FALLBACK_DUR = { ask: 0.75, gh: 5.1, end: 0.95 };

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const MODS = {};
await Promise.all(SEQUENCE.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=47125cad`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=47125cad`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[ghx2] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id], broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const id of SEQUENCE) {
  const dur = +MODS[id].dur || FALLBACK_DUR[id];
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ id, t0, t1 }) => ({ id, t0, t1 })), CYCLE, FPS };

// ---------- mount (a scene may await its own assets, e.g. the gh/*.html fragments) ----------
const ctx = { W, H, t: 0, lib, T };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[ghx2] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
await Promise.all(SEGS.map(async (s) => {
  s.mod = MODS[s.id];
  if (s.mod.broken) { markBroken(s); return; }
  try { await s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
}));

// ---------- draw one frame ----------
function render(t) {
  ctx.t = t;
  for (const s of SEGS) {
    const lt = t - s.t0;
    if (s.broken) {
      const on = t >= s.t0 && t < s.t1;
      s.sec.classList.toggle('on', on);
      s.sec.style.opacity = on ? '1' : '0';
      continue;
    }
    try { s.mod.render(lt, ctx, s.sec); } catch (err) { report(s, 'render', err); }
  }
  // the loop's last 3 frames dip toward black so the cut back to the hook reads as a loop, never as a glitch
  dip.style.opacity = (0.85 * lib.seg(t, CYCLE - 3 / FPS, CYCLE)).toFixed(3);
}

// ---------- fit the stage to the window ----------
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
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 1 : -1) / FPS); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
const wrap = (t) => ((t % CYCLE) + CYCLE) % CYCLE;
const quant = (t) => { const f = Math.round(wrap(t) * FPS); return f >= Math.round(CYCLE * FPS) ? 0 : f / FPS; };
let lastT = NaN;
function frame() {
  const t = quant(clockNow());
  if (t !== lastT) { render(t); lastT = t; }
  requestAnimationFrame(frame);
}
render(quant(offset)); lastT = quant(offset);
requestAnimationFrame(frame);

// frame-exact export/QA: pause the clock and draw t now (t is used as given; the renderer passes n/30)
window.__AD.seek = (t) => { paused = true; offset = t; const c = wrap(t); render(c); lastT = c; };
// ...and resolve once every visible image is decoded and two animation frames have been composited
window.__AD.settle = async () => {
  const imgs = [...stage.querySelectorAll('img')].filter((i) => i.offsetParent !== null);
  await Promise.all(imgs.map((i) => (i.complete ? (i.decode ? i.decode().catch(() => {}) : null) : new Promise((r) => { i.onload = i.onerror = r; }))));
  if (document.fonts) await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};
window.__AD.ready = true;
