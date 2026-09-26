// Reddit, the report: how the six posts are doing. Three KPI tiles count up (upvotes, comments, views), a "#1 on
// r/memes today" badge pops, and the top three posts' bars grow to their upvotes. The numbers are made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { MEMES, memeHTML } from './memes.js?v=1';
import { fmt, ICON } from './reddit.js?v=1';

const SAY = 'They’re doing amazing. Your Muse memes are blowing up.';
const KPIS = [
  { v: 84200, l: 'upvotes', d: '+312%' },
  { v: 3900, l: 'comments', d: '+188%' },
  { v: 2100000, l: 'views', d: '+540%' },
];
const TOP = [
  { m: MEMES[1], v: 31800 },
  { m: MEMES[0], v: 22400 },
  { m: { img: '', cap: '', title: 'Muse really said check your messages' }, v: 14900, src: 'muse-meme.png' },
];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.35;
    T.count = [T.card + 0.35, T.card + 1.6];
    T.badge = T.card + 1.1;
    T.bars = TOP.map((_, i) => [T.card + 0.7 + i * 0.18, T.card + 1.7 + i * 0.18]);
    T.end = T.card + 3.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const thumb = (p) => (p.src ? `<span class="mm mm-sm mm-raw"><span class="mm-pic"><img src="${x.img(p.src)}" alt=""/></span></span>` : memeHTML(x, p.m, 'mm-sm'));
    const card = x.el(`<div class="st-card">
      <div class="st-head"><img src="${x.brand('reddit-logo.svg')}" alt=""/><b>Your Muse posts</b><span>6 posts • r/memes • last 3 hours</span><em class="st-badge">#1 on r/memes today</em></div>
      <div class="st-kpis">${KPIS.map((q) => `<span class="st-kpi"><b>0</b><small>${q.l}</small><i>${q.d}</i></span>`).join('')}</div>
      <div class="st-rows">${TOP.map((p) => `<div class="st-row"><span class="st-th">${thumb(p)}</span><span class="st-mid"><b>${x.esc(p.m.title)}</b><span class="st-track"><i></i></span></span><span class="st-v">${ICON.up}<b>0</b></span></div>`).join('')}</div>
    </div>`);
    const kpis = [...card.querySelectorAll('.st-kpi b')];
    const rows = [...card.querySelectorAll('.st-row')].map((r) => ({ r, bar: r.querySelector('.st-track i'), n: r.querySelector('.st-v b') }));
    const badge = card.querySelector('.st-badge');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const max = TOP[0].v;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = seg(t, T.card, T.card + 0.55), e = outCubic(ci);
        card.style.opacity = e.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - e) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, e).toFixed(4)})`;
        const c = outCubic(seg(t, T.count[0], T.count[1]));
        KPIS.forEach((q, i) => { const s = fmt(q.v * c); if (kpis[i].textContent !== s) kpis[i].textContent = s; });
        const b = seg(t, T.badge, T.badge + 0.4);
        badge.style.opacity = outCubic(b).toFixed(3);
        badge.style.transform = `scale(${lerp(0.6, 1, outBack(b)).toFixed(4)})`;
        rows.forEach(({ r, bar, n: nb }, i) => {
          const [a, z] = T.bars[i], p = outCubic(seg(t, a, z));
          r.style.opacity = outCubic(seg(t, a - 0.25, a + 0.1)).toFixed(3);
          bar.style.width = ((TOP[i].v / max) * 100 * p).toFixed(2) + '%';
          const s = fmt(TOP[i].v * p);
          if (nb.textContent !== s) nb.textContent = s;
        });
      },
    };
  },
};
