// Every model. One chat. (fluid cut, aae36d42)
// One clock drives everything: render(t) is a pure function of t, so __AD.seek(t) always draws the same frame
// and the renderer can step it at 30 fps. Layout is measured once; every row's height eases in, and the thread
// follows its own bottom edge, so content never jumps.
// Thread anatomy follows superbot-desktop provider-switch.tsx: pill, nested column on a hairline rail
// (who row, steps), the answer lead, the deliverable, "Worked for".

const CYCLE = 26;
const COL_W = 760;
const PAD_TOP = 24;
const PAD_BOTTOM = 22;
const NEST_X = 46; // where the pill's label text starts: the nested column's inset
const RAIL_X = 22; // the pill tile's centre

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const oc = (p) => 1 - (1 - p) ** 3;
const ios = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
const ioc = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const ob = (p, k = 1.4) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 + (k + 1) * (p - 1) ** 3 + k * (p - 1) ** 2);
const smax = (x, floor, w = 90) => {
  const d = x - floor;
  if (d <= -w) return floor;
  if (d >= w) return x;
  return floor + (d + w) ** 2 / (4 * w);
};
const $ = (s) => document.querySelector(s);
const html = (s) => {
  const d = document.createElement('div');
  d.innerHTML = s.trim();
  return d.firstElementChild;
};

const TILE = {
  gem: '<span class="tile gem"><img src="brand/gemini-logo.svg" alt=""></span>',
  reddit: '<span class="tile"><img src="brand/reddit.png" alt=""></span>',
  dd: '<span class="tile"><img src="brand/doordash.png" alt=""></span>',
  sb: '<span class="tile sb"><img src="brand/superbot-mark.svg" alt=""></span>',
};
const SPIN = '<svg class="spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.56"/></svg>';
const CHECK = '<svg class="check" viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5 9.5 17 19 7.5"/></svg>';
const CHEV_R = '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
const CHEV_D = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';

// ---------------------------------------------------------------- the script
const TURNS = [
  { text: 'make me a muse meme', type: [1.0, 2.05], send: 2.25, end: 6.25 },
  { text: 'find more muse memes on reddit', type: [7.3, 8.6], send: 8.8, end: 13.0 },
  { text: 'winning. order me a burger', type: [14.3, 15.4], send: 15.6, end: 19.65 },
];
// The composer chip shows the model a turn is routed to, then returns to superbot. The burger turn stays on
// superbot: the agent itself drives DoorDash, there is no model to switch to.
const CHIP = [[0, 'sb'], [2.35, 'nbp'], [6.25, 'sb'], [9.95, 'g38'], [13.0, 'sb']];
const CHIPS = {
  sb: { tile: '<img src="brand/superbot-mark.svg" alt="">', name: 'superbot' },
  nbp: { tile: TILE.gem, name: 'Nano Banana Pro' },
  g38: { tile: TILE.gem, name: 'Gemini 3.8 Flash' },
};
const CONTEXT = [[0, 2.1], [6.25, 9.8], [13.0, 24.6], [19.65, 31.2]];
const TITLE_AT = 6.45;
const CAM = [
  // [time, scale, focus x, focus y] in window px; holds between keys, inOutSine across them
  [0, 0.97, 800, 500],
  [0.6, 0.97, 800, 500],
  [2.05, 1.5, 945, 640],
  [20.6, 1.5, 945, 640],
  [22.2, 0.95, 800, 500],
];
const EXIT = [22.0, 22.75];
const END = 22.45;

// ---------------------------------------------------------------- rows
const rows = [];
const rails = [];
const anims = [];
let scrollEl, threadH = 728;

function addRow(el, o) {
  const r = { el, t0: o.t0, dur: o.dur ?? 0.5, gap: o.gap ?? 14, x: o.x ?? 0, rise: o.rise ?? 16, self: !!o.self,
    fade: o.fade, update: o.update, right: !!o.right };
  scrollEl.appendChild(el);
  rows.push(r);
  return r;
}

