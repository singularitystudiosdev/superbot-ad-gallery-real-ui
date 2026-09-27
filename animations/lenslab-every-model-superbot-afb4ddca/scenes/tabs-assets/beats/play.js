// Play beat, the finale: superbot streams the done line, its two tool chips land and resolve (building, then
// opening), and the Lens Lab window racks into focus playing the post's clip whole: @RyanSael's Lens Lab (made with
// Opus 5.5, one shot, 1h 26m), 14.0s cut from the post video, 1280x720 at 30fps (420 frames), no audio; see
// img/CREDITS.txt. The window is 16:9 and breaks out of the reply column to the composer's full width (play.css), and
// the credit rides under it as a caption chip. Neither ever carries a transform: their edges hold still and stay on
// the composer's edges at every t, and chat.js's scroll (which measures transformed boxes) glides on stable ground.
// The clip is a real <video>, so its clock follows t: want = clamp(t - T.v0, 0, CLIP_LEN), played from its first
// frame (at T.v0) to its last (at T.end). A frozen frame (?t= adds body.freeze) or any t outside the clip pauses it
// and parks it on the MIDDLE of the frame t asks for, so a seek never lands on a frame boundary and a frozen frame
// always shows the same picture; inside the clip it plays and only re-seeks once it has drifted past a quarter
// second. No Date and no rAF state: every moving value in this module is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Built it. Turn the focus ring and the sharp plane walks through the valley.';
const CHIPS = [['Building Lens Lab', 'Built in 1h 26m'], ['Opening Lens Lab', 'Focus at 83 cm']];
const POSTER = 'll/poster.jpg';      // the clip's first frame
const CLIP = 'll/lenslab-14s.mp4';
const CLIP_LEN = 14.0;  // the clip runs exactly 14.0s: 420 frames at 30fps
const FPS = 30, LAST_FRAME = 419;
const PARK_TOL = 0.004; // a parked clip only moves currentTime when it is off the wanted frame's middle by more than this
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this

// the window's entrance is a rack focus: it lands defocused and the focus is pulled over RACK_IN, easing off the soft
// end (inOutCubic), carrying just past focus and settling back (outBack). The lens's focus breathing (the picture a
// touch larger while soft) and the slow push-in over the clip both scale the <video> inside the window's clipped
// screen, never the window. chat.js racks the thread out over the first 0.7s of it, so the two planes cross
const RACK_IN = 1.0, RACK_BLUR = 14, RACK_BREATH = 0.035, PUSH = 1.02;

// the title bar's focus readout mirrors the FOCUS value the clip's own panel shows, in [clip seconds, cm], sampled off
// the post clip's frames every 0.1s through each focus pull (settles on 86, the ring turns it to 54, the aperture
// cutaway holds 54, the sharp-plane shot cuts in at 37 and walks it to 54 and 86, the ground glass racks back to 37).
// Linear between samples; a repeated time is the hard cut at 6.5s
const FOCUS = [[0, 83], [0.1, 83], [0.2, 84], [0.3, 85], [0.4, 85], [0.5, 86],
  [1.9, 86], [2.0, 80], [2.1, 80], [2.2, 66], [2.3, 61], [2.4, 58], [2.5, 56], [2.6, 56], [2.7, 55], [2.8, 55], [2.9, 54],
  [6.5, 54], [6.5, 37],
  [7.2, 37], [7.3, 41], [7.4, 46], [7.5, 48], [7.6, 48], [7.7, 51], [7.8, 52], [7.9, 53], [8.2, 53], [8.4, 54],
  [9.3, 54], [9.4, 59], [9.5, 66], [9.6, 66], [9.7, 74], [9.8, 78], [9.9, 82], [10.0, 83], [10.1, 83], [10.2, 84],
  [10.3, 85], [10.4, 85], [10.5, 86],
  [12.7, 86], [12.8, 59], [12.9, 47], [13.0, 43], [13.1, 43], [13.2, 40], [13.3, 39], [13.4, 38], [13.5, 37], [CLIP_LEN, 37]];
