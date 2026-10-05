// Watch beat (7c4a9f21): Gemini watches the latest video and turns 1,284 comments into a ranked shortlist. This is the
// first step of the ask ("answer the top comments"), so the output is not a raw list: a comment ranking board with a
// column per signal the decision actually rests on. Header row, then one row per top comment with its rank, author, the
// comment, a pull bar (likes + repeats + answerability, 0-100), the like count, how many times the question repeats and
// the point IN THE VIDEO the comment is about. The video row keeps the thumbnail, duration chip, title, playhead and
// chapter ticks, so the "watched the video" claim is visible, not just said. Footer names the ranking basis.
// Every commenter and number is made up for the spot. Pure function of t: every moving value is written from t, so ?t=
// and __AD.seek freeze any frame. Every class is prefixed .wv-.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=7c4a9f21';

const SAY = 'Watched the whole video and ranked its 1,284 comments.';
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32' };
const TOTAL = 1284;
// chapter marks on the 14:32 bar (seconds): the ticks the playhead runs past
const CHAPTERS = [118, 278, 372, 425, 640];
const LEN_S = 14 * 60 + 32;
// the ranked top five: [name, comment, likes, repeats, avatar colour, pull 0-100, video timecode, tag]
export const TOP = [
  ['Priya Nair', 'Which one would you actually buy for a small untreated room?', '2.1K', '842', '#00897b', 96, '6:12', 'Question'],
  ['Marco Ruiz', 'The blind test at 6:12 got me. Picked the $29 one every single time.', '1.4K', '311', '#e8710a', 91, '6:12', 'Praise'],
  ['Lena Fischer', 'What\'s that boom arm at 4:38? Looks so clean on the desk.', '986', '128', '#1967d2', 88, '4:38', 'Question'],
  ['Dee Okafor', 'Headsets next please, half of us stream on them', '742', '64', '#9334e6', 74, '14:10', 'Request'],
  ['Tom Hale', 'Didn\'t expect the USB one to beat the XLR ones. Great video.', '515', '41', '#d01884', 69, '9:47', 'Praise'],
];
const DONE = 'Top 5 of 1,284 ranked by likes, repeats and answerability';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the playhead starting
const PLAY = 0.6; /* deliberate */     // the playhead sweeping the whole video
const COUNT_AT = 0.08;                 // the video watched to the comment counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 1,284 (its bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first ranked row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const PULL_AT = 0.1;                   // a row landing to its pull bar filling
const PULL = 0.3;                      // the pull bar's fill
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');
const REPEAT = ms('comment-outline');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = TOP.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.pull = T.row.map((a) => a + PULL_AT);
    T.foot = Math.max(T.row[TOP.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid">
        <span class="wv-th"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><i class="wv-len">${VIDEO.len}</i></span>
        <div class="wv-meta">
          <b class="wv-title">${x.esc(VIDEO.title)}</b>
          <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span>Watching the video<span class="wv-tc">0:00</span></span>
          <i class="wv-bar"><i class="wv-fill"></i>${CHAPTERS.map((c) => `<u style="left: ${((c / LEN_S) * 100).toFixed(3)}%"></u>`).join('')}<i class="wv-head"></i></i>
        </div>
      </div>
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> comments</b><span class="wv-sig">likes · replies · repeats</span></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-hdr"><span></span><span></span><span>Comment</span><span>Pull</span><span>Likes</span><span>Asked</span><span>At</span></div>
      <div class="wv-list">${TOP.map(([name, text, likes, repeats, c, pull, at, tag], i) => `<div class="wv-row" style="--c: ${c}">
        <span class="wv-rk">${i + 1}</span><span class="wv-av">${x.esc(name[0])}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-tag">${x.esc(tag)}</span></span><span class="wv-tx">${x.esc(text)}</span></div>
        <span class="wv-pull"><i><u style="--v: ${pull}%"></u></i><b>${pull}</b></span>
        <span class="wv-lk">${THUMB}${likes}</span>
        <span class="wv-ask">${REPEAT}${repeats}×</span>
        <span class="wv-at">${at}</span></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')];
    const bars = rows.map((r) => r.querySelector('.wv-pull u'));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', clock = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[2], rows[2]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: a fast run through the whole video, easing in at the end; ticks it has passed light up
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u, i) => u.classList.toggle('on', p * LEN_S >= CHAPTERS[i]));
        const s = Math.round(p * LEN_S);
        const c = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        if (c !== clock) { tc.textContent = c; clock = c; }
        status(vSt, t, T.card, T.p1);

        // the comment counter and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          // the pull bar fills just after its row lands: the score that ranks it
          const g = outCubic(seg(t, T.pull[i], T.pull[i] + PULL));
          bars[i].style.transform = `scaleX(${(0.06 + 0.94 * g).toFixed(4)})`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};