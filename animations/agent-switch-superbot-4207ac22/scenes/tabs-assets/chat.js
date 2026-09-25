// agent-switch: the landed hub's chat. Sam opens Claude on the rail, says hello, runs Claude out of usage
// (the desktop's own vendor-gate copy), presses Switch to ChatGPT and the SAME thread re-skins to ChatGPT and
// answers. The timeline cuts to the "Context carries" card over [T.aEnd, T.bStart]; behind it the hub becomes
// the superbot thread, where Sam asks about ChatGPT's rules and superbot's Auto-optimize trims them.
// Everything is a pure function of t (scene-local seconds), like the rest of the spot.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';

const bump = (p) => Math.sin(Math.PI * clamp(p));
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export const CHAT_T0 = 7.75; // the hub has landed (tabs T.msg = 7.62); its welcome line is hidden (chat.css)
export const T = {
  sel: 8.35,                                  // the pointer presses Claude on the rail
  u1s: 8.72, u1e: 8.98, u1: 9.12,             // "Hello"
  r1: 9.42, r1txt: 9.88,                      // Claude thinks, then "Hi!"
  u2s: 10.35, u2e: 10.72, u2: 10.86,          // "How are you?"
  r2: 11.16, lim: 11.72,                      // Claude thinks, then the usage notice
  sw: 13.38,                                  // the pointer presses Switch to ChatGPT
  div: 13.95,                                 // "Switched from Claude" divider
  r2txt: 14.5, r2end: 15.35,                  // ChatGPT answers the same question
  aEnd: 16.6,                                 // window A ends: the "Context carries" card
  swap: 17.2,                                 // (behind the card) the hub becomes the superbot thread
  bStart: 18.9,                               // window B opens
  u3s: 19.3, u3e: 20.15, u3: 20.3,            // "Chat gpt is really slow, do I have any unneeded rules?"
  r3: 20.65, rd: 21.4,                        // superbot reads ChatGPT's rules
  say: 21.55, sayEnd: 22.15,
  card: 22.2,                                 // the Auto-optimize card
  opt: 23.78,                                 // the pointer presses Optimize
  done: 24.3,
  fin: 24.95, finEnd: 25.55,
};
export const CHAT_END = 26.6;
// the two stretches of this scene the timeline plays, either side of the "Context carries" card
export const CHAT_WINDOWS = [[0, T.aEnd], [T.bStart, CHAT_END + 0.2]];

const ACC = { sb: [134, 108, 246], claude: [217, 119, 87], gpt: [16, 163, 127] };
const RULES = [
  { f: 'pirate-voice.md', d: 'Reply like a pirate · never used', v: 'drop', k: 2.1 },
  { f: 'python2-style.mdc', d: 'Python 2 style guide · no Python 2 here', v: 'drop', k: 3.4 },
  { f: 'no-em-dashes copy.md', d: 'Duplicate of no-em-dashes.md', v: 'drop', k: 0.6 },
  { f: 'kyoto-trip-notes.md', d: 'Only needed in travel chats', v: 'demote', k: 4.8 },
];
const TOK0 = 14.2, TOK1 = +(TOK0 - RULES.reduce((s, r) => s + r.k, 0)).toFixed(1);

const ASK3 = 'Chat gpt is really slow, do I have any unneeded rules?';
const TYPED = [
  { s: T.u1s, e: T.u1e, send: T.u1, text: 'Hello' },
  { s: T.u2s, e: T.u2e, send: T.u2, text: 'How are you?' },
  { s: T.u3s, e: T.u3e, send: T.u3, text: ASK3 },
];

