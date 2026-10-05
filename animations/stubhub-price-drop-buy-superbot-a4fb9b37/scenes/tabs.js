// stubhub-price-drop-buy (forked from every-model-one-chat route=superbot): the real superbot hub, cropped to its
// thread and composer (rail, sidebar and chat header are hidden, ask.css), laid out at DW design px and scaled to
// the frame width, under the headline band. It opens on the empty state ("Good evening. Where do we go?" over a
// centred composer) with the ask already typing; the send drops the composer to the bottom, lifts the greeting away
// and eases the camera out while the two-switch chat plays (tabs-assets/chat.js). render(lt) is a pure function of
// local time; cues() lists the sound bed's hits for the renderer. The scene keeps the id "tabs" so the hub's
// generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_END } from './tabs-assets/chat.js?v=9';
import { lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

let el = null;

// the design box: a thread-wide hub, scaled so it fills the frame width (narrow ratios keep a readable column)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  // pulled back far enough that every sent ask stays in frame through its whole answer (the DoorDash order is
  // the tallest), so the thread lays out wider than the reference's 960
  const DW = Math.max(560, Math.min(1480, W / 1.3));
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

// the sound bed's hits, in scene time: keys while the ask types, the send, each switch landing and resolving,
// the tick as the price lands under the limit, the step chips, the two clicks and the buy chime
function cues() {
  const out = [];
  for (const { k } of BEATS) {
    if (k.ask) {
      for (let i = 0; i < k.ask.length; i += 2) out.push({ t: k.s + (k.typeEnd - k.s) * (i / k.ask.length), kind: 'key' });
      out.push({ t: k.send, kind: 'send' });
    }
    k.chips.forEach((c) => out.push({ t: c.sw, kind: 'pop' }, { t: c.done, kind: 'ok' }));
    const T = k.T;
    if (T.drop) out.push({ t: T.drop, kind: 'tick' });
    if (T.confirm) {
      out.push({ t: T.c1d, kind: 'ok' }, { t: T.c2d, kind: 'ok' }, { t: T.pick, kind: 'click' }, { t: T.press, kind: 'click' });
      out.push({ t: T.confirm + 0.04, kind: 'chime' });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

export default {
  id: 'tabs',
  dur: CHAT_END + 0.05,
  cues,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>
<div class="sp-kick"><h2>NAME YOUR PRICE. GET THE SEATS.</h2></div>`;
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
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // camera: pushed in on the empty state, easing out once the thread starts, then flat
    // (a narrow column already fills the frame, so it pushes in less)
    const z1 = g.DW < 700 ? 1.04 : 1.1;
    const z = z1 * lerp(1, 1 / z1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.6)));
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    // the greeting is up on frame 0 (the <10s band opens on the typed ask) and lifts away on the send
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (1 - heroOut).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${(-heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
  },
};
