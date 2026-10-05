// pocketsflow-untold, real UI: the source spot's hook and its "they wont tell you how" card, then the how, played
// in superbot-desktop main's own window (assets/hero-workspace-frontend.js, the superbot site's fidelity-checked
// port of main) with every switch drawn the way main draws it (pf-chat), then the end card.
// One clock, scrubbable: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there, window.__AD.seek(t) draws t
// exactly (export / QA); every frame is a pure function of t. Acts: tweet -> untold -> thread are hard cuts.
import { buildFrontend } from './assets/hero-workspace-frontend.js';
import { createChat } from './pf-chat.f108143e.js';
import { createCamera } from './cam.f108143e.js';
import tweet from './scenes/tweet.f108143e.js';
import untold from './scenes/untold.f108143e.js';

const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, p) => a + (b - a) * p;
const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const outQuint = (p) => 1 - Math.pow(1 - p, 5);
const $ = (s) => document.querySelector(s);
const frame = $('#frame'), cam = $('#cam'), win = $('#win'), endEl = $('#end'), dip = $('#dip');
const SEC = { tweet: $('#s-tweet'), untold: $('#s-untold'), thread: $('#s-thread') };

// ---------- the acts ----------
tweet.mount(SEC.tweet);
untold.mount(SEC.untold);
const hub = $('#hub');
const ui = buildFrontend(hub);
const chat = createChat(ui);
const T0 = { tweet: 0, untold: tweet.dur, thread: tweet.dur + untold.dur };
const PULL = [chat.T.pull, chat.T.pull + 0.6];
const END0 = +(T0.thread + chat.DUR).toFixed(3), XF = 0.4, END_DUR = 3.4, DIP = 0.35, FADE_IN = 0.2;
const CYCLE = +(END0 + END_DUR).toFixed(3);

// ---------- the window, per ratio (main's 1310x790 window; the narrow window for square and portrait) ----------
const geo = { WIN_W: 1310, WIN_H: 790, PANE_X: 298, PAD: 40, NARROW: false, W };
function layout() {
  const w = W(), NARROW_Z = 1.7;
  geo.NARROW = w / H < 1.2;
  geo.WIN_W = geo.NARROW ? Math.round(w / NARROW_Z) : 1310;
  geo.WIN_H = geo.NARROW ? Math.round(H / NARROW_Z) : 790;
  geo.PANE_X = geo.NARROW ? 0 : 298;
  geo.PAD = geo.NARROW ? 16 : 40;
  for (const el of [cam, win]) { el.style.width = geo.WIN_W + 'px'; el.style.height = geo.WIN_H + 'px'; }
  win.toggleAttribute('data-narrow', geo.NARROW);
  ui.fit?.();
}
const camera = createCamera({ win, chat, heroEl: hub.querySelector('.hwf-hero'), composerEl: hub.querySelector('.hwf-composer'), geo });
let lastCam = '';
function renderCam(ct) {
  const { cx, cy, z } = window.__AD.cam || camera.at(ct, PULL);
  const v = `translate(${(W() / 2 - cx * z).toFixed(2)}px, ${(H / 2 - cy * z).toFixed(2)}px) scale(${z.toFixed(5)})`;
  if (v !== lastCam) { cam.style.transform = v; lastCam = v; }
}

// ---------- the sidebar's live row (status dot, the turn's elapsed seconds) and the caret, off the clock ----------
const liveRow = hub.querySelector('.hwf-live'), liveT = liveRow && liveRow.querySelector('.hwf-lt'), caret = hub.querySelector('.hwf-caret');
let lastLive = '';
function renderSide(ct) {
  const run = ct >= chat.T.send && ct < chat.T.settled;
  const v = run ? `${Math.floor(ct - chat.T.send)}s` : '6:42 PM';
  if (liveT && v !== lastLive) { liveT.textContent = v; liveRow.toggleAttribute('data-working', run); lastLive = v; }
  if (caret) caret.style.opacity = ct % 1 < 0.5 ? '' : '0';
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
  const eyes = [...wrap.querySelectorAll('.mark-eye')], baseRy = eyes.map((e) => e.getAttribute('ry'));
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
endEl.innerHTML = '<div class="lock"><div class="words"><div class="end-slide"><h1>superbot</h1><p>superbot.gg</p></div></div><div class="face"></div></div>';
const mark = makeMark(220), face = endEl.querySelector('.face'), slide = endEl.querySelector('.end-slide');
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

function show(id, on) { const s = SEC[id]; s.classList.toggle('on', on); s.style.opacity = on ? '1' : '0'; }
function render(t) {
  const act = t < T0.untold ? 'tweet' : t < T0.thread ? 'untold' : 'thread';
  show('tweet', act === 'tweet'); show('untold', act === 'untold'); show('thread', act === 'thread' && t < END0 + 0.01);
  const ctx = { W: W(), H };
  tweet.render(act === 'tweet' ? t - T0.tweet : -1, ctx);
  if (act === 'untold') untold.render(t - T0.untold, ctx);
  const ct = Math.max(0, Math.min(chat.DUR, t - T0.thread));
  chat.render(act === 'thread' ? ct : 0);
  renderSide(ct);
  renderCam(act === 'thread' ? ct : 0);
  renderEnd(t);
  dip.style.opacity = Math.max(seg(t, CYCLE - DIP, CYCLE), 1 - seg(t, 0, FADE_IN)).toFixed(3);
}

window.__AD = {
  CYCLE,
  segments: [
    { kind: 'scene', id: 'tweet', t0: T0.tweet, t1: T0.untold },
    { kind: 'scene', id: 'untold', t0: T0.untold, t1: T0.thread },
    { kind: 'scene', id: 'thread', t0: T0.thread, t1: END0 },
    { kind: 'end', id: 'end', t0: END0, t1: CYCLE },
  ],
  turns: { thread0: T0.thread, ...chat.T },
};

// ---------- fit the frame to the viewport, the clock ----------
function fit() {
  frame.style.width = W() + 'px';
  const k = Math.min(innerWidth / W(), innerHeight / H);
  frame.style.transform = `translate(-50%, -50%) scale(${k})`;
  camera.refit();
  lastCam = '';
}
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now(), lastT = NaN;
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
});
function tick() {
  let t = ((clockNow() % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * 60) / 60;
  if (t >= CYCLE) t = 0;
  if (t !== lastT) { render(t); lastT = t; }
  requestAnimationFrame(tick);
}
await document.fonts.ready;
await chat.viewer.ready.catch(() => {});
const relayout = () => { layout(); fit(); camera.measure(); chat.reset(); lastT = NaN; };
relayout();
addEventListener('resize', () => { fit(); lastT = NaN; });
addEventListener('archange', relayout);
offset = ((offset % CYCLE) + CYCLE) % CYCLE;
render(offset);
requestAnimationFrame(tick);
window.__AD.seek = (t) => { document.body.classList.add('freeze'); paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;
