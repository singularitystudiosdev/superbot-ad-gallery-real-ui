// Beat b: EMULATING YOUR VOICE.
// Two waveform lanes (yours above, superbot's below) built procedurally from t: superbot's lane starts as a
// mismatched shape and converges onto your own as the match runs 0 -> 98%, while a meter fills and the pill
// resolves "Matching your voice" -> "Voice matched · 98%". Nothing here is a recording: every bar is a function
// of its index and of t, so ?t=<s> reproduces the frame exactly.
import { clamp, lerp, seg, outCubic, rand } from '../../../lib.js';
import { ICO, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter } from './cc.js';

const CHIPS = [
  ['Learning your voice from 38 recorded calls', 'Learned your voice from 38 recorded calls'],
  ['Matching your tone and pacing', 'Matched your tone and pacing'],
];
const N = 32;                       // bars per lane
const TARGET = 98;                  // the match the meter and the pill settle on

// your own envelope: a fixed, organic shape (rand() is deterministic per index, so it never changes per frame)
const YOU = Array.from({ length: N }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
// the envelope superbot starts on: the same energy, the accents in the wrong places
const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % N], 0, 1));

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.10, r + 0.35];
  T.chipDone = [r + 0.85, r + 1.05];
  T.card = r + 0.80;
  T.build = r + 1.05;
  T.buildEnd = r + 2.25;   // the meter has filled and both lanes have converged
  T.pill = r + 2.35;
  T.done = r + 2.85;
  T.end = r + 4.20;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-voice">
    <div class="cc-head">
      <span class="cc-badge">${ICO.wave}</span>
      <span class="cc-ht"><b>Voice profile</b><small>38 recorded calls · 4 hr 12 min</small></span>
      <span class="cc-samp">${ICO.play}Sample 0:06</span>
    </div>
    <div class="cc-lanes">
      <div class="cc-lane"><span class="cc-lane-t">You</span><div class="cc-bars" data-lane="you"></div></div>
      <div class="cc-lane sb"><span class="cc-lane-t">Superbot</span><div class="cc-bars" data-lane="sb"></div></div>
    </div>
    <div class="cc-match">
      <div class="cc-match-h"><span>Voice match</span><b class="cc-match-n">0%</b></div>
      <div class="cc-meter"><i></i></div>
    </div>
    ${pillHTML(ICO.wave, 'Matching your voice', `Voice matched · ${TARGET}%`)}
  </div>`);
  const p = pillParts(card);
  const bars = (lane) => {
    const box = card.querySelector(`.cc-bars[data-lane="${lane}"]`);
    const out = [];
    for (let i = 0; i < N; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const you = bars('you'), sb = bars('sb');
  const meter = card.querySelector('.cc-meter i');
  const num = card.querySelector('.cc-match-n');
  const lanes = [...card.querySelectorAll('.cc-lane')];

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      lanes.forEach((n, i) => rise(n, t, T.build + i * 0.1));
      const pct = lerp(0, TARGET, outCubic(seg(t, T.build + 0.15, T.build + 1.2)));
      counter(num, 0, TARGET, T.build + 0.15, T.build + 1.2, t, (v) => Math.round(v) + '%');
      meter.style.width = pct.toFixed(1) + '%';
      // the convergence: superbot's lane is part-way between its own shape and yours all through the take
      const cv = outCubic(seg(t, T.build, T.build + 1.3));
      const play = t * 2.6;
      for (let i = 0; i < N; i++) {
        const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
        const a = YOU[i] * swell;
        const b = lerp(OTHER[i], YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)));
        you[i].style.height = (3 + 25 * a).toFixed(2) + 'px';
        sb[i].style.height = (3 + 25 * b).toFixed(2) + 'px';
        sb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
      }
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'voice', times, build };