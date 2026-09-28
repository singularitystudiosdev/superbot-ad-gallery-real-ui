// The landing: Prasenjit's (@prasenx) Opus 5.5 bike ride, full frame, with its sound (credit in img/CREDITS.txt and
// the gallery title; no on-screen credit, house convention). gen/clip.mp4 is a 1920x1080 excerpt; it plays at full
// frame height, cover-cropped around the rider (tabs-assets/cuts.js CLIP.FOCUS_X). The chat scene ends pushed into its
// output window's 16:9 screen at exactly this scene's opening framing (scale CLIP.S0, the same x held at the centre),
// so the timeline hard-cuts here; the camera then settles on in to S0 * SETTLE over SETTLE_T (outCubic), carrying the
// push's last bit of motion across the cut.
// render(lt) is a pure function of local time: want = clamp(lt, 0, END); a frozen frame (?t=, the renderer) pauses and
// seeks to it, a playing frame plays with sound and only re-seeks past DRIFT_TOL.
import { clamp, outCubic, seg } from '../lib.js';
import { CLIP, clipFrame } from './tabs-assets/cuts.js?v=8';

const g = (f) => new URL('../gen/' + f, import.meta.url).href;
const H = 1080;
const DUR = 2.7;
const SEED_TOL = 0.02, DRIFT_TOL = 0.25;

let el = null;

// the last seekable time: never onto the file's very last frame
const endOf = (vid) => Math.min(DUR - 0.03, Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration - 0.05 : DUR);

export default {
  id: 'clip',
  dur: DUR,

  mount(section) {
    section.innerHTML = `<div class="cl-frame"><video class="cl-vid" playsinline preload="auto" poster="${g('clip-poster.jpg')}" src="${g('clip.mp4')}"></video></div>`;
    const q = (s) => section.querySelector(s);
    el = { sec: section, frame: q('.cl-frame'), vid: q('.cl-vid'), soundBlocked: false };
    // leaving the scene (or the loop) must silence it
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920;
    // the settle: S0 -> S0 * SETTLE, about the frame centre (the rider)
    const s = CLIP.S0 * Math.exp(Math.log(CLIP.SETTLE) * outCubic(seg(t, 0, CLIP.SETTLE_T)));
    const f = clipFrame(W, s);
    const x0 = W / 2 - f.fx * f.fw, y0 = (H - f.fh) / 2;
    el.frame.style.width = f.fw.toFixed(2) + 'px';
    el.frame.style.height = f.fh.toFixed(2) + 'px';
    el.frame.style.transform = `translate(${x0.toFixed(2)}px, ${y0.toFixed(2)}px)`;

    const vid = el.vid;
    const end = endOf(vid);
    const want = clamp(t, 0, end);
    const live = lt >= 0 && lt < end && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        // sound on; a browser that blocks unmuted autoplay (no user gesture yet) gets the picture muted instead
        vid.muted = el.soundBlocked;
        const p = vid.play();
        if (p && p.catch) {
          p.catch((e) => {
            if (e.name === 'NotAllowedError' && !vid.muted) { el.soundBlocked = true; vid.muted = true; vid.play().catch(() => {}); }
            else if (e.name !== 'AbortError') console.error('clip.js: video.play() rejected', e);
          });
        }
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }
  },
};