const words = (s) => s.split(' ').map((w) => `<span>${esc(w)} </span>`).join('');
const ICON = (sym) => `<svg><use href="#tbs-ic-${sym}"/></svg>`;
const agentTile = () => `<span class="qc-tile as-lay as-tile" data-set="agent"><span data-k="claude" class="as-tc">${ICON('claude')}</span><span data-k="gpt" class="as-tg">${ICON('openai')}</span></span>`;
const agentName = () => `<span class="as-lay" data-set="agent"><b data-k="claude">Claude</b><b data-k="gpt">ChatGPT</b></span>`;
const GAUGE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>';
const SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/></svg>';

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const feed = hub.querySelector('.feed');
  feed.classList.add('as-feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const wash = el('<div class="as-wash"></div>');
  feed.insertBefore(wash, inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };
  const user = (text) => add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(text)}</div></div></div>`);

  // ---- window A: the Claude thread that becomes a ChatGPT thread ----
  const u1 = user('Hello');
  const r1 = add(`<div class="msg qc-m qc-r as-a">${sbAvatar}<div class="m-main"><div class="qc-who">${agentTile()}${agentName()}</div><div class="qc-say"><i class="as-dots"><i></i><i></i><i></i></i>${words('Hi!')}</div></div></div>`);
  const u2 = user('How are you?');
  const dv = add(`<div class="as-col as-divw"><div><div class="as-div"><span class="as-div-l"></span><span class="as-div-c">${ICON('openai')}Switched from Claude · 3 messages carried over</span><span class="as-div-l"></span></div></div></div>`);
  const r2 = add(`<div class="msg qc-m qc-r as-a">${sbAvatar}<div class="m-main"><div class="qc-who">${agentTile()}${agentName()}</div>
    <div class="as-col as-limw"><div><div class="as-lim">
      <div class="as-lim-top"><span class="as-lim-ic">${GAUGE}</span><span class="as-lim-tx"><b>Claude is out of usage</b><small>Your 5 hour limit resets in 3 hours.</small></span></div>
      <div class="as-meter"><i></i></div>
      <div class="as-meter-l"><span>5-hour limit</span><span class="as-pct">100%</span></div>
      <div class="as-lim-act"><span class="as-btn"><span class="qc-tile as-tg">${ICON('openai')}</span>Switch to ChatGPT</span><span class="as-ghost">Wait 3h</span></div>
    </div></div></div>
    <div class="as-col as-r2w"><div><div class="qc-say"><i class="as-dots"><i></i><i></i><i></i></i>${words('Doing great, thanks for asking! Picking up right where we left off. What should we work on?')}</div></div></div>
  </div></div>`);

  // ---- window B: the superbot thread ----
  const u3 = user(ASK3);
  const rules = RULES.map((r, i) => `<div class="as-col as-rw" data-i="${i}"><div><div class="as-rrow">
      <span class="as-rf"><code>${esc(r.f)}</code><small>${esc(r.d)}</small></span>
      <span class="as-lay as-v"><span data-k="a" class="as-v-${r.v}">${r.v === 'drop' ? 'Drop' : 'Demote'}</span><span data-k="b" class="as-v-${r.v === 'drop' ? 'gone' : 'od'}">${r.v === 'drop' ? 'Dropped' : 'On demand'}</span></span>
      <span class="as-rk">${r.k.toFixed(1)}k</span><i class="as-strike"></i></div></div></div>`).join('');
  const r3 = add(`<div class="msg qc-m qc-r as-b">${sbAvatar}<div class="m-main">
    <div class="qc-who"><span class="qc-tile qc-t-superbot"><img src="${sbSrc}" alt=""/></span><b>superbot</b></div>
    <span class="qc-sw as-sw"><span class="qc-tile as-tg">${ICON('openai')}</span><span class="as-lay as-swt"><span data-k="a" class="qc-swl">Reading ChatGPT’s rules</span><span data-k="b">Read 9 rules · ${TOK0}k tokens</span></span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>
    <div class="qc-say as-say1">${words('Yes. 4 of the 9 rules ChatGPT loads on every turn aren’t pulling their weight:')}</div>
    <div class="as-rules">
      <div class="as-rh"><span class="as-rh-t">${SPARK}Auto-optimize · ChatGPT</span><span class="as-rh-n"><b class="as-tok">${TOK0}k</b> tokens / turn</span></div>
      ${rules}
      <div class="as-kept">+ 5 rules kept</div>
      <div class="as-rfoot"><span class="as-save">${(TOK0 - TOK1).toFixed(1)}k tokens saved, every turn</span>
        <span class="as-opt"><span class="as-lay as-opt-l"><span data-k="a">Optimize</span><span data-k="s"><i class="as-ospin"></i></span><span data-k="b">${OK}Optimized</span></span></span></div>
    </div>
    <div class="qc-say as-say2">${words(`Done. ChatGPT now starts every turn ${(TOK0 - TOK1).toFixed(1)}k tokens lighter.`)}</div>
  </div></div>`);

  // the composer's platform chip follows the agent: superbot's cat, Claude, ChatGPT (layered, crossfaded)
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el(`<span class="qc-pi as-lay" data-set="all"><span data-k="sb" class="as-pcat"></span><span data-k="claude" class="as-pc">${ICON('claude')}</span><span data-k="gpt" class="as-pg">${ICON('openai')}</span></span>`);
  cat.replaceWith(pIcon);
  pIcon.firstElementChild.appendChild(cat);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span class="as-lay" data-set="all"><span data-k="sb">${label ? esc(label.textContent.trim()) : 'superbot'}</span><span data-k="claude">claude</span><span data-k="gpt">chatgpt</span></span>`);
  if (label) label.replaceWith(pLabel); else plat.appendChild(pLabel);

  // the thread title in the chat head
  const head = hub.querySelector('.chat-head b');
  head.innerHTML = `<span class="as-lay as-ht" data-set="all"><span data-k="sb">${esc(head.textContent)}</span><span data-k="claude">Claude</span><span data-k="gpt">ChatGPT</span></span>`;

  const rail = hub.querySelector('.rail');
  const railItems = { sb: hub.querySelector('.rail-item.sb'), claude: rail.querySelector('.rail-item[data-app="claude"]'), gpt: rail.querySelector('.rail-item[data-app="openai"]') };
  const badge = el('<i class="as-rb"></i>');
  railItems.claude.appendChild(badge);

  const ph = hub.querySelector('.rc-ph');
  const q = (n, s) => n.querySelector(s);
  return {
    hub, pointer, feed, inner, wash, railItems, badge, ph, phText: ph.textContent, lastPh: null, send: hub.querySelector('.rc-send'),
    layers: [...hub.querySelectorAll('.as-lay[data-set]')],
    aRows: [u1, r1, u2, dv, r2], bRows: [u3, r3],
    u1, r1, u2, dv, r2, u3, r3,
    r1say: q(r1, '.qc-say'), limw: q(r2, '.as-limw'), lim: q(r2, '.as-lim'), meter: q(r2, '.as-meter i'), btn: q(r2, '.as-btn'),
    r2w: q(r2, '.as-r2w'), r2say: q(r2, '.as-r2w .qc-say'),
    sw: q(r3, '.as-sw'), swt: q(r3, '.as-swt'), spin: q(r3, '.as-sw .qc-spin'), ok: q(r3, '.as-sw .qc-st .qc-ok'),
    say1: q(r3, '.as-say1'), card: q(r3, '.as-rules'), rws: [...r3.querySelectorAll('.as-rw')], tok: q(r3, '.as-tok'),
    kept: q(r3, '.as-kept'), foot: q(r3, '.as-rfoot'), opt: q(r3, '.as-opt'), optL: q(r3, '.as-opt-l'), save: q(r3, '.as-save'), say2: q(r3, '.as-say2'),
    lastTok: null,
  };
}

