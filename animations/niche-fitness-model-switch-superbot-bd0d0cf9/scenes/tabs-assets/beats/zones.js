// Zones beat: GPT-6 Astra does the math on Gemini's baseline. No race date was given, so it says what it picked ("No race
// set, so I aimed at Sun Dec 27, 12 weeks out. A 1:52 half is in reach."); a card rises, the camera pushes in on it
// (T.focus, zoom cut), and three parts land in order: the race prediction (Riegel from the 52:40 best 10K effort:
// 1:56:13 today, goal 1:52:00, both clocks counting down onto their values), the five training paces it derives (Easy, Long
// run, Race pace, Tempo, Intervals, per mile), and the 12-week mileage ramp it sets (one bar per week, cutback and taper
// weeks a lighter shade, the peak labelled). The closing line ticks in. Every number is plan-data.js.
// Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js?v=bd0d0cf9';
import { STRAVA, GOAL, TODAY, PACES, WEEK_MI, PEAK, TAG } from './plan-data.js?v=bd0d0cf9';

const SAY = 'No race set, so I aimed at Sun Dec 27, 12 weeks out. A 1:52 half is in reach.';
const FOOT = `Peak ${PEAK} mi, a cutback every 4th week`;
const secs = (s) => s.split(':').reduce((a, v) => a * 60 + +v, 0);
const clock = (n) => { n = Math.round(n); const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = n % 60; return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
const PRED = [['Half marathon today', `Riegel, from your ${STRAVA.best10k} 10K`, TODAY], ['Goal on Dec 27', 'after 12 weeks', GOAL]];

const CPS = 100;
const CARD = 0.12;
const RISE = 0.3;
const PRED_AT = 0.28;            // reply start to the first prediction row
const PRED_STEP = 0.14;
const PRED_IN = 0.3;             // a row rising in, its clock counting up
const PACE_AT = 0.62;            // reply start to the first pace chip
const PACE_STEP = 0.06;
const PACE_IN = 0.2;
const BAR_AT = 0.92;             // reply start to the first bar
const BAR_STEP = 0.035;
const BAR_IN = 0.26;
const FOOT_AT = 0.08;
const FOOT_IN = 0.24;
const HOLD = 0.5; /* deliberate */  // the finished card holds, readable
const PUSH_AT = 0.12, PUSH = 0.5, PULL = 0.45;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.pred = PRED.map((_, i) => r + PRED_AT + i * PRED_STEP);
    T.pace = PACES.map((_, i) => r + PACE_AT + i * PACE_STEP);
    T.bar = WEEK_MI.map((_, i) => r + BAR_AT + i * BAR_STEP);
    T.peak = T.bar[WEEK_MI.length - 1] + BAR_IN * 0.6;
    T.foot = T.peak + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + 0.05 + SAY.length / CPS) + HOLD;
    if (opts.zoom) {
      T.focus = { sw: r + PUSH_AT, landed: r + PUSH_AT + PUSH, pull: T.end, back: T.end + PULL };
      T.end = T.focus.back;
    }
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const pk = WEEK_MI.indexOf(PEAK);
    const card = x.el(`<div class="zn-card"><div class="zn-sheet">
      <div class="zn-pred">${PRED.map(([a, b, v]) => `<div class="zn-pr"><span class="zn-pl"><b>${x.esc(a)}</b><small>${x.esc(b)}</small></span><span class="zn-pv">${v}</span></div>`).join('')}</div>
      <div class="zn-hd">Your paces <span>per mile</span></div>
      <div class="zn-paces">${PACES.map(([n, p]) => `<span class="zn-pc${n === 'Race pace' ? ' zn-race' : ''}"><small>${x.esc(n)}</small><b>${p}</b></span>`).join('')}</div>
      <div class="zn-hd">Weekly miles <span>12 weeks</span></div>
      <div class="zn-chart">${WEEK_MI.map((m, i) => `<span class="zn-col${TAG[i] && i !== pk ? ' zn-soft' : ''}${i === pk ? ' zn-pk' : ''}"><i class="zn-bar" style="--h:${(m / PEAK).toFixed(4)}"></i>${i === pk ? `<em class="zn-pkl">${PEAK} mi</em>` : ''}<small>${i + 1}</small></span>`).join('')}</div>
    </div><div class="zn-ft">${x.OK}<span>${x.esc(FOOT)}</span></div></div>`);
    const preds = [...card.querySelectorAll('.zn-pr')].map((n, i) => ({ n, v: n.querySelector('.zn-pv'), s: secs(PRED[i][2]), shown: '' }));
    const paces = [...card.querySelectorAll('.zn-pc')];
    const bars = [...card.querySelectorAll('.zn-bar')];
    const pkl = card.querySelector('.zn-pkl'), ft = card.querySelector('.zn-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      focus: card,
      render(t) {
        const ns = streamCount(SAY, T.r + 0.05, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        preds.forEach((o, i) => {
          const p = outCubic(seg(t, T.pred[i], T.pred[i] + PRED_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
          const v = clock(lerp(o.s * 1.06, o.s, p));
          if (v !== o.shown) { o.v.textContent = v; o.shown = v; }
        });
        paces.forEach((n, i) => {
          const p = outCubic(seg(t, T.pace[i], T.pace[i] + PACE_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, p).toFixed(4)})`;
        });
        bars.forEach((b, i) => { b.style.transform = `scaleY(${outCubic(seg(t, T.bar[i], T.bar[i] + BAR_IN)).toFixed(4)})`; });
        const l = outCubic(seg(t, T.peak, T.peak + 0.2));
        pkl.style.opacity = l.toFixed(3);
        pkl.style.transform = `translateY(${((1 - l) * 4).toFixed(2)}px)`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
