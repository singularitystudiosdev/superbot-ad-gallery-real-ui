// Check beat: GPT-6 Astra does the plan's math before anything is synced. Its line streams and a card rises across the
// full 640 px column: a header (status spinner resolving to the check), then the weekly mileage chart (12 bars stacked
// by intensity from each week's segs, the ramp % over the last full week above each bar, cutback and taper markers in
// place of a ramp, the peak called out), then two columns: the pace ladder (the goal time over 13.1 mi gives race pace,
// and every zone from ZONES as a band on one shared pace axis, slower left, faster right) beside five checks that tick
// with their proof values, then the run's chips and the tally: "Plan checked, ready to sync". Every number on the card
// is computed from plan-data.js, never typed. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic } from '../../../lib.js';
import { PLAN, ALL, GOAL, RACE_MI, PACES, ZONES, CUTBACK, TAPER, WEEKS, MILES, PEAK, LONG_PEAK, RACE, RAMP, MAX_RAMP,
  EASY_SHARE, md } from './plan-data.js?v=69889d8f';

const SAY = `Set your paces from a ${GOAL.replace(/:00$/, '')} goal and checked every week of mileage.`;
const LABEL = 'Checking your plan';
const TAG = `Half marathon, ${PLAN.length} weeks`;

// the chart: each week's miles split by intensity from its segs (bottom to top: easy, tempo, intervals, race)
const EASY_Z = new Set(['wu', 'easy', 'jog', 'cd']);
const STACK = ['easy', 'tempo', 'int', 'race'];
const SPLIT = PLAN.map((w) => {
  const s = { easy: 0, tempo: 0, int: 0, race: 0 };
  w.forEach((r) => r.segs.forEach((g) => { s[EASY_Z.has(g.z) ? 'easy' : g.z] += g.mi; }));
  return s;
});
const PEAK_I = WEEKS.indexOf(PEAK);                                                   // week 9 (0-based 8)
const CUT_I = CUTBACK.map((w) => w - 1), TAPER_I = TAPER.map((w) => w - 1);
const pct = (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

// the pace ladder: one shared axis in seconds per mile, slower on the left
const sec = (s) => s.split(':').reduce((a, n) => a * 60 + Number(n), 0);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const AX_SLOW = 640, AX_FAST = 440;                                                   // 10:40 to 7:20 per mile
const AX_TICKS = [600, 540, 480];                                                     // 10:00, 9:00, 8:00
const at = (s) => ((AX_SLOW - s) / (AX_SLOW - AX_FAST)) * 100;
const DERIVE = `${GOAL} over ${RACE_MI} mi = ${PACES.race}/mi`;

// the checks: [what was checked, its proof from the plan]
const MAX_I = RAMP.indexOf(MAX_RAMP);
const drop = (i) => `${Math.round((WEEKS[i] / WEEKS[i - 1] - 1) * 100)}%`;
const LONG_WK = ALL.find((r) => r.name === 'Long Run' && r.miles === LONG_PEAK).week;
const CHECKS = [
  ['Weekly ramp never above 10%', `${pct(MAX_RAMP)}, wk ${MAX_I + 1}`],
  [`Cutbacks in weeks ${CUTBACK.join(' and ')}`, CUT_I.map(drop).join(', ')],
  [`Long run peaks at ${LONG_PEAK} mi`, `Wk ${LONG_WK}`],
  ['Training miles at easy effort', `${EASY_SHARE}%`],
  [`${TAPER.length} week taper into race day`, `Race ${md(RACE.date)}`],
];
const CHIPS = [`${ALL.length} workouts`, `${MILES} mi total`, `Peak week ${PEAK} mi`];
const DONE = 'Plan checked, ready to sync';

// timing (seconds from the reply start, or from the card where noted), in the base's query pace
const DUR = 2.504;                     // the beat's length (the timing contract): reply start to the footer landed
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const BAR_AT = 0.1;                    // the card to the first bar growing
const BAR_STEP = 0.035;                // one bar to the next
const BAR_IN = 0.26;                   // a bar growing
const LAD_AT = 0.22;                   // the card to the first pace row
const LAD_STEP = 0.08;                 // one pace row to the next
const ROW_IN = 0.22;                   // a row landing
const BAND_AT = 0.06;                  // a row to its band growing
const BAND_IN = 0.3;                   // a band growing
const LINE_AT = 0.98;                  // reply start to the first check line
const LINE = 0.15;                     // one check line to the next
const LINE_IN = 0.18;                  // a line landing
const TICK_AT = 0.1;                   // a line landed to its check glyph and value popping in
const CHIPS_AT = 0.02;                 // the last check in, then the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_IN = 0.24;                  // the footer rising in (it lands on the beat's last frame)
const BAR_H = 56;                      // the tallest bar (the peak), px

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.bars = WEEKS.map((_, i) => T.card + BAR_AT + i * BAR_STEP);
    T.rows = ZONES.map((_, i) => T.card + LAD_AT + i * LAD_STEP);
    T.lines = CHECKS.map((_, i) => r + LINE_AT + i * LINE);
    T.last = T.lines[CHECKS.length - 1] + TICK_AT + LINE_IN;
    T.chips = CHIPS.map((_, i) => T.last + CHIPS_AT + i * STAGGER);
    T.end = r + DUR;
    T.foot = T.end - FOOT_IN;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const h = (mi) => (mi / PEAK) * BAR_H;
    const col = (s, i) => {
      const segs = STACK.filter((z) => s[z] > 0).map((z) => `<i class="ck-sg ck-z-${z}" style="height: ${h(s[z]).toFixed(2)}px"></i>`).join('');
      const top = h(WEEKS[i]) + 3;
      let lab = '';
      if (i === PEAK_I) lab = `<span class="ck-lb ck-lb-pk" style="bottom: ${top.toFixed(1)}px"><b>Peak ${PEAK} mi</b>${pct(RAMP[i])}</span>`;
      else if (RAMP[i] !== null) lab = `<span class="ck-lb${i === MAX_I ? ' ck-lb-max' : ''}" style="bottom: ${top.toFixed(1)}px">${pct(RAMP[i])}</span>`;
      else if (CUT_I.includes(i)) lab = `<span class="ck-lb ck-lb-q" style="bottom: ${top.toFixed(1)}px">Cutback</span>`;
      return `<span class="ck-col${i === PEAK_I ? ' ck-peak' : ''}"><span class="ck-plot"><i class="ck-bar">${segs}</i>${lab}</span><small>${i + 1}</small></span>`;
    };
    const tpTop = Math.max(...TAPER_I.map((i) => h(WEEKS[i]))) + 3;
    const rung = (z) => {
      const lo = sec(z.lo), hi = sec(z.hi);
      const band = lo === hi
        ? `<i class="ck-band ck-dot-p ck-z-${z.key}" style="left: ${at(lo).toFixed(2)}%"></i>`
        : `<i class="ck-band ck-z-${z.key}" style="left: ${at(lo).toFixed(2)}%; width: ${(at(hi) - at(lo)).toFixed(2)}%"></i>`;
      const range = lo === hi ? `${z.lo}/mi` : `${z.lo} to ${z.hi}/mi`;
      return `<div class="ck-rung"><div class="ck-rl"><b>${x.esc(z.name)}</b><span>${x.esc(z.use)}</span><em>${range}</em></div><div class="ck-trk">${band}</div></div>`;
    };
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="ck-tag">${x.esc(TAG)}</span></div>
      <div class="ck-chart">
        <div class="ck-ch"><span>Weekly miles, % over the last full week</span><span class="ck-key">${
          [['easy', 'Easy'], ['tempo', 'Tempo'], ['int', 'Intervals'], ['race', 'Race pace']].map(([z, n]) => `<span><i class="ck-sw ck-z-${z}"></i>${n}</span>`).join('')}</span></div>
        <div class="ck-bars">${SPLIT.map(col).join('')}
          <span class="ck-tp" style="--i: ${TAPER_I[0]}; bottom: ${(tpTop + 16).toFixed(1)}px"><b>Taper</b></span>
        </div>
      </div>
      <div class="ck-low">
        <div class="ck-pace">
          <div class="ck-sh ck-dv">${x.esc(DERIVE)}</div>
          ${ZONES.map(rung).join('')}
          <div class="ck-ax"><span style="left: 0">Slower</span>${AX_TICKS.map((s) => `<span class="ck-tk" style="left: ${at(s).toFixed(2)}%">${mmss(s)}</span>`).join('')}<span style="right: 0">Faster</span></div>
        </div>
        <div class="ck-checks">
          <div class="ck-sh">Checks</div>
          ${CHECKS.map(([text, n]) => `<div class="ck-ln"><span class="ck-g"><i class="ck-dot"></i>${x.OK}</span><span class="ck-tx">${x.esc(text)}</span><em>${x.esc(n)}</em></div>`).join('')}
        </div>
      </div>
      <div class="ck-end">
        <div class="ck-chips">${CHIPS.map((c) => `<span class="ck-chip">${x.esc(c)}</span>`).join('')}</div>
        <div class="ck-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
      </div>
    </div>`);
    const bars = [...card.querySelectorAll('.ck-bar')];
    const labs = [...card.querySelectorAll('.ck-col')].map((c) => c.querySelector('.ck-lb'));
    const tp = card.querySelector('.ck-tp'), ch = card.querySelector('.ck-ch');
    const rungs = [...card.querySelectorAll('.ck-rung')].map((n) => ({ n, band: n.querySelector('.ck-band') }));
    const dv = card.querySelector('.ck-dv'), ax = card.querySelector('.ck-ax'), csh = card.querySelector('.ck-checks .ck-sh');
    const rows = [...card.querySelectorAll('.ck-ln')].map((n) => ({ n, dot: n.querySelector('.ck-dot'), ok: n.querySelector('.qc-ok'), em: n.querySelector('em') }));
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const chips = [...card.querySelectorAll('.ck-chip')];
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // a label landing: p is its 0..1 progress
    const fade = (n, p0, dy) => {
      const p = outCubic(p0);
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],   // the whole card fits the fold at rest, so its bottom is the mark
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the chart: each week's stacked bar grows from the baseline in turn; its ramp (or marker) lands as it tops out
        ch.style.opacity = outCubic(seg(t, T.card + 0.08, T.card + 0.38)).toFixed(3);
        bars.forEach((b, i) => {
          const g = outCubic(seg(t, T.bars[i], T.bars[i] + BAR_IN));
          b.style.transform = `scaleY(${g.toFixed(4)})`;
          if (labs[i]) fade(labs[i], seg(t, T.bars[i] + BAR_IN * 0.6, T.bars[i] + BAR_IN * 0.6 + 0.2), 4);
        });
        const tl = T.bars[TAPER_I[1]] + BAR_IN * 0.6;
        fade(tp, seg(t, tl, tl + 0.2), 4);

        // the pace ladder: the derivation line, then each zone's row lands and its band grows on the shared axis
        fade(dv, seg(t, T.rows[0] - 0.06, T.rows[0] + ROW_IN - 0.06), 4);
        rungs.forEach((o, i) => {
          fade(o.n, seg(t, T.rows[i], T.rows[i] + ROW_IN), 4);
          const g = outCubic(seg(t, T.rows[i] + BAND_AT, T.rows[i] + BAND_AT + BAND_IN));
          o.band.style.opacity = g.toFixed(3);
          o.band.style.transform = g >= 1 ? 'none' : `scaleX(${lerp(0.2, 1, g).toFixed(4)})`;
        });
        fade(ax, seg(t, T.rows[ZONES.length - 1], T.rows[ZONES.length - 1] + ROW_IN), 4);

        // each check: the line lands with a pending dot, then the dot gives way to the green check and the proof
        fade(csh, seg(t, T.lines[0] - 0.12, T.lines[0] + 0.1), 4);
        rows.forEach((o, i) => {
          const a = T.lines[i];
          fade(o.n, seg(t, a, a + LINE_IN), 4);
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

        chips.forEach((c, i) => fade(c, seg(t, T.chips[i], T.chips[i] + CHIP_IN), 6));
        fade(ft, seg(t, T.foot, T.foot + FOOT_IN), 6);
      },
    };
  },
};
