// core.js: the film is a pure function of time. Helpers, brand data and small UI parts every scene shares.
import { spring, PRESETS, mulberry32 } from './motion.mjs';
export { PRESETS, mulberry32 };

export const W = 1920, H = 1080;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const seg = (t, a, b) => { const v = (t - a) / (b - a); return Number.isFinite(v) ? clamp(v) : t >= a ? 1 : 0; };
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = {
  outCubic: (p) => 1 - (1 - p) ** 3,
  outQuint: (p) => 1 - (1 - p) ** 5,
  inCubic: (p) => p ** 3,
  inOutCubic: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
};
/** spring from rest that starts at t0 (0 before it) */
export const sp = (t, t0, preset = PRESETS.default) => (t <= t0 ? 0 : spring(t - t0, preset.k, preset.d));
/** eased 0..1 over [a, b] */
export const ez = (t, a, b, f = ease.outCubic) => f(seg(t, a, b));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
export function put(parent, tag, cls, html) { const e = el(tag, cls, html); parent.appendChild(e); return e; }
/** absolute box in stage pixels */
export function box(e, x, y, w, h) {
  e.style.left = `${x}px`; e.style.top = `${y}px`;
  if (w != null) e.style.width = `${w}px`;
  if (h != null) e.style.height = `${h}px`;
  return e;
}
/** transform + opacity in one write; hidden when fully transparent */
export function pose(e, { x = 0, y = 0, s = 1, sx = s, sy = s, r = 0, o = 1, ry = 0 } = {}) {
  e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)${ry ? ` perspective(1600px) rotateY(${ry.toFixed(2)}deg)` : ''} rotate(${r.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
  const oo = clamp(o);
  e.style.opacity = oo.toFixed(3);
  e.style.visibility = oo < 0.002 ? 'hidden' : '';
}
export function fade(e, o) {
  const oo = clamp(o);
  e.style.opacity = oo.toFixed(3);
  e.style.visibility = oo < 0.002 ? 'hidden' : '';
}
/** chars of a string revealed at cps from t0 */
export const typed = (s, t, t0, cps = 42) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- brand data (marks used nominatively; sources in brand/CREDITS.txt) ----------
export const LOGO = {
  claude: { src: 'brand/claude-logo.svg', bg: '#d97757', pad: 0.2 },
  openai: { src: 'brand/openai-logo.svg', bg: '#000', pad: 0 },
  gemini: { src: 'brand/gemini-logo.svg', bg: '#1f1f22', pad: 0.18 },
  deepseek: { src: 'brand/deepseek-logo.svg', bg: '#1f1f22', pad: 0.16 },
  cursor: { src: 'brand/cursor-logo.svg', bg: '#1f1f22', pad: 0.16 },
};
export const MODELS = {
  opus: { name: 'Claude Opus 5.5', logo: 'claude', plan: 'Claude Max', need: 'hard reasoning' },
  gemini: { name: 'Gemini 3.8 Flash', logo: 'gemini', plan: 'Google AI Pro', need: 'long context' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: 'deepseek', plan: 'DeepSeek API', need: 'bulk work' },
  gpt: { name: 'GPT-6 Sol', logo: 'openai', plan: 'ChatGPT Pro', need: 'fast code' },
};
export const PLANS = [
  { name: 'Claude Max', logo: 'claude', who: 'Anthropic' },
  { name: 'ChatGPT Pro', logo: 'openai', who: 'OpenAI' },
  { name: 'Google AI Pro', logo: 'gemini', who: 'Google' },
  { name: 'Cursor Pro', logo: 'cursor', who: 'Cursor' },
  { name: 'DeepSeek API', logo: 'deepseek', who: 'DeepSeek' },
];
export const KEY_MASK = 'sbc_live_••••••••••••••••7f3a';
export const BASE_URL = 'https://beta.superbot.gg/v1';

/** rounded logo tile, size in px */
export function tile(logo, size, extra = '') {
  const L = LOGO[logo];
  const pad = Math.round(size * L.pad);
  const t = el('span', `tile ${extra}`);
  t.style.cssText = `width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.3)}px;background:${L.bg};padding:${pad}px`;
  t.innerHTML = `<img src="${L.src}" alt="">`;
  return t;
}
export const tileHTML = (logo, size, extra = '') => tile(logo, size, extra).outerHTML;

// ---------- the superbot mascot (shared gallery asset), frozen off the wall clock ----------
export function mascot(size) {
  const host = el('span', 'mascot');
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = el('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, lastT = NaN;
  return {
    el: host,
    render(t) {
      if (t === lastT) return; lastT = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { a.pause(); a.currentTime = Math.max(0, t) * 1000; }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

// ---------- small UI parts ----------
export const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M16 7l3 3M14 9l2 2"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

/** "Switching to <model>" pill (the hub's qc-sw): spinner, then a green check */
export function switchPill(modelKey, verb = 'Switching to') {
  const M = MODELS[modelKey];
  const p = el('div', 'sw');
  p.innerHTML = `${tileHTML(M.logo, 30)}<span class="sw-l">${verb} <b>${esc(M.name)}</b></span><span class="sw-st"><span class="spin"></span><span class="ok">${ICON.check}</span></span>`;
  const spin = p.querySelector('.spin'), ok = p.querySelector('.ok');
  return {
    el: p,
    /** t: local time; done: time the check lands */
    render(t, done) {
      spin.style.transform = `rotate(${(t * 420) % 360}deg)`;
      const k = sp(t, done, PRESETS.playful);
      fade(spin, 1 - seg(t, done - 0.05, done + 0.08));
      pose(ok, { s: 0.3 + 0.7 * k, o: seg(t, done, done + 0.1) });
    },
  };
}

/** model chip: tile + model name (+ optional plan) */
export function modelChip(modelKey, { plan = false, size = 26, cls = '' } = {}) {
  const M = MODELS[modelKey];
  return el('span', `mchip ${cls}`, `${tileHTML(M.logo, size)}<b>${esc(M.name)}</b>${plan ? `<i>via ${esc(M.plan)}</i>` : ''}`);
}

/** caption lane: words rise out of a mask, then lift out */
export function caption(parent, lines, { x = 120, y = 96, size = 58, align = 'left', w = 1680, scrim = true } = {}) {
  const sc = scrim ? put(parent, 'div', 'cap-scrim') : null;
  const c = put(parent, 'div', 'cap');
  box(c, x, y, w);
  c.style.fontSize = `${size}px`;
  c.style.textAlign = align;
  const words = [];
  lines.forEach((ln, li) => {
    const row = put(c, 'div', `cap-row ${ln.dim ? 'dim' : ''}`);
    ln.text.split(' ').forEach((wd) => {
      const m = put(row, 'span', 'cap-m');
      const s = put(m, 'span', 'cap-w', esc(wd));
      words.push({ s, li });
      row.appendChild(document.createTextNode(' '));
    });
  });
  return {
    el: c,
    /** tIn: first word starts; tOut: lift-out start (Infinity = stays) */
    render(t, tIn, tOut = Infinity, stagger = 0.045) {
      words.forEach((w, i) => {
        const a = tIn + i * stagger + w.li * 0.12;
        const pin = ease.outQuint(seg(t, a, a + 0.55));
        const pout = ease.inCubic(seg(t, tOut + i * 0.02, tOut + 0.35 + i * 0.02));
        w.s.style.transform = `translateY(${((1 - pin) * 105 - pout * 105).toFixed(2)}%)`;
      });
      if (sc) sc.style.opacity = (seg(t, tIn - 0.1, tIn + 0.25) * (1 - seg(t, tOut + 0.1, tOut + 0.45))).toFixed(3);
    },
  };
}

/** a camera: scale about a focus point, tracked with springs. keys: [[t, {x, y, s}]] in stage px */
export function camera(keys, preset = PRESETS.default) {
  const tr = (t, prop, def) => {
    let v = keys[0][1][prop] ?? def;
    for (let i = 1; i < keys.length; i++) {
      const [tk, kv] = keys[i];
      const prev = keys.slice(0, i).reverse().find((k) => k[1][prop] != null);
      const from = prev ? prev[1][prop] : def;
      if (kv[prop] == null) continue;
      const pr = kv.preset || preset;
      v += (kv[prop] - from) * sp(t, tk, pr);
    }
    return v;
  };
  return (t) => ({ x: tr(t, 'x', W / 2), y: tr(t, 'y', H / 2), s: tr(t, 's', 1) });
}
/** apply a camera state to a full-stage layer: focus point (fx, fy) lands at the frame centre */
export function applyCam(e, c) {
  const tx = W / 2 - c.x * c.s, ty = H / 2 - c.y * c.s;
  e.style.transformOrigin = '0 0';
  e.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${c.s.toFixed(4)})`;
}
