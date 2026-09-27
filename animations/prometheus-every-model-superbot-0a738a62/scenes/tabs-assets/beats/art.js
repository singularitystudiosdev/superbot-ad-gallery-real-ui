// Art beat, chapter III · PLATES: Gemini paints four plates of the PROMETHEUS film. Its line streams, a 2x2 sheet of
// plates rises in, and each plate resolves out of an aged blur under a sweeping gold flare, staggered 0.2s apart,
// stamping the clip's own caption for it as it comes into focus: the chapter tag the HUD shows over that frame, the
// headline in the film's Cinzel caps with its accent word in Roman red (gold on the night plate), and the HUD's ANNO
// year in the HUD mono. The "Creating 4 plates" chip settles to "Created 4 plates" under the thread's gold tick as the
// last plate resolves, like every other beat's tool chip (it used to fade to a ghost and leave a hole over the sheet).
// The plates are real frames, not drawings: img/prometheus/art-1..4.jpg are 512x512 crops of the clip
// (img/prometheus/assets.json art[]): the rose window of THEN WE BUILT CATHEDRALS. (39.7s, AD 1163), the Vitruvian man
// of MAN IS THE MEASURE OF ALL THINGS. (52.6s, AD 1490), the caravel over the red 1492 of THE MAP WAS BLANK. (58.4s,
// AD 1492) and the JWST mirror of WE SAW 13.5 BILLION YEARS INTO THE PAST. (102.8s, AD 2022). Captions, chapter tags
// and years are read off those frames (img/prometheus/chapters.json for the tags and ANNO readings).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painting four plates for the film: cathedral, man, map, stars.';
// The four plates in the order Gemini paints them (img/prometheus/assets.json art[]). head: the clip's headline, one
// array per on-screen line, each run [text, accent]; the accent run is the word the clip sets in red (gold at night).
const PLATES = [
  { src: 'prometheus/art-1.jpg', w: 512, h: 512, tag: 'IV · CATHEDRALIS', era: 'AD 1163', night: false,
    alt: 'Notre-Dame rose window, red and blue lancets ringed by gold rosettes',
    head: [[['THEN WE BUILT']], [['CATHEDRALS.', 1]]] },
  { src: 'prometheus/art-2.jpg', w: 512, h: 512, tag: 'V · RINASCITA', era: 'AD 1490', night: false,
    alt: "Da Vinci's Vitruvian man in circle and square with red proportion rulers",
    head: [[['MAN IS THE '], ['MEASURE', 1]], [['OF ALL THINGS.']]] },
  { src: 'prometheus/art-3.jpg', w: 512, h: 512, tag: 'VI · MARE INCOGNITVM', era: 'AD 1492', night: false,
    alt: 'three-masted caravel with red cross sails over the red 1492 numerals',
    head: [[['THE MAP']], [['WAS '], ['BLANK.', 1]]] },
  { src: 'prometheus/art-4.jpg', w: 512, h: 512, tag: 'XV · COSMOS', era: 'AD 2022', night: true,
    alt: 'James Webb gold hexagon mirror with struts and secondary mirror',
    head: [[['WE SAW '], ['13.5 BILLION', 1]], [['YEARS INTO THE PAST.']]] },
];
const PAINT = 0.8;    // seconds one plate takes to resolve out of the blur
const STAGGER = 0.2;  // gap between one plate starting and the next
const TAIL = 0.3;     // seconds from the last plate landing to the beat's end

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                           // "Creating 4 plates" chip lands
    T.grid = r + 0.34;                                            // the sheet itself rises in
    T.tile = PLATES.map((_, i) => T.grid + i * STAGGER);          // each plate starts resolving
    T.paint = T.tile.map((a) => a + PAINT);                       // ...and is fully sharp here
    T.end = T.paint[PLATES.length - 1] + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const head = (lines) => lines.map((runs) => `<span class="art-l">${runs.map(([s, acc]) => (acc ? `<em>${x.esc(s)}</em>` : x.esc(s))).join('')}</span>`).join('');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="spin done" style="display:none"></span><span class="ch-tool-t">Creating ${PLATES.length} plates</span></span></div>`);
    const grid = x.el(`<div class="art-grid">${PLATES.map((p) => `<div class="art-tile${p.night ? ' art-night' : ''}">
      <img class="art-shot" src="${x.img(p.src)}" alt="${x.esc(p.alt)}" width="${p.w}" height="${p.h}"/>
      <i class="art-band" aria-hidden="true"></i>
      <span class="art-tag"><small>ANNO</small>${x.esc(p.era)}</span>
      <span class="art-cap"><small>${x.esc(p.tag)}</small><b>${head(p.head)}</b></span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({ shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), tag: n.querySelector('.art-tag'), cap: n.querySelector('.art-cap') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const genTile = gen.querySelector('.qc-tile'), genOk = gen.querySelector('.spin'), genLab = gen.querySelector('.ch-tool-t');
    const last = PLATES.length - 1;
    let shown = -1, genDone = null;

    return {
      nodes: [say, gen, grid],
      marks: [[T.r, say], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Creating 4 plates" chip: lands with the ask, then settles to done (gold tick) as the last plate finishes
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
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each plate: an aged blur (soft, sepia, desaturated) resolves to sharp while a gold flare sweeps across it,
        // then its ANNO year and the clip's caption stamp in
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) sepia(${lerp(0.7, 0, e).toFixed(3)}) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.2, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.06, b + 0.2), ce = outCubic(cp);
          tile.cap.style.opacity = ce.toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - ce) * 5).toFixed(2)}px)`;
          tile.tag.style.opacity = outCubic(seg(t, b - 0.12, b + 0.12)).toFixed(3);
        });
      },
    };
  },
};
