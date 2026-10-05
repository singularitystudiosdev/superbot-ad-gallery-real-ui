// superbot "Open router for your subscriptions" ad kit (chat 13c07ea4).
// Render contract: every frame is f(t). mount() builds DOM once; render(t) sets every moving property from t.
import { spring, track, PRESETS, mulberry32 } from './motion.mjs';
export { spring, track, PRESETS, mulberry32 };

export const W = 1920, H = 1080;

// ---- data (prices: openrouter.ai/api/v1/models, read 2026-10-05) ------------------------------
export const PLANS = {
  claude:   { plan: 'Claude Max',    vendor: 'Anthropic', logo: 'brand/claude-logo.svg',   tile: 'claude',   color: '#d97757', keyHint: 'sk-ant-api03-…', seg: '7c1Q' },
  openai:   { plan: 'ChatGPT Plus',  vendor: 'OpenAI',    logo: 'brand/openai-logo.svg',   tile: 'openai',   color: '#e8ecee', keyHint: 'sk-proj-…',      seg: 'aF9e' },
  gemini:   { plan: 'Google AI Pro', vendor: 'Google',    logo: 'brand/gemini-logo.svg',   tile: 'gemini',   color: '#4c8df6', keyHint: 'AIzaSy…',        seg: 'Xm2D' },
  deepseek: { plan: 'DeepSeek',      vendor: 'DeepSeek',  logo: 'brand/deepseek-logo.svg', tile: 'deepseek', color: '#4d6bfe', keyHint: 'sk-…',           seg: 'kP0z' },
};
export const PLAN_ORDER = ['claude', 'openai', 'gemini', 'deepseek'];
export const MODELS = [
  { id: 'claude',   name: 'Claude Opus 5.5',     slug: 'anthropic/claude-opus-5.5',     ctx: '1M',    inP: 4,   outP: 20 },
  { id: 'openai',   name: 'GPT-6.1 Sol',         slug: 'openai/gpt-6.1-sol',            ctx: '1.05M', inP: 2,   outP: 10 },
  { id: 'gemini',   name: 'Gemini 3.1 Pro',      slug: 'google/gemini-3.1-pro-preview', ctx: '1.05M', inP: 2,   outP: 12 },
  { id: 'deepseek', name: 'DeepSeek V4.1 Flash', slug: 'deepseek/deepseek-v4.1-flash',  ctx: '1.05M', inP: 0.3, outP: 1.2 },
];
export const priceLabel = (m) => `$${fmtP(m.inP)} / $${fmtP(m.outP)}`;
const fmtP = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
// Three demo requests, each with token counts; cost = list price per 1M tokens.
export const REQUESTS = [
  { text: 'Refactor auth to async and add tests',     model: 0, tin: 180000,  tout: 12000 },
  { text: 'Summarize this 2-hour meeting recording',  model: 2, tin: 900000,  tout: 8000 },
  { text: 'Tag 10,000 support tickets by topic',      model: 3, tin: 3200000, tout: 240000 },
];
export const reqCost = (r) => (r.tin * MODELS[r.model].inP + r.tout * MODELS[r.model].outP) / 1e6;
export const KEY_PREFIX = 'sb_live_';
export const KEY_FULL = KEY_PREFIX + PLAN_ORDER.map((p) => PLANS[p].seg).join('');
export const KEY_MASK = KEY_PREFIX + PLANS.claude.seg + '••••••••' + PLANS.deepseek.seg;
export const BASE_URL = 'https://beta.superbot.gg/v1';
export const END_LINE = 'Open router for your subscriptions.';

// ---- math ---------------------------------------------------------------------------------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const smooth = (p) => p * p * (3 - 2 * p);
/** Spring 0 -> 1 starting at t0 with a named preset. */
export const sp = (t, t0, pre = PRESETS.default) => spring(t - t0, pre.k, pre.d);
/** Value that travels through keyed targets with velocity-continuous springs. */
export const tr = (t, keys, pre = PRESETS.default) => track(t, keys, pre.k, pre.d);
/** In at tIn, out at tOut, both springs: 0 -> 1 -> 0. */
export const inOut = (t, tIn, tOut, pre = PRESETS.default) => sp(t, tIn, pre) - sp(t, tOut, pre);

