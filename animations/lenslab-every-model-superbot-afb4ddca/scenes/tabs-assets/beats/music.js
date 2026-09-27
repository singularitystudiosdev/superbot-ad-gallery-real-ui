// Music beat: Lyria scores the lens lab. Its line streams, the "Scoring 3 cues" chip lands and spins, the score card
// rises, and each cue row lands and fills its waveform left to right as it is generated, staggered, stamping its length
// once it is done. Under every waveform sits a focus ring distance scale (engraved in brass, spaced by 1/d like a real
// lens: inf, 10, 5, 3, 2, 1.5, 1 m); a cyan index pulls focus from infinity to 1 m as the cue fills, and each bar
// resolves out of defocus (blurred, faint, short) into a sharp bar the moment the index passes it. The chip resolves
// to "Scored 3 cues".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scoring the lab first: a slow ambient bed that breathes with every focus pull.';
// [title, length]: the three cues, in the order they are scored
const TRACKS = [
  ['Plane of Focus (main theme)', '2:12'],
  ['Ground Glass (ambient loop)', '1:48'],
  ['Focus Pull (stinger)', '0:14'],
];
const BARS = 30;     // waveform bars per track
const FILL = 0.95;   // seconds one track takes to fill its waveform
const STAGGER = 0.32;
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

// the focus ring engraving: [label, position], position = 1/d (metres) so the scale reads like a real lens barrel
const RING = [['∞', 0], ['10', 0.1], ['5', 0.2], ['3', 1 / 3], ['2', 0.5], ['1.5', 2 / 3], ['1', 1]];
// minor ticks every 0.025 dioptre-fraction, skipped where a labelled (major) tick already stands
const MINOR = Array.from({ length: 41 }, (_, i) => i / 40).filter((f) => RING.every(([, g]) => Math.abs(f - g) > 0.012));
// scale x for a ring position f: 6px in from the left, 12px in from the right (room for the "m" unit)
const at = (f) => `calc(6px + (100% - 18px) * ${f.toFixed(4)})`;
const TICKS = MINOR.map((f) => `<span class="mus-tk" style="left:${at(f)}"></span>`).join('')
  + RING.map(([, f]) => `<span class="mus-tk mus-mj" style="left:${at(f)}"></span>`).join('');
const LABELS = RING.map(([l, f]) => `<span class="mus-lb" style="left:${at(f)}">${l}</span>`).join('')
  + '<span class="mus-lb mus-unit" style="left:calc(100% - 4px)">m</span>';

// engraving colours: unlit brass, lit brass, the cyan of the focus index (the clip's glass glow), and the pale cyan
// a label flares to under the index (pale so the brass-to-cyan blend reads warm white, never green)
const DIM = [104, 84, 52], BRASS = [222, 172, 92], CYAN = [128, 236, 255], FLARE = [200, 246, 255];
const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u)));

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
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scoring 3 cues</span></div></div>');
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>Lens Lab: score</b><small>ambient, 3 cues</small></div>
      ${TRACKS.map(([title, len], i) => `<div class="mus-row">
        <span class="mus-btn">${PLAY}</span>
        <span class="mus-main"><span class="mus-title">${x.esc(title)}</span>
          <span class="mus-wave">${heights(i + 1).map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}<span class="mus-ring"><span class="mus-tks">${TICKS}</span><span class="mus-tks mus-lit">${TICKS}</span>${LABELS}</span><span class="mus-idx"></span></span></span>
        <span class="mus-len">${x.esc(len)}</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row) => ({
      row,
      bars: [...row.querySelectorAll('.mus-wave > i')],
      len: row.querySelector('.mus-len'),
      lit: row.querySelector('.mus-lit'),
      idx: row.querySelector('.mus-idx'),
      labels: [...row.querySelectorAll('.mus-lb')].map((el, j) => ({ el, f: j < RING.length ? RING[j][1] : 1 })),
    }));
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

        // the scoring chip: lands, spins, then resolves once the last cue has filled
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Scored 3 cues' : 'Scoring 3 cues';
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each cue lands, pulls focus from infinity to 1 m while its waveform fills left to right, then stamps its length
        rows.forEach(({ row, bars, len, lit, idx, labels }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fill[i] + FILL);
          // bars behind the index are still defocused: faint, short, blurred; the index passing snaps each one sharp
          bars.forEach((b, j) => {
            const on = seg(p * (BARS + 0.5), j, j + 1.5);   // + 0.5 so the last bar is fully sharp at p = 1
            b.style.opacity = lerp(0.3, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.5, 1, outCubic(on)).toFixed(3)})`;
            b.style.filter = on >= 1 ? 'none' : `blur(${lerp(2.2, 0, outCubic(on)).toFixed(2)}px)`;
          });
          row.classList.toggle('mus-live', p > 0 && p < 1);
          // the focus index rides the fill front along the distance scale, then fades once the cue is in focus
          const pf = p.toFixed(4);
          idx.style.left = `calc(6px + (100% - 18px) * ${pf})`;
          idx.style.opacity = (seg(p, 0, 0.04) * (1 - seg(t, T.fill[i] + FILL, T.fill[i] + FILL + 0.25))).toFixed(3);
          // the engraved ticks light brass up to the index
          lit.style.opacity = p > 0 ? '1' : '0';
          lit.style.clipPath = `inset(0 calc(100% - 7.5px - (100% - 18px) * ${pf}) 0 0)`;
          // each distance label lights brass as focus reaches it, flaring cyan while the index sits on it
          labels.forEach(({ el, f }) => {
            const on = p > 0 ? seg(p, f - 0.015, f + 0.005) : 0;
            const glow = p > 0 && p < 1 ? Math.max(0, 1 - Math.abs(p - f) / 0.07) : 0;
            const [r, g, b] = mix(mix(DIM, BRASS, on), FLARE, glow);
            el.style.color = `rgb(${r},${g},${b})`;
            el.style.textShadow = glow > 0.02 ? `0 0 4px rgba(${CYAN.join(',')},${(glow * 0.85).toFixed(3)})` : 'none';
          });
          len.style.opacity = outCubic(seg(t, T.fill[i] + FILL - 0.1, T.fill[i] + FILL + 0.2)).toFixed(3);
        });
      },
    };
  },
};
