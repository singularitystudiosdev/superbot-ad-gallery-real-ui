// DeepSeek V4 Flash web-search beat, the second step of ?v=4. superbot hands DeepSeek the asset half of the Pocketsflow
// launch video: it runs four searches ("curly-haired halftone mascot", "creator storefront checkout", "Apple Pay upsell
// flow", "Swiss type, mono timecodes"), each query row types itself in and ticks off as it lands, a "Searched 9 web
// pages" line counts up under them with a row of citation chips carrying the real favicons of the sources it read, then
// the image results grid drops in: twelve REAL reference pictures, each stamped with the source it came from, and
// picked one by one with a check until the footer reads 12 refs picked and the reply closes on the handoff line to Meshy.
//
// Referent: chat.deepseek.com's web-search mode (checked against a real screen capture before styling): a "Found N
// results" line above the answer, numbered inline citations, and a sources panel listing favicon + title + url on a
// near-black sheet. This beat keeps that vocabulary on the hub's own tokens (#121216 sheet, inset 1px #2a2a2e, var(--ui)).
//
// IMAGERY / SOURCING (none of it hand-drawn; every file in img/pf/search/, 480x320 webp, see img/CREDITS.txt):
//   ref-01..12.webp are frame crops of the Pocketsflow launch film posted by @achxvi (the mascot, the type, the product
//     cards and the end card are Pocketsflow's, pocketsflow.com): 01 the mascot and its "pssst" bubble (0.9s), 02 "Got
//     something to sell?" (2.2s), 03 the three product cards on blue, 04 the mascot on blue, 05 the course laptop,
//     06 the ebook stack, 07 the app blocks (all 4.2s), 08 the phone storefront (6.7s), 09 taxes and payouts (10.5s),
//     10 the checkout total, 11 the upsells (both 10.2s), 12 the end card (14.2s). Every grid tile is badged with
//     pocketsflow.com, the brand whose film it is.
//   favicons (fav-*.png): the sites' own marks, used nominatively to label the pages the search read, all from Google's
//     public favicon service, google.com/s2/favicons?domain=<host>&sz=64 (pocketsflow.com, dribbble.com, mobbin.com,
//     reddit.com). dribbble.com, mobbin.com and reddit.com are listed as pages the run consulted, and no grid image is
//     claimed from them. The search, its counts and the result list are staged for the spot; the pictures and the
//     favicons are not.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or transition,
// so ?t=<sec> freezes an exact frame.
import { lerp, seg, outCubic, outBack, typed, streamCount, blink } from '../../../lib.js';

const SAY = '12 refs picked, sending to Meshy.';
const HEAD = 'Web search';
const PAGES = 9;   // pages the run reports reading

// the four searches, in the order their rows type themselves in
const QUERIES = ['curly-haired halftone mascot', 'creator storefront checkout', 'Apple Pay upsell flow', 'Swiss type, mono timecodes'];

// the pages the run read, in the order their citation chips land
const SOURCES = [
  ['pocketsflow.com', 'fav-pocketsflow.com.png'],
  ['dribbble.com', 'fav-dribbble.com.png'],
  ['mobbin.com', 'fav-mobbin.com.png'],
  ['reddit.com', 'fav-reddit.com.png'],
];

// the twelve image results: [file in img/pf/search, index into SOURCES]. Every one of them is a real frame of the
// Pocketsflow film (see IMAGERY above), so the grid is a real reference board, not an illustration of one.
const REFS = Array.from({ length: 12 }, (_, i) => [`ref-${String(i + 1).padStart(2, '0')}.webp`, 0]);
const NPICK = REFS.length;   // 12 refs picked

// per-query timings: the row pops in, types for QT, then its check lands
const QT = 0.22;      // seconds one query takes to type (the longest, 28 chars, at CPS)
const QSTEP = 0.28;   // gap between one query starting and the next
const CPS = 128;      // chars/second the queries type at (QT / a query's own length)
const CHIP = 0.055;   // citation chips land one after another
const TSTEP = 0.05;   // image tiles pop in
const PSTEP = 0.06;   // picks land one after another

