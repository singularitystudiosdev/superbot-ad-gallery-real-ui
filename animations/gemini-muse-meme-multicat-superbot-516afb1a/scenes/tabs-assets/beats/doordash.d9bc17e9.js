// DoorDash beat (the 'doordash' variant): asked "order me a burger on doordash", superbot says the burger has been
// ordered and shows the DoorDash order-placed screen, framed like the spending variant's artifact (bakery.005f5570.js: the title and,
// in Publish's place, a View in DoorDash link that opens the store; no Expand button). The order lands the way the climbing variant's
// thumbnails do (beats/thumb-land.309eb9c5.js): a soft white sweep runs across the view as a skeleton, then over 0.3s
// (outCubic) the sweep fades out while the image fades in and settles from 1.08x onto its rest scale, the whole
// page fitted to the view; no camera move and no pointer. Squeezed into the window the Gemini beat leaves
// (times(r, end)) so every variant loops the same length; the scene is a pure function of t. Its stylesheet
// (../doordash.d9bc17e9.css) loads with the module. The image is a REBUILD of DoorDash's post-checkout status card
// ("Confirming your order"), drawn from a reference frame of the live DoorDash app, not a capture: nothing was ordered
// and no real order page was reachable without an account. The logo and the meal photo are real pixels
// (img/doordash.d9bc17e9/CREDITS.txt).
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of the header's button
import { shareBtn } from './share.29a362ea.js';

const SAY = 'Your burger has been ordered from Burger King.';
const CSS = new URL('../doordash.d9bc17e9.css?v=3', import.meta.url).href;
const STORE = 'https://www.doordash.com/store/burger-king-san-francisco-52959/';
const SHOT = 'doordash.d9bc17e9/order-placed.jpg';
const ALT = 'DoorDash order placed: Confirming your order, arrives between 7:42 PM-7:52 PM, one Double Whopper Meal from Burger King, $25.86 total';
const PAGE = { w: 896, h: 560 }; // the image's size in CSS px (rendered at 2x); 16:10, the view's aspect
const VIEW = { w: 560, h: 350 }; // the bakery frame's view
// the one framing, as the image's scale and x offset in the view: the whole page fitted to the view
const FIT = { s: VIEW.w / PAGE.w, x: 0 };

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`doordash variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.g0 = r + 0.8; // the order's landing time, the spending chart's
    T.end = end;
    return T;
  },
  build(k, x) {
    loadFrameSheet();
    loadSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="bk ddx">
      <div class="bk-head">
        <b class="bk-title">Burger King order<small>1 item · $25.86 before taxes</small></b>
        ${shareBtn('Burger King order')}
        <a class="bk-btn bk-publish ddx-open" href="${STORE}" target="_blank" rel="noopener noreferrer"><img src="${x.brand('doordash-logo.svg')}" alt="">View in DoorDash</a>
      </div>
      <div class="bk-view">
        <div class="ddx-cam"><div class="ddx-zoom"><img class="ddx-shot" src="${x.img(SHOT)}" width="${PAGE.w}" height="${PAGE.h}" alt="${x.esc(ALT)}" style="transform: translateX(${FIT.x.toFixed(2)}px) scale(${FIT.s.toFixed(5)})"></div></div>
        <i class="bk-sh"></i>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const zoom = $('.ddx-zoom'), sh = $('.bk-sh');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the screenshot and the logo; decode() only works once the nodes have left the
        // template's inert document, which they have by the first render
        if (!decoding) {
          decoding = true;
          for (const pic of block.querySelectorAll('img')) {
            track(pic.decode().catch((e) => console.error(new Error(`doordash image failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the order lands the way the climbing thumbnails do (thumb-land.309eb9c5.js): the view is a skeleton with a
        // soft sweep until T.g0, then over LAND seconds the sweep fades out while the screenshot fades in and settles
        // from 1.08x onto its fitted framing (the zoom wrapper scales about the view's centre, inside the clipped view)
        const p = landing(t, T.g0);
        shimmer(sh, t, T.card, 0, p);
        settle(zoom, p);
      },
    };
  },
};
