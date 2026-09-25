// subs.js: "paying for every new number one". Every time a new model lands at #1, another subscription lands
// on the statement and the monthly total ticks up. The four prices are the vendors' own public list prices,
// read off their pricing pages on 2026-09-25 (see the ad's notes). No superbot price appears in this scene.
// render(lt) is a pure function of local time: no WAAPI, no CSS animation, no timers.
import { clamp, lerp, seg, outCubic, outQuint } from '../lib.js';
import { SYMBOLS } from './tabs-assets/icons.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// the statement's rows, in the order they land: one per "new #1" moment
const ROWS = [
  { name: 'ChatGPT Plus', vendor: 'OpenAI', price: 20, show: '20', tile: 'background:#000;color:#fff', glyph: 'openai' },
  { name: 'Claude Pro', vendor: 'Anthropic', price: 20, show: '20', tile: 'background:#d97757;color:#fff', glyph: 'claude' },
  { name: 'Google AI Pro', vendor: 'Google', price: 19.99, show: '19.99', tile: 'background:#fff;color:#1f1f1f', glyph: 'gemini' },
  { name: 'SuperGrok', vendor: 'xAI', price: 30, show: '30', tile: 'background:#000;color:#fff', img: asset('grok.png') },
];
const CUM = ROWS.map((_, i) => +ROWS.slice(0, i + 1).reduce((a, r) => a + r.price, 0).toFixed(2));

// beats (local seconds)
const B = { head: 0.18, headIn: 0.45, row0: 0.60, gap: 1.20, land: 0.52, count: 0.52, total: 5.00, dur: 6.60 };
const rowAt = (i) => B.row0 + i * B.gap;
const DIM = 0.74; // the rows behind the newest one settle back, so the newest #1 is the bright one

export default {
  id: 'subs',
  dur: B.dur,

  mount(section) {
    const rows = ROWS.map((r, i) => `<div class="subs-row" data-i="${i}">
      <span class="sr-ic" style="${r.tile}">${r.img ? `<img src="${r.img}" alt=""/>` : `<svg class="sr-glyph"><use href="#tbs-ic-${r.glyph}"/></svg>`}</span>
      <span class="sr-name">${esc(r.name)}<small>${esc(r.vendor)}</small></span>
      <span class="sr-price">$${esc(r.show)}<small>/mo</small></span>
      <em class="sr-new">NEW</em></div>`).join('');
    section.innerHTML = `
<div class="subs-root">
  <svg class="tbs-defs" aria-hidden="true" width="0" height="0">${SYMBOLS}</svg>
  <div class="subs-glow"></div>
  <div class="subs-panel">
    <div class="subs-head"><span class="subs-lab">Subscriptions</span><span class="subs-count"></span></div>
    <div class="subs-list">${rows}</div>
    <div class="subs-total"><span class="tl">Total</span><b class="sum">$0.00<small>/mo</small></b></div>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    return {
      sec: section,
      panel: q('.subs-panel'),
      head: q('.subs-head'),
      count: q('.subs-count'),
      glow: q('.subs-glow'),
      sum: q('.subs-total .sum'),
      rows: [...section.querySelectorAll('.subs-row')].map((el) => ({ el, ic: el.querySelector('.sr-ic'), badge: el.querySelector('.sr-new') })),
    };
  },

  render(lt, ctx) {
    const R = ctx.state;
    // head in
    const h = outCubic(seg(lt, B.head, B.head + B.headIn));
    R.head.style.opacity = h.toFixed(3);
    R.head.style.transform = `translateY(${((1 - h) * 14).toFixed(2)}px)`;

    let got = 0, boost = 0;
    R.rows.forEach((row, i) => {
      const a = rowAt(i);
      const f = outQuint(seg(lt, a, a + B.land));            // the row's own landing
      const settle = seg(lt, a + 0.9, a + 1.35);              // then it steps back, unless it is the newest
      const dim = i === ROWS.length - 1 ? 1 : lerp(1, DIM, settle);
      row.el.style.opacity = (f * dim).toFixed(3);
      row.el.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 26).toFixed(2)}px)`;
      row.el.style.filter = f >= 1 ? 'none' : `blur(${((1 - f) * 7).toFixed(2)}px)`;
      // the brand tile pops a beat behind its row
      const p = outQuint(seg(lt, a + 0.06, a + 0.06 + B.land));
      row.ic.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.62, 1, p).toFixed(4)})`;
      // the NEW pill rides the newest landed row
      const nb = i === ROWS.length - 1
        ? clamp(seg(lt, a + 0.34, a + 0.6))
        : clamp(seg(lt, a + 0.34, a + 0.6)) * (1 - clamp(seg(lt, rowAt(i + 1), rowAt(i + 1) + 0.3)));
      row.badge.style.opacity = nb.toFixed(3);
      if (lt >= a) got = i + 1;
      boost += pulse(lt, a + 0.18, 0.5);
    });

    // the running total: each row adds its own price to the sum as it lands
    let sum = 0;
    R.rows.forEach((_, i) => {
      const a = rowAt(i);
      const f = outCubic(seg(lt, a + 0.14, a + 0.14 + B.count));
      sum += (CUM[i] - (CUM[i - 1] || 0)) * f;
    });
    R.sum.innerHTML = `$${sum.toFixed(2)}<small>/mo</small>`;
    const tick = pulse(lt, B.total, 0.55);
    R.sum.style.transform = tick > 0 ? `scale(${(1 + 0.035 * tick).toFixed(4)})` : 'none';
    R.glow.style.opacity = (0.16 * clamp(seg(lt, B.head, B.head + 0.8)) + 0.34 * clamp(boost)).toFixed(3);
    R.count.textContent = got === 0 ? '' : `${got} subscription${got === 1 ? '' : 's'}`;
    R.count.style.opacity = (0.25 + 0.75 * clamp(seg(lt, rowAt(0), rowAt(0) + 0.4))).toFixed(3);
  },
};

/** a 0 -> 1 -> 0 swell centred on c, width w (used for the total's tick and the glow lift) */
function pulse(t, c, w) {
  const a = seg(t, c - w / 2, c), b = seg(t, c, c + w / 2);
  return a * (1 - b);
}