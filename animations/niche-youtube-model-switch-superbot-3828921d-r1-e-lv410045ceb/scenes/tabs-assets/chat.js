// The one-ask chat, cut to a sub-7s X spot (r1-e). Frame 0 already holds the ask, fully typed in the composer
// ("Answer the top comments on my latest video and pin the best one"), so the first frame works as a still; it is
// sent at SEND_AT and superbot hands the job from model to model in quick succession: Gemini, GPT-6 Astra, Claude
// Opus 5.5, then YouTube Studio itself. Every hand-off is ONE switch pill (the real hub's "Switching to X" pill: logo
// tile, label, spinner that resolves to a green check) followed by the routed model's reply row and its one line
// (the reference's own lines, shortened). The camera never pushes on a pill here (scenes/tabs.js frames the thread at a
// phone-readable scale); the thread is bottom-anchored so every message rises out of the composer. The last step
// (beats/studio.js) opens the live YouTube Studio window to the full frame, where the replies post and Priya's comment
// is pinned. renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, streamCount } from '../../lib.js';
import studio from './beats/studio.js?v=r1e1';
import { TOP } from './beats/watch.js?v=r1e1';
import { ms } from './beats/yt-icons.js?v=r1e1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds; the scene starts the spot at 0) ----------
export const SEND_AT = 0.26;         // the still reads (the caret blinks, the send button is pressed), then it is sent
const PRESS = 0.16;                  // the send button's press, ending on the send
export const CUT = 0.04;             // the send to the cut from the still to the thread (the ask's bubble already in place)
const FIRST_PILL = 0.16;             // send to the first pill landing
const CHECK = 0.24;                  // a pill landing to its spinner resolving to the check
const REPLY = 0.26;                  // a pill landing to the model's reply row
const SAY_AT = 0.04;                 // the reply row to its line's first character
const SAY_CPS = 280;                 // the reply line streams at this many characters a second
const NEXT = 0.08;                   // a step's last change to the next pill
const EXTRA_IN = 0.18;               // a step's result (the reference's footer / verdict tag) rising in once its line is typed
const APPEAR = 0.24;                 // a message rising out of the composer
const BUBBLE_AT = CUT;               // the ask's bubble is in place from the cut's first frame
const CLEAR = 0.12;                  // on send the composer's text fades out, then its placeholder fades back
const GLIDE = 0.34;                  // the thread's scroll to each new line
const LEAD = 0.14;                   // the thread scrolls this long BEFORE a new line lands, so it never rises from behind the composer

