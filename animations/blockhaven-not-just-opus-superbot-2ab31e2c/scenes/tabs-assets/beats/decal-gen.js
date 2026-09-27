// Gemini makes the block textures BlockHaven needs: a sheet of ten real 16x16 textures (grass, grass side, dirt, oak
// log rings, oak bark, leaves, sand, water, planks, poppy; Pixel Perfection CE, ../../../img/CREDITS.txt),
// each resolving out of a blur in turn under the sweeping band (../../every-model-one-chat gemini.js), then snapping
// to crisp pixels. The sheet spans the reply column: the deck is width:100% and the grid is equal columns, so the
// tiles scale with the chat column (from ~512px at 9:16 to ~1100px at 16:9) instead of the mc.css 104px cells.
// Five columns (5x2) while that fits the feed; on a wide, short feed a 5x2 of column-wide tiles would run taller than
// the feed and clip, so it lays out as one row of ten. The sizing is inline: mc.css is shared with
// the other beats and keeps its fixed cells for them.
import { seg } from '../../../lib.js';
import { sayer, rise, unblur, band, gen } from './kit.js';

// gen/decal/<file>.png, in sheet order
const TEX = [
  ['grass_top', 'Grass'], ['grass_side', 'Grass side'], ['dirt', 'Dirt'], ['oak_log', 'Oak log'], ['oak_bark', 'Oak bark'],
  ['oak_leaves', 'Leaves'], ['sand', 'Sand'], ['water', 'Water'], ['planks', 'Planks'], ['poppy', 'Poppy'],
];
const COLS = 5;

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.18 * p;
    T.w0 = T.card + 0.2 * p;
    T.tile = TEX.map((_, i) => [T.w0 + i * 0.06 * p, T.w0 + (0.26 + i * 0.06) * p]);
    T.w1 = T.tile[TEX.length - 1][1];
    T.end = T.w1 + 0.45 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.gen, 70);
    const card = x.el(`<div class="qc-img mc-deck" style="width:100%;display:block">
      <div class="mc-grid" style="width:100%;grid-template-columns:repeat(${COLS},minmax(0,1fr))">${TEX.map(([f, n]) => `<figure class="mc-dc"><span class="mc-px" style="width:100%;height:auto;aspect-ratio:1/1"><img src="${gen(`decal/${f}.png`)}" width="128" height="128" style="width:100%;height:100%;image-rendering:pixelated" alt=""/></span><figcaption>${x.esc(n)}<small>16×16</small></figcaption></figure>`).join('')}</div>
      <i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating images</span>
    </div>`);
    const tiles = [...card.querySelectorAll('.mc-px img')], caps = [...card.querySelectorAll('figcaption')];
    const g = card.querySelector('.qc-gen'), gl = card.querySelector('.qc-genl'), grid = card.querySelector('.mc-grid');
    // pick the column count once the card is laid out (offset* ignore the rise transform); renderScroll measures the
    // thread after every beat renders, so the switch is picked up the same frame
    let cols = COLS, fitted = false;
    const fit = () => {
      const feed = card.closest('.feed');
      if (fitted || !feed || !card.offsetWidth) return;
      fitted = true;
      if (card.offsetHeight > 0.8 * feed.clientHeight) { cols = TEX.length; grid.style.gridTemplateColumns = `repeat(${cols},minmax(0,1fr))`; }
    };
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        fit();
        say.render(t, T.r + 0.06);
        rise(card, seg(t, T.card, T.card + 0.45), 14, 0.96);
        tiles.forEach((im, i) => { unblur(im, t, T.tile[i][0], T.tile[i][1]); });
        caps.forEach((c, i) => { c.style.opacity = seg(t, T.tile[i][1] - 0.15, T.tile[i][1] + 0.15).toFixed(3); });
        band(g, gl, t, T.w0, T.w1);
      },
    };
  },
};