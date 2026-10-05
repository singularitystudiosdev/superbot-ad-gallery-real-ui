// ui.js: shared surfaces drawn the way the hub draws them (composer, superbot window, agent windows).
import { el, put, box, pose, fade, tile, tileHTML, mascot, esc, ICON, MODELS, seg, sp, PRESETS, typed } from './core.js';

export function shell() {
  const root = el('div', 'scene');
  const cam = put(root, 'div', 'cam');
  const over = put(root, 'div', 'over');
  return { root, cam, over };
}

/** the hub composer card. setModel(key|null) swaps the model chip (null = Auto) */
export function composer(parent, x, y, w, { placeholder = 'How can superbot help you today?' } = {}) {
  const c = put(parent, 'div', 'comp');
  box(c, x, y, w);
  c.innerHTML = `<div class="comp-txt"><span class="comp-hint">${esc(placeholder)}</span><span class="comp-typed"></span><span class="caret"></span></div>
  <div class="comp-row"><span class="comp-ic">${ICON.plus}</span><span class="comp-super">SUPER</span><span class="comp-model"></span><span class="comp-gap"></span><span class="comp-ic">${ICON.mic}</span><span class="comp-send">${ICON.send}</span></div>`;
  const hint = c.querySelector('.comp-hint'), txt = c.querySelector('.comp-typed'), caret = c.querySelector('.caret');
  const chip = c.querySelector('.comp-model'), send = c.querySelector('.comp-send');
  const m = mascot(24);
  const autoChip = el('span', 'cm-v');
  autoChip.appendChild(m.el);
  autoChip.insertAdjacentHTML('beforeend', `<b>Auto</b>${ICON.chev}`);
  const variants = { auto: autoChip };
  for (const k of Object.keys(MODELS)) variants[k] = el('span', 'cm-v', `${tileHTML(MODELS[k].logo, 24)}<b>${esc(MODELS[k].name)}</b>${ICON.chev}`);
  Object.values(variants).forEach((v) => chip.appendChild(v));
  let cur = '';
  return {
    el: c, mascot: m,
    /** text: what's typed; t for the caret blink; model: key or 'auto'; pop: 0..1 chip pop; press: 0..1 send press */
    render(t, { text = '', model = 'auto', pop = 0, press = 0 } = {}) {
      if (txt.textContent !== text) txt.textContent = text;
      fade(hint, text ? 0 : 1);
      fade(caret, text && Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
      if (cur !== model) { cur = model; for (const [k, v] of Object.entries(variants)) v.style.display = k === model ? '' : 'none'; }
      chip.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * pop)).toFixed(4)})`;
      send.style.transform = `scale(${(1 - 0.12 * Math.sin(Math.PI * press)).toFixed(4)})`;
      m.render(t);
    },
  };
}

// ---------- the superbot agent window ----------
export const SBW = { x: 240, y: 200, w: 1440, h: 820, bar: 56 };
export const WIN_Y = SBW.y + SBW.h / 2 - 20; // camera focus that keeps the window clear of the caption lane
export const AGENTS = [
  { key: 'claude', name: 'Claude Code', logo: 'claude' },
  { key: 'codex', name: 'Codex', logo: 'openai' },
  { key: 'gemini', name: 'Gemini CLI', logo: 'gemini' },
  { key: 'cursor', name: 'Cursor', logo: 'cursor' },
];
export function sbWindow(parent) {
  const w = put(parent, 'div', 'win sbw');
  box(w, SBW.x, SBW.y, SBW.w, SBW.h);
  const bar = put(w, 'div', 'win-bar');
  bar.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
  const brand = put(bar, 'span', 'sbw-brand');
  const m = mascot(30);
  brand.appendChild(m.el);
  brand.insertAdjacentHTML('beforeend', '<b>superbot</b><span class="sbw-tag">agent</span>');
  const strip = put(bar, 'span', 'sbw-agents');
  put(strip, 'span', 'sbw-agents-l', 'one agent for');
  const chips = AGENTS.map((a) => { const c = put(strip, 'span', 'agchip'); c.appendChild(tile(a.logo, 24)); c.insertAdjacentHTML('beforeend', `<span>${esc(a.name)}</span>`); return c; });
  const body = put(w, 'div', 'win-body');
  return { el: w, bar, body, chips, strip, mascot: m };
}

// ---------- the four agent windows (drawn after each tool's own terminal / editor) ----------
export const AW = { w: 720, h: 380 };
const LINES = {
  claude: [
    '<div class="cc-box"><b class="cc-or">✻</b> Welcome to <b>Claude Code</b>!<br><span class="mut">/help for help, /status for your current setup</span><br><span class="mut">cwd: ~/store</span></div>',
    '<span class="mut">&gt;</span> fix the flaky checkout test',
    '<b class="cc-dot">⏺</b> Read(<span class="hl">src/checkout/cart.test.ts</span>)',
    '<b class="cc-dot">⏺</b> Update(<span class="hl">src/checkout/cart.ts</span>)',
    '<span class="mut">  ⎿ Updated with 4 additions and 1 removal</span>',
    '<b class="cc-or">✻</b> <span class="cc-or">Thinking…</span>',
  ],
  codex: [
    '<div class="cx-box"><b>&gt;_ OpenAI Codex</b><br><span class="mut">model: gpt-6 sol   directory: ~/store</span></div>',
    '<span class="cx-u">›</span> write the payment form component',
    '<span class="mut">•</span> Explored <span class="hl">src/components</span>',
    '<span class="mut">•</span> Ran <span class="hl">npm test -- payment</span>',
    '<span class="mut">•</span> Edited <span class="hl">PaymentForm.tsx</span> <span class="ok">+48</span> <span class="bad">-6</span>',
    '<span class="mut">◦ Working (14s · esc to interrupt)</span>',
  ],
  gemini: [
    '<div class="gm-logo">GEMINI</div>',
    '<span class="mut">Tips for getting started:</span>',
    '<span class="mut">1. Ask questions, edit files, or run commands.</span>',
    '<div class="gm-in"><span class="gm-u">&gt;</span> read every file in /src and map the routes</div>',
    '<span class="gm-u">✦</span> Reading 140 files…',
  ],
};
function cursorBody() {
  return `<div class="cu">
    <div class="cu-ed"><div class="cu-tabs"><span class="on">cart.tsx</span><span>checkout.ts</span></div>
      <div class="cu-code">
        <div><i>12</i><span class="k">export function</span> <span class="f">useCart</span>() {</div>
        <div><i>13</i>  <span class="k">const</span> [items, setItems] = <span class="f">useState</span>([])</div>
        <div><i>14</i>  <span class="k">const</span> total = <span class="f">sum</span>(items)</div>
        <div><i>15</i>  <span class="k">return</span> { items, total }</div>
        <div><i>16</i>}</div>
      </div></div>
    <div class="cu-ag"><div class="cu-agh">Agent</div><div class="cu-msg">Refactor checkout into hooks</div><div class="cu-st">Planning next moves…</div><div class="cu-in">Plan, search, build anything</div></div>
  </div>`;
}
const TITLES = { claude: 'claude · ~/store', codex: 'codex · ~/store', gemini: 'gemini · ~/store', cursor: 'Cursor · store' };
const LIMITS = {
  claude: 'Usage limit reached · resets 4pm',
  codex: 'You’ve hit your usage limit',
  gemini: 'Quota exceeded · try again tomorrow',
  cursor: 'You’ve hit your plan’s limit',
};

export function agentWindow(parent, a, x, y) {
  const w = put(parent, 'div', `win aw aw-${a.key}`);
  box(w, x, y, AW.w, AW.h);
  const bar = put(w, 'div', 'win-bar');
  bar.innerHTML = `<span class="dots"><i></i><i></i><i></i></span><span class="aw-title">${tileHTML(a.logo, 24)}<span>${esc(TITLES[a.key])}</span></span>`;
  const body = put(w, 'div', `win-body aw-body`);
  const rows = [];
  if (a.key === 'cursor') body.innerHTML = cursorBody();
  else LINES[a.key].forEach((ln) => rows.push(put(body, 'div', 'aw-ln', ln)));
  const lim = put(w, 'div', 'aw-limit', `<span class="aw-lim-dot"></span>${esc(LIMITS[a.key])}`);
  const codeRows = a.key === 'cursor' ? [...body.querySelectorAll('.cu-code > div, .cu-msg, .cu-st')] : [];
  return {
    el: w,
    /** t: local time, t0: first line, limitAt: time the limit banner lands (Infinity = never) */
    render(t, t0, limitAt = Infinity) {
      const list = rows.length ? rows : codeRows;
      list.forEach((r, i) => {
        const a0 = t0 + i * 0.16;
        r.style.opacity = seg(t, a0, a0 + 0.12).toFixed(3);
        r.style.transform = `translateY(${((1 - seg(t, a0, a0 + 0.2)) * 8).toFixed(2)}px)`;
      });
      const k = sp(t, limitAt, PRESETS.snappy);
      pose(lim, { y: (1 - k) * 60, o: seg(t, limitAt, limitAt + 0.12) });
      body.style.opacity = (1 - 0.55 * seg(t, limitAt, limitAt + 0.3)).toFixed(3);
    },
  };
}
