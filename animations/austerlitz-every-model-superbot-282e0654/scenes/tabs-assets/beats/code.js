// Code beat: Claude Opus 5.5 writes the film's engine (THE ENGINE). The tool chip counts the bytes as they land, and
// an editor card rises in its place: on the left an explorer of the film's web/ folder (the ten web/engine files plus
// events.js, film.js and script.js, each with its true size in bytes), on the right env.js open in a tab, its sunrise
// preset typing in under a caret while the pane scrolls to keep the caret on screen. Each explorer row counts up to
// its size in turn and settles torch once written; env.js, the open file, counts up with the typing and lands last.
// A status strip under the pane rolls through the steps (writing env.js, the repo's render command) and closes on
// the render's own log line.
// Everything shown is the public repo WinterArc21/Battle-of-Austerlitz-Film at main 86dae32d, not a mock:
//   TREE     every web/engine/*.js file and web/{events,film,script}.js with its blob size in bytes
//            (gh api repos/WinterArc21/Battle-of-Austerlitz-Film/git/trees/86dae32d?recursive=1); 13 files, 212,844 B.
//   EXCERPT  web/engine/env.js lines 26 to 28, the sunrise preset of ENV, typed verbatim character for character.
//            The pane soft-wraps each long line at its property boundaries (a continuation row carries no line number
//            and a hanging indent drawn in CSS): the characters are the file's, only the wrap is the editor's.
//   SAY      README.md line 47: "Sound travels at 343 m/s." (tools/mix.py:275 delays each gun by dist / 343.0).
//   STATUS   tools/render.mjs line 3 usage (--fps 24, --chunk 10 are its defaults: 10 s chunks at 24 fps), and its
//            log line 37 format "... chunks · ... workers · ... fps" for the film's 7232 frames: 240 frames a chunk,
//            31 chunks, 2 workers (the default), 24 fps.
// opts.set picks the file set (only 'world' ships; any other key falls back to it).
// Pure function of t (the tab scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

// web/ at 86dae32d: [name as the explorer shows it, path, bytes, indented under engine/]
const TREE = [
  ['army.js', 'web/engine/army.js', 7170, true],
  ['env.js', 'web/engine/env.js', 6055, true],
  ['europe.js', 'web/engine/europe.js', 9189, true],
  ['fx.js', 'web/engine/fx.js', 10775, true],
  ['gl.js', 'web/engine/gl.js', 8403, true],
  ['overlay.js', 'web/engine/overlay.js', 8138, true],
  ['renderer.js', 'web/engine/renderer.js', 22100, true],
  ['shaders.js', 'web/engine/shaders.js', 26428, true],
  ['sprites.js', 'web/engine/sprites.js', 38521, true],
  ['terrain.js', 'web/engine/terrain.js', 13791, true],
  ['events.js', 'web/events.js', 3697, false],
  ['film.js', 'web/film.js', 53102, false],
  ['script.js', 'web/script.js', 5475, false],
];

// web/engine/env.js lines 26 to 28 at 86dae32d, verbatim: the sunrise preset
const SUNRISE = [
  [26, '  sunrise: { az: 138, el: 7, sunCol: [4.2, 2.8, 1.6], ambTop: [0.36, 0.40, 0.50], ambBot: [0.17, 0.15, 0.13], fogCol: [0.85, 0.74, 0.62],'],
  [27, '    fog: [4, 28, 0.05, 0.025], fogNoise: 0.7, cloud: [0.55, 0.3, 1.8, 0.45], cloudShadow: 0.45, zenith: [0.2, 0.3, 0.52], horizon: [0.95, 0.78, 0.6],'],
  [28, '    cloudLit: [2.4, 1.6, 1.0], cloudDark: [0.30, 0.28, 0.34], scatter: 1.6, frost: 0.5, exposure: 1.0, bloom: 0.4, threshold: 0.9, sat: 1.05, gain: [1.03, 1.0, 0.95] },'],
];

const SETS = {
  world: {
    say: 'Writing the engine. Sound travels at 343 m/s.',
    tree: TREE,
    open: 1,                       // env.js, the file the pane shows
    lines: SUNRISE,
    lang: 'JavaScript',
    run: 'node tools/render.mjs --fps 24 --chunk 10',
    log: '31 chunks · 2 workers · 24 fps',
  },
};
const set = (opts) => SETS[opts && opts.set] || SETS.world;

