// Code beat: Claude Opus 5.5 writes Prometheus II's source. The tool chip counts the lines as they land, and an
// editor card rises in its place: three file tabs (chapters.ts, kardashev.ts, Title.tsx), a thin progress bar, and
// the source typing in under a caret while the pane scrolls to keep the caret on screen. Each file types in its own
// window; when one finishes its tab settles gold and the next tab takes focus. A status strip under the pane rolls
// through the tool steps (reading chapters.json, writing each file, type-check) and closes on Build OK.
// The source is the film the clip shows: the real chapter table (roman numeral, name, the year and Kardashev K the
// HUD settles on, the headline words exactly as they slam in), Sagan's K formula (K 0.729 today, K 3.000 at Type
// III) and the kinetic type component that sets WE NEVER GAVE IT BACK. one word per beat at 150 BPM.
// opts.set picks the file set (only 'world' ships; any other key falls back to it). Pure function of t (the tab
// scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

const CHAPTERS = [
  '// Prometheus II: the chapter table, read off the film',
  'const ch = (n: string, name: string, year: number,',
  '  k: number, line: string) => ({ n, name, year, k, line });',
  'export type Chapter = ReturnType<typeof ch>;',
  '',
  'export const CHAPTERS: Chapter[] = [',
  "  ch('I', 'HELLAS', -508, 0.470, 'WE INVENTED DEMOCRACY.'),",
  "  ch('II', 'ROMA', -47, 0.480, 'VENI · VIDI · VICI.'),",
  "  ch('III', 'TENEBRAE', 476, 0.470, 'THE LIGHTS WENT OUT.'),",
  "  ch('IV', 'CATHEDRALIS', 1163, 0.490, 'THEN WE BUILT CATHEDRALS.'),",
  "  ch('V', 'RINASCITA', 1436, 0.520, 'REBIRTH.'),",
  "  ch('VI', 'MARE INCOGNITVM', 1492, 0.540, 'THE MAP WAS BLANK.'),",
  "  ch('VII', 'MVSICA', 1685, 0.550, 'BACH.'),",
  "  ch('VIII', 'LVX', 1687, 0.560, 'WE FOUND THE LAWS.'),",
  "  ch('IX', 'VAPOR', 1844, 0.605, 'TELEGRAPH.'),",
  "  ch('X', 'VITA', 1928, 0.652, 'WE BEAT THE PLAGUES.'),",
  "  ch('XI', 'LIBERTAS', 1886, 0.658, 'THEN CAME AMERICA.'),",
  "  ch('XII', 'MAGNA OPERA', 1889, 0.660, 'EIFFEL TOWER.'),",
  "  ch('XIII', 'ATOMVS', 1942, 0.660, 'FIRE FROM THE ATOM.'),",
  "  ch('XIV', 'T-MINUS', 1969, 0.680, 'We choose to go to the Moon.'),",
  "  ch('XV', 'COSMOS', 1969, 0.681, 'ONE SMALL STEP.'),",
  "  ch('XVI', 'SILICON', 1971, 0.690, 'WE TAUGHT SAND TO THINK.'),",
  "  ch('XVII', 'KARDASHEV', Infinity, 3.000, 'TYPE III.'),",
  '];',
];
const KARDASHEV = [
  "// Sagan's scale: K = (log10 P - 6) / 10, P in watts",
  'export const kardashev = (watts: number) =>',
  '  (Math.log10(watts) - 6) / 10;',
  '',
  '// humanity, AD 2024: 19.5 TW of primary energy',
  'export const NOW = kardashev(1.95e13);  // K 0.729',
  '',
  '// Type I 1e16 W, Type II 1e26 W, Type III 1e36 W',
  'export const TYPE_III = kardashev(1e36);  // K 3.000',
  '',
  'export const readout = (k: number) => `K ${k.toFixed(3)}`;',
];
const TITLE = [
  '// kinetic type: one word per beat, the accent word lit',
  'type Props = { words: string[]; accent?: string };',
  'const BEAT = 60 / 150;  // 150 BPM, chapters XIV to XVII',
  '',
  'export function Title({ words, accent }: Props) {',
  '  return (',
  '    <h1 className="title">',
  '      {words.map((w, i) => (',
  "        <span key={i} className={w === accent ? 'lit' : ''}",
  '          style={{ animationDelay: `${i * BEAT}s` }}>{w}</span>',
  '      ))}',
  '    </h1>',
  '  );',
  '}',
  '',
  'export const Opening = () => (',
  "  <Title words={['WE', 'NEVER', 'GAVE', 'IT', 'BACK.']}",
  "    accent='BACK.' />",
  ');',
];

// [tab name, path, whole-file line count the chip credits, the head of the file that types in]
// chapters.ts goes on past its head: the 100 settled ANNO/K pairs follow as ERAS (1 blank + 102 lines).
const SETS = {
  world: {
    say: "Writing the source: XVII chapters, Sagan's K scale, kinetic type.",
    files: [
      ['chapters.ts', 'src/chapters.ts', CHAPTERS.length + 103, CHAPTERS],
      ['kardashev.ts', 'src/kardashev.ts', KARDASHEV.length, KARDASHEV],
      ['Title.tsx', 'src/Title.tsx', TITLE.length, TITLE],
    ],
    read: 'Reading chapters.json, 100 eras',
    check: 'Type-check passed',
  },
};
const set = (opts) => SETS[(opts && opts.set) || 'world'] || SETS.world;

const VIEW = 9;   // lines the pane shows
const LH = 15;    // px per line (code.css .code-ln height)

const KEYWORDS = new Set(['import', 'from', 'export', 'class', 'const', 'new', 'readonly', 'return', 'this', 'as', 'let', 'function', 'extends', 'interface', 'type', 'enum', 'if', 'else', 'typeof']);
const TYPES = new Set(['string', 'number', 'void', 'boolean', 'Chapter', 'Props', 'ReturnType', 'Title', 'Infinity', 'Math']);
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
    T.code0 = r + 0.42;   // chapters.ts starts typing
    T.code1 = r + 2.1;    // Title.tsx lands its last character
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

        // the active file is the last one whose window has opened (chapters.ts until kardashev.ts starts, and so on)
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
