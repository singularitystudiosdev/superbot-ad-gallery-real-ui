// niche-youtube-model-switch r1-e (the sub-7s X cut): the real superbot hub, cropped to its thread and composer
// (rail, sidebar and chat header hidden, ask.css), laid out at a narrow DW and scaled to the frame width. Frame 0 is
// the still: the hook (an ad title over the app: 12:04 AM, superbot, "1,284 comments to answer.", the route the ask
// will take) over the composer holding the whole ask. On send the route and the brand fade, and the headline glides
// up and shrinks into a caption that stays at the top of the frame through the chat, so the premise never leaves the
// screen; the composer glides to the bottom and the camera pushes in on the thread column (the composer cropped to
// its top edge) so every switch pill and every model's line reads at phone size while superbot hands the job from
// model to model (tabs-assets/chat.js). render(lt) is a pure function of local time. The scene keeps the id "tabs" so
// the hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, renderChatAfter, BEATS, CHAT_END, CUT } from './tabs-assets/chat.js?v=r1e1';
import { lerp, seg, outCubic, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const brand = (f) => new URL('../brand/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k, STUDIO = BEATS[BEATS.length - 1].k;

const DW_WIDE = 400;       // design width on a landscape frame: a phone-width hub column
const GAP = 10;            // the hook to the composer in the still, design px
const EXTRA_H = 180;       // the hub is laid out this much taller than the frame (design px): the composer rests
                           // below the frame, so the thread above it has room for a whole step
const DRIFT = 0.014;       // a slow push-in from frame 1, so the still never sits frozen once it plays
const DOCK_Y = 30;         // the caption's top, frame px
const DOCK_S = 0.56;       // the caption's scale of the headline
// the camera on the thread during the chat: pushed in on the thread column, the composer cropped to its top edge
const ZC = 1.1;            // the whole thread column in view (the bubble flush right, the avatars left); 12.5px
                           // copy lands near 66px on 1920 (about 13px on a phone)
const ZS = 0.8, OUT_AT = -0.16, OUT = 0.3; // the Studio step: the view eases out a touch so the pill, its check and
                           // the Studio card fit, while the top caption steps aside
const CROP_B = -6;         // the view ends this far above the composer's top edge (the composer, border and all, stays
                           // out of the view)
export const TAIL = 0.15;  // the scene's quick dip to black (timeline.js SCENE_FADE, an ease-in) after the last beat

const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

let el = null;

// the design box: a narrow hub column, scaled so it fills the frame width
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const DW = W > H ? DW_WIDE : Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = (DH + EXTRA_H).toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.geo = { W, DW, DH, k, lift: null, heroTop: 0, compTop: 0 };
  return el.geo;
}

// the still's layout: the hook (frame px) and the composer (design px) centred as one group; returns how far the
// composer sits above its resting place
function lift(g) {
  if (g.lift !== null) return g.lift;
  const main = el.main.getBoundingClientRect();
  if (!main.height) return 0;
  const s = main.width / g.DW;
  const comp = el.composer.getBoundingClientRect();
  const heroH = el.hero.getBoundingClientRect().height;
  const compH = comp.height / s;
  g.compTop = (comp.top - main.top) / s;
  const total = heroH + (GAP + compH) * g.k;
  g.heroTop = (H - total) / 2;
  el.hero.style.top = g.heroTop.toFixed(2) + 'px';
  // the hook's left edge on the composer's (24 design px in), its width to the composer's right edge
  el.hero.style.left = (24 * g.k).toFixed(2) + 'px';
  el.hero.style.width = (g.W - 48 * g.k).toFixed(2) + 'px';
  g.lift = (comp.top - main.top) / s - ((g.heroTop + heroH) / g.k + GAP);
  return g.lift;
}

export default {
  id: 'tabs',
  dur: CHAT_END + TAIL,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const root = q('.ask-root');
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    // the hook, an ad title over the app (not app UI): the hour on a red tag beside the superbot lock-up, the line a
    // creator up at midnight reads first, then the route the one ask will take, labelled
    // each app wears the same logo tile as its switch pill a second later
    const hop = (app, f, name) => `<span class="hk-hop"><span class="hk-tile hk-t-${app}"><img src="${brand(f)}" alt=""/></span>${name}</span>`;
    const chev = '<svg class="hk-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    const band = document.createElement('div');
    band.className = 'hk-band';
    const hero = document.createElement('div');
    hero.className = 'hk-hero';
    hero.innerHTML = `<div class="hk-top"><span class="hk-time">12:04 AM</span><span class="hk-brand">superbot<img src="${asset('mark-clean.svg')}" alt=""/></span></div>
      <h1 class="hk-h">1,284 comments. 5 need you.</h1>
      <div class="hk-route"><div class="hk-row">${hop('gemini', 'gemini-logo.svg', 'Gemini')}${chev}${hop('astra', 'openai-logo.svg', 'GPT-6 Astra')}${chev}</div><div class="hk-row">${hop('opus', 'claude-logo.svg', 'Claude Opus 5.5')}${chev}${hop('studio', 'youtube-icon.svg', 'YouTube Studio')}</div></div>`;
    root.append(band, hero);
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = {
      site: q('.sbsite'), hub, main, hero, band,
      fades: [hero.querySelector('.hk-time'), hero.querySelector('.hk-brand'), hero.querySelector('.hk-route')],
      head: hero.querySelector('.hk-h'),
      composer: hub.querySelector('.composer'), geo: null,
    };
    el.chat = mountChat(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);
    const rm = reduced();
    const send = FIRST.send;

    // the still -> the thread is a cut, CUT after the send: the composer is at the bottom, the hook docked as the
    // caption, the camera on the thread and the ask's bubble in place, all on the cut's first frame
    const cut = t >= send + CUT ? 1 : 0;
    const drop = cut;
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;

    // the hook: the tag, the brand and the route fade; the headline docks at the top as the caption, over a band
    const f = cut;
    el.fades.forEach((n) => { n.style.opacity = (1 - f).toFixed(3); });
    const d = cut;
    const headTop = g.heroTop + el.head.offsetTop;
    const dy = lerp(0, DOCK_Y - headTop, d), sc = lerp(1, DOCK_S, d);
    // the block scales about the headline's top-left corner (the rest of the block has faded by then)
    el.hero.style.transformOrigin = `0px ${el.head.offsetTop}px`;
    el.hero.style.transform = d > 0 ? `translateY(${dy.toFixed(2)}px) scale(${sc.toFixed(4)})` : 'none';
    // the caption steps aside for the Studio step: its words first, then its band (the words never sit unbacked)
    const a0 = STUDIO.sw + OUT_AT;
    const offW = rm ? (t >= STUDIO.sw ? 1 : 0) : seg(t, a0, a0 + 0.1), offB = rm ? offW : seg(t, a0 + 0.1, a0 + 0.24);
    el.hero.style.opacity = (1 - offW).toFixed(3);
    el.band.style.opacity = (d * (1 - offB)).toFixed(3);

    renderChat(el.chat, t);

    // the camera: the whole design box (a slow drift from frame 1), then pushed in on the thread column
    const z0 = rm ? 1 : 1 + DRIFT * outCubic(seg(t, 0, 1.2));
    const p = cut;
    const out = rm ? (t >= STUDIO.sw ? 1 : 0) : inOutCubic(seg(t, STUDIO.sw + OUT_AT, STUDIO.sw + OUT_AT + OUT));
    const aspect = H / W;
    const vw0 = g.DW / z0, vw1 = g.DW / lerp(ZC, ZS, out);
    const vx1 = (g.DW - vw1) / 2, vy1 = g.compTop + CROP_B - vw1 * aspect;
    // the zoom moves in log space (a steady push), the view's centre along with it
    const vw = Math.exp(lerp(Math.log(vw0), Math.log(vw1), p));
    const fr = Math.abs(vw0 - vw1) > 0.01 ? (vw0 - vw) / (vw0 - vw1) : p;
    const cx = lerp(g.DW / 2, vx1 + vw1 / 2, fr), cy = lerp(g.DH / 2, vy1 + (vw1 * aspect) / 2, fr);
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(W / vw).toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;

    renderChatAfter(el.chat, t);
  },
};
