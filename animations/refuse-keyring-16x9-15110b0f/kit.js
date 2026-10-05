// Shared kit for the "doesn't refuse" spots (refuse.15110b0f): pure-of-t helpers, the four
// subscriptions, the one drop-in key, the stock endpoint's refusal, the routing lanes, the
// answer card, the end card and the boot/seek engine.
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
export const inOutCubic = (x) => { const c = clamp(x); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const inOutSine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
export const sp = (t, t0, p = PRESETS.default) => spring(t - t0, p.k, p.d);
export const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(smooth((t - a) / fi), smooth((b - t) / fo));

export function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
export const $ = (r, s) => r.querySelector(s);
export const $$ = (r, s) => [...r.querySelectorAll(s)];
export const op = (el, v) => { el.style.opacity = clamp(v).toFixed(3); el.style.visibility = v <= 0.001 ? 'hidden' : 'visible'; };
export const tf = (el, s) => { el.style.transform = s; };
export const money = (v, d = 2) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const typed = (text, t, t0, cps = 38) => text.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The four subscriptions the key is made of. Per-token list prices:
// openrouter.ai/api/v1/models, read 2026-10-05.
export const PLANS = [
  { id: 'claude', plan: 'Claude Max', vendor: 'Anthropic', color: '#d97757', model: 'Claude Opus 5.5', slug: 'anthropic/claude-opus-5.5', pin: 4, pout: 20, ctx: '1M', seg: '7Kq9' },
  { id: 'openai', plan: 'ChatGPT Pro', vendor: 'OpenAI', color: '#10a37f', model: 'GPT-6.1 Sol', slug: 'openai/gpt-6.1-sol', pin: 2, pout: 10, ctx: '1M', seg: 'xR2m' },
  { id: 'gemini', plan: 'Google AI Pro', vendor: 'Google', color: '#4c8df6', model: 'Gemini 3.1 Pro', slug: 'google/gemini-3.1-pro-preview', pin: 2, pout: 12, ctx: '2M', seg: 'Lw4T' },
  { id: 'deepseek', plan: 'DeepSeek plan', vendor: 'DeepSeek', color: '#4d6bfe', model: 'DeepSeek V4.1 Flash', slug: 'deepseek/deepseek-v4.1-flash', pin: 0.3, pout: 1.2, ctx: '1M', seg: 'pD8v' },
];
export const PLAN = Object.fromEntries(PLANS.map((p) => [p.id, p]));
export const KEY_FULL = 'sbc_' + PLANS.map((p) => p.seg).join('');
export const KEY_START = 'sbc_';
// The line a developer actually edits: base_url only.
export const STOCK_URL = 'https://api.openai.com/v1';
export const BASE_URL = 'https://api.superbot.gg/v1';
export const MODEL_LANES = ['claude', 'gemini', 'deepseek'];
export const listCost = (p, tin, tout) => (tin * p.pin + tout * p.pout) / 1e6;
export const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n));

export const logoSrc = (id) => `brand/${id}-logo.svg`;
export const tile = (id, cls = '') => `<div class="tile ${id} ${cls}"><img src="${logoSrc(id)}" alt=""></div>`;

// ---- the requests that stock endpoints refuse ----------------------------------
// Both are ordinary, legitimate asks. Both come back "I can't help with that."
export const REQUESTS = {
  pentest: {
    id: 'pentest',
    ask: 'Write a short Nmap + curl script to pen-test my own server before launch',
    slug: 'security-review',
    reply: 'Refused by a stock endpoint. Not a paid tier, not a policy, just a blind default.',
    answer: [
      '# scan my own host, low and slow, then probe HTTP methods',
      'nmap -sV -Pn -T2 --top-ports 400 203.0.113.10 -oN scan.txt',
      'curl -sI -X OPTIONS https://203.0.113.10/ | grep -i allow',
      'curl -s  https://203.0.113.10/.well-known/security.txt',
      'nmap --script http-headers,http-title -p443 203.0.113.10',
      '',
      '# findings in scan.txt: 8080 open (nginx 1.25 default page),',
      '# allow: GET,HEAD,POST,PUT (PUT should be 405 on a static host),',
      '# missing HSTS on the apex. Patch those three, re-scan.',
    ].join('\n'),
    tin: 118000, tout: 9400,
  },
  dosage: {
    id: 'dosage',
    ask: 'What is a typical amoxicillin dose for a 70 kg adult with a gum infection?',
    slug: 'dosage',
    reply: 'Refused by a stock endpoint. A dosing question, not a diagnosis.',
    answer: [
      'Typical adult course for a dental or gum infection, e.g. amoxicillin 500 mg:',
      '  500 mg every 8 hours, or 875 mg every 12 hours, 5 to 7 days.',
      '  70 kg adult in normal renal function sits inside standard dosing (no weight cap).',
      'Missed a dose: take it when you remember unless it is near the next one.',
      'Stop early only if a clinician tells you to; a half-finished course relapses.',
      'Penicillin allergy, breastfeeding, or kidney disease change this: ask a pharmacist.',
    ].join('\n'),
    tin: 96000, tout: 7200,
  },
  refund: {
    id: 'refund',
    ask: 'Draft a firm but polite refund request for a delayed delivery I paid for',
    slug: 'support-email',
    reply: 'Refused by a stock endpoint. A normal email, filtered on the word delay.',
    answer: [
      'Subject: Refund request - order 48120, delivered 9 days late',
      '',
      'Hi team,',
      'My order was due 26 Sep and arrived 5 Oct. The delivery window I paid',
      'for was not met, so I am asking for a full refund of the 19.00 shipping fee',
      'and 15% off the item value, or a free return and replacement.',
      'Order 48120. Receipt attached. Please confirm within 5 working days.',
      'Thanks,',
    ].join('\n'),
    tin: 74000, tout: 5600,
  },
};

