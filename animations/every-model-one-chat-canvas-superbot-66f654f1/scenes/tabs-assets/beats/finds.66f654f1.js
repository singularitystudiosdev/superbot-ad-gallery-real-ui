// Claude Haiku 4.5, the scrape. It reads every post's image, not just its title, so the canvas pane shows the
// funnel (posts read, images looked at, Muse found, climbing fast), each subreddit's sweep with its match count,
// what it matched against, the five Muse memes climbing fastest as post cards (thumbnail, upvotes, comments,
// match score, a climb sparkline) and their upvotes-per-hour lines. Thumbnails are crops of img/muse-meme.png with
// caption type, or screenshot memes (lock screen, post, chat) built in HTML/CSS. Subreddit and post numbers are
// made up. Pure function of t.
import { rise, setText, sayLine, refChip, num, kfmt, countTo, drawStroke, crop, REGION, IC, lerp, seg, outCubic } from './kit.66f654f1.js';

const SAY = 'Read 2,418 posts and every image. 5 Muse memes are climbing right now.';
const SUBS = [['r/memes', 812, 9], ['r/dankmemes', 544, 7], ['r/me_irl', 391, 6], ['r/ProgrammerHumor', 327, 4], ['r/socialnetwork', 198, 3], ['r/MemeTemplates', 146, 2]];
const POSTS_N = SUBS.reduce((s, [, n]) => s + n, 0); // 2,418
const MATCH_N = SUBS.reduce((s, [, , m]) => s + m, 0); // 31
const FUNNEL = [[POSTS_N, 'posts read'], [1912, 'images looked at'], [MATCH_N, 'show Muse'], [5, 'climbing fast']];
// ranked by upvotes per hour; h = upvotes per hour over the last 6 h
const POSTS = [
  { th: 'reader', title: 'me when muse says “one more thing”', sub: 'r/memes', age: '4h', up: 18400, com: 1240, rate: 3100, match: 98, h: [40, 210, 900, 1800, 2500, 2900, 3100] },
  { th: 'post', title: 'muse remembered my dog’s birthday. he did not', sub: 'r/dankmemes', age: '3h', up: 9700, com: 812, rate: 2600, match: 96, h: [0, 0, 0, 380, 1500, 2200, 2600] },
  { th: 'lock', title: 'my lock screen since tuesday', sub: 'r/me_irl', age: '6h', up: 12900, com: 640, rate: 1900, match: 97, h: [600, 1500, 2300, 2400, 2100, 2000, 1900] },
  { th: 'stare', title: 'muse watching me open 6 other apps first', sub: 'r/memes', age: '5h', up: 7200, com: 388, rate: 1400, match: 95, h: [0, 300, 900, 1300, 1600, 1500, 1400] },
  { th: 'chat', title: 'my code reviewer is a marshmallow now', sub: 'r/ProgrammerHumor', age: '4h', up: 4800, com: 506, rate: 1100, match: 93, h: [0, 0, 400, 800, 1000, 1100, 1100] },
];
const LINE = ['#ff4500', '#ff8b5c', '#f5b48f', '#9b8cff', '#5ec8e6'];

