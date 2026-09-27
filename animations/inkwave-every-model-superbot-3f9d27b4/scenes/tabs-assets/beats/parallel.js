// Parallel beat: superbot splits the job across two models at once. The line streams, then two lanes rise side by
// side, each signed with its model: Claude Opus 5.5 writes the engine files (each file ticks in and counts its
// lines) while Gemini paints the four textures (each resolves out of a blur). Each lane has its own progress bar and
// spinner and finishes on its own clock; a "Merged" chip lands once both are done.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Splitting it: Opus writes the ink engine while Gemini paints the ink decals.';
const FILES = [['ink-renderer.ts', 318], ['squid-kid.ts', 246], ['turf.ts', 402], ['splat-burst.ts', 173]];
const TEX = ['ink/art-1.jpg', 'ink/art-2.jpg', 'ink/art-3.jpg', 'ink/art-4.jpg'];
const LANES = [
  { app: 'opus', name: 'Claude Opus 5.5', task: 'Ink engine', a: 0.55, b: 3.0 },
  { app: 'gemini', name: 'Gemini', task: 'Ink textures', a: 0.7, b: 3.35 },
];
const MERGED = 'Merged: engine + 4 textures';
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.lanes = r + 0.35;
    T.run = LANES.map((l) => [r + l.a, r + l.b]);
    T.merge = Math.max(...T.run.map((x) => x[1])) + 0.2;
    T.end = T.merge + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const lanes = x.el(`<div class="pl-lanes">${LANES.map((l, li) => `<div class="pl-lane">
      <div class="pl-hd">${x.tile(l.app)}<b>${x.esc(l.name)}</b><span class="pl-st"><span class="spin"></span></span></div>
      <small class="pl-task">${x.esc(l.task)}</small>
      <div class="pl-bar"><i></i></div>
      ${li === 0
    ? `<div class="pl-files">${FILES.map(([f]) => `<span class="pl-file"><span>${x.esc(f)}</span><b>0</b></span>`).join('')}</div>`
    : `<div class="pl-tex">${TEX.map((src) => `<img src="${x.img(src)}" alt=""/>`).join('')}</div>`}
    </div>`).join('')}</div>`);
    const merged = x.el(`<div class="dd-chiprow pl-mergerow"><div class="ch-tool"><span class="spin done"></span><span class="ch-tool-t">${x.esc(MERGED)}</span></div></div>`);
    const laneEls = [...lanes.children].map((n) => ({ n, bar: n.querySelector('.pl-bar i'), spin: n.querySelector('.pl-st .spin') }));
    const files = [...lanes.querySelectorAll('.pl-file')].map((n) => ({ n, b: n.querySelector('b') }));
    const tex = [...lanes.querySelectorAll('.pl-tex img')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, lanes, merged],
      marks: [[T.r, say], [T.lanes, lanes], [T.merge, merged]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(lanes, seg(t, T.lanes, T.lanes + 0.45), 14);

        // each lane runs on its own clock: bar fills, spinner turns, then resolves to a check
        laneEls.forEach((L, i) => {
          const [a, b] = T.run[i];
          const p = seg(t, a, b);
          L.bar.style.transform = `scaleX(${p.toFixed(4)})`;
          const done = t >= b;
          L.spin.classList.toggle('done', done);
          L.spin.style.transform = done ? '' : `rotate(${(((t - a) * 430) % 360).toFixed(1)}deg)`;
          L.n.classList.toggle('pl-done', done);
        });

        // Opus's lane: the files tick in across its run, each counting its own lines
        const [oa, ob] = T.run[0];
        files.forEach((F, i) => {
          const a = lerp(oa, ob, i / FILES.length), b = lerp(oa, ob, (i + 1) / FILES.length);
          rise(F.n, seg(t, a, a + 0.25), 5);
          const s = num(FILES[i][1] * outCubic(seg(t, a, b)));
          if (F.b.textContent !== s) F.b.textContent = s;
          F.n.classList.toggle('on', t >= b);
        });

        // Gemini's lane: each texture resolves out of a blur across its run
        const [ga, gb] = T.run[1];
        tex.forEach((img, i) => {
          const a = lerp(ga, gb, i / TEX.length), b = lerp(ga, gb, (i + 1) / TEX.length);
          const e = outCubic(seg(t, a, b));
          img.style.opacity = lerp(0.12, 1, e).toFixed(3);
          img.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 8).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
        });

        rise(merged, seg(t, T.merge, T.merge + 0.3), 6);
      },
    };
  },
};
