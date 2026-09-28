// Art beat: Gemini paints three concept stills for the ride. Its line streams, the "Creating 3 images" chip lands, a
// sheet of three 16:9 frames rises, and each frame resolves out of a blur under its own sweeping band, staggered,
// stamping its file name as it comes into focus. The chip reads "Created 3 images" once the last one resolves.
// The stills are img/bike/concept-1..3.jpg (see img/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Golden hour on a country road. Rice paddies, power lines, one red bike.';
// [file, name]: the three concept stills, in the order Gemini paints them
const SHOTS = [
  ['bike/concept-1.jpg', 'concept-1.png'],
  ['bike/concept-2.jpg', 'concept-2.png'],
  ['bike/concept-3.jpg', 'concept-3.png'],
];
const CPS = 80;                       // the reply line streams at this many characters a second
const PAINT = 0.8; /* deliberate */   // one frame resolving out of the blur
const STAGGER = 0.14;                 // one frame starting to the next
const RISE = 0.3;                     // the chip and the sheet rising in
const TAIL = 0.3;                     // the last frame landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Creating 3 images" chip lands
    T.grid = r + 0.34;                                             // the sheet rises in
    T.tile = SHOTS.map((_, i) => T.grid + i * STAGGER);            // each frame starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = Math.max(T.paint[SHOTS.length - 1], r + SAY.length / CPS) + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${SHOTS.length} images</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name]) => `<div class="art-tile">
      <div class="art-frame">
        <img class="art-shot art-still" src="${x.img(src)}" alt="${x.esc(name)}"/>
        <i class="art-band" aria-hidden="true"></i>
      </div>
      <span class="art-cap"><b>${x.esc(name)}</b></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({ shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap') }));
    const genLab = gen.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 3 images" chip: lands, then reads "Created 3 images" once the last frame is sharp
        const li = outCubic(seg(t, T.label, T.label + RISE));
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = li >= 1 ? '' : `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        const gl = t >= T.paint[SHOTS.length - 1] ? `Created ${SHOTS.length} images` : `Creating ${SHOTS.length} images`;
        if (genLab.textContent !== gl) genLab.textContent = gl;

        // the sheet rises in as one
        const gi = outCubic(seg(t, T.grid, T.grid + RISE));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each frame: blur and desaturate resolve to sharp while its own band sweeps across it
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.2, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.06, b + 0.2);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};
