// Backlog beat: Gemini learns Sam's voice. Its line streams, a card rises ("Reading your past replies on X", a reply
// counter), and inside it an X-styled window of compact rows (Sam's colour-circle avatar, the name, one of Sam's
// own past replies, the date) scrolls fast from the oldest to now while the counter runs up to 312 replies. Then the
// read resolves: the rows dim under a scrim and the traits of the voice land as chips over them, one by one, the
// last one the gold "Your voice, matched".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Learned your voice from 312 of your past replies.';
const LABEL = 'Reading your past replies on X';
const TOTAL = 312;
// Sam's own past replies, oldest first: [text, date]. Made up for the spot.
const ROWS = [
  ['Fixed in 1.9.2, thanks for flagging Ana.', 'Mar 4'],
  ['Good catch. Shipping a fix tonight.', 'Mar 19'],
  ['Not yet, it is on the list for spring.', 'Apr 2'],
  ['Thanks Omar, that made my day.', 'Apr 15'],
  ['Yes, export works on the free plan too.', 'May 7'],
  ['That one is on us. Patch goes out Monday.', 'May 21'],
  ['Love this setup, Kim. Mind if I share it?', 'Jun 3'],
  ['Dark mode lands in 1.9, end of June.', 'Jun 12'],
  ['Thanks Ravi. Two of us, nine months.', 'Jul 1'],
  ['Good idea. Adding it to the board now.', 'Jul 18'],
  ['Not on Android yet. Later this year.', 'Aug 6'],
  ['Fixed in 1.9.6, should be live now.', 'Aug 22'],
  ['Thank you, Dee. Means a lot to us.', 'Sep 9'],
  ['Yes, calendars sync both ways.', 'Sep 17'],
  ['On it. Expect a fix by Thursday.', 'Sep 25'],
  ['Thanks Theo, glad it helps the team.', 'Sep 30'],
];
const TRAITS = ['Short and direct', 'Uses first names', 'Gives a date', 'No hashtags'];
const MATCHED = 'Your voice, matched';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the past replies scrolling past, oldest to now (the counter runs with it)
const CHIPS_AT = 0.82;                 // the card landing to the first trait chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 28;                        // one row's height, px

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...TRAITS, MATCHED].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bk-card">
      <div class="bk-hd"><span class="bk-st"><i class="bk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="bk-cnt"><b class="bk-n">0</b> replies</span></div>
      <div class="bk-vp">
        <div class="bk-list">${ROWS.map(([txt, d]) => `<div class="bk-row"><span class="bk-av">S</span><b>Sam Rivera</b><span class="bk-tx">${x.esc(txt)}</span><small>${x.esc(d)}</small></div>`).join('')}</div>
        <i class="bk-scrim"></i>
        <div class="bk-chips">${TRAITS.map((tp) => `<span class="bk-chip">${x.esc(tp)}</span>`).join('')}<span class="bk-chip bk-ment">${x.esc(MATCHED)}</span></div>
      </div>
    </div>`);
    const list = card.querySelector('.bk-list'), n = card.querySelector('.bk-n'), scrim = card.querySelector('.bk-scrim');
    const chips = [...card.querySelectorAll('.bk-chip')];
    const spin = card.querySelector('.bk-spin'), ok = card.querySelector('.bk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
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

        // the scroll: oldest to now, fast through the middle (a touch of blur at speed), the counter running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = fmt(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the read resolves into the voice: the rows dim under the scrim, the trait chips land over them
        scrim.style.opacity = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2)).toFixed(3);
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
