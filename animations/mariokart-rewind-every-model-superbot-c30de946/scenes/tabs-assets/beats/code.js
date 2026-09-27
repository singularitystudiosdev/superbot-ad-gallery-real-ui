// Code beat: Claude Opus writes Turbo Kart Rally out of everything the thread made before it.
//
// set 'kart' (the default): "Wiring it together". The editor card is an explorer beside one open file. The explorer
// first lists the assets it imports, each tagged with the tile of the model that made it (Gemini's eight racer
// portraits, Meshy's four kart meshes, DeepSeek's item sprites and odds.json), then Opus's own files land under them
// as src/main.ts types in on the right: each import line that gets typed lands the file it names, with its +line count
// climbing. The chip counts every written line; under the pane the checks tick on in order (Writing 9 files,
// Type-check passed, Tests 52/52 passing, Build OK).
//
// set 'world' (the earlier cut): three file tabs (kart.ts, items.ts, race.ts) typing back to back, with a status strip
// that rolls through the tool steps to Build OK. Any unknown set key falls back to 'kart'.
//
// Pure function of t (the tab scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

// ---------- set 'world' sources ----------
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

// ---------- set 'kart' sources ----------
// src/main.ts: the wiring file. Lines 0..7 each import one of Opus's own files, in the explorer's order.
const MAIN = [
  "import palmCove from './track/palmCove';",
  "import drift from './physics/drift';",
  "import rivals from './ai/rivals';",
  "import countdown from './race/countdown';",
  "import lapCounter from './hud/lapCounter';",
  "import minimap from './hud/minimap';",
  "import speedometer from './hud/speedometer';",
  "import racerSelect from './ui/racerSelect';",
  "import odds from './items/odds.json';",
  '',
  "const karts = glb('assets/karts/*.glb');",
  "const racers = png('assets/racers/*.png');",
  '',
  'export const game = race({',
  '  track: palmCove, laps: 3, cc: 100,',
  '  racers, karts, odds, drift, rivals,',
  '  intro: [racerSelect, countdown],',
  '  hud: [lapCounter, minimap, speedometer],',
  '});',
];
// [directory, file, extra tag, the model that made it, file kind]: what the build imports from the thread
const IMPORTED = [
  ['assets/racers/', '*.png', '×8', 'gemini', 'png'],
  ['assets/karts/', 'blaze_kart.glb', '', 'meshy', 'glb'],
  ['assets/karts/', 'toadly_kart.glb', '', 'meshy', 'glb'],
  ['assets/karts/', 'zippy_kart.glb', '', 'meshy', 'glb'],
  ['assets/karts/', 'bella_kart.glb', '', 'meshy', 'glb'],
  ['assets/items/', '*.png', '', 'deepseek', 'png'],
  ['src/items/', 'odds.json', '', 'deepseek', 'json'],
];
// [directory, file, whole-file line count, the MAIN line whose typing lands it (-1: main.ts itself, open in the pane)]
const WRITTEN = [
  ['src/', 'main.ts', MAIN.length, -1],
  ['src/track/', 'palmCove.ts', 612, 0],
  ['src/physics/', 'drift.ts', 238, 1],
  ['src/ai/', 'rivals.ts', 344, 2],
  ['src/race/', 'countdown.ts', 96, 3],
  ['src/hud/', 'lapCounter.ts', 88, 4],
  ['src/hud/', 'minimap.ts', 142, 5],
  ['src/hud/', 'speedometer.ts', 74, 6],
  ['src/ui/', 'racerSelect.ts', 216, 7],
];
const TESTS = 52;

