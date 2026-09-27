// Scrape beat (beats/scrape.js): DeepSeek V4 Flash takes Script §1, the reference sweep for a 3D ink shooter. superbot
// hands it the ask; it runs four searches ("Splatoon turf war rules", "ink coverage scoring", "stylized seaside plaza
// reference", "CC0 palm tree crate models"), each query row typing itself in and ticking off as it lands, then the four
// libraries it crawled (splatoonwiki.org, polyhaven.com, kenney.nl, opengameart.org) land as chips carrying their own
// favicon, a page count that climbs while the crawl runs, and the licence the run found there. The image results grid
// drops in under them: fourteen REAL downloaded references (Poly Haven seaside/ocean HDRIs and concrete/plaza texture
// thumbnails, Kenney preview sheets for the palms and crates, OpenGameArt CC0 paint splats), each stamped with the
// source it came from and picked one by one with a check until the footer reads 14 refs picked and the reply closes on
// the handoff line to Meshy.
//
// Referent: chat.deepseek.com's web-search mode (checked against a real screen capture before styling): a "Found N
// results" line above the answer, numbered inline citations, a sources panel listing favicon + title + url on a
// near-black sheet. This beat keeps that vocabulary on the hub's own tokens (#121216 sheet, inset 1px #2a2a2e,
// var(--ui)) and adds the crawl counters the family's scrape beat (fantasy90s scrape.js) reads: a page count per site
// and a "N pages" total, so Script §1 reads as a sweep, not as a chat answer about one.
//
// IMAGERY / SOURCING (every file below is downloaded from the site it is stamped with, none is drawn by hand and none
// is generated; every one is in img/ink/scrape/, webp <= 48 KB each, and the same record is kept in
// img/ink/scrape/CREDITS.txt):
//   polyhaven.com, CC0 1.0 (public domain dedication, no attribution required; credited here anyway). Four HDRI sky
//     thumbnails, the seaside/ocean light the plaza is lit with, and four texture thumbnails, the concrete and plaza
//     ground the map is built from. Thumbnails come off the site's own CDN, cdn.polyhaven.com/asset_img/thumbs/<slug>.png,
//     the same preview the asset page shows (the mirror-ball inset in the HDRI frames is Poly Haven's own preview
//     scene, not something drawn here):
//       hdri-secluded-beach.webp   <- secluded_beach          tex-pavers.webp           <- concrete_pavers_02
//       hdri-fish-hoek-beach.webp  <- fish_hoek_beach         tex-pavement.webp         <- concrete_pavement_03
//       hdri-small-harbor.webp     <- small_harbor_01         tex-concrete-worn.webp    <- concrete_floor_worn_001
//       hdri-simons-town.webp      <- simons_town_harbour     tex-checkered-paving.webp <- checkered_pavement_tiles
//   kenney.nl, CC0 1.0 (Kenney, kenney.nl; credited though not required). The kit preview sheets, the palm trees and
//     the crates the map props are cut from. Each is cropped (918x440 of the 918x515 sample) to trim Kenney's own
//     sample watermark strip off the bottom edge; nothing inside the artwork is altered:
//       kenney-nature.webp         <- Nature Kit sample        kenney-survival.webp      <- Survival Kit sample
//       kenney-tower-defense.webp  <- Tower Defense Kit sample
//   opengameart.org, CC0 1.0. The paint splats:
//       oga-splat-a.webp     <- opengameart.org/sites/default/files/splat.png,  "SplatTexture" by Alexander123, CC0
//       oga-splat-b.webp     <- opengameart.org/sites/default/files/splat2.png, "SplatTexture" by Alexander123, CC0
//       oga-splat-pack.webp  <- opengameart.org/sites/default/files/kenney_splatpack.zip, splat02.png from Kenney's
//                               Splat Pack (CC0) as mirrored on OpenGameArt
//   favicons (fav-*.png): the sites' own marks, used nominatively to label the pages the run read.
//     polyhaven.com/favicon.ico, kenney.nl/favicon.ico and opengameart.org/sites/all/themes/oga/opengameart2_favicon.ico
//     are the sites' own icon files; splatoonwiki.org's is served by Google's public favicon service
//     (google.com/s2/favicons?domain=splatoonwiki.org&sz=64), which returns the wiki's own 16x16 mark, fetched because
//     the wiki 403s a plain request. Each is resized to 48x48 png for the chips and the tile badges.
//   The four searches, the page counts and the pick order are staged for the spot, as in every other beat's card. The
//   pictures, the page counts' sources and the favicons are not: the images are the real asset previews named above.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or transition,
// so ?t=<sec> freezes an exact frame.
import { lerp, seg, outCubic, outBack, typed, streamCount, blink } from '../../../lib.js';

