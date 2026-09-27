// Audio beat: ElevenLabs either scores the spot or voices the Gatewarden's three lines.
//
// Score mode (the default, v3): its line streams, the "Composing 3 tracks" chip lands, then the score card settles
// row by row, each cue's waveform recording in left to right under its own playhead, and each row stamping a green
// check once its take is in. The chip fades out as the last take lands.
//
// Voice mode (k.opts.kind === 'voice', v1's opener): its line streams, the "Generating 3 voice lines" chip lands,
// then the VO card rises with its speaker header (the Gatewarden's portrait, his name, his voice tag) over three
// quoted lines. Each line carries one big waveform whose speech envelope records in under its own playhead, and each
// stamps its check as the take lands.
//
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const SAY = 'Scored the sanctuary and the boss fight.';
// [title, duration, seed]: the three cues ElevenLabs records, in the order the rows land
const TRACKS = [
  ['Ashen Sanctuary (ambient)', '1:48', 11],
  ['Gatewarden, the Last Oath', '2:36', 23],
  ['Parry, roll, bonfire (SFX)', '0:42', 37],
];
const BARS = 40;      // bars per waveform
const REC = 0.52;     // seconds one waveform takes to record in, left to right
const STAGGER = 0.3;  // gap between one row landing and the next
const PLAY = '<svg class="aud-play-i" viewBox="0 0 24 24"><path d="M8.5 5.5 18 12l-9.5 6.5Z"/></svg>';

// Scroll marks for the list's rows. v4's step passes opts.markRows: at the tight v4 frame (tabs.js geo, DW = W/2) the
// card is small but rows 2 and 3 would land below the composer and sit there until the next beat scrolled the thread,
// so every row gets its own anchor and the feed follows the list down as it lands. The mark leads the row by ROW_LEAD:
// the feed's glide is 0.8s long (chat.js renderScroll, v4), so a mark set exactly on the row would still be ~24px short
// when that row finished appearing, leaving it clipped under the composer; leading it by 0.22s puts the row in place
// before it has fully landed. v1-v3 pass no markRows, so their marks are exactly the shipped [T.row[0], rows[0]].
const ROW_LEAD = 0.3;
const rowMarks = (opts, T, rows) =>
  (opts && opts.markRows ? T.row.map((a, i) => [a - ROW_LEAD, rows[i]]) : [[T.row[0], rows[0]]]);

// bar j of waveform i: a deterministic height from its index and the row's seed, so the same shape plays every time
const barH = (i, j) => 3 + 15 * rand(i * 97 + j * 13 + 1);

// --- voice mode -------------------------------------------------------------------------------------------------------
const VOICE_SAY = 'Voiced the Gatewarden, the Last Oath.';
// [line, duration]: the three lines ElevenLabs records for the Gatewarden, in the order the rows land
const LINES = [
  ['You carry no flame here, Ashen one.', '0:04'],
  ['The gate remembers every oath.', '0:03'],
  ['Kneel, or be ash.', '0:02'],
];
const SPEAKER = 'Gatewarden';
const VOICE_TAG = 'Deep, ancient, armored';
const VBARS = 56;      // bars per line: wider and taller than a score row's 40 in a 22px strip
const V_REC = 0.62;    // seconds one line's waveform takes to record in, left to right
const V_STAGGER = 0.36;
const PITCH = 6;       // bars per syllable of the envelope: four voiced bars, then a two-bar gap

// bar j of voice line i: a speech envelope, syllable bursts separated by gaps, deterministic per bar and per line
const lineBarH = (i, j) => {
  const ph = j % PITCH;
  const burst = ph < 4 ? Math.sin(((ph + 1) / 5) * Math.PI) : 0;   // attack, peak, release, then the gap
  const jitter = 0.45 + 0.55 * rand(i * 71 + j * 17 + 3);          // per-bar jitter, so it reads as speech and not a sine
  const level = 0.72 + 0.28 * rand(i * 191 + 7);                   // each line sits at its own level
  return 2 + 30 * burst * jitter * level;
};

