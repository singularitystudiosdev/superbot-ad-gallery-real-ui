// Claude Opus 5.5 writes the BlockHaven engine (chunk mesher, lighting, block breaking, crafting) as a sped-up replay
// of a real agent run, in the grammar of Cursor's agent panel
// (referent: Cursor changelog 1.7 demo video, changelog-1-7-0.mp4, and the 2.1 review video, changelog-2-1-1.mp4):
// "Thought for 3s" and "Read package.json" tool rows, file-edit cards whose green diff hunks of real JS stream past
// with line numbers, collapsed "Edited" rows, a terminal block running the tests to "37 passed", and the review bar
// "12 files changed +2,168 -0" with Undo all / Accept all / Review. The transcript is bottom-anchored inside a fixed
// viewport (CSS only), so every item that lands pushes the run up the way the real panel autoscrolls.
// Pure function of t: every item's slot, height and stream are computed from the schedule in times(); render() reads
// the clock and nothing else (no Math.random, no layout reads). Item heights are constants in --u units, so the
// stacking is exact at every column width.
import { seg, outCubic, outBack } from '../../../lib.js';
import { sayer, rise, setText, fmt, REPO, TICK, TERM, O_BRANCH } from './kit.js';

// ---- the code that flies past: plausible source for the engine the ask needs (mesher, lighting, breaking, crafting) ----
const MESHER = `import { CHUNK_SIZE, CHUNK_HEIGHT } from './chunk.js';
import { isOpaque, faceUV } from '../game/blocks.js';

export function buildMesh(chunk, world) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let y = 0; y < CHUNK_HEIGHT; y++)
    for (let z = 0; z < CHUNK_SIZE; z++)
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const id = chunk.get(x, y, z);
        if (!id) continue;
        for (const { dir, corners } of FACES) {
          const n = world.neighbor(chunk, x + dir[0], y + dir[1], z + dir[2]);
          if (isOpaque(n)) continue; // hidden face: never meshed
          const base = positions.length / 3;
          for (const [px, py, pz] of corners) positions.push(x + px, y + py, z + pz);
          uvs.push(...faceUV(id, dir));
          indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
  return { positions, normals, uvs, indices };
}`;
const LIGHT = `import { CHUNK_SIZE, CHUNK_HEIGHT } from './chunk.js';
import { isOpaque } from '../game/blocks.js';

// flood-fill light: sky light falls straight down, then spreads 15 -> 0
export function propagateLight(chunk) {
  const queue = [];
  for (let x = 0; x < CHUNK_SIZE; x++)
    for (let z = 0; z < CHUNK_SIZE; z++) {
      let y = CHUNK_HEIGHT - 1;
      while (y >= 0 && !isOpaque(chunk.get(x, y, z))) {
        chunk.setSky(x, y, z, 15);
        queue.push(x, y, z);
        y--;
      }
    }
  while (queue.length) {
    const z = queue.pop(), y = queue.pop(), x = queue.pop();
    const level = chunk.getSky(x, y, z) - 1;
    if (level <= 0) continue;
    for (const [dx, dy, dz] of NEIGHBORS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (isOpaque(chunk.get(nx, ny, nz)) || chunk.getSky(nx, ny, nz) >= level) continue;
      chunk.setSky(nx, ny, nz, level);
      queue.push(nx, ny, nz);
    }
  }
}`;
const BREAK = `import { BLOCK, hardness, toolSpeed, drops } from './blocks.js';
import { sfx } from '../audio/sfx.js';

// hold to mine: ten crack stages, then the block pops and drops its item
export function updateBreaking(state, player, world, dt) {
  const hit = player.target; // raycast result, or null
  if (!hit || !player.input.attack) {
    state.progress = 0;
    return null;
  }
  if (!state.pos || !samePos(state.pos, hit.pos)) {
    state.pos = hit.pos;
    state.progress = 0;
  }
  const id = world.get(...hit.pos);
  state.progress += (toolSpeed(player.held, id) / hardness(id)) * dt;
  state.stage = Math.min(9, Math.floor(state.progress * 10)); // destroy_stage_0..9
  if (state.stage % 2 === 0) sfx.play(id === BLOCK.OAK_LOG ? 'wood_chop' : 'grass_step');
  if (state.progress < 1) return null;
  world.set(...hit.pos, BLOCK.AIR);
  sfx.play('block_pop');
  state.progress = 0;
  return spawnItem(drops(id), hit.pos);
}`;
const CRAFT = `// shaped recipes on a 3x3 grid, matched wherever they sit in it
export const RECIPES = [
  { out: ['oak_planks', 4], shape: ['L'], keys: { L: 'oak_log' } },
  { out: ['stick', 4], shape: ['P', 'P'], keys: { P: 'oak_planks' } },
  { out: ['crafting_table', 1], shape: ['PP', 'PP'], keys: { P: 'oak_planks' } },
  { out: ['wooden_pickaxe', 1], shape: ['PPP', ' S ', ' S '], keys: { P: 'oak_planks', S: 'stick' } },
];

export function craft(grid) {
  const box = trim(grid); // drop the empty rows and columns
  for (const r of RECIPES) {
    if (r.shape.length !== box.length || r.shape[0].length !== box[0].length) continue;
    const ok = r.shape.every((row, y) =>
      [...row].every((c, x) => (c === ' ' ? !box[y][x] : box[y][x] === r.keys[c])));
    if (ok) return { item: r.out[0], count: r.out[1] };
  }
  return null;
}`;
const TESTS = [
  ['$', 'npm test'],
  ['', '> blockhaven@0.1.0 test'],
  ['', '> vitest run'],
  ['', ''],
  ['ok', 'engine/mesher.test.js', '(8 tests)', '21ms'],
  ['ok', 'engine/lighting.test.js', '(7 tests)', '9ms'],
  ['ok', 'engine/world.test.js', '(7 tests)', '12ms'],
  ['ok', 'game/breaking.test.js', '(9 tests)', '5ms'],
  ['ok', 'game/crafting.test.js', '(6 tests)', '4ms'],
  ['', ''],
  ['sum', 'Test Files', '5 passed (5)'],
  ['sum', '     Tests', '37 passed (37)'],
];
const PASSED = '37 passed';

