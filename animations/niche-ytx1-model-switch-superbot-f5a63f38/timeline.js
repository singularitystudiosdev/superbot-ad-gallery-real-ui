// niche-ytx1-model-switch-superbot: "Broadcast lower-thirds". Three HARD cuts inside YouTube Studio's channel
// Comments page (ux/studio.js, a framed browser window on superbot's dark stage), each model named by a TV-style
// lower-third as it works, ending on the pinned reply with the creator heart. 6.8 s, 204 frames at 30 fps.
//   CUT 1  f0-68    GEMINI / Ranks 1,284 comments: the counter ticks to 1,284 ranked, Priya's question gets rank 1,
//                   rises to the top with a soft highlight, ranks 2-5 stamp onto the rows under it.
//   CUT 2  f69-134  CLAUDE OPUS 5.5 / Writes the reply in Sam's voice: closer Studio state, the composer open under
//                   Priya's comment, the reply typing (done by 4.15 s, then held).
//   CUT 3  f135-203 SUPERBOT / Posts it and pins it: Priya on top, "Pinned by Sam Rivera", Sam's reply posted in the
//                   owner pill, the creator heart pops at ~4.8-5.1 s; holds to the last frame.
// The whole spot is a pure function of t (the ytv9 engine's clock): every Studio setter is called every frame with
// that frame's value. ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there, space pauses, arrows step 1 frame,
// R restarts; window.__AD.seek(t) draws t and holds (the renderer's hook).
import { buildStudio, STORY, INITIAL_ORDER, RANKED_ORDER, typedReply } from './ux/studio.js';
import { seg, outCubic, inOutCubic, blink } from './lib.js';
import { makeLowerThird, makeBug } from './lowerthird.js';

const FPS = 30;
const FRAMES = 204;                       // 6.8 s (hard cap 6.9 s)
const CYCLE = FRAMES / FPS;
// first frame of each cut; a cut runs to the frame before the next one (cut 3 to the last frame)
const CUTS = [
  { f0: 0, name: 'GEMINI', line: 'Ranks 1,284 comments' },
  { f0: 69, name: 'CLAUDE OPUS 5.5', line: "Writes the reply in Sam's voice" },
  { f0: 135, name: 'SUPERBOT', line: 'Posts it and pins it' },
];
CUTS.forEach((c, i) => { c.t0 = c.f0 / FPS; c.f1 = i + 1 < CUTS.length ? CUTS[i + 1].f0 - 1 : FRAMES - 1; });

// per-cut camera: Studio page zoom, the framed window's scale and offset (stage px). The window sits a little below
// centre so the network bug has the canvas above its top-right corner; all four bezel edges stay on the canvas.
const CAM = [
  { zoom: 1.1, frame: [0.955, 0, 20] },
  { zoom: 1.3, frame: [0.98, 0, 28] },
  { zoom: 1.15, frame: [0.955, 0, 20] },
];
// cut-local beats (seconds since the cut's first frame)
const B = {
  counterIn: [0.1, 0.3], counterRun: [0.2, 1.75],
  rank1: 0.4, rise: [0.7, 1.3], ranksRest: 1.3, rankStep: 0.1, stamp: 0.25, highlight: [0.45, 0.8],
  type: [0.12, 1.85],                    // cut 2: 2.42 s .. 4.15 s
  heart: [0.3, 0.9],                     // cut 3: 4.80 s .. 5.40 s (pop, then the badge pulse)
};
const REST = RANKED_ORDER.slice(1, 5);   // ranks 2..5 after Priya

const stage = document.getElementById('stage');
const studioRoot = document.getElementById('studio');
const api = buildStudio(studioRoot, STORY, { base: '', zoom: CAM[0].zoom });
const straps = CUTS.map((c) => makeLowerThird(stage, c.name, c.line));
makeBug(stage);
const ids = Object.keys(api.rows);

