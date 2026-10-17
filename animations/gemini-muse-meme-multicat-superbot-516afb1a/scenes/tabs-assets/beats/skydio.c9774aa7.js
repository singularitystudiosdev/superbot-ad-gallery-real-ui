// Skydio slide beat (the 'skydio' variant): asked for one slide on Skydio for a club's guest speaker, with the Fort Collins
// flight test site emphasised, superbot reads skydio.com (a connector chip with the site's own mark), then ChatGPT answers
// with a line and ONE slide in the pitchdeck variant's frame (beats/pitchdeck.fad54971.js: the dark
// card, its head with Share, Download, Expand and Export to Slides, and the 496 x 279 stage with its shimmer skeleton). No filmstrip
// and no advancing: the stage shimmers, the slide lands from a slight zoom on the same clock as the other variants'
// results (beats/thumb-land.309eb9c5.js), and its pieces then build in order, the title rule, the headline, what Skydio
// builds and focuses on, and last the Fort Collins panel, which is the slide's one bold element. Squeezed into the window
// the router leaves (times(r, end)); a pure function of t, with no pointer. Its stylesheet (../skydio.c9774aa7.css) loads with
// the module, and the pitchdeck stylesheet it builds on loads beside it (once). Every line of copy is a sourced fact
// (img/skydio.c9774aa7/CREDITS.txt): the sources describe a flight test site in Fort Collins, not an office, so the slide
// says test site. The photo is Skydio's own product image of an X10 in its Dock, from skydio.com.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { landing, shimmer, settle } from './thumb-land.309eb9c5.js';
// the bakery variant's Expand button and the sheet that styles it (its .bk-btn / .bk-expand rules)
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of Expand
import { shareBtn } from './share.29a362ea.js';
// the pitchdeck head's glyph-only Download; the same specifier chat.9b47fc30.js imports, so it stays one module
import { DOWNLOAD } from './pitchdeck.fad54971.js?v=2';

const SAY = 'Here’s your Skydio slide, with the Fort Collins test site up front.';
const CSS = new URL('../skydio.c9774aa7.css?v=3', import.meta.url).href;
const PD_CSS = new URL('../pitchdeck.fad54971.css?v=7', import.meta.url).href;
const TITLE = 'Skydio guest speaker slide';
const PHOTO = 'skydio.c9774aa7/dock-for-x10.jpg'; // 752 x 367 crop, Skydio's own product image of an X10 in its Dock (CREDITS.txt)

// the slide's inner markup at stage size. data-fx marks what builds once the slide has landed (the same row / x vocabulary
// as the pitchdeck slides), data-k its order, data-s / data-d an own start offset and duration in seconds
const slide = (x) => `<div class="sd-sl">
  <div class="sd-l">
    <div class="sd-rule" data-fx="x" data-s="0.04"></div>
    <h3 class="pd-h sd-h" data-fx="row" data-s="0.1">Guest Speaker: Skydio</h3>
    <p class="sd-sub" data-fx="row" data-s="0.2">Autonomous drones. Founded 2014, HQ San Mateo, CA</p>
    <div class="sd-row" data-fx="row" data-s="0.36"><b>What they build</b><span>Drones: X10 and Dock, F10 Lightrunner, R10</span><span>Software: Skydio Command runs missions remotely</span></div>
    <div class="sd-row" data-fx="row" data-s="0.52"><b>Focus areas</b><span>Drone as First Responder, security, inspection, mapping, national security</span></div>
  </div>
  <div class="sd-fc" data-fx="row" data-s="0.3" data-d="0.34">
    <div class="sd-band">Fort Collins, CO</div>
    <img class="sd-photo" src="${x.img(PHOTO)}" width="188" height="92" alt="A Skydio X10 drone sitting inside an open Skydio Dock for X10">
    <ul>
      <li data-fx="row" data-s="0.78">Flight test site at CSU’s Christman Field</li>
      <li data-fx="row" data-s="0.92">Flight test operators fly docked and hand-flown missions</li>
      <li data-fx="row" data-s="1.06">Flight data trains Skydio’s tracking AI</li>
    </ul>
  </div>
</div>`;

const FX = {
  row: (e, b) => { e.style.opacity = b.toFixed(3); e.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * 8).toFixed(2)}px)`; },
  x: (e, b) => { e.style.transform = b >= 1 ? 'none' : `scaleX(${b.toFixed(4)})`; },
};

let sheets = null;
function loadSheets() {
  if (sheets) return;
  sheets = [CSS, PD_CSS].filter((href) => !document.querySelector(`link[rel="stylesheet"][href="${href}"]`)).map((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    track(new Promise((done) => {
      link.onload = done;
      link.onerror = () => { console.error(new Error(`skydio variant stylesheet failed to load: ${href}`)); done(); };
    }));
    document.head.appendChild(link);
    return link;
  });
}

export default {
  // `end` is the base route's end plus this variant's `extra` (chat.9b47fc30.js routeBy), which holds the finished slide
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.land = r + 0.95; // the slide lands after the stage has shimmered for a beat
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheets();
    loadFrameSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="pd sd">
      <div class="pd-head"><b>Skydio guest speaker</b><span>1 slide</span>${shareBtn(TITLE)}${DOWNLOAD}${EXPAND}<span class="pd-exp"><img src="${x.brand('slides-logo.svg')}" alt=""/>Export to Slides</span></div>
      <div class="pd-stage"><div class="pd-shm"><i></i></div><div class="sd-sw">${slide(x)}</div>
        <span class="qc-genl">${x.tile('chatgpt')}Creating slide</span>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const wall = $('.sd-sw'), shm = $('.pd-shm'), sh = $('.pd-shm i'), genl = $('.qc-genl');
    const items = [...wall.querySelectorAll('[data-fx]')].map((e) => ({ e, fx: FX[e.dataset.fx], s: +e.dataset.s, d: +(e.dataset.d || 0.3) }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the photo; decode() only works once the nodes have left the template's inert document
        if (!decoding) {
          decoding = true;
          for (const pic of block.querySelectorAll('.sd-photo')) {
            track(pic.decode().catch((e) => console.error(new Error(`skydio image failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the stage is a skeleton with a soft sweep until T.land, then the slide settles in from 1.08x as the sweep fades
        const p = landing(t, T.land);
        shimmer(sh, t, T.card, 0, p);
        shm.style.opacity = (1 - p).toFixed(3);
        settle(wall, p);
        genl.style.opacity = (1 - seg(t, T.land - 0.05, T.land + 0.2)).toFixed(3);

        // the build: each piece arrives one after another once the slide has landed
        items.forEach((it) => it.fx(it.e, outCubic(seg(t, T.land + it.s, T.land + it.s + it.d))));
      },
    };
  },
};
