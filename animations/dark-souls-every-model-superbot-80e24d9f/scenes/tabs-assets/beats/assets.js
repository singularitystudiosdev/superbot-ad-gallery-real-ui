// Assets beat: DeepSeek V4 Flash lists every file the Dark Souls build needs. Its line streams, the asset manifest
// card drops in, and six rows tick in fast 0.16s apart: each prints its type badge, its filename in mono, its size
// counting up to the real value, and a status dot that turns from grey to green as that file lands. The footer counts
// the set up as it goes, ending on "6 assets, 25.8 MB, all green".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Listed every asset the Dark Souls build needs.';
const TITLE = 'Asset manifest';
// [badge, filename, size, unit]: the six files superbot counted, in the order the rows tick in
const ASSETS = [
  ['MESH', 'knight_plate.glb', 4.2, 'MB'],
  ['MESH', 'gatewarden.glb', 6.8, 'MB'],
  ['ANIM', 'greatsword_swing.anim', 180, 'KB'],
  ['TEX', 'fog_gate.tex', 2.1, 'MB'],
  ['LEVEL', 'outer_ward.level', 12.4, 'MB'],
  ['VO', 'gatewarden_vo.ogg', 96, 'KB'],
];
const MB = ASSETS.map(([, , v, u]) => (u === 'KB' ? v / 1024 : v));  // every size in MB, for the footer's total
const TOTAL = MB.reduce((n, v) => n + v, 0);                         // 25.8 MB with all six in
const STAGGER = 0.16;  // gap between one row ticking in and the next
const COUNT = 0.3;     // seconds one size takes to count up to its value
const LAYERS = '<svg class="ast-ic" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5Z"/><path d="M3 13l9 5 9-5"/></svg>';

// a size at value v in its own unit: KB counts in whole kilobytes, MB to a tenth
const size = (v, u) => (u === 'KB' ? `${Math.round(v)} KB` : `${v.toFixed(1)} MB`);

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.24;                                           // the manifest card drops in
    T.row = ASSETS.map((_, i) => T.card + 0.22 + i * STAGGER);   // each file ticks in
    T.count = T.row.map((a) => a + COUNT);                       // ...and its size has counted up, its dot gone green
    T.foot = T.count[ASSETS.length - 1] + 0.16;                   // the footer totals the set
    T.end = T.foot + 0.45;                                       // the total lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ast-card">
      <div class="ast-hd"><i class="ast-ici">${LAYERS}</i><b>${x.esc(TITLE)}</b></div>
      <div class="ast-rows">${ASSETS.map(([badge, name, v, u]) => `<div class="ast-row">
        <span class="ast-badge ast-b-${badge.toLowerCase()}">${x.esc(badge)}</span>
        <span class="ast-name">${x.esc(name)}</span>
        <span class="ast-size">${x.esc(size(0, u))}</span>
        <i class="ast-dot"></i>
      </div>`).join('')}</div>
      <div class="ast-foot"><b class="ast-n">0</b> assets, <b class="ast-mb">0.0</b> MB, <b class="ast-ok">all green</b></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ast-row')];
    const sizeEls = rows.map((row) => row.querySelector('.ast-size'));
    const dots = rows.map((row) => row.querySelector('.ast-dot'));
    const foot = card.querySelector('.ast-foot');
    const nEl = card.querySelector('.ast-n'), mEl = card.querySelector('.ast-mb'), okEl = card.querySelector('.ast-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // last text written per size: the DOM is only touched when the frame's text differs, so a still frame costs
    // nothing and a seek backwards still repaints (a "furthest so far" mark would not)
    const was = new Array(ASSETS.length).fill('');

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[0], rows[0]]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the manifest card drops in as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let landed = 0, mb = 0;
        rows.forEach((row, i) => {
          const a = T.row[i], b = T.count[i];
          // the row ticks in
          const p = outCubic(seg(t, a, a + 0.26));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;

          // its size counts up to the real value, and the running total takes that much with it
          const e = outCubic(seg(t, a, b));
          const txt = size(ASSETS[i][2] * e, ASSETS[i][3]);
          if (txt !== was[i]) { was[i] = txt; sizeEls[i].textContent = txt; }
          if (e >= 1) landed++;
          mb += MB[i] * e;

          // the status dot goes grey to green: colour and the pop both come off t
          const g = outCubic(seg(t, b - 0.14, b));
          dots[i].style.background = `rgb(${Math.round(lerp(58, 61, g))}, ${Math.round(lerp(58, 220, g))}, ${Math.round(lerp(63, 132, g))})`;
          const pop = Math.sin(Math.PI * clamp(seg(t, b - 0.14, b + 0.14)));
          dots[i].style.transform = `scale(${(1 + 0.5 * pop).toFixed(3)})`;
        });

        // the footer: it rises as the last file lands, counts the set up with the rows, and reads "all green" once
        // every dot is green
        const fp = outCubic(seg(t, T.foot, T.foot + 0.4));
        foot.style.opacity = fp.toFixed(3);
        foot.style.transform = fp >= 1 ? 'none' : `translateY(${((1 - fp) * 6).toFixed(2)}px)`;
        const nt = String(landed);
        if (nEl.textContent !== nt) nEl.textContent = nt;
        const mt = Math.min(mb, TOTAL).toFixed(1);
        if (mEl.textContent !== mt) mEl.textContent = mt;
        okEl.style.opacity = outCubic(seg(t, T.count[ASSETS.length - 1] - 0.1, T.count[ASSETS.length - 1] + 0.2)).toFixed(3);
      },
    };
  },
};