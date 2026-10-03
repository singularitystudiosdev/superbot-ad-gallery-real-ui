// Tracker beat: Claude Opus 5.5 turns the notes into the tracker, in the base's reply-panel grammar kept whole (panel
// chrome, tabs, streaming caret, the camera's push on the panel), the body in the UI sans. A header with "Launch
// tracker", the workspace chip "Pinecrest Studio" and an honest clock ("Working 1s", then a check and "Worked for 2s");
// the tabs "Tasks" (active) then "Due dates". Tab 1 streams an aligned three column list (the task, its owner with a
// small letter avatar, the due date in the muted colour), six rows and "+ 6 more"; then the tab switches and tab 2
// streams the three vague phrases the notes used turned into real dates (the quote muted, an arrow, the date in the
// text colour, the task small and muted under it). The review bar counts the tabs ("Writing 1 of 2") and lands on
// "12 tasks, each with one owner and a real due date" with the green check. In the zoom cut the camera pushes in on
// the panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is written from t; line
// heights are constants, so the stream never measures layout.
import { seg, outCubic } from '../../../lib.js';
import { ni, initials } from './notion-icons.js?v=04836275';

const SAY = 'Turned the notes into 12 tasks, each with an owner and a date.';
const TITLE = 'Launch tracker';
const HOST = 'Pinecrest Studio';
// tab 1: [task, owner, due]; tab 2: [quote, date, task]. Each line streams its first column; the rest of the line
// lands when that column is written
const TASKS = [
  ['Finalize launch date with sales', 'Priya Shah', 'Tue, Oct 6'],
  ['Fix the checkout timeout bug', 'Marcus Lee', 'Wed, Oct 7'],
  ['Redesign the onboarding checklist', 'Elena Ruiz', 'Thu, Oct 8'],
  ['Write the pricing page FAQ', 'Priya Shah', 'Fri, Oct 9'],
  ['Export the launch screenshots', 'Elena Ruiz', 'Mon, Oct 12'],
  ['Ship the CSV export', 'Marcus Lee', 'Tue, Oct 13'],
];
const MORE = '+ 6 more';
const DATES = [
  ['"sometime next week"', 'Fri, Oct 9', 'Write the pricing page FAQ'],
  ['"before the press briefing"', 'Tue, Oct 13', 'Ship the CSV export'],
  ['"after the load test"', 'Tue, Oct 20', 'Set up status page alerts'],
];
const TABS = [['Tasks', [...TASKS.map((r) => r[0]), MORE]], ['Due dates', DATES.map((r) => r[0])]];
const DONE = '12 tasks, each with one owner and a real due date';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE_A = 0.7; /* deliberate */ // the task list streaming in
const TAB_AT = 0.16;     // the list written, then the tab switches
const TAB_IN = 0.12;     // the second tab's body fading up
const WRITE_B = 0.6; /* deliberate */ // the three dates streaming in (read while the camera holds)
const REST_AT = 0.06;    // the dates written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Approve all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
const LAND = 0.12;       // a line's other columns fading up once its first column is written

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// per tab: every line's start offset in that tab's stream (a line break counts one character), and the total
const STREAMS = TABS.map(([, lines]) => {
  let acc = 0;
  const starts = lines.map((ln) => { const s = acc; acc += [...ln].length + 1; return s; });
  return { starts, total: acc - 1 };
});

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.n0 = T.b1 + REST_AT;
    T.done = T.n0 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const av = (who) => `<i class="tr-av">${initials(who)}</i>`;
    const tasks = `<div class="tr-bd" data-f="0"><div class="tr-txt">
      ${TASKS.map(([task, who, due]) => `<div class="tr-l tr-row"><span class="tr-a"><span class="tr-v"></span><i class="em-caret"></i></span>
        <span class="tr-rest tr-who">${av(who)}${esc(who)}</span><span class="tr-rest tr-due">${esc(due)}</span></div>`).join('')}
      <div class="tr-l tr-more"><span class="tr-a"><span class="tr-v"></span><i class="em-caret"></i></span></div>
    </div></div>`;
    const dates = `<div class="tr-bd" data-f="1"><div class="tr-txt">
      ${DATES.map(([q, date, task]) => `<div class="tr-l tr-dl"><span class="tr-a tr-q"><span class="tr-v"></span><i class="em-caret"></i></span>
        <span class="tr-rest tr-to">→</span><span class="tr-rest tr-date"><b>${esc(date)}</b><small>${esc(task)}</small></span></div>`).join('')}
    </div></div>`;
    const card = x.el(`<div class="em-x tr-x">
      <div class="em-hd">
        <span class="em-proj">${ni('table-2', 'em-ico')}<b>${TITLE}</b></span><span class="em-br">${HOST}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-tabs">${TABS.map(([tab], i) => `<span class="em-tab${i === 0 ? ' on' : ''}">${esc(tab)}</span>`).join('')}</div>
      <div class="tr-bds">${tasks}${dates}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${TABS.length}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Approve all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.em-tab')];
    const bodies = [...card.querySelectorAll('.tr-bd')];
    const files = TABS.map(([, lines], f) => ({
      rows: [...bodies[f].querySelectorAll('.tr-l')].map((n, i) => ({
        n, v: n.querySelector('.tr-v'), c: n.querySelector('.em-caret'), rest: [...n.querySelectorAll('.tr-rest')],
        chars: [...lines[i]], shown: -1, caret: null, ro: '',
      })),
    }));
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri');
    let said = -1, onTab = -1;

    // one tab's stream at character count c (from the time it started): lines fill in order, the caret riding the
    // last character; a line's other columns fade up once its first column is written
    const stream = (f, c, writing, t, t0, cps) => {
      const S = STREAMS[f];
      files[f].rows.forEach((o, i) => {
        const st = S.starts[i];
        const k2 = Math.max(0, Math.min(o.chars.length, c - st));
        const next = S.starts[i + 1];
        const on = writing && c >= st && (next === undefined || c < next);
        if (k2 !== o.shown) { o.v.textContent = o.chars.slice(0, k2).join(''); o.shown = k2; }
        if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        const at = t0 + (st + o.chars.length) / cps; // the instant this line's first column is written
        const ro = outCubic(seg(t, at, at + LAND)).toFixed(3);
        if (ro !== o.ro) { o.rest.forEach((n) => { n.style.opacity = ro; }); o.ro = ro; }
      });
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the tab: the task list until the switch, then the due dates (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((n, i) => { n.style.visibility = i === tab ? '' : 'hidden'; });
          onTab = tab;
        }
        bodies[1].style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        const ca = STREAMS[0].total / WRITE_A, cb = STREAMS[1].total / WRITE_B;
        stream(0, Math.round(STREAMS[0].total * seg(t, T.a0, T.a1)), t >= T.a0 && t < T.a1 + 0.2, t, T.a0, ca);
        stream(1, Math.round(STREAMS[1].total * seg(t, T.b0, T.b1)), t >= T.b0 && t < T.b1 + 0.3, t, T.b0, cb);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the tab being written (1 of 2, 2 of 2), then the summary
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${tab + 1} of ${TABS.length}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
