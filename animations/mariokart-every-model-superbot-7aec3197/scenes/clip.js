// The clip scene, the finale's payoff: the Turbo Kart Rally window from the play beat (tabs-assets/beats/play.js)
// grows to FULL FRAME and plays the post's real footage, img/kart/clip-montage.mp4 (1920x988, 30fps, 16.47s: racer
// select, Palm Cove Circuit flyover, countdown under the gantry, lap 1 lightning bolt, late race red shell), uncropped
// under a slim window title bar. No overlay: the clip stays clean.
//
// The hand-off is one motion. This module declares `handoff`: for that many seconds timeline.js keeps the tabs scene
// underneath, frozen on its last frame, with no crossfade at the boundary (ctx.under is its section). On lt=0 this
// window sits exactly on the chat's .play-win (bar, screen, corner radius, measured from the frozen tabs frame), so
// the cut is invisible; over GROW it eases out to full frame while the chat underneath dims away.
//
// render(lt) is a pure function of lt. The montage is a real <video> synced like play.js: want = clamp(lt, 0,
// MONTAGE_END); a frozen frame (?t= adds body.freeze) or any lt past the clip pauses it and seeks to want, and live
// playback only re-seeks once it has drifted past a quarter second.
//
// Narrower frames (4:5, 1:1, 9:16; frame aspect under FILL_ASPECT) letterbox the window top and bottom. Those bars
// are filled the standard social-video way: a second <video> of the same montage, cover-fit over the whole frame,
// blurred and dimmed, synced to the same lt by the same sync() as the window's video. It fades in on the grow's ease
// (so the hand-off frame is untouched) and fades out with the scene. At 16:9 it is never created: that output stays
// exactly what it was.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';

const H = 1080;
const img = (f) => new URL('../img/kart/' + f, import.meta.url).href;
const MONTAGE = 'clip-montage.mp4', POSTER = 'montage-poster.jpg';
const MONTAGE_DUR = 16.466667;  // 494 frames at 30fps
const MONTAGE_END = 16.44;      // the last frame starts at 16.4333: park there, never past the end
const VW = 1920, VH = 988;      // the montage's own size: the screen keeps this aspect, never cropped
const GROW = 0.5;               // chat window -> full frame
const BAR_BASE = 30;            // play.css draws the in-chat bar at 30px; every bar measurement scales from it
const BAR_FULL = 92;            // full frame at 16:9: 1080 - 988, so bar + clip fill the frame exactly
// a frozen frame re-seeks when off by more than SEED_TOL: under one 30fps frame (0.0333s), so a renderer stepping
// 1/30 re-seeks every frame; live playback only re-seeks once drifted past DRIFT_TOL
const SEED_TOL = 0.012, DRIFT_TOL = 0.25;
const FILL_ASPECT = 1.7;        // frame W/H under this gets the blurred fill (16:9 is 1.78: never)

let el = null;

// the window's final box: the screen as large as the frame allows at the clip's aspect, the bar on top, the pair
// centred (16:9 fills the frame exactly; a narrower frame letterboxes top and bottom, and there the bar keeps its
// 16:9 proportion to the window, 92px per 1920px of width, instead of a fixed 92px)
function fullBox(W) {
  const vh = Math.min(H - BAR_FULL, W * VH / VW);
  const vw = vh * VW / VH;
  const bar = vh >= H - BAR_FULL ? BAR_FULL : BAR_FULL * vw / VW;  // exactly 92 whenever the height caps (16:9)
  return { x: (W - vw) / 2, y: (H - vh - bar) / 2, w: vw, vh, bar };
}

// the chat's play window as it stands on the tabs scene's frozen last frame, in this section's px
function startBox(W, under) {
  const win = under && under.querySelector('.play-win');
  const bar = win && win.querySelector('.play-bar');
  const scr = win && win.querySelector('.play-screen');
  const stage = el.section.parentNode;
  if (bar && scr && stage) {
    const sr = stage.getBoundingClientRect();
    const k = sr.width / W;
    const br = bar.getBoundingClientRect(), vr = scr.getBoundingClientRect();
    if (k > 0 && vr.width > 0 && br.height > 0) {
      const box = { x: (vr.left - sr.left) / k, y: (br.top - sr.top) / k, w: vr.width / k, vh: vr.height / k, bar: br.height / k };
      el.last = { W, box };
      return box;
    }
  }
  if (el.last && el.last.W === W) return el.last.box;
  // no chat to measure (the tabs scene failed): roughly where the play window sits, a little under half the frame
  const w = W * 0.46, vh = w * VH / VW, b = w * BAR_BASE / 460;
  return { x: (W - w) / 2, y: H * 0.6 - (vh + b) / 2, w, vh, bar: b };
}

