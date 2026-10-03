// Images beat: Nano Banana Pro makes the 4 featured images. Its line streams, a card rises (the thumbnail remake's
// render card: a status spinner, the label "Nano Banana Pro", a "4 featured images" chip), and inside it a 2 x 2 grid
// of 16:9 tiles. Each tile starts as a dark generating field (a soft moving sheen), then renders one after another:
// a bright scan line runs top to bottom and above it the finished image is revealed (img/*.jpg, real photographs).
// Under each tile its file name and "1200 × 675". When the fourth lands the spinner resolves to the check and the
// result chip lands: "Alt text written".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Made a featured image for each post, sized for WordPress.';
const LABEL = 'Nano Banana Pro';
const META = '4 featured images';
const SIZE = '1200 × 675';
// the on-screen file name, the photo behind it
const TILES = [
  ['cold-brew-ratio.webp', 'cold-brew-ratio.jpg'],
  ['pour-over-ratio.webp', 'pour-over-ratio.jpg'],
  ['french-press-grind.webp', 'french-press-grind.jpg'],
  ['aeropress-recipe.webp', 'aeropress-recipe.jpg'],
];
const RESULT = 'Alt text written';
// timing (seconds from the reply start, or from the card where noted), in the render beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const FIRST = 0.28;                    // the card landing to the first tile's render starting
const STAGGER = 0.22;                  // one tile's render start to the next
const REVEAL = 0.45;                   // a tile's scan, top to bottom
const ROW_AT = 0.1;                    // the last tile rendered, then the result chip
const ROW_IN = 0.24;                   // the result chip rising in
const HOLD = 0.3; /* deliberate */     // the four finished images read before the next pill

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.tile = TILES.map((_, i) => T.card + FIRST + i * STAGGER);
    T.done = T.tile[T.tile.length - 1] + REVEAL;       // the fourth image is in: the spinner resolves to the check
    T.row = T.done + ROW_AT;
    T.end = Math.max(T.row + ROW_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="im-card">
      <div class="im-hd"><span class="im-st"><i class="im-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="im-meta">${x.esc(META)}</span></div>
      <div class="im-grid">${TILES.map(([name, f]) => `<figure class="im-t">
        <div class="im-img"><i class="im-gen"></i><div class="im-fin"><img src="${x.img(f)}" alt=""/></div><i class="im-scan"></i></div>
        <figcaption><b>${esc(name)}</b><span>${esc(SIZE)}</span></figcaption>
      </figure>`).join('')}</div>
      <div class="im-row"><span class="im-chip">${x.OK}${esc(RESULT)}</span></div>
    </div>`);
    const tiles = [...card.querySelectorAll('.im-t')].map((n) => ({
      n, fin: n.querySelector('.im-fin'), scan: n.querySelector('.im-scan'), gen: n.querySelector('.im-gen'), cap: n.querySelector('figcaption'),
    }));
    const row = card.querySelector('.im-row');
    const spin = card.querySelector('.im-spin'), ok = card.querySelector('.im-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each tile: the generating field (its sheen drifting), then the scan reveals the finished image above it
        tiles.forEach((o, i) => {
          const a = T.tile[i];
          const p = inOutCubic(seg(t, a, a + REVEAL));
          o.fin.style.clipPath = p >= 1 ? 'none' : `inset(0 0 ${(100 - p * 100).toFixed(2)}% 0)`;
          o.scan.style.top = `${(p * 100).toFixed(2)}%`;
          o.scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, Math.sin(Math.PI * p) * 2.2) : 0).toFixed(3);
          o.gen.style.backgroundPosition = `${(((t - T.card) * 60 + i * 37) % 200).toFixed(1)}% 50%`;
          o.n.classList.toggle('on', p >= 1);
          o.cap.style.opacity = (0.45 + 0.55 * outCubic(seg(t, a + REVEAL - 0.1, a + REVEAL + 0.1))).toFixed(3);
        });

        // done: the spinner resolves to the check as the fourth image lands
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const q = outCubic(seg(t, T.row, T.row + ROW_IN));
        row.style.opacity = q.toFixed(3);
        row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
      },
    };
  },
};
