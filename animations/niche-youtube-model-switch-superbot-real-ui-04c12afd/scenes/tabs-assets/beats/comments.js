// Comments beat: GPT-6 Luna (OpenAI's fast, low-cost tier) reads every comment on the latest video, the bulk job it is
// priced for. Its line streams and a card rises: the video it is reading (thumbnail, img/mic-frame.jpg, the real Pexels
// photo, img/CREDITS.txt; title; 1,284 comments), "Reading N comments" ticking up to 1,284 with its bar, then the top
// five resolve as ranked rows (letter avatar, @handle, the comment, its like count, one tag). Two rows carry a
// "Needs the video" chip: Priya's question is answered by the room test and Lena's by the 4:38 frame, which is why the
// next hand-off goes to a model that watches video. The footer lands on that hand-off. The grammar is the base's
// research card (header with spinner resolving to the check, a counter, staggered rows). Every commenter is made up for
// the spot. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=04c12afd';

const SAY = 'Reading all 1,284 comments to rank the top five.';
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32' };
const TOTAL = 1284;
// the ranked top five: [handle, comment, likes, tag, avatar colour, needs the video]
export const TOP = [
  ['@priyanair', 'Which one would you actually buy for a small untreated room? Mine echoes like a bathroom.', '2.1K', 'Asked 214 times', '#00897b', true],
  ['@marcoruiz', 'The blind test at 6:12 got me. Picked the $29 one every single time, over mics three times the price.', '1.4K', 'Praise', '#e8710a', false],
  ['@lenafischer', 'What\'s that boom arm at 4:38? Looks so clean on the desk, I need one.', '986', 'Question', '#1967d2', true],
  ['@deeokafor', 'Headsets next please, half of us stream on them and nobody tests those properly', '742', 'Request', '#9334e6', false],
  ['@tomhale', 'Didn\'t expect the USB one to beat the XLR ones. Great video, subbed.', '515', 'Praise', '#d01884', false],
];
const DONE = 'Top five ranked. Two questions are answered only in the video.';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.16;                 // the card landing to the comment counter starting
const COUNT = 0.55; /* deliberate */   // the counter running up to 1,284 (its bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first ranked row
const STAGGER = 0.09;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const CHIP_AT = 0.12;                  // a row landing to its "Needs the video" chip
const CHIP_IN = 0.2;                   // a chip popping in
const FOOT_AT = 0.08;                  // the last row landed to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const HOLD = 0.1;                      // the footer settled to the next pill's GAP
const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');
const PLAY = '<svg class="cm-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = TOP.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.chip = TOP.map((_, i) => T.row[i] + CHIP_AT); // each chip pops just after its row (only the video rows have one)
    T.foot = Math.max(T.row[TOP.length - 1] + ROW_IN, T.c1) + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid cm-vid">
        <span class="wv-th"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><i class="wv-len">${VIDEO.len}</i></span>
        <div class="wv-meta"><b class="wv-title">${x.esc(VIDEO.title)}</b><span class="cm-sub">Sam Rivera · 1,284 comments</span></div>
      </div>
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> comments</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-list">${TOP.map(([name, text, likes, tag, c, vid], i) => `<div class="wv-row"><span class="wv-rk">${i + 1}</span><span class="wv-av" style="--c: ${c}">${x.esc(name[1].toUpperCase())}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-lk">${THUMB}${likes}</span><span class="wv-tag">${x.esc(tag)}</span>${vid ? `<span class="cm-vchip">${PLAY}Needs the video</span>` : ''}</span><span class="wv-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.wv-st .wv-spin'), ok: $('.wv-st .qc-ok') };
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')];
    const chips = [...card.querySelectorAll('.wv-row')].map((row, i) => ({ c: row.querySelector('.cm-vchip'), at: T.chip[i] })).filter((o) => o.c);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[2], rows[2]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the comment counter and its bar; the spinner resolves to the check when it reaches 1,284
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        chips.forEach(({ c, at }) => {
          const o = outCubic(seg(t, at, at + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `scale(${lerp(0.8, 1, o).toFixed(4)})`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
