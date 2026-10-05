// Runs beat: Gemini reads all 41 runs superbot pulled from Strava (the long-context, data-heavy part of the job).
// Its line streams, a card rises ("Reading 41 Strava runs", a "k of 41 read" counter), and inside it the activities
// scroll past fast in Strava's own terms: the activity title (Strava's default "Morning Run" / "Evening Run" names and
// the ones Sam renamed), the date, distance, pace as "10:11 /mi", heart rate. Then the list collapses into "What your
// runs say": five findings with their values, and the closing line ticks in. Every number is plan-data.js STRAVA.
// Pure function of t. Row heights are constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js?v=bd0d0cf9';
import { STRAVA as S, ACTIVITIES } from './plan-data.js?v=bd0d0cf9';

const SAY = `Reading all ${S.runs} runs: pace, heart rate and splits from ${S.miles} miles.`;
const LABEL = `Reading ${S.runs} Strava runs`;
const FOUND = [
  ['Weekly mileage', `${S.avgWeek} mi avg, ${S.peakWeek} peak`],
  ['Longest run', `${S.longest} mi, ${S.longestOn}`],
  ['Easy pace', `${S.easyPace} /mi at ${S.easyHr} bpm`],
  ['Best 10K effort', `${S.best10k}, ${S.best10kOn}`],
  ['Heart rate drifts', `after mile ${S.driftMile}`],
];
const FOOT = `Your baseline, from ${S.miles} miles`;
const CPS = 100;
const SAY_AT = 0.05;
const CARD = 0.14;                     // reply start to the card rising in
const RISE = 0.34;
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */   // the activities scrolling past (the counter runs with it)
const COL_AT = 0.04;
const COL = 0.3;                       // the list collapses under the findings
const LIST_AT = 0.12;
const STAGGER = 0.07;
const ROW_IN = 0.22;
const FOOT_AT = 0.04;
const FOOT_IN = 0.24;
const HOLD = 0.65; /* deliberate */ // the finished baseline holds, readable, before the camera leaves
const SHOWN = 5;                       // activity rows visible in the window
const ROW = 31;                        // one activity row's height, px

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.col = T.s1 + COL_AT;
    T.title = T.col + LIST_AT;
    T.rows = FOUND.map((_, i) => T.title + 0.08 + i * STAGGER);
    T.foot = T.rows[FOUND.length - 1] + ROW_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rn-card">
      <div class="rn-hd"><span class="rn-st"><i class="rn-spin"></i>${x.OK}</span><span class="rn-lb">${x.esc(LABEL)}</span><span class="rn-cnt"><b class="rn-n">0</b> of ${S.runs} read</span></div>
      <div class="rn-vp">
        <div class="rn-list">${ACTIVITIES.map(([name, date, mi, pace, hr]) => `<div class="rn-row"><span class="rn-nm"><b>${x.esc(name)}</b><small>${x.esc(date)}</small></span><span class="rn-sx"><span>${mi.toFixed(1)} mi</span><span>${pace} /mi</span><span>${hr} bpm</span></span></div>`).join('')}</div>
        <div class="rn-top">
          <div class="rn-tt">What your runs say<span>${S.from} to ${S.to}</span></div>
          ${FOUND.map(([q, v]) => `<div class="rn-q"><span class="rn-qt">${x.esc(q)}</span><b class="rn-qv">${x.esc(v)}</b></div>`).join('')}
        </div>
      </div>
      <div class="rn-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const list = card.querySelector('.rn-list'), n = card.querySelector('.rn-n');
    const top = card.querySelector('.rn-top'), tt = card.querySelector('.rn-tt');
    const rows = [...card.querySelectorAll('.rn-q')];
    const ft = card.querySelector('.rn-ft');
    const spin = card.querySelector('.rn-spin'), ok = card.querySelector('.rn-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ACTIVITIES.length - SHOWN) * ROW;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the scroll: newest to oldest, fast through the middle (a touch of blur at speed), the counter running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0;
        const c = inOutCubic(seg(t, T.col, T.col + COL));
        list.style.transform = `translateY(${(-span * e - c * 18).toFixed(2)}px) scale(${lerp(1, 0.92, c).toFixed(4)})`;
        list.style.opacity = (1 - c).toFixed(3);
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : (c > 0 && c < 1 ? `blur(${(c * 2).toFixed(2)}px)` : 'none');
        const cnt = String(Math.round(S.runs * outCubic(p)));
        if (cnt !== count) { n.textContent = cnt; count = cnt; }
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        // the findings: their sheet fades up over the collapsing list, the title, then the rows in order
        top.style.opacity = outCubic(seg(t, T.col + 0.05, T.col + COL)).toFixed(3);
        const ti = outCubic(seg(t, T.title, T.title + 0.22));
        tt.style.opacity = ti.toFixed(3);
        tt.style.transform = ti >= 1 ? 'none' : `translateY(${((1 - ti) * 6).toFixed(2)}px)`;
        rows.forEach((q, i) => {
          const o = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          q.style.opacity = o.toFixed(3);
          q.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 10).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
