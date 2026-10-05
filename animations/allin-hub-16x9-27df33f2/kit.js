// Shared kit for the onekey-launch spots (39b5ad8c): pure-of-t helpers, plan data,
// provider consoles, browser chrome, captions, cost bars, end card, boot/seek engine.
// Grammar borrowed from a launch film (dark browser frame, pop-out modals, caption box,
// bar chart before the lockup); palette and UI from the superbot real-UI kit.
// Render contract: every paint is f(t); no timers or CSS animation in render mode.
import { spring, track, PRESETS, mulberry32, swapAlpha } from './motion.mjs';
export { spring, track, PRESETS, mulberry32, swapAlpha };

export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, f) => a + (b - a) * f;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => { const c = clamp(x); return c * c * (3 - 2 * c); };
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const outQuint = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const inCubic = (x) => Math.pow(clamp(x), 3);
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
// scramble: reveal `text` left to right over [t0, t0+dur], unrevealed chars cycle seeded glyphs
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
export function scramble(text, t, t0, dur, seed = 7) {
  const u = clamp((t - t0) / dur), n = text.length, done = Math.floor(u * n);
  const frame = Math.floor(t * 30);
  let out = '';
  for (let i = 0; i < n; i++) {
    if (i < done || text[i] === '-' || text[i] === '_') { out += text[i]; continue; }
    const r = mulberry32(seed * 977 + i * 131 + frame)();
    out += GLYPHS[Math.floor(r * GLYPHS.length)];
  }
  return out;
}

// The four subscriptions. Per-token list prices: openrouter.ai/api/v1/models, read 2026-10-05.
// Console fields describe each vendor's own developer console (host, key prefix, env var).
export const PLANS = [
  { id: 'claude', plan: 'Claude Max', vendor: 'Anthropic', console: 'Anthropic Console', host: 'console.anthropic.com', color: '#d97757', model: 'Claude Opus 5.5', short: 'Opus 5.5', slug: 'anthropic/claude-opus-5.5', pin: 4, pout: 20, keyMask: 'sk-ant-api03-••••••••Qx7A', env: 'ANTHROPIC_API_KEY', seg: '7Kq9' },
  { id: 'openai', plan: 'ChatGPT Pro', vendor: 'OpenAI', console: 'OpenAI Platform', host: 'platform.openai.com', color: '#10a37f', model: 'GPT-6.1 Sol', short: 'GPT-6.1', slug: 'openai/gpt-6.1-sol', pin: 2, pout: 10, keyMask: 'sk-proj-••••••••••T3bK', env: 'OPENAI_API_KEY', seg: 'xR2m' },
  { id: 'gemini', plan: 'Google AI Pro', vendor: 'Google', console: 'Google AI Studio', host: 'aistudio.google.com', color: '#4c8df6', model: 'Gemini 3.1 Pro', short: 'Gemini 3.1 Pro', slug: 'google/gemini-3.1-pro-preview', pin: 2, pout: 12, keyMask: 'AIzaSy••••••••••Vm2c', env: 'GEMINI_API_KEY', seg: 'Lw4T' },
  { id: 'deepseek', plan: 'DeepSeek', vendor: 'DeepSeek', console: 'DeepSeek Platform', host: 'platform.deepseek.com', color: '#4d6bfe', model: 'DeepSeek V4.1 Flash', short: 'DeepSeek V4.1', slug: 'deepseek/deepseek-v4.1-flash', pin: 0.3, pout: 1.2, keyMask: 'sk-••••••••••••a91f', env: 'DEEPSEEK_API_KEY', seg: 'pD8v' },
];
export const PLAN = Object.fromEntries(PLANS.map((p) => [p.id, p]));
export const KEY_PRE = 'sk-superbot-';
export const KEY_FULL = KEY_PRE + PLANS.map((p) => p.seg).join('');
export const BASE_URL = 'https://beta.superbot.gg/v1';
// list-price cost of one call: tokens in/out at the model's per-million rates
export const listCost = (p, tin, tout) => (tin * p.pin + tout * p.pout) / 1e6;

