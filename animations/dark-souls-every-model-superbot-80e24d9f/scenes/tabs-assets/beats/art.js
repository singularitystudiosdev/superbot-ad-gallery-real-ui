// Art beat: Gemini finishes the Dark Souls concept paintings. Its line streams, the art lands, and each painting
// resolves out of a blur under its own sweeping band, staggered 0.18s apart, each stamping its caption as it comes into
// focus. The "Creating N images" chip fades away as the last one resolves.
// Three shapes, all one beat: the default 2x2 grid of four paintings; opts.single = { src, cap, say } for ONE wide tile
// (the fog gate texture Codex handed over) with a "Creating 1 image" chip; opts.lead = '<src>' for the opener, where the
// named painting is reordered first and drawn biggest (a 1 big + 3 small hero layout) so the Gatewarden resolves first.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Made concept art for the knight, the Gatewarden and the sanctuary.';
const LEAD_SAY = 'Painted the Gatewarden, the Last Oath.';
// [source, caption]: the four concept paintings, in the order Gemini paints them
const SHOTS = [
  ['ds/art-1.jpg', 'Knight'],
  ['ds/art-2.jpg', 'Gatewarden'],
  ['ds/art-3.jpg', 'Sanctuary'],
  ['ds/art-4.jpg', 'Great door'],
];
const PAINT = 1.0;       // seconds one small painting takes to resolve out of the blur
const LEAD_PAINT = 1.35; // the hero painting is the biggest, so it takes longer to come in
const SINGLE_PAINT = 1.1;
const STAGGER = 0.18;    // gap between one painting starting and the next

// the paintings in the order this build paints them: the lead first (biggest), the rest in their own order unchanged
const order = (o) => (o && o.lead ? [SHOTS.find((s) => s[0] === o.lead), ...SHOTS.filter((s) => s[0] !== o.lead)].filter(Boolean) : SHOTS);
const paintFor = (i, o) => (o.single ? SINGLE_PAINT : o.lead && i === 0 ? LEAD_PAINT : PAINT);

export default {
  times(r, opts = {}) {
    const T = { r };
    const n = opts.single ? 1 : 4;
    T.label = r + 0.28;                                            // "Creating N images" chip lands
    T.grid = r + 0.34;                                             // the sheet itself rises in
    T.tile = Array.from({ length: n }, (_, i) => T.grid + i * STAGGER); // each painting starts resolving
    T.paint = T.tile.map((a, i) => a + paintFor(i, opts));         // ...and is fully sharp here
    T.end = Math.max(...T.paint) + 0.35;                         // lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = k.opts || {};
    const single = o.single;
    const say = o.say || (single ? single.say : o.lead ? LEAD_SAY : SAY);
    const shots = single ? [[single.src, single.cap]] : order(o);
    const cls = single ? 'art-single' : o.lead ? 'art-lead' : '';
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow art-genrow"><span class="ch-tool art-gen">${x.tile('gemini')}<span class="ch-tool-t">Creating ${shots.length} image${shots.length > 1 ? 's' : ''}</span></span></div>`);
    const grid = x.el(`<div class="art-grid ${cls}">${shots.map(([src, name]) => `<div class="art-tile">
      <img class="art-shot" src="${x.img(src)}" alt="${x.esc(name)} concept art"/>
      <i class="art-band" aria-hidden="true"></i>
      <span class="art-cap">${x.esc(name)}</span>
    </div>`).join('')}</div>`);
    const tiles = [...grid.children].map((n) => ({ shot: n.querySelector('.art-shot'), band: n.querySelector('.art-band'), cap: n.querySelector('.art-cap') }));
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    let shown = -1;

    return {
      nodes: [sayEl, gen, grid],
      marks: [[T.r, sayEl], [T.label, gen], [T.grid, grid]],
      render(t) {
        const n = streamCount(say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = say.slice(0, n); hid.textContent = say.slice(n); shown = n; }

        // the "Creating N images" chip: lands with the ask, then fades out as the last painting finishes
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        const out = seg(t, T.paint[shots.length - 1] - 0.08, T.paint[shots.length - 1] + 0.3);
        gen.style.opacity = (li * (1 - out)).toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        // the sheet rises in as one piece
        const gi = outCubic(seg(t, T.grid, T.grid + 0.45));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, gi).toFixed(4)})`;

        // each painting: blur and desaturate resolve to sharp while its own band sweeps across the tile
        tiles.forEach((tile, i) => {
          const a = T.tile[i], b = T.paint[i];
          const p = seg(t, a, b), e = outCubic(p);
          tile.shot.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          tile.shot.style.opacity = lerp(0.25, 1, e).toFixed(3);
          tile.shot.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.07, 1, e).toFixed(4)})`;
          tile.band.style.transform = `translateX(${lerp(-115, 115, p).toFixed(1)}%)`;
          tile.band.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.75, 1)).toFixed(3);
          const cp = seg(t, b - 0.1, b + 0.24);
          tile.cap.style.opacity = outCubic(cp).toFixed(3);
          tile.cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - outCubic(cp)) * 5).toFixed(2)}px)`;
        });
      },
    };
  },
};