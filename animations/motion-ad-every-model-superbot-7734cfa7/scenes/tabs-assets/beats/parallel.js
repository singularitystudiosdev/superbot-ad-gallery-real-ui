// Parallel beat: superbot runs two models at once. Two lanes work side by side, a hand-off pill carries the score
// lane's beat grid back to the animation lane, then carries the animation lane's cut list the other way, and each lane
// stamps its green check the moment the work reaches it. opts.lanes overrides the two [app, task] pairs (default
// codex/suno) and opts.handoff the two pill labels.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

// the model names this beat prints (the routing chip already announced the app; here the lane heads it short)
const NAMES = {
  codex: 'Codex', suno: 'Suno', deepseek: 'DeepSeek', opus: 'Opus', gemini: 'Gemini',
  cursor: 'Cursor', nanobanana: 'Nano Banana', github: 'GitHub', superbot: 'Superbot',
};

// lane A's work: the six scene components, each ticking up its own line count as it lands (the scene set beats/code.js writes)
const SCENES = [
  ['src/scenes/KineticType.tsx', 168],
  ['src/scenes/DotField.tsx', 142],
  ['src/scenes/WireCube.tsx', 187],
  ['src/scenes/TypeRing.tsx', 133],
  ['src/scenes/Ribbon.tsx', 158],
  ['src/scenes/Logo.tsx', 91],
];
// lane B's waveform: 26 bars, each its own fixed height off the shared deterministic rand (never re-rolled per frame)
const BARS = new Array(26).fill(0).map((_, i) => 0.3 + rand(i * 3 + 1) * 0.7);

const SPLIT = '<svg class="par-split" viewBox="0 0 24 24"><path d="M4 7h6M4 12h4M4 17h6"/><path d="M15 12h4.5M17.5 9.6 20 12l-2.5 2.4"/></svg>';