// ---- the run: what lands, in order (it reads the textures and sounds the earlier models made) ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 3s' },
  { k: 'row', v: 'Read', a: 'assets/textures/' },
  { k: 'row', v: 'Read', a: 'assets/models/ assets/sfx/' },
  { k: 'card', f: 'engine/mesher.js', n: 248, src: MESHER },
  { k: 'edit', f: 'engine/chunk.js', n: 242 },
  { k: 'card', f: 'engine/lighting.js', n: 186, src: LIGHT },
  { k: 'edit', f: 'engine/world.js', n: 262 },
  { k: 'card', f: 'game/breaking.js', n: 154, src: BREAK },
  { k: 'edit', f: 'game/blocks.js', n: 166 },
  { k: 'card', f: 'game/crafting.js', n: 132, src: CRAFT },
  { k: 'edit', f: 'game/player.js', n: 220 },
  { k: 'edit', f: 'render/webgl.ts', n: 300 },
  { k: 'edit', f: 'audio/sfx.js', n: 64 },
  { k: 'edit', f: 'ui/hotbar.js', n: 98 },
  { k: 'edit', f: 'main.js', n: 96 },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  { k: 'term', cmd: 'npm test' },
];
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((s, f) => s + f.n, 0); // 2,168
// seconds at pace 1: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP)
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.34 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.34 };
// heights in --u units (1px at narrow columns, a bit more on wide ones); GAP rides inside each item's slot
const BODY = 7, LH = 17; // a code/terminal body shows 7 lines of 17
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const GAP = 6;
const WORK = 412; // the elapsed clock the run replays, in seconds (6m 52s)

// ---- a small highlighter, run once at build: comments, strings, numbers, keywords, calls, types, members ----
const KW = new Set('import export from const let var function return for of if else continue new class constructor private this true false null while break'.split(' '));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g;
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