const SAY = 'Picked 14 refs. Sending §2 to Meshy.';
const HEAD = 'Web search';

// the four searches, in the order their rows type themselves in
const QUERIES = ['Splatoon turf war rules', 'ink coverage scoring', 'stylized seaside plaza reference', 'CC0 palm tree crate models'];

// the four libraries crawled, in the order their chips land: [host, favicon, pages the run read, the licence it found]
const SITES = [
  ['splatoonwiki.org', 'fav-splatoonwiki.org.png', 22, 'CC BY-SA'],
  ['polyhaven.com', 'fav-polyhaven.com.png', 63, 'CC0'],
  ['kenney.nl', 'fav-kenney.nl.png', 37, 'CC0'],
  ['opengameart.org', 'fav-opengameart.org.png', 58, 'CC0'],
];
// the four library page counts sum to 180, which is what the card's total line reads once the last crawl finishes

// the fourteen references kept: [file in img/ink/scrape, index into SITES, what the picture is]. Every one is a real
// downloaded asset preview (see IMAGERY above), so the strip is a real reference board, not an illustration of one.
const REFS = [
  ['hdri-secluded-beach.webp', 1, 'Poly Haven HDRI: secluded beach, open water at midday'],
  ['tex-pavers.webp', 1, 'Poly Haven texture: reddish concrete pavers'],
  ['kenney-nature.webp', 2, 'Kenney Nature Kit preview sheet: palms and props on a teal island'],
  ['oga-splat-a.webp', 3, 'OpenGameArt CC0 splat texture: soft round ink splat mask'],
  ['hdri-fish-hoek-beach.webp', 1, 'Poly Haven HDRI: Fish Hoek beach, low tide under an overcast sky'],
  ['tex-pavement.webp', 1, 'Poly Haven texture: dark concrete pavement slabs'],
  ['kenney-survival.webp', 2, 'Kenney Survival Kit preview sheet: jungle, palms and supply crates'],
  ['oga-splat-b.webp', 3, 'OpenGameArt CC0 splat texture: spiked ink splat with satellite drops'],
  ['hdri-small-harbor.webp', 1, 'Poly Haven HDRI: small harbor at sunrise'],
  ['tex-concrete-worn.webp', 1, 'Poly Haven texture: worn grey concrete floor'],
  ['kenney-tower-defense.webp', 2, 'Kenney Tower Defense Kit preview sheet: crates, rocks and towers'],
  ['oga-splat-pack.webp', 3, 'Kenney Splat Pack CC0 splat, mirrored on OpenGameArt'],
  ['hdri-simons-town.webp', 1, 'Poly Haven HDRI: Simons Town harbour with a moored boat'],
  ['tex-checkered-paving.webp', 1, 'Poly Haven texture: checkered pavement tiles'],
];
const NPICK = REFS.length;   // 14 refs picked

// per-stage timings. The whole beat is ~3.5s from the reply landing to the next switch: the queries type while the
// crawls run, the board lands as the last crawl closes, then the picks and the handoff line.
const QT = 0.20;      // seconds one query takes to type (the longest, 32 chars, at CPS)
const CPS = 160;      // chars/second the queries type at
const QSTEP = 0.22;   // gap between one query row starting and the next
const CSTEP = 0.14;   // gap between one site chip starting its crawl
const CRAWL = 0.52;   // one site's crawl, zero pages to its total
const TSTEP = 0.032;  // image tiles pop in
const PSTEP = 0.05;   // picks land one after another

// the search mark (a globe, the same glyph DeepSeek's search chip wears) and a magnifier for the query rows
const GLOBE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><ellipse cx="12" cy="12" rx="3.8" ry="8.6"/><path d="M3.6 12h16.8"/></svg>';
const MAG = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6 20.6 20.6"/></svg>';

