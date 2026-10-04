// Firecrawl beat: "Scrape reddit and look for more" goes to the scraper. The /v2/search request lands, six
// subreddits fill as their posts come back (2,418 total), and the five fastest-rising Muse memes rank in with their
// thumbnails, upvotes, comments and an upvotes-per-hour sparkline. Pure function of t. Thumbnails: img/rd-*.jpg,
// original compositions (assets-src/memes.7de5716a.html). Subreddit counts and post stats are made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scraped 6 subreddits, 2,418 posts. These 5 Muse memes are blowing up right now:';
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/socialnetwork', 198], ['r/MemeTemplates', 146]];
const TOTAL = SUBS.reduce((a, [, c]) => a + c, 0);
// [thumb, title, sub, age, upvotes, comments, upvotes/hour, sparkline points]
const HITS = [
  ['rd-1.jpg', 'nobody: / muse at 3am:', 'r/memes', '3h', '24.8k', '1.3k', '8.3k', [2, 3, 5, 9, 14, 21, 30]],
  ['rd-2.jpg', 'every single night with muse', 'r/dankmemes', '2h', '13.9k', '702', '6.9k', [1, 2, 4, 7, 12, 19, 26]],
  ['rd-4.jpg', 'is this an invitation? (muse edition)', 'r/me_irl', '4h', '17.6k', '911', '4.4k', [3, 5, 8, 11, 15, 18, 22]],
  ['rd-5.jpg', 'muse on day 1 vs day 30', 'r/memes', '5h', '15.1k', '640', '3.0k', [4, 6, 8, 11, 13, 15, 17]],
  ['rd-3.jpg', 'my screen time is just muse now', 'r/ProgrammerHumor', '4h', '9.4k', '388', '2.4k', [2, 3, 5, 6, 8, 10, 12]],
];
// hourly post volume for the trend strip, oldest first: flat, then the spike
const TREND = [6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 12, 11, 14, 16, 19, 24, 30, 38, 47, 58, 70, 84, 100];
const UP = '<svg class="fc-up" viewBox="0 0 24 24"><path d="M12 4l7 8h-4.5v8h-5v-8H5Z"/></svg>';
const CMT = '<svg class="fc-cm" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4Z"/></svg>';
const REQ = '{"query":"muse meme site:reddit.com","sources":["web"],"limit":50,"tbs":"qdr:d","scrapeOptions":{"formats":["markdown","screenshot"]}}';
const fmt = (n) => n.toLocaleString('en-US');
const spark = (pts) => {
  const max = Math.max(...pts), w = 84, h = 24;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg class="fc-spark" viewBox="0 0 ${w} ${h}"><path class="fc-sa" d="${d} L${w} ${h} L0 ${h} Z"/><path class="fc-sl" pathLength="1" d="${d}"/></svg>`;
};

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.18;
    T.req = r + 0.26;
    T.sub = SUBS.map((_, i) => r + 0.42 + i * 0.16);
    T.SUB = 0.4;
    T.hit = HITS.map((_, i) => r + 1.15 + i * 0.15);
    T.done = r + 2.05;
    T.end = r + 3.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fc-card">
      <div class="fc-head">
        <span class="fc-mark"><img src="${x.brand('firecrawl-logo.png')}" alt="Firecrawl"/></span>
        <span class="fc-verb">POST</span><span class="fc-path">/v2/search</span>
        <code class="fc-req">${x.esc(REQ)}</code>
        <span class="fc-stat"><i class="fc-dot"></i><span class="fc-stat-t">Scraping</span><b class="fc-n">0</b><span>posts</span></span>
      </div>
      <div class="fc-body">
        <div class="fc-src">
          <div class="fc-lab">Sources <span>6 subreddits · last 24h</span></div>
          ${SUBS.map(([s, c]) => `<div class="fc-sub"><img src="${x.brand('reddit-logo.svg')}" alt=""/><b>${s}</b><span class="fc-bar"><i></i></span><em data-c="${c}">0</em></div>`).join('')}
          <div class="fc-trend"><div class="fc-tl"><span>Muse meme posts · last 24h</span><b>+412%</b></div>
            <div class="fc-bars">${TREND.map((h) => `<i style="height:${h}%"></i>`).join('')}</div>
            <div class="fc-ax"><span>24h ago</span><span>12h</span><span>now</span></div></div>
          <div class="fc-notes"><span>Deduped 41 reposts</span><span>Ranked by ▲ per hour</span></div>
        </div>
        <div class="fc-res">
          <div class="fc-lab">Top 5 · Muse memes blowing up <span>${HITS.length} of ${fmt(TOTAL)}</span></div>
          ${HITS.map(([th, ti, sub, age, up, cm, vel, pts], i) => `<div class="fc-hit">
            <span class="fc-rank">${i + 1}</span>
            <span class="fc-th" style="background-image:url('${x.img(th)}')"></span>
            <span class="fc-tx"><b>${x.esc(ti)}</b><small>${sub} · ${age} ago · ${CMT}${cm} comments</small></span>
            <span class="fc-ups">${UP}${up}</span>
            ${spark(pts)}
            <span class="fc-vel">+${vel}/h</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const subs = $$('.fc-sub').map((n) => ({ n, bar: n.querySelector('.fc-bar i'), em: n.querySelector('em') }));
    const hits = $$('.fc-hit').map((n) => ({ n, sl: n.querySelector('.fc-sl'), sa: n.querySelector('.fc-sa'), vel: n.querySelector('.fc-vel') }));
    const req = $('.fc-req'), stat = $('.fc-stat'), statT = $('.fc-stat-t'), num = $('.fc-n'), notes = $('.fc-notes');
    const bars = $$('.fc-bars i'), trendPct = $('.fc-tl b'), trend = $('.fc-trend');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(card, seg(t, T.card, T.card + 0.45), 16);
        // the request body types out
        const rq = REQ.slice(0, Math.round(REQ.length * outCubic(seg(t, T.req, T.req + 0.5))));
        if (req.textContent !== rq) req.textContent = rq;

        let got = 0;
        subs.forEach((s, i) => {
          const p = seg(t, T.sub[i], T.sub[i] + T.SUB), e = outCubic(p);
          rise(s.n, seg(t, T.sub[i] - 0.1, T.sub[i] + 0.2), 6);
          const c = Math.round(SUBS[i][1] * e);
          got += c;
          s.bar.style.transform = `scaleX(${(e * SUBS[i][1] / SUBS[0][1]).toFixed(4)})`;
          const txt = fmt(c);
          if (s.em.textContent !== txt) s.em.textContent = txt;
          s.n.classList.toggle('is-done', p >= 1);
        });
        const done = t >= T.done;
        if (num.textContent !== fmt(got)) num.textContent = fmt(got);
        const st = done ? 'Done ·' : 'Scraping';
        if (statT.textContent !== st) statT.textContent = st;
        stat.classList.toggle('is-done', done);
        stat.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * seg(t, T.done, T.done + 0.3))).toFixed(4)})`;
        rise(notes, seg(t, T.done - 0.1, T.done + 0.25), 4);
        // the 24h trend grows left to right as the sweep runs; the spike lands last
        rise(trend, seg(t, T.sub[2], T.sub[2] + 0.3), 6);
        bars.forEach((b, i) => { b.style.transform = `scaleY(${outCubic(seg(t, T.sub[2] + i * 0.035, T.sub[2] + i * 0.035 + 0.35)).toFixed(4)})`; });
        trendPct.style.opacity = seg(t, T.sub[5] + 0.2, T.sub[5] + 0.45).toFixed(3);

        hits.forEach((h, i) => {
          const p = seg(t, T.hit[i], T.hit[i] + 0.38);
          const e = outCubic(p);
          h.n.style.opacity = e.toFixed(3);
          h.n.style.transform = p >= 1 ? '' : `translateX(${((1 - e) * 18).toFixed(2)}px)`;
          const d = outCubic(seg(t, T.hit[i] + 0.15, T.hit[i] + 0.75));
          h.sl.style.strokeDashoffset = (1 - d).toFixed(4);
          h.sa.style.opacity = (0.9 * d).toFixed(3);
          h.vel.style.transform = `scale(${lerp(0.5, 1, outBack(seg(t, T.hit[i] + 0.3, T.hit[i] + 0.6))).toFixed(3)})`;
          h.vel.style.opacity = seg(t, T.hit[i] + 0.3, T.hit[i] + 0.5).toFixed(3);
        });
      },
    };
  },
};
