// Scrape beat, rethemed: the routed model (DeepSeek V4 Flash) sweeps the reel's 04 SYSTEMS pattern, the Truchet
// quarter-circle tile field (img/mr/ch04.jpg: cream arcs on ink under the clip's own readout "TRUCHET × 153 ...
// SEED 0x2A"). Its line streams, the "Sweeping the Truchet field" chip counts tiles, and the card rises:
//  - the four rotations of the one tile are sampled (0°, 90°, 180°, 270°), each swinging a quarter turn into place on
//    elastic (DeepSeek's easing in this reel), then deduped: a quarter-circle tile is symmetric under a half turn, so
//    180° is the 0° tile and 270° is the 90° tile, and 2 variants are kept;
//  - a 17 × 9 grid (the clip's 153 tiles) seeded from 0x2A opens out of the centre square, where 03 MORPHING left it,
//    every tile popping in on elastic, while the kept variants count their tiles;
//  - a red sweep crosses the field column by column and flips every tile a half turn on elastic, which leaves the
//    pattern exactly as it was: the dedup, shown.
// Nothing here is sourced from anywhere: every tile and every number is the seeded system itself, counted from the grid.
// Pure function of t: every moving value is written from t, and the canvas is redrawn from t on every render.
import { clamp, lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const SAY = 'Sweeping the 04 SYSTEMS Truchet field from seed 0x2A.';

// ---- the system: one seed, one tile, a 17 × 9 grid of quarter turns ----
const SEED = 0x2A;
const SEED_HEX = '0x2A';
const COLS = 17, ROWS = 9, TILES = COLS * ROWS;          // 153, the clip's count
// each tile's seeded rotation, in quarter turns 0..3 (0°, 90°, 180°, 270°)
const ROT = Array.from({ length: TILES }, (_, i) => Math.floor(rand(SEED * 131 + i * 17 + 5) * 4));
// the tiles each kept variant ends up carrying: variant A is 0° and 180°, variant B is 90° and 270°
const VAR = ROT.map((q) => q % 2);
// the order the grid fills: out from the centre (like the clip's field spreading from its square), seeded jitter
const ORDER = (() => {
  const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
  const k = ROT.map((_, i) => Math.hypot((i % COLS) - cx, Math.floor(i / COLS) - cy) + rand(SEED * 7 + i * 3 + 1) * 0.9);
  const lo = Math.min(...k), hi = Math.max(...k);
  return k.map((v) => (v - lo) / (hi - lo));
})();
// the sweep front is not a ruler: each tile is hit a few ms either side of its column's mark
const JIT = ROT.map((_, i) => (rand(SEED * 11 + i * 5 + 2) - 0.5) * 0.04);

// the four sampled rotations: [degrees, the kept variant it is, or the angle it duplicates]
const ROTS = [[0, 'A'], [90, 'B'], [180, 0], [270, 90]];

// ---- the clock, offsets from the reply ----
const AT = { chip: 0.12, card: 0.22, var: 0.3, fill: 0.34, sweep: 1.02, done: 1.64 };
const VAR_STEP = 0.09;      // one rotation sampled every 90 ms
const SAMPLE = 0.42;        // a swatch's quarter turn into place, on elastic
const STAMP = 0.22;         // after a swatch lands it is stamped kept or duplicate
const FILL_SPREAD = 0.4;    // first tile to last tile starting
const POP = 0.3;            // one tile popping in
const SWEEP_SPAN = 0.36;    // the red front, left column to right column
const FLIP = 0.34;          // one tile's half turn

// the clip's elastic (elasticOut, img/mr/ch02.jpg row 05), exact, the same curve chat.js tags DeepSeek's switch with
const elastic = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1);

