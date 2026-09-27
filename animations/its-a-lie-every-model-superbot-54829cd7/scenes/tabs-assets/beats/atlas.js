// Nano Banana beat (Google's Gemini image model), the second request of the minecraft build: it generates the block
// textures. The card shows the prompt, then a 4x3 grid whose tiles resolve one by one out of noise and blur into
// pixel-sharp 16x16 textures, each named; once all twelve are in, the gutters close and the grid packs itself into one
// texture atlas (terrain_atlas.png) that the engine will sample.
//
// SOURCING: every texture is a real crop from BlockHaven by @kepochnik (img/bh/tex/*.png, see CREDITS.txt). No image
// model was called; the generation is staged, the pixels are not hand-drawn.
//
// Pure function of t: no Date, no rAF state, no CSS animation or transition.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted 12 block textures and packed them into one atlas.';
const PROMPT = '16x16 pixel art block textures, top-down, tileable';
// [file in img/bh/tex, the name the tile gets]
const TEX = [
  ['grass-top.png', 'grass_top'], ['grass-side.png', 'grass_side'], ['dirt.png', 'dirt'], ['oak-log.png', 'oak_log'],
  ['leaves.png', 'leaves'], ['crafting-table.png', 'crafting'], ['sand.png', 'sand'], ['water.png', 'water'],
  ['snow.png', 'snow'], ['snow-side.png', 'snow_side'], ['pumpkin.png', 'pumpkin'], ['pumpkin-top.png', 'pumpkin_top'],
];
const TSTEP = 0.045;  // tiles start resolving one after another
const RES = 0.28;     // one tile's resolve
const GAP = 6;        // the grid's gutter before it packs into the atlas

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.1;
    T.tile = TEX.map((_, i) => T.card + 0.14 + i * TSTEP);
    T.tileDone = T.tile.map((a) => a + RES);
    T.pack = T.tileDone[TEX.length - 1] + 0.04;   // the gutters close
    T.packEnd = T.pack + 0.3;
    T.label = T.pack + 0.14;                      // "terrain_atlas.png" lands
    T.end = T.packEnd + 0.22;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const tiles = TEX.map(([f, name]) => `<figure class="atl-t">
      <img class="atl-im" src="${x.img('bh/tex/' + f)}" alt="${x.esc(name)}" decoding="sync"/>
      <i class="atl-nz"></i>
      <span class="atl-nm">${x.esc(name)}</span>
    </figure>`).join('');
    const card = x.el(`<div class="atl">
      <div class="atl-hd">${x.tile('nano')}<span class="atl-pr">${x.esc(PROMPT)}</span>
        <span class="atl-pill"><i class="atl-spin"></i><b class="atl-cnt">0/12</b></span></div>
      <div class="atl-grid">${tiles}</div>
      <div class="atl-ft"><span class="atl-file">terrain_atlas.png</span><span class="atl-dim">64 x 48 px, 12 tiles</span>${x.OK}</div>
    </div>`);
    const grid = card.querySelector('.atl-grid');
    const tileEls = [...card.querySelectorAll('.atl-t')].map((n) => ({ n, im: n.querySelector('.atl-im'), nz: n.querySelector('.atl-nz'), nm: n.querySelector('.atl-nm') }));
    const cnt = card.querySelector('.atl-cnt'), spin = card.querySelector('.atl-spin'), pill = card.querySelector('.atl-pill');
    const ft = card.querySelector('.atl-ft'), ftOk = ft.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastCnt = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card + 0.05, grid], [T.label, ft]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.04, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.35));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // each tile resolves out of noise and blur into its pixel-sharp texture
        tileEls.forEach((o, i) => {
          const p = seg(t, T.tile[i], T.tileDone[i]);
          const e = outCubic(p);
          o.im.style.opacity = (t >= T.tile[i] ? lerp(0.25, 1, e) : 0).toFixed(3);
          o.im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 7).toFixed(2)}px) brightness(${lerp(1.7, 1, e).toFixed(3)}) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
          o.im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.12, 1, e).toFixed(4)})`;
          // the noise veil: full while waiting, thins out as the texture resolves
          o.nz.style.opacity = (1 - outCubic(seg(t, T.tile[i] + 0.04, T.tileDone[i]))).toFixed(3);
          o.nz.style.backgroundPosition = `${((t * 97 + i * 13) % 32).toFixed(0)}px ${((t * 61 + i * 7) % 32).toFixed(0)}px`;
          // the tile's name, gone once the grid packs into the atlas
          o.nm.style.opacity = (outCubic(seg(t, T.tileDone[i] - 0.1, T.tileDone[i] + 0.1)) * (1 - seg(t, T.pack - 0.05, T.pack + 0.15))).toFixed(3);
        });
        const done = T.tileDone.reduce((a, d) => a + (t >= d ? 1 : 0), 0);
        const c = `${done}/12`;
        if (c !== lastCnt) { cnt.textContent = c; lastCnt = c; }
        pill.classList.toggle('is-done', done >= TEX.length);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;

        // the pack: gutters and corners close, the sheet reads as one atlas
        const pk = inOutCubic(seg(t, T.pack, T.packEnd));
        grid.style.gap = `${(GAP * (1 - pk)).toFixed(2)}px`;
        grid.style.setProperty('--atl-r', `${(6 * (1 - pk)).toFixed(2)}px`);
        grid.classList.toggle('is-packed', pk >= 1);

        const fo = outCubic(seg(t, T.label, T.label + 0.3));
        ft.style.opacity = fo.toFixed(3);
        ft.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
        ftOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.label + 0.1, T.label + 0.34))).toFixed(4)})`;
      },
    };
  },
};
