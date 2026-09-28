// first-model-every-model-superbot, the chat: the real superbot hub cropped to its thread and composer (ask.css),
// laid out at DW design px and scaled to the frame width. It opens on the empty state ("Good evening. Where do we
// go?" over a centred composer) with the camera pushed in; the ask is typed and sent, the composer drops and the
// thread plays (tabs-assets/chat.js). Each routing chip starts a ZOOM: a native-size twin of the chip (.zp, laid
// out large so it is crisp) match-cuts from the chip's thread slot to the centre while the camera pushes toward it
// and the chat dims away, holds alone on the dark (shimmer, spinner -> check pop, shine sweep), then flies back
// into its slot as the chat returns. The last beat's preview card grows toward the frame (a native-size twin
// again) to hand off to the next scene. render(lt) is a pure function of local time.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, APPS, SEND, CHAT_END, FIN, Z_IN, Z_HOLD, Z_OUT, Z_LEN, Z_DONE, Z_SHINE, OK } from './tabs-assets/chat.js?v=fm2';
import { cardHtml } from './tabs-assets/finale.js?v=fm2';
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, boxIn, esc } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const bump = (p) => Math.sin(Math.PI * clamp(p));

// cubic-bezier easing (x1,y1,x2,y2), solved for y at x by Newton + bisection
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (u) => ((ax * u + bx) * u + cx) * u, Y = (u) => ((ay * u + by) * u + cy) * u, dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) { const d = dX(u); if (Math.abs(d) < 1e-6) break; const e = X(u) - x; if (Math.abs(e) < 1e-7) return Y(u); u -= e / d; }
    let a = 0, b = 1; u = x;
    for (let i = 0; i < 30; i++) { const e = X(u) - x; if (Math.abs(e) < 1e-7) break; if (e > 0) b = u; else a = u; u = (a + b) / 2; }
    return Y(u);
  };
}
const emph = bezier(0.05, 0.7, 0.1, 1); // emphasized decelerate
const accel = bezier(0.3, 0, 1, 1);      // accelerate

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

const pillHtml = (k) => `<div class="zp" data-app="${k.app}"><div class="zp-face">
  <span class="zp-tile"><img src="${APPS[k.app].logo}" alt=""/></span><span class="zp-l">${esc(k.label)}</span>
  <span class="zp-st"><i class="zp-spin"></i>${OK.replace('qc-ok', 'zp-ok zp-oks')}${OK.replace('qc-ok', 'zp-ok zp-okb')}</span><i class="zp-shine"></i></div><i class="zp-edge"></i></div>`;

// camera transform: design point (cx, cy) lands on screen (X, Y) at scale s
const cam = (X, Y, s, cx, cy) => `translate(${X.toFixed(2)}px,${Y.toFixed(2)}px) scale(${s.toFixed(5)}) translate(${(-cx).toFixed(2)}px,${(-cy).toFixed(2)}px)`;

// the zoom state at t for one beat: e (0 = in its thread slot, 1 = centred at native size), or null outside it
function zoomE(k, t) {
  if (t < k.z0 || t >= k.z1) return null;
  const zt = t - k.z0;
  if (zt < Z_IN) return emph(zt / Z_IN);
  if (zt < Z_IN + Z_HOLD) return 1;
  return 1 - accel((zt - Z_IN - Z_HOLD) / Z_OUT);
}

