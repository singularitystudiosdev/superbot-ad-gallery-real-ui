// Render beat: Nano Banana Pro renders the three thumbnails. Its line streams, a card rises (the watch card's frame: a
// status spinner, the label "Nano Banana Pro", a "1280 x 720" chip), and inside it three 16:9 tiles A, B and C. Each
// tile starts as its raw frame from the vlog (soft, flat, desaturated: img/raw-*.jpg under a CSS filter), then renders
// one after another: a bright scan line runs top to bottom and above it the finished thumbnail (img/thumb-*.jpg,
// graded photo and text) is revealed. Under each tile its letter and "1280 x 720". When the third lands the spinner
// resolves to the check and the result row lands: "Upscaled 3 frames, added text and contrast".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered all three. The text stays sharp at phone size.';
const LABEL = 'Nano Banana Pro';
const SIZE = '1280 x 720';
const TILES = [['A', 'raw-a.jpg', 'thumb-a.jpg'], ['B', 'raw-b.jpg', 'thumb-b.jpg'], ['C', 'raw-c.jpg', 'thumb-c.jpg']];
const RESULT = 'Upscaled 3 frames, added text and contrast';
// timing (seconds from the reply start, or from the card where noted), in the watch beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const FIRST = 0.3;                     // the card landing to the first tile's render starting
const STAGGER = 0.42;                  // one tile's render start to the next
const REVEAL = 0.55;                   // a tile's scan, top to bottom
const ROW_AT = 0.1;                    // the last tile rendered, then the result row
const ROW_IN = 0.24;                   // the result row rising in
const HOLD = 0.4; /* deliberate */     // the three finished thumbnails read before the next pill

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.tile = TILES.map((_, i) => T.card + FIRST + i * STAGGER);
    T.done = T.tile[T.tile.length - 1] + REVEAL;       // the third thumbnail is in: the spinner resolves to the check
    T.row = T.done + ROW_AT;
    T.end = Math.max(T.row + ROW_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rd-card">
      <div class="rd-hd"><span class="rd-st"><i class="rd-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="rd-meta">${x.esc(SIZE)}</span></div>
      <div class="rd-grid">${TILES.map(([l, raw, fin]) => `<figure class="rd-t">
        <div class="rd-img"><img class="rd-raw" src="${x.img(raw)}" alt=""/><div class="rd-fin"><img src="${x.img(fin)}" alt=""/></div><i class="rd-scan"></i></div>
        <figcaption><b>${l}</b><span>${esc(SIZE)}</span></figcaption>
      </figure>`).join('')}</div>
      <div class="rd-row">${x.OK}<span>${esc(RESULT)}</span></div>
    </div>`);
    const tiles = [...card.querySelectorAll('.rd-t')].map((n) => ({
      n, fin: n.querySelector('.rd-fin'), scan: n.querySelector('.rd-scan'), raw: n.querySelector('.rd-raw'), cap: n.querySelector('figcaption'),
    }));
    const row = card.querySelector('.rd-row');
    const spin = card.querySelector('.rd-spin'), ok = card.querySelector('.rd-st .qc-ok');
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

        // each tile: the raw frame, then the scan reveals the finished thumbnail above it, top to bottom
        tiles.forEach((o, i) => {
          const a = T.tile[i];
          const p = inOutCubic(seg(t, a, a + REVEAL));
          const pc = (p * 100).toFixed(2);
          o.fin.style.clipPath = p >= 1 ? 'none' : `inset(0 0 ${(100 - p * 100).toFixed(2)}% 0)`;
          o.scan.style.top = `${pc}%`;
          o.scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, Math.sin(Math.PI * p) * 2.2) : 0).toFixed(3);
          // the raw frame breathes a little while it waits its turn (rendering), steady once revealed
          o.raw.style.opacity = t < a ? (0.82 + 0.12 * Math.sin((t - T.card) * 9 + i)).toFixed(3) : '1';
          o.n.classList.toggle('on', p >= 1);
          o.cap.style.opacity = (0.45 + 0.55 * outCubic(seg(t, a + REVEAL - 0.1, a + REVEAL + 0.1))).toFixed(3);
        });

        // done: the spinner resolves to the check as the third thumbnail lands
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
