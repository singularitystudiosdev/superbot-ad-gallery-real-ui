// Sound beat: ElevenLabs generates the ride's four sound effects. Its line streams, the "Generating 4 sound effects"
// chip spins, and the takes list rises: each row lands, a level meter pulses in its tile while the take generates,
// then settles into the take's still waveform, and its status pill flips from Generating to Ready. The chip resolves
// to "Generated 4 sound effects". No durations are shown: only what was made.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Cicadas, a bike bell, gravel under the tires, wind in the rice.';
// [take, file]
const TAKES = [
  ['Cicadas', 'cicadas.wav'],
  ['Bike bell', 'bike-bell.wav'],
  ['Gravel', 'gravel.wav'],
  ['Wind in the rice', 'wind-in-the-rice.wav'],
];
const CPS = 80;
const GEN = 0.8; /* deliberate */  // one take generating
const STAGGER = 0.22;              // one row landing to the next
const RISE = 0.3;                  // the chip, the card and each row rising in
const LVL = 5;                     // level-meter bars in a take's tile
// the resting waveform each take settles into (0..1 per bar): a hum, a ring and decay, a crunch, a swell
const REST = [[0.5, 0.7, 0.6, 0.75, 0.55], [1, 0.7, 0.45, 0.3, 0.2], [0.6, 0.9, 0.5, 0.85, 0.6], [0.3, 0.55, 0.8, 0.6, 0.35]];

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = TAKES.map((_, i) => r + 0.55 + i * STAGGER);
    T.done = T.row[TAKES.length - 1] + GEN;
    T.end = Math.max(T.done, r + SAY.length / CPS) + 0.4;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating ${TAKES.length} sound effects</span></div></div>`);
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Sound effects</b><small class="as-sum">${TAKES.length} takes</small></div>
      ${TAKES.map(([name, file]) => `<div class="as-row">
        <span class="as-th"><i class="as-lvl">${'<b></b>'.repeat(LVL)}</i></span>
        <span class="as-main"><b class="as-file">${x.esc(name)}</b><small>${x.esc(file)}</small></span>
        <span class="as-st">Generating</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, bars: [...row.querySelectorAll('.as-lvl b')], st: row.querySelector('.as-st'),
    }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[TAKES.length - 1], rows[TAKES.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Generated ${TAKES.length} sound effects` : `Generating ${TAKES.length} sound effects`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + RISE), 6);
          const p = seg(t, a + 0.1, a + GEN);
          // the meter: each bar moves on its own phase while the take generates, then eases into the take's waveform
          const settle = outCubic(seg(p, 0.6, 1));
          m.bars.forEach((b, j) => {
            const live = Math.abs(Math.sin(t * (7.3 + j * 1.9) + i * 2.1 + j * 1.3));
            b.style.transform = `scaleY(${lerp(lerp(0.22, 1, live), REST[i][j], settle).toFixed(3)})`;
          });
          const ready = p >= 1;
          m.row.classList.toggle('as-ready', ready);
          const st = ready ? 'Ready' : 'Generating';
          if (m.st.textContent !== st) m.st.textContent = st;
        });
      },
    };
  },
};