// ---- mascot: the live hub mark, paused and seeked so a frame is f(t) -------------
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

// ---- cursor --------------------------------------------------------------------
export function makeCursor() {
  return h(`<div class="cursor"><div class="ring"></div><svg viewBox="0 0 24 24"><path d="M4 2.5 L4 19.5 L8.6 15.4 L11.5 21.6 L14.4 20.3 L11.6 14.2 L17.8 14.2 Z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/></svg></div>`);
}
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

// ---- camera --------------------------------------------------------------------
export function camera(el, t, keys, preset = { k: 60, d: 15.5 }) {
  const cx = track(t, keys.map((k) => [k[0], k[1]]), preset.k, preset.d);
  const cy = track(t, keys.map((k) => [k[0], k[2]]), preset.k, preset.d);
  const s = track(t, keys.map((k) => [k[0], k[3]]), preset.k, preset.d);
  tf(el, `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-cx}px, ${-cy}px)`);
  return { cx, cy, s };
}

// ---- message bubble: a request in, a reply out ----------------------------------
// role: 'user' | 'stock' | 'superbot'; state painted by the caller via returned refs.
export function makeChat() {
  const el = h(`<div class="chat">
    <div class="bub user"><div class="who">You</div><div class="body"><span class="txt"></span><span class="caret"></span></div></div>
    <div class="bub stock"><div class="who"><span class="ep mono"></span></div><div class="body"><div class="refuse"><span class="rk"></span>I can't help with that.</div><div class="why"></div></div></div>
    <div class="bub sb"><div class="who"><span class="m"></span><b>Superbot</b><span class="chip route mono"></span></div><div class="body"><pre class="ans mono"></pre><span class="cursor-line"></span></div></div>
  </div>`);
  const mark = makeMark(30);
  $(el, '.sb .who .m').appendChild(mark.el);
  return {
    el, mark,
    user: $(el, '.bub.user'),
    stock: $(el, '.bub.stock'),
    sb: $(el, '.bub.sb'),
    askTxt: $(el, '.user .txt'),
    caret: $(el, '.user .caret'),
    endpoint: $(el, '.stock .ep'),
    refuse: $(el, '.stock .refuse'),
    refuseMark: $(el, '.stock .rk'),
    why: $(el, '.stock .why'),
    answer: $(el, '.sb .ans'),
    route: $(el, '.sb .chip.route'),
    ansLine: $(el, '.sb .cursor-line'),
  };
}

