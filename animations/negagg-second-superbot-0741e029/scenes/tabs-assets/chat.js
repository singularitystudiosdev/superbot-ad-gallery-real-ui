// negagg-second: one thread in the real superbot hub, three casual asks. ChatGPT plans four days in Lisbon (an
// itinerary with place photos and a budget bar); the user asks Claude too, superbot switches the SAME thread to
// Claude, which audits the budget line by line and finds what the plan missed; then it books the hotel for night
// one (tool steps ticking, a confirmation card with the hotel photo). Each routing change shows superbot's chip,
// each reply wears its model's mark, and the composer's model chip follows. Every reply is a concrete artifact
// (beats/*.js), nothing is an outline. No complaint, quote, count or error UI appears anywhere: the spot shows the
// solution. renderChat(c, t) is a pure function of the scene's local time. ?v= busts GitHub Pages' module cache.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import plan from './beats/plan.js?v=2';
import budget from './beats/budget.js?v=2';
import book from './beats/book.js?v=2';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.0; // the empty state has settled; the first ask starts typing

const APPS = {
  gpt: { name: 'ChatGPT', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  claude: { name: 'Claude', logo: brand('claude-logo.svg'), sub: 'in superbot' },
};
const START_APP = 'gpt'; // the composer's model chip before the first ask

// The story: three asks, each answered by a different model in the one thread. The first ask goes to the model the
// composer already wears (ChatGPT), so it has no routing chip; the other two are routed by superbot.
const BEATS_SPEC = [
  { app: 'gpt', mod: plan, chips: [], ask: 'plan 4 days in Lisbon for two, under $1,500' },
  { app: 'claude', mod: budget, chips: [['claude', 'Ask Claude too', { hold: true }], ['claude', 'Switching to Claude']], ask: 'double check the budget' },
  { app: 'claude', mod: book, chips: [], ask: 'book the hotel for night one' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.8, 0.15 + a.ask.length * 0.013);
    k.send = k.typeEnd + 0.15;
    k.sw = k.send + 0.3;   // superbot's routing chip lands
    // each chip lands, moves the model chip to its app (swap) and resolves (done)
    let at = k.sw;
    k.chips = a.chips.map(([app, label, o]) => { const hold = !!(o && o.hold); const c = { app, label, hold, sw: at, swap: at + 0.22, done: at + (hold ? 0.45 : 0.6) }; at = c.done + (hold ? 0.04 : 0.1); return c; });
    k.done = k.chips.length ? k.chips[k.chips.length - 1].done : k.send + 0.25;
    k.reply = k.done + 0.06;  // the model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BEATS_SPEC);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${APPS[app].logo ? `<img src="${APPS[app].logo}" alt=""/>` : SB_MARK}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const ctx = { hub, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip names the model, then follows the pick
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS[START_APP].logo}" data-app="${START_APP}"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS[START_APP].name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: START_APP,
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = START_APP, swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (!ch.hold && t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // the model chip dips as a routing chip swaps it, and comes back with a pop
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 0 : bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop > 0 ? `scale(${(1 + 0.08 * pop).toFixed(4)})` : 'none';
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it. While the thread is shorter than the feed it is CENTRED in the message area, so a short thread
  // never leaves a band of empty frame above or below it (the 4:5 lesson), until it overflows and scrolls.
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${Math.min((viewH - y) / 2, viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
}
