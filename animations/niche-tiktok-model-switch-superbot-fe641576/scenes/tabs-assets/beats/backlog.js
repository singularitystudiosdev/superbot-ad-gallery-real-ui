// Watch beat (the Discord remake's backlog.js, re-skinned): Gemini watches the whole episode. Its line streams, a card
// rises ("Watching episode_42.mp4", a running timecode), and inside it the episode's transcript (mono timestamps, one
// line each) scrolls fast from the top to the end of the episode while the timecode runs 00:00 to 52:18. Then the
// scroll glides back and settles on the 31:07 line, which lights up as the hook, and the three moments Gemini found
// land as chips under the window, one by one, the last one the gold "Best hook at 31:07".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Watched all 52 minutes. The best clip is 31:07 to 31:52.';
const LABEL = 'Watching episode_42.mp4';
const TOTAL = 52 * 60 + 18;            // the episode, in seconds (52:18)
// the episode's transcript, as Gemini reads it: [timestamp, line]. Made up for the spot (img/CREDITS.txt).
const ROWS = [
  ['03:12', 'so how long did you plan before you quit?'],
  ['08:40', 'honestly? about two weeks'],
  ['12:44', '(both laughing) I cried in a Costco parking lot'],
  ['19:05', "the first paycheck that doesn't come is weird"],
  ['24:30', 'okay we have to talk about health insurance'],
  ['31:07', "the scary part isn't quitting. it's month two."],
  ['31:22', 'month one feels like a vacation'],
  ['31:40', 'month two you check your bank app nine times a day'],
  ['38:15', 'what would you tell yourself at 25?'],
  ['44:51', 'start the side thing before you need it'],
  ['49:02', 'okay, rapid fire'],
];
const HOOK = 5;                        // the 31:07 line
const CHIPS = ['Laugh spike at 12:44', 'Quotable at 44:51'];
const BEST = 'Best hook at 31:07';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the transcript scrolling past, start to end (the timecode runs with it)
const BACK = 0.34;                     // the scroll gliding back to the hook line
const LIGHT = 0.2;                     // the hook line lighting up
const CHIPS_AT = 0.06;                 // the hook lit, then the first chip
const STAGGER = 0.08;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 28;                        // one row's height, px
const HOOK_SLOT = 1;                   // the hook line settles in this visible slot (0 = top)

const tc = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.b1 = T.s1 + BACK;                                  // settled on the hook line
    T.chip = [...CHIPS, BEST].map((_, i) => T.b1 + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bk-card">
      <div class="bk-hd"><span class="bk-st"><i class="bk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="bk-cnt"><b class="bk-n">00:00</b><i>/</i>52:18</span></div>
      <div class="bk-bar"><i class="bk-fill"></i></div>
      <div class="bk-vp">
        <div class="bk-list">${ROWS.map(([ts, txt], i) => `<div class="bk-row${i === HOOK ? ' bk-hook' : ''}"><span class="bk-ts">[${ts}]</span><span class="bk-tx">${x.esc(txt)}</span></div>`).join('')}</div>
      </div>
      <div class="bk-chips">${CHIPS.map((c) => `<span class="bk-chip">${x.esc(c)}</span>`).join('')}<span class="bk-chip bk-ment">${x.esc(BEST)}</span></div>
    </div>`);
    const list = card.querySelector('.bk-list'), n = card.querySelector('.bk-n'), fill = card.querySelector('.bk-fill');
    const rows = [...card.querySelectorAll('.bk-row')], hook = rows[HOOK];
    const chips = [...card.querySelectorAll('.bk-chip')];
    const spin = card.querySelector('.bk-spin'), ok = card.querySelector('.bk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;            // the scroll to the end of the transcript
    const rest = (HOOK - HOOK_SLOT) * ROW;               // ...and back to the hook line
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

        // the scroll: start to end, fast through the middle (a touch of blur at speed), the timecode running with it;
        // then it glides back up to the hook line
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        const back = inOutCubic(seg(t, T.s1, T.b1));
        list.style.transform = `translateY(${(-lerp(span * e, rest, back)).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = tc(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${outCubic(p).toFixed(4)})`;

        // done watching: the spinner resolves to the check as the timecode lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the hook line lights up as the scroll settles on it; the others dim
        const l = outCubic(seg(t, T.b1 - LIGHT * 0.5, T.b1 + LIGHT * 0.5));
        hook.style.setProperty('--lit', l.toFixed(3));
        rows.forEach((row, i) => { if (i !== HOOK) row.style.opacity = (1 - 0.45 * l).toFixed(3); });

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
