// Phone-notification beat (the 'reminder' variant): asked "Set a notification to go off in my phone in one hour",
// superbot answers with one line and a single notification bar, nothing more: a white bell, the countdown (1:00:00,
// then ticking down in real time: 59:59, 59:58, ...) and a Cancel button. The bar rises in like the other variants'
// answers. The countdown is a function of t alone, so every frozen frame (?t=) is identical; no real notification is
// scheduled. Squeezed into the window the Gemini beat leaves plus the route's `extra` (chat.9b47fc30.js routeBy), so
// the scene is a pure function of t. Its stylesheet (../reminder.e55fb320.css) loads with the module.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';

const SAY = "Done. Your phone will go off in 1 hour.";
const CSS = new URL('../reminder.e55fb320.css?v=4', import.meta.url).href;
const HOUR = 3600;
const BELL = '<svg viewBox="0 0 24 24"><path d="M12 2.5a1.4 1.4 0 0 1 1.4 1.4v.6a6.2 6.2 0 0 1 4.8 6.1v4.2l1.7 2.3a.9.9 0 0 1-.7 1.4H4.8a.9.9 0 0 1-.7-1.4l1.7-2.3v-4.2a6.2 6.2 0 0 1 4.8-6.1v-.6A1.4 1.4 0 0 1 12 2.5zM9.6 19.6h4.8a2.4 2.4 0 0 1-4.8 0z"/></svg>';

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`reminder variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// the countdown at t: a full hour until the bar has landed, then real time
function clock(t, T) {
  const n = Math.ceil(HOUR - Math.max(0, t - T.go) - 1e-6), h = Math.floor(n / HOUR), m = Math.floor((n % HOUR) / 60), s = String(n % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export default {
  // `end` is the route's end (chat.9b47fc30.js routeBy, base end plus extra), so the loop length is the router's call
  times(r, end = r + 4.15) {
    const T = { r };
    T.bar = r + 0.3;
    T.go = T.bar + 0.45; // the countdown starts once the bar has landed
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const bar = x.el(`<div class="rmx"><span class="rmx-bell">${BELL}</span><span class="rmx-left">1:00:00</span><span class="rmx-cancel">Cancel</span></div>`);
    const left = bar.querySelector('.rmx-left');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, txt = '';

    return {
      nodes: [say, bar],
      marks: [[T.r, say], [T.bar, bar]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const i = outCubic(seg(t, T.bar, T.bar + 0.45));
        bar.style.opacity = i.toFixed(3);
        bar.style.transform = i >= 1 ? 'none' : `translateY(${((1 - i) * 12).toFixed(2)}px) scale(${lerp(0.97, 1, i).toFixed(4)})`;
        const c = clock(t, T);
        if (c !== txt) { left.textContent = c; txt = c; }
      },
    };
  },
};
