// Rank beat: Gemini, the clause "the top comments". It reads every comment on the latest video, watches the video for
// the answers, and hands back the five that matter, each matched to the moment in the video that answers it. Its line
// streams and a card rises. The header's spinner turns while "Reading N comments" climbs to 1,284 and resolves to the
// check; the comment mix shares its line (the MIX legend, every kind's count climbing with the total) and one stacked
// bar of MIX runs under it, uncovered as the counter climbs, so 1,284 reads as data. Under that the video (its
// thumbnail, img/thumb.jpg, with the 14:32 badge, title, views and age) and a 14:32 scrubber with chapter ticks and
// the three answer moments (MOMENTS) lighting up as the playhead passes them. Then the ranked top
// five (rank, letter avatar, name, likes, kind chip, the "+214 asking the same" chip, the comment) with the bold thing
// on the right edge: the answer-moment chip (a 16:9 still of that moment, its timestamp in the accent blue, its label),
// or a muted "Reply only" slot of the same width. The footer lands with the check.
// The grammar is the base's research card (header with spinner resolving to the check, a counter, staggered rows).
// Every figure comes from content.js; every commenter is made up for the spot. Pure function of t: every moving value
// is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba89fddc';
import { VIDEO, TOTAL, MIX, MOMENTS, CHAPTERS, TOP } from '../content.js?v=ba89fddc';

