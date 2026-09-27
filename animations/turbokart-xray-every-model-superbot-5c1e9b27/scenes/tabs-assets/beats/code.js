// Code beat: Claude Opus 5.5 writes Turbo Kart Rally in Three.js, procedural everything (the game's own title screen
// reads "original procedural game"). The tool chip counts the lines as they land, and an editor card rises in its
// place: an explorer of the game's eight source files on the left (main.js track.js kart.js drift.js items.js ai.js
// hud.js audio.js, each counting its +lines as it is written and settling green), and on the right three open tabs
// typing back to back under a caret while the pane scrolls to keep the caret on screen:
//   track.js  Palm Cove Circuit as a closed THREE.CatmullRomCurve3, turns banked by curvature (0.26 rad, ~15 deg),
//             180 low-poly palms and 6 grandstands as two InstancedMesh draw calls.
//   drift.js  SPACE hops, a held drift charges through three spark tiers (blue, orange, purple) and fires a
//             mini-turbo on release; 132 km/h is the 100cc top speed and 190 km/h the boost speed, the two numbers
//             the clip's HUD shows (img/tkr/xray.json: 132 km/h in the frozen frame, 190 km/h on the boost pad).
//   hud.js    LAP n/3, the race clock (0:08.88 in the frozen frame), the 8-row standings, the minimap drawn from
//             the track spline, the km/h gauge and the place ordinal (7th). The HUD offsets follow the rects of
//             img/tkr/xray.json in the source's 2098x1080 frame (standings W - 192, 39px rows; minimap 290px square).
// Leading indentation lands with the newline (the editor auto-indents), so the caret only spends time on what is
// actually typed. A status strip under the pane rolls through the tool steps and closes on a green Build OK.
// opts.set picks the file set (only 'kart' ships; any other key falls back to it). Pure function of t (the tab
// scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

const TRACK = [
  "import * as THREE from 'three';",
  '',
  '// Palm Cove Circuit: a closed Catmull-Rom loop',
  'const PTS = [[0, 0], [120, -8], [190, 40], [176, 128],',
  '  [96, 150], [30, 118], [-40, 150], [-110, 96]];',
  'export const curve = new THREE.CatmullRomCurve3(',
  '  PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true);',
  'const M = new THREE.Matrix4();',
  '',
  '// banked turns: tilt by curvature, ~15 deg max',
  'export function bankAt(t) {',
  '  const a = curve.getTangentAt(t);',
  '  const b = curve.getTangentAt((t + 0.01) % 1);',
  '  return Math.min(0.26, a.angleTo(b) * 9);',
  '}',
  '',
  '// low-poly palms + grandstands, one draw call each',
  'export function dress(scene, rng) {',
  '  const palms = new THREE.InstancedMesh(PALM, LEAF, 180);',
  '  const stands = new THREE.InstancedMesh(STAND, PAINT, 6);',
  '  for (let i = 0; i < 180; i++) {',
  '    const p = curve.getPointAt(i / 180);',
  '    p.x += (rng() < 0.5 ? -1 : 1) * (14 + rng() * 10);',
  '    palms.setMatrixAt(i, M.makeTranslation(p));',
  '  }',
  '  for (let i = 0; i < 6; i++)   // the start straight',
  '    stands.setMatrixAt(i, M.makeTranslation(i * 16, 0, -24));',
  '  scene.add(palms, stands);',
  '}',
];
const DRIFT = [
  '// SPACE: hop, then drift, charge, mini-turbo on release',
  'export const MAX_KMH = 132;   // 100cc top speed',
  'export const BOOST_KMH = 190; // boost pad, mini-turbo',
  'const TIERS = [',
  "  { at: 0.6, spark: 'blue', boost: 0.6 },",
  "  { at: 1.2, spark: 'orange', boost: 1.0 },",
  "  { at: 2.0, spark: 'purple', boost: 1.4 },",
  '];',
  '',
  'export function updateDrift(k, input, dt) {',
  "  if (input.pressed('Space') && k.grounded) k.vy = 5.2;",
  "  if (input.down('Space') && input.steer) {",
  '    k.drift ||= Math.sign(input.steer);',
  '    k.charge += dt;',
  '    k.tier = TIERS.findLastIndex((x) => k.charge >= x.at);',
  '  } else if (k.drift) {   // released: mini-turbo',
  '    if (k.tier >= 0) k.boostT = TIERS[k.tier].boost;',
  '    k.drift = k.charge = 0;',
  '  }',
  '  k.boostT = Math.max(0, k.boostT - dt);',
  '  return k.boostT > 0 ? BOOST_KMH : MAX_KMH;',
  '}',
];
const HUD = [
  "import { curve } from './track.js';",
  "import { MAX_KMH } from './drift.js';",
  '',
  "const ORD = (n) => n + (['st', 'nd', 'rd'][n - 1] || 'th');",
  'const clock = (s) => `${Math.floor(s / 60)}:` +',
  "  (s % 60).toFixed(2).padStart(5, '0');   // 0:08.88",
  'const MAP = curve.getSpacedPoints(96);   // minimap outline',
  '',
  'export function drawHud(g, race, me) {',
  '  const { width: W, height: H } = g.canvas;',
  '  g.text(`LAP ${me.lap}/${race.laps}`, 24, 44, 34);',
  '  g.text(clock(race.time), 24, 84, 26);',
  '  race.order.forEach((k, i) => g.row(i + 1, k.name,',
  '    W - 192, 9 + i * 39, k === me));   // 8 rows',
  '  g.minimap(MAP, race.karts, 4, H - 298, 290);',
  '  g.gauge(me.kmh, MAX_KMH, W - 355, H - 225); // km/h',
  '  g.text(ORD(me.place), W / 2, H - 60, 64);   // 7th',
  '}',
];

