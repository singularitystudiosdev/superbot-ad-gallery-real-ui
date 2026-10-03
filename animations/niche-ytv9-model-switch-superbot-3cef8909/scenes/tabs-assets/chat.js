// The one-ask chat, ytv9 cut (14.0 s spot, pinned reply first). The spot OPENS on the finished result (studio.js: the
// pinned Studio thread in superbot's frame, complete on frame 0, held to OPEN_END), which scales out into this thread
// by OPEN_OUT. The ask ("Answer the top comments on my latest video and pin the best one") is already SENT: its bubble
// rose in under the result, there is no typing. Then superbot hands the job from model to model, FAST: Gemini, GPT-6
// Astra, Claude Opus 5.5, then YouTube Studio itself, one switch pill each (the real hub's "Switching to X" pill: logo
// tile, label, spinner that resolves to a green check) landing at SW. On every pill the camera pushes in (PUSH 0.25 s,
// outQuint), parks so the model name reads, and pulls back while the model's work starts (scenes/tabs.js owns the move;
// CAMERA below are its marks). Each model's work is a GLIMPSE of the base's beat: watch.js (Gemini watches the video and
// ranks the top comments), frame.js (GPT-6 Astra reads the 4:38 frame Lena asked about) and replies.js (Opus drafts
// the replies in the creator's voice) are played fast-forward (warp below) so each lands on its finished state before
// the next pill; studio.js (posts the replies, pins Priya's comment) is retimed in its own file and lands on the SAME
// close-up frame the spot opened on.
// Policy guard (X Ads deceptive content): no typing, no pointer or tap, and the composer is an empty bar with no
// controls (chat.css: no send, attach, tools, SUPER, computer, mic or picker chevron); the model chip names the model.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time (= spot seconds: the tabs scene starts the spot). ?v= on the imports busts GitHub Pages'
// 10-minute module cache on republish.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn } from '../../lib.js';
import { ZOOM } from './cut.js?v=3cef8909';
import watch from './beats/watch.js?v=3cef8909';
import frame from './beats/frame.js?v=3cef8909';
import replies from './beats/replies.js?v=3cef8909';
import studio from './beats/studio.js?v=3cef8909';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds = spot seconds) ----------
export const OPEN_END = 2.8;          // the pinned result holds from frame 0...
export const OPEN_OUT = 3.05;         // ...and has scaled out into the thread by here
const SEND_AT = 2.3;                  // the ask's bubble rises in (under the result, so the thread is set at OPEN_END)
export const SW = [4.25, 5.9, 7.55, 9.15]; /* deliberate */ // the four pills land (the chimes)
export const PUSH = 0.25; /* deliberate */ // push-in onto the pill, outQuint (the fast zoom cut)
export const PULL = 0.3; /* deliberate */  // pull back to the thread, inOutCubic, while the work starts
const CHECK = 0.2;                    // the push landed to the spinner resolving to the check
const REPLY = 0.05;                   // pull-back start to the model's reply line
const APPEAR = 0.3;                   // a message rising out of the composer
// a glimpse plays its beat fast-forward over this share of the time to the next pill, easing out into the finished
// state, which then holds while the next pill lands
const FILL = 0.72;

// the one ask the whole spot is about
export const ASK = 'Answer the top comments on my latest video and pin the best one';

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the switch pill superbot lands when it hands the job to an app (labels exact, as the base)
const CHIP = {
  gemini: 'Switching to Gemini',
  astra: 'Switching to GPT-6 Astra',
  opus: 'Switching to Claude Opus 5.5',
  studio: 'Connecting to YouTube Studio',
};

// one hand-off: the app that answers, its pill, how long the camera parks on it, and the beat it plays
const step = (app, mods, hold, opts = {}) => ({ app, mods, hold, opts, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [watch], 0.55),
  step('astra', [frame], 0.55),
  step('opus', [replies], 0.55),
  step('studio', [studio], 0.4, { open: [OPEN_END, OPEN_OUT] }),
];

