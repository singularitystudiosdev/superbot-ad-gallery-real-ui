// scenes/yt/frame.js: the superbot window that every YouTube screen of this spot sits in. Same geometry, surface,
// edge and title bar as the thread window (scenes/thread/thread.js FRAME + thread.css .tw-win/.tw-bar), so the 0.22 s
// crossfades between the thread and YouTube read as one window: only the label and the right-hand brand change.
// YouTube is never full-bleed: the screen is the content box under the title bar, 56 px in from the stage sides.
//
// API
//   FRAME                          { x:56, y:44, w:1808, h:992, bar:76, radius:26 } (stage px, === thread FRAME)
//   SCREEN                         { w:1808, h:916 } the content box under the bar (stage px)
//   buildFrame(root, { label, mark: 'youtube'|'studio', right })
//        -> { el, win, bar, screen, label, brand, mark, render(t) }
//        root    the scene <section> (or any positioned box at stage size); the frame is appended to it
//        label   the text after the divider (e.g. 'YouTube Studio', 'YouTube')
//        mark    'youtube' (red YouTube icon) or 'studio' (the YouTube Studio lock-up) at the right of the bar
//        right   the plain text beside that brand (default the channel handle '@samriveratests'); '' for none
//        screen  the box the YouTube page mounts into (position:relative, overflow:hidden, 1808 x 916)
//        render(t)  draws the mascot's frame t (call it from the scene's render with the global t)
//   ensureCss(url) / cssReady      add a stylesheet once; a promise that settles when frame.css has loaded
import { esc } from '../../lib.js';
import { makeMark } from '../../shell.js';
import { CREATOR } from './content.js';
import { YT_ICON, STUDIO_LOGO } from './icons.js';

const V = '0311b486';
export const FRAME = { x: 56, y: 44, w: 1808, h: 992, bar: 76, radius: 26 };
export const SCREEN = { w: FRAME.w, h: FRAME.h - FRAME.bar };

const loaded = new Map();
/** ensureCss(href) -> Promise: link a stylesheet once per document (resolves on load or error, never rejects). */
export function ensureCss(href) {
  if (loaded.has(href)) return loaded.get(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  const p = new Promise((res) => { link.onload = () => res(true); link.onerror = () => res(false); });
  document.head.appendChild(link);
  loaded.set(href, p);
  return p;
}
export const cssUrl = (f) => new URL(`./${f}?v=${V}`, import.meta.url).href;
export const cssReady = typeof document !== 'undefined' ? ensureCss(cssUrl('frame.css')) : Promise.resolve(true);

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

/** buildFrame(root, { label, mark, right }) -> { el, win, bar, screen, label, brand, mark, render } */
export function buildFrame(root, { label = 'YouTube', mark = 'youtube', right = CREATOR.handle } = {}) {
  const brand = mark === 'studio'
    ? `<span class="ytf-studio" aria-label="YouTube Studio">${STUDIO_LOGO('#f1f1f1')}</span>`
    : `<span class="ytf-icon" aria-label="YouTube">${YT_ICON}</span>`;
  const el = h(`<div class="ytf-root">
    <div class="ytf-win">
      <div class="ytf-bar">
        <span class="ytf-mark"></span><b class="ytf-brandname">superbot</b><i class="ytf-sep"></i><span class="ytf-label">${esc(label)}</span>
        <span class="ytf-conn">${brand}${right ? `<span class="ytf-handle">${esc(right)}</span>` : ''}</span>
      </div>
      <div class="ytf-screen"></div>
    </div>
  </div>`);
  root.appendChild(el);
  const m = makeMark(46);
  el.querySelector('.ytf-mark').appendChild(m.el);
  return {
    el,
    win: el.querySelector('.ytf-win'),
    bar: el.querySelector('.ytf-bar'),
    screen: el.querySelector('.ytf-screen'),
    label: el.querySelector('.ytf-label'),
    brand: el.querySelector('.ytf-conn'),
    mark: m,
    render(t) { m.render(t); },
  };
}
