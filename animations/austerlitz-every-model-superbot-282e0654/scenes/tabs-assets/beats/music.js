// Music beat (Lyria 2, THE SCORE): superbot's scoring request for Austerlitz. The composing chip lands and spins, and the
// score card rises: the film's 5:01 cut into nine movements at its own scenes, each waveform the film's real mix, and
// one play-head crossing them in order at film speed, so a movement's sweep lasts as long, relatively, as the scene does.
//
// Movements are the README's scene table (WinterArc21/Battle-of-Austerlitz-Film README.md, "Scenes"), its stamps and
// titles verbatim. The spans behind them are exact: the film's own buildTimeline (web/film.js:13-29) over web/script.js
// and data/timings.json puts the scenes at the seconds below, which round to the README's stamps; the README's last row
// (4:21 Aftermath) runs to the end, so it covers the timeline's `after` and `end` scenes.
//   0:00  The night of 1 December    0.000 to 35.841
//   0:36  Title                     35.841 to 43.341
//   0:43  The campaign              43.341 to 76.011   (hard cut at 43.375, the master's cut list)
//   1:16  The trap                  76.011 to 130.292
//   2:10  Fog                      130.292 to 170.687
//   2:51  The sun of Austerlitz    170.687 to 195.501   "Then the sun breaks through." at 2:57.687 (video/austerlitz.srt)
//   3:15  The centre               195.501 to 224.658
//   3:45  The ponds                224.658 to 260.560
//   4:21  Aftermath                260.560 to 301.333   the end title scene from 293.353, music only to the end
// A row's length stamp is the difference of the displayed README stamps, so the nine add up to the header's 5:01.
//
// ENV is the film's real loudness, not a drawing: per-bar RMS dBFS of the master's audio (austerlitz-master.mp4, AAC
// 48 kHz), decoded by ffmpeg to mono float 48 kHz and measured by /tmp/austerlitz.282e0654/music/rms.282e0654.py
// (20 * log10(rms), full scale 1.0; round(span / 1.25 s) equal bars per scene, bars.json beside it). A bar's height is
// its linear RMS over the loudest bar's, so a bar half as tall carried half the amplitude. The loudest bar of the whole
// film (-10.5 dBFS, 176.890 to 178.131 s, 2.3 dB above the next) is the one the sun breaks through in: the foot's line
// is spoken inside it. A wave's width is its scene's length over the longest scene's (The trap, 54.281 s), so every bar
// on the card spans the same stretch of film.
//
// The card is the request's cue sheet, and its one picture is a real frame no other beat shows: the master's frame
// 4262 (2:57.583, inside the loudest bar), the sun breaking over the heights, cut to img/az/beats/music/ (CREDITS.txt).
//
// Interface as before: times(reply) -> T with chip, card, track[], fill[], fillEnd[], done, end; the play-head window is
// still reply + 0.74 to reply + 2.33, so done and end land where they always did (end = reply + 2.78).
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scoring to the cut, so the sun of Austerlitz lands on the beat.';

const DUR = 301.333;   // the film, 5:01 (master 301.333 s)
// [README stamp, README scene title, exact start s, exact end s]
const MOV = [
  ['0:00', 'The night of 1 December', 0, 35.841],
  ['0:36', 'Title', 35.841, 43.341],
  ['0:43', 'The campaign', 43.341, 76.011],
  ['1:16', 'The trap', 76.011, 130.292],
  ['2:10', 'Fog', 130.292, 170.687],
  ['2:51', 'The sun of Austerlitz', 170.687, 195.501],
  ['3:15', 'The centre', 195.501, 224.658],
  ['3:45', 'The ponds', 224.658, 260.56],
  ['4:21', 'Aftermath', 260.56, DUR],
].map(([at, title, a, b]) => ({ at, title, a, b }));

