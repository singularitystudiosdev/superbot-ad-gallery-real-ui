// Claude Opus 5.5 writes the game: the repo "blockcraft" fills file by file (each row counting its lines), and three
// source files stream in one after another, the pane scrolling as it overflows, while the header's line total climbs.
// Line counts are made up.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText, fmt, REPO } from './kit.js';

const FILES = [
  ['engine/world.ts', 612], ['engine/chunk.ts', 488], ['engine/mesher.ts', 733], ['engine/noise.ts', 214],
  ['game/player.ts', 541], ['game/physics.ts', 397], ['render/renderer.ts', 902], ['ui/hotbar.ts', 268],
];
const TOTAL = FILES.reduce((s, [, n]) => s + n, 0);
const SRC = [
  [0, [
    'export class World {',
    '  chunks = new Map<string, Chunk>();',
    '  constructor(readonly seed: number) {}',
    '',
    '  generate(cx: number, cz: number) {',
    '    const c = new Chunk(cx, cz);',
    '    for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) {',
    '      const h = 62 + Math.floor(noise2(this.seed, cx * 16 + x, cz * 16 + z) * 12);',
    '      for (let y = 0; y <= h; y++)',
    '        c.set(x, y, z, y === h ? GRASS : y > h - 4 ? DIRT : STONE);',
    '      if (rand(x, z) < 0.012) plantTree(c, x, h + 1, z); // oak',
    '    }',
    '    this.chunks.set(`${cx},${cz}`, c);',
    '    return c;',
    '  }',
    '}',
  ]],
  [2, [
    'export function meshChunk(c: Chunk, atlas: Atlas) {',
    '  const verts: number[] = [], idx: number[] = [];',
    '  for (let y = 0; y < CHUNK_H; y++)',
    '    for (let z = 0; z < 16; z++)',
    '      for (let x = 0; x < 16; x++) {',
    '        const id = c.get(x, y, z);',
    '        if (id === AIR) continue;',
    '        for (const f of FACES) {',
    '          if (c.solid(x + f.dx, y + f.dy, z + f.dz)) continue;',
    '          const uv = atlas.uv(id, f.side); // 16x16 decal',
    '          pushQuad(verts, idx, x, y, z, f, uv);',
    '        }',
    '      }',
    '  return new Mesh(new Float32Array(verts), idx);',
    '}',
  ]],
  [4, [
    'export function updatePlayer(p: Player, input: Input, dt: number) {',
    '  p.yaw -= input.mouseX * SENS;',
    '  p.pitch = clamp(p.pitch - input.mouseY * SENS, -1.55, 1.55);',
    '  const wish = input.dir().rotateY(p.yaw).scale(p.sprint ? 5.6 : 4.3);',
    '  p.vel.x = wish.x; p.vel.z = wish.z;',
    '  p.vel.y -= GRAVITY * dt;',
    '  if (input.jump && p.onGround) p.vel.y = 8.4;',
    '  moveAndCollide(p, world, dt);',
    '  const hit = raycast(world, p.eye(), p.look(), 5);',
    '  if (hit && input.mine) breakBlock(world, hit.pos, p.hotbar);',
    '  if (hit && input.place) placeBlock(world, hit.face, p.hotbar.held());',
    '}',
  ]],
];
const VIS = 10, LH = 16;
const RX = /(\/\/.*$)|(`[^`]*`|"[^"]*"|'[^']*')|\b(export|async|function|const|let|await|for|of|if|continue|return|new|class|readonly|constructor|this)\b|\b(number|string|Map|Chunk|Mesh|Atlas|Player|Input|Math|Float32Array)\b|\b([A-Za-z_]\w*)(?=\()/g;
function hl(line, esc) {
  let out = '', i = 0;
  for (const m of line.matchAll(RX)) {
    out += esc(line.slice(i, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'y' : 'f';
    out += `<i class="tx-${cls}">${esc(m[0])}</i>`;
    i = m.index + m[0].length;
  }
  return out + esc(line.slice(i));
}

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.35 * p;
    T.file = FILES.map((_, i) => T.card + (0.3 + i * 0.16) * p);
    T.pane = SRC.map((_, i) => { const a = T.card + (0.55 + i * 0.95) * p; return [a, a + 0.88 * p]; });
    T.done = T.pane[SRC.length - 1][1] + 0.15 * p;
    T.end = T.done + 0.55 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.code);
    const card = x.el(`<div class="tt-card tt-code mc-code">
      <div class="tt-hd">${REPO}<b>blockcraft</b><span class="tt-br">main</span><span class="mc-lines">+0 lines</span><em class="tt-state"><i class="tt-spin"></i><span>Writing</span></em></div>
      <div class="tt-bd">
        <div class="tt-tree">${FILES.map(([f]) => `<div class="tt-f"><span>${f}</span><em>+0</em></div>`).join('')}</div>
        <div class="tt-src"><div class="tt-tab"></div><div class="tt-pre"></div></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.tt-f')].map((row) => ({ row, n: row.querySelector('em') }));
    const tab = $('.tt-tab'), pre = $('.tt-pre'), lines = $('.mc-lines');
    const state = $('.tt-state'), stateL = state.lastElementChild, spin = $('.tt-spin');
    // every file pre-built; one shows at a time, its lines typed by a clip that runs left to right
    const panes = SRC.map(([fi, src], pi) => {
      const pane = x.el(`<div class="tt-pane">${src.map((l) => `<div class="tt-ln"><span>${hl(l, x.esc) || ' '}</span></div>`).join('')}</div>`);
      pre.appendChild(pane);
      const [t0, t1] = T.pane[pi];
      const tot = src.reduce((s, l) => s + l.length + 6, 0);
      let acc = 0;
      const spans = [...pane.querySelectorAll('.tt-ln > span')].map((s, i) => {
        const a = t0 + (t1 - t0) * (acc / tot); acc += src[i].length + 6;
        return { s, a, b: t0 + (t1 - t0) * (acc / tot) };
      });
      return { pane, spans, fi };
    });
    // each file's lines count up from when its row lands, finishing with the build
    const grow = (i, t) => FILES[i][1] * outCubic(seg(t, T.file[i] + 0.1, T.done - 0.2 + i * 0.02));
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        const pi = Math.max(0, T.pane.reduce((c, [a], i) => (t >= a - 0.05 ? i : c), 0));
        setText(tab, FILES[SRC[pi][0]][0]);
        panes.forEach((p, i) => { p.pane.style.display = i === pi ? '' : 'none'; });
        const cur = panes[pi];
        let shift = 0;
        cur.spans.forEach(({ s, a, b }, i) => {
          const q = seg(t, a, b);
          s.style.clipPath = q >= 1 ? 'none' : `inset(0 ${((1 - q) * 100).toFixed(1)}% 0 0)`;
          if (i >= VIS) shift += LH * outCubic(seg(t, a, a + 0.12));
        });
        cur.pane.style.transform = shift ? `translateY(${(-shift).toFixed(2)}px)` : 'none';
        let sum = 0;
        rows.forEach(({ row, n }, i) => {
          rise(row, seg(t, T.file[i], T.file[i] + 0.3), 6, 1);
          const c = grow(i, t); sum += c;
          setText(n, `+${fmt(c)}`);
          row.classList.toggle('on', i === cur.fi && t >= T.pane[pi][0] && t < T.done);
        });
        const d = t >= T.done;
        setText(lines, `+${fmt(d ? TOTAL : sum)} lines`);
        state.classList.toggle('ok', d);
        setText(stateL, d ? `${FILES.length} files` : 'Writing');
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        state.style.transform = d ? `scale(${(1 + 0.1 * Math.sin(Math.PI * seg(t, T.done, T.done + 0.35))).toFixed(4)})` : 'none';
      },
    };
  },
};
