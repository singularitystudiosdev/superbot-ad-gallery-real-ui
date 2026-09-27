// Scrape beat: the routed model (DeepSeek V4 Flash) crawls open icon libraries for the reel's control glyphs.
// Its line streams, the "Scraping 3 icon sources" chip spins, and the sweep card rises: each source row crawls (a thin
// bar fills while its page count climbs, then its kept count lands), and the glyphs it kept pop into a strip of icon
// swatches, each a real ISC-licensed Lucide glyph (lucide.dev / api.iconify.design / github.com/lucide-icons/lucide),
// white strokes on an #1f7cff backing so they read.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scraping open icon sets for the reel control glyphs.';
// [source, pages crawled, ISC glyphs kept]
const SITES = [
  ['lucide.dev', 34, 3],
  ['api.iconify.design', 41, 2],
  ['github.com/lucide-icons/lucide', 18, 1],
];
const PAGES = SITES.reduce((s, [, p]) => s + p, 0);
// [glyph, file name, native px]
const FINDS = [
  ['lg/find-wifi.svg', 'wifi.svg', '24×24 SVG'],
  ['lg/find-moon.svg', 'moon.svg', '24×24 SVG'],
  ['lg/find-flashlight.svg', 'flashlight.svg', '24×24 SVG'],
  ['lg/find-volume-2.svg', 'volume-2.svg', '24×24 SVG'],
  ['lg/find-search.svg', 'search.svg', '24×24 SVG'],
  ['lg/find-heart.svg', 'heart.svg', '24×24 SVG'],
];
const CRAWL = 0.75;   // one source's crawl, bar empty to full
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.site = SITES.map((_, i) => r + 0.3 + i * 0.08);
    T.find = FINDS.map((_, i) => r + 0.75 + i * 0.13);
    T.done = T.find[FINDS.length - 1] + 0.22;   // the chip resolves: Scraped 3 sources
    T.end = T.done + 0.28;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say sc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping ${SITES.length} icon sources</span><b class="sc-count">0 pages</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i></span><span class="sc-pg">0 pages</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept"><span>Kept ${FINDS.length} ISC glyphs</span><small>24&times;24 SVG</small></div>
      <div class="sc-finds">${FINDS.map(([src, name, px]) => `<div class="sc-find"><span class="sc-sw"><img src="${x.img(src)}" alt="${x.esc(name)}"/></span><span class="sc-cap"><b>${x.esc(name)}</b><small>${px}</small></span></div>`).join('')}</div>
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

        // the chip: spinner and a climbing page total, then a check and "Scraped 3 sources"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Scraped ${SITES.length} sources` : `Scraping ${SITES.length} icon sources`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // source rows: each lands, crawls (bar + page count), then stamps its kept count
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
          set(m.hit, fin ? `${hits} ISC` : 'crawling');
        });
        set(ccount, `${num(done ? PAGES : pages)} pages`);

        // the kept strip: its label, then each glyph pops onto its swatch
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