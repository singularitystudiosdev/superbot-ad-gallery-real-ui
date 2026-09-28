// ride: the OUTPUT of the ask, "Make a Japanese relaxing biking demo": the real footage from the reference post,
// Prasenjit (@prasenx), "opus 5.5 built this bike ride in the browser / every tree and sound generated in code",
// https://x.com/prasenx/status/2102717687604633959 (provenance in ride-assets/CREDITS.txt only; no on-screen credit).
// 6.0s of it, one continuous take: source frames 195..554 at 60fps (0:03.250 to 0:09.250 of 3:39.75), the golden-hour
// chase behind the girl on her red bicycle, from the rear three-quarter close-up past the houses to the paddies.
//   ride-assets/clip.mp4       4:5, 1080x1350: crop 864x1080 at x=480 from the 1920x1080 source, scaled 1.25x
//   ride-assets/clip-wide.mp4  16:9, 1920x1080: the same frames uncropped, used when the frame is wider than 1.2:1
// Both are 360 frames at 60fps, h264 High, keyframe every 30 frames, no audio. No edits beyond crop and scale.
//
// The clip is a real <video>, so its clock follows t (the play.js mechanism of ../pdoom-mv-every-model-superbot-abba733b):
// want = the middle of frame floor(lt * 60), so a seek never lands on a frame boundary. Held (a ?t= frame adds
// body.freeze, window.__AD.seek pauses the clock, or the clock has simply stopped): the video is paused and seeked to
// exactly want. Live: it plays and re-seeks only once it has drifted past DRIFT_TOL. Export/QA frames are seek-exact,
// including under the gallery renderer's own per-video ramp (see the 'seeked' guard in mount).
//
// Hand-off from the chat scene (a hard cut, timeline.js CUT_IN): the chat ends on its preview card, full width, 538px
// tall, centred on y=540, radius 27, showing img/ride-poster.jpg (this clip's frame 0 in that band, rendered at 2x). At
// lt=0 the full-size clip is clipped to exactly that rect; the clip then opens to the full frame over lt 0..0.55 with
// cubic-bezier(0.05,0.7,0.1,1) while the footage keeps playing underneath.
import { clamp, lerp, seg } from '../lib.js';

const H = 1080;
const FPS = 60;
const FRAMES = 360;               // source frames 195..554
const DUR = FRAMES / FPS;         // 6.0s
const CARD_H = 538, CARD_R = 27;  // the chat's preview card: y 271..809, full width
const OPEN = 0.55;                // the reveal
const SEED_TOL = 0.002;           // a held frame re-seeks whenever it is off at all
const DRIFT_TOL = 0.2;            // live playback only re-seeks once the element has drifted further than this
const A = (f) => new URL('./ride-assets/' + f, import.meta.url).href;
const VARIANTS = {
  tall: { src: A('clip.mp4'), poster: A('clip-first.jpg') },
  wide: { src: A('clip-wide.mp4'), poster: A('clip-wide-first.jpg') },
};
const variantFor = (W) => ((W || 1920) / H > 1.2 ? 'wide' : 'tall');

// the frame lt asks for, and the time in its middle (1e-3 absorbs float error on the 1/60 grid)
const frameAt = (lt) => clamp(Math.floor(lt * FPS + 1e-3), 0, FRAMES - 1);
const timeOf = (f) => (f + 0.5) / FPS;

