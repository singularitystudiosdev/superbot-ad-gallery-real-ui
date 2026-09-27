// Terminal beat: the routed model (GPT-5 Codex) works in a shell. Its line streams, then a terminal card rises and
// runs a script: each command types in after the prompt, its output lines drop in under it, and green check lines
// close it out. opts.set picks the script: 'engine' (scaffold the ink engine, write it, build) or 'fix' (apply a
// review handed back by another model, run the tests, start the dev server).
// Pure function of t: the whole script is laid on a clock in times(), render only reveals up to t.
import { seg, outCubic, streamCount } from '../../../lib.js';

// a line is [kind, text]: 'cmd' types in after the prompt, 'out' drops in whole, 'ok' drops in green with a check
const SETS = {
  engine: {
    say: 'On it. Scaffolding the ink engine from the terminal.',
    lines: [
      ['cmd', 'npm create vite@latest inkwave -- --template vanilla-ts'],
      ['out', 'Scaffolding project in ~/inkwave... done'],
      ['cmd', 'npm i three'],
      ['out', 'added 1 package in 2s'],
      ['out', 'wrote src/render/ink-renderer.ts    318 lines'],
      ['out', 'wrote src/player/squid-kid.ts       246 lines'],
      ['out', 'wrote src/ink/turf.ts               402 lines'],
      ['cmd', 'npm run build'],
      ['ok', 'built in 1.84s  dist/ 412 kB'],
    ],
  },
  fix: {
    say: 'Applied the review. Tests pass.',
    lines: [
      ['out', 'applying review from Claude Opus 5.5'],
      ['out', 'M src/ink/turf.ts  +3 -1'],
      ['cmd', 'npm test'],
      ['ok', '12 passed  turf, squid kid, splat sound'],
      ['cmd', 'npm run dev'],
      ['ok', 'ready on localhost:5173'],
    ],
  },
};
const CPS = 70;     // command typing speed, characters per second
const OUT_GAP = 0.13;
const set = (opts) => SETS[(opts && opts.set) || 'engine'] || SETS.engine;

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r, card: r + 0.3, at: [], typed: [] };
    let c = r + 0.55;
    S.lines.forEach(([kind, text]) => {
      T.at.push(c);
      if (kind === 'cmd') { c += text.length / CPS; T.typed.push(c); c += 0.28; }
      else { T.typed.push(c); c += OUT_GAP; }
    });
    T.end = c + 0.55;
    return T;
  },
  build(k, x) {
    const T = k.T, S = set(k.opts);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const card = x.el(`<div class="tm-card">
      <div class="tm-hd"><span class="tm-dots"><i></i><i></i><i></i></span><span class="tm-title">codex · ~/inkwave</span></div>
      <div class="tm-bd">${S.lines.map(([kind]) => `<div class="tm-ln tm-${kind}">${kind === 'cmd' ? '<span class="tm-ps">$</span>' : kind === 'ok' ? `<span class="tm-ck">${x.OK}</span>` : ''}<span class="tm-tx"></span></div>`).join('')}</div>
    </div>`);
    const lines = [...card.querySelectorAll('.tm-ln')].map((n, i) => ({ n, tx: n.querySelector('.tm-tx'), kind: S.lines[i][0], text: S.lines[i][1] }));
    const caret = x.el('<i class="tm-caret"></i>');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], ...lines.filter((_, i) => i % 3 === 2).map((L) => [T.at[lines.indexOf(L)], L.n])],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`;

        // each line: hidden until its time; a command types in with the caret riding its end
        let caretOn = null;
        lines.forEach((L, i) => {
          const a = T.at[i];
          const on = t >= a;
          L.n.style.display = on ? '' : 'none';
          let s = L.text;
          if (L.kind === 'cmd') {
            const m = streamCount(L.text, a, CPS, t);
            s = L.text.slice(0, m);
            if (on && t < T.typed[i] + 0.2) caretOn = L;
          }
          if (L.tx.textContent !== s) L.tx.textContent = s;
          L.n.style.opacity = L.kind === 'cmd' ? '1' : outCubic(seg(t, a, a + 0.12)).toFixed(3);
        });
        // the caret: after the command being typed, or blinking on a fresh prompt at the end of the script
        if (caretOn) { if (caret.parentNode !== caretOn.n) caretOn.n.appendChild(caret); caret.style.opacity = '1'; }
        else caret.style.opacity = '0';
      },
    };
  },
};
