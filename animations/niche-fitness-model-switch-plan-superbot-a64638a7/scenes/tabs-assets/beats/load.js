// GPT-6 Astra's beat: checks the written plan is safe to run before it goes on the calendar. One chart: each week's
// miles as bars, and the acute:chronic load ratio (this week over the mean of up to four weeks before it) as a line
// that has to stay inside the 0.8 to 1.3 band, the range injury-risk studies treat as safe. Then five checks, each
// with the number that passes it, the plan's totals as chips and the go-ahead. Every number is computed from plan-data.js.
import { seg, outCubic } from '../../../lib.js';
import { WEEKS, ACWR, ACWR_BAND, ACWR_MAX, EASY_SHARE, LONGS, CUTBACK, TAPER_DROP, PEAK, PEAK_I, TOTAL_MI, ALL, RACE, md } from './plan-data.js?v=a64638a7';

const SAY = `Checked the load week by week: no spikes, ${EASY_SHARE}% of miles easy, and a real taper before race day.`;
const TITLE = 'Checking the training load';
const TAG = 'Week by week';
const DONE = 'Load checked, safe to put on your calendar';
const longMax = Math.max(...LONGS.slice(0, 11));
const CHECKS = [
  [`Load ratio stays in ${ACWR_BAND[0]} to ${ACWR_BAND[1]}`, `max ${ACWR_MAX[0].toFixed(2)}, wk ${ACWR_MAX[1] + 1}`],
  ['Mostly easy, the 80/20 rule', `${EASY_SHARE}% easy`],
  ['Long run grows 1 mi at a time', `${LONGS[0]} to ${longMax} mi`],
  ['A cutback week every 4th week', CUTBACK.map((w) => `wk ${w + 1}`).join(', ')],
  ['Taper before race day', `-${'' + TAPER_DROP}% in wk 11`],
];
const CHIPS = [`${ALL.length} workouts`, `${TOTAL_MI} mi`, `Peak ${PEAK} mi, wk ${PEAK_I + 1}`, `Race ${md(RACE.date)}`];

// chart geometry (svg user units; the svg scales uniformly to the card)
const W = 480, H = 124, X0 = 24, X1 = 450, Y0 = 18, Y1 = 100;
const CW = (X1 - X0) / 12;
const MI_TOP = 26, R_LO = 0.6, R_HI = 1.5;
const xw = (i) => X0 + CW * (i + 0.5);
const ym = (v) => Y1 - (v / MI_TOP) * (Y1 - Y0);
const yr = (v) => Y1 - ((v - R_LO) / (R_HI - R_LO)) * (Y1 - Y0);
const PTS = ACWR.map((v, i) => (v === null ? null : [xw(i), yr(v), v, i])).filter(Boolean);

// timing (seconds), card-relative
const CARD_AT = 0.144, CARD_IN = 0.36;
const SAY_AT = 0.04, CPS = 106.25;
const BAR_AT = 0.12, BAR_GAP = 0.04, BAR_IN = 0.26;
const BAND_AT = 0.3, BAND_IN = 0.2;
const LINE_AT = 0.5, LINE_IN = 0.55;
const CHK_AT = 0.86, CHK_GAP = 0.12, CHK_IN = 0.18;
const CHIP_AT = 1.5, CHIP_GAP = 0.06, CHIP_IN = 0.22;
const FOOT_IN = 0.24, HOLD = 0.16; /* deliberate */

function rise(n, p, dy = 8) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

