// Reddit, the batch: the five new memes go up on r/memes one after another. Each row lands with its thumbnail and
// title, spins while it posts and resolves to a green "Live"; a closing chip counts them.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { MEMES, memeHTML } from './memes.js?v=1';

const SAY = 'Posting all 5 to r/memes.';

export default {
  times(r) {
    const T = { r };
    T.list = r + 0.3;
    T.row = MEMES.map((_, i) => T.list + 0.15 + i * 0.3);
    T.live = T.row.map((a) => a + 0.45);
    T.sum = T.live[MEMES.length - 1] + 0.3;
    T.end = T.sum + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const list = x.el(`<div class="rb-list">${MEMES.map((m) => `<div class="rb-row"><span class="rb-thumb">${memeHTML(x, m, 'mm-sm')}</span><span class="rb-meta"><b>${x.esc(m.title)}</b><small><img src="${x.brand('reddit-logo.svg')}" alt=""/>r/memes • u/sam</small></span><span class="rb-st"><i class="rb-spin"></i><em>Live</em></span></div>`).join('')}</div>`);
    const sum = x.el(`<div class="dd-chiprow rb-sum"><div class="ch-tool"><span class="spin done"></span><span class="ch-tool-t">5 posts live on r/memes</span></div></div>`);
    const rows = [...list.children].map((r) => ({ r, st: r.querySelector('.rb-st'), sp: r.querySelector('.rb-spin') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    return {
      nodes: [say, list, sum],
      marks: [[T.r, say], ...T.row.map((a, i) => [a, rows[i].r]), [T.sum, sum]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        list.style.opacity = seg(t, T.list, T.list + 0.2).toFixed(3);
        rows.forEach(({ r, st, sp }, i) => {
          rise(r, seg(t, T.row[i], T.row[i] + 0.35), 10);
          const live = t >= T.live[i];
          st.classList.toggle('on', live);
          sp.style.transform = live ? '' : `rotate(${(((t - T.row[i]) * 450) % 360).toFixed(1)}deg)`;
        });
        rise(sum, seg(t, T.sum, T.sum + 0.35), 8);
      },
    };
  },
};
