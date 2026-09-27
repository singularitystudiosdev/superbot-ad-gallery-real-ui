// Art beat: Gemini paints the reel's style frames. Its line streams, a "Creating 7 style frames" chip lands, and a
// style board rises in: the seven chapter stills of the clip on a 4x2 bar grid (one cell per bar of the 8-bar reel,
// so 01 IDENTITY, which runs bars 1-2, spans two cells), each landing on Gemini's own switch easing, expo-out, and
// resolving out of a blur under Gemini's sweeping band before its mono chapter caption stamps in beneath it, so no
// label covers the clip's own pixels. Under the grid
// the palette strip paints its five swatches with their hex values, and the type strip sets the reel's three faces
// on its red: display 'CLAUDE', serif italic 'motion designer', mono 'MOTION REEL · 2026'.
// The stills are real frames cut from the clip (see img/mr/CREDITS.txt), never redrawn; the wide IDENTITY cell is
// the same still cropped to its title band.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, clamp, streamCount } from '../../../lib.js';

const SAY = 'Painted a style frame per chapter, plus the palette and type.';
// [still, number, chapter, bars]: the seven chapters in clip order; bars = grid cells the frame spans
const FRAMES = [
  ['mr/ch01.jpg', '01', 'IDENTITY', 2],
  ['mr/ch02.jpg', '02', 'EASING', 1],
  ['mr/ch03.jpg', '03', 'MORPHING', 1],
  ['mr/ch04.jpg', '04', 'SYSTEMS', 1],
  ['mr/ch05.jpg', '05', 'DEPTH', 1],
  ['mr/ch06.jpg', '06', 'KINETIC TYPE', 1],
  ['mr/ch07.jpg', '07', 'FIN', 1],
];
// [css var, hex, label ink]: the reel's five swatches, in the order style.css declares them
const SWATCHES = [
  ['--mr-red', '#F04B3A', 'dark'],
  ['--mr-cream', '#F2EFE7', 'dark'],
  ['--mr-blue', '#302FF5', 'light'],
  ['--mr-ink', '#0F0F11', 'light'],
  ['--mr-lime', '#E3FF46', 'dark'],
];
const MID = '·';
const expoOut = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)); // Gemini's switch easing (chat.js EASE['expo-out'])

