// Scrape beat: the routed model (DeepSeek V4 Flash) crawls optical glass catalogs for the Lens Lab's double Gauss
// prescription. Its line streams, the "Scraping 4 glass catalogs" chip spins, and the sweep card rises: each source
// row crawls (a thin bar fills while its page count climbs, then its hit count lands), and the glass it matched pops
// into a strip of six swatches, one per lens element, each a real crop of that element from the post clip
// (img/ll/glass-1..6.jpg, img/CREDITS.txt) labelled with its SCHOTT glass, refractive index nd and Abbe number Vd.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scraping optical glass catalogs for the lens prescription.';
// [source, pages crawled, hits, hit unit]
const SITES = [
  ['refractiveindex.info', 52, 18, 'glasses'],
  ['schott.com', 36, 11, 'sheets'],
  ['patents.google.com', 64, 7, 'patents'],
  ['ohara-inc.co.jp', 29, 9, 'glasses'],
];
const PAGES = SITES.reduce((s, [, p]) => s + p, 0);
// [element crop, element no., SCHOTT glass, nd, Vd]: a symmetric double Gauss, crown outers, flint inners.
// nd / Vd are SCHOTT catalog values as published by refractiveindex.info (SCHOTT Zemax catalog 2017-01-20b), e.g.
// https://refractiveindex.info/?shelf=specs&book=SCHOTT-optical&page=N-SF5 , read from the database files
// https://raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/master/database/data/specs/schott/optical/{N-SK16,N-LAK9,N-SF5,F2}.yml
// (N-SK16 1.62041/60.32, N-LAK9 1.69100/54.71, N-SF5 1.67271/32.25, F2 1.62004/36.37).
const FINDS = [
  ['ll/glass-1.jpg', 1, 'N-SK16', '1.62041', '60.32'],
  ['ll/glass-2.jpg', 2, 'N-LAK9', '1.69100', '54.71'],
  ['ll/glass-3.jpg', 3, 'N-SF5', '1.67271', '32.25'],
  ['ll/glass-4.jpg', 4, 'F2', '1.62004', '36.37'],
  ['ll/glass-5.jpg', 5, 'N-LAK9', '1.69100', '54.71'],
  ['ll/glass-6.jpg', 6, 'N-SK16', '1.62041', '60.32'],
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
    T.done = T.find[FINDS.length - 1] + 0.22;   // the chip resolves: Scraped 4 sites
    T.end = T.done + 0.28;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping ${SITES.length} glass catalogs</span><b class="sc-count">0 pages</b></div></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-sites">${SITES.map(([site]) => `<div class="sc-row"><span class="sc-site">${x.esc(site)}</span><span class="sc-bar"><i></i></span><span class="sc-pg">0 pages</span><span class="sc-hit">crawling</span></div>`).join('')}</div>
      <div class="sc-kept"><span>Matched ${FINDS.length} elements to SCHOTT glass</span><small>/lens/prescription.json</small></div>
      <div class="sc-finds">${FINDS.map(([src, el, glass, nd, vd]) => `<div class="sc-find"><span class="sc-sw"><img src="${x.img(src)}" alt="element ${el}, SCHOTT ${x.esc(glass)}, nd ${nd}, Vd ${vd}"/><em class="sc-el">element ${el}</em><em class="sc-vd">V<sub>d</sub> ${vd}</em></span><span class="sc-cap"><b>${x.esc(glass)}</b><small>n<sub>d</sub> ${nd}</small></span></div>`).join('')}</div>
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

        // the chip: spinner and a climbing page total, then a check and "Scraped 4 catalogs"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Scraped ${SITES.length} catalogs` : `Scraping ${SITES.length} glass catalogs`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // source rows: each lands, crawls (bar + page count), then stamps its hit count
        let pages = 0;
        rows.forEach((m, i) => {
          const a = T.site[i], [, pg, hits, unit] = SITES[i];
          rise(m.row, seg(t, a, a + 0.24), 5);
          const c = seg(t, a + 0.05, a + 0.05 + CRAWL);
          m.bar.style.transform = `scaleX(${Math.max(0.02, outCubic(c)).toFixed(4)})`;
          pages += pg * outCubic(c);
          set(m.pg, `${num(pg * outCubic(c))} pages`);
          const fin = c >= 1;
          m.row.classList.toggle('on', fin);
          set(m.hit, fin ? `${hits} ${unit}` : 'crawling');
        });
        set(ccount, `${num(done ? PAGES : pages)} pages`);

        // the matched strip: its label, then each element's glass pops onto its swatch
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
