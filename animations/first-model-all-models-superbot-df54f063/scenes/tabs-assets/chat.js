// "Make a Japanese relaxing biking demo": one ask, three hand-offs, 7 s. Superbot switches to Meshy for the 3D models
// (beats/meshy.js), to DeepSeek to scrape the assets (beats/scrape.js), to Opus 5.5 for the three.js code
// (beats/code.js), and the output window opens on the ride (beats/output.js, the push into the clip). Every switch is
// its own large routing chip ("Switching to Meshy", spinner, then a check), the reply under it opens on a header row
// with the model's logo and name, the composer's model chip follows, and the previous reply compresses to its header
// (with a one-line result) as the next chip slides in. The thread is bottom-anchored, so everything rises out of the
// composer. SCHED below is the whole clock; ./cuts.js holds the copy. renderChat(c, t) is a pure function of the
// scene's local time.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { CFG } from './cuts.js?v=8';
import meshy from './beats/meshy.js?v=3';
import scrape from './beats/scrape.js?v=3';
import code from './beats/code.js?v=1';
import output from './beats/output.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const APPS = {
  superbot: { name: 'Superbot', logo: null }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
  meshy: { name: 'Meshy', logo: brand('meshy-logo.svg') },
  deepseek: { name: 'DeepSeek', logo: brand('deepseek-logo.svg') },
  opus: { name: 'Opus 5.5', logo: brand('claude-logo.svg') },
};

// ---- the clock (scene-local seconds) ----
// the ask is typed into the empty state's composer and sent; each hand-off's chip lands at sw, the composer's model chip
// swaps at sw + SWAP, the chip checks at sw + DONE, and the model answers a beat later. A reply compresses as the next
// chip lands. The output window opens as a continuation of Opus's reply and the scene ends as the push lands.
export const SCHED = {
  type0: 0.06, typeEnd: 0.74, send: 0.88,
  sw: [1.05, 2.7, 4.4],
  out: 6.02,
  end: 7.0,
};
const SWAP = 0.16, DONE = 0.34, REPLY = 0.05, SQUEEZE = [-0.06, 0.26];

// the hand-offs in order; `label` is the routing chip's line, `sum` is the one line a reply keeps once it has compressed
const STEPS = [
  { app: 'meshy', mod: meshy, label: 'Switching to Meshy', sum: '4 models' },
  { app: 'deepseek', mod: scrape, label: 'Switching to DeepSeek', sum: '148 assets' },
  { app: 'opus', mod: code, label: 'Switching to Opus 5.5', sum: 'Built' },
  { app: 'opus', mod: output, cont: true },
];

