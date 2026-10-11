// negagg-second (forked from every-model-one-chat, with the negagg-fast geometry): the real superbot hub, cropped to its thread and composer
// (rail, sidebar and chat header are hidden, ask.css), laid out at DW design px and scaled to the frame width. It opens on the empty state
// ("Good evening. Where do we go?" over a centred composer) with the camera pushed in; the first send drops the composer to the bottom, lifts
// the greeting away and eases the camera out while the three-ask chat plays (tabs-assets/chat.js): ChatGPT, Gemini and Claude answer in the
// one thread. render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under
// #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END } from './tabs-assets/chat.js?v=3';
import { lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

let el = null;

// the design box: a thread-wide hub, scaled so it fills the frame width. On a wide frame (16:9) the hub is scaled up and the thread column is
// widened to the composer's width, so the thread reads as large as at 4:5 instead of a narrow column with black at the sides (ad-1 review fix:
// the first three ad spots left the 16:9 frame about 60% empty, carried here from live-limits-every-plan). A portrait frame keeps the narrow
// column its own layout needs.
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const wide = W >= 1700;
  // the hub is laid out at the largest scale at which the whole two-turn thread stays inside the feed at that ratio
  // (measured: the thread is 539 design px tall at 16:9 in an 820 px column and 674 at 4:5 in a 619 px column, and
  // the feed loses ~124 design px to the composer, so 1.6 / 1.62 is where the last line still lands above it)
  const k = wide ? 1.6 : 1.62;
  const DW = W / k, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  if (wide) {
    const col = Math.min(820, DW - 48);
    el.hub.style.setProperty('--hub-column', col + 'px');
    // the replies carry cards (listings, a ranked table, a message), so on the wide frame they take most of the column
    el.hub.style.setProperty('--hub-reply', Math.min(740, col - 20) + 'px');
    el.hub.style.setProperty('--hub-bubble', '560px');
    el.hub.style.setProperty('--dy-h', '74px');
    el.hub.style.setProperty('--bk-ph', '132px');
    el.feed.style.padding = `10px max(24px, calc((100% - ${col.toFixed(1)}px) / 2)) 4px`;
    el.composer.style.width = col.toFixed(1) + 'px';
  } else {
    el.hub.style.removeProperty('--hub-column');
    for (const v of ['--hub-reply', '--hub-bubble', '--dy-h', '--bk-ph']) el.hub.style.removeProperty(v);
    el.feed.style.removeProperty('padding');
    el.composer.style.removeProperty('width');
  }
  el.geo = { W, DW, DH, k, wide, lift: null };
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

export default {
  id: 'tabs',
  dur: CHAT_END + 0.2,

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
    el = { site: q('.sbsite'), hub, main, feed: hub.querySelector('.feed'), hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // camera: pushed in on the empty state, easing out once the thread starts
    const z0 = 1.14, z1 = 1.06;
    const z = lerp(z0, z1, inOutCubic(seg(t, 0, CHAT_T0))) * lerp(1, 1 / z1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.7)));
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.15, 0.8));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
  },
};