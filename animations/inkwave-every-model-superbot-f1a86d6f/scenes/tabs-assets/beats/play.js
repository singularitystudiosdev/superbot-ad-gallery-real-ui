// Play beat, the finale: superbot streams the done line, its two tool chips land and resolve (launching, then
// joining), and the Inkwave window grows in playing the captured clip. The clip is real gameplay from the post,
// trimmed from a bit into it rather than from its opening: 7.5s, no audio, cropped to 4:5 portrait at 720x900, and it
// ends on the DOUBLE SPLAT! callout (img/ink/play/CREDITS.txt records the source post and window). The clip is a real
// <video>, so its clock follows t: want = clamp(t - T.v0, 0, 7.4).
// A frozen frame (?t= adds body.freeze) or any t outside the play window pauses it and seeks to want; inside the
// window it plays and only re-seeks once it has drifted past a quarter second. No Date and no rAF state: every moving
// value in this module is written from t, so a frozen frame always renders the same pixels.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Inkwave is live at inkwave-turf.vercel.app. Ink the plaza.';
const CHIPS = [['Launching Inkwave', 'Live at inkwave-turf.vercel.app'], ['Joining the turf war', 'Tidewater Plaza, 1:09 on the clock']];
const POSTER = 'ink/play/poster.jpg';        // the clip's first frame
const CLIP = 'ink/play/inkwave-turf-8s.mp4'; // 7.5s, source 59.0-66.5s of the post, cropped 4:5, no audio
const CLIP_END = 7.4;   // the clip is 7.5s long: stop just short of the end so a seek never lands past the last frame
const SEED_TOL = 0.04;  // a frozen or out-of-window frame only moves currentTime when it is off by more than this
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.2, r + 0.75];
    T.chipDone = [r + 0.6, r + 1.15];
    T.v0 = r + 1.2;           // the window grows in and the clip starts here
    T.end = T.v0 + CLIP_END;  // the clip is on screen for its full length
    return T;
  },
  build(k, x) {
    const T = k.T;
    const text = (k.opts && k.opts.say) || SAY;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">Inkwave</b></div>
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
        const n = streamCount(text, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = text.slice(0, n); hid.textContent = text.slice(n); shown = n; }

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
        const want = clamp(t - T.v0, 0, CLIP_END);
        const live = t >= T.v0 && t <= T.end && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const p = vid.play();
            if (p && p.catch) p.catch((e) => console.error('play.js: video.play() rejected', e));
          }
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          if (!vid.paused) vid.pause();
          // a seek issued before the clip has metadata is dropped and currentTime keeps reading 0, so the park only
          // gets issued once readyState >= 1 (HAVE_METADATA); verified headless, ?t= inside the window lands the video
          // exactly on want (t=41.38 -> currentTime 4.003, t=43.88 -> 6.503) on a server that serves byte ranges
          if (vid.readyState >= 1 && Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
        }
      },
    };
  },
};