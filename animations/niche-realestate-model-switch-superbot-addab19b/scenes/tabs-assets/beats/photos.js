// Photos beat: GPT-6 Astra reads the listing photos of the 11 homes near good schools (the WhatsApp sibling's photos.js
// vision grammar). Its line streams and a card rises holding the 11 listings' lead photos (real photographs, img/,
// img/CREDITS.txt) in a 6 by 2 grid. A scan passes over the photos one by one; each one resolves to a green check, or,
// for three of them, a red flag. The three flags land under the grid with their reasons ("Roof near end of life",
// "Water stain in basement", "Photos 6 years old") and the footer resolves: "8 homes pass the photo check".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Read every listing photo for the 11 homes. 3 show problems the listings leave out.';
const LABEL = 'Reading listing photos  ·  11 homes';
// [photo, flag reason or null, address of a flagged home]
const CELLS = [
  ['house-1.jpg'], ['house-2.jpg'], ['roof.jpg', 'Roof near end of life', '317 Andrew Ave'], ['house-3.jpg'],
  ['house-4.jpg'], ['house-5.jpg'], ['basement.jpg', 'Water stain in basement', '403 Matthew Ave'], ['house-6.jpg'],
  ['house-7.jpg'], ['house-9.jpg', 'Photos 6 years old', '1206 Rebecca Ave'], ['house-8.jpg'],
];
const FLAGS = CELLS.map((c, i) => [i, ...c]).filter((c) => c[2]);
const RESULT = '8 homes pass the photo check';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const SCAN_AT = 0.2;                   // the card landing to the first photo's scan
const SCAN_STAGGER = 0.05;             // one photo to the next
const SCAN = 0.2;                      // the sweep across one photo
const MARK_IN = 0.16;                  // the check or the flag popping in
const WHY_AT = 0.06;                   // the last photo resolved, then the flags' reasons land
const WHY_STAGGER = 0.08;
const WHY_IN = 0.22;
const RES_AT = 0.06;
const RES_IN = 0.24;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.scan = CELLS.map((_, i) => T.card + SCAN_AT + i * SCAN_STAGGER);
    T.mark = T.scan.map((s) => s + SCAN);
    T.why = FLAGS.map((_, i) => T.mark[CELLS.length - 1] + WHY_AT + i * WHY_STAGGER);
    T.res = T.why[FLAGS.length - 1] + WHY_IN + RES_AT;
    T.end = Math.max(T.res + RES_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pc-card">
      <div class="pc-hd"><span class="pc-st"><i class="pc-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="pc-cnt"><b class="pc-n">0</b> of ${CELLS.length} read</span></div>
      <div class="pc-grid">
        ${CELLS.map(([f, why]) => `<span class="pc-ph${why ? ' pc-flag' : ''}"><img src="${x.img(f)}" alt=""/><i class="pc-sw"></i><i class="pc-ring"></i>
          <i class="pc-mk">${why ? '!' : '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'}</i></span>`).join('')}
        <span class="pc-tally"><b class="pc-pass">0</b><small>pass</small></span>
      </div>
      <div class="pc-whys">${FLAGS.map(([, f, why, addr]) => `<div class="pc-why"><span class="pc-th"><img src="${x.img(f)}" alt=""/></span><i class="pc-bang">!</i><b>${x.esc(addr)}</b><span>${x.esc(why)}</span></div>`).join('')}</div>
      <div class="pc-ft">${x.OK}<span>${x.esc(RESULT)}</span></div>
    </div>`);
    const cells = [...card.querySelectorAll('.pc-ph')].map((n) => ({ n, sw: n.querySelector('.pc-sw'), ring: n.querySelector('.pc-ring'), mk: n.querySelector('.pc-mk') }));
    const whys = [...card.querySelectorAll('.pc-why')];
    const n = card.querySelector('.pc-n'), pass = card.querySelector('.pc-pass'), ft = card.querySelector('.pc-ft');
    const spin = card.querySelector('.pc-spin'), ok = card.querySelector('.pc-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, cnt = '', pc = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.why[0], whys[FLAGS.length - 1]], [T.res, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        let read = 0, passed = 0;
        cells.forEach((c, i) => {
          const s = seg(t, T.scan[i], T.mark[i]);
          c.sw.style.opacity = (s > 0 && s < 1 ? 1 : 0).toFixed(3);
          c.sw.style.left = `${(s * 100).toFixed(2)}%`;
          const m = outCubic(seg(t, T.mark[i], T.mark[i] + MARK_IN));
          c.mk.style.opacity = m.toFixed(3);
          c.mk.style.transform = `scale(${lerp(0.4, 1, m).toFixed(4)})`;
          c.ring.style.opacity = m.toFixed(3);
          if (t >= T.mark[i]) { read++; if (!CELLS[i][1]) passed++; }
        });
        const a = String(read), b = String(passed);
        if (a !== cnt) { n.textContent = a; cnt = a; }
        if (b !== pc) { pass.textContent = b; pc = b; }
        whys.forEach((w, i) => {
          const q = outCubic(seg(t, T.why[i], T.why[i] + WHY_IN));
          w.style.opacity = q.toFixed(3);
          w.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.res, T.res + RES_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
        const last = T.mark[CELLS.length - 1];
        const d = outCubic(seg(t, last, last + 0.2));
        spin.style.opacity = (1 - seg(t, last - 0.08, last + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
      },
    };
  },
};
