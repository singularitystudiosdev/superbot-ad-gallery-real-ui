// DeepSeek V4 Flash crawl beat, the first request of the minecraft build (forked from pocketsflow-untold's
// ds-search.js). superbot hands DeepSeek the research: three crawl queries type themselves in and tick off, a
// "Read N pages" line counts up with the citation chips of the sites it read, then the results stream in as a list,
// one row per reference it saved (block list, wood, crafting recipes, biomes, trees, chunk meshing), each row
// carrying the block it is about.
//
// Referent: chat.deepseek.com's web-search mode (a "Found N results" line, numbered citations, a sources list of
// favicon + title + host on a near-black sheet), on the hub's own tokens.
//
// SOURCING: the row thumbnails are real 16x16 block textures cropped from BlockHaven by @kepochnik (img/bh/tex, see
// CREDITS.txt). The favicons (img/fav-*.png) are the sites' own marks from Google's public favicon service
// (google.com/s2/favicons?domain=<host>&sz=64), used to label the pages the crawl read. The queries, counts and titles
// are staged for the spot.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no CSS animation or transition.
import { lerp, seg, outCubic, outBack, typed, streamCount, blink } from '../../../lib.js';

const SAY = 'Crawled the references. Block list, recipes and biomes saved.';
const HEAD = 'Crawl';
const PAGES = 42;

const QUERIES = ['minecraft block list and textures', 'crafting table recipes 3x3', 'biome terrain generation noise'];
const SOURCES = [
  ['minecraft.wiki', 'fav-minecraft.wiki.png'],
  ['0fps.net', 'fav-0fps.net.png'],
  ['reddit.com', 'fav-reddit.com.png'],
];
// [thumbnail in img/bh/tex, title, source index]
const RESULTS = [
  ['grass-top.png', 'Grass Block: textures, drops, spreading', 0],
  ['oak-log.png', 'Oak Log and the wood types', 0],
  ['crafting-table.png', 'Crafting: every 3x3 recipe', 0],
  ['sand.png', 'Biomes: beach, desert, ocean, snowy peaks', 0],
  ['leaves.png', 'Tree generation and leaf decay', 2],
  ['dirt.png', 'Meshing in a Minecraft game (greedy meshing)', 1],
];

const QT = 0.14;      // seconds one query takes to type
const QSTEP = 0.13;   // gap between one query starting and the next
const CHIP = 0.05;    // citation chips land one after another
const RSTEP = 0.07;   // result rows stream in

