// first-model-all-models, the chat (7.0 s): the real superbot hub, cropped to its thread and composer (rail, sidebar and
// chat header are hidden, tabs-assets/ask.css), laid out at DW design px and scaled to the frame width. It opens on the
// empty state ("Good evening. Where do we go?" over a centred composer) with a slight camera push while the ask is
// typed; the send drops the composer to the bottom, lifts the greeting away and settles the camera on the
// thread at 1:1, where the three hand-offs play (tabs-assets/chat.js). The finale is the output window
// (beats/output.js): the camera pushes into its 16:9 screen and lands exactly on the clip scene's opening framing
// (tabs-assets/cuts.js CLIP / clipFrame), with the clip's settle speed, so timeline.js hard-cuts tabs>clip.
// render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's generated stylesheets
// (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, ASK } from './tabs-assets/chat.js?v=18';
import { TABS_DUR, CLIP, clipFrame, SETTLE_V0 } from './tabs-assets/cuts.js?v=8';
import { clamp, lerp, seg, outCubic, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;

let el = null;

// the design box: the thread column fills the frame width, so there are no empty side bands at any ratio. The box
// always has the frame's own aspect ratio (k = W/DW, DH = H/k), so the camera at Z = 1 shows the whole box. DW comes
// from the vertical design height the ad needs: landscape ratios get DH = MIN_DH (16:9 -> 1138 x 640, 4:3 -> 853 x 640),
// narrow ratios hit MIN_DW first and only get taller (4:5 -> 560 x 700, k = 1.543).
const MIN_DW = 560, MIN_DH = 640;
const PLAY_ROOM = 118; // thread height kept free around the output window's 16:9 screen (its bar and the line above)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const DW = Math.max(MIN_DW, (W * MIN_DH) / H);
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  // layout sizes (untransformed design px): the thread's visible height and the reply column's width
  const cs = getComputedStyle(el.feed);
  const viewH = el.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const colW = el.feed.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 10;
  const geom = { W, DW, DH, k, lift: null };
  if (!(viewH > 0 && colW > 0)) return geom; // not laid out yet (scene hidden): measure again next frame
  // the output window: the widest 16:9 screen the thread shows whole
  const playH = Math.min((colW * 9) / 16, viewH - PLAY_ROOM);
  el.site.style.setProperty('--play-w', ((playH * 16) / 9).toFixed(1) + 'px');
  el.geo = geom;
  return el.geo;
}

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group centred
// in the frame
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

// camera shots in design px: Z multiplies the fit scale k and (x, y) is the design point held at the frame centre,
// clamped so the frame never leaves the hub
function shot(g, Z, x, y) {
  const hw = g.DW / (2 * Z), hh = g.DH / (2 * Z);
  return { Z, x: clamp(x, hw, g.DW - hw), y: clamp(y, hh, g.DH - hh) };
}
// zoom blends in log space so a push in and a pull back read at the same speed
const mix = (a, b, p) => (p <= 0 ? a : p >= 1 ? b : { Z: Math.exp(lerp(Math.log(a.Z), Math.log(b.Z), p)), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

// the push's progress: a cubic Hermite from rest to 1 whose end slope (m1, in progress per unit x) is the clip's
// opening settle speed, so the motion carries across the hard cut instead of stopping dead on it
const hermite = (x, m1) => 3 * x * x - 2 * x * x * x + m1 * (x * x * x - x * x);

const Z_EMPTY = [1.05, 1.02]; // a slight push on the empty state while the ask is typed (the composer spans the column)

export default {
  id: 'tabs',
  dur: TABS_DUR,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    // the composer as the empty state shows it: SUPER is a switch (off), the model chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), feed: hub.querySelector('.feed'), geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, ASK.send - 0.06, ASK.send + 0.4));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroOut = outCubic(seg(t, ASK.send - 0.08, ASK.send + 0.26));
    el.hero.style.opacity = (1 - heroOut).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${(-heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);

    // camera: a slight push on the empty state while the ask is typed, then the thread at 1:1 (the box already
    // fills the frame width, so a model switch needs no zoom: the routing chips are sized to read at feed size)
    const empty = shot(g, lerp(Z_EMPTY[0], Z_EMPTY[1], seg(t, 0, ASK.send)), g.DW / 2, g.DH / 2);
    let c = mix(empty, shot(g, 1, g.DW / 2, g.DH), inOutCubic(seg(t, ASK.send - 0.06, ASK.send + 0.44)));

    // the finale: push into the output window's screen until its height is the frame's times CLIP.S0, holding the
    // video x the clip scene holds at the frame centre (clipFrame fx), so the cut to the clip is invisible
    const f = el.chat.focus;
    if (f && t > f.a) {
      const b = boxIn(f.el, el.site);
      const Z1 = (CLIP.S0 * g.DH) / b.h;
      const fx = clipFrame(W, CLIP.S0).fx;
      const uA = Math.log(c.Z), uB = Math.log(Z1);
      const m1 = uB > uA ? (SETTLE_V0 * (f.b - f.a)) / (uB - uA) : 0;
      const p = hermite(seg(t, f.a, f.b), m1);
      c = { Z: Math.exp(lerp(uA, uB, p)), x: lerp(c.x, b.x + fx * b.w, p), y: lerp(c.y, b.cy, p) };
    }
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${(H / 2).toFixed(2)}px) scale(${(g.k * c.Z).toFixed(5)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;
  },
};
