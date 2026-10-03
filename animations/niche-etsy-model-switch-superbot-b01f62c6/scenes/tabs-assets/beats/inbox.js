// Inbox beat: Gemini reads the seller's Etsy shop. Its line streams and a card rises in the base's reads grammar (the
// backlog card: a header with the spinner resolving to the check, a counter, rows that resolve): first the compact
// shop strip (the Etsy mark tile, "WrenAndOakStudio", "48 listings"), then "Reading 23 conversations and 31 orders"
// with both counts ticking up while a thin progress bar fills, then three findings land row by row (buyer, the
// message, one tag), the first one carrying the base's gold highlight, and the footer lands with the green check:
// "23 messages sorted, 9 ask about holiday delivery". Buyers are first name + last initial with initials avatars only.
// Everything is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read every buyer message, your 48 listings and your 31 open orders.';
export const SHOP = 'WrenAndOakStudio';
const CONVOS = 23, ORDERS = 31;
// the findings: [buyer, initials, the message, tag, highlighted]
const FINDINGS = [
  ['Emma R.', 'ER', 'Will my name necklace get here before Christmas?', 'Holiday delivery', true],
  ['Marcus T.', 'MT', 'Can you stamp two names on one ring?', 'Custom order'],
  ['Priya S.', 'PS', 'Do you gift wrap?', 'Question'],
];
const DONE = '23 messages sorted, 9 ask about holiday delivery';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace (backlog.js)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.08;                 // the card landing to the counters starting
const COUNT = 0.8; /* deliberate */    // the counters running up (the progress bar fills with them)
const ROW_AT = 0.42;                   // the card landing to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.14;                  // the last finding landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.card + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    // the beat's last visible change: the footer settled, or the line's last character
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ib-card">
      <div class="ib-shop"><span class="ib-mark"><img src="${x.brand('etsy-logo.svg')}" alt=""/></span><b>${x.esc(SHOP)}</b><span>48 listings</span></div>
      <div class="ib-hd"><span class="ib-st"><i class="ib-spin"></i>${x.OK}</span><b>Reading <span class="ib-n">0</span> conversations and <span class="ib-o">0</span> orders</b></div>
      <i class="ib-bar"><i></i></i>
      <div class="ib-list">${FINDINGS.map(([name, ini, msg, tag, hi]) => `<div class="ib-row${hi ? ' ib-hi' : ''}"><i class="ib-av">${ini}</i><b>${x.esc(name)}</b><span class="ib-msg">${x.esc(msg)}</span><span class="ib-tag">${x.esc(tag)}</span></div>`).join('')}</div>
      <div class="ib-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const n = $('.ib-n'), o = $('.ib-o'), bar = $('.ib-bar i'), spin = $('.ib-spin'), ok = $('.ib-st .qc-ok'), ft = $('.ib-ft');
    const rows = [...card.querySelectorAll('.ib-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
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

        // the counters and the bar: a fast run through the shop, easing in at the end
        const p = inOutCubic(seg(t, T.c0, T.c1));
        const c = `${Math.round(CONVOS * p)}/${Math.round(ORDERS * p)}`;
        if (c !== count) { const [a, b] = c.split('/'); n.textContent = a; o.textContent = b; count = c; }
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        // done reading: the spinner resolves to the check as the counters land
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the findings land row by row
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
