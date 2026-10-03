// Reading beat: Gemini reads the user's 40 saved articles on sleep. Its line streams and a card rises (the base's
// compact-card grammar, no tabs, no footer controls): a flat glyph, "Reading list" with the muted "40 articles", a
// big counter ticking up to "186,420" words, a thin bar filling once, and a window where the article titles scroll
// past while the counter runs. Under the rows a status line: a spinner and "Reading 40 articles", which resolves to
// the green check and "46 ideas found in 40 articles". Every title and number is made up for the spot (no author
// names). Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { oi } from './obsidian-icons.js?v=d1018d78';

const SAY = 'Read all 40 articles and pulled 46 ideas worth a note';
export const LIST = { title: 'Reading list', meta: '40 articles', words: 186420 };
// the article titles that scroll past (exact, per the spec)
export const TITLES = [
  'What deep sleep does for memory',
  'The case for the afternoon nap',
  'REM sleep and how we process fear',
  'Caffeine, adenosine and the late coffee',
  'Why all-nighters backfire before exams',
  'Light, melatonin and screens',
  'Sleep spindles and learning new skills',
  'How long a nap should really be',
];
const READING = 'Reading 40 articles';
const DONE = '46 ideas found in 40 articles';
const ROW_H = 26;                      // one title row (design px)
const SHOW = 4;                        // rows visible in the window
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.24;                   // the card landing to the counter starting
const RUN = 1.15; /* deliberate */     // the counter running up to 186,420 (the bar fills, the titles scroll past)
const ROW_IN = 0.18;                   // a title fading up as it enters the window
const DONE_IN = 0.24;                  // the status line's text crossfade
const HOLD = 0.3; /* deliberate */     // the result reads before the next status line

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + RUN_AT;
    T.c1 = T.c0 + RUN;
    T.end = Math.max(T.c1 + DONE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rd-card">
      <div class="rd-q">
        <span class="rd-doc">${oi('newspaper')}</span>
        <div class="rd-meta">
          <span class="rd-title"><b>${x.esc(LIST.title)}</b><span class="rd-sub">${x.esc(LIST.meta)}</span></span>
          <i class="rd-bar"><i class="rd-fill"></i></i>
        </div>
        <span class="rd-big"><b>0</b><small>words</small></span>
      </div>
      <div class="rd-win"><div class="rd-list">${TITLES.map((l) => `<div class="rd-row">${oi('file-text', 'rd-fi')}<span>${x.esc(l)}</span></div>`).join('')}</div></div>
      <div class="rd-st"><span class="rd-ic"><i class="rd-spin"></i>${x.OK}</span><span class="rd-tx"><span class="rd-a">${x.esc(READING)}</span><span class="rd-b">${x.esc(DONE)}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const fill = $('.rd-fill'), big = $('.rd-big b'), list = $('.rd-list');
    const rows = [...card.querySelectorAll('.rd-row')];
    const spin = $('.rd-spin'), ok = $('.rd-ic .qc-ok'), ta = $('.rd-a'), tb = $('.rd-b'), st = $('.rd-st');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';
    const span = (TITLES.length - SHOW) * ROW_H;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.c0 + 0.2, st]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter, the bar and the titles scrolling past, all on one clock
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = fmt(Math.round(LIST.words * q));
        if (c !== count) { big.textContent = c; count = c; }
        fill.style.transform = `scaleX(${q.toFixed(4)})`;
        const y = span * q;
        list.style.transform = `translateY(${(-y).toFixed(2)}px)`;
        rows.forEach((n, i) => {
          // a title fades up as it enters the window from below (the first SHOW are there when the card lands)
          const enter = i < SHOW ? T.card : T.c0 + ((i - SHOW + 1) * ROW_H / span) * (T.c1 - T.c0) - ROW_IN;
          n.style.opacity = outCubic(seg(t, enter, enter + ROW_IN)).toFixed(3);
        });

        // the status: spinner and "Reading 40 articles", then the check and the result
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const sw = seg(t, T.c1, T.c1 + DONE_IN);
        ta.style.opacity = (1 - outCubic(seg(sw, 0, 0.5))).toFixed(3);
        tb.style.opacity = outCubic(seg(sw, 0.5, 1)).toFixed(3);
        const si = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        st.style.opacity = si.toFixed(3);
      },
    };
  },
};