const VIEW = 10;   // rows the pane shows
const LH = 15;     // px per row (code.css .code-ln height)
const COLS = 44;   // characters a pane row holds (code.css: 282px of 10px mono, 44 x 6.02px = 265px)
const HANG = 4;    // a continuation row's hanging indent, in characters (code.css .code-wr padding-left: 4ch)

/** one long source line -> rows, broken only after ", " where the next token is a property name */
function wrap(line) {
  const parts = line.split(/(?<=, )(?=[A-Za-z_$][\w$]*: )/);
  const rows = [];
  let cur = '';
  for (const p of parts) {
    const lim = rows.length ? COLS - HANG : COLS;
    if (cur && (cur + p).trimEnd().length > lim) { rows.push(cur); cur = p; } else cur += p;
  }
  rows.push(cur);
  return rows;
}

const KEYWORDS = new Set(['import', 'from', 'export', 'default', 'const', 'let', 'return', 'function', 'if', 'else', 'for', 'of', 'new']);
const TOKEN = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)|(\d[\w.]*)|(\s+)|([^\s\w])/g;

/** one row -> [css class, text] runs, merged so the DOM stays small; a name followed by ':' is a property key */
function colorLine(line) {
  const raw = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m[1]) raw.push(['c', m[1]]);
    else if (m[2]) raw.push(['s', m[2]]);
    else if (m[3]) raw.push([KEYWORDS.has(m[3]) ? 'k' : 'x', m[3]]);
    else if (m[4]) raw.push(['n', m[4]]);
    else raw.push(['p', m[5] || m[6]]);
  }
  for (let i = 0; i < raw.length - 1; i++) {
    if (raw[i][0] === 'x' && raw[i + 1][1] === ':') raw[i][0] = 'a';
  }
  const out = [];
  raw.forEach(([c, text]) => {
    const last = out[out.length - 1];
    if (last && last[0] === c) last[1] += text;
    else out.push([c, text]);
  });
  return out;
}

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.code0 = r + 0.42;   // env.js starts typing, and the first explorer row starts counting
    T.code1 = r + 2.1;    // env.js lands its last character; every file is written
    // the open file types across the whole window; the others count up one after another, each for a share of the
    // window sized to its bytes, so the chip's byte total climbs at an even pace
    const others = S.tree.reduce((s, [, , n], i) => (i === S.open ? s : s + n), 0);
    const span = T.code1 - T.code0;
    let at = T.code0;
    T.file = S.tree.map(([, , n], i) => {
      if (i === S.open) return [T.code0, T.code1];
      const a = at, b = a + span * (n / others);
      at = b;
      return [a, b];
    });
    T.check = T.code1 + 0.04;  // the render command
    T.done = r + 2.28;         // the chip resolves: Wrote N files, and the render's log line
    T.end = r + 2.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = set(k.opts);
    const N = S.tree.length;
    const TOTAL = S.tree.reduce((s, [, , n]) => s + n, 0);
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const OPEN = S.tree[S.open];

    // the pane's rows: each source line soft-wrapped, with its offset into the typed text
    const TEXT = S.lines.map(([, s]) => s).join('\n');
    const ROWS = [];
    let off = 0;
    S.lines.forEach(([ln, s]) => {
      const lineStart = off;
      let o = off;
      wrap(s).forEach((text, j) => { ROWS.push({ ln, text, cont: j > 0, start: o, lineStart }); o += text.length; });
      off += s.length + 1;
    });

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 bytes</b></div></div>`);
    const ed = x.el(`<div class="code-ed">
      <div class="code-tabs"><span class="code-xh">web</span><span class="code-tab"><i class="code-td"></i><span class="code-tn">${x.esc(OPEN[0])}</span></span></div>
      <div class="code-bar"><i class="code-bar-f"></i></div>
      <div class="code-body">
        <div class="code-tree"><div class="code-fold"><i class="code-tw"></i><span class="code-rn">engine</span></div>${S.tree.map(([name, , , sub]) => `<div class="code-row${sub ? ' code-sub' : ''}"><span class="code-rn">${x.esc(name)}</span><b class="code-rb"></b></div>`).join('')}</div>
        <div class="code-view"><div class="code-pane"><div class="code-scr"><div class="code-gut">${ROWS.map((R) => `<i>${R.cont ? '' : R.ln}</i>`).join('')}</div><pre class="code-src"></pre></div></div></div>
      </div>
      <div class="code-status"><span class="code-st"><i class="code-sd"></i><span class="code-stt"></span>${x.OK}</span><span class="code-pos"></span></div>
    </div>`);
    const tab = ed.querySelector('.code-tab');
    const bar = ed.querySelector('.code-bar-f');
    const scr = ed.querySelector('.code-scr');
    const src = ed.querySelector('.code-src');
    const trows = [...ed.querySelectorAll('.code-row')].map((node) => ({ node, size: node.querySelector('.code-rb'), shown: '' }));
    const caret = x.el('<i class="code-caret"></i>');
    const code = ROWS.map((R) => {
      const node = x.el(`<div class="code-ln${R.cont ? ' code-wr' : ''}"></div>`);
      const spans = colorLine(R.text).map(([c, t]) => { const s = x.el(`<span class="code-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
      src.appendChild(node);
      return { ...R, node, spans };
    });
    const cps = TEXT.length / (T.file[S.open][1] - T.file[S.open][0]);
    const st = ed.querySelector('.code-st'), stt = ed.querySelector('.code-stt'), pos = ed.querySelector('.code-pos');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    // reveal the first n characters of the typed text; returns the caret's row index
    const paint = (n) => {
      let where = 0;
      code.forEach((R, ri) => {
        let used = 0;
        R.spans.forEach(({ s, t }) => {
          const take = clamp(n - (R.start + used), 0, t.length);
          if (s.textContent.length !== take) s.textContent = t.slice(0, take);
          used += t.length;
        });
        if (R.start <= n) where = ri;
      });
      return where;
    };
    const placeCaret = (R, col) => {
      let c0 = 0;
      for (const { s, t } of R.spans) {
        if (col < c0 + t.length) { R.node.insertBefore(caret, col === c0 ? s : s.nextSibling); return; }
        c0 += t.length;
      }
      R.node.appendChild(caret);
    };

    return {
      nodes: [say, chip, ed],
      marks: [[T.r, say], [T.chip, chip], [T.card, ed]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the writing chip: spinner and a climbing byte total, then a check and "Wrote N files"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;

        // the editor card rises in
        rise(ed, seg(t, T.card, T.card + 0.42), 14);

        // the explorer: each file counts up to its size in its window, then settles; the open file is struck
        let sum = 0;
        trows.forEach((Rw, i) => {
          const [a, b] = T.file[i];
          const size = S.tree[i][2];
          const p = i === S.open ? streamCount(TEXT, a, cps, t) / TEXT.length : seg(t, a, b);
          const v = size * p;
          sum += v;
          Rw.node.classList.toggle('code-act', i === S.open);
          Rw.node.classList.toggle('code-go', t >= a && t < b);
          Rw.node.classList.toggle('code-on', t >= b);
          const txt = t >= a ? num(v) : '';
          if (Rw.shown !== txt) { Rw.size.textContent = txt; Rw.shown = txt; }
        });
        const cs = `${num(done ? TOTAL : sum)} bytes`;
        if (ccount.textContent !== cs) ccount.textContent = cs;
        bar.style.transform = `scaleX(${Math.max(0.012, sum / TOTAL).toFixed(4)})`;

        // the pane: type the excerpt, caret at its head, scrolled so the caret row sits one row above the foot
        const [a, b] = T.file[S.open];
        const cn = streamCount(TEXT, a, cps, t);
        const ri = paint(cn);
        const R = code[ri];
        const col = cn - R.start;
        placeCaret(R, col);
        const f = ri + col / Math.max(1, R.text.length);
        const sc = clamp(f - (VIEW - 1.5), 0, Math.max(0, code.length - VIEW));
        scr.style.transform = sc ? `translateY(${(-sc * LH).toFixed(2)}px)` : '';
        caret.style.opacity = t >= T.code0 && t < T.done ? '1' : '0';
        tab.classList.toggle('code-act', true);
        tab.classList.toggle('code-on', t >= b);

        // the status strip: the current step, then the render's log line; the caret's line and column on the right
        const step = done ? S.log : t >= T.check ? S.run : `Writing ${OPEN[1]}`;
        if (stt.textContent !== step) stt.textContent = step;
        st.classList.toggle('code-on', t >= T.check);
        st.classList.toggle('code-ok', done);
        const ps = `${S.lang}  Ln ${R.ln}, Col ${cn - R.lineStart + 1}`;
        if (pos.textContent !== ps) pos.textContent = ps;
      },
    };
  },
};
