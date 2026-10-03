// The BEFORE (the spot's opening, ytv10): the same superbot-framed YouTube Studio comments page as the AFTER
// (studio-page.js), title bar label "Before", header state "1,284 comments, 0 replies". The PILE: thirteen comment
// rows drop in one after another at the top of the list, each pushing the older rows down and off the bottom of the
// frame, the stagger accelerating from 0.45 s to 0.15 s; the five top comments are interleaved with eight fillers and
// Priya lands LAST, so she sits on top when the pile settles. Every row ends on a quiet grey "No reply" (no hearts, no
// Reply links, no times). The pile settles and holds; superbot's caption lands on the frame margin below the window
// ("1,284 comments. Not one answered."). Then the page eases back and shrinks away as the hub's empty state fades up
// behind it (chat.js HUB_IN), and the ask is typed (chat.js CHAT_T0 = BEFORE_END + 0.1).
// It lives on its own layer in the scene root (outside the camera), above the hub. Pure function of t.
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js';
import { SC, windowMarkup, topRow, fillerRow, esc } from './studio-page.js?v=ce37f243';

const LABEL = 'Before';
const STATE = '1,284 comments, 0 replies';
const CAPTION = '1,284 comments. Not one answered.';
// landing order (t = TOP index, f = FILLERS index): Priya (t0) last, so she ends on top
const PILE = ['f0', 't4', 'f1', 'f2', 't3', 'f3', 'f4', 't2', 'f5', 'f6', 't1', 'f7', 't0'];
// the framed window (frame px): the dark superbot margin around it, a deeper band below for the caption
const R = { x: 64, y: 32, w: 1792, h: 900 };
// timing (scene-local seconds)
const FIRST = 0.4;                  // the first row starts dropping (the scene has faded up from black)
const GAP0 = 0.45, GAP1 = 0.15;     // the stagger between rows, accelerating linearly from GAP0 to GAP1
const DROP = 0.35;                  // one row dropping in, outCubic, no bounce
export const LAND = PILE.map((_, i) => FIRST + Array.from({ length: i }, (_, j) => lerp(GAP0, GAP1, j / (PILE.length - 2))).reduce((a, b) => a + b, 0));
export const SETTLED = LAND[LAND.length - 1] + DROP;  // the pile has stopped
const CAP_AT = SETTLED + 0.15;      // the caption lands
const CAP_IN = 0.45;
export const RECEDE = 5.75;         // the page starts easing back into the hub
export const BEFORE_END = 6.6;      // ...and is gone
const CAP_OUT = 0.3;
const SHRINK = 0.6;                 // the page eases back and fades over the backdrop; the backdrop then lifts

export default {
  mount(root) {
    const brand = (f) => new URL('../../../brand/' + f, import.meta.url).href;
    const img = (f) => new URL('../../../img/' + f, import.meta.url).href;
    const sbSrc = root.querySelector('.rail-item.sb img').src;
    // display order: the last row to land sits on top
    const order = [...PILE].reverse();
    const list = order.map((k) => `<div class="bf-slot" data-k="${k}">${k[0] === 't' ? topRow(+k.slice(1), 'before', img) : fillerRow(+k.slice(1), img)}</div>`).join('');
    const dim = document.createElement('div');
    dim.className = 'bf-dim';
    const layer = document.createElement('div');
    layer.className = 'st-full bf-full';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = windowMarkup({ sbSrc, brand, label: esc(LABEL), state: esc(STATE), list });
    const cap = document.createElement('div');
    cap.className = 'bf-cap';
    cap.textContent = CAPTION;
    root.append(dim, layer, cap);
    const win = layer.firstElementChild;
    const app = win.querySelector('.st-app');
    const sb = win.querySelector('.st-sb');
    const slots = [...layer.querySelectorAll('.bf-slot')].map((n) => {
      const blk = n.firstElementChild;
      blk.style.opacity = '1';
      return { n, blk, at: LAND[PILE.indexOf(n.dataset.k)], h: '' };
    });
    return { root, dim, layer, win, app, sb, cap, slots, geo: '' };
  },

  render(b, t) {
    if (!b) return;
    if (t >= BEFORE_END) {
      if (b.layer.style.display !== 'none') { b.layer.style.display = 'none'; b.dim.style.display = 'none'; b.cap.style.display = 'none'; }
      return;
    }
    if (b.layer.style.display === 'none') { b.layer.style.display = ''; b.dim.style.display = ''; b.cap.style.display = ''; }
    const W = b.root.offsetWidth, H = b.root.offsetHeight;
    const key = `${W}x${H}`;
    if (key !== b.geo) {
      b.geo = key;
      const DW = R.w / SC, DH = R.h / SC;
      b.win.style.width = `${DW.toFixed(2)}px`;
      b.win.style.height = `${DH.toFixed(2)}px`;
      b.win.style.transform = `scale(${SC})`;
      b.app.style.width = `${DW.toFixed(2)}px`;
      b.app.style.minHeight = `${(DH - b.sb.offsetHeight).toFixed(2)}px`;
      b.cap.style.top = `${(R.y + R.h + (H - R.y - R.h) / 2).toFixed(1)}px`;
    }
    // the receding: the page eases back (shrinks about its centre) and fades, the backdrop gives way to the hub
    const e = inOutCubic(seg(t, RECEDE, RECEDE + SHRINK));
    const s = lerp(1, 0.7, e);
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    const w = R.w * s, h = R.h * s;
    b.layer.style.left = `${(cx - w / 2).toFixed(2)}px`;
    b.layer.style.top = `${(cy - h / 2 + 40 * e).toFixed(2)}px`;
    b.layer.style.width = `${R.w.toFixed(2)}px`;
    b.layer.style.height = `${R.h.toFixed(2)}px`;
    b.layer.style.transformOrigin = '0 0';
    b.layer.style.transform = s < 1 ? `scale(${s.toFixed(5)})` : 'none';
    b.layer.style.borderRadius = '14px';
    // it fades out completely over superbot's opaque backdrop, THEN the backdrop lifts to the hub (chat.js HUB_IN),
    // so the page and the hub never show through each other
    b.layer.style.opacity = (1 - seg(t, RECEDE + 0.3, RECEDE + SHRINK)).toFixed(3);
    b.dim.style.opacity = (1 - inOutCubic(seg(t, RECEDE + SHRINK, BEFORE_END))).toFixed(3);

    // the pile: each slot opens from 0 to its row's height (pushing the older rows down) while its row drops in
    b.slots.forEach((o) => {
      const p = outCubic(seg(t, o.at, o.at + DROP));
      const full = o.blk.offsetHeight;
      const want = p >= 1 ? 'auto' : `${(full * p).toFixed(2)}px`;
      if (want !== o.h) { o.n.style.height = want; o.h = want; }
      o.blk.style.opacity = outCubic(seg(t, o.at, o.at + DROP * 0.7)).toFixed(3);
      o.blk.style.transform = p >= 1 ? 'none' : `translateY(${(-(1 - p) * 26).toFixed(2)}px)`;
    });

    const c = outCubic(seg(t, CAP_AT, CAP_AT + CAP_IN)) * (1 - seg(t, RECEDE, RECEDE + CAP_OUT));
    b.cap.style.opacity = c.toFixed(3);
    b.cap.style.transform = `translate(-50%, -50%) translateY(${((1 - outCubic(seg(t, CAP_AT, CAP_AT + CAP_IN))) * 12).toFixed(2)}px)`;
  },
};
