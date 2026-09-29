// The one-ask thread: "Do my job for me" is typed into the composer and sent, superbot answers in place
// (variant.js say) and then signs in to Microsoft 365 in a single reply beat (./beats/signin.js) whose card the camera
// dives into, handing the frame to the Word desk (./word.js). Nothing routes anywhere: the composer's
// model chip reads "superbot" the whole time. The thread is bottom-anchored so every part rises out of the
// composer. renderChat(c, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, inOutCubic, esc, boxIn, streamCount } from '../../lib.js';
import V from '../../variant.js';
import signin from './beats/signin.js?v=1';

export const CHAT_T0 = 1.0;  // the empty state has settled; the ask starts typing
const STEPS = [signin];
const PRE = 0.35;            // the answer line finishes streaming a beat before the chip lands
const TAIL = 0.0;            // the signin beat's own end is the last thing the chat shows

const ASK = V.ask;
const SAY = V.say;

// one ask, one reply; the beat's clock is laid off the reply
export const BEATS = (() => {
  const s = CHAT_T0;
  const typeEnd = s + Math.min(0.55, 0.15 + ASK.length * 0.006);
  const send = typeEnd + 0.1;
  const reply = send + 0.22;
  const steps = STEPS.map((m) => {
    const r = reply + PRE;
    return { m, r, T: m.times(r) };
  });
  const end = steps[steps.length - 1].T.end + TAIL;
  return [{ k: { ask: ASK, s, typeEnd, send, reply, steps, T: { end } } }];
})();
const K = BEATS[BEATS.length - 1].k;
export const CHAT_END = K.T.end;          // the chat copy has landed by here
export const CHAT_ZOOM = K.T.zoomEnd;     // the camera's dive into the card finishes here

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

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
  const asset = (name) => new URL(`../../img/${name === 'logo' ? 'microsoft-logo.svg' : name === 'word' ? 'word-logo.svg' : name}`, import.meta.url).href;
  const ctx = { hub, box, esc, el, sbSrc, root, asset };

  const k = K;
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
  const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"></div></div>`);
  const main = r.querySelector('.m-main');
  const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
  main.appendChild(say);
  const steps = k.steps.map((s) => {
    const inst = s.m.build(ctx, s.T);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { ...s, inst, focus: inst.focus };
  });

  // scroll marks: after each marker the feed's fold glides to that element's bottom
  const marks = [[k.send, u], [k.reply, r], [k.reply + 0.02, say], ...steps.flatMap((s) => s.inst.marks)].sort((a, b) => a[0] - b[0]);

  // the composer's model chip: superbot, start to finish
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el(`<span class="qc-pi"><img alt="" src="${sbSrc}" data-app="superbot"/></span>`);
  if (cat) cat.replaceWith(pIcon); else plat.prepend(pIcon);
  [...plat.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => n.remove());
  plat.insertBefore(el('<span class="qc-pl">superbot</span>'), pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, feed, inner, steps, say, marks, ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null,
    focus: steps.map((s) => s.focus).find(Boolean) || null,
  };
}

function appear(n, t, a, dy = 12) {
  const p = outCubic(seg(t, a, a + 0.45));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const k = K;
  const typing = t >= k.s && t < k.send;
  let ph;
  if (typing) {
    const n = Math.round(k.ask.length * seg(t, k.s, k.typeEnd));
    ph = `<span class="qc-typed">${esc(k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', typing);
  const at = t >= k.send - 0.12 && t < k.send + 0.2 ? k.send : undefined;
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * Math.sin(Math.PI * seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.marks) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.55)));
  }
  c.inner.style.transform = `translateY(${(viewH - 10 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  const k = K;
  const u = c.inner.querySelector('.qc-u');
  const r = c.inner.querySelector('.qc-m');
  appear(u, t, k.send);
  appear(r, t, k.reply);
  // the answer line, streamed from the reply time
  const n = streamCount(SAY, k.reply + 0.05, 90, t);
  const vis = c.say.firstElementChild, hid = c.say.lastElementChild;
  if (vis.textContent.length !== n) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); }
  c.steps.forEach((s) => s.inst.render(t));
  renderScroll(c, t);
}