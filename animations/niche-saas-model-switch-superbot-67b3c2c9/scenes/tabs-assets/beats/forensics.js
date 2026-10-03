// Forensics beat: Gemini reads the billing history and the code behind it. Its line streams and a compact superbot
// card rises (the github sibling's repo-card grammar: a counter with its bar, rows that resolve, a footer). The card is
// superbot's own, not a copy of Stripe's UI: "Reading N Stripe events and 63 cancellations" ticks up to 2,318 with
// its thin bar, then three findings resolve as rows (file glyph, mono path, one tag, the finding); the first, the
// root cause at src/billing/webhooks.ts:88, carries the highlight. The footer lands: "41 of 63 cancellations started
// as a declined card". Every name, path and number is made up for the spot. Pure function of t: every moving value is
// written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { oct } from './glyphs.js?v=67b3c2c9';

const SAY = 'Read your Stripe events, the cancellations and the billing code.';
const EVENTS = 2318, CANCELS = 63;
// the findings: [path, finding, tag, highlighted]
const FINDINGS = [
  ['src/billing/webhooks.ts:88', 'Cancels the subscription on the first failed renewal', 'Root cause', true],
  ['exports/stripe-events.json', 'Declined renewals were never retried', 'Retries', false],
  ['src/emails/', 'No email asks the customer to update their card', 'Gap', false],
];
const DONE = '41 of 63 cancellations started as a declined card';
// timing (seconds from the reply start, or from the card where noted), the github sibling's repo-beat pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.16;                 // the card landing to the counter starting
const COUNT = 0.9; /* deliberate */    // the counter running up to 2,318 (its bar fills with it)
const ROW_AT = 0.36;                   // the counter starting to the first finding
const STAGGER = 0.16;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.26;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const HOLD = 0.35; /* deliberate */    // the settled card reads before the next pill

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fx-card">
      <div class="fx-ch"><span class="fx-st"><i class="fx-spin"></i>${x.OK}</span><b>Reading <span class="fx-n">0</span> Stripe events and ${CANCELS} cancellations</b></div>
      <i class="fx-cbar"><i></i></i>
      <div class="fx-list">${FINDINGS.map(([path, text, tag, hi]) => `<div class="fx-row${hi ? ' fx-hi' : ''}">${oct('file', 'fx-fi')}
        <div class="fx-main"><span class="fx-r1"><code>${x.esc(path)}</code><span class="fx-tag">${x.esc(tag)}</span></span><span class="fx-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="fx-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.fx-spin'), ok: $('.fx-st .qc-ok') };
    const cbar = $('.fx-cbar i'), n = $('.fx-n'), ft = $('.fx-ft');
    const rows = [...card.querySelectorAll('.fx-row')];
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

        // the event counter and its bar
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(EVENTS * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
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
