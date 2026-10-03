// The one-ask chat. The ask ("Get my new single ready and put it out on my Bandcamp") is typed into the composer box
// with its two files attached (last-bus-home.wav, cover.jpg: static labels), and when the last character lands the
// ask moves into the thread as the user's message by itself (no send press, no send button: the box fades as the
// message rises, and no composer is on screen again). superbot then hands the job from model to model: Gemini,
// Claude Opus 5.5, GPT-6 Astra, then the user's own Bandcamp account. Every hand-off is ONE switch pill (the real
// hub's "Switching to X" pill: logo tile, label, spinner that resolves to a green check). In the zoom cut (default)
// every pill is the moment the camera pushes in on (scenes/tabs.js reads CAMERA below); in the nozoom cut
// (?cut=nozoom, cut.js) the camera never moves and each reply starts GAP after its pill's check. The routed model
// answers with its own beat: listen.js (Gemini listens to the single), page.js (Opus writes the release page: About,
// Credits, Tags, Lyrics, stacked in one card), files.js (Astra gets the files ready) and bandcamp.js (the account
// connects, status rows tick in, and the Bandcamp track page opens inside a superbot frame where the single goes
// live). No pointer, no buttons, no clocks: policy (X deceptive content) for both ratios.
// The thread is bottom-anchored so every message rises from the foot of the thread. renderChat(c, t) is a pure
// function of the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, streamCount } from '../../lib.js';
import { ZOOM } from './cut.js?v=cd0a8aa3';
import { REL } from './beats/rel.js?v=cd0a8aa3';
import { lc } from './beats/lucide-icons.js?v=cd0a8aa3';
import listen from './beats/listen.js?v=cd0a8aa3';
import page from './beats/page.js?v=cd0a8aa3';
import files from './beats/files.js?v=cd0a8aa3';
import bandcamp from './beats/bandcamp.js?v=cd0a8aa3';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;

// ---------- the clock of the chat (scene-local seconds) ----------
export const CHAT_T0 = 0.35;         // the hub has faded up from black; the ask starts typing
export const TYPE_CPS = 50; /* deliberate */ // a typewriter: one character every 0.02 s (character k lands at CHAT_T0 + k/50)
const SEND = 0.17;                   // last character to the hand-off into the thread
const FIRST_PILL = 0.2;              // hand-off to the first pill landing
// the schedule is content-driven: each beat's times(r).end is its last visible change, and the next thing (the next
// pill, or the next beat under the same pill) starts GAP after it
export const GAP = 0.2; /* deliberate */
// the camera move on every pill (scenes/tabs.js owns the move itself; these are its marks)
export const PUSH = 0.5; /* deliberate */ // push-in onto the pill, outQuint
export const HOLD = 1.0; /* deliberate */ // parked on the pill: label still and fully legible
export const PULL = 0.5; /* deliberate */ // pull back to the thread, inOutCubic, while the reply starts
const CHECK = 0.45; /* deliberate */ // after the push lands, the spinner resolves to the check
const REPLY = 0.05;                  // pull-back start to the model's reply line
const APPEAR = 0.3;                  // a message rising into the thread
export const BOX_IN = 0.12;          // the composer box fading up under the first characters
export const BOX_OUT = 0.22;         // ...and out as the ask moves into the thread

// the one ask the whole spot is about, and the two files it carries
export const ASK = 'Get my new single ready and put it out on my Bandcamp';
const ATTACH = [['file-audio', REL.file], ['image', REL.cover]];

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT-6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  bandcamp: { name: 'Bandcamp', logo: brand('bandcamp-mark.svg'), sub: 'your account' },
};

// the switch pill superbot lands when it hands the job to an app
const CHIP = {
  gemini: 'Switching to Gemini',
  opus: 'Switching to Claude Opus 5.5',
  astra: 'Switching to GPT-6 Astra',
  bandcamp: 'Connecting to Bandcamp',
};

const step = (app, mods, opts = {}) => ({ app, mods, opts, label: CHIP[app] });
export const ROUTE = [
  step('gemini', [listen]),
  step('opus', [page]),
  step('astra', [files]),
  step('bandcamp', [bandcamp]),
];

