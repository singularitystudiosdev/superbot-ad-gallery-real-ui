// every model, one chat (smooth cut). One superbot chat, three asks, each routed to what is built for it:
//   "make me a Muse meme"            -> Nano Banana Pro (Gemini's image model, the one that letters text cleanly)
//   "find more Muse memes on Reddit" -> Perplexity (live web search) answering with Reddit's own post embeds
//   "Winning. Order me a burger."    -> Superbot Agent, ordering through the DoorDash connection
// The whole spot is a pure function of t: render(t) writes every moving value from the clock, so ?t= freezes,
// window.__AD.seek(t) scrubs and the offline render is frame exact. Motion uses the app's own curves
// (superbot-desktop tokens: --ease-standard, --ease-emphasized-decelerate) and only transform / opacity / size.

// ---------- easing ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, u = x;
    for (let i = 0; i < 40; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}
const E = {
  std: bezier(0.2, 0, 0, 1),        // --ease-standard
  dec: bezier(0.05, 0.7, 0.1, 1),   // --ease-emphasized-decelerate
  io: bezier(0.65, 0, 0.35, 1),     // moves that start and stop on screen
  acc: bezier(0.3, 0, 0.8, 0.15),   // --ease-emphasized-accelerate (exits)
  move: bezier(0.4, 0, 0.2, 1),     // layout moves: slots opening, the composer docking, the scroll they drive
};
const tw = (t, a, d, f = E.std) => f(seg(t, a, a + d));

// ---------- the script ----------
const S = 1.7;                       // the window is drawn at the app's own px and magnified whole
const WIN_H = 588, TB_H = 38, COMPOSER_H = 86, COMPOSER_BOTTOM = 14;
const FEED_H = WIN_H - TB_H - 104;
const HOME_TOP = 268, DOCK_TOP = WIN_H - COMPOSER_BOTTOM - COMPOSER_H;

const ASKS = [
  { text: 'make me a Muse meme', type: 0.95, cps: 17 },
  { text: 'find more Muse memes on Reddit', type: 6.95, cps: 23 },
  { text: 'Winning. Order me a burger.', type: 12.95, cps: 22 },
];
for (const a of ASKS) { a.typeEnd = a.type + (a.text.length - 1) / a.cps; a.send = a.typeEnd + 0.28; }
const [A1, A2, A3] = ASKS;

const ROUTES = [
  { at: A1.send + 0.75, logo: 'brand/gemini.svg', name: 'Nano Banana Pro', why: 'Gemini · best at images with text' },
  { at: A2.send + 0.5, logo: 'brand/perplexity.svg', name: 'Perplexity', why: 'best at live web search' },
  { at: A3.send + 0.5, mark: true, name: 'Superbot Agent', why: 'places orders in your apps', conn: 'DoorDash' },
];
for (const r of ROUTES) r.sw = r.at + 0.55;   // "Routing…" resolves into the pick

const G = { text: ROUTES[0].sw + 0.2, frame: ROUTES[0].sw + 0.32, reveal: ROUTES[0].sw + 1.85, acts: ROUTES[0].sw + 2.75 };
const P = { step: ROUTES[1].sw + 0.2, stepDone: ROUTES[1].sw + 0.75, text: ROUTES[1].sw + 0.85, cards: ROUTES[1].sw + 1.2, votes: ROUTES[1].sw + 1.6, foot: ROUTES[1].sw + 1.9 };
const D = { steps: [ROUTES[2].sw + 0.35, ROUTES[2].sw + 0.8, ROUTES[2].sw + 1.25], stepDur: 0.42, card: ROUTES[2].sw + 1.7 };
D.press = D.card + 1.1; D.track = D.press + 0.7; D.bar = D.track + 0.25; D.text = D.track + 0.55;
const TITLE_AT = G.reveal - 0.6;
const CHAT_END = D.text + 1.95;
const END_DUR = 4.4, DIP = 0.35;
const CYCLE = +(CHAT_END + END_DUR).toFixed(3);

