// Computer-control beat (the 'computer-control-v3-soft' variant, Computer Control V3 · Soft Vignette): asked "Take
// computer control and open a tab", superbot answers in one line and shows a live view of the user's screen in the
// artifact frame (bakery.005f5570.js: the title, Share, Expand and, in Publish's place, a Stop button). The view is a
// true screen share: a DESK-sized desktop (a 13-inch MacBook's default width) with Chrome full screen on it at Chrome's
// own sizes, scaled down whole into the view (as doordash.d9bc17e9.js fits its page), so tab strip, page and cursor
// keep their real proportions. The pages are real captures (img/computer.ba3976b6/CREDITS.txt): superbot.gg in the
// open tab, Chrome's New Tab page in the one superbot opens. The cursor is the screen's own, a macOS arrow at its real
// size on that desktop, so it shrinks with the screen; the viewer-sized shared pointer stays hidden (no pointer()).
// Superbot takes control the way a desktop agent can actually show it, with a click-through overlay window over the
// whole display: a thin pink and purple vignette fades in round the display's edges, its gradient turning slowly, and
// a small pill rises at the bottom ("superbot is controlling your computer"); both are drawn at the view's own size so
// they read. Then the cursor glides onto Chrome's new-tab button and clicks it: a New Tab slides in beside the first
// and takes the active state, the page switches to the New Tab page and the address bar takes focus with a blinking
// caret. Expand is real: it opens a side panel on the right of the app with the same screen share, larger, drawn from
// the same t (every view is painted by paint()); its close button, Escape or a variant pick closes it. Squeezed into the
// window the Gemini beat leaves plus the route's `extra` (chat.9b47fc30.js routeBy), so the scene is a pure function
// of t; the panel is the viewer's own state, never part of a frozen frame. Its stylesheet (../computer.ba3976b6.css)
// loads with the module. Nothing is really controlled.
import { lerp, seg, outCubic, path, press, blink, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the bakery variant's frame sheet and its Expand button (bakery.005f5570.css .bk-btn / .bk-expand)
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries, in front of Expand
import { shareBtn } from './share.29a362ea.js';

const SAY = 'Done. I took control of your computer and opened a new tab.';
const CSS = new URL('../computer.ba3976b6.css?v=11', import.meta.url).href;
const DESK = { w: 1470, h: 919 }; // the desktop in its own px (computer.ba3976b6.css .cc3-desk)
const FIT = 560 / DESK.w; // the card's view (the bakery frame's 560x350): about 0.38
const FIT_BIG = 688 / DESK.w; // the side panel's view (.cc3-big, 688px wide): about 0.47
const TAB_W = 240; // Chrome's widest tab (.cc3-tab)
const PLUS_GAP = 8; // the new-tab button's left margin (.cc3-plus)
const PLUS = 28; // the new-tab button's size (.cc3-plus)
const TIP = { x: 4, y: 2.5 }; // the arrow's hotspot in its 24px box (shell.9b47fc30.js makeCursor's path)
const REST = { x: 1010, y: 640 }; // where the cursor sits on superbot.gg until superbot moves it
const SHOT = { home: 'computer.ba3976b6/superbot-home.png', ntp: 'computer.ba3976b6/new-tab.png' };
const PAGE = { w: 1470, h: 839 }; // both captures' size: the page area of full-screen Chrome on the desktop
const TITLE = 'the AI plans you pay for, in one app'; // superbot.gg's page title, up to its separator
const ARROW = 'M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z';
const ICON = {
  x: '<svg viewBox="0 0 16 16"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>',
  back: '<svg viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
  fwd: '<svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  reload: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 3v3h-3"/></svg>',
  tune: '<svg viewBox="0 0 16 16"><path d="M3 5h5.5M12.5 5H13M3 11h.5M7.5 11H13"/><circle cx="10.5" cy="5" r="1.6"/><circle cx="5.5" cy="11" r="1.6"/></svg>',
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></svg>',
  more: '<svg viewBox="0 0 16 16"><path d="M8 3.5h.01M8 8h.01M8 12.5h.01"/></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
};

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`computer-control variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// one screen share's insides, at a scale: the desktop (Chrome and the screen's cursor), then the takeover overlay
function screen(x, sb, fit) {
  return `<div class="cc3-desk" style="transform: scale(${fit.toFixed(5)})">
          <div class="cc3-win">
            <div class="cc3-strip">
              <span class="cc3-lights"><i></i><i></i><i></i></span>
              <span class="cc3-tab cc3-t1"><i class="cc3-bg"></i><span class="cc3-fav">${sb}</span><span class="cc3-tt">${x.esc(TITLE)}</span><span class="cc3-x">${ICON.x}</span></span>
              <span class="cc3-tab cc3-t2"><i class="cc3-bg"></i><span class="cc3-tt">New Tab</span><span class="cc3-x">${ICON.x}</span></span>
              <span class="cc3-plus">${ICON.plus}</span>
            </div>
            <div class="cc3-bar">
              <span class="cc3-ic">${ICON.back}</span><span class="cc3-ic cc3-dim">${ICON.fwd}</span><span class="cc3-ic">${ICON.reload}</span>
              <span class="cc3-omni">
                <span class="cc3-url cc3-u1"><span class="cc3-ic">${ICON.tune}</span>superbot.gg</span>
                <span class="cc3-url cc3-u2"><span class="cc3-ic">${ICON.search}</span><i class="cc3-caret"></i><span class="cc3-ph">Search Google or type a URL</span></span>
              </span>
              <i class="cc3-me"></i><span class="cc3-ic">${ICON.more}</span>
            </div>
            <img class="cc3-page cc3-p1" src="${x.img(SHOT.home)}" width="${PAGE.w}" height="${PAGE.h}" alt="superbot.gg: the agent to manage your agents.">
            <img class="cc3-page cc3-p2" src="${x.img(SHOT.ntp)}" width="${PAGE.w}" height="${PAGE.h}" alt="Chrome New Tab page">
          </div>
          <svg class="cc3-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW}"/></svg>
        </div>
        <i class="cc3-edge"><i class="cc3-soft"><i class="cc3-band"></i></i></i>
        <span class="cc3-pill">${sb}<span>superbot is controlling your computer</span></span>`;
}

// the nodes one view paints, looked up once
function bind(root) {
  const $ = (s) => root.querySelector(s);
  const t1 = $('.cc3-t1');
  return {
    t1, t2: $('.cc3-t2'), plus: $('.cc3-plus'), cursor: $('.cc3-cursor'), bg1: t1.querySelector('.cc3-bg'), omni: $('.cc3-omni'),
    u1: $('.cc3-u1'), u2: $('.cc3-u2'), caret: $('.cc3-caret'), p1: $('.cc3-p1'), p2: $('.cc3-p2'), edge: $('.cc3-edge'),
    soft: $('.cc3-soft'), pill: $('.cc3-pill'),
  };
}

// one view at t: the takeover overlay, the cursor's glide and click, the new tab and the page switch
function paint(v, T, t) {
  // the takeover: the vignette fades in as its gradient turns slowly and gently breathes, the pill rises
  const g = outCubic(seg(t, T.take, T.take + 0.55));
  v.edge.style.opacity = g.toFixed(3);
  v.edge.style.setProperty('--cc3-a', `${((t * 60) % 360).toFixed(1)}deg`);
  v.soft.style.opacity = (0.9 + 0.08 * Math.sin(t * 2.6)).toFixed(3);
  const pi = outCubic(seg(t, T.take + 0.12, T.take + 0.57));
  v.pill.style.opacity = pi.toFixed(3);
  v.pill.style.transform = `translate(-50%, ${((1 - pi) * 8).toFixed(2)}px)`;

  // the cursor, in the desktop's px: at rest on the page, then a glide onto the new-tab button, where it stays. The
  // button's spot is read off the first tab (it never moves), so after the click, when the new tab pushes the button
  // right, the cursor stays where it clicked, as a real one does
  const to = { x: v.t1.offsetLeft + TAB_W + PLUS_GAP + PLUS / 2, y: v.plus.offsetTop + PLUS / 2 };
  const at = t <= T.ptr ? REST : path(t, [{ t: T.ptr, ...REST }, { t: T.hov, ...to }]);
  v.cursor.style.transform = `translate(${(at.x - TIP.x).toFixed(2)}px, ${(at.y - TIP.y).toFixed(2)}px)`;

  // the click: the button's hover circle comes up under the cursor and darkens on the press, then the new tab slides
  // in and takes the active state
  const h = seg(t, T.hov - 0.15, T.hov) * (1 - seg(t, T.open, T.open + 0.2));
  v.plus.style.background = `rgba(60,64,67,${(0.1 * h + 0.1 * press(t, T.click)).toFixed(3)})`;
  const o = outCubic(seg(t, T.open, T.open + 0.3));
  v.t2.style.width = `${(TAB_W * o).toFixed(2)}px`;
  v.t2.style.opacity = o.toFixed(3);
  v.bg1.style.opacity = (1 - outCubic(seg(t, T.open, T.open + 0.2))).toFixed(3);

  // the page and the address bar follow the active tab: superbot.gg gives way to the New Tab page, quickly, as a tab
  // switch does, and the omnibox takes focus
  const f = outCubic(seg(t, T.open + 0.04, T.open + 0.22));
  v.p1.style.opacity = (1 - f).toFixed(3);
  v.p2.style.opacity = f.toFixed(3);
  v.u1.style.opacity = (1 - f).toFixed(3);
  v.u2.style.opacity = f.toFixed(3);
  v.omni.style.background = f > 0 ? `rgb(${Math.round(lerp(241, 255, f))},${Math.round(lerp(243, 255, f))},${Math.round(lerp(244, 255, f))})` : '';
  v.omni.style.boxShadow = f > 0 ? `inset 0 0 0 2px rgba(26,115,232,${(0.9 * f).toFixed(3)})` : '';
  v.caret.style.opacity = f >= 1 && !blink(t - T.open) ? '0' : '1';
}

export default {
  // `end` is the route's end (chat.9b47fc30.js routeBy, base end plus extra), so the run length is the router's call
  times(r, end = r + 3.75) {
    const T = { r };
    T.card = r + 0.22;
    T.take = r + 0.62; // the vignette and the pill fade in: superbot has control
    T.ptr = r + 1.0; // the cursor leaves its rest and glides to the new-tab button
    T.hov = r + 1.75;
    T.click = r + 1.9;
    T.open = r + 1.98; // the new tab slides in and the page switches
    T.end = end;
    return T;
  },
  build(k, x) {
    loadFrameSheet();
    loadSheet();
    const T = k.T;
    const sb = x.tile('superbot', 'cc3-sb');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="bk cc3">
      <div class="bk-head">
        <b class="bk-title">Your computer<small>Live view</small></b>
        ${shareBtn('Computer control')}
        ${EXPAND}
        <span class="bk-btn bk-publish cc3-stop"><i></i>Stop</span>
      </div>
      <div class="bk-view cc3-screen">${screen(x, sb, FIT)}</div>
    </div>`);
    const card = bind(block);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, decoding = false;

    // Expand: a side panel on the right of the app (the hub) with the same screen share, larger. Built the first time
    // it opens; while open it is painted with the card, from the same t
    const expand = block.querySelector('.bk-expand');
    expand.setAttribute('role', 'button');
    expand.setAttribute('tabindex', '0');
    expand.setAttribute('aria-expanded', 'false');
    let side = null, big = null, open = false;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    function setOpen(on) {
      if (on === open) return;
      if (on && !side) {
        side = x.el(`<aside class="cc3-side" aria-label="Your computer, live view">
          <div class="bk-head">
            <b class="bk-title">Your computer<small>Live view</small></b>
            <span class="bk-btn bk-publish cc3-stop"><i></i>Stop</span>
            <button class="cc3-side-x" type="button" aria-label="Close">${ICON.close}</button>
          </div>
          <div class="cc3-screen cc3-big">${screen(x, sb, FIT_BIG)}</div>
        </aside>`);
        block.closest('.hub').appendChild(side);
        big = bind(side);
        side.querySelector('.cc3-side-x').addEventListener('click', () => setOpen(false));
        // keys on the panel's buttons are theirs, not the spot clock's (space would pause it)
        side.addEventListener('keydown', (e) => { if (e.target.closest('button')) e.stopPropagation(); });
        side.getBoundingClientRect(); // lay it out closed first, so the first open slides in
      }
      open = on;
      side.classList.toggle('is-open', on);
      expand.setAttribute('aria-expanded', String(on));
      if (on) addEventListener('keydown', onKey); else removeEventListener('keydown', onKey);
    }
    expand.addEventListener('click', () => setOpen(!open));
    expand.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    });
    addEventListener('variantchange', () => setOpen(false));

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on both captures; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          for (const pic of [card.p1, card.p2]) {
            track(pic.decode().catch((e) => console.error(new Error(`computer-control capture failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        paint(card, T, t);
        // the panel belongs to the card: a restart that takes the card away closes it
        if (open && t < T.card) setOpen(false);
        if (open) paint(big, T, t);
      },
    };
  },
};
