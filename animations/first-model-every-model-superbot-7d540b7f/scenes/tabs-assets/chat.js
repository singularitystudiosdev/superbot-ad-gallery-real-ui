// first-model-every-model-superbot: one ask, three models. The ask is typed into the composer and sent, superbot routes
// it three times (Meshy models the assets, DeepSeek scrapes the audio and textures, Opus 5.5 builds the ride), and
// each routing chip is the start of a clean zoom (tabs.js flies a native-size twin of the chip to the centre of an
// empty frame, resolves it and flies it back). The thread is bottom-anchored so every message rises out of the
// composer. renderChat(c, t) is a pure function of the scene's local time.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import meshy from './beats/meshy.js?v=fm1';
import scrape from './beats/scrape.js?v=fm1';
import code from './beats/code.js?v=fm1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const ASK = 'Make a Japanese relaxing biking demo';

// the clock (scene-local seconds)
export const TYPE0 = 0.25, TYPE1 = 0.95, SEND = 1.05;
// a zoom: in (match cut to the centre), hold (shimmer, resolve, shine), out (back into the thread slot)
export const Z_IN = 0.26, Z_HOLD = 0.34, Z_OUT = 0.2, Z_LEN = Z_IN + Z_HOLD + Z_OUT;
export const Z_DONE = Z_IN + 0.1;          // the spinner resolves to the check (zoom-relative)
export const Z_SHINE = [Z_IN - 0.02, Z_IN + 0.3]; // the shine band's sweep (zoom-relative)
export const CHAT_END = 7.0;
export const PREVIEW = { say: 6.55, card: 6.6, grow: 6.8 };

export const APPS = {
  meshy: { name: 'Meshy', logo: brand('meshy-logo.svg') },
  deepseek: { name: 'DeepSeek', logo: brand('deepseek-logo.svg') },
  opus: { name: 'Opus 5.5', logo: brand('claude-logo.svg') },
};

// the three routings: the chip lands in the thread at `chip`, the zoom runs z0 .. z0 + Z_LEN, the model answers at
// the zoom's end
const ROUTES = [
  { app: 'meshy', mod: meshy, chip: 1.15, z0: 1.25 },
  { app: 'deepseek', mod: scrape, chip: 2.75, z0: 2.85 },
  { app: 'opus', mod: code, chip: 4.35, z0: 4.45 },
];
export const BEATS = ROUTES.map((r) => {
  const k = { ...r, label: `Switching to ${APPS[r.app].name}`, z1: r.z0 + Z_LEN, done: r.z0 + Z_DONE, reply: r.z0 + Z_LEN };
  k.T = r.mod.times(k.reply);
  return k;
});

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${APPS[app].logo}" alt=""/></span>`;

// a line superbot says, streamed word by word (the full text holds its layout from the start)
export function sayEl(text) {
  const n = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(text)}</span></div>`);
  const vis = n.firstElementChild, hid = n.lastElementChild;
  let last = -1;
  return {
    n,
    render(t, t0, cps = 90) {
      const c = clamp(Math.floor((t - t0) * cps), 0, text.length);
      if (c === last) return;
      last = c;
      vis.textContent = text.slice(0, c);
      hid.textContent = text.slice(c);
    },
  };
}

// a node rising into place: opacity + translateY, eased out
export function rise(n, t, a, d = 0.28, dy = 8) {
  const p = outCubic(seg(t, a, a + d));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

export function mountChat(hub) {
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  feed.replaceChildren(inner);
  const add = (html) => { const n = typeof html === 'string' ? el(html) : html; inner.appendChild(n); return n; };
  const ctx = { hub, OK, esc, el, brand, tile, sayEl, rise };

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(ASK)}</div></div></div>`);

  const beats = BEATS.map((k) => {
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${APPS[k.app].name}</b><small>in superbot</small></div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    const sw = w.querySelector('.qc-sw');
    return { k, w, sw, spin: sw.querySelector('.qc-spin'), ok: sw.querySelector('.qc-st .qc-ok'), r, who: main.firstElementChild, inst };
  });

  // scroll marks: after each time, the feed's fold glides so that element's bottom sits on the fold
  const scroll = [[SEND, u], ...beats.flatMap((b) => [[b.k.chip, b.w], [b.k.reply, b.who], ...b.inst.marks])].sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model superbot routed to
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  pIcon.appendChild(cat);
  const pImg = el('<img alt="" style="display:none"/>');
  pIcon.appendChild(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el('<span>superbot</span>');
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return { hub, feed, inner, u, beats, scroll, plat, cat, pImg, pLabel, ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null };
}

function renderComposer(c, t) {
  const typing = t >= TYPE0 && t < SEND;
  let ph;
  if (typing) {
    const n = Math.round(ASK.length * seg(t, TYPE0, TYPE1));
    ph = `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', typing && t >= TYPE0 + 0.05);
  const p = seg(t, SEND - 0.1, SEND + 0.16);
  c.send.style.transform = p > 0 && p < 1 ? `scale(${(1 - 0.16 * bump(p)).toFixed(4)})` : 'none';
}

function renderRouting(c, t) {
  let app = null, at = -1;
  c.beats.forEach(({ k }) => { if (t >= k.done) { app = k.app; at = k.done; } });
  if (app !== c.lastApp) {
    c.cat.style.display = app ? 'none' : '';
    c.pImg.style.display = app ? '' : 'none';
    if (app) { c.pImg.src = APPS[app].logo; c.pImg.dataset.app = app; }
    c.pLabel.textContent = app ? APPS[app].name : 'superbot';
    c.lastApp = app;
  }
  const pop = at < 0 ? 1 : 1 + 0.08 * bump(seg(t, at, at + 0.3));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the in-thread chip: shimmering with a spinner until its zoom resolves it; hidden while its big twin flies
function renderSwitch(b, t) {
  const k = b.k;
  const done = t >= k.done;
  b.sw.classList.toggle('qc-done', done);
  b.sw.style.setProperty('--sh', `${(100 - ((t - k.chip) * 150) % 200).toFixed(1)}%`);
  b.spin.style.opacity = done ? '0' : '1';
  b.spin.style.transform = `rotate(${((t - k.chip) * 420).toFixed(1)}deg)`;
  b.ok.style.opacity = done ? '1' : '0';
  b.ok.style.transform = 'none';
  b.sw.style.visibility = t >= k.z0 && t < k.z1 ? 'hidden' : 'visible';
  const tp = outBack(seg(t, k.chip + 0.02, k.chip + 0.3));
  b.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.24)));
  }
  c.inner.style.transform = `translateY(${(viewH - 10 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  rise(c.u, t, SEND + 0.06, 0.26, 12);
  c.beats.forEach((b) => {
    rise(b.w, t, b.k.chip, 0.22, 10);
    renderSwitch(b, t);
    rise(b.r, t, b.k.reply, 0.26, 8);
    b.inst.render(t);
  });
  renderScroll(c, t);
}
