// Term beat: GPT-5 Codex takes Veo 3's first shot and builds the whole film in one terminal run. Its line streams,
// the zsh window rises in, the render command types itself out character by character, four log lines land one every
// 0.22s, each with a spinner that resolves to a green check, the frame counter then walks 2304/4608 to 4608/4608, and
// the run closes on "wrote out/the-steep-part.mp4 3:12 1080p" while the block cursor sits at the foot of the log.
// Pure function of t: every moving value is written from t in render (the cursor blink comes from lib blink(t) too),
// so ?t= freezes any frame. No Date, no rAF, no CSS transitions or animations.
import { lerp, seg, outCubic, streamCount, typed, typeEnd, blink } from '../../../lib.js';

const SAY = 'Built the rest of the film from that shot.';
const CMD = 'npx remotion render Film out/the-steep-part.mp4';
const CMD_CPS = 42;   // characters/second the command types at
const TITLE = 'zsh · the-steep-part';
// the run's log: [file, what made it, length]. The shot it was handed, the three it styled from that shot, the
// narration and the score.
const LOG = [
  ['shot_01.mp4', 'Veo 3', '8.0s'],
  ['shots 02-04', 'styled from shot_01', '22.0s'],
  ['narration.wav', 'first person', '0:48'],
  ['score.mp3', 'synthwave 92 BPM', ''],
];
const SPIN = 0.24;        // seconds a log line spins before its check lands
const SPIN_CPS = 330;     // degrees/second the spinner turns while the line is in flight
const FRAMES = 4608;      // frames the render writes: 3:12 at 24fps
const FRAMES_0 = 2304;    // it picks the run up halfway, where the four shots are already in
const RENDER_W = 0.64;    // seconds the counter takes to walk the second half
const BARS = 10;          // cells in the progress bar (half of them filled at 2304/4608)
const LINE_H = 17;        // px per line, matching term.css
const VIS = 9;            // lines the window shows before the log scrolls

