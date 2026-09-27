// every-model-one-chat (forked from it-does-what-you-ask): the real superbot hub, cropped to its thread and composer (rail, sidebar and chat header
// are hidden, ask.css), laid out at DW design px and scaled to the frame width. It opens on the empty state
// ("Good evening. Where do we go?" over a centred composer) with the camera pushed in; the first send drops the
// composer to the bottom, lifts the greeting away and eases the camera out while the plan-led chat plays
// (tabs-assets/chat.js: Opus plans, then every part is routed to its model; ?v=3 routing, also the default), under the build HUD. render(lt) is a pure function of local time. The scene keeps the id "tabs" so the hub's
// generated stylesheets (scoped under #s-tabs) apply unchanged.
import { hubMarkup } from './tabs-assets/hub-markup.js';
import { mountChat, renderChat, BEATS, CHAT_T0, CHAT_END, RACE_T0, raceTime, APPS, PLAN, PLAN_K, PLAN_STEPS, MODEL_UP } from './tabs-assets/chat.js?v=c30d2';
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, boxIn } from '../lib.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
const H = 1080;
const FIRST = BEATS[0].k;

// ---------- the build HUD (Turbo Kart Rally's HUD lettering, in frame px so it stays crisp) ----------
// Top left: 1 PROMPT over MODELS n (the distinct models used so far; GitHub is an app, not a model), the numeral
// punching up as each new model joins, and the build clock under them. Top right: the BUILD PLAN Opus wrote, pinned:
// it lifts off the plan card in the chat once the card has finished and settles in the corner, then its current row
// is lit, finished rows are checked and dimmed, and n/7 counts the finished parts. The left block fades in when the
// first model counts (the Opus plan chip resolves), so MODELS never shows a zero; the clock has been running since the
// first send and runs until the finale's build chip resolves (and reads the same time), and the HUD fades out as the
// finale's game window grows in. Every value is written from t.
const LAST = BEATS[BEATS.length - 1].k;
const HUD_IN = MODEL_UP.length ? MODEL_UP[0].t : RACE_T0; // the first model joins the build
const HUD_OUT = LAST.T.v0 !== undefined ? LAST.T.v0 : LAST.T.end - 1;
const LIFT0 = PLAN_K.T.done + 0.2;  // the plan card has finished: the pinned copy lifts off it...
const LIFT1 = LIFT0 + 0.8;          // ...and has settled in the corner
const PANEL_W = 292, PANEL_R = 18, PANEL_T = 20; // the pinned panel's frame-px box at scale 1
const CK = '<svg class="kh-ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const bumpP = (p) => Math.sin(Math.PI * clamp(p));

function mountHud(root) {
  const hud = document.createElement('div');
  hud.className = 'kh';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `<div class="kh-l">
  <div class="kh-n kh-pr"><b>1</b><small>PROMPT</small></div>
  <div class="kh-n kh-md"><small>MODELS</small><b>0</b></div>
  <div class="kh-time">0:00.00</div>
</div>
<div class="kh-plan">
  <div class="kh-ph"><span>BUILD PLAN</span><em><b>0</b>/${PLAN.length}</em></div>
  <ol class="kh-rows">${PLAN.map((p) => `<li><span class="kh-tile kh-t-${p.app}"><img src="${APPS[p.app].logo}" alt=""/></span><b>${esc(p.short)}</b>${CK}</li>`).join('')}</ol>
</div>`;
  root.appendChild(hud);
  const rows = [...hud.querySelectorAll('.kh-rows li')];
  return {
    hud, root, card: null,
    models: hud.querySelector('.kh-md b'), time: hud.querySelector('.kh-time'),
    panel: hud.querySelector('.kh-plan'), count: hud.querySelector('.kh-ph em b'),
    rows, checks: rows.map((r) => r.querySelector('.kh-ck')),
    lastModels: '0', lastTime: '', lastCount: '0',
  };
}

function renderHud(h, t, W) {
  const vin = outCubic(seg(t, HUD_IN, HUD_IN + 0.45));
  const vout = outCubic(seg(t, HUD_OUT, HUD_OUT + 0.5));
  const v = vin * (1 - vout);
  h.hud.style.opacity = v.toFixed(3);
  h.hud.style.visibility = v <= 0 ? 'hidden' : 'visible';
  const s = W >= 1700 ? 1 : clamp(W / 1920, 0.6, 1);
  h.hud.style.setProperty('--kh-s', s.toFixed(3));
  h.hud.style.setProperty('--kh-y', `${((1 - vin) * -14 + vout * -14).toFixed(2)}px`);

  // MODELS n: the numeral punches up as each new model joins the build
  let n = 0, up = -1;
  MODEL_UP.forEach((m) => { if (t >= m.t) { n = m.n; up = m.t; } });
  const ns = String(n);
  if (ns !== h.lastModels) { h.models.textContent = ns; h.lastModels = ns; }
  const kick = up >= 0 ? bumpP(seg(t, up, up + 0.36)) : 0;
  h.models.style.transform = kick > 0 ? `scale(${(1 + 0.3 * kick).toFixed(4)})` : 'none';
  const txt = raceTime(t); // chat.js: frozen from the moment the finale's build chip reads the same time
  if (txt !== h.lastTime) { h.time.textContent = txt; h.lastTime = txt; }

  // the pinned plan: before the lift it is hidden; during it, it flies from the chat's plan card (measured in this
  // root's px, so the camera and the thread's scroll are already in the box) to the corner, shrinking as it goes
  if (t < LIFT0) { h.panel.style.opacity = '0'; return renderRows(h, t); }
  const rw = h.root.offsetWidth || W;
  const x1 = rw - PANEL_R - PANEL_W * s, y1 = PANEL_T * s;
  let x = x1, y = y1, sc = s;
  const p = inOutCubic(seg(t, LIFT0, LIFT1));
  if (p < 1) {
    if (!h.card) h.card = h.root.querySelector('.pl-card');
    const cb = h.card ? boxIn(h.card, h.root) : null;
    if (cb && cb.w > 0) {
      // start as the largest copy that fits inside the card, centred on it, so it reads as lifting off the card
      const ph = h.panel.offsetHeight || PANEL_W;
      const sc0 = Math.min(cb.w / PANEL_W, cb.h / ph);
      const x0 = cb.x + (cb.w - PANEL_W * sc0) / 2, y0 = cb.y + (cb.h - ph * sc0) / 2;
      x = lerp(x0, x1, p); y = lerp(y0, y1, p); sc = sc0 * Math.pow(s / sc0, p);
    }
  }
  h.panel.style.opacity = outCubic(seg(t, LIFT0, LIFT0 + 0.22)).toFixed(3);
  h.panel.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
  renderRows(h, t);
}