function renderPill(p, k, t, e, X, Y, s1) {
  const zt = t - k.z0;
  const w = p.n.offsetWidth, h = p.n.offsetHeight;
  p.n.style.transform = `translate(${(X - w / 2).toFixed(2)}px,${(Y - h / 2).toFixed(2)}px) scale(${s1.toFixed(5)})`;
  const done = zt >= Z_DONE;
  p.n.classList.toggle('done', done);
  p.label.style.setProperty('--sh', `${(100 - ((t - k.chip) * 150) % 200).toFixed(1)}%`);
  // spinner out, check in with a small overshoot (transform only)
  const r = seg(zt, Z_DONE, Z_DONE + 0.24);
  p.spin.style.opacity = done ? '0' : '1';
  p.spin.style.transform = `rotate(${((t - k.chip) * 420).toFixed(1)}deg)`;
  // centred it is cap-height sized with a ~3px stroke; flying home it shrinks and cross-fades to the chip's own
  // heavier check, so the swap back into the thread slot is exact
  const cs = (done ? lerp(0.35, 1, outBack(r)) : 0.35) * lerp(1, 1.22, e);
  p.ok.style.opacity = done ? e.toFixed(3) : '0';
  p.oks.style.opacity = done ? (1 - e).toFixed(3) : '0';
  p.ok.style.transform = p.oks.style.transform = `scale(${cs.toFixed(4)})`;
  const tp = outBack(seg(t, k.chip + 0.02, k.chip + 0.3));
  const pop = 1 + 0.07 * bump(seg(zt, Z_DONE, Z_DONE + 0.24));
  p.tile.style.transform = `scale(${(lerp(0.6, 1, tp) * pop).toFixed(4)})`;
  // the shine: a diagonal band across the face, clipped by its radius, with a faint edge light
  const sp = seg(zt, Z_SHINE[0], Z_SHINE[1]);
  const bw = p.shine.offsetWidth;
  p.shine.style.opacity = sp > 0 && sp < 1 ? '1' : '0';
  p.shine.style.transform = `translateX(${lerp(-bw * 1.3, w + bw * 0.3, 0.5 - 0.5 * Math.cos(Math.PI * sp)).toFixed(2)}px) skewX(-24deg)`;
  p.edge.style.opacity = bump(seg(zt, Z_SHINE[0] + 0.04, Z_SHINE[1] + 0.02)).toFixed(3);
}

