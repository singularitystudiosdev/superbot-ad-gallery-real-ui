// v4 Opus step (last in the chain): Claude Opus writes the Pocketsflow launch film's codebase as a sped-up agent run,
// in the coding panel's grammar the Minecraft ad (make-minecraft-every-model-superbot-b055c127, beats/opus-code.js +
// beats/opus-ship.js) uses: tool rows, file-edit cards streaming green diff hunks with line numbers, collapsed Edited
// rows with a file-type badge (TSX, TS, GL), folder and +N -0, a terminal block running the tests, and a review bar
// (Undo all / Accept all / Review). Under the card, chips wire in the other models' output (Meshy meshes, Hailuo
// clips, ElevenLabs tracks), the build and the push. The film it writes: 7 scenes (hook, sell, products, store,
// checkout, payouts, end card), a halftone pass, spring presets and a timecode burn-in.
// Ported into this ad (helpers in beats/opus-kit.js), never imported across ad folders.
// Sources and licenses: no raster imagery. Icons are GitHub Octicons (repo-16, git-branch-16; MIT,
// github.com/primer/octicons) and Lucide (check, terminal; ISC, lucide.dev). The chip tiles are the official app marks
// already in brand/ (meshy-logo.svg, minimax-logo.svg, elevenlabs-logo.svg; provenance in brand/CREDITS.txt and the
// header comments of beats/meshy.js, beats/hailuo.js), drawn through x.tile. The code in the hunks is written for this
// ad. Every moving value is a pure function of t: no Date, no rAF, no CSS animation or transition.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText } from './opus-kit.js?v=1';

const P = 1.5; // pace: the whole step runs ~3.95s after r
const SAY = 'Assets are in. Cutting the launch film: 7 scenes, halftone pass, timecode.';
const WORK = 897; // the replayed clock: 14m 57s of work in the lapse ("did this in 15 minutes")
const PROJECT = 'pocketsflow-launch';

const HOOK = `// 01 hook: the mascot leans in, the bubble pops on the beat
import { spring, POP } from '../motion/springs';
import { Halftone } from '../fx/Halftone';
export const HOOK = { from: 0, frames: 66, label: '// 01 - hook' };
export function Hook({ frame }: SceneProps) {
  const lean = spring(frame, POP);
  const pop = spring(frame - 9, POP);
  return (
    <Halftone cell={3.2} ink="#141414" paper="#ffffff">
      <Mascot pose="lean" y={lerp(40, 0, lean)} />
      <Bubble scale={pop} text="pssst..." />
    </Halftone>
  );
}`;

const HALFTONE = `// halftone pass: a rotated dot grid, dot size follows luma
uniform sampler2D uFrame;
uniform vec2 uRes;
uniform vec3 uInk, uPaper;
uniform float uCell;  // dot pitch in px
uniform float uAngle; // screen angle, 45deg
varying vec2 vUv;
void main() {
  mat2 rot = mat2(cos(uAngle), sin(uAngle), -sin(uAngle), cos(uAngle));
  vec2 cell = fract(rot * (vUv * uRes) / uCell) - 0.5;
  float luma = dot(texture2D(uFrame, vUv).rgb, vec3(0.299, 0.587, 0.114));
  float r = sqrt(1.0 - luma) * 0.62;
  float ink = 1.0 - smoothstep(r - 0.04, r + 0.04, length(cell));
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}`;

const PRODUCTS = `// 03 products: three cards fly in on blue, 6 frames apart
export const PRODUCTS = [
  { kind: 'course', title: 'Courses', price: '$149', mesh: 'laptop.glb' },
  { kind: 'ebook', title: 'Ebooks', price: '$29', mesh: 'ebooks.glb' },
  { kind: 'app', title: 'Apps', price: '$4.99/mo', mesh: 'apps.glb' },
];
export function Products({ frame }: SceneProps) {
  return (
    <Stage bg="#2f6bff" label="// 03 - products">
      {PRODUCTS.map((p, i) => (
        <Card key={p.kind} {...p} enter={spring(frame - i * 6, FLY)} />
      ))}
    </Stage>
  );
}`;

