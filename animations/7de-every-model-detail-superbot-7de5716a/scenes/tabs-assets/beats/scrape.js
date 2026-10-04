// DeepSeek V4 Flash, the scrape: a tool chip sweeps six subreddits, each pill lighting in turn and counting its
// posts while the chip's total climbs. Subreddit post counts are made up.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scraped 6 subreddits. Found 5 more Muse memes blowing up.';
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/socialnetwork', 198], ['r/MemeTemplates', 146]];
const TOTAL = SUBS.reduce((s, [, n]) => s + n, 0);
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.sub = SUBS.map((_, i) => r + 0.35 + i * 0.22);
    T.scDone = T.sub[SUBS.length - 1] + 0.6;
    T.end = T.scDone + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Scraping Reddit</span><b class="yt-count">0 posts</b></div></div>');
    const subs = x.el(`<div class="sc-subs">${SUBS.map(([s]) => `<span class="sc-sub"><img src="${x.brand('reddit-logo.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...subs.children].map((p) => ({ p, n: p.querySelector('b') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, subs],
      marks: [[T.r, say], [T.chip, chip], [T.sub[0], subs]],
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
      },
    };
  },
};