function bubble(text, t0) {
  return addRow(html(`<div class="row"><div class="bubble">${text}</div></div>`), { t0, dur: 0.5, gap: 34, right: true, rise: 20 });
}

// a provider switch pill: "Switching to X" with a travelling mask, spinner, then "Switched to X" with the check
function pill(o) {
  const el = html(`<div class="row"><div class="pill">${o.tile}<span class="lbl"><b class="a">${o.a}</b><b class="b done">${o.b}</b></span>
    <span class="state">${SPIN}${CHECK}</span></div></div>`);
  const r = addRow(el, { t0: o.t0, dur: 0.42, gap: o.gap ?? 22 });
  const [bA, bB] = el.querySelectorAll('.lbl b');
  const lbl = el.querySelector('.lbl');
  const tile = el.querySelector('.tile');
  const spin = el.querySelector('.spin');
  const check = el.querySelector('.check');
  const cpath = check.querySelector('path');
  r.measure = () => { r.wA = bA.offsetWidth; r.wB = bB.offsetWidth; };
  r.fade = (t) => (o.recede ? 1 - 0.45 * oc(seg(t, o.recede, o.recede + 0.42)) : 1);
  r.update = (t) => {
    const ck = ioc(seg(t, o.tc, o.tc + 0.32));
    bA.style.opacity = 1 - ck;
    bB.style.opacity = ck;
    lbl.style.width = `${lerp(r.wA, r.wB, ck)}px`;
    const ph = (((t - o.t0) / 1.4) % 1 + 1) % 1;
    bA.style.webkitMaskPosition = `${(1 - ph) * 100}% 0`;
    tile.style.transform = `scale(${lerp(0.55, 1, ob(seg(t, o.t0 + 0.06, o.t0 + 0.46)))})`;
    spin.style.opacity = 1 - seg(t, o.tc, o.tc + 0.18);
    spin.style.transform = `rotate(${t * 360}deg)`;
    const cp = seg(t, o.tc + 0.02, o.tc + 0.34);
    check.style.opacity = cp > 0 ? 1 : 0;
    check.style.transform = `scale(${lerp(0.5, 1, ob(cp, 2))})`;
    cpath.style.strokeDasharray = '1';
    cpath.style.strokeDashoffset = `${1 - oc(seg(t, o.tc, o.tc + 0.26))}`;
  };
  return r;
}

function who(tile, name, t0) {
  const el = html(`<div class="row"><div class="who">${tile}<b>${name}</b><em>in superbot</em></div></div>`);
  const tl = el.querySelector('.tile');
  return addRow(el, { t0, dur: 0.42, gap: 10, x: NEST_X,
    update: (t) => { tl.style.transform = `scale(${lerp(0.55, 1, ob(seg(t, t0 + 0.04, t0 + 0.44)))})`; } });
}

// a nested step: spinner while it runs, the check when it lands; labels crossfade (Checking out -> Checked out)
function step(o) {
  const el = html(`<div class="row"><div class="step"><span class="state">${SPIN}${CHECK}</span>
    <span class="slbl"><b class="a">${o.a}</b><b class="b">${o.b ?? o.a}</b></span></div></div>`);
  const [bA, bB] = el.querySelectorAll('.slbl b');
  const slbl = el.querySelector('.slbl');
  const spin = el.querySelector('.spin');
  const check = el.querySelector('.check');
  const cpath = check.querySelector('path');
  const r = addRow(el, { t0: o.t0, dur: 0.38, gap: o.gap ?? 3, x: NEST_X, rise: 10 });
  r.measure = () => { r.wA = bA.offsetWidth; r.wB = bB.offsetWidth; };
  r.update = (t) => {
    const ck = ioc(seg(t, o.tc, o.tc + 0.3));
    bA.style.opacity = o.b ? 1 - ck : 1;
    bB.style.opacity = o.b ? ck : 0;
    slbl.style.width = `${lerp(r.wA, r.wB, o.b ? ck : 0)}px`;
    if (o.count) {
      const [n0, n1, c0, c1, fmt] = o.count;
      bA.textContent = fmt(Math.round(lerp(n0, n1, ioc(seg(t, c0, c1)))));
    }
    spin.style.opacity = 1 - seg(t, o.tc, o.tc + 0.16);
    spin.style.transform = `rotate(${t * 360}deg)`;
    const cp = seg(t, o.tc + 0.02, o.tc + 0.32);
    check.style.opacity = cp > 0 ? 1 : 0;
    check.style.transform = `scale(${lerp(0.5, 1, ob(cp, 2))})`;
    cpath.style.strokeDasharray = '1';
    cpath.style.strokeDashoffset = `${1 - oc(seg(t, o.tc, o.tc + 0.24))}`;
  };
  return r;
}

