// The spot's embedded clips (video/source-16x9 and video/short-9x16, real Mixkit footage, video/CREDITS.txt) inside a
// page that is a pure function of t. Every <video> is registered with its play window [from, to) in the spot's time:
// its clip time is clamp(t - from, 0, to - from) (+ offset), so before the window it holds its first frame and after
// it its last, and ANY t names exactly one clip frame. timeline.js calls sync(t, paused) after every frame it draws:
//   live (the gallery iframe, the clock running): inside its window the clip plays natively and the page only corrects
//     drift past DRIFT seconds; outside it the clip is paused on its held frame;
//   paused (?t= freeze, the arrow keys, window.__AD.seek): the clip is paused and its currentTime set to the exact
//     target, so a frame-by-frame export sees the clip frame that belongs to t.
// settle() resolves once every active clip has finished its seek and presented the frame (the seeked event, then
// requestVideoFrameCallback or two animation frames), with readyState >= 2; a seek that has not settled in 1.5 s is
// retried once. The renderer awaits window.__AD.settle() after every __AD.seek(t).
const CLIPS = [];
const DRIFT = 0.2; /* deliberate */   // the brief: correct live playback only past 0.2 s of drift
const SETTLE_MS = 1500;               // one seek's budget before it is retried
const EPS = 0.0005;                   // a target this close to currentTime is already shown

export function clip(v, from, to, offset = 0) {
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
  v.removeAttribute('controls');
  const c = { v, from, to, offset, target: null };
  CLIPS.push(c);
  return c;
}
// the clip time at spot time t
export const clipTime = (c, t) => c.offset + Math.max(0, Math.min(t, c.to) - c.from);

const end = (v) => (Number.isFinite(v.duration) && v.duration > 0 ? v.duration - 0.05 : 1e9);

export function sync(t, paused) {
  for (const c of CLIPS) {
    const v = c.v;
    const target = Math.max(0, Math.min(clipTime(c, t), end(v)));
    c.target = target;
    if (paused || t < c.from || t >= c.to) {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - target) > EPS) v.currentTime = target;
    } else {
      if (Math.abs(v.currentTime - target) > DRIFT) v.currentTime = target;
      if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    }
  }
}

const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const wait = (ms) => new Promise((r) => setTimeout(() => r('timeout'), ms));
// one clip: its seek done and the frame presented
function settled(c) {
  const v = c.v;
  const seeked = v.seeking ? new Promise((r) => v.addEventListener('seeked', () => r('seeked'), { once: true })) : Promise.resolve('idle');
  const ready = () => (v.readyState >= 2 ? Promise.resolve() : new Promise((r) => v.addEventListener('loadeddata', () => r(), { once: true })));
  const framed = () => (typeof v.requestVideoFrameCallback === 'function'
    ? Promise.race([new Promise((r) => v.requestVideoFrameCallback(() => r())), raf2().then(raf2)])
    : raf2());
  return Promise.race([seeked.then(ready).then(framed).then(() => 'ok'), wait(SETTLE_MS)]);
}

export async function settle() {
  const active = CLIPS.filter((c) => c.target !== null);
  await Promise.all(active.map(async (c) => {
    let r = await settled(c);
    if (r === 'timeout') {
      console.info(`[video] seek to ${c.target.toFixed(3)} on ${c.v.currentSrc.split('/').pop()} did not settle in ${SETTLE_MS} ms, retrying once`);
      c.v.currentTime = c.target;
      r = await settled(c);
      if (r === 'timeout') console.info(`[video] retry did not settle either (${c.v.currentSrc.split('/').pop()})`);
    }
  }));
  await raf2();
}

// the source pair for a clip: VP9 webm first (Playwright's Chromium has no H.264 decoder), H.264 mp4 as the fallback
export const sources = (base) => `<source src="${base}.webm" type='video/webm; codecs="vp9"'><source src="${base}.mp4" type="video/mp4">`;
