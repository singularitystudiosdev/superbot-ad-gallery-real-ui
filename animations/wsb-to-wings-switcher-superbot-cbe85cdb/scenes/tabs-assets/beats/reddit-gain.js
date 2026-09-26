// Reddit, the gain post: a screenshot of the GME position is taken (a flash over the chip), then the post goes up on
// r/wallstreetbets with the Gain flair, in Reddit's dark layout, and the vote count climbs to 312 as the comments
// tick in. "u/sam" and the counts are made up.
import { seg, outCubic, inOutCubic, lerp } from '../../../lib.js';
import { say, chips, cardIn, ICON } from './kit.js?v=1';

const SAY = 'Posted to r/wallstreetbets with the Gain flair. It’s climbing.';
const TITLE = 'Bought the insider buys, Cramer turned bullish, praying anyway';
const VOTES = 312, COMMENTS = 58;

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.7];
    T.chipDone = [r + 0.85, r + 1.45];
    T.flash = r + 0.72;
    T.card = r + 1.35;
    T.votes = [T.card + 0.6, T.card + 3.1];
    T.end = T.card + 3.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 80);
    const ch = chips(x, [
      ['Screenshotting your GME position', 'Screenshotted your GME position'],
      ['Posting to r/wallstreetbets', 'Posted to r/wallstreetbets'],
    ], T.chipIn, T.chipDone);
    const shot = `<div class="rg-shot">
      <div class="rg-s-top"><img src="${x.brand('robinhood-logo.svg')}" alt=""/><b>GME</b><small>GameStop</small></div>
      <div class="rg-s-val">$271.07</div>
      <div class="rg-s-chg">+$21.03 (+8.4%)</div>
      <svg viewBox="0 0 200 44" preserveAspectRatio="none"><path d="M0 38 L18 36 L30 39 L44 33 L58 34 L72 28 L86 30 L100 24 L114 25 L128 18 L142 20 L156 13 L170 14 L184 8 L200 5"/></svg>
      <div class="rg-s-row"><span>Your position</span><span>9.4 sh · avg $26.60</span></div>
    </div>`;
    const card = x.el(`<div class="rd-post rg-post">
      <div class="rd-head"><img class="rd-sub" src="${x.brand('reddit-logo.svg')}" alt=""/><b>r/wallstreetbets</b><span>• just now</span><em class="rd-by">u/sam</em></div>
      <div class="rg-flair">Gain</div>
      <div class="rd-title">${x.esc(TITLE)}</div>
      <div class="rg-media">${shot}</div>
      <div class="rd-acts"><span class="rd-pill rd-vote">${ICON.up}<b class="rd-n">1</b>${ICON.down}</span><span class="rd-pill">${ICON.comment}<b class="rd-c">0</b></span><span class="rd-pill">${ICON.share}Share</span></div>
    </div>`);
    const flash = x.el('<i class="rg-flash"></i>');
    ch.rows[0].firstElementChild.appendChild(flash);
    const vote = card.querySelector('.rd-vote'), nv = card.querySelector('.rd-n'), nc = card.querySelector('.rd-c');
    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        const f = seg(t, T.flash, T.flash + 0.35);
        flash.style.opacity = (f > 0 && f < 1 ? 1 - f : 0).toFixed(3);
        const p = inOutCubic(seg(t, T.votes[0], T.votes[1]));
        const v = String(Math.max(1, Math.round(lerp(1, VOTES, p))));
        if (nv.textContent !== v) nv.textContent = v;
        const c = String(Math.round(COMMENTS * outCubic(seg(t, T.votes[0] + 0.3, T.votes[1]))));
        if (nc.textContent !== c) nc.textContent = c;
        vote.classList.toggle('on', t >= T.votes[0]);
      },
    };
  },
};
