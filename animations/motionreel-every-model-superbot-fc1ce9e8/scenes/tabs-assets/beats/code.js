// Code beat: Claude Opus 5.5 writes the reel's motion before any of it moves. Its line streams, the "Writing
// src/easing.ts" chip lands and counts lines, and an editor rises in the reel's ink chrome: src/easing.ts streams in
// character by character, lit in the reel's palette, the six curves in the clip's order (linear, easeInOut, expoOut,
// backOut, elastic, bounce) with their standard formulas. Then Run: a cream panel wipes in on the diagonal, the clip's
// 02 EASING card ("Six ways to get from A to B.", SAME DISTANCE · SAME DURATION (0.94s)), and six balls cross A to B
// in 0.94 s, each on the function just typed (EASE below is that file, line for line, in JS). Every ball trails onion
// skin rings and drops a tick every twelfth of the run, so the spacing on each track is its curve; the glyph on each
// row draws the curve and rides a dot up it; the B cap lights in the row's colour the moment its ball first gets there.
// opts.set: 'reel' | 'world' (both, and anything else, read the same file). Pure function of t (the tab scene's local
// time), so ?t= freezes a frame.
import { lerp, seg, outCubic, outBack, pressScale, blink, streamCount } from '../../../lib.js';

// ---------- the file Opus types (TypeScript), and the same six functions in JS for the preview ----------
const FILE = 'src/easing.ts';
const SRC = [
  '// six ways to get from A to B · same distance, same duration',
  'export type Ease = (t: number) => number;',
  'const C4 = (2 * Math.PI) / 3;',
  '',
  'export const linear: Ease = (t) => t;',
  'export const easeInOut: Ease = (t) =>',
  '  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;',
  'export const expoOut: Ease = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));',
  'export const backOut: Ease = (t) =>',
  '  1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;',
  'export const elastic: Ease = (t) =>',
  '  t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * C4) + 1;',
  'export const bounce: Ease = (t) => {',
  '  const n = 7.5625, d = 2.75;',
  '  if (t < 1 / d) return n * t * t;',
  '  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;',
  '  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;',
  '  return n * (t -= 2.625 / d) * t + 0.984375;',
  '};',
  '',
  'export const EASINGS = { linear, easeInOut, expoOut, backOut, elastic, bounce };',
];
const C4 = (2 * Math.PI) / 3;
const EASE = {
  linear: (t) => t,
  easeInOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  expoOut: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  backOut: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  elastic: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * C4) + 1),
  bounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

// the clip's 02 EASING table: number, label, the function, the ball's colour (ink, blue, red, ink, blue, red)
const ROWS = [['01', 'linear', 'linear', 'ink'], ['02', 'ease-in-out', 'easeInOut', 'blu'], ['03', 'expo-out', 'expoOut', 'red'],
  ['04', 'back-out', 'backOut', 'ink'], ['05', 'elastic', 'elastic', 'blu'], ['06', 'bounce', 'bounce', 'red']];
const DUR = 0.94;           // SAME DURATION (0.94s): the balls take exactly this long, A to B
const TICKS = 12;           // a tick above the track every twelfth of the run
const GHOSTS = 3;           // onion skin rings behind each ball
const GHOST_LAG = 0.045;    // seconds between rings
// where each ball first gets to B (0.999 of the way): the B cap lights from then on
const ARRIVE = ROWS.map(([, , f]) => { for (let i = 0; i <= 2000; i++) if (EASE[f](i / 2000) >= 0.999) return i / 2000; return 1; });
// the glyph: a 24 x 17 box, time along x, value up y, headroom for elastic's 1.35 overshoot
const GX = (u) => 3 + u * 19, GY = (v) => 14.5 - v * 9;
const glyph = (f) => Array.from({ length: 49 }, (_, i) => { const u = i / 48; return `${i ? 'L' : 'M'}${GX(u).toFixed(2)} ${GY(EASE[f](u)).toFixed(2)}`; }).join('');

