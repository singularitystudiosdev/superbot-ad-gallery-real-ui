// japan-bikeride-every-model-superbot: the engine. The whole 9.4 s spot is a pure function of t (60 fps clock):
// ?t=<s> freezes a frame (and sets body.freeze, the deterministic <video> branch), ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25 s, R restarts; window.__AD.seek(t) draws any frame for export, __AD.ready says so.
//
// Master timeline (seconds):
//   0.00-6.85  scene "tabs" (scenes/tabs.js + tabs-assets/chat.js): the real superbot hub cropped to its thread.
//              The ask "Make me relaxing Japan bikeride" is typed and sent, superbot bursts through 14 models
//              ("Switching to <Model>" pills), the Veo 3 video lands as a reply card at 3.55, plays from 3.65 and
//              FLIP-expands to full bleed at 3.95-4.50. The scene ends on a hard cut.
//   6.85-9.40  the end card: pure black; END_WORDS cut in one per step from 7.15 (no fade, slide, blur or scale),
//              then the superbot mark cuts in to their right at 7.45. It holds to the last frame (no dip).
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');

// ---------- the sequence ----------
const SEQUENCE = [
  ['scene', 'tabs'],
  ['end', 'end'],
];
const FALLBACK_DUR = { tabs: 6.85 };
const END_DUR = 2.55; // 6.85 -> 9.40

// ---------- the end card ----------
// Black, white words in the product's own UI face (the existing end card's weight 800, -0.02em), each a hard cut,
// then the superbot mark (assets/sb-mark-live via shell.makeMark) to their right, also a hard cut. The whole line is
// laid out once, up front, with every word and the mark in place, so nothing moves when the next piece appears.
// Measurements (per the brief): word size ~9% of frame height; mark ink height = 2.1 x the ascender ('b' top to
// baseline), vertically centred on that ascender band; gap word -> mark ink = 0.9 x ascender; the group is centred.
const END_WORDS = ['superbot'];
const END_T0 = 0.30;      // local: first word cuts in at 7.15
const END_STEP = 0.30;    // one word per step; the mark takes the step after the last word (7.45)
const END_FS = 0.09;      // word size as a share of frame height
const END_MAX_W = 0.84;   // the group never spans more than this share of the frame width
// the mark's ink box inside its square (viewBox 0 0 100 100): x 14..86, y 20.5..86
const MARK_INK = { x0: 0.14, x1: 0.86, y0: 0.205, y1: 0.86 };

function buildEnd(sec) {
  sec.innerHTML = '';
  const line = document.createElement('div');
  line.className = 'end-line';
  const words = END_WORDS.map((w) => {
    const s = document.createElement('span');
    s.className = 'end-w';
    s.textContent = w;
    line.appendChild(s);
    return s;
  });
  const markHost = document.createElement('div');
  markHost.className = 'end-mark';
  line.appendChild(markHost);
  sec.appendChild(line);
  const e = { sec, line, words, markHost, mark: null, laid: null };
  layoutEnd(e);
  return e;
}