// the answer lead, the large first line; its words rise in a short stagger
function lead(text, t0) {
  const words = text.split(' ').map((w) => `<span>${w}</span>`).join(' ');
  const el = html(`<div class="row"><div class="lead">${words}</div></div>`);
  const spans = [...el.querySelectorAll('.lead span')];
  return addRow(el, { t0, dur: 0.55, gap: 16, self: true,
    update: (t) => spans.forEach((s, i) => {
      const p = oc(seg(t, t0 + 0.1 + i * 0.045, t0 + 0.6 + i * 0.045));
      s.style.opacity = p;
      s.style.transform = `translateY(${(1 - p) * 14}px)`;
    }) });
}

function worked(text, t0) {
  return addRow(html(`<div class="row"><div class="worked">${text}${CHEV_R}</div></div>`), { t0, dur: 0.4, gap: 12, rise: 8 });
}

// the rail: a hairline from under the pill's tile down the nested column
function rail(pillRow, nested) {
  const el = html('<div class="rail"></div>');
  scrollEl.appendChild(el);
  rails.push({ el, pillRow, nested });
}

// ---------------------------------------------------------------- turn 1: the meme (Nano Banana Pro)
function turnMeme() {
  const T = TURNS[0];
  bubble(T.text, T.send);
  const p = pill({ tile: TILE.gem, a: 'Switching to Nano Banana Pro', b: 'Switched to Nano Banana Pro', t0: 2.5, tc: 3.4 });
  const w = who(TILE.gem, 'Nano Banana Pro', 3.6);
  rail(p, [w]);
  lead("Here's your Muse meme.", 5.85);
  const R0 = 5.15;
  const el = html(`<div class="row"><div class="media"><i class="band"></i>
      <span class="gl">${TILE.gem}<span class="lbl"><b class="a">Creating image</b></span></span>
      <img class="out" src="img/muse-meme.jpg" alt=""></div></div>`);
  const band = el.querySelector('.band');
  const gl = el.querySelector('.gl');
  const glb = el.querySelector('.gl b');
  const img = el.querySelector('img.out');
  addRow(el, { t0: 3.8, dur: 0.9, gap: 14,
    update: (t) => {
      const ph = (((t - 3.8) / 1.4) % 1 + 1) % 1;
      const rv = seg(t, R0, R0 + 0.95);
      band.style.transform = `translateX(${lerp(-110, 190, ph)}%)`;
      band.style.opacity = 1 - seg(t, R0, R0 + 0.4);
      gl.style.opacity = 1 - seg(t, R0, R0 + 0.3);
      glb.style.webkitMaskImage = 'linear-gradient(90deg, rgba(0,0,0,.42) 35%, #000 50%, rgba(0,0,0,.42) 65%)';
      glb.style.webkitMaskSize = '300% 100%';
      glb.style.webkitMaskPosition = `${(1 - ph) * 100}% 0`;
      img.style.opacity = oc(seg(t, R0, R0 + 0.6));
      img.style.filter = rv < 1 ? `blur(${(1 - oc(rv)) * 22}px)` : 'none';
      img.style.transform = `scale(${lerp(1.08, 1, oc(rv))})`;
    } });
  worked('Worked for 3s · 1 step', 6.15);
}

