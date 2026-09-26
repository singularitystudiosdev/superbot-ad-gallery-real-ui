// Render beat: superbot cuts the boss trailer while the build finishes. Its line streams, the trailer card lands with a
// six frame filmstrip that fills left to right as those frames render (each thumbnail blurred and desaturated until its
// own 40 frames have landed), the counter runs "Rendering frame 0/240" up to 240/240 with its percent on the progress
// bar, and the card resolves into a "Rendered" pill with a drawn check.
// Pure function of t (the tabs scene's local time): no Date, no rAF, no CSS transition, every moving value is written
// from t, so ?t= freezes any frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Cut a boss trailer while it builds.';
const FILE = 'trailer.mp4';
const META = '1280x720, 8s';
const FRAMES = 240;   // 8s of trailer at 30fps
// the filmstrip: one thumbnail per 40 rendered frames, in the order the strip fills: the four painted locations, the
// capture's own first frame, and the Gatewarden again as the trailer's last shot.
const SHOTS = ['ds/art-1.jpg', 'ds/art-2.jpg', 'ds/art-3.jpg', 'ds/art-4.jpg', 'ds/poster.jpg', 'ds/art-2.jpg'];
const PER = FRAMES / SHOTS.length;   // 40 frames per thumbnail
const FILL = 1.55;   // seconds the whole strip takes to fill
const FILM = '<svg class="rnd-film" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M7 5v14M17 5v14M2.5 9.5H7M2.5 14.5H7M17 9.5h4.5M17 14.5h4.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.26;              // the trailer card rises in
    T.render0 = r + 0.62;           // frame 0 starts landing here
    T.render1 = T.render0 + FILL;   // ...and frame 240 lands here (r + 2.17)
    T.done = T.render1 + 0.14;      // the "Rendered" pill lands once the last frame is out (r + 2.31)
    T.end = T.done + 0.38;          // the pill lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const file = opts.file || FILE;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rnd-card">
      <div class="rnd-bar">${FILM}<b class="rnd-title">${x.esc(file)}</b><span class="rnd-meta">${x.esc(META)}</span></div>
      <div class="rnd-strip">${SHOTS.map((src) => `<span class="rnd-thumb"><img class="rnd-shot" src="${x.img(src)}" alt=""/></span>`).join('')}</div>
      <div class="rnd-foot">
        <div class="rnd-track"><i class="rnd-fill"></i></div>
        <div class="rnd-stat">
          <span class="rnd-count">Rendering frame 0/${FRAMES}</span>
          <span class="rnd-pct">0%</span>
          <span class="rnd-pill">${x.OK}<b>Rendered</b></span>
        </div>
      </div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const shots = [...card.querySelectorAll('.rnd-shot')];
    const fill = card.querySelector('.rnd-fill');
    const count = card.querySelector('.rnd-count');
    const pct = card.querySelector('.rnd-pct');
    const pill = card.querySelector('.rnd-pill');
    let shown = -1, lastFrames = -1, lastPct = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the card rises in, then holds: this one is a file being written, so it sits still while the frames land
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // frames 0 -> 240: the counter, the percent and the bar are all the same clock
        const f = FRAMES * seg(t, T.render0, T.render1);
        fill.style.width = `${((f / FRAMES) * 100).toFixed(2)}%`;
        const done = Math.round(f);
        if (done !== lastFrames) { count.textContent = `Rendering frame ${done}/${FRAMES}`; lastFrames = done; }
        const pc = Math.round((f / FRAMES) * 100);
        if (pc !== lastPct) { pct.textContent = `${pc}%`; lastPct = pc; }

        // each thumbnail sharpens as its own 40 frames land, so the strip fills left to right
        shots.forEach((shot, i) => {
          const p = clamp((f - i * PER) / PER);
          const e = outCubic(p);
          shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 9).toFixed(2)}px) saturate(${lerp(0.15, 1, e).toFixed(3)})`;
          shot.style.opacity = lerp(0.3, 1, e).toFixed(3);
        });

        // done: the Rendered pill with its check, and the counter settles to its final "240/240"
        const dp = seg(t, T.done, T.done + 0.3);
        pill.style.opacity = outCubic(dp).toFixed(3);
        pill.style.transform = dp >= 1 ? '' : `translateY(${((1 - outCubic(dp)) * 4).toFixed(2)}px) scale(${lerp(0.88, 1, outBack(dp)).toFixed(4)})`;
      },
    };
  },
};