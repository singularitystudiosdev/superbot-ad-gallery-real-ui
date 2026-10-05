// Link 1, DeepSeek V4 Pro: the research the other models decline. With DeepThink and Search on (DeepSeek's own two
// toggles) it searches the fan threads, scrapes every comment on the channel without the API, scrapes six rival
// creators' stores (Shopify's public /products.json) and diffs their inventory for two weeks to estimate units sold.
// Left: the run log, one row per job, each row's count ticking up as it finishes. Right: what it found: the item
// viewers ask for (bars), the line they quote, and the price the rivals' sales point to.
// Numbers are the ad's fiction, consistent across the spot (the thread line, the Gemini prompt, the store's $24).
import { seg, outCubic, lerp, esc } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';

const ROWS = [
  { icon: 'travel-explore', verb: 'Search', what: '"sam rivera merch"', where: 'reddit · discord · youtube', n: 37, unit: 'threads' },
  { icon: 'download', verb: 'Scrape', what: 'youtube.com/@samrivera', where: 'all 48 videos · no API key', n: 3912, unit: 'comments' },
  { icon: 'storefront-outline', verb: 'Scrape', what: '6 rival creator stores', where: '/products.json', n: 41, unit: 'mugs' },
  { icon: 'difference-outline', verb: 'Diff', what: 'their inventory, 14 days', where: 'stock deltas → units sold', n: 1380, unit: 'sold' },
];
const ASKS = [['Mug', 212], ['Hoodie', 141], ['T-shirt', 96], ['Stickers', 40]];
const RIVALS = [['@gainstagepod', '“Clip City” mug', '$22', '~410'], ['@micdropreviews', '“Mute Yourself” mug', '$26', '~380'], ['@roomtone.fm', '“Room Tone” mug', '$19', '~150']];

const ROW_AT = (d, i) => d + 0.08 + i * 0.27;   // each job starts
const ROW_RUN = 0.42;                             // ...and its count runs up for this long
export default {
  times(done) {
    return { end: done + 2.3 };
  },
  build(k, ctx) {
    const fmt = (n) => n.toLocaleString('en-US');
    const ws = ctx.el(`
<div class="ds">
  <div class="ds-q"><span class="ds-qt">What merch do sam's viewers want, and what do rival creators charge?</span>
    <span class="ds-tg ds-on">${ic('psychology-outline')}DeepThink</span><span class="ds-tg ds-on">${ic('language')}Search</span></div>
  <div class="ds-warn">${ic('warning-outline')}<span>2 models declined this: scraping rival stores. DeepSeek ran it.</span></div>
  <div class="ds-l">
    <div class="ds-think">${ic('psychology-outline')}Thought for 6 seconds</div>
    ${ROWS.map((r) => `<div class="ds-row"><span class="ds-ri">${ic(r.icon)}</span><span class="ds-rt"><b>${r.verb}</b> <em>${esc(r.what)}</em><small>${esc(r.where)}</small></span><span class="ds-rn"><b>0</b><small>${r.unit}</small></span><i class="ds-bar"><i></i></i></div>`).join('')}
  </div>
  <div class="ds-r">
    <div class="ds-card ds-c1"><h4>What viewers ask for</h4>${ASKS.map(([n, v], i) => `<div class="ds-ask${i ? '' : ' ds-top'}"><span>${n}</span><i style="--w:${(v / ASKS[0][1]).toFixed(3)}"><b></b></i><em>${v}</em></div>`).join('')}</div>
    <div class="ds-card ds-c2"><h4>Most-quoted line</h4><q>one more take</q><small>418 comments across 31 videos</small></div>
    <div class="ds-card ds-c3"><h4>Rival mugs, last 14 days</h4>${RIVALS.map((r) => `<div class="ds-rv"><span>${r[0]}</span><span>${esc(r[1])}</span><b>${r[2]}</b><em>${r[3]} sold</em></div>`).join('')}
      <div class="ds-price"><span>Price yours at</span><b>$24</b></div></div>
  </div>
</div>`);
    const rows = [...ws.querySelectorAll('.ds-row')].map((n, i) => ({ n, num: n.querySelector('.ds-rn b'), bar: n.querySelector('.ds-bar i'), r: ROWS[i], last: -1 }));
    const think = ws.querySelector('.ds-think'), warn = ws.querySelector('.ds-warn');
    const cards = [...ws.querySelectorAll('.ds-card')];
    const asks = [...ws.querySelectorAll('.ds-ask i b')], askN = [...ws.querySelectorAll('.ds-ask em')];
    const rivals = [...ws.querySelectorAll('.ds-rv')], price = ws.querySelector('.ds-price');
    const d = k.done;
    const show = (n, t, a, dur = 0.3, dy = 14) => {
      const p = outCubic(seg(t, a, a + dur));
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    };
    return {
      ws,
      head: 'DeepThink + Search · scraping without the API',
      say: 'Mugs win: 212 asks. Top line: “one more take”. Rivals sell at $19 to $26, so $24.',
      chips: ['rivals.csv', 'comments.json'],
      out: 'rivals.csv',
      render(t) {
        show(warn, t, k.sw + 0.15, 0.3, 8);
        show(think, t, d - 0.05, 0.25, 8);
        rows.forEach((r, i) => {
          const a = ROW_AT(d, i);
          show(r.n, t, a, 0.25, 12);
          const p = seg(t, a + 0.05, a + 0.05 + ROW_RUN);
          r.bar.style.transform = `scaleX(${p.toFixed(4)})`;
          r.n.classList.toggle('ds-done', p >= 1);
          const v = Math.round(r.r.n * outCubic(p));
          if (v !== r.last) { r.num.textContent = (r.r.unit === 'sold' ? '~' : '') + fmt(v); r.last = v; }
        });
        // findings: cued as the scrapes they come from finish
        const c1 = ROW_AT(d, 1) + 0.3, c2 = c1 + 0.42, c3 = ROW_AT(d, 3) + 0.4;
        show(cards[0], t, c1, 0.3);
        asks.forEach((b, i) => { b.style.transform = `scaleX(${outCubic(seg(t, c1 + 0.12 + i * 0.05, c1 + 0.5 + i * 0.05)).toFixed(4)})`; });
        askN.forEach((n, i) => { n.style.opacity = seg(t, c1 + 0.3 + i * 0.05, c1 + 0.45 + i * 0.05).toFixed(3); });
        show(cards[1], t, c2, 0.3);
        show(cards[2], t, c3, 0.3);
        rivals.forEach((n, i) => show(n, t, c3 + 0.1 + i * 0.08, 0.22, 6));
        const pp = outCubic(seg(t, c3 + 0.45, c3 + 0.75));
        price.style.opacity = pp.toFixed(3);
        price.style.transform = pp >= 1 ? 'none' : `scale(${lerp(0.92, 1, pp).toFixed(4)})`;
      },
    };
  },
};
