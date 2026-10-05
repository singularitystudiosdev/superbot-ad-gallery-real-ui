// Watch beat: Gemini watches the latest video and reads every comment, then matches each top comment to the moment in
// the video that answers it (the facts the replies are written from). Its line streams and a 16:9 card rises: on the
// left the video (img/thumb-12-mics.jpg, drawn for the spot) with YouTube's red watched bar running under it, the title,
// "Watching the video" with the timecode, and a heat strip of the moments viewers mention (one bar per 16 s of the
// 14:32 runtime, built from the comments as they are read, its four peaks labelled as their rows land). On the right
// "Reading N comments" ticks up to 1,284 and the top five resolve as ranked rows (letter avatar, name, likes, tag, the
// comment with its timestamps in YouTube's link blue) each ending on its answer chip: the timestamp and what happens
// there, or "Not in the video" for the one request. The footer lands with the check. In the zoom cut the camera hands
// straight from the switch pill to the card (chat.js FOCUS) and holds while it fills. Every commenter is made up for
// the spot. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=3a8678e2';

const SAY = 'Watched all 14:32, read all 1,284 comments, and found the moment that answers each top one.';
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32', thumb: 'thumb-12-mics.jpg' };
const TOTAL = 1284;
const LEN_S = 14 * 60 + 32;
// chapter marks on the 14:32 bar (seconds): intro, desk setup, blind test, room test, USB vs XLR
const CHAPTERS = [118, 278, 372, 425, 580];
// the ranked top five: [name, comment, likes, tag, avatar colour, answer: [timestamp, what happens there] | null]
export const TOP = [
  ['Priya Nair', 'Which one would you actually buy for a small untreated room?', '2.1K', 'Asked 214 times', '#00897b', ['7:05', 'Room test']],
  ['Marco Ruiz', 'The blind test at 6:12 got me. Picked the $29 one every single time.', '1.4K', 'Praise', '#e8710a', ['6:12', 'Blind test']],
  ['Lena Fischer', 'What\'s that boom arm at 4:38? Looks so clean on the desk.', '986', 'Gear question', '#1967d2', ['4:38', 'Desk setup']],
  ['Dee Okafor', 'Headsets next please, half of us stream on them', '742', 'Request', '#9334e6', null],
  ['Tom Hale', 'Didn\'t expect the USB one to beat the XLR ones. Great video.', '515', 'Praise', '#d01884', ['9:40', 'USB vs XLR']],
];
const DONE = '5 of 1,284 picked: 4 answered on camera, 1 request for a new video';
// the heat strip: one bin per 16 s; viewers' timestamp mentions cluster on the four moments the rows point to
const BIN = 16;
const BINS = Math.ceil(LEN_S / BIN);
const PEAKS = [[425, 1], [372, 0.82], [278, 0.6], [580, 0.5]]; // [second, height], in TOP's answer order below
const noise = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
const HEAT = Array.from({ length: BINS }, (_, i) => {
  const s = (i + 0.5) * BIN;
  let h = 0.05 + 0.09 * noise(i) + (s < 60 ? 0.08 : 0);
  for (const [p, a] of PEAKS) h += a * Math.exp(-(((s - p) / 15) ** 2));
  return Math.min(1, h);
});
// which heat peak each ranked row's answer lights up (index into PEAKS), by row
const PEAK_OF = [0, 1, 2, -1, 3];
// a peak's badge (its row's rank) sits on its tallest bin
const peakTop = (s) => { const i = Math.floor(s / BIN); return Math.max(HEAT[i - 1] || 0, HEAT[i], HEAT[i + 1] || 0); };
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 110;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.16;                  // the card landing to the playhead starting
const PLAY = 0.55; /* deliberate */    // the playhead sweeping the whole video
const COUNT_AT = -0.08;                // the counter starts as the playhead lands its last stretch
const COUNT = 0.6; /* deliberate */    // the counter running up to 1,284 (its bar and the heat strip fill with it)
const ROW_AT = 0.16;                   // the counter starting to the first ranked row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const CHIP_AT = 0.1;                   // a row landing to its answer chip (and its heat peak's label)
const CHIP_IN = 0.2;
const FOOT_AT = 0.16;                  // the last chip to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const FOCUS_AT = 0.14; /* deliberate */  // the card has started rising, then the camera hands over from the pill to it
const FOCUS_PUSH = 0.5; /* deliberate */ // push-in, outQuint
const HOLD_DONE = 0.36; /* deliberate */ // the footer read, pushed in, before the pull-back
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');
const PLAY_I = '<svg class="wv-pl" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.2v7.6L9.8 6z"/></svg>';
// YouTube turns a timestamp in a comment into a link: the comment text gets the same blue
const linkTimes = (s, esc) => esc(s).replace(/\b(\d{1,2}:\d{2})\b/g, '<a class="wv-ts">$1</a>');
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = TOP.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.chip = T.row.map((a) => a + CHIP_AT);
    T.foot = Math.max(T.chip[TOP.length - 1] + FOOT_AT, T.c1);
    T.done = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL, fill: 0.93 };
    }
    T.end = T.focus ? T.focus.back : T.done;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const peakAt = PEAKS.map(([s]) => s);
    const card = x.el(`<div class="wv-card">
      <div class="wv-l">
        <span class="wv-th"><img src="${x.img(VIDEO.thumb)}" width="1280" height="720" alt=""/><i class="wv-len">${VIDEO.len}</i><i class="wv-red"><i></i></i></span>
        <b class="wv-title">${x.esc(VIDEO.title)}</b>
        <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span>Watching the video<span class="wv-tc">0:00 / ${VIDEO.len}</span></span>
        <i class="wv-bar"><i class="wv-fill"></i>${CHAPTERS.map((c) => `<u style="left: ${((c / LEN_S) * 100).toFixed(3)}%"></u>`).join('')}<i class="wv-head"></i></i>
        <div class="wv-heat">
          <small>Moments viewers mention, by rank</small>
          <div class="wv-hb">${HEAT.map((h, i) => `<i style="--h: ${h.toFixed(3)}" data-i="${i}"></i>`).join('')}
            ${peakAt.map((s, pk) => `<em class="wv-pk" style="left: ${((s / LEN_S) * 100).toFixed(3)}%; bottom: calc(${(peakTop(s) * 100).toFixed(2)}% + 3px)">${PEAK_OF.indexOf(pk) + 1}</em>`).join('')}</div>
          <span class="wv-ax"><span>0:00</span><span>${VIDEO.len}</span></span>
        </div>
      </div>
      <div class="wv-r">
        <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> comments</b><span class="wv-by">Top 5 by likes and repeats</span></div>
        <i class="wv-cbar"><i></i></i>
        <div class="wv-list">${TOP.map(([name, text, likes, tag, c, ans], i) => `<div class="wv-row"><span class="wv-rk">${i + 1}</span><span class="wv-av" style="--c: ${c}">${x.esc(name[0])}</span>
          <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-lk">${THUMB}${likes}</span><span class="wv-tag">${x.esc(tag)}</span></span><span class="wv-tx">${linkTimes(text, x.esc)}</span></div>
          ${ans ? `<span class="wv-ans">${PLAY_I}<b>${ans[0]}</b><span>${x.esc(ans[1])}</span></span>` : '<span class="wv-ans wv-none"><span>Not in the video</span></span>'}</div>`).join('')}</div>
      </div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const red = $('.wv-red i');
    const bins = [...card.querySelectorAll('.wv-hb > i')], pks = [...card.querySelectorAll('.wv-pk')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')], chips = [...card.querySelectorAll('.wv-ans')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', tcode = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: a fast run through the whole video; YouTube's red watched bar fills under the thumbnail with it
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        red.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u, i) => u.classList.toggle('on', p * LEN_S >= CHAPTERS[i]));
        const c = `${clock(Math.round(p * LEN_S))} / ${VIDEO.len}`;
        if (c !== tcode) { tc.textContent = c; tcode = c; }
        status(vSt, t, T.card, T.p1);

        // the comment counter and its bar; the heat strip builds from the comments as they are read
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);
        bins.forEach((b, i) => {
          // each bin rises as the share of comments read passes it (a left-to-right wave that settles)
          const g = outCubic(seg(q * 1.25 - (i / BINS) * 0.25, 0, 1));
          b.style.transform = `scaleY(${g.toFixed(4)})`;
        });

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          const a = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          chips[i].style.opacity = a.toFixed(3);
          chips[i].style.transform = a >= 1 ? 'none' : `translateX(${((1 - a) * 8).toFixed(2)}px)`;
          const pk = PEAK_OF[i];
          if (pk >= 0) {
            pks[pk].style.opacity = a.toFixed(3);
            pks[pk].style.transform = `translate(-50%, ${((1 - a) * 4).toFixed(2)}px)`;
          }
        });
        // a peak's bins light up in the link blue once its row has claimed it
        bins.forEach((b, i) => {
          const s = (i + 0.5) * BIN;
          const pk = PEAKS.findIndex(([ps]) => Math.abs(s - ps) <= BIN * 1.05);
          const row = pk >= 0 ? PEAK_OF.indexOf(pk) : -1;
          b.classList.toggle('on', row >= 0 && t >= T.chip[row]);
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
