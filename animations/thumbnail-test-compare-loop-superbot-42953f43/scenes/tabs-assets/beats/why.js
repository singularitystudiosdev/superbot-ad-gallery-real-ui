// Why beat: Claude Opus 5.5 reads round 1's Test & compare result and says why B won, then writes round 2. A card
// in two columns. Left, B itself (img/thumbs/B.jpg) with the Winner chip, and three numbered boxes drawn onto it one
// by one: 1 Face, 2 Both products (one box per webcam), 3 Two words (the "$40 WINS?" type). Right, the round 1
// watch time share (B 47.3%, A 31.2%, C 21.5%), the reason streaming in as one line, "Face plus both products plus
// 2 words.", and the two variants it writes on B's pattern: B2 ("$40" in yellow, tighter face crop) and B3 (webcam
// held closer to the lens). The camera pushes in on the card while it builds (chat.js FOCUS). Box geometry is
// measured on the 1280 x 720 thumbnail (see the comment on BOXES). Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { THUMBS, ROUNDS } from './studio-data.js?v=42953f43';

const SAY = 'B won round 1 with 47.3% of watch time. Here is why, and what round 2 tests.';
const WHY = 'Face plus both products plus 2 words.';
// boxes on B, in the thumbnail's 1280 x 720 px: [label number, x, y, w, h, label]. Measured on img/thumbs/B.jpg:
// Sam's face (hair to beard), the $40 webcam in his right hand, the $400 webcam in his left, the "$40 WINS?" type.
const BOXES = [
  [1, 538, 40, 214, 310, 'Face'],
  [2, 432, 232, 118, 84, ''],
  [2, 742, 212, 196, 172, 'Both products'],
  [3, 268, 476, 744, 222, 'Two words'],
];
const NEXT = [
  ['B2', 'Same pattern: “$40” in yellow, tighter face crop'],
  ['B3', 'Same pattern: webcam held closer to the lens'],
];
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const ROWS_AT = 0.25;                  // the card landing to the share rows
const ROW_STAGGER = 0.1;
const BOX_AT = 0.55;                   // the card landing to the first box
const BOX_STAGGER = 0.38; /* deliberate */ // one reason to the next, slow enough to read each label
const BOX_IN = 0.3;
const WHY_CPS = 55;                    // the reason streams at reading pace
const NEXT_AT = 0.25;                  // the reason finished to the first variant
const NEXT_STAGGER = 0.22;
const NEXT_IN = 0.28;
const FOOT_AT = 0.15;
const FOOT_IN = 0.24;
const READ = 0.95; /* deliberate */
const FOCUS_IN = 0.5, FOCUS_OUT = 0.5;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROUNDS[1].ids.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    // boxes 2a and 2b (the two webcams) land together: one reason
    const reason = [0, 1, 1, 2];
    T.box = BOXES.map((_, i) => T.card + BOX_AT + reason[i] * BOX_STAGGER);
    T.why = T.box[3] + BOX_IN + 0.05;
    T.whyEnd = T.why + WHY.length / WHY_CPS;
    T.next = NEXT.map((_, i) => T.whyEnd + NEXT_AT + i * NEXT_STAGGER);
    T.foot = T.next[NEXT.length - 1] + NEXT_IN + FOOT_AT;
    T.end = T.foot + FOOT_IN + READ;
    if (opts.zoom) T.focus = { sw: T.card + 0.1, landed: T.card + 0.1 + FOCUS_IN, pull: T.end - FOCUS_OUT, back: T.end, fill: 0.94 };
    return T;
  },
  build(k, x) {
    const T = k.T;
    const R = ROUNDS[1];
    // share rows, highest first
    const order = R.ids.map((id, i) => i).sort((a, b) => R.share[b] - R.share[a]);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wy-card">
      <div class="wy-left">
        <span class="wy-im"><img src="${x.img(THUMBS.B[2])}" width="1280" height="720" alt=""/>
          ${BOXES.map(([n, bx, by, bw, bh, label]) => `<i class="wy-box" style="left: ${(bx / 12.8).toFixed(3)}%; top: ${(by / 7.2).toFixed(3)}%; width: ${(bw / 12.8).toFixed(3)}%; height: ${(bh / 7.2).toFixed(3)}%">
            ${label ? `<em class="wy-tag${n === 1 ? ' wy-in' : n === 2 ? ' wy-dn' : ''}"><b>${n}</b>${x.esc(label)}</em>` : ''}</i>`).join('')}
          <i class="wy-win">Winner</i></span>
        <span class="wy-cap"><b>B</b>${x.esc(THUMBS.B[1])}</span>
      </div>
      <div class="wy-right">
        <div class="wy-h">Round 1 · watch time share</div>
        <div class="wy-rows">${order.map((i) => {
          const id = R.ids[i], s = R.share[i];
          return `<div class="wy-row${i === R.win ? ' wy-on' : ''}"><b>${id}</b><i class="wy-bar"><i style="width: ${s}%"></i></i><span>${s.toFixed(1)}%</span>${i === R.win ? '<em>Winner</em>' : '<em class="wy-no"></em>'}</div>`;
        }).join('')}</div>
        <div class="wy-h">Why it won</div>
        <div class="wy-why"><span class="wy-vis"></span><span class="wy-hid">${x.esc(WHY)}</span></div>
        <div class="wy-h">Round 2 · on B's pattern</div>
        <div class="wy-next">${NEXT.map(([id, what]) => `<div class="wy-nx"><b>${id}</b><span>${x.esc(what)}</span></div>`).join('')}</div>
      </div>
      <div class="wy-ft">${x.OK}<span>2 variants written for round 2</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.wy-row')];
    const boxes = [...card.querySelectorAll('.wy-box')];
    const nx = [...card.querySelectorAll('.wy-nx')];
    const wv = $('.wy-vis'), wh = $('.wy-hid'), ft = $('.wy-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, wShown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      focus: T.focus ? card : null,
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.rows[i], T.rows[i] + 0.3));
          row.style.opacity = o.toFixed(3);
          row.style.setProperty('--g', o.toFixed(3));
        });
        boxes.forEach((b, i) => {
          const o = outCubic(seg(t, T.box[i], T.box[i] + BOX_IN));
          b.style.opacity = o.toFixed(3);
          b.style.transform = o >= 1 ? 'none' : `scale(${lerp(1.18, 1, o).toFixed(4)})`;
        });
        const nw = Math.max(0, Math.min(WHY.length, Math.floor((t - T.why) * WHY_CPS)));
        if (nw !== wShown) { wv.textContent = WHY.slice(0, nw); wh.textContent = WHY.slice(nw); wShown = nw; }
        nx.forEach((n, i) => {
          const o = outCubic(seg(t, T.next[i], T.next[i] + NEXT_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * 10).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
