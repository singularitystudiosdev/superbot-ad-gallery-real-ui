// Art beat: the image model storyboards the film's four scenes. Its line streams, the 2x2 grid of 16:9 frames
// lands, and each frame resolves out of a blur under its own sweeping band, staggered 0.18s apart, each stamping its
// scene caption as it comes into focus. The "Creating 4 frames" chip fades away as the last one resolves.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Storyboarded the four scenes.';
// [source, scene caption]: the four storyboard frames, in the order they are painted
const SHOTS = [
  ['future/still-42.jpg', 'Sc 1 · 2026'],
  ['future/still-82.jpg', 'Sc 2 · The crowd'],
  ['future/still-112.jpg', 'Sc 3 · 2036'],
  ['future/still-172.jpg', 'Sc 4 · 2046'],
];
const PAINT = 1.0;   // seconds one portrait takes to resolve out of the blur
const STAGGER = 0.18; // gap between one portrait starting and the next

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Creating 4 images" chip lands
    T.grid = r + 0.34;                                             // the grid itself rises in
    T.tile = SHOTS.map((_, i) => T.grid + i * STAGGER);            // each portrait starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = r + 2.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile(k.app)}<span class="ch-tool-t">Creating 4 frames</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name]) => `<div class="art-tile">
      <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)} storyboard frame"/>
      <i class="art-band" aria-hidden="true"></i>
      <span class="art-cap">${x.esc(name)}</span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({ shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 4 images" chip: lands with the ask, then fades out as the last portrait finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[SHOTS.length - 1] - 0.08, T.paint[SHOTS.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the grid rises in as one sheet
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each portrait: blur and desaturate resolve to sharp while its own band sweeps across the tile
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.25, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.07, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.1, b + 0.24);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};