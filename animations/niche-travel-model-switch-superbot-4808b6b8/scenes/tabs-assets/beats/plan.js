// Plan beat: Claude Opus 5.5 writes the day by day plan, in the base's writing-panel grammar (Cursor's agent panel,
// via bikeride-model-switch's code beat): a header with "Lisbon, 5 relaxed days", the dates chip and an honest clock
// ("Working 1s", then a check and "Worked for 2s"), the tabs (one per day, each with its own photo: Day 1 Alfama
// active, then Day 3 Sintra), and a body where the day's muted meta line ("3 stops, about 4 km on foot") sits above
// the day's plan streaming in behind a caret. Then the tab switches to Day 3 and its plan streams. The review bar
// counts the days ("Planning day 1 of 5") and lands on "5 days planned, never more than 3 stops a day" with the green
// check, with Review / Keep plan. In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS).
// Pure function of t: every value on screen is written from t. Each plan paragraph is laid out whole from the start
// (the streamed part visible, the rest transparent), so nothing reflows while it streams.
import { seg, outCubic } from '../../../lib.js';
import { TRIP } from './fares.js?v=4808b6b8';

const SAY = 'Planned your five days at an easy pace around your flights.';
const TITLE = 'Lisbon, 5 relaxed days';
// the whole plan, one entry a day: [day, weekday, neighbourhood, plan]. Max 3 stops a day, nothing before 10 AM but the
// arrival. Opening hours checked on the official pages (brand/CREDITS.txt DATA): Jerónimos 9:30 AM to 5:30 PM Tuesday
// to Sunday, Pena Palace 9:30 AM to 6:30 PM. The Expedia trip page's "Your days" rail reads this same table.
export const PLAN = [
  [1, 'Wed', 'Alfama', 'Land, check in, rest. Slow lunch in Alfama, sunset at Miradouro de Santa Luzia, Fado dinner at 8 PM.'],
  [2, 'Thu', 'Belém', 'Jerónimos Monastery at 10:30 AM, pastéis de Belém, riverside walk to the MAAT.'],
  [3, 'Fri', 'Sintra', 'Day trip with hotel pickup. Pena Palace at 10:30 AM, lunch in town, back by 5 PM.'],
  [4, 'Sat', 'Chiado and Baixa', 'Tram 28 in the morning, lunch at Time Out Market, the evening is free.'],
  [5, 'Sun', 'Fly home', 'Late breakfast, check out at noon, flight home.'],
];
// the two days the panel shows: [tab, photo, meta line, plan]
export const DAYS = [
  [`Day 1 ${PLAN[0][2]}`, 'alfama-night.jpg', '3 stops, about 4 km on foot', PLAN[0][3]],
  [`Day 3 ${PLAN[2][2]}`, 'sintra-pena.jpg', '1 trip, pickup at 9:45 AM', PLAN[2][3]],
];
const TOTAL = TRIP.days;
const DONE = `${TOTAL} days planned, never more than 3 stops a day`;

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first planned character lands
const WRITE_A = 0.7; /* deliberate */ // Day 1's plan streaming in
const TAB_AT = 0.2;      // Day 1 written, then the tab switches to Day 3
const TAB_IN = 0.12;     // Day 3's body fading up
const WRITE_B = 0.7; /* deliberate */ // Day 3's plan streaming in (read while the camera holds)
const REST_AT = 0.06;    // Day 3 written, then the other days count through
const REST = 0.34;       // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Keep plan pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const DOC = '<svg class="wr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16h5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

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
    const body = ([, , meta]) => `<div class="wr-bd">
        <span class="wr-meta">${x.esc(meta)}</span>
        <p class="wr-new"><span class="wr-v"></span><i class="wr-caret"></i><span class="wr-h"></span></p>
      </div>`;
    const card = x.el(`<div class="wr-x">
      <div class="wr-hd">
        <span class="wr-proj">${DOC}<b>${x.esc(TITLE)}</b></span><span class="wr-br">${x.esc(TRIP.dates)}</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-tabs">${DAYS.map(([tab, photo], i) => `<span class="wr-tab${i === 0 ? ' on' : ''}"><img src="${x.img(photo)}" alt=""/>${x.esc(tab)}</span>`).join('')}<span class="wr-more">+3</span></div>
      <div class="wr-bds">${DAYS.map(body).join('')}</div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}${TICK.replace('wr-tk', 'wr-tk wr-dn')}<b class="wr-nf">Planning day</b><span class="wr-cnt">1 of ${TOTAL}</span></span>
        <span class="wr-btns"><i class="wr-b">Review</i><i class="wr-b wr-pri">Keep plan</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.wr-tab')];
    const bodies = [...card.querySelectorAll('.wr-bd')].map((n, i) => ({
      n, v: n.querySelector('.wr-v'), h: n.querySelector('.wr-h'), c: n.querySelector('.wr-caret'), text: DAYS[i][3], shown: -1, caret: null,
    }));
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), pri = $('.wr-pri');
    let said = -1, onTab = -1;

    // one day's stream: characters [0, n) visible, the rest laid out but transparent, the caret riding the edge
    const stream = (o, a, b, t) => {
      const n = Math.round(o.text.length * seg(t, a, b));
      if (n !== o.shown) { o.v.textContent = o.text.slice(0, n); o.h.textContent = o.text.slice(n); o.shown = n; }
      const on = t >= a - 0.05 && t < b + 0.25;
      if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
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

        // the tab: Day 1 until the switch, then Day 3 (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((o, i) => { o.n.style.visibility = i === tab ? '' : 'hidden'; });
          onTab = tab;
        }
        bodies[1].n.style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(bodies[0], T.a0, T.a1, t);
        stream(bodies[1], T.b0, T.b1, t);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the day being planned (1, then 3, then the other days count through), then the summary
        const nDone = tab === 0 ? 1 : 3 + Math.floor((TOTAL - 3) * seg(t, T.n0, T.done) + 1e-6);
        setText(nf, d ? DONE : 'Planning day');
        setText(cnt, d ? '' : `${Math.min(TOTAL, nDone)} of ${TOTAL}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