const REDDIT = [
  { sub: 'r/me_irl', av: '#ff4500', age: '5h', title: 'me_irl', img: 'img/muse-meme-2.jpg', votes: [8940, 9412], com: [588, 612] },
  { sub: 'r/wholesomememes', av: '#46d160', age: '9h', title: 'Muse never forgets', img: 'img/muse-meme-3.jpg', votes: [6610, 7058], com: [402, 431] },
  { sub: 'r/memes', av: '#0079d3', age: '14h', title: 'Every app except one', img: 'img/muse-meme-4.jpg', votes: [5212, 5596], com: [287, 298] },
];

// ---------- icons (lucide, ISC; Reddit's vote / comment glyphs redrawn) ----------
const sv = (d, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${d}</svg>`;
const IC = {
  side: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  copy: '<rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  retry: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  thumb: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  rUp: '<path d="M12 3.6 4.4 11.8h4.8V20h5.6v-8.2h4.8Z"/>',
  rDown: '<path d="M12 20.4 4.4 12.2h4.8V4h5.6v8.2h4.8Z"/>',
  rCom: '<path d="M12 4.2c4.5 0 8.1 3 8.1 6.8s-3.6 6.8-8.1 6.8c-1 0-2-.15-2.9-.45L4.6 19.6l1.2-3.7C4.6 14.6 3.9 12.9 3.9 11c0-3.8 3.6-6.8 8.1-6.8Z"/>',
};

// ---------- the superbot mark (assets/sb-mark-live), frozen off the wall clock ----------
function makeMark(size) {
  const host = document.createElement('span');
  host.className = 'mk';
  host.style.cssText = `width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, last = NaN;
  return {
    el: host,
    render(t) {
      if (t === last) return; last = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { try { a.pause(); a.currentTime = Math.max(0, t) * 1000; } catch (err) { console.error('mark seek', err); } }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6, shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

// ---------- build ----------
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const $ = (root, sel) => root.querySelector(sel);
const $$ = (root, sel) => [...root.querySelectorAll(sel)];
const words = (s) => s.match(/<b>.*?<\/b>\S*|\S+/g).map((w) => `<span class="w">${w}</span>`).join(' ');

const stage = document.getElementById('stage');
stage.innerHTML = `
  <div class="backdrop"></div>
  <div class="win">
    <div class="tb">
      <div class="lights"><i></i><i></i><i></i></div>
      ${sv(IC.side, 'tb-ic')}
      <div class="tb-title"><span class="tt0">New chat</span><span class="tt1">Muse memes</span></div>
      <div class="tb-search">${sv(IC.search)}Search<kbd>⌘K</kbd></div>
    </div>
    <div class="home"><span class="home-mk"></span><h1>Good evening, Sam</h1></div>
    <div class="feed"><div class="thread"></div></div>
    <div class="composer">
      <div class="rc">
        <div class="rc-ring"></div>
        <div class="rc-draft"><span class="ph">How can superbot help you today?</span><span class="tx"></span></div>
        <div class="rc-row">
          <span class="rc-b rc-plus">${sv(IC.plus)}</span>
          <span class="rc-super">SUPER<i class="tg"></i></span>
          <span class="rc-chip"></span>
          <span class="rc-b">${sv(IC.monitor)}</span>
          <span class="rc-b">${sv(IC.mic)}</span>
          <span class="rc-send"><i class="bg"></i>${sv(IC.up)}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="end">
    <div class="lock">
      <div>
        <div class="words"><h1><span>EVERY MODEL.</span> <span>ONE CHAT.</span></h1></div>
        <div class="used">
          <i><img src="brand/gemini.svg" alt="">Nano Banana Pro</i>
          <i><img src="brand/perplexity.svg" alt="">Perplexity</i>
          <i><span class="ddi"><img src="brand/doordash.svg" alt=""></span>DoorDash</i>
        </div>
      </div>
      <div class="face"></div>
    </div>
  </div>
  <div id="dip"></div>`;

const win = $(stage, '.win'), thread = $(stage, '.thread'), composer = $(stage, '.composer');
const marks = [];
const mark = (size) => { const m = makeMark(size); marks.push(m); return m.el; };
$(stage, '.home-mk').appendChild(mark(34));
$(stage, '.face').appendChild(mark(220));

// the composer's model chip: one layer per state, the chip's width eases between them
const CHIP = [
  { html: () => [mark(16), 'superbot'] },
  { html: () => ['<img src="brand/gemini.svg" alt="">', 'Nano Banana Pro'] },
  { html: () => ['<img src="brand/perplexity.svg" alt="">', 'Perplexity'] },
  { html: () => [mark(16), 'Superbot Agent'] },
];
const chip = $(stage, '.rc-chip');
const chipLayers = CHIP.map((c) => {
  const [icon, label] = c.html();
  const span = document.createElement('span');
  if (typeof icon === 'string') span.insertAdjacentHTML('beforeend', icon); else span.appendChild(icon);
  span.insertAdjacentHTML('beforeend', `${label}${sv(IC.chev, 'chev')}`);
  chip.appendChild(span);
  return span;
});
const CHIP_AT = [0, ...ROUTES.map((r) => r.sw)];

// ---------- thread slots: each grows from 0 to its measured height, so the column never jumps ----------
const slots = [];
function slot(at, html, dur = 0.6) {
  const el = h(`<div class="slot"><div class="in">${html}</div></div>`);
  thread.appendChild(el);
  const s = { el, at, dur, in: el.firstElementChild, H: 0 };
  slots.push(s);
  return s;
}
const userTurn = (a, at) => slot(at, `<div class="u"><span>${a.text}</span></div>`);
function routeRow(r) {
  const tile = r.mark ? '<span class="t-done t-mark"></span>' : `<img class="t-done" src="${r.logo}" alt="">`;
  const conn = r.conn ? `<span class="rt-conn"><span class="dd"><img src="brand/doordash.svg" alt=""></span>${r.conn}${sv(IC.check, 'ok')}</span>` : '';
  const s = slot(r.at, `<div class="route"><div class="rt-row">
      <span class="rt-tile"><span class="t-busy"></span>${tile}</span>
      <span class="rt-txt"><span class="rt-busy">Routing…</span><span class="rt-done"><span class="rt-name">${r.name}</span><span class="rt-why">${r.why}</span>${conn}</span></span>
    </div></div>`);
  $(s.in, '.t-busy').appendChild(mark(16));
  if (r.mark) $(s.in, '.t-mark').appendChild(mark(16));
  s.route = r;
  return s;
}
const stepRow = (at, html) => slot(at, `<div class="steps"><div class="step"><span class="ic"><i class="spin"></i>${sv(IC.check, 'chk')}</span><span>${html}</span></div></div>`, 0.45);
const answer = (at, text) => slot(at, `<div class="a">${words(text)}</div>`, 0.45);

// turn 1: the meme
userTurn(A1, A1.send + 0.25);
routeRow(ROUTES[0]);
answer(G.text, 'Here’s your Muse meme.');
const gm = slot(G.frame, `<div class="gm">
    <div class="gm-frame"><div class="gm-glow"></div><div class="gm-sweep"></div>
      <div class="gm-label"><img src="brand/gemini.svg" alt="">Creating image</div>
      <img class="gm-img" src="img/muse-meme.jpg" alt="">
    </div>
    <div class="acts"><i>${sv(IC.dl)}</i><i>${sv(IC.copy)}</i><i>${sv(IC.retry)}</i><i>${sv(IC.thumb)}</i></div>
  </div>`, 0.7);

// turn 2: Reddit, through Perplexity
userTurn(A2, A2.send + 0.05);
routeRow(ROUTES[1]);
const pStep = stepRow(P.step, 'Searched <em>reddit.com</em> · 6 communities, past 7 days');
answer(P.text, 'Muse memes are climbing on Reddit this week. Top three right now:');
const rd = slot(P.cards, `<div><div class="rd-row">${REDDIT.map((p) => `
    <div class="rd">
      <div class="rd-head"><span class="av" style="background:${p.av}">r/</span>${p.sub}<small>• ${p.age}</small><img class="rd-logo" src="brand/reddit.svg" alt=""></div>
      <div class="rd-title">${p.title}</div>
      <div class="rd-media"><img class="fill" src="${p.img}" alt=""><img class="fit" src="${p.img}" alt=""></div>
      <div class="rd-acts"><span class="rd-pill vote">${sv(IC.rUp)}<b class="v"></b>${sv(IC.rDown)}</span><span class="rd-pill">${sv(IC.rCom)}<b class="c"></b></span></div>
    </div>`).join('')}</div>
    <div class="foot">Sources · 6 ${sv(IC.chev)}</div></div>`, 0.75);

// turn 3: the burger, through DoorDash
userTurn(A3, A3.send + 0.05);
routeRow(ROUTES[2]);
const dSteps = [
  stepRow(D.steps[0], 'Searched burgers near you on <em>DoorDash</em>'),
  stepRow(D.steps[1], 'Picked <em>Main Street Burger Co.</em> · 4.8 ★ · 1.2 mi'),
  stepRow(D.steps[2], 'Added your usual: <em>Double Smash Burger</em>'),
];
const dd = slot(D.card, `<div class="dd-card">
    <div class="dd-hero" style="background-image:url(img/store-hero.jpg)"></div>
    <div class="dd-mark"><img src="brand/doordash.svg" alt="">DOORDASH</div>
    <div class="dd-logo"><img src="img/store-logo.png" alt=""></div>
    <div class="dd-body">
      <div class="dd-name">Main Street Burger Co.</div>
      <div class="dd-meta"><b>4.8 ★</b> (2,400+ ratings) • 1.2 mi • $$</div>
      <div class="dd-swap">
        <div class="dd-co">
          <div class="dd-tg"><span class="dd-seg"><span class="on">Delivery</span><span>Pickup</span></span><span class="dd-eta"><b>20–30 min</b>$0 delivery fee</span></div>
          <div class="dd-item"><img src="img/burger.jpg" alt=""><div class="t"><b>Double Smash Burger</b><small>Fries · Extra pickles</small></div><div class="p"><span class="dd-qty">1</span>$14.49</div></div>
          <div class="dd-tot"><div>Total<small>Incl. fees, tax and tip</small></div><div>$19.62</div></div>
          <div class="dd-btn"><span class="b0">Place Order</span><span class="b1"><i class="spin"></i>Placing order</span></div>
        </div>
        <div class="dd-trk">
          <div><p>Order confirmed</p><h3>Arriving at 7:42 PM</h3><p>Main Street Burger Co. is preparing your order.</p></div>
          <div><div class="dd-bar"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>
          <div class="dd-stage"><span class="on">Confirmed</span><span class="on">Preparing</span><span>On the way</span><span>Delivered</span></div></div>
          <div class="dd-who"><img src="img/burger.jpg" alt=""><div><b>Double Smash Burger × 1</b>$19.62 · paid with your saved card</div></div>
        </div>
      </div>
    </div>
  </div>`, 0.7);
answer(D.text, 'Ordered. Your burger lands at <b>7:42 PM</b>.');

// ---------- refs used per frame ----------
const R = {
  backdrop: $(stage, '.backdrop'), dip: $(stage, '#dip'), home: $(stage, '.home'),
  tt0: $(stage, '.tt0'), tt1: $(stage, '.tt1'),
  ring: $(stage, '.rc-ring'), ph: $(stage, '.rc-draft .ph'), tx: $(stage, '.rc-draft .tx'), send: $(stage, '.rc-send'), sendBg: $(stage, '.rc-send .bg'),
  end: $(stage, '.end'), endWords: $$(stage, '.end h1 span'), endUsed: $$(stage, '.end .used i'), face: $(stage, '.face'),
};
let chipW = [];

function measure() {
  // a slot opens over a time that grows with its height, so the scroll it drives never outruns the eye
  for (const s of slots) { s.el.style.height = 'auto'; s.H = s.el.offsetHeight; s.dur = Math.max(s.dur, 0.5 + s.H / 520); }
  chipW = chipLayers.map((l) => Math.ceil(l.scrollWidth));
}

// ---------- per-frame pieces ----------
const op = (el, v) => { el.style.opacity = clamp(v).toFixed(4); };
const rise = (el, p, dy = 10, s0 = 1) => {
  op(el, p);
  el.style.transform = `translate3d(0,${((1 - p) * dy).toFixed(2)}px,0)${s0 !== 1 ? ` scale(${lerp(s0, 1, p).toFixed(4)})` : ''}`;
};
// max(x, 0) with a C1 knee over [0, k] (f = 2x²/k − x³/k²): the scroll eases in and lands exactly on x
const smoothMax0 = (x, k) => (x <= 0 ? 0 : x >= k ? x : (2 * x * x) / k - (x * x * x) / (k * k));

function renderComposer(t) {
  // the home -> thread move: the composer glides to its dock as the first turn lands
  const glide = tw(t, A1.send, 0.95, E.move);
  composer.style.top = lerp(HOME_TOP, DOCK_TOP, glide).toFixed(2) + 'px';
  rise(R.home, 1 - tw(t, A1.send - 0.05, 0.45), -16);
  op(R.ring, tw(t, 0.45, 0.4));

  // the draft: typed at an even pace, cleared on send
  let n = 0, caretOn = false, typing = false, cur = null;
  for (const a of ASKS) {
    if (t >= a.type && t < a.send) { cur = a; n = clamp(Math.floor((t - a.type) * a.cps + 1e-6) + 1, 0, a.text.length); typing = t < a.typeEnd + 0.05; }
  }
  const blinkOn = ((t % 1.06) + 1.06) % 1.06 < 0.53;
  caretOn = t > 0.6 && (typing || blinkOn);
  R.tx.innerHTML = (cur ? cur.text.slice(0, n) : '') + (caretOn ? '<i class="caret"></i>' : '');
  op(R.ph, n > 0 ? 0 : 1);
  op(R.sendBg, n > 0 ? 1 : 0.22);
  let press = 0;
  for (const a of ASKS) press = Math.max(press, tw(t, a.send - 0.08, 0.08) * (1 - tw(t, a.send + 0.02, 0.22)));
  R.send.style.transform = `scale(${(1 - 0.12 * press).toFixed(4)})`;

  // the model chip follows each switch: width eases, labels cross
  let k = 0;
  for (let i = 1; i < CHIP_AT.length; i++) if (t >= CHIP_AT[i]) k = i;
  const p = k ? tw(t, CHIP_AT[k], 0.6, E.move) : 1;
  chip.style.width = (k ? lerp(chipW[k - 1], chipW[k], p) : chipW[0]).toFixed(2) + 'px';
  chipLayers.forEach((l, i) => {
    let v = 0, dy = 0;
    if (i === k) { v = k ? tw(t, CHIP_AT[k] + 0.2, 0.4) : 1; dy = (1 - v) * 6; }
    else if (i === k - 1) v = 1 - tw(t, CHIP_AT[k], 0.18);
    op(l, v);
    l.style.transform = `translate3d(0,${dy.toFixed(2)}px,0)`;
  });
}

function renderRoute(s, t) {
  const r = s.route, appear = tw(t, r.at + 0.08, 0.45, E.dec), sw = tw(t, r.sw, 0.4, E.dec);
  rise($(s.in, '.rt-row'), appear, 8);
  const busy = $(s.in, '.rt-busy'), done = $(s.in, '.rt-done');
  op(busy, 1 - tw(t, r.sw - 0.04, 0.2));
  busy.style.backgroundPosition = `${(100 - ((t - r.at) * 140) % 240).toFixed(2)}% 0`;
  op(done, sw);
  done.style.transform = `translate3d(${((1 - sw) * 8).toFixed(2)}px,0,0)`;
  const tb = $(s.in, '.t-busy'), td = $(s.in, '.t-done');
  op(tb, r.mark ? 1 - sw : 1 - tw(t, r.sw - 0.04, 0.25));
  const pulse = 1 + 0.06 * Math.sin((t - r.at) * 9) * (1 - sw);
  tb.style.transform = `scale(${pulse.toFixed(4)})`;
  op(td, sw);
  td.style.transform = `scale(${lerp(0.6, 1, sw).toFixed(4)})`;
  const conn = $(s.in, '.rt-conn');
  if (conn) { const c = tw(t, r.sw + 0.3, 0.5, E.dec); op(conn, c); conn.style.transform = `translate3d(${((1 - c) * 10).toFixed(2)}px,0,0)`; }
}

function renderStep(s, t, done) {
  rise(s.in.firstElementChild, tw(t, s.at + 0.05, 0.4, E.dec), 6);
  const sp = $(s.in, '.spin'), ck = $(s.in, '.chk'), d = tw(t, done, 0.25);
  op(sp, 1 - d);
  sp.style.transform = `rotate(${((t - s.at) * 420).toFixed(1)}deg)`;
  op(ck, d);
  ck.style.transform = `scale(${lerp(0.5, 1, tw(t, done, 0.35, E.dec)).toFixed(4)})`;
}

function renderWords(s, t, wps = 9) {
  $$(s.in, '.w').forEach((w, i) => { const a = s.at + 0.05 + i / wps; w.style.opacity = tw(t, a, 0.28).toFixed(3); });
}

function renderGemini(t) {
  const s = gm, frame = $(s.in, '.gm-frame');
  rise(frame, tw(t, s.at + 0.05, 0.6, E.dec), 12, 0.97);
  const lt = t - s.at;
  $(s.in, '.gm-glow').style.transform = `translate3d(${(Math.sin(lt * 1.3) * 18).toFixed(2)}px,${(Math.cos(lt * 1.1) * 14).toFixed(2)}px,0) rotate(${(lt * 24).toFixed(2)}deg)`;
  const sweep = $(s.in, '.gm-sweep');
  sweep.style.transform = `translate3d(${(((lt * 0.75) % 1) * 200 - 100).toFixed(2)}%,0,0)`;
  const rv = tw(t, G.reveal, 0.95, E.dec);
  op($(s.in, '.gm-glow'), 1 - tw(t, G.reveal + 0.2, 0.6));
  op(sweep, 1 - tw(t, G.reveal, 0.3));
  op($(s.in, '.gm-label'), tw(t, s.at + 0.3, 0.35) * (1 - tw(t, G.reveal - 0.1, 0.3)));
  const img = $(s.in, '.gm-img');
  op(img, rv);
  img.style.filter = rv < 1 ? `blur(${((1 - rv) * 16).toFixed(2)}px)` : 'none';
  img.style.transform = `scale(${lerp(1.07, 1, rv).toFixed(4)})`;
  rise($(s.in, '.acts'), tw(t, G.acts, 0.45, E.dec), 6);
}

const fmtVotes = (n) => (n < 1000 ? String(n) : n < 10000 ? (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K' : Math.floor(n / 1000) + 'K');
function renderReddit(t) {
  const cards = $$(rd.in, '.rd');
  cards.forEach((c, i) => {
    rise(c, tw(t, rd.at + 0.08 + i * 0.13, 0.6, E.dec), 16, 0.97);
    const p = REDDIT[i], f = E.io(seg(t, P.votes + i * 0.2, P.votes + 3.6 + i * 0.2));
    $(c, '.v').textContent = fmtVotes(Math.round(lerp(p.votes[0], p.votes[1], f)));
    $(c, '.c').textContent = String(Math.round(lerp(p.com[0], p.com[1], f)));
  });
  rise($(rd.in, '.foot'), tw(t, P.foot, 0.45, E.dec), 4);
}

function renderDoorDash(t) {
  const s = dd, card = $(s.in, '.dd-card');
  rise(card, tw(t, s.at + 0.05, 0.65, E.dec), 16, 0.97);
  const press = tw(t, D.press - 0.06, 0.08) * (1 - tw(t, D.press + 0.06, 0.25));
  const btn = $(s.in, '.dd-btn');
  btn.style.transform = `scale(${(1 - 0.035 * press).toFixed(4)})`;
  btn.style.filter = `brightness(${(1 - 0.12 * press).toFixed(3)})`;
  const placing = tw(t, D.press, 0.25);
  op($(s.in, '.b0'), 1 - placing);
  op($(s.in, '.b1'), placing);
  $(s.in, '.b1 .spin').style.transform = `rotate(${((t - D.press) * 420).toFixed(1)}deg)`;
  const tr = tw(t, D.track, 0.5, E.dec);
  op($(s.in, '.dd-co'), 1 - tw(t, D.track - 0.05, 0.3));
  const trk = $(s.in, '.dd-trk');
  rise(trk, tr, 10);
  const bars = $$(s.in, '.dd-bar b');
  bars[0].style.width = (100 * tw(t, D.bar, 0.5, E.io)).toFixed(2) + '%';
  bars[1].style.width = (100 * lerp(0, 0.42, tw(t, D.bar + 0.45, 1.6, E.io))).toFixed(2) + '%';
}

function renderEnd(t) {
  const lt = t - CHAT_END;
  op(R.end, lt > -0.01 ? 1 : 0);
  R.end.style.visibility = lt > -0.01 ? 'visible' : 'hidden';
  R.endWords.forEach((w, i) => { const p = tw(lt, 0.3 + i * 0.14, 0.85, E.dec); op(w, p); w.style.transform = `translate3d(0,${((1 - p) * 70).toFixed(2)}px,0)`; });
  const f = tw(lt, 0.55, 0.9, E.dec);
  op(R.face, f);
  R.face.style.transform = `scale(${lerp(0.72, 1, f).toFixed(4)})`;
  R.endUsed.forEach((u, i) => rise(u, tw(lt, 1.15 + i * 0.12, 0.6, E.dec), 12));
}

// ---------- render(t) ----------
function render(t) {
  marks.forEach((m) => m.render(t));
  // the window: rises in, holds with a slow push, leaves for the end card
  const inP = tw(t, 0.0, 0.9, E.dec), outP = tw(t, CHAT_END - 0.1, 0.65, E.acc);
  const push = 1 + 0.018 * E.io(seg(t, 0.5, CHAT_END));
  win.style.transform = `translate3d(0,${((1 - inP) * 26 - outP * 10).toFixed(2)}px,0) scale(${(S * push * lerp(0.965, 1, inP) * lerp(1, 0.94, outP)).toFixed(5)})`;
  op(win, inP * (1 - outP));
  win.style.visibility = outP >= 1 ? 'hidden' : 'visible';

  op(R.tt0, 1 - tw(t, TITLE_AT, 0.35));
  op(R.tt1, tw(t, TITLE_AT + 0.15, 0.45));

  renderComposer(t);

  // slots: heights ease open, the thread translates so the newest line sits above the composer
  let total = 22;
  for (const s of slots) {
    const g = tw(t, s.at, s.dur, E.move);
    s.el.style.height = (s.H * g).toFixed(3) + 'px';
    s.el.style.visibility = t >= s.at ? 'visible' : 'hidden';
    total += s.H * g;
  }
  const over = smoothMax0(total + 18 - FEED_H, 48);
  thread.style.transform = `translate3d(0,${(-over).toFixed(3)}px,0)`;

  for (const s of slots) {
    if (t < s.at) continue;
    const u = $(s.in, '.u');
    if (u) { rise(u, tw(t, s.at + 0.05, 0.5, E.dec), 12); continue; }
    if (s.route) { renderRoute(s, t); continue; }
    if ($(s.in, '.a')) { renderWords(s, t); continue; }
  }
  renderStep(pStep, t, P.stepDone);
  dSteps.forEach((s, i) => renderStep(s, t, D.steps[i] + D.stepDur));
  if (t >= gm.at) renderGemini(t);
  if (t >= rd.at) renderReddit(t);
  if (t >= dd.at) renderDoorDash(t);

  renderEnd(t);
  op(R.dip, Math.max(1 - seg(t, 0, DIP), seg(t, CYCLE - DIP, CYCLE)));
}

// ---------- fit the 1920x1080 stage to the window ----------
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now(), ready = false, lastT = NaN;
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function restart() { offset = 0; t0 = performance.now(); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart };
window.__AD = { CYCLE, ready: false, segments: [{ id: 'chat', t0: 0, t1: CHAT_END }, { id: 'end', t0: CHAT_END, t1: CYCLE }], seek(t) { paused = true; offset = t; lastT = NaN; render(clamp(t, 0, CYCLE)); } };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frame() {
  if (ready) {
    let t = clockNow();
    t = ((t % CYCLE) + CYCLE) % CYCLE;
    t = Math.round(t * FPS) / FPS;
    if (t !== lastT) { lastT = t; render(t); }
  }
  requestAnimationFrame(frame);
}

// fonts and images first, so every slot measures at its final size
const imgs = [...stage.querySelectorAll('img')];
Promise.all([document.fonts.ready, ...imgs.map((i) => (i.decode ? i.decode().catch((err) => { console.error('img decode', i.src, err); }) : null))])
  .then(() => { measure(); ready = true; window.__AD.ready = true; render(offset); requestAnimationFrame(frame); })
  .catch((err) => { console.error('boot', err); throw err; });