// per-bar RMS dBFS, one array per movement (rms.282e0654.py)
const ENV = [
  // The night of 1 December, 0.000 to 35.841 s, 29 bars of 1.236 s
  [-39.2,-33.5,-28.5,-19.3,-18.3,-18.3,-18.8,-17.6,-18.2,-19.1,-18.2,-24.5,-16.9,-18.4,-17.9,-18.9,-18.0,-18.0,-17.2,-18.2,-21.3,-17.3,-19.5,-18.1,-18.9,-18.7,-18.1,-20.1,-20.9],
  // Title, 35.841 to 43.341 s, 6 bars of 1.250 s
  [-17.0,-15.0,-16.8,-17.4,-21.0,-25.4],
  // The campaign, 43.341 to 76.011 s, 26 bars of 1.257 s
  [-21.6,-19.0,-17.5,-18.3,-21.4,-16.8,-19.4,-18.4,-19.5,-21.8,-17.3,-19.5,-19.8,-17.9,-21.0,-18.5,-18.1,-20.2,-18.8,-17.9,-22.1,-18.3,-17.7,-17.6,-20.0,-30.5],
  // The trap, 76.011 to 130.292 s, 43 bars of 1.262 s
  [-21.7,-17.0,-24.9,-18.9,-18.3,-17.9,-17.7,-18.6,-19.7,-18.7,-18.8,-19.8,-18.4,-19.1,-18.3,-18.7,-18.0,-20.0,-19.2,-18.3,-23.6,-18.2,-20.2,-16.8,-18.8,-19.3,-19.9,-17.8,-16.9,-21.2,-18.2,-20.4,-17.8,-18.4,-19.2,-17.8,-19.0,-18.8,-17.8,-18.6,-19.5,-20.3,-26.1],
  // Fog, 130.292 to 170.687 s, 32 bars of 1.262 s
  [-27.1,-32.1,-19.3,-19.6,-17.2,-19.0,-25.8,-17.9,-15.3,-15.8,-15.2,-15.2,-16.9,-14.8,-15.8,-14.4,-13.7,-16.8,-17.1,-17.7,-19.6,-17.4,-20.7,-17.6,-18.2,-18.3,-17.6,-20.6,-18.8,-17.8,-18.2,-23.2],
  // The sun of Austerlitz, 170.687 to 195.501 s, 20 bars of 1.241 s
  [-25.4,-23.9,-23.2,-21.8,-15.2,-10.5,-17.0,-16.2,-17.3,-16.6,-15.2,-15.2,-17.8,-16.0,-17.8,-17.7,-18.8,-18.6,-17.9,-23.6],
  // The centre, 195.501 to 224.658 s, 23 bars of 1.268 s
  [-24.2,-16.4,-17.9,-17.6,-17.5,-18.7,-16.3,-14.9,-16.8,-16.6,-15.8,-16.2,-16.2,-15.6,-16.7,-14.7,-13.6,-15.4,-15.0,-13.4,-16.5,-12.9,-17.4],
  // The ponds, 224.658 to 260.560 s, 29 bars of 1.238 s
  [-23.8,-17.8,-19.5,-16.6,-19.9,-18.1,-17.4,-19.0,-17.4,-18.9,-22.1,-17.5,-19.8,-16.2,-17.2,-17.2,-17.3,-17.1,-19.3,-16.8,-18.0,-19.0,-18.5,-17.6,-19.1,-18.4,-18.8,-18.7,-23.9],
  // Aftermath, 260.560 to 301.330 s, 33 bars of 1.235 s
  [-26.9,-18.6,-18.7,-17.8,-19.0,-17.5,-17.9,-21.2,-18.0,-19.2,-18.3,-19.3,-19.8,-18.0,-17.8,-17.7,-18.1,-19.2,-20.4,-17.4,-18.2,-18.4,-18.8,-18.9,-18.7,-20.0,-19.7,-17.1,-17.7,-18.1,-18.3,-20.1,-24.1],
];

// the marks the waves carry: the sun breaking through (the foot) and the cut to the end title
const CITE_T = 177.687;   // "Then the sun breaks through." (video/austerlitz.srt, 00:02:57,687)
const TICKS = [
  { row: 5, t: CITE_T, text: '2:57', anchor: 'c' },
  { row: 8, t: 293.353, text: '4:53 end title', anchor: 'r', fin: true },
];

const secs = (s) => { const [m, ss] = s.split(':'); return +m * 60 + +ss; };
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const LONGEST = Math.max(...MOV.map((m) => m.b - m.a));
const PEAK = Math.max(...ENV.flat());
// dBFS to bar height: linear RMS over the loudest bar's (monotonic, so a taller bar is always a louder stretch of film);
// the floor keeps the quietest bars (the night's first seconds, -39.2) visible as a sliver
const height = (db) => Math.max(0.1, clamp(10 ** ((db - PEAK) / 20), 0, 1));

