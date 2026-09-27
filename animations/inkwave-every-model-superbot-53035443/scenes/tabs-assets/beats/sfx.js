// Sfx beat: ElevenLabs bakes Inkwave's six sound cues. The line streams, the "Generating 6 sounds" chip lands and
// spins, the SFX pack card rises and its six rows land one by one. A row is not a track: it is one short sound, so
// it carries the text prompt it was generated from (in quotes), its .wav filename and its duration, and a waveform
// that IS that sound's shape, drawn left to right while it generates, then swept by a magenta play head while it
// previews, before the row flips to Ready. The six shapes are visibly different: a sharp splat transient, a long
// bubbly swim, a rising charger zing, a noisy storm downpour, a voice envelope with syllable humps, and a melodic
// jingle on quantised note levels. No play buttons, no titles, no album lengths: six cues, seconds long.
// Pure function of t (bar heights are static, only reveal, play head and state are written from t), so ?t= freezes
// the exact frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Making it sound wet.';
const N = 6;                 // six cues in the pack
const BARS = 26;             // waveform bars per row
const ROW0 = 0.6, STAGGER = 0.28, LAND = 0.28, DRAW = 0.44, PLAY = 0.34;

// [file, prompt, duration, shape]. The prompt is what was typed into ElevenLabs; the VO prompt is the line the
// voice actually says.
const SOUNDS = [
  ['splat_hit.wav', 'wet ink splat, short and sharp', '0.4s', 'splat'],
  ['squid_swim.wav', 'swim stroke, bubbling trail', '1.6s', 'swim'],
  ['glint_charger_zing.wav', 'charger winding up, rising zing', '1.1s', 'charger'],
  ['ink_storm_rain.wav', 'ink storm downpour', '2.4s', 'storm'],
  ['vo_special_ready.wav', 'Special ready!', '0.9s', 'vo'],
  ['victory_jingle.wav', 'victory sting, winning jingle', '2.0s', 'jingle'],
];

// deterministic per-bar jitter, so every reload draws the same waveform
const noise = (i, seed) => { const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
const gauss = (u, c, w) => Math.exp(-Math.pow((u - c) / w, 2));
// one shape per cue: the amplitude a bar at position u (0..1) gets, jittered by its own index, so the waveform
// reads like a recording of that kind of sound rather than noise
const SHAPE = {
  splat: (u, j) => (j === 0 ? 1 : Math.exp(-u * 6.5) * (0.55 + 0.45 * noise(j, 1))),
  swim: (u, j) => (0.5 + 0.4 * Math.sin(u * Math.PI * 2.4)) * (0.6 + 0.4 * Math.sin(u * Math.PI * 7 + noise(j, 2))),
  charger: (u, j) => (0.14 + 0.86 * Math.pow(u, 1.6)) * (0.6 + 0.4 * Math.sin(u * 34 + noise(j, 3))),
  storm: (u, j) => (0.55 + 0.3 * Math.sin(u * Math.PI * 3.1)) * (0.2 + 0.8 * noise(j, 4)),
  vo: (u, j) => Math.max(gauss(u, 0.16, 0.09), gauss(u, 0.4, 0.12), gauss(u, 0.65, 0.1), gauss(u, 0.9, 0.07)) * (0.65 + 0.35 * noise(j, 5)),
  jingle: (u, j) => [0.3, 0.62, 1, 0.78, 0.4, 0.9, 0.52][Math.floor(u * 7) % 7] * (0.9 + 0.1 * noise(j, 6)),
};
const bar = (kind, j) => clamp(SHAPE[kind](j / (BARS - 1), j) * 0.92 + 0.08, 0.07, 1);

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = SOUNDS.map((_, i) => r + ROW0 + i * STAGGER);
    T.draw = T.row.map((a) => a + 0.06);        // the waveform starts drawing
    T.play = T.draw.map((a) => a + DRAW);       // drawn: the play head starts sweeping
    T.ready = T.play.map((a) => a + PLAY);      // swept: the cue is ready
    T.done = T.ready[N - 1];
    T.end = T.done + 0.36;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating ${N} sounds</span></div></div>`);
    const card = x.el(`<div class="sx-card">
      <div class="sx-hd"><b>SFX pack</b><small>text to sound, ${N} cues</small><span class="sx-prog">0 / ${N} ready</span></div>
      ${SOUNDS.map(([file, prompt, dur, kind]) => `<div class="sx-row">
        <span class="sx-main">
          <span class="sx-prompt">"${x.esc(prompt)}"</span>
          <span class="sx-meta"><span class="sx-file">${x.esc(file)}</span><span class="sx-dur">${x.esc(dur)}</span><span class="sx-wave">${Array.from({ length: BARS }, (_, j) => `<i style="height:${(bar(kind, j) * 100).toFixed(1)}%"></i>`).join('')}<b class="sx-head"></b></span></span>
        </span>
        <span class="sx-st">Generating</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.sx-row')].map((row) => ({
      row, bars: [...row.querySelectorAll('.sx-wave i')], head: row.querySelector('.sx-head'),
      st: row.querySelector('.sx-st'), drawn: -1, lit: -1, txt: '',
    }));
    const prog = card.querySelector('.sx-prog');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, readyN = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[2], rows[2].row], [T.row[N - 1], rows[N - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the generating chip: lands, spins while the six cues render, then resolves once the last one is ready
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `${N} sounds generated` : `Generating ${N} sounds`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let ready = 0;
        rows.forEach((R, i) => {
          const a = T.row[i];
          rise(R.row, seg(t, a, a + LAND), 6);
          // generation: the waveform draws itself left to right
          const dc = Math.min(BARS, Math.ceil(seg(t, T.draw[i], T.draw[i] + DRAW) * BARS));
          if (dc !== R.drawn) {
            if (dc > R.drawn) for (let j = Math.max(0, R.drawn); j < dc; j++) R.bars[j].classList.add('sx-in');
            else for (let j = Math.max(0, dc); j < R.drawn; j++) R.bars[j].classList.remove('sx-in');
            R.drawn = dc;
          }
          // preview: the play head sweeps the drawn waveform and lights the bars it passes
          const hp = seg(t, T.play[i], T.play[i] + PLAY);
          const lc = Math.ceil(hp * BARS);
          if (lc !== R.lit) {
            if (lc > R.lit) for (let j = Math.max(0, R.lit); j < lc; j++) R.bars[j].classList.add('sx-on');
            else for (let j = Math.max(0, lc); j < R.lit; j++) R.bars[j].classList.remove('sx-on');
            R.lit = lc;
          }
          R.head.style.left = `${(hp * 100).toFixed(2)}%`;
          R.head.style.opacity = (seg(t, T.play[i] - 0.03, T.play[i] + 0.03) * (1 - seg(t, T.play[i] + PLAY, T.play[i] + PLAY + 0.12))).toFixed(3);
          const s = t >= T.ready[i] ? 'Ready' : (t >= T.play[i] ? 'Preview' : 'Generating');
          if (R.txt !== s) { R.txt = s; R.st.textContent = s; R.row.classList.toggle('sx-pv', s === 'Preview'); R.row.classList.toggle('sx-rd', s === 'Ready'); }
          if (t >= T.ready[i]) ready++;
        });
        if (ready !== readyN) { readyN = ready; prog.textContent = `${ready} / ${N} ready`; }
      },
    };
  },
};