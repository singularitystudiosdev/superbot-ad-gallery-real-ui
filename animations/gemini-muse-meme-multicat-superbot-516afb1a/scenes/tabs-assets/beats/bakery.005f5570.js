// Bakery-website beat (the 'bakery' variant): asked "Build me a website for my bakery", Opus 5.5 answers with the rendered
// one-page site in an artifact frame (title, Expand and Publish in its header) around one preview tile, the site laid
// out at 400x250 and scaled up to fill the frame. The tile shimmers as a skeleton, then the site lands the way a climbing result
// does (beats/climb.080da517.js: it fades in and settles from a 1.08 zoom), the page scrolls under its sticky nav to the
// menu and hours, and the nav's Order button presses. Squeezed into the window the Gemini beat leaves (times(r, end)) so
// every variant loops the same length. The scene is a pure function of t. Its stylesheet (../bakery.005f5570.css) loads
// with the module.
// Hero: a CC0 photo from Wikimedia Commons (img/bakery.005f5570/CREDITS.txt); the bakery, menu and address are made up.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the Share control every output card carries, in front of Expand
import { shareBtn } from './share.29a362ea.js';

const SAY = "Here's a one-page site for your bakery, with your menu, hours and a pickup order button.";
const CSS = new URL('../bakery.005f5570.css?v=3', import.meta.url).href;
const SCROLL = 150; // page height (30 nav + 370 sections, fixed in the stylesheet) minus the 250px viewport
const MENU = [['Butter croissant', '$4.50'], ['Pain au chocolat', '$5'], ['Country sourdough', '$9'], ['Seeded rye', '$8'], ['Cinnamon bun', '$5'], ['Lemon tart', '$6']];
const HOURS = [['Tue to Fri', '7am to 6pm'], ['Sat, Sun', '8am to 3pm'], ['Mon', 'Closed']];

// the artifact frame's Expand button; the 3D variant's frame (gemini.9b47fc30.js) reuses it and this sheet's frame rules
export const EXPAND = '<span class="bk-btn bk-expand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>Expand</span>';

let sheet = null;
export function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`bakery variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    // the preview lands when the climbing variant's first result does: 0.4 into its search window, which opens at r + 0.3
    T.land = r + 0.3 + 0.4;
    T.s0 = T.land + 0.8; T.s1 = T.s0 + 0.5;
    T.tap = T.s1 + 0.05;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const menu = MENU.map(([n, p]) => `<li><span>${x.esc(n)}</span><i></i><b>${x.esc(p)}</b></li>`).join('');
    const hours = HOURS.map(([d, h]) => `<p><span>${x.esc(d)}</span><b>${x.esc(h)}</b></p>`).join('');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="bk">
      <div class="bk-head">
        <b class="bk-title">Crumb &amp; Co. website</b>
        ${shareBtn('Crumb & Co. website')}
        ${EXPAND}
        <span class="bk-btn bk-publish">Publish</span>
      </div>
      <div class="bk-view">
        <div class="bk-fit">
        <div class="bk-site">
          <div class="bk-page">
            <div class="bk-hero">
              <img class="bk-pic" src="${x.img('bakery.005f5570/hero.jpg')}" width="800" height="450" alt="Fresh butter croissants on a baking tray" fetchpriority="high"/>
              <div class="bk-copy">
                <h1>Baked at 5 a.m.<br/>Gone by noon.</h1>
                <p>Sourdough, croissants and cakes on Elm Street.</p>
                <span class="bk-ctas"><span class="bk-cta">Order for pickup</span><span class="bk-ghost">See the menu</span></span>
              </div>
            </div>
            <div class="bk-menu"><h2>Today's bakes</h2><ul>${menu}</ul></div>
            <div class="bk-info">
              <div><h3>Hours</h3>${hours}</div>
              <div><h3>Visit us</h3><p>214 Elm Street</p><p>Pickup at the side door</p><p>Cakes: order 2 days ahead</p></div>
            </div>
          </div>
          <div class="bk-nav"><b class="bk-logo">Crumb &amp; Co.</b><span>Menu</span><span>Hours</span><span>Visit</span><span class="bk-order">Order</span></div>
        </div>
        </div>
        <i class="bk-sh"></i>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const pic = $('.bk-pic'), site = $('.bk-site'), page = $('.bk-page'), sh = $('.bk-sh'), order = $('.bk-order');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the hero; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          track(pic.decode().catch((e) => console.error(new Error(`bakery hero failed to decode: ${pic.src}`, { cause: e }))));
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the tile shimmers as a skeleton until the site lands, then the site fades in and settles from a slight zoom
        const p = outCubic(seg(t, T.land, T.land + 0.3));
        sh.style.opacity = (1 - p).toFixed(3);
        sh.style.transform = `translateX(${lerp(-100, 100, ((t - T.card) * 1.4) % 1).toFixed(1)}%)`;
        site.style.opacity = p.toFixed(3);
        site.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, p).toFixed(4)})`;

        // the page scrolls under the sticky nav to the menu and hours, then the nav's Order button presses
        const sp = inOutCubic(seg(t, T.s0, T.s1));
        page.style.transform = `translateY(${(-sp * SCROLL).toFixed(2)}px)`;
        const pr = press(t, T.tap);
        order.style.transform = `scale(${(1 - 0.08 * pr).toFixed(4)})`;
        order.style.boxShadow = `0 0 0 ${(3 * pr).toFixed(2)}px rgba(181, 101, 43, ${(0.35 * pr).toFixed(3)})`;
      },
    };
  },
};