const fmt = (n) => n.toLocaleString('en-US');
const SAY = `Read all ${fmt(TOTAL)} comments and watched the video for the answers.`;
const MATCHED = TOP.filter((c) => c.at).length;
const DONE = `Top ${TOP.length} of ${fmt(TOTAL)}, ${MATCHED} matched to the moment in the video that answers them`;
// the mix bar's colour per kind, and the kind chip on a ranked row reads the same colour (rank.css --rk-*)
const KIND = { Questions: 'q', Praise: 'p', Requests: 'r', Other: 'o' };
const CHIP = { Question: 'q', Praise: 'p', Request: 'r' };
const MOM = Object.entries(MOMENTS).map(([at, m]) => ({ at, ...m }));
const pct = (s) => `${((s / VIDEO.lenS) * 100).toFixed(3)}%`;
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the playhead starting
const PLAY = 0.6; /* deliberate */     // the playhead sweeping the whole video
const LIT = 0.12;                      // a moment marker lighting once the playhead has passed it
const COUNT_AT = 0.08;                 // the video watched to the comment counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 1,284 (the mix bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first ranked row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const CHIP_AT = 0.06;                  // a row starting to its moment chip landing
const CHIP_IN = 0.18;                  // the moment chip settling
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const THUMB = ms('thumb-up-outline');
const NOTE = ms('comment-outline');

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
    const moment = (at) => {
      if (!at) return `<span class="rk-mo rk-none"><span class="rk-fr">${NOTE}</span><span class="rk-mt"><b>Reply only</b></span></span>`;
      const m = MOMENTS[at];
      return `<span class="rk-mo"><span class="rk-fr"><img src="${x.img(m.img)}" width="640" height="360" alt=""/></span><span class="rk-mt"><b>${at}</b><small>${x.esc(m.label)}</small></span></span>`;
    };
    const card = x.el(`<div class="rk-card">
      <div class="rk-hd"><span class="rk-st"><i class="rk-spin"></i>${x.OK}</span><b><span class="rk-vb">Reading</span> <span class="rk-n">0</span> comments</b>
        <span class="rk-legend">${MIX.map((m) => `<span class="rk-lg"><i class="rk-${KIND[m.kind]}"></i>${x.esc(m.kind)}<b>0</b></span>`).join('')}</span></div>
      <i class="rk-stack">${MIX.map((m) => `<i class="rk-${KIND[m.kind]}" style="flex: ${m.n}"></i>`).join('')}</i>
      <div class="rk-vid">
        <span class="rk-th"><img src="${x.img(VIDEO.thumb)}" width="1280" height="720" alt=""/><i class="rk-len">${VIDEO.len}</i></span>
        <div class="rk-meta">
          <b class="rk-title">${x.esc(VIDEO.title)}</b>
          <span class="rk-sub">${x.esc(VIDEO.views)}<i></i>${x.esc(VIDEO.age)}<span class="rk-tc"><span class="rk-tcn">0:00</span> / ${VIDEO.len}</span></span>
          <i class="rk-bar"><i class="rk-fill"></i>${CHAPTERS.map((c) => `<u style="left: ${pct(c)}"></u>`).join('')}${MOM.map((m) => `<em style="left: ${pct(m.s)}"></em>`).join('')}<i class="rk-head"></i></i>
          <span class="rk-keys">${MOM.map((m) => `<span class="rk-key"><em></em><b>${m.at}</b>${x.esc(m.label)}</span>`).join('')}</span>
        </div>
      </div>
      <div class="rk-list">${TOP.map((c, i) => `<div class="rk-row"><span class="rk-rk">${i + 1}</span><span class="rk-av" style="--c: ${c.color}">${x.esc(c.name[0])}</span>
        <div class="rk-main"><span class="rk-l1"><b>${x.esc(c.name)}</b><span class="rk-lk">${THUMB}${c.likes}</span><span class="rk-kind"><i class="rk-${CHIP[c.kind]}"></i>${x.esc(c.kind)}</span>${c.repeats ? `<span class="rk-rep"><b>+${fmt(c.repeats)}</b> asking the same</span>` : ''}</span><span class="rk-tx">${x.esc(c.text)}</span></div>
        ${moment(c.at)}</div>`).join('')}</div>
      <div class="rk-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.rk-spin'), ok: $('.rk-st .qc-ok') };
    const fill = $('.rk-fill'), head = $('.rk-head'), tc = $('.rk-tcn'), n = $('.rk-n'), ft = $('.rk-ft'), verb = $('.rk-vb');
    const ticks = [...card.querySelectorAll('.rk-bar u')], marks = [...card.querySelectorAll('.rk-bar em')];
    const keys = [...card.querySelectorAll('.rk-key')];
    const stack = $('.rk-stack'), counts = [...card.querySelectorAll('.rk-lg b')];
    const rows = [...card.querySelectorAll('.rk-row')], chips = rows.map((row) => row.querySelector('.rk-mo'));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', clock = '', mix = '';

    return {
      nodes: [say, card],
      // the card's bottom is the scroll target as soon as the counter starts, so the whole card has settled in the
      // thread well before the rows land in it
      marks: [[T.r, say], [T.card, card], [T.c0, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the header: one spinner for the whole read, resolving to the check when the counter lands
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const vb = t >= T.c1 ? 'Read' : 'Reading'; // the label turns past tense with the check
        if (verb.textContent !== vb) verb.textContent = vb;

        // the playhead: a fast run through the whole video, easing in at the end; ticks it has passed light up, and
        // each answer moment lights in the accent with its key under the bar
        const p = inOutCubic(seg(t, T.p0, T.p1));
        const at = p * VIDEO.lenS;
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u, i) => u.classList.toggle('on', at >= CHAPTERS[i]));
        // the time the playhead passed moment i, read back off the eased sweep (bisect on the monotone curve)
        MOM.forEach((m, i) => {
          let lo = 0, hi = 1;
          for (let j = 0; j < 20; j++) { const mid = (lo + hi) / 2; if (inOutCubic(mid) * VIDEO.lenS < m.s) lo = mid; else hi = mid; }
          const tm = T.p0 + hi * PLAY;
          const l = outCubic(seg(t, tm, tm + LIT));
          marks[i].style.opacity = lerp(0.35, 1, l).toFixed(3);
          marks[i].style.transform = `scale(${lerp(0.6, 1, l).toFixed(4)})`;
          keys[i].style.opacity = l.toFixed(3);
        });
        const s = Math.round(at);
        const c = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        if (c !== clock) { tc.textContent = c; clock = c; }

        // the comment counter, and the mix bar filling with it: every kind's count climbs in step with the total
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        stack.style.clipPath = `inset(0 ${((1 - q) * 100).toFixed(3)}% 0 0)`;
        const mn = MIX.map((m) => fmt(Math.round(m.n * q))).join();
        if (mn !== mix) { mn.split(',').forEach((v, i) => { counts[i].textContent = v; }); mix = mn; }

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          const h = outCubic(seg(t, T.row[i] + CHIP_AT, T.row[i] + CHIP_AT + CHIP_IN));
          chips[i].style.opacity = h.toFixed(3);
          chips[i].style.transform = h >= 1 ? 'none' : `translateX(${((1 - h) * 10).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