const SPRINGS = `// spring presets: every scene moves on one of these four
export type Spring = { stiffness: number; damping: number; mass: number };
export const POP: Spring = { stiffness: 320, damping: 14, mass: 0.8 };
export const FLY: Spring = { stiffness: 180, damping: 22, mass: 1 };
export const SETTLE: Spring = { stiffness: 120, damping: 26, mass: 1.2 };
export const WHOOSH: Spring = { stiffness: 420, damping: 30, mass: 0.6 };
export function spring(frame: number, s: Spring, fps = 30) {
  if (frame <= 0) return 0;
  const t = frame / fps, w = Math.sqrt(s.stiffness / s.mass);
  const z = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
  const wd = w * Math.sqrt(Math.max(0.0001, 1 - z * z));
  return 1 - Math.exp(-z * w * t) * Math.cos(wd * t);
}`;

const TIMECODE = `// timecode burn-in: the brand, then HH:MM:SS:FF at 30fps
export const FPS = 30;
const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
export function tc(frame: number) {
  const s = Math.floor(frame / FPS);
  return [s / 3600, (s / 60) % 60, s % 60, frame % FPS].map(pad).join(':');
}
export function Timecode({ frame }: { frame: number }) {
  return <Mono corner="top-left">POCKETSFLOW {tc(frame)}</Mono>;
}
// frame 20 burns in 'POCKETSFLOW 00:00:00:20'`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '3s' },
  { k: 'row', v: 'Read', a: 'assets/manifest.json' },
  { k: 'row', v: 'Listed', a: 'models/, clips/, audio/' },
  { k: 'card', f: 'scenes/01-hook.tsx', n: 164, src: HOOK },
  { k: 'card', f: 'fx/halftone.glsl', n: 118, src: HALFTONE },
  { k: 'edit', f: 'scenes/02-sell.tsx', n: 137 },
  { k: 'card', f: 'scenes/03-products.tsx', n: 212, src: PRODUCTS },
  { k: 'edit', f: 'scenes/04-store.tsx', n: 186 },
  { k: 'card', f: 'motion/springs.ts', n: 96, src: SPRINGS },
  { k: 'edit', f: 'scenes/05-checkout.tsx', n: 241 },
  { k: 'edit', f: 'scenes/06-payouts.tsx', n: 173 },
  { k: 'card', f: 'render/timecode.tsx', n: 88, src: TIMECODE },
  { k: 'edit', f: 'scenes/07-endcard.tsx', n: 119 },
  { k: 'edit', f: 'audio/mix.ts', n: 104 },
  { k: 'edit', f: 'render/export.ts', n: 92 },
  { k: 'edit', f: 'fx/grain.glsl', n: 47 },
  { k: 'edit', f: 'Film.tsx', n: 76 },
  { k: 'row', v: 'Thought for', a: '1s' },
  { k: 'term', cmd: 'npm test' },
];
const TESTS = [
  ['$', 'npm test'],
  ['', ''],
  ['', `> ${PROJECT}@0.1.0 test`],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'scenes/01-hook.test.tsx', '(6 tests)', '14ms'],
  ['ok', 'scenes/03-products.test.tsx', '(9 tests)', '18ms'],
  ['ok', 'scenes/06-payouts.test.tsx', '(7 tests)', '11ms'],
  ['ok', 'render/timecode.test.ts', '(8 tests)', '5ms'],
  ['ok', 'fx/halftone.test.ts', '(6 tests)', '22ms'],
  ['ok', 'motion/springs.test.ts', '(11 tests)', '7ms'],
  ['', ''],
  ['sum', 'Test Files', '6 passed (6)'],
  ['sum', '     Tests', '47 passed (47)'],
];
const PASSED = '47 passed';
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 1,853

// transcript geometry in --u units (1px): the JS stacks the slots exactly, like the referent
const LH = 17, BODY = 7, GAP = 6;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.34 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.34 };

