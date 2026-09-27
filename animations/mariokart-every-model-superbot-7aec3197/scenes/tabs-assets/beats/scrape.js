// Scrape beat: the routed model (DeepSeek V4 Flash) sweeps open asset libraries for what Turbo Kart Rally still needs
// around the track: the trackside sponsor boards and the item sprites for the HUD. Its line streams, the "Sweeping 2
// asset libraries" chip spins, and the sweep card rises: each library row crawls (a thin bar fills while its page
// count climbs, then its hit count lands), and what it kept pops into two strips of transparency swatches: six
// trackside decals (the TURBO, KART, RALLY and GO! boards, the checkered flag, the corner curb) and six item sprites
// (lightning bolt, red shell, item box, position badge, minimap, speedometer). Every swatch is a real crop from the
// source clip (img/kart/, labels and dims in img/kart/assets.json decal[] and find[]); nothing is drawn by hand.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Sweeping open asset libraries for trackside boards and item sprites.';
// [library, pages crawled, CC0 hits]
const SITES = [
  ['kenney.nl', 38, 12],
  ['opengameart.org', 57, 16],
];
const PAGES = SITES.reduce((s, [, p]) => s + p, 0);
// [sprite, what it is, w, h, fit]: img/kart/assets.json decal[]. Boards are cut out on transparency ('fit' contains
// them); the flag and the curb are photo crops that fill their swatch ('fill').
const DECALS = [
  ['kart/decal-1.png', 'TURBO board', 256, 256, 'fit'],
  ['kart/decal-2.png', 'KART board', 256, 256, 'fit'],
  ['kart/decal-3.png', 'RALLY board', 256, 256, 'fit'],
  ['kart/decal-4.png', 'GO! board', 256, 256, 'fit'],
  ['kart/decal-5.png', 'finish flag', 256, 256, 'fill'],
  ['kart/decal-6.png', 'corner curb', 256, 256, 'fill'],
];
// [sprite, what it is, w, h]: img/kart/assets.json find[]
const FINDS = [
  ['kart/find-1.png', 'lightning', 100, 120],
  ['kart/find-2.png', 'red shell', 150, 120],
  ['kart/find-3.png', 'item box', 170, 170],
  ['kart/find-4.png', '5th badge', 170, 160],
  ['kart/find-5.png', 'minimap', 270, 270],
  ['kart/find-6.png', 'speedometer', 200, 200],
];
const CRAWL = 0.75;   // one library's crawl, bar empty to full
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.site = SITES.map((_, i) => r + 0.3 + i * 0.08);
    T.decal = DECALS.map((_, i) => r + 0.7 + i * 0.09);
    T.find = FINDS.map((_, i) => r + 0.86 + i * 0.09);
    T.done = T.find[FINDS.length - 1] + 0.22;   // the chip resolves: Swept 2 libraries
    T.end = T.done + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const swatch = ([src, name, w, h, fit], cls) => `<div class="sc-find ${cls}"><span class="sc-sw${fit === 'fill' ? ' sc-fill' : ''}"><img src="${x.img(src)}" alt="${x.esc(name)}"/></span><span class="sc-cap"><b>${x.esc(name)}</b><small>${w}&times;${h}</small></span></div>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Sweeping ${SITES.length} asset libraries</span><b class="sc-count">0 pages</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i></span><span class="sc-pg">0 pages</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept sc-kept-d"><span>Kept ${DECALS.length} trackside decals</span><small>/assets/track/decals</small></div>
      <div class="sc-finds">${DECALS.map((d) => swatch(d, 'sc-d')).join('')}</div>
      <div class="sc-kept sc-kept-f"><span>Kept ${FINDS.length} item sprites</span><small>/assets/hud/items</small></div>
      <div class="sc-finds">${FINDS.map((f) => swatch(f, 'sc-f')).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((row) => ({
      row, bar: row.querySelector('.sc-bar i'), pg: row.querySelector('.sc-pg'), hit: row.querySelector('.sc-hit'),
    }));
    const decals = [...card.querySelectorAll('.sc-d')];
    const finds = [...card.querySelectorAll('.sc-f')];
    const keptD = card.querySelector('.sc-kept-d'), keptF = card.querySelector('.sc-kept-f');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    const pop = (f, a, t) => {
      const p = seg(t, a, a + 0.22);
      f.style.opacity = outCubic(p).toFixed(3);
      f.style.transform = p >= 1 ? '' : `scale(${(0.82 + 0.18 * outBack(p)).toFixed(4)})`;
    };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: spinner and a climbing page total, then a check and "Swept 2 libraries"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Swept ${SITES.length} libraries` : `Sweeping ${SITES.length} asset libraries`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // library rows: each lands, crawls (bar + page count), then stamps its CC0 hit count
        let pages = 0;
        rows.forEach((m, i) => {
          const a = T.site[i], [, pg, hits] = SITES[i];
          rise(m.row, seg(t, a, a + 0.24), 5);
          const c = seg(t, a + 0.05, a + 0.05 + CRAWL);
          m.bar.style.transform = `scaleX(${Math.max(0.02, outCubic(c)).toFixed(4)})`;
          pages += pg * outCubic(c);
          set(m.pg, `${num(pg * outCubic(c))} pages`);
          const fin = c >= 1;
          m.row.classList.toggle('on', fin);
          set(m.hit, fin ? `${hits} CC0` : 'crawling');
        });
        set(ccount, `${num(done ? PAGES : pages)} pages`);

        // the two kept strips: each label, then its swatches pop in one after another
        rise(keptD, seg(t, T.decal[0] - 0.08, T.decal[0] + 0.2), 4);
        decals.forEach((f, i) => pop(f, T.decal[i], t));
        rise(keptF, seg(t, T.find[0] - 0.08, T.find[0] + 0.2), 4);
        finds.forEach((f, i) => pop(f, T.find[i], t));
      },
    };
  },
};
