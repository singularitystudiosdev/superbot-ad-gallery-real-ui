// main.js: lays the film's scenes on one clock. window.seek(t) paints frame t from scratch (render contract);
// a live preview loop runs only outside the renderer. ?t=<s> freezes a frame; space pauses; ←/→ step.
import film from './film.js';
import { W, H, seg, ease, clamp } from './core.js';

const stage = document.getElementById('stage');
const RENDER = !!window.__RENDER__;

function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(${((innerWidth - W * s) / 2).toFixed(2)}px,${((innerHeight - H * s) / 2).toFixed(2)}px) scale(${s.toFixed(5)})`;
}
addEventListener('resize', fit);
fit();

const parts = [];
let clock = 0;
for (const spec of film.scenes) {
  const sc = spec.make();
  const tr = spec.tr || 'cut';
  const ov = tr === 'cut' || !parts.length ? 0 : (spec.ov ?? 0.6);
  const start = Math.max(0, clock - ov);
  parts.push({ ...sc, start, tr, ov });
  clock = start + sc.dur;
  stage.appendChild(sc.root);
}
const duration = clock;
const cues = parts.flatMap((p) => p.cues.map((c) => ({ ...c, t: +(p.start + c.t).toFixed(3) }))).filter((c) => c.t >= 0 && c.t < duration).sort((a, b) => a.t - b.t);

function inT(p, kind, q) {
  // q: 0..1 through the transition (incoming side)
  if (kind === 'push') return { y: (1 - q) * H };
  if (kind === 'pan') return { x: (1 - q) * W };
  if (kind === 'zoom') return { s: 0.9 + 0.1 * q, o: q };
  return {};
}
function outT(kind, q) {
  if (kind === 'push') return { y: -q * H };
  if (kind === 'pan') return { x: -q * W };
  if (kind === 'zoom') return { s: 1 + 0.14 * q, o: 1 - q };
  return {};
}

function seek(t) {
  t = clamp(t, 0, duration - 1e-4);
  parts.forEach((p, i) => {
    const next = parts[i + 1];
    const endT = p.start + p.dur;
    const on = t >= p.start && t < (next ? endT : duration + 1);
    p.root.style.display = on ? '' : 'none';
    if (!on) return;
    let x = 0, y = 0, s = 1, o = 1;
    if (p.ov && t < p.start + p.ov) {
      const q = ease.inOutCubic(seg(t, p.start, p.start + p.ov));
      const v = inT(p, p.tr, q); x += v.x || 0; y += v.y || 0; s *= v.s ?? 1; o *= v.o ?? 1;
    }
    if (next && next.ov && t >= next.start) {
      const q = ease.inOutCubic(seg(t, next.start, next.start + next.ov));
      const v = outT(next.tr, q); x += v.x || 0; y += v.y || 0; s *= v.s ?? 1; o *= v.o ?? 1;
    }
    p.root.style.transform = x || y || s !== 1 ? `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(4)})` : '';
    p.root.style.opacity = o.toFixed(3);
    p.root.style.zIndex = String(i);
    p.render(t - p.start);
  });
}

async function ready() {
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
}
const isReady = ready();

window.seek = async (t) => { await isReady; seek(t); };
window.__AD = { ready: false, duration, cues, seek: (t) => seek(t), segments: parts.map((p) => ({ start: +p.start.toFixed(2), dur: +p.dur.toFixed(2), tr: p.tr })) };

isReady.then(() => {
  window.__AD.ready = true;
  if (RENDER) return;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { seek(+q.get('t')); return; }
  let paused = false, base = performance.now(), held = 0;
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { paused = !paused; if (!paused) base = performance.now() - held * 1000; }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { paused = true; held = clamp(held + (e.code === 'ArrowRight' ? 1 / 30 : -1 / 30), 0, duration); seek(held); }
    if (e.code === 'KeyR') { base = performance.now(); paused = false; }
  });
  const loop = () => {
    if (!paused) { held = ((performance.now() - base) / 1000) % (duration + 1.2); seek(Math.min(held, duration)); }
    requestAnimationFrame(loop);
  };
  loop();
});
