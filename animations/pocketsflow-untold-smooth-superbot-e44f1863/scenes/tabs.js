// Act 3: the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header hidden, ask.css),
// laid out at DW design px and scaled to the frame. It opens on the empty state ("Good evening. Where do we go?" over
// a centred composer) with the camera pushed in; the mascot file drops into the composer, the ask types and sends,
// the composer glides to the bottom and the camera eases out, and the thread plays (tabs-assets/thread.js). At the
// end the camera pushes into the finished film's player. render(lt) is a pure function of local time. The scene keeps
// the id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountThread, renderThread, focus, attH, T, END } from './tabs-assets/thread.js';
import { lerp, seg, outExpo, inOutSine, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FILL = 0.9;  // the player's share of the frame width at the end of the push
let el = null;

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
// centred in the frame (read once, with no attachment in the composer)
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

export default {
  id: 'tabs',
  dur: END + 0.05,

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
    hub.querySelector('.rc-super').innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.thread = mountThread(hub);
    this.ready = el.thread.ready;
    // the timeline only renders live scenes: once this one is off, park its media instead of decoding it unseen
    new MutationObserver(() => {
      if (!section.classList.contains('on')) section.querySelectorAll('video').forEach((v) => { if (!v.paused) v.pause(); });
    }).observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    renderThread(el.thread, t);

    // empty state -> thread: the composer glides down to the bottom, the greeting lifts away. While the file sits in
    // the composer it grows upward, so the group shifts by half of it to stay centred.
    const drop = inOutCubic(seg(t, T.send - 0.05, T.send + 0.6));
    const a = attH(t) * (1 - drop);
    el.composer.style.transform = drop >= 1 ? 'none' : `translate3d(0,${(-up * (1 - drop) + a / 2).toFixed(2)}px,0)`;
    const heroIn = outExpo(seg(t, 0.2, 1.1));
    const heroOut = inOutSine(seg(t, T.send - 0.1, T.send + 0.5));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate3d(-50%, ${((1 - heroIn) * 12 - heroOut * 36 - a / 2).toFixed(2)}px, 0)`;

    // camera: pushed in on the empty state (drifting in a touch), easing out to the full thread as the ask sends,
    // then one push into the film's player at the end
    const z0 = g.DW < 700 ? 1.08 : 1.16;
    let z = lerp(z0 * 0.985, z0, inOutSine(seg(t, 0, T.send))) * lerp(1, 1 / z0, inOutCubic(seg(t, T.send - 0.1, T.send + 1.0)));
    let cx = g.DW / 2, cy = g.DH / 2;
    const f = focus(el.thread, t, el.site, boxIn);
    if (f) {
      const zf = (FILL * W) / (g.k * f.box.w);
      z = z * Math.pow(zf / z, f.a);
      cx = lerp(cx, f.box.cx, f.a);
      cy = lerp(cy, f.box.cy, f.a);
    }
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;
  },
};
