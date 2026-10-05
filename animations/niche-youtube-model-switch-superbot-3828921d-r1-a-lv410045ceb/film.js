// The clock. Mounts the three scenes into the 1920x1080 frame, scales the frame to the window (never above 1),
// plays on a 60 fps quantised clock, and exposes window.__AD.seek(t) for the renderer.
// Keys: space pauses, arrows step one frame, R restarts.
import { mountChat, measureChat, renderChat } from './chat.js';
import { mountYouTube, measureYouTube, renderYouTube } from './youtube.js';
import { mountEnd, renderEnd } from './end.js';
import { CYCLE } from './timing.js';

const FPS = 60;
const frame = document.getElementById('frame');
const chat = mountChat(frame);
const yt = mountYouTube(frame);
const end = mountEnd(frame);

function fit() {
  const s = Math.min(1, window.innerWidth / 1920, window.innerHeight / 1080);
  frame.style.transform = s === 1 ? 'none' : `scale(${s})`;
  frame.style.left = `${Math.max(0, (window.innerWidth - 1920 * s) / 2)}px`;
  frame.style.top = `${Math.max(0, (window.innerHeight - 1080 * s) / 2)}px`;
}

function render(t) {
  renderChat(chat, t);
  renderYouTube(yt, t);
  renderEnd(end, t);
}

let paused = false, offset = 0, t0 = performance.now();
const now = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
const quant = (t) => Math.round((((t % CYCLE) + CYCLE) % CYCLE) * FPS) / FPS;

function loop() {
  if (!paused) render(quant(now()));
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = now(); paused = true; } }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = quant(now() + (e.key === 'ArrowRight' ? 1 : -1) / FPS); paused = true; render(offset); }
  if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
});

window.__AD = { CYCLE, FPS, ready: false };
window.__AD.seek = (t) => { paused = true; offset = t; render(Math.min(t, CYCLE - 1 / FPS)); };

(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  measureChat(chat);
  measureYouTube(yt);
  fit();
  window.addEventListener('resize', fit);
  render(0);
  window.__AD.ready = true;
  if (!/[?&]render\b/.test(location.search)) { t0 = performance.now(); requestAnimationFrame(loop); }
  else paused = true;
})().catch((e) => { console.error(e.stack || e); throw e; });
