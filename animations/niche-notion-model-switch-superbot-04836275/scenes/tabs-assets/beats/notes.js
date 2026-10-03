// Notes beat: Gemini reads the week's meeting notes. Its line streams and a card rises (the base's compact-card grammar:
// a compact card, a counter, rows that resolve). First the notes: a plain document glyph, "Meeting notes", the meta
// "3 meetings, Sep 29 to Oct 1", the big count "2,140 words", a thin bar the notes are opened along (spinner
// resolving to the check), and three raw excerpt lines as they were typed in the meetings (lowercase, shorthand,
// muted). Then "Reading N meetings, M words" ticks up to 3 and 2,140, and four rows resolve (label, count, one tag);
// the last, the three tasks the notes never gave a date, carries the highlight. The footer lands: "12 action items
// found, 3 without a clear date". Every name and number is made up for the spot. Pure function of t: every moving
// value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ni } from './notion-icons.js?v=04836275';

const SAY = 'Read your three meetings and pulled out every action item.';
export const NOTES = { title: 'Meeting notes', meta: '3 meetings, Sep 29 to Oct 1', words: 2140, meetings: 3 };
// three lines exactly as they were typed in the meetings
const RAW = [
  'marcus fix checkout timeout?? by wed',
  'pricing faq sometime next week (priya)',
  'elena onboarding checklist redesign thurs',
];
// the rows: [label, count, tag, highlighted]
export const ROWS = [
  ['Action items', '12 found', 'Tasks', false],
  ['People named', '3 people', 'Owners', false],
  ['Dates said', '9 dates', 'Due', false],
  ['No clear date', '3 tasks', 'Needs a date', true],
];
const DONE = '12 action items found, 3 without a clear date';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the notes starting to open
const READ = 0.3; /* deliberate */     // the notes opened (the bar fills)
const RAW_STAGGER = 0.08;              // one excerpt line to the next, while the notes open
const RAW_IN = 0.2;                    // an excerpt line fading up
const COUNT_AT = 0.08;                 // the notes open to the counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 3 meetings and 2,140 words (its bar fills with it)
const ROW_AT = 0.24;                   // the counter starting to the first row
const STAGGER = 0.14;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.24;                  // the last row starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.raw = RAW.map((_, i) => T.p0 + i * RAW_STAGGER);
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = ROWS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[ROWS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="nt-card">
      <div class="nt-q">
        <span class="nt-doc">${ni('file-text')}</span>
        <div class="nt-meta">
          <span class="nt-title"><b>${x.esc(NOTES.title)}</b><span class="nt-sub">${x.esc(NOTES.meta)}</span></span>
          <span class="nt-hd"><span class="nt-st"><i class="nt-spin"></i>${x.OK}</span>Opening the notes</span>
          <i class="nt-bar"><i class="nt-fill"></i></i>
        </div>
        <span class="nt-big"><b>${fmt(NOTES.words)}</b><small>words</small></span>
      </div>
      <div class="nt-raw">${RAW.map((l) => `<span>${x.esc(l)}</span>`).join('')}</div>
      <div class="nt-ch"><span class="nt-st"><i class="nt-spin"></i>${x.OK}</span><b>Reading <span class="nt-n">0</span> meetings, <span class="nt-w">0</span> words</b></div>
      <i class="nt-cbar"><i></i></i>
      <div class="nt-list">${ROWS.map(([name, n, tag, hi]) => `<div class="nt-row${hi ? ' nt-hi' : ''}">
        <span class="nt-name">${x.esc(name)}</span><span class="nt-cnt">${x.esc(n)}</span><span class="nt-tag">${x.esc(tag)}</span></div>`).join('')}</div>
      <div class="nt-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.nt-st')].map((n) => ({ spin: n.querySelector('.nt-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.nt-fill');
    const raws = [...card.querySelectorAll('.nt-raw span')];
    const ch = $('.nt-ch'), cbarW = $('.nt-cbar'), cbar = $('.nt-cbar i'), nm = $('.nt-n'), nw = $('.nt-w'), ft = $('.nt-ft');
    const rows = [...card.querySelectorAll('.nt-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the notes: opened along their bar, the raw lines fading up while they open
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        status(vSt, t, T.card, T.p1);
        raws.forEach((n, i) => {
          const o = outCubic(seg(t, T.raw[i], T.raw[i] + RAW_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 4).toFixed(2)}px)`;
        });

        // the counter (meetings and words) and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = `${Math.round(NOTES.meetings * q)}|${fmt(Math.round(NOTES.words * q))}`;
        if (cn !== count) { const [a, b] = cn.split('|'); nm.textContent = a; nw.textContent = b; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
