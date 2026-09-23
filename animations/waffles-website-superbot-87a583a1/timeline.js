// waffles-website-superbot: the whole spot is a pure function of t.
//   0.0  ChatGPT home, the prompt types at a steady 60 chars/s and is sent 0.1s after the last key
//   ~2.9 ChatGPT answers with a code block and a list of chores
//   ~4.8 the "superbot can do it!" popup rises (the refusal spots' card), a cursor presses chat
//   ~8.6 the Superbot app: the ask in the chat, Superbot's reply streams, the preview builds
//  +4.0 the real site (site/index.html?ad=1) appears in the preview
//  +5.5 the camera pushes into the gradient Publish button, a cursor presses it: shine + check
//  then "Live in one click." and the end card with the live mascot (assets/sb-mark-live)
// ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there; arrows step, space pauses.

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outQuint = (x) => 1 - Math.pow(1 - x, 5);
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const op = (el, v) => { el.style.opacity = clamp(v).toFixed(3); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stageW = () => (window.AR && AR.w) || 1920;

// ---------- the script ----------
const PROMPT = 'Make me a website where people can rate waffle pics';
const TYPE0 = 0.8;
const CPS = 60;                   // a steady cadence, no jitter: 2 chars per 30fps frame, 1 per 60fps frame
const keyAt = [];                 // time each character lands
for (let i = 0; i < PROMPT.length; i++) keyAt.push(TYPE0 + i / CPS);
const TYPE1 = keyAt[keyAt.length - 1];
const SEND = TYPE1 + 0.1;         // the send lands 0.1s after the last character

const ANSWER = [                  // what ChatGPT gives you: code and chores
  { el: 'c-p1', kind: 'p', text: "Sure! Here's a simple starting point. Save this as `index.html`:", cps: 150 },
  { el: 'c-code', kind: 'code', cps: 230, text:
`<!DOCTYPE html>
<html>
<head>
  <title>Waffle Ratings</title>
  <style>
    .grid { display: grid; gap: 16px; }
    .stars span { cursor: pointer; }
  </style>
</head>
<body>
  <h1>Rate the Waffles</h1>
  <input type="file" id="upload">
  <div class="grid" id="gallery"></div>
  <script src="app.js"></script>
</body>
</html>` },
  { el: 'c-p2', kind: 'p', text: "Next, you'll need to:", cps: 150 },
  { el: 'c-list', kind: 'list', cps: 170, text: [
    'Write `app.js` to handle uploads and star ratings',
    'Set up a backend and a database to store them',
    'Buy a domain and deploy it to a host',
  ] },
  { el: 'c-p3', kind: 'p', text: 'Want me to walk you through the backend setup?', cps: 150 },
];
const T = { dots0: SEND + 0.35, ans0: SEND + 1.15 };
const lenOf = (a) => (a.kind === 'list' ? a.text.join('').length : a.text.length);
{ let k = T.ans0; for (const a of ANSWER) { a.t0 = k; a.t1 = k + lenOf(a) / a.cps; k = a.t1 + 0.12; } }
const ANS_END = ANSWER[ANSWER.length - 1].t1;

// the rescue popup, 1:1 the refusal spots' beats: it rises, the cursor lands 1.1s later, a 0.2s press
T.popup = ANS_END - 1.7;                 // 2s before the answer ends: the list is still streaming under it
T.curIn = T.popup - 0.1; T.curAt = T.popup + 0.9; T.pPress = T.popup + 1.1; T.pRelease = T.popup + 1.3;
T.dip1 = T.pRelease + 0.25; T.app = T.dip1 + 0.25;
// the Superbot app, relative to the cut
{
  const A = T.app;
  Object.assign(T, {
    ask: A + 0.3, tool: A + 0.75, r0: A + 1.3, ready: A + 4.0,
    scroll0: A + 4.5, scroll1: A + 5.3,
    z0: A + 5.45, z1: A + 6.65, c0: A + 6.2, c1: A + 6.95, press: A + 7.1,
    dip2: A + 8.3, line: A + 8.6, lineOut: A + 10.05, end: A + 10.3, word: A + 10.6,
  });
}
const CYCLE = +(T.end + 4.4).toFixed(2);

// Superbot's reply in the app chat, streamed while the preview builds
const REPLY = [
  { el: 'ch-p1', kind: 'p', text: 'On it! Waffle Rank is a site where anyone can rate waffle pics. It has:' },
  { el: 'ch-list', kind: 'list', text: [
    'Ten real waffle photos to start',
    'Ratings in syrup drops, 1 to 5',
    'Uploads for your own waffle pics',
    'A live syrup board of the top waffles',
  ] },
  { el: 'ch-p2', kind: 'p', text: "It's running in the preview. Hit Publish when you want it live." },
];
const RCPS = 100;
{ let k = T.r0; for (const a of REPLY) { a.t0 = k; a.t1 = k + lenOf(a) / RCPS; k = a.t1 + 0.1; } }

// ---------- a tiny highlighter (html / css / js) for ChatGPT's code block ----------
const TOK = /(<!--.*?(?:-->|$)|\/\*.*?(?:\*\/|$)|\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`[^`]*`?)|(<\/?[a-zA-Z][\w-]*|\/?>)|\b(function|var|let|const|return|if|else|for|while|new|true|false|null|this|typeof|document|window)\b|\b(\d+(?:\.\d+)?(?:px|rem|em|s|ms|%)?)\b|([a-z-]+)(?=\s*:\s*[^;{]*;)/g;
function hl(line) {
  let out = '', last = 0, m;
  TOK.lastIndex = 0;
  while ((m = TOK.exec(line))) {
    if (m[0] === '') { TOK.lastIndex++; continue; }
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'tag' : m[4] ? 'kw' : m[5] ? 'num' : 'prop';
    out += `<span class="hl-${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}
const inlineCode = (s) => esc(s).replace(/`([^`]*)`?/g, (_, c) => `<code>${c}</code>`);

// streams one paragraph / code block / list to a fraction f of its characters
function stream(a, el, f, caret = '') {
  if (a.kind === 'p') {
    el.innerHTML = inlineCode(a.text.slice(0, Math.round(a.text.length * f))) + caret;
  } else if (a.kind === 'code') {
    el.innerHTML = a.text.slice(0, Math.round(a.text.length * f)).split('\n').map(hl).join('\n');
  } else {
    let left = Math.round(a.text.join('').length * f), html = '';
    for (const item of a.text) {
      if (left <= 0) break;
      const done = left >= item.length;
      html += `<li>${inlineCode(item.slice(0, left))}${done ? '' : caret}</li>`;
      left -= item.length;
    }
    el.innerHTML = html;
  }
}

// ---------- scene 1: ChatGPT ----------
const chat = $('chat'), hello = $('c-hello'), dock = $('c-dock'), sugs = $('c-sugs');
const typed = $('c-typed'), caret = $('c-caret'), ph = $('c-ph'), field = typed.parentElement;
const thread = $('c-thread-in'), cUser = $('c-user'), cDots = $('c-dots'), cAi = $('c-ai'), codebox = $('c-codebox');
const popup = $('popup'), chatbtn = $('chatbtn'), pCursor = $('p-cursor');
const dockTop = () => 1080 - 104 - 64;

let lastTyped = -1;
function drawChat(t) {
  // the composer: typing, then the send clears it
  const n = t >= SEND ? 0 : keyAt.filter((k) => k <= t + 1e-6).length;
  if (n !== lastTyped) {
    typed.textContent = PROMPT.slice(0, n);
    field.style.justifyContent = typed.offsetWidth + 6 > field.clientWidth ? 'flex-end' : '';
    lastTyped = n;
  }
  op(ph, n === 0 ? 1 : 0);
  ph.style.visibility = n === 0 ? 'visible' : 'hidden';
  const typing = t >= TYPE0 - 0.05 && t < SEND;
  caret.style.visibility = (t < SEND && (typing || Math.floor(t * 1.8) % 2 === 0)) || (t >= SEND && t < T.popup && Math.floor(t * 1.8) % 2 === 0) ? 'visible' : 'hidden';
  ph.style.left = n === 0 ? '6px' : '0';

  // the send: the home state lifts away, the composer docks to the bottom
  const s = seg(t, SEND, SEND + 0.45), se = outCubic(s);
  op(hello, 1 - seg(t, SEND, SEND + 0.2));
  op(sugs, 1 - seg(t, SEND, SEND + 0.15));
  dock.style.top = lerp(404, dockTop(), se).toFixed(1) + 'px';
  // the composer steps back a little while the popup is up
  op(dock, 1 - 0.35 * seg(t, T.popup, T.popup + 0.6));

  // the thread
  const u = seg(t, SEND + 0.1, SEND + 0.4);
  op(cUser, u); cUser.style.transform = `translateY(${((1 - outCubic(u)) * 18).toFixed(1)}px)`;
  const dotsOn = t >= T.dots0 && t < T.ans0;
  cDots.style.display = dotsOn ? 'flex' : 'none';
  if (dotsOn) { const pz = 0.8 + 0.2 * Math.sin((t - T.dots0) * 7); cDots.firstElementChild.style.transform = `scale(${pz.toFixed(3)})`; }
  cAi.style.display = t >= T.ans0 ? 'block' : 'none';
  for (const a of ANSWER) {
    const el = $(a.el);
    stream(a, el, seg(t, a.t0, a.t1));
    if (a.kind === 'code') codebox.style.display = t >= a.t0 ? 'block' : 'none';
    else el.style.display = t >= a.t0 ? 'block' : 'none';
  }
  // keep the newest line in view, like the real page does while it streams
  const room = dockTop() - 40 - 120;
  const over = Math.max(0, thread.offsetHeight - room);
  thread.style.transform = `translate(-50%, ${(-over).toFixed(1)}px)`;

  drawPopup(t);
}

// ---------- the rescue popup (1:1 the refusal spots: rise 40px over 0.4s, the 5% press, fall out) ----------
let BTN = null, btnKey = '';
function measureBtn() {
  const key = `${innerWidth}x${innerHeight}|${window.AR && AR.key}`;
  if (BTN && key === btnKey) return BTN;
  const prev = popup.style.transform; popup.style.transform = 'none';
  const sr = stage.getBoundingClientRect(), k = sr.width / stageW();
  const b = chatbtn.getBoundingClientRect();
  popup.style.transform = prev;
  if (!b.width) return null;
  BTN = { x: (b.left + b.width / 2 - sr.left) / k, y: (b.top + b.height / 2 - sr.top) / k };
  btnKey = key;
  return BTN;
}
function drawPopup(t) {
  const pp = seg(t, T.popup, T.popup + 0.4), po = seg(t, T.pRelease + 0.05, T.pRelease + 0.35);
  op(popup, po > 0 ? 1 - po : pp);
  popup.style.transform = `translateY(${(po > 0 ? po * po * 40 : (1 - outQuint(pp)) * 40).toFixed(1)}px)`;
  const press = t >= T.pPress && t < T.pRelease ? 1 : t >= T.pRelease ? 1 - seg(t, T.pRelease, T.pRelease + 0.18) : 0;
  chatbtn.style.transform = `scale(${(1 - 0.05 * press).toFixed(3)})`;
  // the cursor: in from the bottom-right corner to the chat button, then the press
  const B = t >= T.curIn && t < T.dip1 ? measureBtn() : null;
  if (!B) { op(pCursor, 0); return; }
  const p = outQuint(seg(t, T.curIn, T.curAt));
  const x = lerp(stageW() + 40, B.x - 3, p), y = lerp(1120, B.y - 2, p);
  const sc = t >= T.pPress && t < T.pRelease ? 0.9 : 1;
  op(pCursor, 1);
  pCursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc})`;
}

