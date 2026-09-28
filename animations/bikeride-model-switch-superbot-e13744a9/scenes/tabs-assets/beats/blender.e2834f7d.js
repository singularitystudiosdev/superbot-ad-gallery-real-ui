// Blender beat: superbot connects Blender and it models the ride's props. Its line streams, the "Exporting 4 models"
// chip spins, and a row of four asset tiles rises: each tile lands, its render sharpens as the export runs, and its
// .glb name lands with a green check. The chip resolves to "Exported 4 models". No counts are shown (no triangles,
// no sizes): only what was made. The renders are img/bike/asset-*.jpg (see img/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Modeled the bike, the farmhouse, a vending machine and the cedars. Exported for the web.';
// [render, exported file]
const ASSETS = [
  ['bike/asset-bike.jpg', 'bike.glb'],
  ['bike/asset-house.jpg', 'farmhouse.glb'],
  ['bike/asset-vending.jpg', 'vending.glb'],
  ['bike/asset-tree.jpg', 'cedar.glb'],
];
const CPS = 80;
const RISE = 0.3;                        // the chip, the row and each tile rising in
const STAGGER = 0.22;                    // one tile landing to the next
const EXPORT = 0.5; /* deliberate */     // one tile's render sharpening while it exports, then its check
const CHECK = 0.2;                       // the check landing
const TAIL = 0.35;                       // the last check to the beat's end

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.row = r + 0.36;
    T.tile = ASSETS.map((_, i) => T.row + i * STAGGER);
    T.ok = T.tile.map((a) => a + EXPORT);
    T.done = T.ok[ASSETS.length - 1];
    T.end = Math.max(T.done + CHECK, r + SAY.length / CPS) + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow bl-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Exporting ${ASSETS.length} models</span></div></div>`);
    const row = x.el(`<div class="bl-row">${ASSETS.map(([src, file]) => `<div class="bl-tile">
      <div class="bl-shot"><img src="${x.img(src)}" alt="${x.esc(file)}"/></div>
      <span class="bl-cap"><b>${x.esc(file)}</b>${x.OK}</span>
    </div>`).join('')}</div>`);
    const tiles = [...row.children].map((n) => ({ n, img: n.querySelector('img'), ok: n.querySelector('.qc-ok'), cap: n.querySelector('.bl-cap b') }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, row],
      marks: [[T.r, say], [T.chip, chip], [T.row, row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the export chip: lands, spins, then resolves once the last model has exported
        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Exported ${ASSETS.length} models` : `Exporting ${ASSETS.length} models`;
        if (lab.textContent !== cl) lab.textContent = cl;

        row.style.opacity = seg(t, T.row, T.row + 0.05).toFixed(3);
        tiles.forEach((m, i) => {
          rise(m.n, seg(t, T.tile[i], T.tile[i] + RISE), 12);
          // the render sharpens and takes its colour while it exports
          const e = outCubic(seg(t, T.tile[i], T.ok[i]));
          m.img.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 6).toFixed(2)}px) saturate(${lerp(0.15, 1, e).toFixed(3)})`;
          m.img.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.06, 1, e).toFixed(4)})`;
          // the file name is dim until it has exported, then the check lands beside it
          const c = outCubic(seg(t, T.ok[i], T.ok[i] + CHECK));
          m.cap.style.opacity = lerp(0.45, 1, c).toFixed(3);
          m.ok.style.opacity = c.toFixed(3);
          m.ok.style.transform = c >= 1 ? 'none' : `scale(${lerp(0.4, 1, c).toFixed(4)})`;
        });
      },
    };
  },
};
