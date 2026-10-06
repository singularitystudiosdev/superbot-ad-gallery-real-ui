// Rank beat: Gemini finds the top comments. Its line streams and a card rises: the video row (the composed thumbnail,
// img/thumb-12mics.jpg, with its 14:32 chip, title, channel line), two counters resolving to checks ("Read 1,284
// comments", "Merged repeats into 38 questions") over one bar, then the ranked five, each with its like count, a bar
// of how many viewers asked the same thing, and the moment in the video that answers it (a frame cropped from the
// photo, the timestamp, the chapter). Dee's has no moment: it is a request, so it reads "Next video". The footer
// lands last. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba8f0993';
import { VIDEO, TOP, ACCOUNT } from './data.js?v=ba8f0993';

const SAY = 'Read all 1,284 comments, merged the repeats, and matched each top question to the moment that answers it.';
const DONE = '5 comments to answer, each tied to the moment in the video that answers it';
const MAX_SAME = Math.max(...TOP.map((c) => c.same));
// timing (seconds from the reply start, or from the card where noted)
const CPS = 110;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.14;                     // reply start to the card rising in
const RISE = 0.34;                     // the card rising in
const READ_AT = 0.1;                   // the card landing to the read counter starting
const READ = 0.55; /* deliberate */    // the counter running up to 1,284 (the bar fills with it)
const MERGE_AT = 0.3;                  // the read counter starting to the merge counter starting
const MERGE = 0.4;                     // 0 -> 38 questions
const ROW_AT = 0.2;                    // the merge counter starting to the first ranked row
const STAGGER = 0.1;                   // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const BAR_IN = 0.3;                    // a row's same-question bar filling
const AT_AT = 0.12;                    // a row landing to its moment chip popping in
const AT_IN = 0.2;
const FOOT_AT = 0.14;                  // the last moment chip to the footer
const FOOT_IN = 0.24;
const READ_HOLD = 0.12; /* deliberate */ // the finished table holds a beat before the next pill (the spot stays at the source's 26.3 s)

const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + READ_AT;
    T.c1 = T.c0 + READ;
    T.m0 = T.c0 + MERGE_AT;
    T.m1 = T.m0 + MERGE;
    T.row = TOP.map((_, i) => T.m0 + ROW_AT + i * STAGGER);
    T.at = T.row.map((s) => s + AT_AT);
    T.foot = T.at[TOP.length - 1] + AT_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + READ_HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const frame = (c) => (c.at
      ? `<span class="rk-fr"><img src="${x.img(VIDEO.frame)}" width="1280" height="720" alt="" style="object-position: ${c.crop[0]}; transform: scale(${c.crop[1]}); transform-origin: ${c.crop[0]}"/><i>${ms('play-arrow')}</i></span><span class="rk-atx"><b>${c.at}</b><small>${x.esc(c.what)}</small></span>`
      : `<span class="rk-fr rk-fr-next">${ms('schedule')}</span><span class="rk-atx"><b>${x.esc(c.what)}</b><small>Not in this one</small></span>`);
    const card = x.el(`<div class="rk-card">
      <div class="rk-vid">
        <span class="rk-th"><img src="${x.img(VIDEO.thumb)}" width="1280" height="720" alt=""/><i class="rk-len">${VIDEO.len}</i></span>
        <div class="rk-meta">
          <b class="rk-title">${x.esc(VIDEO.title)}</b>
          <span class="rk-sub">${x.esc(ACCOUNT)} · ${VIDEO.views} · ${VIDEO.age}</span>
          <span class="rk-stats">
            <span class="rk-stat"><span class="rk-st"><i class="rk-spin"></i>${x.OK}</span>Read <b class="rk-n">0</b> comments</span>
            <span class="rk-stat rk-stat2"><span class="rk-st"><i class="rk-spin"></i>${x.OK}</span>Merged into <b class="rk-q">0</b> questions</span>
          </span>
          <i class="rk-bar"><i></i></i>
        </div>
      </div>
      <div class="rk-cols"><span>Top comments</span><span>Asked the same</span><span>Answered at</span></div>
      <div class="rk-list">${TOP.map((c, i) => `<div class="rk-row">
        <span class="rk-rk">${i + 1}</span><span class="rk-av" style="--c: ${c.c}">${x.esc(c.name[0])}</span>
        <div class="rk-main"><span class="rk-l1"><b>${x.esc(c.name)}</b><span class="rk-lk">${THUMB}${c.likes}</span></span><span class="rk-tx">${x.esc(c.text)}</span></div>
        <span class="rk-same"><i class="rk-sb"><i style="width: ${((c.same / MAX_SAME) * 100).toFixed(1)}%"></i></i><b>${c.same}</b></span>
        <span class="rk-at">${frame(c)}</span>
      </div>`).join('')}</div>
      <div class="rk-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [rSt, mSt] = [...card.querySelectorAll('.rk-st')].map((n) => ({ spin: n.querySelector('.rk-spin'), ok: n.querySelector('.qc-ok') }));
    const n = $('.rk-n'), q = $('.rk-q'), bar = $('.rk-bar i'), stat2 = $('.rk-stat2'), cols = $('.rk-cols'), ft = $('.rk-ft');
    const rows = [...card.querySelectorAll('.rk-row')].map((row) => ({
      row, sb: row.querySelector('.rk-sb i'), same: row.querySelector('.rk-same b'), at: row.querySelector('.rk-at'),
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', qs = '';
    const sames = rows.map(() => '');

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[2], rows[2].row], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // read: 0 -> 1,284 with the bar; merge: 0 -> 38 questions
        const p = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(VIDEO.comments * p));
        if (cn !== count) { n.textContent = cn; count = cn; }
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        status(rSt, t, T.c0, T.c1);
        stat2.style.opacity = outCubic(seg(t, T.m0 - 0.12, T.m0 + 0.08)).toFixed(3);
        const mq = String(Math.round(VIDEO.questions * inOutCubic(seg(t, T.m0, T.m1))));
        if (mq !== qs) { q.textContent = mq; qs = mq; }
        status(mSt, t, T.m0, T.m1);
        cols.style.opacity = outCubic(seg(t, T.row[0] - 0.1, T.row[0] + 0.14)).toFixed(3);

        rows.forEach((r, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          r.row.style.opacity = o.toFixed(3);
          r.row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          const b = outCubic(seg(t, T.row[i] + 0.06, T.row[i] + 0.06 + BAR_IN));
          r.sb.style.transform = `scaleX(${b.toFixed(4)})`;
          const sv = String(Math.round(TOP[i].same * b));
          if (sv !== sames[i]) { r.same.textContent = sv; sames[i] = sv; }
          const a = outCubic(seg(t, T.at[i], T.at[i] + AT_IN));
          r.at.style.opacity = a.toFixed(3);
          r.at.style.transform = a >= 1 ? 'none' : `translateX(${((1 - a) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