export const fmtUSD = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtInt = (v) => Math.round(v).toLocaleString('en-US');

// ---- DOM ----------------------------------------------------------------------------------
export function h(tag, cls, parent, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  if (parent) parent.appendChild(el);
  return el;
}
const styleCache = new WeakMap();
/** Write style props, skipping unchanged values. Callers set the same keys every frame. */
export function css(el, props) {
  let c = styleCache.get(el);
  if (!c) styleCache.set(el, (c = {}));
  for (const k in props) {
    const v = props[k];
    if (c[k] !== v) { c[k] = v; el.style[k] = v; }
  }
}
const textCache = new WeakMap();
export function text(el, s) {
  if (textCache.get(el) !== s) { textCache.set(el, s); el.textContent = s; }
}
const htmlCache = new WeakMap();
export function html(el, s) {
  if (htmlCache.get(el) !== s) { htmlCache.set(el, s); el.innerHTML = s; }
}
/** Build a transform string. */
export function tf({ x = 0, y = 0, z = 0, s = 1, sx = 1, sy = 1, rx = 0, ry = 0, rz = 0 } = {}) {
  return `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(s * sx).toFixed(4)},${(s * sy).toFixed(4)})`;
}
/** Place an absolute box. */
export function box(el, x, y, w, hgt) {
  el.style.left = x + 'px'; el.style.top = y + 'px';
  if (w != null) el.style.width = w + 'px';
  if (hgt != null) el.style.height = hgt + 'px';
  return el;
}
export const show = (el, o) => css(el, { opacity: o.toFixed(3), visibility: o <= 0.001 ? 'hidden' : 'visible' });

export function logoTile(parent, planId, size = 64) {
  const p = PLANS[planId];
  const t = h('div', `tile ${p.tile}`, parent);
  t.style.width = t.style.height = size + 'px';
  t.style.borderRadius = Math.round(size * 0.26) + 'px';
  const img = h('img', '', t);
  img.src = p.logo; img.alt = p.vendor;
  const inner = planId === 'openai' ? size : Math.round(size * 0.58);
  img.style.width = img.style.height = inner + 'px';
  return t;
}