const LAND = 0.7;      // seconds one frame takes to land and resolve
const STAGGER = 0.09;  // gap between one frame starting and the next
const SW_LAND = 0.5;   // one swatch painting up
const SW_STAGGER = 0.06;
const SPEC_LAND = 0.5; // one type specimen setting
const SPEC_STAGGER = 0.1;
const TAIL = 0.25;     // seconds from the last thing settling to the beat's end (keeps the source's 2.14s)

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                                   // "Creating 7 style frames" chip lands
    T.grid = r + 0.34;                                                    // the style board rises in
    T.tile = FRAMES.map((_, i) => T.grid + 0.06 + i * STAGGER);           // each frame starts landing
    T.land = T.tile.map((a) => a + LAND);                                 // ...and is sharp and still here
    T.pal = r + 0.95;                                                     // the palette strip's header
    T.sw = SWATCHES.map((_, i) => T.pal + 0.04 + i * SW_STAGGER);         // each swatch paints up
    T.type = r + 1.15;                                                    // the type strip wipes in
    T.spec = [0, 1, 2].map((i) => T.type + 0.04 + i * SPEC_STAGGER);      // each specimen sets
    T.settle = Math.max(T.land[FRAMES.length - 1], T.sw[SWATCHES.length - 1] + SW_LAND, T.spec[2] + SPEC_LAND);
    T.end = T.settle + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${FRAMES.length} style frames</span></span></div>`);
    const board = x.el(`<div class="art-board">
      <div class="art-head"><b>Style frames</b><small>128 BPM ${MID} 8 BARS</small></div>
      <div class="art-grid">${FRAMES.map(([src, n, name, bars]) => `<figure class="art-tile${bars > 1 ? ' art-wide' : ''}">
        <div class="art-frame"><img class="art-shot" src="${x.img(src)}" alt="${x.esc(`Chapter ${n} ${name}, a still from the clip`)}"/><i class="art-band" aria-hidden="true"></i></div>
        <figcaption class="art-cap"><b>${n}</b> ${MID} ${x.esc(name)}</figcaption>
      </figure>`).join('')}</div>
      <div class="art-sec art-palsec">
        <div class="art-sec-h"><span>PALETTE</span><span>${SWATCHES.length} SWATCHES</span></div>
        <div class="art-pal">${SWATCHES.map(([v, hex, ink]) => `<span class="art-sw art-sw-${ink}" style="background:var(${v}, ${hex})"><i>${hex}</i></span>`).join('')}</div>
      </div>
      <div class="art-sec art-typesec">
        <div class="art-sec-h"><span>TYPE</span><span>ARCHIVO ${MID} INSTRUMENT SERIF ${MID} JETBRAINS MONO</span></div>
        <div class="art-type"><span class="art-t art-t-d">CLAUDE</span><span class="art-t art-t-s">motion designer</span><span class="art-t art-t-m">MOTION REEL ${MID} 2026</span></div>
      </div>
    </div>`);
    const grid = board.querySelector('.art-grid');
    const tiles = [...grid.children].map((n) => ({ el: n, shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap') }));
    const palSec = board.querySelector('.art-palsec'), typeSec = board.querySelector('.art-typesec');
    const palHead = palSec.querySelector('.art-sec-h'), typeHead = typeSec.querySelector('.art-sec-h');
    const sws = [...palSec.querySelectorAll('.art-sw')].map((n) => ({ el: n, hex: n.firstElementChild }));
    const panel = typeSec.querySelector('.art-type');
    const specs = [...panel.children];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, gen, board],
      // the fold follows the board down as it fills: the grid, then the palette, then the type strip
      marks: [[T.r, say], [T.label, gen], [T.grid, grid], [T.pal, palSec], [T.type, board]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: lands with the ask, then fades out as the board settles
        const li = expoOut(seg(t, T.label, T.label + 0.4));
        const out = seg(t, T.settle - 0.1, T.settle + 0.2);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the board rises in as one sheet
        const gi = expoOut(seg(t, T.grid, T.grid + 0.5));
        board.style.opacity = gi.toFixed(3);
        board.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each frame lands in its cell on expo-out, resolving out of a blur under its band, then stamps its caption
        tiles.forEach((tile, i) => {
          const a = T.tile[i];
          const p = seg(t, a, T.land[i]), e = expoOut(p);
          tile.el.style.opacity = clamp(e * 1.25).toFixed(3);
          tile.el.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 20).toFixed(2)}px) scale(${lerp(0.82, 1, e).toFixed(4)})`;
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 8).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, e).toFixed(1)}%)`;
          tile.band.style.opacity = (p <= 0 || p >= 1 ? 0 : 1 - seg(p, 0.45, 0.85)).toFixed(3);
          const ce = expoOut(seg(t, a + 0.22, a + 0.52));
          tile.cap.style.opacity = ce.toFixed(3);
          tile.cap.style.transform = ce >= 1 ? 'none' : `translateY(${((1 - ce) * 4).toFixed(2)}px)`;
        });

        // the palette: each swatch paints up from its baseline, then its hex value stamps in
        palHead.style.opacity = expoOut(seg(t, T.pal, T.pal + 0.4)).toFixed(3);
        sws.forEach((sw, i) => {
          const s = T.sw[i], e = expoOut(seg(t, s, s + SW_LAND));
          sw.el.style.transform = e >= 1 ? 'none' : `scaleY(${e.toFixed(4)})`;
          const he = expoOut(seg(t, s + 0.15, s + 0.45));
          sw.hex.style.opacity = he.toFixed(3);
          sw.hex.style.transform = he >= 1 ? 'none' : `translateY(${((1 - he) * 3).toFixed(2)}px)`;
        });

        // the type strip: the red panel wipes across, then the three faces set, the display word tracking in
        typeHead.style.opacity = expoOut(seg(t, T.type, T.type + 0.4)).toFixed(3);
        const pe = expoOut(seg(t, T.type, T.type + 0.5));
        panel.style.clipPath = pe >= 1 ? 'none' : `inset(0 ${((1 - pe) * 100).toFixed(2)}% 0 0 round 6px)`;
        specs.forEach((sp, i) => {
          const e = expoOut(seg(t, T.spec[i], T.spec[i] + SPEC_LAND));
          sp.style.opacity = e.toFixed(3);
          sp.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 10).toFixed(2)}px)`;
          if (i === 0) sp.style.letterSpacing = `${lerp(0.25, 0.02, e).toFixed(4)}em`;
        });
      },
    };
  },
};