// ---------------------------------------------------------------- turn 2: Reddit (Reddit + Gemini 3.8 Flash)
const REDDIT = [
  { sub: 'r/me_irl', ic: '#ff4500', age: '4h', title: 'me_irl', img: 'img/reddit-3am.jpg', up: 12400, cm: 418 },
  { sub: 'r/memes', ic: '#0079d3', age: '7h', title: 'never heard of muse??', img: 'img/reddit-cafe.jpg', up: 8900, cm: 231 },
  { sub: 'r/wholesomememes', ic: '#46d160', age: '2h', title: 'muse gets it', img: 'img/reddit-coffee.jpg', up: 21700, cm: 604 },
];
const kfmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);
const UP = '<svg viewBox="0 0 24 24"><path d="M12 4 4.5 12.5H9V20h6v-7.5h4.5Z"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24"><path d="M12 20l7.5-8.5H15V4H9v7.5H4.5Z"/></svg>';
const CMT = '<svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z"/></svg>';
const SHARE = '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

function turnReddit() {
  const T = TURNS[1];
  bubble(T.text, T.send);
  pill({ tile: TILE.reddit, a: 'Connecting to Reddit', b: 'Connected to Reddit', t0: 9.0, tc: 9.7, recede: 9.95 });
  const p = pill({ tile: TILE.gem, a: 'Switching to Gemini 3.8 Flash', b: 'Switched to Gemini 3.8 Flash', t0: 9.95, tc: 10.65, gap: 8 });
  const w = who(TILE.gem, 'Gemini 3.8 Flash', 10.85);
  const s1 = step({ a: 'Searching 6 subreddits', b: 'Searched 6 subreddits', t0: 11.0, tc: 11.45, gap: 4 });
  const s2 = step({ a: 'Looked at 0 meme images', t0: 11.5, tc: 12.2,
    count: [0, 214, 11.5, 12.15, (n) => `Looked at ${n} meme images`] });
  rail(p, [w, s1, s2]);
  lead('Found 3 more Muse memes blowing up on Reddit.', 12.3);
  const C0 = 12.4;
  const el = html(`<div class="row"><div class="rd-row">${REDDIT.map((c) => `
    <div class="rd">
      <div class="rd-hd"><span class="ic" style="background:${c.ic}">r/</span><b>${c.sub}</b><i>· ${c.age}</i></div>
      <div class="rd-t">${c.title}</div>
      <div class="rd-img"><img src="${c.img}" alt=""></div>
      <div class="rd-act"><span class="vote">${UP}<n>${kfmt(c.up)}</n>${DOWN}</span><span>${CMT}<n>${c.cm}</n></span><span>${SHARE}Share</span></div>
    </div>`).join('')}</div></div>`);
  const cards = [...el.querySelectorAll('.rd')];
  const ups = [...el.querySelectorAll('.vote n')];
  const cms = [...el.querySelectorAll('.rd-act span:nth-child(2) n')];
  addRow(el, { t0: C0, dur: 0.85, gap: 16, self: true,
    update: (t) => cards.forEach((c, i) => {
      const a0 = C0 + 0.08 + i * 0.11;
      const p2 = oc(seg(t, a0, a0 + 0.55));
      c.style.opacity = p2;
      c.style.transform = `translateY(${(1 - p2) * 26}px) scale(${lerp(0.96, 1, p2)})`;
      const g = ioc(seg(t, a0 + 0.2, a0 + 2.2));
      ups[i].textContent = kfmt(Math.round(REDDIT[i].up * lerp(0.94, 1, g) / 100) * 100);
      cms[i].textContent = `${Math.round(REDDIT[i].cm * lerp(0.94, 1, g))}`;
    }) });
  worked('Worked for 4s · 2 steps', 12.9);
}

