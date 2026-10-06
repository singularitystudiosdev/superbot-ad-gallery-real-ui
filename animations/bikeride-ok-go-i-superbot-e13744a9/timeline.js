// bikeride-model-switch-superbot: the engine. The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock; window.__AD.seek(t) draws t and holds.
// It lays the SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active)
// and the superbot end card (the mark and the wordmark, drawn here).
import * as lib from './lib.js';
import * as shell from './shell.js';
import { CUT } from './scenes/tabs-assets/cut.js?v=e2834f7d';

const { clamp, lerp, seg, outQuint } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
// the hub cropped to its thread, fading up from black on the empty state, then the one-ask chat
// "Relaxing Japanese bike riding game" (scenes/tabs-assets/chat.js: Gemini, Blender, ElevenLabs, Claude Opus 5.5,
// one switch pill each; in the default zoom cut the camera pushes in on every pill, in ?cut=nozoom it never moves;
// it ends on the ride playing full frame), then the end card
const SEQUENCE = [
  ['scene', 'tabs'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape). A loaded scene reports its
// own dur (tabs: its content-driven chat schedule + the 0.3 s fade), which is what CYCLE follows; this mirrors it by
// hand, per cut (measured v4: zoom CHAT_END 19.554 + 0.3, nozoom 17.954 + 0.3).
const FALLBACK_DUR = { tabs: CUT === 'nozoom' ? 18.254 : 19.854 };
const SCENE_FADE = 0.3;
const END_DUR = 4.4, DIP = 0.35; /* deliberate */ // the end card holds; the dip to black at the loop

// ---------- the end card (waffles-website drawEnd) ----------
// The lock-up is a full-frame composition, so on a narrower frame it scales with the frame width: 4:3 (1440)
// takes 0.75 of the 16:9 measurements (h1 112px -> 84px, mascot 220px -> 165px, gap 56 -> 42) and keeps 8%
// margin each side instead of hanging off both edges. style.css holds the matching rules.
const END_SCALE = { '4x3': 0.75 };
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div><canvas class="px-reveal" width="1920" height="1080"></canvas>';
  const mark = shell.makeMark(Math.round(220 * (END_SCALE[(window.AR && window.AR.key)] || 1)));
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark, cv: sec.querySelector('.px-reveal'), grid: null };
}
const END_IN = 0.5; /* deliberate */   // the mascot scales up into place
const END_SLIDE = 0.7; /* deliberate */ // the wordmark slides out from behind it
// under prefers-reduced-motion the lock-up is simply there
const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
// OK Go "I Won't Let You Down": a crowd of umbrella-holders act as pixels and flip on cue, so a scattered field
// resolves into a legible picture. Here the pixels are a grid of dots in the end card's brand gradient: a loose
// scatter, a left-to-right flip wave that resolves them into the wordmark, then the real lock-up takes over.
const PX_CELL = 6, PX_SCATTER = 0.3, PX_FLIP = [0.3, 0.95], PX_HAND = [0.9, 1.3];
const PX_LEAD = 1.0; // the lock-up waits for the pixel reveal
const hash = (i, k) => { let x = Math.imul(i + 1, 374761393) ^ Math.imul(k + 7, 668265263); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
function buildGrid(e) {
  const words = e.slide.parentElement, h1 = e.slide.firstElementChild;
  const sr = stage.getBoundingClientRect(), r = words.getBoundingClientRect(), k = sr.width / W() || 1;
  const x0 = (r.left - sr.left) / k, y0 = (r.top - sr.top) / k, w = Math.ceil(r.width / k), h = Math.ceil(r.height / k);
  const m = document.createElement('canvas'); m.width = w; m.height = h;
  const c = m.getContext('2d'), cs = getComputedStyle(h1), fs = parseFloat(cs.fontSize);
  c.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`; c.letterSpacing = `${-0.03 * fs}px`;
  c.textBaseline = 'alphabetic'; c.fillStyle = '#fff'; c.fillText('superbot', 0, fs * 0.86);
  const d = c.getImageData(0, 0, w, h).data, cells = [];
  const pad = 3, nx = Math.ceil(w / PX_CELL) + pad * 2, ny = Math.ceil(h / PX_CELL) + pad * 2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const px = Math.min(w - 1, Math.max(0, (i - pad) * PX_CELL + PX_CELL / 2 | 0)), py = Math.min(h - 1, Math.max(0, (j - pad) * PX_CELL + PX_CELL / 2 | 0));
    const lit = (i >= pad && j >= pad && i < nx - pad && j < ny - pad) && d[(py * w + px) * 4 + 3] > 128;
    const id = j * nx + i, u = (i - pad) / Math.max(1, nx - pad * 2);
    cells.push({ x: x0 + (i - pad) * PX_CELL + PX_CELL / 2, y: y0 + (j - pad) * PX_CELL + PX_CELL / 2, lit, u,
      show: hash(id, 1) < (lit ? 0.9 : 0.16), at: hash(id, 2), flip: hash(id, 3) });
  }
  return cells;
}
const GRAD = [[34, 211, 238], [91, 141, 255], [139, 92, 246]], DIM = [58, 64, 80];
function gradAt(u) { u = Math.min(1, Math.max(0, u)) * 2; const i = Math.min(1, u | 0), a = GRAD[i], b = GRAD[i + 1], f = u - i; return a.map((v, n) => v + (b[n] - v) * f); }
function drawPixels(e, lt) {
  const c = e.cv.getContext('2d');
  c.clearRect(0, 0, e.cv.width, e.cv.height);
  const gone = 1 - seg(lt, PX_HAND[0], PX_HAND[1]);
  if (gone <= 0) return;
  if (!e.grid) e.grid = buildGrid(e);
  for (const p of e.grid) {
    if (!p.show) continue;
    const appear = seg(lt, p.at * PX_SCATTER, p.at * PX_SCATTER + 0.12);
    const t0 = lerp(PX_FLIP[0], PX_FLIP[1] - 0.15, p.u) + p.flip * 0.1, fl = seg(lt, t0, t0 + 0.15);
    let a, rad, col;
    if (p.lit) { const g = gradAt(p.u); col = DIM.map((v, n) => v + (g[n] - v) * fl); rad = PX_CELL * (0.28 + 0.2 * outQuint(fl)); a = appear * (0.45 + 0.55 * fl); }
    else { col = DIM; rad = PX_CELL * 0.28 * (1 - fl); a = appear * 0.5 * (1 - fl); }
    if (a <= 0.01 || rad <= 0.2) continue;
    c.globalAlpha = a * gone; c.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
    c.beginPath(); c.arc(p.x, p.y, rad, 0, 6.2832); c.fill();
  }
  c.globalAlpha = 1;
}
function renderEnd(e, lt) {
  const rm = reducedMotion();
  if (rm) e.cv.getContext('2d').clearRect(0, 0, e.cv.width, e.cv.height); else drawPixels(e, lt);
  lt = Math.max(0, lt - PX_LEAD);
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
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=e2834f7d`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=e2834f7d`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[bikeride] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
  console.error(`[bikeride] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