function timeBeats() {
  let i = 0;
  return STEPS.map((st, n) => {
    const k = { ...st, cfg: CFG };
    if (st.cont) {
      k.reply = SCHED.out;
      k.next = SCHED.end;
    } else {
      const sw = SCHED.sw[i++];
      k.chip = { sw, swap: sw + SWAP, done: sw + DONE };
      k.reply = sw + DONE + REPLY;
      const nx = STEPS[n + 1];
      k.next = nx && nx.cont ? SCHED.out : SCHED.sw[i] !== undefined ? SCHED.sw[i] : SCHED.end;
      // the body folds away as the next thing lands
      k.squeeze = [k.next + SQUEEZE[0], k.next + SQUEEZE[1]];
    }
    k.T = st.mod.times(k.reply, k.next, CFG);
    return { k };
  });
}
export const BEATS = timeBeats();
export const ASK = { s: SCHED.type0, typeEnd: SCHED.typeEnd, send: SCHED.send };

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand };
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;

  const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(CFG.ask)}</div></div></div>`);
  let prev = null; // the last reply's column, which a continuation beat appends to
  const beats = BEATS.map(({ k }) => {
    if (k.cont && prev) {
      const inst = k.mod.build(k, ctx);
      inst.nodes.forEach((n) => prev.appendChild(n));
      return { k, sw: null, r: null, who: null, body: null, inst };
    }
    const w = add(`<div class="msg qc-m qc-swm">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const a = APPS[k.app];
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${esc(a.name)}</b><small>in superbot</small><span class="qc-sum">${OK}${esc(k.sum)}</span></div><div class="qc-body"></div></div></div>`);
    const main = r.querySelector('.m-main');
    const body = r.querySelector('.qc-body');
    prev = main;
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => body.appendChild(n));
    const s = w.querySelector('.qc-sw');
    return {
      k, inst, r, body, who: main.firstElementChild, sum: r.querySelector('.qc-sum'),
      sw: { w, sw: s, tile: s.firstElementChild, spin: s.querySelector('.qc-spin'), ok: s.querySelector('.qc-st .qc-ok') },
    };
  });
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = [[SCHED.send, u], ...beats.flatMap((b) => [...(b.sw ? [[b.k.chip.sw, b.sw.w]] : []), ...(b.who ? [[b.k.reply, b.who]] : []), ...b.inst.marks])]
    .sort((x, y) => x[0] - y[0]);

  // the composer's model chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  // the chip starts on Superbot itself (the router), mark showing, and hands off from there
  const pImg = el(`<img alt="" src="${APPS.meshy.logo}" data-app="superbot" style="display:none"/>`);
  const pMark = el(`<span class="qc-pi-sb" style="display:block">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, u, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    focus: beats.map((b) => b.inst.focus).find(Boolean) || null,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.36));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const typing = t >= ASK.s && t < ASK.send;
  let ph;
  if (typing) {
    const n = Math.round(CFG.ask.length * seg(t, ASK.s, ASK.typeEnd));
    ph = `<span class="qc-typed">${esc(CFG.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', typing);
  const at = ASK.send;
  c.send.style.transform = t >= at - 0.12 && t < at + 0.2 ? `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})` : 'none';
}

function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (k.chip && t >= k.chip.swap) { app = k.app; swap = k.chip.swap; } });
  // the composer's model chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.12, swap + 0.12))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.36));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the routing chip: slides in from the left, its logo tile pops, the label shimmers while it routes, then the spinner
// gives way to a check
function renderSwitch(s, k, t) {
  const c = k.chip;
  const p = outCubic(seg(t, c.sw, c.sw + 0.3));
  s.w.style.opacity = p.toFixed(3);
  s.w.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -36).toFixed(2)}px)`;
  s.sw.classList.toggle('qc-done', t >= c.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - c.sw) * 260) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, c.done - 0.06, c.done + 0.04)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - c.sw) * 520).toFixed(1)}deg)`;
  const o = seg(t, c.done, c.done + 0.22);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, c.sw + 0.04, c.sw + 0.36));
  s.tile.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

// a reply folds its body away (height and opacity) and its header takes a one-line result
function renderSqueeze(b, t) {
  const e = inOutCubic(seg(t, b.k.squeeze[0], b.k.squeeze[1]));
  if (e <= 0) { b.body.style.height = ''; b.body.style.overflow = ''; b.body.style.opacity = ''; b.sum.style.opacity = '0'; b.sum.style.transform = ''; return; }
  b.body.style.overflow = 'hidden';
  b.body.style.height = '';
  const h = b.body.offsetHeight;
  b.body.style.height = (h * (1 - e)).toFixed(2) + 'px';
  b.body.style.opacity = (1 - seg(e, 0, 0.6)).toFixed(3);
  const s = outCubic(seg(t, b.k.squeeze[0] + 0.1, b.k.squeeze[1] + 0.06));
  b.sum.style.opacity = s.toFixed(3);
  b.sum.style.transform = s >= 1 ? 'none' : `translateX(${((1 - s) * 10).toFixed(2)}px)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.36)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  appear(c.u, t, SCHED.send);
  c.beats.forEach((b) => {
    if (b.sw) { renderSwitch(b.sw, b.k, t); appear(b.r, t, b.k.reply); }
    b.inst.render(t);
    if (b.body) renderSqueeze(b, t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
