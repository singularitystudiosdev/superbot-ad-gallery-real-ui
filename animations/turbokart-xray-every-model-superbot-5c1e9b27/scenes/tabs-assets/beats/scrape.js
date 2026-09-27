// Scrape beat: the routed model (DeepSeek V4 Flash) pulls kart-racer design references before anything is built.
// Its line streams, the "Reading 5 pages" chip spins while its note counter climbs, and the reference card rises:
// each row lands with the page's real favicon, title and host, a thin fetch bar fills under it, then the one fact
// DeepSeek keeps from that page types in and the row stamps a check. Every page is real and was fetched to confirm
// it resolves, and every fact is what that page says (URLs and quotes in img/tkr-beats/scrape/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Pulling kart-racer references first.';
// [favicon, page title, host, the fact kept from it]
const PAGES = [
  ['tkr-beats/scrape/mariowiki.png', 'Drift', 'mariowiki.com/Drift', 'hop first, then hold the turn to drift'],
  ['tkr-beats/scrape/mariowiki.png', 'Mini-Turbo', 'mariowiki.com/Mini-Turbo', 'boost tiers last 0.621s, 1.674s, 2.633s'],
  ['tkr-beats/scrape/mariowiki.png', 'Mario Kart 8 item probability distributions', 'mariowiki.com', 'item odds follow your distance from 1st'],
  ['tkr-beats/scrape/mariowiki.png', 'Mario Kart', 'mariowiki.com/100cc', 'engine classes: 50cc, 100cc, 150cc, Mirror'],
  ['tkr-beats/scrape/gamedeveloper.png', 'The Pure Advantage: Advanced Racing Game AI', 'gamedeveloper.com', 'speed-only rubber banding reads as unfair'],
];
const STAGGER = 0.16; // one row landing to the next
const FETCH = 0.32;   // a row's fetch bar, empty to full
const CPS = 100;      // how fast a kept fact types in
const NOTE = 'notes/kart-refs.md';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.row = PAGES.map((_, i) => r + 0.3 + i * STAGGER);
    T.got = T.row.map((a) => a + 0.08 + FETCH + 0.05);                             // page fetched (bar gone), fact starts
    T.fact = PAGES.map((p, i) => T.got[i] + p[3].length / CPS);                   // fact fully typed, row checks
    T.done = T.fact[PAGES.length - 1] + 0.1;                                      // the chip resolves
    T.foot = T.done - 0.05;
    T.end = T.done + 0.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Reading ${PAGES.length} pages</span><b class="sc-count">0 notes</b></div></div>`);
    const card = x.el(`<div class="sc-card sc-refs">
      <div class="sc-rows">${PAGES.map(([ico, title, host]) => `<div class="sc-ref">
        <span class="sc-ico"><img src="${x.img(ico)}" alt=""/></span>
        <span class="sc-main">
          <span class="sc-line"><b class="sc-title">${x.esc(title)}</b><small class="sc-host">${x.esc(host)}</small></span>
          <span class="sc-fact"><span class="sc-fv"></span><span class="sc-fh"></span></span>
          <span class="sc-bar"><i></i></span>
        </span>
        <span class="sc-st"><i class="sc-dot"></i>${x.OK}</span>
      </div>`).join('')}</div>
      <div class="sc-foot"><span>Kept ${PAGES.length} notes for the build</span><small>${x.esc(NOTE)}</small></div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-ref')].map((row, i) => ({
      row, bar: row.querySelector('.sc-bar'), fill: row.querySelector('.sc-bar i'),
      fv: row.querySelector('.sc-fv'), fh: row.querySelector('.sc-fh'), dot: row.querySelector('.sc-dot'),
      ok: row.querySelector('.sc-st .qc-ok'), fact: PAGES[i][3], shown: -1,
    }));
    const foot = card.querySelector('.sc-foot');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[PAGES.length - 1], rows[PAGES.length - 1].row], [T.foot, foot]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: spinner and a climbing note count, then a check and "Read 5 pages"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Read ${PAGES.length} pages` : `Reading ${PAGES.length} pages`);
        const notes = T.fact.filter((f) => t >= f).length;
        set(ccount, `${notes} note${notes === 1 ? '' : 's'}`);

        rise(card, seg(t, T.card, T.card + 0.4), 14);

        // each page: lands, its fetch bar fills, the kept fact types in, the row checks
        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.24), 5);
          const f = seg(t, a + 0.08, T.got[i] - 0.05);
          m.fill.style.transform = `scaleX(${Math.max(0.02, outCubic(f)).toFixed(4)})`;
          m.bar.style.opacity = (1 - seg(t, T.got[i] - 0.06, T.got[i])).toFixed(3);
          const c = streamCount(m.fact, T.got[i], CPS, t);
          if (c !== m.shown) { m.fv.textContent = m.fact.slice(0, c); m.fh.textContent = m.fact.slice(c); m.shown = c; }
          const fin = t >= T.fact[i];
          m.row.classList.toggle('on', fin);
          m.dot.style.opacity = fin ? '0' : (0.35 + 0.65 * Math.abs(Math.sin((t - a) * 7))).toFixed(3);
          const o = seg(t, T.fact[i], T.fact[i] + 0.26);
          m.ok.style.opacity = o.toFixed(3);
          m.ok.style.transform = `scale(${(0.3 + 0.7 * outBack(o)).toFixed(4)})`;
        });

        rise(foot, seg(t, T.foot, T.foot + 0.3), 4);
      },
    };
  },
};
