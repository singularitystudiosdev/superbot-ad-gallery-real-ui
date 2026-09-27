// Code beat: Claude Opus 5.5 writes The Last Invention's edit as code. The tool chip counts the lines as they land,
// and an editor card rises in its place: three file tabs (timeline.ts, cuts.ts, edit.ts), a thin progress bar, and
// the source typing in under a caret while the pane scrolls to keep the caret on screen. Each file types in its own
// window; when one finishes its tab settles brass and the next tab takes focus. A status strip under the pane rolls
// through the tool steps (scanning the frames, writing each file, type-check) and closes on Build OK.
// The source is the film the clip shows, not a mock:
//   timeline.ts  a small timeline DSL of our own (not any vendor's API): marks snap to frames at 24 fps, and reel()
//                refuses a named shot that does not start and end on the cut list.
//   cuts.ts      every hard cut in the film, as the first frame of each new shot: the 60 of the 0.25 scene pass plus
//                the 10 it missed (1343, 2537, 2814, 3258, 4004, 4204, 4281, 4420, 5628, 6063), each found as a
//                frame-difference spike and checked by eye on the frames either side. 70 cuts, 71 shots, END 7569
//                (315.375 s, one past the last frame 7568). 779-799 is a dissolve (opening title into the pub), not a cut.
//   edit.ts      the named shots and every card the brief asks for, at the film's times: chapter cards 32.5, 102.3,
//                171.5; the superintelligence dictionary card 84.5-92.4 with the definition exactly as set on screen
//                (curly quotes, ellipsis glyph; Bostrom 2014); the Jack Good lower third 115.6; dominoes 135.750 to
//                141.042 (frames 3258-3384, out is exclusive: the next shot starts on 3385); the Good 1965 quote card
//                145.5 as set on screen (ellipsis glyphs, no quote marks); the data centre caption 175.3; paperclips
//                228.750 to 234.500 (frames 5490-5627); the title card 305.375 to the end with its three credits.
// Every file is typed whole: the chip credits exactly the lines that type in. No em or en dash anywhere in the source.
// opts.set picks the file set (only 'edit' ships; any other key, including chat.js's 'world', falls back to it).
// Pure function of t (the tab scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

const TIMELINE = [
  '// A small timeline: shots sit on cuts, cards sit over shots.',
  'const FPS = 24, on = (s: number) => Math.round(s * FPS) / FPS;',
  'type Mark = { kind: string; span: number[]; text: string[] };',
  'const mark = (kind: string) =>',
  '  (a: number, b: number, ...text: string[]): Mark =>',
  '    ({ kind, span: [on(a), on(b)], text });',
  '',
  'export const [shot, chapter, dictionary, lowerThird, quote, caption,',
  "  title] = ['shot', 'chapter', 'dictionary', 'lowerThird', 'quote',",
  "  'caption', 'title'].map(mark);",
  '',
  'export function reel(cuts: number[], end: number, marks: Mark[]) {',
  '  const at = [0, ...cuts, end].map((f) => f / FPS);',
  '  for (const m of marks)',
  "    if (m.kind === 'shot' && !m.span.every((s) => at.includes(s)))",
  '      throw new Error(`${m.text[0]} is off the cut list`);',
  '  const shots = at.slice(1).map((out, i) => [at[i], out]);',
  '  return { fps: FPS, shots, marks };',
  '}',
];

// the first frame of every new shot (frame n spans n/24 to (n+1)/24 s)
const FRAMES = [
  108, 150, 229, 327, 366, 606, 863, 1042, 1254, 1343,
  1432, 1482, 1535, 1605, 1687, 1765, 1903, 1980, 2220, 2436,
  2537, 2619, 2691, 2750, 2814, 2845, 2897, 2956, 3120, 3212,
  3258, 3385, 3467, 3659, 3877, 4004, 4093, 4204, 4281, 4378,
  4420, 4497, 4552, 4630, 4737, 4849, 5009, 5201, 5271, 5347,
  5380, 5441, 5490, 5628, 5739, 5861, 5962, 6063, 6279, 6495,
  6540, 6587, 6711, 6732, 6803, 6826, 6910, 7091, 7189, 7329,
];
const END = 7569;
const rows = [];
for (let i = 0; i < FRAMES.length; i += 10) rows.push(`  ${FRAMES.slice(i, i + 10).map((n) => `${String(n).padStart(4)},`).join(' ')}`);

const CUTS = [
  '// Every hard cut: the first frame of each new shot, at 24 fps.',
  'export const CUTS = [',
  ...rows,
  '];',
  `export const END = ${END}; // one past the last frame, ${(END / 24).toFixed(3)} s`,
];

