// Posts beat: Gemini reads the community's Discourse forum. Its line streams, a card rises ("Reading N posts across 6
// categories", the counter running up to 1,284), and inside it a small Discourse-styled window (the default light
// scheme: white, Inter, hairline rows, no names) scrolls fast through the titles members post. Then the titles
// collapse into a ranked "23 posts with no reply" list with view counts (each count runs up as its row lands, a thin
// Discourse-blue bar sized to it), and the closing line ticks in under the window: "Matched to 14 docs pages and 31
// solved threads". (The base ad's reads beat, re-dressed.)
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read 1,284 posts and found the 23 nobody has answered yet.';
const TOTAL = 1284;
const LABEL_A = 'Reading ', LABEL_B = ' posts across 6 categories';
// what members post, oldest first (made up for the spot; titles only, no names, as a topic list reads)
const ASKED = [
  'sync stuck on waiting after the update',
  'how do I export a notebook to PDF',
  'templates for meeting notes?',
  'share one page, not the whole notebook',
  'dark mode on iPad',
  'tags gone after import',
  'can I lock a notebook',
  "search doesn't find words in PDFs",
  'web clipper saves half the page',
  'hi from Lisbon, new here',
  'move notes between notebooks',
  'refund for a yearly plan',
  'sync says waiting on my phone',
  'is there a Markdown export',
  'notes missing after import',
  'shortcut for checklists?',
  'can two people edit one page',
  'iPad app closes on open',
  'where did the tag panel go',
  'print a single page',
  'recover a deleted note',
  'hello from a new member',
];
// the ranked list: [post, views]
const TOP = [
  ['Sync stuck on "Waiting" after 4.2', 412],
  ['Export a notebook to PDF', 268],
  ['Share one page, not the whole notebook', 191],
  ['Templates for meeting notes', 157],
  ['Dark mode on iPad', 133],
];
const TITLE = '23 posts with no reply', UNIT = 'views';
const FOOT = 'Matched to 14 docs pages and 31 solved threads';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */   // the posts scrolling past (the counter runs with it)
const COL_AT = 0.04;                   // the scroll done to the collapse starting
const COL = 0.3;                       // the titles collapse away under the list
const LIST_AT = 0.12;                  // the collapse start to the list's title
const STAGGER = 0.07;                  // one ranked row to the next
const ROW_IN = 0.22;                   // a ranked row rising in (its count runs up with it)
const FOOT_AT = 0.04;                  // the last row in to the closing line
const FOOT_IN = 0.24;
const SHOWN = 5;                       // titles visible in the window
const ROW = 30;                        // one title row's height, px

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.col = T.s1 + COL_AT;
    T.title = T.col + LIST_AT;
    T.rows = TOP.map((_, i) => T.title + 0.08 + i * STAGGER);
    T.foot = T.rows[TOP.length - 1] + ROW_IN + FOOT_AT;
    // the beat's last visible change: the closing line settled, or the reply line's last character
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const max = TOP[0][1];
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ps-card">
      <div class="ps-hd"><span class="ps-st"><i class="ps-spin"></i>${x.OK}</span><span class="ps-lb">${x.esc(LABEL_A)}<b class="ps-n">0</b>${x.esc(LABEL_B)}</span></div>
      <div class="ps-vp">
        <div class="ps-list">${ASKED.map((q) => `<div class="ps-row"><span class="ps-bub">${x.esc(q)}</span></div>`).join('')}</div>
        <div class="ps-top">
          <div class="ps-tt">${x.esc(TITLE)}<span>${x.esc(UNIT)}</span></div>
          ${TOP.map(([q, n], i) => `<div class="ps-q"><i class="ps-rk">${i + 1}</i><span class="ps-qt">${x.esc(q)}</span><b class="ps-ct">${n}</b><i class="ps-bar" style="--w: ${(n / max).toFixed(4)}"></i></div>`).join('')}
        </div>
      </div>
      <div class="ps-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const list = card.querySelector('.ps-list'), n = card.querySelector('.ps-n');
    const top = card.querySelector('.ps-top'), tt = card.querySelector('.ps-tt');
    const rows = [...card.querySelectorAll('.ps-q')].map((q, i) => ({ q, ct: q.querySelector('.ps-ct'), bar: q.querySelector('.ps-bar'), n: TOP[i][1], shown: '' }));
    const ft = card.querySelector('.ps-ft');
    const spin = card.querySelector('.ps-spin'), ok = card.querySelector('.ps-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ASKED.length - SHOWN) * ROW;
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

        // the scroll: oldest to newest, fast through the middle (a touch of blur at speed), the counter running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        // the collapse: the titles squeeze up and fade under the list
        const c = inOutCubic(seg(t, T.col, T.col + COL));
        list.style.transform = `translateY(${(-span * e - c * 18).toFixed(2)}px) scale(${lerp(1, 0.92, c).toFixed(4)})`;
        list.style.opacity = (1 - c).toFixed(3);
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : (c > 0 && c < 1 ? `blur(${(c * 2).toFixed(2)}px)` : 'none');
        const cnt = fmt(Math.round(TOTAL * outCubic(p)));
        if (cnt !== count) { n.textContent = cnt; count = cnt; }

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the ranked list: its sheet fades up over the collapsing bubbles, the title, then the rows in rank order
        top.style.opacity = outCubic(seg(t, T.col + 0.05, T.col + COL)).toFixed(3);
        const ti = outCubic(seg(t, T.title, T.title + 0.22));
        tt.style.opacity = ti.toFixed(3);
        tt.style.transform = ti >= 1 ? 'none' : `translateY(${((1 - ti) * 6).toFixed(2)}px)`;
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          o.q.style.opacity = q.toFixed(3);
          o.q.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 10).toFixed(2)}px)`;
          const v = String(Math.round(o.n * q));
          if (v !== o.shown) { o.ct.textContent = v; o.shown = v; }
          o.bar.style.transform = `scaleX(${(q * (o.n / max)).toFixed(4)})`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