function chart() {
  const bars = WEEKS.map((v, i) => `<rect class="ld-b${i === PEAK_I ? ' ld-bp' : ''}" x="${(xw(i) - 7).toFixed(1)}" y="${ym(v).toFixed(1)}" width="14" height="${(Y1 - ym(v)).toFixed(1)}" rx="2"/>`).join('');
  const wk = WEEKS.map((_, i) => `<text class="ld-wk" x="${xw(i).toFixed(1)}" y="${H - 10}">W${i + 1}</text>`).join('');
  const band = `<g class="ld-band"><rect x="${X0}" y="${yr(ACWR_BAND[1]).toFixed(1)}" width="${X1 - X0}" height="${(yr(ACWR_BAND[0]) - yr(ACWR_BAND[1])).toFixed(1)}" fill="rgba(52,211,153,0.09)"/>
    <line x1="${X0}" x2="${X1}" y1="${yr(ACWR_BAND[1]).toFixed(1)}" y2="${yr(ACWR_BAND[1]).toFixed(1)}" stroke="rgba(52,211,153,0.5)" stroke-dasharray="3 3"/>
    <line x1="${X0}" x2="${X1}" y1="${yr(ACWR_BAND[0]).toFixed(1)}" y2="${yr(ACWR_BAND[0]).toFixed(1)}" stroke="rgba(52,211,153,0.5)" stroke-dasharray="3 3"/>
    <text class="ld-ax ld-axr" x="${X1 + 6}" y="${(yr(ACWR_BAND[1]) + 3).toFixed(1)}">${ACWR_BAND[1]}</text>
    <text class="ld-ax ld-axr" x="${X1 + 6}" y="${(yr(1) + 3).toFixed(1)}">1.0</text>
    <text class="ld-ax ld-axr" x="${X1 + 6}" y="${(yr(ACWR_BAND[0]) + 3).toFixed(1)}">${ACWR_BAND[0]}</text>
    <text class="ld-safe" x="${X0 + 4}" y="${(yr(ACWR_BAND[1]) + 10).toFixed(1)}">Safe range</text></g>`;
  const axl = [10, 20].map((v) => `<line x1="${X0}" x2="${X1}" y1="${ym(v).toFixed(1)}" y2="${ym(v).toFixed(1)}" stroke="#1f1f23"/><text class="ld-ax" x="${X0 - 5}" y="${(ym(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const path = PTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const dots = PTS.map(([x, y, , i]) => `<circle class="ld-pt" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"/>`).join('');
  const [mv, mi] = ACWR_MAX;
  const call = `<g class="ld-call"><text x="${xw(mi).toFixed(1)}" y="${(yr(mv) - 8).toFixed(1)}">${mv.toFixed(2)} max</text></g>`;
  const legend = `<g class="ld-lg"><rect x="${X0}" y="2" width="9" height="9" rx="2" fill="#34343c"/><text x="${X0 + 14}" y="10">Weekly miles</text>
    <line x1="${X0 + 92}" x2="${X0 + 108}" y1="6.5" y2="6.5" stroke="#34d399" stroke-width="2"/><text x="${X0 + 113}" y="10">Load ratio, this week vs the 4 before</text></g>`;
  return `<svg class="ld-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${legend}${axl}${band}${bars}
    <path class="ld-line" d="${path}" pathLength="1" fill="none" stroke="#34d399" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${call}${wk}</svg>`;
}

export default {
  times(r) {
    const T = { r, card: r + CARD_AT };
    const c = T.card;
    T.bars = WEEKS.map((_, i) => c + BAR_AT + i * BAR_GAP);
    T.band = c + BAND_AT;
    T.line = c + LINE_AT;
    T.chk = CHECKS.map((_, i) => c + CHK_AT + i * CHK_GAP);
    T.done = T.chk[T.chk.length - 1] + CHK_IN;
    T.chips = CHIPS.map((_, i) => c + CHIP_AT + i * CHIP_GAP);
    T.foot = T.chips[T.chips.length - 1] + 0.1;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild;
    const card = x.el(`<div class="ld-card">
      <div class="ld-hd"><span class="ld-st"><i class="ld-spin"></i>${x.OK}</span><b>${TITLE}</b><span class="ld-tag">${TAG}</span></div>
      <div class="ld-well ld-cw">${chart()}</div>
      <div class="ld-well ld-list">${CHECKS.map(([text, v]) => `<div class="ld-ln"><span class="ld-g"><i class="ld-dot"></i>${x.OK}</span><span class="ld-tx">${x.esc(text)}</span><em>${x.esc(v)}</em></div>`).join('')}</div>
      <div class="ld-chips">${CHIPS.map((c) => `<span class="ld-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="ld-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ld-st .ld-spin'), ok: $('.ld-st .qc-ok') };
    const bars = [...card.querySelectorAll('.ld-b')];
    const band = $('.ld-band'), line = $('.ld-line'), call = $('.ld-call');
    const pts = [...card.querySelectorAll('.ld-pt')];
    const wks = [...card.querySelectorAll('.ld-wk')];
    const rows = [...card.querySelectorAll('.ld-ln')].map((n) => ({ n, dot: n.querySelector('.ld-dot'), ok: n.querySelector('.qc-ok'), em: n.querySelector('em') }));
    const chips = [...card.querySelectorAll('.ld-chip')];
    const ft = $('.ld-ft');
    bars.forEach((b) => { b.style.transformBox = 'fill-box'; b.style.transformOrigin = 'center bottom'; });
    let said = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const n = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (n !== said) { vis.textContent = SAY.slice(0, n); said = n; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 10);
        const done = t >= T.done;
        st.spin.style.opacity = done ? '0' : '1';
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = outCubic(seg(t, T.done, T.done + 0.16)).toFixed(3);
        bars.forEach((b, i) => {
          const p = outCubic(seg(t, T.bars[i], T.bars[i] + BAR_IN));
          b.style.transform = `scaleY(${p.toFixed(3)})`;
          wks[i].style.opacity = p.toFixed(3);
        });
        band.style.opacity = outCubic(seg(t, T.band, T.band + BAND_IN)).toFixed(3);
        const lp = outCubic(seg(t, T.line, T.line + LINE_IN));
        line.style.strokeDasharray = '1 1';
        line.style.strokeDashoffset = (1 - lp).toFixed(4);
        line.style.opacity = lp > 0 ? '1' : '0';
        pts.forEach((p, j) => { p.style.opacity = lp * (PTS.length - 1) >= j - 0.001 ? '1' : '0'; });
        call.style.opacity = seg(t, T.line + LINE_IN, T.line + LINE_IN + 0.16).toFixed(3);
        rows.forEach((o, i) => {
          const a = T.chk[i];
          const p = seg(t, a - 0.1, a + CHK_IN);
          o.n.style.opacity = (t >= a - 0.1 ? 1 : 0.32).toFixed(2);
          o.dot.style.opacity = (1 - seg(t, a, a + 0.1)).toFixed(3);
          o.ok.style.opacity = outCubic(seg(t, a, a + CHK_IN)).toFixed(3);
          o.em.style.opacity = outCubic(p).toFixed(3);
        });
        chips.forEach((c, i) => rise(c, seg(t, T.chips[i], T.chips[i] + CHIP_IN), 4));
        rise(ft, seg(t, T.foot, T.foot + FOOT_IN), 4);
      },
    };
  },
};
