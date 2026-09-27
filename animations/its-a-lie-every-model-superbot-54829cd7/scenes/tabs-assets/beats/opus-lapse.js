// Opus step (last in the chain): Claude Opus 5.5 writes the engine as a sped-up agent run, in the coding panel's
// grammar the Minecraft ad (make-minecraft-every-model-superbot-b055c127, beats/opus-code.js) and pocketsflow-untold's
// opus-lapse.js use: tool rows, file-edit cards streaming green diff hunks with line numbers, collapsed Edited rows with
// a file-type badge, folder and +N -0, a terminal block running the tests, and a review bar. Under the card, chips wire
// in the other models' output (Nano Banana's atlas, Meshy's GLBs, ElevenLabs' sounds, Suno's loop), then the build and
// the dev server. The engine it writes: terrain generation (value noise, biomes), a chunk mesher (face culling), the
// atlas UVs, crafting recipes, trees, player controls.
// Helpers in beats/opus-kit.js. Icons: GitHub Octicons (repo-16, git-branch-16; MIT) and Lucide (check, terminal;
// ISC). The chip tiles are the official marks already in brand/ drawn through x.tile. The code in the hunks is written
// for this ad. Every moving value is a pure function of t: no Date, no rAF, no CSS animation or transition.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText } from './opus-kit.js?v=1';

const P = 0.9; // pace: the whole step runs ~1.85s after r
const SAY = 'Everything is in. Writing the engine: terrain, chunk mesher, crafting.';
const WORK = 734; // the replayed clock: 12m 14s of agent work in the lapse
const PROJECT = 'blockhaven';

const TERRAIN = `// terrain: layered value noise picks height and biome per column
import { noise2 } from './noise';
export const SEA = 28, SNOW = 58;
export function column(x: number, z: number) {
  const h = 32 + 18 * noise2(x / 96, z / 96) + 6 * noise2(x / 24, z / 24);
  const wet = noise2(x / 180 + 7, z / 180);
  const biome = h < SEA + 2 ? 'beach' : h > SNOW ? 'peaks' : wet > 0.2 ? 'forest' : 'plains';
  return { h: Math.floor(h), biome };
}
export function blockAt(y: number, c: Column): Block {
  if (y > c.h) return y <= SEA ? 'water' : 'air';
  if (y === c.h) return c.biome === 'beach' ? 'sand' : c.biome === 'peaks' ? 'snow' : 'grass';
  return y > c.h - 4 ? 'dirt' : 'stone';
}`;

const MESHER = `// chunk mesher: 16x16x128, emit only the faces that touch air
export function meshChunk(ch: Chunk, atlas: Atlas) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i < ch.blocks.length; i++) {
    const b = ch.blocks[i];
    if (b === AIR) continue;
    const [x, y, z] = ch.xyz(i);
    for (const f of FACES) {
      if (ch.solid(x + f.dx, y + f.dy, z + f.dz)) continue;
      const q = pos.length / 3;
      pushQuad(pos, x, y, z, f);
      pushUV(uv, atlas.tile(b, f.side));
      idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
    }
  }
  return { pos, uv, idx };
}`;

const CRAFT = `// crafting: shaped 3x3 recipes, matched anywhere in the grid
export const RECIPES: Recipe[] = [
  { out: ['planks', 4], shape: ['L'], keys: { L: 'oak_log' } },
  { out: ['stick', 4], shape: ['P', 'P'], keys: { P: 'planks' } },
  { out: ['crafting_table', 1], shape: ['PP', 'PP'], keys: { P: 'planks' } },
  { out: ['wooden_pickaxe', 1], shape: ['PPP', ' S ', ' S '],
    keys: { P: 'planks', S: 'stick' } },
];
export function craft(grid: Grid) {
  const g = trim(grid);
  return RECIPES.find((r) => matches(r, g))?.out ?? null;
}`;