// ---------- helpers ----------
function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}
// a collapsible block: grid-template-rows 0fr..1fr, eased
function open(n, p) {
  n.style.gridTemplateRows = `${clamp(p).toFixed(4)}fr`;
  n.style.opacity = clamp(p).toFixed(3);
}
// words revealed one by one (layout is reserved, so nothing reflows while it streams)
function stream(n, t, a, b) {
  const sp = n.querySelectorAll(':scope > span');
  const k = Math.ceil(sp.length * seg(t, a, b));
  sp.forEach((s, i) => s.classList.toggle('qc-hid', i >= k));
}
function dots(n, t, a, b) {
  const d = n.querySelector('.as-dots');
  const v = seg(t, a, a + 0.15) * (1 - seg(t, b - 0.1, b));
  d.style.opacity = v.toFixed(3);
  [...d.children].forEach((c, i) => { c.style.transform = `translateY(${(-2.2 * bump(((t - a) * 2.4 - i * 0.18) % 1)).toFixed(2)}px)`; });
}
function set(n, k, w) {
  [...n.children].forEach((c) => {
    const v = clamp(w[c.dataset.k] || 0);
    c.style.opacity = v.toFixed(3);
    c.style.transform = v >= 1 || v <= 0 ? 'none' : `scale(${lerp(0.94, 1, v).toFixed(4)})`;
    c.style.filter = v > 0.02 && v < 0.98 ? `blur(${((1 - v) * 2).toFixed(2)}px)` : 'none';
  });
}

// who the thread belongs to: superbot -> Claude (rail press) -> ChatGPT (the switch) -> superbot (behind the card)
function weights(t) {
  if (t >= T.swap) return { all: { sb: 1, claude: 0, gpt: 0 }, agent: { claude: 0, gpt: 1 } };
  const a = inOutCubic(seg(t, T.sel, T.sel + 0.5));
  const b = inOutCubic(seg(t, T.sw + 0.05, T.sw + 0.95));
  return { all: { sb: 1 - a, claude: a * (1 - b), gpt: a * b }, agent: { claude: 1 - b, gpt: b } };
}
const mix = (w) => [0, 1, 2].map((i) => Math.round(ACC.sb[i] * w.sb + ACC.claude[i] * w.claude + ACC.gpt[i] * w.gpt));

