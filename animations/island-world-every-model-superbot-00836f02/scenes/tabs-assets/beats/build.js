// Build beat: a coding step shown only as its RESULT, never as code. The routed model's line streams, a working chip
// spins while the rows land, each row (a file name, or a test suite and its count) settles lit with a check, and the
// card's footer stamps the result. opts.set picks the card: 'world' | 'core' | 'water' | 'controls' | 'tests'.
// times(r, opts) sizes the beat to its own row count, so the next beat starts the moment this one lands (no idle tail).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

// rows are [label, right-hand tag]: files carry no tag, test suites carry their passed count
const SETS = {
  world: {
    say: 'Built the island world.', busy: 'Writing the island', done: 'Wrote 6 files',
    title: 'Palm Isle', result: 'Terrain, water, palms, village and controls',
    rows: [['terrain.ts'], ['water.frag.glsl'], ['foliage.ts'], ['village.ts'], ['controls.ts'], ['main.ts']],
  },
  core: {
    say: 'Building the terrain and the water.', busy: 'Writing code', done: 'Wrote 5 files',
    title: 'Palm Isle', result: 'Island terrain and a shaded ocean',
    rows: [['terrain.ts'], ['heightmap.ts'], ['water.frag.glsl'], ['water.vert.glsl'], ['shore-foam.glsl']],
  },
  water: {
    say: 'Built the water shader.', busy: 'Writing the shader', done: 'Wrote 4 files',
    title: 'Water', result: 'Waves, depth colour and shore foam',
    rows: [['water.frag.glsl'], ['water.vert.glsl'], ['foam.glsl'], ['water.ts']],
  },
  controls: {
    say: 'Added walking, jumping and the camera.', busy: 'Writing controls', done: 'Wrote 4 files',
    title: 'Controls', result: 'WASD, jump, mouse look',
    rows: [['controls.ts'], ['camera.ts'], ['interact.ts'], ['hud.tsx']],
  },
  tests: {
    say: 'Ran the tests. Everything passes.', busy: 'Running tests', done: '14 passed',
    title: 'Test run', result: '14 passed, 0 failed', tests: true,
    rows: [['Terrain', '4 passed'], ['Water shader', '3 passed'], ['Controls', '4 passed'], ['Village', '3 passed']],
  },
};
const pick = (opts) => SETS[(opts && opts.set) || 'world'] || SETS.world;

const ROW0 = 0.4;   // first row lands this long after the reply
const GAP = 0.16;   // stagger between rows
const SETTLE = 0.22; // a row's spinner turns into a check this long after it lands

export default {
  times(r, opts) {
    const S = pick(opts);
    const T = { r };
    T.chip = r + 0.16;                                         // the working chip lands
    T.card = r + 0.28;                                         // the card rises
    T.row = S.rows.map((_, i) => r + ROW0 + i * GAP);          // each row lands...
    T.lit = T.row.map((a) => a + SETTLE);                      // ...and settles lit
    T.done = T.lit[S.rows.length - 1] + 0.06;                  // the chip resolves, the footer stamps
    T.end = T.done + 0.5;                                      // just long enough to read the result
    return T;
  },
  build(k, x) {
    const T = k.T, S = pick(k.opts);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(S.busy)}</span></div></div>`);
    const card = x.el(`<div class="build-card${S.tests ? ' build-tests' : ''}">
      <div class="build-hd"><span class="build-title">${x.esc(S.title)}</span><span class="build-n"></span></div>
      <i class="build-bar"><i></i></i>
      <div class="build-rows">${S.rows.map(([name, tag]) => `<div class="build-row">
        <span class="build-st"><i class="spin"></i>${x.OK}</span>
        <span class="build-name">${x.esc(name)}</span>${tag ? `<span class="build-tag">${x.esc(tag)}</span>` : ''}
      </div>`).join('')}</div>
      <div class="build-ft">${x.OK}<span>${x.esc(S.result)}</span></div>
    </div>`);
    const chipSpin = chip.querySelector('.spin'), chipLab = chip.querySelector('.ch-tool-t');
    const count = card.querySelector('.build-n'), fill = card.querySelector('.build-bar i'), ft = card.querySelector('.build-ft');
    const rows = [...card.querySelectorAll('.build-row')].map((n) => ({ n, spin: n.querySelector('.spin'), ok: n.querySelector('.qc-ok') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const unit = S.tests ? 'suites' : 'files';
    let shown = -1, lastCount = null;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.done, card]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the working chip: spins while the rows land, then a check and the result count
        const ci = outCubic(seg(t, T.chip, T.chip + 0.28));
        chip.style.opacity = ci.toFixed(3);
        chip.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 6).toFixed(2)}px)`;
        const done = t >= T.done;
        chipSpin.classList.toggle('done', done);
        chipSpin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? S.done : S.busy;
        if (chipLab.textContent !== cl) chipLab.textContent = cl;

        // the card rises as one sheet; its bar fills as rows settle and its counter follows
        const ki = outCubic(seg(t, T.card, T.card + 0.35));
        card.style.opacity = ki.toFixed(3);
        card.style.transform = ki >= 1 ? '' : `translateY(${((1 - ki) * 12).toFixed(2)}px)`;
        const lit = T.lit.filter((a) => t >= a).length;
        const txt = `${lit} / ${S.rows.length} ${unit}`;
        if (txt !== lastCount) { count.textContent = txt; lastCount = txt; }
        fill.style.transform = `scaleX(${seg(t, T.row[0], T.done).toFixed(4)})`;

        rows.forEach((r, i) => {
          const p = outCubic(seg(t, T.row[i], T.row[i] + 0.24));
          r.n.style.opacity = p.toFixed(3);
          r.n.style.transform = p >= 1 ? '' : `translateX(${((1 - p) * 10).toFixed(2)}px)`;
          const on = t >= T.lit[i];
          r.n.classList.toggle('on', on);
          r.spin.style.opacity = on ? '0' : '1';
          r.spin.style.transform = `rotate(${(((t - T.row[i]) * 480) % 360).toFixed(1)}deg)`;
          const o = seg(t, T.lit[i], T.lit[i] + 0.2);
          r.ok.style.opacity = o.toFixed(3);
          r.ok.style.transform = `scale(${(0.4 + 0.6 * outBack(o)).toFixed(4)})`;
        });

        // the footer stamps the result once every row is in
        const f = outCubic(seg(t, T.done, T.done + 0.26));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