// the glimpse clock: beat time for spot time t (g = { r, G, D }: the reply start, the time to the next pill, the
// beat's own length); and its inverse, for the scroll marks
const warp = (g, t) => {
  if (!g || t <= g.r) return t;
  const u = Math.min(1, (t - g.r) / (g.G * FILL));
  return g.r + g.D * (1 - (1 - u) * (1 - u));
};
const unwarp = (g, m) => {
  if (!g || m <= g.r) return m;
  const w = Math.min(1, (m - g.r) / g.D);
  return g.r + g.G * FILL * (1 - Math.sqrt(1 - w));
};

// every step's clock: the pill lands at SW[i], the camera parks PUSH later and the check lands CHECK after that, the
// camera pulls back after the step's hold and the reply starts with it. The beats' own pushes are off (zoom: false).
function timeBeats(route) {
  return route.map((a, i) => {
    const k = { app: a.app, opts: a.opts, label: a.label };
    if (i === 0) Object.assign(k, { ask: ASK, send: SEND_AT });
    k.sw = SW[i];
    k.landed = k.sw + PUSH;
    k.done = k.landed + CHECK;
    k.pull = k.landed + a.hold;
    k.back = k.pull + PULL;
    k.reply = k.pull + REPLY;
    const opts = { ...a.opts, zoom: false };
    k.parts = a.mods.map((mod) => ({ mod, T: mod.times(k.reply, opts) }));
    const last = k.parts[k.parts.length - 1].T.end;
    const next = SW[i + 1];
    k.glimpse = next === undefined ? null : { r: k.reply, G: next - k.reply, D: last - k.reply };
    k.end = next === undefined ? Math.max(k.back, last) : next;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;
// the marks scenes/tabs.js drives the camera from (the nodes are filled in by mountChat); none in nozoom. First the ask:
// the camera settles on the sent bubble under the result (so the thread is framed on it when the result scales out)
// and leaves it as the first pill lands; then one per pill.
const PILL_CAM = BEATS.map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null }));
const ASK_CAM = { sw: SEND_AT + 0.1, landed: SEND_AT + 0.45, pull: SW[0], back: SW[0] + PULL, node: null };
export const CAMERA = ZOOM ? [ASK_CAM, ...PILL_CAM] : [];
// beat-level camera moves (the base's Opus panel push): none in this cut
export const FOCUS = [];
// the renderer reads the chimes from here: one on each pill landing
window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chimes: BEATS.map(({ k }) => k.sw) });

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // any full-frame layer lives in the scene's root (the section's px)
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
  const ctx = { hub, root, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }, i) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    if (ZOOM) PILL_CAM[i].node = sw.sw;
    if (ZOOM && u) ASK_CAM.node = u.querySelector('.m-text') || u;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const g = k.glimpse;
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      if (!g) return inst;
      // a glimpse: the beat draws its own time, fast-forwarded
      return {
        render: (t) => inst.render(warp(g, t)),
        after: inst.after ? (t) => inst.after(warp(g, t)) : null,
        marks: inst.marks.map(([m, n]) => [unwarp(g, m), n]),
      };
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    [b.k.sw, b.sw.w],
    [b.k.reply, b.who],
    ...b.insts.flatMap((inst) => inst.marks),
  ]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" data-app="superbot"/>');
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  return { hub, root, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, lastApp: null };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + APPEAR));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderRouting(c, t) {
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.done) { app = k.app; swap = k.done; } });
  // the platform chip follows the active model: it dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * Math.sin(Math.PI * seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
}

// the pill: pops in with its tile, the spinner turns while the camera pushes in, and resolves to the green check while
// the camera holds. The label never moves or changes once the pill has landed.
function renderSwitch(s, k, t) {
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = outCubic(seg(t, k.done, k.done + 0.2));
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
  const tp = outCubic(seg(t, k.sw, k.sw + 0.2));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
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
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.25)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    appear(b.sw.w, t, b.k.sw, 6);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderScroll(c, t);
}

// after the camera has been set for this frame: beats that measure the screen (studio.js's full-frame layer) draw here
export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
