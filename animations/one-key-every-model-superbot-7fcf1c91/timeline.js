// one-key-every-model-superbot-7fcf1c91: "One key. Every model." Forked from the
// live-limits-every-plan-superbot-7fcf1c91 engine (which carried ad 2 / ad 3's 13.5 design px text floor).
// SOLUTION ONLY (user ruling): no hook card, no error, no outage, no complaint. The spot opens straight on a
// developer's gateway console: one key calls https://api.superbot.gg/v1 three times, the request's model id
// changes (Claude, GPT, Gemini) and each answer streams back; the rail beside it lists the key and the plans
// behind that one endpoint. It never implies cross-vendor failover: each call names its own model id.
// The whole spot is a pure function of t, like ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a
// frame, ?t=<s>&play=1 plays on from there, space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
// Solution only: no hook card at all, so nothing is on screen but the product. The single scene module
// (scenes/gw.js) mounts once and renders only while active; then the end card.
const SEQUENCE = [
  ['scene', 'gw'],
  ['end', 'end'],
];
const FALLBACK_DUR = { gw: 13.8 };
const SCENE_FADE = 0.3;
const END_DUR = 3.8, DIP = 0.35;

// ---------- the end card ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ul-end"><div class="face"></div><div class="words"><div class="end-slide"><h1>One key.<br><em>Every model.</em></h1><p class="ul-url">superbot.gg</p><p class="ul-sub">Private beta. Invite only.</p></div></div></div>';
  const mark = shell.makeMark(250, { freeze: 0 });
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark };
}
function renderEnd(e, lt, t) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.25, 0.95);
  e.slide.style.transform = `translateY(${((1 - outQuint(w)) * 26).toFixed(2)}px)`;
  lib.op(e.slide, w);
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=1`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=1`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[one-key-every-model] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[one-key-every-model] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
    renderEnd(cur.end, lt, t);
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
window.__AD.ready = true;