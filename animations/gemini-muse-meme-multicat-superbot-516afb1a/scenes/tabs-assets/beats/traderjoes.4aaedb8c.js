// Trader Joe's list beat (the 'traderjoes' variant): asked for a college-budget week of Trader Joe's food for a runner who
// lifts, superbot connects Trader Joe's, then Gemini answers with a line and an artifact card in the bakery variant's frame
// (bakery.005f5570.js: title, Share, Expand and, in Publish's place, a View on Trader Joe's link to the store, as the
// doordash variant's View in DoorDash). The card is wider than the bakery's 560: it spans the 760px chat column like the
// Default 10 grid (catsurf10.a35789f3.css), over a 760 x 475 view. It enters as an empty skeleton, the bare surface with the
// soft white sweep a climbing tile shows before its thumbnail lands (beats/thumb-land.309eb9c5.js shimmer over .bk-sh), and
// at T.g0 the finished list lands the way a climbing thumbnail does (the sweep fades out while the list fades in settling
// from 1.08x): a row of pills (total, item count, protein a day) over two columns of borderless grocery groups, thumbnail,
// name, quantity (only when more than one) and line price per row. Squeezed into the window the router leaves
// (times(r, end)); the scene is a pure function of t, with no pointer. Its stylesheet (../traderjoes.4aaedb8c.css) loads
// with the module. Every product, size, price and thumbnail is real, read from traderjoes.com on 2026-10-15 and kept in
// ./traderjoes-data.4aaedb8c.js (sources and the protein arithmetic are documented there and in
// img/traderjoes.4aaedb8c/CREDITS.txt); this module only lays them out, so no figure here is typed in by hand.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of Expand
import { shareBtn } from './share.29a362ea.js';
import { STORE, LOGO, RED, GROUPS, TOTAL, COUNT, PROTEIN_PER_DAY } from './traderjoes-data.4aaedb8c.js';

const SAY = "Here's your Trader Joe's list for the week: quick meals, carbs for your runs, and protein at every meal.";
const CSS = new URL('../traderjoes.4aaedb8c.css?v=5', import.meta.url).href;
const SKELETON = 0.9; // seconds the empty card sweeps before the list lands: a little over one pass of thumb-land's sweep (1.4 per second)
// the two columns: groups by name, so a renamed group fails loudly instead of silently dropping out
const COLS = [['Protein', 'Carbs'], ['Fruit', 'Veggies', 'Fuel & recovery']];

const usd = (n) => `$${n.toFixed(2)}`;
const group = (name) => {
  const g = GROUPS.find((x) => x.name === name);
  if (!g) throw new Error(`traderjoes variant: no group named ${name} in the data module`);
  return g;
};

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`traderjoes variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end plus this variant's `extra` (chat.9b47fc30.js routeBy), which holds the finished list
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.g0 = T.card + SKELETON; // the list's landing time
    T.end = end;
    return T;
  },
  build(k, x) {
    loadFrameSheet();
    loadSheet();
    const T = k.T;
    const sections = COLS.map((names) => `<div class="tj-col">${names.map((n) => {
      const g = group(n);
      const rows = g.items.map((it) => `<li><img src="${x.img(it.img)}" width="96" height="96" alt=""><span class="tj-n">${x.esc(it.name)}</span><span class="tj-q">${it.qty > 1 ? `x${it.qty}` : ''}</span><b>${x.esc(usd(it.price * it.qty))}</b></li>`).join('');
      return `<section class="tj-g"><h3><i></i>${x.esc(g.name)}<small>${g.items.length}</small></h3><ul>${rows}</ul></section>`;
    }).join('')}</div>`).join('');
    const proteinPill = PROTEIN_PER_DAY == null ? '' : `<span class="tj-kpi"><b>${PROTEIN_PER_DAY}g+</b> protein a day</span>`;
    const srRows = GROUPS.flatMap((g) => g.items.map((it) => `<tr><th scope="row">${x.esc(it.name)}</th><td>${x.esc(g.name)}</td><td>${it.qty}</td><td>${x.esc(usd(it.price * it.qty))}</td></tr>`)).join('');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="bk tj" style="--tj-red:${RED}">
      <div class="bk-head">
        <b class="bk-title">Trader Joe's week list<small>${COUNT} items, ${x.esc(usd(TOTAL))}</small></b>
        ${shareBtn("Trader Joe's week list")}
        ${EXPAND}
        <a class="bk-btn bk-publish tj-open" href="${STORE}" target="_blank" rel="noopener noreferrer">View on<img src="${x.img(LOGO)}" alt="Trader Joe's"></a>
      </div>
      <div class="bk-view">
        <div class="tj-list">
          <div class="tj-pills"><span class="tj-kpi tj-total"><b>${x.esc(usd(TOTAL))}</b> total</span><span class="tj-kpi"><b>${COUNT}</b> items</span>${proteinPill}</div>
          <div class="tj-cols">${sections}</div>
        </div>
        <i class="bk-sh"></i>
        <table class="tj-sr"><caption>Trader Joe's week list: ${COUNT} items, ${x.esc(usd(TOTAL))}</caption>
          <tr><th scope="col">Item</th><th scope="col">Group</th><th scope="col">Quantity</th><th scope="col">Price</th></tr>${srRows}</table>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const list = $('.tj-list'), sh = $('.bk-sh');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the logo and the thumbnails; decode() only works once the nodes have left the
        // template's inert document, which they have by the first render
        if (!decoding) {
          decoding = true;
          for (const pic of block.querySelectorAll('img')) {
            track(pic.decode().catch((e) => console.error(new Error(`traderjoes image failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the empty skeleton sweeps from T.card until T.g0, then over LAND seconds (thumb-land.309eb9c5.js) the sweep fades
        // out while the list fades in and settles from 1.08x, exactly as a climbing thumbnail lands
        const p = landing(t, T.g0);
        shimmer(sh, t, T.card, 0, p);
        settle(list, p);
      },
    };
  },
};