// the explorer: [file, whole-file line count the chip credits, the head that types in (only the three open tabs),
// and for a file that is not open: [open tab, seconds after that tab starts typing] when it is written]
const SETS = {
  kart: {
    say: 'Writing it in Three.js, procedural everything: track, karts, drift, items, CPU racers, HUD.',
    files: [
      ['main.js', 142, null, [0, -0.2]],
      ['track.js', 318, TRACK],
      ['kart.js', 264, null, [1, 0.12]],
      ['drift.js', 176, DRIFT],
      ['items.js', 231, null, [1, 0.5]],
      ['ai.js', 207, null, [2, 0.12]],
      ['hud.js', 289, HUD],
      ['audio.js', 118, null, [2, 0.5]],
    ],
    read: 'Reading roster, portraits, score cues',
    check: 'Lint passed, 0 warnings',
  },
};
const set = (opts) => SETS[(opts && opts.set) || 'kart'] || SETS.kart;

const VIEW = 9;   // lines the pane shows
const LH = 15;    // px per line (code.css .code-ln height)

const KEYWORDS = new Set(['import', 'from', 'export', 'const', 'let', 'function', 'return', 'if', 'else', 'for', 'new', 'of', 'as', 'true', 'false', 'null', 'this', 'class', 'async', 'await']);
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
      else if (/^[A-Z]/.test(w)) raw.push(['t', w]);
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

