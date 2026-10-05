// The group-dinner chat (forked from every-model-one-chat's three-request chat): one ask with a screenshot of the
// "Fri crew" group chat attached, superbot routes it to Gemini (reads the screenshot into constraints, beats/read.js),
// to Perplexity Sonar (menus and reviews nearby, beats/search.js), to Claude Opus 5.5 (the pick and the group text,
// beats/pick.js), then switches itself to Superbot (OpenTable, Calendar, Messages, beats/book.js). The composer's
// model chip follows each switch. The thread is bottom-anchored
// so every message rises out of the composer. renderChat(c, t) is a pure function of the scene's local time.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn } from '../../lib.js';
import read from './beats/read.js?v=1';
import search from './beats/search.js?v=1';
import pick from './beats/pick.js?v=1';
import book from './beats/book.js?v=1';
import { ASK, SHOT } from './beats/dinner.js';
import { shotHTML } from './beats/shot.js';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

// the empty home shows for a beat with the screenshot already attached, then the ask types in (CHAT_T0 + LEAD)
export const CHAT_T0 = 0;
const LEAD = 0.3, TYPE = 1.45;

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  perplexity: { name: 'Perplexity Sonar', logo: brand('perplexity-logo.svg'), sub: 'in superbot' },
  claude: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

export { ASK };
const BASE = [
  { app: 'gemini', mod: read, chips: [['gemini', 'Switching to Gemini']], ask: ASK },
  { app: 'perplexity', mod: search, chips: [['perplexity', 'Switching to Perplexity Sonar']], ask: null },
  { app: 'claude', mod: pick, chips: [['claude', 'Switching to Claude Opus 5.5']], ask: null },
  { app: 'superbot', mod: book, chips: [['superbot', 'Switched to Superbot']], ask: null },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeAt = s + LEAD;
      k.typeEnd = k.typeAt + TYPE;
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.25;   // superbot's routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.12;        // superbot carries on without being asked
    }
    // each chip lands, moves the platform chip to its app (swap) and resolves (done)
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.14, done: at + 0.42 }; at = c.done + 0.1; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.06;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BASE);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  const root = hub.closest('.sbsite').parentNode;
  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    // the ask lands with the screenshot it was sent with; Gemini's scan sweeps it while it routes
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">Y</span><div class="m-main"><div class="m-head"><span class="m-name">you</span></div><div class="vr-uatt"><span class="eb-ph fc-uph">${shotHTML('fc-u')}<i class="eb-scan"></i></span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst, scans: u ? [...u.querySelectorAll('.eb-scan')] : [] };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  // the screenshot sits attached in the composer until the ask is sent
  const ph = hub.querySelector('.rc-ph');
  const att = el(`<div class="vr-att"><span class="vr-att-in"><span class="fc-thumb">${shotHTML('fc-t')}</span><span class="vr-att-t"><b>${esc(SHOT.file)}</b><small>${esc(SHOT.kind)}</small></span></span></div>`);
  ph.parentNode.insertBefore(att, ph);
  return {
    hub, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, att, attH: null,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.32));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.typeAt && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.typeAt, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
  // the attachment leaves with the ask: it fades and its row folds away
  if (c.attH === null) c.attH = c.att.offsetHeight;
  const send = c.beats[0].k.send;
  const g = inOutCubic(seg(t, send, send + 0.22));
  c.att.style.height = g <= 0 ? '' : `${(c.attH * (1 - g)).toFixed(2)}px`;
  c.att.style.opacity = (1 - seg(t, send - 0.02, send + 0.12)).toFixed(3);
}

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
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
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.35));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 200) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 520).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.25);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.03, k.sw + 0.35));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer. The fold only ever
  // moves down, so a mark landing on something higher up (a chip above a card that is already showing) holds it
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, Math.max(y, bottom(n)), inOutCubic(seg(t, a, a + 0.32)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.scans.forEach((sc, i) => {
      const a = b.k.sw + i * 0.08, p = seg(t, a, b.k.reply + 0.7);
      sc.style.opacity = (seg(p, 0, 0.12) * (1 - seg(p, 0.85, 1))).toFixed(3);
      sc.style.transform = `translateY(${lerp(-55, 55, p).toFixed(1)}%)`;
    });
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
}
