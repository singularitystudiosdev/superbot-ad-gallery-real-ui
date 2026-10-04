// ytx4 relay baton: the rail of four model chips, the baton (the glowing task card that is handed chip to chip with a
// short glow trail and collects one stamp per leg) and the framed window every leg's screen plays inside.
// mountRelay(section) -> { view, addPage(page), render(t, ctx) }; pure function of t.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } from '../../lib.js';
import {
  WIN, VIEW, BAR, WIN_S, PAGE, CHIP_X, CHIP_Y, CHIP_H, CARD, MODELS, ASK, OPEN, HAND, STAMP_AT, END, B, dockOf,
} from './layout.js';

const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TRAIL = 5;

export function mountRelay(section, layer) {
  // the rail and the window live in the relay scene; the card and its trail ride a layer above everything (so the
  // card can fly into the end card's mark)
  section.innerHTML = `
<div class="bt-rail">
  <div class="bt-track" style="left:${CHIP_X[0]}px;width:${CHIP_X[3] - CHIP_X[0]}px"></div>
  <div class="bt-track-on" style="left:${CHIP_X[0]}px;width:0px"></div>
  ${MODELS.map((m, i) => `
  <div class="bt-chip" style="left:${CHIP_X[i]}px;top:${CHIP_Y}px;height:${CHIP_H}px;--c:${m.c}">
    <i class="bt-glowring"></i>
    <span class="bt-logo ${m.cls}"><img src="${m.logo}" alt=""></span>
    <span class="bt-txt"><span class="bt-name">${m.name}</span><span class="bt-role">${m.role}</span></span>
    <span class="bt-check">${CHECK}</span>
  </div>`).join('')}
</div>
<div class="bt-win" style="left:${WIN.x}px;top:${WIN.y}px;width:${WIN.w}px;height:${WIN.h}px">
  <div class="bt-bar"><span class="bt-dots"><i></i><i></i><i></i></span><span class="bt-title"></span></div>
  <div class="bt-view" style="top:${BAR}px"></div>
</div>`;
  layer.innerHTML = `
${Array.from({ length: TRAIL }, () => '<div class="bt-ghost"></div>').join('')}
<div class="bt-card">
  <i class="bt-halo"></i>
  <div class="bt-ask"><span class="bt-askmark"><img src="scenes/tabs-assets/mark-clean.svg" alt=""></span><span class="bt-asktext">${ASK}</span></div>
  <div class="bt-stamps">${MODELS.map((m) => `
    <div class="bt-slot"><div class="bt-stamp" style="--c:${m.c}"><span class="bt-sl ${m.cls}"><img src="${m.logo}" alt=""></span>${m.stamp}</div><i class="bt-ink" style="--c:${m.c}"></i></div>`).join('')}
  </div>
</div>`;
  const q = (s) => section.querySelector(s);
  const r = {
    section, layer,
    rail: q('.bt-rail'), trackOn: q('.bt-track-on'),
    chips: [...section.querySelectorAll('.bt-chip')].map((c) => ({
      el: c, ring: c.querySelector('.bt-glowring'), check: c.querySelector('.bt-check') })),
    win: q('.bt-win'), view: q('.bt-view'), titleBox: q('.bt-title'),
    card: layer.querySelector('.bt-card'), halo: layer.querySelector('.bt-halo'),
    ghosts: [...layer.querySelectorAll('.bt-ghost')],
    stamps: [...layer.querySelectorAll('.bt-stamp')], inks: [...layer.querySelectorAll('.bt-ink')],
    pages: [], titles: [],
  };
  r.addPage = (page) => {
    // page = { el (a 1920x1080 box), title, fav, vis(t) -> 0..1, cam(t) -> { z, fx, fy } }
    page.el.classList.add('bt-page');
    r.view.appendChild(page.el);
    const tt = document.createElement('span');
    tt.innerHTML = `${page.fav ? `<img src="${page.fav}" alt="">` : ''}${page.title}`;
    r.titleBox.appendChild(tt);
    page.tt = tt;
    r.pages.push(page);
  };
  r.render = (t, ctx) => render(r, t, ctx || {});
  return r;
}

