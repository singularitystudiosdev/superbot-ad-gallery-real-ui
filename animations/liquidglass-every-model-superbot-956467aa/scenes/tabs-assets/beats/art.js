// Art beat: Gemini paints the six scene keyframes of the Liquid Glass reel. Its line streams, a 3x2 grid of rounded
// glass cards rises, and each keyframe develops out of a frosted blur (a "refraction develop") while a lens highlight
// sweeps across it, staggered 0.14s apart, each stamping its storyboard frame name, its pixel size and its 0N / 08
// corner index as it comes into focus. The "Rendering 6 keyframes" chip fades away as the last one resolves.
// The stills are the reel's own scenes (img/lg, the Liquid Glass spot the finale plays), each a square 1440x1440 frame
// that fills its card.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted the reel: six glass keyframes, morph through merge.';
// [file, storyboard name, w, h, scene index]: the six keyframes, in storyboard order
const SHOTS = [
  ['lg/art-player.jpg', '01-morph.png', 1440, 1440, '01'],
  ['lg/art-fluid.jpg', '02-refract.png', 1440, 1440, '02'],
  ['lg/art-control.jpg', '03-control.png', 1440, 1440, '03'],
  ['lg/art-activity.jpg', '05-measure.png', 1440, 1440, '05'],
  ['lg/art-spotlight.jpg', '06-search.png', 1440, 1440, '06'],
  ['lg/art-notify.jpg', '07-merge.png', 1440, 1440, '07'],
];
const SCENES = 8;     // the reel has 8 scenes, so a keyframe's corner index reads 0N / 08
const PAINT = 0.8;    // seconds one keyframe takes to develop out of the frost
const STAGGER = 0.14; // gap between one keyframe starting and the next
const TAIL = 0.3;     // seconds from the last keyframe landing to the beat's end
const pad2 = (n) => String(n).padStart(2, '0');

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Rendering 6 keyframes" chip lands
    T.grid = r + 0.34;                                             // the grid itself rises in
    T.tile = SHOTS.map((_, i) => T.grid + i * STAGGER);            // each keyframe starts developing
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = T.paint[SHOTS.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say art-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Rendering ${SHOTS.length} keyframes</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name, w, h, idx]) => `<div class="art-tile">
      <img class="art-shot art-still" src="${x.img(src)}" alt="${x.esc(name)}"/>
      <i class="art-frost" aria-hidden="true"></i>
      <i class="art-lens" aria-hidden="true"></i>
      <span class="art-glare" aria-hidden="true"></span>
      <span class="art-idx">${x.esc(idx)} <em>/ ${pad2(SCENES)}</em></span>
      <span class="art-cap"><b>${x.esc(name)}</b><small>${w}&times;${h}</small></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({ shot: n.querySelector('.art-shot'), frost: n.querySelector('.art-frost'), lens: n.querySelector('.art-lens'), cap: n.querySelector('.art-cap') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Rendering 6 keyframes" chip: lands with the ask, then fades out as the last keyframe finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[SHOTS.length - 1] - 0.08, T.paint[SHOTS.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the grid rises in as one sheet of glass
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each keyframe: it refracts out of frost (a white frosted sheet clearing over a blurred, over-saturated
        // still) while a specular lens band sweeps across the card
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 13).toFixed(2)}px) saturate(${lerp(1.7, 1, e).toFixed(3)}) brightness(${lerp(1.12, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.3, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.06, 1, e).toFixed(4)})`;
          tile.frost.style.opacity = ((1 - e) * 0.72).toFixed(3);
          tile.lens.style.transform = `translateX(${lerp(-118, 118, p).toFixed(1)}%)`;
          tile.lens.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.78, 1)).toFixed(3);
          const cp = seg(t, b - 0.06, b + 0.2);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};