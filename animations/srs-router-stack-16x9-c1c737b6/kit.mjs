// Shared kit for the subrouter spots (c490ad04): pure-of-t helpers, plan data, mark,
// cursor, camera, odometer, meters, end card and the boot/seek engine.
// Render contract: every paint is f(t); no timers or CSS animation in render mode.
import { spring, track, PRESETS, mulberry32, swapAlpha } from './motion.c1c737b6.mjs';
export { spring, track, PRESETS, mulberry32, swapAlpha };

export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, f) => a + (b - a) * f;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const outQuint = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const inOutCubic = (x) => { const c = clamp(x); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const inOutSine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
// spring from rest at t0 (0 → 1), preset by role
export const sp = (t, t0, p = PRESETS.default) => spring(t - t0, p.k, p.d);
// fade window: in over [a, a+fi], out over [b-fo, b]
export const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(smooth((t - a) / fi), smooth((b - t) / fo));

export function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
export const $ = (r, s) => r.querySelector(s);
export const $$ = (r, s) => [...r.querySelectorAll(s)];
export const op = (el, v) => { el.style.opacity = clamp(v).toFixed(3); el.style.visibility = v <= 0.001 ? 'hidden' : 'visible'; };
export const tf = (el, s) => { el.style.transform = s; };
export const money = (v, d = 2) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
// characters revealed at cps from t0
export const typed = (text, t, t0, cps = 38) => text.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

// The four subscriptions. Per-token list prices: openrouter.ai/api/v1/models, read 2026-10-05.
export const PLANS = [
  { id: 'claude', plan: 'Claude Max', vendor: 'Anthropic', color: '#d97757', model: 'Claude Opus 5.5', slug: 'anthropic/claude-opus-5.5', pin: 4, pout: 20, ctx: '1M', seg: '7Kq9' },
  { id: 'openai', plan: 'ChatGPT Pro', vendor: 'OpenAI', color: '#10a37f', model: 'GPT-6.1 Sol', slug: 'openai/gpt-6.1-sol', pin: 2, pout: 10, ctx: '1M', seg: 'xR2m' },
  { id: 'gemini', plan: 'Google AI Pro', vendor: 'Google', color: '#4c8df6', model: 'Gemini 3.1 Pro', slug: 'google/gemini-3.1-pro-preview', pin: 2, pout: 12, ctx: '1M', seg: 'Lw4T' },
  { id: 'deepseek', plan: 'DeepSeek plan', vendor: 'DeepSeek', color: '#4d6bfe', model: 'DeepSeek V4.1 Flash', slug: 'deepseek/deepseek-v4.1-flash', pin: 0.3, pout: 1.2, ctx: '1M', seg: 'pD8v' },
];
export const PLAN = Object.fromEntries(PLANS.map((p) => [p.id, p]));
export const KEY_FULL = 'sbc_' + PLANS.map((p) => p.seg).join('');
export const KEY_MASK = 'sbc_7Kq9••••••••pD8v';
export const BASE_URL = 'https://beta.superbot.gg/v1';
// list-price cost of one call: tokens in/out at the model's per-million rates
export const listCost = (p, tin, tout) => (tin * p.pin + tout * p.pout) / 1e6;

export const logoSrc = (id) => `brand/${id}-logo.svg`;
export const tile = (id, cls = '') => `<div class="tile ${id} ${cls}"><img src="${logoSrc(id)}" alt=""></div>`;

// ---- mascot: the live hub mark, paused and seeked so a frame is f(t) ------------
// (same approach as the bikeride reference's shell.makeMark: clone a non-interactive
// instance, pause its CSS loops and seek them; blinks on a fixed schedule)
export function makeMark(size) {
  const host = document.createElement('span');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') { console.error('sbMarkLive missing: mark renders empty'); return { el: host, render() {} }; }
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null;
  return {
    el: host,
    render(t) {
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { a.pause(); a.currentTime = Math.max(0, t) * 1000; }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

// ---- cursor ------------------------------------------------------------------
export function makeCursor() {
  return h(`<div class="cursor"><div class="ring"></div><svg viewBox="0 0 24 24"><path d="M4 2.5 L4 19.5 L8.6 15.4 L11.5 21.6 L14.4 20.3 L11.6 14.2 L17.8 14.2 Z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/></svg></div>`);
}
// keys: [[t, x, y]] moves on a default spring; clicks: [t...] give a press dip + ring
export function placeCursor(el, t, keys, clicks = [], alpha = 1) {
  const x = track(t, keys.map((k) => [k[0], k[1]]), 120, 22);
  const y = track(t, keys.map((k) => [k[0], k[2]]), 120, 22);
  let press = 0, ring = 0, ringS = 1;
  for (const c of clicks) {
    const d = t - c;
    if (d > -0.08 && d < 0.18) press = Math.max(press, Math.sin(clamp((d + 0.08) / 0.26) * Math.PI));
    if (d >= 0 && d < 0.45) { ring = 1 - d / 0.45; ringS = 0.6 + d * 2.4; }
  }
  tf(el, `translate(${x}px, ${y}px) scale(${1 - 0.14 * press})`);
  op(el, alpha);
  const r = el.firstElementChild;
  r.style.opacity = ring.toFixed(3);
  r.style.transform = `scale(${ringS})`;
  return { x, y };
}
export const pressScale = (t, clicks) => {
  let s = 1;
  for (const c of clicks) { const d = t - c; if (d > -0.06 && d < 0.24) s = Math.min(s, 1 - 0.05 * Math.sin(clamp((d + 0.06) / 0.3) * Math.PI)); }
  return s;
};

// ---- camera: keys [[t, cx, cy, s]] in world px; default spring per channel ------
export function camera(el, t, keys, preset = { k: 60, d: 15.5 }) {
  const cx = track(t, keys.map((k) => [k[0], k[1]]), preset.k, preset.d);
  const cy = track(t, keys.map((k) => [k[0], k[2]]), preset.k, preset.d);
  const s = track(t, keys.map((k) => [k[0], k[3]]), preset.k, preset.d);
  tf(el, `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-cx}px, ${-cy}px)`);
  return { cx, cy, s };
}

// ---- odometer: rolling digit columns, closed-form in value ----------------------
// fmt: number of integer digit columns (max) and decimals
export function makeOdometer(intDigits = 6, decimals = 2, prefix = '$') {
  const cols = [];
  const root = h('<span class="odo"></span>');
  if (prefix) root.appendChild(h(`<span class="cur">${prefix}</span>`));
  for (let p = intDigits - 1; p >= -decimals; p--) {
    if (p === -1) root.appendChild(h('<span class="sep">.</span>'));
    const col = h('<span class="col"><span class="strip">' + '0123456789'.split('').concat(['0']).map((d) => `<span>${d}</span>`).join('') + '</span></span>');
    col.dataset.p = p;
    root.appendChild(col);
    cols.push({ p, col, strip: col.firstElementChild });
    if (p === 3) root.appendChild(h('<span class="sep comma">,</span>'));
  }
  const commas = $$(root, '.comma');
  return {
    el: root,
    set(value) {
      const v = Math.max(0, value);
      for (const { p, col, strip } of cols) {
        const vp = v / Math.pow(10, p);
        const base = Math.floor(vp) % 10;
        const frac = vp - Math.floor(vp);
        const w = p === -decimals ? 0.3 : 0.12;
        const roll = smooth((frac - (1 - w)) / w);
        strip.style.transform = `translateY(${-(base + roll) * 1.1}em)`;
        if (p > 0) {
          const vis = smooth((v - Math.pow(10, p) * 0.96) / (Math.pow(10, p) * 0.06));
          col.style.width = (0.62 * vis).toFixed(3) + 'em';
          col.style.opacity = vis.toFixed(3);
        }
      }
      for (const c of commas) {
        const vis = smooth((v - 1000 * 0.96) / 60);
        c.style.width = (0.3 * vis).toFixed(3) + 'em';
        c.style.opacity = vis.toFixed(3);
      }
    },
  };
}

// ---- subscription usage panel: 4 plan bars + "$0.00 extra" -----------------------
export function makePlanMeter(title = 'Billed to your subscriptions') {
  const el = h(`<div class="meter plan-meter">
    <h4>${title}</h4>
    <div class="big"><span class="num">$0.00</span><small>extra this month</small></div>
    <div class="prows" style="display:flex;flex-direction:column;gap:16px;margin-top:22px">
      ${PLANS.map((p) => `<div class="prow" data-id="${p.id}">${tile(p.id, 'xs')}<div><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>${p.plan}</span><span class="inc ok-txt" style="font-size:14px">included</span></div><div class="bar"><i style="background:${p.color}"></i></div></div><span class="pct">0%</span></div>`).join('')}
    </div></div>`);
  const rows = $$(el, '.prow');
  return {
    el,
    // use: per-plan fraction of the plan's window (0..1)
    set(use) {
      rows.forEach((r, i) => {
        const u = clamp(use[i] ?? 0);
        r.querySelector('.bar i').style.width = (u * 100).toFixed(2) + '%';
        r.querySelector('.pct').textContent = Math.round(u * 100) + '%';
      });
    },
  };
}

// ---- per-token counter panel --------------------------------------------------
export function makeTokenMeter(title = 'Same calls, pay-per-token') {
  const odo = makeOdometer(5, 2);
  const el = h(`<div class="meter tok-meter">
    <h4>${title}</h4>
    <div class="big"><span class="odo-host"></span></div>
    <div class="tok-sub" style="margin-top:14px;font-size:17px;font-weight:600;color:var(--muted)"><span class="reqs num">0</span> requests at list price</div>
    <div class="spark" style="margin-top:22px;height:92px;position:relative"></div></div>`);
  el.querySelector('.odo-host').appendChild(odo.el);
  const spark = el.querySelector('.spark');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 92'); svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible';
  const area = document.createElementNS(svgNS, 'path'); area.setAttribute('fill', 'rgba(242,85,90,.12)');
  const line = document.createElementNS(svgNS, 'path'); line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#f2555a'); line.setAttribute('stroke-width', '3'); line.setAttribute('vector-effect', 'non-scaling-stroke');
  const flat = document.createElementNS(svgNS, 'path'); flat.setAttribute('fill', 'none'); flat.setAttribute('stroke', '#23a559'); flat.setAttribute('stroke-width', '3'); flat.setAttribute('stroke-dasharray', '6 6'); flat.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(area, line, flat); spark.appendChild(svg);
  return {
    el,
    // fn(u) gives the climbing value for u in 0..1 of the drawn history; vmax scales y
    set(value, reqs, history) {
      odo.set(value);
      el.querySelector('.reqs').textContent = Math.round(reqs).toLocaleString('en-US');
      if (history && history.length > 1) {
        const vmax = Math.max(1, history[history.length - 1] * 1.08);
        const pts = history.map((v, i) => [(i / (history.length - 1)) * 400 * clamp(history.length / 2), 88 - (v / vmax) * 80]);
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
        line.setAttribute('d', d);
        area.setAttribute('d', d + ` L${pts[pts.length - 1][0].toFixed(1)} 92 L0 92 Z`);
        flat.setAttribute('d', `M0 88 L${pts[pts.length - 1][0].toFixed(1)} 88`);
      }
    },
  };
}
// accelerating cumulative per-token spend: value at time u since start (seconds)
export const climb = (u, rate0, accel) => (u <= 0 ? 0 : rate0 * u + 0.5 * accel * u * u);

// ---- end card: lockup, then the line ------------------------------------------------
export function makeEnd(line = 'Open router for your subscriptions.') {
  const words = line.split(' ');
  const el = h(`<div class="endc">
    <div class="lock"><div class="face"></div><h1>superbot</h1></div>
    <div class="line">${words.map((w, i) => `<span class="${i === words.length - 1 ? 'em' : ''}">${w}</span>`).join('')}</div>
  </div>`);
  const mark = makeMark(150);
  el.querySelector('.face').appendChild(mark.el);
  const spans = $$(el, '.line span');
  const lock = el.querySelector('.lock');
  return {
    el, mark,
    // lt: local time since the end card starts
    render(lt) {
      const a = sp(lt, 0, PRESETS.heavy);
      tf(lock, `translateY(${(1 - a) * 40 + 0}px) scale(${0.92 + 0.08 * a})`);
      op(lock, smooth(lt / 0.35));
      spans.forEach((s, i) => {
        const t0 = 0.45 + i * 0.09;
        const k = sp(lt, t0, PRESETS.default);
        tf(s, `translateY(${(1 - k) * 46}px)`);
        op(s, smooth((lt - t0) / 0.22));
      });
      const em = spans[spans.length - 1];
      em.style.setProperty('--u', outCubic((lt - 1.15) / 0.55).toFixed(3));
      mark.render(lt + 2);
    },
  };
}

// ---- boot: stage fit, seek, preview loop -------------------------------------------
export async function boot({ DUR, mount, render }) {
  const stage = document.getElementById('stage');
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  fit();
  addEventListener('resize', fit);
  await mount(stage);
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.decode ? im.decode().catch((e) => { console.error('image decode failed', im.src, e); }) : null)));
  const paint = (t) => render(clamp(t, 0, DUR));
  window.seek = (t) => { paint(t); };
  const q = new URLSearchParams(location.search);
  if (window.__RENDER__) { paint(0); window.__AD = { CYCLE: DUR, seek: paint, ready: true }; return; }
  let paused = q.has('t'), offset = q.has('t') ? parseFloat(q.get('t')) : 0, t0 = performance.now();
  window.__AD = { CYCLE: DUR, ready: true, seek: (t) => { paused = true; offset = t; paint(t); } };
  const frame = () => {
    const t = paused ? offset : ((performance.now() - t0) / 1000 + offset) % DUR;
    paint(t);
    requestAnimationFrame(frame);
  };
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { if (paused) { t0 = performance.now(); paused = false; } else { offset = ((performance.now() - t0) / 1000 + offset) % DUR; paused = true; } }
    if (e.key === 'r') { offset = 0; t0 = performance.now(); paused = false; }
  });
  requestAnimationFrame(frame);
}