// ---------- the editor ----------
const SAY = 'Motion first: six easings in src/easing.ts, then an A to B test.';
const VIS = 8;              // rows the editor window shows; older rows roll off the top as new ones start
const LH = 11.5;            // row height, px (code.css .code-row)
const GUT = 26;             // gutter width, px (code.css .code-ln)
const NL = 3;               // a newline costs as much typing time as three characters
const U0 = [];              // each row's start, in typed units
let UNITS = 0;
SRC.forEach((s) => { U0.push(UNITS); UNITS += s.length + NL; });

// syntax: keywords red, the declared names lime, numbers blue, types cream bold, comments and punctuation dimmed
const KW = new Set(['export', 'const', 'type', 'return', 'if']);
const TY = new Set(['Ease', 'number']);
const FN = new Set(['linear', 'easeInOut', 'expoOut', 'backOut', 'elastic', 'bounce', 'EASINGS', 'C4']);
function paint(line, esc) {
  const ci = line.indexOf('//');
  const code = ci < 0 ? line : line.slice(0, ci);
  const tok = (c, s) => `<span class="code-${c}">${esc(s)}</span>`;
  const out = code.replace(/([A-Za-z_]\w*)|(\d+(?:\.\d+)?)|([^\sA-Za-z_\d]+)/g, (m, id, num) => {
    if (id) return KW.has(id) ? tok('k', m) : TY.has(id) ? tok('y', m) : FN.has(id) ? tok('f', m) : esc(m);
    return num ? tok('n', m) : tok('p', m);
  });
  return ci < 0 ? out : out + tok('c', line.slice(ci));
}

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;          // the editor rises
    T.type0 = r + 0.30;         // src/easing.ts starts streaming
    T.type1 = r + 1.04;         // the last character lands
    T.code = r + 1.07;          // saved: the chip resolves "Wrote src/easing.ts"
    T.run = r + 1.10;           // Run is pressed and the preview wipes in
    T.go = r + 1.32;            // the six balls leave A
    T.stop = T.go + DUR;        // ... and all six sit on B (r + 2.26)
    T.end = r + 2.42;           // the source beat's 2.25 s, +7.6%
    return T;
  },
  build(k, x) {
    const T = k.T;
    const esc = x.esc;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${esc(FILE)}</span><b class="code-count">0 lines</b></div></div>`);
    const ed = x.el(`<div class="code-ed">
      <div class="code-tabs">
        <span class="code-tab"><i class="code-ts">TS</i><span><em>src/</em>easing.ts</span><i class="code-dot"></i></span>
        <span class="code-run"><i class="code-play"></i><span class="code-run-t">Run A to B</span></span>
      </div>
      <div class="code-win"><div class="code-in">${SRC.map((s, i) => `<div class="code-row"><b class="code-ln">${i + 1}</b><span class="code-tx">${paint(s, esc)}</span></div>`).join('')}<i class="code-caret"></i></div></div>
    </div>`);
    const pv = x.el(`<div class="code-pv">
      <i class="code-cb code-tl"></i><i class="code-cb code-tr"></i><i class="code-cb code-bl"></i><i class="code-cb code-br"></i>
      <div class="code-pv-top"><b>CLAUDE</b><span>MOTION REEL · 2026</span><em>02 · EASING</em></div>
      <div class="code-pv-hd"><span class="code-pv-t">Six ways to get from A to B.</span><span class="code-pv-note">SAME DISTANCE · SAME DURATION (0.94s)</span></div>
      <div class="code-pv-ab"><span></span><span></span><span></span><span class="code-lane"><b class="code-a">A</b><b class="code-b">B</b></span></div>
      ${ROWS.map(([n, label, f, c]) => `<div class="code-pv-row code-${c}">
        <span class="code-pv-n">${n}</span><span class="code-pv-l">${esc(label)}</span>
        <svg class="code-gl" viewBox="0 0 24 17" aria-hidden="true"><path class="code-ax" d="M2 1.5V15.5H23.5"/><path class="code-cv" pathLength="1" d="${glyph(f)}"/><circle class="code-gd" r="1.7" cx="${GX(0)}" cy="${GY(0)}"/></svg>
        <span class="code-lane"><span class="code-trk">${Array.from({ length: TICKS - 1 }, () => '<i class="code-tk"></i>').join('')}${Array.from({ length: GHOSTS }, () => '<i class="code-gh"></i>').join('')}<i class="code-ball"></i></span></span>
      </div>`).join('')}
    </div>`);

    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const tab = ed.querySelector('.code-tab'), run = ed.querySelector('.code-run'), runT = ed.querySelector('.code-run-t');
    const inner = ed.querySelector('.code-in'), caretEl = ed.querySelector('.code-caret');
    const lines = [...ed.querySelectorAll('.code-row')].map((row) => ({ row, tx: row.querySelector('.code-tx'), n: -1 }));
    const rows = [...pv.querySelectorAll('.code-pv-row')].map((row, i) => ({
      row, f: EASE[ROWS[i][2]], arrive: ARRIVE[i],
      trk: row.querySelector('.code-trk'), ball: row.querySelector('.code-ball'),
      ticks: [...row.querySelectorAll('.code-tk')], ghosts: [...row.querySelectorAll('.code-gh')],
      cv: row.querySelector('.code-cv'), gd: row.querySelector('.code-gd'),
    }));
    const TT = T.type1 - T.type0;
    const rowStart = U0.map((u) => T.type0 + (u / UNITS) * TT);
    rows.forEach((m) => m.ticks.forEach((tk, j) => { tk.style.left = `${(m.f((j + 1) / TICKS) * 100).toFixed(3)}%`; }));
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };
    let shown = -1;
    // Both cards are 600px wide where the message row has the room (16x9, like the other beats' cards) and exactly
    // the row's width where it does not (9x16 and 1x1: 512). The reply's .m-main is capped at --hub-reply (471), and
    // CSS inside it cannot see the row, so measure the row from the card's host: the width depends on the page's
    // layout (its aspect ratio), never on t, and is written only when it changes. code.css's width 100% capped at
    // 600px is the fallback until the nodes are mounted.
    let fitW = -1;
    const fit = () => {
      const host = ed.parentElement, row = host && host.parentElement;
      if (!row || !row.offsetWidth) return;
      const rr = row.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const w = Math.floor(Math.min(600, (rr.right - hr.left) / (rr.width / row.offsetWidth)));
      if (w > 0 && w !== fitW) { fitW = w; ed.style.width = pv.style.width = `${w}px`; }
    };

    return {
      nodes: [say, chip, ed, pv],
      marks: [[T.r, say], [T.chip, chip], [T.card, ed], [T.run, pv]],
      render(t) {
        fit();
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // ---- the writing chip: spinner and the line count climbing as rows start, then a check and "Wrote" ----
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const saved = t >= T.code;
        spin.classList.toggle('done', saved);
        spin.style.transform = saved ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', saved);
        setText(clab, `${saved ? 'Wrote' : 'Writing'} ${FILE}`);

        // ---- the editor: rises on the reel's back-out (this is chapter 04's model), then the file streams in ----
        const ep = seg(t, T.card, T.card + 0.4);
        ed.style.opacity = outCubic(Math.min(1, ep * 1.6)).toFixed(3);
        ed.style.transform = ep >= 1 ? '' : `translateY(${((1 - outBack(ep)) * 14).toFixed(2)}px)`;
        const typedU = UNITS * seg(t, T.type0, T.type1);
        let cur = -1, started = 0;
        lines.forEach((m, i) => {
          const on = typedU > U0[i] || (i === 0 && t >= T.type0);
          if (on) { started++; cur = i; }
          m.row.style.opacity = on ? '1' : '0';
          const c = on ? Math.min(SRC[i].length, Math.floor(typedU - U0[i])) : 0;
          if (c !== m.n) { m.tx.style.clipPath = c >= SRC[i].length ? '' : `inset(0 calc(100% - ${c}ch) 0 0)`; m.n = c; }
        });
        setText(ccount, `${saved ? SRC.length : started} ${(saved ? SRC.length : started) === 1 ? 'line' : 'lines'}`);
        // the window rolls one row up (out cubic, 60 ms) each time a row past the eighth starts
        let off = 0;
        for (let i = VIS; i < SRC.length; i++) off += outCubic(seg(t, rowStart[i], rowStart[i] + 0.06)) * LH;
        inner.style.transform = off ? `translateY(${(-off).toFixed(2)}px)` : '';
        lines.forEach((m, i) => m.row.classList.toggle('code-cur', i === cur && t < T.run));
        // the caret rides the character being typed, then blinks at the end of the file until Run takes focus
        const ci = Math.max(0, cur), cc = lines[ci].n < 0 ? 0 : lines[ci].n;
        caretEl.style.top = `${(ci * LH).toFixed(2)}px`;
        caretEl.style.left = `calc(${GUT}px + ${cc}ch)`;
        caretEl.style.opacity = t < T.type0 || t >= T.run ? '0' : t < T.type1 || blink(t - T.type1, 0.5) ? '1' : '0';
        // the tab's unsaved dot goes when the file is written
        tab.classList.toggle('code-saved', saved);

        // ---- Run: pressed, running while the balls travel, then 6/6 at B ----
        const going = t >= T.run && t < T.stop, ok = t >= T.stop;
        run.classList.toggle('code-going', going);
        run.classList.toggle('code-ok', ok);
        run.style.transform = `scale(${pressScale(t, T.run - 0.06, 0.1).toFixed(4)})`;
        setText(runT, ok ? '6/6 at B' : going ? 'Running' : 'Run A to B');

        // ---- the preview: the clip's cream diagonal wipe, then the table settles row by row ----
        const wp = seg(t, T.run, T.run + 0.3);
        pv.style.opacity = t >= T.run ? '1' : '0';
        const a = lerp(0, 125, outCubic(wp));
        pv.style.clipPath = wp >= 1 ? '' : `polygon(0 0, ${a.toFixed(2)}% 0, ${(a - 25).toFixed(2)}% 100%, 0 100%)`;
        const q = seg(t, T.go, T.stop);           // the run's clock: one linear 0.94 s, the curves do the rest
        rows.forEach((m, i) => {
          const a0 = T.run + 0.1 + i * 0.03;
          rise(m.row, seg(t, a0, a0 + 0.24), 5);
          m.cv.style.strokeDashoffset = (1 - outCubic(seg(t, a0 + 0.04, a0 + 0.34))).toFixed(4);
          const v = m.f(q);
          m.gd.setAttribute('cx', GX(q).toFixed(2));
          m.gd.setAttribute('cy', GY(v).toFixed(2));
          // the ball, stretched along the track by its speed (a motion smear), square again at rest
          const h = 0.004, speed = q > 0 && q < 1 ? Math.abs(m.f(Math.min(1, q + h)) - m.f(Math.max(0, q - h))) / (Math.min(1, q + h) - Math.max(0, q - h)) : 0;
          m.ball.style.left = `${(v * 100).toFixed(3)}%`;
          m.ball.style.transform = speed ? `scaleX(${(1 + Math.min(0.9, speed * 0.09)).toFixed(3)})` : '';
          // onion skin: where the ball was 45, 90 and 135 ms ago, fading, gone once they close on it
          m.ghosts.forEach((g, j) => {
            const gq = seg(t - (j + 1) * GHOST_LAG, T.go, T.stop), gv = m.f(gq);
            g.style.left = `${(gv * 100).toFixed(3)}%`;
            g.style.opacity = (t > T.go ? (0.8 - j * 0.22) * Math.min(1, Math.abs(v - gv) * 16) : 0).toFixed(3);
          });
          // a tick drops every twelfth of the run where the ball is at that moment
          m.ticks.forEach((tk, j) => { tk.style.opacity = seg(q, (j + 1) / TICKS, (j + 1) / TICKS + 0.03).toFixed(3); });
          m.trk.classList.toggle('code-at', t > T.go && q >= m.arrive);
        });
      },
    };
  },
};