const EDIT = [
  '// The Last Invention, the edit. Seconds, snapped to frames.',
  'import { reel, shot, chapter, dictionary, lowerThird, quote,',
  "  caption, title } from './timeline';",
  "import { CUTS, END } from './cuts';",
  '',
  'export default reel(CUTS, END, [',
  "  chapter(32.5, 35.3, 'What We Mean By Clever'),",
  "  dictionary(84.5, 92.4, 'superintelligence', 'NOUN',",
  "    '“…any intellect that greatly exceeds the cognitive ' +",
  "    'performance of humans in virtually all domains of ' +",
  "    'interest.”', 'NICK BOSTROM, SUPERINTELLIGENCE (2014)'),",
  "  chapter(102.3, 105.0, 'The Last Invention'),",
  "  lowerThird(115.6, 117.3, 'I. J. \"Jack\" Good', '1916-2009'),",
  "  shot(135.750, 141.042, 'dominoes'),",
  "  quote(145.5, 152.4, '…the first ultraintelligent machine ' +",
  "    'is the last invention that man need ever make…',",
  "    'I. J. GOOD, 1965'),",
  "  chapter(171.5, 174.2, 'The Gorilla Problem'),",
  "  caption(175.3, 177.5, 'A DATA CENTRE, SOMEWHERE COLD.'),",
  "  shot(228.750, 234.500, 'paperclips'),",
  "  title(305.375, 315.375, 'THE LAST INVENTION',",
  "    'PRESENTED BY', 'Dr Imogen Ashby',",
  "    'WRITTEN & DIRECTED BY', 'Fig',",
  "    'PRODUCED FOR', 'Gavin Purcell'),",
  ']);',
];

// [tab name, path, whole-file line count the chip credits, the file, typed whole]
const DIR = 'the-last-invention/';
const SETS = {
  edit: {
    say: 'Writing the edit as code: 70 cuts, 7 cards, one title.',
    files: [
      ['timeline.ts', `${DIR}timeline.ts`, TIMELINE.length, TIMELINE],
      ['cuts.ts', `${DIR}cuts.ts`, CUTS.length, CUTS],
      ['edit.ts', `${DIR}edit.ts`, EDIT.length, EDIT],
    ],
    read: `Scanning ${END.toLocaleString('en-US')} frames for cuts`,
    check: `Type-check passed, ${FRAMES.length + 1} shots`,
  },
};
const set = (opts) => SETS[opts && opts.set] || SETS.edit;

const VIEW = 9;   // lines the pane shows
const LH = 15;    // px per line (code.css .code-ln height)

const KEYWORDS = new Set(['import', 'from', 'export', 'default', 'class', 'const', 'new', 'readonly', 'return', 'this', 'as', 'let', 'function', 'extends', 'interface', 'type', 'enum', 'if', 'else', 'for', 'of', 'throw', 'typeof']);
const TYPES = new Set(['string', 'number', 'void', 'boolean', 'Mark', 'Error', 'Math', 'Infinity']);
const TOKEN = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)|(\d[\w.]*)|(\s+)|([^\s\w])/g;