function focusAt(s) {
  let i = 0;
  while (i + 1 < FOCUS.length && FOCUS[i + 1][0] <= s) i++;
  const [a, fa] = FOCUS[i], nx = FOCUS[i + 1];
  if (!nx || nx[0] <= a) return fa;
  return Math.round(lerp(fa, nx[1], seg(s, a, nx[0])));
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;             // the window racks in and the clip starts here, on its first frame
    T.end = T.v0 + CLIP_LEN;    // the clip's last frame; chat.js's CHAT_END and the scene tail hold it after this
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win" data-v0="${T.v0.toFixed(4)}" data-end="${T.end.toFixed(4)}">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">Lens Lab</b><span class="play-focus">focus <b>83</b> cm</span></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video></div>
    </div>`);
    // the credit: whose clip this is and what made it (the post's own facts)
    const cap = x.el('<div class="play-cap" style="opacity:0"><b>@RyanSael</b><span>made with Opus 5.5</span><span>one shot, 1h 26m</span></div>');
    const vid = card.querySelector('.play-vid');
    const fnum = card.querySelector('.play-focus b');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // read-only handle for QA: the beat's times, the clip element and the last t it rendered (so a check can hold
    // the clip's currentTime against t while the ad plays on)
    const qa = { T, vid, t: NaN };
    // the ask layout's top-edge fade (tabs.css .ask-edge) dissolves the thread as it scrolls under the frame's top.
    // Where the composer-wide window settles under it (16:9: window and caption fill the view from the fold up to the
    // frame's top) it would dim the title bar, so edgeGive() says how far the SETTLED window's top overlaps it, 0 (clear
    // of it, as at 4:5 and 9:16, where it keeps dissolving the soft thread above) to 1 (overlapping half its height or
    // more). Only sizes feed it (the window-plus-caption stack, the feed's fold, the edge's box), never a scroll
    // position, so reading it before chat.js scrolls this frame is exact and the edge stays a pure function of t.
    // The 8 is chat.js renderScroll's fold gap (the last mark's bottom sits 8px above the feed's content bottom)
    let edge = null;
    const edgeGive = () => {
      const feed = card.closest('.feed');
      if (!feed) return 0;
      const fr = feed.getBoundingClientRect(), sy = fr.height / (feed.offsetHeight || fr.height) || 1;
      const cs = getComputedStyle(feed), padT = parseFloat(cs.paddingTop);
      const viewH = feed.clientHeight - padT - parseFloat(cs.paddingBottom);
      const stack = (cap.getBoundingClientRect().bottom - card.getBoundingClientRect().top) / sy;
      const top = fr.top + (padT + viewH - 8 - stack) * sy;
      const er = edge.getBoundingClientRect();
      return er.height > 0 ? clamp((er.bottom - top) / (0.5 * er.height), 0, 1) : 0;
    };

    return {
      nodes: [say, ...rows, card, cap],
      // as the window lands the fold glides straight to the caption's bottom, so window, caption and composer fill the
      // view once the rack-in settles (the say line and chips scroll up and out). The window's own mark at T.v0 is how
      // chat.js finds the sharp plane, and the caption's repeat at T.v0 + 0.7 (a no-op glide) keeps chat.js racking the
      // rest of the thread out over those 0.7s
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, card], [T.v0, cap], [T.v0 + 0.7, cap]],
      render(t) {
        qa.t = t;
        if (window.__AD && window.__AD.lensLab !== qa) window.__AD.lensLab = qa;
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

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

        // the window racks in: it fades up already soft and pulls sharp with a small hunt past focus. Its box never
        // moves; inside the clipped screen the picture breathes down to size as focus lands, then the camera keeps
        // pushing in on it for as long as the clip runs
        const p = seg(t, T.v0, T.v0 + RACK_IN);
        const pull = Math.abs(1 - outBack(inOutCubic(p)));   // 1 fully soft, 0 in focus (above 0 again on the hunt)
        const soft = 1 - outCubic(p);
        const push = lerp(1, PUSH, seg(t, T.v0, T.end));
        card.style.opacity = outCubic(seg(t, T.v0, T.v0 + 0.3)).toFixed(3);
        card.style.filter = p > 0 && pull > 0.004 ? `blur(${(RACK_BLUR * pull).toFixed(2)}px)` : 'none';
        vid.style.transform = `scale(${((1 + RACK_BREATH * soft) * push).toFixed(4)})`;
        // the credit racks in under it the same way, softer and later, in place (it is the fold's anchor, so it
        // must not travel)
        const cp = seg(t, T.v0 + 0.45, T.v0 + 0.85), ce = outCubic(cp);
        cap.style.opacity = ce.toFixed(3);
        cap.style.filter = cp > 0 && cp < 1 ? `blur(${(4 * (1 - ce)).toFixed(2)}px)` : 'none';
        // the top-edge fade gives way in step with the fold's glide to the caption (same span, same easing), by as
        // much as the settled window would sit under it; before the window lands the edge is left as tabs.css has it
        if (!edge) { const sc = card.closest('#s-tabs'); edge = sc && sc.querySelector('.ask-edge'); }
        if (edge) {
          const give = t > T.v0 ? edgeGive() * inOutCubic(seg(t, T.v0, T.v0 + 0.3)) : 0;
          edge.style.opacity = give > 0.001 ? (1 - give).toFixed(3) : '';
        }

        // the clip follows t: it plays inside [T.v0, T.end), and every other time it is parked on the middle of the
        // frame t asks for (the last frame from T.end on)
        const want = clamp(t - T.v0, 0, CLIP_LEN);
        const fi = Math.min(LAST_FRAME, Math.floor(want * FPS + 1e-4));
        const at = (fi + 0.5) / FPS;
        const f = String(focusAt(want));
        if (fnum.textContent !== f) fnum.textContent = f;
        const live = t >= T.v0 && t < T.end && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const pr = vid.play();
            if (pr && pr.catch) pr.catch((e) => console.error('play.js: video.play() rejected', e));
          }
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = at;
        } else {
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - at) > PARK_TOL) vid.currentTime = at;
        }
      },
    };
  },
};
