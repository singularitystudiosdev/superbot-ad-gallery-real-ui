// EVERY MODEL. ONE CHAT. Relay cut (16:9). One ask in superbot, then a camera that travels a strip of
// seven panes: each model's own surface does its job and a courier carries the growing bundle of files
// down a cable into the next one, until the page goes live. Then the whole relay in one shot, the end card.
import { clamp, seg, lerp, easeOut, easeInOut, easeOutQuint, html, $, $$, enter, show, fitStage, startClock } from './engine.js';
import { RELAY, ASK } from './data.js';
import * as chat from './panes/chat.js';
import * as deepseek from './panes/deepseek.js';
import * as opus from './panes/opus.js';
import * as gemini from './panes/gemini.js';
import * as blender from './panes/blender.js';
import * as eleven from './panes/eleven.js';
import * as live from './panes/live.js';

const PW = 1560;
const PH = 880;
const GAP = 300;
const S0 = 1920 / PW; // the chat opens full-bleed
const TRANSIT = 0.85;
const OVER = 2.8;
const END = 4.4;

const PANES = [
  { mod: chat, dur: 4.5, label: ['superbot', 'one ask'] },
  { mod: deepseek, dur: 4.4, relay: 0 },
  { mod: opus, dur: 4.4, relay: 1 },
  { mod: gemini, dur: 4.0, relay: 2 },
  { mod: blender, dur: 4.0, relay: 3 },
  { mod: eleven, dur: 4.0, relay: 4 },
  { mod: live, dur: 3.4, relay: 5 },
];
let acc = 0;
PANES.forEach((p, i) => {
  p.a = acc;
  p.b = acc + p.dur;
  p.x = i * (PW + GAP);
  acc = p.b + TRANSIT;
});
const T_OVER = PANES[PANES.length - 1].b;
const T_END = T_OVER + OVER;
const CYCLE = +(T_END + END).toFixed(3);
const VO_AT = PANES[5].a + eleven.PLAY_AT; // the radio spot starts in ElevenLabs and keeps playing on the site
const STRIP_W = PANES.length * PW + (PANES.length - 1) * GAP;
const S_ALL = 1840 / STRIP_W;
const BUNDLE = [['Your ask'], ['competitors.json'], ['competitors.json', 'assets.json'], ['competitors.json', 'assets.json', '5 photos'], ['competitors.json', 'assets.json', '5 photos', 'burger.glb'], ['competitors.json', 'assets.json', '5 photos', 'burger.glb', 'spot.mp3']];

const stage = $(document, '#stage');
fitStage(stage);
const strip = $(stage, '.strip');

// ---------- build ----------
for (const [i, p] of PANES.entries()) {
  p.c = p.mod.build();
  p.el = p.c.el;
  p.el.style.left = `${p.x}px`;
  strip.append(p.el);
  const m = p.relay != null ? RELAY[p.relay] : null;
  if (i > 0) {
    p.badge = html(`<div class="badge">${chat.tile(m, 'sm')}<b>${m.id === 'live' ? 'Live' : m.name}</b><span>${m.id === 'live' ? 'superbot deployed it' : 'in superbot'}</span></div>`);
    p.badge.style.left = `${p.x}px`;
    strip.append(p.badge);
  }
  const [name, out] = p.label || [m.name, m.out];
  p.lab = html(`<div class="lab">${i === 0 ? chat.sbTile('lab-t') : chat.tile(m, 'lab-t')}<span><b>${name}</b><em>${out}</em></span></div>`);
  p.lab.style.left = `${p.x}px`;
  strip.append(p.lab);
  if (i < PANES.length - 1) {
    p.cable = html('<div class="cable"><i class="port l"></i><i class="fill"></i><i class="port r"></i></div>');
    p.cable.style.left = `${p.x + PW}px`;
    strip.append(p.cable);
  }
}
const courier = html('<div class="courier"></div>');
strip.append(courier);

