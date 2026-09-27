// Scrape beat: DeepSeek V4 Flash, the link after Meshy's karts, pulls the CC0 item sprites Turbo Kart Rally needs and
// drafts the item odds. Its line streams, the "Sweeping 2 asset libraries" chip spins, and the sweep card rises:
// each library row crawls (a thin bar fills while its page count climbs, then its CC0 hit count lands), the eight
// item sprites pop in on transparency swatches with the four HUD pieces beside them, and then odds.json drafts
// itself: one row per race place (1st, 4th, 8th), one column per item, each cell's bar growing to its share.
// Every sprite is a real crop from the source clip (img/kart/find-*.png, labels and dims in img/kart/assets.json
// find[]): the item icons are the eight items the clip's item roulette actually shows. The odds are the game's own
// tuning numbers as drafted for the spot; each row sums to 100.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Pulling CC0 item sprites and drafting the item odds.';
// [library, pages crawled, CC0 hits]
const SITES = [
  ['kenney.nl', 38, 12],
  ['opengameart.org', 57, 16],
];
const PAGES = SITES.reduce((s, [, p]) => s + p, 0);
// [sprite, what it is]: the item roulette's eight items, img/kart/assets.json find[]
const ITEMS = [
  ['kart/find-1.png', 'lightning'],
  ['kart/find-2.png', 'red shell'],
  ['kart/find-7.png', 'green shell'],
  ['kart/find-8.png', 'blue shell'],
  ['kart/find-9.png', 'banana'],
  ['kart/find-10.png', 'mushroom'],
  ['kart/find-11.png', 'triple mushroom'],
  ['kart/find-12.png', 'star'],
];
// [sprite, what it is]: the HUD pieces, img/kart/assets.json find[]
const HUD = [
  ['kart/find-3.png', 'item box'],
  ['kart/find-4.png', 'place badge'],
  ['kart/find-5.png', 'minimap'],
  ['kart/find-6.png', 'speedometer'],
];
// odds.json: [place, % per item in ITEMS order]; each row sums to 100
const ODDS = [
  ['1st', [0, 12, 30, 0, 35, 18, 5, 0]],
  ['4th', [2, 25, 15, 3, 12, 20, 15, 8]],
  ['8th', [15, 13, 2, 10, 0, 15, 25, 20]],
];
const MAXP = 35;      // the tallest share: a full bar
const CRAWL = 0.75;   // one library's crawl, bar empty to full
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.site = SITES.map((_, i) => r + 0.3 + i * 0.08);
    T.item = ITEMS.map((_, i) => r + 0.72 + i * 0.07);
    T.hud = HUD.map((_, i) => r + 0.84 + i * 0.07);
    T.odds = r + 1.42;                                         // the odds.json card lands
    T.row = ODDS.map((_, i) => T.odds + 0.2 + i * 0.28);       // each place's bars start growing
    T.done = T.row[ODDS.length - 1] + 0.55;                    // chip resolves: Swept 2 libraries
    T.end = T.done + 0.45;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const swatch = ([src, name]) => `<div class="sc-find"><span class="sc-sw"><img src="${x.img(src)}" alt="${x.esc(name)}"/></span><span class="sc-cap">${x.esc(name)}</span></div>`;
    const hud = ([src, name]) => `<div class="sc-hud"><span class="sc-sw"><img src="${x.img(src)}" alt="${x.esc(name)}"/></span><span class="sc-cap">${x.esc(name)}</span></div>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Sweeping ${SITES.length} asset libraries</span><b class="sc-count">0 pages</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i></span><span class="sc-pg">0 pages</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept sc-kept-i"><span>Kept ${ITEMS.length} item sprites + ${HUD.length} HUD pieces</span><small>/assets/hud</small></div>
      <div class="sc-finds">${ITEMS.map(swatch).join('')}</div>
      <div class="sc-huds">${HUD.map(hud).join('')}</div>
      <div class="sc-odds">
        <div class="sc-ohd"><b>odds.json · draft</b><small>% per item roll, by race place</small></div>
        <div class="sc-otab">
          <span class="sc-oh"></span>${ITEMS.map(([src, name]) => `<span class="sc-oh"><img src="${x.img(src)}" alt="${x.esc(name)}"/></span>`).join('')}
          ${ODDS.map(([place, ps]) => `<span class="sc-op">${x.esc(place)}</span>${ps.map(() => `<span class="sc-oc"><b>0</b><i><u></u></i></span>`).join('')}`).join('')}
        </div>
      </div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((row) => ({
      row, bar: row.querySelector('.sc-bar i'), pg: row.querySelector('.sc-pg'), hit: row.querySelector('.sc-hit'),
    }));
    const items = [...card.querySelectorAll('.sc-find')];
    const huds = [...card.querySelectorAll('.sc-hud')];
    const keptI = card.querySelector('.sc-kept-i');
    const odds = card.querySelector('.sc-odds');
    const places = [...card.querySelectorAll('.sc-op')];
    const cells = [...card.querySelectorAll('.sc-oc')].map((c) => ({ c, n: c.querySelector('b'), bar: c.querySelector('u') }));
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
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.odds, odds]],
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

        // the kept strip: its label, then the item swatches and the HUD chips pop in one after another
        rise(keptI, seg(t, T.item[0] - 0.08, T.item[0] + 0.2), 4);
        items.forEach((f, i) => pop(f, T.item[i], t));
        huds.forEach((f, i) => pop(f, T.hud[i], t));

        // odds.json: the card lands, then each place's row fills, its bars growing to their share
        rise(odds, seg(t, T.odds, T.odds + 0.3), 6);
        places.forEach((p, i) => { p.style.opacity = (0.35 + 0.65 * outCubic(seg(t, T.row[i], T.row[i] + 0.2))).toFixed(3); });
        cells.forEach((m, j) => {
          const i = Math.floor(j / ITEMS.length), v = ODDS[i][1][j % ITEMS.length];
          const e = outCubic(seg(t, T.row[i] + (j % ITEMS.length) * 0.025, T.row[i] + 0.4 + (j % ITEMS.length) * 0.025));
          m.bar.style.transform = `scaleX(${(v / MAXP * e).toFixed(4)})`;
          set(m.n, String(Math.round(v * e)));
          m.c.classList.toggle('sc-zero', v === 0);
          m.c.style.opacity = (0.3 + 0.7 * e).toFixed(3);
        });
      },
    };
  },
};
