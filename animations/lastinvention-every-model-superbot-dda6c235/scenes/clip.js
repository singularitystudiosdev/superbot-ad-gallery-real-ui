// The clip scene, the finale's payoff and the END of the ad: the-last-invention.mp4 player window from the play beat
// (tabs-assets/beats/play.js) grows to FULL FRAME and plays the post's real footage, img/film/clip-montage.mp4
// (1920x1080, 24 fps, 589 frames, 24.5417s): the presenter in the data centre, "It isn't evil, it's just very, very
// thorough.", the film's own cut to the bridge at night, "So, no pressure. We only have to get it right the first
// time.", the presenter on the embankment, "I'm Imogen Ashby. Try not to worry. Well, worry a bit.", then the end title
// shot (lt 14.542: the embankment at dusk, THE LAST INVENTION card fading in over it as the plate fades to black) to
// the film's true last frame (source frame 7568, the title card on black). It opens on a
// clean scene cut from the window clip's last frame (the galaxy), and the two files' audio runs on back to back
// (img/film/CREDITS.txt). The scene is exactly the montage's length: the ad ENDS on the film's own last frame, with no
// end card and no fade (the last scene of the sequence never fades out).
//
// The hand-off is one motion. This module declares `handoff`: for that many seconds timeline.js keeps the tabs scene
// underneath, frozen on its last frame, with no crossfade at the boundary (ctx.under is its section). On lt=0 this
// window sits exactly on the chat's .play-win (title bar, screen, credit footer, corner radius, measured from the frozen
// tabs frame), so the cut is invisible; over GROW it eases out to full frame while the chat underneath dims away.
// The screen is 16:9 at both ends, so the grow is one uniform scale of the whole window.
//
// At 16:9 the screen lands covering the frame edge to edge (no letterbox): the title bar rides off the top edge and the
// credit footer off the bottom, and nothing sits over the footage but the closed captions. Narrower frames (4:5, 1:1,
// 4:3, 9:16; frame aspect under FILL_ASPECT) keep the whole window, chrome and credit included, as wide as the frame
// allows and centred. The bands above and below are filled the standard social-video way: a second <video> of the same
// montage, cover-fit over the whole frame, blurred and dimmed, synced to the same lt by the same sync() as the window's
// video. It fades in on the grow's ease (so the hand-off frame is untouched). At 16:9 it is never created.
//
// Closed captions (img/film/subs.json, "clip-montage.mp4".cues, verbatim, in FILE seconds = lt): broadcast style, white
// with a soft shadow, the last line in the lower tenth of the picture, sized from the screen's height so they grow
// with the window (clip.css). None runs over the title shot (the last cue ends at 14.167, the shot opens at 14.542).
//
// render(lt) is a pure function of lt. The montage is a real <video> synced like play.js: live playback follows lt and
// only re-seeks once it has drifted past a quarter second; a frozen frame (?t= adds body.freeze), a paused clock
// (timeline.js adds body.ad-paused: space, the arrows, __AD.seek) or the montage's last frame pauses it and seeks to
// the middle of the frame lt asks for.
// Sound: both <video>s stay muted (autoplay policy). The window's video carries data-cue-* (file, start in scene
// seconds, file offset, length), and timeline.js lifts it into window.__AUDIO_CUES__ for the recorder; the blurred
// fill is picture only and carries none.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';

