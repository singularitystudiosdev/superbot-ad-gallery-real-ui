// Sort beat: GPT-6 Luna (OpenAI's model for cost-sensitive, high-volume workloads) reads all 1,284 comments and groups
// them by what people actually ask. Its line streams and a card rises in the base's research grammar: "Sorting N
// comments" counting up to 1,284 behind a thin bar ("Sorted" once it lands), then the five comments worth answering as rows (the commenter's
// YouTube avatar, @handle, like count, the comment, and a tag: how many times the question was asked, or Praise). The two
// questions only the video can answer carry a "needs the video" chip, and the footer hands that on: "5 to answer. 2
// need the video." Rows take no room until they land. That is the reason for the next switch (Gemini watches video natively). Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { yt } from './yt-real-icons.js?v=b73828a5';
import { COMMENTS, TOTAL, avatar } from './data.js?v=b73828a5';

const SAY = 'Sorting all 1,284 comments by what people actually ask.';
const DONE = '5 worth a reply. 2 need the video.';
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.12;                 // the card landing to the counter starting
const COUNT = 0.55; /* deliberate */    // the counter running up to 1,284 (its bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first row
const STAGGER = 0.1;                   // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const CHIP_AT = 0.16;                  // a row landing to its "needs the video" chip popping
const FOOT_AT = 0.14;                  // the last row landing to the footer
const FOOT_IN = 0.24;

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = COMMENTS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[COMMENTS.length - 1] + ROW_IN + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card so-card">
      <div class="wv-ch so-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b><span class="so-verb">Sorting</span> <span class="wv-n">0</span> comments</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-list">${COMMENTS.map((c) => `<div class="wv-row">${avatar(c, 'so-av')}
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(c.handle)}</b><span class="wv-lk">${yt('like')}${c.likes}</span>
          ${c.video ? `<span class="so-vid"><img src="${x.brand('youtube-icon.svg')}" alt=""/>needs the video</span>` : ''}<span class="wv-tag">${x.esc(c.tag)}</span></span>
          <span class="wv-tx">${x.esc(c.text)}</span></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.wv-spin'), ok: $('.wv-st .qc-ok') };
    const verb = $('.so-verb'), ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')].map((row) => ({ row, chip: row.querySelector('.so-vid') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], ...rows.map(({ row }, i) => [T.row[i], row]), [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and its bar
        ch.style.opacity = '1';
        cbarW.style.opacity = '1';
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const v = t >= T.c1 ? 'Sorted' : 'Sorting';
        if (verb.textContent !== v) verb.textContent = v;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach(({ row, chip }, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          // a row takes no room until it lands, then grows to its height (the card never sits half empty)
          row.style.display = o <= 0 ? 'none' : '';
          if (o > 0) { row.style.height = ''; const h = row.offsetHeight; row.style.height = o >= 1 ? '' : `${(h * o).toFixed(2)}px`; }
          row.style.opacity = o.toFixed(3);
          if (chip) {
            const c = outCubic(seg(t, T.row[i] + CHIP_AT, T.row[i] + CHIP_AT + 0.2));
            chip.style.opacity = c.toFixed(3);
            chip.style.transform = c >= 1 ? 'none' : `scale(${lerp(0.7, 1, c).toFixed(4)})`;
          }
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
