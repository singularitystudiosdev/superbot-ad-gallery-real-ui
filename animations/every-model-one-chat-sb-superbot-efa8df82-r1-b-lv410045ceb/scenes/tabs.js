// every-model-one-chat r1-b (16:9 chain cut): the ad's rail names superbot and the five models in the order it
// routes them (left), while the real superbot hub, cropped to its thread and composer (ask.css), runs those switches
// live (right). The hub is laid out at DW design px and scaled so its pills and replies read at phone size; the
// thread is already live at t = 0 so the first frame works as a still. render(lt) is a pure function of local time.
// The scene keeps the id "tabs" so the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, CHAIN, BEATS, tileHtml } from './tabs-assets/chat.js?v=r1b6';
import { seg, outCubic, outBack, inOutCubic, lerp } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080, RAIL = 600, DW = 388, ROW = 138, BAR = 80;
const OK = '<span class="cr-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
// the scene ends once the page Opus built has held, finished, for most of a second (it pushes in slowly meanwhile)
const END = BEATS[BEATS.length - 1].T.landed + 0.72;

let el = null;

export default {
  id: 'tabs',
  dur: END,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="cr">
    <div class="cr-brand"><img src="${asset('mark-clean.svg')}" alt=""/>superbot</div>
    <h2 class="cr-h">One ask.<br><span>Five models.</span></h2>
    <div class="cr-rows"><i class="cr-bar"></i>
    ${CHAIN.map((c) => `<div class="cr-row" data-app="${c.app}">${c.app === 'eleven' ? `<span class="qc-tile cr-tile cr-dark"><img src="${c.logo}" alt=""/></span>` : tileHtml(c.app, 'cr-tile')}<div class="cr-txt"><div class="cr-n">${c.name}</div><div class="cr-t">${c.task}</div></div></div>`).join('')}
    </div>
  </div>
  <div class="cr-view"><div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    hub.querySelector('.rc-super').innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    const rows = [...section.querySelectorAll('.cr-row')];
    // the done badge rides on the tile's corner
    rows.forEach((n) => n.querySelector('.cr-tile').insertAdjacentHTML('beforeend', OK));
    el = {
      site: q('.sbsite'),
      bar: q('.cr-bar'),
      rows: rows.map((n, i) => ({ n, c: CHAIN[i], ok: n.querySelector('.cr-ok'), tile: n.querySelector('.cr-tile') })),
    };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const k = (W - RAIL) / DW, DH = H / k;
    el.site.style.width = DW + 'px';
    el.site.style.height = DH.toFixed(2) + 'px';
    el.site.style.transform = `scale(${k.toFixed(5)})`;

    // rail: ONE bar slides to the routed model's row; that row is lit, finished ones stay readable, later ones wait
    let pos = 0;
    el.rows.forEach((r, i) => { if (i > 0) pos += inOutCubic(seg(t, r.c.on, r.c.on + 0.32)); });
    el.bar.style.transform = `translateY(${(pos * ROW + (ROW - BAR) / 2).toFixed(2)}px)`;
    for (const r of el.rows) {
      const on = seg(t, r.c.on, r.c.on + 0.24) * (1 - seg(t, r.c.off, r.c.off + 0.24));
      const seen = seg(t, r.c.on, r.c.on + 0.24);
      r.n.style.opacity = lerp(0.86, 1, Math.max(on, 0.5 * seen)).toFixed(3);
      const pop = outBack(seg(t, r.c.on, r.c.on + 0.36));
      r.tile.style.transform = t < r.c.on || pop >= 1 ? 'none' : `scale(${lerp(0.84, 1, pop).toFixed(4)})`;
      const d = seg(t, r.c.done, r.c.done + 0.24);
      r.ok.style.opacity = outCubic(d).toFixed(3);
      r.ok.style.transform = `scale(${lerp(0.4, 1, outBack(d)).toFixed(4)})`;
    }

    renderChat(el.chat, t);
  },
};
