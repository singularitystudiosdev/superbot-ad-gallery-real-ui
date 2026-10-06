// Pin beat: GPT-6 Sol picks the comment to pin. Its line streams and a scorecard rises: the five candidates as rows
// (avatar, name), three measured columns filling as bars (likes, viewers who asked the same thing, how many of the
// top five questions the drafted reply answers, as three pips) and a score counting up. When the last bar lands the
// winner is picked: Priya's row lights, a "Pin" badge pops beside her score, and the verdict lands under the table
// with what the pinned reply answers as chips. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba8f0993';
import { TOP, SCORE, PIN, COVERS } from './data.js?v=ba8f0993';

const SAY = 'Pin Priya\'s question. 214 people asked it, and your reply to her answers three of the top five.';
const VERDICT = 'Pinned reply answers';
const MAX = { likes: Math.max(...SCORE.map((s) => s.likes)), same: Math.max(...SCORE.map((s) => s.same)) };
// timing (seconds from the reply start, or from the card where noted)
const CPS = 110;
const SAY_AT = 0.048;
const CARD = 0.14;
const RISE = 0.32;
const BAR_AT = 0.16;                    // the card landing to the first row's bars starting
const ROW_STAG = 0.06;                  // one row's bars to the next
const COL_STAG = 0.08;                  // one column's bar to the next within a row
const BAR = 0.36;                       // a bar filling
const PICK_AT = 0.1;                    // the last bar full to the pick
const PICK = 0.26;                      // the winning row lighting, its badge popping
const VERD_AT = 0.14;                   // the pick to the verdict line
const CHIP_STAG = 0.07;
const CHIP_IN = 0.2;
const READ_HOLD = 0.1; /* deliberate */ // the verdict holds a beat before the Studio pill (the spot stays at the source's 26.3 s)

const fmtLikes = (k) => (k >= 1 ? `${k.toFixed(1)}K` : String(Math.round(k * 1000)));

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.bar = TOP.map((_, i) => T.card + BAR_AT + i * ROW_STAG);
    T.full = T.bar[TOP.length - 1] + 2 * COL_STAG + BAR;
    T.pick = T.full + PICK_AT;
    T.verd = T.pick + VERD_AT;
    T.chip = COVERS.map((_, i) => T.verd + 0.1 + i * CHIP_STAG);
    T.end = Math.max(T.chip[COVERS.length - 1] + CHIP_IN + READ_HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const pips = (n) => [0, 1, 2].map((j) => `<i class="pn-pip${j < n ? ' pn-pip-on' : ''}"></i>`).join('');
    const card = x.el(`<div class="pn-card">
      <div class="pn-hd">${ms('keep', 'pn-ic')}<b>Which comment to pin</b><small>scored on reach, demand and how much the reply answers</small></div>
      <div class="pn-cols"><span>Comment</span><span>Likes</span><span>Asked the same</span><span>Reply answers</span><span>Score</span></div>
      ${TOP.map((c, i) => {
        const s = SCORE[i];
        return `<div class="pn-row${i === PIN ? ' pn-win' : ''}"><i class="pn-wash"></i>
          <span class="pn-who"><span class="pn-av" style="--c: ${c.c}">${x.esc(c.name[0])}</span><b>${x.esc(c.name)}</b></span>
          <span class="pn-m"><i class="pn-bar"><i style="width: ${((s.likes / MAX.likes) * 100).toFixed(1)}%"></i></i><em>${fmtLikes(s.likes)}</em></span>
          <span class="pn-m"><i class="pn-bar"><i style="width: ${((s.same / MAX.same) * 100).toFixed(1)}%"></i></i><em>${s.same}</em></span>
          <span class="pn-m pn-pips">${pips(s.covers)}<em>${s.covers} of 5</em></span>
          <span class="pn-sc"><b>0</b>${i === PIN ? `<span class="pn-badge">${ms('keep')}Pin</span>` : ''}</span>
        </div>`;
      }).join('')}
      <div class="pn-verd">${x.OK}<span>${x.esc(VERDICT)}</span>${COVERS.map((c) => `<span class="pn-chip">${x.esc(c)}</span>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.pn-row')].map((n, i) => ({
      n, i, bars: [...n.querySelectorAll('.pn-bar i')], pips: [...n.querySelectorAll('.pn-pip')],
      sc: n.querySelector('.pn-sc b'), shown: '', wash: n.querySelector('.pn-wash'), badge: n.querySelector('.pn-badge'),
    }));
    const verd = card.querySelector('.pn-verd'), chips = [...card.querySelectorAll('.pn-chip')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.verd, verd]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((r) => {
          const a = T.bar[r.i];
          r.bars.forEach((b, j) => {
            const f = inOutCubic(seg(t, a + j * COL_STAG, a + j * COL_STAG + BAR));
            b.style.transform = `scaleX(${f.toFixed(4)})`;
          });
          r.pips.forEach((p, j) => { p.style.opacity = (0.25 + 0.75 * outCubic(seg(t, a + 2 * COL_STAG + j * 0.08, a + 2 * COL_STAG + j * 0.08 + 0.16))).toFixed(3); });
          const sv = String(Math.round(SCORE[r.i].score * inOutCubic(seg(t, a, a + 2 * COL_STAG + BAR))));
          if (sv !== r.shown) { r.sc.textContent = sv; r.shown = sv; }
          if (r.i === PIN) {
            const w = outCubic(seg(t, T.pick, T.pick + PICK));
            r.wash.style.opacity = w.toFixed(3);
            r.n.classList.toggle('pn-lit', t >= T.pick);
            const bp = outCubic(seg(t, T.pick + 0.04, T.pick + 0.04 + PICK));
            r.badge.style.opacity = bp.toFixed(3);
            r.badge.style.transform = `scale(${lerp(0.6, 1, bp).toFixed(4)})`;
          } else {
            r.n.style.opacity = (1 - 0.45 * outCubic(seg(t, T.pick, T.pick + PICK))).toFixed(3);
          }
        });
        const v = outCubic(seg(t, T.verd, T.verd + 0.24));
        verd.style.opacity = v.toFixed(3);
        verd.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px)`;
        chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = `scale(${lerp(0.85, 1, o).toFixed(4)})`;
        });
      },
    };
  },
};
