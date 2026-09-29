// polymarket-tracker: "<variant voice> can't watch Polymarket for you" -> "superbot can." -> superbot connects
// Polymarket read-only, builds a watchlist, arms alert rules and reports, and the tracked market page fills the
// frame while its alerts fire. The line on card 1, the ask, the answer, the work card and the tracked page all come from
// ./variant.js, so a variant folder is this spot with its own variant.js and nothing else changed.
// The engine is one-agent-full-degen's: the whole spot is a pure function of t (?t=<s> freezes a
// frame, ?t=<s>&play=1 plays on, space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock).
// It lays the SEQUENCE end to end: two black text cards (drawn here), the hub scene cropped to its thread
// (scenes/tabs.js) and the end card. confetti.js draws the "superbot can." burst on its own stage-level canvas
// from the spot's ABSOLUTE t, so it keeps falling across the cut into the chat.
import * as lib from './lib.js';
import * as shell from './shell.js';
import { renderConfetti } from './confetti.js';
import V from './variant.js';

const { clamp, lerp, seg, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
const SEQUENCE = [
  ['card', 'says'],
  ['card', 'slam'],
  ['scene', 'tabs'],
  ['end', 'end'],
];
// the duration the scene gets if its module fails to load (so the spot keeps its shape)
const FALLBACK_DUR = { tabs: 11 };
const SCENE_FADE = 0.3;
const END_DUR = 3.0, DIP = 0.35;

// ---------- text cards ----------
// A part is a word string, { r } for the red word, or { html } for styled words.
// says:      variant.introLine (only variant.redWord red; it lands last and takes one extra punch)
// slam:      variant.slamLine ("superbot can.") slammed in, with the confetti burst on the same beat
// the card-1 line comes from variant.js: one span per word, and the variant's redWord is the red one
const lineParts = (line, red) => String(line).split(' ').map((w) => (w === red ? { r: w } : w));
const CARDS = {
  says: { dur: 2.4, parts: lineParts(V.introLine, V.redWord) },
  slam: { dur: 2.1, mode: 'slam', parts: [V.slamLine] },
};
// card motion (seconds, local): words rise 18px + unblur 8px, outQuint .55s, staggered .06s, scaled by one
// factor K shared by every card so the busiest card still has its text landed READ_HOLD seconds before exit.
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.3, READ_HOLD = 1.2;
const BASE = { in: 0.12, stag: 0.06, dur: 0.55 };
const SLAM_IN = 0.34, SLAM_SCALE = 1.42, SHAKE = 10;
const settleAt = (c, k) => k * (BASE.in + (c.parts.length - 1) * BASE.stag + BASE.dur);
const K = Math.min(1, ...Object.values(CARDS).map((c) => (c.dur - CARD_OUT - READ_HOLD) / settleAt(c, 1)));
const W_IN = BASE.in * K, W_STAG = BASE.stag * K, W_DUR = BASE.dur * K;

function buildCard(sec, spec) {
  sec.classList.add('card');
  sec.classList.add(spec.mode === 'slam' ? 'card-slam' : 'card-rise');
  const line = document.createElement('p');
  line.className = 'cl';
  const words = [];
  const mk = (part, last) => {
    const w = document.createElement('span');
    w.className = 'w';
    if (typeof part === 'string') w.textContent = part;
    else if (part.r) { w.classList.add('rd'); w.textContent = part.r; }
    else if (part.html) w.innerHTML = part.html;
    words.push({ el: w, red: !!(part.r) });
    if (last) { const tail = document.createElement('span'); tail.className = 'tail'; tail.appendChild(w); return tail; }
    return w;
  };
  const parts = spec.parts;
  parts.slice(0, -1).forEach((p) => { line.appendChild(mk(p, false)); line.appendChild(document.createTextNode(' ')); });
  line.appendChild(mk(parts[parts.length - 1], true));
  sec.appendChild(line);
  return { line, words, spec };
}

function renderCard(c, lt, dur) {
  const slam = c.spec.mode === 'slam';
  const e = inOutCubic(seg(lt, dur - CARD_OUT, dur));
  let shake = '';
  if (slam) {
    const p = outBack(seg(lt, 0.02, 0.02 + SLAM_IN));
    const amp = SHAKE * Math.exp(-Math.max(0, lt - 0.02) * 8.5) * seg(lt, 0, 0.05);
    shake = `${(Math.sin(lt * 63) * amp).toFixed(2)}px,${(Math.cos(lt * 51) * amp * 0.5).toFixed(2)}px`;
    const sc = lerp(SLAM_SCALE, 1, p) * lerp(1, 0.985, e);
    c.words.forEach((w) => {
      w.el.style.opacity = clamp(seg(lt, 0, 0.1) * 1.3).toFixed(3);
      w.el.style.filter = 'none';
      w.el.style.transform = `scale(${sc.toFixed(4)})`;
    });
    c.line.style.transform = `translate(${shake}) scale(1)`;
  } else {
    c.words.forEach((w, i) => {
      const at = W_IN + i * W_STAG;
      const p = outQuint(seg(lt, at, at + W_DUR));
      // the red word rises with the rest at its own size: it is simply red, no scale punch
      w.el.style.opacity = clamp(p * 1.15).toFixed(3);
      const dy = (1 - p) * W_RISE;
      w.el.style.transform = `translateY(${dy.toFixed(2)}px)`;
      w.el.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * W_BLUR).toFixed(2)}px)`;
      if (w.red) w.el.style.textShadow = '0 0 18px rgba(255,48,64,.34)';
    });
    c.line.style.transform = e > 0 ? `scale(${lerp(1, 0.985, e).toFixed(4)})` : 'none';
  }
  c.line.style.opacity = (1 - e).toFixed(3);
}

// ---------- the confetti canvas (stage level, absolute t) ----------
const cf = document.createElement('canvas');
cf.id = 'cf';
stage.insertBefore(cf, dip);
const cg = cf.getContext('2d');
function fitConfetti() {
  const w = W();
  cf.width = w; cf.height = H;
  cf.style.width = w + 'px'; cf.style.height = H + 'px';
}
fitConfetti();

// ---------- the end card (one-agent-full-degen drawEnd) ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div>';
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark };
}
function renderEnd(e, lt, t) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
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
    console.error(`[polymarket-tracker] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const CONF_T0 = +((SEGS.find((s) => s.id === 'slam').t0) + 0.14).toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.kind === 'card' ? 'card_' + s.id : s.id] = s.t0; });
window.__AD = { id: V.id, segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, confettiAt: CONF_T0, cardK: K, cardSettle: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, +settleAt(c, K).toFixed(3)])) };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[polymarket-tracker] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
  if (cur.kind === 'card') {
    cur.sec.style.opacity = '1';
    renderCard(cur.card, lt, cur.dur);
  } else if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt, t);
  } else {
    cur.sec.style.opacity = (seg(lt, 0, SCENE_FADE) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  renderConfetti(cg, t, CONF_T0, W(), H);
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
addEventListener('archange', () => { fit(); fitConfetti(); lastT = NaN; });

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