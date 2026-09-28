// Music beat: Lyria 2 composes the ride's loop. Its line streams, the "Composing the loop" chip lands and spins, the
// loop's card rises, and each of its two parts (the koto, the soft Rhodes under it) lands and fills its waveform left
// to right as it is generated, staggered, stamping a check once it is done. The chip resolves to "Composed the loop".
// No lengths or tempos are shown: only what was made.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'A slow lo-fi loop. Koto over soft Rhodes.';
// the loop's two parts, in the order they are composed
const TRACKS = ['Koto', 'Soft Rhodes'];
// v3 pace: every duration below is 0.8x its v2 value (the user: "about 20% faster in just its work")
const CPS = 100;                       // v2 80
const SAY_AT = 0.048;                  // reply start to the line's first character
const CHIP_AT = 0.176;                 // reply start to the "Composing the loop" chip
const CARD_AT = 0.32;                  // reply start to the loop's card
const TRACK_AT = 0.496;                // reply start to the first part landing
const FILL_AT = 0.096;                 // a part landing to its waveform starting to fill
const BARS = 36;                       // waveform bars per part
const FILL = 0.76; /* deliberate */    // one part filling its waveform as it is generated
const STAGGER = 0.256; /* deliberate */ // one part starting to the next
const RISE = 0.24;                     // the chip, the card and each row rising in
const CHECK_IN = 0.08, CHECK_OUT = 0.16; // a part's check fades in from CHECK_IN before its fill ends to CHECK_OUT after
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

// fixed bar heights (0.22..1) per part: a cheap deterministic hash so every frame draws the same waveform; the koto
// plucks (spiky), the Rhodes sustains (smoother)
const heights = (seed, smooth) => Array.from({ length: BARS }, (_, i) => {
  const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  const n = v - Math.floor(v);
  const env = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
  return (0.22 + 0.78 * (smooth ? 0.55 + 0.45 * n : n)) * env;
});

export default {
  times(r) {
    const T = { r };
    T.chip = r + CHIP_AT;
    T.card = r + CARD_AT;
    T.track = TRACKS.map((_, i) => r + TRACK_AT + i * STAGGER);
    T.fill = T.track.map((a) => a + FILL_AT);
    T.done = T.fill[TRACKS.length - 1] + FILL;
    // the beat's last visible change: the last part's check fully in (r + 1.768)
    T.end = Math.max(T.done + CHECK_OUT, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing the loop</span></div></div>');
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>ride-loop</b><small>Lo-fi, koto and Rhodes</small></div>
      ${TRACKS.map((title, i) => `<div class="mus-row">
        <span class="mus-btn">${PLAY}</span>
        <span class="mus-main"><span class="mus-title">${x.esc(title)}</span>
          <span class="mus-wave">${heights(i + 1, i === 1).map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}</span></span>
        <span class="mus-len">${x.OK}</span>
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
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the last part has filled
        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Composed the loop' : 'Composing the loop';
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each part lands, fills its waveform left to right, then stamps its check
        rows.forEach(({ row, bars, len }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + RISE), 6);
          const p = seg(t, T.fill[i], T.fill[i] + FILL);
          bars.forEach((b, j) => {
            const on = seg(p * BARS, j, j + 1.5);
            b.style.opacity = lerp(0.18, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.25, 1, outCubic(on)).toFixed(3)})`;
          });
          row.classList.toggle('mus-live', p > 0 && p < 1);
          len.style.opacity = outCubic(seg(t, T.fill[i] + FILL - CHECK_IN, T.fill[i] + FILL + CHECK_OUT)).toFixed(3);
        });
      },
    };
  },
};
