// Code beat: the routed model writes Turbo Kart Rally's source. The tool chip counts the lines as they land, and an
// editor card rises in its place: three file tabs (kart.ts, items.ts, race.ts), a thin progress bar, and the source
// typing in under a caret while the pane scrolls to keep the caret on screen. Each file types in its own window; when
// one finishes its tab settles green and the next tab takes focus. A status strip under the pane rolls through the
// tool steps (reading the assets, writing each file, type-check) and closes on a green Build OK.
// The source is the game the clip shows: SPACE hops and drifts, the drift charges sparks blue then orange and boosts
// on release (the mini-turbo), an item box rolls an item, three laps, eight racers (Blaze Zippy Bella Toadly Rex Grumbo
// Koopz Dotty), 100cc on Palm Cove Circuit.
// opts.set picks the file set (only 'world' ships; any other key falls back to it). Pure function of t (the tab
// scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

const KART = [
  "import { Input, Keys } from './input';",
  '',
  'export class Kart {',
  '  speed = 0;',
  '  drift = 0;   // -1 left, 1 right',
  '  charge = 0;  // mini-turbo charge, seconds',
  '',
  '  update(dt: number, input: Input) {',
  '    if (input.tapped(Keys.SPACE)) this.hop();',
  '    if (input.held(Keys.SPACE) && input.steer) {',
  '      this.drift = Math.sign(input.steer);',
  '      this.charge += dt;',
  '    }',
  '    // drift sparks go blue, then orange',
  "    this.sparks = this.charge > 1.4 ? 'orange' : 'blue';",
  '    if (!input.held(Keys.SPACE) && this.charge > 0.6) {',
  '      this.boost(this.charge > 1.4 ? 1.6 : 1.0);',
  '      this.drift = this.charge = 0;',
  '    }',
  '  }',
  '}',
];
const ITEMS = [
  "import { Kart } from './kart';",
  '',
  "export const ITEMS = ['banana', 'green-shell', 'red-shell',",
  "  'mushroom', 'star', 'lightning'] as const;",
  'export type Item = (typeof ITEMS)[number];',
  '',
  '// hit an item box: the roulette spins, then lands',
  'export function rollItemBox(kart: Kart): Item {',
  '  const back = kart.place >= 5; // rear rolls better',
  '  const pool = back ? ITEMS.slice(2) : ITEMS.slice(0, 4);',
  '  return pool[Math.floor(kart.rng() * pool.length)];',
  '}',
];
const RACE = [
  "import { Kart } from './kart';",
  '',
  "export const RACERS = ['Blaze', 'Zippy', 'Bella', 'Toadly',",
  "  'Rex', 'Grumbo', 'Koopz', 'Dotty'];",
  "export const RACE = { track: 'Palm Cove Circuit',",
  "  class: '100cc', laps: 3 };",
  '',
  'export function crossLine(kart: Kart) {',
  '  kart.lap += 1;  // HUD: LAP 2/3',
  '  if (kart.lap > RACE.laps) kart.finish();',
  '}',
];

// [tab name, path, whole-file line count the chip credits, the head of the file that types in]
const SETS = {
  world: {
    say: 'Writing the kart physics: drift, mini-turbo, items, 3 laps.',
    files: [
      ['kart.ts', 'src/kart.ts', 486, KART],
      ['items.ts', 'src/items.ts', 214, ITEMS],
      ['race.ts', 'src/race.ts', 338, RACE],
    ],
    read: 'Reading 4 meshes + 4 portraits',
    check: 'Type-check passed',
  },
};
const set = (opts) => SETS[(opts && opts.set) || 'world'] || SETS.world;

const VIEW = 9;   // lines the pane shows
const LH = 15;    // px per line (code.css .code-ln height)

const KEYWORDS = new Set(['import', 'from', 'export', 'class', 'const', 'new', 'readonly', 'return', 'this', 'as', 'let', 'function', 'extends', 'interface', 'type', 'enum', 'if', 'else', 'typeof']);
const TYPES = new Set(['string', 'number', 'void', 'boolean', 'Input', 'Keys', 'Kart', 'Item', 'Math']);
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
    T.code0 = r + 0.42;   // kart.ts starts typing
    T.code1 = r + 2.1;    // race.ts lands its last character
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

        // the active file is the last one whose window has opened (kart.ts until items.ts starts, and so on)
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
        const ps = `TypeScript  Ln ${here[0] + 1}, Col ${here[1] + 1}`;
        if (pos.textContent !== ps) pos.textContent = ps;
      },
    };
  },
};
