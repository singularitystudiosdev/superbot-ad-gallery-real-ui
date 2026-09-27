// DeepSeek V4 Flash web-search beat, the first step of the chain. superbot hands DeepSeek the research for "make a
// viral film: 18 months to escape the permanent underclass": it runs four searches ("permanent underclass meme",
// "escape velocity AGI", "18 months to escape", "fashion film moodboard server halls highways"), each query row types
// itself in and ticks off as it lands, a "Searched 11 web pages" line counts up under them with the three sources it
// read listed like DeepSeek's own sources panel (favicon, page title, url; all real pages, no quotes put in anyone's
// mouth), then the moodboard drops in: eight REAL frames, each stamped with the source it came from, picked one by one
// with a check until the footer reads 8 refs picked and the reply closes on the handoff line to Midjourney.
//
// Referent: chat.deepseek.com's web-search mode: a "Found N results" line above the answer and a sources panel listing
// favicon + title + url on a near-black sheet. This beat keeps that vocabulary on the hub's own tokens (#121216 sheet,
// inset 1px #2a2a2e, var(--ui)).
//
// IMAGERY / SOURCING (nothing hand-drawn; every file in img/v4/search/, listed with sources in its CREDITS.txt):
//   mood-01..08.webp  frames of @anabology's "18 MONTHS TO ESCAPE" film (x.com/anabology/status/2103534482930491441),
//                     ffmpeg -ss, 3:2 crop, 480x320 webp. (c) anabology.
//   fav-*.png         the sites' own favicons via google.com/s2/favicons, used nominatively to label the pages read.
// The source rows name real pages by their published titles: Wikipedia's "Escape velocity" article, @achxvi's post
// "Opus 5.5 did this in 15 minutes", and the github repo yihui-dev/awesome-opus5-5-videos.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or transition,
// so ?t=<sec> freezes an exact frame.
import { lerp, seg, outCubic, outBack, typed, streamCount, blink } from '../../../lib.js';

const SAY = '8 refs picked, sending the moodboard to Midjourney.';
const HEAD = 'Web search';
const PAGES = 11;   // pages the run reports reading

// the four searches, in the order their rows type themselves in
const QUERIES = ['permanent underclass meme', 'escape velocity AGI', '18 months to escape', 'fashion film moodboard, server halls, highways'];

// the pages the run lists as its sources: [host, favicon, page title, path]; every one is a real page
const SOURCES = [
  ['en.wikipedia.org', 'fav-en.wikipedia.org.png', 'Escape velocity', '/wiki/Escape_velocity'],
  ['x.com', 'fav-x.com.png', '@achxvi: Opus 5.5 did this in 15 minutes', '/achxvi/status/2103918792845963545'],
  ['github.com', 'fav-github.com.png', 'awesome-opus5-5-videos', '/yihui-dev/awesome-opus5-5-videos'],
];
const X = 1; // index of x.com in SOURCES: the moodboard frames come from the film's own post

// the eight moodboard tiles: [file in img/v4/search, index into SOURCES]
const REFS = [
  ['mood-01.webp', X], ['mood-02.webp', X], ['mood-03.webp', X], ['mood-04.webp', X],
  ['mood-05.webp', X], ['mood-06.webp', X], ['mood-07.webp', X], ['mood-08.webp', X],
];
const NPICK = REFS.length;   // 8 refs picked

// per-query timings: the row pops in, types for QT, then its check lands
const QT = 0.26;      // seconds the longest query takes to type
const QSTEP = 0.28;   // gap between one query starting and the next
const CPS = 180;      // chars/second the queries type at (the longest query's length / QT, rounded up)
const SRC = 0.09;     // source rows land one after another
const TSTEP = 0.05;   // image tiles pop in
const PSTEP = 0.07;   // picks land one after another

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
    T.src = SOURCES.map((_, i) => T.found + 0.12 + i * SRC);   // the source rows
    T.grid = T.src[SOURCES.length - 1] + 0.3;                  // the moodboard drops in
    T.tile = REFS.map((_, i) => T.grid + i * TSTEP);           // tiles pop in left to right
    T.pick = REFS.map((_, i) => T.grid + 0.34 + i * PSTEP);    // ...and get picked, one by one
    T.say = T.pick[NPICK - 1] + 0.10;                          // the handoff line streams
    T.end = T.say + 0.8;                                       // the line lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;

    const qrows = QUERIES.map(() => `<div class="dss-q"><i class="dss-qi">${MAG}</i><span class="dss-qt"></span><i class="dss-curl"></i><i class="dss-qc">${x.OK}</i></div>`).join('');
    const srcs = SOURCES.map(([host, fav, title, path], i) => `<div class="dss-src">
      <span class="dss-sn">${i + 1}</span><img src="${x.img('v4/search/' + fav)}" alt=""/>
      <span class="dss-st">${x.esc(title)}</span><span class="dss-su">${x.esc(host + path)}</span>
    </div>`).join('');
    const tiles = REFS.map(([file, si]) => `<figure class="dss-t">
      <img class="dss-im" src="${x.img('v4/search/' + file)}" alt="" decoding="sync"/>
      <span class="dss-bdg"><img src="${x.img('v4/search/' + SOURCES[si][1])}" alt=""/></span>
      <span class="dss-pk">${x.OK}</span>
    </figure>`).join('');

    const card = x.el(`<div class="dss">
      <div class="dss-hd"><i class="dss-gl">${GLOBE}</i><b class="dss-hb">${x.esc(HEAD)}</b>
        <span class="dss-pill"><i class="dss-spin"></i><span class="dss-pl">Searching</span>${x.OK}</span></div>
      <div class="dss-qs">${qrows}</div>
      <div class="dss-found"><i class="dss-fi">${GLOBE}</i><span>Searched <b class="dss-n">0</b> web pages</span></div>
      <div class="dss-srcs">${srcs}</div>
      <div class="dss-grid">${tiles}</div>
      <div class="dss-foot"><b class="dss-c">0</b> refs picked for the moodboard</div>
    </div>`);

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const $ = (s) => card.querySelector(s);
    const rowEls = [...card.querySelectorAll('.dss-q')];
    const qts = rowEls.map((r) => r.querySelector('.dss-qt'));
    const curls = rowEls.map((r) => r.querySelector('.dss-curl'));
    const qcs = rowEls.map((r) => r.querySelector('.dss-qc'));
    const srcEls = [...card.querySelectorAll('.dss-src')];
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
      // The grid's stop is the card's footer, so the "8 refs picked" line never parks under the composer.
      marks: [[T.card, rowEls[QUERIES.length - 1]], [T.found, srcEls[SOURCES.length - 1]], [T.grid, foot], [T.say - 0.12, say]],
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

        // the source rows: one per page listed, each carrying that site's own favicon
        srcEls.forEach((row, i) => {
          const cp = outCubic(seg(t, T.src[i], T.src[i] + 0.24));
          row.style.opacity = cp.toFixed(3);
          row.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 5).toFixed(2)}px)`;
        });

        // the moodboard: the grid drops in, its tiles pop in left to right, and each pick lands with a check
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

        // the footer counts the picks up as they land, ending on "8 refs picked"
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
