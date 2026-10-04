// Perplexity Sonar beat: a live-search tool chip sweeps six subreddits (pills light and count in turn), then the
// answer lands Perplexity-style: five cited Reddit posts, a featured card plus a 2x2 grid, each with a meme
// thumbnail, upvotes counting up and a velocity sparkline drawing in. Thumbnails are crops of the source meme with
// new captions, or meme formats built in HTML (lock screen, tweet). Post titles, counts and velocities are made up.
// Same clock as the source spot's scrape beat (end = r + 3.05).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'On it. Sweeping six meme subreddits for Muse posts from the last 24 hours.';
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/socialnetwork', 198], ['r/MemeTemplates', 146]];
const TOTAL = SUBS.reduce((s, [, n]) => s + n, 0);
// [thumb kind, subreddit, age, title, upvotes, comments, velocity/h, sparkline points]
const POSTS = [
  ['ghost', 'r/memes', '6h', 'Opened Muse once. Now it texts first.', 12400, 482, '+2.1k/h', [2, 3, 5, 9, 14, 22, 31, 40]],
  ['lock', 'r/me_irl', '4h', 'my lock screen after one day of Muse', 8900, 311, '+1.6k/h', [1, 2, 4, 7, 12, 18, 26, 33]],
  ['face', 'r/dankmemes', '9h', 'reading Muse notification #40', 6100, 205, '+740/h', [3, 6, 9, 13, 16, 19, 22, 24]],
  ['tweet', 'r/socialnetwork', '3h', 'Muse remembered my dog’s birthday. I did not.', 4700, 168, '+1.2k/h', [1, 1, 3, 6, 10, 15, 21, 27]],
  ['note', 'r/MemeTemplates', '7h', 'every Muse notification be like', 3200, 97, '+410/h', [2, 4, 5, 7, 9, 11, 12, 14]],
];
const num = (n) => Math.round(n).toLocaleString('en-US');
const kfmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const UP = '<svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4.5v8h-5v-8H5z"/></svg>';
const CM = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>';

function spark(pts, w, h) {
  const max = Math.max(...pts), step = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(h - 1 - (v / max) * (h - 3)).toFixed(1)}`).join(' ');
  return `<svg class="ps-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path class="ps-area" d="${d} L${w} ${h} L0 ${h}Z"/><path class="ps-line" d="${d}" pathLength="1"/></svg>`;
}

function thumb(kind, meme, x) {
  const bg = (size, pos) => `style="background-image:url('${meme}');background-size:${size};background-position:${pos}"`;
  if (kind === 'ghost') return `<div class="ps-th ps-th-photo" ${bg('155% auto', '100% 0%')}><b class="ps-cap ps-top">OPENED MUSE ONCE</b><b class="ps-cap ps-bot">NOW IT TEXTS FIRST</b></div>`;
  if (kind === 'face') return `<div class="ps-th ps-th-photo" ${bg('290% auto', '47% 87%')}><b class="ps-cap ps-bot">NOTIF #40</b></div>`;
  if (kind === 'note') return `<div class="ps-th ps-th-photo" ${bg('218% auto', '63% 42%')}><b class="ps-cap ps-top">EVERY</b><b class="ps-cap ps-bot">MUSE PING</b></div>`;
  const icon = `<i class="ps-mi" ${bg('870% auto', '73% 2.4%')}></i>`;
  if (kind === 'lock') return `<div class="ps-th ps-th-lock"><b class="ps-clock">3:14</b>${['you up?', 'made you a playlist', '38 more'].map((m) => `<span class="ps-noti">${icon}<em>Muse</em>${x.esc(m)}</span>`).join('')}</div>`;
  return `<div class="ps-th ps-th-tweet"><span class="ps-tw-h"><i class="ps-av"></i><b>devon</b><em>@devonlately</em></span><p>muse remembered my dog’s birthday. i did not.</p><span class="ps-tw-f">♥ 18.2k · ↻ 3.1k</span></div>`;
}

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.sub = SUBS.map((_, i) => r + 0.35 + i * 0.22);
    T.scDone = T.sub[T.sub.length - 1] + 0.6;
    T.res = r + 1.5;
    T.post = POSTS.map((_, i) => T.res + i * 0.12);
    T.end = T.scDone + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const meme = x.img('muse-meme.png');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Searching Reddit · “muse meme” · past 24h</span><b class="yt-count">0 posts</b></div></div>`);
    const subs = x.el(`<div class="sc-subs ps-subs">${SUBS.map(([s]) => `<span class="sc-sub"><img src="${x.brand('reddit-logo.svg')}" alt=""/>${x.esc(s)}<b>0</b></span>`).join('')}</div>`);
    const card = (p, i) => {
      const [kind, sub, age, title, up, cm, vel, pts] = p;
      const feat = i === 0;
      return `<div class="ps-post${feat ? ' ps-feat' : ''}">${thumb(kind, meme, x)}<div class="ps-body">
        <span class="ps-meta"><i class="ps-cite">${i + 1}</i><img src="${x.brand('reddit-logo.svg')}" alt=""/>${sub}<em>· ${age}</em></span>
        <b class="ps-title">${x.esc(title)}</b>
        <span class="ps-stats"><span class="ps-up">${UP}<b>0</b></span>${feat ? `<span class="ps-cm">${CM}${num(cm)}</span>` : ''}${spark(pts, feat ? 74 : 44, feat ? 20 : 14)}<em class="ps-vel">${vel}</em></span>
      </div></div>`;
    };
    const grid = x.el(`<div class="ps-grid">${card(POSTS[0], 0)}<div class="ps-side">${POSTS.slice(1).map((p, i) => card(p, i + 1)).join('')}</div></div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const pills = [...subs.children].map((p) => ({ p, n: p.querySelector('b') }));
    const posts = [...grid.querySelectorAll('.ps-post')].map((n) => ({ n, up: n.querySelector('.ps-up b'), line: n.querySelector('.ps-line'), area: n.querySelector('.ps-area'), vel: n.querySelector('.ps-vel') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${lerp(0.96, 1, e).toFixed(4)})`; };
    let shown = -1;
    return {
      nodes: [say, chip, subs, grid],
      marks: [[T.r, say], [T.chip, chip], [T.sub[0], subs], [T.res, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the sweep: each pill lands, counts up its posts, then settles lit
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.scDone;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Searched Reddit · ranked by upvote velocity' : 'Searching Reddit · “muse meme” · past 24h';
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

        // the answer: cited posts rise in, upvotes count, sparklines draw
        grid.style.opacity = t >= T.res - 0.05 ? '1' : '0';
        posts.forEach((p, i) => {
          const a = T.post[i];
          rise(p.n, seg(t, a, a + 0.4), 10);
          const c = kfmt(POSTS[i][4] * outCubic(seg(t, a + 0.1, a + 0.9)));
          if (p.up.textContent !== c) p.up.textContent = c;
          const d = outCubic(seg(t, a + 0.2, a + 0.95));
          p.line.style.strokeDashoffset = (1 - d).toFixed(4);
          p.area.style.opacity = (0.9 * d).toFixed(3);
          const v = seg(t, a + 0.75, a + 0.95);
          p.vel.style.opacity = v.toFixed(3);
          p.vel.style.transform = `scale(${lerp(0.7, 1, outBack(v)).toFixed(4)})`;
        });
      },
    };
  },
};
