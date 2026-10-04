// Rank beat: GPT-6 Astra reads every comment on the latest video and ranks the five worth answering. Its line streams
// and a wide analysis card rises, built for a 16:9 frame (two columns inside, chart beside list). The header is the
// video (img/thumb-mics.jpg with the 14:32 chip, the title, its views and age) and, on the right, a counter streaming
// up to 1,284 "comments read" over a thin read bar (spinner resolving to the check). Left column: all 1,284 by intent
// as one stacked bar (questions and requests in the accent, praise and other in greys) with a count and share per
// intent that stream with the counter, then the three biggest repeat asks (TOP[].repeats), each with its share of its
// own intent ("52% of questions"). Right column, the beat's one bold move: the top five land in the order the read
// found them, then glide into rank and lock (rank numbers resolve), as a small table with likes and repeats columns.
// The footer lands with the check. In the zoom cut the camera pushes onto the card while it builds and pulls back
// inside the beat (T.focus, run by the FOCUS camera in scenes/tabs.js). Every fact comes from ../script.js; the
// cluster wordings below paraphrase the top comments they belong to. Pure function of t: every moving value is written
// from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=0abfdc86';
import { VIDEO, TOTAL, INTENTS, TOP } from '../script.js?v=0abfdc86';

const SAY = 'Read all 1,284 comments and ranked the five worth answering first.';
const DONE = 'Top 5 of 1,284, ranked by likes and repeat questions';
// the repeat asks, worded from the comment each cluster gathers under (counts are TOP[].repeats)
const CLUSTER = { priya: 'want a mic for an untreated room', dee: 'want headsets tested next', lena: 'ask which boom arm is at 4:38' };
// the order the read surfaced the five (indices into TOP) before the rank sorts them
const FOUND = [3, 0, 4, 2, 1];
const TAG = { question: 'Question', praise: 'Praise', request: 'Request', other: 'Other' };
const INTENT_LABEL = { question: 'questions', praise: 'praise', request: 'requests', other: 'other' };

// timing (seconds from the reply start), sized to the 2.2s budget: the push lands early so the build plays parked
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.04;                   // reply start to the line's first character
const CARD_AT = 0.08;                  // reply start to the card rising in
const CARD_IN = 0.2;                   // the card rising in
const COUNT_AT = 0.2;                  // reply start to the counter starting
const COUNT = 0.62; /* deliberate */   // the counter running up to 1,284 (the intent bar and counts grow with it)
const CL_AT = 0.5;                     // reply start to the first repeat cluster
const CL_STAGGER = 0.08;               // one cluster to the next
const CL_IN = 0.24;                    // a cluster rising in (its share bar grows over 0.3s)
const ROW_AT = 0.26;                   // reply start to the first found row
const ROW_STAGGER = 0.1;               // one found row to the next
const ROW_IN = 0.22;                   // a row rising in
const SORT_AT = 0.92;                  // reply start to the rows gliding into rank
const SORT = 0.3;                      // the glide, inOutCubic
const DONE_AT = 1.22;                  // reply start to the footer
const DONE_IN = 0.24;                  // the footer rising in
const FOCUS_AT = 0.24; /* deliberate */  // the card is up, the camera starts in on it (the pill pull-back hands over)
const FOCUS_PUSH = 0.36; /* deliberate */ // push-in, outQuint
const FOCUS_HOLD = 1.2; /* deliberate */  // parked on the card: the sort plays and the footer reads
const FOCUS_PULL = 0.36; /* deliberate */ // pull-back, inOutCubic
const HOLD_DONE = 0.4;                 // nozoom cut: the finished card holds this long

