// Scrape beat, THE HILLS: the routed model (DeepSeek V4 Flash) pulls the real relief of the field and checks the
// README's numbers against the record. Its line streams, the chip counts the 49 Terrarium tiles in ("Pulling 49
// tiles", 0/49 to 49/49), then the claims it sources ("Checking 7 claims", n/7 sourced), and resolves on "Checked 7
// claims". The sheet rises in the film's own grammar: the night ground, the lower-third hairline drawn in from the
// left, Cormorant SC for the kicker and the sources, EB Garamond italic for the README's own words, the host that was
// read in mono. Left, the tiles land in a diagonal sweep: the real AWS Terrarium PNGs of tools/fetch_terrain.py
// (z13, x 4474 to 4480, y 2805 to 2811), their encoded pixels under a CSS print grade (the 256 m contour is the edge
// where red steps from 128 to 129), then the fetch box of the script (49.060 to 49.215 N, 16.630 to 16.900 E) draws over them and the
// tiles outside it dim. Right, each claim lands, its lookup hairline fills from the night ice to fire, then its
// verdict stamps: VERIFIED in torch, IN RANGE in fire, EXAGGERATED in the allied map red. The tally counts them in.
//
// The tile sprite is img/az/beats/scrape/terrarium-z13-mosaic.png (the 49 tiles, nearest-neighbour 256 to 40 px, so
// every pixel is a real encoded sample); CREDITS.txt beside it lists the 49 tile URLs.
// Every claim is verbatim from the README (line 25 for the grid, line 65 for the history); every source row is one
// real lookup, read 2026-09-27:
//   38 m grid ....................... the tiles themselves: the fetch box is 19.66 km wide across fetch_terrain.py's
//                                     512 samples, 38.4 m each (tile coords x 4474.42 to 4480.57, y 2805.84 to 2811.23)
//   about 73,000 French ............. en.wikipedia.org/wiki/Battle_of_Austerlitz, infobox strength 65,000 to 75,000
//   about 85,000 Russians and ...... same page: "The Allies had about 85,000 soldiers, seventy percent of them Russian"
//   about 16,000 killed and wounded . same page, infobox casualties: 15,000 to 16,000 killed or wounded
//   11,000 captured, some 180 guns .. fr.wikipedia.org/wiki/Bataille_d'Austerlitz, Pertes: "un total de 11 453 prisonniers
//                                     de guerre" and "180 canons furent perdus" (the English page gives 12,000 to 20,000
//                                     captured and 186 cannon, so the French page is the one that was read)
//   110 km from Vienna in two days .. en.wikipedia.org: "Davout's soldiers had 48 hours to march 110 km"
//   30th Bulletin claimed 20,000 .... en.wikipedia.org: "Napoleon's account of the catastrophe was exaggerated; ... the
//                                     lakes were drained a few days after the battle, and the corpses of only two or
//                                     three men, with some 150 horses, were found." Hence EXAGGERATED, not a match.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Pulling the real hills and checking the history.';
const STAMP = { ok: 'VERIFIED', range: 'IN RANGE', over: 'EXAGGERATED' };
// [the README's words (verbatim), the source of record, the host that was read, verdict]
const ROWS = [
  ['38 m grid', '19.66 KM / 512 = 38.4 M', 's3.amazonaws.com', 'ok'],
  ['about 73,000 French', 'STRENGTH 65,000 TO 75,000', 'en.wikipedia.org', 'range'],
  ['about 85,000 Russians and Austrians', 'ALLIES HAD ABOUT 85,000', 'en.wikipedia.org', 'ok'],
  ['about 16,000 killed and wounded', 'INFOBOX 15,000 TO 16,000', 'en.wikipedia.org', 'range'],
  ['11,000 captured, with some 180 guns', '11,453 CAPTURED, 180 GUNS', 'fr.wikipedia.org', 'ok'],
  ['about 110 km from Vienna in two days', '48 HOURS TO MARCH 110 KM', 'en.wikipedia.org', 'ok'],
  ['30th Bulletin claimed 20,000 drowned', 'DRAINED, TWO OR THREE MEN', 'en.wikipedia.org', 'over'],
];
const LOOK = 0.24;   // one row's lookup, claim landed to verdict stamped
const TALLY = [['ok', 'verified'], ['range', 'in range'], ['over', 'exaggerated']];
// the tiles: 7 x 7 at z13, x 4474..4480 by y 2805..2811, each a cell of the sprite
const N = 7, TILES = N * N, CELL = 19;
const TILE0 = 0.08, SWEEP = 0.36, TFADE = 0.1;   // after the card: first tile, the sweep across the 13 diagonals, one tile's fade

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.row = ROWS.map((_, i) => r + 0.5 + i * 0.1);    // each claim lands (the last at r + 1.10)
    T.stamp = T.row.map((a) => a + LOOK);             // its verdict stamps (the first at r + 0.74, as the tiles finish; the last at r + 1.34)
    T.done = r + 1.53;   // the chip resolves: Checked 7 claims
    T.end = T.done + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const tilesIn = T.card + TILE0 + SWEEP + TFADE;   // the last tile has landed (r + 0.76)
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Pulling ${TILES} tiles</span><b class="sc-count">0/${TILES}</b></div></div>`);
    const cells = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cells.push(`<i class="sc-t" style="left:${i * CELL}px;top:${j * CELL}px;background-position:${-i * CELL}px ${-j * CELL}px"></i>`);
    const row = ([claim, src, host, st]) => `<div class="sc-row sc-st-${st}">
        <span class="sc-claim">“${x.esc(claim)}”</span>
        <span class="sc-stamp"><b>looking up</b></span>
        <span class="sc-src"><span class="sc-caps">${x.esc(src)}</span><code>${x.esc(host)}</code></span>
        <span class="sc-look"><i></i></span>
      </div>`;
    const card = x.el(`<div class="sc-card">
      <div class="sc-head"><i class="sc-rule"></i><span class="sc-kicker">THE HILLS</span><b class="sc-title">Terrarium tiles, z13</b><span class="sc-n">${TILES} TILES · ${ROWS.length} CLAIMS</span></div>
      <div class="sc-body">
        <div class="sc-map">
          <div class="sc-tiles">${cells.join('')}<i class="sc-box"></i></div>
          <div class="sc-mcap"><span>19.7 × 17.1 KM</span><span>178 TO 388 M</span></div>
        </div>
        <div class="sc-rows">${ROWS.map(row).join('')}</div>
      </div>
      <div class="sc-tally">${TALLY.map(([st, w]) => `<span class="sc-st-${st}"><b>0</b> ${w}</span>`).join('')}</div>
    </div>`);
    const tiles = [...card.querySelectorAll('.sc-t')].map((n, q) => ({ n, a: T.card + TILE0 + (((q % N) + Math.floor(q / N)) / (2 * N - 2)) * SWEEP }));
    const box = card.querySelector('.sc-box'), mcap = card.querySelector('.sc-mcap');
    const rows = [...card.querySelectorAll('.sc-row')].map((n) => ({ n, stamp: n.querySelector('.sc-stamp'), word: n.querySelector('.sc-stamp b'), look: n.querySelector('.sc-look i') }));
    const tally = [...card.querySelectorAll('.sc-tally > span')].map((n) => n.querySelector('b'));
    const head = card.querySelector('.sc-head'), rule = card.querySelector('.sc-rule'), tallyEl = card.querySelector('.sc-tally');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    const verified = ROWS.filter((r) => r[3] === 'ok').length;
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: the tiles count in, then the sourced claims, then a check and "Checked 7 claims"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done, pulled = t >= tilesIn;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Checked ${ROWS.length} claims` : pulled ? `Checking ${ROWS.length} claims` : `Pulling ${TILES} tiles`);

        // the sheet rises; its hairline draws in from the left, as the film's lower thirds do
        rise(card, seg(t, T.card, T.card + 0.4), 14);
        rise(head, seg(t, T.card + 0.04, T.card + 0.3), 4);
        rule.style.transform = `scaleX(${outCubic(seg(t, T.card + 0.06, T.card + 0.34)).toFixed(4)})`;

        // the tiles land in a diagonal sweep from the north west; then the fetch box draws and the rest dims
        let landed = 0;
        tiles.forEach((m) => {
          const p = seg(t, m.a, m.a + TFADE);
          if (p > 0) landed++;
          m.n.style.opacity = outCubic(p).toFixed(3);
          m.n.style.transform = p >= 1 ? '' : `scale(${(0.82 + 0.18 * outCubic(p)).toFixed(4)})`;
        });
        const bp = outCubic(seg(t, tilesIn - 0.06, tilesIn + 0.16));
        box.style.opacity = bp.toFixed(3);
        box.style.transform = bp >= 1 ? '' : `scale(${(1.08 - 0.08 * bp).toFixed(4)})`;
        rise(mcap, seg(t, tilesIn, tilesIn + 0.22), 3);

        // each claim lands, its lookup hairline fills, then the verdict stamps in with a small settle
        const counts = { ok: 0, range: 0, over: 0 };
        rows.forEach((m, i) => {
          const a = T.row[i], b = T.stamp[i], st = ROWS[i][3];
          rise(m.n, seg(t, a, a + 0.2), 5);
          m.look.style.transform = `scaleX(${outCubic(seg(t, a + 0.04, b)).toFixed(4)})`;
          const on = t >= b;
          m.n.classList.toggle('on', on);
          set(m.word, on ? STAMP[st] : 'looking up');
          const p = seg(t, b, b + 0.18);
          m.stamp.style.transform = on && p < 1 ? `scale(${(1.18 - 0.18 * outBack(p)).toFixed(4)})` : '';
          if (on) counts[st]++;
        });
        const sourced = counts.ok + counts.range + counts.over;
        set(ccount, done ? `${verified} verified` : pulled ? `${sourced}/${ROWS.length} sourced` : `${landed}/${TILES}`);

        // the tally counts each verdict in as it lands
        rise(tallyEl, seg(t, T.stamp[0] - 0.06, T.stamp[0] + 0.2), 3);
        tally.forEach((b, i) => set(b, String(counts[TALLY[i][0]])));
      },
    };
  },
};