const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.10;                                          // the search sheet rises in
    T.q = QUERIES.map((_, i) => T.card + 0.20 + i * QSTEP);      // each query row starts typing
    T.qdone = T.q.map((a) => a + QT);                            // ...and its check lands
    T.crawl = SITES.map((_, i) => T.card + 0.26 + i * CSTEP);    // each site chip starts its crawl
    T.crawlDone = T.crawl.map((a) => a + CRAWL);                 // ...and its page count tops out
    T.found = T.crawlDone[SITES.length - 1] + 0.06;              // the last chip tops out, the total line lands
    T.grid = T.found + 0.06;                                     // the reference strip drops in
    T.tile = REFS.map((_, i) => T.grid + i * TSTEP);             // tiles pop in left to right
    T.pick = REFS.map((_, i) => T.grid + 0.24 + i * PSTEP);      // ...and get picked, one by one
    T.say = T.pick[NPICK - 1] + 0.08;                            // the handoff line streams
    T.end = T.say + 1.13;                                        // the line lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;

    const qrows = QUERIES.map(() => `<div class="scr-q"><i class="scr-qi">${MAG}</i><span class="scr-qt"></span><i class="scr-curl"></i><i class="scr-qc">${x.OK}</i></div>`).join('');
    const chips = SITES.map(([host, fav, , lic]) => `<span class="scr-site"><img class="scr-fav" src="${x.img('ink/scrape/' + fav)}" alt=""/>
      <span class="scr-host">${x.esc(host)}</span><b class="scr-pg">0 pages</b><i class="scr-lic ${lic === 'CC0' ? 'is-0' : 'is-sa'}">${x.esc(lic)}</i></span>`).join('');
    const tiles = REFS.map(([file, si, what]) => `<figure class="scr-t">
      <img class="scr-im" src="${x.img('ink/scrape/' + file)}" alt="${x.esc(what)}" decoding="sync"/>
      <span class="scr-bdg"><img src="${x.img('ink/scrape/' + SITES[si][1])}" alt=""/></span>
      <span class="scr-pk">${x.OK}</span>
    </figure>`).join('');

    const card = x.el(`<div class="scr">
      <div class="scr-hd"><i class="scr-gl">${GLOBE}</i><b class="scr-hb">${x.esc(HEAD)}</b>
        <span class="scr-pill"><i class="scr-spin"></i><span class="scr-pl">Searching</span>${x.OK}</span></div>
      <div class="scr-qs">${qrows}</div>
      <div class="scr-sites">${chips}</div>
      <div class="scr-found"><i class="scr-fi">${GLOBE}</i><span>Crawled <b class="scr-n">0</b> pages</span><span class="scr-fl">across <b class="scr-libs">0</b> libraries</span></div>
      <div class="scr-grid">${tiles}</div>
      <div class="scr-foot"><b class="scr-c">0</b> refs picked</div>
    </div>`);

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const $ = (s) => card.querySelector(s);
    const rowEls = [...card.querySelectorAll('.scr-q')];
    const qts = rowEls.map((r) => r.querySelector('.scr-qt'));
    const curls = rowEls.map((r) => r.querySelector('.scr-curl'));
    const qcs = rowEls.map((r) => r.querySelector('.scr-qc'));
    const siteEls = [...card.querySelectorAll('.scr-site')];
    const pgs = siteEls.map((s) => s.querySelector('.scr-pg'));
    const lics = siteEls.map((s) => s.querySelector('.scr-lic'));
    const grid = $('.scr-grid');
    const tileEls = [...card.querySelectorAll('.scr-t')];
    const pks = tileEls.map((t) => t.querySelector('.scr-pk'));
    const found = $('.scr-found');
    const nEl = $('.scr-n');
    const libsEl = $('.scr-libs');
    const foot = $('.scr-foot');
    const cEl = $('.scr-c');
    const pill = $('.scr-pill');
    const pl = $('.scr-pl');
    const spin = $('.scr-spin');
    const pOk = pill.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // last text written per query row and per counter: the DOM is only touched when the frame's text differs, so a still
    // frame costs nothing and a seek backwards still repaints
    const was = QUERIES.map(() => '');
    let shown = -1, lastN = -1, lastC = -1, lastDone = null, lastSites = null;

    return {
      nodes: [card, say],
      // scroll marks: the thread glides to each stage as it lands, and the last one brings the handoff line into frame.
      // The strip's stop is the card's footer, not the grid itself: the "14 refs picked" line lands with the grid, and
      // stopping on the grid parked that line under the composer until the handoff mark.
      marks: [[T.card, rowEls[QUERIES.length - 1]], [T.found, siteEls[SITES.length - 1]], [T.grid, foot], [T.say - 0.12, say]],
      render(t) {
        const n = streamCount(SAY, T.say + 0.03, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the sheet rises in, then holds perfectly still
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the header pill: the spinner turns while the sweep runs, then resolves into the check, like the routing chips
        const fd = t >= T.found;
        spin.style.opacity = (1 - seg(t, T.found - 0.06, T.found + 0.05)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        pOk.style.opacity = seg(t, T.found, T.found + 0.24).toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.found, T.found + 0.26))).toFixed(4)})`;
        if (fd !== lastDone) { pill.classList.toggle('is-done', fd); pl.textContent = fd ? 'Done' : 'Searching'; lastDone = fd; }

        // the four query rows: each pops in, types its own search, then its check lands
        rowEls.forEach((row, i) => {
          const a = T.q[i];
          const p = outCubic(seg(t, a - 0.14, a + 0.16));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const ty = typed(QUERIES[i], a, CPS, t);
          const txt = QUERIES[i].slice(0, ty.n);
          if (txt !== was[i]) { was[i] = txt; qts[i].textContent = txt; }
          // the caret sits at the end of the line while that row types (deterministic blink, off once it lands)
          const live = ty.n > 0 && !ty.done;
          curls[i].style.opacity = live ? (blink(t) ? '1' : '0') : '0';
          const ck = outCubic(seg(t, T.qdone[i] - 0.04, T.qdone[i] + 0.16));
          qcs[i].style.opacity = ck.toFixed(3);
          qcs[i].style.transform = `scale(${lerp(0.4, 1, ck).toFixed(3)})`;
        });

        // the crawled libraries: each chip lands, its page count climbs while its crawl runs, then it stamps the
        // licence the run found there (the wiki's tables under CC BY-SA, the three libraries under CC0)
        let done = 0;
        const cooked = [];
        siteEls.forEach((site, i) => {
          const a = T.crawl[i];
          const p = outCubic(seg(t, a, a + 0.24));
          site.style.opacity = p.toFixed(3);
          site.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`;
          const c = outCubic(seg(t, a + 0.04, a + 0.04 + CRAWL));
          const pg = Math.round(SITES[i][2] * c);   // the number the chip shows, so the total below is its exact sum
          cooked.push(pg);
          const fin = c >= 1;
          if (fin) done++;
          if (pgs[i].textContent !== `${num(pg)} pages`) pgs[i].textContent = `${num(pg)} pages`;
          lics[i].style.opacity = outCubic(seg(t, T.crawlDone[i] - 0.06, T.crawlDone[i] + 0.14)).toFixed(3);
          site.classList.toggle('on', fin);
        });

        // "Crawled 180 pages across 4 libraries": the line lands at T.found, the moment the last chip tops out, and it
        // reads the live sum of the four counts above it (so the total is always exactly what the chips add up to) and
        // the number of libraries whose crawl has finished
        const fo = outCubic(seg(t, T.found - 0.12, T.found + 0.18));
        found.style.opacity = fo.toFixed(3);
        found.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
        const pn = cooked.reduce((s, p) => s + p, 0);
        if (pn !== lastN) { lastN = pn; nEl.textContent = num(pn); }
        if (done !== lastSites) { lastSites = done; libsEl.textContent = String(done); }

        // the reference strip: the grid drops in, its tiles pop in left to right, and each pick lands with a check
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

        // the footer counts the picks up as they land, ending on "14 refs picked"
        const picked = T.pick.reduce((a, p) => a + (t >= p ? 1 : 0), 0);
        if (picked !== lastC) { lastC = picked; cEl.textContent = String(picked); }
        const fp = outCubic(seg(t, T.grid + 0.24, T.grid + 0.54));
        foot.style.opacity = fp.toFixed(3);
        foot.style.transform = fp >= 1 ? 'none' : `translateY(${((1 - fp) * 5).toFixed(2)}px)`;
        card.classList.toggle('is-done', picked >= NPICK);
      },
    };
  },
};