// ---------- scene 2: Superbot builds it ----------
const app = $('app'), cam = $('cam'), pubBtn = $('pub-btn');
const pubRocket = $('pub-rocket'), pubCheck = $('pub-check'), pubCheckP = $('pub-check-p'), pubShine = $('pub-shine');
const chFeed = $('ch-feed'), chFeedIn = $('ch-feed-in'), chUser = $('ch-user'), chBot = $('ch-bot');
const chTool = $('ch-tool'), chSpin = $('ch-spin'), chToolT = $('ch-tool-t');
const pvSkel = $('pv-skel'), pvFrame = $('pv-frame'), pvState = $('pv-state');
const siteFrame = $('site'), cursor = $('cursor'), rowDot = $('row-dot');
const CARET = '<i class="ch-caret"></i>';

let lastChat = '';
function drawAppChat(t) {
  // the ask lands as the grey pill, then the tool row, then the reply streams
  const au = seg(t, T.ask, T.ask + 0.25);
  op(chUser, au); chUser.style.transform = `translateY(${((1 - outCubic(au)) * 6).toFixed(1)}px)`;
  const bu = seg(t, T.tool, T.tool + 0.25);
  op(chBot, bu); chBot.style.transform = `translateY(${((1 - outCubic(bu)) * 6).toFixed(1)}px)`;
  const done = t >= T.ready;
  const cur = REPLY.findIndex((a) => t >= a.t0 && t < a.t1);
  const key = `${done}|${REPLY.map((a) => Math.round(seg(t, a.t0, a.t1) * lenOf(a))).join(',')}|${cur}|${Math.floor(t * 2.2) % 2}`;
  if (key !== lastChat) {
    lastChat = key;
    chSpin.classList.toggle('done', done);
    chToolT.textContent = done ? 'Built Waffle Rank' : 'Building Waffle Rank';
    const last = REPLY[REPLY.length - 1];
    REPLY.forEach((a, i) => {
      const el = $(a.el);
      el.style.display = t >= a.t0 ? '' : 'none';
      // the caret rides the streaming line, and blinks at the end until the site is up
      const showCaret = i === cur || (a === last && t >= a.t1 && !done && Math.floor(t * 2.2) % 2 === 0);
      stream(a, el, seg(t, a.t0, a.t1), showCaret ? CARET : '');
    });
    // keep the newest line in view, like the hub thread does
    const over = Math.max(0, chFeedIn.offsetHeight - chFeed.clientHeight);
    chFeedIn.style.transform = `translateY(${(-over).toFixed(1)}px)`;
  }
  // the spinner turns
  if (!done) chSpin.style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
  else chSpin.style.transform = '';
}

