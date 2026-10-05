// Rank beat: Gemini reads YouTube Analytics for Jonah Plays' last 30 uploads and ranks them by average percentage
// viewed. Its line streams and a dark result card rises with the top 3: rank, the upload's thumbnail (img/thumbs/*.jpg,
// original Hollow Crown art rendered for this ad, img/CREDITS.txt), title and views, and a bar that grows to the
// upload's average percentage viewed while the figure counts up. The header's spinner resolves to the check, the
// winner's row lights and the footer names the pick and where the new video mentions it. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Ranking your last 30 uploads by average percentage viewed.';
// [thumbnail under img/thumbs/, title, average percentage viewed, views]; endscreen.js reads the same list (the
// winner is UPLOADS[0])
export const UPLOADS = [
  ['every-boss.jpg', 'Every Boss in Hollow Crown, Ranked', 61.4, '2.1M views'],
  ['no-healing.jpg', 'I Beat Hollow Crown Without Healing', 54.0, '880K views'],
  ['secrets.jpg', 'Hollow Crown Secrets You Missed', 49.7, '640K views'],
];
const HEAD = 'Analytics · Jonah Plays · last 30 uploads';
const COL = 'Avg. % viewed';
const PICK = '<b>Pick: Every Boss, Ranked.</b> Mentioned at 7:15 in your new video';
// timing (seconds from the reply start, or from the card where noted), the <10s pace
const CPS = 110;                       // the reply line streams
const SAY_AT = 0.03;                   // reply start to the line's first character
const CARD = 0.05;                     // reply start to the card rising in
const RISE = 0.2;                      // the card rising in
const ROW_AT = 0.1;                    // the card in to the first row landing
const ROW_STAGGER = 0.09;              // one row to the next, top to bottom
const ROW_IN = 0.16;
const BAR_AT = 0.06;                   // a row landing to its bar starting to grow
const BAR = 0.42;                      // a bar growing to its figure (the figure counts with it)
const PICK_AT = 0.04;                  // the last bar settled to the footer and the winner's highlight
const PICK_IN = 0.16;
const READ = 0.72; /* deliberate */    // the ranked list holds, readable, before Studio takes over

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.row = UPLOADS.map((_, i) => T.card + ROW_AT + i * ROW_STAGGER);
    T.bar = T.row.map((a) => a + BAR_AT);
    T.done = T.bar[UPLOADS.length - 1] + BAR;   // the header's check lands
    T.pick = T.done + PICK_AT;
    T.end = Math.max(T.pick + PICK_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { rows: T.row, pick: T.pick });
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rk-card">
      <div class="rk-hd"><span class="rk-st"><i class="rk-spin"></i>${x.OK}</span><b>${x.esc(HEAD)}</b><span class="rk-col">${x.esc(COL)}</span></div>
      ${UPLOADS.map(([f, title, , views], i) => `<div class="rk-row">
        <span class="rk-n">${i + 1}</span>
        <span class="rk-th"><img src="${x.img('thumbs/' + f)}" alt=""/></span>
        <span class="rk-tx"><b>${x.esc(title)}</b><span class="rk-l2"><small>${x.esc(views)}</small><span class="rk-bar"><i class="rk-fill"></i></span></span></span>
        <span class="rk-pc">0.0%</span>
      </div>`).join('')}
      <div class="rk-ft">${x.OK}<span>${PICK}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.rk-row')].map((n) => ({ n, fill: n.querySelector('.rk-fill'), pc: n.querySelector('.rk-pc') }));
    const spin = $('.rk-spin'), ok = $('.rk-st .qc-ok'), ft = $('.rk-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastPc = [];

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.pick, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each row lands, then its bar grows to the upload's figure while the figure counts up with it
        rows.forEach((row, i) => {
          const a = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.n.style.opacity = a.toFixed(3);
          row.n.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 8).toFixed(2)}px)`;
          const b = outCubic(seg(t, T.bar[i], T.bar[i] + BAR));
          const pct = UPLOADS[i][2];
          row.fill.style.width = `${(pct * b).toFixed(2)}%`;
          const txt = `${(pct * b).toFixed(1)}%`;
          if (txt !== lastPc[i]) { row.pc.textContent = txt; lastPc[i] = txt; }
        });
        rows[0].n.classList.toggle('rk-win', t >= T.pick);

        const d = outCubic(seg(t, T.done, T.done + 0.16));
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.pick, T.pick + PICK_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