// The three requests every spot routes, with the reason the router gives.
export const REQS = [
  { id: 'code', plan: 'claude', text: 'Refactor auth/ into typed modules and keep every test green', tin: 142000, tout: 9000, why: 'multi-file code, deep reasoning', fit: [0.96, 0.71, 0.48] },
  { id: 'calls', plan: 'gemini', text: 'Summarize these 14 earnings-call transcripts', tin: 610000, tout: 6000, why: '610k-token context', fit: [0.74, 0.95, 0.52] },
  { id: 'tags', plan: 'deepseek', text: 'Tag 5,000 support tickets by intent', tin: 2100000, tout: 160000, why: 'high volume, simple task', fit: [0.55, 0.63, 0.94] },
];
export const ROUTE_MODELS = ['claude', 'gemini', 'deepseek'];
export const COST_ALL_OPUS = REQS.reduce((s, r) => s + listCost(PLAN.claude, r.tin, r.tout), 0);
export const COST_ROUTED = REQS.reduce((s, r) => s + listCost(PLAN[r.plan], r.tin, r.tout), 0);

export const logoSrc = (id) => `brand/${id}-logo.svg`;
export const tile = (id, cls = '') => `<div class="tile ${id} ${cls}"><img src="${logoSrc(id)}" alt=""></div>`;

// ---- mascot: the live hub mark, paused and seeked so a frame is f(t) ------------
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
// keys: [[t, x, y]] moves on a soft spring; clicks: [t...] give a press dip + ring
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

// ---- camera: keys [[t, cx, cy, s]] in world px; one spring per channel ------------
export function camera(el, t, keys, preset = { k: 60, d: 15.5 }) {
  const cx = track(t, keys.map((k) => [k[0], k[1]]), preset.k, preset.d);
  const cy = track(t, keys.map((k) => [k[0], k[2]]), preset.k, preset.d);
  const s = track(t, keys.map((k) => [k[0], k[3]]), preset.k, preset.d);
  tf(el, `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-cx}px, ${-cy}px)`);
  return { cx, cy, s };
}

// ---- caption box: bottom-centre, one line at a time ([[tIn, tOut, text]]) ----------
export function makeCaption(items) {
  const el = h(`<div class="cap">${items.map((c) => `<div class="cap-i">${c[2]}</div>`).join('')}</div>`);
  const nodes = $$(el, '.cap-i');
  return {
    el,
    render(t) {
      nodes.forEach((n, i) => {
        const [a, b] = items[i];
        const kin = sp(t, a, PRESETS.snappy), kout = smooth((t - (b - 0.22)) / 0.22);
        op(n, Math.min(smooth((t - a) / 0.18), 1 - kout));
        tf(n, `translate(-50%, ${(1 - kin) * 18 - kout * 10}px) scale(${0.96 + 0.04 * kin})`);
      });
    },
  };
}

// ---- dark browser chrome: tab strip + omnibox; content goes in .chr-body ------------
// tabs: [{ id, title, host }]; setTab(f) highlights tab floor(f) with an indicator spring
export function makeChrome(tabs, w, ht) {
  const el = h(`<div class="chr" style="width:${w}px;height:${ht}px">
    <div class="chr-tabs"><div class="dots"><i></i><i></i><i></i></div>
      ${tabs.map((tb) => `<div class="chr-tab">${tb.id ? tile(tb.id, 'fav') : '<span class="fav sbfav"></span>'}<span>${tb.title}</span></div>`).join('')}
      <div class="chr-ind"></div></div>
    <div class="chr-bar"><span class="nav">‹</span><span class="nav">›</span><div class="omni"><span class="lock"></span><span class="url"></span></div></div>
    <div class="chr-body"></div></div>`);
  const tabEls = $$(el, '.chr-tab'), ind = $(el, '.chr-ind'), url = $(el, '.url');
  return {
    el, body: $(el, '.chr-body'), tabEls,
    setTab(t, keys) {
      // keys: [[time, tabIndex]]
      const f = track(t, keys, PRESETS.snappy.k, PRESETS.snappy.d);
      const i = clamp(Math.round(f), 0, tabs.length - 1);
      tabEls.forEach((te, j) => te.classList.toggle('on', j === i));
      const a = tabEls[0];
      if (a.offsetWidth) {
        const x0 = tabEls[Math.floor(clamp(f, 0, tabs.length - 1))], x1 = tabEls[Math.ceil(clamp(f, 0, tabs.length - 1))];
        const fr = f - Math.floor(f);
        const left = lerp(x0.offsetLeft, x1.offsetLeft, fr), width = lerp(x0.offsetWidth, x1.offsetWidth, fr);
        tf(ind, `translateX(${left}px)`); ind.style.width = width + 'px';
      }
      url.innerHTML = `<b>${tabs[i].host.split('/')[0]}</b>${tabs[i].host.slice(tabs[i].host.split('/')[0].length)}`;
      return { f, i };
    },
  };
}

