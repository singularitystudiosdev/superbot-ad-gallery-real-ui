// Grok, posting to X: the post rises as X's own dark card (avatar, handle, text, the meme, the action row); the heart
// fills and pops on the first like, and replies, reposts, likes and views tick up. "@sam" and every number are
// made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Posted to X.';
const ICON = {
  reply: '<svg viewBox="0 0 24 24"><path d="M4 11.5a7.5 7 0 0 1 7.5-7h1A7.5 7 0 0 1 20 11.5c0 4.4-3.9 7-8 8.5v-3H11.5A7.5 7 0 0 1 4 11.5Z"/></svg>',
  repost: '<svg viewBox="0 0 24 24"><path d="M7 5 4 8l3 3"/><path d="M4 8h11a4 4 0 0 1 4 4v1"/><path d="m17 19 3-3-3-3"/><path d="M20 16H9a4 4 0 0 1-4-4v-1"/></svg>',
  like: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/></svg>',
  views: '<svg viewBox="0 0 24 24"><path d="M5 20V12"/><path d="M10 20V5"/><path d="M15 20v-9"/><path d="M20 20V8"/></svg>',
};
const STATS = [['reply', 312], ['repost', 1840], ['like', 9800], ['views', 214000]];
const fmt = (n) => (n >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K' : String(Math.round(n)));

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.like = T.card + 0.7;
    T.count = [T.card + 0.5, T.card + 2.6];
    T.end = T.card + 2.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="xp-card">
      <div class="xp-head"><span class="xp-av">S</span><span class="xp-id"><b>sam</b><small>@sam · now</small></span><img class="xp-logo" src="${x.brand('x-logo.svg')}" alt=""/></div>
      <div class="xp-text">nobody:<br/>me at 3am: texting Muse</div>
      <div class="xp-media"><img src="${x.img('tsn-1.jpg')}" alt=""/></div>
      <div class="xp-acts">${STATS.map(([kind]) => `<span class="xp-act xp-${kind}">${ICON[kind]}<b>0</b></span>`).join('')}</div>
    </div>`);
    const acts = STATS.map(([kind, n]) => ({ n, b: card.querySelector(`.xp-${kind} b`) }));
    const like = card.querySelector('.xp-like'), heart = like.querySelector('svg');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const c = outCubic(seg(t, T.count[0], T.count[1]));
        acts.forEach(({ n: target, b }) => { const s = fmt(target * c); if (b.textContent !== s) b.textContent = s; });
        like.classList.toggle('on', t >= T.like);
        const pop = seg(t, T.like, T.like + 0.35);
        heart.style.transform = pop <= 0 || pop >= 1 ? '' : `scale(${lerp(0.6, 1, outBack(pop)).toFixed(4)})`;
      },
    };
  },
};