const STAGGER = 0.64 / (MOV.length - 1);   // rows land over the same 0.64 s the old three did
const HEAD = 0.74;                          // the play-head starts 0.12 s after the first row lands
const SWEEP = 1.59;                         // and crosses the whole film in the window the old sweeps spanned

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.track = MOV.map((_, i) => r + 0.62 + i * STAGGER);
    T.fill = MOV.map((m) => r + HEAD + (m.a / DUR) * SWEEP);
    T.fillEnd = MOV.map((m) => r + HEAD + (m.b / DUR) * SWEEP);
    T.done = T.fillEnd[MOV.length - 1];
    T.end = T.done + 0.45;   // the last length stamp lands at T.done + 0.2: 0.25s of dwell, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing ${MOV.length} movements</span></div></div>`);
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><span class="mus-ic"><img src="${x.img('az/beats/music/plate-sun-4262.jpg')}" alt="" draggable="false"></span>
        <span class="mus-ht"><b>Austerlitz</b><i class="mus-rule"></i><small>the score · ${mmss(DUR)}</small></span></div>
      ${MOV.map((m, i) => `<div class="mus-row${TICKS.some((c) => c.row === i) ? ' mus-cued' : ''}">
        <span class="mus-go"></span>
        <span class="mus-at">${m.at}</span>
        <span class="mus-title">${x.esc(m.title)}</span>
        <span class="mus-lane"><span class="mus-wave" style="width:${pct((m.b - m.a) / LONGEST)}">${ENV[i].map((db) => `<i${db === PEAK ? ' class="mus-pk"' : ''} style="height:${(height(db) * 100).toFixed(1)}%"></i>`).join('')}${TICKS.filter((c) => c.row === i).map((c) => `<s class="mus-tick${c.fin ? ' mus-fin' : ''}" style="left:${pct((c.t - m.a) / (m.b - m.a))}"><b class="mus-cue mus-a${c.anchor}">${x.esc(c.text)}</b></s>`).join('')}<u class="mus-ph"></u></span></span>
        <span class="mus-len">${mmss((i + 1 < MOV.length ? secs(MOV[i + 1].at) : Math.floor(DUR)) - secs(m.at))}</span>
      </div>`).join('')}
      <div class="mus-cite"><span class="mus-tc">2:57</span><span class="mus-q"><b>Then the sun breaks through.</b><small>The sun of Austerlitz · the loudest bar of the film</small></span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row, i) => ({
      row, bars: [...row.querySelectorAll('.mus-wave i')], len: row.querySelector('.mus-len'), ph: row.querySelector('.mus-ph'),
      ticks: [...row.querySelectorAll('.mus-tick')].map((el, j) => {
        const c = TICKS.filter((q) => q.row === i)[j];
        return { el, x: (c.t - MOV[i].a) / (MOV[i].b - MOV[i].a) };
      }),
      last: [],
    }));
    const cite = card.querySelector('.mus-cite');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // the moment the play-head reaches the sun breaking through, on the film's own clock
    const tLit = T.r + HEAD + (CITE_T / DUR) * SWEEP;
    let shown = -1;

    return {
      nodes: [say, chip, card],
      // the last mark is the citation, not the last row: the fold has to sit under the foot for it to be seen lighting
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.track[MOV.length - 1], cite]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the play-head has crossed the whole film
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = `${done ? 'Composed' : 'Composing'} ${MOV.length} movements`;
        if (lab.textContent !== cl) lab.textContent = cl;

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the movements land top to bottom; the play-head runs through them in film order, raising each bar to its
        // measured height and warming it from night to torchlight as it passes, and each row stamps its length when crossed
        rows.forEach(({ row, bars, len, ph, ticks, last }, i) => {
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const p = seg(t, T.fill[i], T.fillEnd[i]);
          bars.forEach((b, j) => {
            const on = +seg(p * (bars.length + 0.5), j, j + 1.5).toFixed(3);   // + 0.5: the last bar lands fully at p = 1
            if (last[j] === on) return;
            last[j] = on;
            b.style.opacity = lerp(0.5, 1, on).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.3, 1, outCubic(on)).toFixed(3)})`;
            b.style.setProperty('--w', on);
          });
          const live = p > 0 && p < 1;
          row.classList.toggle('mus-live', live);
          row.classList.toggle('mus-past', p >= 1);
          ph.style.opacity = live ? '1' : '0';
          ph.style.left = pct(p);
          ticks.forEach((c) => c.el.classList.toggle('on', p > 0 && p >= c.x));
          len.style.opacity = outCubic(seg(t, T.fillEnd[i] - 0.1, T.fillEnd[i] + 0.2)).toFixed(3);
        });

        // the line waits dim at the foot and lights as the play-head crosses 2:57, where the narrator says it inside the
        // loudest bar of the film; the peak bar keeps a torch glow from then on
        const lit = seg(t, tLit - 0.04, tLit + 0.16);
        cite.style.opacity = lerp(0.32, 1, lit).toFixed(3);
        cite.classList.toggle('on', lit > 0);
        card.classList.toggle('mus-lit', lit > 0);
      },
    };
  },
};
