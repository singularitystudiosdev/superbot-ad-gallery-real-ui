// Plan beat: Claude Opus 5.5 writes the plan, the writing part of the job. Its line streams ("Writing your 12 weeks:
// 48 runs, each with its paces."), a document card rises ("Half Marathon Plan", "k of 48 written") and the camera
// pushes in on it (T.focus, scenes/tabs.js FOCUS) so the words are readable. Week 1 is written row by row (date, the
// session, how to run it at its distance), then the writing speeds up and the doc follows the write head down through
// weeks 2 to 12: every row appears as it is written, the counter running to 48, and the race row (Sun Dec 27, Half
// Marathon) lands tinted. The camera pulls back. Every session, date and total comes from plan-data.js PLAN.
// Pure function of t. Row and header heights are constants, so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js?v=bd0d0cf9';
import { PLAN, SESSIONS, WEEK_MI, note, TAG, RACE, md } from './plan-data.js?v=bd0d0cf9';

const SAY = 'Writing your 12 weeks: 48 runs, each with its paces.';
const N = SESSIONS.length;
const HEAD = 25, ROW = 21, VP = 160;  // px: a week header, a session row, the doc's window
const day = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });

const CPS = 100;
const CARD = 0.1;
const RISE = 0.3;
const PUSH_AT = 0.32, PUSH = 0.5;      // reply start to the push starting (week 1 already writing), and its length
const W1_AT = 0.5;                     // reply start to week 1's first row
const W1_STEP = 0.15;                  // week 1: one row to the next (written)
const FAST = 0.78; /* deliberate */     // weeks 2 to 12 written as the doc follows
const RACE_IN = 0.2;
const HOLD = 0.3;                      // parked on the finished doc
const PULL = 0.45;

// each row's top in the doc (week headers interleaved), and the bottom of row j
const TOPS = [];
let y = 0;
PLAN.forEach((w) => { y += HEAD; w.forEach(() => { TOPS.push(y); y += ROW; }); });
const DOC_H = y + 6;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.w1 = [0, 1, 2, 3].map((i) => r + W1_AT + i * W1_STEP);
    T.f0 = T.w1[3] + 0.12;               // the writing speeds up
    T.f1 = T.f0 + FAST;                  // the race row is written
    T.race = T.f1;
    T.end = T.race + RACE_IN + HOLD;
    if (opts.zoom) {
      T.focus = { sw: r + PUSH_AT, landed: r + PUSH_AT + PUSH, pull: T.end, back: T.end + PULL };
      T.end = T.focus.back;
    }
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rowsHtml = PLAN.map((w, i) => `<div class="pl-wk" style="top:${(TOPS[i * 4] - HEAD).toFixed(0)}px"><b>Week ${i + 1}</b><span>${WEEK_MI[i]} mi</span>${TAG[i] ? `<i>${TAG[i]}</i>` : ''}</div>${w.map((s, j) => `<div class="pl-row${s === RACE ? ' pl-race' : ''}" style="top:${TOPS[i * 4 + j]}px"><span class="pl-d">${day(s.date)} ${md(s.date)}</span><b class="pl-s">${x.esc(s.title)}</b><span class="pl-w">${x.esc(note(s))}</span></div>`).join('')}`).join('');
    const card = x.el(`<div class="pl-card">
      <div class="pl-hd"><span class="pl-ti">Half Marathon Plan</span><span class="pl-cnt"><b class="pl-n">0</b> of ${N} written</span></div>
      <div class="pl-vp"><div class="pl-doc" style="height:${DOC_H}px">${rowsHtml}</div></div>
    </div>`);
    const doc = card.querySelector('.pl-doc'), n = card.querySelector('.pl-n');
    const rows = [...card.querySelectorAll('.pl-row')];
    const heads = [...card.querySelectorAll('.pl-wk')];
    const race = card.querySelector('.pl-race');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    // how many rows are written at t (fractional while the next one types in)
    const written = (t) => {
      if (t < T.f0) return T.w1.reduce((a, s) => a + outCubic(seg(t, s, s + 0.14)), 0);
      return lerp(4, N, inOutCubic(seg(t, T.f0, T.f1)));
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      focus: card,
      render(t) {
        const ns = streamCount(SAY, T.r + 0.05, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const w = written(t);
        rows.forEach((row, j) => {
          const o = Math.max(0, Math.min(1, w - j));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -6).toFixed(2)}px)`;
        });
        heads.forEach((h, i) => { h.style.opacity = Math.max(0, Math.min(1, (w - i * 4) * 2)).toFixed(3); });
        // the doc follows the write head: the newest row sits at the window's bottom once the doc outgrows it
        const wf = Math.max(0, Math.min(N - 1, w - 1)), j = Math.floor(wf);
        const head = lerp(TOPS[j], TOPS[Math.min(N - 1, j + 1)], wf - j);
        const off = Math.max(0, head + ROW + 6 - VP);
        doc.style.transform = `translateY(${(-off).toFixed(2)}px)`;
        const cnt = String(Math.min(N, Math.round(w)));
        if (cnt !== count) { n.textContent = cnt; count = cnt; }
        race.style.setProperty('--tint', outCubic(seg(t, T.race, T.race + RACE_IN)).toFixed(3));
      },
    };
  },
};