// one sync for every <video> of the montage: want = clamp(lt, 0, MONTAGE_END); frozen (or past the clip) pauses and
// seeks to want, live plays and re-seeks only on drift
function sync(vid, lt) {
  const want = clamp(lt, 0, MONTAGE_END);
  const live = lt < MONTAGE_END && !document.body.classList.contains('freeze');
  if (live) {
    if (vid.paused) {
      const p = vid.play();
      if (p && p.catch) p.catch((err) => console.error('clip.js: video.play() rejected', err));
    }
    if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
  } else {
    if (!vid.paused) vid.pause();
    if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
  }
}

function muteVid(vid) {
  // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
  vid.muted = true;
  vid.defaultMuted = true;
}

// the blurred fill exists only while the frame is narrower than FILL_ASPECT (mounted with the scene so it loads with
// the page; an aspect change at runtime adds or drops it)
function ensureFill(W) {
  const want = W / H < FILL_ASPECT;
  if (want && !el.fill) {
    const fill = document.createElement('div');
    fill.className = 'clip-fill';
    fill.style.opacity = '0';
    fill.innerHTML = `<video class="clip-fill-vid" muted playsinline preload="auto" poster="${img(POSTER)}" src="${img(MONTAGE)}"></video>`;
    const vid = fill.querySelector('video');
    muteVid(vid);
    el.section.insertBefore(fill, el.win);
    el.section.classList.add('has-fill');
    el.fill = { box: fill, vid };
  } else if (!want && el.fill) {
    el.fill.vid.pause();
    el.fill.vid.removeAttribute('src');
    el.fill.vid.load();
    el.fill.box.remove();
    el.section.classList.remove('has-fill');
    el.win.style.removeProperty('box-shadow');
    el.fill = null;
  }
}

export default {
  id: 'clip',
  dur: +(MONTAGE_DUR + 0.3).toFixed(4),
  handoff: GROW + 0.05,

  mount(section, ctx) {
    section.innerHTML = `
<div class="clip-win">
  <div class="clip-bar"><span class="clip-dots"><i></i><i></i><i></i></span><b class="clip-title">Turbo Kart Rally</b></div>
  <div class="clip-screen"><video class="clip-vid" muted playsinline preload="auto" poster="${img(POSTER)}" src="${img(MONTAGE)}"></video></div>
</div>`;
    const win = section.querySelector('.clip-win');
    const vid = section.querySelector('.clip-vid');
    muteVid(vid);
    el = { section, win, bar: section.querySelector('.clip-bar'), screen: section.querySelector('.clip-screen'), vid, last: null, fill: null };
    ensureFill((ctx && ctx.W) || 1920);
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;

    // the window: chat rect -> full frame. Bar contents scale with the bar (u = bar / 30) so its proportions match
    // play.css at every frame; the corner radius and the 1px edge melt away as it lands.
    const e = inOutCubic(seg(lt, 0, GROW));
    const b1 = fullBox(W);
    const b0 = e >= 1 ? b1 : startBox(W, ctx && ctx.under);
    const x = lerp(b0.x, b1.x, e), y = lerp(b0.y, b1.y, e), w = lerp(b0.w, b1.w, e);
    const vh = lerp(b0.vh, b1.vh, e), bar = lerp(b0.bar, b1.bar, e);
    const u = bar / BAR_BASE;
    const s = el.win.style;
    s.left = x.toFixed(2) + 'px';
    s.top = y.toFixed(2) + 'px';
    s.width = w.toFixed(2) + 'px';
    s.setProperty('--u', u.toFixed(4));
    s.setProperty('--bar', bar.toFixed(2) + 'px');
    s.setProperty('--vh', vh.toFixed(2) + 'px');
    s.setProperty('--r', (10 * u * (1 - e)).toFixed(2) + 'px');
    s.setProperty('--edge', (1 - e).toFixed(3));

    // the chat underneath dims away as the window takes the frame
    if (ctx && ctx.under) ctx.under.style.opacity = (1 - seg(lt, 0.1, GROW)).toFixed(3);

    // the blurred fill behind a letterboxed window: in on the grow's ease, with a deeper shadow lifting the window
    // off it (both zero on the hand-off frame, so the cut from the chat stays exact)
    ensureFill(W);
    if (el.fill) {
      el.fill.box.style.opacity = e.toFixed(3);
      s.setProperty('box-shadow', `0 18px 44px rgba(0, 0, 0, .5), 0 ${(28 * e).toFixed(2)}px ${(96 * e).toFixed(2)}px rgba(0, 0, 0, ${(0.6 * e).toFixed(3)})`);
    }

    // the montage follows lt, and the fill follows the same lt the same way
    sync(el.vid, lt);
    if (el.fill) sync(el.fill.vid, lt);
  },
};
