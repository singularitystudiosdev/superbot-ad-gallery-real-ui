// Art beat: Gemini paints Inkwave's decals. Its line streams, a 3x2 asset-export grid lands on a transparency
// checkerboard, and each asset resolves out of a blur under its own sweeping band, staggered 0.14s apart, each
// stamping its file name and pixel size as it comes into focus. The "Creating 6 images" chip fades away as the
// last one resolves.
// The assets are real downloaded CC0 game art (see img/CREDITS.txt): transparent ink splats centred on the
// swatch, exactly how an art pack drops out of an export. kind 'sprite' = a transparent decal centred on the
// checkerboard; 'tile' = a seamless texture repeated across the swatch (no tile in this set).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted the ink decals.';
// [file, name, w, h, kind]: the six assets, in the order Gemini paints them
const SHOTS = [
  ['ink/decal-1.png', 'splat drop 1', 224, 256, 'sprite'],
  ['ink/decal-2.png', 'splat drop 2', 256, 212, 'sprite'],
  ['ink/decal-3.png', 'splat drop 3', 247, 256, 'sprite'],
  ['ink/decal-4.png', 'splat drop 4', 256, 241, 'sprite'],
  ['ink/decal-5.png', 'splat drop 5', 242, 256, 'sprite'],
  ['ink/decal-6.png', 'splat drop 6', 256, 244, 'sprite'],
];
const PAINT = 0.8;    // seconds one asset takes to resolve out of the blur
const STAGGER = 0.14; // gap between one asset starting and the next
const TAIL = 0.3;     // seconds from the last asset landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Creating 6 images" chip lands
    T.grid = r + 0.34;                                             // the grid itself rises in
    T.tile = SHOTS.map((_, i) => T.grid + i * STAGGER);            // each asset starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = T.paint[SHOTS.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${SHOTS.length} images</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name, w, h, kind]) => `<div class="art-tile">
      ${kind === 'tile'
    ? `<i class="art-shot art-tex" style="background-image:url('${x.img(src)}')" role="img" aria-label="${x.esc(name)} ${w}x${h} seamless texture"></i>`
    : `<img class="art-shot art-sprite" src="${x.img(src)}" alt="${x.esc(name)} decal"/>`}
      <i class="art-band" aria-hidden="true"></i>
      <span class="art-tag">${kind === 'tile' ? 'tile' : 'sprite'}</span>
      <span class="art-cap"><b>${x.esc(name)}</b><small>${w}&times;${h}</small></span>
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

        // the "Creating 6 images" chip: lands with the ask, then fades out as the last asset finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[SHOTS.length - 1] - 0.08, T.paint[SHOTS.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the grid rises in as one sheet
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each asset: blur and desaturate resolve to sharp while its own band sweeps across the swatch
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