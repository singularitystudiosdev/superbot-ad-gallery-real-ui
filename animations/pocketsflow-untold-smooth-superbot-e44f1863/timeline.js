// pocketsflow-untold-smooth-superbot: "they wont tell you how", the smoothed remake. The whole spot is a pure
// function of t: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on, space pauses, arrows step 0.25s, R restarts; the
// clock is quantised to 60fps.
// Scenes are laid end to end with OVERLAPPING joins: across a join both scenes render and the incoming one dissolves
// in on top (inOutSine) while the outgoing one keeps playing underneath, so no join is a cut or a dip to black.
//   1. tweet  (scenes/tweet.js): an X post, "I made this in 1 prompt", the Pocketsflow launch film playing in it.
//   2. untold (scenes/untold.js): THEY / WONT / TELL / YOU / HOW, each word easing up out of a blur.
//   3. tabs   (scenes/tabs.js): the superbot hub; the ask, then one specialist model per step (chat.js).
//   4. end    the superbot mark and wordmark.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outExpo, inOutSine } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

const SEQUENCE = ['tweet', 'untold', 'tabs', 'end'];
const FALLBACK_DUR = { tweet: 4.6, untold: 3.3, tabs: 30 };
// seconds two neighbours overlap; the incoming scene dissolves in across the whole overlap
const JOIN = { 'tweet>untold': 0.55, 'untold>tabs': 0.7, 'tabs>end': 0.7 };
const END_DUR = 4.2, OPEN = 0.35, DIP = 0.45;

// ---------- the end card: the mascot settles in, the wordmark slides out from behind it ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div>';
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark };
}
function renderEnd(e, lt) {
  const f = outExpo(seg(lt, 0.15, 1.0));
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.86, 1, f).toFixed(4)})`;
  const w = outExpo(seg(lt, 0.45, 1.45));
  e.slide.style.transform = `translateX(${((1 - w) * 60).toFixed(2)}%)`;
  e.slide.style.filter = w >= 1 ? 'none' : `blur(${((1 - w) * 6).toFixed(2)}px)`;
  lib.op(e.slide, w);
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const MODS = {};
await Promise.all(SEQUENCE.filter((id) => id !== 'end').map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=2`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=2`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[pocketsflow-smooth] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
SEQUENCE.forEach((id, i) => {
  const dur = id === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
  const overlap = i ? JOIN[`${SEQUENCE[i - 1]}>${id}`] || 0 : 0;
  const t0 = Math.max(0, acc - overlap);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ id, kind: id === 'end' ? 'end' : 'scene', t0: +t0.toFixed(4), t1: +(t0 + dur).toFixed(4), dur, overlap, sec });
  acc = t0 + dur;
});
const CYCLE = +acc.toFixed(4);
const T = Object.fromEntries(SEGS.map((s) => [s.id, s.t0]));
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[pocketsflow-smooth] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
for (const s of SEGS) {
  if (s.kind === 'end') { s.end = buildEnd(s.sec); continue; }
  s.mod = MODS[s.id];
  if (s.mod.broken) { s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`; continue; }
  try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); s.mod = { ...s.mod, broken: true }; }
}

// ---------- draw one frame: every segment live at t renders; the later one dissolves in on top ----------
function render(t) {
  ctx.W = W(); ctx.t = t;
  for (const s of SEGS) {
    const live = t >= s.t0 && t < s.t1 || (s === SEGS[SEGS.length - 1] && t >= s.t1);
    s.sec.classList.toggle('on', live);
    if (!live) { if (s.sec.style.opacity !== '0') s.sec.style.opacity = '0'; continue; }
    const lt = clamp(t - s.t0, 0, s.dur);
    s.sec.style.opacity = (s.overlap ? inOutSine(seg(lt, 0, s.overlap)) : 1).toFixed(3);
    if (s.kind === 'end') renderEnd(s.end, lt);
    else if (!s.mod.broken) { try { s.mod.render(lt, ctx); } catch (err) { report(s, 'render', err); } }
  }
  // open out of black, and dip back to it at the loop
  dip.style.opacity = Math.max(1 - inOutSine(seg(t, 0, OPEN)), inOutSine(seg(t, CYCLE - DIP, CYCLE))).toFixed(3);
}

// ---------- fit the stage to the window (assets/ar.js sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => { fit(); });

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function restart() { offset = 0; t0 = performance.now(); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frame() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  render(t);
  requestAnimationFrame(frame);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);
window.__AD.seek = (t) => { paused = true; offset = t; render(((t % CYCLE) + CYCLE) % CYCLE); };
// ready once the scenes' own assets (the 3D model, the waveform) and the fonts have landed, or after 20s regardless
const waits = SEGS.map((s) => s.mod && s.mod.ready).filter(Boolean);
if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
await Promise.race([Promise.all(waits).catch((e) => console.error('[pocketsflow-smooth] asset wait failed', e)), new Promise((r) => setTimeout(r, 20000))]);
window.__AD.ready = true;
