// DeepSeek beat, the first hand-off: DeepSeek V4 Pro with DeepThink and Search on does the legwork nobody else will.
// Its window is DeepSeek's own dark chat: superbot's request in the user bubble, "Thought for 11 seconds", the web
// pages it read counting up, and a crawl log streaming real request shapes (Amazon's review pages walked to the end,
// a Best Buy 403 retried with a rotated user agent, Walmart, Reddit's JSON search, YouTube's comment endpoint across
// nine rival reviews). The table on the right fills row by row as the log lands: ten headsets, lowest price right
// now, store, and how often reviews call the mic clear. The winner lights up and the hook it found types under it.
// Hand-off: the hook goes to Eleven v4 as the trailer script; prices.json and specs.json ride along for later models. Headset names, prices and counts are made up.
import { seg, outCubic } from '../../../lib.js';
import { windowTimes, sayLine, rise, windowCard, countUp, fmt } from './kit.js?v=7993d5b0';

const SAY = 'Scraping every price and review for the 10 headsets in your video.';
const ASKED = 'Lowest price right now and what reviewers say about the mic, for all 10 headsets in Sam’s video.';
// [method, url, status, count]; status 'r' is the retry line
const LOG = [
  ['search', '"gaming headset under $100" mic review', '', '142'],
  ['GET', 'amazon.com/product-reviews/B0DWH2…?pageNumber=1‥121', '200', '2,418'],
  ['GET', 'bestbuy.com/site/searchpage.jsp?st=gaming+headset', '403', ''],
  ['↻', 'retry: rotated UA + residential exit', '200', '38'],
  ['GET', 'walmart.com/search?q=gaming+headset&max_price=100', '200', '64'],
  ['GET', 'reddit.com/r/headphones/search.json?q=mic&limit=100', '200', '612'],
  ['POST', 'youtube.com/youtubei/v1/next ×9 rival reviews', '200', '31,906'],
  ['parse', 'prices · mic mentions · complaints', 'ok', ''],
];
// [name, price, store, share of reviews calling the mic clear]
export const HEADSETS = [
  ['Wren H2', 39, 'Walmart', 81], ['Tarn 7', 79, 'Amazon', 71], ['Halden Pro', 99, 'Amazon', 64],
  ['Corvo Air', 59, 'Best Buy', 58], ['Pike S2', 45, 'Amazon', 55], ['Velo X1', 69, 'Best Buy', 52],
  ['Kesh Nova', 89, 'Amazon', 49], ['Marlo 3', 35, 'Walmart', 47], ['Ostra Lite', 29, 'Amazon', 33], ['Brisk 200', 25, 'Walmart', 28],
];
const HOOK = 'Hook: the $39 Wren H2 beat the $99 Halden Pro on mic, 81% to 64%.';
const PAGES = 142;

const HOLD = 3.3; /* deliberate */  // the window parked at full frame while the crawl and the table play
const THINK = 0.55;                 // "Thinking" to "Thought for 11 seconds"
const LOG_AT = 0.25, LOG_STAGGER = 0.17;
const ROW_AT = 0.95, ROW_STAGGER = 0.1;
const WIN_AT = 2.15;                // the winner row lights up
const HOOK_CPS = 75;

