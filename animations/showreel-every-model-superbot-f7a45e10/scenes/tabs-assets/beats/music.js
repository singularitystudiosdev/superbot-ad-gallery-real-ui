// Music beat: Lyria scores the showreel. Its line streams, the "Scoring 3 cues" chip lands and spins, the score card
// rises, and each cue row lands, wipes its timecode ruler on (00:00 to the cue length, frame ticks, a major tick each
// second, mono labels), then a playhead scrubs the cue left to right. The waveform is laid on the 128 BPM grid (one bar
// per eighth note on the 0:15 cues, one per 32nd on the 0:03 sting), so every hit sits exactly on its beat: as the
// playhead crosses a downbeat a keyframe diamond drops onto the ruler (outBack) and that bar flashes signal orange,
// then settles to paper. Bars behind the playhead resolve from faint and short to full, overshooting with a small
// vertical smear on arrival; the length column counts the cue's timecode up to its length stamp. The Logo Sting row
// borrows the GPT half's acid lime (its "HIT THE BEAT." waveform): a diamond on every beat and lime hits.
// The chip resolves to "Scored 3 cues".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Scoring the reel first: 128 BPM, a hit on every cut.';
const BEAT = 60 / 128;   // 0.46875 s per quarter note; a 4/4 bar is 1.875 s, so a 0:15 cue is exactly 8 bars
const FPS = 60;          // the ruler counts frames at the clip's 60 fps
// The three cues, in the order they are scored. L: length in seconds. div: waveform bars per beat. hit / big: a keyframe
// diamond drops on every `hit`th bar, full size on every `big`th (the downbeats). tick: frames per [minor, mid, major,
// labelled] ruler tick. sting: the lime row.
const CUES = [
  { title: 'Showreel (main cut)', len: '0:15', L: 15, div: 2, hit: 8, big: 8, tick: [10, 30, 60, 300] },
  { title: 'Type Hits (stems)', len: '0:15', L: 15, div: 2, hit: 8, big: 8, tick: [10, 30, 60, 300] },
  { title: 'Logo Sting', len: '0:03', L: 3, div: 8, hit: 8, big: 32, tick: [2, 10, 60, 60], sting: true },
];
const FILL = 0.95;   // seconds the playhead takes to scrub one cue
const STAGGER = 0.32;
const RES = 0.16;    // seconds a bar takes to resolve once the playhead has crossed it
const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const PLAY = '<svg class="mus-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

