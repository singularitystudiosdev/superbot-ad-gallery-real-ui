// Art beat, the sixth request of the Inkwave build: superbot routes Script section 5 to Nano Banana, which paints the
// plaza's flat art as a sheet of eight tiles, four a row. Each tile resolves out of a coarse mosaic of its own pixels
// into the sharp image under a sweeping band, staggered 0.13s apart, and stamps what the crop shows and its own pixel
// size as it comes into focus; the "Painting 8 tiles" chip fades away as the last one lands. The sheet is two rows
// on purpose: the whole board then fits the chat column, so the asset step is on screen complete rather than half
// scrolled away.
//
// IMAGERY / SOURCING. Every tile is a real crop of a single frame of the post's own gameplay video: the street poster
// wall (t=14s), the KRAKEN billboard (30.5s), the lime and magenta splat decals (16s / 12s), the two team icon rows
// and the ink tank / READY! meter (14s) and the DOUBLE SPLAT! banner (31s). The crops are cut offline by
// .tmp/art-f1a86d6f/crop.sh from the post's own 1920x1080 rendition with ffmpeg + ImageMagick, which also writes the
// placeholder each tile resolves out of: a real 24px-wide downscale of that same crop (img/ink/art/noiz/), blown back
// up by the tile with image-rendering:pixelated. The boxes, timestamps and the reason for the 1080p source are in
// img/ink/art/CREDITS.txt. Nothing here is drawn, recoloured, upscaled or generated: the blur, the mosaic and the
// grain are CSS/DOM effects over the real file, which is why the beat can show an image "being generated" without
// inventing a single pixel of one.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted the plaza posters, the ink decals and the HUD.';
// [file, tag, label, w, h, fit]: the eight tiles, in the order Nano Banana paints them. fit 'fill' = the crop covers
// the whole tile (a scene crop: wall, board, ink on the ground); 'asset' = the crop is smaller than the tile or not
// 1:1, so it is shown whole on the tile's dark canvas, the way an asset sheet shows a cut-out piece.
const TILES = [
  ['ink/art/poster-wall.webp', 'poster', 'LOW TIDE RIOT posters', 517, 336, 'fill'],
  ['ink/art/billboard-kraken.webp', 'billboard', 'KRAKEN billboard', 330, 250, 'fill'],
  ['ink/art/decal-atlas-lime.webp', 'decal', 'splat decal, lime', 300, 225, 'fill'],
  ['ink/art/decal-atlas-magenta.webp', 'decal', 'splat decal, magenta', 380, 285, 'fill'],
  ['ink/art/hud-double-splat.webp', 'hud', 'DOUBLE SPLAT banner', 585, 120, 'asset'],
  ['ink/art/hud-team-lime.webp', 'hud', 'team icons, lime', 277, 105, 'asset'],
  ['ink/art/hud-team-magenta.webp', 'hud', 'team icons, magenta', 285, 112, 'asset'],
  ['ink/art/hud-special-ready.webp', 'hud', 'ink tank, READY meter', 195, 262, 'asset'],
];
const PAINT = 0.75;    // seconds one tile takes to resolve out of its mosaic
const STAGGER = 0.13;  // gap between one tile starting and the next
const TAIL = 0.55;     // seconds from the last tile landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.24;                                         // "Painting 8 tiles" chip lands
    T.grid = r + 0.3;                                           // the sheet itself rises in
    T.tile = TILES.map((_, i) => T.grid + i * STAGGER);          // each tile starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                      // ...and is fully sharp here
    T.end = T.paint[TILES.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow qb-art-genrow"><span class="ch-tool qb-art-gen">${x.tile('gemini')}<span class="ch-tool-t">Painting ${TILES.length} tiles</span></span></div>`);
    const grid = x.el(`<div class="qb-art-grid">${TILES.map(([src, tag, label, w, h, fit]) => `<div class="qb-art-cell">
      <div class="qb-art-tile">
        <i class="qb-art-noiz" style="background-image:url('${x.img(src.replace(/([^/]+)$/, 'noiz/$1'))}')" aria-hidden="true"></i>
        <img class="qb-art-shot${fit === 'asset' ? ' qb-art-cut' : ''}" src="${x.img(src)}" alt="${x.esc(label)}, ${w} by ${h} pixel crop of the post"/>
        <i class="qb-art-band" aria-hidden="true"></i>
        <i class="qb-art-grain" aria-hidden="true"></i>
        <span class="qb-art-tag">${x.esc(tag)}</span>
      </div>
      <span class="qb-art-cap"><b>${x.esc(label)}</b><small>${w}x${h} px</small></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({
      cell: n, noiz: n.querySelector('.qb-art-noiz'), shot: n.querySelector('.qb-art-shot'),
      band: n.querySelector('.qb-art-band'), grain: n.querySelector('.qb-art-grain'), cap: n.querySelector('.qb-art-cap'),
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Painting 8 tiles" chip: lands with the reply, then fades out as the last tile finishes
        const li = outCubic(seg(t, T.label, T.label + 0.26));
        const out = seg(t, T.paint[TILES.length - 1] - 0.06, T.paint[TILES.length - 1] + 0.26);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        // the chip's own row collapses as it fades: its 28px box and its 8px bottom margin go to 0 with out, and
        // overflow keeps the chip (and the 7px margin it carries) from spilling over the sheet, so once the chip is
        // gone the reply line sits right on the tile sheet with no dead gap. Pure function of t (meshy.js collapses
        // its preview grid the same way, from the same t it renders).
        gen.style.height = `${Math.max(0, 28 * (1 - out)).toFixed(1)}px`;
        gen.style.overflow = 'hidden';
        gen.style.marginBottom = `${(8 * (1 - out)).toFixed(1)}px`;

        // the sheet rises in as one board
        const gi = outCubic(seg(t, T.grid, T.grid + 0.4));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each tile: the coarse mosaic of the same file fades out while the file itself resolves out of blur and
        // desaturation under its own sweeping band, then its caption is stamped on
        tiles.forEach((tl, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          rise(tl.cell, seg(t, a - 0.1, a + 0.24), 6);
          tl.noiz.style.opacity = (1 - e).toFixed(3);
          tl.noiz.style.transform = `scale(${lerp(1.06, 1, e).toFixed(4)})`;   // the mosaic is the tile's own 24px self
          tl.shot.style.opacity = lerp(0.25, 1, e).toFixed(3);
          tl.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 11).toFixed(2)}px) saturate(${lerp(0.4, 1, e).toFixed(3)}) contrast(${lerp(1.25, 1, e).toFixed(3)})`;
          tl.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.07, 1, e).toFixed(4)})`;
          tl.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tl.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          tl.grain.style.opacity = ((1 - e) * 0.5).toFixed(3);
          const cp = seg(t, b - 0.04, b + 0.2);
          tl.cap.style.opacity = outCubic(cp).toFixed(3);
          tl.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};