const chain = RELAY.map((m, k) => `${k ? '<i class="hc-link"></i>' : ''}<span class="hc">${chat.tile(m, 'sm')}<span class="hc-txt"><b>${m.name}</b><em>${m.tag}</em></span><span class="st"><i class="spin"></i><svg class="ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span></span>`).join('');
const hud = html(`<div class="hud"><div class="hud-ask">${chat.sbTile('sm')}<span>${ASK}</span></div><div class="hud-chain">${chain}</div></div>`);
stage.append(hud);
const chips = $$(hud, '.hc');
const links = $$(hud, '.hc-link');
const caption = html('<div class="caption">One ask. Five models. One launch.</div>');
stage.append(caption);

// end card: the source spot's lock-up, mascot from assets/sb-mark-live
const end = html('<div class="endcard"><div class="lock"><div class="words"><div class="end-slide"><h1>EVERY MODEL.<br> ONE CHAT.</h1></div></div><div class="face"></div></div></div>');
stage.append(end);
const mark = makeMark(220);
$(end, '.face').append(mark.el);

function makeMark(size) {
  const host = document.createElement('span');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.append(tmp);
  const liveMark = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = liveMark.wrap.cloneNode(true);
  liveMark.destroy();
  tmp.remove();
  host.append(wrap);
  const eyes = $$(wrap, '.mark-eye');
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null;
  return {
    el: host,
    render(t) {
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { a.pause(); a.currentTime = Math.max(0, t) * 1000; }
      const k = Math.floor(t / 3.6);
      const ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

// ---------- anchors (pane-local layout px, transforms ignored) ----------
function localCenter(node, pane) {
  let x = node.offsetWidth / 2;
  let y = node.offsetHeight / 2;
  for (let n = node; n && n !== pane; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
  return [x, y];
}
let ANCH = null;
function measure() {
  ANCH = PANES.map((p) => {
    const a = p.mod.anchors(p.c);
    const [ix, iy] = localCenter(a.in, p.el);
    const [ox, oy] = localCenter(a.out, p.el);
    return { in: [p.x + ix, iy], out: [p.x + ox, oy] };
  });
}

// ---------- camera ----------
const cxOf = (i) => PANES[i].x + PW / 2;
const expLerp = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));
function camera(t) {
  const last = PANES.length - 1;
  if (t >= T_OVER) {
    const k = easeInOut(seg(t, T_OVER, T_OVER + 1.5));
    return { cx: lerp(cxOf(last), STRIP_W / 2, k), s: expLerp(1.012, S_ALL, k), yc: lerp(600, 470, k) };
  }
  for (let i = 0; i < PANES.length; i++) {
    const p = PANES[i];
    if (t < p.b || i === last) {
      if (i === 0) return { cx: cxOf(0), s: S0, yc: 540 };
      return { cx: cxOf(i), s: 1 + 0.012 * seg(t, p.a, p.b), yc: 600 };
    }
    const q = PANES[i + 1];
    if (t < q.a) {
      const u = easeInOut(seg(t, p.b, q.a));
      const from = i === 0 ? S0 : 1.012;
      const s = lerp(from, 1, u) - 0.14 * Math.sin(Math.PI * u);
      return { cx: lerp(cxOf(i), cxOf(i + 1), u), s, yc: i === 0 ? lerp(540, 600, easeOut(u)) : 600 };
    }
  }
  return { cx: cxOf(0), s: S0, yc: 540 };
}

// ---------- courier: the bundle rides the cable from one pane's output into the next one's input ----------
function along(pts, k) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = k * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? clamp(d / lens[i]) : 1;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
let courierFor = -1;
function renderCourier(t) {
  let i = -1;
  for (let n = 0; n < PANES.length - 1; n++) if (t >= PANES[n].b - 0.3 && t < PANES[n + 1].a + 0.4) i = n;
  show(courier, i >= 0);
  if (i < 0) return;
  if (courierFor !== i) {
    courierFor = i;
    courier.innerHTML = BUNDLE[i].map((f, n) => `<span class="file ${n === BUNDLE[i].length - 1 ? 'new' : ''}"><svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/></svg><b>${f}</b></span>`).reverse().join('');
  }
  const p = PANES[i];
  const q = PANES[i + 1];
  const pts = [ANCH[i].out, [p.x + PW + 40, PH / 2], [q.x - 40, PH / 2], ANCH[i + 1].in];
  const u = easeInOut(seg(t, p.b - 0.05, q.a + 0.12));
  const [x, y] = along(pts, u);
  const pop = easeOutQuint(seg(t, p.b - 0.3, p.b - 0.05));
  const land = seg(t, q.a + 0.12, q.a + 0.4);
  courier.style.opacity = pop * (1 - land);
  courier.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${(0.7 + 0.3 * pop) * (1 - 0.3 * land)})`;
}

// ---------- HUD: superbot's switch chips, one per hop ----------
function renderHud(t, over) {
  const on = seg(t, PANES[0].b + 0.1, PANES[1].a) * (1 - seg(t, T_OVER, T_OVER + 0.5));
  hud.style.opacity = easeOut(on);
  show(hud, on > 0);
  chips.forEach((ch, k) => {
    const pane = PANES[k + 1];
    const from = PANES[k].b;
    const switching = t >= from && t < pane.a + 0.35;
    const done = k < 5 ? t >= pane.b : t >= pane.a + 1.5;
    ch.classList.toggle('switching', switching);
    ch.classList.toggle('active', t >= pane.a + 0.35 && !done);
    ch.classList.toggle('done', done);
    ch.classList.toggle('lit', t >= from);
    $(ch, '.hc-txt b').style.setProperty('--sh', `${100 - (((t - from) * 90) % 150)}%`);
    $(ch, '.spin').style.transform = `rotate(${(t - from) * 540}deg)`;
    if (k) links[k - 1].style.setProperty('--k', easeInOut(seg(t, from - 0.2, pane.a)));
  });
}

function render(t) {
  const cam = camera(t);
  strip.style.transform = `translate(${960 - cam.cx * cam.s}px, ${cam.yc - (PH / 2) * cam.s}px) scale(${cam.s})`;
  PANES[0].el.style.borderRadius = `${18 * seg(t, PANES[0].b, PANES[0].b + 0.3)}px`;
  const over = seg(t, T_OVER, T_OVER + 1.5);
  const halfView = 960 / cam.s;
  const spin = Math.max(0, t - (PANES[6].a + 0.3));
  PANES.forEach((p, i) => {
    const visible = p.x + PW > cam.cx - halfView - 40 && p.x < cam.cx + halfView + 40;
    p.el.style.visibility = visible ? '' : 'hidden';
    if (visible) {
      const lt = t - p.a;
      if (p.mod === live) p.mod.render(p.c, lt, { vo: t - VO_AT, spin });
      else p.mod.render(p.c, lt);
    }
    if (p.badge) p.badge.style.opacity = easeOut(seg(t, p.a - TRANSIT * 0.6, p.a)) * (1 - over);
    p.lab.style.opacity = easeOut(seg(t, T_OVER + 0.6 + i * 0.1, T_OVER + 1.1 + i * 0.1));
    if (p.cable) {
      const q = PANES[i + 1];
      show(p.cable, t >= PANES[0].b - 0.1);
      p.cable.style.setProperty('--k', easeInOut(seg(t, p.b - 0.05, q.a + 0.12)));
      p.cable.style.setProperty('--thick', 1 + 9 * over);
    }
  });
  renderCourier(t);
  renderHud(t, over);
  enter(caption, t, T_OVER + 1.3, 0.5, 14);
  show(caption, t >= T_OVER + 1.3);
  const e = t - T_END;
  show(end, e >= 0);
  if (e >= 0) {
    end.style.opacity = easeOut(seg(e, 0, 0.35));
    const f = seg(e, 0.1, 0.6);
    const face = $(end, '.face');
    face.style.opacity = f;
    face.style.transform = `scale(${lerp(0.5, 1, easeOut(f))})`;
    const w = seg(e, 0.4, 1.1);
    const slide = $(end, '.end-slide');
    slide.style.transform = `translateX(${(1 - easeOutQuint(w)) * 110}%)`;
    slide.style.opacity = w;
    mark.render(e);
  }
}

// ---------- boot: wait for every image and the display face, measure, then hand over the clock ----------
await document.fonts.load('900 100px Fraunces');
await Promise.all($$(stage, 'img').map((im) => im.decode().catch((err) => console.error('[relay] image failed to decode:', im.src, err))));
measure();
render(0);
startClock(render, CYCLE);
