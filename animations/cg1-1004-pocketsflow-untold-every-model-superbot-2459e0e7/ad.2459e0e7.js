// ad.2459e0e7.js: the engine. The 673c104b spot's four acts end to end, at its own lengths:
//   tweet 5.0 s (the hook) | untold 3.2 s | app 36.949 s (one prompt, six beats) | end 4.4 s  = 49.549 s
// tweet > untold and untold > app are hard cuts; app fades out over its last SCENE_FADE into the end card, which
// dips to black over the loop's last DIP. Every scene renders as a pure function of its local time, so
// window.__AD.seek(t) draws any frame exactly and window.__AD.settle() resolves once its media has landed.
import { seg, settleVideos } from './lib.2459e0e7.js';
import tweet from './tweet.2459e0e7.js';
import untold from './untold.2459e0e7.js';
import app from './app.2459e0e7.js';
import end from './end.2459e0e7.js';

const SCENE_FADE = 0.3, DIP = 0.35;
const SEQ = [
  { id: 'tweet', mod: tweet, cutIn: true, cutOut: true },
  { id: 'untold', mod: untold, cutIn: true, cutOut: true },
  { id: 'app', mod: app, cutIn: true, cutOut: false },
  { id: 'end', mod: end, cutIn: true, cutOut: true },
];
let acc = 0;
for (const s of SEQ) {
  s.sec = document.getElementById(`s-${s.id}`);
  s.dur = s.mod.dur;
  s.t0 = acc; acc += s.dur; s.t1 = acc;
}
const CYCLE = +acc.toFixed(3);
const dip = document.getElementById('dip');
const stage = document.getElementById('stage');
const q = new URLSearchParams(location.search);
const freezeQ = q.has('t') && !q.has('play');
const ctx = { playing: false };

window.__AD = { CYCLE, segments: SEQ.map(({ id, t0, t1 }) => ({ id, t0: +t0.toFixed(3), t1: +t1.toFixed(3) })), ready: false };

await Promise.all(SEQ.map(async (s) => {
  try { await s.mod.mount(s.sec, ctx); } catch (e) { console.error(`mount ${s.id}`, e); }
}));

let active = null;
function render(t) {
  let cur = SEQ[SEQ.length - 1];
  for (const s of SEQ) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.mod.leave?.(); }
    cur.sec.classList.add('on');
    active = cur;
  }
  const lt = Math.min(Math.max(t - cur.t0, 0), cur.dur);
  const fout = cur.cutOut ? 1 : 1 - seg(lt, cur.dur - SCENE_FADE, cur.dur);
  cur.sec.style.opacity = fout >= 1 ? '' : fout.toFixed(3);
  try { cur.mod.render(lt, ctx); } catch (e) { console.error(`render ${cur.id}`, e); }
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();

// the clock: live in the gallery, frozen by ?t= or by seek()
const FPS = 60;
let paused = freezeQ, offset = q.has('t') ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const now = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = now(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, now() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
});
function frame() {
  if (!window.__AD.exporting) {
    ctx.playing = !paused;
    let t = ((now() % CYCLE) + CYCLE) % CYCLE;
    t = Math.round(t * FPS) / FPS;
    render(t >= CYCLE ? 0 : t);
  }
  requestAnimationFrame(frame);
}
await document.fonts.ready;
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);

window.__AD.seek = (t) => {
  window.__AD.exporting = true;
  paused = true; ctx.playing = false; offset = t;
  render(((t % CYCLE) + CYCLE) % CYCLE);
};
window.__AD.settle = async () => {
  await document.fonts.ready;
  await settleVideos();
  if (active && active.mod.settle) await active.mod.settle();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};
window.__AD.ready = true;
