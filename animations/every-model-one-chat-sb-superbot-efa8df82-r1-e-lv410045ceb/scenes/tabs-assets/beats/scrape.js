// DeepSeek V4 Flash, the scrape (r1-e v3): the Reddit tool runs first - its chip sweeps six subreddits, each pill
// lighting in turn and counting its posts while the chip's total climbs - and only once it is done does the model
// say what it found, then show it: the top three Muse memes (CC0 photos, captions written for the cut), each with its subreddit and
// score. Subreddit post counts
// and meme scores are made up (task data, img/CREDITS.txt). Pill counters have a fixed width so a growing number
// never re-wraps the pills (that reflow was a one-frame jump in the first cut).
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Searched 6 subreddits. The top 3 Muse memes right now:';
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/AdviceAnimals', 198], ['r/MemeTemplates', 146]];
const TOTAL = SUBS.reduce((s, [, n]) => s + n, 0);
const FOUND = [
  ['found-1.jpg', 'MUSE WHEN YOU SAY \u2018QUICK QUESTION\u2019', 'r/memes', '4.1k'],
  ['found-2.jpg', 'ME WAITING FOR MUSE TO FINISH TYPING', 'r/me_irl', '2.7k'],
  ['found-3.jpg', 'MUSE REMEMBERED MY BIRTHDAY', 'r/dankmemes', '1.9k'],
];
const num = (n) => Math.round(n).toLocaleString('en-US');
const UP = '<svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4.5v8h-5v-8H5Z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.15;
    T.sub = SUBS.map((_, i) => r + 0.3 + i * 0.2);
    T.scDone = T.sub[SUBS.length - 1] + 0.45;
    T.say = T.scDone + 0.12;
    T.found = FOUND.map((_, i) => T.say + 0.55 + i * 0.14);
    T.end = T.found[FOUND.length - 1] + 1.6; // the result holds: the task Claude stopped on is done
    return T;
  },
  build(k, x) {
    const T = k.T;
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool sc-tool"><span class="spin"></span><img class="sc-tool-ic" src="${x.brand('reddit-logo.svg')}" alt=""/><span class="ch-tool-t">Searching Reddit</span><b class="yt-count">0 posts</b></div></div>`);
    const subs = x.el(`<div class="sc-subs">${SUBS.map(([s]) => `<span class="sc-sub"><img src="${x.brand('reddit-logo.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const found = x.el(`<div class="sc-found">${FOUND.map(([f, cap, sub, score]) => `<figure class="sc-meme"><span class="sc-img"><img src="${x.img(f)}" alt=""/><i>${x.esc(cap)}</i></span><figcaption><b>${x.esc(sub)}</b><em>${UP}${score}</em></figcaption></figure>`).join('')}</div>`);
    const tool = chip.firstElementChild;
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...subs.children].map((p) => ({ p, n: p.querySelector('b') }));
    const memes = [...found.children];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [chip, subs, say, found],
      marks: [[T.chip, chip], [T.sub[0], subs], [T.say, say], [T.found[0], found]],
      render(t) {
        // the tool runs
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.scDone;
        spin.classList.toggle('done', done);
        tool.classList.toggle('yt-chip-done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Searched Reddit' : 'Searching Reddit';
        if (clab.textContent !== cl) clab.textContent = cl;
        let sum = 0;
        subs.style.opacity = t >= T.sub[0] - 0.05 ? '1' : '0';
        pills.forEach(({ p, n: b }, i) => {
          const a = T.sub[i];
          rise(p, seg(t, a, a + 0.28), 6);
          const c = SUBS[i][1] * outCubic(seg(t, a + 0.05, a + 0.5));
          sum += c;
          const s = num(c);
          if (b.textContent !== s) b.textContent = s;
          p.classList.toggle('on', t >= a + 0.5);
        });
        const cs = `${num(done ? TOTAL : sum)} posts`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // then the model reports, and shows what it found
        const n = streamCount(SAY, T.say, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        found.style.opacity = t >= T.found[0] - 0.05 ? '1' : '0';
        memes.forEach((m, i) => {
          const p = seg(t, T.found[i], T.found[i] + 0.4);
          const e = outCubic(p);
          m.style.opacity = e.toFixed(3);
          m.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 10).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`;
        });
      },
    };
  },
};
