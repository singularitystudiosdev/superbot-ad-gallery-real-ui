// Play beat, the finale's first half: Claude Opus 5.5 streams the done line, its two tool chips land and resolve
// (building, then launching), and the Turbo Kart Rally window grows in playing the game's title screen
// (img/kart/clip-window.mp4: 4s of @bridgemindai's capture, 960x494, 30fps, no audio). The window keeps the clip's
// own aspect (~1.94:1). It holds for ~2.5s, then the chat scene ends and scenes/clip.js picks this very window up
// (it measures .play-win on the tabs scene's last frame) and grows it to full frame on the clip montage.
// The clip is a real <video>, so its clock follows t: want = clamp(t - T.v0, 0, CLIP_END).
// A frozen frame (?t= adds body.freeze) or any t outside the play window pauses it and seeks to want; inside the
// window it plays and only re-seeks once it has drifted past a quarter second. No Date and no rAF state: every moving
// value in this module is written from t, so a frozen frame always renders the same pixels.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Built it. Turbo Kart Rally is live, press start.';
const CHIPS = [['Building Turbo Kart Rally', 'Built in 41s'], ['Launching game', 'Running']];
// the build chip resolves to the race clock the HUD froze on at this very moment (chat.js hands it in as x.race:
// the clock starts on the first send and stops at T.chipDone[0]), so the chat and the HUD read the same time
const POSTER = 'kart/poster.jpg';       // the clip's first frame
const CLIP = 'kart/clip-window.mp4';
const CLIP_END = 3.96;  // the clip is 4.0s (120 frames): stop on the last frame so a seek never lands past it
const SEED_TOL = 0.012; // a frozen or out-of-window frame only moves currentTime when it is off by more than this
                        // (under one 30fps frame, 0.0333s, so a renderer stepping 1/30 re-seeks every frame)
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this
const HOLD = 2.5;       // the window is on screen this long before the beat ends
// the chat scene runs 0.6s past T.end (chat.js CHAT_END +0.2, tabs.js dur +0.4): the clip keeps playing through that
// tail and parks just before the scene's last frame, so the frame clip.js hands off from is a still, seekable frame
const LIVE_TAIL = 0.5;

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;           // the window grows in and the clip starts here
    T.end = T.v0 + HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const labels = CHIPS.map((c) => c.slice());
    if (x.race) labels[0][1] = `Built in ${x.race.clock(T.chipDone[0] - x.race.t0)}`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">Turbo Kart Rally</b></div>
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
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? labels[i][1] : labels[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the window grows in, then the camera keeps pushing in on it for as long as it holds
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        const push = lerp(1, 1.03, seg(t, T.v0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;

        // the clip follows t: it plays inside the window, and every other time it is parked on the frame t asks for
        const want = clamp(t - T.v0, 0, CLIP_END);
        const live = t >= T.v0 && t < T.end + LIVE_TAIL && !document.body.classList.contains('freeze');
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
