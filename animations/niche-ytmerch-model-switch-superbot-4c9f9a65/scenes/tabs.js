// Scene "tabs": the real superbot hub (no rail or sidebar, ask.css), cut for a 16:9 frame into two panes. It opens on
// the empty state ("Good evening. Where do we go?" over a centred composer, the hub at K_EMPTY), the ask is typed and
// sent, and over SPLIT the hub glides into the left pane (DW design px at K_THREAD = 704 px of frame) while superbot's
// workspace panel slides in from the right edge and fills the other 1216 px (tabs-assets/ws.ec83e5dd.js). From there
// the camera never moves: every hand-off lands as a pill in the thread and the tool's work plays large in the
// workspace (tabs-assets/chat.js). The last link opens a full-frame layer of its own (the Short on YouTube).
// Under prefers-reduced-motion the split is a cut. render(lt) is a pure function of local time. The scene keeps the
// id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, renderChatAfter, CHAT_END, SPLIT, SEND_AT } from './tabs-assets/chat.js?v=4c9f9a65';
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;

// the two panes
const DW = 440;            // the thread column in design px (a narrow hub: one message column, 24 px gutters)
const K_THREAD = 1.6;      // ...shown at 1.6x: 704 px of frame, body text ~21 px
const K_EMPTY = 2.0;       // the empty state, centred and a step closer
const PANE = DW * K_THREAD;
const DH = H / K_THREAD;   // the hub fills the frame height in the thread pane
const OPEN = 0.3;          // the greeting fades up as the scene opens from black
const DROP = 0.5; /* deliberate */ // on send, the composer glides to the bottom
const TAIL = 0.3;          // the scene's own fade to the end card (timeline.js SCENE_FADE) after the last beat

const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

let el = null;

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group
// centred in the design box
function lift() {
  if (el.lift !== null) return el.lift;
  const main = el.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.height / DH;
  const comp = el.composer.getBoundingClientRect(), hero = el.hero.getBoundingClientRect();
  const compH = comp.height / s, heroH = hero.height / s;
  const groupTop = (DH - (heroH + 30 + compH)) / 2;
  el.hero.style.top = groupTop.toFixed(2) + 'px';
  el.lift = (comp.top - main.top) / s - (groupTop + heroH + 30);
  return el.lift;
}

export default {
  id: 'tabs',
  dur: CHAT_END + TAIL,

  mount(section) {
    section.innerHTML = `
<div class="ask-root mx-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="mx-ws-host"></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const site = q('.sbsite');
    site.style.width = DW + 'px';
    site.style.height = DH.toFixed(3) + 'px';
    site.style.setProperty('--dw', DW + 'px');
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { site, hub, main, hero, composer: hub.querySelector('.composer'), host: q('.mx-ws-host'), lift: null };
    el.chat = mountChat(hub, el.host);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const up = lift();
    const rm = reduced();

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = rm ? (t >= SEND_AT ? 1 : 0) : inOutCubic(seg(t, SEND_AT, SEND_AT + DROP));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = rm ? 1 : outCubic(seg(t, 0, OPEN));
    const heroOut = rm ? (t >= SEND_AT ? 1 : 0) : outCubic(seg(t, SEND_AT, SEND_AT + OPEN));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);

    // the split: one move, the hub from frame centre at K_EMPTY to the left pane at K_THREAD, the workspace in
    const s = rm ? (t >= SEND_AT ? 1 : 0) : inOutCubic(seg(t, SEND_AT, SEND_AT + SPLIT));
    const k = lerp(K_EMPTY, K_THREAD, s), x = lerp(W / 2, PANE / 2, s);
    el.site.style.transform = `translate(${x.toFixed(2)}px,${H / 2}px) scale(${k.toFixed(5)}) translate(${(-DW / 2).toFixed(2)}px,${(-DH / 2).toFixed(2)}px)`;
    const w = rm ? (t >= SEND_AT ? 1 : 0) : outQuint(seg(t, SEND_AT + 0.05, SEND_AT + 0.05 + SPLIT + 0.1));
    el.host.style.left = PANE + 'px';
    el.host.style.transform = w >= 1 ? 'none' : `translateX(${((1 - w) * (W - PANE + 40)).toFixed(2)}px)`;

    renderChatAfter(el.chat, t);
  },
};
