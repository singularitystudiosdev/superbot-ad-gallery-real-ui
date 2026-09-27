// Music beat: Lyria scores Turbo Kart Rally's race soundtrack. Its line streams, the "Composing 3 tracks" chip lands
// and spins, the soundtrack card rises under its checkered edge, and each track row lands and fills its waveform
// left to right as it is generated, staggered, stamping its length once it is done. The waveforms wear the game's
// title palette: TURBO orange for the circuit theme, KART RALLY blue for the final lap, and the two mixed for the
// podium. The chip resolves to "Composed 3 tracks".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scoring the race first, so every lap has a beat.';
// [title, length, tag, palette]: the three loops, in the order they are composed
const TRACKS = [
  ['Palm Cove Circuit', '2:04', '148 BPM', 'o'],
  ['Final Lap Rush', '1:36', '172 BPM', 'b'],
  ['Victory Podium', '0:48', 'loop', 'm'],
];
const BARS = 30;     // waveform bars per track
const FILL = 0.95;   // seconds one track takes to fill its waveform
const STAGGER = 0.32;
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

// fixed bar heights (0.22..1) per track: a cheap deterministic hash so every frame draws the same waveform
const heights = (seed) => Array.from({ length: BARS }, (_, i) => {
  const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  const env = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
  return (0.22 + 0.78 * (v - Math.floor(v))) * env;
});
// the mixed podium wave runs TURBO orange into KART RALLY blue across its bars: a static per-bar colour
const hex = (a, b, f) => '#' + [0, 2, 4].map((o) => Math.round(lerp(parseInt(a.slice(o, o + 2), 16), parseInt(b.slice(o, o + 2), 16), f)).toString(16).padStart(2, '0')).join('');
const barStyle = (pal, h, j) => {
  const hs = `height:${(h * 100).toFixed(1)}%`;
  if (pal !== 'm') return hs;
  const f = j / (BARS - 1);
  return `${hs};background:linear-gradient(180deg,${hex('ffd23f', '8fd0ff', f)},${hex('ff9a1f', '3aa0ff', f)})`;
};

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.track = TRACKS.map((_, i) => r + 0.62 + i * STAGGER);
    T.fill = T.track.map((a) => a + 0.12);
    T.done = T.fill[TRACKS.length - 1] + FILL;
    T.end = T.done + 0.45;   // the last length stamp lands at T.done + 0.2: 0.25s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing 3 tracks</span></div></div>');
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>Turbo Kart Rally: soundtrack</b><small>kart-pop, 3 loops</small></div>
      ${TRACKS.map(([title, len, tag, pal], i) => `<div class="mus-row mus-${pal}">
        <span class="mus-btn">${PLAY}</span>
        <span class="mus-main"><span class="mus-title">${x.esc(title)}<em class="mus-tag">${x.esc(tag)}</em></span>
          <span class="mus-wave">${heights(i + 1).map((h, j) => `<i style="${barStyle(pal, h, j)}"></i>`).join('')}</span></span>
        <span class="mus-len">${x.esc(len)}</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row) => ({ row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len') }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.track[TRACKS.length - 1], rows[TRACKS.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the last track has filled
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Composed 3 tracks' : 'Composing 3 tracks';
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each track lands, fills its waveform left to right, then stamps its length
        rows.forEach(({ row, bars, len }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fill[i] + FILL);
          bars.forEach((b, j) => {
            const on = seg(p * BARS, j, j + 1.5);
            b.style.opacity = lerp(0.18, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.25, 1, outCubic(on)).toFixed(3)})`;
          });
          row.classList.toggle('mus-live', p > 0 && p < 1);
          len.style.opacity = outCubic(seg(t, T.fill[i] + FILL - 0.1, T.fill[i] + FILL + 0.2)).toFixed(3);
        });
      },
    };
  },
};
