// Images beat: Nano Banana Pro draws one image per poll option. Its line streams and a dark result card rises with the
// four square option images (img/poll/*.jpg, 1080 x 1080, rendered by Nano Banana Pro itself for this ad, prompts in
// img/CREDITS.txt) in Maya Makes' workshop look: warm bench light, the same bench and pegboard in every frame. Each
// tile renders in turn (a dark placeholder, then the picture resolves from blur), its small label lands on it, the
// header's spinner resolves to the check and the footer says what the four were matched to. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Drawing one picture per option.';
// [file under img/poll/, the label on the tile and on the poll option]; poll.js reads the same list
export const OPTIONS = [
  ['walnut-desk.jpg', 'Walnut desk'],
  ['floating-shelves.jpg', 'Floating shelves'],
  ['cedar-planter.jpg', 'Cedar planter'],
  ['kids-step-stool.jpg', "Kids' step stool"],
];
const HEAD = 'Rendering 4 poll images';
const SIZE = '1080 × 1080';
const TALLY = '4 images, matched to your last 6 thumbnails';
// timing (seconds from the reply start, or from the card where noted), the <7s pace
const CPS = 110;                       // the reply line streams
const SAY_AT = 0.03;                   // reply start to the line's first character
const CARD = 0.05;                     // reply start to the card rising in
const RISE = 0.2;                      // the card rising in
const TILE_AT = 0.08;                  // the card in to the first tile starting to render
const TILE_STAGGER = 0.08;             // one tile to the next, left to right
const REVEAL = 0.2;                    // a tile resolving from its placeholder
const TALLY_AT = 0.04;                 // the last tile resolved to the footer
const TALLY_IN = 0.16;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.tile = OPTIONS.map((_, i) => T.card + TILE_AT + i * TILE_STAGGER);
    T.done = T.tile[OPTIONS.length - 1] + REVEAL;   // the header's check lands
    T.tally = T.done + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { tiles: T.tile.map((t) => t + REVEAL * 0.5) });
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="nb-card">
      <div class="nb-hd"><span class="nb-st"><i class="nb-spin"></i>${x.OK}</span><b>${x.esc(HEAD)}</b><span class="nb-of">${x.esc(SIZE)}</span></div>
      <div class="nb-grid">${OPTIONS.map(([f, label]) => `<figure class="nb-f"><div class="nb-img"><img src="${x.img('poll/' + f)}" width="1080" height="1080" alt=""/><i class="nb-ph"></i></div><span class="nb-lab">${x.esc(label)}</span></figure>`).join('')}</div>
      <div class="nb-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tiles = [...card.querySelectorAll('.nb-f')].map((n) => ({ img: n.querySelector('img'), ph: n.querySelector('.nb-ph'), lab: n.querySelector('.nb-lab') }));
    const spin = $('.nb-spin'), ok = $('.nb-st .qc-ok'), ft = $('.nb-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each tile: the placeholder shimmers, then the picture resolves out of blur and settles; its label lands on it
        tiles.forEach((n, i) => {
          const a = T.tile[i];
          const p = outCubic(seg(t, a, a + REVEAL));
          n.img.style.opacity = seg(t, a, a + REVEAL * 0.5).toFixed(3);
          n.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * 14).toFixed(2)}px) saturate(${lerp(0.6, 1, p).toFixed(3)})`;
          n.img.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, p).toFixed(4)})`;
          n.ph.style.opacity = (1 - seg(t, a + REVEAL * 0.3, a + REVEAL)).toFixed(3);
          n.ph.style.backgroundPosition = `${(((t - T.card) * 260) % 300).toFixed(1)}% 0`;
          const l = outCubic(seg(t, a + REVEAL * 0.6, a + REVEAL + 0.08));
          n.lab.style.opacity = l.toFixed(3);
          n.lab.style.transform = l >= 1 ? 'none' : `translateY(${((1 - l) * 6).toFixed(2)}px)`;
        });

        const d = outCubic(seg(t, T.done, T.done + 0.16));
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
