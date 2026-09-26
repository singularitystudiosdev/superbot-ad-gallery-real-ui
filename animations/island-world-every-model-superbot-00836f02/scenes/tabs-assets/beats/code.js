// Code beat: the agent writes the island's source files. The tool chip counts the lines while it works, each file
// pill lands and counts its own lines before settling lit, and a small editor card types in the head of the first
// file with syntax colouring. opts.set picks the file set: 'terrain' | 'water' | 'controls' (default 'terrain').
// Pure function of t (the tab scene's local time) so ?t= freezes a frame.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';

// the ask is "build me an interactive 3D island world": terrain and foliage, the GLSL water, the walk-around controls
const SETS = {
  terrain: {
    say: 'Writing the terrain and foliage.',
    files: [
      ['src/world/terrain.ts', 364],
      ['src/world/foliage.ts', 241],
      ['src/world/village.ts', 198],
      ['src/world/sky.ts', 126],
      ['src/main.ts', 88],
    ],
    head: [
      "import { createNoise2D } from 'simplex-noise';",
      '',
      'const noise = createNoise2D();',
      '',
      'export class Island {',
      '  size = 512;',
      '  height(x: number, z: number) {',
    ].join('\n'),
  },
  water: {
    say: 'Writing the water shader.',
    files: [
      ['src/shaders/water.frag.glsl', 162],
      ['src/shaders/water.vert.glsl', 94],
      ['src/shaders/foam.glsl', 58],
      ['src/world/water.ts', 131],
    ],
    head: [
      'uniform float uTime;',
      'uniform vec3 uShallow;',
      'uniform vec3 uDeep;',
      'varying vec2 vUv;',
      '',
      'void main() {',
      '  float depth = texture2D(uDepth, vUv).r;',
    ].join('\n'),
  },
  controls: {
    say: 'Wiring up the controls.',
    files: [
      ['src/player/controls.ts', 212],
      ['src/player/camera.ts', 147],
      ['src/world/interact.ts', 176],
      ['src/ui/hud.tsx', 119],
    ],
    head: [
      "import { PointerLockControls } from 'three/addons';",
      '',
      'export class Player {',
      '  speed = 4.2;',
      '  jumpForce = 6;',
      '  move(dt: number, keys: Set<string>) {',
      '    const dir = this.forward(keys);',
    ].join('\n'),
  },
};

const KEYWORDS = new Set(['import', 'from', 'export', 'class', 'const', 'new', 'readonly', 'return', 'this', 'as', 'let', 'function', 'extends', 'interface', 'type', 'enum', 'if', 'else', 'uniform', 'varying', 'void']);
const TYPES = new Set(['string', 'number', 'boolean', 'Map', 'Set', 'Float32Array', 'Island', 'Player', 'PointerLockControls', 'float', 'vec2', 'vec3', 'vec4']);
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
  times(r) {
    const T = { r };
    T.chip = r + 0.18;
    // room for the widest set (five files); a shorter set simply finishes its list earlier
    T.file = [0, 1, 2, 3, 4].map((i) => r + 0.42 + i * 0.3);
    T.ed = r + 0.6;
    T.code0 = r + 0.95;   // the editor card starts typing
    T.code1 = r + 2.15;   // ... and lands its last character here
    T.done = r + 2.35;    // the chip resolves: Wrote N files
    T.end = r + 3.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = SETS[(k.opts && k.opts.set) || 'terrain'] || SETS.terrain;
    const N = S.files.length;
    const TOTAL = S.files.reduce((s, [, n]) => s + n, 0);
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing code</span><b class="code-count">0 lines</b></div></div>');
    const files = x.el(`<div class="code-files">${S.files.map(([p]) => `<span class="code-file"><span class="code-fname">${x.esc(p)}</span><b>0</b></span>`).join('')}</div>`);
    const lines = S.head.split('\n');
    const ed = x.el(`<div class="code-ed">
      <div class="code-ed-hd"><span class="code-dots"><i></i><i></i><i></i></span><span class="code-path">${x.esc(S.files[0][0])}</span><span class="code-ed-n">${num(S.files[0][1])} lines</span></div>
      <div class="code-ed-bd"><div class="code-gut">${lines.map((_, i) => `<i>${i + 1}</i>`).join('')}</div><pre class="code-src"></pre></div>
    </div>`);
    const src = ed.querySelector('.code-src');
    const caret = x.el('<i class="code-caret"></i>');
    const code = lines.map((text) => {
      const node = x.el('<div class="code-ln"></div>');
      const spans = colorLine(text).map(([c, t]) => { const s = x.el(`<span class="code-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
      src.appendChild(node);
      return { text, node, spans };
    });
    const CODE = lines.join('\n');
    const cps = CODE.length / Math.max(0.2, T.code1 - T.code0);
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const pills = [...files.children].map((p) => ({ p, b: p.querySelector('b') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, shownCode = -1;

    // reveal the first n characters of the snippet, put the caret after the last one revealed
    const paint = (n) => {
      let acc = 0, placed = false;
      code.forEach((L) => {
        const start = acc, len = L.text.length;
        let used = 0;
        L.spans.forEach(({ s, t }) => {
          const take = clamp(n - (start + used), 0, t.length);
          if (s.textContent.length !== take) s.textContent = t.slice(0, take);
          used += t.length;
        });
        if (!placed && n <= start + len) {
          let c0 = 0, done = false;
          for (const { s, t } of L.spans) {
            if (n < c0 + t.length) { L.node.insertBefore(caret, n === c0 ? s : s.nextSibling); done = true; break; }
            c0 += t.length;
          }
          if (!done) L.node.appendChild(caret);
          placed = true;
        }
        acc = start + len + 1;
      });
      if (!placed && code.length) code[code.length - 1].node.appendChild(caret);
    };

    return {
      nodes: [say, chip, files, ed],
      marks: [[T.r, say], [T.chip, chip], [T.file[0], files], [T.ed, ed]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the writing chip: spinner and a climbing line count, then a check and "Wrote N files"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : 'Writing code';
        if (clab.textContent !== cl) clab.textContent = cl;

        // the file list: each pill lands, counts up its lines, then settles lit
        let sum = 0;
        files.style.opacity = t >= T.file[0] - 0.05 ? '1' : '0';
        pills.forEach(({ p, b }, i) => {
          const a = T.file[i];
          rise(p, seg(t, a, a + 0.28), 6);
          const c = S.files[i][1] * outCubic(seg(t, a + 0.05, a + 0.5));
          sum += c;
          const s = num(c);
          if (b.textContent !== s) b.textContent = s;
          p.classList.toggle('on', t >= a + 0.5);
        });
        const cs = `${num(done ? TOTAL : sum)} lines`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // the editor card: the head of the first file types in under a caret
        rise(ed, seg(t, T.ed, T.ed + 0.45), 12);
        const cn = streamCount(CODE, T.code0, cps, t);
        if (cn !== shownCode) { paint(cn); shownCode = cn; }
        caret.style.opacity = t >= T.code0 && t <= T.code1 + 0.5 ? '1' : '0';
      },
    };
  },
};