// where the Publish button sits in the un-zoomed stage (stage px), cached per layout
let pubAt = null, pubKey = '';
function measurePub() {
  const key = `${innerWidth}x${innerHeight}|${window.AR && AR.key}`;
  if (pubAt && key === pubKey) return pubAt;
  const prev = cam.style.transform; cam.style.transform = 'none';
  const sr = stage.getBoundingClientRect(), k = sr.width / stageW();
  const r = pubBtn.getBoundingClientRect();
  cam.style.transform = prev;
  if (!r.width) return null;
  pubAt = { x: (r.left - sr.left + r.width / 2) / k, y: (r.top - sr.top + r.height / 2) / k, w: r.width / k, h: r.height / k };
  pubKey = key;
  return pubAt;
}

let scrolled = -1;
function drawApp(t) {
  drawAppChat(t);
  const W = stageW();
  // the preview: the building skeleton shimmers, then about 4s after the cut the real site takes over
  rowDot.style.visibility = t >= T.ready ? 'visible' : 'hidden';
  pvSkel.style.setProperty('--sh', `${(100 - (((t - T.app) / 1.2) % 1) * 200).toFixed(1)}%`);
  const pv = seg(t, T.ready, T.ready + 0.4);
  op(pvFrame, pv); op(pvSkel, 1 - pv);
  pvState.textContent = t < T.ready ? 'Building' : 'Running';
  const sy = Math.round(lerp(0, 420, inOutCubic(seg(t, T.scroll0, T.scroll1))));
  if (sy !== scrolled) {
    try { siteFrame.contentWindow.scrollTo(0, sy); scrolled = sy; } catch (e) { scrolled = sy; }
  }

  // the camera: in from a slight push at the cut, then into the Publish button
  const P = measurePub();
  const inF = outCubic(seg(t, T.app, T.app + 0.6));
  const z0 = lerp(1.035, 1, inF);
  let tx = (1 - z0) * W / 2, ty = (1 - z0) * 540, z = z0;
  let zf = 0;
  if (P) {
    zf = inOutCubic(seg(t, T.z0, T.z1));
    const Z = Math.min(4.4, (0.42 * W) / P.w);
    z = lerp(z0, Z, zf);
    const sx = lerp(P.x, W / 2, zf), syy = lerp(P.y, 500, zf);
    tx = sx - P.x * z; ty = syy - P.y * z;
    if (zf === 0) { tx = (1 - z0) * W / 2; ty = (1 - z0) * 540; }
    // never show past the window's edges: the app fills the whole frame
    tx = clamp(tx, W - W * z, 0); ty = clamp(ty, 1080 - 1080 * z, 0);
  }
  cam.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(4)})`;

  // the press: a 5% dip, a light shine sweeps the pill, the rocket turns into a white check
  const down = seg(t, T.press - 0.06, T.press + 0.04) * (1 - seg(t, T.press + 0.1, T.press + 0.24));
  pubBtn.style.transform = `scale(${(1 - 0.05 * down).toFixed(4)})`;
  const sh = seg(t, T.press + 0.02, T.press + 0.62);
  op(pubShine, sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0);
  pubShine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
  const ro = seg(t, T.press + 0.04, T.press + 0.24);
  op(pubRocket, 1 - ro);
  pubRocket.style.transform = `translate(${(ro * 2.5).toFixed(2)}px, ${(-ro * 2.5).toFixed(2)}px) rotate(${(-40 * ro).toFixed(1)}deg) scale(${(1 - 0.6 * ro).toFixed(3)})`;
  const ck = seg(t, T.press + 0.14, T.press + 0.44);
  op(pubCheck, ck > 0 ? 1 : 0);
  pubCheckP.style.strokeDashoffset = (23 * (1 - outCubic(ck))).toFixed(2);
  pubCheck.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, T.press + 0.14, T.press + 0.4))).toFixed(3)})`;

  const cv = seg(t, T.c0, T.c0 + 0.2);
  op(cursor, cv * (1 - seg(t, T.dip2, T.dip2 + 0.1)));
  if (P && cv > 0) {
    const bx = P.x * z + tx, by = P.y * z + ty;            // the button on screen
    const aim = { x: bx + P.w * z * 0.1, y: by + P.h * z * 0.3 };   // low on the pill, the label stays readable
    const m = inOutCubic(seg(t, T.c0, T.c1));
    const fx = lerp(W * 0.86, aim.x, m) + Math.sin(m * Math.PI) * -40;
    const fy = lerp(1000, aim.y, m) + Math.sin(m * Math.PI) * 30;
    cursor.style.transform = `translate(${(fx - 17).toFixed(1)}px, ${(fy - 11).toFixed(1)}px) scale(${(1 - 0.12 * down).toFixed(3)})`;
  }
}