function layoutEnd(e) {
  const fw = W();
  const cs = getComputedStyle(e.words[0]);
  const cv = document.createElement('canvas').getContext('2d');
  const ls = -0.02; // letter-spacing in em (style.css .end-w)
  const measure = (fs) => {
    cv.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const asc = cv.measureText('b').actualBoundingBoxAscent || fs * 0.74;
    const space = cv.measureText(' ').width;
    // advance widths incl. letter-spacing (the last letter's trailing spacing is not ink)
    const ws = END_WORDS.map((w) => cv.measureText(w).width + ls * fs * (w.length - 1));
    const words = ws.reduce((a, b) => a + b, 0) + space * (END_WORDS.length - 1);
    const markInkH = 2.1 * asc;
    const box = markInkH / (MARK_INK.y1 - MARK_INK.y0);
    const gap = 0.9 * asc;
    const total = words + gap + box * (MARK_INK.x1 - MARK_INK.x0);
    return { fs, asc, space, ws, words, box, gap, total };
  };
  let m = measure(H * END_FS);
  if (m.total > fw * END_MAX_W) m = measure(H * END_FS * (fw * END_MAX_W) / m.total);
  const left = (fw - m.total) / 2;
  const baseline = H / 2 + m.asc / 2; // the ascender band (baseline .. 'b' top) is centred on the frame
  let x = left;
  e.words.forEach((s, i) => {
    s.style.fontSize = m.fs.toFixed(2) + 'px';
    s.style.left = x.toFixed(2) + 'px';
    // line-height 1: the baseline sits at top + (ascent + (1 - ascent - descent)/2) of the em box; place by the
    // measured font ascent/descent so the baseline lands exactly where it was computed
    cv.font = `${cs.fontWeight} ${m.fs}px ${cs.fontFamily}`;
    const fm = cv.measureText('superbot');
    const fa = fm.fontBoundingBoxAscent || m.fs * 0.95, fd = fm.fontBoundingBoxDescent || m.fs * 0.25;
    const top = baseline - (fa + (m.fs - fa - fd) / 2);
    s.style.top = top.toFixed(2) + 'px';
    x += m.ws[i] + (i < e.words.length - 1 ? m.space : 0);
  });
  const boxPx = Math.round(m.box);
  if (!e.mark || e.mark.size !== boxPx) {
    e.markHost.innerHTML = '';
    e.mark = shell.makeMark(boxPx);
    e.mark.size = boxPx;
    e.markHost.appendChild(e.mark.el);
  }
  const inkL = x + m.gap;
  const markLeft = inkL - boxPx * MARK_INK.x0;
  const inkMid = (MARK_INK.y0 + MARK_INK.y1) / 2;
  const markTop = (baseline - m.asc / 2) - boxPx * inkMid;
  e.markHost.style.left = markLeft.toFixed(2) + 'px';
  e.markHost.style.top = markTop.toFixed(2) + 'px';
  e.markHost.style.width = e.markHost.style.height = boxPx + 'px';
  e.laid = { ...m, left, baseline, fw };
}

function renderEnd(e, lt) {
  if (!e.laid || e.laid.fw !== W()) layoutEnd(e);
  // hard cuts: each piece is either not there or fully there
  e.words.forEach((s, i) => { s.style.visibility = lt >= END_T0 + i * END_STEP ? 'visible' : 'hidden'; });
  const markAt = END_T0 + END_WORDS.length * END_STEP;
  e.markHost.style.visibility = lt >= markAt ? 'visible' : 'hidden';
  // the mark's own idle life (bob, breath, RGB fringe, blink) is seeked from local time, so it is frame-exact
  if (e.mark) e.mark.render(Math.max(0, lt - markAt));
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=jb1`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=jb1`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[japan-bikeride] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 6.85, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 6.85);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.appendChild(sec);
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
  console.error(`[japan-bikeride] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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
// the end line is measured in the loaded face: re-lay it once the fonts are in
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const s of SEGS) if (s.end) layoutEnd(s.end); lastT = NaN; if (paused) render(lastDrawn); });

// ---------- draw one frame ----------
// Every cut in this spot is hard: the active segment is fully on, every other one is hidden.
let active = null, lastDrawn = 0;
function render(t) {
  ctx.W = W(); ctx.t = t; lastDrawn = t;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    cur.sec.style.opacity = '1';
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  // scene modules also get told when they are off, so a <video> inside one can pause
  for (const s of SEGS) if (s !== cur && s.mod && !s.broken && typeof s.mod.off === 'function') { try { s.mod.off(); } catch (err) { report(s, 'off', err); } }
  if (cur.kind === 'end') renderEnd(cur.end, lt);
  else if (!cur.broken) {
    try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
  }
}

// ---------- fit the stage to the window (assets/ar.js, or this spot's own 9:16, sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => {
  fit(); lastT = NaN;
  for (const s of SEGS) if (s.end) layoutEnd(s.end);
});

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