// ---------------------------------------------------------------- turn 3: DoorDash (superbot drives it)
const PIN = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const CARD = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></svg>';
const OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5 9.5 17 19 7.5"/></svg>';

function turnDoorDash() {
  const T = TURNS[2];
  bubble(T.text, T.send);
  const p = pill({ tile: TILE.dd, a: 'Connecting to DoorDash', b: 'Connected to DoorDash', t0: 15.8, tc: 16.5 });
  const w = who(TILE.dd, 'DoorDash', 16.7);
  const s1 = step({ a: 'Opening DoorDash', b: 'Opened DoorDash', t0: 16.85, tc: 17.2, gap: 4 });
  const s2 = step({ a: 'Picking a burger spot', b: 'Picked Main Street Burger Co.', t0: 17.25, tc: 17.65 });
  const s3 = step({ a: 'Checking out with your saved card', b: 'Checked out with your saved card', t0: 17.7, tc: 19.15 });
  rail(p, [w, s1, s2, s3]);
  lead('Your burger is on its way from DoorDash.', 19.3);
  const P = 18.75; // the Place Order press
  const el = html(`<div class="row"><div class="dd">
    <div class="dd-l">
      <div class="dd-hero" style="background-image:url(img/store-hero.jpg)"><span class="dd-logo"><img src="img/store-logo.png" alt=""></span></div>
      <div class="dd-store"><h3>Main Street Burger Co.</h3><p><b>4.8 ★</b> (2,100+) · 0.8 mi · $$</p></div>
      <div class="dd-h">Your cart<span>1 item</span></div>
      <div class="dd-item"><img src="img/cheeseburger.jpg" alt=""><div class="nm"><b>Classic Cheeseburger</b><i>Cheddar, pickles, house sauce</i><em>$7.99</em></div>
        <span class="dd-qty">1${CHEV_D}</span></div>
    </div>
    <div class="dd-r">
      <h4>Delivery</h4>
      <div class="dd-opts"><div class="dd-opt on"><b>Standard</b><i>25-35 min</i></div><div class="dd-opt"><b>Priority</b><i>20-30 min · +$2.99</i></div></div>
      <div class="dd-rows"><div>${PIN}1480 Market St, Apt 5<i>Edit</i></div><div>${CARD}Visa •••• 4242<i>Edit</i></div></div>
      <div class="dd-lines">
        <div><span>Subtotal</span><span>$7.99</span></div>
        <div><span>Delivery Fee</span><span>$1.99</span></div>
        <div><span>Fees &amp; Estimated Tax</span><span>$2.42</span></div>
        <div><span>Dasher Tip</span><span>$3.00</span></div>
        <div class="tot"><span>Total</span><span>$15.40</span></div>
      </div>
      <div class="dd-foot">
        <div class="dd-btn">Place Order</div>
        <div class="dd-track"><div class="tl"><b>${OK}Order placed</b><span>Arrives by 7:52 PM</span></div>
          <div class="dd-bars"><i><em></em></i><i><em></em></i><i><em></em></i><i><em></em></i></div></div>
      </div>
    </div></div></div>`);
  const btn = el.querySelector('.dd-btn');
  const track = el.querySelector('.dd-track');
  const bars = [...el.querySelectorAll('.dd-bars em')];
  addRow(el, { t0: 17.8, dur: 0.85, gap: 16, rise: 24,
    update: (t) => {
      const pr = seg(t, P, P + 0.26);
      const out = ioc(seg(t, P + 0.22, P + 0.5));
      btn.style.transform = `scale(${1 - 0.04 * Math.sin(Math.PI * pr)}) translateY(${-8 * out}px)`;
      btn.style.filter = `brightness(${1 - 0.12 * Math.sin(Math.PI * pr)})`;
      btn.style.opacity = 1 - out;
      const tin = oc(seg(t, P + 0.32, P + 0.75));
      track.style.opacity = tin;
      track.style.transform = `translateY(${(1 - tin) * 10}px)`;
      bars[0].style.transform = `scaleX(${ioc(seg(t, P + 0.5, P + 1.2))})`;
      bars[1].style.transform = `scaleX(${0.4 * ioc(seg(t, P + 1.2, P + 2.6))})`;
    } });
  worked('Worked for 5s · 3 steps', 19.6);
}