/** one source line -> [css class, text] runs, merged so the DOM stays small */
function colorLine(line) {
  const raw = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m[1]) raw.push(['c', m[1]]);
    else if (m[2]) raw.push(['s', m[2]]);
    else if (m[3]) {
      const w = m[3];
      if (KEYWORDS.has(w)) raw.push(['k', w]);
      else if (TYPES.has(w) || /^[A-Z]/.test(w)) raw.push(['t', w]);
      else raw.push(['x', w]);
    } else if (m[4]) raw.push(['n', m[4]]);
    else raw.push(['p', m[5] || m[6]]);
  }
  for (let i = 0; i < raw.length - 1; i++) {
    if (raw[i][0] === 'x' && raw[i + 1][1].trim().charAt(0) === '(') raw[i][0] = 'f';
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
    T.code0 = r + 0.42;   // timeline.ts starts typing
    T.code1 = r + 2.1;    // edit.ts lands its last character
    // each file types in a window sized to its length, back to back, with a short gap for the tab switch
    const GAP = 0.06;
    const lens = S.files.map(([, , , L]) => L.join('\n').length);
    const all = lens.reduce((s, n) => s + n, 0);
    const span = T.code1 - T.code0 - GAP * (S.files.length - 1);
    let at = T.code0;
    T.file = lens.map((n) => { const a = at, b = a + span * (n / all); at = b + GAP; return [a, b]; });
    T.check = T.code1 + 0.04;  // Type-check passed
    T.done = r + 2.28;         // the chip resolves: Wrote N files, Build OK
    T.end = r + 2.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = set(k.opts);
    const N = S.files.length;
    const TOTAL = S.files.reduce((s, [, , n]) => s + n, 0);
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 lines</b></div></div>`);
    const ed = x.el(`<div class="code-ed">
      <div class="code-tabs">${S.files.map(([tab, , n]) => `<span class="code-tab"><i class="code-td"></i><span class="code-tn">${x.esc(tab)}</span><b class="code-tl">${num(n)}</b></span>`).join('')}</div>
      <div class="code-bar"><i class="code-bar-f"></i></div>
      <div class="code-view">${S.files.map(([, , , L]) => `<div class="code-pane"><div class="code-scr"><div class="code-gut">${L.map((_, i) => `<i>${i + 1}</i>`).join('')}</div><pre class="code-src"></pre></div></div>`).join('')}</div>
      <div class="code-status"><span class="code-st"><i class="code-sd"></i><span class="code-stt"></span>${x.OK}</span><span class="code-pos"></span></div>
    </div>`);
    const tabs = [...ed.querySelectorAll('.code-tab')];
    const bar = ed.querySelector('.code-bar-f');
    const caret = x.el('<i class="code-caret"></i>');
    const panes = [...ed.querySelectorAll('.code-pane')].map((pane, fi) => {
      const L = S.files[fi][3];
      const src = pane.querySelector('.code-src');
      const code = L.map((text) => {
        const node = x.el('<div class="code-ln"></div>');
        const spans = colorLine(text).map(([c, t]) => { const s = x.el(`<span class="code-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
        src.appendChild(node);
        return { text, node, spans };
      });
      const TEXT = L.join('\n');
      return { pane, scr: pane.querySelector('.code-scr'), code, TEXT, cps: TEXT.length / (T.file[fi][1] - T.file[fi][0]), shown: -1 };
    });
    const CHARS = panes.reduce((s, p) => s + p.TEXT.length, 0);
    const st = ed.querySelector('.code-st'), stt = ed.querySelector('.code-stt'), pos = ed.querySelector('.code-pos');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    // reveal the first n characters of one pane; returns the caret's [line, column]
    const paint = (P, n) => {
      let acc = 0, where = null;
      P.code.forEach((Ln, li) => {
        const start = acc, len = Ln.text.length;
        let used = 0;
        Ln.spans.forEach(({ s, t }) => {
          const take = clamp(n - (start + used), 0, t.length);
          if (s.textContent.length !== take) s.textContent = t.slice(0, take);
          used += t.length;
        });
        if (!where && n <= start + len) where = [li, n - start];
        acc = start + len + 1;
      });
      return where || [P.code.length - 1, P.code[P.code.length - 1].text.length];
    };
    const placeCaret = (P, [li, col]) => {
      const Ln = P.code[li];
      let c0 = 0;
      for (const { s, t } of Ln.spans) {
        if (col < c0 + t.length) { Ln.node.insertBefore(caret, col === c0 ? s : s.nextSibling); return; }
        c0 += t.length;
      }
      Ln.node.appendChild(caret);
    };

    return {
      nodes: [say, chip, ed],
      marks: [[T.r, say], [T.chip, chip], [T.card, ed]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the writing chip: spinner and a climbing line total, then a check and "Wrote N files"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;

        // the editor card rises in
        rise(ed, seg(t, T.card, T.card + 0.42), 14);

        // the active file is the last one whose window has opened (timeline.ts until cuts.ts starts, and so on)
        let active = 0;
        T.file.forEach(([a], i) => { if (t >= a) active = i; });
        let sum = 0, typed = 0, here = [0, 0];
        panes.forEach((P, i) => {
          const [a, b] = T.file[i];
          const cn = streamCount(P.TEXT, a, P.cps, t);
          typed += cn;
          sum += S.files[i][2] * (cn / P.TEXT.length);
          const where = paint(P, cn);
          const on = i === active;
          P.pane.style.display = on ? '' : 'none';
          tabs[i].classList.toggle('code-act', on);
          tabs[i].classList.toggle('code-on', t >= b);
          if (on) {
            here = where;
            placeCaret(P, where);
            // scroll: keep the caret line one row above the pane's foot, gliding with the column
            const len = Math.max(1, P.code[where[0]].text.length);
            const f = where[0] + where[1] / len;
            const off = clamp(f - (VIEW - 1.5), 0, Math.max(0, P.code.length - VIEW));
            P.scr.style.transform = off ? `translateY(${(-off * LH).toFixed(2)}px)` : '';
          }
        });
        caret.style.opacity = t >= T.code0 && t < T.done ? '1' : '0';
        const cs = `${num(done ? TOTAL : sum)} lines`;
        if (ccount.textContent !== cs) ccount.textContent = cs;
        bar.style.transform = `scaleX(${Math.max(0.012, typed / CHARS).toFixed(4)})`;

        // the status strip: the current tool step, then Build OK; the caret's position on the right
        const step = done ? 'Build OK' : t >= T.check ? S.check : t >= T.code0 ? `Writing ${S.files[active][1]}` : S.read;
        if (stt.textContent !== step) stt.textContent = step;
        st.classList.toggle('code-on', t >= T.check);
        st.classList.toggle('code-ok', done);
        const lang = /\.tsx$/.test(S.files[active][1]) ? 'TypeScript JSX' : 'TypeScript';
        const ps = `${lang}  Ln ${here[0] + 1}, Col ${here[1] + 1}`;
        if (pos.textContent !== ps) pos.textContent = ps;
      },
    };
  },
};
