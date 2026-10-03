// Catalog beat: Gemini reads the whole Amazon catalog plus every competing offer. Its line streams and a card rises (the
// base fork's reads grammar, via the GitHub sibling's repo.js: a compact card, a counter, rows that resolve). First the
// account: the Amazon "a" and smile on its Seller Central tile, Copperline Kitchen, 64 listings, United States. Then
// "Reading 64 listings and 1,280 offers" ticks up with its thin bar, and three findings resolve as rows (the product's
// own photo, the product, one tag, the finding); the first, the 236 character title, carries the highlight. The footer
// lands with the green check: "6 listings suppressed, 4 without the Buy Box".
// LISTINGS is the one list the whole spot reads (this beat's rows, the Opus panel in write.js, the Seller Central table
// in sellercentral.js). Every name, ASIN, SKU, price and count is made up for the spot. Pure function of t: every
// moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

export const STORE = { name: 'Copperline Kitchen', market: 'United States', listings: 64, offers: 1280 };
// the listings: fix T = title rewritten (it was search suppressed), P = price matched (it had lost the Featured Offer),
// '' = untouched. old/new: the title before and after (old only where it changes), price/newPrice in USD, fo/newFo the
// Featured Offer, avail the units available, img the product photo under img/ (see img/CREDITS.txt)
export const LISTINGS = [
  { name: 'Silicone Baking Mat, 2 Pack', sku: 'CK-BM-02', asin: 'B0CK7M2Q4D', fix: 'T', price: '14.99', fo: 'Yes', avail: 212, img: 'baking-mat.jpg', tab: 'Baking Mat',
    old: 'Silicone Baking Mat 2 Pack Non Stick Baking Sheet Liner Reusable Baking Mat Oven Liner Macaron Baking Mat Cookie Sheet Silicone Mat for Baking...',
    title: 'Copperline Silicone Baking Mat, 2 Pack, Non-Stick Half Sheet Liners for Cookies and Macarons, 16.5 x 11.6 in' },
  { name: 'Oil Mister Spray Bottle', sku: 'CK-OM-01', asin: 'B0CK9T3WLP', fix: 'T', price: '12.49', fo: 'Yes', avail: 148, img: 'oil-mister.jpg', tab: 'Oil Mister',
    old: 'Olive Oil Sprayer for Cooking!!! Oil Mister Spray Bottle BEST Oil Dispenser for Air Fryer Oil Spray Bottle...',
    title: 'Copperline Oil Mister for Cooking, 200 ml Glass Spray Bottle for Air Fryers and Salads' },
  { name: 'Cast Iron Skillet Scrubber', sku: 'CK-CS-01', asin: 'B0CKD4R8XN', fix: 'P', price: '12.99', newPrice: '11.49', fo: 'No', newFo: 'Yes', avail: 96, img: 'scrubber.jpg',
    title: 'Copperline Cast Iron Skillet Scrubber, Stainless Steel Chainmail with Silicone Insert' },
  { name: 'Bamboo Cutting Board Set', sku: 'CK-CB-03', asin: 'B0CKF6H2ZJ', fix: 'T', price: '29.99', fo: 'Yes', avail: 63, img: 'cutting-board.jpg',
    old: 'Bamboo Cutting Boards for Kitchen {3 Pack} Cutting Board Set Wood Cutting Board with Juice Groove...',
    title: 'Copperline Bamboo Cutting Board Set, 3 Pack, with Juice Grooves and Easy-Grip Handles' },
  { name: 'Wooden Spoon Set, 5 Piece', sku: 'CK-WS-05', asin: 'B0CKH8V5MA', fix: 'P', price: '16.99', newPrice: '15.79', fo: 'No', newFo: 'Yes', avail: 120, img: 'spoons.jpg',
    title: 'Copperline Wooden Spoon Set, 5 Piece, Teak Cooking Utensils for Nonstick Pans' },
  { name: 'Glass Food Storage Set', sku: 'CK-FS-10', asin: 'B0CKJ1P7QT', fix: '', price: '34.99', fo: 'Yes', avail: 41, img: 'food-storage.jpg',
    title: 'Copperline Glass Food Storage Set, 10 Containers with Snap Lock Lids' },
  { name: 'Herb Keeper', sku: 'CK-HK-01', asin: 'B0CKL3B9WE', fix: 'P', price: '19.99', newPrice: '18.95', fo: 'No', newFo: 'Yes', avail: 77, img: 'herb-keeper.jpg',
    title: 'Copperline Herb Keeper, Glass Fresh Herb Saver for the Refrigerator' },
  { name: 'Stainless Measuring Cups', sku: 'CK-MC-08', asin: 'B0CKN5G2RY', fix: 'T', price: '11.99', fo: 'Yes', avail: 185, img: 'measuring-cups.jpg',
    old: 'Measuring Cups Stainless Steel Measuring Cups Set Stackable Measuring Cups $ Kitchen Gadgets...',
    title: 'Copperline Stainless Steel Measuring Cups, Set of 6, Stackable with Engraved Markings' },
];

const SAY = 'Read all 64 listings and every competing offer on them.';
// the findings: [listing index, finding, tag, highlighted]
const FINDINGS = [
  [0, 'Title is 236 characters long', 'Search suppressed', true],
  [1, 'Title uses "!!!" and repeats "oil" 4 times', 'Search suppressed', false],
  [2, 'Another seller is $1.50 lower', 'No Buy Box', false],
];
const DONE = '6 listings suppressed, 4 without the Buy Box';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace (the GitHub sibling's
// repo.js, beat for beat)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.2;                  // the card landing to the counter starting
const COUNT = 0.7; /* deliberate */    // the counter running up to 64 listings and 1,280 offers (its bar fills with it)
const ROW_AT = 0.3;                    // the counter starting to the first finding
const STAGGER = 0.16;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.26;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ct-card">
      <div class="ct-acct">
        <span class="ct-mark"><img src="${x.brand('amazon-icon-white.svg')}" alt=""/></span>
        <span class="ct-meta"><b>${x.esc(STORE.name)}</b><span>${STORE.listings} listings<i class="ct-dot"></i>${x.esc(STORE.market)}</span></span>
      </div>
      <div class="ct-ch"><span class="ct-st"><i class="ct-spin"></i>${x.OK}</span><b>Reading <span class="ct-n">0</span> listings and <span class="ct-o">0</span> offers</b></div>
      <i class="ct-bar"><i></i></i>
      <div class="ct-list">${FINDINGS.map(([li, text, tag, hi]) => `<div class="ct-row${hi ? ' ct-hi' : ''}"><img class="ct-ph" src="${x.img(LISTINGS[li].img)}" alt=""/>
        <div class="ct-main"><span class="ct-r1"><b>${x.esc(LISTINGS[li].name)}</b><span class="ct-tag">${x.esc(tag)}</span></span><span class="ct-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="ct-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ct-spin'), ok: $('.ct-st .qc-ok') };
    const bar = $('.ct-bar i'), n = $('.ct-n'), o = $('.ct-o'), ft = $('.ct-ft');
    const rows = [...card.querySelectorAll('.ct-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter: listings and offers run up together, the bar fills with them
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = `${Math.round(STORE.listings * q)}|${Math.round(STORE.offers * q)}`;
        if (c !== count) { n.textContent = fmt(Math.round(STORE.listings * q)); o.textContent = fmt(Math.round(STORE.offers * q)); count = c; }
        bar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const e = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = e.toFixed(3);
          row.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
