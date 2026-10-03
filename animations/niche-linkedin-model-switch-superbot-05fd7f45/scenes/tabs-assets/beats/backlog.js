// Backlog beat: Gemini reads LinkedIn job posts against the resume. Its line streams, a card rises ("Reading LinkedIn
// job posts", a post counter), and inside it a window of job posts ("Title · Company · Location", the fit score in mono
// on the right) scrolls fast while the counter runs up to 412. Posts under 85% fit are dimmed as they pass. The scroll
// settles with Ledgerline (94%) in the middle of the window and it lights up as the best fit; then the read's chips land
// under the window, one by one, the last one the gold "Best fit: Ledgerline 94%".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width. All posts and companies are made up for the spot.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read 412 posts. 21 fit your resume at 85% or better.';
const LABEL = 'Reading LinkedIn job posts';
const TOTAL = 412;
// the posts as they scroll past: [title, company, location, fit %]. The window comes to rest on rows 5..9 with
// Ledgerline (BEST) in its middle row.
const ROWS = [
  ['PM, Checkout', 'Quorvi', 'Remote', 91],
  ['Group PM, Lending', 'Kestrova Bank', 'New York', 71],
  ['Senior PM, Merchant Tools', 'Paywick', 'Remote', 92],
  ['PM, Growth', 'Fieldnote', 'Chicago', 63],
  ['Staff PM, Risk', 'Talloway', 'Remote', 88],
  ['Senior PM, Billing', 'Trelmont Labs', 'Chicago', 90],
  ['PM, Payments', 'Zentrafin', 'Remote', 89],
  ['Senior PM, Payments', 'Ledgerline', 'Chicago, Hybrid', 94],
  ['Lead PM, Payments', 'Orbiq Pay', 'Chicago', 90],
  ['Senior PM, Billing', 'Norvale Software', 'Chicago, Hybrid', 87],
];
const BEST = 7;
const FIT = 85;                        // posts under this fit are dimmed
const CHIPS = ['412 posts read', '21 fit 85% or better'];
const GOLD = 'Best fit: Ledgerline 94%';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the posts scrolling past (the counter runs with it)
const LIGHT = 0.22;                    // settled: the best-fit row lighting up
const CHIPS_AT = 0.86;                 // the card landing to the first chip
const STAGGER = 0.08;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 5;                       // rows visible in the window
const ROW = 24;                        // one row's height, px

const fmt = (n) => n.toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = ([title, co, loc, fit], i) => `<div class="bk-row${fit < FIT ? ' bk-low' : ''}${i === BEST ? ' bk-best' : ''}"><span class="bk-tl"><b>${esc(title)}</b> · ${esc(co)} · ${esc(loc)}</span><span class="bk-fit">${fit}%</span></div>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...CHIPS, GOLD].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bk-card">
      <div class="bk-hd"><span class="bk-st"><i class="bk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="bk-cnt"><b class="bk-n">0</b> posts</span></div>
      <div class="bk-vp">
        <div class="bk-fh"><span>Job post</span><span>Fit</span></div>
        <div class="bk-win"><div class="bk-list">${ROWS.map(line).join('')}</div></div>
      </div>
      <div class="bk-chips">${CHIPS.map((tp) => `<span class="bk-chip">${x.esc(tp)}</span>`).join('')}<span class="bk-chip bk-ready">${x.esc(GOLD)}</span></div>
    </div>`);
    const list = card.querySelector('.bk-list'), n = card.querySelector('.bk-n');
    const best = card.querySelector('.bk-best');
    const chips = [...card.querySelectorAll('.bk-chip')];
    const spin = card.querySelector('.bk-spin'), ok = card.querySelector('.bk-st .qc-ok');
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

        // the scroll: top to the resting window, fast through the middle (a touch of blur at speed), the counter with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = fmt(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check as the counter lands, and the best fit lights up
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        best.style.setProperty('--lit', outCubic(seg(t, T.s1, T.s1 + LIGHT)).toFixed(3));

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
