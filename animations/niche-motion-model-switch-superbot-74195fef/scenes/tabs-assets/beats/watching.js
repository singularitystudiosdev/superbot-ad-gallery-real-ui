// Watching beat: Gemini watches the launch promo the designer wants reformatted. Its line streams and a card rises
// (the base's compact-card grammar, no tabs, no footer controls): a film glyph, "Watching launch_promo_v12.mp4", the
// plain-text counter "Mapping 8 shots" with a spinner that resolves to the check; a filmstrip of 8 shot thumbnails,
// each the promo's own 16x9 layout (beats/promo.js, live DOM, scaled) frozen at one instant, fading in one by one
// (no bar under the strip, no outline on any thumbnail: nothing that reads as a scrubber or a selection); then three
// findings rows land (shot, finding, tag; the tag is a plain muted word, not a link, not a pill; no row is highlighted)
// and the closing check line "8 shots mapped, 3 need a new layout". Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { oi } from './ae-icons.js?v=74195fef';
import { makePromo, SHOT_T } from './promo.js?v=74195fef';

const SAY = 'Watched the promo and mapped every shot';
const TITLE = 'Watching launch_promo_v12.mp4';
const COUNT = 'Mapping 8 shots';
// the findings (exact, per the spec): [shot, finding, tag]
export const FINDINGS = [
  ['Shot 2', 'Bottle sits on the left third and crops out in 9:16', 'Reframe'],
  ['Shot 3', 'Headline runs 1,420 px wide, too wide for a 1080 frame', 'Re-flow'],
  ['Shot 8', 'Lockup sits on the lower edge and leaves 4:5 title safe', 'Safe area'],
];
const DONE = '8 shots mapped, 3 need a new layout';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.24;                   // the card landing to the first thumbnail fading in
const RUN = 0.9; /* deliberate */      // the 8 thumbnails fade in one by one across this span
const TH_IN = 0.16;                    // a thumbnail lighting up
const ROW_AT = 0.1;                    // the strip read to the first findings row
const ROW = 0.17;                      // one row to the next
const ROW_IN = 0.18;                   // a row landing
const FOOT_AT = 0.12;                  // the last row in to the closing check line
const FOOT_IN = 0.24;                  // the closing line rising in
const HOLD = 0.35; /* deliberate */    // the result reads before the next status line

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + RUN_AT;
    T.c1 = T.c0 + RUN;
    T.rows = FINDINGS.map((_, i) => T.c1 + ROW_AT + i * ROW);
    T.foot = T.rows[FINDINGS.length - 1] + ROW_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wt-card">
      <div class="wt-q">
        <span class="wt-doc">${oi('film')}</span>
        <b class="wt-title">${x.esc(TITLE)}</b>
        <span class="wt-cnt"><span class="wt-ic"><i class="wt-spin"></i>${x.OK}</span>${x.esc(COUNT)}</span>
      </div>
      <div class="wt-strip">${SHOT_T.map(() => `<div class="wt-th"><div class="wt-fr"></div></div>`).join('')}</div>
      <div class="wt-rows">${FINDINGS.map(([s, f, tag]) => `<div class="wt-row"><span class="wt-s">${x.esc(s)}</span><span class="wt-f">${x.esc(f)}</span><em class="wt-tag">${x.esc(tag)}</em></div>`).join('')}</div>
      <div class="wt-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const thumbs = [...card.querySelectorAll('.wt-th')];
    // one promo per thumbnail, frozen at its shot's instant (16x9 layout, scaled to the thumbnail's width)
    const promos = thumbs.map((th, i) => { const p = makePromo('16x9'); th.firstElementChild.appendChild(p.el); p.render(SHOT_T[i]); return p; });
    const rows = [...card.querySelectorAll('.wt-row')], ft = $('.wt-ft');
    const spin = $('.wt-spin'), ok = $('.wt-ic .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, tw = 0;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.rows[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the thumbnails' scale follows their laid-out width (once per frame size)
        const w = thumbs[0].clientWidth;
        if (w && w !== tw) { tw = w; promos.forEach((p) => { p.el.style.transform = `scale(${(w / p.W).toFixed(5)})`; }); }

        // the thumbnails fade in one by one across [c0, c1] (no bar, no outline)
        thumbs.forEach((n, i) => {
          const a = T.c0 + (i / thumbs.length) * (T.c1 - T.c0);
          const o = outCubic(seg(t, a, a + TH_IN));
          n.style.opacity = lerp(0.28, 1, o).toFixed(3);
        });
        // the counter's spinner resolves to the check when the strip is read
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
