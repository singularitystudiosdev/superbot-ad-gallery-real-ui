// Opus 5.5, posting for likes: a tool chip tests titles, subreddits and timing, then the five memes go up one after
// another, each to its own subreddit under the title that tested best. Each row spins, resolves to a green "Live" and
// starts collecting upvotes; the closing chip totals them. "u/sam" and every number are made up.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { MEMES, memeHTML } from './memes.js?v=1';

const SAY = 'Posting each one where it does best, under the title that tested highest.';
const UP = '<svg viewBox="0 0 24 24"><path d="M12 4 4.5 12.5H9V20h6v-7.5h4.5Z"/></svg>';
const POSTS = [
  { sub: 'r/memes', title: 'me texting Muse at 3am (it texted back first)', up: 18400 },
  { sub: 'r/socialnetwork', title: 'A million users isn’t cool. You know what’s cool?', up: 12900 },
  { sub: 'r/me_irl', title: 'me_irl: 40 unread from Muse, mid deposition', up: 7600 },
  { sub: 'r/dankmemes', title: 'the group chat finding out I have Muse', up: 5200 },
  { sub: 'r/ProgrammerHumor', title: '“You built what?” “Muse.”', up: 4100 },
];
const TOTAL = POSTS.reduce((s, p) => s + p.up, 0);
const fmt = (n) => (n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)));

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.25;
    T.chipDone = r + 1.15;
    T.list = r + 1.2;
    T.row = POSTS.map((_, i) => T.list + 0.1 + i * 0.25);
    T.live = T.row.map((a) => a + 0.45);
    T.sum = T.live[POSTS.length - 1] + 0.3;
    T.end = T.sum + 1.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Testing 4 titles per meme, picking subreddit and hour</span></div></div>');
    const list = x.el(`<div class="rb-list po-list">${POSTS.map((p, i) => `<div class="rb-row"><span class="rb-thumb">${memeHTML(x, MEMES[i], 'mm-sm')}</span><span class="rb-meta"><b>${x.esc(p.title)}</b><small><img src="${x.brand('reddit-logo.svg')}" alt=""/>${x.esc(p.sub)} • best of 4 titles • peak hour</small></span><span class="rb-st"><i class="rb-spin"></i><em>Live</em></span><span class="po-up">${UP}<b>0</b></span></div>`).join('')}</div>`);
    const sum = x.el(`<div class="dd-chiprow rb-sum"><div class="ch-tool"><span class="spin done"></span><span class="ch-tool-t">5 posts live</span><b class="yt-count po-tot">0 upvotes</b></div></div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), tot = sum.querySelector('.po-tot');
    const rows = [...list.children].map((r) => ({ r, st: r.querySelector('.rb-st'), sp: r.querySelector('.rb-spin'), up: r.querySelector('.po-up'), n: r.querySelector('.po-up b') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const votes = (i, t) => POSTS[i].up * outCubic(seg(t, T.live[i] + 0.1, T.live[i] + 2.6));
    let shown = -1;
    return {
      nodes: [say, chip, list, sum],
      marks: [[T.r, say], [T.chip, chip], ...T.row.map((a, i) => [a, rows[i].r]), [T.sum, sum]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.chipDone;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'Optimized 5 posts for upvotes' : 'Testing 4 titles per meme, picking subreddit and hour';
        if (clab.textContent !== cl) clab.textContent = cl;

        list.style.opacity = seg(t, T.list, T.list + 0.2).toFixed(3);
        let all = 0;
        rows.forEach(({ r, st, sp, up, n: b }, i) => {
          rise(r, seg(t, T.row[i], T.row[i] + 0.35), 10);
          const live = t >= T.live[i];
          st.classList.toggle('on', live);
          sp.style.transform = live ? '' : `rotate(${(((t - T.row[i]) * 450) % 360).toFixed(1)}deg)`;
          const v = votes(i, t);
          all += v;
          up.style.opacity = seg(t, T.live[i], T.live[i] + 0.25).toFixed(3);
          const s = fmt(v);
          if (b.textContent !== s) b.textContent = s;
        });
        rise(sum, seg(t, T.sum, T.sum + 0.35), 8);
        const ts = `${fmt(Math.min(all, TOTAL))} upvotes`;
        if (tot.textContent !== ts) tot.textContent = ts;
      },
    };
  },
};