// palette sampled from the clip: signal orange and paper (Opus half), acid lime (GPT half)
const ORANGE = [252, 89, 31], PAPER = [242, 238, 230], LIME = [201, 251, 30];
const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u)));
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c.join(',')})` : `rgba(${c.join(',')},${Math.max(0, a).toFixed(3)})`);

// ruler x for a cue fraction f: 4px in from either edge, so the end diamonds and bars stay inside the wave box
const at = (f) => `calc(4px + (100% - 8px) * ${f.toFixed(5)})`;
const tc = (s) => `00:${String(s).padStart(2, '0')}`;

// the timecode ruler engraving for one cue: a tick every `minor` frames, taller on the half second, taller still on the
// second, full height with a mono label on every labelled frame; the last label hangs left of its tick
function ruler(c) {
  const [mn, md, mj, lb] = c.tick, N = c.L * FPS;
  let h = '';
  for (let fr = 0; fr <= N; fr += mn) {
    const cls = fr % lb === 0 ? ' mus-lt' : fr % mj === 0 ? ' mus-mj' : fr % md === 0 ? ' mus-md' : '';
    h += `<span class="mus-tk${cls}" style="left:${at(fr / N)}"></span>`;
    if (fr % lb === 0) h += `<span class="mus-lb${fr === N ? ' mus-end' : ''}" data-f="${(fr / N).toFixed(5)}" style="left:${at(fr / N)}">${tc(fr / FPS)}</span>`;
  }
  return h;
}

// fixed bar heights (0.14..1) per cue, a deterministic hash shaped like the cue so every frame draws the same waveform
function level(c, i, j, n) {
  const r = rand(i * 97 + j * 1.618 + 1);
  let h;
  if (i === 0) h = ((j % 2 ? 0.3 : 0.5) + 0.34 * r) * (0.72 + 0.28 * Math.sin((Math.PI * j) / n));   // full mix: quarters over eighths, a swell across the cut
  else if (i === 1) h = j % 2 ? 0.14 + 0.16 * r : 0.46 + 0.34 * r;                                   // type hit stems: punchy quarters, near silent offbeats
  else h = j < 32 ? 0.16 + 0.58 * Math.pow(j / 32, 1.8) * (0.75 + 0.25 * r)                          // sting: a riser into the logo hit on the bar line,
    : 0.14 + 0.7 * Math.exp(-(j - 32) / 7) * (0.8 + 0.2 * r);                                         // then a ringing tail
  if (j % c.big === 0) return 1;
  if (j % c.hit === 0) return Math.min(0.9, h + 0.36);
  return Math.min(0.9, h);
}

// one bar per grid step: its cue fraction f, height h, and whether it carries a diamond (hit) at full size (big)
const grid = (c, i) => {
  const dt = BEAT / c.div, n = Math.floor(c.L / dt + 1e-6);
  return Array.from({ length: n + 1 }, (_, j) => ({ f: (j * dt) / c.L, h: level(c, i, j, n), hit: j % c.hit === 0, big: j % c.big === 0 }));
};
const GRIDS = CUES.map(grid);

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.track = CUES.map((_, i) => r + 0.62 + i * STAGGER);
    T.fill = T.track.map((a) => a + 0.12);
    T.done = T.fill[CUES.length - 1] + FILL;
    T.end = T.done + 0.45;   // the last length stamp pops at T.done and settles by T.done + 0.3, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scoring 3 cues</span></div></div>');
    const card = x.el(`<div class="mus-card">
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>Showreel: score</b><small>128 BPM, 3 cues</small></div>
      ${CUES.map((c, i) => `<div class="mus-row${c.sting ? ' mus-sting' : ''}">
        <span class="mus-btn">${PLAY}</span>
        <span class="mus-main"><span class="mus-title">${x.esc(c.title)}</span><span class="mus-wave">`
        + `<span class="mus-bars">${GRIDS[i].map((b) => `<i style="left:${at(b.f)};top:${((1 - b.h) * 6).toFixed(2)}px;height:${(b.h * 12).toFixed(2)}px"></i>`).join('')}</span>`
        + `<span class="mus-ruler">${ruler(c)}</span><span class="mus-prog"></span>`
        + `<span class="mus-kfs">${GRIDS[i].filter((b) => b.hit).map((b) => `<i class="mus-kf${c.sting ? (b.big ? ' mus-bg' : ' mus-sm') : ''}" style="left:${at(b.f)}"></i>`).join('')}</span>`
        + `<span class="mus-ph"></span></span></span>
        <span class="mus-len">0:00</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.mus-row')].map((row, i) => {
      const hits = GRIDS[i].filter((b) => b.hit);
      return {
        row,
        bars: [...row.querySelectorAll('.mus-bars > i')].map((el, j) => ({ el, f: GRIDS[i][j].f, hit: GRIDS[i][j].hit })),
        kfs: [...row.querySelectorAll('.mus-kf')].map((el, j) => ({ el, f: hits[j].f })),
        labels: [...row.querySelectorAll('.mus-lb')].map((el) => ({ el, f: +el.dataset.f })),
        ruler: row.querySelector('.mus-ruler'),
        prog: row.querySelector('.mus-prog'),
        ph: row.querySelector('.mus-ph'),
        len: row.querySelector('.mus-len'),
      };
    });
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.track[CUES.length - 1], rows[CUES.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the scoring chip: lands, spins, then resolves once the last cue has been scrubbed
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

        rows.forEach(({ row, bars, kfs, labels, ruler: rl, prog, ph, len }, i) => {
          const c = CUES[i], acc = c.sting ? LIME : ORANGE;
          rise(row, seg(t, T.track[i], T.track[i] + 0.3), 6);
          const f0 = T.fill[i], f1 = f0 + FILL, p = seg(t, f0, f1);   // the playhead scrubs at a constant rate: the hits land evenly, on the grid
          row.classList.toggle('mus-live', p > 0 && p < 1);

          // the ruler wipes on left to right as the row lands, always ahead of the playhead
          const w = outCubic(seg(t, T.track[i] + 0.02, T.track[i] + 0.24));
          rl.style.clipPath = w >= 1 ? 'none' : `inset(-2px ${((1 - w) * 100).toFixed(2)}% -3px 0)`;

          // bars: faint and short ahead of the playhead; crossing one snaps it to full height with an overshoot and a
          // short vertical smear. A hit bar flashes the accent with a glow; on the main cues it settles to paper, on the
          // sting it stays lime like the GPT reel's beat bars.
          bars.forEach(({ el, f, hit }) => {
            const th = f0 + f * FILL, on = seg(t, th, th + RES), e = outBack(on);
            el.style.transform = `scaleY(${lerp(0.4, 1, e).toFixed(3)})`;
            el.style.opacity = lerp(0.16, hit ? 1 : 0.74, outCubic(on)).toFixed(3);
            let col = PAPER, glow = 0;
            if (hit && t >= th) {
              col = c.sting ? LIME : mix(ORANGE, PAPER, inOutCubic(seg(t, th + 0.06, th + 0.42)));
              glow = 1 - seg(t, th, th + 0.34);
            }
            el.style.backgroundColor = rgb(col);
            const sh = [];
            if (glow > 0.01) sh.push(`0 0 4px ${rgb(acc, glow * 0.8)}`);
            if (on > 0 && on < 1) { const s = 1 - on; sh.push(`0 ${(2.4 * s).toFixed(2)}px 0 -0.3px ${rgb(col, 0.35 * s)}`, `0 ${(-2.4 * s).toFixed(2)}px 0 -0.3px ${rgb(col, 0.35 * s)}`); }
            el.style.boxShadow = sh.length ? sh.join(', ') : 'none';
          });

          // keyframe diamonds drop onto the ruler's hairline as the playhead crosses their beat, overshooting (outBack)
          kfs.forEach(({ el, f }) => {
            const th = f0 + f * FILL;
            if (t < th) { el.style.opacity = '0'; return; }
            const b = outBack(seg(t, th, th + 0.24));
            el.style.opacity = seg(t, th, th + 0.05).toFixed(3);
            el.style.transform = `translateY(${lerp(-7, 0, b).toFixed(2)}px) rotate(45deg) scale(${lerp(0.5, 1, b).toFixed(3)})`;
          });

          // the playhead rides the scrub front, the played stretch of the hairline brightens behind it, and each
          // timecode label lights as the playhead reaches it
          ph.style.left = at(p);
          ph.style.opacity = (seg(p, 0, 0.03) * (1 - seg(t, f1, f1 + 0.25))).toFixed(3);
          prog.style.width = p > 0 ? at(p) : '0px';
          labels.forEach(({ el, f }) => { el.style.color = rgb(PAPER, p > 0 ? lerp(0.4, 0.86, seg(p, f - 0.004, f + 0.02)) : 0.4); });

          // the length column counts the cue's timecode in the accent, then stamps its length in paper
          len.style.opacity = seg(t, f0 - 0.06, f0 + 0.06).toFixed(3);
          const txt = t >= f1 ? c.len : `0:${String(Math.min(c.L, Math.floor(p * c.L + 1e-6))).padStart(2, '0')}`;
          if (len.textContent !== txt) len.textContent = txt;
          len.style.color = t < f1 ? rgb(acc) : rgb(mix(acc, PAPER, seg(t, f1, f1 + 0.3)));
          len.style.transform = t >= f1 ? `scale(${lerp(1.2, 1, outBack(seg(t, f1, f1 + 0.28))).toFixed(3)})` : '';
        });
      },
    };
  },
};
