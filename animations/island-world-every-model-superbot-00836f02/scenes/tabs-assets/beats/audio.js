// Audio beat: superbot makes the island's soundscape in ElevenLabs. Its line streams, the four-track card lands one
// row at a time, and each waveform draws itself in from the left as that clip "generates". Once the last one has
// finished the chip resolves to "Made 4 tracks" and the first row starts playing: its played bars tint blue, a
// playhead runs the wave and its clock counts up. Pure function of t: every moving value is written from t, so ?t=
// freezes a frame.
import { clamp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Made the island soundscape.';
const N = 56;         // bars per waveform
const GEN = 0.5;      // seconds one waveform takes to draw itself in
const STAGGER = 0.17; // gap between one row landing and the next
const CLOCK = 2;      // the playing row's counter runs at 2x so the number visibly climbs inside the beat
// the four clips the ask turns into: name, its length, whether it loops, and the shape of its waveform
const TRACKS = [
  { name: 'Ocean waves', dur: '2:00', loop: true, shape: 'waves' },
  { name: 'Seagulls', dur: '0:45', loop: false, shape: 'gulls' },
  { name: 'Wind in the palms', dur: '1:30', loop: true, shape: 'wind' },
  { name: 'Footsteps on sand', dur: '0:12', loop: false, shape: 'sand' },
];

/** one bar's height 0..1 for a track shape: sines give the envelope, lib's seeded rand gives the texture, so the
    same waveform comes back on every frame and every reload (no Math.random anywhere in this beat) */
function barH(shape, i) {
  const u = i / (N - 1);
  if (shape === 'waves') {
    // slow swells: a rolling sine lifted by a slower one, with a thin noise wake on top
    const swell = 0.55 + 0.45 * Math.sin(u * 8.2 - 1.1);
    return clamp(0.16 + 0.7 * Math.abs(Math.sin(u * 11 + 0.4)) * swell + 0.07 * rand(i * 3.7 + 11), 0.1, 1);
  }
  if (shape === 'gulls') {
    // sparse spikes: a flat sea with a few calls that lift a bar or two high
    return clamp(0.09 + 0.86 * Math.pow(rand(i * 2.3 + 41), 5) + 0.05 * rand(i * 5.1 + 3), 0.08, 1);
  }
  if (shape === 'wind') {
    // a low dense bed: small amplitude, restless, never a peak
    return clamp(0.09 + 0.24 * rand(i * 4.7 + 7) + 0.12 * Math.abs(Math.sin(u * 27 + 1.7)), 0.08, 0.5);
  }
  // footsteps: a regular pulse every seven bars that decays until the next one lands
  const ph = (i % 7) / 7;
  return clamp(0.09 + 0.9 * Math.pow(1 - ph, 4) * (0.72 + 0.28 * rand(i * 1.9 + 23)), 0.08, 1);
}
// every waveform's bar heights, computed once: 4 x 56 fixed numbers for the whole beat
const WAVES = TRACKS.map((tr) => Array.from({ length: N }, (_, i) => barH(tr.shape, i)));

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;                                          // the "Generating audio" chip lands
    T.row = TRACKS.map((_, i) => r + 0.32 + i * STAGGER);      // each track row rises in
    T.draw = T.row.map((a) => a + 0.05);                       // ...and its waveform starts drawing itself
    T.done = T.draw[TRACKS.length - 1] + GEN + 0.06;           // the last one is drawn: the chip resolves
    T.play = T.done + 0.3;                                     // the first row switches to playing
    T.end = r + 3.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating audio</span></div></div>');
    const card = x.el(`<div class="audio-card">
      <div class="audio-hd"><span class="audio-hd-t">Island soundscape</span><span class="audio-hd-n">4 tracks</span></div>
      <div class="audio-rows">${TRACKS.map((tr) => `<div class="audio-row">
        <span class="audio-btn"><svg class="audio-ic" viewBox="0 0 12 12" aria-hidden="true">
          <path class="audio-ic-play" d="M4.1 2.5 9.6 6l-5.5 3.5z"/>
          <g class="audio-ic-pause"><rect x="3.5" y="2.7" width="1.7" height="6.6" rx=".7"/><rect x="6.8" y="2.7" width="1.7" height="6.6" rx=".7"/></g>
        </svg></span>
        <span class="audio-name">${x.esc(tr.name)}</span>
        <span class="audio-meta">${x.esc(tr.dur)}${tr.loop ? ' loop' : ''}</span>
        <span class="audio-wave"><span class="audio-bars">${'<i></i>'.repeat(N)}</span><i class="audio-head"></i></span>
      </div>`).join('')}</div>
    </div>`);
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), clab = chipEl.querySelector('.ch-tool-t');
    const rows = [...card.querySelectorAll('.audio-row')].map((row, i) => ({
      row, meta: row.querySelector('.audio-meta'),
      bars: [...row.querySelectorAll('.audio-bars i')],
      head: row.querySelector('.audio-head'),
      idle: `${TRACKS[i].dur}${TRACKS[i].loop ? ' loop' : ''}`,
      last: null,
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      // the card is scrolled into view as its first row lands, and again when the first row starts playing
      marks: [[T.r, say], [T.chip, chip], [T.row[0], card], [T.play, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the audio chip: a spinner while the clips generate, a check and "Made 4 tracks" once the last wave is drawn
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Made 4 tracks' : 'Generating audio';
        if (clab.textContent !== cl) clab.textContent = cl;

        // the card lands with its first row; the rows themselves stagger
        card.style.opacity = outCubic(seg(t, T.row[0] - 0.08, T.row[0] + 0.18)).toFixed(3);

        // the first row plays from T.play: playhead across the wave, played bars tinted, clock counting up
        const playing = t >= T.play;
        const p = seg(t, T.play, T.end);
        const pt = clamp(t - T.play, 0, T.end - T.play);
        const clock = `${mmss(pt * CLOCK)} / ${TRACKS[0].dur}`;

        rows.forEach((r, i) => {
          rise(r.row, seg(t, T.row[i], T.row[i] + 0.32), 8);
          // the waveform draws itself left to right: a draw front sweeps the strip and each bar climbs as it passes
          const g = seg(t, T.draw[i], T.draw[i] + GEN);
          const front = g * (1 + 2 / N);   // runs a touch past the last bar so the strip finishes full
          r.bars.forEach((b, j) => {
            const jf = j / (N - 1);
            const h = WAVES[i][j] * outCubic(clamp((front - jf) / 0.18));
            b.style.transform = h > 0.9995 ? 'scaleY(1)' : `scaleY(${h.toFixed(4)})`;
            if (i === 0) b.classList.toggle('on', playing && jf <= p);
          });
          r.row.classList.toggle('playing', i === 0 && playing);
          if (i === 0) {
            const text = playing ? clock : r.idle;
            if (r.last !== text) { r.meta.textContent = text; r.last = text; }
            r.head.style.left = `${(p * 100).toFixed(2)}%`;
            r.head.style.opacity = playing ? '1' : '0';
          }
        });
      },
    };
  },
};