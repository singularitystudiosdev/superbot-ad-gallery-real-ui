// Catalog beat: Gemini reads the whole store, every product and every photo. Its line streams and a card rises (the
// base's backlog grammar via the GitHub fork's repo card: a compact card, a counter, rows that resolve). First the
// store: the Shopify bag tile, "Lumen & Clay", "48 products" and its myshopify domain. Then the counter "Reading 48
// products and 131 photos" ticks up both numbers while its thin bar fills, and three findings resolve as rows (the
// product's own thumbnail: its real photo, or Polaris's empty-image placeholder when it has none; the product name;
// what is wrong; one tag). The first, Linen Table Runner with no photos, carries the highlight. The footer lands with
// the green check: "5 products missing photos, 41 thin descriptions".
// The store and every product are made up for the spot (brand/CREDITS.txt). Pure function of t: every moving value is
// written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { pi } from './polaris-icons.js?v=a3b73360';

const SAY = 'Read all 48 products and every one of their 131 photos.';
export const STORE = { name: 'Lumen & Clay', domain: 'lumen-and-clay.myshopify.com', products: 48, photos: 131 };
// the findings: [product, finding, tag, photo (img/ file or null), highlighted]
const FINDINGS = [
  ['Linen Table Runner', 'No photos uploaded', 'Missing photos', null, true],
  ['Olive Wood Serving Board', 'No photos uploaded', 'Missing photos', null, false],
  ['Speckled Stoneware Mug', 'Description is 3 words long', 'Thin copy', 'mug.jpg', false],
];
const DONE = '5 products missing photos, 41 thin descriptions';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.2;                  // the card landing to the counter starting
const COUNT = 0.7; /* deliberate */    // the counter running up to 48 and 131 (its bar fills with it)
const ROW_AT = 0.3;                    // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

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
    const thumb = (photo) => (photo ? `<span class="ct-th"><img src="${x.img(photo)}" alt=""/></span>` : `<span class="ct-th ct-none">${pi('image')}</span>`);
    const card = x.el(`<div class="ct-card">
      <div class="ct-store">
        <span class="ct-bag"><img src="${x.brand('shopify-logo.svg')}" alt=""/></span>
        <span class="ct-sm"><b>${x.esc(STORE.name)}</b><code>${x.esc(STORE.domain)}</code></span>
        <span class="ct-np">${STORE.products} products</span>
      </div>
      <div class="ct-ch"><span class="ct-st"><i class="ct-spin"></i>${x.OK}</span><b>Reading <span class="ct-n">0</span> products and <span class="ct-p">0</span> photos</b></div>
      <i class="ct-cbar"><i></i></i>
      <div class="ct-list">${FINDINGS.map(([name, text, tag, photo, hi]) => `<div class="ct-row${hi ? ' ct-hi' : ''}">${thumb(photo)}
        <div class="ct-main"><span class="ct-r1"><b>${x.esc(name)}</b><span class="ct-tag">${x.esc(tag)}</span></span><span class="ct-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="ct-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ct-spin'), ok: $('.ct-st .qc-ok') };
    const ch = $('.ct-ch'), cbarW = $('.ct-cbar'), cbar = $('.ct-cbar i'), n = $('.ct-n'), ph = $('.ct-p'), ft = $('.ct-ft');
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

        // the counter and its bar: products and photos run up together
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = `${Math.round(STORE.products * q)}|${Math.round(STORE.photos * q)}`;
        if (c !== count) { const [a, b] = c.split('|'); n.textContent = a; ph.textContent = b; count = c; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
