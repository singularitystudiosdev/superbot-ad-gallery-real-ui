// Terminal beat: GPT-5 Codex playtests Turbo Kart Rally headless. Its line streams, then a terminal card rises and
// runs the script: `npm run playtest` (npm echoes the script it runs: node scripts/playtest.js --bots 8 --laps 3
// --class 100cc) simulates 8 karts over 3 laps of Palm Cove Circuit, lap 2 fails (Koopz clips the inside wall at turn
// 4: the CPU racing line ignores the bank), Codex patches src/ai.js with a 3-line diff (1 removed, 2 added, drawn red
// and green), reruns, and the run closes green: 24/24 laps valid, avg 60 fps, 0 console errors.
// Each command types in after the prompt, output lines drop in under it; a line can carry a hold so the failure and
// the patch get a beat to be read. opts.set picks the script (only 'playtest' ships; any other key falls back to it).
// Pure function of t: the whole script is laid on a clock in times(), render only reveals up to t.
import { seg, outCubic, streamCount } from '../../../lib.js';

// a line is [kind, text, hold]: 'cmd' types in after the prompt; 'out' drops in whole; 'dim' is npm's own echo;
// 'fail' drops in red; 'note' is Codex speaking; 'del'/'add' are the patch; 'ok' drops in green with a check.
// hold is extra seconds before the next line lands.
const SETS = {
  playtest: {
    say: 'Playtesting it headless: 8 bots, 3 laps, 100cc.',
    title: 'codex · ~/turbo-kart-rally',
    lines: [
      ['cmd', 'npm run playtest'],
      ['dim', '> turbo-kart-rally@0.1.0 playtest'],
      ['dim', '> node scripts/playtest.js --bots 8 --laps 3 --class 100cc'],
      ['out', 'headless  Palm Cove Circuit  100cc  8 karts x 3 laps'],
      ['out', 'lap 1/3   8/8 valid'],
      ['fail', 'FAIL lap 2/3  Koopz clips the inside wall at turn 4', 0.22],
      ['out', '  at src/ai.js:88  racing line ignores the bank (14 deg)'],
      ['note', 'codex: patching src/ai.js'],
      ['del', '-    this.lineOffset = apex.inside * 0.9;'],
      ['add', '+    // keep a kart width off the wall on banked turns'],
      ['add', '+    this.lineOffset = apex.inside * (0.9 - apex.bank * 0.35);', 0.18],
      ['cmd', 'npm run playtest'],
      ['ok', '8 karts x 3 laps simulated, 24/24 laps valid'],
      ['ok', 'avg 60 fps, 0 console errors'],
    ],
  },
};
const CPS = 70;     // command typing speed, characters per second
const OUT_GAP = 0.13;
const set = (opts) => SETS[(opts && opts.set) || 'playtest'] || SETS.playtest;

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r, card: r + 0.3, at: [], typed: [] };
    let c = r + 0.55;
    S.lines.forEach(([kind, text, hold = 0]) => {
      T.at.push(c);
      if (kind === 'cmd') { c += text.length / CPS; T.typed.push(c); c += 0.28; }
      else { T.typed.push(c); c += OUT_GAP; }
      c += hold;
    });
    T.end = c + 0.55;
    return T;
  },
  build(k, x) {
    const T = k.T, S = set(k.opts);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const card = x.el(`<div class="tm-card">
      <div class="tm-hd"><span class="tm-dots"><i></i><i></i><i></i></span><span class="tm-title">${x.esc(S.title)}</span></div>
      <div class="tm-bd">${S.lines.map(([kind]) => `<div class="tm-ln tm-${kind}">${kind === 'cmd' ? '<span class="tm-ps">$</span>' : kind === 'ok' ? `<span class="tm-ck">${x.OK}</span>` : ''}<span class="tm-tx"></span></div>`).join('')}</div>
    </div>`);
    const lines = [...card.querySelectorAll('.tm-ln')].map((n, i) => ({ n, tx: n.querySelector('.tm-tx'), kind: S.lines[i][0], text: S.lines[i][1] }));
    const caret = x.el('<i class="tm-caret"></i>');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      // scroll marks: every third line, and always the last so the closing green line never sits under the composer
      marks: [[T.r, say], [T.card, card], ...lines.filter((_, i) => i % 3 === 2 || i === lines.length - 1).map((L) => [T.at[lines.indexOf(L)], L.n])],
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
        // the caret: after the command being typed
        if (caretOn) { if (caret.parentNode !== caretOn.n) caretOn.n.appendChild(caret); caret.style.opacity = '1'; }
        else caret.style.opacity = '0';
      },
    };
  },
};
