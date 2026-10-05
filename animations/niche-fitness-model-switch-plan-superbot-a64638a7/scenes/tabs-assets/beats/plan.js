// Claude Opus 5.5's beat: writes the plan itself, the thing the user asked for. One artifact panel, pushed in by the
// camera while it writes: the four phases (Base, Build, Peak, Taper) as a ribbon over the 12 weeks, each week's miles as a
// stacked bar (easy under quality) with the long run drawn as a line through them, cutback / peak / race weeks marked,
// then one key session from each phase written out with its structured-workout graph (struct.js), its steps at the
// paces Gemini set, its miles and its minutes. Every bar, mile and pace comes from plan-data.js.
import { seg, outCubic } from '../../../lib.js';
import { PLAN, PHASES, PHASE_C, WEEKS, SPLIT, LONGS, CUTBACK, PEAK_I, PACE, TOTAL_MI, ALL, START, RACE, md } from './plan-data.js?v=a64638a7';
import { structSvg, minutes } from './struct.js?v=a64638a7';

const SAY = `Wrote your 12-week plan: base, build, peak and taper, 4 runs a week, ${TOTAL_MI} miles in all.`;
const TITLE = 'Half Marathon Plan';
const SUB = `12 weeks, ${ALL.length} runs, ${md(START)} to ${md(RACE.date)}`;
const DONE = `Wrote ${ALL.length} workouts`;

// one key session from each phase, its lines written from its own steps
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const S = (w, d) => PLAN[w][d];
const SESSIONS = [
  { r: S(1, 1), ph: 'Base', lines: (r) => [`${f1(r.steps[0].mi)} mi easy`, '6 × 60 s uphill', `${f1(r.steps[r.steps.length - 1].mi)} mi easy`] },
  { r: S(6, 1), ph: 'Build', lines: (r) => [`${f1(r.steps[0].mi)} mi easy`, `3 mi at ${PACE.T}`, `${f1(r.steps[2].mi)} mi easy`] },
  { r: S(8, 3), ph: 'Peak', lines: (r) => [`${f1(r.steps[0].mi)} mi easy, ${PACE.E}`, `${f1(r.steps[1].mi)} mi at ${PACE.RP}`, 'Gels at 45, 75 min'] },
  { r: S(10, 1), ph: 'Taper', lines: (r) => [`${f1(r.steps[0].mi)} mi easy`, `2 mi at ${PACE.RP}`, `${f1(r.steps[2].mi)} mi easy`] },
];
const dayName = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
const TOP = 26; // mi at the top of the bar area
const MARK = Object.fromEntries([...CUTBACK.map((w) => [w, 'Cutback']), [PEAK_I, 'Peak'], [11, 'Race']]);

// timing (seconds), card-relative unless noted
const CARD_AT = 0.08;
const CARD_IN = 0.32;
const SAY_AT = 0.04, CPS = 106.25;
const PH_AT = 0.2, PH_GAP = 0.08, PH_IN = 0.22;
const BAR_AT = 0.3, BAR_GAP = 0.05, BAR_IN = 0.28;
const LINE_AT = 0.78, LINE_IN = 0.42;
const SES_AT = 0.95, SES_GAP = 0.2, SES_IN = 0.2, GRAPH_IN = 0.3, LINES_CPS = 140;
const FOOT_AT = 1.86, FOOT_IN = 0.22;
const DONE_AT = 2.02;
const HOLD_DONE = 0.4; /* deliberate */ // the finished plan reads, pushed in, before the camera pulls back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4, FOCUS_PULL = 0.4;

const DOC = '<svg class="pl-doc" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 1.5h5.2L12.5 4.8V14a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5Z" fill="none" stroke="#c9c9cf" stroke-width="1.2"/><path d="M9 1.7V5h3.3" fill="none" stroke="#c9c9cf" stroke-width="1.2"/><path d="M5.6 8h4.8M5.6 10.2h4.8M5.6 12.4h3" stroke="#8b8b94" stroke-width="1.1" stroke-linecap="round"/></svg>';

