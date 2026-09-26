// Assets beat: Meshy turns six text prompts into the island's 3D props. The line streams, the "Generating 3D models"
// chip spins as it counts the models landing, and the asset card fills in one row at a time: a row drops in with its
// thumbnail still blurred and its triangle count climbing, its status spins until that model is done, then the row
// settles to a green check, a sharp thumbnail and its file size. The chip resolves to "Made 6 models" and the Total
// row closes the list with the summed triangles and megabytes.
// Pure function of t (the tabs scene's local time): no Date, no rAF, every moving value is written from t, so ?t=
// freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Generated 6 props for the island.';
// [file, thumbnail, triangles, KB]: each thumbnail is a 176x176 crop of the island clip showing that object
const PROPS = [
  ['palm_tree.glb', 'island/prop-palm_tree.jpg', 2400, 380],
  ['beach_hut.glb', 'island/prop-beach_hut.jpg', 3100, 512],
  ['dock.glb', 'island/prop-dock.jpg', 1200, 190],
  ['fishing_boat.glb', 'island/prop-fishing_boat.jpg', 2800, 460],
  ['market_stall.glb', 'island/prop-market_stall.jpg', 2200, 340],
  ['rock_cluster.glb', 'island/prop-rock_cluster.jpg', 900, 150],
];
const TOTAL_TRIS = PROPS.reduce((s, p) => s + p[2], 0); // 12,600 tris
const TOTAL_KB = PROPS.reduce((s, p) => s + p[3], 0);   // 2,032 KB
const STAGGER = 0.2; // gap between one row landing and the next
const WORK = 0.62;   // how long one model takes: triangles climb, the thumbnail sharpens, the status resolves

/** 2400 -> "2.4k", 900 -> "900": triangle counts read in k at a thousand and up, exact below it */
const tris = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));
/** 2032 -> "2.0 MB", the unit the footer states the summed file sizes in */
const mb = (kb) => (kb / 1024).toFixed(1) + ' MB';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.16;                                        // the "Generating 3D models" chip lands
    T.list = r + 0.3;                                         // the asset card rises
    T.row = PROPS.map((_, i) => T.list + 0.12 + i * STAGGER); // each row drops in, 0.2s apart
    T.done = T.row.map((a) => a + WORK);                      // ...and that model is finished here
    T.total = T.done[PROPS.length - 1] + 0.14;                // the Total row lands once the last model is done
    T.chipDone = T.total + 0.18;                              // the chip resolves to "Made 6 models"
    T.end = T.chipDone + 0.45;                                // read the total, then straight on to the next beat
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow assets-genrow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 3D models</span><b class="assets-count">0 / 6</b></div></div>`);
    const card = x.el(`<div class="assets-card"><div class="assets-rows">${PROPS.map(([file, src]) => `<div class="assets-row">
      <span class="assets-th"><img src="${x.img(src)}" alt="${x.esc(file.replace('.glb', '').replace('_', ' '))} model thumbnail"/></span>
      <span class="assets-id"><span class="assets-name">${x.esc(file)}</span><span class="assets-meta"><b class="assets-tris">0 tris</b><span class="assets-kb">0 KB</span></span></span>
      <span class="assets-st"><span class="spin"></span></span>
    </div>`).join('')}</div><div class="assets-total"><span>Total</span><b class="assets-ttris">0 tris</b><b class="assets-tmb">0.0 MB</b></div></div>`);
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.assets-count');
    const rows = [...card.querySelectorAll('.assets-row')].map((n) => ({
      n, img: n.querySelector('.assets-th img'), tris: n.querySelector('.assets-tris'),
      kb: n.querySelector('.assets-kb'), sp: n.querySelector('.assets-st .spin'),
    }));
    const total = card.querySelector('.assets-total');
    const ttris = card.querySelector('.assets-ttris'), tmb = card.querySelector('.assets-tmb');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.list, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the generating chip: spinner and a count of the models already made, then a check and "Made 6 models"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('assets-done', chipDone);
        const cl = chipDone ? `Made ${PROPS.length} models` : 'Generating 3D models';
        if (clab.textContent !== cl) clab.textContent = cl;
        ccount.style.display = chipDone ? 'none' : '';

        // the card rises as one sheet behind its first row
        const ci = seg(t, T.list, T.list + 0.45);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // each model: the row drops in, its thumbnail comes out of the blur while its triangles climb, then the
        // status resolves to a check, the size lands and the file name lights up
        let trisSum = 0, kbSum = 0, ready = 0;
        rows.forEach((row, i) => {
          const a = T.row[i], b = T.done[i];
          const p = seg(t, a, b), e = outCubic(p), done = t >= b;
          rise(row.n, seg(t, a, a + 0.3), 7);
          row.img.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 14).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
          row.img.style.opacity = lerp(0.25, 1, e).toFixed(3);
          row.img.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          const c = PROPS[i][2] * e;
          trisSum += c;
          const ts = `${tris(c)} tris`;
          if (row.tris.textContent !== ts) row.tris.textContent = ts;
          const kb = PROPS[i][3] * e;
          kbSum += kb;
          const ks = `${Math.round(kb)} KB`;
          if (row.kb.textContent !== ks) row.kb.textContent = ks;
          row.kb.style.opacity = seg(t, b - 0.12, b + 0.16).toFixed(3);
          row.sp.classList.toggle('done', done);
          row.sp.style.transform = done ? '' : `rotate(${(((t - a) * 420) % 360).toFixed(1)}deg)`;
          row.n.classList.toggle('on', done);
          if (done) ready++;
        });

        // the chip counts the same six rows the card is filling
        const cs = `${ready} / ${PROPS.length}`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // the total row: the last thing to land, carrying the sum of the numbers above it
        rise(total, seg(t, T.total, T.total + 0.34), 6);
        const tt = `${tris(t >= T.total ? TOTAL_TRIS : trisSum)} tris`;
        if (ttris.textContent !== tt) ttris.textContent = tt;
        const tm = mb(t >= T.total ? TOTAL_KB : kbSum);
        if (tmb.textContent !== tm) tmb.textContent = tm;
      },
    };
  },
};