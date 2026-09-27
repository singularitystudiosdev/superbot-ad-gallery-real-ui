// every-model-one-chat (forked from it-does-what-you-ask): the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header
// are hidden, ask.css), laid out at DW design px and scaled to the frame width. It opens on the empty state
// ("Good evening. Where do we go?" over a centred composer) with a slight camera push; the first send drops the
// composer to the bottom, lifts the greeting away and settles the camera on the thread at 1:1, so the chat column
// spans the frame width at every ratio (no switch zoom-ins) while the chat plays (tabs-assets/chat.js). render(lt)
// is a pure function of local time. The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under
// #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END } from './tabs-assets/chat.js?v=15';
import { CFG } from './tabs-assets/cuts.js?v=5';
import { clamp, lerp, seg, outCubic, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

let el = null;

// the design box: the thread column fills the frame width, so there are no empty side bands at any ratio. The
// box always has the frame's own aspect ratio (k = W/DW, DH = H/k), which means the camera at Z = 1 shows the
// whole box: the composer and the thread column (ask.css sizes both off --dw) span the frame edge to edge.
// DW is derived from the vertical design height the ad needs instead of a fixed zoom: landscape ratios get
// DH = MIN_DH (16:9 -> 1138 x 640, 4:3 -> 853 x 640, 1:1 -> 640 x 640), which keeps the type readable while the
// column spans the frame; narrow ratios hit MIN_DW first and only get taller (4:5 -> 560 x 700).
// Every reply card spans the full column width. Only the game window cannot keep its native aspect at full width
// on a landscape frame (it would be taller than the thread), so its screen height is capped by the thread's own
// height (--game-h, measured here once per frame width; ask.css) and the clip covers the wider window.
const MIN_DW = 560, MIN_DH = 640;
const GAME_AR = 1162 / 840, GAME_ROOM = 76; // the clip's aspect; thread height kept free above the game screen
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
  el.site.style.setProperty('--game-h', Math.min(colW / GAME_AR, viewH - GAME_ROOM).toFixed(1) + 'px');
  el.geo = geom;
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

// camera shots in design px: Z multiplies the fit scale k and (x, y) is the design point held at the frame
// centre, clamped so the frame never leaves the hub
function shot(g, Z, x, y) {
  const hw = g.DW / (2 * Z), hh = g.DH / (2 * Z);
  return { Z, x: clamp(x, hw, g.DW - hw), y: clamp(y, hh, g.DH - hh) };
}
// zoom blends in log space so a push in and a pull back read at the same speed
const mix = (a, b, p) => (p <= 0 ? a : p >= 1 ? b : { Z: Math.exp(lerp(Math.log(a.Z), Math.log(b.Z), p)), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

export default {
  id: 'tabs',
  dur: CHAT_END + 0.15,

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
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
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
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.15, 0.8));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);

    // camera: a slight push on the empty state, then the thread at 1:1 (the box already fills the frame width,
    // so no crop and no zoom on a model switch: the routing chips play at full width like everything else)
    const empty = shot(g, lerp(1.05, 1.02, inOutCubic(seg(t, 0, CHAT_T0))), g.DW / 2, g.DH / 2);
    let c = mix(empty, shot(g, 1, g.DW / 2, g.DH), inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.5)));

    // the finale frames the running game (already full column width): the zoom cut dives until its screen covers
    // the whole frame (1% overscan so no card edge shows), the other cuts get a gentle push onto it
    const f = el.chat.focus;
    const zf = f ? inOutCubic(seg(t, f.a, f.b)) : 0;
    if (zf > 0) {
      const b = boxIn(f.el, el.site);
      const Z = CFG.zoom ? Math.max(g.DW / b.w, g.DH / b.h) * 1.01 : 1.04;
      c = mix(c, shot(g, Z, b.cx, b.cy), zf);
    }
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * c.Z).toFixed(5)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;
  },
};
