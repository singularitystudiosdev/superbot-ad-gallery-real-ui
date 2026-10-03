// Inbox beat: Gemini reads Nina's inbox and next week's calendar. Its line streams and a card rises: "Reading 214 emails
// and next week's calendar", the counter ticking up to 214 while a thin progress bar fills, and under it the findings
// build row by row: three clients asking for a call (name, what they asked for, a "Call request" tag) and the two
// double bookings in next week's calendar (the Tuesday one is the highlighted row). A footer lands with the check:
// "6 call requests, 2 double bookings". The grammar is the source's backlog card (header with spinner resolving to the
// check, a counter, staggered rows). Every client is made up for the spot (each name was web-searched on 2026-10-03).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './gm-icons.js?v=5cd6e70f';

const SAY = 'Read your inbox and next week\'s calendar for call requests and clashes.';
const TOTAL = 214;
// the findings: [name, detail, tag, kind, favicon colour]. kind 'call' = a client asking for a call, 'clash' = a double
// booking in the calendar (the first clash is the highlighted row)
export const ROWS = [
  ['Harbor & Pine', 'Wants a 30 min kickoff, London', 'Call request', 'call', '#1e8e3e'],
  ['Brightwater Cycles', 'Free any afternoon, Berlin', 'Call request', 'call', '#b06000'],
  ['Lumen & Tide', 'Mornings only, Los Angeles', 'Call request', 'call', '#1967d2'],
  ['Tuesday 10:00 AM', 'Design review overlaps your dentist', 'Double booked', 'clash', ''],
  ['Wednesday 3:00 PM', 'Podcast overlaps invoice review', 'Double booked', 'clash', ''],
];
const DONE = '6 call requests, 2 double bookings';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.08;                 // the card landing to the counter starting
const COUNT = 0.8; /* deliberate */    // the counter running up to 214 (the progress bar fills with it)
const ROW_AT = 0.36;                   // the card landing to the first row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = ROWS.map((_, i) => T.card + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[ROWS.length - 1] + FOOT_AT, T.c1);
    // the beat's last visible change: the footer settled, or the line's last character
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    let hi = false;
    const row = ([name, detail, tag, kind, c]) => {
      const first = kind === 'clash' && !hi;
      if (first) hi = true;
      const fav = kind === 'call' ? `<span class="rs-fav" style="--c: ${c}">${x.esc(name[0])}</span>` : `<span class="rs-fav rs-cal">${ms('event-repeat-outline')}</span>`;
      return `<div class="rs-row${first ? ' rs-hi' : ''}">${fav}<b>${x.esc(name)}</b><span class="rs-det">${x.esc(detail)}</span><span class="rs-tag rs-${kind}">${x.esc(tag)}</span></div>`;
    };
    const card = x.el(`<div class="rs-card">
      <div class="rs-hd"><span class="rs-st"><i class="rs-spin"></i>${x.OK}</span><b>Reading <span class="rs-n">0</span> emails and next week's calendar</b></div>
      <i class="rs-bar"><i></i></i>
      <div class="rs-list">${ROWS.map(row).join('')}</div>
      <div class="rs-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const n = $('.rs-n'), bar = $('.rs-bar i'), spin = $('.rs-spin'), ok = $('.rs-st .qc-ok'), ft = $('.rs-ft');
    const rows = [...card.querySelectorAll('.rs-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and the bar: a fast run through the inbox, easing in at the end
        const p = seg(t, T.c0, T.c1);
        const c = fmt(Math.round(TOTAL * inOutCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }
        bar.style.transform = `scaleX(${inOutCubic(p).toFixed(4)})`;
        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the findings build row by row
        rows.forEach((rw, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          rw.style.opacity = q.toFixed(3);
          rw.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
