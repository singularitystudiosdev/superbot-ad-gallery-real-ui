// Web scrape beat (step 2 of the Inkwave routing): superbot routes the "scrape Inkipedia for weapons and turf rules"
// request to DeepSeek V4, which crawls the sources, extracts the numbers it needs, and keeps a reference board.
// Forked from the Dark Souls kit's ds-search beat: the search rows became the five crawl rows (each with its host's own
// favicon, the path it reads, a progress bar and a check), the "Searched N web pages" line became two live counters
// (pages scraped, tokens read), the image results became an extracted-data table that fills row by row AND a reference
// board of eight kept images.
//
// EVERY FIGURE AND EVERY IMAGE IS SOURCED, none invented and none drawn. The table's values are the real numbers on the
// cited Inkipedia pages (Splatoon 3 sections): Splattershot 36 base damage (min 18), a bullet every 6 frames (10 shots
// a second), 11.56 units effective range, 0.92% of the tank a shot (108 shots on a full tank); Splat Charger 160
// damage on a full charge; Sploosh-o-matic 38 (min 19); Turf War three minutes; respawn about four seconds. The board's
// five photographs are real Wikimedia Commons files (CC0 and CC BY / CC BY-SA, each credited in
// img/ink/scrape/CREDITS.txt) and its three "gameplay" tiles are real frames of the source video by @JaydenDavisNC.
// The favicons are the hosts' own published icons. Full source list, licences and the exact figures each page states:
// img/ink/scrape/CREDITS.txt.
//
// Pure function of t (the tabs scene's local time), so ?t=<sec> freezes an exact frame: nothing here transitions and
// nothing animates on its own, every moving value is written from t in render.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = '14 pages scraped, 8 refs kept, sending to Meshy.';
const HEAD = 'Web scrape';

// the five crawl rows, in the order their rows land. [host, path it reads, favicon in img/ink/scrape, pages, tokens]
// pages and tokens are per source: they are what that row's own reading adds to the two counters. Together they are the
// 14 pages and 18,640 tokens the beat ends on.
const SOURCES = [
  ['splatoonwiki.org', '/wiki/Splattershot · Splat_Charger · Sploosh-o-matic · Turf_War · Spawn_point', 'fav-splatoonwiki.webp', 5, 6840],
  ['commons.wikimedia.org', 'Special:Search · pier, jetty and boardwalk photographs', 'fav-commons.webp', 5, 5420],
  ['nintendo.com', '/us/store/products/splatoon-3-switch', 'fav-nintendo.webp', 1, 1180],
  ['kenney.nl', '/assets · pier and watercraft prop packs', 'fav-kenney.webp', 2, 2740],
  ['polyhaven.com', '/ · pier HDRI and surface material', 'fav-polyhaven.webp', 1, 1660],
];
const PAGES = SOURCES.reduce((a, s) => a + s[3], 0);        // 14
const TOPK = SOURCES.reduce((a, s) => a + s[4], 0);         // 17,840

// the extracted-data table, one row per value the run pulled off Inkipedia, in the order the rows fill in. The keys are
// the field paths the beat prints, the values are the figures the cited pages state. [field, value]
const FIELDS = [
  ['splattershot.damage', '36 (min 18)'],
  ['splattershot.fire_rate', '10 shots / s'],
  ['splattershot.range', '11.56 units'],
  ['splat_charger.full_charge', '160 damage'],
  ['sploosh.damage', '38 (min 19)'],
  ['ink_tank', '100% · 108 shots'],
  ['turf_war', '3:00'],
  ['respawn', '~4 s'],
];
const ROWTOK = 100;   // tokens each landed table row adds to the counter

// the eight kept references: [file in img/ink/scrape, kind]. 'photo' tiles carry the Commons favicon badge, 'game' tiles
// are frames of the source video and are tagged as such.
const REFS = [
  ['pier-01.webp', 'photo'], ['game-01.webp', 'game'], ['pier-02.webp', 'photo'], ['pier-03.webp', 'photo'],
  ['game-02.webp', 'game'], ['pier-04.webp', 'photo'], ['pier-05.webp', 'photo'], ['game-03.webp', 'game'],
];
const NPICK = REFS.length;   // 8 refs kept

// timings (seconds from the reply header, r). The beat runs 3.93 s, the same slot the stub held.
const SSTEP = 0.26;    // one crawl row starting after the next
const SRCD = 0.24;     // one crawl row's bar takes this to fill, then its check lands
const RSTEP = 0.14;    // table rows fill one after another
const RFILL = 0.16;    // one table row's value takes this to be read off the page
const TSTEP = 0.05;    // board tiles pop in
const PSTEP = 0.06;    // picks land
const SAY_AT = 2.98;   // the handoff line starts streaming
const SAY_CPS = 90;    // chars/second it streams at