// JS/TS keywords plus the GLSL qualifiers and types the shader hunk uses
const KW = new Set(['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
  'this', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'typeof', 'extends', 'constructor', 'while', 'break',
  'type', 'uniform', 'varying', 'void', 'float', 'vec2', 'vec3', 'vec4', 'mat2', 'sampler2D']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*")|(\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/gi;
  let out = '', m, prev = '';
  while ((m = re.exec(src))) {
    const [tok, cm, str, num, id, ws] = m;
    if (cm) out += `<i class="c">${esc(cm)}</i>`;
    else if (str) out += `<i class="s">${esc(str)}</i>`;
    else if (num) out += `<i class="n">${esc(num)}</i>`;
    else if (id) {
      const next = src.slice(re.lastIndex).trimStart()[0];
      const cls = KW.has(id) ? 'k' : next === '(' ? 'f' : /^[A-Z][A-Z0-9_]+$/.test(id) ? 'n' : /^[A-Z]/.test(id) ? 't' : prev === '.' ? 'p' : '';
      out += cls ? `<i class="${cls}">${esc(id)}</i>` : esc(id);
    } else out += esc(tok);
    if (!ws) prev = tok;
  }
  return out;
}

const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; };
// the file-type badge: TSX / TS in TypeScript blue, GL (shaders) in violet, JS in the referent's yellow
const BADGE = { tsx: ['TSX', 'ts'], ts: ['TS', 'ts'], glsl: ['GL', 'gl'], js: ['JS', ''] };
const fileIco = (f) => { const [lab, cls] = BADGE[f.split('.').pop()] || BADGE.js; return `<b class="ocx-fi${cls ? ` ocx-fi-${cls}` : ''}">${lab}</b>`; };
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="ocx-add">+${fmt(n)}</span><span class="ocx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="ocx-row"><span>${esc(s.v)}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="ocx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="ocx-card">
      <div class="ocx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="ocx-add">+0</span><span class="ocx-del">-0</span></em></div>
      <div class="ocx-bd"><div class="ocx-lines">${lines.map((l, i) => `<div class="ocx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  const tl = TESTS.map(([kind, a, b, c]) => {
    if (kind === '$') return `<div class="ocx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="ocx-l"><code> <i class="ok">&#10003;</i> ${esc(a)} <i class="dim">${esc(b)} ${esc(c)}</i></code></div>`;
    if (kind === 'sum') return `<div class="ocx-l"><code><i class="dim">${esc(a)}</i>  <i class="ok">${esc(b)}</i></code></div>`;
    return `<div class="ocx-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="ocx-term">
    <div class="ocx-ch">${TERM}<b class="ocx-tv">Running</b><span class="ocx-cmd">${esc(s.cmd)}</span><em class="ocx-tst"><i class="ocx-spin"></i><span></span></em></div>
    <div class="ocx-bd"><div class="ocx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08 * P;
    let at = T.card + 0.1 * P;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] * P }; at += STEP[s.k] * P; return o; });
    T.done = T.items[T.items.length - 1].b + 0.04 * P; // the tests pass: review bar live, Worked for
    // the chips under the card: the other models' output wired in, then the build, then the push
    T.c1 = T.done + 0.14 * P;
    T.c1s = [0, 0.06, 0.12].map((d) => T.c1 + d * P);
    T.c2 = T.c1 + 0.18 * P; T.c2ok = T.c2 + 0.24 * P;
    T.c3 = T.c2 + 0.2 * P; T.c3ok = T.c3 + 0.16 * P;
    T.end = T.c3 + 0.3 * P;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="ocx">
      <div class="ocx-hd">
        <span class="ocx-repo">${REPO}<b>${PROJECT}</b></span><span class="ocx-br">${O_BRANCH}main</span>
        <em class="ocx-state"><i class="ocx-spin"></i>${TICK}<span class="ocx-sl">Working</span><span class="ocx-clk">0m 00s</span></em>
      </div>
      <div class="ocx-vp"><div class="ocx-stk">${SCRIPT.map((s) => `<div class="ocx-it">${itemHTML(s)}</div>`).join('')}<div class="ocx-sp"></div></div></div>
      <div class="ocx-ft">
        <span class="ocx-sum"><svg class="ocx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="ocx-nf">0 files</b><span class="ocx-add">+0</span><span class="ocx-del">-0</span></span>
        <span class="ocx-btns"><i class="ocx-b">Undo all</i><i class="ocx-b ocx-pri">Accept all</i><i class="ocx-b">Review</i></span>
      </div>
    </div>`);
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1">${chip(x.tile('meshy'), 'Imported <b>mascot.glb</b> + 3 props')}${chip(x.tile('hailuo'), '<b>4</b> clips')}${chip(x.tile('eleven'), '<b>3</b> tracks')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>npm run build</code></span><span class="ocx-run"><i class="ocx-spin"></i>Running</span><span class="ocx-okw">${TICK}Success</span></span></div>
      <div class="ocx-line ocx-l3"><span class="ocx-chip ocx-wide"><span class="ocx-si">${O_BRANCH}</span><span class="ocx-cl">Pushed to <b>sam/${PROJECT}</b> <code>main</code> <span class="ocx-dim">· 3 commits</span></span><span class="ocx-ok">${TICK}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const items = [...card.querySelectorAll('.ocx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.ocx-l')];
        o.box = n.querySelector('.ocx-lines');
        o.shown = -1;
        o.add = n.querySelector('.ocx-ch .ocx-add');
      }
      if (s.k === 'term') { o.tv = n.querySelector('.ocx-tv'); o.tst = n.querySelector('.ocx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.ocx-state'), stateL = $('.ocx-sl'), clk = $('.ocx-clk'), spin = $('.ocx-hd .ocx-spin'), stTk = state.querySelector('.ocx-tk');
    const nf = $('.ocx-nf'), fAdd = $('.ocx-ft .ocx-add'), ft = $('.ocx-ft'), pri = $('.ocx-pri');
    const l1chips = [...rows.querySelectorAll('.ocx-l1 .ocx-chip')];
    const l2 = rows.querySelector('.ocx-l2 .ocx-chip'), l3 = rows.querySelector('.ocx-l3 .ocx-chip');
    const run2 = l2.querySelector('.ocx-run'), ok2 = l2.querySelector('.ocx-okw'), spin2 = run2.firstElementChild;
    // a chip's tick pops in with a small overshoot once its work lands
    const tick = (ok, t, t0) => {
      const q = seg(t, t0, t0 + 0.2);
      ok.style.opacity = seg(t, t0, t0 + 0.1).toFixed(3);
      ok.style.transform = q >= 1 ? 'none' : `scale(${(0.5 + 0.5 * outBack(q)).toFixed(3)})`;
    };
    const oks = l1chips.map((c) => c.querySelector('.ocx-ok'));
    const ok3 = l3.querySelector('.ocx-ok');

    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say.node, card, rows],
      marks: [[T.r, say.node], [T.card, card], [T.c1, rows]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.25), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up the bottom-anchored viewport
          const e = outCubic(seg(t, o.a, o.a + 0.1));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it scrolls, and its top padding goes with it so no sliver peeks under the header
            const over = Math.max(0, nf2 - BODY);
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.k === 'card') {
              const nl = s.n * seg(t, o.a, o.b);
              setText(o.add, `+${fmt(nl)}`);
              lines += nl; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? PASSED : '');
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: the replayed clock races while Working, then Worked for 14m 57s with a tick
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * seg(t, T.card, T.done)));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('ocx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';

        // chips: each rises in, then its tick lands; the build spinner resolves into Success
        rows.style.opacity = t >= T.c1 ? '1' : '0';
        l1chips.forEach((c, i) => { rise(c, seg(t, T.c1s[i], T.c1s[i] + 0.3), 8, 1); tick(oks[i], t, T.c1s[i] + 0.27); });
        rise(l2, seg(t, T.c2, T.c2 + 0.3), 8, 1);
        run2.style.opacity = (seg(t, T.c2, T.c2 + 0.1) * (1 - seg(t, T.c2ok - 0.08, T.c2ok + 0.02))).toFixed(3);
        run2.style.display = t >= T.c2ok + 0.02 ? 'none' : '';
        spin2.style.transform = `rotate(${((t - T.c2) * 420).toFixed(1)}deg)`;
        ok2.style.display = t >= T.c2ok ? '' : 'none';
        tick(ok2, t, T.c2ok);
        rise(l3, seg(t, T.c3, T.c3 + 0.3), 8, 1);
        tick(ok3, t, T.c3ok);
      },
    };
  },
};
