// bark-toy-every-model: 16:9 only, and the frame is split in two. The left half is superbot's real hub, cropped
// to its thread and composer (rail, sidebar and chat header hidden, ask.css) and pushed left so the asks and the
// answers read at full size; the right half is the output pane, the surface of whichever model superbot just
// routed to (panes.js), where that model's actual work is on screen: the scraped profile, the isolated bark, the
// generated turnaround, the 3D build, the firmware, the order. The scene keeps the id "tabs" so the hub's
// generated stylesheets (scoped under #s-tabs) apply unchanged. render(lt) is a pure function of local time.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END } from './tabs-assets/chat.js?v=12';
import { mountPane } from './tabs-assets/panes.js?v=1';
import { lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;
// the thread column is narrowed to 560 design px (pane.css) and scaled so it spans ~45..915 px of the frame,
// centred on x = 480, leaving a clear gutter before the output pane at 962
const FEED_W = 560, COL_PX = 870, COL_CX = 480, K = COL_PX / FEED_W, DW = Math.round(1920 / K), DH = Math.round(H / K);

let el = null;

export default {
  id: 'tabs',
  dur: CHAT_END + 0.4,

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
    const pane = mountPane(section);
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null, pane };
    el.chat = mountChat(hub, pane);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = (el.geo && el.geo.W === W) ? el.geo : (el.geo = { W, k: W / DW, dh: H / (W / DW) });
    const k = g.k;
    const up = el.lift === undefined ? (el.lift = (() => {
      const m = el.main.getBoundingClientRect();
      if (!m.height) return 0;
      const s = m.height / g.dh;
      const comp = el.composer.getBoundingClientRect(), hero = el.hero.getBoundingClientRect();
      const compH = comp.height / s, heroH = hero.height / s;
      const groupTop = (g.dh - (heroH + 34 + compH)) / 2;
      el.hero.style.top = groupTop.toFixed(2) + 'px';
      return (comp.top - m.top) / s - (groupTop + heroH + 34);
    })()) : el.lift;

    // camera: a small push on the empty state, easing out once the first ask is in; the column stays on the left
    const z = lerp(1.05, 1, inOutCubic(seg(t, 0, CHAT_T0))) * lerp(1, 1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.7)));
    el.site.style.width = DW + 'px';
    el.site.style.height = DH + 'px';
    el.site.style.transform = `translate(${COL_CX.toFixed(2)}px,${H / 2}px) scale(${(k * z).toFixed(5)}) translate(${(-DW / 2).toFixed(2)}px,${(-DH / 2).toFixed(2)}px)`;

    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.1, 0.6));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
  },
};