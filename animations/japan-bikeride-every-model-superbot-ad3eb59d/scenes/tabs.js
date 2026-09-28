// scene "tabs" of japan-bikeride-every-model-superbot (0.00-6.85): the real superbot hub, cropped to its thread and
// composer (rail, sidebar and chat header hidden, tabs-assets/ask.css), laid out at DW design px and scaled to the
// frame width. The chat (tabs-assets/chat.js) types and sends the ask and runs the model-switch burst; this file adds
// the video reply, drawn in FRAME px so it can leave the hub:
//   3.55-3.80  the 16:9 card rises into its slot under the last pill (it tracks the slot's box every frame)
//   3.65       the clip starts (clip time = t - 3.65, 1:1)
//   3.95-4.50  FLIP: the card's box eases (inOutCubic) from the slot to the whole frame, radius to 0, the UI to black
//   4.50-6.85  the clip full bleed (object-fit: cover); the engine hard-cuts to the end card at 6.85
// render(lt) is a pure function of local time. The <video> follows the gallery render contract
// (upload-creation-pipeline-reddit-x-ads/.cosmos/rules/gallery-video-render.mdc): with body.freeze it is paused and
// seeked to exactly t - 3.65 (the renderer drives the same 1:1 ramp); live, it plays and is pulled back past a small
// drift. It never free-runs during a seek. The scene keeps the id "tabs" so the hub's generated stylesheets (scoped
// under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, layoutChat, renderChat, CARD0 } from './tabs-assets/chat.js?v=jb1';
import { lerp, seg, clamp, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const clipSrc = new URL('../img/ride/clip.mp4', import.meta.url).href;
const posterSrc = new URL('../img/ride/poster.jpg', import.meta.url).href;
const H = 1080;
export const SCENE_DUR = 6.85;
export const CLIP0 = 3.65, FLIP0 = 3.95, FLIP1 = 4.50;
const CLIP_DUR = 3.4;          // img/ride/clip.mp4 (60 fps, 204 frames); the scene shows 0 .. 3.2 s of it
const SEED_TOL = 1 / 240;      // frozen: re-seek whenever the frame is not the one t asks for
const DRIFT_TOL = 0.12;        // live: let it play, pull it back past this

let el = null;

// the design box: a thread-wide hub scaled to the frame width. A narrow frame gets a narrower box (a larger scale),
// so the chat reads at phone size; a wide one caps at 960.
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const DW = Math.max(480, Math.min(960, W / 1.75));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.site.style.transform = `scale(${k.toFixed(5)})`;
  el.geo = { W, DW, DH, k, lay: null };
  return el.geo;
}

function driveVideo(v, lt) {
  const want = clamp(lt - CLIP0, 0, CLIP_DUR - 1 / 60);
  const frozen = document.body.classList.contains('freeze');
  const live = !frozen && lt >= CLIP0 && lt < SCENE_DUR;
  if (live) {
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    if (Math.abs(v.currentTime - want) > DRIFT_TOL) v.currentTime = want;
  } else {
    if (!v.paused) v.pause();
    if (v.readyState >= 1 && Math.abs(v.currentTime - want) > SEED_TOL) v.currentTime = want;
  }
}

export default {
  id: 'tabs',
  dur: SCENE_DUR,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
</div>
<div class="jb-black" aria-hidden="true"></div>
<div class="jb-card" aria-hidden="true"><video muted playsinline preload="auto" poster="${posterSrc}" src="${clipSrc}"></video><i></i></div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const video = q('.jb-card video');
    video.muted = true; video.defaultMuted = true; video.loop = false; video.autoplay = false;
    el = { section, site: q('.sbsite'), hub, black: q('.jb-black'), card: q('.jb-card'), video, geo: null };
    el.chat = mountChat(hub);
  },

  off() {
    if (el && !el.video.paused) el.video.pause();
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    if (!g.lay) g.lay = layoutChat(el.chat, g.k);
    if (!g.lay) return;
    const L = g.lay;
    renderChat(el.chat, t);

    // ---- the video reply: from its slot in the thread to the whole frame ----
    const card = el.card, v = el.video;
    const shown = t >= CARD0;
    card.style.opacity = shown ? '1' : '0';
    driveVideo(v, t);
    if (!shown) { el.black.style.opacity = '0'; return; }
    const s = boxIn(el.chat.slot, el.section);                 // the slot, in frame px (rise included)
    card.style.opacity = Math.min(1, seg(t, CARD0, CARD0 + 0.25) * 2.5).toFixed(3);
    // while it scrolls in, the card is cut at the feed's bottom edge (as the hub's feed cuts the pills), so it
    // comes up from behind the composer instead of over it
    const f = boxIn(el.chat.feed, el.section);
    const under = Math.max(0, s.y + s.h - (f.y + f.h));
    const e = inOutCubic(seg(t, FLIP0, FLIP1));
    const x = lerp(s.x, 0, e), y = lerp(s.y, 0, e), w = lerp(s.w, W, e), h = lerp(s.h, H, e);
    card.style.left = x.toFixed(2) + 'px';
    card.style.top = y.toFixed(2) + 'px';
    card.style.width = w.toFixed(2) + 'px';
    card.style.height = h.toFixed(2) + 'px';
    card.style.borderRadius = (L.radius * g.k * (1 - e)).toFixed(2) + 'px';
    card.style.setProperty('--hair', (1.2 * (1 - e)).toFixed(3) + 'px');
    card.style.clipPath = under > 0.01 && e === 0 ? `inset(0 0 ${under.toFixed(2)}px 0)` : 'none';
    el.black.style.opacity = e.toFixed(3);
  },
};
