// Art beat, THE PAINTING: Gemini paints the day's light. Its line streams, then a sheet rises in holding nine real
// frames of the film, one per web/engine/env.js preset the film uses, in film order (which is the order of the day):
// night, predawn, map, fogDawn, sunrise, midday, afternoon, sunset, dusk. Each plate is the film's own 2.35:1 picture
// band (rows 131..948 of the 1920x1080 master) set between black letterbox bars, the way the film is framed; under it,
// a slug names the preset key as env.js writes it and the sun's az / el as env.js defines that preset. Each plate lands
// as an underpainting (the same frame, a soft desaturated wash), then the finished frame is laid over it left to right
// behind a feathered edge while the picture takes a slow push-in, and its az / el are written once it is painted.
// env.js also defines morning (az 155, el 13), but web/film.js never calls env('morning'), so no frame of the film is
// lit by it and it gets no plate. Which shot (and so which preset) each frame belongs to is read from web/film.js and
// web/script.js, never guessed; frames, times and each shot's own env call are listed in img/az/beats/art/CREDITS.txt.
// The "Painting 9 plates" chip settles to "Painted 9 plates" as the last plate finishes, like every beat's tool chip.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

// README: "a Kuwahara filter blended over the rendered frame, a canvas weave, grain and a 2.35:1 letterbox".
// env.js opens "// Times of day." and the film lights its shots with nine of its presets.
const SAY = 'Nine times of day, painted: Kuwahara filter, canvas weave, grain, 2.35:1.';
// The sheet's header: the file the presets live in, env.js's own first words, and what the slug numbers are.
const FILE = 'web/engine/env.js';
const HEAD = 'Times of day';
const UNITS = 'az · el';
// The nine plates in film order. key/az/el: the preset exactly as web/engine/env.js defines it. f: the master frame
// (24 fps) the plate is cut from; the frame's shot calls this preset (film.js line in CREDITS.txt).
const PLATES = [
  { key: 'night', az: 200, el: 30, f: 480, src: 'art-night.jpg',
    alt: 'Soldiers with torches along a dark ridge at night' },
  { key: 'predawn', az: 120, el: 1.5, f: 948, src: 'art-predawn.jpg',
    alt: 'The title card, AUSTERLITZ, 2 December 1805 · The Battle of the Three Emperors, over the hills before dawn' },
  { key: 'map', az: 290, el: 26, f: 2880, src: 'art-map.jpg',
    alt: 'The relief map, red arrows sweeping toward the Pratzen Heights' },
  { key: 'fogDawn', az: 126, el: 3.5, f: 3797, src: 'art-fogdawn.jpg',
    alt: 'A rider and an infantry column in the dawn fog' },
  { key: 'sunrise', az: 138, el: 7, f: 4560, src: 'art-sunrise.jpg',
    alt: 'Columns of infantry on a sunlit slope' },
  { key: 'midday', az: 185, el: 18, f: 4867, src: 'art-midday.jpg',
    alt: 'Smoke over the fields at midday, white lines of infantry' },
  { key: 'afternoon', az: 222, el: 7, f: 5592, src: 'art-afternoon.jpg',
    alt: 'The relief map, blue arrows and the Satschan pond' },
  { key: 'sunset', az: 232, el: 1.8, f: 5892, src: 'art-sunset.jpg',
    alt: 'Soldiers on the frozen ponds under the setting sun' },
  { key: 'dusk', az: 240, el: 0.5, f: 6096, src: 'art-dusk.jpg',
    alt: 'Guns on the ice under a red dusk sky' },
];
const PAINT = 0.65;  // seconds from a plate landing (as its underpainting) to the finished frame fully laid over it
const STAGGER = 0.1; // gap between one plate landing and the next (nine plates in the beat's 2.04 s)
const TAIL = 0.25;   // seconds from the last plate painted to the beat's end
const FEATHER = 16;  // width of the painted edge, in % of the plate
const smooth = (p) => p * p * (3 - 2 * p);

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                           // "Painting 9 plates" chip lands
    T.grid = r + 0.34;                                            // the sheet itself rises in
    T.tile = PLATES.map((_, i) => T.grid + i * STAGGER);          // each plate lands, as its underpainting
    T.paint = T.tile.map((a) => a + PAINT);                       // ...and is fully painted here
    T.end = T.paint[PLATES.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="spin done" style="display:none"></span><span class="ch-tool-t">Painting ${PLATES.length} plates</span></span></div>`);
    const sheet = x.el(`<div class="art-sheet">
      <div class="art-head"><span class="art-file">${x.esc(FILE)}<span class="art-dot">·</span>${x.esc(HEAD)}</span><span class="art-units">${x.esc(UNITS)}</span></div>
      <div class="art-grid">${PLATES.map((p) => `<figure class="art-plate" data-env="${x.esc(p.key)}" data-frame="${p.f}">
        <div class="art-frame">
          <div class="art-band">
            <div class="art-pic">
              <img class="art-wash" src="${x.img(`az/beats/art/${p.src}`)}" alt="" aria-hidden="true" width="480" height="204"/>
              <img class="art-shot" src="${x.img(`az/beats/art/${p.src}`)}" alt="${x.esc(p.alt)}" width="480" height="204"/>
            </div>
          </div>
        </div>
        <figcaption class="art-slug"><span class="art-key">${x.esc(p.key)}</span><span class="art-sun">${p.az}°<span class="art-dot">·</span>${p.el}°</span></figcaption>
      </figure>`).join('')}</div>
    </div>`);
    const tiles = [...sheet.querySelectorAll('.art-plate')].map((n) => ({
      frame: n.querySelector('.art-frame'), pic: n.querySelector('.art-pic'), shot: n.querySelector('.art-shot'),
      key: n.querySelector('.art-key'), sun: n.querySelector('.art-sun'),
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

        // the "Painting 9 plates" chip: lands with the ask, then settles to done (gold tick) as the last plate is painted
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const done = t >= T.paint[last];
        if (done !== genDone) {
          genTile.style.display = done ? 'none' : '';
          genOk.style.display = done ? '' : 'none';
          genLab.textContent = `${done ? 'Painted' : 'Painting'} ${PLATES.length} plates`;
          genDone = done;
        }
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the sheet rises in as one piece
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        sheet.style.opacity = gi.toFixed(3);
        sheet.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each plate: the letterboxed frame lands with its preset key, showing the underpainting; the finished frame
        // is laid over it left to right behind a feathered edge while the picture pushes in; then its az / el are written
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const fi = outCubic(seg(t, a, a + 0.2));
          tile.frame.style.opacity = fi.toFixed(3);
          tile.frame.style.transform = fi >= 1 ? 'none' : `translateY(${((1 - fi) * 4).toFixed(2)}px)`;
          const push = outCubic(seg(t, a, T.end));             // every push-in comes to rest as the beat ends
          tile.pic.style.transform = `scale(${lerp(1.06, 1.02, push).toFixed(4)})`;
          const w = smooth(seg(t, a + 0.1, b));
          let mask = 'none';
          if (w > 0 && w < 1) {
            const e = lerp(-FEATHER, 100, w);
            mask = `linear-gradient(90deg, #000 ${e.toFixed(2)}%, transparent ${(e + FEATHER).toFixed(2)}%)`;
          }
          tile.shot.style.opacity = w > 0 ? '1' : '0';
          tile.shot.style.webkitMaskImage = mask;
          tile.shot.style.maskImage = mask;
          const ko = outCubic(seg(t, a + 0.06, a + 0.3));
          tile.key.style.opacity = ko.toFixed(3);
          tile.key.style.transform = ko >= 1 ? 'none' : `translateY(${((1 - ko) * 3).toFixed(2)}px)`;
          const so = outCubic(seg(t, b - 0.12, b + 0.14));
          tile.sun.style.opacity = so.toFixed(3);
          tile.sun.style.transform = so >= 1 ? 'none' : `translateY(${((1 - so) * 3).toFixed(2)}px)`;
        });
      },
    };
  },
};