function rise(n, p, dy = 8) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

export default {
  times(r, opts = {}) {
    const T = { r, card: r + CARD_AT };
    const c = T.card;
    T.ph = PHASES.map((_, i) => c + PH_AT + i * PH_GAP);
    T.bars = WEEKS.map((_, i) => c + BAR_AT + i * BAR_GAP);
    T.line = c + LINE_AT;
    T.ses = SESSIONS.map((s, i) => {
      const a = c + SES_AT + i * SES_GAP;
      const txt = s.lines(s.r).join('').length;
      return { a, g: a + 0.08, l: a + 0.14, lb: a + 0.14 + txt / LINES_CPS };
    });
    T.foot = c + FOOT_AT;
    T.done = Math.max(c + DONE_AT, ...T.ses.map((s) => s.lb));
    if (opts.zoom !== false) {
      const sw = c + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : T.done + HOLD_DONE, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild;
    const longPts = LONGS.map((v, i) => `${((i + 0.5) / 12 * 1000).toFixed(1)},${(100 - (v / TOP) * 100).toFixed(2)}`).join(' ');
    const card = x.el(`<div class="pl-x">
      <div class="pl-hd">${DOC}<b>${TITLE}</b><span class="pl-sub">${x.esc(SUB)}</span>
        <em class="pl-state"><span class="pl-st"><i class="pl-spin"></i>${x.OK}</span><span class="pl-sl">Writing</span></em></div>
      <div class="pl-chart">
        <div class="pl-ph">${PHASES.map((p) => `<span class="pl-pseg" style="grid-column:${p.from + 1} / ${p.to + 2};--c:${PHASE_C[p.name]}"><b>${p.name}<small>W${p.from + 1}-${p.to + 1}</small></b><em>${p.aim}</em></span>`).join('')}</div>
        <div class="pl-bars">
          <div class="pl-grid"><i style="bottom:${(10 / TOP) * 100}%"></i><i style="bottom:${(20 / TOP) * 100}%"></i></div>
          ${WEEKS.map((v, i) => {
            const sp = SPLIT[i], ph = PHASES.find((p) => i >= p.from && i <= p.to);
            return `<div class="pl-col${MARK[i] ? ` pl-m-${MARK[i].toLowerCase()}` : ''}">
              <span class="pl-stack" style="height:${((v / TOP) * 100).toFixed(2)}%">
                <span class="pl-v">${v}</span>
                <i class="pl-q" style="flex:${sp.hard.toFixed(3)}"></i><i class="pl-e" style="flex:${sp.easy.toFixed(3)};--c:${PHASE_C[ph.name]}"></i>
              </span></div>`;
          }).join('')}
          <svg class="pl-long" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${longPts}" fill="none" stroke="#f4f4f5" stroke-width="1.6" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/></svg>
          ${LONGS.map((v, i) => `<i class="pl-ld" style="left:${((i + 0.5) / 12 * 100).toFixed(3)}%;bottom:${((v / TOP) * 100).toFixed(2)}%"></i>`).join('')}
        </div>
        <div class="pl-wks">${WEEKS.map((_, i) => `<span><b>W${i + 1}</b>${MARK[i] ? `<em class="pl-mk pl-mk-${MARK[i].toLowerCase()}">${MARK[i]}</em>` : ''}</span>`).join('')}</div>
      </div>
      <div class="pl-ses">${SESSIONS.map((s) => `<div class="pl-s" style="--c:${PHASE_C[s.ph]}">
          <div class="pl-s-hd"><b>${x.esc(s.r.name)}</b><em>W${s.r.week + 1} ${dayName(s.r.date)}</em></div>
          <div class="pl-s-g">${structSvg(s.r.steps, 150, 22, { gap: 1 })}</div>
          <ol class="pl-s-ln">${s.lines(s.r).map((l) => `<li><span class="pl-lv"></span><span class="pl-lh">${x.esc(l)}</span></li>`).join('')}</ol>
          <div class="pl-s-ft"><span>${s.r.miles} mi</span><span>${minutes(s.r.steps)} min</span><span class="pl-s-ph">${s.ph}</span></div>
        </div>`).join('')}</div>
      <div class="pl-ft"><span class="pl-sum"><b>${ALL.length} workouts</b><i></i>${TOTAL_MI} mi<i></i>4 runs a week</span>
        <span class="pl-lg"><i class="pl-lg-e"></i>Easy<i class="pl-lg-q"></i>Quality<i class="pl-lg-l"></i>Long run</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.pl-spin'), ok: $('.pl-st .qc-ok'), sl: $('.pl-sl') };
    const segs = [...card.querySelectorAll('.pl-pseg')];
    const stacks = [...card.querySelectorAll('.pl-stack')];
    const dots = [...card.querySelectorAll('.pl-ld')];
    const marks = [...card.querySelectorAll('.pl-wks > span')];
    const line = $('.pl-long');
    const ses = [...card.querySelectorAll('.pl-s')].map((n, i) => ({
      n, g: n.querySelector('.pl-s-g svg'), ft: n.querySelector('.pl-s-ft'),
      lines: [...n.querySelectorAll('.pl-s-ln li')].map((li) => ({ v: li.firstElementChild, txt: li.lastElementChild.textContent, shown: -1 })),
      txt: SESSIONS[i].lines(SESSIONS[i].r),
    }));
    const ft = $('.pl-ft');
    let said = -1, doneState = null;
    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (n !== said) { vis.textContent = SAY.slice(0, n); said = n; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 10);
        const done = t >= T.done;
        st.spin.style.opacity = done ? '0' : '1';
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = outCubic(seg(t, T.done, T.done + 0.16)).toFixed(3);
        if (done !== doneState) { st.sl.textContent = done ? DONE : 'Writing'; doneState = done; }
        segs.forEach((s, i) => {
          const p = outCubic(seg(t, T.ph[i], T.ph[i] + PH_IN));
          s.style.opacity = p.toFixed(3);
          s.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
        });
        stacks.forEach((s, i) => {
          const p = outCubic(seg(t, T.bars[i], T.bars[i] + BAR_IN));
          s.style.transform = `scaleY(${p.toFixed(3)})`;
          s.style.opacity = p > 0 ? '1' : '0';
          s.firstElementChild.style.opacity = seg(t, T.bars[i] + BAR_IN * 0.6, T.bars[i] + BAR_IN + 0.08).toFixed(3);
          marks[i].style.opacity = outCubic(seg(t, T.bars[i], T.bars[i] + BAR_IN)).toFixed(3);
        });
        const lp = outCubic(seg(t, T.line, T.line + LINE_IN));
        line.style.clipPath = `inset(-4px ${((1 - lp) * 100).toFixed(2)}% -4px 0)`;
        dots.forEach((d, i) => { d.style.opacity = lp * 12 >= i + 0.5 ? '1' : '0'; });
        ses.forEach((o, i) => {
          const s = T.ses[i];
          rise(o.n, seg(t, s.a, s.a + SES_IN), 6);
          const g = outCubic(seg(t, s.g, s.g + GRAPH_IN));
          o.g.style.clipPath = `inset(0 ${((1 - g) * 100).toFixed(2)}% 0 0)`;
          // the lines write in order, a character at a time, the way the model streams them
          let left = Math.max(0, Math.floor((t - s.l) * LINES_CPS));
          o.lines.forEach((ln) => {
            const k1 = Math.min(ln.txt.length, left);
            left -= k1;
            if (k1 !== ln.shown) { ln.v.textContent = ln.txt.slice(0, k1); ln.shown = k1; }
          });
          o.ft.style.opacity = seg(t, s.lb, s.lb + 0.14).toFixed(3);
        });
        rise(ft, seg(t, T.foot, T.foot + FOOT_IN), 4);
      },
    };
  },
};
