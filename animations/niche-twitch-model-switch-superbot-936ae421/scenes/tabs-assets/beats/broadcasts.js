// Broadcasts beat: Gemini reads the channel's past broadcasts. Its line streams and a card rises (the base's
// compact-card grammar: a compact card, a counter, rows that resolve). First the broadcasts: a plain video glyph, "Past
// broadcasts", the meta "14 streams, Sep 3 to Oct 2", the big count "61 hours", a thin bar the list is opened along
// (spinner resolving to the check), and three raw lines as the broadcast list reads (day, start, length, views; mono,
// muted). Then "Reading N broadcasts, M hours" ticks up to 14 and 61, and four rows resolve (label, value, one tag);
// the last, views dropping after 11 PM, carries the highlight. The footer lands: "5 best time slots found, views drop
// after 11 PM". Every number is made up for the spot. Pure function of t: every moving value is written from t, so ?t=
// and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ti } from './twitch-icons.js?v=936ae421';

const SAY = 'Read your last 14 broadcasts and found when your viewers show up.';
export const PAST = { title: 'Past broadcasts', meta: '14 streams, Sep 3 to Oct 2', hours: 61, streams: 14 };
// three lines as the raw broadcast list reads: day, start, length, views (mono, aligned)
const RAW = [
  'Tue Sep 29   7:02 PM   3h 58m   1,284 views',
  'Wed Sep 30  11:40 PM   1h 52m     212 views',
  'Sun Sep 27   6:05 PM   3h 01m   1,031 views',
];
// the rows: [label, value, tag, highlighted]
export const ROWS = [
  ['Best nights', 'Tue, Thu, Fri', 'Most views', false],
  ['Best start', '7 PM', 'Weeknights', false],
  ['Weekend', 'Sat 2 PM, Sun 6 PM', 'Afternoons', false],
  ['Views drop', 'after 11 PM', 'End by 11', true],
];
const DONE = '5 best time slots found, views drop after 11 PM';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the list starting to open
const READ = 0.3; /* deliberate */     // the broadcast list opened (the bar fills)
const RAW_STAGGER = 0.08;              // one raw line to the next, while the list opens
const RAW_IN = 0.2;                    // a raw line fading up
const COUNT_AT = 0.08;                 // the list open to the counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 14 broadcasts and 61 hours (its bar fills with it)
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
        <span class="nt-doc">${ti('video')}</span>
        <div class="nt-meta">
          <span class="nt-title"><b>${x.esc(PAST.title)}</b><span class="nt-sub">${x.esc(PAST.meta)}</span></span>
          <span class="nt-hd"><span class="nt-st"><i class="nt-spin"></i>${x.OK}</span>Opening past broadcasts</span>
          <i class="nt-bar"><i class="nt-fill"></i></i>
        </div>
        <span class="nt-big"><b>${fmt(PAST.hours)}</b><small>hours</small></span>
      </div>
      <div class="nt-raw">${RAW.map((l) => `<span>${x.esc(l)}</span>`).join('')}</div>
      <div class="nt-ch"><span class="nt-st"><i class="nt-spin"></i>${x.OK}</span><b>Reading <span class="nt-n">0</span> broadcasts, <span class="nt-w">0</span> hours</b></div>
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

        // the broadcast list: opened along its bar, the raw lines fading up while it opens
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        status(vSt, t, T.card, T.p1);
        raws.forEach((n, i) => {
          const o = outCubic(seg(t, T.raw[i], T.raw[i] + RAW_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 4).toFixed(2)}px)`;
        });

        // the counter (broadcasts and hours) and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = `${Math.round(PAST.streams * q)}|${fmt(Math.round(PAST.hours * q))}`;
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
