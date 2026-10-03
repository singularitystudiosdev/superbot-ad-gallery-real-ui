// Retouch beat: Nano Banana Pro edits the keepers. Its line streams, a card
// rises (the cull card's frame: a status spinner, the label "Nano Banana Pro", a "624 photos" chip), and inside it
// three 3:2 tiles. Each tile starts as its photo straight off the camera (img/raw-*.jpg: the flat RAW look, baked into
// the file), then the edits land one after another: a bright scan line runs top to bottom and above it the finished
// photo (img/edit-*.jpg) is revealed. Under each tile, what the edit did ("Shadows lifted", "Skin tones warmed",
// "Matched to the set"). When the third lands the spinner resolves to the check and the result row lands:
// "Edited 624 photos to one look".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'All 624 edited to one look. Skin tones stay natural.';
const LABEL = 'Nano Banana Pro';
const COUNT = '624 photos';
// [what the edit did, the RAW frame, the finished photo]
const TILES = [
  ['Shadows lifted', 'raw-a.jpg', 'edit-a.jpg'],
  ['Skin tones warmed', 'raw-b.jpg', 'edit-b.jpg'],
  ['Matched to the set', 'raw-c.jpg', 'edit-c.jpg'],
];
const RESULT = 'Edited 624 photos to one look';
// timing (seconds from the reply start, or from the card where noted), in the cull beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const FIRST = 0.3;                     // the card landing to the first tile's render starting
const STAGGER = 0.42;                  // one tile's render start to the next
const REVEAL = 0.55;                   // a tile's scan, top to bottom
const ROW_AT = 0.1;                    // the last tile rendered, then the result row
const ROW_IN = 0.24;                   // the result row rising in
const HOLD = 0.4; /* deliberate */     // the three finished photos read before the next pill

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.tile = TILES.map((_, i) => T.card + FIRST + i * STAGGER);
    T.done = T.tile[T.tile.length - 1] + REVEAL;       // the third photo is in: the spinner resolves to the check
    T.row = T.done + ROW_AT;
    T.end = Math.max(T.row + ROW_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rt-card">
      <div class="rt-hd"><span class="rt-st"><i class="rt-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="rt-meta">${x.esc(COUNT)}</span></div>
      <div class="rt-grid">${TILES.map(([cap, raw, fin]) => `<figure class="rt-t">
        <div class="rt-img"><img class="rt-raw" src="${x.img(raw)}" alt=""/><div class="rt-fin"><img src="${x.img(fin)}" alt=""/></div><i class="rt-scan"></i></div>
        <figcaption>${x.OK}<span>${esc(cap)}</span></figcaption>
      </figure>`).join('')}</div>
      <div class="rt-row">${x.OK}<span>${esc(RESULT)}</span></div>
    </div>`);
    const tiles = [...card.querySelectorAll('.rt-t')].map((n) => ({
      n, fin: n.querySelector('.rt-fin'), scan: n.querySelector('.rt-scan'), raw: n.querySelector('.rt-raw'), cap: n.querySelector('figcaption'),
      tick: n.querySelector('figcaption .qc-ok'),
    }));
    const row = card.querySelector('.rt-row');
    const spin = card.querySelector('.rt-spin'), ok = card.querySelector('.rt-st .qc-ok');
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

        // each tile: the RAW frame, then the scan reveals the finished photo above it, top to bottom
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
          // the caption reads dim while its edit waits; its check pops in only once the edit has landed
          const cq = outCubic(seg(t, a + REVEAL - 0.1, a + REVEAL + 0.1));
          o.cap.style.opacity = (0.45 + 0.55 * cq).toFixed(3);
          o.tick.style.opacity = cq.toFixed(3);
          o.tick.style.transform = cq >= 1 ? 'none' : `scale(${lerp(0.4, 1, cq).toFixed(4)})`;
        });

        // done: the spinner resolves to the check as the third photo lands
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