// ---------- scenes 3 + 4 ----------
const line = $('line'), lineP = $('line-p'), end = $('end'), endFace = $('end-face'), endSlide = $('end-slide');
if (window.sbMarkLive) {
  sbMarkLive(endFace, { size: 220 });
  sbMarkLive($('side-mark'), { size: 16 });
  sbMarkLive($('ch-mark'), { size: 16 });
  sbMarkLive($('p-mark'), { size: 34 });
}
function drawLine(t) {
  const a = seg(t, T.line + 0.05, T.line + 0.45), o = seg(t, T.lineOut, T.lineOut + 0.25);
  op(lineP, a * (1 - o));
  lineP.style.transform = `translateY(${((1 - outQuint(a)) * 18).toFixed(1)}px) scale(${lerp(0.97, 1, outQuint(a)).toFixed(3)})`;
}
function drawEnd(t) {
  const f = seg(t, T.end, T.end + 0.5), w = seg(t, T.word, T.word + 0.7);
  op(endFace, f); endFace.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(3)})`;
  // wide frames: the words slide out from behind the face; stacked (1:1, 4:5): they rise into place under it
  const ar = document.documentElement.dataset.ar;
  const stacked = ar === '1x1' || ar === '4x5';
  endSlide.style.transform = stacked
    ? `translateY(${((1 - outQuint(w)) * 45).toFixed(1)}%)`
    : `translateX(${((1 - outQuint(w)) * -110).toFixed(1)}%)`;
  op(endSlide, w);
}

// ---------- the frame ----------
const dip = $('dip');
function show(el, on) { el.classList.toggle('on', on); el.style.opacity = on ? '1' : '0'; }
function render(t) {
  show(chat, t < T.app);
  show(app, t >= T.app && t < T.line);
  show(line, t >= T.line && t < T.end);
  show(end, t >= T.end);
  if (t < T.app) drawChat(t);
  else { op(popup, 0); op(pCursor, 0); }
  if (t >= T.app - 0.01 && t < T.line) drawApp(t);
  if (t >= T.line && t < T.end) drawLine(t);
  if (t >= T.end) drawEnd(t);
  // dips: into the app, into the line, and out at the loop
  const d = Math.max(
    seg(t, T.dip1, T.app) * (1 - seg(t, T.app, T.app + 0.3)),
    seg(t, T.dip2, T.line) * (t < T.line ? 1 : 0),
    seg(t, CYCLE - 0.35, CYCLE),
    1 - seg(t, 0, 0.3),
  );
  op(dip, d);
}

// ---------- fit the stage to the viewport ----------
function fit() {
  const W = stageW(), H = 1080;
  const k = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  pubAt = null; BTN = null;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => { fit(); lastTyped = -1; lastChat = ''; });

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
function frame() {
  let t = clockNow();
  if (!freeze) t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
siteFrame.addEventListener('load', () => { scrolled = -1; });