// ---------------------------------------------------------------- composer, chrome, end card
const comp = {};
function buildChrome() {
  comp.typed = $('#typed');
  comp.caret = $('#caret');
  comp.p0 = $('#ph .p0');
  comp.p1 = $('#ph .p1');
  comp.send = $('#send');
  comp.arrow = $('#send .arrow');
  comp.stop = $('#send .stop');
  comp.sup = $('#super');
  const chip = $('#chip');
  comp.chips = {};
  for (const [k, c] of Object.entries(CHIPS)) {
    const el = html(`<span class="cv">${c.tile}<span>${c.name}</span>${CHEV_D}</span>`);
    chip.appendChild(el);
    comp.chips[k] = el;
  }
  comp.chipBox = chip;
  comp.titles = [...document.querySelectorAll('#side-title b, #top-title b')];
  comp.ctxNum = $('#ctx-num');
  comp.ctxBar = $('#ctx-bar');
  comp.empty = $('#empty');

  const line = $('#end-line');
  line.innerHTML = '<span>Every</span> <span>model.</span><br><span class="g">One</span> <span class="g">chat.</span>';
  comp.endWords = [...line.querySelectorAll('span')];
  const used = $('#end-used');
  used.innerHTML = [[TILE.gem, 'Nano Banana Pro'], [TILE.reddit, 'Reddit'], [TILE.gem, 'Gemini 3.8 Flash'], [TILE.dd, 'DoorDash']]
    .map(([tl, n]) => `<span class="u">${tl}${n}</span>`).join('');
  comp.endUsed = [...used.querySelectorAll('.u')];
  comp.endMark = $('.end-mark');
  comp.endUrl = $('.end-url');
  comp.end = $('#end');
  comp.cam = $('#cam');
  comp.fade = $('#fade');
}

function composerAt(t) {
  let typed = '';
  let typing = false;
  let sendFx = 0;
  let active = 0;
  let lastKey = -9;
  for (const T of TURNS) {
    if (t >= T.type[0] && t < T.send) {
      const n = Math.round(T.text.length * seg(t, T.type[0], T.type[1]));
      typed = T.text.slice(0, n);
      typing = t < T.type[1];
      lastKey = Math.min(t, T.type[1]);
    } else if (t >= T.send && t < T.send + 0.2) {
      typed = T.text;
      sendFx = seg(t, T.send, T.send + 0.2);
    }
    active = Math.max(active, seg(t, T.send + 0.05, T.send + 0.3) * (1 - seg(t, T.end, T.end + 0.3)));
    if (t >= T.send - 0.02 && t < T.send + 0.25) comp.send.style.transform = `scale(${1 - 0.12 * Math.sin(Math.PI * seg(t, T.send, T.send + 0.25))})`;
  }
  if (!TURNS.some((T) => t >= T.send - 0.02 && t < T.send + 0.25)) comp.send.style.transform = '';
  comp.typed.textContent = typed;
  comp.typed.style.opacity = 1 - sendFx;
  comp.typed.style.transform = `translateY(${-10 * oc(sendFx)}px)`;
  const empty = typed.length === 0;
  comp.p0.style.opacity = empty ? 1 - active : 0;
  comp.p1.style.opacity = empty ? active : 0;
  const blink = typing || t - lastKey < 0.5 ? 1 : (t % 1.06) < 0.6 ? 1 : 0;
  comp.caret.style.opacity = sendFx > 0 ? 0 : blink;
  const lit = empty || sendFx > 0 ? (sendFx > 0 ? 1 - sendFx : 0) : 1;
  const c = Math.round(lerp(42, 236, lit));
  comp.send.style.background = `rgb(${c},${c},${Math.round(lerp(45, 238, lit))})`;
  comp.arrow.style.color = lit > 0.5 ? '#111' : '#8a8a90';
  comp.stop.style.opacity = active;
  comp.sup.style.opacity = 1 - 0.5 * active;
}

