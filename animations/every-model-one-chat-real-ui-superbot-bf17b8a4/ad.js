// every-model-one-chat, real UI: the source spot's three asks played in superbot-desktop main's
// own window (assets/hero-workspace-frontend.js, the superbot site's fidelity-checked port of
// main), routed the way main routes them (assets/chat-more.js header), then the end card.
// One clock, scrubbable: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// window.__AD.seek(t) draws t exactly (export / QA); every frame is a pure function of t.
//
// Camera (Screen Studio style): it opens pushed in on the greeting and the composer while the
// first ask types, then follows what has landed (the ask, its switch and steps, the approval,
// the answer and its payoff), and pulls back to the whole window before the end card.

import { buildFrontend } from './assets/hero-workspace-frontend.js';
import { createChat } from './assets/hero-workspace-chat.js';

const frame = document.getElementById('frame');
const cam = document.getElementById('cam');
const win = document.getElementById('win');
const endEl = document.getElementById('end');
const dip = document.getElementById('dip');

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const outQuint = (p) => 1 - Math.pow(1 - p, 5);
const within = (v, a, b) => (a > b ? (a + b) / 2 : Math.min(Math.max(v, a), b));

// ---------- the app ----------
const hub = document.getElementById('hub');
const ui = buildFrontend(hub);
const chat = createChat(ui);
const { T, MORE } = chat;
const F = chat.frames;

// ---------- the timeline ----------
const H = 1080;
// the window: main at its captures' 1310x790 for landscape frames (the pane starts after the 240
// sidebar + 8 splitter, at 1.2: x 298); for the square and portrait feed frames, main's narrow
// window (the replica drops to the pane alone, sidebar hidden, under 924px), sized to fill the
// frame at NARROW_Z so the chat reads at feed size
const NARROW_Z = 1.7;
let WIN_W = 1310, WIN_H = 790, PANE_X = 298, NARROW = false;
const CHAT0 = 0.1;
const CHAT_END = CHAT0 + chat.DUR;
const PULL = [CHAT_END - 0.1, CHAT_END + 0.55];
const END0 = PULL[1] + 0.45;              // the wide shot holds on the whole app (the sidebar's new row)
const XF = 0.4;                           // wide shot -> end card crossfade
const END_DUR = 3.4, DIP = 0.35, FADE_IN = 0.2;
const CYCLE = +(END0 + END_DUR).toFixed(3);
const g = (ct) => CHAT0 + ct;             // chat time -> ad time

