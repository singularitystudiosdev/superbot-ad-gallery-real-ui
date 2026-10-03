// Reads beat: Gemini reads what people say about the habit trackers already on the App Store. Its line streams, a card
// rises ("Reading N App Store reviews of the top 10 habit trackers", the counter running up to 3,412), and inside it a
// small App Store styled list (Apple's light neutrals, white review cards, a star rating each, no names) scrolls fast
// through the reviews. Then the reviews collapse into a ranked "What reviewers ask for" list with mention counts (each
// count runs up as its row lands, a thin Apple-blue bar sized to it), and the closing line ticks in under the list:
// "5 features picked for version 1.0".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ico } from './ui-icons.js?v=7ec80219';

const SAY = 'Read 3,412 App Store reviews of the top 10 habit trackers and ranked what people ask for.';
const TOTAL = 3412;
const LABEL_A = 'Reading ', LABEL_B = ' App Store reviews of the top 10 habit trackers';
// what reviewers say, oldest first: [stars, text] (made up for the spot; no names, as a review list reads)
const ASKED = [
  [1, 'lost my 200 day streak because I had the flu'],
  [3, 'please add a home screen widget'],
  [2, 'why do I need an account to log water'],
  [2, 'reminders at 7am on a Sunday, no thanks'],
  [1, "doesn't work on the subway"],
  [2, 'too many ads for a checklist'],
  [4, 'love it but one sick day reset everything'],
  [3, 'widget please, I never open the app'],
  [2, 'stop asking me to sign up'],
  [3, 'let me pick when reminders come'],
  [1, 'offline mode would save my streak'],
  [4, 'great app, needs a widget'],
  [2, 'missed one day on vacation, back to zero'],
  [1, 'account required just to try it?'],
  [3, 'reminders ignore my night shifts'],
  [2, 'nothing loads on a plane'],
  [3, 'a lock screen widget would be perfect'],
  [2, 'one missed day should not erase a month'],
  [4, 'simple and clean, just no widget'],
  [2, 'notifications at the worst times'],
  [1, 'paywall to export my own data'],
  [3, 'no wifi at the gym, no app'],
];
// the ranked list: [feature, mentions]
const TOP = [
  ['Streaks that forgive one missed day', 412],
  ['A home screen widget', 356],
  ['No account needed', 298],
  ['Reminders that fit my schedule', 241],
  ['Works offline', 187],
];
const FOOT = '5 features picked for version 1.0';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */   // the history scrolling past (the counter runs with it)
const COL_AT = 0.04;                   // the scroll done to the collapse starting
const COL = 0.3;                       // the bubbles collapse away under the list
const LIST_AT = 0.12;                  // the collapse start to the list's title
const STAGGER = 0.07;                  // one ranked row to the next
const ROW_IN = 0.22;                   // a ranked row rising in (its count runs up with it)
const FOOT_AT = 0.04;                  // the last row in to the closing line
const FOOT_IN = 0.24;
const SHOWN = 5;                       // bubbles visible in the window
const ROW = 30;                        // one bubble row's height, px

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
    const card = x.el(`<div class="rd-card">
      <div class="rd-hd"><span class="rd-st"><i class="rd-spin"></i>${x.OK}</span><span class="rd-lb">${x.esc(LABEL_A)}<b class="rd-n">0</b>${x.esc(LABEL_B)}</span></div>
      <div class="rd-vp">
        <div class="rd-list">${ASKED.map(([n, q]) => `<div class="rd-row"><span class="rd-bub"><span class="rd-stars" aria-label="${n} of 5 stars">${[0, 1, 2, 3, 4].map((i) => ico(i < n ? 'f7_star_fill' : 'f7_star', i < n ? 'rd-star on' : 'rd-star')).join('')}</span>${x.esc(q)}</span></div>`).join('')}</div>
        <div class="rd-top">
          <div class="rd-tt">What reviewers ask for<span>mentions</span></div>
          ${TOP.map(([q, n], i) => `<div class="rd-q"><i class="rd-rk">${i + 1}</i><span class="rd-qt">${x.esc(q)}</span><b class="rd-ct">${n}</b><i class="rd-bar" style="--w: ${(n / max).toFixed(4)}"></i></div>`).join('')}
        </div>
      </div>
      <div class="rd-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const list = card.querySelector('.rd-list'), n = card.querySelector('.rd-n');
    const top = card.querySelector('.rd-top'), tt = card.querySelector('.rd-tt');
    const rows = [...card.querySelectorAll('.rd-q')].map((q, i) => ({ q, ct: q.querySelector('.rd-ct'), bar: q.querySelector('.rd-bar'), n: TOP[i][1], shown: '' }));
    const ft = card.querySelector('.rd-ft');
    const spin = card.querySelector('.rd-spin'), ok = card.querySelector('.rd-st .qc-ok');
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
        // the collapse: the bubbles squeeze up and fade under the list
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
