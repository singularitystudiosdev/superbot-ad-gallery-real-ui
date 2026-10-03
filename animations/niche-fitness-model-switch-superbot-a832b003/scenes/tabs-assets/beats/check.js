// Check beat: GPT-6 Astra checks the plan before anything is synced. Its line streams and a card rises (the Shopify
// fork's check card: a header with the status spinner, lines that land one by one with green check glyphs, then the
// run's chips, then the tally), with a weekly miles chart on top: the plan's 12 week totals as bars that grow in
// sequence (the cutback weeks 4 and 8 in a dimmer tone, the taper weeks 11 and 12 under a "Taper" bracket, week 9
// labelled "Peak 24 mi"). Every bar, the peak and the chips are counted from the plan itself (code.js PLAN, the rule
// src/plan.ts runs), never typed. Then the four checks tick, the chips land and the tally: "Plan checked, ready to sync".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic } from '../../../lib.js';
import { PLAN } from './code.js?v=a832b003';

const SAY = 'Checked the plan for one hard day a week, cutbacks and a proper taper.';
const LABEL = 'Checking your plan';
const WEEKS = PLAN.map((w) => +w.reduce((a, r) => a + r.miles, 0).toFixed(1)); // 16 17 18 15 19 20 22 18 24 22 18 21.1
const MILES = Math.round(WEEKS.reduce((a, b) => a + b, 0));                     // 230
const WORKOUTS = PLAN.flat().length;                                            // 48
const PEAK = Math.max(...WEEKS), PEAK_I = WEEKS.indexOf(PEAK);                  // 24, week 9
const CUTBACK = [3, 7], TAPER = [10, 11];                                       // weeks 4 and 8, 11 and 12 (0-based)
const LONG_PEAK = Math.max(...PLAN.flat().filter((r) => r.name === 'Long Run').map((r) => r.miles)); // 12
// the checks: [what was checked, its value]
const CHECKS = [
  ['One hard workout a week, rest the day after', `${PLAN.length} of ${PLAN.length}`],
  [`Long run peaks at ${LONG_PEAK} mi`, `Week ${PEAK_I + 1}`],
  ['Cutback weeks', `${CUTBACK[0] + 1} and ${CUTBACK[1] + 1}`],
  ['2 week taper into race day', `${TAPER[0] + 1} and ${TAPER[1] + 1}`],
];
const CHIPS = [`${WORKOUTS} workouts`, `${MILES} mi total`, `Peak week ${PEAK} mi`];
const DONE = 'Plan checked, ready to sync';
// timing (seconds from the reply start, or from the card where noted), in the base's query pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const BAR_AT = 0.12;                   // the card landing to the first bar growing
const BAR_STEP = 0.04;                 // one bar to the next
const BAR_IN = 0.26;                   // a bar growing
const LINE_AT = 0.08;                  // the last bar up to the first check line
const LINE = 0.14;                     // one check line to the next
const LINE_IN = 0.18;                  // a line landing
const TICK_AT = 0.1;                   // a line landed to its check glyph and value popping in
const CHIPS_AT = 0.08;                 // the last line in, then the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const CHART_H = 60;                    // the tallest bar (the peak), px

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.bars = WEEKS.map((_, i) => T.card + BAR_AT + i * BAR_STEP);
    const up = T.bars[WEEKS.length - 1] + BAR_IN;
    T.lines = CHECKS.map((_, i) => up + LINE_AT + i * LINE);
    const last = T.lines[CHECKS.length - 1] + TICK_AT + LINE_IN;
    T.last = last;
    T.chips = CHIPS.map((_, i) => last + CHIPS_AT + i * STAGGER);
    T.foot = T.chips[CHIPS.length - 1] + CHIP_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const bar = (v, i) => {
      const cls = i === PEAK_I ? ' ck-peak' : CUTBACK.includes(i) ? ' ck-cut' : TAPER.includes(i) ? ' ck-tap' : '';
      return `<span class="ck-col${cls}"><i class="ck-bar" style="height: ${((v / PEAK) * CHART_H).toFixed(2)}px"></i><small>${i + 1}</small></span>`;
    };
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="ck-tag">Weekly miles</span></div>
      <div class="ck-chart">
        <div class="ck-bars">${WEEKS.map(bar).join('')}
          <span class="ck-pk" style="--i: ${PEAK_I}">Peak ${PEAK} mi</span>
          <span class="ck-tp" style="--i: ${TAPER[0]}"><b>Taper</b></span>
        </div>
        <div class="ck-key"><span><i class="ck-sw"></i>Week</span><span><i class="ck-sw ck-sw-cut"></i>Cutback</span></div>
      </div>
      <div class="ck-well">${CHECKS.map(([text, n]) => `<div class="ck-ln"><span class="ck-g"><i class="ck-dot"></i>${x.OK}</span><span class="ck-tx">${x.esc(text)}</span><em>${x.esc(n)}</em></div>`).join('')}</div>
      <div class="ck-chips">${CHIPS.map((c) => `<span class="ck-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="ck-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const bars = [...card.querySelectorAll('.ck-bar')];
    const pk = card.querySelector('.ck-pk'), tp = card.querySelector('.ck-tp'), key = card.querySelector('.ck-key');
    const rows = [...card.querySelectorAll('.ck-ln')].map((n) => ({ n, dot: n.querySelector('.ck-dot'), ok: n.querySelector('.qc-ok'), em: n.querySelector('em') }));
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const chips = [...card.querySelectorAll('.ck-chip')];
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // a label landing: p is its 0..1 progress
    const fade = (n, p0, dy, base = '') => {
      const p = outCubic(p0);
      n.style.opacity = p.toFixed(3);
      n.style.transform = `${base} translateY(${((1 - p) * dy).toFixed(2)}px)`.trim();
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[1], rows[1].n], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the chart: each week's bar grows from the baseline in turn; the peak's label and the taper bracket land
        // as their bars top out
        bars.forEach((b, i) => {
          const g = outCubic(seg(t, T.bars[i], T.bars[i] + BAR_IN));
          b.style.transform = `scaleY(${g.toFixed(4)})`;
        });
        fade(pk, seg(t, T.bars[PEAK_I] + BAR_IN * 0.6, T.bars[PEAK_I] + BAR_IN * 0.6 + 0.2), 4, 'translateX(-100%)');
        fade(tp, seg(t, T.bars[TAPER[1]] + BAR_IN * 0.6, T.bars[TAPER[1]] + BAR_IN * 0.6 + 0.2), 4);
        key.style.opacity = outCubic(seg(t, T.card + 0.1, T.card + 0.4)).toFixed(3);

        // each check: the line lands with a pending dot, then the dot gives way to the green check and the value
        rows.forEach((o, i) => {
          const a = T.lines[i];
          const p = outCubic(seg(t, a, a + LINE_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          const q = outCubic(seg(t, a + TICK_AT, a + TICK_AT + LINE_IN));
          o.dot.style.opacity = (1 - q).toFixed(3);
          o.ok.style.opacity = q.toFixed(3);
          o.ok.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.4, 1, q).toFixed(4)})`;
          o.em.style.opacity = q.toFixed(3);
        });
        // the header's status: spinning while the checks run, the check once the last one is in
        const d = outCubic(seg(t, T.last, T.last + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.last - 0.08, T.last + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.chips[i], T.chips[i] + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
