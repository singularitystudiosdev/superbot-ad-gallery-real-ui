// Wave beat: superbot hands the score to Suno. Its line streams, the generation chip lands and resolves, and the audio
// card rises: a seeded waveform that draws left to right, the 8-bar / 4-beat grid under it, red cue markers popping in
// on each cut, and a playhead sweeping the 15 seconds. opts.kind picks the layer: 'bed' (default) is the 124 BPM music
// bed, 'sfx' the sparse hits-and-whooshes pass over the same cuts. The waveform comes from rand(seed) (never
// Math.random) and every moving value is written from t, so ?t= freezes a frame that renders the same pixels.
import { clamp, lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const DUR = 15;     // the spot is 15 seconds long: the card's waveform is the whole track
const N = 96;       // one waveform bar per ~0.16s of track
const BEATS = 32;   // 8 bars of 4 beats at 124 BPM ~ 15s, so the grid is 32 beat ticks
const INSET = 2.5;  // the drawn track (and the head's travel) is inset 2.5% at each end, so cue labels never clip
// every cue slot in scene seconds: times(r) cannot see opts, so T.cue holds a slot for each possible marker
const CUE_AT = [0, 3.1, 5.2, 7, 9, 12];

// [seconds, label, cue slot] — the bed marks the five cuts, the sfx layer its six hits
const BED = {
  say: 'Laid down a 124 BPM bed with a hit on every cut.',
  name: 'motion-ad-bed.wav',
  meta: '124 BPM · 8 bars · 0:15',
  badge: '124 BPM',
  chip: 'Generating motion-ad-bed.wav',
  done: '124 BPM bed ready',
  cues: [[0, '0:00', 0], [3.1, '0:03', 1], [7, '0:07', 3], [9, '0:09', 4], [12, '0:12', 5]],
};
const SFX = {
  say: 'Added hits and whooshes on every cut.',
  name: 'motion-ad-sfx.wav',
  meta: '6 hits · 0:15',
  badge: '6 hits',
  chip: 'Placing hits and whooshes',
  done: 'Hits and whooshes ready',
  cues: [[0, '0:00', 0], [3.1, '0:03', 1], [5.2, '0:05', 2], [7, '0:07', 3], [9, '0:09', 4], [12, '0:12', 5]],
};

/** the music bed: dense bars, a kick every beat (one bar = 12 waveform bars) and a swell through the middle */
const bedHeights = () => Array.from({ length: N }, (_, i) => {
  const noise = Math.pow(rand(i * 7.3 + 1), 0.75);
  const kick = i % 12 === 0 ? 0.26 : 0;
  const snare = i % 12 === 6 ? 0.12 : 0;
  const swell = 0.5 + 0.5 * Math.sin(Math.PI * (i / (N - 1)));
  return clamp(0.1 + (noise * 0.6 + kick + snare) * swell, 0.05, 1);
});

/** the sfx layer: quiet room tone between six transient spikes, each decaying away like a whoosh */
const sfxHeights = (hits) => Array.from({ length: N }, (_, i) => {
  const s = (i / (N - 1)) * DUR;
  let v = 0.05 + rand(i * 5.1 + 3) * 0.05 + (rand(i * 2.7 + 11) > 0.94 ? 0.12 : 0);
  hits.forEach(([sec], j) => {
    const d = Math.abs(s - sec), reach = 1.1;
    if (d < reach) v = Math.max(v, (0.92 - j * 0.05) * Math.pow(1 - d / reach, 1.6));
  });
  return clamp(v, 0.04, 1);
});

const mmss = (s) => `0:${String(Math.max(0, Math.floor(s))).padStart(2, '0')}`;
/** % across the lane for a track time: the head travels the same 2.5%..97.5% span the cues sit on */
const laneX = (sec) => INSET + (sec / DUR) * (100 - INSET * 2);

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;      // the generation chip lands
    T.chipDone = r + 0.9;  // ... and resolves
    T.card = r + 0.42;     // the audio card rises
    T.draw = r + 0.7;      // the waveform draws left -> right over ~1.55s
    T.play0 = r + 1.0;     // the playhead starts sweeping the track
    T.play1 = r + 3.2;     // ... and has covered the 15 seconds here
    // every cue slot lands just before the head reaches it, so the marker pops as the sweep arrives
    T.cue = CUE_AT.map((s) => T.play0 + (s / DUR) * (T.play1 - T.play0) - 0.25);
    T.end = r + 3.4;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sfx = !!(k.opts && k.opts.kind === 'sfx');
    const K = sfx ? SFX : BED;
    const H = sfx ? sfxHeights(K.cues) : bedHeights();
    const app = k.app || 'suno';
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(K.say)}</span></div>`);
    const chipRow = x.el(`<div class="dd-chiprow wave-genrow"><div class="ch-tool wave-gen">${x.tile(app)}<span class="spin"></span><span class="ch-tool-t">${x.esc(K.chip)}</span></div></div>`);
    const card = x.el(`<div class="wave-card">
      <div class="wave-hd">
        <svg class="wave-ic" viewBox="0 0 24 24"><path d="M3 12h2M8 5v14M13 9v6M18 3v18M21 10v4"/></svg>
        <span class="wave-name">${x.esc(K.name)}</span>
        <span class="wave-meta">${x.esc(K.meta)}</span>
      </div>
      <div class="wave-lane">
        <div class="wave-wave">${H.map(() => '<i class="wave-bar"></i>').join('')}</div>
        <div class="wave-grid">${Array.from({ length: BEATS }, (_, i) => `<i class="wave-tick${i % 4 === 0 ? ' on' : ''}"></i>`).join('')}</div>
        ${K.cues.map(([sec, lab]) => `<span class="wave-cue" style="left:${laneX(sec).toFixed(2)}%"><b>${x.esc(lab)}</b></span>`).join('')}
        <i class="wave-head"></i>
      </div>
      <div class="wave-ft">
        <span class="wave-play"><svg viewBox="0 0 12 12"><path d="M3 1.5l7 4.5-7 4.5z"/></svg></span>
        <span class="wave-t">0:00 / 0:15</span>
        <span class="wave-badge">${x.esc(K.badge)}</span>
      </div>
    </div>`);
    const bars = [...card.querySelectorAll('.wave-bar')];
    const cues = [...card.querySelectorAll('.wave-cue')];
    const head = card.querySelector('.wave-head');
    const clock = card.querySelector('.wave-t');
    const chipEl = chipRow.firstElementChild, spin = chipEl.querySelector('.spin'), clab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const last = new Float32Array(N).fill(-1);  // per-bar last written scale, so a drawn waveform costs no style writes
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, chipRow, card],
      // the card is marked twice: it is scrolled into view as it lands, then settled once it has finished rising
      marks: [[T.r, say], [T.chip, chipRow], [T.card, card], [T.card + 0.5, card]],
      render(t) {
        const n = streamCount(K.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = K.say.slice(0, n); hid.textContent = K.say.slice(n); shown = n; }

        // the generation chip: spinner while Suno works, check and a resolved label after
        rise(chipRow, seg(t, T.chip, T.chip + 0.32), 8);
        const cdone = t >= T.chipDone;
        spin.classList.toggle('done', cdone);
        spin.style.transform = cdone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cdone ? K.done : K.chip;
        if (clab.textContent !== cl) clab.textContent = cl;

        // the card rises
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the waveform draws left -> right: each bar scales up from the centre to its own seeded height
        for (let i = 0; i < N; i++) {
          const a = T.draw + (i / (N - 1)) * 1.55;
          const v = outCubic(seg(t, a, a + 0.12)) * H[i];
          if (Math.abs(v - last[i]) < 0.002) continue;
          last[i] = v;
          const b = bars[i];
          if (v <= 0) { b.style.opacity = '0'; b.style.transform = 'scaleY(0)'; }
          else { b.style.opacity = '1'; b.style.transform = `scaleY(${v.toFixed(3)})`; }
        }

        // the cue markers: each pops in just ahead of the head, then lights as the sweep crosses it
        cues.forEach((c, i) => {
          const slot = K.cues[i][2], sec = K.cues[i][0];
          const a = T.cue[slot];
          const e = outBack(seg(t, a, a + 0.3));
          c.style.opacity = clamp(seg(t, a, a + 0.2)).toFixed(3);
          c.style.transform = `translateY(${((1 - e) * -7).toFixed(2)}px)`;
          c.classList.toggle('lit', t >= T.play0 + (sec / DUR) * (T.play1 - T.play0));
        });

        // the playhead: sweeps the track left -> right, then is gone
        const p = seg(t, T.play0, T.play1);
        head.style.left = `${laneX(p * DUR).toFixed(2)}%`;
        head.style.opacity = (seg(t, T.play0, T.play0 + 0.2) * (1 - seg(t, T.end - 0.25, T.end))).toFixed(3);
        const txt = `${mmss(p * DUR)} / 0:15`;
        if (clock.textContent !== txt) clock.textContent = txt;
      },
    };
  },
};