const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.26;
    T.work = r + 0.6;                                  // both lanes start at once: files tick in, the wave grows
    T.row = SCENES.map((_, i) => r + 0.6 + i * 0.19);   // ... the sixth scene lands at r+1.55
    T.h1a = r + 1.6;                                    // the score lane hands the beat grid back
    T.h1b = r + 2.02;                                   // ... and the animation lane takes it
    T.sw = r + 2.14;                                    // the pill swaps label and heading (it is dark across this instant)
    T.h2a = r + 2.22;                                   // the cut list goes the other way
    T.h2b = r + 2.62;                                   // ... and the score lane lands its hits
    T.end = r + 3.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const lanes = opts.lanes && opts.lanes.length === 2 ? opts.lanes : [['codex', 'Animating 6 scenes'], ['suno', 'Scoring 0:15']];
    const appA = lanes[0][0], appB = lanes[1][0];
    const nameA = NAMES[appA] || appA, nameB = NAMES[appB] || appB;
    const taskA = lanes[0][1] || '', taskB = lanes[1][1] || '';
    const backA = opts.retimed || 'Re-timed cuts to the beat';  // what lane A reports once the beat grid reaches it
    const backB = opts.hits || 'Hits on 6 cuts';                // ... and what lane B reports once the cut list does
    const h1 = (opts.handoff && opts.handoff[0]) || `beat grid 124 BPM → ${nameA}`;
    const h2 = (opts.handoff && opts.handoff[1]) || `cut list → ${nameB}`;
    const sayText = opts.say || `Running ${nameA} and ${nameB} in parallel.`;

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(sayText)}</span></div>`);
    const laneA = x.el(`<div class="par-lane par-a">
      <div class="par-lhead">${x.tile(appA)}<b>${x.esc(nameA)}</b></div>
      <div class="par-task"><span class="spin"></span><span class="par-tt">${x.esc(taskA)}</span></div>
      <div class="par-work">${SCENES.map(([p]) => `<div class="par-file"><span class="par-fn">${x.esc(p)}</span><b class="par-fl">0</b></div>`).join('')}</div>
      <div class="par-prog"><i class="par-fill"></i></div>
    </div>`);
    const laneB = x.el(`<div class="par-lane par-b">
      <div class="par-lhead">${x.tile(appB)}<b>${x.esc(nameB)}</b></div>
      <div class="par-task"><span class="spin"></span><span class="par-tt">${x.esc(taskB)}</span></div>
      <div class="par-wave">${BARS.map(() => '<i class="par-wb"></i>').join('')}</div>
      <div class="par-prog"><i class="par-fill"></i></div>
    </div>`);
    const card = x.el(`<div class="par-card">
      <div class="par-hd">${SPLIT}<b>parallel</b><span class="par-hpill">2 models · 1 take</span></div>
      <div class="par-lanes"></div>
      <div class="par-track"><i class="par-pill"><i class="par-arw"></i><span class="par-pt"></span></i></div>
    </div>`);
    card.querySelector('.par-lanes').append(laneA, laneB);

    const vis = say.firstElementChild, hid = say.lastElementChild;
    const pill = card.querySelector('.par-pill'), pt = card.querySelector('.par-pt');
    const ttA = laneA.querySelector('.par-tt'), spinA = laneA.querySelector('.spin');
    const ttB = laneB.querySelector('.par-tt'), spinB = laneB.querySelector('.spin');
    const fillA = laneA.querySelector('.par-fill'), fillB = laneB.querySelector('.par-fill');
    const rows = [...laneA.querySelectorAll('.par-file')];
    const nums = rows.map((r) => r.querySelector('.par-fl'));
    const bars = [...laneB.querySelectorAll('.par-wb')];
    let shown = -1, lastA = taskA, lastB = taskB, lastPill = '';
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.card + 0.5, card]],
      render(t) {
        const n = streamCount(sayText, T.r + 0.06, 78, t);
        if (n !== shown) { vis.textContent = sayText.slice(0, n); hid.textContent = sayText.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // lane A: each scene file lands and ticks its own line count in
        rows.forEach((row, i) => {
          const a = T.row[i];
          rise(row, seg(t, a, a + 0.26), 5);
          const s = num(SCENES[i][1] * outCubic(seg(t, a + 0.04, a + 0.42)));
          if (nums[i].textContent !== s) nums[i].textContent = s;
        });

        // lane B: the waveform grows bar by bar while the whole body swells as the score fills out
        const amp = lerp(0.4, 1, seg(t, T.work, T.h2b));
        bars.forEach((b, i) => {
          const a = T.work + i * 0.034;
          b.style.transform = `scaleY(${(BARS[i] * outCubic(seg(t, a, a + 0.36)) * amp).toFixed(3)})`;
        });

        // each lane's bar fills until its own work has left the lane
        fillA.style.transform = `scaleX(${outCubic(seg(t, T.work, T.h1b)).toFixed(4)})`;
        fillB.style.transform = `scaleX(${outCubic(seg(t, T.work, T.h2b)).toFixed(4)})`;

        // each lane's status: its own task while it works, its result with the green check once the hand-off lands
        const doneA = t >= T.h1b, doneB = t >= T.h2b;
        spinA.classList.toggle('done', doneA);
        spinA.style.transform = doneA ? '' : `rotate(${(((t - T.work) * 420) % 360).toFixed(1)}deg)`;
        spinB.classList.toggle('done', doneB);
        spinB.style.transform = doneB ? '' : `rotate(${(((t - T.work) * 420) % 360).toFixed(1)}deg)`;
        const labA = doneA ? backA : taskA;
        if (lastA !== labA) { ttA.textContent = labA; lastA = labA; }
        const labB = doneB ? backB : taskB;
        if (lastB !== labB) { ttB.textContent = labB; lastB = labB; }

        // the hand-off pill: B's beat grid runs left to A, then A's cut list runs back right; it is dark across the swap
        const rev = t >= T.sw;
        const p = rev ? seg(t, T.h2a, T.h2b) : seg(t, T.h1a, T.h1b);
        const px = lerp(rev ? 24 : 76, rev ? 76 : 24, outCubic(p));
        pill.style.left = `${px.toFixed(2)}%`;
        pill.style.transform = `translate(-50%, calc(-50% + ${(-Math.sin(Math.PI * p) * 6).toFixed(2)}px))`;
        const o = Math.max(
          seg(t, T.h1a - 0.14, T.h1a + 0.06) * (1 - seg(t, T.h1b - 0.04, T.h1b + 0.16)),
          seg(t, T.h2a - 0.14, T.h2a + 0.06) * (1 - seg(t, T.h2b - 0.04, T.h2b + 0.18)),
        );
        pill.style.opacity = o.toFixed(3);
        pill.classList.toggle('rev', rev);
        const pl = rev ? h2 : h1;
        if (lastPill !== pl) { pt.textContent = pl; lastPill = pl; }

        // the lane that just received work flashes its ring for a beat
        laneA.classList.toggle('hand', t >= T.h1b - 0.02 && t < T.h1b + 0.45);
        laneB.classList.toggle('hand', t >= T.h2b - 0.02 && t < T.h2b + 0.45);
      },
    };
  },
};