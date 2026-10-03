// niche-wordpress-model-switch: the real superbot hub, cropped to its thread (rail, sidebar and chat header are hidden,
// ask.css; the composer is not drawn at all), laid out at DW design px and scaled to the frame width. It fades up from
// black on the empty state ("Good evening. Where do we go?" with the mascot); the ask types as a plain borderless line
// of text under the greeting (no box, no field fill, no icons, no buttons) and, on the send instant, rises away as the
// user's bubble lands at the top of the thread. superbot then hands the job from model to model (tabs-assets/chat.js).
// This file owns the CAMERA: at every hand-off it pushes in on the status line until it sits at frame centre at ~1.8x,
// holds while the spinner resolves to the check, and pulls back while the reply builds. A beat can ask for its own
// push (chat.js FOCUS: the Opus functions.php card fills the frame width while the fix types). Under prefers-reduced-motion every
// push is a cut (in at mid-push, out at mid-pull). The nozoom cut (?cut=nozoom, tabs-assets/cut.js) never moves the
// camera. render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's generated
// stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, renderChatAfter, BEATS, CAMERA, FOCUS, CHAT_END } from './tabs-assets/chat.js?v=f7b4fe31';
import { ZOOM as ZOOM_CUT } from './tabs-assets/cut.js?v=f7b4fe31';
import { lerp, seg, outCubic, outQuint, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// the camera
const ZOOM = 1.8;          // push-in on a status line, at most (the column cap below lands ~1.47x on 16:9, ~1.07x on 4:5)
const FILL_W = 0.84;       // ...but never wider than this share of the frame, so the longest status line is never clipped
const COL_INSET = 20;      // ...and never so far that the thread's column (bubble, cards) plus this inset (design px) each
                           // side is wider than the frame: status lines keep it on the left, the bubble on the right
const OPEN = 0.3;          // the greeting fades up as the scene opens from black
const DROP = 0.5; /* deliberate */ // on send, the typed line rises away and the empty-state zoom eases out
const TAIL = 0.3;          // the scene's own fade to the end card (timeline.js SCENE_FADE) after the last beat

const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

let el = null;

// the design box: a thread-wide hub, scaled so it fills the frame width (narrow ratios keep a readable column)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const DW = Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.geo = { W, DW, DH, k, lift: null, col: null };
  return el.geo;
}

// place the greeting and the typed line as one group centred in the frame (once per frame size)
function lift(g) {
  if (g.lift !== null) return g.lift;
  const main = el.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.height / g.DH;
  const heroH = el.hero.getBoundingClientRect().height / s;
  const lineH = 48; // two lines of the typed ask (it wraps on the narrow 4:5 column)
  const groupTop = (g.DH - (heroH + 30 + lineH)) / 2;
  el.hero.style.top = groupTop.toFixed(2) + 'px';
  el.line.style.top = (groupTop + heroH + 30).toFixed(2) + 'px';
  g.lift = 1;
  return g.lift;
}

// how far the camera is pushed in on pill (or beat focus) m at t: 0 at rest, 1 parked on it
function pushOf(m, t, rm) {
  if (rm) return t >= (m.sw + m.landed) / 2 && t < (m.pull + m.back) / 2 ? 1 : 0;
  return outQuint(seg(t, m.sw, m.landed)) * (1 - inOutCubic(seg(t, m.pull, m.back)));
}

export default {
  id: 'tabs',
  dur: CHAT_END + TAIL,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    // the ask as a plain line of text under the greeting: no box, no fill, no icons, no buttons
    const line = document.createElement('div');
    line.className = 'ask-line';
    main.appendChild(line);
    el = { site: q('.sbsite'), hub, main, hero, line, geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    lift(g);
    const rm = reduced();

    // empty state -> thread: the greeting lifts away and the typed line rises out as the bubble lands
    const drop = rm ? (t >= FIRST.send ? 1 : 0) : inOutCubic(seg(t, FIRST.send, FIRST.send + DROP));
    const heroIn = rm ? 1 : outCubic(seg(t, 0, OPEN));
    const heroOut = rm ? (t >= FIRST.send ? 1 : 0) : outCubic(seg(t, FIRST.send, FIRST.send + OPEN));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;
    const lineOut = rm ? (t >= FIRST.send ? 1 : 0) : outCubic(seg(t, FIRST.send, FIRST.send + 0.25));
    el.line.style.opacity = (heroIn * (1 - lineOut)).toFixed(3);
    el.line.style.transform = `translate(-50%, ${(-lineOut * 60).toFixed(2)}px)`;

    // the chat first (it scrolls the thread), so the camera can find the pill where it sits this frame
    renderChat(el.chat, t, el.line);

    // camera. At rest it frames the whole design box (centre DW/2, DH/2); the empty state sits a little pushed in
    // (a narrow column already fills the frame, so it pushes in less) and eases out as the ask is sent. The nozoom
    // cut stays at rest throughout (CAMERA and FOCUS are empty there too).
    const z0 = g.DW < 700 ? 1.06 : 1.12;
    let z = rm || !ZOOM_CUT ? 1 : lerp(z0, 1, drop);
    let cx = g.DW / 2, cy = g.DH / 2;
    // the thread's column in design px (measured once per frame size): a push never crops it left or right, so no
    // line of the bubble or a card is ever cut mid-word at the frame's side edges
    if (!g.col) { const c = boxIn(el.chat.inner, el.site); g.col = { l: c.x, r: c.x + c.w }; }
    for (const m of CAMERA) {
      const f = pushOf(m, t, rm);
      if (f <= 0 || !m.node) continue;
      // the status line's box in design px (boxIn divides out the camera's own scale, so this does not feed back)
      const b = boxIn(m.node, el.site);
      const zFit = W / Math.max(1, (g.col.r - g.col.l + 2 * COL_INSET) * g.k);
      const zp = Math.max(1, Math.min(ZOOM, (W * FILL_W) / Math.max(1, b.w * g.k), zFit));
      const half = W / (2 * g.k * zp);
      const lo = g.col.l - COL_INSET + half, hi = g.col.r + COL_INSET - half;
      const tx = lo > hi ? (g.col.l + g.col.r) / 2 : Math.min(hi, Math.max(lo, b.cx));
      cx = lerp(cx, tx, f); cy = lerp(cy, b.cy, f); z = lerp(z, zp, f);
    }
    // a beat's own push (chat.js FOCUS, e.g. the Opus code panel): centre the node and scale it to fill m.fill of the
    // frame width, never past 92% of the frame height and never below the resting scale (4:5 already fills its width)
    for (const m of FOCUS) {
      const f = pushOf(m, t, rm);
      if (f <= 0 || !m.node) continue;
      const b = boxIn(m.node, el.site);
      const zp = Math.max(1, Math.min((W * m.fill) / Math.max(1, b.w * g.k), (H * 0.92) / Math.max(1, b.h * g.k)));
      cx = lerp(cx, b.cx, f); cy = lerp(cy, b.cy, f); z = lerp(z, zp, f);
    }
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;

    renderChatAfter(el.chat, t);
  },
};
