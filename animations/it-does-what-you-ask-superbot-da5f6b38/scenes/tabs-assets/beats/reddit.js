// Reddit beat: the Muse meme goes up on r/memes. A tool chip posts it, the post card rises in Reddit's own dark
// layout (subreddit row, title, the image over its blurred backdrop, vote and comment pills) and the first votes
// and comments tick in. "u/sam" is made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Posted it to r/memes.';
export const ICON = {
  up: '<svg viewBox="0 0 24 24"><path d="M12 4 4.5 12.5H9V20h6v-7.5h4.5Z"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 20l7.5-8.5H15V4H9v7.5H4.5Z"/></svg>',
  comment: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M14 5l6 6-6 6"/><path d="M20 11H10a6 6 0 0 0-6 6v2"/></svg>',
};
export const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)));

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.25;
    T.chipDone = r + 0.85;
    T.card = r + 0.7;
    T.votes = [T.card + 0.5, T.card + 2.0];
    T.end = T.card + 2.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Posting to r/memes</span></div></div>');
    const meme = x.img('muse-meme.png');
    const card = x.el(`<div class="rd-post">
      <div class="rd-head"><img class="rd-sub" src="${x.brand('reddit-logo.svg')}" alt=""/><b>r/memes</b><span>• just now</span><em class="rd-by">u/sam</em></div>
      <div class="rd-title">Muse really said check your messages</div>
      <div class="rd-media" style="--bg:url('${meme}')"><img src="${meme}" alt="Muse meme"/></div>
      <div class="rd-acts"><span class="rd-pill rd-vote">${ICON.up}<b class="rd-n">1</b>${ICON.down}</span><span class="rd-pill">${ICON.comment}<b class="rd-c">0</b></span><span class="rd-pill">${ICON.share}Share</span></div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chip = row.firstElementChild, sp = chip.firstElementChild, lab = chip.lastElementChild;
    const vote = card.querySelector('.rd-vote'), nv = card.querySelector('.rd-n'), nc = card.querySelector('.rd-c');
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    return {
      nodes: [say, row, card],
      marks: [[T.r, say], [T.chip, row], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(row, seg(t, T.chip, T.chip + 0.35), 8);
        const done = t >= T.chipDone;
        sp.classList.toggle('done', done);
        sp.style.transform = done ? '' : `rotate(${(((t - T.chip) * 450) % 360).toFixed(1)}deg)`;
        const l = done ? 'Posted to r/memes' : 'Posting to r/memes';
        if (lab.textContent !== l) lab.textContent = l;
        const ci = seg(t, T.card, T.card + 0.55);
        rise(card, ci, 18);
        if (ci < 1) card.style.transform = `translateY(${((1 - outCubic(ci)) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        const v = outCubic(seg(t, T.votes[0], T.votes[1]));
        const vs = fmt(lerp(1, 1284, v)), cs = fmt(lerp(0, 96, v));
        if (nv.textContent !== vs) nv.textContent = vs;
        if (nc.textContent !== cs) nc.textContent = cs;
        vote.classList.toggle('on', t >= T.votes[0]);
        const pop = outBack(seg(t, T.votes[0], T.votes[0] + 0.35));
        vote.style.transform = t < T.votes[0] || pop >= 1 ? '' : `scale(${lerp(1.15, 1, pop).toFixed(4)})`;
      },
    };
  },
};
