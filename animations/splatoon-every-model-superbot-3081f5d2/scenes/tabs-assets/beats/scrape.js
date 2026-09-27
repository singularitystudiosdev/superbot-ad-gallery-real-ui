// Scrape beat: the routed model (DeepSeek V4 Flash) crawls the open CC0 libraries for the arena props the level
// still needs. Its line streams, the "Scraping 2 asset sites" chip spins, and the sweep card rises: each site row
// crawls (a thin bar fills while its page count climbs, then its hit count lands), and the sprites it kept pop into a
// strip of transparency swatches, each one a real CC0 sprite. The two sites are the ones img/CREDITS.txt names for
// the finds: kenney.nl (Splat Pack, Shooting Gallery, Platformer Art Deluxe) and opengameart.org (the Splat Pack
// mirror). The tall splatter rifle keeps its own aspect and is fitted taller than the square sprites so it reads on
// the swatch.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scraping CC0 libraries for the props the arena still needs.';
// [site, pages crawled, CC0 hits]: the two CC0 libraries img/CREDITS.txt credits for the sprites below
const SITES = [
  ['kenney.nl', 34, 12],
  ['opengameart.org', 51, 14],
];
const PAGES = SITES.reduce((s, [, p]) => s + p, 0);
// [sprite, what it is, w, h]: the finds, from img/ink/assets.json find[] (CC0 Kenney sprites, see img/CREDITS.txt)
const FINDS = [
  ['ink/find-1.png', 'paint target', 128, 128],
  ['ink/find-2.png', 'splatter rifle', 142, 319],
  ['ink/find-3.png', 'arena crate', 70, 70],
  ['ink/find-4.png', 'blue ink hit splat', 30, 30],
  ['ink/find-5.png', 'paint bomb', 70, 70],
  ['ink/find-6.png', 'bounce pad', 70, 70],
];
const CRAWL = 0.75;   // one site's crawl, bar empty to full
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.site = SITES.map((_, i) => r + 0.3 + i * 0.08);
    T.find = FINDS.map((_, i) => r + 0.75 + i * 0.13);
    T.done = T.find[FINDS.length - 1] + 0.22;   // the chip resolves: Scraped 2 sites
    T.end = T.done + 0.28;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping ${SITES.length} asset sites</span><b class="sc-count">0 pages</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i></span><span class="sc-pg">0 pages</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept"><span>Kept ${FINDS.length} CC0 sprites</span><small>/assets/sprites</small></div>
      <div class="sc-finds">${FINDS.map(([src, name, w, h]) => `<div class="sc-find"><span class="sc-sw"><img${h > w ? ' style="height:88%"' : ''} src="${x.img(src)}" alt="${x.esc(name)}"/></span><span class="sc-cap"><b>${x.esc(name)}</b><small>${w}&times;${h}</small></span></div>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((row) => ({
      row, bar: row.querySelector('.sc-bar i'), pg: row.querySelector('.sc-pg'), hit: row.querySelector('.sc-hit'),
    }));
    const finds = [...card.querySelectorAll('.sc-find')];
    const kept = card.querySelector('.sc-kept');
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

        // the chip: spinner and a climbing page total, then a check and "Scraped 2 sites"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Scraped ${SITES.length} sites` : `Scraping ${SITES.length} asset sites`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // site rows: each lands, crawls (bar + page count), then stamps its CC0 hit count
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

        // the kept strip: its label, then each sprite pops onto its swatch
        rise(kept, seg(t, T.find[0] - 0.08, T.find[0] + 0.2), 4);
        finds.forEach((f, i) => {
          const p = seg(t, T.find[i], T.find[i] + 0.22);
          f.style.opacity = outCubic(p).toFixed(3);
          f.style.transform = p >= 1 ? '' : `scale(${(0.82 + 0.18 * outBack(p)).toFixed(4)})`;
        });
      },
    };
  },
};