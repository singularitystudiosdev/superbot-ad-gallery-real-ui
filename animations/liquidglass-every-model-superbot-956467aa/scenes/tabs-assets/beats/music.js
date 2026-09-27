// Music beat: Lyria scores the Liquid Glass reel. Its line streams, the "Composing 3 tracks" chip lands and spins,
// the soundtrack card morphs in on the 120 BPM grid, and each track row lands, then fills its frosted-glass waveform
// left to right as it is composed: a refraction sheen sweeps the bars once per beat (every 0.5s), a glass playhead
// orb rides the fill front, and the row stamps its length once it is done. The chip resolves to "Composed 3 tracks".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Composing the Liquid Glass soundtrack, three tracks at 120 BPM.';
// [title, artist, sleeve, length]: the three tracks, in the order they are composed. sleeve 'art' takes the album
// art out of img/lg/art-player.jpg (the Digital Clouds player); '' uses the reel's CSS gradient sleeve instead.
const TRACKS = [
  ['Digital Clouds', 'A.M.', 'art', '3:32'],
  ['Glass Hearts', 'Nova Bloom', '', '3:36'],
  ['Liquid Glass, main theme', 'reel bed', '', '1:04'],
];
const BARS = 30;     // waveform bars per track
const FILL = 0.95;   // seconds one track takes to fill its waveform
const STAGGER = 0.32;
const BEAT = 0.5;    // 120 BPM: one beat every 0.5s, the grid the sheen, the orb and the ticks move on
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play-ic" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
const PAUSE = '<svg class="mus-pause-ic" viewBox="0 0 24 24"><rect x="7" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2"/></svg>';

// fixed bar heights (0.22..1) per track: a cheap deterministic hash so every frame draws the same waveform
const heights = (seed) => Array.from({ length: BARS }, (_, i) => {
  const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  const env = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
  return (0.22 + 0.78 * (v - Math.floor(v))) * env;
});

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
    const chip = x.el('<div class="dd-chiprow mus-chip" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing 3 tracks</span></div></div>');
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>Liquid Glass: soundtrack</b><small>120 BPM · 3 tracks</small>
        <span class="mus-eq">${'<i></i>'.repeat(5)}</span></div>
      ${TRACKS.map(([title, artist, sleeve, len], i) => `<div class="mus-row">
        <span class="mus-btn"><span class="mus-i-play">${PLAY}</span><span class="mus-i-pause">${PAUSE}</span></span>
        <span class="mus-art${sleeve === 'art' ? ' mus-art-arm' : ' mus-art-grad'}">${sleeve === 'art' ? `<img src="${x.img('lg/art-player.jpg')}" alt=""/>` : ''}</span>
        <span class="mus-main">
          <span class="mus-t"><span class="mus-title">${x.esc(title)}</span><span class="mus-artist">${x.esc(artist)}</span></span>
          <span class="mus-wave">${heights(i + 1).map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}<span class="mus-sheen"></span><span class="mus-orb"></span></span>
        </span>
        <span class="mus-len">${x.esc(len)}</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row) => ({
      row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len'),
      sheen: row.querySelector('.mus-sheen'), orb: row.querySelector('.mus-orb'),
    }));
    const eq = [...card.querySelectorAll('.mus-eq i')];
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

        // the one beat grid: beat = 0 on each beat, 1 just before the next. pulse is the springy decay after it.
        const beat = ((t % BEAT) + BEAT) % BEAT / BEAT;
        const pulse = Math.pow(1 - beat, 2);

        // the card morphs in on the grid: opacity cubic, scale springy (outBack overshoot)
        const ci = seg(t, T.card, T.card + 0.5);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? 'none'
          : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.94, 1, outBack(ci)).toFixed(4)})`;

        // the header equalizer: five accent ticks hopping on the beat grid
        eq.forEach((e, j) => {
          const w = Math.abs(Math.sin((t / BEAT + j * 0.17) * Math.PI));
          e.style.transform = `scaleY(${(0.32 + 0.68 * w).toFixed(3)})`;
        });

        // each track lands, fills its waveform left to right, sheen sweeping once per beat, orb riding the front
        rows.forEach(({ row, bars, len, sheen, orb }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fill[i] + FILL);
          const head = p * BARS;
          bars.forEach((b, j) => {
            const on = seg(head, j, j + 1.5);
            b.style.setProperty('--on', on.toFixed(3));   // ink ghost -> frosted white glass (music.css i::after)
            b.style.transform = `scaleY(${(lerp(0.24, 1, outCubic(on)) * (1 + 0.12 * pulse * on)).toFixed(3)})`;
          });
          row.classList.toggle('mus-live', p > 0 && p < 1);
          row.classList.toggle('mus-play', p >= 1);            // filled: the loop is playing, the button goes pause
          const lit = seg(p, 0, 0.05);
          sheen.style.opacity = (lit * (0.5 + 0.5 * pulse)).toFixed(3);
          sheen.style.left = `${(-46 + 146 * beat).toFixed(1)}%`;
          orb.style.opacity = lit.toFixed(3);
          orb.style.left = `calc(7px + ${p.toFixed(4)} * (100% - 14px))`;   // stays whole inside the trough at p=1
          orb.style.transform = `translate(-50%, -50%) scale(${(1 + 0.4 * pulse).toFixed(3)})`;
          len.style.opacity = outCubic(seg(t, T.fill[i] + FILL - 0.1, T.fill[i] + FILL + 0.2)).toFixed(3);
        });
      },
    };
  },
};