const ext = (f) => (f.endsWith('.ts') ? 'ts' : 'js');
const fileIco = (f) => `<b class="mcx-fi ${ext(f)}">${ext(f).toUpperCase()}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="mcx-add">+${fmt(n)}</span><span class="mcx-del">-0</span>`;
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="mcx-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') {
    return `<div class="mcx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  }
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="mcx-card">
      <div class="mcx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="mcx-add">+0</span><span class="mcx-del">-0</span></em></div>
      <div class="mcx-bd"><div class="mcx-lines">${lines.map((l, i) => `<div class="mcx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block
  const tl = TESTS.map(([kind, a, b, c]) => {
    if (kind === '$') return `<div class="mcx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="mcx-l"><code> <i class="ok">&#10003;</i> ${esc(a)} <i class="dim">${esc(b)} ${esc(c)}</i></code></div>`;
    if (kind === 'sum') return `<div class="mcx-l"><code><i class="dim">${esc(a)}</i>  <i class="ok">${esc(b)}</i></code></div>`;
    return `<div class="mcx-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="mcx-term">
    <div class="mcx-ch">${TERM}<b class="mcx-tv">Running</b><span class="mcx-cmd">${esc(s.cmd)}</span><em class="mcx-tst"><i class="mcx-spin"></i><span></span></em></div>
    <div class="mcx-bd"><div class="mcx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.08 * p;
    let at = T.card + 0.1 * p;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] * p }; at += STEP[s.k] * p; return o; });
    T.done = T.items[T.items.length - 1].b + 0.04 * p; // the tests pass: review bar live, Done
    T.end = T.done + 0.42 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.code);
    const card = x.el(`<div class="mcx">
      <div class="mcx-hd">
        <span class="mcx-repo">${REPO}<b>blockhaven</b></span><span class="mcx-br">${O_BRANCH}main</span>
        <em class="mcx-state"><i class="mcx-spin"></i>${TICK}<span class="mcx-sl">Working</span><span class="mcx-clk">0m 00s</span></em>
      </div>
      <div class="mcx-vp"><div class="mcx-stk">${SCRIPT.map((s) => `<div class="mcx-it">${itemHTML(s)}</div>`).join('')}<div class="mcx-sp"></div></div></div>
      <div class="mcx-ft">
        <span class="mcx-sum"><svg class="mcx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="mcx-nf">0 files</b><span class="mcx-add">+0</span><span class="mcx-del">-0</span></span>
        <span class="mcx-btns"><i class="mcx-b">Undo all</i><i class="mcx-b mcx-pri">Accept all</i><i class="mcx-b">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (see mc-code.css): the card's content width against the same
    // thresholds, re-read only when the card resizes; a hidden card (0 wide) keeps its last classes
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('mcx-wide', w >= 760); card.classList.toggle('mcx-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.mcx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1, st: '' };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.mcx-l')];
        o.box = n.querySelector('.mcx-lines');
        o.shown = -1;
        o.add = n.querySelector('.mcx-ch .mcx-add');
      }
      if (s.k === 'term') { o.tv = n.querySelector('.mcx-tv'); o.tst = n.querySelector('.mcx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.mcx-state'), stateL = $('.mcx-sl'), clk = $('.mcx-clk'), spin = $('.mcx-hd .mcx-spin'), stTk = state.querySelector('.mc-tk');
    const nf = $('.mcx-nf'), fAdd = $('.mcx-ft .mcx-add'), ft = $('.mcx-ft'), pri = $('.mcx-pri');

    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.2), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + 0.07));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it also scrolls its 6-unit top padding away, so no sliver of a line peeks under the header
            const over = Math.max(0, nf2 - BODY);
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            const live = t >= o.a && t < o.b;
            o.n.classList.toggle('live', live);
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

        // header: the replayed elapsed clock races while Working, then Worked for 6m 52s with a tick
        const w = seg(t, T.card, T.done);
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * w));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('mcx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