// ---- backdrop -----------------------------------------------------------------------------
export function backdrop(stage) {
  const grid = h('div', 'bg-grid', stage);
  const horizon = h('div', 'horizon', stage);
  return { grid, horizon };
}
/** Horizon rim at y (top of the arc), glow strength g 0..1. */
export function horizonAt(bd, y, g = 1, gridO = 1) {
  css(bd.horizon, { transform: `translate3d(0,${y.toFixed(2)}px,0)`, opacity: g.toFixed(3) });
  css(bd.grid, { opacity: gridO.toFixed(3) });
}
export function finish(stage) {
  h('div', 'vignette', stage);
  const c = h('canvas', 'grain', stage);
  c.width = 960; c.height = 540;
  const g = c.getContext('2d');
  const img = g.createImageData(960, 540);
  const rnd = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (rnd() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// ---- headline words -----------------------------------------------------------------------
/** "plain *grad* words" -> mask-wrapped word spans. */
export function words(parent, src, cls = 'headline display', y = 120, size = 84) {
  const el = h('div', cls, parent);
  el.style.top = y + 'px'; el.style.fontSize = size + 'px';
  const spans = [];
  src.split(' ').forEach((wd, i) => {
    if (i) el.appendChild(document.createTextNode(' '));
    const g = /^\*.*\*[.,!?]?$/.test(wd);
    const raw = wd.replace(/\*/g, '');
    const m = h('span', 'w', el);
    const inner = h('i', g ? 'grad' : '', m);
    inner.textContent = raw;
    spans.push(inner);
  });
  return { el, spans };
}
/** Words rise in from the mask at tIn (heavy spring) and drop out at tOut. */
export function wordsAt(ws, t, tIn, tOut = Infinity, stagger = 0.07) {
  ws.spans.forEach((s, i) => {
    const pin = sp(t, tIn + i * stagger, PRESETS.heavy);
    const pout = tOut === Infinity ? 0 : sp(t, tOut + i * stagger * 0.5, PRESETS.default);
    const y = (1 - pin) * 112 - pout * 112;
    css(s, { transform: `translate3d(0,${y.toFixed(2)}%,0)` });
  });
  const vis = t >= tIn - 0.01 && (tOut === Infinity || t < tOut + 1.2);
  css(ws.el, { visibility: vis ? 'visible' : 'hidden' });
}

// ---- superbot mark (real asset, driven from t) --------------------------------------------
const BLINKS = [1.3, 4.6, 7.9, 10.2, 13.7, 16.1, 19.25, 21.2];
export function makeMark(host, size) {
  const r = window.sbMarkLive(host, { size, interactive: false });
  const wrap = r.wrap;
  r.destroy();
  host.appendChild(wrap);
  const svg = r.svg;
  const eyes = [svg.querySelector('.mark-eye-l'), svg.querySelector('.mark-eye-r')];
  const a = svg.querySelector('.sb-mark-a'), b = svg.querySelector('.sb-mark-b');
  const ears = [svg.querySelector('.mark-ear-l'), svg.querySelector('.mark-ear-r')];
  ears.forEach((e) => { e.style.transformBox = 'fill-box'; e.style.transformOrigin = '50% 100%'; });
  return {
    wrap, svg,
    render(t) {
      const closed = BLINKS.some((bt) => t >= bt && t < bt + 0.12);
      eyes.forEach((e) => e.setAttribute('ry', closed ? '1' : '11'));
      a.style.transform = `translate(${(-1.2 + 0.5 * Math.sin(t * 2.1)).toFixed(2)}px,${(-1.2 + 0.4 * Math.sin(t * 1.7 + 1)).toFixed(2)}px)`;
      b.style.transform = `translate(${(1.2 + 0.5 * Math.sin(t * 1.3 + 2)).toFixed(2)}px,${(1.2 + 0.4 * Math.sin(t * 2.3)).toFixed(2)}px)`;
      ears[0].style.transform = `rotate(${(3 * Math.sin(t * 2.03)).toFixed(2)}deg)`;
      ears[1].style.transform = `rotate(${(-3 * Math.sin(t * 1.46)).toFixed(2)}deg)`;
    },
  };
}

// ---- ripple ring --------------------------------------------------------------------------
export function makeRipple(parent, cx, cy, size) {
  const el = h('div', 'ripple', parent);
  box(el, cx - size / 2, cy - size / 2, size, size);
  return el;
}
export function rippleAt(el, t, t0, dur = 1.1) {
  const p = seg(t, t0, t0 + dur);
  const on = t >= t0 && p < 1;
  css(el, {
    transform: `scale(${lerp(0.15, 1, easeOut(p)).toFixed(4)})`,
    opacity: on ? ((1 - p) * 0.95).toFixed(3) : '0',
    borderWidth: lerp(5, 1, p).toFixed(2) + 'px',
  });
}

// ---- deterministic scramble ---------------------------------------------------------------
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789';
export function scramble(final, t, t0, each = 0.045, seed = 11) {
  let out = '';
  for (let i = 0; i < final.length; i++) {
    const lock = t0 + i * each;
    if (t >= lock + 0.18) out += final[i];
    else if (t >= lock - 0.25) {
      const r = mulberry32(seed + i * 131 + Math.floor(t * 30))();
      out += final[i] === ' ' ? ' ' : CHARSET[Math.floor(r * CHARSET.length)];
    } else out += final[i] === ' ' ? ' ' : ' ';
  }
  return out;
}
/** Typed text: n chars visible at t (cps chars per second from t0). */
export const typed = (s, t, t0, cps = 34) => s.slice(0, clamp(Math.floor((t - t0) * cps), 0, s.length));

// ---- outro: words converge around a spinning mark, end on the line ------------------------
export function makeOutro(stage) {
  const root = h('div', 'layer', stage);
  const markHost = h('div', 'abs', root);
  const mark = makeMark(markHost, 120);
  const left = h('div', 'abs display', root, 'Open router');
  const right = h('div', 'abs display', root, 'for your <span class="grad">subscriptions.</span>');
  [left, right].forEach((e) => { e.style.fontSize = '96px'; e.style.whiteSpace = 'nowrap'; e.style.top = '0px'; });
  const lock = h('div', 'abs', root);
  lock.style.display = 'flex'; lock.style.alignItems = 'center'; lock.style.gap = '22px';
  h('div', 'display', lock, 'superbot').style.fontSize = '44px';
  const cta = h('div', 'pill on', lock, '<span class="dot"></span>Get your key · beta.superbot.gg');
  cta.style.height = '54px'; cta.style.fontSize = '22px'; cta.style.marginLeft = '14px'; cta.style.padding = '0 22px';
  return { root, markHost, mark, left, right, lock, measured: false };
}
/** t0 = outro start. The final frame holds the end line. */
export function outroAt(o, t, t0) {
  if (!o.measured) {
    o.lw = o.left.offsetWidth; o.rw = o.right.offsetWidth; o.lkw = o.lock.offsetWidth; o.measured = true;
  }
  const on = t >= t0 - 0.05;
  css(o.root, { visibility: on ? 'visible' : 'hidden' });
  if (!on) return;
  o.mark.render(t);
  const gap = 34, mw = 120;
  // phase 1: mark spins in at center; words fly in from the sides and hug the mark
  const pm = sp(t, t0, PRESETS.heavy);
  const spin = (1 - sp(t, t0, PRESETS.heavy)) * 540;
  const lift = sp(t, t0 + 1.6, PRESETS.default); // phase 2: the mark lifts out, the line closes
  const yLine = 470, space = 24;
  const group = o.lw + gap * 2 + mw + o.rw; // words hugging the mark, centered as a group
  const closed = o.lw + space + o.rw; // final single line width
  const xL1 = 960 - group / 2, xM1 = xL1 + o.lw + gap, xR1 = xM1 + mw + gap;
  const xL2 = 960 - closed / 2, xR2 = xL2 + o.lw + space;
  const pl = sp(t, t0 + 0.35, PRESETS.heavy), pr = sp(t, t0 + 0.5, PRESETS.heavy);
  const xl = lerp(lerp(-o.lw - 120, xL1, pl), xL2, lift);
  const xr = lerp(lerp(1920 + 120, xR1, pr), xR2, lift);
  css(o.left, { transform: `translate3d(${xl.toFixed(2)}px,${yLine}px,0)`, opacity: clamp(pl * 1.4).toFixed(3) });
  css(o.right, { transform: `translate3d(${xr.toFixed(2)}px,${yLine}px,0)`, opacity: clamp(pr * 1.4).toFixed(3) });
  const mx = lerp(xM1, 960 - mw / 2, lift), my = lerp(yLine - 8, 268, lift);
  css(o.markHost, {
    transform: `translate3d(${mx}px,${my.toFixed(2)}px,0) perspective(700px) rotateY(${spin.toFixed(2)}deg) scale(${(lerp(0.2, 1, pm) * lerp(1, 0.9, lift)).toFixed(4)})`,
    opacity: clamp(pm * 1.5).toFixed(3),
  });
  const pk = sp(t, t0 + 2.2, PRESETS.default);
  css(o.lock, { transform: `translate3d(${(960 - o.lkw / 2).toFixed(2)}px,${lerp(700, 650, pk).toFixed(2)}px,0)`, opacity: pk.toFixed(3) });
}

// ---- boot ---------------------------------------------------------------------------------
export function boot({ dur, mount, render }) {
  const stage = document.getElementById('stage');
  const ready = (async () => {
    await mount(stage);
    await document.fonts.ready;
    await Promise.all([...stage.querySelectorAll('img')].map((im) => im.decode().catch((e) => { console.error('image decode failed', im.src, e); throw e; })));
  })();
  window.__DUR__ = dur;
  window.seek = async (t) => { await ready; render(clamp(t, 0, dur)); };
  if (window.__RENDER__) return;
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${((innerWidth - W * s) / 2).toFixed(1)}px,${((innerHeight - H * s) / 2).toFixed(1)}px) scale(${s})`;
  };
  fit(); addEventListener('resize', fit);
  const hold = 1.4;
  let paused = false, offset = 0, start = 0;
  addEventListener('click', () => { paused = !paused; if (!paused) start = performance.now() - offset * 1000; });
  ready.then(() => {
    start = performance.now();
    const loop = (now) => {
      if (!paused) offset = ((now - start) / 1000) % (dur + hold);
      render(Math.min(offset, dur));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
