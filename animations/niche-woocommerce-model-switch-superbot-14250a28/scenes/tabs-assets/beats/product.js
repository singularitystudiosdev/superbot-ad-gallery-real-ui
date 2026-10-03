// Product beat: Claude Opus 5.5 writes the product pages and sets up every variation. Its line streams and a card
// rises (the base's card grammar, no tabs, no footer buttons): the real hoodie photo as a small thumbnail (the same
// file as the result's row), "Heavyweight Hoodie" and the muted plain text "Variable product". The description types
// out (the sibling store ad's write look, one caret), then the two attribute lines land as plain text ("Color: Black,
// Navy, Oat, Forest", "Size: XS, S, M, L, XL, XXL"), then the stock table fills cell by cell: a data table with thin
// horizontal rules, plain column words and plain size labels, NO cell borders and NO swatches; each number fades in
// over a tint of the hub accent (#8ab4f8) whose strength follows its value (one hue, no rainbow). Under it the plain
// price line and a mono SKU sample, then the green check "4 products, 96 variations, each with a price and a SKU" and
// the muted "Same for Zip Hoodie, Crewneck Sweatshirt and Long Sleeve Tee". In the zoom cut the camera pushes in on the
// card while it builds (chat.js FOCUS). Pure function of t: the typed prefix, every cell, every opacity is written from
// t; every row has a fixed height, so nothing reflows.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote 4 product pages and set up all 96 variations';
const TITLE = 'Heavyweight Hoodie';
const SUB = 'Variable product';
const PHOTO = 'heavyweight-hoodie.jpg';
const DESC = 'Brushed 400 gsm cotton fleece with a roomy lined hood and ribbed cuffs. Pre-washed and cut a little long for layering.';
const ATTR = [['Color', 'Black, Navy, Oat, Forest'], ['Size', 'XS, S, M, L, XL, XXL']];
const COLORS = ['Black', 'Navy', 'Oat', 'Forest'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
// stock per size (row) and colour (column); column sums 84, 74, 72, 82; total 312 (exact, per the spec)
export const STOCK = [[8, 8, 6, 6], [14, 12, 12, 12], [20, 18, 18, 20], [20, 18, 18, 20], [14, 12, 12, 14], [8, 6, 6, 10]];
const PRICE = '$68.00 for every size, your usual markup on cost';
const SKU = 'HW-HOOD-BLK-M';
const DONE = '4 products, 96 variations, each with a price and a SKU';
const SAME = 'Same for Zip Hoodie, Crewneck Sweatshirt and Long Sleeve Tee';
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.28;   // the card is up, then the description's first character lands
const CPS_W = 200; /* deliberate */ // the description types at this many characters a second
const ATTR_AT = 0.08;    // the description written, then the first attribute line
const ATTR_GAP = 0.12;   // one attribute line to the next
const LINE_IN = 0.18;    // a line rising in
const TBL_AT = 0.2;      // the second attribute line, then the table's header row
const CELL_AT = 0.12;    // the header row, then the first cell
const CELL = 0.034; /* deliberate */ // one cell to the next (row by row)
const CELL_IN = 0.2;     // a cell's number and tint fading in
const PRICE_AT = 0.1;    // the last cell in, then the price line
const DONE_AT = 0.2;     // the price line, then the check line
const SAME_AT = 0.2;     // the check line, then the muted line
const HOLD_DONE = 0.4; /* deliberate */ // done: the result reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
const VMIN = 6, VMAX = 20;
const TINT = (v) => 0.07 + 0.25 * (v - VMIN) / (VMAX - VMIN); // the accent's alpha behind a value

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + DESC.length / CPS_W;
    T.attr = ATTR.map((_, i) => T.w1 + ATTR_AT + i * ATTR_GAP);
    T.head = T.attr[ATTR.length - 1] + TBL_AT;
    T.cell = STOCK.flat().map((_, i) => T.head + CELL_AT + i * CELL);
    T.price = T.cell[T.cell.length - 1] + CELL_IN + PRICE_AT;
    T.done = T.price + DONE_AT;
    T.same = T.done + SAME_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      const pull = T.same + LINE_IN + HOLD_DONE;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull, back: pull + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.same + LINE_IN + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="pd-card">
      <div class="pd-hd"><span class="pd-th"><img src="${x.img(PHOTO)}" alt=""/></span><span class="pd-tt"><b>${esc(TITLE)}</b><span>${esc(SUB)}</span></span></div>
      <p class="pd-desc"><span class="pd-v"></span><i class="pd-caret"></i><span class="pd-h">${esc(DESC)}</span></p>
      ${ATTR.map(([a, v]) => `<div class="pd-attr"><span>${esc(a)}:</span> ${esc(v)}</div>`).join('')}
      <div class="pd-tbl">
        <div class="pd-row pd-head"><span class="pd-sz"></span>${COLORS.map((c) => `<span class="pd-n">${esc(c)}</span>`).join('')}</div>
        ${SIZES.map((s, ri) => `<div class="pd-row"><span class="pd-sz">${esc(s)}</span>${STOCK[ri].map((v) => `<span class="pd-n pd-v0"><i class="pd-tint" style="background:rgba(138,180,248,${TINT(v).toFixed(3)})"></i><em>${v}</em></span>`).join('')}</div>`).join('')}
      </div>
      <div class="pd-price"><span>${esc(PRICE)}</span><code>${esc(SKU)}</code></div>
      <div class="pd-ft">${x.OK}<span>${esc(DONE)}</span></div>
      <div class="pd-same">${esc(SAME)}</div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const dv = $('.pd-v'), dh = $('.pd-h'), caret = $('.pd-caret');
    const attrs = [...card.querySelectorAll('.pd-attr')];
    const head = $('.pd-head');
    const cells = [...card.querySelectorAll('.pd-v0')];
    const bodyRows = [...card.querySelectorAll('.pd-row:not(.pd-head)')];
    const price = $('.pd-price'), ft = $('.pd-ft'), same = $('.pd-same');
    let shown = -1, typed = -1;
    const land = (n, t, a, dy = 5) => {
      const p = outCubic(seg(t, a, a + LINE_IN));
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    };

    return {
      nodes: [say, card],
      focus: card,
      marks: [[T.r, say], [T.card, card], [T.head, head], [T.price, price], [T.same, same]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the description types (the untyped rest keeps its place, transparent, so the lines never reflow)
        const n = streamCount(DESC, T.w0, CPS_W, t);
        if (n !== typed) { dv.textContent = DESC.slice(0, n); dh.textContent = DESC.slice(n); typed = n; }
        caret.style.opacity = t >= T.w0 - 0.05 && n < DESC.length ? '1' : '0';

        attrs.forEach((a, i) => land(a, t, T.attr[i]));
        land(head, t, T.head, 3);
        // a row (its size label and its rule) arrives with its first cell, so no empty ruled line ever waits on screen
        bodyRows.forEach((n, ri) => { n.style.opacity = outCubic(seg(t, T.cell[ri * 4] - 0.04, T.cell[ri * 4] + CELL_IN)).toFixed(3); });
        cells.forEach((c, i) => {
          const p = outCubic(seg(t, T.cell[i], T.cell[i] + CELL_IN));
          c.style.opacity = p.toFixed(3);
        });
        land(price, t, T.price);
        land(ft, t, T.done, 6);
        land(same, t, T.same);
      },
    };
  },
};
