// B1 (0.00-0.55): the real superbot hub, cropped to its thread and composer like the original ad (ask.css hides the
// rail, the sidebar and the chat header). The spot opens on the ask already in the thread, just landed and settling:
// "Make 3 thumbnails for my next video and test them in Studio", with the upcoming video attached (its auto frame,
// title, length and Sam's channel). superbot's pill "Racing 3 image models" lands under it with its spinner, and the
// camera keeps pushing in slowly until the race takes over (RACE in marks.js).
import { hubMarkup } from '../hub-markup.js';
import { lerp, seg, outCubic, inOutCubic, esc, boxIn } from '../../../lib.js';
import { ASK } from '../marks.js';

const asset = (f) => new URL('../' + f, import.meta.url).href;
const img = (f) => new URL('../../../img/' + f, import.meta.url).href;
const H = 1080;
const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function buildAsk(layer, data) {
  layer.innerHTML = `<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
</div>`;
  const site = layer.querySelector('.sbsite');
  const hub = site.querySelector('.hub');
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  // the composer as the thread shows it after a send: SUPER off, the platform chip on superbot (its mark)
  hub.querySelector('.rc-super').innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  cat.replaceWith(el(`<span class="qc-pi"><span class="qc-pi-sb">${SB_MARK}</span></span>`));
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (label) label.replaceWith(el('<span>Superbot</span>'));

  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  feed.replaceChildren(inner);
  const v = data.video;
  // the ask, with the upcoming video attached (the hub's attachment card: frame, length, title, channel)
  const u = el(`<div class="msg qc-u x3-ask"><span class="avatar">S</span><div class="m-main">
    <div class="m-text">${esc(ASK.text)}</div>
    <div class="x3-att">
      <span class="x3-att-th"><img src="${img(v.frame)}" alt=""/><i>${esc(v.length)}</i></span>
      <span class="x3-att-tx"><b>${esc(v.title)}</b><small><img class="x3-att-av" src="${img(data.channel.avatar)}" alt=""/>${esc(data.channel.name)}<i class="x3-dot"></i>Next upload</small></span>
    </div>
  </div></div>`);
  const p = el(`<div class="msg qc-m"><span class="avatar sb"><img src="${sbSrc}" alt=""/></span><div class="m-main"><span class="qc-sw"><span class="qc-tile qc-t-superbot">${SB_MARK}</span><span class="qc-swl">Racing 3 image models</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
  inner.append(u, p);
  return {
    layer, site, hub, feed, inner, u, p, composer: hub.querySelector('.composer'),
    sw: p.querySelector('.qc-sw'), spin: p.querySelector('.qc-spin'), tile: p.querySelector('.qc-tile'), geo: null,
  };
}

function geo(a, W) {
  if (a.geo && a.geo.W === W) return a.geo;
  const DW = Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  a.site.style.width = DW + 'px';
  a.site.style.height = DH.toFixed(3) + 'px';
  a.site.style.setProperty('--dw', DW + 'px');
  a.geo = { W, DW, DH, k };
  return a.geo;
}

export function renderAsk(a, t, W) {
  const g = geo(a, W);
  // the thread is bottom-anchored on the pill (its room is kept from frame 0, so nothing jumps when it lands)
  const cs = getComputedStyle(a.feed);
  const viewH = a.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const pb = boxIn(a.p, a.inner);
  a.inner.style.transform = `translateY(${(viewH - 8 - (pb.y + pb.h)).toFixed(2)}px)`;

  // the ask settles (it is fully there on frame 0: the spot opens on it)
  const s = outCubic(seg(t, 0, 0.3));
  a.u.style.opacity = '1';
  a.u.style.transform = s >= 1 ? 'none' : `translateY(${((1 - s) * 14).toFixed(2)}px)`;
  // superbot's pill lands and spins
  const pi = outCubic(seg(t, ASK.pillIn, ASK.pillIn + 0.24));
  a.p.style.opacity = pi.toFixed(3);
  a.p.style.transform = pi >= 1 ? 'none' : `translateY(${((1 - pi) * 10).toFixed(2)}px)`;
  const tp = outCubic(seg(t, ASK.pillIn + 0.04, ASK.pillIn + 0.28));
  a.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
  a.spin.style.transform = `rotate(${((t - ASK.pillIn) * 420).toFixed(1)}deg)`;

  // camera: centred on the ask, the pill and the composer, pushing in slowly, then on into the pill as it hands over
  const ub = boxIn(a.u, a.site), cb = boxIn(a.composer, a.site), sb = boxIn(a.sw, a.site);
  const top = ub.y, bot = cb.y + cb.h;
  let cx = g.DW / 2, cy = (top + bot) / 2;
  // the column (640 design px) plus a margin each side fills the frame width at z 1.36
  let z = lerp(1.36, 1.42, outCubic(seg(t, 0, 0.55)));
  const o = inOutCubic(seg(t, ASK.out[0], ASK.out[1]));
  cy = lerp(cy, sb.cy, o * 0.35); z *= lerp(1, 1.1, o);
  a.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;
  a.layer.style.opacity = (1 - o).toFixed(3);
  a.layer.style.visibility = o >= 1 ? 'hidden' : 'visible';
}