const H = 1080;
const img = (f) => new URL('../img/film/' + f, import.meta.url).href;
const MONTAGE = 'clip-montage.mp4', POSTER = 'poster-montage.jpg';
const CUE_FILE = 'img/film/clip-montage.mp4'; // the same file, from the ad's root (the recorder reads its audio)
const TITLE = 'the-last-invention.mp4';
// the post's author and its last line, quoted verbatim as posted, as the play window's footer shows them
const CREDIT = { who: '@gavinpurcell', said: 'it came back with this' };
const FPS = 24;
const MONTAGE_FRAMES = 589;
const MONTAGE_DUR = MONTAGE_FRAMES / FPS;              // 24.5417s
const MONTAGE_LASTF = (MONTAGE_FRAMES - 1) / FPS;      // 24.5: the last frame starts here, and the video parks on it
const MONTAGE_LAST = (MONTAGE_FRAMES - 0.5) / FPS;     // the middle of the last frame: a seek never lands past it
const VW = 1920, VH = 1080;     // the montage's own size: the screen keeps this aspect at every size
const GROW = 0.5;               // chat window -> full frame
// play.css draws the chat's window 460px wide with a 30px title bar and a 30px credit footer; every chrome measurement
// here is that times --u, so the window keeps its proportions at every size
const WIN_W = 460, BAR_BASE = 30, FOOT_BASE = 30;
// a frozen frame re-seeks when off by more than SEED_TOL: under one 24fps frame (0.0417s), so a renderer stepping
// 1/24 re-seeks every frame; live playback only re-seeks once drifted past DRIFT_TOL
const SEED_TOL = 0.012, DRIFT_TOL = 0.25;
const FILL_ASPECT = 1.7;        // frame W/H under this keeps the chrome and gets the blurred fill (16:9 is 1.78: never)
// the montage's closed captions, from img/film/subs.json ("clip-montage.mp4".cues, FILE seconds, verbatim): shown
// while in <= lt < out, one line per entry of lines
const SUBS = [
  { in: 0.655, out: 4.29, lines: ["It isn't evil,", "it's just very, very thorough."] },
  { in: 5.207, out: 6.892, lines: ['So, no pressure.'] },
  { in: 6.972, out: 8.837, lines: ['We only have to get it', 'right the first time.'] },
  { in: 8.917, out: 10.417, lines: ["I'm Imogen Ashby."] },
  { in: 11.097, out: 12.717, lines: ['Try not to worry.'] },
  { in: 12.907, out: 14.167, lines: ['Well, worry a bit.'] },
];
const subAt = (s) => SUBS.findIndex((c) => s >= c.in && s < c.out);

let el = null;

// the window's final box. 16:9 (or wider): the screen covers the frame, the title bar just above the top edge and the
// footer just below the bottom one. Narrower: the whole window (bar, screen, footer) as wide as the frame allows,
// shrunk only if it would be taller than the frame, centred.
function fullBox(W) {
  if (W / H >= FILL_ASPECT) {
    const w = Math.max(W, H * VW / VH), vh = w * VH / VW, u = w / WIN_W;
    return { x: (W - w) / 2, y: (H - vh) / 2 - BAR_BASE * u, w, vh, bar: BAR_BASE * u, foot: FOOT_BASE * u };
  }
  const perW = VH / VW + (BAR_BASE + FOOT_BASE) / WIN_W; // window height per px of width
  const w = Math.min(W, H / perW), u = w / WIN_W, vh = w * VH / VW;
  const bar = BAR_BASE * u, foot = FOOT_BASE * u;
  return { x: (W - w) / 2, y: (H - bar - vh - foot) / 2, w, vh, bar, foot };
}

// the chat's play window as it stands on the tabs scene's frozen last frame, in this section's px
function startBox(W, under) {
  const win = under && under.querySelector('.play-win');
  const bar = win && win.querySelector('.play-bar');
  const scr = win && win.querySelector('.play-screen');
  const foot = win && win.querySelector('.play-foot');
  const stage = el.section.parentNode;
  if (bar && scr && foot && stage) {
    const sr = stage.getBoundingClientRect();
    const k = sr.width / W;
    const br = bar.getBoundingClientRect(), vr = scr.getBoundingClientRect(), fr = foot.getBoundingClientRect();
    if (k > 0 && vr.width > 0 && br.height > 0) {
      const box = { x: (vr.left - sr.left) / k, y: (br.top - sr.top) / k, w: vr.width / k, vh: vr.height / k, bar: br.height / k, foot: fr.height / k };
      el.last = { W, box };
      return box;
    }
  }
  if (el.last && el.last.W === W) return el.last.box;
  // no chat to measure (the tabs scene failed): roughly where the play window sits, a little under half the frame
  const w = W * 0.46, u = w / WIN_W, vh = w * VH / VW, b = BAR_BASE * u, f = FOOT_BASE * u;
  return { x: (W - w) / 2, y: H * 0.6 - (b + vh + f) / 2, w, vh, bar: b, foot: f };
}

