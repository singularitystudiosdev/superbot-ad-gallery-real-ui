// Art beat: Nano Banana Pro paints the art Gemini's roster left empty. Its line streams, the "Creating 10 images"
// chip lands, and an image grid rises: the eight racer portraits (4x2, the roster's order), then the TURBO KART
// RALLY logo and the trackside GO! board on a wide row. Each image comes up out of grain and blur under its own
// sweeping band, one after another, and stamps its file name and size as it goes sharp.
// Every image is a crop of the real clip (img/tkr/CREDITS.txt: the select-grid portraits, the title-screen logo and
// the trackside banner); only the grain is generated, and it is a noise texture, not a picture of anything.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painting the 8 racer portraits, then the logo and the trackside board.';
// [file under img/, caption, pixel size, kind]: in the order Nano Banana Pro paints them
const RACERS = ['Blaze', 'Zippy', 'Bella', 'Toadly', 'Rex', 'Grumbo', 'Koopz', 'Dotty'];
const SHOTS = [
  ...RACERS.map((n) => [`tkr/roster/${n.toLowerCase()}.png`, `${n.toLowerCase()}.png`, '88×88', 'face']),
  ['tkr/logo.png', 'logo.png', '885×430', 'wide'],
  ['tkr/board.png', 'board.png', '312×50', 'wide'],
];
const PAINT = 0.55;   // seconds one image takes to come out of the grain
const STAGGER = 0.12; // one image starting to the next
const TAIL = 0.25;    // last image sharp to the beat's end
// a static grain tile (SVG fractal noise), laid over each image while it resolves
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.35"/></filter><rect width="120" height="120" filter="url(#n)"/></svg>')}")`;

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.26;                                   // "Creating 10 images" chip lands
    T.grid = r + 0.34;                                    // the grid rises in
    T.tile = SHOTS.map((_, i) => T.grid + 0.12 + i * STAGGER);
    T.paint = T.tile.map((a) => a + PAINT);               // ...and is sharp here
    T.end = T.paint[SHOTS.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('nanobanana')}<span class="ch-tool-t">Creating ${SHOTS.length} images</span><b class="art-n">0/${SHOTS.length}</b></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name, px, kind]) => `<div class="art-tile art-${kind}">
      <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)}"/>
      <i class="art-grain" aria-hidden="true"></i>
      <i class="art-band" aria-hidden="true"></i>
      <span class="art-cap"><b>${x.esc(name)}</b><small>${px}</small></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({
      n, shot: n.querySelector('.art-shot'), grain: n.querySelector('.art-grain'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap'),
    }));
    tiles.forEach((tile) => { tile.grain.style.backgroundImage = GRAIN; }); // set from JS: the data URI carries quotes
    const count = gen.querySelector('.art-n'), glab = gen.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid], [T.tile[8], tiles[8].n]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip lands, counts the images as they go sharp, and reads "Created" once the last one is in
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        const made = T.paint.filter((b) => t >= b).length;
        const cs = `${made}/${SHOTS.length}`;
        if (count.textContent !== cs) count.textContent = cs;
        const gl = made === SHOTS.length ? `Created ${SHOTS.length} images` : `Creating ${SHOTS.length} images`;
        if (glab.textContent !== gl) glab.textContent = gl;
        gen.firstElementChild.classList.toggle('art-done', made === SHOTS.length);

        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each image: grain + blur + desaturation resolve to sharp while its band sweeps across
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 9).toFixed(2)}px) saturate(${lerp(0.15, 1, e).toFixed(3)}) contrast(${lerp(0.7, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = t < a ? '0' : lerp(0.35, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.06, 1, e).toFixed(4)})`;
          // the grain is up before the image starts, and thins out as it resolves (its offset jitters each frame)
          const pre = seg(t, T.grid, T.grid + 0.3);
          tile.grain.style.opacity = (pre * (1 - seg(p, 0.35, 1))).toFixed(3);
          tile.grain.style.backgroundPosition = `${Math.floor(t * 24 * 37) % 120}px ${Math.floor(t * 24 * 53) % 120}px`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p <= 0 || p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.06, b + 0.2);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};
