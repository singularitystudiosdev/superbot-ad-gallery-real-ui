// Query beat: Perplexity checks the best fits against the companies' careers pages and the news. Its line streams, a
// card rises (the backlog card's frame: a status spinner, "Checked 21 listings against careers pages and news", a
// "64 sources" chip), and the result table lands row by row under Company | Role | On careers page | Signal | Verdict.
// Each row's verdict pops in just after it: Real is a green pill with a check; Ghost is a red pill and the row strikes
// through softly. Then the summary chips land: green "12 real", red "9 ghost". On a narrow column (4:5) Company and
// Role stack in one cell and the Signal wraps, so every column stays legible.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. The table is laid
// out whole from the start (rows hidden until they land), so nothing reflows. All companies are made up for the spot.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = '9 of the 21 are ghost listings. 12 are real and hiring now.';
const LABEL = 'Checked 21 listings against careers pages and news';
const META = '64 sources';
const HEAD = ['Company', 'Role', 'On careers page', 'Signal', 'Verdict'];
// [company, role, on the careers page, signal, real?]
const ROWS = [
  ['Ledgerline', 'Senior PM, Payments', 'Yes', 'Posted 3 days ago', true],
  ['Quorvi', 'PM, Checkout', 'No', 'Reposted 6 times since May', false],
  ['Paywick', 'Senior PM, Merchant Tools', 'Yes', 'Posted 1 week ago', true],
  ['Trelmont Labs', 'Senior PM, Billing', 'Yes', 'Hiring freeze reported Sep 12', false],
  ['Orbiq Pay', 'Lead PM, Payments', 'Yes', 'Posted 5 days ago', true],
  ['Zentrafin', 'PM, Payments', 'No', 'Not on careers page since March', false],
  ['Talloway', 'Staff PM, Risk', 'Yes', 'Posted 2 days ago', true],
];
const CHIPS = [['12 real', 'dq-real'], ['9 ghost', 'dq-ghost']];
// timing (seconds from the reply start, or from the card where noted), in the backlog beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROWS_AT = 0.3;                   // the card landing to the first row
const ROW_STAGGER = 0.1;               // one row to the next
const ROW_IN = 0.18;                   // a row landing
const VERDICT_AT = 0.12;               // a row landed, then its verdict pill pops
const POP = 0.2;                       // a verdict pill popping in
const STRIKE = 0.22;                   // a ghost row's strike drawing across
const CHIPS_AT = 0.12;                 // the last verdict in, then the first chip
const STAGGER = 0.08;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const XX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROWS.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    T.verdict = T.rows.map((a) => a + VERDICT_AT);
    T.done = T.verdict[T.verdict.length - 1] + POP;   // every verdict is in: the spinner resolves to the check
    T.chip = CHIPS.map((_, i) => T.done + CHIPS_AT + i * STAGGER);
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, T.verdict[T.verdict.length - 1] + STRIKE, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="dq-card">
      <div class="dq-hd"><span class="dq-st"><i class="dq-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="dq-meta"><i class="dq-src"><s></s><s></s><s></s></i>${x.esc(META)}</span></div>
      <div class="dq-res">
        <div class="dq-rh">${HEAD.map((h, i) => `<span class="dq-c${i}">${esc(h)}</span>`).join('')}</div>
        ${ROWS.map(([co, role, on, sig, real]) => `<div class="dq-row${real ? '' : ' dq-gh'}">
          <span class="dq-c0"><b>${esc(co)}</b><small>${esc(role)}</small></span><span class="dq-c1">${esc(role)}</span>
          <span class="dq-c2 ${on === 'Yes' ? 'dq-yes' : 'dq-no'}">${on}</span><span class="dq-c3">${esc(sig)}</span>
          <span class="dq-c4"><em class="dq-v ${real ? 'dq-vr' : 'dq-vg'}">${real ? CK : XX}${real ? 'Real' : 'Ghost'}</em></span>
          <i class="dq-strike"></i></div>`).join('')}
      </div>
      <div class="dq-chips">${CHIPS.map(([c, cls]) => `<span class="dq-chip ${cls}">${x.esc(c)}</span>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.dq-row')].map((n) => ({ n, v: n.querySelector('.dq-v'), s: n.querySelector('.dq-strike'), gh: n.classList.contains('dq-gh') }));
    const chips = [...card.querySelectorAll('.dq-chip')];
    const spin = card.querySelector('.dq-spin'), ok = card.querySelector('.dq-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1;
    // narrow column (4:5): Company and Role stack, the Signal wraps (a width class, as write.js does)
    const sizeCls = (w) => { if (w > 0) card.classList.toggle('dq-narrow', w < 560); };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the rows land, each verdict pops after it, and a ghost row strikes through and dims
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          o.n.style.opacity = q.toFixed(3);
          o.n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
          const v = outCubic(seg(t, T.verdict[i], T.verdict[i] + POP));
          o.v.style.opacity = v.toFixed(3);
          o.v.style.transform = v >= 1 ? 'none' : `scale(${lerp(0.6, 1, v).toFixed(4)})`;
          if (o.gh) {
            const s = outCubic(seg(t, T.verdict[i], T.verdict[i] + STRIKE));
            o.s.style.transform = `scaleX(${s.toFixed(4)})`;
            o.n.style.setProperty('--gh', s.toFixed(3));
          }
        });

        // done: the spinner resolves to the check as the last verdict lands
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