// the pointer's three presses
function pointers(c) {
  return [
    { n: c.railItems.claude, a: 7.8, at: 8.28, press: T.sel, gone: 8.95, dx: 300, dy: 40 },
    { n: c.btn, a: 12.45, at: 13.3, press: T.sw, gone: 13.95, dx: 170, dy: 120 },
    { n: c.opt, a: 22.95, at: 23.7, press: T.opt, gone: 24.35, dx: 180, dy: 130 },
  ];
}

// ---------- the frame ----------
function renderComposer(c, t, w) {
  const b = TYPED.find((k) => t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.text.length * seg(t, b.s, b.e));
    ph = `<span class="qc-typed">${esc(b.text.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else if (t >= T.swap || t < T.sel) ph = esc(c.phText);
  else if (t >= T.lim && t < T.sw + 0.3) ph = '<span class="as-phd">Claude is out of usage</span>';
  else ph = esc(w.all.gpt > 0.5 ? 'Message ChatGPT' : 'Reply to Claude…');
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = TYPED.map((k) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRail(c, t) {
  if (t < CHAT_T0) return;
  const cur = t < T.sel ? 'sb' : t < T.sw + 0.1 ? 'claude' : t < T.swap ? 'gpt' : 'sb';
  const since = cur === 'claude' ? T.sel : cur === 'gpt' ? T.sw + 0.1 : -9;
  Object.entries(c.railItems).forEach(([id, n]) => {
    n.classList.toggle('sel', id === cur);
    const s = id === cur ? 1 + 0.14 * bump(seg(t, since, since + 0.45)) : 1;
    n.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
  });
  const bv = seg(t, T.lim, T.lim + 0.3) * (t < T.swap ? 1 : 0);
  c.badge.style.opacity = bv.toFixed(3);
  c.badge.style.transform = `scale(${lerp(0.3, 1, outBack(bv)).toFixed(4)})`;
}

function renderA(c, t) {
  const inA = t < T.swap;
  c.aRows.forEach((n) => { n.style.display = inA ? '' : 'none'; });
  if (!inA) return;
  appear(c.u1, t, T.u1);
  appear(c.r1, t, T.r1);
  dots(c.r1say, t, T.r1, T.r1txt);
  stream(c.r1say, t, T.r1txt, T.r1txt + 0.12);
  appear(c.u2, t, T.u2);
  appear(c.r2, t, T.r2);
  // the usage notice opens, its meter tops out, then it folds away on the switch
  open(c.limw, outCubic(seg(t, T.lim, T.lim + 0.5)) * (1 - inOutCubic(seg(t, T.sw + 0.12, T.sw + 0.6))));
  const m = outCubic(seg(t, T.lim + 0.2, T.lim + 0.9));
  c.meter.style.width = `${lerp(78, 100, m).toFixed(2)}%`;
  c.btn.style.transform = `scale(${(1 - 0.07 * bump(seg(t, T.sw - 0.07, T.sw + 0.14))).toFixed(4)})`;
  c.btn.classList.toggle('as-hot', t >= T.sw - 0.5 && t < T.sw + 0.2);
  // Claude's dots before the notice; ChatGPT's answer after the switch
  const r2dotsA = t < T.lim ? [T.r2, T.lim] : [T.r2txt - 0.45, T.r2txt];
  open(c.r2w, t < T.lim ? 1 : outCubic(seg(t, T.r2txt - 0.5, T.r2txt - 0.1)));
  dots(c.r2say, t, r2dotsA[0], r2dotsA[1]);
  stream(c.r2say, t, T.r2txt, T.r2end);
  open(c.dv, outCubic(seg(t, T.div, T.div + 0.45)));
}

function renderB(c, t) {
  const inB = t >= T.swap;
  c.bRows.forEach((n) => { n.style.display = inB ? '' : 'none'; });
  if (!inB) return;
  appear(c.u3, t, T.u3);
  appear(c.r3, t, T.r3);
  // the read chip: shimmer, spin, check
  const done = t >= T.rd;
  c.sw.classList.toggle('qc-done', done);
  c.sw.style.setProperty('--sh', `${(100 - ((t - T.r3) * 140) % 200).toFixed(1)}%`);
  set(c.swt, null, { a: 1 - seg(t, T.rd - 0.1, T.rd + 0.15), b: seg(t, T.rd - 0.05, T.rd + 0.2) });
  c.spin.style.opacity = (1 - seg(t, T.rd - 0.08, T.rd + 0.06)).toFixed(3);
  c.spin.style.transform = `rotate(${((t - T.r3) * 420).toFixed(1)}deg)`;
  const o = seg(t, T.rd, T.rd + 0.3);
  c.ok.style.opacity = o.toFixed(3);
  c.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  // the answer and the card
  c.say1.style.opacity = seg(t, T.say - 0.05, T.say).toFixed(3);
  stream(c.say1, t, T.say, T.sayEnd);
  appear(c.card, t, T.card, 14);
  c.rws.forEach((n, i) => {
    const r = RULES[i];
    const inP = outCubic(seg(t, T.card + 0.12 + i * 0.09, T.card + 0.5 + i * 0.09));
    const row = n.querySelector('.as-rrow');
    row.style.opacity = inP.toFixed(3);
    row.style.transform = inP >= 1 ? 'none' : `translateX(${((1 - inP) * -10).toFixed(2)}px)`;
    const st = T.opt + 0.14 + i * 0.1;
    const strike = n.querySelector('.as-strike');
    set(n.querySelector('.as-v'), null, { a: 1 - seg(t, st, st + 0.2), b: seg(t, st + 0.05, st + 0.25) });
    if (r.v === 'drop') {
      strike.style.transform = `scaleX(${outCubic(seg(t, st, st + 0.3)).toFixed(4)})`;
      n.style.gridTemplateRows = `${(1 - inOutCubic(seg(t, T.done + 0.05 + i * 0.07, T.done + 0.5 + i * 0.07))).toFixed(4)}fr`;
      n.style.opacity = (1 - 0.55 * seg(t, st + 0.1, st + 0.35)).toFixed(3);
    } else {
      strike.style.transform = 'scaleX(0)';
      n.classList.toggle('as-od', t >= st + 0.1);
    }
  });
  appear(c.kept, t, T.card + 0.5, 6);
  appear(c.foot, t, T.card + 0.6, 6);
  // Optimize: pressed, spins, lands on Optimized; the token count falls as the rules go
  c.opt.style.transform = `scale(${(1 - 0.08 * bump(seg(t, T.opt - 0.07, T.opt + 0.14))).toFixed(4)})`;
  c.opt.classList.toggle('as-hot', t >= T.opt - 0.45 && t < T.opt + 0.1);
  c.opt.classList.toggle('as-ok', t >= T.done);
  set(c.optL, null, { a: 1 - seg(t, T.opt + 0.05, T.opt + 0.15), s: seg(t, T.opt + 0.08, T.opt + 0.18) * (1 - seg(t, T.done - 0.1, T.done)), b: seg(t, T.done - 0.05, T.done + 0.15) });
  const sp = c.optL.querySelector('.as-ospin');
  sp.style.transform = `rotate(${((t - T.opt) * 480).toFixed(1)}deg)`;
  const tok = lerp(TOK0, TOK1, inOutCubic(seg(t, T.opt + 0.15, T.done + 0.5))).toFixed(1) + 'k';
  if (tok !== c.lastTok) { c.tok.textContent = tok; c.lastTok = tok; }
  c.tok.classList.toggle('as-down', t >= T.opt + 0.15);
  c.save.classList.toggle('as-saved', t >= T.done);
  c.say2.style.opacity = seg(t, T.fin - 0.05, T.fin).toFixed(3);
  stream(c.say2, t, T.fin, T.finEnd);
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer
  const marks = t < T.swap
    ? [[T.u1, c.u1], [T.r1, c.r1], [T.u2, c.u2], [T.r2, c.r2]]
    : [[T.u3, c.u3], [T.r3, c.r3]];
  let y = 0;
  for (const [a, n] of marks) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  const w = weights(t);
  // the accent the thread wears (a tint wash, the send button, the caret) and every layered identity
  const [r, g, b] = mix(w.all);
  c.hub.style.setProperty('--as-acc', `${r} ${g} ${b}`);
  c.wash.style.opacity = (1 - w.all.sb).toFixed(3);
  c.layers.forEach((n) => set(n, null, w[n.dataset.set]));
  renderComposer(c, t, w);
  renderRail(c, t);
  renderA(c, t);
  renderB(c, t);
  renderScroll(c, t);
  const pt = pointers(c).find((p) => t >= p.a && t < p.gone);
  if (pt) {
    const bx = boxIn(pt.n, c.pointer.parentNode);
    const k = inOutCubic(seg(t, pt.a, pt.at));
    const x = lerp(bx.cx + pt.dx, bx.cx, k), y = lerp(bx.cy + pt.dy, bx.cy, k);
    const v = seg(t, pt.a, pt.a + 0.2) * (1 - seg(t, pt.gone - 0.25, pt.gone));
    placeCursor(c.pointer, x, y, bump(seg(t, pt.press - 0.07, pt.press + 0.14)), v);
  } else c.pointer.style.opacity = '0';
}