// ---------- the camera ----------
// It follows what has landed: at every moment the shot frames the current beat's nodes so far
// (the ask, then its switch and each step as it rises, the approval card, the answer and its
// payoff), clipped to the thread's viewport. The boxes are sampled once per layout (window px),
// fitted per ratio, and smoothed twice with a moving average, so the camera eases between beats
// and rides the thread's scroll. The composer is either wholly in a shot or out of it (it leaves
// through the bottom), never cropped at the sides.
const W = () => (window.AR && window.AR.w) || 1920;
const Z_MAX = 2.4, TOP_MIN = 100, DT = 1 / 30, SMOOTH = 0.3;
let PAD = 40, COL_W = 720, COMPOSER_W = 883;  // the thread's column and main's composer, window px (measured)
const heroEl = hub.querySelector('.hwf-hero'), composerEl = hub.querySelector('.hwf-composer');
// the nodes in focus at chat time ct
function focusAt(ct) {
  if (ct < T.send) return [heroEl, composerEl];
  // while Gemini makes the image the composer's model chip shows the routed model: keep it in shot
  if (ct < T.done) return [F.user, ct >= T.row && F.think, ct >= T.sw && F.sw, ct >= T.live && F.slot, ct >= T.live - 0.1 && composerEl];
  const m = MORE.turns;
  if (ct < m[0].send) return [F.say, F.slot];
  for (let i = 0; i < m.length; i++) {
    const u = m[i], f = F.more[i];
    if (m[i + 1] && ct >= m[i + 1].send) continue;
    const landed = (pairs) => pairs.filter(([a]) => ct >= a).map(([, nd]) => nd);
    if (ct >= u.r) return [f.say, ...landed(f.payoff)];
    if (f.gate && ct >= f.gate[0]) return [f.nest, f.gate[1]];
    return [f.user, ct >= u.sw && f.pill, ...landed(f.steps)];
  }
  return [composerEl];
}
// a node set's box in window px, each node clipped to the thread's viewport when it lives there
function rectOf(nd, wr, k) {
  const r = nd.getBoundingClientRect();
  return [(r.left - wr.left) / k, (r.top - wr.top) / k, (r.right - wr.left) / k, (r.bottom - wr.top) / k];
}
function boxOf(nodes) {
  const wr = win.getBoundingClientRect(), k = wr.width / WIN_W;
  const view = rectOf(chat.el, wr, k);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const nd of nodes) {
    if (!nd) continue;
    let r = rectOf(nd, wr, k);
    if (r[2] - r[0] <= 0 || r[3] - r[1] <= 0) continue;
    if (chat.el.contains(nd)) {
      r = [Math.max(r[0], view[0]), Math.max(r[1], view[1]), Math.min(r[2], view[2]), Math.min(r[3], view[3])];
      if (r[2] <= r[0] || r[3] <= r[1]) continue;
    }
    x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[2]); y1 = Math.max(y1, r[3]);
  }
  const comp = rectOf(composerEl, wr, k);
  return { box: x0 < x1 ? [x0, y0, x1, y1] : comp, comp };
}
let SAMPLES = null, SHOTS = null;
const N_SAMPLES = () => Math.ceil(PULL[1] / DT) + 1;
function measureCamera() {
  // the column and the composer at this layout (the column read once the thread is drawn)
  chat.render(T.settled);
  const wr = win.getBoundingClientRect(), k = wr.width / WIN_W;
  const col = rectOf(F.user, wr, k), comp = rectOf(composerEl, wr, k);
  COL_W = col[2] - col[0]; COMPOSER_W = comp[2] - comp[0];
  SAMPLES = [];
  for (let i = 0; i < N_SAMPLES(); i++) {
    const ct = Math.max(0, Math.min(chat.DUR, i * DT - CHAT0));
    chat.render(ct);
    SAMPLES.push(boxOf(focusAt(ct)));
  }
}
function shots() {
  const w = W();
  // the whole window: framed with a margin on landscape; the narrow window fills a feed frame
  const zWide = NARROW ? Math.max(w / WIN_W, H / WIN_H) : Math.min((w - 96) / WIN_W, (H - 72) / WIN_H);
  const wide = { cx: WIN_W / 2, cy: WIN_H / 2, lz: Math.log(zWide) };
  const fit = ({ box: [x0, y0, x1, y1], comp }) => {
    const ctop = comp[1], mid = (y0 + y1) / 2;
    const zFor = (minW) => Math.max(zWide, Math.min(Z_MAX, w / (Math.max(x1 - x0, minW) + 2 * PAD), H / (y1 - y0 + 2 * PAD)));
    const placeX = (z, minW) => {
      const hw = w / z / 2;
      const cx0 = Math.min(x0, (x0 + x1 - minW) / 2), cx1 = Math.max(x1, (x0 + x1 + minW) / 2);
      const left = 2 * hw <= WIN_W - PANE_X ? PANE_X : 0;   // no sidebar sliver when the shot is narrower than the pane
      return within((cx0 + cx1) / 2, left + hw, WIN_W - hw);
    };
    let z = zFor(COL_W), hh = H / z / 2;
    if (y1 <= ctop + 1 && 2 * hh <= ctop) {
      // the beat sits above the composer: the shot ends at the composer's top edge (and starts
      // under the header when there is room), so no strip of either shows
      const top = 2 * hh <= ctop - TOP_MIN ? TOP_MIN : 0;
      return { cx: placeX(z, COL_W), cy: within(mid, top + hh, ctop - hh), lz: Math.log(z) };
    }
    // the composer is in the shot: all of it (and a shot wider than the pane takes the whole window
    // width, the sidebar entire rather than a sliver of it)
    z = Math.min(z, zFor(COMPOSER_W));
    if (!NARROW && w / z > WIN_W - PANE_X + 1) z = Math.max(Math.min(z, w / WIN_W), zWide);
    hh = H / z / 2;
    return { cx: placeX(z, COMPOSER_W), cy: within(Math.max(mid, TOP_MIN + hh), hh, WIN_H - hh), lz: Math.log(z) };
  };
  let path = SAMPLES.map(fit);
  // two passes of a centred moving average: the beat changes ease in and out, the scroll is ridden smoothly
  const r = Math.round(SMOOTH / DT);
  for (let pass = 0; pass < 2; pass++) {
    path = path.map((_, i) => {
      let cx = 0, cy = 0, lz = 0, n = 0;
      for (let j = i - r; j <= i + r; j++) { const p = path[Math.min(path.length - 1, Math.max(0, j))]; cx += p.cx; cy += p.cy; lz += p.lz; n++; }
      return { cx: cx / n, cy: cy / n, lz: lz / n };
    });
  }
  // smoothing blends shots across a beat change, which can let the composer peek in at the bottom
  // of a shot narrower than it. A peek (under 40px) pans the shot up so the composer stays out; a real
  // entrance (past 80px) widens to the whole composer and pans onto it; between, the two blend, so the
  // path stays continuous and the composer is never left cut at the sides
  const zComp = Math.max(zWide, w / (COMPOSER_W + 2 * PAD));
  const mix = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), lz: lerp(a.lz, b.lz, k) });
  path = path.map((p, i) => {
    const [cl, ctop, cr] = SAMPLES[i].comp;
    const z0 = Math.exp(p.lz), hh0 = H / z0 / 2, d = p.cy + hh0 - ctop;
    if (d <= 0 || z0 <= zComp + 1e-6) return { cx: within(p.cx, w / z0 / 2, WIN_W - w / z0 / 2), cy: within(p.cy, hh0, WIN_H - hh0), lz: p.lz };
    const zA = Math.max(z0, H / ctop), hhA = H / zA / 2;                                   // short enough to fit above it
    const A = { cx: p.cx, cy: ctop - hhA, lz: Math.log(zA) };                               // pan up, composer out
    const hhB = H / zComp / 2, hwB = w / zComp / 2;
    const B = { cx: within(p.cx, cr + PAD - hwB, cl - PAD + hwB), cy: within(p.cy, hhB, WIN_H - hhB), lz: Math.log(zComp) }; // the whole composer
    const q = mix(A, B, inOutCubic(clamp01((d - 40) / 40)));
    const z = Math.exp(q.lz), hh = H / z / 2, hw = w / z / 2;
    return { cx: within(q.cx, hw, WIN_W - hw), cy: within(q.cy, hh, WIN_H - hh), lz: q.lz };
  });
  return { wide, path };
}
const mix = (a, b, p) => ({ cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), lz: lerp(a.lz, b.lz, p) });
function camAt(t) {
  const P = SHOTS.path, f = Math.max(0, Math.min(P.length - 1, t / DT)), i = Math.floor(f);
  let c = mix(P[i], P[Math.min(P.length - 1, i + 1)], f - i);
  if (t > PULL[0]) c = mix(c, SHOTS.wide, inOutCubic(seg(t, PULL[0], PULL[1])));
  return { cx: c.cx, cy: c.cy, z: Math.exp(c.lz) };
}
let lastCam = '';
function renderCam(t) {
  const { cx, cy, z } = window.__AD.cam || camAt(t);   // __AD.cam: QA pins a shot (1:1 against main's captures)
  const v = `translate(${(W() / 2 - cx * z).toFixed(2)}px, ${(H / 2 - cy * z).toFixed(2)}px) scale(${z.toFixed(5)})`;
  if (v !== lastCam) { cam.style.transform = v; lastCam = v; }
}

