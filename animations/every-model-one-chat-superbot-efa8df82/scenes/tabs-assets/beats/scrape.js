// DeepSeek V4 Flash, the scrape: a tool chip sweeps six subreddits (each pill lights in turn and counts its posts
// while the chip's total climbs), then the five formats it found come back as Muse memes, each resolving out of a
// blur under its own sweeping band. Subreddit post counts are made up.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { MEMES, memeHTML } from './memes.js?v=1';

const SAY = 'Scraped 6 subreddits and remixed the 5 hottest formats with Muse.';
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/socialnetwork', 198], ['r/MemeTemplates', 146]];
const TOTAL = SUBS.reduce((s, [, n]) => s + n, 0);
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.sub = SUBS.map((_, i) => r + 0.35 + i * 0.22);
    T.scDone = T.sub[SUBS.length - 1] + 0.6;
    T.grid = T.scDone + 0.25;
    T.w = MEMES.map((_, i) => [T.grid + 0.15 + i * 0.26, T.grid + 1.0 + i * 0.26]);
    T.end = T.w[MEMES.length - 1][1] + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping Reddit</span><b class="yt-count">0 posts</b></div></div>');
    const subs = x.el(`<div class="sc-subs">${SUBS.map(([s]) => `<span class="sc-sub"><img src="${x.brand('reddit-logo.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const genl = x.el(`<div class="mm-genl">${x.tile(k.app)}<span>Making 5 Muse memes</span><b class="mm-n">0/5</b></div>`);
    const grid = x.el(`<div class="mm-grid">${MEMES.map((m) => `<span class="mm-cell">${memeHTML(x, m)}<i class="qc-gen"></i></span>`).join('')}</div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...subs.children].map((p) => ({ p, n: p.querySelector('b') }));
    const cells = [...grid.children].map((c) => ({ c, mm: c.querySelector('.mm'), gen: c.querySelector('.qc-gen') }));
    const vis = say.firstElementChild, hid = say.lastElementChild, n5 = genl.querySelector('.mm-n'), glab = genl.querySelector('span:not(.qc-tile)');
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, subs, genl, grid],
      marks: [[T.r, say], [T.chip, chip], [T.sub[0], subs], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the sweep: each pill lands, counts up its posts, then settles lit
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.scDone;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Scraped Reddit' : 'Scraping Reddit';
        if (clab.textContent !== cl) clab.textContent = cl;
        let sum = 0;
        subs.style.opacity = t >= T.sub[0] - 0.05 ? '1' : '0';
        pills.forEach(({ p, n: b }, i) => {
          const a = T.sub[i];
          rise(p, seg(t, a, a + 0.28), 6);
          const c = SUBS[i][1] * outCubic(seg(t, a + 0.05, a + 0.55));
          sum += c;
          const s = num(c);
          if (b.textContent !== s) b.textContent = s;
          p.classList.toggle('on', t >= a + 0.55);
        });
        const cs = `${num(done ? TOTAL : sum)} posts`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // the five memes, a beat apart
        const gi = outCubic(seg(t, T.grid - 0.1, T.grid + 0.35));
        genl.style.opacity = gi.toFixed(3);
        grid.style.opacity = gi.toFixed(3);
        const gl = t >= T.w[4][1] ? 'Made 5 Muse memes' : 'Making 5 Muse memes';
        if (glab.textContent !== gl) glab.textContent = gl;
        let made = 0;
        cells.forEach(({ c, mm, gen }, i) => {
          const [a, b] = T.w[i];
          const ci = outCubic(seg(t, a - 0.2, a + 0.2));
          c.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.94, 1, ci).toFixed(4)})`;
          c.style.opacity = ci.toFixed(3);
          const p = seg(t, a, b), e = outCubic(p);
          mm.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
          mm.style.opacity = lerp(0.35, 1, e).toFixed(3);
          gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
          gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
          if (t >= b) made++;
        });
        const lab = `${made}/5`;
        if (n5.textContent !== lab) n5.textContent = lab;
      },
    };
  },
};
