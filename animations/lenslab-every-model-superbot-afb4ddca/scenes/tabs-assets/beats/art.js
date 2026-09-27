// Art beat: Gemini paints the Lens Lab's focus plates and lens materials. Its line streams, a 3x2 export grid rises,
// and each image racks from defocus to sharp under its own sweeping band, staggered 0.14s apart. The three focus
// plates are the one valley painted at three focus depths: each rack-focuses while its focus-distance tag counts to
// its plane (37, 54, 86 cm, the Foreground / Middle / Background distances the Lens Lab UI reads out in the post
// clip) and turns green on lock, with an autofocus bracket that tightens and clears. The three material swatches
// (the knurled brass focus ring, the ground-glass screen, the coated elements) resolve the same way. Each stamps its
// file name and real pixel size as it comes into focus. The "Creating 6 images" chip fades as the last one lands.
// The imagery is the post clip's own crops, img/ll/art-1..6.jpg (see img/CREDITS.txt), 512x512 photographic frames.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

// one line in the reply column (a second line would grow the beat past the source's height)
const SAY = 'Painted the valley at three focus depths, plus ring, glass and coating materials.';
// [file, name, w, h, focus]: the six images in the order Gemini paints them. focus = [from cm, to cm] for a focus
// plate (its tag racks from the previous plane to its own), null for a material swatch.
const SHOTS = [
  ['ll/art-1.jpg', 'plate-near.jpg', 512, 512, [86, 37]],
  ['ll/art-2.jpg', 'plate-mid.jpg', 512, 512, [37, 54]],
  ['ll/art-3.jpg', 'plate-far.jpg', 512, 512, [54, 86]],
  ['ll/art-4.jpg', 'brass-knurl.jpg', 512, 512, null],
  ['ll/art-5.jpg', 'ground-glass.jpg', 512, 512, null],
  ['ll/art-6.jpg', 'coating.jpg', 512, 512, null],
];
const PAINT = 0.8;    // seconds one image takes to rack from defocus to sharp
const STAGGER = 0.14; // gap between one image starting and the next
const TAIL = 0.3;     // seconds from the last image landing to the beat's end
const focusTag = (cm) => `focus ${Math.round(cm)} cm`;

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
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name, w, h, focus]) => `<div class="art-tile${focus ? ' art-plate' : ''}">
      <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)}${focus ? `, focus plate at ${focus[1]} cm` : ', material swatch'}"/>
      <i class="art-band" aria-hidden="true"></i>
      ${focus ? '<i class="art-af" aria-hidden="true"></i>' : ''}
      <span class="art-tag${focus ? ' art-focus' : ''}">${focus ? focusTag(focus[0]) : 'material'}</span>
      <span class="art-cap"><b>${x.esc(name)}</b><small>${w}&times;${h}</small></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({
      shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap'),
      af: n.querySelector('.art-af'), tag: n.querySelector('.art-tag'),
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 6 images" chip: lands with the ask, then fades out as the last image finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[SHOTS.length - 1] - 0.08, T.paint[SHOTS.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the grid rises in as one sheet
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each image: a focus pull. Defocus blur and lens breathing settle to sharp while its band sweeps across;
        // a plate's tag racks its focus distance to its own plane and locks green, under a tightening AF bracket.
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i], focus = SHOTS[i][4];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.6, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.25, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          if (focus) {
            const lock = p >= 1;
            set(tile.tag, focusTag(lerp(focus[0], focus[1], e)));
            tile.tag.classList.toggle('lock', lock);
            const ai = outCubic(seg(t, a, a + 0.18)), ao = seg(t, b + 0.12, b + 0.42);
            tile.af.style.opacity = (ai * (1 - ao)).toFixed(3);
            tile.af.style.transform = `translate(-50%, -50%) scale(${lerp(1.35, 1, e).toFixed(4)})`;
            tile.af.classList.toggle('lock', lock);
          }
          const cp = seg(t, b - 0.06, b + 0.2);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};