// ---------- the live sidebar row and the caret, off the clock ----------
// main's working row: a status dot, the turn's elapsed seconds and a progress track; settled, the stamp
const liveRow = hub.querySelector('.hwf-live');
const liveT = liveRow && liveRow.querySelector('.hwf-lt');
const RUNS = [[T.send, T.settled], ...MORE.turns.map((u) => [u.send, u.settle])];
const caret = hub.querySelector('.hwf-caret');
let lastLive = '';
function renderSide(ct) {
  const run = RUNS.find(([a, b]) => ct >= a && ct < b);
  const v = run ? `${Math.floor(ct - run[0])}s` : '6:42 PM';
  if (liveT && v !== lastLive) { liveT.textContent = v; liveRow.toggleAttribute('data-working', !!run); lastLive = v; }
  if (caret) caret.style.opacity = ct % 1 < 0.5 ? '' : '0';  // main's caret-pulse, 1000ms
}

// ---------- the end card: the mascot pops, the line slides out from behind it ----------
function makeMark(size) {
  const host = document.createElement('span');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null;
  return {
    el: host,
    render(t) {
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { a.pause(); a.currentTime = Math.max(0, t) * 1000; }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6, shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}
// the source spot's line, widened to what the spot shows: one model and two apps, in one chat
endEl.innerHTML = '<div class="lock"><div class="words"><div class="end-slide"><h1>EVERY MODEL.<br>EVERY APP.<br>ONE CHAT.</h1><p>superbot.gg</p></div></div><div class="face"></div></div>';
const mark = makeMark(220);
const face = endEl.querySelector('.face'), slide = endEl.querySelector('.end-slide');
face.appendChild(mark.el);
function renderEnd(t) {
  const lt = t - END0;
  endEl.style.opacity = seg(t, END0 - XF, END0).toFixed(3);
  endEl.style.visibility = t < END0 - XF ? 'hidden' : '';
  const f = seg(lt, 0, 0.5);
  face.style.opacity = f.toFixed(3);
  face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  slide.style.opacity = w.toFixed(3);
  mark.render(Math.max(0, lt));
}

function render(t) {
  const ct = Math.max(0, Math.min(chat.DUR, t - CHAT0));
  chat.render(ct);
  renderSide(ct);
  renderCam(t);
  renderEnd(t);
  // the loop seam: a dip to black at the end, a 0.2s rise from it at the start
  dip.style.opacity = Math.max(seg(t, CYCLE - DIP, CYCLE), 1 - seg(t, 0, FADE_IN)).toFixed(3);
}

window.__AD = {
  CYCLE,
  segments: [
    { kind: 'scene', id: 'chat', t0: 0, t1: +END0.toFixed(3) },
    { kind: 'end', id: 'end', t0: +END0.toFixed(3), t1: CYCLE },
  ],
  turns: { chat0: CHAT0, ...T, more: MORE.turns.map((u) => ({ send: u.send, sw: u.sw, ok: u.ok, r: u.r, settle: u.settle, end: u.end })) },
  camAt: (t) => camAt(t),
};

// ---------- lay the window out for the ratio, fit the frame to the viewport ----------
function layout() {
  const w = W();
  NARROW = w / H < 1.2;
  WIN_W = NARROW ? Math.round(w / NARROW_Z) : 1310;
  WIN_H = NARROW ? Math.round(H / NARROW_Z) : 790;
  PANE_X = NARROW ? 0 : 298;
  PAD = NARROW ? 16 : 40;
  for (const el of [cam, win]) { el.style.width = WIN_W + 'px'; el.style.height = WIN_H + 'px'; }
  win.toggleAttribute('data-narrow', NARROW);
  ui.fit?.();
}
function fit() {
  const w = W();
  frame.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  frame.style.transform = `translate(-50%, -50%) scale(${k})`;
  if (SAMPLES) SHOTS = shots();
  lastCam = '';
}

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
});
let lastT = NaN;
function tick() {
  let t = ((clockNow() % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  if (t !== lastT) { render(t); lastT = t; }
  requestAnimationFrame(tick);
}
// fonts first: the chat and the camera measure layout once, so they must measure the real face
await document.fonts.ready;
const relayout = () => { layout(); fit(); measureCamera(); SHOTS = shots(); lastT = NaN; };
relayout();
addEventListener('resize', () => { fit(); lastT = NaN; });
addEventListener('archange', relayout);
offset = ((offset % CYCLE) + CYCLE) % CYCLE;
render(offset);
requestAnimationFrame(tick);
window.__AD.seek = (t) => { paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;
