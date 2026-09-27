// Audio beat: ElevenLabs scores the "18 months to escape" film.
//
// Its line streams, the "Composing 3 tracks" chip lands, then the score card settles row by row, each cue's waveform
// recording in left to right under its own playhead, and each row stamping a green check once its take is in. The chip
// fades out as the last take lands. The three cues are titled after the film's own lines: the "Feel the AGI" bed at
// 128 BPM under the whole 23s cut, the "Escape velocity" riser into the split-flap boards, and the "Permanent
// underclass" drop. Each waveform is drawn from its cue's own envelope (a pulsing bed, a rising sweep into a spike, a
// transient that decays), so the three rows
// read as three different sounds, not one noise shape three times.
//
// No imagery: the chip tile is the ElevenLabs mark already in brand/ (drawn through x.tile).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const SAY = 'Scored it: the hook, the riser, the drop.';
// [title, duration, envelope]: the three cues ElevenLabs records, in the order the rows land
const TRACKS = [
  ['Feel the AGI, 128 BPM', '0:23', 'bed'],
  ['Escape velocity (riser)', '0:04', 'swipe'],
  ['Permanent underclass (drop)', '0:03', 'hit'],
];
const BARS = 40;      // bars per waveform
const REC = 0.52;     // seconds one waveform takes to record in, left to right
const STAGGER = 0.3;  // gap between one row landing and the next
const PLAY = '<svg class="aud-play-i" viewBox="0 0 24 24"><path d="M8.5 5.5 18 12l-9.5 6.5Z"/></svg>';

// Scroll marks for the list's rows. chat.js's step passes opts.markRows: at the tight frame (tabs.js geo, DW = W/2) the
// card is small but rows 2 and 3 would land below the composer and sit there until the next beat scrolled the thread,
// so every row gets its own anchor and the feed follows the list down as it lands. The mark leads the row by ROW_LEAD:
// the feed's glide is 0.8s long (chat.js renderScroll), so a mark set exactly on the row would still be ~24px short
// when that row finished appearing, leaving it clipped under the composer; leading it by 0.22s puts the row in place
// before it has fully landed. Without markRows only the first row is anchored ([T.row[0], rows[0]]).
const ROW_LEAD = 0.3;
const rowMarks = (opts, T, rows) =>
  (opts && opts.markRows ? T.row.map((a, i) => [a - ROW_LEAD, rows[i]]) : [[T.row[0], rows[0]]]);

// bar j of waveform i: a deterministic height from the cue's envelope and a per-bar jitter, so the same shape plays
// every time. Heights top out at 18px inside the 22px strip.
const ENV = {
  // the bed: a kick on every fourth bar over a steady pad
  bed: (j) => (j % 4 === 0 ? 0.95 : j % 4 === 2 ? 0.62 : 0.42),
  // the riser sweeps up across the first two thirds, then spikes and rings out
  swipe: (j, u) => (u < 0.66 ? 0.12 + 0.7 * (u / 0.66) ** 1.6 : u < 0.72 ? 1 : 0.2 + 0.7 * Math.exp(-(u - 0.72) * 9)),
  // the drop: one transient at the top of the take, a fast decay, then a low tail
  hit: (j, u) => (u < 0.06 ? 0.5 + 8 * u : 0.08 + 0.92 * Math.exp(-(u - 0.06) * 5.5)),
};
const barH = (i, j) => {
  const u = j / (BARS - 1);
  const e = Math.min(1, ENV[TRACKS[i][2]](j, u));
  return 2 + 16 * e * (0.72 + 0.28 * rand(i * 97 + j * 13 + 1));
};

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.28;                                        // "Composing 3 tracks" chip lands
    T.card = r + 0.36;                                         // the score card rises in
    T.row = TRACKS.map((_, i) => T.card + 0.34 + i * STAGGER); // each row lands
    T.rec = T.row.map((a) => a + REC);                         // ...and its waveform has recorded in
    T.ok = T.rec.map((a) => a + 0.06);                         // ...and its check stamps
    T.end = T.ok[T.ok.length - 1] + 0.3;                       // last track lands, then the next request routes
    return T;
  },
  build(k, x) {
    return buildScore(k, x);
  },
};