// ---- provider console (design size 1280 x 760), four pages crossfaded ------------
export const CONSOLE_PAGES = ['login', 'usage', 'billing', 'keys'];
export function makeConsole(p, seed = 3, w = 1280, ht = 760) {
  const rnd = mulberry32(seed);
  const bars = Array.from({ length: 26 }, (_, i) => 0.22 + 0.55 * rnd() + i * 0.012);
  const el = h(`<div class="cx" style="--pc:${p.color};width:${w}px;height:${ht}px">
    <div class="cx-page cx-login"><div class="cx-card">
      ${tile(p.id, 'lg')}<h3>Log in to ${p.vendor}</h3>
      <div class="cx-in"><label>Email</label><div class="fld">you@company.com</div></div>
      <div class="cx-in"><label>Password</label><div class="fld dots">••••••••••••</div></div>
      <div class="cx-btn">Continue</div>
      <div class="cx-otp"><span>Verification code</span><div>${'<i></i>'.repeat(6)}</div></div>
    </div></div>
    <div class="cx-app">
      <div class="cx-nav"><div class="cx-brand">${tile(p.id, 'sm')}<b>${p.console}</b></div>
        ${['Usage', 'Billing', 'API keys', 'Limits', 'Settings'].map((n) => `<div class="cx-ni"><i></i>${n}</div>`).join('')}</div>
      <div class="cx-main">
        <div class="cx-page cx-usage"><h2>Usage</h2><div class="cx-row"><span class="cx-chip warn">Rate limit · Tier 2</span><span class="cx-chip">This month</span></div>
          <div class="cx-chart">${bars.map((b) => `<i style="height:${(b * 100).toFixed(1)}%"></i>`).join('')}</div>
          <div class="cx-row"><div class="cx-stat"><label>Input tokens</label><b class="mute-blk"></b></div><div class="cx-stat"><label>Output tokens</label><b class="mute-blk"></b></div><div class="cx-stat"><label>Requests</label><b class="mute-blk"></b></div></div></div>
        <div class="cx-page cx-billing"><h2>Billing</h2>
          <div class="cx-panel"><div><label>Credit balance</label><div class="cx-row"><span class="cx-chip bad">Low balance</span><span class="cx-chip">Auto-recharge off</span></div></div><div class="cx-btn sm">Add credits</div></div>
          <div class="cx-panel"><div><label>Payment method</label><b class="pm">Visa •••• 4242</b></div><div class="cx-btn sm ghost">Update</div></div>
          <div class="cx-inv">${['September', 'August', 'July'].map((m) => `<div><span>Invoice · ${m}</span><span class="cx-chip">Paid</span></div>`).join('')}</div></div>
        <div class="cx-page cx-keys"><div class="cx-row sb"><h2>API keys</h2><div class="cx-btn sm">+ Create new secret key</div></div>
          <div class="cx-tbl"><div class="hd"><span>Name</span><span>Key</span><span>Created</span></div>
            <div><span>staging</span><span class="mono">${p.keyMask.replace(/.{4}$/, 'k2Lp')}</span><span>Jun 14</span></div>
            <div><span>prod</span><span class="mono">${p.keyMask}</span><span>Sep 02</span></div></div>
          <div class="cx-new"><label>Save your key. You won't be able to see it again.</label><div class="cx-key mono">${p.keyMask}<span class="cp">Copy</span></div></div></div>
      </div></div></div>`);
  const login = $(el, '.cx-login'), app = $(el, '.cx-app');
  const pages = { usage: $(el, '.cx-usage'), billing: $(el, '.cx-billing'), keys: $(el, '.cx-keys') };
  const navs = $$(el, '.cx-ni');
  const chartBars = $$(el, '.cx-chart i');
  const pw = $(el, '.cx-in .fld.dots'), otp = $$(el, '.cx-otp i'), newKey = $(el, '.cx-new'), low = $(el, '.cx-chip.bad');
  return {
    el, keyEl: $(el, '.cx-key'), newKey,
    // login details: password chars typed (0..12), otp digits filled (0..6)
    login(pwN, otpN) {
      pw.textContent = '•'.repeat(clamp(Math.floor(pwN), 0, 12)) || ' ';
      otp.forEach((o, i) => { o.textContent = i < otpN ? '492817'[i] : ''; o.classList.toggle('on', i < otpN); });
    },
    // emphasis pulses: low-balance chip and the new-key box (k 0..1 springs)
    emph(lowK, keyK) {
      tf(low, `scale(${1 + 0.18 * Math.sin(clamp(lowK) * Math.PI)})`);
      op(newKey, clamp(keyK * 1.4));
      tf(newKey, `translateY(${(1 - keyK) * 26}px) scale(${0.94 + 0.06 * keyK})`);
    },
    // f: page position, 0 login, 1 usage, 2 billing, 3 keys (fractional = crossfade); grow: chart bars 0..1
    set(f, grow = null) {
      this.show([0, 1, 2, 3].map((j) => 1 - smooth(Math.abs(f - j) / 0.55)), grow ?? smooth((f - 0.6) / 0.6), f);
    },
    // straight crossfade page a -> page b (no pass through the pages between)
    mix(a, b, m, grow = 1) {
      const w = [0, 0, 0, 0]; w[a] += 1 - smooth(m); w[b] += smooth(m);
      this.show(w, grow, lerp(a, b, smooth(m)));
    },
    // w: weight per page (login, usage, billing, keys); f: position for the slide offset
    show(w, grow, f) {
      op(login, w[0]);
      tf(login, `translateY(${-(1 - w[0]) * 30}px)`);
      op(app, 1 - w[0]);
      ['usage', 'billing', 'keys'].forEach((k, j) => {
        op(pages[k], w[j + 1]);
        tf(pages[k], `translateY(${(f - (j + 1)) * -26 * (1 - w[j + 1])}px)`);
      });
      let ni = 0;
      for (let j = 1; j < 4; j++) if (w[j] > w[ni + 1]) ni = j - 1;
      navs.forEach((n, j) => n.classList.toggle('on', j === ni));
      chartBars.forEach((b, j) => { b.style.transform = `scaleY(${clamp(grow * 1.6 - j * 0.02).toFixed(3)})`; });
    },
  };
}