// keystrokes for one file: every character except leading indentation, which the editor inserts with the newline
const strokes = (L) => L.reduce((s, line) => s + line.trimStart().length + 1, -1);

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.code0 = r + 0.42;   // track.js starts typing
    T.code1 = r + 3.5;    // hud.js lands its last character
    // each open file types in a window sized to its keystrokes, back to back, with a short gap for the tab switch
    const GAP = 0.06;
    const open = S.files.filter((f) => f[2]);
    const keys = open.map((f) => strokes(f[2]));
    const all = keys.reduce((s, n) => s + n, 0);
    const span = T.code1 - T.code0 - GAP * (open.length - 1);
    let at = T.code0;
    T.file = keys.map((n) => { const a = at, b = a + span * (n / all); at = b + GAP; return [a, b]; });
    // the explorer: an open file counts up with its typing; the others are written while a tab types, each in a
    // short window of its own
    let oi = 0;
    T.row = S.files.map((f) => {
      if (f[2]) return T.file[oi++];
      const a = T.file[f[3][0]][0] + f[3][1];
      return [a, a + 0.24];
    });
    T.check = T.code1 + 0.04;  // Lint passed
    T.done = r + 3.72;         // the chip resolves: Wrote 8 files, Build OK
    T.end = r + 3.95;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = set(k.opts);
    const N = S.files.length;
    const TOTAL = S.files.reduce((s, [, n]) => s + n, 0);
    const open = S.files.filter((f) => f[2]);
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 lines</b></div></div>`);
    const ed = x.el(`<div class="code-ed">
      <div class="code-exp"><div class="code-exh">turbo-kart-rally<small>src</small></div>${S.files.map(([f, n]) => `<span class="code-er"><i class="code-ed-d"></i><span class="code-en">${x.esc(f)}</span><b class="code-el">+0</b></span>`).join('')}</div>
      <div class="code-main">
        <div class="code-tabs">${open.map(([tab]) => `<span class="code-tab"><i class="code-td"></i><span class="code-tn">${x.esc(tab)}</span></span>`).join('')}</div>
        <div class="code-bar"><i class="code-bar-f"></i></div>
        <div class="code-view">${open.map(([, , L]) => `<div class="code-pane"><div class="code-scr"><div class="code-gut">${L.map((_, i) => `<i>${i + 1}</i>`).join('')}</div><pre class="code-src"></pre></div></div>`).join('')}</div>
      </div>
      <div class="code-status"><span class="code-st"><i class="code-sd"></i><span class="code-stt"></span>${x.OK}</span><span class="code-pos"></span></div>
    </div>`);
    const erows = [...ed.querySelectorAll('.code-er')].map((r) => ({ r, el: r.querySelector('.code-el') }));
    const tabs = [...ed.querySelectorAll('.code-tab')];
    const bar = ed.querySelector('.code-bar-f');
    const caret = x.el('<i class="code-caret"></i>');
    const panes = [...ed.querySelectorAll('.code-pane')].map((pane, fi) => {
      const L = open[fi][2];
      const src = pane.querySelector('.code-src');
      const code = L.map((text) => {
        const node = x.el('<div class="code-ln"></div>');
        const spans = colorLine(text).map(([c, t]) => { const s = x.el(`<span class="code-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
        src.appendChild(node);
        return { text, node, spans };
      });
      const TEXT = L.join('\n');
      // keystroke k -> characters shown: each stroke reveals one character, and a newline also drops in the next
      // line's indentation
      const at = [0];
      let c = 0;
      L.forEach((line, li) => {
        const ind = line.length - line.trimStart().length;
        if (li) { c += 1 + ind; at.push(c); } else c = ind;
        for (let j = ind; j < line.length; j++) { c += 1; at.push(c); }
      });
      const KEYS = at.length - 1;
      return { pane, scr: pane.querySelector('.code-scr'), code, TEXT, KEYS, at, cps: KEYS / (T.file[fi][1] - T.file[fi][0]) };
    });
    const STROKES = panes.reduce((s, p) => s + p.KEYS, 0);
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

        // the writing chip: spinner and a climbing line total, then a check and "Wrote 8 files"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;

        // the editor card rises in
        rise(ed, seg(t, T.card, T.card + 0.42), 14);

        // the open file is the last one whose window has opened (track.js until drift.js starts, and so on)
        let active = 0;
        T.file.forEach(([a], i) => { if (t >= a) active = i; });
        let typed = 0, here = [0, 0];
        const prog = panes.map((P, i) => {
          const [a, b] = T.file[i];
          const kn = clamp(Math.floor((t - a) * P.cps + 1e-6), 0, P.KEYS);
          typed += kn;
          const where = paint(P, P.at[kn]);
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
          return kn / P.KEYS;
        });
        caret.style.opacity = t >= T.code0 && t < T.done ? '1' : '0';

        // the explorer: each file counts its +lines across its window (an open file with its typing), then settles
        let sum = 0, oi = 0;
        erows.forEach((E, i) => {
          const [a, b] = T.row[i];
          const isOpen = !!S.files[i][2];
          const p = isOpen ? prog[oi++] : outCubic(seg(t, a, b));
          const c = S.files[i][1] * p;
          sum += c;
          const s = `+${num(c)}`;
          if (E.el.textContent !== s) E.el.textContent = s;
          E.r.classList.toggle('code-act', t >= a && t < b);
          E.r.classList.toggle('code-on', t >= b);
        });
        const cs = `${num(done ? TOTAL : sum)} lines`;
        if (ccount.textContent !== cs) ccount.textContent = cs;
        bar.style.transform = `scaleX(${Math.max(0.012, typed / STROKES).toFixed(4)})`;

        // the status strip: the current tool step, then Build OK; the caret's position on the right
        const step = done ? 'Build OK, dist/ 1.2 MB' : t >= T.check ? S.check : t >= T.code0 ? `Writing src/${open[active][0]}` : S.read;
        if (stt.textContent !== step) stt.textContent = step;
        st.classList.toggle('code-on', t >= T.check);
        st.classList.toggle('code-ok', done);
        const ps = `JavaScript  Ln ${here[0] + 1}, Col ${here[1] + 1}`;
        if (pos.textContent !== ps) pos.textContent = ps;
      },
    };
  },
};
