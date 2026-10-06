// One ask, five provider switches inside one superbot turn, each followed by the output that model actually makes:
// DeepSeek scrapes Reddit -> Gemini makes the label -> Blender models the can -> ElevenLabs voices the spot ->
// Claude Opus 5.5 codes the page. Pill copy follows the app (provider-switch.ts): a model reads "Switching to X" then
// "Switched to X", a service reads "Connecting to X" then "Connected to X" and nests its steps under the pill.
// Everything is a pure function of the tabs scene's local time t (the thread is already live at t = 0).
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import deepseek from './beats/deepseek.js';
import gemini from './beats/gemini.js';
import blender from './beats/blender.js';
import eleven from './beats/eleven.js';
import opus from './beats/opus.js';

const brand = (f) => new URL(`../../brand/${f}`, import.meta.url).href;
const img = (f) => new URL(`../../img/${f}`, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const ASK = 'Launch my soda brand tonight.';

export const APPS = {
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), kind: 'model', task: 'scrapes Reddit' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), kind: 'model', task: 'makes the label' },
  blender: { name: 'Blender', logo: brand('blender-logo.svg'), kind: 'service', task: 'models the 3D can' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), tile: brand('elevenlabs-tile.svg'), kind: 'model', task: 'voices the ad' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), tile: brand('anthropic-tile.png'), kind: 'model', task: 'codes the page' },
};

// sw: the pill lands; done: its check; reply: the who header and output (default done + 0.08);
// steps (services only): [running, finished, start, end], an end of null runs until the output lands
export const BEATS = [
  { app: 'deepseek', sw: -1.4, done: -0.7, mod: deepseek },
  { app: 'gemini', sw: 1.3, done: 1.7, mod: gemini },
  {
    app: 'blender', sw: 2.84, done: 3.22, reply: 3.46, mod: blender,
    steps: [
      ['Modeling a 12 oz can', 'Modeled a 12 oz can', 3.04, 3.3],
      ['Wrapping Gemini’s label', 'Wrapped Gemini’s label', 3.18, 3.42],
      ['Rendering in Cycles', 'Rendered in Cycles', 3.32, null],
    ],
  },
  { app: 'eleven', sw: 4.42, done: 4.82, mod: eleven },
  { app: 'opus', sw: 5.7, done: 6.1, mod: opus },
].map((k) => ({ ...k, swap: k.sw + 0.2, reply: k.reply ?? k.done + 0.08 }));
BEATS.forEach((k) => {
  k.T = k.mod.times(k.reply);
  // Cycles is still rendering until its clean frame lands: the step ticks then, not before
  (k.steps || []).forEach((s) => { if (s[3] === null) s[3] = k.T.clean; });
});

// rail sync: a model is "on" from its pill to the next pill, "done" once its output has landed
export const CHAIN = BEATS.map((k, i) => ({ app: k.app, ...APPS[k.app], on: k.sw, off: i + 1 < BEATS.length ? BEATS[i + 1].sw : 1e9, done: k.T.landed }));

export const pillLabel = (app, done) => {
  const a = APPS[app];
  if (a.kind === 'service') return `${done ? 'Connected' : 'Connecting'} to ${a.name}`;
  return `${done ? 'Switched' : 'Switching'} to ${a.name}`;
};

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export const tileHtml = (app, cls = '') => {
  const a = APPS[app];
  return a.tile
    ? `<span class="qc-tile qc-t-${app} qc-full ${cls}"><img src="${a.tile}" alt=""/></span>`
    : `<span class="qc-tile qc-t-${app} ${cls}"><img src="${a.logo}" alt=""/></span>`;
};

export function mountChat(hub) {
  const root = hub.closest('.sbsite').parentNode;
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };
  const box = (n) => boxIn(n, root);
  // sway0: the moment Blender's clean render lands; every view of the can sways from it, so they stay in sync
  const ctx = { hub, box, tile: tileHtml, OK, esc, el, brand, img, sbSrc, sway0: BEATS.find((b) => b.app === 'blender').T.clean };
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;

  const user = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(ASK)}</div></div></div>`);

  const beats = BEATS.map((k) => {
    const nest = (k.steps || []).map(([run]) => `<div class="qc-step"><span class="qc-st"><i class="qc-spin"></i>${OK}</span><span class="qc-stl">${esc(run)}</span></div>`).join('');
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tileHtml(k.app)}<span class="qc-swl">${esc(pillLabel(k.app, false))}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>${nest ? `<div class="qc-nest">${nest}</div>` : ''}</div></div>`);
    const steps = [...w.querySelectorAll('.qc-step')].map((n, i) => ({ n, s: k.steps[i], spin: n.querySelector('.qc-spin'), ok: n.querySelector('.qc-ok'), l: n.querySelector('.qc-stl'), last: null }));
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tileHtml(k.app)}<b>${esc(APPS[k.app].name)}</b><small>in superbot</small></div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return {
      k, w, sw: w.querySelector('.qc-sw'), swl: w.querySelector('.qc-swl'), spin: w.querySelector('.qc-sw .qc-spin'),
      ok: w.querySelector('.qc-sw .qc-ok'), steps, r, who: main.firstElementChild, inst, lastDone: null,
    };
  });

  // scroll marks: after each time, the fold glides to that element's bottom
  const scroll = [[-9, user], ...beats.flatMap((b) => [
    [b.k.sw, b.w],
    ...b.steps.map((s) => [s.s[2], s.n]),
    [b.k.reply, b.who],
    ...b.inst.marks,
  ])].sort((x, y) => x[0] - y[0]);

  // the composer's platform chip follows the routed model
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.deepseek.logo}" data-app="deepseek"/>`);
  pIcon.append(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.deepseek.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  return { hub, feed, inner, user, beats, scroll, plat, pImg, pLabel, lastApp: 'deepseek' };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.32));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderRouting(c, t) {
  let app = 'deepseek', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.swap) { app = k.app; swap = k.swap; } });
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.12, swap + 0.12))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.36));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.k;
  // the pill keeps the width of its running label, so the shorter finished label never snaps it narrower
  if (!s.minW) { s.minW = s.swl.offsetWidth; if (s.minW) s.swl.style.minWidth = `${s.minW}px`; }
  const done = t >= k.done - 0.05;
  if (done !== s.lastDone) { s.sw.classList.toggle('qc-done', done); s.swl.textContent = pillLabel(k.app, done); s.lastDone = done; }
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.1, k.done)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done - 0.1, k.done);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.04, k.sw + 0.38));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
  for (const st of s.steps) {
    const [run, fin, a, b] = st.s;
    appear(st.n, t, a, 6);
    const txt = t >= b - 0.05 ? fin : run;
    if (txt !== st.last) { st.l.textContent = txt; st.n.classList.toggle('qc-sdone', t >= b - 0.05); st.last = txt; }
    st.spin.style.opacity = (1 - seg(t, b - 0.1, b)).toFixed(3);
    st.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
    const so = seg(t, b - 0.1, b);
    st.ok.style.opacity = so.toFixed(3);
    st.ok.style.transform = `scale(${lerp(0.3, 1, outBack(so)).toFixed(4)})`;
  }
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.4)));
  }
  c.inner.style.transform = `translateY(${(viewH - 18 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  // the ask was sent just before the first frame: it is on screen from t = 0
  c.user.style.opacity = '1';
  c.user.style.transform = 'none';
  renderRouting(c, t);
  for (const b of c.beats) {
    appear(b.w, t, b.k.sw);
    renderSwitch(b, t);
    appear(b.r, t, b.k.reply, 8);
    b.inst.render(t);
  }
  renderScroll(c, t);
}
