// B4 (4.80-5.55): the desktop watch page in the same framed window (ux/ux.js watchPage + windowFrame), the new upload
// playing: the player clip (media/player, 36 frames at 30 fps, two shots, the cut at frame 19) is drawn by frame index
// from t into a canvas in the player's media slot, and the time pill and the red played fill advance with it.
import { seg, outCubic, clamp } from '../../../lib.js';
import { watchPage, windowFrame } from '../../../ux/ux.js';
import { drawSeq, seqIndex } from '../frames.js';
import { WATCH, B5, FPS } from '../marks.js';
import { WIN, DESIGN_W } from './studio.js';

const secs = (mmss) => mmss.split(':').reduce((a, b) => a * 60 + +b, 0);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function buildWatch(layer, data, seq) {
  const K = WIN.w / DESIGN_W;
  const win = windowFrame(watchPage(data, { playing: true }), {
    url: `youtube.com/watch?v=${data.video.id}`, tab: `${data.video.title} - YouTube`, scale: K,
  });
  layer.appendChild(win);
  const q = (s) => win.querySelector(`[data-ux="${s}"]`);
  const media = q('player-media');
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  canvas.className = 'x3-player-canvas';
  media.appendChild(canvas);
  const poster = q('player-poster');
  if (poster) poster.style.visibility = 'hidden';
  return {
    layer, win, K, seq, canvas, fit: win.querySelector('.ytx-win-fit'), view: q('window-view'), player: q('player'),
    time: q('time-current'), play: q('progress-play'), dot: q('scrubber'),
    len: secs(data.video.length), cur0: secs(data.watch.current), last: '',
  };
}

export function renderWatch(w, t) {
  const vis = t >= WATCH.in[0] - 0.01 && t < B5 + 0.01;
  w.layer.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return;
  const a = outCubic(seg(t, WATCH.in[0], WATCH.in[1]));
  w.layer.style.opacity = a.toFixed(3);
  w.layer.style.transform = `translateY(${((1 - a) * 30).toFixed(2)}px)`;
  // the clip, by frame index
  const i = clamp(seqIndex(t, WATCH.play0, FPS), 0, w.seq.length - 1);
  drawSeq(w.canvas, w.seq, i);
  const pos = w.cur0 + Math.max(0, t - WATCH.in[0]);
  const txt = fmt(pos);
  if (txt !== w.last) { w.time.textContent = txt; w.last = txt; }
  const p = ((pos / w.len) * 100).toFixed(3) + '%';
  w.play.style.width = p;
  w.dot.style.left = p;
  // the page stays fitted to the window (the clip carries its own push-in), so the masthead and Up next never crop
  w.fit.style.transform = `scale(${w.K})`;
}