function chipAt(t) {
  let i = 0;
  while (i + 1 < CHIP.length && t >= CHIP[i + 1][0]) i++;
  const [ts, cur] = CHIP[i];
  const prev = i > 0 ? CHIP[i - 1][1] : null;
  for (const [k, el] of Object.entries(comp.chips)) {
    let o = 0, s = 1;
    if (k === cur) {
      const p = i === 0 ? 1 : seg(t, ts + 0.1, ts + 0.5);
      o = oc(p);
      s = lerp(0.86, 1, ob(p, 1.6));
    } else if (k === prev) {
      const q = seg(t, ts, ts + 0.16);
      o = 1 - q;
      s = 1 - 0.1 * q;
    }
    el.style.opacity = o;
    el.style.transform = `scale(${s})`;
    el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
  }
}

function chromeAt(t) {
  const ti = ioc(seg(t, TITLE_AT, TITLE_AT + 0.45));
  comp.titles.forEach((b) => { b.style.opacity = b.classList.contains('t0') ? 1 - ti : ti; });
  let v = CONTEXT[0][1];
  for (let i = 1; i < CONTEXT.length; i++) v = lerp(v, CONTEXT[i][1], ioc(seg(t, CONTEXT[i][0], CONTEXT[i][0] + 0.7)));
  comp.ctxNum.textContent = `${v.toFixed(1)}k of 200k`;
  comp.ctxBar.style.transform = `scaleX(${v / 200})`;
  const e = oc(seg(t, TURNS[0].send, TURNS[0].send + 0.4));
  comp.empty.style.opacity = 1 - e;
  comp.empty.style.transform = `translateY(${-14 * e}px) scale(${1 - 0.03 * e})`;
}