// cubic-bezier(0.05, 0.7, 0.1, 1), solved for y at x
function bezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 40; i++) { if (X(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}
const emphasized = bezier(0.05, 0.7, 0.1, 1);

// Is the scene clock held? window.__AD.seek (export/QA) pauses the timeline without body.freeze, so every seek is
// marked and the hold lasts until t moves away from where the seek left it (the clock was resumed). The timeline
// re-renders a paused clock every rAF at the same t, so "moved" means more than a 60th and change.
// Same wrapper as pdoom's play.js, but chained: it wraps whatever seek is there (a plain function or another beat's
// __playHold accessor) and forwards later assignments to it, so two hooks in one spot never cut each other out.
const HOLD = { on: false, fresh: false, t: NaN };
let myGet = null;
function hookSeek() {
  const ad = window.__AD;
  if (!ad) return false;
  const d = Object.getOwnPropertyDescriptor(ad, 'seek');
  if (d && d.get && d.get === myGet) return true;
  if (d && !d.configurable) return false;
  const wrap = (f) => (typeof f === 'function' ? function (...a) { HOLD.on = true; HOLD.fresh = true; return f.apply(this, a); } : f);
  let wrapped = wrap(d ? (d.get ? d.get.call(ad) : d.value) : undefined);
  myGet = () => wrapped;
  Object.defineProperty(ad, 'seek', {
    configurable: true, enumerable: true, get: myGet,
    set: (f) => { if (d && d.set) { d.set.call(ad, f); wrapped = wrap(d.get.call(ad)); } else wrapped = wrap(f); },
  });
  return true;
}

let el = null;

function setVariant(key) {
  if (el.variant === key) return;
  el.variant = key;
  const v = VARIANTS[key];
  el.vid.poster = v.poster;
  el.vid.src = v.src;
  el.vid.load();
  el.vid.currentTime = timeOf(0);
}

export default {
  id: 'ride',
  dur: DUR,

  mount(section, ctx) {
    section.innerHTML = `<div class="rd-win">
      <video class="rd-vid" muted playsinline preload="auto" disablepictureinpicture disableremoteplayback></video>
    </div>`;
    const q = (s) => section.querySelector(s);
    el = { sec: section, win: q('.rd-win'), vid: q('.rd-vid'), variant: '', clk: { t: NaN, at: 0 }, hold: null };
    const vid = el.vid;
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    setVariant(variantFor(ctx && ctx.W));
    hookSeek();

    // While the clock is held the scene owns the clip's clock: a seek from outside the scene that lands off the frame
    // t asks for is put straight back on it. (The gallery renderer, prepare-gallery-videos, drives every <video> on
    // its own 1/fps ramp after __AD.seek, and its resync lands one frame ahead of a 60fps clip.) This runs in the
    // landing seek's own 'seeked', before a settle that waits for "no video seeking" can see it, so the settle then
    // waits for the corrected seek instead, and the frame it photographs is the one t asks for. (Correcting from
    // 'seeking', aborting the outside seek mid-flight, was measured to present stale frames; do not.)
    vid.addEventListener('seeked', () => {
      if (el.hold == null || !section.classList.contains('on')) return;
      if (Math.abs(vid.currentTime - el.hold) > SEED_TOL) vid.currentTime = el.hold;
    });

    // leaving the scene (or the loop) parks the clip on frame 0, so the next cut in shows it at once
    new MutationObserver(() => {
      if (section.classList.contains('on')) return;
      el.hold = null;
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - timeOf(0)) > SEED_TOL) vid.currentTime = timeOf(0);
    }).observe(section, { attributes: true, attributeFilter: ['class'] });

    // ready once the clip can seek: its first frame decoded, then one seek that landed on frame 0
    this.ready = new Promise((resolve) => {
      let done = false;
      const finish = (why) => { if (done) return; done = true; clearTimeout(to); if (why) console.warn('ride.js: ready without a landed seek:', why); resolve(); };
      const to = setTimeout(() => finish('timeout'), 20000);
      vid.addEventListener('error', () => finish(vid.error && vid.error.message ? vid.error.message : 'video error'), { once: true });
      // (a seek to the value currentTime already holds still runs and still fires 'seeked')
      const seekOnce = () => { vid.addEventListener('seeked', () => finish(), { once: true }); vid.currentTime = timeOf(0); };
      if (vid.readyState >= 2) seekOnce(); else vid.addEventListener('loadeddata', seekOnce, { once: true });
    });
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;
    setVariant(variantFor(W));
    const vid = el.vid;

    // the reveal: the chat's card rect (full width, 538 tall, centred, radius 27) opens to the full frame. It steps
    // with the clip's own 60fps frames, so the whole first frame (lt < 1/60) is exactly the card rect over frame 0
    // even when the ride's t0 does not sit on the 60fps grid (the curve is steep: 0.4 of a frame is 16% of it).
    const e = emphasized(seg(frameAt(lt) / FPS, 0, OPEN));
    const ins = lerp((H - CARD_H) / 2, 0, e), rad = lerp(CARD_R, 0, e);
    el.win.style.clipPath = e >= 1 ? 'none' : `inset(${ins.toFixed(2)}px 0px ${ins.toFixed(2)}px 0px round ${rad.toFixed(2)}px)`;

    // the clip follows t: it plays only while the clock is really running, and every other time it is parked on
    // exactly the frame t asks for
    const now = performance.now();
    const clk = el.clk;
    if (lt !== clk.t) { clk.t = lt; clk.at = now; }
    hookSeek();
    if (HOLD.on) {
      if (HOLD.fresh) { HOLD.t = lt; HOLD.fresh = false; } else if (Math.abs(lt - HOLD.t) > 0.02) HOLD.on = false;
    }
    const running = !document.body.classList.contains('freeze') && !HOLD.on && now - clk.at < 150;
    const want = timeOf(frameAt(lt));
    const live = running && lt < DUR - 0.5 / FPS;
    el.hold = live ? null : want;
    if (live) {
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((err) => { if (!(err && err.name === 'AbortError')) console.error('ride.js: video.play() rejected', err); });
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
      agreeWithRenderer(vid, want);
    }
  },
};

// The gallery renderer (upload-creation-pipeline-reddit-x-ads bin/prepare-gallery-videos, contract frame-exact-v5)
// drives every <video> on its own ramp right after __AD.seek(t): it plans v.__xadsWant + 1/fps, snapped to the
// clip's frame grid, and resyncs to currentTime + 1/fps when a scene moved the video. For a 60fps clip that resync
// lands one frame AHEAD of the frame the scene just parked, so every frame became two seeks (its, then ours back),
// and about 1 frame in 180 was photographed before the second one presented. Once the renderer has touched the
// element (its fields exist), leave its ramp on our frame: its plan then equals `want`, it issues no seek, and each
// frame is one seek. Its step (1/fps) is learned from what it wrote last time. Without the renderer this does nothing;
// if it ever changes, the 'seeked' guard in mount still puts the frame right.
function agreeWithRenderer(vid, want) {
  if (!('__xadsWant' in vid)) return;
  const wrote = vid.__xadsWant, mine = el.xads;
  if (mine && Number.isFinite(wrote) && Math.abs(wrote - mine.put) > 1e-6) {
    const step = wrote - mine.put;
    if (step > 1e-4 && step < 0.2) mine.step = step;
  }
  const step = (mine && mine.step) || 1 / FPS;
  el.xads = { put: want - step, step };
  vid.__xadsWant = want - step;
  vid.__xadsSnapped = want;
}
