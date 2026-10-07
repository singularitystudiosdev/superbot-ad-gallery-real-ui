// Watch beat: Gemini 3.8 Flash watches the latest video and reads its comments. It is the one model in the route that
// takes video natively (the 14:32 upload goes in whole) and its long context holds all 1,284 comments at once, so it both
// ranks the comments AND finds where in the video each question is answered. Its line streams and a card rises. First
// the video: its thumbnail (img/mic-frame.jpg, the real Pexels photo, img/CREDITS.txt) with the 14:32 duration chip, the
// title, and a playhead sweeping a progress bar with chapter ticks under "Watching the video" (spinner resolving to the
// check). Then "Reading N comments" ticks up to 1,284 and the top five resolve as ranked rows (letter avatar, name, the
// comment, its like count, one tag saying where the answer is: a timestamp in the video, or "Not in the video" for Kai's
// firmware question, which is what hands the job to Grok next), and the footer lands.
// The grammar is the base's research card (header with spinner resolving to the check, a counter, staggered rows).
// Every commenter is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=0b34d5a7';

const SAY = 'Watched all 14:32 and read 1,284 comments. One question isn\'t answered in the video.';
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32' };
const TOTAL = 1284;
// chapter marks on the 14:32 bar (seconds): the ticks the playhead runs past
const CHAPTERS = [118, 278, 372, 425, 640];
const LEN_S = 14 * 60 + 32;
// the ranked top five (by likes): who, their @handle (Studio lists commenters by handle), the comment, likes, where the
// answer lives (a timestamp Gemini found in the video; warn = not in it), the avatar colour, and the subscriber count
// Studio badges beside a handle. Every commenter is made up for the spot.
export const TOP = [
  { name: 'Priya Nair', handle: '@priyanair', text: 'Which one would you actually buy for a small untreated room?', likes: '2.1K', tag: 'Answered at 7:05', c: '#00897b', subs: '1.2K' },
  { name: 'Marco Ruiz', handle: '@marcoruiz', text: 'The blind test at 6:12 got me. Picked the $29 one every single time.', likes: '1.4K', tag: 'Praise', c: '#e8710a', subs: '318' },
  { name: 'Kai Brooks', handle: '@kaibrooks', text: 'Did the 2.1 firmware fix the hiss on the $49 one?', likes: '1.1K', tag: 'Not in the video', c: '#d93025', subs: '74', warn: true },
  { name: 'Lena Fischer', handle: '@lenafischer', text: 'What\'s that boom arm at 4:38? Looks so clean on the desk.', likes: '986', tag: 'Seen at 4:38', c: '#1967d2', subs: '2.4K' },
  { name: 'Dee Okafor', handle: '@deeokafor', text: 'Headsets next please, half of us stream on them', likes: '742', tag: 'Request', c: '#9334e6', subs: '905' },
];
const DONE = 'Top 5 of 1,284 ranked. 3 are questions: 2 answered in the video, 1 newer than it';
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
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = TOP.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
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
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> comments</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-list">${TOP.map(({ name, text, likes, tag, c, warn }, i) => `<div class="wv-slot"><div class="wv-row"><span class="wv-rk">${i + 1}</span><span class="wv-av" style="--c: ${c}">${x.esc(name[0])}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-lk">${THUMB}${likes}</span><span class="wv-tag${warn ? ' wv-warn' : ''}">${x.esc(tag)}</span></span><span class="wv-tx">${x.esc(text)}</span></div></div></div>`).join('')}</div>
      <div class="wv-slot"><div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', clock = '';

    // a slot's height follows its content's eased entrance (auto once landed, 0 before)
    const slot = (n, o) => {
      const s = n.parentElement;
      const want = o >= 1 ? '' : `${(n.offsetHeight * o).toFixed(2)}px`;
      if (s.style.height !== want) s.style.height = want;
    };
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

        // each row (and the footer) opens its own slot as it lands, so the card is only ever as tall as what is in it
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          slot(row, o);
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        slot(ft, f);
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
