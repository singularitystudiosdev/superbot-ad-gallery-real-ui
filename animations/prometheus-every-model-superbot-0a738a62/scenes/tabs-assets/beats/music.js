// Music beat (Lyria 2, chapter I · SCORE): Lyria scores the film. Its line streams, the "Composing 3 movements" chip
// lands and spins, and the score card rises: Prometheus II, the clip's own 2:16 score, in three movements cut where the
// HUD tempo steps (♩ = 110 to 0:39, 128 then 140 to 1:31, 150 to the last frame). Each movement lands and its gold
// play-head sweeps its waveform left to right as it is generated, staggered, stamping its length once it is done.
// The waveforms are the clip's REAL loudness envelope: RMS per bar in dBFS, pooled from img/prometheus/peaks.json rms[]
// (50 ms windows) over each movement's span. Cue ticks sit on the chapter cuts from img/prometheus/chapters.json: each
// lights as the head passes, its roman numeral above it where it fits, and four of them open a hover label (ROMA,
// VAPOR, COSMOS, KARDASHEV). The untagged finale gets a dashed tick, and the foot quotes the citation the clip puts on
// screen there (the medallion ring, from 2:10), lit when the last head reaches it. The chip resolves to "Composed".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scoring the film first, so every age lands on the beat.';
const END_S = 136.433; // the clip's last frame, chapters.json (4093 frames at 30 fps)
// [title, from s, to s, tempo tag, length stamp]: the score split where the HUD tempo steps (chapters.json hud:
// 110 for I to III, 128 for IV to VI, 140 for VII to XIII, 150 for XIV to XVII, stepping at 39.3 s and 91.267 s)
const TRACKS = [
  ['Hellas to Tenebrae', 0, 39.3, '♩ = 110', '0:39'],
  ['Cathedralis to Atomvs', 39.3, 91.267, '♩ = 128 · 140', '0:52'],
  ['T-Minus to Kardashev', 91.267, END_S, '♩ = 150', '0:45'],
];
// per-bar RMS in dBFS, 64 bars per movement, from peaks.json rms[] (energy mean of the 50 ms windows under each bar)
const ENV = [
  [-37.9, -15.7, -10.6, -13.8, -16.0, -17.9, -19.9, -12.7, -13.6, -16.9, -19.7, -22.4, -26.7, -22.3, -13.3, -15.4, -14.3, -16.9, -17.7, -17.1, -16.6, -15.7, -19.5, -15.3, -17.7, -17.0, -17.4, -16.2, -16.1, -19.5, -15.8, -18.4, -17.2, -17.8, -15.3, -11.5, -12.1, -14.3, -17.2, -14.2, -16.7, -16.3, -13.7, -14.5, -16.5, -18.7, -14.8, -18.9, -16.6, -14.5, -13.9, -15.5, -16.2, -14.5, -17.7, -15.5, -16.6, -19.8, -22.2, -25.9, -27.7, -27.2, -22.6, -19.4],
  [-10.5, -12.8, -13.9, -14.5, -14.5, -14.3, -14.6, -14.6, -14.1, -11.3, -12.9, -13.6, -14.1, -14.0, -14.8, -14.2, -14.4, -14.7, -14.1, -14.2, -15.1, -14.8, -14.6, -11.2, -13.0, -14.0, -14.1, -14.5, -14.4, -14.4, -14.0, -15.3, -17.9, -15.0, -15.7, -14.8, -14.9, -13.0, -8.9, -10.5, -12.4, -13.1, -13.5, -14.0, -14.2, -12.1, -13.4, -14.3, -14.0, -14.3, -14.2, -12.2, -13.1, -13.9, -14.4, -13.9, -14.1, -12.8, -12.6, -13.6, -13.8, -13.1, -9.5, -12.0],
  [-14.5, -15.9, -16.1, -15.2, -10.1, -9.4, -10.6, -11.2, -11.8, -11.7, -12.0, -12.6, -12.4, -12.8, -12.8, -12.8, -12.5, -12.5, -10.2, -10.9, -12.2, -12.2, -12.5, -12.6, -12.6, -12.9, -12.6, -13.4, -12.7, -13.2, -12.7, -13.0, -12.6, -12.5, -10.6, -10.7, -11.9, -12.3, -10.3, -10.6, -10.8, -9.8, -11.0, -11.4, -11.3, -11.8, -12.3, -13.6, -23.5, -16.3, -10.6, -13.1, -14.6, -15.6, -15.8, -17.2, -17.5, -17.5, -17.2, -13.2, -10.5, -14.8, -19.5, -28.3],
];
// the HUD chapter cuts, chapters.json chapters[]: [roman, name, start s]; the last is the untagged finale
const CUTS = [
  ['I', 'HELLAS', 8.733], ['II', 'ROMA', 21.833], ['III', 'TENEBRAE', 34.933], ['IV', 'CATHEDRALIS', 39.3],
  ['V', 'RINASCITA', 46.8], ['VI', 'MARE INCOGNITVM', 58.033], ['VII', 'MVSICA', 65.533], ['VIII', 'LVX', 70.667],
  ['IX', 'VAPOR', 75.833], ['X', 'VITA', 80.967], ['XI', 'LIBERTAS', 86.1], ['XII', 'MAGNA OPERA', 87.833],
  ['XIII', 'ATOMVS', 89.533], ['XIV', 'T-MINUS', 91.267], ['XV', 'COSMOS', 94.467], ['XVI', 'SILICON', 104.067],
  ['XVII', 'KARDASHEV', 115.267], ['', '', 126.267],
];
// the cues that open a hover label, and how it hangs off its tick: c centred over it, f flagged to its right
const HOVER = { ROMA: 'c', VAPOR: 'c', COSMOS: 'f', KARDASHEV: 'c' };
const CITE_S = 129.9;   // the Beethoven citation reads on screen from here (finale medallion ring)
const CITE_X = (CITE_S - TRACKS[2][1]) / (TRACKS[2][2] - TRACKS[2][1]);
const FILL = 0.95;      // seconds one movement's play-head takes to sweep its waveform
const STAGGER = 0.32;
const LANE = 322;       // px the cue lane spans in the 420px card (card less padding, play button, length and gaps)
const CH = 4.55;        // px one cue glyph advances (6.5px IBM Plex Mono: 0.6em advance plus 0.1em tracking)
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