// ---------- the card's pose: centre (cx, cy), scale s, opacity o ----------
const DOCK_CY = CARD.y + CARD.h / 2;
function dockPose(i) { return { cx: CHIP_X[i], cy: DOCK_CY, s: 1, o: 1 }; }
function mix(a, b, f) { return { cx: lerp(a.cx, b.cx, f), cy: lerp(a.cy, b.cy, f), s: lerp(a.s, b.s, f), o: lerp(a.o, b.o, f) }; }

export function cardPose(t, ctx) {
  const origin = ctx.origin || { cx: 960, cy: 560 };
  const born = { cx: origin.cx, cy: origin.cy, s: 1.9, o: 1 };
  if (t < OPEN.born0) return null;
  if (t < OPEN.fly0) {
    const f = outCubic(seg(t, OPEN.born0, OPEN.born1));
    return { cx: born.cx, cy: born.cy + (1 - f) * 18, s: lerp(1.72, 1.9, f), o: f };
  }
  if (t < OPEN.fly1) {
    const f = inOutCubic(seg(t, OPEN.fly0, OPEN.fly1));
    const p = mix(born, dockPose(0), f);
    return p;
  }
  for (let k = HAND.length - 1; k >= 0; k--) {
    const h = HAND[k];
    if (t >= h.t0) {
      if (t >= h.t1) {
        if (k === HAND.length - 1) break;
        return dockPose(h.i);
      }
      const f = inOutCubic(seg(t, h.t0, h.t1));
      const p = mix(dockPose(h.i - 1), dockPose(h.i), f);
      p.cy -= 30 * Math.sin(Math.PI * f); // it rides up along the rail between the chips
      p.s *= 1 + 0.05 * Math.sin(Math.PI * f);
      return p;
    }
  }
  if (t < HAND[0].t0) return dockPose(0);
  // after the last handoff: docked on superbot, then it flies into the end card's mark
  if (t < END.fly0) return dockPose(3);
  const face = ctx.face || { cx: 1300, cy: 540 };
  const f = inOutCubic(seg(t, END.fly0, END.fly1));
  const p = mix(dockPose(3), { cx: face.cx, cy: face.cy, s: 0.32, o: 1 }, f);
  p.o = 1 - seg(t, END.fly1 - 0.16, END.fly1 + 0.02);
  if (p.o <= 0) return null;
  return p;
}

function place(el, p, w = CARD.w, h = CARD.h) {
  el.style.transform = `translate(${(p.cx - (w / 2) * p.s).toFixed(2)}px,${(p.cy - (h / 2) * p.s).toFixed(2)}px) scale(${p.s.toFixed(4)})`;
}

// which chip holds the card at t (with a 0..1 hold strength for the glow), and its model colour
function holdOf(i, t) {
  const arrive = i === 0 ? OPEN.fly1 : HAND[i - 1].t1;
  const leave = i < 3 ? HAND[i].t0 : END.fly0;
  return seg(t, arrive - 0.2, arrive + 0.05) * (1 - seg(t, leave, leave + 0.25));
}