// [tab name, path, whole-file line count the chip credits, the head of the file that types in]
const SETS = {
  kart: {
    layout: 'tree',
    say: 'Wiring it together: track, drift, rivals, items, HUD.',
    files: WRITTEN,
  },
  world: {
    layout: 'tabs',
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
const set = (opts) => SETS[(opts && opts.set) || 'kart'] || SETS.kart;

const VIEW = 9;   // lines the 'world' pane shows
const LH = 15;    // px per line (code.css .code-ln height)
const KVIEW = 16; // lines the 'kart' pane shows (code.css .code-kview height / LH)

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

const num = (n) => Math.round(n).toLocaleString('en-US');
const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

/** build the coloured, initially empty lines of one source into `src`; returns the pane model */
function makeCode(x, src, L) {
  const code = L.map((text) => {
    const node = x.el('<div class="code-ln"></div>');
    const spans = colorLine(text).map(([c, t]) => { const s = x.el(`<span class="code-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
    src.appendChild(node);
    return { text, node, spans };
  });
  return { code, TEXT: L.join('\n') };
}
/** reveal the first n characters of one pane; returns the caret's [line, column] */
function paint(P, n) {
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
}
function placeCaret(caret, P, [li, col]) {
  const Ln = P.code[li];
  let c0 = 0;
  for (const { s, t } of Ln.spans) {
    if (col < c0 + t.length) { Ln.node.insertBefore(caret, col === c0 ? s : s.nextSibling); return; }
    c0 += t.length;
  }
  Ln.node.appendChild(caret);
}
/** keep the caret line one row above the pane's foot, gliding with the column */
function scrollTo(P, where, view) {
  const len = Math.max(1, P.code[where[0]].text.length);
  const f = where[0] + where[1] / len;
  const off = clamp(f - (view - 1.5), 0, Math.max(0, P.code.length - view));
  P.scr.style.transform = off ? `translateY(${(-off * LH).toFixed(2)}px)` : '';
}
/** the chat's "tool is working" spinner, then the shell's green check */
function spinChip(spin, t, t0, done) {
  spin.classList.toggle('done', done);
  spin.style.transform = done ? '' : `rotate(${(((t - t0) * 420) % 360).toFixed(1)}deg)`;
}

// ---------- set 'kart': times ----------
function timesKart(r) {
  const T = { r };
  T.chip = r + 0.14;
  T.card = r + 0.22;
  T.imp = IMPORTED.map((_, i) => r + 0.36 + i * 0.05);   // the imported assets land in the explorer
  T.code0 = r + 0.72;   // main.ts starts typing
  T.code1 = r + 2.16;   // main.ts lands its last character
  const TEXT = MAIN.join('\n');
  const cps = TEXT.length / (T.code1 - T.code0);
  // each of Opus's files lands as its import line starts typing
  let acc = 0;
  const lineAt = MAIN.map((l) => { const a = T.code0 + acc / cps; acc += l.length + 1; return a; });
  T.row = WRITTEN.map(([, , , li]) => (li < 0 ? T.card + 0.3 : lineAt[li]));
  T.wrote = T.code1 + 0.04;   // check 1: Writing 9 files
  T.tc = T.code1 + 0.2;       // check 2: Type-check passed
  T.tests = T.code1 + 0.5;    // check 3: Tests 52/52 passing (the count climbs from T.tc)
  T.done = T.code1 + 0.66;    // check 4: Build OK, and the chip resolves
  T.end = r + 3.3;
  return T;
}

// ---------- set 'kart': build ----------
function buildKart(k, x) {
  const T = k.T;
  const S = set(k.opts);
  const N = WRITTEN.length;
  const TOTAL = WRITTEN.reduce((s, [, , n]) => s + n, 0);
  const CHECKS = [
    [T.code0, T.wrote, `Writing ${N} files`, `Writing ${N} files`],
    [T.wrote, T.tc, 'Type-check', 'Type-check passed'],
    [T.tc, T.tests, 'Tests', 'Tests'],
    [T.tests, T.done, 'Build', 'Build OK'],
  ];
  const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
  const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 lines</b></div></div>`);
  const dirFile = (d, f) => `<span class="code-rp"><span class="code-rd">${x.esc(d)}</span>${x.esc(f)}</span>`;
  const ed = x.el(`<div class="code-ed code-kart">
    <div class="code-khd"><span class="code-kex">turbo-kart-rally</span><span class="code-tab code-act"><i class="code-td"></i><span class="code-tn">main.ts</span></span><span class="code-klang">TypeScript</span></div>
    <div class="code-bar"><i class="code-bar-f"></i></div>
    <div class="code-kbody">
      <div class="code-tree">
        <div class="code-grp"><span>Imported</span>${x.tile('gemini', 'code-mt')}${x.tile('meshy', 'code-mt')}${x.tile('deepseek', 'code-mt')}</div>
        ${IMPORTED.map(([d, f, tag, app, kind]) => `<div class="code-row code-imp"><i class="code-fi code-fi-${kind}"></i>${dirFile(d, f)}${tag ? `<em class="code-rx">${x.esc(tag)}</em>` : ''}${x.tile(app, 'code-mt')}</div>`).join('')}
        <div class="code-grp"><span>Written</span>${x.tile('opus', 'code-mt')}</div>
        ${WRITTEN.map(([d, f]) => `<div class="code-row code-own"><i class="code-fi code-fi-ts"></i>${dirFile(d, f)}<b class="code-rn">+0</b></div>`).join('')}
      </div>
      <div class="code-view code-kview"><div class="code-pane"><div class="code-scr"><div class="code-gut">${MAIN.map((_, i) => `<i>${i + 1}</i>`).join('')}</div><pre class="code-src"></pre></div></div></div>
    </div>
    <div class="code-checks">${CHECKS.map(([, , run], i) => `<span class="code-ck"><span class="spin"></span><span class="code-ckt">${i === 2 ? `Tests <b class="code-ckn">0</b>/${TESTS} passing` : x.esc(run)}</span></span>`).join('')}</div>
  </div>`);
  const bar = ed.querySelector('.code-bar-f');
  const caret = x.el('<i class="code-caret"></i>');
  const pane = ed.querySelector('.code-pane');
  const P = { ...makeCode(x, pane.querySelector('.code-src'), MAIN), scr: pane.querySelector('.code-scr') };
  const cps = P.TEXT.length / (T.code1 - T.code0);
  const tab = ed.querySelector('.code-khd .code-tab');
  const impRows = [...ed.querySelectorAll('.code-imp')];
  const ownRows = [...ed.querySelectorAll('.code-own')].map((row) => ({ row, n: row.querySelector('.code-rn') }));
  const cks = [...ed.querySelectorAll('.code-ck')].map((c) => ({ c, spin: c.querySelector('.spin'), t: c.querySelector('.code-ckt'), n: c.querySelector('.code-ckn') }));
  const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
  const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
  const vis = say.firstElementChild, hid = say.lastElementChild;
  let shown = -1;

  return {
    nodes: [say, chip, ed],
    marks: [[T.r, say], [T.chip, chip], [T.card, ed]],
    render(t) {
      const n = streamCount(S.say, T.r + 0.06, 80, t);
      if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

      // the writing chip: spinner and a climbing line total, then a check and "Wrote 9 files"
      rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
      const done = t >= T.done;
      spinChip(spin, t, T.chip, done);
      chipEl.classList.toggle('code-done', done);
      const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
      if (clab.textContent !== cl) clab.textContent = cl;

      // the editor card rises in; the imported assets land first, each with its maker's tile
      rise(ed, seg(t, T.card, T.card + 0.42), 14);
      impRows.forEach((row, i) => rise(row, seg(t, T.imp[i], T.imp[i] + 0.24), 5));

      // main.ts types in; each import line lands the file it names, whose +count climbs, then settles green
      const cn = streamCount(P.TEXT, T.code0, cps, t);
      const where = paint(P, cn);
      placeCaret(caret, P, where);
      scrollTo(P, where, KVIEW);
      caret.style.opacity = t >= T.code0 && t < T.done ? '1' : '0';
      let sum = 0;
      ownRows.forEach(({ row, n: nEl }, i) => {
        const [, , lines, li] = WRITTEN[i];
        const a = T.row[i];
        rise(row, seg(t, a, a + 0.22), 5);
        // main.ts counts the lines typed so far; every other file climbs to its total over 0.3s as it lands
        const got = li < 0 ? lines * (cn / P.TEXT.length) : lines * outCubic(seg(t, a, a + 0.3));
        sum += got;
        const s = `+${num(got)}`;
        if (nEl.textContent !== s) nEl.textContent = s;
        row.classList.toggle('code-act', li < 0 && t < T.code1);
        row.classList.toggle('code-on', li < 0 ? t >= T.code1 : t >= a + 0.3);
      });
      tab.classList.toggle('code-on', t >= T.code1);
      const cs = `${num(done ? TOTAL : sum)} lines`;
      if (ccount.textContent !== cs) ccount.textContent = cs;
      bar.style.transform = `scaleX(${Math.max(0.012, done ? 1 : (cn / P.TEXT.length) * 0.86 + 0.14 * seg(t, T.code1, T.done)).toFixed(4)})`;

      // the checks tick on in order under the pane
      cks.forEach(({ c, spin: sp, t: txt, n: nEl }, i) => {
        const [a, b, , fin] = CHECKS[i];
        rise(c, seg(t, a, a + 0.18), 4);
        const ok = t >= b;
        spinChip(sp, t, a, ok);
        c.classList.toggle('code-ok', ok);
        if (nEl) {
          const s = String(Math.round(TESTS * seg(t, a, b)));
          if (nEl.textContent !== s) nEl.textContent = s;
        } else {
          const s = ok ? fin : CHECKS[i][2];
          if (txt.textContent !== s) txt.textContent = s;
        }
      });
    },
  };
}

// ---------- set 'world': times ----------
function timesWorld(r, S) {
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
}

// ---------- set 'world': build ----------
function buildWorld(k, x) {
  const T = k.T;
  const S = set(k.opts);
  const N = S.files.length;
  const TOTAL = S.files.reduce((s, [, , n]) => s + n, 0);
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
    const M = makeCode(x, pane.querySelector('.code-src'), S.files[fi][3]);
    return { pane, scr: pane.querySelector('.code-scr'), ...M, cps: M.TEXT.length / (T.file[fi][1] - T.file[fi][0]) };
  });
  const CHARS = panes.reduce((s, p) => s + p.TEXT.length, 0);
  const st = ed.querySelector('.code-st'), stt = ed.querySelector('.code-stt'), pos = ed.querySelector('.code-pos');
  const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
  const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
  const vis = say.firstElementChild, hid = say.lastElementChild;
  let shown = -1;

  return {
    nodes: [say, chip, ed],
    marks: [[T.r, say], [T.chip, chip], [T.card, ed]],
    render(t) {
      const n = streamCount(S.say, T.r + 0.06, 80, t);
      if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

      // the writing chip: spinner and a climbing line total, then a check and "Wrote N files"
      rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
      const done = t >= T.done;
      spinChip(spin, t, T.chip, done);
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
          placeCaret(caret, P, where);
          scrollTo(P, where, VIEW);
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
}

export default {
  times(r, opts) {
    const S = set(opts);
    return S.layout === 'tree' ? timesKart(r) : timesWorld(r, S);
  },
  build(k, x) {
    return set(k.opts).layout === 'tree' ? buildKart(k, x) : buildWorld(k, x);
  },
};