// palette (the ad's --mr-* custom properties; the canvas takes the reel's own values)
const INK = '#0F0F11', CREAM = [242, 239, 231], RED = [240, 75, 58];
const rgb = (a, b, f) => `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;

// canvases are sized in fixed device px (2x their CSS box) so a frame never depends on the viewer's screen
const PX = 2;
const TILE = 15;                           // CSS px per tile: the viewport is 255 × 135, exactly 17 × 9 tiles
const VW = COLS * TILE, VH = ROWS * TILE;
const STROKE = 0.19;                       // arc width over tile size, as in the clip's field

/** one Smith tile: two quarter arcs of radius s/2 on opposite corners, joining the midpoints of adjacent edges.
    (cx, cy) centre, s size, ang radians, sc scale, colour, alpha. Butt caps, so neighbours join edge to edge. */
function tile(g, cx, cy, s, ang, sc, col, alpha) {
  const h = s / 2;
  g.save();
  g.translate(cx, cy);
  if (ang) g.rotate(ang);
  if (sc !== 1) g.scale(sc, sc);
  g.globalAlpha = alpha;
  g.strokeStyle = col;
  g.beginPath();
  g.arc(-h, -h, h, 0, Math.PI / 2);        // top edge midpoint to left edge midpoint
  g.moveTo(0, h);
  g.arc(h, h, h, Math.PI, Math.PI * 1.5);  // bottom edge midpoint to right edge midpoint
  g.stroke();
  g.restore();
}

/** a tile's state at t: null before it lands, else its angle (radians), scale, redness 0..1 and flip progress */
function tileAt(i, t, T) {
  const st = T.fill + ORDER[i] * FILL_SPREAD, pp = seg(t, st, st + POP);
  if (pp <= 0) return null;
  const e = elastic(pp);
  const c = i % COLS, hit = T.sweep + (c / (COLS - 1)) * SWEEP_SPAN + JIT[i];
  const fp = seg(t, hit, hit + FLIP), ef = elastic(fp);
  // lands swinging a quarter turn into its seeded rotation, then the sweep adds a half turn
  const deg = (ROT[i] - 1 + e) * 90 + 180 * ef;
  const sc = clamp(e, 0, 1.4) * (1 - 0.16 * Math.sin(Math.PI * fp));
  const red = seg(t, hit - 0.01, hit + 0.05) * (1 - seg(t, hit + 0.22, hit + 0.5));
  return { ang: (deg * Math.PI) / 180, sc, red, fp, alpha: seg(pp, 0, 0.12) };
}

/** the whole field at t: ink ground, the centre square it opens from, then every landed tile */
function drawField(g, t, T) {
  const s = TILE * PX, w = VW * PX, h = VH * PX;
  g.globalAlpha = 1;
  g.fillStyle = INK;
  g.fillRect(0, 0, w, h);

  // the square 03 MORPHING ends on, held at the centre: bracket lines subdivide it 3 × 3, then it gives way to tiles
  const sqA = seg(t, T.card, T.card + 0.12) * (1 - seg(t, T.fill + 0.02, T.fill + 0.16));
  if (sqA > 0) {
    const side = 3 * s * lerp(1, 0.35, outCubic(seg(t, T.fill, T.fill + 0.16)));
    const x0 = w / 2 - side / 2, y0 = h / 2 - side / 2;
    g.globalAlpha = sqA;
    g.fillStyle = rgb(CREAM, CREAM, 0);
    g.fillRect(x0, y0, side, side);
    const q = outCubic(seg(t, T.card + 0.04, T.fill));
    if (q > 0) {
      g.strokeStyle = INK;
      g.lineWidth = s * 0.07;
      g.beginPath();
      for (const f of [1 / 3, 2 / 3]) {
        const len = side * q, x = x0 + side * f, y = y0 + side * f;
        g.moveTo(x, h / 2 - len / 2); g.lineTo(x, h / 2 + len / 2);
        g.moveTo(w / 2 - len / 2, y); g.lineTo(w / 2 + len / 2, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  g.lineCap = 'butt';
  g.lineWidth = s * STROKE;
  for (let i = 0; i < TILES; i++) {
    const a = tileAt(i, t, T);
    if (!a) continue;
    const cx = ((i % COLS) + 0.5) * s, cy = (Math.floor(i / COLS) + 0.5) * s;
    const col = rgb(CREAM, RED, a.red);
    // mid-flip the tile smears: two fainter copies where it was 12 and 24 ms ago (read from t, not remembered)
    if (a.fp > 0 && a.fp < 1) {
      [[0.012, 0.34], [0.024, 0.17]].forEach(([dt, k]) => {
        const b = tileAt(i, t - dt, T);
        if (b && Math.abs(b.ang - a.ang) > 0.08) tile(g, cx, cy, s, b.ang, b.sc, col, a.alpha * k);
      });
    }
    tile(g, cx, cy, s, a.ang, a.sc, col, a.alpha);
  }
  g.globalAlpha = 1;
}

// the swatch: one tile in a 30 × 30 box, the same arcs as the canvas (stroke 0.19 of the tile, in scrape.css)
const ARCS = '<path d="M15 0A15 15 0 0 1 0 15M15 30A15 15 0 0 1 30 15"/>';
const pad2 = (n) => String(n).padStart(2, '0');

export default {
  times(r) {
    const T = { r };
    T.chip = r + AT.chip;
    T.card = r + AT.card;
    T.var = ROTS.map((_, i) => r + AT.var + i * VAR_STEP);
    T.fill = r + AT.fill;
    T.sweep = r + AT.sweep;
    T.done = r + AT.done;      // the chip resolves: Swept the Truchet field, 153 tiles
    T.end = T.done + 0.28;     // r + 1.92 (the source beat ran r + 1.90)
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Sweeping the Truchet field</span><b class="sc-count">0 tiles</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-hd"><b>Motion reel · 04 SYSTEMS</b><small>${COLS} × ${ROWS} grid · seed ${SEED_HEX}</small></div>
      <div class="sc-body">
        <div class="sc-view"><canvas width="${VW * PX}" height="${VH * PX}" style="width:${VW}px;height:${VH}px"></canvas>
          <i class="sc-br sc-br-tl"></i><i class="sc-br sc-br-tr"></i><i class="sc-br sc-br-bl"></i><i class="sc-br sc-br-br"></i>
          <span class="sc-ch">04 · SYSTEMS</span><span class="sc-col">SWEEP <b>00</b>/${COLS}</span>
          <span class="sc-lab">TRUCHET × <b class="sc-n">0</b> · SEED ${SEED_HEX}</span>
        </div>
        <div class="sc-vars">${ROTS.map(([deg]) => `<div class="sc-var"><span class="sc-tile"><svg viewBox="0 0 30 30" aria-hidden="true"><g>${ARCS}</g></svg></span><span class="sc-cap"><b>${deg}°</b><small>sampling</small></span></div>`).join('')}</div>
      </div>
      <div class="sc-ft"><span class="sc-ftl">Sampled 0/4 rotations</span><small>a half turn is the same tile</small></div>
    </div>`);
    const cv = card.querySelector('.sc-view canvas'), g = cv.getContext('2d');
    const vars = [...card.querySelectorAll('.sc-var')].map((v) => ({ v, g: v.querySelector('svg g'), sm: v.querySelector('.sc-cap small') }));
    const nEl = card.querySelector('.sc-n'), colEl = card.querySelector('.sc-col b');
    const ft = card.querySelector('.sc-ft'), ftl = card.querySelector('.sc-ftl');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // tiles landed so far, and how many of them each kept variant carries (counted from the grid at t)
        let placed = 0;
        const per = [0, 0];
        for (let i = 0; i < TILES; i++) if (t >= T.fill + ORDER[i] * FILL_SPREAD) { placed++; per[VAR[i]]++; }

        // the chip: spinner and the climbing tile count, then a check and "Swept the Truchet field"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? 'Swept the Truchet field' : 'Sweeping the Truchet field');
        set(ccount, `${placed} tiles`);

        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        if (ci <= 0) return;   // nothing on the card is visible yet; the canvas keeps its last frame hidden

        // ---- the field ----
        drawField(g, t, T);
        set(nEl, String(placed));
        let cols = 0;
        for (let c = 0; c < COLS; c++) if (t >= T.sweep + (c / (COLS - 1)) * SWEEP_SPAN) cols++;
        set(colEl, pad2(cols));

        // ---- the four rotations: each swings a quarter turn into its angle on elastic, then is stamped ----
        let sampled = 0;
        vars.forEach((m, i) => {
          const a = T.var[i], [deg, kind] = ROTS[i];
          const p = seg(t, a, a + SAMPLE);
          m.v.style.opacity = outCubic(seg(t, a, a + 0.14)).toFixed(3);
          m.g.setAttribute('transform', `rotate(${(deg - 90 + 90 * elastic(p)).toFixed(2)} 15 15)`);
          if (t >= a + 0.1) sampled++;
          const st = t >= a + STAMP, kept = typeof kind === 'string';
          m.v.classList.toggle('sc-kept', st && kept);
          m.v.classList.toggle('sc-dup', st && !kept);
          set(m.sm, !st ? 'sampling' : kept ? `${per[i]} tiles` : `same as ${kind}°`);
          const pop = seg(t, a + STAMP, a + STAMP + 0.24);
          m.sm.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.7, 1, outBack(pop)).toFixed(4)})` : '';
        });

        // ---- the footer: rotations sampled, then the variants kept ----
        rise(ft, seg(t, T.var[0], T.var[0] + 0.24), 4);
        set(ftl, t >= T.var[ROTS.length - 1] + STAMP ? `Kept 2 variants of ${ROTS.length} rotations` : `Sampled ${sampled}/${ROTS.length} rotations`);
      },
    };
  },
};
