// niche-ytfluid-model-switch: the real superbot hub, cropped to its thread and composer (rail, sidebar and chat
// header are hidden, ask.css), laid out at DW design px and scaled to the frame width. It fades up on the empty
// state ("Good evening. Where do we go?" over a centred composer), the ask is typed and sent, and superbot hands each
// part of the job to the tool built for it (tabs-assets/chat.js).
// The camera is deliberately quiet: the empty state sits a touch pushed in and settles to rest on one spring as the
// composer glides down; after that the frame never zooms. Motion lives in the thread (one spring glide) and in the
// beats. render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's generated
// stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, renderChatAfter, BEATS, CHAT_END } from './tabs-assets/chat.js?v=9ef72117';
import { spring, smooth, lerp } from './tabs-assets/motion.js?v=9ef72117';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0];

const OPEN = 0.45;         // the greeting fades up as the scene opens
const DROP = 0.75;         // on send, the composer glides to the bottom and the empty-state push settles
const TAIL = 0.3;          // the scene's own fade to the end card (timeline.js SCENE_FADE) after the last beat

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

// how far the composer sits above its resting place in the empty state: just under the greeting, the pair centred
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
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // empty state -> thread: the composer glides down and the greeting lifts away, both on the spring
    const drop = spring(t, FIRST.send, DROP);
    el.composer.style.transform = drop >= 1 ? 'none' : `translate3d(0,${(-up * (1 - drop)).toFixed(2)}px,0)`;
    const heroIn = smooth(t, 0.05, OPEN);
    const heroOut = smooth(t, FIRST.send, FIRST.send + 0.4);
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - spring(t, 0.05, 0.7)) * 12 - spring(t, FIRST.send, 0.6) * 36).toFixed(2)}px)`;

    renderChat(el.chat, t);

    // camera: at rest it frames the whole design box; the empty state sits pushed in (less on a narrow column)
    // and settles to rest with the drop. No other camera move in the spot.
    const z0 = g.DW < 700 ? 1.05 : 1.1;
    const z = lerp(z0, 1, drop);
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    renderChatAfter(el.chat, t);
  },
};