// the scrape mark on the card header (a page with the lines being read off it) and the crawl mark on each source row
// (a node with the two child pages it is following)
const DOC = '<svg viewBox="0 0 24 24"><path d="M6 3h7l5 5v13H6z"/><path d="M13 3v5h5"/><path d="M9 13h6M9 16.5h6"/></svg>';
const NODE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="5.4" r="2.6"/><circle cx="5.6" cy="18.6" r="2.6"/><circle cx="18.4" cy="18.6" r="2.6"/><path d="M10.7 7.7 6.9 16M13.3 7.7l3.8 8.3"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.18;                                          // the scrape sheet rises in
    T.src = SOURCES.map((_, i) => T.card + 0.24 + i * SSTEP);    // each crawl row starts
    T.srcDone = T.src.map((a) => a + SRCD);                      // ...its bar fills and its check lands
    T.stat = T.srcDone[SOURCES.length - 1] + 0.14;               // the two counters land (they tick from the row clock)
    T.row = FIELDS.map((_, i) => T.src[0] + 0.32 + i * RSTEP);   // each extracted row is read off the page
    T.grid = T.stat + 0.22;                                      // the reference board drops in
    T.tile = REFS.map((_, i) => T.grid + i * TSTEP);             // tiles pop in left to right
    T.pick = REFS.map((_, i) => T.grid + 0.28 + i * PSTEP);      // ...and get kept, one by one
    T.say = r + SAY_AT;                                          // the handoff line streams
    T.end = T.say + 0.95;                                        // the line lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;

    const srcs = SOURCES.map(([host, path, fav]) => `<div class="dss-s">
      <img class="dss-fv" src="${x.img('ink/scrape/' + fav)}" alt=""/>
      <span class="dss-sh">${x.esc(host)}</span>
      <span class="dss-sp">${x.esc(path)}</span>
      <i class="dss-sbar"><b></b></i>
      <i class="dss-sc">${x.OK}</i>
    </div>`).join('');
    const rows = FIELDS.map(([field, val]) => `<div class="dss-tr">
      <span class="dss-tf">${x.esc(field)}</span>
      <span class="dss-tv"><span class="dss-tvl">${x.esc(val)}</span><i class="dss-edge"></i></span>
    </div>`).join('');
    const tiles = REFS.map(([file, kind]) => `<figure class="dss-t">
      <img class="dss-im" src="${x.img('ink/scrape/' + file)}" alt="" decoding="sync"/>
      ${kind === 'game' ? '<span class="dss-tag">gameplay</span>' : `<span class="dss-bdg"><img src="${x.img('ink/scrape/fav-commons.webp')}" alt=""/></span>`}
      <span class="dss-pk">${x.OK}</span>
    </figure>`).join('');

    const card = x.el(`<div class="dss">
      <div class="dss-hd"><i class="dss-gl">${DOC}</i><b class="dss-hb">${x.esc(HEAD)}</b>
        <span class="dss-pill"><i class="dss-spin"></i><span class="dss-pl">Scraping</span>${x.OK}</span></div>
      <div class="dss-srcs">${srcs}</div>
      <div class="dss-stat"><i class="dss-si">${NODE}</i>
        <span><b class="dss-pg">0</b> pages scraped</span>
        <span class="dss-sep">·</span>
        <span><b class="dss-tok">0</b> tokens read</span></div>
      <div class="dss-tbl">
        <div class="dss-tr dss-th"><span class="dss-tf">field</span><span class="dss-tv">value</span></div>
        ${rows}</div>
      <div class="dss-grid">${tiles}</div>
      <div class="dss-foot"><b class="dss-c">0</b> refs kept</div>
    </div>`);

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const $ = (s) => card.querySelector(s);
    const srcEls = [...card.querySelectorAll('.dss-s')];
    const barEls = srcEls.map((r) => r.querySelector('.dss-sbar'));
    const bars = barEls.map((b) => b.firstElementChild);
    const scs = srcEls.map((r) => r.querySelector('.dss-sc'));
    const rowEls = [...card.querySelectorAll('.dss-tbl .dss-tr')].slice(1);   // skip the field/value header
    const vals = rowEls.map((r) => r.querySelector('.dss-tvl'));
    const edges = rowEls.map((r) => r.querySelector('.dss-edge'));
    const grid = $('.dss-grid');
    const tileEls = [...card.querySelectorAll('.dss-t')];
    const pks = tileEls.map((t) => t.querySelector('.dss-pk'));
    const stat = $('.dss-stat');
    const pgEl = $('.dss-pg');
    const tokEl = $('.dss-tok');
    const foot = $('.dss-foot');
    const cEl = $('.dss-c');
    const pill = $('.dss-pill');
    const pl = $('.dss-pl');
    const spin = $('.dss-spin');
    const pOk = pill.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // last text written per counter: the DOM is only touched when the frame's number differs, so a still frame costs
    // nothing and a seek backwards still repaints
    let shown = -1, lastPg = -1, lastTok = -1, lastC = -1, lastDone = null;

    return {
      nodes: [card, say],
      // scroll marks: the thread glides to each stage as it lands, and the last one brings the handoff line into frame.
      // The board's stop is the card's footer, not the grid itself: the "8 refs kept" line lands with the board, and
      // stopping on the grid parked that line under the composer until the handoff mark.
      marks: [[T.card, srcEls[SOURCES.length - 1]], [T.stat, stat], [T.grid, foot], [T.say - 0.12, say]],
      render(t) {
        const n = streamCount(SAY, T.say + 0.03, SAY_CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the sheet rises in, then holds perfectly still
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the header pill: the spinner turns while the crawl runs, then resolves into the check
        const fd = t >= T.stat;
        spin.style.opacity = (1 - seg(t, T.stat - 0.06, T.stat + 0.05)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        pOk.style.opacity = seg(t, T.stat, T.stat + 0.24).toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.stat, T.stat + 0.26))).toFixed(4)})`;
        if (fd !== lastDone) { pill.classList.toggle('is-done', fd); pl.textContent = fd ? 'Done' : 'Scraping'; lastDone = fd; }

        // the five crawl rows: each lands, its bar fills with the page it is pulling, then its check lands
        srcEls.forEach((row, i) => {
          const a = T.src[i];
          const p = outCubic(seg(t, a - 0.12, a + 0.16));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const bf = outCubic(seg(t, a, a + SRCD));
          bars[i].style.transform = `scaleX(${bf.toFixed(4)})`;
          // the whole bar (track included) fades out once that source's page has been pulled, so a finished row keeps
          // nothing but its favicon, its path and its check
          barEls[i].style.opacity = (1 - seg(t, a + SRCD - 0.04, a + SRCD + 0.12)).toFixed(3);
          const ck = outCubic(seg(t, T.srcDone[i] - 0.04, T.srcDone[i] + 0.16));
          scs[i].style.opacity = ck.toFixed(3);
          scs[i].style.transform = `scale(${lerp(0.4, 1, ck).toFixed(3)})`;
        });

        // the two counters: pages tick up as each row's check lands, tokens tick with every page read and every table
        // row extracted off them, so both are a real function of what the frame shows, never a linear countup
        const fo = outCubic(seg(t, T.stat - 0.12, T.stat + 0.18));
        stat.style.opacity = fo.toFixed(3);
        stat.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
        const pg = SOURCES.reduce((a, s, i) => a + (t >= T.srcDone[i] ? s[3] : 0), 0);
        const tk = SOURCES.reduce((a, s, i) => a + (t >= T.srcDone[i] ? s[4] : 0), 0)
          + ROWTOK * FIELDS.reduce((a, _, i) => a + (t >= T.row[i] + RFILL ? 1 : 0), 0);
        if (pg !== lastPg) { lastPg = pg; pgEl.textContent = String(pg); }
        if (tk !== lastTok) { lastTok = tk; tokEl.textContent = tk.toLocaleString('en-US'); }

        // the extracted table: each row's value is read off the page left to right, then its row settles
        rowEls.forEach((row, i) => {
          const a = T.row[i];
          const p = outCubic(seg(t, a - 0.1, a + 0.14));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`;
          const rf = seg(t, a + 0.04, a + 0.04 + RFILL);
          const live = rf > 0 && rf < 1;
          vals[i].style.clipPath = rf >= 1 ? 'none' : `inset(0 ${((1 - rf) * 100).toFixed(2)}% 0 0)`;
          edges[i].style.opacity = live ? '1' : '0';
          edges[i].style.left = `${(rf * 100).toFixed(2)}%`;
        });

        // the reference board: the grid drops in, its tiles pop in left to right, and each kept tile lands its check
        const gi = outCubic(seg(t, T.grid - 0.06, T.grid + 0.3));
        grid.style.opacity = gi.toFixed(3);
        grid.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 8).toFixed(2)}px) scale(${lerp(0.985, 1, gi).toFixed(4)})`;
        tileEls.forEach((tile, i) => {
          const tp = outCubic(seg(t, T.tile[i], T.tile[i] + 0.28));
          tile.style.opacity = tp.toFixed(3);
          tile.style.transform = tp >= 1 ? 'none' : `translateY(${((1 - tp) * 7).toFixed(2)}px)`;
          const pk = t >= T.pick[i];
          tile.classList.toggle('is-pk', pk);
          const pp = outBack(seg(t, T.pick[i], T.pick[i] + 0.22));
          pks[i].style.opacity = seg(t, T.pick[i], T.pick[i] + 0.14).toFixed(3);
          pks[i].style.transform = `scale(${lerp(0.3, 1, pp).toFixed(3)})`;
        });

        // the footer counts the kept refs up as they land, ending on "8 refs kept"
        const kept = T.pick.reduce((a, p) => a + (t >= p ? 1 : 0), 0);
        if (kept !== lastC) { lastC = kept; cEl.textContent = String(kept); }
        const fp = outCubic(seg(t, T.grid + 0.24, T.grid + 0.54));
        foot.style.opacity = fp.toFixed(3);
        foot.style.transform = fp >= 1 ? 'none' : `translateY(${((1 - fp) * 5).toFixed(2)}px)`;
        card.classList.toggle('is-done', kept >= NPICK);
      },
    };
  },
};