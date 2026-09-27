// Art beat: Gemini paints the music video's storyboard in riso print. Its line streams, a storyboard sheet rises (3x2,
// or 2x3 on the portrait stage; see art.css), and each frame resolves out of a blur under its own sweeping band,
// staggered 0.14s apart, each stamping its file name and pixel size as it comes into focus. The "Creating 6 images" chip fades away as the last one resolves.
// The frames are real stills cut from the Upping My P(doom) music video the finale plays. They are 16:9 and carry
// burned-in text (the P(DOOM) 8.0% meter, the KILLSWITCH card, the 999,999,999,972 paperclip counter, the lyric
// captions), so each fills a 16:9 frame whole, uncropped, with its file label on a strip beneath it rather than
// over it.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted the storyboard in riso print: two inks, paper grain.';
// [file, name, w, h]: the six storyboard frames, in shot order (the order Gemini paints them), each a 16:9 still
// that fills its frame
const SHOTS = [
  ['pdoom/shot-shoggoth.jpg', 'shot-03-shoggoth.png', 1344, 768],
  ['pdoom/shot-pdoom.jpg', 'shot-06-pdoom.png', 1344, 768],
  ['pdoom/shot-chinese-room.jpg', 'shot-07-chinese-room.png', 1344, 768],
  ['pdoom/shot-paperclips.jpg', 'shot-14-paperclips.png', 1344, 768],
  ['pdoom/shot-killswitch.jpg', 'shot-15-killswitch.png', 1344, 768],
  ['pdoom/shot-fuse.jpg', 'shot-16-fuse.png', 1344, 768],
];
const PAINT = 0.8;    // seconds one frame takes to resolve out of the blur
const STAGGER = 0.14; // gap between one frame starting and the next
const TAIL = 0.3;     // seconds from the last frame landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                            // "Creating 6 images" chip lands
    T.grid = r + 0.34;                                             // the grid itself rises in
    T.tile = SHOTS.map((_, i) => T.grid + i * STAGGER);            // each frame starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                        // ...and is fully sharp here
    T.end = T.paint[SHOTS.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${SHOTS.length} images</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${SHOTS.map(([src, name, w, h]) => `<div class="art-tile">
      <div class="art-frame">
        <img class="art-shot art-still" src="${x.img(src)}" alt="${x.esc(name)}"/>
        <i class="art-band" aria-hidden="true"></i>
        <span class="art-tag">art</span>
      </div>
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

        // the "Creating 6 images" chip: lands with the ask, then fades out as the last frame finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[SHOTS.length - 1] - 0.08, T.paint[SHOTS.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the grid rises in as one sheet
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
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