// the one ask the whole spot is about
export const ASK = 'Answer the top comments on my latest video and pin the best one';

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  studio: { name: 'YouTube Studio', logo: brand('youtube-icon.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the switch pill superbot lands when it hands the job to an app (labels exact, per the reference)
const CHIP = {
  gemini: 'Switching to Gemini',
  astra: 'Switching to GPT-6 Astra',
  opus: 'Switching to Claude Opus 5.5',
  studio: 'Connecting to YouTube Studio',
};

// a model's one line, streamed under its reply row (the reference's lines: watch.js, frame.js, replies.js), and
// optionally the result its card ends on in the reference (watch.js's footer, frame.js's verdict tag), rising in once
// the line is typed: one tiny visual per beat, so each switch shows its work
const sayBeat = (SAY, extra = null) => ({
  times(r) {
    const T = { r, s0: r + SAY_AT };
    T.xt = T.s0 + SAY.length / SAY_CPS;
    T.end = extra ? T.xt + EXTRA_IN : T.xt;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const xn = extra ? x.el(extra(x)) : null;
    let shown = -1;
    return {
      nodes: xn ? [say, xn] : [say],
      marks: xn ? [[T.r, say], [T.xt, xn]] : [[T.r, say]],
      render(t) {
        const n = streamCount(SAY, T.s0, SAY_CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        if (xn) {
          const p = outCubic(seg(t, T.xt, T.xt + EXTRA_IN));
          xn.style.opacity = p.toFixed(3);
          xn.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
        }
      },
    };
  },
});
// the reference's own result lines (watch.js DONE, frame.js VERDICT), in their own components
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const THUMB = ms('thumb-up-outline');
const geminiDone = (x) => `<div class="wv-card qc-wv"><div class="wv-list">${TOP.slice(0, 2).map(([name, text, likes, tag, c], i) => `<div class="wv-row" style="opacity:1"><span class="wv-rk">${i + 1}</span><span class="wv-av" style="--c: ${c}">${x.esc(name[0])}</span>
  <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-lk">${THUMB}${likes}</span><span class="wv-tag">${x.esc(tag)}</span></span><span class="wv-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
  <div class="wv-ft" style="opacity:1">${x.OK}<span>Top 5 of 1,284 comments ranked by likes and repeats</span></div></div>`;
const astraVerdict = (x) => `<span class="fr-verdict">${TICK}Low-profile boom arm, mic mounted underneath</span>`;

const step = (app, mods) => ({ app, mods, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [sayBeat('Watched the whole video and read all 1,284 comments.', geminiDone)]),
  step('astra', [sayBeat('Read the frame at 4:38 that Lena asked about.', astraVerdict)]),
  step('opus', [sayBeat('Wrote all five replies in your voice and picked the one to pin.')]),
  step('studio', [studio]),
];

// every step's clock: the first pill lands FIRST_PILL after the send, every later pill NEXT after the previous step's
// last visible change; the check lands CHECK after its pill, the reply row REPLY after it
function timeBeats(route) {
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { app: a.app, label: a.label };
    if (i === 0) Object.assign(k, { ask: ASK, s: 0, send: SEND_AT });
    k.sw = prevEnd === null ? SEND_AT + FIRST_PILL : prevEnd + NEXT;
    k.done = k.sw + CHECK;
    k.reply = k.sw + REPLY;
    let end = k.reply, r = k.reply;
    k.parts = a.mods.map((mod) => {
      const T = mod.times(r);
      end = Math.max(end, T.end);
      r = T.end + NEXT;
      return { mod, T };
    });
    k.end = end;
    prevEnd = end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;

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
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      return inst;
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send + BUBBLE_AT, b.u]] : []),
    [b.k.sw, b.sw.w],
    [b.k.reply, b.who],
    ...b.insts.flatMap((inst) => inst.marks),
  ]).map(([a, n, d]) => [a - LEAD, n, d]).sort((x, y) => x[0] - y[0]);

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

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, feed, inner, beats, scroll,
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: null,
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + APPEAR));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

// frame 0 holds the whole ask in the composer (the caret blinking after it) until the send; then the text fades out
// (CLEAR) and the placeholder fades back
function renderComposer(c, t) {
  const b = c.beats[0];
  const at = b.k.send;
  const typed = t < at + CLEAR;
  const caretOn = t >= at || Math.floor(t / 0.2) % 2 === 0;
  const ph = typed ? `<span class="qc-typed">${esc(b.k.ask)}</span><i class="qc-caret"${caretOn && t < at ? '' : ' style="opacity:0"'}></i>` : esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; c.ph.classList.toggle('qc-full', typed); }
  c.ph.style.opacity = (typed ? 1 - seg(t, at, at + CLEAR) : seg(t, at + CLEAR, at + 2 * CLEAR)).toFixed(3);
  c.send.classList.toggle('qc-on', t < at + CLEAR);
  // the send press: a short dip ending on the send, no overshoot
  const dip = t < at - PRESS ? 0 : Math.sin((Math.PI / 2) * seg(t, at - PRESS, at));
  c.send.style.transform = dip ? `scale(${(1 - 0.22 * dip).toFixed(4)})` : 'none';
  c.send.style.filter = dip ? `brightness(${(1 - 0.35 * dip).toFixed(3)})` : '';
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
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * Math.sin(Math.PI * seg(t, swap - 0.12, swap + 0.12))).toFixed(3);
}

// the pill: lands with its tile, the spinner turns, and resolves to the green check. The label never moves.
function renderSwitch(s, k, t) {
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = outCubic(seg(t, k.done, k.done + 0.18));
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
  const tp = outCubic(seg(t, k.sw + 0.03, k.sw + 0.24));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer. The thread starts empty,
  // so the sent ask lands straight in its place (no glide up from under the composer)
  let y = c.scroll.length ? bottom(c.scroll[0][1]) : 0;
  for (const [a, n, d = GLIDE] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + d)));
  }
  c.inner.style.transform = `translateY(${(viewH - 16 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) { const on = t >= b.k.send + BUBBLE_AT; b.u.style.opacity = on ? '1' : '0'; b.u.style.transform = 'none'; }
    appear(b.sw.w, t, b.k.sw);
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