// bar height from loudness: -26 dBFS and below sits at the floor, -8.5 dBFS (the loudest bar) fills the lane
const height = (db) => Math.max(0.08, Math.min(1, (db + 26) / 17.5) ** 1.35);

// each movement's cues, with the numerals thinned so no two labels collide: hover labels are placed first, then the
// plain numerals left to right, each kept only if it clears every label already placed by 3px
const cuesFor = ([, a, b]) => {
  const cues = CUTS.filter(([, , s]) => s >= a && s < b).map(([ro, name, s]) => {
    const x = (s - a) / (b - a), hov = HOVER[name] || '';
    const text = hov ? `${ro} · ${name}` : ro;
    const w = text.length * CH + (hov ? 8 : 0), at = x * LANE;
    let anchor = hov === 'f' ? 'f' : 'c';
    if (anchor === 'c' && at - w / 2 < 0) anchor = 'l';
    if (anchor === 'c' && at + w / 2 > LANE) anchor = 'r';
    const lo = anchor === 'c' ? at - w / 2 : anchor === 'r' ? at - w : anchor === 'f' ? at - 4 : at;
    return { x, ro, text, hov: !!hov, anchor, box: [lo, lo + w], show: !!ro };
  });
  const placed = cues.filter((c) => c.hov).map((c) => c.box);
  cues.forEach((c) => {
    if (!c.show || c.hov) return;
    c.show = placed.every(([p0, p1]) => c.box[1] + 3 <= p0 || c.box[0] >= p1 + 3);
    if (c.show) placed.push(c.box);
  });
  return cues;
};
const CUES = TRACKS.map(cuesFor);

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
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing 3 movements</span></div></div>');
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>Prometheus II</b><small>original score, 2:16</small></div>
      ${TRACKS.map(([title, , , tag, len], i) => `<div class="mus-row">
        <span class="mus-btn">${PLAY}</span>
        <span class="mus-main"><span class="mus-title">${x.esc(title)}<em class="mus-tag">${x.esc(tag)}</em></span>
          <span class="mus-cues">${CUES[i].map((c, j) => (c.show ? `<b class="mus-cue mus-a${c.anchor}${c.hov ? ' mus-hov' : ''}" data-k="${j}" style="left:${pct(c.x)}">${x.esc(c.text)}</b>` : '')).join('')}</span>
          <span class="mus-wave">${ENV[i].map((db) => `<i style="height:${(height(db) * 100).toFixed(1)}%"></i>`).join('')}${CUES[i].map((c) => `<s class="mus-tick${c.ro ? '' : ' mus-fin'}" style="left:${pct(c.x)}"></s>`).join('')}<u class="mus-ph"></u></span></span>
        <span class="mus-len">${x.esc(len)}</span>
      </div>`).join('')}
      <div class="mus-cite"><span class="mus-tc">2:10</span><span class="mus-q"><b lang="de">Freude, schöner Götterfunken</b><small>joy, bright spark of the gods · Beethoven, Symphony No. 9, 1824</small></span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row, i) => {
      const ticks = [...row.querySelectorAll('.mus-tick')];
      return {
        row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len'), ph: row.querySelector('.mus-ph'),
        cues: CUES[i].map((c, j) => ({ ...c, tick: ticks[j], lab: row.querySelector(`.mus-cue[data-k="${j}"]`) })),
      };
    });
    const cite = card.querySelector('.mus-cite');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      // the last mark is the citation, not the last row: the fold has to sit under the foot for it to be seen lighting
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.track[TRACKS.length - 1], cite]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the last movement has been swept
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Composed 3 movements' : 'Composing 3 movements';
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each movement lands, its play-head sweeps the waveform left to right lighting bars and cues, then it stamps
        // its length
        rows.forEach(({ row, bars, len, ph, cues }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fill[i] + FILL);
          bars.forEach((b, j) => {
            const on = seg(p * bars.length, j, j + 1.5);
            b.style.opacity = lerp(0.18, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.25, 1, outCubic(on)).toFixed(3)})`;
          });
          const live = p > 0 && p < 1;
          row.classList.toggle('mus-live', live);
          ph.style.opacity = live ? '1' : '0';
          ph.style.left = `${(p * 100).toFixed(2)}%`;
          cues.forEach((c) => {
            const on = p > 0 && p >= c.x;
            c.tick.classList.toggle('on', on);
            if (!c.lab) return;
            c.lab.classList.toggle('on', on);
            if (c.hov) { const q = seg(p, c.x, c.x + 0.1); c.lab.style.scale = q > 0 && q < 1 ? lerp(0.8, 1, outBack(q)).toFixed(3) : ''; }
          });
          len.style.opacity = outCubic(seg(t, T.fill[i] + FILL - 0.1, T.fill[i] + FILL + 0.2)).toFixed(3);
        });

        // the citation waits dim at the foot and lights when the last play-head reaches the moment it reads on screen
        const lit = seg(seg(t, T.fill[2], T.fill[2] + FILL), CITE_X, CITE_X + 0.08);
        cite.style.opacity = lerp(0.3, 1, lit).toFixed(3);
        cite.classList.toggle('on', lit > 0);
      },
    };
  },
};