const GLOBE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><ellipse cx="12" cy="12" rx="3.8" ry="8.6"/><path d="M3.6 12h16.8"/></svg>';
const MAG = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6 20.6 20.6"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.1;                                          // the crawl sheet rises in
    T.q = QUERIES.map((_, i) => T.card + 0.14 + i * QSTEP);     // each query row starts typing
    T.qdone = T.q.map((a) => a + QT);                           // ...and its check lands
    T.found = T.qdone[QUERIES.length - 1] + 0.06;               // "Read N pages" counts up
    T.chips = SOURCES.map((_, i) => T.found + 0.04 + i * CHIP); // the citation chips
    T.row = RESULTS.map((_, i) => T.found + 0.12 + i * RSTEP);  // the results stream in
    T.foot = T.row[RESULTS.length - 1] + 0.1;                   // "6 references saved"
    T.end = T.foot + 0.26;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const CPS = Math.max(...QUERIES.map((q) => q.length)) / QT;

    const qrows = QUERIES.map(() => `<div class="dss-q"><i class="dss-qi">${MAG}</i><span class="dss-qt"></span><i class="dss-curl"></i><i class="dss-qc">${x.OK}</i></div>`).join('');
    const chips = SOURCES.map(([host, fav]) => `<span class="dss-chip"><img src="${x.img(fav)}" alt=""/><span>${x.esc(host)}</span></span>`).join('');
    const rows = RESULTS.map(([tex, title, si], i) => `<div class="dss-r">
      <b class="dss-rn">${i + 1}</b>
      <img class="dss-rt" src="${x.img('bh/tex/' + tex)}" alt="" decoding="sync"/>
      <span class="dss-rtl">${x.esc(title)}</span>
      <span class="dss-rh"><img src="${x.img(SOURCES[si][1])}" alt=""/>${x.esc(SOURCES[si][0])}</span>
    </div>`).join('');

    const card = x.el(`<div class="dss">
      <div class="dss-hd"><i class="dss-gl">${GLOBE}</i><b class="dss-hb">${x.esc(HEAD)}</b>
        <span class="dss-pill"><i class="dss-spin"></i><span class="dss-pl">Crawling</span>${x.OK}</span></div>
      <div class="dss-qs">${qrows}</div>
      <div class="dss-found"><i class="dss-fi">${GLOBE}</i><span>Read <b class="dss-n">0</b> pages</span></div>
      <div class="dss-chips">${chips}</div>
      <div class="dss-res">${rows}</div>
      <div class="dss-foot"><b class="dss-c">0</b> references saved</div>
    </div>`);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const $ = (s) => card.querySelector(s);
    const rowEls = [...card.querySelectorAll('.dss-q')];
    const qts = rowEls.map((r) => r.querySelector('.dss-qt'));
    const curls = rowEls.map((r) => r.querySelector('.dss-curl'));
    const qcs = rowEls.map((r) => r.querySelector('.dss-qc'));
    const chipEls = [...card.querySelectorAll('.dss-chip')];
    const resEls = [...card.querySelectorAll('.dss-r')];
    const found = $('.dss-found'), nEl = $('.dss-n'), foot = $('.dss-foot'), cEl = $('.dss-c');
    const pill = $('.dss-pill'), pl = $('.dss-pl'), spin = $('.dss-spin');
    const pOk = pill.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    const was = new Array(QUERIES.length).fill('');
    let shown = -1, lastN = -1, lastC = -1, lastDone = null;

    return {
      nodes: [say, card],
      // the list is the payoff, so the thread glides ahead of it: by the time the last row lands the whole list and its
      // footer are already above the composer
      marks: [[T.r, say], [T.card, rowEls[QUERIES.length - 1]], [T.found - 0.08, resEls[1]], [T.row[1], foot]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.04, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.35));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the header pill: the spinner turns while the crawl runs, then resolves into the check
        const fd = t >= T.foot;
        spin.style.opacity = (1 - seg(t, T.foot - 0.06, T.foot + 0.05)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        pOk.style.opacity = seg(t, T.foot, T.foot + 0.2).toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.foot, T.foot + 0.22))).toFixed(4)})`;
        if (fd !== lastDone) { pill.classList.toggle('is-done', fd); pl.textContent = fd ? 'Done' : 'Crawling'; lastDone = fd; }

        rowEls.forEach((row, i) => {
          const a = T.q[i];
          const p = outCubic(seg(t, a - 0.1, a + 0.12));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const ty = typed(QUERIES[i], a, CPS, t);
          const txt = QUERIES[i].slice(0, ty.n);
          if (txt !== was[i]) { was[i] = txt; qts[i].textContent = txt; }
          curls[i].style.opacity = ty.n > 0 && !ty.done ? (blink(t) ? '1' : '0') : '0';
          const ck = outCubic(seg(t, T.qdone[i] - 0.03, T.qdone[i] + 0.12));
          qcs[i].style.opacity = ck.toFixed(3);
          qcs[i].style.transform = `scale(${lerp(0.4, 1, ck).toFixed(3)})`;
        });

        const fo = outCubic(seg(t, T.found - 0.1, T.found + 0.14));
        found.style.opacity = fo.toFixed(3);
        found.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
        const pn = Math.round(PAGES * outCubic(seg(t, T.found, T.found + 0.6)));
        if (pn !== lastN) { lastN = pn; nEl.textContent = String(pn); }

        chipEls.forEach((chip, i) => {
          const cp = outCubic(seg(t, T.chips[i], T.chips[i] + 0.2));
          chip.style.opacity = cp.toFixed(3);
          chip.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 5).toFixed(2)}px)`;
        });

        // the results stream in, each row sliding in from the left with its block thumbnail
        resEls.forEach((row, i) => {
          const rp = outCubic(seg(t, T.row[i], T.row[i] + 0.22));
          row.style.opacity = rp.toFixed(3);
          row.style.transform = rp >= 1 ? 'none' : `translateX(${((1 - rp) * -10).toFixed(2)}px)`;
        });

        const saved = T.row.reduce((a, p) => a + (t >= p + 0.1 ? 1 : 0), 0);
        if (saved !== lastC) { lastC = saved; cEl.textContent = String(saved); }
        const fp = outCubic(seg(t, T.row[0], T.row[0] + 0.25));
        foot.style.opacity = fp.toFixed(3);
        card.classList.toggle('is-done', fd);
      },
    };
  },
};
