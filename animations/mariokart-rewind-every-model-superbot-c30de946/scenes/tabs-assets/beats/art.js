// Art beat: Gemini paints Turbo Kart Rally's full racer roster, the second link in the chain (Opus planned eight
// racers, Gemini paints them, Meshy turns the portraits into karts next). Its line streams, the "Creating 8 images"
// chip lands (counting up, then "Created 8 images"), and the roster sheet rises: the four racers the clip's select screen shows big (Blaze, Zippy, Bella,
// Toadly) as square portraits, and under them the other four (Rex, Grumbo, Koopz, Dotty) as their select-screen
// grid tiles. Each resolves out of a blur under its own sweeping band, 0.2s apart, and the portraits stamp the
// racer's name and the kart the select panel names for it as they come into focus.
// Nothing is drawn: img/kart/art-1..4.jpg are 512x512 crops of the right-panel badge on the clip's CHOOSE YOUR
// RACER screen (the only racers the clip ever hovers), and art-5..8.jpg are unscaled crops of the grid tiles of the
// four it never hovers (their grid badges are ~84px in source, too small to blow up into a portrait). Sources in
// img/CREDITS.txt and img/kart/assets.json art[].
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painting the eight racers from the plan.';
// [file, racer, kart line from the select panel, w, h]: the portrait row
const BIG = [
  ['kart/art-1.jpg', 'Blaze', 'Cap kart', 512, 512],
  ['kart/art-2.jpg', 'Zippy', 'Cap kart', 512, 512],
  ['kart/art-3.jpg', 'Bella', 'Crown kart', 512, 512],
  ['kart/art-4.jpg', 'Toadly', 'Mushroom kart', 512, 512],
];
// [file, racer, w, h]: the grid-tile row (the tile carries its own name and stat pips)
const GRID = [
  ['kart/art-5.jpg', 'Rex', 338, 204],
  ['kart/art-6.jpg', 'Grumbo', 338, 204],
  ['kart/art-7.jpg', 'Koopz', 338, 204],
  ['kart/art-8.jpg', 'Dotty', 338, 204],
];
const N = BIG.length + GRID.length;
const PAINT = 0.9;    // seconds one image takes to resolve out of the blur
const STAGGER = 0.2;  // gap between one image starting and the next
const TAIL = 0.45;    // seconds from the last image landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Creating 8 images" chip lands
    T.grid = r + 0.36;                                             // the sheet rises in
    T.tile = Array.from({ length: N }, (_, i) => T.grid + 0.06 + i * STAGGER); // each image starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = T.paint[N - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${N} images</span></span></div>`);
    const grid = x.el(`<div class="art-sheet">
      <div class="art-grid">${BIG.map(([src, name, kart, w, h]) => `<div class="art-tile">
        <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)} racer portrait"/>
        <i class="art-band" aria-hidden="true"></i>
        <span class="art-tag">${w}&times;${h}</span>
        <span class="art-cap"><b>${x.esc(name)}</b><small>${x.esc(kart)}</small></span>
      </div>`).join('')}</div>
      <div class="art-grid art-row2">${GRID.map(([src, name, w, h]) => `<div class="art-tile art-gt">
        <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)} racer tile"/>
        <i class="art-band" aria-hidden="true"></i>
        <span class="art-tag">${w}&times;${h}</span>
      </div>`).join('')}</div>
    </div>`);
    const tiles = [...grid.querySelectorAll('.art-tile')].map((n) => ({ shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap'), tag: n.querySelector('.art-tag') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const glab = gen.querySelector('.ch-tool-t');
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 8 images" chip: lands with the ask, counts the finished images, and settles on
        // "Created 8 images" once the last one is sharp
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        const made = T.paint.filter((b) => t >= b).length;
        const gl = made >= N ? `Created ${N} images` : made > 0 ? `Creating ${N} images · ${made}/${N}` : `Creating ${N} images`;
        if (glab.textContent !== gl) glab.textContent = gl;

        // the sheet rises in as one piece
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each image: blur and desaturate resolve to sharp while its own band sweeps across the tile
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.15, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p <= 0 || p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.06, b + 0.2);
          tile.tag.style.opacity = outCubic(cp).toFixed(3);
          if (tile.cap) {
            tile.cap.style.opacity = outCubic(cp).toFixed(3);
            tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
          }
        });
      },
    };
  },
};
