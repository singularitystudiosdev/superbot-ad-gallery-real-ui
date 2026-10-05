// Perplexity Sonar searches menus and reviews within 0.8 mi: five places land as rows (photo, rating, price tier,
// diet tags, source dots), then each gets its verdict: two are struck through, one is flagged for the celiac
// guest, Casa Lumbre fits all six.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { RESULTS, RADIUS, SOURCES } from './dinner.js';

const SAY = `Searched menus and reviews within ${RADIUS}.`;
const STAR = '<svg class="px-star" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>';
const WARN = '<svg viewBox="0 0 24 24"><path d="M12 3.2 22 20H2Z" fill="currentColor"/><path d="M12 9.5v4.6M12 16.9v.2" stroke="#1a1408" stroke-width="2.2" stroke-linecap="round"/></svg>';
const OKC = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const XC = '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
// favicon dots for the review and menu sources a row cites
const DOTS = [['#d32323', 'y'], ['#4285f4', 'G'], ['#e7413c', 'E'], ['#f5f5f7', 'i'], ['#20b8cd', 'm']];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.row = RESULTS.map((_, i) => T.card + 0.3 + i * 0.2);
    const v0 = T.row[T.row.length - 1] + 0.45;
    // verdicts in reading order of importance: the two misses, the risk, then the fit; the backup lands with the fit
    const order = [3, 0, 3, 1, 2];
    T.verdict = order.map((o) => v0 + o * 0.38);
    T.end = v0 + 3 * 0.38 + 1.15;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = (r) => `<div class="px-row${r.strike ? ' px-x' : ''}${r.flag ? ' px-flag' : ''}">
      <img class="px-img" src="${x.img(r.img)}" alt=""/>
      <div class="px-mid">
        <div class="px-name"><b>${x.esc(r.name)}<i class="px-line"></i></b></div>
        <div class="px-meta">${STAR}<b>${r.rating}</b><span>${x.esc(r.price)}</span><span>${x.esc(r.cuisine)}</span><span>${r.mi}</span></div>
        <div class="px-tags">${r.tags.map(([s, c]) => `<span class="px-tag px-${c}">${c === 'warn' ? WARN : ''}${x.esc(s)}</span>`).join('')}</div>
      </div>
      <div class="px-right">
        <span class="px-src">${DOTS.slice(0, r.src).map(([c, l]) => `<i style="background:${c}">${l}</i>`).join('')}<small>${r.src}</small></span>
        <span class="px-v px-v-${r.verdict[1]}">${r.verdict[1] === 'ok' ? OKC : r.verdict[1] === 'bad' ? XC : r.verdict[1] === 'warn' ? WARN : ''}${x.esc(r.verdict[0])}</span>
      </div>
    </div>`;
    const card = x.el(`<div class="px-card">
      <div class="px-h"><b>${RESULTS.length} places</b><span>${SOURCES} sources</span><span>Within ${RADIUS} of Williamsburg</span></div>
      ${RESULTS.map(row).join('')}
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('.px-row')];
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px)`;
        rows.forEach((rw, i) => {
          const r = RESULTS[i], a = T.row[i], p = outCubic(seg(t, a, a + 0.32));
          const v = T.verdict[i], vp = seg(t, v, v + 0.3);
          rw.style.opacity = (p * (r.strike ? lerp(1, 0.5, outCubic(seg(t, v + 0.15, v + 0.5))) : 1)).toFixed(3);
          rw.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
          const vv = rw.querySelector('.px-v');
          vv.style.opacity = outCubic(vp).toFixed(3);
          vv.style.transform = vp >= 1 ? '' : `scale(${lerp(0.7, 1, outBack(vp)).toFixed(4)})`;
          if (r.strike) rw.querySelector('.px-line').style.transform = `scaleX(${outCubic(seg(t, v, v + 0.3)).toFixed(4)})`;
          rw.style.setProperty('--warn', r.flag ? outCubic(seg(t, v, v + 0.3)).toFixed(3) : '0');
          rw.style.setProperty('--fit', r.verdict[1] === 'ok' ? (outCubic(seg(t, v, v + 0.3))).toFixed(3) : '0');
        });
      },
    };
  },
};
