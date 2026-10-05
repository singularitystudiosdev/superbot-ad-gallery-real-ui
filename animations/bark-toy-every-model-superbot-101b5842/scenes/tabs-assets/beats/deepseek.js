// DeepSeek V4 Flash — the scrape. Its job: read a logged-out profile wall, open the reels, and come back with
// the media. The thread shows the two tool rows; the pane shows @biscuit.loaf's grid being walked, the wall it
// reads through, and the counters doing the talking (312 posts, 41 reels, 37s of barking).
import { seg, outCubic, lerp, streamCount, outBack } from '../../../lib.js';

const SAY = 'Read the profile wall logged out: 312 posts, 41 reels, 37s of barking in them.';
const ROWS = [
  ['Reading @biscuit.loaf', 'Read 312 posts · 41 reels'],
  ['Opening the reels behind the wall', 'Opened all 41 · 37s of barking'],
];
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.rows = [r + 0.15, r + 0.75];
    T.rowsDone = [r + 0.8, r + 1.55];
    T.grid = [r + 0.35, r + 1.9];
    T.count = [r + 0.5, r + 2.1];
    T.wall = r + 1.25;
    T.wallSwap = r + 1.9;
    T.pointer = [r + 0.35, r + 1.6];
    T.end = r + 2.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));

    const v = x.pane.el('ig');
    const grid = v.querySelector('.ig-grid');
    const cells = [...v.querySelectorAll('.ig-cell')];
    const lv = [x.pane.q('ig', '#ig-c1'), x.pane.q('ig', '#ig-c2'), x.pane.q('ig', '#ig-c3')];
    const wall = x.pane.q('ig', '.ig-wall');
    const grip = x.pane.q('ig', '.ig-wall s');
    const wallDot = x.pane.q('ig', '.ig-wall .pg');
    const posts = [312, 41, 37];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.rows[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 105, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.rows[i], T.rows[i] + 0.32), 8);
          const done = t >= T.rowsDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.rows[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? ROWS[i][1] : ROWS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // pane: the scan walks the grid tile by tile, a read badge lands on each, two of them are marked "bark"
        const gp = seg(t, T.grid[0], T.grid[1]);
        cells.forEach((cell, i) => {
          const a = T.grid[0] + (i / cells.length) * 1.3;
          const p = outCubic(seg(t, a, a + 0.3));
          cell.style.opacity = (0.45 + 0.55 * p).toFixed(3);
          cell.classList.toggle('dim', p < 1);
          const scan = cell.querySelector('.ig-scan');
          const sp = seg(t, a, a + 0.42);
          scan.style.opacity = (sp > 0 && sp < 1 ? Math.sin(Math.PI * sp) : 0).toFixed(3);
          scan.style.transform = `translateY(${lerp(-100, 100, sp).toFixed(1)}%)`;
          const tag = cell.querySelector('.ig-tag');
          const isBark = i === 1 || i === 4;
          const tp = outBack(seg(t, a + (isBark ? 0.3 : 0.16), a + (isBark ? 0.6 : 0.4)));
          tag.style.opacity = (isBark ? seg(t, a + 0.28, a + 0.5) : 0).toFixed(3);
          tag.style.transform = `scale(${lerp(0.7, 1, tp).toFixed(3)})`;
          tag.querySelector('.ig-tag-t').textContent = 'bark · 4.2s';
        });
        grid.style.filter = gp >= 1 ? 'none' : `saturate(${lerp(0.35, 1, gp).toFixed(3)})`;

        posts.forEach((target, i) => {
          const c = target * outCubic(seg(t, T.count[0] + i * 0.12, T.count[1] - i * 0.1));
          const s = i === 2 ? `${Math.round(c)}s` : num(c);
          if (lv[i].textContent !== s) lv[i].textContent = s;
        });

        const wp = seg(t, T.wall, T.wall + 0.35);
        wall.style.opacity = wp.toFixed(3);
        wall.style.transform = `translate(-50%, ${((1 - outCubic(wp)) * 12).toFixed(2)}px)`;
        const swapped = t >= T.wallSwap;
        const txt = swapped ? 'read anyway · 37s of audio lifted' : 'logged out · 41 reels behind the wall';
        if (grip.textContent !== txt) grip.textContent = txt;
        wallDot.style.background = swapped ? '#30d158' : '#ff9f0a';
      },
      // the model's own pointer, walking the grid while it works
      pointer(t) {
        if (t < T.pointer[0] || t > T.pointer[1]) return null;
        const r = x.box(grid);
        const i = Math.min(cells.length - 1, Math.floor(((t - T.pointer[0]) / (T.pointer[1] - T.pointer[0])) * cells.length));
        const col = i % 3, row = Math.floor(i / 3);
        const cw = r.w / 3, chh = r.w / 3;
        const tx = r.x + col * cw + cw * 0.5, ty = r.y + row * chh + chh * 0.5;
        const j = Math.sin(t * 3.1) * 6;
        return { x: tx + j, y: ty + j * 0.6, p: 0, v: 1 };
      },
    };
  },
};