// ---- the SDK snippet: the one line a developer edits ---------------------------
export function makeEditor() {
  const el = h(`<div class="editor">
    <div class="ed-bar"><div class="dots"><i></i><i></i><i></i></div><span class="tab">app.py</span><span class="tab dim">.env</span></div>
    <div class="ed-code mono"></div>
    <div class="ed-status mono"><span class="diff">base_url changed</span><span class="same">same SDK, same call, same key</span><span class="run">Run</span></div>
  </div>`);
  return { el, code: $(el, '.ed-code'), diff: $(el, '.diff'), same: $(el, '.same'), run: $(el, '.run') };
}
// Renders the 11-line OpenAI SDK snippet; the base_url line carries old -> new text.
export function editorLines(ed) {
  const CODE = [
    ['from ', 'openai', ' import OpenAI'],
    [''],
    ['client = OpenAI('],
    ['    base_url=', `https://api.openai.com/v1`, `https://api.superbot.gg/v1`, { swap: true }],
    ['    api_key=', 'os.environ["OPENAI_API_KEY"]', 'os.environ["SUPERBOT_API_KEY"]', { swap: true }],
    ['',],
    ['reply = client.chat.completions.create('],
    ['    model=', '"auto"', null, {}],
    ['    messages=[{"role": "user", "content": ask}],'],
    [')',],
  ];
  const lines = CODE.map((parts, i) => {
    const ln = h(`<div class="ln"><span class="no">${i + 1}</span><span class="gut"></span><span class="src"></span></div>`);
    const src = $(ln, '.src');
    if (parts.length >= 3 && typeof parts[1] === 'string' && typeof parts[2] === 'string' && parts[3] && parts[3].swap) {
      // swap line: base_url=' old ' / ' new '
      src.appendChild(h(`<span class="kw">${esc(parts[0])}</span>`));
      src.appendChild(h(`<span class="str"><span class="old">${esc(parts[1])}</span><span class="new">${esc(parts[2])}</span></span>`));
    } else {
      parts.forEach((p) => src.appendChild(h(`<span>${esc(p) || '&nbsp;'}</span>`)));
    }
    ed.code.appendChild(ln);
    return ln;
  });
  return lines;
}

// ---- the keyring card: subscriptions pack into one sbc_ key ---------------------
export function makeKeyCard() {
  const el = h(`<div class="keycard">
    <div class="kc-empty">No key yet</div>
    <div class="kc-body">
      <div class="kc-top"><span class="kc-lbl mono">api key</span><span class="chip kc-count"><i class="dot"></i><span class="n">0</span>&nbsp;<span class="w">subscriptions</span></span></div>
      <div class="kc-key mono"><span class="pre">sbc_</span>${PLANS.map((p) => `<span class="sg" style="--c:${p.color}"></span>`).join('')}<span class="caret"></span></div>
      <div class="kc-slots">${PLANS.map(() => '<div class="slot"></div>').join('')}</div>
      <div class="kc-copy"><span class="cp">Copy</span><span class="cpd">Copied</span></div>
    </div>
  </div>`);
  return {
    el,
    empty: $(el, '.kc-empty'),
    body: $(el, '.kc-body'),
    count: $(el, '.kc-count .n'),
    countW: $(el, '.kc-count .w'),
    key: $(el, '.kc-key'),
    caret: $(el, '.kc-caret, .kc-key .caret'),
    copy: $(el, '.kc-copy'),
    cp: $(el, '.cp'),
    cpd: $(el, '.cpd'),
    segs: $$(el, '.sg'),
    slots: $$(el, '.kc-slots .slot'),
  };
}

// ---- routing lanes: Opus 5.5 vs Gemini 3.1 Pro vs DeepSeek V4.1 Flash ------------
export function makeLanes() {
  const el = h(`<div class="lanes">
    ${MODEL_LANES.map((id) => {
      const p = PLAN[id];
      return `<div class="lane" data-id="${id}" style="--c:${p.color}">
        <div class="l-top">${tile(id, 'sm')}<div class="l-nm"><b>${p.model}</b><span class="mono">${p.slug}</span></div><span class="l-pick">pick</span><span class="l-win">routed</span></div>
        <div class="l-fit"><span class="l-fl">fit</span><div class="bar"><i></i></div><span class="l-sc mono">0.00</span></div>
        <div class="l-meta"><span class="l-cost mono"></span><span class="l-bill chip plan">${tile(id)}${p.plan}</span></div>
      </div>`;
    }).join('')}
  </div>`);
  return { el, lanes: $$(el, '.lane') };
}

// ---- refusal badge drawn over the stock reply ----------------------------------
// (the caller positions/animates the .refuse element it already owns)

// ---- end card: lockup, then the line -------------------------------------------
export const END_LINE = "Superbot doesn't refuse. Drop in API replacement.";
export function makeEnd(line = END_LINE) {
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
    render(lt) {
      const a = sp(lt, 0, PRESETS.heavy);
      tf(lock, `translateY(${(1 - a) * 40}px) scale(${0.92 + 0.08 * a})`);
      op(lock, smooth(lt / 0.35));
      spans.forEach((s, i) => {
        const t0 = 0.5 + i * 0.075;
        const k = sp(lt, t0, PRESETS.default);
        tf(s, `translateY(${(1 - k) * 46}px)`);
        op(s, smooth((lt - t0) / 0.22));
      });
      const em = spans[spans.length - 1];
      em.style.setProperty('--u', outCubic((lt - 1.3) / 0.6).toFixed(3));
      mark.render(lt + 2);
    },
  };
}

// ---- boot: stage fit, seek, preview loop ---------------------------------------
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