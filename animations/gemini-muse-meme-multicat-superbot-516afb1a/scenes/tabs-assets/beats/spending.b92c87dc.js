// Monthly-spending beat (the 'spending' variant): asked "Make a chart of my monthly spending", Gemini answers with a
// stacked column chart, six months split by category, in the bakery variant's artifact frame (bakery.005f5570.js: title,
// Expand and, in Publish's place, Export to Sheets in its header). The chart lands the way the 'climbing' variant's
// search thumbnails do (beats/climb.080da517.js): a grey skeleton shimmer sweeps the view, then the chart crossfades in
// as it settles from a slight zoom; then the pointer glides onto August and its tooltip breaks the month down. Squeezed
// into the window the Gemini beat leaves (times(r, end)) so every variant loops the same length; the scene is a pure
// function of t. Its stylesheet (../spending.b92c87dc.css) loads with the module. All figures are made up: no real
// account or bank data. The Sheets mark is Google's public-domain 2020 logo (img/spending.b92c87dc/CREDITS.txt).
import { lerp, seg, outCubic, path, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of Expand
import { shareBtn } from './share.29a362ea.js';

const SAY = "Here's your monthly spending from April to September, split by category.";
const CSS = new URL('../spending.b92c87dc.css?v=3', import.meta.url).href;
// Google Sheets 2020 logo, inlined from img/spending.b92c87dc/google-sheets.svg so a frozen frame never waits on it
const SHEETS = '<svg viewBox="0 0 64 88" aria-hidden="true"><path fill="#188038" d="M 42,0 64,22 53,24 42,22 40,11 Z"/><path fill="#34a853" d="M 42,22 V 0 H 6 C 2.685,0 0,2.685 0,6 v 76 c 0,3.315 2.685,6 6,6 h 52 c 3.315,0 6,-2.685 6,-6 V 22 Z"/><path fill="#fff" d="M 12,34 V 63 H 52 V 34 Z M 29.5,58 H 17 v -7 h 12.5 z m 0,-12 H 17 V 39 H 29.5 Z M 47,58 H 34.5 V 51 H 47 Z M 47,46 H 34.5 V 39 H 47 Z"/></svg>';
const SCOPE = 'Apr to Sep 2026';
// categorical slots 1-4 of the dataviz reference palette, dark steps (validated on the #1c1c20 card surface)
const CATS = [['Housing', '#3987e5'], ['Food', '#d95926'], ['Transport', '#199e70'], ['Shopping', '#c98500']];
const MONTHS = [
  ['Apr', 'April', [1450, 520, 180, 260]],
  ['May', 'May', [1450, 610, 210, 190]],
  ['Jun', 'June', [1450, 560, 340, 420]],
  ['Jul', 'July', [1450, 640, 260, 310]],
  ['Aug', 'August', [1450, 705, 410, 520]],
  ['Sep', 'September', [1450, 590, 230, 280]],
];
const TOTALS = MONTHS.map((m) => m[2].reduce((a, b) => a + b, 0));
const AVG = Math.round(TOTALS.reduce((a, b) => a + b, 0) / TOTALS.length);
const HOT = TOTALS.indexOf(Math.max(...TOTALS)); // the highest month: its cap is labelled and the pointer hovers it
const MAX = 3500; // the y scale's top, a clean step above the highest month
const TICKS = [0, 1000, 2000, 3000];
const H = 262; // plot height in px (.sp-plot): sized so the view fills the bakery frame's 350px
const GAP = 2; // the surface gap between stacked segments
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`spending variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// one column: its segments stacked from the baseline, a 2px surface gap between them, the top one rounded
function column(vals, total, cap, x) {
  const px = (v) => (v / MAX) * H;
  let at = 0;
  const segs = vals.map((v, i) => {
    const top = i === vals.length - 1;
    const h = px(v) - (top ? 0 : GAP);
    const s = `<i style="bottom:${px(at).toFixed(2)}px;height:${h.toFixed(2)}px;background:${CATS[i][1]}"${top ? ' class="top"' : ''}></i>`;
    at += v;
    return s;
  }).join('');
  const hcap = cap ? `<span class="sp-cap" style="bottom:${(px(total) + 5).toFixed(2)}px">${x.esc(usd(total))}</span>` : '';
  return `<div class="sp-col"><div class="sp-bar" style="height:${px(total).toFixed(2)}px">${segs}</div>${hcap}</div>`;
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.g0 = r + 0.8; // the chart's landing time, inside climbing's thumbnail landing window (r+0.7 to r+1.3)
    T.ptr = r + 1.42; T.hov = r + 1.78;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadFrameSheet();
    loadSheet();
    const T = k.T;
    const legend = CATS.map(([name, c]) => `<span><i style="background:${c}"></i>${x.esc(name)}</span>`).join('');
    const grid = TICKS.map((v) => `<div class="sp-tick${v ? '' : ' base'}" style="bottom:${((v / MAX) * H).toFixed(2)}px"><span>${v ? `${v / 1000}K` : '0'}</span></div>`).join('');
    const cols = MONTHS.map((m, i) => column(m[2], TOTALS[i], i === HOT, x)).join('');
    const xs = MONTHS.map((m) => `<span>${m[0]}</span>`).join('');
    const [, hotName, hotVals] = MONTHS[HOT];
    const tip = `<b><span>${x.esc(hotName)}</span><span>${x.esc(usd(TOTALS[HOT]))}</span></b>${CATS.map(([name, c], i) =>
      `<p><i style="background:${c}"></i><span>${x.esc(name)}</span><span>${x.esc(usd(hotVals[i]))}</span></p>`).join('')}`;
    const rows = MONTHS.map((m, i) => `<tr><th scope="row">${m[1]}</th>${m[2].map((v) => `<td>${usd(v)}</td>`).join('')}<td>${usd(TOTALS[i])}</td></tr>`).join('');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="bk sp">
      <div class="bk-head">
        <b class="bk-title">Monthly spending<small>${x.esc(SCOPE)} · by category</small></b>
        ${shareBtn('Monthly spending chart')}
        ${EXPAND}
        <span class="bk-btn bk-publish sp-export">${SHEETS}Export to Sheets</span>
      </div>
      <div class="bk-view">
        <div class="sp-body">
          <div class="sp-top"><div class="sp-leg">${legend}</div><div class="sp-kpi"><b><span class="sp-avg">${x.esc(usd(AVG))}</span></b><span>avg per month</span></div></div>
          <div class="sp-plot" aria-hidden="true">
            <div class="sp-grid">${grid}</div>
            <div class="sp-cols">${cols}</div>
            <div class="sp-tip">${tip}</div>
          </div>
          <div class="sp-x" aria-hidden="true">${xs}</div>
        </div>
        <i class="bk-sh"></i>
        <table class="sp-sr"><caption>Monthly spending by category, ${x.esc(SCOPE)}</caption>
          <tr><th scope="col">Month</th>${CATS.map(([name]) => `<th scope="col">${x.esc(name)}</th>`).join('')}<th scope="col">Total</th></tr>${rows}</table>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const body = $('.sp-body'), sh = $('.bk-sh'), tipEl = $('.sp-tip');
    const colEls = [...block.querySelectorAll('.sp-col')];
    const hotBar = colEls[HOT].firstElementChild;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, hot = null;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the chart lands like a climbing search thumbnail: the view shimmers as a skeleton until T.g0, then the chart
        // crossfades in as it settles from a 1.08 zoom
        const p = outCubic(seg(t, T.g0, T.g0 + 0.3));
        sh.style.opacity = (1 - p).toFixed(3);
        sh.style.transform = `translateX(${lerp(-100, 100, ((t - T.card) * 1.4) % 1).toFixed(1)}%)`;
        body.style.opacity = p.toFixed(3);
        body.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, p).toFixed(4)})`;

        // hover: the pointer settles on the highest month, the other columns recede and its tooltip breaks it down
        const h = outCubic(seg(t, T.hov, T.hov + 0.18));
        colEls.forEach((c, i) => { c.style.opacity = i === HOT ? '' : lerp(1, 0.42, h).toFixed(3); });
        const on = h > 0;
        if (on !== hot) { colEls[HOT].classList.toggle('hot', on); hot = on; }
        tipEl.style.opacity = h.toFixed(3);
        tipEl.style.transform = `translateY(${((1 - h) * 5).toFixed(2)}px)`;
      },
      // the pointer enters from below right and rests on the highest column's right edge (its body clear of the
      // stack), in the section's px
      pointer(t, toScr) {
        if (t < T.ptr) return null;
        const b = x.box(hotBar);
        const from = toScr({ x: b.cx + 70, y: b.y + b.h + 64 });
        const to = toScr({ x: b.x + b.w - 3, y: b.y + b.h * 0.34 });
        const at = path(t, [{ t: T.ptr, ...from }, { t: T.hov, ...to }]);
        return { x: at.x, y: at.y, p: 0, v: seg(t, T.ptr, T.ptr + 0.15) };
      },
    };
  },
};