const ROW_H = 44;                      // one ranked row in design px (rows are absolutely placed so the sort is from t)
const fmt = (n) => n.toLocaleString('en-US');
const pct = (a, b) => Math.round((a / b) * 100);
const THUMB = ms('thumb-up-outline');
const CLUSTERS = TOP.filter((c) => c.repeats > 0).sort((a, b) => b.repeats - a.repeats);
const INTENT_N = Object.fromEntries(INTENTS.map((i) => [i.key, i.n]));

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.c0 = r + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.cl = CLUSTERS.map((_, i) => r + CL_AT + i * CL_STAGGER);
    T.row = FOUND.map((_, j) => r + ROW_AT + j * ROW_STAGGER);
    T.s0 = r + SORT_AT;
    T.s1 = T.s0 + SORT;
    T.done = r + DONE_AT;
    if (opts.zoom !== false) {
      const sw = r + FOCUS_AT;
      const landed = sw + FOCUS_PUSH;
      T.focus = { sw, landed, pull: landed + FOCUS_HOLD, back: landed + FOCUS_HOLD + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : T.done + DONE_IN + HOLD_DONE, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const slot = TOP.map((_, i) => FOUND.indexOf(i));
    const card = x.el(`<div class="rk-card">
      <div class="rk-hd">
        <span class="rk-th"><img src="${x.img('thumb-mics.jpg')}" width="1280" height="720" alt=""/><i class="rk-len">${VIDEO.len}</i></span>
        <span class="rk-vid"><b class="rk-title">${x.esc(VIDEO.title)}</b><span class="rk-meta">${VIDEO.views} views, posted ${x.esc(VIDEO.posted)}</span></span>
        <span class="rk-ct"><span class="rk-st"><i class="rk-spin"></i>${x.OK}</span><span class="rk-cn"><b class="rk-n">0</b><small>comments read</small></span></span>
      </div>
      <i class="rk-read"><i></i></i>
      <div class="rk-body">
        <div class="rk-left">
          <span class="rk-lb">All ${fmt(TOTAL)} by intent</span>
          <i class="rk-stack"><i class="rk-segs">${INTENTS.map((it) => `<i class="rk-seg rk-${it.key}" style="flex: ${it.n}"></i>`).join('')}</i></i>
          <div class="rk-legend">${INTENTS.map((it) => `<span class="rk-lg"><i class="rk-dot rk-${it.key}"></i><span class="rk-lgl">${x.esc(it.label)}</span><b class="rk-lgn">0</b><span class="rk-lgp">${pct(it.n, TOTAL)}%</span></span>`).join('')}</div>
          <span class="rk-lb rk-lb2">Biggest repeat asks</span>
          <div class="rk-cls">${CLUSTERS.map((c) => `<div class="rk-cl"><span class="rk-cl1"><b>${c.repeats}</b><span>${x.esc(CLUSTER[c.id] || '')}</span></span>
            <span class="rk-cl2"><i class="rk-cbar"><i style="width: ${pct(c.repeats, INTENT_N[c.intent])}%"></i></i><small>${pct(c.repeats, INTENT_N[c.intent])}% of ${INTENT_LABEL[c.intent]}</small></span></div>`).join('')}</div>
        </div>
        <div class="rk-right">
          <span class="rk-th2"><span class="rk-lb">Top 5, ranked</span><span class="rk-col">Likes</span><span class="rk-col">Repeats</span></span>
          <div class="rk-list" style="height: ${TOP.length * ROW_H}px">${TOP.map((c, i) => `<div class="rk-row" style="top: ${slot[i] * ROW_H}px"><span class="rk-rk">${i + 1}</span><span class="rk-av" style="--c: ${c.color}">${x.esc(c.name[0])}</span>
            <span class="rk-main"><span class="rk-l1"><b>${x.esc(c.name)}</b><span class="rk-tag">${TAG[c.intent] || ''}</span></span><span class="rk-tx">${x.esc(c.text)}</span></span>
            <span class="rk-lk">${THUMB}${c.likes}</span><span class="rk-rp${c.repeats ? ' on' : ''}">${c.repeats ? fmt(c.repeats) : '0'}</span></div>`).join('')}</div>
        </div>
      </div>
      <div class="rk-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const all = (s) => [...card.querySelectorAll(s)];
    const st = { spin: $('.rk-spin'), ok: $('.rk-st .qc-ok') };
    const n = $('.rk-n'), read = $('.rk-read i'), segs = $('.rk-segs'), lgn = all('.rk-lgn');
    const cls = all('.rk-cl'), cbars = all('.rk-cbar i');
    const rows = all('.rk-row'), rks = all('.rk-rk'), ft = $('.rk-ft');
    let shown = -1;
    const txt = new Map();
    const setText = (node, s) => { if (txt.get(node) !== s) { node.textContent = s; txt.set(node, s); } };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the read: counter, read bar, the intent bar growing as one (its proportions hold) and the per-intent counts
        const q = inOutCubic(seg(t, T.c0, T.c1));
        setText(n, fmt(Math.round(TOTAL * q)));
        read.style.transform = `scaleX(${q.toFixed(4)})`;
        segs.style.transform = `scaleX(${q.toFixed(4)})`;
        INTENTS.forEach((it, i) => setText(lgn[i], fmt(Math.round(it.n * q))));
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the repeat clusters: each rises, then its share-of-intent bar grows
        cls.forEach((c, i) => {
          const o = outCubic(seg(t, T.cl[i], T.cl[i] + CL_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
          cbars[i].style.transform = `scaleX(${outCubic(seg(t, T.cl[i] + 0.08, T.cl[i] + 0.38)).toFixed(4)})`;
        });

        // the top five: each lands in its found slot, then all glide into rank together (the longest riser passes on top)
        const s = inOutCubic(seg(t, T.s0, T.s1));
        const lock = outCubic(seg(t, T.s1 - 0.1, T.s1 + 0.14));
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[slot[i]], T.row[slot[i]] + ROW_IN));
          const y = (lerp(slot[i], i, s) - slot[i]) * ROW_H + (1 - o) * 8;
          row.style.opacity = o.toFixed(3);
          row.style.transform = Math.abs(y) < 0.01 ? 'none' : `translateY(${y.toFixed(2)}px)`;
          row.style.zIndex = String(s > 0 && s < 1 ? 1 + Math.max(0, slot[i] - i) : 1);
          rks[i].style.opacity = lock.toFixed(3);
        });

        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
