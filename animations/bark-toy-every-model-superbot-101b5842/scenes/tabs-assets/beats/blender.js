// Blender — the 3D. Its job: the four-view sheet becomes a real mesh, watertight, hollowed for the speaker and
// the paw switch, and small enough to print. The pane is the viewport: the model turntable-playing on the
// Cycles render, a wireframe pass over it, the N-panel numbers, and the print slice at the bottom.
// The numbers are the real ones from the Blender build in assets-src (mesh stats + boolean cavity).
import { seg, outCubic, lerp, streamCount } from '../../../lib.js';

const SAY = 'Modelled him: watertight, 42,612 tris, 88 mm tall, cavity for the chip.';
const ROWS = [
  ['Modelling the turnaround', 'Modelled from the 4 views · watertight'],
  ['Hollowing the speaker and the paw', 'Hollowed 28 × 14 × 6 mm · paw switch 12 mm'],
  ['Exporting for print', 'Exported biscuit_toy.stl · 2.1 MB'],
];
// the numbers in the N-panel are this build's real output (gen/blender-stats.101b5842.json)
export const STATS = { tris: '42,612', verts: '21,308', size: '88.0 × 54.5 × 75.6', cav: '28 × 14 × 6 mm', file: 'biscuit_toy.stl · 2.1 MB', slice: 'slice 6h 40m' };

export default {
  times(r) {
    const T = { r };
    T.rows = [r + 0.12, r + 0.6, r + 1.1];
    T.rowsDone = [r + 0.85, r + 1.35, r + 1.85];
    T.play = [r + 0.35, r + 2.6];
    T.wire = [r + 1.5, r + 1.9];
    T.n = r + 0.9;
    T.end = r + 3.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const v = x.pane.el('bl');
    const img = x.pane.q('bl', '#bl-img');
    const wire = x.pane.q('bl', '#bl-wire');
    const frameEl = x.pane.q('bl', '#bl-frame');
    const modeEl = x.pane.q('bl', '#bl-mode');
    const ticks = [...x.pane.q('bl', '#bl-frames').children];
    const nvals = { '#bl-verts': STATS.verts, '#bl-tris': STATS.tris, '#bl-size': STATS.size, '#bl-cav': STATS.cav, '#bl-file': STATS.file };
    const nPills = Object.fromEntries(Object.entries(nvals).map(([s, txt]) => { const el = x.pane.q('bl', s); el.textContent = txt; return [s, el]; }));
    const print = x.pane.q('bl', '#bl-print');
    // a 16-frame turntable sheet (gen/render-toy: 16 x 576x557 px Cycles frames side by side, JPEG): background-position is
    // the frame index, so seeking to any t lands on an exact frame and the footer ticks read the same number.
    const FRAMES = 16;
    const sheet = x.img('turntable.jpg');
    const wireSheet = x.img('turntable-wire.jpg');
    img.style.backgroundImage = `url(${sheet})`;
    wire.style.backgroundImage = `url(${wireSheet})`;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.rows[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 105, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.rows[i], T.rows[i] + 0.3), 8);
          const done = t >= T.rowsDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.rows[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? ROWS[i][1] : ROWS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // viewport: the turntable plays (a stepped frame index, like a viewport at play), the wireframe cuts in
        const pp = seg(t, T.play[0], T.play[1]);
        const f = Math.min(FRAMES - 1, Math.floor(pp * FRAMES));
        const pos = ((f / (FRAMES - 1)) * 100).toFixed(2) + '% 50%';
        img.style.backgroundPosition = pos;
        wire.style.backgroundPosition = pos;
        const wp = seg(t, T.wire[0], T.wire[1]);
        wire.style.opacity = (wp > 0 && wp < 1 ? Math.sin(Math.PI * wp) : 0).toFixed(3);
        frameEl.textContent = String(f + 1).padStart(3, '0');
        modeEl.textContent = `Turntable ${(f * 22.5).toFixed(1)}°`;
        ticks.forEach((tk, i) => tk.classList.toggle('on', i <= f));
        const np = outCubic(seg(t, T.n, T.n + 0.4));
        Object.entries(nPills).forEach(([s, el], i) => { el.style.opacity = np.toFixed(3); });
        print.style.opacity = seg(t, T.rowsDone[2] - 0.2, T.rowsDone[2] + 0.2).toFixed(3);
      },
    };
  },
};