function thumb(x, url, p, W, H) {
  const meme = (top, bot, region) => `<i class="th-img" style="${crop(url, region, W, H)}"></i><b class="th-imp th-top">${top}</b><b class="th-imp th-bot">${bot}</b>`;
  const face = (s) => `<i class="th-face" style="${crop(url, REGION.face, s, s)};width:${s}px;height:${s}px"></i>`;
  switch (p.th) {
    case 'reader': return meme('ME WHEN MUSE SAYS', '“ONE MORE THING”', REGION.reader);
    case 'stare': return meme('MUSE WATCHING ME', 'OPEN 6 OTHER APPS FIRST', [300, 0, 570, 334]);
    case 'lock': return `<div class="th-lock"><b class="th-cap">my lock screen since tuesday</b><div class="th-ls"><span class="th-time">3:07</span><span class="th-date">Tuesday, October 6</span>
      <span class="th-nt">${face(13)}<span><b>MUSE <em>now</em></b><small>you up? I planned your whole week</small></span></span>
      <span class="th-nt">${face(13)}<span><b>MUSE <em>1m</em></b><small>also drink some water</small></span></span>
      <span class="th-more">+38 more from Muse</span></div></div>`;
    case 'post': return `<div class="th-post"><span class="th-ph">${'<i class="th-av">J</i>'}<span><b>jules</b><small>@julesmakes · 3h</small></span></span>
      <span class="th-tx">muse remembered my dog’s birthday. my boyfriend did not.</span>
      <i class="th-pimg" style="${crop(url, REGION.mascot, W - 20, 52)}"></i><span class="th-pf"><em>♥ 48.2K</em><em>↻ 6.1K</em></span></div>`;
    case 'chat': return `<div class="th-chat"><span class="th-ch">${face(16)}<b>Muse</b></span>
      <span class="th-bl">you pushed to main 6 times today</span><span class="th-br">i know</span><span class="th-bl">want me to write the tests?</span></div>`;
    default: return '';
  }
}

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.funnel = r + 0.18;
    T.sub = SUBS.map((_, i) => r + 0.3 + i * 0.16);
    T.scDone = r + 1.75;
    T.match = r + 0.95;
    T.card = POSTS.map((_, i) => r + 0.85 + i * 0.17);
    T.chart = r + 1.7;
    T.ref = r + 1.0;
    T.end = r + 3.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const url = x.img('muse-meme.png');
    const reddit = x.brand('reddit-logo.svg');
    const say = sayLine(x, SAY);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Reading Reddit</span><b class="yt-count">0 posts</b></div></div>');
    const ref = refChip(x, { thumb: `<img src="${reddit}" alt=""/>`, title: 'reddit-muse-memes', sub: '5 posts ranked by climb rate' });

    const CW = 186, TH = 150;
    const max = Math.max(...POSTS.flatMap((p) => p.h));
    const spark = (p, w, h) => {
      const pts = p.h.map((v, i) => `${(i / (p.h.length - 1) * w).toFixed(1)},${(h - 2 - v / max * (h - 4)).toFixed(1)}`).join(' ');
      return `<svg class="fd-spk" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline pathLength="1" points="${pts}"/></svg>`;
    };
    const cards = POSTS.map((p, i) => `<div class="fd-post">
      <div class="fd-th" style="height:${TH}px">${thumb(x, url, p, CW, TH)}</div>
      <div class="fd-pb"><span class="fd-r1"><span class="fd-rank">#${i + 1}</span><span class="fd-match">${IC.eye}Muse match <b>0%</b></span></span><b class="fd-tl">${x.esc(p.title)}</b>
        <span class="fd-meta"><img src="${reddit}" alt=""/>${p.sub}<em>· ${p.age}</em></span>
        <span class="fd-stats"><span class="fd-up">${IC.up}<b>0</b></span><span class="fd-com">${IC.comment}<b>0</b></span></span>
        <span class="fd-climb">${spark(p, 92, 24)}<b>+${kfmt(p.rate)}/h</b></span></div></div>`).join('');
    // the sixth cell: upvotes per hour, all five
    const CWc = 150, CHc = 178;
    const lines = POSTS.map((p, i) => {
      const pts = p.h.map((v, j) => `${(j / (p.h.length - 1) * CWc).toFixed(1)},${(CHc - v / max * (CHc - 8)).toFixed(1)}`).join(' ');
      return `<polyline class="fd-ln" pathLength="1" points="${pts}" style="stroke:${LINE[i]}"/><circle class="fd-dot" cx="${CWc}" cy="${(CHc - p.h[6] / max * (CHc - 8)).toFixed(1)}" r="2.6" style="fill:${LINE[i]}"/>`;
    }).join('');
    const grid = [0, 0.5, 1].map((f) => `<line x1="0" x2="${CWc}" y1="${(CHc - f * (CHc - 8)).toFixed(1)}" y2="${(CHc - f * (CHc - 8)).toFixed(1)}"/>`).join('');

    const pane = x.el(`<div class="cv-pane fd">
      <div class="fd-funnel">${FUNNEL.map(([n, l], i) => `${i ? `<i class="fd-arr">${IC.arrow}</i>` : ''}<div class="fd-fc${i === 3 ? ' hot' : ''}"><b>0</b><small>${l}</small></div>`).join('')}</div>
      <div class="fd-grid">
        <div class="fd-left">
          <section class="fd-card fd-subs"><h6>6 subreddits <em>last 24 h</em></h6>
            ${SUBS.map(([s, n]) => `<div class="fd-sub"><img src="${reddit}" alt=""/><span class="fd-sn"><b>${s}</b><i class="fd-bar"><s></s></i><small>0 posts</small></span><span class="fd-m">0</span></div>`).join('')}</section>
          <section class="fd-card fd-how"><h6>Matched by image</h6>
            <div class="fd-howr"><i class="fd-hf" style="${crop(url, REGION.face, 52, 52)}"></i><span><b>Muse in the picture</b><small>any pose, any template · match ≥ 90%</small></span></div>
            <div class="fd-vs"><span><b class="fd-vs-a">31</b><small>found by reading images</small></span><span><b class="fd-vs-b">4</b><small>by titles alone</small></span></div></section>
        </div>
        <div class="fd-posts">${cards}
          <div class="fd-chart"><h6>Upvotes per hour</h6><svg viewBox="-4 -4 ${CWc + 8} ${CHc + 8}" width="${CWc + 8}" height="${CHc + 8}"><g class="fd-gl">${grid}</g>${lines}</svg>
            <span class="fd-ax"><small>6 h ago</small><small>now</small></span>
            <span class="fd-key">${POSTS.map((p, i) => `<span><i style="background:${LINE[i]}"></i>#${i + 1}</span>`).join('')}</span></div>
        </div>
      </div>
    </div>`);

    const $ = (s) => pane.querySelector(s), $$ = (s) => [...pane.querySelectorAll(s)];
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), ccount = chip.querySelector('.yt-count');
    const fcs = $$('.fd-fc').map((n) => ({ n, b: n.querySelector('b') })), arrs = $$('.fd-arr');
    const subs = $$('.fd-sub').map((n) => ({ n, bar: n.querySelector('.fd-bar s'), sm: n.querySelector('small'), m: n.querySelector('.fd-m') }));
    const subCard = $('.fd-subs'), how = $('.fd-how'), vsA = $('.fd-vs-a'), vsB = $('.fd-vs-b');
    const posts = $$('.fd-post').map((n, i) => ({ n, p: POSTS[i], up: n.querySelector('.fd-up b'), com: n.querySelector('.fd-com b'), mt: n.querySelector('.fd-match b'), sp: n.querySelector('.fd-spk polyline'), th: n.querySelector('.fd-th') }));
    const chart = $('.fd-chart'), lns = $$('.fd-ln'), dots = $$('.fd-dot');

    return {
      nodes: [say.n, chip, ref],
      marks: [[T.r, say.n], [T.chip, chip], [T.ref, ref]],
      ref,
      cv: { tab: 'reddit-muse-memes', pane, at: k.reply + 0.05 },
      render(t) {
        say.render(t, T.r + 0.06, 80);
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        rise(ref, seg(t, T.ref, T.ref + 0.4), 8);
        const done = t >= T.scDone;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        setText(clab, done ? 'Read Reddit' : 'Reading Reddit');
        let read = 0;

        // each subreddit sweeps: its bar fills as its posts are read, then its Muse count lands
        rise(subCard, seg(t, T.r, T.r + 0.3), 8);
        subs.forEach((s, i) => {
          const a = T.sub[i], f = outCubic(seg(t, a, a + 0.55));
          rise(s.n, seg(t, a - 0.1, a + 0.2), 5);
          s.bar.style.transform = `scaleX(${(f * SUBS[i][1] / SUBS[0][1]).toFixed(4)})`;
          const c = SUBS[i][1] * f;
          read += c;
          setText(s.sm, `${num(c)} posts`);
          const m = Math.round(SUBS[i][2] * outCubic(seg(t, a + 0.35, a + 0.7)));
          setText(s.m, `${m} Muse`);
          s.n.classList.toggle('on', t >= a + 0.55);
        });
        setText(ccount, `${num(done ? POSTS_N : read)} posts`);

        // the funnel counts with the sweep
        const fv = [read, countTo(1912, t, T.funnel + 0.1, T.scDone), countTo(MATCH_N, t, T.sub[0] + 0.35, T.scDone), countTo(5, t, T.card[0], T.card[4] + 0.2)];
        fcs.forEach((f, i) => { rise(f.n, seg(t, T.funnel + i * 0.08, T.funnel + i * 0.08 + 0.3), 6); setText(f.b, num(i === 0 && done ? POSTS_N : fv[i])); });
        arrs.forEach((a, i) => { a.style.opacity = seg(t, T.funnel + (i + 1) * 0.08, T.funnel + (i + 1) * 0.08 + 0.3).toFixed(3); });

        rise(how, seg(t, T.match, T.match + 0.35), 8);
        setText(vsA, num(countTo(MATCH_N, t, T.match + 0.15, T.match + 0.75)));
        setText(vsB, num(countTo(4, t, T.match + 0.15, T.match + 0.75)));

        // post cards land ranked, their numbers count up and the climb line draws
        posts.forEach((q, i) => {
          const a = T.card[i];
          const p = seg(t, a, a + 0.4);
          rise(q.n, p, 14);
          q.n.style.transform = p >= 1 ? '' : `translateY(${((1 - outCubic(p)) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, outCubic(p)).toFixed(4)})`;
          q.th.style.filter = p >= 1 ? '' : `blur(${((1 - outCubic(seg(t, a, a + 0.45))) * 6).toFixed(2)}px)`;
          setText(q.up, kfmt(countTo(q.p.up, t, a + 0.1, a + 0.9)));
          setText(q.com, kfmt(countTo(q.p.com, t, a + 0.1, a + 0.9)));
          setText(q.mt, `${Math.round(countTo(q.p.match, t, a + 0.15, a + 0.6))}%`);
          drawStroke(q.sp, seg(t, a + 0.2, a + 0.85));
        });
        rise(chart, seg(t, T.chart, T.chart + 0.35), 10);
        lns.forEach((l, i) => drawStroke(l, seg(t, T.chart + 0.1 + i * 0.06, T.chart + 0.75 + i * 0.06)));
        dots.forEach((d, i) => { d.style.opacity = seg(t, T.chart + 0.7 + i * 0.06, T.chart + 0.85 + i * 0.06).toFixed(3); });
      },
    };
  },
};
