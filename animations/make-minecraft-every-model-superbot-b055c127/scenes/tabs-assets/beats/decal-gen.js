// Gemini makes the decals: a 3x2 sheet of 16x16 block textures, each resolving out of a blur in turn under the
// sweeping band (../../every-model-one-chat gemini.js), then snapping to crisp pixels. The tiles are downsampled
// crops of the gameplay clip (../../../img/CREDITS.txt).
import { seg } from '../../../lib.js';
import { sayer, rise, unblur, band, gen } from './kit.js';
import { DECALS } from './decal-scrape.js';

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.22 * p;
    T.w0 = r + 0.3 * p;
    T.tile = DECALS.map((_, i) => [T.w0 + i * 0.16 * p, T.w0 + (0.55 + i * 0.16) * p]);
    T.w1 = T.tile[DECALS.length - 1][1];
    T.end = T.w1 + 0.55 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.gen, 70);
    const card = x.el(`<div class="qc-img mc-deck">
      <div class="mc-grid">${DECALS.map(([f, n]) => `<figure class="mc-dc"><span class="mc-px"><img src="${gen(`decal/${f}.png`)}" width="128" height="128" alt=""/></span><figcaption>${x.esc(n)}<small>16×16</small></figcaption></figure>`).join('')}</div>
      <i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating images</span>
    </div>`);
    const tiles = [...card.querySelectorAll('.mc-px img')], caps = [...card.querySelectorAll('figcaption')];
    const g = card.querySelector('.qc-gen'), gl = card.querySelector('.qc-genl');
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.06);
        rise(card, seg(t, T.card, T.card + 0.45), 14, 0.96);
        tiles.forEach((im, i) => { unblur(im, t, T.tile[i][0], T.tile[i][1]); });
        caps.forEach((c, i) => { c.style.opacity = seg(t, T.tile[i][1] - 0.15, T.tile[i][1] + 0.15).toFixed(3); });
        band(g, gl, t, T.w0, T.w1);
      },
    };
  },
};
