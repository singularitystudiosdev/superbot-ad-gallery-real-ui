// Art beat, LOCATIONS: Gemini grades six location plates of THE LAST INVENTION. Its line streams, a location sheet
// rises in (two plates a row, in film order), and each plate lands ungraded (the same frame flattened to a log look),
// then a brass hairline wipes the grade across it left to right while the frame takes a slow push-in, the film's own
// camera move. Every plate is labelled as a grade sheet would label it, on a slug under the picture: plate number,
// the film's SMPTE timecode at 24 fps, and the light with a swatch of its key colour. Those labels are the sheet's,
// not the film's, so they never sit inside a frame. The one caption inside a frame is the film's own: the data-centre
// plate carries "A DATA CENTRE, SOMEWHERE COLD." verbatim, period included (on screen 175.3-177.5s, so on the plate's
// frame at 177.0s), bottom-left in the film's letterspaced caps. The "Creating 6 plates" chip settles to "Created 6
// plates" under the thread's gold tick as the last plate finishes grading, like every other beat's tool chip.
// The plates are real frames, not drawings: img/li/plate-*.jpg are 960x540 lanczos scales of the clip at the times in
// img/li/assets.json (crops in img/CREDITS.txt). Each timecode below is that frame's index at 24 fps, checked against
// the clip: every plate peaks in PSNR at exactly its frame (41.6 to 44.6 dB) and falls off one frame either side.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Grading six plates: pub, Oxford, library, data centre, London, the Thames.';
// The film's caption over the data-centre aisle, as it reads on screen.
const PLACE = 'A DATA CENTRE, SOMEWHERE COLD.';
// The six plates in film order. f: the source frame (24 fps) the plate is scaled from; light: the sheet's name for the
// plate's key light (its swatch colour is set per id in art.css, from theme.css tokens measured on these same frames).
const PLATES = [
  { id: 'pub', src: 'li/plate-pub.jpg', f: 1728, light: 'TUNGSTEN',
    alt: 'The presenter at a pub table with a pint, green tiles and brass lamps behind her' },
  { id: 'oxford', src: 'li/plate-oxford.jpg', f: 2528, light: 'DUSK',
    alt: 'An Oxford college tower and chapel at dusk, the windows lit' },
  { id: 'library', src: 'li/plate-library.jpg', f: 2592, light: 'GREEN LAMP',
    alt: "A long library under green bankers' lamps, the presenter walking along the shelves" },
  { id: 'dc', src: 'li/plate-datacentre.jpg', f: 4248, light: 'COLD BLUE', place: PLACE,
    alt: 'An empty data centre aisle, racks of blue lights receding into the dark' },
  { id: 'dawn', src: 'li/plate-london-dawn.jpg', f: 6828, light: 'DAWN',
    alt: 'London at dawn, the Shard and Tower Bridge over the river' },
  { id: 'night', src: 'li/plate-embankment-night.jpg', f: 7344, light: 'TEAL NIGHT',
    alt: 'The Thames embankment at night, globe lamps, a bridge and one figure walking' },
];
const FPS = 24;
const PAINT = 0.8;    // seconds from a plate landing to its grade finishing
const STAGGER = 0.12; // gap between one plate landing and the next (six plates in the four-plate beat's 2.04s)
const TAIL = 0.3;     // seconds from the last plate graded to the beat's end
const two = (n) => String(n).padStart(2, '0');
// SMPTE timecode HH:MM:SS:FF of a 24 fps frame index
const tc = (f) => { const s = Math.floor(f / FPS); return `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}:${two(f % FPS)}`; };
const smooth = (p) => p * p * (3 - 2 * p);

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                           // "Creating 6 plates" chip lands
    T.grid = r + 0.34;                                            // the sheet itself rises in
    T.tile = PLATES.map((_, i) => T.grid + i * STAGGER);          // each plate lands, ungraded
    T.paint = T.tile.map((a) => a + PAINT);                       // ...and is fully graded here
    T.end = T.paint[PLATES.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="spin done" style="display:none"></span><span class="ch-tool-t">Creating ${PLATES.length} plates</span></span></div>`);
    const sheet = x.el(`<div class="art-sheet">
      <div class="art-head"><span>LOCATION PLATES</span><span>THE LAST INVENTION</span></div>
      <div class="art-grid">${PLATES.map((p, i) => `<figure class="art-plate art-p-${p.id}">
        <div class="art-frame">
          <div class="art-pic">
            <img class="art-flat" src="${x.img(p.src)}" alt="" aria-hidden="true" width="960" height="540"/>
            <img class="art-shot" src="${x.img(p.src)}" alt="${x.esc(p.alt)}" width="960" height="540"/>
            <i class="art-wipe" aria-hidden="true"></i>
          </div>${p.place ? `
          <span class="art-place">${x.esc(p.place)}</span>` : ''}
        </div>
        <figcaption class="art-slug"><span class="art-log"><b>${two(i + 1)}</b><span class="art-tc">${tc(p.f)}</span></span><span class="art-light"><i class="art-key"></i>${x.esc(p.light)}</span></figcaption>
      </figure>`).join('')}</div>
    </div>`);
    const tiles = [...sheet.querySelectorAll('.art-plate')].map((n) => ({
      frame: n.querySelector('.art-frame'), pic: n.querySelector('.art-pic'), shot: n.querySelector('.art-shot'),
      wipe: n.querySelector('.art-wipe'), place: n.querySelector('.art-place'),
      log: n.querySelector('.art-log'), light: n.querySelector('.art-light'),
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const genTile = gen.querySelector('.qc-tile'), genOk = gen.querySelector('.spin'), genLab = gen.querySelector('.ch-tool-t');
    const last = PLATES.length - 1;
    let shown = -1, genDone = null;

    return {
      nodes: [say, gen, sheet],
      marks: [[T.r, say], [T.label, gen], [T.grid, sheet]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 6 plates" chip: lands with the ask, then settles to done (gold tick) as the last grade lands
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const done = t >= T.paint[last];
        if (done !== genDone) {
          genTile.style.display = done ? 'none' : '';
          genOk.style.display = done ? '' : 'none';
          genLab.textContent = `${done ? 'Created' : 'Creating'} ${PLATES.length} plates`;
          genDone = done;
        }
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the sheet rises in as one piece
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        sheet.style.opacity = gi.toFixed(3);
        sheet.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each plate: lands flat and ungraded with its number and timecode logged, takes a slow push-in, has the
        // grade wiped across it behind a brass hairline, then its light is named (and the film's caption fades up on
        // the data-centre plate, as it does in the film)
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const fi = outCubic(seg(t, a, a + 0.2));
          tile.frame.style.opacity = fi.toFixed(3);
          const push = outCubic(seg(t, a, T.end));             // every push-in comes to rest as the beat ends
          tile.pic.style.transform = push <= 0 ? 'none' : `scale(${lerp(1, 1.045, push).toFixed(4)})`;
          const w = smooth(seg(t, a + 0.16, b - 0.04));
          tile.shot.style.clipPath = w >= 1 ? 'none' : `inset(0 ${((1 - w) * 100).toFixed(2)}% 0 0)`;
          tile.wipe.style.left = `${(w * 100).toFixed(2)}%`;
          tile.wipe.style.opacity = (w <= 0 || w >= 1 ? 0 : Math.min(seg(w, 0, 0.06), 1 - seg(w, 0.9, 1))).toFixed(3);
          const lo = outCubic(seg(t, a + 0.06, a + 0.3));
          tile.log.style.opacity = lo.toFixed(3);
          tile.log.style.transform = lo >= 1 ? 'none' : `translateY(${((1 - lo) * 3).toFixed(2)}px)`;
          const lg = outCubic(seg(t, b - 0.1, b + 0.16));
          tile.light.style.opacity = lg.toFixed(3);
          tile.light.style.transform = lg >= 1 ? 'none' : `translateY(${((1 - lg) * 3).toFixed(2)}px)`;
          if (tile.place) tile.place.style.opacity = seg(t, b - 0.04, b + 0.36).toFixed(3);
        });
      },
    };
  },
};
