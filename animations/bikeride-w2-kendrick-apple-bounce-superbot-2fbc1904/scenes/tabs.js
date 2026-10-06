// bikeride-model-switch: the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header are
// hidden, ask.css), laid out at DW design px and scaled to the frame width. It fades up from black on the empty state
// ("Good evening. Where do we go?" over a centred composer), the ask is typed and sent, and superbot hands the build
// from model to model (tabs-assets/chat.js). This file owns the CAMERA: at every hand-off it pushes in on the switch
// pill until the pill sits at frame centre at ~1.8x, holds while the spinner resolves to the check, and pulls back
// while the reply builds. A beat can ask for its own push (chat.js FOCUS: the Opus code panel fills the frame width
// while the run plays). Under prefers-reduced-motion every push is a cut (in at mid-push, out at mid-pull).
// The nozoom cut (?cut=nozoom, tabs-assets/cut.js) never moves the camera: no empty-state zoom, no pill push, no
// panel push; the design box sits at rest (scale 1, centred) from the first frame to the last.
// render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's generated stylesheets
// (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, renderChatAfter, envAt, BEATS, CAMERA, FOCUS, CHAT_END } from './tabs-assets/chat.js?v=e2834f7d';
import { ZOOM as ZOOM_CUT } from './tabs-assets/cut.js?v=e2834f7d';
import { lerp, seg, outCubic, outQuint, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// the camera
const ZOOM = 1.8;          // push-in on a pill, over the resting frame (the brief's 1.6-1.9x)
const FILL_W = 0.84;       // ...but never wider than this share of the frame, so the longest pill is never clipped
const OPEN = 0.3;          // the greeting fades up as the scene opens from black
const DROP = 0.5; /* deliberate */ // on send, the composer glides to the bottom and the empty-state zoom eases out
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
  el.geo = { W, DW, DH, k, lift: null };
  return el.geo;
}

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group
// centred in the frame
function lift(g) {
  if (g.lift !== null) return g.lift;
  const main = el.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.height / g.DH;
  const comp = el.composer.getBoundingClientRect(), hero = el.hero.getBoundingClientRect();
  const compH = comp.height / s, heroH = hero.height / s;
  const groupTop = (g.DH - (heroH + 34 + compH)) / 2;
  el.hero.style.top = groupTop.toFixed(2) + 'px';
  g.lift = (comp.top - main.top) / s - (groupTop + heroH + 34);
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
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { root: q('.ask-root'), site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);
    const rm = reduced();

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = rm ? (t >= FIRST.send ? 1 : 0) : inOutCubic(seg(t, FIRST.send, FIRST.send + DROP));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = rm ? 1 : outCubic(seg(t, 0, OPEN));
    const heroOut = rm ? (t >= FIRST.send ? 1 : 0) : outCubic(seg(t, FIRST.send, FIRST.send + OPEN));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    // match cut: the backdrop swaps on the downbeat, no fade (chat.js envAt)
    const env = envAt(t);
    if (env !== el.env) { el.env = env; el.root.style.background = env; el.hub.style.background = env; el.main.style.background = env; }

    // the chat first (it scrolls the thread), so the camera can find the pill where it sits this frame
    renderChat(el.chat, t);

    // camera. At rest it frames the whole design box (centre DW/2, DH/2); the empty state sits a little pushed in
    // (a narrow column already fills the frame, so it pushes in less) and eases out as the ask is sent. The nozoom
    // cut stays at rest throughout (CAMERA and FOCUS are empty there too).
    const z0 = g.DW < 700 ? 1.06 : 1.12;
    let z = rm || !ZOOM_CUT ? 1 : lerp(z0, 1, drop);
    let cx = g.DW / 2, cy = g.DH / 2;
    for (const m of CAMERA) {
      const f = pushOf(m, t, rm);
      if (f <= 0 || !m.node) continue;
      // the pill's box in design px (boxIn divides out the camera's own scale, so this does not feed back)
      const b = boxIn(m.node, el.site);
      const zp = Math.min(ZOOM, (W * FILL_W) / Math.max(1, b.w * g.k));
      cx = lerp(cx, b.cx, f); cy = lerp(cy, b.cy, f); z = lerp(z, zp, f);
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
