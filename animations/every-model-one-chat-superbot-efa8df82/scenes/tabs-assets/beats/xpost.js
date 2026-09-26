// Grok, cross-posting to X: a tool chip rewrites the five posts for the timeline, then the lead post rises as X's own
// dark card (avatar, handle, text, the meme, the action row). The heart fills and pops on the first like, and
// replies, reposts, likes and views tick up; the closing chip counts the five. "@sam" and every number are made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { MEMES } from './memes.js?v=1';

const SAY = 'Posted all 5 to X, rewritten for the timeline.';
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
    T.chip = r + 0.25;
    T.chipDone = r + 0.95;
    T.card = r + 0.8;
    T.like = T.card + 0.7;
    T.count = [T.card + 0.5, T.card + 3.0];
    T.sum = T.card + 1.3;
    T.end = T.card + 3.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Rewriting 5 posts for X</span></div></div>');
    const card = x.el(`<div class="xp-card">
      <div class="xp-head"><span class="xp-av">S</span><span class="xp-id"><b>sam</b><small>@sam · now</small></span><img class="xp-logo" src="${x.brand('x-logo.svg')}" alt=""/></div>
      <div class="xp-text">nobody:<br/>me at 3am: texting Muse</div>
      <div class="xp-media"><img src="${x.img(MEMES[0].img)}" alt=""/></div>
      <div class="xp-acts">${STATS.map(([kind]) => `<span class="xp-act xp-${kind}">${ICON[kind]}<b>0</b></span>`).join('')}</div>
    </div>`);
    const sum = x.el('<div class="dd-chiprow rb-sum"><div class="ch-tool"><span class="spin done"></span><span class="ch-tool-t">5 posts live on X</span></div></div>');
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t');
    const acts = STATS.map(([kind, n]) => ({ n, b: card.querySelector(`.xp-${kind} b`) }));
    const like = card.querySelector('.xp-like'), heart = like.querySelector('svg');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, card, sum],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.sum, sum]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.chipDone;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'Rewrote 5 posts for X' : 'Rewriting 5 posts for X';
        if (clab.textContent !== cl) clab.textContent = cl;

        const ci = seg(t, T.card, T.card + 0.45);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        const c = outCubic(seg(t, T.count[0], T.count[1]));
        acts.forEach(({ n: target, b }) => { const s = fmt(target * c); if (b.textContent !== s) b.textContent = s; });
        like.classList.toggle('on', t >= T.like);
        const pop = seg(t, T.like, T.like + 0.35);
        heart.style.transform = pop <= 0 || pop >= 1 ? '' : `scale(${lerp(0.6, 1, outBack(pop)).toFixed(4)})`;
        rise(sum, seg(t, T.sum, T.sum + 0.35), 8);
      },
    };
  },
};