// one sync for every <video> of the montage: live plays and re-seeks only on drift; frozen, or on the last frame,
// pauses and seeks to the middle of the frame lt falls in
function sync(vid, lt) {
  const cl = document.body.classList;
  const live = lt < MONTAGE_LASTF && !cl.contains('freeze') && !cl.contains('ad-paused');
  if (live) {
    if (vid.paused) {
      const p = vid.play();
      if (p && p.catch) p.catch((err) => console.error('clip.js: video.play() rejected', err));
    }
    if (Math.abs(vid.currentTime - lt) > DRIFT_TOL) vid.currentTime = clamp(lt, 0, MONTAGE_LAST);
  } else {
    // (lt a hair under a frame boundary, timeline.js keeping 4 decimals, counts as on it)
    const want = clamp((Math.floor(lt * FPS + 0.01) + 0.5) / FPS, 0.5 / FPS, MONTAGE_LAST);
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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default {
  id: 'clip',
  dur: +MONTAGE_DUR.toFixed(4),
  handoff: GROW + 0.05,

  mount(section, ctx) {
    section.innerHTML = `
<div class="clip-win">
  <div class="clip-bar"><span class="clip-dots"><i></i><i></i><i></i></span><b class="clip-title">${esc(TITLE)}</b></div>
  <div class="clip-screen"><video class="clip-vid" muted playsinline preload="auto" poster="${img(POSTER)}" src="${img(MONTAGE)}"
    data-cue-file="${CUE_FILE}" data-cue-at="0" data-cue-from="0" data-cue-dur="${MONTAGE_DUR.toFixed(4)}"></video>
    <div class="clip-cc" aria-live="off"></div></div>
  <div class="clip-foot"><span class="clip-src">${esc(CREDIT.who)}</span><span class="clip-q">“${esc(CREDIT.said)}”</span></div>
</div>`;
    const win = section.querySelector('.clip-win');
    const vid = section.querySelector('.clip-vid');
    const cc = section.querySelector('.clip-cc');
    muteVid(vid);
    el = { section, win, vid, cc, sub: -2, last: null, fill: null };
    ensureFill((ctx && ctx.W) || 1920);
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;

    // the window: chat rect -> full frame. Chrome contents scale with the bar (u = bar / 30) so its proportions match
    // play.css at every frame; the corner radius and the brass hairline edge melt away as it lands.
    const e = inOutCubic(seg(lt, 0, GROW));
    const b1 = fullBox(W);
    const b0 = e >= 1 ? b1 : startBox(W, ctx && ctx.under);
    const x = lerp(b0.x, b1.x, e), y = lerp(b0.y, b1.y, e), w = lerp(b0.w, b1.w, e);
    const vh = lerp(b0.vh, b1.vh, e), bar = lerp(b0.bar, b1.bar, e), foot = lerp(b0.foot, b1.foot, e);
    const u = bar / BAR_BASE;
    const s = el.win.style;
    s.left = x.toFixed(2) + 'px';
    s.top = y.toFixed(2) + 'px';
    s.width = w.toFixed(2) + 'px';
    s.setProperty('--u', u.toFixed(4));
    s.setProperty('--bar', bar.toFixed(2) + 'px');
    s.setProperty('--vh', vh.toFixed(2) + 'px');
    s.setProperty('--foot', foot.toFixed(2) + 'px');
    s.setProperty('--r', (10 * u * (1 - e)).toFixed(2) + 'px');
    s.setProperty('--edge', (1 - e).toFixed(3));

    // the chat underneath dims away as the window takes the frame
    if (ctx && ctx.under) ctx.under.style.opacity = (1 - seg(lt, 0.1, GROW)).toFixed(3);

    // the blurred fill behind a letterboxed window: in on the grow's ease, with a deeper shadow lifting the window
    // off it (both zero on the hand-off frame, so the cut from the chat stays exact)
    ensureFill(W);
    if (el.fill) {
      el.fill.box.style.opacity = e.toFixed(3);
      s.setProperty('box-shadow', `0 ${(18 * u).toFixed(2)}px ${(44 * u).toFixed(2)}px rgba(0, 0, 0, .5), 0 ${(28 * e).toFixed(2)}px ${(96 * e).toFixed(2)}px rgba(0, 0, 0, ${(0.6 * e).toFixed(3)})`);
    }

    // the montage follows lt, and the fill follows the same lt the same way
    sync(el.vid, lt);
    if (el.fill) sync(el.fill.vid, lt);

    // the closed captions ride the montage's own clock
    const si = subAt(clamp(lt, 0, MONTAGE_LAST));
    if (si !== el.sub) {
      el.cc.innerHTML = si < 0 ? '' : SUBS[si].lines.map((l) => `<span>${esc(l)}</span>`).join('<br>');
      el.sub = si;
    }
  },
};
