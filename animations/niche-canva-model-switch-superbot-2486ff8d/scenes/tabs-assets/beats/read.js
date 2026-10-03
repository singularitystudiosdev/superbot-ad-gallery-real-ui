// Read beat (the sibling model-switch ad's watch beat, reskinned): Gemini reads the client's brand brief. Its line streams, a card
// rises ("Reading copperleaf_brief.pdf", a page counter), and inside it a window of the brief's pages scrolls fast from
// the cover to the last page while the counter climbs p. 1 / 12 to 12 / 12: each row a mono page number, a small
// portrait page thumbnail (img/page-*.jpg: crops of the shoot's real photos, the palette page, the type specimen, the
// sizes page) and a caption. The three pages Gemini picks (4 colours, 5 type, 8 sizes) light gold with a star as the
// counter passes them. Then the read resolves: the rows dim under a scrim and the chips land over them, one by one,
// the last one the gold "Ready to design".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read all 12 pages. Here\u2019s what the brand needs.';
const LABEL = 'Reading copperleaf_brief.pdf';
const TOTAL = 12; // pages
// the pages as they pass: [page, page thumbnail, caption, picked?]
const ROWS = [
  [1, 'page-01.jpg', 'Cover: Autumn Blend, out Oct 14'],
  [2, 'page-02.jpg', 'About: small-batch roaster since 2014'],
  [3, 'page-03.jpg', 'Logo and clear space'],
  [4, 'page-04.jpg', 'Colours: Copper, Oat, Pine', true],
  [5, 'page-05.jpg', 'Type: Fraunces and Inter', true],
  [6, 'page-06.jpg', 'Voice: warm, short, no exclamation marks'],
  [7, 'page-07.jpg', 'Photo shoot: 18 frames'],
  [8, 'page-08.jpg', 'Sizes: post, story, in-store poster', true],
  [9, 'page-09.jpg', 'Launch date: Oct 14'],
  [10, 'page-10.jpg', 'Do and don\u2019t'],
  [11, 'page-11.jpg', 'Approvals: Maya, brand lead'],
  [12, 'page-12.jpg', 'Contacts'],
];
const ISSUES = ['3 colours', '2 fonts', '3 sizes'];
const READY = 'Ready to design';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 1.0; /* deliberate */   // the pages scrolling past, cover to last (the counter runs with it); 12 rows
                                       // where the sibling ad had 7, so a touch longer than its 0.72 to stay legible
const CHIPS_AT = 1.1;                  // the card landing to the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 34;                        // one row's height, px (the portrait page thumbnail is 22 x 29)

// the page the counter shows at scroll progress e (1 at the cover, 12 at the last page)
const pageAt = (e) => Math.min(TOTAL, 1 + Math.floor(e * (TOTAL - 1) + 1e-6));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STAR = '<svg class="wt-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg>';

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
    const card = x.el(`<div class="wt-card">
      <div class="wt-hd"><span class="wt-st"><i class="wt-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="wt-cnt">p. <b class="wt-n">1</b> / 12</span></div>
      <div class="wt-vp">
        <div class="wt-bar"><i class="wt-fill"></i></div>
        <div class="wt-win"><div class="wt-list">${ROWS.map(([pg, sw, cap, pick]) => `<div class="wt-row${pick ? ' wt-pick' : ''}"><span class="wt-tm">${pg}</span><img class="wt-sw" src="${x.img(sw)}" alt=""/><span class="wt-cap">${esc(cap)}</span>${pick ? STAR : ''}</div>`).join('')}</div></div>
        <i class="wt-scrim"></i>
        <div class="wt-chips">${ISSUES.map((tp) => `<span class="wt-chip">${x.esc(tp)}</span>`).join('')}<span class="wt-chip wt-ready">${x.esc(READY)}</span></div>
      </div>
    </div>`);
    const list = card.querySelector('.wt-list'), n = card.querySelector('.wt-n'), scrim = card.querySelector('.wt-scrim');
    const fill = card.querySelector('.wt-fill');
    const rows = [...card.querySelectorAll('.wt-row')].map((r, i) => ({ r, at: ROWS[i][0], pick: !!ROWS[i][3] }));
    const chips = [...card.querySelectorAll('.wt-chip')];
    const spin = card.querySelector('.wt-spin'), ok = card.querySelector('.wt-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
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

        // the scroll: cover to the last page, fast through the middle (a touch of blur at speed), the counter with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        // the counter rides the same easing as the scroll, so the page on the counter is a page in the window
        const v = pageAt(e);
        const c = String(v);
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${e.toFixed(4)})`;
        // a picked page lights as the counter passes it
        rows.forEach((o) => { if (o.pick) o.r.classList.toggle('on', p > 0 && v >= o.at); });

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the read resolves: the rows dim under the scrim, the chips land over them
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