function render(r, t, ctx) {
  // rail in on the open, out into the end card
  const railIn = outCubic(seg(t, OPEN.railIn0, OPEN.railIn1));
  const out = inOutCubic(seg(t, END.relayOut0, END.relayOut1));
  r.rail.style.opacity = (railIn * (1 - out)).toFixed(3);
  r.rail.style.transform = `translateY(${((1 - railIn) * -24).toFixed(2)}px)`;

  // the chips: the holder lights up in its model colour, a leg that is done keeps a check
  r.chips.forEach((c, i) => {
    const h = holdOf(i, t);
    c.ring.style.opacity = h.toFixed(3);
    c.el.style.transform = `scale(${(1 + 0.045 * h).toFixed(4)})`;
    c.el.style.background = h > 0 ? `rgba(30, 32, 40, ${(0.6 + 0.4 * h).toFixed(3)})` : '';
    const done = outBack(seg(t, STAMP_AT[i] + 0.12, STAMP_AT[i] + 0.4));
    c.check.style.opacity = clamp(done * 1.4).toFixed(3);
    c.check.style.transform = `scale(${Math.max(0, done).toFixed(4)})`;
  });

  // the card and its glow trail
  const p = cardPose(t, ctx);
  if (!p) { r.card.style.opacity = '0'; r.ghosts.forEach((g) => (g.style.opacity = '0')); }
  else {
    // a short bump when a stamp lands
    let bump = 0;
    STAMP_AT.forEach((s) => { bump += Math.sin(Math.PI * seg(t, s + 0.16, s + 0.36)) * (t > s + 0.16 && t < s + 0.36 ? 1 : 0); });
    const pb = { ...p, s: p.s * (1 + 0.035 * bump), cy: p.cy + 3 * bump };
    place(r.card, pb);
    r.card.style.opacity = p.o.toFixed(3);
    // the halo glows in the holder's colour, brighter while it travels and when a stamp lands
    let col = MODELS[0].c, best = 0;
    MODELS.forEach((m, i) => { const h = holdOf(i, t); if (h > best) { best = h; col = m.c; } });
    r.card.style.setProperty('--bt-glow', col);
    r.layer.style.setProperty('--bt-glow', col);
    const prev = cardPose(t - 0.04, ctx);
    const speed = prev ? Math.hypot(p.cx - prev.cx, p.cy - prev.cy) : 0;
    const moving = clamp(speed / 14);
    r.halo.style.opacity = clamp(0.18 + 0.5 * moving + 0.6 * bump).toFixed(3);
    r.ghosts.forEach((g, k) => {
      const gp = cardPose(t - (k + 1) * 0.028, ctx);
      if (!gp || moving <= 0.01) { g.style.opacity = '0'; return; }
      place(g, { ...gp, s: gp.s * (1 - 0.04 * (k + 1)) });
      g.style.opacity = (moving * 0.55 * (1 - (k + 1) / (TRAIL + 1)) * p.o).toFixed(3);
    });
  }
  // the stamps: each slams onto its slot, then an ink ring
  r.stamps.forEach((s, i) => {
    const a = STAMP_AT[i];
    const f = seg(t, a, a + 0.2);
    if (t < a) { s.style.opacity = '0'; r.inks[i].style.opacity = '0'; return; }
    const e = outCubic(f);
    s.style.opacity = clamp(f * 3).toFixed(3);
    const rot = [-2.2, 1.8, -1.4, 2.4][i];
    s.style.transform = `scale(${lerp(1.9, 1, e).toFixed(4)}) rotate(${lerp(-10, rot, e).toFixed(2)}deg)`;
    const k = seg(t, a + 0.18, a + 0.5);
    r.inks[i].style.opacity = (k > 0 && k < 1 ? 0.9 * (1 - k) : 0).toFixed(3);
    r.inks[i].style.transform = `scale(${lerp(1, 1.18, outCubic(k)).toFixed(4)}) rotate(${rot}deg)`;
  });

  // the window rises in under the rail, and goes with it into the end card
  const wIn = outCubic(seg(t, OPEN.winIn0, OPEN.winIn1));
  r.win.style.opacity = (wIn * (1 - out)).toFixed(3);
  r.win.style.transform = `translateY(${((1 - wIn) * 70).toFixed(2)}px) scale(${(0.955 + 0.045 * wIn - 0.03 * out).toFixed(4)})`;
  r.track = null;
  // the lit track follows the card along the rail
  const cx = p ? clamp(p.cx, CHIP_X[0], CHIP_X[3]) : (t > B[4] ? CHIP_X[3] : CHIP_X[0]);
  r.trackOn.style.width = (cx - CHIP_X[0]).toFixed(2) + 'px';

  // the pages: each leg's screen, crossfading in the one window, under its own camera
  let topVis = -1, topIdx = -1;
  r.pages.forEach((pg, i) => {
    const v = clamp(pg.vis(t));
    pg.el.style.opacity = v.toFixed(3);
    pg.el.style.visibility = v > 0 ? 'visible' : 'hidden';
    pg.tt.style.opacity = clamp((v - 0.5) * 5 + 0.5).toFixed(3); // titles swap near the midpoint, no double exposure
    if (v > 0) {
      const cam = pg.cam ? pg.cam(t) : { z: 1, fx: PAGE.w / 2, fy: PAGE.h / 2 };
      const k = WIN_S * cam.z;
      // keep the page edges outside the view
      const hx = VIEW.w / 2 / k, hy = VIEW.h / 2 / k;
      const fx = clamp(cam.fx, hx, PAGE.w - hx), fy = clamp(cam.fy, hy, PAGE.h - hy);
      pg.el.style.transform = `translate(${(VIEW.w / 2).toFixed(2)}px,${(VIEW.h / 2).toFixed(2)}px) scale(${k.toFixed(5)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;
    }
    if (v > topVis) { topVis = v; topIdx = i; }
  });
}
