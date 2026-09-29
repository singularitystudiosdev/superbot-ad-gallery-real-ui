// do-my-job-journalist: the job part. Two layers in one scene.
//  (1) THE CHAT: the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header are
//      hidden, ask.css), laid out at DW design px and scaled to the frame width. The ask is typed, sent, and
//      superbot answers in place; its last reply carries the card that signs it in to WordPress.
//  (2) THE DESKTOP: the camera dives into that card (the make-minecraft zoom cut's move) and the full-frame
//      WordPress desk (tabs-assets/wp.js: the block editor beside the day's story budget) is revealed under it.
//      From then on the desk is the stage: it connects, matches your writing style, reads the AP Stylebook and
//      files the story budget.
// render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's stylesheets
// (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END, CHAT_ZOOM } from './tabs-assets/chat.js?v=1';
import wp from './tabs-assets/wp.js?v=1';
import { clamp, lerp, seg, outCubic, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// the desktop's clock starts here (scene-local); the dive and the reveal overlap around it
const DESK_T0 = 4.70;
const CHAT_OUT = [4.85, 5.15];          // the hub fades out over the tail of the dive
const DESK_IN = [4.70, 5.15];           // the desktop scales up and fades in over the same window

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

// a camera: the scale, and the design-px point that is held at the frame's centre
const shot = (g, Z, x, y) => ({ Z, x, y });
const mix = (a, b, f) => ({ Z: lerp(a.Z, b.Z, f), x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });

export default {
  id: 'tabs',
  dur: DESK_T0 + wp.DUR,

  mount(section, ctx) {
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
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null,
      askRoot: q('.ask-root'), desk: null };
    el.chat = mountChat(hub);
    el.desk = wp.mount(section, ctx);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // ---- layer 1: the hub, up to the end of the dive ----
    const chatOn = 1 - inOutCubic(seg(t, CHAT_OUT[0], CHAT_OUT[1]));
    el.askRoot.style.opacity = chatOn.toFixed(3);
    el.askRoot.style.visibility = chatOn <= 0.002 ? 'hidden' : '';
    if (chatOn > 0.002) {
      // camera: pushed in on the empty state, easing out once the thread starts
      // (a narrow column already fills the frame, so it pushes in less)
      const z0 = g.DW < 700 ? 1.08 : 1.2, z1 = g.DW < 700 ? 1.04 : 1.1;
      const z = lerp(z0, z1, inOutCubic(seg(t, 0, CHAT_T0))) * lerp(1, 1 / z1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.7)));
      const cam = shot(g, z, g.DW / 2, g.DH / 2);
      // the finale: the signin card hands the camera a box and the dive runs until that box fills the frame:
      // b055c127's zoom cut. The scale is the FIT (min, not the reference's max): the card carries text to its
      // own edges, so covering the frame on the wide axis would slice its sentences on a narrow ratio.
      const f = el.chat && el.chat.focus;
      const zf = f ? inOutCubic(seg(t, f.a, f.b)) : 0;
      let c = cam;
      if (zf > 0) {
        const b = boxIn(f.el, el.site);
        const Z = Math.min(g.DW / b.w, g.DH / b.h) * 1.02;
        c = mix(cam, shot(g, Z, b.cx, b.cy), zf);
      }
      el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * c.Z).toFixed(5)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;

      // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
      const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
      el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
      const heroIn = outCubic(seg(t, 0.15, 0.8));
      const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
      el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
      el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

      renderChat(el.chat, t);
    }

    // ---- layer 2: the WordPress desk, from the landing of the dive to the end of the scene ----
    // (written every frame, so seeking back into the chat hides it again)
    const e = inOutCubic(seg(t, DESK_IN[0], DESK_IN[1]));
    el.desk.root.style.opacity = e.toFixed(3);
    el.desk.root.style.visibility = e <= 0 ? 'hidden' : '';
    el.desk.root.style.transform = `scale(${lerp(1.10, 1, e).toFixed(5)})`;
    if (e > 0) wp.render(clamp(t - DESK_T0, 0, wp.DUR), W);
  },
};