// ---------- draw one frame ----------
function cutAt(t) {
  const f = Math.min(FRAMES - 1, Math.max(0, Math.floor(t * FPS + 1e-6)));
  let k = 0;
  for (let i = 0; i < CUTS.length; i++) if (f >= CUTS[i].f0) k = i;
  return k;
}
function render(t) {
  const k = cutAt(t);
  const lt = Math.max(0, t - CUTS[k].t0);
  const cam = CAM[k];
  api.setZoom(cam.zoom);
  api.setFrame(...cam.frame);

  if (k === 0) {
    api.setComposer(0); api.setReplyText('', false); api.setPinned(0); api.setPosted(0); api.setHeart(0);
    api.setOrder(INITIAL_ORDER, RANKED_ORDER, inOutCubic(seg(lt, ...B.rise)));
    for (const id of ids) {
      let n = null, p = 0;
      if (id === STORY.target) { n = 1; p = seg(lt, B.rank1, B.rank1 + B.stamp); }
      const j = REST.indexOf(id);
      if (j >= 0) { const a = B.ranksRest + j * B.rankStep; n = j + 2; p = seg(lt, a, a + B.stamp); }
      api.setRank(id, n, p);
      api.setHighlight(id, id === STORY.target ? outCubic(seg(lt, ...B.highlight)) : 0);
    }
    api.setCounter(STORY.totalComments * outCubic(seg(lt, ...B.counterRun)), seg(lt, ...B.counterIn));
    api.setScroll(0);
  } else if (k === 1) {
    for (const id of ids) { api.setRank(id, null, 0); api.setHighlight(id, 0); }
    api.setCounter(0, 0); api.setPinned(0); api.setPosted(0); api.setHeart(0);
    api.setComposer(1);
    const p = seg(lt, ...B.type);
    const text = typedReply(p);
    // the text caret: solid while characters land, blinking before the first and after the last
    const typing = p > 0 && p < 1;
    api.setReplyText(text, typing || blink(lt));
    api.setOrder(RANKED_ORDER, RANKED_ORDER, 1);
    api.setScroll(api.scrollForRow(STORY.target, 20));
  } else {
    for (const id of ids) { api.setRank(id, null, 0); api.setHighlight(id, 0); }
    api.setCounter(0, 0); api.setComposer(0); api.setReplyText('', false);
    api.setPinned(1); api.setPosted(1);
    api.setHeart(seg(lt, ...B.heart));
    api.setOrder(RANKED_ORDER, RANKED_ORDER, 1);
    api.setScroll(0);
  }
  straps.forEach((s, i) => s.render(i === k ? lt : 0, i === k));
}

// ---------- fit the 1920x1080 stage to the window (16:9 only) ----------
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();

// ---------- the clock (ytv9 / waffles-website) ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function restart() { offset = 0; t0 = performance.now(); paused = false; }
const wrap = (t) => ((t % CYCLE) + CYCLE) % CYCLE;
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 1 : -1) / FPS); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});

window.__AD = {
  CYCLE, FPS, FRAMES,
  segments: CUTS.map((c, i) => ({ kind: 'cut', id: `cut${i + 1}`, t0: c.t0, t1: (c.f1 + 1) / FPS, f0: c.f0, f1: c.f1 })),
  ready: false,
};
// sound marks for the renderer: a tick on each cut, a soft chime on the creator heart
window.__AD_MARKS = { ticks: CUTS.map((c) => c.t0), chimes: [CUTS[2].t0 + B.heart[0]] };
window.__V7 = { CYCLE, SPEED: 1, restart, T: Object.fromEntries(CUTS.map((c, i) => [`cut${i + 1}`, c.t0])) };

let started = false;
function frame() {
  // a 30 fps quantised clock: the live loop shows exactly the frames the MP4 holds
  const t = Math.floor(wrap(clockNow()) * FPS + 1e-6) / FPS;
  render(t);
  requestAnimationFrame(frame);
}
render(wrap(offset));
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; render(Math.min(t, CYCLE - 1 / FPS)); };
api.ready().then(() => {
  if (!document.fonts) return null;
  return Promise.all([document.fonts.load('800 48px "YX Sans"'), document.fonts.load('500 28px "YX Sans"'),
    document.fonts.load('700 30px "YX Sans"')]);
}).then(() => {
  if (!paused) t0 = performance.now(); // the live loop starts from `offset` (frame 0) once fonts and images are in
  render(Math.floor(wrap(clockNow()) * FPS + 1e-6) / FPS);
  window.__AD.ready = true;
  if (!started) { started = true; requestAnimationFrame(frame); }
});
