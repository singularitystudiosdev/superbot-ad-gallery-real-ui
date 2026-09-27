// Audio beat (forked from pocketsflow-untold's score mode), used twice in the minecraft build: ElevenLabs records the
// block sound effects, then Suno writes the ambient loop. Everything that differs lives in the step's opts (chat.js):
//   opts.say     the model's line
//   opts.label   the tool chip ("Generating 3 sound effects", "Composing 1 track")
//   opts.tracks  [title, duration, seed] rows, in the order they land
//   opts.rec     seconds one waveform takes to record in; opts.stagger the gap between rows
//   opts.wide    one tall waveform (the music track) instead of a compact SFX row
// The line streams, the chip lands, then the card settles row by row, each waveform recording in left to right under
// its own playhead, and each row stamping a green check once its take is in.
//
// Pure function of t: every moving value is written from t, so ?t= freezes any frame. No audio plays (the spot is
// silent); the waveforms are deterministic shapes, not decoded audio.
import { lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const PLAY = '<svg class="aud-play-i" viewBox="0 0 24 24"><path d="M8.5 5.5 18 12l-9.5 6.5Z"/></svg>';

// bar j of waveform i: a deterministic height from its index and the row's seed. An SFX row is a sharp transient that
// decays (a hit, a step); the music row is a slow swell with beat pulses.
const sfxH = (seed, j, n) => {
  const x = j / (n - 1);
  const hits = seed % 2 ? [0.08, 0.52] : [0.05, 0.3, 0.55, 0.8];
  const env = Math.max(...hits.map((h) => (x >= h ? Math.exp(-(x - h) * 14) : 0)));
  return 2 + 16 * env * (0.55 + 0.45 * rand(seed * 97 + j * 13 + 1));
};
const musicH = (seed, j, n) => {
  const x = j / (n - 1);
  const swell = 0.45 + 0.35 * Math.sin(x * Math.PI * 1.5 + 0.4);
  const pulse = j % 8 === 0 ? 1 : j % 4 === 0 ? 0.8 : 0.6;
  return 3 + 30 * swell * pulse * (0.6 + 0.4 * rand(seed * 71 + j * 17 + 3));
};

export default {
  times(r, opts = {}) {
    const n = (opts.tracks || []).length;
    const REC = opts.rec || 0.4, STAGGER = opts.stagger || 0.16;
    const T = { r };
    T.label = r + 0.16;                                             // the tool chip lands
    T.card = r + 0.2;                                               // the card rises in
    T.row = Array.from({ length: n }, (_, i) => T.card + 0.16 + i * STAGGER);
    T.rec = T.row.map((a) => a + REC);                              // ...its waveform has recorded in
    T.ok = T.rec.map((a) => a + 0.04);                              // ...and its check stamps
    T.end = T.ok[n - 1] + 0.26;
    return T;
  },
  build(k, x) {
    const T = k.T, o = k.opts;
    const wide = !!o.wide;
    const BARS = wide ? 72 : 44;
    const hOf = wide ? musicH : sfxH;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow aud-chiprow"><span class="ch-tool aud-chip">${x.tile(k.app)}<span class="ch-tool-t">${x.esc(o.label)}</span></span></div>`);
    const rowsHtml = o.tracks.map(([title, dur, seed]) => `<div class="aud-row${wide ? ' aud-wide' : ''}">
      <span class="aud-play">${PLAY}</span>
      <span class="aud-t">${x.esc(title)}</span>
      <span class="aud-d">${x.esc(dur)}</span>
      <span class="aud-wave" aria-hidden="true"><i class="aud-head"></i>${Array.from({ length: BARS }, (_, j) => `<i class="aud-bar" style="height:${hOf(seed, j, BARS).toFixed(1)}px"></i>`).join('')}</span>
      <span class="aud-tick">${x.OK}</span>
    </div>`).join('');
    const card = x.el(`<div class="aud-card">${rowsHtml}</div>`);
    const rows = [...card.querySelectorAll('.aud-row')];
    const bars = rows.map((row) => [...row.querySelectorAll('.aud-bar')]);
    const heads = rows.map((row) => row.querySelector('.aud-head'));
    const plays = rows.map((row) => row.querySelector('.aud-play'));
    const ticks = rows.map((row) => row.querySelector('.aud-tick'));
    const waves = rows.map((row) => row.querySelector('.aud-wave'));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // last value written per bar: the DOM is only touched when the frame's value differs
    const was = rows.map(() => new Array(BARS).fill(-1));
    const last = rows.length - 1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.label, chip], [T.card, card], ...T.row.map((a, i) => [a - 0.2, rows[i]])],
      render(t) {
        const n = streamCount(o.say, T.r + 0.04, 110, t);
        if (n !== shown) { vis.textContent = o.say.slice(0, n); hid.textContent = o.say.slice(n); shown = n; }

        // the tool chip: lands with the reply, fades as the last take lands
        const li = outCubic(seg(t, T.label, T.label + 0.25));
        const out = seg(t, T.ok[last] - 0.1, T.ok[last] + 0.2);
        chip.style.opacity = (li * (1 - out)).toFixed(3);
        chip.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

        const ci = outCubic(seg(t, T.card, T.card + 0.35));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((row, i) => {
          const a = T.row[i];
          const p = outCubic(seg(t, a, a + 0.28));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 7).toFixed(2)}px)`;

          // the waveform records in left to right: bar j fills once the playhead has swept past it
          const rec = seg(t, a, T.rec[i]);
          bars[i].forEach((b, j) => {
            const w = (j / (BARS - 1)) * 0.92;
            const v = outCubic(seg(rec, w, w + 0.06));
            if (v === was[i][j]) return;
            was[i][j] = v;
            b.style.opacity = lerp(0.16, 1, v).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.2, 1, v).toFixed(3)})`;
          });
          // while the take records the whole waveform breathes
          const live = t >= a && t < T.rec[i];
          waves[i].style.transform = live ? `scaleY(${(0.94 + 0.06 * Math.sin(t * 23 + i)).toFixed(4)})` : 'none';
          heads[i].style.transform = `translateX(${lerp(0, 100, rec).toFixed(2)}%)`;
          heads[i].style.opacity = (1 - seg(t, T.rec[i] - 0.05, T.rec[i] + 0.07)).toFixed(3);

          const cp = seg(t, T.ok[i], T.ok[i] + 0.22);
          ticks[i].style.opacity = outCubic(seg(t, T.ok[i], T.ok[i] + 0.12)).toFixed(3);
          ticks[i].style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
          plays[i].style.opacity = lerp(0.5, 1, outCubic(cp)).toFixed(3);
        });
      },
    };
  },
};
