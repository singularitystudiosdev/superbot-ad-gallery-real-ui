// The full-frame Google Calendar layer's geometry for gcal.js, kept apart so the beat reads as timing only.
// layout(): the client is laid out at a design size (the frame over APP_SCALE; the compact client, no side bar, under
// 3:2). place(t): the layer pinned over the checklist card while it sits in the chat, opened to the whole frame, then
// a push onto race day's event card (zoom about the card, drifting it toward the frame centre, clamped so the client
// always covers the frame). toRoot(p): a client-local point mapped to scene-root px through the current transform.
// Layout reads happen once per geometry (and once per element, when it is first shown), never per frame, except the
// card and feed boxes while the layer is still opening (the thread may be scrolling then). Pure function of t.
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js?v=bd0d0cf9';

const APP_SCALE = { wide: 4 / 3, compact: 1.1 };
const ZOOM = { wide: 1.22, compact: 1.4 };
const ZOOM_IN = 0.55; /* deliberate */   // the push onto the event card
const DRIFT = 0.55;                       // how far the card's centre travels toward the frame centre
const RADIUS = 10;
const POP_GAP = 12;                       // the card sits this far right of race day, client px

export function makeFrame(x, T, n) {
  let RW = 0, RH = 0, geo = '', AW = 1440, AH = 810, compact = false, feed = null;
  let local = {}, pop = null, cur = { L: 0, Tp: 0, tx: 0, ty: 0, S: 1 };
  const reset = () => { RW = 0; };
  addEventListener('resize', reset);
  addEventListener('archange', reset);

  function layout() {
    if (!RW) { RW = x.root.offsetWidth; RH = x.root.offsetHeight; }
    if (!RW || !RH) return;
    const key = `${RW}x${RH}`;
    if (key === geo) return;
    geo = key;
    compact = RW / RH < 1.5;
    const s = compact ? APP_SCALE.compact : APP_SCALE.wide;
    AW = Math.round(RW / s); AH = Math.round(RH / s);
    n.client.style.width = `${AW}px`; n.client.style.height = `${AH}px`;
    n.client.classList.toggle('gc-tall', compact);
    local = {}; pop = null;
  }

  // a client element's rect in client px (transform-independent: both rects carry the same transform)
  function measure(key, el) {
    if (local[key]) return local[key];
    const c = n.client.getBoundingClientRect(), b = el.getBoundingClientRect();
    if (!b.width || !c.width) return null;
    const s = c.width / AW;
    const r = { x: (b.left - c.left) / s, y: (b.top - c.top) / s, w: b.width / s, h: b.height / s };
    r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2;
    return (local[key] = r);
  }

  // race day's event card, beside race day (once December is on screen)
  function placePop() {
    if (pop) return pop;
    const race = measure('race', n.raceEv);
    if (!race) return null;
    const ph = n.pop.offsetHeight, pw = n.pop.offsetWidth;
    const left = race.x + race.w + POP_GAP, top = Math.max(16, Math.min(race.y - ph / 2, AH - ph - 16));
    n.pop.style.left = `${left.toFixed(1)}px`; n.pop.style.top = `${top.toFixed(1)}px`;
    return (pop = { cx: left + pw / 2, cy: top + ph / 2 });
  }

  function place(t) {
    if (t < T.grow) { n.layer.style.opacity = '0'; return; }
    layout();
    const g = inOutCubic(seg(t, T.grow, T.full));
    let L = 0, Tp = 0, Wd = RW, Ht = RH, rad = 0, clip = '';
    if (g < 1) {
      const b = x.box(n.card);
      feed = feed || n.card.closest('.feed');
      const s = n.card.offsetWidth ? b.w / n.card.offsetWidth : 1;
      L = lerp(b.x, 0, g); Tp = lerp(b.y, 0, g); Wd = lerp(b.w, RW, g); Ht = lerp(b.h, RH, g);
      rad = RADIUS * s * (1 - g);
      const fb = feed ? x.box(feed) : null;
      const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
      if (cutT > 0.01 || cutB > 0.01) clip = `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)`;
    }
    const sc = Math.max(Wd / AW, Ht / AH);
    let S = sc, tx = (Wd - AW * sc) / 2, ty = (Ht - AH * sc) / 2;
    const p = t >= T.pick - 0.05 ? placePop() : null;
    const z = inOutCubic(seg(t, T.zoom, T.zoom + ZOOM_IN));
    if (p && z > 0) {
      S = sc * lerp(1, compact ? ZOOM.compact : ZOOM.wide, z);
      const cx = tx + sc * p.cx, cy = ty + sc * p.cy;
      const nx = cx + (Wd / 2 - cx) * DRIFT * z, ny = cy + (Ht / 2 - cy) * DRIFT * z;
      tx = Math.min(0, Math.max(Wd - AW * S, nx - S * p.cx));
      ty = Math.min(0, Math.max(Ht - AH * S, ny - S * p.cy));
    }
    cur = { L, Tp, tx, ty, S };
    const st = n.layer.style;
    st.left = `${L.toFixed(2)}px`; st.top = `${Tp.toFixed(2)}px`; st.width = `${Wd.toFixed(2)}px`; st.height = `${Ht.toFixed(2)}px`;
    st.borderRadius = `${rad.toFixed(2)}px`;
    st.clipPath = clip;
    st.opacity = outCubic(seg(t, T.grow, T.grow + 0.12)).toFixed(3);
    n.client.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${S.toFixed(5)})`;
  }

  // a client-local point to scene-root px, through the transform place() last wrote
  const toRoot = (px, py) => ({ x: cur.L + cur.tx + cur.S * px, y: cur.Tp + cur.ty + cur.S * py });

  return { layout, place, measure, toRoot };
}