function cameraAt(t) {
  let i = 0;
  while (i + 1 < CAM.length && t >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[Math.min(i + 1, CAM.length - 1)];
  const p = b === a ? 0 : ios(seg(t, a[0], b[0]));
  let s = lerp(a[1], b[1], p);
  const fx = lerp(a[2], b[2], p);
  const fy = lerp(a[3], b[3], p);
  const x = ioc(seg(t, EXIT[0], EXIT[1]));
  s *= lerp(1, 0.93, x);
  comp.cam.style.transform = `translate(${960 - fx * s}px, ${540 - fy * s + 30 * x}px) scale(${s})`;
  comp.cam.style.opacity = 1 - x;
  comp.cam.style.visibility = x >= 1 ? 'hidden' : 'visible';
}

function endAt(t) {
  const on = t >= END;
  comp.end.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  comp.end.style.transform = `scale(${lerp(1, 1.035, ioc(seg(t, END, CYCLE)))})`;
  const m = seg(t, END, END + 0.6);
  comp.endMark.style.opacity = oc(m);
  comp.endMark.style.transform = `translateY(${(1 - oc(m)) * 18}px) scale(${lerp(0.7, 1, ob(m, 1.3))})`;
  comp.endWords.forEach((w, i) => {
    const p = oc(seg(t, END + 0.18 + i * 0.09, END + 0.85 + i * 0.09));
    w.style.opacity = p;
    w.style.transform = `translateY(${(1 - p) * 36}px)`;
    w.style.filter = p < 1 ? `blur(${(1 - p) * 10}px)` : 'none';
  });
  comp.endUsed.forEach((u, i) => {
    const p = oc(seg(t, END + 0.85 + i * 0.08, END + 1.4 + i * 0.08));
    u.style.opacity = p;
    u.style.transform = `translateY(${(1 - p) * 14}px) scale(${lerp(0.94, 1, p)})`;
  });
  const u = oc(seg(t, END + 1.3, END + 1.9));
  comp.endUrl.style.opacity = u;
  comp.endUrl.style.transform = `translateY(${(1 - u) * 10}px)`;
}

// ---------------------------------------------------------------- the frame
function render(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  let y = PAD_TOP;
  for (const r of rows) {
    const p = ios(seg(t, r.t0, r.t0 + r.dur));
    r.y = y + r.gap * p;
    y += (r.h + r.gap) * p;
    const a = r.self ? (t >= r.t0 ? 1 : 0) : oc(seg(t, r.t0 + 0.05, r.t0 + r.dur + 0.2));
    const f = r.fade ? r.fade(t) : 1;
    r.el.style.visibility = a > 0.001 ? 'visible' : 'hidden';
    r.el.style.opacity = a * f;
    r.el.style.transform = `translate(${r.right ? COL_W - r.w : r.x}px, ${r.y + (r.self ? 0 : (1 - a) * r.rise)}px)`;
    if (r.update && a > 0) r.update(t);
  }
  for (const rl of rails) {
    const top = rl.pillRow.y + rl.pillRow.h + 2;
    const last = rl.nested.filter((n) => t >= n.t0).pop();
    const bottom = last ? last.y + last.h - 6 : top;
    const vis = oc(seg(t, rl.nested[0].t0, rl.nested[0].t0 + 0.4));
    rl.el.style.opacity = vis;
    rl.el.style.transform = `translate(${RAIL_X}px, ${top}px)`;
    rl.el.style.height = `${Math.max(0, bottom - top)}px`;
  }
  const off = smax(y + PAD_BOTTOM - threadH, -212);
  scrollEl.style.transform = `translateY(${-off}px)`;

  composerAt(t);
  chipAt(t);
  chromeAt(t);
  cameraAt(t);
  endAt(t);
  comp.fade.style.opacity = Math.max(1 - seg(t, 0, 0.55), seg(t, CYCLE - 0.5, CYCLE));
}

// ---------------------------------------------------------------- boot
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  $('#stage').style.transform = `translate(${-960 * k}px, ${-540 * k}px) scale(${k})`;
}

async function boot() {
  scrollEl = $('#scroll');
  scrollEl.style.left = '50%';
  scrollEl.style.width = `${COL_W}px`;
  scrollEl.style.marginLeft = `${-COL_W / 2}px`;
  buildChrome();
  turnMeme();
  turnReddit();
  turnDoorDash();
  fit();
  addEventListener('resize', fit);
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
  await document.fonts.load('600 15px "Reddit Sans"').catch(() => {});
  await document.fonts.ready;
  threadH = $('#thread').clientHeight;
  for (const r of rows) {
    r.h = r.el.offsetHeight;
    r.w = r.el.firstElementChild.offsetWidth;
    if (r.measure) r.measure();
  }
  const cw = Math.max(...Object.values(comp.chips).map((c) => c.offsetWidth));
  comp.chipBox.style.width = `${cw}px`;

  const q = new URLSearchParams(location.search);
  let paused = q.has('t');
  let at = q.has('t') ? parseFloat(q.get('t')) : 0;
  let t0 = performance.now() - at * 1000;
  window.__AD = {
    CYCLE,
    seek(t) { at = t; t0 = performance.now() - t * 1000; render(t); },
    pause() { paused = true; },
    play() { paused = false; t0 = performance.now() - at * 1000; },
  };
  const loop = () => {
    if (!paused) { at = (performance.now() - t0) / 1000; render(at); }
    requestAnimationFrame(loop);
  };
  render(at);
  requestAnimationFrame(loop);
}
boot();