export default {
  // opts is the step's own opts when the caller has it (chat.js passes it as times(k.reply, k.opts)); with no opts the
  // score grid is returned, which is the timing v3 already runs.
  times(r, opts = {}) {
    if (opts.kind === 'voice') {
      const T = { r };
      T.label = r + 0.28;                                          // "Generating 3 voice lines" chip lands
      T.card = r + 0.36;                                           // the VO card rises in
      T.row = LINES.map((_, i) => T.card + 0.34 + i * V_STAGGER);  // each line lands
      T.rec = T.row.map((a) => a + V_REC);                         // ...and its waveform has recorded in
      T.ok = T.rec.map((a) => a + 0.06);                           // ...and its check stamps
      T.end = T.ok[T.ok.length - 1] + 0.3;                         // last take lands, then the next request routes
      return T;
    }
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
    return (k.opts || {}).kind === 'voice' ? buildVoice(k, x) : buildScore(k, x);
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

function buildVoice(k, x) {
  const T = k.T;
  const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(VOICE_SAY)}</span></div>`);
  const chip = x.el(`<div class="dd-chiprow audv-chiprow"><span class="ch-tool audv-chip">${x.tile('eleven')}<span class="ch-tool-t">Generating 3 voice lines</span></span></div>`);
  const rowsHtml = LINES.map(([line, dur], i) => `<div class="audv-row">
      <span class="audv-line">&ldquo;${x.esc(line)}&rdquo;</span>
      <span class="audv-wave" aria-hidden="true"><span class="audv-bars">${Array.from({ length: VBARS }, (_, j) => `<i class="audv-bar" style="height:${lineBarH(i, j).toFixed(1)}px"></i>`).join('')}</span><i class="audv-head"></i></span>
      <span class="audv-d">${x.esc(dur)}</span>
      <span class="audv-tick">${x.OK}</span>
    </div>`).join('');
  const card = x.el(`<div class="audv-card">
    <div class="audv-spk">
      <img class="audv-face" src="${x.img('ds/art-2.jpg')}" alt="${x.esc(SPEAKER)}"/>
      <b class="audv-name">${x.esc(SPEAKER)}</b>
      <span class="audv-tag">${x.esc(VOICE_TAG)}</span>
    </div>
    ${rowsHtml}
  </div>`);
  const rows = [...card.querySelectorAll('.audv-row')];
  const waves = rows.map((row) => row.querySelector('.audv-bars'));
  const bars = rows.map((row) => [...row.querySelectorAll('.audv-bar')]);
  const heads = rows.map((row) => row.querySelector('.audv-head'));
  const ticks = rows.map((row) => row.querySelector('.audv-tick'));
  const vis = say.firstElementChild, hid = say.lastElementChild;
  let shown = -1;
  const was = rows.map(() => new Array(VBARS).fill(-1));

  return {
    nodes: [say, chip, card],
    marks: [[T.r, say], [T.label, chip], [T.card, card], ...rowMarks(k.opts, T, rows)],
    render(t) {
      const n = streamCount(VOICE_SAY, T.r + 0.06, 80, t);
      if (n !== shown) { vis.textContent = VOICE_SAY.slice(0, n); hid.textContent = VOICE_SAY.slice(n); shown = n; }

      // the "Generating 3 voice lines" chip: lands with the ask, then fades out as the last take lands
      const li = outCubic(seg(t, T.label, T.label + 0.3));
      const out = seg(t, T.ok[LINES.length - 1] - 0.1, T.ok[LINES.length - 1] + 0.26);
      chip.style.opacity = (li * (1 - out)).toFixed(3);
      chip.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;

      // the VO card rises in as one sheet, speaker header and all
      const ci = outCubic(seg(t, T.card, T.card + 0.45));
      card.style.opacity = ci.toFixed(3);
      card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

      rows.forEach((row, i) => {
        const a = T.row[i];
        const p = outCubic(seg(t, a, a + 0.34));
        row.style.opacity = p.toFixed(3);
        row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 7).toFixed(2)}px)`;

        // the line's waveform records in left to right: bar j fills once the playhead has swept past it
        const rec = seg(t, a, T.rec[i]);
        bars[i].forEach((b, j) => {
          const w = (j / (VBARS - 1)) * 0.92;
          const v = outCubic(seg(rec, w, w + 0.05));
          if (v === was[i][j]) return;
          was[i][j] = v;
          b.style.opacity = lerp(0.14, 1, v).toFixed(3);
          b.style.transform = `scaleY(${lerp(0.18, 1, v).toFixed(3)})`;
        });
        // while the take records the whole envelope breathes: the line reads as sound, not as a bar chart at rest
        const live = t >= a && t < T.rec[i];
        waves[i].style.transform = live ? `scaleY(${(0.94 + 0.06 * Math.sin(t * 21)).toFixed(4)})` : 'none';
        heads[i].style.transform = `translateX(${lerp(0, 100, rec).toFixed(2)}%)`;
        heads[i].style.opacity = (1 - seg(t, T.rec[i] - 0.05, T.rec[i] + 0.07)).toFixed(3);

        // the take is in: the line stamps its check
        const cp = seg(t, T.ok[i], T.ok[i] + 0.24);
        ticks[i].style.opacity = outCubic(seg(t, T.ok[i], T.ok[i] + 0.14)).toFixed(3);
        ticks[i].style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
      });
    },
  };
}