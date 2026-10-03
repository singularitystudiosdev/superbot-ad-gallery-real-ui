// Queue beat: Gemini reads the weekend's queue and the help center. Its line streams and a card rises (the base's
// repo.js grammar: a compact card, a counter, rows that resolve). First the queue: the Zendesk mark, the account
// trailkit.zendesk.com, the view "Unassigned tickets", its big count 212 and "Oldest: Friday 6:02 PM", with a thin bar
// the view is opened along (spinner resolving to the check). Then "Reading N tickets and M help center articles" ticks
// up to 212 and 48, and four groups resolve as rows (group name, ticket count, one tag); the last, the three double
// charges that need a person, carries the highlight. The footer lands: "212 tickets sorted into 4 groups, 3 need you".
// Every name and number is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { zdi } from './zd-icons.js?v=6e224be4';

const SAY = 'Read the weekend queue and your help center.';
export const QUEUE = { host: 'trailkit.zendesk.com', view: 'Unassigned tickets', n: 212, oldest: 'Oldest: Friday 6:02 PM' };
const ARTICLES = 48;
// the groups: [name, count, tag, highlighted]
export const GROUPS = [
  ['Where is my order', 96, 'Tracking', false],
  ['Return or exchange', 61, 'Policy', false],
  ["Can't log in", 52, 'Reset link', false],
  ['Charged twice', 3, 'Needs you', true],
];
const DONE = '212 tickets sorted into 4 groups, 3 need you';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the view starting to open
const READ = 0.3; /* deliberate */     // the view opened (its bar fills)
const COUNT_AT = 0.08;                 // the view open to the counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 212 and 48 (its bar fills with it)
const ROW_AT = 0.24;                   // the counter starting to the first group
const STAGGER = 0.14;                  // one group to the next
const ROW_IN = 0.24;                   // a group rising in
const FOOT_AT = 0.24;                  // the last group starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = GROUPS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[GROUPS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qu-card">
      <div class="qu-q">
        <span class="qu-zd">${zdi('zendesk-24')}</span>
        <div class="qu-meta">
          <span class="qu-host">${x.esc(QUEUE.host)}</span>
          <span class="qu-view"><b>${x.esc(QUEUE.view)}</b><span class="qu-old">${x.esc(QUEUE.oldest)}</span></span>
          <span class="qu-hd"><span class="qu-st"><i class="qu-spin"></i>${x.OK}</span>Opening the view</span>
          <i class="qu-bar"><i class="qu-fill"></i></i>
        </div>
        <b class="qu-big">${QUEUE.n}</b>
      </div>
      <div class="qu-ch"><span class="qu-st"><i class="qu-spin"></i>${x.OK}</span><b>Reading <span class="qu-n">0</span> tickets and <span class="qu-a">0</span> help center articles</b></div>
      <i class="qu-cbar"><i></i></i>
      <div class="qu-list">${GROUPS.map(([name, n, tag, hi]) => `<div class="qu-row${hi ? ' qu-hi' : ''}">
        <span class="qu-name">${x.esc(name)}</span><span class="qu-cnt">${n} tickets</span><span class="qu-tag">${x.esc(tag)}</span></div>`).join('')}</div>
      <div class="qu-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.qu-st')].map((n) => ({ spin: n.querySelector('.qu-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.qu-fill');
    const ch = $('.qu-ch'), cbarW = $('.qu-cbar'), cbar = $('.qu-cbar i'), n = $('.qu-n'), na = $('.qu-a'), ft = $('.qu-ft');
    const rows = [...card.querySelectorAll('.qu-row')];
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

        // the view: opened along its bar
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        status(vSt, t, T.card, T.p1);

        // the counter (tickets and articles) and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = `${fmt(Math.round(QUEUE.n * q))}|${Math.round(ARTICLES * q)}`;
        if (cn !== count) { const [a, b] = cn.split('|'); n.textContent = a; na.textContent = b; count = cn; }
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
