// Research beat: DeepSeek V4 Flash does the digging. A tool chip sweeps six sources, each pill counting the pages it
// read, while the chip's total climbs; then the three things it kept land as rows: a manufacturer spec sheet, a price
// history CSV and a reference clip. The FIRST row is the point of this beat: the spec sheet answers HTTP 403 to every
// other model, and DeepSeek opens it anyway (the row carries the block, then the green "opened" flip). Footer:
// "58 pages read · 12 blocked pages DeepSeek opened anyway". Counts are made up for the spot; the block behaviour is
// the one DeepSeek is actually used for. Pure function of t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scraped the specs, the prices and the reference clips. 12 pages were blocked to the others.';
const SITES = [['TechRadar', 14], ['Sweetwater', 9], ['Reddit', 11], ['camelcamelcamel', 8], ['SpecSheet', 6], ['Vimeo', 10]];
const TOTAL = SITES.reduce((s, [, n]) => s + n, 0);
const KEPT = [
  ['Manufacturer spec sheet', 'specsheet.example · PDF', 'blocked'],
  ['Price history', 'camelcamelcamel.example · CSV', 'rows'],
  ['Reference clip', 'vimeo.example · 1080p', 'clip'],
];
const FOOT = '58 pages read · 12 blocked pages DeepSeek opened anyway';
// timing (seconds from the reply start)
const CPS = 90;
const SAY_AT = 0.05;
const CHIP = 0.06;
const CHIP_IN = 0.24;
const SITE_AT = 0.14;
const SITE_STAGGER = 0.07;
const SITE_RUN = 0.34;
const DONE_AT = 0.72;
const ROW_AT = 0.5;
const ROW_STAGGER = 0.15;
const ROW_IN = 0.22;
const FLIP = 0.5;              // the blocked row flips to "opened" this long after it lands
const FOOT_AT = 1.5;
const FOOT_IN = 0.2;

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + CHIP;
    T.site = SITES.map((_, i) => r + SITE_AT + i * SITE_STAGGER);
    T.done = r + DONE_AT;
    T.row = KEPT.map((_, i) => r + ROW_AT + i * ROW_STAGGER);
    T.flip = T.row[0] + FLIP;
    T.foot = r + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rs-card">
      <div class="rs-hd"><span class="rs-st"><i class="rs-spin"></i>${x.OK}</span><b>Scraping for the specs and prices</b><span class="rs-n">0 pages</span></div>
      <div class="rs-src">${SITES.map(([s]) => `<span class="rs-pill"><b>${x.esc(s)}</b><span class="rs-pn">0</span></span>`).join('')}</div>
      <div class="rs-rows">${KEPT.map(([name, meta, tag], i) => `<div class="rs-row"${i === 0 ? ' data-blocked="1"' : ''}>
        <span class="rs-doc"><i></i></span><span class="rs-rx"><b>${x.esc(name)}</b><small>${x.esc(meta)}</small></span>
        ${i === 0 ? `<span class="rs-block">HTTP 403</span><span class="rs-open">${x.OK}<span>opened</span></span>`
          : i === 1 ? `<span class="rs-chip">412 rows</span>` : `<span class="rs-chip">14.6 MB</span>`}
      </div>`).join('')}</div>
      <div class="rs-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const spin = $('.rs-spin'), ok = $('.rs-st .qc-ok'), n = $('.rs-n');
    const pills = [...card.querySelectorAll('.rs-pill')].map((p) => ({ p, c: p.querySelector('.rs-pn') }));
    const rows = [...card.querySelectorAll('.rs-row')];
    const blk = $('.rs-block'), openn = $('.rs-open'), ft = $('.rs-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.chip, card], [T.row[0], rows[0]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.chip, T.chip + CHIP_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.chip) * 420).toFixed(1)}deg)`;
        const o = outCubic(seg(t, T.done, T.done + 0.2));
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        let sum = 0;
        pills.forEach(({ p, c }, i) => {
          const a = T.site[i];
          const e = outCubic(seg(t, a, a + SITE_RUN));
          p.style.opacity = e.toFixed(3);
          p.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 6).toFixed(2)}px)`;
          const v = SITES[i][1] * e;
          sum += v;
          const s = fmt(Math.round(v));
          if (c.textContent !== s) c.textContent = s;
          p.classList.toggle('on', t >= a + SITE_RUN);
        });
        const cn = `${fmt(done ? TOTAL : Math.round(sum))} pages`;
        if (cn !== count) { n.textContent = cn; count = cn; }
        rows.forEach((r, i) => {
          const e = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          r.style.opacity = e.toFixed(3);
          r.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.flip, T.flip + 0.24));
        blk.style.opacity = (1 - f).toFixed(3);
        openn.style.opacity = f.toFixed(3);
        openn.style.transform = f >= 1 ? 'none' : `scale(${lerp(0.6, 1, f).toFixed(3)})`;
        const fo = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = fo.toFixed(3);
        ft.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
      },
    };
  },
};