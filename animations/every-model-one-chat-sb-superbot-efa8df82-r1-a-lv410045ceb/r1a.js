// r1-a cut of "every model, one chat": three asks, each routed to the app that makes that thing.
// Everything on screen is a pure function of t (window.__AD.seek), so the frame renderer is exact at 60 fps.
(() => {
const CYCLE = 419 / 60; // 6.983 s, 419 frames
const FPS = 60;
const DW = 552; // a narrow superbot window: the real ask layout at a 504px column, zoomed ~3.5x by the camera
const FW = 1920, FH = 1080;
const K = 3.4; // thread zoom: 12.5px chat text -> 42.5px on screen
const VMAX = 2300; // camera speed cap, screen px per second (~38 px/frame)
const LEAD = 0.18; // the camera opens the space a beat before the piece lands, like a real feed

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const inOutSine = (x) => 0.5 - Math.cos(Math.PI * x) / 2;
const outBack = (x) => { const c = 1.45; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));

const TILE = { gemini: 'brand/gemini-logo.svg', openai: 'brand/openai-logo.svg', doordash: 'brand/doordash-logo.svg' };
const UPV = '<svg viewBox="0 0 24 24"><path d="M12 4 4.5 12.5H9V20h6v-7.5h4.5Z"/></svg>';
const DNV = '<svg viewBox="0 0 24 24"><path d="M12 20l7.5-8.5H15V4H9v7.5H4.5Z"/></svg>';
const CMT = '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10.5H10l-6 4.5Z"/></svg>';
const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const PIN = '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/></svg>';

// the source spot's six subreddits and post counts (sum 2,418)
const SUBS = [['r/memes', 812], ['r/dankmemes', 544], ['r/me_irl', 391], ['r/ProgrammerHumor', 327], ['r/socialnetwork', 198], ['r/MemeTemplates', 146]];
const POSTS_TOTAL = SUBS.reduce((s, [, n]) => s + n, 0);

const user = (id, text) => `<div class="msg qc-u" id="${id}"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${text}</div></div></div>`;
const sw = (id, app, name) => `<div class="msg qc-m" id="${id}"><span class="avatar sb"><img src="scenes/tabs-assets/tile.svg" alt=""></span><div class="m-main"><span class="qc-sw"><span class="qc-tile qc-t-${app}"><img src="${TILE[app]}" alt=""></span><span class="qc-swl">Switching to ${name}</span><span class="qc-st"><i class="qc-spin"></i><svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></span></div></div>`;
const who = (app, name) => `<div class="qc-who"><span class="qc-tile qc-t-${app}"><img src="${TILE[app]}" alt=""></span><b>${name}</b><small>in superbot</small></div>`;
const say = (id, text) => `<div class="qc-say" id="${id}" data-text="${text}"><span class="qc-vis"></span><span class="qc-hid">${text}</span></div>`;
const tool = (run, done, count) => `<div class="dd-chiprow"><div class="ch-tool" data-run="${run}" data-done="${done}"><span class="spin"></span><span class="ch-tool-t">${run}</span>${count ? '<b class="yt-count">0 posts</b>' : ''}</div></div>`;
const post = (img, title, sub, ups, comments) => `<div class="r1a-post"><div class="th"><img src="img/${img}" alt=""></div><div class="bd"><b>${title}</b><div class="mt"><img src="brand/reddit-logo.svg" alt="">${sub}</div><div class="vt"><span>${UPV}<span data-up="${ups}">0</span>${DNV}</span><span>${CMT}${comments}</span></div></div></div>`;
const subs = `<div class="sc-subs">${SUBS.map(([s]) => `<span class="sc-sub"><img src="brand/reddit-logo.svg" alt="">${s}<b>0</b></span>`).join('')}</div>`;

// map strip: street grid; the Dasher drives the dotted leg to the store, the red route runs on to the door
const MAP = `<svg viewBox="0 0 572 102" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="572" height="102" fill="#17181b"/>
  <path d="M182 0h88v36h-88z" fill="#18241d"/><path d="M380 62h84v26h-84z" fill="#18241d"/><path d="M0 0h50v14H0z" fill="#14202b"/>
  <g stroke="#24262a" stroke-width="9" fill="none"><path d="M0 20h572M0 56h572M0 92h572"/><path d="M60 0v102M150 0v102M276 0v102M366 0v102M470 0v102M540 0v102"/></g>
  <g stroke="#1d1f23" stroke-width="3" fill="none"><path d="M0 38h572M0 74h572M105 0v102M213 0v102M322 0v102M420 0v102M505 0v102"/></g>
  <path id="r1a-leg1" d="M14 92H60V56H150" fill="none" stroke="#e5e5ea" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7"/>
  <path id="r1a-route" d="M150 56H276V92H470V56H505" fill="none" stroke="#ff3008" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(150 56)"><g class="r1a-pin"><circle r="10.5" fill="#e8451e" stroke="#17181b" stroke-width="3"/><path d="M-5.5 2.2h11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2zM-5.5-.2a5.5 4.4 0 0 1 11 0z" fill="#ffd27a"/></g></g>
  <g transform="translate(505 56)"><g class="r1a-pin"><circle r="10.5" fill="#fff" stroke="#17181b" stroke-width="3"/><path d="M-5 1 0-4 5 1V5H-5Z" fill="#111"/></g></g>
  <g id="r1a-dasher"><circle r="13" fill="#ff3008" opacity=".22" class="pulse"/><circle r="7.5" fill="#ff3008" stroke="#fff" stroke-width="2.5"/></g>
</svg>`;
const BURGER = `<svg viewBox="0 0 34 34"><rect width="34" height="34" fill="#2a1a12"/><path d="M6 15a11 8 0 0 1 22 0z" fill="#e3a45a"/><circle cx="12" cy="11" r=".9" fill="#fff3d6"/><circle cx="17" cy="9.4" r=".9" fill="#fff3d6"/><circle cx="22" cy="11.2" r=".9" fill="#fff3d6"/>
  <path d="M5 16.5h24l-2.4 2.4H7.4z" fill="#f2c94c"/><rect x="5.5" y="18.6" width="23" height="3.4" rx="1.7" fill="#6b2d14"/><path d="M5.5 22.6h23v.4c-3 1.8-20 1.8-23 0z" fill="#4caf50"/><rect x="5.5" y="23.6" width="23" height="3.2" rx="1.6" fill="#6b2d14"/>
  <path d="M6.5 27.4h21a2 2 0 0 1-2 2.6h-17a2 2 0 0 1-2-2.6z" fill="#d9944d"/></svg>`;

// item $11.49 + delivery $0 (DashPass) + service $1.72 + tax $0.99 (8.625%) + tip $4.00 = $18.20
const DD = `<div class="dd-card">
  <div class="dd-head"><img class="dd-logo" src="brand/doordash-logo.svg" alt="DoorDash"><b>DoorDash order</b><span class="dd-tag">1 item</span></div>
  <div class="dd-photo r1a-map">${MAP}<span class="dd-place"><b>Main Street Burger Co.</b><i>${STAR}4.8</i><em>0.8 mi</em></span></div>
  <div class="dd-item"><span class="dd-thumb r1a-thumb">${BURGER}</span><span class="dd-meta"><b>Double Smash Burger</b><small>American cheese, pickles, smash sauce</small></span><span class="dd-qty">1x</span><span class="dd-price">$11.49</span></div>
  <div class="dd-fees">
    <div><span>Delivery fee · DashPass</span><span>$0.00</span></div>
    <div><span>Service fee</span><span>$1.72</span></div>
    <div><span>Estimated tax</span><span>$0.99</span></div>
    <div><span>Dasher tip</span><span>$4.00</span></div>
    <div class="dd-total"><span>Total</span><span>$18.20</span></div>
  </div>
  <div class="dd-addr"><span class="dd-pin">${PIN}</span><span class="dd-where"><b>Deliver to 1480 Market St, Apt 5</b><small>Visa ending 4242</small></span><span class="dd-eta"><span class="dd-eta-a">${CLOCK}24 min</span></span></div>
  <div class="dd-btn"><span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span><span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Ordered!</span></span><i class="dd-shine" aria-hidden="true"></i></div>
  <div class="dd-etaline">${CLOCK}<span>Arriving in <b>24 min</b> · your Dasher is on the way</span></div>
</div>`;

const MSGS = [
  user('u1', 'make me a muse meme'),
  sw('s1', 'gemini', 'Nano Banana Pro'),
  `<div class="msg qc-m qc-r" id="r1"><span class="avatar sb"><img src="scenes/tabs-assets/tile.svg" alt=""></span><div class="m-main">${who('gemini', 'Nano Banana Pro')}${say('say1', 'Here’s your Muse meme.')}<div class="qc-img r1a-meme"><img src="img/muse-meme-r1a.png" width="1600" height="900" alt="Muse meme"><i class="qc-gen"></i></div></div></div>`,
  user('u2', 'Scrape reddit and look for more'),
  sw('s2', 'openai', 'ChatGPT agent'),
  `<div class="msg qc-m qc-r" id="r2"><span class="avatar sb"><img src="scenes/tabs-assets/tile.svg" alt=""></span><div class="m-main">${who('openai', 'ChatGPT agent')}${say('say2a', 'On it. Scraping 6 subreddits for Muse memes.')}${tool('Scraping Reddit', 'Scraped Reddit', true)}${subs}${tool('Ranking the Muse memes', 'Ranked 5 new Muse memes')}${say('say2b', 'Top 3 of 5 this week:')}<div class="r1a-rd">${post('rd-1.png', 'me vs Muse at 3 AM', 'r/memes · u/owl_jen', 24100, 812)}${post('rd-2.png', 'Muse doesn’t do sleep', 'r/dankmemes · u/gabe', 18600, 431)}${post('rd-3.png', 'Muse never logs off', 'r/me_irl · u/tired_dev', 9800, 266)}</div></div></div>`,
  user('u3', 'Winning, order me a burger.'),
  sw('s3', 'doordash', 'DoorDash'),
  `<div class="msg qc-m qc-r" id="r3"><span class="avatar sb"><img src="scenes/tabs-assets/tile.svg" alt=""></span><div class="m-main">${who('doordash', 'DoorDash')}${say('say3', 'Well earned. Getting you a celebration burger.')}${tool('Opening DoorDash', 'Opened DoorDash')}${tool('Picking the best-rated burger near you', 'Picked Main Street Burger Co.')}${tool('Checking out with your saved card', 'Checked out with your saved card')}${DD}</div></div>`,
].join('');

// beat clock (seconds). Beat 1 is finished before frame 0, so frame 0 is a complete still.
const B = {
  s1: -0.8, s1done: -0.4, sheen: [0.06, 0.56], hookOut: 0.56,
  u2: 0.8, s2: 0.9, s2done: 1.2, r2: 1.3, say2a: 1.32, toolA: 1.42, subs: 1.5, subStep: 0.04, toolB: 2.04, toolBdone: 2.22, say2b: 2.24, posts: [2.3, 2.36, 2.42],
  u3: 3.2, s3: 3.3, s3done: 3.62, r3: 3.7, say3: 3.72, chips: [3.8, 3.87, 3.94], chipsDone: [3.9, 4.0], card: 4.0, rowStep: 0.06, placed: 4.65, eta: 4.8,
  uiOut: [5.36, 5.48], endIn: 5.48,
};
B.subsDone = B.subs + 5 * B.subStep + 0.3;
B.toolAdone = B.subsDone + 0.02;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let site, comp, compTop0 = 0, STRIP = 30, track = [], kTrack = [], hubH = 0, routeLen = 0, leg1Len = 0, k0 = K;
const rects = {};

function relRect(el) {
  const base = site.getBoundingClientRect(), b = el.getBoundingClientRect();
  return { top: b.top - base.top, bottom: b.bottom - base.top, left: b.left - base.left, right: b.right - base.left };
}

// lay out with every counter and label at its widest, so nothing reflows (and slides under the composer) later
function finalText() {
  $$('#r2 .sc-sub').forEach((p, i) => { p.classList.add('on'); $('b', p).textContent = fmt(SUBS[i][1]); });
  $('#r2 .yt-count').textContent = `${fmt(POSTS_TOTAL)} posts`;
  $$('.ch-tool').forEach((c) => { $('.ch-tool-t', c).textContent = c.dataset.run.length > c.dataset.done.length ? c.dataset.run : c.dataset.done; });
  $$('[data-up]').forEach((u) => { u.textContent = fmtK(+u.dataset.up); });
  $('#r3 .dd-lab-a').textContent = 'Placing order...';
}

// when each piece lands, and how far down the thread it reaches: the camera keeps the newest piece above the composer
function reveals() {
  const b = (el) => relRect(typeof el === 'string' ? $(el) : el).bottom;
  const rows = $$('#r3 .dd-card > *');
  return [
    [-9, b('#r1')],
    [B.u2, b('#u2')], [B.s2, b('#s2')], [B.r2, b('#r2 .qc-who')], [B.say2a, b('#say2a')],
    [B.toolA, b($$('#r2 .dd-chiprow')[0])], [B.subs, b('#r2 .sc-subs')], [B.toolB, b($$('#r2 .dd-chiprow')[1])],
    [B.say2b, b('#say2b')], [B.posts[0], b('#r2 .r1a-rd')],
    [B.u3, b('#u3')], [B.s3, b('#s3')], [B.r3, b('#r3 .qc-who')], [B.say3, b('#say3')],
    ...B.chips.map((t, i) => [t, b($$('#r3 .dd-chiprow')[i])]),
    ...rows.map((el, i) => [i === rows.length - 1 ? B.eta : B.card + i * B.rowStep, b(el)]),
  ].sort((p, q) => p[0] - q[0]);
}

function zoomAt(t) {
  if (t < B.u2) return k0;
  return lerp(k0, K, inOutSine(seg(t, B.u2 - 0.02, B.u2 + 0.4)));
}

function buildTrack() {
  const ev = reveals();
  const bottomAt = (t) => { let y = ev[0][1]; for (const [te, by] of ev) if (te <= t) y = Math.max(y, by); return y; };
  const target = (t) => { const k = zoomAt(t); return bottomAt(t + LEAD) + 8 + STRIP - FH / k / 2; };
  const N = Math.round(CYCLE * FPS) + 1, SUB = 20, dt = 1 / (FPS * SUB), w = 9;
  let y = target(0), v = 0;
  const raw = [];
  for (let i = 0; i < N; i++) {
    raw.push(y);
    for (let s = 0; s < SUB; s++) {
      const t = (i + s / SUB) / FPS, k = zoomAt(t);
      const a = w * w * (target(t) - y) - 2 * w * v;
      v = clamp(v + a * dt, -VMAX / k, VMAX / k);
      y += v * dt;
    }
  }
  // a short gaussian pass so the speed cap never shows as a corner
  const sig = 3, R = 9, wts = [];
  for (let j = -R; j <= R; j++) wts.push(Math.exp(-(j * j) / (2 * sig * sig)));
  const ws = wts.reduce((p, q) => p + q, 0);
  track = raw.map((_, i) => wts.reduce((acc, wj, jj) => acc + wj * raw[clamp(i + jj - R, 0, N - 1)], 0) / ws);
  for (let i = 0; i < 12; i++) track[i] = lerp(raw[0], track[i], i / 12); // frame 0 is exact
  kTrack = Array.from({ length: N }, (_, i) => zoomAt(i / FPS));
}

// how long an element sits whole between the top of the view and the composer, from t0 on
function visibleSpan(el, t0) {
  const r = relRect(el);
  let start = -1, n = 0;
  for (let i = Math.max(0, Math.round(t0 * FPS)); i < track.length; i++) {
    const half = FH / kTrack[i] / 2, top = track[i] - half, floor = track[i] + half - STRIP;
    const inView = r.top >= top + 1 && r.bottom <= floor;
    if (inView) { if (start < 0) start = i; n++; } else if (start >= 0) break;
  }
  return { from: +(start / FPS).toFixed(2), secs: +(n / FPS).toFixed(2) };
}

function layout() {
  site.style.transform = 'none';
  site.style.width = DW + 'px';
  site.style.setProperty('--dw', DW + 'px');
  site.style.height = '4000px';
  finalText();
  const c0 = relRect(comp);
  hubH = Math.ceil(relRect($('#r3')).bottom + 10 + (4000 - c0.top) + 6);
  site.style.height = hubH + 'px';
  const c1 = relRect(comp);
  compTop0 = c1.top;
  STRIP = c1.bottom - c1.top + 8; // the whole composer, model picker included, stays in view
  for (const id of ['u1', 's1', 'r1', 'u2', 's2', 'r2', 'u3', 's3', 'r3']) rects[id] = relRect($('#' + id));
  k0 = Math.min(K, FH / (rects.r1.bottom - rects.u1.top + 8 + STRIP + 14)); // frame 0: ask, chip, answer, meme, composer
  routeLen = $('#r1a-route').getTotalLength();
  leg1Len = $('#r1a-leg1').getTotalLength();
  buildTrack();
  // frame-0 headline: top-aligned with the meme, just right of it
  const m = relRect($('#r1 .r1a-meme'));
  const hook = $('.r1a-hook');
  hook.style.top = `${(FH / 2 + k0 * (m.top - track[0])).toFixed(1)}px`;
  hook.style.left = `${(FW / 2 + k0 * (m.right - DW / 2) + 64).toFixed(1)}px`;
  rects.STRIP = STRIP;
  rects.vis = Object.fromEntries([['u2', B.u2], ['s2', B.s2], ['u3', B.u3], ['s3', B.s3]].map(([id, t]) => [id, visibleSpan($('#' + id), t)]));
  rects.btnInView = visibleSpan($('#r3 .dd-btn'), B.card).from;
  for (let pass = 0; pass < 3 && rects.btnInView + 0.08 > B.placed; pass++) {
    B.placed = +(rects.btnInView + 0.08).toFixed(3);
    B.eta = +(B.placed + 0.14).toFixed(3);
    buildTrack();
    rects.btnInView = visibleSpan($('#r3 .dd-btn'), B.card).from;
  }
  rects.gridInView = visibleSpan($('#r2 .r1a-rd'), B.posts[0]);
}

function camera(t) {
  const f = clamp(t * FPS, 0, track.length - 1), i = Math.floor(f), x = f - i, j = Math.min(i + 1, track.length - 1);
  const cy = lerp(track[i], track[j], x), k = lerp(kTrack[i], kTrack[j], x);
  site.style.transform = `translate(${FW / 2}px, ${FH / 2}px) scale(${k}) translate(${-DW / 2}px, ${-cy}px)`;
  comp.style.transform = `translateY(${(cy + FH / k / 2 - STRIP - compTop0).toFixed(3)}px)`; // composer pinned to the view bottom
}

function rise(el, t, t0, dur = 0.24, dy = 10) {
  const x = seg(t, t0, t0 + dur);
  el.style.opacity = x <= 0 ? 0 : outCubic(x).toFixed(4);
  el.style.transform = x >= 1 ? 'none' : `translateY(${(dy * (1 - outCubic(x))).toFixed(3)}px)`;
}

function bubble(el, t, t0) {
  const x = seg(t, t0, t0 + 0.26);
  el.style.opacity = x <= 0 ? 0 : clamp(x * 2.2).toFixed(4);
  el.style.transformOrigin = '100% 100%';
  el.style.transform = x >= 1 ? 'none' : `translateY(${(12 * (1 - outCubic(x))).toFixed(3)}px) scale(${lerp(0.94, 1, outBack(x)).toFixed(4)})`;
}

// the source's switch chip: the label stays "Switching to X"; only the spinner turns into the check
function switcher(el, t, t0, tDone) {
  rise(el, t, t0, 0.22, 8);
  const chip = $('.qc-sw', el), spin = $('.qc-spin', el), ok = $('.qc-ok', el), tile = $('.qc-tile', el);
  chip.classList.toggle('qc-done', t >= tDone);
  chip.style.setProperty('--sh', `${(100 - ((((t - t0) % 0.9) + 0.9) % 0.9) / 0.9 * 120).toFixed(2)}%`);
  const d = seg(t, tDone - 0.04, tDone + 0.1);
  spin.style.opacity = (1 - d).toFixed(3);
  spin.style.transform = `rotate(${((t - t0) * 760).toFixed(1)}deg) scale(${(1 - 0.5 * d).toFixed(3)})`;
  const c = seg(t, tDone, tDone + 0.26);
  ok.style.opacity = c > 0 ? clamp(c * 3).toFixed(3) : 0;
  ok.style.transform = `scale(${c > 0 ? outBack(c).toFixed(4) : 0})`;
  const p = seg(t, tDone, tDone + 0.3);
  tile.style.transform = p > 0 && p < 1 ? `scale(${(1 + 0.16 * Math.sin(p * Math.PI)).toFixed(4)})` : 'none';
}

function stream(el, t, t0, cps) {
  const text = el.dataset.text;
  const n = t < t0 ? 0 : Math.min(text.length, Math.floor((t - t0) * cps));
  rise(el, t, t0 - 0.02, 0.16, 4);
  $('.qc-vis', el).textContent = text.slice(0, n);
  $('.qc-hid', el).textContent = text.slice(n);
}

// a tool row: spins while running; the label flips to the past tense and goes green on the same frame
function toolRow(row, t, t0, tDone) {
  rise(row, t, t0, 0.22, 6);
  const chip = row.firstElementChild, sp = $('.spin', chip), lab = $('.ch-tool-t', chip);
  const done = t >= tDone;
  sp.classList.toggle('done', done);
  sp.style.transform = done ? 'none' : `rotate(${(Math.max(0, t - t0) * 450 % 360).toFixed(1)}deg)`;
  const want = done ? chip.dataset.done : chip.dataset.run;
  if (lab.textContent !== want) lab.textContent = want;
}

function scrape(t) {
  stream($('#say2a'), t, B.say2a, 110);
  const rows = $$('#r2 .dd-chiprow');
  toolRow(rows[0], t, B.toolA, B.toolAdone);
  toolRow(rows[1], t, B.toolB, B.toolBdone);
  const pills = $$('#r2 .sc-sub');
  $('#r2 .sc-subs').style.opacity = t >= B.subs - 0.03 ? 1 : 0;
  let total = 0;
  pills.forEach((p, i) => {
    const a = B.subs + i * B.subStep;
    p.classList.toggle('on', t >= a);
    p.style.opacity = t < a ? 0.35 : 1;
    p.style.transform = `scale(${t < a ? 1 : lerp(0.92, 1, outBack(seg(t, a, a + 0.2))).toFixed(4)})`;
    const n = SUBS[i][1] * outCubic(seg(t, a, a + 0.3));
    $('b', p).textContent = fmt(n);
    total += Math.round(n);
  });
  $('#r2 .yt-count').textContent = `${fmt(t >= B.toolAdone ? POSTS_TOTAL : total)} posts`;
  stream($('#say2b'), t, B.say2b, 90);
  $$('#r2 .r1a-post').forEach((el, i) => {
    rise(el, t, B.posts[i], 0.3, 16);
    const u = $('[data-up]', el);
    u.textContent = fmtK(+u.dataset.up * outCubic(seg(t, B.posts[i] + 0.05, B.posts[i] + 0.38)));
  });
}

function order(t) {
  stream($('#say3'), t, B.say3, 120);
  $$('#r3 .dd-chiprow').forEach((r, i) => toolRow(r, t, B.chips[i], i < 2 ? B.chipsDone[i] : B.placed));
  // the card builds row by row as the camera scrolls down it
  const card = $('#r3 .dd-card'), rows = $$('#r3 .dd-card > *');
  card.style.opacity = outCubic(seg(t, B.card, B.card + 0.2)).toFixed(4);
  const btn = $('#r3 .dd-btn');
  rows.forEach((el, i) => { if (i < rows.length - 1 && el !== btn) rise(el, t, B.card + i * B.rowStep, 0.26, 10); });
  rise(rows[rows.length - 1], t, B.eta, 0.3, 6);
  // map: route draws in, pins pop, the Dasher drives the leg to the store
  const m0 = B.card + B.rowStep;
  const route = $('#r1a-route'), leg = $('#r1a-leg1');
  route.style.strokeDasharray = `${routeLen}`;
  route.style.strokeDashoffset = `${(routeLen * (1 - outCubic(seg(t, m0 + 0.06, m0 + 0.56)))).toFixed(2)}`;
  const p = leg.getPointAtLength(leg1Len * inOutSine(seg(t, m0 + 0.1, CYCLE)) * 0.9);
  $('#r1a-dasher').setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
  const ph = (Math.max(0, t - m0) % 0.9) / 0.9, pulse = $('#r1a-dasher .pulse');
  pulse.setAttribute('r', (8 + ph * 10).toFixed(2));
  pulse.setAttribute('opacity', (0.35 * (1 - ph)).toFixed(3));
  $$('#r3 .r1a-pin').forEach((g, i) => { const x = seg(t, m0 + 0.08 + i * 0.3, m0 + 0.38 + i * 0.3); g.setAttribute('transform', `scale(${x > 0 ? outBack(x).toFixed(3) : 0})`); });
  // the order button: placing -> "Ordered!" with a dip, a shine and a drawn check (the source's timing)
  const P = B.placed, grpA = $('#r3 .dd-grp-a'), grpB = $('#r3 .dd-grp-b');
  $('#r3 .dd-lab-a').textContent = 'Placing order' + '.'.repeat(1 + (Math.floor(Math.max(0, t - B.card) * 4) % 3));
  const down = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
  const pop = outBack(seg(t, P + 0.08, P + 0.42));
  const bx = seg(t, B.card + rows.indexOf(btn) * B.rowStep, B.card + rows.indexOf(btn) * B.rowStep + 0.26);
  btn.style.opacity = bx <= 0 ? 0 : outCubic(bx).toFixed(4);
  btn.style.transform = `translateY(${(10 * (1 - outCubic(bx))).toFixed(3)}px) scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * seg(t, P + 0.1, P + 0.5))).toFixed(4)})`;
  const sh = seg(t, P + 0.02, P + 0.62), shine = $('#r3 .dd-shine');
  shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
  shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
  const ro = seg(t, P + 0.04, P + 0.3);
  grpA.style.opacity = (1 - outCubic(ro)).toFixed(3);
  grpA.style.transform = `translate(-50%, calc(-50% - ${(outCubic(ro) * 10).toFixed(2)}px))`;
  $('#r3 .dd-bag').style.transform = `rotate(${(-40 * ro).toFixed(1)}deg) scale(${(1 - 0.6 * ro).toFixed(3)})`;
  const gi = seg(t, P + 0.08, P + 0.32);
  grpB.style.opacity = outCubic(gi).toFixed(3);
  grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(gi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, pop).toFixed(4)})`;
  $('#r3 .dd-check-p').style.strokeDashoffset = (23 * (1 - outCubic(seg(t, P + 0.1, P + 0.36)))).toFixed(2);
  $('#r3 .dd-check').style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, P + 0.1, P + 0.34))).toFixed(3)})`;
  card.classList.toggle('is-placed', t >= P);
  const ep = seg(t, B.eta - 0.2, B.eta + 0.15), eta = $('#r3 .dd-eta');
  eta.style.setProperty('--lit', outCubic(ep).toFixed(3));
  eta.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * ep)).toFixed(4)})`;
}

function endCard(t) {
  $('#s-tabs').style.opacity = (1 - inOutSine(seg(t, B.uiOut[0], B.uiOut[1]))).toFixed(4);
  const end = $('#s-end');
  end.classList.toggle('on', t >= B.endIn);
  end.style.opacity = t >= B.endIn ? 1 : 0;
  const h1 = $('#s-end .words h1'), hx = outCubic(seg(t, B.endIn, B.endIn + 0.34));
  h1.style.opacity = hx.toFixed(4);
  h1.style.transform = `translateY(${(30 * (1 - hx)).toFixed(2)}px)`;
  const face = $('#s-end .face'), fx = seg(t, B.endIn + 0.08, B.endIn + 0.44);
  face.style.opacity = clamp(fx * 2.5).toFixed(3);
  face.style.transform = `scale(${fx > 0 ? (0.72 + 0.28 * outBack(fx)).toFixed(4) : 0.72})`;
  $('#s-end .mark-wrap').style.transform = `translateY(${(2 * Math.sin(((t - B.endIn) / 1.6) * Math.PI * 2)).toFixed(3)}px)`;
  rise($('#s-end .r1a-url'), t, B.endIn + 0.24, 0.32, 18);
}

function seek(tt) {
  const t = clamp(tt, 0, CYCLE - 1e-6);
  camera(t);
  // beat 1: finished at frame 0; a generation sheen crosses the meme, then the headline clears
  for (const id of ['#u1', '#r1']) { $(id).style.opacity = 1; $(id).style.transform = 'none'; }
  switcher($('#s1'), t, B.s1, B.s1done);
  stream($('#say1'), t, -5, 100);
  const g = seg(t, B.sheen[0], B.sheen[1]), gen = $('#r1 .qc-gen');
  gen.style.transform = `translateX(${lerp(-110, 110, inOutSine(g)).toFixed(2)}%)`;
  gen.style.opacity = g > 0 && g < 1 ? 0.7 : 0;
  const hk = inOutSine(seg(t, B.hookOut, B.hookOut + 0.22)), hook = $('.r1a-hook');
  hook.style.opacity = (1 - hk).toFixed(4);
  hook.style.transform = `translateY(${(-24 * hk).toFixed(2)}px)`;
  // beat 2: ChatGPT agent scrapes reddit
  bubble($('#u2'), t, B.u2);
  switcher($('#s2'), t, B.s2, B.s2done);
  rise($('#r2'), t, B.r2, 0.2, 6);
  scrape(t);
  // beat 3: DoorDash places the order
  bubble($('#u3'), t, B.u3);
  switcher($('#s3'), t, B.s3, B.s3done);
  rise($('#r3'), t, B.r3, 0.2, 6);
  order(t);
  // composer: the model picker follows the routing
  const cur = t < B.s2done ? ['gemini', 'Nano Banana Pro'] : t < B.s3done ? ['openai', 'ChatGPT agent'] : ['doordash', 'DoorDash'];
  const plat = $('.rc-plat', site), img = $('.qc-pi img', plat);
  if (img.getAttribute('src') !== TILE[cur[0]]) img.setAttribute('src', TILE[cur[0]]);
  const name = plat.querySelector(':scope > span:not(.qc-pi)');
  if (name.textContent !== cur[1]) name.textContent = cur[1];
  endCard(t);
}

async function boot() {
  const stage = $('#stage');
  stage.style.width = FW + 'px';
  stage.style.transform = 'translate(-50%, -50%) scale(1)';
  site = $('#s-tabs .sbsite');
  comp = $('.composer', site);
  $('#s-tabs .feed-in').insertAdjacentHTML('beforeend', MSGS);
  $('#s-tabs .feed-in').style.transform = 'none';
  $('#s-tabs').insertAdjacentHTML('beforeend', '<div class="r1a-hook"><h2>EVERY MODEL.<br>ONE CHAT.</h2></div>');
  $('#s-end .words').insertAdjacentHTML('beforeend', '<div class="r1a-url"><b>superbot</b>.gg</div>');
  $('#s-tabs').classList.add('on');
  $('#s-tabs').style.opacity = 1;
  await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
  await document.fonts.ready;
  layout();
  seek(0);
  const q = new URLSearchParams(location.search);
  if (q.has('t')) seek(+q.get('t'));
  else if (!q.has('still')) {
    const t0 = performance.now();
    const loop = () => { seek(((performance.now() - t0) / 1000) % CYCLE); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  window.__AD = { ready: true, seek, CYCLE, FPS, B, rects, track, kTrack, hubH };
}

window.__AD = { ready: false };
boot().catch((err) => { console.error(err); document.title = 'ERR ' + err.message; throw err; });
})();
