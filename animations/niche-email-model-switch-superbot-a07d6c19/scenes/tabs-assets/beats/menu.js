// Menu beat: GPT-6 Astra reads the cafes' menu photos. Its line streams and a card rises holding ONE real menu-board
// photo (img/menu-board.jpg, Pexels, img/CREDITS.txt). A scan line sweeps it top to bottom; as it passes each chalk
// line a highlight box lands on that line of the photo and the drink joins the "On the menu" list beside it. Then the
// verdict tag lands ("No cold brew on the menu") and the footer tallies all 52 menus.
// The boxes sit on the photo's real text lines: LINES below are measured on the crop itself (790 x 990 px), so every
// box frames the word it names. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze
// any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read every menu photo and checked each one for cold brew.';
const PHOTO = { w: 790, h: 990 };
// [drink, x0, y0, x1, y1] in the crop's pixels: the chalk lines of the board, top to bottom
const LINES = [
  ['Espresso', 200, 144, 530, 256],
  ['Latte', 196, 298, 440, 399],
  ['Mocha', 190, 441, 505, 554],
  ['Cappuccino', 186, 581, 645, 704],
  ['Macchiato', 186, 741, 630, 874],
];
const VERDICT = 'No cold brew on the menu';
const TALLY = '52 menus read: 40 have no cold brew, 12 brew their own (skipped)';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.24;                  // the card landing to the scan line starting
const SCAN = 0.7; /* deliberate */     // the scan line crossing the photo, top to bottom
const BOX_IN = 0.16;                   // a box (and its list item) popping in as the scan passes the line's middle
const VERDICT_AT = 0.08;               // the scan done to the verdict tag
const VERDICT_IN = 0.24;               // the verdict landing
const TALLY_AT = 0.16;                 // the verdict to the tally footer
const TALLY_IN = 0.24;                 // the tally rising in

const pct = (v) => `${(v * 100).toFixed(3)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in y, so each box lands the moment the line crosses its middle
    T.box = LINES.map(([, , y0, , y1]) => T.s0 + SCAN * ((y0 + y1) / 2 / PHOTO.h));
    T.verdict = T.s1 + VERDICT_AT;
    T.tally = T.verdict + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="mn-card">
      <div class="mn-hd"><span class="mn-st"><i class="mn-spin"></i>${x.OK}</span><b>Reading menu photo</b><span class="mn-of">Juniper Street Cafe</span></div>
      <div class="mn-body">
        <div class="mn-ph" style="aspect-ratio: ${PHOTO.w} / ${PHOTO.h}">
          <img src="${x.img('menu-board.jpg')}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          ${LINES.map(([, x0, y0, x1, y1]) => `<i class="mn-box" style="left: ${pct(x0 / PHOTO.w)}; top: ${pct(y0 / PHOTO.h)}; width: ${pct((x1 - x0) / PHOTO.w)}; height: ${pct((y1 - y0) / PHOTO.h)}"></i>`).join('')}
          <i class="mn-scan"></i>
        </div>
        <div class="mn-side">
          <small>On the menu</small>
          <ul>${LINES.map(([d]) => `<li><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${x.esc(d)}</li>`).join('')}</ul>
          <span class="mn-verdict"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/></svg>${x.esc(VERDICT)}</span>
        </div>
      </div>
      <div class="mn-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const boxes = [...card.querySelectorAll('.mn-box')], items = [...card.querySelectorAll('.mn-side li')];
    const scan = $('.mn-scan'), verdict = $('.mn-verdict'), ft = $('.mn-ft'), spin = $('.mn-spin'), ok = $('.mn-st .qc-ok');
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

        // the scan line: linear top to bottom, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.top = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        boxes.forEach((b, i) => {
          const q = outCubic(seg(t, T.box[i], T.box[i] + BOX_IN));
          b.style.opacity = q.toFixed(3);
          b.style.transform = q >= 1 ? 'none' : `scale(${lerp(1.12, 1, q).toFixed(4)})`;
          const li = items[i];
          li.style.opacity = q.toFixed(3);
          li.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -6).toFixed(2)}px)`;
        });
        // done reading: the spinner resolves to the check as the scan finishes
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const v = outCubic(seg(t, T.verdict, T.verdict + VERDICT_IN));
        verdict.style.opacity = v.toFixed(3);
        verdict.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, v).toFixed(4)})`;
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