// the plan rows: current lit, finished checked and dimmed, n/7 counting the finished parts
function renderRows(h, t) {
  let fin = 0;
  PLAN_STEPS.forEach((st, i) => {
    const row = h.rows[i];
    const done = t >= st.done, cur = !done && t >= st.sw;
    if (done) fin++;
    row.classList.toggle('on', cur);
    row.classList.toggle('ok', done);
    const rp = cur ? outBack(seg(t, st.sw, st.sw + 0.3)) : 1;
    row.style.transform = rp >= 1 ? 'none' : `translateX(${((1 - rp) * -14).toFixed(2)}px)`;
    const cp = seg(t, st.done, st.done + 0.3);
    h.checks[i].style.opacity = cp.toFixed(3);
    h.checks[i].style.transform = cp >= 1 ? 'none' : `scale(${lerp(0.3, 1, outBack(cp)).toFixed(4)})`;
  });
  const cs = String(fin);
  if (cs !== h.lastCount) { h.count.textContent = cs; h.lastCount = cs; }
}

let el = null;

// the design box: a thread-wide hub, scaled so it fills the frame width (narrow ratios keep a readable column)
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  // framed like one-agent-full-degen: the thread column fills the frame instead of floating in empty sides
  const DW = Math.max(560, Math.min(960, W / 2));
  const k = W / DW, DH = H / k;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.setProperty('--dw', DW + 'px');
  el.geo = { W, DW, DH, k, lift: null };
  return el.geo;
}

// how far the composer sits above its resting place in the empty state: just under the greeting, as a group
// centred in the frame
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

export default {
  id: 'tabs',
  dur: CHAT_END + 0.4,

  mount(section) {
    section.innerHTML = `
<div class="ask-root">
  <div class="sbsite ask"><div class="stage"><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="ask-edge" aria-hidden="true"></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const hub = q('.sbsite .hub');
    const main = hub.querySelector('.main');
    const hero = document.createElement('div');
    hero.className = 'ask-hero';
    hero.innerHTML = `<img class="ask-cat" src="${asset('mark-clean.svg')}" alt=""/><h1>Good evening. Where do we go?</h1>`;
    main.appendChild(hero);
    // the composer as the empty state shows it: SUPER is a switch (off), the platform chip names the model
    const sup = hub.querySelector('.rc-super');
    sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
    el = { site: q('.sbsite'), hub, main, hero, composer: hub.querySelector('.composer'), geo: null };
    el.chat = mountChat(hub);
    el.hud = mountHud(q('.ask-root'));
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);
    const up = lift(g);

    // camera: pushed in on the empty state, easing out once the thread starts
    // (a narrow column already fills the frame, so it pushes in less)
    const z0 = g.DW < 700 ? 1.08 : 1.2, z1 = g.DW < 700 ? 1.04 : 1.1;
    const z = lerp(z0, z1, inOutCubic(seg(t, 0, CHAT_T0))) * lerp(1, 1 / z1, inOutCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.7)));
    el.site.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${(g.k * z).toFixed(5)}) translate(${(-g.DW / 2).toFixed(2)}px,${(-g.DH / 2).toFixed(2)}px)`;

    // empty state -> thread: the composer glides down to the bottom and the greeting lifts away
    const drop = inOutCubic(seg(t, FIRST.send - 0.08, FIRST.send + 0.42));
    el.composer.style.transform = drop >= 1 ? 'none' : `translateY(${(-up * (1 - drop)).toFixed(2)}px)`;
    const heroIn = outCubic(seg(t, 0.15, 0.8));
    const heroOut = outCubic(seg(t, FIRST.send - 0.1, FIRST.send + 0.3));
    el.hero.style.opacity = (heroIn * (1 - heroOut)).toFixed(3);
    el.hero.style.transform = `translate(-50%, ${((1 - heroIn) * 10 - heroOut * 40).toFixed(2)}px)`;

    renderChat(el.chat, t);
    renderHud(el.hud, t, W);
  },
};
