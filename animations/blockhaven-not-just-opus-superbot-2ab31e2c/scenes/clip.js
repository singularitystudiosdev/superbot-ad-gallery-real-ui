// Act 5, the landing: @kepochnik's BlockHaven gameplay, full frame. The chat scene ends pushed into the Play card
// (its 16:9 screen covering the frame at 1.01x, the clip's first frame in it, object-fit cover), so this scene opens on
// exactly that framing (the clip at cover width, S0) and settles in COVER_OUT to the whole game frame at full height,
// uncropped, with a blurred copy of the same frame filling the side bands. The in-game hotbar comes up into the spot
// the ad's hotbar holds (timeline.js schedules the ad hotbar onto it and out). Source: kep.mp4 8.4 s to 14.467 s
// (gen/clip.mp4, 1162x840): the player chops an oak log and the block breaks at 5.7 s; the scene holds 0.3 s past the
// break and the timeline fades it.
// render(lt) is a pure function of local time: want = clamp(lt, 0, CLIP_END); a frozen frame pauses and seeks to it,
// a playing frame plays and only re-seeks past DRIFT_TOL.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';

const g = (f) => new URL('../gen/' + f, import.meta.url).href;
const H = 1080;
const VW = 1162, VH = 840;          // the clip's own frame
export const CLIP = {
  DUR: 6.3,
  BREAK: 5.7,                       // the log block breaks (source 14.100 s)
  END: 6.03,                        // never seek onto the very last frame (6.066 s long)
  COVER_OUT: [0.0, 0.55],           // cover -> full-height settle
  // the in-game hotbar in the clip's own px (bottom centre, cut by the frame's bottom edge); 182 GUI units wide
  HOTBAR: { cx: 572, top: 798, w: 414 },
};
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;

let el = null;

// the full-height frame geometry at stage width W, and the scale the chat's push hands over at
export function clipGeo(W) {
  const s = H / VH;                          // full height
  const fw = VW * s;
  const s0 = (W * 1.01) / fw;                // the Play card's 16:9 screen covering the frame at 1.01x
  return { s, fw, x0: (W - fw) / 2, s0 };
}

// where the in-game hotbar sits on the stage once the clip has settled: {cx, top, u} in stage px
export function gameHotbar(W) {
  const { s, x0 } = clipGeo(W);
  return { cx: x0 + CLIP.HOTBAR.cx * s, top: CLIP.HOTBAR.top * s, u: (CLIP.HOTBAR.w / 182) * s };
}

export default {
  id: 'clip',
  dur: CLIP.DUR,

  mount(section) {
    section.innerHTML = `
<canvas class="cl-bands" width="48" height="35"></canvas>
<div class="cl-frame"><video class="cl-vid" muted playsinline preload="auto" poster="${g('clip-poster.jpg')}" src="${g('clip.mp4')}"></video></div>
<div class="cl-credit"><b>BlockHaven</b><span>by @kepochnik</span></div>`;
    const q = (s) => section.querySelector(s);
    el = { sec: section, bands: q('.cl-bands'), frame: q('.cl-frame'), vid: q('.cl-vid'), credit: q('.cl-credit') };
    el.ctx = el.bands.getContext('2d');
    el.vid.muted = true;
    el.vid.defaultMuted = true;
    const draw = () => { if (el.vid.readyState >= 2) el.ctx.drawImage(el.vid, 0, 0, 48, 35); };
    el.draw = draw;
    el.vid.addEventListener('seeked', draw);
    el.vid.addEventListener('loadeddata', draw);
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, CLIP.DUR);
    const W = (ctx && ctx.W) || 1920;
    const G = clipGeo(W);
    const f = inOutCubic(seg(t, CLIP.COVER_OUT[0], CLIP.COVER_OUT[1]));
    const sc = lerp(G.s0, 1, f);
    el.frame.style.width = G.fw.toFixed(1) + 'px';
    el.frame.style.transform = `translate(${(W / 2).toFixed(1)}px, ${H / 2}px) scale(${sc.toFixed(4)}) translate(${(-G.fw / 2).toFixed(1)}px, ${-H / 2}px)`;
    el.bands.style.opacity = (0.9 * f).toFixed(3);
    el.credit.style.opacity = seg(t, 0.5, 0.8).toFixed(3);
    el.credit.style.transform = `translateY(${(10 * (1 - seg(t, 0.5, 0.8))).toFixed(1)}px)`;

    const want = clamp(t, 0, CLIP.END);
    const vid = el.vid;
    const live = lt >= 0 && lt < CLIP.END && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((e) => { if (e.name !== 'AbortError') console.error('clip.js: video.play() rejected', e); });
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }
    el.draw();
  },
};