export default {
  id: 'tabs',
  // the chat's length: the routes are chained from each beat's window (chat.js), the finale's cut ends it
  dur: CHAT_END,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
  <div class="zp-layer" aria-hidden="true">${BEATS.map(pillHtml).join('')}${cardHtml(esc, 'pv-big')}</div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    const pills = [...section.querySelectorAll('.zp')].map((n) => ({
      n, label: n.querySelector('.zp-l'), spin: n.querySelector('.zp-spin'), ok: n.querySelector('.zp-okb'), oks: n.querySelector('.zp-oks'), tile: n.querySelector('.zp-tile'),
      shine: n.querySelector('.zp-shine'), edge: n.querySelector('.zp-edge'),
    }));
    el = { site: q('.sbsite'), edge: q('.ask-edge'), hub, main, hero, composer: hub.querySelector('.composer'), pills, big: q('.pv-big'), geo: null };
    Object.assign(el, { bigRow: el.big.querySelector('.pv-row'), bigLive: el.big.querySelector('.pv-live'), bigPlay: el.big.querySelector('.pv-play'), bigRing: el.big.querySelector('.pv-ring') });
    el.chat = mountChat(hub);
    el.fontSet = false;
    // exporters wait on this (timeline.js): the beats' async assets (three.js models, scraped thumbnails) and the poster
    const poster = el.big.querySelector('.pv-media img');
    this.ready = Promise.all([el.chat.ready, poster && poster.decode ? poster.decode().catch(() => {}) : null]);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);
    // the posters are the ride clip's frame 0 in its opening band: the 4:5 clip's, or the wide clip's past 1.2:1
    const posterSrc = W / H > 1.2 ? 'img/ride-poster-wide.jpg' : 'img/ride-poster.jpg';
    if (el.posterSrc !== posterSrc) {
      el.posterSrc = posterSrc;
      document.querySelectorAll('#s-tabs .pv-media img').forEach((im) => im.setAttribute('src', posterSrc));
    }

    // camera: pushed in on the empty state, easing out as the thread starts
    const z0 = g.DW < 700 ? 1.08 : 1.2;
    const z = lerp(z0, 1, inOutCubic(seg(t, SEND - 0.1, SEND + 0.5)));
    const s0 = g.k * z;
    const base = cam(W / 2, H / 2, s0, g.DW / 2, g.DH / 2);

    // empty state -> thread: the composer glides down and the greeting lifts away
    const drop = inOutCubic(seg(t, SEND - 0.08, SEND + 0.24));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroOut = outCubic(seg(t, SEND - 0.1, SEND + 0.18));
    el.hero.style.opacity = (1 - heroOut).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${(-heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
    if (!el.fontSet) { // the big pills and card use the thread chip's exact font stack, so their proportions match
      const ff = getComputedStyle(el.chat.beats[0].sw).fontFamily;
      // and each big label is tracked so it is exactly F times the chip's label (small system text is optically wider)
      if (ff) {
        el.pills.forEach((p, i) => {
          p.n.style.fontFamily = ff;
          p.n.style.display = 'block';
          p.label.style.letterSpacing = '0px';
          const F = parseFloat(getComputedStyle(p.n).fontSize) / 10;
          const small = el.chat.beats[i].sw.querySelector('.qc-swl').getBoundingClientRect().width / el.chat.beats[i].sw.getBoundingClientRect().width * el.chat.beats[i].sw.offsetWidth;
          const n = p.label.textContent.length;
          p.label.style.letterSpacing = ((small * F - p.label.offsetWidth) / n).toFixed(3) + 'px';
          p.n.style.display = 'none';
        });
        el.fontSet = true;
      }
    }

    let transform = base, chatOp = 1;
    // the zooms
    BEATS.forEach((k, i) => {
      const p = el.pills[i];
      const e = zoomE(k, t);
      if (e === null) { p.n.style.display = 'none'; return; }
      const b = boxIn(el.chat.beats[i].sw, el.site);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const Sx = W / 2 + s0 * (cx - g.DW / 2), Sy = H / 2 + s0 * (cy - g.DH / 2);
      p.n.style.display = 'block';
      const Bw = p.n.offsetWidth;
      const Zc = Bw / (s0 * b.w);               // camera magnification at which the chip is the big pill's size
      const s = s0 * Math.pow(Zc, e);
      const X = lerp(Sx, W / 2, e), Y = lerp(Sy, H / 2, e);
      transform = cam(X, Y, s, cx, cy);
      const zt = t - k.z0;
      chatOp = zt < Z_IN + Z_HOLD ? 1 - outCubic(seg(zt, 0, 0.2)) : inOutCubic(seg(zt, Z_IN + Z_HOLD + 0.02, Z_LEN));
      renderPill(p, k, t, e, X, Y, (s * b.w) / Bw);
    });

    // the hand-off: the preview card grows toward the frame as a native-size twin while the chat recedes
    const T = FIN, card = el.chat.fin.card;
    if (t >= T.grow) {
      const b = boxIn(card, el.site);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const Sx = W / 2 + s0 * (cx - g.DW / 2), Sy = H / 2 + s0 * (cy - g.DH / 2);
      // native end size: W x 538 (the ride's opening band), radius 27, centred on the frame. At 4x5 that is exactly
      // W x round(W * 27.4 / 44) = 864 x 538; on a wide frame the card's own 864 x 538 box widens to W as it grows,
      // so it lands on the ride's band instead of a W-wide card of the thread card's aspect
      const e = inOutCubic(seg(t, T.grow, T.grow + 0.5));
      const wide = W / H > 1.2, NW = wide ? 864 : W;
      const Bw = wide ? lerp(NW, W, e) : W, Bh = Math.round((NW * 27.4) / 44);
      el.big.style.fontSize = (NW / 44).toFixed(4) + 'px';
      el.big.style.width = Bw + 'px';
      el.big.style.height = Bh + 'px';
      el.big.style.borderRadius = '27px';
      // the chrome leaves so only the poster remains in the rect: footer, badge, play button, ring
      const f = outCubic(seg(t, T.fade[0], T.fade[1]));
      el.bigRow.style.opacity = el.bigLive.style.opacity = el.bigPlay.style.opacity = el.bigRing.style.opacity = (1 - f).toFixed(3);
      el.bigRow.style.transform = f > 0 ? `translateY(${(f * 0.35 * el.bigRow.offsetHeight).toFixed(2)}px)` : 'none';
      const sc = e >= 1 ? 1 : lerp((s0 * b.w) / NW, 1, e);
      const X = e >= 1 ? W / 2 : lerp(Sx, W / 2, e), Y = e >= 1 ? H / 2 : lerp(Sy, H / 2, e);
      el.big.style.display = 'block';
      el.big.style.transform = e >= 1 ? `translate(0px,${((H - Bh) / 2).toFixed(2)}px)` : `translate(${(X - Bw / 2).toFixed(2)}px,${(Y - Bh / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
      card.style.visibility = 'hidden';
      // the chat recedes behind it: it dims and eases back, following the card's path
      const Z = lerp(1, 0.94, e);
      transform = cam(lerp(Sx, W / 2, e), lerp(Sy, H / 2, e), s0 * Z, cx, cy);
      chatOp = 1 - outCubic(seg(t, T.grow, T.grow + 0.32));
    } else {
      el.big.style.display = 'none';
      card.style.visibility = 'visible';
    }

    el.site.style.transform = transform;
    el.site.style.opacity = chatOp.toFixed(3);
    el.edge.style.opacity = chatOp.toFixed(3);
  },
};