export default {
  times(r) {
    const T = { r };
    T.win = r + 0.26;                                        // the zsh window rises in
    T.type = r + 0.40;                                       // the render command starts typing
    T.cmdEnd = typeEnd(CMD, T.type, CMD_CPS);                // its last character lands
    T.line = LOG.map((_, i) => T.cmdEnd + 0.10 + i * 0.22);  // one log line lands every 0.22s
    T.render = T.line[LOG.length - 1] + SPIN + 0.10;         // the frame counter starts walking
    T.final = T.render + RENDER_W + 0.05;                    // "wrote out/..." lands
    T.end = r + 3.8;                                         // v1 lingers on the finished run
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = LOG.map(([file, meta, dur]) => `<div class="term-l term-log">
        <span class="term-st"><i class="term-sp"></i><i class="term-ck">✓</i></span>
        <span class="term-f">${x.esc(file)}</span>
        <span class="term-m">${x.esc(meta)}</span>
        <span class="term-d">${x.esc(dur)}</span></div>`).join('');
    const card = x.el(`<div class="term-win">
      <div class="term-bar"><span class="term-dots"><i></i><i></i><i></i></span><b class="term-title">${x.esc(TITLE)}</b><span class="term-pad"></span></div>
      <div class="term-body"><div class="term-scroll">
        <div class="term-l term-cmd"><span class="term-p">$</span><span class="term-c"></span><i class="term-cur term-cur-in"></i></div>
        ${rows}
        <div class="term-l term-prog"><span class="term-g"></span><span class="term-pl">Rendering frames</span><span class="term-pbar"><span class="term-br">[</span><i class="term-bf"></i><i class="term-be"></i><span class="term-br">]</span></span><span class="term-pct">2304/4608</span></div>
        <div class="term-l term-fin"><i class="term-ck">✓</i><span class="term-ft">wrote out/the-steep-part.mp4</span><span class="term-d">3:12</span><span class="term-x">1080p</span></div>
        <div class="term-l term-tail"><i class="term-cur term-cur-t"></i></div>
      </div></div>
    </div>`);

    const cmdRow = card.querySelector('.term-cmd');
    const cmdT = card.querySelector('.term-c');
    const cmdCur = card.querySelector('.term-cur-in');
    const tailRow = card.querySelector('.term-tail');
    const tail = card.querySelector('.term-cur-t');
    const scroll = card.querySelector('.term-scroll');
    const logs = [...card.querySelectorAll('.term-log')].map((row) => ({ row, sp: row.querySelector('.term-sp') }));
    const progRow = card.querySelector('.term-prog');
    const bf = card.querySelector('.term-bf'), be = card.querySelector('.term-be');
    const pct = card.querySelector('.term-pct');
    const finRow = card.querySelector('.term-fin');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastCmd = '', lastBar = '', lastPct = '';

    return {
      nodes: [say, card],
      // the window stays in view as it lands, then again when the counter starts walking
      marks: [[T.r, say], [T.win, card], [T.render, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the zsh window rises in and settles
        const wi = outCubic(seg(t, T.win, T.win + 0.45));
        card.style.opacity = wi.toFixed(3);
        card.style.transform = wi >= 1 ? 'none' : `translateY(${((1 - wi) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, wi).toFixed(4)})`;

        // the command line: typed char by char from t, its caret solid on the end of what has landed
        const ty = typed(CMD, T.type, CMD_CPS, t);
        if (ty.text !== lastCmd) { cmdT.textContent = ty.text; lastCmd = ty.text; }
        const cl = outCubic(seg(t, T.type - 0.12, T.type + 0.18));
        cmdRow.style.opacity = cl.toFixed(3);
        cmdRow.style.transform = cl >= 1 ? 'none' : `translateY(${((1 - cl) * 4).toFixed(2)}px)`;
        cmdCur.style.opacity = (t >= T.type && !ty.done) ? '1' : '0';

        // the log: each line lands, spins, and turns into a green check
        logs.forEach((l, i) => {
          const a = T.line[i], b = a + SPIN;
          const li = outCubic(seg(t, a, a + 0.2));
          l.row.style.opacity = li.toFixed(3);
          l.row.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 4).toFixed(2)}px)`;
          const done = t >= b;
          l.row.classList.toggle('term-done', done);
          if (!done && t >= a) l.sp.style.transform = `rotate(${(((t - a) * SPIN_CPS) % 360).toFixed(1)}deg)`;
        });

        // the frame counter: the bar and the number walk the second half of the render together
        const pi = outCubic(seg(t, T.render, T.render + 0.2));
        progRow.style.opacity = pi.toFixed(3);
        const p = seg(t, T.render, T.render + RENDER_W);
        const half = BARS / 2, fill = half + Math.round(p * half);
        const bar = fill + '/' + (BARS - fill);
        if (bar !== lastBar) { lastBar = bar; bf.textContent = '#'.repeat(fill); be.textContent = '-'.repeat(BARS - fill); }
        const fr = `${FRAMES_0 + Math.round(p * (FRAMES - FRAMES_0))}/${FRAMES}`;
        if (fr !== lastPct) { lastPct = fr; pct.textContent = fr; }

        // the run's last line: the file it wrote, its length and its size
        const fi = outCubic(seg(t, T.final, T.final + 0.22));
        finRow.style.opacity = fi.toFixed(3);
        finRow.style.transform = fi >= 1 ? 'none' : `translateY(${((1 - fi) * 4).toFixed(2)}px)`;

        // the cursor at the foot of the log: solid while the command types, blinking from t once it is not
        const cur = t >= T.cmdEnd && blink(t) ? '1' : '0';
        tailRow.style.opacity = cur;
        tail.style.opacity = cur;

        // the log well keeps 9 lines, so a longer run scrolls: the newest line stays at the bottom
        let shownLines = 1 + (t >= T.type ? 1 : 0) + (t >= T.render ? 1 : 0) + (t >= T.final ? 1 : 0);
        LOG.forEach((_, i) => { if (t >= T.line[i]) shownLines++; });
        const off = Math.max(0, shownLines - VIS) * LINE_H;
        scroll.style.transform = off ? `translateY(${-off}px)` : 'none';
      },
    };
  },
};