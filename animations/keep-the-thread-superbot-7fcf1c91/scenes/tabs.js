// keep-the-thread: the real superbot hub, cropped to its main column (rail, sidebar and chat header are hidden,
// ask.css), laid out at DW design px and scaled to the frame width. Two acts live in it (tabs-assets/threads.js):
// the searchable list of every agent's chats, then the chat the user opens, carried on from Claude Code with the
// context meter in the composer. render(lt) is a pure function of local time. The scene keeps the id "tabs" so the
// hub's generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountThreads, renderThreads, SWAP, THREAD_END } from './tabs-assets/threads.js?v=1';
import { lerp, seg, inOutCubic } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const T0 = 0.55; // the first word of the hook card has landed and the black is gone: the list starts

let el = null;

// the design box: a main-column-wide hub, scaled so it fills the frame width. On a wide frame (16:9) the hub is
// scaled up and the thread column is widened to the composer's width, so the list and the thread read as large as
// at 4:5 instead of a narrow column with black at the sides.
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const wide = W >= 1700;
  // the hub is laid out at a design width chosen so the text reads at about 28 px in the delivered frame
  // (a 4:5 stage is 864 stage px wide and is delivered at 1080, so it needs a smaller scale than 16:9)
  const k = wide ? 2.1 : W <= 900 ? 1.72 : 1.9;
  const DW = W / k, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  if (wide) {
    const col = Math.min(820, DW - 48);
    el.hub.style.setProperty('--hub-column', col + 'px');
    el.feed.style.padding = `10px max(24px, calc((100% - ${col.toFixed(1)}px) / 2)) 4px`;
    el.composer.style.width = col.toFixed(1) + 'px';
  } else {
    el.hub.style.removeProperty('--hub-column');
    el.feed.style.removeProperty('padding');
    el.composer.style.removeProperty('width');
  }
  el.geo = { W, DW, DH, k, wide };
  return el.geo;
}

export default {
  id: 'tabs',
  dur: SWAP + THREAD_END + 0.45,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    el = { site: q('.sbsite'), hub, main: hub.querySelector('.main'), feed: hub.querySelector('.feed'), composer: hub.querySelector('.composer'), geo: null };
    el.threads = mountThreads(hub);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);

    // camera: a hair tighter over the list, easing out onto the thread (a narrow column already fills the frame,
    // so it pushes in less)
    const z = lerp(1.045, 1.0, inOutCubic(seg(t, 0.2, SWAP + 0.5))) * (g.wide ? 1 : 0.985);
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    renderThreads(el.threads, t);
  },
};