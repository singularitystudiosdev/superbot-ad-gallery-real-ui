// Cull beat, a culling contact sheet: Gemini looks through the whole shoot.
// Its line streams, a card rises ("Culling hale_wedding_RAW", a photo counter), and inside it a contact sheet of the
// shoot's frames (img/cull-01..12.jpg, 3:2, four to a row) scrolls up through the window while the counter climbs
// 0 to 3,412. As the counter passes each frame its verdict pops on it: a green "Keep" check on a keeper, a muted red
// tag on a reject ("Soft focus", "Duplicate") with the frame dimmed. Then the cull resolves: the sheet dims under a
// scrim and the chips land over it, one by one, the last one the gold "624 keepers".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. The scroll is one
// row step expressed in the sheet's own height (translateY %), so it is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Looking through all 3,412 photos.';
const LABEL = 'Culling hale_wedding_RAW';
const TOTAL = 3412; // photos in the shoot
// the frames on the sheet, in shoot order: [image, reject reason or null for a keeper]
const TILES = [
  ['cull-01.jpg', null], ['cull-02.jpg', null], ['cull-03.jpg', null], ['cull-04.jpg', 'Soft focus'],
  ['cull-05.jpg', null], ['cull-06.jpg', null], ['cull-07.jpg', 'Duplicate'], ['cull-08.jpg', null],
  ['cull-09.jpg', null], ['cull-10.jpg', 'Soft focus'], ['cull-11.jpg', null], ['cull-12.jpg', null],
];
const COLS = 4;                        // frames to a row; the window shows ROWS_SHOWN of the sheet's rows
const ROWS_SHOWN = 2;
const SHEET_ROWS = TILES.length / COLS;
const ISSUES = ['Kept 624 of 3,412', 'Cut 1,974 duplicates, 512 soft focus, 302 blinks'];
const READY = '624 keepers';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the sheet scrolling, first frame to last (the counter runs with it)
const CHIPS_AT = 1.25;                 // the card landing to the first chip: the last verdict tag (frame 12, passed at
                                       // ~0.64) reads for ~0.5 s before the scrim starts (CHIPS_AT - 0.1)
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const TAG_IN = 0.12;                   // a verdict tag popping on its frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (n) => Math.round(n).toLocaleString('en-US');
const KEEP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the counter value at which frame i gets its verdict: the frames are spread evenly over the shoot
const at = (i) => (TOTAL * (i + 0.5)) / TILES.length;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...ISSUES, READY].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cl-card">
      <div class="cl-hd"><span class="cl-st"><i class="cl-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="cl-cnt"><b class="cl-n">0</b> / ${num(TOTAL)}</span></div>
      <div class="cl-vp">
        <div class="cl-bar"><i class="cl-fill"></i></div>
        <div class="cl-win" style="--cols: ${COLS}; --rows: ${ROWS_SHOWN}"><div class="cl-sheet">${TILES.map(([src, why]) => `<div class="cl-t${why ? ' cl-rej' : ''}"><img src="${x.img(src)}" alt=""/>${why ? `<span class="cl-tag cl-no">${esc(why)}</span>` : `<span class="cl-tag cl-ok">${KEEP}Keep</span>`}</div>`).join('')}</div></div>
        <i class="cl-scrim"></i>
        <div class="cl-chips">${ISSUES.map((tp) => `<span class="cl-chip">${x.esc(tp)}</span>`).join('')}<span class="cl-chip cl-ready">${x.esc(READY)}</span></div>
      </div>
    </div>`);
    const sheet = card.querySelector('.cl-sheet'), n = card.querySelector('.cl-n'), scrim = card.querySelector('.cl-scrim');
    const fill = card.querySelector('.cl-fill');
    const tiles = [...card.querySelectorAll('.cl-t')].map((t, i) => ({ t, tag: t.querySelector('.cl-tag'), at: at(i), rej: !!TILES[i][1] }));
    const chips = [...card.querySelectorAll('.cl-chip')];
    const spin = card.querySelector('.cl-spin'), ok = card.querySelector('.cl-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    // the scroll: the sheet rises by its hidden rows, one row step = (sheet height + one gap) / rows, in % of itself
    const hiddenRows = SHEET_ROWS - ROWS_SHOWN;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scroll: first row to the last, fast through the middle (a touch of blur at speed), the counter with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        const step = e * hiddenRows;
        sheet.style.transform = `translateY(calc(${(-step).toFixed(4)} * (100% + var(--gap)) / ${SHEET_ROWS}))`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        sheet.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        // the counter rides the same easing as the scroll, so the count and the frames in the window move together
        const v = TOTAL * e;
        const c = num(v);
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${(v / TOTAL).toFixed(4)})`;
        // each frame's verdict pops as the counter passes it; a reject dims
        tiles.forEach((o) => {
          const q = p > 0 && v >= o.at ? 1 : 0;
          // the pop runs on the clock from the moment the counter passed the frame (found from the easing's inverse)
          const pass = q ? T.s0 + SCROLL * invInOutCubic(o.at / TOTAL) : Infinity;
          const g = q ? outCubic(seg(t, pass, pass + TAG_IN)) : 0;
          o.tag.style.opacity = g.toFixed(3);
          o.tag.style.transform = g >= 1 ? 'none' : `scale(${lerp(0.6, 1, g).toFixed(4)})`;
          o.t.classList.toggle('on', g > 0);
        });

        // done culling: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the cull resolves: the sheet dims under the scrim, the chips land over it
        scrim.style.opacity = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2)).toFixed(3);
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};

// the inverse of inOutCubic on 0..1: the scroll progress p at which the eased value reaches y
function invInOutCubic(y) {
  return y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2;
}