export default {
  times(r, opts) {
    const T = windowTimes(r, opts, HOLD);
    T.log = LOG.map((_, i) => T.c0 + LOG_AT + i * LOG_STAGGER);
    T.rows = HEADSETS.map((_, i) => T.c0 + ROW_AT + i * ROW_STAGGER);
    T.win = T.c0 + WIN_AT;
    T.hook = T.win + 0.15;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const fav = (c, l) => `<i class="ds-fav" style="--c:${c}">${l}</i>`;
    const app = `<div class="ds">
      <div class="ds-top"><img class="ds-logo" src="${x.brand('deepseek-logo.svg')}" alt=""/><b>deepseek</b><span class="ds-model">V4 Pro</span>
        <span class="ds-sp"></span><span class="ds-tg ds-on"><i></i>DeepThink</span><span class="ds-tg ds-on"><i></i>Search</span></div>
      <div class="ds-cols">
        <div class="ds-l">
          <div class="ds-user">${x.esc(ASKED)}</div>
          <div class="ds-think"><i class="ds-ti"></i><span class="ds-tt">Thinking</span><span class="ds-tc">⌄</span></div>
          <div class="ds-read">${fav('#ff9900', 'a')}${fav('#0046be', 'b')}${fav('#0071dc', 'w')}${fav('#ff4500', 'r')}${fav('#ff0033', '▶')}<span>Read <b class="ds-n">0</b> web pages</span></div>
          <div class="ds-log">${LOG.map(([m, u, s, n]) => `<div class="ds-ln"><span class="ds-m ${m === '↻' ? 'ds-rt' : ''}">${x.esc(m)}</span><span class="ds-u">${x.esc(u)}</span><span class="ds-s ds-s${s || 'x'}">${x.esc(s)}</span><span class="ds-c">${x.esc(n)}</span></div>`).join('')}</div>
        </div>
        <div class="ds-r">
          <div class="ds-th"><b>10 headsets</b><span>lowest price right now</span></div>
          <table class="ds-tb"><thead><tr><th>Headset</th><th>Price</th><th>Store</th><th>Mic clear</th></tr></thead>
            <tbody>${HEADSETS.map(([n, p, s, m]) => `<tr><td>${x.esc(n)}</td><td class="ds-num">$${p}</td><td>${x.esc(s)}</td><td class="ds-num"><i class="ds-bar" style="width:${(m * 0.42).toFixed(1)}px"></i>${m}%</td></tr>`).join('')}</tbody></table>
          <div class="ds-hook"><span class="ds-hv"></span><span class="ds-hh">${x.esc(HOOK)}</span></div>
        </div>
      </div>
    </div>`;
    const w = windowCard(x, 'kc-ds', app, {
      outs: ['prices.json', 'specs.json', 'hook.txt'],
      next: { logo: x.brand('elevenlabs-logo.svg'), name: 'Eleven v4', cls: 'kc-n-light' },
    });
    const $ = (s) => w.card.querySelector(s);
    const lines = [...w.card.querySelectorAll('.ds-ln')];
    const rows = [...w.card.querySelectorAll('.ds-tb tbody tr')];
    const tt = $('.ds-tt'), ti = $('.ds-ti'), nEl = $('.ds-n');
    const hv = $('.ds-hv'), hh = $('.ds-hh'), hook = $('.ds-hook');
    let lastN = -1, lastH = -1, lastThink = '';

    return {
      nodes: [say.node, w.card],
      marks: [[T.r, say.node], [T.card, w.card]],
      focus: w.card,
      render(t) {
        say.render(t, T.r);
        rise(w.card, t, T.card);
        const think = t >= T.c0 + THINK ? 'Thought for 11 seconds' : 'Thinking';
        if (think !== lastThink) { tt.textContent = think; lastThink = think; }
        ti.style.transform = `rotate(${((t - T.card) * 300).toFixed(1)}deg)`;
        ti.classList.toggle('ds-done', t >= T.c0 + THINK);
        const n = countUp(t, T.c0 + 0.1, T.log[LOG.length - 1], PAGES);
        if (n !== lastN) { nEl.textContent = fmt(n); lastN = n; }
        lines.forEach((ln, i) => {
          const p = outCubic(seg(t, T.log[i], T.log[i] + 0.18));
          ln.style.opacity = p.toFixed(3);
          ln.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -6).toFixed(2)}px)`;
        });
        rows.forEach((tr, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + 0.2));
          tr.style.opacity = p.toFixed(3);
        });
        rows[0].classList.toggle('ds-win', t >= T.win);
        hook.style.opacity = seg(t, T.hook - 0.05, T.hook + 0.05).toFixed(3);
        const h = Math.max(0, Math.min(HOOK.length, Math.floor((t - T.hook) * HOOK_CPS)));
        if (h !== lastH) { hv.textContent = HOOK.slice(0, h); hh.textContent = HOOK.slice(h); lastH = h; }
        w.renderIO(t, T.out);
      },
    };
  },
};