function timeBeats(route) {
  const typeEnd = CHAT_T0 + ASK.length / TYPE_CPS; // the last character lands
  const send = typeEnd + SEND;
  const first = send + FIRST_PILL;
  let prevEnd = null;
  return route.map((a, i) => {
    const k = { app: a.app, opts: a.opts, label: a.label };
    if (i === 0) Object.assign(k, { ask: ASK, s: CHAT_T0, typeEnd, send });
    k.sw = prevEnd === null ? first : prevEnd + GAP; // the pill lands
    k.done = k.sw + PUSH + CHECK;     // spinner -> check
    let end;
    if (ZOOM) {
      k.landed = k.sw + PUSH;
      k.pull = k.landed + HOLD;
      k.back = k.pull + PULL;
      k.reply = k.pull + REPLY;
      end = k.back;
    } else {
      k.reply = k.done + GAP;
      end = k.reply;
    }
    let r = k.reply;
    const opts = { ...a.opts, zoom: ZOOM };
    k.parts = a.mods.map((mod) => {
      const T = mod.times(r, opts);
      end = Math.max(end, T.end);
      r = (Number.isFinite(T.next) ? T.next : T.end) + GAP;
      return { mod, T };
    });
    k.end = end;
    prevEnd = end;
    return { k };
  });
}
export const BEATS = timeBeats(ROUTE);
export const CHAT_END = BEATS[BEATS.length - 1].k.end;
export const CAMERA = ZOOM ? BEATS.map(({ k }) => ({ sw: k.sw, landed: k.landed, pull: k.pull, back: k.back, node: null })) : [];
export const FOCUS = BEATS.flatMap(({ k }) => k.parts.filter(({ T }) => T.focus).map(({ T }) => ({ ...T.focus, T, fill: 0.9, node: null })));

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const chips = (cls) => ATTACH.map(([ic, name]) => `<span class="qc-att ${cls}"><i class="qc-att-ic">${lc(ic)}</i><b>${esc(name)}</b></span>`).join('');

export function mountChat(hub) {
  const root = hub.closest('.sbsite').parentNode;
  const sbSrc = hub.dataset.sb;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${APPS[app].logo}" alt=""/></span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const img = (f) => new URL('../../img/' + f, import.meta.url).href;
  const ctx = { hub, root, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }, i) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">N</span><div class="m-main"><div class="m-text">${esc(k.ask)}</div><span class="qc-atts">${chips('')}</span></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(k.app)}<span class="qc-swl">${esc(k.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
    const sw = { w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    if (CAMERA[i]) CAMERA[i].node = sw.sw;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const insts = k.parts.map(({ mod, T }) => {
      const inst = mod.build({ ...k, T }, ctx);
      inst.nodes.forEach((n) => main.appendChild(n));
      if (inst.focus) { const f = FOCUS.find((m) => m.T === T); if (f) f.node = inst.focus; }
      return inst;
    });
    return { k, u, sw, r, who: main.firstElementChild, insts };
  };
  const beats = BEATS.map(build);
  const scroll = beats.flatMap((b) => [
    ...(b.u ? [[b.k.send, b.u]] : []),
    [b.k.sw, b.sw.w],
    [b.k.reply, b.who],
    ...b.insts.flatMap((inst) => inst.marks),
  ]).sort((x, y) => x[0] - y[0]);

  // the composer box: the two file labels over the line being typed (no placeholder, no controls)
  const composer = hub.querySelector('.composer');
  composer.querySelector('.rc-att').innerHTML = chips('qc-att-in');
  const ph = composer.querySelector('.rc-ph');
  return { hub, root, feed, inner, beats, scroll, composer, ph, lastPh: null };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + APPEAR));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

// the composer box exists only while the ask is typed: it fades up with the first character (never empty, never a
// placeholder) and fades out as the finished ask moves up into the thread. scenes/tabs.js moves the box itself.
export function composerOpacity(k, t) {
  const n = streamCount(k.ask, k.s, TYPE_CPS, t);
  if (n <= 0) return 0;
  return seg(t, k.s, k.s + BOX_IN) * (1 - seg(t, k.send - 0.04, k.send + BOX_OUT));
}

function renderComposer(c, t) {
  const k = c.beats[0].k;
  const n = streamCount(k.ask, k.s, TYPE_CPS, t);
  const typing = t < k.send;
  const ph = n <= 0 ? '' : `<span class="qc-typed">${esc(k.ask.slice(0, n))}</span>${typing ? '<i class="qc-caret"></i>' : ''}`;
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  const o = composerOpacity(k, t);
  c.composer.style.opacity = o.toFixed(3);
  c.composer.style.visibility = o > 0 ? 'visible' : 'hidden';
}

function renderSwitch(s, k, t) {
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = outCubic(seg(t, k.done, k.done + 0.2));
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
  const tp = outCubic(seg(t, k.sw + 0.05, k.sw + 0.3));
  s.sw.firstElementChild.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.3)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send, 26);
    appear(b.sw.w, t, b.k.sw);
    renderSwitch(b.sw, b.k, t);
    appear(b.r, t, b.k.reply);
    b.insts.forEach((inst) => inst.render(t));
  });
  renderScroll(c, t);
}

export function renderChatAfter(c, t) {
  if (!c) return;
  c.beats.forEach((b) => b.insts.forEach((inst) => inst.after && inst.after(t)));
}
