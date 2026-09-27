// its-a-lie-every-model-superbot: "ITS A LIE". The engine, forked from
// ../pocketsflow-untold-every-model-superbot-673c104b/timeline.js. The whole spot is a pure function of t: ?t=<s>
// freezes a frame, ?t=<s>&play=1 plays on from there, space pauses, arrows step 0.25s, R restarts; a 60fps
// quantised clock. window.__AD.seek(t) draws any frame for export/QA.
// It lays SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active) and the
// superbot end card.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outQuint, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
//   1. tweet  (scenes/tweet.js): Kai's X post, "I MADE THIS IN ONE PROMPT", @noahwachnik's voxel clip playing in it;
//      the counts tick up while the camera pushes in, then the clip freeze-frames and glitches.
//   2. lie    (scenes/lie.js): pure black, white type: ITS A LIE / THE SECRET IS / ITS NOT JUST OPUS 5.5.
//   3. tabs   (scenes/tabs.js): the superbot hub, "make me minecraft in the browser", every subtask routed to a
//      different model (DeepSeek, Nano Banana, Meshy, ElevenLabs, Suno, Claude Opus 5.5).
//   4. reveal (scenes/reveal.js): the game those parts add up to, BlockHaven by @kepochnik, in a browser.
//   then the superbot end card.
// Every join up to the reveal is a HARD CUT; reveal -> end keeps the scene fade, and the end card dips to black at
// the loop.
const SEQUENCE = [
  ['scene', 'tweet'],
  ['scene', 'lie'],
  ['scene', 'tabs'],
  ['scene', 'reveal'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape)
const FALLBACK_DUR = { tweet: 4.2, lie: 3.5, tabs: 13.4, reveal: 6.0 };
// joins cut straight from one scene's last frame to the next scene's first: key = '<from>><to>'
const HARD_CUTS = new Set(['tweet>lie', 'lie>tabs', 'tabs>reveal']);
const SCENE_FADE = 0.3;
const END_DUR = 3.2, DIP = 0.35;
// the end card's sub-line (no em-dashes, no hype words): the pricing complaint and the quality complaint, answered
const END_SUB = 'Opus writes the code. Cheaper models do the rest.';

// ---------- the end card (waffles-website drawEnd, with a sub-line) ----------
function buildEnd(sec) {
  sec.innerHTML = `<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1><p class="end-sub">${lib.esc(END_SUB)}</p></div></div><div class="face"></div></div>`;
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), sub: sec.querySelector('.end-sub'), mark };
}
function renderEnd(e, lt) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  // the line slides out from behind the mascot (it sits to the line's right)
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  // the sub-line lands a beat after the name
  const s = outQuint(seg(lt, 0.75, 1.3));
  e.sub.style.opacity = s.toFixed(3);
  e.sub.style.transform = s >= 1 ? 'none' : `translateY(${((1 - s) * 14).toFixed(2)}px)`;
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
    console.error(`[its-a-lie] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
// a scene fades in unless the join before it is a hard cut, and fades out unless the join after it is one
SEGS.forEach((s, i) => {
  const prev = SEGS[i - 1], next = SEGS[i + 1];
  s.fadeIn = !(prev && HARD_CUTS.has(`${prev.id}>${s.id}`)) && i > 0;
  s.fadeOut = !(next && HARD_CUTS.has(`${s.id}>${next.id}`));
});
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
  console.error(`[its-a-lie] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
    const fin = cur.fadeIn ? seg(lt, 0, SCENE_FADE) : 1;
    const fout = cur.fadeOut ? 1 - seg(lt, cur.dur - SCENE_FADE, cur.dur) : 1;
    cur.sec.style.opacity = (fin * fout).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  // the dip at the loop: the end card goes to black over its last DIP seconds
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