const SCRIPT = [
  { k: 'row', v: 'Read', a: 'assets/atlas.json, models/, sfx/' },
  { k: 'card', f: 'world/terrain.ts', n: 186, src: TERRAIN },
  { k: 'edit', f: 'world/noise.ts', n: 74 },
  { k: 'card', f: 'render/chunk-mesher.ts', n: 214, src: MESHER },
  { k: 'edit', f: 'render/atlas.ts', n: 88 },
  { k: 'edit', f: 'world/trees.ts', n: 97 },
  { k: 'card', f: 'game/crafting.ts', n: 152, src: CRAFT },
  { k: 'edit', f: 'player/controls.ts', n: 163 },
  { k: 'edit', f: 'game/break-place.ts', n: 121 },
  { k: 'edit', f: 'audio/sfx.ts', n: 58 },
  { k: 'edit', f: 'ui/hotbar.ts', n: 92 },
  { k: 'edit', f: 'main.ts', n: 64 },
  { k: 'term', cmd: 'npm test' },
];
const TESTS = [
  ['$', 'npm test'],
  ['', ''],
  ['', `> ${PROJECT}@0.1.0 test`],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'world/terrain.test.ts', '(9 tests)', '21ms'],
  ['ok', 'render/chunk-mesher.test.ts', '(12 tests)', '34ms'],
  ['ok', 'game/crafting.test.ts', '(8 tests)', '6ms'],
  ['ok', 'player/controls.test.ts', '(7 tests)', '9ms'],
  ['', ''],
  ['sum', 'Test Files', '4 passed (4)'],
  ['sum', '     Tests', '36 passed (36)'],
];
const PASSED = '36 passed';
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0);

// transcript geometry in --u units (1px): the JS stacks the slots exactly
const LH = 17, BODY = 7, GAP = 6;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.3 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.3 };

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
  'this', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'typeof', 'extends', 'continue', 'while', 'break',
  'type', 'number']);
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
    // the chips under the card: the other models' output wired in, then the build, then the dev server
    T.c1 = T.done + 0.1 * P;
    T.c1s = [0, 0.05, 0.1, 0.15].map((d) => T.c1 + d * P);
    T.c2 = T.c1 + 0.16 * P; T.c2ok = T.c2 + 0.2 * P;
    T.c3 = T.c2 + 0.18 * P; T.c3ok = T.c3 + 0.14 * P;
    T.end = T.c3 + 0.32 * P;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY, 110);
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
      <div class="ocx-line ocx-l1">${chip(x.tile('nano'), '<b>12</b> textures')}${chip(x.tile('meshy'), '<b>3</b> GLBs')}${chip(x.tile('eleven'), '<b>3</b> sounds')}${chip(x.tile('suno'), '<b>1</b> loop')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>npm run build</code></span><span class="ocx-run"><i class="ocx-spin"></i>Running</span><span class="ocx-okw">${TICK}Success</span></span></div>
      <div class="ocx-line ocx-l3"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl">Running <b>BlockHaven</b> at <code>localhost:5173</code></span><span class="ocx-ok">${TICK}</span></span></div>
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
        say.render(t, T.r + 0.04);
        rise(card, seg(t, T.card, T.card + 0.25), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          const e = outCubic(seg(t, o.a, o.a + 0.1));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
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

        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * seg(t, T.card, T.done)));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('ocx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';

        rows.style.opacity = t >= T.c1 ? '1' : '0';
        l1chips.forEach((c, i) => { rise(c, seg(t, T.c1s[i], T.c1s[i] + 0.25), 8, 1); tick(oks[i], t, T.c1s[i] + 0.22); });
        rise(l2, seg(t, T.c2, T.c2 + 0.25), 8, 1);
        run2.style.opacity = (seg(t, T.c2, T.c2 + 0.1) * (1 - seg(t, T.c2ok - 0.08, T.c2ok + 0.02))).toFixed(3);
        run2.style.display = t >= T.c2ok + 0.02 ? 'none' : '';
        spin2.style.transform = `rotate(${((t - T.c2) * 420).toFixed(1)}deg)`;
        ok2.style.display = t >= T.c2ok ? '' : 'none';
        tick(ok2, t, T.c2ok);
        rise(l3, seg(t, T.c3, T.c3 + 0.25), 8, 1);
        tick(ok3, t, T.c3ok);
      },
    };
  },
};