// ---- cost bars: the three-bar comparison before the lockup ---------------------------
export function makeBars() {
  const rows = [
    { lbl: 'Everything on Opus 5.5', sub: 'pay-per-token API', v: COST_ALL_OPUS, cls: 'b-hi' },
    { lbl: 'Routed per request', sub: 'pay-per-token API', v: COST_ROUTED, cls: 'b-mid' },
    { lbl: 'superbot', sub: 'billed to your subscriptions', v: 0, cls: 'b-sb' },
  ];
  const el = h(`<div class="bars">
    <div class="bars-hd"><span>Same 3 requests</span><small>API list prices, openrouter.ai, Oct 2026</small></div>
    <div class="bars-plot">${rows.map((r) => `<div class="bcol ${r.cls}"><div class="bval num"></div><div class="bbar"><i></i></div><div class="blbl"><b>${r.lbl}</b><span>${r.sub}</span></div></div>`).join('')}</div></div>`);
  const cols = $$(el, '.bcol');
  const HMAX = 430;
  return {
    el,
    render(lt) {
      cols.forEach((c, i) => {
        const t0 = 0.25 + i * 0.32, k = sp(lt, t0, PRESETS.heavy);
        const r = rows[i];
        const hgt = r.v > 0 ? (r.v / COST_ALL_OPUS) * HMAX * k : 6 * k;
        c.querySelector('.bbar i').style.height = Math.max(0, hgt).toFixed(1) + 'px';
        op(c, smooth((lt - t0 + 0.1) / 0.25));
        const val = c.querySelector('.bval');
        val.textContent = r.v > 0 ? money(r.v * clamp(k)) : '$0.00 extra';
        tf(val, `translateY(${-Math.max(0, hgt)}px)`);
      });
    },
  };
}

// ---- end card: lockup, then the line ------------------------------------------------
export function makeEnd(line = 'One API key for all your subscriptions.') {
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
      tf(lock, `translateY(${(1 - a) * 40}px) scale(${0.92 + 0.08 * a})`);
      op(lock, smooth(lt / 0.35));
      spans.forEach((s, i) => {
        const t0 = 0.45 + i * 0.08;
        const k = sp(lt, t0, PRESETS.default);
        tf(s, `translateY(${(1 - k) * 46}px)`);
        op(s, smooth((lt - t0) / 0.22));
      });
      spans[spans.length - 1].style.setProperty('--u', outCubic((lt - 1.2) / 0.6).toFixed(3));
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