// the search mark (a globe, the same glyph DeepSeek's search chip wears) and a magnifier for the query rows
const GLOBE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><ellipse cx="12" cy="12" rx="3.8" ry="8.6"/><path d="M3.6 12h16.8"/></svg>';
const MAG = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6 20.6 20.6"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.16;                                        // the search sheet rises in
    T.q = QUERIES.map((_, i) => T.card + 0.30 + i * QSTEP);    // each query row starts typing
    T.qdone = T.q.map((a) => a + QT);                          // ...and its check lands
    T.found = T.qdone[QUERIES.length - 1] + 0.16;              // "Searched N web pages" counts up
    T.chips = SOURCES.map((_, i) => T.found + 0.10 + i * CHIP); // the citation chips
    T.grid = T.found + 0.20;                                   // the image results grid drops in
    T.tile = REFS.map((_, i) => T.grid + i * TSTEP);           // tiles pop in left to right
    T.pick = REFS.map((_, i) => T.grid + 0.34 + i * PSTEP);    // ...and get picked, one by one
    T.say = T.pick[NPICK - 1] + 0.10;                          // the handoff line streams
    T.end = T.say + 0.95;                                      // the line lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;

    const qrows = QUERIES.map((q) => `<div class="dss-q"><i class="dss-qi">${MAG}</i><span class="dss-qt"></span><i class="dss-curl"></i><i class="dss-qc">${x.OK}</i></div>`).join('');
    const chips = SOURCES.map(([host, fav]) => `<span class="dss-chip"><img src="${x.img('pf/search/' + fav)}" alt=""/><span>${x.esc(host)}</span></span>`).join('');
    const tiles = REFS.map(([file, si]) => `<figure class="dss-t">
      <img class="dss-im" src="${x.img('pf/search/' + file)}" alt="" decoding="sync"/>
      <span class="dss-bdg"><img src="${x.img('pf/search/' + SOURCES[si][1])}" alt=""/></span>
      <span class="dss-pk">${x.OK}</span>
    </figure>`).join('');

    const card = x.el(`<div class="dss">
      <div class="dss-hd"><i class="dss-gl">${GLOBE}</i><b class="dss-hb">${x.esc(HEAD)}</b>
        <span class="dss-pill"><i class="dss-spin"></i><span class="dss-pl">Searching</span>${x.OK}</span></div>
      <div class="dss-qs">${qrows}</div>
      <div class="dss-found"><i class="dss-fi">${GLOBE}</i><span>Searched <b class="dss-n">0</b> web pages</span></div>
      <div class="dss-chips">${chips}</div>
      <div class="dss-grid">${tiles}</div>
      <div class="dss-foot"><b class="dss-c">0</b> refs picked</div>
    </div>`);

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const $ = (s) => card.querySelector(s);
    const rowEls = [...card.querySelectorAll('.dss-q')];
    const qts = rowEls.map((r) => r.querySelector('.dss-qt'));
    const curls = rowEls.map((r) => r.querySelector('.dss-curl'));
    const qcs = rowEls.map((r) => r.querySelector('.dss-qc'));
    const chipEls = [...card.querySelectorAll('.dss-chip')];
    const grid = $('.dss-grid');
    const tileEls = [...card.querySelectorAll('.dss-t')];
    const pks = tileEls.map((t) => t.querySelector('.dss-pk'));
    const found = $('.dss-found');
    const nEl = $('.dss-n');
    const foot = $('.dss-foot');
    const cEl = $('.dss-c');
    const pill = $('.dss-pill');
    const pl = $('.dss-pl');
    const spin = $('.dss-spin');
    const pOk = pill.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // last text written per query row and per counter: the DOM is only touched when the frame's text differs, so a still
    // frame costs nothing and a seek backwards still repaints
    const was = new Array(QUERIES.length).fill('');
    let shown = -1, lastN = -1, lastC = -1, lastDone = null;

    return {
      nodes: [card, say],
      // scroll marks: the thread glides to each stage as it lands, and the last one brings the handoff line into frame.
      // The grid's stop is the card's footer, not the grid itself: the "12 refs picked" line lands with the grid, and
      // stopping on the grid parked that line under the composer until the handoff mark.
      marks: [[T.card, rowEls[QUERIES.length - 1]], [T.found, chipEls[0]], [T.grid, foot], [T.say - 0.12, say]],
      render(t) {
        const n = streamCount(SAY, T.say + 0.03, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the sheet rises in, then holds perfectly still
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the header pill: the spinner turns while the search runs, then resolves into the check, like the routing chips
        const fd = t >= T.found;
        spin.style.opacity = (1 - seg(t, T.found - 0.06, T.found + 0.05)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        pOk.style.opacity = seg(t, T.found, T.found + 0.24).toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.found, T.found + 0.26))).toFixed(4)})`;
        if (fd !== lastDone) { pill.classList.toggle('is-done', fd); pl.textContent = fd ? 'Done' : 'Searching'; lastDone = fd; }

        // the four query rows: each pops in, types its own text, then its check lands
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

        // "Searched N web pages": the line lands at T.found and the count counts up to the pages it read
        const fo = outCubic(seg(t, T.found - 0.12, T.found + 0.18));
        found.style.opacity = fo.toFixed(3);
        found.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
        const pn = Math.round(PAGES * outCubic(seg(t, T.found, T.found + 0.5)));
        if (pn !== lastN) { lastN = pn; nEl.textContent = String(pn); }

        // the citation chips: one per page read, each carrying that site's own favicon
        chipEls.forEach((chip, i) => {
          const cp = outCubic(seg(t, T.chips[i], T.chips[i] + 0.22));
          chip.style.opacity = cp.toFixed(3);
          chip.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 5).toFixed(2)}px)`;
        });

        // the image results: the grid drops in, its tiles pop in left to right, and each pick lands with a check
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

        // the footer counts the picks up as they land, ending on "12 refs picked"
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