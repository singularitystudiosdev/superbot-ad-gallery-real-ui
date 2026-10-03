// Rule beat: Gemini turns the typed sentence into the watch rule. Its line streams, a card rises carrying the ask
// itself, and the words that matter light up one phrase at a time; each lit phrase pops its rule chip into the row
// below: Every position / Drops more than 5% / Since yesterday's close / Today, 9:30 AM to 4:00 PM ET / Text message.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount, esc } from '../../../lib.js';

const SAY = 'Turned your sentence into one watch rule.';
// [phrase in the ask that lights, the chip it becomes]; chips land in this order (two come from "today")
const RULES = [
  ['my portfolio', 'Every position'],
  ['drops more than 5%', 'Drops more than 5%'],
  ['today', "Since yesterday's close"],
  ['today', 'Today, 9:30 AM to 4:00 PM ET'],
  ['text me', 'Text message'],
];
const CPS = 100;                     // the reply line streams at this many characters a second (the source's beats)
const SAY_AT = 0.048;                // reply start to the line's first character
const CARD_AT = 0.12;                // reply start to the card rising in
const RISE = 0.3;                    // the card rising in
const CHIP_AT = 0.42;                // reply start to the first chip popping
const STAGGER = 0.12;                // one chip to the next
const LIGHT = 0.1;                   // a phrase lights this long before its chip pops
const POP = 0.2; /* deliberate */    // a chip popping in (scale 0.6 -> 1)
const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.chip = RULES.map((_, i) => r + CHIP_AT + i * STAGGER);
    // the last visible change: the last chip settles (r + 1.1), or the line's last character
    T.end = Math.max(T.chip[RULES.length - 1] + POP, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const ask = x.ask;
    // the ask, cut into plain runs and the lit phrases (each phrase once, at its first match)
    const phrases = [...new Set(RULES.map(([p]) => p))];
    const cuts = phrases.map((p) => [ask.indexOf(p), p]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0]);
    let html = '', at = 0;
    for (const [i, p] of cuts) { html += esc(ask.slice(at, i)) + `<span class="rl-w" data-p="${esc(p)}">${esc(p)}</span>`; at = i + p.length; }
    html += esc(ask.slice(at));
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rl-card">
      <div class="rl-q">${html}</div>
      <div class="rl-hd">${BELL}<b>Watch rule</b></div>
      <div class="rl-chips">${RULES.map(([, c]) => `<span class="rl-chip">${x.esc(c)}</span>`).join('')}</div>
    </div>`);
    const words = [...card.querySelectorAll('.rl-w')];
    const chips = [...card.querySelectorAll('.rl-chip')];
    // each phrase lights at the first chip it feeds
    const lightAt = words.map((w) => T.chip[RULES.findIndex(([p]) => p === w.dataset.p)] - LIGHT);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`;
        words.forEach((w, i) => {
          const e = outCubic(seg(t, lightAt[i], lightAt[i] + 0.16));
          w.style.setProperty('--lit', e.toFixed(3));
          w.classList.toggle('on', e > 0.5);
        });
        chips.forEach((c, i) => {
          const e = outCubic(seg(t, T.chip[i], T.chip[i] + POP));
          c.style.opacity = e.toFixed(3);
          c.style.transform = e >= 1 ? 'none' : `scale(${lerp(0.6, 1, e).toFixed(4)})`;
        });
      },
    };
  },
};
