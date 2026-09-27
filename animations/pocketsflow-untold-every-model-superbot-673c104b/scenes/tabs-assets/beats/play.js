// Play beat, the finale: superbot streams the done line, its two tool chips land and resolve (rendering, then
// playing), and the film window grows in playing the real Pocketsflow launch film (@achxvi's 15s clip, img/pf/clip.mp4,
// 1280x720 30fps, no audio; built from /tmp/achxvi.673c104b/achxvi-1080.mp4, credits in img/CREDITS.txt). The window is
// on screen for 6.5s, so the film runs from CLIP_START: the pssst hook, the sell line, the product cards on blue and the
// phone storefront. The clip is a real <video>, so its clock follows t: want = CLIP_START + clamp(t - T.v0, 0, ...).
// A frozen frame (?t= adds body.freeze) or any t outside the play window pauses it and seeks to want; inside the
// window it plays and only re-seeks once it has drifted past a quarter second. No Date and no rAF state: every moving
// value in this module is written from t, so a frozen frame always renders the same pixels.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered it. The Pocketsflow launch film, 15s at 1080p.';
const CHIPS = [['Rendering 450 frames', 'Rendered in 52s'], ['Playing film', 'Now playing']];
const TITLE = 'pocketsflow-launch.mp4';
const POSTER = 'pf/poster.jpg';      // the film at 0.9s: the mascot's pssst
const CLIP = 'pf/clip.mp4';
const CLIP_START = 0.4; // where the window's playback begins in the film (just before the pssst bubble)
const CLIP_END = 14.9;  // the film is 15s long: stop just short of the end so a seek never lands past the last frame
const SEED_TOL = 0.04;  // a frozen or out-of-window frame only moves currentTime when it is off by more than this
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;           // the window grows in and the clip starts here
    T.end = T.v0 + 6.5;       // the clip is on screen for 6.5s
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">${x.esc(TITLE)}</b></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video></div>
    </div>`);
    const vid = card.querySelector('.play-vid');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows, card],
      // the last two marks put the card in view as it lands and then settle it once it has finished growing
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, card], [T.v0 + 0.55, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the window grows in, then the camera keeps pushing in on it for as long as the clip runs
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        const push = lerp(1, 1.03, seg(t, T.v0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;

        // the clip follows t: it plays inside the window, and every other time it is parked on the frame t asks for
        const want = CLIP_START + clamp(t - T.v0, 0, CLIP_END - CLIP_START);
        const live = t >= T.v0 && t <= T.end && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const p = vid.play();
            if (p && p.catch) p.catch((e) => console.error('play.js: video.play() rejected', e));
          }
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
        }
      },
    };
  },
};