function buildScore(k, x) {
  const T = k.T;
  const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
  const chip = x.el(`<div class="dd-chiprow aud-chiprow"><span class="ch-tool aud-chip">${x.tile('eleven')}<span class="ch-tool-t">Composing 3 tracks</span></span></div>`);
  const rowsHtml = TRACKS.map(([title, dur], i) => `<div class="aud-row">
      <span class="aud-play">${PLAY}</span>
      <span class="aud-t">${x.esc(title)}</span>
      <span class="aud-d">${x.esc(dur)}</span>
      <span class="aud-wave" aria-hidden="true"><i class="aud-head"></i>${Array.from({ length: BARS }, (_, j) => `<i class="aud-bar" style="height:${barH(i, j).toFixed(1)}px"></i>`).join('')}</span>
      <span class="aud-tick">${x.OK}</span>
    </div>`).join('');
  const card = x.el(`<div class="aud-card">${rowsHtml}</div>`);
  const rows = [...card.querySelectorAll('.aud-row')];
  const bars = rows.map((row) => [...row.querySelectorAll('.aud-bar')]);
  const heads = rows.map((row) => row.querySelector('.aud-head'));
  const plays = rows.map((row) => row.querySelector('.aud-play'));
  const ticks = rows.map((row) => row.querySelector('.aud-tick'));
  const vis = say.firstElementChild, hid = say.lastElementChild;
  let shown = -1;
  // last value written per bar: the DOM is only touched when the frame's value differs, so a still frame costs
  // nothing and a seek backwards still repaints (a "furthest so far" mark would not)
  const was = rows.map(() => new Array(BARS).fill(-1));

  return {
    nodes: [say, chip, card],
    marks: [[T.r, say], [T.label, chip], [T.card, card], ...rowMarks(k.opts, T, rows)],
    render(t) {
      const n = streamCount(SAY, T.r + 0.06, 80, t);
      if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

      // the "Composing 3 tracks" chip: lands with the ask, then fades out as the last take lands
      const li = outCubic(seg(t, T.label, T.label + 0.3));
      const out = seg(t, T.ok[TRACKS.length - 1] - 0.1, T.ok[TRACKS.length - 1] + 0.26);
      chip.style.opacity = (li * (1 - out)).toFixed(3);
      chip.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

      // the score card rises in as one sheet
      const ci = outCubic(seg(t, T.card, T.card + 0.45));
      card.style.opacity = ci.toFixed(3);
      card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

      rows.forEach((row, i) => {
        const a = T.row[i];
        // the row itself lands
        const p = outCubic(seg(t, a, a + 0.34));
        row.style.opacity = p.toFixed(3);
        row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 7).toFixed(2)}px)`;

        // its waveform records in left to right: bar j fills once the playhead has swept past it
        const rec = seg(t, a, T.rec[i]);
        bars[i].forEach((b, j) => {
          const w = (j / (BARS - 1)) * 0.92;
          const v = outCubic(seg(rec, w, w + 0.06));
          if (v === was[i][j]) return;
          was[i][j] = v;
          b.style.opacity = lerp(0.16, 1, v).toFixed(3);
          b.style.transform = `scaleY(${lerp(0.2, 1, v).toFixed(3)})`;
        });
        heads[i].style.transform = `translateX(${lerp(0, 100, rec).toFixed(2)}%)`;
        heads[i].style.opacity = (1 - seg(t, T.rec[i] - 0.05, T.rec[i] + 0.07)).toFixed(3);

        // the take is in: the row stamps its check and its play glyph comes up to full
        const cp = seg(t, T.ok[i], T.ok[i] + 0.24);
        ticks[i].style.opacity = outCubic(seg(t, T.ok[i], T.ok[i] + 0.14)).toFixed(3);
        ticks[i].style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
        plays[i].style.opacity = lerp(0.5, 1, outCubic(cp)).toFixed(3);
      });
    },
  };
}
